import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";

import { crearTurnoRouter } from "../../src/routes/turnoRoutes.js";
import { crearRouter } from "../../src/routes/index.js";
import { crearTurnoController } from "../../src/controllers/turnoController.js";
import { AuthError } from "../../src/entities/authErrors.js";
import { fechasTurnoInvalidas } from "../../src/entities/turnoErrors.js";
import {
  manejadorErrores,
  manejarRutaNoEncontrada,
} from "../../src/handlers/manejadorErrores.js";

const ROLES_QUE_GESTIONAN = ["DIRECTORA", "ENCARGADA_VOLUNTARIADO"];
const ROLES_QUE_SOLO_CONSULTAN = ["VOLUNTARIO", "VOLUNTARIO_CONFIANZA"];
const ROLES_SIN_ACCESO = ["ENCARGADA_ADOPCIONES", "VETERINARIA"];

const TURNO = { id: 1, titulo: "Paseo de perros", cupoMaximo: 10 };

const cuerpoValido = {
  titulo: "Paseo de perros",
  fecha: "2026-11-10",
  horaInicio: "09:00",
  horaTermino: "12:00",
  fechaLimiteInscripcion: "2026-11-09",
  cupoMaximo: 10,
};

// Autenticacion de prueba: el rol llega en el encabezado x-rol.
function autenticarDePrueba(request, response, next) {
  const rol = request.get("x-rol");

  if (!rol) {
    next(new AuthError("Debes iniciar sesión"));
    return;
  }

  request.usuario = { id: 5, rol, activo: true };
  next();
}

async function conServidor(controlador, comprobar) {
  const app = express();
  app.use(express.json());
  app.use(
    "/api/turnos",
    crearTurnoRouter({ controlador, autenticar: autenticarDePrueba }),
  );
  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");

  try {
    await once(servidor, "listening");
    const { port } = servidor.address();
    await comprobar(`http://127.0.0.1:${port}/api/turnos`);
  } finally {
    servidor.close();
  }
}

function pedir(url, { metodo = "GET", rol, cuerpo } = {}) {
  return fetch(url, {
    method: metodo,
    headers: {
      ...(rol ? { "x-rol": rol } : {}),
      ...(cuerpo ? { "Content-Type": "application/json" } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
}

// Controlador que cuenta cuantas veces se llamo al servicio.
function controladorDePrueba() {
  const llamadas = { publicar: [], gestion: 0, disponibles: 0 };

  const controlador = crearTurnoController({
    publicarTurnoServicio: async (datos, usuario) => {
      llamadas.publicar.push({ datos, usuario });
      return TURNO;
    },
    obtenerGestion: async () => {
      llamadas.gestion += 1;
      return [TURNO];
    },
    obtenerDisponibles: async () => {
      llamadas.disponibles += 1;
      return [TURNO];
    },
  });

  return { controlador, llamadas };
}

test("las tres rutas de turnos exigen sesion", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    for (const [metodo, ruta, cuerpo] of [
      ["POST", "", cuerpoValido],
      ["GET", "/gestion"],
      ["GET", ""],
    ]) {
      const respuesta = await pedir(`${url}${ruta}`, { metodo, cuerpo });

      assert.equal(respuesta.status, 401, `${metodo} ${ruta}`);
    }
  });

  assert.equal(llamadas.publicar.length + llamadas.gestion + llamadas.disponibles, 0);
});

test("solo la directora y la encargada de voluntariado publican y ven la gestion", async () => {
  const { controlador } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    for (const rol of ROLES_QUE_GESTIONAN) {
      const publicar = await pedir(url, { metodo: "POST", rol, cuerpo: cuerpoValido });
      const gestion = await pedir(`${url}/gestion`, { rol });

      assert.equal(publicar.status, 201, `${rol} publica`);
      assert.equal(gestion.status, 200, `${rol} ve la gestion`);
    }

    for (const rol of [...ROLES_QUE_SOLO_CONSULTAN, ...ROLES_SIN_ACCESO]) {
      const publicar = await pedir(url, { metodo: "POST", rol, cuerpo: cuerpoValido });
      const gestion = await pedir(`${url}/gestion`, { rol });

      assert.equal(publicar.status, 403, `${rol} no publica`);
      assert.equal((await publicar.json()).code, "ACCESO_DENEGADO");
      assert.equal(gestion.status, 403, `${rol} no ve la gestion`);
    }
  });
});

