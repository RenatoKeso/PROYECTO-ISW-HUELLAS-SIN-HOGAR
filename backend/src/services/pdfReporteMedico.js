import PDFDocument from "pdfkit";

const VERDE = "#56643f";
const SALVIA = "#e4e8d8";
const CREMA = "#f7f3ea";
const TAN = "#c8a97e";
const GRIS = "#666666";

const ETIQUETAS = {
  especie: { PERRO: "Perro", GATO: "Gato", OTRO: "Otro" },
  sexo: { MACHO: "Macho", HEMBRA: "Hembra", DESCONOCIDO: "Desconocido" },
  estadía: {
    ACTIVO: "Activo en refugio",
    ADOPTADO: "Adoptado",
    ESPERA_ADOPCION: "Espera de adopción",
    EGRESADO: "Egresado",
    FALLECIDO: "Fallecido",
    TRANSFERIDO: "Transferido",
  },
  adopción: { ADOPTABLE: "Adoptable", NO_ADOPTABLE: "No adoptable" },
  estado: {
    PROVISIONAL: "Revisión inicial pendiente",
    VALIDACION_PENDIENTE: "Revisión completa pendiente",
    REVISANDO: "En revisión",
    REALIZADO: "Revisión realizada",
    ACTUALIZADO: "Actualizado / al día",
  },
  salud: { NORMAL: "Normal", ENFERMO: "Enfermo", CRITICO: "Crítico" },
  revisiónInicial: {
    PENDIENTE: "Pendiente",
    COMPLETADA: "Completada",
    ACTUALIZADA: "Actualizada",
    BLOQUEADA: "Bloqueada",
  },
  estadoEnfermedad: {
    EN_CURSO: "En curso",
    RESUELTO: "Resuelto",
    CRONICO: "Crónico",
  },
  estadoTratamiento: {
    EN_CURSO: "En curso",
    RESUELTO: "Resuelto",
    CRONICO: "Crónico",
  },
  evolución: {
    MEJORANDO: "Mejorando",
    EMPEORANDO: "Empeorando",
    ESTABLE: "Estable",
  },
  tipoAtencion: {
    vacuna: "Vacuna",
    tratamiento: "Tratamiento",
    control: "Control",
    desparasitacion: "Desparasitación",
    esterilizacion: "Esterilización",
  },
  estadoAtencion: {
    PENDIENTE: "Pendiente",
    REALIZADA: "Realizada",
    CANCELADA: "Cancelada",
  },
};

function etiqueta(categoria, valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  return ETIQUETAS[categoria]?.[valor] ?? String(valor);
}

function valor(contenido) {
  if (contenido === null || contenido === undefined) return "—";
  if (typeof contenido === "string" && !contenido.trim()) return "—";
  if (typeof contenido === "boolean") return contenido ? "Sí" : "No";
  if (Array.isArray(contenido)) {
    return contenido.length ? contenido.map(valor).join(" · ") : "—";
  }
  return String(contenido);
}

function fecha(contenido) {
  if (!contenido) return "—";
  const valorFecha = new Date(contenido);
  if (Number.isNaN(valorFecha.getTime())) return String(contenido);
  return valorFecha.toLocaleDateString("es-CL", { timeZone: "UTC" });
}

function peso(contenido) {
  if (contenido === null || contenido === undefined || contenido === "") return "—";
  const numero = Number(contenido);
  return Number.isNaN(numero) ? String(contenido) : `${numero.toFixed(2)} kg`;
}

function autor(usuario) {
  return valor(usuario?.nombre);
}

/**
 * Dibuja el expediente médico completo de cada animal y devuelve el PDF como
 * Buffer. Todos los recuadros son rectangulares.
 */
