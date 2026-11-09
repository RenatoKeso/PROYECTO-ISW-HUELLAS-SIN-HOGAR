import { formatearFecha } from "../../utils/formatoAdopcion.js";

export default function HistorialMedico({ historial = [] }) {
  if (!historial.length) {
    return <p>No hay versiones en el historial médico.</p>;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla-postulaciones">
        <thead>
          <tr>
            <th>Versión</th>
            <th>Estado origen</th>
            <th>Peso</th>
            <th>Clasificación</th>
            <th>Fecha</th>
            <th>Autor</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((item) => (
            <tr key={item.id}>
              <td>{item.version}</td>
              <td>{item.estadoOrigen}</td>
              <td>{item.peso ?? "—"}</td>
              <td>{item.clasificacionSalud ?? "—"}</td>
              <td>{formatearFecha(item.fecha)}</td>
              <td>{item.actualizadoPor?.nombre ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
