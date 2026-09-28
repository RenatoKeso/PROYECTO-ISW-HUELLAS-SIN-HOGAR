import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { CODIGO_ERROR_ANIMAL } from "../../src/entities/animalErrors.js";
import {
  actualizarFicha,
  crearFicha,
  registrarIngreso,
} from "../../src/services/animalService.js";

const fichaValida = {
  nombre: "Firulais",
  sexoAnimal: "MACHO",
  especie: "PERRO",
  raza: "Mestizo",
  edad: 4,
};

const ingresoValido = {
  receptorId: 2,
  fechaIngreso: new Date("2026-09-27T10:00:00-03:00"),
  procedencia: "Hallazgo en vía pública",
  ubicacionEncontrado: "Av. Central con Pedro Nº 100",
  estadoSalud: "En observación",
};

function crearDependencias(sobrescrituras = {}) {
  const llamadas = {
    fichaAnimal: [],
    ingresoAnimal: [],
    consultas: [],
    actualizaciones: [],
    transacciones: 0,
  };

  const dependencias = {
    llamadas,
    ejecutarEnTransaccion: async (operacion) => {
      llamadas.transacciones += 1;
      return operacion("tx");
    },
    crearFichaAnimal: async (data) => {
      llamadas.fichaAnimal.push(data);
      return { id: 10, codigoAnimal: "anim-010", ...data };
    },
    obtenerFichaAnimalPorCodigo: async (codigoAnimal) => {
      llamadas.consultas.push(codigoAnimal);
      return codigoAnimal === "anim-001" ? { id: 1, codigoAnimal } : null;
    },
    actualizarFichaAnimal: async (id, data) => {
      llamadas.actualizaciones.push({ id, data });
      return { id, codigoAnimal: "anim-001", ...data };
    },
    crearIngresoAnimal: async (data) => {
      llamadas.ingresoAnimal.push(data);
      return { id: 99, ...data };
    },
    ...sobrescrituras,
  };

  return dependencias;
}

async function capturarError(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }

  return null;
}

test("registrarIngreso crea la ficha y su primer historial en una transaccion", async () => {
  const dependencias = crearDependencias();

  const resultado = await registrarIngreso(
    { ficha: fichaValida, ingreso: ingresoValido },
    dependencias,
  );

  assert.equal(resultado.reingreso, false);
  assert.equal(resultado.ficha.codigoAnimal, "anim-010");
  assert.equal(dependencias.llamadas.transacciones, 1);
  assert.equal(dependencias.llamadas.fichaAnimal.length, 1);
  assert.deepEqual(dependencias.llamadas.ingresoAnimal, [
    {
      fichaAnimalId: 10,
      receptorId: 2,
      fechaIngreso: ingresoValido.fechaIngreso,
      procedencia: "Hallazgo en vía pública",
      ubicacionEncontrado: "Av. Central con Pedro Nº 100",
      estadoSalud: "En observación",
    },
  ]);
});

test("registrarIngreso rechaza una procedencia invalida sin tocar la base", async () => {
  const dependencias = crearDependencias();

  const error = await capturarError(
    registrarIngreso(
      { ficha: fichaValida, ingreso: { ...ingresoValido, procedencia: "   " } },
      dependencias,
    ),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.PROCEDENCIA_INVALIDA);
  assert.equal(error.estadoHttp, 400);
  assert.equal(dependencias.llamadas.transacciones, 0);
});

test("registrarIngreso reingresa por devolucion sin crear una ficha nueva", async () => {
  const dependencias = crearDependencias();

  const resultado = await registrarIngreso(
    {
      ingreso: { ...ingresoValido, codigoAnimal: "anim-001" },
    },
    dependencias,
  );

  assert.equal(resultado.reingreso, true);
  assert.equal(resultado.ficha.id, 1);
  assert.equal(resultado.ficha.codigoAnimal, "anim-001");
  assert.deepEqual(dependencias.llamadas.consultas, ["anim-001"]);
  assert.equal(dependencias.llamadas.fichaAnimal.length, 0);
  assert.equal(dependencias.llamadas.ingresoAnimal[0].fichaAnimalId, 1);
});

test("registrarIngreso exige la referencia de ficha en un reingreso", async () => {
  const dependencias = crearDependencias();

  const error = await capturarError(
    registrarIngreso(
      { ingreso: { ...ingresoValido, codigoAnimal: "  " } },
      dependencias,
    ),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.REFERENCIA_FICHA_AUSENTE);
  assert.equal(error.estadoHttp, 400);
  assert.equal(dependencias.llamadas.transacciones, 0);
});

