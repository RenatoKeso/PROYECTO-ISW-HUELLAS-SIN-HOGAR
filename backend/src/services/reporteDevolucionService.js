import {
  buscarDevolucionesPorFecha,
  guardarReporteDevolucion,
  listarReportesDevolucion,
} from "../repositories/reporteDevolucionRepository.js";

function finDelDia(fecha) {
  const fin = new Date(fecha);
  fin.setUTCHours(23, 59, 59, 999);
  return fin;
}

function agruparPorMotivo(devoluciones) {
  const grupos = {};

  for (const devolucion of devoluciones) {
    const motivo = devolucion.motivo;

    if (!grupos[motivo]) {
      grupos[motivo] = { cantidad: 0, devoluciones: [] };
    }

    grupos[motivo].cantidad += 1;
    grupos[motivo].devoluciones.push({
      animal: devolucion.fichaAnimal.nombre,
      codigoAnimal: devolucion.fichaAnimal.codigoAnimal,
      fecha: devolucion.fechaDevolucion,
      detalle: devolucion.detalle,
    });
  }

  return grupos;
}

function buscarRepetidos(devoluciones) {
  const conteo = {};

  for (const devolucion of devoluciones) {
    const clave = `${devolucion.fichaAnimalId}-${devolucion.motivo}`;

    if (!conteo[clave]) {
      conteo[clave] = {
        animal: devolucion.fichaAnimal.nombre,
        codigoAnimal: devolucion.fichaAnimal.codigoAnimal,
        motivo: devolucion.motivo,
        cantidad: 0,
      };
    }

    conteo[clave].cantidad += 1;
  }

  return Object.values(conteo).filter((item) => item.cantidad > 1);
}

export async function generarReporteDevoluciones({ fechaDesde, fechaHasta, generadoPorId }) {
  const devoluciones = await buscarDevolucionesPorFecha(fechaDesde, finDelDia(fechaHasta));

  const resultado = {
    porMotivo: agruparPorMotivo(devoluciones),
    repetidos: buscarRepetidos(devoluciones),
  };

  return guardarReporteDevolucion({
    fechaDesde,
    fechaHasta,
    totalDevoluciones: devoluciones.length,
    resultado,
    generadoPorId,
  });
}

export async function obtenerReportesDevolucion() {
  return listarReportesDevolucion();
}