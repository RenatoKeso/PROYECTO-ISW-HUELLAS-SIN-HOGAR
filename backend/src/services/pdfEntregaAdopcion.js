import PDFDocument from "pdfkit";

// Acta de entrega en adopcion. Usa el mismo estilo que el PDF del reporte de
// devoluciones (pdfReporteDevolucion.js): banda verde, recuadro crema y titulos
// de seccion en verde salvia. No muestra ningun id ni el codigo del animal.

const VERDE = "#56643f";
const SALVIA = "#e4e8d8";
const CREMA = "#f7f3ea";
const TAN = "#c8a97e";
const ROJO = "#b03a2e";
const GRIS = "#666666";
const TEXTO = "#333333";

const MARGEN = 50;
// Hasta donde se puede escribir antes de pasar a otra pagina (el pie va mas abajo).
const LIMITE_INFERIOR = 760;

const ESPECIES = { PERRO: "Perro", GATO: "Gato", OTRO: "Otro" };
const SEXOS = { MACHO: "Macho", HEMBRA: "Hembra", DESCONOCIDO: "Desconocido" };
const TIPOS_VIVIENDA = { CASA: "Casa", DEPARTAMENTO: "Departamento", OTRO: "Otro" };
const TENENCIAS_VIVIENDA = { PROPIA: "Propia", ARRENDADA: "Arrendada", OTRA: "Otra" };
const RESULTADOS_VISITA = { FAVORABLE: "Favorable", DESFAVORABLE: "Desfavorable" };
const ESTADOS_SEGUIMIENTO = { PENDIENTE: "Pendiente", REALIZADO: "Realizado" };
const MOTIVOS_OMISION = {
  FALTA_ESPACIO_REFUGIO: "Falta de espacio en el refugio",
  POSTULANTE_CONOCIDO: "Postulante conocido por el refugio",
  DISTANCIA: "Distancia del domicilio",
  SIN_PERSONAL_DISPONIBLE: "Sin personal disponible",
  OTRO: "Otro",
};

// ---------- Formato de los datos ----------

const FORMATO_FECHA = { day: "2-digit", month: "2-digit", year: "numeric" };

// Fechas sin hora (visitas, entrega, nacimiento...): se guardan a medianoche UTC.
function fechaSinHora(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-CL", { ...FORMATO_FECHA, timeZone: "UTC" });
}

// Fechas con hora (cuando llego la postulacion, cuando se aprobo...): dia en Chile.
function fechaEnChile(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-CL", {
    ...FORMATO_FECHA,
    timeZone: "America/Santiago",
  });
}

function siNo(valor) {
  if (valor === true) return "Sí";
  if (valor === false) return "No";
  return null;
}

function edad(valor) {
  if (valor === null || valor === undefined) return null;
  if (valor === 0) return "Menos de 1 año";
  return valor === 1 ? "1 año" : `${valor} años`;
}

function cantidad(valor, singular, plural) {
  if (valor === null || valor === undefined) return null;
  return `${valor} ${valor === 1 ? singular : plural}`;
}

// La tenencia incluye el permiso del arriendo cuando corresponde.
function tenencia(postulacion) {
  const texto = TENENCIAS_VIVIENDA[postulacion.tenenciaVivienda];
  if (!texto) return null;
  if (postulacion.tenenciaVivienda !== "ARRENDADA") return texto;

  const permiso = siNo(postulacion.permiteMascotasArriendo);
  return permiso ? `${texto} (el arriendo permite mascotas: ${permiso})` : texto;
}

// ---------- Ayudantes de dibujo ----------

function anchoUtil(doc) {
  return doc.page.width - MARGEN * 2;
}

// Si no cabe un bloque de cierto alto, pasa a la pagina siguiente.
function asegurarEspacio(doc, alto) {
  if (doc.y + alto > LIMITE_INFERIOR) {
    doc.addPage();
    doc.y = MARGEN;
  }
}

function tituloSeccion(doc, texto) {
  asegurarEspacio(doc, 70);
  const y = doc.y;
  doc.roundedRect(MARGEN, y, anchoUtil(doc), 26, 6).fill(SALVIA);
  doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(13).text(texto, MARGEN + 12, y + 7);
  doc.y = y + 38;
}

