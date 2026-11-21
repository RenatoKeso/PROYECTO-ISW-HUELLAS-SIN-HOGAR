import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroFichasPage from "../../src/pages/RegistroFichasPage.jsx";
import {
  listarFichas,
  listarIngresosFicha,
  quitarImagenFicha,
  subirImagenFicha,
} from "../../src/services/animalesService.js";

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

const ficha = {
  id: 1,
  codigoAnimal: "anim-001",
  nombre: "Gretel",
  especie: "PERRO",
  sexoAnimal: "HEMBRA",
  raza: "Mestizo",
  edad: 2,
  observaciones: "Sociable con otros perros.",
  imagenUrl: "/uploads/animales/gretel.png",
};

const fichaGato = {
  id: 2,
  codigoAnimal: "anim-002",
  nombre: "Luna",
  especie: "GATO",
  sexoAnimal: "HEMBRA",
  raza: "Siamés",
  edad: 1,
  observaciones: "Requiere dieta blanda.",
  imagenUrl: null,
};

function RutaDestino() {
  const ubicacion = useLocation();

  return (
    <p data-testid="ruta-destino">
      {`${ubicacion.pathname}${ubicacion.search}`}
    </p>
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/registro/fichas"]}>
      <Routes>
        <Route path="/registro/fichas" element={<RegistroFichasPage />} />
        <Route path="*" element={<RutaDestino />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RegistroFichasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarFichas.mockResolvedValue({ fichas: [ficha] });
    subirImagenFicha.mockResolvedValue({ ficha });
    quitarImagenFicha.mockResolvedValue({ ficha: { ...ficha, imagenUrl: null } });

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

  test("muestra los datos de la ficha en una ventana", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Ver ficha" }));

    const ventana = screen.getByRole("dialog", {
      name: "Ficha de Gretel",
    });

    expect(within(ventana).getByText("anim-001")).toBeInTheDocument();
    expect(within(ventana).getByText("Mestizo")).toBeInTheDocument();
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
    renderPage();

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

  test("muestra los contadores y filtra por especie", async () => {
    listarFichas.mockResolvedValue({ fichas: [ficha, fichaGato] });

    renderPage();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Lista de animales",
      }),
    ).toBeInTheDocument();

    const resumenTotal = screen
      .getByText("Total")
      .closest(".lista-fichas-resumen-grupo");
    const resumenPerros = screen
      .getByText("Perros")
      .closest(".lista-fichas-resumen-grupo");
    const resumenGatos = screen
      .getByText("Gatos")
      .closest(".lista-fichas-resumen-grupo");

    expect(within(resumenTotal).getByText("2")).toBeInTheDocument();
    expect(within(resumenPerros).getByText("1")).toBeInTheDocument();
    expect(within(resumenGatos).getByText("1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Perros (1)" }));

    expect(screen.getByText("Gretel")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();
  });

  test("filtra por nombre, código o raza y limpia los filtros", async () => {
    listarFichas.mockResolvedValue({ fichas: [ficha, fichaGato] });

    renderPage();

    const buscador = await screen.findByRole("searchbox", {
      name: "Buscar por nombre, código o raza",
    });

    fireEvent.change(buscador, { target: { value: "gret" } });
    expect(screen.getByText("Gretel")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();

    fireEvent.change(buscador, { target: { value: "002" } });
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.queryByText("Gretel")).not.toBeInTheDocument();

    fireEvent.change(buscador, { target: { value: "siamés" } });
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.queryByText("Gretel")).not.toBeInTheDocument();

    fireEvent.change(buscador, { target: { value: "no-existe" } });

    expect(
      screen.getByText("No se encontraron animales con estos filtros"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Restablecer filtros" }),
    );

    expect(screen.getByText("Gretel")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
  });

  test("ordena las fichas por nombre", async () => {
    listarFichas.mockResolvedValue({ fichas: [ficha, fichaGato] });

    renderPage();

    await screen.findByText("Gretel");

    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar fichas" }), {
      target: { value: "az" },
    });

    const nombres = screen
      .getAllByRole("heading", { level: 2 })
      .map((titulo) => titulo.textContent);

    expect(nombres).toEqual(["Gretel", "Luna"]);
  });

  test("elimina la imagen de una ficha", async () => {
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Quitar imagen de Gretel" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Imagen de anim-001 eliminada correctamente."),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Sin fotografía asignada")).toBeInTheDocument();
  });

  test("sube una nueva imagen para una ficha", async () => {
    const fichaConImagenNueva = {
      ...ficha,
      imagenUrl: "/uploads/animales/gretel-nueva.png",
    };
    subirImagenFicha.mockResolvedValue({ ficha: fichaConImagenNueva });

    renderPage();

    const archivo = new File(["imagen"], "gretel-nueva.png", {
      type: "image/png",
    });

    const entradaImagen = await screen.findByLabelText(
      "Cambiar imagen de Gretel",
    );

    fireEvent.change(entradaImagen, {
      target: { files: [archivo] },
    });

    await waitFor(() => {
      expect(
        screen.getByText("Imagen de anim-001 actualizada correctamente."),
      ).toBeInTheDocument();
    });

    expect(subirImagenFicha).toHaveBeenCalledWith(1, archivo);
  });

  test("navega al historial de ingresos de la ficha", async () => {
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Historial de Gretel" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("ruta-destino")).toHaveTextContent(
        "/registro/historial?busqueda=anim-001",
      );
    });
  });

  test("muestra un aviso cuando la ficha no tiene ingresos", async () => {
    listarIngresosFicha.mockResolvedValue({ ficha, ingresos: [] });

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Historial de Gretel" }),
    );

    const dialogo = await screen.findByRole("dialog", {
      name: "Sin registros de ingresos",
    });

    expect(
      within(dialogo).getByText(
        /No existen registros de ingresos para este animal/,
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      within(dialogo).getByRole("button", { name: "Registrar ingreso" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("ruta-destino")).toHaveTextContent(
        "/registro/ingreso?codigo=anim-001",
      );
    });
  });
});
