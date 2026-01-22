import { Context, Markup, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";
import {
  addPlayer,
  createRoom,
  getPlayers,
  getRoomsForPlayer,
  leaveRoom,
} from "../../redis/helpers";
import { generateId } from "../../functions/generateId";
import { IPlayer } from "../../types";
import { getButton } from "../buttons";
import { formatRoomStats } from "../../functions/formatRoomStats";
import { defaultKeyboard } from "../keyboards/default";

export function roomActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "CREATE_ROOM",
    safe(async (ctx) => {
      const playerId = ctx.from.id.toString();

      try {
        const roomCode = generateId();
        ctx.session.dmgPage = 0;
        ctx.session.waitingFor = undefined;

        const player: IPlayer = {
          id: playerId,
          nickname: "",
          level: 1,
          damage: 0,
          sex: "мужчина",
        };

        await createRoom(roomCode);
        await addPlayer(roomCode, player);
        await ctx.deleteMessage();
        ctx.reply(
          `Ты создал комнату ${roomCode} 🚪. Установи ник:`,
          Markup.inlineKeyboard([
            getButton(["SET_NICK"]),
            getButton(["LEAVE_ROOM"]),
          ]),
        );
        ctx.session.waitingFor = undefined;
        return;
      } catch (err) {
        console.error(err);
        ctx.reply("❌ Не удалось создать комнату. Попробуй снова.");
      }
    }),
  );

  bot.action(
    "JOIN_ROOM",
    safe(async (ctx) => {
      await ctx.deleteMessage();
      ctx.session.waitingFor = "ROOM_CODE";
      ctx.reply("Напиши код комнаты 🔑:");
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    "LEAVE_ROOM",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply(
          "Ты не в комнате ❌",
          Markup.inlineKeyboard([
            getButton(["CREATE_ROOM"]),
            getButton(["JOIN_ROOM"]),
          ]),
        );
      const room = rooms[0];
      await leaveRoom(room, ctx.from.id.toString());

      ctx.reply(
        `Ты вышел из комнаты ${room} 🚪`,
        Markup.inlineKeyboard([
          getButton(["CREATE_ROOM"]),
          getButton(["JOIN_ROOM"]),
        ]),
      );
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    "ROOM_STATS",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply(
          "Ты не в комнате ❌",
          Markup.inlineKeyboard([
            getButton(["CREATE_ROOM"]),
            getButton(["JOIN_ROOM"]),
          ]),
        );
      const room = rooms[0];
      const players = await getPlayers(room);

      ctx.reply(
        `🏟 Комната ${room}:\n\n${formatRoomStats(players)}`,
        defaultKeyboard(),
      );
      ctx.answerCbQuery();
    }),
  );
}
