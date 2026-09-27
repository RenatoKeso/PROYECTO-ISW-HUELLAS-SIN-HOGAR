# Huellas Sin Hogar

Sistema de gestion para el refugio de animales Huellas Sin Hogar, desarrollado
como proyecto del ramo de Ingenieria de Software.

## Descripcion

Aplicacion web que permite al refugio administrar la informacion de los animales
a su cuidado y gestionar los procesos de adopcion.

## Tecnologias

- **Frontend:** React con Vite
- **Backend:** Node.js con Express
- **Base de datos:** PostgreSQL con Prisma

## Estructura

- `backend/`: API REST en JavaScript con Express.
- `frontend/`: aplicacion web en React.
- `docs/`: documentacion de la arquitectura.

## Requisitos

- Node.js LTS
- PostgreSQL 16 o superior

## Instalacion

Clonar el repositorio:

```bash
git clone https://github.com/RenatoKeso/PROYECTO-ISW-HUELLAS-SIN-HOGAR.git
cd PROYECTO-ISW-HUELLAS-SIN-HOGAR
```

Crear la base de datos:

```sql
CREATE DATABASE huellas_sin_hogar;
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

Antes de levantar el servidor, editar el `.env` con la contraseña local de
PostgreSQL. El archivo `.env` no se versiona; `.env.example` sirve de plantilla.

La API queda disponible en `http://localhost:3000`. Para verificar que responde,
consultar `http://localhost:3000/health`.

### Frontend

En otra terminal, con el backend ya corriendo:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

La aplicacion queda disponible en `http://localhost:5173`.

## Notas

- El backend debe levantarse antes que el frontend.
- Cada vez que cambie `prisma/schema.prisma`, correr `npx prisma generate`.
- Toda llamada al backend pasa por `frontend/src/services/api.js`.
