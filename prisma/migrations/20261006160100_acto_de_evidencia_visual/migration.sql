-- Precierre del 2026-10-06, §6 (DL-125): el acto `EVIDENCIA_VISUAL` (08 §12.4, 08:395) como acto registrable, con la
-- evidencia del 08 §12.2. Es la información destacada de las fotos de comidas, registrada una vez por cada alcance de
-- Nutrición del titular («B2 reforzado»), no un consentimiento por foto (08 §21.3).
--
-- 1. La versión de texto propuesta, generada desde @be/domain (`node scripts/generar-sql-catalogo-de-textos.cjs --ids
--    evidencia-visual-2026-10-propuesta`). Es una propuesta, pendiente de aprobación de Dirección y de validación
--    jurídica: la aprobada entra como sucesora, con otro id, y no hereda aceptaciones (09 §31.2.6).
-- Catálogo de textos versionados (08 §12.2; DEUDA_LEGAJO DL-028). Generado desde @be/domain.
INSERT INTO "version_de_texto" ("id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde") VALUES ('evidencia-visual-2026-10-propuesta', 'EVIDENCIA_VISUAL', $be_texto$Fotos de tus comidas$be_texto$, 'INFORMACION_DESTACADA_DE_EVIDENCIA_VISUAL', $be_texto$Fotos de tus comidas — versión propuesta 2026-10

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Texto propuesto, pendiente de aprobación de Dirección y de validación jurídica.

Esta información es sobre una sola categoría de datos: las fotos de comidas que subís a BE. Se muestra antes de tu primera foto para el profesional que te acompaña en Nutrición, y queda registrada aparte.

Qué es: la foto de una comida que registrás, por ejemplo una comida diferente a la del plan. Es un dato personal de salud, y BE la protege por lo menos como al resto de tus datos de salud.

Es opcional: podés registrar tus comidas sin fotos. No subir fotos no cambia nada del servicio.

Quién la ve: vos y el profesional que te acompaña en Nutrición, mientras el vínculo, su autorización de acceso y tu consentimiento de datos de salud estén vigentes. No la ven otros asesorados ni otros profesionales. La administración de BE no tiene acceso, salvo el acceso excepcional de soporte, que queda registrado.

Cómo se guarda: la foto es privada y no tiene una dirección pública. Cada vez que alguien la abre, BE da un acceso que vence en 15 minutos como máximo y registra quién la abrió y cuándo. Al recibirla, BE quita de la imagen los datos que no hacen falta, como la ubicación y el modelo del teléfono.

Qué no hace BE con la foto: no calcula cantidades, calorías ni nutrientes, y no la envía a ningún servicio de inteligencia artificial.

Podés borrar cada foto cuando quieras, desde el registro de esa comida: se borra la imagen y queda la constancia de que existió.

Podés revocar esta autorización cuando quieras, desde Cuenta → Privacidad. Desde ese momento no se suben fotos nuevas para este profesional, y el profesional deja de verlas. Las fotos que ya subiste no se borran: las seguís viendo vos, y las podés borrar una por una.

Aceptar esta versión no acepta versiones futuras.$be_texto$, '88eb764c3382f241a1d6f7f0a51e5daa3d0774232957492d860e1549f34e28a1', '2026-10-06T00:00:00.000Z');

-- 2. El alcance de vínculo del acto (08 §12.2: «alcance (tipo A3 o Alcance de vínculo B2) · profesional y componente
--    de Vínculo»). Solo el acto `EVIDENCIA_VISUAL` lo lleva, y lo lleva siempre.
ALTER TABLE "acto_registrable" ADD COLUMN "alcance_de_vinculo_id" UUID;
ALTER TABLE "acto_registrable" ADD CONSTRAINT "acto_registrable_alcance_de_vinculo_id_fkey"
  FOREIGN KEY ("alcance_de_vinculo_id") REFERENCES "alcance_de_vinculo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "acto_registrable" ADD CONSTRAINT "acto_registrable_alcance_solo_de_evidencia_visual"
  CHECK (("tipo" = 'EVIDENCIA_VISUAL') = ("alcance_de_vinculo_id" IS NOT NULL));
CREATE INDEX "acto_registrable_alcance_de_vinculo_id_idx" ON "acto_registrable" ("alcance_de_vinculo_id");

-- 3. Como máximo un acto `EVIDENCIA_VISUAL` vigente por alcance de vínculo: protege el otorgamiento (API-EVI-02) ante
--    pedidos simultáneos, como `acto_registrable_un_a3_vigente` protege el de A3.
CREATE UNIQUE INDEX "acto_registrable_una_evidencia_visual_vigente" ON "acto_registrable" ("alcance_de_vinculo_id")
  WHERE "estado" = 'VIGENTE' AND "tipo" = 'EVIDENCIA_VISUAL';

-- 4. El disparador de los actos (20260918200000), con tres cambios y nada más:
--    - al insertar un `EVIDENCIA_VISUAL`, el alcance es de Nutrición y su vínculo es del titular del acto, y la versión
--      de texto es de su tipo: solo el titular registra lo que se le informó (INV-06-62);
--    - `alcance_de_vinculo_id` entra en la evidencia inmutable (08 §12.2);
--    - `EVIDENCIA_VISUAL` es revocable (08 §12.4, columna «Revocable: Sí»).
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
