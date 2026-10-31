// Textos para mostrar los valores que vienen del backend.

export const ESTADOS_POSTULACION = {
  EN_REVISION: "En revisión",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CERRADA: "Cerrada",
  ENTREGADA: "Entregada",
};

export const TIPOS_VIVIENDA = {
  CASA: "Casa",
  DEPARTAMENTO: "Departamento",
  OTRO: "Otro",
};

export const MOTIVOS_DEVOLUCION = {
  COMPORTAMIENTO: "Comportamiento",
  SALUD: "Salud",
  CAMBIO_SITUACION_FAMILIAR: "Cambio en la situación familiar",
  OTRO: "Otro",
};

// Las fechas sin hora (como la de una devolucion) se guardan a medianoche UTC.
// Si se muestran con la hora de Chile, aparecerian un dia antes; por eso
// "soloFecha" las lee en UTC.
export function formatearFecha(valor, { soloFecha = false } = {}) {
  if (!valor) return "—";

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";

  return soloFecha
    ? fecha.toLocaleDateString("es-CL", { timeZone: "UTC" })
    : fecha.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export function formatearEdad(edad) {
  if (edad === null || edad === undefined) return null;
  if (edad === 0) return "menos de 1 año";
  return edad === 1 ? "1 año" : `${edad} años`;
}

export const TIPOS_VISITA = {
  PRIMERA_VISITA: "Primera visita",
  VISITA_HOGAR: "Visita al hogar",
};

export const RESULTADOS_VISITA = {
  FAVORABLE: "Favorable",
  DESFAVORABLE: "Desfavorable",
};

export const MOTIVOS_OMISION = {
  FALTA_ESPACIO_REFUGIO: "Falta de espacio en el refugio",
  POSTULANTE_CONOCIDO: "Postulante conocido por el refugio",
  DISTANCIA: "Distancia del domicilio",
  SIN_PERSONAL_DISPONIBLE: "Sin personal disponible",
  OTRO: "Otro",
};

export const ESPECIES = {
  PERRO: "Perro",
  GATO: "Gato",
  OTRO: "Otra especie",
};

// Convierte un objeto { VALOR: "Texto" } en opciones para un <select>.
export function opcionesDe(textos) {
  return [
    { valor: "", texto: "Seleccione..." },
    ...Object.entries(textos).map(([valor, texto]) => ({ valor, texto })),
  ];
}

// Fecha de hoy en el computador del usuario, como "AAAA-MM-DD" (para <input type="date">).
export function hoyLocal() {
  const ahora = new Date();
  const dos = (numero) => String(numero).padStart(2, "0");
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
}