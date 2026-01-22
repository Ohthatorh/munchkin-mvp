import { WebSocket } from "ws";

export const wsRooms: Record<string, Set<WebSocket>> = {};
