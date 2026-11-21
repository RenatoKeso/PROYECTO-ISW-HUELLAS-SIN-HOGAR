import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listarIngresosGlobales } from "../../services/animalesService.js";
import { formatearFecha } from "../../utils/formatoAdopcion.js";
import { codigoAnimalDesdeNumero } from "../../utils/registroAnimal.js";
import "../../styles/listaFichas.css";
import "../../styles/resumenAnimales.css";

export default function HistorialIngresos() {
  const [parametros, setParametros] = useSearchParams();
  const [busqueda, setBusqueda] = useState(
    () => parametros.get("busqueda") ?? "",
  );
  const [filtroEspecie, setFiltroEspecie] = useState("TODOS");
  const [orden, setOrden] = useState("recientes");
  const [historialGlobal, setHistorialGlobal] = useState([]);
  const [cargandoHistorialGlobal, setCargandoHistorialGlobal] = useState(true);
  const [errorHistorialGlobal, setErrorHistorialGlobal] = useState("");

  useEffect(() => {
    let vigente = true;

    listarIngresosGlobales()
      .then((respuesta) => {
        if (!vigente) return;
        setHistorialGlobal(respuesta.ingresos);
        setErrorHistorialGlobal("");
      })
      .catch((error) => {
        if (!vigente) return;
        setErrorHistorialGlobal(error.message);
        setHistorialGlobal([]);
      })
      .finally(() => {
        if (vigente) setCargandoHistorialGlobal(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  function cambiarBusqueda(valor) {
    setBusqueda(valor);

    const nuevos = new URLSearchParams(parametros);
    const limpio = valor.trim();

    if (limpio) nuevos.set("busqueda", valor);
    else nuevos.delete("busqueda");

    setParametros(nuevos, { replace: true });
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEspecie("TODOS");
    setOrden("recientes");
    setParametros({}, { replace: true });
  }

  const termino = busqueda.trim().toLowerCase();
  const codigoNumerico = /^\d+$/.test(termino)
    ? codigoAnimalDesdeNumero(termino)
    : "";

  const ingresosFiltrados = historialGlobal
    .filter((ingreso) => {
      const ficha = ingreso.fichaAnimal ?? {};

      if (filtroEspecie !== "TODOS" && ficha.especie !== filtroEspecie) {
        return false;
      }

      if (!termino) return true;

      const coincideTexto = [ficha.codigoAnimal, ficha.nombre, ficha.raza].some(
        (valor) => String(valor ?? "").toLowerCase().includes(termino),
      );

      if (coincideTexto) return true;

      return (
        Boolean(codigoNumerico) &&
        String(ficha.codigoAnimal ?? "")
          .toLowerCase()
          .includes(codigoNumerico)
      );
    })
    .sort((a, b) => {
      if (orden === "az") {
        const nombreA =
          a.fichaAnimal?.nombre || a.fichaAnimal?.codigoAnimal || "";
        const nombreB =
          b.fichaAnimal?.nombre || b.fichaAnimal?.codigoAnimal || "";

        return String(nombreA).localeCompare(String(nombreB), "es", {
          sensitivity: "base",
        });
      }

      if (orden === "codigo") {
        return String(a.fichaAnimal?.codigoAnimal ?? "").localeCompare(
          String(b.fichaAnimal?.codigoAnimal ?? ""),
          "es",
          { sensitivity: "base" },
        );
      }

      return (
        new Date(b.fechaIngreso).getTime() -
          new Date(a.fechaIngreso).getTime() || b.id - a.id
      );
    });

  const totalIngresos = historialGlobal.length;
  const totalPerros = historialGlobal.filter(
    (ingreso) => ingreso.fichaAnimal?.especie === "PERRO",
  ).length;
  const totalGatos = historialGlobal.filter(
    (ingreso) => ingreso.fichaAnimal?.especie === "GATO",
  ).length;
  const totalOtras = historialGlobal.filter(
    (ingreso) => ingreso.fichaAnimal?.especie === "OTRO",
  ).length;
  const hayFiltros = Boolean(termino) || filtroEspecie !== "TODOS";

  const valorTotal = cargandoHistorialGlobal
    ? "…"
    : errorHistorialGlobal
      ? "—"
      : ingresosFiltrados.length;

  return (
    <section className="historial-contenido">
      <header className="historial-encabezado">
        <div className="historial-titulos">
          <span className="historial-eyebrow">
            Registro Operativo · Control de Ingresos
          </span>
          <h1>Historial de ingresos</h1>
        </div>

        <div className="lista-fichas-resumen">
          <div className="lista-fichas-resumen-grupo">
            <span
              className="material-symbols-outlined lista-fichas-resumen-icono"
              aria-hidden="true"
            >
              pets
            </span>
            <div>
              <span className="lista-fichas-resumen-label">Total</span>
              <span className="lista-fichas-resumen-valor">
                {valorTotal}
              </span>
            </div>
          </div>
        </div>
      </header>

      <section
        className="lista-fichas-filtros"
        aria-label="Filtros del historial"
      >
        <div className="lista-fichas-filtros-fila">
          <div className="lista-fichas-buscador">
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              search
            </span>
            <input
              id="busquedaHistorial"
              type="search"
              value={busqueda}
              onChange={(evento) => cambiarBusqueda(evento.target.value)}
              placeholder="Buscar por nombre, código o raza (ej: Gretel, anim-001)..."
              aria-label="Buscar por nombre, código o raza"
            />
          </div>

          <select
            className="lista-fichas-select"
            value={orden}
            onChange={(evento) => setOrden(evento.target.value)}
            aria-label="Ordenar ingresos"
          >
            <option value="recientes">Más recientes</option>
            <option value="az">Nombre (A-Z)</option>
            <option value="codigo">Por código</option>
          </select>

          <button
            type="button"
            className="lista-fichas-limpiar"
            onClick={limpiarFiltros}
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              restart_alt
            </span>
            Limpiar
          </button>
        </div>

        <div className="lista-fichas-filtros-especies">
          <span className="lista-fichas-filtros-especies-label">
            Filtrar por especie:
          </span>

          <button
            type="button"
            className={
              filtroEspecie === "TODOS"
                ? "lista-fichas-filtro-especie lista-fichas-filtro-especie-activo"
                : "lista-fichas-filtro-especie"
            }
            aria-pressed={filtroEspecie === "TODOS"}
            onClick={() => setFiltroEspecie("TODOS")}
          >
            Todos ({totalIngresos})
          </button>

          <button
            type="button"
            className={
              filtroEspecie === "PERRO"
                ? "lista-fichas-filtro-especie lista-fichas-filtro-especie-activo"
                : "lista-fichas-filtro-especie"
            }
            aria-pressed={filtroEspecie === "PERRO"}
            onClick={() => setFiltroEspecie("PERRO")}
          >
            Perros ({totalPerros})
          </button>

          <button
            type="button"
            className={
              filtroEspecie === "GATO"
                ? "lista-fichas-filtro-especie lista-fichas-filtro-especie-activo"
                : "lista-fichas-filtro-especie"
            }
            aria-pressed={filtroEspecie === "GATO"}
            onClick={() => setFiltroEspecie("GATO")}
          >
            Gatos ({totalGatos})
          </button>

          {totalOtras > 0 && (
            <button
              type="button"
              className={
                filtroEspecie === "OTRO"
                  ? "lista-fichas-filtro-especie lista-fichas-filtro-especie-activo"
                  : "lista-fichas-filtro-especie"
              }
              aria-pressed={filtroEspecie === "OTRO"}
              onClick={() => setFiltroEspecie("OTRO")}
            >
              Otras ({totalOtras})
            </button>
          )}
        </div>
      </section>

      <section className="historial-tabla-card">
        {cargandoHistorialGlobal && (
          <p className="historial-estado">Cargando historial...</p>
        )}

        {!cargandoHistorialGlobal && errorHistorialGlobal && (
          <p className="historial-estado historial-estado-error">
            No se pudo cargar el historial: {errorHistorialGlobal}
          </p>
        )}

        {!cargandoHistorialGlobal &&
          !errorHistorialGlobal &&
          historialGlobal.length === 0 && (
            <div className="historial-vacio">
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                search_off
              </span>
              <p className="historial-vacio-titulo">
                Todavía no hay ingresos registrados
              </p>
              <p className="historial-vacio-texto">
                Los ingresos aparecerán aquí cuando se registren.
              </p>
            </div>
          )}

        {!cargandoHistorialGlobal &&
          !errorHistorialGlobal &&
          historialGlobal.length > 0 &&
          ingresosFiltrados.length === 0 && (
            <div className="historial-vacio">
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                search_off
              </span>
              <p className="historial-vacio-titulo">
                No se encontraron ingresos con estos filtros
              </p>
              <p className="historial-vacio-texto">
                {hayFiltros
                  ? "Intenta cambiar el término de búsqueda, la especie o restablecer los filtros."
                  : "No hay ingresos que coincidan con la búsqueda."}
              </p>
            </div>
          )}

        {!cargandoHistorialGlobal &&
          !errorHistorialGlobal &&
          ingresosFiltrados.length > 0 && (
            <div className="historial-tabla-scroll">
              <table className="historial-tabla">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Procedencia</th>
                    <th>Receptor</th>
                    <th>Ubicación</th>
                    <th>Estado de salud</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresosFiltrados.map((ingreso) => (
                    <tr key={ingreso.id}>
                      <td className="historial-codigo">
                        {ingreso.fichaAnimal?.codigoAnimal ?? "—"}
                      </td>
                      <td className="historial-nombre">
                        {ingreso.fichaAnimal?.nombre || "Sin nombre"}
                      </td>
                      <td>
                        <span
                          className={`historial-tipo ${
                            ingreso.tipo === "INGRESO"
                              ? "historial-tipo-ingreso"
                              : "historial-tipo-reingreso"
                          }`}
                        >
                          <span
                            className="historial-tipo-punto"
                            aria-hidden="true"
                          />
                          {ingreso.tipo === "INGRESO"
                            ? "Ingreso"
                            : "Reingreso"}
                        </span>
                      </td>
                      <td>{formatearFecha(ingreso.fechaIngreso)}</td>
                      <td>{ingreso.procedencia || "—"}</td>
                      <td>{ingreso.receptor?.nombre ?? "—"}</td>
                      <td>{ingreso.ubicacionEncontrado || "—"}</td>
                      <td>{ingreso.estadoSalud || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </section>
  );
}
