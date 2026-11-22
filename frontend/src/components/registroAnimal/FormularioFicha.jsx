import { useState } from "react";
import Campo from "../ui/Campo.jsx";
import CampoImagenFicha from "./CampoImagenFicha.jsx";
import Mensaje from "../ui/Mensaje.jsx";
import { useFormulario } from "../../hooks/useFormulario.js";
import { crearFicha, crearFichaConImagen } from "../../services/animalesService.js";
import {
  imagenOpcionalSchema,
  validarArchivoImagen,
} from "../../validations/imagenAnimalValidation.js";
import { fichaFormSchema } from "../../validations/fichaValidation.js";
import {
  OPCIONES_ESPECIE,
  OPCIONES_SEXO,
} from "../../utils/registroAnimal.js";
import "../../styles/formularioFicha.css";

const FICHA_INICIAL = {
  nombre: "",
  sexoAnimal: "",
  especie: "",
  raza: "",
  edad: "",
  observaciones: "",
  imagen: null,
};

const fichaFormConImagenSchema = fichaFormSchema.extend({
  imagen: imagenOpcionalSchema,
});

export default function FormularioFicha() {
  const [errorArchivo, setErrorArchivo] = useState(null);

  const ficha = useFormulario({
    iniciales: FICHA_INICIAL,
    esquema: fichaFormConImagenSchema,
    enviar: async ({ imagen, ...datos }) => {
      setErrorArchivo(null);

      return imagen
        ? crearFichaConImagen(datos, imagen)
        : crearFicha(datos);
    },
    mensajeExito: (respuesta) => `Ficha creada: ${respuesta.codigoAnimal}`,
  });

  function cambiarImagen(archivo) {
    if (!archivo) {
      setErrorArchivo(null);
      ficha.cambiar("imagen", null);
      return;
    }

    const error = validarArchivoImagen(archivo);
    setErrorArchivo(error);
    ficha.cambiar("imagen", error ? null : archivo);
  }

  function cancelar() {
    setErrorArchivo(null);
    ficha.reiniciar();
  }

  return (
    <form className="ficha-form" onSubmit={ficha.enviarFormulario} noValidate>
      <section className="ficha-seccion">
        <div className="ficha-seccion-cabecera">
          <span
            className="ficha-seccion-icono ficha-icono-verde material-symbols-outlined"
            aria-hidden="true"
          >
            pets
          </span>
          <div>
            <h2>1. Datos básicos</h2>
            <p>Información general de identificación del animal.</p>
          </div>
        </div>

        <div className="ficha-grid">
          <Campo
            etiqueta="Nombre"
            nombre="nombre"
            opcional
            valor={ficha.valores.nombre}
            error={ficha.errores.nombre}
            maxLength={255}
            placeholder="Ej. Luna, Toby..."
            onChange={(evento) => ficha.cambiar("nombre", evento.target.value)}
          />

          <Campo
            etiqueta="Especie"
            nombre="especie"
            requerido
            control="select"
            opciones={OPCIONES_ESPECIE}
            valor={ficha.valores.especie}
            error={ficha.errores.especie}
            onChange={(evento) => ficha.cambiar("especie", evento.target.value)}
          />

          <Campo
            etiqueta="Raza"
            nombre="raza"
            opcional
            valor={ficha.valores.raza}
            error={ficha.errores.raza}
            maxLength={255}
            placeholder="Ej. Mestizo, Labrador..."
            onChange={(evento) => ficha.cambiar("raza", evento.target.value)}
          />

          <Campo
            etiqueta="Sexo"
            nombre="sexoAnimal"
            requerido
            control="select"
            opciones={OPCIONES_SEXO}
            valor={ficha.valores.sexoAnimal}
            error={ficha.errores.sexoAnimal}
            onChange={(evento) =>
              ficha.cambiar("sexoAnimal", evento.target.value)
            }
          />

          <Campo
            etiqueta="Edad (años)"
            nombre="edad"
            opcional
            type="number"
            min={0}
            step={1}
            valor={ficha.valores.edad}
            error={ficha.errores.edad}
            placeholder="Ej. 2"
            onChange={(evento) => ficha.cambiar("edad", evento.target.value)}
          />
        </div>
      </section>

      <section className="ficha-seccion ficha-seccion-foto">
        <div className="ficha-seccion-cabecera">
          <span
            className="ficha-seccion-icono ficha-icono-arena material-symbols-outlined"
            aria-hidden="true"
          >
            photo_camera
          </span>
          <div>
            <h2>2. Fotografía</h2>
            <p>Imagen del animal para su identificación visual.</p>
          </div>
        </div>

        <CampoImagenFicha
          archivo={ficha.valores.imagen}
          error={errorArchivo ?? ficha.errores.imagen}
          onChange={cambiarImagen}
        />
      </section>

      <section className="ficha-seccion">
        <div className="ficha-seccion-cabecera">
          <span
            className="ficha-seccion-icono ficha-icono-naranja material-symbols-outlined"
            aria-hidden="true"
          >
            notes
          </span>
          <div>
            <h2>3. Notas adicionales</h2>
            <p>
              Detalles relevantes sobre salud, comportamiento o rescate.
            </p>
          </div>
        </div>

        <Campo
          etiqueta="Observaciones"
          nombre="observaciones"
          opcional
          control="textarea"
          rows={4}
          maxLength={255}
          valor={ficha.valores.observaciones}
          error={ficha.errores.observaciones}
          placeholder="Describe señas particulares, estado físico al ingreso o cualquier dato útil para el equipo..."
          onChange={(evento) =>
            ficha.cambiar("observaciones", evento.target.value)
          }
        />
      </section>

      <div className="ficha-acciones">
        <button
          type="button"
          className="ficha-boton ficha-boton-cancelar"
          onClick={cancelar}
        >
          Cancelar
        </button>

        <button type="submit" className="ficha-boton ficha-boton-primario">
          <span className="material-symbols-outlined" aria-hidden="true">
            check
          </span>
          Registrar ficha
        </button>
      </div>

      <Mensaje mensaje={ficha.mensaje} />
    </form>
  );
}
