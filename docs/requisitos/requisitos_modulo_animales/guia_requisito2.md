- fecha : 14/10
# Guía general — Requisito 2 (Registro médico del animal)

> Requisitos de origen: `r1`–`r6` en `docs/requisitos/requisitos_modulo_animales/requisito2.md`
> Rama de implementación: `Cristopher`. **Requiere merge de `origin/dev`** (ver sección 3).
> Patrón de capas: `docs/ARCHITECTURE.md` (routes → middlewares → controllers → services → repositories → entities → handlers)

---

## 1. Propósito y alcance

Esta guía es el **orquestador** del requisito 2. Define el orden de ejecución, las dependencias entre requisitos, el diseño de datos compartido, la máquina de estados del registro médico y los bloqueos conocidos.

**Qué cubre:** la creación automática del registro médico provisional (r1), la revisión inicial (r2), la revisión final veterinaria (r3), la actualización única del voluntario (r4), las actualizaciones veterinarias con historial (r5) y los seguimientos médicos (r6).

**Qué queda fuera de alcance:**
- Login, emisión de tokens y middleware de autenticación (ver sección 6).
- Publicación automática en la web o redes sociales (el requisito la menciona, pero no hay integración en el stack).
- Notificaciones por email (solo in-app, ver r4).
- El módulo sanitario ya existente (`AtencionSanitaria`, `alertasPlan`) se **reusa**, no se reimplementa.

---

## 2. Mapa de requisitos y orden

| r | Guía | Depende de | Estado del registro al terminar |
|---|------|-----------|--------------------------------|
| r1 | `guias_requisito2/r1_registro_medico_provisional.md` | — | `PROVISIONAL` |
| r2 | `guias_requisito2/r2_revision_inicial.md` | r1 | `VALIDACION_PENDIENTE` |
| r3 | `guias_requisito2/r3_revision_final.md` | r2 | `REALIZADO` |
| r4 | `guias_requisito2/r4_actualizacion_unica_voluntario.md` | r2 | `VALIDACION_PENDIENTE` (si ya estaba validado) |
| r5 | `guias_requisito2/r5_actualizacion_veterinaria_historial.md` | r3 | `ACTUALIZADO` |
| r6 | `guias_requisito2/r6_seguimientos_medicos.md` | r3, r5 | sin cambio de estado |

**Orden recomendado:** r1 → r2 → r3 → r4 → r5 → r6.

- r1 es prerrequisito de todo: sin registro médico no hay nada que revisar.
- r2 y r3 son secuenciales por regla de negocio (la revisión final completa lo que dejó la inicial).
- r4 y r5 son independientes entre sí pero dependen de r2 y r3 respectively.
- r6 depende de r3 (necesita el registro completo) y de r5 (el seguimiento registra el estado vigente).

**Paralelización posible:** r4 y r5 pueden implementarse en paralelo una vez cerrado r3. r6 puede empezar en cuanto exista r3.

---

## 3. Línea base: qué se reutiliza

El proyecto ya tiene un módulo de usuarios/roles y un módulo sanitario. No los reinventes.

| Ya existe | Qué es | Cómo se usa aquí |
|-----------|--------|------------------|
| `enum RolUsuario` | `DIRECTORA`, `ENCARGADA_VOLUNTARIADO`, `ENCARGADA_ADOPCIONES`, `VETERINARIA`, `VOLUNTARIO` | Fuente de verdad del rol. **No crear `RolVoluntario`.** |
| `model Usuario` | `id`, `nombre`, `email`, `passwordHash`, `rol`, `activo`, `tokenVersion`, `voluntarioId? → Voluntario` | Entidad con identidad y rol. Todos los autores apuntan aquí (D-AUTOR). |
| `services/permisosUsuario.js` | Funciones puras `puedeX(actor, …)` | Añadir aquí las funciones de permiso de r2 a r6, mismo estilo. |
| `model AtencionSanitaria` | `tipo` (`vacuna`, `tratamiento`, `control`, `desparasitacion`, `esterilizacion`), `estado` (`PENDIENTE`, `REALIZADA`, `CANCELADA`) | Guarda el control sanitario de r3. Solo se le agregó `registroMedicoId`, nullable. |
| `services/alertasPlan.service.js` | Alertas de atenciones sanitarias pendientes | Sigue funcionando: `alertasPlan` no cambia, solo se le suma la columna nullable. |

