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

// Arma el correo que recibe el postulante cuando se aprueba su postulacion.
export function armarCorreoAprobacion(postulacion) {
  const nombreAnimal = postulacion.fichaAnimal?.nombre || "el animal";
  const conocerlo = postulacion.fichaAnimal?.sexoAnimal === "HEMBRA" ? "conocerla" : "conocerlo";
  const nombre = escaparHtml(postulacion.nombrePostulante);
  const animal = escaparHtml(nombreAnimal);

  return {
    para: postulacion.emailPostulante,
    asunto: `¡Tu postulación para adoptar a ${nombreAnimal} fue aprobada! 🐾`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <div style="background: #56643f; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0;">¡Tu postulación fue aprobada! 🎉</h2>
        </div>
        <div style="background: #f7f3ea; padding: 20px; border-radius: 0 0 12px 12px;">
          <p>Hola <b>${nombre}</b>,</p>
          <p>Revisamos tu postulación para adoptar a <b>${animal}</b> y fue aprobada.</p>
          <p>El siguiente paso es que vengas al refugio a ${conocerlo}. Puedes venir
            <b>${HORARIO_VISITAS}</b>.</p>
          <p>Después de esa visita te contaremos cómo sigue el proceso.</p>
          <p>¡Gracias por querer darle un hogar! 🐶🐱</p>
        </div>
      </div>`,
  };
}

// Solo se escribe cuando la postulacion quedo APROBADA y tiene correo.
// "enviar" se puede cambiar en las pruebas para no mandar correos de verdad.
export async function enviarCorreoAprobacion(postulacion, enviar = enviarCorreo) {
  if (postulacion?.estado !== "APROBADA" || !postulacion.emailPostulante) return false;

  await enviar(armarCorreoAprobacion(postulacion));
  return true;
}
