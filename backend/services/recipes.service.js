const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");
const { deleteUploadedImages } = require("../utils/uploadFiles");

const RECIPE_INCLUDE = { ingredients: true, steps: true, cookbook: { select: { id: true, name: true } } };

const TIME_BUCKETS = {
  15: (total) => total <= 15,
  30: (total) => total <= 30,
  60: (total) => total <= 60,
  "60+": (total) => total > 60,
};

function matchesQuery(recipe, query) {
  const haystack = [recipe.title, recipe.source, ...recipe.tags, ...recipe.ingredients.map((i) => i.name)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

async function listMine(ownerId, { q, tags, time, favorite }) {
  const where = { ownerId };
  if (favorite === "true") where.favorite = true;
  if (tags && tags.length > 0) where.tags = { hasEvery: tags };

  let recipes = await prisma.recipe.findMany({
    where,
    include: RECIPE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  const normalizedQuery = q ? q.trim().toLowerCase() : "";
  if (normalizedQuery) {
    recipes = recipes.filter((r) => matchesQuery(r, normalizedQuery));
  }
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

module.exports = { listMine, getById, create, update, remove, toggleFavorite, RECIPE_INCLUDE };
