import test from "node:test";
import assert from "node:assert/strict";
import {
  actualizacionVeterinariaSchema,
  notificacionIdParamSchema,
  registroMedicoIdParamSchema,
  revisionFinalSchema,
  revisionInicialSchema,
} from "../../src/validations/registroMedicoValidation.js";

const revisionValida = {
  pesoKg: 12.4,
  clasificacionSalud: "ENFERMO",
  observacionInicial: "Tos persistente y baja de apetito",
  requiereCuarentena: true,
};

const revisionFinalValida = {
  pesoRevalidadoKg: 13.2,
  condiciones: "  Condición estable  ",
  discapacidades: "Movilidad reducida",
  lesiones: "Herida leve",
  descripcionCuidadosEspeciales: "Dieta especial",
  adoptabilidad: "ADOPTABLE",
  enfermedades: [
    {
      descripcionEnfermedad: "Dermatitis",
      tipoEnfermedad: "Piel",
    },
  ],
  tratamientos: [
    {
      descripcionTratamiento: "Antibiótico",
      fechaInicio: "2026-11-03",
      fechaFin: "2026-11-10",
    },
  ],
  atencionesSanitarias: [
    {
      tipo: "vacuna",
      fechaProgramada: "2026-11-15",
    },
  ],
};

test("acepta una revision inicial completa y valida", () => {
  const resultado = revisionInicialSchema.safeParse(revisionValida);

  assert.equal(resultado.success, true);
  assert.deepEqual(resultado.data, revisionValida);
});

test("recorta los espacios de la observacion", () => {
  const resultado = revisionInicialSchema.safeParse({
    ...revisionValida,
    observacionInicial: "  Se observa delgada  ",
  });

  assert.equal(resultado.success, true);
  assert.equal(resultado.data.observacionInicial, "Se observa delgada");
});

test("rechaza un peso que no sea mayor a cero", () => {
  for (const pesoKg of [0, -3]) {
    const resultado = revisionInicialSchema.safeParse({
      ...revisionValida,
      pesoKg,
    });

    assert.equal(resultado.success, false);
  }
});

test("acepta un peso inicial de hasta 100 kg", () => {
  const resultado = revisionInicialSchema.safeParse({
    ...revisionValida,
    pesoKg: 100,
  });

  assert.equal(resultado.success, true);
  assert.equal(resultado.data.pesoKg, 100);
});

test("rechaza un peso fuera de rango o enviado como texto", () => {
  for (const pesoKg of ["10", 100.01, 1000]) {
    const resultado = revisionInicialSchema.safeParse({
      ...revisionValida,
      pesoKg,
    });

    assert.equal(resultado.success, false);
  }
});

test("rechaza una clasificacion fuera del enum", () => {
  const resultado = revisionInicialSchema.safeParse({
    ...revisionValida,
    clasificacionSalud: "SANO",
  });

  assert.equal(resultado.success, false);
});

test("rechaza una observacion vacia o ausente", () => {
  for (const observacionInicial of ["", "   "]) {
    const resultado = revisionInicialSchema.safeParse({
      ...revisionValida,
      observacionInicial,
    });

    assert.equal(resultado.success, false);
  }

  const { observacionInicial, ...sinObservacion } = revisionValida;
  assert.equal(revisionInicialSchema.safeParse(sinObservacion).success, false);
});

test("rechaza una cuarentena ausente o que no sea booleana", () => {
  const { requiereCuarentena, ...sinCuarentena } = revisionValida;
  assert.equal(revisionInicialSchema.safeParse(sinCuarentena).success, false);

  const resultado = revisionInicialSchema.safeParse({
    ...revisionValida,
    requiereCuarentena: "si",
  });
  assert.equal(resultado.success, false);
});

test("rechaza campos que no pertenecen a la revision inicial", () => {
  const resultado = revisionInicialSchema.safeParse({
    ...revisionValida,
    prioridadAtencion: 1,
  });

  assert.equal(resultado.success, false);
  assert.ok(
    resultado.error.issues.some((issue) => issue.code === "unrecognized_keys"),
  );
});

test("el identificador del registro se convierte a entero positivo", () => {
  const resultado = registroMedicoIdParamSchema.safeParse({ id: "14" });

  assert.equal(resultado.success, true);
  assert.equal(resultado.data.id, 14);
});

test("rechaza identificadores no numericos, cero o negativos", () => {
  for (const id of ["abc", "0", "-2", "1.5"]) {
    assert.equal(registroMedicoIdParamSchema.safeParse({ id }).success, false);
  }
});

// ---------------------------------------------------------------------------
// r4: revision final
// ---------------------------------------------------------------------------

test("acepta una revision final completa y valida", () => {
  const resultado = revisionFinalSchema.safeParse(revisionFinalValida);

  assert.equal(resultado.success, true);
  assert.equal(resultado.data.pesoRevalidadoKg, 13.2);
  assert.equal(resultado.data.condiciones, "Condición estable");
  assert.equal(resultado.data.adoptabilidad, "ADOPTABLE");
  assert.equal(resultado.data.enfermedades.length, 1);
  assert.equal(resultado.data.tratamientos.length, 1);
  assert.equal(resultado.data.atencionesSanitarias.length, 1);
});

test("acepta una revision final sin listas ni textos opcionales", () => {
  const resultado = revisionFinalSchema.safeParse({
    pesoRevalidadoKg: 10,
    adoptabilidad: "NO_ADOPTABLE",
  });

  assert.equal(resultado.success, true);
});

test("acepta un peso revalidado de hasta 100 kg", () => {
  const resultado = revisionFinalSchema.safeParse({
    pesoRevalidadoKg: 100,
    adoptabilidad: "ADOPTABLE",
  });

  assert.equal(resultado.success, true);
});

