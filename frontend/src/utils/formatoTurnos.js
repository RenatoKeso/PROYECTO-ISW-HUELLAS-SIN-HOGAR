// Los turnos llegan como instantes UTC; aqui se muestran en hora de Chile.
const ZONA_CHILE = "America/Santiago";

const conMayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// "Sábado, 15 de noviembre de 2026"
export function formatearFechaTurno(instante) {
  return conMayuscula(
    new Date(instante).toLocaleDateString("es-CL", {
      timeZone: ZONA_CHILE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
}

// "09:00"
export function formatearHora(instante) {
  return new Date(instante).toLocaleTimeString("es-CL", {
    timeZone: ZONA_CHILE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// "Sábado, 15 de noviembre de 2026 · 09:00 a 12:00"
export function formatearHorarioTurno(turno) {
  return `${formatearFechaTurno(turno.inicio)} · ${formatearHora(turno.inicio)} a ${formatearHora(turno.termino)}`;
}

// "13 de noviembre"
export function formatearFechaLimite(instante) {
  return new Date(instante).toLocaleDateString("es-CL", {
    timeZone: ZONA_CHILE,
    day: "numeric",
    month: "long",
  });
}

export function formatearFechaHora(instante) {
  return new Date(instante).toLocaleString("es-CL", {
    timeZone: ZONA_CHILE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const NOMBRES_ESTADO_INSCRIPCION = {
  ACTIVA: "Activa",
  CANCELADA: "Cancelada",
};

export const NOMBRES_ACCION_HISTORIAL = {
  INSCRIPCION: "Inscripción",
  MODIFICACION: "Cambio de turno",
  CANCELACION: "Cancelación",
};
