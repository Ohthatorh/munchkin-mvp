import { Telegraf } from "telegraf";
import {
  addPlayer,
  updatePlayer,
  getPlayers,
  Player,
  roomExists,
} from "./rooms";
import { redis } from "./redisClient";

const BOT_TOKEN = process.env.BOT_TOKEN || "<YOUR_BOT_TOKEN>";
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) =>
  ctx.reply("Привет! Используй /join <ROOMCODE> чтобы присоединиться")
);

// /join <ROOMCODE>
bot.command("join", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const roomCode = args[1]?.toUpperCase();
  if (!roomCode) return ctx.reply("Используй: /join <ROOMCODE>");

  if (!(await roomExists(roomCode)))
    return ctx.reply(`Комната ${roomCode} не существует!`);

  const player: Player = {
    id: ctx.from.id.toString(),
    nickname: "",
    level: 1,
    damage: 0,
  };

  try {
    await addPlayer(roomCode, player);
    ctx.reply(
      `Ты присоединился к комнате ${roomCode}. Установи ник /nick <имя>`
    );
  } catch (err: any) {
    ctx.reply(`Ошибка: ${err.message}`);
  }
});

// /nick <NAME>
bot.command("nick", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const nick = args[1];
  if (!nick) return ctx.reply("Используй: /nick <имя>");

  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате");

  if (!(await roomExists(rooms[0])))
    return ctx.reply("Комнаты больше не существует!");

  try {
    await updatePlayer(rooms[0], ctx.from.id.toString(), { nickname: nick });
    ctx.reply(`Твой ник установлен: ${nick}`);
  } catch (err: any) {
    ctx.reply(`Ошибка: ${err.message}`);
  }
});

// /lvl <N>
bot.command("lvl", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const lvl = parseInt(args[1]);
  if (isNaN(lvl) || lvl < 1 || lvl > 10)
    return ctx.reply("LVL должен быть 1-10");

  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате");

  if (!(await roomExists(rooms[0])))
    return ctx.reply("Комнаты больше не существует!");

  await updatePlayer(rooms[0], ctx.from.id.toString(), { level: lvl });
  ctx.reply(`LVL установлен: ${lvl}`);
});

// /dmg <N>
bot.command("dmg", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const dmg = parseInt(args[1]);
  if (isNaN(dmg) || dmg < 0) return ctx.reply("DMG должен быть >= 0");

  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате");

  if (!(await roomExists(rooms[0])))
    return ctx.reply("Комнаты больше не существует!");

  await updatePlayer(rooms[0], ctx.from.id.toString(), { damage: dmg });
  ctx.reply(`DMG установлен: ${dmg}`);
});

// функция поиска комнаты игрока
async function getRoomsForPlayer(playerId: string): Promise<string[]> {
  const keys = await redis.keys("room:*:players");
  const result: string[] = [];
  for (const key of keys) {
    const players = await redis.hgetall(key);
    if (players[playerId]) result.push(key.split(":")[1]);
  }
  return result;
}
