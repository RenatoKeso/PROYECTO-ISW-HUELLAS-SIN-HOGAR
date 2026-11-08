import { Prisma } from "@prisma/client";
import prisma, { ejecutarEnTransaccion } from "../config/prisma.js";
import {
  actualizacionYaRealizada,
  animalNoEstaEnRefugio,
  esErrorRegistroMedico,
  estadoInvalido,
  registroMedicoDuplicado,
  registroMedicoInexistente,
  revisionInicialRequerida,
  rolInsuficiente,
  seguimientoInvalido,
} from "../entities/registroMedicoErrors.js";
import {
  actualizarRegistroMedico,
  actualizarRegistroMedicoSiEstado,
  actualizarRevisionInicialBloqueada,
  crearAuditoriasRevisionInicial,
  crearEnfermedad,
  crearAtencionSanitaria,
  crearHistorialRegistroMedico,
  crearRegistroMedico,
  crearRevisionFinal,
  crearRevisionInicial,
  crearSeguimientoMedico,
  crearTratamiento,
  guardarRevisionCompletaActual,
  listarHistorialRegistroMedico as listarHistorialRegistroMedicoRepositorio,
  listarSeguimientosMedicos,
  obtenerEnfermedadesPorRegistroMedico,
  obtenerRegistroMedicoPorId,
  obtenerTratamientosPorRegistroMedico,
  obtenerUltimaVersionHistorial,
} from "../repositories/registroMedicoRepository.js";
import { crearActualizacionEstadoAnimal } from "../repositories/actualizacionEstadoAnimalRepository.js";
import { actualizarFichaAnimal } from "../repositories/fichaAnimalRepository.js";
import { crearNotificacion } from "../repositories/notificacionRepository.js";
import { listarUsuariosActivosPorRol } from "../repositories/usuarioRepository.js";
import {
  puedeActualizarRegistroMedico,
  puedeActualizarRevisionInicial,
  puedeRealizarRevisionFinal,
  puedeRegistrarRevisionInicial,
  puedeRegistrarSeguimiento,
} from "./permisosUsuario.js";

const DEPENDENCIAS_POR_DEFECTO = {
  crearRegistroMedico,
  crearRevisionInicial,
  crearRevisionFinal,
  crearEnfermedad,
  crearTratamiento,
  crearAtencionSanitaria,
  crearActualizacionEstadoAnimal,
  obtenerRegistroMedicoPorId,
  actualizarRegistroMedico,
  actualizarRegistroMedicoSiEstado,
  actualizarRevisionInicialBloqueada,
  crearAuditoriasRevisionInicial,
  crearHistorialRegistroMedico,
  crearSeguimientoMedico,
  guardarRevisionCompletaActual,
  listarHistorialRegistroMedico: listarHistorialRegistroMedicoRepositorio,
  listarSeguimientosMedicos,
  obtenerEnfermedadesPorRegistroMedico,
  obtenerTratamientosPorRegistroMedico,
  obtenerUltimaVersionHistorial,
  crearNotificacion,
  listarUsuariosActivosPorRol,
  actualizarFichaAnimal,
  ejecutarEnTransaccion,
};

const CODIGO_CONFLICTO_UNICO = "P2002";

const PRIORIDAD_POR_CLASIFICACION = Object.freeze({
  CRITICO: 1,
  ENFERMO: 2,
  NORMAL: 3,
});

const ESTADOS_FUERA_DE_REFUGIO = new Set([
  "ADOPTADO",
  "EGRESADO",
  "FALLECIDO",
  "TRANSFERIDO",
]);

const ESTADO_REVISION_INICIAL_COMPLETADA = "COMPLETADA";
const ESTADO_REVISION_INICIAL_BLOQUEADA = "BLOQUEADA";
const ESTADOS_VALIDACION_REVISABLES = new Set(["REALIZADO", "ACTUALIZADO"]);
const ESTADO_REVISANDO = "REVISANDO";
const ESTADO_ACTUALIZADO = "ACTUALIZADO";
const ESTADO_REALIZADO = "REALIZADO";
const ESTADOS_ACTUALIZABLES_VETERINARIA = new Set([
  ESTADO_REALIZADO,
  ESTADO_ACTUALIZADO,
]);
const CAMPOS_REVISION_INICIAL = Object.freeze([
  "pesoKg",
  "clasificacionSalud",
  "observacionInicial",
  "requiereCuarentena",
]);
const FORMATO_HORA_AUDITORIA = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function serializarValorAuditoria(campo, valor) {
  if (valor === null || valor === undefined) return null;
  if (campo === "pesoKg") return Number(valor).toFixed(2);
  if (typeof valor === "boolean") return String(valor);
  if (typeof valor === "object" && typeof valor.toFixed === "function") {
    return Number(valor).toFixed(2);
  }

  return String(valor);
}

