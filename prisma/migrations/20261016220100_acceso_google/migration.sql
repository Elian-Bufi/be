-- WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138; aprobado por Dirección el 2026-10-16): entrar con Google sin una identidad
-- paralela (RF-003; 06 §5.6, REG-06-21, INV-06-21 e INV-06-24) y la declaración de mayoría de edad del alta (08 §24.7 a).
-- Migración aditiva: una versión de texto nueva, una columna anulable, dos índices, dos CHECK y un disparador nuevo; el
-- disparador de los actos se reemplaza con un agregado y nada más. Ninguna tabla nueva.

-- 1. La versión del texto de la declaración, generada desde @be/domain
--    (`node scripts/generar-sql-catalogo-de-textos.cjs --ids mayoria-de-edad-2026-10`). Es la declaración de la persona,
--    con las palabras que aprobó Dirección; una versión nueva entraría como sucesora, con otro id.
-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('mayoria-de-edad-2026-10', 'MAYORIA_DE_EDAD', $be_texto$Declaración de mayoría de edad$be_texto$, 'ELEGIBILIDAD_POR_MAYORIA_DE_EDAD', $be_texto$Declaro que tengo 18 años o más. BE es solo para personas adultas.$be_texto$, 'cd090b1e6ae3d68033962ed5b8effd2b6a0b8db7bd3f046e1fadf06b986c60f6', '2026-10-16T00:00:00.000Z');

-- 2. El correo de un método GOOGLE: el que Google verificó al asociar la cuenta. Un método LOCAL lo tiene en `referencia`.
--    `referencia` de un GOOGLE es el `sub` de Google: hasta 255 caracteres ASCII visibles (así lo documenta Google).
-- AlterTable
ALTER TABLE "metodo_de_acceso" ADD COLUMN "correo" TEXT;

-- CreateIndex
CREATE INDEX "metodo_de_acceso_correo_idx" ON "metodo_de_acceso"("correo");

ALTER TABLE "metodo_de_acceso" ADD CONSTRAINT "metodo_de_acceso_correo_solo_de_google"
  CHECK (("tipo" = 'GOOGLE') = ("correo" IS NOT NULL));
ALTER TABLE "metodo_de_acceso" ADD CONSTRAINT "metodo_de_acceso_forma_de_google"
  CHECK ("tipo" <> 'GOOGLE' OR ("referencia" ~ '^[!-~]{1,255}$' AND "correo" = btrim("correo") AND length("correo") BETWEEN 3 AND 254 AND position('@' in "correo") > 1));

-- 3. Como máximo una cuenta de Google por identidad (la unicidad del `sub` entre todas ya la da el índice (tipo, referencia)).
CREATE UNIQUE INDEX "metodo_de_acceso_un_google_por_identidad" ON "metodo_de_acceso" ("identidad_id") WHERE "tipo" = 'GOOGLE';

-- 4. Un correo es de una sola identidad (RF-001: «un correo ya asociado no produce una segunda cuenta»; INV-06-21): el de
--    un método LOCAL y el de uno GOOGLE no pueden quedar en identidades distintas. Ningún índice único lo expresa (la misma
--    identidad sí puede tener los dos con el mismo correo: es justamente la vinculación), así que lo hace un disparador. El
--    cerrojo transaccional por correo es el mismo que toman el registro local y el alta y la vinculación con Google antes de
--    mirar si el correo está libre: dos altas simultáneas con el mismo correo se ordenan, y la segunda ve a la primera.
--    El código responde antes con su error preciso; si alguna vez llegara acá, la base no deja pasar la segunda identidad.
CREATE FUNCTION "be_metodo_de_acceso_sin_identidad_paralela"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_correo text := CASE WHEN NEW."tipo" = 'LOCAL' THEN NEW."referencia" ELSE NEW."correo" END;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('be:correo-de-acceso:' || v_correo, 0));
  IF EXISTS (SELECT 1 FROM "metodo_de_acceso" m
              WHERE m."identidad_id" <> NEW."identidad_id"
                AND ((m."tipo" = 'LOCAL' AND m."referencia" = v_correo) OR (m."tipo" = 'GOOGLE' AND m."correo" = v_correo))) THEN
    RAISE EXCEPTION 'BE: ese correo ya es de otra identidad (INV-06-21: un método de acceso no crea una identidad paralela)'
      USING ERRCODE = 'unique_violation', CONSTRAINT = 'metodo_de_acceso_correo_de_una_identidad';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "metodo_de_acceso_sin_identidad_paralela" BEFORE INSERT ON "metodo_de_acceso" FOR EACH ROW EXECUTE FUNCTION "be_metodo_de_acceso_sin_identidad_paralela"();

