import { useRef, useState } from "react";
import Campo from "../components/ui/Campo.jsx";
import { ApiError } from "../services/api.js";
import { previsualizarAlertas } from "../services/saludService.js";
import {alertasFormSchema,TIPOS_ATENCION,} from "../validations/alertasValidation.js";
import "../styles/alertas.css";

const etiquetas = {
    vacuna: "Vacuna",
    tratamiento: "Tratamiento",
    control: "Control",
};

const opciones = TIPOS_ATENCION.map((tipo) => ({
    valor: tipo,
    texto: etiquetas[tipo],
}));

const nuevoEvento = (idLocal) => ({
    idLocal,
    animalId: "",
    tipo: "vacuna",
    fechaProgramada: "",
});

export default function AlertasSanitariasPage() {
    const siguienteId = useRef(2);

    const [valores, setValores] = useState({
    fechaReferencia: "",
    diasAnticipacion: "7",
    eventos: [nuevoEvento(1)],
});

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Evita mostrar resultados de un formulario que ya fue cambiado.
  function limpiarVista() {
    setResultado(null);
    setMensaje("");
    setErrores({});
  }

  function cambiar(campo, valor) {
    limpiarVista();

    setValores((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function cambiarEvento(idLocal, campo, valor) {
    limpiarVista();

    setValores((prev) => ({
      ...prev,
      eventos: prev.eventos.map((evento) =>
        evento.idLocal === idLocal
          ? { ...evento, [campo]: valor }
          : evento,
      ),
    }));
  }

  function agregarEvento() {
    const evento = nuevoEvento(siguienteId.current++);

    limpiarVista();

    setValores((prev) => ({
      ...prev,
      eventos: [...prev.eventos, evento],
    }));
  }

  function quitarEvento(idLocal) {
    limpiarVista();

    setValores((prev) => ({
      ...prev,
      eventos: prev.eventos.filter(
        (evento) => evento.idLocal !== idLocal,
      ),
    }));
  }

  async function generar(evento) {
    evento.preventDefault();

    if (cargando) return;

    limpiarVista();

    const validacion = alertasFormSchema.safeParse(valores);

    if (!validacion.success) {
      setErrores(
        Object.fromEntries(
          validacion.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );

      setMensaje(
        "Revisa los campos indicados antes de generar la vista previa",
      );

      return;
    }

    setCargando(true);

    try {
      const respuesta = await previsualizarAlertas(
        validacion.data,
      );

      setResultado(respuesta);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrores(
          Object.fromEntries(
            (error.detalles ?? [])
              .filter((detalle) => detalle.campo)
              .map((detalle) => [
                detalle.campo,
                detalle.mensaje,
              ]),
          ),
        );

        setMensaje(error.message);
      } else {
        setMensaje(
          error instanceof TypeError
            ? "No se pudo contactar con el servidor. Intenta nuevamente."
            : error.message ||
                "No se pudo generar la vista previa",
        );
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="bloque alertas-sanitarias">
      <h2>Alertas sanitarias</h2>

      <p>
        Agrega los eventos programados para identificar atenciones
        vencidas o proximas.
      </p>

      <form
        className="formulario"
        onSubmit={generar}
        noValidate
      >
        <fieldset
          disabled={cargando}
          className="alertas-fieldset"
        >
          <legend>Configurar vista previa</legend>

          <div className="formulario-campos">
            <Campo
            etiqueta="Dias de anticipacion"
            nombre="diasAnticipacion"
            type="number"
            min={0}
            step={1}
            valor={valores.diasAnticipacion}
            error={errores.diasAnticipacion}
            onChange={(e) =>
                cambiar("diasAnticipacion", e.target.value)
            }
            />

            <Campo
            etiqueta="Fecha de referencia (opcional)"
            nombre="fechaReferencia"
            type="date"
            valor={valores.fechaReferencia}
            error={errores.fechaReferencia}
            onChange={(e) =>
                cambiar("fechaReferencia", e.target.value)
            }
            />
        </div>

        <p>
            Si dejas la fecha vacia, se utilizara la fecha actual
            de Chile.
        </p>

        <h3>Eventos programados</h3>

        <p>
            Usa el identificador numerico del animal, por ejemplo 3.
        </p>

        {valores.eventos.map((evento, indice) => (
            <div
            className="alertas-evento"
            key={evento.idLocal}
            >
            <h4>Evento {indice + 1}</h4>

            <div className="formulario-campos">
                <Campo
                    etiqueta="Identificador del animal"
                    nombre={`eventos.${indice}.animalId`}
                    type="number"
                    min={1}
                    step={1}
                    valor={evento.animalId}
                    error={errores[`eventos.${indice}.animalId`]}
                    onChange={(e) =>
                    cambiarEvento(
                    evento.idLocal,
                    "animalId",
                    e.target.value,
                    )
                  }
                />

                <Campo
                etiqueta="Tipo de atencion"
                nombre={`eventos.${indice}.tipo`}
                control="select"
                opciones={opciones}
                valor={evento.tipo}
                error={errores[`eventos.${indice}.tipo`]}
                onChange={(e) =>
                    cambiarEvento(
                    evento.idLocal,
                    "tipo",
                    e.target.value,
                    )
                }
                />

                <Campo
                etiqueta="Fecha programada"
                nombre={`eventos.${indice}.fechaProgramada`}
                type="date"
                valor={evento.fechaProgramada}
                error={
                    errores[`eventos.${indice}.fechaProgramada`]
                }
                onChange={(e) =>
                    cambiarEvento(
                        evento.idLocal,
                        "fechaProgramada",
                        e.target.value,
                    )
                }
                />
            </div>

            <button
                className="boton boton-secundario"
                type="button"
                onClick={() => quitarEvento(evento.idLocal)}
            >
                Quitar evento
            </button>
            </div>
        ))}

        {valores.eventos.length === 0 && (
            <p>No hay eventos agregados.</p>
        )}

            <div className="alertas-acciones">
            <button
            className="boton boton-secundario"
            type="button"
            onClick={agregarEvento}
            >
            Agregar evento
            </button>

            <button className="boton" type="submit">
            {cargando
                ? "Generando..."
                : "Generar vista previa"}
            </button>
        </div>
        </fieldset>

        {mensaje && (
        <p
            className="mensaje mensaje-error"
            role="alert"
        >
            {mensaje}
        </p>
        )}

        {cargando && (
            <p role="status">
            Calculando alertas sanitarias...
            </p>
        )}
    </form>

    {resultado && (
        <div className="tarjeta" aria-live="polite">
        <h3>Vista previa de alertas</h3>

        <p>
            Fecha de referencia: {resultado.fechaReferencia}
            {" | "}
            Anticipacion: {resultado.diasAnticipacion} dias
        </p>

        {resultado.alertas.length === 0 ? (
            <p>
            No hay atenciones vencidas ni proximas para los
            eventos proporcionados.
            </p>
            ) : (
            <div className="alertas-tabla-contenedor">
            <table className="alertas-tabla">
                <caption>
                Alertas ordenadas de menor a mayor cantidad
                de dias restantes
                </caption>

                <thead>
                <tr>
                    <th scope="col">Animal</th>
                    <th scope="col">Atencion</th>
                    <th scope="col">Fecha programada</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Dias restantes</th>
                </tr>
                </thead>

                <tbody>
                {resultado.alertas.map((alerta, indice) => (
                    <tr key={indice}>
                    <td>{alerta.animalId}</td>
                    <td>{etiquetas[alerta.tipo]}</td>
                    <td>{alerta.fechaProgramada}</td>

                    <td>
                        <span
                        className={`alerta-estado alerta-${alerta.estado}`}
                        >
                        {alerta.estado === "vencido"
                            ? "Vencida"
                            : "Proxima"}
                        </span>
                    </td>

                    <td>{alerta.diasRestantes}</td>
                    </tr>
                ))}
                </tbody>
                </table>
            </div>
            )}
        </div>
        )}
    </section>
    );
}
