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
  listarIngresosFicha,
  listarIngresosGlobales,
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
import { formatearFecha } from "../utils/formatoAdopcion.js";
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

function fechaHoraActualLocal() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function soloDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function codigoAnimalDesdeNumero(valor) {
  const digitos = soloDigitos(valor);
  return digitos ? `anim-${digitos.padStart(3, "0")}` : "";
}

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
  const [busquedaFichaCodigo, setBusquedaFichaCodigo] = useState("");
  const [busquedaFichaNombre, setBusquedaFichaNombre] = useState("");
  const [historialFicha, setHistorialFicha] = useState(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [busquedaHistorialCodigo, setBusquedaHistorialCodigo] = useState("");
  const [busquedaHistorialNombre, setBusquedaHistorialNombre] = useState("");
  const [historialGlobal, setHistorialGlobal] = useState([]);
  const [cargandoHistorialGlobal, setCargandoHistorialGlobal] = useState(false);
  const [errorHistorialGlobal, setErrorHistorialGlobal] = useState("");

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

  const ingreso = useFormulario({
    iniciales: () => ({
      ...INGRESO_INICIAL,
      fechaIngreso: fechaHoraActualLocal(),
    }),
    esquema: ingresoFormSchema,
    enviar: enviarIngreso,
    mensajeExito: (respuesta) => `Ingreso registrado: ${respuesta.codigoAnimal}`,
  });

  const ficha = useFormulario({
    iniciales: FICHA_INICIAL,
    esquema: fichaFormConImagenSchema,
    enviar: async ({ imagen, ...datos }) => {
      setErrorArchivo(null);

      const respuesta = imagen
        ? await crearFichaConImagen(datos, imagen)
        : await crearFicha(datos);

      await cargarFichas();

      if (respuesta?.codigoAnimal) {
        ingreso.cambiar("codigoAnimal", respuesta.codigoAnimal);
      }

      return respuesta;
    },
    mensajeExito: (respuesta) => `Ficha creada: ${respuesta.codigoAnimal}`,
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

  useEffect(() => {
    cargarHistorialGlobal();
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

  async function abrirHistorial(fichaAnimal) {
    setHistorialFicha({ ficha: fichaAnimal, ingresos: [] });
    setErrorHistorial("");
    setCargandoHistorial(true);

    try {
      const respuesta = await listarIngresosFicha(fichaAnimal.id);
      setHistorialFicha({ ficha: respuesta.ficha, ingresos: respuesta.ingresos });
    } catch (error) {
      setErrorHistorial(error.message);
    } finally {
      setCargandoHistorial(false);
    }
  }

  async function cargarHistorialGlobal({ codigo, nombre } = {}) {
    setErrorHistorialGlobal("");
    setCargandoHistorialGlobal(true);

    try {
      const respuesta = await listarIngresosGlobales({ codigo, nombre });
      setHistorialGlobal(respuesta.ingresos);
    } catch (error) {
      setErrorHistorialGlobal(error.message);
      setHistorialGlobal([]);
    } finally {
      setCargandoHistorialGlobal(false);
    }
  }

  function limpiarBusquedaHistorial() {
    setBusquedaHistorialCodigo("");
    setBusquedaHistorialNombre("");
    cargarHistorialGlobal();
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

  const codigoBuscado = codigoAnimalDesdeNumero(busquedaFichaCodigo);
  const nombreBuscado = busquedaFichaNombre.trim().toLowerCase();

  const fichasFiltradas = fichas.filter((fichaAnimal) => {
    if (!codigoBuscado && !nombreBuscado) return true;

    const coincideCodigo =
      !codigoBuscado ||
      String(fichaAnimal.codigoAnimal ?? "")
        .toLowerCase()
        .includes(codigoBuscado);

    const coincideNombre =
      !nombreBuscado ||
      String(fichaAnimal.nombre ?? "")
        .toLowerCase()
        .includes(nombreBuscado);

    return coincideCodigo && coincideNombre;
  });

  const fichaHistorialActual = historialFicha
    ? fichas.find((fichaAnimal) => fichaAnimal.id === historialFicha.ficha.id) ??
      historialFicha.ficha
    : null;

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
            control="select"
            opciones={[
              { valor: "", texto: "Seleccione..." },
              ...fichas.map((fichaAnimal) => ({
                valor: fichaAnimal.codigoAnimal,
                texto: `${fichaAnimal.codigoAnimal} · ${
                  fichaAnimal.nombre || "Sin nombre"
                }`,
              })),
            ]}
            valor={ingreso.valores.codigoAnimal}
            error={ingreso.errores.codigoAnimal}
            onChange={(evento) =>
              ingreso.cambiar("codigoAnimal", evento.target.value)
            }
          />
          <span className="campo-ayuda">
            Para una ficha nueva, regístrala arriba; el código se genera
            automáticamente.
          </span>

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
          <>
            <div className="buscador-historial-campos">
              <div className="buscador-fichas">
                <label htmlFor="busquedaFichaCodigo">Código del animal</label>
                <input
                  id="busquedaFichaCodigo"
                  type="search"
                  inputMode="numeric"
                  value={busquedaFichaCodigo}
                  onChange={(evento) =>
                    setBusquedaFichaCodigo(soloDigitos(evento.target.value))
                  }
                  placeholder="001"
                />
              </div>

              <div className="buscador-fichas">
                <label htmlFor="busquedaFichaNombre">Nombre del animal</label>
                <input
                  id="busquedaFichaNombre"
                  type="search"
                  value={busquedaFichaNombre}
                  onChange={(evento) => setBusquedaFichaNombre(evento.target.value)}
                  placeholder="Gretel"
                />
              </div>
            </div>

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
                {fichasFiltradas.map((fichaAnimal) => (
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

                        <button
                          type="button"
                          className="boton boton-secundario boton-chico"
                          onClick={() => abrirHistorial(fichaAnimal)}
                        >
                          Historial
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {historialFicha && (
        <section className="bloque historial-ingresos">
          <div className="encabezado-historial">
            <h3>
              Historial de ingresos de{" "}
              {fichaHistorialActual?.nombre || fichaHistorialActual?.codigoAnimal}
            </h3>
            <button
              type="button"
              className="boton boton-secundario boton-chico"
              onClick={() => setHistorialFicha(null)}
            >
              Cerrar
            </button>
          </div>

          {cargandoHistorial && <p>Cargando historial...</p>}

          {!cargandoHistorial && errorHistorial && (
            <p className="mensaje mensaje-error">
              No se pudo cargar el historial: {errorHistorial}
            </p>
          )}

          {!cargandoHistorial &&
            !errorHistorial &&
            historialFicha.ingresos.length === 0 && (
              <p>Todavía no hay ingresos registrados para esta ficha.</p>
            )}

          {!cargandoHistorial &&
            !errorHistorial &&
            historialFicha.ingresos.length > 0 && (
              <div className="tabla-contenedor">
                <table className="tabla-postulaciones tabla-historial">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Procedencia</th>
                      <th>Receptor</th>
                      <th>Ubicación</th>
                      <th>Estado de salud</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFicha.ingresos.map((ingreso) => (
                      <tr key={ingreso.id}>
                        <td>
                          <span
                            className={`tipo-ingreso tipo-${ingreso.tipo.toLowerCase()}`}
                          >
                            {ingreso.tipo === "INGRESO" ? "Ingreso" : "Reingreso"}
                          </span>
                        </td>
                        <td>{formatearFecha(ingreso.fechaIngreso)}</td>
                        <td>{ingreso.procedencia}</td>
                        <td>{ingreso.receptor?.nombre ?? "—"}</td>
                        <td>{ingreso.ubicacionEncontrado || "—"}</td>
                        <td>{ingreso.estadoSalud || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      )}

      <section className="bloque historial-global">
        <h2>Historial de ingresos</h2>

        <form
          className="buscador-historial"
          onSubmit={(evento) => {
            evento.preventDefault();
            cargarHistorialGlobal({
              codigo: codigoAnimalDesdeNumero(busquedaHistorialCodigo),
              nombre: busquedaHistorialNombre,
            });
          }}
        >
          <div className="buscador-historial-campos">
            <div className="buscador-fichas">
              <label htmlFor="busquedaHistorialCodigo">Código del animal</label>
              <input
                id="busquedaHistorialCodigo"
                type="search"
                inputMode="numeric"
                value={busquedaHistorialCodigo}
                onChange={(evento) =>
                  setBusquedaHistorialCodigo(soloDigitos(evento.target.value))
                }
                placeholder="001"
              />
            </div>

            <div className="buscador-fichas">
              <label htmlFor="busquedaHistorialNombre">Nombre del animal</label>
              <input
                id="busquedaHistorialNombre"
                type="search"
                value={busquedaHistorialNombre}
                onChange={(evento) =>
                  setBusquedaHistorialNombre(evento.target.value)
                }
                placeholder="Gretel"
              />
            </div>
          </div>

          <div className="acciones-historial">
            <button className="boton boton-chico" type="submit">
              Buscar
            </button>
            <button
              type="button"
              className="boton boton-secundario boton-chico"
              onClick={limpiarBusquedaHistorial}
            >
              Limpiar
            </button>
          </div>
        </form>

        {cargandoHistorialGlobal && <p>Cargando historial...</p>}

        {!cargandoHistorialGlobal && errorHistorialGlobal && (
          <p className="mensaje mensaje-error">
            No se pudo cargar el historial: {errorHistorialGlobal}
          </p>
        )}

        {!cargandoHistorialGlobal &&
          !errorHistorialGlobal &&
          historialGlobal.length === 0 && (
            <p>No hay ingresos registrados.</p>
          )}

        {!cargandoHistorialGlobal &&
          !errorHistorialGlobal &&
          historialGlobal.length > 0 && (
            <div className="tabla-contenedor">
              <table className="tabla-postulaciones tabla-historial-global">
                <thead>
                  <tr>
                    <th>N° de ingreso</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Procedencia</th>
                    <th>Receptor</th>
                    <th>Ubicación</th>
                    <th>Estado de salud</th>
                  </tr>
                </thead>
                <tbody>
                  {historialGlobal.map((ingreso) => (
                    <tr key={ingreso.id}>
                      <td>{ingreso.id}</td>
                      <td>{ingreso.fichaAnimal?.codigoAnimal ?? "—"}</td>
                      <td>{ingreso.fichaAnimal?.nombre || "Sin nombre"}</td>
                      <td>
                        <span
                          className={`tipo-ingreso tipo-${ingreso.tipo.toLowerCase()}`}
                        >
                          {ingreso.tipo === "INGRESO" ? "Ingreso" : "Reingreso"}
                        </span>
                      </td>
                      <td>{formatearFecha(ingreso.fechaIngreso)}</td>
                      <td>{ingreso.procedencia}</td>
                      <td>{ingreso.receptor?.nombre ?? "—"}</td>
                      <td>{ingreso.ubicacionEncontrado || "—"}</td>
                      <td>{ingreso.estadoSalud || "—"}</td>
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
