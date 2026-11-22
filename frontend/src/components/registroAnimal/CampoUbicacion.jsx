import { useEffect, useRef, useState } from "react";
import { buscarUbicaciones } from "../../utils/photon.js";

const MINIMO_CARACTERES = 3;
const ESPERA_BUSQUEDA = 350;

export default function CampoUbicacion({ valor, error, onChange }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const ultimaSeleccionRef = useRef("");
  const contenedorRef = useRef(null);

  useEffect(() => {
    const termino = valor.trim();

    if (
      termino.length < MINIMO_CARACTERES ||
      termino === ultimaSeleccionRef.current
    ) {
      setSugerencias([]);
      setAbierto(false);
      setCargando(false);
      setAviso("");
      setIndiceActivo(-1);
      return undefined;
    }

    let vigente = true;
    const controlador = new AbortController();

    const temporizador = setTimeout(async () => {
      setAbierto(true);
      setCargando(true);
      setAviso("");
      setSugerencias([]);
      setIndiceActivo(-1);

      try {
        const encontradas = await buscarUbicaciones(termino, {
          signal: controlador.signal,
        });

        if (!vigente) return;

        setSugerencias(encontradas);
        setIndiceActivo(encontradas.length ? 0 : -1);
        setAviso(
          encontradas.length ? "" : "Sin coincidencias para esa búsqueda.",
        );
      } catch (errorBusqueda) {
        if (!vigente || errorBusqueda.name === "AbortError") return;

        setSugerencias([]);
        setIndiceActivo(-1);
        setAviso("No se pudieron cargar las sugerencias.");
      } finally {
        if (vigente) setCargando(false);
      }
    }, ESPERA_BUSQUEDA);

    return () => {
      vigente = false;
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [valor]);

  function seleccionar(sugerencia) {
    ultimaSeleccionRef.current = sugerencia.completo;
    onChange(sugerencia.completo);
    setSugerencias([]);
    setAbierto(false);
    setIndiceActivo(-1);
    setAviso("");
  }

  function manejarCambio(evento) {
    ultimaSeleccionRef.current = "";
    onChange(evento.target.value);
  }

  function manejarTeclado(evento) {
    if (sugerencias.length === 0) return;

    if (!abierto) {
      if (evento.key === "ArrowDown") {
        evento.preventDefault();
        setAbierto(true);
      }
      return;
    }

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceActivo(
        (indice) => (indice + 1) % sugerencias.length,
      );
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceActivo(
        (indice) => (indice - 1 + sugerencias.length) % sugerencias.length,
      );
    } else if (evento.key === "Enter" && indiceActivo >= 0) {
      evento.preventDefault();
      seleccionar(sugerencias[indiceActivo]);
    } else if (evento.key === "Escape") {
      setAbierto(false);
    }
  }

  function manejarBlur(evento) {
    if (!contenedorRef.current?.contains(evento.relatedTarget)) {
      setAbierto(false);
    }
  }

  const mostrarPanel = abierto && Boolean(valor.trim());

  return (
    <div
      className="campo campo-ubicacion"
      ref={contenedorRef}
      onBlur={manejarBlur}
    >
      <label htmlFor="ubicacionEncontrado">
        Ubicación de hallazgo
        <span className="campo-opcional campo-opcional-pildora">
          Opcional
        </span>
      </label>

      <div className="campo-control-icono">
        <input
          id="ubicacionEncontrado"
          name="ubicacionEncontrado"
          type="text"
          value={valor}
          maxLength={255}
          autoComplete="off"
          placeholder="Ej. Av. Collao 1202, Concepción"
          aria-invalid={Boolean(error)}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={
            mostrarPanel ? "sugerencias-ubicacion" : undefined
          }
          aria-activedescendant={
            mostrarPanel && indiceActivo >= 0
              ? `sugerencia-ubicacion-${indiceActivo}`
              : undefined
          }
          onChange={manejarCambio}
          onKeyDown={manejarTeclado}
        />

        <span
          className="material-symbols-outlined campo-icono"
          aria-hidden="true"
        >
          location_on
        </span>

        {mostrarPanel && (
          <div className="ingreso-sugerencias" id="sugerencias-ubicacion">
            {cargando && (
              <p className="ingreso-sugerencias-estado" role="status">
                Buscando direcciones...
              </p>
            )}

            {!cargando && aviso && (
              <p className="ingreso-sugerencias-estado" role="status">
                {aviso}
              </p>
            )}

            {!cargando && !aviso && (
              <ul
                className="ingreso-sugerencias-lista"
                role="listbox"
                aria-label="Sugerencias de ubicación"
              >
                {sugerencias.map((sugerencia, indice) => (
                  <li key={sugerencia.id} role="presentation">
                    <button
                      id={`sugerencia-ubicacion-${indice}`}
                      className={
                        indice === indiceActivo
                          ? "ingreso-sugerencia ingreso-sugerencia-activa"
                          : "ingreso-sugerencia"
                      }
                      type="button"
                      role="option"
                      aria-selected={indice === indiceActivo}
                      onClick={() => seleccionar(sugerencia)}
                      onMouseEnter={() => setIndiceActivo(indice)}
                    >
                      <span className="ingreso-sugerencia-principal">
                        {sugerencia.principal}
                      </span>
                      {sugerencia.secundario && (
                        <span className="ingreso-sugerencia-secundaria">
                          {sugerencia.secundario}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <span className="ingreso-sugerencias-marca">
              © OpenStreetMap contributors
            </span>
          </div>
        )}
      </div>

      {error && <span className="campo-error">{error}</span>}
    </div>
  );
}
