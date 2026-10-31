import { useEffect, useState } from "react";
import Campo from "../components/ui/Campo.jsx";
import { ApiError } from "../services/api.js";
import { generarReporteDevoluciones, listarReportesDevoluciones } from "../services/reporteDevolucionService.js";
import "../styles/reporteDevoluciones.css";
import mascotas from "../assets/mascotas.svg";
import caritaGato from "../assets/carita-gato.svg";
import caritaPerro from "../assets/carita-perro.svg";
import caritaConejo from "../assets/carita-conejo.svg";
import caritaGatoCafe from "../assets/carita-gato-cafe.svg";

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

function textoDevoluciones(cantidad) {
  return `${cantidad} ${cantidad === 1 ? "devolución" : "devoluciones"}`;
}

// Junta todas las devoluciones de un reporte en una sola lista, cada una con su motivo
function devolucionesDelReporte(reporte) {
  return Object.entries(reporte.resultado.porMotivo).flatMap(([motivo, grupo]) =>
    grupo.devoluciones.map((devolucion) => ({ ...devolucion, motivo }))
  );
}

// Cuenta cuántas devoluciones hay por motivo: { COMPORTAMIENTO: 2, SALUD: 1 }
function contarPorMotivo(devoluciones) {
  const conteo = {};
  devoluciones.forEach((devolucion) => {
    conteo[devolucion.motivo] = (conteo[devolucion.motivo] ?? 0) + 1;
  });
  return conteo;
}

// Arma una ficha por animal con todas sus devoluciones de los reportes guardados
function agruparPorAnimal(reportes) {
  const vistas = new Set();
  const animales = {};

  reportes.forEach((reporte) => {
    devolucionesDelReporte(reporte).forEach((devolucion) => {
      const clave = `${devolucion.codigoAnimal}-${devolucion.fecha}-${devolucion.motivo}`;
      if (vistas.has(clave)) return;
      vistas.add(clave);

      if (!animales[devolucion.codigoAnimal]) {
        animales[devolucion.codigoAnimal] = {
          animal: devolucion.animal,
          codigoAnimal: devolucion.codigoAnimal,
          ficha: null,
          devoluciones: [],
        };
      }
      const datosAnimal = animales[devolucion.codigoAnimal];
      if (devolucion.ficha) datosAnimal.ficha = devolucion.ficha;
      datosAnimal.devoluciones.push(devolucion);
    });
  });

  return Object.values(animales).map((datosAnimal) => ({
    ...datosAnimal,
    devoluciones: datosAnimal.devoluciones.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
  }));
}

