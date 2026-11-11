import {
  actualizarRegistro,
  actualizarRevisionInicial,
  cancelarActualizacionRegistro,
  completarRevisionInicial,
  iniciarActualizacionRegistro,
  listarHistorialRegistroMedico as listarHistorialRegistroMedicoService,
  listarRegistrosMedicos as listarRegistrosMedicosService,
  listarSeguimientosRegistroMedico as listarSeguimientosRegistroMedicoService,
  obtenerRegistroMedico as obtenerRegistroMedicoService,
  realizarRevisionFinal,
} from "../services/registroMedicoService.js";
import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";

const MENSAJE_REVISION_INICIAL = "Revisión inicial registrada correctamente";
const MENSAJE_REVISION_FINAL = "Revisión final registrada correctamente";
const MENSAJE_ACTUALIZACION_REVISION_INICIAL =
  "Revisión inicial actualizada correctamente";
const MENSAJE_INICIO_ACTUALIZACION =
  "Actualización veterinaria iniciada correctamente";
const MENSAJE_ACTUALIZACION_VETERINARIA =
  "Registro médico actualizado correctamente";
const MENSAJE_CANCELACION_ACTUALIZACION =
  "Actualización veterinaria cancelada correctamente";
const MENSAJE_HISTORIAL = "Historial médico obtenido correctamente";
const MENSAJE_SEGUIMIENTOS = "Seguimientos médicos obtenidos correctamente";

export function crearRegistroMedicoController({
  completarRevisionInicialRegistro = completarRevisionInicial,
  realizarRevisionFinalRegistro = realizarRevisionFinal,
  actualizarRevisionInicialRegistro = actualizarRevisionInicial,
  iniciarActualizacionRegistroMedico = iniciarActualizacionRegistro,
  actualizarRegistroMedico = actualizarRegistro,
  cancelarActualizacionRegistroMedico = cancelarActualizacionRegistro,
  listarHistorialRegistroMedico = listarHistorialRegistroMedicoService,
  listarRegistrosMedicos = listarRegistrosMedicosService,
  listarSeguimientosRegistroMedico = listarSeguimientosRegistroMedicoService,
  obtenerRegistroMedico = obtenerRegistroMedicoService,
} = {}) {
  return {
    async completarRevisionInicial(request, response) {
      const registroMedico = await completarRevisionInicialRegistro({
        registroMedicoId: request.params.id,
        datos: request.body,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_REVISION_INICIAL,
        datos: { registroMedico },
      });
    },

    async realizarRevisionFinal(request, response) {
      const resultado = await realizarRevisionFinalRegistro({
        registroMedicoId: request.params.id,
        datos: request.body,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_REVISION_FINAL,
        datos: resultado,
      });
    },

    async actualizarRevisionInicial(request, response) {
      const resultado = await actualizarRevisionInicialRegistro({
        registroMedicoId: request.params.id,
        datos: request.body,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_ACTUALIZACION_REVISION_INICIAL,
        datos: resultado,
      });
    },

    async iniciarActualizacion(request, response) {
      const resultado = await iniciarActualizacionRegistroMedico({
        registroMedicoId: request.params.id,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_INICIO_ACTUALIZACION,
        datos: resultado,
      });
    },

    async actualizarRegistro(request, response) {
      const resultado = await actualizarRegistroMedico({
        registroMedicoId: request.params.id,
        datos: request.body,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_ACTUALIZACION_VETERINARIA,
        datos: resultado,
      });
    },

    async cancelarActualizacion(request, response) {
      const resultado = await cancelarActualizacionRegistroMedico({
        registroMedicoId: request.params.id,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_CANCELACION_ACTUALIZACION,
        datos: resultado,
      });
    },

    async listarHistorial(request, response) {
      const historial = await listarHistorialRegistroMedico({
        registroMedicoId: request.params.id,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_HISTORIAL,
        datos: { historial },
      });
    },

    async listarSeguimientos(request, response) {
      const seguimientos = await listarSeguimientosRegistroMedico({
        registroMedicoId: request.params.id,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_SEGUIMIENTOS,
        datos: { seguimientos },
      });
    },

    async listarRegistros(request, response) {
      const registros = await listarRegistrosMedicos({
        estado: request.query.estado,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: "Registros médicos obtenidos correctamente",
        datos: { registros },
      });
    },

    async obtenerRegistro(request, response) {
      const registro = await obtenerRegistroMedico({
        registroMedicoId: request.params.id,
        actor: request.usuario,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: "Registro médico obtenido correctamente",
        datos: { registro },
      });
    },
  };
}
