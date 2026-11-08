# Backend — Requisito r5: Actualización única de la revisión inicial

## Propósito

Este documento explica cómo el backend implementa la actualización única de la revisión inicial.

Requisito:

> El voluntario autorizado podrá corregir una sola vez la revisión inicial.

## Endpoint

`PATCH /api/registros-medicos/:id/revision-inicial`

## Flujo backend

1. Validar `id` y body.
2. Verificar permiso:
   - `puedeActualizarRevisionInicial`.
3. Obtener registro médico antes de la transacción.
4. Validar que pueda actualizarse.
5. Abrir transacción.
6. Volver a obtener el registro dentro de la transacción.
7. Bloquear con `fechaActualizacion`.
8. Calcular cambios sobre campos de revisión inicial.
9. Persistir auditorías.
10. Si el registro estaba `REALIZADO` o `ACTUALIZADO`, devolverlo a `VALIDACION_PENDIENTE`.
11. Notificar a veterinarias activas.

## Funciones

### `actualizarRevisionInicial`

Archivo: `backend/src/services/registroMedicoService.js`

Responsable de:

- Bloqueo único.
- Auditoría.
- Cambio de estado.
- Notificaciones.

### `actualizarRevisionInicialBloqueada`

Archivo: `backend/src/repositories/registroMedicoRepository.js`

Usa:

```js
updateMany({
  where: {
    id,
    fechaActualizacion: null,
  },
  data: { ... }
});
```

### `crearAuditoriasRevisionInicial`

Archivo: `backend/src/repositories/registroMedicoRepository.js`

Crea auditorías por campo modificado.

### Notificaciones

- `backend/src/services/notificacionService.js`
- `backend/src/repositories/notificacionRepository.js`
- Endpoints:
  - `GET /api/notificaciones`
  - `PATCH /api/notificaciones/:id/leida`

## Estados

- Si estaba en `REALIZADO` o `ACTUALIZADO`, vuelve a `VALIDACION_PENDIENTE`.
- La revisión inicial queda bloqueada con `fechaActualizacion`.

## Errores

- `ACTUALIZACION_YA_REALIZADA` → `409`.
- `REVISION_INICIAL_REQUERIDA` → `409`.
- `ROL_INSUFICIENTE` → `403`.

## Tests

- `backend/tests/services/registroMedicoService.test.js`.
- `backend/tests/services/notificacionService.test.js`.
- `backend/tests/routes/registroMedicoRoutes.test.js`.
- `backend/tests/routes/notificacionRoutes.test.js`.

## Punto clave

La actualización única se protege con base de datos mediante `fechaActualizacion` y con verificación de cambios antes de auditar.
