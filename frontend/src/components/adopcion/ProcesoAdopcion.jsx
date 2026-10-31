import { useState } from "react";
import Campo from "../ui/Campo.jsx";
import { useFormulario } from "../../hooks/useFormulario.js";
import {
  formalizarEntrega,
  omitirVisitaHogar,
  registrarVisita,
} from "../../services/adopcionesService.js";
import {
  entregaFormSchema,
  omisionFormSchema,
  visitaFormSchema,
} from "../../validations/postulacionValidation.js";
import {
  MOTIVOS_OMISION,
  RESULTADOS_VISITA,
  formatearFecha,
  hoyLocal,
  opcionesDe,
} from "../../utils/formatoAdopcion.js";

function Mensaje({ mensaje }) {
  if (!mensaje) return null;

  return <p className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</p>;
}

function Dato({ etiqueta, children }) {
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

// Un paso del proceso: numero (o ✓ si esta listo), titulo y contenido.
function Paso({ numero, titulo, estado, children }) {
  return (
    <section className={`paso paso-${estado}`}>
      <div className="paso-numero" aria-hidden="true">
        {estado === "listo" ? "✓" : numero}
      </div>
      <div className="paso-cuerpo">
        <h3>{titulo}</h3>
        {children}
      </div>
    </section>
  );
}

function VisitaRegistrada({ visita }) {
  return (
    <dl className="datos">
      <Dato etiqueta="Fecha">{formatearFecha(visita.fechaVisita, { soloFecha: true })}</Dato>
      <Dato etiqueta="Resultado">
        <span className={`resultado resultado-${visita.resultado}`}>
          {RESULTADOS_VISITA[visita.resultado]}
        </span>
      </Dato>
      <Dato etiqueta="Observaciones">{visita.observaciones}</Dato>
      <Dato etiqueta="Registrada por">{visita.registradaPor?.nombre}</Dato>
    </dl>
  );
}

function FormularioVisita({ postulacionId, tipo, onActualizada }) {
  const formulario = useFormulario({
    iniciales: { fechaVisita: hoyLocal(), resultado: "", observaciones: "" },
    esquema: visitaFormSchema,
    enviar: async (datos) => {
      const respuesta = await registrarVisita(postulacionId, { ...datos, tipo });
      onActualizada();
      return respuesta;
    },
  });
  const { valores, errores, cambiar } = formulario;

  return (
    <form className="formulario-paso" onSubmit={formulario.enviarFormulario} noValidate>
      <div className="formulario-campos">
        <Campo
          etiqueta="Fecha de la visita"
          nombre={`fechaVisita-${tipo}`}
          type="date"
          max={hoyLocal()}
          valor={valores.fechaVisita}
          error={errores.fechaVisita}
          onChange={(evento) => cambiar("fechaVisita", evento.target.value)}
        />
        <Campo
          etiqueta="Resultado"
          nombre={`resultado-${tipo}`}
          control="select"
          opciones={opcionesDe(RESULTADOS_VISITA)}
          valor={valores.resultado}
          error={errores.resultado}
          onChange={(evento) => cambiar("resultado", evento.target.value)}
        />
        <Campo
          etiqueta="Observaciones"
          nombre={`observaciones-${tipo}`}
          control="textarea"
          ancho
          maxLength={1000}
          placeholder="Opcional"
          valor={valores.observaciones}
          error={errores.observaciones}
          onChange={(evento) => cambiar("observaciones", evento.target.value)}
        />
      </div>
      <button type="submit" className="boton">Registrar visita</button>
      <Mensaje mensaje={formulario.mensaje} />
    </form>
  );
}

function FormularioOmision({ postulacionId, onActualizada }) {
  const formulario = useFormulario({
    iniciales: { motivo: "", observacion: "" },
    esquema: omisionFormSchema,
    enviar: async (datos) => {
      const respuesta = await omitirVisitaHogar(postulacionId, datos);
      onActualizada();
      return respuesta;
    },
  });
  const { valores, errores, cambiar } = formulario;

  return (
    <form className="formulario-paso" onSubmit={formulario.enviarFormulario} noValidate>
      <div className="formulario-campos">
        <Campo
          etiqueta="Motivo"
          nombre="motivoOmision"
          control="select"
          opciones={opcionesDe(MOTIVOS_OMISION)}
          valor={valores.motivo}
          error={errores.motivo}
          onChange={(evento) => cambiar("motivo", evento.target.value)}
        />
        <Campo
          etiqueta="Observación"
          nombre="observacionOmision"
          control="textarea"
          ancho
          maxLength={1000}
          placeholder={valores.motivo === "OTRO" ? "Explica el motivo" : "Opcional"}
          valor={valores.observacion}
          error={errores.observacion}
          onChange={(evento) => cambiar("observacion", evento.target.value)}
        />
      </div>
      <p className="nota">Quedará registrado que tú autorizaste la omisión.</p>
      <button type="submit" className="boton">Omitir visita al hogar</button>
      <Mensaje mensaje={formulario.mensaje} />
    </form>
  );
}

function FormularioEntrega({ postulacionId, onActualizada }) {
  const formulario = useFormulario({
    iniciales: { fechaEntrega: hoyLocal(), documentacionEntregada: "" },
    esquema: entregaFormSchema,
    enviar: async (datos) => {
      const respuesta = await formalizarEntrega(postulacionId, datos);
      onActualizada();
      return respuesta;
    },
  });
  const { valores, errores, cambiar } = formulario;

  return (
    <form className="formulario-paso" onSubmit={formulario.enviarFormulario} noValidate>
      <div className="formulario-campos">
        <Campo
          etiqueta="Fecha de entrega"
          nombre="fechaEntrega"
          type="date"
          max={hoyLocal()}
          valor={valores.fechaEntrega}
          error={errores.fechaEntrega}
          onChange={(evento) => cambiar("fechaEntrega", evento.target.value)}
        />
        <Campo
          etiqueta="Documentación entregada"
          nombre="documentacionEntregada"
          control="textarea"
          ancho
          maxLength={1000}
          placeholder="Ej: contrato de adopción firmado, carnet de vacunas"
          valor={valores.documentacionEntregada}
          error={errores.documentacionEntregada}
          onChange={(evento) => cambiar("documentacionEntregada", evento.target.value)}
        />
      </div>
      <p className="nota">
        Al confirmar, el animal queda adoptado y sale del catálogo, las demás
        postulaciones abiertas se cierran y se programan seguimientos a los 15 y 30 días.
      </p>
      <button type="submit" className="boton">Confirmar entrega</button>
      <Mensaje mensaje={formulario.mensaje} />
    </form>
  );
}

function SeccionVisitaHogar({ postulacion, editable, primeraFavorable, onActualizada }) {
  const [modo, setModo] = useState("visita");
  const hogar = postulacion.visitas.find((visita) => visita.tipo === "VISITA_HOGAR");

  if (hogar) return <VisitaRegistrada visita={hogar} />;

  if (postulacion.motivoOmisionVisitaHogar) {
    return (
      <dl className="datos">
        <Dato etiqueta="Omitida">{MOTIVOS_OMISION[postulacion.motivoOmisionVisitaHogar]}</Dato>
        <Dato etiqueta="Observación">{postulacion.observacionOmisionVisitaHogar}</Dato>
        <Dato etiqueta="Autorizada por">{postulacion.omisionAutorizadaPor?.nombre}</Dato>
        <Dato etiqueta="Fecha">{formatearFecha(postulacion.fechaOmisionVisitaHogar)}</Dato>
      </dl>
    );
  }

  if (!editable) return <p className="texto-suave">No se registró.</p>;

  if (!primeraFavorable) {
    return <p className="texto-suave">Disponible después de una primera visita favorable.</p>;
  }

  return (
    <>
      <div className="selector-modo" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={modo === "visita"}
          className={modo === "visita" ? "pestana-estado activa" : "pestana-estado"}
          onClick={() => setModo("visita")}
        >
          Registrar visita
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === "omitir"}
          className={modo === "omitir" ? "pestana-estado activa" : "pestana-estado"}
          onClick={() => setModo("omitir")}
        >
          Omitir visita
        </button>
      </div>

      {modo === "visita" ? (
        <FormularioVisita
          postulacionId={postulacion.id}
          tipo="VISITA_HOGAR"
          onActualizada={onActualizada}
        />
      ) : (
        <FormularioOmision postulacionId={postulacion.id} onActualizada={onActualizada} />
      )}
    </>
  );
}

