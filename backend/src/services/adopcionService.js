import { listarAnimalesDisponibles } from "../repositories/animalAdopcionRepository.js";

const DEPENDENCIAS_POR_DEFECTO = {
  listarAnimalesDisponibles,
};

// Catalogo de adopcion: los animales que hoy pueden recibir postulaciones.
export async function obtenerCatalogo(dependencias = DEPENDENCIAS_POR_DEFECTO){
  return dependencias.listarAnimalesDisponibles();
}