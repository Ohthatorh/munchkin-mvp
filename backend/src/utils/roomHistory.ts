import { redis } from "../services/redisClient";

export interface IRoomEvent {
  timestamp: number;
  playerId: string;
  text: string;
}

const HISTORY_LIMIT = 10;

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
