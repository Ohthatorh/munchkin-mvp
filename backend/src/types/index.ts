export interface IPlayer {
  id: string;
  nickname: string;
  level: number;
  damage: number;
  sex: string;
}

export interface IRoom {
  code: string;
  players: Record<string, IPlayer>;
}

export type TSession = {
  waitingFor?: "NICK" | "ROOM_CODE";
  dmgPage?: number;
};

export interface WSMessage {
  type: string;
  data: any;
}

export interface IRoomEvent {
  timestamp: number;
  playerId: string;
  text: string;
}
