import { formatearFecha } from "../../utils/formatoAdopcion.js";

export default function SeguimientosMedicos({ seguimientos = [] }) {
  if (!seguimientos.length) {
    return <p>No hay seguimientos médicos registrados.</p>;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla-postulaciones">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Peso</th>
            <th>Estado</th>
            <th>Evolución</th>
            <th>Observación</th>
            <th>Autor</th>
          </tr>
        </thead>
        <tbody>
          {seguimientos.map((item) => (
            <tr key={item.id}>
              <td>{formatearFecha(item.fechaRegistro)}</td>
              <td>{item.peso ?? "—"}</td>
              <td>{item.estadoSalud}</td>
              <td>{item.evolucionEstadoSalud}</td>
              <td>{item.observacionSeguimiento}</td>
              <td>{item.createdBy?.nombre ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
