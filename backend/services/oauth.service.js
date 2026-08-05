const crypto = require("crypto");

const prisma = require("../utils/prisma");
const { hashPassword } = require("../utils/password");
const AppError = require("../utils/AppError");

// Connexion/inscription via un fournisseur OAuth2. Trois cas :
// - le fournisseur est déjà lié (reconnexion) -> on renvoie son utilisateur ;
// - l'email correspond à un compte existant -> rattachement automatique (le
//   fournisseur a déjà vérifié cet email, donc pas de risque de prise de
//   contrôle d'un compte qu'on ne possède pas) ;
// - sinon -> création d'un nouveau compte, email considéré vérifié d'office.
async function findOrCreateUserFromProfile(provider, profile) {
  if (!profile.email) {
    throw new AppError(400, "Ce fournisseur n'a communiqué aucune adresse email.");
  }
  const normalizedEmail = profile.email.trim().toLowerCase();

  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId } },
    include: { user: true },
  });
  if (existingAccount) return existingAccount.user;

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    await prisma.oAuthAccount.create({
      data: { provider, providerAccountId: profile.providerAccountId, userId: existingUser.id },
    });
    return existingUser;
  }

  // Mot de passe aléatoire, jamais communiqué : ce compte ne peut être ouvert
  // que via ce fournisseur tant que l'utilisateur n'a pas défini un vrai mot
  // de passe (via "mot de passe oublié", qui fonctionne indépendamment de
  // hasPassword).
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
  return prisma.user.create({
    data: {
      name: profile.name || normalizedEmail,
      email: normalizedEmail,
      passwordHash,
      hasPassword: false,
      emailVerified: true,
      oauthAccounts: { create: { provider, providerAccountId: profile.providerAccountId } },
    },
  });
}

// Rattache un fournisseur à l'utilisateur déjà connecté (Paramètres >
// Connexions). Refuse si ce compte tiers est déjà lié à un AUTRE utilisateur
// SUPMEAL (éviterait sinon qu'un même compte Google se retrouve partagé entre
// deux comptes SUPMEAL sans le vouloir).
async function linkAccountToUser(userId, provider, profile) {
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId } },
  });
  if (existingAccount && existingAccount.userId !== userId) {
    throw new AppError(409, "Ce compte est déjà lié à un autre utilisateur SUPMEAL.");
  }
  if (existingAccount) return; // déjà lié à ce même utilisateur : rien à faire.

  await prisma.oAuthAccount.upsert({
    where: { provider_userId: { provider, userId } },
    update: { providerAccountId: profile.providerAccountId },
    create: { provider, providerAccountId: profile.providerAccountId, userId },
  });
}

// Retire un fournisseur lié. Bloqué si c'est le DERNIER moyen de connexion de
// l'utilisateur (pas de mot de passe utilisable ET aucun autre fournisseur
// lié) : le retirer le verrouillerait hors de son propre compte.
async function unlinkAccount(userId, provider) {
  const [user, accounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { hasPassword: true } }),
    prisma.oAuthAccount.findMany({ where: { userId }, select: { provider: true } }),
  ]);
  if (!user) throw new AppError(404, "Utilisateur introuvable.");

  const isLinked = accounts.some((a) => a.provider === provider);
  if (!isLinked) return;

  if (!user.hasPassword && accounts.length <= 1) {
    throw new AppError(
      400,
      "Impossible de délier ce compte : c'est votre seul moyen de connexion. Définissez d'abord un mot de passe."
    );
  }

  await prisma.oAuthAccount.delete({ where: { provider_userId: { provider, userId } } });
}

module.exports = { findOrCreateUserFromProfile, linkAccountToUser, unlinkAccount };
