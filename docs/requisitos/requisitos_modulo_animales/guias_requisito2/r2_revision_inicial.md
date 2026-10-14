- fecha : 14/10
# r2 — Revisión inicial del animal

> Requisito de origen: `requisito2.md`, punto `r2`
> Guía general: [`../guia_requisito2.md`](../guia_requisito2.md)
> Estado que produce: `VALIDACION_PENDIENTE`

---

## 1. Requisito citado

> En la revisión inicial el **voluntario autorizado** registrara el **peso**, **clasificación de salud** (normal, enfermo, critico) con la que el sistema define la **prioridad de atención**, además de una **observación del estado salud general**, y definir si debe ser puesto en **cuarentena**, cuando este toda la información necesaria de la revisión inicial, el registro medico pasara a estado **"Validación pendiente"** para proceder a la revisión completa.

> Nota: r1 clarify que la revisión inicial puede hacerla "un voluntario autorizado **o** la médica veterinaria". Por eso esta guía habilita ambos roles.

---

## 2. Qué exige y qué no

**Exige:**
- Peso (obligatorio, numérico, mayor a 0).
- Clasificación de salud con exactamente tres valores: `NORMAL`, `ENFERMO`, `CRITICO`.
- Que esa clasificación **defina la prioridad de atención** en el sistema.
- Observación del estado general de salud (obligatoria).
- Decisión sobre cuarentena (sí/no) — es una **decisión**, no una sugerencia automática.
- Transición a `VALIDACION_PENDIENTE` cuando **toda** la información necesaria esté completa.

**No exige:**
- Que el sistema decida la cuarentena solo (el texto dice "definir si debe ser puesto", no "el sistema sugiere").
- Ningún campo clínico: enfermedades, tratamientos, control sanitario son de r3.
- Que se pueda modificar más de una vez (eso es r4).

---

## 3. Dependencias

- **r1** debe estar implementado: sin registro médico no hay nada que revisar.
- Bloqueada por el contrato `actor` (guía general §6). Depende de `puedeRegistrarRevisionInicial` en `permisosUsuario.js`.

---

## 4. Decisiones de este requisito

**D-4 — ¿"Prioridad de atención" es un campo o es derivado de la clasificación?**
- **Opción A (recomendada):** derivado. `NORMAL` → prioridad 3, `ENFERMO` → 2, `CRITICO` → 1. Una función pura `prioridadDe(clasificacion)` en el servicio. Imposible que queden desincronizados y es trivialmente testeable.
- Opción B: columna `prioridad` persistida. Más flexible, pero agrega un campo que puede contradecir la clasificación.

**D-5 — ¿La cuarentena es booleano o estado?**
- **Opción B de la guía general:** booleano. `requiereCuarentena Boolean`. El texto pide "definir si debe ser puesto en cuarentena", es una decisión del revisor. No lo inventes como estado del animal.

**D-6 — ¿Se admite reutilizar el `estadoSalud` (texto libre) de `IngresoAnimal`?**
`IngresoAnimal.estadoSalud` es un `String?` libre creado en el requisito 1. **No lo reutilices** para la clasificación: no está validado y duplicaría la fuente de verdad. La clasificación vive en `RegistroMedico`.

---

## 5. Modelo de datos

Campos que r2 **añade** al modelo base:

```prisma
enum ClasificacionSalud {
  NORMAL
  ENFERMO
  CRITICO
}

model RegistroMedico {
  // …modelo base de la guía general

  pesoKg                Decimal?          @db.Decimal(5, 2)
  clasificacionSalud    ClasificacionSalud?
  observacionInicial    String?
  requiereCuarentena    Boolean?

  fechaRevisionInicial  DateTime?
  revisionInicialPorId  Int?
  revisionInicialPor    Usuario?          @relation(fields: [revisionInicialPorId], references: [id])
}
```

- `pesoKg`, `clasificacionSalud`, `observacionInicial` y `requiereCuarentena` son **nullables en la base** porque el registro nace `PROVISIONAL` en r1 y la revisión inicial aún no ha ocurrido. La **obligatoriedad la impone Zod** en el endpoint, no el esquema de Prisma. Si los pones `NOT NULL` en Prisma, rompes r1.
- `pesoKg` es `Decimal(5,2)`, no `Float`. Es dato de salud. Ten presente que Prisma devuelve un `Decimal.js`: conviértelo con `Number()` en el servicio y en el JSON de salida.

---

## 6. Contrato de API

### `POST /api/registros-medicos/:id/revision-inicial`

**Rol:** `VOLUNTARIO` o `VETERINARIA` (`puedeRegistrarRevisionInicial`).

