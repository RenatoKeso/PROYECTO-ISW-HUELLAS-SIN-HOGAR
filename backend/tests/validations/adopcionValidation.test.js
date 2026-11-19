import test from "node:test";
import assert from "node:assert/strict";

import {
    digitoVerificadorRut,
    postulacionCreateSchema,
} from "../../src/validations/adopcionValidation.js";

const FORMULARIO_VALIDO = {
    fichaAnimalId: 1,
    nombrePostulante: "Ana Soto",
    rutPostulante: "12345678-5",
    fechaNacimientoPostulante: "1995-04-10",
    telefonoPostulante: "912345678",
    emailPostulante: "ana@correo.cl",
    direccionPostulante: "Av. Libertad 123",
    comunaPostulante: "Chillán",
    tipoVivienda: "CASA",
    tenenciaVivienda: "PROPIA",
    tienePatio: true,
    personasHogar: 3,
    hayNinos: false,
    horasSoloAlDia: 4,
    disponibilidadTiempo: "Trabaja media jornada",
    motivoAdopcion: "Queremos darle un hogar a un animal rescatado",
    aceptaSeguimiento: true,
};

function mensajesDe(cambios) {
    const resultado = postulacionCreateSchema.safeParse({ ...FORMULARIO_VALIDO, ...cambios });
    return resultado.success ? [] : resultado.error.issues.map((issue) => issue.message);
}

test("calcula el digito verificador con modulo 11, incluidos el 0 y la K", () => {
    assert.equal(digitoVerificadorRut("12345678"), "5");
    assert.equal(digitoVerificadorRut("11223344"), "K");
    assert.equal(digitoVerificadorRut("7654321"), "6");
    assert.equal(digitoVerificadorRut("11111117"), "0");
});

test("el nombre acepta tildes, ñ, guion y apostrofo, y deja un solo espacio", () => {
    const resultado = postulacionCreateSchema.parse({
        ...FORMULARIO_VALIDO,
        nombrePostulante: "  María-José   Ñuñez O'Ryan ",
    });

    assert.equal(resultado.nombrePostulante, "María-José Ñuñez O'Ryan");
});

test("cada campo con error muestra un solo mensaje", () => {
    assert.deepEqual(mensajesDe({ nombrePostulante: "" }), ["El nombre es obligatorio"]);
    assert.deepEqual(mensajesDe({ nombrePostulante: "Benj4" }), [
        "El nombre solo puede tener letras",
    ]);
    assert.deepEqual(mensajesDe({ rutPostulante: "123" }), [
        "El RUT debe tener el formato 12345678-9",
    ]);
});

test("si la vivienda no es arrendada, no guarda el permiso del arriendo", () => {
    const resultado = postulacionCreateSchema.parse({
        ...FORMULARIO_VALIDO,
        permiteMascotasArriendo: true,
    });

    assert.equal(resultado.permiteMascotasArriendo, undefined);
});

test("las horas solas al dia aceptan 0 pero no mas de 24", () => {
    assert.deepEqual(mensajesDe({ horasSoloAlDia: 0 }), []);
    assert.deepEqual(mensajesDe({ horasSoloAlDia: 25 }), ["Las horas al día deben ser entre 0 y 24"]);
});
