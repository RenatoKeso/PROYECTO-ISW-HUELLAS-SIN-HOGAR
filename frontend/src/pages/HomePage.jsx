import { Link } from "react-router-dom";
import perritos from "../assets/perritos.jpg";

function HomePage() {
  return (
    <>
      <section className="portada">
        <div className="hero">
          <div>
            <p className="etiqueta">Refugio Huellas Sin Hogar</p>
            <h1>
              Encuentra una <span className="destacado">huella</span> que
              necesita un hogar.
            </h1>
            <p className="bajada">
              Conoce a los animales disponibles, postula para adoptar, avisanos
              si viste un animal abandonado, o sumate como voluntario del
              refugio.
            </p>
            <Link to="/adopcion" className="boton">
              Ver animales en adopción
            </Link>
          </div>

          <img src={perritos} alt="Perros del refugio" className="hero-foto" />
        </div>
      </section>

      <section className="bloque">
        <h2>Que hacemos</h2>

        <div className="tarjetas">
          <article className="tarjeta">
            <h3>Rescate e ingreso</h3>
            <p>
              Recibimos animales desde la via publica, entregas voluntarias,
              decomisos municipales y traslados de otros refugios.
            </p>
          </article>

          <article className="tarjeta">
            <h3>Adopcion responsable</h3>
            <p>
              Evaluamos cada postulacion con visitas previas para asegurar que
              el animal llegue a un hogar adecuado.
            </p>
          </article>

          <article className="tarjeta">
            <h3>Voluntariado</h3>
            <p>
              Organizamos turnos de cuidado diario donde los voluntarios
              alimentan, pasean y acompañan a los animales.
            </p>
          </article>
        </div>
      </section>

      <section className="bloque">
        <h2>Acceso al sistema</h2>
        <p>
          Desde aqui el personal del refugio registra y consulta la informacion
          de los animales.
        </p>

        <Link to="/registro" className="boton">
          Registrar ficha e ingreso
        </Link>
      </section>
    </>
  );
}

export default HomePage;
