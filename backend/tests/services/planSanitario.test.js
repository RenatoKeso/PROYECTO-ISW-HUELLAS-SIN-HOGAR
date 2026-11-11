import assert from "node:assert/strict";
import test from "node:test";
import { crearServicioPlanSanitario } from "../../src/services/planSanitarioService.js";

function preparar(estadoEstadia = "ACTIVO") {
  const animal = {
    id: 1,
    codigoAnimal: "anim-001",
    nombre: null,
    estadoEstadia,
    registroMedicoAnimal: { id: 9 },
  };

  const filas = [];
  let escrituras = 0;

  const repos = {
    async buscarAnimalPlan(codigo) {
      return codigo === animal.codigoAnimal
        ? animal
        : null;
    },

    async listarAtencionesPlan() {
      return filas;
    },

    async crearAtencionPlan(data) {
      escrituras++;

      const fila = {
        id: filas.length + 1,
        fechaRealizacion: null,
        motivoCancelacion: null,
        observaciones: null,
        ...data,
      };

      filas.push(fila);
      return fila;
    },

    async buscarAtencionPlan(id) {
      return (
        filas.find((fila) => fila.id === id) ?? null
      );
    },

    async modificarAtencionPendiente(id, data) {
      const fila = filas.find(
        (fila) =>
          fila.id === id &&
          fila.estado === "PENDIENTE"
      );

      if (!fila) return { count: 0 };

      escrituras++;
      Object.assign(fila, data);

      return { count: 1 };
    },
  };

  const servicio = crearServicioPlanSanitario({
    repos,
    transaccion: (operacion) => operacion({}),
  });

  return {
    animal,
    filas,
    repos,
    servicio,
    contar: () => escrituras,
  };
}

const datos = {
  tipo: "vacuna",
  fechaProgramada: "2026-11-02",
};

test("el plan registra los cinco tipos y enlaza el registro medico existente", async () => {
  const { servicio } = preparar();

  for (const tipo of [
    "vacuna",
    "tratamiento",
    "control",
    "desparasitacion",
    "esterilizacion",
  ]) {
    const atencion = await servicio.programar(
      "anim-001",
      { ...datos, tipo }
    );

    assert.equal(atencion.estado, "PENDIENTE");
    assert.equal(atencion.registroMedicoId, 9);
    assert.equal(
      atencion.fechaProgramada,
      datos.fechaProgramada
    );
  }

  assert.equal(
    (await servicio.consultar("anim-001"))
      .atenciones.length,
    5
  );
});

test("consultar conserva los registros y admite fichas sin registro medico", async () => {
  const contexto = preparar();

  contexto.animal.registroMedicoAnimal = null;
  await contexto.servicio.programar("anim-001", datos);

  const antes = structuredClone(contexto.filas);
  const escrituras = contexto.contar();
  const plan =
    await contexto.servicio.consultar("anim-001");

  assert.equal(plan.animal.registroMedicoId, null);
  assert.equal(
    plan.atenciones[0].registroMedicoId,
    null
  );
  assert.equal(plan.animal.nombre, null);
  assert.deepEqual(contexto.filas, antes);
  assert.equal(contexto.contar(), escrituras);
});

test("programar excluye los animales fuera del refugio y admite espera de adopcion", async () => {
  for (const estado of [
    "ADOPTADO",
    "EGRESADO",
    "FALLECIDO",
    "TRANSFERIDO",
  ]) {
    const { servicio, contar } = preparar(estado);

    await assert.rejects(
      servicio.programar("anim-001", datos),
      { estadoHttp: 409 }
    );

    assert.equal(contar(), 0);
  }

  const { servicio } = preparar("ESPERA_ADOPCION");

  assert.equal(
    (await servicio.programar("anim-001", datos)).estado,
    "PENDIENTE"
  );
});

test("reprogramar y realizar conservan el historial e impiden editar una atencion finalizada", async () => {
  const { servicio } = preparar();

  const atencion =
    await servicio.programar("anim-001", datos);

  const nueva = await servicio.modificar(
    atencion.id,
    {
      accion: "reprogramar",
      fechaProgramada: "2026-11-09",
    }
  );

  assert.equal(
    nueva.fechaProgramada,
    "2026-11-09"
  );

  const realizada = await servicio.modificar(
    atencion.id,
    {
      accion: "realizar",
      fechaRealizacion: "2026-11-03",
    }
  );

  assert.equal(realizada.estado, "REALIZADA");
  assert.equal(
    realizada.fechaRealizacion,
    "2026-11-03"
  );

  await assert.rejects(
    servicio.modificar(atencion.id, {
      accion: "cancelar",
      motivoCancelacion: "Error",
    }),
    { estadoHttp: 409 }
  );

  assert.equal(
    (await servicio.consultar("anim-001"))
      .atenciones.length,
    1
  );
});

test("cancelar exige un motivo y conserva la atencion", async () => {
  const { servicio, contar } = preparar();

  const atencion =
    await servicio.programar("anim-001", datos);

  await assert.rejects(
    servicio.modificar(atencion.id, {
      accion: "cancelar",
      motivoCancelacion: " ",
    }),
    { name: "ZodError" }
  );

  assert.equal(contar(), 1);

  const cancelada = await servicio.modificar(
    atencion.id,
    {
      accion: "cancelar",
      motivoCancelacion:
        "  Cambio de indicacion  ",
    }
  );

  assert.equal(cancelada.estado, "CANCELADA");
  assert.equal(
    cancelada.motivoCancelacion,
    "Cambio de indicacion"
  );

  assert.equal(
    (await servicio.consultar("anim-001"))
      .atenciones.length,
    1
  );
});

test("los filtros invalidos no escriben y los registros inexistentes responden 404", async () => {
  const { servicio, contar } = preparar();

  for (const entrada of [
    {
      ...datos,
      fechaProgramada: "2026-02-30",
    },
    {
      ...datos,
      tipo: "cirugia",
    },
    {
      ...datos,
      estado: "REALIZADA",
    },
    {
      ...datos,
      fichaAnimalId: 999,
    },
  ]) {
    await assert.rejects(
      servicio.programar("anim-001", entrada),
      { name: "ZodError" }
    );
  }

  await assert.rejects(
    servicio.programar("anim-999", datos),
    { estadoHttp: 404 }
  );

  await assert.rejects(
    servicio.modificar(999, {
      accion: "reprogramar",
      fechaProgramada: "2026-11-09",
    }),
    { estadoHttp: 404 }
  );

  assert.equal(contar(), 0);
});

test("un cambio concurrente no permite sobrescribir una atencion finalizada", async () => {
  const { servicio, repos } = preparar();

  const atencion =
    await servicio.programar("anim-001", datos);

  repos.modificarAtencionPendiente = async () => ({
    count: 0,
  });

  await assert.rejects(
    servicio.modificar(atencion.id, {
      accion: "realizar",
      fechaRealizacion: "2026-11-02",
    }),
    { estadoHttp: 409 }
  );
});