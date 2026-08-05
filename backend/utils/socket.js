const { Server } = require("socket.io");
const prisma = require("./prisma");
const { verifyToken } = require("./jwt");
const { getCookbookRole } = require("./permissions");
const allowedOrigins = require("./corsOrigins");
const messagesService = require("../services/messages.service");

let io;

// userId -> Set<socketId> : un utilisateur peut avoir plusieurs onglets/appareils
// connectés à la fois, il ne redevient "hors ligne" que quand le dernier se ferme.
const onlineUsers = new Map();

function addOnlineSocket(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

// Retourne true si l'utilisateur a encore au moins une autre connexion active.
function removeOnlineSocket(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size > 0) return true;
  onlineUsers.delete(userId);
  return false;
}

async function buildPresenceSnapshot(userIds) {
  const uniqueIds = [...new Set(userIds)];
  const onlineIds = uniqueIds.filter((id) => onlineUsers.has(id));
  const offlineIds = uniqueIds.filter((id) => !onlineUsers.has(id));

  const offlineUsers = offlineIds.length
    ? await prisma.user.findMany({ where: { id: { in: offlineIds } }, select: { id: true, lastSeenAt: true } })
    : [];

  const snapshot = {};
  onlineIds.forEach((id) => {
    snapshot[id] = { online: true, lastSeenAt: null };
  });
  offlineUsers.forEach((u) => {
    snapshot[u.id] = { online: false, lastSeenAt: u.lastSeenAt };
  });
  return snapshot;
}

function parseCookieHeader(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const separatorIndex = pair.indexOf("=");
        return [pair.slice(0, separatorIndex), decodeURIComponent(pair.slice(separatorIndex + 1))];
      })
  );
}

// Même vérification que middleware/auth.js (JWT + tokenVersion), adaptée à la
// poignée de main Socket.io qui n'a pas accès à cookie-parser/req.cookies.
async function authenticate(socket, next) {
  try {
    const cookies = parseCookieHeader(socket.handshake.headers.cookie);
    const token = cookies[process.env.COOKIE_NAME];
    if (!token) return next(new Error("unauthorized"));

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { tokenVersion: true } });
    if (!user || user.tokenVersion !== (payload.tokenVersion ?? 0)) {
      return next(new Error("unauthorized"));
    }

    socket.userId = payload.userId;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
}

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  io.use(authenticate);

  io.on("connection", (socket) => {
    addOnlineSocket(socket.userId, socket.id);

    // Un utilisateur ne rejoint la room d'un cookbook que si un rôle lui est
    // réellement reconnu — même garde-fou que loadCookbookAndRole côté REST,
    // sinon n'importe quel utilisateur connecté pourrait écouter les messages
    // de n'importe quel cookbook en devinant son id.
    socket.on("cookbook:join", async (cookbookId, ack) => {
      if (typeof cookbookId !== "string") return;
      const cookbook = await prisma.cookbook.findUnique({ where: { id: cookbookId }, include: { members: true } });
      if (!cookbook) return;
      const currentUser = await prisma.user.findUnique({ where: { id: socket.userId }, select: { id: true, email: true } });
      const role = getCookbookRole(cookbook, currentUser);
      if (!role) return;

      const room = `cookbook:${cookbookId}`;
      socket.join(room);
      // Signale l'arrivée aux membres déjà présents dans la room (l'appelant
      // recevra sa propre présence via le snapshot ci-dessous, pas cet event).
      socket.to(room).emit("presence:update", { userId: socket.userId, online: true, lastSeenAt: null });

      if (typeof ack === "function") {
        const memberUserIds = [cookbook.ownerId, ...cookbook.members.map((m) => m.userId).filter(Boolean)];
        ack(await buildPresenceSnapshot(memberUserIds));
      }
    });

    socket.on("cookbook:leave", (cookbookId) => {
      if (typeof cookbookId === "string") socket.leave(`cookbook:${cookbookId}`);
    });

    // Accusés de réception (livré/lu). Le seul garde-fou nécessaire ici est
    // d'avoir rejoint la room au préalable (donc déjà passé la vérification de
    // rôle de cookbook:join) — pas besoin de rerequêter Prisma à chaque frappe.
    async function handleReceipt(cookbookId, messageIds, read) {
      if (typeof cookbookId !== "string" || !socket.rooms.has(`cookbook:${cookbookId}`)) return;
      const ids = await messagesService.markReceipts(cookbookId, socket.userId, messageIds, { read });
      if (ids.length === 0) return;
      const aggregate = await messagesService.getAggregateReceipts(ids);
      const updates = ids.map((id) => ({ messageId: id, ...aggregate[id] }));
      io.to(`cookbook:${cookbookId}`).emit("receipts:update", updates);
    }

    socket.on("cookbook:delivered", ({ cookbookId, messageIds } = {}) => handleReceipt(cookbookId, messageIds, false));
    socket.on("cookbook:seen", ({ cookbookId, messageIds } = {}) => handleReceipt(cookbookId, messageIds, true));

    // "Est en train d'écrire" : purement éphémère (aucune trace en base), un
    // simple relais aux autres membres déjà présents dans la room.
    socket.on("cookbook:typing", ({ cookbookId, typing, name } = {}) => {
      if (typeof cookbookId !== "string" || !socket.rooms.has(`cookbook:${cookbookId}`)) return;
      socket
        .to(`cookbook:${cookbookId}`)
        .emit("typing:update", { userId: socket.userId, name: String(name || "").slice(0, 60), typing: !!typing });
    });

    // "disconnecting" (pas "disconnect") : socket.rooms est encore renseigné à
    // ce stade, nécessaire pour savoir à qui annoncer le passage hors ligne.
    socket.on("disconnecting", async () => {
      const cookbookRooms = [...socket.rooms].filter((room) => room.startsWith("cookbook:"));
      const stillOnlineElsewhere = removeOnlineSocket(socket.userId, socket.id);
      if (stillOnlineElsewhere) return;

      const lastSeenAt = new Date();
      await prisma.user.update({ where: { id: socket.userId }, data: { lastSeenAt } }).catch(() => {});
      for (const room of cookbookRooms) {
        io.to(room).emit("presence:update", { userId: socket.userId, online: false, lastSeenAt });
      }
    });
  });

  return io;
}

function emitNewMessage(cookbookId, message) {
  if (!io) return;
  io.to(`cookbook:${cookbookId}`).emit("message:new", message);
}

module.exports = { initSocket, emitNewMessage };
