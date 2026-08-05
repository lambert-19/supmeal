const prisma = require("../utils/prisma");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken, hashToken, EMAIL_VERIFICATION_TTL_MS, PASSWORD_RESET_TTL_MS } = require("../utils/tokens");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/mailer");
const AppError = require("../utils/AppError");

async function issueToken(userId, type, ttlMs) {
  const { raw, tokenHash, expiresAt } = generateToken(ttlMs);
  await prisma.verificationToken.deleteMany({ where: { userId, type } });
  await prisma.verificationToken.create({ data: { userId, type, tokenHash, expiresAt } });
  return raw;
}

async function consumeToken(rawToken, type) {
  const tokenHash = hashToken(rawToken);
  const token = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!token || token.type !== type || token.expiresAt < new Date()) {
    throw new AppError(400, "Lien invalide ou expiré.");
  }
  await prisma.verificationToken.delete({ where: { id: token.id } });
  return token;
}

async function consumeCookbookInvite(rawInviteToken, user) {
  const tokenHash = hashToken(rawInviteToken);
  const member = await prisma.cookbookMember.findUnique({ where: { inviteTokenHash: tokenHash } });
  // Un lien invalide/expiré ne doit jamais bloquer la création de compte —
  // on rattache silencieusement au cookbook si possible, sinon on ignore.
  if (!member || (member.inviteTokenExpiresAt && member.inviteTokenExpiresAt < new Date())) return;

  await prisma.cookbookMember.update({
    where: { id: member.id },
    data: { userId: user.id, email: user.email, name: user.name, inviteTokenHash: null, inviteTokenExpiresAt: null },
  });
}

async function register({ name, email, password, inviteToken }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new AppError(409, "Un compte existe déjà avec cet email.");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash },
  });

  if (inviteToken) {
    await consumeCookbookInvite(inviteToken, user);
  }

  const rawToken = await issueToken(user.id, "email_verification", EMAIL_VERIFICATION_TTL_MS);
  await sendVerificationEmail(user.email, rawToken);

  return user;
}

async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, include: { oauthAccounts: true } });
  if (!user) throw new AppError(401, "Email ou mot de passe incorrect.");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Email ou mot de passe incorrect.");

  if (!user.emailVerified) {
    throw new AppError(403, "Veuillez vérifier votre adresse email avant de vous connecter.");
  }

  return user;
}

async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id }, include: { oauthAccounts: true } });
  if (!user) throw new AppError(404, "Utilisateur introuvable.");
  return user;
}

async function verifyEmail(rawToken) {
  const token = await consumeToken(rawToken, "email_verification");
  return prisma.user.update({ where: { id: token.userId }, data: { emailVerified: true } });
}

async function resendVerification(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  // Réponse générique côté contrôleur dans tous les cas, pour ne pas révéler
  // si l'email correspond à un compte existant.
  if (!user || user.emailVerified) return;

  const rawToken = await issueToken(user.id, "email_verification", EMAIL_VERIFICATION_TTL_MS);
  await sendVerificationEmail(user.email, rawToken);
}

async function forgotPassword(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return;

  const rawToken = await issueToken(user.id, "password_reset", PASSWORD_RESET_TTL_MS);
  await sendPasswordResetEmail(user.email, rawToken);
}

async function resetPassword(rawToken, newPassword) {
  const token = await consumeToken(rawToken, "password_reset");
  const passwordHash = await hashPassword(newPassword);
  // tokenVersion++ : invalide toute session déjà ouverte avec l'ancien mot de
  // passe (ex. un JWT volé) dès la réinitialisation, sans attendre son expiration.
  await prisma.user.update({
    where: { id: token.userId },
    // hasPassword: true couvre le cas d'un compte créé via OAuth2 (mot de
    // passe aléatoire jusque-là) qui définit ici son premier vrai mot de passe.
    data: { passwordHash, tokenVersion: { increment: 1 }, hasPassword: true },
  });
}

module.exports = {
  register,
  login,
  getById,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
