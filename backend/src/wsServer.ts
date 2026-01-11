import { WebSocketServer } from "ws";
import {
  createRoom,
  addPlayer,
  getPlayers,
  updatePlayer,
  Player,
} from "./rooms";

interface WSMessage {
  type: string;
  data: any;
}

const wss = new WebSocketServer({ port: 3001 });

const rooms: Record<string, Set<any>> = {}; // code -> set of ws connections

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
          if (!currentRoom) return;
          if (!rooms[currentRoom]) rooms[currentRoom] = new Set();
          rooms[currentRoom].add(ws);

          // создаем комнату в Redis, если нет
          await createRoom(currentRoom);

          // возвращаем текущее состояние
          const players = await getPlayers(currentRoom);
          broadcastRoomState(currentRoom, players);
          break;

        case "PLAYER_UPDATE":
          if (!currentRoom) return;
          if (!currentPlayerId) return;
          currentPlayerId = data.playerId;

          const updated = await updatePlayer(
            currentRoom,
            currentPlayerId!,
            data.updates
          );
          broadcastRoomState(currentRoom, await getPlayers(currentRoom));
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

function broadcastRoomState(roomCode: string, players: Player[]) {
  if (!rooms[roomCode]) return;
  const msg = JSON.stringify({ type: "ROOM_STATE", data: players });
  rooms[roomCode].forEach((client) => {
    client.send(msg);
  });
}

console.log("WebSocket server running on ws://localhost:3001");
