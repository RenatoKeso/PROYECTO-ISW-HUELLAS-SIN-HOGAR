import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { crearRegistroMedicoRouter } from "../../src/routes/registroMedicoRoutes.js";
import { crearRegistroMedicoController } from "../../src/controllers/registroMedicoController.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";
import { AuthError } from "../../src/entities/authErrors.js";
import { rolInsuficiente } from "../../src/entities/registroMedicoErrors.js";

const voluntaria = { id: 3, nombre: "Voluntaria", rol: "VOLUNTARIO", activo: true };

const revisionValida = {
  pesoKg: 12.4,
  clasificacionSalud: "ENFERMO",
  observacionInicial: "Tos persistente y baja de apetito",
  requiereCuarentena: true,
};

const revisionFinalValida = {
  pesoRevalidadoKg: 13.2,
  condiciones: "Condición estable",
  adoptabilidad: "ADOPTABLE",
};

function autenticarFalso(request, response, next) {
  const cabecera = request.get("Authorization") ?? "";
  const coincidencia = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(cabecera);

  if (!coincidencia || coincidencia[1] !== "valido") {
    return next(new AuthError("Debes iniciar sesión"));
  }

  request.usuario = voluntaria;
  next();
}

async function levantarApp(
  completarRevisionInicialRegistro,
  realizarRevisionFinalRegistro,
  actualizarRevisionInicialRegistro,
  controladoresExtra = {},
) {
  const app = express();
  app.use(express.json());

  const controlador = crearRegistroMedicoController({
    completarRevisionInicialRegistro,
    realizarRevisionFinalRegistro,
    actualizarRevisionInicialRegistro,
    ...controladoresExtra,
  });

  app.use(
    "/registros-medicos",
    crearRegistroMedicoRouter({
      controlador,
      autenticar: autenticarFalso,
    }),
  );

  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");

  return {
    url: `http://127.0.0.1:${servidor.address().port}/registros-medicos`,
    cerrar: () =>
      new Promise((resolve, reject) => {
        servidor.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

test("la revision inicial exige un token valido", async () => {
  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  });

  try {
    const respuesta = await fetch(`${url}/14/revision-inicial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(revisionValida),
    });

    assert.equal(respuesta.status, 401);
    assert.equal((await respuesta.json()).code, "SESION_INVALIDA");
  } finally {
    await cerrar();
  }
});

test("un body invalido responde 400 sin llamar al servicio", async () => {
  let llamadas = 0;

  const { url, cerrar } = await levantarApp(async () => {
    llamadas += 1;
  });

  try {
    const respuesta = await fetch(`${url}/14/revision-inicial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify({ ...revisionValida, pesoKg: 0 }),
    });

    assert.equal(respuesta.status, 400);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.code, "DATOS_INVALIDOS");
    assert.equal(llamadas, 0);
  } finally {
    await cerrar();
  }
});

test("un identificador invalido en la ruta responde 400", async () => {
  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  });

  try {
    const respuesta = await fetch(`${url}/abc/revision-inicial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify(revisionValida),
    });

    assert.equal(respuesta.status, 400);
  } finally {
    await cerrar();
  }
});

test("el service recibe el id, los datos validados y el actor", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp(async (datos) => {
    recibido = datos;

    return {
      id: 14,
      estadoValidacion: "VALIDACION_PENDIENTE",
      pesoKg: 12.4,
      clasificacionSalud: "ENFERMO",
      prioridadAtencion: 2,
    };
  });

  try {
    const respuesta = await fetch(`${url}/14/revision-inicial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify(revisionValida),
    });

    assert.equal(respuesta.status, 200);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.message, "Revisión inicial registrada correctamente");
    assert.equal(cuerpo.registroMedico.prioridadAtencion, 2);

    assert.deepEqual(recibido, {
      registroMedicoId: 14,
      datos: revisionValida,
      actor: voluntaria,
    });
  } finally {
    await cerrar();
  }
});

