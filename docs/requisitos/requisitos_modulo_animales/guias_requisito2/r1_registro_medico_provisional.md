- fecha : 14/10
# r1 — Registro médico provisional y automático

> Requisito de origen: `requisito2.md`, punto `r1`
> Guía general: [`../guia_requisito2.md`](../guia_requisito2.md)
> Estado que produce: `PROVISIONAL`

---

## 1. Requisito citado

> el sistema debe crear automáticamente un registro provisional medico **único y actualizable** asociado a la ficha de un animal previamente registrado e ingresado en el sistema, guardando su **fecha y hora de creación**, después de que la ficha, ingreso y registro medico sean creados, el animal pasara por una revisión inicial realizada por un voluntario autorizado o la medica veterinaria y la revision final realizada solo por la medica veterinaria.

---

## 2. Qué exige y qué no

**Exige:**
- Que al crear ficha + ingreso se cree **sin intervención del usuario** un registro médico provisional.
- Que ese registro sea **único** por ficha.
- Que sea **actualizable** (solo se crea; las actualizaciones son r4 y r5).
- Que guarde **fecha y hora de creación** de forma explícita.
- Que el flujo posterior sea: revisión inicial (voluntario autorizado **o** veterinaria) → revisión final (solo veterinaria).

**No exige:**
- Que exista un endpoint para crear el registro a mano. Si el usuario puede crearlo, deja de ser automático y único.
- El contenido de la revisión inicial (r2) ni de la final (r3).
- Notificaciones.

---

## 3. Dependencias

- **Prerrequisito:** merge de `origin/dev` y aplicar los enums/modelo base de la sección 4 de la guía general.
- **No depende** de r2…r6.
- **Desbloquea:** todos los demás requisitos.

---

## 4. Decisiones de este requisito

**D-1 — ¿El reingreso crea un registro médico nuevo?**
- **Opción A (recomendada):** no. El `@@unique([fichaAnimalId])` lo impide a nivel de base de datos. Traduce el `P2002` de Prisma a un error de dominio legible, no a un 500.
- Opción B: crear uno nuevo y archivar el anterior. Contradice "único".

**D-2 — ¿Y si se crea la ficha suelta con `POST /api/fichas` (sin ingreso)?**
- **Opción A (recomendada):** el registro médico se crea **solo** con el ingreso, porque el requisito dice "asociado a la ficha de un animal previamente registrado **e ingresado**". `crearFicha` a secas no genera registro médico.
- Opción B: crearlo también en `crearFicha`. El animal queda con registro médico sin revisión y sin ingreso asociado. Más ruido que valor.

**D-3 — ¿Qué autor tiene la creación automática?**
No hay autor humano: lo crea el sistema. Se deja `autorId` en `null` en el registro inicial, o se documenta el `ingresoAnimalId` como procedencia. La creación automática no genera auditoría de campo (eso es de r4).

---

## 5. Modelo de datos

Solo el modelo base, ya definido en la guía general:

```prisma
enum EstadoRegistroMedico {
  PROVISIONAL
  VALIDACION_PENDIENTE
  REVISANDO
  ACTUALIZADO
  REALIZADO
}

model RegistroMedico {
  id              Int                @id @default(autoincrement())
  fichaAnimalId   Int                @unique
  fichaAnimal     FichaAnimal        @relation(fields: [fichaAnimalId], references: [id])
  ingresoAnimalId Int?
  ingresoAnimal   IngresoAnimal?     @relation(fields: [ingresoAnimalId], references: [id])

  estado        EstadoRegistroMedico @default(PROVISIONAL)
  fechaCreacion DateTime             @default(now())

  createdAt DateTime @default(now())

  @@index([estado])
}
```

**Relaciones inversas que no debes olvidar** (si no, `prisma generate` falla):

```prisma
model FichaAnimal {
  // …campos existentes
  registroMedico RegistroMedico?
}

model IngresoAnimal {
  // …campos existentes
  registroMedico RegistroMedico?
}
```

---

## 6. Contrato de API

r1 **no expone endpoints propios**. La creación ocurre dentro de `POST /api/animales/ingresos`, que ya existe.

Cambio en la respuesta de `registrarIngreso` (requisito 1):

```json
{
  "ficha": { "id": 1, "codigoAnimal": "HSH-0001" },
  "reingreso": false,
  "registroMedico": { "id": 10, "estado": "PROVISIONAL", "fechaCreacion": "2026-10-14T15:04:05.000Z" }
}
```

El frontend usa ese `registroMedico.id` para navegar a la revisión inicial (r2).

---

## 7. Archivos

**Crear:**
- `backend/src/repositories/registroMedicoRepository.js`
- `backend/src/entities/registroMedicoErrors.js`

**Modificar:**
- `backend/prisma/schema.prisma` (enums, `RegistroMedico`, relaciones inversas)
- `backend/src/services/animalService.js` (transacción)
- `backend/src/handlers/manejadorErrores.js` (reconocer `RegistroMedicoError`)
- `backend/tests/services/animalService.test.js`

---

## 8. Tareas ordenadas

