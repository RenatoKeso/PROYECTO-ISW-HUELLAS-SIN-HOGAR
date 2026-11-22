import { useState } from "react";
import Campo from "../ui/Campo.jsx";
import Mensaje from "../ui/Mensaje.jsx";
import { useFormulario } from "../../hooks/useFormulario.js";
import {
  crearRevisionInicialInicial,
  construirEntradaRevisionInicial,
} from "../../utils/registroMedicoForm.js";
import { revisionInicialFormSchema } from "../../validations/registroMedicoValidation.js";
import {
  OPCIONES_CLASIFICACION_INICIAL,
  OPCIONES_CUARENTENA_INICIAL,
} from "../../utils/registroMedicoOpciones.js";
import { PESO_INICIAL_KG_MAXIMO } from "../../validations/registroMedicoValidation.js";

const AVISO_CORRECCION =
  "Esta corrección se puede realizar una sola vez. Después de guardar, no podrás modificar nuevamente la revisión inicial.";

const CONFIRMACION_CORRECCION =
  "¿Guardar la corrección de la revisión inicial? Esta acción no se puede deshacer y no podrás modificarla nuevamente.";

export default function RevisionInicialForm({
  registro,
  onSubmit,
  modo = "registrar",
  bloqueado = false,
  onCancelar,
}) {
  const [mensajeBorrador, setMensajeBorrador] = useState("");
  const claveBorrador = `huellas.revision-inicial.${registro?.id ?? "nuevo"}`;

  function inicialesFormulario() {
    const base = crearRevisionInicialInicial(registro);
    if (modo !== "registrar") return base;

    try {
      const borrador = localStorage.getItem(claveBorrador);
      if (borrador) return { ...base, ...JSON.parse(borrador) };
    } catch {
      // Si el borrador no se puede leer, se usa el formulario limpio.
    }

    return base;
  }

  const form = useFormulario({
    iniciales: inicialesFormulario,
    esquema: revisionInicialFormSchema,
    enviar: async (datos) => {
      const respuesta = await onSubmit(construirEntradaRevisionInicial(datos));
      try {
        localStorage.removeItem(claveBorrador);
      } catch {
        // El borrador es opcional; no debe bloquear el registro.
      }
      return respuesta;
    },
    mensajeExito:
      modo === "corregir"
        ? "Revisión inicial actualizada correctamente"
        : "Revisión inicial registrada correctamente",
    confirmar:
      modo === "corregir" ? () => window.confirm(CONFIRMACION_CORRECCION) : undefined,
  });

  const titulo =
    modo === "corregir" ? "Corregir revisión inicial" : "Revisión inicial y evaluación clínica";
  const codigo = registro?.animal?.codigoAnimal ?? registro?.animalId ?? "—";

  function guardarBorrador() {
    try {
      localStorage.setItem(claveBorrador, JSON.stringify(form.valores));
      setMensajeBorrador("Borrador guardado en este navegador.");
    } catch {
      setMensajeBorrador("No se pudo guardar el borrador en este navegador.");
    }
  }

  return (
    <form className="revision-inicial-form" onSubmit={form.enviarFormulario} noValidate>
      <div className="revision-inicial-form-cabecera">
        <div className="revision-inicial-form-cabecera-texto">
          <span className="revision-inicial-form-barra" aria-hidden="true" />
          <div>
            <h2>{titulo}</h2>
            <p>
              Diligencia la valoración física integral, diagnóstico y plan preliminar.
            </p>
          </div>
        </div>
        <span className="revision-inicial-form-id">
          <span>ID:</span>
          {codigo}
        </span>
      </div>

      <div className="revision-inicial-form-cuerpo">
        {modo === "corregir" && (
          <p className="mensaje mensaje-aviso">{AVISO_CORRECCION}</p>
        )}

        <section className="revision-inicial-form-seccion">
          <div className="revision-inicial-form-seccion-titulo">
            <span aria-hidden="true">1</span>
            <h3>Constantes y triaje inicial</h3>
          </div>
          <div className="revision-inicial-form-grid">
            <Campo
              etiqueta="Peso (kg)"
              nombre="pesoKg"
              type="number"
              min={0}
              step="0.01"
              max={PESO_INICIAL_KG_MAXIMO}
              valor={form.valores.pesoKg}
              error={form.errores.pesoKg}
              sufijo="KG"
              ayuda="Ej: 4.85 medido en báscula veterinaria"
              requerido
              onChange={(evento) => form.cambiar("pesoKg", evento.target.value)}
            />

            <Campo
              etiqueta="Clasificación de salud"
              nombre="clasificacionSalud"
              control="select"
              opciones={OPCIONES_CLASIFICACION_INICIAL}
              valor={form.valores.clasificacionSalud}
              error={form.errores.clasificacionSalud}
              ayuda="Clasificación inicial de riesgo y triaje"
              requerido
              onChange={(evento) =>
                form.cambiar("clasificacionSalud", evento.target.value)
              }
            />

            <Campo
              etiqueta="Requiere cuarentena"
              nombre="requiereCuarentena"
              control="select"
              opciones={OPCIONES_CUARENTENA_INICIAL}
              valor={form.valores.requiereCuarentena}
              error={form.errores.requiereCuarentena}
              ayuda="Define la jaula o canil de destino sanitario"
              requerido
              onChange={(evento) =>
                form.cambiar("requiereCuarentena", evento.target.value)
              }
            />
          </div>
        </section>

        <section className="revision-inicial-form-seccion">
          <div className="revision-inicial-form-seccion-titulo">
            <span aria-hidden="true">2</span>
            <h3>Observación inicial y hallazgos</h3>
          </div>
          <div className="revision-inicial-form-observacion">
            <div className="revision-inicial-form-observacion-cabecera">
              <label htmlFor="observacionInicial">Observación inicial</label>
              <p>
                Registra los hallazgos físicos y conductuales observados durante el
                ingreso.
              </p>
            </div>
            <textarea
              id="observacionInicial"
              name="observacionInicial"
              rows={5}
              value={form.valores.observacionInicial}
              aria-invalid={Boolean(form.errores.observacionInicial)}
              onChange={(evento) =>
                form.cambiar("observacionInicial", evento.target.value)
              }
              placeholder="Describa el estado visual, pelaje, ojos, dentadura, heridas abiertas, parásitos evidentes o comportamiento (dócil, asustado, reactivo)..."
            />
            {form.errores.observacionInicial && (
              <span className="campo-error">{form.errores.observacionInicial}</span>
            )}
            <div className="revision-inicial-form-hint">
              <span>Incluya notas para el asistente de cuidado y medicación preventiva.</span>
              <span>Máx. 1000 caracteres</span>
            </div>
          </div>
        </section>

        <div className="revision-inicial-form-acciones">
          {modo === "registrar" ? (
            <button
              type="button"
              className="revision-inicial-form-boton revision-inicial-form-boton--secundario"
              onClick={guardarBorrador}
              disabled={bloqueado}
            >
              Guardar como borrador
            </button>
          ) : (
            onCancelar && (
              <button
                type="button"
                className="revision-inicial-form-boton revision-inicial-form-boton--secundario"
                onClick={onCancelar}
                disabled={bloqueado}
              >
                Cancelar corrección
              </button>
            )
          )}

          <button
            type="submit"
            className="revision-inicial-form-boton revision-inicial-form-boton--primario"
            disabled={bloqueado}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              check
            </span>
            {modo === "corregir"
              ? "Guardar corrección"
              : "Registrar revisión inicial"}
          </button>
        </div>

        {mensajeBorrador && (
          <p className="revision-inicial-form-borrador" role="status">
            {mensajeBorrador}
          </p>
        )}

        <Mensaje mensaje={form.mensaje} />
      </div>
    </form>
  );
}
