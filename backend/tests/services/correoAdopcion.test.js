import test from "node:test";
import assert from "node:assert/strict";

import {
  armarCorreoAprobacion,
  enviarCorreoAprobacion,
  escaparHtml,
} from "../../src/services/correoAdopcionService.js";

function postulacionAprobada(cambios = {}) {
  return {
    id: 7,
    estado: "APROBADA",
    nombrePostulante: "Camila Muñoz Rivas",
    emailPostulante: "camila@correo.cl",
    fichaAnimal: { nombre: "Galileo", sexoAnimal: "MACHO" },
    ...cambios,
  };
}

test("el correo de aprobacion va al postulante y le da el horario para conocer al animal", () => {
  const correo = armarCorreoAprobacion(postulacionAprobada());

  assert.equal(correo.para, "camila@correo.cl");
  assert.match(correo.asunto, /Galileo fue aprobada/);
  assert.match(correo.html, /Camila Muñoz Rivas/);
  assert.match(correo.html, /entre las 9:00 y las 17:00 hrs/);
  assert.match(correo.html, /a conocerlo/);
});

test("si el animal es hembra, el correo dice conocerla", () => {
  const correo = armarCorreoAprobacion(
    postulacionAprobada({ fichaAnimal: { nombre: "Luna", sexoAnimal: "HEMBRA" } }),
  );

  assert.match(correo.html, /a conocerla/);
});

test("el nombre que viene del formulario no puede meter HTML en el correo", () => {
  const correo = armarCorreoAprobacion(
    postulacionAprobada({ nombrePostulante: '<a href="x">Ana</a>' }),
  );

  assert.doesNotMatch(correo.html, /<a href/);
  assert.match(correo.html, /&lt;a href=&quot;x&quot;&gt;Ana&lt;\/a&gt;/);
  assert.equal(escaparHtml(null), "");
});

test("solo se envia el correo si la postulacion quedo aprobada y tiene correo", async () => {
  const enviados = [];
  const enviar = async (correo) => enviados.push(correo);

  assert.equal(await enviarCorreoAprobacion(postulacionAprobada(), enviar), true);
  assert.equal(await enviarCorreoAprobacion(postulacionAprobada({ estado: "RECHAZADA" }), enviar), false);
  assert.equal(await enviarCorreoAprobacion(postulacionAprobada({ emailPostulante: null }), enviar), false);

  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].para, "camila@correo.cl");
});
