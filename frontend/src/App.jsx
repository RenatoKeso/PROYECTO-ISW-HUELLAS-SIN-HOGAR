import { useEffect, useState } from "react";
import { Routes, Route, Link, NavLink, Navigate, matchPath, useLocation, } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import RegistroPage from "./pages/RegistroPage.jsx";
import RegistroFichaPage from "./pages/RegistroFichaPage.jsx";
import RegistroIngresoPage from "./pages/RegistroIngresoPage.jsx";
import RegistroFichasPage from "./pages/RegistroFichasPage.jsx";
import RegistroHistorialPage from "./pages/RegistroHistorialPage.jsx";
import AlertasSanitariasPage from "./pages/AlertasSanitariasPage.jsx";
import AdopcionPage from "./pages/AdopcionPage.jsx";
import ReporteDevolucionesPage from "./pages/ReporteDevolucionesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PostulacionPage from "./pages/PostulacionPage.jsx";
import PostulacionesPage from "./pages/PostulacionesPage.jsx";
import PostulacionDetallePage from "./pages/PostulacionDetallePage.jsx";
import VoluntariadoPage from "./pages/VoluntariadoPage.jsx";
import PostulacionesVoluntarioPage from "./pages/PostulacionesVoluntarioPage.jsx";
import RegistroMedicoPage from "./pages/RegistroMedicoPage.jsx";
import TurnosPage from "./pages/TurnosPage.jsx";
import useSesion from "./hooks/useSesion.js";
import {puedeGestionarFichas,puedeConsultarAlertas,puedeConsultarReportesDevolucion,puedeRegistrarDevoluciones,puedeGestionarAdopciones,puedeRevisarPostulacionesVoluntario,puedeConsultarRegistroMedico,puedeConsultarTurnos,NOMBRES_ROL,} from "./utils/permisosUsuario.js";
import DonacionesPage from "./pages/DonacionesPage.jsx";
import GestionDonacionesPage from "./pages/GestionDonacionesPage.jsx";
import { puedeGestionarDonaciones } from "./utils/permisosUsuario.js";


const TITULOS_POR_RUTA = {
  "/": "Inicio",
  "/login": "Iniciar sesión",
  "/registro": "Registro de animales",
  "/registro/ficha": "Registrar ficha de animal",
  "/registro/ingreso": "Registrar ingreso de animal",
  "/registro/fichas": "Lista de fichas",
  "/registro/historial": "Historial de ingresos",
  "/salud/alertas": "Alertas sanitarias",
  "/salud/registros-medicos": "Registro médico",
  "/adopcion": "Adopción",
  "/adopcion/postular": "Postular a adopción",
  "/voluntariado": "Voluntariado",
  "/voluntariado/postulaciones": "Postulaciones de voluntariado",
  "/turnos": "Turnos de voluntariado",
  "/postulaciones": "Postulaciones de adopción",
  "/postulaciones/:id": "Detalle de postulación",
  "/reportes/devoluciones": "Devoluciones",
  "/donaciones": "Donar",
  "/donaciones/gestion": "Administrar donaciones",
};
function App() {
  const { pathname } = useLocation();
  const esLogin = Boolean(matchPath("/login", pathname));
  const coincidencia = Object.entries(TITULOS_POR_RUTA).find(
    ([patron]) => matchPath(patron, pathname)
  );
  const tituloPagina = coincidencia?.[1] ?? "Página no encontrada";

  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

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
          <div className="barra-izquierda">
            <Link to="/" className="marca">
              Huellas Sin Hogar
            </Link>
          </div>

          {usuario ? (
            <div className="usuario-barra">
              <span className="usuario-icono">
                {usuario.nombre.charAt(0).toUpperCase()}
              </span>

              <div className="usuario-datos">
                <strong>{usuario.nombre}</strong>
                <small>{NOMBRES_ROL[usuario.rol]}</small>
              </div>

              <button
                type="button"
                className="boton-menu"
                onClick={() => setMenuAbierto(!menuAbierto)}
                aria-label="Abrir menú"
              >
                ☰
              </button>
            </div>
          ) : (
            <nav>
              <Link to="/login">Iniciar sesión</Link>
            </nav>
          )}
        </header>
      )}

      <div className="cuerpo">
        {usuario && !esLogin && menuAbierto && (
          <div className="fondo-menu" onClick={() => setMenuAbierto(false)} />
        )}

        {usuario && !esLogin && (
          <aside className={menuAbierto ? "menu-lateral abierto" : "menu-lateral"}>
            <nav>
              <NavLink to="/" end>🏠 Inicio</NavLink>
              <NavLink to="/adopcion" end>🐶 Adopción</NavLink>

              {puedeGestionarFichas(usuario) && (
                <NavLink to="/registro">📝 Registro de animales</NavLink>
              )}

              {puedeConsultarAlertas(usuario) && (
                <NavLink to="/salud/alertas">🚨 Alertas sanitarias</NavLink>
              )}

              {puedeConsultarRegistroMedico(usuario) && (
                <NavLink to="/salud/registros-medicos">🩺 Registro médico</NavLink>
              )}

              {(puedeConsultarReportesDevolucion(usuario) ||
                puedeRegistrarDevoluciones(usuario)) && (
                  <NavLink to="/reportes/devoluciones">↩️ Devoluciones</NavLink>
                )}

              {puedeGestionarAdopciones(usuario) && (
                <NavLink to="/postulaciones">📋 Postulaciones</NavLink>
              )}

              {puedeGestionarDonaciones(usuario) && (
                <NavLink to="/donaciones/gestion">
                  Donaciones
                </NavLink>
              )}

              {puedeRevisarPostulacionesVoluntario(usuario) && (
                <NavLink to="/voluntariado/postulaciones">🙋 Postulaciones Voluntario</NavLink>
              )}

              {puedeConsultarTurnos(usuario) && (
                <NavLink to="/turnos" end>📅 Turnos</NavLink>
              )}

              <button
                type="button"
                className="cerrar-lateral"
                onClick={cerrarSesion}
                disabled={cerrandoSesion}
              >
                🚪 {cerrandoSesion ? "Cerrando..." : "Cerrar sesión"}
              </button>
            </nav>
          </aside>
        )}

        <div className="columna-contenido">
          <main className={esLogin ? "contenido contenido-login" : "contenido"}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              
                <Route
                path="/donaciones"
                element={<DonacionesPage />}
              />

              <Route
                path="/donaciones/gestion"
                element={proteger(
                  <GestionDonacionesPage />,
                  puedeGestionarDonaciones
                )}
              />

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
                path="/registro/ficha"
                element={proteger(<RegistroFichaPage />, puedeGestionarFichas)}
              />

              <Route
                path="/registro/ingreso"
                element={proteger(
                  <RegistroIngresoPage />,
                  puedeGestionarFichas
                )}
              />

              <Route
                path="/registro/fichas"
                element={proteger(<RegistroFichasPage />, puedeGestionarFichas)}
              />

              <Route
                path="/registro/historial"
                element={proteger(
                  <RegistroHistorialPage />,
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
                path="/salud/registros-medicos"
                element={proteger(
                  <RegistroMedicoPage usuario={usuario} />,
                  puedeConsultarRegistroMedico
                )}
              />

              <Route path="/adopcion" element={<AdopcionPage />} />
              <Route
                path="/adopcion/postular"
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

              {/* Mis inscripciones ahora es el filtro del calendario de /turnos. */}
              <Route
                path="/turnos/mis-inscripciones"
                element={<Navigate to="/turnos" replace />}
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
      </div>
    </div>
  );
}

export default App;