// Dibuja pares "ETIQUETA / valor" en dos columnas. Un valor vacio se muestra como "—".
function campos(doc, lista) {
  const ancho = anchoUtil(doc);
  const anchoColumna = (ancho - 20) / 2;

  for (let i = 0; i < lista.length; i += 2) {
    const fila = lista.slice(i, i + 2);
    doc.font("Helvetica").fontSize(11);

    // El alto de la fila lo pone el valor mas largo (puede ocupar varias lineas).
    const altoValores = fila.map(([, valor]) =>
      doc.heightOfString(valor ?? "—", { width: anchoColumna }),
    );
    const altoFila = 14 + Math.max(...altoValores);

    asegurarEspacio(doc, altoFila + 8);
    const y = doc.y;

    fila.forEach(([etiqueta, valor], columna) => {
      const x = MARGEN + columna * (anchoColumna + 20);
      doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(8).text(etiqueta.toUpperCase(), x, y, {
        width: anchoColumna,
        characterSpacing: 0.5,
      });
      doc.fillColor("black").font("Helvetica").fontSize(11).text(valor ?? "—", x, y + 12, {
        width: anchoColumna,
      });
    });

    doc.y = y + altoFila + 8;
  }

  doc.y += 6;
}

// Un paso de la linea de tiempo del proceso: punto verde, titulo, resultado,
// fecha a la derecha y las lineas de detalle que tengan contenido.
function pasoProceso(doc, paso, conectarCon) {
  const ancho = anchoUtil(doc);
  const xTexto = MARGEN + 24;
  const anchoTexto = ancho - 24;
  const detalles = paso.detalles.filter(([, valor]) => valor);

  doc.font("Helvetica").fontSize(10);
  const altoDetalles = detalles.reduce(
    (total, [etiqueta, valor]) =>
      total + doc.heightOfString(`${etiqueta}: ${valor}`, { width: anchoTexto }) + 2,
    0,
  );

  // Si el paso no cabe, se pasa de pagina y no se dibuja la linea que lo une al anterior.
  const paginaAntes = doc.page;
  asegurarEspacio(doc, 22 + altoDetalles);
  const y = doc.y;
  const yPunto = y + 6;

  if (conectarCon !== null && doc.page === paginaAntes) {
    // La linea va de punto a punto sin pasar por encima de ellos.
    doc.moveTo(MARGEN + 8, conectarCon + 6).lineTo(MARGEN + 8, yPunto - 6)
      .lineWidth(1.5).strokeColor(TAN).stroke();
  }
  doc.circle(MARGEN + 8, yPunto, 5).fill(VERDE);

  // Titulo y, a su lado, el resultado de la visita si lo tiene.
  doc.fillColor("black").font("Helvetica-Bold").fontSize(11)
    .text(paso.titulo, xTexto, y, { continued: Boolean(paso.resultado) });
  if (paso.resultado) {
    const color = paso.resultado === "Desfavorable" ? ROJO : VERDE;
    doc.fillColor(color).text(`   ${paso.resultado}`);
  }

  doc.fillColor(GRIS).font("Helvetica").fontSize(10)
    .text(paso.fecha ?? "—", MARGEN, y + 1, { width: ancho, align: "right" });

  doc.y = y + 16;
  for (const [etiqueta, valor] of detalles) {
    doc.fillColor(TEXTO).font("Helvetica").fontSize(10)
      .text(`${etiqueta}: ${valor}`, xTexto, doc.y, { width: anchoTexto });
    doc.y += 2;
  }

  doc.y += 12;
  return yPunto;
}

// ---------- Contenido del acta ----------

