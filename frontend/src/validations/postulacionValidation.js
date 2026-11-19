import { z } from "zod";
import { hoyLocal } from "../utils/formatoAdopcion.js";

export const OPCIONES_VIVIENDA = [
  { valor: "", texto: "Seleccione..." },
  { valor: "CASA", texto: "Casa" },
  { valor: "DEPARTAMENTO", texto: "Departamento" },
  { valor: "OTRO", texto: "Otro" },
];

export const OPCIONES_TENENCIA = [
  { valor: "", texto: "Seleccione..." },
  { valor: "PROPIA", texto: "Propia" },
  { valor: "ARRENDADA", texto: "Arrendada" },
  { valor: "OTRA", texto: "Otra (familiar, cedida...)" },
];

export const OPCIONES_SI_NO = [
  { valor: "", texto: "Seleccione..." },
  { valor: "SI", texto: "Sí" },
  { valor: "NO", texto: "No" },
];

const EDAD_MINIMA = 18;
const MINIMO_MOTIVO_RECHAZO = 10;

// Un campo que se deja en blanco (o solo con espacios) no se envia.
const vacioAUndefined = (valor) =>
  typeof valor !== "string" || valor.trim() === "" ? undefined : valor;

// Resta años a un dia "AAAA-MM-DD": restarAnios("2026-11-18", 18) = "2008-11-18".
function restarAnios(dia, anios) {
  return `${Number(dia.slice(0, 4)) - anios}${dia.slice(4)}`;
}

// "genero" ajusta el mensaje: "El nombre es obligatorio" / "La disponibilidad... es obligatoria".
// "abort" hace que un campo vacio muestre solo "es obligatorio", sin los demas errores.
function textoObligatorio(campo, { minimo = 1, maximo = 255, genero = "o" } = {}) {
  const mensaje = `${campo} es obligatori${genero}`;

  const esquema = z
    .string({ message: mensaje })
    .trim()
    .min(1, { message: mensaje, abort: true })
    .max(maximo, `${campo} no puede superar los ${maximo} caracteres`);

  return minimo > 1
    ? esquema.min(minimo, `${campo} debe tener al menos ${minimo} caracteres`)
    : esquema;
}

// Mismas reglas que el backend: solo letras separadas por espacio, guion o apostrofo.
const REGEX_SOLO_LETRAS = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

function textoSoloLetras(campo, { genero = "o", minimoPalabras = 1, mensajePalabras } = {}) {
  return textoObligatorio(campo, { genero })
    .transform((valor) => valor.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .regex(REGEX_SOLO_LETRAS, `${campo} solo puede tener letras`)
        .refine(
          (valor) => !REGEX_SOLO_LETRAS.test(valor) || valor.split(" ").length >= minimoPalabras,
          mensajePalabras,
        ),
    );
}

const REGEX_RUT = /^\d{7,8}-[\dK]$/;

// Digito verificador con modulo 11 (igual que en el backend).
export function digitoVerificadorRut(cuerpo) {
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resultado = 11 - (suma % 11);
  if (resultado === 11) return "0";
  if (resultado === 10) return "K";
  return String(resultado);
}

// Mismas reglas que el backend: acepta puntos y los quita.
const rutSchema = z
  .string()
  .trim()
  .min(1, { message: "El RUT es obligatorio", abort: true })
  .transform((valor) => valor.replace(/\./g, "").toUpperCase())
  .pipe(
    z
      .string()
      .regex(REGEX_RUT, "El RUT debe tener el formato 12345678-9")
      .refine((valor) => {
        if (!REGEX_RUT.test(valor)) return true;
        const [cuerpo, digito] = valor.split("-");
        return digitoVerificadorRut(cuerpo) === digito;
      }, "El RUT no es válido, revisa el dígito verificador"),
  );

const telefonoSchema = z
  .string()
  .trim()
  .min(1, "El teléfono es obligatorio")
  .transform((valor) => valor.replace(/\s/g, ""))
  .pipe(
    z.string().regex(/^\+?\d{8,12}$/, "El teléfono debe tener entre 8 y 12 dígitos"),
  );

const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { message: "El correo es obligatorio", abort: true })
  .pipe(z.email("El correo no es válido").max(255, "El correo es demasiado largo"));

// <input type="date"> entrega "AAAA-MM-DD", o "" si no se eligio fecha.
const fechaNacimientoSchema = z
  .string()
  .min(1, { message: "Indica tu fecha de nacimiento", abort: true })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "La fecha no es válida", abort: true })
  .refine((valor) => valor >= restarAnios(hoyLocal(), 110), "La fecha de nacimiento no es válida")
  .refine(
    (valor) => valor <= restarAnios(hoyLocal(), EDAD_MINIMA),
    `Debes tener al menos ${EDAD_MINIMA} años para adoptar`,
  );

