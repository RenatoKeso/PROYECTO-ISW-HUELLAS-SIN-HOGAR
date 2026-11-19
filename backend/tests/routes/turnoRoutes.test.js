import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";

import { crearTurnoRouter } from "../../src/routes/turnoRoutes.js";
import { crearRouter } from "../../src/routes/index.js";
import { crearTurnoController } from "../../src/controllers/turnoController.js";
import { AuthError } from "../../src/entities/authErrors.js";
import {
  fechasTurnoInvalidas,
  turnoInexistente,
  turnoNoCancelable,
} from "../../src/entities/turnoErrors.js";
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
      return { semana: null, turnos: [TURNO] };
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

// GET /calendario

const CALENDARIO = { semana: { desde: "2026-11-16", hasta: "2026-11-22" }, turnos: [TURNO] };

function controladorDeCalendario() {
  const llamadas = [];
  const controlador = crearTurnoController({
    obtenerCalendario: async (consulta, usuario) => {
      llamadas.push({ consulta, usuario });
      return CALENDARIO;
    },
  });

  return { controlador, llamadas };
}

test("el calendario exige sesion", async () => {
  const { controlador, llamadas } = controladorDeCalendario();

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(`${url}/calendario?semana=2026-11-16`);
    assert.equal(respuesta.status, 401);
  });

  assert.equal(llamadas.length, 0);
});

test("el calendario es solo para voluntarios", async () => {
  const { controlador } = controladorDeCalendario();

  await conServidor(controlador, async (url) => {
    for (const rol of ROLES_QUE_SOLO_CONSULTAN) {
      const respuesta = await pedir(`${url}/calendario?semana=2026-11-16`, { rol });
      assert.equal(respuesta.status, 200, rol);
    }

    for (const rol of [...ROLES_QUE_GESTIONAN, ...ROLES_SIN_ACCESO]) {
      const respuesta = await pedir(`${url}/calendario?semana=2026-11-16`, { rol });
      assert.equal(respuesta.status, 403, rol);
    }
  });
});

test("el calendario responde la semana y pasa la consulta y la cuenta al servicio", async () => {
  const { controlador, llamadas } = controladorDeCalendario();

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(`${url}/calendario?semana=2026-11-16`, { rol: "VOLUNTARIO" });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.message, "Calendario obtenido correctamente");
    assert.deepEqual(cuerpo.semana, CALENDARIO.semana);
    assert.deepEqual(cuerpo.turnos, [TURNO]);
  });

  assert.deepEqual(llamadas[0].consulta, { semana: "2026-11-16" });
  assert.equal(llamadas[0].usuario.id, 5);
});

test("el calendario responde 400 si la semana falta, no es lunes o trae campos extra", async () => {
  const { controlador, llamadas } = controladorDeCalendario();

  await conServidor(controlador, async (url) => {
    for (const consulta of ["", "?semana=2026-11-17", "?semana=16-11-2026", "?semana=2026-11-16&voluntarioId=3"]) {
      const respuesta = await pedir(`${url}/calendario${consulta}`, { rol: "VOLUNTARIO" });
      assert.equal(respuesta.status, 400, consulta);
      assert.equal((await respuesta.json()).code, "DATOS_INVALIDOS", consulta);
    }
  });

  assert.equal(llamadas.length, 0, "no debe llegar al servicio");
});

// GET /gestion?semana= y GET /:id/inscritos

test("la gestion con semana responde la semana y pasa la consulta al servicio", async () => {
  const consultas = [];
  const semana = { desde: "2026-11-09", hasta: "2026-11-15" };
  const controlador = crearTurnoController({
    obtenerGestion: async (consulta) => {
      consultas.push(consulta);
      return { semana, turnos: [TURNO] };
    },
  });

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(`${url}/gestion?semana=2026-11-09`, { rol: "ENCARGADA_VOLUNTARIADO" });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.deepEqual(cuerpo.semana, semana);
    assert.deepEqual(cuerpo.turnos, [TURNO]);

    const martes = await pedir(`${url}/gestion?semana=2026-11-10`, { rol: "DIRECTORA" });
    assert.equal(martes.status, 400);
  });

  assert.deepEqual(consultas, [{ semana: "2026-11-09" }]);
});

