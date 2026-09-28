import { z } from "zod";
import { fichaAnimalCreateSchema } from "./fichaAnimalValidation.js";
import { ingresoAnimalCreateSchema } from "./ingresoAnimalValidation.js";

export const CAMPOS_FICHA = [
  "nombre",
  "sexoAnimal",
  "especie",
  "raza",
  "edad",
  "observaciones",
];

export const CAMPOS_INGRESO = [
  "receptorId",
  "fechaIngreso",
  "procedencia",
  "ubicacionEncontrado",
  "estadoSalud",
  "codigoAnimal",
];

export const ESTADO_ESTADIA_AL_INGRESAR = "ACTIVO";

function extraerCampos(esquema, campos) {
  return Object.fromEntries(campos.map((campo) => [campo, esquema.shape[campo]]));
}

function seleccionarCampos(datos, campos) {
  return Object.fromEntries(
    campos.filter((campo) => datos[campo] !== undefined).map((campo) => [campo, datos[campo]]),
  );
}

function extraerCamposOpcionales(esquema, campos) {
  return Object.fromEntries(
    campos.map((campo) => [campo, esquema.shape[campo].optional()]),
  );
}

const esquemaPlano = z.strictObject({
  ...extraerCamposOpcionales(fichaAnimalCreateSchema, CAMPOS_FICHA),
  ...extraerCampos(ingresoAnimalCreateSchema, CAMPOS_INGRESO),
});

export const registroIngresoSchema = esquemaPlano.superRefine((datos, ctx) => {
  if (datos.codigoAnimal !== undefined) {
    const camposFichaEnviados = CAMPOS_FICHA.filter((campo) => datos[campo] !== undefined);

    if (camposFichaEnviados.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Un reingreso solo acepta codigoAnimal, no se envian datos de ficha (${camposFichaEnviados.join(", ")})`,
        path: ["codigoAnimal"],
      });
    }

    return;
  }

  const resultadoFicha = fichaAnimalCreateSchema.safeParse(seleccionarCampos(datos, CAMPOS_FICHA));

  if (!resultadoFicha.success) {
    for (const issue of resultadoFicha.error.issues) {
      ctx.addIssue({ ...issue, path: issue.path });
    }
  }
});

export function separarFichaEIngreso(datos) {
  const camposFicha = seleccionarCampos(datos, CAMPOS_FICHA);
  const ficha =
    datos.codigoAnimal === undefined
      ? { ...camposFicha, estadoEstadia: ESTADO_ESTADIA_AL_INGRESAR }
      : {};

  return { ficha, ingreso: seleccionarCampos(datos, CAMPOS_INGRESO) };
}
