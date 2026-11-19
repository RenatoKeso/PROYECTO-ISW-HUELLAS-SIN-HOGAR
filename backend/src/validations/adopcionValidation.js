import { z } from "zod";

export const TIPO_VIVIENDA_VALUES = ["CASA", "DEPARTAMENTO", "OTRO"];
export const TENENCIA_VIVIENDA_VALUES = ["PROPIA", "ARRENDADA", "OTRA"];

export const ESTADO_POSTULACION_VALUES = [
  "EN_REVISION",
  "APROBADA",
  "RECHAZADA",
  "CERRADA",
  "ENTREGADA",
];

// Al revisar, la encargada solo puede aprobar o rechazar.
export const DECISION_POSTULACION_VALUES = ["APROBADA", "RECHAZADA"];

export const TIPO_VISITA_VALUES = ["PRIMERA_VISITA", "VISITA_HOGAR"];
export const RESULTADO_VISITA_VALUES = ["FAVORABLE", "DESFAVORABLE"];
export const MOTIVO_OMISION_VALUES = [
  "FALTA_ESPACIO_REFUGIO",
  "POSTULANTE_CONOCIDO",
  "DISTANCIA",
  "SIN_PERSONAL_DISPONIBLE",
  "OTRO",
];

// Edad minima para adoptar.
const EDAD_MINIMA = 18;
// Un motivo de rechazo corto como "no" no explica nada.
const MINIMO_MOTIVO_RECHAZO = 10;

// El refugio esta en Chile: "hoy" y "el dia de una fecha" se calculan con la
// hora de Chile
const ZONA_HORARIA = "America/Santiago";

// Devuelve el dia de una fecha en Chile, como texto "AAAA-MM-DD".
export function diaEnChile(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(fecha);
}

// Resta años a un dia "AAAA-MM-DD": restarAnios("2026-11-18", 18) = "2008-11-18".
function restarAnios(dia, anios) {
  return `${Number(dia.slice(0, 4)) - anios}${dia.slice(4)}`;
}

// Fecha sin hora ("AAAA-MM-DD") que no puede ser posterior a hoy.
// Se guarda como medianoche UTC, igual que las otras fechas sin hora del proyecto.
const fechaNoFuturaSchema = z.iso
  .date({ message: "La fecha debe tener el formato AAAA-MM-DD" })
  .refine((valor) => valor <= diaEnChile(), {
    message: "La fecha no puede ser posterior a hoy",
  })
  .transform((valor) => new Date(`${valor}T00:00:00.000Z`));

// El postulante debe ser mayor de edad. Se compara como texto porque
// "AAAA-MM-DD" tiene largo fijo y su orden alfabetico es el del calendario.
const fechaNacimientoSchema = z.iso
  .date({ message: "Indica tu fecha de nacimiento" })
  .refine((valor) => valor >= restarAnios(diaEnChile(), 110), {
    message: "La fecha de nacimiento no es válida",
  })
  .refine((valor) => valor <= restarAnios(diaEnChile(), EDAD_MINIMA), {
    message: `Debes tener al menos ${EDAD_MINIMA} años para adoptar`,
  })
  .transform((valor) => new Date(`${valor}T00:00:00.000Z`));

const idSchema = z
  .number({ message: "El identificador debe ser un número" })
  .int("El identificador debe ser un número entero")
  .positive("El identificador debe ser mayor que cero");

// "genero" ajusta el mensaje: "El nombre es obligatorio" / "La observación es obligatoria".
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

const textoOpcional = z
  .string()
  .trim()
  .min(1, "El texto no puede estar vacío")
  .max(255, "El texto no puede superar los 255 caracteres");

// Solo letras (incluye tildes, ñ y ü) separadas por un espacio, guion o apostrofo.
// Asi "Benj4" o "Ana_123" no pasan, pero "María José O'Ryan" si.
const REGEX_SOLO_LETRAS = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

