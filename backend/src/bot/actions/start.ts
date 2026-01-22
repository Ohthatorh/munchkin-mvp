import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";
import { getPlayer, getRoomsForPlayer } from "../../redis/helpers";
import { startKeyboard } from "../keyboards/start";
import { defaultKeyboard } from "../keyboards/default";

export function startActions(bot: Telegraf<Context<Update>>) {
  bot.command(
    "start",
    safe(async (ctx) => {
      const playerId = ctx.from.id.toString();
      const rooms = await getRoomsForPlayer(playerId);

      if (rooms.length) {
        // Игрок уже в комнате — восстанавливаем состояние
        ctx.session.dmgPage = ctx.session.dmgPage ?? 0;
        ctx.session.waitingFor = undefined;

        const room = rooms[0];
        const player = await getPlayer(room, playerId);
        if (!player) {
          // на всякий случай, если игрока нет в комнате
          ctx.reply(
            `Что-то пошло не так, ты в комнате ${room}, но тебя там нет.`,
            startKeyboard(),
          );
          return;
        }

        return ctx.reply(
          `📌 Комната: ${room}\n` +
            `👤 Ник: ${player.nickname || "не установлен"}\n` +
            `⬆️ LVL: ${player.level}\n` +
            `⚔️ DMG: ${player.damage}\n` +
            `🎯 TOTAL: ${player.level + player.damage}\n` +
            `🧑‍🤝‍🧑 Пол: ${player.sex}`,
          defaultKeyboard(),
        );
      } else {
        // Игрок не в комнате — обычный старт
        ctx.reply(
          `Привет, ${ctx.from.first_name}! Выбери действие:`,
          startKeyboard(),
        );
      }
    }),
  );
}
