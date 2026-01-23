import { Telegraf } from "telegraf";
import "dotenv/config";
import { TSession } from "../types";
import { sessionMiddleware } from "./middlewares/session";
import { battleActions } from "./actions/battle";
import { startActions } from "./actions/start";
import { roomActions } from "./actions/room";
import { cubeActions } from "./actions/cube";
import { nickActions } from "./actions/nick";
import { sexActions } from "./actions/sex";
import { dmgActions } from "./actions/dmg";
import { lvlActions } from "./actions/level";
import { myActions } from "./actions/my";
import { textActions } from "./actions/text";
import { modifierActions } from "./actions/modifier";

declare module "telegraf" {
  interface Context {
    session: TSession;
  }
}

const BOT_TOKEN = process.env.BOT_TOKEN || "<YOUR_BOT_TOKEN>";
const bot = new Telegraf(BOT_TOKEN);

bot.use(sessionMiddleware);

startActions(bot);
roomActions(bot);
cubeActions(bot);
nickActions(bot);
sexActions(bot);
dmgActions(bot);
lvlActions(bot);
myActions(bot);
battleActions(bot);
textActions(bot);
modifierActions(bot);

bot.catch((err, ctx) => {
  console.error("TELEGRAF ERROR:", err);
  try {
    ctx.reply("😵 Что-то пошло не так, но бот не упал!");
  } catch {}
});

bot.launch();
console.log("Telegram bot started 🚀");
