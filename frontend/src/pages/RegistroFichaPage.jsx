import FormularioFicha from "../components/registroAnimal/FormularioFicha.jsx";
import MigasNavegacion from "../components/ui/MigasNavegacion.jsx";
import "../styles/formularioFicha.css";

export default function RegistroFichaPage() {
  return (
    <section className="ficha-page">
      <MigasNavegacion actual="Registrar ficha de animal" />

      <div className="ficha-encabezado">
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
