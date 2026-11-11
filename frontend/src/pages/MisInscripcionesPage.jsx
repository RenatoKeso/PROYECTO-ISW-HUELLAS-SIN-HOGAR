import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Mensaje from "../components/ui/Mensaje.jsx";
import TarjetaTurno from "../components/turnos/TarjetaTurno.jsx";
import { listarTurnosDisponibles } from "../services/turnosService.js";
import {
  cancelarInscripcion,
  listarMisInscripciones,
  modificarInscripcion,
  obtenerHistorialInscripcion,
} from "../services/inscripcionesService.js";
import {
  formatearFechaHora,
  formatearHorarioTurno,
  NOMBRES_ACCION_HISTORIAL,
  NOMBRES_ESTADO_INSCRIPCION,
} from "../utils/formatoTurnos.js";
import "../styles/voluntariado.css";

// Una inscripcion activa cuyo turno ya termino es un turno realizado.
function yaTermino(inscripcion, ahora) {
  return new Date(inscripcion.turno.termino).getTime() <= ahora;
}

// `estado` es el filtro que se pide al servidor; `incluir` separa las activas
// en proximas y realizadas segun la hora de termino del turno.
const PESTANAS = [
  { valor: "PROXIMAS", texto: "Próximas", estado: "ACTIVA", incluir: (i, ahora) => !yaTermino(i, ahora) },
  { valor: "REALIZADAS", texto: "Realizadas", estado: "ACTIVA", incluir: (i, ahora) => yaTermino(i, ahora) },
  { valor: "CANCELADAS", texto: "Canceladas", estado: "CANCELADA", incluir: () => true },
  { valor: "TODAS", texto: "Todas", estado: "", incluir: () => true },
];

