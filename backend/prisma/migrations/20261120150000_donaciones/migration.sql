CREATE TYPE "DestinoDonacion" AS ENUM (
'REFUGIO',
'APADRINAMIENTO'
);

CREATE TYPE "MedioPagoDonacion" AS ENUM (
'TRANSFERENCIA',
'EFECTIVO'
);

CREATE TYPE "EstadoDonacion" AS ENUM (
'PENDIENTE',
'CONFIRMADA',
'RECHAZADA'
);

CREATE TABLE "Donacion" (
"id" SERIAL NOT NULL,
"folio" TEXT NOT NULL,
"destino" "DestinoDonacion" NOT NULL,
"animalId" INTEGER,
"monto" DECIMAL(14,0) NOT NULL,
"medioPago" "MedioPagoDonacion" NOT NULL,
"fechaAporte" DATE NOT NULL,
"anonima" BOOLEAN NOT NULL,
"nombreDonante" TEXT,
"emailDonante" TEXT,
"telefonoDonante" TEXT,
"comprobante" BYTEA,
"comprobanteNombre" TEXT,
"estado" "EstadoDonacion" NOT NULL DEFAULT 'PENDIENTE',
"motivoRechazo" TEXT,
"revisadaPorId" INTEGER,
"revisadaEn" TIMESTAMP(3),
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT "Donacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Donacion_folio_key"
ON "Donacion"("folio");

CREATE INDEX "Donacion_estado_fechaAporte_idx"
ON "Donacion"("estado", "fechaAporte");

CREATE INDEX "Donacion_animalId_fechaAporte_idx"
ON "Donacion"("animalId", "fechaAporte");

ALTER TABLE "Donacion"
ADD CONSTRAINT "Donacion_animalId_fkey"
FOREIGN KEY ("animalId")
REFERENCES "FichaAnimal"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "Donacion"
ADD CONSTRAINT "Donacion_revisadaPorId_fkey"
FOREIGN KEY ("revisadaPorId")
REFERENCES "Usuario"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "Donacion"
ADD CONSTRAINT "Donacion_monto_positivo"
CHECK ("monto" > 0),

ADD CONSTRAINT "Donacion_destino_animal"
CHECK (
    ("destino" = 'APADRINAMIENTO') =
    ("animalId" IS NOT NULL) 
    ),

ADD CONSTRAINT "Donacion_anonima"
CHECK (
    NOT "anonima"
    OR (
        "destino" = 'REFUGIO'
        AND "nombreDonante" IS NULL
        AND "emailDonante" IS NULL
        AND "telefonoDonante" IS NULL
    )
),

    ADD CONSTRAINT "Donacion_donante"
    CHECK (
    "anonima"
    OR COALESCE(length(trim("nombreDonante")), 0) >= 2
),

    ADD CONSTRAINT "Donacion_contacto_padrino"
    CHECK (
    "destino" <> 'APADRINAMIENTO'
    OR (
        NOT "anonima"
        AND (
        "emailDonante" IS NOT NULL
        OR "telefonoDonante" IS NOT NULL
        )   
    )
),

ADD CONSTRAINT "Donacion_archivo"
CHECK (
    ("comprobante" IS NULL) =
    ("comprobanteNombre" IS NULL)

    AND ("medioPago" = 'TRANSFERENCIA') =
    ("comprobante" IS NOT NULL)

    AND (
        "comprobante" IS NULL
        OR octet_length("comprobante") <= 2097152
    )
),

    ADD CONSTRAINT "Donacion_revision"
    CHECK (
    (
        "estado" = 'PENDIENTE'
        AND "revisadaPorId" IS NULL
        AND "revisadaEn" IS NULL
        AND "motivoRechazo" IS NULL
    )
    OR (
        "estado" = 'CONFIRMADA'
        AND "revisadaPorId" IS NOT NULL
        AND "revisadaEn" IS NOT NULL
        AND "motivoRechazo" IS NULL
    )
    OR (
        "estado" = 'RECHAZADA'
        AND "revisadaPorId" IS NOT NULL
        AND "revisadaEn" IS NOT NULL
        AND COALESCE(length(trim("motivoRechazo")), 0) > 0
    )
);