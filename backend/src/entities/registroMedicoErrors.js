export const CODIGO_ERROR_REGISTRO_MEDICO = {
  REGISTRO_MEDICO_INEXISTENTE: "REGISTRO_MEDICO_INEXISTENTE",
  REGISTRO_MEDICO_DUPLICADO: "REGISTRO_MEDICO_DUPLICADO",
  ESTADO_INVALIDO: "ESTADO_INVALIDO",
  ROL_INSUFICIENTE: "ROL_INSUFICIENTE",
};

const ESTADO_HTTP_POR_CODIGO = {
  [CODIGO_ERROR_REGISTRO_MEDICO.REGISTRO_MEDICO_INEXISTENTE]: 404,
  [CODIGO_ERROR_REGISTRO_MEDICO.REGISTRO_MEDICO_DUPLICADO]: 409,
  [CODIGO_ERROR_REGISTRO_MEDICO.ESTADO_INVALIDO]: 409,
  [CODIGO_ERROR_REGISTRO_MEDICO.ROL_INSUFICIENTE]: 403,
};

export class RegistroMedicoError extends Error {
  constructor(codigo, mensaje, opcion = {}) {
    super(mensaje, { cause: opcion.cause });
    this.name = "RegistroMedicoError";
    this.codigo = codigo;
    this.estadoHttp = ESTADO_HTTP_POR_CODIGO[codigo] ?? 500;
    this.opcion = opcion;
  }
}

export function esErrorRegistroMedico(error) {
  return error instanceof RegistroMedicoError;
}

export function registroMedicoInexistente(id) {
  return new RegistroMedicoError(
    CODIGO_ERROR_REGISTRO_MEDICO.REGISTRO_MEDICO_INEXISTENTE,
    id
      ? `No existe un registro médico con id ${id}`
      : "El registro médico indicado no existe",
    { id },
  );
}

export function registroMedicoInexistenteParaFicha(animalId) {
  return new RegistroMedicoError(
    CODIGO_ERROR_REGISTRO_MEDICO.REGISTRO_MEDICO_INEXISTENTE,
    `El animal con id ${animalId} no tiene un registro médico`,
    { animalId },
  );
}

export function registroMedicoDuplicado(animalId) {
  return new RegistroMedicoError(
    CODIGO_ERROR_REGISTRO_MEDICO.REGISTRO_MEDICO_DUPLICADO,
    `El animal con id ${animalId} ya tiene un registro médico`,
    { animalId },
  );
}

export function estadoInvalido(mensaje = "El registro médico no está en un estado válido para esta operación") {
  return new RegistroMedicoError(
    CODIGO_ERROR_REGISTRO_MEDICO.ESTADO_INVALIDO,
    mensaje,
  );
}

export function rolInsuficiente(mensaje = "Tu rol no permite realizar esta acción sobre el registro médico") {
  return new RegistroMedicoError(
    CODIGO_ERROR_REGISTRO_MEDICO.ROL_INSUFICIENTE,
    mensaje,
  );
}