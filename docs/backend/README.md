# Documentación técnica del backend

Esta documentación explica **cómo está implementado el backend** del proyecto Huellas Sin Hogar, de forma didáctica y por módulos o requisitos.

## Alcance

- Solo backend.
- JavaScript y JSX.
- Express.
- PostgreSQL.
- Prisma.
- Zod.
- No TypeScript.
- No se documenta el frontend en estos archivos.

## Arquitectura

El backend sigue una separación por capas:

```text
HTTP request
  → routes
  → middlewares
  → controllers
  → services
  → repositories
  → Prisma / PostgreSQL
```

Archivos relevantes:

- `backend/src/app.js`: configuración de Express.
- `backend/src/server.js`: arranque del servidor.
- `backend/src/routes`: definición de rutas.
- `backend/src/middlewares`: autenticación, autorización, validación y captura de errores.
- `backend/src/controllers`: recepción y composición de la respuesta HTTP.
- `backend/src/services`: reglas de negocio.
- `backend/src/repositories`: acceso a PostgreSQL mediante Prisma.
- `backend/src/entities`: errores de negocio.
- `backend/src/handlers`: respuestas exitosas y manejo central de errores.
- `backend/src/validations`: esquemas Zod.

## Flujo general de una petición

1. Una petición HTTP llega a Express.
2. Las middlewares de validación, autenticación o autorización pueden ejecutar antes.
3. La ruta llama al controlador correspondiente.
4. El controlador delega en el servicio.
5. El servicio aplica reglas de negocio y, cuando corresponde, abre una transacción.
6. El servicio delega en el repositorio.
7. El repositorio usa Prisma y PostgreSQL.
8. El servicio devuelve un resultado.
9. El controlador envía respuesta exitosa con `enviarRespuestaExitosa`.
10. Si ocurre error de validación, autenticación, autorización o negocio, el manejador central lo traduce a HTTP.

## Gestión de errores

- Errores de validación: `ZodError`.
- Errores de autenticación: `AuthError`.
- Errores de negocio: clases propias como `AnimalError` y `RegistroMedicoError`.
- Errores no previstos: manejador central.
- Respuestas exitosas: `{ "message": ..., ...datos }`.

## Patrón de inyección de dependencias

Los servicios usan una estructura de dependencias para poder probarse con objetos falsos:

```js
const DEPENDENCIAS_POR_DEFECTO = { /* ... */ };

export async function servicio(datos, dependencias = DEPENDENCIAS_POR_DEFECTO) { /* ... */ }
```

En pruebas se reemplazan funciones del repositorio o del servicio mediante el segundo parámetro.

## Patrón transaccional

Los flujos médicos y de fichas que requieren atomicidad usan:

```js
import prisma, { ejecutarEnTransaccion } from "../config/prisma.js";

export async function ejecutarEnTransaccion(callback) {
  return prisma.$transaction(callback);
}
```

La transacción se abre dentro del servicio, no en el controlador ni en el repositorio.

## Glosario

- **Ficha**: datos identificativos del animal.
- **Ingreso**: evento de llegada al refugio.
- **Registro médico**: estado médico único del animal.
- **Revisión inicial**: valoración completa inicial del animal.
- **Revisión final**: revisión médica completa que termina el flujo.
- **Actualización veterinaria**: cambios posteriores al estado final o al estado actualizado.
- **Seguimiento**: observación registrada durante una actualización.
- **Actor**: usuario autenticado que ejecuta la acción.
- **Versión**: número de versión del historial médico.
- **Estado previo**: estado del registro antes de una actualización veterinaria.

## Mapa de documentos

- `backend/modulo-animales/r1-registro-ingreso.md`
- `backend/modulo-animales/r2-registro-medico-provisional.md`
- `backend/modulo-animales/r3-revision-inicial.md`
- `backend/modulo-animales/r4-revision-final.md`
- `backend/modulo-animales/r5-actualizacion-unica-revision-inicial.md`
- `backend/modulo-animales/r6-actualizaciones-veterinarias.md`

## Lectura recomendada

Para entender una feature médica o de fichas:

1. Leer el documento del requisito correspondiente.
2. Leer el endpoint en `backend/src/routes`.
3. Leer el controlador.
4. Leer el servicio.
5. Leer el repositorio.
6. Leer las validaciones y entidades.
7. Leer los tests.

## Estado actual

- La base del backend está implementada con Express, Prisma y PostgreSQL.
- El módulo médico y de fichas tiene estados, flujos y tests.
- La documentación de código se mantiene separada de los guías de requisitos.
