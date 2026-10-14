- fecha : 14/10
# r3 — Revisión final de la médica veterinaria

> Requisito de origen: `requisito2.md`, punto `r3`
> Guía general: [`../guia_requisito2.md`](../guia_requisito2.md)
> Estado que produce: `REALIZADO`

---

## 1. Requisito citado

> La medica veterinaria del refugio realizara la revisión final para **completar el registro medico** del animal y decidirá si el animal esta en condiciones para ser adoptado. En esta revisión se **revalidara el peso** y se registraran los **resultados de las evaluaciones** detallando si existen **enfermedades, condiciones, discapacidades, lesiones**, también se realizara un **control sanitario** (vacunación, desparasitación y cuando corresponda esterilización) y se registrara un **tratamiento** (medicamentos, cuidados, otros) en caso de necesitarlo, después de completar la revisión el estado del registro medico cambiara a **realizado** y la medica veterinaria decidirá si el animal esta en condiciones aptas para ser adoptado cambiando el estado del animal en la ficha a **"adoptable"**, en caso de que no este disponible por decisión de la veterinaria, ella cambiara el estado a **"no adoptable"**.

---

## 2. Qué exige y qué no

**Exige:**
- Que solo la **médica veterinaria** pueda hacerlo.
- **Revalidar el peso** (obligatorio; es una nueva medición, no copiar el de r2).
- Registrar los resultados de evaluación de **enfermedades, condiciones, discapacidades y lesiones** (los cuatro).
- **Control sanitario**: vacunación, desparasitación y esterilización cuando corresponda.
- **Tratamiento** si necesita: medicamentos, cuidados, otros.
- Transición del registro a `REALIZADO`.
- **Proyección a la ficha** del estado de adopción: `adoptable` o `no adoptable`.

**No exige:**
- Controles sanitarios textos inventados: ya existe `AtencionSanitaria`.
- Revisar más de una vez (eso es r5).
- Seguimientos posteriores (eso es r6).

---

## 3. Dependencias

- **r2** completa: sin revisión inicial el estado no es `VALIDACION_PENDIENTE`.
- Bloqueada por `puedeRealizarRevisionFinal` (solo `VETERINARIA`).
- **Reusa `AtencionSanitaria`** del módulo sanitario que ya existe en `origin/dev`.

---

## 4. Decisiones de este requisito

**D-7 — ¿Cómo se modelan los resultados de evaluación (enfermedades/condiciones/discapacidades/lesiones)?**
- **Opción A (recomendada):** cada una es un campo `Boolean` (`enfermedades`, `condiciones`, `discapacidades`, `lesiones`) **más** un texto de detalle opcional por cada una. El requisito dice "detallando si existen", así que el sí/no es obligatorio y el detalle es el que explica.
- Opción B: un solo texto libre con las cuatro categorías. Más simple, pero no permite filtrar ni validar que la veterinaria las revisó.

**D-8 — ¿El control sanitario va en `RegistroMedico` o en `AtencionSanitaria`?**
- **Opción A (recomendada y ya decidida): reusar `AtencionSanitaria`.** El modelo ya existe con `TipoAtencionSanitaria { vacuna, tratamiento, control, desparasitacion, esterilizacion }` y `EstadoAtencionSanitaria { PENDIENTE, REALIZADA, CANCELADA }`, y `alertasSanitarias.service.js` ya calcula alertas sobre él. Crear `planVacunacion` / `planDesparasitacion` / `planEsterilizacion` como texto duplicaría el módulo sanitario y rompería las alertas.
- Opción B: campos de texto propios. Descartada.

**D-9 — ¿"Cuando corresponda esterilización"?**
Se resuelve con el modelo: si el animal **no** está esterilizado y la veterinaria marca que corresponde, se crea la atención con `tipo: "esterilizacion"`. No hace falta un flag nuevo.

**D-10 — ¿Dónde vive "adoptable"?**
Ver **D-ADOPCION** en la guía general. **Opción A (recomendada):** `FichaAnimal.estadoAdopcion` con `enum EstadoAdopcion { ADOPTABLE, NO_ADOPTABLE }`. Separate de `estadoEstadia`, que ya tiene `ESPERA_ADOPCION` con otro significado.

