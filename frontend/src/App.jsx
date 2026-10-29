import { Routes, Route, Link, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import RegistroPage from "./pages/RegistroPage.jsx";
import AlertasSanitariasPage from "./pages/AlertasSanitariasPage.jsx";
import AdopcionPage from "./pages/AdopcionPage.jsx";
import ReporteDevolucionesPage from "./pages/ReporteDevolucionesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import useSesion from "./hooks/useSesion.js";

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

  function proteger(pagina) {
    return usuario
      ? pagina
      : <Navigate to="/login" replace />;
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
              <Link to="/registro">Registro</Link>
              <Link to="/salud/alertas">Alertas sanitarias</Link>
              <Link to="/reportes/devoluciones">
                Devoluciones
              </Link>

              <span>{usuario.nombre}</span>

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
            element={proteger(<RegistroPage />)}
          />

          <Route
            path="/salud/alertas"
            element={proteger(<AlertasSanitariasPage />)}
          />

          <Route path="/adopcion" element={<AdopcionPage />} />

          <Route
            path="/reportes/devoluciones"
            element={proteger(<ReporteDevolucionesPage />)}
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