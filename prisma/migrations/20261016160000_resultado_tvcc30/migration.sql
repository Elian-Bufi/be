-- RF-058 · UC-S01 · DEUDA_LEGAJO DL-135: los resultados de la TVCC-30. Cada corrida se conserva con su universo, su
-- especificación y su huella (12 §22; REG-06-196). Solo se agrega: otra corrida sobre el mismo corte es otro resultado,
-- sucesor del anterior (REG-06-198).

-- CreateEnum
CREATE TYPE "EstadoDeResultadoTvcc30" AS ENUM ('CALCULADO', 'SIN_VALOR');

-- CreateTable
CREATE TABLE "resultado_tvcc30" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "especificacion" TEXT NOT NULL,
    "mapeo" TEXT NOT NULL,
    "corte" DATE NOT NULL,
    "zona" TEXT NOT NULL,
    "ventana_inicio" TIMESTAMPTZ(3) NOT NULL,
    "ventana_fin" TIMESTAMPTZ(3) NOT NULL,
    "estado" "EstadoDeResultadoTvcc30" NOT NULL,
    "motivo_sin_valor" TEXT,
    "numerador" INTEGER,
    "denominador" INTEGER,
    "universo" INTEGER NOT NULL,
    "excluidos" INTEGER NOT NULL,
    "no_resolubles" INTEGER NOT NULL,
    "resultado" JSONB NOT NULL,
    "huella" TEXT NOT NULL,
    "predecesor_id" UUID,
    "ejecutor" TEXT NOT NULL,
    "ambiente" TEXT NOT NULL,
    "procedencia" JSONB NOT NULL,
    "momento_de_registro" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultado_tvcc30_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resultado_tvcc30_predecesor_id_key" ON "resultado_tvcc30"("predecesor_id");

-- CreateIndex
CREATE INDEX "resultado_tvcc30_corte_zona_idx" ON "resultado_tvcc30"("corte", "zona");

-- AddForeignKey
ALTER TABLE "resultado_tvcc30" ADD CONSTRAINT "resultado_tvcc30_predecesor_id_fkey" FOREIGN KEY ("predecesor_id") REFERENCES "resultado_tvcc30"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- N y D van juntos, y N está dentro de D (REG-06-194; 12 §18).
ALTER TABLE "resultado_tvcc30" ADD CONSTRAINT "resultado_tvcc30_par" CHECK (("numerador" IS NULL) = ("denominador" IS NULL));
ALTER TABLE "resultado_tvcc30" ADD CONSTRAINT "resultado_tvcc30_n_en_d" CHECK ("numerador" IS NULL OR ("numerador" >= 0 AND "numerador" <= "denominador"));
-- Hay tasa solo con D > 0 y sin candidatos no resolubles; si no, la ausencia se dice con su motivo (12 §19 a §21).
ALTER TABLE "resultado_tvcc30" ADD CONSTRAINT "resultado_tvcc30_valor" CHECK (
    ("estado" = 'CALCULADO' AND "denominador" > 0 AND "no_resolubles" = 0 AND "motivo_sin_valor" IS NULL)
 OR ("estado" = 'SIN_VALOR' AND "motivo_sin_valor" = 'DENOMINADOR_CERO' AND "numerador" = 0 AND "denominador" = 0 AND "no_resolubles" = 0)
 OR ("estado" = 'SIN_VALOR' AND "motivo_sin_valor" = 'CANDIDATOS_NO_RESOLUBLES' AND "numerador" IS NULL AND "no_resolubles" > 0)
);
ALTER TABLE "resultado_tvcc30" ADD CONSTRAINT "resultado_tvcc30_conteos" CHECK ("universo" >= 0 AND "excluidos" >= 0 AND "no_resolubles" >= 0 AND "excluidos" + "no_resolubles" <= "universo");
ALTER TABLE "resultado_tvcc30" ADD CONSTRAINT "resultado_tvcc30_huella" CHECK ("huella" ~ '^[0-9a-f]{64}$');
ALTER TABLE "resultado_tvcc30" ADD CONSTRAINT "resultado_tvcc30_ventana" CHECK ("ventana_inicio" < "ventana_fin");
ALTER TABLE "resultado_tvcc30" ADD CONSTRAINT "resultado_tvcc30_ejecutor" CHECK (length(btrim("ejecutor")) > 0);

-- Historia por adición (08 §29): el resultado no se modifica ni se borra.
CREATE TRIGGER "resultado_tvcc30_solo_agregar" BEFORE UPDATE OR DELETE ON "resultado_tvcc30" FOR EACH ROW EXECUTE FUNCTION "be_solo_agregar"();
CREATE TRIGGER "resultado_tvcc30_sin_truncate" BEFORE TRUNCATE ON "resultado_tvcc30" FOR EACH STATEMENT EXECUTE FUNCTION "be_solo_agregar"();
