import { api } from "./api.js";

export function listarAnimalesEnAdopcion() {
  return api.get("/adopciones/animales");
}