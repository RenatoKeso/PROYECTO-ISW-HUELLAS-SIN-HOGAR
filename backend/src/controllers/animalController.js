import {
  actualizarFicha,
  crearFicha,
  registrarIngreso,
} from "../services/animalService.js";
import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import { separarFichaEIngreso } from "../validations/registroIngresoValidation.js";

const MENSAJE_INGRESO = "Ingreso registrado correctamente";
const MENSAJE_REINGRESO = "Reingreso registrado correctamente";
const MENSAJE_FICHA = "Ficha creada correctamente";
const MENSAJE_FICHA_ACTUALIZADA = "Ficha actualizada correctamente";
const ESTADO_INGRESO = 201;
const ESTADO_REINGRESO = 200;
const ESTADO_FICHA = 201;
const ESTADO_FICHA_ACTUALIZADA = 200;

export function crearAnimalController({
  registrarIngresoAnimal = registrarIngreso,
  crearFichaAnimal = crearFicha,
  actualizarFichaAnimal = actualizarFicha,
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
