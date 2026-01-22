import { Markup } from "telegraf";

export function dmgKeyboard(page: number, isInBattle?: boolean) {
  const start = page * 10;
  const end = start + 9;
  const nums = Array.from({ length: 9 }, (_, i) => start + i).filter(
    (n) => n <= 100,
  );
  const last = end <= 100 ? end : 100;

  const rows: any[][] = [];

  // 1 2 3
  rows.push(
    nums
      .slice(0, 3)
      .map((n) =>
        Markup.button.callback(
          `${n}⚔️`,
          isInBattle ? `BATTLE_MONSTER_DMG_${n}` : `DMG_SET_${n}`,
        ),
      ),
  );
  // 4 5 6
  rows.push(
    nums
      .slice(3, 6)
      .map((n) =>
        Markup.button.callback(
          `${n}⚔️`,
          isInBattle ? `BATTLE_MONSTER_DMG_${n}` : `DMG_SET_${n}`,
        ),
      ),
  );
  // 7 8 9
  rows.push(
    nums
      .slice(6, 9)
      .map((n) =>
        Markup.button.callback(
          `${n}⚔️`,
          isInBattle ? `BATTLE_MONSTER_DMG_${n}` : `DMG_SET_${n}`,
        ),
      ),
  );
  // ◀️ 10 ▶️
  const arrowRow: any[] = [];
  if (page > 0) arrowRow.push(Markup.button.callback("◀️", "DMG_LEFT"));
  arrowRow.push(Markup.button.callback(`${last}⚔️`, `DMG_SET_${last}`));
  if (page < 9) arrowRow.push(Markup.button.callback("▶️", "DMG_RIGHT"));

  rows.push(arrowRow);
  return Markup.inlineKeyboard(rows);
}
