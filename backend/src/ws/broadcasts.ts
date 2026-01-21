import { addRoomEvent, getPlayers } from "../redis/helpers";
import { IRoomEvent } from "../types";
import { rooms } from "./rooms";

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

export async function broadcastRoomEvent(room: string, event: IRoomEvent) {
  if (!rooms[room]) return;
  await addRoomEvent(room, event.playerId, event.text);
  const msg = JSON.stringify({ type: "ROOM_EVENT", data: event });
  rooms[room].forEach((client) => client.send(msg));
}

export async function broadcastWss(room: string, payload: any) {
  broadcastRoomEvent(room, { type: "BATTLE", ...payload });
}
