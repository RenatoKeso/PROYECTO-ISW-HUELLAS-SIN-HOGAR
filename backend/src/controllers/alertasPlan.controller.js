import {obtenerAlertasPlan,} from "../services/alertasPlan.service.js";

export function crearConsultaAlertasPlan(
    consultar = obtenerAlertasPlan
) {
    return async function consultarAlertasPlan(
    request,
    response,
    next
) {
    try {
        const resultado = await consultar(request.query);

        return response.status(200).json(resultado);
    } catch (error) {
        return next(error);
        }
    };
}