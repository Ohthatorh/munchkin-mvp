import { Telegraf, Markup, session } from "telegraf";
import { message } from "telegraf/filters";
import {
  addPlayer,
  updatePlayer,
  roomExists,
  getRoomsForPlayer,
  leaveRoom,
  getPlayers,
  getPlayer,
  updateCube,
} from "./utils/rooms";
import "dotenv/config";
import { IPlayer, TSession } from "./utils/types";
import { formatRoomStats } from "./utils/functions/formatRoomStats";

const BOT_TOKEN = process.env.BOT_TOKEN || "<YOUR_BOT_TOKEN>";
const bot = new Telegraf(BOT_TOKEN);

const buttons = [
  {
    code: "JOIN_ROOM",
    callback: Markup.button.callback("🚪 Войти в комнату", "JOIN_ROOM"),
  },
  {
    code: "LEAVE_ROOM",
    callback: Markup.button.callback("❌ Выйти из комнаты", "LEAVE_ROOM"),
  },
  {
    code: "SET_NICK",
    callback: Markup.button.callback("📝 Установить ник", "SET_NICK"),
  },
  {
    code: "SET_SEX",
    callback: Markup.button.callback("👤 Изменить пол", "SET_SEX"),
  },
  {
    code: "SET_LEVEL",
    callback: Markup.button.callback("⬆️ Изменить уровень", "SET_LEVEL"),
  },
  {
    code: "SET_DMG",
    callback: Markup.button.callback("⚔️ Изменить урон", "SET_DMG"),
  },
  {
    code: "MY_STATS",
    callback: Markup.button.callback("📊 Мои статы", "MY_STATS"),
  },
  {
    code: "ROOM_STATS",
    callback: Markup.button.callback("🏟 Статистика комнаты", "ROOM_STATS"),
  },
  {
    code: "GET_CUBE",
    callback: Markup.button.callback("🎲 Бросить кубик (1-6)", "GET_CUBE"),
  },
  {
    code: "DIE",
    callback: Markup.button.callback("☠️ Погиб", "DIE"),
  },
];

function getButton(codes: string[]) {
  return buttons
    .filter((btn) => codes.includes(btn.code))
    .map((btn) => btn.callback);
}

// ===== Сессии =====
bot.use(session());

declare module "telegraf" {
  interface Context {
    session: TSession;
  }
}

// ===== Helpers =====
function dmgKeyboard(page: number) {
  const start = page * 10;
  const end = start + 9;
  const nums = Array.from({ length: 9 }, (_, i) => start + i).filter(
    (n) => n <= 100,
  );
  const last = end <= 100 ? end : 100;

  const rows: any[][] = [];

  // 1 2 3
  rows.push(
    nums
      .slice(0, 3)
      .map((n) => Markup.button.callback(`${n}⚔️`, `DMG_SET_${n}`)),
  );
  // 4 5 6
  rows.push(
    nums
      .slice(3, 6)
      .map((n) => Markup.button.callback(`${n}⚔️`, `DMG_SET_${n}`)),
  );
  // 7 8 9
  rows.push(
    nums
      .slice(6, 9)
      .map((n) => Markup.button.callback(`${n}⚔️`, `DMG_SET_${n}`)),
  );
  // ◀️ 10 ▶️
  const arrowRow: any[] = [];
  if (page > 0) arrowRow.push(Markup.button.callback("◀️", "DMG_LEFT"));
  arrowRow.push(Markup.button.callback(`${last}⚔️`, `DMG_SET_${last}`));
  if (page < 9) arrowRow.push(Markup.button.callback("▶️", "DMG_RIGHT"));

  rows.push(arrowRow);
  return Markup.inlineKeyboard(rows);
}

// ===== Главное меню =====
bot.command("start", async (ctx) => {
  const playerId = ctx.from.id.toString();

  // Если сессии ещё нет — создаём пустую
  if (!ctx.session) ctx.session = {};

  const rooms = await getRoomsForPlayer(playerId);

  if (rooms.length) {
    // Игрок уже в комнате — восстанавливаем состояние
    ctx.session.dmgPage = ctx.session.dmgPage ?? 0;
    ctx.session.waitingFor = undefined;

    const room = rooms[0];
    const player = await getPlayer(room, playerId);
    if (!player) {
      // на всякий случай, если игрока нет в комнате
      ctx.reply(
        `Что-то пошло не так, ты в комнате ${room}, но тебя там нет.`,
        Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
      );
      return;
    }

    return ctx.reply(
      `📌 Комната: ${room}\n` +
        `👤 Ник: ${player.nickname || "не установлен"}\n` +
        `⬆️ LVL: ${player.level}\n` +
        `⚔️ DMG: ${player.damage}\n` +
        `🎯 TOTAL: ${player.level + player.damage}\n` +
        `🧑‍🤝‍🧑 Пол: ${player.sex}`,
      Markup.inlineKeyboard([
        getButton(["GET_CUBE"]),
        getButton(["SET_LEVEL"]),
        getButton(["SET_DMG"]),
        getButton(["SET_SEX"]),
        getButton(["ROOM_STATS"]),
        getButton(["MY_STATS"]),
        getButton(["DIE"]),
        getButton(["LEAVE_ROOM"]),
      ]),
    );
  } else {
    // Игрок не в комнате — обычный старт
    ctx.reply(
      `Привет, ${ctx.from.first_name}! Выбери действие:`,
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );
  }
});

