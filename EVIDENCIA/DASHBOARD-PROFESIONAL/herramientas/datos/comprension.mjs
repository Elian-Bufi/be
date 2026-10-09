// Escenarios de WP-DASHBOARD-COMPRENSION (encargo del 2026-10-09, §12), sobre los datos de WP-DASHBOARD-PROFESIONAL.
// Corren después de «recientes» (y de «verificar»: agregan datos que la verificación anterior no espera).
//
// comprension      Escenario D, sobre el asesorado A (tres áreas):
//                  - Nutrición: una revisión registrada en D-20 (Mantener), aplicada ese día, con la próxima revisión
//                    acordada para D+3. Después del corte: una comida de D-45 cargada en D-6 (se incorporó después, y con
//                    la versión vigente al cargarla, como hace la API) y una comida de D-41 sin confirmar, rectificada en
//                    D-3 (se corrigió después).
//                  - Entrenamiento: una revisión registrada en D-9 (Ajustar) y sin aplicar; un borrador del plan (v3)
//                    sin activar; una sesión del plan anterior (v1) de D-36 cargada en D-33, después de activarse v2; una
//                    sesión de D-12 cargada en D-2 y otra de D-15 corregida en D-1.
//                  - Antropometría: una toma reportada por la persona (D-5) y dos IMC calculados por un método (índice).
// comprension-e    Escenario E: el asesorado E, solo Nutrición, sin revisiones y con pocos registros (plan de hoy).
// verificar-comprension   lee por la API (como el profesional) y compara con lo esperado, recalculado acá desde la
//                  definición del escenario (no desde la API).
import { randomUUID } from 'node:crypto';
import { EJERCICIOS, PLANES_DE_ENTRENAMIENTO, PLANES_NUTRICIONALES, PROTOCOLOS, ZONA, comidasHistoricas, diaDeLaSemana, diaMenos, instante, sesionesHistoricas } from './escenario.mjs';

const diaMas = (fecha, k) => {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
};

/** Un día de la semana que no tiene sesión en la historia (lunes y jueves sí tienen), entre D-desde y D-hasta. */
function diaSinSesion(hoy, desde, hasta) {
  for (let k = desde; k >= hasta; k--) {
    const f = diaMenos(hoy, k);
    const d = diaDeLaSemana(f);
    if (d !== 0 && d !== 3) return { k, fecha: f };
  }
  throw new Error('no hay un día sin sesión en el rango');
}

const serie = (setIndex, carga, reps, rir) => ({ setIndex, load: carga === null ? null : { value: carga, unit: 'kg' }, completedRepetitions: reps, rir, perceivedExertion: null });

