# Backend — Requisito r3: Revisión inicial

## Propósito

Este documento explica cómo el backend implementa la revisión inicial del animal.

Requisito:

> El voluntario autorizado o la médica veterinaria deberá poder realizar la revisión inicial del animal.

## Endpoint

`POST /api/registros-medicos/:id/revision-inicial`

## Flujo backend

1. La ruta valida `id` con `registroMedicoIdParamSchema`.
2. Valida body con `revisionInicialSchema`.
3. Captura errores con `capturarErrores`.
4. Controlador delega en `completarRevisionInicial`.
5. Servicio verifica permiso:
   - `puedeRegistrarRevisionInicial`.
6. Servicio abre transacción.
7. Servicio obtiene registro médico.
8. Verifica estado:
   - Debe estar `PROVISIONAL`.
9. Verifica que el animal esté en refugio.
10. Actualiza registro médico.
11. Crea `RevisionInicial`.
12. Devuelve respuesta con registro actualizado y prioridad.

## Funciones

### `completarRevisionInicial`

Archivo: `backend/src/services/registroMedicoService.js`

Recibe:

```json
{
  "registroMedicoId": 500,
  "datos": {
    "pesoKg": 12.5,
    "clasificacionSalud": "ENFERMO",
    "observacionInicial": "Tos persistente",
    "requiereCuarentena": true
  },
  "actor": { }
}
```

### `prioridadDe`

Convierte:

- `CRITICO` → `1`
- `ENFERMO` → `2`
- `NORMAL` → `3`

## Estados

- Entrada: `PROVISIONAL`.
- Salida: `VALIDACION_PENDIENTE`.

## Validación

`revisionInicialSchema` exige:

- `pesoKg`
- `clasificacionSalud`
- `observacionInicial`
- `requiereCuarentena`

## Errores

- `ROL_INSUFICIENTE` → `403`.
- `REGISTRO_MEDICO_INEXISTENTE` → `404`.
- `ESTADO_INVALIDO` → `409`.
- `ANIMAL_NO_ESTA_EN_REFUGIO` → `409`.

## Tests

- `backend/tests/services/registroMedicoService.test.js`.
- `backend/tests/routes/registroMedicoRoutes.test.js`.
- `backend/tests/validations/registroMedicoValidation.test.js`.

## Punto clave

El servicio usa transacción para actualizar el registro médico y persistir la revisión inicial sin estados intermedios inconsistentes.
