import { formatearHora } from "./formatoTurnos.js";

// Logica del calendario de turnos que no depende de React: que color lleva cada
// turno, que filtros hay y como se arma cada evento para FullCalendar. Al ser
// funciones puras se prueban con node --test.

export const ZONA_CHILE = "America/Santiago";

// Estado del backend (calendario del voluntario) -> clase visual.
const VISUAL_POR_ESTADO = {
  INSCRITO: "inscrito",
  DISPONIBLE: "disponible",
  NO_DISPONIBLE: "no-disponible",
  PASADO: "pasado",
  CANCELADO: "cancelado",
};

export const TEXTO_ESTADO = {
  inscrito: "Inscrito",
  disponible: "Disponible",
  "no-disponible": "No disponible",
  pasado: "Ya pasó",
  cancelado: "Cancelado",
  "con-cupos": "Con cupos",
  lleno: "Lleno",
};

// Como se ve un turno. La encargada lo ve segun sus cupos; el voluntario, segun
// lo que el backend calculo para el (disponibilidad.estado).
export function estadoVisual(turno, gestiona) {
  if (gestiona) {
    if (turno.estado === "CANCELADO") return "cancelado";
    if (turno.yaComenzo) return "pasado";
    return turno.cuposDisponibles === 0 ? "lleno" : "con-cupos";
  }

  return VISUAL_POR_ESTADO[turno.disponibilidad?.estado] ?? "pasado";
}

// La leyenda de colores de cada vista.
export function leyendaDe(gestiona) {
  const estados = gestiona
    ? ["con-cupos", "lleno", "pasado", "cancelado"]
    : ["inscrito", "disponible", "no-disponible", "pasado", "cancelado"];

  return estados.map((estado) => ({ estado, texto: TEXTO_ESTADO[estado] }));
}

const FILTROS_VOLUNTARIO = [
  { valor: "todos", texto: "Todos", incluye: () => true },
  { valor: "disponibles", texto: "Disponibles", incluye: (t) => estadoVisual(t, false) === "disponible" },
  { valor: "no-disponibles", texto: "No disponibles", incluye: (t) => estadoVisual(t, false) === "no-disponible" },
  // Las suyas: activas, de turnos que ya pasaron o que cancelo (RF15).
  { valor: "mias", texto: "Mis inscripciones", incluye: (t) => Boolean(t.miInscripcion) },
];

const FILTROS_GESTION = [
  { valor: "todos", texto: "Todos", incluye: () => true },
  { valor: "con-cupos", texto: "Con cupos", incluye: (t) => estadoVisual(t, true) === "con-cupos" },
  { valor: "llenos", texto: "Llenos", incluye: (t) => estadoVisual(t, true) === "lleno" },
  { valor: "cancelados", texto: "Cancelados", incluye: (t) => estadoVisual(t, true) === "cancelado" },
];

export function filtrosDe(gestiona) {
  return gestiona ? FILTROS_GESTION : FILTROS_VOLUNTARIO;
}

// Los filtros con cuantos turnos de la semana entran en cada uno. No se le pide
// nada al servidor: la semana ya esta cargada y solo se decide que mostrar.
export function filtrosConCuenta(turnos, gestiona) {
  return filtrosDe(gestiona).map((filtro) => ({
    valor: filtro.valor,
    texto: filtro.texto,
    cuenta: turnos.filter(filtro.incluye).length,
  }));
}

export function aplicarFiltro(turnos, gestiona, valor) {
  const filtro = filtrosDe(gestiona).find((opcion) => opcion.valor === valor) ?? filtrosDe(gestiona)[0];
  return turnos.filter(filtro.incluye);
}

// Linea corta que va debajo del horario en cada bloque del calendario.
export function pieDelTurno(turno, gestiona) {
  const estado = estadoVisual(turno, gestiona);
  const libres = turno.cuposDisponibles;

  if (estado === "lleno") return `Lleno · ${turno.cupoMaximo}/${turno.cupoMaximo}`;
  if (estado === "con-cupos" || estado === "disponible") {
    return `${libres} ${libres === 1 ? "cupo libre" : "cupos libres"}`;
  }

  return TEXTO_ESTADO[estado];
}

