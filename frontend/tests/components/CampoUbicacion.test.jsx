import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import CampoUbicacion from "../../src/components/registroAnimal/CampoUbicacion.jsx";

const RESPUESTA_PHOTON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        osm_type: "R",
        osm_id: 1614641,
        name: "Hualpén",
        state: "Región del Biobío",
        country: "Chile",
        countrycode: "CL",
        type: "city",
      },
      geometry: { type: "Point", coordinates: [-73.0943414, -36.7927608] },
    },
    {
      type: "Feature",
      properties: {
        osm_type: "N",
        osm_id: 2,
        name: "Lugar fuera de Chile",
        state: "Lima",
        country: "Perú",
        countrycode: "PE",
      },
    },
  ],
};

function Prueba() {
  const [valor, setValor] = useState("");

  return <CampoUbicacion valor={valor} error="" onChange={setValor} />;
}

describe("CampoUbicacion", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => RESPUESTA_PHOTON,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("sugiere ubicaciones de Chile y permite seleccionar una", async () => {
    const user = userEvent.setup();
    render(<Prueba />);

    const entrada = screen.getByLabelText(/Ubicación de hallazgo/);

    await user.type(entrada, "hualpen");

    const opcion = await screen.findByRole("option", {
      name: /Hualpén/,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("photon.komoot.io"),
      expect.anything(),
    );
    expect(
      screen.queryByText("Lugar fuera de Chile"),
    ).not.toBeInTheDocument();

    await user.click(opcion);

    expect(entrada).toHaveValue("Hualpén, Región del Biobío, Chile");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
