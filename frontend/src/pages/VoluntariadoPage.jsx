import { Link } from "react-router-dom";
import Campo from "../components/ui/Campo.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import { enviarPostulacionVoluntario } from "../services/postulacionVoluntarioService.js";
import {
  OPCIONES_DIAS,
  OPCIONES_HABILIDADES,
  postulacionVoluntarioFormSchema,
} from "../validations/postulacionVoluntarioValidation.js";
import "../styles/voluntariado.css";

const POSTULACION_INICIAL = {
  nombre: "",
  rut: "",
  email: "",
  telefono: "",
  diasDisponibles: [],
  motivacion: "",
  habilidades: [],
  otraHabilidad: "",
};

function Mensaje({ mensaje }) {
  if (!mensaje) return null;

  return <p className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</p>;
}

function Casillas({ titulo, opciones, elegidas, error, alCambiar }) {
  function alternar(valor) {
    const nuevas = elegidas.includes(valor)
      ? elegidas.filter((elegida) => elegida !== valor)
      : [...elegidas, valor];

    alCambiar(nuevas);
  }

  return (
    <fieldset className="casillas">
      <legend>{titulo}</legend>

      <div className="casillas-opciones">
        {opciones.map((opcion) => (
          <label key={opcion.valor} className="casilla">
            <input
              type="checkbox"
              checked={elegidas.includes(opcion.valor)}
              onChange={() => alternar(opcion.valor)}
            />
            {opcion.texto}
          </label>
        ))}
      </div>

      {error && <span className="campo-error">{error}</span>}
    </fieldset>
  );
}


function VoluntariadoPage() {
  const formulario = useFormulario({
    iniciales: POSTULACION_INICIAL,
    esquema: postulacionVoluntarioFormSchema,
    enviar: enviarPostulacionVoluntario,
    mensajeExito:
      "¡Postulación enviada! 🐾 La encargada de voluntariado la revisará y te contactará.",
  });

  const { valores, errores, cambiar } = formulario;

  return (
    <section className="bloque voluntariado">
      <Link to="/" className="volver-link">← Volver al inicio</Link>

      <h2>Quiero ser voluntario </h2>
      <p className="texto-suave">
        Cuéntanos quién eres, qué días puedes venir y en qué te gustaría ayudar.
      </p>

      <form className="formulario" onSubmit={formulario.enviarFormulario} noValidate>
        <h2>Tus datos</h2>

        <div className="formulario-campos">
          <Campo
            etiqueta="Nombre completo"
            nombre="nombre"
            valor={valores.nombre}
            error={errores.nombre}
            maxLength={255}
            onChange={(evento) => cambiar("nombre", evento.target.value)}
          />

          <Campo
            etiqueta="RUT"
            nombre="rut"
            valor={valores.rut}
            error={errores.rut}
            placeholder="12345678-9"
            onChange={(evento) => cambiar("rut", evento.target.value)}
          />

          <Campo
            etiqueta="Correo"
            nombre="email"
            type="email"
            valor={valores.email}
            error={errores.email}
            onChange={(evento) => cambiar("email", evento.target.value)}
          />

          <Campo
            etiqueta="Teléfono"
            nombre="telefono"
            type="tel"
            valor={valores.telefono}
            error={errores.telefono}
            placeholder="912345678"
            onChange={(evento) => cambiar("telefono", evento.target.value)}
          />

          <Casillas
            titulo="¿Qué días puedes venir?"
            opciones={OPCIONES_DIAS}
            elegidas={valores.diasDisponibles}
            error={errores.diasDisponibles}
            alCambiar={(dias) => cambiar("diasDisponibles", dias)}
          />

          <Casillas
            titulo="¿En qué te gustaría ayudar?"
            opciones={OPCIONES_HABILIDADES}
            elegidas={valores.habilidades}
            error={errores.habilidades}
            alCambiar={(habilidades) => cambiar("habilidades", habilidades)}
          />

          {valores.habilidades.includes("OTRA") && (
            <Campo
              etiqueta="¿Cuál otra habilidad?"
              nombre="otraHabilidad"
              ancho
              valor={valores.otraHabilidad}
              error={errores.otraHabilidad}
              maxLength={255}
              placeholder="Ej: fotografía, carpintería..."
              onChange={(evento) => cambiar("otraHabilidad", evento.target.value)}
            />
          )}

          <Campo
            etiqueta="¿Por qué quieres ser voluntario?"
            nombre="motivacion"
            control="textarea"
            ancho
            valor={valores.motivacion}
            error={errores.motivacion}
            maxLength={1000}
            onChange={(evento) => cambiar("motivacion", evento.target.value)}
          />
        </div>

        <button type="submit" className="boton">Enviar postulación</button>
        <Mensaje mensaje={formulario.mensaje} />
      </form>
    </section>
  );
}

export default VoluntariadoPage;
