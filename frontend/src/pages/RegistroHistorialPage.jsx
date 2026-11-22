import { Link } from "react-router-dom";
import HistorialIngresos from "../components/registroAnimal/HistorialIngresos.jsx";
import "../styles/historialIngresos.css";

export default function RegistroHistorialPage() {
  return (
    <section className="historial-page">
      <Link className="historial-volver" to="/registro">
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_back
        </span>
        <span>Volver a Registro de animales</span>
      </Link>

      <HistorialIngresos />
    </section>
  );
}
