import { WebSocket, WebSocketServer } from "ws";
import { createRoom, getPlayers, updatePlayer } from "../utils/rooms";

interface WSMessage {
  type: string;
  data: any;
}

const wss = new WebSocketServer({ port: 3001 });
const rooms: Record<string, Set<WebSocket>> = {};

wss.on("connection", (ws) => {
  let currentRoom: string | null = null;
  ws.on("message", async (message) => {
    try {
      const msg: WSMessage = JSON.parse(message.toString());
      const { type, data } = msg;

      switch (type) {
        case "JOIN_ROOM":
          currentRoom = data.roomCode;
          if (!currentRoom) return;
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

console.log("WebSocket server running on ws://localhost:3001");
