const multer = require("multer");
const AppError = require("../utils/AppError");

const PRISMA_STATUS_BY_CODE = {
  P2002: 409,
  P2025: 404,
  P2003: 400,
};

const MULTER_MESSAGE_BY_CODE = {
  LIMIT_FILE_SIZE: "Image trop lourde (2 Mo maximum).",
  LIMIT_FILE_COUNT: "Trop d'images (10 maximum).",
  LIMIT_UNEXPECTED_FILE: "Trop d'images (10 maximum).",
};

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: MULTER_MESSAGE_BY_CODE[err.code] || "Échec de l'envoi du fichier." });
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
