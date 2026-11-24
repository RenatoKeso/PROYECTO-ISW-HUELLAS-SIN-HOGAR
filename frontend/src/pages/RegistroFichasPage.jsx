import ListaFichas from "../components/registroAnimal/ListaFichas.jsx";
import MigasNavegacion from "../components/ui/MigasNavegacion.jsx";

export default function RegistroFichasPage() {
  return (
    <section className="lista-fichas-page">
      <MigasNavegacion actual="Lista de fichas" />

      <ListaFichas />
    </section>
  );
}