function SeccionEntrega({ postulacion, puedeEntregar, onActualizada }) {
  if (postulacion.estado === "ENTREGADA") {
    return (
      <>
        <dl className="datos">
          <Dato etiqueta="Fecha">{formatearFecha(postulacion.fechaEntrega, { soloFecha: true })}</Dato>
          <Dato etiqueta="Adoptante">{postulacion.nombrePostulante}</Dato>
          <Dato etiqueta="Documentación">{postulacion.documentacionEntregada}</Dato>
        </dl>

        <h4 className="subtitulo">Seguimientos programados</h4>
        <ul className="lista-seguimientos">
          {postulacion.seguimientos.map((seguimiento) => (
            <li key={seguimiento.id}>
              <strong>{formatearFecha(seguimiento.fechaProgramada, { soloFecha: true })}</strong>
              {" · "}a los {seguimiento.diasDesdeEntrega} días
              <span className={`estado-chip seguimiento-${seguimiento.estado}`}>
                {seguimiento.estado === "PENDIENTE" ? "Pendiente" : "Realizado"}
              </span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (puedeEntregar) {
    return <FormularioEntrega postulacionId={postulacion.id} onActualizada={onActualizada} />;
  }

  return (
    <p className="texto-suave">
      Disponible cuando la primera visita sea favorable y la visita al hogar esté
      registrada (favorable) u omitida.
    </p>
  );
}

// Proceso de una postulacion aprobada: primera visita, visita al hogar
// (u omision) y entrega. Cada accion recarga el detalle con onActualizada.
function ProcesoAdopcion({ postulacion, onActualizada }) {
  const editable = postulacion.estado === "APROBADA";
  const visitas = postulacion.visitas ?? [];
  const primera = visitas.find((visita) => visita.tipo === "PRIMERA_VISITA");
  const hogar = visitas.find((visita) => visita.tipo === "VISITA_HOGAR");
  const omitida = Boolean(postulacion.motivoOmisionVisitaHogar);

  const primeraFavorable = primera?.resultado === "FAVORABLE";
  const hogarResuelta = Boolean(hogar) || omitida;
  const hogarFavorable = hogar?.resultado === "FAVORABLE" || omitida;
  const entregada = postulacion.estado === "ENTREGADA";
  const puedeEntregar = editable && primeraFavorable && hogarFavorable;

  return (
    <div className="proceso">
      <h2>Proceso de adopción</h2>

      <Paso numero={1} titulo="Primera visita" estado={primera ? "listo" : "pendiente"}>
        {primera && <VisitaRegistrada visita={primera} />}
        {primera && primera.resultado === "DESFAVORABLE" && (
          <p className="mensaje mensaje-error">
            La primera visita no fue favorable: esta adopción no puede continuar.
          </p>
        )}
        {!primera && editable && (
          <FormularioVisita
            postulacionId={postulacion.id}
            tipo="PRIMERA_VISITA"
            onActualizada={onActualizada}
          />
        )}
        {!primera && !editable && <p className="texto-suave">No se registró.</p>}
      </Paso>

      <Paso
        numero={2}
        titulo="Visita al hogar"
        estado={hogarResuelta ? "listo" : primeraFavorable ? "pendiente" : "bloqueado"}
      >
        <SeccionVisitaHogar
          postulacion={{ ...postulacion, visitas }}
          editable={editable}
          primeraFavorable={primeraFavorable}
          onActualizada={onActualizada}
        />
      </Paso>

      <Paso
        numero={3}
        titulo="Entrega"
        estado={entregada ? "listo" : puedeEntregar ? "pendiente" : "bloqueado"}
      >
        <SeccionEntrega
          postulacion={{ ...postulacion, seguimientos: postulacion.seguimientos ?? [] }}
          puedeEntregar={puedeEntregar}
          onActualizada={onActualizada}
        />
      </Paso>
    </div>
  );
}

export default ProcesoAdopcion;