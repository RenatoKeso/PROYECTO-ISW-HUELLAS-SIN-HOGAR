import { useEffect, useState } from "react";
import { hoyEnChile } from "../utils/calendarioTurnos.js";
import {buscarAnimalesDonacion,registrarDonacion,} from "../services/donacionesService.js";
import "../styles/donaciones.css";

const inicial = () => ({
  destino: "REFUGIO",
  monto: "",
  medioPago: "TRANSFERENCIA",
  fechaAporte: hoyEnChile(),
  anonima: true,
  nombreDonante: "",
  emailDonante: "",
  telefonoDonante: "",
});

export default function DonacionesPage() {
  const [datos, setDatos] = useState(inicial);
  const [archivo, setArchivo] = useState(null);
  const [animal, setAnimal] = useState(null);
  const [nombre, setNombre] = useState("");

  const [busqueda, setBusqueda] = useState({
    nombre: "",
    pagina: 1,
  });

  const [respuesta, setRespuesta] =
    useState(null);

  const [enviando, setEnviando] =
    useState(false);

  const [error, setError] = useState("");
  const [resultado, setResultado] =
    useState(null);

  useEffect(() => {
    if (
      datos.destino !== "APADRINAMIENTO"
    ) {
      return;
    }

    const peticion = new AbortController();

    buscarAnimalesDonacion(
      busqueda,
      peticion.signal
    )
      .then((filas) => {
        if (!peticion.signal.aborted) {
          setRespuesta(filas);
        }
      })
      .catch((fallo) => {
        if (!peticion.signal.aborted) {
          setError(fallo.message);
        }
      });

    return () => peticion.abort();
  }, [busqueda, datos.destino]);

  function cambiar(campo, valor) {
    setError("");

    setDatos((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function buscar(pagina) {
    setError("");
    setRespuesta(null);

    setBusqueda({
      nombre: nombre.trim(),
      pagina,
    });
  }

  async function enviar(evento) {
    evento.preventDefault();

    if (enviando) return;

    setError("");

    if (
      datos.destino === "APADRINAMIENTO" &&
      !animal
    ) {
      setError(
        "Selecciona el animal que quieres apadrinar"
      );
      return;
    }

    setEnviando(true);

    try {
      const entrada = {
        ...datos,

        ...(animal
          ? {
              codigoAnimal:
                animal.codigoAnimal,
            }
          : {}),
      };

      setResultado(
        await registrarDonacion(
          entrada,
          archivo
        )
      );

      setDatos(inicial());
      setAnimal(null);
      setArchivo(null);
    } catch (fallo) {
      setError(
        fallo.detalles
          ?.map(
            (detalle) => detalle.mensaje
          )
          .join(". ") ||
          fallo.message
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="bloque donaciones">
      <h2>Un aporte que deja huella</h2>

      <p>
        Registra el aporte que entregaste al refugio
        o destínalo al cuidado de un animal.
      </p>

      {resultado ? (
        <div className="tarjeta" role="status">
          <h3>Donación registrada</h3>

          <p>
            La recepción del dinero está pendiente
            de confirmación por la directora.
          </p>

          <p>
            Guarda tu folio{" "}
            <strong>{resultado.folio}</strong>
          </p>

          <button
            className="boton"
            onClick={() => setResultado(null)}
          >
            Registrar otro aporte
          </button>
        </div>
      ) : (
        <form
          className="formulario"
          onSubmit={enviar}
        >
          <fieldset disabled={enviando}>
            <legend>Destino del aporte</legend>

            <label>
              Quiero aportar
              <select
                value={datos.destino}
                onChange={(evento) => {
                  cambiar(
                    "destino",
                    evento.target.value
                  );

                  setAnimal(null);
                  setRespuesta(null);

                  if (
                    evento.target.value ===
                    "APADRINAMIENTO"
                  ) {
                    cambiar("anonima", false);
                  }
                }}
              >
                <option value="REFUGIO">
                  Al refugio en general
                </option>

                <option value="APADRINAMIENTO">
                  Al cuidado de un animal
                </option>
              </select>
            </label>

            {datos.destino ===
              "APADRINAMIENTO" && (
              <div className="donacion-buscador">
                <label>
                  Nombre del animal
                  <input
                    value={nombre}
                    maxLength={100}
                    onChange={(evento) =>
                      setNombre(
                        evento.target.value
                      )
                    }
                  />
                </label>

                <button
                  className="boton"
                  type="button"
                  onClick={() => buscar(1)}
                >
                  Buscar
                </button>

                {animal && (
                  <p>
                    Animal seleccionado{" "}
                    <strong>
                      {animal.nombre ||
                        "Sin nombre"}
                    </strong>
                  </p>
                )}

                {!respuesta && !error && (
                  <p role="status">
                    Cargando animales…
                  </p>
                )}

                <ul className="donacion-animales">
                  {respuesta?.animales.map(
                    (opcion) => (
                      <li
                        key={opcion.codigoAnimal}
                      >
                        <label>
                          <input
                            type="radio"
                            name="animal"
                            checked={
                              animal?.codigoAnimal ===
                              opcion.codigoAnimal
                            }
                            onChange={() =>
                              setAnimal(opcion)
                            }
                          />

                          <span>
                            <strong>
                              {opcion.nombre ||
                                "Sin nombre"}
                            </strong>

                            <small>
                              {[
                                opcion.especie.toLowerCase(),
                                opcion.raza,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </small>
                          </span>
                        </label>
                      </li>
                    )
                  )}
                </ul>

                {respuesta?.animales.length ===
                  0 && (
                  <p>
                    Sin animales para esa búsqueda.
                  </p>
                )}

                {respuesta &&
                  (
                    busqueda.pagina > 1 ||
                    respuesta.hayMas
                  ) && (
                    <div className="donacion-paginas">
                      <button
                        type="button"
                        disabled={
                          busqueda.pagina === 1
                        }
                        onClick={() =>
                          buscar(
                            busqueda.pagina - 1
                          )
                        }
                      >
                        Anterior
                      </button>

                      <span>
                        Página {busqueda.pagina}
                      </span>

                      <button
                        type="button"
                        disabled={
                          !respuesta.hayMas
                        }
                        onClick={() =>
                          buscar(
                            busqueda.pagina + 1
                          )
                        }
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
              </div>
            )}
          </fieldset>

          <fieldset disabled={enviando}>
            <legend>Datos del aporte</legend>

            <div className="donacion-campos">
              <label>
                Monto en pesos chilenos
                <input
                  type="number"
                  min="1"
                  max="99999999999999"
                  step="1"
                  required
                  value={datos.monto}
                  onChange={(evento) =>
                    cambiar(
                      "monto",
                      evento.target.value
                    )
                  }
                />
              </label>

              <label>
                Fecha del aporte
                <input
                  type="date"
                  required
                  max={hoyEnChile()}
                  value={datos.fechaAporte}
                  onChange={(evento) =>
                    cambiar(
                      "fechaAporte",
                      evento.target.value
                    )
                  }
                />
              </label>

              <label>
                Medio de pago
                <select
                  value={datos.medioPago}
                  onChange={(evento) => {
                    cambiar(
                      "medioPago",
                      evento.target.value
                    );
                    setArchivo(null);
                  }}
                >
                  <option value="TRANSFERENCIA">
                    Transferencia
                  </option>

                  <option value="EFECTIVO">
                    Efectivo
                  </option>
                </select>
              </label>

              {datos.medioPago ===
                "TRANSFERENCIA" && (
                <label>
                  Comprobante PDF (máximo 2 MB)
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    required
                    onChange={(evento) =>
                      setArchivo(
                        evento.target.files[0] ||
                          null
                      )
                    }
                  />
                </label>
              )}
            </div>

            <p>
              {datos.medioPago ===
              "TRANSFERENCIA"
                ? "La directora revisará el comprobante y verificará la recepción del dinero."
                : "La directora confirmará la recepción del efectivo entregado al refugio."}
            </p>
          </fieldset>

          <fieldset disabled={enviando}>
            <legend>
              Datos de la persona donante
            </legend>

            {datos.destino === "REFUGIO" && (
              <label className="donacion-check">
                <input
                  type="checkbox"
                  checked={datos.anonima}
                  onChange={(evento) => {
                    const anonima =
                      evento.target.checked;

                    setDatos((actual) => ({
                      ...actual,
                      anonima,
                      nombreDonante: "",
                      emailDonante: "",
                      telefonoDonante: "",
                    }));
                  }}
                />

                Omitir mis datos personales
                en el formulario
              </label>
            )}

            {!datos.anonima && (
              <div className="donacion-campos">
                <label>
                  Nombre de la persona donante
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    value={datos.nombreDonante}
                    onChange={(evento) =>
                      cambiar(
                        "nombreDonante",
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Correo electrónico
                  <input
                    type="email"
                    autoComplete="email"
                    value={datos.emailDonante}
                    onChange={(evento) =>
                      cambiar(
                        "emailDonante",
                        evento.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    type="tel"
                    maxLength={25}
                    autoComplete="tel"
                    value={datos.telefonoDonante}
                    onChange={(evento) =>
                      cambiar(
                        "telefonoDonante",
                        evento.target.value
                      )
                    }
                  />
                </label>
              </div>
            )}

            <p>
              {datos.destino ===
              "APADRINAMIENTO"
                ? "Ingresa correo o teléfono para recibir información sobre el animal."
                : "El comprobante puede contener datos del titular de la transferencia. Solo la directora podrá consultarlo."}
            </p>
          </fieldset>

          {error && (
            <p
              className="mensaje mensaje-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="boton"
            type="submit"
            disabled={enviando}
          >
            {enviando
              ? "Registrando…"
              : "Registrar donación"}
          </button>
        </form>
      )}
    </section>
  );
}