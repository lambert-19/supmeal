const { verifyToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");

function requireAuth(req, res, next) {
  const token = req.cookies[process.env.COOKIE_NAME];
  if (!token) return next(new AppError(401, "Non authentifié."));

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;
