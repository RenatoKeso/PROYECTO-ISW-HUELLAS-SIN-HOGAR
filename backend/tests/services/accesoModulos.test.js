import test from "node:test";
import assert from "node:assert/strict";
import * as backend from "../../src/services/permisosUsuario.js";
import * as frontend from "../../../frontend/src/utils/permisosUsuario.js";

const matriz = [
    ["DIRECTORA", true, true, true],
    ["ENCARGADA_VOLUNTARIADO", true, false, false],
    ["ENCARGADA_ADOPCIONES", false, false, true],
    ["VETERINARIA", false, true, false],
    ["VOLUNTARIO", true, false, false],
];

const funciones = [
    "puedeGestionarFichas",
    "puedeConsultarAlertas",
    "puedeConsultarReportesDevolucion",
];

for (const [rol, ...esperados] of matriz) {
    test(`permisos del rol ${rol} coinciden en frontend y backend`, () => {
    funciones.forEach((nombre, indice) => {
        assert.equal(
        backend[nombre]({ rol, activo: true }),
        esperados[indice]
        );

        assert.equal(
        frontend[nombre]({ rol }),
        esperados[indice]
        );

        assert.equal(
        backend[nombre]({ rol, activo: false }),
        false
        );
    });

    assert.equal(
        backend.puedeConsultarVoluntarios({
        rol,
        activo: true,
        }),
        esperados[0] || esperados[2]
    );
});
}

test("usuarios ausentes o con rol desconocido no tienen acceso", () => {
    for (const usuario of [
    null,
    undefined,
    { rol: "DESCONOCIDO", activo: true },
]) {
    for (const nombre of funciones) {
        assert.equal(backend[nombre](usuario), false);
        assert.equal(frontend[nombre](usuario), false);
    }

    assert.equal(
        backend.puedeConsultarVoluntarios(usuario),
        false
    );
}
});