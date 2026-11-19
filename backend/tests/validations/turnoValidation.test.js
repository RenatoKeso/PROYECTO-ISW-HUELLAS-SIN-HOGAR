import assert from "node:assert/strict";
import test from "node:test";
import {
  MENSAJE_TITULO,
  calendarioQuerySchema,
  gestionQuerySchema,
  turnoCancelacionSchema,
  turnoCreateSchema,
  turnoIdSchema,
} from "../../src/validations/turnoValidation.js";

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

function mensajesDelTitulo(titulo) {
  const resultado = turnoCreateSchema.safeParse({ ...datosValidos, titulo });
  assert.equal(resultado.success, false);
  return resultado.error.issues.map((issue) => issue.message);
}

test("acepta un titulo con tildes, ñ, comas y guiones", () => {
  for (const titulo of ["Baño de gatos", "Paseo de perros, turno mañana", "Limpieza - patio norte", "ÑANDÚ"]) {
    assert.equal(turnoCreateSchema.safeParse({ ...datosValidos, titulo }).success, true, titulo);
  }
});

test("acepta un titulo de exactamente 120 caracteres", () => {
  assert.equal(turnoCreateSchema.safeParse({ ...datosValidos, titulo: "a".repeat(120) }).success, true);
});

test("rechaza un titulo con numeros", () => {
  assert.deepEqual(mensajesDelTitulo("Turno 2"), [MENSAJE_TITULO]);
  assert.deepEqual(mensajesDelTitulo("123"), [MENSAJE_TITULO]);
});

test("rechaza un titulo con caracteres especiales", () => {
  for (const titulo of ["Paseo!", "Baño @ refugio", "Limpieza.", "Turno #1", "Paseo_perros", "Feria (sábado)"]) {
    assert.deepEqual(mensajesDelTitulo(titulo), [MENSAJE_TITULO], titulo);
  }
});

test("el titulo debe empezar con una letra", () => {
  assert.deepEqual(mensajesDelTitulo("- Paseo"), [MENSAJE_TITULO]);
  assert.deepEqual(mensajesDelTitulo(", Paseo"), [MENSAJE_TITULO]);
});

test("un titulo vacio da un solo error, el de obligatorio", () => {
  assert.deepEqual(mensajesDelTitulo(""), ["El título es obligatorio"]);
  assert.deepEqual(mensajesDelTitulo("   "), ["El título es obligatorio"]);
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

test("el calendario se pide con la fecha de un lunes", () => {
  assert.deepEqual(calendarioQuerySchema.parse({ semana: "2026-11-16" }), { semana: "2026-11-16" });
});

test("el calendario rechaza una fecha que no es lunes", () => {
  for (const semana of ["2026-11-17", "2026-11-22"]) {
    const resultado = calendarioQuerySchema.safeParse({ semana });
    assert.equal(resultado.success, false, semana);
    assert.equal(resultado.error.issues[0].message, "La semana se indica con la fecha de su lunes");
  }
});

test("el calendario rechaza una semana vacia, mal escrita o con campos extra", () => {
  assert.equal(calendarioQuerySchema.safeParse({}).success, false);
  assert.equal(calendarioQuerySchema.safeParse({ semana: "16-11-2026" }).success, false);
  assert.equal(calendarioQuerySchema.safeParse({ semana: "2026-02-30" }).success, false);
  assert.equal(calendarioQuerySchema.safeParse({ semana: "2026-11-16", voluntarioId: "3" }).success, false);
});

test("la gestion acepta una semana opcional, que tambien debe ser lunes", () => {
  assert.deepEqual(gestionQuerySchema.parse({}), {});
  assert.deepEqual(gestionQuerySchema.parse({ semana: "2026-11-09" }), { semana: "2026-11-09" });
  assert.equal(gestionQuerySchema.safeParse({ semana: "2026-11-10" }).success, false);
  assert.equal(gestionQuerySchema.safeParse({ estado: "CANCELADO" }).success, false);
});

test("el id del turno se convierte a numero y debe ser un entero positivo", () => {
  assert.deepEqual(turnoIdSchema.parse({ id: "12" }), { id: 12 });

  for (const id of ["0", "-3", "2.5", "abc"]) {
    assert.equal(turnoIdSchema.safeParse({ id }).success, false, id);
  }
});

test("cancelar un turno exige un motivo de hasta 500 caracteres", () => {
  assert.deepEqual(turnoCancelacionSchema.parse({ motivo: "  Lluvia  " }), { motivo: "Lluvia" });

  const vacio = turnoCancelacionSchema.safeParse({ motivo: "   " });
  assert.equal(vacio.success, false);
  assert.equal(vacio.error.issues[0].message, "El motivo es obligatorio");

  assert.equal(turnoCancelacionSchema.safeParse({}).success, false);
  assert.equal(turnoCancelacionSchema.safeParse({ motivo: "a".repeat(501) }).success, false);
  assert.equal(turnoCancelacionSchema.safeParse({ motivo: "Lluvia", estado: "PUBLICADO" }).success, false);
});
