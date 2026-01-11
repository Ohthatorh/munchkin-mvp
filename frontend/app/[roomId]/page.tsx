"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import WebSocket from "isomorphic-ws";

interface Player {
  id: string;
  nickname: string;
  level: number;
  damage: number;
}

export default function Room() {
  const params = useParams();
  const roomId = params.roomId;
  const [players, setPlayers] = useState<Player[]>([]);
  console.log(players);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const socket = new WebSocket("ws://195.161.114.116:3001");
    wsRef.current = socket; // сохраняем в ref, не в state

    socket.onopen = () => {
      socket.send(
        JSON.stringify({ type: "JOIN_ROOM", data: { roomCode: roomId } })
      );
    };

    socket.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data.toString());
      console.log(msg);
      if (msg.type === "ROOM_STATE") setPlayers(msg.data);
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [roomId]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Комната {roomId}</h1>
      <table
        style={{ width: "50%", marginTop: 20, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Ник</th>
            <th>LVL</th>
            <th>DMG</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>{p.nickname}</td>
              <td>{p.level}</td>
              <td>{p.damage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
