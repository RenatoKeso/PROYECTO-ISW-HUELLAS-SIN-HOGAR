- fecha : 14/10
# r4 — Actualización única de la revisión inicial

> Requisito de origen: `requisito2.md`, punto `r4`
> Guía general: [`../guia_requisito2.md`](../guia_requisito2.md)
> Estado que produce: vuelve a `VALIDACION_PENDIENTE` si el registro ya estaba validado

---

## 1. Requisito citado

> El voluntario puede **actualizar solo una vez** la revisión inicial en caso de necesitar completar datos o corregir, **antes de guardar el sistema debe solicitar confirmación y advertir que después no podrá actualizarla nuevamente**, tras esa actualización, el **sistema bloquea** la modificación de la revisión inicial, guarda la **fecha de actualización separada** de la de creación y **registra, por cada cambio, el valor anterior, el valor nuevo, el autor, la fecha y la hora**. Si el registro ya estaba validado, **vuelve a "pendiente de validación" y se notifica a la médica veterinaria**.

---

## 2. Qué exige y qué no

**Exige:**
- El **voluntario** puede actualizar la revisión inicial **una sola vez**.
- Antes de guardar, **confirmación con advertencia**.
- Tras la actualización, la revisión inicial queda **bloqueada**.
- `fechaActualizacion` **separada** de `fechaCreacion`.
- **Auditoría por cada campo modificado**: valor anterior, valor nuevo, autor, fecha y hora.
- Si el registro ya estaba validado: vuelve a `VALIDACION_PENDIENTE` y **se notifica** a la veterinaria.

**No exige:**
- Que la veterinaria pueda actualizar la revisión inicial (r5 cubre el registro médico completo, y r3 su revisión final).
- Un sistema de notificaciones por email (solo in-app).
- Auditoría de la creación (eso es r1, sin autor humano).

---

## 3. Dependencias

- **r2** implementada: la actualización solo tiene sentido si hay una revisión inicial.
- Bloqueada por `puedeActualizarRevisionInicial` (solo `VOLUNTARIO`).
- Notifica a `VETERINARIA`, que es el rol del módulo de usuarios.

---

## 4. Decisiones de este requisito

**D-12 — ¿Cómo se marca "solo una vez"?**
- **Opción A (recomendada):** una columna `fechaActualizacion DateTime?`. Si no es `null`, ya se usó. Es la fuente de verdad, no un contador.
- Opción B: contador `actualizacionesIniciales Int @default(0)`. Redundante con la fecha y puede desincronizarse.

**D-13 — ¿Bloqueo explícito o se deduce de la fecha?**
Con D-12 Opción A, el bloqueo **se deduce**: `fechaActualizacion !== null` ⇒ bloqueado. No añadas un `bloqueada Boolean`; serían dos fuentes de verdad para lo mismo. Si el profe pide un campo explícito, documéntalo.

**D-14 — ¿Y si el voluntario reenvía los mismos valores sin cambiar nada?**
- **Opción A (recomendada):** se guarda la actualización (la fecha y el bloqueo se consumen igual) pero **no** se crean filas de auditoría, porque no hubo cambios. Devuelve `200` con `"sinCambios": true`.
- Opción B: rechazar con 400. Más estricto, pero castiga al usuario por un clic de más.

**D-15 — ¿La auditoría es una fila por campo o un snapshot en JSON?**
- **Opción A (recomendada):** una fila por campo modificado en `AuditoriaCampo`. El requisito pide "por cada cambio, el valor anterior, el valor nuevo". Más consultable.
- Opción B: un `Json` con el snapshot completo. Cumple, pero menos verificable.

**D-16 — ¿La notificación es in-app?**
**Sí.** No introduzcas nodemailer ni un servicio externo sin autorización. `Notificacion` es una tabla simple que se consulta con un `GET`.

---

## 5. Modelo de datos

### Campos que r4 añade a `RegistroMedico`

```prisma
model RegistroMedico {
  // …modelo base + r2 + r3

  fechaActualizacion      DateTime?
  actualizacionPorId      Int?
  actualizacionPor        Usuario?  @relation(fields: [actualizacionPorId], references: [id])
}
```