test("solo la directora y la encargada de voluntariado ven los inscritos de un turno", async () => {
  const pedidos = [];
  const controlador = crearTurnoController({
    obtenerInscritos: async (parametros) => {
      pedidos.push(parametros);
      return { turno: TURNO, inscripciones: [] };
    },
  });

  await conServidor(controlador, async (url) => {
    assert.equal((await pedir(`${url}/1/inscritos`)).status, 401);

    for (const rol of ROLES_QUE_GESTIONAN) {
      const respuesta = await pedir(`${url}/1/inscritos`, { rol });
      const cuerpo = await respuesta.json();

      assert.equal(respuesta.status, 200, rol);
      assert.equal(cuerpo.message, "Inscritos obtenidos correctamente");
      assert.deepEqual(cuerpo.turno, TURNO);
      assert.deepEqual(cuerpo.inscripciones, []);
    }

    for (const rol of [...ROLES_QUE_SOLO_CONSULTAN, ...ROLES_SIN_ACCESO]) {
      assert.equal((await pedir(`${url}/1/inscritos`, { rol })).status, 403, rol);
    }

    assert.equal((await pedir(`${url}/abc/inscritos`, { rol: "DIRECTORA" })).status, 400);
  });

  assert.deepEqual(pedidos[0], { id: 1 }, "el id llega convertido a numero");
});

test("ver inscritos de un turno que no existe responde 404", async () => {
  const controlador = crearTurnoController({
    obtenerInscritos: async ({ id }) => {
      throw turnoInexistente(id);
    },
  });

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(`${url}/99/inscritos`, { rol: "DIRECTORA" });

    assert.equal(respuesta.status, 404);
    assert.equal((await respuesta.json()).code, "TURNO_INEXISTENTE");
  });
});

// PATCH /:id/cancelacion

function controladorDeCancelacion() {
  const llamadas = [];
  const controlador = crearTurnoController({
    cancelarTurnoServicio: async (parametros, cuerpo, usuario) => {
      llamadas.push({ parametros, cuerpo, usuario });
      return { turno: { ...TURNO, estado: "CANCELADO" }, inscripciones: [{ id: 1 }, { id: 2 }] };
    },
  });

  return { controlador, llamadas };
}

test("solo la directora y la encargada de voluntariado cancelan un turno", async () => {
  const { controlador, llamadas } = controladorDeCancelacion();
  const cuerpo = { motivo: "Lluvia" };

  await conServidor(controlador, async (url) => {
    assert.equal((await pedir(`${url}/1/cancelacion`, { metodo: "PATCH", cuerpo })).status, 401);

    for (const rol of [...ROLES_QUE_SOLO_CONSULTAN, ...ROLES_SIN_ACCESO]) {
      assert.equal((await pedir(`${url}/1/cancelacion`, { metodo: "PATCH", rol, cuerpo })).status, 403, rol);
    }

    for (const rol of ROLES_QUE_GESTIONAN) {
      const respuesta = await pedir(`${url}/1/cancelacion`, { metodo: "PATCH", rol, cuerpo });
      const datos = await respuesta.json();

      assert.equal(respuesta.status, 200, rol);
      assert.equal(datos.message, "Turno cancelado correctamente");
      assert.equal(datos.turno.estado, "CANCELADO");
      assert.equal(datos.inscripcionesCanceladas, 2);
    }
  });

  assert.equal(llamadas.length, ROLES_QUE_GESTIONAN.length);
  assert.deepEqual(llamadas[0].parametros, { id: 1 });
  assert.deepEqual(llamadas[0].cuerpo, { motivo: "Lluvia" });
  assert.equal(llamadas[0].usuario.id, 5);
});

test("cancelar un turno responde 400 sin motivo o con un id invalido", async () => {
  const { controlador, llamadas } = controladorDeCancelacion();

  await conServidor(controlador, async (url) => {
    for (const [ruta, cuerpo] of [
      ["/1/cancelacion", {}],
      ["/1/cancelacion", { motivo: "  " }],
      ["/1/cancelacion", { motivo: "Lluvia", estado: "PUBLICADO" }],
      ["/abc/cancelacion", { motivo: "Lluvia" }],
    ]) {
      const respuesta = await pedir(`${url}${ruta}`, { metodo: "PATCH", rol: "DIRECTORA", cuerpo });
      assert.equal(respuesta.status, 400, `${ruta} ${JSON.stringify(cuerpo)}`);
    }
  });

  assert.equal(llamadas.length, 0, "no debe llegar al servicio");
});

test("cancelar un turno que no se puede cancelar responde 409 con su motivo", async () => {
  const controlador = crearTurnoController({
    cancelarTurnoServicio: async () => {
      throw turnoNoCancelable("Este turno ya comenzo y no se puede cancelar");
    },
  });

  await conServidor(controlador, async (url) => {
    const respuesta = await pedir(`${url}/1/cancelacion`, {
      metodo: "PATCH",
      rol: "DIRECTORA",
      cuerpo: { motivo: "Lluvia" },
    });
    const datos = await respuesta.json();

    assert.equal(respuesta.status, 409);
    assert.equal(datos.code, "TURNO_NO_CANCELABLE");
    assert.equal(datos.message, "Este turno ya comenzo y no se puede cancelar");
  });
});
