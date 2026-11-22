# Mapa de funciones principales

Referencias en formato `archivo:línea` (1-based). Los nombres entre paréntesis indican la función o método.

---

## 1. Punto de entrada y enrutamiento (backend)

| Función | Ubicación |
|---|---|
| `crearApp` (configura Express, CORS, JSON y estáticos) | `backend/src/app.js:7` |
| `GET /health` | `backend/src/app.js:13` |
| Montaje de `/uploads` | `backend/src/app.js:17` |
| Montaje de `/api` | `backend/src/app.js:27` |
| `crearRouter` (define módulos y permisos globales) | `backend/src/routes/index.js:25` |
| Arranque del servidor (`app.listen`) | `backend/src/server.js:6` |

---

## 2. Autenticación

| Función | Ubicación |
|---|---|
| `crearAuthRouter` (rutas de auth) | `backend/src/routes/authRoutes.js:41` |
| `POST /login` | `backend/src/routes/authRoutes.js:46` |
| `GET /me` | `backend/src/routes/authRoutes.js:48` |
| `POST /logout` | `backend/src/routes/authRoutes.js:50` |
| `crearAuthController` | `backend/src/controllers/authController.js:3` |
| `login` (controlador) | `backend/src/controllers/authController.js:5` |
| `me` (controlador) | `backend/src/controllers/authController.js:14` |
| `logout` (controlador) | `backend/src/controllers/authController.js:22` |
| `crearAuthService` | `backend/src/services/authService.js:42` |
| `login` (servicio: valida credenciales y firma JWT) | `backend/src/services/authService.js:53` |
| `autenticar` (servicio: valida token) | `backend/src/services/authService.js:89` |
| `logout` (servicio: invalida sesiones) | `backend/src/services/authService.js:123` |
| `usuarioPublico` (datos seguros del usuario) | `backend/src/services/authService.js:32` |
| `crearAutenticacion` (middleware Bearer) | `backend/src/middlewares/autenticarUsuario.js:4` |
| `autorizarAccion` (middleware de permisos) | `backend/src/middlewares/autorizarAccion.js:3` |

---

## 3. Fichas e ingreso de animales

### Rutas
| Endpoint | Ubicación |
|---|---|
| `crearAnimalRouter` | `backend/src/routes/animalRoutes.js:14` |
| `POST /fichas` | `backend/src/routes/animalRoutes.js:17` |
| `GET /fichas` | `backend/src/routes/animalRoutes.js:24` |
| `GET /animales/ingresos` | `backend/src/routes/animalRoutes.js:26` |
| `POST /fichas/:id/imagen` | `backend/src/routes/animalRoutes.js:32` |
| `DELETE /fichas/:id/imagen` | `backend/src/routes/animalRoutes.js:39` |
| `PATCH /fichas/:id` | `backend/src/routes/animalRoutes.js:45` |
| `POST /animales/ingresos` (ingreso/reingreso) | `backend/src/routes/animalRoutes.js:52` |
| `GET /animales/:id/ingresos` | `backend/src/routes/animalRoutes.js:58` |

### Controladores
| Función | Ubicación |
|---|---|
| `crearAnimalController` | `backend/src/controllers/animalController.js:94` |
| `registrarIngreso` | `backend/src/controllers/animalController.js:105` |
| `listarIngresos` (historial de una ficha) | `backend/src/controllers/animalController.js:122` |
| `listarTodosLosIngresos` | `backend/src/controllers/animalController.js:139` |
| `crearFicha` | `backend/src/controllers/animalController.js:151` |
| `actualizarFicha` | `backend/src/controllers/animalController.js:161` |
| `listarFichas` | `backend/src/controllers/animalController.js:171` |
| `subirImagen` | `backend/src/controllers/animalController.js:180` |
| `quitarImagen` | `backend/src/controllers/animalController.js:193` |

### Servicios (lógica principal)
| Función | Ubicación |
|---|---|
| `registrarIngreso` (punto de entrada de ingreso) | `backend/src/services/animalService.js:190` |
| `registrarIngresoInicial` (crea ficha + ingreso + registro médico) | `backend/src/services/animalService.js:110` |
| `registrarReingresoPorDevolucion` | `backend/src/services/animalService.js:137` |
| `crearFicha` | `backend/src/services/animalService.js:264` |
| `guardarImagenDeFicha` | `backend/src/services/animalService.js:291` |
| `quitarImagenDeFicha` | `backend/src/services/animalService.js:334` |
| `listarFichas` | `backend/src/services/animalService.js:369` |
| `listarIngresosDeFicha` | `backend/src/services/animalService.js:202` |
| `listarIngresosGlobales` | `backend/src/services/animalService.js:398` |
| `actualizarFicha` | `backend/src/services/animalService.js:428` |
| `separarFichaEIngreso` (separa datos de ficha e ingreso) | `backend/src/validations/registroIngresoValidation.js:70` |
| `esReingreso` (detecta reingreso por `codigoAnimal`) | `backend/src/services/animalService.js:69` |

### Validación y middleware
| Función | Ubicación |
|---|---|
| `registroIngresoSchema` | `backend/src/validations/registroIngresoValidation.js:46` |
| `fichaCreateSchema` (JSON) | `backend/src/validations/fichaAnimalValidation.js:66` |
| `fichaAnimalUpdateSchema` (PATCH) | `backend/src/validations/fichaAnimalValidation.js:52` |
| `fichaCreateMultipartSchema` (con imagen) | `backend/src/validations/fichaAnimalValidation.js:94` |
| `ingresoAnimalCreateSchema` | `backend/src/validations/ingresoAnimalValidation.js:19` |
| `listarIngresosQuerySchema` | `backend/src/validations/ingresoAnimalValidation.js:39` |
| `validarCreacionFicha` (elige schema JSON o multipart) | `backend/src/middlewares/validarCreacionFicha.js:6` |
| `recibirImagen` (multer) | `backend/src/middlewares/subirImagenAnimal.js:43` |
| `validarImagenParaSubir` (firma JPG/PNG) | `backend/src/validations/imagenAnimalValidation.js:24` |

