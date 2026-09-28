import express from "express";
import cors from "cors";
import {
  manejadorErrores,
  manejarRutaNoEncontrada,
} from "./handlers/manejadorErrores.js";
import { crearRouter } from "./routes/index.js";

export function crearApp({ registrarIngresoAnimal } = {}) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (request, response) => {
    response.json({ status: "ok", message: "Backend funcionando" });
  });

  app.use("/api", crearRouter({ registrarIngresoAnimal }));
  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}

const app = crearApp();

export default app;
