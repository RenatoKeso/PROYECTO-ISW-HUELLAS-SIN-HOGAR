import { formatearFecha } from "../../utils/formatoAdopcion.js";

function detalle(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "sin detalles";
  }
  return valor;
}

export default function RevisionCompletaDetalle({ registro }) {
  const revision = registro?.revisionCompleta;
  if (!revision) return null;

  const enfermedades = registro.enfermedades ?? [];
  const tratamientos = registro.tratamientos ?? [];
  const atenciones = registro.atencionesSanitarias ?? [];

  return (
    <section className="bloque">
      <h3>Revisión completa</h3>
      <p>Peso revalidado: {revision.peso ?? "—"} kg</p>
      <p>Estado de salud: {revision.estadoSalud ?? "—"}</p>
      {registro.animal?.estadoAdopcion && (
        <p>Adoptabilidad: {registro.animal.estadoAdopcion}</p>
      )}
      <p>Condiciones: {detalle(revision.descripcionCondicionMedica)}</p>
      <p>Discapacidades: {detalle(revision.discapacidades)}</p>
      <p>Lesiones: {detalle(revision.lesiones)}</p>
      <p>
        Cuidados especiales: {detalle(revision.descripcionCuidadosEspeciales)}
      </p>

      <h4>Enfermedades</h4>
      {enfermedades.length ? (
        <div className="tabla-contenedor">
          <table className="tabla-postulaciones">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {enfermedades.map((enfermedad) => (
                <tr key={enfermedad.id}>
                  <td>{enfermedad.descripcionEnfermedad}</td>
                  <td>{enfermedad.tipoEnfermedad ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No hay enfermedades registradas.</p>
      )}

      <h4>Tratamientos</h4>
      {tratamientos.length ? (
        <div className="tabla-contenedor">
          <table className="tabla-postulaciones">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {tratamientos.map((tratamiento) => (
                <tr key={tratamiento.id}>
                  <td>{tratamiento.descripcionTratamiento}</td>
                  <td>{formatearFecha(tratamiento.fechaInicio, { soloFecha: true })}</td>
                  <td>{formatearFecha(tratamiento.fechaFin, { soloFecha: true })}</td>
                  <td>{tratamiento.observaciones ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No hay tratamientos registrados.</p>
      )}

      <h4>Atenciones sanitarias</h4>
      {atenciones.length ? (
        <div className="tabla-contenedor">
          <table className="tabla-postulaciones">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Programada</th>
                <th>Estado</th>
                <th>Realizada</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {atenciones.map((atencion) => (
                <tr key={atencion.id}>
                  <td>{atencion.tipo}</td>
                  <td>{formatearFecha(atencion.fechaProgramada, { soloFecha: true })}</td>
                  <td>{atencion.estado}</td>
                  <td>{formatearFecha(atencion.fechaRealizacion, { soloFecha: true })}</td>
                  <td>{atencion.observaciones ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No hay atenciones sanitarias registradas.</p>
      )}
    </section>
  );
}
