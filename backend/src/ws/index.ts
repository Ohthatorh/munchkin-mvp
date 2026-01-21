import { WebSocket, WebSocketServer } from "ws";
import { httpServer } from "../server";

export const rooms: Record<string, Set<WebSocket>> = {};
export const wss = new WebSocketServer({ server: httpServer });

console.log("WebSocket server started 🚀");