---

## 4. Registro médico

### Rutas
| Endpoint | Ubicación |
|---|---|
| `crearRegistroMedicoRouter` | `backend/src/routes/registroMedicoRoutes.js:14` |
| `GET /` (listar registros) | `backend/src/routes/registroMedicoRoutes.js:20` |
| `GET /actualizaciones` | `backend/src/routes/registroMedicoRoutes.js:27` |
| `GET /:id` | `backend/src/routes/registroMedicoRoutes.js:33` |
| `POST /:id/revision-inicial` | `backend/src/routes/registroMedicoRoutes.js:40` |
| `PATCH /:id/revision-inicial` | `backend/src/routes/registroMedicoRoutes.js:48` |
| `POST /:id/validacion` (revisión final) | `backend/src/routes/registroMedicoRoutes.js:56` |
| `POST /:id/actualizaciones/inicio` | `backend/src/routes/registroMedicoRoutes.js:64` |
| `POST /:id/actualizaciones` | `backend/src/routes/registroMedicoRoutes.js:71` |
| `POST /:id/actualizaciones/cancelar` | `backend/src/routes/registroMedicoRoutes.js:79` |
| `GET /:id/historial` | `backend/src/routes/registroMedicoRoutes.js:86` |
| `GET /:id/seguimientos` | `backend/src/routes/registroMedicoRoutes.js:93` |

### Controladores
| Función | Ubicación |
|---|---|
| `crearRegistroMedicoController` | `backend/src/controllers/registroMedicoController.js:31` |
| `completarRevisionInicial` | `backend/src/controllers/registroMedicoController.js:45` |
| `realizarRevisionFinal` | `backend/src/controllers/registroMedicoController.js:58` |
| `actualizarRevisionInicial` | `backend/src/controllers/registroMedicoController.js:71` |
| `iniciarActualizacion` | `backend/src/controllers/registroMedicoController.js:84` |
| `actualizarRegistro` | `backend/src/controllers/registroMedicoController.js:96` |
| `cancelarActualizacion` | `backend/src/controllers/registroMedicoController.js:109` |
| `listarActualizaciones` | `backend/src/controllers/registroMedicoController.js:121` |
| `listarHistorial` | `backend/src/controllers/registroMedicoController.js:132` |
| `listarSeguimientos` | `backend/src/controllers/registroMedicoController.js:144` |
| `listarRegistros` | `backend/src/controllers/registroMedicoController.js:156` |
| `obtenerRegistro` | `backend/src/controllers/registroMedicoController.js:168` |

### Servicios (lógica principal)
| Función | Ubicación |
|---|---|
| `crearRegistroMedicoParaIngreso` (se dispara al ingresar animal) | `backend/src/services/registroMedicoService.js:241` |
| `completarRevisionInicial` | `backend/src/services/registroMedicoService.js:256` |
| `realizarRevisionFinal` | `backend/src/services/registroMedicoService.js:328` |
| `actualizarRevisionInicial` | `backend/src/services/registroMedicoService.js:476` |
| `iniciarActualizacionRegistro` | `backend/src/services/registroMedicoService.js:591` |
| `cancelarActualizacionRegistro` | `backend/src/services/registroMedicoService.js:642` |
| `actualizarRegistro` | `backend/src/services/registroMedicoService.js:702` |
| `listarHistorialRegistroMedico` | `backend/src/services/registroMedicoService.js:973` |
| `listarActualizacionesMedicas` | `backend/src/services/registroMedicoService.js:996` |
| `listarSeguimientosRegistroMedico` | `backend/src/services/registroMedicoService.js:1009` |
| `listarRegistrosMedicos` | `backend/src/services/registroMedicoService.js:1047` |
| `obtenerRegistroMedico` | `backend/src/services/registroMedicoService.js:1060` |
| `prioridadDe` (prioridad según clasificación) | `backend/src/services/registroMedicoService.js:225` |

### Validaciones
| Esquema | Ubicación |
|---|---|
| `revisionInicialSchema` | `backend/src/validations/registroMedicoValidation.js:69` |
| `actualizacionVeterinariaSchema` | `backend/src/validations/registroMedicoValidation.js:157` |
| `revisionFinalSchema` | `backend/src/validations/registroMedicoValidation.js:181` |
| `listarRegistrosMedicosQuerySchema` | `backend/src/validations/registroMedicoValidation.js:51` |
| `registroMedicoIdParamSchema` | `backend/src/validations/registroMedicoValidation.js:55` |

---

## 5. Adopciones

### Rutas
| Endpoint | Ubicación |
|---|---|
| `crearAdopcionRouter` | `backend/src/routes/adopcionRoutes.js:20` |
| `GET /animales` (catálogo público) | `backend/src/routes/adopcionRoutes.js:31` |
| `POST /postulaciones` | `backend/src/routes/adopcionRoutes.js:33` |
| `GET /animales/publicables` | `backend/src/routes/adopcionRoutes.js:40` |
| `PATCH /animales/:id/publicar` | `backend/src/routes/adopcionRoutes.js:46` |
| `GET /postulaciones` | `backend/src/routes/adopcionRoutes.js:54` |
| `GET /postulaciones/:id` | `backend/src/routes/adopcionRoutes.js:61` |
| `PATCH /postulaciones/:id/resolucion` | `backend/src/routes/adopcionRoutes.js:68` |
| `POST /postulaciones/:id/visitas` | `backend/src/routes/adopcionRoutes.js:77` |
| `POST /postulaciones/:id/omision-visita` | `backend/src/routes/adopcionRoutes.js:85` |
| `POST /postulaciones/:id/entrega` | `backend/src/routes/adopcionRoutes.js:93` |
| `PATCH /postulaciones/:id/seguimientos/:seguimientoId/realizado` | `backend/src/routes/adopcionRoutes.js:102` |

