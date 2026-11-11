# Huellas Sin Hogar

Sistema web de gestión para el refugio de animales **Huellas Sin Hogar**, desarrollado como proyecto del ramo de Ingeniería de Software (Universidad del Bío-Bío).

El sistema reemplaza el registro manual del refugio: centraliza las fichas de los animales y su historial médico, el proceso de adopción completo y la organización de los voluntarios y sus turnos.

## Contenido

- [Módulos](#módulos)
- [Roles](#roles)
- [Tecnologías](#tecnologías)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Instalación local](#instalación-local)
- [Cuentas de prueba](#cuentas-de-prueba)
- [Pruebas automatizadas](#pruebas-automatizadas)
- [API](#api)
- [Problemas comunes](#problemas-comunes)
- [Convenciones del equipo](#convenciones-del-equipo)

## Módulos

| Módulo | Qué permite |
|---|---|
| Registro de animales | Crear la ficha de un animal (con foto) y registrar sus ingresos al refugio. |
| Registro médico | Revisión inicial al ingreso, validación y revisión final de la veterinaria, enfermedades, tratamientos y seguimientos, con historial de cambios. |
| Salud | Alertas sanitarias y plan sanitario por animal: vacunas, tratamientos, controles, desparasitaciones y esterilizaciones. |
| Adopción | Publicar animales, recibir postulaciones del público, visitas, resolución, entrega y seguimientos posteriores. |
| Devoluciones | Registrar la devolución de un animal adoptado y consultar reportes por rango de fechas. |
| Voluntariado | Postulación pública para ser voluntario y revisión por parte de la encargada. |
| Turnos de voluntariado | La encargada publica turnos con cupos; los voluntarios se inscriben, cambian de turno, cancelan y consultan su historial de participación. |
| Notificaciones | Avisos internos entre roles, por ejemplo cuando se actualiza una revisión inicial médica. |

## Roles

Cada cuenta tiene un rol, y el sistema muestra solo los módulos que ese rol puede usar. Los permisos se revisan en el backend (`backend/src/services/permisosUsuario.js`); el frontend tiene una copia (`frontend/src/utils/permisosUsuario.js`) solo para decidir qué enlaces mostrar.

| Rol | Uso principal |
|---|---|
| `DIRECTORA` | Acceso administrativo general: adopciones, devoluciones, alertas, turnos y postulaciones de voluntarios. |
| `ENCARGADA_VOLUNTARIADO` | Revisa postulaciones de voluntarios, publica turnos y registra fichas. |
| `ENCARGADA_ADOPCIONES` | Gestiona adopciones, devoluciones y sus reportes. |
| `VETERINARIA` | Registro médico, validaciones, seguimientos y alertas sanitarias. |
| `VOLUNTARIO` | Registra fichas, consulta el registro médico y se inscribe en turnos. |
| `VOLUNTARIO_CONFIANZA` | Lo mismo que un voluntario, además de la revisión inicial médica y el registro de devoluciones. |

## Tecnologías

- **Frontend:** React 19, Vite y React Router. Validación de formularios con Zod.
- **Backend:** Node.js con Express 4 (módulos ES), validación con Zod y autenticación con JWT (contraseñas con bcrypt).
- **Base de datos:** PostgreSQL con Prisma ORM (migraciones versionadas en `backend/prisma/migrations`).
- **Pruebas:** `node:test` en backend y frontend; Vitest y Testing Library para componentes del frontend.

## Estructura del repositorio

```
backend/
  prisma/        schema.prisma, migraciones y seed con datos de ejemplo
  scripts/       utilidades (crear la primera directora, cuentas de prueba, etc.)
  src/
    routes/        rutas de la API: sesión obligatoria y permiso por rol
    middlewares/   autenticación, autorización, validación con Zod, imágenes
    controllers/   reciben la petición y arman la respuesta
    services/      reglas de negocio
    repositories/  consultas a la base de datos con Prisma
    validations/   esquemas Zod de cada endpoint
    entities/      errores de cada módulo, con su código y estado HTTP
    handlers/      manejo central de errores y respuestas exitosas
  tests/         pruebas por capa (routes, services, repositories, validations)
frontend/
  src/
    pages/         una página por ruta
    components/    componentes reutilizables (ui/) y por módulo
    services/      llamadas a la API; todas pasan por services/api.js
    validations/   esquemas Zod de los formularios
    hooks/ utils/ styles/
  tests/
```

Una petición recorre siempre el mismo camino: **ruta → middlewares → controlador → servicio → repositorio**. Los errores se lanzan como errores del módulo y `manejadorErrores` los convierte en una respuesta con `message` y `code`.

## Instalación local

### Requisitos

- Node.js 20.19 o superior (se recomienda la versión LTS actual)
- PostgreSQL 16 o superior
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/RenatoKeso/PROYECTO-ISW-HUELLAS-SIN-HOGAR.git
cd PROYECTO-ISW-HUELLAS-SIN-HOGAR
```

### 2. Crear la base de datos

Con PostgreSQL corriendo (en `psql` o pgAdmin):

```sql
CREATE DATABASE huellas_sin_hogar;
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env        # en Windows (cmd): copy .env.example .env
```

Editar `backend/.env`:

| Variable | Qué es |
|---|---|
| `PORT` | Puerto de la API. Por defecto `3000`. |
| `CORS_ORIGIN` | Dirección del frontend. En local, `http://localhost:5173`. |
| `DATABASE_URL` | Conexión a PostgreSQL. Cambiar `cambiame` por la contraseña local de `postgres`. |
| `JWT_SECRET` | Clave para firmar las sesiones. **Obligatoria, de al menos 32 bytes aleatorios.** Sin ella el login responde error 500. |
| `JWT_EXPIRES_IN` | Duración de la sesión, por ejemplo `1d`. |

Para generar un `JWT_SECRET` y agregarlo al `.env` en un solo paso:

```bash
node -e "require('fs').appendFileSync('.env', '\nJWT_SECRET=' + require('crypto').randomBytes(48).toString('base64') + '\n')"
```

Si el `.env` ya tenía una línea `JWT_SECRET`, borrar la antigua para que quede solo una.

Luego crear las tablas, cargar los datos de ejemplo y levantar la API:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

La API queda en `http://localhost:3000`. Para comprobar que responde, abrir `http://localhost:3000/health`.

> **Ojo:** `npx prisma db seed` **borra todos los datos** antes de cargar los de ejemplo. Úsalo para partir de cero, no sobre una base con datos reales.

### 4. Frontend

En otra terminal, con el backend corriendo:

```bash
cd frontend
npm install
cp .env.example .env        # en Windows (cmd): copy .env.example .env
npm run dev
```

El `.env` del frontend tiene una sola variable, `VITE_API_URL=http://localhost:3000/api`. Vite la lee solo al arrancar: si se cambia, hay que reiniciar `npm run dev`.

La aplicación queda en `http://localhost:5173`.

### Después de cada `git pull`

Si llegaron cambios de otros integrantes, en cada carpeta que cambió:

```bash
npm install                  # si cambió package.json
npx prisma migrate deploy    # (backend) si llegaron migraciones nuevas
npx prisma generate          # (backend) si cambió schema.prisma
```

## Cuentas de prueba

El seed crea estas cuentas. Todas usan la contraseña **`refugio2026`**.

| Correo | Rol |
|---|---|
| `directora@refugio.cl` | Directora |
| `encargada@refugio.cl` | Encargada de voluntariado |
| `veterinaria@refugio.cl` | Veterinaria |
| `voluntario@refugio.cl` | Voluntario (vinculado a un voluntario: puede inscribirse en turnos) |
| `voluntaria@refugio.cl` | Voluntaria (vinculada a un voluntario: puede inscribirse en turnos) |

Para tener una cuenta de **cada** rol, incluidos encargada de adopciones y voluntario de confianza, existe un script que crea cuentas con contraseñas aleatorias y las muestra en pantalla una sola vez:

```bash
cd backend
node scripts/crearCuentasPrueba.js          # crea las que falten
node scripts/crearCuentasPrueba.js --reset  # regenera las contraseñas
```

Estas contraseñas son solo para desarrollo. En producción se usan contraseñas propias.

## Pruebas automatizadas

```bash
cd backend
npm test

cd frontend
npm test
```

El backend se prueba por capas: validaciones (Zod), servicios con dependencias simuladas, repositorios con un cliente de Prisma falso y rutas con un servidor Express de prueba. No necesitan una base de datos corriendo.

## API

Todas las rutas cuelgan de `/api`. Salvo las públicas, requieren el encabezado `Authorization: Bearer <token>` que entrega el login.

| Prefijo | Contenido |
|---|---|
| `/api/auth` | `POST /login`, `GET /me`, `POST /logout` |
| `/api/fichas`, `/api/animales/ingresos` | Fichas de animales, imagen e ingresos |
| `/api/registros-medicos` | Registro médico, validación, actualizaciones, historial y seguimientos |
| `/api/salud` | Alertas sanitarias y plan sanitario |
| `/api/adopciones` | Animales publicados (público), postulaciones (público) y su gestión |
| `/api/devoluciones`, `/api/reportes/devoluciones` | Devoluciones y reportes |
| `/api/postulaciones-voluntario` | Postular como voluntario (público) y revisión |
| `/api/turnos` | Publicar turnos, listarlos para gestión y ver los disponibles |
| `/api/inscripciones` | Inscribirse, mis inscripciones, historial, cambiar de turno y cancelar |
| `/api/notificaciones` | Notificaciones del usuario |
| `/api/voluntarios` | Listado de voluntarios activos |

### Turnos e inscripciones

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `POST /api/turnos` | Directora, encargada de voluntariado | Publica un turno: título, descripción opcional, fecha, hora de inicio y término, fecha límite de inscripción y cupo máximo. |
| `GET /api/turnos/gestion` | Directora, encargada de voluntariado | Todos los turnos, con inscritos y cupos. |
| `GET /api/turnos` | Las anteriores y voluntarios | Turnos publicados que aún no comienzan. |
| `POST /api/inscripciones` | Voluntarios | Se inscribe en un turno: `{ "turnoId": 1 }`. |
| `GET /api/inscripciones/mias?estado=ACTIVA` | Voluntarios | Sus inscripciones, con filtro opcional `ACTIVA` o `CANCELADA`. |
| `GET /api/inscripciones/:id/historial` | Voluntarios | Historial de una inscripción propia. |
| `PATCH /api/inscripciones/:id` | Voluntarios | Cambia la inscripción a otro turno: `{ "turnoId": 2 }`. |
| `PATCH /api/inscripciones/:id/cancelacion` | Voluntarios | Cancela una inscripción propia. |

Reglas principales: un voluntario solo se inscribe si el turno está publicado, no ha comenzado, el plazo sigue vigente, quedan cupos y no se solapa con otra inscripción activa suya. Cupo, inscripción e historial se guardan en una misma transacción; las inscripciones nunca se borran, solo se cancelan.

Las fechas y horas se guardan en UTC. La encargada las ingresa en hora de Chile y el backend las convierte considerando el cambio de horario (`backend/src/services/horarioChile.js`).

## Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| Login responde **500** y la consola del backend dice `Configura JWT_SECRET con al menos 32 bytes aleatorios` | Falta `JWT_SECRET` en `backend/.env` o es muy corto. Generarlo con el comando de la sección del backend y reiniciar `npm run dev`. |
| Login responde **404** desde el frontend | Falta `frontend/.env`. Copiarlo desde `.env.example` y reiniciar `npm run dev` del frontend. |
| `npm run dev` del frontend: `Cannot find package 'vitest'` | Llegaron dependencias nuevas. Correr `npm install` en `frontend/`. |
| Errores de Prisma sobre tablas o columnas inexistentes | Faltan migraciones. Correr `npx prisma migrate deploy` y `npx prisma generate` en `backend/`. |
| `Can't reach database server` | PostgreSQL no está corriendo, o la contraseña de `DATABASE_URL` no es la correcta. pgAdmin no necesita estar abierto. |
| En Windows fallan 5 tests de `imagenAnimalService` | Los tests comparan rutas armadas con `/` y Windows usa `\`. No afecta el funcionamiento; en Linux y macOS pasan. |
| Git avisa `CRLF will be replaced by LF` | Es normal en Windows: el repositorio guarda los archivos con fin de línea LF (`.gitattributes`). |

## Convenciones del equipo

- Cada integrante trabaja en su rama y abre pull requests hacia `dev`. Nunca directo a `main`.
- Los archivos `.env` no se suben al repositorio; `.env.example` es la plantilla.
- Cada endpoint valida en tres capas: la forma de los datos con Zod en la ruta, las reglas de negocio en el servicio y las restricciones de la base de datos.
- Todo cambio de base de datos va con su migración de Prisma; no se edita la base a mano.
