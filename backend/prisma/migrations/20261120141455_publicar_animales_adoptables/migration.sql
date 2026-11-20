-- Desde ahora, un animal que la veterinaria evalua como adoptable pasa solo al
-- catalogo. Los que ya estaban ADOPTABLE y en el refugio (ACTIVO) se publican aqui.
UPDATE "FichaAnimal"
SET "estadoEstadia" = 'ESPERA_ADOPCION'
WHERE "estadoEstadia" = 'ACTIVO' AND "estadoAdopcion" = 'ADOPTABLE';
