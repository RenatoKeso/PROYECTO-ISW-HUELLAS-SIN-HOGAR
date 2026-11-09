// Fechas y horas de Chile para el modulo de turnos.
//
// La base guarda instantes (objetos Date, que son UTC). La persona escribe una
// fecha y una hora de Chile, y Chile cambia su diferencia con UTC entre verano
// (UTC-3) e invierno (UTC-4). Por eso la conversion se apoya en Intl con la zona
// "America/Santiago" y no en un desfase fijo.
//
// Las funciones no lanzan errores: devuelven null cuando la fecha u hora no
// existe, y quien las llama decide como responderle al usuario.

export const ZONA_CHILE = "America/Santiago";

const REGEX_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const REGEX_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

const formateador = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_CHILE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partesEnChile(instante) {
  const partes = {};
  for (const { type, value } of formateador.formatToParts(instante)) {
    partes[type] = value;
  }
  return partes;
}

// Diferencia en minutos entre la hora de Chile y UTC en ese instante.
// Devuelve -180 en verano y -240 en invierno.

function desfaseEnMinutos(instante) {
  const p = partesEnChile(instante);
  const horaDeChileComoUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
  const instanteSinMilisegundos =
    Math.floor(instante.getTime() / 1000) * 1000;
  return Math.round(
    (horaDeChileComoUtc - instanteSinMilisegundos) / 60000
  );
}

// Fecha y hora que marcaba el reloj de Chile en ese instante.
// Ejemplo: 2026-11-10T12:00:00Z -> { fecha: "2026-11-10", hora: "09:00" }

export function fechaYHoraEnChile(instante) {
  const p = partesEnChile(instante);
  return {
    fecha: `${p.year}-${p.month}-${p.day}`,
    hora: `${p.hour}:${p.minute}`,
  };
}

// Instante que corresponde a una fecha ("2026-11-10") y una hora ("09:00") de
// Chile. Devuelve null si el formato es incorrecto, si la fecha no existe
// (30 de febrero) o si esa hora no existio por el cambio de horario. Si la hora
// ocurrio dos veces porque el reloj se atraso, devuelve la primera.

export function instanteEnChile(fecha, hora) {
  const f = REGEX_FECHA.exec(fecha);
  const h = REGEX_HORA.exec(hora);
  if (!f || !h) return null;

  const comoUtc = Date.UTC(
    Number(f[1]),
    Number(f[2]) - 1,
    Number(f[3]),
    Number(h[1]),
    Number(h[2])
  );

  // Se corrige dos veces: la primera estimacion usa el desfase de una fecha
  // cercana y la segunda el desfase del instante ya corregido, por si en medio
  // hubo un cambio de horario.

  let instante = new Date(
    comoUtc - desfaseEnMinutos(new Date(comoUtc)) * 60000
  );
  instante = new Date(
    comoUtc - desfaseEnMinutos(instante) * 60000
  );

  // Prueba de ida y vuelta: si al volver a Chile no sale la misma fecha y hora,
  // la fecha no existe o cayo en la hora que se salta el cambio de horario.

  const vuelta = fechaYHoraEnChile(instante);
  if (vuelta.fecha !== fecha || vuelta.hora !== hora) return null;

  return instante;
}

function diaSiguiente(fecha) {
  const f = REGEX_FECHA.exec(fecha);
  if (!f) return null;
  const [anio, mes, dia] = [f[1], f[2], f[3]].map(Number);

  const inicio = new Date(Date.UTC(anio, mes - 1, dia));
  const existe =
    inicio.getUTCFullYear() === anio &&
    inicio.getUTCMonth() === mes - 1 &&
    inicio.getUTCDate() === dia;
  if (!existe) return null;

  return new Date(Date.UTC(anio, mes - 1, dia + 1))
    .toISOString()
    .slice(0, 10);
}

// Ultimo instante de ese dia en Chile (23:59:59.999). Se usa como fecha limite
// de inscripcion: el plazo vence al terminar el dia que eligio la encargada.
// Se calcula como "un milisegundo antes de que empiece el dia siguiente". Si el
// dia siguiente empieza a la 01:00 porque se salto la hora 00:00, tambien sirve.

export function finDelDiaEnChile(fecha) {
  const siguiente = diaSiguiente(fecha);
  if (!siguiente) return null;

  const inicioSiguiente =
    instanteEnChile(siguiente, "00:00") ??
    instanteEnChile(siguiente, "01:00");
  if (!inicioSiguiente) return null;

  return new Date(inicioSiguiente.getTime() - 1);
}