### Controladores
| Función | Ubicación |
|---|---|
| `crearAdopcionController` | `backend/src/controllers/adopcionController.js:18` |
| `listarAnimales` | `backend/src/controllers/adopcionController.js:32` |
| `listarPublicables` | `backend/src/controllers/adopcionController.js:41` |
| `publicarAnimal` | `backend/src/controllers/adopcionController.js:50` |
| `crearPostulacion` | `backend/src/controllers/adopcionController.js:59` |
| `listarPostulaciones` | `backend/src/controllers/adopcionController.js:69` |
| `verPostulacion` | `backend/src/controllers/adopcionController.js:78` |
| `resolverPostulacion` | `backend/src/controllers/adopcionController.js:87` |
| `registrarVisita` | `backend/src/controllers/adopcionController.js:103` |
| `omitirVisitaHogar` | `backend/src/controllers/adopcionController.js:120` |
| `formalizarEntrega` | `backend/src/controllers/adopcionController.js:133` |
| `realizarSeguimiento` | `backend/src/controllers/adopcionController.js:142` |

### Servicios
| Función | Ubicación |
|---|---|
| `obtenerCatalogo` | `backend/src/services/adopcionService.js:97` |
| `obtenerAnimalesPublicables` | `backend/src/services/adopcionService.js:102` |
| `publicarAnimal` | `backend/src/services/adopcionService.js:107` |
| `registrarPostulacion` | `backend/src/services/adopcionService.js:144` |
| `obtenerPostulaciones` | `backend/src/services/adopcionService.js:160` |
| `obtenerDetallePostulacion` | `backend/src/services/adopcionService.js:167` |
| `resolverPostulacion` | `backend/src/services/adopcionService.js:194` |
| `registrarVisita` | `backend/src/services/adopcionService.js:249` |
| `omitirVisitaHogar` | `backend/src/services/adopcionService.js:313` |
| `formalizarEntrega` | `backend/src/services/adopcionService.js:390` |
| `realizarSeguimiento` | `backend/src/services/adopcionService.js:445` |
| `validarRequisitosEntrega` | `backend/src/services/adopcionService.js:340` |

### Validaciones
| Esquema | Ubicación |
|---|---|
| `postulacionCreateSchema` | `backend/src/validations/adopcionValidation.js:86` |
| `resolverPostulacionSchema` | `backend/src/validations/adopcionValidation.js:123` |
| `registrarVisitaSchema` | `backend/src/validations/adopcionValidation.js:136` |
| `omitirVisitaHogarSchema` | `backend/src/validations/adopcionValidation.js:150` |
| `entregaSchema` | `backend/src/validations/adopcionValidation.js:160` |
| `listarPostulacionesQuerySchema` | `backend/src/validations/adopcionValidation.js:116` |

---

## 6. Postulaciones de voluntariado

| Función | Ubicación |
|---|---|
| `crearPostulacionVoluntarioRouter` | `backend/src/routes/postulacionVoluntarioRoutes.js:15` |
| `POST /` (postular) | `backend/src/routes/postulacionVoluntarioRoutes.js:21` |
| `GET /` (listar) | `backend/src/routes/postulacionVoluntarioRoutes.js:23` |
| `PATCH /:id/revision` | `backend/src/routes/postulacionVoluntarioRoutes.js:30` |
| `PATCH /:id/deshacer` | `backend/src/routes/postulacionVoluntarioRoutes.js:38` |
| `postular` (controlador) | `backend/src/controllers/postulacionVoluntarioController.js:9` |
| `listar` (controlador) | `backend/src/controllers/postulacionVoluntarioController.js:19` |
| `revisar` (controlador) | `backend/src/controllers/postulacionVoluntarioController.js:28` |
| `deshacer` (controlador) | `backend/src/controllers/postulacionVoluntarioController.js:44` |
| `postularComoVoluntario` (servicio) | `backend/src/services/postulacionVoluntarioService.js:36` |
| `obtenerPostulacionesVoluntario` | `backend/src/services/postulacionVoluntarioService.js:54` |
| `revisarPostulacionVoluntario` | `backend/src/services/postulacionVoluntarioService.js:58` |
| `deshacerRevisionPostulacionVoluntario` | `backend/src/services/postulacionVoluntarioService.js:111` |
| `postulacionVoluntarioSchema` | `backend/src/validations/postulacionVoluntarioValidation.js:29` |
| `revisarPostulacionVoluntarioSchema` | `backend/src/validations/postulacionVoluntarioValidation.js:77` |

---

## 7. Turnos

