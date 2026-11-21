import { Link } from "react-router-dom";
import ListaFichas from "../components/registroAnimal/ListaFichas.jsx";

export default function RegistroFichasPage() {
  return (
    <section className="lista-fichas-page">
      <Link className="lista-fichas-volver" to="/registro">
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_back
        </span>
        <span>Volver a Registro de animales</span>
      </Link>

      <ListaFichas />
    </section>
  );
}