// Los <select> de Sí/No entregan "SI", "NO" o "". Al backend se envia true o false.
function siNoSchema(mensaje) {
  return z.enum(["SI", "NO"], { message: mensaje }).transform((valor) => valor === "SI");
}

// Los inputs siempre entregan texto. Primero se revisa que no este vacio y
// recien despues se convierte a numero (z.coerce convertiria "" en 0).
function enteroEnRango(mensaje, minimo, maximo, mensajeRango) {
  return z
    .string()
    .trim()
    .min(1, { message: mensaje, abort: true })
    .regex(/^\d+$/, { message: mensaje, abort: true })
    .transform(Number)
    .pipe(z.number().min(minimo, mensajeRango).max(maximo, mensajeRango));
}

export const postulacionFormSchema = z
  .strictObject({
    // Datos personales
    nombrePostulante: textoSoloLetras("El nombre", {
      minimoPalabras: 2,
      mensajePalabras: "Escribe tu nombre y apellido",
    }),
    rutPostulante: rutSchema,
    fechaNacimientoPostulante: fechaNacimientoSchema,
    telefonoPostulante: telefonoSchema,
    emailPostulante: correoSchema,
    direccionPostulante: textoObligatorio("La dirección", { minimo: 5, genero: "a" }),
    comunaPostulante: textoSoloLetras("La comuna", { genero: "a" }),

    // Hogar
    tipoVivienda: z.enum(["CASA", "DEPARTAMENTO", "OTRO"], {
      message: "Selecciona el tipo de vivienda",
    }),
    tenenciaVivienda: z.enum(["PROPIA", "ARRENDADA", "OTRA"], {
      message: "Indica si la vivienda es propia, arrendada u otra",
    }),
    permiteMascotasArriendo: z.preprocess(
      vacioAUndefined,
      siNoSchema("Indica si el arriendo permite mascotas").optional(),
    ),
    tienePatio: siNoSchema("Indica si la vivienda tiene patio"),
    personasHogar: enteroEnRango(
      "Indica cuántas personas viven en el hogar",
      1,
      20,
      "Las personas del hogar deben ser entre 1 y 20",
    ),
    hayNinos: siNoSchema("Indica si hay niños en el hogar"),
    otrasMascotas: z.preprocess(
      vacioAUndefined,
      z.string().trim().max(255, "No puede superar los 255 caracteres").optional(),
    ),

    // Tiempo y compromiso
    horasSoloAlDia: enteroEnRango(
      "Indica cuántas horas al día estaría solo",
      0,
      24,
      "Las horas al día deben ser entre 0 y 24",
    ),
    disponibilidadTiempo: textoObligatorio("La disponibilidad de tiempo", {
      minimo: 10,
      genero: "a",
    }),
    motivoAdopcion: textoObligatorio("El motivo para adoptar", { minimo: 20, maximo: 1000 }),
    // Es una casilla: true si esta marcada.
    aceptaSeguimiento: z.literal(true, {
      message: "Debes aceptar los seguimientos después de la adopción",
    }),
  })
  .refine(
    (datos) =>
      datos.tenenciaVivienda !== "ARRENDADA" || datos.permiteMascotasArriendo !== undefined,
    {
      message: "Indica si el arriendo permite mascotas",
      path: ["permiteMascotasArriendo"],
    },
  )
  // Si eligio "Arrendada", respondio y despues cambio a "Propia", esa respuesta no se envia.
  .transform((datos) =>
    datos.tenenciaVivienda === "ARRENDADA"
      ? datos
      : { ...datos, permiteMascotasArriendo: undefined },
  );

export const observacionResolucionSchema = z.preprocess(
  vacioAUndefined,
  z.string().trim().max(1000, "La observación no puede superar los 1000 caracteres").optional(),
);

// Al rechazar, la observacion pasa a ser obligatoria: es el motivo del rechazo.
export const motivoRechazoSchema = z.preprocess(
  vacioAUndefined,
  z
    .string({ message: "Para rechazar, indica el motivo en las observaciones" })
    .trim()
    .min(
      MINIMO_MOTIVO_RECHAZO,
      `El motivo del rechazo debe tener al menos ${MINIMO_MOTIVO_RECHAZO} caracteres`,
    )
    .max(1000, "La observación no puede superar los 1000 caracteres"),
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

export const visitaFormSchema = z
  .strictObject({
    fechaVisita: fechaObligatoria("Indica la fecha de la visita"),
    resultado: z.enum(["FAVORABLE", "DESFAVORABLE"], {
      message: "Indica el resultado de la visita",
    }),
    observaciones: observacionOpcional,
  })
  .refine((datos) => datos.resultado !== "DESFAVORABLE" || datos.observaciones, {
    message: "Si la visita fue desfavorable, explica el motivo aquí",
    path: ["observaciones"],
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
