import { Telegraf, Markup, session } from "telegraf";
import { message } from "telegraf/filters";
import {
  addPlayer,
  updatePlayer,
  Player,
  roomExists,
  getRoomsForPlayer,
  leaveRoom,
  getPlayers,
  getPlayer,
  formatRoomStats,
} from "./rooms";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN || "<YOUR_BOT_TOKEN>";
const bot = new Telegraf(BOT_TOKEN);

// ===== Сессии =====
bot.use(session());

type MySession = {
  waitingFor?: "NICK" | "ROOM_CODE" | "DMG";
  dmgRange?: number; // диапазон DMG (0 => 1..10, 1 => 11..20, ...)
};

declare module "telegraf" {
  interface Context {
    session: MySession;
  }
}

// ===== Главное меню =====
bot.command("start", (ctx) => {
  ctx.session = {};
  ctx.reply(
    `Привет, ${ctx.from.first_name}! Выбери действие:`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🚪 Войти в комнату", "JOIN_ROOM"),
        Markup.button.callback("❌ Выйти из комнаты", "LEAVE_ROOM"),
      ],
      [
        Markup.button.callback("📝 Установить ник", "SET_NICK"),
        Markup.button.callback("👤 Установить пол", "SET_SEX"),
      ],
      [
        Markup.button.callback("⬆️ Изменить уровень", "SET_LEVEL"),
        Markup.button.callback("⚔️ Изменить урон", "SET_DMG"),
      ],
      [
        Markup.button.callback("📊 Мои статы", "MY_STATS"),
        Markup.button.callback("🏟 Статистика комнаты", "ROOM_STATS"),
      ],
    ])
  );
});

// ===== JOIN ROOM =====
bot.action("JOIN_ROOM", (ctx) => {
  ctx.session.waitingFor = "ROOM_CODE";
  ctx.reply("Напиши код комнаты (например: ABCD) 🔑:");
  ctx.answerCbQuery();
});

// ===== LEAVE =====
bot.action("LEAVE_ROOM", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");
  const room = rooms[0];
  await leaveRoom(room, ctx.from.id.toString());
  ctx.reply(`Ты вышел из комнаты ${room} 🚪`);
  ctx.answerCbQuery();
});

// ===== SET NICK =====
bot.action("SET_NICK", (ctx) => {
  ctx.session.waitingFor = "NICK";
  ctx.reply("Напиши свой ник 📝:");
  ctx.answerCbQuery();
});

// ===== SET LEVEL =====
bot.action("SET_LEVEL", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");

  const buttons: any[][] = [];
  for (let i = 1; i <= 10; i += 5) {
    const row = [];
    for (let j = i; j < i + 5 && j <= 10; j++) {
      row.push(Markup.button.callback(`${j}⬆️`, `LEVEL_${j}`));
    }
    buttons.push(row);
  }

  ctx.reply("Выбери уровень ⬆️:", Markup.inlineKeyboard(buttons));
  ctx.answerCbQuery();
});

bot.action(/LEVEL_(\d+)/, async (ctx) => {
  const lvl = parseInt(ctx.match[1]);
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");

  const room = rooms[0];
  await updatePlayer(room, ctx.from.id.toString(), { level: lvl });

  await ctx.editMessageReplyMarkup(null);
  ctx.reply(`Твой уровень теперь ⬆️ ${lvl}`);
  ctx.answerCbQuery();
});

// ===== SET DMG =====
bot.action("SET_DMG", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");

  ctx.session.waitingFor = "DMG";
  ctx.session.dmgRange = 0;

  sendDmgKeyboard(ctx);
  ctx.answerCbQuery();
});

// ===== Генератор клавы DMG =====
function sendDmgKeyboard(ctx) {
  const range = ctx.session.dmgRange ?? 0;
  const start = range * 10 + 1;
  const end = Math.min(start + 9, 100);

  const dmgButtons = [];

  for (let i = start; i <= end; i++) {
    dmgButtons.push(Markup.button.callback(`${i}⚔️`, `DMG_${i}`));
  }

  const row = [
    Markup.button.callback("◀️", "DMG_LEFT"),
    ...dmgButtons,
    Markup.button.callback("▶️", "DMG_RIGHT"),
  ];

  ctx.reply("Выбери урон ⚔️:", Markup.inlineKeyboard([row]));
}