test("rechaza un peso revalidado fuera de rango o enviado como texto", () => {
  for (const pesoRevalidadoKg of [0, -1, 100.01, "10"]) {
    const resultado = revisionFinalSchema.safeParse({
      pesoRevalidadoKg,
      adoptabilidad: "ADOPTABLE",
    });

    assert.equal(resultado.success, false);
  }
});

test("rechaza una adoptabilidad fuera del enum", () => {
  const resultado = revisionFinalSchema.safeParse({
    pesoRevalidadoKg: 13.2,
    adoptabilidad: "TAL_VEZ",
  });

  assert.equal(resultado.success, false);
});

test("rechaza listas opcionales vacias", () => {
  for (const campo of [
    "enfermedades",
    "tratamientos",
    "atencionesSanitarias",
  ]) {
    const resultado = revisionFinalSchema.safeParse({
      ...revisionFinalValida,
      [campo]: [],
    });

    assert.equal(resultado.success, false);
  }
});

test("rechaza una fecha de atencion sanitaria invalida", () => {
  const resultado = revisionFinalSchema.safeParse({
    ...revisionFinalValida,
    atencionesSanitarias: [
      {
        tipo: "vacuna",
        fechaProgramada: "15/11/2026",
      },
    ],
  });

  assert.equal(resultado.success, false);
});

test("rechaza campos que no pertenecen a la revision final", () => {
  const resultado = revisionFinalSchema.safeParse({
    ...revisionFinalValida,
    estadoValidacion: "REALIZADO",
  });

  assert.equal(resultado.success, false);
  assert.ok(
    resultado.error.issues.some((issue) => issue.code === "unrecognized_keys"),
  );
});

test("actualizacionVeterinariaSchema acepta solo el seguimiento obligatorio", () => {
  const resultado = actualizacionVeterinariaSchema.safeParse({
    observacionSeguimiento: "  Evoluciona favorablemente  ",
    evolucionEstadoSalud: "MEJORANDO",
  });

  assert.equal(resultado.success, true);
  assert.equal(
    resultado.data.observacionSeguimiento,
    "Evoluciona favorablemente",
  );
});

test("actualizacionVeterinariaSchema acepta campos clinicos y listas", () => {
  const resultado = actualizacionVeterinariaSchema.safeParse({
    pesoKg: 13.1,
    clasificacionSalud: "NORMAL",
    observacionInicial: "Control sin complicaciones",
    requiereCuarentena: false,
    condiciones: "Sin condiciones",
    necesidades: "Dieta blanda",
    observacionSeguimiento: "Estable",
    evolucionEstadoSalud: "ESTABLE",
    fechaRegistro: "2026-11-03T12:00:00.000Z",
    enfermedades: [
      {
        descripcionEnfermedad: "Dermatitis",
        estadoEnfermedad: "EN_CURSO",
      },
    ],
    tratamientos: [
      {
        descripcionTratamiento: "Antibiótico",
        fechaInicio: "2026-11-03",
        estadoTratamiento: "EN_CURSO",
      },
    ],
    seguimientoEnfermedades: [
      {
        enfermedadId: 71,
        estadoEnfermedad: "RESUELTO",
      },
    ],
    seguimientoTratamientos: [
      {
        tratamientoId: 81,
        estadoTratamiento: "RESUELTO",
      },
    ],
    atencionesSanitarias: [
      {
        tipo: "control",
        fechaProgramada: "2026-11-10",
      },
    ],
  });

  assert.equal(resultado.success, true);
  assert.ok(resultado.data.fechaRegistro instanceof Date);
});

test("actualizacionVeterinariaSchema exige observacion y evolucion", () => {
  for (const datos of [
    { evolucionEstadoSalud: "MEJORANDO" },
    { observacionSeguimiento: "Evoluciona" },
    { observacionSeguimiento: "", evolucionEstadoSalud: "ESTABLE" },
  ]) {
    assert.equal(
      actualizacionVeterinariaSchema.safeParse(datos).success,
      false,
    );
  }
});

test("actualizacionVeterinariaSchema rechaza enums, campos y fechas invalidas", () => {
  const datos = {
    observacionSeguimiento: "Evoluciona",
    evolucionEstadoSalud: "MEJORANDO",
  };

  assert.equal(
    actualizacionVeterinariaSchema.safeParse({
      ...datos,
      evolucionEstadoSalud: "IGUAL",
    }).success,
    false,
  );
  assert.equal(
    actualizacionVeterinariaSchema.safeParse({
      ...datos,
      estadoValidacion: "ACTUALIZADO",
    }).success,
    false,
  );
  assert.equal(
    actualizacionVeterinariaSchema.safeParse({
      ...datos,
      fechaRegistro: "no-es-fecha",
    }).success,
    false,
  );
});

test("actualizacionVeterinariaSchema rechaza listas vacias", () => {
  for (const campo of [
    "enfermedades",
    "tratamientos",
    "seguimientoEnfermedades",
    "seguimientoTratamientos",
    "atencionesSanitarias",
  ]) {
    assert.equal(
      actualizacionVeterinariaSchema.safeParse({
        observacionSeguimiento: "Evoluciona",
        evolucionEstadoSalud: "MEJORANDO",
        [campo]: [],
      }).success,
      false,
    );
  }
});

test("valida el identificador de una notificacion", () => {
  assert.equal(notificacionIdParamSchema.safeParse({ id: "4" }).success, true);

  for (const id of ["0", "-1", "1.5", "abc"]) {
    assert.equal(notificacionIdParamSchema.safeParse({ id }).success, false);
  }
});
