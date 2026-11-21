import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Campo from "../ui/Campo.jsx";
import Mensaje from "../ui/Mensaje.jsx";
import CampoUbicacion from "./CampoUbicacion.jsx";
import { useFormulario } from "../../hooks/useFormulario.js";
import {
  listarFichas,
  registrarIngreso,
} from "../../services/animalesService.js";
import { listarVoluntarios } from "../../services/voluntariosService.js";
import { ingresoFormSchema } from "../../validations/ingresoValidation.js";
import { fechaHoraActualLocal } from "../../utils/registroAnimal.js";
import "../../styles/formularioIngreso.css";

const INGRESO_INICIAL = {
  codigoAnimal: "",
  receptorId: "",
  fechaIngreso: "",
  procedencia: "",
  ubicacionEncontrado: "",
  estadoSalud: "",
};

async function enviarIngreso(valores) {
  const { fechaIngreso, ...resto } = valores;

  return registrarIngreso({
    ...resto,
    fechaIngreso: new Date(fechaIngreso).toISOString(),
  });
}

function textoOpcionFicha(fichaAnimal) {
  const nombre = fichaAnimal.nombre?.trim();

  return nombre
    ? `${fichaAnimal.codigoAnimal} — ${nombre}`
    : fichaAnimal.codigoAnimal;
}

export default function FormularioIngreso() {
  const [parametros] = useSearchParams();
  const [receptores, setReceptores] = useState([]);
  const [fichas, setFichas] = useState([]);
  const codigoInicial = parametros.get("codigo") ?? "";

  const ingreso = useFormulario({
    iniciales: () => ({
      ...INGRESO_INICIAL,
      codigoAnimal: codigoInicial,
      fechaIngreso: fechaHoraActualLocal(),
    }),
    esquema: ingresoFormSchema,
    enviar: enviarIngreso,
    mensajeExito: (respuesta) => `Ingreso registrado: ${respuesta.codigoAnimal}`,
  });

  useEffect(() => {
    listarVoluntarios()
      .then((respuesta) => setReceptores(respuesta.voluntarios))
      .catch(() => setReceptores([]));

    listarFichas()
      .then((respuesta) => setFichas(respuesta.fichas))
      .catch(() => setFichas([]));
  }, []);

  const opcionesReceptor = [
    { valor: "", texto: "Seleccione responsable..." },
    ...receptores.map((voluntario) => ({
      valor: String(voluntario.id),
      texto: voluntario.nombre,
    })),
  ];

  const opcionesFicha = [
    { valor: "", texto: "Seleccione una ficha existente..." },
    ...fichas.map((fichaAnimal) => ({
      valor: fichaAnimal.codigoAnimal,
      texto: textoOpcionFicha(fichaAnimal),
    })),
  ];

  return (
    <div className="ingreso-card">
      <header className="ingreso-card-cabecera">
        <div className="ingreso-card-titulos">
          <span className="ingreso-eyebrow">Registro Operativo</span>
          <h1>Registrar ingreso de animal</h1>
        </div>

        <div className="ingreso-control">
          <span className="material-symbols-outlined" aria-hidden="true">
            assignment_add
          </span>
          <div>
            <span className="ingreso-control-titulo">
              Control de Recepción
            </span>
            <span className="ingreso-control-texto">
              Complete los datos del ingreso
            </span>
          </div>
        </div>
      </header>

      <form
        className="ingreso-form"
        onSubmit={ingreso.enviarFormulario}
        noValidate
      >
        <div className="ingreso-grid">
          <Campo
            etiqueta="Código de la ficha"
            nombre="codigoAnimal"
            control="select"
            requerido
            icono="expand_more"
            opciones={opcionesFicha}
            valor={ingreso.valores.codigoAnimal}
            error={ingreso.errores.codigoAnimal}
            onChange={(evento) =>
              ingreso.cambiar("codigoAnimal", evento.target.value)
            }
          />

          <div className="ingreso-aviso">
            <span
              className="material-symbols-outlined ingreso-aviso-icono"
              aria-hidden="true"
            >
              info
            </span>
            <p>
              Para una ficha nueva, regístrala en la sección{" "}
              <strong>Registrar ficha de animal</strong>; el código se genera
              automáticamente.
            </p>
          </div>

          <Campo
            etiqueta="Fecha y hora de ingreso"
            nombre="fechaIngreso"
            type="datetime-local"
            requerido
            valor={ingreso.valores.fechaIngreso}
            error={ingreso.errores.fechaIngreso}
            onChange={(evento) =>
              ingreso.cambiar("fechaIngreso", evento.target.value)
            }
          />

          <Campo
            etiqueta="Receptor"
            nombre="receptorId"
            control="select"
            requerido
            icono="expand_more"
            opciones={opcionesReceptor}
            valor={ingreso.valores.receptorId}
            error={ingreso.errores.receptorId}
            onChange={(evento) =>
              ingreso.cambiar("receptorId", evento.target.value)
            }
          />

          <Campo
            etiqueta="Procedencia"
            nombre="procedencia"
            requerido
            ancho
            valor={ingreso.valores.procedencia}
            error={ingreso.errores.procedencia}
            maxLength={255}
            placeholder="Vía pública, devolución, entrega voluntaria..."
            onChange={(evento) =>
              ingreso.cambiar("procedencia", evento.target.value)
            }
          />

          <CampoUbicacion
            valor={ingreso.valores.ubicacionEncontrado}
            error={ingreso.errores.ubicacionEncontrado}
            onChange={(valor) =>
              ingreso.cambiar("ubicacionEncontrado", valor)
            }
          />

          <Campo
            etiqueta="Estado de salud"
            nombre="estadoSalud"
            opcional
            opcionalPildora
            icono="medical_services"
            valor={ingreso.valores.estadoSalud}
            error={ingreso.errores.estadoSalud}
            maxLength={255}
            placeholder="Ej. Estable, deshidratación leve, herida superficial"
            onChange={(evento) =>
              ingreso.cambiar("estadoSalud", evento.target.value)
            }
          />
        </div>

        {ingreso.mensaje && (
          <div className="ingreso-mensaje">
            <Mensaje mensaje={ingreso.mensaje} />
          </div>
        )}

        <div className="ingreso-pie">
          <span className="ingreso-pie-nota">
            <span className="ingreso-pie-asterisco" aria-hidden="true">
              *
            </span>
            Campos obligatorios para registrar el ingreso
          </span>

          <button className="ingreso-boton" type="submit">
            <span className="material-symbols-outlined" aria-hidden="true">
              check_circle
            </span>
            Registrar ingreso
          </button>
        </div>
      </form>
    </div>
  );
}
