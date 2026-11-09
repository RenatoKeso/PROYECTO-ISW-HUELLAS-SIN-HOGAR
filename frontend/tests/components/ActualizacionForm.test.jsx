import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import ActualizacionForm from "../../src/components/registroMedico/ActualizacionForm.jsx";

const registro = {
  id: 1,
  pesoKg: 12.4,
  clasificacionSalud: "ENFERMO",
  observacionInicial: "Tos",
  requiereCuarentena: true,
  estadoValidacion: "REVISANDO",
  revisionCompleta: {
    peso: 12.1,
    descripcionCondicionMedica: "En tratamiento",
    discapacidades: "",
    lesiones: "",
    descripcionCuidadosEspeciales: "",
  },
  enfermedades: [{ id: 10, descripcionEnfermedad: "Otitis" }],
  tratamientos: [
    {
      id: 20,
      descripcionTratamiento: "Antibiótico",
      fechaInicio: "2026-11-01",
    },
  ],
};

function renderFormulario(onGuardar) {
  return render(
    <ActualizacionForm
      registro={registro}
      enCurso
      onIniciar={vi.fn()}
      onGuardar={onGuardar}
      onCancelar={vi.fn()}
    />,
  );
}

describe("ActualizacionForm", () => {
  test("permite guardar sin fecha de registro", async () => {
    const onGuardar = vi.fn().mockResolvedValue({ message: "ok" });

    renderFormulario(onGuardar);

    fireEvent.change(screen.getByLabelText(/Observación de seguimiento/i), {
      target: { value: "Mejora" },
    });
    fireEvent.change(screen.getByLabelText(/Evolución/i), {
      target: { value: "MEJORANDO" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Guardar actualización/i }),
    );

    await waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));

    const datos = onGuardar.mock.calls[0][0];
    expect(datos.fechaRegistro).toBeUndefined();
  });

  test("usa selects con las enfermedades y tratamientos existentes", () => {
    renderFormulario(vi.fn());

    const [agregarEnfermedad, agregarTratamiento] = screen.getAllByRole(
      "button",
      { name: /Agregar seguimiento/i },
    );

    fireEvent.click(agregarEnfermedad);
    const selectEnfermedad = screen.getByLabelText("Enfermedad");
    expect(
      within(selectEnfermedad).getByRole("option", { name: /Otitis/i }),
    ).toBeInTheDocument();

    fireEvent.click(agregarTratamiento);
    const selectTratamiento = screen.getByLabelText("Tratamiento");
    expect(
      within(selectTratamiento).getByRole("option", { name: /Antibiótico/i }),
    ).toBeInTheDocument();
  });
});
