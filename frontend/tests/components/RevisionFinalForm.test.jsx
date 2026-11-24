import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import RevisionFinalForm from "../../src/components/registroMedico/RevisionFinalForm.jsx";

const registro = {
  id: 1,
  pesoKg: 12.4,
  clasificacionSalud: "NORMAL",
  revisionCompleta: null,
  estadoValidacion: "VALIDACION_PENDIENTE",
};

describe("RevisionFinalForm", () => {
  test("permite guardar un tratamiento sin fecha de fin", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ message: "ok" });

    render(<RevisionFinalForm registro={registro} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/Adoptabilidad/i), {
      target: { value: "ADOPTABLE" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Agregar tratamiento/i }),
    );
    fireEvent.change(screen.getByLabelText(/Descripción/i), {
      target: { value: "Antibiótico" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha inicio/i), {
      target: { value: "2026-11-08" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Registrar revisión completa/i }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const datos = onSubmit.mock.calls[0][0];
    expect(datos.tratamientos).toHaveLength(1);
    expect(datos.tratamientos[0].fechaFin).toBeUndefined();
  });

  test("muestra un mensaje claro cuando falta seleccionar la adoptabilidad", async () => {
    const onSubmit = vi.fn();

    render(<RevisionFinalForm registro={registro} onSubmit={onSubmit} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Registrar revisión completa/i }),
    );

    expect(
      await screen.findByText("Selecciona la adoptabilidad"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("muestra el rediseño clínico y guarda el borrador en el navegador", () => {
    localStorage.clear();
    const onSubmit = vi.fn();

    render(<RevisionFinalForm registro={registro} onSubmit={onSubmit} />);

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
    expect(screen.getByText("Sin patologías registradas")).toBeInTheDocument();
    expect(screen.getByText("Sin medicación prescrita")).toBeInTheDocument();
    expect(
      screen.getByText("Sin procedimientos anexados"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Guardar como borrador" }));

    expect(
      screen.getByText("Borrador guardado en este navegador."),
    ).toBeInTheDocument();
    expect(localStorage.getItem("huellas.revision-completa.1")).toContain(
      "pesoRevalidadoKg",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