**D-11 — ¿La decisión de adopción es obligatoria?**
Sí. Sin `adoptabilidad` explícita no se puede pasar a `REALIZADO`: el requisito dice que la veterinaria **decide**. Sin decisión, error 400.

---

## 5. Modelo de datos

### Campos que r3 añade a `RegistroMedico`

```prisma
model RegistroMedico {
  // …modelo base + campos de r2

  pesoRevalidadoKg      Decimal?   @db.Decimal(5, 2)
  fechaRevalidacionPeso DateTime?

  enfermedades          Boolean    @default(false)
  detalleEnfermedades   String?
  condiciones           Boolean    @default(false)
  detalleCondiciones    String?
  discapacidades        Boolean    @default(false)
  detalleDiscapacidades String?
  lesiones              Boolean    @default(false)
  detalleLesiones       String?

  requiereTratamiento   Boolean    @default(false)
  medicamentos          String?
  cuidados              String?
  otrosTratamientos     String?

  adoptabilidad         EstadoAdopcion?
  fechaRevisionFinal    DateTime?
  revisionFinalPorId    Int?
  revisionFinalPor      Usuario?    @relation(fields: [revisionFinalPorId], references: [id])
}
```

> Lo *nullable* vale porque el registro nace vacío. El endpoint los exige.
> `pesoRevalidadoKg` es **distinto** de `pesoKg` de r2: r2 es el peso del voluntario, r3 es la revalidación de la veterinaria. No sobrescribas uno con el otro.

### Enum nuevo

```prisma
enum EstadoAdopcion {
  ADOPTABLE
  NO_ADOPTABLE
}
```

### `FichaAnimal`

```prisma
model FichaAnimal {
  // …campos existentes
  estadoAdopcion EstadoAdopcion?
}
```

### Control sanitario: reuso de `AtencionSanitaria`

No hay modelo nuevo. La revisión final **crea filas** en el modelo existente:

```js
// Ejemplo de filas creadas por una revisión final con:
// vacuna=true, desparasitacion=true, esterilizacion=true
[
  { tipo: "vacuna",          estado: "REALIZADA", fechaProgramada, fechaRealizacion },
  { tipo: "desparasitacion", estado: "REALIZADA", fechaProgramada, fechaRealizacion },
  { tipo: "esterilizacion",  estado: "REALIZADA", fechaProgramada, fechaRealizacion },
]
```

`AtencionSanitaria` ya tiene `fichaAnimalId`, `tipo`, `fechaProgramada @db.Date`, `estado`, `fechaRealizacion @db.Date`, `observaciones`. Si la veterinaria decide que algo queda pendiente, se crea con `estado: "PENDIENTE"` y así `alertasPlan.service.js` lo reporta automáticamente.

---

## 6. Contrato de API

### `POST /api/registros-medicos/:id/validacion`

**Rol:** solo `VETERINARIA` (`puedeRealizarRevisionFinal`).

**Body** (`z.strictObject`):

```js
export const revisionFinalSchema = z.strictObject({
  pesoRevalidadoKg: z.number().positive({
    message: "El peso revalidado debe ser mayor a 0",
  }),

  enfermedades:   z.boolean(),
  detalleEnfermedades: z.string().trim().min(1).optional(),
  condiciones:    z.boolean(),
  detalleCondiciones: z.string().trim().min(1).optional(),
  discapacidades: z.boolean(),
  detalleDiscapacidades: z.string().trim().min(1).optional(),
  lesiones:       z.boolean(),
  detalleLesiones: z.string().trim().min(1).optional(),

  requiereTratamiento: z.boolean(),
  medicamentos:  z.string().trim().min(1).optional(),
  cuidados:     z.string().trim().min(1).optional(),
  otrosTratamientos: z.string().trim().min(1).optional(),

  controlSanitario: z.strictObject({
    vacunacion:     z.boolean(),
    desparasitacion: z.boolean(),
    esterilizacion: z.boolean(),
  }).optional(),

  adoptabilidad: z.enum(["ADOPTABLE", "NO_ADOPTABLE"], {
    message: "Debe indicar si el animal es adoptable o no adoptable",
  }),
});
```

**Refinamientos cruzados** (`superRefine`):

- Si `enfermedades === true` y no hay `detalleEnfermedades` → error.
- Idem para `condiciones`, `discapacidades`, `lesiones`.
- Si `requiereTratamiento === true` y los tres campos de tratamiento están vacíos → error.
- Si `requiereTratamiento === false` y viene algún tratamiento → error.

