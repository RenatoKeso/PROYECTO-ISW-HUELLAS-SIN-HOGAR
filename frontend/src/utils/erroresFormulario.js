export function erroresDeZod(error) {
  const errores = {};

  for (const issue of error.issues ?? []) {
    errores[issue.path.join(".")] = issue.message;
  }

  return errores;
}

export function erroresDeApi(error) {
  if (!Array.isArray(error?.detalles)) return {};

  const errores = {};

  for (const detalle of error.detalles) {
    if (detalle.campo) errores[detalle.campo] = detalle.mensaje;
  }

  return errores;
}