> **Estado actual:** `origin/dev` ya está mergeado en `Cristopher` y la base tiene las 8 migraciones aplicadas, incluida `20261014144143_registro_medico_requisito2`. El modelo de datos de la sección 4 **ya existe en `schema.prisma`**. Lo que queda es la capa de aplicación: repositorios, servicios, rutas y frontend.

---

## 4. Diseño de datos (YA IMPLEMENTADO)

Esta sección describe lo que está en `backend/prisma/schema.prisma`. No es una propuesta: es el estado real tras la migración `20261014144143_registro_medico_requisito2`.

Origen: `requisito2.md` (r1–r6) y el diagrama MER `modulo animales.json`.

### 4.1 Enums

```prisma
enum EstadoValidacionMedica { PROVISIONAL, VALIDACION_PENDIENTE, REVISANDO, ACTUALIZADO, REALIZADO }
enum ClasificacionSalud     { NORMAL, ENFERMO, CRITICO }
enum EstadoRevisionInicial  { PENDIENTE, COMPLETADA, ACTUALIZADA, BLOQUEADA }
enum EstadoEnfermedad       { EN_CURSO, RESUELTO, CRONICO }
enum EstadoTratamiento      { EN_CURSO, RESUELTO, CRONICO }
enum EstadoAdopcion         { ADOPTABLE, NO_ADOPTABLE }
```

`EstadoValidacionMedica` es el estado del **registro**, no del animal. El estado de adopción del animal vive en `FichaAnimal.estadoAdopcion`.

Un solo `ClasificacionSalud` para los tres lugares que el requisito nombra "estado de salud o clasificación": revisión inicial (r2), revisión completa (r3) y seguimiento (r6). El diagrama MER usaba dos vocabularios distintos (`normal/enfermo/critico` y `normal/estable/en observacion/critico`); se unificaron.

### 4.2 Modelo base `RegistroMedicoAnimal`

```prisma
model RegistroMedicoAnimal {
  id              Int                 @id @default(autoincrement())
  animalId        Int                 @unique
  animal          FichaAnimal         @relation(fields: [animalId], references: [id], onDelete: Restrict)
  ingresoAnimalId Int?                @unique
  ingresoAnimal   IngresoAnimal?      @relation(fields: [ingresoAnimalId], references: [id], onDelete: Restrict)

  estadoValidacion EstadoValidacionMedica @default(PROVISIONAL)
  fechaCreacion    DateTime              @default(now())
  createdAt        DateTime              @default(now())

  @@index([estadoValidacion])
}
```

- El `@unique` sobre `animalId` garantiza **1 ficha : 1 registro médico** a nivel de base de datos. Es la defensa contra duplicados de r1.
- `fechaCreacion` es explícita y separada de toda fecha de actualización. **No usar `@updatedAt`** para esto: también salta cuando la veterinaria valida y rompería la distinción que pide el requisito.
- Los campos de cada fase viven en tablas hijas, no en este modelo.

### 4.3 Qué aporta cada requisito

| r | Modelos | Campos clave |
|---|---------|--------------|
| r1 | `RegistroMedicoAnimal` | `estadoValidacion`, `fechaCreacion` |
| r2 | `RevisionInicial` | `peso`, `clasificacionSalud`, `prioridadAtencion`, `cuarentena`, `observacionEstadoSalud`, `estadoRevisionInicial` |
| r3 | `RevisionCompleta`, `TratamientoAnimal`, `EnfermedadAnimal`, `AtencionSanitaria`, `ActualizacionEstadoAnimal` | `edad`, `peso`, `descripcionCondicionMedica`, `descripcionCuidadosEspeciales`, `estadoSalud`; decisión de adopción en `FichaAnimal.estadoAdopcion` |
| r4 | `AuditoriaRevisionInicial`, `Notificacion` | `campo`, `valorAnterior`, `valorNuevo`, `autorId`, `fecha`, `hora`; `fechaActualizacion` en `RevisionInicial` |
| r5 | `HistorialRegistroMedico` | `version`, `estadoOrigen`, snapshot clínico, `actualizadoPorId`, `fecha` |
| r6 | `SeguimientoMedicoAnimal`, `SeguimientoEnfermedadAnimal`, `SeguimientoTratamientoAnimal` | `fechaRegistro`, `peso`, `observacionSeguimiento`, `estadoSalud`, `necesidades`; `estadoEnfermedad` / `estadoTratamiento` |

