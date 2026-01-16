"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import WebSocket from "isomorphic-ws";

interface Player {
  id: string;
  nickname: string;
  level: number;
  damage: number;
  sex: string;
}

export default function Room() {
  const params = useParams();
  const roomId = params.roomId;
  const [players, setPlayers] = useState<Player[]>([]);
  const [cube, setCube] = useState<(Player & { cube: string }) | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const socket = new WebSocket(`wss://munchhelper.com/room/${roomId}`);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({ type: "JOIN_ROOM", data: { roomCode: roomId } }),
      );
    };

    socket.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "ROOM_STATE") setPlayers(msg.data);
      if (msg.type === "GET_CUBE") setCube(msg.data);
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
            <th>Пол</th>
            <th>Уровень</th>
            <th>Шмотки</th>
            <th>Общий урон</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td>{p.nickname}</td>
              <td>{p.sex}</td>
              <td>{p.level}</td>
              <td>{p.damage}</td>
              <td>{p.damage + p.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {cube?.cube && (
        <p>
          Игрок {cube?.nickname} сделал бросок кубика, результат: {cube?.cube}
        </p>
      )}
    </div>
  );
}
