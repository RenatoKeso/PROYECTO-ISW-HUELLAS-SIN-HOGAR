import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroMedicoPage from "../../src/pages/RegistroMedicoPage.jsx";
import * as registroMedicoService from "../../src/services/registroMedicoService.js";
import * as notificacionService from "../../src/services/notificacionService.js";

vi.mock("../../src/services/registroMedicoService.js", () => ({
  listarRegistrosMedicos: vi.fn(),
  obtenerRegistroMedico: vi.fn(),
  registrarRevisionInicial: vi.fn(),
  actualizarRevisionInicial: vi.fn(),
  realizarRevisionFinal: vi.fn(),
  iniciarActualizacion: vi.fn(),
  guardarActualizacion: vi.fn(),
  cancelarActualizacion: vi.fn(),
  listarHistorialMedico: vi.fn(),
  listarSeguimientosMedico: vi.fn(),
}));

vi.mock("../../src/services/notificacionService.js", () => ({
  listarNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
}));

vi.mock("../../src/utils/permisosUsuario.js", () => ({
  puedeRegistrarRevisionInicial: () => false,
  puedeActualizarRevisionInicial: () => true,
  puedeRealizarRevisionFinal: () => true,
  puedeActualizarRegistroMedico: () => false,
}));

const registro = {
  id: 1,
  animal: { id: 1, codigoAnimal: "anim-001", nombre: "Gretel" },
  estadoValidacion: "VALIDACION_PENDIENTE",
  createdAt: "2026-11-01T10:00:00.000Z",
  pesoKg: 12.4,
  clasificacionSalud: "NORMAL",
  observacionInicial: "Observación inicial",
  revisionInicial: { fechaActualizacion: null },
};

describe("RegistroMedicoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registroMedicoService.listarRegistrosMedicos.mockResolvedValue({
      registros: [registro],
    });
    registroMedicoService.obtenerRegistroMedico.mockResolvedValue({
      registro,
    });
    registroMedicoService.listarHistorialMedico.mockResolvedValue({
      historial: [],
    });
    registroMedicoService.listarSeguimientosMedico.mockResolvedValue({
      seguimientos: [],
    });
    notificacionService.listarNotificaciones.mockResolvedValue({
      notificaciones: [],
    });
  });

  test("limpia el detalle al cambiar de pestaña", async () => {
    render(<RegistroMedicoPage usuario={{ id: 1, rol: "VETERINARIA", activo: true }} />);

    fireEvent.click(await screen.findByRole("button", { name: "Abrir" }));
    await screen.findByRole("button", { name: "Registrar revisión completa" });

    fireEvent.click(screen.getByRole("tab", { name: "Todos" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Registrar revisión completa" }),
      ).not.toBeInTheDocument();
    });
  });

  test("cierra la corrección de revisión inicial", async () => {
    render(<RegistroMedicoPage usuario={{ id: 1, rol: "VOLUNTARIO", activo: true }} />);

    fireEvent.click(await screen.findByRole("button", { name: "Abrir" }));
    await screen.findByRole("button", { name: "Corregir revisión inicial" });

    fireEvent.click(screen.getByRole("button", { name: "Corregir revisión inicial" }));
    await screen.findByRole("button", { name: "Cancelar corrección" });

    fireEvent.click(screen.getByRole("button", { name: "Cancelar corrección" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Cancelar corrección" }),
      ).not.toBeInTheDocument();
    });
  });
});
