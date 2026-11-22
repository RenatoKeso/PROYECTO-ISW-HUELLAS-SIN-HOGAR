import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";

import RegistroFichaPage from "../../src/pages/RegistroFichaPage.jsx";

vi.mock("../../src/services/animalesService.js", () => ({
  crearFicha: vi.fn(),
  crearFichaConImagen: vi.fn(),
}));

function renderPage() {
  render(
    <MemoryRouter>
      <RegistroFichaPage />
    </MemoryRouter>,
  );
}

describe("RegistroFichaPage", () => {
  test("muestra el formulario de ficha y el botón para agregar imagen", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Registrar ficha de animal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar imagen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Volver a Registro de animales" }),
    ).toHaveAttribute("href", "/registro");
  });

  test("muestra el nombre de la imagen seleccionada y permite quitarla", async () => {
    const user = userEvent.setup();
    renderPage();

    const archivo = new File(["imagen"], "luna.png", { type: "image/png" });

    await user.upload(screen.getByLabelText("Imagen del animal"), archivo);

    expect(screen.getByText("luna.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar imagen" }));

    expect(
      screen.getByText("Arrastra una imagen aquí o selecciónala"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar imagen" }),
    ).not.toBeInTheDocument();
  });

  test("cancelar reinicia campos, errores y la imagen seleccionada", async () => {
    const user = userEvent.setup();
    renderPage();

    const nombre = screen.getByLabelText(/Nombre/);
    const especie = screen.getByLabelText(/Especie/);
    const archivo = new File(["imagen"], "toby.png", { type: "image/png" });

    await user.type(nombre, "Toby");
    await user.selectOptions(especie, "PERRO");
    await user.upload(screen.getByLabelText("Imagen del animal"), archivo);

    expect(screen.getByText("toby.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(nombre).toHaveValue("");
    expect(especie).toHaveValue("");
    expect(
      screen.getByText("Arrastra una imagen aquí o selecciónala"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar imagen" }),
    ).not.toBeInTheDocument();
  });
});
