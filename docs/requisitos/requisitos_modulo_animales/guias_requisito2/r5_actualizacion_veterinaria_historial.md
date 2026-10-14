- fecha : 14/10
# r5 — Actualizaciones de la veterinaria con historial

> Requisito de origen: `requisito2.md`, punto `r5`
> Guía general: [`../guia_requisito2.md`](../guia_requisito2.md)
> Estados que produce: `REVISANDO` → `ACTUALIZADO`

---

## 1. Requisito citado

> La medica veterinaria puede **actualizar el registro medico cada vez que lo necesite**, cada actualización se guardara en un historial siendo el **ultimo actualizado considerado como el mas reciente y utilizado en el sistema**, en cada actualización se guardara **cuando** y **quien** realizo la actualización, cuando se este actualizando, el estado del registro medico pasara a **"revisando"** y pasara al estado **"actualizado"** cuando los cambios sean guardados, en caso de que se este actualizando el registro y los cambios no sean guardados y se cierre la instancia, **no se guardara nada y el estado volvera al ultimo registrado**.

---

## 2. Qué exige y qué no

**Exige:**
- La veterinaria puede actualizar **ilimitadas veces**.
- Cada actualización queda en un **historial**; la última es la vigente.
- Cada entrada guarda **cuándo** y **quién**.
- Mientras edita, el estado es `REVISANDO`.
- Al guardar, pasa a `ACTUALIZADO`.
- Si cierra la instancia **sin guardar**, no se persiste nada y el estado vuelve al último registrado.

**No exige:**
- Auditoría por campo (eso es r4, del voluntario).
- Reversión a `VALIDACION_PENDIENTE` (eso es r4).
- Seguimientos (eso es r6).

---

## 3. Dependencias

- **r3** implementada: la veterinaria actualiza un registro que ya pasó la revisión final.
- Bloqueada por `puedeActualizarRegistroMedico` (solo `VETERINARIA`).
- Reusa el estado `REVISANDO` de la máquina de estados de la guía general.

---

## 4. Decisiones de este requisito

**D-17 — ¿"Historial" es un snapshot o un diff?**
- **Opción A (recomendada):** **snapshot completo** del registro en cada versión. El requisito dice "el último actualizado considerado como el más reciente y **utilizado en el sistema**", así que el sistema lee la última versión completa. Un diff obligaría a reconstruir el estado recorriendo todas las versiones.
- Opción B: diff campo por campo (como la auditoría de r4). Más eficiente en espacio, pero la lectura del estado vigente es un repliegue. Si eliges B, tendrías dos mecanismos de versionado distintos (r4 y r5) con la misma tabla `AuditoriaCampo`, lo que se presta a confusión.

**D-18 — ¿Qué significa exactamente "se cierre la instancia"?**
La redacción es ambigua. Interpretación adoptada:
- Si la veterinaria abre el formulario y no guarda (cierra el modal o navega a otra página), **no se persiste nada** y el estado vuelve al último registrado.
- Si guarda y luego cierra el navegador, el registro ya quedó en `ACTUALIZADO` con su versión.

**Consecuencia de diseño:** el estado `REVISANDO` **nunca debe quedar persistido** como consecuencia de un abandono. Hay dos lecturas válidas:
- **Opción A (recomendada):** `REVISANDO` es un estado efímero que se escribe al abrir el formulario y se revierte al abandonar o al guardar. Si el proceso muere a mitad, hace falta reconciliación.
- **Opción B:** `REVISANDO` solo existe en la memoria del cliente (estado local del formulario) y nunca se persiste en la base. Es más simple e imposible de dejar colgado, pero entonces la base nunca muestra `REVISANDO`.

> Decide y documenta. Si eliges A, añade una tarea de reconciliación: al arrancar, `UPDATE` los registros en `REVISANDO` con más de N minutos a su último estado confirmado.

**D-19 — ¿Quién es "el último actualizado"?**
`HistorialRegistroMedico` con `version` incremental. La de mayor `version` es la vigente. El campo actual del `RegistroMedico` es la copia de trabajo; el historial es la verdad histórica.