// Texto obligatorio que solo acepta letras. Antes de revisar, deja un solo
// espacio entre palabras ("Ana    Soto" -> "Ana Soto").
function textoSoloLetras(campo, { genero = "o", minimoPalabras = 1, mensajePalabras } = {}) {
  return textoObligatorio(campo, { genero })
    .transform((valor) => valor.replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .regex(REGEX_SOLO_LETRAS, `${campo} solo puede tener letras`)
        // Si ya fallo la regex no se agrega un segundo error.
        .refine(
          (valor) => !REGEX_SOLO_LETRAS.test(valor) || valor.split(" ").length >= minimoPalabras,
          mensajePalabras,
        ),
    );
}

const nombreSchema = textoSoloLetras("El nombre", {
  minimoPalabras: 2,
  mensajePalabras: "Escribe tu nombre y apellido",
});

const REGEX_RUT = /^\d{7,8}-[\dK]$/;

// Digito verificador de un RUT con el metodo del modulo 11:
// se multiplican los digitos de derecha a izquierda por 2, 3, 4, 5, 6, 7, 2, 3...
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

// Acepta "12.345.678-5" o "12345678-5" y siempre lo guarda como "12345678-5".
// Guardarlo igual es lo que permite encontrar las devoluciones anteriores del postulante.
export const rutSchema = z
  .string({ message: "El RUT es obligatorio" })
  .trim()
  .transform((valor) => valor.replace(/\./g, "").toUpperCase())
  .pipe(
    z
      .string()
      .regex(REGEX_RUT, "El RUT debe tener el formato 12345678-9")
      .refine((valor) => {
        if (!REGEX_RUT.test(valor)) return true; // el error de formato ya se informo
        const [cuerpo, digito] = valor.split("-");
        return digitoVerificadorRut(cuerpo) === digito;
      }, "El RUT no es válido, revisa el dígito verificador"),
  );

// Acepta espacios ("9 1234 5678") y los quita antes de guardar.
export const telefonoSchema = z
  .string({ message: "El teléfono es obligatorio" })
  .trim()
  .transform((valor) => valor.replace(/\s/g, ""))
  .pipe(
    z.string().regex(/^\+?\d{8,12}$/, "El teléfono debe tener entre 8 y 12 dígitos"),
  );

// Obligatorio y en minusculas, igual que el correo de voluntariado.
const correoSchema = z
  .string({ message: "El correo es obligatorio" })
  .trim()
  .toLowerCase()
  .min(1, { message: "El correo es obligatorio", abort: true })
  .pipe(z.email("El correo no es válido").max(255, "El correo no puede superar los 255 caracteres"));

function siNoSchema(mensaje) {
  return z.boolean({ message: mensaje });
}

function enteroEnRango(mensaje, minimo, maximo, mensajeRango) {
  return z
    .number({ message: mensaje })
    .int(mensaje)
    .min(minimo, mensajeRango)
    .max(maximo, mensajeRango);
}

// Formulario publico que llena la persona que quiere adoptar.
export const postulacionCreateSchema = z
  .strictObject({
    fichaAnimalId: idSchema,

    // Datos personales
    nombrePostulante: nombreSchema,
    rutPostulante: rutSchema,
    fechaNacimientoPostulante: fechaNacimientoSchema,
    telefonoPostulante: telefonoSchema,
    emailPostulante: correoSchema,
    direccionPostulante: textoObligatorio("La dirección", { minimo: 5, genero: "a" }),
    comunaPostulante: textoSoloLetras("La comuna", { genero: "a" }),

    // Hogar
    tipoVivienda: z.enum(TIPO_VIVIENDA_VALUES, {
      message: "El tipo de vivienda no es válido",
    }),
    tenenciaVivienda: z.enum(TENENCIA_VIVIENDA_VALUES, {
      message: "Indica si la vivienda es propia, arrendada u otra",
    }),
    permiteMascotasArriendo: siNoSchema("Indica si el arriendo permite mascotas").optional(),
    tienePatio: siNoSchema("Indica si la vivienda tiene patio"),
    personasHogar: enteroEnRango(
      "Indica cuántas personas viven en el hogar",
      1,
      20,
      "Las personas del hogar deben ser entre 1 y 20",
    ),
    hayNinos: siNoSchema("Indica si hay niños en el hogar"),
    otrasMascotas: textoOpcional.optional(),

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
    aceptaSeguimiento: z.literal(true, {
      message: "Debes aceptar los seguimientos después de la adopción",
    }),
  })
  // Si arrienda, hay que saber si el arriendo permite mascotas.
  .refine(
    (datos) =>
      datos.tenenciaVivienda !== "ARRENDADA" || datos.permiteMascotasArriendo !== undefined,
    {
      message: "Indica si el arriendo permite mascotas",
      path: ["permiteMascotasArriendo"],
    },
  )
  // Si no arrienda, esa respuesta no aplica y no se guarda.
  .transform((datos) =>
    datos.tenenciaVivienda === "ARRENDADA"
      ? datos
      : { ...datos, permiteMascotasArriendo: undefined },
  );

