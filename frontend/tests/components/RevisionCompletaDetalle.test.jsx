import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import RevisionCompletaDetalle from "../../src/components/registroMedico/RevisionCompletaDetalle.jsx";

const registro = {
  animal: { estadoAdopcion: "ADOPTABLE" },
  revisionCompleta: {
    peso: 2,
    estadoSalud: "ENFERMO",
    descripcionCondicionMedica: "sin detalles",
    discapacidades: null,
    lesiones: "Cojera",
    descripcionCuidadosEspeciales: "Dieta",
  },
  enfermedades: [
    { id: 1, descripcionEnfermedad: "Otitis", tipoEnfermedad: "Infecciosa" },
  ],
  tratamientos: [
    {
      id: 2,
      descripcionTratamiento: "Antibiótico",
      fechaInicio: "2026-11-01T00:00:00.000Z",
      fechaFin: null,
      observaciones: null,
    },
  ],
  atencionesSanitarias: [
    {
      id: 3,
      tipo: "vacuna",
      fechaProgramada: "2026-11-10T00:00:00.000Z",
      estado: "PENDIENTE",
      fechaRealizacion: null,
      observaciones: null,
    },
  ],
};

describe("RevisionCompletaDetalle", () => {
  test("muestra los detalles de la revisión completa", () => {
    render(<RevisionCompletaDetalle registro={registro} />);

    expect(screen.getByText(/Peso revalidado: 2 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Estado de salud: ENFERMO/)).toBeInTheDocument();
    expect(screen.getByText(/Adoptabilidad: ADOPTABLE/)).toBeInTheDocument();
    expect(screen.getByText(/Condiciones: sin detalles/)).toBeInTheDocument();
    expect(screen.getByText(/Discapacidades: sin detalles/)).toBeInTheDocument();
    expect(screen.getByText(/Lesiones: Cojera/)).toBeInTheDocument();
    expect(screen.getByText(/Cuidados especiales: Dieta/)).toBeInTheDocument();
    expect(screen.getByText("Otitis")).toBeInTheDocument();
    expect(screen.getByText("Antibiótico")).toBeInTheDocument();
    expect(screen.getByText("vacuna")).toBeInTheDocument();
  });

  test("no renderiza nada sin revisión completa", () => {
    const { container } = render(<RevisionCompletaDetalle registro={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
