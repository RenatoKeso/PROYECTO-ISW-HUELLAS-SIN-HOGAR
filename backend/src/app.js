import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3001" }));
app.use(express.json());

app.get("/health", (request, response) => {
  response.json({ status: "ok", message: "Backend funcionando" });
});

export default app;
