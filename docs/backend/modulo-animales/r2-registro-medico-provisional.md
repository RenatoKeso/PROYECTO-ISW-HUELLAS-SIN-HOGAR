# Backend — Requisito r2: Registro médico provisional

## Propósito

Este documento explica cómo el backend crea el **registro médico provisional** automáticamente cuando se registra un ingreso.

Requisito:

> El sistema deberá crear automáticamente un registro médico provisional, único por animal, al registrarse su ingreso.

## Responsabilidad en el backend

El registro médico provisional no tiene endpoint propio.

Se crea dentro de `registrarIngresoInicial`, en el mismo flujo que crea ficha e ingreso.

## Flujo

1. El usuario envía un ingreso inicial a `POST /api/animales/ingresos`.
2. El servicio decide que es ingreso inicial.
3. El servicio crea la ficha.
4. El servicio crea el ingreso.
5. El servicio llama a `crearRegistroMedicoParaIngreso`.
6. El servicio crea el registro médico en estado `PROVISIONAL`.
7. La respuesta incluye `registroMedico`.

## Funciones backend

### `crearRegistroMedicoParaIngreso`

Archivo: `backend/src/services/registroMedicoService.js`

Entrada:

```json
{
  "animalId": 10,
  "ingresoAnimalId": 99
}
```

### `crearRegistroMedico`

Archivo: `backend/src/repositories/registroMedicoRepository.js`

Hace:

```js
return cliente.registroMedicoAnimal.create({ data });
```

### Estado inicial

```json
{
  "estadoValidacion": "PROVISIONAL"
}
```

## Modelo

`RegistroMedicoAnimal`:

- `id`
- `animalId`
- `ingresoAnimalId`
- `estadoValidacion`
- `estadoPrevioRevision`
- `createdAt`
- Campos de revisión inicial:
  - `pesoKg`
  - `clasificacionSalud`
  - `observacionInicial`
  - `requiereCuarentena`
  - `fechaRevisionInicial`
  - `revisionInicialPorId`

## Relación única

El esquema usa:

```prisma
model RegistroMedicoAnimal {
  animalId Int @unique
}
```

Por eso solo un animal puede tener un registro médico.

## Respuesta

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

## Error de negocio

Si el animal ya tiene registro médico:

```json
{
  "message": "El animal con id X ya tiene un registro médico",
  "code": "REGISTRO_MEDICO_DUPLICADO",
  "animalId": 10
}
```

HTTP esperado:

- `409`.

## Tests

- `backend/tests/services/registroMedicoService.test.js`
- `backend/tests/services/animalService.test.js`
- `backend/tests/routes/animalRoutes.test.js`
- `backend/tests/routes/registroMedicoRoutes.test.js`

## Punto clave

El backend no expone un endpoint manual para crear el registro médico. La creación automática está ligada al ingreso y está dentro de la misma transacción que crea ficha e ingreso.
