import { useState } from "react";
import VentanaModal from "../ui/VentanaModal.jsx";
import FormularioEdicionRegistroMedico from "./FormularioEdicionRegistroMedico.jsx";
import RevisionInicialVista from "./RevisionInicialVista.jsx";
import HistorialMedico from "./HistorialMedico.jsx";
import SeguimientosMedicos from "./SeguimientosMedicos.jsx";
import RevisionCompletaVista from "./RevisionCompletaVista.jsx";
import {
  puedeActualizarRegistroMedico,
  puedeRegistrarRevisionInicial,
  puedeActualizarRevisionInicial,
  puedeRealizarRevisionFinal,
} from "../../utils/permisosUsuario.js";
import { formatearFecha } from "../../utils/formatoAdopcion.js";
import { esMismoDia, estadoSaludActual } from "../../utils/filtrosHistorialMedico.js";
import {
  ETIQUETAS_CLASIFICACION_SALUD,
  ETIQUETAS_ESTADO_VALIDACION,
  ETIQUETAS_ESPECIE,
  ETIQUETAS_SEXO,
} from "../../utils/registroMedicoOpciones.js";

const CLASES_ESTADO = {
  PROVISIONAL: "inicial",
  VALIDACION_PENDIENTE: "pendiente",
  REVISANDO: "revisando",
  REALIZADO: "realizada",
  ACTUALIZADO: "actualizado",
};

const ETIQUETAS_ADOPTABILIDAD = {
  ADOPTABLE: "Apto para adopción",
  NO_ADOPTABLE: "No apto temporalmente",
};

const ID_FORMULARIO_EDICION = "ficha-modal-edicion-registro";

function inicialAvatar(nombre) {
  return (nombre?.trim()?.[0] ?? "?").toUpperCase();
}

function claseEstado(estado) {
  return CLASES_ESTADO[estado] ?? "neutro";
}

function etiquetaAdoptabilidad(valor) {
  return ETIQUETAS_ADOPTABILIDAD[valor] ?? "Sin definir";
}

