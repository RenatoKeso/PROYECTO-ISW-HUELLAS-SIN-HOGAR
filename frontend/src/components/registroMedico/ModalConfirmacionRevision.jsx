import { formatearFechaLarga } from "../../utils/formatoAdopcion.js";
import { estadoSaludActual } from "../../utils/filtrosHistorialMedico.js";
import {
  ETIQUETAS_CLASIFICACION_SALUD,
  ETIQUETAS_ESTADO_VALIDACION,
} from "../../utils/registroMedicoOpciones.js";
import VentanaModal from "../ui/VentanaModal.jsx";

const COPY = {
  inicial: {
    titulo: "¡Revisión inicial registrada con éxito!",
    descripcion:
      "La revisión inicial de {nombre} ({codigo}) ha sido registrada correctamente.",
    estado: "Revisión inicial registrada",
  },
  completa: {
    titulo: "¡Revisión médica registrada con éxito!",
    descripcion:
      "La revisión médica completa de {nombre} ({codigo}) ha sido registrada correctamente en el expediente clínico digital.",
    estado: "Actualizado / Aprobado",
  },
};

export default function ModalConfirmacionRevision({
  tipo = "completa",
  registro,
  fecha,
  responsable,
  onAceptar,
  onVerExpediente,
  onCerrar,
}) {
  const copy = COPY[tipo] ?? COPY.completa;
  const nombre = registro?.animal?.nombre ?? "Sin nombre";
  const codigo = registro?.animal?.codigoAnimal ?? "-";
  const salud = estadoSaludActual(registro);

  return (
    <VentanaModal
      ariaLabelledby="confirmacion-revision-titulo"
      alCerrar={onCerrar}
      className="confirmacion-revision-modal"
      sinBotonCerrar
    >
      <button
        type="button"
        className="ventana-cerrar confirmacion-revision-cerrar"
        onClick={onCerrar}
        aria-label="Cerrar confirmación"
      >
        ✕
      </button>

      <div className="confirmacion-revision">
        <div className="confirmacion-revision-icono">
          <span className="material-symbols-outlined" aria-hidden="true">
            verified
          </span>
        </div>

        <h2 id="confirmacion-revision-titulo" className="confirmacion-revision-titulo">
          {copy.titulo}
        </h2>

        <p className="confirmacion-revision-descripcion">
          {copy.descripcion
            .replace("{nombre}", nombre)
            .replace("{codigo}", codigo)}
        </p>

        <div className="confirmacion-revision-resumen">
          <div className="confirmacion-revision-fila">
            <span className="confirmacion-revision-etiqueta">
              Código y Paciente
            </span>
            <span className="confirmacion-revision-valor">
              <code>{codigo}</code> · {nombre}
            </span>
          </div>

          <div className="confirmacion-revision-fila">
            <span className="confirmacion-revision-etiqueta">
              Estado clínico
            </span>
            <span
              className={`estado-chip confirmacion-revision-estado estado-${registro?.estadoValidacion}`}
            >
              {ETIQUETAS_ESTADO_VALIDACION[registro?.estadoValidacion] ??
                copy.estado}
            </span>
            {salud && (
              <span className={`salud-chip salud-${salud}`}>
                {ETIQUETAS_CLASIFICACION_SALUD[salud] ?? salud}
              </span>
            )}
          </div>

          <div className="confirmacion-revision-fila">
            <span className="confirmacion-revision-etiqueta">
              Fecha y hora
            </span>
            <span className="confirmacion-revision-valor">
              {formatearFechaLarga(fecha)}
            </span>
          </div>

          <div className="confirmacion-revision-fila">
            <span className="confirmacion-revision-etiqueta">Responsable</span>
            <span className="confirmacion-revision-valor">{responsable}</span>
          </div>
        </div>

        <div className="confirmacion-revision-acciones">
          <button
            type="button"
            className="boton confirmacion-revision-aceptar"
            onClick={onAceptar}
          >
            Aceptar e ir al listado
          </button>
          <button
            type="button"
            className="boton boton-secundario confirmacion-revision-expediente"
            onClick={onVerExpediente}
          >
            Ver expediente completo
          </button>
        </div>
      </div>
    </VentanaModal>
  );
}
