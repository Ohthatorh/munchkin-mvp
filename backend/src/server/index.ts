import http from "http";
import express from "express";
import cors from "cors";
import { generateId } from "../functions/generateId";
import { createRoom } from "../redis/helpers";

const PORT = process.env.PORT || 4000;

export const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/ping", (req, res) => res.send("pong"));

app.post("/rooms", async (req, res) => {
  try {
    let roomId = generateId();
    await createRoom(roomId);
    res.json({ success: true, roomId });
  } catch (error) {
    res.json({ success: false, error });
  }
});

export const httpServer = http.createServer(app);

httpServer.listen(PORT, () => {
  console.log(`Express started 🚀`);
});
