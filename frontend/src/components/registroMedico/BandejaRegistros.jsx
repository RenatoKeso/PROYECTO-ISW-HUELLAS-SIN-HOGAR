import { formatearFecha } from "../../utils/formatoAdopcion.js";

const ETIQUETAS_ESTADO = {
  PROVISIONAL: "Revisión inicial",
  VALIDACION_PENDIENTE: "Revisión completa",
  REVISANDO: "En revisión",
  REALIZADO: "Realizado",
  ACTUALIZADO: "Actualizado",
};

export default function BandejaRegistros({
  registros,
  seleccionadoId,
  onSeleccionar,
  cargando,
}) {
  if (cargando) return <p>Cargando registros médicos...</p>;

  if (!registros.length) {
    return <p>No hay registros médicos en este estado.</p>;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla-postulaciones">
        <thead>
          <tr>
            <th>Animal</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Creado</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => (
            <tr
              key={registro.id}
              className={registro.id === seleccionadoId ? "fila-seleccionada" : ""}
            >
              <td>{registro.animal?.codigoAnimal ?? registro.animalId}</td>
              <td>{registro.animal?.nombre || "Sin nombre"}</td>
              <td>
                <span className={`estado-chip estado-${registro.estadoValidacion}`}>
                  {ETIQUETAS_ESTADO[registro.estadoValidacion] ?? registro.estadoValidacion}
                </span>
              </td>
              <td>{formatearFecha(registro.createdAt)}</td>
              <td>
                <button
                  type="button"
                  className="enlace-accion"
                  onClick={() => onSeleccionar(registro.id)}
                >
                  Abrir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
