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
  const form = useFormulario({
    iniciales: crearRevisionInicialInicial(registro),
    esquema: revisionInicialFormSchema,
    enviar: (datos) => onSubmit(construirEntradaRevisionInicial(datos)),
    mensajeExito:
      modo === "corregir"
        ? "Revisión inicial actualizada correctamente"
        : "Revisión inicial registrada correctamente",
    confirmar:
      modo === "corregir" ? () => window.confirm(CONFIRMACION_CORRECCION) : undefined,
  });

  const titulo = modo === "corregir" ? "Corregir revisión inicial" : "Revisión inicial";

  return (
    <form className="formulario" onSubmit={form.enviarFormulario} noValidate>
      <h2>{titulo}</h2>

      {modo === "corregir" && (
        <p className="mensaje mensaje-aviso">{AVISO_CORRECCION}</p>
      )}

      <div className="formulario-campos">
        <Campo
          etiqueta="Peso (kg)"
          nombre="pesoKg"
          type="number"
          min={0}
          step="0.01"
          max={PESO_INICIAL_KG_MAXIMO}
          valor={form.valores.pesoKg}
          error={form.errores.pesoKg}
          onChange={(evento) => form.cambiar("pesoKg", evento.target.value)}
        />

        <Campo
          etiqueta="Clasificación de salud"
          nombre="clasificacionSalud"
          control="select"
          opciones={OPCIONES_CLASIFICACION_INICIAL}
          valor={form.valores.clasificacionSalud}
          error={form.errores.clasificacionSalud}
          onChange={(evento) =>
            form.cambiar("clasificacionSalud", evento.target.value)
          }
        />

        <Campo
          etiqueta="Observación inicial"
          nombre="observacionInicial"
          control="textarea"
          rows={3}
          valor={form.valores.observacionInicial}
          error={form.errores.observacionInicial}
          onChange={(evento) =>
            form.cambiar("observacionInicial", evento.target.value)
          }
        />

        <Campo
          etiqueta="Requiere cuarentena"
          nombre="requiereCuarentena"
          control="select"
          opciones={OPCIONES_CUARENTENA_INICIAL}
          valor={form.valores.requiereCuarentena}
          error={form.errores.requiereCuarentena}
          onChange={(evento) =>
            form.cambiar("requiereCuarentena", evento.target.value)
          }
        />
      </div>

      <div className="acciones-formulario">
        <button className="boton" type="submit" disabled={bloqueado}>
          {modo === "corregir" ? "Guardar corrección" : "Registrar revisión inicial"}
        </button>

        {modo === "corregir" && onCancelar && (
          <button
            type="button"
            className="boton boton-secundario"
            onClick={onCancelar}
          >
            Cancelar corrección
          </button>
        )}
      </div>

      <Mensaje mensaje={form.mensaje} />
    </form>
  );
}
