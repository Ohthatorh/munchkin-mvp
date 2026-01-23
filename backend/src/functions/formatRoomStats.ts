import { IPlayer } from "../types";

export function formatRoomStats(players: Record<string, IPlayer>): string {
  const arr = Object.values(players);

  if (arr.length === 0) return "Комната пуста ❌";

  let result = "🏟 Статистика комнаты🏟\n\n";

  for (const p of arr) {
    const sexEmoji = p.sex === "мужчина" ? "🧑" : "👩";
    const levelEmoji = "⬆️";
    const dmgEmoji = "⚔️";
    const totalEmoji = "🎯";

    result += `🛡️${p.nickname} ${sexEmoji}\n\n`;
    result += `${levelEmoji} Уровень: ${p.level}\n`;
    result += `${dmgEmoji} Урон от шмота: ${p.damage}\n`;
    result += `${dmgEmoji} Модификатор: ${Number(p.modifier)}\n`;
    result += `${totalEmoji} Общий урон: ${Number(p.level) + Number(p.damage) + Number(p.modifier)}\n`;
    result += `────────────────────\n`;
  }

  return result;
}
