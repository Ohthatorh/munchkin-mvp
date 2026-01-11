import { WebSocket, WebSocketServer } from "ws";
import { createRoom, getPlayers, updatePlayer } from "./rooms";

interface WSMessage {
  type: string;
  data: any;
}

const wss = new WebSocketServer({ port: 3001 });
const rooms: Record<string, Set<WebSocket>> = {};

wss.on("connection", (ws) => {
  let currentRoom: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on("message", async (message) => {
    try {
      const msg: WSMessage = JSON.parse(message.toString());
      const { type, data } = msg;

      switch (type) {
        case "JOIN_ROOM":
          currentRoom = data.roomCode;
          currentPlayerId = data.playerId;

          if (!currentRoom) return;

          if (!rooms[currentRoom]) rooms[currentRoom] = new Set();
          rooms[currentRoom].add(ws);

          await createRoom(currentRoom);

          await broadcastRoomState(currentRoom);
          break;

        case "PLAYER_UPDATE":
          console.log("tut");
          if (!currentRoom || !currentPlayerId) return;

          await updatePlayer(currentRoom, currentPlayerId, data.updates);
          await broadcastRoomState(currentRoom);
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
    }
  });
});

async function broadcastRoomState(roomCode: string) {
  if (!rooms[roomCode]) return;

  const playersObj = await getPlayers(roomCode); // Record<string, Player>
  const players = Object.values(playersObj); // Player[]

  const msg = JSON.stringify({ type: "ROOM_STATE", data: players });
  rooms[roomCode].forEach((client) => client.send(msg));
}

console.log("WebSocket server running on ws://localhost:3001");
