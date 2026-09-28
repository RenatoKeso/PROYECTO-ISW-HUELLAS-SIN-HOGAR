# Huellas Sin Hogar

Sistema de gestion para el refugio de animales Huellas Sin Hogar, desarrollado
como proyecto del ramo de Ingenieria de Software.

## Descripcion

Aplicacion web que permite al refugio administrar la informacion de los animales
a su cuidado, registrar sus ingresos y gestionar los procesos de adopcion.

Esta version implementa el modulo de fichas e ingresos de animales, con el flujo
completo de frontend, backend y base de datos.

## Tecnologias

- **Frontend:** React 19 con Vite, React Router y validacion con Zod
- **Backend:** Node.js con Express, en modulos ESM
- **Base de datos:** PostgreSQL con Prisma como ORM

## Estructura del proyecto

```
backend/
  prisma/
    schema.prisma        modelo de datos
    migrations/          historial de cambios de la base
    seed.js              datos de prueba
  src/
    config/              conexion a la base de datos
    controllers/         reciben la peticion y arman la respuesta
    entities/            errores propios del dominio
    handlers/            manejo centralizado de errores y respuestas
    middlewares/         validacion de esquemas y captura de errores
    repositories/        acceso a la base de datos
    routes/              definicion de endpoints
    services/            reglas de negocio
    validations/         esquemas de Zod
  tests/                 pruebas unitarias

frontend/
  src/
    components/ui/       elementos reutilizables
    hooks/               logica reutilizable de React
    pages/               pantallas completas
    services/            comunicacion con el backend
    validations/         esquemas de Zod del formulario

docs/                    documentacion de arquitectura y API
```

## Requisitos previos

- Node.js LTS (version 20 o superior)
- PostgreSQL 16 o superior
- Git

## Instalacion

### 1. Clonar el repositorio

```bash
git clone https://github.com/RenatoKeso/PROYECTO-ISW-HUELLAS-SIN-HOGAR.git
cd PROYECTO-ISW-HUELLAS-SIN-HOGAR
```

### 2. Crear la base de datos

Desde pgAdmin, o desde la terminal con `psql -U postgres`:

```sql
CREATE DATABASE huellas_sin_hogar;
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Editar el `.env` y reemplazar `cambiame` por la contrasena del usuario
`postgres` **de esta maquina**:

```
DATABASE_URL="postgresql://postgres:TU_CONTRASENA@localhost:5432/huellas_sin_hogar?schema=public"
```

Crear las tablas y cargar los datos de prueba:

```bash
npx prisma migrate dev
npx prisma db seed
```

El seed es obligatorio: sin el, la tabla de voluntarios queda vacia y el
formulario de ingreso no tiene receptores que seleccionar.

Levantar el servidor:

```bash
npm run dev
```

La API queda en `http://localhost:3000`. Para verificar que responde:
`http://localhost:3000/health`

### 4. Frontend

En otra terminal, con el backend ya corriendo:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

La aplicacion queda en `http://localhost:5173`.

## Endpoints disponibles

La base es `/api` y toda respuesta incluye un campo `message`.

| Metodo | Ruta | Que hace |
| --- | --- | --- |
| `GET` | `/health` | Verifica que el servidor responde. |
| `POST` | `/api/fichas` | Crea la ficha de un animal. |
| `PATCH` | `/api/fichas/:id` | Actualiza una ficha existente. |
| `POST` | `/api/animales/ingresos` | Registra un ingreso o reingreso. |
| `GET` | `/api/voluntarios` | Lista los voluntarios activos. |

El detalle de cada endpoint, con ejemplos de peticion y respuesta, esta en
`docs/API_FICHAS_INGRESOS.md`.

## Como probar el flujo completo

1. Entrar a `http://localhost:5173` y abrir "Registro".
2. Completar el formulario de ficha. Sexo y especie son obligatorios.
3. Al guardar, el sistema devuelve el codigo generado (por ejemplo `anim-004`).
4. Copiar ese codigo en el formulario de ingreso, elegir un receptor de la
   lista, indicar fecha y procedencia, y guardar.
