import { useState } from "react";
import Campo from "../ui/Campo.jsx";
import Mensaje from "../ui/Mensaje.jsx";
import {
  crearRevisionFinalInicial,
  construirEntradaRevisionFinal,
} from "../../utils/registroMedicoForm.js";
import { revisionFinalFormSchema } from "../../validations/registroMedicoValidation.js";
import { erroresDeZod } from "../../utils/erroresFormulario.js";
import { OPCIONES_TIPO_ATENCION } from "../../utils/registroMedicoOpciones.js";

const OPCIONES_ESTADO_SALUD_CLINICO = [
  { valor: "NORMAL", texto: "Normal / Buen estado" },
  { valor: "ENFERMO", texto: "Enfermo / En recuperación" },
  { valor: "CRITICO", texto: "Crítico / Observación urgente" },
];

const OPCIONES_ADOPTABILIDAD_CLINICA = [
  { valor: "", texto: "Seleccione estado de adopción..." },
  { valor: "ADOPTABLE", texto: "Apto para adopción inmediata" },
  {
    valor: "NO_ADOPTABLE",
    texto: "No apto temporalmente (en tratamiento)",
  },
];

const OPCIONES_ESTADO_ATENCION_CLINICA = [
  { valor: "PENDIENTE", texto: "Pendiente" },
  { valor: "REALIZADA", texto: "Realizada" },
  { valor: "CANCELADA", texto: "Cancelada" },
];

function AreaClinica({ etiqueta, nombre, ayuda, placeholder, valor, error, onChange }) {
  return (
    <div className="revision-completa-hallazgo">
      <label htmlFor={nombre}>{etiqueta}</label>
      <p>{ayuda}</p>
      <textarea
        id={nombre}
        name={nombre}
        rows={3}
        value={valor}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(evento) => onChange(evento.target.value)}
      />
      {error && <span className="campo-error">{error}</span>}
    </div>
  );
}

function ModuloClinico({ titulo, descripcion, cuenta, etiquetaCuenta, vacio, textoAgregar, onAgregar, children }) {
  return (
    <div className="revision-completa-modulo">
      <div className="revision-completa-modulo-cabecera">
        <h4>{titulo}</h4>
        <span>{cuenta} {etiquetaCuenta}</span>
      </div>
      <p className="revision-completa-modulo-descripcion">{descripcion}</p>
      <div className="revision-completa-modulo-contenido">
        {cuenta ? children : <p className="revision-completa-modulo-vacio">{vacio}</p>}
      </div>
      <button
        type="button"
        className="revision-completa-modulo-agregar"
        onClick={onAgregar}
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          add
        </span>
        {textoAgregar}
      </button>
    </div>
  );
}

