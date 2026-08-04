const commentsService = require("../services/comments.service");
const recipesService = require("../services/recipes.service");
const { resolveRecipeAccess } = require("../utils/recipeAccess");
const { toCommentDTO } = require("../utils/serializers");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const list = asyncHandler(async (req, res) => {
  const recipe = await recipesService.getById(req.params.id);
  const { canView } = await resolveRecipeAccess(recipe, req.user.id);
  if (!canView) throw new AppError(404, "Recette introuvable.");

  const comments = await commentsService.listByRecipe(req.params.id);
  res.json(comments.map(toCommentDTO));
});

const create = asyncHandler(async (req, res) => {
  const recipe = await recipesService.getById(req.params.id);
  const { canView, canPostComment } = await resolveRecipeAccess(recipe, req.user.id);
  if (!canView) throw new AppError(404, "Recette introuvable.");
  if (!canPostComment) throw new AppError(403, "Vous ne pouvez pas commenter cette recette.");

  const comment = await commentsService.create(req.params.id, req.user.id, req.body.text);
  res.status(201).json(toCommentDTO(comment));
});

const remove = asyncHandler(async (req, res) => {
  await commentsService.remove(req.params.commentId, req.user.id);
  res.status(204).send();
});

module.exports = { list, create, remove };
