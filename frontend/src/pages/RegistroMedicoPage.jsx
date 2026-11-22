import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  listarRegistrosMedicos,
  obtenerRegistroMedico,
  registrarRevisionInicial,
  actualizarRevisionInicial,
  realizarRevisionFinal,
  iniciarActualizacion,
  guardarActualizacion,
  cancelarActualizacion,
  listarHistorialMedico,
  listarSeguimientosMedico,
  descargarReporteMedicoPdf,
} from "../services/registroMedicoService.js";
import BandejaRegistros from "../components/registroMedico/BandejaRegistros.jsx";
import RevisionInicialForm from "../components/registroMedico/RevisionInicialForm.jsx";
import ActualizacionForm from "../components/registroMedico/ActualizacionForm.jsx";
import HistorialMedico from "../components/registroMedico/HistorialMedico.jsx";
import SeguimientosMedicos from "../components/registroMedico/SeguimientosMedicos.jsx";
import RevisionCompletaDetalle from "../components/registroMedico/RevisionCompletaDetalle.jsx";
import FichaMedicaModal from "../components/registroMedico/FichaMedicaModal.jsx";
import ModalConfirmacionRevision from "../components/registroMedico/ModalConfirmacionRevision.jsx";
import VentanaModal from "../components/ui/VentanaModal.jsx";
import RevisionInicialVista from "../components/registroMedico/RevisionInicialVista.jsx";
import RevisionCompletaVista from "../components/registroMedico/RevisionCompletaVista.jsx";
import {
  puedeActualizarRegistroMedico,
  puedeActualizarRevisionInicial,
  puedeRealizarRevisionFinal,
  puedeRegistrarRevisionInicial,
} from "../utils/permisosUsuario.js";
import { formatearFecha } from "../utils/formatoAdopcion.js";
import {
  FILTROS_HISTORIAL_VACIOS,
  aplicarFiltrosHistorial,
  contarAlDia,
  contarPorEstado,
  contarRevisionesIniciales,
  describirFiltrosActivos,
  hayFiltrosActivos,
  ordenarRegistros,
} from "../utils/filtrosHistorialMedico.js";
import "../styles/registroMedico.css";

const PILDORAS_PENDIENTES = [
  { valor: "", texto: "Todas las pendientes", clave: "todas" },
  { valor: "PROVISIONAL", texto: "Revisión inicial", clave: "inicial" },
  {
    valor: "VALIDACION_PENDIENTE",
    texto: "Revisión completa",
    clave: "completa",
  },
];

function esRevisionPendiente(registro) {
  return ["PROVISIONAL", "VALIDACION_PENDIENTE"].includes(
    registro?.estadoValidacion,
  );
}

const PILDORAS_ESTADO = [
  { valor: "", texto: "Todos los registros", clave: "todos" },
  { valor: "PROVISIONAL", texto: "Revisión inicial", clave: "inicial" },
  { valor: "ACTUALIZADO", texto: "Actualizados / Al día", clave: "actualizados" },
  { valor: "REALIZADO", texto: "Revisiones realizadas", clave: "realizadas" },
];

const ESPECIES_HISTORIAL = [
  { valor: "", texto: "Todas las especies" },
  { valor: "PERRO", texto: "Caninos (Perros)" },
  { valor: "GATO", texto: "Felinos (Gatos)" },
  { valor: "OTRO", texto: "Otras especies" },
];

const TAMANO_PAGINA = 10;

const ORDENES = [
  { valor: "recientes", texto: "Más recientes primero" },
  { valor: "antiguos", texto: "Más antiguos primero" },
  { valor: "codigo", texto: "Por código (A-Z)" },
  { valor: "nombre", texto: "Por nombre paciente" },
];

