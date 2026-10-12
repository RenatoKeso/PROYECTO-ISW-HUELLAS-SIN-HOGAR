import { useState } from "react";
import Campo from "../components/ui/Campo.jsx";
import { ApiError } from "../services/api.js";
import {consultarAlertasPlan,} from "../services/saludService.js";
import {consultaAlertasFormSchema,} from "../validations/alertasPlanValidation.js";
import "../styles/alertas.css";

const etiquetas = {
  vacuna: "Vacuna",
  tratamiento: "Tratamiento",
  control: "Control",
  desparasitacion: "Desparasitación",
  esterilizacion: "Esterilización",
};

export default function AlertasSanitariasPage() {
  const [valores, setValores] = useState({
    fechaReferencia: "",
    diasAnticipacion: "7",
  });

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  function cambiar(campo, valor) {
    setValores((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setResultado(null);
    setErrores({});
    setMensaje("");
  }

  async function generar(evento) {
    evento.preventDefault();

    if (cargando) return;

    setResultado(null);
    setErrores({});
    setMensaje("");

    const validacion =
      consultaAlertasFormSchema.safeParse(valores);

    if (!validacion.success) {
      setErrores(
        Object.fromEntries(
          validacion.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ])
        )
      );

      setMensaje(
        "Revisa los filtros antes de consultar las alertas."
      );

      return;
    }

    setCargando(true);

    try {
      const respuesta = await consultarAlertasPlan(
        validacion.data
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
              ])
          )
        );
      }

      setMensaje(
        error instanceof TypeError
          ? "No se pudo contactar con el servidor. Intenta nuevamente."
          : error.message ||
              "No se pudieron consultar las alertas."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="bloque alertas-sanitarias">
      <h2>Alertas sanitarias</h2>

      <p>
        Consulta las atenciones pendientes del plan sanitario
        de los animales a cargo del refugio.
      </p>

      <form
        className="formulario"
        onSubmit={generar}
        noValidate
      >
        <fieldset
          className="alertas-fieldset"
          disabled={cargando}
        >
          <legend>Filtros de consulta</legend>

          <div className="formulario-campos">
            <Campo
              etiqueta="Días de anticipación"
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
            Si dejas la fecha vacía, se utiliza la fecha
            actual de Chile.
          </p>

          <button className="boton" type="submit">
            {cargando
              ? "Consultando..."
              : "Consultar alertas"}
          </button>
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
            Consultando el plan sanitario...
          </p>
        )}
      </form>

      {resultado && (
        <div className="tarjeta" aria-live="polite">
          <h3>Vista previa de alertas</h3>

          <p>
            Fecha de referencia: {resultado.fechaReferencia}
            {" | "}
            Anticipación: {resultado.diasAnticipacion} días
          </p>

          {resultado.alertas.length === 0 ? (
            <p>
              No hay atenciones vencidas ni próximas para
              los filtros indicados.
            </p>
          ) : (
            <div className="alertas-tabla-contenedor">
              <table className="alertas-tabla">
                <caption>
                  Atenciones pendientes ordenadas por días
                  restantes
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Animal</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Atención</th>
                    <th scope="col">Fecha programada</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Días restantes</th>
                  </tr>
                </thead>

                <tbody>
                  {resultado.alertas.map((alerta) => (
                    <tr key={alerta.atencionId}>
                      <td>
                        {alerta.codigoAnimal}
                        {" "}
                        (ID: {alerta.animalId})
                      </td>

                      <td>
                        {alerta.nombreAnimal || "Sin nombre"}
                      </td>

                      <td>{etiquetas[alerta.tipo]}</td>
                      <td>{alerta.fechaProgramada}</td>

                      <td>
                        <span
                          className={
                            `alerta-estado alerta-${alerta.estado}`
                          }
                        >
                          {alerta.estado === "vencido"
                            ? "Vencida"
                            : "Próxima"}
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