import { z } from "zod";

// Mensajes por defecto de Zod para los formularios. Cualquier mensaje definido
// explicitamente en un esquema (por ejemplo `z.enum(..., { message })`) tiene
// prioridad sobre estos; aqui solo se traducen los errores tecnicos.
export function mensajeErrorZod(issue) {
  switch (issue.code) {
    case "invalid_type": {
      const vacio =
        issue.input === undefined ||
        issue.input === null ||
        issue.input === "";

      if (vacio) return "Este campo es obligatorio";
      if (issue.expected === "number" || issue.expected === "int") {
        return "Ingresa un número válido";
      }
      if (issue.expected === "boolean") return "Selecciona una opción";
      return "Ingresa un valor válido";
    }

    case "invalid_value":
      return "Selecciona una opción válida";

    case "too_small": {
      if (issue.origin === "string") {
        return Number(issue.minimum) <= 1
          ? "Este campo es obligatorio"
          : `Escribe al menos ${issue.minimum} caracteres`;
      }
      if (issue.origin === "array" || issue.origin === "set") {
        return Number(issue.minimum) <= 1
          ? "Selecciona al menos una opción"
          : `Selecciona al menos ${issue.minimum} opciones`;
      }
      if (issue.origin === "date") return "La fecha no es válida";
      return issue.inclusive
        ? `El valor debe ser mayor o igual a ${issue.minimum}`
        : `El valor debe ser mayor que ${issue.minimum}`;
    }

    case "too_big": {
      if (issue.origin === "string") {
        return issue.exact
          ? `El texto debe tener ${issue.maximum} caracteres`
          : `El texto no puede superar los ${issue.maximum} caracteres`;
      }
      if (issue.origin === "array" || issue.origin === "set") {
        return `Selecciona como máximo ${issue.maximum} opciones`;
      }
      if (issue.origin === "date") return "La fecha no es válida";
      return issue.inclusive
        ? `El valor debe ser menor o igual a ${issue.maximum}`
        : `El valor debe ser menor que ${issue.maximum}`;
    }

    case "invalid_format": {
      if (issue.format === "email") return "Ingresa un correo válido";
      if (issue.format === "url") return "Ingresa una URL válida";
      return "El formato no es válido";
    }

    case "not_multiple_of":
      return "El valor no es válido";

    case "unrecognized_keys":
      return "El formulario contiene datos no válidos";

    case "invalid_union":
      return "Revisa los datos ingresados";

    case "invalid_key":
    case "invalid_element":
      return "El valor no es válido";

    default:
      return undefined;
  }
}

z.config({ customError: mensajeErrorZod });
