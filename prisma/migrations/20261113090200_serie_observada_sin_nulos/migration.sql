-- WP-EDITORES-PROFESIONAL (ED-72; DL-171; EDT-39) · La serie observada sin valores nulos donde la guardia los da por
-- presentes. Solo agrega una restricción.
--
-- En PostgreSQL, una restricción CHECK que da NULL se considera cumplida. `serie_observada_coherente` compara la carga,
-- las repeticiones, el RIR y la estimación sin decir que estén: una fila OBSERVADA con alguno en NULL hacía NULL su
-- primera rama y FALSE la de la anulación, y entraba. Lo mismo `serie_observada_sucesion_coherente` con una sucesora sin
-- motivo. Así, un «Sin RIR» que llegara por fuera de la API se guardaba, aunque la base repite la guardia de lo
-- estimable. Esta restricción dice explícitamente que están; las de la migración anterior quedan como estaban.
ALTER TABLE "serie_observada" ADD CONSTRAINT "serie_observada_sin_nulos" CHECK (
  ("tipo" <> 'OBSERVADA'
     OR ("carga" IS NOT NULL AND "unidad" IS NOT NULL AND "repeticiones" IS NOT NULL AND "rir" IS NOT NULL
         AND "estimacion" IS NOT NULL))
  AND ("predecesora_id" IS NULL OR "motivo" IS NOT NULL));
