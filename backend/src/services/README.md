# Servicios

Contienen las reglas del negocio del refugio, como validar cupos, asignar turnos y gestionar adopciones o devoluciones.

## Módulo de animales

`animalService.js` expone `registrarIngreso({ ficha, ingreso })` y decide el flujo segun la presencia de `codigoAnimal`:

- Sin `codigoAnimal`: es un ingreso inicial. El servicio genera el identificador publico, crea la ficha y registra el primer evento de su historial dentro de una misma transaccion.
- Con `codigoAnimal`: es un reingreso por devolucion. Busca la ficha existente, no crea una ficha nueva y solo agrega un evento al historial.

Cuando la ficha y su historial se guardan juntos, un fallo revierte la operacion completa y se traduce a un error de dominio de `src/entities/animalErrors.js` en lugar de exponer el error crudo de Prisma.