// ===== Действия =====

bot.action("GET_CUBE", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  const room = rooms[0];
  const playerId = ctx.from.id.toString();
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );

  const roll = Math.floor(Math.random() * 6) + 1;
  const emoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][roll - 1];

  ctx.reply(
    `🎲 Ты бросил кубик!\nВыпало: ${roll} ${emoji}`,
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["DIE"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
  await updateCube(room, playerId, roll.toString());
  ctx.answerCbQuery();
});

bot.action("JOIN_ROOM", async (ctx) => {
  await ctx.deleteMessage();
  ctx.session.waitingFor = "ROOM_CODE";
  ctx.reply("Напиши код комнаты 🔑:");
  ctx.answerCbQuery();
});

bot.action("LEAVE_ROOM", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );
  const room = rooms[0];
  await leaveRoom(room, ctx.from.id.toString());

  ctx.reply(
    `Ты вышел из комнаты ${room} 🚪`,
    Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
  );
  ctx.answerCbQuery();
});

bot.action("SET_NICK", async (ctx) => {
  await ctx.deleteMessage();
  ctx.session.waitingFor = "NICK";
  ctx.reply("Напиши свой ник 📝:");
  ctx.answerCbQuery();
});

bot.action("DIE", async (ctx) => {
  const playerId = ctx.from.id.toString();
  const rooms = await getRoomsForPlayer(playerId);
  await ctx.deleteMessage();

  if (!rooms.length) {
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );
  }

  const room = rooms[0];
  await updatePlayer(room, playerId, {
    damage: 0,
  });

  ctx.reply(
    "☠️ Ты погиб! Весь шмот потерян. Урон теперь 0.",
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
  ctx.answerCbQuery();
});

// ===== LEVEL =====

bot.action("SET_LEVEL", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );

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
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );

  const room = rooms[0];
  await updatePlayer(room, ctx.from.id.toString(), { level: lvl });

  ctx.reply(
    `Твой уровень теперь ⬆️ ${lvl}`,
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["DIE"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
  ctx.answerCbQuery();
});

// ===== DAMAGE =====

bot.action("SET_DMG", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );

  ctx.session.dmgPage = 0;
  ctx.reply("Выбери урон ⚔️:", dmgKeyboard(0));
  ctx.answerCbQuery();
});

bot.action("DMG_LEFT", async (ctx) => {
  ctx.session.dmgPage = Math.max(0, (ctx.session.dmgPage || 0) - 1);
  await ctx.editMessageReplyMarkup(
    dmgKeyboard(ctx.session.dmgPage).reply_markup,
  );
  ctx.answerCbQuery();
});

bot.action("DMG_RIGHT", async (ctx) => {
  ctx.session.dmgPage = Math.min(9, (ctx.session.dmgPage || 0) + 1);
  await ctx.editMessageReplyMarkup(
    dmgKeyboard(ctx.session.dmgPage).reply_markup,
  );
  ctx.answerCbQuery();
});

bot.action(/DMG_SET_(\d+)/, async (ctx) => {
  const dmg = parseInt(ctx.match[1]);
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );

  const room = rooms[0];
  await updatePlayer(room, ctx.from.id.toString(), { damage: dmg });

  ctx.reply(
    `Твой урон теперь ⚔️ ${dmg}`,
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["DIE"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
  ctx.answerCbQuery();
});

bot.action("MY_STATS", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );
  const room = rooms[0];
  const player = await getPlayer(room, ctx.from.id.toString());
  if (!player)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );
  if (!player.nickname) return ctx.reply("Сначала установи ник 📝");

  ctx.reply(
    `📌 Комната: ${room}\n` +
      `👤 Ник: ${player.nickname}\n` +
      `⬆️ LVL: ${player.level}\n` +
      `⚔️ DMG: ${player.damage}\n` +
      `🎯 TOTAL: ${player.level + player.damage}\n` +
      `🧑‍🤝‍🧑 Пол: ${player.sex}`,
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["DIE"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
  ctx.answerCbQuery();
});

