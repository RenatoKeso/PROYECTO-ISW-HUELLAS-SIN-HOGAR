import { z } from "zod";

export const OPCIONES_VIVIENDA = [
  { valor: "", texto: "Seleccione..." },
  { valor: "CASA", texto: "Casa" },
  { valor: "DEPARTAMENTO", texto: "Departamento" },
  { valor: "OTRO", texto: "Otro" },
];

// Un campo que se deja en blanco (o solo con espacios) no se envia.
const vacioAUndefined = (valor) =>
  typeof valor !== "string" || valor.trim() === "" ? undefined : valor;

// "genero" ajusta el mensaje: "El nombre es obligatorio" / "La disponibilidad... es obligatoria".
function textoObligatorio(campo, { maximo = 255, genero = "o" } = {}) {
  return z
    .string()
    .trim()
    .min(1, `${campo} es obligatori${genero}`)
    .max(maximo, `${campo} no puede superar los ${maximo} caracteres`);
}

// Mismas reglas que el backend: acepta puntos y los quita.
const rutSchema = z
  .string()
  .trim()
  .min(1, "El RUT es obligatorio")
  .transform((valor) => valor.replace(/\./g, "").toUpperCase())
  .pipe(
    z.string().regex(/^\d{7,8}-[\dK]$/, "El RUT debe tener el formato 12345678-9"),
  );

const telefonoSchema = z
  .string()
  .trim()
  .min(1, "El teléfono es obligatorio")
  .transform((valor) => valor.replace(/\s/g, ""))
  .pipe(
    z.string().regex(/^\+?\d{8,12}$/, "El teléfono debe tener entre 8 y 12 dígitos"),
  );

export const postulacionFormSchema = z.strictObject({
  nombrePostulante: textoObligatorio("El nombre"),
  rutPostulante: rutSchema,
  telefonoPostulante: telefonoSchema,
  emailPostulante: z.preprocess(
    vacioAUndefined,
    z.email("El correo no es válido").max(255, "El correo es demasiado largo").optional(),
  ),
  tipoVivienda: z.enum(["CASA", "DEPARTAMENTO", "OTRO"], {
    message: "Selecciona el tipo de vivienda",
  }),
  otrasMascotas: z.preprocess(
    vacioAUndefined,
    z.string().trim().max(255, "No puede superar los 255 caracteres").optional(),
  ),
  disponibilidadTiempo: textoObligatorio("La disponibilidad de tiempo", { genero: "a" }),
});

export const observacionResolucionSchema = z.preprocess(
  vacioAUndefined,
  z.string().trim().max(1000, "La observación no puede superar los 1000 caracteres").optional(),
);

// ---------- Visitas, omision y entrega ----------

const fechaObligatoria = (mensaje) =>
  z
    .string()
    .min(1, mensaje)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no es válida");

const observacionOpcional = z.preprocess(
  vacioAUndefined,
  z.string().trim().max(1000, "No puede superar los 1000 caracteres").optional(),
);

export const visitaFormSchema = z.strictObject({
  fechaVisita: fechaObligatoria("Indica la fecha de la visita"),
  resultado: z.enum(["FAVORABLE", "DESFAVORABLE"], {
    message: "Indica el resultado de la visita",
  }),
  observaciones: observacionOpcional,
});

export const omisionFormSchema = z
  .strictObject({
    motivo: z.enum(
      ["FALTA_ESPACIO_REFUGIO", "POSTULANTE_CONOCIDO", "DISTANCIA", "SIN_PERSONAL_DISPONIBLE", "OTRO"],
      { message: "Selecciona un motivo de la lista" },
    ),
    observacion: observacionOpcional,
  })
  .refine((datos) => datos.motivo !== "OTRO" || datos.observacion, {
    message: "Si el motivo es Otro, explícalo aquí",
    path: ["observacion"],
  });

export const entregaFormSchema = z.strictObject({
  fechaEntrega: fechaObligatoria("Indica la fecha de entrega"),
  documentacionEntregada: textoObligatorio("La documentación entregada", {
    maximo: 1000,
    genero: "a",
  }),
});