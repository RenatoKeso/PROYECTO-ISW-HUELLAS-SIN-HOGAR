# Backend — Requisito r1: Registro de ingreso de un animal

## Propósito

Este documento explica cómo el backend implementa el requisito `r1` del módulo de animales:

> El sistema deberá permitir registrar el ingreso de un animal al refugio y permitir su consulta en el historial.

El backend cubre el flujo operativo:

1. Crear ficha.
2. Registrar ingreso inicial.
3. Registrar reingreso por devolución.
4. Consultar historial de ingresos.

## Estado que produce

El requisito `r1` no produce un estado médico; produce:

- `FichaAnimal`.
- `IngresoAnimal`.
- Historial consultable mediante la ficha y sus ingresos.

## Endpoints del requisito

| Método | Ruta | Función | Auth / permiso |
|---|---|---|---|
| `POST` | `/api/fichas` | Crea ficha sin ingreso. | `autenticar` + `puedeGestionarFichas`. |
| `PATCH` | `/api/fichas/:id` | Actualiza ficha. | `autenticar` + `puedeGestionarFichas`. |
| `POST` | `/api/animales/ingresos` | Crea ingreso inicial o reingreso. | `autenticar` + `puedeGestionarFichas`. |
| `GET` | `/api/animales/:id/ingresos` | Consulta historial de ingresos. | `autenticar` + `puedeGestionarFichas`. |

## Modelos involucrados

### `FichaAnimal`

- `id`
- `codigoAnimal`
- `nombre`
- `sexoAnimal`
- `especie`
- `raza`
- `edad`
- `estadoEstadia`
- `estadoAdopcion`
- `observaciones`

### `IngresoAnimal`

- `id`
- `fichaAnimalId`
- `receptorId`
- `fechaIngreso`
- `procedencia`
- `ubicacionEncontrado`
- `estadoSalud`

### `Voluntario`

- Usado como receptor del ingreso.

## Flujo del backend

### 1. Crear ficha

- La ruta valida el body con `fichaCreateSchema`.
- El servicio usa `crearFicha`.
- El repositorio genera `anim-###`.
- La ficha se guarda en estado `ACTIVO`.

### 2. Registrar ingreso inicial

- La ruta valida con `registroIngresoSchema`.
- El servicio separa ficha e ingreso con `separarFichaEIngreso`.
- Si no viene `codigoAnimal`, es ingreso inicial.
- Si viene `codigoAnimal`, es reingreso.

### 3. Registrar reingreso

- El backend busca la ficha por `codigoAnimal`.
- No crea ficha nueva.
- Crea un nuevo `IngresoAnimal`.
- Actualiza la ficha a `ACTIVO`.

### 4. Consultar historial

- Se obtiene la ficha por id.
- Si no existe, se lanza `FICHA_INEXISTENTE`.
- Se listan los ingresos ordenados por fecha y id descendente.
- Se incluye el receptor.

## Funciones backend clave

### `registrarIngreso`

Archivo: `backend/src/services/animalService.js`

Responsable de decidir entre:

- `registrarIngresoInicial`.
- `registrarReingresoPorDevolucion`.

### `registrarIngresoInicial`

- Crea ficha.
- Crea ingreso.
- En el mismo contexto transaccional crea el registro médico provisional del requisito `r2`.

### `registrarReingresoPorDevolucion`

- Busca ficha existente.
- Crea ingreso.
- Actualiza ficha a `ACTIVO`.

### `listarIngresosDeFicha`

- Obtiene ficha.
- Lista ingresos.
- Devuelve `{ ficha, ingresos }`.

### Controlador

`backend/src/controllers/animalController.js`

- `registrarIngreso`.
- `listarIngresos`.

### Repositorios

`backend/src/repositories/fichaAnimalRepository.js` y `backend/src/repositories/ingresoAnimalRepository.js`.

## Validaciones

- `fichaCreateSchema`.
- `fichaAnimalUpdateSchema`.
- `fichaIdParamSchema`.
- `ingresoAnimalCreateSchema`.
- `registroIngresoSchema`.
- `separarFichaEIngreso`.

## Errores

| Código | HTTP | Origen |
|---|---:|---|
| `PROCEDENCIA_INVALIDA` | `400` | Ingreso inicial sin procedencia. |
| `REFERENCIA_FICHA_AUSENTE` | `400` | Reingreso sin `codigoAnimal` válido. |
| `FICHA_INEXISTENTE` | `404` | Ficha no encontrada. |
| `CONFLICTO_IDENTIFICADOR` | `409` | Código de animal repetido. |
| `FALLO_GUARDADO_FICHA` | `500` | Fallo al guardar ficha e ingreso. |

## Tests

- `backend/tests/services/animalService.test.js`
- `backend/tests/routes/animalRoutes.test.js`
- `backend/tests/validations/animalValidations.test.js`
- `backend/tests/validations/registroIngresoValidation.test.js`
- `backend/tests/routes/accesoModulosRoutes.test.js`

## Ejemplo de respuesta

Ingreso inicial:

```json
{
  "message": "Ingreso registrado correctamente",
  "codigoAnimal": "anim-010",
  "reingreso": false,
  "registroMedico": {
    "id": 500,
    "estadoValidacion": "PROVISIONAL",
    "createdAt": "2026-11-03T10:00:00.000Z"
  }
}
```

Historial:

```json
{
  "message": "Historial de ingresos obtenido correctamente",
  "ficha": {
    "id": 10,
    "codigoAnimal": "anim-010",
    "nombre": "Firulais"
  },
  "ingresos": []
}
```

## Frontend

Fuera del alcance de este documento. La UI de ficha e historial corresponde al frontend.
