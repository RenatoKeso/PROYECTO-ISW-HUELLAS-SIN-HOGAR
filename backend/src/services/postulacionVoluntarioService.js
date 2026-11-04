import { ejecutarEnTransaccion } from "../config/prisma.js";
import {
  buscarVoluntarioPorEmail,
  buscarPostulacionVigente,
  crearPostulacionVoluntario,
  listarPostulacionesVoluntario,
  buscarPostulacionVoluntarioPorId,
  crearVoluntario,
  marcarPostulacionRevisada,
  buscarActividadVoluntario,
  volverARevision,
  eliminarVoluntario,
} from "../repositories/postulacionVoluntarioRepository.js";
import {
  yaEsVoluntario,
  postulacionEnRevision,
  postulacionVoluntarioNoEncontrada,
  postulacionYaRevisada,
  postulacionSinRevisar,
  voluntarioConActividad,
} from "../entities/postulacionVoluntarioErrors.js";

const DEPENDENCIAS_POR_DEFECTO = {
  buscarVoluntarioPorEmail,
  buscarPostulacionVigente,
  crearPostulacionVoluntario,
  buscarPostulacionVoluntarioPorId,
  crearVoluntario,
  marcarPostulacionRevisada,
  buscarActividadVoluntario,
  volverARevision,
  eliminarVoluntario,
  ejecutarEnTransaccion,
};

export async function postularComoVoluntario(datos, dependencias = DEPENDENCIAS_POR_DEFECTO) {
  const { buscarVoluntarioPorEmail, buscarPostulacionVigente, crearPostulacionVoluntario } =
    dependencias;

  const voluntario = await buscarVoluntarioPorEmail(datos.email);

  if (voluntario) throw yaEsVoluntario();

  const vigente = await buscarPostulacionVigente(datos.rut, datos.email);

  if (vigente && vigente.estado === "ACEPTADA") throw yaEsVoluntario();
  if (vigente) throw postulacionEnRevision();

  const otraHabilidad = datos.habilidades.includes("OTRA") ? datos.otraHabilidad : null;

  return crearPostulacionVoluntario({ ...datos, otraHabilidad });
}

export async function obtenerPostulacionesVoluntario(estado) {
  return listarPostulacionesVoluntario(estado);
}

export async function revisarPostulacionVoluntario(
  { postulacionId, decision, motivoRechazo, revisadaPorId },
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const {
    buscarPostulacionVoluntarioPorId,
    buscarVoluntarioPorEmail,
    crearVoluntario,
    marcarPostulacionRevisada,
    ejecutarEnTransaccion,
  } = dependencias;

  const postulacion = await buscarPostulacionVoluntarioPorId(postulacionId);

  if (!postulacion) throw postulacionVoluntarioNoEncontrada(postulacionId);
  if (postulacion.estado !== "EN_REVISION") throw postulacionYaRevisada();

  const revision = { fechaRevision: new Date(), revisadaPorId };

  if (decision === "RECHAZADA") {
    const cambiadas = await marcarPostulacionRevisada(postulacionId, {
      ...revision,
      estado: "RECHAZADA",
      motivoRechazo,
    });

    if (cambiadas === 0) throw postulacionYaRevisada();

    return buscarPostulacionVoluntarioPorId(postulacionId);
  }

  const existente = await buscarVoluntarioPorEmail(postulacion.email);

  if (existente) throw yaEsVoluntario();

  await ejecutarEnTransaccion(async (cliente) => {
    const voluntario = await crearVoluntario(
      { nombre: postulacion.nombre, email: postulacion.email, telefono: postulacion.telefono },
      cliente,
    );

    const cambiadas = await marcarPostulacionRevisada(
      postulacionId,
      { ...revision, estado: "ACEPTADA", voluntarioId: voluntario.id },
      cliente,
    );

    if (cambiadas === 0) throw postulacionYaRevisada();
  });

  return buscarPostulacionVoluntarioPorId(postulacionId);
}

export async function deshacerRevisionPostulacionVoluntario(
  postulacionId,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const {
    buscarPostulacionVoluntarioPorId,
    buscarActividadVoluntario,
    volverARevision,
    eliminarVoluntario,
    ejecutarEnTransaccion,
  } = dependencias;

  const postulacion = await buscarPostulacionVoluntarioPorId(postulacionId);

  if (!postulacion) throw postulacionVoluntarioNoEncontrada(postulacionId);
  if (postulacion.estado === "EN_REVISION") throw postulacionSinRevisar();

  const voluntario = postulacion.voluntarioId
    ? await buscarActividadVoluntario(postulacion.voluntarioId)
    : null;

  if (voluntario) {
    const actividad = Object.values(voluntario._count).some((cantidad) => cantidad > 0);

    if (voluntario.usuario || actividad) throw voluntarioConActividad();
  }


  await ejecutarEnTransaccion(async (cliente) => {
    const cambiadas = await volverARevision(postulacionId, postulacion.estado, cliente);

    if (cambiadas === 0) throw postulacionYaRevisada();

    if (voluntario) await eliminarVoluntario(voluntario.id, cliente);
  });

  return buscarPostulacionVoluntarioPorId(postulacionId);
}
