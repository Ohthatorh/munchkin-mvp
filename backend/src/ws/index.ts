import { WebSocketServer } from "ws";
import { httpServer } from "../server";
import { registerWsEvents } from "./events";

export const wss = new WebSocketServer({ server: httpServer });

registerWsEvents(wss);

console.log("WebSocket server started 🚀");
