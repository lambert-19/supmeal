const AppError = require("../utils/AppError");

const PRISMA_STATUS_BY_CODE = {
  P2002: 409,
  P2025: 404,
  P2003: 400,
};

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  if (err.code && PRISMA_STATUS_BY_CODE[err.code]) {
    return res.status(PRISMA_STATUS_BY_CODE[err.code]).json({ message: "Erreur de base de données.", code: err.code });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Non authentifié." });
  }

  console.error(err);
  res.status(500).json({ message: "Erreur interne du serveur." });
}

module.exports = errorHandler;
