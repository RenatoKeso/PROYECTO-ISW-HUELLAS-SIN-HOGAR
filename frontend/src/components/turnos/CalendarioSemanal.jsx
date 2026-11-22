import { useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import luxonPlugin from "@fullcalendar/luxon3";
import esLocale from "@fullcalendar/core/locales/es";
import { ZONA_CHILE } from "../../utils/calendarioTurnos.js";

const FORMATO_HORA = { hour: "2-digit", minute: "2-digit", hour12: false };

// Lo que se dibuja dentro de cada bloque: titulo, horario y una linea de estado.
function contenidoDelEvento(argumentos) {
  return (
    <div className="evento-turno-contenido">
      <strong>{argumentos.event.title}</strong>
      <span className="evento-turno-hora">{argumentos.timeText}</span>
      <span>{argumentos.event.extendedProps.pie}</span>
    </div>
  );
}

// Grilla semanal (lunes a domingo, con horas) hecha con FullCalendar.
// - `semana`: la fecha del lunes que se muestra. La navegacion la maneja la
//   pagina; aqui solo se mueve la grilla a esa semana.
// - `eventos`: los turnos ya convertidos con aEventos().
// - `horas`: { inicio, termino } de la grilla (rangoDeHoras()).
function CalendarioSemanal({ semana, eventos, horas, onElegir }) {
  const calendario = useRef(null);
  // FullCalendar guarda los callbacks al montar cada evento; con la referencia
  // siempre llama a la version mas reciente de onElegir.
  const elegir = useRef(onElegir);

  useEffect(() => {
    elegir.current = onElegir;
  }, [onElegir]);

  useEffect(() => {
    calendario.current?.getApi().gotoDate(semana);
  }, [semana]);

  // Los bloques de FullCalendar no son botones: se les agrega lo necesario para
  // usarlos con teclado y con lector de pantalla.
  function alMontarEvento({ el, event, timeText }) {
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${event.title}, ${timeText}, ${event.extendedProps.pie}`);
    el.addEventListener("keydown", (tecla) => {
      if (tecla.key === "Enter" || tecla.key === " ") {
        tecla.preventDefault();
        elegir.current(Number(event.id));
      }
    });
  }

  return (
    <div className="calendario-turnos">
      <FullCalendar
        ref={calendario}
        plugins={[timeGridPlugin, luxonPlugin]}
        initialView="timeGridWeek"
        initialDate={semana}
        timeZone={ZONA_CHILE}
        locale={esLocale}
        firstDay={1}
        headerToolbar={false}
        allDaySlot={false}
        slotMinTime={horas.inicio}
        slotMaxTime={horas.termino}
        slotLabelInterval="01:00"
        slotLabelFormat={FORMATO_HORA}
        eventTimeFormat={FORMATO_HORA}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        slotEventOverlap={false}
        nowIndicator
        height="auto"
        events={eventos}
        eventContent={contenidoDelEvento}
        eventDidMount={alMontarEvento}
        eventClick={({ event }) => elegir.current(Number(event.id))}
      />
    </div>
  );
}

export default CalendarioSemanal;
