-- Un reintento con la misma Idempotency-Key vuelve a decidir con el PDP antes de devolver la respuesta guardada
-- (09 v0.16.1:220-221; 08:601). El registro guarda las decisiones que se permitieron en el pedido original: la
-- operación, el actor, el par profesional-titular, el alcance y el recurso. Nada de la respuesta ni de la credencial.
-- Los registros anteriores quedan sin decisiones: se sirven como antes.
ALTER TABLE "registro_de_idempotencia" ADD COLUMN "decisiones" JSONB;
