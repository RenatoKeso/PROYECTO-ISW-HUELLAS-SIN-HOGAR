import { useEffect, useState } from "react";
import {
  listarPostulacionesVoluntario,
  revisarPostulacionVoluntario,
} from "../services/postulacionVoluntarioService.js";
import {
  OPCIONES_DIAS,
  OPCIONES_HABILIDADES,
} from "../validations/postulacionVoluntarioValidation.js";
import "../styles/voluntariado.css";

const PESTANAS = [
  { valor: "EN_REVISION", texto: "En revisión" },
  { valor: "ACEPTADA", texto: "Aceptadas" },
  { valor: "RECHAZADA", texto: "Rechazadas" },
  { valor: "", texto: "Todas" },
];

const NOMBRES_ESTADO = {
  EN_REVISION: " En revisión",
  ACEPTADA: " Aceptada",
  RECHAZADA: " Rechazada",
};

function textoDe(opciones, valor) {
  return opciones.find((opcion) => opcion.valor === valor)?.texto ?? valor;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function TarjetaPostulacion({ postulacion, alRevisar }) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function revisar(decision) {
    if (decision === "RECHAZADA" && !motivo.trim()) {
      setError("Para rechazar tienes que escribir el motivo");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      await alRevisar(postulacion.id, {
        decision,
        ...(decision === "RECHAZADA" ? { motivoRechazo: motivo.trim() } : {}),
      });
    } catch (errorRevision) {
      setError(errorRevision.message);
      setGuardando(false);
    }
  }

  return (
    <article className="postulacion-voluntario">
      <div className="postulacion-voluntario-cabecera">
        <div>
          <h3>{postulacion.nombre}</h3>
          <p className="texto-suave">
            RUT {postulacion.rut} · {postulacion.email} · {postulacion.telefono}
          </p>
        </div>
        <span className={`estado-postulacion estado-${postulacion.estado.toLowerCase()}`}>
          {NOMBRES_ESTADO[postulacion.estado]}
        </span>
      </div>

      <p className="etiqueta-dato">Días disponibles</p>
      <div className="chips">
        {postulacion.diasDisponibles.map((dia) => (
          <span key={dia} className="chip">{textoDe(OPCIONES_DIAS, dia)}</span>
        ))}
      </div>

      <p className="etiqueta-dato">Puede ayudar en</p>
      <div className="chips">
        {postulacion.habilidades.map((habilidad) => (
          <span key={habilidad} className="chip">
            {habilidad === "OTRA" && postulacion.otraHabilidad
              ? `${postulacion.otraHabilidad}`
              : textoDe(OPCIONES_HABILIDADES, habilidad)}
          </span>
        ))}
      </div>

      <p className="motivacion">"{postulacion.motivacion}"</p>
      <p className="texto-suave">Postuló el {formatearFecha(postulacion.createdAt)}</p>

      {postulacion.estado === "EN_REVISION" ? (
        <div className="acciones-revision">
          {rechazando && (
            <textarea
              className="motivo-rechazo"
              value={motivo}
              maxLength={1000}
              placeholder="Escribe el motivo del rechazo"
              onChange={(evento) => setMotivo(evento.target.value)}
            />
          )}

          <div className="botones-revision">
            {!rechazando && (
              <button
                type="button"
                className="boton"
                disabled={guardando}
                onClick={() => revisar("ACEPTADA")}
              >
                Aceptar
              </button>
            )}
            <button
              type="button"
              className="boton boton-secundario"
              disabled={guardando}
              onClick={() => (rechazando ? revisar("RECHAZADA") : setRechazando(true))}
            >
              {rechazando ? "Confirmar rechazo" : "Rechazar"}
            </button>
            {rechazando && (
              <button type="button" className="boton-mini" onClick={() => setRechazando(false)}>
                Cancelar
              </button>
            )}
          </div>

          {error && <p className="campo-error">{error}</p>}
        </div>
      ) : (
        <p className="resultado-revision">
          Revisada por <strong>{postulacion.revisadaPor?.nombre ?? "—"}</strong> el{" "}
          {formatearFecha(postulacion.fechaRevision)}
          {postulacion.motivoRechazo && <> · Motivo: {postulacion.motivoRechazo}</>}
        </p>
      )}
    </article>
  );
}

function PostulacionesVoluntarioPage() {
  const [estado, setEstado] = useState("EN_REVISION");
  const [postulaciones, setPostulaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [recargar, setRecargar] = useState(0);

  useEffect(() => {
    let vigente = true;

    listarPostulacionesVoluntario(estado)
      .then((respuesta) => vigente && setPostulaciones(respuesta.postulaciones))
      .catch((errorCarga) => vigente && setError(errorCarga.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [estado, recargar]);

  function cambiarPestana(valor) {
    setCargando(true);
    setError("");
    setMensaje("");
    setEstado(valor);
  }

  async function revisar(id, datos) {
    const respuesta = await revisarPostulacionVoluntario(id, datos);
    setMensaje(respuesta.message);
    setRecargar((valor) => valor + 1);
  }

  return (
    <section className="bloque voluntariado">
      <h2>Postulaciones de voluntarios </h2>
      <p className="texto-suave">
        Revisa quién quiere sumarse al refugio. Al aceptar, la persona queda como voluntaria.
      </p>

      <div className="pestanas-voluntariado">
        {PESTANAS.map((pestana) => (
          <button
            key={pestana.valor}
            type="button"
            className={estado === pestana.valor ? "pestana-voluntariado activa" : "pestana-voluntariado"}
            onClick={() => cambiarPestana(pestana.valor)}
          >
            {pestana.texto}
          </button>
        ))}
      </div>

      {mensaje && <p className="mensaje mensaje-exito">{mensaje}</p>}
      {error && <p className="mensaje mensaje-error">{error}</p>}

      {cargando ? (
        <p>Cargando...</p>
      ) : postulaciones.length === 0 ? (
        <div className="sin-postulaciones">
          <span aria-hidden="true"></span>
          <h3>No hay postulaciones aquí</h3>
          <p>Cuando alguien postule desde la página de inicio, aparecerá en esta lista.</p>
        </div>
      ) : (
        <div className="lista-postulaciones">
          {postulaciones.map((postulacion) => (
            <TarjetaPostulacion key={postulacion.id} postulacion={postulacion} alRevisar={revisar} />
          ))}
        </div>
      )}
    </section>
  );
}

export default PostulacionesVoluntarioPage;
