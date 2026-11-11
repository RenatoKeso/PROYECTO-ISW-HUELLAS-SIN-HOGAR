import multer from "multer";
import {
  esExtensionImagenPermitida,
  LIMITE_IMAGEN_BYTES,
} from "../config/almacenamientoImagenes.js";
import {
  formatoImagenInvalido,
  imagenDemasiadoGrande,
} from "../entities/imagenAnimalErrors.js";

export const subirImagenAnimal = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LIMITE_IMAGEN_BYTES,
    files: 1,
  },
  fileFilter(request, archivo, callback) {
    if (
      !esExtensionImagenPermitida(archivo.mimetype, archivo.originalname)
    ) {
      callback(formatoImagenInvalido());
      return;
    }

    callback(null, true);
  },
});

function traducirErrorMulter(error) {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return imagenDemasiadoGrande();
  }

  if (error instanceof multer.MulterError) {
    return formatoImagenInvalido(
      "No se pudo procesar el archivo enviado. Adjunta una sola imagen JPG o PNG",
    );
  }

  return error;
}

export function recibirImagen(campo = "imagen") {
  const cargarArchivo = subirImagenAnimal.single(campo);

  return function recibirImagenMiddleware(request, response, next) {
    if (!request.is("multipart/form-data")) {
      next();
      return;
    }

    cargarArchivo(request, response, (error) => {
      if (error) {
        next(traducirErrorMulter(error));
        return;
      }

      next();
    });
  };
}