| Función | Ubicación |
|---|---|
| `crearTurnoRouter` | `backend/src/routes/turnoRoutes.js:13` |
| `POST /` (publicar turno) | `backend/src/routes/turnoRoutes.js:25` |
| `GET /gestion` | `backend/src/routes/turnoRoutes.js:32` |
| `GET /` (disponibles) | `backend/src/routes/turnoRoutes.js:40` |
| `publicarTurno` (controlador) | `backend/src/controllers/turnoController.js:14` |
| `listarGestion` | `backend/src/controllers/turnoController.js:24` |
| `listarDisponibles` | `backend/src/controllers/turnoController.js:33` |
| `publicarTurno` (servicio) | `backend/src/services/turnoService.js:36` |
| `obtenerTurnosGestion` | `backend/src/services/turnoService.js:90` |
| `obtenerTurnosDisponibles` | `backend/src/services/turnoService.js:99` |
| `hayCupos` | `backend/src/services/reglasTurnos.js:8` |
| `turnoYaComenzo` | `backend/src/services/reglasTurnos.js:13` |
| `plazoVencido` | `backend/src/services/reglasTurnos.js:18` |
| `seSolapan` | `backend/src/services/reglasTurnos.js:26` |
| `turnoSolapadoCon` | `backend/src/services/reglasTurnos.js:34` |
| `turnoCreateSchema` | `backend/src/validations/turnoValidation.js:33` |

---

## 8. Salud y plan sanitario

| Función | Ubicación |
|---|---|
| `crearSaludRouter` | `backend/src/routes/salud.routes.js:10` |
| `GET /tipos` | `backend/src/routes/salud.routes.js:17` |
| `POST /alertas/preview` | `backend/src/routes/salud.routes.js:21` |
| `GET /alertas` | `backend/src/routes/salud.routes.js:26` |
| `GET /plan/:codigo` | `backend/src/routes/salud.routes.js:33` |
| `POST /plan/:codigo/atenciones` | `backend/src/routes/salud.routes.js:39` |
| `PATCH /atenciones/:id` | `backend/src/routes/salud.routes.js:46` |
| `previsualizarAlertas` (controlador) | `backend/src/controllers/salud.controller.js:3` |
| `crearConsultaAlertasPlan` (controlador) | `backend/src/controllers/alertasPlan.controller.js:3` |
| `crearPlanSanitarioController` | `backend/src/controllers/planSanitarioController.js:3` |
| `consultar` (plan) | `backend/src/controllers/planSanitarioController.js:7` |
| `programar` (plan) | `backend/src/controllers/planSanitarioController.js:13` |
| `modificar` (plan) | `backend/src/controllers/planSanitarioController.js:22` |
| `calcularAlertas` (preview) | `backend/src/services/alertasSanitarias.service.js:27` |
| `obtenerFechaActual` (fecha Chile) | `backend/src/services/alertasSanitarias.service.js:12` |
| `obtenerAlertasPlan` (alertas desde BD) | `backend/src/services/alertasPlan.service.js:8` |
| `crearServicioPlanSanitario` | `backend/src/services/planSanitarioService.js:36` |
| `consultar` (plan sanitario) | `backend/src/services/planSanitarioService.js:41` |
| `programar` (atención) | `backend/src/services/planSanitarioService.js:68` |
| `modificar` (atención) | `backend/src/services/planSanitarioService.js:105` |
| `alertasSanitariasSchema` | `backend/src/validations/alertasSanitariasValidation.js:44` |
| `consultaAlertasSchema` | `backend/src/validations/consultaAlertasValidation.js:6` |
| `programarAtencionSchema` | `backend/src/validations/planSanitarioValidation.js:18` |
| `modificarAtencionSchema` | `backend/src/validations/planSanitarioValidation.js:24` |

---

## 9. Devoluciones, reportes y notificaciones

| Función | Ubicación |
|---|---|
| `crearDevolucionRouter` | `backend/src/routes/devolucionRoutes.js:7` |
| `GET /devoluciones/postulaciones-entregadas` | `backend/src/routes/devolucionRoutes.js:10` |
| `POST /devoluciones` | `backend/src/routes/devolucionRoutes.js:15` |
| `registrar` (controlador devolución) | `backend/src/controllers/devolucionController.js:7` |
| `listarPostulacionesEntregadas` (controlador) | `backend/src/controllers/devolucionController.js:17` |
| `registrarDevolucion` (servicio) | `backend/src/services/devolucionService.js:36` |
| `obtenerPostulacionesEntregadas` (servicio) | `backend/src/services/devolucionService.js:108` |
| `devolucionSchema` | `backend/src/validations/devolucionValidation.js:24` |
| `crearReporteDevolucionRouter` | `backend/src/routes/reporteDevolucionRoutes.js:7` |
| `POST /reportes/devoluciones` | `backend/src/routes/reporteDevolucionRoutes.js:10` |
| `GET /reportes/devoluciones` | `backend/src/routes/reporteDevolucionRoutes.js:16` |
| `generarReporte` (controlador) | `backend/src/controllers/reporteDevolucionController.js:8` |
| `listarReportes` (controlador) | `backend/src/controllers/reporteDevolucionController.js:22` |
| `generarReporteDevoluciones` (servicio) | `backend/src/services/reporteDevolucionService.js:65` |
| `obtenerReportesDevolucion` (servicio) | `backend/src/services/reporteDevolucionService.js:82` |
| `reporteDevolucionSchema` | `backend/src/validations/reporteDevolucionValidation.js:7` |
| `crearNotificacionRouter` | `backend/src/routes/notificacionRoutes.js:8` |
| `GET /notificaciones` | `backend/src/routes/notificacionRoutes.js:14` |
| `PATCH /notificaciones/:id/leida` | `backend/src/routes/notificacionRoutes.js:20` |
| `listarNotificaciones` (controlador) | `backend/src/controllers/notificacionController.js:15` |
| `marcarLeida` (controlador) | `backend/src/controllers/notificacionController.js:24` |
| `listarNotificaciones` (servicio) | `backend/src/services/notificacionService.js:12` |
| `marcarNotificacionComoLeida` (servicio) | `backend/src/services/notificacionService.js:19` |

