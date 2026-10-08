import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import RegistroPage from "./pages/RegistroPage.jsx";
import AlertasSanitariasPage from "./pages/AlertasSanitariasPage.jsx";

function App() {
  return (
    <div className="app">
      <header className="barra">
        <Link to="/" className="marca">
          Huellas Sin Hogar
        </Link>

        <nav>
          <Link to="/salud/alertas">Alertas sanitarias</Link>
          <Link to="/">Inicio</Link>
          <Link to="/registro">Registro</Link>
        </nav>
      </header>

      <main className="contenido">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/salud/alertas" element={<AlertasSanitariasPage />}/>

          {/* Cada uno agrega su ruta aqui abajo, una linea por persona */}

          <Route path="*" element={<p>Esta pagina no existe.</p>} />
        </Routes>
      </main>

      <footer className="pie">
        <p>Proyecto de Ingenieria de Software - Universidad del Bio-Bio</p>
      </footer>
    </div>
  );
}

export default App;
