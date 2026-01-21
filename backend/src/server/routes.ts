import { Router } from "express";
import { generateId } from "../functions/generateId";
import { createRoom } from "../redis/helpers";

const routes = Router();

routes.get("/ping", (req, res) => res.send("pong"));

routes.post("/rooms", async (req, res) => {
  try {
    let roomId = generateId();
    await createRoom(roomId);
    res.json({ success: true, roomId });
  } catch (error) {
    res.json({ success: false, error });
  }
});

export default routes;
