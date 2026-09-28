import { ZodError } from "zod";
import { esErrorAnimal } from "../entities/animalErrors.js";

export const CODIGO_DATOS_INVALIDOS = "DATOS_INVALIDOS";
export const CODIGO_RUTA_NO_ENCONTRADA = "RUTA_NO_ENCONTRADA";
export const CODIGO_ERROR_INTERNO = "ERROR_INTERNO";

export function manejarRutaNoEncontrada(request, response) {
  return response.status(404).json({
    message: `La ruta ${request.method} ${request.originalUrl} no existe`,
    code: CODIGO_RUTA_NO_ENCONTRADA,
  });
}

function construirDetalleDeZod(error) {
  return error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((campo) => ({
        campo,
        mensaje: "Campo no permitido en la peticion",
      }));
    }

    if (issue.path.length === 0) {
      return [{ mensaje: issue.message }];
    }

    return [{ campo: issue.path.join("."), mensaje: issue.message }];
  });
}

export function manejadorErrores(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Los datos enviados no son validos",
      code: CODIGO_DATOS_INVALIDOS,
      detalles: construirDetalleDeZod(error),
    });
    return;
  }

  if (esErrorAnimal(error)) {
    response.status(error.estadoHttp).json({
      message: error.message,
      code: error.codigo,
      ...(error.opcion.codigoAnimal ? { codigoAnimal: error.opcion.codigoAnimal } : {}),
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    message: "Error interno del servidor",
    code: CODIGO_ERROR_INTERNO,
  });
}
