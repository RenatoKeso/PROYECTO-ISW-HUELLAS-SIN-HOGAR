import { useEffect, useState } from "react";
import Mensaje from "../components/ui/Mensaje.jsx";
import CalendarioSemanal from "../components/turnos/CalendarioSemanal.jsx";
import FormularioTurno from "../components/turnos/FormularioTurno.jsx";
import PanelTurno from "../components/turnos/PanelTurno.jsx";
import { cancelarTurno, listarTurnosGestion, obtenerCalendario } from "../services/turnosService.js";
import {
  cancelarInscripcion,
  inscribirseEnTurno,
  modificarInscripcion,
} from "../services/inscripcionesService.js";
import {
  aEventos,
  aplicarFiltro,
  filtrosConCuenta,
  hoyEnChile,
  leyendaDe,
  lunesDe,
  rangoDeHoras,
  sumarDias,
  tituloSemana,
} from "../utils/calendarioTurnos.js";
import { puedeGestionarTurnos } from "../utils/permisosUsuario.js";
import "../styles/voluntariado.css";
import "../styles/calendarioTurnos.css";

// El panel se reinicia (cierra confirmaciones abiertas) cuando cambia el turno
// elegido o su estado, por ejemplo despues de inscribirse o cancelar.
function clavePanel(turno) {
  if (!turno) return "ninguno";
  return [turno.id, turno.estado, turno.disponibilidad?.estado, turno.miInscripcion?.estado].join("-");
}

