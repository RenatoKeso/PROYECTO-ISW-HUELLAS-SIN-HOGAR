import express from "express";
import cors from "cors";
import router from "./routes/index.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (request, response) => {
  response.json({ status: "ok", message: "Backend funcionando" });
});

app.use("/api", router);

export default app;
