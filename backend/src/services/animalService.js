import { Prisma } from "@prisma/client";
import { ejecutarEnTransaccion } from "../config/prisma.js";
import {
  conflictoIdentificador,
  esErrorAnimal,
  falloGuardadoFicha,
  fichaInexistente,
  fichaInexistentePorId,
  procedenciaInvalida,
  referenciaFichaAusente,
} from "../entities/animalErrors.js";
import { esErrorRegistroMedico } from "../entities/registroMedicoErrors.js";
import {
  actualizarFichaAnimal,
  crearFichaAnimal,
  obtenerFichaAnimalPorCodigo,
} from "../repositories/fichaAnimalRepository.js";
import { crearIngresoAnimal } from "../repositories/ingresoAnimalRepository.js";
import { crearRegistroMedicoParaIngreso } from "./registroMedicoService.js";

const DEPENDENCIAS_POR_DEFECTO = {
  crearFichaAnimal,
  obtenerFichaAnimalPorCodigo,
  actualizarFichaAnimal,
  crearIngresoAnimal,
  crearRegistroMedicoParaIngreso,
  ejecutarEnTransaccion,
};

const CODIGO_CONFLICTO_UNICO = "P2002";
const CODIGO_REGISTRO_INEXISTENTE = "P2025";
const CODIGO_LLAVE_FORANEA = "P2003";
const ESTADO_ESTADIA_NUEVA_FICHA = "ACTIVO";

function esReingreso(ingreso) {
  return ingreso.codigoAnimal !== undefined && ingreso.codigoAnimal !== null;
}

function leerProcedencia(ingreso) {
  return typeof ingreso.procedencia === "string" ? ingreso.procedencia.trim() : "";
}

function construirDatosIngreso(ingreso, fichaAnimalId) {
  return {
    fichaAnimalId,
    receptorId: ingreso.receptorId,
    fechaIngreso: ingreso.fechaIngreso,
    procedencia: leerProcedencia(ingreso),
    ubicacionEncontrado: ingreso.ubicacionEncontrado,
    estadoSalud: ingreso.estadoSalud,
  };
}

function traducirError(error) {
  if (esErrorAnimal(error)) return error;
  if (esErrorRegistroMedico(error)) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === CODIGO_CONFLICTO_UNICO) return conflictoIdentificador();
    if (error.code === CODIGO_REGISTRO_INEXISTENTE) return fichaInexistente();
    if (error.code === CODIGO_LLAVE_FORANEA) return fichaInexistente();
  }

  return falloGuardadoFicha(error);
}

async function guardarEnTransaccion(operacion, dependencias) {
  try {
    return await dependencias.ejecutarEnTransaccion(operacion);
  } catch (error) {
    throw traducirError(error);
  }
}

async function registrarIngresoInicial({ ficha, ingreso }, dependencias) {
  const resultado = await guardarEnTransaccion(async (cliente) => {
    const fichaCreada = await dependencias.crearFichaAnimal(ficha, cliente);

    const ingresoCreado = await dependencias.crearIngresoAnimal(
      construirDatosIngreso(ingreso, fichaCreada.id),
      cliente,
    );

    const registroMedico = await dependencias.crearRegistroMedicoParaIngreso(
      {
        animalId: fichaCreada.id,
        ingresoAnimalId: ingresoCreado.id,
      },
      cliente,
    );

    return { ficha: fichaCreada, registroMedico };
  }, dependencias);

  return {
    ficha: resultado.ficha,
    reingreso: false,
    registroMedico: resultado.registroMedico,
  };
}

async function registrarReingresoPorDevolucion({ ingreso }, dependencias) {
  const codigoAnimal = ingreso.codigoAnimal;

  if (typeof codigoAnimal !== "string" || !codigoAnimal.trim()) {
    throw referenciaFichaAusente();
  }

  const fichaExistente = await guardarEnTransaccion(async (cliente) => {
    const fichaEncontrada = await dependencias.obtenerFichaAnimalPorCodigo(
      codigoAnimal.trim(),
      cliente,
    );

    if (!fichaEncontrada) throw fichaInexistente(codigoAnimal.trim());

    await dependencias.crearIngresoAnimal(
      construirDatosIngreso(ingreso, fichaEncontrada.id),
      cliente,
    );

    // El reingreso vuelve a poner al animal a cargo del refugio.
    return dependencias.actualizarFichaAnimal(
    fichaEncontrada.id,
    { estadoEstadia: "ACTIVO" },
    cliente
);
  }, dependencias);

  return { ficha: fichaExistente, reingreso: true };
}

export async function registrarIngreso(datos, dependencias = DEPENDENCIAS_POR_DEFECTO) {
  const { ficha = {}, ingreso = {} } = datos ?? {};

  if (!leerProcedencia(ingreso)) throw procedenciaInvalida();

  if (esReingreso(ingreso)) {
    return registrarReingresoPorDevolucion(datos, dependencias);
  }

  return registrarIngresoInicial(datos, dependencias);
}

export async function crearFicha(datos, dependencias = DEPENDENCIAS_POR_DEFECTO) {
  try {
    return await dependencias.crearFichaAnimal({
      ...datos,
      estadoEstadia: ESTADO_ESTADIA_NUEVA_FICHA,
    });
  } catch (error) {
    throw traducirError(error);
  }
}

export async function actualizarFicha(id, datos, dependencias = DEPENDENCIAS_POR_DEFECTO) {
  try {
    return await dependencias.actualizarFichaAnimal(id, datos);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === CODIGO_REGISTRO_INEXISTENTE
    ) {
      throw fichaInexistentePorId(id);
    }

    throw traducirError(error);
  }
}
