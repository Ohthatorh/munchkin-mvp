import { wsRooms } from ".";
import { addRoomEvent, getPlayers } from "../redis/helpers";
import { IRoomEvent } from "../types";

export async function broadcastRoomstate(roomCode: string) {
  console.log("Broadcasting room state for room:", roomCode);
  console.log(wsRooms);
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

export async function broadcastWss(room: string, payload: any) {
  broadcastRoomEvent(room, { type: "BATTLE", ...payload });
}
