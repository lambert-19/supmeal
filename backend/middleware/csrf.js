const AppError = require("../utils/AppError");
const { CSRF_COOKIE_NAME } = require("../utils/jwt");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Pattern double-submit cookie : le cookie CSRF (non-httpOnly) doit être
// recopié par le frontend dans l'en-tête X-CSRF-Token. Un attaquant qui fait
// exécuter une requête cross-site via le cookie de session ne peut pas lire
// ce cookie (same-origin policy) et ne peut donc pas fournir l'en-tête.
function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.get("x-csrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError(403, "Requête refusée (jeton CSRF manquant ou invalide)."));
  }
  next();
}

module.exports = csrfProtection;
