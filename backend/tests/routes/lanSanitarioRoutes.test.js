import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import express from "express";
import { crearRouter } from "../../src/routes/index.js";
import { crearSaludRouter } from "../../src/routes/salud.routes.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";
import { PlanSanitarioError } from "../../src/entities/planSanitarioErrors.js";
import { ROLES_USUARIO } from "../../src/services/permisosUsuario.js";

async function conServidor(router, comprobar) {
  const app = express();

  app.use(express.json());
  app.use(router);
  app.use(manejadorErrores);

  const servidor = app.listen(0, "127.0.0.1");

  try {
    await once(servidor, "listening");

    await comprobar(
      async (
        ruta,
        metodo = "GET",
        cuerpo,
        rol
      ) => {
        const respuesta = await fetch(
          `http://127.0.0.1:${servidor.address().port}${ruta}`,
          {
            method: metodo,
            headers: {
              "Content-Type": "application/json",
              Connection: "close",
              ...(rol
                ? {
                    Authorization: `Bearer ${rol}`,
                  }
                : {}),
            },
            ...(cuerpo === undefined
              ? {}
              : {
                  body: JSON.stringify(cuerpo),
                }),
          }
        );

        return {
          status: respuesta.status,
          datos: await respuesta.json(),
        };
      }
    );
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test("las nuevas rutas del plan exigen sesion y rechazan todos los roles sin permiso sanitario", async () => {
  const router = crearRouter({
    servicioAuth: {
      autenticar: async (rol) => ({
        id: 1,
        activo: true,
        rol,
      }),
    },
  });

  await conServidor(router, async (solicitar) => {
    for (const [ruta, metodo, cuerpo] of [
      ["/salud/plan/anim-001", "GET"],
      [
        "/salud/plan/anim-001/atenciones",
        "POST",
        {
          tipo: "vacuna",
          fechaProgramada: "2026-11-02",
        },
      ],
      [
        "/salud/atenciones/1",
        "PATCH",
        {
          accion: "cancelar",
          motivoCancelacion: "Prueba",
        },
      ],
    ]) {
      assert.equal(
        (await solicitar(ruta, metodo, cuerpo)).status,
        401
      );

      for (const rol of ROLES_USUARIO.filter(
        (r) =>
          !["DIRECTORA", "VETERINARIA"].includes(r)
      )) {
        assert.equal(
          (
            await solicitar(
              ruta,
              metodo,
              cuerpo,
              rol
            )
          ).status,
          403
        );
      }
    }
  });
});

test("las rutas validan cuerpos y parametros antes de invocar al servicio", async () => {
  const llamadas = [];

  const servicioPlan = {
    consultar: async (...args) => {
      llamadas.push(args);
      return { atenciones: [] };
    },

    programar: async (...args) => {
      llamadas.push(args);
      return { id: 1 };
    },

    modificar: async (...args) => {
      llamadas.push(args);

      throw new PlanSanitarioError(
        "Atencion finalizada"
      );
    },
  };

  await conServidor(
    crearSaludRouter({ servicioPlan }),
    async (solicitar) => {
      for (const [ruta, metodo, cuerpo] of [
        ["/plan/codigo-invalido", "GET"],
        [
          "/plan/anim-001/atenciones",
          "POST",
          {
            tipo: "vacuna",
            fechaProgramada: "2026-02-30",
          },
        ],
        [
          "/atenciones/0",
          "PATCH",
          {
            accion: "cancelar",
            motivoCancelacion: "Prueba",
          },
        ],
        [
          "/atenciones/1",
          "PATCH",
          {
            accion: "cancelar",
            motivoCancelacion: " ",
          },
        ],
      ]) {
        assert.equal(
          (await solicitar(ruta, metodo, cuerpo)).status,
          400
        );
      }

      assert.equal(llamadas.length, 0);

      assert.equal(
        (await solicitar("/plan/anim-001")).status,
        200
      );

      assert.equal(
        (
          await solicitar(
            "/plan/anim-001/atenciones",
            "POST",
            {
              tipo: "esterilizacion",
              fechaProgramada: "2026-11-02",
            }
          )
        ).status,
        201
      );

      assert.equal(
        (
          await solicitar(
            "/atenciones/1",
            "PATCH",
            {
              accion: "realizar",
              fechaRealizacion: "2026-11-02",
            }
          )
        ).status,
        409
      );

      assert.equal(llamadas.length, 3);
    }
  );
});