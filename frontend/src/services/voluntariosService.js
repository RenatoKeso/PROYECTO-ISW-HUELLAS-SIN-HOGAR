import { api } from "./api.js";

export function listarVoluntarios() {
  return api.get("/voluntarios");
}