require('dotenv').config();
const PORT = process.env.PORT || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://link-up-chatapp.vercel.app';

const io = require('socket.io')(PORT, {
  cors: {
    origin: [CORS_ORIGIN],
    methods: ['GET', 'POST']
  }
});

const onlineUsers = new Map(); // Map to store socket.id -> userId mapping

io.on('connection', (socket) => {

  // Listen for the custom event to receive the user ID
  socket.on("user_connected", ({ userId }) => {

    if (userId) {
      onlineUsers.set(socket.id, userId); // Map the socket ID to the user ID

      io.emit("update_online_users", Array.from(onlineUsers.values()));
    }

    // Handle user disconnection
    socket.on("disconnect", () => {

      const userId = onlineUsers.get(socket.id); // Retrieve the user ID for the socket
      if (userId) {
        onlineUsers.delete(socket.id); // Remove the user from the map

        // Simulate last seen by broadcasting the current time
        const disconnectTime = new Date().toISOString();

        // Notify all clients about the updated status
        io.emit("user_last_seen", { userId, lastSeen: disconnectTime });
      }

      // Broadcast the updated list of online users
      io.emit("update_online_users", Array.from(onlineUsers.values()));
    });

  })

  socket.on('message', (data) => {
    const { message, senderId, receiverId, createdAt, secondaryId } = data;
    const messages = { message, senderId, receiverId, createdAt, secondaryId };
    io.emit('message', messages);
  });

  socket.on("deleteMessage", (data) => {
    const { secondaryId } = data;
    io.emit("deleteMessage", secondaryId);
  });

});
