import { useState } from "react";
import { ApiError } from "../services/api.js";

function erroresDeCampo(error) {
  if (!Array.isArray(error.detalles)) return {};

  const mapa = {};

  for (const detalle of error.detalles) {
    if (detalle.campo) mapa[detalle.campo] = detalle.mensaje;
  }

  return mapa;
}

function mensajeDeError(error) {
  if (error instanceof ApiError) return error.message;
  return "No se pudo contactar con el servidor, intenta de nuevo";
}

export function useFormulario({ iniciales = {}, esquema, enviar, mensajeExito }) {
  const [valores, setValores] = useState(iniciales);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);

  function cambiar(nombre, valor) {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
    setErrores((prev) => {
      if (!prev[nombre]) return prev;
      const resto = { ...prev };
      delete resto[nombre];
      return resto;
    });
  }

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setMensaje(null);

    const resultado = esquema.safeParse(valores);

    if (!resultado.success) {
      const nuevosErrores = {};
      for (const issue of resultado.error.issues) {
        nuevosErrores[issue.path.join(".")] = issue.message;
      }
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});

    try {
      const respuesta = await enviar(resultado.data);

      setMensaje({
        tipo: "exito",
        texto:
          typeof mensajeExito === "function"
            ? mensajeExito(respuesta)
            : (mensajeExito ?? respuesta.message),
      });
      setValores(iniciales);
    } catch (error) {
      setErrores(erroresDeCampo(error));
      setMensaje({ tipo: "error", texto: mensajeDeError(error) });
    }
  }

  return { valores, errores, mensaje, cambiar, enviarFormulario };
}
