import { redis } from "./redisClient";
import { broadcastCubeUpdate, broadcastRoomState } from "./wsServer";

export interface Player {
  id: string;
  nickname: string;
  level: number;
  damage: number;
  sex: string;
}

export interface Room {
  code: string;
  players: Record<string, Player>;
}

const ROOM_TTL = 12 * 60 * 60; // 12 часов в секундах

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

export async function addPlayer(roomCode: string, player: Player) {
  const key = `room:${roomCode}:players`;
  // const players = await redis.hgetall(key);

  // // проверка уникальности ника без регистра
  // for (const p of Object.values(players)) {
  //   const existing = JSON.parse(p) as Player;
  //   if (existing.nickname.toLowerCase() === player.nickname.toLowerCase()) {
  //     throw new Error("Ник уже занят. Пожалуйста, используй другой ник.");
  //   }
  // }

  await redis.hset(key, player.id, JSON.stringify(player));
  await redis.expire(key, ROOM_TTL);
}

export async function getPlayers(
  roomCode: string,
): Promise<Record<string, Player>> {
  const key = `room:${roomCode}:players`;
  const raw = await redis.hgetall(key);

  const players: Record<string, Player> = {};
  for (const id in raw) {
    players[id] = JSON.parse(raw[id]);
  }
  return players;
}

export async function getPlayer(roomCode: string, playerId: string) {
  const key = `room:${roomCode}:players`;
  const p = await redis.hget(key, playerId);
  if (!p) return null;
  return JSON.parse(p) as Player;
}

export async function updatePlayer(
  roomCode: string,
  playerId: string,
  updates: Partial<Player>,
) {
  const key = `room:${roomCode}:players`;
  const p = await redis.hget(key, playerId);
  if (!p) throw new Error("Player not found");
  const player = JSON.parse(p) as Player;
  const newPlayer = { ...player, ...updates };
  await redis.hset(key, playerId, JSON.stringify(newPlayer));
  await redis.expire(key, ROOM_TTL);
  await broadcastRoomState(roomCode);
  return newPlayer;
}

export async function updateCube(
  roomCode: string,
  playerId: string,
  cube: string,
) {
  await broadcastCubeUpdate(roomCode, playerId, cube);
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
  const key = `room:${roomCode}:players`;
  await redis.hdel(key, playerId);
  await broadcastRoomState(roomCode);
}

export function formatRoomStats(players: Record<string, Player>): string {
  const arr = Object.values(players);

  if (arr.length === 0) return "Комната пуста ❌";

  let result = "🏟 Статистика комнаты🏟\n\n";

  for (const p of arr) {
    const sexEmoji = p.sex === "мужчина" ? "🧑" : "👩";
    const levelEmoji = "⬆️";
    const dmgEmoji = "⚔️";
    const totalEmoji = "🎯";

    result += `🛡️${p.nickname} ${sexEmoji}\n\n`;
    result += `${levelEmoji} Уровень: ${p.level}\n`;
    result += `${dmgEmoji} Урон от шмота: ${p.damage}\n`;
    result += `${totalEmoji} Общий урон: ${p.level + p.damage}\n`;
    result += `────────────────────\n`;
  }

  return result;
}