// Los pasos del proceso en orden: postulacion, aprobacion, primera visita,
// visita al hogar (o su omision) y entrega.
function pasosDelProceso(postulacion) {
  const primeraVisita = postulacion.visitas?.find((v) => v.tipo === "PRIMERA_VISITA");
  const visitaHogar = postulacion.visitas?.find((v) => v.tipo === "VISITA_HOGAR");

  const pasos = [
    { titulo: "Postulación recibida", fecha: fechaEnChile(postulacion.createdAt), detalles: [] },
    {
      titulo: "Postulación aprobada",
      fecha: fechaEnChile(postulacion.fechaResolucion),
      detalles: [
        ["Revisó", postulacion.revisor?.nombre],
        ["Observación", postulacion.observaciones],
      ],
    },
  ];

  for (const visita of [primeraVisita, visitaHogar]) {
    if (!visita) continue;
    pasos.push({
      titulo: visita.tipo === "PRIMERA_VISITA" ? "Primera visita" : "Visita al hogar",
      resultado: RESULTADOS_VISITA[visita.resultado],
      fecha: fechaSinHora(visita.fechaVisita),
      detalles: [
        ["Registró", visita.registradaPor?.nombre],
        ["Observación", visita.observaciones],
      ],
    });
  }

  if (!visitaHogar && postulacion.motivoOmisionVisitaHogar) {
    pasos.push({
      titulo: "Visita al hogar omitida",
      fecha: fechaEnChile(postulacion.fechaOmisionVisitaHogar),
      detalles: [
        ["Motivo", MOTIVOS_OMISION[postulacion.motivoOmisionVisitaHogar]],
        ["Autorizó", postulacion.omisionAutorizadaPor?.nombre],
        ["Observación", postulacion.observacionOmisionVisitaHogar],
      ],
    });
  }

  pasos.push({
    titulo: "Entrega",
    fecha: fechaSinHora(postulacion.fechaEntrega),
    detalles: [["Documentación entregada", postulacion.documentacionEntregada]],
  });

  return pasos;
}

function lineaFirma(doc, x, y, ancho, titulo, lineasExtra) {
  doc.moveTo(x, y).lineTo(x + ancho, y).lineWidth(1).strokeColor(TEXTO).stroke();
  doc.fillColor("black").font("Helvetica-Bold").fontSize(10).text(titulo, x, y + 6, { width: ancho });
  doc.fillColor(GRIS).font("Helvetica").fontSize(9);
  lineasExtra.forEach((linea, i) => doc.text(linea, x, y + 20 + i * 12, { width: ancho }));
}

