import { WebSocket, WebSocketServer } from "ws";
import {
  createRoom,
  getPlayers,
  roomExists,
  updatePlayer,
} from "../utils/rooms";
import http from "http";
import express from "express";
import { genRoomId } from "../utils/functions/roomId";

interface WSMessage {
  type: string;
  data: any;
}

const app = express();

app.use(express.json());

app.get("/api/ping", (req, res) => res.send("pong"));

app.post("/api/rooms", async (req, res) => {
  let roomId = genRoomId();
  while (roomExists(roomId)) roomId = genRoomId();

  await createRoom(roomId);
  res.json({ roomId });
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

const rooms: Record<string, Set<WebSocket>> = {};

wss.on("connection", (ws, req) => {
  let currentRoom: string | null = null;

  ws.on("message", async (message) => {
    try {
      const msg: WSMessage = JSON.parse(message.toString());
      const { type, data } = msg;

      switch (type) {
        case "JOIN_ROOM":
          const roomCode = data.roomCode;
          if (!roomCode) return;
          const exists = await roomExists(roomCode);
          if (!exists) {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                data: `Комната ${roomCode} не существует ❌`,
              }),
            );
            return;
          }

          currentRoom = roomCode;

          if (!rooms[currentRoom!]) rooms[currentRoom!] = new Set();
          rooms[currentRoom!].add(ws);

          await broadcastRoomState(currentRoom!);
          break;

        default:
          ws.send(JSON.stringify({ type: "ERROR", data: "Unknown type" }));
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: "ERROR", data: err.message }));
    }
  });

  ws.on("close", () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom].delete(ws);
      if (rooms[currentRoom].size === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

export async function broadcastRoomState(roomCode: string) {
  if (!rooms[roomCode]) return;

  const playersObj = await getPlayers(roomCode);
  const players = Object.values(playersObj);

  const msg = JSON.stringify({ type: "ROOM_STATE", data: players });
  rooms[roomCode].forEach((client) => client.send(msg));
}

export async function broadcastCubeUpdate(
  roomCode: string,
  playerId: string,
  cube: string,
) {
  if (!rooms[roomCode]) return;
  try {
    const playersObj = await getPlayers(roomCode);
    const player = playersObj[playerId];
    const playerWithCube = { ...player, cube };
    const msg = JSON.stringify({ type: "GET_CUBE", data: playerWithCube });
    rooms[roomCode].forEach((client) => client.send(msg));
  } catch (error) {
    console.error(error);
  }
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Express + WS running on port ${PORT}`);
});
