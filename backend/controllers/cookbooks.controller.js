const prisma = require("../utils/prisma");
const cookbooksService = require("../services/cookbooks.service");
const recipesService = require("../services/recipes.service");
const { toRecipeDTO, toCookbookDTO, toCookbookMemberDTO } = require("../utils/serializers");
const { canManageCookbook, canEditRecipes } = require("../utils/permissions");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// Un utilisateur sans rôle sur le cookbook ne doit jamais recevoir un 403 (qui
// révélerait que le cookbook existe) — toujours 404 dans ce cas, comme pour
// une ressource inexistante. 403 réservé aux membres avec un rôle insuffisant.
function requireRole(req) {
  if (!req.role) throw new AppError(404, "Cookbook introuvable.");
}

const list = asyncHandler(async (req, res) => {
  const currentUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true } });
  const cookbooks = await cookbooksService.listMine(currentUser);
  res.json(cookbooks.map(toCookbookDTO));
});

const create = asyncHandler(async (req, res) => {
  const cookbook = await cookbooksService.create(req.user.id, req.body);
  res.status(201).json(toCookbookDTO(cookbook));
});

const getOne = asyncHandler(async (req, res) => {
  requireRole(req);
  res.json({ ...toCookbookDTO(req.cookbook), role: req.role });
});

const update = asyncHandler(async (req, res) => {
  requireRole(req);
  if (!canManageCookbook(req.role)) throw new AppError(403, "Réservé au créateur du cookbook.");
  const cookbook = await cookbooksService.update(req.params.id, req.body);
  res.json(toCookbookDTO(cookbook));
});

const remove = asyncHandler(async (req, res) => {
  requireRole(req);
  if (!canManageCookbook(req.role)) throw new AppError(403, "Réservé au créateur du cookbook.");
  await cookbooksService.remove(req.params.id);
  res.status(204).send();
});

const listRecipes = asyncHandler(async (req, res) => {
  requireRole(req);
  const recipes = await cookbooksService.listRecipes(req.params.id);
  res.json(recipes.map(toRecipeDTO));
});

const attachRecipe = asyncHandler(async (req, res) => {
  requireRole(req);
  if (!canEditRecipes(req.role)) throw new AppError(403, "Réservé au créateur/éditeur du cookbook.");
  const recipe = await recipesService.getById(req.params.recipeId);
  if (recipe.ownerId !== req.user.id) throw new AppError(403, "Vous n'êtes pas propriétaire de cette recette.");
  const updated = await recipesService.update(req.params.recipeId, req.user.id, { cookbookId: req.params.id });
  res.json(toRecipeDTO(updated));
});

const detachRecipe = asyncHandler(async (req, res) => {
  requireRole(req);
  if (!canEditRecipes(req.role)) throw new AppError(403, "Réservé au créateur/éditeur du cookbook.");
  const recipe = await recipesService.getById(req.params.recipeId);
  if (recipe.cookbookId !== req.params.id) throw new AppError(404, "Recette introuvable dans ce cookbook.");
  const updated = await recipesService.update(req.params.recipeId, recipe.ownerId, { cookbookId: null });
  res.json(toRecipeDTO(updated));
});

const inviteMember = asyncHandler(async (req, res) => {
  requireRole(req);
  if (!canManageCookbook(req.role)) throw new AppError(403, "Réservé au créateur du cookbook.");
  const member = await cookbooksService.inviteMember(req.params.id, req.cookbook.name, req.body);
  res.status(201).json(toCookbookMemberDTO(member));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  requireRole(req);
  if (!canManageCookbook(req.role)) throw new AppError(403, "Réservé au créateur du cookbook.");
  const member = await cookbooksService.updateMemberRole(req.params.memberId, req.body.role);
  res.json(toCookbookMemberDTO(member));
});

const removeMember = asyncHandler(async (req, res) => {
  requireRole(req);
  if (!canManageCookbook(req.role)) throw new AppError(403, "Réservé au créateur du cookbook.");
  await cookbooksService.removeMember(req.params.memberId);
  res.status(204).send();
});

module.exports = {
  list,
  create,
  getOne,
  update,
  remove,
  listRecipes,
  attachRecipe,
  detachRecipe,
  inviteMember,
  updateMemberRole,
  removeMember,
};
