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
