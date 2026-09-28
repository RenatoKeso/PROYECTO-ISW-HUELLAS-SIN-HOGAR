import { calcularAlertas } from "../services/alertasSanitarias.service.js";

function previsualizarAlertas(request, response) {
try {
    const resultado = calcularAlertas(request.body);
    return response.json(resultado);
} catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
        return response.status(400).json({ error: error.message });
    }

    throw error;
  }
}

export { previsualizarAlertas };