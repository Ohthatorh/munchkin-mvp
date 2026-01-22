import { Context, Markup, Telegraf } from "telegraf";
import { getPlayer, getPlayers, getRoomsForPlayer } from "../../redis/helpers";
import { redis } from "../../redis";
import { broadcastRoomBattle, broadcastWss } from "../../ws/broadcasts";
import { defaultKeyboard } from "../keyboards/default";
import { Update } from "telegraf/typings/core/types/typegram";
import { safe } from "../../functions/safeHandler";
import { battleKeyboard } from "../keyboards/battle";
import { dmgKeyboard } from "../keyboards/dmg";

async function finishBattle(ctx: Context, result: "win" | "lose") {
  const playerId = ctx.from!.id.toString();
  const [room] = await getRoomsForPlayer(playerId);

  const raw = await redis.get(`tg:battle:${room}`);
  if (!raw) return ctx.reply("Боя нет");

  await redis.del(`tg:battle:${room}`);

  broadcastWss(room, {
    type: "BATTLE_FINISH",
    by: playerId,
    result,
  });

  ctx.reply(
    result === "win"
      ? "🏆 Бой завершён — победа!"
      : "💀 Бой завершён — поражение!",
    defaultKeyboard(),
  );
}

export function battleActions(bot: Telegraf<Context<Update>>) {
  bot.action(
    "BATTLE_START",
    safe(async (ctx) => {
      const playerId = ctx.from.id.toString();
      const [room] = await getRoomsForPlayer(playerId);
      const player = await getPlayer(room, playerId);
      const exists = await redis.get(`tg:battle:${room}`);
      if (exists) {
        return ctx.reply("В комнате уже идет бой ⚠️");
      }

      const battle = {
        room,
        owner: playerId,
        assistant: null,
        monsters: [],
        active: true,
      };

      await redis.set(`tg:battle:${room}`, JSON.stringify(battle));

      broadcastRoomBattle(room, {
        timestamp: Date.now(),
        playerId,
        text: `Игрок ${player!.nickname} начал бой ⚔️`,
      });

      return ctx.reply(
        "⚔️ Ты начал бой. Добавьте монстра или помощника.",
        battleKeyboard(),
      );
    }),
  );

  bot.action(
    "BATTLE_ADD_ASSIST",
    safe(async (ctx) => {
      const playerId = ctx.from.id.toString();
      const [room] = await getRoomsForPlayer(playerId);

      const players = await getPlayers(room);

      const buttons = Object.keys(players)
        .filter((p) => p !== playerId)
        .map((p) =>
          Markup.button.callback(players[p].nickname, `BATTLE_ASSIST_${p}`),
        );

      return ctx.reply(
        "Выбери помощника:",
        Markup.inlineKeyboard(buttons.map((b) => [b])),
      );
    }),
  );

  bot.action(
    /BATTLE_ASSIST_(.+)/,
    safe(async (ctx) => {
      const assistantId = ctx.match[1];
      const playerId = ctx.from.id.toString();
      const [room] = await getRoomsForPlayer(playerId);

      const raw = await redis.get(`tg:battle:${room}`);
      const battle = JSON.parse(raw!);

      if (battle.assistant) return ctx.reply("Помощник уже есть ⚠️");

      battle.assistant = assistantId;

      await redis.set(`tg:battle:${room}`, JSON.stringify(battle));
      broadcastWss(room, { type: "BATTLE_ASSIST", assistantId });

      ctx.reply("Помощник добавлен", battleKeyboard());
    }),
  );

  bot.action(
    "BATTLE_ADD_MONSTER",
    safe(async (ctx) => {
      const playerId = ctx.from.id.toString();
      const [room] = await getRoomsForPlayer(playerId);

      const raw = await redis.get(`tg:battle:${room}`);
      const battle = JSON.parse(raw!);

      const nextId = battle.monsters.length + 1;

      battle.monsters.push({ id: nextId, dmg: 0 });

      await redis.set(`tg:battle:${room}`, JSON.stringify(battle));

      broadcastWss(room, { type: "BATTLE_ADD_MONSTER", id: nextId });

      ctx.reply(`Монстр #${nextId} добавлен. Укажи урон:`, dmgKeyboard(0));
    }),
  );

  bot.action(
    /BATTLE_MONSTER_DMG_(\d+)_(\d+)/,
    safe(async (ctx) => {
      const monsterId = +ctx.match[1];
      const dmg = +ctx.match[2];

      const playerId = ctx.from.id.toString();
      const [room] = await getRoomsForPlayer(playerId);

      const raw = await redis.get(`tg:battle:${room}`);
      const battle = JSON.parse(raw!);

      const monster = battle.monsters.find((m: any) => m.id === monsterId);
      if (!monster) return;

      monster.dmg = dmg;

      await redis.set(`tg:battle:${room}`, JSON.stringify(battle));

      broadcastWss(room, { type: "BATTLE_MONSTER_DMG", monsterId, dmg });

      ctx.reply(
        `Урон монстра #${monsterId} теперь ⚔️ ${dmg}`,
        battleKeyboard(),
      );
    }),
  );

  bot.action(
    "BATTLE_INFO",
    safe(async (ctx) => {
      const playerId = ctx.from.id.toString();
      const [room] = await getRoomsForPlayer(playerId);

      const raw = await redis.get(`tg:battle:${room}`);
      if (!raw) return ctx.reply("Боя нет");

      const battle = JSON.parse(raw);

      let text = `⚔️ Бой:\n\n`;
      text += `Начал: ${battle.owner}\n`;
      if (battle.assistant) text += `Помощник: ${battle.assistant}\n\n`;

      if (!battle.monsters.length) text += `Монстров нет\n`;
      else {
        text += battle.monsters
          .map((m: any) => `Монстр #${m.id} — DMG ${m.dmg}`)
          .join("\n");
      }

      ctx.reply(text, battle.active ? battleKeyboard() : undefined);
    }),
  );

  bot.action(
    "BATTLE_WIN",
    safe(async (ctx) => {
      finishBattle(ctx, "win");
    }),
  );

  bot.action(
    "BATTLE_LOSE",
    safe(async (ctx) => {
      finishBattle(ctx, "lose");
    }),
  );

  bot.action(
    "BATTLE_EXIT",
    safe(async (ctx) => {
      const playerId = ctx.from.id.toString();
      const [room] = await getRoomsForPlayer(playerId);

      await redis.del(`tg:battle:${room}`);

      broadcastWss(room, { type: "BATTLE_EXIT", playerId });

      ctx.reply(`Игрок вышел из боя`, defaultKeyboard());
    }),
  );
}
