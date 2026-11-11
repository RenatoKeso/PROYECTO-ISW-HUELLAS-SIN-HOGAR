import { api } from "./api.js";
import {codigoPlanSchema,programarAtencionSchema,modificarAtencionSchema,respuestaPlanSchema,respuestaAtencionSchema,} from "../validations/planSanitarioValidation.js";

function validarRespuesta(schema, respuesta) {
  const resultado = schema.safeParse(respuesta);

  if (!resultado.success) {
    throw new Error(
      "El servidor devolvio un plan sanitario invalido"
    );
  }

  return resultado.data;
}

export async function consultarPlan(codigo) {
  codigo = codigoPlanSchema.parse(codigo);

  return validarRespuesta(
    respuestaPlanSchema,
    await api.get(
      `/salud/plan/${encodeURIComponent(codigo)}`
    )
  );
}

export async function programarAtencion(
  codigo,
  entrada
) {
  codigo = codigoPlanSchema.parse(codigo);

  const datos = programarAtencionSchema.parse(entrada);

  return validarRespuesta(
    respuestaAtencionSchema,
    await api.post(
      `/salud/plan/${encodeURIComponent(codigo)}/atenciones`,
      datos
    )
  );
}

export async function modificarAtencion(id, entrada) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(
      "Identificador de atencion invalido"
    );
  }

  const datos = modificarAtencionSchema.parse(entrada);

  return validarRespuesta(
    respuestaAtencionSchema,
    await api.patch(
      `/salud/atenciones/${id}`,
      datos
    )
  );
}