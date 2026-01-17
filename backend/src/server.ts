import express from "express";
import { genRoomId } from "./utils/functions/roomId";
import { createRoom, roomExists } from "./utils/rooms";

const app = express();
app.use(express.json());

app.post("/api/rooms", async (req, res) => {
  let roomId = genRoomId();
  while (roomExists(roomId)) {
    roomId = genRoomId();
  }

  await createRoom(roomId);
  res.json({ roomId });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});
