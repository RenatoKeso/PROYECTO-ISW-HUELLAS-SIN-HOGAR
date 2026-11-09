import assert from "node:assert/strict";
import test from "node:test";
import { urlImagen } from "../src/utils/urlImagen.js";

test("devuelve null cuando no hay imagen", () => {
  assert.equal(urlImagen(null), null);
  assert.equal(urlImagen(""), null);
});

test("conserva las rutas relativas del backend sin VITE_API_URL", () => {
  assert.equal(
    urlImagen("/uploads/animales/foto.jpg"),
    "/uploads/animales/foto.jpg",
  );
});

test("conserva URLs absolutas", () => {
  assert.equal(
    urlImagen("https://cdn.example.com/foto.jpg"),
    "https://cdn.example.com/foto.jpg",
  );
});
