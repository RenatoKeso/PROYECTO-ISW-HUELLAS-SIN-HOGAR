import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";

const PREFIJO_CODIGO_ANIMAL = "anim-";
const LARGO_SECUENCIAL = 3;
const MAX_INTENTOS = 5;

function formatearCodigoAnimal(secuencial) {
  return `${PREFIJO_CODIGO_ANIMAL}${String(secuencial).padStart(LARGO_SECUENCIAL, "0")}`;
}

function esCodigoDuplicado(error) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function obtenerUltimoSecuencial(cliente) {
  const ultimaFicha = await cliente.fichaAnimal.findFirst({
    orderBy: { id: "desc" },
    select: { id: true, codigoAnimal: true },
  });

  if (!ultimaFicha) return 0;

  const sufijo = ultimaFicha.codigoAnimal.match(/(\d+)$/)?.[1];

  return sufijo ? Number.parseInt(sufijo, 10) : ultimaFicha.id;
}

export async function obtenerFichaAnimalPorCodigo(codigoAnimal, cliente = prisma) {
  return cliente.fichaAnimal.findUnique({ where: { codigoAnimal } });
}

export async function crearFichaAnimal(data, cliente = prisma) {
  for (let intento = 1; intento <= MAX_INTENTOS; intento += 1) {
    const codigoAnimal = formatearCodigoAnimal(
      (await obtenerUltimoSecuencial(cliente)) + intento,
    );

    try {
      return await cliente.fichaAnimal.create({ data: { ...data, codigoAnimal } });
    } catch (error) {
      if (!esCodigoDuplicado(error) || intento === MAX_INTENTOS) throw error;
    }
  }
}

export async function actualizarFichaAnimal(id, data, cliente = prisma) {
  return cliente.fichaAnimal.update({ where: { id }, data });
}
