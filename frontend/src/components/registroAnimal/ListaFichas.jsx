import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Mensaje from "../ui/Mensaje.jsx";
import VentanaModal from "../ui/VentanaModal.jsx";
import IconoGato from "./IconoGato.jsx";
import {
  listarFichas,
  listarIngresosFicha,
  quitarImagenFicha,
  subirImagenFicha,
} from "../../services/animalesService.js";
import { validarArchivoImagen } from "../../validations/imagenAnimalValidation.js";
import { urlImagen } from "../../utils/urlImagen.js";
import {
  NOMBRES_ESPECIE,
  codigoAnimalDesdeNumero,
  nombreVisible,
} from "../../utils/registroAnimal.js";
import "../../styles/registroFichas.css";
import "../../styles/listaFichas.css";
import "../../styles/resumenAnimales.css";

const NOMBRES_SEXO = {
  MACHO: "Macho",
  HEMBRA: "Hembra",
  DESCONOCIDO: "Desconocido",
};

function iconoEspecie(especie) {
  return especie === "GATO" ? <IconoGato /> : "pets";
}

function claseEspecie(especie) {
  if (especie === "GATO") return "gato";
  if (especie === "PERRO") return "perro";
  return "otro";
}

function textoEdad(edad) {
  if (edad === null || edad === undefined || edad === "") return null;

  return `${edad} ${Number(edad) === 1 ? "año" : "años"}`;
}

function textoMeta(fichaAnimal) {
  return [
    fichaAnimal.raza,
    textoEdad(fichaAnimal.edad),
    NOMBRES_SEXO[fichaAnimal.sexoAnimal],
  ]
    .filter(Boolean)
    .join(" • ");
}

