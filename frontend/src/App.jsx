import { useEffect } from "react";
import {Routes,Route,Link,Navigate,matchPath,useLocation,} from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import RegistroPage from "./pages/RegistroPage.jsx";
import AlertasSanitariasPage from "./pages/AlertasSanitariasPage.jsx";
import AdopcionPage from "./pages/AdopcionPage.jsx";
import ReporteDevolucionesPage from "./pages/ReporteDevolucionesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PostulacionPage from "./pages/PostulacionPage.jsx";
import PostulacionesPage from "./pages/PostulacionesPage.jsx";
import PostulacionDetallePage from "./pages/PostulacionDetallePage.jsx";
import PublicarAnimalesPage from "./pages/PublicarAnimalesPage.jsx";
import VoluntariadoPage from "./pages/VoluntariadoPage.jsx";
import PostulacionesVoluntarioPage from "./pages/PostulacionesVoluntarioPage.jsx";
import RegistroMedicoPage from "./pages/RegistroMedicoPage.jsx";
import TurnosPage from "./pages/TurnosPage.jsx";
import MisInscripcionesPage from "./pages/MisInscripcionesPage.jsx";
import useSesion from "./hooks/useSesion.js";
import {puedeGestionarFichas,puedeConsultarAlertas,puedeConsultarReportesDevolucion,puedeRegistrarDevoluciones,puedeGestionarAdopciones,puedeRevisarPostulacionesVoluntario,puedeConsultarRegistroMedico,puedeConsultarTurnos,puedeGestionarInscripciones,NOMBRES_ROL,} from "./utils/permisosUsuario.js";

