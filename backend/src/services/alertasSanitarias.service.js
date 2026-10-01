const DIA_MS = 24 * 60 * 60 * 1000;
const TIPOS = new Set(["vacuna", "control", "tratamiento"]);

function leerFecha(valor, campo) {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new TypeError(`${campo} debe tener formato YYYY-MM-DD`);
  }

  const fecha = new Date(`${valor}T00:00:00.000Z`);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== valor
  ) {
    throw new TypeError(`${campo} debe ser una fecha valida`);
  }

  return fecha;
}

function calcularAlertas(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw new TypeError("El cuerpo debe ser un objeto JSON");
  }

  const fechaReferencia =
    datos.fechaReferencia ?? new Date().toISOString().slice(0, 10);

  const referencia = leerFecha(fechaReferencia, "fechaReferencia");

  const diasAnticipacion =
    datos.diasAnticipacion === undefined ? 7 : datos.diasAnticipacion;

  if (!Number.isInteger(diasAnticipacion) || diasAnticipacion < 0) {
    throw new RangeError(
      "diasAnticipacion debe ser un entero mayor o igual a cero"
    );
  }

  if (!Array.isArray(datos.eventos)) {
    throw new TypeError("eventos debe ser un arreglo");
  }

  const alertas = datos.eventos.flatMap((evento, indice) => {
    if (!evento || typeof evento !== "object" || Array.isArray(evento)) {
      throw new TypeError(`eventos[${indice}] debe ser un objeto`);
    }

    if (!Number.isInteger(evento.animalId) || evento.animalId <= 0) {
      throw new TypeError(
        `eventos[${indice}].animalId debe ser un entero positivo`
      );
    }

    if (!TIPOS.has(evento.tipo)) {
      throw new TypeError(
        `eventos[${indice}].tipo debe ser vacuna, control o tratamiento`
      );
    }

    const fecha = leerFecha(
      evento.fechaProgramada,
      `eventos[${indice}].fechaProgramada`
    );

    const diasRestantes = Math.round((fecha - referencia) / DIA_MS);

    if (diasRestantes > diasAnticipacion) {
      return [];
    }

    return [{
      animalId: evento.animalId,
      tipo: evento.tipo,
      fechaProgramada: evento.fechaProgramada,
      estado: diasRestantes < 0 ? "vencido" : "proximo",
      diasRestantes,
    }];
  });

  alertas.sort((a, b) => b.diasRestantes - a.diasRestantes);

  return { fechaReferencia, diasAnticipacion, alertas };
}

export { calcularAlertas, TIPOS };