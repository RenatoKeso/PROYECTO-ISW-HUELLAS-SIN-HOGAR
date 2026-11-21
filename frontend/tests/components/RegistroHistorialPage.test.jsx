import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroHistorialPage from "../../src/pages/RegistroHistorialPage.jsx";
import { listarIngresosGlobales } from "../../src/services/animalesService.js";

vi.mock("../../src/services/animalesService.js", () => ({
  listarIngresosGlobales: vi.fn(),
}));

const ingresoPerro = {
  id: 38,
  tipo: "INGRESO",
  fechaIngreso: "2026-11-09T22:26:00.000Z",
  procedencia: "Vía pública",
  receptor: { id: 6, nombre: "Martina Concha" },
  ubicacionEncontrado: "Av. Central",
  estadoSalud: "Sano",
  fichaAnimal: {
    id: 52,
    codigoAnimal: "anim-005",
    nombre: "Adolfo",
    especie: "PERRO",
    raza: "Mestizo",
  },
};

const ingresoGato = {
  id: 20,
  tipo: "REINGRESO",
  fechaIngreso: "2026-10-01T15:00:00.000Z",
  procedencia: "Entrega voluntaria",
  receptor: { id: 7, nombre: "Tomas Morales" },
  ubicacionEncontrado: null,
  estadoSalud: null,
  fichaAnimal: {
    id: 60,
    codigoAnimal: "anim-002",
    nombre: "Luna",
    especie: "GATO",
    raza: "Siamés",
  },
};

function renderPage(initialEntries = ["/registro/historial"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <RegistroHistorialPage />
    </MemoryRouter>,
  );
}

describe("RegistroHistorialPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarIngresosGlobales.mockResolvedValue({
      ingresos: [ingresoPerro, ingresoGato],
    });
  });

  test("filtra al entrar con una búsqueda en la URL", async () => {
    renderPage(["/registro/historial?busqueda=anim-005"]);

    const buscador = await screen.findByRole("searchbox", {
      name: "Buscar por nombre, código o raza",
    });

    expect(buscador).toHaveValue("anim-005");
    expect(await screen.findByText("Adolfo")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();

    const resumen = screen
      .getByText("Total")
      .closest(".lista-fichas-resumen-grupo");

    expect(within(resumen).getByText("1")).toBeInTheDocument();
  });

  test("busca por nombre o raza y filtra por especie", async () => {
    renderPage();

    expect(await screen.findByText("Adolfo")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Perros (1)" }));

    expect(screen.getByText("Adolfo")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Todos (2)" }));

    const buscador = screen.getByRole("searchbox", {
      name: "Buscar por nombre, código o raza",
    });

    fireEvent.change(buscador, { target: { value: "mestizo" } });

    expect(screen.getByText("Adolfo")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();

    fireEvent.change(buscador, { target: { value: "no-existe" } });

    expect(
      screen.getByText("No se encontraron ingresos con estos filtros"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(screen.getByText("Adolfo")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
  });

  test("no muestra la columna número de ingreso", async () => {
    renderPage();

    await screen.findByText("Adolfo");

    expect(
      screen.queryByRole("columnheader", { name: "N° de ingreso" }),
    ).not.toBeInTheDocument();
  });

  test("carga el historial una sola vez", async () => {
    renderPage();

    await waitFor(() => {
      expect(listarIngresosGlobales).toHaveBeenCalledTimes(1);
    });

    expect(listarIngresosGlobales).toHaveBeenCalledWith();
  });
});
