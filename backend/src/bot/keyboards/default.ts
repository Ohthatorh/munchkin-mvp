import { Markup } from "telegraf";
import { getButton } from "../buttons";

export function defaultKeyboard() {
  return Markup.inlineKeyboard([
    getButton(["BATTLE_START"]),
    getButton(["GET_CUBE"]),
    getButton(["SET_LEVEL"]),
    getButton(["SET_DMG"]),
    getButton(["SET_SEX"]),
    getButton(["ROOM_STATS"]),
    getButton(["MY_STATS"]),
    getButton(["DIE"]),
    getButton(["LEAVE_ROOM"]),
  ]);
}
