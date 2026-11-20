import { useEffect, useState } from "react";
import HistorialInscripcion from "./HistorialInscripcion.jsx";
import { obtenerInscritosDeTurno } from "../../services/turnosService.js";
import { estadoVisual, TEXTO_ESTADO, textoMotivo } from "../../utils/calendarioTurnos.js";
import {
  formatearFechaHora,
  formatearFechaLimite,
  formatearHorarioTurno,
} from "../../utils/formatoTurnos.js";

// Ejecuta una accion del panel mostrando "guardando" y el error si falla.
function useAccion() {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function ejecutar(accion) {
    setGuardando(true);
    setError("");

    try {
      await accion();
    } catch (errorAccion) {
      setError(errorAccion.message);
    } finally {
      setGuardando(false);
    }
  }

  return { guardando, error, ejecutar };
}

// Lo que ven los dos roles: estado, horario, descripcion, cupos y plazo.
function DetalleTurno({ turno, estado }) {
  const inscritos = turno.inscritos ?? turno.cupoMaximo - turno.cuposDisponibles;

  return (
    <>
      <span className={`etiqueta-estado estado-turno-${estado}`}>{TEXTO_ESTADO[estado]}</span>
      <h3>{turno.titulo}</h3>
      <p className="turno-horario">{formatearHorarioTurno(turno)}</p>
      {turno.descripcion && <p>{turno.descripcion}</p>}

      <div className="chips">
        <span className="chip">{inscritos} de {turno.cupoMaximo} inscritos</span>
        <span className="chip">Inscripciones hasta el {formatearFechaLimite(turno.fechaLimiteInscripcion)}</span>
      </div>

      {turno.estado === "CANCELADO" && (
        <p className="aviso-turno aviso-cancelado">
          <strong>El refugio canceló este turno.</strong>
          {turno.motivoCancelacion && <> Motivo: {turno.motivoCancelacion}</>}
        </p>
      )}
    </>
  );
}

function AccionesVoluntario({ turno, estado, cambiandoDesde, onInscribirse, onEmpezarCambio, onConfirmarCambio, onCancelarInscripcion }) {
  const [vista, setVista] = useState(null); // null | "cancelar" | "historial"
  const { guardando, error, ejecutar } = useAccion();
  const propia = turno.miInscripcion;
  const esElQueCambia = cambiandoDesde?.id === turno.id;

  return (
    <>
      {estado === "no-disponible" && (
        <p className="aviso-turno aviso-no-disponible">
          <strong>No puedes tomarlo:</strong> {textoMotivo(turno.disponibilidad)}
        </p>
      )}

      {estado === "pasado" && <p className="aviso-turno aviso-pasado">Este turno ya pasó.</p>}

      {propia?.estado === "CANCELADA" && turno.estado !== "CANCELADO" && estado !== "inscrito" && (
        <p className="aviso-turno aviso-pasado">Te habías inscrito en este turno y cancelaste tu inscripción.</p>
      )}

      {esElQueCambia && (
        <p className="aviso-turno aviso-cambio">Elige en el calendario el turno nuevo (los azules).</p>
      )}

      <div className="botones-revision turno-acciones">
        {estado === "disponible" && !cambiandoDesde && (
          <button type="button" className="boton" disabled={guardando} onClick={() => ejecutar(() => onInscribirse(turno))}>
            {guardando ? "Inscribiendo..." : "Inscribirme"}
          </button>
        )}

        {estado === "disponible" && cambiandoDesde && (
          <button type="button" className="boton" disabled={guardando} onClick={() => ejecutar(() => onConfirmarCambio(turno))}>
            {guardando ? "Cambiando..." : "Cambiar a este turno"}
          </button>
        )}

        {estado === "inscrito" && !cambiandoDesde && vista !== "cancelar" && (
          <>
            <button type="button" className="boton boton-secundario" onClick={() => onEmpezarCambio(turno)}>
              Cambiar de turno
            </button>
            <button type="button" className="boton-peligro" onClick={() => setVista("cancelar")}>
              Cancelar inscripción
            </button>
          </>
        )}

        {propia && (
          <button type="button" className="boton-mini" onClick={() => setVista(vista === "historial" ? null : "historial")}>
            {vista === "historial" ? "Ocultar historial" : "Ver historial"}
          </button>
        )}
      </div>

      {vista === "cancelar" && (
        <div className="confirmacion-turno">
          <p>¿Seguro? Se liberará tu cupo en este turno.</p>
          <div className="botones-revision">
            <button
              type="button"
              className="boton-peligro fuerte"
              disabled={guardando}
              onClick={() => ejecutar(() => onCancelarInscripcion(turno))}
            >
              {guardando ? "Cancelando..." : "Sí, cancelar inscripción"}
            </button>
            <button type="button" className="boton-mini" onClick={() => setVista(null)}>Volver</button>
          </div>
        </div>
      )}

      {vista === "historial" && propia && <HistorialInscripcion inscripcionId={propia.id} />}

      {error && <p className="campo-error">{error}</p>}
    </>
  );
}

