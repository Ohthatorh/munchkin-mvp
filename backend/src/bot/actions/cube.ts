import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";
import { getRoomsForPlayer, updateCube } from "../../redis/helpers";
import { startKeyboard } from "../keyboards/start";
import { defaultKeyboard } from "../keyboards/default";
import { redis } from "../../redis";
import { battleKeyboard } from "../keyboards/battle";

export function cubeActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "GET_CUBE",
    safe(async (ctx) => {
      const rooms = await getRoomsForPlayer(ctx.from.id.toString());
      const room = rooms[0];
      const playerId = ctx.from.id.toString();
      await ctx.deleteMessage();
      if (!rooms.length)
        return ctx.reply("Ты не в комнате ❌", startKeyboard());

      const battle = await redis.get(`tg:battle:${room}`);
      console.log(battle);
      const isPlayerInBattle = battle
        ? JSON.parse(battle).owner === playerId ||
          JSON.parse(battle).assistant === playerId
        : false;
      const roll = Math.floor(Math.random() * 6) + 1;
      const emoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][roll - 1];

      ctx.reply(
        `🎲 Ты бросил кубик!\nВыпало: ${roll} ${emoji}`,
        isPlayerInBattle ? battleKeyboard() : defaultKeyboard(),
      );
      await updateCube(room, playerId, roll.toString());
      ctx.answerCbQuery();
    }),
  );
}
