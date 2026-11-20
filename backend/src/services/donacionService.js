import { ejecutarEnTransaccion } from "../config/prisma.js";
import * as repositorio from "../repositories/donacionRepository.js";
import { ESTADOS_EN_REFUGIO } from "../repositories/atencionSanitariaRepository.js";
import { fechaYHoraEnChile } from "./horarioChile.js";
import { DonacionError } from "../entities/donacionErrors.js";
import {
  donacionSchema,
  revisionDonacionSchema,
  filtrosDonacionSchema,
  busquedaDonacionSchema,
  LIMITE_COMPROBANTE,
} from "../validations/donacionValidation.js";

export function crearServicioDonaciones({
  repos = repositorio,
  transaccion = ejecutarEnTransaccion,
  reloj = () => new Date(),
} = {}) {
  return {
    async registrar(entrada) {
      const datos = donacionSchema.parse(entrada);

      if (
        datos.fechaAporte >
        fechaYHoraEnChile(reloj()).fecha
      ) {
        throw new DonacionError(
          "La fecha del aporte no puede ser futura"
        );
      }

      const archivo = datos.comprobanteBase64
        ? Buffer.from(
            datos.comprobanteBase64,
            "base64"
          )
        : null;

      if (
        archivo &&
        (
          archivo.length > LIMITE_COMPROBANTE ||
          archivo.subarray(0, 5).toString() !== "%PDF-" ||
          !archivo
            .subarray(-1024)
            .includes(Buffer.from("%%EOF"))
        )
      ) {
        throw new DonacionError(
          "Adjunta un comprobante PDF válido de hasta 2 MB"
        );
      }

      return transaccion(async (cliente) => {
        let animalId = null;

        if (datos.codigoAnimal) {
          const [animal] =
            await repos.bloquearAnimal(
              datos.codigoAnimal,
              cliente
            );

          if (
            !animal ||
            !ESTADOS_EN_REFUGIO.includes(
              animal.estadoEstadia
            )
          ) {
            throw new DonacionError(
              "El animal seleccionado ya no está a cargo del refugio"
            );
          }

          animalId = animal.id;
        }

        return repos.crear(
          {
            destino: datos.destino,
            animalId,
            monto: datos.monto,
            medioPago: datos.medioPago,

            fechaAporte: new Date(
              datos.fechaAporte + "T00:00:00Z"
            ),

            anonima: datos.anonima,
            nombreDonante:
              datos.nombreDonante || null,
            emailDonante:
              datos.emailDonante || null,
            telefonoDonante:
              datos.telefonoDonante || null,

            comprobante: archivo,
            comprobanteNombre:
              datos.comprobanteNombre || null,
          },
          cliente
        );
      });
    },

    async animales(entrada) {
      const { nombre, pagina } =
        busquedaDonacionSchema.parse(entrada);

      const filas = await repos.animales(
        nombre,
        pagina
      );

      return {
        animales: filas.slice(0, 6),
        hayMas: filas.length > 6,
      };
    },

    async listar(entrada) {
      const resultado = await repos.listar(
        filtrosDonacionSchema.parse(entrada)
      );

      return {
        ...resultado,

        donaciones: resultado.donaciones.map(
          (fila) => ({
            ...fila,
            monto: String(fila.monto),
            fechaAporte: fila.fechaAporte
              .toISOString()
              .slice(0, 10),
          })
        ),
      };
    },

    async revisar(folio, entrada, usuario) {
      const datos =
        revisionDonacionSchema.parse(entrada);

      if (!(await repos.buscar(folio))) {
        throw new DonacionError(
          "La donación indicada no existe",
          404,
          "DONACION_INEXISTENTE"
        );
      }

      const resultado =
        await repos.revisarPendiente(folio, {
          estado: datos.estado,
          motivoRechazo:
            datos.motivoRechazo || null,
          revisadaEn: reloj(),
          revisadaPorId: usuario.id,
        });

      if (resultado.count !== 1) {
        throw new DonacionError(
          "La donación ya fue revisada. Actualiza el listado",
          409,
          "DONACION_REVISADA"
        );
      }

      return {
        folio,
        estado: datos.estado,
      };
    },

    async comprobante(folio) {
      const fila =
        await repos.comprobante(folio);

      if (!fila?.comprobante) {
        throw new DonacionError(
          "El comprobante solicitado no existe",
          404,
          "COMPROBANTE_INEXISTENTE"
        );
      }

      return Buffer.from(fila.comprobante);
    },
  };
}

export default crearServicioDonaciones();