# API de fichas e ingresos de animales

Endpoints del modulo de animales. La base es `/api` y la respuesta siempre tiene la
forma `{ "message": ... }` mas los datos del caso.

| Metodo | Ruta | Que hace |
| --- | --- | --- |
| `POST` | `/api/fichas` | Crea una ficha suelta, sin evento de ingreso. |
| `PATCH` | `/api/fichas/:id` | Actualiza datos de una ficha existente. |
| `POST` | `/api/animales/ingresos` | Crea una ficha con su primer ingreso, o registra un reingreso. |

## Crear una ficha

`POST /api/fichas` crea la ficha con el identificador publico `anim-###` y la deja en
estado `ACTIVO`, sin registrar ningun ingreso. Sirve para dar de alta un animal antes de
que entre al refugio.

```json
{
  "nombre": "Roco",
  "sexoAnimal": "MACHO",
  "especie": "PERRO",
  "raza": "Mestizo",
  "edad": 3,
  "observaciones": "Ficha creada desde el endpoint"
}
```

Respuesta `201`:

```json
{
  "message": "Ficha creada correctamente",
  "id": 21,
  "codigoAnimal": "anim-006",
  "estadoEstadia": "ACTIVO"
}
```

| Campo | Regla |
| --- | --- |
| `sexoAnimal` | Obligatorio. `MACHO`, `HEMBRA`, `DESCONOCIDO`. |
| `especie` | Obligatorio. `PERRO`, `GATO`, `OTRO`. |
| `nombre` | Opcional. Maximo 255 caracteres. |
| `raza` | Opcional. Maximo 255 caracteres. |
| `edad` | Opcional. Entero mayor o igual a cero. |
| `observaciones` | Opcional. Maximo 255 caracteres. |

`estadoEstadia`, `codigoAnimal` e `id` no se aceptan en la peticion: los define el
servidor. Enviar cualquiera de ellos responde `400`.

## Actualizar una ficha

`PATCH /api/fichas/:id` modifica los datos de una ficha existente. Se envian solo los
campos a cambiar, el resto queda igual. Es el endpoint para cambiar el estado de estadia
(por ejemplo a `ADOPTADO` cuando cierra una adopcion).

```json
{
  "estadoEstadia": "ESPERA_ADOPCION",
  "nombre": "Roco actualizado",
  "observaciones": "Listo para adopcion"
}
```

Respuesta `200`:

```json
{
  "message": "Ficha actualizada correctamente",
  "id": 21,
  "codigoAnimal": "anim-006",
  "estadoEstadia": "ESPERA_ADOPCION"
}
```

| Campo | Regla |
| --- | --- |
| `nombre` | Opcional. Maximo 255 caracteres. |
| `sexoAnimal` | Opcional. `MACHO`, `HEMBRA`, `DESCONOCIDO`. |
| `especie` | Opcional. `PERRO`, `GATO`, `OTRO`. |
| `raza` | Opcional. Maximo 255 caracteres. |
| `edad` | Opcional. Entero mayor o igual a cero. |
| `estadoEstadia` | Opcional. `ACTIVO`, `ADOPTADO`, `ESPERA_ADOPCION`, `EGRESADO`, `FALLECIDO`, `TRANSFERIDO`. |
| `observaciones` | Opcional. Maximo 255 caracteres. |

Reglas de la ruta y del cuerpo:

- El `id` va en la ruta y debe ser un numero positivo: `PATCH /api/fichas/abc` responde `400`.
- El cuerpo debe traer al menos un campo: un cuerpo vacio responde `400`.
- `codigoAnimal` e `id` no se pueden modificar: responder `400`.
- Si el `id` no corresponde a ninguna ficha, responde `404 FICHA_INEXISTENTE`.

## Registrar un ingreso

`POST /api/animales/ingresos` resuelve los dos casos con el mismo esquema. El servicio
decide segun la presencia de `codigoAnimal`, que es lo unico que cambia entre ambos.