function ReporteDevolucionesPage() {
  const [valores, setValores] = useState({ fechaDesde: "", fechaHasta: "" });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [reportesGuardados, setReportesGuardados] = useState([]);
  const [fichaAbierta, setFichaAbierta] = useState(null);
  const [pantalla, setPantalla] = useState("portada");
  const [pestana, setPestana] = useState("generar");
  const [ventana, setVentana] = useState(null);

  function cargarReportes() {
    listarReportesDevoluciones()
      .then((respuesta) => setReportesGuardados(respuesta.reportes))
      .catch(() => setMensaje("No se pudieron cargar los reportes guardados"));
  }
 
  useEffect(() => {
    cargarReportes();
  }, []);


  const animales = agruparPorAnimal(reportesGuardados);

  function cambiar(campo, valor) {
      setValores((prev) => ({ ...prev, [campo]: valor }));
    }

  function abrirReporteGenerado(reporte) {
  const nombreVoluntario = reporte.generadoPor?.nombre;
    setVentana({
      icono: "📋",
      titulo: "Reporte de devoluciones",
      subtitulo: `${formatearFecha(reporte.fechaDesde)} al ${formatearFecha(reporte.fechaHasta)}`,
      devoluciones: devolucionesDelReporte(reporte).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
      repetidos: reporte.resultado.repetidos,
      mostrarNombres: true,
      pie: nombreVoluntario ? `Generado por ${nombreVoluntario}` : "",
    });
  }

  function cerrarVentana() {
    setVentana(null);
    setFichaAbierta(null);
  }

  function abrirReporteAnimal(datosAnimal) {
    const repetidos = Object.entries(contarPorMotivo(datosAnimal.devoluciones))
      .filter(([, cantidad]) => cantidad > 1)
      .map(([motivo, cantidad]) => ({
        animal: datosAnimal.animal,
        codigoAnimal: datosAnimal.codigoAnimal,
        motivo,
        cantidad,
      }));

    setVentana({
      icono: EMOJI_ESPECIE[datosAnimal.ficha?.especie] ?? "🐾",
      titulo: `Reporte de ${datosAnimal.animal}`,
      subtitulo: datosAnimal.codigoAnimal,
      devoluciones: datosAnimal.devoluciones,
      repetidos,
      mostrarNombres: false,
      animal: datosAnimal.ficha ? datosAnimal : null,
      pie: "",
    });
  }

    async function generar(evento) {
       evento.preventDefault();
       setErrores({});
       setMensaje("");
       setCargando(true);

    try {
      const respuesta = await generarReporteDevoluciones({
        fechaDesde: valores.fechaDesde,
        fechaHasta: valores.fechaHasta,
      });
      abrirReporteGenerado(respuesta.reporte);
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

          <div className="decoracion">
            <span className="huella huella-1">🐾</span>
            <span className="huella huella-2">🐾</span>
            <span className="huella huella-3">🐾</span>
            <div className="decoracion-texto">
              <p className="decoracion-titulo">Cada regreso también es una nueva oportunidad</p>
              <p className="decoracion-bajada">Saber por qué volvió nos ayuda a encontrarle el hogar ideal.</p>
            </div>
            <img src={mascotas} alt="" className="mascotas" />
          </div>

          <div className="huellas-fondo" aria-hidden="true">
            <img src={caritaGato} alt="" className="carita f1" />
            <img src={caritaConejo} alt="" className="carita f2" />
            <img src={caritaGatoCafe} alt="" className="carita f3" />
            <img src={caritaPerro} alt="" className="carita f4" />
            <span className="huella-fondo h1">🐾</span>
            <span className="huella-fondo h2">🐾</span>
            <span className="huella-fondo h3">🐾</span>
            <span className="huella-fondo h4">🐾</span>
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
                </div>

                <button type="submit" className="boton" disabled={cargando}>
                  {cargando ? "Generando..." : "Generar reporte"}
                </button>
              </form>
            </>
          )}

          {pestana === "guardados" && (
            animales.length === 0 ? (
              <p className="bajada">Todavía no hay reportes guardados.</p>
            ) : (
              <div className="lista-animales">
                {animales.map((datosAnimal) => (
                  <article key={datosAnimal.codigoAnimal} className="fila-animal">
                    <div className="avatar-fila">{EMOJI_ESPECIE[datosAnimal.ficha?.especie] ?? "🐾"}</div>
                    <div className="info-fila">
                      <h3>{datosAnimal.animal}</h3>
                      <p>
                        {datosAnimal.codigoAnimal} · {textoDevoluciones(datosAnimal.devoluciones.length)} · última el{" "}
                        {formatearFecha(datosAnimal.devoluciones[datosAnimal.devoluciones.length - 1].fecha)}
                      </p>
                    </div>
                    <button type="button" className="boton boton-secundario" onClick={() => abrirReporteAnimal(datosAnimal)}>
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

      {pantalla === "reporte" && (
        <div className="fila-mascotas" aria-hidden="true">
          <span className="patita p1">🐾</span>
          <span className="patita p2">🐾</span>
          <span className="patita p3">🐾</span>
          <span className="patita p4">🐾</span>
          <span className="patita p5">🐾</span>
          <span className="patita p6">🐾</span>
          <img src={mascotas} alt="" />
          <img src={mascotas} alt="" />
        </div>
      )}

      {ventana && (
        <div className="fondo-ficha" onClick={cerrarVentana}>
          <div className={fichaAbierta ? "ventanas-juntas con-ficha" : "ventanas-juntas"}>
            <div className="ficha-animal ventana-reporte" onClick={(e) => e.stopPropagation()}>
              <div className="cabecera-ficha"></div>
              <button type="button" className="cerrar-ficha" onClick={cerrarVentana}>✕</button>
              <div className="avatar-ficha">{ventana.icono}</div>
              <h3>{ventana.titulo}</h3>
              <span className="codigo-ficha">{ventana.subtitulo}</span>
              <div>
                <span className="estado-ficha">{textoDevoluciones(ventana.devoluciones.length)}</span>
              </div>

              {ventana.devoluciones.length === 0 ? (
                <p className="bajada">No hay devoluciones en este rango.</p>
              ) : (
                <>
                  <div className="datos-ficha">
                    {Object.entries(contarPorMotivo(ventana.devoluciones)).map(([motivo, cantidad]) => (
                      <div key={motivo}>
                        <b>{cantidad}</b>
                        <small>{NOMBRES_MOTIVO[motivo]}</small>
                      </div>
                    ))}
                  </div>

                  <ul className="lista-ventana">
                    {ventana.devoluciones.map((devolucion, indice) => {
                      // Cuántas veces esta misma persona devolvió a este mismo animal
                      const vecesMismaPersona = ventana.devoluciones.filter(
                        (otra) =>
                          otra.codigoAnimal === devolucion.codigoAnimal &&
                          otra.postulante &&
                          otra.postulante === devolucion.postulante
                      ).length;
                      return (
                        <li key={indice}>
                          <div className="info-fila">
                            <strong>{ventana.mostrarNombres ? devolucion.animal : NOMBRES_MOTIVO[devolucion.motivo]}</strong>
                            {vecesMismaPersona > 1 && (
                              <span className="sello">Devuelto {vecesMismaPersona} veces por {devolucion.postulante}</span>
                            )}
                            <span>
                              {ventana.mostrarNombres && `${NOMBRES_MOTIVO[devolucion.motivo]} · `}
                              {formatearFecha(devolucion.fecha)}
                            </span>
                            <span>
                              Recibió {devolucion.receptor ?? "Sin registrar"} · Devolvió {devolucion.postulante ?? "Sin registrar"}
                            </span>
                          </div>
                          {ventana.mostrarNombres && devolucion.ficha && (
                            <button type="button" className="boton-mini" onClick={() => setFichaAbierta(devolucion)}>
                              Ver ficha
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {ventana.repetidos.map((repetido) => (
                    <p key={`${repetido.codigoAnimal}-${repetido.motivo}`} className="mensaje mensaje-alerta">
                      ⚠️ {repetido.animal} fue devuelto {repetido.cantidad} veces por {NOMBRES_MOTIVO[repetido.motivo]}
                    </p>
                  ))}
                </>
              )}

              {ventana.animal && (
                <button type="button" className="boton boton-secundario" onClick={() => setFichaAbierta(ventana.animal)}>
                  Ver ficha
                </button>
              )}
              {ventana.pie && <p className="pie-ventana">{ventana.pie}</p>}
            </div>

            {fichaAbierta && (
              <div className="ficha-animal ficha-lado" onClick={(e) => e.stopPropagation()}>
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
            )}
          </div>
        </div>
      )}
    </section>
    );  

}
export default ReporteDevolucionesPage;