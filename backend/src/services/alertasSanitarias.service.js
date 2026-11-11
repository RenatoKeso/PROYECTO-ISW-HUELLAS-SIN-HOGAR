import {
  alertasSanitariasSchema,
  TIPOS_ATENCION,
} from "../validations/alertasSanitariasValidation.js";

const DIA_MS = 24 * 60 * 60 * 1000;

// se conserva esta exportacion porque salud.routes.js la utiliza.
const TIPOS = new Set(TIPOS_ATENCION);

// Obtiene la fecha actual de Chile en formato YYYY-MM-DD.
function obtenerFechaActual(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);

  const valor = (tipo) =>
    partes.find((parte) => parte.type === tipo).value;

  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

// El segundo parámetro permite probar la fecha actual sin depender del reloj.
function calcularAlertas(datos, ahora = new Date()) {
  const entrada = alertasSanitariasSchema.parse(datos);

  const fechaReferencia =
    entrada.fechaReferencia ?? obtenerFechaActual(ahora);

  const referencia = new Date(`${fechaReferencia}T00:00:00.000Z`);

  const { diasAnticipacion, eventos } = entrada;

  const alertas = eventos.flatMap((evento) => {
    const fecha = new Date(
      `${evento.fechaProgramada}T00:00:00.000Z`,
    );

    const diasRestantes = Math.round(
      (fecha - referencia) / DIA_MS,
    );

    // Excluye los eventos posteriores al límite de anticipación.
    if (diasRestantes > diasAnticipacion) return [];

    return [
      {
        animalId: evento.animalId,
        tipo: evento.tipo,
        fechaProgramada: evento.fechaProgramada,
        estado: diasRestantes < 0 ? "vencido" : "proximo",
        diasRestantes,
      },
    ];
  });

  // Los vencidos más antiguos aparecen primero.
  alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);

  return {
    fechaReferencia,
    diasAnticipacion,
    alertas,
  };
}

export { calcularAlertas, obtenerFechaActual, TIPOS };