---

## 10. Repositorios clave (acceso a datos)

| Función | Ubicación |
|---|---|
| `crearFichaAnimal` | `backend/src/repositories/fichaAnimalRepository.js:53` |
| `actualizarFichaAnimal` | `backend/src/repositories/fichaAnimalRepository.js:67` |
| `crearIngresoAnimal` | `backend/src/repositories/ingresoAnimalRepository.js:3` |
| `listarIngresosPorFicha` | `backend/src/repositories/ingresoAnimalRepository.js:7` |
| `crearRegistroMedico` | `backend/src/repositories/registroMedicoRepository.js:47` |
| `crearRevisionInicial` | `backend/src/repositories/registroMedicoRepository.js:62` |
| `crearRevisionFinal` | `backend/src/repositories/registroMedicoRepository.js:85` |
| `crearHistorialRegistroMedico` | `backend/src/repositories/registroMedicoRepository.js:150` |
| `crearPostulacion` | `backend/src/repositories/postulacionRepository.js:44` |
| `resolverPostulacionEnRevision` | `backend/src/repositories/postulacionRepository.js:110` |
| `crearVisita` | `backend/src/repositories/postulacionRepository.js:121` |
| `marcarPostulacionEntregada` | `backend/src/repositories/postulacionRepository.js:148` |
| `crearPostulacionVoluntario` | `backend/src/repositories/postulacionVoluntarioRepository.js:36` |
| `crearVoluntario` | `backend/src/repositories/postulacionVoluntarioRepository.js:57` |
| `crearTurno` | `backend/src/repositories/turnoRepository.js:17` |
| `crearDevolucion` | `backend/src/repositories/devolucionRepository.js:27` |
| `guardarReporteDevolucion` | `backend/src/repositories/reporteDevolucionRepository.js:28` |
| `crearNotificacion` | `backend/src/repositories/notificacionRepository.js:3` |
| `buscarUsuarioPorEmail` | `backend/src/repositories/usuarioRepository.js:5` |
| `invalidarSesiones` | `backend/src/repositories/usuarioRepository.js:30` |

---

## 11. Frontend: rutas de la aplicación

Todas están en `frontend/src/App.jsx`:

| Ruta | Línea |
|---|---|
| `/` (Home) | `frontend/src/App.jsx:146` |
| `/login` | `frontend/src/App.jsx:148` |
| `/registro` | `frontend/src/App.jsx:162` |
| `/salud/alertas` | `frontend/src/App.jsx:167` |
| `/salud/registros-medicos` | `frontend/src/App.jsx:175` |
| `/adopcion` | `frontend/src/App.jsx:183` |
| `/adopcion/:animalId/postular` | `frontend/src/App.jsx:184` |
| `/voluntariado` | `frontend/src/App.jsx:189` |
| `/voluntariado/postulaciones` | `frontend/src/App.jsx:191` |
| `/postulaciones` | `frontend/src/App.jsx:199` |
| `/postulaciones/:id` | `frontend/src/App.jsx:207` |
| `/adopciones/publicar` | `frontend/src/App.jsx:215` |
| `/reportes/devoluciones` | `frontend/src/App.jsx:223` |

---

## 12. Frontend: páginas y formularios

