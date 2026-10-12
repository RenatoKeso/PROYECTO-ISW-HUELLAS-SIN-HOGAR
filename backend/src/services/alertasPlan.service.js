import { z } from "zod";
import {consultaAlertasSchema,} from "../validations/consultaAlertasValidation.js";
import {obtenerFechaActual,} from "./alertasSanitarias.service.js";
import {buscarAtencionesPendientes,} from "../repositories/atencionSanitariaRepository.js";

const DIA_MS = 86400000;

export async function obtenerAlertasPlan(
  consulta,
  {
    buscar = buscarAtencionesPendientes,
    ahora = new Date(),
  } = {}
) {
  const filtros = consultaAlertasSchema.parse(consulta);

  const fechaReferencia =
    filtros.fechaReferencia ?? obtenerFechaActual(ahora);

  const referencia = new Date(
    `${fechaReferencia}T00:00:00.000Z`
  );

  const fechaLimite = new Date(
    referencia.getTime() + filtros.diasAnticipacion * DIA_MS
  );

  z.date({
    message: "La anticipacion produce una fecha fuera de rango",
  }).parse(fechaLimite);

  // Consulta los datos vigentes en cada solicitud.
  const atenciones = await buscar({ fechaLimite });

  const alertas = atenciones.map((atencion) => {
    const diasRestantes = Math.round(
      (
        atencion.fechaProgramada.getTime() -
        referencia.getTime()
      ) / DIA_MS
    );

    return {
      atencionId: atencion.id,
      animalId: atencion.fichaAnimalId,
      codigoAnimal: atencion.fichaAnimal.codigoAnimal,
      nombreAnimal: atencion.fichaAnimal.nombre,
      tipo: atencion.tipo,

      fechaProgramada: atencion.fechaProgramada
        .toISOString()
        .slice(0, 10),

      estado: diasRestantes < 0 ? "vencido" : "proximo",
      diasRestantes,
    };
  });

  alertas.sort(
    (a, b) =>
      a.diasRestantes - b.diasRestantes ||
      a.atencionId - b.atencionId
  );

  return {
    fechaReferencia,
    diasAnticipacion: filtros.diasAnticipacion,
    alertas,
  };
}