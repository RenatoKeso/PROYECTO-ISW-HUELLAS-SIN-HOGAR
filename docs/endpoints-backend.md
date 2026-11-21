# Endpoints del backend

Base URL: `http://localhost:3000`

- Rutas protegidas: header `Authorization: Bearer <token>`.
- En los `GET`, el JSON muestra los query params (van en la URL). `{}` significa sin parámetros ni body.
- `multipart/form-data` se indica en la ruta cuando corresponde.

---

## Health

### `GET /health`

```json
{}
```

---

## Autenticación

### `POST /api/auth/login`

```json
{
  "email": "directora.prueba@huellas.test",
  "password": "ClaveDePrueba12345"
}
```

### `GET /api/auth/me`

```json
{}
```

### `POST /api/auth/logout`

```json
{}
```

---

## Adopciones

### `GET /api/adopciones/animales`

```json
{}
```

### `POST /api/adopciones/postulaciones`

```json
{
  "fichaAnimalId": 1,
  "nombrePostulante": "Ana Pérez",
  "rutPostulante": "12345678-9",
  "telefonoPostulante": "+56912345678",
  "emailPostulante": "ana.perez@correo.cl",
  "tipoVivienda": "CASA",
  "otrasMascotas": "Un gato de 4 años",
  "disponibilidadTiempo": "Tardes y fines de semana"
}
```

### `GET /api/adopciones/animales/publicables`

```json
{}
```

### `PATCH /api/adopciones/animales/1/publicar`

```json
{}
```

### `GET /api/adopciones/postulaciones`

```json
{
  "estado": "EN_REVISION"
}
```

### `GET /api/adopciones/postulaciones/1`

```json
{}
```

### `PATCH /api/adopciones/postulaciones/1/resolucion`

```json
{
  "decision": "APROBADA",
  "observaciones": "Cumple con los requisitos de adopción"
}
```

### `POST /api/adopciones/postulaciones/1/visitas`

```json
{
  "tipo": "PRIMERA_VISITA",
  "fechaVisita": "2026-11-10",
  "resultado": "FAVORABLE",
  "observaciones": "Vivienda adecuada para el animal"
}
```

### `POST /api/adopciones/postulaciones/1/omision-visita`

```json
{
  "motivo": "POSTULANTE_CONOCIDO",
  "observacion": "El postulante ya era voluntario del refugio"
}
```

### `POST /api/adopciones/postulaciones/1/entrega`

```json
{
  "fechaEntrega": "2026-11-12",
  "documentacionEntregada": "Contrato de adopción firmado y carnet de vacunas"
}
```

### `PATCH /api/adopciones/postulaciones/1/seguimientos/1/realizado`

```json
{}
```

---

## Postulaciones de voluntariado

### `POST /api/postulaciones-voluntario`

```json
{
  "nombre": "Juan Soto",
  "rut": "12345678-9",
  "email": "juan.soto@correo.cl",
  "telefono": "+56912345678",
  "diasDisponibles": ["LUNES", "MIERCOLES", "SABADO"],
  "motivacion": "Quiero ayudar al cuidado de los animales del refugio",
  "habilidades": ["CUIDADO_ANIMALES", "TRANSPORTE"]
}
```

### `GET /api/postulaciones-voluntario`

```json
{
  "estado": "EN_REVISION"
}
```

### `PATCH /api/postulaciones-voluntario/1/revision`

```json
{
  "decision": "ACEPTADA"
}
```

### `PATCH /api/postulaciones-voluntario/1/deshacer`

```json
{}
```

---

## Turnos

### `POST /api/turnos`

```json
{
  "titulo": "Limpieza de caniles",
  "descripcion": "Limpieza y desinfección del área de perros",
  "fecha": "2026-12-05",
  "horaInicio": "09:00",
  "horaTermino": "13:00",
  "fechaLimiteInscripcion": "2026-12-01",
  "cupoMaximo": 10
}
```

### `GET /api/turnos/gestion`

```json
{}
```

### `GET /api/turnos`

```json
{}
```

---

## Fichas de animales

### `POST /api/fichas`

```json
{
  "nombre": "Firulais",
  "sexoAnimal": "MACHO",
  "especie": "PERRO",
  "raza": "Mestizo",
  "edad": 3,
  "observaciones": "Ingresó desnutrido"
}
```

### `GET /api/fichas`

```json
{}
```

### `PATCH /api/fichas/1`

```json
{
  "nombre": "Firulais",
  "estadoEstadia": "ESPERA_ADOPCION"
}
```

