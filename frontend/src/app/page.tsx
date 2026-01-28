"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (isLoading) return;
    setLoading(true);
    const res = await fetch("https://munchhelper.com/backend-api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { roomId } = await res.json();
    setLoading(false);
    router.push(`/${roomId}/`);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 100 }}>
      <button
        onClick={handleCreateRoom}
        style={{ padding: "10px 20px", fontSize: 20 }}
      >
        Создать комнату
      </button>
    </div>
  );
}
