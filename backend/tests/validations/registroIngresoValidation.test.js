import assert from "node:assert/strict";
import test from "node:test";
import {
  ESTADO_ESTADIA_AL_INGRESAR,
  registroIngresoSchema,
  separarFichaEIngreso,
} from "../../src/validations/registroIngresoValidation.js";

const ingresoInicialValido = {
  nombre: "Firulais",
  sexoAnimal: "MACHO",
  especie: "PERRO",
  raza: "Mestizo",
  edad: 4,
  observaciones: "Rescatado en la calle",
  receptorId: 2,
  fechaIngreso: "2026-09-27T10:00:00-03:00",
  procedencia: "Hallazgo en vía pública",
  ubicacionEncontrado: "Av. Central con Pedro Nº 100",
  estadoSalud: "En observación",
};

const reingresoValido = {
  codigoAnimal: "anim-001",
  receptorId: 2,
  fechaIngreso: "2026-09-28T09:00:00-03:00",
  procedencia: "Devuelto por una adopter",
  estadoSalud: "Desparasitado",
};

test("registroIngresoSchema acepta un ingreso inicial valido", () => {
  const resultado = registroIngresoSchema.safeParse(ingresoInicialValido);

  assert.equal(resultado.success, true);
  assert.equal(resultado.data.fechaIngreso instanceof Date, true);
});

test("registroIngresoSchema acepta un reingreso con solo codigoAnimal", () => {
  const resultado = registroIngresoSchema.safeParse(reingresoValido);

  assert.equal(resultado.success, true);
  assert.equal(resultado.data.codigoAnimal, "anim-001");
});

test("registroIngresoSchema exige los datos de la ficha en un ingreso inicial", () => {
  const { especie, sexoAnimal, ...sinFichaObligatoria } = ingresoInicialValido;
  const resultado = registroIngresoSchema.safeParse(sinFichaObligatoria);

  assert.equal(resultado.success, false);
  assert.equal(
    resultado.error.issues.some((issue) => issue.path.includes("especie")),
    true,
  );
});

test("registroIngresoSchema rechaza datos de ficha junto a codigoAnimal", () => {
  const resultado = registroIngresoSchema.safeParse({
    ...reingresoValido,
    nombre: "Firulais",
  });

  assert.equal(resultado.success, false);
});

test("registroIngresoSchema rechaza campos desconocidos", () => {
  const resultado = registroIngresoSchema.safeParse({
    ...ingresoInicialValido,
    estadoEstadia: "ADOPTADO",
  });

  assert.equal(resultado.success, false);
});

test("registroIngresoSchema rechaza un codigoAnimal con formato invalido", () => {
  const resultado = registroIngresoSchema.safeParse({
    ...reingresoValido,
    codigoAnimal: "A-001",
  });

  assert.equal(resultado.success, false);
});

test("separarFichaEIngreso arma el ingreso inicial con la ficha en estado ACTIVO", () => {
  const data = registroIngresoSchema.safeParse(ingresoInicialValido).data;
  const { ficha, ingreso } = separarFichaEIngreso(data);

  assert.equal(ficha.especie, "PERRO");
  assert.equal(ficha.estadoEstadia, ESTADO_ESTADIA_AL_INGRESAR);
  assert.equal(ingreso.receptorId, 2);
  assert.equal(ingreso.codigoAnimal, undefined);
  assert.equal(ingreso.fechaIngreso instanceof Date, true);
});

test("separarFichaEIngreso deja la ficha vacia en un reingreso", () => {
  const data = registroIngresoSchema.safeParse(reingresoValido).data;
  const { ficha, ingreso } = separarFichaEIngreso(data);

  assert.deepEqual(ficha, {});
  assert.equal(ingreso.codigoAnimal, "anim-001");
});
