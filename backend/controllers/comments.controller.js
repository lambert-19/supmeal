const commentsService = require("../services/comments.service");
const recipesService = require("../services/recipes.service");
const { resolveRecipeAccess } = require("../utils/recipeAccess");
const { toCommentDTO } = require("../utils/serializers");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { emitNewComment, emitCommentDeleted } = require("../utils/socket");

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
  const dto = toCommentDTO(comment);
  emitNewComment(req.params.id, dto);
  res.status(201).json(dto);
});

const remove = asyncHandler(async (req, res) => {
  const { recipeId } = await commentsService.remove(req.params.commentId, req.user.id);
  emitCommentDeleted(recipeId, req.params.commentId);
  res.status(204).send();
});

module.exports = { list, create, remove };