function valoresSonIguales(campo, anterior, nuevo) {
  if (campo === "pesoKg") {
    if (
      anterior === null ||
      anterior === undefined ||
      nuevo === null ||
      nuevo === undefined
    ) {
      return anterior === nuevo;
    }

    return Number(anterior) === Number(nuevo);
  }

  return anterior === nuevo;
}

function formatearHoraAuditoria(fecha) {
  return FORMATO_HORA_AUDITORIA.format(fecha);
}

function numeroONull(valor) {
  if (valor === null || valor === undefined) return valor ?? null;
  return Number(valor);
}

function resumirDescripciones(items, campo) {
  const descripciones = items
    .map((item) => item?.[campo])
    .filter((descripcion) => typeof descripcion === "string" && descripcion.trim());

  return descripciones.length > 0 ? descripciones.join("; ") : null;
}

function serializarHistorial(historial) {
  return {
    ...historial,
    peso: numeroONull(historial.peso),
  };
}

function serializarSeguimiento(seguimiento) {
  return {
    ...seguimiento,
    peso: numeroONull(seguimiento.peso),
  };
}

function validarSeguimientosPertenecen(
  { seguimientoEnfermedades = [], seguimientoTratamientos = [] },
  enfermedadesExistentes,
  tratamientosExistentes,
) {
  const idsEnfermedades = new Set(
    enfermedadesExistentes.map((enfermedad) => enfermedad.id),
  );
  const idsTratamientos = new Set(
    tratamientosExistentes.map((tratamiento) => tratamiento.id),
  );

  for (const seguimiento of seguimientoEnfermedades) {
    if (!idsEnfermedades.has(seguimiento.enfermedadId)) {
      throw seguimientoInvalido(
        `La enfermedad ${seguimiento.enfermedadId} no pertenece al registro médico`,
      );
    }
  }

  for (const seguimiento of seguimientoTratamientos) {
    if (!idsTratamientos.has(seguimiento.tratamientoId)) {
      throw seguimientoInvalido(
        `El tratamiento ${seguimiento.tratamientoId} no pertenece al registro médico`,
      );
    }
  }
}

function validarRevisionInicialActualizable(registro, registroMedicoId) {
  if (!registro) {
    throw registroMedicoInexistente(registroMedicoId);
  }

  if (
    registro.estadoValidacion === "PROVISIONAL" ||
    !registro.revisionInicial
  ) {
    throw revisionInicialRequerida();
  }

  if (registro.revisionInicial.fechaActualizacion) {
    throw actualizacionYaRealizada();
  }
}

export function prioridadDe(clasificacionSalud) {
  return PRIORIDAD_POR_CLASIFICACION[clasificacionSalud] ?? null;
}

function traducirError(error, animalId) {
  if (esErrorRegistroMedico(error)) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === CODIGO_CONFLICTO_UNICO) {
      return registroMedicoDuplicado(animalId);
    }
  }

  return error;
}

export async function crearRegistroMedicoParaIngreso(
  { animalId, ingresoAnimalId },
  cliente = prisma,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  try {
    return await dependencias.crearRegistroMedico(
      { animalId, ingresoAnimalId },
      cliente,
    );
  } catch (error) {
    throw traducirError(error, animalId);
  }
}

