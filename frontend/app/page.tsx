"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const createRoom = () => {
    const code = generateRoomCode();
    router.push(`/${code}`);
  };

  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++)
      code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 100 }}>
      <button
        onClick={createRoom}
        style={{ padding: "10px 20px", fontSize: 20 }}
      >
        Создать комнату
      </button>
    </div>
  );
}
