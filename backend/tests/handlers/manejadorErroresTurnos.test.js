import test from "node:test";
import assert from "node:assert/strict";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";
import {
  CODIGO_ERROR_TURNO,
  TurnoError,
  turnoInexistente,
  inscripcionInexistente,
  voluntarioNoVinculado,
  turnoSinCupos,
  horarioSolapado,
  fechasTurnoInvalidas,
  esErrorTurno,
} from "../../src/entities/turnoErrors.js";

function responder(error) {
  const respuesta = {
    headersSent: false,
    estado: null,
    cuerpo: null,
    status(codigo) {
      this.estado = codigo;
      return this;
    },
    json(cuerpo) {
      this.cuerpo = cuerpo;
      return this;
    },
  };
  manejadorErrores(error, {}, respuesta, () => {});
  return respuesta;
}

test("un error de turno se responde con su estado y su codigo", () => {
  const casos = [
    [turnoInexistente(7), 404, "TURNO_INEXISTENTE"],
    [inscripcionInexistente(3), 404, "INSCRIPCION_INEXISTENTE"],
    [voluntarioNoVinculado(), 403, "VOLUNTARIO_NO_VINCULADO"],
    [turnoSinCupos(), 409, "TURNO_SIN_CUPOS"],
    [horarioSolapado(), 409, "HORARIO_SOLAPADO"],
    [fechasTurnoInvalidas("El termino es anterior al inicio"), 400, "FECHAS_TURNO_INVALIDAS"],
  ];

  for (const [error, estado, codigo] of casos) {
    const respuesta = responder(error);
    assert.equal(respuesta.estado, estado);
    assert.equal(respuesta.cuerpo.code, codigo);
    assert.equal(respuesta.cuerpo.message, error.message);
  }
});

test("el mensaje del id incluye el id pedido", () => {
  assert.match(turnoInexistente(42).message, /42/);
  assert.match(inscripcionInexistente(9).message, /9/);
});

test("todos los codigos del catalogo tienen un estado HTTP definido", () => {
  for (const codigo of Object.values(CODIGO_ERROR_TURNO)) {
    const error = new TurnoError(codigo, "prueba");
    assert.ok(
      error.estadoHttp >= 400 && error.estadoHttp < 500,
      `${codigo} deberia responder 4xx y responde ${error.estadoHttp}`
    );
  }
});

test("esErrorTurno distingue los errores de turno de los demas", () => {
  assert.equal(esErrorTurno(turnoSinCupos()), true);
  assert.equal(esErrorTurno(new Error("otro")), false);
  assert.equal(esErrorTurno(null), false);
});

test("un error desconocido sigue respondiendo 500 sin exponer el detalle", () => {
  const original = console.error;
  console.error = () => {};
  try {
    const respuesta = responder(new Error("falla interna"));
    assert.equal(respuesta.estado, 500);
    assert.equal(respuesta.cuerpo.code, "ERROR_INTERNO");
    assert.ok(!JSON.stringify(respuesta.cuerpo).includes("falla interna"));
  } finally {
    console.error = original;
  }
});