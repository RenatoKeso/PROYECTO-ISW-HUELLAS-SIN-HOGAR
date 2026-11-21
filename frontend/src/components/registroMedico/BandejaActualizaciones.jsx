import { formatearFecha } from "../../utils/formatoAdopcion.js";

export default function BandejaActualizaciones({ actualizaciones, cargando }) {
  if (cargando) return <p>Cargando actualizaciones...</p>;

  if (!actualizaciones.length) {
    return <p>No hay actualizaciones registradas.</p>;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla-postulaciones">
        <thead>
          <tr>
            <th>Código animal</th>
            <th>Nombre</th>
            <th>Fecha de actualización</th>
            <th>Autor</th>
            <th>Actualizaciones</th>
          </tr>
        </thead>
        <tbody>
          {actualizaciones.map((actualizacion) => {
            const animal = actualizacion.registroMedico?.animal;

            return (
              <tr key={actualizacion.id}>
                <td>
                  {animal?.codigoAnimal ??
                    actualizacion.registroMedicoId ??
                    actualizacion.registroMedico?.id}
                </td>
                <td>{animal?.nombre || "Sin nombre"}</td>
                <td>{formatearFecha(actualizacion.fecha)}</td>
                <td>{actualizacion.actualizadoPor?.nombre ?? "—"}</td>
                <td>{actualizacion.version}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
