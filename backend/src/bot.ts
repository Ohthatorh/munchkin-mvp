import { Markup, Telegraf } from "telegraf";
import {
  addPlayer,
  updatePlayer,
  Player,
  roomExists,
  getRoomsForPlayer,
  leaveRoom,
  getPlayers,
  getPlayer,
} from "./rooms";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN || "<YOUR_BOT_TOKEN>";
const bot = new Telegraf(BOT_TOKEN);

// командой /join ABC123 игрок заходит
bot.command("join", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const roomCode = args[1]?.toUpperCase();

  if (!roomCode)
    return ctx.reply("Используй: /join ID_КОМНАТЫ чтобы войти в комнату.");
  if ((await roomExists(roomCode)) === false)
    return ctx.reply(`Комнаты ${roomCode} не существует.`);
  const roomKeys = await getRoomsForPlayer(ctx.from.id.toString());
  if (roomKeys.includes(roomCode))
    return ctx.reply(`Ты уже в комнате ${roomCode}.`);
  if (roomKeys.length > 0 && roomKeys[0] !== roomCode) {
    return ctx.reply(
      `Ты уже комнате ${roomKeys[0]}. Пожалуйста, выйди из нее командой: /leave ${roomKeys[0]}.`
    );
  }
  const player: Player = {
    id: ctx.from.id.toString(),
    nickname: "",
    level: 1,
    damage: 0,
  };

  try {
    await addPlayer(roomCode, player);
    ctx.reply(
      `Ты в комнате ${roomCode}. Пожалуйста, напиши свой никнейм командой: /nick ВАШ_НИК.`
    );
  } catch (err: any) {
    ctx.reply(`Ошибка: ${err.message}`);
  }
});

// игрок ставит ник
bot.command("nick", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const nick = args[1];
  if (!nick) return ctx.reply("Используй: /nick ВАШ_НИК чтобы установить ник.");

  // находим комнату игрока
  const roomKeys = await getRoomsForPlayer(ctx.from.id.toString());
  if (!roomKeys.length)
    return ctx.reply(
      "Ты не в комнате. Используй /join ID_КОМНАТЫ для входа в комнату."
    );

  const roomCode = roomKeys[0];

  try {
    const updated = await updatePlayer(roomCode, ctx.from.id.toString(), {
      nickname: nick,
    });
    ctx.reply(
      `Твой ник - ${nick}. Ты - манчкин ${updated.level} уровня с ${updated.damage} уроном.`
    );
  } catch (err: any) {
    ctx.reply(`Ошибка: ${err.message}`);
  }
});

bot.command("lvl", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const lvl = parseInt(args[1]);
  if (isNaN(lvl) || lvl < 1 || lvl > 10)
    return ctx.reply("Уровень должен быть от 1 до 10");

  const roomKeys = await getRoomsForPlayer(ctx.from.id.toString());
  if (!roomKeys.length)
    return ctx.reply(
      "Ты не в комнате. Используй /join ID_КОМНАТЫ для входа в комнату."
    );
  const player = await getPlayer(roomKeys[0], ctx.from.id.toString());
  if (player?.nickname.length! < 1) {
    return ctx.reply("Сначала установи ник командой: /nick ВАШ_НИК.");
  }
  await updatePlayer(roomKeys[0], ctx.from.id.toString(), { level: lvl });
  ctx.reply(`Твой уровень изменен. Теперь твой уровень ${lvl}.`);
});

bot.command("dmg", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const dmg = parseInt(args[1]);
  if (isNaN(dmg) || dmg < 0) return ctx.reply("Урон не может быть ниже нуля.");

  const roomKeys = await getRoomsForPlayer(ctx.from.id.toString());
  if (!roomKeys.length)
    return ctx.reply(
      "Ты не в комнате. Используй /join ID_КОМНАТЫ для входа в комнату."
    );
  const player = await getPlayer(roomKeys[0], ctx.from.id.toString());
  if (player?.nickname.length! < 1) {
    return ctx.reply("Сначала установи ник командой: /nick ВАШ_НИК.");
  }
  await updatePlayer(roomKeys[0], ctx.from.id.toString(), { damage: dmg });
  ctx.reply(`Твой урон изменен. Теперь твой урон ${dmg}.`);
});

bot.command("leave", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const roomCode = args[1]?.toUpperCase();
  if (!roomCode)
    return ctx.reply("Используй: /leave ID_КОМНАТЫ для выхода из комнаты.");

  if (!(await roomExists(roomCode)))
    return ctx.reply(`Комнаты ${roomCode} не существует!`);

  await leaveRoom(roomCode, ctx.from.id.toString());
  ctx.reply(`Вы вышли из комнаты ${roomCode}.`);
});

bot.command("stat", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не состоишь ни в одной комнате.");
  const room = rooms[0];
  const players = await getPlayers(room);
  const player = players[ctx.from.id.toString()];
  if (!player) return ctx.reply(`Ты не состоишь в комнате ${room}.`);

  ctx.reply(
    `Комната: ${room}\nНик: ${player.nickname || "не установлен"}\nLVL: ${
      player.level
    }\nDMG: ${player.damage}`
  );
});

bot.launch();
console.log("Telegram bot started");
