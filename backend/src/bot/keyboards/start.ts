import { Markup } from "telegraf";
import { getButton } from "../buttons";

export function startKeyboard() {
  return Markup.inlineKeyboard([
    getButton(["CREATE_ROOM"]),
    getButton(["JOIN_ROOM"]),
    // getButton(["LEAVE_ROOM"]),
  ]);
}