-- 5. La declaración de mayoría de edad: una por identidad, y nunca se revoca (no está entre los tipos revocables).
CREATE UNIQUE INDEX "acto_registrable_una_mayoria_de_edad" ON "acto_registrable" ("identidad_id") WHERE "tipo" = 'MAYORIA_DE_EDAD';

-- 6. El disparador de los actos (20261006160100), con un agregado y nada más: al insertar un `MAYORIA_DE_EDAD`, la
--    versión de texto es de su tipo (08 §12.2) y quien declara es el titular (nadie declara la edad de otra persona).
CREATE OR REPLACE FUNCTION "be_acto_registrable_guardar"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."estado" <> 'VIGENTE' OR NEW."momento_de_revocacion" IS NOT NULL THEN
      RAISE EXCEPTION 'BE: un acto nace VIGENTE' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."tipo" = 'EVIDENCIA_VISUAL' THEN
      IF NOT EXISTS (SELECT 1 FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
                      WHERE av."id" = NEW."alcance_de_vinculo_id" AND av."alcance" = 'NUTRICION'
                        AND vi."asesorado_id" = NEW."identidad_id") THEN
        RAISE EXCEPTION 'BE: EVIDENCIA_VISUAL es de un alcance de Nutrición del titular del acto (08 §12.4)' USING ERRCODE = 'check_violation';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM "version_de_texto" WHERE "id" = NEW."version_de_texto_id" AND "tipo" = 'EVIDENCIA_VISUAL') THEN
        RAISE EXCEPTION 'BE: EVIDENCIA_VISUAL acepta una versión de su tipo (08 §12.2)' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    IF NEW."tipo" = 'MAYORIA_DE_EDAD' THEN
      IF NOT EXISTS (SELECT 1 FROM "version_de_texto" WHERE "id" = NEW."version_de_texto_id" AND "tipo" = 'MAYORIA_DE_EDAD') THEN
        RAISE EXCEPTION 'BE: MAYORIA_DE_EDAD declara una versión de su tipo (08 §12.2)' USING ERRCODE = 'check_violation';
      END IF;
      IF NEW."actor_id" <> NEW."identidad_id" OR NEW."autoria_id" <> NEW."identidad_id" THEN
        RAISE EXCEPTION 'BE: la mayoría de edad la declara su titular (08 §24.7 a)' USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BE: un acto registrable no se elimina (08 §12.2)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW."id", NEW."identidad_id", NEW."tipo", NEW."version_de_texto_id", NEW."hash_del_texto", NEW."finalidad",
      NEW."superficie", NEW."direccion_ip", NEW."agente_de_usuario", NEW."actor_id", NEW."autoria_id", NEW."procedencia",
      NEW."momento_de_ocurrencia", NEW."momento_de_registro", NEW."alcance_de_vinculo_id")
     IS DISTINCT FROM (OLD."id", OLD."identidad_id", OLD."tipo", OLD."version_de_texto_id", OLD."hash_del_texto", OLD."finalidad",
      OLD."superficie", OLD."direccion_ip", OLD."agente_de_usuario", OLD."actor_id", OLD."autoria_id", OLD."procedencia",
      OLD."momento_de_ocurrencia", OLD."momento_de_registro", OLD."alcance_de_vinculo_id") THEN
    RAISE EXCEPTION 'BE: la evidencia de un acto es inmutable (08 §12.2)' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NOT (OLD."estado" = 'VIGENTE' AND NEW."estado" = 'REVOCADO' AND OLD."tipo" IN ('TERMINOS', 'DATOS_SALUD_BE', 'EVIDENCIA_VISUAL')
          AND NEW."momento_de_revocacion" IS NOT NULL) THEN
    RAISE EXCEPTION 'BE: TRANSICION_NO_DECLARADA en acto % (% -> %)', OLD."tipo", OLD."estado", NEW."estado" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
