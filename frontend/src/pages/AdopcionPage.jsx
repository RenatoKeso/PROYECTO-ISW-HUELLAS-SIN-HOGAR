import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarAnimalesEnAdopcion } from "../services/adopcionesService.js";
import {
  FILTROS,
  FILTROS_VACIOS,
  filtrarAnimales,
  textoEtapa,
} from "../utils/filtrosAdopcion.js";
import "../styles/adopcion.css";

const ESPECIES = {
  PERRO: "Perro",
  GATO: "Gato",
  OTRO: "Otra especie",
};

// Mientras no haya fotos en la base de datos, se muestra un dibujo segun la especie.
const DIBUJOS = {
  PERRO: "🐶",
  GATO: "🐱",
  OTRO: "🐾",
};

function describirEdad(edad) {
  if (edad === null || edad === undefined) return null;
  if (edad === 0) return "menos de 1 año";
  return edad === 1 ? "1 año" : `${edad} años`;
}

function SimboloSexo({ sexo }) {
  if (sexo === "HEMBRA") {
    return (
      <span className="sexo sexo-hembra" role="img" aria-label="Hembra" title="Hembra">
        ♀
      </span>
    );
  }

  if (sexo === "MACHO") {
    return (
      <span className="sexo sexo-macho" role="img" aria-label="Macho" title="Macho">
        ♂
      </span>
    );
  }

  return null;
}

function TarjetaAnimal({ animal }) {
  const primeraLinea = [textoEtapa(animal.edad), describirEdad(animal.edad)];
  const segundaLinea = [ESPECIES[animal.especie], animal.raza];

  return (
    <article className="tarjeta tarjeta-animal">
      <div className={`foto-animal foto-${animal.especie.toLowerCase()}`}>
        <span aria-hidden="true">{DIBUJOS[animal.especie]}</span>
      </div>

      <h3>
        {animal.nombre || "Sin nombre"}
        <SimboloSexo sexo={animal.sexoAnimal} />
      </h3>
      <p>{primeraLinea.filter(Boolean).join(" · ")}</p>
      <p>{segundaLinea.filter(Boolean).join(" · ")}</p>
      <Link to={`/adopcion/${animal.id}/postular`} className="boton boton-postular">
        Postular
      </Link>
    </article>
  );
}

function PanelFiltros({ filtros, hayFiltros, onCambiar, onLimpiar }) {
  return (
    <aside className="filtros" aria-label="Filtros">
      {FILTROS.map((filtro) => (
        <fieldset key={filtro.grupo}>
          <legend>{filtro.titulo}</legend>

          {filtro.opciones.map((opcion) => (
            <label key={opcion.valor}>
              <input
                type="checkbox"
                checked={filtros[filtro.grupo].includes(opcion.valor)}
                onChange={() => onCambiar(filtro.grupo, opcion.valor)}
              />
              {opcion.texto}
            </label>
          ))}
        </fieldset>
      ))}

      {hayFiltros && (
        <button
          type="button"
          className="boton boton-secundario"
          onClick={onLimpiar}
        >
          Limpiar filtros
        </button>
      )}
    </aside>
  );
}

function AdopcionPage() {
  const [animales, setAnimales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  useEffect(() => {
    listarAnimalesEnAdopcion()
      .then((respuesta) => setAnimales(respuesta.animales))
      .catch((errorCarga) => setError(errorCarga.message))
      .finally(() => setCargando(false));
  }, []);

  // Marca o desmarca una opcion dentro de un grupo (especie, sexo o edad).
  function alternarFiltro(grupo, valor) {
    setFiltros((actuales) => {
      const marcados = actuales[grupo];
      const nuevos = marcados.includes(valor)
        ? marcados.filter((marcado) => marcado !== valor)
        : [...marcados, valor];

      return { ...actuales, [grupo]: nuevos };
    });
  }

  const visibles = filtrarAnimales(animales, filtros);
  const hayFiltros = Object.values(filtros).some((marcados) => marcados.length > 0);
  const listo = !cargando && !error;

  return (
    <section className="bloque">
      <h2>Animales en adopción</h2>
      <p>
        Estos son los animales del refugio que esperan un hogar. Elige uno y
        envía tu postulación.
      </p>

      <div className="adopcion-layout">
        <PanelFiltros
          filtros={filtros}
          hayFiltros={hayFiltros}
          onCambiar={alternarFiltro}
          onLimpiar={() => setFiltros(FILTROS_VACIOS)}
        />

        <div>
          {cargando && <p>Cargando animales...</p>}

          {error && (
            <p className="mensaje mensaje-error">
              No se pudieron cargar los animales: {error}
            </p>
          )}

          {listo && animales.length === 0 && (
            <p>Por ahora no hay animales en adopción.</p>
          )}

          {listo && animales.length > 0 && (
            <p className="resultado">
              {visibles.length === 1
                ? "1 animal encontrado"
                : `${visibles.length} animales encontrados`}
            </p>
          )}

          {listo && animales.length > 0 && visibles.length === 0 && (
            <p>Ningún animal coincide con los filtros elegidos.</p>
          )}

          <div className="catalogo">
            {visibles.map((animal) => (
              <TarjetaAnimal key={animal.id} animal={animal} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdopcionPage;