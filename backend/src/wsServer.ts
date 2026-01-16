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

          await createRoom(currentRoom);

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
  try {
    const playersObj = await getPlayers(roomCode);
    const player = playersObj[playerId];
    const msg = JSON.stringify({ type: "GET_CUBE", data: player, cube: cube });
    console.log(roomCode);
    // rooms[roomCode].forEach((client) => client.send(msg));
    console.log(rooms);
  } catch (error) {
    console.error(error);
  }
}

console.log("WebSocket server running on ws://localhost:3001");
