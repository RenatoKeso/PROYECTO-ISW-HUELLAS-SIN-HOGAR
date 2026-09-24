---
name: project-stack
description: Usa esta skill al diseñar, implementar o revisar cambios del proyecto Huellas Sin Hogar para mantener JavaScript, Express, React con Vite, PostgreSQL, Prisma y Zod.
---

# Stack del proyecto

## Tecnologías obligatorias

- Escribir todo el código nuevo en JavaScript. Usar JSX para componentes React.
- No introducir TypeScript ni pragma de TypeScript sin una decisión explícita del usuario.
- Implementar el backend con Express.
- Implementar el frontend con React y Vite.
- Usar PostgreSQL como base de datos.
- Usar Prisma como ORM y herramienta de migraciones.
- Usar Zod para validar datos en el frontend y el backend.
- No sustituir estas tecnologías por otras sin una decisión explícita del usuario.

## Backend

- Mantener la separación entre `routes`, `middlewares`, `controllers`, `services`, `repositories`, `entities` y `handlers`.
- Definir rutas en `routes` y aplicar controles previos mediante `middlewares`.
- Mantener las reglas de negocio en `services`.
- Centralizar el acceso a PostgreSQL en `repositories` mediante Prisma.
- Mantener `app.js` para configurar Express y `server.js` para iniciar el proceso.
- Exportar la aplicación para poder probarla sin iniciar el servidor.

## Frontend

- Mantener React y Vite como tecnologías de interfaz y compilación.
- Organizar pantallas en `pages`, componentes reutilizables en `components` y estructuras compartidas en `layouts`.
- Mantener navegación en `routes` y estilos globales en `styles`.
- Centralizar la comunicación HTTP en `api` o `services` según la responsabilidad de la aplicación.
- Mantener hooks reutilizables en `hooks`, utilidades en `utils` y estado compartido en `context`.
- No acceder directamente a la base de datos desde el frontend.

## PostgreSQL y Prisma

- Definir modelos, relaciones y generadores mediante `schema.prisma`.
- Crear y aplicar cambios de base de datos con migraciones de Prisma.
- Usar una única instancia compartida del cliente Prisma en el backend.
- No realizar operaciones de base de datos desde controladores, rutas o componentes de React.
- Respetar las restricciones, relaciones y decisiones definidas en el esquema Prisma.
- No introducir otro ORM o motor de persistencia sin autorización explícita.

## Validación con Zod

- Definir esquemas Zod reutilizables para validar entradas del backend, datos de formularios y respuestas externas.
- Validar todo dato que cruce una frontera de confianza, especialmente cuerpos, parámetros y cabeceras HTTP.
- Validar también en el backend aunque el frontend ya realize validación.
- Devolver mensajes de validación claros y no persistir datos que no hayan sido validados.
- Evitar duplicar esquemas equivalentes; reutilizarlos cuando la arquitectura del proyecto lo permita.
- No combinar la validación con acceso a base de datos dentro del mismo esquema.

## Verificación

- Leer los scripts disponibles en `frontend/package.json` y `backend/package.json` antes de ejecutar verificaciones.
- Ejecutar las pruebas, compilaciones, lint y validaciones aplicables después de modificar código.
- No asumir que existe un comando de verificación si no está declarado en el proyecto.
- Mantener las dependencias y configuraciones necesarias coherentes con el stack obligatorio.
