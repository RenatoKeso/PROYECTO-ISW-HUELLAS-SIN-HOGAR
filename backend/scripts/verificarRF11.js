import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import prisma from "../src/config/prisma.js";
import { obtenerAlertasPlan } from "../src/services/alertasPlan.service.js";
import { obtenerFechaActual } from "../src/services/alertasSanitarias.service.js";
import { buscarAtencionesPendientes } from "../src/repositories/atencionSanitariaRepository.js";
import { crearFichaAnimal } from "../src/repositories/fichaAnimalRepository.js";
import { respuestaAlertasPlanSchema } from "../../frontend/src/validations/alertasPlanValidation.js";

const guardar = process.argv.includes("--guardar-demo");
const MARCA = "DEMO RF11: datos de prueba";
const LOTE = `${MARCA} (${randomUUID()})`;
const fechaReferencia = obtenerFechaActual();
const DIA = 86400000;

const fecha = (dias) =>
  new Date(
    new Date(`${fechaReferencia}T00:00:00.000Z`).getTime() +
      dias * DIA
  );

const ROLLBACK = new Error("RF11_ROLLBACK_DE_PRUEBA");

let resumen;

async function verificar(tx) {
  if (
    guardar &&
    (await tx.fichaAnimal.findFirst({
      where: {
        observaciones: { startsWith: MARCA },
      },
    }))
  ) {
    throw new Error(
      "Ya existen datos de demostracion RF11. " +
        "Utiliza los que guardaste antes."
    );
  }

  const actor = await tx.usuario.findFirst({
    where: {
      activo: true,
      rol: {
        in: ["DIRECTORA", "VETERINARIA"],
      },
    },
    select: { id: true },
  });

  assert.ok(
    actor,
    "Debe existir una cuenta activa de directora o veterinaria."
  );

  const casos = [
    { tipo: "vacuna", dias: -3 },
    {
      tipo: "tratamiento",
      dias: 0,
      estadoEstadia: "ESPERA_ADOPCION",
      sinNombre: true,
    },
    {
      tipo: "control",
      dias: 2,
      cuarentena: true,
    },
    {
      tipo: "desparasitacion",
      dias: 5,
      externa: true,
    },
    { tipo: "esterilizacion", dias: 7 },
    { tipo: "vacuna", dias: 8 },
    {
      tipo: "control",
      dias: -1,
      estado: "REALIZADA",
    },
    {
      tipo: "control",
      dias: 1,
      estado: "CANCELADA",
    },
    {
      tipo: "vacuna",
      dias: -1,
      estadoEstadia: "ADOPTADO",
    },
    {
      tipo: "vacuna",
      dias: -1,
      estadoEstadia: "EGRESADO",
    },
    {
      tipo: "vacuna",
      dias: -1,
      estadoEstadia: "FALLECIDO",
    },
    {
      tipo: "vacuna",
      dias: -1,
      estadoEstadia: "TRANSFERIDO",
    },
    {
      tipo: "control",
      dias: -1,
      estadoEstadia: "EGRESADO",
    },
  ];

  const registros = [];

  for (const [indice, caso] of casos.entries()) {
    const animal = await crearFichaAnimal(
      {
        nombre: caso.sinNombre
          ? null
          : `DEMO RF11 ${indice + 1}`,
        especie: "PERRO",
        sexoAnimal: "DESCONOCIDO",
        estadoEstadia: caso.estadoEstadia ?? "ACTIVO",
        observaciones: LOTE,
      },
      tx
    );

    let registroMedicoId;

    if (caso.cuarentena || caso.externa) {
      const registro = await tx.registroMedicoAnimal.create({
        data: {
          animalId: animal.id,

          ...(caso.cuarentena
            ? {
                revisionInicial: {
                  create: {
                    cuarentena: true,
                    createdById: actor.id,
                  },
                },
              }
            : {}),

          ...(caso.externa
            ? {
                atencionesVeterinarias: {
                  create: {
                    nombreClinicaExterna:
                      "Clinica de prueba RF11",
                    fechaAtencion: fecha(0),
                    createdById: actor.id,
                  },
                },
              }
            : {}),
        },
      });

      registroMedicoId = registro.id;
    }

    const atencion = await tx.atencionSanitaria.create({
      data: {
        fichaAnimalId: animal.id,
        registroMedicoId,
        tipo: caso.tipo,
        fechaProgramada: fecha(caso.dias),
        estado: caso.estado ?? "PENDIENTE",

        fechaRealizacion:
          caso.estado === "REALIZADA" ? fecha(0) : null,

        motivoCancelacion:
          caso.estado === "CANCELADA" ? MARCA : null,
      },
    });

    registros.push({ animal, atencion });
  }

  const ids = registros.map(({ animal }) => animal.id);
  const idsSet = new Set(ids);

  async function snapshot() {
    return {
      animales: await tx.fichaAnimal.findMany({
        where: { id: { in: ids } },
        orderBy: { id: "asc" },
      }),

      atenciones: await tx.atencionSanitaria.findMany({
        where: { fichaAnimalId: { in: ids } },
        orderBy: { id: "asc" },
      }),
    };
  }

  async function consultar(
    dias = "7",
    referencia = fechaReferencia
  ) {
    const antes = await snapshot();

    const resultado = await obtenerAlertasPlan(
      {
        diasAnticipacion: dias,
        ...(referencia === null
          ? {}
          : { fechaReferencia: referencia }),
      },
      {
        buscar: (filtros) =>
          buscarAtencionesPendientes(filtros, tx),

        ahora: new Date(
          `${fechaReferencia}T12:00:00.000Z`
        ),
      }
    );

    respuestaAlertasPlanSchema.parse(resultado);

    assert.deepEqual(
      await snapshot(),
      antes,
      "La consulta modifico registros."
    );

    return resultado;
  }

  const soloPruebas = (resultado) =>
    resultado.alertas.filter((alerta) =>
      idsSet.has(alerta.animalId)
    );

  const inicial = soloPruebas(await consultar());

  assert.deepEqual(
    inicial.map((a) => a.animalId),
    ids.slice(0, 5)
  );

  assert.deepEqual(
    inicial.map((a) => a.diasRestantes),
    [-3, 0, 2, 5, 7]
  );

  assert.deepEqual(
    inicial.map((a) => a.estado),
    [
      "vencido",
      "proximo",
      "proximo",
      "proximo",
      "proximo",
    ]
  );

  assert.deepEqual(
    inicial.map((a) => a.tipo),
    casos.slice(0, 5).map((a) => a.tipo)
  );

  assert.equal(inicial[1].nombreAnimal, null);

  assert.deepEqual(
    soloPruebas(await consultar("0")).map(
      (a) => a.diasRestantes
    ),
    [-3, 0]
  );

  assert.equal(
    (await consultar("7", null)).fechaReferencia,
    fechaReferencia
  );

  // La siguiente consulta debe reflejar un cambio de fecha.
  const ultima = registros[4].atencion;

  await tx.atencionSanitaria.update({
    where: { id: ultima.id },
    data: { fechaProgramada: fecha(1) },
  });

  assert.equal(
    soloPruebas(await consultar()).find(
      (a) => a.atencionId === ultima.id
    ).diasRestantes,
    1
  );

  await tx.atencionSanitaria.update({
    where: { id: ultima.id },
    data: { fechaProgramada: fecha(7) },
  });

  // Una atencion realizada debe desaparecer de la consulta.
  const primera = registros[0].atencion;

  await tx.atencionSanitaria.update({
    where: { id: primera.id },
    data: {
      estado: "REALIZADA",
      fechaRealizacion: fecha(0),
    },
  });

  assert.equal(
    soloPruebas(await consultar()).some(
      (a) => a.atencionId === primera.id
    ),
    false
  );

  await tx.atencionSanitaria.update({
    where: { id: primera.id },
    data: {
      estado: "PENDIENTE",
      fechaRealizacion: null,
    },
  });

  // Al recuperar ACTIVO, sus pendientes vuelven a incluirse.
  const reingreso = registros[12].animal;

  await tx.fichaAnimal.update({
    where: { id: reingreso.id },
    data: { estadoEstadia: "ACTIVO" },
  });

  assert.ok(
    soloPruebas(await consultar()).some(
      (a) => a.animalId === reingreso.id
    )
  );

  await tx.fichaAnimal.update({
    where: { id: reingreso.id },
    data: { estadoEstadia: "EGRESADO" },
  });

  // Los filtros invalidos deben rechazarse antes de consultar.
  for (const entrada of [
    {},
    { diasAnticipacion: "-1" },
    { diasAnticipacion: "1.5" },
    {
      diasAnticipacion: "7",
      fechaReferencia: "2026-02-30",
    },
  ]) {
    await assert.rejects(
      obtenerAlertasPlan(entrada, {
        buscar: async () =>
          assert.fail("Consulto con filtros invalidos."),
      }),
      { name: "ZodError" }
    );
  }

  // Busca una fecha que produzca una lista vacia,
  // incluso si ya existen otros animales en la base.
  const minimo = await tx.atencionSanitaria.aggregate({
    where: { estado: "PENDIENTE" },
    _min: { fechaProgramada: true },
  });

  const fechaVacia = new Date(
    minimo._min.fechaProgramada.getTime() - DIA
  )
    .toISOString()
    .slice(0, 10);

  assert.deepEqual(
    (await consultar("0", fechaVacia)).alertas,
    []
  );

  resumen = {
    fechaReferencia,
    fechaVacia,
    alertas: inicial,
  };

  if (!guardar) throw ROLLBACK;
}

