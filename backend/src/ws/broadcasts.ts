import { addRoomEvent, getPlayers } from "../redis/helpers";
import { IRoomEvent } from "../types";
import { wsRooms } from "./wsRooms";

export async function broadcastRoomState(roomCode: string) {
  if (!wsRooms[roomCode]) return;

  const playersObj = await getPlayers(roomCode);
  const players = Object.values(playersObj);

  const msg = JSON.stringify({ type: "ROOM_STATE", data: players });
  wsRooms[roomCode].forEach((client) => client.send(msg));
}

export async function broadcastCubeUpdate(
  roomCode: string,
  playerId: string,
  cube: string,
) {
  if (!wsRooms[roomCode]) return;
  try {
    const playersObj = await getPlayers(roomCode);
    const player = playersObj[playerId];
    const playerWithCube = { ...player, cube };
    const msg = JSON.stringify({ type: "GET_CUBE", data: playerWithCube });
    wsRooms[roomCode].forEach((client) => client.send(msg));
  } catch (error) {
    console.error(error);
  }
}

export async function broadcastRoomEvent(room: string, event: IRoomEvent) {
  if (!wsRooms[room]) return;
  await addRoomEvent(room, event.playerId, event.text);
  const msg = JSON.stringify({ type: "ROOM_EVENT", data: event });
  wsRooms[room].forEach((client) => client.send(msg));
}

export async function broadcastRoomBattle(room: string, event: IRoomEvent) {
  broadcastRoomEvent(room, event);
}
