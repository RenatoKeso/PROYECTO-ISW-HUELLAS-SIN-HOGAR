import {
  afterEach,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import DonacionesPage from "../../src/pages/DonacionesPage.jsx";
import { api } from "../../src/services/api.js";
import { puedeGestionarDonaciones } from "../../src/utils/permisosUsuario.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it(
  "registra una transferencia anónima con PDF y muestra el folio pendiente",
  async () => {
    const enviar = vi
      .spyOn(api, "post")
      .mockResolvedValue({
        folio: "folio-prueba",
        estado: "PENDIENTE",
      });

    render(<DonacionesPage />);

    fireEvent.change(
      screen.getByLabelText(
        "Monto en pesos chilenos"
      ),
      {
        target: {
          value: "10000",
        },
      }
    );

    const archivo = new File(
      ["%PDF-1.4\n%%EOF"],
      "comprobante.pdf",
      {
        type: "application/pdf",
      }
    );

    fireEvent.change(
      screen.getByLabelText(
        /Comprobante PDF/
      ),
      {
        target: {
          files: [archivo],
        },
      }
    );

    fireEvent.submit(
      screen
        .getByRole("button", {
          name: "Registrar donación",
        })
        .closest("form")
    );

    await screen.findByText(
      "folio-prueba"
    );

    expect(
      enviar.mock.calls[0][0]
    ).toBe("/donaciones");

    expect(
      enviar.mock.calls[0][1]
    ).toMatchObject({
      anonima: true,
      nombreDonante: "",
      comprobanteNombre:
        "comprobante.pdf",
    });

    expect(
      enviar.mock.calls[0][1]
        .comprobanteBase64
    ).toBeTruthy();

    expect(
      enviar.mock.calls[0][2]
    ).toEqual({
      sinSesion: true,
    });
  }
);

it(
  "apadrinar solicita el animal y los datos de contacto",
  async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      animales: [
        {
          codigoAnimal: "anim-001",
          nombre: "Gretel",
          especie: "PERRO",
        },
      ],
      hayMas: false,
    });

    render(<DonacionesPage />);

    fireEvent.change(
      screen.getByLabelText(
        "Quiero aportar"
      ),
      {
        target: {
          value: "APADRINAMIENTO",
        },
      }
    );

    await screen.findByText("Gretel");

    expect(
      screen.getByLabelText(
        "Nombre de la persona donante"
      )
    ).toBeRequired();

    expect(
      screen.getByLabelText(
        "Correo electrónico"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText(
        "Omitir mis datos personales en el formulario"
      )
    ).not.toBeInTheDocument();

    fireEvent.submit(
      screen
        .getByRole("button", {
          name: "Registrar donación",
        })
        .closest("form")
    );

    await waitFor(() =>
      expect(
        screen.getByRole("alert")
      ).toHaveTextContent(
        "Selecciona el animal"
      )
    );
  }
);

it(
  "la directora accede con los campos públicos de la sesión",
  () => {
    expect(
      puedeGestionarDonaciones({
        rol: "DIRECTORA",
      })
    ).toBe(true);

    expect(
      puedeGestionarDonaciones({
        rol: "VETERINARIA",
      })
    ).toBe(false);

    expect(
      puedeGestionarDonaciones(null)
    ).toBe(false);
  }
);