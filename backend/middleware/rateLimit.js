const rateLimit = require("express-rate-limit");

function jsonHandler(message) {
  return (req, res) => {
    res.status(429).json({ message });
  };
}

// Endpoints d'authentification par mot de passe : cible des attaques par
// force brute. Limite par IP, indépendante de l'email ciblé.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Trop de tentatives de connexion. Réessayez dans quelques minutes."),
});

// Inscription/renvoi de vérification/mot de passe oublié : cible de
// l'énumération d'emails et du spam d'envoi de mails.
const authActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Trop de tentatives. Réessayez dans quelques minutes."),
});

module.exports = { loginLimiter, authActionLimiter };