// Se carga al abrirla, igual que el historial.
function ListaInscritos({ turnoId }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    obtenerInscritosDeTurno(turnoId)
      .then((respuesta) => vigente && setDatos(respuesta.inscripciones))
      .catch((errorCarga) => vigente && setError(errorCarga.message));

    return () => {
      vigente = false;
    };
  }, [turnoId]);

  if (error) return <p className="campo-error">{error}</p>;
  if (!datos) return <p className="texto-suave">Cargando inscritos...</p>;

  const activas = datos.filter((inscripcion) => inscripcion.estado === "ACTIVA");
  const canceladas = datos.filter((inscripcion) => inscripcion.estado === "CANCELADA");

  return (
    <div className="lista-inscritos">
      <h4>Inscritos ({activas.length})</h4>
      {activas.length === 0 ? (
        <p className="texto-suave">Nadie inscrito por ahora.</p>
      ) : (
        <ul>
          {activas.map((inscripcion) => (
            <li key={inscripcion.id}>
              <strong>{inscripcion.voluntario.nombre}</strong>
              <span className="texto-suave">
                {" · "}{inscripcion.voluntario.email}
                {inscripcion.voluntario.telefono && ` · ${inscripcion.voluntario.telefono}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canceladas.length > 0 && (
        <>
          <h4>Cancelaron ({canceladas.length})</h4>
          <ul>
            {canceladas.map((inscripcion) => (
              <li key={inscripcion.id}>
                {inscripcion.voluntario.nombre}
                {inscripcion.canceladaEn && (
                  <span className="texto-suave"> · {formatearFechaHora(inscripcion.canceladaEn)}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function AccionesEncargada({ turno, estado, onCancelarTurno }) {
  const [vista, setVista] = useState(null); // null | "inscritos" | "cancelar"
  const [motivo, setMotivo] = useState("");
  const [faltaMotivo, setFaltaMotivo] = useState(false);
  const { guardando, error, ejecutar } = useAccion();
  const sePuedeCancelar = estado === "con-cupos" || estado === "lleno";

  function confirmarCancelacion() {
    if (!motivo.trim()) {
      setFaltaMotivo(true);
      return;
    }

    ejecutar(() => onCancelarTurno(turno, motivo.trim()));
  }

  return (
    <>
      <div className="botones-revision turno-acciones">
        <button type="button" className="boton boton-secundario" onClick={() => setVista(vista === "inscritos" ? null : "inscritos")}>
          {vista === "inscritos" ? "Ocultar inscritos" : "Ver inscritos"}
        </button>

        {sePuedeCancelar && vista !== "cancelar" && (
          <button type="button" className="boton-peligro" onClick={() => setVista("cancelar")}>
            Cancelar turno
          </button>
        )}
      </div>

      {vista === "inscritos" && <ListaInscritos turnoId={turno.id} />}

      {vista === "cancelar" && (
        <div className="confirmacion-turno">
          <p>
            <strong>¿Cancelar este turno?</strong> Las inscripciones activas quedarán canceladas y los
            voluntarios verán el motivo.
          </p>
          <label htmlFor={`motivo-cancelacion-${turno.id}`}>Motivo de la cancelación</label>
          <textarea
            id={`motivo-cancelacion-${turno.id}`}
            rows={2}
            maxLength={500}
            placeholder="Ej: Se suspende por lluvia"
            value={motivo}
            aria-invalid={faltaMotivo}
            onChange={(evento) => {
              setMotivo(evento.target.value);
              setFaltaMotivo(false);
            }}
          />
          {faltaMotivo && <p className="campo-error">Escribe el motivo de la cancelación.</p>}
          <div className="botones-revision">
            <button type="button" className="boton-peligro fuerte" disabled={guardando} onClick={confirmarCancelacion}>
              {guardando ? "Cancelando..." : "Sí, cancelar turno"}
            </button>
            <button type="button" className="boton-mini" onClick={() => setVista(null)}>Volver</button>
          </div>
        </div>
      )}

      {error && <p className="campo-error">{error}</p>}
    </>
  );
}

// Panel de la derecha con el turno elegido en el calendario y lo que se puede
// hacer con el segun quien mira.
function PanelTurno({ turno, gestiona, ...acciones }) {
  if (!turno) {
    return (
      <aside className="panel-turno" aria-label="Detalle del turno">
        <h3>Elige un turno</h3>
        <p className="texto-suave">Haz clic en un turno del calendario para ver su detalle y sus opciones.</p>
      </aside>
    );
  }

  const estado = estadoVisual(turno, gestiona);

  return (
    <aside className="panel-turno" aria-label="Detalle del turno">
      <DetalleTurno turno={turno} estado={estado} />
      {gestiona ? (
        <AccionesEncargada turno={turno} estado={estado} onCancelarTurno={acciones.onCancelarTurno} />
      ) : (
        <AccionesVoluntario turno={turno} estado={estado} {...acciones} />
      )}
    </aside>
  );
}

export default PanelTurno;
