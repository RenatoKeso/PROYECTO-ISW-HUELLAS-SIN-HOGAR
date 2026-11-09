import {
  fichaCreateMultipartSchema,
  fichaCreateSchema,
} from "../validations/fichaAnimalValidation.js";

export function validarCreacionFicha(request, response, next) {
  const esquema = request.is("multipart/form-data")
    ? fichaCreateMultipartSchema
    : fichaCreateSchema;

  const resultado = esquema.safeParse(request.body);

  if (!resultado.success) {
    next(resultado.error);
    return;
  }

  request.body = resultado.data;
  next();
}
