import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Campo from "../components/ui/Campo.jsx";
import Mensaje from "../components/ui/Mensaje.jsx";
import TarjetaTurno from "../components/turnos/TarjetaTurno.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import { listarTurnosDisponibles, listarTurnosGestion, publicarTurno } from "../services/turnosService.js";
import { inscribirseEnTurno, listarMisInscripciones } from "../services/inscripcionesService.js";
import { turnoFormSchema, CUPO_MAXIMO_TURNO } from "../validations/turnoValidation.js";
import { puedeGestionarInscripciones, puedeGestionarTurnos } from "../utils/permisosUsuario.js";
import "../styles/voluntariado.css";

const TURNO_INICIAL = {
  titulo: "",
  descripcion: "",
  fecha: "",
  horaInicio: "",
  horaTermino: "",
  fechaLimiteInscripcion: "",
  cupoMaximo: "",
};

// Formulario de la encargada para publicar un turno.
function FormularioTurno({ alPublicar }) {
  const formulario = useFormulario({
    iniciales: TURNO_INICIAL,
    esquema: turnoFormSchema,
    enviar: async (datos) => {
      const respuesta = await publicarTurno(datos);
      alPublicar();
      return respuesta;
    },
    mensajeExito: "Turno publicado. Los voluntarios ya pueden inscribirse.",
  });

  const { valores, errores, cambiar } = formulario;

  return (
    <form className="formulario" onSubmit={formulario.enviarFormulario} noValidate>
      <h2>Publicar un turno</h2>

      <div className="formulario-campos">
        <Campo
          etiqueta="Título"
          nombre="titulo"
          ancho
          valor={valores.titulo}
          error={errores.titulo}
          maxLength={120}
          placeholder="Ej: Paseo de perros"
          onChange={(evento) => cambiar("titulo", evento.target.value)}
        />

        <Campo
          etiqueta="Fecha del turno"
          nombre="fecha"
          type="date"
          valor={valores.fecha}
          error={errores.fecha}
          onChange={(evento) => cambiar("fecha", evento.target.value)}
        />

        <Campo
          etiqueta="Cupo máximo"
          nombre="cupoMaximo"
          type="number"
          min={1}
          max={CUPO_MAXIMO_TURNO}
          valor={valores.cupoMaximo}
          error={errores.cupoMaximo}
          onChange={(evento) => cambiar("cupoMaximo", evento.target.value)}
        />

        <Campo
          etiqueta="Hora de inicio"
          nombre="horaInicio"
          type="time"
          valor={valores.horaInicio}
          error={errores.horaInicio}
          onChange={(evento) => cambiar("horaInicio", evento.target.value)}
        />

        <Campo
          etiqueta="Hora de término"
          nombre="horaTermino"
          type="time"
          valor={valores.horaTermino}
          error={errores.horaTermino}
          onChange={(evento) => cambiar("horaTermino", evento.target.value)}
        />

        <Campo
          etiqueta="Inscripciones hasta el"
          nombre="fechaLimiteInscripcion"
          type="date"
          valor={valores.fechaLimiteInscripcion}
          error={errores.fechaLimiteInscripcion}
          onChange={(evento) => cambiar("fechaLimiteInscripcion", evento.target.value)}
        />

        <Campo
          etiqueta="Descripción (opcional)"
          nombre="descripcion"
          control="textarea"
          ancho
          valor={valores.descripcion}
          error={errores.descripcion}
          maxLength={1000}
          placeholder="Qué se hará en el turno, qué llevar, dónde llegar..."
          onChange={(evento) => cambiar("descripcion", evento.target.value)}
        />
      </div>

      <button type="submit" className="boton">Publicar turno</button>
      <Mensaje mensaje={formulario.mensaje} />
    </form>
  );
}

function TurnosPage({ usuario }) {
  const gestiona = puedeGestionarTurnos(usuario);
  const seInscribe = puedeGestionarInscripciones(usuario);

  const [turnos, setTurnos] = useState([]);
  const [turnosInscritos, setTurnosInscritos] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [inscribiendo, setInscribiendo] = useState(null);
  const [recargar, setRecargar] = useState(0);

  useEffect(() => {
    let vigente = true;

    const cargarTurnos = gestiona ? listarTurnosGestion() : listarTurnosDisponibles();
    const cargarMias = seInscribe ? listarMisInscripciones("ACTIVA") : Promise.resolve(null);

    Promise.all([cargarTurnos, cargarMias])
      .then(([respuestaTurnos, respuestaMias]) => {
        if (!vigente) return;
        setTurnos(respuestaTurnos.turnos);
        setTurnosInscritos(
          new Set((respuestaMias?.inscripciones ?? []).map((inscripcion) => inscripcion.turnoId)),
        );
      })
      .catch((errorCarga) => vigente && setError(errorCarga.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [gestiona, seInscribe, recargar]);

  function refrescar() {
    setRecargar((valor) => valor + 1);
  }

  async function inscribirse(turno) {
    setInscribiendo(turno.id);
    setMensaje(null);

    try {
      const respuesta = await inscribirseEnTurno(turno.id);
      setMensaje({ tipo: "exito", texto: `${respuesta.message}: ${turno.titulo}.` });
      refrescar();
    } catch (errorInscripcion) {
      setMensaje({ tipo: "error", texto: errorInscripcion.message });
    } finally {
      setInscribiendo(null);
    }
  }

  function accionesDe(turno) {
    if (!seInscribe) return null;

    if (turnosInscritos.has(turno.id)) {
      return (
        <>
          <span className="texto-suave">Ya estás inscrito en este turno.</span>
          <Link to="/turnos/mis-inscripciones" className="boton-mini">Ver mis inscripciones</Link>
        </>
      );
    }

    return (
      <button
        type="button"
        className="boton"
        disabled={!turno.inscripcionAbierta || inscribiendo === turno.id}
        onClick={() => inscribirse(turno)}
      >
        {inscribiendo === turno.id ? "Inscribiendo..." : "Inscribirme"}
      </button>
    );
  }

  return (
    <section className="bloque voluntariado">
      <h2>Turnos de voluntariado</h2>
      <p className="texto-suave">
        {gestiona
          ? "Publica los turnos del refugio y revisa cuántos voluntarios hay inscritos en cada uno."
          : "Elige un turno con cupos e inscríbete. Puedes cambiarlo o cancelarlo desde tus inscripciones."}
      </p>

      {gestiona && <FormularioTurno alPublicar={refrescar} />}

      {seInscribe && (
        <p>
          <Link to="/turnos/mis-inscripciones" className="volver-link">Mis inscripciones →</Link>
        </p>
      )}

      <Mensaje mensaje={mensaje} />
      {error && <p className="mensaje mensaje-error">{error}</p>}

      {cargando ? (
        <p>Cargando turnos...</p>
      ) : turnos.length === 0 ? (
        <div className="sin-postulaciones">
          <span aria-hidden="true">🐾</span>
          <h3>No hay turnos publicados</h3>
          <p>
            {gestiona
              ? "Publica el primer turno con el formulario de arriba."
              : "Cuando la encargada publique un turno, aparecerá aquí."}
          </p>
        </div>
      ) : (
        <div className="lista-postulaciones">
          {turnos.map((turno) => (
            <TarjetaTurno key={turno.id} turno={turno} acciones={accionesDe(turno)} />
          ))}
        </div>
      )}
    </section>
  );
}

export default TurnosPage;
