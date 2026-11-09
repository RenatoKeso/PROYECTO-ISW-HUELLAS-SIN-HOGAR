import test from "node:test";
import assert from "node:assert/strict";

import {
  erroresDeApi,
  erroresDeZod,
} from "../src/utils/erroresFormulario.js";

test("erroresDeZod usa la ruta completa del campo", () => {
  const errores = erroresDeZod({
    issues: [
      { path: ["pesoKg"], message: "El peso es obligatorio" },
      {
        path: ["tratamientos", 0, "fechaInicio"],
        message: "La fecha es obligatoria",
      },
    ],
  });

  assert.deepEqual(errores, {
    pesoKg: "El peso es obligatorio",
    "tratamientos.0.fechaInicio": "La fecha es obligatoria",
  });
});

test("erroresDeZod conserva el ultimo mensaje de un campo repetido", () => {
  const errores = erroresDeZod({
    issues: [
      { path: ["campo"], message: "Primero" },
      { path: ["campo"], message: "Segundo" },
    ],
  });

  assert.deepEqual(errores, { campo: "Segundo" });
});

test("erroresDeApi ignora detalles sin campo", () => {
  const errores = erroresDeApi({
    detalles: [
      { campo: "fechaDesde", mensaje: "La fecha es invalida" },
      { mensaje: "Error general" },
      { campo: "fechaHasta", mensaje: "La fecha es invalida" },
    ],
  });

  assert.deepEqual(errores, {
    fechaDesde: "La fecha es invalida",
    fechaHasta: "La fecha es invalida",
  });
});

test("erroresDeApi devuelve un objeto vacio sin detalles", () => {
  assert.deepEqual(erroresDeApi(new Error("sin detalles")), {});
  assert.deepEqual(erroresDeApi({ detalles: null }), {});
});
