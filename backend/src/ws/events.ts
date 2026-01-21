import { rooms, wss } from ".";
import { getRoomHistory, roomExists } from "../redis/helpers";
import { IRoomEvent, WSMessage } from "../types";
import { broadcastRoomState } from "./broadcasts";

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
          const history: IRoomEvent[] = await getRoomHistory(currentRoom!);
          ws.send(JSON.stringify({ type: "ROOM_HISTORY", data: history }));
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
