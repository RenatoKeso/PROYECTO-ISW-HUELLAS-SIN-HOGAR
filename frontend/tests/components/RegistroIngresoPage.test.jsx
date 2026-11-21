import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroIngresoPage from "../../src/pages/RegistroIngresoPage.jsx";
import { listarFichas } from "../../src/services/animalesService.js";
import { listarVoluntarios } from "../../src/services/voluntariosService.js";

vi.mock("../../src/services/animalesService.js", () => ({
  listarFichas: vi.fn(),
  registrarIngreso: vi.fn(),
}));

vi.mock("../../src/services/voluntariosService.js", () => ({
  listarVoluntarios: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <RegistroIngresoPage />
    </MemoryRouter>,
  );
}

describe("RegistroIngresoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarFichas.mockResolvedValue({ fichas: [] });
    listarVoluntarios.mockResolvedValue({ voluntarios: [] });
  });

  test("muestra el formulario de ingreso y carga sus opciones", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Registrar ingreso de animal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Volver a Registro de animales" }),
    ).toHaveAttribute("href", "/registro");
    expect(screen.getByText("Módulo de Ingresos")).toBeInTheDocument();

    expect(screen.getByLabelText(/Código de la ficha/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Fecha y hora de ingreso/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Receptor/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Procedencia/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Ubicación de hallazgo/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Estado de salud/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar ingreso" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(listarFichas).toHaveBeenCalled();
      expect(listarVoluntarios).toHaveBeenCalled();
    });
  });

  test("muestra las fichas disponibles con código y nombre", async () => {
    listarFichas.mockResolvedValue({
      fichas: [
        {
          codigoAnimal: "anim-001",
          nombre: "Gretel",
          especie: "PERRO",
          raza: "Mestizo",
          sexoAnimal: "HEMBRA",
        },
        {
          codigoAnimal: "anim-002",
          nombre: null,
          especie: "GATO",
          raza: null,
          sexoAnimal: "MACHO",
        },
      ],
    });

    renderPage();

    expect(
      await screen.findByRole("option", { name: "anim-001 — Gretel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "anim-002" }),
    ).toBeInTheDocument();
  });

  test("valida los campos obligatorios antes de registrar", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Registrar ingreso" }),
    );

    expect(
      await screen.findByText("El código debe tener el formato anim-001"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Selecciona el receptor del ingreso"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("La procedencia no puede estar vacía"),
    ).toBeInTheDocument();
  });

  test("preselecciona la ficha indicada en la URL", async () => {
    listarFichas.mockResolvedValue({
      fichas: [
        {
          id: 1,
          codigoAnimal: "anim-001",
          nombre: "Gretel",
          especie: "PERRO",
          raza: "Mestizo",
          sexoAnimal: "HEMBRA",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/registro/ingreso?codigo=anim-001"]}>
        <RegistroIngresoPage />
      </MemoryRouter>,
    );

    await screen.findByRole("option", { name: "anim-001 — Gretel" });

    expect(screen.getByLabelText(/Código de la ficha/)).toHaveValue(
      "anim-001",
    );

    await waitFor(() => {
      expect(listarFichas).toHaveBeenCalled();
    });
  });
});
