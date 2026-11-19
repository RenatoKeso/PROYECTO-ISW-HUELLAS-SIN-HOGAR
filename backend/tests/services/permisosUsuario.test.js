import test from "node:test";
import assert from "node:assert/strict";

import {
    ROLES_USUARIO,
    puedeCrearUsuario,
    puedeCambiarRol,
    puedeDesactivarUsuario,
    puedeActualizarRegistroMedico,
    puedeActualizarRevisionInicial,
    puedeConsultarAlertas,
    puedeRealizarRevisionFinal,
    puedeRegistrarRevisionInicial,
    puedeRegistrarSeguimiento,
} from "../../src/services/permisosUsuario.js";

const directora = {
    id: 1,
    rol: "DIRECTORA",
    activo: true,
};

const encargada = {
    id: 2,
    rol: "ENCARGADA_VOLUNTARIADO",
    activo: true,
};

const voluntario = {
    id: 3,
    rol: "VOLUNTARIO",
    activo: true,
};

const veterinaria = {
    id: 4,
    rol: "VETERINARIA",
    activo: true,
};

const voluntarioConfianza = {
    id: 5,
    rol: "VOLUNTARIO_CONFIANZA",
    activo: true,
};

test("la directora puede crear todos los roles conocidos", () => {
    for (const rol of ROLES_USUARIO) {
    assert.equal(
        puedeCrearUsuario(directora, rol),
        true
    );
}

    assert.equal(
    puedeCrearUsuario(directora, "ADMIN"),
    false
);
});

test("la encargada solo administra cuentas de voluntarios", () => {
    assert.equal(
    puedeCrearUsuario(encargada, "VOLUNTARIO"),
    true
);

    assert.equal(
    puedeDesactivarUsuario(encargada, voluntario),
    true
);

    const otrosRoles = ROLES_USUARIO.filter(
    (rol) => rol !== "VOLUNTARIO"
);

    for (const rol of otrosRoles) {
    assert.equal(
        puedeCrearUsuario(encargada, rol),
        false
    );

    assert.equal(
        puedeDesactivarUsuario(encargada, {
        id: 5,
        rol,
        }),
    false
    );
}

    assert.equal(
    puedeCambiarRol(
        encargada,
        voluntario,
        "VETERINARIA"
    ),
    false
);
});

test("cuentas inactivas o sin permiso no administran usuarios", () => {
    const actores = [
    undefined,
    { ...directora, activo: false },
    voluntario,
    veterinaria,
];

    for (const actor of actores) {
    assert.equal(
        puedeCrearUsuario(actor, "VOLUNTARIO"),
        false
    );

    assert.equal(
        puedeDesactivarUsuario(actor, voluntario),
        false
    );

    assert.equal(
        puedeCambiarRol(
        actor,
        voluntario,
        "DIRECTORA"
    ),
    false
    );
}
});

test("la directora administra otras cuentas sin bloquearse a sí misma", () => {
    assert.equal(
    puedeCambiarRol(
        directora,
        voluntario,
        "VETERINARIA"
    ),
    true
);

    assert.equal(
        puedeDesactivarUsuario(directora, veterinaria),
        true
);

    assert.equal(
    puedeCambiarRol(
        directora,
        directora,
        "VOLUNTARIO"
    ),
    false
);

    assert.equal(
    puedeDesactivarUsuario(directora, directora),
    false
);

    assert.equal(
    puedeCambiarRol(
        directora,
        voluntario,
        "ADMIN"
    ),
    false
);
});

test("directora y veterinaria activas pueden consultar alertas", () => {
    assert.equal(
    puedeConsultarAlertas(directora),
    true
);

    assert.equal(
    puedeConsultarAlertas(veterinaria),
    true
    );

    const actoresSinPermiso = [
    encargada,
    voluntario,
    undefined,
    { ...directora, activo: false },
    { ...veterinaria, activo: false },
    ];

    for (const actor of actoresSinPermiso) {
    assert.equal(
        puedeConsultarAlertas(actor),
        false
    );
}
});

test("voluntarios y veterinarias activas registran la revision inicial", () => {
  assert.equal(puedeRegistrarRevisionInicial(voluntario), true);
  assert.equal(puedeRegistrarRevisionInicial(voluntarioConfianza), true);
  assert.equal(puedeRegistrarRevisionInicial(veterinaria), true);

  const actores = [
    directora,
    encargada,
    undefined,
    null,
    {},
    { ...voluntarioConfianza, activo: false },
    { ...veterinaria, activo: false },
    { ...voluntarioConfianza, rol: "ROL_INEXISTENTE" },
  ];

  for (const actor of actores) {
    assert.equal(puedeRegistrarRevisionInicial(actor), false);
  }
});

test("la encargada de adopciones no registra la revision inicial", () => {
  assert.equal(
    puedeRegistrarRevisionInicial({
      id: 9,
      rol: "ENCARGADA_ADOPCIONES",
      activo: true,
    }),
    false
  );
});

test("solo la veterinaria activa realiza la revision final", () => {
  assert.equal(puedeRealizarRevisionFinal(veterinaria), true);

  const actores = [
    directora,
    encargada,
    voluntario,
    voluntarioConfianza,
    undefined,
    null,
    {},
    { ...veterinaria, activo: false },
    { ...veterinaria, rol: "VOLUNTARIO" },
  ];

  for (const actor of actores) {
    assert.equal(puedeRealizarRevisionFinal(actor), false);
  }
});

test("voluntarios y veterinarias actualizan la revision inicial", () => {
  assert.equal(puedeActualizarRevisionInicial(voluntario), true);
  assert.equal(puedeActualizarRevisionInicial(voluntarioConfianza), true);
  assert.equal(puedeActualizarRevisionInicial(veterinaria), true);

  const actores = [
    directora,
    encargada,
    undefined,
    null,
    {},
    { ...voluntarioConfianza, activo: false },
    { ...veterinaria, activo: false },
    { ...voluntarioConfianza, rol: "ROL_INEXISTENTE" },
  ];

  for (const actor of actores) {
    assert.equal(puedeActualizarRevisionInicial(actor), false);
  }
});

test("solo la veterinaria activa actualiza registros y registra seguimientos", () => {
  assert.equal(puedeActualizarRegistroMedico(veterinaria), true);
  assert.equal(puedeRegistrarSeguimiento(veterinaria), true);

  const actores = [
    directora,
    encargada,
    voluntario,
    voluntarioConfianza,
    undefined,
    null,
    {},
    { ...veterinaria, activo: false },
    { ...veterinaria, rol: "VOLUNTARIO" },
  ];

  for (const actor of actores) {
    assert.equal(puedeActualizarRegistroMedico(actor), false);
    assert.equal(puedeRegistrarSeguimiento(actor), false);
  }
});
