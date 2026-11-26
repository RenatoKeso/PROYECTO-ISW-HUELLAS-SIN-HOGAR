import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";

import { crearAdopcionRouter } from "../../src/routes/adopcionRoutes.js";
import { crearAdopcionController } from "../../src/controllers/adopcionController.js";
import { AuthError } from "../../src/entities/authErrors.js";
import { postulacionDuplicada } from "../../src/entities/adopcionErrors.js";
import {
  manejadorErrores,
  manejarRutaNoEncontrada,
} from "../../src/handlers/manejadorErrores.js";

const FORMULARIO_VALIDO = {
  fichaAnimalId: 1,
  nombrePostulante: "Ana Soto",
  rutPostulante: "12.345.678-5",
  fechaNacimientoPostulante: "1995-04-10",
  telefonoPostulante: "9 1234 5678",
  emailPostulante: "Ana.Soto@Correo.cl",
  direccionPostulante: "Av. Libertad 123",
  comunaPostulante: "Chillán",
  tipoVivienda: "CASA",
  tenenciaVivienda: "PROPIA",
  tienePatio: true,
  personasHogar: 3,
  hayNinos: false,
  horasSoloAlDia: 4,
  disponibilidadTiempo: "Trabaja media jornada",
  motivoAdopcion: "Queremos darle un hogar a un animal rescatado",
  aceptaSeguimiento: true,
};

// Envia el formulario con algunos campos cambiados y devuelve los campos con error.
async function camposConError(url, cambios) {
  const respuesta = await enviar(`${url}/postulaciones`, {
    method: "POST",
    body: { ...FORMULARIO_VALIDO, ...cambios },
  });
  const cuerpo = await respuesta.json();

  assert.equal(respuesta.status, 400);
  return cuerpo.detalles.map((detalle) => detalle.campo);
}

// Autenticacion simulada: el token es el rol de la cuenta.
function autenticarDePrueba(request, response, next) {
  const token = request.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    next(new AuthError("Debes iniciar sesión"));
    return;
  }

  request.usuario = { id: 1, rol: token, activo: true, voluntarioId: null };
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

test("POST /postulaciones es publico y guarda el RUT y el telefono normalizados", async () => {
  let recibido;

  await conServidor(
    {
      registrarPostulacionAdopcion: async (datos) => {
        recibido = datos;
        return { id: 1, estado: "EN_REVISION" };
      },
    },
    async (url) => {
      const respuesta = await enviar(`${url}/postulaciones`, {
        method: "POST",
        body: FORMULARIO_VALIDO,
      });

      assert.equal(respuesta.status, 201);
      assert.equal(recibido.rutPostulante, "12345678-5");
      assert.equal(recibido.telefonoPostulante, "912345678");
      assert.equal(recibido.emailPostulante, "ana.soto@correo.cl");
      assert.ok(recibido.fechaNacimientoPostulante instanceof Date);
    },
  );
});

test("POST /postulaciones rechaza un nombre con numeros, como Benj4", async () => {
  await conServidor({}, async (url) => {
    assert.deepEqual(await camposConError(url, { nombrePostulante: "Benj4 Soto" }), [
      "nombrePostulante",
    ]);
    assert.deepEqual(await camposConError(url, { nombrePostulante: "Benjamin" }), [
      "nombrePostulante",
    ]);
  });
});

test("POST /postulaciones rechaza un RUT con el digito verificador incorrecto", async () => {
  await conServidor({}, async (url) => {
    assert.deepEqual(await camposConError(url, { rutPostulante: "12.345.678-9" }), [
      "rutPostulante",
    ]);
  });
});

test("POST /postulaciones exige el correo", async () => {
  await conServidor({}, async (url) => {
    const sinCorreo = { ...FORMULARIO_VALIDO };
    delete sinCorreo.emailPostulante;

    const respuesta = await enviar(`${url}/postulaciones`, { method: "POST", body: sinCorreo });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.deepEqual(cuerpo.detalles.map((detalle) => detalle.campo), ["emailPostulante"]);
  });
});

test("POST /postulaciones rechaza a un menor de 18 años", async () => {
  await conServidor({}, async (url) => {
    const haceDiezAnios = `${new Date().getFullYear() - 10}-01-01`;

    assert.deepEqual(
      await camposConError(url, { fechaNacimientoPostulante: haceDiezAnios }),
      ["fechaNacimientoPostulante"],
    );
  });
});

test("POST /postulaciones exige el permiso del arriendo solo si la vivienda es arrendada", async () => {
  await conServidor({}, async (url) => {
    assert.deepEqual(await camposConError(url, { tenenciaVivienda: "ARRENDADA" }), [
      "permiteMascotasArriendo",
    ]);
  });
});

test("POST /postulaciones exige aceptar los seguimientos", async () => {
  await conServidor({}, async (url) => {
    assert.deepEqual(await camposConError(url, { aceptaSeguimiento: false }), [
      "aceptaSeguimiento",
    ]);
  });
});

test("POST /postulaciones responde 400 si faltan datos obligatorios", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones`, {
      method: "POST",
      body: { fichaAnimalId: 1, rutPostulante: "abc" },
    });
    const cuerpo = await respuesta.json();
    const campos = cuerpo.detalles.map((detalle) => detalle.campo);

    assert.equal(respuesta.status, 400);
    assert.ok(campos.includes("rutPostulante"));
    assert.ok(campos.includes("nombrePostulante"));
    assert.ok(campos.includes("tipoVivienda"));
  });
});

test("POST /postulaciones responde 409 con el codigo del error de negocio", async () => {
  await conServidor(
    {
      registrarPostulacionAdopcion: async () => {
        throw postulacionDuplicada();
      },
    },
    async (url) => {
      const respuesta = await enviar(`${url}/postulaciones`, {
        method: "POST",
        body: FORMULARIO_VALIDO,
      });
      const cuerpo = await respuesta.json();

      assert.equal(respuesta.status, 409);
      assert.equal(cuerpo.code, "POSTULACION_DUPLICADA");
    },
  );
});

test("GET /postulaciones exige sesion", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones`);
    assert.equal(respuesta.status, 401);
  });
});