// Dibuja el acta y la devuelve como un archivo en memoria (Buffer).
export function crearActaEntregaPdf(postulacion) {
  return new Promise((resolve, reject) => {
    // bufferPages permite volver atras al final para poner el pie en cada pagina.
    const doc = new PDFDocument({ size: "A4", margin: MARGEN, bufferPages: true });
    const partes = [];
    doc.on("data", (parte) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);

    const ancho = anchoUtil(doc);
    const animal = postulacion.fichaAnimal ?? {};

    // Banda verde de arriba con el titulo
    doc.rect(0, 0, doc.page.width, 110).fill(VERDE);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(24)
      .text("Acta de entrega en adopción", MARGEN, 35);
    doc.font("Helvetica").fontSize(11).text("Huellas Sin Hogar", MARGEN, 68);

    // Recuadro crema con lo principal: quien adopta a quien y cuando
    doc.roundedRect(MARGEN, 130, ancho, 70, 8).fill(CREMA);
    doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(10);
    doc.text("ANIMAL", 65, 142);
    doc.text("ADOPTANTE", 230, 142);
    doc.text("FECHA DE ENTREGA", 420, 142);
    doc.fillColor("black").font("Helvetica").fontSize(12);
    doc.text(animal.nombre || "Sin nombre", 65, 162, { width: 155 });
    doc.text(postulacion.nombrePostulante, 230, 162, { width: 180 });
    doc.text(fechaSinHora(postulacion.fechaEntrega) ?? "—", 420, 162, { width: 110 });

    doc.y = 225;

    tituloSeccion(doc, "Adoptante");
    campos(doc, [
      ["Nombre", postulacion.nombrePostulante],
      ["RUT", postulacion.rutPostulante],
      ["Fecha de nacimiento", fechaSinHora(postulacion.fechaNacimientoPostulante)],
      ["Teléfono", postulacion.telefonoPostulante],
      ["Correo", postulacion.emailPostulante],
      ["Comuna", postulacion.comunaPostulante],
      ["Dirección", postulacion.direccionPostulante],
    ]);

    tituloSeccion(doc, "Hogar");
    campos(doc, [
      ["Vivienda", TIPOS_VIVIENDA[postulacion.tipoVivienda]],
      ["Tenencia", tenencia(postulacion)],
      ["Patio", siNo(postulacion.tienePatio)],
      ["Personas en el hogar", cantidad(postulacion.personasHogar, "persona", "personas")],
      ["Niños en el hogar", siNo(postulacion.hayNinos)],
      ["Horas solo al día", cantidad(postulacion.horasSoloAlDia, "hora", "horas")],
      ["Otras mascotas", postulacion.otrasMascotas],
    ]);

    tituloSeccion(doc, "Animal");
    campos(doc, [
      ["Nombre", animal.nombre || "Sin nombre"],
      ["Especie", ESPECIES[animal.especie]],
      ["Raza", animal.raza],
      ["Sexo", SEXOS[animal.sexoAnimal]],
      ["Edad", edad(animal.edad)],
    ]);

    tituloSeccion(doc, "Proceso de adopción");
    let puntoAnterior = null;
    for (const paso of pasosDelProceso(postulacion)) {
      puntoAnterior = pasoProceso(doc, paso, puntoAnterior);
    }
    doc.y += 4;

    tituloSeccion(doc, "Seguimientos");
    const seguimientos = postulacion.seguimientos ?? [];
    if (seguimientos.length === 0) {
      doc.fillColor(GRIS).font("Helvetica").fontSize(11)
        .text("No hay seguimientos programados.", MARGEN, doc.y);
      doc.y += 6;
    }
    for (const seguimiento of seguimientos) {
      asegurarEspacio(doc, 20);
      const y = doc.y;
      const realizado = seguimiento.estado === "REALIZADO";
      doc.circle(MARGEN + 8, y + 6, 3).fill(TAN);
      doc.fillColor("black").font("Helvetica-Bold").fontSize(11)
        .text(`${seguimiento.diasDesdeEntrega} días`, MARGEN + 24, y, { width: 90 });
      doc.font("Helvetica").text(fechaSinHora(seguimiento.fechaProgramada) ?? "—", MARGEN + 120, y, {
        width: 120,
      });
      doc.fillColor(realizado ? VERDE : GRIS).font("Helvetica-Bold")
        .text(ESTADOS_SEGUIMIENTO[seguimiento.estado] ?? "—", MARGEN + 250, y, { width: 120 });
      doc.y = y + 20;
    }

    // Firmas: el adoptante y la encargada que entrega
    asegurarEspacio(doc, 130);
    const yFirmas = doc.y + 60;
    const anchoFirma = (ancho - 60) / 2;
    lineaFirma(doc, MARGEN, yFirmas, anchoFirma, "Adoptante", [
      postulacion.nombrePostulante,
      `RUT ${postulacion.rutPostulante}`,
    ]);
    lineaFirma(doc, MARGEN + anchoFirma + 60, yFirmas, anchoFirma, "Encargada de adopciones", [
      "Nombre:",
    ]);

    // Pie de pagina en todas las paginas
    const generado = new Date().toLocaleDateString("es-CL", {
      ...FORMATO_FECHA,
      timeZone: "America/Santiago",
    });
    const rango = doc.bufferedPageRange();
    for (let i = rango.start; i < rango.start + rango.count; i += 1) {
      doc.switchToPage(i);
      // El pie va dentro del margen inferior: se quita el margen un momento para
      // que pdfkit no crea que se acabo la hoja y agregue una pagina en blanco.
      const margenInferior = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.fillColor("#999999").font("Helvetica").fontSize(9).text(
        `Documento generado el ${generado} · Uso interno del refugio · Página ${i + 1} de ${rango.count}`,
        MARGEN,
        800,
        { width: ancho, align: "center", lineBreak: false },
      );
      doc.page.margins.bottom = margenInferior;
    }

    doc.end();
  });
}
