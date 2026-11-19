import PDFDocument from "pdfkit";
import { reporteNoEncontrado } from "../entities/devolucionErrors.js";
import {
  buscarDevolucionesPorFecha,
  guardarReporteDevolucion,
  listarReportesDevolucion,
  buscarReportePorId,
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
      receptor: devolucion.receptor.nombre,
      postulante: devolucion.postulacion.nombrePostulante,
      ficha: {
        especie: devolucion.fichaAnimal.especie,
        sexo: devolucion.fichaAnimal.sexoAnimal,
        raza: devolucion.fichaAnimal.raza,
        edad: devolucion.fichaAnimal.edad,
        estado: devolucion.fichaAnimal.estadoEstadia,
      },
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

//para el pdf
 const NOMBRES_MOTIVO = {
  COMPORTAMIENTO: "Comportamiento",
  SALUD: "Salud",
  CAMBIO_SITUACION_FAMILIAR: "Cambio de situación familiar",
  OTRO: "Otro",
};

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-CL", { timeZone: "UTC" });
}

// Dibuja el PDF y lo devuelve como un archivo en memoria (Buffer)
function crearPdf(reporte) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const partes = [];
    doc.on("data", (parte) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));

    // Encabezado
    doc.fontSize(20).fillColor("#56643f").text("Reporte de devoluciones");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("black");
    doc.text(`Desde: ${formatearFecha(reporte.fechaDesde)}   Hasta: ${formatearFecha(reporte.fechaHasta)}`);
    doc.text(`Total de devoluciones: ${reporte.totalDevoluciones}`);
    doc.text(`Generado por: ${reporte.generadoPor.nombre}`);
    doc.moveDown();

    // Un bloque por cada motivo
    const porMotivo = reporte.resultado.porMotivo;
    for (const motivo in porMotivo) {
      const grupo = porMotivo[motivo];
      doc.fontSize(14).fillColor("#56643f").text(`${NOMBRES_MOTIVO[motivo]} (${grupo.cantidad})`);
      doc.fontSize(11).fillColor("black");
      for (const devolucion of grupo.devoluciones) {
        doc.text(`- ${devolucion.animal} (${devolucion.codigoAnimal}) · ${formatearFecha(devolucion.fecha)}: ${devolucion.detalle}`);
      }
      doc.moveDown();
    }

    // Animales devueltos más de una vez por el mismo motivo
    doc.fontSize(14).fillColor("#56643f").text("Animales devueltos más de una vez");
    doc.fontSize(11).fillColor("black");
    if (reporte.resultado.repetidos.length === 0) {
      doc.text("No hay animales repetidos en este rango.");
    }
    for (const repetido of reporte.resultado.repetidos) {
      doc.fillColor("#b03a2e").text(`- ${repetido.animal} (${repetido.codigoAnimal}): ${repetido.cantidad} veces por ${NOMBRES_MOTIVO[repetido.motivo]}`);
    }

    doc.end();
  });
}

export async function generarPdfReporte(id) {
  const reporte = await buscarReportePorId(id);
  if (!reporte) {
    throw reporteNoEncontrado(id);
  }
  return crearPdf(reporte);
}