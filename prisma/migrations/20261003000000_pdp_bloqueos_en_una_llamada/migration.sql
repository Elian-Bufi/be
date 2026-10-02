-- P2028 (503 intermitente bajo carga) · los bloqueos del PDP en una sola llamada a la base.
--
-- El PDP toma en modo compartido, en el orden único de prisma/concurrencia.ts, todo lo que puede cortar un acceso.
-- Eran seis sentencias, y cada una era una ida y vuelta entre la API y la base con la conexión tomada. Bajo carga,
-- esas idas y vueltas retenían las conexiones del pool y una transacción esperaba más de 2 s para empezar (P2028).
--
-- La función ejecuta las mismas seis sentencias, en el mismo orden y con los mismos modos. Las sentencias de una
-- función PL/pgSQL corren una después de otra, así que los bloqueos se toman igual que antes: cambia solo la cantidad
-- de idas y vueltas, que pasa de seis a una. Devuelve 1 para que se pueda leer como una fila común.
CREATE OR REPLACE FUNCTION "be_bloquear_lo_que_corta"(p_actor uuid, p_titular uuid) RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM 1 FROM "identidad" WHERE "id" IN (p_actor, p_titular) ORDER BY "id" FOR SHARE;
  PERFORM 1 FROM "verificacion_profesional" WHERE "identidad_id" = p_actor ORDER BY "id" FOR SHARE;
  PERFORM 1 FROM "habilitacion" WHERE "identidad_id" = p_actor ORDER BY "id" FOR SHARE;
  PERFORM 1 FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
   WHERE vi."profesional_id" = p_actor AND vi."asesorado_id" = p_titular AND av."estado" <> 'FINALIZADO'
   ORDER BY av."id" FOR SHARE OF av;
  PERFORM 1 FROM "consentimiento" c
    JOIN "alcance_de_vinculo" av ON av."id" = c."alcance_de_vinculo_id"
    JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
   WHERE vi."profesional_id" = p_actor AND vi."asesorado_id" = p_titular AND av."estado" <> 'FINALIZADO'
   ORDER BY c."id" FOR SHARE OF c;
  PERFORM 1 FROM "acto_registrable"
   WHERE "identidad_id" = p_titular AND "tipo" = 'DATOS_SALUD_BE' AND "estado" = 'VIGENTE' FOR SHARE;
  RETURN 1;
END
$$;