`fechaActualizacion` es **explícita y separada** de `fechaCreacion` (r1) y de `fechaRevisionInicial` (r2). **No usar `@updatedAt`**: cambiaría también cuando la veterinaria valida y rompería la distinción que el requisito pide.

### `AuditoriaCampo`

```prisma
model AuditoriaCampo {
  id              Int           @id @default(autoincrement())
  registroMedicoId Int
  registroMedico  RegistroMedico @relation(fields: [registroMedicoId], references: [id], onDelete: Cascade)

  campo          String
  valorAnterior  String?
  valorNuevo     String?
  autorId        Int
  autor          Usuario        @relation(fields: [autorId], references: [id])
  fecha          DateTime       @default(now())
  hora           String

  @@index([registroMedicoId])
}
```

> **Sobre `fecha` + `hora` separados:** un `DateTime` ya contiene ambos, así que son redundantes. El requisito lo pide de forma literal ("la fecha y la hora"). Si el profe lo exige textual, guarda `hora` como `String` `"14:32:07"`; si no, omítelo y explica por qué en la defensa. `onDelete: Cascade` solo aquí, no en `FichaAnimal`.

### `Notificacion`

```prisma
model Notificacion {
  id            Int      @id @default(autoincrement())
  destinatarioId Int
  tipo          String
  titulo        String
  mensaje       String
  registroMedicoId Int?
  leida         Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([destinatarioId, leida])
}
```

**Relaciones inversas necesarias** (si no, `prisma generate` falla): en `Usuario`, `auditorias`, `notificacionesRecibidas`, `actualizacionesRegistro`.

---

## 6. Contrato de API

### `PATCH /api/registros-medicos/:id/revision-inicial`

**Rol:** solo `VOLUNTARIO` (`puedeActualizarRevisionInicial`).

**Body:** el mismo `revisionInicialSchema` de r2 (los cuatro campos), porque la actualización reemplaza el conjunto completo de la revisión inicial.

**Reglas:**

- Si `fechaActualizacion !== null` → **409** `ACTUALIZACION_YA_REALIZADA`.
- Si el registro está `PROVISIONAL` (no hay revisión inicial que actualizar) → **409** `REVISION_INICIAL_REQUERIDA`.

**Respuesta 200:**

```json
{
  "registroMedico": {
    "id": 10,
    "estado": "VALIDACION_PENDIENTE",
    "fechaCreacion": "2026-10-14T15:04:05.000Z",
    "fechaActualizacion": "2026-10-14T18:30:00.000Z",
    "actualizadoPor": { "id": 4, "nombre": "Ana Pérez", "rol": "VOLUNTARIO" },
    "revisadoNuevamente": true
  },
  "auditoria": [
    { "campo": "pesoKg", "valorAnterior": "12.40", "valorNuevo": "11.80", "fecha": "2026-10-14T18:30:00.000Z", "hora": "18:30:00" }
  ],
  "sinCambios": false
}
```

`revisadoNuevamente` vale `true` solo si el registro estaba en `REALIZADO`/`ACTUALIZADO` y volvió a `VALIDACION_PENDIENTE`. El frontend lo usa para explicar el motivo en pantalla.

**Errores de dominio:**

| Código | HTTP | Cuándo |
|--------|------|--------|
| `REGISTRO_MEDICO_INEXISTENTE` | 404 | No existe |
| `ROL_INSUFICIENTE` | 403 | El actor no es `VOLUNTARIO` |
| `ACTUALIZACION_YA_REALIZADA` | 409 | `fechaActualizacion !== null` |
| `REVISION_INICIAL_REQUERIDA` | 409 | Estado `PROVISIONAL` |

---

## 7. Archivos

**Crear:**
- `backend/src/repositories/notificacionRepository.js`