// Historial de una inscripcion: se carga al abrirlo.
function Historial({ inscripcionId }) {
  const [historial, setHistorial] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    obtenerHistorialInscripcion(inscripcionId)
      .then((respuesta) => vigente && setHistorial(respuesta.historial))
      .catch((errorCarga) => vigente && setError(errorCarga.message));

    return () => {
      vigente = false;
    };
  }, [inscripcionId]);

  if (error) return <p className="campo-error">{error}</p>;
  if (!historial) return <p className="texto-suave">Cargando historial...</p>;

  return (
    <ul className="historial-inscripcion">
      {historial.map((registro) => (
        <li key={registro.id}>
          <strong>{NOMBRES_ACCION_HISTORIAL[registro.accion] ?? registro.accion}</strong>
          <span className="texto-suave"> · {formatearFechaHora(registro.fecha)}</span>
          <br />
          {registro.accion === "MODIFICACION" && registro.turnoAnterior ? (
            <>
              De <em>{registro.turnoAnterior.titulo}</em> a <em>{registro.turno.titulo}</em>
              {" "}({formatearHorarioTurno(registro.turno)})
            </>
          ) : (
            <>
              <em>{registro.turno.titulo}</em> ({formatearHorarioTurno(registro.turno)})
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function TarjetaInscripcion({ inscripcion, turnosDisponibles, ahora, alModificar, alCancelar }) {
  const [vista, setVista] = useState(null); // null | "cambiar" | "cancelar" | "historial"
  const [turnoNuevo, setTurnoNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const activa = inscripcion.estado === "ACTIVA";
  const yaComenzo = new Date(inscripcion.turno.inicio).getTime() <= ahora;
  const opcionesCambio = turnosDisponibles.filter(
    (turno) => turno.id !== inscripcion.turnoId && turno.inscripcionAbierta,
  );

  function abrir(nuevaVista) {
    setError("");
    setVista(vista === nuevaVista ? null : nuevaVista);
  }

  async function ejecutar(accion) {
    setGuardando(true);
    setError("");

    try {
      await accion();
      setVista(null);
    } catch (errorAccion) {
      setError(errorAccion.message);
    } finally {
      setGuardando(false);
    }
  }

  const realizada = activa && yaTermino(inscripcion, ahora);

  const estado = realizada ? (
    <span className="estado-postulacion estado-en_revision">Turno realizado</span>
  ) : (
    <span className={`estado-postulacion estado-${inscripcion.estado.toLowerCase()}`}>
      {NOMBRES_ESTADO_INSCRIPCION[inscripcion.estado]}
    </span>
  );

  return (
    <TarjetaTurno turno={inscripcion.turno} cabeceraExtra={estado}>
      {inscripcion.estado === "CANCELADA" && inscripcion.canceladaEn && (
        <p className="texto-suave">Cancelada el {formatearFechaHora(inscripcion.canceladaEn)}</p>
      )}

      <div className="botones-revision turno-acciones">
        {activa && !yaComenzo && (
          <>
            <button type="button" className="boton boton-secundario" onClick={() => abrir("cambiar")}>
              Cambiar de turno
            </button>
            <button type="button" className="boton-mini" onClick={() => abrir("cancelar")}>
              Cancelar inscripción
            </button>
          </>
        )}
        <button type="button" className="boton-mini" onClick={() => abrir("historial")}>
          {vista === "historial" ? "Ocultar historial" : "Ver historial"}
        </button>
      </div>

      {vista === "cambiar" && (
        <div className="cambio-turno">
          {opcionesCambio.length === 0 ? (
            <p className="texto-suave">No hay otros turnos con inscripción abierta.</p>
          ) : (
            <>
              <label htmlFor={`turno-nuevo-${inscripcion.id}`}>Nuevo turno</label>
              <select
                id={`turno-nuevo-${inscripcion.id}`}
                value={turnoNuevo}
                onChange={(evento) => setTurnoNuevo(evento.target.value)}
              >
                <option value="">Elige un turno</option>
                {opcionesCambio.map((turno) => (
                  <option key={turno.id} value={turno.id}>
                    {turno.titulo} · {formatearHorarioTurno(turno)}
                  </option>
                ))}
              </select>
              <div className="botones-revision">
                <button
                  type="button"
                  className="boton"
                  disabled={!turnoNuevo || guardando}
                  onClick={() => ejecutar(() => alModificar(inscripcion.id, Number(turnoNuevo)))}
                >
                  {guardando ? "Cambiando..." : "Confirmar cambio"}
                </button>
                <button type="button" className="boton-mini" onClick={() => setVista(null)}>
                  Volver
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {vista === "cancelar" && (
        <div className="botones-revision cambio-turno">
          <span>¿Seguro? Se liberará tu cupo en este turno.</span>
          <button
            type="button"
            className="boton"
            disabled={guardando}
            onClick={() => ejecutar(() => alCancelar(inscripcion.id))}
          >
            {guardando ? "Cancelando..." : "Sí, cancelar"}
          </button>
          <button type="button" className="boton-mini" onClick={() => setVista(null)}>
            Volver
          </button>
        </div>
      )}

      {vista === "historial" && <Historial inscripcionId={inscripcion.id} />}

      {error && <p className="campo-error">{error}</p>}
    </TarjetaTurno>
  );
}

function MisInscripcionesPage() {
  const [pestana, setPestana] = useState("PROXIMAS");
  const [inscripciones, setInscripciones] = useState([]);
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [recargar, setRecargar] = useState(0);
  // Momento de la ultima carga: con el se decide si un turno ya comenzo.
  const [ahora, setAhora] = useState(0);

  const pestanaActual = PESTANAS.find((opcion) => opcion.valor === pestana);
  const estado = pestanaActual.estado;
  const visibles = inscripciones.filter((inscripcion) => pestanaActual.incluir(inscripcion, ahora));

  useEffect(() => {
    let vigente = true;

    Promise.all([listarMisInscripciones(estado), listarTurnosDisponibles()])
      .then(([respuestaMias, respuestaTurnos]) => {
        if (!vigente) return;
        setInscripciones(respuestaMias.inscripciones);
        setTurnosDisponibles(respuestaTurnos.turnos);
        setAhora(Date.now());
      })
      .catch((errorCarga) => vigente && setError(errorCarga.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [estado, recargar]);

  function cambiarPestana(valor) {
    // Proximas y Realizadas piden lo mismo al servidor: solo se recarga si cambia el filtro.
    const siguiente = PESTANAS.find((opcion) => opcion.valor === valor);
    if (siguiente.estado !== estado) setCargando(true);
    setError("");
    setMensaje(null);
    setPestana(valor);
  }

  async function modificar(id, turnoId) {
    const respuesta = await modificarInscripcion(id, turnoId);
    setMensaje({ tipo: "exito", texto: respuesta.message });
    setRecargar((valor) => valor + 1);
  }

  async function cancelar(id) {
    const respuesta = await cancelarInscripcion(id);
    setMensaje({ tipo: "exito", texto: respuesta.message });
    setRecargar((valor) => valor + 1);
  }

  return (
    <section className="bloque voluntariado">
      <Link to="/turnos" className="volver-link">← Ver turnos disponibles</Link>

      <h2>Mis inscripciones</h2>
      <p className="texto-suave">
        Aquí están los turnos en los que te inscribiste. Puedes cambiar de turno o cancelar
        mientras el turno no haya comenzado.
      </p>

      <div className="pestanas-voluntariado">
        {PESTANAS.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            className={pestana === opcion.valor ? "pestana-voluntariado activa" : "pestana-voluntariado"}
            onClick={() => cambiarPestana(opcion.valor)}
          >
            {opcion.texto}
          </button>
        ))}
      </div>

      <Mensaje mensaje={mensaje} />
      {error && <p className="mensaje mensaje-error">{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : visibles.length === 0 ? (
        <div className="sin-postulaciones">
          <span aria-hidden="true">🐾</span>
          <h3>No tienes inscripciones aquí</h3>
          <p>
            Elige un turno en <Link to="/turnos">turnos disponibles</Link> para inscribirte.
          </p>
        </div>
      ) : (
        <div className="lista-postulaciones">
          {visibles.map((inscripcion) => (
            <TarjetaInscripcion
              key={inscripcion.id}
              inscripcion={inscripcion}
              turnosDisponibles={turnosDisponibles}
              ahora={ahora}
              alModificar={modificar}
              alCancelar={cancelar}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default MisInscripcionesPage;
