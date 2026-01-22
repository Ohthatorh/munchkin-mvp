import { Context } from "telegraf";
import { redis } from "../../redis";
import { ROOM_TTL } from "../../config";

export const sessionMiddleware = async (ctx: Context, next: () => void) => {
  const key = `tg:session:${ctx.from?.id}`;
  let session = await redis.get(key);
  ctx.session = session ? JSON.parse(session) : {};
  await next();
  await redis.set(key, JSON.stringify(ctx.session), "EX", ROOM_TTL);
};
