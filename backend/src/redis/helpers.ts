import { IPlayer, IRoomEvent } from "../types";
import {
  broadcastCubeUpdate,
  broadcastRoomEvent,
  broadcastRoomState,
} from "../ws/broadcasts";
import { redis } from ".";
import { HISTORY_LIMIT, ROOM_TTL } from "../config";

export async function createRoom(code: string) {
  const exists = await redis.exists(`room:${code}`);
  if (exists) return false;
  console.log("Комната " + code + " создана.");
  await redis.hset(`room:${code}`, "createdAt", Date.now().toString());
  await redis.expire(`room:${code}`, ROOM_TTL);
  return true;
}

export async function roomExists(roomCode: string): Promise<boolean> {
  const key = `room:${roomCode}`;
  const exists = await redis.exists(key);
  console.log(
    exists === 1
      ? `Комната ${roomCode} существует.`
      : `Комнаты ${roomCode} не существует.`,
  );
  return exists === 1;
}

export async function addPlayer(roomCode: string, player: IPlayer) {
  const key = `room:${roomCode}:players`;
  await redis.hset(key, player.id, JSON.stringify(player));
  await redis.expire(key, ROOM_TTL);
  await broadcastRoomEvent(roomCode, {
    timestamp: Date.now(),
    playerId: player.id,
    text: `Игрок ${player.nickname} вошел в комнату`,
  });
}

export async function getPlayers(
  roomCode: string,
): Promise<Record<string, IPlayer>> {
  const key = `room:${roomCode}:players`;
  const raw = await redis.hgetall(key);

  const players: Record<string, IPlayer> = {};
  for (const id in raw) {
    players[id] = JSON.parse(raw[id]);
  }
  return players;
}

export async function getPlayer(roomCode: string, playerId: string) {
  const key = `room:${roomCode}:players`;
  const p = await redis.hget(key, playerId);
  if (!p) return null;
  return JSON.parse(p) as IPlayer;
}

export async function updatePlayer(
  roomCode: string,
  playerId: string,
  updates: Partial<IPlayer>,
  type?: string,
) {
  const key = `room:${roomCode}:players`;
  const p = await redis.hget(key, playerId);
  if (!p) throw new Error("Player not found");
  const player = JSON.parse(p) as IPlayer;
  const newPlayer = { ...player, ...updates };
  await redis.hset(key, playerId, JSON.stringify(newPlayer));
  await redis.expire(key, ROOM_TTL);
  await broadcastRoomState(roomCode);
  if (player.damage !== newPlayer.damage) {
    await broadcastRoomEvent(roomCode, {
      timestamp: Date.now(),
      playerId,
      text: `Игрок ${player.nickname} изменил свой урон на ${newPlayer.damage}`,
    });
  }
  if (player.level !== newPlayer.level) {
    await broadcastRoomEvent(roomCode, {
      timestamp: Date.now(),
      playerId,
      text: `Игрок ${player.nickname} изменил свой уровень на ${newPlayer.level}`,
    });
  }
  if (player.modifier !== newPlayer.modifier) {
    await broadcastRoomEvent(roomCode, {
      timestamp: Date.now(),
      playerId,
      text: `Игрок ${player.nickname} изменил свой модификатор на ${newPlayer.modifier}`,
    });
  }
  if (player.sex !== newPlayer.sex) {
    await broadcastRoomEvent(roomCode, {
      timestamp: Date.now(),
      playerId,
      text: `Игрок ${player.nickname} изменил свой пол на ${newPlayer.sex}`,
    });
  }
  if (type === "death") {
    await broadcastRoomEvent(roomCode, {
      timestamp: Date.now(),
      playerId,
      text: `Игрок ${player.nickname} погиб. ☠️ Весь шмот потерян.  `,
    });
  }
  return newPlayer;
}

export async function updateCube(
  roomCode: string,
  playerId: string,
  cube: string,
) {
  const playersObj = await getPlayers(roomCode);
  const player = playersObj[playerId];
  await broadcastCubeUpdate(roomCode, playerId, cube);
  await broadcastRoomEvent(roomCode, {
    timestamp: Date.now(),
    playerId,
    text: `Игрок ${player.nickname} бросил кубик на ${cube}`,
  });
  return;
}

export async function getRoomsForPlayer(playerId: string): Promise<string[]> {
  const keys = await redis.keys("room:*:players");
  const result: string[] = [];
  for (const key of keys) {
    const players = await redis.hgetall(key);
    if (players[playerId]) result.push(key.split(":")[1]);
  }
  return result;
}

export async function leaveRoom(roomCode: string, playerId: string) {
  const playersObj = await getPlayers(roomCode);
  const player = playersObj[playerId];
  const key = `room:${roomCode}:players`;
  await redis.hdel(key, playerId);
  await broadcastRoomState(roomCode);
  await broadcastRoomEvent(roomCode, {
    timestamp: Date.now(),
    playerId,
    text: `Игрок ${player.nickname} покинул комнату`,
  });
}

export async function addRoomEvent(
  room: string,
  playerId: string,
  text: string,
) {
  const event: IRoomEvent = {
    timestamp: Date.now(),
    playerId,
    text,
  };
  await redis.lpush(`room:${room}:history`, JSON.stringify(event));
  await redis.ltrim(`room:${room}:history`, 0, HISTORY_LIMIT - 1);
  return event;
}

export async function getRoomHistory(
  room: string,
  limit = 50,
): Promise<IRoomEvent[]> {
  const raw = await redis.lrange(`room:${room}:history`, 0, limit - 1);
  return raw.map((item) => JSON.parse(item));
}
