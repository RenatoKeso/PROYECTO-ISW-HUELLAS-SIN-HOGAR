export function capturarErrores(controlador) {
  return function controladorSeguro(request, response, next) {
    Promise.resolve(controlador(request, response, next)).catch(next);
  };
}
