export const CODIGO_ERROR_ANIMAL = {
  PROCEDENCIA_INVALIDA: "PROCEDENCIA_INVALIDA",
  REFERENCIA_FICHA_AUSENTE: "REFERENCIA_FICHA_AUSENTE",
  FICHA_INEXISTENTE: "FICHA_INEXISTENTE",
  CONFLICTO_IDENTIFICADOR: "CONFLICTO_IDENTIFICADOR",
  FALLO_GUARDADO_FICHA: "FALLO_GUARDADO_FICHA",
};

const ESTADO_HTTP_POR_CODIGO = {
  [CODIGO_ERROR_ANIMAL.PROCEDENCIA_INVALIDA]: 400,
  [CODIGO_ERROR_ANIMAL.REFERENCIA_FICHA_AUSENTE]: 400,
  [CODIGO_ERROR_ANIMAL.FICHA_INEXISTENTE]: 404,
  [CODIGO_ERROR_ANIMAL.CONFLICTO_IDENTIFICADOR]: 409,
  [CODIGO_ERROR_ANIMAL.FALLO_GUARDADO_FICHA]: 500,
};

export class AnimalError extends Error {
  constructor(codigo, mensaje, opcion = {}) {
    super(mensaje, { cause: opcion.cause });
    this.name = "AnimalError";
    this.codigo = codigo;
    this.estadoHttp = ESTADO_HTTP_POR_CODIGO[codigo] ?? 500;
    this.opcion = opcion;
  }
}

export function esErrorAnimal(error) {
  return error instanceof AnimalError;
}

export function procedenciaInvalida(mensaje = "La procedencia del ingreso no es válida") {
  return new AnimalError(CODIGO_ERROR_ANIMAL.PROCEDENCIA_INVALIDA, mensaje);
}

export function referenciaFichaAusente(
  mensaje = "El reingreso por devolución requiere el código de la ficha existente",
) {
  return new AnimalError(CODIGO_ERROR_ANIMAL.REFERENCIA_FICHA_AUSENTE, mensaje);
}

export function fichaInexistente(codigoAnimal) {
  return new AnimalError(
    CODIGO_ERROR_ANIMAL.FICHA_INEXISTENTE,
    codigoAnimal
      ? `No existe una ficha con el código ${codigoAnimal}`
      : "La ficha indicada no existe",
    { codigoAnimal },
  );
}

export function fichaInexistentePorId(id) {
  return new AnimalError(
    CODIGO_ERROR_ANIMAL.FICHA_INEXISTENTE,
    `No existe la ficha con id ${id}`,
    { id },
  );
}

export function conflictoIdentificador(codigoAnimal) {
  return new AnimalError(
    CODIGO_ERROR_ANIMAL.CONFLICTO_IDENTIFICADOR,
    `El identificador ${codigoAnimal} ya está asignado a otra ficha`,
    { codigoAnimal },
  );
}

export function falloGuardadoFicha(cause) {
  return new AnimalError(
    CODIGO_ERROR_ANIMAL.FALLO_GUARDADO_FICHA,
    "No se pudo guardar la ficha del animal junto con su historial de ingresos",
    { cause },
  );
}
