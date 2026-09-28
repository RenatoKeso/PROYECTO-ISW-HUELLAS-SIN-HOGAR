import Campo from "../components/ui/Campo.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import { crearFicha, registrarIngreso } from "../services/animalesService.js";
import { fichaFormSchema } from "../validations/fichaValidation.js";
import { ingresoFormSchema } from "../validations/ingresoValidation.js";
import { useState, useEffect } from "react";
import { listarVoluntarios } from "../services/voluntariosService.js";

const OPCIONES_SEXO = [
  { valor: "", texto: "Seleccione..." },
  { valor: "MACHO", texto: "Macho" },
  { valor: "HEMBRA", texto: "Hembra" },
  { valor: "DESCONOCIDO", texto: "Desconocido" },
];

const OPCIONES_ESPECIE = [
  { valor: "", texto: "Seleccione..." },
  { valor: "PERRO", texto: "Perro" },
  { valor: "GATO", texto: "Gato" },
  { valor: "OTRO", texto: "Otro" },
];



const FICHA_INICIAL = {
  nombre: "",
  sexoAnimal: "",
  especie: "",
  raza: "",
  edad: "",
  observaciones: "",
};

const INGRESO_INICIAL = {
  codigoAnimal: "",
  receptorId: "",
  fechaIngreso: "",
  procedencia: "",
  ubicacionEncontrado: "",
  estadoSalud: "",
};

function Mensaje({ mensaje }) {
  if (!mensaje) return null;

  return <p className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</p>;
}

async function enviarIngreso(valores) {
  const { fechaIngreso, ...resto } = valores;

  return registrarIngreso({
    ...resto,
    fechaIngreso: new Date(fechaIngreso).toISOString(),
  });
}

function RegistroPage() {
  const ficha = useFormulario({
    iniciales: FICHA_INICIAL,
    esquema: fichaFormSchema,
    enviar: crearFicha,
    mensajeExito: (respuesta) => `Ficha creada: ${respuesta.codigoAnimal}`,
  });

  const ingreso = useFormulario({
    iniciales: INGRESO_INICIAL,
    esquema: ingresoFormSchema,
    enviar: enviarIngreso,
    mensajeExito: (respuesta) => `Ingreso registrado: ${respuesta.codigoAnimal}`,
  });
const [receptores, setReceptores] = useState([]);

useEffect(() => {
  listarVoluntarios()
    .then((respuesta) => setReceptores(respuesta.voluntarios))
    .catch(() => setReceptores([]));
}, []);

const opcionesReceptor = [
  { valor: "", texto: "Seleccione..." },
  ...receptores.map((v) => ({ valor: String(v.id), texto: v.nombre })),
];


  return (
    <section className="bloque">
      <form className="formulario" onSubmit={ficha.enviarFormulario} noValidate>
        <h2>registrar ficha</h2>

        <div className="formulario-campos">
          <Campo
            etiqueta="Nombre"
            nombre="nombre"
            valor={ficha.valores.nombre}
            error={ficha.errores.nombre}
            maxLength={255}
            placeholder="Opcional"
            onChange={(evento) => ficha.cambiar("nombre", evento.target.value)}
          />

          <Campo
            etiqueta="Sexo"
            nombre="sexoAnimal"
            control="select"
            opciones={OPCIONES_SEXO}
            valor={ficha.valores.sexoAnimal}
            error={ficha.errores.sexoAnimal}
            onChange={(evento) =>
              ficha.cambiar("sexoAnimal", evento.target.value)
            }
          />

          <Campo
            etiqueta="Especie"
            nombre="especie"
            control="select"
            opciones={OPCIONES_ESPECIE}
            valor={ficha.valores.especie}
            error={ficha.errores.especie}
            onChange={(evento) => ficha.cambiar("especie", evento.target.value)}
          />

          <Campo
            etiqueta="Raza"
            nombre="raza"
            valor={ficha.valores.raza}
            error={ficha.errores.raza}
            maxLength={255}
            placeholder="Opcional"
            onChange={(evento) => ficha.cambiar("raza", evento.target.value)}
          />

          <Campo
            etiqueta="Edad (años)"
            nombre="edad"
            type="number"
            min={0}
            step={1}
            valor={ficha.valores.edad}
            error={ficha.errores.edad}
            placeholder="Opcional"
            onChange={(evento) => ficha.cambiar("edad", evento.target.value)}
          />

          <Campo
            etiqueta="Observaciones"
            nombre="observaciones"
            control="textarea"
            rows={3}
            maxLength={255}
            ancho
            valor={ficha.valores.observaciones}
            error={ficha.errores.observaciones}
            placeholder="Opcional"
            onChange={(evento) =>
              ficha.cambiar("observaciones", evento.target.value)
            }
          />
        </div>

        <button className="boton" type="submit">
          Registrar ficha
        </button>

        <Mensaje mensaje={ficha.mensaje} />
      </form>

      <form className="formulario" onSubmit={ingreso.enviarFormulario} noValidate>
        <h2>registrar ingreso</h2>

        <div className="formulario-campos">
          <Campo
            etiqueta="Código de la ficha"
            nombre="codigoAnimal"
            valor={ingreso.valores.codigoAnimal}
            error={ingreso.errores.codigoAnimal}
            maxLength={32}
            placeholder="anim-001"
            onChange={(evento) =>
              ingreso.cambiar("codigoAnimal", evento.target.value)
            }
          />

          <Campo
            etiqueta="Receptor"
            nombre="receptorId"
            control="select"
            opciones={opcionesReceptor}
            valor={ingreso.valores.receptorId}
            error={ingreso.errores.receptorId}
            onChange={(evento) =>
              ingreso.cambiar("receptorId", evento.target.value)
            }
          />

          <Campo
            etiqueta="Fecha y hora de ingreso"
            nombre="fechaIngreso"
            type="datetime-local"
            valor={ingreso.valores.fechaIngreso}
            error={ingreso.errores.fechaIngreso}
            onChange={(evento) =>
              ingreso.cambiar("fechaIngreso", evento.target.value)
            }
          />

          <Campo
            etiqueta="Procedencia"
            nombre="procedencia"
            valor={ingreso.valores.procedencia}
            error={ingreso.errores.procedencia}
            maxLength={255}
            placeholder="Via pública, devolución, entrega voluntaria..."
            onChange={(evento) =>
              ingreso.cambiar("procedencia", evento.target.value)
            }
          />

          <Campo
            etiqueta="Ubicación de hallazgo"
            nombre="ubicacionEncontrado"
            valor={ingreso.valores.ubicacionEncontrado}
            error={ingreso.errores.ubicacionEncontrado}
            maxLength={255}
            placeholder="Opcional"
            onChange={(evento) =>
              ingreso.cambiar("ubicacionEncontrado", evento.target.value)
            }
          />

          <Campo
            etiqueta="Estado de salud"
            nombre="estadoSalud"
            valor={ingreso.valores.estadoSalud}
            error={ingreso.errores.estadoSalud}
            maxLength={255}
            placeholder="Opcional"
            onChange={(evento) =>
              ingreso.cambiar("estadoSalud", evento.target.value)
            }
          />
        </div>

        <button className="boton" type="submit">
          Registrar ingreso
        </button>

        <Mensaje mensaje={ingreso.mensaje} />
      </form>
    </section>
  );
}

export default RegistroPage;
