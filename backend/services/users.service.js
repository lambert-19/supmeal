const prisma = require("../utils/prisma");
const { hashPassword, comparePassword } = require("../utils/password");
const AppError = require("../utils/AppError");

async function updateProfile(userId, { name }) {
  return prisma.user.update({ where: { id: userId }, data: { name } });
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "Utilisateur introuvable.");

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, "Mot de passe actuel incorrect.");

  const passwordHash = await hashPassword(newPassword);
  // tokenVersion++ : invalide les JWT déjà émis (autres appareils/onglets) ;
  // le contrôleur réémet un cookie à jour pour la session courante.
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
}

async function updatePreferences(userId, { dietaryRegime, allergies, favoriteCuisine, defaultServings }) {
  return prisma.user.update({
    where: { id: userId },
    data: { dietaryRegime, allergies, favoriteCuisine, defaultServings },
  });
}

module.exports = { updateProfile, changePassword, updatePreferences };
