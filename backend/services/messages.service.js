const prisma = require("../utils/prisma");

const MESSAGE_INCLUDE = {
  author: { select: { name: true } },
  receipts: { select: { userId: true, deliveredAt: true, readAt: true } },
};

async function listByCookbook(cookbookId) {
  return prisma.message.findMany({
    where: { cookbookId },
    include: MESSAGE_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
}

async function create(cookbookId, authorId, { text, imageUrl }) {
  return prisma.message.create({
    data: { cookbookId, authorId, text: text ?? "", imageUrl: imageUrl || null },
    include: MESSAGE_INCLUDE,
  });
}

// Marque des messages comme livrés (et, si `read` est vrai, comme lus) pour un
// destinataire. `authorId: { not: userId }` exclut ses propres messages : on
// ne pose jamais d'accusé de réception sur ce qu'on a soi-même écrit, même si
// l'id était présent dans la liste envoyée par le client. Retourne les ids
// des messages réellement concernés (pour la diffusion de la mise à jour).
async function markReceipts(cookbookId, userId, messageIds, { read }) {
  if (!Array.isArray(messageIds) || messageIds.length === 0) return [];

  const messages = await prisma.message.findMany({
    where: { id: { in: [...new Set(messageIds)] }, cookbookId, authorId: { not: userId } },
    select: { id: true },
  });
  if (messages.length === 0) return [];

  const now = new Date();
  const updateData = read ? { readAt: now } : {};
  await Promise.all(
    messages.map(async ({ id: messageId }) => {
      try {
        await prisma.messageReceipt.upsert({
          where: { messageId_userId: { messageId, userId } },
          create: { messageId, userId, deliveredAt: now, readAt: read ? now : null },
          update: updateData,
        });
      } catch (error) {
        // "cookbook:delivered" et "cookbook:seen" peuvent arriver quasi en
        // même temps pour le même message : deux upserts concurrents sur la
        // même paire (messageId, userId) peuvent se doubler et déclencher une
        // violation de contrainte unique côté Postgres. La ligne existe alors
        // déjà — on retombe simplement sur un update.
        if (error.code === "P2002") {
          await prisma.messageReceipt.update({
            where: { messageId_userId: { messageId, userId } },
            data: updateData,
          });
          return;
        }
        throw error;
      }
    })
  );

  return messages.map((m) => m.id);
}

// { [messageId]: { delivered, read } } — "au moins un destinataire" plutôt que
// "tous", plus simple à raisonner pour un chat de groupe à effectif variable.
async function getAggregateReceipts(messageIds) {
  const receipts = await prisma.messageReceipt.findMany({
    where: { messageId: { in: messageIds } },
    select: { messageId: true, deliveredAt: true, readAt: true },
  });

  const byMessage = {};
  messageIds.forEach((id) => {
    byMessage[id] = { delivered: false, read: false };
  });
  receipts.forEach((r) => {
    if (r.deliveredAt) byMessage[r.messageId].delivered = true;
    if (r.readAt) byMessage[r.messageId].read = true;
  });
  return byMessage;
}

module.exports = { listByCookbook, create, markReceipts, getAggregateReceipts };
