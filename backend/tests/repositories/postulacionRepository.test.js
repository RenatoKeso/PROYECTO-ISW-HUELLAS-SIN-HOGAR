import assert from "node:assert/strict";
import test from "node:test";
import { cerrarOtrasPostulacionesAbiertas } from "../../src/repositories/postulacionRepository.js";

// Cliente falso: guarda en orden las consultas que recibe.
function clienteDePrueba(encontradas = []) {
  const consultas = [];

  return {
    consultas,
    cliente: {
      postulacion: {
        findMany: async (argumentos) => {
          consultas.push(["findMany", argumentos]);
          return encontradas;
        },
        updateMany: async (argumentos) => {
          consultas.push(["updateMany", argumentos]);
          return { count: encontradas.length };
        },
      },
    },
  };
}

const ENCONTRADAS = [
  {
    id: 11,
    nombrePostulante: "Ana Rojas",
    emailPostulante: "ana@correo.cl",
    fichaAnimal: { nombre: "Galileo", sexoAnimal: "MACHO" },
  },
];

test("cerrarOtrasPostulacionesAbiertas busca a quienes cierra y despues las cierra", async () => {
  const { cliente, consultas } = clienteDePrueba(ENCONTRADAS);
  const fecha = new Date("2026-11-25T12:00:00.000Z");

  const cerradas = await cerrarOtrasPostulacionesAbiertas(
    { fichaAnimalId: 3, postulacionEntregadaId: 10, fecha },
    cliente,
  );

  assert.deepEqual(cerradas, ENCONTRADAS);
  assert.deepEqual(
    consultas.map(([tipo]) => tipo),
    ["findMany", "updateMany"],
  );

  const [, busqueda] = consultas[0];
  const [, cierre] = consultas[1];

  // Las dos consultas usan el mismo filtro: se avisa justo a las que se cierran.
  assert.deepEqual(busqueda.where, {
    fichaAnimalId: 3,
    id: { not: 10 },
    estado: { in: ["EN_REVISION", "APROBADA"] },
  });
  assert.deepEqual(cierre.where, busqueda.where);
  assert.deepEqual(cierre.data, { estado: "CERRADA", fechaResolucion: fecha });

  // Solo se piden los datos que necesita el correo.
  assert.deepEqual(busqueda.select, {
    id: true,
    nombrePostulante: true,
    emailPostulante: true,
    fichaAnimal: { select: { nombre: true, sexoAnimal: true } },
  });
});

test("cerrarOtrasPostulacionesAbiertas devuelve una lista vacia si no habia otras", async () => {
  const { cliente } = clienteDePrueba([]);

  const cerradas = await cerrarOtrasPostulacionesAbiertas(
    { fichaAnimalId: 3, postulacionEntregadaId: 10, fecha: new Date() },
    cliente,
  );

  assert.deepEqual(cerradas, []);
});
