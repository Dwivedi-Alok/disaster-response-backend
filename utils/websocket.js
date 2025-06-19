// utils/websocket.js
let io = null;

const initializeWebSocket = (socketIO) => {
  io = socketIO;
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join_disaster', (disasterId) => {
      socket.join(`disaster:${disasterId}`);
      console.log(`Client ${socket.id} joined disaster room: ${disasterId}`);
    });
    
    socket.on('leave_disaster', (disasterId) => {
      socket.leave(`disaster:${disasterId}`);
      console.log(`Client ${socket.id} left disaster room: ${disasterId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export { initializeWebSocket, getIO };