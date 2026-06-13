const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    const room = io.sockets.adapter.rooms.get(roomId);

    if (room.size > 1) {
      socket.to(roomId).emit("user-joined");
    }

    socket.on("offer", (offer) => {
      socket.to(roomId).emit("offer", offer);
    });

    socket.on("answer", (answer) => {
      socket.to(roomId).emit("answer", answer);
    });

    socket.on("ice-candidate", (candidate) => {
      socket.to(roomId).emit("ice-candidate", candidate);
    });
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server Running on http://localhost:3000");
});