import FormularioIngreso from "../components/registroAnimal/FormularioIngreso.jsx";
import MigasNavegacion from "../components/ui/MigasNavegacion.jsx";
import "../styles/formularioIngreso.css";

export default function RegistroIngresoPage() {
  return (
    <section className="ingreso-page">
      <MigasNavegacion actual="Registrar ingreso de animal" />

      <div className="ingreso-encabezado">
        <span className="ingreso-modulo">
          <span className="ingreso-modulo-punto" aria-hidden="true" />
          Módulo de Ingresos
        </span>
      </div>

      <FormularioIngreso />
    </section>
  );
}
