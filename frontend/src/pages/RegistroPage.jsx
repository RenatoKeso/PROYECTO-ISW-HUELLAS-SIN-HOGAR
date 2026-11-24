import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listarFichas,
  listarIngresosGlobales,
} from "../services/animalesService.js";
import "../styles/registroHub.css";

const ACCIONES = [
  {
    icono: "assignment_add",
    tema: "verde",
    titulo: "Registrar ficha de animal",
    descripcion: "Crea la ficha básica del animal y agrega su imagen.",
    ruta: "/registro/ficha",
  },
  {
    icono: "add_home",
    tema: "naranja",
    titulo: "Registrar ingreso de animal",
    descripcion: "Registra el ingreso o reingreso de un animal al refugio.",
    ruta: "/registro/ingreso",
  },
  {
    icono: "list_alt",
    tema: "arena",
    titulo: "Lista de fichas",
    descripcion: "Consulta, busca y actualiza las imágenes de las fichas.",
    ruta: "/registro/fichas",
  },
  {
    icono: "history",
    tema: "neutro",
    titulo: "Historial de ingresos",
    descripcion: "Revisa todos los ingresos registrados y filtra por animal.",
    ruta: "/registro/historial",
  },
];

export default function RegistroPage() {
  const [conteos, setConteos] = useState({ fichas: null, ingresos: null });
  const [cargandoConteos, setCargandoConteos] = useState(true);

  useEffect(() => {
    let vigente = true;

    Promise.allSettled([listarFichas(), listarIngresosGlobales()]).then(
      ([fichas, ingresos]) => {
        if (!vigente) return;

        setConteos({
          fichas:
            fichas.status === "fulfilled" ? fichas.value.fichas.length : null,
          ingresos:
            ingresos.status === "fulfilled"
              ? ingresos.value.ingresos.length
              : null,
        });
        setCargandoConteos(false);
      },
    );

    return () => {
      vigente = false;
    };
  }, []);

  function valorConteo(cantidad) {
    if (cargandoConteos) return "...";
    return cantidad ?? "—";
  }

  return (
    <section className="registro-hub">
      <div className="registro-hub-encabezado">
        <div className="registro-hub-titulos">
          <div className="registro-hub-migas">
            <span className="registro-hub-badge">Módulo Operativo</span>
            <span className="registro-hub-ruta">/ Gestión de Refugio</span>
          </div>
          <h1>Registro de animales</h1>
          <p>Selecciona la acción que necesitas realizar.</p>
        </div>

        <div className="registro-hub-contadores" aria-live="polite">
          <div className="registro-hub-contador">
            <span
              className="registro-hub-contador-icono material-symbols-outlined"
              aria-hidden="true"
            >
              pets
            </span>
            <div>
              <span className="registro-hub-contador-etiqueta">
                Fichas existentes
              </span>
              <strong className="registro-hub-contador-valor">
                {valorConteo(conteos.fichas)}
              </strong>
            </div>
          </div>

          <div className="registro-hub-contador">
            <span
              className="registro-hub-contador-icono material-symbols-outlined"
              aria-hidden="true"
            >
              history
            </span>
            <div>
              <span className="registro-hub-contador-etiqueta">
                Animales ingresados
              </span>
              <strong className="registro-hub-contador-valor">
                {valorConteo(conteos.ingresos)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <section
        className="registro-hub-acciones"
        aria-label="Acciones principales"
      >
        {ACCIONES.map((accion) => (
          <Link
            className={`registro-hub-tarjeta registro-hub-tarjeta-${accion.tema}`}
            key={accion.ruta}
            to={accion.ruta}
          >
            <div className="registro-hub-tarjeta-superior">
              <span
                className="registro-hub-icono material-symbols-outlined"
                aria-hidden="true"
              >
                {accion.icono}
              </span>
            </div>

            <div className="registro-hub-tarjeta-texto">
              <h2>{accion.titulo}</h2>
              <p>{accion.descripcion}</p>
            </div>

            <span className="registro-hub-abrir">
              Abrir <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </section>
    </section>
  );
}
