import test from "node:test";
import assert from "node:assert/strict";

import {
  digitoVerificadorRut,
  motivoRechazoSchema,
  postulacionFormSchema,
} from "../src/validations/postulacionValidation.js";

// Asi llegan los datos desde el formulario: todo como texto, salvo la casilla.
const VALIDA = {
  nombrePostulante: "Ana Soto",
  rutPostulante: "11.223.344-k",
  fechaNacimientoPostulante: "1995-04-10",
  telefonoPostulante: "9 1234 5678",
  emailPostulante: " Ana@Correo.CL ",
  direccionPostulante: "Av. Libertad 123",
  comunaPostulante: "Chillán",
  tipoVivienda: "CASA",
  tenenciaVivienda: "PROPIA",
  permiteMascotasArriendo: "",
  tienePatio: "SI",
  personasHogar: "3",
  hayNinos: "NO",
  otrasMascotas: "   ",
  horasSoloAlDia: "0",
  disponibilidadTiempo: "Tardes libres todos los días",
  motivoAdopcion: "Queremos darle un hogar a un animal rescatado",
  aceptaSeguimiento: true,
};

// Devuelve { campo: mensaje } de los errores, como los muestra el formulario.
function erroresDe(cambios) {
  const resultado = postulacionFormSchema.safeParse({ ...VALIDA, ...cambios });
  if (resultado.success) return {};

  return Object.fromEntries(
    resultado.error.issues.map((issue) => [issue.path[0], issue.message]),
  );
}

test("normaliza el RUT, el telefono y el correo, y convierte Si/No y numeros", () => {
  const resultado = postulacionFormSchema.parse(VALIDA);

  assert.equal(resultado.rutPostulante, "11223344-K");
  assert.equal(resultado.telefonoPostulante, "912345678");
  assert.equal(resultado.emailPostulante, "ana@correo.cl");
  assert.equal(resultado.otrasMascotas, undefined);
  assert.equal(resultado.tienePatio, true);
  assert.equal(resultado.hayNinos, false);
  assert.equal(resultado.personasHogar, 3);
  assert.equal(resultado.horasSoloAlDia, 0);
  assert.equal(resultado.permiteMascotasArriendo, undefined);
});

test("calcula el digito verificador del RUT", () => {
  assert.equal(digitoVerificadorRut("12345678"), "5");
  assert.equal(digitoVerificadorRut("11223344"), "K");
  assert.equal(digitoVerificadorRut("11111117"), "0");
});

test("rechaza un RUT con formato incorrecto o con el digito equivocado", () => {
  assert.deepEqual(erroresDe({ rutPostulante: "123" }), {
    rutPostulante: "El RUT debe tener el formato 12345678-9",
  });
  assert.deepEqual(erroresDe({ rutPostulante: "12.345.678-9" }), {
    rutPostulante: "El RUT no es válido, revisa el dígito verificador",
  });
});

test("el nombre solo acepta letras y pide nombre y apellido", () => {
  assert.deepEqual(erroresDe({ nombrePostulante: "Benj4" }), {
    nombrePostulante: "El nombre solo puede tener letras",
  });
  assert.deepEqual(erroresDe({ nombrePostulante: "Benjamin" }), {
    nombrePostulante: "Escribe tu nombre y apellido",
  });
  assert.deepEqual(erroresDe({ nombrePostulante: "" }), {
    nombrePostulante: "El nombre es obligatorio",
  });
  assert.deepEqual(erroresDe({ nombrePostulante: "María José Ñuñez" }), {});
});

test("el correo es obligatorio", () => {
  assert.deepEqual(erroresDe({ emailPostulante: "" }), {
    emailPostulante: "El correo es obligatorio",
  });
  assert.deepEqual(erroresDe({ emailPostulante: "no-es-correo" }), {
    emailPostulante: "El correo no es válido",
  });
});

test("exige elegir el tipo de vivienda", () => {
  assert.deepEqual(erroresDe({ tipoVivienda: "" }), {
    tipoVivienda: "Selecciona el tipo de vivienda",
  });
});

test("rechaza a un menor de 18 años", () => {
  const haceDiezAnios = `${new Date().getFullYear() - 10}-01-01`;

  assert.deepEqual(erroresDe({ fechaNacimientoPostulante: haceDiezAnios }), {
    fechaNacimientoPostulante: "Debes tener al menos 18 años para adoptar",
  });
});

test("si arrienda, pregunta si el arriendo permite mascotas", () => {
  assert.deepEqual(erroresDe({ tenenciaVivienda: "ARRENDADA" }), {
    permiteMascotasArriendo: "Indica si el arriendo permite mascotas",
  });

  const conPermiso = postulacionFormSchema.parse({
    ...VALIDA,
    tenenciaVivienda: "ARRENDADA",
    permiteMascotasArriendo: "NO",
  });
  assert.equal(conPermiso.permiteMascotasArriendo, false);
});

test("los numeros vacios no se convierten en 0", () => {
  assert.deepEqual(erroresDe({ personasHogar: "", horasSoloAlDia: "" }), {
    personasHogar: "Indica cuántas personas viven en el hogar",
    horasSoloAlDia: "Indica cuántas horas al día estaría solo",
  });
});

test("exige aceptar los seguimientos y un motivo de al menos 20 caracteres", () => {
  assert.deepEqual(erroresDe({ aceptaSeguimiento: false, motivoAdopcion: "porque sí" }), {
    aceptaSeguimiento: "Debes aceptar los seguimientos después de la adopción",
    motivoAdopcion: "El motivo para adoptar debe tener al menos 20 caracteres",
  });
});

test("el motivo de rechazo es obligatorio y no puede ser tan corto", () => {
  assert.equal(
    motivoRechazoSchema.safeParse("  ").error.issues[0].message,
    "Para rechazar, indica el motivo en las observaciones",
  );
  assert.equal(
    motivoRechazoSchema.safeParse("no").error.issues[0].message,
    "El motivo del rechazo debe tener al menos 10 caracteres",
  );
  assert.equal(motivoRechazoSchema.parse(" No cumple los requisitos "), "No cumple los requisitos");
});
