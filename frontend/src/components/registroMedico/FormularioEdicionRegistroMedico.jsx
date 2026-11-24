import { useState } from "react";
import Campo from "../ui/Campo.jsx";
import Mensaje from "../ui/Mensaje.jsx";
import {
  crearActualizacionInicial,
  construirEntradaActualizacion,
  opcionesEnfermedadesRegistradas,
  opcionesTratamientosRegistrados,
} from "../../utils/registroMedicoForm.js";
import { actualizacionVeterinariaFormSchema } from "../../validations/registroMedicoValidation.js";
import { erroresDeZod } from "../../utils/erroresFormulario.js";
import {
  OPCIONES_CLASIFICACION_ACTUALIZACION,
  OPCIONES_CUARENTENA_ACTUALIZACION,
  OPCIONES_ESTADO_ATENCION,
  OPCIONES_ESTADO_ENFERMEDAD,
  OPCIONES_ESTADO_TRATAMIENTO,
  OPCIONES_EVOLUCION,
  OPCIONES_TIPO_ATENCION,
} from "../../utils/registroMedicoOpciones.js";

const ETIQUETAS_ADOPTABILIDAD = {
  ADOPTABLE: "Apto para adopción",
  NO_ADOPTABLE: "No apto temporalmente",
};

function etiquetaAdoptabilidad(valor) {
  return ETIQUETAS_ADOPTABILIDAD[valor] ?? "Sin definir";
}

