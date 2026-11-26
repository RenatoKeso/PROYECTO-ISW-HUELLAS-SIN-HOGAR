import test from "node:test";
import assert from "node:assert/strict";

import {
  armarCorreoAdoptadoPorOtro,
  armarCorreoAprobacion,
  armarCorreoRechazo,
  enviarCorreoAprobacion,
  enviarCorreoRechazo,
  enviarCorreosAdoptadoPorOtro,
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

// ---------- Rechazo ----------

function postulacionRechazada(cambios = {}) {
  return postulacionAprobada({
    estado: "RECHAZADA",
    observaciones: "El arriendo no permite mascotas",
    ...cambios,
  });
}

test("el correo de rechazo va al postulante y le explica el motivo", () => {
  const correo = armarCorreoRechazo(postulacionRechazada());

  assert.equal(correo.para, "camila@correo.cl");
  assert.match(correo.asunto, /adoptar a Galileo/);
  assert.match(correo.html, /Camila Muñoz Rivas/);
  assert.match(correo.html, /no pudimos aprobarla/);
  assert.match(correo.html, /El arriendo no permite mascotas/);
});

test("el correo de rechazo usa el motivo que se le pase (el de una visita desfavorable)", () => {
  const correo = armarCorreoRechazo(postulacionRechazada(), "No tiene patio cerrado");

  assert.match(correo.html, /No tiene patio cerrado/);
  assert.doesNotMatch(correo.html, /El arriendo no permite mascotas/);
});

test("el motivo del rechazo no puede meter HTML en el correo", () => {
  const correo = armarCorreoRechazo(postulacionRechazada({ observaciones: "<script>x</script>" }));

  assert.doesNotMatch(correo.html, /<script>/);
  assert.match(correo.html, /&lt;script&gt;x&lt;\/script&gt;/);
});

test("solo se envia el correo de rechazo si la postulacion quedo rechazada y tiene correo", async () => {
  const enviados = [];
  const enviar = async (correo) => enviados.push(correo);

  assert.equal(await enviarCorreoRechazo(postulacionRechazada(), undefined, enviar), true);
  assert.equal(await enviarCorreoRechazo(postulacionAprobada(), undefined, enviar), false);
  assert.equal(
    await enviarCorreoRechazo(postulacionRechazada({ emailPostulante: null }), undefined, enviar),
    false,
  );
  assert.equal(await enviarCorreoRechazo(null, undefined, enviar), false);

  assert.equal(enviados.length, 1);
  assert.match(enviados[0].html, /El arriendo no permite mascotas/);
});

// ---------- Animal adoptado por otro postulante ----------

function postulacionCerrada(cambios = {}) {
  return postulacionAprobada({ estado: "CERRADA", ...cambios });
}

test("el correo de adoptado avisa que el animal fue adoptado por otro postulante", () => {
  const correo = armarCorreoAdoptadoPorOtro(postulacionCerrada());

  assert.equal(correo.para, "camila@correo.cl");
  assert.match(correo.asunto, /Galileo ya encontró un hogar/);
  assert.match(correo.html, /Camila Muñoz Rivas/);
  assert.match(correo.html, /ya fue adoptado por otro postulante/);
});

test("si el animal es hembra, el correo dice adoptada", () => {
  const correo = armarCorreoAdoptadoPorOtro(
    postulacionCerrada({ fichaAnimal: { nombre: "Luna", sexoAnimal: "HEMBRA" } }),
  );

  assert.match(correo.html, /ya fue adoptada por otro postulante/);
});

test("se manda un correo separado a cada postulante y se salta a quien no tiene correo", async () => {
  const enviados = [];
  const enviar = async (correo) => enviados.push(correo);

  const total = await enviarCorreosAdoptadoPorOtro(
    [
      postulacionCerrada({ id: 1, emailPostulante: "ana@correo.cl" }),
      postulacionCerrada({ id: 2, emailPostulante: null }),
      postulacionCerrada({ id: 3, emailPostulante: "luis@correo.cl" }),
    ],
    enviar,
  );

  assert.equal(total, 2);
  // Cada correo lleva una sola direccion: nadie ve el email de los demas.
  assert.deepEqual(
    enviados.map((correo) => correo.para),
    ["ana@correo.cl", "luis@correo.cl"],
  );
});

test("si un correo de adoptado falla, igual se envian los demas", async (t) => {
  const errores = t.mock.method(console, "error", () => {});
  const enviados = [];
  const enviar = async (correo) => {
    if (correo.para === "ana@correo.cl") throw new Error("Direccion invalida");
    enviados.push(correo.para);
  };

  const total = await enviarCorreosAdoptadoPorOtro(
    [
      postulacionCerrada({ emailPostulante: "ana@correo.cl" }),
      postulacionCerrada({ emailPostulante: "luis@correo.cl" }),
    ],
    enviar,
  );

  assert.equal(total, 1);
  assert.deepEqual(enviados, ["luis@correo.cl"]);
  assert.equal(errores.mock.callCount(), 1);
});

test("si no habia otras postulaciones no se envia nada", async () => {
  const enviados = [];

  assert.equal(await enviarCorreosAdoptadoPorOtro([], async (correo) => enviados.push(correo)), 0);
  assert.equal(enviados.length, 0);
});
