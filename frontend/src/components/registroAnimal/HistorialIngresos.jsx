import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import VentanaModal from "../ui/VentanaModal.jsx";
import { listarIngresosGlobales } from "../../services/animalesService.js";
import { listarRegistrosMedicos } from "../../services/registroMedicoService.js";
import {
  puedeConsultarRegistroMedico,
  puedeRealizarRevisionFinal,
} from "../../utils/permisosUsuario.js";
import { formatearFecha } from "../../utils/formatoAdopcion.js";
import {
  NOMBRES_ESPECIE,
  codigoAnimalDesdeNumero,
} from "../../utils/registroAnimal.js";
import "../../styles/registroFichas.css";
import "../../styles/listaFichas.css";
import "../../styles/resumenAnimales.css";

function nombreAnimal(ingreso) {
  return (
    ingreso.fichaAnimal?.nombre ||
    ingreso.fichaAnimal?.codigoAnimal ||
    "animal"
  );
}

function codigoAnimal(ingreso) {
  return ingreso.fichaAnimal?.codigoAnimal ?? "—";
}

function etiquetaEspecie(ingreso) {
  return (
    NOMBRES_ESPECIE[ingreso.fichaAnimal?.especie] ??
    ingreso.fichaAnimal?.especie ??
    "Sin información"
  );
}

function textoOIngreso(valor) {
  const texto = String(valor ?? "").trim();
  return texto || "Sin información";
}

function tieneRevisionCompleta(registro) {
  return Boolean(
    registro?.revisionCompleta ||
      ["REALIZADO", "ACTUALIZADO"].includes(registro?.estadoValidacion),
  );
}

