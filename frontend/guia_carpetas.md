# para que es cada carpeta en el frontend

- pages : pantallas completas, ejemplo www.huellas/pantalla_inicio

- components : partes que se repiten, ejemplo : botones, tarjetas

- services : la comunicacion entre el frontend y backend

- hooks : funciones que se repiten o reutilizan

- utils : acciones independientes que no tienen contexto de otras cosas como pantallas, puede ser de herramientas externas como una api "creo"


## donde poner cada archivo

- pantalla completa por ejemplo www.huellas/pantalla1 va en pages/

- es algo que usa mas de una pantalla? : components/

- es un boton, tarjeta, campo para rellenar? : components/ui/

- se necesita comunicacion con el backend? : services/

- trabajo repetido como estados  y empieza con "use"? : hooks/

- lo necesitan todas las pantallas al mismo tiempo? context/

- entra algo sale algo y react o internet no necesitan contexto de lo que pasa? : utils/
