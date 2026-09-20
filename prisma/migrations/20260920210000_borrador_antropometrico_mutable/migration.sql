-- El contenido de un borrador antropométrico es trabajo en curso, no historia.
--
-- La migración anterior aplicó `be_solo_agregar` a la medición y al cálculo desde que nacen. Eso contradice
-- REG-06-215: «Una Evaluación EN_PREPARACION puede conservar mediciones parciales… cálculos de apoyo…» y
-- «Datos/cálculos de preparación **no adquieren autoridad histórica por persistirse**» (06:8614-8628).
--
-- La historia por adición (06 §4.4) protege lo que tiene autoridad histórica. Acá la frontera es el acto explícito
-- de registro: mientras la evaluación está EN_PREPARACION su contenido se puede corregir y reemplazar; una vez
-- REGISTRADA, nada de eso se toca y los cambios posteriores usan corrección o anulación (REG-06-214 inciso 5).
--
-- Los actos —corrección, anulación y evento— siguen siendo append-only siempre: son hechos, no borradores.

DROP TRIGGER IF EXISTS "medicion_antropometrica_solo_agregar" ON "medicion_antropometrica";
DROP TRIGGER IF EXISTS "ejecucion_de_calculo_solo_agregar" ON "ejecucion_de_calculo";
DROP TRIGGER IF EXISTS "entrada_de_calculo_solo_agregar" ON "entrada_de_calculo";

CREATE FUNCTION "be_contenido_de_evaluacion_registrada_inmutable"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_evaluacion uuid;
  v_estado "EstadoDeEvaluacionAntropometrica";
BEGIN
  IF TG_TABLE_NAME = 'entrada_de_calculo' THEN
    SELECT "evaluacion_id" INTO v_evaluacion FROM "ejecucion_de_calculo" WHERE "id" = OLD."ejecucion_id";
  ELSE
    v_evaluacion := OLD."evaluacion_id";
  END IF;

  SELECT "estado" INTO v_estado FROM "evaluacion_antropometrica" WHERE "id" = v_evaluacion;

  IF v_estado = 'REGISTRADA' THEN
    RAISE EXCEPTION 'BE: % de una evaluación REGISTRADA es append-only; los cambios posteriores usan corrección o anulación (REG-06-214, 06 §4.4)', TG_TABLE_NAME
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "medicion_antropometrica_inmutable_al_registrar" BEFORE UPDATE OR DELETE ON "medicion_antropometrica" FOR EACH ROW EXECUTE FUNCTION "be_contenido_de_evaluacion_registrada_inmutable"();
CREATE TRIGGER "ejecucion_de_calculo_inmutable_al_registrar" BEFORE UPDATE OR DELETE ON "ejecucion_de_calculo" FOR EACH ROW EXECUTE FUNCTION "be_contenido_de_evaluacion_registrada_inmutable"();
CREATE TRIGGER "entrada_de_calculo_inmutable_al_registrar" BEFORE UPDATE OR DELETE ON "entrada_de_calculo" FOR EACH ROW EXECUTE FUNCTION "be_contenido_de_evaluacion_registrada_inmutable"();

-- REG-06-214 inciso 5: corregir y anular son el camino de **después** del registro. Sobre un borrador se edita.
CREATE FUNCTION "be_acto_sobre_medicion_registrada"() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_estado "EstadoDeEvaluacionAntropometrica";
BEGIN
  SELECT e."estado" INTO v_estado
    FROM "medicion_antropometrica" m JOIN "evaluacion_antropometrica" e ON e."id" = m."evaluacion_id"
   WHERE m."id" = NEW."medicion_id";
  IF v_estado <> 'REGISTRADA' THEN
    RAISE EXCEPTION 'BE: corregir o anular es el camino posterior al registro; en preparación el contenido se edita (REG-06-214 inciso 5)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "correccion_de_medicion_sobre_registrada" BEFORE INSERT ON "correccion_de_medicion" FOR EACH ROW EXECUTE FUNCTION "be_acto_sobre_medicion_registrada"();
CREATE TRIGGER "anulacion_de_medicion_sobre_registrada" BEFORE INSERT ON "anulacion_de_medicion" FOR EACH ROW EXECUTE FUNCTION "be_acto_sobre_medicion_registrada"();