export function crearPdfReporteMedico({
  registros = [],
  generadoPor,
  titulo = "Reporte médico",
  descripcionesFiltros = [],
  generadoEn = new Date(),
} = {}) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margins: { top: 50, bottom: 72, left: 50, right: 50 },
    });
    const partes = [];
    doc.on("data", (parte) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));

    const ancho = doc.page.width - 100;
    let dibujandoPie = false;

    // El pie se dibuja al final sobre cada pagina ya terminada. Dibujarlo desde
    // el evento pageAdded provoca una recursion porque pdfkit pagina el texto.
    function dibujarPie() {
      if (dibujandoPie) return;
      dibujandoPie = true;
      const yPie = doc.page.height - 84;
      doc.fillColor("#999999").font("Helvetica").fontSize(8)
        .text(
          `Documento generado el ${generadoEn.toLocaleDateString("es-CL")} · Uso interno del refugio`,
          50,
          yPie,
          { width: ancho, align: "center", lineBreak: false },
        );
      dibujandoPie = false;
    }

    function asegurar(altura) {
      if (doc.y + altura > doc.page.height - 90) {
        doc.addPage();
        doc.y = 60;
      }
    }

    function alturaTexto(texto, anchoTexto, fuente = "Helvetica", tamano = 9) {
      doc.font(fuente).fontSize(tamano);
      return doc.heightOfString(valor(texto), { width: anchoTexto });
    }

    function barra(numero, nombre, codigo, estado) {
      asegurar(34);
      const y = doc.y;
      doc.rect(50, y, ancho, 26).fill(VERDE);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(12)
        .text(`${numero}. ${nombre} (${codigo})`, 60, y + 7, {
          width: ancho - 230,
          lineBreak: false,
        });
      doc.fillColor("white").font("Helvetica").fontSize(9)
        .text(etiqueta("estado", estado), 290, y + 8, {
          width: ancho - 240,
          align: "right",
          lineBreak: false,
        });
      doc.y = y + 34;
    }

    function subtitulo(tituloSeccion) {
      asegurar(27);
      const y = doc.y;
      doc.rect(50, y, ancho, 19).fill(SALVIA);
      doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(9)
        .text(tituloSeccion.toUpperCase(), 60, y + 5, { lineBreak: false });
      doc.y = y + 26;
    }

    function campo(etiquetaCampo, contenido, anchoEtiqueta = 132) {
      const anchoValor = ancho - anchoEtiqueta - 14;
      const altoValor = alturaTexto(contenido, anchoValor);
      asegurar(Math.max(14, altoValor) + 4);
      const y = doc.y;
      doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(8.5)
        .text(etiquetaCampo.toUpperCase(), 62, y, {
          width: anchoEtiqueta - 8,
          lineBreak: false,
        });
      doc.fillColor("#222222").font("Helvetica").fontSize(9)
        .text(valor(contenido), 62 + anchoEtiqueta, y, { width: anchoValor });
      doc.y = y + Math.max(14, altoValor) + 4;
    }

    function item(contenido) {
      const altoContenido = alturaTexto(contenido, ancho - 36);
      asegurar(altoContenido + 5);
      const y = doc.y;
      doc.rect(62, y + 2, 4, 4).fill(TAN);
      doc.fillColor("#222222").font("Helvetica").fontSize(9)
        .text(valor(contenido), 74, y, { width: ancho - 36 });
      doc.y = y + altoContenido + 5;
    }

    function sinDatos(mensaje) {
      const altoMensaje = alturaTexto(mensaje, ancho - 24);
      asegurar(altoMensaje + 4);
      doc.fillColor(GRIS).font("Helvetica").fontSize(9)
        .text(mensaje, 62, doc.y, { width: ancho - 24 });
      doc.y += altoMensaje + 4;
    }

    // --- Cabecera del documento -------------------------------------------
    doc.rect(0, 0, doc.page.width, 110).fill(VERDE);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(22)
      .text(valor(titulo), 50, 34, { lineBreak: false });
    doc.font("Helvetica").fontSize(11)
      .text("Huellas Sin Hogar · Expediente clínico", 50, 70);

    const textoFiltros = descripcionesFiltros.length
      ? descripcionesFiltros.join(" · ")
      : "Sin filtros (todos los registros)";
    const altoFiltros = alturaTexto(textoFiltros, ancho - 30, "Helvetica", 10);
    const altoCabeceraDatos = Math.max(92, 68 + altoFiltros + 12);
    doc.rect(50, 130, ancho, altoCabeceraDatos).fill(CREMA);
    doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(9);
    doc.text("GENERADO POR", 65, 143);
    doc.text("FECHA", 320, 143);
    doc.text("REGISTROS", 440, 143);
    doc.fillColor("#222222").font("Helvetica").fontSize(11);
    doc.text(autor(generadoPor), 65, 159);
    doc.text(fecha(generadoEn), 320, 159);
    doc.text(String(registros.length), 440, 159);
    doc.fillColor(VERDE).font("Helvetica-Bold").fontSize(9)
      .text("FILTROS APLICADOS", 65, 184);
    doc.fillColor(GRIS).font("Helvetica").fontSize(10)
      .text(textoFiltros, 65, 199, { width: ancho - 30 });

    doc.y = 130 + altoCabeceraDatos + 22;

    if (registros.length === 0) {
      sinDatos("No hay registros médicos que coincidan con los filtros seleccionados.");
    }

    registros.forEach((registro, indice) => {
      const animal = registro?.animal ?? {};
      const ingreso = registro?.ingresoAnimal ?? null;
      const revisionInicial = registro?.revisionInicial ?? null;
      const revisionCompleta = registro?.revisionCompleta ?? null;

      barra(
        indice + 1,
        valor(animal.nombre || "Sin nombre"),
        valor(animal.codigoAnimal),
        registro?.estadoValidacion,
      );

      subtitulo("Datos del animal");
      campo("Código", animal.codigoAnimal);
      campo("Nombre", animal.nombre);
      campo("Especie", etiqueta("especie", animal.especie));
      campo("Raza", animal.raza);
      campo("Sexo", etiqueta("sexo", animal.sexoAnimal));
      campo("Edad", animal.edad === null || animal.edad === undefined ? "—" : `${animal.edad} años`);
      campo("Estado de estadía", etiqueta("estadía", animal.estadoEstadia));
      campo("Estado de adopción", etiqueta("adopción", animal.estadoAdopcion));
      campo("Observaciones de la ficha", animal.observaciones);
      campo("Ficha creada", fecha(animal.createdAt));

      subtitulo("Ingreso al refugio");
      if (ingreso) {
        campo("Fecha de ingreso", fecha(ingreso.fechaIngreso));
        campo("Procedencia", ingreso.procedencia);
        campo("Ubicación encontrado", ingreso.ubicacionEncontrado);
        campo("Estado de salud declarado", ingreso.estadoSalud);
        campo("Recibido por", autor(ingreso.receptor));
      } else {
        sinDatos("Sin ingreso asociado a este registro.");
      }

      subtitulo("Registro médico");
      campo("ID del registro", registro?.id);
      campo("Estado de validación", etiqueta("estado", registro?.estadoValidacion));
      campo("Estado previo", etiqueta("estado", registro?.estadoPrevioRevision));
      campo("Fecha de creación", fecha(registro?.createdAt));
      campo("Peso actual", peso(registro?.pesoKg));
      campo("Clasificación de salud", etiqueta("salud", registro?.clasificacionSalud));
      campo("Requiere cuarentena", registro?.requiereCuarentena);
      campo("Observación inicial", registro?.observacionInicial);
      campo("Fecha revisión inicial", fecha(registro?.fechaRevisionInicial));
      campo("Revisión inicial por", autor(registro?.revisionInicialPor));

      subtitulo("Revisión inicial");
      if (revisionInicial) {
        campo("Estado", etiqueta("revisiónInicial", revisionInicial.estadoRevisionInicial));
        campo("Clasificación", etiqueta("salud", revisionInicial.clasificacionSalud));
        campo("Prioridad de atención", revisionInicial.prioridadAtencion);
        campo("Cuarentena", revisionInicial.cuarentena);
        campo("Observación del estado de salud", revisionInicial.observacionEstadoSalud);
        campo("Creada por", autor(revisionInicial.createdBy));
        campo("Fecha de creación", fecha(revisionInicial.createdAt));
        campo("Actualizada por", autor(revisionInicial.updatedBy));
        campo("Fecha de actualización", fecha(revisionInicial.fechaActualizacion ?? revisionInicial.updatedAt));
      } else {
        sinDatos("La revisión inicial todavía no fue registrada.");
      }

      subtitulo("Revisión completa y evaluación clínica");
      if (revisionCompleta) {
        campo("Estado de salud", etiqueta("salud", revisionCompleta.estadoSalud));
        campo("Edad registrada", revisionCompleta.edad === null || revisionCompleta.edad === undefined ? "—" : `${revisionCompleta.edad} años`);
        campo("Peso revalidado", peso(revisionCompleta.peso));
        campo("Condición médica", revisionCompleta.descripcionCondicionMedica);
        campo("Discapacidades", revisionCompleta.discapacidades);
        campo("Lesiones", revisionCompleta.lesiones);
        campo("Cuidados especiales", revisionCompleta.descripcionCuidadosEspeciales);
        campo("Creada por", autor(revisionCompleta.createdBy));
        campo("Fecha de creación", fecha(revisionCompleta.createdAt));
        campo("Actualizada por", autor(revisionCompleta.updatedBy));
        campo("Fecha de actualización", fecha(revisionCompleta.updatedAt));
      } else {
        sinDatos("La revisión completa todavía no fue registrada.");
      }

      subtitulo("Enfermedades");
      if (registro?.enfermedades?.length) {
        registro.enfermedades.forEach((enfermedad) => {
          item(
            `${enfermedad.descripcionEnfermedad}${enfermedad.tipoEnfermedad ? ` · ${enfermedad.tipoEnfermedad}` : ""} · Registrada: ${fecha(enfermedad.createdAt)} · Por: ${autor(enfermedad.createdBy)}`,
          );
        });
      } else {
        sinDatos("Sin enfermedades registradas.");
      }

      subtitulo("Tratamientos");
      if (registro?.tratamientos?.length) {
        registro.tratamientos.forEach((tratamiento) => {
          item(
            `${tratamiento.descripcionTratamiento} · Desde: ${fecha(tratamiento.fechaInicio)} · Hasta: ${fecha(tratamiento.fechaFin)} · Registrado: ${fecha(tratamiento.createdAt)} · Por: ${autor(tratamiento.createdBy)}`,
          );
          if (tratamiento.observaciones) {
            item(`Observaciones: ${tratamiento.observaciones}`);
          }
        });
      } else {
        sinDatos("Sin tratamientos registrados.");
      }

      subtitulo("Atenciones sanitarias");
      if (registro?.atencionesSanitarias?.length) {
        registro.atencionesSanitarias.forEach((atencion) => {
          item(
            `${etiqueta("tipoAtencion", atencion.tipo)} · Programada: ${fecha(atencion.fechaProgramada)} · Estado: ${etiqueta("estadoAtencion", atencion.estado)} · Realizada: ${fecha(atencion.fechaRealizacion)}`,
          );
          if (atencion.observaciones) item(`Observaciones: ${atencion.observaciones}`);
          if (atencion.motivoCancelacion) item(`Motivo de cancelación: ${atencion.motivoCancelacion}`);
        });
      } else {
        sinDatos("Sin atenciones sanitarias registradas.");
      }

      subtitulo("Atenciones veterinarias externas");
      if (registro?.atencionesVeterinarias?.length) {
        registro.atencionesVeterinarias.forEach((atencion) => {
          item(
            `Fecha: ${fecha(atencion.fechaAtencion)} · Lugar: ${valor(atencion.lugarAtencion)} · Clínica: ${valor(atencion.nombreClinicaExterna)} · Médico: ${valor(atencion.nombreMedico)}`,
          );
          if (atencion.descripcionAtencion) item(`Descripción: ${atencion.descripcionAtencion}`);
          if (atencion.resultado) item(`Resultado: ${atencion.resultado}`);
          item(`Registrada por: ${autor(atencion.createdBy)}`);
        });
      } else {
        sinDatos("Sin atenciones veterinarias externas registradas.");
      }

      subtitulo("Seguimientos médicos");
      if (registro?.seguimientos?.length) {
        registro.seguimientos.forEach((seguimiento) => {
          asegurar(18);
          item(
            `Fecha: ${fecha(seguimiento.fechaRegistro)} · Peso: ${peso(seguimiento.peso)} · Salud: ${etiqueta("salud", seguimiento.estadoSalud)} · Evolución: ${etiqueta("evolución", seguimiento.evolucionEstadoSalud)} · Por: ${autor(seguimiento.createdBy)}`,
          );
          item(`Observación: ${seguimiento.observacionSeguimiento}`);
          if (seguimiento.necesidades) item(`Necesidades: ${seguimiento.necesidades}`);
          (seguimiento.seguimientosEnfermedad ?? []).forEach((detalle) => {
            item(
              `Enfermedad "${detalle.enfermedad?.descripcionEnfermedad ?? detalle.enfermedadId}": ${etiqueta("estadoEnfermedad", detalle.estadoEnfermedad)}${detalle.observacionSeguimiento ? ` · ${detalle.observacionSeguimiento}` : ""}`,
            );
          });
          (seguimiento.seguimientosTratamiento ?? []).forEach((detalle) => {
            item(
              `Tratamiento "${detalle.tratamiento?.descripcionTratamiento ?? detalle.tratamientoId}": ${etiqueta("estadoTratamiento", detalle.estadoTratamiento)}${detalle.observacionSeguimiento ? ` · ${detalle.observacionSeguimiento}` : ""}`,
            );
          });
        });
      } else {
        sinDatos("Sin seguimientos médicos registrados.");
      }

      subtitulo("Historial de actualizaciones");
      if (registro?.historial?.length) {
        registro.historial.forEach((version) => {
          item(
            `Versión ${version.version} · ${fecha(version.fecha)} · Estado origen: ${etiqueta("estado", version.estadoOrigen)} · Peso: ${peso(version.peso)} · Salud: ${etiqueta("salud", version.clasificacionSalud)} · Por: ${autor(version.actualizadoPor)}`,
          );
          if (version.descripcionCondicionMedica) item(`Condición: ${version.descripcionCondicionMedica}`);
          if (version.descripcionCuidadosEspeciales) item(`Cuidados: ${version.descripcionCuidadosEspeciales}`);
          if (version.descripcionEnfermedades) item(`Enfermedades: ${version.descripcionEnfermedades}`);
          if (version.descripcionTratamientos) item(`Tratamientos: ${version.descripcionTratamientos}`);
          if (version.observacionSeguimiento) item(`Observación: ${version.observacionSeguimiento}`);
        });
      } else {
        sinDatos("Sin versiones de historial registradas.");
      }

      subtitulo("Auditoría de la revisión inicial");
      if (registro?.auditorias?.length) {
        registro.auditorias.forEach((auditoria) => {
          item(
            `${auditoria.campo}: ${valor(auditoria.valorAnterior)} -> ${valor(auditoria.valorNuevo)} · ${fecha(auditoria.fecha)} ${valor(auditoria.hora)} · Por: ${autor(auditoria.autor)}`,
          );
        });
      } else {
        sinDatos("Sin cambios auditados en la revisión inicial.");
      }

      doc.y += 12;
    });

    const { start, count } = doc.bufferedPageRange();
    for (let indicePagina = 0; indicePagina < count; indicePagina += 1) {
      doc.switchToPage(start + indicePagina);
      dibujarPie();
    }
    doc.end();
  });
}
