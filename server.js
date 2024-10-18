const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const WebSocket = require("ws");
const app = require("./app");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE_URL;
const locationController = require("./controllers/locationController");
const Location = require("./models/locationModel");

// Import the WebSocket server for feedback
const { feedbackServer } = require("./webSocket/feedback_websocket");

// Connect to MongoDB
mongoose
  .connect(DB)
  .then(() => {
    console.log("Database Connected Successfully 💥💥");
  })
  .catch((err) => {
    console.log("Failed to connect 🥲🥲");
  });

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server for live location with noServer option
const livelocationServer = new WebSocket.Server({ noServer: true });

livelocationServer.on("connection", (ws) => {
  console.log("Live location client connected");

  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    try {
      if ((await Location.countDocuments()) === 0) {
        const location = await locationController.createLocation(data);
        ws.send(JSON.stringify({ status: "Success", data: location }));
      } else {
        const location = await locationController.updateLocation(data);
        ws.send(JSON.stringify({ status: "Success", data: location }));
      }

      // Broadcast updated location to all clients
      livelocationServer.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              userId: data.userId,
              latitude: data.latitude,
              longitude: data.longitude,
            })
          );
        }
      });
    } catch (err) {
      ws.send(JSON.stringify({ status: "Error", data: err.message }));
    }
  });

  ws.on("close", () => {
    console.log("Live location client disconnected");
  });
});

// Handle WebSocket upgrade requests
server.on("upgrade", (request, socket, head) => {
  if (request.url === "/live-location") {
    livelocationServer.handleUpgrade(request, socket, head, (ws) => {
      livelocationServer.emit("connection", ws, request);
    });
  } else if (request.url === "/feedback") {
    feedbackServer.handleUpgrade(request, socket, head, (ws) => {
      feedbackServer.emit("connection", ws, request);
    });
  } else {
    socket.destroy(); // Close connection if the URL doesn't match
  }
});

// Start HTTP server
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
