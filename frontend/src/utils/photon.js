const URL_PHOTON = "https://photon.komoot.io/api/";
const LIMITE_RESULTADOS = 6;

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function armarResultado(propiedades, indice) {
  const nombre = texto(propiedades.name);
  const calle = texto(propiedades.street);
  const numero = texto(propiedades.housenumber);
  const ciudad =
    texto(propiedades.city) ||
    texto(propiedades.town) ||
    texto(propiedades.village);
  const estado = texto(propiedades.state);
  const pais = texto(propiedades.country);

  const via = calle ? `${calle}${numero ? ` ${numero}` : ""}` : "";
  const principal = nombre || via || ciudad;
  const partes = [via || nombre, ciudad, estado, pais].filter(Boolean);

  return {
    id: `${propiedades.osm_type ?? "osm"}-${propiedades.osm_id ?? indice}`,
    principal,
    secundario: [ciudad, estado, pais]
      .filter((parte) => parte && parte !== principal)
      .join(", "),
    completo: [...new Set(partes)].join(", "),
  };
}

export async function buscarUbicaciones(termino, { signal } = {}) {
  const parametros = new URLSearchParams({
    q: termino,
    limit: String(LIMITE_RESULTADOS),
  });

  const respuesta = await fetch(`${URL_PHOTON}?${parametros}`, { signal });

  if (!respuesta.ok) {
    throw new Error("No se pudieron cargar las sugerencias");
  }

  const datos = await respuesta.json();
  const resultados = [];
  const vistos = new Set();

  for (const [indice, feature] of (datos.features ?? []).entries()) {
    const propiedades = feature.properties ?? {};

    if (texto(propiedades.countrycode).toUpperCase() !== "CL") continue;

    const resultado = armarResultado(propiedades, indice);

    if (!resultado.completo || vistos.has(resultado.completo)) continue;

    vistos.add(resultado.completo);
    resultados.push(resultado);
  }

  return resultados;
}
