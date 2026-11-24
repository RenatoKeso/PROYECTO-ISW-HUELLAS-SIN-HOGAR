import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import ModalConfirmacionRevision from "../../src/components/registroMedico/ModalConfirmacionRevision.jsx";

const registro = {
  animal: { nombre: "Gretel", codigoAnimal: "anim-001" },
  estadoValidacion: "VALIDACION_PENDIENTE",
  revisionCompleta: { estadoSalud: "ENFERMO" },
};

describe("ModalConfirmacionRevision", () => {
  test("muestra la confirmación de revisión inicial sin comprobante PDF", async () => {
    const usuario = userEvent.setup();
    const onAceptar = vi.fn();
    const onVerExpediente = vi.fn();
    const onCerrar = vi.fn();

    render(
      <ModalConfirmacionRevision
        tipo="inicial"
        registro={registro}
        fecha="2026-11-21T12:00:00.000Z"
        responsable="Dra. Pérez"
        onAceptar={onAceptar}
        onVerExpediente={onVerExpediente}
        onCerrar={onCerrar}
      />,
    );

    expect(
      screen.getByText("¡Revisión inicial registrada con éxito!"),
    ).toBeInTheDocument();
    expect(screen.getByText("Dra. Pérez")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /pdf|comprobante/i })).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Aceptar e ir al listado" }));
    expect(onAceptar).toHaveBeenCalledOnce();

    await usuario.click(screen.getByRole("button", { name: "Ver expediente completo" }));
    expect(onVerExpediente).toHaveBeenCalledOnce();
  });

  test("usa el mismo modal para la revisión completa", () => {
    render(
      <ModalConfirmacionRevision
        tipo="completa"
        registro={registro}
        fecha="2026-11-21T12:00:00.000Z"
        responsable="Dra. Pérez"
        onAceptar={() => {}}
        onVerExpediente={() => {}}
        onCerrar={() => {}}
      />,
    );

    expect(
      screen.getByText("¡Revisión médica registrada con éxito!"),
    ).toBeInTheDocument();
    expect(screen.getByText("Enfermo")).toBeInTheDocument();
  });
});