### 4.4 Desviaciones respecto al diagrama MER

El diagrama pide cosas que se resolvieron distinto. Las razones están también comentadas en `schema.prisma`.

| # | Diagrama | Implementación | Por qué |
|---|----------|----------------|---------|
| 1 | `ControlSanitarioAnimal` | Se reusó `AtencionSanitaria` con `+ registroMedicoId?` | Ese modelo ya existía con los mismos tipos y alimenta `alertasPlan`. Una tabla nueva lo habría duplicado y el módulo de alertas habría dejado de ver lo que registra r3. |
| 2 | `RevisionInicial` sin `peso` | Se agregó `peso` | r2 lo exige de forma expresa. |
| 3 | `Seguimiento{Enfermedad,Tratamiento}Animal` con `registroMedicoId` | Se omite | Es redundante: se deduce por `seguimientoMedicoId`. Dos FKs pueden desincronizarse. |
| 4 | `EnfermedadAnimal` / `TratamientoAnimal` sin estado | Se mantiene sin estado | El estado vive en el seguimiento, que es donde r6 lo pide. Ponerlo en ambos crearía dos fuentes de verdad. |
| 5 | `SeguimientoMedicoAnimal` sin `necesidades` | Se agregó `necesidades` | r6 lo exige como dato y como disparador. |
| 6 | `AtencionVeterinaria` sin `resultado`, `EnfermedadAnimal` sin autor | Se agregaron | Sin autor no se puede saber quién registró la enfermedad. |
| 7 | `FichaAnimal.estadoAnimal` | `FichaAnimal.estadoAdopcion` (D-ADOPCION) | `estadoEstadia` ya existe con `ESPERA_ADOPCION` y lo usa el módulo de adopción. No se renombró para no romperlo. |
| 8 | `ActualizacionEstadoAnimal` | Igual, sobre `estadoAdopcion` | El requisito r3 pide constancia del cambio de "adoptable" / "no adoptable", no de la estadía. |

### 4.5 Decisiones compartidas

**D-AUTOR — qué entidad registra al autor.** *Resuelta: `Usuario`.*

Todas las entidades nuevas referencian `Usuario.id` (`createdById`, `updatedById`, `autorId`, `actualizadoPorId`, `destinatarioId`). `Usuario` es la entidad que tiene `RolUsuario`, que es lo que exigen r2, r3, r4, r5 y r6. Si se necesita el `Voluntario` físico, se resuelve por `Usuario.voluntarioId`. `Usuario` quedó con 11 relaciones inversas, una por cada autor.

**D-ADOPCION — dónde vive "adoptable".** *Resuelta: `FichaAnimal.estadoAdopcion`.*

`FichaAnimal.estadoEstadia` se dejó intacto. Se agregó `estadoAdopcion EstadoAdopcion?`, nullable: es `null` hasta que la veterinaria decide en r3. `ActualizacionEstadoAnimal` registra cada cambio de ese campo.

---

## 5. Máquina de estados del registro médico

Los valores viven en `RegistroMedicoAnimal.estadoValidacion` (enum `EstadoValidacionMedica`).

```
                  ┌──────────────────────────────────────────────┐
                  │                                              │
  PROVISIONAL ──► VALIDACION_PENDIENTE ──► REVISANDO ──► ACTUALIZADO ──► REALIZADO
    (r1)              (r2)                 (r5)          (r5)           (r3)
                         ▲                                              │
                         └──────────────────────────────────────────────┘
                                      (r4 revierte un registro validado)
```

