import { useCallback, useEffect, useState } from "react";
import Campo from "../components/ui/Campo.jsx";
import CampoArchivo from "../components/ui/CampoArchivo.jsx";
import Mensaje from "../components/ui/Mensaje.jsx";
import VentanaModal from "../components/ui/VentanaModal.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import {
  crearFicha,
  crearFichaConImagen,
  listarFichas,
  quitarImagenFicha,
  registrarIngreso,
  subirImagenFicha,
} from "../services/animalesService.js";
import { listarVoluntarios } from "../services/voluntariosService.js";
import {
  imagenOpcionalSchema,
  validarArchivoImagen,
} from "../validations/imagenAnimalValidation.js";
import { fichaFormSchema } from "../validations/fichaValidation.js";
import { ingresoFormSchema } from "../validations/ingresoValidation.js";
import { urlImagen } from "../utils/urlImagen.js";
import "../styles/registroFichas.css";

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

const NOMBRES_ESPECIE = {
  PERRO: "Perro",
  GATO: "Gato",
  OTRO: "Otra especie",
};

function nombreVisible(fichaAnimal) {
  return fichaAnimal.nombre || fichaAnimal.codigoAnimal;
}

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

function RegistroPage() {
  const [receptores, setReceptores] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [cargandoFichas, setCargandoFichas] = useState(true);
  const [errorFichas, setErrorFichas] = useState("");
  const [errorArchivo, setErrorArchivo] = useState(null);
  const [mensajeImagen, setMensajeImagen] = useState(null);
  const [procesandoImagenId, setProcesandoImagenId] = useState(null);
  const [ventana, setVentana] = useState(null);

  const cargarFichas = useCallback(async () => {
    try {
      const respuesta = await listarFichas();
      setFichas(respuesta.fichas);
      setErrorFichas("");
    } catch (error) {
      setErrorFichas(error.message);
    } finally {
      setCargandoFichas(false);
    }
  }, []);

  const ficha = useFormulario({
    iniciales: FICHA_INICIAL,
    esquema: fichaFormConImagenSchema,
    enviar: async ({ imagen, ...datos }) => {
      setErrorArchivo(null);

      const respuesta = imagen
        ? await crearFichaConImagen(datos, imagen)
        : await crearFicha(datos);

      await cargarFichas();
      return respuesta;
    },
    mensajeExito: (respuesta) => `Ficha creada: ${respuesta.codigoAnimal}`,
  });

  const ingreso = useFormulario({
    iniciales: INGRESO_INICIAL,
    esquema: ingresoFormSchema,
    enviar: enviarIngreso,
    mensajeExito: (respuesta) => `Ingreso registrado: ${respuesta.codigoAnimal}`,
  });

  useEffect(() => {
    listarVoluntarios()
      .then((respuesta) => setReceptores(respuesta.voluntarios))
      .catch(() => setReceptores([]));
  }, []);

  useEffect(() => {
    let vigente = true;

    listarFichas()
      .then((respuesta) => {
        if (!vigente) return;
        setFichas(respuesta.fichas);
        setErrorFichas("");
      })
      .catch((error) => {
        if (vigente) setErrorFichas(error.message);
      })
      .finally(() => {
        if (vigente) setCargandoFichas(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const opcionesReceptor = [
    { valor: "", texto: "Seleccione..." },
    ...receptores.map((voluntario) => ({
      valor: String(voluntario.id),
      texto: voluntario.nombre,
    })),
  ];

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

  const cerrarVentana = useCallback(() => setVentana(null), []);

  function abrirImagen(fichaAnimal) {
    const nombre = nombreVisible(fichaAnimal);

    setVentana({
      tipo: "imagen",
      src: urlImagen(fichaAnimal.imagenUrl),
      alt: `Imagen de ${nombre}`,
      ariaLabel: `Imagen ampliada de ${nombre}`,
    });
  }

  function abrirObservaciones(fichaAnimal) {
    setVentana({
      tipo: "observaciones",
      titulo: `Observaciones de ${nombreVisible(fichaAnimal)}`,
      texto: fichaAnimal.observaciones.trim(),
    });
  }

  function actualizarFichaEnLista(fichaActualizada) {
    setFichas((actuales) =>
      actuales.map((otra) =>
        otra.id === fichaActualizada.id
          ? { ...otra, ...fichaActualizada }
          : otra,
      ),
    );
  }

  async function subirImagen(fichaAnimal, archivo) {
    if (!archivo) return;

    const error = validarArchivoImagen(archivo);

    if (error) {
      setMensajeImagen({ tipo: "error", texto: error });
      return;
    }

    setMensajeImagen(null);
    setProcesandoImagenId(fichaAnimal.id);

    try {
      const respuesta = await subirImagenFicha(fichaAnimal.id, archivo);
      actualizarFichaEnLista(respuesta.ficha);
      setMensajeImagen({
        tipo: "exito",
        texto: `Imagen de ${fichaAnimal.codigoAnimal} actualizada correctamente.`,
      });
    } catch (errorSubida) {
      setMensajeImagen({ tipo: "error", texto: errorSubida.message });
    } finally {
      setProcesandoImagenId(null);
    }
  }

  async function quitarImagen(fichaAnimal) {
    setMensajeImagen(null);
    setProcesandoImagenId(fichaAnimal.id);

    try {
      const respuesta = await quitarImagenFicha(fichaAnimal.id);
      actualizarFichaEnLista(respuesta.ficha);
      setMensajeImagen({
        tipo: "exito",
        texto: `Imagen de ${fichaAnimal.codigoAnimal} eliminada correctamente.`,
      });
    } catch (errorQuitar) {
      setMensajeImagen({ tipo: "error", texto: errorQuitar.message });
    } finally {
      setProcesandoImagenId(null);
    }
  }

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

          <CampoArchivo
            etiqueta="Imagen del animal"
            nombre="imagen"
            archivo={ficha.valores.imagen}
            error={errorArchivo ?? ficha.errores.imagen}
            onChange={cambiarImagen}
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

      <section className="bloque fichas-registradas">
        <h2>Fichas registradas</h2>

        <Mensaje mensaje={mensajeImagen} />

        {cargandoFichas && <p>Cargando fichas...</p>}

        {!cargandoFichas && errorFichas && (
          <p className="mensaje mensaje-error">
            No se pudieron cargar las fichas: {errorFichas}
          </p>
        )}

        {!cargandoFichas && !errorFichas && fichas.length === 0 && (
          <p>Todavía no hay fichas registradas.</p>
        )}

        {!cargandoFichas && !errorFichas && fichas.length > 0 && (
          <div className="tabla-contenedor">
            <table className="tabla-postulaciones tabla-fichas">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Especie</th>
                  <th>Observaciones</th>
                  <th>Imagen</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {fichas.map((fichaAnimal) => (
                  <tr key={fichaAnimal.id}>
                    <td>{fichaAnimal.codigoAnimal}</td>
                    <td>{fichaAnimal.nombre || "Sin nombre"}</td>
                    <td>{NOMBRES_ESPECIE[fichaAnimal.especie]}</td>
                    <td>
                      {fichaAnimal.observaciones?.trim() ? (
                        <button
                          type="button"
                          className="boton boton-secundario boton-chico"
                          onClick={() => abrirObservaciones(fichaAnimal)}
                        >
                          Observaciones
                        </button>
                      ) : (
                        <span className="sin-observaciones">—</span>
                      )}
                    </td>
                    <td>
                      {fichaAnimal.imagenUrl ? (
                        <button
                          type="button"
                          className="miniatura-boton"
                          onClick={() => abrirImagen(fichaAnimal)}
                          aria-label={`Ampliar imagen de ${nombreVisible(
                            fichaAnimal,
                          )}`}
                        >
                          <img
                            className="miniatura-animal"
                            src={urlImagen(fichaAnimal.imagenUrl)}
                            alt={`Imagen de ${nombreVisible(fichaAnimal)}`}
                          />
                        </button>
                      ) : (
                        <span className="sin-imagen">Sin imagen</span>
                      )}
                    </td>
                    <td>
                      <div className="acciones-imagen">
                        <label className="boton boton-chico">
                          {procesandoImagenId === fichaAnimal.id
                            ? "Guardando..."
                            : fichaAnimal.imagenUrl
                              ? "Cambiar imagen"
                              : "Subir imagen"}

                          <input
                            type="file"
                            className="entrada-archivo-oculta"
                            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                            disabled={procesandoImagenId !== null}
                            onChange={(evento) => {
                              const archivo =
                                evento.target.files?.[0] ?? null;
                              evento.target.value = "";
                              subirImagen(fichaAnimal, archivo);
                            }}
                          />
                        </label>

                        {fichaAnimal.imagenUrl && (
                          <button
                            type="button"
                            className="boton boton-secundario boton-chico"
                            disabled={procesandoImagenId !== null}
                            onClick={() => quitarImagen(fichaAnimal)}
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ventana?.tipo === "imagen" && (
        <VentanaModal
          ariaLabel={ventana.ariaLabel}
          alCerrar={cerrarVentana}
          className="ventana-imagen"
        >
          <img
            className="imagen-ampliada"
            src={ventana.src}
            alt={ventana.alt}
          />
        </VentanaModal>
      )}

      {ventana?.tipo === "observaciones" && (
        <VentanaModal
          titulo={ventana.titulo}
          alCerrar={cerrarVentana}
          className="ventana-observaciones"
        >
          <p className="texto-observaciones">{ventana.texto}</p>
        </VentanaModal>
      )}
    </section>
  );
}

export default RegistroPage;