export default function ListaFichas() {
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const [fichas, setFichas] = useState([]);
  const [cargandoFichas, setCargandoFichas] = useState(true);
  const [errorFichas, setErrorFichas] = useState("");
  const [mensajeImagen, setMensajeImagen] = useState(null);
  const [mensajeHistorial, setMensajeHistorial] = useState(null);
  const [procesandoImagenId, setProcesandoImagenId] = useState(null);
  const [consultandoHistorialId, setConsultandoHistorialId] = useState(null);
  const [ventana, setVentana] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState("TODOS");
  const [orden, setOrden] = useState("recientes");

  useEffect(() => {
    let vigente = true;

    listarFichas()
      .then((respuesta) => {
        if (!vigente) return;
        setFichas(respuesta.fichas);
        setErrorFichas("");
      })
      .catch((error) => {
        if (vigente) setErrorFichas(error.message);
      })
      .finally(() => {
        if (vigente) setCargandoFichas(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const fichaSolicitada = parametros.get("ficha");

  function cerrarVentana() {
    setVentana(null);

    if (parametros.has("ficha")) {
      const nuevos = new URLSearchParams(parametros);
      nuevos.delete("ficha");
      setParametros(nuevos, { replace: true });
    }
  }

  function abrirImagen(fichaAnimal) {
    const nombre = nombreVisible(fichaAnimal);

    setVentana({
      tipo: "imagen",
      src: urlImagen(fichaAnimal.imagenUrl),
      alt: `Imagen de ${nombre}`,
      ariaLabel: `Imagen ampliada de ${nombre}`,
    });
  }

  function abrirDetalle(fichaAnimal) {
    setVentana({ tipo: "detalle", ficha: fichaAnimal });
  }

  function actualizarFichaEnLista(fichaActualizada) {
    setFichas((actuales) =>
      actuales.map((otra) =>
        otra.id === fichaActualizada.id
          ? { ...otra, ...fichaActualizada }
          : otra,
      ),
    );
  }

  async function abrirHistorial(fichaAnimal) {
    setMensajeHistorial(null);
    setConsultandoHistorialId(fichaAnimal.id);

    try {
      const respuesta = await listarIngresosFicha(fichaAnimal.id);

      if (respuesta.ingresos.length > 0) {
        navegar(
          `/registro/historial?busqueda=${encodeURIComponent(
            fichaAnimal.codigoAnimal,
          )}`,
        );
        return;
      }

      setVentana({ tipo: "sinHistorial", ficha: fichaAnimal });
    } catch (error) {
      setMensajeHistorial({
        tipo: "error",
        texto: `No se pudo consultar el historial de ingresos: ${error.message}`,
      });
    } finally {
      setConsultandoHistorialId(null);
    }
  }

  function registrarIngresoDesdeModal() {
    const fichaAnimal = ventana?.ficha;

    cerrarVentana();

    if (fichaAnimal) {
      navegar(
        `/registro/ingreso?codigo=${encodeURIComponent(
          fichaAnimal.codigoAnimal,
        )}`,
      );
    }
  }

  async function subirImagen(fichaAnimal, archivo) {
    if (!archivo) return;

    const error = validarArchivoImagen(archivo);

    if (error) {
      setMensajeImagen({ tipo: "error", texto: error });
      return;
    }

    setMensajeImagen(null);
    setProcesandoImagenId(fichaAnimal.id);

    try {
      const respuesta = await subirImagenFicha(fichaAnimal.id, archivo);
      actualizarFichaEnLista(respuesta.ficha);
      setMensajeImagen({
        tipo: "exito",
        texto: `Imagen de ${nombreVisible(fichaAnimal)} actualizada correctamente.`,
      });
    } catch (errorSubida) {
      setMensajeImagen({ tipo: "error", texto: errorSubida.message });
    } finally {
      setProcesandoImagenId(null);
    }
  }

  async function quitarImagen(fichaAnimal) {
    setMensajeImagen(null);
    setProcesandoImagenId(fichaAnimal.id);

    try {
      const respuesta = await quitarImagenFicha(fichaAnimal.id);
      actualizarFichaEnLista(respuesta.ficha);
      setMensajeImagen({
        tipo: "exito",
        texto: `Imagen de ${nombreVisible(fichaAnimal)} eliminada correctamente.`,
      });
    } catch (errorQuitar) {
      setMensajeImagen({ tipo: "error", texto: errorQuitar.message });
    } finally {
      setProcesandoImagenId(null);
    }
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEspecie("TODOS");
    setOrden("recientes");
  }

  const termino = busqueda.trim().toLowerCase();
  const codigoNumerico = /^\d+$/.test(termino)
    ? codigoAnimalDesdeNumero(termino)
    : "";

  const fichasFiltradas = fichas
    .filter((fichaAnimal) => {
      if (
        filtroEspecie !== "TODOS" &&
        fichaAnimal.especie !== filtroEspecie
      ) {
        return false;
      }

      if (!termino) return true;

      const coincideTexto = [
        fichaAnimal.codigoAnimal,
        fichaAnimal.nombre,
        fichaAnimal.raza,
      ].some((valor) => String(valor ?? "").toLowerCase().includes(termino));

      if (coincideTexto) return true;

      return (
        Boolean(codigoNumerico) &&
        String(fichaAnimal.codigoAnimal ?? "")
          .toLowerCase()
          .includes(codigoNumerico)
      );
    })
    .sort((a, b) => {
      if (orden === "az") {
        return String(a.nombre || a.codigoAnimal).localeCompare(
          String(b.nombre || b.codigoAnimal),
          "es",
        );
      }

      if (orden === "codigo") {
        return String(a.codigoAnimal).localeCompare(
          String(b.codigoAnimal),
          "es",
        );
      }

      return b.id - a.id;
    });

  const totalPerros = fichas.filter(
    (fichaAnimal) => fichaAnimal.especie === "PERRO",
  ).length;
  const totalGatos = fichas.filter(
    (fichaAnimal) => fichaAnimal.especie === "GATO",
  ).length;
  const totalOtras = fichas.filter(
    (fichaAnimal) => fichaAnimal.especie === "OTRO",
  ).length;

  const fichaDetalleActual =
    ventana?.tipo === "detalle"
      ? fichas.find((fichaAnimal) => fichaAnimal.id === ventana.ficha.id) ??
        ventana.ficha
      : !ventana && fichaSolicitada
        ? (fichas.find(
            (fichaAnimal) => String(fichaAnimal.id) === fichaSolicitada,
          ) ?? null)
        : null;

  return (
    <>
      <section className="lista-fichas">
        <header className="lista-fichas-encabezado">
          <div className="lista-fichas-encabezado-titulos">
            <h1>Lista de animales</h1>
          </div>

          <div className="lista-fichas-encabezado-acciones">
            <div className="lista-fichas-resumen">
              <div className="lista-fichas-resumen-grupo">
                <span
                  className="material-symbols-outlined lista-fichas-resumen-icono"
                  aria-hidden="true"
                >
                  pets
                </span>
                <div>
                  <span className="lista-fichas-resumen-label">Total</span>
                  <span className="lista-fichas-resumen-valor">
                    {fichas.length}
                  </span>
                </div>
              </div>

              <span
                className="lista-fichas-resumen-divisor"
                aria-hidden="true"
              />

              <div className="lista-fichas-resumen-grupo">
                <span
                  className="material-symbols-outlined lista-fichas-resumen-icono"
                  aria-hidden="true"
                >
                  pets
                </span>
                <div>
                  <span className="lista-fichas-resumen-label">Perros</span>
                  <span className="lista-fichas-resumen-valor">
                    {totalPerros}
                  </span>
                </div>
              </div>

              <span
                className="lista-fichas-resumen-divisor"
                aria-hidden="true"
              />

              <div className="lista-fichas-resumen-grupo">
                <span
                  className="lista-fichas-resumen-icono"
                  aria-hidden="true"
                >
                  <IconoGato />
                </span>
                <div>
                  <span className="lista-fichas-resumen-label">Gatos</span>
                  <span className="lista-fichas-resumen-valor">
                    {totalGatos}
                  </span>
                </div>
              </div>
            </div>

            <Link className="lista-fichas-boton-crear" to="/registro/ficha">
              <span className="material-symbols-outlined" aria-hidden="true">
                add
              </span>
              Registrar nueva ficha
            </Link>
          </div>
        </header>

        <Mensaje mensaje={mensajeImagen} />
        <Mensaje mensaje={mensajeHistorial} />

        {cargandoFichas && (
          <p className="lista-fichas-estado">Cargando fichas...</p>
        )}

        {!cargandoFichas && errorFichas && (
          <p className="lista-fichas-estado lista-fichas-estado-error">
            No se pudieron cargar las fichas: {errorFichas}
          </p>
        )}

        {!cargandoFichas && !errorFichas && (
          <>
            <section
              className="lista-fichas-filtros"
              aria-label="Filtros del catálogo"
            >
              <div className="lista-fichas-filtros-fila">
                <div className="lista-fichas-buscador">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    search
                  </span>
                  <input
                    id="busquedaCatalogo"
                    type="search"
                    value={busqueda}
                    onChange={(evento) => setBusqueda(evento.target.value)}
                    placeholder="Buscar por nombre, código o raza (ej: Gretel, anim-001)..."
                    aria-label="Buscar por nombre, código o raza"
                  />
                </div>

                <select
                  className="lista-fichas-select"
                  value={orden}
                  onChange={(evento) => setOrden(evento.target.value)}
                  aria-label="Ordenar fichas"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="az">Nombre (A-Z)</option>
                  <option value="codigo">Por código</option>
                </select>

                <button
                  type="button"
                  className="lista-fichas-limpiar"
                  onClick={limpiarFiltros}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    restart_alt
                  </span>
                  Limpiar
                </button>
              </div>

              <div className="lista-fichas-filtros-especies">
                <span className="lista-fichas-filtros-especies-label">
                  Filtrar por especie:
                </span>

                <button
                  type="button"
                  className={
                    filtroEspecie === "TODOS"
                      ? "lista-fichas-filtro-especie lista-fichas-filtro-especie-activo"
                      : "lista-fichas-filtro-especie"
                  }
                  aria-pressed={filtroEspecie === "TODOS"}
                  onClick={() => setFiltroEspecie("TODOS")}
                >
                  Todos ({fichas.length})
                </button>

                <button
                  type="button"
                  className={
                    filtroEspecie === "PERRO"
                      ? "lista-fichas-filtro-especie lista-fichas-filtro-especie-activo"
                      : "lista-fichas-filtro-especie"
                  }
                  aria-pressed={filtroEspecie === "PERRO"}
                  onClick={() => setFiltroEspecie("PERRO")}
                >
                  Perros ({totalPerros})
                </button>

                <button
                  type="button"
                  className={
                    filtroEspecie === "GATO"
                      ? "lista-fichas-filtro-especie lista-fichas-filtro-especie-activo"
                      : "lista-fichas-filtro-especie"
                  }
                  aria-pressed={filtroEspecie === "GATO"}
                  onClick={() => setFiltroEspecie("GATO")}
                >
                  Gatos ({totalGatos})
                </button>

                {totalOtras > 0 && (
                  <button
                    type="button"
                    className={
                      filtroEspecie === "OTRO"
                        ? "lista-fichas-filtro-especie lista-fichas-filtro-especie-activo"
                        : "lista-fichas-filtro-especie"
                    }
                    aria-pressed={filtroEspecie === "OTRO"}
                    onClick={() => setFiltroEspecie("OTRO")}
                  >
                    Otras ({totalOtras})
                  </button>
                )}
              </div>
            </section>

            {fichas.length === 0 ? (
              <div className="lista-fichas-vacio">
                <span
                  className="material-symbols-outlined lista-fichas-vacio-icono"
                  aria-hidden="true"
                >
                  pets
                </span>
                <h2>Todavía no hay fichas registradas</h2>
                <p>
                  Crea la primera ficha para comenzar a construir el catálogo
                  del refugio.
                </p>
                <Link
                  className="lista-fichas-boton-crear"
                  to="/registro/ficha"
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    add
                  </span>
                  Registrar primera ficha
                </Link>
              </div>
            ) : fichasFiltradas.length === 0 ? (
              <div className="lista-fichas-vacio">
                <span
                  className="material-symbols-outlined lista-fichas-vacio-icono"
                  aria-hidden="true"
                >
                  search_off
                </span>
                <h2>No se encontraron animales con estos filtros</h2>
                <p>
                  Prueba cambiando el término de búsqueda, seleccionando otra
                  especie o restableciendo los filtros.
                </p>
                <button
                  type="button"
                  className="lista-fichas-boton-crear"
                  onClick={limpiarFiltros}
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    restart_alt
                  </span>
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="lista-fichas-grid">
                {fichasFiltradas.map((fichaAnimal) => {
                  const nombre = nombreVisible(fichaAnimal);
                  const procesando = procesandoImagenId === fichaAnimal.id;

                  return (
                    <article
                      className="lista-fichas-tarjeta"
                      key={fichaAnimal.id}
                      onClick={() => abrirDetalle(fichaAnimal)}
                    >
                      <div className="lista-fichas-tarjeta-media">
                        <span
                          className={`lista-fichas-tarjeta-especie lista-fichas-tarjeta-especie-${claseEspecie(
                            fichaAnimal.especie,
                          )}`}
                        >
                          <span
                            className="material-symbols-outlined"
                            aria-hidden="true"
                          >
                            {iconoEspecie(fichaAnimal.especie)}
                          </span>
                          {NOMBRES_ESPECIE[fichaAnimal.especie] ??
                            "Otra especie"}
                        </span>

                        {fichaAnimal.imagenUrl ? (
                          <>
                            <button
                              type="button"
                              className="lista-fichas-tarjeta-imagen-boton"
                              onClick={(evento) => {
                                evento.stopPropagation();
                                abrirImagen(fichaAnimal);
                              }}
                              aria-label={`Ampliar imagen de ${nombre}`}
                            >
                              <img
                                className="lista-fichas-tarjeta-imagen"
                                src={urlImagen(fichaAnimal.imagenUrl)}
                                alt={`Imagen de ${nombre}`}
                              />
                            </button>

                            <div className="lista-fichas-tarjeta-media-acciones">
                              <label
                                className="lista-fichas-media-accion"
                                title="Cambiar imagen"
                                onClick={(evento) => evento.stopPropagation()}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  aria-hidden="true"
                                >
                                  upload
                                </span>
                                <span className="lista-fichas-sr-only">
                                  Cambiar imagen de {nombre}
                                </span>
                                <input
                                  type="file"
                                  className="entrada-archivo-oculta"
                                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                  aria-label={`Cambiar imagen de ${nombre}`}
                                  disabled={procesandoImagenId !== null}
                                  onChange={(evento) => {
                                    const archivo =
                                      evento.target.files?.[0] ?? null;
                                    evento.target.value = "";
                                    subirImagen(fichaAnimal, archivo);
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                className="lista-fichas-media-accion lista-fichas-media-accion-peligro"
                                disabled={procesandoImagenId !== null}
                                onClick={(evento) => {
                                  evento.stopPropagation();
                                  quitarImagen(fichaAnimal);
                                }}
                                aria-label={`Quitar imagen de ${nombre}`}
                                title="Quitar imagen"
                              >
                                <span
                                  className="material-symbols-outlined"
                                  aria-hidden="true"
                                >
                                  delete
                                </span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="lista-fichas-tarjeta-sin-foto">
                            <span
                              className="material-symbols-outlined"
                              aria-hidden="true"
                            >
                              pets
                            </span>
                            <span className="lista-fichas-tarjeta-sin-foto-texto">
                              Sin fotografía asignada
                            </span>
                            <label
                              className="lista-fichas-subir-foto"
                              onClick={(evento) => evento.stopPropagation()}
                            >
                              <span
                                className="material-symbols-outlined"
                                aria-hidden="true"
                              >
                                add_a_photo
                              </span>
                              {procesando ? "Guardando..." : "Subir foto"}
                              <input
                                type="file"
                                className="entrada-archivo-oculta"
                                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                aria-label={`Subir foto de ${nombre}`}
                                disabled={procesandoImagenId !== null}
                                onChange={(evento) => {
                                  const archivo =
                                    evento.target.files?.[0] ?? null;
                                  evento.target.value = "";
                                  subirImagen(fichaAnimal, archivo);
                                }}
                              />
                            </label>
                          </div>
                        )}

                        {procesando && fichaAnimal.imagenUrl && (
                          <span className="lista-fichas-tarjeta-guardando">
                            Guardando...
                          </span>
                        )}
                      </div>

                      <div className="lista-fichas-tarjeta-cuerpo">
                        <div className="lista-fichas-tarjeta-info">
                          <span className="lista-fichas-tarjeta-codigo">
                            #{fichaAnimal.codigoAnimal}
                          </span>
                          <h2>{nombre}</h2>
                          <p className="lista-fichas-tarjeta-meta">
                            {textoMeta(fichaAnimal) || "Sin datos adicionales"}
                          </p>
                          <p className="lista-fichas-tarjeta-observaciones">
                            {fichaAnimal.observaciones?.trim() ||
                              "Sin observaciones registradas."}
                          </p>
                        </div>

                        <div className="lista-fichas-tarjeta-pie">
                          <button
                            type="button"
                            className="lista-fichas-boton-ver"
                            onClick={(evento) => {
                              evento.stopPropagation();
                              abrirDetalle(fichaAnimal);
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              aria-hidden="true"
                            >
                              visibility
                            </span>
                            Ver ficha
                          </button>

                          <button
                            type="button"
                            className="lista-fichas-boton-icono"
                            onClick={(evento) => {
                              evento.stopPropagation();
                              abrirHistorial(fichaAnimal);
                            }}
                            aria-label={`Historial de ${nombre}`}
                            title="Historial clínico"
                            disabled={
                              consultandoHistorialId === fichaAnimal.id
                            }
                          >
                            <span
                              className="material-symbols-outlined"
                              aria-hidden="true"
                            >
                              history
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {ventana?.tipo === "sinHistorial" && (
        <VentanaModal
          titulo="Sin registros de ingresos"
          alCerrar={cerrarVentana}
          className="lista-fichas-ventana lista-fichas-ventana-aviso"
        >
          <p className="lista-fichas-aviso-texto">
            No existen registros de ingresos para este animal, ¿desea
            registrar uno?
          </p>

          <div className="lista-fichas-ventana-acciones">
            <button
              type="button"
              className="lista-fichas-ventana-boton lista-fichas-ventana-boton-secundario"
              onClick={cerrarVentana}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="lista-fichas-ventana-boton lista-fichas-ventana-boton-primario"
              onClick={registrarIngresoDesdeModal}
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                add
              </span>
              Registrar ingreso
            </button>
          </div>
        </VentanaModal>
      )}

      {ventana?.tipo === "imagen" && (
        <VentanaModal
          ariaLabel={ventana.ariaLabel}
          alCerrar={cerrarVentana}
          className="ventana-imagen"
        >
          <img
            className="imagen-ampliada"
            src={ventana.src}
            alt={ventana.alt}
          />
        </VentanaModal>
      )}

      {fichaDetalleActual && (
        <VentanaModal
          titulo={`Ficha de ${nombreVisible(fichaDetalleActual)}`}
          alCerrar={cerrarVentana}
          className="lista-fichas-ventana"
        >
          <div className="lista-fichas-detalle">
            {fichaDetalleActual.imagenUrl && (
              <img
                className="lista-fichas-detalle-imagen"
                src={urlImagen(fichaDetalleActual.imagenUrl)}
                alt={`Imagen de ${nombreVisible(fichaDetalleActual)}`}
              />
            )}

            <dl className="lista-fichas-detalle-grid">
              <div>
                <dt>Código</dt>
                <dd>{fichaDetalleActual.codigoAnimal}</dd>
              </div>
              <div>
                <dt>Nombre</dt>
                <dd>{nombreVisible(fichaDetalleActual)}</dd>
              </div>
              <div>
                <dt>Especie</dt>
                <dd>
                  {NOMBRES_ESPECIE[fichaDetalleActual.especie] ??
                    "Otra especie"}
                </dd>
              </div>
              <div>
                <dt>Sexo</dt>
                <dd>
                  {NOMBRES_SEXO[fichaDetalleActual.sexoAnimal] ??
                    "No especificado"}
                </dd>
              </div>
              <div>
                <dt>Raza</dt>
                <dd>{fichaDetalleActual.raza || "No especificada"}</dd>
              </div>
              <div>
                <dt>Edad</dt>
                <dd>
                  {textoEdad(fichaDetalleActual.edad) || "No especificada"}
                </dd>
              </div>
              <div className="lista-fichas-detalle-observaciones">
                <dt>Observaciones</dt>
                <dd>
                  {fichaDetalleActual.observaciones?.trim() ||
                    "Sin observaciones registradas."}
                </dd>
              </div>
            </dl>
          </div>
        </VentanaModal>
      )}
    </>
  );
}
