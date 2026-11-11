import { AdopcionError } from "./adopcionErrors.js";

// Error de una regla de devoluciones. Como hereda de AdopcionError,
// el manejador de errores del equipo ya sabe convertirlo en respuesta.
export class DevolucionError extends AdopcionError {
  constructor(codigo, mensaje, estadoHttp) {
    super(codigo, mensaje);
    this.name = "DevolucionError";
    this.estadoHttp = estadoHttp;
  }
}

export function postulacionNoEncontrada(id) {
  return new DevolucionError(
    "POSTULACION_INEXISTENTE",
    `No existe la postulación con id ${id}`,
    404,
  );
}

export function devolucionNoPermitida(mensaje) {
  return new DevolucionError("DEVOLUCION_NO_PERMITIDA", mensaje, 409);
}

export function fechaDevolucionInvalida(mensaje) {
  return new DevolucionError("FECHA_INVALIDA", mensaje, 400);
}

export function receptorInvalido() {
  return new DevolucionError(
    "RECEPTOR_INVALIDO",
    "El voluntario que recibe no existe o está desactivado",
    400,
  );
}
