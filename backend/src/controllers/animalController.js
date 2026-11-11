import {
  actualizarFicha,
  crearFicha,
  guardarImagenDeFicha,
  listarFichas,
  listarIngresosDeFicha,
  listarIngresosGlobales,
  quitarImagenDeFicha,
  registrarIngreso,
} from "../services/animalService.js";
import { enviarRespuestaExitosa } from "../handlers/respuestaExitosa.js";
import { separarFichaEIngreso } from "../validations/registroIngresoValidation.js";

const MENSAJE_INGRESO = "Ingreso registrado correctamente";
const MENSAJE_REINGRESO = "Reingreso registrado correctamente";
const MENSAJE_FICHA = "Ficha creada correctamente";
const MENSAJE_FICHA_ACTUALIZADA = "Ficha actualizada correctamente";
const MENSAJE_HISTORIAL = "Historial de ingresos obtenido correctamente";
const MENSAJE_FICHAS = "Fichas registradas obtenidas correctamente";
const MENSAJE_IMAGEN = "Imagen del animal actualizada correctamente";
const MENSAJE_IMAGEN_QUITADA = "Imagen del animal eliminada correctamente";
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

function construirResumenFicha(ficha) {
  return {
    id: ficha.id,
    codigoAnimal: ficha.codigoAnimal,
    imagenUrl: ficha.imagenUrl ?? null,
    imagenSubidaEn: ficha.imagenSubidaEn ?? null,
  };
}

function construirFichaConEstado(ficha) {
  return {
    ...construirResumenFicha(ficha),
    estadoEstadia: ficha.estadoEstadia,
  };
}

function construirIngresoGlobal(ingreso) {
  return {
    id: ingreso.id,
    tipo: ingreso.tipo,
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
    fichaAnimal: ingreso.fichaAnimal
      ? {
          id: ingreso.fichaAnimal.id,
          codigoAnimal: ingreso.fichaAnimal.codigoAnimal,
          nombre: ingreso.fichaAnimal.nombre,
        }
      : undefined,
  };
}

function construirIngresoPublico(ingreso) {
  return {
    id: ingreso.id,
    tipo: ingreso.tipo,
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
  crearFichaAnimal = (datos, archivo) => crearFicha(datos, undefined, archivo),
  actualizarFichaAnimal = actualizarFicha,
  listarIngresosAnimal = listarIngresosDeFicha,
  listarIngresosGlobalesAnimal = listarIngresosGlobales,
  listarFichasAnimal = listarFichas,
  guardarImagenAnimal = guardarImagenDeFicha,
  quitarImagenAnimal = quitarImagenDeFicha,
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
            imagenUrl: ficha.imagenUrl ?? null,
          },
          ingresos: ingresos.map(construirIngresoPublico),
        },
      });
    },

    async listarTodosLosIngresos(request, response) {
      const ingresos = await listarIngresosGlobalesAnimal({
        codigo: request.query.codigo,
        nombre: request.query.nombre,
      });

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_HISTORIAL,
        datos: { ingresos: ingresos.map(construirIngresoGlobal) },
      });
    },

    async crearFicha(request, response) {
      const ficha = await crearFichaAnimal(request.body, request.file);

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_FICHA,
        estado: ESTADO_FICHA,
        datos: construirFichaConEstado(ficha),
      });
    },

    async actualizarFicha(request, response) {
      const ficha = await actualizarFichaAnimal(request.params.id, request.body);

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_FICHA_ACTUALIZADA,
        estado: ESTADO_FICHA_ACTUALIZADA,
        datos: construirFichaConEstado(ficha),
      });
    },

    async listarFichas(request, response) {
      const fichas = await listarFichasAnimal();

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_FICHAS,
        datos: { fichas },
      });
    },

    async subirImagen(request, response) {
      const ficha = await guardarImagenAnimal(
        request.params.id,
        request.file,
        request.usuario,
      );

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_IMAGEN,
        datos: { ficha: construirResumenFicha(ficha) },
      });
    },

    async quitarImagen(request, response) {
      const ficha = await quitarImagenAnimal(
        request.params.id,
        request.usuario,
      );

      return enviarRespuestaExitosa(response, {
        mensaje: MENSAJE_IMAGEN_QUITADA,
        datos: { ficha: construirResumenFicha(ficha) },
      });
    },
  };
}

export const animalController = crearAnimalController();
