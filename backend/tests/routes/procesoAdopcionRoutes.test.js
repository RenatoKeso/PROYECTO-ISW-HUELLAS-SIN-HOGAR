import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";

import { crearAdopcionRouter } from "../../src/routes/adopcionRoutes.js";
import { crearAdopcionController } from "../../src/controllers/adopcionController.js";
import { AuthError } from "../../src/entities/authErrors.js";
import {
  manejadorErrores,
  manejarRutaNoEncontrada,
} from "../../src/handlers/manejadorErrores.js";

// Autenticacion simulada: el token es el rol de la cuenta.
function autenticarDePrueba(request, response, next) {
  const token = request.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    next(new AuthError("Debes iniciar sesión"));
    return;
  }

  request.usuario = { id: 5, rol: token, activo: true, voluntarioId: null };
  next();
}

async function conServidor(dependencias, comprobar) {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/adopciones",
    crearAdopcionRouter({
      controlador: crearAdopcionController(dependencias),
      autenticar: autenticarDePrueba,
    }),
  );
  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");

  try {
    await once(servidor, "listening");
    const { port } = servidor.address();
    await comprobar(`http://127.0.0.1:${port}/api/adopciones`);
  } finally {
    servidor.close();
  }
}

function enviar(url, { method = "GET", body, rol } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (rol) headers.Authorization = `Bearer ${rol}`;

  return fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const RUTAS_PROTEGIDAS = [
  ["GET", "/animales/publicables"],
  ["PATCH", "/animales/3/publicar"],
  ["POST", "/postulaciones/1/visitas", { tipo: "PRIMERA_VISITA", fechaVisita: "2026-10-20", resultado: "FAVORABLE" }],
  ["POST", "/postulaciones/1/omision-visita", { motivo: "DISTANCIA" }],
  ["POST", "/postulaciones/1/entrega", { fechaEntrega: "2026-10-20", documentacionEntregada: "Contrato" }],
  ["PATCH", "/postulaciones/1/seguimientos/2/realizado"],
];

test("las rutas de publicacion, visitas y entrega exigen sesion", async () => {
  await conServidor({}, async (url) => {
    for (const [method, ruta, body] of RUTAS_PROTEGIDAS) {
      const respuesta = await enviar(url + ruta, { method, body });
      assert.equal(respuesta.status, 401, `${method} ${ruta}`);
    }
  });
});

test("una veterinaria no puede publicar, registrar visitas ni entregar", async () => {
  await conServidor({}, async (url) => {
    for (const [method, ruta, body] of RUTAS_PROTEGIDAS) {
      const respuesta = await enviar(url + ruta, { method, body, rol: "VETERINARIA" });
      assert.equal(respuesta.status, 403, `${method} ${ruta}`);
    }
  });
});

test("PATCH /animales/:id/publicar llama al servicio con el id numerico", async () => {
  let recibido;

  await conServidor(
    {
      publicarAnimalAdopcion: async (id) => {
        recibido = id;
        return { id, estadoEstadia: "ESPERA_ADOPCION" };
      },
    },
    async (url) => {
      const respuesta = await enviar(`${url}/animales/3/publicar`, { method: "PATCH", rol: "ENCARGADA_ADOPCIONES" });
      assert.equal(respuesta.status, 200);
      assert.equal(recibido, 3);
    },
  );
});

test("POST /visitas valida el tipo, el resultado y que la fecha no sea futura", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones/1/visitas`, {
      method: "POST",
      rol: "DIRECTORA",
      body: { tipo: "OTRA", fechaVisita: "2099-01-01", resultado: "BIEN" },
    });
    const cuerpo = await respuesta.json();
    const campos = cuerpo.detalles.map((detalle) => detalle.campo);

    assert.equal(respuesta.status, 400);
    assert.ok(campos.includes("tipo"));
    assert.ok(campos.includes("fechaVisita"));
    assert.ok(campos.includes("resultado"));
  });
});

test("POST /visitas pasa el usuario al servicio y responde 201", async () => {
  let usuario;

  await conServidor(
    {
      registrarVisitaAdopcion: async (id, datos, actor) => {
        usuario = actor;
        return { id: 1, ...datos };
      },
    },
    async (url) => {
      const respuesta = await enviar(`${url}/postulaciones/1/visitas`, {
        method: "POST",
        rol: "ENCARGADA_ADOPCIONES",
        body: { tipo: "PRIMERA_VISITA", fechaVisita: "2026-10-20", resultado: "FAVORABLE" },
      });

      assert.equal(respuesta.status, 201);
      assert.equal(usuario.id, 5);
    },
  );
});

test("POST /omision-visita exige explicar el motivo OTRO", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones/1/omision-visita`, {
      method: "POST",
      rol: "DIRECTORA",
      body: { motivo: "OTRO" },
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.detalles[0].campo, "observacion");
  });
});

