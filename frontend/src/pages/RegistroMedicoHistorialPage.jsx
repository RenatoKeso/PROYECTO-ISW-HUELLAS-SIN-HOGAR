import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import RegistroMedicoPage from "./RegistroMedicoPage.jsx";
import {
  FILTROS_HISTORIAL_VACIOS,
  construirParamsHistorial,
  leerFiltrosHistorial,
} from "../utils/filtrosHistorialMedico.js";

export default function RegistroMedicoHistorialPage({ usuario }) {
  const [params, setParams] = useSearchParams();

  const filtros = useMemo(() => leerFiltrosHistorial(params), [params]);
  const cambiarFiltros = useMemo(
    () => (nuevosFiltros) => setParams(construirParamsHistorial(nuevosFiltros), { replace: true }),
    [setParams],
  );

  return (
    <RegistroMedicoPage
      usuario={usuario}
      modo="historial"
      filtros={filtros ?? FILTROS_HISTORIAL_VACIOS}
      onFiltrosChange={cambiarFiltros}
    />
  );
}
