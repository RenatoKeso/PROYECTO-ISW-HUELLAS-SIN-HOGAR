import { enviarCorreo } from "./correoService.js";

// Horario en que el refugio recibe a los postulantes aprobados para que
// conozcan al animal (es la primera visita del proceso de adopcion).
export const HORARIO_VISITAS = "entre las 9:00 y las 17:00 hrs";

const CARACTERES_HTML = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// El nombre del postulante viene del formulario publico: se escapa para que
// nadie pueda meter HTML dentro del correo.
export function escaparHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (caracter) => CARACTERES_HTML[caracter]);
}

// Los tres correos de adopcion usan el mismo diseño: un titulo verde arriba
// y el mensaje abajo.
function plantillaCorreo(titulo, contenido) {
  return `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <div style="background: #56643f; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0;">${titulo}</h2>
        </div>
        <div style="background: #f7f3ea; padding: 20px; border-radius: 0 0 12px 12px;">
          ${contenido}
        </div>
      </div>`;
}

// Datos que usan todos los correos, ya escapados para meterlos en el HTML.
function datosDelCorreo(postulacion) {
  const nombreAnimal = postulacion.fichaAnimal?.nombre || "el animal";
  const esHembra = postulacion.fichaAnimal?.sexoAnimal === "HEMBRA";

  return {
    nombreAnimal,
    esHembra,
    nombre: escaparHtml(postulacion.nombrePostulante),
    animal: escaparHtml(nombreAnimal),
  };
}

// ---------- Aprobacion ----------

// Arma el correo que recibe el postulante cuando se aprueba su postulacion.
export function armarCorreoAprobacion(postulacion) {
  const { nombreAnimal, esHembra, nombre, animal } = datosDelCorreo(postulacion);
  const conocerlo = esHembra ? "conocerla" : "conocerlo";

  return {
    para: postulacion.emailPostulante,
    asunto: `¡Tu postulación para adoptar a ${nombreAnimal} fue aprobada! 🐾`,
    html: plantillaCorreo(
      "¡Tu postulación fue aprobada! 🎉",
      `<p>Hola <b>${nombre}</b>,</p>
          <p>Revisamos tu postulación para adoptar a <b>${animal}</b> y fue aprobada.</p>
          <p>El siguiente paso es que vengas al refugio a ${conocerlo}. Puedes venir
            <b>${HORARIO_VISITAS}</b>.</p>
          <p>Después de esa visita te contaremos cómo sigue el proceso.</p>
          <p>¡Gracias por querer darle un hogar! 🐶🐱</p>`,
    ),
  };
}

// Solo se escribe cuando la postulacion quedo APROBADA y tiene correo.
// "enviar" se puede cambiar en las pruebas para no mandar correos de verdad.
export async function enviarCorreoAprobacion(postulacion, enviar = enviarCorreo) {
  if (postulacion?.estado !== "APROBADA" || !postulacion.emailPostulante) return false;

  await enviar(armarCorreoAprobacion(postulacion));
  return true;
}

// ---------- Rechazo ----------

// Arma el correo que recibe el postulante cuando su postulacion se rechaza.
// El motivo es lo que escribio quien rechazo: al resolver la postulacion son
// sus observaciones, y si una visita salio desfavorable, las de esa visita.
export function armarCorreoRechazo(postulacion, motivo = postulacion.observaciones) {
  const { nombreAnimal, nombre, animal } = datosDelCorreo(postulacion);

  return {
    para: postulacion.emailPostulante,
    asunto: `Respuesta a tu postulación para adoptar a ${nombreAnimal}`,
    html: plantillaCorreo(
      "Gracias por postular 🐾",
      `<p>Hola <b>${nombre}</b>,</p>
          <p>Gracias por querer adoptar a <b>${animal}</b>. Revisamos tu postulación y
            esta vez no pudimos aprobarla.</p>
          <p><b>Motivo:</b></p>
          <p style="white-space: pre-line;">${escaparHtml(motivo)}</p>
          <p>Te invitamos a conocer a los otros animales que siguen esperando un hogar
            en nuestro catálogo.</p>
          <p>¡Gracias por tu interés en adoptar! 🐶🐱</p>`,
    ),
  };
}

// Solo se escribe cuando la postulacion quedo RECHAZADA y tiene correo.
export async function enviarCorreoRechazo(
  postulacion,
  motivo = postulacion?.observaciones,
  enviar = enviarCorreo,
) {
  if (postulacion?.estado !== "RECHAZADA" || !postulacion.emailPostulante) return false;

  await enviar(armarCorreoRechazo(postulacion, motivo));
  return true;
}

// ---------- Animal adoptado por otro postulante ----------

// Arma el correo para quienes postularon al mismo animal cuando se entrega a
// otra persona. No dice quien lo adopto: eso es privado del adoptante.
export function armarCorreoAdoptadoPorOtro(postulacion) {
  const { nombreAnimal, esHembra, nombre, animal } = datosDelCorreo(postulacion);
  const adoptado = esHembra ? "adoptada" : "adoptado";

  return {
    para: postulacion.emailPostulante,
    asunto: `${nombreAnimal} ya encontró un hogar 🏡`,
    html: plantillaCorreo(
      `${animal} ya encontró un hogar 🏡`,
      `<p>Hola <b>${nombre}</b>,</p>
          <p>Gracias por postular para adoptar a <b>${animal}</b>. Te contamos que
            ya fue ${adoptado} por otro postulante, así que tu postulación quedó cerrada.</p>
          <p>Te invitamos a conocer a los otros animales que siguen esperando un hogar
            en nuestro catálogo.</p>
          <p>¡Gracias por querer darle un hogar! 🐶🐱</p>`,
    ),
  };
}

// Manda un correo distinto a cada persona (nunca todos juntos en un solo
// correo, porque cada uno veria el email de los demas). Si un envio falla, se
// sigue con los demas. Devuelve cuantos correos se enviaron.
export async function enviarCorreosAdoptadoPorOtro(postulaciones = [], enviar = enviarCorreo) {
  const conCorreo = postulaciones.filter((postulacion) => postulacion?.emailPostulante);

  const resultados = await Promise.allSettled(
    conCorreo.map((postulacion) => enviar(armarCorreoAdoptadoPorOtro(postulacion))),
  );

  for (const resultado of resultados) {
    if (resultado.status === "rejected") {
      console.error("No se pudo avisar que el animal fue adoptado:", resultado.reason?.message);
    }
  }

  return resultados.filter((resultado) => resultado.status === "fulfilled").length;
}
