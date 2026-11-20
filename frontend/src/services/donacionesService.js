import { api, obtenerToken } from "./api.js";

export function buscarAnimalesDonacion(
  filtros,
  signal
) {
  return api.get(
    "/donaciones/animales?" +
      new URLSearchParams(filtros),
    {
      sinSesion: true,
      signal,
    }
  );
}

export async function registrarDonacion(
  datos,
  archivo
) {
  let comprobante = {};

  if (archivo) {
    if (
      archivo.size > 2 * 1024 * 1024 ||
      !/\.pdf$/i.test(archivo.name)
    ) {
      throw new Error(
        "Adjunta un comprobante PDF de hasta 2 MB"
      );
    }

    const contenido = await new Promise(
      (resolve, reject) => {
        const lector = new FileReader();

        lector.onload = () =>
          resolve(
            lector.result.split(",")[1]
          );

        lector.onerror = () =>
          reject(
            new Error(
              "No se pudo leer el comprobante"
            )
          );

        lector.readAsDataURL(archivo);
      }
    );

    comprobante = {
      comprobanteNombre: archivo.name,
      comprobanteBase64: contenido,
    };
  }

  return api.post(
    "/donaciones",
    {
      ...datos,
      ...comprobante,
    },
    {
      sinSesion: true,
    }
  );
}

export function listarDonaciones(
  filtros,
  signal
) {
  const parametros = new URLSearchParams();

  for (
    const [clave, valor]
    of Object.entries(filtros)
  ) {
    if (valor !== "") {
      parametros.set(
        clave,
        String(valor)
      );
    }
  }

  return api.get(
    "/donaciones?" + parametros,
    { signal }
  );
}

export function revisarDonacion(
  folio,
  datos
) {
  return api.patch(
    `/donaciones/${folio}/revision`,
    datos
  );
}

export async function descargarComprobante(
  folio
) {
  const respuesta = await fetch(
    `${import.meta.env.VITE_API_URL}/donaciones/${folio}/comprobante`,
    {
      headers: {
        Authorization:
          `Bearer ${obtenerToken()}`,
      },
    }
  );

  if (!respuesta.ok) {
    throw new Error(
      "No se pudo descargar el comprobante"
    );
  }

  const enlace =
    document.createElement("a");

  enlace.href = URL.createObjectURL(
    await respuesta.blob()
  );

  enlace.download =
    `comprobante-${folio}.pdf`;

  enlace.click();

  setTimeout(
    () =>
      URL.revokeObjectURL(enlace.href),
    1000
  );
}