---

## 5. Modelo de datos

### `HistorialRegistroMedico`

```prisma
model HistorialRegistroMedico {
  id              Int           @id @default(autoincrement())
  registroMedicoId Int
  registroMedico  RegistroMedico @relation(fields: [registroMedicoId], references: [id], onDelete: Cascade)

  version       Int
  estadoOrigen  EstadoRegistroMedico
  pesoKg              Decimal? @db.Decimal(5, 2)
  pesoRevalidadoKg    Decimal? @db.Decimal(5, 2)
  clasificacionSalud  ClasificacionSalud?
  observacionInicial  String?
  requiereCuarentena  Boolean?
  enfermedades        Boolean
  detalleEnfermedades String?
  condiciones         Boolean
  detalleCondiciones  String?
  discapacidades      Boolean
  detalleDiscapacidades String?
  lesiones            Boolean
  detalleLesiones     String?
  requiereTratamiento Boolean
  medicamentos        String?
  cuidados           String?
  otrosTratamientos  String?
  adoptabilidad      EstadoAdopcion?

  actualizadoPorId Int
  actualizadoPor   Usuario     @relation(fields: [actualizadoPorId], references: [id])
  fecha            DateTime    @default(now())

  @@unique([registroMedicoId, version])
  @@index([registroMedicoId, version])
}
```

- `version` arranca en 1 y se incrementa en cada guardado. El `@@unique` garantiza que no haya dos versiones con el mismo número.
- `estadoOrigen` guarda en qué estado estaba el registro antes de la actualización, para poder reconstruir la máquina de estados.
- `pesoKg` y `pesoRevalidadoKg` son `Decimal`. Conviértelos a `Number()` al leer.

---

## 6. Contrato de API

### `POST /api/registros-medicos/:id/actualizaciones`

**Rol:** solo `VETERINARIA` (`puedeActualizarRegistroMedico`).

**Body:** el subconjunto de campos que la veterinaria puede cambiar después de la revisión final:

```js
export const actualizacionRegistroSchema = z.strictObject({
  pesoRevalidadoKg: z.number().positive().optional(),
  enfermedades:     z.boolean().optional(),
  detalleEnfermedades: z.string().trim().min(1).optional(),
  condiciones: z.boolean().optional(),
  detalleCondiciones: z.string().trim().min(1).optional(),
  discapacidades: z.boolean().optional(),
  detalleDiscapacidades: z.string().trim().min(1).optional(),
  lesiones: z.boolean().optional(),
  detalleLesiones: z.string().trim().min(1).optional(),
  requiereTratamiento: z.boolean().optional(),
  medicamentos: z.string().trim().min(1).optional(),
  cuidados: z.string().trim().min(1).optional(),
  otrosTratamientos: z.string().trim().min(1).optional(),
  adoptabilidad: z.enum(["ADOPTABLE", "NO_ADOPTABLE"]).optional(),
});
```

**Reglas:**
- Solo campos clinicales. **No** acepta `pesoKg` ni `clasificacionSalud` (esos son de la revisión inicial del voluntario, r2).
- Al menos un campo debe venir. Cuerpo vacío → 400.
- Mismas refinaciones cruzadas que r3 para enfermedades/condiciones/discapacidades/lesiones/tratamiento.

**Respuesta 200:**

```json
{
  "registroMedico": {
    "id": 10,
    "estado": "ACTUALIZADO",
    "versionActual": 3
  },
  "historial": { "version": 3, "fecha": "2026-10-15T09:12:00.000Z", "actualizadoPor": "Dra. María López" }
}
```

**Errores de dominio:**

| Código | HTTP | Cuándo |
|--------|------|--------|
| `REGISTRO_MEDICO_INEXISTENTE` | 404 | No existe |
| `ROL_INSUFICIENTE` | 403 | El actor no es `VETERINARIA` |
| `ESTADO_INVALIDO` | 409 | El registro está en `PROVISIONAL` o `VALIDACION_PENDIENTE` |
| `SIN_CAMPOS_A_ACTUALIZAR` | 400 | Cuerpo vacío |

