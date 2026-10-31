import prisma from "../config/prisma.js";

const ESTADO_DISPONIBLE = "ESPERA_ADOPCION";
// Animales que pueden recibir postulaciones, del que lleva mas tiempo esperando al mas nuevo.

export async function listarAnimalesDisponibles(cliente = prisma){
  return cliente.fichaAnimal.findMany({
    where:{estadoEstadia: ESTADO_DISPONIBLE},
    select:{
      id: true,
      codigoAnimal: true,
      nombre: true,
      especie: true,
      sexoAnimal: true,
      raza: true,
      edad: true,
      observaciones: true,
    },
    orderBy:{createdAt: "asc"},
  });
}

// Animales que la veterinaria marco como adoptables y que siguen en el refugio
// sin estar publicados todavia.
const CONDICION_PUBLICABLE = { estadoEstadia: "ACTIVO", estadoAdopcion: "ADOPTABLE" };

export async function listarAnimalesPublicables(cliente = prisma) {
  return cliente.fichaAnimal.findMany({
    where: CONDICION_PUBLICABLE,
    select: {
      id: true,
      codigoAnimal: true,
      nombre: true,
      especie: true,
      sexoAnimal: true,
      raza: true,
      edad: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function buscarAnimalParaPublicar(id, cliente = prisma) {
  return cliente.fichaAnimal.findUnique({
    where: { id },
    select: {
      id: true,
      codigoAnimal: true,
      nombre: true,
      estadoEstadia: true,
      estadoAdopcion: true,
    },
  });
}

// Pasa el animal a ESPERA_ADOPCION solo si sigue cumpliendo la condicion.
// Devuelve cuantas filas cambio (0 o 1).
export async function publicarAnimalAdoptable(id, cliente = prisma) {
  const { count } = await cliente.fichaAnimal.updateMany({
    where: { id, ...CONDICION_PUBLICABLE },
    data: { estadoEstadia: ESTADO_DISPONIBLE },
  });

  return count;
}