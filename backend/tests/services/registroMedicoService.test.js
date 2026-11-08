import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import {
  actualizarRegistro,
  actualizarRevisionInicial,
  cancelarActualizacionRegistro,
  completarRevisionInicial,
  crearRegistroMedicoParaIngreso,
  iniciarActualizacionRegistro,
  listarHistorialRegistroMedico,
  listarSeguimientosRegistroMedico,
  prioridadDe,
  realizarRevisionFinal,
} from "../../src/services/registroMedicoService.js";
import { esErrorRegistroMedico } from "../../src/entities/registroMedicoErrors.js";

async function capturarError(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  return null;
}

test("crearRegistroMedicoParaIngreso pasa el cliente de transaccion al repositorio", async () => {
  const llamadas = [];
  const clienteTx = { __transaccion: true };

  const dependencias = {
    async crearRegistroMedico(datos, cliente) {
      llamadas.push({ datos, cliente });
      return { id: 123, animalId: datos.animalId, ingresoAnimalId: datos.ingresoAnimalId, estadoValidacion: "PROVISIONAL" };
    },
  };

  const resultado = await crearRegistroMedicoParaIngreso(
    { animalId: 10, ingresoAnimalId: 99 },
    clienteTx,
    dependencias,
  );

  assert.equal(resultado.id, 123);
  assert.equal(resultado.estadoValidacion, "PROVISIONAL");
  assert.equal(llamadas.length, 1);
  assert.deepEqual(llamadas[0].datos, { animalId: 10, ingresoAnimalId: 99 });
  assert.equal(llamadas[0].cliente, clienteTx);
});

test("crearRegistroMedicoParaIngreso traduce P2002 a registroMedicoDuplicado", async () => {
  const errorP2002 = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.0.0",
  });

  const dependencias = {
    async crearRegistroMedico() {
      throw errorP2002;
    },
  };

  const error = await capturarError(
    crearRegistroMedicoParaIngreso({ animalId: 7, ingresoAnimalId: 42 }, {}, dependencias),
  );

  assert.ok(error);
  assert.equal(esErrorRegistroMedico(error), true);
  assert.equal(error.codigo, "REGISTRO_MEDICO_DUPLICADO");
  assert.equal(error.estadoHttp, 409);
  assert.equal(error.opcion.animalId, 7);
});

test("crearRegistroMedicoParaIngreso no envuelve otros errores", async () => {
  const errorGenerico = new Error("Fallo inesperado");
  errorGenerico.codigoPersonalizado = true;

  const dependencias = {
    async crearRegistroMedico() {
      throw errorGenerico;
    },
  };

  const error = await capturarError(
    crearRegistroMedicoParaIngreso({ animalId: 5, ingresoAnimalId: 11 }, {}, dependencias),
  );

  assert.ok(error);
  assert.equal(error, errorGenerico);
  assert.equal(error.codigoPersonalizado, true);
  assert.equal(esErrorRegistroMedico(error), false);
});

test("crearRegistroMedicoParaIngreso reenvia un RegistroMedicoError sin traducirlo", async () => {
  const { registroMedicoInexistente } = await import("../../src/entities/registroMedicoErrors.js");
  const errorExistente = registroMedicoInexistente(99);

  const dependencias = {
    async crearRegistroMedico() {
      throw errorExistente;
    },
  };

  const error = await capturarError(
    crearRegistroMedicoParaIngreso({ animalId: 3, ingresoAnimalId: 8 }, {}, dependencias),
  );

  assert.ok(error);
  assert.equal(error, errorExistente);
  assert.equal(esErrorRegistroMedico(error), true);
});

// ---------------------------------------------------------------------------
// r2: revision inicial
// ---------------------------------------------------------------------------

const datosRevision = {
  pesoKg: 12.4,
  clasificacionSalud: "ENFERMO",
  observacionInicial: "Tos persistente y baja de apetito",
  requiereCuarentena: true,
};

const actoraVoluntaria = { id: 3, rol: "VOLUNTARIO", activo: true };
const actoraVeterinaria = { id: 4, rol: "VETERINARIA", activo: true };
const actoraDirectora = { id: 1, rol: "DIRECTORA", activo: true };

function crearDependenciasRevision(sobrescrituras = {}) {
  const llamadas = {
    transacciones: 0,
    consultas: [],
    actualizaciones: [],
    revisionesCreadas: [],
  };

  const registro = {
    id: 14,
    animalId: 39,
    estadoValidacion: "PROVISIONAL",
    animal: { id: 39, estadoEstadia: "ACTIVO" },
    ...(sobrescrituras.registro ?? {}),
  };

  const dependencias = {
    llamadas,
    async ejecutarEnTransaccion(operacion) {
      llamadas.transacciones += 1;
      return operacion("tx");
    },
    async obtenerRegistroMedicoPorId(id, cliente) {
      llamadas.consultas.push({ id, cliente });
      if (sobrescrituras.inexistente) return null;
      return registro;
    },
    async actualizarRegistroMedico(id, data, cliente) {
      llamadas.actualizaciones.push({ id, data, cliente });
      return { ...registro, ...data };
    },
    async crearRevisionInicial(data, cliente) {
      llamadas.revisionesCreadas.push({ data, cliente });
      if (sobrescrituras.errorRevision) throw sobrescrituras.errorRevision;
      return { id: 7, ...data };
    },
  };

  return { dependencias, llamadas, registro };
}

test("prioridadDe traduce la clasificacion de salud a prioridad de atencion", () => {
  assert.equal(prioridadDe("CRITICO"), 1);
  assert.equal(prioridadDe("ENFERMO"), 2);
  assert.equal(prioridadDe("NORMAL"), 3);
  assert.equal(prioridadDe("DESCONOCIDA"), null);
  assert.equal(prioridadDe(undefined), null);
});

