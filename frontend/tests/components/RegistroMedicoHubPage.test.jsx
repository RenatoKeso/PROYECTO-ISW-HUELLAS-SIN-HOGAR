import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroMedicoHubPage from "../../src/pages/RegistroMedicoHubPage.jsx";
import * as registroMedicoService from "../../src/services/registroMedicoService.js";

vi.mock("../../src/services/registroMedicoService.js", () => ({
  listarRegistrosMedicos: vi.fn(),
}));

describe("RegistroMedicoHubPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registroMedicoService.listarRegistrosMedicos.mockResolvedValue({
      message: "ok",
      registros: [],
    });
  });

  test("renderiza el hub y las tarjetas de acceso", async () => {
    render(
      <MemoryRouter>
        <RegistroMedicoHubPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Registro Médico")).toBeInTheDocument();
    expect(await screen.findByText("Realizar revisiones médicas")).toBeInTheDocument();
    expect(await screen.findByText("Historial de registros médicos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Animales saludables/i })).toHaveAttribute(
      "href",
      "/salud/registros-medicos/historial?salud=NORMAL",
    );
    expect(screen.getByRole("link", { name: /En cuarentena/i })).toHaveAttribute(
      "href",
      "/salud/registros-medicos/historial?cuarentena=true",
    );
    expect(screen.getByRole("link", { name: /Listos para adopción/i })).toHaveAttribute(
      "href",
      "/salud/registros-medicos/historial?adopcion=ADOPTABLE",
    );
    expect(screen.queryByRole("link", { name: /Nueva revisión/i })).not.toBeInTheDocument();
  });

  test("calcula métricas con registros sin confundir el índice de filter con la fecha", async () => {
    const hoy = new Date();
    registroMedicoService.listarRegistrosMedicos.mockResolvedValue({
      message: "ok",
      registros: [
        {
          id: 1,
          estadoValidacion: "PROVISIONAL",
          createdAt: hoy.toISOString(),
          requiereCuarentena: false,
          animal: { codigoAnimal: "anim-001", nombre: "Gretel", estadoAdopcion: "ADOPTABLE" },
        },
        {
          id: 2,
          estadoValidacion: "REALIZADO",
          createdAt: "2020-01-01T00:00:00.000Z",
          requiereCuarentena: false,
          animal: { codigoAnimal: "anim-002", nombre: "Luna", estadoAdopcion: "NO_ADOPTABLE" },
        },
      ],
    });

    render(
      <MemoryRouter>
        <RegistroMedicoHubPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Total: 2 animales")).toBeInTheDocument();
    expect(screen.getByText("Pendientes hoy")).toBeInTheDocument();
    expect(screen.getByText("Pendientes totales")).toBeInTheDocument();
    expect(screen.getByText("Fichas registradas")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Revisiones esta semana: 1/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/fichas archivadas/)).not.toBeInTheDocument();
  });
});
