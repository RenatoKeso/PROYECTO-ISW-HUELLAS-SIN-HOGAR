import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarRegistrosMedicos } from "../services/registroMedicoService.js";
import {
  esAdoptable,
  esSaludable,
  esSaludFragil,
  estaEnCuarentena,
  estaEnSemanaActual,
  estaPendiente,
  estaPendienteHoy,
  normalizarTexto,
} from "../utils/filtrosHistorialMedico.js";
import "../styles/registroMedicoHub.css";

function claseBadge(badge) {
  const slug = normalizarTexto(badge)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `hub-card-badge hub-card-badge--${slug || "neutro"}`;
}

function useMetricas() {
  const [metricas, setMetricas] = useState({
    cargando: true,
    error: "",
    registros: [],
  });

  useEffect(() => {
    let vigente = true;
    listarRegistrosMedicos()
      .then((respuesta) => {
        if (vigente) setMetricas({ cargando: false, error: "", registros: respuesta.registros });
      })
      .catch((error) => {
        if (vigente) setMetricas({ cargando: false, error: error.message, registros: [] });
      });
    return () => { vigente = false; };
  }, []);

  const registros = metricas.registros;

  return {
    cargando: metricas.cargando,
    error: metricas.error,
    total: registros.length,
    saludables: registros.filter(esSaludable).length,
    fragiles: registros.filter(esSaludFragil).length,
    cuarentena: registros.filter(estaEnCuarentena).length,
    semanaActual: registros.filter((registro) => estaEnSemanaActual(registro)).length,
    adoptables: registros.filter(esAdoptable).length,
    pendientes: registros.filter(estaPendiente).length,
    pendientesHoy: registros.filter((registro) => estaPendienteHoy(registro)).length,
  };
}

function TarjetaPrincipal({
  href,
  icono,
  titulo,
  badge,
  descripcion,
  variante,
  accion,
  nota,
  notaIcono,
  children,
}) {
  return (
    <Link
      to={href}
      className={`hub-card hub-card--${variante}`}
      aria-label={`${titulo}: ${accion}`}
    >
      <span className="hub-card-barra" aria-hidden="true" />
      <div className="hub-card-cabecera">
        <span className="hub-card-icono material-symbols-outlined" aria-hidden="true">
          {icono}
        </span>
        <span className={claseBadge(badge)}>{badge}</span>
      </div>
      <h2 className="hub-card-titulo">{titulo}</h2>
      <p className="hub-card-descripcion">{descripcion}</p>
      <div className="hub-card-stats">{children}</div>
      <div className="hub-card-pie">
        <span className="hub-card-accion">
          {accion}
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </span>
        <span className="hub-card-nota">
          <span className="material-symbols-outlined" aria-hidden="true">
            {notaIcono}
          </span>
          {nota}
        </span>
      </div>
    </Link>
  );
}

function TarjetaMetrica({
  href,
  icono,
  titulo,
  badge,
  valor,
  detalle,
  variante,
}) {
  return (
    <Link
      to={href}
      className={`hub-metrica hub-metrica--${variante}`}
      aria-label={`${titulo}: ${valor}`}
    >
      <span className="hub-metrica-icono material-symbols-outlined" aria-hidden="true">
        {icono}
      </span>
      <span className="hub-metrica-cuerpo">
        <span className="hub-metrica-fila">
          <strong className="hub-metrica-valor">{valor}</strong>
          <span className={claseBadge(badge)}>{badge}</span>
        </span>
        <span className="hub-metrica-titulo">{titulo}</span>
        <span className="hub-metrica-detalle">{detalle}</span>
      </span>
      <span className="hub-metrica-flecha material-symbols-outlined" aria-hidden="true">
        arrow_forward
      </span>
    </Link>
  );
}

