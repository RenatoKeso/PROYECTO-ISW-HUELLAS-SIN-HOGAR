const API_URL = import.meta.env.VITE_API_URL;

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
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message || `Error ${response.status}`, {
      status: response.status,
      code: data?.code,
      detalles: data?.detalles,
    });
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) =>
    request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
