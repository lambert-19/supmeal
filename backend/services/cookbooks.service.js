const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");
const { getCookbookRole } = require("../utils/permissions");
const { generateToken, COOKBOOK_INVITE_TTL_MS } = require("../utils/tokens");
const { sendCookbookInviteEmail } = require("../utils/mailer");

const COOKBOOK_INCLUDE = {
  members: true,
  owner: { select: { id: true, name: true, email: true } },
  _count: { select: { recipes: true } },
};

async function listMine(user) {
  const cookbooks = await prisma.cookbook.findMany({
    include: COOKBOOK_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return cookbooks.filter((c) => getCookbookRole(c, user) !== null);
}

async function create(ownerId, { name, description }) {
  return prisma.cookbook.create({
    data: { ownerId, name, description: description ?? "" },
    include: COOKBOOK_INCLUDE,
  });
}

async function update(id, patch) {
  return prisma.cookbook.update({
    where: { id },
    data: {
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.description !== undefined && { description: patch.description }),
    },
    include: COOKBOOK_INCLUDE,
  });
}

async function remove(id) {
  await prisma.cookbook.delete({ where: { id } });
}

async function listRecipes(cookbookId) {
  return prisma.recipe.findMany({
    where: { cookbookId },
    include: { ingredients: true, steps: true },
    orderBy: { createdAt: "desc" },
  });
}

async function inviteMember(cookbookId, cookbookName, { email, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  const matchedUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Compte existant : rattachement immédiat, pas besoin de lien sécurisé — un
  // simple email de notification suffit puisque la personne peut déjà se connecter.
  if (matchedUser) {
    const member = await prisma.cookbookMember.upsert({
      where: { cookbookId_email: { cookbookId, email: normalizedEmail } },
      update: { role, userId: matchedUser.id, name: matchedUser.name, inviteTokenHash: null, inviteTokenExpiresAt: null },
      create: { cookbookId, email: normalizedEmail, role, userId: matchedUser.id, name: matchedUser.name },
    });
    await sendCookbookInviteEmail(normalizedEmail, { cookbookName, existingAccount: true });
    return member;
  }

  // Pas de compte : lien sécurisé à usage unique envoyé par email, qui rattache
  // automatiquement la personne au cookbook dès qu'elle crée son compte (voir
  // auth.service.js#consumeCookbookInvite, appelé depuis POST /auth/register).
  const { raw, tokenHash, expiresAt } = generateToken(COOKBOOK_INVITE_TTL_MS);
  const member = await prisma.cookbookMember.upsert({
    where: { cookbookId_email: { cookbookId, email: normalizedEmail } },
    update: { role, inviteTokenHash: tokenHash, inviteTokenExpiresAt: expiresAt },
    create: {
      cookbookId,
      email: normalizedEmail,
      role,
      name: normalizedEmail,
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
    },
  });
  await sendCookbookInviteEmail(normalizedEmail, { cookbookName, token: raw });
  return member;
}

async function updateMemberRole(cookbookId, memberId, role) {
  const member = await prisma.cookbookMember.findUnique({ where: { id: memberId } });
  if (!member || member.cookbookId !== cookbookId) throw new AppError(404, "Membre introuvable.");
  return prisma.cookbookMember.update({ where: { id: memberId }, data: { role } });
}

async function removeMember(cookbookId, memberId) {
  const member = await prisma.cookbookMember.findUnique({ where: { id: memberId } });
  if (!member || member.cookbookId !== cookbookId) throw new AppError(404, "Membre introuvable.");
  await prisma.cookbookMember.delete({ where: { id: memberId } });
}

module.exports = {
  listMine,
  create,
  update,
  remove,
  listRecipes,
  inviteMember,
  updateMemberRole,
  removeMember,
  COOKBOOK_INCLUDE,
};
