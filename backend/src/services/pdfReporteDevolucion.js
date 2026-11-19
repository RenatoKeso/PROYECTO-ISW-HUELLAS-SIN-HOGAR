import PDFDocument from "pdfkit";

const NOMBRES_MOTIVO = {
  COMPORTAMIENTO: "Comportamiento",
  SALUD: "Salud",
  CAMBIO_SITUACION_FAMILIAR: "Cambio de situación familiar",
  OTRO: "Otro",
};

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-CL", { timeZone: "UTC" });
}

const VERDE = "#56643f";
const SALVIA = "#e4e8d8";
const CREMA = "#f7f3ea";
const TAN = "#c8a97e";
const ROJO = "#b03a2e";

// Dibuja el PDF y lo devuelve como un archivo en memoria (Buffer)
export function crearPdf(reporte) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const partes = [];
    doc.on("data", (parte) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));

    const ancho = doc.page.width - 100;

    // Banda verde de arriba con el título
    doc.rect(0, 0, doc.page.width, 110).fill(VERDE);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(24).text("Reporte de devoluciones", 50, 35);
    doc.font("Helvetica").fontSize(11).text("Huellas Sin Hogar", 50, 68);

    // Recuadro crema con los datos del reporte
    doc.roundedRect(50, 130, ancho, 70, 8).fill(CREMA);
    doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(10);
    doc.text("PERIODO", 65, 142);
    doc.text("TOTAL", 300, 142);
    doc.text("GENERADO POR", 390, 142);
    doc.fillColor("black").font("Helvetica").fontSize(12);
    doc.text(`${formatearFecha(reporte.fechaDesde)} al ${formatearFecha(reporte.fechaHasta)}`, 65, 162);
    doc.text(`${reporte.totalDevoluciones} devoluciones`, 300, 162);
    doc.text(reporte.generadoPor.nombre, 390, 162, { width: 140 });

    doc.y = 225;

    // Un bloque por cada motivo
    const porMotivo = reporte.resultado.porMotivo;
    for (const motivo in porMotivo) {
      const grupo = porMotivo[motivo];
      if (doc.y > 700) doc.addPage();

      const yTitulo = doc.y;
      doc.roundedRect(50, yTitulo, ancho, 26, 6).fill(SALVIA);
      doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(13)
        .text(`${NOMBRES_MOTIVO[motivo]}  (${grupo.cantidad})`, 62, yTitulo + 7);
      doc.y = yTitulo + 36;

      for (const devolucion of grupo.devoluciones) {
        if (doc.y > 760) doc.addPage();
        const yFila = doc.y;
        doc.circle(58, yFila + 6, 3).fill(TAN);
        doc.fillColor("black").font("Helvetica-Bold").fontSize(11)
          .text(`${devolucion.animal} (${devolucion.codigoAnimal})`, 70, yFila, { continued: true })
          .font("Helvetica").fillColor("#666666").text(`  ·  ${formatearFecha(devolucion.fecha)}`);
        doc.fillColor("#333333").fontSize(10).text(devolucion.detalle, 70, doc.y + 2, { width: ancho - 20 });
        doc.y += 8;
      }
      doc.y += 10;
    }

    // Animales devueltos más de una vez por el mismo motivo
    if (doc.y > 680) doc.addPage();
    doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(14)
      .text("Animales devueltos más de una vez", 50, doc.y);
    doc.y += 8;

    if (reporte.resultado.repetidos.length === 0) {
      doc.fillColor("#666666").font("Helvetica").fontSize(11).text("No hay animales repetidos en este rango.", 50);
    }
    for (const repetido of reporte.resultado.repetidos) {
      const yAlerta = doc.y;
      doc.roundedRect(50, yAlerta, ancho, 28, 6).fill("#f8e1de");
      doc.rect(50, yAlerta, 5, 28).fill(ROJO);
      doc.fillColor(ROJO).font("Helvetica-Bold").fontSize(11)
        .text(`${repetido.animal} (${repetido.codigoAnimal}) fue devuelto ${repetido.cantidad} veces por ${NOMBRES_MOTIVO[repetido.motivo]}`, 65, yAlerta + 9);
      doc.y = yAlerta + 36;
    }

    // Pie de página
    doc.fillColor("#999999").font("Helvetica").fontSize(9)
      .text(`Documento generado el ${new Date().toLocaleDateString("es-CL")} · Uso interno del refugio`, 50, 770, { width: ancho, align: "center", lineBreak: false });

    doc.end();
  });
}