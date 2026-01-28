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
  modifier: number;
}

interface IRoomEvent {
  timestamp: number;
  playerId: string;
  text: string;
}

export default function Room() {
  const params = useParams();
  const roomId = params.roomId;
  const [isLoading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [cube, setCube] = useState<(Player & { cube: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<IRoomEvent[] | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const socket = new WebSocket(`wss://munchhelper.com/ws/room/${roomId}`);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({ type: "JOIN_ROOM", data: { roomCode: roomId } }),
      );
    };

    socket.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      setLoading(false);
      if (msg.type === "ERROR") setError(msg.data);
      if (msg.type === "ROOM_STATE") setPlayers(msg.data);
      if (msg.type === "GET_CUBE") setCube(msg.data);
      if (msg.type === "ROOM_HISTORY") setHistory(msg.data);
      if (msg.type === "ROOM_EVENT") {
        if (!msg.data) return;
        setHistory((prev) => [msg.data, ...prev!]);
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [roomId]);

  if (isLoading) return <h1>Загрузка...</h1>;
  return (
    <div style={{ padding: 20 }}>
      {!error ? (
        <>
          <h1>Комната {roomId}</h1>
          <div>
            <table
              style={{
                width: "50%",
                marginTop: 20,
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th>Ник</th>
                  <th>Пол</th>
                  <th>Уровень</th>
                  <th>Шмотки</th>
                  <th>Модификатор</th>
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
                    <td>{p.modifier}</td>
                    <td>{p.damage + p.level + p.modifier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history && (
              <table
                style={{
                  width: "50%",
                  marginTop: 20,
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Событие</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p.timestamp}>
                      <td>
                        {new Date(p.timestamp).toLocaleString("ru-RU", {
                          timeZone: "Europe/Moscow",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td>{p.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {cube?.cube && (
            <p>
              Игрок {cube?.nickname} сделал бросок кубика, результат:{" "}
              {cube?.cube}
            </p>
          )}
        </>
      ) : (
        <h1>{error}</h1>
      )}
    </div>
  );
}
