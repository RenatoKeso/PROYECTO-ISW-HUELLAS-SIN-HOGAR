import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroPage from "../../src/pages/RegistroPage.jsx";
import {
  listarFichas,
  listarIngresosGlobales,
} from "../../src/services/animalesService.js";

vi.mock("../../src/services/animalesService.js", () => ({
  listarFichas: vi.fn(),
  listarIngresosGlobales: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <RegistroPage />
    </MemoryRouter>,
  );
}

describe("RegistroPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarFichas.mockResolvedValue({ fichas: [] });
    listarIngresosGlobales.mockResolvedValue({ ingresos: [] });
  });

  test("muestra el encabezado y las cuatro acciones del registro de animales", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Registro de animales" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Módulo Operativo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Registrar ficha de animal/i }),
    ).toHaveAttribute("href", "/registro/ficha");
    expect(
      screen.getByRole("link", { name: /Registrar ingreso de animal/i }),
    ).toHaveAttribute("href", "/registro/ingreso");
    expect(
      screen.getByRole("link", { name: /Lista de fichas/i }),
    ).toHaveAttribute("href", "/registro/fichas");
    expect(
      screen.getByRole("link", { name: /Historial de ingresos/i }),
    ).toHaveAttribute("href", "/registro/historial");

    expect(await screen.findAllByText("0")).toHaveLength(2);
  });

  test("muestra la cantidad de fichas y de ingresos existentes", async () => {
    listarFichas.mockResolvedValue({ fichas: [{}, {}] });
    listarIngresosGlobales.mockResolvedValue({
      ingresos: [{}, {}, {}],
    });

    renderPage();

    const bloqueFichas = screen
      .getByText("Fichas existentes")
      .closest(".registro-hub-contador");
    const bloqueIngresos = screen
      .getByText("Animales ingresados")
      .closest(".registro-hub-contador");

    expect(await within(bloqueFichas).findByText("2")).toBeInTheDocument();
    expect(await within(bloqueIngresos).findByText("3")).toBeInTheDocument();
  });
});
