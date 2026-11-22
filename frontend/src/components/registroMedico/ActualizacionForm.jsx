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

export default function ActualizacionForm({
  registro,
  onIniciar,
  onGuardar,
  onCancelar,
  bloqueado = false,
  enCurso = false,
  idFormulario = "formulario-actualizacion",
  sinAcciones = false,
  onExito,
  onEnvioFinalizado,
  compacto = false,
}) {
  const [valores, setValores] = useState(() => crearActualizacionInicial(registro));
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enfermedadesRegistradas = registro?.enfermedades ?? [];
  const tratamientosRegistrados = registro?.tratamientos ?? [];
  const opcionesEnfermedades = opcionesEnfermedadesRegistradas(registro);
  const opcionesTratamientos = opcionesTratamientosRegistrados(registro);

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

  async function iniciar() {
    setMensaje(null);
    setEnviando(true);
    try {
      await onIniciar();
      setMensaje({ tipo: "exito", texto: "Actualización iniciada correctamente" });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setEnviando(false);
      onEnvioFinalizado?.();
    }
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
      onEnvioFinalizado?.();
    }
  }

  async function cancelar() {
    if (!window.confirm("¿Cancelar la actualización en curso?")) return;
    setMensaje(null);
    setEnviando(true);
    try {
      await onCancelar();
      setMensaje({ tipo: "exito", texto: "Actualización cancelada correctamente" });
      onExito?.({ message: "Actualización cancelada correctamente" });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setEnviando(false);
      onEnvioFinalizado?.();
    }
  }

  if (!enCurso) {
    return (
      <section className="bloque">
        <h2>Actualización veterinaria</h2>
        <p>
          El registro está en estado {registro?.estadoValidacion}. Puedes iniciar
          una actualización.
        </p>
        <button
          className="boton"
          type="button"
          onClick={iniciar}
          disabled={bloqueado || enviando}
        >
          {enviando ? "Iniciando..." : "Iniciar actualización"}
        </button>
        <Mensaje mensaje={mensaje} />
      </section>
    );
  }

  return (
    <form
      id={idFormulario}
      className={compacto ? "formulario formulario-compacto" : "formulario"}
      onSubmit={guardar}
      noValidate
    >
      <h2>Actualización veterinaria</h2>

      <section className="ficha-form-seccion">
        <h3>1. Evaluación y constantes médicas</h3>
        <div className="formulario-campos">
          <Campo etiqueta="Peso (kg)" nombre="pesoKg" type="number" min={0} step="0.01" valor={valores.pesoKg} error={errores.pesoKg} onChange={(e) => cambiar("pesoKg", e.target.value)} />
          <Campo etiqueta="Clasificación" nombre="clasificacionSalud" control="select" opciones={OPCIONES_CLASIFICACION_ACTUALIZACION} valor={valores.clasificacionSalud} error={errores.clasificacionSalud} onChange={(e) => cambiar("clasificacionSalud", e.target.value)} />
          <Campo etiqueta="Cuarentena" nombre="requiereCuarentena" control="select" opciones={OPCIONES_CUARENTENA_ACTUALIZACION} valor={valores.requiereCuarentena} error={errores.requiereCuarentena} onChange={(e) => cambiar("requiereCuarentena", e.target.value)} />
          <Campo etiqueta="Evolución" nombre="evolucionEstadoSalud" control="select" opciones={OPCIONES_EVOLUCION} valor={valores.evolucionEstadoSalud} error={errores.evolucionEstadoSalud} onChange={(e) => cambiar("evolucionEstadoSalud", e.target.value)} />
          <Campo etiqueta="Fecha de registro" nombre="fechaRegistro" type="date" valor={valores.fechaRegistro} error={errores.fechaRegistro} onChange={(e) => cambiar("fechaRegistro", e.target.value)} />
        </div>
      </section>

      <section className="ficha-form-seccion">
        <h3>2. Hallazgos clínicos y observaciones</h3>
        <div className="formulario-campos">
          <Campo etiqueta="Observación inicial" nombre="observacionInicial" control="textarea" rows={2} ancho valor={valores.observacionInicial} error={errores.observacionInicial} onChange={(e) => cambiar("observacionInicial", e.target.value)} />
          <Campo etiqueta="Condiciones" nombre="condiciones" control="textarea" rows={2} ancho valor={valores.condiciones} onChange={(e) => cambiar("condiciones", e.target.value)} />
          <Campo etiqueta="Discapacidades" nombre="discapacidades" control="textarea" rows={2} ancho valor={valores.discapacidades} onChange={(e) => cambiar("discapacidades", e.target.value)} />
          <Campo etiqueta="Lesiones" nombre="lesiones" control="textarea" rows={2} ancho valor={valores.lesiones} onChange={(e) => cambiar("lesiones", e.target.value)} />
          <Campo etiqueta="Cuidados especiales" nombre="descripcionCuidadosEspeciales" control="textarea" rows={2} ancho valor={valores.descripcionCuidadosEspeciales} onChange={(e) => cambiar("descripcionCuidadosEspeciales", e.target.value)} />
          <Campo etiqueta="Necesidades" nombre="necesidades" control="textarea" rows={2} ancho valor={valores.necesidades} onChange={(e) => cambiar("necesidades", e.target.value)} />
          <Campo etiqueta="Observación de seguimiento" nombre="observacionSeguimiento" control="textarea" rows={2} ancho valor={valores.observacionSeguimiento} error={errores.observacionSeguimiento} onChange={(e) => cambiar("observacionSeguimiento", e.target.value)} />
        </div>
      </section>

      <section className="ficha-form-seccion">
        <h3>3. Diagnósticos, tratamientos y seguimiento</h3>

        <h4>Nuevas enfermedades</h4>
        {valores.enfermedades.map((fila, indice) => (
          <div className="formulario-campos" key={indice}>
            <Campo etiqueta="Descripción" nombre={`enfermedades.${indice}.descripcionEnfermedad`} valor={fila.descripcionEnfermedad} error={errores[`enfermedades.${indice}.descripcionEnfermedad`]} onChange={(e) => cambiarFila("enfermedades", indice, "descripcionEnfermedad", e.target.value)} />
            <button type="button" className="boton boton-secundario" onClick={() => quitarFila("enfermedades", indice)}>Quitar</button>
          </div>
        ))}
        <button type="button" className="boton boton-secundario" onClick={() => agregarFila("enfermedades", { descripcionEnfermedad: "", tipoEnfermedad: "" })}>Agregar enfermedad</button>

        <h4>Nuevos tratamientos</h4>
        {valores.tratamientos.map((fila, indice) => (
          <div className="formulario-campos" key={indice}>
            <Campo etiqueta="Descripción" nombre={`tratamientos.${indice}.descripcionTratamiento`} valor={fila.descripcionTratamiento} error={errores[`tratamientos.${indice}.descripcionTratamiento`]} onChange={(e) => cambiarFila("tratamientos", indice, "descripcionTratamiento", e.target.value)} />
            <Campo etiqueta="Fecha inicio" nombre={`tratamientos.${indice}.fechaInicio`} type="date" valor={fila.fechaInicio} error={errores[`tratamientos.${indice}.fechaInicio`]} onChange={(e) => cambiarFila("tratamientos", indice, "fechaInicio", e.target.value)} />
            <button type="button" className="boton boton-secundario" onClick={() => quitarFila("tratamientos", indice)}>Quitar</button>
          </div>
        ))}
        <button type="button" className="boton boton-secundario" onClick={() => agregarFila("tratamientos", { descripcionTratamiento: "", fechaInicio: "" })}>Agregar tratamiento</button>

        <h4>Seguimiento de enfermedades existentes</h4>
        {!enfermedadesRegistradas.length && <p>No hay enfermedades registradas.</p>}
        {valores.seguimientoEnfermedades.map((fila, indice) => (
          <div className="formulario-campos" key={indice}>
            <Campo etiqueta="Enfermedad" nombre={`seguimientoEnfermedades.${indice}.enfermedadId`} control="select" opciones={opcionesEnfermedades} valor={fila.enfermedadId} error={errores[`seguimientoEnfermedades.${indice}.enfermedadId`]} onChange={(e) => cambiarFila("seguimientoEnfermedades", indice, "enfermedadId", e.target.value)} />
            <Campo etiqueta="Estado" nombre={`seguimientoEnfermedades.${indice}.estadoEnfermedad`} control="select" opciones={OPCIONES_ESTADO_ENFERMEDAD} valor={fila.estadoEnfermedad} error={errores[`seguimientoEnfermedades.${indice}.estadoEnfermedad`]} onChange={(e) => cambiarFila("seguimientoEnfermedades", indice, "estadoEnfermedad", e.target.value)} />
            <button type="button" className="boton boton-secundario" onClick={() => quitarFila("seguimientoEnfermedades", indice)}>Quitar</button>
          </div>
        ))}
        <button type="button" className="boton boton-secundario" disabled={!enfermedadesRegistradas.length} onClick={() => agregarFila("seguimientoEnfermedades", { enfermedadId: "", estadoEnfermedad: "EN_CURSO", observacionSeguimiento: "" })}>Agregar seguimiento</button>

        <h4>Seguimiento de tratamientos existentes</h4>
        {!tratamientosRegistrados.length && <p>No hay tratamientos registrados.</p>}
        {valores.seguimientoTratamientos.map((fila, indice) => (
          <div className="formulario-campos" key={indice}>
            <Campo etiqueta="Tratamiento" nombre={`seguimientoTratamientos.${indice}.tratamientoId`} control="select" opciones={opcionesTratamientos} valor={fila.tratamientoId} error={errores[`seguimientoTratamientos.${indice}.tratamientoId`]} onChange={(e) => cambiarFila("seguimientoTratamientos", indice, "tratamientoId", e.target.value)} />
            <Campo etiqueta="Estado" nombre={`seguimientoTratamientos.${indice}.estadoTratamiento`} control="select" opciones={OPCIONES_ESTADO_TRATAMIENTO} valor={fila.estadoTratamiento} error={errores[`seguimientoTratamientos.${indice}.estadoTratamiento`]} onChange={(e) => cambiarFila("seguimientoTratamientos", indice, "estadoTratamiento", e.target.value)} />
            <button type="button" className="boton boton-secundario" onClick={() => quitarFila("seguimientoTratamientos", indice)}>Quitar</button>
          </div>
        ))}
        <button type="button" className="boton boton-secundario" disabled={!tratamientosRegistrados.length} onClick={() => agregarFila("seguimientoTratamientos", { tratamientoId: "", estadoTratamiento: "EN_CURSO", observacionSeguimiento: "" })}>Agregar seguimiento</button>

        <h4>Atenciones sanitarias</h4>
        {valores.atencionesSanitarias.map((fila, indice) => (
          <div className="formulario-campos" key={indice}>
            <Campo etiqueta="Tipo" nombre={`atencionesSanitarias.${indice}.tipo`} control="select" opciones={OPCIONES_TIPO_ATENCION} valor={fila.tipo} error={errores[`atencionesSanitarias.${indice}.tipo`]} onChange={(e) => cambiarFila("atencionesSanitarias", indice, "tipo", e.target.value)} />
            <Campo etiqueta="Fecha programada" nombre={`atencionesSanitarias.${indice}.fechaProgramada`} type="date" valor={fila.fechaProgramada} error={errores[`atencionesSanitarias.${indice}.fechaProgramada`]} onChange={(e) => cambiarFila("atencionesSanitarias", indice, "fechaProgramada", e.target.value)} />
            <Campo etiqueta="Estado" nombre={`atencionesSanitarias.${indice}.estado`} control="select" opciones={OPCIONES_ESTADO_ATENCION} valor={fila.estado ?? "PENDIENTE"} error={errores[`atencionesSanitarias.${indice}.estado`]} onChange={(e) => cambiarFila("atencionesSanitarias", indice, "estado", e.target.value)} />
            <button type="button" className="boton boton-secundario" onClick={() => quitarFila("atencionesSanitarias", indice)}>Quitar</button>
          </div>
        ))}
        <button type="button" className="boton boton-secundario" onClick={() => agregarFila("atencionesSanitarias", { tipo: "vacuna", fechaProgramada: "", estado: "PENDIENTE" })}>Agregar atención</button>
      </section>

      {!sinAcciones && (
        <div className="alertas-acciones">
          <button className="boton" type="submit" disabled={bloqueado || enviando}>
            {enviando ? "Guardando..." : "Guardar actualización"}
          </button>
          <button className="boton boton-secundario" type="button" onClick={cancelar} disabled={bloqueado || enviando}>
            Cancelar actualización
          </button>
        </div>
      )}

      <Mensaje mensaje={mensaje} />
    </form>
  );
}
