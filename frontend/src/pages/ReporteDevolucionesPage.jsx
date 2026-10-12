import { useEffect, useState } from "react";
import Campo from "../components/ui/Campo.jsx";
import { ApiError } from "../services/api.js";
import { listarVoluntarios } from "../services/voluntariosService.js";
import { generarReporteDevoluciones, listarReportesDevoluciones } from "../services/reporteDevolucionService.js";
import "../styles/reporteDevoluciones.css";

const NOMBRES_MOTIVO = {
  COMPORTAMIENTO: "Comportamiento",
  SALUD: "Salud",
  CAMBIO_SITUACION_FAMILIAR: "Cambio en situación familiar",
  OTRO: "Otro",
};

const NOMBRES_ESPECIE = { PERRO: "Perro", GATO: "Gato", OTRO: "Otro" };
const EMOJI_ESPECIE = { PERRO: "🐶", GATO: "🐱", OTRO: "🐾" };
const NOMBRES_SEXO = { MACHO: "Macho", HEMBRA: "Hembra", DESCONOCIDO: "Desconocido" };
const NOMBRES_ESTADO = {
  ACTIVO: "En el refugio",
  ESPERA_ADOPCION: "Esperando adopción",
  ADOPTADO: "Adoptado",
  EGRESADO: "Egresado",
  FALLECIDO: "Fallecido",
  TRANSFERIDO: "Transferido",
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
  const [fichaAbierta, setFichaAbierta] = useState(null);
  const [pantalla, setPantalla] = useState("portada");
  const [pestana, setPestana] = useState("generar");

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
          <section className="bloque devoluciones">
          {pantalla === "portada" && (
          <div className="portada">
          <h2>Devoluciones</h2>
          <p className="bajada">¿Qué quieres hacer hoy?</p>
          <div className="opciones">
          <button type="button" className="opcion" onClick={() => setPantalla("registrar")}>
          <span className="opcion-icono">🐾</span>
          <span className="opcion-titulo">Registrar devolución</span>
          <span className="opcion-texto">Anota cuando un animal vuelve al refugio, con su motivo.</span>
          </button>
          <button type="button" className="opcion opcion-cafe" onClick={() => setPantalla("reporte")}>
          <span className="opcion-icono">📋</span>
          <span className="opcion-titulo">Generar reporte</span>
          <span className="opcion-texto">Revisa las devoluciones por fecha y motivo, y los reportes guardados.</span>
         </button>
    </div>
  </div>
)}
{pantalla === "registrar" && (
  <div className="pantalla">
    <button type="button" className="volver" onClick={() => setPantalla("portada")}>← Volver</button>
    <h2>Registrar devolución</h2>
    <p className="bajada">Esta parte todavía no está disponible.</p>
  </div>
)}
      {pantalla === "reporte" && (
        <div className="pantalla">
          <button type="button" className="volver" onClick={() => setPantalla("portada")}>← Volver</button>
          <h2>Reporte de devoluciones</h2>
          <p className="bajada">Revisa las devoluciones registradas en un rango de fechas.</p>

          <div className="pestanas">
            <button
              type="button"
              className={pestana === "generar" ? "pestana activa" : "pestana"}
              onClick={() => setPestana("generar")}
            >
              Generar reporte
            </button>
            <button
              type="button"
              className={pestana === "guardados" ? "pestana activa" : "pestana"}
              onClick={() => setPestana("guardados")}
            >
              Reportes guardados
            </button>
          </div>

          {pestana === "generar" && (
            <>
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

              {reporte && (
                <>
                  <p className="mensaje mensaje-exito">
                    Reporte generado: {reporte.totalDevoluciones} devoluciones encontradas.
                  </p>

                  <div className="tarjetas">
                    {Object.entries(reporte.resultado.porMotivo).flatMap(([motivo, grupo]) =>
                      grupo.devoluciones.map((devolucion, indice) => (
                        <article key={`${motivo}-${indice}`} className="tarjeta tarjeta-devolucion">
                          <h3>{devolucion.animal}</h3>
                          <p><strong>Fecha:</strong> {formatearFecha(devolucion.fecha)}</p>
                          <p><strong>Motivo:</strong> {NOMBRES_MOTIVO[motivo]}</p>
                          <p><strong>Recibió:</strong> {devolucion.receptor ?? "Sin registrar"}</p>
                          <p><strong>Devolvió:</strong> {devolucion.postulante ?? "Sin registrar"}</p>
                          {devolucion.ficha && (
                            <button type="button" className="boton boton-secundario" onClick={() => setFichaAbierta(devolucion)}>
                              Ver ficha
                            </button>
                          )}
                        </article>
                      ))
                    )}
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
            </>
          )}

          {pestana === "guardados" && (
            reportesGuardados.length === 0 ? (
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
                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => {
                        setReporte(guardado);
                        setPestana("generar");
                      }}
                    >
                      Ver reporte
                    </button>
                  </article>
                ))}
              </div>
            )
          )}

          {mensaje && <p className="mensaje mensaje-error">{mensaje}</p>}
        </div>
      )}

    {fichaAbierta && (
           <div className="fondo-ficha" onClick={() => setFichaAbierta(null)}>
           <div className="ficha-animal" onClick={(e) => e.stopPropagation()}>
          <div className="cabecera-ficha"></div>
           <button type="button" className="cerrar-ficha" onClick={() => setFichaAbierta(null)}>✕</button>
           <div className="avatar-ficha">{EMOJI_ESPECIE[fichaAbierta.ficha.especie]}</div>
           <h3>{fichaAbierta.animal}</h3>
           <span className="codigo-ficha">{fichaAbierta.codigoAnimal}</span>
           <div className="datos-ficha">
            <div><small>Especie</small><p>{NOMBRES_ESPECIE[fichaAbierta.ficha.especie]}</p></div>
            <div><small>Sexo</small><p>{NOMBRES_SEXO[fichaAbierta.ficha.sexo]}</p></div>
            <div><small>Raza</small><p>{fichaAbierta.ficha.raza ?? "Sin registrar"}</p></div>
            <div><small>Edad</small><p>{fichaAbierta.ficha.edad != null ? `${fichaAbierta.ficha.edad} ${fichaAbierta.ficha.edad === 1 ? "año" : "años"}` : "Sin registrar"}</p></div>
           </div>
           <span className="estado-ficha">{NOMBRES_ESTADO[fichaAbierta.ficha.estado]}</span>
          </div>
         </div>
       )}
        </section>
    );  

}
export default ReporteDevolucionesPage;