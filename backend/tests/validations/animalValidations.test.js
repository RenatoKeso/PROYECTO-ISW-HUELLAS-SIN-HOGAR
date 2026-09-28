import assert from "node:assert/strict";
import test from "node:test";
import {
  codigoAnimalSchema,
  fichaAnimalCreateSchema,
  fichaAnimalUpdateSchema,
  fichaCreateSchema,
  fichaIdParamSchema,
} from "../../src/validations/fichaAnimalValidation.js";
import { ingresoAnimalCreateSchema } from "../../src/validations/ingresoAnimalValidation.js";

const fichaValida = {
  nombre: "Firulais",
  sexoAnimal: "MACHO",
  especie: "PERRO",
  raza: "Mestizo",
  edad: 4,
  observaciones: "Rescatado en la calle",
};

const ingresoValido = {
  fichaAnimalId: 1,
  receptorId: 2,
  fechaIngreso: "2026-09-27T10:00:00-03:00",
  procedencia: "Hallazgo en vía pública",
  ubicacionEncontrado: "Av. Central con Pedro Nº 100",
  estadoSalud: "En observación",
};

test("codigoAnimalSchema acepta el formato acordado", () => {
  assert.equal(codigoAnimalSchema.parse("anim-001").length, 8);
  assert.equal(codigoAnimalSchema.parse("anim-1"), "anim-1");
  assert.equal(codigoAnimalSchema.parse("anim-1000"), "anim-1000");
});

test("codigoAnimalSchema rechaza formatos incorrectos", () => {
  assert.equal(codigoAnimalSchema.safeParse("ANIM-001").success, false);
  assert.equal(codigoAnimalSchema.safeParse("anim-").success, false);
  assert.equal(codigoAnimalSchema.safeParse("anim-abc").success, false);
});

test("fichaAnimalCreateSchema acepta una ficha válida", () => {
  const result = fichaAnimalCreateSchema.safeParse(fichaValida);

  assert.equal(result.success, true);
  assert.equal(result.data.estadoEstadia, "ACTIVO");
});

test("fichaAnimalCreateSchema exige especie y sexo", () => {
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ especie: "PERRO" }).success,
    false,
  );
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ sexoAnimal: "MACHO" }).success,
    false,
  );
});

test("fichaAnimalCreateSchema rechaza enums inválidos", () => {
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ ...fichaValida, especie: "GATO" }).success,
    true,
  );
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ ...fichaValida, especie: "AVES" }).success,
    false,
  );
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ ...fichaValida, sexoAnimal: "OTRO" }).success,
    false,
  );
});

test("fichaAnimalCreateSchema valida la edad", () => {
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ ...fichaValida, edad: -1 }).success,
    false,
  );
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ ...fichaValida, edad: 2.5 }).success,
    false,
  );
});

test("fichaAnimalCreateSchema valida textos opcionales", () => {
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ ...fichaValida, nombre: "   " }).success,
    false,
  );
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ ...fichaValida, nombre: "a".repeat(256) })
      .success,
    false,
  );
});

test("fichaAnimalCreateSchema rechaza campos desconocidos", () => {
  assert.equal(
    fichaAnimalCreateSchema.safeParse({
      ...fichaValida,
      codigoAnimal: "anim-001",
    }).success,
    false,
  );
  assert.equal(
    fichaAnimalCreateSchema.safeParse({ ...fichaValida, id: 1 }).success,
    false,
  );
});

test("fichaCreateSchema acepta una ficha para el endpoint de fichas", () => {
  const result = fichaCreateSchema.safeParse(fichaValida);

  assert.equal(result.success, true);
  assert.equal(result.data.estadoEstadia, undefined);
});

test("fichaCreateSchema no permite elegir el estado de estadia", () => {
  const result = fichaCreateSchema.safeParse({
    ...fichaValida,
    estadoEstadia: "ADOPTADO",
  });

  assert.equal(result.success, false);
});

test("fichaCreateSchema exige especie y sexo", () => {
  assert.equal(fichaCreateSchema.safeParse({ especie: "PERRO" }).success, false);
  assert.equal(fichaCreateSchema.safeParse({ sexoAnimal: "MACHO" }).success, false);
});

test("fichaAnimalUpdateSchema acepta actualizaciones parciales", () => {
  const result = fichaAnimalUpdateSchema.safeParse({ edad: 5 });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { edad: 5 });
});