const TITULOS_POR_RUTA = {
  "/": "Inicio",
  "/login": "Iniciar sesión",
  "/registro": "Registro de animales",
  "/salud/alertas": "Alertas sanitarias",
  "/salud/registros-medicos": "Registro médico",
  "/adopcion": "Adopción",
  "/adopcion/:animalId/postular": "Postular a adopción",
  "/voluntariado": "Voluntariado",
  "/voluntariado/postulaciones": "Postulaciones de voluntariado",
  "/turnos": "Turnos de voluntariado",
  "/turnos/mis-inscripciones": "Mis inscripciones",
  "/postulaciones": "Postulaciones de adopción",
  "/postulaciones/:id": "Detalle de postulación",
  "/adopciones/publicar": "Publicar animales en adopción",
  "/reportes/devoluciones": "Devoluciones",
};
function App() {
  const { pathname } = useLocation();
  const esLogin = Boolean(matchPath("/login", pathname));
  const coincidencia = Object.entries(TITULOS_POR_RUTA).find(
    ([patron]) => matchPath(patron, pathname)
  );
  const tituloPagina = coincidencia?.[1] ?? "Página no encontrada";

  useEffect(() => {
    document.title = `${tituloPagina} | Huellas Sin Hogar`;
  }, [tituloPagina]);

  const {
    usuario,
    cargandoSesion,
    cerrandoSesion,
    mensajeSesion,
    iniciarSesion,
    cerrarSesion,
  } = useSesion();

  if (cargandoSesion) {
    return (
      <main className="contenido">
        <p role="status">Comprobando sesión...</p>
      </main>
    );
  }

  function proteger(pagina, comprobarPermiso) {
    if (!usuario) {
      return <Navigate to="/login" replace />;
    }

    if (!comprobarPermiso(usuario)) {
      return (
        <section className="bloque">
          <h2>Acceso restringido</h2>
          <p>Tu perfil no tiene permiso para utilizar este módulo.</p>
          <Link to="/">Volver al inicio</Link>
        </section>
      );
    }

    return pagina;
  }

  return (
    <div className="app">
      {!esLogin && (
        <header className="barra">
          <Link to="/" className="marca">
            Huellas Sin Hogar
          </Link>

          <nav>
            <Link to="/">Inicio</Link>
            <Link to="/adopcion">Adopción</Link>

            {usuario ? (
              <>
                {puedeGestionarFichas(usuario) && (
                  <Link to="/registro">Registro</Link>
                )}

                {puedeConsultarAlertas(usuario) && (
                  <Link to="/salud/alertas">Alertas sanitarias</Link>
                )}

                {puedeConsultarRegistroMedico(usuario) && (
                  <Link to="/salud/registros-medicos">
                    Registro médico
                  </Link>
                )}

                {(puedeConsultarReportesDevolucion(usuario) ||
                  puedeRegistrarDevoluciones(usuario)) && (
                  <Link to="/reportes/devoluciones">Devoluciones</Link>
                )}

                {puedeGestionarAdopciones(usuario) && (
                  <Link to="/postulaciones">Postulaciones</Link>
                )}

                {puedeRevisarPostulacionesVoluntario(usuario) && (
                  <Link to="/voluntariado/postulaciones">
                    Postulaciones Voluntario
                  </Link>
                )}

                {puedeConsultarTurnos(usuario) && (
                  <Link to="/turnos">Turnos</Link>
                )}

                {puedeGestionarInscripciones(usuario) && (
                  <Link to="/turnos/mis-inscripciones">Mis inscripciones</Link>
                )}

                <span>
                  {usuario.nombre} · {NOMBRES_ROL[usuario.rol]}
                </span>

                <button
                  type="button"
                  className="boton"
                  onClick={cerrarSesion}
                  disabled={cerrandoSesion}
                >
                  {cerrandoSesion ? "Cerrando..." : "Cerrar sesión"}
                </button>
              </>
            ) : (
              <Link to="/login">Iniciar sesión</Link>
            )}
          </nav>
        </header>
      )}

      <main className={esLogin ? "contenido contenido-login" : "contenido"}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={
              usuario ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage
                  onLogin={iniciarSesion}
                  mensajeSesion={mensajeSesion}
                />
              )
            }
          />

          <Route
            path="/registro"
            element={proteger(<RegistroPage />, puedeGestionarFichas)}
          />

          <Route
            path="/salud/alertas"
            element={proteger(
              <AlertasSanitariasPage />,
              puedeConsultarAlertas
            )}
          />

          <Route
            path="/salud/registros-medicos"
            element={proteger(
              <RegistroMedicoPage usuario={usuario} />,
              puedeConsultarRegistroMedico
            )}
          />

          <Route path="/adopcion" element={<AdopcionPage />} />
          <Route
            path="/adopcion/:animalId/postular"
            element={<PostulacionPage />}
          />

          <Route path="/voluntariado" element={<VoluntariadoPage />} />

          <Route
            path="/voluntariado/postulaciones"
            element={proteger(
              <PostulacionesVoluntarioPage />,
              puedeRevisarPostulacionesVoluntario
            )}
          />

          <Route
            path="/turnos"
            element={proteger(
              <TurnosPage usuario={usuario} />,
              puedeConsultarTurnos
            )}
          />

          <Route
            path="/turnos/mis-inscripciones"
            element={proteger(
              <MisInscripcionesPage />,
              puedeGestionarInscripciones
            )}
          />

          <Route
            path="/postulaciones"
            element={proteger(
              <PostulacionesPage />,
              puedeGestionarAdopciones
            )}
          />

          <Route
            path="/postulaciones/:id"
            element={proteger(
              <PostulacionDetallePage />,
              puedeGestionarAdopciones
            )}
          />

          <Route
            path="/adopciones/publicar"
            element={proteger(
              <PublicarAnimalesPage />,
              puedeGestionarAdopciones
            )}
          />

          <Route
            path="/reportes/devoluciones"
            element={proteger(
              <ReporteDevolucionesPage usuario={usuario} />,
              (u) =>
                puedeConsultarReportesDevolucion(u) ||
                puedeRegistrarDevoluciones(u)
            )}
          />

          <Route path="*" element={<p>Esta página no existe.</p>} />
        </Routes>
      </main>

      {!esLogin && (
        <footer className="pie">
          <p>
            Proyecto de Ingeniería de Software - Universidad del Bío-Bío
          </p>
        </footer>
      )}
    </div>
  );
}

export default App;