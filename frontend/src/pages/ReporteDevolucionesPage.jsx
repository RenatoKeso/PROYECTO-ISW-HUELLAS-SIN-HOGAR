import { useEffect, useState } from "react";
import Campo from "../components/ui/Campo.jsx";
import { ApiError } from "../services/api.js";
import { listarVoluntarios } from "../services/voluntariosService.js";
import { generarReporteDevoluciones, listarReportesDevoluciones } from "../services/reporteDevolucionService.js";

const NOMBRES_MOTIVO = {
  COMPORTAMIENTO: "Comportamiento",
  SALUD: "Salud",
  CAMBIO_SITUACION_FAMILIAR: "Cambio en situación familiar",
  OTRO: "Otro",
};

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-CL", { timeZone: "UTC" });
}

function ReporteDevolucionesPage() {
  const [valores, setValores] = useState({ fechaDesde: "", fechaHasta: "", generadoPorId: "" });
  const [voluntarios, setVoluntarios] = useState([]);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [reporte, setReporte] = useState(null);
  const [reportesGuardados, setReportesGuardados] = useState([]);

  function cargarReportes() {
    listarReportesDevoluciones()
      .then((respuesta) => setReportesGuardados(respuesta.reportes))
      .catch(() => setMensaje("No se pudieron cargar los reportes guardados"));
  }

  useEffect(() => {
    listarVoluntarios()
      .then((respuesta) => setVoluntarios(respuesta.voluntarios))
      .catch(() => setMensaje("No se pudieron cargar los voluntarios"));
  }, []);
 
  useEffect(() => {
    cargarReportes();
  }, []);

  const opcionesVoluntarios = [
    { valor: "", texto: "Elige un voluntario" },
    ...voluntarios.map((voluntario) => ({
      valor: String(voluntario.id),
      texto: voluntario.nombre,
    })),
  ];

  function cambiar(campo, valor) {
      setValores((prev) => ({ ...prev, [campo]: valor }));
    }

    async function generar(evento) {
       evento.preventDefault();
       setErrores({});
       setMensaje("");
       setReporte(null);
       setCargando(true);

    try {
      const respuesta = await generarReporteDevoluciones({
        fechaDesde: valores.fechaDesde,
        fechaHasta: valores.fechaHasta,
        generadoPorId: Number(valores.generadoPorId),
      });
      setReporte(respuesta.reporte);
      cargarReportes();
    } catch (error) {
      if (error instanceof ApiError) {
        const erroresPorCampo = (error.detalles ?? [])
          .filter((detalle) => detalle.campo)
          .map((detalle) => [detalle.campo, detalle.mensaje]);
        setErrores(Object.fromEntries(erroresPorCampo));
        setMensaje(error.message);
      } else {
        setMensaje("No se pudo contactar con el servidor. Intenta nuevamente.");
      }
    } finally {
      setCargando(false);
    }
  }

    return (
      <section className="bloque">
      <h2>Reporte de devoluciones</h2>
      <p>Elige un rango de fechas para ver las devoluciones agrupadas por motivo.</p>

      <form className="formulario" onSubmit={generar} noValidate>
        <div className="formulario-campos">
          <Campo
            etiqueta="Desde"
            nombre="fechaDesde"
            type="date"
            valor={valores.fechaDesde}
            error={errores.fechaDesde}
            onChange={(e) => cambiar("fechaDesde", e.target.value)}
          />
          <Campo
            etiqueta="Hasta"
            nombre="fechaHasta"
            type="date"
            valor={valores.fechaHasta}
            error={errores.fechaHasta}
            onChange={(e) => cambiar("fechaHasta", e.target.value)}
          />
          <Campo
            etiqueta="Generado por"
            nombre="generadoPorId"
            control="select"
            opciones={opcionesVoluntarios}
            valor={valores.generadoPorId}
            error={errores.generadoPorId}
            onChange={(e) => cambiar("generadoPorId", e.target.value)}
          />
        </div>

        <button type="submit" className="boton" disabled={cargando}>
          {cargando ? "Generando..." : "Generar reporte"}
        </button>
      </form>

           {mensaje && <p className="mensaje mensaje-error">{mensaje}</p>}
           {reporte && (
            <>
            <p className="mensaje mensaje-exito">
            Reporte generado: {reporte.totalDevoluciones} devoluciones encontradas.
            </p>

            <div className="tarjetas">
            {Object.entries(reporte.resultado.porMotivo).map(([motivo, grupo]) => (
              <article key={motivo} className="tarjeta">
                <h3>{NOMBRES_MOTIVO[motivo]} ({grupo.cantidad})</h3>
                {grupo.devoluciones.map((devolucion, indice) => (
                  <p key={indice}>
                    {devolucion.animal} · {new Date(devolucion.fecha).toLocaleDateString("es-CL", { timeZone: "UTC" })}
                  </p>
                ))}
              </article>
            ))}
             </div>
                <h3>Animales devueltos más de una vez por el mismo motivo</h3>
                {reporte.resultado.repetidos.length === 0 ? (
                    <p>No hay animales repetidos en este rango.</p>
                ) : (
                reporte.resultado.repetidos.map((repetido) => (
                     <p key={`${repetido.codigoAnimal}-${repetido.motivo}`} className="mensaje mensaje-error">
                    ⚠️ {repetido.animal} fue devuelto {repetido.cantidad} veces por {NOMBRES_MOTIVO[repetido.motivo]}
                 </p>
                ))
            )}
             </>
        )}
        <h3>Reportes guardados</h3>
        {reportesGuardados.length === 0 ? (
            <p>Todavía no hay reportes guardados.</p>
        ) : (
            <div className="tarjetas">
            {reportesGuardados.map((guardado) => (
              <article key={guardado.id} className="tarjeta">
              <h3>Reporte #{guardado.id}</h3>
              <p>Del {formatearFecha(guardado.fechaDesde)} al {formatearFecha(guardado.fechaHasta)}</p>
              <p>{guardado.totalDevoluciones} {guardado.totalDevoluciones === 1 ? "devolución" : "devoluciones"}</p>
              <p>
                Generado por {voluntarios.find((voluntario) => voluntario.id === guardado.generadoPorId)?.nombre}
                {" el "}{new Date(guardado.createdAt).toLocaleString("es-CL")}
              </p>
              <button type="button" className="boton boton-secundario" onClick={() => setReporte(guardado)}>
                Ver reporte
              </button>
              </article>
        ))}
          </div>
        )}
        </section>
    );

}
export default ReporteDevolucionesPage;