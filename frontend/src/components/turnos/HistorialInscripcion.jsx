import { useEffect, useState } from "react";
import { obtenerHistorialInscripcion } from "../../services/inscripcionesService.js";
import {
  formatearFechaHora,
  formatearHorarioTurno,
  NOMBRES_ACCION_HISTORIAL,
} from "../../utils/formatoTurnos.js";

// Historial de una inscripcion (RF15): se carga cuando se abre.
function HistorialInscripcion({ inscripcionId }) {
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
          {registro.detalle && (
            <>
              <br />
              <span className="texto-suave">{registro.detalle}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default HistorialInscripcion;