test("una voluntaria completa la revision inicial y el registro pasa a VALIDACION_PENDIENTE", async () => {
  const { dependencias, llamadas } = crearDependenciasRevision();

  const resultado = await completarRevisionInicial(
    { registroMedicoId: 14, datos: datosRevision, actor: actoraVoluntaria },
    dependencias,
  );

  assert.equal(llamadas.transacciones, 1);
  assert.deepEqual(llamadas.consultas, [{ id: 14, cliente: "tx" }]);
  assert.equal(llamadas.actualizaciones.length, 1);

  const { data } = llamadas.actualizaciones[0];
  assert.equal(data.estadoValidacion, "VALIDACION_PENDIENTE");
  assert.equal(data.revisionInicialPorId, actoraVoluntaria.id);
  assert.equal(data.pesoKg, 12.4);
  assert.equal(data.clasificacionSalud, "ENFERMO");
  assert.equal(data.requiereCuarentena, true);
  assert.ok(data.fechaRevisionInicial instanceof Date);

  assert.equal(resultado.estadoValidacion, "VALIDACION_PENDIENTE");
  assert.equal(resultado.pesoKg, 12.4);
  assert.equal(resultado.prioridadAtencion, 2);
});

test("la veterinaria tambien puede registrar la revision inicial", async () => {
  const { dependencias, llamadas } = crearDependenciasRevision();

  const resultado = await completarRevisionInicial(
    { registroMedicoId: 14, datos: datosRevision, actor: actoraVeterinaria },
    dependencias,
  );

  assert.equal(llamadas.actualizaciones[0].data.revisionInicialPorId, 4);
  assert.equal(resultado.prioridadAtencion, 2);
});

test("la revision inicial crea la fila de ciclo de vida de RevisionInicial", async () => {
  const { dependencias, llamadas } = crearDependenciasRevision();

  await completarRevisionInicial(
    { registroMedicoId: 14, datos: datosRevision, actor: actoraVoluntaria },
    dependencias,
  );

  assert.deepEqual(llamadas.revisionesCreadas, [
    {
      data: {
        registroMedicoId: 14,
        estadoRevisionInicial: "COMPLETADA",
        createdById: 3,
      },
      cliente: "tx",
    },
  ]);
});

test("convierte el peso Decimal de Prisma a numero en la respuesta", async () => {
  const { dependencias } = crearDependenciasRevision();
  dependencias.actualizarRegistroMedico = async (id, data) => ({
    id,
    ...data,
    pesoKg: new Prisma.Decimal("12.40"),
  });

  const resultado = await completarRevisionInicial(
    { registroMedicoId: 14, datos: datosRevision, actor: actoraVoluntaria },
    dependencias,
  );

  assert.equal(typeof resultado.pesoKg, "number");
  assert.equal(resultado.pesoKg, 12.4);
});

test("un rol sin permiso se rechaza con 403 y no abre transaccion", async () => {
  const { dependencias, llamadas } = crearDependenciasRevision();

  const error = await capturarError(
    completarRevisionInicial(
      { registroMedicoId: 14, datos: datosRevision, actor: actoraDirectora },
      dependencias,
    ),
  );

  assert.ok(error);
  assert.equal(error.codigo, "ROL_INSUFICIENTE");
  assert.equal(error.estadoHttp, 403);
  assert.equal(llamadas.transacciones, 0);
});

