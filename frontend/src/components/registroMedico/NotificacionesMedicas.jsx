import { formatearFecha } from "../../utils/formatoAdopcion.js";

export default function NotificacionesMedicas({ notificaciones = [], onMarcarLeida, onAbrirRegistro }) {
  if (!notificaciones.length) {
    return <p>No hay notificaciones médicas.</p>;
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla-postulaciones">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Título</th>
            <th>Mensaje</th>
            <th>Estado</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {notificaciones.map((item) => (
            <tr key={item.id}>
              <td>{formatearFecha(item.createdAt)}</td>
              <td>{item.titulo}</td>
              <td>{item.mensaje}</td>
              <td>{item.leida ? "Leída" : "No leída"}</td>
              <td>
                {item.registroMedicoId && (
                  <button type="button" className="enlace-accion" onClick={() => onAbrirRegistro?.(item.registroMedicoId)}>
                    Abrir
                  </button>
                )}
                {!item.leida && (
                  <button type="button" className="enlace-accion" onClick={() => onMarcarLeida?.(item.id)}>
                    Marcar leída
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
