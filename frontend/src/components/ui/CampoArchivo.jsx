import { useEffect, useMemo } from "react";
import {
  EXTENSIONES_IMAGEN,
  LIMITE_IMAGEN_BYTES,
  TIPOS_IMAGEN,
} from "../../validations/imagenAnimalValidation.js";

const ACEPTAR_IMAGENES = [...EXTENSIONES_IMAGEN, ...TIPOS_IMAGEN].join(",");
const LIMITE_IMAGEN_MB = LIMITE_IMAGEN_BYTES / (1024 * 1024);

function claveDelArchivo(archivo) {
  if (!archivo) return "sin-archivo";

  return `${archivo.name}-${archivo.size}-${archivo.lastModified}`;
}

export default function CampoArchivo({
  etiqueta,
  nombre,
  archivo,
  error,
  onChange,
}) {
  const vistaPrevia = useMemo(
    () => (archivo ? URL.createObjectURL(archivo) : null),
    [archivo],
  );

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    },
    [vistaPrevia],
  );

  return (
    <div className="campo campo-ancho">
      <label htmlFor={nombre}>{etiqueta}</label>

      <input
        key={claveDelArchivo(archivo)}
        id={nombre}
        name={nombre}
        type="file"
        accept={ACEPTAR_IMAGENES}
        aria-invalid={Boolean(error)}
        onChange={(evento) => {
          const seleccionado = evento.target.files?.[0] ?? null;
          evento.target.value = "";
          onChange(seleccionado);
        }}
      />

      <span className="campo-ayuda">
        {`JPG o PNG, máximo ${LIMITE_IMAGEN_MB} MB.`}
      </span>

      {error && <span className="campo-error">{error}</span>}

      {vistaPrevia && (
        <div className="vista-previa-imagen">
          <img src={vistaPrevia} alt="Vista previa del animal" />

          <div>
            <p>{archivo.name}</p>
            <button
              type="button"
              className="boton boton-secundario boton-chico"
              onClick={() => onChange(null)}
            >
              Quitar imagen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
