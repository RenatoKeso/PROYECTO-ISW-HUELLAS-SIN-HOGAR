export function enviarRespuestaExitosa(response, { mensaje, datos = {}, estado = 200 }) {
  return response.status(estado).json({ message: mensaje, ...datos });
}
