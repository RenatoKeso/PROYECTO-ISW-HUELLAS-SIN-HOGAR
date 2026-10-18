import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import {
  esErrorRegistroMedico,
  registroMedicoDuplicado,
} from "../entities/registroMedicoErrors.js";
import { crearRegistroMedico } from "../repositories/registroMedicoRepository.js";

const DEPENDENCIAS_POR_DEFECTO = {
  crearRegistroMedico,
};

const CODIGO_CONFLICTO_UNICO = "P2002";

function traducirError(error, animalId) {
  if (esErrorRegistroMedico(error)) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === CODIGO_CONFLICTO_UNICO) {
      return registroMedicoDuplicado(animalId);
    }
  }

  return error;
}

/*
 * r1: el registro medico provisional nace junto con la ficha y el ingreso, no
 * se crea por separado. Por eso esta funcion no abre su propia transaccion:
 * recibe el cliente que le entrega animalService, que ya esta dentro de la
 * su. Si abriera otra, las escrituras no serian atomicas y podrian quedar
 * fichas sin registro medico.
 */
export async function crearRegistroMedicoParaIngreso(
  { animalId, ingresoAnimalId },
  cliente = prisma,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  try {
    return await dependencias.crearRegistroMedico(
      { animalId, ingresoAnimalId },
      cliente,
    );
  } catch (error) {
    throw traducirError(error, animalId);
  }
}