export default function RevisionFinalForm({
  registro,
  onSubmit,
  onExito,
  bloqueado = false,
}) {
  const claveBorrador = `huellas.revision-completa.${registro?.id ?? "nuevo"}`;

  function valoresIniciales() {
    const base = crearRevisionFinalInicial(registro);
    try {
      const borrador = localStorage.getItem(claveBorrador);
      if (borrador) return { ...base, ...JSON.parse(borrador) };
    } catch {
      // El borrador es opcional; no debe bloquear el formulario.
    }
    return base;
  }

  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [mensajeBorrador, setMensajeBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);

  const codigo = registro?.animal?.codigoAnimal ?? registro?.animalId ?? "—";
  const pesoInicial = Number(registro?.pesoKg);
  const pesoRevalidado = Number(valores.pesoRevalidadoKg);
  const variacionPeso =
    Number.isFinite(pesoInicial) && Number.isFinite(pesoRevalidado)
      ? pesoRevalidado - pesoInicial
      : null;
  const ayudaPeso =
    variacionPeso === null
      ? "Registra el peso actual medido en báscula veterinaria"
      : `Var: ${variacionPeso >= 0 ? "+" : ""}${variacionPeso.toFixed(1)} kg respecto al ingreso`;

  function cambiar(campo, valor) {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const resto = { ...prev };
      delete resto[campo];
      return resto;
    });
  }

  function cambiarFila(coleccion, indice, campo, valor) {
    setValores((prev) => {
      const copia = [...prev[coleccion]];
      copia[indice] = { ...copia[indice], [campo]: valor };
      return { ...prev, [coleccion]: copia };
    });
    setErrores((prev) => {
      const clave = `${coleccion}.${indice}.${campo}`;
      if (!prev[clave]) return prev;
      const resto = { ...prev };
      delete resto[clave];
      return resto;
    });
  }

  function agregarFila(coleccion, fila) {
    setValores((prev) => ({
      ...prev,
      [coleccion]: [...prev[coleccion], fila],
    }));
  }

  function quitarFila(coleccion, indice) {
    setValores((prev) => ({
      ...prev,
      [coleccion]: prev[coleccion].filter((_, i) => i !== indice),
    }));
    setErrores({});
  }

  function guardarBorrador() {
    try {
      localStorage.setItem(claveBorrador, JSON.stringify(valores));
      setMensajeBorrador("Borrador guardado en este navegador.");
    } catch {
      setMensajeBorrador("No se pudo guardar el borrador en este navegador.");
    }
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensaje(null);
    setMensajeBorrador("");

    const resultado = revisionFinalFormSchema.safeParse(valores);
    if (!resultado.success) {
      setErrores(erroresDeZod(resultado.error));
      return;
    }

    setErrores({});
    setEnviando(true);

    try {
      const datos = construirEntradaRevisionFinal(valores);
      const respuesta = await onSubmit(datos);
      try {
        localStorage.removeItem(claveBorrador);
      } catch {
        // El borrador es opcional; no debe bloquear el registro.
      }
      setMensaje({
        tipo: "exito",
        texto: respuesta.message ?? "Revisión completa registrada correctamente",
      });
      setValores(crearRevisionFinalInicial(registro));
      onExito?.(respuesta);
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      className="revision-inicial-form revision-completa-form"
      onSubmit={enviar}
      noValidate
    >
      <div className="revision-inicial-form-cabecera">
        <div className="revision-inicial-form-cabecera-texto">
          <span className="revision-inicial-form-barra" aria-hidden="true" />
          <div>
            <h2>Revisión Completa y Evaluación Clínica</h2>
            <p>
              Diligencia la valoración física integral, diagnóstico y plan
              terapéutico.
            </p>
          </div>
        </div>
        <span className="revision-inicial-form-id">
          <span>ID:</span>
          {codigo}
        </span>
      </div>

      <div className="revision-inicial-form-cuerpo">
        <section className="revision-inicial-form-seccion">
          <div className="revision-inicial-form-seccion-titulo">
            <span aria-hidden="true">1</span>
            <h3>Constantes y evaluación general</h3>
          </div>
          <div className="revision-inicial-form-grid">
            <Campo
              etiqueta="Peso revalidado (kg)"
              nombre="pesoRevalidadoKg"
              type="number"
              min={0}
              step="0.01"
              valor={valores.pesoRevalidadoKg}
              error={errores.pesoRevalidadoKg}
              sufijo="kg"
              ayuda={ayudaPeso}
              requerido
              onChange={(evento) =>
                cambiar("pesoRevalidadoKg", evento.target.value)
              }
            />

            <Campo
              etiqueta="Estado de salud general"
              nombre="estadoSalud"
              control="select"
              opciones={OPCIONES_ESTADO_SALUD_CLINICO}
              valor={valores.estadoSalud}
              error={errores.estadoSalud}
              ayuda="Condición clínica actual"
              requerido
              onChange={(evento) => cambiar("estadoSalud", evento.target.value)}
            />

            <Campo
              etiqueta="Adoptabilidad"
              nombre="adoptabilidad"
              control="select"
              opciones={OPCIONES_ADOPTABILIDAD_CLINICA}
              valor={valores.adoptabilidad}
              error={errores.adoptabilidad}
              ayuda="Criterio veterinario para difusión"
              requerido
              onChange={(evento) => cambiar("adoptabilidad", evento.target.value)}
            />
          </div>
        </section>

        <hr className="revision-completa-separador" />

        <section className="revision-inicial-form-seccion">
          <div className="revision-inicial-form-seccion-titulo">
            <span aria-hidden="true">2</span>
            <h3>Examen físico y hallazgos detallados</h3>
          </div>
          <div className="revision-completa-hallazgos">
            <AreaClinica
              etiqueta="Condiciones generales y nutricionales"
              nombre="condiciones"
              ayuda="Pelaje, mucosas, dentadura y condición corporal."
              placeholder="Escribe hallazgos clínicos..."
              valor={valores.condiciones}
              error={errores.condiciones}
              onChange={(valor) => cambiar("condiciones", valor)}
            />
            <AreaClinica
              etiqueta="Discapacidades o limitaciones físicas"
              nombre="discapacidades"
              ayuda="Pérdida de extremidades, ceguera, sordera motora o sensorial."
              placeholder="Escribe detalles si presenta..."
              valor={valores.discapacidades}
              error={errores.discapacidades}
              onChange={(valor) => cambiar("discapacidades", valor)}
            />
            <AreaClinica
              etiqueta="Lesiones, heridas o cirugías previas"
              nombre="lesiones"
              ayuda="Cicatrices, laceraciones, dermatitis o suturas activas."
              placeholder="Detalle tipo y ubicación..."
              valor={valores.lesiones}
              error={errores.lesiones}
              onChange={(valor) => cambiar("lesiones", valor)}
            />
            <AreaClinica
              etiqueta="Cuidados especiales requeridos"
              nombre="descripcionCuidadosEspeciales"
              ayuda="Alimentación medicada, aislamiento, curaciones o reposo."
              placeholder="Instrucciones para cuidadores..."
              valor={valores.descripcionCuidadosEspeciales}
              error={errores.descripcionCuidadosEspeciales}
              onChange={(valor) =>
                cambiar("descripcionCuidadosEspeciales", valor)
              }
            />
          </div>
        </section>

        <hr className="revision-completa-separador" />

        <section className="revision-inicial-form-seccion">
          <div className="revision-inicial-form-seccion-titulo">
            <span aria-hidden="true">3</span>
            <h3>Diagnóstico, tratamientos y plan sanitario</h3>
          </div>
          <div className="revision-completa-modulos">
            <ModuloClinico
              titulo="Enfermedades"
              descripcion="Patologías identificadas durante el examen clínico."
              cuenta={valores.enfermedades.length}
              etiquetaCuenta={valores.enfermedades.length === 1 ? "activa" : "activas"}
              vacio="Sin patologías registradas"
              textoAgregar="Agregar enfermedad"
              onAgregar={() =>
                agregarFila("enfermedades", {
                  descripcionEnfermedad: "",
                  tipoEnfermedad: "",
                })
              }
            >
              {valores.enfermedades.map((fila, indice) => (
                <div className="revision-completa-fila" key={indice}>
                  <Campo
                    etiqueta="Descripción"
                    nombre={`enfermedades.${indice}.descripcionEnfermedad`}
                    valor={fila.descripcionEnfermedad}
                    error={errores[`enfermedades.${indice}.descripcionEnfermedad`]}
                    requerido
                    onChange={(evento) =>
                      cambiarFila(
                        "enfermedades",
                        indice,
                        "descripcionEnfermedad",
                        evento.target.value,
                      )
                    }
                  />
                  <Campo
                    etiqueta="Tipo"
                    nombre={`enfermedades.${indice}.tipoEnfermedad`}
                    valor={fila.tipoEnfermedad ?? ""}
                    onChange={(evento) =>
                      cambiarFila(
                        "enfermedades",
                        indice,
                        "tipoEnfermedad",
                        evento.target.value,
                      )
                    }
                  />
                  <button
                    type="button"
                    className="revision-completa-fila-quitar"
                    aria-label={`Quitar enfermedad ${indice + 1}`}
                    onClick={() => quitarFila("enfermedades", indice)}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      close
                    </span>
                  </button>
                </div>
              ))}
            </ModuloClinico>

            <ModuloClinico
              titulo="Tratamientos"
              descripcion="Fármacos, posología, vía y duración del tratamiento."
              cuenta={valores.tratamientos.length}
              etiquetaCuenta={valores.tratamientos.length === 1 ? "indicado" : "indicados"}
              vacio="Sin medicación prescrita"
              textoAgregar="Agregar tratamiento"
              onAgregar={() =>
                agregarFila("tratamientos", {
                  descripcionTratamiento: "",
                  fechaInicio: "",
                  fechaFin: "",
                  observaciones: "",
                })
              }
            >
              {valores.tratamientos.map((fila, indice) => (
                <div className="revision-completa-fila" key={indice}>
                  <Campo
                    etiqueta="Descripción"
                    nombre={`tratamientos.${indice}.descripcionTratamiento`}
                    valor={fila.descripcionTratamiento}
                    error={errores[`tratamientos.${indice}.descripcionTratamiento`]}
                    requerido
                    onChange={(evento) =>
                      cambiarFila(
                        "tratamientos",
                        indice,
                        "descripcionTratamiento",
                        evento.target.value,
                      )
                    }
                  />
                  <Campo
                    etiqueta="Fecha inicio"
                    nombre={`tratamientos.${indice}.fechaInicio`}
                    type="date"
                    valor={fila.fechaInicio}
                    error={errores[`tratamientos.${indice}.fechaInicio`]}
                    requerido
                    onChange={(evento) =>
                      cambiarFila(
                        "tratamientos",
                        indice,
                        "fechaInicio",
                        evento.target.value,
                      )
                    }
                  />
                  <Campo
                    etiqueta="Fecha fin"
                    nombre={`tratamientos.${indice}.fechaFin`}
                    type="date"
                    valor={fila.fechaFin ?? ""}
                    error={errores[`tratamientos.${indice}.fechaFin`]}
                    onChange={(evento) =>
                      cambiarFila(
                        "tratamientos",
                        indice,
                        "fechaFin",
                        evento.target.value,
                      )
                    }
                  />
                  <Campo
                    etiqueta="Posología y observaciones"
                    nombre={`tratamientos.${indice}.observaciones`}
                    control="textarea"
                    rows={2}
                    ancho
                    valor={fila.observaciones ?? ""}
                    placeholder="Dosis, vía y duración..."
                    error={errores[`tratamientos.${indice}.observaciones`]}
                    onChange={(evento) =>
                      cambiarFila(
                        "tratamientos",
                        indice,
                        "observaciones",
                        evento.target.value,
                      )
                    }
                  />
                  <button
                    type="button"
                    className="revision-completa-fila-quitar"
                    aria-label={`Quitar tratamiento ${indice + 1}`}
                    onClick={() => quitarFila("tratamientos", indice)}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      close
                    </span>
                  </button>
                </div>
              ))}
            </ModuloClinico>

            <ModuloClinico
              titulo="Atenciones Sanitarias"
              descripcion="Desparasitación interna/externa, microchip o vacunas."
              cuenta={valores.atencionesSanitarias.length}
              etiquetaCuenta={valores.atencionesSanitarias.length === 1 ? "evento" : "eventos"}
              vacio="Sin procedimientos anexados"
              textoAgregar="Agregar atención"
              onAgregar={() =>
                agregarFila("atencionesSanitarias", {
                  tipo: "vacuna",
                  fechaProgramada: "",
                  estado: "PENDIENTE",
                })
              }
            >
              {valores.atencionesSanitarias.map((fila, indice) => (
                <div className="revision-completa-fila" key={indice}>
                  <Campo
                    etiqueta="Tipo"
                    nombre={`atencionesSanitarias.${indice}.tipo`}
                    control="select"
                    opciones={OPCIONES_TIPO_ATENCION}
                    valor={fila.tipo}
                    error={errores[`atencionesSanitarias.${indice}.tipo`]}
                    requerido
                    onChange={(evento) =>
                      cambiarFila(
                        "atencionesSanitarias",
                        indice,
                        "tipo",
                        evento.target.value,
                      )
                    }
                  />
                  <Campo
                    etiqueta="Fecha programada"
                    nombre={`atencionesSanitarias.${indice}.fechaProgramada`}
                    type="date"
                    valor={fila.fechaProgramada}
                    error={errores[`atencionesSanitarias.${indice}.fechaProgramada`]}
                    requerido
                    onChange={(evento) =>
                      cambiarFila(
                        "atencionesSanitarias",
                        indice,
                        "fechaProgramada",
                        evento.target.value,
                      )
                    }
                  />
                  <Campo
                    etiqueta="Estado"
                    nombre={`atencionesSanitarias.${indice}.estado`}
                    control="select"
                    opciones={OPCIONES_ESTADO_ATENCION_CLINICA}
                    valor={fila.estado ?? "PENDIENTE"}
                    onChange={(evento) =>
                      cambiarFila(
                        "atencionesSanitarias",
                        indice,
                        "estado",
                        evento.target.value,
                      )
                    }
                  />
                  <button
                    type="button"
                    className="revision-completa-fila-quitar"
                    aria-label={`Quitar atención ${indice + 1}`}
                    onClick={() => quitarFila("atencionesSanitarias", indice)}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      close
                    </span>
                  </button>
                </div>
              ))}
            </ModuloClinico>
          </div>
        </section>

        <div className="revision-inicial-form-acciones">
          <button
            type="button"
            className="revision-inicial-form-boton revision-inicial-form-boton--secundario"
            onClick={guardarBorrador}
            disabled={bloqueado || enviando}
          >
            Guardar como borrador
          </button>
          <button
            type="submit"
            className="revision-inicial-form-boton revision-inicial-form-boton--primario"
            disabled={bloqueado || enviando}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              check
            </span>
            {enviando ? "Guardando..." : "Registrar revisión completa"}
          </button>
        </div>

        {mensajeBorrador && (
          <p className="revision-inicial-form-borrador" role="status">
            {mensajeBorrador}
          </p>
        )}

        <Mensaje mensaje={mensaje} />
      </div>
    </form>
  );
}
