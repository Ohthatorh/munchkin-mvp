import { Context, Markup, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";
import {
  addPlayer,
  getPlayer,
  getRoomsForPlayer,
  roomExists,
  updatePlayer,
} from "../../redis/helpers";
import { startKeyboard } from "../keyboards/start";
import { defaultKeyboard } from "../keyboards/default";
import { message } from "telegraf/filters";
import { IPlayer } from "../../types";
import { getButton } from "../buttons";

export function textActions(bot: Telegraf<Context<Update>>) {
  bot.on(
    message("text"),
    safe(async (ctx) => {
      const input = ctx.message.text;
      const waitingFor = ctx.session?.waitingFor;
      const playerId = ctx.from.id.toString();
      const rooms = await getRoomsForPlayer(playerId);
      const inRoom = rooms.length > 0;
      const room = rooms[0];

      if (waitingFor) {
        switch (waitingFor) {
          case "ROOM_CODE":
            const roomCode = input.toUpperCase();
            if (!(await roomExists(roomCode)))
              return ctx.reply(
                `Комнаты ${roomCode} не существует ❌`,
                startKeyboard(),
              );
            if (rooms.includes(roomCode))
              return ctx.reply(
                `Ты уже в комнате ${roomCode} 🚪`,
                defaultKeyboard(),
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
              modifier: 0,
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
              return ctx.reply("Ты не в комнате ❌", startKeyboard());
            await updatePlayer(room, playerId, { nickname: input });
            await ctx.deleteMessage();
            ctx.reply(`Ник установлен: 📝 ${input}`, defaultKeyboard());
            ctx.session.waitingFor = undefined;
            return;
          case "MODIFIER":
            if (!inRoom)
              return ctx.reply("Ты не в комнате ❌", startKeyboard());
            if (isNaN(Number(input)))
              return ctx.reply("Не число ты чо даун?", defaultKeyboard());
            await updatePlayer(room, playerId, { modifier: input });
            await ctx.deleteMessage();
            ctx.reply(
              `Твой модификатор теперь: 📝 ${input}`,
              defaultKeyboard(),
            );
            ctx.session.waitingFor = undefined;
            return;
        }
      }

      return ctx.reply(`Команды нет ты чо даун спасибо 👀`, defaultKeyboard());
    }),
  );
}
