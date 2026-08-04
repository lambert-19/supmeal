const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

async function listByRecipe(recipeId) {
  return prisma.comment.findMany({
    where: { recipeId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function create(recipeId, authorId, text) {
  return prisma.comment.create({
    data: { recipeId, authorId, text },
    include: { author: { select: { name: true } } },
  });
}

async function remove(id, authorId) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new AppError(404, "Commentaire introuvable.");
  if (comment.authorId !== authorId) throw new AppError(403, "Vous n'êtes pas l'auteur de ce commentaire.");
  await prisma.comment.delete({ where: { id } });
}

module.exports = { listByRecipe, create, remove };
