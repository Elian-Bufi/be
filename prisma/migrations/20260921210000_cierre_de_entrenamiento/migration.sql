-- Cierre de WP-06: lo que encontró la auditoría del paquete contra el legajo.

-- RF-036: la evaluación de entrenamiento se registra «con autoría, fecha, contexto y fuentes» (04:456; 09v10:190).
ALTER TABLE "evaluacion_de_entrenamiento" ADD COLUMN "contexto" TEXT;

-- DL-077: una sesión del plan se registra una sola vez por día. La ocurrencia es (versión, sesión, fecha), y el día que
-- se activa una sucesora la misma sesión existe en las dos versiones: sin esto se podía empezar y registrar dos veces
-- (06:5233, «un reintento no duplica la sesión»). El cerrojo serializa dos inserciones simultáneas de versiones
-- distintas, que la unicidad por versión no ve. Como cada ejecución nace de un borrador (borrador_id único), alcanza
-- con exigirlo en el borrador.
CREATE OR REPLACE FUNCTION "be_borrador_de_ejecucion_una_vez_por_dia"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('borrador-trn-dia|' || NEW."asesorado_id" || '|' || NEW."sesion_planificada_id" || '|' || NEW."fecha_local", 0));
  IF EXISTS (
    SELECT 1
      FROM "borrador_de_ejecucion_de_entrenamiento" b
      JOIN "version_de_plan_de_entrenamiento" v ON v."id" = b."version_de_plan_id"
     WHERE b."asesorado_id" = NEW."asesorado_id"
       AND b."sesion_planificada_id" = NEW."sesion_planificada_id"
       AND b."fecha_local" = NEW."fecha_local"
       AND b."version_de_plan_id" <> NEW."version_de_plan_id"
       AND v."plan_id" = (SELECT "plan_id" FROM "version_de_plan_de_entrenamiento" WHERE "id" = NEW."version_de_plan_id")
  ) THEN
    RAISE EXCEPTION 'BE: una sesión del plan se registra una sola vez por día, aunque cambie la versión';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "borrador_de_ejecucion_una_vez_por_dia" BEFORE INSERT ON "borrador_de_ejecucion_de_entrenamiento"
  FOR EACH ROW EXECUTE FUNCTION "be_borrador_de_ejecucion_una_vez_por_dia"();
