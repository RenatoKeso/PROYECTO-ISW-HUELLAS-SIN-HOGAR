import { useEffect, useState } from "react";
import { hoyEnChile } from "../utils/calendarioTurnos.js";
import { api } from "../services/api.js";
import { ETIQUETAS_TIPO_ATENCION } from "../utils/planSanitario.js";
import PaginacionSanitaria from "./PaginacionSanitaria.jsx";

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const formatoMes = new Intl.DateTimeFormat("es-CL", {
month: "long",
year: "numeric",
timeZone: "UTC",
});
const formatoDia = new Intl.DateTimeFormat("es-CL", {
weekday: "long",
day: "numeric",
month: "long",
timeZone: "UTC",
});
const porPagina = 5;

function fechaDelMes(mes, desplazamiento = 0) {
    const fecha = new Date(mes + "-01T00:00:00Z");
    fecha.setUTCMonth(fecha.getUTCMonth() + desplazamiento);
    return fecha;
}

export default function CalendarioSanitario() {
    const [hoy] = useState(hoyEnChile);
    const [mes, setMes] = useState(hoy.slice(0, 7));
    const [seleccion, setSeleccion] = useState("");
    const [pagina, setPagina] = useState(1);
    const [respuesta, setRespuesta] = useState(null);
    const [error, setError] = useState("");
    const [intento, setIntento] = useState(0);

useEffect(() => {
    const peticion = new AbortController();

    api.get("/salud/agenda?mes=" + mes, { signal: peticion.signal })
        .then(datos => {
        if (!peticion.signal.aborted) setRespuesta(datos);
        })
    .catch(fallo => {
        if (!peticion.signal.aborted) setError(fallo.message);
        });

    return () => peticion.abort();
}, [mes, intento]);

    function consultarMes(nuevoMes) {
    if (nuevoMes === mes) return;
    setMes(nuevoMes);
    setRespuesta(null);
    setError("");
    setSeleccion("");
    setPagina(1);
}

    const primero = fechaDelMes(mes);
    const inicio = (primero.getUTCDay() + 6) % 7;
    const ultimo = fechaDelMes(mes, 1);
    ultimo.setUTCDate(0);

    const porDia = new Map();

    for (const atencion of respuesta?.atenciones ?? []) {
    const fecha = atencion.fechaProgramada;
    if (!porDia.has(fecha)) porDia.set(fecha, []);
    porDia.get(fecha).push(atencion);
}

    const dia = seleccion || (
    mes === hoy.slice(0, 7) ? hoy : porDia.keys().next().value || mes + "-01"
);
const citas = porDia.get(dia) ?? [];

    return (
    <section className="salud-panel" aria-label="Agenda mensual">
        <div className="salud-mes">
        <h3>{formatoMes.format(primero)}</h3>
        <div className="salud-controles">
            <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => consultarMes(fechaDelMes(mes, -1).toISOString().slice(0, 7))}
        >
            ‹
            </button>
            <button
            type="button"
            onClick={() => {
                consultarMes(hoy.slice(0, 7));
                setSeleccion(hoy);
                setPagina(1);
            }}
        >
            Hoy
            </button>
            <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => consultarMes(fechaDelMes(mes, 1).toISOString().slice(0, 7))}
            >
            ›
        </button>
        </div>
    </div>

    {error ? (
        <div role="alert">
            {error}{" "}
            <button
            type="button"
            onClick={() => {
            setError("");
            setIntento(intento + 1);
            }}
        >
            Reintentar
            </button>
        </div>
    ) : !respuesta ? (
        <p role="status">Cargando agenda…</p>
    ) : (
        <div className="salud-agenda">
            <div className="salud-cuadricula" role="group" aria-label={formatoMes.format(primero)}>
            {diasSemana.map(diaSemana => (
            <span className="salud-semana" key={diaSemana}>{diaSemana}</span>
            ))}
            {Array.from({ length: inicio }, (_, i) => <span key={"vacio" + i} />)}
            {Array.from({ length: ultimo.getUTCDate() }, (_, i) => {
            const fecha = mes + "-" + String(i + 1).padStart(2, "0");
            const total = porDia.get(fecha)?.length ?? 0;

            return (
                <button
                    type="button"
                    key={fecha}
                    aria-pressed={dia === fecha}
                    aria-current={fecha === hoy ? "date" : undefined}
                    aria-label={fecha + ", " + total + (total === 1 ? " atención" : " atenciones")}
                    onClick={() => {
                    setSeleccion(fecha);
                    setPagina(1);
                }}
                >
                    <span>{i + 1}</span>
                    {total > 0 && <small>{total}</small>}
                </button>
            );
            })}
        </div>
        <section className="salud-dia" aria-live="polite">
            <h4>{formatoDia.format(new Date(dia + "T00:00:00Z"))}</h4>
            {citas.length === 0 ? (
                <p>Sin atenciones pendientes para este día.</p>
            ) : (
                <ul>
                {citas.slice((pagina - 1) * porPagina, pagina * porPagina).map((atencion, indice) => (
                    <li key={indice}>
                    <strong>{atencion.nombreAnimal || "Sin nombre"}</strong>
                    <span>{ETIQUETAS_TIPO_ATENCION[atencion.tipo]}</span>
                </li>
                ))}
            </ul>
            )}
            <PaginacionSanitaria
                pagina={pagina}
                hayMas={pagina * porPagina < citas.length}
                cambiar={setPagina}
                etiqueta="Atenciones del día"
            />
        </section>
        </div>
    )}
    </section>
);
}