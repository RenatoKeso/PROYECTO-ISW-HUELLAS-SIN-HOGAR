// Logica de los filtros del catalogo de adopcion.
// Esta separada de la pagina para poder probarla sin abrir el navegador.

// Lo que se muestra en el panel de la izquierda.
// "valor" es lo que viene de la base de datos y "texto" lo que ve la persona.
export const FILTROS = [
  {
    grupo: "especie",
    titulo: "Especie",
    opciones: [
      { valor: "PERRO", texto: "Perro" },
      { valor: "GATO", texto: "Gato" },
      { valor: "OTRO", texto: "Otra especie" },
    ],
  },
  {
    grupo: "sexo",
    titulo: "Sexo",
    opciones: [
      { valor: "MACHO", texto: "Macho" },
      { valor: "HEMBRA", texto: "Hembra" },
    ],
  },
  {
    grupo: "edad",
    titulo: "Edad",
    opciones: [
      { valor: "CACHORRO", texto: "Cachorro (menos de 1 año)" },
      { valor: "JOVEN", texto: "Joven (1 a 2 años)" },
      { valor: "ADULTO", texto: "Adulto (3 a 7 años)" },
      { valor: "SENIOR", texto: "Senior (8 años o más)" },
    ],
  },
];

// Al entrar a la pagina no hay nada marcado.
export const FILTROS_VACIOS = { especie: [], sexo: [], edad: [] };

const ETAPAS = {
  CACHORRO: "Cachorro",
  JOVEN: "Joven",
  ADULTO: "Adulto",
  SENIOR: "Senior",
};

// Convierte la edad en años a una etapa. Si no se sabe la edad, devuelve null.
export function grupoEdad(edad) {
  if (edad === null || edad === undefined) return null;
  if (edad < 1) return "CACHORRO";
  if (edad < 3) return "JOVEN";
  if (edad < 8) return "ADULTO";
  return "SENIOR";
}

export function textoEtapa(edad) {
  return ETAPAS[grupoEdad(edad)] || "Edad desconocida";
}

// Un grupo sin nada marcado deja pasar a todos.
// Si tiene algo marcado, el animal tiene que coincidir con alguno.
function cumple(marcados, valor) {
  return marcados.length === 0 || marcados.includes(valor);
}

// Entre grupos se exigen todos: por ejemplo, "Perro" Y "Hembra".
export function filtrarAnimales(animales, filtros) {
  return animales.filter(
    (animal) =>
      cumple(filtros.especie, animal.especie) &&
      cumple(filtros.sexo, animal.sexoAnimal) &&
      cumple(filtros.edad, grupoEdad(animal.edad)),
  );
}