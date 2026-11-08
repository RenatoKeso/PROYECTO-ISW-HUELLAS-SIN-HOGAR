import {
  actualizarFicha,
  crearFicha,
  listarIngresosDeFicha,
  registrarIngreso,
} from "../services/animalService.js";
import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import { separarFichaEIngreso } from "../validations/registroIngresoValidation.js";

const MENSAJE_INGRESO = "Ingreso registrado correctamente";
const MENSAJE_REINGRESO = "Reingreso registrado correctamente";
const MENSAJE_FICHA = "Ficha creada correctamente";
const MENSAJE_FICHA_ACTUALIZADA = "Ficha actualizada correctamente";
const MENSAJE_HISTORIAL = "Historial de ingresos obtenido correctamente";
const ESTADO_INGRESO = 201;
const ESTADO_REINGRESO = 200;
const ESTADO_FICHA = 201;
const ESTADO_FICHA_ACTUALIZADA = 200;

function construirRegistroMedico(registroMedico) {
  if (!registroMedico) return undefined;

  return {
    id: registroMedico.id,
    estadoValidacion: registroMedico.estadoValidacion,
    createdAt: registroMedico.createdAt,
  };
}

function construirIngresoPublico(ingreso) {
  return {
    id: ingreso.id,
    fechaIngreso: ingreso.fechaIngreso,
    procedencia: ingreso.procedencia,
    ubicacionEncontrado: ingreso.ubicacionEncontrado,
    estadoSalud: ingreso.estadoSalud,
    receptor: ingreso.receptor
      ? {
          id: ingreso.receptor.id,
          nombre: ingreso.receptor.nombre,
        }
      : undefined,
  };
}

export function crearAnimalController({
  registrarIngresoAnimal = registrarIngreso,
  crearFichaAnimal = crearFicha,
  actualizarFichaAnimal = actualizarFicha,
  listarIngresosAnimal = listarIngresosDeFicha,
} = {}) {
  return {
    async registrarIngreso(request, response) {
      const { ficha, ingreso } = separarFichaEIngreso(request.body);
      const resultado = await registrarIngresoAnimal({ ficha, ingreso });

      return enviarRespuestaExitosa(response, {
        mensaje: resultado.reingreso ? MENSAJE_REINGRESO : MENSAJE_INGRESO,
        estado: resultado.reingreso ? ESTADO_REINGRESO : ESTADO_INGRESO,
        datos: {
          codigoAnimal: resultado.ficha.codigoAnimal,
          reingreso: resultado.reingreso,
          ...(resultado.registroMedico
            ? { registroMedico: construirRegistroMedico(resultado.registroMedico) }
            : {}),
        },
      });
    },

    async listarIngresos(request, response) {
      const { ficha, ingresos } = await listarIngresosAnimal(request.params.id);

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_HISTORIAL,
        datos: {
          ficha: {
            id: ficha.id,
            codigoAnimal: ficha.codigoAnimal,
            nombre: ficha.nombre,
          },
          ingresos: ingresos.map(construirIngresoPublico),
        },
      });
    },

    async crearFicha(request, response) {
      const ficha = await crearFichaAnimal(request.body);

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_FICHA,
        estado: ESTADO_FICHA,
        datos: {
          id: ficha.id,
          codigoAnimal: ficha.codigoAnimal,
          estadoEstadia: ficha.estadoEstadia,
        },
      });
    },

    async actualizarFicha(request, response) {
      const ficha = await actualizarFichaAnimal(request.params.id, request.body);

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_FICHA_ACTUALIZADA,
        estado: ESTADO_FICHA_ACTUALIZADA,
        datos: {
          id: ficha.id,
          codigoAnimal: ficha.codigoAnimal,
          estadoEstadia: ficha.estadoEstadia,
        },
      });
    },
  };
}

export const animalController = crearAnimalController();
