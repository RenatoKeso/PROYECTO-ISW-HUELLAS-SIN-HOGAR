import test from "node:test";
import assert from "node:assert/strict";

import {
  construirParamsHistorial,
  describirFiltrosActivos,
  estaEnSemanaActual,
  aplicarFiltrosHistorial,
  leerFiltrosHistorial,
  ordenarRegistros,
  normalizarTexto,
  inicioSemana,
  FILTROS_HISTORIAL_VACIOS,
} from "../src/utils/filtrosHistorialMedico.js";

function registro(overrides = {}) {
  return {
    id: 1,
    estadoValidacion: "PROVISIONAL",
    createdAt: "2026-11-14T10:00:00.000Z",
    requiereCuarentena: false,
    revisionCompleta: null,
    animal: {
      id: 1,
      codigoAnimal: "anim-001",
      nombre: "Gretel",
      especie: "FELINO",
      estadoAdopcion: "ADOPTABLE",
      estadoEstadia: "ACTIVO",
    },
    ...overrides,
  };
}

test("leerFiltrosHistorial valida valores permitidos", () => {
  const params = new URLSearchParams({
    estado: "REALIZADO",
    salud: "FRAGIL",
    cuarentena: "true",
    semana: "actual",
    adopcion: "ADOPTABLE",
    especie: "GATO",
    busqueda: " gretel ",
    orden: "codigo",
  });

  assert.deepEqual(leerFiltrosHistorial(params), {
    estado: "REALIZADO",
    salud: "FRAGIL",
    cuarentena: true,
    semana: true,
    adopcion: "ADOPTABLE",
    especie: "GATO",
    busqueda: "gretel",
    orden: "codigo",
  });
});

test("leerFiltrosHistorial ignora valores inválidos", () => {
  const params = new URLSearchParams({
    estado: "NO_EXISTE",
    salud: "QUARENTENA",
    cuarentena: "yes",
    semana: "otra",
    adopcion: "TIPO",
    especie: "DRAGON",
    orden: "random",
  });

  assert.deepEqual(leerFiltrosHistorial(params), {
    estado: "",
    salud: "",
    cuarentena: false,
    semana: false,
    adopcion: "",
    especie: "",
    busqueda: "",
    orden: "recientes",
  });
});

test("construirParamsHistorial solo pone valores no vacíos", () => {
  const params = construirParamsHistorial({
    estado: "",
    salud: "NORMAL",
    cuarentena: false,
    semana: true,
    adopcion: "",
    busqueda: "",
    orden: "recientes",
  });

  assert.deepEqual(Array.from(params.entries()), [
    ["salud", "NORMAL"],
    ["semana", "actual"],
  ]);
});

test("construirParamsHistorial conserva la especie seleccionada", () => {
  const params = construirParamsHistorial({
    especie: "PERRO",
    busqueda: "gretel",
    orden: "recientes",
  });

  assert.deepEqual(Array.from(params.entries()), [
    ["especie", "PERRO"],
    ["busqueda", "gretel"],
  ]);
});

test("aplicarFiltrosHistorial combina estado, salud, cuarentena, adopción y búsqueda", () => {
  const marzo = registro({
    id: 1,
    estadoValidacion: "REALIZADO",
    createdAt: "2026-11-14T10:00:00.000Z",
    requiereCuarentena: true,
    revisionCompleta: { estadoSalud: "CRITICO" },
    animal: { codigoAnimal: "anim-001", nombre: "Gretel", estadoAdopcion: "ADOPTABLE" },
  });

  const encajan = aplicarFiltrosHistorial([marzo], {
    estado: "REALIZADO",
    salud: "FRAGIL",
    cuarentena: true,
    adopcion: "ADOPTABLE",
    busqueda: "gretel",
  });
  assert.equal(encajan.length, 1);

  const sinCuarentena = aplicarFiltrosHistorial([marzo], {
    estado: "REALIZADO",
    salud: "FRAGIL",
    cuarentena: false,
    adopcion: "ADOPTABLE",
  });
  assert.equal(sinCuarentena.length, 1);

  const conCuarentena = aplicarFiltrosHistorial([marzo], {
    cuarentena: true,
  });
  assert.equal(conCuarentena.length, 1);

  const sinAdopcion = aplicarFiltrosHistorial([marzo], {
    adopcion: "NO_ADOPTABLE",
  });
  assert.equal(sinAdopcion.length, 0);
});

test("aplicarFiltrosHistorial filtra por especie", () => {
  const gato = registro({ id: 1, animal: { especie: "GATO" } });
  const perro = registro({ id: 2, animal: { especie: "PERRO" } });

  assert.deepEqual(
    aplicarFiltrosHistorial([gato, perro], { especie: "PERRO" }).map((r) => r.id),
    [2],
  );
});

test("estaEnSemanaActual considera fechas de la semana", () => {
  const hoy = new Date();
  const semana = inicioSemana(hoy);
  const dentro = registro({
    createdAt: new Date(semana.getTime() + 1).toISOString(),
  });
  const fuera = registro({
    createdAt: new Date(semana.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  });

  assert.equal(estaEnSemanaActual(dentro), true);
  assert.equal(estaEnSemanaActual(fuera), false);
});

test("estaEnSemanaActual tolera referencias inválidas y usa la fecha actual", () => {
  const hoy = new Date();
  const dentro = registro({ createdAt: hoy.toISOString() });

  assert.doesNotThrow(() => estaEnSemanaActual(dentro, 0));
  assert.equal(estaEnSemanaActual(dentro, 0), true);
  assert.equal(estaEnSemanaActual(dentro, "fecha-invalida"), true);
});

test("ordenarRegistros ordena por código, nombre y fechas", () => {
  const registros = [
    registro({ id: 1, createdAt: "2026-11-01T00:00:00.000Z", animal: { codigoAnimal: "b", nombre: "Zeta" } }),
    registro({ id: 2, createdAt: "2026-11-03T00:00:00.000Z", animal: { codigoAnimal: "a", nombre: "Alpha" } }),
    registro({ id: 3, createdAt: "2026-11-02T00:00:00.000Z", animal: { codigoAnimal: "c", nombre: "Beta" } }),
  ];

  assert.deepEqual(
    ordenarRegistros(registros, "codigo").map((r) => r.animal.codigoAnimal),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    ordenarRegistros(registros, "nombre").map((r) => r.animal.nombre),
    ["Alpha", "Beta", "Zeta"],
  );
  assert.deepEqual(
    ordenarRegistros(registros, "recientes").map((r) => r.id),
    [2, 3, 1],
  );
});

test("describirFiltrosActivos muestra cada filtro activo", () => {
  const chips = describirFiltrosActivos({
    salud: "FRAGIL",
    cuarentena: true,
    adopcion: "ADOPTABLE",
    especie: "GATO",
    busqueda: "gretel",
  });

  assert.deepEqual(chips.map((chip) => chip.clave), [
    "salud",
    "cuarentena",
    "adopcion",
    "especie",
    "busqueda",
  ]);
});

test("FILTROS_HISTORIAL_VACIOS tiene el estado vacío por defecto", () => {
  assert.equal(FILTROS_HISTORIAL_VACIOS.estado, "");
  assert.equal(FILTROS_HISTORIAL_VACIOS.orden, "recientes");
});

test("normalizarTexto quita acentos y transforma a minúsculas", () => {
  assert.equal(normalizarTexto("GRETÉL"), "gretel");
});

