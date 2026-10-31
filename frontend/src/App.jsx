import { Routes, Route, Link, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import RegistroPage from "./pages/RegistroPage.jsx";
import AlertasSanitariasPage from "./pages/AlertasSanitariasPage.jsx";
import AdopcionPage from "./pages/AdopcionPage.jsx";
import ReporteDevolucionesPage from "./pages/ReporteDevolucionesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PostulacionPage from "./pages/PostulacionPage.jsx";
import PostulacionesPage from "./pages/PostulacionesPage.jsx";
import PostulacionDetallePage from "./pages/PostulacionDetallePage.jsx";
import useSesion from "./hooks/useSesion.js";
import {puedeGestionarFichas,puedeConsultarAlertas,puedeConsultarReportesDevolucion,puedeGestionarAdopciones,NOMBRES_ROL,} from "./utils/permisosUsuario.js";
function App() {
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
          <p>
            Tu perfil no tiene permiso para utilizar este módulo.
          </p>
          <Link to="/">Volver al inicio</Link>
        </section>
      );
    }

    return pagina;
  }

  return (
    <div className="app">
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
                <Link to="/salud/alertas">
                  Alertas sanitarias
                </Link>
              )}

              {puedeConsultarReportesDevolucion(usuario) && (
                <Link to="/reportes/devoluciones">
                  Devoluciones
                </Link>
              )}
              {puedeGestionarAdopciones(usuario) && (
                <Link to="/postulaciones">
                  Postulaciones
                </Link>
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
                {cerrandoSesion
                  ? "Cerrando..."
                  : "Cerrar sesión"}
              </button>
            </>
          ) : (
            <Link to="/login">Iniciar sesión</Link>
          )}
        </nav>
      </header>

      <main className="contenido">
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
            element={proteger(
              <RegistroPage />,
              puedeGestionarFichas
            )}
          />

          <Route
            path="/salud/alertas"
            element={proteger(
              <AlertasSanitariasPage />,
              puedeConsultarAlertas
            )}
          />

          <Route
            path="/adopcion"
            element={<AdopcionPage />}
          />
          <Route
            path="/adopcion/:animalId/postular"
            element={<PostulacionPage />}
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
            path="/reportes/devoluciones"
            element={proteger(
              <ReporteDevolucionesPage />,
              puedeConsultarReportesDevolucion
            )}
          />

          <Route
            path="*"
            element={<p>Esta página no existe.</p>}
          />
        </Routes>
      </main>

      <footer className="pie">
        <p>
          Proyecto de Ingeniería de Software -
          Universidad del Bío-Bío
        </p>
      </footer>
    </div>
  );
}

export default App;