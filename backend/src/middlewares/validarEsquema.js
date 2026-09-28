export function validarEsquema(esquema, origen = "body") {
  return function middlewareValidacion(request, response, next) {
    const resultado = esquema.safeParse(request[origen]);

    if (!resultado.success) {
      next(resultado.error);
      return;
    }

    request[origen] = resultado.data;
    next();
  };
}
