import { app } from ".";
import { generateId } from "../functions/generateId";
import { createRoom } from "../redis/helpers";

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
