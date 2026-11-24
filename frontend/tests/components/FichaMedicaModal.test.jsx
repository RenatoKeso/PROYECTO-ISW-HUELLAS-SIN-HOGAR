import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import FichaMedicaModal from "../../src/components/registroMedico/FichaMedicaModal.jsx";

const registro = {
  id: 1,
  animalId: 1,
  estadoValidacion: "REALIZADO",
  createdAt: "2026-11-14T10:00:00.000Z",
  pesoKg: 12.4,
  clasificacionSalud: "NORMAL",
  observacionInicial: "Animal estable",
  requiereCuarentena: false,
  animal: {
    id: 1,
    codigoAnimal: "anim-001",
    nombre: "Gretel",
    especie: "GATO",
    sexoAnimal: "HEMBRA",
    estadoAdopcion: "ADOPTABLE",
  },
  revisionCompleta: { estadoSalud: "NORMAL" },
  enfermedades: [],
  tratamientos: [],
  atencionesSanitarias: [],
};

function renderModal({
  usuario,
  registro: registroModal = registro,
  editando = false,
  onIniciar = vi.fn(),
  onGuardar = vi.fn().mockResolvedValue({ message: "Registro actualizado" }),
}) {
  render(
    <FichaMedicaModal
      registro={registroModal}
      historial={[]}
      seguimientos={[]}
      usuario={usuario}
      editando={editando}
      onCerrar={() => {}}
      onIniciar={onIniciar}
      onGuardar={onGuardar}
      onCancelar={vi.fn()}
      onCorregirInicial={vi.fn()}
      onRevisionInicial={vi.fn()}
      onRevisionFinal={vi.fn()}
      onExitoEdicion={() => {}}
      onRefrescar={vi.fn()}
    />,
  );
  return { onIniciar, onGuardar };
}

describe("FichaMedicaModal", () => {
  test("muestra solo lectura para una usuaria no veterinaria", () => {
    renderModal({ usuario: { rol: "ENCARGADA_ADOPCIONES", nombre: "Ana" } });

    expect(screen.getByText("Solo lectura")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar ficha" })).toBeNull();
    expect(screen.getByText(/Gretel/)).toBeInTheDocument();
  });

  test("muestra las secciones y el pie del diseño en modo lectura", () => {
    renderModal({ usuario: { rol: "ENCARGADA_ADOPCIONES", nombre: "Ana" } });

    expect(
      screen.getByText("1. Evaluación y constantes médicas"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("2. Hallazgos clínicos y observaciones"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("3. Tratamientos, diagnósticos y seguimiento"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Registrado en Huellas Sin Hogar · Ficha auditada"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir a la ficha del animal/ }),
    ).toHaveAttribute("href", "/registro/fichas?ficha=1");
  });

  test("permite a la veterinaria iniciar la actualización desde el modal", async () => {
    const usuario = userEvent.setup();
    const { onIniciar } = renderModal({
      usuario: { rol: "VETERINARIA", nombre: "Dra. Pérez" },
    });

    await usuario.click(screen.getByRole("button", { name: "Editar campos" }));
    expect(onIniciar).toHaveBeenCalledOnce();
  });

  test("mantiene el botón Editar ficha en el pie para la veterinaria", () => {
    renderModal({ usuario: { rol: "VETERINARIA", nombre: "Dra. Pérez" } });

    expect(screen.getByRole("button", { name: "Editar ficha" })).toBeInTheDocument();
  });

  test("muestra el formulario de actualización cuando está en modo edición", () => {
    renderModal({
      usuario: { rol: "VETERINARIA", nombre: "Dra. Pérez" },
      editando: true,
    });

    expect(screen.getByText("Modo Edición Clínico")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
    expect(
      screen.getByText("3. Tratamientos, diagnósticos y seguimiento"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Adoptabilidad (solo lectura)"),
    ).toBeDisabled();
  });

  test("permite guardar los campos editados del modal", async () => {
    const usuario = userEvent.setup();
    const { onGuardar } = renderModal({
      usuario: { rol: "VETERINARIA", nombre: "Dra. Pérez" },
      editando: true,
    });

    await usuario.selectOptions(
      screen.getByLabelText(/Evolución del estado/),
      "ESTABLE",
    );
    await usuario.type(
      screen.getByLabelText(/Observación de seguimiento/),
      "Paciente estable, continúa tratamiento.",
    );

    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledOnce());
    expect(onGuardar.mock.calls[0][0]).toMatchObject({
      evolucionEstadoSalud: "ESTABLE",
      observacionSeguimiento: "Paciente estable, continúa tratamiento.",
    });
  });

  test("usa el rediseño de revisión completa dentro del modal", () => {
    renderModal({
      usuario: { rol: "VETERINARIA", nombre: "Dra. Pérez" },
      registro: {
        ...registro,
        estadoValidacion: "VALIDACION_PENDIENTE",
        revisionCompleta: null,
      },
    });

    expect(
      screen.getByRole("heading", {
        name: "Revisión Completa y Evaluación Clínica",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar como borrador" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar revisión completa" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Paso 2 de 2")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Realizar revisión completa" }),
    ).not.toBeInTheDocument();
  });
});
