const recipesService = require("../services/recipes.service");
const { toRecipeDTO } = require("../utils/serializers");
const { resolveRecipeAccess } = require("../utils/recipeAccess");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const list = asyncHandler(async (req, res) => {
  const { q, tags, time, favorite } = req.query;
  const tagList = tags ? (Array.isArray(tags) ? tags : String(tags).split(",")).filter(Boolean) : [];
  const recipes = await recipesService.listMine(req.user.id, { q, tags: tagList, time, favorite });
  res.json(recipes.map(toRecipeDTO));
});

const getOne = asyncHandler(async (req, res) => {
  const recipe = await recipesService.getById(req.params.id);
  const { canView } = await resolveRecipeAccess(recipe, req.user.id);
  if (!canView) throw new AppError(404, "Recette introuvable.");
  res.json(toRecipeDTO(recipe));
});

const create = asyncHandler(async (req, res) => {
  const recipe = await recipesService.create(req.user.id, req.body);
  res.status(201).json(toRecipeDTO(recipe));
});

const update = asyncHandler(async (req, res) => {
  // cookbookId ne se change que via /cookbooks/:id/recipes/:recipeId (permissions dédiées) —
  // jamais via ce PATCH générique, pour ne pas contourner les droits d'édition du cookbook.
  const { cookbookId, ...patch } = req.body;
  const recipe = await recipesService.update(req.params.id, req.user.id, patch);
  res.json(toRecipeDTO(recipe));
});

const remove = asyncHandler(async (req, res) => {
  await recipesService.remove(req.params.id, req.user.id);
  res.status(204).send();
});

const toggleFavorite = asyncHandler(async (req, res) => {
  const recipe = await recipesService.toggleFavorite(req.params.id, req.user.id);
  res.json(toRecipeDTO(recipe));
});

const suggestions = asyncHandler(async (req, res) => {
  const { ingredients, limit } = req.query;
  const ingredientList = ingredients
    ? (Array.isArray(ingredients) ? ingredients : String(ingredients).split(",")).map((s) => s.trim()).filter(Boolean)
    : [];
  const results = await recipesService.suggestForUser(req.user.id, { ingredients: ingredientList, limit });
  res.json(results.map(({ recipe, score, reasons }) => ({ ...toRecipeDTO(recipe), score, reasons })));
});

module.exports = { list, getOne, create, update, remove, toggleFavorite, suggestions };
