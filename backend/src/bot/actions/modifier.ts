import { Context, Markup, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";
import {
  getPlayer,
  getRoomsForPlayer,
  updatePlayer,
} from "../../redis/helpers";
import { startKeyboard } from "../keyboards/start";
import { defaultKeyboard } from "../keyboards/default";

export function modifierActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "CHANGE_MODIFIER",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      const room = rooms[0];
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());

      const player = await getPlayer(room, ctx.from.id.toString());
      const currentModifier = player!.modifier;
      ctx.session.waitingFor = "MODIFIER";
      ctx.reply(
        `Твой модификатор: ${currentModifier}\n Напиши новый модификатор ⬆️:`,
      );
      ctx.answerCbQuery();
    }),
  );
}
