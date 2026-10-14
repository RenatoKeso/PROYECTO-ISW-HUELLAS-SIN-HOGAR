
r1. 
el sistema debe crear automáticamente un registro provisional medico único y actualizable asociado a la ficha de un animal previamente registrado e ingresado en el sistema, guardando su fecha y hora de creación, después de que la ficha, ingreso y registro medico sean creados, el animal pasara por una revisión inicial realizada por un voluntario autorizado o la medica veterinaria y la revision final realizada solo por la medica veterinaria.

r2.
En la revisión inicial el voluntario autorizado  registrara el peso, clasificación de salud(normal,enfermo,critico) con la que el sistema define la prioridad de atención, además de una observación del estado salud general, y definir si debe ser puesto en cuarentena, cuando este toda la información necesaria de la revisión inicial,  el registro medico pasara a estado "Validación pendiente" para proceder a la revisión completa.

r3.
 La medica veterinaria del refugio realizara la revisión final para completar el registro medico del animal y decidirá si el animal esta en condiciones para ser adoptado, en esta revisión se revalidara el peso y se registraran los resultados de las evaluaciones detallando si existen enfermedades, condiciones, discapacidades, lesiones, también se realizara un control sanitario(vacunación, desparasitación y cuando corresponda esterilización) y se registrara un tratamiento(medicamentos, cuidados, otros) en caso de necesitarlo, después de completar la revisión el estado del registro medico cambiara a realizado y la medica veterinaria decidirá si el animal esta en condiciones aptas para ser adoptado cambiando el estado del animal en la ficha a "adoptable", en caso de que no este disponible por decisión de la veterinaria, ella cambiara el estado a "no adoptable".
t
r4.
El voluntario puede actualizar solo una vez la revisión inicial en caso de necesitar completar datos o corregir, antes de guardar el sistema debe solicitar confirmación y advertir que después no podrá actualizarla nuevamente, tras esa actualización, el sistema bloquea la modificación de la revisión inicial, guarda la fecha de actualización separada de la de creación y registra, por cada cambio, el valor anterior, el valor nuevo, el autor, la fecha y la hora. Si el registro ya estaba validado, vuelve a “pendiente de validación” y se notifica a la médica veterinaria.

r5.
la medica veterinaria puede actualizar el registro medico cada vez que lo necesite, cada actualización se guardara en un historial siendo el ultimo actualizado considerado como el mas reciente y utilizado en el sistema, en cada actualización se guardara cuando y quien realizo la actualización, cuando se este actualizando, el estado del registro medico pasara a "revisando" y pasara al estado "actualizado" cuando los cambios sean guardados, en caso de que se este actualizando el registro y los cambios no sean guardados y se cierre la instancia, no se guardara nada y el estado volvera al ultimo registrado.

r6. 
el sistema guardara un seguimiento medico cada vez que cambie el estado de salud, el peso o las necesidades del animal. si el animal tiene enfermedades y/o tratamientos cada vez que esto se registre o cambie se registrara un nuevo seguimiento medico se guardara la fecha de registro, la medica que lo registra, obsevacion de su seguimiento, estado de salud al momento del registro y peso del animal. cuando se actualize sera creado un nuevo registro guardandose en el historial sin sobreescribir el anterior, tambien si es necesario se registrara el seguimiento de cada enfermadad y cada tratamiento con su estado.
