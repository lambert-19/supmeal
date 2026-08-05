require("dotenv").config();

const http = require("http");
const app = require("./app");
const { initSocket } = require("./utils/socket");
const { startTokenCleanupJob } = require("./utils/tokenCleanup");

const PORT = process.env.PORT || 4000;

// Socket.io a besoin du serveur HTTP brut (pas juste de l'app Express) pour
// gérer l'upgrade de connexion WebSocket.
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`SUPMEAL backend listening on http://localhost:${PORT}`);
});

startTokenCleanupJob();
