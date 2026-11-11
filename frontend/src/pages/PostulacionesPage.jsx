import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarPostulaciones } from "../services/adopcionesService.js";
import { ESTADOS_POSTULACION, formatearFecha } from "../utils/formatoAdopcion.js";
import "../styles/postulaciones.css";

const PESTANAS = [
  { valor: "EN_REVISION", texto: "En revisión" },
  { valor: "APROBADA", texto: "Aprobadas" },
  { valor: "ENTREGADA", texto: "Entregadas" },
  { valor: "RECHAZADA", texto: "Rechazadas" },
  { valor: "CERRADA", texto: "Cerradas" },
  { valor: "", texto: "Todas" },
];

// Bandeja de la encargada de adopciones: lista las postulaciones por estado.
function PostulacionesPage() {
  const [filtro, setFiltro] = useState("EN_REVISION");

  // Se guarda junto con el filtro que se consulto. Mientras no coincidan,
  // la consulta del filtro elegido todavia esta en camino.
  const [resultado, setResultado] = useState({
    filtro: null,
    postulaciones: [],
    error: "",
  });

  useEffect(() => {
    let vigente = true;

    listarPostulaciones(filtro)
      .then((respuesta) => {
        if (vigente) {
          setResultado({ filtro, postulaciones: respuesta.postulaciones, error: "" });
        }
      })
      .catch((error) => {
        if (vigente) {
          setResultado({ filtro, postulaciones: [], error: error.message });
        }
      });

    return () => {
      vigente = false;
    };
  }, [filtro]);

  const cargando = resultado.filtro !== filtro;
  const { postulaciones, error } = resultado;

  return (
    <section className="bloque">
      <div className="encabezado-acciones">
        <div>
          <h2>Postulaciones de adopción</h2>
          <p>Revisa las postulaciones que llegan desde el catálogo público.</p>
        </div>
        <Link to="/adopciones/publicar" className="boton boton-secundario">
          Publicar animales
        </Link>
      </div>

      <div className="pestanas-estado" role="tablist">
        {PESTANAS.map((pestana) => (
          <button
            key={pestana.valor || "todas"}
            type="button"
            role="tab"
            aria-selected={filtro === pestana.valor}
            className={filtro === pestana.valor ? "pestana-estado activa" : "pestana-estado"}
            onClick={() => setFiltro(pestana.valor)}
          >
            {pestana.texto}
          </button>
        ))}
      </div>

      {cargando && <p>Cargando postulaciones...</p>}

      {!cargando && error && (
        <p className="mensaje mensaje-error">
          No se pudieron cargar las postulaciones: {error}
        </p>
      )}

      {!cargando && !error && postulaciones.length === 0 && (
        <p>No hay postulaciones en este estado.</p>
      )}

      {!cargando && !error && postulaciones.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla-postulaciones">
            <thead>
              <tr>
                <th>N°</th>
                <th>Postulante</th>
                <th>RUT</th>
                <th>Animal</th>
                <th>Recibida</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {postulaciones.map((postulacion) => (
                <tr key={postulacion.id}>
                  <td>{postulacion.id}</td>
                  <td>{postulacion.nombrePostulante}</td>
                  <td>{postulacion.rutPostulante}</td>
                  <td>
                    {postulacion.fichaAnimal.nombre || "Sin nombre"}
                    <span className="texto-suave"> · {postulacion.fichaAnimal.codigoAnimal}</span>
                  </td>
                  <td>{formatearFecha(postulacion.createdAt)}</td>
                  <td>
                    <span className={`estado-chip estado-${postulacion.estado}`}>
                      {ESTADOS_POSTULACION[postulacion.estado]}
                    </span>
                  </td>
                  <td>
                    <Link to={`/postulaciones/${postulacion.id}`} className="enlace-accion">
                      {postulacion.estado === "EN_REVISION" ? "Revisar" : "Ver"}
                    </Link>
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

export default PostulacionesPage;