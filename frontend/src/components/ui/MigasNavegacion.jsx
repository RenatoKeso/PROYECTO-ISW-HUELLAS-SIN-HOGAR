import { Link } from "react-router-dom";
import "../../styles/migasNavegacion.css";

export default function MigasNavegacion({
  seccion = "Registro de animales",
  rutaSeccion = "/registro",
  actual,
  textoVolver,
  rutaVolver = rutaSeccion,
}) {
  return (
    <div className="migas-navegacion">
      <nav aria-label="Migas de pan" className="migas-navegacion-breadcrumb">
        <Link to={rutaSeccion} className="migas-navegacion-link">
          <span className="material-symbols-outlined" aria-hidden="true">
            home
          </span>
          <span>{seccion}</span>
        </Link>
        <span
          className="material-symbols-outlined migas-navegacion-sep"
          aria-hidden="true"
        >
          chevron_right
        </span>
        <span className="migas-navegacion-actual">{actual}</span>
      </nav>

      <Link to={rutaVolver} className="migas-navegacion-volver">
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_back
        </span>
        <span>{textoVolver ?? `Volver a ${seccion}`}</span>
      </Link>
    </div>
  );
}