export default function RegistroMedicoHubPage() {
  const m = useMetricas();

  if (m.error) {
    return (
      <section className="hub-registro-medico">
        <header className="hub-encabezado">
          <div className="hub-encabezado-contenido">
            <h1>Registro Médico</h1>
            <p>Selecciona el módulo al que deseas acceder para gestionar la salud y bienestar de los animales del refugio.</p>
          </div>
        </header>
        <p className="hub-error" role="alert">No se pudo cargar el módulo: {m.error}</p>
      </section>
    );
  }

  return (
    <section className="hub-registro-medico">
      <header className="hub-encabezado">
        <span className="hub-encabezado-halo hub-encabezado-halo--verde" aria-hidden="true" />
        <span className="hub-encabezado-halo hub-encabezado-halo--arena" aria-hidden="true" />
        <div className="hub-encabezado-contenido">
          <span className="hub-badge">
            <span className="hub-badge-punto" aria-hidden="true" />
            Control Clínico · Gestión Veterinaria
          </span>
          <h1>Registro Médico</h1>
          <p>
            Selecciona el módulo al que deseas acceder para gestionar la salud y
            bienestar de los animales del refugio. Registra chequeos o examina el
            historial histórico detallado.
          </p>
          <div className="hub-protocolo">
            <span className="material-symbols-outlined" aria-hidden="true">
              verified_user
            </span>
            <span>
              <strong>Protocolo institucional:</strong> Todo animal ingresado debe
              contar con sus revisiones completas.
            </span>
          </div>
        </div>
      </header>

      <div className="hub-tarjetas">
        <TarjetaPrincipal
          href="/salud/registros-medicos/revisiones"
          icono="stethoscope"
          titulo="Realizar revisiones médicas"
          badge="Atención Clínica y Triaje"
          variante="primary"
          descripcion="Inicia o completa evaluaciones clínicas iniciales, diagnósticos y tratamientos sanitarios para los animales."
          accion="Ingresar a revisiones"
          nota={`${m.pendientesHoy} para hoy`}
          notaIcono="schedule"
        >
          <span className="hub-stat">
            <span className="hub-stat-punto" aria-hidden="true" />
            <span className="hub-stat-texto">
              <strong>{m.pendientesHoy}</strong>
              <span>Pendientes hoy</span>
            </span>
          </span>
          <span className="hub-stat">
            <span className="material-symbols-outlined" aria-hidden="true">
              format_list_bulleted
            </span>
            <span className="hub-stat-texto">
              <strong>{m.pendientes}</strong>
              <span>Pendientes totales</span>
            </span>
          </span>
        </TarjetaPrincipal>

        <TarjetaPrincipal
          href="/salud/registros-medicos/historial"
          icono="folder_shared"
          titulo="Historial de registros médicos"
          badge="Expedientes y Consultas"
          variante="secondary"
          descripcion="Consulta el historial clínico completo, búsqueda de fichas médicas previas, fechas de actualización y seguimiento veterinario."
          accion="Ver historial médico"
          nota="Sincronizado"
          notaIcono="cloud_done"
        >
          <span className="hub-stat">
            <span className="material-symbols-outlined" aria-hidden="true">
              inventory_2
            </span>
            <span className="hub-stat-texto">
              <strong>{m.total}</strong>
              <span>Fichas registradas</span>
            </span>
          </span>
          <span className="hub-stat">
            <span className="material-symbols-outlined" aria-hidden="true">
              manage_search
            </span>
            <span className="hub-stat-texto">
              <strong>Filtros</strong>
              <span>Por nombre o código</span>
            </span>
          </span>
        </TarjetaPrincipal>
      </div>

      <section className="hub-operativo">
        <div className="hub-operativo-encabezado">
          <div>
            <span className="hub-operativo-sub">Monitoreo del Refugio</span>
            <h3>Resumen Operativo de Salud</h3>
          </div>
          <div className="hub-operativo-chips">
            <span className="hub-operativo-semana">
              <span className="material-symbols-outlined" aria-hidden="true">
                calendar_today
              </span>
              Semana en curso · Hospital Veterinario
            </span>
            <span className="hub-operativo-total">Total: {m.total} animales</span>
          </div>
        </div>

        <div className="hub-grupo">
          <div className="hub-grupo-cabecera">
            <span className="hub-grupo-barra hub-grupo-barra--primary" aria-hidden="true" />
            <h4>Condición Clínica y Cuidados</h4>
            <span className="hub-grupo-chip">{m.total} animales registrados</span>
          </div>
          <div className="hub-métricas-grilla">
            <TarjetaMetrica
              href="/salud/registros-medicos/historial?salud=NORMAL"
              icono="favorite"
              titulo="Animales saludables"
              badge="Óptimo"
              valor={m.saludables}
              detalle="Evaluación al día"
              variante="primary"
            />
            <TarjetaMetrica
              href="/salud/registros-medicos/historial?salud=FRAGIL"
              icono="vital_signs"
              titulo="Salud frágil"
              badge="Prioritario"
              valor={m.fragiles}
              detalle="Monitoreo intensivo"
              variante="error"
            />
            <TarjetaMetrica
              href="/salud/registros-medicos/historial?cuarentena=true"
              icono="health_and_safety"
              titulo="En cuarentena"
              badge="Aislamiento"
              valor={m.cuarentena}
              detalle="Preventivo y control"
              variante="secondary"
            />
          </div>
        </div>

        <div className="hub-grupo">
          <div className="hub-grupo-cabecera">
            <span className="hub-grupo-barra hub-grupo-barra--secondary" aria-hidden="true" />
            <h4>Gestión Clínica y Adopción</h4>
            <span className="hub-grupo-chip">Flujo asistencial</span>
          </div>
          <div className="hub-métricas-grilla hub-métricas-grilla--dos">
            <TarjetaMetrica
              href="/salud/registros-medicos/historial?semana=actual"
              icono="fact_check"
              titulo="Revisiones esta semana"
              badge="En progreso"
              valor={m.semanaActual}
              detalle="Chequeos periódicos y altas veterinarias"
              variante="primary"
            />
            <TarjetaMetrica
              href="/salud/registros-medicos/historial?adopcion=ADOPTABLE"
              icono="pets"
              titulo="Listos para adopción"
              badge="Alta médica"
              valor={m.adoptables}
              detalle="Con certificado y aptos para vinculación familiar"
              variante="secondary"
            />
          </div>
        </div>

        <div className="hub-accion">
          <span className="hub-accion-hint">
            <span className="material-symbols-outlined" aria-hidden="true">
              touch_app
            </span>
            Haz clic en cualquier tarjeta para ver los registros con los filtros aplicados.
          </span>
        </div>
      </section>
    </section>
  );
}
