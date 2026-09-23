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