export async function completarRevisionInicial(
  { registroMedicoId, datos, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (!puedeRegistrarRevisionInicial(actor)) {
    throw rolInsuficiente();
  }

  return dependencias.ejecutarEnTransaccion(async (cliente) => {
    const registro = await dependencias.obtenerRegistroMedicoPorId(
      registroMedicoId,
      cliente,
    );

    if (!registro) {
      throw registroMedicoInexistente(registroMedicoId);
    }

    if (registro.estadoValidacion !== "PROVISIONAL") {
      throw estadoInvalido(
        `El registro médico no admite revisión inicial en estado ${registro.estadoValidacion}`,
      );
    }

    if (ESTADOS_FUERA_DE_REFUGIO.has(registro.animal?.estadoEstadia)) {
      throw animalNoEstaEnRefugio(registro.animalId);
    }

    const actualizado = await dependencias.actualizarRegistroMedico(
      registroMedicoId,
      {
        pesoKg: datos.pesoKg,
        clasificacionSalud: datos.clasificacionSalud,
        observacionInicial: datos.observacionInicial,
        requiereCuarentena: datos.requiereCuarentena,
        fechaRevisionInicial: new Date(),
        revisionInicialPorId: actor.id,
        estadoValidacion: "VALIDACION_PENDIENTE",
      },
      cliente,
    );

    try {
      await dependencias.crearRevisionInicial(
        {
          registroMedicoId,
          estadoRevisionInicial: ESTADO_REVISION_INICIAL_COMPLETADA,
          createdById: actor.id,
        },
        cliente,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === CODIGO_CONFLICTO_UNICO
      ) {
        throw estadoInvalido(
          "La revisión inicial de este registro médico ya fue completada",
        );
      }

      throw error;
    }

    return {
      ...actualizado,
      pesoKg: Number(actualizado.pesoKg),
      prioridadAtencion: prioridadDe(actualizado.clasificacionSalud),
    };
  });
}

export async function realizarRevisionFinal(
  { registroMedicoId, datos, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (!puedeRealizarRevisionFinal(actor)) {
    throw rolInsuficiente();
  }

  return dependencias.ejecutarEnTransaccion(async (cliente) => {
    const registro = await dependencias.obtenerRegistroMedicoPorId(
      registroMedicoId,
      cliente,
    );

    if (!registro) {
      throw registroMedicoInexistente(registroMedicoId);
    }

    if (registro.estadoValidacion === "PROVISIONAL") {
      throw revisionInicialRequerida();
    }

    if (registro.estadoValidacion !== "VALIDACION_PENDIENTE") {
      throw estadoInvalido(
        `El registro médico no admite revisión final en estado ${registro.estadoValidacion}`,
      );
    }

    if (ESTADOS_FUERA_DE_REFUGIO.has(registro.animal?.estadoEstadia)) {
      throw animalNoEstaEnRefugio(registro.animalId);
    }

    let revisionFinal;
    try {
      revisionFinal = await dependencias.crearRevisionFinal(
        {
          registroMedicoId: registro.id,
          peso: datos.pesoRevalidadoKg,
          descripcionCuidadosEspeciales:
            datos.descripcionCuidadosEspeciales ?? null,
          descripcionCondicionMedica: datos.condiciones ?? null,
          discapacidades: datos.discapacidades ?? null,
          lesiones: datos.lesiones ?? null,
          estadoSalud: datos.estadoSalud ?? registro.clasificacionSalud,
          createdById: actor.id,
          updatedById: actor.id,
        },
        cliente,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === CODIGO_CONFLICTO_UNICO
      ) {
        throw estadoInvalido(
          "La revisión final de este registro médico ya fue completada",
        );
      }

      throw error;
    }

    if (datos.enfermedades?.length) {
      for (const enfermedad of datos.enfermedades) {
        await dependencias.crearEnfermedad(
          {
            registroMedicoId: registro.id,
            descripcionEnfermedad: enfermedad.descripcionEnfermedad,
            tipoEnfermedad: enfermedad.tipoEnfermedad ?? null,
            createdById: actor.id,
          },
          cliente,
        );
      }
    }

    if (datos.tratamientos?.length) {
      for (const tratamiento of datos.tratamientos) {
        await dependencias.crearTratamiento(
          {
            registroMedicoId: registro.id,
            descripcionTratamiento: tratamiento.descripcionTratamiento,
            fechaInicio: new Date(tratamiento.fechaInicio),
            fechaFin: tratamiento.fechaFin ? new Date(tratamiento.fechaFin) : null,
            observaciones: tratamiento.observaciones ?? null,
            createdById: actor.id,
          },
          cliente,
        );
      }
    }

    if (datos.atencionesSanitarias?.length) {
      for (const atencion of datos.atencionesSanitarias) {
        await dependencias.crearAtencionSanitaria(
          {
            fichaAnimalId: registro.animalId,
            registroMedicoId: registro.id,
            tipo: atencion.tipo,
            fechaProgramada: new Date(atencion.fechaProgramada),
            estado: atencion.estado ?? "PENDIENTE",
            fechaRealizacion: atencion.fechaRealizacion ? new Date(atencion.fechaRealizacion) : null,
            observaciones: atencion.observaciones ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          cliente,
        );
      }
    }

    const actualizado = await dependencias.actualizarRegistroMedico(
      registroMedicoId,
      { estadoValidacion: "REALIZADO" },
      cliente,
    );

    const ficha = await dependencias.actualizarFichaAnimal(
      registro.animalId,
      { estadoAdopcion: datos.adoptabilidad },
      cliente,
    );

    await dependencias.crearActualizacionEstadoAnimal(
      {
        animalId: registro.animalId,
        estadoAnterior: registro.animal.estadoAdopcion,
        estadoNuevo: datos.adoptabilidad,
        fechaActualizacion: new Date(),
        updatedById: actor.id,
      },
      cliente,
    );

    return {
      revisionFinal: {
        ...revisionFinal,
        peso:
          revisionFinal.peso === null || revisionFinal.peso === undefined
            ? revisionFinal.peso
            : Number(revisionFinal.peso),
      },
      ficha,
      registroMedico: actualizado,
    };
  });
}

export async function actualizarRevisionInicial(
  { registroMedicoId, datos, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (!puedeActualizarRevisionInicial(actor)) {
    throw rolInsuficiente();
  }

  const registroPrevio = await dependencias.obtenerRegistroMedicoPorId(
    registroMedicoId,
  );
  validarRevisionInicialActualizable(registroPrevio, registroMedicoId);

  return dependencias.ejecutarEnTransaccion(async (cliente) => {
    const registro = await dependencias.obtenerRegistroMedicoPorId(
      registroMedicoId,
      cliente,
    );
    validarRevisionInicialActualizable(registro, registroMedicoId);

    const estadoValidacionAnterior = registro.estadoValidacion;
    const fechaActualizacion = new Date();
    const horaActualizacion = formatearHoraAuditoria(fechaActualizacion);
    const cambios = CAMPOS_REVISION_INICIAL.filter(
      (campo) =>
        !valoresSonIguales(campo, registro[campo], datos[campo]),
    ).map((campo) => ({
      registroMedicoId: registro.id,
      campo,
      valorAnterior: serializarValorAuditoria(campo, registro[campo]),
      valorNuevo: serializarValorAuditoria(campo, datos[campo]),
      hora: horaActualizacion,
      fecha: fechaActualizacion,
      autorId: actor.id,
    }));

    const actualizacionesRevision =
      await dependencias.actualizarRevisionInicialBloqueada(
        registro.revisionInicial.id,
        {
          fechaActualizacion,
          updatedById: actor.id,
          estadoRevisionInicial: ESTADO_REVISION_INICIAL_BLOQUEADA,
        },
        cliente,
      );

    if (actualizacionesRevision === 0) {
      throw actualizacionYaRealizada();
    }

    const revisadoNuevamente = ESTADOS_VALIDACION_REVISABLES.has(
      estadoValidacionAnterior,
    );

    const registroActualizado = await dependencias.actualizarRegistroMedico(
      registro.id,
      {
        pesoKg: datos.pesoKg,
        clasificacionSalud: datos.clasificacionSalud,
        observacionInicial: datos.observacionInicial,
        requiereCuarentena: datos.requiereCuarentena,
        ...(revisadoNuevamente
          ? { estadoValidacion: "VALIDACION_PENDIENTE" }
          : {}),
      },
      cliente,
    );

    if (cambios.length > 0) {
      await dependencias.crearAuditoriasRevisionInicial(cambios, cliente);
    }

    if (revisadoNuevamente) {
      await dependencias.actualizarFichaAnimal(
        registro.animalId,
        { estadoAdopcion: null },
        cliente,
      );

      const veterinarias =
        await dependencias.listarUsuariosActivosPorRol(
          "VETERINARIA",
          cliente,
        );

      for (const veterinaria of veterinarias) {
        await dependencias.crearNotificacion(
          {
            destinatarioId: veterinaria.id,
            tipo: "REVISION_INICIAL_ACTUALIZADA",
            titulo: "Revisión inicial actualizada",
            mensaje: `La revisión inicial del animal ${
              registro.animal?.nombre ?? registro.animalId
            } fue actualizada y requiere una nueva validación.`,
            registroMedicoId: registro.id,
          },
          cliente,
        );
      }
    }

    return {
      registroMedico: {
        ...registroActualizado,
        pesoKg: Number(registroActualizado.pesoKg),
        fechaActualizacion,
      },
      auditoria: cambios,
      sinCambios: cambios.length === 0,
      revisadoNuevamente,
    };
  });
}

export async function iniciarActualizacionRegistro(
  { registroMedicoId, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (!puedeActualizarRegistroMedico(actor)) {
    throw rolInsuficiente();
  }

  return dependencias.ejecutarEnTransaccion(async (cliente) => {
    const registro = await dependencias.obtenerRegistroMedicoPorId(
      registroMedicoId,
      cliente,
    );

    if (!registro) {
      throw registroMedicoInexistente(registroMedicoId);
    }

    if (!ESTADOS_ACTUALIZABLES_VETERINARIA.has(registro.estadoValidacion)) {
      throw estadoInvalido(
        `El registro médico no admite actualizaciones en estado ${registro.estadoValidacion}`,
      );
    }

    const estadoPrevioRevision = registro.estadoValidacion;
    const actualizados = await dependencias.actualizarRegistroMedicoSiEstado(
      registro.id,
      [...ESTADOS_ACTUALIZABLES_VETERINARIA],
      {
        estadoValidacion: ESTADO_REVISANDO,
        estadoPrevioRevision,
      },
      cliente,
    );

    if (actualizados === 0) {
      throw estadoInvalido(
        "El registro médico cambió de estado y no puede iniciar la actualización",
      );
    }

    return {
      registroMedico: {
        ...registro,
        estadoValidacion: ESTADO_REVISANDO,
        estadoPrevioRevision,
      },
    };
  });
}

export async function cancelarActualizacionRegistro(
  { registroMedicoId, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (!puedeActualizarRegistroMedico(actor)) {
    throw rolInsuficiente();
  }

  return dependencias.ejecutarEnTransaccion(async (cliente) => {
    const registro = await dependencias.obtenerRegistroMedicoPorId(
      registroMedicoId,
      cliente,
    );

    if (!registro) {
      throw registroMedicoInexistente(registroMedicoId);
    }

    if (registro.estadoValidacion !== ESTADO_REVISANDO) {
      throw estadoInvalido(
        `El registro médico no tiene una actualización en curso (estado ${registro.estadoValidacion})`,
      );
    }

    let estadoRestaurado = registro.estadoPrevioRevision;
    if (!estadoRestaurado) {
      const ultimaVersion = await dependencias.obtenerUltimaVersionHistorial(
        registro.id,
        cliente,
      );
      estadoRestaurado =
        ultimaVersion > 0 ? ESTADO_ACTUALIZADO : ESTADO_REALIZADO;
    }

    const actualizados = await dependencias.actualizarRegistroMedicoSiEstado(
      registro.id,
      [ESTADO_REVISANDO],
      {
        estadoValidacion: estadoRestaurado,
        estadoPrevioRevision: null,
      },
      cliente,
    );

    if (actualizados === 0) {
      throw estadoInvalido(
        "La actualización del registro médico ya no está en curso",
      );
    }

    return {
      registroMedico: {
        ...registro,
        estadoValidacion: estadoRestaurado,
        estadoPrevioRevision: null,
      },
    };
  });
}

export async function actualizarRegistro(
  { registroMedicoId, datos, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (
    !puedeActualizarRegistroMedico(actor) ||
    !puedeRegistrarSeguimiento(actor)
  ) {
    throw rolInsuficiente();
  }

  return dependencias.ejecutarEnTransaccion(async (cliente) => {
    const registro = await dependencias.obtenerRegistroMedicoPorId(
      registroMedicoId,
      cliente,
    );

    if (!registro) {
      throw registroMedicoInexistente(registroMedicoId);
    }

    if (registro.estadoValidacion !== ESTADO_REVISANDO) {
      throw estadoInvalido(
        `El registro médico no está en revisión (estado ${registro.estadoValidacion})`,
      );
    }

    const estadoOrigen = registro.estadoPrevioRevision ?? ESTADO_REALIZADO;
    const enfermedadesExistentes =
      await dependencias.obtenerEnfermedadesPorRegistroMedico(
        registro.id,
        cliente,
      );
    const tratamientosExistentes =
      await dependencias.obtenerTratamientosPorRegistroMedico(
        registro.id,
        cliente,
      );

    validarSeguimientosPertenecen(
      datos,
      enfermedadesExistentes,
      tratamientosExistentes,
    );

    const actualizados = await dependencias.actualizarRegistroMedicoSiEstado(
      registro.id,
      [ESTADO_REVISANDO],
      {
        estadoValidacion: ESTADO_ACTUALIZADO,
        estadoPrevioRevision: null,
      },
      cliente,
    );

    if (actualizados === 0) {
      throw estadoInvalido(
        "El registro médico cambió de estado y no puede actualizarse",
      );
    }

    const seguimientosEnfermedad = (datos.seguimientoEnfermedades ?? []).map(
      (seguimiento) => ({
        enfermedadId: seguimiento.enfermedadId,
        estadoEnfermedad: seguimiento.estadoEnfermedad,
        observacionSeguimiento: seguimiento.observacionSeguimiento ?? null,
      }),
    );
    const seguimientosTratamiento = (
      datos.seguimientoTratamientos ?? []
    ).map((seguimiento) => ({
      tratamientoId: seguimiento.tratamientoId,
      estadoTratamiento: seguimiento.estadoTratamiento,
      observacionSeguimiento: seguimiento.observacionSeguimiento ?? null,
    }));

    for (const enfermedad of datos.enfermedades ?? []) {
      const creada = await dependencias.crearEnfermedad(
        {
          registroMedicoId: registro.id,
          descripcionEnfermedad: enfermedad.descripcionEnfermedad,
          tipoEnfermedad: enfermedad.tipoEnfermedad ?? null,
          createdById: actor.id,
        },
        cliente,
      );

      if (enfermedad.estadoEnfermedad) {
        seguimientosEnfermedad.push({
          enfermedadId: creada.id,
          estadoEnfermedad: enfermedad.estadoEnfermedad,
          observacionSeguimiento: enfermedad.observacionSeguimiento ?? null,
        });
      }
    }

    for (const tratamiento of datos.tratamientos ?? []) {
      const creado = await dependencias.crearTratamiento(
        {
          registroMedicoId: registro.id,
          descripcionTratamiento: tratamiento.descripcionTratamiento,
          fechaInicio: new Date(tratamiento.fechaInicio),
          fechaFin: tratamiento.fechaFin
            ? new Date(tratamiento.fechaFin)
            : null,
          observaciones: tratamiento.observaciones ?? null,
          createdById: actor.id,
        },
        cliente,
      );

      if (tratamiento.estadoTratamiento) {
        seguimientosTratamiento.push({
          tratamientoId: creado.id,
          estadoTratamiento: tratamiento.estadoTratamiento,
          observacionSeguimiento: tratamiento.observacionSeguimiento ?? null,
        });
      }
    }

    const pesoActual = numeroONull(datos.pesoKg ?? registro.pesoKg);
    const estadoSalud =
      datos.clasificacionSalud ?? registro.clasificacionSalud;

    if (!estadoSalud) {
      throw revisionInicialRequerida();
    }

    const seguimiento = await dependencias.crearSeguimientoMedico(
      {
        registroMedicoId: registro.id,
        fechaRegistro: datos.fechaRegistro ?? new Date(),
        peso: pesoActual,
        observacionSeguimiento: datos.observacionSeguimiento,
        necesidades: datos.necesidades ?? null,
        estadoSalud,
        evolucionEstadoSalud: datos.evolucionEstadoSalud,
        createdById: actor.id,
        ...(seguimientosEnfermedad.length > 0
          ? {
              seguimientosEnfermedad: {
                create: seguimientosEnfermedad,
              },
            }
          : {}),
        ...(seguimientosTratamiento.length > 0
          ? {
              seguimientosTratamiento: {
                create: seguimientosTratamiento,
              },
            }
          : {}),
      },
      cliente,
    );

    const version =
      (await dependencias.obtenerUltimaVersionHistorial(
        registro.id,
        cliente,
      )) + 1;
    const revisionCompleta = registro.revisionCompleta;
    const historial = await dependencias.crearHistorialRegistroMedico(
      {
        registroMedicoId: registro.id,
        version,
        estadoOrigen,
        peso: pesoActual,
        clasificacionSalud: estadoSalud,
        descripcionCuidadosEspeciales:
          datos.descripcionCuidadosEspeciales ??
          revisionCompleta?.descripcionCuidadosEspeciales ??
          null,
        descripcionCondicionMedica:
          datos.condiciones ??
          revisionCompleta?.descripcionCondicionMedica ??
          null,
        descripcionTratamientos: resumirDescripciones(
          [
            ...tratamientosExistentes,
            ...(datos.tratamientos ?? []),
          ],
          "descripcionTratamiento",
        ),
        descripcionEnfermedades: resumirDescripciones(
          [
            ...enfermedadesExistentes,
            ...(datos.enfermedades ?? []),
          ],
          "descripcionEnfermedad",
        ),
        observacionSeguimiento: datos.observacionSeguimiento,
        actualizadoPorId: actor.id,
      },
      cliente,
    );

    const registroActualizado = await dependencias.actualizarRegistroMedico(
      registro.id,
      {
        ...(datos.pesoKg !== undefined ? { pesoKg: datos.pesoKg } : {}),
        ...(datos.clasificacionSalud !== undefined
          ? { clasificacionSalud: datos.clasificacionSalud }
          : {}),
        ...(datos.observacionInicial !== undefined
          ? { observacionInicial: datos.observacionInicial }
          : {}),
        ...(datos.requiereCuarentena !== undefined
          ? { requiereCuarentena: datos.requiereCuarentena }
          : {}),
        estadoValidacion: ESTADO_ACTUALIZADO,
      },
      cliente,
    );

    const revisionCompletaActualizada =
      await dependencias.guardarRevisionCompletaActual(
        {
          registroMedicoId: registro.id,
          createdById: actor.id,
          updatedById: actor.id,
          edad: revisionCompleta?.edad ?? null,
          peso: pesoActual,
          descripcionCuidadosEspeciales:
            datos.descripcionCuidadosEspeciales ??
            revisionCompleta?.descripcionCuidadosEspeciales ??
            null,
          descripcionCondicionMedica:
            datos.condiciones ??
            revisionCompleta?.descripcionCondicionMedica ??
            null,
          discapacidades:
            datos.discapacidades ?? revisionCompleta?.discapacidades ?? null,
          lesiones: datos.lesiones ?? revisionCompleta?.lesiones ?? null,
          estadoSalud,
        },
        cliente,
      );

    for (const atencion of datos.atencionesSanitarias ?? []) {
      await dependencias.crearAtencionSanitaria(
        {
          fichaAnimalId: registro.animalId,
          registroMedicoId: registro.id,
          tipo: atencion.tipo,
          fechaProgramada: new Date(atencion.fechaProgramada),
          estado: atencion.estado ?? "PENDIENTE",
          fechaRealizacion: atencion.fechaRealizacion
            ? new Date(atencion.fechaRealizacion)
            : null,
          observaciones: atencion.observaciones ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        cliente,
      );
    }

    return {
      registroMedico: {
        ...registroActualizado,
        pesoKg: numeroONull(registroActualizado.pesoKg),
      },
      version,
      historial: serializarHistorial(historial),
      seguimiento: serializarSeguimiento(seguimiento),
      revisionCompleta: revisionCompletaActualizada,
    };
  });
}

export async function listarHistorialRegistroMedico(
  { registroMedicoId, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (!puedeActualizarRegistroMedico(actor)) {
    throw rolInsuficiente();
  }

  const registro = await dependencias.obtenerRegistroMedicoPorId(
    registroMedicoId,
  );

  if (!registro) {
    throw registroMedicoInexistente(registroMedicoId);
  }

  const historial = await dependencias.listarHistorialRegistroMedico(
    registroMedicoId,
  );

  return historial.map(serializarHistorial);
}

export async function listarSeguimientosRegistroMedico(
  { registroMedicoId, actor },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  if (!puedeRegistrarSeguimiento(actor)) {
    throw rolInsuficiente();
  }

  const registro = await dependencias.obtenerRegistroMedicoPorId(
    registroMedicoId,
  );

  if (!registro) {
    throw registroMedicoInexistente(registroMedicoId);
  }

  const seguimientos = await dependencias.listarSeguimientosMedicos(
    registroMedicoId,
  );

  return seguimientos.map(serializarSeguimiento);
}
