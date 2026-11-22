import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";

import RevisionInicialVista from "../../src/components/registroMedico/RevisionInicialVista.jsx";

const registro = {
  id: 2,
  animalId: 1,
  estadoValidacion: "PROVISIONAL",
  createdAt: "2026-11-14T10:00:00.000Z",
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
      <RevisionInicialVista
        registro={registro}
        usuario={{ nombre: "Dra. Pérez" }}
        historial={[]}
        seguimientos={[]}
        onSubmit={vi.fn()}
        onCerrar={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe("RevisionInicialVista", () => {
  test("muestra el diseño de la página de revisión inicial", () => {
    renderVista();

    expect(
      screen.getByText("Ficha de ingreso registrada correctamente"),
    ).toBeInTheDocument();
    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gretel" })).toBeInTheDocument();
    expect(
      screen.getByText("Revisión inicial y evaluación clínica"),
    ).toBeInTheDocument();
    expect(screen.getByText("Constantes y triaje inicial")).toBeInTheDocument();
    expect(
      screen.getByText("Observación inicial y hallazgos"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar como borrador" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar revisión inicial" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Historial médico"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Seguimientos")).not.toBeInTheDocument();
  });

  test("adapta el estado de corrección y permite cancelar", () => {
    const onCancelar = vi.fn();
    renderVista({ modo: "corregir", onCancelar });

    expect(
      screen.getByText("Corrección de revisión inicial"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar corrección" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar corrección" }),
    ).toBeInTheDocument();
  });
});
