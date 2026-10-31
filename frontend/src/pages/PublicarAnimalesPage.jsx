import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listarAnimalesPublicables,
  publicarAnimal,
} from "../services/adopcionesService.js";
import { ESPECIES, formatearEdad } from "../utils/formatoAdopcion.js";
import "../styles/postulaciones.css";

// Animales que la veterinaria marco como adoptables y que todavia no estan
// en el catalogo. Publicar uno lo deja visible para recibir postulaciones.
function PublicarAnimalesPage() {
  const [animales, setAnimales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [publicandoId, setPublicandoId] = useState(null);

  useEffect(() => {
    let vigente = true;

    listarAnimalesPublicables()
      .then((respuesta) => vigente && setAnimales(respuesta.animales))
      .catch((errorCarga) => vigente && setError(errorCarga.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, []);

  async function publicar(animal) {
    setMensaje(null);
    setPublicandoId(animal.id);

    try {
      await publicarAnimal(animal.id);
      setAnimales((actuales) => actuales.filter((otro) => otro.id !== animal.id));
      setMensaje({
        tipo: "exito",
        texto: `${animal.nombre || animal.codigoAnimal} ya aparece en el catálogo de adopción.`,
      });
    } catch (errorPublicar) {
      setMensaje({ tipo: "error", texto: errorPublicar.message });
    } finally {
      setPublicandoId(null);
    }
  }

  return (
    <section className="bloque">
      <Link to="/postulaciones" className="volver-link">← Volver a postulaciones</Link>

      <h2>Publicar animales</h2>
      <p>
        Animales que la veterinaria evaluó como adoptables y que todavía no están
        en el catálogo público.
      </p>

      {mensaje && (
        <p className={`mensaje mensaje-${mensaje.tipo}`}>
          {mensaje.texto}{" "}
          {mensaje.tipo === "exito" && <Link to="/adopcion">Ver catálogo</Link>}
        </p>
      )}

      {cargando && <p>Cargando animales...</p>}

      {!cargando && error && (
        <p className="mensaje mensaje-error">No se pudieron cargar los animales: {error}</p>
      )}

      {!cargando && !error && animales.length === 0 && (
        <p>No hay animales adoptables pendientes de publicar.</p>
      )}

      {!cargando && !error && animales.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla-postulaciones">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Especie</th>
                <th>Raza</th>
                <th>Edad</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {animales.map((animal) => (
                <tr key={animal.id}>
                  <td>{animal.codigoAnimal}</td>
                  <td>{animal.nombre || "Sin nombre"}</td>
                  <td>{ESPECIES[animal.especie]}</td>
                  <td>{animal.raza || "—"}</td>
                  <td>{formatearEdad(animal.edad) || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="boton boton-chico"
                      disabled={publicandoId !== null}
                      onClick={() => publicar(animal)}
                    >
                      {publicandoId === animal.id ? "Publicando..." : "Publicar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default PublicarAnimalesPage;