function formatearUltimaRevision(registro) {
  const valor =
    registro?.updatedAt ?? registro?.fechaRevisionInicial ?? registro?.createdAt;
  if (!valor) return "—";

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";

  if (esMismoDia(valor)) {
    const hora = fecha.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Hoy, ${hora} hrs`;
  }

  return formatearFecha(valor);
}

function valorOTexto(valor, textoVacio = "—") {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return textoVacio;
  }
  return valor;
}

export default function FichaMedicaModal({
  registro,
  historial = [],
  seguimientos = [],
  usuario,
  cargando = false,
  error = "",
  editando: editandoProp = false,
  iniciadaEnModal = false,
  onCerrar,
  onIniciar,
  onGuardar,
  onCancelar,
  onCorregirInicial,
  onRevisionInicial,
  onRevisionFinal,
  onExitoEdicion,
  onRefrescar,
}) {
  const editando = editandoProp ?? false;
  const [correccionVisible, setCorreccionVisible] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const estado = registro?.estadoValidacion;
  const nombre = registro?.animal?.nombre ?? "Sin nombre";
  const codigo = registro?.animal?.codigoAnimal ?? "-";
  const salud = estadoSaludActual(registro);
  const esVeterinaria = puedeActualizarRegistroMedico(usuario);

  const puedeEditar =
    esVeterinaria && ["REALIZADO", "ACTUALIZADO", "REVISANDO"].includes(estado);
  const puedeCorregirInicial =
    puedeActualizarRevisionInicial(usuario) &&
    Boolean(registro?.revisionInicial) &&
    !registro?.revisionInicial?.fechaActualizacion &&
    estado !== "PROVISIONAL";
  const puedeRegistrarInicial =
    puedeRegistrarRevisionInicial(usuario) && estado === "PROVISIONAL";
  const puedeRevisionFinal =
    puedeRealizarRevisionFinal(usuario) && estado === "VALIDACION_PENDIENTE";
  const puedeVerHistorial = Boolean(historial.length);
  const puedeVerSeguimientos = Boolean(seguimientos.length);

  const accionEdicion = puedeEditar
    ? "actualizar"
    : puedeRevisionFinal
      ? "final"
      : puedeRegistrarInicial
        ? "inicial"
        : puedeCorregirInicial
          ? "correccion"
          : null;
  const etiquetaAccionEdicion =
    {
      actualizar: "Editar campos",
      final: "Editar revisión completa",
      inicial: "Editar revisión inicial",
      correccion: "Corregir revisión inicial",
    }[accionEdicion] ?? "Editar campos";

  function desplazarA(id) {
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView?.({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function manejarAccionEdicion() {
    if (accionEdicion === "actualizar") {
      void iniciarEdicion();
      return;
    }

    if (accionEdicion === "final") {
      desplazarA("seccion-revision-completa");
      return;
    }

    if (accionEdicion === "correccion") {
      setCorreccionVisible(true);
      desplazarA("seccion-revision-inicial");
      return;
    }

    if (accionEdicion === "inicial") {
      desplazarA("seccion-revision-inicial");
    }
  }

  async function iniciarEdicion() {
    setErrorEdicion("");
    setGuardando(true);
    try {
      await onIniciar?.();
      onExitoEdicion?.("Actualización iniciada");
    } catch (errorInicio) {
      setErrorEdicion(errorInicio.message);
    } finally {
      setGuardando(false);
    }
  }

  async function cancelarEdicion() {
    if (iniciadaEnModal && estado === "REVISANDO") {
      try {
        await onCancelar?.();
      } catch (errorCancelar) {
        setErrorEdicion(errorCancelar.message);
      }
    }
    onExitoEdicion?.();
  }

  function guardarExito(respuesta) {
    const mensaje = respuesta?.message ?? "Registro médico actualizado correctamente";
    setErrorEdicion("");
    onRefrescar?.();
    onExitoEdicion?.(mensaje);
  }

  if (cargando) {
    return (
      <VentanaModal
        ariaLabelledby="ficha-medica-cargando"
        alCerrar={onCerrar}
        className="ficha-medica-modal"
        sinBotonCerrar
      >
        <p id="ficha-medica-cargando">Cargando ficha médica...</p>
      </VentanaModal>
    );
  }

  if (!registro) {
    return (
      <VentanaModal
        ariaLabel="Ficha médica"
        alCerrar={onCerrar}
        className="ficha-medica-modal"
        sinBotonCerrar
      >
        <p>No se pudo cargar la ficha médica.</p>
      </VentanaModal>
    );
  }

  const pesoActual = registro.revisionCompleta?.peso ?? registro.pesoKg;
  const constantes = [
    {
      etiqueta: "Peso actual",
      valor: pesoActual != null ? `${pesoActual} kg` : "—",
    },
    {
      etiqueta: "Estado de salud",
      valor: ETIQUETAS_CLASIFICACION_SALUD[salud] ?? "Sin definir",
    },
    {
      etiqueta: "Aislamiento / Cuarentena",
      valor: registro.requiereCuarentena ? "Sí, activa" : "No requiere",
    },
    {
      etiqueta: "Adoptabilidad",
      valor: etiquetaAdoptabilidad(registro.animal?.estadoAdopcion),
    },
  ];

  const hallazgos = [
    ["Evolución / Observación de ingreso", registro.observacionInicial],
    [
      "Condición clínica y nutricional",
      registro.revisionCompleta?.descripcionCondicionMedica,
    ],
    [
      "Cuidados especiales requeridos",
      registro.revisionCompleta?.descripcionCuidadosEspeciales,
    ],
  ];

  const enfermedades = registro.enfermedades ?? [];
  const tratamientos = registro.tratamientos ?? [];
  const atenciones = registro.atencionesSanitarias ?? [];
  const controles = [...atenciones]
    .filter((atencion) => atencion.estado === "PENDIENTE")
    .sort((a, b) => String(a.fechaProgramada).localeCompare(String(b.fechaProgramada)));

  return (
    <VentanaModal
      ariaLabelledby="ficha-medica-titulo"
      alCerrar={onCerrar}
      className="ficha-medica-modal"
      sinBotonCerrar
    >
      <div className="ficha-medica">
        <header className="ficha-medica-cabecera">
          <div className="ficha-medica-paciente">
            <div
              className={`ficha-medica-avatar ficha-medica-avatar--${claseEstado(estado)}`}
            >
              {registro.animal?.imagenUrl ? (
                <img src={registro.animal.imagenUrl} alt="" loading="lazy" />
              ) : (
                inicialAvatar(nombre)
              )}
            </div>
            <div className="ficha-medica-cabecera-texto">
              <div className="ficha-medica-titulo">
                <h2 id="ficha-medica-titulo">Registro Médico · {nombre}</h2>
                <span className="ficha-medica-codigo">{codigo}</span>
                <span
                  className={`estado-clinico-pill estado-clinico-pill--${claseEstado(estado)}`}
                >
                  <span className="estado-clinico-punto" aria-hidden="true" />
                  {ETIQUETAS_ESTADO_VALIDACION[estado] ?? estado}
                </span>
              </div>
              <div className="ficha-medica-meta">
                <span className="ficha-medica-meta-item">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    pets
                  </span>
                  {ETIQUETAS_ESPECIE[registro.animal?.especie] ??
                    registro.animal?.especie ??
                    "Sin especie"}
                  {registro.animal?.raza ? ` ${registro.animal.raza}` : ""}
                  {registro.animal?.edad != null ? ` (~${registro.animal.edad} años)` : ""}
                </span>
                <span className="ficha-medica-meta-separador" aria-hidden="true">
                  •
                </span>
                <span className="ficha-medica-meta-item">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    schedule
                  </span>
                  Última revisión: {formatearUltimaRevision(registro)}
                </span>
              </div>
            </div>
          </div>

          <div className="ficha-medica-cabecera-acciones">
            {!editando && accionEdicion && (
              <button
                type="button"
                className="ficha-medica-accion ficha-medica-accion--editar"
                onClick={manejarAccionEdicion}
                disabled={guardando}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  edit
                </span>
                <span>{guardando ? "Iniciando..." : etiquetaAccionEdicion}</span>
              </button>
            )}
            <a
              className="ficha-medica-accion"
              href={`/registro/fichas?ficha=${registro.animalId}`}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                pets
              </span>
              <span>Ir a la ficha del animal</span>
              <span className="material-symbols-outlined ficha-medica-accion-externa" aria-hidden="true">
                open_in_new
              </span>
            </a>
            <button
              type="button"
              className="ficha-medica-cerrar"
              onClick={onCerrar}
              aria-label="Cerrar ficha médica"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        </header>

        <div className="ficha-medica-cuerpo">
          <div className="ficha-medica-info">
            <div className="ficha-medica-info-datos">
              <span className="ficha-medica-info-item">
                <span className="ficha-medica-info-etiqueta">Sexo</span>
                <strong>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  {ETIQUETAS_SEXO[registro.animal?.sexoAnimal] ??
                    registro.animal?.sexoAnimal ??
                    "Sin determinar"}
                </strong>
              </span>
              <span className="ficha-medica-info-divisor" aria-hidden="true" />
              <span className="ficha-medica-info-item">
                <span className="ficha-medica-info-etiqueta">Veterinario Responsable</span>
                <strong>
                  {historial[0]?.actualizadoPor?.nombre ??
                    registro.revisionCompleta?.createdBy?.nombre ??
                    "—"}
                </strong>
              </span>
            </div>
            <span className={`ficha-medica-info-modo ${editando ? "modo-edicion" : ""}`}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {editando
                  ? "lock_open"
                  : accionEdicion && accionEdicion !== "actualizar"
                    ? "edit_note"
                    : "visibility"}
              </span>
              {editando
                ? "Modo Edición Clínico"
                : accionEdicion && accionEdicion !== "actualizar"
                  ? "Revisión requerida"
                  : "Solo lectura"}
            </span>
          </div>

          {!editando && accionEdicion && accionEdicion !== "actualizar" && (
            <p className="ficha-medica-aviso">
              {accionEdicion === "final"
                ? "La ficha está pendiente de revisión completa. Usa «Editar revisión completa» para modificar los campos clínicos."
                : accionEdicion === "inicial"
                  ? "La ficha está pendiente de revisión inicial. Usa «Editar revisión inicial» para modificar los campos clínicos."
                  : "La revisión inicial se puede corregir una sola vez."}
            </p>
          )}

          {error && <p className="ficha-medica-mensaje mensaje mensaje-error">{error}</p>}
          {errorEdicion && (
            <p className="ficha-medica-mensaje mensaje mensaje-error">{errorEdicion}</p>
          )}

          {editando ? (
            <FormularioEdicionRegistroMedico
              idFormulario={ID_FORMULARIO_EDICION}
              registro={registro}
              onGuardar={onGuardar}
              onExito={guardarExito}
              onEnvioFinalizado={() => {}}
              onEnviandoChange={setGuardando}
            />
          ) : (
            <>
              <section className="ficha-medica-seccion">
                <h3>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    monitor_heart
                  </span>
                  1. Evaluación y constantes médicas
                </h3>
                <div className="ficha-medica-constantes">
                  {constantes.map((dato) => (
                    <div className="ficha-medica-dato" key={dato.etiqueta}>
                      <span className="ficha-medica-dato-etiqueta">
                        {dato.etiqueta}
                      </span>
                      <span className="ficha-medica-dato-valor">{dato.valor}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="ficha-medica-seccion">
                <h3>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    notes
                  </span>
                  2. Hallazgos clínicos y observaciones
                </h3>
                <div className="ficha-medica-hallazgos">
                  {hallazgos.map(([etiqueta, valor]) => (
                    <div key={etiqueta} className="ficha-medica-hallazgo">
                      <span className="ficha-medica-hallazgo-etiqueta">{etiqueta}</span>
                      <p className="ficha-medica-hallazgo-valor">
                        {valorOTexto(valor, "Sin detalles registrados.")}
                      </p>
                    </div>
                  ))}
                </div>
                {(registro.revisionCompleta?.discapacidades ||
                  registro.revisionCompleta?.lesiones) && (
                  <details className="ficha-edicion-extra ficha-medica-extra">
                    <summary>Más detalles clínicos</summary>
                    <div className="ficha-medica-hallazgos ficha-medica-hallazgos--secundarios">
                      <div className="ficha-medica-hallazgo">
                        <span className="ficha-medica-hallazgo-etiqueta">Discapacidades</span>
                        <p className="ficha-medica-hallazgo-valor">
                          {valorOTexto(registro.revisionCompleta?.discapacidades)}
                        </p>
                      </div>
                      <div className="ficha-medica-hallazgo">
                        <span className="ficha-medica-hallazgo-etiqueta">Lesiones</span>
                        <p className="ficha-medica-hallazgo-valor">
                          {valorOTexto(registro.revisionCompleta?.lesiones)}
                        </p>
                      </div>
                    </div>
                  </details>
                )}
              </section>

              <section className="ficha-medica-seccion">
                <h3>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    medication
                  </span>
                  3. Tratamientos, diagnósticos y seguimiento
                </h3>
                <div className="ficha-medica-tarjeta ficha-medica-diagnosticos">
                  <div className="ficha-medica-subseccion">
                    <h4>Diagnóstico presuntivo / activo</h4>
                    {enfermedades.length ? (
                      <ul className="ficha-medica-lista">
                        {enfermedades.map((enfermedad) => (
                          <li key={enfermedad.id}>
                            <strong>{enfermedad.descripcionEnfermedad}</strong>
                            {enfermedad.tipoEnfermedad
                              ? ` · ${enfermedad.tipoEnfermedad}`
                              : ""}
                            {enfermedad.estadoEnfermedad
                              ? ` · ${enfermedad.estadoEnfermedad}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ficha-edicion-vacio">Sin diagnósticos registrados.</p>
                    )}
                  </div>

                  <div className="ficha-medica-subseccion">
                    <h4>Próximo control programado</h4>
                    {controles.length ? (
                      <ul className="ficha-medica-lista">
                        {controles.map((control) => (
                          <li key={control.id}>
                            {control.tipo} ·{" "}
                            {formatearFecha(control.fechaProgramada, { soloFecha: true })}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ficha-edicion-vacio">Sin controles programados.</p>
                    )}
                  </div>

                  <div className="ficha-medica-subseccion">
                    <h4>Medicación y posología prescrita</h4>
                    {tratamientos.length ? (
                      <ul className="ficha-medica-lista">
                        {tratamientos.map((tratamiento) => (
                          <li key={tratamiento.id}>
                            <strong>{tratamiento.descripcionTratamiento}</strong>
                            {tratamiento.fechaInicio
                              ? ` · ${formatearFecha(tratamiento.fechaInicio, {
                                  soloFecha: true,
                                })}`
                              : ""}
                            {tratamiento.observaciones
                              ? ` · ${tratamiento.observaciones}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ficha-edicion-vacio">Sin tratamientos registrados.</p>
                    )}
                  </div>
                </div>
              </section>

              {puedeVerHistorial && (
                <section className="ficha-medica-seccion">
                  <h3>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      history
                    </span>
                    Historial médico
                  </h3>
                  <div className="ficha-medica-tarjeta">
                    <HistorialMedico historial={historial} />
                  </div>
                </section>
              )}

              {puedeVerSeguimientos && (
                <section className="ficha-medica-seccion">
                  <h3>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      event_note
                    </span>
                    Seguimientos
                  </h3>
                  <div className="ficha-medica-tarjeta">
                    <SeguimientosMedicos seguimientos={seguimientos} />
                  </div>
                </section>
              )}

              {puedeRegistrarInicial && (
                <section className="ficha-medica-seccion" id="seccion-revision-inicial">
                  <RevisionInicialVista
                    registro={registro}
                    usuario={usuario}
                    modo="registrar"
                    onSubmit={onRevisionInicial}
                    mostrarMigas={false}
                    mostrarAnimal={false}
                  />
                </section>
              )}

              {puedeCorregirInicial && (
                <section className="ficha-medica-seccion" id="seccion-revision-inicial">
                  {!correccionVisible ? (
                    <button
                      type="button"
                      className="ficha-modal-boton ficha-modal-boton--secundario"
                      onClick={() => setCorreccionVisible(true)}
                    >
                      Corregir revisión inicial
                    </button>
                  ) : (
                    <RevisionInicialVista
                      registro={registro}
                      usuario={usuario}
                      modo="corregir"
                      onSubmit={onCorregirInicial}
                      onCancelar={() => setCorreccionVisible(false)}
                      mostrarMigas={false}
                      mostrarAnimal={false}
                    />
                  )}
                </section>
              )}

              {puedeRevisionFinal && (
                <section className="ficha-medica-seccion" id="seccion-revision-completa">
                  <RevisionCompletaVista
                    registro={registro}
                    usuario={usuario}
                    onSubmit={onRevisionFinal}
                    onExito={() => onRefrescar?.()}
                    mostrarMigas={false}
                    mostrarBanner={false}
                    mostrarAnimal={false}
                    mostrarTabs={false}
                    mostrarComplementarias={false}
                  />
                </section>
              )}
            </>
          )}
        </div>

        <footer className="ficha-medica-pie">
          <div className="ficha-medica-pie-izq">
            <span className="material-symbols-outlined" aria-hidden="true">
              verified_user
            </span>
            Registrado en Huellas Sin Hogar · Ficha auditada
          </div>
          <div className="ficha-medica-pie-der">
            {editando ? (
              <>
                <button
                  type="button"
                  className="ficha-modal-boton ficha-modal-boton--secundario"
                  onClick={cancelarEdicion}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <a
                  className="ficha-modal-boton ficha-modal-boton--secundario"
                  href={`/registro/fichas?ficha=${registro.animalId}`}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    pets
                  </span>
                  Ficha de Animal
                </a>
                <button
                  type="submit"
                  form={ID_FORMULARIO_EDICION}
                  className="ficha-modal-boton ficha-modal-boton--primario"
                  disabled={guardando}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    save
                  </span>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </>
            ) : (
              <>
                <a
                  className="ficha-modal-boton ficha-modal-boton--secundario"
                  href={`/registro/fichas?ficha=${registro.animalId}`}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    pets
                  </span>
                  Ficha de Animal
                </a>
                {puedeEditar ? (
                  <button
                    type="button"
                    className="ficha-modal-boton ficha-modal-boton--primario"
                    onClick={iniciarEdicion}
                    disabled={guardando}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      edit
                    </span>
                    {guardando ? "Iniciando..." : "Editar ficha"}
                  </button>
                ) : (
                  accionEdicion && (
                    <button
                      type="button"
                      className="ficha-modal-boton ficha-modal-boton--primario"
                      onClick={manejarAccionEdicion}
                      disabled={guardando}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        edit
                      </span>
                      {etiquetaAccionEdicion}
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </footer>
      </div>
    </VentanaModal>
  );
}
