import test from "node:test";
import assert from "node:assert/strict";

import { generarReporteMedicoPdf } from "../../src/services/reporteMedicoService.js";
import { CODIGO_ERROR_REGISTRO_MEDICO } from "../../src/entities/registroMedicoErrors.js";

const actor = { id: 1, rol: "VETERINARIA", activo: true };

test("genera el reporte con los registros indicados y sus expedientes completos", async () => {
  const primero = { id: 7, animal: { nombre: "Firulais" } };
  const segundo = { id: 3, animal: { nombre: "Michi" } };
  const idsSolicitados = [];
  const argumentosPdf = [];
  const dependencias = {
    obtenerRegistro: async (id) => {
      idsSolicitados.push(id);
      return id === 7 ? primero : segundo;
    },
    crearPdf: async (argumentos) => {
      argumentosPdf.push(argumentos);
      return Buffer.from("%PDF-1.4");
    },
    puedeConsultar: () => true,
  };

  const resultado = await generarReporteMedicoPdf(
    {
      ids: [7, 3],
      actor,
      titulo: "Reporte médico",
      descripcionesFiltros: ["Estado: Activo"],
    },
    dependencias,
  );

  assert.deepEqual(idsSolicitados, [7, 3]);
  assert.equal(argumentosPdf.length, 1);
  assert.equal(argumentosPdf[0].registros.length, 2);
  assert.equal(argumentosPdf[0].registros[0].animal.nombre, "Firulais");
  assert.equal(argumentosPdf[0].titulo, "Reporte médico");
  assert.deepEqual(argumentosPdf[0].descripcionesFiltros, ["Estado: Activo"]);
  assert.equal(resultado.total, 2);
  assert.match(
    resultado.nombreArchivo,
    /^reporte-medico-\d{4}-\d{2}-\d{2}\.pdf$/,
  );
  assert.equal(resultado.pdf.toString(), "%PDF-1.4");
});

test("omite los registros que ya no existen", async () => {
  const argumentosPdf = [];
  const resultado = await generarReporteMedicoPdf(
    { ids: [999], actor },
    {
      obtenerRegistro: async () => null,
      crearPdf: async (argumentos) => {
        argumentosPdf.push(argumentos);
        return Buffer.from("%PDF");
      },
      puedeConsultar: () => true,
    },
  );

  assert.deepEqual(argumentosPdf[0].registros, []);
  assert.equal(resultado.total, 0);
});

test("rechaza a usuarios sin permisos", async () => {
  await assert.rejects(
    generarReporteMedicoPdf(
      { ids: [1], actor: { id: 99, rol: "VOLUNTARIO", activo: true } },
      {
        obtenerRegistro: async () => ({}),
        crearPdf: async () => Buffer.from("%PDF"),
        puedeConsultar: () => false,
      },
    ),
    (error) => {
      assert.equal(
        error.codigo,
        CODIGO_ERROR_REGISTRO_MEDICO.ROL_INSUFICIENTE,
      );
      return true;
    },
  );
});
