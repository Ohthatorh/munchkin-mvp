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

export function lvlActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "SET_LEVEL",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      const room = rooms[0];
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());

      const buttons: any[][] = [];
      for (let i = 1; i <= 10; i += 5) {
        const row = [];
        for (let j = i; j < i + 5 && j <= 10; j++) {
          row.push(Markup.button.callback(`${j}⬆️`, `LEVEL_${j}`));
        }
        buttons.push(row);
      }
      const player = await getPlayer(room, ctx.from.id.toString());
      const currentLevel = player!.level;
      ctx.reply(
        `Твой текущий уровень: ${currentLevel}\n Выбери уровень ⬆️:`,
        Markup.inlineKeyboard(buttons),
      );
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    /LEVEL_(\d+)/,
    safe(async (ctx) => {
      const lvl = parseInt(ctx.match[1]);
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());

      const room = rooms[0];
      await updatePlayer(room, ctx.from.id.toString(), { level: lvl });

      ctx.reply(`Твой уровень теперь ⬆️ ${lvl}`, defaultKeyboard());
      ctx.answerCbQuery();
    }),
  );
}
