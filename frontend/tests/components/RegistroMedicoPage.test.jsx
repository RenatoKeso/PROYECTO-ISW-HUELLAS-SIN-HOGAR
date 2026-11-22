import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroMedicoPage from "../../src/pages/RegistroMedicoPage.jsx";
import * as registroMedicoService from "../../src/services/registroMedicoService.js";

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
  descargarReporteMedicoPdf: vi.fn(),
}));

vi.mock("../../src/utils/permisosUsuario.js", () => ({
  puedeRegistrarRevisionInicial: () => true,
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

function renderPagina(
  usuario = { id: 1, rol: "VETERINARIA", activo: true },
  initialEntries = ["/"],
  modo = "revisiones",
) {
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <RegistroMedicoPage usuario={usuario} modo={modo} />
    </MemoryRouter>,
  );
}

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
    registroMedicoService.descargarReporteMedicoPdf.mockResolvedValue(
      "reporte-medico.pdf",
    );
  });

  test("muestra la bandeja de revisiones pendientes con el diseño del historial", async () => {
    renderPagina();

    expect(
      await screen.findByRole("heading", {
        name: "Revisiones Médicas Pendientes",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total pendientes")).toBeInTheDocument();
    expect(screen.getAllByText("Revisión inicial").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Revisión completa").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("columnheader", { name: "Paciente / animal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Ver ficha médica de Gretel anim-001",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Nueva revisión" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Notificaciones médicas")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Revisión inicial/ }));
    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "Ver ficha médica de Gretel anim-001",
        }),
      ).not.toBeInTheDocument();
    });
  });

  test("solo lista revisiones iniciales y completas pendientes", async () => {
    registroMedicoService.listarRegistrosMedicos.mockResolvedValue({
      registros: [
        registro,
        {
          ...registro,
          id: 2,
          estadoValidacion: "PROVISIONAL",
          animal: { id: 2, codigoAnimal: "anim-002", nombre: "Luna" },
        },
        {
          ...registro,
          id: 3,
          estadoValidacion: "REALIZADO",
          animal: { id: 3, codigoAnimal: "anim-003", nombre: "Listo" },
        },
        {
          ...registro,
          id: 4,
          estadoValidacion: "ACTUALIZADO",
          animal: { id: 4, codigoAnimal: "anim-004", nombre: "Al día" },
        },
      ],
    });

    renderPagina();

    expect(
      await screen.findByRole("button", {
        name: "Ver ficha médica de Gretel anim-001",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Ver ficha médica de Luna anim-002",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Ver ficha médica de Listo anim-003",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Ver ficha médica de Al día anim-004",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Todas las pendientes/ }),
    ).toHaveTextContent("2");
  });

  test("limpia el detalle al cambiar de píldora", async () => {
    renderPagina();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Ver ficha médica de Gretel anim-001",
      }),
    );
    const dialogo = await screen.findByRole("dialog");
    await within(dialogo).findByRole("button", {
      name: "Registrar revisión completa",
    });

    fireEvent.click(within(dialogo).getByRole("tab", { name: "Todos" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "Registrar revisión completa" }),
    ).not.toBeInTheDocument();
  });

  test("muestra el diseño completo en un modal al abrir una revisión completa pendiente", async () => {
    renderPagina();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Ver ficha médica de Gretel anim-001",
      }),
    );

    const dialogo = await screen.findByRole("dialog", {
      name: "Revisión completa",
    });
    expect(
      screen.getByRole("heading", { name: "Revisiones Médicas Pendientes" }),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByText("Revisión inicial registrada correctamente"),
    ).toBeInTheDocument();
    expect(within(dialogo).getByText("Paso 2 de 2")).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("heading", {
        name: "Revisión Completa y Evaluación Clínica",
      }),
    ).toBeInTheDocument();
    expect(within(dialogo).getByText("Peso inicial")).toBeInTheDocument();
    expect(within(dialogo).getByText("Clasificación de salud")).toBeInTheDocument();
    expect(within(dialogo).getByText("Observación previa")).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("button", { name: "Corregir revisión inicial" }),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("button", { name: "Cerrar ficha" }),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("tab", { name: "Revisión completa" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(within(dialogo).getByRole("tab", { name: "Todos" })).toBeInTheDocument();
  });

  test("cierra la corrección de revisión inicial dentro del modal", async () => {
    renderPagina({ id: 1, rol: "VOLUNTARIO", activo: true });

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Ver ficha médica de Gretel anim-001",
      }),
    );
    const dialogo = await screen.findByRole("dialog");
    await within(dialogo).findByRole("button", { name: "Corregir revisión inicial" });

    fireEvent.click(
      within(dialogo).getByRole("button", { name: "Corregir revisión inicial" }),
    );
    await within(dialogo).findByRole("button", { name: "Cancelar corrección" });

    fireEvent.click(
      within(dialogo).getByRole("button", { name: "Cancelar corrección" }),
    );

    await waitFor(() => {
      expect(
        within(dialogo).queryByRole("button", { name: "Cancelar corrección" }),
      ).not.toBeInTheDocument();
    });
  });

  test("muestra la revisión inicial en un modal al abrir un registro provisional", async () => {
    const provisional = {
      ...registro,
      estadoValidacion: "PROVISIONAL",
      revisionInicial: null,
    };
    registroMedicoService.listarRegistrosMedicos.mockResolvedValue({
      registros: [provisional],
    });
    registroMedicoService.obtenerRegistroMedico.mockResolvedValue({
      registro: provisional,
    });

    renderPagina();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Ver ficha médica de Gretel anim-001",
      }),
    );

    const dialogo = await screen.findByRole("dialog");
    expect(
      screen.getByRole("heading", { name: "Revisiones Médicas Pendientes" }),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByText("Ficha de ingreso registrada correctamente"),
    ).toBeInTheDocument();
    expect(within(dialogo).getByText("Paso 1 de 2")).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("button", { name: "Registrar revisión inicial" }),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("tab", { name: "Revisión inicial" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("cierra el modal de revisión con Escape, backdrop y Cerrar ficha", async () => {
    renderPagina();

    function abrirFila() {
      return screen.findByRole("button", {
        name: "Ver ficha médica de Gretel anim-001",
      });
    }

    fireEvent.click(await abrirFila());
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    fireEvent.click(await abrirFila());
    await screen.findByRole("dialog");
    fireEvent.click(document.querySelector(".ventana-fondo"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    fireEvent.click(await abrirFila());
    const dialogo = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialogo).getByRole("button", { name: "Cerrar ficha" }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("el botón Exportar reporte descarga el PDF de los registros filtrados", async () => {
    renderPagina();

    await screen.findByRole("button", {
      name: "Ver ficha médica de Gretel anim-001",
    });
    const boton = screen.getByRole("button", { name: "Exportar reporte" });
    expect(boton).not.toHaveAttribute("title");

    fireEvent.click(boton);

    await waitFor(() => {
      expect(
        registroMedicoService.descargarReporteMedicoPdf,
      ).toHaveBeenCalledWith({
        ids: [1],
        titulo: "Revisiones médicas pendientes",
        descripcionesFiltros: ["Todas las pendientes"],
      });
    });
  });

  test("el botón Exportar reporte se deshabilita mientras se genera el PDF", async () => {
    let resolver;
    registroMedicoService.descargarReporteMedicoPdf.mockImplementation(
      () => new Promise((resolve) => { resolver = resolve; }),
    );

    renderPagina();
    await screen.findByRole("button", {
      name: "Ver ficha médica de Gretel anim-001",
    });

    fireEvent.click(screen.getByRole("button", { name: "Exportar reporte" }));

    const botonOcupado = await screen.findByRole("button", {
      name: "Generando reporte...",
    });
    expect(botonOcupado).toBeDisabled();
    expect(botonOcupado).toHaveAttribute("aria-busy", "true");

    resolver("reporte-medico.pdf");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Exportar reporte" }),
      ).not.toBeDisabled();
    });
  });

  test("muestra un error si falla la generación del PDF", async () => {
    registroMedicoService.descargarReporteMedicoPdf.mockRejectedValue(
      new Error("No se pudo descargar el PDF"),
    );

    renderPagina();
    await screen.findByRole("button", {
      name: "Ver ficha médica de Gretel anim-001",
    });

    fireEvent.click(screen.getByRole("button", { name: "Exportar reporte" }));

    expect(
      await screen.findByText("No se pudo descargar el PDF"),
    ).toBeInTheDocument();
  });

  test("abre automáticamente el registro médico indicado en la URL", async () => {
    renderPagina(undefined, [
      "/salud/registros-medicos/revisiones?registro=1",
    ]);

    expect(
      await screen.findByRole("dialog", { name: "Revisión completa" }),
    ).toBeInTheDocument();
    expect(registroMedicoService.obtenerRegistroMedico).toHaveBeenCalledWith(1);
  });

  test("un voluntario visualiza un registro en revisión sin formulario de edición", async () => {
    const revisando = {
      ...registro,
      estadoValidacion: "REVISANDO",
      revisionCompleta: { id: 1, peso: 12.4, estadoSalud: "NORMAL" },
    };
    registroMedicoService.listarRegistrosMedicos.mockResolvedValue({
      registros: [revisando],
    });
    registroMedicoService.obtenerRegistroMedico.mockResolvedValue({
      registro: revisando,
    });

    renderPagina(
      { id: 2, rol: "VOLUNTARIO", activo: true },
      ["/salud/registros-medicos/historial?registro=1"],
      "historial",
    );

    const dialogo = await screen.findByRole("dialog");
    expect(
      within(dialogo).getByText(/Evaluación y constantes médicas/),
    ).toBeInTheDocument();
    expect(
      within(dialogo).queryByRole("button", { name: "Guardar cambios" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialogo).queryByRole("button", { name: "Editar ficha" }),
    ).not.toBeInTheDocument();
  });
});
