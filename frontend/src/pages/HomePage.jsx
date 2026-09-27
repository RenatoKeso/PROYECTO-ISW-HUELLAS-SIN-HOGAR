import { Link } from "react-router-dom";

function HomePage() {
  return (
    <>
      <section className="portada">
        <h1>Huellas Sin Hogar</h1>
        <p className="bajada">
          Refugio de animales dedicado al rescate, cuidado y adopcion
          responsable de perros y gatos.
        </p>
      </section>

      <section className="bloque">
        <h2>Quienes somos</h2>
        <p>
          Huellas Sin Hogar es una organizacion sin fines de lucro que acoge
          animales en situacion de abandono. El refugio se sostiene con el
          trabajo de voluntarios y con el apoyo de la comunidad.
        </p>
        <p>
          Cada animal que ingresa recibe atencion veterinaria, cuidados diarios
          y acompanamiento hasta encontrar un hogar definitivo.
        </p>
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
              alimentan, pasean y acompanan a los animales.
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

        <Link to="/fichas/nueva" className="boton">
          Crear ficha de un animal
        </Link>
      </section>
    </>
  );
}

export default HomePage;