export const postulacionIdParamSchema = z.object({
  id: z.coerce
    .number({ message: "El identificador debe ser un número" })
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser mayor que cero"),
});

export const animalIdParamSchema = postulacionIdParamSchema;

// Ruta de un seguimiento: /postulaciones/:id/seguimientos/:seguimientoId
export const seguimientoParamSchema = postulacionIdParamSchema.extend({
  seguimientoId: postulacionIdParamSchema.shape.id,
});

export const listarPostulacionesQuerySchema = z.strictObject({
  estado: z
    .enum(ESTADO_POSTULACION_VALUES, { message: "El estado indicado no es válido" })
    .optional(),
});

// Un rechazo siempre queda con su motivo; al aprobar, la observacion es opcional.
export const resolverPostulacionSchema = z
  .strictObject({
    decision: z.enum(DECISION_POSTULACION_VALUES, {
      message: "La decisión debe ser APROBADA o RECHAZADA",
    }),
    observaciones: textoObligatorio("La observación", { maximo: 1000, genero: "a" }).optional(),
  })
  .refine((datos) => datos.decision !== "RECHAZADA" || datos.observaciones, {
    message: "Para rechazar, indica el motivo en las observaciones",
    path: ["observaciones"],
  })
  .refine(
    (datos) =>
      datos.decision !== "RECHAZADA" ||
      !datos.observaciones ||
      datos.observaciones.length >= MINIMO_MOTIVO_RECHAZO,
    {
      message: `El motivo del rechazo debe tener al menos ${MINIMO_MOTIVO_RECHAZO} caracteres`,
      path: ["observaciones"],
    },
  );

// Una visita desfavorable cierra la postulacion, asi que debe explicar por que.
export const registrarVisitaSchema = z
  .strictObject({
    tipo: z.enum(TIPO_VISITA_VALUES, { message: "El tipo de visita no es válido" }),
    fechaVisita: fechaNoFuturaSchema,
    resultado: z.enum(RESULTADO_VISITA_VALUES, {
      message: "El resultado debe ser FAVORABLE o DESFAVORABLE",
    }),
    observaciones: textoObligatorio("La observación", { maximo: 1000, genero: "a" }).optional(),
  })
  .refine((datos) => datos.resultado !== "DESFAVORABLE" || datos.observaciones, {
    message: "Si la visita fue desfavorable, explica el motivo en las observaciones",
    path: ["observaciones"],
  });

export const omitirVisitaHogarSchema = z
  .strictObject({
    motivo: z.enum(MOTIVO_OMISION_VALUES, { message: "Selecciona un motivo de la lista" }),
    observacion: textoObligatorio("La observación", { maximo: 1000, genero: "a" }).optional(),
  })
  .refine((datos) => datos.motivo !== "OTRO" || datos.observacion, {
    message: "Si el motivo es OTRO, explícalo en la observación",
    path: ["observacion"],
  });

export const entregaSchema = z.strictObject({
  fechaEntrega: fechaNoFuturaSchema,
  documentacionEntregada: textoObligatorio("La documentación entregada", {
    maximo: 1000,
    genero: "a",
  }),
});
