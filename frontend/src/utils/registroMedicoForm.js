import {
  actualizacionVeterinariaFormSchema,
  revisionFinalFormSchema,
  revisionInicialFormSchema,
} from "../validations/registroMedicoValidation.js";

function valorOUndefined(valor) {
  if (valor === "" || valor === null || valor === undefined) return undefined;
  return valor;
}

function filasCompletas(items, camposRequeridos) {
  return items.filter((item) =>
    camposRequeridos.every(
      (campo) =>
        item?.[campo] !== undefined &&
        item?.[campo] !== null &&
        String(item[campo]).trim() !== "",
    ),
  );
}

function limpiarFilas(items, camposOpcionales) {
  return (items ?? []).map((fila) => {
    const copia = { ...fila };
    for (const campo of camposOpcionales) {
      if (copia[campo] === "" || copia[campo] === null) delete copia[campo];
    }
    return copia;
  });
}

function booleanoFormulario(valor) {
  if (valor === true || valor === "true") return true;
  if (valor === false || valor === "false") return false;
  return undefined;
}

export function opcionesEnfermedadesRegistradas(registro) {
  return [
    { valor: "", texto: "Seleccione..." },
    ...(registro?.enfermedades ?? []).map((enfermedad) => ({
      valor: String(enfermedad.id),
      texto: `${enfermedad.id} · ${enfermedad.descripcionEnfermedad}`,
    })),
  ];
}

export function opcionesTratamientosRegistrados(registro) {
  return [
    { valor: "", texto: "Seleccione..." },
    ...(registro?.tratamientos ?? []).map((tratamiento) => ({
      valor: String(tratamiento.id),
      texto: `${tratamiento.id} · ${tratamiento.descripcionTratamiento}`,
    })),
  ];
}

export function crearRevisionInicialInicial(registro) {
  return {
    pesoKg: registro?.pesoKg ?? "",
    clasificacionSalud: registro?.clasificacionSalud ?? "",
    observacionInicial: registro?.observacionInicial ?? "",
    requiereCuarentena:
      registro?.requiereCuarentena === true
        ? "true"
        : registro?.requiereCuarentena === false
          ? "false"
          : "",
  };
}

export function construirEntradaRevisionInicial(valores) {
  return revisionInicialFormSchema.parse(valores);
}

export function crearRevisionFinalInicial(registro) {
  return {
    pesoRevalidadoKg: registro?.revisionCompleta?.peso ?? registro?.pesoKg ?? "",
    estadoSalud: registro?.clasificacionSalud ?? "",
    condiciones:
      registro?.revisionCompleta?.descripcionCondicionMedica ?? "sin detalles",
    discapacidades:
      registro?.revisionCompleta?.discapacidades ?? "sin detalles",
    lesiones: registro?.revisionCompleta?.lesiones ?? "sin detalles",
    descripcionCuidadosEspeciales:
      registro?.revisionCompleta?.descripcionCuidadosEspeciales ??
      "sin detalles",
    adoptabilidad: "",
    enfermedades: [],
    tratamientos: [],
    atencionesSanitarias: [],
  };
}

export function construirEntradaRevisionFinal(valores) {
  const datos = {
    pesoRevalidadoKg: valores.pesoRevalidadoKg,
    estadoSalud: valorOUndefined(valores.estadoSalud),
    condiciones: valorOUndefined(valores.condiciones),
    discapacidades: valorOUndefined(valores.discapacidades),
    lesiones: valorOUndefined(valores.lesiones),
    descripcionCuidadosEspeciales: valorOUndefined(
      valores.descripcionCuidadosEspeciales,
    ),
    adoptabilidad: valores.adoptabilidad,
    enfermedades: filasCompletas(
      limpiarFilas(valores.enfermedades, ["tipoEnfermedad"]),
      ["descripcionEnfermedad"],
    ),
    tratamientos: filasCompletas(
      limpiarFilas(valores.tratamientos, ["fechaFin", "observaciones"]),
      ["descripcionTratamiento", "fechaInicio"],
    ),
    atencionesSanitarias: filasCompletas(
      limpiarFilas(valores.atencionesSanitarias, [
        "estado",
        "fechaRealizacion",
        "observaciones",
      ]),
      ["tipo", "fechaProgramada"],
    ),
  };

  if (!datos.enfermedades?.length) delete datos.enfermedades;
  if (!datos.tratamientos?.length) delete datos.tratamientos;
  if (!datos.atencionesSanitarias?.length) delete datos.atencionesSanitarias;

  return revisionFinalFormSchema.parse(datos);
}