**Respuesta 200:**

```json
{
  "registroMedico": {
    "id": 10,
    "estado": "REALIZADO",
    "pesoKg": 12.4,
    "pesoRevalidadoKg": 12.1,
    "enfermedades": true,
    "adoptabilidad": "ADOPTABLE",
    "atencionesSanitarias": [
      { "id": 5, "tipo": "vacuna", "estado": "REALIZADA" },
      { "id": 6, "tipo": "desparasitacion", "estado": "REALIZADA" }
    ]
  },
  "ficha": { "id": 1, "estadoAdopcion": "ADOPTABLE" }
}
```

**Errores de dominio:**

| Código | HTTP | Cuándo |
|--------|------|--------|
| `REGISTRO_MEDICO_INEXISTENTE` | 404 | No existe |
| `ROL_INSUFICIENTE` | 403 | El actor no es `VETERINARIA` |
| `ESTADO_INVALIDO` | 409 | El registro no está en `VALIDACION_PENDIENTE` |
| `REVISION_INICIAL_REQUERIDA` | 409 | Se intentó revisar sin revisión inicial |

---

## 7. Archivos

**Crear:**
- `backend/src/validations/registroMedicoValidation.js` (añadir `revisionFinalSchema`)

**Modificar:**
- `backend/prisma/schema.prisma` (`EstadoAdopcion`, campos de r3, `FichaAnimal.estadoAdopcion`, relaciones inversas en `Usuario`)
- `backend/src/repositories/atencionSanitariaRepository.js` (añadir `crearAtencionesSanitarias`)
- `backend/src/services/permisosUsuario.js` (`puedeRealizarRevisionFinal`)
- `backend/src/services/registroMedicoService.js` (`realizarRevisionFinal`)
- `backend/src/controllers/registroMedicoController.js`
- `backend/src/routes/registroMedicoRoutes.js`

---

## 8. Tareas ordenadas

- [ ] **1.** Añadir `enum EstadoAdopcion` y los campos de r3 a `schema.prisma`.
- [ ] **2.** Añadir `estadoAdopcion EstadoAdopcion?` a `FichaAnimal`.
- [ ] **3.** Añadir relaciones inversas en `Usuario`.
- [ ] **4.** `npm run prisma:migrate` + `npm run prisma:generate`.
- [ ] **5.** Añadir `puedeRealizarRevisionFinal(actor)` a `permisosUsuario.js` **con test**: `VETERINARIA` sí; `VOLUNTARIO`, `DIRECTORA`, `ENCARGADA_*` no; cuenta inactiva no.
- [ ] **6.** Añadir `crearAtencionesSanitarias(datos, cliente = prisma)` a `atencionSanitariaRepository.js`.
- [ ] **7.** Escribir `revisionFinalSchema` con los refinamientos cruzados.
- [ ] **8.** Implementar `realizarRevisionFinal` en `registroMedicoService.js`:
  - [ ] Validar permiso.
  - [ ] Validar estado `=== "VALIDACION_PENDIENTE"`.
  - [ ] **En una sola transacción**:
    1. `update` de `RegistroMedico` con los campos de r3, `estado: REALIZADO`, `fechaRevisionFinal`, `revisionFinalPorId`.
    2. Crear las filas de `AtencionSanitaria` que corresponda.
    3. `update` de `FichaAnimal.estadoAdopcion`.
  - [ ] Devolver registro + ficha + atenciones.
- [ ] **9.** Añadir la ruta `POST /:id/validacion` en `registroMedicoRoutes.js`.
- [ ] **10.** Tests (sección 9).

---

## 9. Tests

**`tests/services/registroMedicoService.test.js`:**

