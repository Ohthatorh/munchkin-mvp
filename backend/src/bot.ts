import { Telegraf, Markup, session } from "telegraf";
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

// Подключаем сессии для временного хранения состояния пользователя
bot.use(session());

type MySession = {
  waitingFor?: "NICK" | "ROOM_CODE" | "LEVEL" | "DMG" | "SEX";
};
declare module "telegraf" {
  interface Context {
    session: MySession;
  }
}

// Главное меню
const mainMenu = Markup.keyboard([
  ["Войти в комнату", "Выйти из комнаты"],
  ["Установить ник", "Изменить уровень", "Изменить урон"],
  ["Мои статы", "Статистика комнаты"],
  ["Установить пол"],
])
  .resize()
  .oneTime();

// Старт бота
bot.start((ctx) => {
  ctx.session = {};
  ctx.reply(
    `Привет, ${ctx.from.first_name}! Я бот для Munchkin. Выбери действие:`,
    mainMenu
  );
});

// ----------- ОБРАБОТКА REPLY КНОПОК -----------

bot.hears("Войти в комнату", (ctx) => {
  ctx.session.waitingFor = "ROOM_CODE";
  ctx.reply("Напиши код комнаты (например: ABCD):");
});

bot.hears("Выйти из комнаты", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате.");
  // если несколько комнат — берём первую
  const room = rooms[0];
  await leaveRoom(room, ctx.from.id.toString());
  ctx.reply(`Вы вышли из комнаты ${room}`);
});

bot.hears("Установить ник", (ctx) => {
  ctx.session.waitingFor = "NICK";
  ctx.reply("Напиши свой ник:");
});

bot.hears("Изменить уровень", async (ctx) => {
  ctx.session.waitingFor = "LEVEL";
  ctx.reply("Напиши новый уровень (1-10):");
});

bot.hears("Изменить урон", (ctx) => {
  ctx.session.waitingFor = "DMG";
  ctx.reply("Напиши новый урон (0 и больше):");
});

bot.hears("Мои статы", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате.");
  const room = rooms[0];
  const player = await getPlayer(room, ctx.from.id.toString());
  if (!player) return ctx.reply("Ты не в комнате.");
  if (!player.nickname) return ctx.reply("Сначала установи ник.");
  ctx.reply(
    `Комната: ${room}\nНик: ${player.nickname}\nLVL: ${player.level}\nDMG: ${player.damage}`
  );
});

bot.hears("Статистика комнаты", async (ctx) => {
  const rooms = await getRoomsForPlayer(ctx.from.id.toString());
  if (!rooms.length) return ctx.reply("Ты не в комнате.");
  const room = rooms[0];
  const players = await getPlayers(room);
  const message = formatRoomStats(players);
  ctx.reply(`Статистика комнаты ${room}:\n\n${message}`);
});

bot.hears("Установить пол", (ctx) => {
  ctx.session.waitingFor = "SEX";
  ctx.reply(
    "Выбери пол:",
    Markup.keyboard([["мужчина", "женщина"]])
      .resize()
      .oneTime()
  );
});

// ----------- ОБРАБОТКА ВВОДА СООБЩЕНИЙ -----------

bot.on("text", async (ctx) => {
  const input = ctx.message.text;
  const waitingFor = ctx.session.waitingFor;

  if (!waitingFor) return; // ничего не ждем

  const playerId = ctx.from.id.toString();
  const rooms = await getRoomsForPlayer(playerId);
  const room = rooms[0];

  switch (waitingFor) {
    case "ROOM_CODE":
      const roomCode = input.toUpperCase();
      if (!(await roomExists(roomCode)))
        return ctx.reply(`Комнаты ${roomCode} не существует.`);
      const roomKeys = await getRoomsForPlayer(playerId);
      if (roomKeys.includes(roomCode))
        return ctx.reply(`Ты уже в комнате ${roomCode}.`);
      if (roomKeys.length > 0 && roomKeys[0] !== roomCode)
        return ctx.reply(
          `Ты уже в комнате ${roomKeys[0]}. Выйди из нее командой "Выйти из комнаты".`
        );

      const player: Player = {
        id: playerId,
        nickname: "",
        level: 1,
        damage: 0,
        sex: "мужчина",
      };

      await addPlayer(roomCode, player);
      ctx.reply(
        `Ты вошел в комнату ${roomCode}. Напиши ник командой "Установить ник".`
      );
      break;

    case "NICK":
      if (!room) return ctx.reply("Ты не в комнате.");
      await updatePlayer(room, playerId, { nickname: input });
      ctx.reply(`Ник установлен: ${input}`);
      break;

    case "LEVEL":
      if (!room) return ctx.reply("Ты не в комнате.");
      const lvl = parseInt(input);
      if (isNaN(lvl) || lvl < 1 || lvl > 10)
        return ctx.reply("Уровень должен быть 1-10.");
      await updatePlayer(room, playerId, { level: lvl });
      ctx.reply(`Уровень установлен: ${lvl}`);
      break;

    case "DMG":
      if (!room) return ctx.reply("Ты не в комнате.");
      const dmg = parseInt(input);
      if (isNaN(dmg) || dmg < 0)
        return ctx.reply("Урон не может быть меньше 0.");
      await updatePlayer(room, playerId, { damage: dmg });
      ctx.reply(`Урон установлен: ${dmg}`);
      break;

    case "SEX":
      if (!room) return ctx.reply("Ты не в комнате.");
      if (input !== "мужчина" && input !== "женщина")
        return ctx.reply("Выбери: мужчина или женщина");
      await updatePlayer(room, playerId, { sex: input });
      ctx.reply(`Пол установлен: ${input}`);
      break;
  }

  ctx.session.waitingFor = undefined; // сбрасываем ожидание
});

// ----------- ЗАПУСК БОТА -----------

bot.launch();
console.log("Telegram bot started");
