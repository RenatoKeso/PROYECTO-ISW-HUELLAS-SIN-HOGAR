import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroMedicoHistorialPage from "../../src/pages/RegistroMedicoHistorialPage.jsx";
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
  listarActualizacionesMedicas: vi.fn(),
  listarHistorialMedico: vi.fn(),
  listarSeguimientosMedico: vi.fn(),
}));

vi.mock("../../src/services/notificacionService.js", () => ({
  listarNotificaciones: vi.fn().mockResolvedValue({ notificaciones: [] }),
  marcarNotificacionLeida: vi.fn(),
}));

function registro({ id, nombre, codigo, salud, estado = "REALIZADO", especie = "PERRO" }) {
  return {
    id,
    animalId: id,
    estadoValidacion: estado,
    createdAt: "2026-11-14T10:00:00.000Z",
    pesoKg: 10,
    clasificacionSalud: salud,
    observacionInicial: "Observación",
    requiereCuarentena: false,
    animal: {
      id,
      codigoAnimal: codigo,
      nombre,
      especie,
      sexoAnimal: "MACHO",
      estadoAdopcion: "ADOPTABLE",
    },
    revisionCompleta: { estadoSalud: salud },
    revisionInicial: { id, estadoRevisionInicial: "REGISTRADA" },
  };
}

describe("RegistroMedicoHistorialPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registroMedicoService.listarRegistrosMedicos.mockResolvedValue({
      message: "ok",
      registros: [
        registro({ id: 1, nombre: "Gretel", codigo: "anim-001", salud: "NORMAL", especie: "GATO" }),
        registro({ id: 2, nombre: "Luna", codigo: "anim-002", salud: "CRITICO" }),
      ],
    });
  });

  test("aplica el filtro de salud recibido en la URL", async () => {
    render(
      <MemoryRouter initialEntries={["/salud/registros-medicos/historial?salud=FRAGIL"]}>
        <RegistroMedicoHistorialPage
          usuario={{ rol: "ENCARGADA_ADOPCIONES", nombre: "Ana" }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Nueva revisión" })).not.toBeInTheDocument();

    expect(await screen.findByText("Luna")).toBeInTheDocument();
    expect(screen.queryByText("Gretel")).toBeNull();
    expect(screen.getByText("Salud frágil")).toBeInTheDocument();
    expect(screen.getByText("1-1")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Historial de Registros Médicos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al listado/ })).toHaveAttribute(
      "href",
      "/salud/registros-medicos",
    );
    expect(screen.getByRole("button", { name: /Exportar reporte/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por especie")).toBeInTheDocument();
    expect(screen.getByText(/Consejo de navegación/)).toBeInTheDocument();
  });

  test("la búsqueda combina con los filtros de las tarjetas", async () => {
    render(
      <MemoryRouter
        initialEntries={["/salud/registros-medicos/historial?cuarentena=false&busqueda=gretel"]}
      >
        <RegistroMedicoHistorialPage
          usuario={{ rol: "ENCARGADA_ADOPCIONES", nombre: "Ana" }}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Gretel")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).toBeNull();
  });

  test("permite a la veterinaria entrar a edición desde el modal", async () => {
    const usuario = userEvent.setup();
    const gretel = registro({
      id: 1,
      nombre: "Gretel",
      codigo: "anim-001",
      salud: "NORMAL",
      especie: "GATO",
    });

    registroMedicoService.obtenerRegistroMedico.mockResolvedValue({
      message: "ok",
      registro: gretel,
    });
    registroMedicoService.listarHistorialMedico.mockResolvedValue({ historial: [] });
    registroMedicoService.listarSeguimientosMedico.mockResolvedValue({ seguimientos: [] });
    registroMedicoService.iniciarActualizacion.mockResolvedValue({
      message: "Actualización iniciada",
      registroMedico: { ...gretel, estadoValidacion: "REVISANDO" },
    });

    render(
      <MemoryRouter initialEntries={["/salud/registros-medicos/historial"]}>
        <RegistroMedicoHistorialPage
          usuario={{ rol: "VETERINARIA", nombre: "Dra. Pérez" }}
        />
      </MemoryRouter>,
    );

    await usuario.click(
      await screen.findByRole("button", { name: /Ver ficha médica de Gretel/ }),
    );

    expect(
      await screen.findByRole("heading", { name: /Registro Médico · Gretel/ }),
    ).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Editar campos" }));

    expect(await screen.findByText("Modo Edición Clínico")).toBeInTheDocument();
    expect(await screen.findByLabelText("Peso actual (kg)")).toBeInTheDocument();
    expect(registroMedicoService.iniciarActualizacion).toHaveBeenCalledWith(1);
  });

  test("aplica el filtro de especie recibido en la URL", async () => {
    render(
      <MemoryRouter initialEntries={["/salud/registros-medicos/historial?especie=PERRO"]}>
        <RegistroMedicoHistorialPage
          usuario={{ rol: "ENCARGADA_ADOPCIONES", nombre: "Ana" }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Gretel")).toBeNull();
    expect(await screen.findByText("Luna")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por especie")).toHaveValue("PERRO");
    expect(screen.getAllByText("Canino").length).toBeGreaterThan(0);
  });
});