test("POST /entrega exige fecha y documentacion", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones/1/entrega`, {
      method: "POST",
      rol: "DIRECTORA",
      body: { fechaEntrega: "31-10-2026" },
    });
    const cuerpo = await respuesta.json();
    const campos = cuerpo.detalles.map((detalle) => detalle.campo);

    assert.equal(respuesta.status, 400);
    assert.ok(campos.includes("fechaEntrega"));
    assert.ok(campos.includes("documentacionEntregada"));
  });
});

test("POST /visitas exige explicar una visita desfavorable", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones/1/visitas`, {
      method: "POST",
      rol: "DIRECTORA",
      body: { tipo: "PRIMERA_VISITA", fechaVisita: "2026-10-20", resultado: "DESFAVORABLE" },
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.detalles[0].campo, "observaciones");
  });
});

test("PATCH /resolucion exige el motivo al rechazar, no al aprobar", async () => {
  await conServidor(
    { resolverPostulacionAdopcion: async (id, datos) => ({ id, estado: datos.decision }) },
    async (url) => {
      const sinMotivo = await enviar(`${url}/postulaciones/7/resolucion`, {
        method: "PATCH",
        rol: "DIRECTORA",
        body: { decision: "RECHAZADA" },
      });
      const cuerpo = await sinMotivo.json();

      assert.equal(sinMotivo.status, 400);
      assert.equal(cuerpo.detalles[0].campo, "observaciones");

      const conMotivo = await enviar(`${url}/postulaciones/7/resolucion`, {
        method: "PATCH",
        rol: "DIRECTORA",
        body: { decision: "RECHAZADA", observaciones: "Vivienda sin cierre perimetral" },
      });
      assert.equal(conMotivo.status, 200);

      const aprobar = await enviar(`${url}/postulaciones/7/resolucion`, {
        method: "PATCH",
        rol: "DIRECTORA",
        body: { decision: "APROBADA" },
      });
      assert.equal(aprobar.status, 200);
    },
  );
});

test("PATCH /seguimientos/:seguimientoId/realizado pasa los dos ids numericos", async () => {
  let recibido;

  await conServidor(
    {
      realizarSeguimientoAdopcion: async (postulacionId, seguimientoId) => {
        recibido = [postulacionId, seguimientoId];
        return { id: postulacionId, estado: "ENTREGADA" };
      },
    },
    async (url) => {
      const respuesta = await enviar(`${url}/postulaciones/8/seguimientos/3/realizado`, {
        method: "PATCH",
        rol: "ENCARGADA_ADOPCIONES",
      });

      assert.equal(respuesta.status, 200);
      assert.deepEqual(recibido, [8, 3]);

      const idInvalido = await enviar(`${url}/postulaciones/8/seguimientos/abc/realizado`, {
        method: "PATCH",
        rol: "ENCARGADA_ADOPCIONES",
      });
      assert.equal(idInvalido.status, 400);
    },
  );
});
