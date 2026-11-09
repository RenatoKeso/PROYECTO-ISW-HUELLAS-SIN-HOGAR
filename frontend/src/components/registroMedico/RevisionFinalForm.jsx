import { useState } from "react";
import Campo from "../ui/Campo.jsx";
import Mensaje from "../ui/Mensaje.jsx";
import {
  crearRevisionFinalInicial,
  construirEntradaRevisionFinal,
} from "../../utils/registroMedicoForm.js";
import { revisionFinalFormSchema } from "../../validations/registroMedicoValidation.js";
import { erroresDeZod } from "../../utils/erroresFormulario.js";
import {
  OPCIONES_ADOPTABILIDAD,
  OPCIONES_ESTADO_ATENCION,
  OPCIONES_ESTADO_SALUD,
  OPCIONES_TIPO_ATENCION,
} from "../../utils/registroMedicoOpciones.js";

export default function RevisionFinalForm({ registro, onSubmit, bloqueado = false }) {
  const [valores, setValores] = useState(() => crearRevisionFinalInicial(registro));
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);


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
  }

  async function enviar(evento) {
    evento.preventDefault();
    setMensaje(null);

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
      setMensaje({ tipo: "exito", texto: respuesta.message ?? "Revisión final registrada correctamente" });
      setValores(crearRevisionFinalInicial(registro));
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Revisión completa</h2>

      <div className="formulario-campos">
        <Campo
          etiqueta="Peso revalidado (kg)"
          nombre="pesoRevalidadoKg"
          type="number"
          min={0}
          step="0.01"
          valor={valores.pesoRevalidadoKg}
          error={errores.pesoRevalidadoKg}
          onChange={(evento) => cambiar("pesoRevalidadoKg", evento.target.value)}
        />

        <Campo
          etiqueta="Estado de salud"
          nombre="estadoSalud"
          control="select"
          opciones={OPCIONES_ESTADO_SALUD}
          valor={valores.estadoSalud}
          error={errores.estadoSalud}
          onChange={(evento) => cambiar("estadoSalud", evento.target.value)}
        />

        <Campo
          etiqueta="Adoptabilidad"
          nombre="adoptabilidad"
          control="select"
          opciones={OPCIONES_ADOPTABILIDAD}
          valor={valores.adoptabilidad}
          error={errores.adoptabilidad}
          onChange={(evento) => cambiar("adoptabilidad", evento.target.value)}
        />

        <Campo
          etiqueta="Condiciones"
          nombre="condiciones"
          control="textarea"
          rows={2}
          valor={valores.condiciones}
          error={errores.condiciones}
          onChange={(evento) => cambiar("condiciones", evento.target.value)}
        />

        <Campo
          etiqueta="Discapacidades"
          nombre="discapacidades"
          control="textarea"
          rows={2}
          valor={valores.discapacidades}
          error={errores.discapacidades}
          onChange={(evento) => cambiar("discapacidades", evento.target.value)}
        />

        <Campo
          etiqueta="Lesiones"
          nombre="lesiones"
          control="textarea"
          rows={2}
          valor={valores.lesiones}
          error={errores.lesiones}
          onChange={(evento) => cambiar("lesiones", evento.target.value)}
        />

        <Campo
          etiqueta="Cuidados especiales"
          nombre="descripcionCuidadosEspeciales"
          control="textarea"
          rows={2}
          ancho
          valor={valores.descripcionCuidadosEspeciales}
          error={errores.descripcionCuidadosEspeciales}
          onChange={(evento) =>
            cambiar("descripcionCuidadosEspeciales", evento.target.value)
          }
        />
      </div>

      <section className="bloque">
        <h3>Enfermedades</h3>
        {valores.enfermedades.map((fila, indice) => (
          <div className="formulario-campos" key={indice}>
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
              valor={fila.tipoEnfermedad ?? ""}
              onChange={(evento) =>
                cambiarFila("enfermedades", indice, "tipoEnfermedad", evento.target.value)
              }
            />
            <button
              type="button"
              className="boton boton-secundario"
              onClick={() => quitarFila("enfermedades", indice)}
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          className="boton boton-secundario"
          onClick={() => agregarFila("enfermedades", { descripcionEnfermedad: "", tipoEnfermedad: "" })}
        >
          Agregar enfermedad
        </button>
      </section>

      <section className="bloque">
        <h3>Tratamientos</h3>
        {valores.tratamientos.map((fila, indice) => (
          <div className="formulario-campos" key={indice}>
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
              className="boton boton-secundario"
              onClick={() => quitarFila("tratamientos", indice)}
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          className="boton boton-secundario"
          onClick={() =>
            agregarFila("tratamientos", {
              descripcionTratamiento: "",
              fechaInicio: "",
              fechaFin: "",
              observaciones: "",
            })
          }
        >
          Agregar tratamiento
        </button>
      </section>

      <section className="bloque">
        <h3>Atenciones sanitarias</h3>
        {valores.atencionesSanitarias.map((fila, indice) => (
          <div className="formulario-campos" key={indice}>
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
              onChange={(evento) =>
                cambiarFila("atencionesSanitarias", indice, "estado", evento.target.value)
              }
            />
            <button
              type="button"
              className="boton boton-secundario"
              onClick={() => quitarFila("atencionesSanitarias", indice)}
            >
              Quitar
            </button>
          </div>
        ))}
        <button
          type="button"
          className="boton boton-secundario"
          onClick={() =>
            agregarFila("atencionesSanitarias", {
              tipo: "vacuna",
              fechaProgramada: "",
              estado: "PENDIENTE",
            })
          }
        >
          Agregar atención
        </button>
      </section>

      <button className="boton" type="submit" disabled={bloqueado || enviando}>
        {enviando ? "Guardando..." : "Registrar revisión completa"}
      </button>

      <Mensaje mensaje={mensaje} />
    </form>
  );
}
