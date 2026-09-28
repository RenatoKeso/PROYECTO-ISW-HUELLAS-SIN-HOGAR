# AGENTS.md

## Alcance

Estas instrucciones aplican a todo el proyecto Huellas Sin Hogar.

## Stack obligatorio

- Usar JavaScript y JSX. No introducir TypeScript sin autorización explícita del usuario.
- Usar Express para el backend.
- Usar React con Vite para el frontend.
- Usar PostgreSQL como base de datos.
- Usar Prisma para el ORM, el cliente y las migraciones.
- Usar Zod para validar datos en el frontend y el backend.
- No sustituir estas tecnologías por otras sin autorización explícita del usuario.

## Organización

- En el backend, mantener la separación entre rutas, middlewares, controladores, servicios, repositorios, entidades y handlers.
- Mantener el acceso a PostgreSQL en los repositorios mediante Prisma.
- En el frontend, mantener páginas, componentes, layouts, rutas, servicios, estilos, hooks, utilidades y contextos en sus directorios establecidos.
- Validar con Zod todo dato que cruce una frontera de confianza, especialmente entradas HTTP y formularios.
- Validar también en el backend los datos enviados por el frontend.

## Skill del proyecto

- Cargar la skill `project-stack` al diseñar, implementar o revisar cambios que afecten el stack o la arquitectura.

## Documentación actualizada

- Usar Context7 al responder consultas sobre el código existente o al generar código crítico.
- Antes de implementar código crítico, contrastar las APIs y herramientas utilizadas con la documentación oficial más reciente disponible mediante Context7.
- No depender únicamente del conocimiento previo del modelo para decisiones que puedan afectar seguridad, datos, producción o compatibilidad.