test("registrarIngreso falla con error de dominio si la ficha no existe", async () => {
  const dependencias = crearDependencias();

  const error = await capturarError(
    registrarIngreso(
      { ingreso: { ...ingresoValido, codigoAnimal: "anim-404" } },
      dependencias,
    ),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.FICHA_INEXISTENTE);
  assert.equal(error.estadoHttp, 404);
  assert.equal(error.opcion.codigoAnimal, "anim-404");
});

test("registrarIngreso traduce el conflicto de identificador de Prisma", async () => {
  const errorConflicto = new Prisma.PrismaClientKnownRequestError("duplicado", {
    code: "P2002",
    clientVersion: "6.19.3",
  });

  const dependencias = crearDependencias({
    crearFichaAnimal: async () => {
      throw errorConflicto;
    },
  });

  const error = await capturarError(
    registrarIngreso({ ficha: fichaValida, ingreso: ingresoValido }, dependencias),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.CONFLICTO_IDENTIFICADOR);
  assert.equal(error.estadoHttp, 409);
});

test("registrarIngreso no expone el error crudo de Prisma", async () => {
  const dependencias = crearDependencias({
    crearIngresoAnimal: async () => {
      throw new Error("connection to server at localhost:5432 failed");
    },
  });

  const error = await capturarError(
    registrarIngreso({ ficha: fichaValida, ingreso: ingresoValido }, dependencias),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.FALLO_GUARDADO_FICHA);
  assert.equal(error.estadoHttp, 500);
  assert.equal(error.message.includes("localhost:5432"), false);
  assert.equal(error.opcion.cause instanceof Error, true);
});

test("crearFicha guarda la ficha en estado ACTIVO y devuelve su codigo", async () => {
  const dependencias = crearDependencias();

  const ficha = await crearFicha(fichaValida, dependencias);

  assert.equal(dependencias.llamadas.transacciones, 0);
  assert.equal(dependencias.llamadas.fichaAnimal[0].estadoEstadia, "ACTIVO");
  assert.equal(ficha.codigoAnimal, "anim-010");
});

test("crearFicha traduce el conflicto de identificador de Prisma", async () => {
  const dependencias = crearDependencias({
    crearFichaAnimal: async () => {
      throw new Prisma.PrismaClientKnownRequestError("duplicado", {
        code: "P2002",
        clientVersion: "6.19.3",
      });
    },
  });

  const error = await capturarError(crearFicha(fichaValida, dependencias));

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.CONFLICTO_IDENTIFICADOR);
  assert.equal(error.estadoHttp, 409);
});

test("crearFicha no expone el error crudo de Prisma", async () => {
  const dependencias = crearDependencias({
    crearFichaAnimal: async () => {
      throw new Error("connection to server at localhost:5432 failed");
    },
  });

  const error = await capturarError(crearFicha(fichaValida, dependencias));

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.FALLO_GUARDADO_FICHA);
  assert.equal(error.estadoHttp, 500);
});

test("actualizarFicha delega los cambios en el repositorio", async () => {
  const dependencias = crearDependencias();

  const ficha = await actualizarFicha(7, { estadoEstadia: "ADOPTADO" }, dependencias);

  assert.equal(dependencias.llamadas.actualizaciones.length, 1);
  assert.deepEqual(dependencias.llamadas.actualizaciones[0], {
    id: 7,
    data: { estadoEstadia: "ADOPTADO" },
  });
  assert.equal(ficha.estadoEstadia, "ADOPTADO");
  assert.equal(dependencias.llamadas.transacciones, 0);
});

test("actualizarFicha responde 404 si la ficha no existe", async () => {
  const dependencias = crearDependencias({
    actualizarFichaAnimal: async () => {
      throw new Prisma.PrismaClientKnownRequestError("registro no encontrado", {
        code: "P2025",
        clientVersion: "6.19.3",
      });
    },
  });

  const error = await capturarError(
    actualizarFicha(999, { nombre: "Roco" }, dependencias),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.FICHA_INEXISTENTE);
  assert.equal(error.estadoHttp, 404);
  assert.equal(error.message.includes("999"), true);
});

test("actualizarFicha no expone errores internos", async () => {
  const dependencias = crearDependencias({
    actualizarFichaAnimal: async () => {
      throw new Error("connection refused");
    },
  });

  const error = await capturarError(
    actualizarFicha(7, { nombre: "Roco" }, dependencias),
  );

  assert.equal(error.codigo, CODIGO_ERROR_ANIMAL.FALLO_GUARDADO_FICHA);
  assert.equal(error.message.includes("connection refused"), false);
});
