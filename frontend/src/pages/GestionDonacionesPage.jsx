import { useEffect, useState } from "react";
import {
  listarDonaciones,
  revisarDonacion,
  descargarComprobante,
} from "../services/donacionesService.js";
import "../styles/donaciones.css";

const filtrosIniciales = {
  desde: "",
  hasta: "",
  estado: "",
  destino: "",
  donante: "",
  animal: "",
};

const dinero = (valor) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(BigInt(valor));

export default function GestionDonacionesPage() {
  const [formulario, setFormulario] =
    useState(filtrosIniciales);

  const [consulta, setConsulta] = useState({
    ...filtrosIniciales,
    pagina: 1,
  });

  const [respuesta, setRespuesta] =
    useState(null);

  const [seleccion, setSeleccion] =
    useState(null);

  const [estado, setEstado] =
    useState("CONFIRMADA");

  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [ocupado, setOcupado] =
    useState(false);

  useEffect(() => {
    const peticion = new AbortController();

    listarDonaciones(
      consulta,
      peticion.signal
    )
      .then((datos) => {
        if (!peticion.signal.aborted) {
          setRespuesta(datos);
        }
      })
      .catch((fallo) => {
        if (!peticion.signal.aborted) {
          setError(
            fallo.detalles?.[0]?.mensaje ||
              fallo.message
          );
        }
      });

    return () => peticion.abort();
  }, [consulta]);

  function consultar(filtros) {
    setError("");
    setSeleccion(null);
    setRespuesta(null);
    setConsulta(filtros);
  }

  async function revisar(evento) {
    evento.preventDefault();

    if (ocupado) return;

    setOcupado(true);
    setError("");
    setMensaje("");

    try {
      await revisarDonacion(
        seleccion.folio,
        {
          estado,
          motivoRechazo:
            estado === "RECHAZADA"
              ? motivo
              : "",
        }
      );

      setMensaje("Revisión registrada.");
      consultar({ ...consulta });
    } catch (fallo) {
      setError(
        fallo.detalles?.[0]?.mensaje ||
          fallo.message
      );

      if (fallo.status === 409) {
        setSeleccion(null);
        setConsulta({ ...consulta });
      }
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="bloque donaciones">
      <h2>Administrar donaciones</h2>

      <form
        className="formulario"
        onSubmit={(evento) => {
          evento.preventDefault();
          setMensaje("");

          consultar({
            ...formulario,
            pagina: 1,
          });
        }}
      >
        <fieldset disabled={ocupado}>
          <legend>Filtros de consulta</legend>

          <div className="donacion-campos">
            <label>
              Desde
              <input
                type="date"
                value={formulario.desde}
                onChange={(evento) =>
                  setFormulario({
                    ...formulario,
                    desde: evento.target.value,
                  })
                }
              />
            </label>

            <label>
              Hasta
              <input
                type="date"
                value={formulario.hasta}
                onChange={(evento) =>
                  setFormulario({
                    ...formulario,
                    hasta: evento.target.value,
                  })
                }
              />
            </label>

            <label>
              Estado
              <select
                value={formulario.estado}
                onChange={(evento) =>
                  setFormulario({
                    ...formulario,
                    estado: evento.target.value,
                  })
                }
              >
                <option value="">Todos</option>
                <option>PENDIENTE</option>
                <option>CONFIRMADA</option>
                <option>RECHAZADA</option>
              </select>
            </label>

            <label>
              Destino
              <select
                value={formulario.destino}
                onChange={(evento) =>
                  setFormulario({
                    ...formulario,
                    destino: evento.target.value,
                  })
                }
              >
                <option value="">Todos</option>
                <option value="REFUGIO">
                  Refugio
                </option>
                <option value="APADRINAMIENTO">
                  Animal
                </option>
              </select>
            </label>

            <label>
              Nombre del animal
              <input
                maxLength={100}
                value={formulario.animal}
                onChange={(evento) =>
                  setFormulario({
                    ...formulario,
                    animal: evento.target.value,
                  })
                }
              />
            </label>

            <label>
              Nombre o contacto de la persona donante
              <input
                maxLength={100}
                value={formulario.donante}
                onChange={(evento) =>
                  setFormulario({
                    ...formulario,
                    donante: evento.target.value,
                  })
                }
              />
            </label>
          </div>

          <button
            className="boton"
            type="submit"
          >
            Consultar
          </button>
        </fieldset>
      </form>

      {error && (
        <p
          role="alert"
          className="mensaje mensaje-error"
        >
          {error}
        </p>
      )}

      {mensaje && (
        <p role="status">{mensaje}</p>
      )}

      {!respuesta && !error && (
        <p role="status">
          Cargando donaciones…
        </p>
      )}

      {respuesta && (
        <div className="tarjeta">
          <p className="donacion-total">
            Total confirmado para estos filtros{" "}
            <strong>
              {dinero(
                respuesta.totalConfirmado
              )}
            </strong>
          </p>

          <p>
            {respuesta.cantidadConfirmadas}{" "}
            donaciones confirmadas. Período según
            fecha del aporte.
          </p>

          {respuesta.donaciones.length === 0 ? (
            <p>
              Sin donaciones para estos filtros.
            </p>
          ) : (
            <div className="donacion-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Fecha y destino</th>
                    <th>Persona donante</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Detalle</th>
                  </tr>
                </thead>

                <tbody>
                  {respuesta.donaciones.map(
                    (donacion) => (
                      <tr key={donacion.folio}>
                        <td>
                          {donacion.fechaAporte}

                          <small>
                            {donacion.animal
                              ? donacion.animal.nombre ||
                                "Sin nombre"
                              : "Refugio"}
                          </small>
                        </td>

                        <td>
                          {donacion.nombreDonante ||
                            "Anónima"}

                          <small>
                            {donacion.emailDonante ||
                              donacion.telefonoDonante}
                          </small>
                        </td>

                        <td>
                          {dinero(donacion.monto)}
                        </td>

                        <td>
                          {donacion.estado}
                        </td>

                        <td>
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => {
                              setSeleccion(donacion);
                              setEstado("CONFIRMADA");
                              setMotivo("");
                              setError("");
                            }}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {(
            consulta.pagina > 1 ||
            respuesta.hayMas
          ) && (
            <div className="donacion-paginas">
              <button
                disabled={
                  ocupado ||
                  consulta.pagina === 1
                }
                onClick={() =>
                  consultar({
                    ...consulta,
                    pagina:
                      consulta.pagina - 1,
                  })
                }
              >
                Anterior
              </button>

              <span>
                Página {consulta.pagina}
              </span>

              <button
                disabled={
                  ocupado ||
                  !respuesta.hayMas
                }
                onClick={() =>
                  consultar({
                    ...consulta,
                    pagina:
                      consulta.pagina + 1,
                  })
                }
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {seleccion && (
        <section
          className="tarjeta"
          aria-label="Detalle de donación"
        >
          <h3>Detalle del aporte</h3>

          <p className="donacion-folio">
            Folio {seleccion.folio}
          </p>

          <p>
            Medio de pago{" "}
            {seleccion.medioPago.toLowerCase()}
          </p>

          <p>
            Contacto{" "}
            {[
              seleccion.emailDonante,
              seleccion.telefonoDonante,
            ]
              .filter(Boolean)
              .join(" · ") ||
              "Sin datos de contacto"}
          </p>

          {seleccion.comprobanteNombre && (
            <button
              type="button"
              className="boton"
              onClick={() => {
                descargarComprobante(
                  seleccion.folio
                ).catch((fallo) =>
                  setError(fallo.message)
                );
              }}
            >
              Descargar comprobante PDF
            </button>
          )}

          {seleccion.revisadaEn && (
            <p>
              Revisada por{" "}
              {seleccion.revisadaPor.nombre}
              {" el "}
              {new Date(
                seleccion.revisadaEn
              ).toLocaleString("es-CL", {
                timeZone:
                  "America/Santiago",
              })}
            </p>
          )}

          {seleccion.motivoRechazo && (
            <p>
              Motivo del rechazo{" "}
              {seleccion.motivoRechazo}
            </p>
          )}

          {seleccion.estado ===
            "PENDIENTE" && (
            <form
              className="formulario"
              onSubmit={revisar}
            >
              <fieldset disabled={ocupado}>
                <legend>
                  Revisar recepción
                </legend>

                <label>
                  Resultado
                  <select
                    value={estado}
                    onChange={(evento) =>
                      setEstado(
                        evento.target.value
                      )
                    }
                  >
                    <option value="CONFIRMADA">
                      Confirmar recepción del dinero
                    </option>

                    <option value="RECHAZADA">
                      Rechazar registro
                    </option>
                  </select>
                </label>

                {estado === "RECHAZADA" && (
                  <label>
                    Motivo del rechazo
                    <textarea
                      required
                      maxLength={500}
                      value={motivo}
                      onChange={(evento) =>
                        setMotivo(
                          evento.target.value
                        )
                      }
                    />
                  </label>
                )}

                <p>
                  Confirma después de verificar
                  que el dinero fue recibido por
                  el refugio.
                </p>

                <button
                  className="boton"
                  type="submit"
                >
                  {ocupado
                    ? "Guardando…"
                    : "Guardar revisión"}
                </button>
              </fieldset>
            </form>
          )}
        </section>
      )}
    </section>
  );
}