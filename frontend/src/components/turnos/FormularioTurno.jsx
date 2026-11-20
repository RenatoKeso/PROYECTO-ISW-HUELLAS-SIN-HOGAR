import Campo from "../ui/Campo.jsx";
import Mensaje from "../ui/Mensaje.jsx";
import { useFormulario } from "../../hooks/useFormulario.js";
import { publicarTurno } from "../../services/turnosService.js";
import { turnoFormSchema, CUPO_MAXIMO_TURNO } from "../../validations/turnoValidation.js";

const TURNO_INICIAL = {
  titulo: "",
  descripcion: "",
  fecha: "",
  horaInicio: "",
  horaTermino: "",
  fechaLimiteInscripcion: "",
  cupoMaximo: "",
};

// Formulario de la encargada para publicar un turno (POST /turnos). Va dentro de
// la ventana "Agregar un nuevo turno". Si sale bien, avisa con alPublicar.
function FormularioTurno({ alPublicar }) {
  const formulario = useFormulario({
    iniciales: TURNO_INICIAL,
    esquema: turnoFormSchema,
    enviar: async (datos) => {
      const respuesta = await publicarTurno(datos);
      alPublicar(respuesta);
      return respuesta;
    },
    mensajeExito: "Turno publicado. Los voluntarios ya pueden inscribirse.",
  });

  const { valores, errores, cambiar } = formulario;

  return (
    <form className="formulario formulario-turno" onSubmit={formulario.enviarFormulario} noValidate>
      <div className="formulario-campos">
        <Campo
          etiqueta="Título"
          nombre="titulo"
          ancho
          valor={valores.titulo}
          error={errores.titulo}
          maxLength={120}
          placeholder="Ej: Paseo de perros, turno mañana"
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
          ancho
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

export default FormularioTurno;
