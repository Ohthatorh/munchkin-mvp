import { Telegraf } from "telegraf";
import { addPlayer, updatePlayer, Player, roomExists } from "./rooms";
import { redis } from "./redisClient";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN || "<YOUR_BOT_TOKEN>";
const bot = new Telegraf(BOT_TOKEN);

// командой /join ABC123 игрок заходит
bot.command("join", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const roomCode = args[1]?.toUpperCase();
  if (!roomCode) return ctx.reply("Usage: /join <ROOMCODE>");
  if (!roomExists(roomCode))
    return ctx.reply(
      `Room ${roomCode} does not exist. Use /create to create it.`
    );

  const player: Player = {
    id: ctx.from.id.toString(),
    nickname: "",
    level: 1,
    damage: 0,
  };

  try {
    await addPlayer(roomCode, player);
    ctx.reply(`Joined room ${roomCode}. Send your nickname with /nick <name>`);
  } catch (err: any) {
    ctx.reply(`Error: ${err.message}`);
  }
});

// игрок ставит ник
bot.command("nick", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const nick = args[1];
  if (!nick) return ctx.reply("Usage: /nick <name>");

  // находим комнату игрока
  const roomKeys = await getRoomsForPlayer(ctx.from.id.toString());
  if (!roomKeys.length) return ctx.reply("You are not in any room");

  const roomCode = roomKeys[0];

  try {
    const updated = await updatePlayer(roomCode, ctx.from.id.toString(), {
      nickname: nick,
    });
    ctx.reply(`Nickname set to ${nick}`);
  } catch (err: any) {
    ctx.reply(`Error: ${err.message}`);
  }
});

// команды lvl/dmg
bot.command("lvl", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const lvl = parseInt(args[1]);
  if (isNaN(lvl) || lvl < 1 || lvl > 10) return ctx.reply("Level must be 1-10");

  const roomKeys = await getRoomsForPlayer(ctx.from.id.toString());
  if (!roomKeys.length) return ctx.reply("You are not in any room");

  await updatePlayer(roomKeys[0], ctx.from.id.toString(), { level: lvl });
  ctx.reply(`Level set to ${lvl}`);
});

bot.command("dmg", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const dmg = parseInt(args[1]);
  if (isNaN(dmg) || dmg < 0) return ctx.reply("Damage must be >= 0");

  const roomKeys = await getRoomsForPlayer(ctx.from.id.toString());
  if (!roomKeys.length) return ctx.reply("You are not in any room");

  await updatePlayer(roomKeys[0], ctx.from.id.toString(), { damage: dmg });
  ctx.reply(`Damage set to ${dmg}`);
});

bot.launch();
console.log("Telegram bot started");

async function getRoomsForPlayer(playerId: string): Promise<string[]> {
  // ищем комнаты, где есть игрок
  const keys = await redis.keys("room:*:players");
  const result: string[] = [];
  for (const key of keys) {
    const players = await redis.hgetall(key);
    if (players[playerId]) result.push(key.split(":")[1]);
  }
  return result;
}
