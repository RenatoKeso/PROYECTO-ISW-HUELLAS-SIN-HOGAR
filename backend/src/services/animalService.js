import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { Prisma } from "@prisma/client";
import {
  CARPETA_IMAGENES_ANIMALES,
  rutaImagenAnimal,
  rutaImagenDesdeUrl,
  urlImagenAnimal,
} from "../config/almacenamientoImagenes.js";
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
import { AuthError } from "../entities/authErrors.js";
import {
  esErrorImagenAnimal,
  falloGuardadoImagen,
  imagenAusente,
} from "../entities/imagenAnimalErrors.js";
import { esErrorRegistroMedico } from "../entities/registroMedicoErrors.js";
import {
  actualizarFichaAnimal,
  crearFichaAnimal,
  listarFichasAnimales,
  obtenerFichaAnimalPorCodigo,
  obtenerFichaAnimalPorId,
} from "../repositories/fichaAnimalRepository.js";
import {
  crearIngresoAnimal,
  listarIngresosPorFicha,
} from "../repositories/ingresoAnimalRepository.js";
import { crearRegistroMedicoParaIngreso } from "./registroMedicoService.js";
import { puedeGestionarFichas } from "./permisosUsuario.js";
import { validarImagenParaSubir } from "../validations/imagenAnimalValidation.js";

const DEPENDENCIAS_POR_DEFECTO = {
  crearFichaAnimal,
  obtenerFichaAnimalPorCodigo,
  obtenerFichaAnimalPorId,
  actualizarFichaAnimal,
  listarFichasAnimales,
  crearIngresoAnimal,
  listarIngresosPorFicha,
  crearRegistroMedicoParaIngreso,
  ejecutarEnTransaccion,
  puedeGestionarFichas,
  validarImagenParaSubir,
  crearDirectorio: (ruta) => fs.mkdir(ruta, { recursive: true }),
  escribirArchivo: (ruta, contenido) => fs.writeFile(ruta, contenido),
  eliminarArchivo: (ruta) => fs.unlink(ruta),
  generarNombreArchivo: randomUUID,
  ahora: () => new Date(),
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
  if (esErrorImagenAnimal(error)) return error;

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
      { estadoEstadia: ESTADO_ESTADIA_NUEVA_FICHA },
      cliente,
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

export async function listarIngresosDeFicha(
  fichaId,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const ficha = await dependencias.obtenerFichaAnimalPorId(fichaId);

  if (!ficha) throw fichaInexistentePorId(fichaId);

  const ingresos = await dependencias.listarIngresosPorFicha(fichaId);

  return { ficha, ingresos };
}

function esRegistroInexistente(error) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === CODIGO_REGISTRO_INEXISTENTE
  );
}

async function eliminarArchivoSiExiste(ruta, dependencias) {
  try {
    await dependencias.eliminarArchivo(ruta);
  } catch {
    // La eliminacion es best effort: no debe romper una operacion ya confirmada.
  }
}

function exigirGestionFichas(actor, dependencias, mensaje) {
  if (!dependencias.puedeGestionarFichas(actor)) {
    throw new AuthError(mensaje, 403, "ROL_INSUFICIENTE");
  }
}

async function obtenerFichaGestionable(fichaId, dependencias) {
  const ficha = await dependencias.obtenerFichaAnimalPorId(fichaId);

  if (!ficha) throw fichaInexistentePorId(fichaId);

  return ficha;
}

async function guardarArchivoImagen(archivo, dependencias) {
  const extension = dependencias.validarImagenParaSubir(archivo);
  const nombre = `${dependencias.generarNombreArchivo()}.${extension}`;
  const ruta = rutaImagenAnimal(nombre);

  try {
    await dependencias.crearDirectorio(CARPETA_IMAGENES_ANIMALES);
    await dependencias.escribirArchivo(ruta, archivo.buffer);
  } catch (error) {
    throw falloGuardadoImagen(error);
  }

  return {
    nombre,
    ruta,
    url: urlImagenAnimal(nombre),
  };
}

export async function crearFicha(
  datos,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
  archivo = null,
) {
  const deps = { ...DEPENDENCIAS_POR_DEFECTO, ...dependencias };
  const imagen = archivo ? await guardarArchivoImagen(archivo, deps) : null;

  try {
    const datosFicha = {
      ...datos,
      estadoEstadia: ESTADO_ESTADIA_NUEVA_FICHA,
    };

    if (imagen) {
      datosFicha.imagenUrl = imagen.url;
      datosFicha.imagenSubidaEn = deps.ahora();
    }

    return await deps.crearFichaAnimal(datosFicha);
  } catch (error) {
    if (imagen) await eliminarArchivoSiExiste(imagen.ruta, deps);

    throw traducirError(error);
  }
}

export async function guardarImagenDeFicha(
  fichaId,
  archivo,
  actor,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const deps = { ...DEPENDENCIAS_POR_DEFECTO, ...dependencias };

  exigirGestionFichas(
    actor,
    deps,
    "No tienes permiso para subir imagenes de animales",
  );

  if (!archivo) throw imagenAusente();

  const ficha = await obtenerFichaGestionable(fichaId, deps);

  const imagen = await guardarArchivoImagen(archivo, deps);

  try {
    const actualizada = await deps.actualizarFichaAnimal(fichaId, {
      imagenUrl: imagen.url,
      imagenSubidaEn: deps.ahora(),
    });

    if (ficha.imagenUrl) {
      await eliminarArchivoSiExiste(
        rutaImagenDesdeUrl(ficha.imagenUrl),
        deps,
      );
    }

    return actualizada;
  } catch (error) {
    await eliminarArchivoSiExiste(imagen.ruta, deps);

    if (esRegistroInexistente(error)) throw fichaInexistentePorId(fichaId);

    throw falloGuardadoImagen(error);
  }
}

export async function quitarImagenDeFicha(
  fichaId,
  actor,
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const deps = { ...DEPENDENCIAS_POR_DEFECTO, ...dependencias };

  exigirGestionFichas(
    actor,
    deps,
    "No tienes permiso para quitar imagenes de animales",
  );

  const ficha = await obtenerFichaGestionable(fichaId, deps);

  let actualizada;

  try {
    actualizada = await deps.actualizarFichaAnimal(fichaId, {
      imagenUrl: null,
      imagenSubidaEn: null,
    });
  } catch (error) {
    if (esRegistroInexistente(error)) throw fichaInexistentePorId(fichaId);

    throw falloGuardadoImagen(error);
  }

  if (ficha.imagenUrl) {
    await eliminarArchivoSiExiste(rutaImagenDesdeUrl(ficha.imagenUrl), deps);
  }

  return actualizada;
}

export async function listarFichas(
  dependencias = DEPENDENCIAS_POR_DEFECTO,
) {
  const deps = { ...DEPENDENCIAS_POR_DEFECTO, ...dependencias };

  return deps.listarFichasAnimales();
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
