import { Link } from "react-router-dom";
import perritos from "../assets/perritos.jpg";
import mascotas from "../assets/mascotas.svg";
import "../styles/inicio.css";

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
        <h2>Qué hacemos</h2>

        <div className="tarjetas">
          <article className="tarjeta">
            <h3>Rescate e ingreso</h3>
            <p>
              Recibimos animales desde la vía pública, entregas voluntarias,
              decomisos municipales y traslados de otros refugios.
            </p>
          </article>

          <article className="tarjeta">
            <h3>Adopción responsable</h3>
            <p>
              Evaluamos cada postulación con visitas previas para asegurar que
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

      <section
        className="bloque invitacion-voluntariado"
        aria-labelledby="titulo-invitacion"
      >
        <div>
          <h2 id="titulo-invitacion">Hazles un espacio en tu semana</h2>
          <p>
            Súmate a los paseos y al cuidado diario de los animales mientras
            encuentran una familia.
          </p>

          <Link to="/voluntariado" className="boton invitacion-enlace">
            Quiero ser voluntario <span aria-hidden="true">→</span>
          </Link>
        </div>

        <img className="invitacion-mascotas" src={mascotas} alt="" />
      </section>
    </>
  );
}

export default HomePage;