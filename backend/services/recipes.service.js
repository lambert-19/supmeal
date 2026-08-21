const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");
const { deleteUploadedImages } = require("../utils/uploadFiles");
const { normalizeText } = require("../utils/textMatch");
const { DIETARY_REGIMES, CUISINES, ALLERGENS } = require("../utils/preferences");

const RECIPE_INCLUDE = { ingredients: true, steps: true, cookbook: { select: { id: true, name: true } } };

const TIME_BUCKETS = {
  15: (total) => total <= 15,
  30: (total) => total <= 30,
  60: (total) => total <= 60,
  "60+": (total) => total > 60,
};

// Recherche plein texte sur titre/tags/source via la colonne générée
// `Recipe.searchVector` (indexée en GIN, voir la migration
// add_recipe_search_vector) plutôt qu'un filtrage en mémoire sur toutes les
// recettes du propriétaire. `plainto_tsquery` capture les correspondances par
// mot/racine (accents inclus, config 'french') ; les ILIKE en complément
// couvrent les recherches par sous-chaîne partielle (ex. "tomat") qu'un
// tsquery ne détecte pas, et les noms d'ingrédients (table séparée, non
// couverte par la colonne générée).
async function findMatchingRecipeIds(ownerId, query) {
  const like = `%${query}%`;
  const rows = await prisma.$queryRaw`
    SELECT r.id
    FROM "Recipe" r
    WHERE r."ownerId" = ${ownerId}
      AND (
        r."searchVector" @@ plainto_tsquery('french', ${query})
        OR r."title" ILIKE ${like}
        OR r."source" ILIKE ${like}
        OR EXISTS (SELECT 1 FROM unnest(r."tags") AS tag WHERE tag ILIKE ${like})
        OR EXISTS (SELECT 1 FROM "Ingredient" i WHERE i."recipeId" = r.id AND i."name" ILIKE ${like})
      )
  `;
  return rows.map((row) => row.id);
}

