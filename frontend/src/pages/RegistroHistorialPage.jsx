import HistorialIngresos from "../components/registroAnimal/HistorialIngresos.jsx";
import MigasNavegacion from "../components/ui/MigasNavegacion.jsx";
import "../styles/historialIngresos.css";

export default function RegistroHistorialPage({ usuario }) {
  return (
    <section className="historial-page">
      <MigasNavegacion actual="Historial de ingresos" />

      <HistorialIngresos usuario={usuario} />
    </section>
  );
}
