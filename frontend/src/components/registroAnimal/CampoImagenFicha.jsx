import { useEffect, useMemo, useRef, useState } from "react";
import {
  EXTENSIONES_IMAGEN,
  LIMITE_IMAGEN_BYTES,
  TIPOS_IMAGEN,
} from "../../validations/imagenAnimalValidation.js";

const ACEPTAR_IMAGENES = [...EXTENSIONES_IMAGEN, ...TIPOS_IMAGEN].join(",");
const LIMITE_IMAGEN_MB = LIMITE_IMAGEN_BYTES / (1024 * 1024);

function crearVistaPrevia(archivo) {
  if (!archivo || typeof URL.createObjectURL !== "function") return null;
  return URL.createObjectURL(archivo);
}

export default function CampoImagenFicha({ archivo, error, onChange }) {
  const inputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);

  const vistaPrevia = useMemo(() => crearVistaPrevia(archivo), [archivo]);

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    },
    [vistaPrevia],
  );

  function abrirSelector() {
    inputRef.current?.click();
  }

  function seleccionarArchivo(evento) {
    const seleccionado = evento.target.files?.[0] ?? null;
    evento.target.value = "";
    onChange(seleccionado);
  }

  function soltarArchivo(evento) {
    evento.preventDefault();
    setArrastrando(false);
    onChange(evento.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="ficha-imagen">
      <input
        ref={inputRef}
        id="imagen"
        name="imagen"
        type="file"
        accept={ACEPTAR_IMAGENES}
        className="ficha-archivo-oculto"
        aria-label="Imagen del animal"
        aria-invalid={Boolean(error)}
        onChange={seleccionarArchivo}
      />

      <div
        className={
          arrastrando
            ? "ficha-dropzone ficha-dropzone-activa"
            : "ficha-dropzone"
        }
        onClick={abrirSelector}
        onDragEnter={(evento) => {
          evento.preventDefault();
          setArrastrando(true);
        }}
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltarArchivo}
      >
        <div className="ficha-dropzone-info">
          <div className="ficha-preview">
            {vistaPrevia ? (
              <img src={vistaPrevia} alt="Vista previa del animal" />
            ) : (
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                add_photo_alternate
              </span>
            )}
          </div>

          <div className="ficha-dropzone-texto">
            <span className="ficha-archivo-nombre">
              {archivo
                ? archivo.name
                : "Arrastra una imagen aquí o selecciónala"}
            </span>
            <span className="ficha-archivo-ayuda">
              JPG o PNG, máximo {LIMITE_IMAGEN_MB} MB.
            </span>
          </div>
        </div>

        <button
          type="button"
          className="ficha-boton-imagen"
          onClick={(evento) => {
            evento.stopPropagation();
            abrirSelector();
          }}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            upload
          </span>
          Agregar imagen
        </button>
      </div>

      {archivo && (
        <button
          type="button"
          className="ficha-quitar-imagen"
          onClick={() => onChange(null)}
        >
          Quitar imagen
        </button>
      )}

      {error && <span className="campo-error">{error}</span>}
    </div>
  );
}
