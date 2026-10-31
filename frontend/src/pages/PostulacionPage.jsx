import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Campo from "../components/ui/Campo.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import {
  enviarPostulacion,
  listarAnimalesEnAdopcion,
} from "../services/adopcionesService.js";
import {
  OPCIONES_VIVIENDA,
  postulacionFormSchema,
} from "../validations/postulacionValidation.js";
import "../styles/postulaciones.css";

const DIBUJOS = { PERRO: "🐶", GATO: "🐱", OTRO: "🐾" };

const POSTULACION_INICIAL = {
  nombrePostulante: "",
  rutPostulante: "",
  telefonoPostulante: "",
  emailPostulante: "",
  tipoVivienda: "",
  otrasMascotas: "",
  disponibilidadTiempo: "",
};

function Mensaje({ mensaje }) {
  if (!mensaje) return null;

  return <p className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</p>;
}

// Formulario publico: la persona interesada postula a un animal del catalogo.
function PostulacionPage() {
  const { animalId } = useParams();
  const [animal, setAnimal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // No hay una ruta para un solo animal: se busca dentro del catalogo publico.
  useEffect(() => {
    let vigente = true;

    listarAnimalesEnAdopcion()
      .then((respuesta) => {
        if (!vigente) return;

        const encontrado = respuesta.animales.find(
          (candidato) => String(candidato.id) === animalId,
        );

        if (encontrado) {
          setAnimal(encontrado);
        } else {
          setError("Este animal ya no está disponible para adopción.");
        }
      })
      .catch((errorCarga) => vigente && setError(errorCarga.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [animalId]);

  const formulario = useFormulario({
    iniciales: POSTULACION_INICIAL,
    esquema: postulacionFormSchema,
    enviar: (datos) =>
      enviarPostulacion({ ...datos, fichaAnimalId: Number(animalId) }),
    mensajeExito:
      "¡Postulación enviada! El equipo de adopciones la revisará y te contactará.",
  });

  const { valores, errores, cambiar } = formulario;

  if (cargando) {
    return (
      <section className="bloque">
        <p>Cargando...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bloque">
        <p className="mensaje mensaje-error">{error}</p>
        <Link to="/adopcion" className="volver-link">← Volver al catálogo</Link>
      </section>
    );
  }

  return (
    <section className="bloque">
      <Link to="/adopcion" className="volver-link">← Volver al catálogo</Link>

      <div className="postulacion-animal">
        <span className="postulacion-animal-dibujo" aria-hidden="true">
          {DIBUJOS[animal.especie]}
        </span>
        <div>
          <p className="etiqueta-pequena">Postulación para adoptar a</p>
          <h2>{animal.nombre || "Sin nombre"}</h2>
          <p className="texto-suave">Código {animal.codigoAnimal}</p>
        </div>
      </div>

      <form className="formulario" onSubmit={formulario.enviarFormulario} noValidate>
        <h2>Tus datos</h2>

        <div className="formulario-campos">
          <Campo
            etiqueta="Nombre completo"
            nombre="nombrePostulante"
            valor={valores.nombrePostulante}
            error={errores.nombrePostulante}
            maxLength={255}
            onChange={(evento) => cambiar("nombrePostulante", evento.target.value)}
          />

          <Campo
            etiqueta="RUT"
            nombre="rutPostulante"
            valor={valores.rutPostulante}
            error={errores.rutPostulante}
            placeholder="12345678-9"
            onChange={(evento) => cambiar("rutPostulante", evento.target.value)}
          />

          <Campo
            etiqueta="Teléfono"
            nombre="telefonoPostulante"
            type="tel"
            valor={valores.telefonoPostulante}
            error={errores.telefonoPostulante}
            placeholder="912345678"
            onChange={(evento) => cambiar("telefonoPostulante", evento.target.value)}
          />

          <Campo
            etiqueta="Correo"
            nombre="emailPostulante"
            type="email"
            valor={valores.emailPostulante}
            error={errores.emailPostulante}
            placeholder="Opcional"
            onChange={(evento) => cambiar("emailPostulante", evento.target.value)}
          />

          <Campo
            etiqueta="Tipo de vivienda"
            nombre="tipoVivienda"
            control="select"
            opciones={OPCIONES_VIVIENDA}
            valor={valores.tipoVivienda}
            error={errores.tipoVivienda}
            onChange={(evento) => cambiar("tipoVivienda", evento.target.value)}
          />

          <Campo
            etiqueta="Otras mascotas"
            nombre="otrasMascotas"
            valor={valores.otrasMascotas}
            error={errores.otrasMascotas}
            maxLength={255}
            placeholder="Opcional. Ej: un gato de 3 años"
            onChange={(evento) => cambiar("otrasMascotas", evento.target.value)}
          />

          <Campo
            etiqueta="Disponibilidad de tiempo"
            nombre="disponibilidadTiempo"
            control="textarea"
            ancho
            valor={valores.disponibilidadTiempo}
            error={errores.disponibilidadTiempo}
            maxLength={255}
            placeholder="¿Cuánto tiempo al día podrías dedicarle? ¿Trabajas fuera de casa?"
            onChange={(evento) => cambiar("disponibilidadTiempo", evento.target.value)}
          />
        </div>

        <button type="submit" className="boton">Enviar postulación</button>
        <Mensaje mensaje={formulario.mensaje} />
      </form>
    </section>
  );
}

export default PostulacionPage;