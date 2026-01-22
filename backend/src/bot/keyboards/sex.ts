import { Markup } from "telegraf";

export function sexKeyboard() {
  return Markup.inlineKeyboard([
    Markup.button.callback("🧑 Мужчина", "SEX_M"),
    Markup.button.callback("👩 Женщина", "SEX_F"),
  ]);
}