/** Lo que el escenario D agrega, con sus instantes: lo usan la fase y la verificación. */
export function agregadosDelEscenarioD(hoy) {
  const corteDeNutricion = instante(diaMenos(hoy, 20), '11:00');
  const corteDeEntrenamiento = instante(diaMenos(hoy, 9), '19:00');
  const sesionV1 = diaSinSesion(hoy, 40, 36);
  const sesionTardia = diaSinSesion(hoy, 14, 10);
  const sesionCorregida = diaSinSesion(hoy, 17, 15);
  return {
    corteDeNutricion,
    corteDeEntrenamiento,
    aplicacionDeNutricion: new Date(corteDeNutricion.getTime() + 15 * 60 * 1000),
    proximaRevision: diaMas(hoy, 3),
    comidas: [
      // Una merienda de D-45 (etapa 1) que se carga en D-6: la API la asocia a la versión vigente al cargarla (v2).
      { fecha: diaMenos(hoy, 45), comida: 'Merienda', plan: 'v2', opcion: 0, consumo: { status: 'PLAN_PORTIONS' }, ocurrio: instante(diaMenos(hoy, 45), '17:00'), registrado: instante(diaMenos(hoy, 6), '20:00'), rectificacion: null, anulacion: null, diferente: null },
      // Una merienda de D-41 sin confirmar, registrada ese día y rectificada en D-3.
      {
        fecha: diaMenos(hoy, 41),
        comida: 'Merienda',
        plan: 'v1',
        opcion: 0,
        consumo: { status: 'UNCONFIRMED' },
        ocurrio: instante(diaMenos(hoy, 41), '17:00'),
        registrado: instante(diaMenos(hoy, 41), '17:10'),
        rectificacion: { consumo: { status: 'PLAN_PORTIONS' }, momento: instante(diaMenos(hoy, 3), '10:00') },
        anulacion: null,
        diferente: null,
      },
    ],
    sesiones: [
      {
        fecha: sesionV1.fecha,
        semana: 7,
        plan: 'v1',
        sesion: 'ses-a',
        ocurrio: instante(sesionV1.fecha, '18:30'),
        registrado: instante(diaMenos(hoy, 33), '20:00'),
        condicion: 'REALIZADA',
        granularidad: 'SERIE',
        motivo: null,
        ejercicios: [
          { prescriptionId: 'rx-sentadilla', ejercicio: 'sentadilla', sets: [serie(1, 75, 8, 2), serie(2, 75, 8, 2), serie(3, 75, 7, 1)] },
          { prescriptionId: 'rx-peso-muerto', ejercicio: 'pesoMuerto', sets: [1, 2, 3].map((i) => serie(i, 85, 6, 2)) },
        ],
        resumen: null,
        correccion: null,
      },
      {
        fecha: sesionTardia.fecha,
        semana: 11,
        plan: 'v2',
        sesion: 'ses-b',
        ocurrio: instante(sesionTardia.fecha, '18:30'),
        registrado: instante(diaMenos(hoy, 2), '21:00'),
        condicion: 'REALIZADA',
        granularidad: 'SERIE',
        motivo: null,
        ejercicios: [{ prescriptionId: 'rx-banca', ejercicio: 'banca', sets: [serie(1, 60, 8, 2), serie(2, 60, 8, 1), serie(3, 60, 7, 1)] }],
        resumen: null,
        correccion: null,
      },
      {
        fecha: sesionCorregida.fecha,
        semana: 11,
        plan: 'v2',
        sesion: 'ses-a',
        ocurrio: instante(sesionCorregida.fecha, '18:30'),
        registrado: instante(sesionCorregida.fecha, '19:45'),
        condicion: 'REALIZADA',
        granularidad: 'SERIE',
        motivo: null,
        ejercicios: [{ prescriptionId: 'rx-sentadilla', ejercicio: 'sentadilla', sets: [serie(1, 82.5, 6, 2), serie(2, 82.5, 6, 1), serie(3, 82.5, 6, 1), serie(4, 82.5, 5, 0)] }],
        resumen: null,
        correccion: { motivo: 'Faltaba anotar la cuarta serie', momento: instante(diaMenos(hoy, 1), '09:00') },
      },
    ],
  };
}

