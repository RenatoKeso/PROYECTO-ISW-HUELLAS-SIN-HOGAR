const API_URL = import.meta.env.VITE_API_URL;
const CLAVE_TOKEN = "huellas.token";
export const EVENTO_SESION_EXPIRADA = "huellas:sesion-expirada";

export function obtenerToken() {
  return sessionStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token) {
  if (token) {
    sessionStorage.setItem(CLAVE_TOKEN, token);
  } else {
    sessionStorage.removeItem(CLAVE_TOKEN);
  }
}

export class ApiError extends Error {
  constructor(message, { status, code, detalles } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detalles = detalles;
  }
}

async function request(path, options = {}) {
  const { sinSesion = false, ...opcionesFetch } = options;

  const token = sinSesion ? null : obtenerToken();
  const headers = new Headers(opcionesFetch.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...opcionesFetch,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (
      response.status === 401 &&
      token &&
      obtenerToken() === token
    ) {
      guardarToken(null);
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }

    throw new ApiError(
      data?.message || `Error ${response.status}`,
      {
        status: response.status,
        code: data?.code,
        detalles: data?.detalles,
      }
    );
  }

  return data;
}

export const api = {
  get: (path, options = {}) => request(path, options),

  post: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (path, options = {}) =>
    request(path, {
      ...options,
      method: "DELETE",
    }),
};