**Body** (`z.strictObject`):

```js
export const revisionInicialSchema = z.strictObject({
  pesoKg: z.number().positive({ message: "El peso debe ser mayor a 0" }),
  clasificacionSalud: z.enum(["NORMAL", "ENFERMO", "CRITICO"], {
    message: "La clasificacion de salud debe ser NORMAL, ENFERMO o CRITICO",
  }),
  observacionInicial: z.string().trim().min(1, {
    message: "La observacion del estado general de salud es obligatoria",
  }),
  requiereCuarentena: z.boolean(),
});
```

**Reglas de validación:**
- Los cuatro campos son **obligatorios**. Si falta alguno → 400 `DATOS_INVALIDOS`.
- `pesoKg` rechaza `0`, negativos y strings.

**Respuesta 200:**

```json
{
  "registroMedico": {
    "id": 10,
    "estado": "VALIDACION_PENDIENTE",
    "pesoKg": 12.4,
    "clasificacionSalud": "ENFERMO",
    "prioridadAtencion": 2,
    "observacionInicial": "Tos persistente, baja de apetito",
    "requiereCuarentena": true,
    "fechaRevisionInicial": "2026-10-14T16:10:00.000Z"
  }
}
```

**Errores de dominio** (en `registroMedicoErrors.js`):

| Código | HTTP | Cuándo |
|--------|------|--------|
| `REGISTRO_MEDICO_INEXISTENTE` | 404 | No existe el registro |
| `ROL_INSUFICIENTE` | 403 | El actor no puede hacer revisión inicial |
| `ESTADO_INVALIDO` | 409 | El registro ya tiene revisión inicial completa, o no está en un estado que permita revisarlo |
| `ANIMAL_NO_ESTA_EN_REFUGIO` | 409 | La ficha está `ADOPTADO`, `FALLECIDO`, `TRANSFERIDO` o `EGRESADO` |

> La última regla es D-X de la guía general: si el animal ya egresó, no se le hace revisión inicial. Se bloquea explícitamente, no se deja fallar la FK.

---

## 7. Archivos

**Crear:**
- `backend/src/validations/registroMedicoValidation.js`
- `backend/src/services/registroMedicoService.js`

**Modificar:**
- `backend/prisma/schema.prisma`
- `backend/src/services/permisosUsuario.js` (añadir `puedeRegistrarRevisionInicial`)
- `backend/src/controllers/registroMedicoController.js` (crear)
- `backend/src/routes/registroMedicoRoutes.js` (crear)
- `backend/src/routes/index.js` (montar)
- `backend/tests/services/permisosUsuario.test.js`

---

## 8. Tareas ordenadas

- [ ] **1.** Añadir `enum ClasificacionSalud` y los campos de r2 al modelo `RegistroMedico` en `schema.prisma`.
- [ ] **2.** Añadir las relaciones inversas en `Usuario` (`revisionInicialRealizada`).
- [ ] **3.** `npm run prisma:migrate` + `npm run prisma:generate`.
- [ ] **4.** Añadir `puedeRegistrarRevisionInicial(actor)` a `permisosUsuario.js`, con test en `tests/services/permisosUsuario.test.js` (veterinaria sí, voluntaria sí, cuenta inactiva no).
- [ ] **5.** Añadir los códigos de error de la sección 6 a `registroMedicoErrors.js`.
- [ ] **6.** Crear `registroMedicoValidation.js` con `revisionInicialSchema` y `registroMedicoIdParamSchema` (patrón de `fichaIdParamSchema`).
- [ ] **7.** Implementar en `registroMedicoService.js`, con `DEPENDENCIAS_POR_DEFECTO` (patrón de `animalService.js`):
  - [ ] `prioridadDe(clasificacion)` — **función pura**, exportada, testeable aparte. `CRITICO`→1, `ENFERMO`→2, `NORMAL`→3.
  - [ ] `completarRevisionInicial({ registroMedicoId, datos, actor, dependencias })`
  - [ ] Validar permiso con `puedeRegistrarRevisionInicial(actor)`.
  - [ ] Validar estado actual: solo transicionar desde `PROVISIONAL`.
  - [ ] Validar que la ficha esté en refugio.
  - [ ] `update` con los campos de r2, `estado: VALIDACION_PENDIENTE`, `fechaRevisionInicial`, `revisionInicialPorId: actor.id`.
  - [ ] Devolver el registro con `pesoKg` convertido a `Number()` y `prioridadAtencion` calculado.
