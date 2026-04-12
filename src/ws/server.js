import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  let message;
  try {
    message = JSON.stringify(payload);
  } catch (err) {
    console.error("Failed to serialize broadcast payload:", err);
    return;
  }

  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    try {
      client.send(message);
    } catch (err) {
      console.error("Failed to send to WebSocket client:", err);
    }
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server: server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket, req) => {
    if(wsArcjet) {
      try {
        const decision = wsArcjet.protect(req);

        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit() ? "Rate limit exceeded" : "Access denied";

          socket.close(code, reason);
          return
        }
      } catch (e) {
        console.error("WS connection error", e);
        socket.close(1008, "Server security error");
        return
      }
    }

    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    sendJson(socket, {
      type: "Welcome to Sportz wss",
    });

    socket.on("error", (error) => {
      console.error("WebSocket client error:", error);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, {
      type: "match_created",
      data: match, 
    });
  }

  return { broadcastMatchCreated };
}
