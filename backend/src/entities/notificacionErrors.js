export const CODIGO_ERROR_NOTIFICACION = {
  NOTIFICACION_INEXISTENTE: "NOTIFICACION_INEXISTENTE",
};

const ESTADO_HTTP_POR_CODIGO = {
  [CODIGO_ERROR_NOTIFICACION.NOTIFICACION_INEXISTENTE]: 404,
};

export class NotificacionError extends Error {
  constructor(codigo, mensaje, opcion = {}) {
    super(mensaje, { cause: opcion.cause });
    this.name = "NotificacionError";
    this.codigo = codigo;
    this.estadoHttp = ESTADO_HTTP_POR_CODIGO[codigo] ?? 500;
    this.opcion = opcion;
  }
}

export function esErrorNotificacion(error) {
  return error instanceof NotificacionError;
}

export function notificacionInexistente(id) {
  return new NotificacionError(
    CODIGO_ERROR_NOTIFICACION.NOTIFICACION_INEXISTENTE,
    "La notificación indicada no existe",
    { id },
  );
}
