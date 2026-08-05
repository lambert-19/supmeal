// Partagé entre app.js (cors()) et utils/socket.js (CORS de Socket.io) pour
// ne définir la liste d'origines autorisées qu'à un seul endroit.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = allowedOrigins;
