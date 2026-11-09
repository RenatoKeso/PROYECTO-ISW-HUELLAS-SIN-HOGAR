import { z } from "zod";
import { api } from "./api.js";
import {
  actualizacionResponseSchema,
  historialMedicoResponseSchema,
  registroMedicoResponseSchema,
  registroMedicoSchema,
  registrosMedicosResponseSchema,
  revisionFinalResponseSchema,
  revisionInicialResponseSchema,
  seguimientosResponseSchema,
} from "../validations/registroMedicoValidation.js";

function validarRespuesta(schema, respuesta) {
  const resultado = schema.safeParse(respuesta);

  if (!resultado.success) {
    throw new Error("El servidor devolvio un registro medico invalido");
  }

  return resultado.data;
}

export async function listarRegistrosMedicos(estado) {
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : "";

  return validarRespuesta(
    registrosMedicosResponseSchema,
    await api.get(`/registros-medicos${consulta}`),
  );
}

export async function obtenerRegistroMedico(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return validarRespuesta(
    registroMedicoResponseSchema,
    await api.get(`/registros-medicos/${id}`),
  );
}

export async function registrarRevisionInicial(id, entrada) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return validarRespuesta(
    revisionInicialResponseSchema,
    await api.post(`/registros-medicos/${id}/revision-inicial`, entrada),
  );
}

export async function actualizarRevisionInicial(id, entrada) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return validarRespuesta(
    revisionInicialResponseSchema,
    await api.patch(`/registros-medicos/${id}/revision-inicial`, entrada),
  );
}

export async function realizarRevisionFinal(id, entrada) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return validarRespuesta(
    revisionFinalResponseSchema,
    await api.post(`/registros-medicos/${id}/validacion`, entrada),
  );
}

export async function iniciarActualizacion(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return validarRespuesta(
    z.object({ message: z.string(), registroMedico: registroMedicoSchema }),
    await api.post(`/registros-medicos/${id}/actualizaciones/inicio`, {}),
  );
}

export function guardarActualizacion(id, entrada) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return api
    .post(`/registros-medicos/${id}/actualizaciones`, entrada)
    .then((respuesta) =>
      validarRespuesta(actualizacionResponseSchema, respuesta),
    );
}

export function cancelarActualizacion(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return api
    .post(`/registros-medicos/${id}/actualizaciones/cancelar`, {})
    .then((respuesta) =>
      validarRespuesta(
        z.object({ message: z.string(), registroMedico: registroMedicoSchema }),
        respuesta,
      ),
    );
}

export async function listarHistorialMedico(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return validarRespuesta(
    historialMedicoResponseSchema,
    await api.get(`/registros-medicos/${id}/historial`),
  );
}

export async function listarSeguimientosMedico(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identificador de registro medico invalido");
  }

  return validarRespuesta(
    seguimientosResponseSchema,
    await api.get(`/registros-medicos/${id}/seguimientos`),
  );
}
