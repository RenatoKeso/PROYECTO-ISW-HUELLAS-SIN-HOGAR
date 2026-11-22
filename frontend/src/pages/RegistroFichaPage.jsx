import { Link } from "react-router-dom";
import FormularioFicha from "../components/registroAnimal/FormularioFicha.jsx";
import "../styles/formularioFicha.css";

export default function RegistroFichaPage() {
  return (
    <section className="ficha-page">
      <div className="ficha-encabezado">
        <Link className="ficha-volver" to="/registro">
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
          <span>Volver a Registro de animales</span>
        </Link>

        <div className="ficha-titulos">
          <span className="ficha-eyebrow">Registro de animales</span>
          <h1>Registrar ficha de animal</h1>
          <p>
            Completa los datos básicos, fotografía y observaciones para crear
            un nuevo expediente en el refugio.
          </p>
        </div>
      </div>

      <FormularioFicha />
    </section>
  );
}