test("fichaAnimalUpdateSchema rechaza actualizaciones vacías", () => {
  assert.equal(fichaAnimalUpdateSchema.safeParse({}).success, false);
});

test("fichaAnimalUpdateSchema no permite modificar campos protegidos", () => {
  assert.equal(
    fichaAnimalUpdateSchema.safeParse({ codigoAnimal: "anim-002" }).success,
    false,
  );
  assert.equal(fichaAnimalUpdateSchema.safeParse({ id: 1 }).success, false);
  assert.equal(
    fichaAnimalUpdateSchema.safeParse({ createdAt: new Date() }).success,
    false,
  );
});

test("ingresoAnimalCreateSchema acepta un ingreso válido", () => {
  const result = ingresoAnimalCreateSchema.safeParse(ingresoValido);

  assert.equal(result.success, true);
  assert.equal(result.data.fechaIngreso instanceof Date, true);
});

test("ingresoAnimalCreateSchema acepta un ingreso inicial sin ficha previa", () => {
  const { fichaAnimalId, ...ingresoSinFicha } = ingresoValido;
  const result = ingresoAnimalCreateSchema.safeParse(ingresoSinFicha);

  assert.equal(result.success, true);
  assert.equal(result.data.fichaAnimalId, undefined);
});

test("ingresoAnimalCreateSchema acepta el codigo de una ficha para el reingreso", () => {
  const { fichaAnimalId, ...ingresoSinId } = ingresoValido;
  const result = ingresoAnimalCreateSchema.safeParse({
    ...ingresoSinId,
    codigoAnimal: "anim-001",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.codigoAnimal, "anim-001");
});

test("ingresoAnimalCreateSchema rechaza un codigo de ficha con formato invalido", () => {
  const result = ingresoAnimalCreateSchema.safeParse({
    ...ingresoValido,
    codigoAnimal: "ANIM-001",
  });

  assert.equal(result.success, false);
});

test("ingresoAnimalCreateSchema rechaza id y codigo de ficha a la vez", () => {
  const result = ingresoAnimalCreateSchema.safeParse({
    ...ingresoValido,
    codigoAnimal: "anim-001",
  });

  assert.equal(result.success, false);
});

test("ingresoAnimalCreateSchema exige identificadores válidos", () => {
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({ ...ingresoValido, fichaAnimalId: 0 })
      .success,
    false,
  );
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({ ...ingresoValido, receptorId: 1.5 })
      .success,
    false,
  );
});

test("ingresoAnimalCreateSchema exige fecha ISO 8601 con zona horaria", () => {
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({
      ...ingresoValido,
      fechaIngreso: "2026-09-27",
    }).success,
    false,
  );
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({
      ...ingresoValido,
      fechaIngreso: "2026-09-27T10:00:00",
    }).success,
    false,
  );
});

test("ingresoAnimalCreateSchema exige procedencia no vacía", () => {
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({ ...ingresoValido, procedencia: "   " })
      .success,
    false,
  );
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({ ...ingresoValido, procedencia: "" })
      .success,
    false,
  );
});

test("ingresoAnimalCreateSchema valida textos opcionales", () => {
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({
      ...ingresoValido,
      ubicacionEncontrado: "",
    }).success,
    false,
  );
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({
      ...ingresoValido,
      estadoSalud: "a".repeat(256),
    }).success,
    false,
  );
});

test("ingresoAnimalCreateSchema rechaza campos desconocidos", () => {
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({ ...ingresoValido, id: 1 }).success,
    false,
  );
  assert.equal(
    ingresoAnimalCreateSchema.safeParse({ ...ingresoValido, ficha: {} }).success,
    false,
  );
});

test("fichaIdParamSchema convierte el id de la ruta a numero", () => {
  const resultado = fichaIdParamSchema.safeParse({ id: "12" });

  assert.equal(resultado.success, true);
  assert.equal(resultado.data.id, 12);
});

test("fichaIdParamSchema rechaza un id invalido", () => {
  assert.equal(fichaIdParamSchema.safeParse({ id: "abc" }).success, false);
  assert.equal(fichaIdParamSchema.safeParse({ id: "0" }).success, false);
  assert.equal(fichaIdParamSchema.safeParse({ id: "-3" }).success, false);
  assert.equal(fichaIdParamSchema.safeParse({}).success, false);
});
