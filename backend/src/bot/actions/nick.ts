import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";

export function nickActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "SET_NICK",
    safe(async (ctx) => {
      await ctx.deleteMessage();
      ctx.session.waitingFor = "NICK";
      ctx.reply("Напиши свой ник 📝:");
      ctx.answerCbQuery();
    }),
  );
}