| Pantalla / formulario | Ubicación |
|---|---|
| `useFormulario` (hook genérico de formularios) | `frontend/src/hooks/useFormulario.js:14` |
| `enviarFormulario` (submit genérico con Zod) | `frontend/src/hooks/useFormulario.js:35` |
| `LoginPage` (componente) | `frontend/src/pages/LoginPage.jsx:49` |
| `enviar` (submit login) | `frontend/src/pages/LoginPage.jsx:82` |
| Formulario login (`onSubmit`) | `frontend/src/pages/LoginPage.jsx:193` |
| `RegistroPage` (fichas e ingresos) | `frontend/src/pages/RegistroPage.jsx:99` |
| `enviarIngreso` (arma payload de ingreso) | `frontend/src/pages/RegistroPage.jsx:90` |
| `useFormulario` de ingreso | `frontend/src/pages/RegistroPage.jsx:131` |
| `useFormulario` de ficha | `frontend/src/pages/RegistroPage.jsx:141` |
| Submit crear ficha (JSON o con imagen) | `frontend/src/pages/RegistroPage.jsx:144` |
| Formulario de ficha (`onSubmit`) | `frontend/src/pages/RegistroPage.jsx:353` |
| Formulario de ingreso (`onSubmit`) | `frontend/src/pages/RegistroPage.jsx:442` |
| `subirImagen` (ficha) | `frontend/src/pages/RegistroPage.jsx:280` |
| `quitarImagen` (ficha) | `frontend/src/pages/RegistroPage.jsx:307` |
| `AdopcionPage` (catálogo) | `frontend/src/pages/AdopcionPage.jsx:106` |
| `PostulacionPage` (formulario de adopción) | `frontend/src/pages/PostulacionPage.jsx:30` |
| `useFormulario` de postulación | `frontend/src/pages/PostulacionPage.jsx:62` |
| Formulario de postulación (`onSubmit`) | `frontend/src/pages/PostulacionPage.jsx:114` |
| `PostulacionesPage` (bandeja) | `frontend/src/pages/PostulacionesPage.jsx:17` |
| `PostulacionDetallePage` | `frontend/src/pages/PostulacionDetallePage.jsx:134` |
| `FormularioResolucion` (aprobar/rechazar) | `frontend/src/pages/PostulacionDetallePage.jsx:63` |
| `resolver` (submit resolución) | `frontend/src/pages/PostulacionDetallePage.jsx:68` |
| `PublicarAnimalesPage` | `frontend/src/pages/PublicarAnimalesPage.jsx:14` |
| `publicar` (submit publicar animal) | `frontend/src/pages/PublicarAnimalesPage.jsx:34` |
| `VoluntariadoPage` (formulario) | `frontend/src/pages/VoluntariadoPage.jsx:61` |
| `useFormulario` de voluntariado | `frontend/src/pages/VoluntariadoPage.jsx:62` |
| Formulario de voluntariado (`onSubmit`) | `frontend/src/pages/VoluntariadoPage.jsx:81` |
| `PostulacionesVoluntarioPage` | `frontend/src/pages/PostulacionesVoluntarioPage.jsx:185` |
| `revisar` (aceptar/rechazar) | `frontend/src/pages/PostulacionesVoluntarioPage.jsx:213` |
| `deshacer` (volver a revisión) | `frontend/src/pages/PostulacionesVoluntarioPage.jsx:219` |
| `AlertasSanitariasPage` | `frontend/src/pages/AlertasSanitariasPage.jsx:11` |
| `generar` (submit alertas) | `frontend/src/pages/AlertasSanitariasPage.jsx:34` |
| Formulario de alertas (`onSubmit`) | `frontend/src/pages/AlertasSanitariasPage.jsx:106` |
| `RegistroMedicoPage` | `frontend/src/pages/RegistroMedicoPage.jsx:42` |
| `refrescar` (carga datos) | `frontend/src/pages/RegistroMedicoPage.jsx:164` |
| `manejarRevisionInicial` | `frontend/src/pages/RegistroMedicoPage.jsx:197` |
| `manejarCorreccionInicial` | `frontend/src/pages/RegistroMedicoPage.jsx:204` |
| `manejarRevisionFinal` | `frontend/src/pages/RegistroMedicoPage.jsx:215` |
| `manejarIniciar` (iniciar actualización) | `frontend/src/pages/RegistroMedicoPage.jsx:222` |
| `manejarGuardarActualizacion` | `frontend/src/pages/RegistroMedicoPage.jsx:229` |
| `manejarCancelarActualizacion` | `frontend/src/pages/RegistroMedicoPage.jsx:236` |
| `manejarMarcarLeida` (notificación) | `frontend/src/pages/RegistroMedicoPage.jsx:242` |
| `ReporteDevolucionesPage` | `frontend/src/pages/ReporteDevolucionesPage.jsx:104` |
| `guardarDevolucion` (submit devolución) | `frontend/src/pages/ReporteDevolucionesPage.jsx:149` |
| `generar` (submit reporte) | `frontend/src/pages/ReporteDevolucionesPage.jsx:256` |
| Formulario de devolución (`onSubmit`) | `frontend/src/pages/ReporteDevolucionesPage.jsx:341` |
| Formulario de reporte (`onSubmit`) | `frontend/src/pages/ReporteDevolucionesPage.jsx:458` |
| `HomePage` | `frontend/src/pages/HomePage.jsx:4` |

---

## 13. Frontend: componentes de formularios

| Componente | Ubicación |
|---|---|
| `RevisionInicialForm` | `frontend/src/components/registroMedico/RevisionInicialForm.jsx:21` |
| Formulario de revisión inicial (`onSubmit`) | `frontend/src/components/registroMedico/RevisionInicialForm.jsx:43` |
| `RevisionFinalForm` | `frontend/src/components/registroMedico/RevisionFinalForm.jsx:17` |
| `enviar` (submit revisión final) | `frontend/src/components/registroMedico/RevisionFinalForm.jsx:56` |
| Formulario de revisión final (`onSubmit`) | `frontend/src/components/registroMedico/RevisionFinalForm.jsx:82` |
| `ActualizacionForm` | `frontend/src/components/registroMedico/ActualizacionForm.jsx:22` |
| `iniciar` (iniciar actualización) | `frontend/src/components/registroMedico/ActualizacionForm.jsx:64` |
| `guardar` (submit actualización) | `frontend/src/components/registroMedico/ActualizacionForm.jsx:77` |
| Formulario de actualización (`onSubmit`) | `frontend/src/components/registroMedico/ActualizacionForm.jsx:129` |
| `BandejaRegistros` | `frontend/src/components/registroMedico/BandejaRegistros.jsx:11` |
| `BandejaActualizaciones` | `frontend/src/components/registroMedico/BandejaActualizaciones.jsx:3` |
| `HistorialMedico` | `frontend/src/components/registroMedico/HistorialMedico.jsx:3` |
| `NotificacionesMedicas` | `frontend/src/components/registroMedico/NotificacionesMedicas.jsx:3` |
| `SeguimientosMedicos` | `frontend/src/components/registroMedico/SeguimientosMedicos.jsx:3` |
| `RevisionCompletaDetalle` | `frontend/src/components/registroMedico/RevisionCompletaDetalle.jsx:10` |
| `ProcesoAdopcion` | `frontend/src/components/adopcion/ProcesoAdopcion.jsx:350` |
| `Seguimiento.marcar` (marcar realizado) | `frontend/src/components/adopcion/ProcesoAdopcion.jsx:75` |
| `FormularioVisita` | `frontend/src/components/adopcion/ProcesoAdopcion.jsx:110` |
| `FormularioOmision` | `frontend/src/components/adopcion/ProcesoAdopcion.jsx:163` |
| `FormularioEntrega` | `frontend/src/components/adopcion/ProcesoAdopcion.jsx:206` |
| `PlanSanitario` | `frontend/src/components/PlanSanitario.jsx:27` |
| `ejecutar` (llamada al servicio del plan) | `frontend/src/components/PlanSanitario.jsx:40` |
| `buscar` (consultar plan) | `frontend/src/components/PlanSanitario.jsx:83` |
| `programar` (crear atención) | `frontend/src/components/PlanSanitario.jsx:95` |
| `guardarCambio` (modificar atención) | `frontend/src/components/PlanSanitario.jsx:115` |
| `Campo` (input reutilizable) | `frontend/src/components/ui/Campo.jsx:1` |
| `CampoArchivo` | `frontend/src/components/ui/CampoArchivo.jsx:17` |
| `VentanaModal` | `frontend/src/components/ui/VentanaModal.jsx:3` |
| `Mensaje` | `frontend/src/components/ui/Mensaje.jsx:1` |

