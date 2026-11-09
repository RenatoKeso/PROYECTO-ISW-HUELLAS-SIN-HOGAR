# Backend — Requisito r6: Actualizaciones veterinarias, historial y seguimientos

## Propósito

Este documento explica cómo el backend implementa las actualizaciones veterinarias con historial y seguimientos.

Requisito:

> La médica veterinaria podrá actualizar el registro médico las veces que sea necesario, incluyendo revisión inicial, y cada actualización generará una nueva versión en el historial.

## Endpoints

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/api/registros-medicos/:id/actualizaciones/inicio` | Inicia actualización. |
| `POST` | `/api/registros-medicos/:id/actualizaciones` | Guarda actualización. |
| `POST` | `/api/registros-medicos/:id/actualizaciones/cancelar` | Cancela actualización. |
| `GET` | `/api/registros-medicos/:id/historial` | Lista historial. |
| `GET` | `/api/registros-medicos/:id/seguimientos` | Lista seguimientos. |

## Flujo de inicio

1. Validar `id`.
2. Verificar permiso:
   - `puedeActualizarRegistroMedico`.
3. Abrir transacción.
4. Obtener registro.
5. Permitir estados:
   - `REALIZADO`.
   - `ACTUALIZADO`.
6. Guardar `estadoPrevioRevision`.
7. Cambiar a `REVISANDO`.

## Flujo de guardado

1. Validar body con `actualizacionVeterinariaSchema`.
2. Obtener registro en estado `REVISANDO`.
3. Validar seguimientos.
4. Bloquear y cambiar a `ACTUALIZADO`.
5. Crear seguimientos de enfermedad y tratamiento.
6. Crear seguimiento médico.
7. Crear versión en historial.
8. Sincronizar `RevisionCompleta`.
9. Crear nuevas atenciones sanitarias.
10. Devolver versión, historial y seguimiento.

## Funciones backend

### `iniciarActualizacionRegistro`

- Inicia edición.

### `actualizarRegistro`

- Guarda cambios y versiona.

### `cancelarActualizacionRegistro`

- Cancela y restaura estado previo.

### `listarHistorialRegistroMedico`

- Lista versiones del historial.

### `listarSeguimientosRegistroMedico`

- Lista seguimientos.

## Validaciones

- `actualizacionVeterinariaSchema`.
- `registroMedicoIdParamSchema`.
- Esquemas para enfermedades, tratamientos y seguimientos.

## Estados

- `REALIZADO` o `ACTUALIZADO` → `REVISANDO`.
- `REVISANDO` → `ACTUALIZADO` al guardar.

## Errores

- `SEGUIMIENTO_INVALIDO` → `400`.
- `ESTADO_INVALIDO` → `409`.
- `REGISTRO_MEDICO_INEXISTENTE` → `404`.

## Tests

- `backend/tests/services/registroMedicoService.test.js`.
- `backend/tests/routes/registroMedicoRoutes.test.js`.
- `backend/tests/validations/registroMedicoValidation.test.js`.

## Punto clave

Cada guardado genera una nueva versión en `HistorialRegistroMedico`, sin sobrescribir versiones anteriores.
