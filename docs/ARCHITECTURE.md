# Estructura inicial del backend

La organizacion sigue el estilo por capas utilizado en el proyecto de referencia `Backend-Meto`.

## Flujo de una solicitud

1. `routes` recibe la URL solicitada.
2. `middlewares` ejecuta controles previos.
3. `controllers` interpreta la solicitud.
4. `services` aplica las reglas del refugio.
5. `repositories` accede a la base de datos.
6. `entities` representa los datos guardados.
7. `handlers` estandariza la respuesta o el error.

## Dominios previstos

- Animales e historial.
- Turnos y voluntarios.
- Postulaciones y adopciones.
- Seguimientos y devoluciones.
- Usuarios, roles y permisos.

Por ahora las carpetas contienen solo documentacion. Los archivos de cada requisito se agregaran cuando el equipo distribuya el trabajo.

## Modulo de animales

La API de fichas e ingresos esta documentada en `API_FICHAS_INGRESOS.md`: `POST /api/fichas`
crea una ficha suelta y `POST /api/animales/ingresos` resuelve el ingreso inicial y el
reingreso por devolucion. El flujo se decide en `services/animalService.js` a partir de la
presencia de `codigoAnimal` en el cuerpo de la peticion. Los fallos de negocio viajan como
`AnimalError` desde `entities/animalErrors.js` y el manejador central de errores los traduce
a respuestas HTTP.

## Modulo medico (requisito 2)

Cubre los requisitos `r1` a `r6` de `docs/requisitos/requisitos_modulo_animales/requisito2.md`.
El modelo de datos esta en `schema.prisma` y la guia de implementacion, con el orden de
ejecucion paso a paso, en `docs/requisitos/requisitos_modulo_animales/guia_requisito2.md`.

`RegistroMedicoAnimal` es 1:1 con `FichaAnimal` (garantizado por `@unique` sobre `animalId`).
Nace en `PROVISIONAL` cuando se crean la ficha y el ingreso, y avanza por
`VALIDACION_PENDIENTE`, `REVISANDO` y `ACTUALIZADO` hasta `REALIZADO`. De el cuelgan la
`RevisionInicial` (voluntario o veterinaria), la `RevisionCompleta` (solo veterinaria), los
`TratamientoAnimal` y `EnfermedadAnimal`, los `SeguimientoMedicoAnimal` y las
`AtencionVeterinaria`. El paso a `ACTUALIZADO` y a `REALIZADO` queda registrado en
`HistorialRegistroMedico`, y la unica actualizacion que admite la revision inicial queda
auditada campo por campo en `AuditoriaRevisionInicial`.

Los autores se referencian a `Usuario`, no a `Voluntario`, porque es `Usuario` quien tiene el
`RolUsuario` que exigen r2, r3, r4, r5 y r6. El control de acceso se resuelve con funciones
puras de `services/permisosUsuario.js`.

El control sanitario de r3 se guarda en `AtencionSanitaria` y no en un modelo propio: ese
modelo ya existia con los tipos `vacuna`, `desparasitacion` y `esterilizacion` que pide r3, y
alimenta el modulo de alertas sanitarias del frontend. La revision final lo enlaza al
registro medico mediante `AtencionSanitaria.registroMedicoId`, que es nullable.

## Frontend

El directorio `frontend` usa React con Vite. La organizacion de `src` es:

- `pages`: pantallas completas de la aplicacion.
- `components`: piezas visuales que se repiten entre pantallas.
- `components/ui`: elementos basicos como botones, tarjetas y campos.
- `services`: comunicacion con el backend. Toda llamada al API pasa por aqui.
- `hooks`: logica reutilizable de React, nombrada con el prefijo `use`.
- `context`: estado que necesitan varias pantallas al mismo tiempo.
- `utils`: funciones independientes que no dependen de React.

La URL del backend se define en la variable de entorno `VITE_API_URL` y se
consume unicamente desde `services/api.js`. No debe escribirse la direccion
del backend directamente en un componente.