- [ ] **1.** Merge de `origin/dev` (guía general §3). Sin esto `FichaAnimal` no tiene la estructura final.
- [ ] **2.** Añadir `enum EstadoRegistroMedico` y `model RegistroMedico` en `schema.prisma`.
- [ ] **3.** Añadir `registroMedico RegistroMedico?` en `FichaAnimal` y `IngresoAnimal`.
- [ ] **4.** `npm run prisma:migrate` → `prisma/migrations/AAAAMMDDHHMMSS_registro_medico/`.
- [ ] **5.** `npm run prisma:generate`.
- [ ] **6.** Crear `registroMedicoErrors.js` con `RegistroMedicoError` (mismo shape que `AnimalError`: `codigo`, `estadoHttp`, `opcion`) y el código `REGISTRO_MEDICO_DUPLICADO` (409).
- [ ] **7.** Extender `manejadorErrores.js` con `esErrorRegistroMedico`, siguiendo el bloque de `esErrorAnimal`.
- [ ] **8.** Crear `registroMedicoRepository.js`:
  - [ ] `crearRegistroMedico(datos, cliente = prisma)`
  - [ ] `obtenerRegistroMedicoPorFicha(fichaAnimalId, cliente = prisma)`
  - [ ] `obtenerRegistroMedicoPorId(id, cliente = prisma)`
- [ ] **9.** En `animalService.js`, añadir `crearRegistroMedico` a `DEPENDENCIAS_POR_DEFECTO`.
- [ ] **10.** En `registrarIngresoInicial`, dentro del **mismo** `guardarEnTransaccion` que crea ficha e ingreso, crear el registro médico. Nada de un `await` suelto después.
- [ ] **11.** En `registrarReingresoPorDevolucion`, **no** crear registro médico. Si por lo que sea existe, traducir `P2002` a `REGISTRO_MEDICO_DUPLICADO`.
- [ ] **12.** Devolver `registroMedico` en el retorno de `registrarIngreso`.
- [ ] **13.** Actualizar `tests/services/animalService.test.js` (ver sección 9).

---

## 9. Tests

`backend/tests/services/animalService.test.js` — el test usa un doble de `ejecutarEnTransaccion`. Casos concretos:

- [ ] Ingreso inicial: se llama a `crearFichaAnimal`, `crearIngresoAnimal` **y** `crearRegistroMedico`, en ese orden, con el **mismo** `cliente` transaccional.
- [ ] Si `crearRegistroMedico` falla, la excepción sale del servicio (la transacción revierte).
- [ ] Reingreso: **no** se llama a `crearRegistroMedico`.
- [ ] Reingreso con `P2002` en la ficha → error de dominio, no 500.
- [ ] El retorno incluye `registroMedico.estado === "PROVISIONAL"`.

Test adicional sugerido en `tests/repositories/registroMedicoRepository.test.js`:

- [ ] Crear dos registros para la misma ficha lanza el `@@unique`.

---

## 10. Criterios de aceptación

- [ ] Un ingreso nuevo **siempre** deja ficha + ingreso + registro médico, todo en una transacción.
- [ ] El registro nace en `PROVISIONAL`.
- [ ] `fechaCreacion` queda poblada y es distinta de `updatedAt`.
- [ ] Un reingreso **no** duplica el registro médico.
- [ ] `POST /api/fichas` (ficha suelta) **no** crea registro médico.
- [ ] El cliente puede leer `registroMedico.id` en la respuesta del ingreso.
- [ ] `npm test` en verde.

---

## 11. Frontend

- [ ] `RegistroPage.jsx`: tras un ingreso exitoso, mostrar un aviso con el código del animal y **enlazar** a la revisión inicial usando `registroMedico.id`.
- [ ] Estado vacío: si el usuario entra a la ficha de un animal sin registro médico (ficha suelta), informar que el registro se crea al ingresar el animal, no al crear la ficha.
- [ ] `services/animalesService.js`: no requiere cambios de contrato; solo leer el campo nuevo.

---

## 12. Trampas

1. **Crear el registro médico fuera de la transacción.** Si `crearRegistroMedico` va en un `await` aparte, una caída deja fichas sin registro médico y el requisito de "único y automático" queda roto. Va **dentro** del mismo `ejecutarEnTransaccion`.
2. **Usar `@updatedAt` como fecha de creación.** El requisito pide fecha de creación explícita y separada. r4 y r5 escriben otras fechas; `@updatedAt` se contaminaría.
3. **Exponer un `POST /api/registros-medicos`.** Rompe "automático". Si el profe lo pide, Créalo solo para animals sin ingreso y documenta la excepción.
4. **`@@unique` como única defensa en el servicio.** La restricción está bien, pero el `P2002` sin traducir llega al cliente como 500.
5. **Olvidar las relaciones inversas.** Sin `registroMedico RegistroMedico?` en `FichaAnimal` e `IngresoAnimal`, `prisma generate` falla y no te das cuenta de por qué.
6. **`crearFicha` suelta sin registro médico** parece un bug pero es D-2 Opción A. Documéntalo en el código de la ruta para la defensa.