### Endpoint de lectura del historial

```
GET /api/registros-medicos/:id/historial
```

Devuelve todas las versiones ordenadas de **mayor a menor** `version`, cada una con su `actualizadoPor` y su `fecha`.

---

## 7. Archivos

**Crear:** nada nuevo a nivel de archivo; el historial vive en `registroMedicoRepository.js` y `registroMedicoService.js`.

**Modificar:**
- `backend/prisma/schema.prisma` (model `HistorialRegistroMedico`, relación inversa en `Usuario`)
- `backend/src/services/permisosUsuario.js` (`puedeActualizarRegistroMedico`)
- `backend/src/validations/registroMedicoValidation.js` (`actualizacionRegistroSchema`)
- `backend/src/repositories/registroMedicoRepository.js` (`crearVersionHistorial`, `listarHistorial`, `obtenerUltimaVersion`)
- `backend/src/services/registroMedicoService.js`
- `backend/src/entities/registroMedicoErrors.js`
- `backend/src/controllers/registroMedicoController.js`
- `backend/src/routes/registroMedicoRoutes.js`

---

## 8. Tareas ordenadas

- [ ] **1.** Añadir `HistorialRegistroMedico` a `schema.prisma` + relación inversa en `Usuario`.
- [ ] **2.** `npm run prisma:migrate` + `npm run prisma:generate`.
- [ ] **3.** Añadir `SIN_CAMPOS_A_ACTUALIZAR` a `registroMedicoErrors.js`.
- [ ] **4.** Añadir `puedeActualizarRegistroMedico(actor)` a `permisosUsuario.js` con test (solo `VETERINARIA`).
- [ ] **5.** Escribir `actualizacionRegistroSchema` con las refinaciones cruzadas.
- [ ] **6.** Añadir al repositorio: `crearVersionHistorial`, `listarHistorial`, `obtenerUltimaVersion`.
- [ ] **7.** Implementar `actualizarRegistro({ registroMedicoId, datos, actor, dependencias })`:
  - [ ] Validar permiso.
  - [ ] Validar estado: solo desde `REALIZADO` o `ACTUALIZADO`.
  - [ ] Calcular la siguiente `version` (`ultimaVersion + 1`).
  - [ ] **En una sola transacción**:
    1. `update` de `RegistroMedico` con los campos clínicos nuevos, `estado: "ACTUALIZADO"`.
    2. Crear la fila en `HistorialRegistroMedico` con el snapshot completo y `actualizadoPorId`, `fecha`.
  - [ ] Devolver registro + cabecera de la versión.
- [ ] **8.** Implementar la reversión por abandono (D-18 Opción A):
  - [ ] `POST /api/registros-medicos/:id/actualizaciones/inicio` → pone el estado en `REVISANDO` (ver D-18).
  - [ ] `POST /api/registros-medicos/:id/actualizaciones/cancelar` → vuelve al último estado confirmado, **sin** crear versión.
  - [ ] Si eliges Opción B de D-18, omite ambos endpoints y maneja `REVISANDO` solo en el cliente.
- [ ] **9.** Añadir `GET /:id/historial` y las rutas de inicio/cancelación.
- [ ] **10.** Si elegiste D-18 Opción A, añadir la reconciliación de registros|colgados en `REVISANDO` (arranque o tarea programada).
- [ ] **11.** Tests (sección 9).

---

## 9. Tests

**`tests/services/registroMedicoService.test.js`:**

- [ ] `VETERINARIA` puede actualizar un registro en `REALIZADO`.
- [ ] `VOLUNTARIO` recibe 403.
- [ ] Registro en `PROVISIONAL` → 409 `ESTADO_INVALIDO`.
- [ ] Registro en `VALIDACION_PENDIENTE` → 409 `ESTADO_INVALIDO`.
- [ ] Cuerpo vacío → 400 `SIN_CAMPOS_A_ACTUALIZAR`.
- [ ] Con el body que incluye `pesoKg` → 400 por `strictObject` (campo no permitido).
- [ ] Primera actualización crea `HistorialRegistroMedico` con `version: 1`.
- [ ] Segunda actualización crea `version: 2`.
- [ ] `obtenerUltimaVersion` devuelve la de mayor `version`.
- [ ] La versión guardada **incluye los campos que no cambiaron** (es un snapshot, no un diff).
- [ ] Si falla la escritura del historial, el `update` del registro **no** ocurre (transacción atómica).
- [ ] Cancelar una actualización en curso no crea versión y devuelve el estado anterior.
- [ ] El estado nunca queda en `REVISANDO` después de cancelar.

