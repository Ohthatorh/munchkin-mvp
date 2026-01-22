import { Markup } from "telegraf";

export function battleKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("➕ Помощник", "BATTLE_ADD_ASSIST")],
    [Markup.button.callback("➕ Монстр", "BATTLE_ADD_MONSTER")],
    [Markup.button.callback("➖ Убрать помощника", "BATTLE_REMOVE_ASSIST")],
    [Markup.button.callback("➖ Удалить монстра", "BATTLE_REMOVE_MONSTER")],
    [Markup.button.callback("✏️ Урон монстра", "BATTLE_EDIT_MONSTER")],
    [Markup.button.callback("🎲 Кинуть кубик", "GET_CUBE")],
    [Markup.button.callback("🏆 Я победил", "BATTLE_WIN")],
    [Markup.button.callback("💀 Я проиграл", "BATTLE_LOSE")],
    [Markup.button.callback("🚪 Выйти из боя", "BATTLE_EXIT")],
    [Markup.button.callback("ℹ️ Инфо о бое", "BATTLE_INFO")],
  ]);
}