### Cuando es un ingreso inicial

No se envia `codigoAnimal`. El servicio genera el identificador publico con el formato
`anim-001`, crea la ficha en estado `ACTIVO` y registra el primer evento de su historial.

```json
{
  "nombre": "Nube",
  "sexoAnimal": "HEMBRA",
  "especie": "GATO",
  "raza": "Domestica",
  "edad": 2,
  "observaciones": "Rescatada en el parque",
  "receptorId": 6,
  "fechaIngreso": "2026-09-29T10:00:00-03:00",
  "procedencia": "Hallazgo en via publica",
  "ubicacionEncontrado": "Parque Central",
  "estadoSalud": "Desparasitada"
}
```

Respuesta `201`:

```json
{
  "message": "Ingreso registrado correctamente",
  "codigoAnimal": "anim-005",
  "reingreso": false
}
```

### Cuando es un reingreso por devolucion

Se envia `codigoAnimal` con el codigo de la ficha existente y **ningun dato de la ficha**.
La procedencia sigue siendo texto libre y describe de donde vuelve el animal.

```json
{
  "codigoAnimal": "anim-001",
  "receptorId": 7,
  "fechaIngreso": "2026-09-29T15:00:00-03:00",
  "procedencia": "Devuelto por la familia Vega",
  "estadoSalud": "En observacion"
}
```

Respuesta `200`:

```json
{
  "message": "Reingreso registrado correctamente",
  "codigoAnimal": "anim-001",
  "reingreso": true
}
```

El reingreso no crea una ficha nueva: agrega un evento al historial de la ficha existente.

## Campos del ingreso

| Campo | Ingreso inicial | Reingreso | Regla |
| --- | --- | --- | --- |
| `codigoAnimal` | no | si | Formato `anim-###`. Su presencia define el flujo. |
| `nombre` | opcional | no | Maximo 255 caracteres. |
| `sexoAnimal` | obligatorio | no | `MACHO`, `HEMBRA`, `DESCONOCIDO`. |
| `especie` | obligatorio | no | `PERRO`, `GATO`, `OTRO`. |
| `raza` | opcional | no | Maximo 255 caracteres. |
| `edad` | opcional | no | Entero mayor o igual a cero. |
| `observaciones` | opcional | no | Maximo 255 caracteres. |
| `receptorId` | obligatorio | si | Id de un voluntario. |
| `fechaIngreso` | obligatorio | si | ISO 8601 con zona horaria. |
| `procedencia` | obligatorio | si | Texto libre no vacio. |
| `ubicacionEncontrado` | opcional | si | Maximo 255 caracteres. |
| `estadoSalud` | opcional | si | Maximo 255 caracteres. |

El estado de estadia no se envia: la API siempre crea la ficha en `ACTIVO`.

## Errores

| Estado | `code` | Cuando |
| --- | --- | --- |
| `400` | `DATOS_INVALIDOS` | Faltan campos, hay campos desconocidos o un valor no permitido. Incluye `detalles` con `campo` y `mensaje`. |
| `400` | `PROCEDENCIA_INVALIDA` | La procedencia llego vacia o solo con espacios. |
| `400` | `REFERENCIA_FICHA_AUSENTE` | Se pidio un reingreso sin una referencia utilizable. |
| `404` | `FICHA_INEXISTENTE` | No hay ficha con ese `codigoAnimal` o con ese `id` de ruta. |
| `409` | `CONFLICTO_IDENTIFICADOR` | El identificador generado ya estaba asignado. |
| `404` | `RUTA_NO_ENCONTRADA` | La ruta y el metodo no existen. |
| `500` | `ERROR_INTERNO` | Fallo no previsto. El detalle solo queda en el log del servidor. |

Ejemplo de error de validacion:

```json
{
  "message": "Los datos enviados no son validos",
  "code": "DATOS_INVALIDOS",
  "detalles": [{ "campo": "especie", "mensaje": "La especie seleccionada no es valida" }]
}
```
