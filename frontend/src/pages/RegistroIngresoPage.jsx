import { Link } from "react-router-dom";
import FormularioIngreso from "../components/registroAnimal/FormularioIngreso.jsx";
import "../styles/formularioIngreso.css";

export default function RegistroIngresoPage() {
  return (
    <section className="ingreso-page">
      <div className="ingreso-encabezado">
        <Link className="ingreso-volver" to="/registro">
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
          <span>Volver a Registro de animales</span>
        </Link>

        <span className="ingreso-modulo">
          <span className="ingreso-modulo-punto" aria-hidden="true" />
          Módulo de Ingresos
        </span>
      </div>

      <FormularioIngreso />
    </section>
  );
}
