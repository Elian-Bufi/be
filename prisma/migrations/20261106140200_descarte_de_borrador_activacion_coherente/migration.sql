-- WP-TABLERO-ALTA-GAMA · TB-47 (DEUDA_LEGAJO DL-163 D-21): la coherencia entre el estado y la activación, con DESCARTADA.
-- 20260920100000 y 20260921100000 la escribieron para los dos estados del 06: «BORRADOR si y solo si no tiene
-- activación». Con DESCARTADA (20261106140000), esa forma rechaza todo descarte: una versión descartada no es BORRADOR y
-- tampoco tiene activación. La regla de fondo es la misma dicha desde la activada: «ACTIVADA si y solo si tiene
-- activación». Para BORRADOR y ACTIVADA no cambia nada, y una DESCARTADA, que nunca se activó, no puede tener activación
-- (la guarda de 20261106140100 lo exige también en la transición).
-- Migración propia y no un cambio a 20261106140100: lo que ya se aplicó no se reescribe.
ALTER TABLE "version_de_plan_nutricional" DROP CONSTRAINT "version_de_plan_activacion_coherente";
ALTER TABLE "version_de_plan_nutricional" ADD CONSTRAINT "version_de_plan_activacion_coherente"
  CHECK (("estado" = 'ACTIVADA') = ("momento_de_activacion" IS NOT NULL));

ALTER TABLE "version_de_plan_de_entrenamiento" DROP CONSTRAINT "version_de_plan_de_entrenamiento_activacion_coherente";
ALTER TABLE "version_de_plan_de_entrenamiento" ADD CONSTRAINT "version_de_plan_de_entrenamiento_activacion_coherente"
  CHECK (("estado" = 'ACTIVADA') = ("momento_de_activacion" IS NOT NULL));
