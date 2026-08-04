const prisma = require("./prisma");
const { getCookbookRole, canComment } = require("./permissions");

async function resolveRecipeAccess(recipe, userId) {
  const isOwner = recipe.ownerId === userId;
  let role = null;

  if (recipe.cookbookId) {
    const cookbook = await prisma.cookbook.findUnique({
      where: { id: recipe.cookbookId },
      include: { members: true },
    });
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    role = cookbook ? getCookbookRole(cookbook, currentUser) : null;
  }

  const canView = isOwner || role !== null;
  const canPostComment = isOwner || canComment(role);

  return { isOwner, role, canView, canPostComment };
}

module.exports = { resolveRecipeAccess };
