export const ETIQUETAS_ESTADO_VALIDACION = {
  PROVISIONAL: "Revisión inicial",
  VALIDACION_PENDIENTE: "Revisión completa",
  REVISANDO: "En revisión",
  REALIZADO: "Realizado",
  ACTUALIZADO: "Actualizado",
};

export const ETIQUETAS_CLASIFICACION_SALUD = {
  NORMAL: "Normal",
  ENFERMO: "Enfermo",
  CRITICO: "Crítico",
};

export const ETIQUETAS_ESPECIE = {
  PERRO: "Canino",
  GATO: "Felino",
  OTRO: "Otra especie",
};

export const ETIQUETAS_SEXO = {
  MACHO: "Macho",
  HEMBRA: "Hembra",
  DESCONOCIDO: "Sin determinar",
};

export const OPCIONES_CLASIFICACION_INICIAL = [
  { valor: "", texto: "Seleccione estado clínico..." },
  { valor: "NORMAL", texto: "Óptimo / Aparentemente sano" },
  { valor: "ENFERMO", texto: "Requiere atención menor / En observación" },
  { valor: "CRITICO", texto: "Estado crítico / Urgencia inmediata" },
];

export const OPCIONES_CLASIFICACION_ACTUALIZACION = [
  { valor: "", texto: "Sin cambio" },
  { valor: "NORMAL", texto: "Normal" },
  { valor: "ENFERMO", texto: "Enfermo" },
  { valor: "CRITICO", texto: "Crítico" },
];

export const OPCIONES_CUARENTENA_INICIAL = [
  { valor: "", texto: "Seleccione opción..." },
  { valor: "false", texto: "No requerido (ingreso directo)" },
  { valor: "true", texto: "Sí, cuarentena preventiva / aislamiento" },
];

export const OPCIONES_CUARENTENA_ACTUALIZACION = [
  { valor: "", texto: "Sin cambio" },
  { valor: "true", texto: "Sí" },
  { valor: "false", texto: "No" },
];

export const OPCIONES_ESTADO_SALUD = [
  { valor: "", texto: "Sin cambio" },
  { valor: "NORMAL", texto: "Normal" },
  { valor: "ENFERMO", texto: "Enfermo" },
  { valor: "CRITICO", texto: "Crítico" },
];

export const OPCIONES_ADOPTABILIDAD = [
  { valor: "", texto: "Seleccione..." },
  { valor: "ADOPTABLE", texto: "Adoptable" },
  { valor: "NO_ADOPTABLE", texto: "No adoptable" },
];

export const OPCIONES_EVOLUCION = [
  { valor: "", texto: "Seleccione..." },
  { valor: "MEJORANDO", texto: "Mejorando" },
  { valor: "EMPEORANDO", texto: "Empeorando" },
  { valor: "ESTABLE", texto: "Estable" },
];

export const OPCIONES_ESTADO_ENFERMEDAD = [
  { valor: "EN_CURSO", texto: "En curso" },
  { valor: "RESUELTO", texto: "Resuelto" },
  { valor: "CRONICO", texto: "Crónico" },
];

export const OPCIONES_ESTADO_TRATAMIENTO = [
  { valor: "EN_CURSO", texto: "En curso" },
  { valor: "RESUELTO", texto: "Resuelto" },
  { valor: "CRONICO", texto: "Crónico" },
];

export const OPCIONES_TIPO_ATENCION = [
  { valor: "vacuna", texto: "Vacuna" },
  { valor: "tratamiento", texto: "Tratamiento" },
  { valor: "control", texto: "Control" },
  { valor: "desparasitacion", texto: "Desparasitación" },
  { valor: "esterilizacion", texto: "Esterilización" },
];

export const OPCIONES_ESTADO_ATENCION = [
  { valor: "PENDIENTE", texto: "Pendiente" },
  { valor: "REALIZADA", texto: "Realizada" },
  { valor: "CANCELADA", texto: "Cancelada" },
];
