import { calcularAlertas } from "../services/alertasSanitarias.service.js";

function previsualizarAlertas(request, response, next) {
    try {
    const resultado = calcularAlertas(request.body);

    return response.status(200).json(resultado);
} catch (error) {
    return next(error);
}
}

export { previsualizarAlertas };