const prisma = require("../utils/prisma");

async function listByCookbook(cookbookId) {
  return prisma.message.findMany({
    where: { cookbookId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function create(cookbookId, authorId, text) {
  return prisma.message.create({
    data: { cookbookId, authorId, text },
    include: { author: { select: { name: true } } },
  });
}

module.exports = { listByCookbook, create };