test("un rol sin permiso responde 403 con el codigo del dominio", async () => {
  const { url, cerrar } = await levantarApp(async () => {
    throw rolInsuficiente();
  });

  try {
    const respuesta = await fetch(`${url}/14/revision-inicial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify(revisionValida),
    });

    assert.equal(respuesta.status, 403);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.code, "ROL_INSUFICIENTE");
  } finally {
    await cerrar();
  }
});

// ---------------------------------------------------------------------------
// r4: revision final
// ---------------------------------------------------------------------------

test("la revision final exige un token valido", async () => {
  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/validacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(revisionFinalValida),
    });

    assert.equal(respuesta.status, 401);
  } finally {
    await cerrar();
  }
});

test("un body invalido de revision final responde 400 sin llamar al servicio", async () => {
  let llamadas = 0;

  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      llamadas += 1;
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/validacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify({
        ...revisionFinalValida,
        pesoRevalidadoKg: 100.01,
      }),
    });

    assert.equal(respuesta.status, 400);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.code, "DATOS_INVALIDOS");
    assert.equal(llamadas, 0);
  } finally {
    await cerrar();
  }
});

test("la revision final recibe el id, los datos validados y el actor", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async (datos) => {
      recibido = datos;

      return {
        revisionFinal: { id: 8, peso: 13.2 },
        ficha: { id: 39, estadoAdopcion: "ADOPTABLE" },
        registroMedico: { id: 14, estadoValidacion: "REALIZADO" },
      };
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/validacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify(revisionFinalValida),
    });

    assert.equal(respuesta.status, 200);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.message, "Revisión final registrada correctamente");
    assert.equal(cuerpo.revisionFinal.id, 8);

    assert.deepEqual(recibido, {
      registroMedicoId: 14,
      datos: revisionFinalValida,
      actor: voluntaria,
    });
  } finally {
    await cerrar();
  }
});

test("un rol sin permiso en revision final responde 403 con el codigo del dominio", async () => {
  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw rolInsuficiente();
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/validacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify(revisionFinalValida),
    });

    assert.equal(respuesta.status, 403);

    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.code, "ROL_INSUFICIENTE");
  } finally {
    await cerrar();
  }
});

// ---------------------------------------------------------------------------
// r5: actualizacion de revision inicial
// ---------------------------------------------------------------------------

test("la actualizacion de revision inicial exige un token valido", async () => {
  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/revision-inicial`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(revisionValida),
    });

    assert.equal(respuesta.status, 401);
  } finally {
    await cerrar();
  }
});

test("un body invalido de actualizacion responde 400 sin llamar al servicio", async () => {
  let llamadas = 0;

  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      llamadas += 1;
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/revision-inicial`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify({ ...revisionValida, observacionInicial: "" }),
    });

    assert.equal(respuesta.status, 400);
    assert.equal((await respuesta.json()).code, "DATOS_INVALIDOS");
    assert.equal(llamadas, 0);
  } finally {
    await cerrar();
  }
});

test("la actualizacion recibe id, datos validados y actor", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async (datos) => {
      recibido = datos;

      return {
        registroMedico: {
          id: 14,
          estadoValidacion: "VALIDACION_PENDIENTE",
          fechaActualizacion: "2026-10-14T18:30:00.000Z",
        },
        auditoria: [],
        sinCambios: true,
        revisadoNuevamente: false,
      };
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/revision-inicial`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify(revisionValida),
    });

    assert.equal(respuesta.status, 200);

    const cuerpo = await respuesta.json();
    assert.equal(
      cuerpo.message,
      "Revisión inicial actualizada correctamente",
    );
    assert.equal(cuerpo.sinCambios, true);

    assert.deepEqual(recibido, {
      registroMedicoId: 14,
      datos: revisionValida,
      actor: voluntaria,
    });
  } finally {
    await cerrar();
  }
});

