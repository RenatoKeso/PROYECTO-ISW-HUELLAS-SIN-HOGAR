import { Link } from "react-router-dom";
import RevisionInicialForm from "./RevisionInicialForm.jsx";
import { formatearFecha } from "../../utils/formatoAdopcion.js";
import {
  ETIQUETAS_ESPECIE,
  ETIQUETAS_ESTADO_VALIDACION,
  ETIQUETAS_SEXO,
} from "../../utils/registroMedicoOpciones.js";

function inicialAvatar(nombre) {
  return (nombre?.trim()?.[0] ?? "?").toUpperCase();
}

function claseEstado(estado) {
  if (estado === "PROVISIONAL") return "pendiente";
  if (estado === "VALIDACION_PENDIENTE") return "pendiente";
  if (estado === "REVISANDO") return "revisando";
  return "actualizado";
}

export default function RevisionInicialVista({
  registro,
  usuario,
  onSubmit,
  modo = "registrar",
  onCancelar,
  bloqueado = false,
  onCerrar,
  encabezado = null,
  mostrarMigas = true,
  mostrarBanner = true,
  mostrarAnimal = true,
}) {
  if (!registro) return null;

  const nombre = registro.animal?.nombre || "Sin nombre";
  const estado = registro.estadoValidacion;
  const esCorreccion = modo === "corregir";

  return (
    <div className="revision-inicial-vista">
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
              <h2>
                {esCorreccion
                  ? "Corrección de revisión inicial"
                  : "Ficha de ingreso registrada correctamente"}
              </h2>
              <p>
                {esCorreccion
                  ? "Actualiza la evaluación inicial. Esta corrección solo puede realizarse una vez."
                  : "La ficha básica ha sido verificada. Puedes proceder con la evaluación clínica inicial."}
              </p>
            </div>
          </div>
          <span className="revision-inicial-paso">Paso 1 de 2</span>
        </div>
      )}

      {encabezado}

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
                    {(estado === "PROVISIONAL"
                      ? "Validación pendiente"
                      : (ETIQUETAS_ESTADO_VALIDACION[estado] ??
                        estado ??
                        "Sin estado")
                    ).toUpperCase()}
                  </span>
                </div>
                <p>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    schedule
                  </span>
                  Registrado el{" "}
                  <strong>{formatearFecha(registro.createdAt)}</strong> por{" "}
                  {usuario?.nombre ?? "Recepción Veterinaria"}
                </p>
              </div>
            </div>
            {onCerrar && (
              <button
                type="button"
                className="revision-inicial-cerrar"
                onClick={onCerrar}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  close
                </span>
                Cerrar ficha
              </button>
            )}
          </div>
          <div className="revision-inicial-animal-datos">
            <div>
              <span>Especie</span>
              <strong>
                {ETIQUETAS_ESPECIE[registro.animal?.especie] ?? "Sin especie"}
              </strong>
            </div>
            <div>
              <span>Sexo</span>
              <strong>
                {ETIQUETAS_SEXO[registro.animal?.sexoAnimal] ?? "Sin determinar"}
              </strong>
            </div>
            <div>
              <span>Edad</span>
              <strong>
                {registro.animal?.edad != null
                  ? `${registro.animal.edad} años`
                  : "Sin registrar"}
              </strong>
            </div>
          </div>
        </section>
      )}

      <RevisionInicialForm
        registro={registro}
        onSubmit={onSubmit}
        modo={modo}
        bloqueado={bloqueado}
        onCancelar={onCancelar}
      />
    </div>
  );
}