---

## 10. Criterios de aceptación

- [ ] La veterinaria puede actualizar tantas veces como necesite; no hay contador ni límite.
- [ ] Cada actualización queda en el historial con su `version`, su `fecha` y su `actualizadoPor`.
- [ ] La última versión es la que el sistema usa como vigente.
- [ ] Al editar, el estado es `REVISANDO`; al guardar, `ACTUALIZADO`.
- [ ] Abandonar sin guardar **no** persiste nada y el estado vuelve al último registrado.
- [ ] El `update` del registro y la escritura de la versión ocurren en la **misma** transacción.
- [ ] Un voluntario no puede actualizar el registro médico.
- [ ] `npm test` en verde.

---

## 11. Frontend

- [ ] `validations/actualizacionRegistroValidation.js` — espejo del esquema.
- [ ] `components/registroMedico/ActualizacionRegistroForm.jsx`:
  - [ ] Solo los campos clínicos (los de revisión inicial van **deshabilitados** con nota "modificables solo por el voluntario en su actualización única").
  - [ ] Al abrir, marcar el estado como "en revisión" (D-18 Opción A: llamar a `/inicio`).
  - [ ] Botones "Guardar cambios" y "Cancelar". **Cancelar** llama a `/cancelar` y no envía nada.
  - [ ] Aviso al abrir: "Estás en modo revisión. Los cambios se guardan al confirmar."
- [ ] `components/registroMedico/HistorialActualizaciones.jsx`: lista cronológica inversa (más reciente primero) con versión, fecha, quién y el resumen de cambios.
- [ ] `pages/RegistroMedicoPage.jsx`:
  - [ ] Sección "Estado actual" separada del "Historial". Nunca sobrescribas visualmente el historial con el estado actual.
  - [ ] Mostrar el número de versión vigente.

> El comportamiento de "cerrar sin guardar" se resuelve **en el cliente**: al desmontar el formulario o al navegar, dispara el `cancelar`. Un `beforeunload` ayuda, pero no es garantía; por eso el backend tiene el endpoint.

---

## 12. Trampas

1. **Historial como diff.** El requisito dice que el último es "utilizado en el sistema". Un diff obliga a reconstruye el estado recorriendo versiones. Snapshot.
2. **Escribir el registro y la versión por separado.** Si la versión falla, el registro queda actualizado sin historial y el sistema pierde la trazabilidad. Una sola transacción.
3. **`REVISANDO` persistente sin reconciliación.** Un proceso que muere a mitad deja registros colgados en `REVISANDO` para siempre. O no lo persistes (D-18 Opción B), o añade reconciliación.
4. **Permitir editar campos de revisión inicial.** `pesoKg` y `clasificacionSalud` son de r2 y solo se cambian una vez, por el voluntario, en r4. `strictObject` lo bloquea.
5. **`version` calculada con `count() + 1`.** No es atómico. Lee la última versión dentro de la transacción o usa el `@@unique` para detectar la carrera.
6. **`Decimal` sin convertir.** El historial guarda `Decimal`; la respuesta al cliente debe traer `Number()`.
7. **Confundir la auditoría de r4 con el historial de r5.** Son mecanismos distintos y con tablas distintas: r4 registra *qué campo cambió* en la revisión inicial del voluntario; r5 guarda *versiones completas* del registro clínico. No los mezcles.
8. **Sobre el "vuelve al último registrado".** No es "vuelve a `REALIZADO`" siempre: si venía de `ACTUALIZADO`, vuelve a `ACTUALIZADO`. Guarda el estado previo en `estadoOrigen`.