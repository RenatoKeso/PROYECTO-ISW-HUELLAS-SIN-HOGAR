import { esExtensionImagenPermitida } from "../config/almacenamientoImagenes.js";
import { formatoImagenInvalido } from "../entities/imagenAnimalErrors.js";

function empiezaCon(buffer, firma) {
  if (buffer.length < firma.length) return false;

  return firma.every((byte, indice) => buffer[indice] === byte);
}

function detectarFirma(buffer) {
  if (empiezaCon(buffer, [0xff, 0xd8, 0xff])) {
    return { extension: "jpg", mimetype: "image/jpeg" };
  }

  if (
    empiezaCon(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return { extension: "png", mimetype: "image/png" };
  }

  return null;
}

export function validarImagenParaSubir(archivo) {
  if (
    !esExtensionImagenPermitida(archivo?.mimetype, archivo?.originalname)
  ) {
    throw formatoImagenInvalido();
  }

  const buffer = archivo?.buffer;

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw formatoImagenInvalido();
  }

  const firma = detectarFirma(buffer);

  if (!firma || firma.mimetype !== archivo.mimetype) {
    throw formatoImagenInvalido(
      "El contenido del archivo no corresponde a una imagen JPG o PNG válida",
    );
  }

  return firma.extension;
}
