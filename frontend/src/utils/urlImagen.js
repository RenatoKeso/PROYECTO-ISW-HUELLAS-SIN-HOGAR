function origenDelBackend() {
  const base = import.meta.env?.VITE_API_URL;

  if (!base) return "";

  try {
    const origen = globalThis.location?.origin ?? "http://localhost";
    const url = new URL(base, origen);
    return url.origin;
  } catch {
    return "";
  }
}

export function urlImagen(imagenUrl) {
  if (!imagenUrl) return null;

  if (/^https?:\/\//i.test(imagenUrl)) return imagenUrl;

  return `${origenDelBackend()}${imagenUrl}`;
}
