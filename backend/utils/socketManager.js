/**
 * socketManager.js
 * Singleton that holds the Socket.io server instance.
 * Call init(httpServer) once from index.js, then use getIO() anywhere.
 */
const { Server } = require("socket.io");

let io = null;

// Map of userId (string) -> Set of socketIds
const userSockets = new Map();

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId) return;

    // Register the socket for this user
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    console.log(`[Socket] User ${userId} connected (socket: ${socket.id})`);

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  return io;
};

const getIO = () => io;

/**
 * Emit a notification event to a specific user (all their open tabs).
 */
const emitToUser = (userId, notification) => {
  if (!io) return;
  const sockets = userSockets.get(userId.toString());
  if (sockets && sockets.size > 0) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit("notification", notification);
    });
  }
};

/**
 * Emit a notification event to multiple users.
 */
const emitToUsers = (userIds, notification) => {
  userIds.forEach((id) => emitToUser(id, notification));
};

/**
 * Broadcast a notification event to ALL connected users.
 */
const emitToAll = (notification) => {
  if (!io) return;
  io.emit("notification", notification);
};

module.exports = { init, getIO, emitToUser, emitToUsers, emitToAll };
