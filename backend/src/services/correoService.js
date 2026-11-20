import nodemailer from "nodemailer";


const hayCorreoConfigurado = Boolean(process.env.CORREO_USUARIO && process.env.CORREO_CLAVE);

const transporte = hayCorreoConfigurado
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.CORREO_USUARIO, pass: process.env.CORREO_CLAVE },
    })
  : null;

export async function enviarCorreo({ para, asunto, html }) {
  if (!transporte) {
    console.log(`[correo sin configurar] Para: ${para} | Asunto: ${asunto}`);
    return;
  }

  await transporte.sendMail({
    from: `"Huellas Sin Hogar 🐾" <${process.env.CORREO_USUARIO}>`,
    to: para,
    subject: asunto,
    html,
  });
}

export async function enviarCorreoRevision(postulacion) {
  if (postulacion.estado === "ACEPTADA") {
    return enviarCorreo({
      para: postulacion.email,
      asunto: "¡Bienvenido al voluntariado de Huellas Sin Hogar! 🐾",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
          <div style="background: #56643f; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0;">¡Tu postulación fue aceptada! 🎉</h2>
          </div>
          <div style="background: #f7f3ea; padding: 20px; border-radius: 0 0 12px 12px;">
            <p>Hola <b>${postulacion.nombre}</b>,</p>
            <p>Nos alegra mucho contarte que ya eres parte del equipo de voluntarios del refugio.</p>
            <p>Pronto te contactaremos para coordinar tus primeros turnos.</p>
            <p>¡Gracias por querer ayudar! 🐶🐱</p>
          </div>
        </div>`,
    });
  }

  if (postulacion.estado === "RECHAZADA") {
    return enviarCorreo({
      para: postulacion.email,
      asunto: "Respuesta a tu postulación de voluntariado",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
          <div style="background: #56643f; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0;">Gracias por postular 🐾</h2>
          </div>
          <div style="background: #f7f3ea; padding: 20px; border-radius: 0 0 12px 12px;">
            <p>Hola <b>${postulacion.nombre}</b>,</p>
            <p>Revisamos tu postulación y por ahora no podemos aceptarla.</p>
            <p><b>Motivo:</b> ${postulacion.motivoRechazo}</p>
            <p>Puedes volver a postular más adelante. ¡Gracias por tu interés en ayudar!</p>
          </div>
        </div>`,
    });
  }
}
export async function enviarCodigoVerificacion(email, codigo) {
return enviarCorreo({
 para: email,
  asunto: `Tu código de verificación es ${codigo}`,
    html: `
   <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
      <div style="background: #56643f; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
         <h2 style="margin: 0;">Confirma tu correo 🐾</h2>
       </div>
        <div style="background: #f7f3ea; padding: 20px; border-radius: 0 0 12px 12px;">
        <p>Para terminar tu postulación de voluntariado, escribe este código en el formulario:</p>
         <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #56643f;">${codigo}</p>
         <p>El código dura 10 minutos. Si no pediste este código, ignora este correo.</p>
      </div>
    </div>`,
  });
}