export default function RegistroMedicoPage({
  usuario,
  modo = "revisiones",
  filtros = FILTROS_HISTORIAL_VACIOS,
  onFiltrosChange,
}) {
  const esHistorial = modo === "historial";
  const [parametros, setParametros] = useSearchParams();
  const registroParam = parametros.get("registro");
  const [filtro, setFiltro] = useState("");
  const [resultado, setResultado] = useState({ filtro: null, registros: [], error: "" });
  const [busquedaPendientes, setBusquedaPendientes] = useState("");
  const [especiePendientes, setEspeciePendientes] = useState("");
  const [ordenPendientes, setOrdenPendientes] = useState("recientes");
  const [seleccionadoIdEstado, setSeleccionadoId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [errorDetalle, setErrorDetalle] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [historial, setHistorial] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [correccionVisible, setCorreccionVisible] = useState(false);
  const [correccionEnCompleta, setCorreccionEnCompleta] = useState(false);
  const [edicionActiva, setEdicionActiva] = useState(false);
  const [confirmacionRevision, setConfirmacionRevision] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState("");

  const esVeterinaria = puedeActualizarRegistroMedico(usuario);
  const filtrosPendientes = {
    ...FILTROS_HISTORIAL_VACIOS,
    estado: filtro,
    busqueda: busquedaPendientes,
    especie: especiePendientes,
    orden: ordenPendientes,
  };

  const idRegistroUrl = (() => {
    if (!registroParam) return null;

    const id = Number(registroParam);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
  })();
  const seleccionadoId = seleccionadoIdEstado ?? idRegistroUrl;

  const limpiarParametroRegistro = useCallback(() => {
    if (!parametros.has("registro")) return;

    const siguientes = new URLSearchParams(parametros);
    siguientes.delete("registro");
    setParametros(siguientes, { replace: true });
  }, [parametros, setParametros]);

  const cambiarFiltros = useCallback(
    (nuevosFiltros) => {
      if (esHistorial) {
        setPagina(1);
        onFiltrosChange?.(nuevosFiltros);
        return;
      }
      setPagina(1);
      setFiltro(nuevosFiltros.estado ?? "");
      setBusquedaPendientes(nuevosFiltros.busqueda ?? "");
      setEspeciePendientes(nuevosFiltros.especie ?? "");
      setOrdenPendientes(nuevosFiltros.orden ?? "recientes");
      setSeleccionadoId(null);
      setDetalle(null);
      setHistorial([]);
      setSeguimientos([]);
      setMensaje("");
      setCorreccionVisible(false);
      setCorreccionEnCompleta(false);
      setEdicionActiva(false);
      setConfirmacionRevision(null);
      limpiarParametroRegistro();
    },
    [esHistorial, onFiltrosChange, limpiarParametroRegistro],
  );

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      setResultado({ filtro: null, registros: [], error: "", cargando: true });
      try {
        const respuesta = await listarRegistrosMedicos();
        if (vigente) {
          setResultado({
            filtro: "",
            registros: respuesta.registros,
            error: "",
            cargando: false,
          });
        }
      } catch (error) {
        if (vigente) setResultado({ filtro: null, registros: [], error: error.message, cargando: false });
      }
    }

    void cargar();
    return () => { vigente = false; };
  }, [esHistorial]);

  useEffect(() => {
    if (!seleccionadoId) return;

    let vigente = true;
    obtenerRegistroMedico(seleccionadoId)
      .then((respuesta) => {
        if (vigente) setDetalle(respuesta.registro);
      })
      .catch((error) => {
        if (vigente) setErrorDetalle(error.message);
      });

    if (esVeterinaria) {
      listarHistorialMedico(seleccionadoId)
        .then((respuesta) => { if (vigente) setHistorial(respuesta.historial); })
        .catch(() => {});
      listarSeguimientosMedico(seleccionadoId)
        .then((respuesta) => { if (vigente) setSeguimientos(respuesta.seguimientos); })
        .catch(() => {});
    }

    return () => { vigente = false; };
  }, [seleccionadoId, esVeterinaria]);

  function seleccionarRegistro(id) {
    setSeleccionadoId(id);
    setDetalle(null);
    setErrorDetalle("");
    setHistorial([]);
    setSeguimientos([]);
    setCorreccionVisible(false);
    setCorreccionEnCompleta(false);
    setEdicionActiva(false);
    limpiarParametroRegistro();
  }

  function cerrarDetalle() {
    setSeleccionadoId(null);
    setDetalle(null);
    setErrorDetalle("");
    setHistorial([]);
    setSeguimientos([]);
    setMensaje("");
    setCorreccionVisible(false);
    setCorreccionEnCompleta(false);
    setEdicionActiva(false);
    setConfirmacionRevision(null);
    limpiarParametroRegistro();
  }

  function cambiarFiltro(valor) {
    const base = esHistorial ? filtros : filtrosPendientes;
    cambiarFiltros({ ...base, estado: valor });
  }

  function limpiarFiltros() {
    if (esHistorial) {
      setPagina(1);
      onFiltrosChange?.(FILTROS_HISTORIAL_VACIOS);
      return;
    }
    cambiarFiltros({ ...FILTROS_HISTORIAL_VACIOS, estado: "" });
  }

  async function manejarExportarReporte() {
    setExportando(true);
    setErrorExportacion("");

    try {
      const filtrosVigentes = esHistorial ? filtros : filtrosPendientes;
      const pildoraActiva = (esHistorial ? PILDORAS_ESTADO : PILDORAS_PENDIENTES).find(
        (opcion) => opcion.valor === filtrosVigentes.estado,
      );
      const descripcionesFiltros = describirFiltrosActivos(filtrosVigentes).map(
        (chip) => chip.etiqueta,
      );
      if (pildoraActiva) descripcionesFiltros.unshift(pildoraActiva.texto);

      await descargarReporteMedicoPdf({
        ids: registros.map((registro) => registro.id),
        titulo: esHistorial
          ? "Historial de registros médicos"
          : "Revisiones médicas pendientes",
        descripcionesFiltros,
      });
    } catch (error) {
      setErrorExportacion(
        error?.message || "No se pudo generar el reporte médico",
      );
    } finally {
      setExportando(false);
    }
  }

  async function refrescar() {
    const respuesta = await listarRegistrosMedicos();
    setResultado({ filtro: "", registros: respuesta.registros, error: "", cargando: false });
    if (seleccionadoId) {
      const detalleRespuesta = await obtenerRegistroMedico(seleccionadoId);
      setDetalle(detalleRespuesta.registro);
      if (esVeterinaria) {
        const historialRespuesta = await listarHistorialMedico(seleccionadoId);
        setHistorial(historialRespuesta.historial);
        const seguimientosRespuesta = await listarSeguimientosMedico(seleccionadoId);
        setSeguimientos(seguimientosRespuesta.seguimientos);
      }
    }
  }

  async function manejarRevisionInicial(datos) {
    const respuesta = await registrarRevisionInicial(seleccionadoId, datos);
    setMensaje(respuesta.message);
    await refrescar();
    abrirConfirmacion("inicial", respuesta.registroMedico ?? detalle);
    return respuesta;
  }

  async function manejarIniciar() {
    const respuesta = await iniciarActualizacion(seleccionadoId);
    setMensaje(respuesta.message);
    await refrescar();
    setEdicionActiva(true);
    return respuesta;
  }

  async function manejarGuardarActualizacion(datos) {
    const respuesta = await guardarActualizacion(seleccionadoId, datos);
    setMensaje(respuesta.message);
    await refrescar();
    setEdicionActiva(false);
    return respuesta;
  }

  async function manejarCancelarActualizacion() {
    await cancelarActualizacion(seleccionadoId);
    setMensaje("Actualización cancelada correctamente");
    await refrescar();
    setEdicionActiva(false);
  }

  async function manejarCorreccionInicial(datos) {
    const respuesta = await actualizarRevisionInicial(seleccionadoId, datos);
    setMensaje(respuesta.message);
    await refrescar();
    return respuesta;
  }

  async function manejarRevisionFinal(datos) {
    const respuesta = await realizarRevisionFinal(seleccionadoId, datos);
    setMensaje(respuesta.message);
    await refrescar();
    abrirConfirmacion("completa", respuesta.registroMedico ?? detalle);
    return respuesta;
  }

  function abrirConfirmacion(tipo, registro) {
    setConfirmacionRevision({
      tipo,
      registro: registro ?? detalle,
      fecha: new Date().toISOString(),
    });
  }

  function confirmarAceptar() {
    setConfirmacionRevision(null);
    const siguienteEstado = confirmacionRevision?.tipo === "inicial" ? "VALIDACION_PENDIENTE" : "REALIZADO";
    if (esHistorial) {
      setPagina(1);
      onFiltrosChange?.({ ...filtros, estado: siguienteEstado });
    } else {
      cambiarFiltro(siguienteEstado);
    }
    cerrarDetalle();
  }

  function confirmarVerExpediente() {
    setConfirmacionRevision(null);
  }

  const puedeRevisionInicial = detalle && puedeRegistrarRevisionInicial(usuario);
  const puedeCorregir = detalle && puedeActualizarRevisionInicial(usuario) && detalle.revisionInicial && !detalle.revisionInicial.fechaActualizacion;
  const puedeRevisionFinal = detalle && puedeRealizarRevisionFinal(usuario) && detalle.estadoValidacion === "VALIDACION_PENDIENTE";
  const puedeActualizar = detalle && puedeActualizarRegistroMedico(usuario) && (detalle.estadoValidacion === "REALIZADO" || detalle.estadoValidacion === "ACTUALIZADO" || detalle.estadoValidacion === "REVISANDO");
  const editandoModal =
    (detalle?.estadoValidacion === "REVISANDO" && esVeterinaria) ||
    edicionActiva;

  const registrosPendientes = resultado.registros.filter(esRevisionPendiente);
  const registros = esHistorial
    ? ordenarRegistros(aplicarFiltrosHistorial(resultado.registros, filtros), filtros.orden)
    : ordenarRegistros(
        aplicarFiltrosHistorial(registrosPendientes, filtrosPendientes),
        filtrosPendientes.orden,
      );
  const cargando = resultado.cargando;
  const error = resultado.error;
  const hayFiltrosHistorial = Boolean(filtros) && hayFiltrosActivos(filtros);
  const hayFiltrosPendientes = Boolean(
    filtro || busquedaPendientes || especiePendientes,
  );

  const conteos = contarPorEstado(resultado.registros);
  const totalPildoras = esHistorial
    ? {
        todos: conteos.total,
        inicial: conteos.PROVISIONAL ?? 0,
        actualizados: conteos.ACTUALIZADO ?? 0,
        realizadas: conteos.REALIZADO ?? 0,
      }
    : {
        todas: registrosPendientes.length,
        inicial: registrosPendientes.filter(
          (registro) => registro.estadoValidacion === "PROVISIONAL",
        ).length,
        completa: registrosPendientes.filter(
          (registro) => registro.estadoValidacion === "VALIDACION_PENDIENTE",
        ).length,
      };
  const totalRegistros = registros.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / TAMANO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const indiceInicio = (paginaActual - 1) * TAMANO_PAGINA;
  const indiceFin = Math.min(indiceInicio + TAMANO_PAGINA, totalRegistros);
  const registrosVisibles = registros.slice(indiceInicio, indiceFin);

  const vistaListado = (
    <>
      {cargando && <p role="status">Cargando registros...</p>}
      {!cargando && error && <p className="mensaje mensaje-error">{error}</p>}
      {!cargando && !error && (
        <div className="historial-tarjeta">
          <BandejaRegistros
            registros={registrosVisibles}
            seleccionadoId={seleccionadoId}
            onSeleccionar={seleccionarRegistro}
            cargando={false}
            modo="historial"
            hayFiltros={esHistorial ? hayFiltrosHistorial : hayFiltrosPendientes}
            onLimpiarFiltros={limpiarFiltros}
          />
          <footer className="historial-paginacion">
            <p className="historial-paginacion-texto">
              Mostrando{" "}
              <strong>
                {totalRegistros ? indiceInicio + 1 : 0}-{indiceFin}
              </strong>{" "}
              de <strong>{totalRegistros}</strong>{" "}
              {esHistorial ? "registros médicos" : "revisiones pendientes"}
            </p>
            <nav aria-label="Paginación de registros médicos" className="historial-paginacion-nav">
              <button
                type="button"
                className="historial-paginacion-boton"
                aria-label="Página anterior"
                disabled={paginaActual <= 1}
                onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
              >
                <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
              </button>
              <button type="button" aria-current="page" className="historial-paginacion-boton activa">
                {paginaActual}
              </button>
              <button
                type="button"
                className="historial-paginacion-boton"
                aria-label="Página siguiente"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
              >
                <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </button>
            </nav>
          </footer>
        </div>
      )}
    </>
  );

  return (
    <section
      className={`registro-medico registro-medico--historial ${
        esHistorial ? "" : "registro-medico--revisiones"
      }`.trim()}
    >
      <div className="historial-contenido">
          <div className="historial-migas">
            <nav aria-label="Migas de pan" className="historial-breadcrumb">
              <Link to="/salud/registros-medicos" className="historial-breadcrumb-link">
                <span className="material-symbols-outlined" aria-hidden="true">home</span>
                <span>Control Clínico</span>
              </Link>
              <span className="material-symbols-outlined historial-breadcrumb-sep" aria-hidden="true">
                chevron_right
              </span>
              <span className="historial-breadcrumb-actual">
                {esHistorial ? "Registro médico" : "Revisiones pendientes"}
              </span>
            </nav>
            <Link to="/salud/registros-medicos" className="historial-volver">
              <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
              <span>Volver al listado</span>
            </Link>
          </div>

          {!esHistorial && mensaje && (
            <p className="mensaje mensaje-exito">{mensaje}</p>
          )}

          <div className="historial-bloque-cabecera">
            <header className="historial-cabecera">
              <div className="historial-cabecera-texto">
              <span className="historial-eyebrow">
                {esHistorial
                  ? "CONTROL CLÍNICO · REVISIONES Y SEGUIMIENTO"
                  : "CONTROL CLÍNICO · REVISIONES PENDIENTES"}
              </span>
              <h1>
                {esHistorial
                  ? "Historial de Registros Médicos"
                  : "Revisiones Médicas Pendientes"}
              </h1>
              <p>
                {esHistorial
                  ? "Consulta, filtra y gestiona las fichas clínicas y evaluaciones veterinarias de cada paciente."
                  : "Registra y completa las evaluaciones iniciales y revisiones clínicas que aún están pendientes."}
              </p>
            </div>
            <div className="historial-acciones">
              <button
                type="button"
                className="historial-boton historial-boton--secundario"
                onClick={manejarExportarReporte}
                disabled={exportando}
                aria-busy={exportando}
              >
                <span className="material-symbols-outlined" aria-hidden="true">download</span>
                <span>{exportando ? "Generando reporte..." : "Exportar reporte"}</span>
              </button>
            </div>
          </header>

          {errorExportacion && (
            <p className="mensaje mensaje-error historial-exportacion-error" role="alert">
              {errorExportacion}
            </p>
          )}

          <div
            className={`historial-metricas${esHistorial ? "" : " historial-metricas--tres"}`}
            role="status"
            aria-live="polite"
          >
            {esHistorial ? (
              <>
            <div className="historial-metrica">
              <div className="historial-metrica-icono historial-metrica-icono--neutro">
                <span className="material-symbols-outlined" aria-hidden="true">folder_shared</span>
              </div>
              <div className="historial-metrica-datos">
                <strong id="records-count">{totalRegistros}</strong>
                <span>Total Evaluaciones</span>
              </div>
            </div>
            <div className="historial-metrica">
              <div className="historial-metrica-icono historial-metrica-icono--terciario">
                <span className="material-symbols-outlined" aria-hidden="true">pending_actions</span>
              </div>
              <div className="historial-metrica-datos">
                <strong>{contarRevisionesIniciales(resultado.registros)}</strong>
                <span>Revisiones Iniciales</span>
              </div>
            </div>
            <div className="historial-metrica">
              <div className="historial-metrica-icono historial-metrica-icono--primario">
                <span className="material-symbols-outlined" aria-hidden="true">verified</span>
              </div>
              <div className="historial-metrica-datos">
                <strong>{contarAlDia(resultado.registros)}</strong>
                <span>Actualizados / Al Día</span>
              </div>
            </div>
              </>
            ) : (
              <>
                <div className="historial-metrica">
                  <div className="historial-metrica-icono historial-metrica-icono--neutro">
                    <span className="material-symbols-outlined" aria-hidden="true">pending_actions</span>
                  </div>
                  <div className="historial-metrica-datos">
                    <strong id="records-count">{registrosPendientes.length}</strong>
                    <span>Total pendientes</span>
                  </div>
                </div>
                <div className="historial-metrica">
                  <div className="historial-metrica-icono historial-metrica-icono--terciario">
                    <span className="material-symbols-outlined" aria-hidden="true">stethoscope</span>
                  </div>
                  <div className="historial-metrica-datos">
                    <strong>{totalPildoras.inicial}</strong>
                    <span>Revisión inicial</span>
                  </div>
                </div>
                <div className="historial-metrica">
                  <div className="historial-metrica-icono historial-metrica-icono--primario">
                    <span className="material-symbols-outlined" aria-hidden="true">assignment_turned_in</span>
                  </div>
                  <div className="historial-metrica-datos">
                    <strong>{totalPildoras.completa}</strong>
                    <span>Revisión completa</span>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>

          <div className="historial-pildoras" role="tablist" aria-label="Filtrar por estado">
            {(esHistorial ? PILDORAS_ESTADO : PILDORAS_PENDIENTES).map((pildora) => {
              const activa = (esHistorial ? filtros.estado : filtro) === pildora.valor;
              return (
                <button
                  key={pildora.clave}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  className={`historial-pildora historial-pildora--${pildora.clave}${
                    activa ? " activa" : ""
                  }`}
                  onClick={() => cambiarFiltro(pildora.valor)}
                >
                  {pildora.clave !== "todos" && pildora.clave !== "todas" && (
                    <span className="historial-pildora-punto" aria-hidden="true" />
                  )}
                  <span>{pildora.texto}</span>
                  <span className="historial-pildora-contador">
                    {totalPildoras[pildora.clave]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="historial-toolbar">
            <div className="historial-busqueda">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                type="search"
                placeholder="Buscar por nombre de animal (ej: Gretel), código (anim-001) o tutor..."
                value={esHistorial ? filtros.busqueda ?? "" : busquedaPendientes}
                onChange={(evento) => {
                  const base = esHistorial ? filtros : filtrosPendientes;
                  cambiarFiltros({ ...base, busqueda: evento.target.value });
                }}
                aria-label="Buscar fichas por nombre, código o tutor"
              />
            </div>
            <div className="historial-toolbar-controles">
              <div className="historial-select">
                <select
                  aria-label="Filtrar por especie"
                  value={esHistorial ? filtros.especie ?? "" : especiePendientes}
                  onChange={(evento) => {
                    const base = esHistorial ? filtros : filtrosPendientes;
                    cambiarFiltros({ ...base, especie: evento.target.value });
                  }}
                >
                  {ESPECIES_HISTORIAL.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined" aria-hidden="true">arrow_drop_down</span>
              </div>
              <div className="historial-select">
                <select
                  aria-label="Ordenar por"
                  value={esHistorial ? filtros.orden ?? "recientes" : ordenPendientes}
                  onChange={(evento) => {
                    const base = esHistorial ? filtros : filtrosPendientes;
                    cambiarFiltros({ ...base, orden: evento.target.value });
                  }}
                >
                  {ORDENES.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined" aria-hidden="true">arrow_drop_down</span>
              </div>
              <button
                type="button"
                className="historial-boton historial-boton--limpiar"
                onClick={limpiarFiltros}
              >
                <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
                <span>Limpiar filtros</span>
              </button>
            </div>
          </div>

          <div className="historial-banner" role="note">
            <div className="historial-banner-texto">
              <span className="material-symbols-outlined" aria-hidden="true">touch_app</span>
              <span>
                <strong>Consejo de navegación:</strong>{" "}
                {esHistorial
                  ? "Haz clic directamente sobre cualquier fila para consultar la evaluación clínica completa, diagnósticos y tratamiento."
                  : "Haz clic sobre una fila para abrir la revisión inicial o completar la evaluación clínica pendiente."}
              </span>
            </div>
            <span className="historial-banner-total">
              {totalRegistros}{" "}
              {esHistorial ? "registros disponibles" : "revisiones pendientes"}
            </span>
          </div>

          <HistorialChips
            filtros={esHistorial ? filtros : filtrosPendientes}
            onCambiar={cambiarFiltros}
          />
      </div>

      <div className="historial-contenido historial-lista">{vistaListado}</div>

      {esHistorial ? (
        detalle && (
          <FichaMedicaModal
            registro={detalle}
            historial={historial}
            seguimientos={seguimientos}
            usuario={usuario}
            cargando={false}
            error={errorDetalle}
            editando={editandoModal}
            iniciadaEnModal={edicionActiva}
            onCerrar={cerrarDetalle}
            onIniciar={manejarIniciar}
            onGuardar={manejarGuardarActualizacion}
            onCancelar={manejarCancelarActualizacion}
            onCorregirInicial={manejarCorreccionInicial}
            onRevisionInicial={manejarRevisionInicial}
            onRevisionFinal={manejarRevisionFinal}
            onExitoEdicion={(mensaje) => { if (mensaje) setMensaje(mensaje); }}
            onRefrescar={refrescar}
          />
        )
      ) : (
        detalle &&
        (detalle.estadoValidacion === "PROVISIONAL" && puedeRevisionInicial ? (
          <VentanaModal
            ariaLabelledby="revision-inicial-modal-titulo"
            alCerrar={cerrarDetalle}
            className="revision-modal revision-modal--inicial"
            sinBotonCerrar
          >
            <RevisionInicialVista
              registro={detalle}
              usuario={usuario}
              onSubmit={manejarRevisionInicial}
              onCerrar={cerrarDetalle}
              mostrarMigas={false}
              encabezado={
                <div className="revision-inicial-encabezado">
                  <div>
                    <h1 id="revision-inicial-modal-titulo">Registro Médico</h1>
                    <p>
                      Consulta, diagnostica y gestiona las revisiones clínicas de
                      los animales rescatados.
                    </p>
                  </div>
                  <div className="revision-inicial-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected="true"
                      className="activa"
                    >
                      Revisión inicial
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected="false"
                      onClick={() => cambiarFiltro("VALIDACION_PENDIENTE")}
                    >
                      Revisión completa
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected="false"
                      onClick={() => cambiarFiltro("")}
                    >
                      Todos
                    </button>
                  </div>
                </div>
              }
            />
          </VentanaModal>
        ) : detalle.estadoValidacion === "VALIDACION_PENDIENTE" &&
          puedeRevisionFinal ? (
          <VentanaModal
            ariaLabel="Revisión completa"
            alCerrar={cerrarDetalle}
            className="revision-modal revision-modal--completa"
            sinBotonCerrar
          >
            <RevisionCompletaVista
              registro={detalle}
              usuario={usuario}
              historial={historial}
              seguimientos={seguimientos}
              onSubmit={
                correccionEnCompleta ? manejarCorreccionInicial : manejarRevisionFinal
              }
              onCerrar={cerrarDetalle}
              onCorregirInicial={
                puedeCorregir ? () => setCorreccionEnCompleta(true) : undefined
              }
              onIrInicial={() => cambiarFiltro("PROVISIONAL")}
              onIrTodos={() => cambiarFiltro("")}
              corrigiendoInicial={correccionEnCompleta}
              onCancelarCorreccion={() => setCorreccionEnCompleta(false)}
              mostrarMigas={false}
              mostrarComplementarias={false}
            />
          </VentanaModal>
        ) : (
          <section className="tarjeta">
            <div className="encabezado-detalle">
              <h3>{detalle.animal?.codigoAnimal} · {detalle.animal?.nombre || "Sin nombre"}</h3>
              <button type="button" className="boton boton-secundario boton-chico" onClick={cerrarDetalle}>
                Cerrar
              </button>
            </div>
            <p>Estado: {detalle.estadoValidacion}</p>
            <p>Creado: {formatearFecha(detalle.createdAt)}</p>
            {detalle.pesoKg != null && <p>Peso inicial: {detalle.pesoKg} kg</p>}
            {detalle.clasificacionSalud && <p>Clasificación: {detalle.clasificacionSalud}</p>}
            {detalle.observacionInicial && <p>Observación: {detalle.observacionInicial}</p>}

            <RevisionCompletaDetalle registro={detalle} />

            {puedeCorregir && !correccionVisible && (
              <button type="button" className="boton boton-secundario" onClick={() => setCorreccionVisible(true)}>
                Corregir revisión inicial
              </button>
            )}

            {puedeCorregir && correccionVisible && (
              <RevisionInicialForm
                key={`correccion-${detalle.id}`}
                registro={detalle}
                modo="corregir"
                onSubmit={manejarCorreccionInicial}
                onCancelar={() => setCorreccionVisible(false)}
              />
            )}

            {puedeActualizar && (
              <ActualizacionForm
                key={`actualizacion-${detalle.id}-${detalle.estadoValidacion}`}
                registro={detalle}
                enCurso={detalle.estadoValidacion === "REVISANDO"}
                onIniciar={manejarIniciar}
                onGuardar={manejarGuardarActualizacion}
                onCancelar={manejarCancelarActualizacion}
              />
            )}

            {esVeterinaria && (
              <>
                <h3>Historial médico</h3>
                <HistorialMedico historial={historial} />
                <h3>Seguimientos</h3>
                <SeguimientosMedicos seguimientos={seguimientos} />
              </>
            )}
          </section>
        ))
      )}

      {confirmacionRevision && (
        <ModalConfirmacionRevision
          tipo={confirmacionRevision.tipo}
          registro={confirmacionRevision.registro}
          fecha={confirmacionRevision.fecha}
          responsable={usuario?.nombre}
          onAceptar={confirmarAceptar}
          onVerExpediente={confirmarVerExpediente}
          onCerrar={() => setConfirmacionRevision(null)}
        />
      )}

    </section>
  );
}

function HistorialChips({ filtros, onCambiar }) {
  const chips = describirFiltrosActivos(filtros);

  if (!chips.length) return null;

  function quitar(clave) {
    if (clave === "busqueda") {
      onCambiar({ ...filtros, busqueda: "" });
      return;
    }
    onCambiar({ ...filtros, [clave]: "" });
  }

  return (
    <div className="historial-chips" role="group" aria-label="Filtros activos">
      {chips.map((chip) => (
        <button
          key={chip.clave}
          type="button"
          className="chip-activo"
          onClick={() => quitar(chip.clave)}
          aria-label={`Quitar filtro ${chip.etiqueta}`}
        >
          {chip.etiqueta}
          <span aria-hidden="true">×</span>
        </button>
      ))}
    </div>
  );
}