| Transición | Quién | Endpoint | Condición |
|------------|-------|----------|-----------|
| `PROVISIONAL → VALIDACION_PENDIENTE` | voluntario o veterinaria | r2 | Revisión inicial completa |
| `VALIDACION_PENDIENTE → REALIZADO` | veterinaria | r3 | Revisión final completa |
| `REALIZADO/ACTUALIZADO → VALIDACION_PENDIENTE` | voluntario | r4 | Actualización única sobre un registro ya validado |
| `REALIZADO/ACTUALIZADO → REVISANDO → ACTUALIZADO` | veterinaria | r5 | Actualización veterinaria guardada |
| `REVISANDO → estado previo` | sistema | r5 | Cierre sin guardar: no se persiste nada |

Aparte, `RevisionInicial.estadoRevisionInicial` lleva su propio ciclo: `PENDIENTE → COMPLETADA`, y con la actualización única de r4 pasa a `ACTUALIZADA` y luego `BLOQUEADA`.

**Reglas:**
- `REVISANDO` es **transitorio**: solo existe mientras la veterinaria está editando. Si se cierra la instancia sin guardar, no se persiste y el estado vuelve al último registrado.
- `ACTUALIZADO` es el estado estable tras una actualización veterinaria guardada.
- `REALIZADO` es el estado estable tras la revisión final.
- Ningún endpoint puede saltar estados fuera de esta tabla. Cada servicio valida el estado actual antes de transicionar.

---

## 6. Bloqueo: el contrato `actor`

`permisosUsuario.js` ya existe y sus funciones reciben un `actor`:

```js
export function puedeConsultarAlertas(actor) {
  return esCuentaActiva(actor) && actor.rol === "VETERINARIA";
}
```

**El problema:** hoy **nada produce ese `actor`**. No hay middleware `autenticar`, ni ruta de login, ni `request.usuario`. `permisosUsuario.js` está escrito pero no está conectado a ninguna ruta.

**Lo que sí está definido** es la forma del `actor`, inferida de `permisosUsuario.js` y del modelo `Usuario`:

```js
// actor = { id, rol, activo, voluntarioId }
```

**Decisión de esta guía:** los servicios del requisito 2 reciben `actor` **inyectado por parámetro** (igual que `animalService.js` recibe `dependencias`), y las funciones de permiso viven en `permisosUsuario.js`. El login y el middleware que resuelven `actor` desde el token quedan **fuera de alcance** y se documentan como bloqueo pendiente.

**Funciones de permiso a añadir en `permisosUsuario.js`:**

| Función | Rol permitido | Requisito |
|---------|---------------|-----------|
| `puedeRegistrarRevisionInicial(actor)` | `VOLUNTARIO`, `VETERINARIA` | r2 |
| `puedeRealizarRevisionFinal(actor)` | `VETERINARIA` | r3 |
| `puedeActualizarRevisionInicial(actor)` | `VOLUNTARIO` | r4 |
| `puedeActualizarRegistroMedico(actor)` | `VETERINARIA` | r5 |
| `puedeRegistrarSeguimiento(actor)` | `VETERINARIA` | r6 |
| `puedeConsultarRegistroMedico(actor)` | `VOLUNTARIO`, `VETERINARIA` | lecturas |

> **Importante:** el permiso se aplica en el **servicio**, no solo ocultando el botón en el frontend. Un voluntario con `curl` no debe poder validar.

---

## 7. Convenciones del proyecto

Verificadas contra el árbol real. **No uses nombres inventados.**

**Backend** (`backend/src/`):

| Capa | Convención | Ejemplo real |
|------|-----------|--------------|
| routes | `camelCase` | `animalRoutes.js` |
| controllers | `camelCase` | `animalController.js` |
| services | `camelCase` | `animalService.js` |
| repositories | `camelCase` | `fichaAnimalRepository.js` |
| validations | `camelCase` | `fichaAnimalValidation.js` |
| entities | `camelCase` + `Errors` | `animalErrors.js` |
| middlewares | `camelCase` | `capturarErrores.js`, `validarEsquema.js` |
| handlers | `camelCase` español | `manejadorErrores.js` |

