import { useState } from "react";
import {consultarPlan,programarAtencion,modificarAtencion,} from "../services/planSanitarioService.js";
import { TIPOS_PLAN } from "../validations/alertasPlanValidation.js";

const etiquetas = {
  vacuna: "Vacuna",
  tratamiento: "Tratamiento",
  control: "Control",
  desparasitacion: "Desparasitación",
  esterilizacion: "Esterilización",
};

const nuevoFormulario = () => ({
  tipo: "vacuna",
  fechaProgramada: "",
  observaciones: "",
});

function hoy() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value])
  );

  return `${partes.year}-${partes.month}-${partes.day}`;
}

export default function PlanSanitario({
  bloqueado,
  onActividad,
  onActualizar,
}) {
  const [codigo, setCodigo] = useState("");
  const [plan, setPlan] = useState(null);
  const [nuevo, setNuevo] = useState(nuevoFormulario);
  const [edicion, setEdicion] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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
          (a) => a.id !== atencion.id
        ),
        atencion,
      ].sort(
        (a, b) =>
          a.fechaProgramada.localeCompare(
            b.fechaProgramada
          ) || a.id - b.id
      ),
    }));

    onActualizar();
  }

  function buscar(evento) {
    evento.preventDefault();

    ejecutar(async () => {
      setPlan(null);
      setEdicion(null);
      setNuevo(nuevoFormulario());

      setPlan(await consultarPlan(codigo));
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
        className="formulario"
        onSubmit={buscar}
        noValidate
      >
        <fieldset
          className="alertas-fieldset"
          disabled={ocupado || bloqueado}
        >
          <label>
            Código del animal
            <input
              value={codigo}
              placeholder="anim-001"
              onChange={(e) => {
                setCodigo(e.target.value);
                setPlan(null);
                setEdicion(null);
              }}
            />
          </label>

          <button className="boton" type="submit">
            Cargar o actualizar plan
          </button>
        </fieldset>
      </form>

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
            {plan.animal.codigoAnimal}
            {" · "}
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
                      onChange={(e) =>
                        setNuevo({
                          ...nuevo,
                          tipo: e.target.value,
                        })
                      }
                    >
                      {TIPOS_PLAN.map((tipo) => (
                        <option
                          key={tipo}
                          value={tipo}
                        >
                          {etiquetas[tipo]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Fecha programada
                    <input
                      type="date"
                      value={nuevo.fechaProgramada}
                      onChange={(e) =>
                        setNuevo({
                          ...nuevo,
                          fechaProgramada:
                            e.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Observaciones (opcional)
                    <textarea
                      value={nuevo.observaciones}
                      maxLength={2000}
                      onChange={(e) =>
                        setNuevo({
                          ...nuevo,
                          observaciones:
                            e.target.value,
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
                  {plan.atenciones.map((atencion) => (
                    <tr key={atencion.id}>
                      <td>
                        #{atencion.id}
                        {" · "}
                        {etiquetas[atencion.tipo]}
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
                  Gestionar atención #{edicion.id}
                </legend>

                <label>
                  Acción
                  <select
                    value={edicion.accion}
                    onChange={(e) =>
                      setEdicion({
                        ...edicion,
                        accion: e.target.value,
                        fecha:
                          e.target.value === "realizar"
                            ? hoy()
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
                      onChange={(e) =>
                        setEdicion({
                          ...edicion,
                          motivo: e.target.value,
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
                      onChange={(e) =>
                        setEdicion({
                          ...edicion,
                          fecha: e.target.value,
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