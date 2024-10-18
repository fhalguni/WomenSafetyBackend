const WebSocket = require("ws");
const feedbackController = require("../controllers/feedbackController");

const feedbackServer = new WebSocket.Server({
  noServer: true, // No server is created here; it will use the existing HTTP server
});

const notifyClientsNewFeedback = (newFeedback) => {
  feedbackServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ status: "NewFeedback", data: newFeedback }));
    }
  });
};

feedbackServer.on("connection", (ws) => {
  console.log("Feedback client connected");

  ws.on("message", async () => {
    try {
      const feedback = await feedbackController.getAllFeedbackForWebSocket();
      ws.send(JSON.stringify({ status: "Success", data: feedback }));
    } catch (err) {
      ws.send(JSON.stringify({ status: "Error", data: err.message }));
    }
  });

  ws.on("close", () => {
    console.log("Feedback client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket Error:", error);
  });
});

module.exports = {
  feedbackServer,
  notifyClientsNewFeedback,
};
