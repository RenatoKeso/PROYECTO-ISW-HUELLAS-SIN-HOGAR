import { Link } from "react-router-dom";
import RevisionFinalForm from "./RevisionFinalForm.jsx";
import RevisionInicialVista from "./RevisionInicialVista.jsx";
import HistorialMedico from "./HistorialMedico.jsx";
import SeguimientosMedicos from "./SeguimientosMedicos.jsx";
import { formatearFecha } from "../../utils/formatoAdopcion.js";
import {
  ETIQUETAS_CLASIFICACION_SALUD,
  ETIQUETAS_ESTADO_VALIDACION,
} from "../../utils/registroMedicoOpciones.js";

function inicialAvatar(nombre) {
  return (nombre?.trim()?.[0] ?? "?").toUpperCase();
}

function claseEstado(estado) {
  if (estado === "PROVISIONAL" || estado === "VALIDACION_PENDIENTE") return "pendiente";
  if (estado === "REVISANDO") return "revisando";
  return "actualizado";
}

export default function RevisionCompletaVista({
  registro,
  usuario,
  onSubmit,
  onExito,
  bloqueado = false,
  onCerrar,
  onCorregirInicial,
  onIrInicial,
  onIrTodos,
  encabezado = null,
  mostrarMigas = true,
  mostrarBanner = true,
  mostrarAnimal = true,
  mostrarTabs = true,
  mostrarComplementarias = true,
  historial = [],
  seguimientos = [],
  corrigiendoInicial = false,
  onCancelarCorreccion,
}) {
  if (!registro) return null;

  const nombre = registro.animal?.nombre || "Sin nombre";
  const estado = registro.estadoValidacion;
  const observacion = registro.observacionInicial?.trim();
  const observacionCorta = observacion
    ? observacion.length > 72
      ? `${observacion.slice(0, 72)}...`
      : observacion
    : "Sin anomalías críticas reportadas al ingreso.";

  return (
    <div className="revision-inicial-vista revision-completa-vista">
      {mostrarMigas && (
        <nav aria-label="Ruta de navegación" className="revision-inicial-migas">
          <ol>
            <li>
              <Link to="/salud/registros-medicos">
                <span className="material-symbols-outlined" aria-hidden="true">
                  home
                </span>
                Control Clínico
              </Link>
            </li>
            <li>
              <Link to="/salud/registros-medicos">Registro médico</Link>
            </li>
            <li aria-current="page">
              <span className="revision-inicial-migas-animal">{nombre}</span>
            </li>
          </ol>
          {onCerrar ? (
            <button
              type="button"
              className="revision-inicial-volver"
              onClick={onCerrar}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
              Volver al listado
            </button>
          ) : (
            <Link to="/salud/registros-medicos" className="revision-inicial-volver">
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
              Volver al listado
            </Link>
          )}
        </nav>
      )}

      {mostrarBanner && (
        <div className="revision-inicial-banner">
          <div className="revision-inicial-banner-info">
            <div className="revision-inicial-banner-icono">
              <span className="material-symbols-outlined" aria-hidden="true">
                check
              </span>
            </div>
            <div>
              <h2>Revisión inicial registrada correctamente</h2>
              <p>
                La ficha básica ha sido verificada. Puedes proceder con la
                evaluación completa y plan sanitario.
              </p>
            </div>
          </div>
          <span className="revision-inicial-paso">Paso 2 de 2</span>
        </div>
      )}

      {encabezado}

      {mostrarTabs && (
        <div className="revision-inicial-encabezado revision-completa-encabezado">
          <div>
            <h1>Registro Médico</h1>
            <p>
              Consulta, diagnostica y gestiona las revisiones clínicas de los
              animales rescatados.
            </p>
          </div>
          <div className="revision-inicial-tabs" role="tablist" aria-label="Etapas de revisión">
            <button
              type="button"
              role="tab"
              aria-selected="false"
              onClick={onIrInicial}
            >
              Revisión inicial
            </button>
            <button type="button" role="tab" aria-selected="true" className="activa">
              Revisión completa
            </button>
            <button type="button" role="tab" aria-selected="false" onClick={onIrTodos}>
              Todos
            </button>
          </div>
        </div>
      )}

      {mostrarAnimal && (
        <section className="revision-inicial-animal">
          <div className="revision-inicial-animal-cabecera">
            <div className="revision-inicial-animal-identidad">
              <div className="revision-inicial-avatar">
                {registro.animal?.imagenUrl ? (
                  <img src={registro.animal.imagenUrl} alt="" loading="lazy" />
                ) : (
                  inicialAvatar(nombre)
                )}
                <span className="revision-inicial-avatar-pata" aria-hidden="true">
                  <span className="material-symbols-outlined">pets</span>
                </span>
              </div>
              <div className="revision-inicial-animal-texto">
                <div className="revision-inicial-animal-titulo">
                  <h2>{nombre}</h2>
                  <span
                    className={`revision-inicial-estado-pill revision-inicial-estado-pill--${claseEstado(
                      estado,
                    )}`}
                  >
                    <span aria-hidden="true" />
                    {(ETIQUETAS_ESTADO_VALIDACION[estado] ?? estado ?? "Sin estado").toUpperCase()}
                  </span>
                </div>
                <p>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    schedule
                  </span>
                  Registrado el <strong>{formatearFecha(registro.createdAt)}</strong> por{" "}
                  {usuario?.nombre ?? "Recepción Veterinaria"}
                </p>
              </div>
            </div>

            <div className="revision-completa-acciones">
              {onCorregirInicial && (
                <button
                  type="button"
                  className="revision-completa-corregir"
                  onClick={onCorregirInicial}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    edit
                  </span>
                  Corregir revisión inicial
                </button>
              )}
              {onCerrar ? (
                <button
                  type="button"
                  className="revision-inicial-cerrar"
                  onClick={onCerrar}
                  title="Cerrar la ficha actual"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    close
                  </span>
                  Cerrar ficha
                </button>
              ) : (
                <Link to="/salud/registros-medicos" className="revision-inicial-cerrar">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    close
                  </span>
                  Cerrar ficha
                </Link>
              )}
            </div>
          </div>

          <div className="revision-inicial-animal-datos revision-completa-animal-datos">
            <div>
              <span>Peso inicial</span>
              <strong>
                {registro.pesoKg != null ? `${registro.pesoKg} kg` : "Sin registrar"}
              </strong>
            </div>
            <div>
              <span>Clasificación de salud</span>
              <strong className="revision-completa-salud">
                {ETIQUETAS_CLASIFICACION_SALUD[registro.clasificacionSalud] ??
                  registro.clasificacionSalud ??
                  "Sin clasificar"}
              </strong>
            </div>
            <div>
              <span>Observación previa</span>
              <strong className="revision-completa-observacion">
                “{observacionCorta}”
              </strong>
            </div>
          </div>
        </section>
      )}

      {corrigiendoInicial ? (
        <RevisionInicialVista
          registro={registro}
          usuario={usuario}
          modo="corregir"
          onSubmit={onSubmit}
          onCancelar={onCancelarCorreccion}
          mostrarMigas={false}
          mostrarBanner={false}
          mostrarAnimal={false}
        />
      ) : (
        <RevisionFinalForm
          registro={registro}
          onSubmit={onSubmit}
          onExito={onExito}
          bloqueado={bloqueado}
        />
      )}

      {mostrarComplementarias && (
        <div className="revision-completa-complementarias">
          <section className="revision-completa-complementaria">
            <div className="revision-completa-complementaria-cabecera">
              <h3>
                <span className="material-symbols-outlined" aria-hidden="true">
                  history
                </span>
                Historial médico
              </h3>
              <span>
                {historial.length} {historial.length === 1 ? "versión" : "versiones"}
              </span>
            </div>
            {historial.length ? (
              <div className="revision-completa-complementaria-lista">
                <HistorialMedico historial={historial} />
              </div>
            ) : (
              <div className="revision-completa-complementaria-vacio">
                <span className="material-symbols-outlined" aria-hidden="true">
                  description
                </span>
                <strong>No hay versiones en el historial médico</strong>
                <p>El expediente se actualizará cuando registres la evaluación completa.</p>
              </div>
            )}
            <p className="revision-completa-complementaria-pie">
              Expediente Clínico Digital v1.0
            </p>
          </section>

          <section className="revision-completa-complementaria">
            <div className="revision-completa-complementaria-cabecera">
              <h3>
                <span className="material-symbols-outlined" aria-hidden="true">
                  event_note
                </span>
                Seguimientos
              </h3>
              <span>
                {seguimientos.length} {seguimientos.length === 1 ? "evento" : "eventos"}
              </span>
            </div>
            {seguimientos.length ? (
              <div className="revision-completa-complementaria-lista">
                <SeguimientosMedicos seguimientos={seguimientos} />
              </div>
            ) : (
              <div className="revision-completa-complementaria-vacio">
                <span className="material-symbols-outlined" aria-hidden="true">
                  calendar_month
                </span>
                <strong>No hay seguimientos médicos registrados</strong>
                <p>Podrás programar controles, vacunas o curaciones tras la revisión.</p>
              </div>
            )}
            <p className="revision-completa-complementaria-pie">
              Control de tratamientos y vacunación
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
