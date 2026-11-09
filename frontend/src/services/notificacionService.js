import { api } from "./api.js";
import {
  notificacionLeidaResponseSchema,
  notificacionesResponseSchema,
} from "../validations/registroMedicoValidation.js";

function validarRespuesta(schema, respuesta) {
  const resultado = schema.safeParse(respuesta);

  if (!resultado.success) {
    throw new Error("El servidor devolvio notificaciones invalidas");
  }

  return resultado.data;
}

export async function listarNotificaciones() {
  return validarRespuesta(
    notificacionesResponseSchema,
    await api.get("/notificaciones"),
  );
}

export async function marcarNotificacionLeida(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de notificacion invalido");
  }

  return validarRespuesta(
    notificacionLeidaResponseSchema,
    await api.patch(`/notificaciones/${id}/leida`, {}),
  );
}