test("un segundo intento de actualizacion responde 409", async () => {
  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      const { actualizacionYaRealizada } = await import(
        "../../src/entities/registroMedicoErrors.js"
      );
      throw actualizacionYaRealizada();
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/revision-inicial`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify(revisionValida),
    });

    assert.equal(respuesta.status, 409);
    assert.equal(
      (await respuesta.json()).code,
      "ACTUALIZACION_YA_REALIZADA",
    );
  } finally {
    await cerrar();
  }
});

// ---------------------------------------------------------------------------
// r6: actualizaciones veterinarias y seguimientos
// ---------------------------------------------------------------------------

const actualizacionValida = {
  observacionSeguimiento: "Evoluciona favorablemente",
  evolucionEstadoSalud: "MEJORANDO",
  necesidades: "Dieta blanda",
};

test("las rutas de actualizaciones veterinarias exigen un token valido", async () => {
  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    {
      iniciarActualizacionRegistroMedico: async () => {
        throw new Error("no deberia llamarse");
      },
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/actualizaciones/inicio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    assert.equal(respuesta.status, 401);
  } finally {
    await cerrar();
  }
});

test("actualizar un registro valida el body y reenvia id, datos y actor", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    {
      actualizarRegistroMedico: async (datos) => {
        recibido = datos;
        return {
          registroMedico: { id: 14, estadoValidacion: "ACTUALIZADO" },
          version: 2,
          seguimiento: { id: 9 },
        };
      },
    },
  );

  try {
    const invalida = await fetch(`${url}/14/actualizaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify({ evolucionEstadoSalud: "MEJORANDO" }),
    });

    assert.equal(invalida.status, 400);
    assert.equal((await invalida.json()).code, "DATOS_INVALIDOS");
    assert.equal(recibido, null);

    const respuesta = await fetch(`${url}/14/actualizaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valido",
      },
      body: JSON.stringify(actualizacionValida),
    });

    assert.equal(respuesta.status, 200);
    assert.equal(recibido.registroMedicoId, 14);
    assert.deepEqual(recibido.datos, actualizacionValida);
    assert.deepEqual(recibido.actor, voluntaria);
    assert.equal(
      (await respuesta.json()).message,
      "Registro médico actualizado correctamente",
    );
  } finally {
    await cerrar();
  }
});

test("iniciar y cancelar una actualizacion llaman al servicio con el actor", async () => {
  const recibidas = [];

  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    {
      iniciarActualizacionRegistroMedico: async (datos) => {
        recibidas.push({ accion: "iniciar", datos });
        return {
          registroMedico: { id: 14, estadoValidacion: "REVISANDO" },
        };
      },
      cancelarActualizacionRegistroMedico: async (datos) => {
        recibidas.push({ accion: "cancelar", datos });
        return {
          registroMedico: { id: 14, estadoValidacion: "REALIZADO" },
        };
      },
    },
  );

  try {
    const inicio = await fetch(`${url}/14/actualizaciones/inicio`, {
      method: "POST",
      headers: { Authorization: "Bearer valido" },
    });
    const cancelacion = await fetch(
      `${url}/14/actualizaciones/cancelar`,
      {
        method: "POST",
        headers: { Authorization: "Bearer valido" },
      },
    );

    assert.equal(inicio.status, 200);
    assert.equal(cancelacion.status, 200);
    assert.deepEqual(
      recibidas.map(({ accion }) => accion),
      ["iniciar", "cancelar"],
    );
    assert.deepEqual(recibidas[0].datos, {
      registroMedicoId: 14,
      actor: voluntaria,
    });
  } finally {
    await cerrar();
  }
});

test("consultar historial y seguimientos devuelve las listas del servicio", async () => {
  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    {
      listarHistorialRegistroMedico: async () => [
        { version: 2, peso: 13.1 },
      ],
      listarSeguimientosRegistroMedico: async () => [
        { id: 4, peso: 13.1 },
      ],
    },
  );

  try {
    const historial = await fetch(`${url}/14/historial`, {
      headers: { Authorization: "Bearer valido" },
    });
    const seguimientos = await fetch(`${url}/14/seguimientos`, {
      headers: { Authorization: "Bearer valido" },
    });

    assert.equal(historial.status, 200);
    assert.equal(seguimientos.status, 200);
    assert.equal((await historial.json()).historial[0].version, 2);
    assert.equal((await seguimientos.json()).seguimientos[0].id, 4);
  } finally {
    await cerrar();
  }
});

test("un rol sin permiso en actualizaciones responde 403", async () => {
  const { url, cerrar } = await levantarApp(
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    async () => {
      throw new Error("no deberia llamarse");
    },
    {
      iniciarActualizacionRegistroMedico: async () => {
        throw rolInsuficiente();
      },
    },
  );

  try {
    const respuesta = await fetch(`${url}/14/actualizaciones/inicio`, {
      method: "POST",
      headers: { Authorization: "Bearer valido" },
    });

    assert.equal(respuesta.status, 403);
    assert.equal((await respuesta.json()).code, "ROL_INSUFICIENTE");
  } finally {
    await cerrar();
  }
});

// ---------------------------------------------------------------------------
// r7: lectura de registros medicos
// ---------------------------------------------------------------------------

test("GET /registros-medicos exige un token valido", async () => {
  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  });

  try {
    const respuesta = await fetch(`${url}`);
    assert.equal(respuesta.status, 401);
  } finally {
    await cerrar();
  }
});

test("GET /registros-medicos valida el filtro de estado", async () => {
  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, {
    listarRegistrosMedicos: async () => [],
  });

  try {
    const respuesta = await fetch(`${url}?estado=INVALIDO`, {
      headers: { Authorization: "Bearer valido" },
    });
    assert.equal(respuesta.status, 400);
  } finally {
    await cerrar();
  }
});

test("GET /registros-medicos reenvia el filtro validado y el actor", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, {
    listarRegistrosMedicos: async (datos) => {
      recibido = datos;
      return [{ id: 1, estadoValidacion: "PROVISIONAL" }];
    },
  });

  try {
    const respuesta = await fetch(`${url}?estado=PROVISIONAL`, {
      headers: { Authorization: "Bearer valido" },
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.message, "Registros médicos obtenidos correctamente");
    assert.equal(cuerpo.registros.length, 1);
    assert.deepEqual(recibido, {
      estado: "PROVISIONAL",
      actor: voluntaria,
    });
  } finally {
    await cerrar();
  }
});

test("GET /registros-medicos/:id exige un token valido", async () => {
  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  });

  try {
    const respuesta = await fetch(`${url}/14`);
    assert.equal(respuesta.status, 401);
  } finally {
    await cerrar();
  }
});

test("GET /registros-medicos/:id valida el identificador", async () => {
  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, {
    obtenerRegistroMedico: async () => {
      throw new Error("no deberia llamarse");
    },
  });

  try {
    const respuesta = await fetch(`${url}/abc`, {
      headers: { Authorization: "Bearer valido" },
    });
    assert.equal(respuesta.status, 400);
  } finally {
    await cerrar();
  }
});

test("GET /registros-medicos/:id reenvia el id y el actor", async () => {
  let recibido = null;

  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, {
    obtenerRegistroMedico: async (datos) => {
      recibido = datos;
      return { id: 14, estadoValidacion: "PROVISIONAL" };
    },
  });

  try {
    const respuesta = await fetch(`${url}/14`, {
      headers: { Authorization: "Bearer valido" },
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.message, "Registro médico obtenido correctamente");
    assert.equal(cuerpo.registro.id, 14);
    assert.deepEqual(recibido, {
      registroMedicoId: 14,
      actor: voluntaria,
    });
  } finally {
    await cerrar();
  }
});

test("GET /registros-medicos/:id traduce registro inexistente a 404", async () => {
  const { registroMedicoInexistente } = await import("../../src/entities/registroMedicoErrors.js");

  const { url, cerrar } = await levantarApp(async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, async () => {
    throw new Error("no deberia llamarse");
  }, {
    obtenerRegistroMedico: async () => {
      throw registroMedicoInexistente(999);
    },
  });

  try {
    const respuesta = await fetch(`${url}/999`, {
      headers: { Authorization: "Bearer valido" },
    });
    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 404);
    assert.equal(cuerpo.code, "REGISTRO_MEDICO_INEXISTENTE");
  } finally {
    await cerrar();
  }
});
