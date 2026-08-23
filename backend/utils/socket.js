const { Server } = require('socket.io');

let io;

// Maps userId -> Set of connected socket ids (supports multiple tabs/devices)
const onlineUsers = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const { userId } = socket.handshake.auth || {};

    if (userId) {
      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
      onlineUsers.get(userId).add(socket.id);
      socket.join(`user:${userId}`);
    }

    socket.on('joinProjectRoom', (projectId) => {
      if (projectId) socket.join(`project:${projectId}`);
    });

    socket.on('leaveProjectRoom', (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) onlineUsers.delete(userId);
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  return io;
}

// Emit a real-time notification to a specific user
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
}

// Emit a real-time event (e.g. new comment) to everyone viewing a project
function emitToProject(projectId, event, payload) {
  if (!io) return;
  io.to(`project:${projectId.toString()}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToUser, emitToProject };
