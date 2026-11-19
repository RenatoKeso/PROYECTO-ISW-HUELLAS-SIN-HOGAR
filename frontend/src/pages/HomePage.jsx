import { Link } from "react-router-dom";
import perritos from "../assets/perritos.jpg";
import mascotas from "../assets/mascotas.svg";
import "../styles/inicio.css";

function HomePage() {
  return (
    <section className="inicio">
      <div className="inicio-texto">
        <p className="etiqueta">Refugio Huellas Sin Hogar</p>
        <h1>
          Encuentra una <span className="destacado">huella</span> que
          necesita un hogar.
        </h1>
        <p className="bajada">
          Conoce a los animales disponibles, postula para adoptar o súmate
          como voluntario del refugio.
        </p>

        <Link to="/adopcion" className="boton">
          Ver animales en adopción
        </Link>
      </div>

      <div className="inicio-foto">
        <img src={perritos} alt="Perros del refugio con una voluntaria" />
      </div>

      <div className="inicio-accesos">
        <article className="acceso">
          <span className="acceso-icono" aria-hidden="true">🚑</span>
          <div>
            <strong>Rescate e ingreso</strong>
            <small>Recibimos animales de la calle y de otros refugios.</small>
          </div>
        </article>

        <article className="acceso">
          <span className="acceso-icono" aria-hidden="true">🏡</span>
          <div>
            <strong>Adopción responsable</strong>
            <small>Evaluamos cada postulación con visitas previas.</small>
          </div>
        </article>

        <article className="acceso">
          <span className="acceso-icono" aria-hidden="true">🤝</span>
          <div>
            <strong>Voluntariado</strong>
            <small>Turnos para alimentar, pasear y acompañar.</small>
          </div>
        </article>
      </div>

      <div className="invitacion-voluntariado">
        <div>
          <h2>Hazles un espacio en tu semana</h2>
          <p>
            Súmate a los paseos y al cuidado diario de los animales mientras
            encuentran una familia.
          </p>

          <Link to="/voluntariado" className="boton invitacion-enlace">
            Quiero ser voluntario <span aria-hidden="true">→</span>
          </Link>
        </div>

        <img className="invitacion-mascotas" src={mascotas} alt="" />
      </div>
    </section>
  );
}

export default HomePage;