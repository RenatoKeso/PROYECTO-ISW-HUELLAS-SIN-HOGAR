import { afterEach, expect, it, vi } from "vitest";
import {cleanup,fireEvent,render,screen,} from "@testing-library/react";
import CalendarioSanitario from "../../src/components/CalendarioSanitario.jsx";
import { api } from "../../src/services/api.js";

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

it(
    "consulta cada mes y limita las citas visibles del día",
    async () => {
    const consulta = vi
        .spyOn(api, "get")
        .mockImplementation(async (ruta) => {
        const mes = ruta.split("=")[1];

        return {
            mes,
            atenciones: Array.from(
            { length: 7 },
            (_, indice) => ({
                fechaProgramada: mes + "-15",
                tipo: "control",
                nombreAnimal: "Gretel " + (indice + 1),
            })
        ),
    };
});

    render(<CalendarioSanitario />);

    const dia = await screen.findByRole("button", {
        name: /-15, 7 atenciones/,
    });

    fireEvent.click(dia);

    expect(
        screen.getByText("Gretel 5")
    ).toBeInTheDocument();

    expect(
        screen.queryByText("Gretel 6")
    ).not.toBeInTheDocument();

    fireEvent.click(
        screen.getByRole("button", {
        name: "Siguiente",
        exact: true,
        })
    );

    expect(
        screen.getByText("Gretel 6")
    ).toBeInTheDocument();

    fireEvent.click(
    screen.getByRole("button", {
        name: "Mes siguiente",
    })
);

    await screen.findByRole("button", {
        name: /-15, 7 atenciones/,
    });

    expect(
        consulta.mock.calls[0][0]
    ).not.toBe(consulta.mock.calls[1][0]);
    }
);