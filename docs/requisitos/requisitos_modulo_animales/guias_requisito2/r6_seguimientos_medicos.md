- fecha : 14/10
# r6 — Seguimientos médicos

> Requisito de origen: `requisito2.md`, punto `r6`
> Guía general: [`../guia_requisito2.md`](../guia_requisito2.md)
> Estado que produce: **ninguno** (no cambia el estado del registro médico)

---

## 1. Requisito citado

> el sistema guardara un seguimiento medico cada vez que cambie el **estado de salud**, el **peso** o las **necesidades** del animal. si el animal tiene enfermedades y/o tratamientos cada vez que esto se registre o cambie se registrara un nuevo seguimiento medico se guardara la **fecha de registro**, la **medica que lo registra**, **observacion de su seguimiento**, **estado de salud al momento del registro** y **peso del animal**. cuando se actualize sera creado un nuevo registro guardandose en el historial **sin sobreescribir el anterior**, tambien si es necesario se registrara el **seguimiento de cada enfermedad y cada tratamiento con su estado**.

---

## 2. Qué exige y qué no

**Exige:**
- Un seguimiento médico **cada vez** que cambie: estado de salud, peso o necesidades.
- Si hay enfermedades o tratamientos, cada registro o cambio de esos genera **un nuevo** seguimiento.
- Cada seguimiento guarda: **fecha de registro**, **médica que lo registra**, **observación**, **estado de salud al momento** y **peso del animal**.
- Al actualizar, se crea un **registro nuevo** en el historial; **nunca** se sobrescribe el anterior.
- Opcionalmente: seguimiento **de cada enfermedad** y **de cada tratamiento**, **con su estado**.

**No exige:**
- Cambiar el estado del registro médico. Un seguimiento no es una actualización de r5.
- Automatismo: "el sistema guardará" significa que el registro se crea como parte del flujo, pero la veterinary lo dispara.

---

## 3. Dependencias

- **r3** implementada: el seguimiento registra datos que existen tras la revisión final.
- **r5** recomendada: el seguimiento refleja el estado vigente del registro, que r5 mantiene versionado.
- Bloqueada por `puedeRegistrarSeguimiento` (solo `VETERINARIA`).
- Reusa `EstadoSeguimiento` de la guía general.

---

## 4. Decisiones de este requisito

**D-20 — ¿"Estado de salud al momento del registro"?**
- **Opción A (recomendada):** es una copia del valor vigente en el momento. Se guarda en el seguimiento como campo propio. Es append-only, así que "vigente" significa "el del último seguimiento".
- Opción B: no guardarlo y deducirlo del registro. Se rompe el requisito, que pide guardarlo explícitamente.

**D-21 — ¿"Necesidades del animal" es un campo propio?**
- **Opción A (recomendada):** `necesidades String?` en el seguimiento, texto libre. El requisito lo menciona como disparador y como dato, pero no lo define.
- Opción B: modelarlo con la estructura de `AtencionSanitaria`. Más estructurado, pero el requisito no lo pide y separa el dato de la observación.

**D-22 — ¿"Si es necesario" el seguimiento por enfermedad/tratamiento, o siempre?**
- **Opción A (recomendada):** la tabla `SeguimientoEnfermedad` / `SeguimientoTratamiento` se puebla **solo si el animal tiene** enfermedades o tratamientos registradas. Si no tiene ninguno, las tablas quedan vacías y no es un error.
- Opción B: exigir siempre al menos una fila. Falsa: obligaría a inventar enfermedades.

**D-23 — ¿Las enfermedades y tratamientos son registros con estado propio, o texto?**
r3 los guarda como campos en `RegistroMedico` (boolean + detalle). Para r6, el seguimiento necesita **el estado de cada una**. Si se modelan como tablas separadas (`Enfermedad`, `Tratamiento`), r3 debería crearlas; si se quedan como campos, `SeguimientoEnfermedad` referencia por nombre.

- **Opción A (recomendada para el alcance actual):** `SeguimientoEnfermedad` y `SeguimientoTratamiento` guardan `nombre` + `estado` + `observacion` como snapshot del momento. Append-only, coherente con el resto del requisito y sin arrastrar a r3 a un rediseño.
- Opción B: crear `Enfermedad` y `Tratamiento` como entidades con id, y que r3 y r6 las usen. Más limpio a largo plazo, pero obliga a volver a r3.