**Frontend** (`frontend/src/`):

| Tipo | Convención | Ejemplo real |
|------|-----------|--------------|
| Pages | `PascalCase` + `Page` | `RegistroPage.jsx` |
| Componentes UI | `PascalCase` | `components/ui/Campo.jsx` |
| Servicios | `camelCase` + `Service` | `animalesService.js` |
| Hooks | `camelCase` + `use` | `useFormulario.js` |
| Validaciones | `camelCase` + `Validation` | `fichaValidation.js` |

**Comandos:**

| Acción | Comando |
|--------|---------|
| Tests backend | `npm test` (→ `node --test`) |
| Migraciones | `npm run prisma:migrate` |
| Regenerar cliente | `npm run prisma:generate` |
| Lint frontend | `npm run lint` |
| Build frontend | `npm run build` |

**Estilo de código:**
- `export function` con nombre en servicios/controladores; `export default` en componentes React.
- Servicios con **DI**: `DEPENDENCIAS_POR_DEFECTO` + parámetro `dependencias` (patrón de `animalService.js`).
- Repositorios con `cliente = prisma` como último parámetro.
- Errores de dominio como clases (`AnimalError`) con `codigo`, `estadoHttp`, `opcion`; el `manejadorErrores` central los traduce a HTTP.
- Esquemas Zod `z.strictObject` en frontend **y** backend, **sincronizados**.

---

## 8. Trazabilidad

| Requisito | Endpoint principal | Servicio | Test |
|-----------|--------------------|----------|------|
| r1 | `POST /api/animales/ingresos` (transacción) | `animalService.registrarIngreso` | `tests/services/animalService.test.js` |
| r2 | `POST /api/registros-medicos/:id/revision-inicial` | `registroMedicoService.completarRevisionInicial` | `tests/services/registroMedicoService.test.js` |
| r3 | `POST /api/registros-medicos/:id/validacion` | `registroMedicoService.realizarRevisionFinal` | `tests/services/registroMedicoService.test.js` |
| r4 | `PATCH /api/registros-medicos/:id/revision-inicial` | `registroMedicoService.actualizarRevisionInicial` | `tests/services/registroMedicoService.test.js` |
| r5 | `POST /api/registros-medicos/:id/actualizaciones` | `registroMedicoService.actualizarRegistro` | `tests/services/registroMedicoService.test.js` |
| r6 | `POST /api/registros-medicos/:id/seguimientos` | `registroMedicoService.registrarSeguimiento` | `tests/services/registroMedicoService.test.js` |

---

## 9. Orden de arranque

Los pasos 1 y 2 ya están hechos. Queda lo siguiente:

1. ~~**Merge de `origin/dev`**~~ — hecho.
2. ~~**Enums y modelos en `schema.prisma` + migración + generate**~~ — hecho, migración `20261014144143_registro_medico_requisito2`.
3. **Permisos** en `permisosUsuario.js` (sección 6) + sus tests.
4. **r1** → **r2** → **r3** en orden estricto.
5. **r4** y **r5** en paralelo.
6. **r6**.
7. **Lecturas** (`GET /api/registros-medicos/:id`, bandeja de veterinaria) cuando haga falta UI.
8. **Frontend** al final, con los esquemas Zod espejo sincronizados.

---

## 10. Índice de guías

- `guias_requisito2/r1_registro_medico_provisional.md`
- `guias_requisito2/r2_revision_inicial.md`
- `guias_requisito2/r3_revision_final.md`
- `guias_requisito2/r4_actualizacion_unica_voluntario.md`
- `guias_requisito2/r5_actualizacion_veterinaria_historial.md`
- `guias_requisito2/r6_seguimientos_medicos.md`

> Las guías describen el diseño del modelo con los nombres de campo. Donde la implementación real difiere, manda `schema.prisma` y la tabla de desviaciones de la sección 4.4.