### `POST /api/fichas/1/imagen` (`multipart/form-data`, campo `imagen`)

```json
{
  "imagen": "<archivo .jpg o .png>"
}
```

### `DELETE /api/fichas/1/imagen`

```json
{}
```

### `POST /api/animales/ingresos`

```json
{
  "nombre": "Firulais",
  "sexoAnimal": "MACHO",
  "especie": "PERRO",
  "raza": "Mestizo",
  "edad": 3,
  "observaciones": "Ingresó desnutrido",
  "receptorId": 4,
  "fechaIngreso": "2026-11-14T10:30:00-03:00",
  "procedencia": "Rescate en la vía pública",
  "ubicacionEncontrado": "Av. Siempre Viva 742",
  "estadoSalud": "Estable"
}
```

### `GET /api/animales/ingresos`

```json
{
  "codigo": "anim-001",
  "nombre": "Firulais"
}
```

### `GET /api/animales/1/ingresos`

```json
{}
```

---

## Voluntarios

### `GET /api/voluntarios`

```json
{}
```

---

## Salud

### `GET /api/salud/tipos`

```json
{}
```

### `POST /api/salud/alertas/preview`

```json
{
  "fechaReferencia": "2026-11-14",
  "diasAnticipacion": 7,
  "eventos": [
    {
      "animalId": 1,
      "tipo": "vacuna",
      "fechaProgramada": "2026-11-18"
    }
  ]
}
```

### `GET /api/salud/alertas`

```json
{
  "fechaReferencia": "2026-11-14",
  "diasAnticipacion": "7"
}
```

### `GET /api/salud/plan/anim-001`

```json
{}
```

### `POST /api/salud/plan/anim-001/atenciones`

```json
{
  "tipo": "vacuna",
  "fechaProgramada": "2026-11-20",
  "observaciones": "Vacuna antirrábica"
}
```

### `PATCH /api/salud/atenciones/1`

```json
{
  "accion": "reprogramar",
  "fechaProgramada": "2026-11-25"
}
```

---

## Registros médicos

### `GET /api/registros-medicos`

```json
{
  "estado": "PROVISIONAL"
}
```

### `GET /api/registros-medicos/actualizaciones`

```json
{}
```

### `GET /api/registros-medicos/1`

```json
{}
```

### `POST /api/registros-medicos/1/revision-inicial`

```json
{
  "pesoKg": 12.5,
  "clasificacionSalud": "NORMAL",
  "observacionInicial": "Animal en buen estado general",
  "requiereCuarentena": false
}
```

### `PATCH /api/registros-medicos/1/revision-inicial`

```json
{
  "pesoKg": 13,
  "clasificacionSalud": "NORMAL",
  "observacionInicial": "Se corrige el peso registrado",
  "requiereCuarentena": false
}
```

### `POST /api/registros-medicos/1/validacion`

```json
{
  "pesoRevalidadoKg": 13.2,
  "estadoSalud": "NORMAL",
  "descripcionCuidadosEspeciales": "Ninguno",
  "adoptabilidad": "ADOPTABLE"
}
```

### `POST /api/registros-medicos/1/actualizaciones/inicio`

```json
{}
```

### `POST /api/registros-medicos/1/actualizaciones`

```json
{
  "pesoKg": 13.5,
  "clasificacionSalud": "NORMAL",
  "observacionSeguimiento": "El animal evoluciona favorablemente",
  "evolucionEstadoSalud": "MEJORANDO"
}
```

### `POST /api/registros-medicos/1/actualizaciones/cancelar`

```json
{}
```

### `GET /api/registros-medicos/1/historial`

```json
{}
```

### `GET /api/registros-medicos/1/seguimientos`

```json
{}
```

---

## Notificaciones

### `GET /api/notificaciones`

```json
{}
```

### `PATCH /api/notificaciones/1/leida`

```json
{}
```

---

## Devoluciones

### `GET /api/devoluciones/postulaciones-entregadas`

```json
{}
```

### `POST /api/devoluciones`

```json
{
  "postulacionId": 1,
  "receptorId": 4,
  "fechaDevolucion": "2026-11-12",
  "motivo": "CAMBIO_SITUACION_FAMILIAR",
  "detalle": "La familia se traslada al extranjero y no puede llevar al animal"
}
```

---

## Reportes de devoluciones

### `POST /api/reportes/devoluciones`

```json
{
  "fechaDesde": "2026-01-01",
  "fechaHasta": "2026-11-14"
}
```

### `GET /api/reportes/devoluciones`

```json
{}
```