test("una cuenta inactiva se rechaza con 403", async () => {
  const { dependencias } = crearDependenciasRevision();

  const error = await capturarError(
    completarRevisionInicial(
      {
        registroMedicoId: 14,
        datos: datosRevision,
        actor: { ...actoraVoluntaria, activo: false },
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ROL_INSUFICIENTE");
  assert.equal(error.estadoHttp, 403);
});

test("un registro inexistente responde 404", async () => {
  const { dependencias } = crearDependenciasRevision({ inexistente: true });

  const error = await capturarError(
    completarRevisionInicial(
      { registroMedicoId: 999, datos: datosRevision, actor: actoraVoluntaria },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "REGISTRO_MEDICO_INEXISTENTE");
  assert.equal(error.estadoHttp, 404);
});

test("un registro que ya no esta PROVISIONAL responde 409 y no escribe", async () => {
  const { dependencias, llamadas } = crearDependenciasRevision({
    registro: { estadoValidacion: "VALIDACION_PENDIENTE" },
  });

  const error = await capturarError(
    completarRevisionInicial(
      { registroMedicoId: 14, datos: datosRevision, actor: actoraVoluntaria },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ESTADO_INVALIDO");
  assert.equal(error.estadoHttp, 409);
  assert.equal(llamadas.actualizaciones.length, 0);
  assert.equal(llamadas.revisionesCreadas.length, 0);
});

test("un animal que ya salio del refugio responde 409 y no escribe", async () => {
  for (const estadoEstadia of [
    "ADOPTADO",
    "EGRESADO",
    "FALLECIDO",
    "TRANSFERIDO",
  ]) {
    const { dependencias, llamadas } = crearDependenciasRevision({
      registro: { animal: { id: 39, estadoEstadia } },
    });

    const error = await capturarError(
      completarRevisionInicial(
        { registroMedicoId: 14, datos: datosRevision, actor: actoraVoluntaria },
        dependencias,
      ),
    );

    assert.equal(error.codigo, "ANIMAL_NO_ESTA_EN_REFUGIO");
    assert.equal(error.estadoHttp, 409);
    assert.equal(llamadas.actualizaciones.length, 0);
  }
});

test("un animal ACTIVO o en ESPERA_ADOPCION si admite revision inicial", async () => {
  for (const estadoEstadia of ["ACTIVO", "ESPERA_ADOPCION"]) {
    const { dependencias } = crearDependenciasRevision({
      registro: { animal: { id: 39, estadoEstadia } },
    });

    const resultado = await completarRevisionInicial(
      { registroMedicoId: 14, datos: datosRevision, actor: actoraVoluntaria },
      dependencias,
    );

    assert.equal(resultado.estadoValidacion, "VALIDACION_PENDIENTE");
  }
});

test("un conflicto al crear RevisionInicial se traduce a 409", async () => {
  const errorP2002 = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    { code: "P2002", clientVersion: "6.19.3" },
  );

  const { dependencias } = crearDependenciasRevision({
    errorRevision: errorP2002,
  });

  const error = await capturarError(
    completarRevisionInicial(
      { registroMedicoId: 14, datos: datosRevision, actor: actoraVoluntaria },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ESTADO_INVALIDO");
  assert.equal(error.estadoHttp, 409);
});

// ---------------------------------------------------------------------------
// r4: revision final
// ---------------------------------------------------------------------------

const datosRevisionFinal = {
  pesoRevalidadoKg: 13.2,
  condiciones: "Condición estable",
  discapacidades: "Movilidad reducida",
  lesiones: "Herida leve",
  descripcionCuidadosEspeciales: "Dieta especial",
  estadoSalud: "NORMAL",
  adoptabilidad: "ADOPTABLE",
  enfermedades: [
    {
      descripcionEnfermedad: "Dermatitis",
      tipoEnfermedad: "Piel",
    },
  ],
  tratamientos: [
    {
      descripcionTratamiento: "Antibiótico",
      fechaInicio: "2026-11-03",
      fechaFin: "2026-11-10",
      observaciones: "Cada 12 horas",
    },
  ],
  atencionesSanitarias: [
    {
      tipo: "vacuna",
      fechaProgramada: "2026-11-15",
      estado: "PENDIENTE",
      observaciones: "Refuerzo",
    },
  ],
};

function crearDependenciasRevisionFinal(sobrescrituras = {}) {
  const llamadas = {
    transacciones: 0,
    revisionesFinales: [],
    enfermedades: [],
    tratamientos: [],
    atenciones: [],
    actualizacionesRegistro: [],
    fichas: [],
    actualizacionesEstado: [],
  };

  const registro = {
    id: 14,
    animalId: 39,
    estadoValidacion: "VALIDACION_PENDIENTE",
    clasificacionSalud: "ENFERMO",
    animal: {
      id: 39,
      estadoEstadia: "ACTIVO",
      estadoAdopcion: "NO_ADOPTABLE",
    },
    ...(sobrescrituras.registro ?? {}),
  };

  const dependencias = {
    llamadas,
    async ejecutarEnTransaccion(operacion) {
      llamadas.transacciones += 1;
      return operacion("tx");
    },
    async obtenerRegistroMedicoPorId() {
      return sobrescrituras.inexistente ? null : registro;
    },
    async crearRevisionFinal(data, cliente) {
      llamadas.revisionesFinales.push({ data, cliente });
      if (sobrescrituras.errorRevisionFinal) {
        throw sobrescrituras.errorRevisionFinal;
      }
      return { id: 8, ...data };
    },
    async crearEnfermedad(data, cliente) {
      llamadas.enfermedades.push({ data, cliente });
      return { id: 1, ...data };
    },
    async crearTratamiento(data, cliente) {
      llamadas.tratamientos.push({ data, cliente });
      return { id: 1, ...data };
    },
    async crearAtencionSanitaria(data, cliente) {
      llamadas.atenciones.push({ data, cliente });
      return { id: 1, ...data };
    },
    async actualizarRegistroMedico(id, data, cliente) {
      llamadas.actualizacionesRegistro.push({ id, data, cliente });
      return { ...registro, ...data };
    },
    async actualizarFichaAnimal(id, data, cliente) {
      llamadas.fichas.push({ id, data, cliente });
      return { id, ...data };
    },
    async crearActualizacionEstadoAnimal(data, cliente) {
      llamadas.actualizacionesEstado.push({ data, cliente });
      return { id: 1, ...data };
    },
  };

  return { dependencias, llamadas };
}

test("la veterinaria completa la revision final y actualiza registro, ficha e historial", async () => {
  const { dependencias, llamadas } = crearDependenciasRevisionFinal();

  const resultado = await realizarRevisionFinal(
    {
      registroMedicoId: 14,
      datos: datosRevisionFinal,
      actor: actoraVeterinaria,
    },
    dependencias,
  );

  assert.equal(llamadas.transacciones, 1);

  const revision = llamadas.revisionesFinales[0];
  assert.equal(revision.cliente, "tx");
  assert.equal(revision.data.registroMedicoId, 14);
  assert.equal(revision.data.peso, 13.2);
  assert.equal(revision.data.descripcionCondicionMedica, "Condición estable");
  assert.equal(revision.data.discapacidades, "Movilidad reducida");
  assert.equal(revision.data.lesiones, "Herida leve");
  assert.equal(revision.data.descripcionCuidadosEspeciales, "Dieta especial");
  assert.equal(revision.data.estadoSalud, "NORMAL");
  assert.equal(revision.data.createdById, actoraVeterinaria.id);
  assert.equal(revision.data.updatedById, actoraVeterinaria.id);

  assert.equal(llamadas.enfermedades.length, 1);
  assert.equal(
    llamadas.enfermedades[0].data.descripcionEnfermedad,
    "Dermatitis",
  );
  assert.equal(llamadas.enfermedades[0].data.tipoEnfermedad, "Piel");

  assert.equal(llamadas.tratamientos.length, 1);
  assert.equal(
    llamadas.tratamientos[0].data.descripcionTratamiento,
    "Antibiótico",
  );
  assert.ok(llamadas.tratamientos[0].data.fechaInicio instanceof Date);
  assert.ok(llamadas.tratamientos[0].data.fechaFin instanceof Date);

  assert.equal(llamadas.atenciones.length, 1);
  assert.equal(llamadas.atenciones[0].data.fichaAnimalId, 39);
  assert.equal(llamadas.atenciones[0].data.tipo, "vacuna");
  assert.equal(llamadas.atenciones[0].data.estado, "PENDIENTE");
  assert.ok(llamadas.atenciones[0].data.fechaProgramada instanceof Date);

  assert.equal(llamadas.actualizacionesRegistro.length, 1);
  assert.deepEqual(llamadas.actualizacionesRegistro[0].data, {
    estadoValidacion: "REALIZADO",
  });

  assert.deepEqual(llamadas.fichas[0], {
    id: 39,
    data: { estadoAdopcion: "ADOPTABLE" },
    cliente: "tx",
  });

  assert.equal(llamadas.actualizacionesEstado.length, 1);
  const actualizacion = llamadas.actualizacionesEstado[0].data;
  assert.equal(actualizacion.animalId, 39);
  assert.equal(actualizacion.estadoAnterior, "NO_ADOPTABLE");
  assert.equal(actualizacion.estadoNuevo, "ADOPTABLE");
  assert.equal(actualizacion.updatedById, actoraVeterinaria.id);
  assert.ok(actualizacion.fechaActualizacion instanceof Date);

  assert.equal(resultado.registroMedico.estadoValidacion, "REALIZADO");
  assert.equal(resultado.ficha.estadoAdopcion, "ADOPTABLE");
  assert.equal(resultado.revisionFinal.peso, 13.2);
});

test("la revision final sin listas opcionales no crea enfermedades, tratamientos ni atenciones", async () => {
  const { dependencias, llamadas } = crearDependenciasRevisionFinal();

  await realizarRevisionFinal(
    {
      registroMedicoId: 14,
      datos: {
        pesoRevalidadoKg: 12,
        adoptabilidad: "NO_ADOPTABLE",
      },
      actor: actoraVeterinaria,
    },
    dependencias,
  );

  assert.equal(llamadas.enfermedades.length, 0);
  assert.equal(llamadas.tratamientos.length, 0);
  assert.equal(llamadas.atenciones.length, 0);
});

test("solo una veterinaria activa puede realizar la revision final", async () => {
  const { dependencias, llamadas } = crearDependenciasRevisionFinal();

  const error = await capturarError(
    realizarRevisionFinal(
      {
        registroMedicoId: 14,
        datos: datosRevisionFinal,
        actor: actoraDirectora,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ROL_INSUFICIENTE");
  assert.equal(error.estadoHttp, 403);
  assert.equal(llamadas.transacciones, 0);
});

test("la revision final exige que la revision inicial este completada", async () => {
  const { dependencias } = crearDependenciasRevisionFinal({
    registro: { estadoValidacion: "PROVISIONAL" },
  });

  const error = await capturarError(
    realizarRevisionFinal(
      {
        registroMedicoId: 14,
        datos: datosRevisionFinal,
        actor: actoraVeterinaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "REVISION_INICIAL_REQUERIDA");
  assert.equal(error.estadoHttp, 409);
});

test("la revision final rechaza un registro que ya no esta VALIDACION_PENDIENTE", async () => {
  const { dependencias, llamadas } = crearDependenciasRevisionFinal({
    registro: { estadoValidacion: "REALIZADO" },
  });

  const error = await capturarError(
    realizarRevisionFinal(
      {
        registroMedicoId: 14,
        datos: datosRevisionFinal,
        actor: actoraVeterinaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ESTADO_INVALIDO");
  assert.equal(error.estadoHttp, 409);
  assert.equal(llamadas.revisionesFinales.length, 0);
});

test("la revision final rechaza un animal que ya salio del refugio", async () => {
  const { dependencias } = crearDependenciasRevisionFinal({
    registro: { animal: { id: 39, estadoEstadia: "ADOPTADO", estadoAdopcion: "ADOPTABLE" } },
  });

  const error = await capturarError(
    realizarRevisionFinal(
      {
        registroMedicoId: 14,
        datos: datosRevisionFinal,
        actor: actoraVeterinaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ANIMAL_NO_ESTA_EN_REFUGIO");
  assert.equal(error.estadoHttp, 409);
});

test("un conflicto al crear RevisionCompleta se traduce a 409", async () => {
  const errorP2002 = new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed",
    { code: "P2002", clientVersion: "6.19.3" },
  );

  const { dependencias } = crearDependenciasRevisionFinal({
    errorRevisionFinal: errorP2002,
  });

  const error = await capturarError(
    realizarRevisionFinal(
      {
        registroMedicoId: 14,
        datos: datosRevisionFinal,
        actor: actoraVeterinaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ESTADO_INVALIDO");
  assert.equal(error.estadoHttp, 409);
});

test("convierte el peso Decimal de RevisionCompleta a numero en la respuesta", async () => {
  const { dependencias } = crearDependenciasRevisionFinal();
  dependencias.crearRevisionFinal = async (data) => ({
    id: 8,
    ...data,
    peso: new Prisma.Decimal("13.20"),
  });

  const resultado = await realizarRevisionFinal(
    {
      registroMedicoId: 14,
      datos: datosRevisionFinal,
      actor: actoraVeterinaria,
    },
    dependencias,
  );

  assert.equal(typeof resultado.revisionFinal.peso, "number");
  assert.equal(resultado.revisionFinal.peso, 13.2);
});

// ---------------------------------------------------------------------------
// r5: actualizacion unica de la revision inicial
// ---------------------------------------------------------------------------

const datosActualizacionRevision = {
  pesoKg: 11.8,
  clasificacionSalud: "NORMAL",
  observacionInicial: "Sin tos ni baja de apetito",
  requiereCuarentena: false,
};

const actoraVoluntariaConfianza = {
  id: 6,
  rol: "VOLUNTARIO_CONFIANZA",
  activo: true,
};

function crearDependenciasActualizacionRevision(sobrescrituras = {}) {
  const llamadas = {
    transacciones: 0,
    consultas: [],
    bloqueos: [],
    actualizacionesRegistro: [],
    auditorias: [],
    fichas: [],
    listadosVeterinarias: [],
    notificaciones: [],
  };

  const revisionInicial = {
    id: 7,
    registroMedicoId: 14,
    estadoRevisionInicial: "COMPLETADA",
    fechaActualizacion: null,
    ...(sobrescrituras.revisionInicial ?? {}),
  };

  const registro = {
    id: 14,
    animalId: 39,
    estadoValidacion: "VALIDACION_PENDIENTE",
    pesoKg: new Prisma.Decimal("12.40"),
    clasificacionSalud: "ENFERMO",
    observacionInicial: "Tos persistente",
    requiereCuarentena: true,
    createdAt: new Date("2026-10-14T15:04:05.000Z"),
    animal: {
      id: 39,
      nombre: "Firulais",
      estadoAdopcion: "NO_ADOPTABLE",
    },
    revisionInicial,
    ...(sobrescrituras.registro ?? {}),
  };

  const dependencias = {
    llamadas,
    async ejecutarEnTransaccion(operacion) {
      llamadas.transacciones += 1;
      return operacion("tx");
    },
    async obtenerRegistroMedicoPorId(id, cliente) {
      llamadas.consultas.push({ id, cliente });
      return sobrescrituras.inexistente ? null : registro;
    },
    async actualizarRevisionInicialBloqueada(id, data, cliente) {
      llamadas.bloqueos.push({ id, data, cliente });
      return sobrescrituras.sinCupo ? 0 : 1;
    },
    async actualizarRegistroMedico(id, data, cliente) {
      llamadas.actualizacionesRegistro.push({ id, data, cliente });
      return { ...registro, ...data };
    },
    async crearAuditoriasRevisionInicial(data, cliente) {
      if (sobrescrituras.errorAuditoria) {
        throw sobrescrituras.errorAuditoria;
      }
      llamadas.auditorias.push({ data, cliente });
      return { count: data.length };
    },
    async actualizarFichaAnimal(id, data, cliente) {
      llamadas.fichas.push({ id, data, cliente });
      return { id, ...data };
    },
    async listarUsuariosActivosPorRol(rol, cliente) {
      llamadas.listadosVeterinarias.push({ rol, cliente });
      if (sobrescrituras.errorListadoVeterinarias) {
        throw sobrescrituras.errorListadoVeterinarias;
      }
      return (
        sobrescrituras.veterinarias ?? [
          { id: 4, nombre: "Veterinaria Uno", rol: "VETERINARIA" },
        ]
      );
    },
    async crearNotificacion(data, cliente) {
      if (sobrescrituras.errorNotificacion) {
        throw sobrescrituras.errorNotificacion;
      }
      llamadas.notificaciones.push({ data, cliente });
      return { id: 1, ...data };
    },
  };

  return { dependencias, llamadas, registro, revisionInicial };
}

test("una voluntaria actualiza una vez la revision inicial y audita cada campo", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision();

  const resultado = await actualizarRevisionInicial(
    {
      registroMedicoId: 14,
      datos: datosActualizacionRevision,
      actor: actoraVoluntaria,
    },
    dependencias,
  );

  assert.equal(llamadas.transacciones, 1);
  assert.deepEqual(llamadas.consultas, [
    { id: 14, cliente: undefined },
    { id: 14, cliente: "tx" },
  ]);

  const bloqueo = llamadas.bloqueos[0];
  assert.equal(bloqueo.id, 7);
  assert.equal(bloqueo.cliente, "tx");
  assert.equal(bloqueo.data.estadoRevisionInicial, "BLOQUEADA");
  assert.equal(bloqueo.data.updatedById, actoraVoluntaria.id);
  assert.ok(bloqueo.data.fechaActualizacion instanceof Date);

  assert.deepEqual(Object.keys(llamadas.actualizacionesRegistro[0].data).sort(), [
    "clasificacionSalud",
    "observacionInicial",
    "pesoKg",
    "requiereCuarentena",
  ]);
  assert.deepEqual(llamadas.actualizacionesRegistro[0].data, {
    pesoKg: 11.8,
    clasificacionSalud: "NORMAL",
    observacionInicial: "Sin tos ni baja de apetito",
    requiereCuarentena: false,
  });

  assert.equal(llamadas.auditorias.length, 1);
  assert.equal(llamadas.auditorias[0].data.length, 4);
  assert.deepEqual(
    llamadas.auditorias[0].data.map(({ campo }) => campo).sort(),
    [
      "clasificacionSalud",
      "observacionInicial",
      "pesoKg",
      "requiereCuarentena",
    ],
  );
  const auditoriaPeso = llamadas.auditorias[0].data.find(
    ({ campo }) => campo === "pesoKg",
  );
  assert.deepEqual(
    {
      registroMedicoId: auditoriaPeso.registroMedicoId,
      campo: auditoriaPeso.campo,
      valorAnterior: auditoriaPeso.valorAnterior,
      valorNuevo: auditoriaPeso.valorNuevo,
      autorId: auditoriaPeso.autorId,
    },
    {
      registroMedicoId: 14,
      campo: "pesoKg",
      valorAnterior: "12.40",
      valorNuevo: "11.80",
      autorId: actoraVoluntaria.id,
    },
  );
  assert.match(auditoriaPeso.hora, /^\d{2}:\d{2}:\d{2}$/);
  assert.ok(auditoriaPeso.fecha instanceof Date);

  assert.equal(llamadas.fichas.length, 0);
  assert.equal(llamadas.notificaciones.length, 0);
  assert.equal(resultado.sinCambios, false);
  assert.equal(resultado.revisadoNuevamente, false);
  assert.equal(typeof resultado.registroMedico.pesoKg, "number");
  assert.ok(resultado.registroMedico.fechaActualizacion instanceof Date);
});

test("un voluntario de confianza tambien puede actualizar la revision inicial", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision();

  const resultado = await actualizarRevisionInicial(
    {
      registroMedicoId: 14,
      datos: datosActualizacionRevision,
      actor: actoraVoluntariaConfianza,
    },
    dependencias,
  );

  assert.equal(llamadas.bloqueos[0].data.updatedById, 6);
  assert.equal(resultado.revisadoNuevamente, false);
});

test("una veterinaria no puede actualizar la revision inicial", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision();

  const error = await capturarError(
    actualizarRevisionInicial(
      {
        registroMedicoId: 14,
        datos: datosActualizacionRevision,
        actor: actoraVeterinaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ROL_INSUFICIENTE");
  assert.equal(error.estadoHttp, 403);
  assert.equal(llamadas.transacciones, 0);
  assert.equal(llamadas.consultas.length, 0);
});

test("una cuenta inactiva no puede actualizar la revision inicial", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision();

  const error = await capturarError(
    actualizarRevisionInicial(
      {
        registroMedicoId: 14,
        datos: datosActualizacionRevision,
        actor: { ...actoraVoluntaria, activo: false },
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ROL_INSUFICIENTE");
  assert.equal(llamadas.transacciones, 0);
});

test("una segunda actualizacion responde 409 sin abrir transaccion", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionRevision({
      revisionInicial: { fechaActualizacion: new Date("2026-10-14T18:30:00.000Z") },
    });

  const error = await capturarError(
    actualizarRevisionInicial(
      {
        registroMedicoId: 14,
        datos: datosActualizacionRevision,
        actor: actoraVoluntaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ACTUALIZACION_YA_REALIZADA");
  assert.equal(error.estadoHttp, 409);
  assert.equal(llamadas.transacciones, 0);
  assert.equal(llamadas.bloqueos.length, 0);
  assert.equal(llamadas.actualizacionesRegistro.length, 0);
});

test("un registro PROVISIONAL no admite actualizacion de revision inicial", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision({
    registro: { estadoValidacion: "PROVISIONAL" },
  });

  const error = await capturarError(
    actualizarRevisionInicial(
      {
        registroMedicoId: 14,
        datos: datosActualizacionRevision,
        actor: actoraVoluntaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "REVISION_INICIAL_REQUERIDA");
  assert.equal(error.estadoHttp, 409);
  assert.equal(llamadas.transacciones, 0);
});

test("un registro sin fila RevisionInicial no admite actualizacion", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision({
    registro: { revisionInicial: null },
  });

  const error = await capturarError(
    actualizarRevisionInicial(
      {
        registroMedicoId: 14,
        datos: datosActualizacionRevision,
        actor: actoraVoluntaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "REVISION_INICIAL_REQUERIDA");
  assert.equal(llamadas.transacciones, 0);
});

test("reenviar los mismos valores consume el bloqueo sin crear auditoria", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision();

  const resultado = await actualizarRevisionInicial(
    {
      registroMedicoId: 14,
      datos: {
        pesoKg: 12.4,
        clasificacionSalud: "ENFERMO",
        observacionInicial: "Tos persistente",
        requiereCuarentena: true,
      },
      actor: actoraVoluntaria,
    },
    dependencias,
  );

  assert.equal(resultado.sinCambios, true);
  assert.equal(resultado.auditoria.length, 0);
  assert.equal(llamadas.auditorias.length, 0);
  assert.equal(llamadas.bloqueos.length, 1);
  assert.ok(llamadas.bloqueos[0].data.fechaActualizacion instanceof Date);
  assert.equal(llamadas.actualizacionesRegistro.length, 1);
});

test("actualizar un registro REALIZADO lo devuelve a VALIDACION_PENDIENTE y notifica a veterinarias", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision({
    registro: {
      estadoValidacion: "REALIZADO",
      animal: {
        id: 39,
        nombre: "Firulais",
        estadoAdopcion: "ADOPTABLE",
      },
    },
    veterinarias: [
      { id: 4, nombre: "Veterinaria Uno", rol: "VETERINARIA" },
      { id: 9, nombre: "Veterinaria Dos", rol: "VETERINARIA" },
    ],
  });

  const resultado = await actualizarRevisionInicial(
    {
      registroMedicoId: 14,
      datos: datosActualizacionRevision,
      actor: actoraVoluntaria,
    },
    dependencias,
  );

  assert.deepEqual(llamadas.actualizacionesRegistro[0].data, {
    pesoKg: 11.8,
    clasificacionSalud: "NORMAL",
    observacionInicial: "Sin tos ni baja de apetito",
    requiereCuarentena: false,
    estadoValidacion: "VALIDACION_PENDIENTE",
  });

  assert.deepEqual(llamadas.fichas, [
    { id: 39, data: { estadoAdopcion: null }, cliente: "tx" },
  ]);
  assert.deepEqual(llamadas.listadosVeterinarias, [
    { rol: "VETERINARIA", cliente: "tx" },
  ]);
  assert.equal(llamadas.notificaciones.length, 2);
  assert.deepEqual(
    llamadas.notificaciones.map(({ data }) => data.destinatarioId),
    [4, 9],
  );
  assert.equal(
    llamadas.notificaciones[0].data.tipo,
    "REVISION_INICIAL_ACTUALIZADA",
  );
  assert.equal(llamadas.notificaciones[0].data.registroMedicoId, 14);
  assert.match(llamadas.notificaciones[0].data.mensaje, /Firulais/);
  assert.equal(resultado.revisadoNuevamente, true);
});

test("actualizar un registro VALIDACION_PENDIENTE no notifica ni limpia adopcion", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision();

  await actualizarRevisionInicial(
    {
      registroMedicoId: 14,
      datos: datosActualizacionRevision,
      actor: actoraVoluntaria,
    },
    dependencias,
  );

  assert.equal(llamadas.fichas.length, 0);
  assert.equal(llamadas.listadosVeterinarias.length, 0);
  assert.equal(llamadas.notificaciones.length, 0);
});

test("si otra transaccion gano la carrera responde 409 y no actualiza el registro", async () => {
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision({
    sinCupo: true,
  });

  const error = await capturarError(
    actualizarRevisionInicial(
      {
        registroMedicoId: 14,
        datos: datosActualizacionRevision,
        actor: actoraVoluntaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ACTUALIZACION_YA_REALIZADA");
  assert.equal(error.estadoHttp, 409);
  assert.equal(llamadas.bloqueos.length, 1);
  assert.equal(llamadas.actualizacionesRegistro.length, 0);
  assert.equal(llamadas.auditorias.length, 0);
});

test("un fallo al notificar se propaga para revertir la transaccion", async () => {
  const errorNotificacion = new Error("No se pudo notificar");
  const { dependencias, llamadas } = crearDependenciasActualizacionRevision({
    registro: { estadoValidacion: "REALIZADO" },
    errorNotificacion,
  });

  const error = await capturarError(
    actualizarRevisionInicial(
      {
        registroMedicoId: 14,
        datos: datosActualizacionRevision,
        actor: actoraVoluntaria,
      },
      dependencias,
    ),
  );

  assert.equal(error, errorNotificacion);
  assert.equal(llamadas.notificaciones.length, 0);
});

// ---------------------------------------------------------------------------
// r6: actualizaciones veterinarias y seguimientos
// ---------------------------------------------------------------------------

const datosActualizacionVeterinaria = {
  pesoKg: 13.1,
  clasificacionSalud: "NORMAL",
  observacionInicial: "Control veterinario sin complicaciones",
  requiereCuarentena: false,
  condiciones: "Sin condiciones adicionales",
  necesidades: "Dieta blanda por dos días",
  observacionSeguimiento: "Evoluciona favorablemente",
  evolucionEstadoSalud: "MEJORANDO",
  fechaRegistro: new Date("2026-11-03T12:00:00.000Z"),
};

function crearDependenciasActualizacionVeterinaria(sobrescrituras = {}) {
  const llamadas = {
    transacciones: 0,
    consultas: [],
    claims: [],
    enfermedades: [],
    tratamientos: [],
    seguimientos: [],
    historiales: [],
    revisionesCompletas: [],
    actualizacionesRegistro: [],
    atenciones: [],
  };

  const registro =
    sobrescrituras.registro === undefined
      ? {
          id: 14,
          animalId: 39,
          estadoValidacion: "REVISANDO",
          estadoPrevioRevision: "REALIZADO",
          pesoKg: new Prisma.Decimal("12.40"),
          clasificacionSalud: "ENFERMO",
          observacionInicial: "Tos persistente",
          requiereCuarentena: true,
          revisionCompleta: {
            edad: 3,
            descripcionCondicionMedica: "Condición previa",
            descripcionCuidadosEspeciales: "Cuidados previos",
            discapacidades: null,
            lesiones: null,
          },
          animal: { id: 39, nombre: "Firulais", estadoEstadia: "ACTIVO" },
        }
      : sobrescrituras.registro;

  const enfermedadesExistentes = sobrescrituras.enfermedades ?? [
    { id: 71, descripcionEnfermedad: "Parvovirus" },
  ];
  const tratamientosExistentes = sobrescrituras.tratamientos ?? [
    { id: 81, descripcionTratamiento: "Suero oral" },
  ];

  const dependencias = {
    async ejecutarEnTransaccion(callback) {
      llamadas.transacciones += 1;
      return callback("tx");
    },
    async obtenerRegistroMedicoPorId(id, cliente) {
      llamadas.consultas.push({ id, cliente });
      return registro;
    },
    async actualizarRegistroMedicoSiEstado(id, estados, data, cliente) {
      llamadas.claims.push({ id, estados, data, cliente });

      if (sobrescrituras.sinCupo) return 0;
      return 1;
    },
    async obtenerEnfermedadesPorRegistroMedico() {
      return enfermedadesExistentes;
    },
    async obtenerTratamientosPorRegistroMedico() {
      return tratamientosExistentes;
    },
    async crearEnfermedad(data) {
      llamadas.enfermedades.push(data);
      return { id: 100 + llamadas.enfermedades.length, ...data };
    },
    async crearTratamiento(data) {
      llamadas.tratamientos.push(data);
      return { id: 200 + llamadas.tratamientos.length, ...data };
    },
    async crearSeguimientoMedico(data) {
      llamadas.seguimientos.push(data);
      return { id: 300, ...data };
    },
    async obtenerUltimaVersionHistorial() {
      return sobrescrituras.ultimaVersion ?? 0;
    },
    async crearHistorialRegistroMedico(data) {
      llamadas.historiales.push(data);
      return { id: 400, ...data };
    },
    async actualizarRegistroMedico(id, data) {
      llamadas.actualizacionesRegistro.push({ id, data });
      return { ...registro, ...data };
    },
    async guardarRevisionCompletaActual(data) {
      llamadas.revisionesCompletas.push(data);
      return { id: 1, ...data };
    },
    async crearAtencionSanitaria(data) {
      llamadas.atenciones.push(data);
      return { id: 500, ...data };
    },
    async listarHistorialRegistroMedico() {
      return sobrescrituras.historialListado ?? [];
    },
    async listarSeguimientosMedicos() {
      return sobrescrituras.seguimientosListado ?? [];
    },
  };

  return { dependencias, llamadas };
}

test("iniciarActualizacionRegistro pasa el registro a REVISANDO y guarda el estado previo", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria({
      registro: {
        id: 14,
        animalId: 39,
        estadoValidacion: "REALIZADO",
        estadoPrevioRevision: null,
      },
    });

  const resultado = await iniciarActualizacionRegistro(
    { registroMedicoId: 14, actor: actoraVeterinaria },
    dependencias,
  );

  assert.equal(resultado.registroMedico.estadoValidacion, "REVISANDO");
  assert.equal(resultado.registroMedico.estadoPrevioRevision, "REALIZADO");
  assert.deepEqual(llamadas.claims[0].data, {
    estadoValidacion: "REVISANDO",
    estadoPrevioRevision: "REALIZADO",
  });
});

test("iniciarActualizacionRegistro rechaza un estado no actualizable", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria({
      registro: {
        id: 14,
        animalId: 39,
        estadoValidacion: "PROVISIONAL",
      },
    });

  const error = await capturarError(
    iniciarActualizacionRegistro(
      { registroMedicoId: 14, actor: actoraVeterinaria },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ESTADO_INVALIDO");
  assert.equal(error.estadoHttp, 409);
  assert.equal(llamadas.claims.length, 0);
});

test("cancelarActualizacionRegistro restaura el estado previo", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria();

  const resultado = await cancelarActualizacionRegistro(
    { registroMedicoId: 14, actor: actoraVeterinaria },
    dependencias,
  );

  assert.equal(resultado.registroMedico.estadoValidacion, "REALIZADO");
  assert.deepEqual(llamadas.claims[0].data, {
    estadoValidacion: "REALIZADO",
    estadoPrevioRevision: null,
  });
});

test("cancelarActualizacionRegistro usa ACTUALIZADO si ya existe historial", async () => {
  const { dependencias } = crearDependenciasActualizacionVeterinaria({
    registro: {
      id: 14,
      animalId: 39,
      estadoValidacion: "REVISANDO",
      estadoPrevioRevision: null,
    },
    ultimaVersion: 2,
  });

  const resultado = await cancelarActualizacionRegistro(
    { registroMedicoId: 14, actor: actoraVeterinaria },
    dependencias,
  );

  assert.equal(resultado.registroMedico.estadoValidacion, "ACTUALIZADO");
});

test("actualizarRegistro crea seguimiento, historial y sincroniza RevisionCompleta", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria();

  const resultado = await actualizarRegistro(
    {
      registroMedicoId: 14,
      datos: datosActualizacionVeterinaria,
      actor: actoraVeterinaria,
    },
    dependencias,
  );

  assert.equal(resultado.version, 1);
  assert.equal(resultado.historial.version, 1);
  assert.equal(resultado.historial.estadoOrigen, "REALIZADO");
  assert.equal(resultado.historial.peso, 13.1);
  assert.equal(
    resultado.historial.observacionSeguimiento,
    "Evoluciona favorablemente",
  );
  assert.equal(resultado.seguimiento.peso, 13.1);
  assert.equal(resultado.seguimiento.estadoSalud, "NORMAL");
  assert.equal(resultado.seguimiento.evolucionEstadoSalud, "MEJORANDO");
  assert.equal(resultado.seguimiento.necesidades, "Dieta blanda por dos días");

  assert.deepEqual(llamadas.actualizacionesRegistro[0].data, {
    pesoKg: 13.1,
    clasificacionSalud: "NORMAL",
    observacionInicial: "Control veterinario sin complicaciones",
    requiereCuarentena: false,
    estadoValidacion: "ACTUALIZADO",
  });
  assert.equal(llamadas.claims[0].data.estadoValidacion, "ACTUALIZADO");
  assert.equal(llamadas.revisionesCompletas[0].peso, 13.1);
  assert.equal(llamadas.revisionesCompletas[0].estadoSalud, "NORMAL");
  assert.equal(
    llamadas.revisionesCompletas[0].descripcionCondicionMedica,
    "Sin condiciones adicionales",
  );
});

test("actualizarRegistro incrementa la version del historial", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria({ ultimaVersion: 2 });

  const resultado = await actualizarRegistro(
    {
      registroMedicoId: 14,
      datos: datosActualizacionVeterinaria,
      actor: actoraVeterinaria,
    },
    dependencias,
  );

  assert.equal(resultado.version, 3);
  assert.equal(llamadas.historiales[0].version, 3);
});

test("actualizarRegistro agrega enfermedades, tratamientos y seguimientos existentes", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria();

  await actualizarRegistro(
    {
      registroMedicoId: 14,
      datos: {
        ...datosActualizacionVeterinaria,
        enfermedades: [
          {
            descripcionEnfermedad: "Dermatitis",
            estadoEnfermedad: "EN_CURSO",
            observacionSeguimiento: "Requiere control",
          },
        ],
        tratamientos: [
          {
            descripcionTratamiento: "Antibiótico",
            fechaInicio: "2026-11-03",
            estadoTratamiento: "EN_CURSO",
            observacionSeguimiento: "Primera dosis",
          },
        ],
        seguimientoEnfermedades: [
          {
            enfermedadId: 71,
            estadoEnfermedad: "RESUELTO",
            observacionSeguimiento: "Sin síntomas",
          },
        ],
        seguimientoTratamientos: [
          {
            tratamientoId: 81,
            estadoTratamiento: "RESUELTO",
            observacionSeguimiento: "Tratamiento completado",
          },
        ],
      },
      actor: actoraVeterinaria,
    },
    dependencias,
  );

  const seguimiento = llamadas.seguimientos[0];
  assert.equal(llamadas.enfermedades.length, 1);
  assert.equal(llamadas.tratamientos.length, 1);
  assert.equal(seguimiento.seguimientosEnfermedad.create.length, 2);
  assert.deepEqual(
    seguimiento.seguimientosEnfermedad.create.map(
      (item) => item.enfermedadId,
    ),
    [71, 101],
  );
  assert.deepEqual(
    seguimiento.seguimientosTratamiento.create.map(
      (item) => item.tratamientoId,
    ),
    [81, 201],
  );
});

test("actualizarRegistro rechaza seguimientos de otro registro sin escribir", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria();

  const error = await capturarError(
    actualizarRegistro(
      {
        registroMedicoId: 14,
        datos: {
          ...datosActualizacionVeterinaria,
          seguimientoEnfermedades: [
            {
              enfermedadId: 999,
              estadoEnfermedad: "RESUELTO",
            },
          ],
        },
        actor: actoraVeterinaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "SEGUIMIENTO_INVALIDO");
  assert.equal(error.estadoHttp, 400);
  assert.equal(llamadas.claims.length, 0);
  assert.equal(llamadas.seguimientos.length, 0);
  assert.equal(llamadas.historiales.length, 0);
});

test("actualizarRegistro responde 409 si otra transaccion ya tomo el registro", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria({ sinCupo: true });

  const error = await capturarError(
    actualizarRegistro(
      {
        registroMedicoId: 14,
        datos: datosActualizacionVeterinaria,
        actor: actoraVeterinaria,
      },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ESTADO_INVALIDO");
  assert.equal(error.estadoHttp, 409);
  assert.equal(llamadas.seguimientos.length, 0);
  assert.equal(llamadas.historiales.length, 0);
  assert.equal(llamadas.revisionesCompletas.length, 0);
});

test("listarHistorialRegistroMedico y listarSeguimientos convierten Decimal a numero", async () => {
  const { dependencias } = crearDependenciasActualizacionVeterinaria({
    historialListado: [
      { id: 1, version: 2, peso: new Prisma.Decimal("13.10") },
    ],
    seguimientosListado: [
      { id: 2, peso: new Prisma.Decimal("12.50") },
    ],
  });

  const historial = await listarHistorialRegistroMedico(
    { registroMedicoId: 14, actor: actoraVeterinaria },
    dependencias,
  );
  const seguimientos = await listarSeguimientosRegistroMedico(
    { registroMedicoId: 14, actor: actoraVeterinaria },
    dependencias,
  );

  assert.equal(historial[0].peso, 13.1);
  assert.equal(seguimientos[0].peso, 12.5);
});

test("un rol sin permiso no inicia actualizaciones veterinarias", async () => {
  const { dependencias, llamadas } =
    crearDependenciasActualizacionVeterinaria();

  const error = await capturarError(
    iniciarActualizacionRegistro(
      { registroMedicoId: 14, actor: actoraVoluntaria },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "ROL_INSUFICIENTE");
  assert.equal(error.estadoHttp, 403);
  assert.equal(llamadas.transacciones, 0);
});
