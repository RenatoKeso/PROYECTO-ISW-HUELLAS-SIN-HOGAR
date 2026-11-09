import express from "express";
import cors from "cors";
import { CARPETA_UPLOADS } from "./config/almacenamientoImagenes.js";
import {manejadorErrores,manejarRutaNoEncontrada,} from "./handlers/manejadorErrores.js";
import { crearRouter } from "./routes/index.js";

export function crearApp({ registrarIngresoAnimal } = {}) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (request, response) => {
    response.json({ status: "ok", message: "Backend funcionando" });
  });

  app.use(
    "/uploads",
    express.static(CARPETA_UPLOADS, {
      index: false,
      dotfiles: "deny",
      maxAge: "7d",
      immutable: true,
    }),
  );

  app.use("/api", crearRouter({ registrarIngresoAnimal }));
  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}

const app = crearApp();

export default app;
