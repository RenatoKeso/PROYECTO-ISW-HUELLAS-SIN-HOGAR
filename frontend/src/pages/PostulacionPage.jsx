import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Campo from "../components/ui/Campo.jsx";
import Mensaje from "../components/ui/Mensaje.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import {
  enviarPostulacion,
  listarAnimalesEnAdopcion,
} from "../services/adopcionesService.js";
import {
  OPCIONES_SI_NO,
  OPCIONES_TENENCIA,
  OPCIONES_VIVIENDA,
  postulacionFormSchema,
} from "../validations/postulacionValidation.js";
import { hoyLocal } from "../utils/formatoAdopcion.js";
import { urlImagen } from "../utils/urlImagen.js";
import "../styles/postulaciones.css";

const DIBUJOS = { PERRO: "🐶", GATO: "🐱", OTRO: "🐾" };

// Todos parten vacios ("") porque asi los entregan los inputs. La casilla de
// los seguimientos es la excepcion: parte en false (sin marcar).
const POSTULACION_INICIAL = {
  nombrePostulante: "",
  rutPostulante: "",
  fechaNacimientoPostulante: "",
  telefonoPostulante: "",
  emailPostulante: "",
  direccionPostulante: "",
  comunaPostulante: "",
  tipoVivienda: "",
  tenenciaVivienda: "",
  permiteMascotasArriendo: "",
  tienePatio: "",
  personasHogar: "",
  hayNinos: "",
  otrasMascotas: "",
  horasSoloAlDia: "",
  disponibilidadTiempo: "",
  motivoAdopcion: "",
  aceptaSeguimiento: false,
};

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
        {/* Si la ficha tiene imagen se muestra; si no, el dibujo de la especie. */}
        {animal.imagenUrl ? (
          <img
            className="postulacion-animal-dibujo"
            src={urlImagen(animal.imagenUrl)}
            alt={`Foto de ${animal.nombre || animal.codigoAnimal}`}
          />
        ) : (
          <span className="postulacion-animal-dibujo" aria-hidden="true">
            {DIBUJOS[animal.especie]}
          </span>
        )}
        <div>
          <p className="etiqueta-pequena">Postulación para adoptar a</p>
          <h2>{animal.nombre || "Sin nombre"}</h2>
          <p className="texto-suave">Código {animal.codigoAnimal}</p>
        </div>
      </div>

      <form
        className="formulario formulario-postulacion"
        onSubmit={formulario.enviarFormulario}
        noValidate
      >
        <h2>Tus datos</h2>

        <div className="formulario-campos">
          <Campo
            etiqueta="Nombre completo"
            nombre="nombrePostulante"
            valor={valores.nombrePostulante}
            error={errores.nombrePostulante}
            maxLength={255}
            placeholder="Nombre y apellido"
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
            etiqueta="Fecha de nacimiento"
            nombre="fechaNacimientoPostulante"
            type="date"
            max={hoyLocal()}
            valor={valores.fechaNacimientoPostulante}
            error={errores.fechaNacimientoPostulante}
            onChange={(evento) => cambiar("fechaNacimientoPostulante", evento.target.value)}
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
            placeholder="nombre@correo.cl"
            onChange={(evento) => cambiar("emailPostulante", evento.target.value)}
          />

          <Campo
            etiqueta="Dirección"
            nombre="direccionPostulante"
            valor={valores.direccionPostulante}
            error={errores.direccionPostulante}
            maxLength={255}
            placeholder="Calle, número, depto."
            onChange={(evento) => cambiar("direccionPostulante", evento.target.value)}
          />

          <Campo
            etiqueta="Comuna"
            nombre="comunaPostulante"
            valor={valores.comunaPostulante}
            error={errores.comunaPostulante}
            maxLength={255}
            placeholder="Ej: Chillán"
            onChange={(evento) => cambiar("comunaPostulante", evento.target.value)}
          />
        </div>

        <h2>Tu hogar</h2>

        <div className="formulario-campos">
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
            etiqueta="La vivienda es"
            nombre="tenenciaVivienda"
            control="select"
            opciones={OPCIONES_TENENCIA}
            valor={valores.tenenciaVivienda}
            error={errores.tenenciaVivienda}
            onChange={(evento) => cambiar("tenenciaVivienda", evento.target.value)}
          />

          {/* Solo se pregunta si arrienda. */}
          {valores.tenenciaVivienda === "ARRENDADA" && (
            <Campo
              etiqueta="¿El arriendo permite mascotas?"
              nombre="permiteMascotasArriendo"
              control="select"
              opciones={OPCIONES_SI_NO}
              valor={valores.permiteMascotasArriendo}
              error={errores.permiteMascotasArriendo}
              onChange={(evento) => cambiar("permiteMascotasArriendo", evento.target.value)}
            />
          )}

          <Campo
            etiqueta="¿Tiene patio?"
            nombre="tienePatio"
            control="select"
            opciones={OPCIONES_SI_NO}
            valor={valores.tienePatio}
            error={errores.tienePatio}
            onChange={(evento) => cambiar("tienePatio", evento.target.value)}
          />

          <Campo
            etiqueta="Personas en el hogar"
            nombre="personasHogar"
            type="number"
            min={1}
            max={20}
            valor={valores.personasHogar}
            error={errores.personasHogar}
            onChange={(evento) => cambiar("personasHogar", evento.target.value)}
          />

          <Campo
            etiqueta="¿Hay niños en el hogar?"
            nombre="hayNinos"
            control="select"
            opciones={OPCIONES_SI_NO}
            valor={valores.hayNinos}
            error={errores.hayNinos}
            onChange={(evento) => cambiar("hayNinos", evento.target.value)}
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
        </div>

        <h2>Tiempo y compromiso</h2>

        <div className="formulario-campos">
          <Campo
            etiqueta="Horas al día que estaría solo"
            nombre="horasSoloAlDia"
            type="number"
            min={0}
            max={24}
            valor={valores.horasSoloAlDia}
            error={errores.horasSoloAlDia}
            onChange={(evento) => cambiar("horasSoloAlDia", evento.target.value)}
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

          <Campo
            etiqueta="¿Por qué quieres adoptar?"
            nombre="motivoAdopcion"
            control="textarea"
            ancho
            valor={valores.motivoAdopcion}
            error={errores.motivoAdopcion}
            maxLength={1000}
            placeholder="Cuéntanos por qué quieres adoptar y cómo sería su vida contigo."
            onChange={(evento) => cambiar("motivoAdopcion", evento.target.value)}
          />

          {/* Campo.jsx no maneja casillas (usa value y no checked), por eso va aparte. */}
          <div className="campo campo-ancho">
            <label className="campo-check">
              <input
                type="checkbox"
                name="aceptaSeguimiento"
                checked={valores.aceptaSeguimiento}
                aria-invalid={Boolean(errores.aceptaSeguimiento)}
                onChange={(evento) => cambiar("aceptaSeguimiento", evento.target.checked)}
              />
              Acepto que el refugio haga seguimientos a los 15 y 30 días de la adopción.
            </label>
            {errores.aceptaSeguimiento && (
              <span className="campo-error">{errores.aceptaSeguimiento}</span>
            )}
          </div>
        </div>

        <button type="submit" className="boton">Enviar postulación</button>
        <Mensaje mensaje={formulario.mensaje} />
      </form>
    </section>
  );
}

export default PostulacionPage;