// Turnos del backend -> eventos de FullCalendar. Las fechas van tal cual (UTC);
// FullCalendar las muestra en hora de Chile gracias al plugin de luxon.
export function aEventos(turnos, gestiona, elegidoId = null) {
  return turnos.map((turno) => {
    const estado = estadoVisual(turno, gestiona);

    return {
      id: String(turno.id),
      title: turno.titulo,
      start: turno.inicio,
      end: turno.termino,
      classNames: ["evento-turno", `evento-${estado}`, ...(turno.id === elegidoId ? ["evento-elegido"] : [])],
      extendedProps: { pie: pieDelTurno(turno, gestiona), estado },
    };
  });
}

// Por que el voluntario no puede tomar el turno, dicho para la persona.
export function textoMotivo(disponibilidad) {
  const solapado = disponibilidad?.turnoSolapado;

  if (disponibilidad?.motivo === "SOLAPE" && solapado) {
    return `Se solapa con tu turno "${solapado.titulo}" (${formatearHora(solapado.inicio)} a ${formatearHora(solapado.termino)}).`;
  }

  return disponibilidad?.mensaje ?? "";
}

// --- Semanas ("AAAA-MM-DD"). El dia de la semana de una fecha no depende de la
// zona horaria, por eso estas cuentas se hacen en UTC.

export function sumarDias(fecha, dias) {
  const dia = new Date(`${fecha}T12:00:00.000Z`);
  dia.setUTCDate(dia.getUTCDate() + dias);
  return dia.toISOString().slice(0, 10);
}

// El lunes de la semana de esa fecha (el backend pide las semanas por su lunes).
export function lunesDe(fecha) {
  const dia = new Date(`${fecha}T12:00:00.000Z`);
  const desdeElLunes = (dia.getUTCDay() + 6) % 7;
  return sumarDias(fecha, -desdeElLunes);
}

// La fecha de hoy en Chile, aunque el computador este en otra zona.
export function hoyEnChile(ahora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_CHILE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

// "16 – 22 de noviembre de 2026", "30 de noviembre – 6 de diciembre de 2026" o
// "28 de diciembre de 2026 – 3 de enero de 2027". La navegacion tiene su propia
// fila, asi que el titulo largo no empuja nada.
export function tituloSemana(lunes) {
  const domingo = sumarDias(lunes, 6);
  const formato = (fecha, opciones) =>
    new Date(`${fecha}T12:00:00.000Z`).toLocaleDateString("es-CL", { timeZone: "UTC", ...opciones });

  const finTexto = formato(domingo, { day: "numeric", month: "long", year: "numeric" });

  if (lunes.slice(0, 7) === domingo.slice(0, 7)) {
    return `${Number(lunes.slice(8))} – ${finTexto}`;
  }

  const mismoAnio = lunes.slice(0, 4) === domingo.slice(0, 4);
  const inicioTexto = formato(lunes, mismoAnio ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" });

  return `${inicioTexto} – ${finTexto}`;
}

// Hora del dia en Chile como numero (13:30 -> 13.5).
function horaEnChile(instante) {
  const [hora, minuto] = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_CHILE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(instante))
    .split(":")
    .map(Number);

  return hora + minuto / 60;
}

const dosDigitos = (numero) => String(numero).padStart(2, "0");

// Horas que muestra la grilla: de 08:00 a 20:00, pero se agranda si algun turno
// de la semana empieza antes o termina despues, para que ninguno quede oculto.
export function rangoDeHoras(turnos, desde = 8, hasta = 20) {
  let minimo = desde;
  let maximo = hasta;

  for (const turno of turnos) {
    const inicio = horaEnChile(turno.inicio);
    const termino = horaEnChile(turno.termino);

    minimo = Math.min(minimo, Math.floor(inicio));
    // Un turno que termina a las 00:00 del dia siguiente llega hasta las 24.
    maximo = Math.max(maximo, Math.ceil(termino <= inicio ? 24 : termino));
  }

  return { inicio: `${dosDigitos(minimo)}:00:00`, termino: `${dosDigitos(maximo)}:00:00` };
}
