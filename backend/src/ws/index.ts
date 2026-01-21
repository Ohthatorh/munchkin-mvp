import { WebSocketServer } from "ws";
import { httpServer } from "../server";

export const wss = new WebSocketServer({ server: httpServer });
