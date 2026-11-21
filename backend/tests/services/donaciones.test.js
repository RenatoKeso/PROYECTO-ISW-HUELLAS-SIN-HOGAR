import test from "node:test";
import assert from "node:assert/strict";
import { crearServicioDonaciones } from "../../src/services/donacionService.js";

const efectivo = {
    destino: "REFUGIO",
    monto: "10000",
    medioPago: "EFECTIVO",
    fechaAporte: "2026-11-19",
    anonima: true,
};

const pdf = Buffer.from(
    "%PDF-1.4\nPrueba\n%%EOF"
).toString("base64");

function preparar(estadoAnimal = "ACTIVO") {
    const escrituras = [];
    let estado = "PENDIENTE";

const servicio = crearServicioDonaciones({
    reloj: () =>
        new Date("2026-11-20T02:00:00Z"),

    transaccion: (operacion) => operacion({}),

    repos: {
        bloquearAnimal: async () => [
        {
        id: 1,
        estadoEstadia: estadoAnimal,
        },
    ],

    crear: async (datos) => {
        escrituras.push(datos);
        return {
            folio: "folio",
            estado: "PENDIENTE",
        };
    },

    buscar: async () => ({ estado }),

    revisarPendiente: async (folio, datos) => {
        if (estado !== "PENDIENTE") {
            return { count: 0 };
        }

        estado = datos.estado;
        escrituras.push(datos);
        return { count: 1 };
      },
    },
  });

  return { servicio, escrituras };
}

test(
  "valida dinero, fecha de Chile, anonimato y comprobante antes de escribir",
  async () => {
    const { servicio, escrituras } = preparar();

    for (const cambios of [
      { monto: 0 },
      { monto: 2.5 },
      { monto: true },
      { fechaAporte: "2026-02-30" },
      { fechaAporte: "2026-11-20" },
      {
        anonima: true,
        nombreDonante: "Nombre",
      },
      { medioPago: "TRANSFERENCIA" },
      { estado: "CONFIRMADA" },
      {
        medioPago: "TRANSFERENCIA",
        comprobanteNombre: "archivo.pdf",
        comprobanteBase64: Buffer.from(
          "texto"
        ).toString("base64"),
      },
    ]) {
      await assert.rejects(
        servicio.registrar({
          ...efectivo,
          ...cambios,
        })
      );
    }

    assert.equal(escrituras.length, 0);

    assert.deepEqual(
      await servicio.registrar(efectivo),
      {
        folio: "folio",
        estado: "PENDIENTE",
      }
    );

    assert.equal(
      escrituras[0].nombreDonante,
      null
    );

    assert.equal(
      escrituras[0].comprobante,
      null
    );
  }
);

test(
  "el apadrinamiento exige contacto, PDF y animal vigente",
  async () => {
    const datos = {
      ...efectivo,
      destino: "APADRINAMIENTO",
      codigoAnimal: "anim-001",
      anonima: false,
      nombreDonante: "Renato",
      emailDonante: "renato@example.com",
      medioPago: "TRANSFERENCIA",
      comprobanteNombre: "aporte.pdf",
      comprobanteBase64: pdf,
    };

    const { servicio, escrituras } = preparar();

    await assert.rejects(
      servicio.registrar({
        ...datos,
        emailDonante: "",
      })
    );

    for (const estado of [
      "ADOPTADO",
      "EGRESADO",
      "FALLECIDO",
      "TRANSFERIDO",
    ]) {
      const prueba = preparar(estado);

      await assert.rejects(
        prueba.servicio.registrar(datos)
      );

      assert.equal(
        prueba.escrituras.length,
        0
      );
    }

    await servicio.registrar(datos);

    assert.equal(
      escrituras[0].animalId,
      1
    );

    assert.ok(
      Buffer.isBuffer(
        escrituras[0].comprobante
      )
    );
  }
);

test(
  "solo una revisión concurrente se registra y el rechazo exige motivo",
  async () => {
    const { servicio, escrituras } = preparar();

    await assert.rejects(
      servicio.revisar(
        "folio",
        { estado: "RECHAZADA" },
        { id: 9 }
      )
    );

    const resultados =
      await Promise.allSettled([
        servicio.revisar(
          "folio",
          { estado: "CONFIRMADA" },
          { id: 9 }
        ),
        servicio.revisar(
          "folio",
          { estado: "CONFIRMADA" },
          { id: 9 }
        ),
      ]);

    assert.equal(
      resultados.filter(
        (resultado) =>
          resultado.status === "fulfilled"
      ).length,
      1
    );

    assert.equal(
      resultados.find(
        (resultado) =>
          resultado.status === "rejected"
      ).reason.estadoHttp,
      409
    );

    assert.equal(escrituras.length, 1);
    assert.equal(
      escrituras[0].revisadaPorId,
      9
    );
  }
);