test("solo la directora y la encargada de adopciones ven las postulaciones", async () => {
  await conServidor(
    { obtenerPostulacionesAdopcion: async () => [] },
    async (url) => {
      const esperados = {
        DIRECTORA: 200,
        ENCARGADA_ADOPCIONES: 200,
        ENCARGADA_VOLUNTARIADO: 403,
        VETERINARIA: 403,
        VOLUNTARIO: 403,
      };

      for (const [rol, estado] of Object.entries(esperados)) {
        const respuesta = await enviar(`${url}/postulaciones`, { rol });
        assert.equal(respuesta.status, estado, rol);
      }
    },
  );
});

test("GET /postulaciones?estado= rechaza un estado que no existe", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones?estado=INVENTADO`, {
      rol: "DIRECTORA",
    });
    assert.equal(respuesta.status, 400);
  });
});

test("PATCH /postulaciones/:id/resolucion pasa la decision y el usuario al servicio", async () => {
  let llamada;

  await conServidor(
    {
      resolverPostulacionAdopcion: async (id, cuerpo, usuario) => {
        llamada = { id, cuerpo, usuario };
        return { id, estado: cuerpo.decision };
      },
    },
    async (url) => {
      const respuesta = await enviar(`${url}/postulaciones/7/resolucion`, {
        method: "PATCH",
        rol: "ENCARGADA_ADOPCIONES",
        body: { decision: "APROBADA" },
      });
      const cuerpo = await respuesta.json();

      assert.equal(respuesta.status, 200);
      assert.equal(cuerpo.message, "Postulacion aprobada");
      assert.equal(llamada.id, 7);
      assert.equal(llamada.usuario.rol, "ENCARGADA_ADOPCIONES");
    },
  );
});

test("PATCH /postulaciones/:id/resolucion manda el correo de aprobacion o el de rechazo", async () => {
  const aprobadas = [];
  const rechazadas = [];

  await conServidor(
    {
      resolverPostulacionAdopcion: async (id, cuerpo) => ({ id, estado: cuerpo.decision }),
      avisarAprobacion: async (postulacion) => aprobadas.push(postulacion),
      avisarRechazo: async (postulacion) => rechazadas.push(postulacion),
    },
    async (url) => {
      await enviar(`${url}/postulaciones/7/resolucion`, {
        method: "PATCH",
        rol: "DIRECTORA",
        body: { decision: "APROBADA" },
      });
      await enviar(`${url}/postulaciones/8/resolucion`, {
        method: "PATCH",
        rol: "DIRECTORA",
        body: { decision: "RECHAZADA", observaciones: "El arriendo no permite mascotas" },
      });
    },
  );

  assert.deepEqual(aprobadas, [{ id: 7, estado: "APROBADA" }]);
  assert.deepEqual(rechazadas, [{ id: 8, estado: "RECHAZADA" }]);
});

test("PATCH /postulaciones/:id/resolucion rechaza igual si el correo falla", async (t) => {
  const errores = t.mock.method(console, "error", () => {});

  await conServidor(
    {
      resolverPostulacionAdopcion: async (id, cuerpo) => ({ id, estado: cuerpo.decision }),
      avisarRechazo: async () => {
        throw new Error("Gmail no responde");
      },
    },
    async (url) => {
      const respuesta = await enviar(`${url}/postulaciones/7/resolucion`, {
        method: "PATCH",
        rol: "DIRECTORA",
        body: { decision: "RECHAZADA", observaciones: "El arriendo no permite mascotas" },
      });

      assert.equal(respuesta.status, 200);
    },
  );

  assert.equal(errores.mock.callCount(), 1);
  assert.match(errores.mock.calls[0].arguments[0], /correo de rechazo/);
});

test("PATCH /postulaciones/:id/resolucion aprueba igual si el correo falla", async (t) => {
  const errores = t.mock.method(console, "error", () => {});

  await conServidor(
    {
      resolverPostulacionAdopcion: async (id, cuerpo) => ({ id, estado: cuerpo.decision }),
      avisarAprobacion: async () => {
        throw new Error("Gmail no responde");
      },
    },
    async (url) => {
      const respuesta = await enviar(`${url}/postulaciones/7/resolucion`, {
        method: "PATCH",
        rol: "DIRECTORA",
        body: { decision: "APROBADA" },
      });

      assert.equal(respuesta.status, 200);
    },
  );

  assert.equal(errores.mock.callCount(), 1);
});

test("PATCH /postulaciones/:id/resolucion exige un motivo de rechazo de al menos 10 caracteres", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones/7/resolucion`, {
      method: "PATCH",
      rol: "DIRECTORA",
      body: { decision: "RECHAZADA", observaciones: "no" },
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.detalles[0].campo, "observaciones");
  });
});

test("PATCH /postulaciones/:id/resolucion solo acepta APROBADA o RECHAZADA", async () => {
  await conServidor({}, async (url) => {
    const respuesta = await enviar(`${url}/postulaciones/7/resolucion`, {
      method: "PATCH",
      rol: "DIRECTORA",
      body: { decision: "ENTREGADA" },
    });
    assert.equal(respuesta.status, 400);
  });
});
