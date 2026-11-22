import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";

import RevisionCompletaVista from "../../src/components/registroMedico/RevisionCompletaVista.jsx";

const registro = {
  id: 1,
  animalId: 1,
  estadoValidacion: "VALIDACION_PENDIENTE",
  createdAt: "2026-11-14T10:00:00.000Z",
  pesoKg: 12.4,
  clasificacionSalud: "NORMAL",
  observacionInicial: "Animal estable al ingreso",
  animal: {
    id: 1,
    codigoAnimal: "anim-001",
    nombre: "Gretel",
    especie: "GATO",
    sexoAnimal: "HEMBRA",
    edad: 3,
  },
};

function renderVista(overrides = {}) {
  render(
    <MemoryRouter>
      <RevisionCompletaVista
        registro={registro}
        usuario={{ nombre: "Dra. Pérez" }}
        onSubmit={vi.fn()}
        onCerrar={vi.fn()}
        onCorregirInicial={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe("RevisionCompletaVista", () => {
  test("muestra el diseño de la página de revisión completa", () => {
    renderVista();

    expect(
      screen.getByText("Revisión inicial registrada correctamente"),
    ).toBeInTheDocument();
    expect(screen.getByText("Paso 2 de 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gretel" })).toBeInTheDocument();
    expect(screen.getByText("Peso inicial")).toBeInTheDocument();
    expect(screen.getByText("12.4 kg")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Revisión Completa y Evaluación Clínica",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Constantes y evaluación general")).toBeInTheDocument();
    expect(
      screen.getByText("Examen físico y hallazgos detallados"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Diagnóstico, tratamientos y plan sanitario"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar como borrador" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar revisión completa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Corregir revisión inicial" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar ficha" })).toBeInTheDocument();
    expect(screen.getByText("Historial médico")).toBeInTheDocument();
    expect(screen.getByText("Seguimientos")).toBeInTheDocument();
  });

  test("oculta las secciones propias de la página cuando se usa dentro del modal", () => {
    renderVista({
      mostrarMigas: false,
      mostrarBanner: false,
      mostrarAnimal: false,
      mostrarTabs: false,
      mostrarComplementarias: false,
    });

    expect(screen.queryByText("Paso 2 de 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Peso inicial")).not.toBeInTheDocument();
    expect(screen.queryByText("Historial médico")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Revisión Completa y Evaluación Clínica",
      }),
    ).toBeInTheDocument();
  });

  test("permite corregir la revisión inicial desde la revisión completa", () => {
    renderVista({ corrigiendoInicial: true, onCancelarCorreccion: vi.fn() });

    expect(
      screen.getByRole("heading", { name: "Corregir revisión inicial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar corrección" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Registrar revisión completa" }),
    ).not.toBeInTheDocument();
  });
});
