import { formatearFechaLimite, formatearHorarioTurno } from "../../utils/formatoTurnos.js";

// Tarjeta de un turno. `acciones` es lo que se muestra abajo (botones), segun quien mira.
// `cabeceraExtra` reemplaza el chip de inscripcion abierta/cerrada (lo usa mis inscripciones).
function TarjetaTurno({ turno, acciones, cabeceraExtra, children }) {
  const cerrado = !turno.inscripcionAbierta;
  // La lista de turnos trae `inscritos`; el turno dentro de una inscripcion no, se calcula.
  const inscritos = turno.inscritos ?? turno.cupoMaximo - turno.cuposDisponibles;

  return (
    <article className="postulacion-voluntario turno">
      <div className="postulacion-voluntario-cabecera">
        <div>
          <h3>{turno.titulo}</h3>
          <p className="turno-horario">{formatearHorarioTurno(turno)}</p>
        </div>
        {cabeceraExtra ?? (
          <span className={`estado-postulacion ${cerrado ? "estado-cerrada" : "estado-abierta"}`}>
            {turno.estado === "CANCELADO"
              ? "Cancelado"
              : cerrado
                ? "Inscripción cerrada"
                : "Inscripción abierta"}
          </span>
        )}
      </div>

      {turno.descripcion && <p>{turno.descripcion}</p>}

      <div className="chips turno-datos">
        <span className="chip">
          {inscritos} de {turno.cupoMaximo} inscritos
        </span>
        <span className="chip">
          {turno.cuposDisponibles === 0
            ? "Sin cupos"
            : `${turno.cuposDisponibles} ${turno.cuposDisponibles === 1 ? "cupo libre" : "cupos libres"}`}
        </span>
        <span className="chip">Inscripciones hasta el {formatearFechaLimite(turno.fechaLimiteInscripcion)}</span>
      </div>

      {children}

      {acciones && <div className="botones-revision turno-acciones">{acciones}</div>}
    </article>
  );
}

export default TarjetaTurno;
