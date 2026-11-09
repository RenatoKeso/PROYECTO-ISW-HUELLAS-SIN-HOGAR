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
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Antibiótico" },
    });
    fireEvent.change(screen.getByLabelText("Fecha inicio"), {
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
});