export default function HistorialIngresos({ usuario }) {
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const [busqueda, setBusqueda] = useState(
    () => parametros.get("busqueda") ?? "",
  );
  const [filtroEspecie, setFiltroEspecie] = useState("TODOS");
  const [orden, setOrden] = useState("recientes");
  const [historialGlobal, setHistorialGlobal] = useState([]);
  const [cargandoHistorialGlobal, setCargandoHistorialGlobal] = useState(true);
  const [errorHistorialGlobal, setErrorHistorialGlobal] = useState("");
  const [registrosMedicos, setRegistrosMedicos] = useState(null);
  const [errorRegistrosMedicos, setErrorRegistrosMedicos] = useState("");
  const [modalFila, setModalFila] = useState(null);
  const [modalInformacion, setModalInformacion] = useState(null);

  const puedeVerRegistroMedico = puedeConsultarRegistroMedico(usuario);
  const puedeRealizarRevisionCompleta = puedeRealizarRevisionFinal(usuario);
  const cargandoRegistrosMedicos =
    puedeVerRegistroMedico && registrosMedicos === null;

  useEffect(() => {
    let vigente = true;

    listarIngresosGlobales()
      .then((respuesta) => {
        if (!vigente) return;
        setHistorialGlobal(respuesta.ingresos);
        setErrorHistorialGlobal("");
      })
      .catch((error) => {
        if (!vigente) return;
        setErrorHistorialGlobal(error.message);
        setHistorialGlobal([]);
      })
      .finally(() => {
        if (vigente) setCargandoHistorialGlobal(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (!puedeVerRegistroMedico) return undefined;

    let vigente = true;

    listarRegistrosMedicos()
      .then((respuesta) => {
        if (!vigente) return;
        setRegistrosMedicos(respuesta.registros);
        setErrorRegistrosMedicos("");
      })
      .catch((error) => {
        if (!vigente) return;
        setRegistrosMedicos([]);
        setErrorRegistrosMedicos(error.message);
      });

    return () => {
      vigente = false;
    };
  }, [puedeVerRegistroMedico]);

  function cambiarBusqueda(valor) {
    setBusqueda(valor);

    const nuevos = new URLSearchParams(parametros);
    const limpio = valor.trim();

    if (limpio) nuevos.set("busqueda", valor);
    else nuevos.delete("busqueda");

    setParametros(nuevos, { replace: true });
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEspecie("TODOS");
    setOrden("recientes");
    setParametros({}, { replace: true });
  }

  function rutaFicha(ingreso) {
    const idFicha = ingreso.fichaAnimal?.id;

    return idFicha == null
      ? null
      : `/registro/fichas?ficha=${encodeURIComponent(idFicha)}`;
  }

  function abrirModalFila(ingreso) {
    setModalFila({
      ingreso,
      nombre: nombreAnimal(ingreso),
      vista: "acciones",
      registroId: null,
      error: "",
    });
  }

  function cerrarModalFila() {
    setModalFila(null);
  }

  function abrirInformacionIngreso() {
    if (!modalFila) return;

    setModalInformacion(modalFila.ingreso);
    setModalFila(null);
  }

  function volverAOpciones() {
    if (!modalInformacion) return;

    const ingreso = modalInformacion;
    setModalInformacion(null);
    abrirModalFila(ingreso);
  }

  function cerrarInformacion() {
    setModalInformacion(null);
  }

  function verFichaDesdeModal() {
    if (!modalFila) return;

    const ruta = rutaFicha(modalFila.ingreso);
    setModalFila(null);

    if (ruta) navegar(ruta);
  }

  function verRegistroMedicoDesdeModal() {
    if (!modalFila) return;

    if (errorRegistrosMedicos) {
      setModalFila((actual) => ({
        ...actual,
        vista: "sinRegistro",
        registroId: null,
        error: errorRegistrosMedicos,
      }));
      return;
    }

    const idFicha = modalFila.ingreso.fichaAnimal?.id;
    const registro = (registrosMedicos ?? []).find(
      (item) => item.animalId === idFicha,
    );

    if (tieneRevisionCompleta(registro)) {
      setModalFila(null);
      navegar(
        `/salud/registros-medicos/historial?registro=${encodeURIComponent(registro.id)}`,
      );
      return;
    }

    setModalFila((actual) => ({
      ...actual,
      vista: "sinRegistro",
      registroId: registro?.id ?? null,
      error: "",
    }));
  }

  function irARevisionCompleta() {
    if (!modalFila?.registroId) return;

    const registroId = modalFila.registroId;
    setModalFila(null);
    navegar(
      `/salud/registros-medicos/revisiones?registro=${encodeURIComponent(
        registroId,
      )}`,
    );
  }

  const termino = busqueda.trim().toLowerCase();
  const codigoNumerico = /^\d+$/.test(termino)
    ? codigoAnimalDesdeNumero(termino)
    : "";

  const ingresosFiltrados = historialGlobal
    .filter((ingreso) => {
      const ficha = ingreso.fichaAnimal ?? {};

      if (filtroEspecie !== "TODOS" && ficha.especie !== filtroEspecie) {
        return false;
      }

      if (!termino) return true;

      const coincideTexto = [ficha.codigoAnimal, ficha.nombre, ficha.raza].some(
        (valor) => String(valor ?? "").toLowerCase().includes(termino),
      );

      if (coincideTexto) return true;

      return (
        Boolean(codigoNumerico) &&
        String(ficha.codigoAnimal ?? "")
          .toLowerCase()
          .includes(codigoNumerico)
      );
    })
    .sort((a, b) => {
      if (orden === "az") {
        const nombreA =
          a.fichaAnimal?.nombre || a.fichaAnimal?.codigoAnimal || "";
        const nombreB =
          b.fichaAnimal?.nombre || b.fichaAnimal?.codigoAnimal || "";

        return String(nombreA).localeCompare(String(nombreB), "es", {
          sensitivity: "base",
        });
      }

      if (orden === "codigo") {
        return String(a.fichaAnimal?.codigoAnimal ?? "").localeCompare(
          String(b.fichaAnimal?.codigoAnimal ?? ""),
          "es",
          { sensitivity: "base" },
        );
      }

      return (
        new Date(b.fechaIngreso).getTime() -
          new Date(a.fechaIngreso).getTime() || b.id - a.id
      );
    });

  const totalIngresos = historialGlobal.length;
  const totalPerros = historialGlobal.filter(
    (ingreso) => ingreso.fichaAnimal?.especie === "PERRO",
  ).length;
  const totalGatos = historialGlobal.filter(
    (ingreso) => ingreso.fichaAnimal?.especie === "GATO",
  ).length;
  const totalOtras = historialGlobal.filter(
    (ingreso) => ingreso.fichaAnimal?.especie === "OTRO",
  ).length;
  const hayFiltros = Boolean(termino) || filtroEspecie !== "TODOS";

  const totalIngresosFiltrados = ingresosFiltrados.filter(
    (ingreso) => ingreso.tipo === "INGRESO",
  ).length;
  const totalReingresosFiltrados = ingresosFiltrados.filter(
    (ingreso) => ingreso.tipo === "REINGRESO",
  ).length;

  const valorTotal = cargandoHistorialGlobal
    ? "…"
    : errorHistorialGlobal
      ? "—"
      : ingresosFiltrados.length;
  const valorIngresos = cargandoHistorialGlobal
    ? "…"
    : errorHistorialGlobal
      ? "—"
      : totalIngresosFiltrados;
  const valorReingresos = cargandoHistorialGlobal
    ? "…"
    : errorHistorialGlobal
      ? "—"
      : totalReingresosFiltrados;

  return (
    <section className="historial-contenido">
      <header className="historial-encabezado">
        <div className="historial-titulos">
          <span className="historial-eyebrow">
            Registro Operativo · Control de Ingresos
          </span>
          <h1>Historial de ingresos</h1>
        </div>

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
                {valorTotal}
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
              <span className="lista-fichas-resumen-label">Ingresos</span>
              <span className="lista-fichas-resumen-valor">
                {valorIngresos}
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
              <span className="lista-fichas-resumen-label">Reingresos</span>
              <span className="lista-fichas-resumen-valor">
                {valorReingresos}
              </span>
            </div>
          </div>
        </div>
      </header>

      <section
        className="lista-fichas-filtros"
        aria-label="Filtros del historial"
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
              id="busquedaHistorial"
              type="search"
              value={busqueda}
              onChange={(evento) => cambiarBusqueda(evento.target.value)}
              placeholder="Buscar por nombre, código o raza (ej: Gretel, anim-001)..."
              aria-label="Buscar por nombre, código o raza"
            />
          </div>

          <select
            className="lista-fichas-select"
            value={orden}
            onChange={(evento) => setOrden(evento.target.value)}
            aria-label="Ordenar ingresos"
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
            Todos ({totalIngresos})
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

      <div className="historial-aviso-acciones" role="note">
        <span className="material-symbols-outlined" aria-hidden="true">
          touch_app
        </span>
        <span>
          Haz clic sobre una fila para elegir entre ver la ficha del animal o
          consultar su registro médico.
        </span>
      </div>

      <section className="historial-tabla-card">
        {cargandoHistorialGlobal && (
          <p className="historial-estado">Cargando historial...</p>
        )}

        {!cargandoHistorialGlobal && errorHistorialGlobal && (
          <p className="historial-estado historial-estado-error">
            No se pudo cargar el historial: {errorHistorialGlobal}
          </p>
        )}

        {!cargandoHistorialGlobal &&
          !errorHistorialGlobal &&
          historialGlobal.length === 0 && (
            <div className="historial-vacio">
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                search_off
              </span>
              <p className="historial-vacio-titulo">
                Todavía no hay ingresos registrados
              </p>
              <p className="historial-vacio-texto">
                Los ingresos aparecerán aquí cuando se registren.
              </p>
            </div>
          )}

        {!cargandoHistorialGlobal &&
          !errorHistorialGlobal &&
          historialGlobal.length > 0 &&
          ingresosFiltrados.length === 0 && (
            <div className="historial-vacio">
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                search_off
              </span>
              <p className="historial-vacio-titulo">
                No se encontraron ingresos con estos filtros
              </p>
              <p className="historial-vacio-texto">
                {hayFiltros
                  ? "Intenta cambiar el término de búsqueda, la especie o restablecer los filtros."
                  : "No hay ingresos que coincidan con la búsqueda."}
              </p>
            </div>
          )}

        {!cargandoHistorialGlobal &&
          !errorHistorialGlobal &&
          ingresosFiltrados.length > 0 && (
            <div className="historial-tabla-scroll">
              <table className="historial-tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresosFiltrados.map((ingreso) => (
                    <tr
                      className="historial-fila historial-fila-clickable"
                      key={ingreso.id}
                      tabIndex={0}
                      onClick={() => abrirModalFila(ingreso)}
                      onKeyDown={(evento) => {
                        if (evento.key === "Enter" || evento.key === " ") {
                          evento.preventDefault();
                          abrirModalFila(ingreso);
                        }
                      }}
                    >
                      <td className="historial-codigo">
                        {codigoAnimal(ingreso)}
                      </td>
                      <td className="historial-nombre">
                        {ingreso.fichaAnimal?.nombre || "Sin nombre"}
                      </td>
                      <td>
                        <span
                          className={`historial-tipo ${
                            ingreso.tipo === "INGRESO"
                              ? "historial-tipo-ingreso"
                              : "historial-tipo-reingreso"
                          }`}
                        >
                          <span
                            className="historial-tipo-punto"
                            aria-hidden="true"
                          />
                          {ingreso.tipo === "INGRESO"
                            ? "Ingreso"
                            : "Reingreso"}
                        </span>
                      </td>
                      <td>{formatearFecha(ingreso.fechaIngreso)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {modalFila && (
        <VentanaModal
          titulo={
            modalFila.vista === "acciones"
              ? `Acciones para “${modalFila.nombre}”`
              : "Registro médico"
          }
          alCerrar={cerrarModalFila}
          className="historial-modal-acciones"
        >
          {modalFila.vista === "acciones" ? (
            <div className="historial-modal-acciones-cuerpo">
              <p className="historial-modal-acciones-texto">
                ¿Qué deseas consultar para{" "}
                <strong>“{modalFila.nombre}”</strong>?
              </p>

              <div className="historial-modal-acciones-lista">
                <button
                  type="button"
                  className="historial-modal-accion"
                  onClick={verFichaDesdeModal}
                  disabled={!rutaFicha(modalFila.ingreso)}
                >
                  <span
                    className="material-symbols-outlined historial-modal-accion-icono"
                    aria-hidden="true"
                  >
                    pets
                  </span>
                  <span className="historial-modal-accion-texto">
                    <strong>Ver ficha del animal</strong>
                    <small>Consulta sus datos generales y fotografía.</small>
                  </span>
                  <span
                    className="material-symbols-outlined historial-modal-accion-flecha"
                    aria-hidden="true"
                  >
                    chevron_right
                  </span>
                </button>

                {puedeVerRegistroMedico && (
                  <button
                    type="button"
                    className="historial-modal-accion"
                    onClick={verRegistroMedicoDesdeModal}
                    disabled={cargandoRegistrosMedicos}
                  >
                    <span
                      className="material-symbols-outlined historial-modal-accion-icono historial-modal-accion-icono--medico"
                      aria-hidden="true"
                    >
                      stethoscope
                    </span>
                    <span className="historial-modal-accion-texto">
                      <strong>
                        {cargandoRegistrosMedicos
                          ? "Cargando registro..."
                          : "Ver registro médico"}
                      </strong>
                      <small>
                        {cargandoRegistrosMedicos
                          ? "Estamos consultando los registros clínicos."
                          : "Revisa la ficha clínica y sus datos."}
                      </small>
                    </span>
                    <span
                      className="material-symbols-outlined historial-modal-accion-flecha"
                      aria-hidden="true"
                    >
                      chevron_right
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  className="historial-modal-accion"
                  onClick={abrirInformacionIngreso}
                >
                  <span
                    className="material-symbols-outlined historial-modal-accion-icono historial-modal-accion-icono--info"
                    aria-hidden="true"
                  >
                    description
                  </span>
                  <span className="historial-modal-accion-texto">
                    <strong>Ver información completa del ingreso</strong>
                    <small>
                      Consulta procedencia, receptor, ubicación y estado de
                      salud.
                    </small>
                  </span>
                  <span
                    className="material-symbols-outlined historial-modal-accion-flecha"
                    aria-hidden="true"
                  >
                    chevron_right
                  </span>
                </button>
              </div>

              <div className="historial-modal-acciones-pie">
                <button
                  type="button"
                  className="historial-modal-registro-boton historial-modal-registro-boton--secundario"
                  onClick={cerrarModalFila}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="historial-modal-registro-cuerpo">
              <span
                className="material-symbols-outlined historial-modal-registro-icono"
                aria-hidden="true"
              >
                medical_information
              </span>

              {modalFila.error ? (
                <p className="historial-modal-registro-texto">
                  No se pudo consultar el registro médico: {modalFila.error}
                </p>
              ) : (
                <p className="historial-modal-registro-texto">
                  No se encuentra un registro médico para{" "}
                  <strong>“{modalFila.nombre}”</strong>.
                </p>
              )}

              <div className="historial-modal-registro-acciones">
                {puedeRealizarRevisionCompleta &&
                  !modalFila.error &&
                  Boolean(modalFila.registroId) && (
                    <button
                      type="button"
                      className="historial-modal-registro-boton historial-modal-registro-boton--principal"
                      onClick={irARevisionCompleta}
                    >
                      Sí, realizar registro médico completo
                    </button>
                  )}

                <button
                  type="button"
                  className="historial-modal-registro-boton historial-modal-registro-boton--secundario"
                  onClick={cerrarModalFila}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </VentanaModal>
      )}

      {modalInformacion && (
        <VentanaModal
          titulo="Información completa del ingreso"
          alCerrar={cerrarInformacion}
          className="historial-modal-informacion"
        >
          <div className="historial-modal-informacion-cuerpo">
            <p className="historial-modal-informacion-subtitulo">
              <strong>{nombreAnimal(modalInformacion)}</strong>
              <span>{codigoAnimal(modalInformacion)}</span>
            </p>

            <section className="historial-modal-informacion-seccion">
              <h3>Animal</h3>
              <dl className="historial-modal-informacion-grid">
                <div className="historial-modal-informacion-dato">
                  <dt>Código</dt>
                  <dd>{codigoAnimal(modalInformacion)}</dd>
                </div>
                <div className="historial-modal-informacion-dato">
                  <dt>Nombre</dt>
                  <dd>
                    {textoOIngreso(modalInformacion.fichaAnimal?.nombre)}
                  </dd>
                </div>
                <div className="historial-modal-informacion-dato">
                  <dt>Especie</dt>
                  <dd>{etiquetaEspecie(modalInformacion)}</dd>
                </div>
                <div className="historial-modal-informacion-dato">
                  <dt>Raza</dt>
                  <dd>{textoOIngreso(modalInformacion.fichaAnimal?.raza)}</dd>
                </div>
              </dl>
            </section>

            <section className="historial-modal-informacion-seccion">
              <h3>Ingreso</h3>
              <dl className="historial-modal-informacion-grid">
                <div className="historial-modal-informacion-dato">
                  <dt>Tipo</dt>
                  <dd>
                    {modalInformacion.tipo === "INGRESO"
                      ? "Ingreso"
                      : "Reingreso"}
                  </dd>
                </div>
                <div className="historial-modal-informacion-dato">
                  <dt>Fecha de ingreso</dt>
                  <dd>{formatearFecha(modalInformacion.fechaIngreso)}</dd>
                </div>
                <div className="historial-modal-informacion-dato">
                  <dt>Procedencia</dt>
                  <dd>{textoOIngreso(modalInformacion.procedencia)}</dd>
                </div>
                <div className="historial-modal-informacion-dato">
                  <dt>Receptor</dt>
                  <dd>{textoOIngreso(modalInformacion.receptor?.nombre)}</dd>
                </div>
              </dl>
            </section>

            <section className="historial-modal-informacion-seccion">
              <h3>Ubicación y salud</h3>
              <dl className="historial-modal-informacion-grid">
                <div className="historial-modal-informacion-dato">
                  <dt>Ubicación encontrada</dt>
                  <dd>
                    {textoOIngreso(modalInformacion.ubicacionEncontrado)}
                  </dd>
                </div>
                <div className="historial-modal-informacion-dato">
                  <dt>Estado de salud</dt>
                  <dd>{textoOIngreso(modalInformacion.estadoSalud)}</dd>
                </div>
              </dl>
            </section>

            <div className="historial-modal-informacion-acciones">
              <button
                type="button"
                className="historial-modal-registro-boton historial-modal-registro-boton--secundario"
                onClick={volverAOpciones}
              >
                Volver a las opciones
              </button>
              <button
                type="button"
                className="historial-modal-registro-boton historial-modal-registro-boton--principal"
                onClick={cerrarInformacion}
              >
                Cerrar
              </button>
            </div>
          </div>
        </VentanaModal>
      )}
    </section>
  );
}