async function listMine(ownerId, { q, tags, time, favorite }) {
  const where = { ownerId };
  if (favorite === "true") where.favorite = true;
  if (tags && tags.length > 0) where.tags = { hasEvery: tags };

  const normalizedQuery = q ? q.trim() : "";
  if (normalizedQuery) {
    const matchingIds = await findMatchingRecipeIds(ownerId, normalizedQuery);
    where.id = { in: matchingIds };
  }

  let recipes = await prisma.recipe.findMany({
    where,
    include: RECIPE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  if (time && TIME_BUCKETS[time]) {
    recipes = recipes.filter((r) => TIME_BUCKETS[time](r.prepTime + r.cookTime));
  }

  return recipes;
}

async function getById(id) {
  const recipe = await prisma.recipe.findUnique({ where: { id }, include: RECIPE_INCLUDE });
  if (!recipe) throw new AppError(404, "Recette introuvable.");
  return recipe;
}

async function create(ownerId, data) {
  return prisma.recipe.create({
    data: {
      ownerId,
      title: data.title,
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      servings: data.servings,
      tags: data.tags ?? [],
      images: data.images ?? [],
      source: data.source ?? "",
      ingredients: { create: data.ingredients.map((ing, index) => ({ ...ing, position: index })) },
      steps: { create: data.steps.map((step, index) => ({ ...step, position: index })) },
    },
    include: RECIPE_INCLUDE,
  });
}

async function update(id, ownerId, patch) {
  const recipe = await getById(id);
  if (recipe.ownerId !== ownerId) throw new AppError(403, "Vous n'êtes pas propriétaire de cette recette.");

  const updated = await prisma.$transaction(async (tx) => {
    if (patch.ingredients) {
      await tx.ingredient.deleteMany({ where: { recipeId: id } });
    }
    if (patch.steps) {
      await tx.step.deleteMany({ where: { recipeId: id } });
    }

    return tx.recipe.update({
      where: { id },
      data: {
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.prepTime !== undefined && { prepTime: patch.prepTime }),
        ...(patch.cookTime !== undefined && { cookTime: patch.cookTime }),
        ...(patch.servings !== undefined && { servings: patch.servings }),
        ...(patch.tags !== undefined && { tags: patch.tags }),
        ...(patch.images !== undefined && { images: patch.images }),
        ...(patch.source !== undefined && { source: patch.source }),
        ...(patch.cookbookId !== undefined && { cookbookId: patch.cookbookId }),
        ...(patch.ingredients && {
          ingredients: { create: patch.ingredients.map((ing, index) => ({ ...ing, position: index })) },
        }),
        ...(patch.steps && { steps: { create: patch.steps.map((step, index) => ({ ...step, position: index })) } }),
      },
      include: RECIPE_INCLUDE,
    });
  });

  // Images retirées de la recette (remplacées ou supprimées) : plus aucune
  // référence en base, on peut supprimer les fichiers correspondants du disque.
  if (patch.images !== undefined) {
    const removedImages = recipe.images.filter((img) => !patch.images.includes(img));
    deleteUploadedImages(removedImages);
  }

  return updated;
}

async function remove(id, ownerId) {
  const recipe = await getById(id);
  if (recipe.ownerId !== ownerId) throw new AppError(403, "Vous n'êtes pas propriétaire de cette recette.");
  await prisma.recipe.delete({ where: { id } });
  deleteUploadedImages(recipe.images);
}

async function toggleFavorite(id, ownerId) {
  const recipe = await getById(id);
  if (recipe.ownerId !== ownerId) throw new AppError(403, "Vous n'êtes pas propriétaire de cette recette.");
  return prisma.recipe.update({ where: { id }, data: { favorite: !recipe.favorite }, include: RECIPE_INCLUDE });
}

const RECENT_PLANNING_DAYS = 14;
const NOVELTY_BONUS = 2;
const RECENCY_PENALTY = -2;
const DIET_BONUS = 3;
const CUISINE_BONUS = 2;
const TAG_AFFINITY_CAP = 4;
const INGREDIENT_MATCH_WEIGHT = 5;

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Score + explique chaque recette candidate pour l'utilisateur (regime/allergies/cuisine du
// profil, nouveaute par rapport au planning, affinite de tags avec les favoris, et
// optionnellement les ingredients que l'utilisateur dit avoir sous la main). Les recettes
// contenant un allergene declare sont exclues plutot que penalisees : la securite passe avant
// le classement.
async function suggestForUser(ownerId, { ingredients = [], limit = 8 } = {}) {
  const [user, recipes, planningEntries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerId },
      select: { dietaryRegime: true, allergies: true, favoriteCuisine: true },
    }),
    prisma.recipe.findMany({ where: { ownerId }, include: RECIPE_INCLUDE, orderBy: { createdAt: "desc" } }),
    prisma.planningEntry.findMany({
      where: { ownerId, recipeId: { not: null } },
      select: { recipeId: true, date: true },
    }),
  ]);
  if (!user) throw new AppError(404, "Utilisateur introuvable.");

  const lastPlannedAt = new Map();
  for (const entry of planningEntries) {
    const current = lastPlannedAt.get(entry.recipeId);
    if (!current || entry.date > current) lastPlannedAt.set(entry.recipeId, entry.date);
  }
  const recentThreshold = isoDaysAgo(RECENT_PLANNING_DAYS);

  const favoriteTagFreq = new Map();
  for (const recipe of recipes) {
    if (!recipe.favorite) continue;
    for (const tag of recipe.tags) {
      favoriteTagFreq.set(tag, (favoriteTagFreq.get(tag) ?? 0) + 1);
    }
  }

  const dietLabel = DIETARY_REGIMES[user.dietaryRegime];
  const cuisineLabel = CUISINES[user.favoriteCuisine];
  const allergenLabels = user.allergies.map((a) => normalizeText(ALLERGENS[a] ?? a)).filter(Boolean);
  const requestedIngredients = ingredients.map(normalizeText).filter(Boolean);

  const candidates = [];
  for (const recipe of recipes) {
    if (recipe.favorite) continue; // deja identifiees par l'utilisateur, pas une "decouverte"

    const ingredientNames = recipe.ingredients.map((i) => i.name);
    const tagsAndTitle = normalizeText([recipe.title, ...recipe.tags].join(" "));
    const fullHaystack = normalizeText([recipe.title, ...recipe.tags, ...ingredientNames].join(" "));

    if (allergenLabels.some((allergen) => fullHaystack.includes(allergen))) continue;

    let score = 0;
    const reasons = [];

    if (dietLabel && user.dietaryRegime !== "none" && tagsAndTitle.includes(normalizeText(dietLabel))) {
      score += DIET_BONUS;
      reasons.push(`Correspond à votre régime (${dietLabel})`);
    }

    if (cuisineLabel && user.favoriteCuisine !== "none" && tagsAndTitle.includes(normalizeText(cuisineLabel))) {
      score += CUISINE_BONUS;
      reasons.push(`Cuisine que vous aimez (${cuisineLabel})`);
    }

    const lastPlanned = lastPlannedAt.get(recipe.id);
    if (!lastPlanned) {
      score += NOVELTY_BONUS;
      reasons.push("Vous ne l'avez jamais planifiée");
    } else if (lastPlanned >= recentThreshold) {
      score += RECENCY_PENALTY;
    }

    const tagAffinity = recipe.tags.reduce((sum, tag) => sum + (favoriteTagFreq.get(tag) ?? 0), 0);
    if (tagAffinity > 0) {
      score += Math.min(tagAffinity, TAG_AFFINITY_CAP);
      reasons.push("Proche de vos recettes favorites");
    }

    if (requestedIngredients.length > 0 && ingredientNames.length > 0) {
      const normalizedIngredients = ingredientNames.map(normalizeText);
      const matchedCount = normalizedIngredients.filter((name) =>
        requestedIngredients.some((req) => name.includes(req) || req.includes(name))
      ).length;
      if (matchedCount > 0) {
        score += Math.round((matchedCount / ingredientNames.length) * INGREDIENT_MATCH_WEIGHT);
        reasons.push(
          matchedCount === 1
            ? "Utilise 1 de vos ingrédients disponibles"
            : `Utilise ${matchedCount} de vos ingrédients disponibles`
        );
      }
    }

    candidates.push({ recipe, score, reasons });
  }

  candidates.sort((a, b) => b.score - a.score);
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
  return candidates.slice(0, safeLimit);
}

module.exports = { listMine, getById, create, update, remove, toggleFavorite, suggestForUser, RECIPE_INCLUDE };