export async function escenarioD(c) {
  const { e, hoy, pedir, sesion, en, sql, filas, comidas, sesiones, PROCEDENCIA, dominio, planesInstantaneas } = c;
  const pro = await sesion(e.proCorreo);
  const ase = await sesion(e.aseCorreo, 'APK');
  const d = agregadosDelEscenarioD(hoy);
  const procesos = await en((tx) =>
    filas(tx, `SELECT "id"::text AS "id", "alcance"::text AS "alcance" FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "estado" = 'ABIERTO'`, e.proId, e.aseId),
  );
  const proceso = (alcance) => procesos.find((p) => p.alcance === alcance)?.id;
  if (!proceso('NUTRICION') || !proceso('ENTRENAMIENTO')) throw new Error('faltan los seguimientos abiertos de A');

  // Nutrición: la revisión en D-20, aplicada (Mantener), con la próxima revisión acordada.
  const revisionN = randomUUID();
  await en(async (tx) => {
    await sql(
      tx,
      `INSERT INTO "revision_nutricional" ("id","proceso_id","periodo_inicio","periodo_fin","zona_horaria","evidencias","interpretacion","resultado","fundamento","proxima_accion","autor_id","procedencia","momento_de_ocurrencia","momento_de_registro")
       VALUES ($1::uuid,$2::uuid,$3::date,$4::date,$5,$6::jsonb,$7,'MANTENER'::"ResultadoDeRevision",$8,$9::jsonb,$10::uuid,$11::jsonb,$12,$12)`,
      revisionN, proceso('NUTRICION'), diaMenos(hoy, 50), diaMenos(hoy, 20), ZONA,
      JSON.stringify([{ type: 'PLAN_VERSION', id: e.nutricion.planV2 }]),
      'Interpretación sintética: registra con regularidad. No es un diagnóstico.',
      'Fundamento sintético del profesional.',
      JSON.stringify({ description: 'Seguir con el plan vigente y revisar en tres semanas.', nextReviewAt: d.proximaRevision }),
      e.proId, PROCEDENCIA, d.corteDeNutricion,
    );
    await sql(
      tx,
      `INSERT INTO "evento_de_nutricion" ("tipo","profesional_id","asesorado_id","recurso_tipo","recurso_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('RevisionRegistrada',$1::uuid,$2::uuid,'RevisionNutricional',$3::uuid,$1::uuid,$4::jsonb,$5,$5)`,
      e.proId, e.aseId, revisionN, PROCEDENCIA, d.corteDeNutricion,
    );
    const [evento] = await filas(
      tx,
      `INSERT INTO "evento_de_proceso" ("tipo","proceso_id","tipo_de_aplicacion","revision_id","estado_previo","estado_posterior","datos","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro")
       VALUES ('ContinuidadOCierreAplicado',$1::uuid,'CONTINUIDAD',$2::uuid,'ABIERTO','ABIERTO',$3::jsonb,$4::uuid,$5::jsonb,$6,$6) RETURNING "id"::text AS "id"`,
      proceso('NUTRICION'), revisionN, JSON.stringify({ resultado: 'MANTENER' }), e.proId, PROCEDENCIA, d.aplicacionDeNutricion,
    );
    await sql(
      tx,
      `INSERT INTO "aplicacion_de_revision" ("id","revision_id","evento_id","tipo","estado_de_proceso_posterior","momento_de_registro") VALUES ($1::uuid,$2::uuid,$3::uuid,'CONTINUIDAD','ABIERTO',$4)`,
      randomUUID(), revisionN, evento.id, d.aplicacionDeNutricion,
    );
    await sql(tx, `UPDATE "proceso_operativo" SET "version" = "version" + 1 WHERE "id" = $1::uuid`, proceso('NUTRICION'));
    const [terminal] = await filas(
      tx,
      `SELECT p."id"::text AS "id" FROM "proxima_revision" p WHERE p."proceso_id" = $1::uuid AND NOT EXISTS (SELECT 1 FROM "proxima_revision" s WHERE s."predecesora_id" = p."id")`,
      proceso('NUTRICION'),
    );
    await sql(
      tx,
      `INSERT INTO "proxima_revision" ("id","proceso_id","predecesora_id","fecha_objetivo","fuente","revision_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro")
       VALUES ($1::uuid,$2::uuid,$3::uuid,$4::date,'REVISION',$5::uuid,$6::uuid,$7::jsonb,$8,$8)`,
      randomUUID(), proceso('NUTRICION'), terminal?.id ?? null, d.proximaRevision, revisionN, e.proId, PROCEDENCIA, d.aplicacionDeNutricion,
    );
  });

  // Entrenamiento: la revisión en D-9 (Ajustar), registrada y sin aplicar.
  const revisionT = randomUUID();
  await en(async (tx) => {
    await sql(
      tx,
      `INSERT INTO "revision_de_entrenamiento" ("id","proceso_id","periodo_inicio","periodo_fin","zona_horaria","evidencias","interpretacion","resultado","fundamento","proxima_accion","autor_id","procedencia","momento_de_ocurrencia","momento_de_registro")
       VALUES ($1::uuid,$2::uuid,$3::date,$4::date,$5,$6::jsonb,$7,'AJUSTAR'::"ResultadoDeRevision",$8,$9::jsonb,$10::uuid,$11::jsonb,$12,$12)`,
      revisionT, proceso('ENTRENAMIENTO'), diaMenos(hoy, 35), diaMenos(hoy, 9), ZONA,
      JSON.stringify([{ type: 'PLAN_VERSION', id: e.entrenamiento.planV2 }]),
      'Interpretación sintética: la carga de la sentadilla subió de forma estable. No es un diagnóstico.',
      'Fundamento sintético del profesional.',
      JSON.stringify({ description: 'Ajustar el volumen del bloque siguiente.' }),
      e.proId, PROCEDENCIA, d.corteDeEntrenamiento,
    );
    await sql(
      tx,
      `INSERT INTO "evento_de_entrenamiento" ("tipo","profesional_id","asesorado_id","recurso_tipo","recurso_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('RevisionDeEntrenamientoRegistrada',$1::uuid,$2::uuid,'RevisionDeEntrenamiento',$3::uuid,$1::uuid,$4::jsonb,$5,$5)`,
      e.proId, e.aseId, revisionT, PROCEDENCIA, d.corteDeEntrenamiento,
    );
  });

  // El borrador del plan de entrenamiento (v3), por la API: no rige ni forma una etapa.
  const borrador = (await pedir('POST', `/advisees/${e.aseId}/training/plans`, { token: pro, cuerpo: { objectiveVersionId: e.entrenamiento.objetivoV1, basedOnPlanId: e.entrenamiento.planV2 } })).data;

  // Lo que pasó después de los cortes.
  await comidas(e, d.comidas, planesInstantaneas);
  await sesiones(e, d.sesiones, { v1: e.entrenamiento.planV1, v2: e.entrenamiento.planV2 });

  // Antropometría: una toma reportada por la persona (D-5) y una medida con talla (D-2), por la API; y el IMC (un
  // índice, calculado por un método) de las dos tomas con peso y talla: la de D-82 (historia) y la de D-2.
  const toma = async (fecha, origen, mediciones) => {
    const creada = (
      await pedir('POST', `/advisees/${e.aseId}/anthropometry/evaluation-drafts`, {
        token: pro,
        cuerpo: { occurredAt: instante(fecha, '08:30').toISOString(), specificationVersionId: PROTOCOLOS.perfil.version, source: { type: origen }, directMeasurements: mediciones.map(([metricCode, value, unit]) => ({ metricCode, value, unit })) },
      })
    ).data;
    const registrada = (await pedir('POST', `/anthropometry/evaluation-drafts/${creada.evaluationId}/register`, { token: pro, cuerpo: { expectedVersion: creada.version } })).data;
    return Object.fromEntries(registrada.measurements.map((m) => [m.metric, m.measurementId]));
  };
  await toma(diaMenos(hoy, 5), 'SELF_REPORTED', [['peso', 80.0, 'kg']]);
  const conTalla = await toma(diaMenos(hoy, 2), 'DIRECT_CAPTURE', [['peso', 79.6, 'kg'], ['talla', 178.0, 'cm']]);
  const [primera] = await en((tx) =>
    filas(
      tx,
      `SELECT max(CASE WHEN m."metrica" = 'peso' THEN m."id"::text END) AS "peso", max(CASE WHEN m."metrica" = 'talla' THEN m."id"::text END) AS "talla"
         FROM "medicion_antropometrica" m JOIN "evaluacion_antropometrica" ev ON ev."id" = m."evaluacion_id"
        WHERE ev."asesorado_id" = $1::uuid AND (ev."momento_de_ocurrencia" AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = $2::date`,
      e.aseId,
      diaMenos(hoy, 82),
    ),
  );
  const metodos = (await pedir('GET', '/professional-methods?limit=50', { token: pro })).data;
  const imc = metodos.find((m) => m.ruleId === 'be/imc@1');
  if (!imc) throw new Error('el catálogo no ofrece be/imc@1');
  for (const t of [primera, conTalla]) {
    await pedir('POST', `/advisees/${e.aseId}/calculations`, {
      token: pro,
      cuerpo: { purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: imc.methodVersionId, inputBindings: [{ inputCode: 'PESO', sourceRef: t.peso }, { inputCode: 'TALLA', sourceRef: t.talla }] },
    });
  }
  void ase;
  void dominio;
  return { revisionN, revisionT, borradorT: borrador.planId };
}