> Si eliges B, hazlo antes de implementar r3; después es un cambio de schema más caro.

**D-24 — ¿"Estado de salud" del seguimiento es `ClasificacionSalud` (NORMAL/ENFERMO/CRITICO) de r2?**
- **Opción A (recomendada): sí.** Reusa el enum. El requisito usa "estado de salud" en r2 para lo mismo.
- Opción B: un enum nuevo más granular. Innecesario.

---

## 5. Modelo de datos

```prisma
enum EstadoSeguimiento {
  EN_CURSO
  RESUELTO
  CRONICO
}

model SeguimientoMedico {
  id              Int           @id @default(autoincrement())
  registroMedicoId Int
  registroMedico  RegistroMedico @relation(fields: [registroMedicoId], references: [id], onDelete: Cascade)

  fechaRegistro      DateTime          @default(now())
  registradoPorId    Int
  registradoPor      Usuario           @relation(fields: [registradoPorId], references: [id])

  observacion        String
  estadoSalud        ClasificacionSalud
  pesoKg             Decimal?          @db.Decimal(5, 2)
  necesidades        String?

  enfermedades   SeguimientoEnfermedad[]
  tratamientos   SeguimientoTratamiento[]

  @@index([registroMedicoId, fechaRegistro])
}

model SeguimientoEnfermedad {
  id               Int            @id @default(autoincrement())
  seguimientoMedicoId Int
  seguimientoMedico SeguimientoMedico @relation(fields: [seguimientoMedicoId], references: [id], onDelete: Cascade)

  nombre       String
  estado       EstadoSeguimiento
  observacion  String?

  @@index([seguimientoMedicoId])
}

model SeguimientoTratamiento {
  id               Int            @id @default(autoincrement())
  seguimientoMedicoId Int
  seguimientoMedico SeguimientoMedico @relation(fields: [seguimientoMedicoId], references: [id], onDelete: Cascade)

  nombre       String
  estado       EstadoSeguimiento
  observaciones String?

  @@index([seguimientoMedicoId])
}
```

**Reglas de apéndice (append-only):**
- `SeguimientoMedico`, `SeguimientoEnfermedad` y `SeguimientoTratamiento` **no tienen rutas de actualización ni de borrado**. Solo `POST` de creación y `GET` de lectura.
- Si una enfermedad cambia de estado, se crea un **seguimiento nuevo** con la enfermedad en su nuevo estado. El anterior queda como estaba.
- El repositorio de estos modelos **no expone** `actualizar` ni `eliminar`. Es la defensa a nivel de código, no solo de UI.

**Relaciones inversas necesarias:** en `Usuario`, `seguimientosRegistrados`.

---

## 6. Contrato de API

### `POST /api/registros-medicos/:id/seguimientos`

**Rol:** solo `VETERINARIA` (`puedeRegistrarSeguimiento`).

**Body** (`z.strictObject`):

```js
export const seguimientoMedicoSchema = z.strictObject({
  observacion: z.string().trim().min(1, {
    message: "La observacion del seguimiento es obligatoria",
  }),
  estadoSalud: z.enum(["NORMAL", "ENFERMO", "CRITICO"], {
    message: "El estado de salud debe ser NORMAL, ENFERMO o CRITICO",
  }),
  pesoKg: z.number().positive().optional(),
  necesidades: z.string().trim().min(1).optional(),

  enfermedades: z
    .array(
      z.strictObject({
        nombre: z.string().trim().min(1),
        estado: z.enum(["EN_CURSO", "RESUELTO", "CRONICO"]),
        observacion: z.string().trim().min(1).optional(),
      }),
    )
    .optional(),

  tratamientos: z
    .array(
      z.strictObject({
        nombre: z.string().trim().min(1),
        estado: z.enum(["EN_CURSO", "RESUELTO", "CRONICO"]),
        observaciones: z.string().trim().min(1).optional(),
      }),
    )
    .optional(),
});
```

**Reglas:**
- `observacion` y `estadoSalud` son **obligatorios**. El requisito los lista sin excepción.
- `pesoKg`, si viene, debe ser mayor a 0.
- `enfermedades` y `tratamientos` son arrays **opcionales**. Si el animal no tiene, se omiten (D-22).
- Si el registro tiene `enfermedades === true` (r3) y el seguimiento viene sin el array `enfermedades`, se acepta: el requisito dice "si es necesario".

