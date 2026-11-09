# Backend — Requisito r4: Revisión final

## Propósito

Este documento explica cómo el backend implementa la revisión final veterinaria.

Requisito:

> La médica veterinaria deberá realizar la revisión final del animal.

## Endpoint

`POST /api/registros-medicos/:id/validacion`

## Flujo backend

1. La ruta valida `id` y body con `revisionFinalSchema`.
2. El controlador delega en `realizarRevisionFinal`.
3. El servicio verifica permiso:
   - `puedeRealizarRevisionFinal`.
4. Abre transacción.
5. Obtiene registro médico.
6. Exige estado `VALIDACION_PENDIENTE`.
7. Crea o actualiza `RevisionCompleta`.
8. Crea enfermedades y tratamientos.
9. Crea atenciones sanitarias.
10. Actualiza registro médico a `REALIZADO`.
11. Actualiza adopción del animal.
12. Registra cambio de estado animal.

## Funciones

### `realizarRevisionFinal`

Archivo: `backend/src/services/registroMedicoService.js`

Recibe:

```json
{
  "registroMedicoId": 500,
  "datos": {
    "pesoRevalidadoKg": 13.5,
    "adoptabilidad": "ADOPTABLE",
    "condiciones": "Condición estable"
  },
  "actor": { }
}
```

## Modelos

- `RevisionCompleta`.
- `EnfermedadAnimal`.
- `TratamientoAnimal`.
- `AtencionSanitaria`.
- `ActualizacionEstadoAnimal`.
- `FichaAnimal.estadoAdopcion`.

## Regla de control sanitario

El backend reutiliza `AtencionSanitaria`, ya existente, en lugar de crear un modelo nuevo.

## Estados

- Entrada: `VALIDACION_PENDIENTE`.
- Salida: `REALIZADO`.

## Errores

- `ROL_INSUFICIENTE` → `403`.
- `REGISTRO_MEDICO_INEXISTENTE` → `404`.
- `ESTADO_INVALIDO` → `409`.
- `ANIMAL_NO_ESTA_EN_REFUGIO` → `409`.
- `REVISION_INICIAL_REQUERIDA` → `409`.

## Tests

- `backend/tests/services/registroMedicoService.test.js`.
- `backend/tests/routes/registroMedicoRoutes.test.js`.
- `backend/tests/validations/registroMedicoValidation.test.js`.

## Punto clave

La revisión final es transaccional y finaliza el estado médico en `REALIZADO`.
