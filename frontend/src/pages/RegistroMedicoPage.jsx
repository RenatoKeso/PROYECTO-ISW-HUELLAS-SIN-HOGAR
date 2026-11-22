import { useEffect, useState } from "react";
import {
  listarRegistrosMedicos,
  obtenerRegistroMedico,
  registrarRevisionInicial,
  actualizarRevisionInicial,
  realizarRevisionFinal,
  iniciarActualizacion,
  guardarActualizacion,
  cancelarActualizacion,
  listarActualizacionesMedicas,
  listarHistorialMedico,
  listarSeguimientosMedico,
} from "../services/registroMedicoService.js";
import { listarNotificaciones, marcarNotificacionLeida } from "../services/notificacionService.js";
import BandejaRegistros from "../components/registroMedico/BandejaRegistros.jsx";
import BandejaActualizaciones from "../components/registroMedico/BandejaActualizaciones.jsx";
import RevisionInicialForm from "../components/registroMedico/RevisionInicialForm.jsx";
import RevisionFinalForm from "../components/registroMedico/RevisionFinalForm.jsx";
import ActualizacionForm from "../components/registroMedico/ActualizacionForm.jsx";
import HistorialMedico from "../components/registroMedico/HistorialMedico.jsx";
import SeguimientosMedicos from "../components/registroMedico/SeguimientosMedicos.jsx";
import RevisionCompletaDetalle from "../components/registroMedico/RevisionCompletaDetalle.jsx";
import NotificacionesMedicas from "../components/registroMedico/NotificacionesMedicas.jsx";
import {
  puedeActualizarRegistroMedico,
  puedeActualizarRevisionInicial,
  puedeRealizarRevisionFinal,
  puedeRegistrarRevisionInicial,
} from "../utils/permisosUsuario.js";
import { formatearFecha } from "../utils/formatoAdopcion.js";
import "../styles/registroMedico.css";

const FILTROS = [
  { valor: "PROVISIONAL", texto: "Revisión inicial" },
  { valor: "VALIDACION_PENDIENTE", texto: "Revisión completa" },
  { valor: "REALIZADO", texto: "Realizados" },
  { valor: "ACTUALIZACIONES", texto: "Actualizados" },
  { valor: "", texto: "Todos" },
];

