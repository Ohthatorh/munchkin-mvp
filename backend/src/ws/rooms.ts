import { WebSocket } from "ws";

export const rooms: Record<string, Set<WebSocket>> = {};
