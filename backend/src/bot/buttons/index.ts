import { Markup } from "telegraf";

export const BUTTONS = [
  {
    code: "CREATE_ROOM",
    callback: Markup.button.callback("🆕 Создать комнату", "CREATE_ROOM"),
  },
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
  {
    code: "BATTLE_START",
    callback: Markup.button.callback("⚔️ Начать бой", "BATTLE_START"),
  },
  {
    code: "CHANGE_MODIFIER",
    callback: Markup.button.callback(
      "⚔️ Изменить модификатор",
      "CHANGE_MODIFIER",
    ),
  },
];

export function getButton(codes: string[]) {
  return BUTTONS.filter((btn) => codes.includes(btn.code)).map(
    (btn) => btn.callback,
  );
}
