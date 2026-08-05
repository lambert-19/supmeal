const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const AppError = require("../utils/AppError");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Extension dérivée du mimetype détecté par multer, jamais du nom de fichier
// fourni par le client — évite qu'un fichier malveillant se fasse passer pour
// une image via une extension trompeuse.
const ALLOWED_MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_EXTENSIONS[file.mimetype];
    cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_EXTENSIONS[file.mimetype]) {
    return cb(new AppError(400, "Format d'image non supporté (jpeg, png, webp, gif uniquement)."));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 10 },
});

module.exports = { upload, UPLOAD_DIR };
