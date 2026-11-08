import test from "node:test";
import assert from "node:assert/strict";
import {
  listarNotificaciones,
  marcarNotificacionComoLeida,
} from "../../src/services/notificacionService.js";

const actora = { id: 3, rol: "VOLUNTARIO", activo: true };

async function capturarError(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  return null;
}

test("lista las notificaciones del actor autenticado", async () => {
  const notificaciones = [{ id: 1, leida: false }];
  const dependencias = {
    async listarNotificacionesPorDestinatario(destinatarioId) {
      assert.equal(destinatarioId, actora.id);
      return notificaciones;
    },
  };

  const resultado = await listarNotificaciones(
    { actor: actora },
    dependencias,
  );

  assert.deepEqual(resultado, notificaciones);
});

test("marca como leida una notificacion propia", async () => {
  let recibido = null;
  const dependencias = {
    async marcarNotificacionLeida(id, destinatarioId) {
      recibido = { id, destinatarioId };
      return 1;
    },
  };

  const resultado = await marcarNotificacionComoLeida(
    { notificacionId: 4, actor: actora },
    dependencias,
  );

  assert.deepEqual(recibido, { id: 4, destinatarioId: 3 });
  assert.deepEqual(resultado, { id: 4, leida: true });
});

test("una notificacion inexistente o ajena responde 404", async () => {
  const dependencias = {
    async marcarNotificacionLeida() {
      return 0;
    },
  };

  const error = await capturarError(
    marcarNotificacionComoLeida(
      { notificacionId: 99, actor: actora },
      dependencias,
    ),
  );

  assert.equal(error.codigo, "NOTIFICACION_INEXISTENTE");
  assert.equal(error.estadoHttp, 404);
});
