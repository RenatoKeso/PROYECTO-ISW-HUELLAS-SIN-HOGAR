import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Campo from "../components/ui/Campo.jsx";
import {
  obtenerPostulacion,
  resolverPostulacion,
} from "../services/adopcionesService.js";
import { observacionResolucionSchema } from "../validations/postulacionValidation.js";
import {
  ESTADOS_POSTULACION,
  MOTIVOS_DEVOLUCION,
  TIPOS_VIVIENDA,
  formatearEdad,
  formatearFecha,
} from "../utils/formatoAdopcion.js";
import "../styles/postulaciones.css";

// Aviso de devoluciones anteriores del mismo RUT. Informa, pero no bloquea.
function AlertaAntecedentes({ antecedentes }) {
  if (!antecedentes?.tieneDevoluciones) return null;

  return (
    <div className="alerta-antecedentes" role="alert">
      <p className="alerta-titulo">
        ⚠ Este postulante registra{" "}
        {antecedentes.cantidad === 1
          ? "1 devolución anterior"
          : `${antecedentes.cantidad} devoluciones anteriores`}
      </p>

      <ul>
        {antecedentes.devoluciones.map((devolucion) => (
          <li key={devolucion.id}>
            <strong>{formatearFecha(devolucion.fechaDevolucion, { soloFecha: true })}</strong>
            {" · "}
            {devolucion.fichaAnimal.nombre || devolucion.fichaAnimal.codigoAnimal}
            {" · "}
            {MOTIVOS_DEVOLUCION[devolucion.motivo] ?? devolucion.motivo}
            {devolucion.detalle && <span className="texto-suave"> — {devolucion.detalle}</span>}
          </li>
        ))}
      </ul>

      <p className="alerta-nota">Esta información no bloquea la decisión.</p>
    </div>
  );
}

function Dato({ etiqueta, children }) {
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

function FormularioResolucion({ postulacionId, onResuelta }) {
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function resolver(decision) {
    setError("");

    const validacion = observacionResolucionSchema.safeParse(observaciones);

    if (!validacion.success) {
      setError(validacion.error.issues[0].message);
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await resolverPostulacion(postulacionId, {
        decision,
        ...(validacion.data ? { observaciones: validacion.data } : {}),
      });
      onResuelta(respuesta.postulacion);
    } catch (errorEnvio) {
      setError(errorEnvio.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="formulario">
      <h2>Decisión</h2>

      <Campo
        etiqueta="Observaciones"
        nombre="observaciones"
        control="textarea"
        valor={observaciones}
        maxLength={1000}
        placeholder="Opcional. Ej: cuenta con patio cerrado y experiencia previa."
        onChange={(evento) => setObservaciones(evento.target.value)}
      />

      <div className="acciones-resolucion">
        <button
          type="button"
          className="boton"
          disabled={enviando}
          onClick={() => resolver("APROBADA")}
        >
          Aprobar
        </button>
        <button
          type="button"
          className="boton boton-secundario"
          disabled={enviando}
          onClick={() => resolver("RECHAZADA")}
        >
          Rechazar
        </button>
      </div>

      {error && <p className="mensaje mensaje-error">{error}</p>}
    </div>
  );
}

// Detalle de una postulacion para la encargada de adopciones.
function PostulacionDetallePage() {
  const { id } = useParams();
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    obtenerPostulacion(id)
      .then((respuesta) => vigente && setDetalle(respuesta))
      .catch((errorCarga) => vigente && setError(errorCarga.message));

    return () => {
      vigente = false;
    };
  }, [id]);

  // La respuesta de la resolucion trae la postulacion actualizada; los
  // antecedentes no cambian, asi que se conservan.
  function actualizarPostulacion(postulacion) {
    setDetalle((actual) => ({ ...actual, postulacion }));
  }

  if (error) {
    return (
      <section className="bloque">
        <Link to="/postulaciones" className="volver-link">← Volver a postulaciones</Link>
        <p className="mensaje mensaje-error">{error}</p>
      </section>
    );
  }

  if (!detalle) {
    return (
      <section className="bloque">
        <p>Cargando postulación...</p>
      </section>
    );
  }

  const { postulacion, antecedentes } = detalle;
  const animal = postulacion.fichaAnimal;

  return (
    <section className="bloque">
      <Link to="/postulaciones" className="volver-link">← Volver a postulaciones</Link>

      <div className="detalle-encabezado">
        <h2>Postulación N° {postulacion.id}</h2>
        <span className={`estado-chip estado-${postulacion.estado}`}>
          {ESTADOS_POSTULACION[postulacion.estado]}
        </span>
      </div>

      <AlertaAntecedentes antecedentes={antecedentes} />

      <div className="detalle-columnas">
        <div className="tarjeta">
          <h3>Postulante</h3>
          <dl className="datos">
            <Dato etiqueta="Nombre">{postulacion.nombrePostulante}</Dato>
            <Dato etiqueta="RUT">{postulacion.rutPostulante}</Dato>
            <Dato etiqueta="Teléfono">{postulacion.telefonoPostulante}</Dato>
            <Dato etiqueta="Correo">{postulacion.emailPostulante}</Dato>
            <Dato etiqueta="Vivienda">{TIPOS_VIVIENDA[postulacion.tipoVivienda]}</Dato>
            <Dato etiqueta="Otras mascotas">{postulacion.otrasMascotas}</Dato>
            <Dato etiqueta="Disponibilidad">{postulacion.disponibilidadTiempo}</Dato>
            <Dato etiqueta="Recibida">{formatearFecha(postulacion.createdAt)}</Dato>
          </dl>
        </div>

        <div className="tarjeta">
          <h3>Animal</h3>
          <dl className="datos">
            <Dato etiqueta="Nombre">{animal.nombre || "Sin nombre"}</Dato>
            <Dato etiqueta="Código">{animal.codigoAnimal}</Dato>
            <Dato etiqueta="Raza">{animal.raza}</Dato>
            <Dato etiqueta="Edad">{formatearEdad(animal.edad)}</Dato>
          </dl>
        </div>
      </div>

      {postulacion.estado === "EN_REVISION" ? (
        <FormularioResolucion
          postulacionId={postulacion.id}
          onResuelta={actualizarPostulacion}
        />
      ) : (
        <div className="tarjeta">
          <h3>Resolución</h3>
          <dl className="datos">
            <Dato etiqueta="Decisión">{ESTADOS_POSTULACION[postulacion.estado]}</Dato>
            <Dato etiqueta="Fecha">{formatearFecha(postulacion.fechaResolucion)}</Dato>
            <Dato etiqueta="Revisor">{postulacion.revisor?.nombre}</Dato>
            <Dato etiqueta="Observaciones">{postulacion.observaciones}</Dato>
          </dl>
        </div>
      )}
    </section>
  );
}

export default PostulacionDetallePage;