export default function FormularioEdicionRegistroMedico({
  registro,
  idFormulario = "formulario-edicion-registro-medico",
  onGuardar,
  onExito,
  onEnvioFinalizado,
  onEnviandoChange,
}) {
  const [valores, setValores] = useState(() => crearActualizacionInicial(registro));
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enfermedadesRegistradas = registro?.enfermedades ?? [];
  const tratamientosRegistrados = registro?.tratamientos ?? [];
  const opcionesEnfermedades = opcionesEnfermedadesRegistradas(registro);
  const opcionesTratamientos = opcionesTratamientosRegistrados(registro);

  const adoptabilidad = registro?.animal?.estadoAdopcion ?? "";

  function cambiar(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
  }

  function cambiarFila(coleccion, indice, campo, valor) {
    setValores((prev) => {
      const copia = [...prev[coleccion]];
      copia[indice] = { ...copia[indice], [campo]: valor };
      return { ...prev, [coleccion]: copia };
    });
  }

  function agregarFila(coleccion, fila) {
    setValores((prev) => ({ ...prev, [coleccion]: [...prev[coleccion], fila] }));
  }

  function quitarFila(coleccion, indice) {
    setValores((prev) => ({
      ...prev,
      [coleccion]: prev[coleccion].filter((_, i) => i !== indice),
    }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (enviando) return;

    setMensaje(null);

    const resultado = actualizacionVeterinariaFormSchema.safeParse(valores);
    if (!resultado.success) {
      setErrores(erroresDeZod(resultado.error));
      return;
    }

    setErrores({});
    setEnviando(true);
    onEnviandoChange?.(true);
    try {
      const datos = construirEntradaActualizacion(valores);
      const respuesta = await onGuardar(datos);
      setMensaje({
        tipo: "exito",
        texto: respuesta.message ?? "Registro médico actualizado correctamente",
      });
      setValores(crearActualizacionInicial(registro));
      onExito?.(respuesta);
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setEnviando(false);
      onEnviandoChange?.(false);
      onEnvioFinalizado?.();
    }
  }

  return (
    <form id={idFormulario} className="ficha-edicion-form" onSubmit={guardar} noValidate>
      <section className="ficha-medica-seccion">
        <h3>
          <span className="material-symbols-outlined" aria-hidden="true">
            monitor_heart
          </span>
          1. Evaluación y constantes médicas
        </h3>
        <div className="ficha-medica-tarjeta ficha-edicion-grid ficha-edicion-grid--4">
          <Campo
            etiqueta="Peso actual (kg)"
            nombre="pesoKg"
            type="number"
            min={0}
            step="0.01"
            valor={valores.pesoKg}
            error={errores.pesoKg}
            onChange={(evento) => cambiar("pesoKg", evento.target.value)}
          />
          <Campo
            etiqueta="Estado de salud"
            nombre="clasificacionSalud"
            control="select"
            opciones={OPCIONES_CLASIFICACION_ACTUALIZACION}
            valor={valores.clasificacionSalud}
            error={errores.clasificacionSalud}
            onChange={(evento) => cambiar("clasificacionSalud", evento.target.value)}
          />
          <Campo
            etiqueta="Aislamiento / Cuarentena"
            nombre="requiereCuarentena"
            control="select"
            opciones={OPCIONES_CUARENTENA_ACTUALIZACION}
            valor={valores.requiereCuarentena}
            error={errores.requiereCuarentena}
            onChange={(evento) => cambiar("requiereCuarentena", evento.target.value)}
          />
          <Campo
            etiqueta="Adoptabilidad (solo lectura)"
            nombre="adoptabilidad"
            control="select"
            opciones={[{ valor: adoptabilidad, texto: etiquetaAdoptabilidad(adoptabilidad) }]}
            valor={adoptabilidad}
            disabled
            onChange={() => {}}
          />
          <Campo
            etiqueta="Evolución del estado"
            nombre="evolucionEstadoSalud"
            control="select"
            opciones={OPCIONES_EVOLUCION}
            valor={valores.evolucionEstadoSalud}
            error={errores.evolucionEstadoSalud}
            requerido
            onChange={(evento) => cambiar("evolucionEstadoSalud", evento.target.value)}
          />
          <Campo
            etiqueta="Fecha de registro"
            nombre="fechaRegistro"
            type="date"
            valor={valores.fechaRegistro}
            error={errores.fechaRegistro}
            onChange={(evento) => cambiar("fechaRegistro", evento.target.value)}
          />
        </div>
      </section>

      <section className="ficha-medica-seccion">
        <h3>
          <span className="material-symbols-outlined" aria-hidden="true">
            notes
          </span>
          2. Hallazgos clínicos y observaciones
        </h3>
        <div className="ficha-edicion-grid ficha-edicion-grid--2">
          <Campo
            etiqueta="Evolución / Observación de ingreso"
            nombre="observacionInicial"
            control="textarea"
            rows={4}
            valor={valores.observacionInicial}
            error={errores.observacionInicial}
            onChange={(evento) => cambiar("observacionInicial", evento.target.value)}
          />
          <Campo
            etiqueta="Condición clínica y nutricional"
            nombre="condiciones"
            control="textarea"
            rows={4}
            valor={valores.condiciones}
            onChange={(evento) => cambiar("condiciones", evento.target.value)}
          />
          <Campo
            etiqueta="Cuidados especiales requeridos"
            nombre="descripcionCuidadosEspeciales"
            control="textarea"
            rows={4}
            valor={valores.descripcionCuidadosEspeciales}
            onChange={(evento) =>
              cambiar("descripcionCuidadosEspeciales", evento.target.value)
            }
          />
          <Campo
            etiqueta="Observación de seguimiento"
            nombre="observacionSeguimiento"
            control="textarea"
            rows={4}
            valor={valores.observacionSeguimiento}
            error={errores.observacionSeguimiento}
            requerido
            onChange={(evento) =>
              cambiar("observacionSeguimiento", evento.target.value)
            }
          />
        </div>

        <details className="ficha-edicion-extra">
          <summary>Más detalles clínicos</summary>
          <div className="ficha-edicion-grid ficha-edicion-grid--3">
            <Campo
              etiqueta="Discapacidades"
              nombre="discapacidades"
              control="textarea"
              rows={3}
              valor={valores.discapacidades}
              onChange={(evento) => cambiar("discapacidades", evento.target.value)}
            />
            <Campo
              etiqueta="Lesiones"
              nombre="lesiones"
              control="textarea"
              rows={3}
              valor={valores.lesiones}
              onChange={(evento) => cambiar("lesiones", evento.target.value)}
            />
            <Campo
              etiqueta="Necesidades"
              nombre="necesidades"
              control="textarea"
              rows={3}
              valor={valores.necesidades}
              onChange={(evento) => cambiar("necesidades", evento.target.value)}
            />
          </div>
        </details>
      </section>

      <section className="ficha-medica-seccion">
        <h3>
          <span className="material-symbols-outlined" aria-hidden="true">
            medication
          </span>
          3. Tratamientos, diagnósticos y seguimiento
        </h3>

        <div className="ficha-medica-tarjeta ficha-edicion-listas">
          <div className="ficha-edicion-grupo">
            <div className="ficha-edicion-grupo-cabecera">
              <h4>Diagnóstico presuntivo / activo</h4>
              <button
                type="button"
                className="ficha-edicion-agregar"
                onClick={() =>
                  agregarFila("enfermedades", {
                    descripcionEnfermedad: "",
                    tipoEnfermedad: "",
                    estadoEnfermedad: "EN_CURSO",
                    observacionSeguimiento: "",
                  })
                }
              >
                <span className="material-symbols-outlined" aria-hidden="true">add</span>
                Agregar diagnóstico
              </button>
            </div>
            {!valores.enfermedades.length && (
              <p className="ficha-edicion-vacio">Sin diagnósticos nuevos.</p>
            )}
            {valores.enfermedades.map((fila, indice) => (
              <div className="ficha-edicion-fila ficha-edicion-fila--3" key={indice}>
                <Campo
                  etiqueta="Descripción"
                  nombre={`enfermedades.${indice}.descripcionEnfermedad`}
                  valor={fila.descripcionEnfermedad}
                  error={errores[`enfermedades.${indice}.descripcionEnfermedad`]}
                  onChange={(evento) =>
                    cambiarFila("enfermedades", indice, "descripcionEnfermedad", evento.target.value)
                  }
                />
                <Campo
                  etiqueta="Tipo"
                  nombre={`enfermedades.${indice}.tipoEnfermedad`}
                  valor={fila.tipoEnfermedad}
                  onChange={(evento) =>
                    cambiarFila("enfermedades", indice, "tipoEnfermedad", evento.target.value)
                  }
                />
                <Campo
                  etiqueta="Estado"
                  nombre={`enfermedades.${indice}.estadoEnfermedad`}
                  control="select"
                  opciones={OPCIONES_ESTADO_ENFERMEDAD}
                  valor={fila.estadoEnfermedad ?? "EN_CURSO"}
                  error={errores[`enfermedades.${indice}.estadoEnfermedad`]}
                  onChange={(evento) =>
                    cambiarFila("enfermedades", indice, "estadoEnfermedad", evento.target.value)
                  }
                />
                <button
                  type="button"
                  className="ficha-edicion-quitar"
                  aria-label={`Quitar diagnóstico ${indice + 1}`}
                  onClick={() => quitarFila("enfermedades", indice)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </div>
            ))}
          </div>

          <div className="ficha-edicion-grupo">
            <div className="ficha-edicion-grupo-cabecera">
              <h4>Medicación y posología prescrita</h4>
              <button
                type="button"
                className="ficha-edicion-agregar"
                onClick={() =>
                  agregarFila("tratamientos", {
                    descripcionTratamiento: "",
                    fechaInicio: "",
                    fechaFin: "",
                    observaciones: "",
                    estadoTratamiento: "EN_CURSO",
                    observacionSeguimiento: "",
                  })
                }
              >
                <span className="material-symbols-outlined" aria-hidden="true">add</span>
                Agregar tratamiento
              </button>
            </div>
            {!valores.tratamientos.length && (
              <p className="ficha-edicion-vacio">Sin tratamientos nuevos.</p>
            )}
            {valores.tratamientos.map((fila, indice) => (
              <div className="ficha-edicion-fila ficha-edicion-fila--3" key={indice}>
                <Campo
                  etiqueta="Descripción"
                  nombre={`tratamientos.${indice}.descripcionTratamiento`}
                  valor={fila.descripcionTratamiento}
                  error={errores[`tratamientos.${indice}.descripcionTratamiento`]}
                  onChange={(evento) =>
                    cambiarFila("tratamientos", indice, "descripcionTratamiento", evento.target.value)
                  }
                />
                <Campo
                  etiqueta="Fecha inicio"
                  nombre={`tratamientos.${indice}.fechaInicio`}
                  type="date"
                  valor={fila.fechaInicio}
                  error={errores[`tratamientos.${indice}.fechaInicio`]}
                  onChange={(evento) =>
                    cambiarFila("tratamientos", indice, "fechaInicio", evento.target.value)
                  }
                />
                <Campo
                  etiqueta="Fecha fin"
                  nombre={`tratamientos.${indice}.fechaFin`}
                  type="date"
                  valor={fila.fechaFin ?? ""}
                  error={errores[`tratamientos.${indice}.fechaFin`]}
                  onChange={(evento) =>
                    cambiarFila("tratamientos", indice, "fechaFin", evento.target.value)
                  }
                />
                <button
                  type="button"
                  className="ficha-edicion-quitar"
                  aria-label={`Quitar tratamiento ${indice + 1}`}
                  onClick={() => quitarFila("tratamientos", indice)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </div>
            ))}
          </div>

          <div className="ficha-edicion-grupo">
            <div className="ficha-edicion-grupo-cabecera">
              <h4>Próximo control programado</h4>
              <button
                type="button"
                className="ficha-edicion-agregar"
                onClick={() =>
                  agregarFila("atencionesSanitarias", {
                    tipo: "control",
                    fechaProgramada: "",
                    estado: "PENDIENTE",
                  })
                }
              >
                <span className="material-symbols-outlined" aria-hidden="true">add</span>
                Agregar control
              </button>
            </div>
            {!valores.atencionesSanitarias.length && (
              <p className="ficha-edicion-vacio">Sin controles nuevos.</p>
            )}
            {valores.atencionesSanitarias.map((fila, indice) => (
              <div className="ficha-edicion-fila ficha-edicion-fila--3" key={indice}>
                <Campo
                  etiqueta="Tipo"
                  nombre={`atencionesSanitarias.${indice}.tipo`}
                  control="select"
                  opciones={OPCIONES_TIPO_ATENCION}
                  valor={fila.tipo}
                  error={errores[`atencionesSanitarias.${indice}.tipo`]}
                  onChange={(evento) =>
                    cambiarFila("atencionesSanitarias", indice, "tipo", evento.target.value)
                  }
                />
                <Campo
                  etiqueta="Fecha programada"
                  nombre={`atencionesSanitarias.${indice}.fechaProgramada`}
                  type="date"
                  valor={fila.fechaProgramada}
                  error={errores[`atencionesSanitarias.${indice}.fechaProgramada`]}
                  onChange={(evento) =>
                    cambiarFila("atencionesSanitarias", indice, "fechaProgramada", evento.target.value)
                  }
                />
                <Campo
                  etiqueta="Estado"
                  nombre={`atencionesSanitarias.${indice}.estado`}
                  control="select"
                  opciones={OPCIONES_ESTADO_ATENCION}
                  valor={fila.estado ?? "PENDIENTE"}
                  error={errores[`atencionesSanitarias.${indice}.estado`]}
                  onChange={(evento) =>
                    cambiarFila("atencionesSanitarias", indice, "estado", evento.target.value)
                  }
                />
                <button
                  type="button"
                  className="ficha-edicion-quitar"
                  aria-label={`Quitar control ${indice + 1}`}
                  onClick={() => quitarFila("atencionesSanitarias", indice)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </div>
            ))}
          </div>

          <details className="ficha-edicion-extra">
            <summary>Seguimiento de enfermedades y tratamientos existentes</summary>

            <h4>Seguimiento de enfermedades existentes</h4>
            {!enfermedadesRegistradas.length && (
              <p className="ficha-edicion-vacio">No hay enfermedades registradas.</p>
            )}
            {valores.seguimientoEnfermedades.map((fila, indice) => (
              <div className="ficha-edicion-fila ficha-edicion-fila--3" key={indice}>
                <Campo
                  etiqueta="Enfermedad"
                  nombre={`seguimientoEnfermedades.${indice}.enfermedadId`}
                  control="select"
                  opciones={opcionesEnfermedades}
                  valor={fila.enfermedadId}
                  error={errores[`seguimientoEnfermedades.${indice}.enfermedadId`]}
                  onChange={(evento) =>
                    cambiarFila("seguimientoEnfermedades", indice, "enfermedadId", evento.target.value)
                  }
                />
                <Campo
                  etiqueta="Estado"
                  nombre={`seguimientoEnfermedades.${indice}.estadoEnfermedad`}
                  control="select"
                  opciones={OPCIONES_ESTADO_ENFERMEDAD}
                  valor={fila.estadoEnfermedad}
                  error={errores[`seguimientoEnfermedades.${indice}.estadoEnfermedad`]}
                  onChange={(evento) =>
                    cambiarFila("seguimientoEnfermedades", indice, "estadoEnfermedad", evento.target.value)
                  }
                />
                <button
                  type="button"
                  className="ficha-edicion-quitar"
                  aria-label={`Quitar seguimiento de enfermedad ${indice + 1}`}
                  onClick={() => quitarFila("seguimientoEnfermedades", indice)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ficha-edicion-agregar"
              disabled={!enfermedadesRegistradas.length}
              onClick={() =>
                agregarFila("seguimientoEnfermedades", {
                  enfermedadId: "",
                  estadoEnfermedad: "EN_CURSO",
                  observacionSeguimiento: "",
                })
              }
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              Agregar seguimiento de enfermedad
            </button>

            <h4>Seguimiento de tratamientos existentes</h4>
            {!tratamientosRegistrados.length && (
              <p className="ficha-edicion-vacio">No hay tratamientos registrados.</p>
            )}
            {valores.seguimientoTratamientos.map((fila, indice) => (
              <div className="ficha-edicion-fila ficha-edicion-fila--3" key={indice}>
                <Campo
                  etiqueta="Tratamiento"
                  nombre={`seguimientoTratamientos.${indice}.tratamientoId`}
                  control="select"
                  opciones={opcionesTratamientos}
                  valor={fila.tratamientoId}
                  error={errores[`seguimientoTratamientos.${indice}.tratamientoId`]}
                  onChange={(evento) =>
                    cambiarFila("seguimientoTratamientos", indice, "tratamientoId", evento.target.value)
                  }
                />
                <Campo
                  etiqueta="Estado"
                  nombre={`seguimientoTratamientos.${indice}.estadoTratamiento`}
                  control="select"
                  opciones={OPCIONES_ESTADO_TRATAMIENTO}
                  valor={fila.estadoTratamiento}
                  error={errores[`seguimientoTratamientos.${indice}.estadoTratamiento`]}
                  onChange={(evento) =>
                    cambiarFila("seguimientoTratamientos", indice, "estadoTratamiento", evento.target.value)
                  }
                />
                <button
                  type="button"
                  className="ficha-edicion-quitar"
                  aria-label={`Quitar seguimiento de tratamiento ${indice + 1}`}
                  onClick={() => quitarFila("seguimientoTratamientos", indice)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ficha-edicion-agregar"
              disabled={!tratamientosRegistrados.length}
              onClick={() =>
                agregarFila("seguimientoTratamientos", {
                  tratamientoId: "",
                  estadoTratamiento: "EN_CURSO",
                  observacionSeguimiento: "",
                })
              }
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              Agregar seguimiento de tratamiento
            </button>
          </details>
        </div>
      </section>

      <Mensaje mensaje={mensaje} />
    </form>
  );
}