test("ven los turnos disponibles quienes publican y los voluntarios", async () => {
  const { controlador } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    for (const rol of [...ROLES_QUE_GESTIONAN, ...ROLES_QUE_SOLO_CONSULTAN]) {
      const respuesta = await pedir(url, { rol });

      assert.equal(respuesta.status, 200, rol);
    }

    for (const rol of ROLES_SIN_ACCESO) {
      const respuesta = await pedir(url, { rol });

      assert.equal(respuesta.status, 403, rol);
    }
  });
});

test("POST responde 201 y pasa los datos y la cuenta al servicio", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(url, {
      metodo: "POST",
      rol: "ENCARGADA_VOLUNTARIADO",
      cuerpo: { ...cuerpoValido, titulo: "  Paseo de perros  " },
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.equal(cuerpo.message, "Turno publicado correctamente");
    assert.deepEqual(cuerpo.turno, TURNO);
  });

  assert.equal(llamadas.publicar.length, 1);
  assert.deepEqual(llamadas.publicar[0].datos, cuerpoValido);
  assert.equal(llamadas.publicar[0].usuario.id, 5);
});

test("POST responde 400 con el detalle si los datos no son validos", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(url, {
      metodo: "POST",
      rol: "DIRECTORA",
      cuerpo: { ...cuerpoValido, horaInicio: "9:00", cupoMaximo: 0, estado: "CANCELADO" },
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.code, "DATOS_INVALIDOS");
    const campos = cuerpo.detalles.map((detalle) => detalle.campo);
    assert.ok(campos.includes("horaInicio"));
    assert.ok(campos.includes("cupoMaximo"));
    assert.ok(campos.includes("estado"));
  });

  assert.equal(llamadas.publicar.length, 0, "no debe llegar al servicio");
});

test("POST responde 400 con el codigo del error de las reglas del turno", async () => {
  const controlador = crearTurnoController({
    publicarTurnoServicio: async () => {
      throw fechasTurnoInvalidas("El turno debe comenzar en el futuro");
    },
  });

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(url, {
      metodo: "POST",
      rol: "DIRECTORA",
      cuerpo: cuerpoValido,
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.code, "FECHAS_TURNO_INVALIDAS");
    assert.equal(cuerpo.message, "El turno debe comenzar en el futuro");
  });
});

test("las listas responden los turnos que entrega el servicio", async () => {
  const { controlador, llamadas } = controladorDePrueba();

  await conServidor(controlador, async (url) => {
    const gestion = await pedir(`${url}/gestion`, { rol: "DIRECTORA" });
    const disponibles = await pedir(url, { rol: "VOLUNTARIO" });

    assert.deepEqual((await gestion.json()).turnos, [TURNO]);
    assert.deepEqual((await disponibles.json()).turnos, [TURNO]);
  });

  assert.equal(llamadas.gestion, 1);
  assert.equal(llamadas.disponibles, 1);
});

test("el router principal monta /api/turnos con sesion y permisos", async () => {
  const servicioAuth = {
    async autenticar(token) {
      if (token === "malo") throw new AuthError("Sesión inválida");

      return { id: 1, rol: token, activo: true };
    },
  };

  const app = express();
  app.use(express.json());
  app.use("/api", crearRouter({ servicioAuth }));
  app.use(manejarRutaNoEncontrada);
  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");

  try {
    await once(servidor, "listening");
    const { port } = servidor.address();
    const base = `http://127.0.0.1:${port}/api/turnos`;
    const conToken = (token, opciones = {}) =>
      fetch(base + (opciones.ruta ?? ""), {
        method: opciones.metodo ?? "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      });

    assert.equal((await fetch(base)).status, 401);
    assert.equal((await conToken("malo")).status, 401);
    assert.equal((await conToken("VETERINARIA")).status, 403);
    assert.equal((await conToken("VOLUNTARIO", { ruta: "/gestion" })).status, 403);
    assert.equal(
      (await conToken("VOLUNTARIO", { metodo: "POST", cuerpo: cuerpoValido })).status,
      403,
    );
    // Con permiso, los datos invalidos se rechazan antes de llegar a la base.
    assert.equal(
      (await conToken("DIRECTORA", { metodo: "POST", cuerpo: {} })).status,
      400,
    );
  } finally {
    servidor.close();
  }
});