---

## 14. Frontend: servicios que llaman a la API

| Función | Ubicación |
|---|---|
| Cliente `api` (fetch, token, errores) | `frontend/src/services/api.js:73` |
| `solicitarLogin` | `frontend/src/services/authService.js:16` |
| `consultarSesion` | `frontend/src/services/authService.js:28` |
| `solicitarLogout` | `frontend/src/services/authService.js:34` |
| `crearFicha` | `frontend/src/services/animalesService.js:23` |
| `crearFichaConImagen` | `frontend/src/services/animalesService.js:27` |
| `registrarIngreso` | `frontend/src/services/animalesService.js:31` |
| `listarFichas` | `frontend/src/services/animalesService.js:35` |
| `listarIngresosFicha` | `frontend/src/services/animalesService.js:39` |
| `listarIngresosGlobales` | `frontend/src/services/animalesService.js:44` |
| `subirImagenFicha` | `frontend/src/services/animalesService.js:55` |
| `quitarImagenFicha` | `frontend/src/services/animalesService.js:59` |
| `listarAnimalesEnAdopcion` | `frontend/src/services/adopcionesService.js:5` |
| `enviarPostulacion` | `frontend/src/services/adopcionesService.js:10` |
| `resolverPostulacion` | `frontend/src/services/adopcionesService.js:25` |
| `registrarVisita` | `frontend/src/services/adopcionesService.js:37` |
| `omitirVisitaHogar` | `frontend/src/services/adopcionesService.js:41` |
| `formalizarEntrega` | `frontend/src/services/adopcionesService.js:45` |
| `marcarSeguimientoRealizado` | `frontend/src/services/adopcionesService.js:49` |
| `enviarPostulacionVoluntario` | `frontend/src/services/postulacionVoluntarioService.js:3` |
| `revisarPostulacionVoluntario` | `frontend/src/services/postulacionVoluntarioService.js:12` |
| `deshacerRevisionPostulacionVoluntario` | `frontend/src/services/postulacionVoluntarioService.js:16` |
| `listarRegistrosMedicos` | `frontend/src/services/registroMedicoService.js:25` |
| `obtenerRegistroMedico` | `frontend/src/services/registroMedicoService.js:34` |
| `registrarRevisionInicial` | `frontend/src/services/registroMedicoService.js:45` |
| `actualizarRevisionInicial` | `frontend/src/services/registroMedicoService.js:56` |
| `realizarRevisionFinal` | `frontend/src/services/registroMedicoService.js:67` |
| `iniciarActualizacion` | `frontend/src/services/registroMedicoService.js:78` |
| `guardarActualizacion` | `frontend/src/services/registroMedicoService.js:89` |
| `cancelarActualizacion` | `frontend/src/services/registroMedicoService.js:101` |
| `listarHistorialMedico` | `frontend/src/services/registroMedicoService.js:123` |
| `consultarAlertasPlan` | `frontend/src/services/saludService.js:6` |
| `previsualizarAlertas` | `frontend/src/services/saludService.js:35` |
| `consultarPlan` | `frontend/src/services/planSanitarioService.js:16` |
| `programarAtencion` | `frontend/src/services/planSanitarioService.js:27` |
| `modificarAtencion` | `frontend/src/services/planSanitarioService.js:44` |
| `registrarDevolucion` | `frontend/src/services/devolucionService.js:7` |
| `generarReporteDevoluciones` | `frontend/src/services/reporteDevolucionService.js:3` |
| `listarReportesDevoluciones` | `frontend/src/services/reporteDevolucionService.js:7` |
| `listarNotificaciones` | `frontend/src/services/notificacionService.js:17` |
| `marcarNotificacionLeida` | `frontend/src/services/notificacionService.js:24` |
| `listarVoluntarios` | `frontend/src/services/voluntariosService.js:3` |

---

## 15. Frontend: validaciones y utilidades

