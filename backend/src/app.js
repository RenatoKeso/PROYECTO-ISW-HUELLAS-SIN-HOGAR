import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  manejadorErrores,
  manejarRutaNoEncontrada,
} from "./handlers/manejadorErrores.js";
import { crearRouter } from "./routes/index.js";

const frontendDist = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
const frontendIndex = fileURLToPath(new URL("../../frontend/dist/index.html", import.meta.url));

export function crearApp({ registrarIngresoAnimal } = {}) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (request, response) => {
    response.json({ status: "ok", message: "Backend funcionando" });
  });

  app.use("/api", crearRouter({ registrarIngresoAnimal }));

  // En producción, el build de Vite se sirve desde el mismo origen que la API.
  if (existsSync(frontendIndex)) {
    app.use(express.static(frontendDist));
    app.get("*", (request, response, next) => {
      if (request.path === "/api" || request.path.startsWith("/api/") || !request.accepts("html")) {
        return next();
      }
      return response.sendFile(frontendIndex);
    });
  }

  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}

const app = crearApp();

export default app;
