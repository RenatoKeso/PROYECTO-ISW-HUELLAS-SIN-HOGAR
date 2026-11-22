import { formatearFecha } from "../../utils/formatoAdopcion.js";
import {
  esMismoDia,
  estadoSaludActual,
} from "../../utils/filtrosHistorialMedico.js";
import {
  ETIQUETAS_CLASIFICACION_SALUD,
  ETIQUETAS_ESPECIE,
  ETIQUETAS_ESTADO_VALIDACION,
} from "../../utils/registroMedicoOpciones.js";

const CLASES_ESTADO = {
  PROVISIONAL: "inicial",
  VALIDACION_PENDIENTE: "pendiente",
  REVISANDO: "revisando",
  REALIZADO: "realizada",
  ACTUALIZADO: "actualizado",
};

const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function inicialAnimal(registro) {
  const nombre = registro.animal?.nombre;
  return (nombre?.trim()?.[0] ?? "?").toUpperCase();
}

function activarConTeclado(evento, accion) {
  if (evento.key === "Enter" || evento.key === " ") {
    evento.preventDefault();
    accion();
  }
}

function claseEstado(estado) {
  return CLASES_ESTADO[estado] ?? "neutro";
}

function etiquetaEspecie(animal) {
  const especie = ETIQUETAS_ESPECIE[animal?.especie] ?? "Sin especie";
  const raza = animal?.raza?.trim();
  return raza ? `${especie} ${raza}` : especie;
}

function formatearFechaTabla(valor) {
  if (!valor) return "—";

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = MESES_CORTOS[fecha.getMonth()];
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");

  return `${dia} ${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${fecha.getFullYear()}, ${hora}:${minutos}`;
}

function fechaUltimaEvaluacion(registro) {
  const valor =
    registro?.updatedAt ?? registro?.fechaRevisionInicial ?? registro?.createdAt;
  if (!valor) return "—";

  if (esMismoDia(valor)) {
    const fecha = new Date(valor);
    const hora = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `Hoy, ${hora}:${minutos}`;
  }

  return formatearFechaTabla(valor);
}

