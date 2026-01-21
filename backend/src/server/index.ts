import http from "http";
import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 4000;

export const app = express();
export const httpServer = http.createServer(app);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());
httpServer.listen(PORT, () => {
  console.log(`Express started 🚀`);
});
