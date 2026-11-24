import {
  CLASIFICACIONES_SALUD,
  ESTADOS_VALIDACION_MEDICA,
} from "../validations/registroMedicoValidation.js";
import { ETIQUETAS_ESPECIE } from "./registroMedicoOpciones.js";

export const ORDENES_HISTORIAL = [
  "recientes",
  "antiguos",
  "codigo",
  "nombre",
];

export const FILTROS_HISTORIAL_VACIOS = {
  estado: "",
  salud: "",
  cuarentena: false,
  semana: false,
  adopcion: "",
  especie: "",
  busqueda: "",
  orden: "recientes",
};

const SALUD_VALIDAS = new Set([...CLASIFICACIONES_SALUD, "FRAGIL"]);
const ESTADOS_VALIDOS = new Set([
  ...ESTADOS_VALIDACION_MEDICA,
  "ACTUALIZACIONES",
]);
const ADOPCION_VALIDA = new Set(["ADOPTABLE", "NO_ADOPTABLE"]);
const ESPECIES_VALIDAS = new Set(Object.keys(ETIQUETAS_ESPECIE));

const ETIQUETAS_SALUD = {
  NORMAL: "Saludables",
  FRAGIL: "Salud frágil",
  ENFERMO: "Enfermos",
  CRITICO: "Críticos",
};

const ETIQUETAS_ADOPCION = {
  ADOPTABLE: "Adoptables",
  NO_ADOPTABLE: "No adoptables",
};

function valorDe(params, nombre) {
  if (!params) return null;
  if (typeof params.get === "function") return params.get(nombre);
  return params[nombre] ?? null;
}

function limpiarTexto(valor, maximo = 120) {
  if (typeof valor !== "string") return "";
  return valor.trim().slice(0, maximo);
}

export function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function estadoSaludActual(registro) {
  return registro?.revisionCompleta?.estadoSalud ?? registro?.clasificacionSalud ?? null;
}

export function esSaludable(registro) {
  return estadoSaludActual(registro) === "NORMAL";
}

export function esSaludFragil(registro) {
  return ["ENFERMO", "CRITICO"].includes(estadoSaludActual(registro));
}

export function estaEnCuarentena(registro) {
  return registro?.requiereCuarentena === true;
}

export function esAdoptable(registro) {
  return registro?.animal?.estadoAdopcion === "ADOPTABLE";
}

export function esNoAdoptable(registro) {
  return registro?.animal?.estadoAdopcion === "NO_ADOPTABLE";
}

export function fechaActividadMedica(registro) {
  return registro?.fechaRevisionInicial ?? registro?.createdAt ?? null;
}

function fechaReferencia(referencia) {
  if (referencia instanceof Date) {
    return Number.isNaN(referencia.getTime()) ? new Date() : referencia;
  }
  if (typeof referencia === "string") {
    const fecha = new Date(referencia);
    if (!Number.isNaN(fecha.getTime())) return fecha;
  }
  return new Date();
}

export function esMismoDia(valor, referencia = new Date()) {
  if (!valor) return false;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return false;
  const hoy = fechaReferencia(referencia);

  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

export function inicioSemana(referencia = new Date()) {
  const base = fechaReferencia(referencia);
  const dia = base.getDay();
  const desplazamiento = (dia + 6) % 7;
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() - desplazamiento,
  );
}

export function estaEnSemanaActual(registro, referencia = new Date()) {
  const valor = fechaActividadMedica(registro);
  if (!valor) return false;

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return false;

  const inicio = inicioSemana(referencia);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 7);

  return fecha >= inicio && fecha < fin;
}

export function estaPendiente(registro) {
  return ["PROVISIONAL", "VALIDACION_PENDIENTE", "REVISANDO"].includes(
    registro?.estadoValidacion,
  );
}

export function estaArchivado(registro) {
  return ["REALIZADO", "ACTUALIZADO"].includes(registro?.estadoValidacion);
}

export function estaPendienteHoy(registro, referencia = new Date()) {
  return estaPendiente(registro) && esMismoDia(registro?.createdAt, referencia);
}

export function coincideBusqueda(registro, busqueda) {
  const texto = normalizarTexto(busqueda);
  if (!texto) return true;

  const nombre = normalizarTexto(registro?.animal?.nombre);
  const codigo = normalizarTexto(registro?.animal?.codigoAnimal);

  return nombre.includes(texto) || codigo.includes(texto);
}

export function leerFiltrosHistorial(params) {
  const estado = valorDe(params, "estado");
  const salud = valorDe(params, "salud");
  const cuarentena = valorDe(params, "cuarentena");
  const semana = valorDe(params, "semana");
  const adopcion = valorDe(params, "adopcion");
  const especie = valorDe(params, "especie");
  const orden = valorDe(params, "orden");

  return {
    estado: ESTADOS_VALIDOS.has(estado) ? estado : "",
    salud: SALUD_VALIDAS.has(salud) ? salud : "",
    cuarentena: cuarentena === true || cuarentena === "true",
    semana: semana === "actual",
    adopcion: ADOPCION_VALIDA.has(adopcion) ? adopcion : "",
    especie: ESPECIES_VALIDAS.has(especie) ? especie : "",
    busqueda: limpiarTexto(valorDe(params, "busqueda")),
    orden: ORDENES_HISTORIAL.includes(orden) ? orden : "recientes",
  };
}

