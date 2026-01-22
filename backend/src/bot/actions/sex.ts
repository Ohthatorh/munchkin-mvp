import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";
import { sexKeyboard } from "../keyboards/sex";
import { getRoomsForPlayer, updatePlayer } from "../../redis/helpers";
import { startKeyboard } from "../keyboards/start";
import { defaultKeyboard } from "../keyboards/default";

export function sexActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "SET_SEX",
    safe(async (ctx) => {
      await ctx.deleteMessage();
      ctx.reply("Выбери пол 👤:", sexKeyboard());
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    "SEX_M",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());
      const room = rooms[0];
      await updatePlayer(room, ctx.from.id.toString(), { sex: "мужчина" });

      ctx.reply("Пол установлен: 🧑 Мужчина", defaultKeyboard());
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    "SEX_F",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());
      const room = rooms[0];
      await updatePlayer(room, ctx.from.id.toString(), { sex: "женщина" });

      ctx.reply("Пол установлен: 👩 Женщина", defaultKeyboard());
      ctx.answerCbQuery();
    }),
  );
}
