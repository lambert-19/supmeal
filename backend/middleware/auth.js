const prisma = require("../utils/prisma");
const { verifyToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");

async function requireAuth(req, res, next) {
  const token = req.cookies[process.env.COOKIE_NAME];
  if (!token) return next(new AppError(401, "Non authentifié."));

  try {
    const payload = verifyToken(token);
    // tokenVersion est incrémenté au changement/reset de mot de passe : un JWT
    // signé avant coup (ex. volé, ou simplement une autre session ouverte)
    // devient invalide immédiatement, sans attendre son expiration (7 jours).
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { tokenVersion: true } });
    if (!user || user.tokenVersion !== (payload.tokenVersion ?? 0)) {
      return next(new AppError(401, "Session invalidée, veuillez vous reconnecter."));
    }
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;