export function crearActualizacionInicial(registro) {
  return {
    pesoKg: registro?.pesoKg ?? "",
    clasificacionSalud: registro?.clasificacionSalud ?? "",
    observacionInicial: registro?.observacionInicial ?? "",
    requiereCuarentena:
      registro?.requiereCuarentena === true
        ? "true"
        : registro?.requiereCuarentena === false
          ? "false"
          : "",
    condiciones: registro?.revisionCompleta?.descripcionCondicionMedica ?? "",
    discapacidades: registro?.revisionCompleta?.discapacidades ?? "",
    lesiones: registro?.revisionCompleta?.lesiones ?? "",
    descripcionCuidadosEspeciales:
      registro?.revisionCompleta?.descripcionCuidadosEspeciales ?? "",
    necesidades: "",
    observacionSeguimiento: "",
    evolucionEstadoSalud: "",
    fechaRegistro: "",
    enfermedades: [],
    tratamientos: [],
    seguimientoEnfermedades: [],
    seguimientoTratamientos: [],
    atencionesSanitarias: [],
  };
}

export function construirEntradaActualizacion(valores) {
  const datos = {
    pesoKg: valorOUndefined(valores.pesoKg),
    clasificacionSalud: valorOUndefined(valores.clasificacionSalud),
    observacionInicial: valorOUndefined(valores.observacionInicial),
    requiereCuarentena: booleanoFormulario(valores.requiereCuarentena),
    condiciones: valorOUndefined(valores.condiciones),
    discapacidades: valorOUndefined(valores.discapacidades),
    lesiones: valorOUndefined(valores.lesiones),
    descripcionCuidadosEspeciales: valorOUndefined(
      valores.descripcionCuidadosEspeciales,
    ),
    necesidades: valorOUndefined(valores.necesidades),
    observacionSeguimiento: valores.observacionSeguimiento,
    evolucionEstadoSalud: valores.evolucionEstadoSalud,
    fechaRegistro: valorOUndefined(valores.fechaRegistro),
    enfermedades: filasCompletas(
      limpiarFilas(valores.enfermedades, [
        "tipoEnfermedad",
        "estadoEnfermedad",
        "observacionSeguimiento",
      ]),
      ["descripcionEnfermedad"],
    ),
    tratamientos: filasCompletas(
      limpiarFilas(valores.tratamientos, [
        "fechaFin",
        "observaciones",
        "estadoTratamiento",
        "observacionSeguimiento",
      ]),
      ["descripcionTratamiento", "fechaInicio"],
    ),
    seguimientoEnfermedades: filasCompletas(
      limpiarFilas(valores.seguimientoEnfermedades, [
        "observacionSeguimiento",
      ]),
      ["enfermedadId", "estadoEnfermedad"],
    ),
    seguimientoTratamientos: filasCompletas(
      limpiarFilas(valores.seguimientoTratamientos, [
        "observacionSeguimiento",
      ]),
      ["tratamientoId", "estadoTratamiento"],
    ),
    atencionesSanitarias: filasCompletas(
      limpiarFilas(valores.atencionesSanitarias, [
        "estado",
        "fechaRealizacion",
        "observaciones",
      ]),
      ["tipo", "fechaProgramada"],
    ),
  };

  if (datos.requiereCuarentena === undefined) delete datos.requiereCuarentena;
  if (!datos.enfermedades?.length) delete datos.enfermedades;
  if (!datos.tratamientos?.length) delete datos.tratamientos;
  if (!datos.seguimientoEnfermedades?.length) delete datos.seguimientoEnfermedades;
  if (!datos.seguimientoTratamientos?.length) delete datos.seguimientoTratamientos;
  if (!datos.atencionesSanitarias?.length) delete datos.atencionesSanitarias;

  return actualizacionVeterinariaFormSchema.parse(datos);
}