try {
  assert.ok(
    process.argv
      .slice(2)
      .every((arg) => arg === "--guardar-demo"),
    "Uso: node scripts/verificarRF11.js [--guardar-demo]"
  );

  try {
    await prisma.$transaction(verificar, {
      timeout: 60000,
      maxWait: 10000,
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  }

  if (!guardar) {
    assert.equal(
      await prisma.fichaAnimal.count({
        where: { observaciones: LOTE },
      }),
      0
    );
  }

  console.log(
    "RF11: todas las comprobaciones finalizaron correctamente."
  );

  console.log(
    "Fecha de referencia:",
    resumen.fechaReferencia
  );

  console.table(
    resumen.alertas.map((a) => ({
      codigo: a.codigoAnimal,
      tipo: a.tipo,
      estado: a.estado,
      dias: a.diasRestantes,
    }))
  );

  console.log(
    "Para comprobar la lista vacia: fecha",
    resumen.fechaVacia,
    "y anticipacion 0."
  );

  console.log(
    guardar
      ? "Se guardaron los datos DEMO RF11 para probar la pantalla con anticipacion 7."
      : "Los datos de prueba se revirtieron; no quedaron animales ni atenciones de prueba."
  );
} catch (error) {
  console.error(
    "No se pudo completar la verificacion RF11."
  );

  console.error(
    error.code ?? error.errorCode ?? error.name
  );

  if (!error.name?.startsWith("Prisma")) {
    console.error(error.message);
  }

  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}