**Modificar:**
- `backend/prisma/schema.prisma` (campos de r4, `AuditoriaCampo`, `Notificacion`, relaciones inversas)
- `backend/src/services/permisosUsuario.js` (`puedeActualizarRevisionInicial`)
- `backend/src/services/registroMedicoService.js` (`actualizarRevisionInicial`)
- `backend/src/entities/registroMedicoErrors.js`
- `backend/src/controllers/registroMedicoController.js`
- `backend/src/routes/registroMedicoRoutes.js`
- `frontend/src/services/registroMedicoService.js` (nuevo)
- `frontend/src/pages/RegistroMedicoPage.jsx`

---

## 8. Tareas ordenadas

- [ ] **1.** Añadir `fechaActualizacion`, `actualizacionPorId` a `RegistroMedico`, más los modelos `AuditoriaCampo` y `Notificacion`.
- [ ] **2.** Añadir las relaciones inversas en `Usuario`.
- [ ] **3.** `npm run prisma:migrate` + `npm run prisma:generate`.
- [ ] **4.** Añadir `ACTUALIZACION_YA_REALIZADA` y `REVISION_INICIAL_REQUERIDA` a `registroMedicoErrors.js`.
- [ ] **5.** Añadir `puedeActualizarRevisionInicial(actor)` a `permisosUsuario.js` con test.
- [ ] **6.** Crear `notificacionRepository.js` con `crearNotificacion` y `listarNotificacionesPorDestinatario`.
- [ ] **7.** Añadir `crearAuditoriasCampo` a `registroMedicoRepository.js`.
- [ ] **8.** Implementar `actualizarRevisionInicial` en `registroMedicoService.js`:

  1. Validar permiso.
  2. Leer el registro. Si `fechaActualizacion !== null` → 409. **Guardia antes de cualquier escritura.**
  3. Si `estado === "PROVISIONAL"` → 409.
  4. Leer los valores actuales de los **cuatro** campos de revisión inicial.
  5. Comparar campo por campo y construir el array de cambios.
  6. **Dentro de una única transacción**:
     - `update` con los cuatro campos nuevos + `fechaActualizacion: new Date()` + `actualizacionPorId: actor.id`.
     - Crear una fila de `AuditoriaCampo` por cada campo realmente cambiado.
     - Si el estado previo era `REALIZADO` o `ACTUALIZADO`: `update` a `VALIDACION_PENDIENTE`, limpiar `revisionFinalPorId` / `fechaRevisionFinal` / `adoptabilidad`, y crear la `Notificacion` para las cuentas `VETERINARIA`.
- [ ] **9.** Añadir la ruta `PATCH /:id/revision-inicial`.
- [ ] **10.** Implementar `GET /api/notificaciones` + `PATCH /api/notificaciones/:id/leida`.
- [ ] **11.** Frontend (sección 11).
- [ ] **12.** Tests (sección 9).

---

## 9. Tests

**`tests/services/registroMedicoService.test.js`:**

- [ ] `VOLUNTARIO` puede actualizar una revisión inicial existente.
- [ ] `VETERINARIA` recibe 403 (r4 es del voluntario).
- [ ] Con `fechaActualizacion` ya poblada → 409 `ACTUALIZACION_YA_REALIZADA` **y no se escribe nada** (verifica que la transacción no se invocó).
- [ ] Registro en `PROVISIONAL` → 409 `REVISION_INICIAL_REQUERIDA`.
- [ ] Cambia el peso y la clasificación → 2 filas en `AuditoriaCampo` con `valorAnterior` y `valorNuevo` correctos.
- [ ] Reenvía los mismos valores → `sinCambios: true`, **0 filas** de auditoría, pero `fechaActualizacion` sí se pobló.
- [ ] El `update` **no toca** `enfermedades`, `pesoRevalidadoKg`, `adoptabilidad` ni ningún campo de r3.
- [ ] `fechaCreacion` **no cambia** tras la actualización.
- [ ] Registro en `REALIZADO` → queda en `VALIDACION_PENDIENTE`, `revisionFinalPorId` y `adoptabilidad` quedan en `null`, y se crea una `Notificacion`.
- [ ] Registro ya en `VALIDACION_PENDIENTE` → **no** se crea notificación.
- [ ] Si falla la creación de la notificación, toda la transacción revierte.

**`tests/services/permisosUsuario.test.js`:**

