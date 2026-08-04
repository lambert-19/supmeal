const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

async function setEntry(ownerId, { date, mealSlot, recipeId }) {
  return prisma.planningEntry.upsert({
    where: { ownerId_date_mealSlot: { ownerId, date, mealSlot } },
    update: { recipeId },
    create: { ownerId, date, mealSlot, recipeId },
  });
}

async function listMine(ownerId, { from, to }) {
  const where = { ownerId };
  if (from && to) where.date = { gte: from, lte: to };
  return prisma.planningEntry.findMany({ where, orderBy: [{ date: "asc" }] });
}

async function remove(id, ownerId) {
  const entry = await prisma.planningEntry.findUnique({ where: { id } });
  if (!entry) throw new AppError(404, "Entrée de planning introuvable.");
  if (entry.ownerId !== ownerId) throw new AppError(403, "Non autorisé.");
  await prisma.planningEntry.delete({ where: { id } });
}

module.exports = { setEntry, listMine, remove };
