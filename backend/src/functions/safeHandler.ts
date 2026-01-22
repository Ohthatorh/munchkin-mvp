import { Context } from "telegraf";

export function safe(handler: (ctx: any) => Promise<any>) {
  return async (ctx: Context) => {
    try {
      await handler(ctx);
    } catch (e) {
      console.error(e);
      try {
        await ctx.reply("❌ Ошибка, но бот жив");
      } catch {}
    }
  };
}
