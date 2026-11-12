import { FORMATO_DE_LA_EXPORTACION, type DominioDeLaExportacion } from '@be/domain';
import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * UF-06 (DL-169; 08 §19; 09 v0.12 §15): el archivo de la exportación propia, armado al descargarlo, nunca guardado.
 * - **Solo lo del titular:** cada lectura filtra por su identidad (como persona: el asesorado de sus vínculos, planes,
 *   registros, medidas y formularios). De sus profesionales va la referencia mínima: su identificador y su nombre
 *   profesional; nunca su correo ni nada de otra persona.
 * - **Lo que ve la persona:** los planes, en sus versiones activadas (un borrador no le existe); las medidas, de las tomas
 *   registradas. Cada fila va como está en la base, sin la procedencia técnica (requestId, superficie).
 * - **Siempre** el perfil, los métodos de acceso, los actos aceptados, los vínculos con sus consentimientos y los
 *   formularios; **por dominio**, lo de Nutrición, Entrenamiento y Antropometría que se pidió.
 */
export async function armarExportacion(tx: Tx, titularId: string, dominios: readonly DominioDeLaExportacion[], generadoEn: Date): Promise<Record<string, unknown>> {
  const filas = async (consulta: Promise<{ fila: unknown }[]>): Promise<unknown[]> => (await consulta).map((x) => x.fila);
  const [identidad] = await filas(tx.$queryRaw`SELECT to_jsonb(i) - 'procedencia' AS "fila" FROM "identidad" i WHERE i."id" = ${titularId}::uuid`);
  const archivo: Record<string, unknown> = {
    formato: FORMATO_DE_LA_EXPORTACION,
    generadoEn: generadoEn.toISOString(),
    dominios,
    titular: identidad ?? null,
    perfil: await filas(tx.$queryRaw`
      SELECT to_jsonb(v) - 'procedencia' AS "fila" FROM "version_de_perfil_propio" v
        JOIN "perfil_propio" p ON p."id" = v."perfil_propio_id"
       WHERE p."identidad_id" = ${titularId}::uuid ORDER BY v."momento_de_registro"`),
    metodosDeAcceso: await filas(tx.$queryRaw`
      SELECT jsonb_build_object('tipo', m."tipo", 'correo', COALESCE(m."correo", CASE WHEN m."tipo" = 'LOCAL' THEN m."referencia" END),
                                'desde', m."momento_de_registro") AS "fila"
        FROM "metodo_de_acceso" m WHERE m."identidad_id" = ${titularId}::uuid ORDER BY m."momento_de_registro"`),
    actos: await filas(tx.$queryRaw`
      SELECT to_jsonb(a) - 'procedencia' AS "fila" FROM "acto_registrable" a
       WHERE a."identidad_id" = ${titularId}::uuid ORDER BY a."momento_de_registro"`),
    vinculos: await filas(tx.$queryRaw`
      SELECT jsonb_build_object(
               'vinculo', to_jsonb(av) - 'procedencia',
               'profesional', jsonb_build_object('identidad', vi."profesional_id", 'nombreProfesional', pp."nombre_visible"),
               'consentimientos', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object(
                          'consentimiento', to_jsonb(c) - 'procedencia',
                          'versiones', COALESCE((SELECT jsonb_agg(to_jsonb(vc) - 'procedencia' ORDER BY vc."momento_de_registro")
                                                   FROM "version_de_consentimiento" vc WHERE vc."consentimiento_id" = c."id"), '[]'::jsonb)))
                   FROM "consentimiento" c WHERE c."alcance_de_vinculo_id" = av."id"), '[]'::jsonb)) AS "fila"
        FROM "alcance_de_vinculo" av
        JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
        LEFT JOIN "perfil_profesional" pp ON pp."identidad_id" = vi."profesional_id"
       WHERE vi."asesorado_id" = ${titularId}::uuid ORDER BY av."momento_de_registro"`),
    formularios: await filas(tx.$queryRaw`
      SELECT to_jsonb(r) - 'procedencia' AS "fila" FROM "respuesta_de_formulario" r
       WHERE r."asesorado_id" = ${titularId}::uuid ORDER BY r."momento_de_registro"`),
    habitos: await filas(tx.$queryRaw`
      SELECT to_jsonb(h) - 'procedencia' AS "fila" FROM "habitos_de_la_persona" h
       WHERE h."asesorado_id" = ${titularId}::uuid ORDER BY h."momento_de_registro"`),
  };
  if (dominios.includes('NUTRITION')) {
    archivo.nutricion = {
      planes: await filas(tx.$queryRaw`
        SELECT to_jsonb(v) - 'procedencia' AS "fila" FROM "version_de_plan_nutricional" v
          JOIN "plan_nutricional" p ON p."id" = v."plan_id"
         WHERE p."asesorado_id" = ${titularId}::uuid AND v."estado" = 'ACTIVADA' ORDER BY v."momento_de_registro"`),
      registros: await filas(tx.$queryRaw`
        SELECT to_jsonb(x) - 'procedencia' AS "fila" FROM "ingesta_nutricional" x
         WHERE x."asesorado_id" = ${titularId}::uuid ORDER BY x."momento_de_registro"`),
    };
  }
  if (dominios.includes('TRAINING')) {
    archivo.entrenamiento = {
      planes: await filas(tx.$queryRaw`
        SELECT to_jsonb(v) - 'procedencia' AS "fila" FROM "version_de_plan_de_entrenamiento" v
          JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id"
         WHERE p."asesorado_id" = ${titularId}::uuid AND v."estado" = 'ACTIVADA' ORDER BY v."momento_de_registro"`),
      registros: await filas(tx.$queryRaw`
        SELECT to_jsonb(x) - 'procedencia' AS "fila" FROM "ejecucion_de_entrenamiento" x
         WHERE x."asesorado_id" = ${titularId}::uuid ORDER BY x."momento_de_registro"`),
    };
  }
  if (dominios.includes('ANTHROPOMETRY')) {
    archivo.antropometria = {
      medidas: await filas(tx.$queryRaw`
        SELECT jsonb_build_object('toma', to_jsonb(e) - 'procedencia', 'mediciones', COALESCE((
                 SELECT jsonb_agg(to_jsonb(m) - 'procedencia' ORDER BY m."momento_de_registro")
                   FROM "medicion_antropometrica" m WHERE m."evaluacion_id" = e."id"), '[]'::jsonb)) AS "fila"
          FROM "evaluacion_antropometrica" e
         WHERE e."asesorado_id" = ${titularId}::uuid AND e."estado" = 'REGISTRADA' ORDER BY e."momento_de_registro"`),
    };
  }
  return archivo;
}