// /turnos: la encargada y el voluntario ven la misma grilla semanal.
// - Encargada (y directora): turnos de cualquier semana con sus cupos, agrega
//   turnos nuevos, ve los inscritos y cancela turnos.
// - Voluntario: cada turno con su estado para el, filtros, y se inscribe, cambia
//   o cancela desde el panel de la derecha.
function TurnosPage({ usuario }) {
  const gestiona = puedeGestionarTurnos(usuario);

  const [semana, setSemana] = useState(() => lunesDe(hoyEnChile()));
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [elegidoId, setElegidoId] = useState(null);
  const [cambiandoDesde, setCambiandoDesde] = useState(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [recargar, setRecargar] = useState(0);

  // Una peticion por semana: la encargada pide su vista de gestion y el
  // voluntario su calendario, que ya trae el estado de cada turno para el.
  useEffect(() => {
    let vigente = true;
    const pedir = gestiona ? listarTurnosGestion(semana) : obtenerCalendario(semana);

    pedir
      .then((respuesta) => vigente && setTurnos(respuesta.turnos))
      .catch((errorCarga) => vigente && setError(errorCarga.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [gestiona, semana, recargar]);

  // La ventana del formulario se cierra con Escape.
  useEffect(() => {
    if (!formularioAbierto) return undefined;

    function alPresionar(evento) {
      if (evento.key === "Escape") setFormularioAbierto(false);
    }

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [formularioAbierto]);

  // Los filtros solo deciden que se muestra: la semana ya esta cargada.
  const visibles = aplicarFiltro(turnos, gestiona, filtro);
  const eventos = aEventos(visibles, gestiona, elegidoId);
  const horas = rangoDeHoras(turnos);
  const filtros = filtrosConCuenta(turnos, gestiona);
  const elegido = turnos.find((turno) => turno.id === elegidoId) ?? null;

  function irASemana(nueva) {
    setCargando(true);
    setError("");
    setElegidoId(null);
    setSemana(nueva);
  }

  function refrescar() {
    setRecargar((valor) => valor + 1);
  }

  function avisar(texto) {
    setMensaje({ tipo: "exito", texto });
  }

  async function inscribirse(turno) {
    const respuesta = await inscribirseEnTurno(turno.id);
    avisar(`${respuesta.message}: ${turno.titulo}.`);
    refrescar();
  }

  function empezarCambio(turno) {
    setMensaje(null);
    setCambiandoDesde(turno);
    setFiltro("disponibles");
  }

  function cancelarCambio() {
    setCambiandoDesde(null);
    setFiltro("todos");
  }

  async function confirmarCambio(turnoNuevo) {
    const respuesta = await modificarInscripcion(cambiandoDesde.miInscripcion.id, turnoNuevo.id);
    setCambiandoDesde(null);
    setFiltro("todos");
    avisar(`${respuesta.message}: ahora estás en ${turnoNuevo.titulo}.`);
    refrescar();
  }

  async function cancelarMiInscripcion(turno) {
    const respuesta = await cancelarInscripcion(turno.miInscripcion.id);
    avisar(`${respuesta.message}. Se liberó tu cupo en ${turno.titulo}.`);
    refrescar();
  }

  async function cancelarElTurno(turno, motivo) {
    const respuesta = await cancelarTurno(turno.id, motivo);
    const cantidad = respuesta.inscripcionesCanceladas;
    avisar(
      `Turno cancelado: ${turno.titulo}. ` +
        (cantidad === 1 ? "Se canceló 1 inscripción." : `Se cancelaron ${cantidad} inscripciones.`),
    );
    refrescar();
  }

  // Al publicar, se cierra la ventana y el calendario va a la semana del turno nuevo.
  function alPublicar(respuesta) {
    setFormularioAbierto(false);
    avisar("Turno publicado. Los voluntarios ya pueden inscribirse.");

    const semanaDelTurno = lunesDe(hoyEnChile(new Date(respuesta.turno.inicio)));

    if (semanaDelTurno === semana) {
      refrescar();
    } else {
      irASemana(semanaDelTurno);
    }

    setElegidoId(respuesta.turno.id);
  }

  return (
    <section className="bloque voluntariado turnos-calendario">
      <div className="turnos-encabezado">
        <div>
          <h2>Turnos de voluntariado</h2>
          <p className="texto-suave">
            {gestiona
              ? "Revisa la semana, cuántos voluntarios hay en cada turno y agrega turnos nuevos."
              : "Elige un turno disponible e inscríbete. Puedes cambiarlo o cancelarlo mientras no haya comenzado."}
          </p>
        </div>

        {gestiona && (
          <button type="button" className="boton" onClick={() => setFormularioAbierto(true)}>
            + Agregar un nuevo turno
          </button>
        )}
      </div>

      <Mensaje mensaje={mensaje} />
      {error && <p className="mensaje mensaje-error">{error}</p>}

      {cambiandoDesde && (
        <div className="aviso-cambio-turno" role="status">
          <span>
            Cambiando <strong>{cambiandoDesde.titulo}</strong>: elige un turno azul en el calendario.
          </span>
          <button type="button" className="boton-mini" onClick={cancelarCambio}>
            Cancelar el cambio
          </button>
        </div>
      )}

      <div className="turnos-barra">
        <div className="pestanas-voluntariado" role="group" aria-label="Filtrar turnos">
          {filtros.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              className={filtro === opcion.valor ? "pestana-voluntariado activa" : "pestana-voluntariado"}
              aria-pressed={filtro === opcion.valor}
              onClick={() => setFiltro(opcion.valor)}
            >
              {opcion.texto} <span className="cuenta-filtro">{opcion.cuenta}</span>
            </button>
          ))}
        </div>

        <div className="navegacion-semana">
          <button type="button" className="flecha-semana" aria-label="Semana anterior" onClick={() => irASemana(sumarDias(semana, -7))}>
            ‹
          </button>
          <span className="titulo-semana">{tituloSemana(semana)}</span>
          <button type="button" className="flecha-semana" aria-label="Semana siguiente" onClick={() => irASemana(sumarDias(semana, 7))}>
            ›
          </button>
          <button type="button" className="boton-mini" onClick={() => irASemana(lunesDe(hoyEnChile()))}>
            Hoy
          </button>
        </div>
      </div>

      <ul className="leyenda-turnos" aria-label="Colores del calendario">
        {leyendaDe(gestiona).map((item) => (
          <li key={item.estado}>
            <span className={`punto-leyenda estado-turno-${item.estado}`} aria-hidden="true" />
            {item.texto}
          </li>
        ))}
      </ul>

      <div className="turnos-cuerpo">
        <div className="turnos-grilla">
          {cargando && <p className="texto-suave">Cargando turnos...</p>}
          {!cargando && turnos.length === 0 && (
            <p className="texto-suave">No hay turnos publicados esta semana.</p>
          )}
          <CalendarioSemanal semana={semana} eventos={eventos} horas={horas} onElegir={setElegidoId} />
        </div>

        <PanelTurno
          key={clavePanel(elegido)}
          turno={elegido}
          gestiona={gestiona}
          cambiandoDesde={cambiandoDesde}
          onInscribirse={inscribirse}
          onEmpezarCambio={empezarCambio}
          onConfirmarCambio={confirmarCambio}
          onCancelarInscripcion={cancelarMiInscripcion}
          onCancelarTurno={cancelarElTurno}
        />
      </div>

      {formularioAbierto && (
        <div className="ventana-fondo" onClick={() => setFormularioAbierto(false)}>
          <div
            className="ventana-turno"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-ventana-turno"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="ventana-encabezado">
              <h2 id="titulo-ventana-turno">Agregar un nuevo turno</h2>
              <button type="button" className="flecha-semana" aria-label="Cerrar" onClick={() => setFormularioAbierto(false)}>
                ×
              </button>
            </div>
            <FormularioTurno alPublicar={alPublicar} />
          </div>
        </div>
      )}
    </section>
  );
}

export default TurnosPage;