export default function BandejaRegistros({
  registros,
  seleccionadoId,
  onSeleccionar,
  cargando,
  modo = "revisiones",
  hayFiltros = false,
  onLimpiarFiltros,
}) {
  if (cargando) return <p role="status">Cargando registros médicos...</p>;

  if (!registros.length) {
    if (hayFiltros) {
      return (
        <div className="bandeja-vacia">
          <span className="material-symbols-outlined" aria-hidden="true">
            folder_off
          </span>
          <p className="bandeja-vacia-titulo">
            No hay fichas que coincidan con los filtros seleccionados.
          </p>
          <p className="bandeja-vacia-texto">
            Prueba con otro filtro o limpia la búsqueda.
          </p>
          {onLimpiarFiltros && (
            <button
              type="button"
              className="boton boton-secundario boton-chico"
              onClick={onLimpiarFiltros}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="bandeja-vacia">
        <span className="material-symbols-outlined" aria-hidden="true">
          folder_off
        </span>
        <p className="bandeja-vacia-titulo">
          No hay registros médicos en este estado.
        </p>
      </div>
    );
  }

  const esHistorial = modo === "historial";

  if (esHistorial) {
    return (
      <div className="historial-tabla">
        <div className="historial-tabla-scroll">
          <table className="tabla-historial-medico">
            <thead>
              <tr>
                <th scope="col">Paciente / animal</th>
                <th scope="col">Código</th>
                <th scope="col">Estado clínico</th>
                <th scope="col">Fecha registro</th>
                <th scope="col">Última evaluación</th>
                <th scope="col" className="historial-celda-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => {
                const nombre = registro.animal?.nombre || "Sin nombre";
                const codigo = registro.animal?.codigoAnimal ?? registro.animalId;
                const salud = estadoSaludActual(registro);
                const etiquetaEstado =
                  ETIQUETAS_ESTADO_VALIDACION[registro.estadoValidacion] ??
                  registro.estadoValidacion;
                const seleccionada = registro.id === seleccionadoId;

                return (
                  <tr
                    key={registro.id}
                    data-status={etiquetaEstado}
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver ficha médica de ${nombre} ${codigo}`}
                    className={seleccionada ? "fila-seleccionada" : undefined}
                    onClick={() => onSeleccionar(registro.id)}
                    onKeyDown={(evento) =>
                      activarConTeclado(evento, () => onSeleccionar(registro.id))
                    }
                  >
                    <td>
                      <div className="paciente-celda">
                        <span
                          className={`paciente-avatar paciente-avatar--${claseEstado(
                            registro.estadoValidacion,
                          )}`}
                          aria-hidden="true"
                        >
                          {registro.animal?.imagenUrl ? (
                            <img
                              src={registro.animal.imagenUrl}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            inicialAnimal(registro)
                          )}
                        </span>
                        <span className="paciente-datos">
                          <strong>{nombre}</strong>
                          <small>
                            <span className="material-symbols-outlined" aria-hidden="true">
                              pets
                            </span>
                            {etiquetaEspecie(registro.animal)}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="codigo-animal">{codigo}</span>
                    </td>
                    <td>
                      <div className="estado-clinico-celda">
                        <span
                          className={`estado-clinico-pill estado-clinico-pill--${claseEstado(
                            registro.estadoValidacion,
                          )}`}
                        >
                          <span className="estado-clinico-punto" aria-hidden="true" />
                          {etiquetaEstado}
                        </span>
                        {salud && (
                          <span className={`salud-chip salud-${salud}`}>
                            {ETIQUETAS_CLASIFICACION_SALUD[salud] ?? salud}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="historial-fecha">
                        <span className="material-symbols-outlined" aria-hidden="true">
                          calendar_today
                        </span>
                        {formatearFechaTabla(registro.createdAt)}
                      </span>
                    </td>
                    <td>
                      <span className="historial-fecha historial-fecha--evaluacion">
                        <span className="material-symbols-outlined" aria-hidden="true">
                          history
                        </span>
                        {fechaUltimaEvaluacion(registro)}
                      </span>
                    </td>
                    <td className="historial-celda-acciones">
                      <button
                        type="button"
                        className="historial-accion-fila"
                        aria-label={`Opciones adicionales para ${codigo}`}
                        onClick={(evento) => {
                          evento.stopPropagation();
                          onSeleccionar(registro.id);
                        }}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">
                          more_vert
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-contenedor">
      <table className="tabla-postulaciones tabla-registros-medicos">
        <thead>
          <tr>
            <th>Animal</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Creado</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => {
            const nombre = registro.animal?.nombre || "Sin nombre";
            const codigo = registro.animal?.codigoAnimal ?? registro.animalId;
            const seleccionada = registro.id === seleccionadoId;

            return (
              <tr
                key={registro.id}
                className={`${seleccionada ? "fila-seleccionada" : ""} fila-clicable`}
                role="button"
                tabIndex={0}
                aria-label={`Abrir ficha médica de ${nombre} ${codigo}`}
                onClick={() => onSeleccionar(registro.id)}
                onKeyDown={(evento) =>
                  activarConTeclado(evento, () => onSeleccionar(registro.id))
                }
              >
                <td>{codigo}</td>
                <td>{nombre}</td>
                <td>
                  <span
                    className={`estado-chip estado-${registro.estadoValidacion}`}
                  >
                    {ETIQUETAS_ESTADO_VALIDACION[registro.estadoValidacion] ??
                      registro.estadoValidacion}
                  </span>
                </td>
                <td>{formatearFecha(registro.createdAt)}</td>
                <td>
                  <button
                    type="button"
                    className="enlace-accion"
                    onClick={(evento) => {
                      evento.stopPropagation();
                      onSeleccionar(registro.id);
                    }}
                  >
                    Abrir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