5. Para ver los datos en la base: `npx prisma studio` desde `backend`.

## Comandos utiles

Desde `backend/`:

```bash
npm run dev              # servidor con recarga automatica
npm start                # servidor sin recarga
npm test                 # pruebas unitarias
npx prisma studio        # interfaz para ver y editar la base
npx prisma migrate dev   # aplica cambios del schema a la base
npx prisma generate      # regenera el cliente de Prisma
npx prisma db seed       # carga los datos de prueba
npx prisma migrate reset # borra la base, la recrea y corre el seed
```

Desde `frontend/`:

```bash
npm run dev              # servidor de desarrollo
npm run build            # compila para produccion
npm run lint             # revisa el codigo con ESLint
```

## Variables de entorno

Los archivos `.env` no se versionan porque contienen contrasenas propias de cada
maquina. Cada integrante crea el suyo copiando el `.env.example` correspondiente.

**backend/.env**

| Variable | Para que sirve |
| --- | --- |
| `PORT` | Puerto del servidor. Por defecto 3000. |
| `CORS_ORIGIN` | Direccion del frontend autorizada a consumir la API. |
| `DATABASE_URL` | Cadena de conexion a PostgreSQL. |
| `JWT_SECRET` | Reservado para la autenticacion, aun no implementada. |
| `JWT_EXPIRES_IN` | Reservado para la autenticacion, aun no implementada. |

**frontend/.env**

| Variable | Para que sirve |
| --- | --- |
| `VITE_API_URL` | Direccion base de la API. |

Solo las variables que empiezan con `VITE_` quedan disponibles en el frontend:
es una restriccion de Vite para evitar que se filtren secretos al navegador.

Para desplegar en otro servidor basta con cambiar `DATABASE_URL`, `CORS_ORIGIN` y
`VITE_API_URL`. El codigo no se modifica.

## Solucion de problemas frecuentes

**`Environment variable not found: DATABASE_URL`**
Falta crear el `.env` a partir del `.env.example`, o el archivo se creo pero no
se guardo.

**`P1000: Authentication failed against database server`**
La contrasena del `.env` no coincide con la de PostgreSQL de esta maquina. Se
puede cambiar desde pgAdmin con el Query Tool:
`ALTER USER postgres WITH PASSWORD 'nueva_contrasena';`

**`ERR_CONNECTION_REFUSED` en el navegador**
El backend no esta corriendo. Hay que levantarlo antes que el frontend.

**El selector de receptores aparece vacio**
Falta correr `npx prisma db seed`.

**`La ficha indicada no existe` al registrar un ingreso**
El codigo escrito no corresponde a ninguna ficha. Se puede revisar cuales
existen con `npx prisma studio`. Este mensaje tambien aparece cuando el receptor
seleccionado no existe en la base.

**El comando `npm` o `git` no se reconoce**
La terminal estaba abierta antes de instalar el programa. Cerrarla y abrir una
nueva.

## Estado del proyecto

**Implementado**

- Registro de fichas de animales con generacion automatica del codigo unico.
- Registro de ingresos, con vinculacion a ficha existente para reingresos.
- Listado de voluntarios.
- Validacion de datos en frontend y backend con Zod.
- Manejo centralizado de errores.
- Pruebas unitarias de servicios y validaciones del modulo de animales.

**Pendiente**

- Autenticacion y control de acceso por rol.
- Modulos de turnos y voluntariado, adopciones, devoluciones y reportes.
- El campo `procedencia` acepta texto libre; el requisito define cinco
  categorias cerradas.
- El router de salud veterinaria existe pero aun no esta registrado en
  `routes/index.js`, por lo que sus endpoints no responden.

## Flujo de trabajo con Git

- `main`: versiones estables y entregables.
- `dev`: integracion de los modulos.
- Una rama por integrante para el desarrollo de su modulo.

Antes de empezar a trabajar, actualizar la rama personal:

```bash
git checkout dev
git pull
git checkout mi-rama
git merge dev
npm install
```

Los cambios se integran a `dev` mediante pull request.

## Equipo

Grupo 10 - Ingenieria de Software, Universidad del Bio-Bio.