**Respuesta 201:**

```json
{
  "seguimiento": {
    "id": 40,
    "fechaRegistro": "2026-10-16T10:00:00.000Z",
    "registradoPor": { "id": 2, "nombre": "Dra. María López", "rol": "VETERINARIA" },
    "observacion": "El animal deja de comer y sigue con la misma tos",
    "estadoSalud": "ENFERMO",
    "pesoKg": 11.2,
    "necesidades": "Alimento suave y supervisión al comer",
    "enfermedades": [{ "nombre": "Tos", "estado": "EN_CURSO" }],
    "tratamientos": [{ "nombre": "Jarabe expectorante", "estado": "EN_CURSO" }]
  }
}
```

### `GET /api/registros-medicos/:id/seguimientos`

Devuelve todos los seguimientos en orden **cronológico descendente** (más reciente primero), cada uno con sus enfermedades y tratamientos embebidos.

**Errores de dominio:**

| Código | HTTP | Cuándo |
|--------|------|--------|
| `REGISTRO_MEDICO_INEXISTENTE` | 404 | No existe |
| `ROL_INSUFICIENTE` | 403 | El actor no es `VETERINARIA` |
| `ESTADO_INVALIDO` | 409 | El registro aún no pasó la revisión final |

---

## 7. Archivos

**Crear:**
- `backend/src/repositories/seguimientoMedicoRepository.js`

**Modificar:**
- `backend/prisma/schema.prisma` (`EstadoSeguimiento`, tres modelos, relación inversa en `Usuario`)
- `backend/src/services/permisosUsuario.js` (`puedeRegistrarSeguimiento`)
- `backend/src/validations/registroMedicoValidation.js` (`seguimientoMedicoSchema`)
- `backend/src/services/registroMedicoService.js` (`registrarSeguimiento`)
- `backend/src/controllers/registroMedicoController.js`
- `backend/src/routes/registroMedicoRoutes.js`

---

## 8. Tareas ordenadas

- [ ] **1.** Resolver D-23 antes de escribir código. Si eliges Opción B, ajusta r3 primero.
- [ ] **2.** Añadir `enum EstadoSeguimiento` y los tres modelos a `schema.prisma`.
- [ ] **3.** Añadir la relación inversa `seguimientosRegistrados` en `Usuario`.
- [ ] **4.** `npm run prisma:migrate` + `npm run prisma:generate`.
- [ ] **5.** Añadir `puedeRegistrarSeguimiento(actor)` a `permisosUsuario.js` con test.
- [ ] **6.** Crear `seguimientoMedicoRepository.js`. **Solo** `crearSeguimiento` y `listarSeguimientos`. No escribas un `actualizarSeguimiento` "por si acaso": el requisito es explícito.
- [ ] **7.** Escribir `seguimientoMedicoSchema`.
- [ ] **8.** Implementar `registrarSeguimiento` en `registroMedicoService.js`:
  - [ ] Validar permiso y estado del registro (`REALIZADO` o `ACTUALIZADO`).
  - [ ] Convertir `pesoKg` a `Decimal` si viene.
  - [ ] **En una transacción**: crear el `SeguimientoMedico` y sus hijos `SeguimientoEnfermedad` / `SeguimientoTratamiento`.
  - [ ] Devolver el seguimiento con el autor resuelto.
- [ ] **9.** Añadir `POST /:id/seguimientos` y `GET /:id/seguimientos` a las rutas.
- [ ] **10.** **No** añadir rutas `PATCH`/`DELETE` de seguimiento.
- [ ] **11.** Tests (sección 9).

---

## 9. Tests

**`tests/services/registroMedicoService.test.js`:**

