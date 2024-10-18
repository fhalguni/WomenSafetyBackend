const WebSocket = require("ws");

module.exports = (server) => {
  const liveLocationServer = new WebSocket.Server({
    path: "/live-location",
  });

  liveLocationServer.on("connection", (ws) => {
    console.log(" live Location Client connected");

    ws.on("message", async (message) => {
      const location = JSON.parse(message);

      console.log(location);
      if (Location.countDocuments === 0) {
        try {
          const location = await locationController.createLocation(data);
          ws.send(JSON.stringify({ status: "Success", data: location }));
        } catch (err) {
          ws.send(JSON.stringify({ status: "Error", data: err.message }));
        }
      } else {
        try {
          const location = await locationController.updateLocation(data);
          ws.send(JSON.stringify({ status: "Success", data: location }));
        } catch (err) {
          ws.send(JSON.stringify({ status: "Error", data: err.message }));
        }
      }
      liveLocationServer.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              userId,
              latitude: latitude,
              longitude: longitude,
            })
          );
        }
      });
    });
    ws.on("close", () => {
      console.log("live location Client disconnected");
    });
  });
};
