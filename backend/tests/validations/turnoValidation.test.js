import assert from "node:assert/strict";
import test from "node:test";
import { turnoCreateSchema } from "../../src/validations/turnoValidation.js";

const datosValidos = {
  titulo: "Paseo de perros",
  descripcion: "Sacar a pasear a los perros del refugio",
  fecha: "2026-11-10",
  horaInicio: "09:00",
  horaTermino: "12:00",
  fechaLimiteInscripcion: "2026-11-09",
  cupoMaximo: 10,
};

function camposConError(datos) {
  const resultado = turnoCreateSchema.safeParse(datos);
  assert.equal(resultado.success, false);
  return resultado.error.issues.map((issue) => issue.path.join("."));
}

test("acepta un turno valido", () => {
  const resultado = turnoCreateSchema.safeParse(datosValidos);
  assert.equal(resultado.success, true);
  assert.deepEqual(resultado.data, datosValidos);
});

test("la descripcion es opcional", () => {
  const { descripcion, ...sinDescripcion } = datosValidos;
  assert.equal(turnoCreateSchema.safeParse(sinDescripcion).success, true);
});

test("quita los espacios sobrantes del titulo", () => {
  const resultado = turnoCreateSchema.safeParse({ ...datosValidos, titulo: "  Limpieza  " });
  assert.equal(resultado.data.titulo, "Limpieza");
});

test("rechaza un titulo vacio, solo con espacios o demasiado largo", () => {
  assert.deepEqual(camposConError({ ...datosValidos, titulo: "" }), ["titulo"]);
  assert.deepEqual(camposConError({ ...datosValidos, titulo: "   " }), ["titulo"]);
  assert.deepEqual(camposConError({ ...datosValidos, titulo: "a".repeat(121) }), ["titulo"]);
});

test("rechaza una descripcion vacia o demasiado larga", () => {
  assert.deepEqual(camposConError({ ...datosValidos, descripcion: "  " }), ["descripcion"]);
  assert.deepEqual(camposConError({ ...datosValidos, descripcion: "a".repeat(1001) }), ["descripcion"]);
});

test("rechaza fechas con formato incorrecto o que no existen", () => {
  assert.deepEqual(camposConError({ ...datosValidos, fecha: "10-11-2026" }), ["fecha"]);
  assert.deepEqual(camposConError({ ...datosValidos, fecha: "2026-02-30" }), ["fecha"]);
  assert.deepEqual(
    camposConError({ ...datosValidos, fechaLimiteInscripcion: "mañana" }),
    ["fechaLimiteInscripcion"],
  );
});

test("rechaza horas con formato incorrecto", () => {
  assert.deepEqual(camposConError({ ...datosValidos, horaInicio: "9:00" }), ["horaInicio"]);
  assert.deepEqual(camposConError({ ...datosValidos, horaInicio: "24:00" }), ["horaInicio"]);
  assert.deepEqual(camposConError({ ...datosValidos, horaTermino: "12:60" }), ["horaTermino"]);
  assert.deepEqual(camposConError({ ...datosValidos, horaTermino: 1200 }), ["horaTermino"]);
});

test("el cupo debe ser un entero entre 1 y 100", () => {
  assert.equal(turnoCreateSchema.safeParse({ ...datosValidos, cupoMaximo: 1 }).success, true);
  assert.equal(turnoCreateSchema.safeParse({ ...datosValidos, cupoMaximo: 100 }).success, true);
  assert.deepEqual(camposConError({ ...datosValidos, cupoMaximo: 0 }), ["cupoMaximo"]);
  assert.deepEqual(camposConError({ ...datosValidos, cupoMaximo: 101 }), ["cupoMaximo"]);
  assert.deepEqual(camposConError({ ...datosValidos, cupoMaximo: 2.5 }), ["cupoMaximo"]);
  assert.deepEqual(camposConError({ ...datosValidos, cupoMaximo: "10" }), ["cupoMaximo"]);
});

test("rechaza campos que el cliente no debe enviar", () => {
  const resultado = turnoCreateSchema.safeParse({
    ...datosValidos,
    cuposDisponibles: 99,
    estado: "CANCELADO",
    publicadoPorId: 1,
  });
  assert.equal(resultado.success, false);
  assert.equal(resultado.error.issues[0].code, "unrecognized_keys");
});

test("exige todos los campos obligatorios", () => {
  const resultado = turnoCreateSchema.safeParse({});
  assert.equal(resultado.success, false);
  const campos = resultado.error.issues.map((issue) => issue.path.join("."));
  for (const campo of ["titulo", "fecha", "horaInicio", "horaTermino", "fechaLimiteInscripcion", "cupoMaximo"]) {
    assert.ok(campos.includes(campo), `falta el error de ${campo}`);
  }
});