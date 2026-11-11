import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import RevisionInicialForm from "../../src/components/registroMedico/RevisionInicialForm.jsx";

const registro = {
  id: 1,
  pesoKg: 12.4,
  clasificacionSalud: "ENFERMO",
  observacionInicial: "Tos",
  requiereCuarentena: true,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RevisionInicialForm", () => {
  test("muestra la advertencia y no envía si se cancela la confirmación", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ message: "ok" });
    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <RevisionInicialForm
        registro={registro}
        modo="corregir"
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByText(/Esta corrección se puede realizar una sola vez/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Guardar corrección/i }),
    );

    await waitFor(() => expect(confirmar).toHaveBeenCalledTimes(1));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("envía la corrección cuando se confirma", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ message: "ok" });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <RevisionInicialForm
        registro={registro}
        modo="corregir"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Guardar corrección/i }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      pesoKg: 12.4,
      clasificacionSalud: "ENFERMO",
      observacionInicial: "Tos",
      requiereCuarentena: true,
    });
  });

  test("el registro inicial no muestra advertencia ni pide confirmación", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ message: "ok" });
    const confirmar = vi.spyOn(window, "confirm");

    render(
      <RevisionInicialForm
        registro={registro}
        modo="registrar"
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.queryByText(/Esta corrección se puede realizar una sola vez/i),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Registrar revisión inicial/i }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(confirmar).not.toHaveBeenCalled();
  });
});
