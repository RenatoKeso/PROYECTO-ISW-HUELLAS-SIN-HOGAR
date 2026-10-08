import { api } from "./api.js";
import { respuestaAlertasSchema } from "../validations/alertasValidation.js";

export async function previsualizarAlertas(datos) {
    const respuesta = await api.post(
    "/salud/alertas/preview",
    datos,
);

    const resultado = respuestaAlertasSchema.safeParse(respuesta);

if (!resultado.success) {
    throw new Error(
        "El servidor devolvio una respuesta de alertas invalida",
    );
}

    return resultado.data;
}