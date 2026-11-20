import { useState } from "react";
import { formatearEdad } from "../utils/formatoAdopcion.js";
import { hoyEnChile } from "../utils/calendarioTurnos.js";
import PaginacionSanitaria from "./PaginacionSanitaria.jsx";
import {
  buscarAnimalesPlan,
  consultarPlan,
  programarAtencion,
  modificarAtencion,
} from "../services/planSanitarioService.js";
import { TIPOS_PLAN } from "../validations/alertasPlanValidation.js";
import { ETIQUETAS_TIPO_ATENCION } from "../utils/planSanitario.js";

const nuevoFormulario = () => ({
  tipo: "vacuna",
  fechaProgramada: "",
  observaciones: "",
});

export default function PlanSanitario({
  bloqueado,
  onActividad,
  onActualizar,
}) {
  const [nombre, setNombre] = useState("");
  const [coincidencias, setCoincidencias] = useState(null);
  const [paginaBusqueda, setPaginaBusqueda] = useState(1);
  const [paginaPlan, setPaginaPlan] = useState(1);
  const [plan, setPlan] = useState(null);
  const [nuevo, setNuevo] = useState(nuevoFormulario);
  const [edicion, setEdicion] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const porPagina = 5;

  async function ejecutar(operacion) {
    if (ocupado || bloqueado) return;

    setOcupado(true);
    onActividad(true);
    setMensaje("");
    setError("");

    try {
      await operacion();
    } catch (fallo) {
      setError(
        fallo instanceof TypeError
          ? "No se pudo confirmar la operacion. Vuelve a cargar el plan antes de repetirla."
          : fallo.issues?.[0]?.message ??
              fallo.detalles?.[0]?.mensaje ??
              fallo.message
      );
    } finally {
      setOcupado(false);
      onActividad(false);
    }
  }

  function actualizarLista(atencion) {
    setPlan((actual) => ({
      ...actual,
      atenciones: [
        ...actual.atenciones.filter(
          (registrada) => registrada.id !== atencion.id
        ),
        atencion,
      ].sort(
        (primera, segunda) =>
          primera.fechaProgramada.localeCompare(
            segunda.fechaProgramada
          ) || primera.id - segunda.id
      ),
    }));

    onActualizar();
  }

  function buscar(pagina) {
    ejecutar(async () => {
      setPlan(null);
      setEdicion(null);
      setCoincidencias(null);

      const respuesta = await buscarAnimalesPlan(
        nombre,
        pagina
      );

      setCoincidencias(respuesta);
      setPaginaBusqueda(pagina);
    });
  }

  function abrirPlan(animal) {
    ejecutar(async () => {
      const respuesta = await consultarPlan(
        animal.codigoAnimal
      );

      setPlan(respuesta);
      setCoincidencias(null);
      setNuevo(nuevoFormulario());
      setEdicion(null);
      setPaginaPlan(1);
    });
  }

  function programar(evento) {
    evento.preventDefault();

    ejecutar(async () => {
      onActualizar();

      const resultado = await programarAtencion(
        plan.animal.codigoAnimal,
        nuevo
      );

      actualizarLista(resultado.atencion);
      setNuevo(nuevoFormulario());

      setMensaje(
        "Atención programada. Ya puedes consultar sus alertas."
      );
    });
  }

  function guardarCambio(evento) {
    evento.preventDefault();

    ejecutar(async () => {
      onActualizar();

      const datos =
        edicion.accion === "cancelar"
          ? {
              accion: "cancelar",
              motivoCancelacion: edicion.motivo,
            }
          : edicion.accion === "realizar"
            ? {
                accion: "realizar",
                fechaRealizacion: edicion.fecha,
              }
            : {
                accion: "reprogramar",
                fechaProgramada: edicion.fecha,
              };

      const resultado = await modificarAtencion(
        edicion.id,
        datos
      );

      actualizarLista(resultado.atencion);
      setEdicion(null);

      setMensaje(
        "Atención actualizada. Vuelve a consultar las alertas para ver el cambio."
      );
    });
  }

  return (
    <div className="tarjeta">
      <h3>Plan sanitario del animal</h3>

      <form
        className="formulario salud-busqueda"
        onSubmit={(evento) => {
          evento.preventDefault();
          buscar(1);
        }}
        noValidate
      >
        <fieldset
          className="alertas-fieldset"
          disabled={ocupado || bloqueado}
        >
          <label>
            Nombre del animal
            <input
              value={nombre}
              placeholder="Ej. Gretel"
              maxLength={100}
              onChange={(evento) => {
                setNombre(evento.target.value);
                setCoincidencias(null);
                setError("");
                setMensaje("");
                setPlan(null);
                setEdicion(null);
              }}
            />
          </label>

          <button className="boton" type="submit">
            Buscar animales
          </button>
        </fieldset>
      </form>

      {coincidencias && (
        <div aria-live="polite">
          {coincidencias.animales.length === 0 ? (
            <p>Sin coincidencias para ese nombre.</p>
          ) : (
            <ul className="salud-coincidencias">
              {coincidencias.animales.map((animal) => (
                <li key={animal.codigoAnimal}>
                  <div>
                    <strong>
                      {animal.nombre || "Sin nombre"}
                    </strong>

                    <small>
                      {[
                        animal.especie.toLowerCase(),
                        animal.sexoAnimal.toLowerCase(),
                        animal.raza,
                        formatearEdad(animal.edad),
                        "Ficha del " +
                          new Date(
                            animal.createdAt
                          ).toLocaleDateString("es-CL", {
                            timeZone: "America/Santiago",
                          }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="boton"
                    disabled={ocupado || bloqueado}
                    onClick={() => abrirPlan(animal)}
                  >
                    Ver plan
                  </button>
                </li>
              ))}
            </ul>
          )}

          <PaginacionSanitaria
            pagina={paginaBusqueda}
            hayMas={coincidencias.hayMas}
            cambiar={buscar}
            bloqueada={ocupado || bloqueado}
            etiqueta="Resultados de búsqueda"
          />
        </div>
      )}

      {ocupado && (
        <p role="status">
          Procesando el plan sanitario...
        </p>
      )}

      {error && <p role="alert">{error}</p>}
      {mensaje && <p role="status">{mensaje}</p>}

      {plan && (
        <>
          <p>
            {plan.animal.nombre || "Sin nombre"}
            {" · "}
            {plan.animal.estadoEstadia}
          </p>

          {["ACTIVO", "ESPERA_ADOPCION"].includes(
            plan.animal.estadoEstadia
          ) ? (
            <form
              className="formulario"
              onSubmit={programar}
              noValidate
            >
              <fieldset
                className="alertas-fieldset"
                disabled={ocupado || bloqueado}
              >
                <legend>Programar atención</legend>

                <div className="formulario-campos">
                  <label>
                    Tipo
                    <select
                      value={nuevo.tipo}
                      onChange={(evento) =>
                        setNuevo({
                          ...nuevo,
                          tipo: evento.target.value,
                        })
                      }
                    >
                      {TIPOS_PLAN.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {ETIQUETAS_TIPO_ATENCION[tipo]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Fecha programada
                    <input
                      type="date"
                      value={nuevo.fechaProgramada}
                      onChange={(evento) =>
                        setNuevo({
                          ...nuevo,
                          fechaProgramada:
                            evento.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Observaciones (opcional)
                    <textarea
                      value={nuevo.observaciones}
                      maxLength={2000}
                      onChange={(evento) =>
                        setNuevo({
                          ...nuevo,
                          observaciones:
                            evento.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <button
                  className="boton"
                  type="submit"
                >
                  Programar atención
                </button>
              </fieldset>
            </form>
          ) : (
            <p>
              El animal está fuera del refugio.
              Puedes consultar su historial sanitario.
            </p>
          )}

          {plan.atenciones.length === 0 ? (
            <p>
              El animal no tiene atenciones programadas.
            </p>
          ) : (
            <div className="alertas-tabla-contenedor">
              <table className="alertas-tabla">
                <caption>
                  Atenciones registradas en el plan sanitario
                </caption>

                <thead>
                  <tr>
                    <th>Atención</th>
                    <th>Fecha programada</th>
                    <th>Estado y detalle</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {plan.atenciones
                    .slice(
                      (paginaPlan - 1) * porPagina,
                      paginaPlan * porPagina
                    )
                    .map((atencion) => (
                      <tr key={atencion.id}>
                        <td>
                          {
                            ETIQUETAS_TIPO_ATENCION[
                              atencion.tipo
                            ]
                          }
                          <br />
                          {atencion.observaciones}
                        </td>

                        <td>
                          {atencion.fechaProgramada}
                        </td>

                        <td>
                          {atencion.estado}
                          <br />
                          {atencion.fechaRealizacion ||
                            atencion.motivoCancelacion}
                        </td>

                        <td>
                          {atencion.estado ===
                            "PENDIENTE" && (
                            <button
                              type="button"
                              className="boton"
                              disabled={
                                ocupado || bloqueado
                              }
                              onClick={() => {
                                setEdicion({
                                  ...atencion,
                                  accion: "reprogramar",
                                  fecha:
                                    atencion.fechaProgramada,
                                  motivo: "",
                                });
                                setError("");
                                setMensaje("");
                              }}
                            >
                              Gestionar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <PaginacionSanitaria
                pagina={paginaPlan}
                hayMas={
                  paginaPlan * porPagina <
                  plan.atenciones.length
                }
                cambiar={(pagina) => {
                  setPaginaPlan(pagina);
                  setEdicion(null);
                }}
                bloqueada={ocupado || bloqueado}
                etiqueta="Historial del animal"
              />
            </div>
          )}

          {edicion && (
            <form
              className="formulario"
              onSubmit={guardarCambio}
              noValidate
            >
              <fieldset
                className="alertas-fieldset"
                disabled={ocupado || bloqueado}
              >
                <legend>
                  Gestionar{" "}
                  {ETIQUETAS_TIPO_ATENCION[edicion.tipo]}
                  {" del "}
                  {edicion.fechaProgramada}
                </legend>

                <label>
                  Acción
                  <select
                    value={edicion.accion}
                    onChange={(evento) =>
                      setEdicion({
                        ...edicion,
                        accion: evento.target.value,
                        fecha:
                          evento.target.value === "realizar"
                            ? hoyEnChile()
                            : edicion.fechaProgramada,
                      })
                    }
                  >
                    <option value="reprogramar">
                      Reprogramar
                    </option>
                    <option value="realizar">
                      Marcar como realizada
                    </option>
                    <option value="cancelar">
                      Cancelar atención
                    </option>
                  </select>
                </label>

                {edicion.accion === "cancelar" ? (
                  <label>
                    Motivo de cancelación
                    <textarea
                      value={edicion.motivo}
                      maxLength={500}
                      onChange={(evento) =>
                        setEdicion({
                          ...edicion,
                          motivo: evento.target.value,
                        })
                      }
                    />
                  </label>
                ) : (
                  <label>
                    {edicion.accion === "realizar"
                      ? "Fecha de realización"
                      : "Nueva fecha programada"}

                    <input
                      type="date"
                      value={edicion.fecha}
                      onChange={(evento) =>
                        setEdicion({
                          ...edicion,
                          fecha: evento.target.value,
                        })
                      }
                    />
                  </label>
                )}

                <div className="alertas-acciones">
                  <button
                    className="boton"
                    type="submit"
                  >
                    Guardar cambio
                  </button>

                  <button
                    type="button"
                    className="boton"
                    onClick={() => setEdicion(null)}
                  >
                    Volver al plan
                  </button>
                </div>
              </fieldset>
            </form>
          )}
        </>
      )}
    </div>
  );
}