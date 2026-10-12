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