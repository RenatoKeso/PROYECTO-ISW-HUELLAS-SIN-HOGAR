import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RegistroHistorialPage from "../../src/pages/RegistroHistorialPage.jsx";
import { listarIngresosGlobales } from "../../src/services/animalesService.js";
import { listarRegistrosMedicos } from "../../src/services/registroMedicoService.js";

vi.mock("../../src/services/animalesService.js", () => ({
  listarIngresosGlobales: vi.fn(),
}));

vi.mock("../../src/services/registroMedicoService.js", () => ({
  listarRegistrosMedicos: vi.fn(),
}));

const ingresoPerro = {
  id: 38,
  tipo: "INGRESO",
  fechaIngreso: "2026-11-09T22:26:00.000Z",
  procedencia: "Vía pública",
  receptor: { id: 6, nombre: "Martina Concha" },
  ubicacionEncontrado: "Av. Central",
  estadoSalud: "Sano",
  fichaAnimal: {
    id: 52,
    codigoAnimal: "anim-005",
    nombre: "Adolfo",
    especie: "PERRO",
    raza: "Mestizo",
  },
};

const ingresoGato = {
  id: 20,
  tipo: "REINGRESO",
  fechaIngreso: "2026-10-01T15:00:00.000Z",
  procedencia: "Entrega voluntaria",
  receptor: { id: 7, nombre: "Tomas Morales" },
  ubicacionEncontrado: null,
  estadoSalud: null,
  fichaAnimal: {
    id: 60,
    codigoAnimal: "anim-002",
    nombre: "Luna",
    especie: "GATO",
    raza: "Siamés",
  },
};

function RutaDestino() {
  const ubicacion = useLocation();

  return (
    <p data-testid="ruta-destino">
      {`${ubicacion.pathname}${ubicacion.search}`}
    </p>
  );
}

