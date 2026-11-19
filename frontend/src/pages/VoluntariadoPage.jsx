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
  email: "",
  telefono: "",
  diasDisponibles: [],
  motivacion: "",
  habilidades: [],
  otraHabilidad: "",
  curriculumNombre: "",
  curriculumBase64: "",
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

  function elegirCurriculum(evento) {
    const archivo = evento.target.files[0];

    if (!archivo) {
      cambiar("curriculumNombre", "");
      cambiar("curriculumBase64", "");
      return;
    }

    if (archivo.type !== "application/pdf") {
      alert("El currículum debe ser un archivo PDF");
      evento.target.value = "";
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      alert("El currículum puede pesar máximo 2 MB");
      evento.target.value = "";
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const base64 = lector.result.split(",")[1];
      cambiar("curriculumNombre", archivo.name);
      cambiar("curriculumBase64", base64);
    };
    lector.readAsDataURL(archivo);
  }

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
          <div className="campo campo-ancho">
            <span>Currículum en PDF (opcional, máximo 2 MB)</span>
            <label className="subir-cv">
              <input type="file" accept="application/pdf" onChange={elegirCurriculum} hidden />
              {valores.curriculumNombre ? `✅ ${valores.curriculumNombre}` : "Elegir archivo"}
            </label>
            {errores.curriculumBase64 && <span className="campo-error">{errores.curriculumBase64}</span>}
          </div>
        </div>

        <button type="submit" className="boton">Enviar postulación</button>
        <Mensaje mensaje={formulario.mensaje} />
      </form>
    </section>
  );
}

export default VoluntariadoPage;