// ===== Пагинация DMG =====
bot.action("DMG_LEFT", async (ctx) => {
  ctx.session.dmgRange = Math.max(0, (ctx.session.dmgRange ?? 0) - 1);

  await ctx.editMessageReplyMarkup(null);
  sendDmgKeyboard(ctx);
  ctx.answerCbQuery();
});

bot.action("DMG_RIGHT", async (ctx) => {
  ctx.session.dmgRange = Math.min(9, (ctx.session.dmgRange ?? 0) + 1); // 100 max → 0-9

  await ctx.editMessageReplyMarkup(null);
  sendDmgKeyboard(ctx);
  ctx.answerCbQuery();
});

// ===== Выбор DMG =====
bot.action(/DMG_(\d+)/, async (ctx) => {
  const dmg = parseInt(ctx.match[1]);
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");

  const room = rooms[0];
  await updatePlayer(room, ctx.from.id.toString(), { damage: dmg });

  await ctx.editMessageReplyMarkup(null);
  ctx.reply(`Твой урон теперь ⚔️ ${dmg}`);
  ctx.answerCbQuery();
});

// ===== SET SEX =====
bot.action("SET_SEX", (ctx) => {
  ctx.reply(
    "Выбери пол 👤:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🧑 Мужчина", "SEX_M"),
        Markup.button.callback("👩 Женщина", "SEX_F"),
      ],
    ])
  );
  ctx.answerCbQuery();
});

bot.action("SEX_M", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");

  const room = rooms[0];
  await updatePlayer(room, ctx.from.id.toString(), { sex: "мужчина" });

  await ctx.editMessageReplyMarkup(null);
  ctx.reply("Пол установлен: 🧑 Мужчина");
  ctx.answerCbQuery();
});

bot.action("SEX_F", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");

  const room = rooms[0];
  await updatePlayer(room, ctx.from.id.toString(), { sex: "женщина" });

  await ctx.editMessageReplyMarkup(null);
  ctx.reply("Пол установлен: 👩 Женщина");
  ctx.answerCbQuery();
});

// ===== MY STATS =====
bot.action("MY_STATS", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");

  const room = rooms[0];
  const player = await getPlayer(room, ctx.from.id.toString());
  if (!player) return ctx.reply("Ты не в комнате ❌");

  if (!player.nickname) return ctx.reply("Сначала установи ник 📝");

  ctx.reply(
    `📌 Комната: ${room}\n👤 Ник: ${player.nickname}\n⬆️ LVL: ${player.level}\n⚔️ DMG: ${player.damage}\n🧑‍🤝‍🧑 Пол: ${player.sex}`
  );
  ctx.answerCbQuery();
});

// ===== ROOM STATS =====
bot.action("ROOM_STATS", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате ❌");

  const room = rooms[0];
  const players = await getPlayers(room);

  const message = formatRoomStats(players);
  ctx.reply(`🏟 Статистика комнаты ${room}:\n\n${message}`);
  ctx.answerCbQuery();
});

// ===== Текстовые ввода =====
bot.on(message("text"), async (ctx) => {
  const input = ctx.message.text;
  const waitingFor = ctx.session.waitingFor;
  if (!waitingFor) return;

  const playerId = ctx.from.id.toString();
  const rooms = await getRoomsForPlayer(playerId);
  const room = rooms[0];

  switch (waitingFor) {
    case "ROOM_CODE":
      const roomCode = input.toUpperCase();
      if (!(await roomExists(roomCode)))
        return ctx.reply(`Комнаты ${roomCode} не существует ❌`);

      const roomKeys = await getRoomsForPlayer(playerId);
      if (roomKeys.includes(roomCode))
        return ctx.reply(`Ты уже в комнате ${roomCode} 🚪`);
      if (roomKeys.length > 0 && roomKeys[0] !== roomCode)
        return ctx.reply(
          `Ты уже в комнате ${roomKeys[0]}. Выйди из нее сначала ❌`
        );

      const player: Player = {
        id: playerId,
        nickname: "",
        level: 1,
        damage: 1,
        sex: "мужчина",
      };

      await addPlayer(roomCode, player);
      ctx.reply(`Ты вошел в комнату ${roomCode} 🚪. Напиши ник 📝`);
      break;

    case "NICK":
      if (!room) return ctx.reply("Ты не в комнате ❌");
      await updatePlayer(room, playerId, { nickname: input });
      ctx.reply(`Ник установлен: 📝 ${input}`);
      break;
  }

  ctx.session.waitingFor = undefined;
});

// ===== Запуск бота =====
bot.launch();
console.log("Telegram bot started 🚀");