/** El asesorado E: solo Nutrición, sin revisiones, con un plan de hoy y pocos registros. */
export async function escenarioE(c) {
  const { e, pedir, sesion, registrarCuenta, vincular, dominio, cuerpoDeEvaluacionNutricional, cuerpoDeObjetivoNutricional } = c;
  const correo = `ase-e-una-area-${Date.now().toString(36)}@example.invalid`;
  const aseEId = await registrarCuenta(correo, 'APK');
  const pro = await sesion(e.proCorreo);
  const aseE = await sesion(correo, 'APK');
  await pedir('POST', '/me/health-data-consents', { token: aseE, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id } });
  await vincular(pro, aseE, aseEId, 'NUTRICION');
  const ev = (await pedir('POST', `/advisees/${aseEId}/nutrition/evaluations`, { token: pro, cuerpo: cuerpoDeEvaluacionNutricional(new Date(Date.now() - 3 * 3600_000)) })).data.evaluationId;
  const ob = (await pedir('POST', `/advisees/${aseEId}/nutrition/objectives`, { token: pro, cuerpo: cuerpoDeObjetivoNutricional(ev, new Date(Date.now() - 2 * 3600_000), 2000) })).data;
  const plan = (await pedir('POST', `/advisees/${aseEId}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: ob.versionId, initialStructure: PLANES_NUTRICIONALES.v2 } })).data;
  await pedir('POST', `/nutrition/plans/${plan.planId}/activate`, { token: pro, cuerpo: { expectedVersion: plan.version } });
  const op = (await pedir('GET', '/me/nutrition/today/options', { token: aseE, superficie: 'APK' })).data;
  for (const [rotulo, status] of [['Desayuno', 'PLAN_PORTIONS'], ['Almuerzo', 'UNCONFIRMED']]) {
    const m = op.meals.find((x) => x.label === rotulo);
    await pedir('POST', '/me/nutrition/meal-records', {
      token: aseE,
      superficie: 'APK',
      cuerpo: { kind: 'PLAN_OPTION', activePlanId: op.plan.planId, dayTypeId: op.dayTypes[0].dayTypeId, mealId: m.mealId, optionId: m.options[0].optionId, occurredAt: new Date(Date.now() - 60_000 * 4).toISOString(), consumption: { status }, observation: null },
    });
  }
  void PLANES_DE_ENTRENAMIENTO;
  void EJERCICIOS;
  return { aseECorreo: correo, aseEId };
}

/**
 * Lo esperado del escenario D, recalculado desde la definición del escenario (las listas de `escenario.mjs`, lo que
 * agrega esta fase y lo que registra «recientes»), sin leer la API.
 */
export function esperadoDelEscenarioD(hoy) {
  const d = agregadosDelEscenarioD(hoy);
  const corteN = d.corteDeNutricion.getTime();
  const corteT = d.corteDeEntrenamiento.getTime();
  const comidas = [...comidasHistoricas(hoy), ...d.comidas];
  const nut = { OCURRIO_DESPUES: 0, INCORPORADO_DESPUES: 0, CORREGIDO_DESPUES: 0 };
  for (const c of comidas) {
    const registrado = c.registrado.getTime();
    if (registrado > corteN) nut[c.ocurrio.getTime() > corteN ? 'OCURRIO_DESPUES' : 'INCORPORADO_DESPUES']++;
    else if ((c.rectificacion && c.rectificacion.momento.getTime() > corteN) || (c.anulacion && c.anulacion.momento.getTime() > corteN)) nut.CORREGIDO_DESPUES++;
  }
  // «recientes»: ayer cuatro registros (uno rectificado hoy, uno anulado, uno diferente) y hoy uno: todos después del corte.
  nut.OCURRIO_DESPUES += 5;
  const sesiones = [...sesionesHistoricas(hoy), ...d.sesiones];
  const trn = { OCURRIO_DESPUES: 0, INCORPORADO_DESPUES: 0, CORREGIDO_DESPUES: 0 };
  for (const s of sesiones) {
    const registrado = s.registrado.getTime();
    if (registrado > corteT) trn[s.ocurrio.getTime() > corteT ? 'OCURRIO_DESPUES' : 'INCORPORADO_DESPUES']++;
    else if (s.correccion && s.correccion.momento.getTime() > corteT) trn.CORREGIDO_DESPUES++;
  }
  // «recientes»: la sesión A de hoy.
  trn.OCURRIO_DESPUES += 1;
  return { d, nut, trn };
}