export function construirParamsHistorial(filtros = {}) {
  const params = new URLSearchParams();

  if (ESTADOS_VALIDOS.has(filtros.estado)) params.set("estado", filtros.estado);
  if (SALUD_VALIDAS.has(filtros.salud)) params.set("salud", filtros.salud);
  if (filtros.cuarentena === true) params.set("cuarentena", "true");
  if (filtros.semana === true) params.set("semana", "actual");
  if (ADOPCION_VALIDA.has(filtros.adopcion)) {
    params.set("adopcion", filtros.adopcion);
  }
  if (ESPECIES_VALIDAS.has(filtros.especie)) {
    params.set("especie", filtros.especie);
  }

  const busqueda = limpiarTexto(filtros.busqueda);
  if (busqueda) params.set("busqueda", busqueda);

  if (ORDENES_HISTORIAL.includes(filtros.orden) && filtros.orden !== "recientes") {
    params.set("orden", filtros.orden);
  }

  return params;
}

export function aplicarFiltrosHistorial(registros = [], filtros = {}) {
  return registros.filter((registro) => {
    if (
      filtros.estado &&
      filtros.estado !== "ACTUALIZACIONES" &&
      registro.estadoValidacion !== filtros.estado
    ) {
      return false;
    }

    if (filtros.salud === "NORMAL" && !esSaludable(registro)) return false;
    if (filtros.salud === "FRAGIL" && !esSaludFragil(registro)) return false;
    if (
      ["ENFERMO", "CRITICO"].includes(filtros.salud) &&
      estadoSaludActual(registro) !== filtros.salud
    ) {
      return false;
    }

    if (filtros.cuarentena && !estaEnCuarentena(registro)) return false;
    if (filtros.semana && !estaEnSemanaActual(registro)) return false;

    if (filtros.adopcion && registro.animal?.estadoAdopcion !== filtros.adopcion) {
      return false;
    }

    if (filtros.especie && registro?.animal?.especie !== filtros.especie) {
      return false;
    }

    if (filtros.busqueda && !coincideBusqueda(registro, filtros.busqueda)) {
      return false;
    }

    return true;
  });
}

export function aplicarBusquedaActualizaciones(actualizaciones = [], busqueda = "") {
  const texto = normalizarTexto(busqueda);
  if (!texto) return actualizaciones;

  return actualizaciones.filter((item) => {
    const animal = item?.registroMedico?.animal;
    return (
      normalizarTexto(animal?.nombre).includes(texto) ||
      normalizarTexto(animal?.codigoAnimal).includes(texto)
    );
  });
}

function fechaOrdenable(valor) {
  const fecha = new Date(valor ?? 0);
  return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
}

export function ordenarRegistros(registros = [], orden = "recientes") {
  const copia = [...registros];

  copia.sort((a, b) => {
    if (orden === "antiguos") {
      return fechaOrdenable(a.createdAt) - fechaOrdenable(b.createdAt);
    }

    if (orden === "codigo") {
      return String(a.animal?.codigoAnimal ?? "").localeCompare(
        String(b.animal?.codigoAnimal ?? ""),
        "es",
      );
    }

    if (orden === "nombre") {
      return String(a.animal?.nombre ?? "").localeCompare(
        String(b.animal?.nombre ?? ""),
        "es",
      );
    }

    return fechaOrdenable(b.createdAt) - fechaOrdenable(a.createdAt);
  });

  return copia;
}

export function describirFiltrosActivos(filtros = {}) {
  const chips = [];

  if (filtros.salud) {
    chips.push({
      clave: "salud",
      etiqueta: ETIQUETAS_SALUD[filtros.salud] ?? filtros.salud,
    });
  }

  if (filtros.cuarentena) {
    chips.push({ clave: "cuarentena", etiqueta: "En cuarentena" });
  }

  if (filtros.semana) {
    chips.push({ clave: "semana", etiqueta: "Esta semana" });
  }

  if (filtros.adopcion) {
    chips.push({
      clave: "adopcion",
      etiqueta: ETIQUETAS_ADOPCION[filtros.adopcion] ?? filtros.adopcion,
    });
  }

  if (filtros.especie) {
    chips.push({
      clave: "especie",
      etiqueta: ETIQUETAS_ESPECIE[filtros.especie] ?? filtros.especie,
    });
  }

  if (filtros.busqueda) {
    chips.push({
      clave: "busqueda",
      etiqueta: `Búsqueda: "${filtros.busqueda}"`,
    });
  }

  return chips;
}

export function hayFiltrosActivos(filtros = {}) {
  return Boolean(
    filtros.estado ||
      filtros.salud ||
      filtros.cuarentena ||
      filtros.semana ||
      filtros.adopcion ||
      filtros.especie ||
      filtros.busqueda,
  );
}

export function contarPorEstado(registros = []) {
  return registros.reduce(
    (conteos, registro) => {
      conteos.total += 1;
      const estado = registro.estadoValidacion;
      conteos[estado] = (conteos[estado] ?? 0) + 1;
      return conteos;
    },
    { total: 0 },
  );
}

export function contarRevisionesIniciales(registros = []) {
  return registros.filter((registro) => Boolean(registro.revisionInicial)).length;
}

export function contarAlDia(registros = []) {
  return registros.filter((registro) => estaArchivado(registro)).length;
}
