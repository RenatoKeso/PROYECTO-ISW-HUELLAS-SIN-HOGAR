import { api } from "./api.js";
import {respuestaAlertasSchema,} from "../validations/alertasValidation.js";
import {respuestaAlertasPlanSchema,} from "../validations/alertasPlanValidation.js";

// Consulta del plan sanitario registrado.
export async function consultarAlertasPlan(filtros) {
    const parametros = new URLSearchParams({
    diasAnticipacion: String(filtros.diasAnticipacion),
    });

if (filtros.fechaReferencia) {
    parametros.set(
        "fechaReferencia",
        filtros.fechaReferencia
    );
}

    const respuesta = await api.get(
    `/salud/alertas?${parametros}`
    );

    const resultado =
    respuestaAlertasPlanSchema.safeParse(respuesta);

if (!resultado.success) {
    throw new Error(
        "El servidor devolvio una respuesta de alertas invalida"
    );
}

    return resultado.data;
}

// Función anterior conservada por compatibilidad.
export async function previsualizarAlertas(datos) {
const respuesta = await api.post(
    "/salud/alertas/preview",
    datos
);

  const resultado =
    respuestaAlertasSchema.safeParse(respuesta);

  if (!resultado.success) {
    throw new Error(
        "El servidor devolvio una respuesta de alertas invalida"
    );
  }

  return resultado.data;
}