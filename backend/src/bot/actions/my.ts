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

export function myActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "DIE",
    safe(async (ctx) => {
      const playerId = ctx.from.id.toString();
      const rooms = await getRoomsForPlayer(playerId);
      await ctx.deleteMessage();

      if (!rooms.length) {
        return ctx.reply("Ты не в комнате ❌", startKeyboard());
      }

      const room = rooms[0];
      await updatePlayer(
        room,
        playerId,
        {
          damage: 0,
        },
        "death",
      );

      ctx.reply(
        "☠️ Ты погиб! Весь шмот потерян. Урон теперь 0.",
        defaultKeyboard(),
      );
      ctx.answerCbQuery();
    }),
  );

  bot.action(
    "MY_STATS",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());
      const room = rooms[0];
      const player = await getPlayer(room, ctx.from.id.toString());
      if (!player) return ctx.reply("Ты не в комнате ❌", startKeyboard());
      if (!player.nickname) return ctx.reply("Сначала установи ник 📝");

      ctx.reply(
        `📌 Комната: ${room}\n` +
          `👤 Ник: ${player.nickname}\n` +
          `⬆️ LVL: ${player.level}\n` +
          `⚔️ DMG: ${player.damage}\n` +
          `👥 MODIFIER: ${player.modifier}\n` +
          `🎯 TOTAL: ${player.level + player.damage + player.modifier}\n` +
          `🧑‍🤝‍🧑 Пол: ${player.sex}`,
        defaultKeyboard(),
      );
      ctx.answerCbQuery();
    }),
  );
}
