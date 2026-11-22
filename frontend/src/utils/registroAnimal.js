export const OPCIONES_SEXO = [
  { valor: "", texto: "Seleccione..." },
  { valor: "MACHO", texto: "Macho" },
  { valor: "HEMBRA", texto: "Hembra" },
  { valor: "DESCONOCIDO", texto: "Desconocido" },
];

export const OPCIONES_ESPECIE = [
  { valor: "", texto: "Seleccione..." },
  { valor: "PERRO", texto: "Perro" },
  { valor: "GATO", texto: "Gato" },
  { valor: "OTRO", texto: "Otro" },
];

export const NOMBRES_ESPECIE = {
  PERRO: "Perro",
  GATO: "Gato",
  OTRO: "Otra especie",
};

export function nombreVisible(fichaAnimal) {
  return fichaAnimal.nombre || fichaAnimal.codigoAnimal;
}

export function soloDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

export function codigoAnimalDesdeNumero(valor) {
  const digitos = soloDigitos(valor);
  return digitos ? `anim-${digitos.padStart(3, "0")}` : "";
}

export function fechaHoraActualLocal() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