function renderPage(
  initialEntries = ["/registro/historial"],
  usuario = { id: 1, rol: "VETERINARIA", activo: true },
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/registro/historial"
          element={<RegistroHistorialPage usuario={usuario} />}
        />
        <Route path="*" element={<RutaDestino />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RegistroHistorialPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarIngresosGlobales.mockResolvedValue({
      ingresos: [ingresoPerro, ingresoGato],
    });
    listarRegistrosMedicos.mockResolvedValue({ registros: [] });
  });

  test("filtra al entrar con una búsqueda en la URL", async () => {
    renderPage(["/registro/historial?busqueda=anim-005"]);

    const buscador = await screen.findByRole("searchbox", {
      name: "Buscar por nombre, código o raza",
    });

    expect(buscador).toHaveValue("anim-005");
    expect(await screen.findByText("Adolfo")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();

    const resumen = screen
      .getByText("Total")
      .closest(".lista-fichas-resumen-grupo");

    expect(within(resumen).getByText("1")).toBeInTheDocument();
  });

  test("busca por nombre o raza y filtra por especie", async () => {
    renderPage();

    expect(await screen.findByText("Adolfo")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Perros (1)" }));

    expect(screen.getByText("Adolfo")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Todos (2)" }));

    const buscador = screen.getByRole("searchbox", {
      name: "Buscar por nombre, código o raza",
    });

    fireEvent.change(buscador, { target: { value: "mestizo" } });

    expect(screen.getByText("Adolfo")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();

    fireEvent.change(buscador, { target: { value: "no-existe" } });

    expect(
      screen.getByText("No se encontraron ingresos con estos filtros"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(screen.getByText("Adolfo")).toBeInTheDocument();
    expect(screen.getByText("Luna")).toBeInTheDocument();
  });

  test("muestra el resumen de total, ingresos y reingresos", async () => {
    renderPage();

    await screen.findByText("Adolfo");

    const resumenIngresos = screen
      .getByText("Ingresos")
      .closest(".lista-fichas-resumen-grupo");
    const resumenReingresos = screen
      .getByText("Reingresos")
      .closest(".lista-fichas-resumen-grupo");

    expect(within(resumenIngresos).getByText("1")).toBeInTheDocument();
    expect(within(resumenReingresos).getByText("1")).toBeInTheDocument();
  });

  test("abre el modal de acciones al hacer clic en cualquier parte de la fila", async () => {
    renderPage();

    const codigo = await screen.findByText("anim-005");
    fireEvent.click(codigo);

    const dialogo = await screen.findByRole("dialog", {
      name: /Acciones para/,
    });

    expect(
      within(dialogo).getByRole("button", { name: /Ver ficha del animal/ }),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("button", { name: /Ver registro médico/ }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("ruta-destino")).not.toBeInTheDocument();
  });

  test("navega a la ficha del animal desde el modal de acciones", async () => {
    renderPage();

    fireEvent.click(await screen.findByText("anim-005"));

    const dialogo = await screen.findByRole("dialog", {
      name: /Acciones para/,
    });

    fireEvent.click(
      within(dialogo).getByRole("button", { name: /Ver ficha del animal/ }),
    );

    expect(await screen.findByTestId("ruta-destino")).toHaveTextContent(
      "/registro/fichas?ficha=52",
    );
  });

  test("muestra el aviso sobre la tabla para elegir una acción", async () => {
    renderPage();

    expect(
      await screen.findByText(/Haz clic sobre una fila para elegir/),
    ).toBeInTheDocument();
  });

  test("no muestra la columna número de ingreso ni la columna de acciones", async () => {
    renderPage();

    await screen.findByText("Adolfo");

    expect(
      screen.queryByRole("columnheader", { name: "N° de ingreso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Acciones" }),
    ).not.toBeInTheDocument();

    for (const columna of [
      "Procedencia",
      "Receptor",
      "Ubicación",
      "Estado de salud",
    ]) {
      expect(
        screen.queryByRole("columnheader", { name: columna }),
      ).not.toBeInTheDocument();
    }
  });

  test("muestra solo las columnas código, nombre, tipo y fecha", async () => {
    renderPage();

    await screen.findByText("Adolfo");

    expect(
      screen
        .getAllByRole("columnheader")
        .map((columna) => columna.textContent),
    ).toEqual(["Código", "Nombre", "Tipo", "Fecha"]);
  });

  test("muestra la información completa del ingreso desde el modal de acciones", async () => {
    renderPage();

    fireEvent.click(await screen.findByText("anim-005"));

    const acciones = await screen.findByRole("dialog", {
      name: /Acciones para/,
    });
    fireEvent.click(
      within(acciones).getByRole("button", {
        name: /Ver información completa del ingreso/,
      }),
    );

    const informacion = await screen.findByRole("dialog", {
      name: "Información completa del ingreso",
    });

    expect(
      screen.queryByRole("dialog", { name: /Acciones para/ }),
    ).not.toBeInTheDocument();
    expect(within(informacion).getAllByText("Adolfo").length).toBeGreaterThan(0);
    expect(
      within(informacion).getAllByText("anim-005").length,
    ).toBeGreaterThan(0);
    expect(within(informacion).getByText("Perro")).toBeInTheDocument();
    expect(within(informacion).getByText("Mestizo")).toBeInTheDocument();
    expect(within(informacion).getByText("Vía pública")).toBeInTheDocument();
    expect(
      within(informacion).getByText("Martina Concha"),
    ).toBeInTheDocument();
    expect(within(informacion).getByText("Av. Central")).toBeInTheDocument();
    expect(within(informacion).getByText("Sano")).toBeInTheDocument();
  });

  test("vuelve a las opciones desde la información completa", async () => {
    renderPage();

    fireEvent.click(await screen.findByText("anim-005"));

    const acciones = await screen.findByRole("dialog", {
      name: /Acciones para/,
    });
    fireEvent.click(
      within(acciones).getByRole("button", {
        name: /Ver información completa del ingreso/,
      }),
    );

    const informacion = await screen.findByRole("dialog", {
      name: "Información completa del ingreso",
    });
    fireEvent.click(
      within(informacion).getByRole("button", {
        name: "Volver a las opciones",
      }),
    );

    expect(
      await screen.findByRole("dialog", { name: /Acciones para/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", {
        name: "Información completa del ingreso",
      }),
    ).not.toBeInTheDocument();
  });

  test("carga el historial una sola vez", async () => {
    renderPage();

    await waitFor(() => {
      expect(listarIngresosGlobales).toHaveBeenCalledTimes(1);
    });

    expect(listarIngresosGlobales).toHaveBeenCalledWith();
  });

  test("abre el registro médico completo desde el modal de acciones", async () => {
    listarRegistrosMedicos.mockResolvedValue({
      registros: [
        {
          id: 101,
          animalId: 52,
          estadoValidacion: "REALIZADO",
          revisionCompleta: { id: 1 },
        },
      ],
    });

    renderPage();

    fireEvent.click(await screen.findByText("anim-005"));

    const dialogo = await screen.findByRole("dialog", {
      name: /Acciones para/,
    });
    fireEvent.click(
      await within(dialogo).findByRole("button", {
        name: /Ver registro médico/,
      }),
    );

    expect(await screen.findByTestId("ruta-destino")).toHaveTextContent(
      "/salud/registros-medicos/historial?registro=101",
    );
  });

  test("ofrece realizar la revisión completa cuando no existe registro médico completo", async () => {
    listarRegistrosMedicos.mockResolvedValue({
      registros: [
        {
          id: 102,
          animalId: 52,
          estadoValidacion: "VALIDACION_PENDIENTE",
          revisionCompleta: null,
        },
      ],
    });

    renderPage();

    fireEvent.click(await screen.findByText("anim-005"));

    const dialogo = await screen.findByRole("dialog", {
      name: /Acciones para/,
    });
    fireEvent.click(
      await within(dialogo).findByRole("button", {
        name: /Ver registro médico/,
      }),
    );

    expect(
      await screen.findByText(/No se encuentra un registro médico para/),
    ).toHaveTextContent("No se encuentra un registro médico para “Adolfo”.");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Sí, realizar registro médico completo",
      }),
    );

    expect(await screen.findByTestId("ruta-destino")).toHaveTextContent(
      "/salud/registros-medicos/revisiones?registro=102",
    );
  });

  test("un voluntario solo visualiza el aviso sin acceso a la revisión completa", async () => {
    listarRegistrosMedicos.mockResolvedValue({
      registros: [
        {
          id: 102,
          animalId: 52,
          estadoValidacion: "VALIDACION_PENDIENTE",
          revisionCompleta: null,
        },
      ],
    });

    renderPage(["/registro/historial"], {
      id: 2,
      rol: "VOLUNTARIO",
      activo: true,
    });

    fireEvent.click(await screen.findByText("anim-005"));

    const dialogo = await screen.findByRole("dialog", {
      name: /Acciones para/,
    });
    fireEvent.click(
      await within(dialogo).findByRole("button", {
        name: /Ver registro médico/,
      }),
    );

    expect(
      await screen.findByText(/No se encuentra un registro médico para/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Sí, realizar registro médico completo",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  test("oculta la opción de registro médico para roles sin acceso clínico", async () => {
    renderPage(["/registro/historial"], {
      id: 3,
      rol: "ENCARGADA_VOLUNTARIADO",
      activo: true,
    });

    fireEvent.click(await screen.findByText("anim-005"));

    const dialogo = await screen.findByRole("dialog", {
      name: /Acciones para/,
    });

    expect(
      within(dialogo).getByRole("button", { name: /Ver ficha del animal/ }),
    ).toBeInTheDocument();
    expect(
      within(dialogo).queryByRole("button", { name: /Ver registro médico/ }),
    ).not.toBeInTheDocument();
  });
});