export default function RegistroMedicoPage({ usuario }) {
  const [filtro, setFiltro] = useState("PROVISIONAL");
  const [resultado, setResultado] = useState({ filtro: null, registros: [], error: "" });
  const [actualizaciones, setActualizaciones] = useState({
    filtro: null,
    items: [],
    error: "",
  });
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [historial, setHistorial] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [correccionVisible, setCorreccionVisible] = useState(false);

  const esVeterinaria = puedeActualizarRegistroMedico(usuario);

  function seleccionarRegistro(id) {
    setSeleccionadoId(id);
    setDetalle(null);
    setHistorial([]);
    setSeguimientos([]);
    setCorreccionVisible(false);
  }

  function cerrarDetalle() {
    setSeleccionadoId(null);
    setDetalle(null);
    setHistorial([]);
    setSeguimientos([]);
    setMensaje("");
    setCorreccionVisible(false);
  }

  function cambiarFiltro(valor) {
    setFiltro(valor);
    setSeleccionadoId(null);
    setDetalle(null);
    setHistorial([]);
    setSeguimientos([]);
    setMensaje("");
    setCorreccionVisible(false);
  }

  useEffect(() => {
    let vigente = true;

    if (filtro === "ACTUALIZACIONES") {
      listarActualizacionesMedicas()
        .then((respuesta) => {
          if (vigente) {
            setActualizaciones({
              filtro,
              items: respuesta.actualizaciones,
              error: "",
            });
          }
        })
        .catch((error) => {
          if (vigente) {
            setActualizaciones({ filtro, items: [], error: error.message });
          }
        });

      return () => {
        vigente = false;
      };
    }

    listarRegistrosMedicos(filtro)
      .then((respuesta) => {
        if (vigente) {
          setResultado({ filtro, registros: respuesta.registros, error: "" });
        }
      })
      .catch((error) => {
        if (vigente) setResultado({ filtro, registros: [], error: error.message });
      });
    return () => {
      vigente = false;
    };
  }, [filtro]);

  useEffect(() => {
    if (!seleccionadoId) return;

    let vigente = true;
    obtenerRegistroMedico(seleccionadoId)
      .then((respuesta) => {
        if (vigente) setDetalle(respuesta.registro);
      })
      .catch((error) => {
        if (vigente) setMensaje(error.message);
      })
      .finally(() => {});

    if (esVeterinaria) {
      listarHistorialMedico(seleccionadoId)
        .then((respuesta) => {
          if (vigente) setHistorial(respuesta.historial);
        })
        .catch(() => {});
      listarSeguimientosMedico(seleccionadoId)
        .then((respuesta) => {
          if (vigente) setSeguimientos(respuesta.seguimientos);
        })
        .catch(() => {});
    }

    return () => {
      vigente = false;
    };
  }, [seleccionadoId, esVeterinaria]);

  useEffect(() => {
    if (!esVeterinaria) return;
    listarNotificaciones()
      .then((respuesta) => setNotificaciones(respuesta.notificaciones))
      .catch(() => setNotificaciones([]));
  }, [esVeterinaria]);

  async function refrescar() {
    if (filtro === "ACTUALIZACIONES") {
      const respuesta = await listarActualizacionesMedicas();
      setActualizaciones({
        filtro,
        items: respuesta.actualizaciones,
        error: "",
      });
    } else {
      const respuesta = await listarRegistrosMedicos(filtro);
      setResultado({ filtro, registros: respuesta.registros, error: "" });
    }
    if (seleccionadoId) {
      const detalleRespuesta = await obtenerRegistroMedico(seleccionadoId);
      setDetalle(detalleRespuesta.registro);
      if (esVeterinaria) {
        const h = await listarHistorialMedico(seleccionadoId);
        setHistorial(h.historial);
        const s = await listarSeguimientosMedico(seleccionadoId);
        setSeguimientos(s.seguimientos);
      }
    }
  }

  const cargando =
    filtro === "ACTUALIZACIONES"
      ? actualizaciones.filtro !== filtro
      : resultado.filtro !== filtro;
  const cargandoDetalle = seleccionadoId !== null && detalle?.id !== seleccionadoId;
  const registros = resultado.registros;
  const error =
    filtro === "ACTUALIZACIONES" ? actualizaciones.error : resultado.error;

  async function manejarRevisionInicial(datos) {
    const respuesta = await registrarRevisionInicial(seleccionadoId, datos);
    setMensaje(respuesta.message);
    await refrescar();
    return respuesta;
  }

  async function manejarCorreccionInicial(datos) {
    const respuesta = await actualizarRevisionInicial(seleccionadoId, datos);
    setMensaje(respuesta.message);
    await refrescar();
    if (esVeterinaria) {
      const notis = await listarNotificaciones();
      setNotificaciones(notis.notificaciones);
    }
    return respuesta;
  }

  async function manejarRevisionFinal(datos) {
    const respuesta = await realizarRevisionFinal(seleccionadoId, datos);
    setMensaje(respuesta.message);
    await refrescar();
    return respuesta;
  }

  async function manejarIniciar() {
    const respuesta = await iniciarActualizacion(seleccionadoId);
    setMensaje(respuesta.message);
    await refrescar();
    return respuesta;
  }

  async function manejarGuardarActualizacion(datos) {
    const respuesta = await guardarActualizacion(seleccionadoId, datos);
    setMensaje(respuesta.message);
    await refrescar();
    return respuesta;
  }

  async function manejarCancelarActualizacion() {
    await cancelarActualizacion(seleccionadoId);
    setMensaje("Actualización cancelada correctamente");
    await refrescar();
  }

  async function manejarMarcarLeida(id) {
    await marcarNotificacionLeida(id);
    const respuesta = await listarNotificaciones();
    setNotificaciones(respuesta.notificaciones);
  }

  function abrirRegistroDesdeNotificacion(id) {
    setSeleccionadoId(id);
    setFiltro("");
    setCorreccionVisible(false);
  }

  const puedeRevisionInicial = detalle && puedeRegistrarRevisionInicial(usuario);
  const puedeCorregir = detalle && puedeActualizarRevisionInicial(usuario) && detalle.revisionInicial && !detalle.revisionInicial.fechaActualizacion;
  const puedeRevisionFinal = detalle && puedeRealizarRevisionFinal(usuario) && detalle.estadoValidacion === "VALIDACION_PENDIENTE";
  const puedeActualizar = detalle && puedeActualizarRegistroMedico(usuario) && (detalle.estadoValidacion === "REALIZADO" || detalle.estadoValidacion === "ACTUALIZADO" || detalle.estadoValidacion === "REVISANDO");

  return (
    <section className="bloque registro-medico">
      <div className="encabezado-acciones">
        <div>
          <h2>Registro médico</h2>
          <p>Consulta y gestiona las revisiones médicas de los animales.</p>
        </div>
      </div>

      {mensaje && <p className="mensaje mensaje-exito">{mensaje}</p>}

      <div className="pestanas-estado" role="tablist">
        {FILTROS.map((item) => (
          <button
            key={item.valor || "todos"}
            type="button"
            role="tab"
            aria-selected={filtro === item.valor}
            className={filtro === item.valor ? "pestana-estado activa" : "pestana-estado"}
            onClick={() => cambiarFiltro(item.valor)}
          >
            {item.texto}
          </button>
        ))}
      </div>

      {cargando && <p>Cargando registros...</p>}
      {!cargando && error && <p className="mensaje mensaje-error">{error}</p>}
      {!cargando && !error && filtro === "ACTUALIZACIONES" && (
        <BandejaActualizaciones
          actualizaciones={actualizaciones.items}
          cargando={false}
        />
      )}
      {!cargando && !error && filtro !== "ACTUALIZACIONES" && (
        <BandejaRegistros
          registros={registros}
          seleccionadoId={seleccionadoId}
          onSeleccionar={seleccionarRegistro}
          cargando={false}
        />
      )}

      {cargandoDetalle && <p>Cargando detalle...</p>}

      {detalle && (
        <section className="tarjeta">
          <div className="encabezado-detalle">
            <h3>
              {detalle.animal?.codigoAnimal} · {detalle.animal?.nombre || "Sin nombre"}
            </h3>
            <button
              type="button"
              className="boton boton-secundario boton-chico"
              onClick={cerrarDetalle}
            >
              Cerrar
            </button>
          </div>
          <p>Estado: {detalle.estadoValidacion}</p>
          <p>Creado: {formatearFecha(detalle.createdAt)}</p>
          {detalle.pesoKg != null && <p>Peso inicial: {detalle.pesoKg} kg</p>}
          {detalle.clasificacionSalud && <p>Clasificación: {detalle.clasificacionSalud}</p>}
          {detalle.observacionInicial && <p>Observación: {detalle.observacionInicial}</p>}

          <RevisionCompletaDetalle registro={detalle} />

          {puedeRevisionInicial && detalle.estadoValidacion === "PROVISIONAL" && (
            <RevisionInicialForm
              key={`inicial-${detalle.id}`}
              registro={detalle}
              modo="registrar"
              onSubmit={manejarRevisionInicial}
            />
          )}

          {puedeCorregir && !correccionVisible && (
            <button
              type="button"
              className="boton boton-secundario"
              onClick={() => setCorreccionVisible(true)}
            >
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

          {puedeRevisionFinal && (
            <RevisionFinalForm key={`final-${detalle.id}`} registro={detalle} onSubmit={manejarRevisionFinal} />
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
      )}

      {esVeterinaria && (
        <section className="bloque">
          <h2>Notificaciones médicas</h2>
          <NotificacionesMedicas
            notificaciones={notificaciones}
            onMarcarLeida={manejarMarcarLeida}
            onAbrirRegistro={abrirRegistroDesdeNotificacion}
          />
        </section>
      )}
    </section>
  );
}