- [ ] `VETERINARIA` registra un seguimiento → 201, con `fechaRegistro` y `registradoPor`.
- [ ] `VOLUNTARIO` recibe 403.
- [ ] Sin `observacion` → 400.
- [ ] Sin `estadoSalud` → 400.
- [ ] Sin `estadoSalud` o con `pesoKg <= 0` → 400.
- [ ] Registro en `VALIDACION_PENDIENTE` → 409 `ESTADO_INVALIDO`.
- [ ] Con `enfermedades: [{...}]`, se crean las filas `SeguimientoEnfermedad` correctas.
- [ ] Con `tratamientos: [{...}]`, se crean las filas `SeguimientoTratamiento` correctas.
- [ ] **Append-only:** crear un segundo seguimiento **no** modifica el primero. Verifica que `listarSeguimientos` devuelve 2 y que el primero conserva su `estadoSalud` original.
- [ ] Cambiar el estado de una enfermedad genera un **nuevo** seguimiento, no actualiza el anterior.
- [ ] Sin enfermedades ni tratamientos, se crea el seguimiento igual (no es error).
- [ ] Si falla la creación de una enfermedad, no queda el seguimiento huérfano.
- [ ] `pesoKg` llega al cliente como `Number()`.

**Test estructural (importante):**

- [ ] Un test que verifique que `seguimientoMedicoRepository.js` **no exporta** ninguna función de actualización o borrado. Puede ser una aserción sobre el módulo importado.

---

## 10. Criterios de aceptación

- [ ] Cada cambio de estado de salud, peso o necesidades genera un seguimiento nuevo.
- [ ] Cada seguimiento guarda fecha, médica que lo registra, observación, estado de salud y peso.
- [ ] El historial **nunca** se sobrescribe: los seguimientos anteriores quedan intactos.
- [ ] El estado de cada enfermedad y de cada tratamiento queda registrado en su seguimiento.
- [ ] No existen endpoints que modifiquen o borren un seguimiento.
- [ ] Solo la veterinaria registra seguimientos.
- [ ] Un seguimiento **no** cambia el estado del registro médico.
- [ ] `npm test` en verde.

---

## 11. Frontend

- [ ] `validations/seguimientoMedicoValidation.js` — espejo del esquema.
- [ ] `components/registroMedico/SeguimientoForm.jsx`:
  - [ ] Fecha automática (el backend la pone).
  - [ ] Observación (obligatorio) y estado de salud (select con los tres valores de r2).
  - [ ] Peso: precargar con el peso vigente como sugerencia, editable.
  - [ ] Necesidades (opcional).
  - [ ] Listas dinámicas de enfermedades y tratamientos, cada una con nombre + estado + observación. Se muestran solo si el animal tiene alguna registrada (D-22).
- [ ] `components/registroMedico/HistorialSeguimientos.jsx`: línea de tiempo cronológica inversa. Cada entrada muestra los datos **de ese momento**, no los actuales.
- [ ] `pages/RegistroMedicoPage.jsx`: sección de seguimientos visible cuando el registro está en `REALIZADO` o `ACTUALIZADO`.

> El punto visual clave: el historial de seguimientos muestra el estado **histórico**, nunca se sobreescribe con el vigente. Si el peso cambió, las entradas antiguas conservan su peso.

---

## 12. Trampas

1. **Crear un `PATCH` de seguimiento.** El requisito dice explícitamente "sin sobreescribir el anterior". Un endpoint de actualización destruye el historial. No lo escribas, aunque "sea útil".
2. **Reutilizar `HistorialRegistroMedico` de r5.** Son cosas distintas: r5 versiona el **registro médico**, r6 registra **eventos de seguimiento** en el tiempo. No son la misma tabla.
3. **No guardar `estadoSalud` ni `pesoKg` en el seguimiento.** El requisito los pide explícitamente. Deducirlos del registro actual es incorrecto en un historial.
4. **Exigir enfermedades o tratamientos siempre.** Un animal sano no tiene ninguna. Si lo haces obligatorio, bloqueas seguimientos legítimos.
5. **Snake_case en los enums de este módulo.** El proyecto usa valores en español en minúscula para `TipoAtencionSanitaria` (`vacuna`, `desparasitacion`) y MAYÚSCULAS para los enums que ya estaban (`Especie`, `EstadoPostulacion`). `EstadoSeguimiento` es nuevo: usa MAYÚSCULAS (`EN_CURSO`) para mantener coherencia con los enums del módulo médico.
6. **Actualizar el estado de salud del registro desde un seguimiento.** El seguimiento es un evento, no una edición. El estado del registro solo cambia en r3 y r5.
7. **`pesoKg` como `Float`.** Es `Decimal(5,2)` y se convierte a `Number()` en la respuesta.
8. **Falta la relación inversa en `Usuario`.** Sin `seguimientosRegistrados`, `prisma generate` falla.