- [ ] `puedeActualizarRevisionInicial` acepta `VOLUNTARIO`, rechaza `VETERINARIA`, `DIRECTORA` e inactivos.

**Test de concurrencia (importante):**

- [ ] Dos actualizaciones simultáneas: solo una gana. Usa `updateMany` con la condición `fechaActualizacion: null` para que la base resuelva la carrera; si afecta a 0 filas → 409.

---

## 10. Criterios de aceptación

- [ ] Un segundo intento de actualización devuelve **409**, no 500 ni un rechazo silencioso del frontend.
- [ ] El bloqueo se valida en el **backend**, no en el botón.
- [ ] Antes de guardar, la UI pide confirmación con advertencia literal.
- [ ] `fechaActualizacion` es distinta de `fechaCreacion` y de `fechaRevisionInicial`.
- [ ] Cada campo modificado tiene su fila de auditoría con valor anterior, nuevo, autor, fecha y hora.
- [ ] Actualizar un registro validado lo devuelve a `VALIDACION_PENDIENTE` y genera notificación para la veterinaria.
- [ ] La actualización del voluntario **no** pisa ningún dato clínico.
- [ ] `npm test` en verde.

---

## 11. Frontend

- [ ] `hooks/useConfirmacion.js` — hook reutilizable que devuelve `confirmar({ titulo, mensaje })` → `Promise<boolean>`.
- [ ] `components/ui/ModalConfirmacion.jsx` — modal con el texto de advertencia **literal**:
  > *"Una vez guardada esta actualización, la revisión inicial quedará bloqueada y no podrá modificarse nuevamente."*
- [ ] `components/registroMedico/RevisionInicialForm.jsx` — botón "Guardar actualización" que abre el modal y **solo entonces** llama al `PATCH`.
- [ ] `pages/RegistroMedicoPage.jsx`:
  - [ ] Si `fechaActualizacion !== null`, renderizar los campos de revisión inicial **deshabilitados** con un aviso "revisión inicial bloqueada".
  - [ ] Mostrar `fechaCreacion` y `fechaActualizacion` de forma visible y diferenciada.
  - [ ] Mostrar el aviso "volvió a pendiente de validación" cuando la respuesta trae `revisadoNuevamente: true`.
- [ ] `components/registroMedico/AuditoriaRevisionInicial.jsx` — tabla `campo | anterior | nuevo | autor | fecha y hora`.
- [ ] `components/NotificacionesBell.jsx` (o similar) — lista de notificaciones no leídas con el `GET /api/notificaciones`.

> La confirmación es **UX**. El bloqueo es **backend**. Los dos, o ninguno sirve.

---

## 12. Trampas

1. **Confiar solo en el frontend.** Ocultar el botón cuando `fechaActualizacion` existe es cosmético: cualquiera con `curl` lo evita. La guardia va en el servicio, **antes** de escribir nada.
2. **`@updatedAt` como fecha de actualización.** El requisito la pide separada de la de creación. `@updatedAt` también salta cuando la veterinaria valida.
3. **`update` con `...datos` a ciegas.** El servicio recibe el body completo; si haces spread, el voluntario puede pisar `enfermedades` o `adoptabilidad`. Construye un objeto con los campos explícitos de revisión inicial.
4. **Un solo blob de auditoría.** Cumple el texto, pero "por cada cambio" pide granularidad. Una fila por campo.
5. **Auditar sin comparar.** Si guardas auditoría siempre, registras cambios que no existen. Compara campo por campo.
6. **Limpiar la validación a medias.** Al revertir a `VALIDACION_PENDIENTE`, `revisionFinalPorId`, `fechaRevisionFinal` y `adoptabilidad` deben quedar en `null`, o el registro vuelve a "pendiente" pero aparenta estar validado.
7. **Notificar a un rol en vez de a las cuentas.** `Notificacion.destinatatarioId` apunta a un `Usuario`. Crea una notificación por cada `Usuario` con `rol: "VETERINARIA"` y `activo: true`.
8. **`hora` como columna calculada.** Si la guardas, es un `String` `"HH:mm:ss"` derivado de la fecha en el servicio; no un segundo `DateTime`.