import assert from "node:assert/strict";
import test from "node:test";
import {
  FILTROS_VACIOS,
  filtrarAnimales,
  grupoEdad,
  textoEtapa,
} from "../src/utils/filtrosAdopcion.js";

const GRETEL = { id: 1, nombre: "Gretel", especie: "PERRO", sexoAnimal: "HEMBRA", edad: 3 };
const MICHI = { id: 2, nombre: "Michi", especie: "GATO", sexoAnimal: "MACHO", edad: 0 };
const TOBY = { id: 3, nombre: "Toby", especie: "PERRO", sexoAnimal: "MACHO", edad: 9 };
const SIN_EDAD = { id: 4, nombre: "Luna", especie: "PERRO", sexoAnimal: "HEMBRA", edad: null };

const ANIMALES = [GRETEL, MICHI, TOBY, SIN_EDAD];

test("convierte la edad en etapa", () => {
  assert.equal(grupoEdad(0), "CACHORRO");
  assert.equal(grupoEdad(2), "JOVEN");
  assert.equal(grupoEdad(3), "ADULTO");
  assert.equal(grupoEdad(8), "SENIOR");
  assert.equal(grupoEdad(null), null);
  assert.equal(textoEtapa(null), "Edad desconocida");
});

test("sin filtros muestra todos los animales", () => {
  assert.deepEqual(filtrarAnimales(ANIMALES, FILTROS_VACIOS), ANIMALES);
});

test("dentro de un grupo basta con coincidir con una opcion", () => {
  const filtros = { ...FILTROS_VACIOS, edad: ["CACHORRO", "SENIOR"] };
  assert.deepEqual(filtrarAnimales(ANIMALES, filtros), [MICHI, TOBY]);
});

test("entre grupos se tienen que cumplir todos", () => {
  const filtros = { ...FILTROS_VACIOS, especie: ["PERRO"], sexo: ["HEMBRA"] };
  assert.deepEqual(filtrarAnimales(ANIMALES, filtros), [GRETEL, SIN_EDAD]);
});

test("si se filtra por edad, no aparecen los de edad desconocida", () => {
  const filtros = { ...FILTROS_VACIOS, especie: ["PERRO"], edad: ["ADULTO"] };
  assert.deepEqual(filtrarAnimales(ANIMALES, filtros), [GRETEL]);
});