- [ ] `VETERINARIA` puede validar → estado `REALIZADO`.
- [ ] `VOLUNTARIO` recibe 403 `ROL_INSUFICIENTE` y **no** escribe nada.
- [ ] `DIRECTORA` recibe 403.
- [ ] `enfermedades: true` sin `detalleEnfermedades` → 400.
- [ ] `requiereTratamiento: true` sin ningún campo de tratamiento → 400.
- [ ] `requiereTratamiento: false` con `medicamentos` → 400.
- [ ] Registro en `PROVISIONAL` (sin revisión inicial) → 409.
- [ ] Registro ya en `REALIZADO` → 409.
- [ ] Con `adoptabilidad: "ADOPTABLE"`, `FichaAnimal.estadoAdopcion` queda `ADOPTABLE` **en la misma transacción**.
- [ ] Con `adoptabilidad: "NO_ADOPTABLE"`, `FichaAnimal.estadoAdopcion` queda `NO_ADOPTABLE`.
- [ ] Si falla la creación de una atención sanitaria, **no** se actualiza el registro (transacción atómica).
- [ ] `controlSanitario.vacunacion === true` crea exactamente una fila `tipo: "vacuna"`.
- [ ] `controlSanitario.esterilizacion === false` no crea fila de esterilización.
- [ ] `pesoKg` de r2 **no** se sobrescribe con `pesoRevalidadoKg`.

**`tests/validations/registroMedicoValidation.test.js`:**

- [ ] Rechaza peso revalidado `0` o negativo.
- [ ] Rechaza `adoptabilidad` ausente o inválida.
- [ ] Rechaza campos extra.

---

## 10. Criterios de aceptación

- [ ] Solo `VETERINARIA` puede completar la revisión final; el resto recibe 403.
- [ ] El peso revalidado es obligatorio y **distinto** del peso de la revisión inicial.
- [ ] Enfermedades, condiciones, discapacidades y lesiones se registran con sí/no + detalle cuando aplica.
- [ ] El control sanitario se guarda en `AtencionSanitaria`, no en campos de texto.
- [ ] El tratamiento se registra solo cuando se necesita y guarda medicamentos, cuidados y otros.
- [ ] Al completar, el registro pasa a `REALIZADO`.
- [ ] `FichaAnimal.estadoAdopcion` refleja la decisión, en la misma transacción.
- [ ] El registro médico **nunca** se borra y se hace `update`, no `delete`+`create`.
- [ ] `npm test` en verde.

---

## 11. Frontend

- [ ] `validations/revisionFinalValidation.js` — espejo del esquema con los mismos refinamientos.
- [ ] `components/registroMedico/ValidacionVeterinariaForm.jsx`:
  - [ ] Peso revalidado, precargado como sugerencia del peso de r2 pero editable.
  - [ ] Cuatro bloques (enfermedades / condiciones / discapacidades / lesiones): checkbox + textarea que se habilita solo si el checkbox está marcado.
  - [ ] Bloque de tratamiento: checkbox habilita los tres campos.
  - [ ] Bloque de control sanitario: tres checkboxes (vacunación, desparasitación, esterilización).
  - [ ] Select de adoptabilidad **obligatorio** (`ADOPTABLE` / `NO_ADOPTABLE`).
- [ ] `pages/RegistroMedicoPage.jsx`: el formulario de revisión final solo se renderiza si el estado es `VALIDACION_PENDIENTE`.
- [ ] Mostrar `pesoKg` (revisión inicial) y `pesoRevalidadoKg` (revisión final) **por separado** en el resumen.

---

## 12. Trampas

1. **Crear `planVacunacion` como texto.** Ya existe `AtencionSanitaria` con los cinco tipos exactos que pide el requisito. Duplicarlo rompe la integración con `alertasPlan.service.js`.
2. **Sobrescribir `pesoKg` con el peso revalidado.** Son dos mediciones distintas de dos actores distintos. Si solo guardas una, r2 pierde información y r4 audita un campo equivocado.
3. **Proyectar a `FichaAnimal` fuera de la transacción.** Si la revisión se guarda y la proyección falla, el sistema dice "ADOPTABLE" y la ficha dice otra cosa.
4. **`delete` + `create` al validar.** Pierdes el historial que r5 necesita. Siempre `update`.
5. **Permitir que el voluntario valide.** Ocultar el botón en React no es un control de permisos.
6. **`adoptabilidad` opcional.** El requisito dice que la veterinaria **decide**. Sin decisión no se sale de `VALIDACION_PENDIENTE`.
7. **Meter "lesiones" dentro de "enfermedades".** El requisito las lista por separado; cuatro campos, no tres.
8. **Adopción en `estadoEstadia`.** `ESPERA_ADOPCION` ya existe con otro significado. Usa `estadoAdopcion` (D-ADOPCION).