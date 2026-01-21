import { wss } from ".";
import { getRoomHistory, roomExists } from "../redis/helpers";
import { IRoomEvent, WSMessage } from "../types";
import { broadcastRoomState } from "./broadcasts";
import { wsRooms } from "./wsRooms";

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

          if (!wsRooms[currentRoom!]) wsRooms[currentRoom!] = new Set();
          wsRooms[currentRoom!].add(ws);
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
    if (currentRoom && wsRooms[currentRoom]) {
      wsRooms[currentRoom].delete(ws);
      if (wsRooms[currentRoom].size === 0) {
        delete wsRooms[currentRoom];
      }
    }
  });
});
