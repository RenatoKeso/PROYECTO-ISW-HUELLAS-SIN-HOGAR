import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroPage from "../../src/pages/RegistroPage.jsx";
import { listarFichas, listarIngresosFicha, listarIngresosGlobales } from "../../src/services/animalesService.js";
import { listarVoluntarios } from "../../src/services/voluntariosService.js";

vi.mock("../../src/services/animalesService.js", () => ({
  crearFicha: vi.fn(),
  crearFichaConImagen: vi.fn(),
  listarFichas: vi.fn(),
  listarIngresosFicha: vi.fn(),
  listarIngresosGlobales: vi.fn(),
  quitarImagenFicha: vi.fn(),
  registrarIngreso: vi.fn(),
  subirImagenFicha: vi.fn(),
}));

vi.mock("../../src/services/voluntariosService.js", () => ({
  listarVoluntarios: vi.fn(),
}));

const ficha = {
  id: 1,
  codigoAnimal: "anim-001",
  nombre: "Gretel",
  especie: "PERRO",
  sexoAnimal: "HEMBRA",
  observaciones: "Sociable con otros perros.",
  imagenUrl: "/uploads/animales/gretel.png",
};

describe("RegistroPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarFichas.mockResolvedValue({ fichas: [ficha] });
    listarVoluntarios.mockResolvedValue({ voluntarios: [] });
    listarIngresosGlobales.mockResolvedValue({ ingresos: [] });

    listarIngresosFicha.mockResolvedValue({
      ficha,
      ingresos: [
        {
          id: 3,
          tipo: "INGRESO",
          fechaIngreso: "2026-11-03T10:00:00.000Z",
          procedencia: "Hallazgo en via publica",
          receptor: { id: 2, nombre: "Ana" },
          ubicacionEncontrado: "Av. Central",
          estadoSalud: "En observacion",
        },
        {
          id: 8,
          tipo: "REINGRESO",
          fechaIngreso: "2026-11-04T10:00:00.000Z",
          procedencia: "Devolucion",
          receptor: { id: 3, nombre: "Luis" },
          ubicacionEncontrado: null,
          estadoSalud: null,
        },
      ],
    });
  });

  test("muestra las observaciones en una ventana", async () => {
    render(<RegistroPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Observaciones" }),
    );

    const ventana = screen.getByRole("dialog", {
      name: "Observaciones de Gretel",
    });

    expect(
      within(ventana).getByText("Sociable con otros perros."),
    ).toBeInTheDocument();

    fireEvent.click(
      within(ventana).getByRole("button", { name: "Cerrar ventana" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("amplía la imagen de la ficha y cierra con Escape", async () => {
    render(<RegistroPage />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Ampliar imagen de Gretel",
      }),
    );

    const ventana = screen.getByRole("dialog", {
      name: "Imagen ampliada de Gretel",
    });

    expect(
      within(ventana).getByRole("img", { name: "Imagen de Gretel" }),
    ).toHaveAttribute(
      "src",
      expect.stringMatching(/\/uploads\/animales\/gretel\.png$/),
    );

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("filtra fichas por nombre y muestra su código", async () => {
    render(<RegistroPage />);

    await screen.findByText("Gretel");

    fireEvent.change(screen.getByLabelText("Nombre del animal", { selector: "#busquedaFichaNombre" }), {
      target: { value: "gret" },
    });

    expect(screen.getByText("anim-001")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nombre del animal", { selector: "#busquedaFichaNombre" }), {
      target: { value: "no-existe" },
    });

    await waitFor(() => {
      expect(screen.queryByText("anim-001")).not.toBeInTheDocument();
    });
  });

  test("abre el historial y muestra el tipo de ingreso", async () => {
    render(<RegistroPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Historial" }));

    await screen.findByText("Historial de ingresos de Gretel");

    expect(screen.getByText("Ingreso")).toBeInTheDocument();
    expect(screen.getByText("Reingreso")).toBeInTheDocument();
  });

  test("busca en el historial global por código y nombre", async () => {
    listarIngresosGlobales.mockResolvedValue({
      ingresos: [
        {
          id: 38,
          tipo: "INGRESO",
          fechaIngreso: "2026-11-09T22:26:00.000Z",
          procedencia: "via publica",
          receptor: { id: 6, nombre: "Martina Concha" },
          ubicacionEncontrado: "Av. Central",
          estadoSalud: "Sano",
          fichaAnimal: {
            id: 52,
            codigoAnimal: "anim-005",
            nombre: "adolfo",
          },
        },
      ],
    });

    render(<RegistroPage />);

    await screen.findByText("Historial de ingresos");

    fireEvent.change(
      screen.getByLabelText("Código del animal", {
        selector: "#busquedaHistorialCodigo",
      }),
      { target: { value: "anim-005" } },
    );
    fireEvent.change(
      screen.getByLabelText("Nombre del animal", {
        selector: "#busquedaHistorialNombre",
      }),
      { target: { value: "adolfo" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(listarIngresosGlobales).toHaveBeenCalledWith({
        codigo: "anim-005",
        nombre: "adolfo",
      });
    });

    await screen.findByText("adolfo");
    expect(screen.getByText("anim-005")).toBeInTheDocument();
  });
});