bot.action("ROOM_STATS", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );
  const room = rooms[0];
  const players = await getPlayers(room);

  ctx.reply(
    `🏟 Комната ${room}:\n\n${formatRoomStats(players)}`,
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["DIE"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
  ctx.answerCbQuery();
});

bot.action("SET_SEX", async (ctx) => {
  await ctx.deleteMessage();
  ctx.reply(
    "Выбери пол 👤:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🧑 Мужчина", "SEX_M"),
        Markup.button.callback("👩 Женщина", "SEX_F"),
      ],
    ]),
  );
  ctx.answerCbQuery();
});

bot.action("SEX_M", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );
  const room = rooms[0];
  await updatePlayer(room, ctx.from.id.toString(), { sex: "мужчина" });

  ctx.reply(
    "Пол установлен: 🧑 Мужчина",
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["DIE"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
  ctx.answerCbQuery();
});

bot.action("SEX_F", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  await ctx.deleteMessage();
  if (!rooms.length)
    return ctx.reply(
      "Ты не в комнате ❌",
      Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
    );
  const room = rooms[0];
  await updatePlayer(room, ctx.from.id.toString(), { sex: "женщина" });

  ctx.reply(
    "Пол установлен: 👩 Женщина",
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["DIE"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
  ctx.answerCbQuery();
});

// ===== Text handler =====
bot.on(message("text"), async (ctx) => {
  const input = ctx.message.text;
  const waitingFor = ctx.session?.waitingFor;
  const playerId = ctx.from.id.toString();
  const rooms = await getRoomsForPlayer(playerId);
  const inRoom = rooms.length > 0;
  const room = rooms[0];

  // Если бот ожидает ввод (ник или код комнаты)
  if (waitingFor) {
    switch (waitingFor) {
      case "ROOM_CODE":
        const roomCode = input.toUpperCase();
        if (!(await roomExists(roomCode)))
          return ctx.reply(
            `Комнаты ${roomCode} не существует ❌`,
            Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
          );
        if (rooms.includes(roomCode))
          return ctx.reply(
            `Ты уже в комнате ${roomCode} 🚪`,
            Markup.inlineKeyboard([
              getButton(["GET_CUBE"]),
              getButton(["SET_LEVEL"]),
              getButton(["SET_DMG"]),
              getButton(["SET_SEX"]),
              getButton(["ROOM_STATS"]),
              getButton(["MY_STATS"]),
              getButton(["DIE"]),
              getButton(["LEAVE_ROOM"]),
            ]),
          );
        if (rooms.length > 0 && rooms[0] !== roomCode)
          return ctx.reply(
            `Ты уже в другой комнате (${rooms[0]}). Сначала выйди из неё.`,
            Markup.inlineKeyboard([getButton(["LEAVE_ROOM"])]),
          );

        const player: IPlayer = {
          id: playerId,
          nickname: "",
          level: 1,
          damage: 0,
          sex: "мужчина",
        };

        await addPlayer(roomCode, player);
        await ctx.deleteMessage();
        ctx.reply(
          `Ты вошел в комнату ${roomCode} 🚪. Установи ник:`,
          Markup.inlineKeyboard([
            getButton(["SET_NICK"]),
            getButton(["LEAVE_ROOM"]),
          ]),
        );
        ctx.session.waitingFor = undefined;
        return;

      case "NICK":
        if (!inRoom)
          return ctx.reply(
            "Ты не в комнате ❌",
            Markup.inlineKeyboard([getButton(["JOIN_ROOM"])]),
          );
        await updatePlayer(room, playerId, { nickname: input });
        await ctx.deleteMessage();
        ctx.reply(
          `Ник установлен: 📝 ${input}`,
          Markup.inlineKeyboard([
            getButton(["GET_CUBE"]),
            getButton(["SET_LEVEL"]),
            getButton(["SET_DMG"]),
            getButton(["SET_SEX"]),
            getButton(["ROOM_STATS"]),
            getButton(["MY_STATS"]),
            getButton(["DIE"]),
            getButton(["LEAVE_ROOM"]),
          ]),
        );
        ctx.session.waitingFor = undefined;
        return;
    }
  }

  return ctx.reply(
    `Команды нет ты чо даун спасибо 👀`,
    Markup.inlineKeyboard([
      getButton(["GET_CUBE"]),
      getButton(["SET_LEVEL"]),
      getButton(["SET_DMG"]),
      getButton(["SET_SEX"]),
      getButton(["ROOM_STATS"]),
      getButton(["MY_STATS"]),
      getButton(["DIE"]),
      getButton(["LEAVE_ROOM"]),
    ]),
  );
});

// ===== Launch =====

bot.launch();
console.log("Telegram bot started 🚀");
