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

  server.on("upgrade", async (req, socket, head) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname !== "/ws") {
      return;
    }

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          if (decision.reason.isRateLimit()) {
            socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
          } else {
            socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
          }
          socket.destroy();
          return;
        }
      } catch (e) {
        console.error("WS upgrade protection error", e);
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (socket, req) => {
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
