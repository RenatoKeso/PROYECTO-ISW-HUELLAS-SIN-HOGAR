import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { crearDonacionRouter } from "../../src/routes/donacionRoutes.js";
import { crearAutenticacion } from "../../src/middlewares/autenticarUsuario.js";
import { manejadorErrores } from "../../src/handlers/manejadorErrores.js";
import { ROLES_USUARIO } from "../../src/services/permisosUsuario.js";

test(
  "registro público, comprobante privado y eliminación bloqueada",
  async () => {
    const folio =
      "f55849b2-8f65-4a04-9191-cbcebf72d0e4";

    const app = express();
    app.use(express.json());

    app.use(
      "/donaciones",
      crearDonacionRouter({
        autenticar: crearAutenticacion({
          autenticar: async (rol) => ({
            id: 1,
            rol,
            activo: true,
          }),
        }),

        servicio: {
          registrar: async () => ({
            folio,
            estado: "PENDIENTE",
          }),

          animales: async () => ({
            animales: [],
            hayMas: false,
          }),

          listar: async () => ({
            donaciones: [],
            totalConfirmado: "0",
          }),

          revisar: async () => ({
            folio,
            estado: "CONFIRMADA",
          }),

          comprobante: async () =>
            Buffer.from(
              "%PDF-1.4\n%%EOF"
            ),
        },
      })
    );

    app.use(manejadorErrores);

    const servidor = app.listen(
      0,
      "127.0.0.1"
    );

    await once(servidor, "listening");

    async function solicitar(
      ruta,
      method,
      rol
    ) {
      return fetch(
        `http://127.0.0.1:${servidor.address().port}/donaciones${ruta}`,
        {
          method,
          headers: {
            Connection: "close",
            ...(rol
              ? {
                  Authorization:
                    `Bearer ${rol}`,
                }
              : {}),
          },
        }
      );
    }

    try {
      assert.equal(
        (
          await solicitar("", "POST")
        ).status,
        201
      );

      assert.equal(
        (
          await solicitar(
            "/animales",
            "GET"
          )
        ).status,
        200
      );

      const rutasPrivadas = [
        ["", "GET"],
        [`/${folio}/comprobante`, "GET"],
        [`/${folio}/revision`, "PATCH"],
        [`/${folio}`, "DELETE"],
      ];

      for (
        const [ruta, metodo]
        of rutasPrivadas
      ) {
        assert.equal(
          (
            await solicitar(
              ruta,
              metodo
            )
          ).status,
          401
        );

        for (
          const rol of ROLES_USUARIO.filter(
            (rol) => rol !== "DIRECTORA"
          )
        ) {
          assert.equal(
            (
              await solicitar(
                ruta,
                metodo,
                rol
              )
            ).status,
            403
          );
        }
      }

      const archivo =
        await solicitar(
          `/${folio}/comprobante`,
          "GET",
          "DIRECTORA"
        );

      assert.equal(archivo.status, 200);

      assert.equal(
        archivo.headers.get(
          "content-type"
        ),
        "application/pdf"
      );

      assert.equal(
        archivo.headers.get(
          "cache-control"
        ),
        "private, no-store"
      );

      assert.equal(
        (
          await solicitar(
            `/${folio}`,
            "DELETE",
            "DIRECTORA"
          )
        ).status,
        405
      );
    } finally {
      await new Promise(
        (resolve, reject) => {
          servidor.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        }
      );
    }
  }
);