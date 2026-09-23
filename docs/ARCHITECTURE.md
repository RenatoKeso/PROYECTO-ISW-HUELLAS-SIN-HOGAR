# Estructura inicial del backend

## Capas principales

- `src/config`: configuracion general y conexiones externas.
- `src/modules`: funcionalidades separadas por dominio del refugio.
- `src/shared`: codigo reutilizable por varios modulos.
- `tests`: pruebas automaticas.

## Modulos iniciales

- `animals`: centraliza el historial de cada animal.
- `shifts`: organiza los turnos de voluntarios.
- `adoptions`: administra postulaciones, decisiones y devoluciones.
- `followups`: registra los controles posteriores a una adopcion.
- `users`: representa al personal y sus permisos.

La estructura es deliberadamente pequena. Cada modulo puede incorporar despues sus rutas, controladores, servicios, repositorios y validaciones cuando se implemente su requisito.

