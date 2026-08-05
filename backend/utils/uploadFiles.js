const fs = require("fs");
const path = require("path");
const { UPLOAD_DIR } = require("../middleware/upload");

function backendUrl() {
  return process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
}

// N'efface que les fichiers effectivement servis par notre propre
// /uploads/... (une image importée depuis un JSON externe, par ex., reste une
// simple URL/data-URL en base, jamais touchée). path.basename() neutralise
// toute tentative de traversée de répertoire avant de reconstruire le chemin.
function deleteUploadedImage(url) {
  if (!url || typeof url !== "string") return;
  const prefix = `${backendUrl()}/uploads/`;
  if (!url.startsWith(prefix)) return;

  const filePath = path.join(UPLOAD_DIR, path.basename(url));
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") console.error("[uploads] échec de la suppression du fichier :", err);
  });
}

function deleteUploadedImages(urls = []) {
  urls.forEach(deleteUploadedImage);
}

module.exports = { deleteUploadedImage, deleteUploadedImages };