| Función / esquema | Ubicación |
|---|---|
| `loginSchema` | `frontend/src/validations/authValidation.js:4` |
| `fichaFormSchema` | `frontend/src/validations/fichaValidation.js:29` |
| `ingresoFormSchema` | `frontend/src/validations/ingresoValidation.js:73` |
| `postulacionFormSchema` | `frontend/src/validations/postulacionValidation.js:42` |
| `visitaFormSchema` | `frontend/src/validations/postulacionValidation.js:87` |
| `omisionFormSchema` | `frontend/src/validations/postulacionValidation.js:100` |
| `entregaFormSchema` | `frontend/src/validations/postulacionValidation.js:113` |
| `postulacionVoluntarioFormSchema` | `frontend/src/validations/postulacionVoluntarioValidation.js:26` |
| `alertasFormSchema` | `frontend/src/validations/alertasValidation.js:41` |
| `consultaAlertasFormSchema` | `frontend/src/validations/alertasPlanValidation.js:22` |
| `revisionInicialFormSchema` | `frontend/src/validations/registroMedicoValidation.js:87` |
| `revisionFinalFormSchema` | `frontend/src/validations/registroMedicoValidation.js:94` |
| `actualizacionVeterinariaFormSchema` | `frontend/src/validations/registroMedicoValidation.js:133` |
| `programarAtencionSchema` | `frontend/src/validations/planSanitarioValidation.js:25` |
| `erroresDeZod` (traducir errores de Zod) | `frontend/src/utils/erroresFormulario.js:1` |
| `erroresDeApi` (traducir errores de API) | `frontend/src/utils/erroresFormulario.js:11` |
| `crearRevisionInicialInicial` | `frontend/src/utils/registroMedicoForm.js:59` |
| `construirEntradaRevisionInicial` | `frontend/src/utils/registroMedicoForm.js:73` |
| `crearRevisionFinalInicial` | `frontend/src/utils/registroMedicoForm.js:77` |
| `construirEntradaRevisionFinal` | `frontend/src/utils/registroMedicoForm.js:96` |
| `crearActualizacionInicial` | `frontend/src/utils/registroMedicoForm.js:132` |
| `construirEntradaActualizacion` | `frontend/src/utils/registroMedicoForm.js:160` |
| `filtrarAnimales` (filtros del catálogo) | `frontend/src/utils/filtrosAdopcion.js:66` |
| `formatearFecha` | `frontend/src/utils/formatoAdopcion.js:27` |
| `urlImagen` (URL de imágenes del backend) | `frontend/src/utils/urlImagen.js:15` |

---

## 16. Middlewares y manejo de respuestas

| Función | Ubicación |
|---|---|
| `enviarRespuestaExitosa` (formato de respuesta) | `backend/src/handlers/respuestaExitosa.js:1` |
| `manejarRutaNoEncontrada` | `backend/src/handlers/manejadorErrores.js:16` |
| `manejadorErrores` (errores globales) | `backend/src/handlers/manejadorErrores.js:50` |
| `construirDetalleDeZod` | `backend/src/handlers/manejadorErrores.js:28` |
| `capturarErrores` (wrapper async) | `backend/src/middlewares/capturarErrores.js:1` |
| `validarEsquema` | `backend/src/middlewares/validarEsquema.js:1` |
| `puedeGestionarFichas` | `backend/src/services/permisosUsuario.js:82` |
| `puedeConsultarAlertas` | `backend/src/services/permisosUsuario.js:91` |
| `puedeGestionarAdopciones` | `backend/src/services/permisosUsuario.js:112` |
| `puedeRegistrarDevoluciones` | `backend/src/services/permisosUsuario.js:119` |
| `puedeRealizarRevisionFinal` | `backend/src/services/permisosUsuario.js:138` |
| `puedeGestionarTurnos` | `backend/src/services/permisosUsuario.js:154` |
| `puedeRevisarPostulacionesVoluntario` | `backend/src/services/permisosUsuario.js:178` |
| `puedeActualizarRegistroMedico` | `backend/src/services/permisosUsuario.js:186` |
| `puedeConsultarRegistroMedico` | `backend/src/services/permisosUsuario.js:196` |

---

## Flujos rápidos

### Crear ficha de animal
1. Formulario: `frontend/src/pages/RegistroPage.jsx:141` (`ficha`)
2. Servicio frontend: `frontend/src/services/animalesService.js:23` (`crearFicha`)
3. Ruta: `backend/src/routes/animalRoutes.js:17`
4. Controlador: `backend/src/controllers/animalController.js:151`
5. Servicio: `backend/src/services/animalService.js:264`
6. Repositorio: `backend/src/repositories/fichaAnimalRepository.js:53`

### Registrar ingreso de animal
1. Formulario: `frontend/src/pages/RegistroPage.jsx:442`
2. Servicio frontend: `frontend/src/services/animalesService.js:31`
3. Ruta: `backend/src/routes/animalRoutes.js:52`
4. Controlador: `backend/src/controllers/animalController.js:105`
5. Servicio: `backend/src/services/animalService.js:190` → `registrarIngresoInicial` (`:110`)
6. Repositorios: `fichaAnimalRepository.js:53`, `ingresoAnimalRepository.js:3` y `registroMedicoRepository.js:47`

### Revisión inicial de registro médico
1. Formulario: `frontend/src/components/registroMedico/RevisionInicialForm.jsx:21`
2. Handler: `frontend/src/pages/RegistroMedicoPage.jsx:197`
3. Servicio frontend: `frontend/src/services/registroMedicoService.js:45`
4. Ruta: `backend/src/routes/registroMedicoRoutes.js:40`
5. Controlador: `backend/src/controllers/registroMedicoController.js:45`
6. Servicio: `backend/src/services/registroMedicoService.js:256`

### Postulación de adopción
1. Formulario: `frontend/src/pages/PostulacionPage.jsx:62`
2. Servicio frontend: `frontend/src/services/adopcionesService.js:10`
3. Ruta: `backend/src/routes/adopcionRoutes.js:33`
4. Controlador: `backend/src/controllers/adopcionController.js:59`
5. Servicio: `backend/src/services/adopcionService.js:144`
6. Repositorio: `backend/src/repositories/postulacionRepository.js:44`

### Registrar devolución
1. Formulario: `frontend/src/pages/ReporteDevolucionesPage.jsx:149`
2. Servicio frontend: `frontend/src/services/devolucionService.js:7`
3. Ruta: `backend/src/routes/devolucionRoutes.js:15`
4. Controlador: `backend/src/controllers/devolucionController.js:7`
5. Servicio: `backend/src/services/devolucionService.js:36`
6. Repositorio: `backend/src/repositories/devolucionRepository.js:27`
