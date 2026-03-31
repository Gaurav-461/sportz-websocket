import http from "http"
import app from "./app.js";
import matchRouter from "./routes/matches.js";
import { attachWebSocketServer } from "./ws/server.js";


const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0'

const server = http.createServer(app);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Sportz API" });
});

app.use("/matches", matchRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server
  .listen(PORT,HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`);
  })
  .on("error", (err) => {
    console.error("Server failed to start:", err.message);
    process.exit(1);
  });
