import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";
import {
  getPlayer,
  getRoomsForPlayer,
  updatePlayer,
} from "../../redis/helpers";
import { startKeyboard } from "../keyboards/start";
import { defaultKeyboard } from "../keyboards/default";
import { dmgKeyboard } from "../keyboards/dmg";

export function dmgActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "SET_DMG",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      const room = rooms[0];
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());
      const player = await getPlayer(room, ctx.from.id.toString());
      const currentDmg = player!.damage;
      ctx.session.dmgPage = 0;
      ctx.reply(
        `Твой текущий урон: ${currentDmg}\nВыбери урон ⚔️:`,
        dmgKeyboard(0),
      );
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    "DMG_LEFT",
    safe(async (ctx) => {
      ctx.session.dmgPage = Math.max(0, (ctx.session.dmgPage || 0) - 1);
      await ctx.editMessageReplyMarkup(
        dmgKeyboard(ctx.session.dmgPage).reply_markup,
      );
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    "DMG_RIGHT",
    safe(async (ctx) => {
      ctx.session.dmgPage = Math.min(9, (ctx.session.dmgPage || 0) + 1);
      await ctx.editMessageReplyMarkup(
        dmgKeyboard(ctx.session.dmgPage).reply_markup,
      );
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    /DMG_SET_(\d+)/,
    safe(async (ctx) => {
      const dmg = parseInt(ctx.match[1]);
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());

      const room = rooms[0];
      await updatePlayer(room, ctx.from.id.toString(), { damage: dmg });

      ctx.reply(`Твой урон теперь ⚔️ ${dmg}`, defaultKeyboard());
      ctx.answerCbQuery();
    }),
  );
}