- [ ] **8.** Crear `registroMedicoController.js` con `crearRegistroMedicoController({ controlador })`.
- [ ] **9.** Crear `registroMedicoRoutes.js` con `validarEsquema` + `capturarErrores`.
- [ ] **10.** Montar en `routes/index.js` bajo `/api/registros-medicos`.
- [ ] **11.** Tests (sección 9).

---

## 9. Tests

**`tests/services/registroMedicoService.test.js`:**

- [ ] `prioridadDe("CRITICO") === 1`, `prioridadDe("ENFERMO") === 2`, `prioridadDe("NORMAL") === 3`.
- [ ] Con `actor.rol = "VOLUNTARIO"` la revisión inicial se guarda.
- [ ] Con `actor.rol = "VETERINARIA"` también se guarda (r1 lo permite).
- [ ] Con `actor.rol = "DIRECTORA"` se rechaza con 403 `ROL_INSUFICIENTE`.
- [ ] Con `actor.activo = false` se rechaza con 403.
- [ ] Registro ya en `VALIDACION_PENDIENTE` → 409 `ESTADO_INVALIDO`.
- [ ] Registro inexistente → 404.
- [ ] Ficha `ADOPTADO` → 409 `ANIMAL_NO_ESTA_EN_REFUGIO`.
- [ ] El `update` toca **solo** campos de revisión inicial y nunca los clínicos, que se escriben en r3 y r5.

**`tests/validations/registroMedicoValidation.test.js`:**

- [ ] Acepta el body completo válido.
- [ ] Rechaza `pesoKg: 0`, `pesoKg: -3`, `pesoKg: "10"`.
- [ ] Rechaza `clasificacionSalud: "SANO"` (valor fuera del enum).
- [ ] Rechaza `observacionInicial: ""` y `observacionInicial` ausente.
- [ ] Rechaza `requiereCuarentena` ausente.
- [ ] Rechaza campos extra (`unrecognized_keys`).

---

## 10. Criterios de aceptación

- [ ] Los cuatro campos son obligatorios y el backend los valida (no solo el formulario).
- [ ] La clasificación solo admite `NORMAL`, `ENFERMO`, `CRITICO`.
- [ ] El peso es mayor a 0 y numérico.
- [ ] La observación es obligatoria y no vacía.
- [ ] La cuarentena es una decisión del revisor, guardada como sí/no.
- [ ] Al completar, el estado pasa a `VALIDACION_PENDIENTE`.
- [ ] La respuesta expone la prioridad de atención derivada de la clasificación.
- [ ] Un usuario con rol ajeno recibe **403**, no 404 ni 500.
- [ ] `pesoKg` llega al cliente como número, no como objeto Decimal.

---

## 11. Frontend

- [ ] `validations/revisionInicialValidation.js` — espejo exacto de `revisionInicialSchema`.
- [ ] `components/registroMedico/RevisionInicialForm.jsx`:
  - [ ] Campo peso (numérico, `step="0.01"`).
  - [ ] Select de clasificación con **exactamente** las tres opciones del requisito.
  - [ ] Textarea de observación (obligatorio).
  - [ ] Checkbox "Requiere cuarentena".
  - [ ] Aviso informative: si la clasificación es `ENFERMO` o `CRITICO`, mostrar "Prioridad de atención alta/media" **derivada del mismo valor**, no una segunda fuente.
- [ ] `services/registroMedicoService.js` sobre `services/api.js`.
- [ ] `pages/RegistroMedicoPage.jsx` — si el registro está `PROVISIONAL`, mostrar el formulario; si no, mostrar los datos y no el formulario.
- [ ] `hooks/useFormulario.js` ya cubre la validación con esquema: reúsalo, no escribas un `useState` con validación a mano.

---

## 12. Trampas

1. **Campos `NOT NULL` en Prisma.** El registro nace vacío en r1. Obligatoriedad = Zod, no esquema.
2. **`Float` para el peso.** `Decimal(5,2)` y convertir a `Number()` en el servicio. Un `Decimal.js` sin convertir rompe el JSON y las comparaciones `===`.
3. **Prioridad persistida y desincronizada.** Si eliges D-4 Opción A (derivada), nunca guardes `prioridad` en la base.
4. **Reutilizar `IngresoAnimal.estadoSalud`.** Es texto libre del requisito 1, no validado, y crearía dos fuentes de verdad.
5. **Confiar en el frontend para los roles.** El permiso se comprueba en el **servicio**. Ocultar el botón es cosmético.
6. **`strictObject` desincronizado.** Si agregas un campo al formulario y no al esquema del backend, recibes 400 con `unrecognized_keys` y no sabes de dónde. Mantén los esquemas espejo.
7. **Animal egresado.** No verifiques solo el `estado` del registro: mira también `FichaAnimal.estadoEstadia`.