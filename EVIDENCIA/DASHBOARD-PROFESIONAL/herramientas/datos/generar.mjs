// Generador reproducible de los datos sintéticos de WP-DASHBOARD-PROFESIONAL (DATOS-SINTETICOS.md), contra la API y la
// base LOCALES (nunca test ni producción: la URL de la base tiene que ser localhost).
//
// Fases (en orden; cada una guarda lo suyo en trabajo/estado.json):
//   cuentas    por la API: profesional, otro profesional, asesorado A y asesorado B. Imprime BE_DEMO_PROFESIONALES:
//              hay que reiniciar la API con ese valor para que los verifique (DL-036).
//   base       por la API: vínculos, B2, A3, evaluaciones, objetivos y los borradores de la etapa 1.
//   historia   por SQL, con las fechas del escenario: activación de la etapa 1 y de la etapa 2 (los borradores de la
//              etapa 2 se crean por la API entre las dos), 12 semanas de comidas, sesiones y tomas. Las inserciones
//              respetan los disparadores (no se desactivan) y escriben los hechos en la misma transacción, como la API.
//   recientes  por la API, hoy: comidas (con rectificación, anulación y una comida diferente), la toma de ayer y la
//              sesión de hoy. El asesorado B: su plan, dos comidas y una toma.
//   verificar  lee por la API (como el profesional) y compara con los resultados esperados escritos a mano.
//   volumen    el asesorado C, para medir (PRO-24): cuenta, vínculos y planes por la API; un año de comidas (4 por día),
//              sesiones (3 por semana) y tomas (cada dos semanas) por SQL, con los mismos disparadores. No se verifica
//              contra valores a mano: es volumen, no un caso de lectura.
//   descartable-cuentas  (revisión de #153, hallazgo 5) cuentas sintéticas SEPARADAS y DESCARTABLES, nuevas en cada
//              corrida: un profesional con Nutrición y Antropometría y un asesorado. Las de A, B y C no se tocan. Escribe
//              trabajo/demo-profesionales-descartable.txt: hay que reiniciar la API con ese BE_DEMO_PROFESIONALES.
//   descartable-datos    por la API, hoy: vínculos de Nutrición y Antropometría, una toma medida, una informada por la
//              persona (SELF_REPORTED) y otra medida, y dos corridas del IMC (be/imc@1): valores medidos, informados y
//              estimados en la misma serie de evolución. La revocación la hace el asesorado desde su web, en el recorrido.
//
// Uso: node datos/generar.mjs <fase> [origen de la API]   (BE_E2E_DATABASE_URL para otra base local)
import { REPO, enTrabajo } from '../rutas.mjs';
import fs from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  ALIMENTOS,
  EJERCICIOS,
  PLANES_DE_ENTRENAMIENTO,
  PLANES_NUTRICIONALES,
  PROTOCOLOS,
  ZONA,
  comidasDeVolumen,
  comidasHistoricas,
  diaMenos,
  instante,
  sesionesDeVolumen,
  sesionesHistoricas,
  tomaReciente,
  tomasDeVolumen,
  tomasHistoricas,
} from './escenario.mjs';

const requerirDominio = createRequire(`${REPO}/packages/domain/`);
const dominio = requerirDominio(`${REPO}/packages/domain/dist/index.js`);
const { PrismaClient } = createRequire(`${REPO}/apps/api/`)('@prisma/client');

const [fase, origen = 'http://localhost:3001'] = process.argv.slice(2);
const BASE = process.env.BE_E2E_DATABASE_URL ?? 'postgresql://be_test:be_test@localhost:55442/be_test_dashboard';
if (!['localhost', '127.0.0.1'].includes(new URL(BASE).hostname)) throw new Error('Guardia: la base no es local. Abortado.');
const ESTADO = enTrabajo('estado.json');
const CRED = 'clave-sintetica-de-prueba-01';
const PROCEDENCIA = JSON.stringify({ fuente: 'PROPIA', casoDeUso: 'DATOS-SINTETICOS', operacion: 'SIEMBRA-DASHBOARD', superficie: null, requestId: null });
const leerEstado = () => JSON.parse(fs.readFileSync(ESTADO, 'utf8'));
const guardarEstado = (cambios) => fs.writeFileSync(ESTADO, JSON.stringify({ ...(fs.existsSync(ESTADO) ? leerEstado() : {}), ...cambios }, null, 2));
const hoyCivil = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// ─── API ───────────────────────────────────────────────────────────────────────────────────────────────────────────

async function pedir(metodo, ruta, { token, cuerpo, clave, superficie = 'WEB', esperado } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': superficie };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clave !== false && ['POST', 'PUT', 'DELETE'].includes(metodo)) headers['Idempotency-Key'] = clave ?? `datos-${randomUUID()}`;
  const r = await fetch(`${origen}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  const json = texto ? JSON.parse(texto) : null;
  const esperados = esperado ? [esperado].flat() : [200, 201, 204];
  if (!esperados.includes(r.status)) throw new Error(`${metodo} ${ruta}: ${r.status} ${texto.slice(0, 600)}`);
  return json;
}
const sesion = async (correo, superficie = 'WEB') => (await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: CRED }, superficie, clave: false })).data.session.accessToken;

async function registrarCuenta(correo, superficie) {
  const r = await pedir('POST', '/registrations', {
    superficie,
    cuerpo: {
      registrationIntent: 'ADVISEE',
      identity: { localIdentifier: correo, localCredential: CRED },
      termsAcceptance: { versionId: dominio.VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: dominio.VERSION_VIGENTE.PRIVACIDAD_INFO.id },
    },
  });
  return r.data.identityId;
}

async function vincular(pro, ase, aseId, alcance) {
  const solicitud = await pedir('POST', '/relationship-requests', { token: pro, cuerpo: { target: { type: 'ADVISEE', identityId: aseId }, scope: { code: alcance }, purpose: dominio.FINALIDAD_DE_ALCANCE[alcance] } });
  const aceptada = await pedir('POST', `/relationship-requests/${solicitud.data.relationshipRequestId}/accept`, { token: ase, superficie: 'APK', cuerpo: { expectedVersion: solicitud.data.version ?? 'v1' } });
  const vinculoId = aceptada.data.relationshipId;
  const requisitos = await pedir('GET', `/relationships/${vinculoId}/consent-requirements`, { token: ase, superficie: 'APK' });
  await pedir('POST', `/relationships/${vinculoId}/consents`, { token: ase, superficie: 'APK', cuerpo: { consentVersionId: requisitos.data.consentVersion.id } });
  return vinculoId;
}

// ─── Base de datos (SQL parametrizado; los disparadores quedan activos) ───────────────────────────────────────────

const prisma = new PrismaClient({ datasources: { db: { url: BASE } } });
const en = (fn) => prisma.$transaction(fn, { timeout: 120_000, maxWait: 20_000 });
const sql = (tx, texto, ...valores) => tx.$executeRawUnsafe(texto, ...valores);
const filas = (tx, texto, ...valores) => tx.$queryRawUnsafe(texto, ...valores);

/** El catálogo nutricional disponible para el profesional, con la forma de `catalogo.disponibles` de la API. */
async function catalogoNutricional(tx, profesionalId, ids) {
  const r = await filas(
    tx,
    `SELECT e."id"::text AS "elementoId", v."id"::text AS "versionId", v."nombre", v."composicion"
       FROM "version_de_elemento_nutricional" v JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
      WHERE e."id" = ANY($1::uuid[]) AND v."disponibilidad" = 'DISPONIBLE'
        AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")
        AND (e."creado_por_id" IS NULL OR e."creado_por_id" = $2::uuid)`,
    ids,
    profesionalId,
  );
  return new Map(r.map((f) => [f.elementoId, { versionId: f.versionId, name: f.nombre, composition: f.composicion }]));
}

/** Los ejercicios citados, con la forma de `EjercicioCitable` que usa la instantánea de la API. */
async function catalogoDeEjercicios(tx, versionIds) {
  const r = await filas(tx, `SELECT v."id"::text AS "id", v."ejercicio_id"::text AS "ejercicioId", v."nombre", (v."disponibilidad" = 'DISPONIBLE') AS "disponible" FROM "version_de_ejercicio" v WHERE v."id" = ANY($1::uuid[])`, versionIds);
  return new Map(r.map((f) => [f.id, { ejercicioId: f.ejercicioId, nombre: f.nombre, disponible: f.disponible }]));
}

/** Los elementos del catálogo que cita un plan nutricional (la misma función que `planes.service.ts` de la API). */
const idsDeCatalogo = (c) => c.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => o.items.map((i) => i.catalogItemId))));

const huella = (valor) => createHash('sha256').update(dominio.serializacionCanonica(valor)).digest('hex');

/**
 * La activación de API-NUT-12 / API-TRN-12 en un instante del pasado: instantánea (con la misma función del dominio),
 * transición a ACTIVADA, el hecho, la relación efectiva y, si no hay un Proceso abierto, la apertura con su hecho.
 */
async function activarEnElPasado(alcance, versionId, momento, profesionalId, asesoradoId) {
  const nut = alcance === 'NUTRICION';
  const T = nut
    ? { version: 'version_de_plan_nutricional', instantanea: 'instantanea_de_plan_nutricional', plan: 'plan_nutricional', evento: 'evento_de_nutricion', tipo: 'VersionDePlanActivada', recurso: 'VersionDePlanNutricional', apertura: 'version_de_apertura_id' }
    : { version: 'version_de_plan_de_entrenamiento', instantanea: 'instantanea_de_plan_de_entrenamiento', plan: 'plan_de_entrenamiento', evento: 'evento_de_entrenamiento', tipo: 'VersionDePlanDeEntrenamientoActivada', recurso: 'VersionDePlanDeEntrenamiento', apertura: 'version_de_apertura_entrenamiento_id' };
  return en(async (tx) => {
    const [v] = await filas(tx, `SELECT "plan_id"::text AS "planId", "contenido", "estado"::text AS "estado" FROM "${T.version}" WHERE "id" = $1::uuid`, versionId);
    if (!v || v.estado !== 'BORRADOR') throw new Error(`la versión ${versionId} no es un borrador`);
    const instantanea = nut
      ? dominio.construirInstantanea(v.contenido, await catalogoNutricional(tx, profesionalId, idsDeCatalogo(v.contenido)))
      : dominio.construirInstantaneaDeEntrenamiento(v.contenido, await catalogoDeEjercicios(tx, dominio.referenciasDeEjercicio(v.contenido)));
    if (!instantanea) throw new Error(`sin instantánea para ${versionId}`);
    await sql(tx, `INSERT INTO "${T.instantanea}" ("id","version_de_plan_id","contenido","huella") VALUES ($1::uuid,$2::uuid,$3::jsonb,$4)`, randomUUID(), versionId, JSON.stringify(instantanea), huella(instantanea));
    await sql(tx, `UPDATE "${T.version}" SET "estado" = 'ACTIVADA', "version" = "version" + 1, "momento_de_activacion" = $2 WHERE "id" = $1::uuid`, versionId, momento);
    await sql(
      tx,
      `INSERT INTO "${T.evento}" ("tipo","profesional_id","asesorado_id","recurso_tipo","recurso_id","estado_previo","estado_posterior","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro")
       VALUES ($1::"${nut ? 'TipoDeEventoDeNutricion' : 'TipoDeEventoDeEntrenamiento'}",$2::uuid,$3::uuid,$4,$5::uuid,'BORRADOR','ACTIVADA',$2::uuid,$6::jsonb,$7,$7)`,
      T.tipo,
      profesionalId,
      asesoradoId,
      T.recurso,
      versionId,
      PROCEDENCIA,
      momento,
    );
    await sql(tx, `UPDATE "${T.plan}" SET "version_efectiva_id" = $2::uuid WHERE "id" = $1::uuid`, v.planId, versionId);
    const [abierto] = await filas(tx, `SELECT "id"::text AS "id" FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = $3::"Alcance" AND "estado" = 'ABIERTO'`, profesionalId, asesoradoId, alcance);
    if (!abierto) {
      const procesoId = randomUUID();
      await sql(
        tx,
        `INSERT INTO "proceso_operativo" ("id","profesional_id","asesorado_id","alcance","${T.apertura}","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ($1::uuid,$2::uuid,$3::uuid,$4::"Alcance",$5::uuid,$6::jsonb,$7,$7)`,
        procesoId,
        profesionalId,
        asesoradoId,
        alcance,
        versionId,
        PROCEDENCIA,
        momento,
      );
      await sql(
        tx,
        `INSERT INTO "evento_de_proceso" ("tipo","proceso_id","estado_posterior","datos","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('ProcesoOperativoAbierto',$1::uuid,'ABIERTO',$2::jsonb,$3::uuid,$4::jsonb,$5,$5)`,
        procesoId,
        JSON.stringify({ versionDeAperturaId: versionId, ocupacionProyectada: null }),
        profesionalId,
        PROCEDENCIA,
        momento,
      );
    }
    return instantanea;
  });
}

// ─── Fases ─────────────────────────────────────────────────────────────────────────────────────────────────────────

async function cuentas() {
  const sufijo = Date.now().toString(36);
  const correos = {
    proCorreo: `pro-seguimiento-${sufijo}@example.invalid`,
    terceroCorreo: `pro-tercero-${sufijo}@example.invalid`,
    aseCorreo: `ase-a-${sufijo}@example.invalid`,
    aseBCorreo: `ase-b-${sufijo}@example.invalid`,
  };
  const proId = await registrarCuenta(correos.proCorreo, 'WEB');
  const terceroId = await registrarCuenta(correos.terceroCorreo, 'WEB');
  const aseId = await registrarCuenta(correos.aseCorreo, 'APK');
  const aseBId = await registrarCuenta(correos.aseBCorreo, 'APK');
  guardarEstado({ ...correos, proId, terceroId, aseId, aseBId, hoy: hoyCivil() });
  const nombre = 'Lic. Sofía Paz (sintética)';
  console.log(
    `BE_DEMO_PROFESIONALES=${proId}|NUTRICION|SANITARIO|${nombre};${proId}|ENTRENAMIENTO|SANITARIO|${nombre};${proId}|ANTROPOMETRIA|SANITARIO|${nombre};${terceroId}|NUTRICION|SANITARIO|Lic. Tercera (sintética)`,
  );
}

const cuerpoDeEvaluacionNutricional = (ocurrio) => ({
  occurredAt: ocurrio.toISOString(),
  context: 'Consulta inicial sintética.',
  assessment: { entries: [{ concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' }] },
  evidenceReferences: [],
  professionalNotes: 'Notas sintéticas del profesional.',
});
const cuerpoDeObjetivoNutricional = (evaluationId, desde, kcal) => ({
  evaluationId,
  effectiveFrom: desde.toISOString(),
  effectiveUntil: null,
  estimatedEnergyRequirement: { value: kcal, unit: 'kcal/day' },
  macronutrientDistribution: { protein: { value: 130, unit: 'g/day' }, carbohydrate: { value: 220, unit: 'g/day' }, fat: { value: 65, unit: 'g/day' } },
  mealDistribution: 'Cuatro comidas.',
  rationale: 'Fundamento profesional sintético: decisión del profesional, sin cálculo de BE.',
  methodStatement: null,
});

async function base() {
  const e = leerEstado();
  const hoy = e.hoy;
  const pro = await sesion(e.proCorreo);
  const ase = await sesion(e.aseCorreo, 'APK');
  const aseB = await sesion(e.aseBCorreo, 'APK');
  for (const t of [ase, aseB]) {
    await pedir('POST', '/me/health-data-consents', { token: t, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id } });
  }
  const vinculos = {};
  for (const alcance of ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']) vinculos[alcance] = await vincular(pro, ase, e.aseId, alcance);
  // El asesorado B trabaja con este profesional solo Nutrición y Antropometría: su ficha es una vista parcial.
  for (const alcance of ['NUTRICION', 'ANTROPOMETRIA']) await vincular(pro, aseB, e.aseBId, alcance);

  // Nutrición: evaluación y objetivo de la etapa 1, vigentes desde D-84; borrador de la etapa 1.
  const inicio = instante(diaMenos(hoy, 84), '09:00');
  const evN = (await pedir('POST', `/advisees/${e.aseId}/nutrition/evaluations`, { token: pro, cuerpo: cuerpoDeEvaluacionNutricional(inicio) })).data.evaluationId;
  const obN = (await pedir('POST', `/advisees/${e.aseId}/nutrition/objectives`, { token: pro, cuerpo: cuerpoDeObjetivoNutricional(evN, inicio, 2100) })).data;
  const planN1 = (await pedir('POST', `/advisees/${e.aseId}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: obN.versionId, initialStructure: PLANES_NUTRICIONALES.v1 } })).data;

  // Entrenamiento: evaluación y objetivo vigentes desde D-84; borrador de la etapa 1.
  const evT = (
    await pedir('POST', `/advisees/${e.aseId}/training/evaluations`, {
      token: pro,
      cuerpo: {
        occurredAt: inicio.toISOString(),
        assessment: { entries: [{ concept: 'Experiencia en entrenamiento de fuerza', value: 'Un año, con interrupciones', source: 'REPORTED' }] },
        evidenceReferences: [],
        professionalNotes: 'Notas sintéticas del profesional.',
      },
    })
  ).data.evaluationId;
  const obT = (
    await pedir('POST', `/advisees/${e.aseId}/training/objectives`, {
      token: pro,
      cuerpo: {
        evaluationId: evT,
        effectiveFrom: inicio.toISOString(),
        effectiveUntil: null,
        objective: { statement: 'Ganar fuerza en los básicos con técnica estable (objetivo sintético).' },
        rationale: 'Fundamento sintético: decisión del profesional, sin cálculo de BE.',
      },
    })
  ).data;
  const planT1 = (await pedir('POST', `/advisees/${e.aseId}/training/plans`, { token: pro, cuerpo: { objectiveVersionId: obT.versionId, initialStructure: PLANES_DE_ENTRENAMIENTO.v1 } })).data;

  // Asesorado B: evaluación, objetivo y un plan nutricional que se activa hoy por la API (fase «recientes»).
  const evB = (await pedir('POST', `/advisees/${e.aseBId}/nutrition/evaluations`, { token: pro, cuerpo: cuerpoDeEvaluacionNutricional(new Date(Date.now() - 2 * 3600_000)) })).data.evaluationId;
  const obB = (await pedir('POST', `/advisees/${e.aseBId}/nutrition/objectives`, { token: pro, cuerpo: cuerpoDeObjetivoNutricional(evB, new Date(Date.now() - 3600_000), 1800) })).data;
  const planB = (await pedir('POST', `/advisees/${e.aseBId}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: obB.versionId, initialStructure: PLANES_NUTRICIONALES.v2 } })).data;

  guardarEstado({ vinculos, nutricion: { evaluacionId: evN, objetivoV1: obN.versionId, planV1: planN1.planId }, entrenamiento: { evaluacionId: evT, objetivoV1: obT.versionId, planV1: planT1.planId }, asesoradoB: { planId: planB.planId, version: planB.version } });
  console.log('base lista: vínculos (A: tres alcances; B: Nutrición y Antropometría), B2, A3, evaluaciones, objetivos y borradores de la etapa 1');
}

/** La comida de una instantánea por su rótulo, con sus ids (los asigna la API al guardar el plan). */
const comidaDe = (instantanea, rotulo) => instantanea.dayTypes[0].meals.find((m) => m.label === rotulo);

async function historia() {
  const e = leerEstado();
  const hoy = e.hoy;
  if (hoy !== hoyCivil()) throw new Error(`el escenario se armó para ${hoy}; hoy es ${hoyCivil()}: generá todo de nuevo en una base nueva`);
  const pro = await sesion(e.proCorreo);

  // Etapa 1: activación en el pasado (D-83).
  const instN1 = await activarEnElPasado('NUTRICION', e.nutricion.planV1, instante(diaMenos(hoy, 83), '09:00'), e.proId, e.aseId);
  const instT1 = await activarEnElPasado('ENTRENAMIENTO', e.entrenamiento.planV1, instante(diaMenos(hoy, 83), '10:00'), e.proId, e.aseId);

  // El objetivo nutricional de la etapa 2 (1950 kcal), vigente desde D-35: lo emite una revisión en la vida real; acá se
  // inserta con su predecesora y su hecho, como lo dejaría la API (las versiones del objetivo son de solo agregar).
  const objetivoV2 = randomUUID();
  const desdeV2 = instante(diaMenos(hoy, 35), '09:00');
  await en(async (tx) => {
    const [v1] = await filas(tx, `SELECT "objetivo_id"::text AS "objetivoId", "evaluacion_id"::text AS "evaluacionId", "distribucion_de_macronutrientes" AS "macros" FROM "version_de_objetivo_nutricional" WHERE "id" = $1::uuid`, e.nutricion.objetivoV1);
    await sql(
      tx,
      `INSERT INTO "version_de_objetivo_nutricional" ("id","objetivo_id","predecesora_id","evaluacion_id","vigente_desde","requerimiento_energetico","distribucion_de_macronutrientes","distribucion_por_comida","fundamento","autor_id","procedencia","momento_de_registro")
       VALUES ($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6::jsonb,$7::jsonb,'Cuatro comidas.','Ajuste sintético de la etapa 2: decisión del profesional.',$8::uuid,$9::jsonb,$5)`,
      objetivoV2,
      v1.objetivoId,
      e.nutricion.objetivoV1,
      v1.evaluacionId,
      desdeV2,
      JSON.stringify({ value: 1950, unit: 'kcal/day' }),
      JSON.stringify(v1.macros),
      e.proId,
      PROCEDENCIA,
    );
    await sql(
      tx,
      `INSERT INTO "evento_de_nutricion" ("tipo","profesional_id","asesorado_id","recurso_tipo","recurso_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('VersionDeObjetivoEmitida',$1::uuid,$2::uuid,'VersionDeObjetivoNutricional',$3::uuid,$1::uuid,$4::jsonb,$5,$5)`,
      e.proId,
      e.aseId,
      objetivoV2,
      PROCEDENCIA,
      desdeV2,
    );
  });

  // Etapa 2: borradores sucesores por la API (la efectiva ya es la etapa 1) y activación en el pasado (D-35).
  const n2 = (await pedir('POST', `/advisees/${e.aseId}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivoV2, basedOnPlanId: e.nutricion.planV1 } })).data;
  await pedir('PATCH', `/nutrition/plans/${n2.planId}`, { token: pro, cuerpo: { expectedVersion: n2.version, changes: PLANES_NUTRICIONALES.v2 } });
  const t2 = (await pedir('POST', `/advisees/${e.aseId}/training/plans`, { token: pro, cuerpo: { objectiveVersionId: e.entrenamiento.objetivoV1, basedOnPlanId: e.entrenamiento.planV1 } })).data;
  await pedir('PATCH', `/training/plans/${t2.planId}`, { token: pro, cuerpo: { expectedVersion: t2.version, changes: PLANES_DE_ENTRENAMIENTO.v2 } });
  const instN2 = await activarEnElPasado('NUTRICION', n2.planId, instante(diaMenos(hoy, 35), '09:30'), e.proId, e.aseId);
  const instT2 = await activarEnElPasado('ENTRENAMIENTO', t2.planId, instante(diaMenos(hoy, 35), '10:00'), e.proId, e.aseId);
  guardarEstado({ nutricion: { ...e.nutricion, objetivoV2, planV2: n2.planId }, entrenamiento: { ...e.entrenamiento, planV2: t2.planId } });

  await comidas(e, comidasHistoricas(hoy), { v1: { id: e.nutricion.planV1, inst: instN1 }, v2: { id: n2.planId, inst: instN2 } });
  await sesiones(e, sesionesHistoricas(hoy), { v1: e.entrenamiento.planV1, v2: t2.planId });
  await tomas(e, hoy);
  console.log('historia lista: etapas 1 y 2 activadas en el pasado, comidas, sesiones y tomas de 12 semanas');
}

const claveDeAlimento = Object.fromEntries(Object.entries(ALIMENTOS).map(([k, a]) => [a.id, k]));

async function comidas(e, lista, planes, asesoradoId = e.aseId) {
  await en(async (tx) => {
    for (const c of lista) {
      const plan = planes[c.plan];
      const comida = comidaDe(plan.inst, c.comida);
      const dayTypeId = plan.inst.dayTypes[0].dayTypeId;
      const id = randomUUID();
      if (c.diferente) {
        await sql(
          tx,
          `INSERT INTO "ingesta_nutricional" ("id","version_de_plan_id","asesorado_id","origen","modo","fecha_local","zona_horaria","descripcion","descripcion_de_porcion","dia_tipo_de_contexto_id","comida_de_contexto_id","secuencia","procedencia","momento_de_ocurrencia","momento_de_registro")
           VALUES ($1::uuid,$2::uuid,$3::uuid,'FUERA_DE_PRESCRIPCION','DESCRIPCION_LIBRE',$4::date,$5,$6,$7,$8,$9,0,$10::jsonb,$11,$12)`,
          id, plan.id, asesoradoId, c.fecha, ZONA, c.diferente.descripcion, c.diferente.aproximada, dayTypeId, comida.mealId, PROCEDENCIA, c.ocurrio, c.registrado,
        );
      } else {
        const opcion = comida.options[c.opcion];
        const cantidades = cantidadesDe(c.consumo, opcion);
        await sql(
          tx,
          `INSERT INTO "ingesta_nutricional" ("id","version_de_plan_id","asesorado_id","origen","modo","fecha_local","zona_horaria","dia_tipo_id","comida_id","opcion_id","cantidades_consumidas","secuencia","procedencia","momento_de_ocurrencia","momento_de_registro")
           VALUES ($1::uuid,$2::uuid,$3::uuid,'PRESCRIPTA','OPCIONES_DE_PLATO',$4::date,$5,$6,$7,$8,$9::jsonb,0,$10::jsonb,$11,$12)`,
          id, plan.id, asesoradoId, c.fecha, ZONA, dayTypeId, comida.mealId, opcion.optionId, JSON.stringify(cantidades), PROCEDENCIA, c.ocurrio, c.registrado,
        );
        if (c.rectificacion) {
          await sql(tx, `INSERT INTO "rectificacion_de_cantidades" ("id","ingesta_id","cantidades","autor_id","procedencia","momento_de_registro") VALUES ($1::uuid,$2::uuid,$3::jsonb,$4::uuid,$5::jsonb,$6)`, randomUUID(), id, JSON.stringify(cantidadesDe(c.rectificacion.consumo, opcion)), asesoradoId, PROCEDENCIA, c.rectificacion.momento);
          await eventoDeIngesta(tx, e, id, 'CantidadesDeIngestaRectificadas', c.rectificacion.momento, undefined, asesoradoId);
        }
      }
      await eventoDeIngesta(tx, e, id, 'IngestaRegistrada', c.ocurrio, c.registrado, asesoradoId);
      if (c.anulacion) {
        await sql(tx, `INSERT INTO "anulacion_de_ingesta" ("id","ingesta_id","autor_id","motivo","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5::jsonb,$6,$6)`, randomUUID(), id, asesoradoId, c.anulacion.motivo, PROCEDENCIA, c.anulacion.momento);
        await eventoDeIngesta(tx, e, id, 'IngestaAnulada', c.anulacion.momento, undefined, asesoradoId);
      }
    }
  });
  console.log(`  ${lista.length} comidas históricas`);
}

function cantidadesDe(consumo, opcion) {
  if (consumo.status === 'UNCONFIRMED') return { status: 'UNCONFIRMED', items: [] };
  if (consumo.status === 'PLAN_PORTIONS') return { status: 'PLAN_PORTIONS', items: opcion.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity, notEaten: false })) };
  return {
    status: 'REPORTED',
    items: opcion.items.map((it) => {
      const informado = consumo.informado[claveDeAlimento[it.catalogItemId]];
      return informado === 'NO_COMIDO' ? { itemId: it.itemId, quantity: null, notEaten: true } : { itemId: it.itemId, quantity: { value: informado, unit: it.quantity.unit }, notEaten: false };
    }),
  };
}

const eventoDeIngesta = (tx, e, ingestaId, tipo, ocurrio, registrado = ocurrio, asesoradoId = e.aseId) =>
  sql(
    tx,
    `INSERT INTO "evento_de_nutricion" ("tipo","profesional_id","asesorado_id","recurso_tipo","recurso_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ($1::"TipoDeEventoDeNutricion",$2::uuid,$3::uuid,'IngestaNutricional',$4::uuid,$3::uuid,$5::jsonb,$6,$7)`,
    tipo, e.proId, asesoradoId, ingestaId, PROCEDENCIA, ocurrio, registrado,
  );

const GRANULARIDAD = { SERIE: 'SERIE', EJERCICIO_O_SESION: 'EJERCICIO_O_SESION' };

async function sesiones(e, lista, versiones, asesoradoId = e.aseId) {
  await en(async (tx) => {
    for (const s of lista) {
      const versionId = versiones[s.plan];
      const contenido = {
        exercises: s.ejercicios.map((x) =>
          x.resumen
            ? { prescriptionId: x.prescriptionId, performedExerciseVersionId: EJERCICIOS[x.ejercicio].version, executionSummary: { description: x.resumen } }
            : { prescriptionId: x.prescriptionId, performedExerciseVersionId: EJERCICIOS[x.ejercicio].version, sets: x.sets },
        ),
        sessionSummary: null,
      };
      // Lo que se registró primero, si después se corrigió: la carga de la serie 2 de la sentadilla tipeada mal.
      const original = s.cargaTipeada
        ? { ...contenido, exercises: contenido.exercises.map((x) => (x.prescriptionId === 'rx-sentadilla' ? { ...x, sets: x.sets.map((y) => (y.setIndex === 2 ? { ...y, load: { value: s.cargaTipeada, unit: 'kg' } } : y)) } : x)) }
        : contenido;
      const borradorId = randomUUID();
      const ejecucionId = randomUUID();
      const granularidad = s.granularidad ? GRANULARIDAD[s.granularidad] : null;
      await sql(
        tx,
        `INSERT INTO "borrador_de_ejecucion_de_entrenamiento" ("id","asesorado_id","version_de_plan_id","sesion_planificada_id","fecha_local","zona_horaria","granularidad","condicion","motivo","contenido","momento_de_ocurrencia","momento_de_registro","momento_de_actualizacion")
         VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5::date,$6,$7::"GranularidadDeRegistro",$8::"CondicionDeSesion",$9,$10::jsonb,$11,$11,$12)`,
        borradorId, asesoradoId, versionId, s.sesion, s.fecha, ZONA, granularidad, s.condicion, s.motivo, JSON.stringify(original), s.ocurrio, s.registrado,
      );
      await sql(
        tx,
        `INSERT INTO "ejecucion_de_entrenamiento" ("id","asesorado_id","version_de_plan_id","sesion_planificada_id","fecha_local","zona_horaria","borrador_id","granularidad","condicion","motivo","contenido","procedencia","momento_de_ocurrencia","momento_de_registro")
         VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5::date,$6,$7::uuid,$8::"GranularidadDeRegistro",$9::"CondicionDeSesion",$10,$11::jsonb,$12::jsonb,$13,$14)`,
        ejecucionId, asesoradoId, versionId, s.sesion, s.fecha, ZONA, borradorId, granularidad, s.condicion, s.motivo, JSON.stringify(original), PROCEDENCIA, s.ocurrio, s.registrado,
      );
      await sql(
        tx,
        `INSERT INTO "evento_de_entrenamiento" ("tipo","profesional_id","asesorado_id","recurso_tipo","recurso_id","estado_previo","estado_posterior","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('EjecucionRegistrada',$1::uuid,$2::uuid,'EjecucionDeEntrenamiento',$3::uuid,'BORRADOR','REGISTRADA',$2::uuid,$4::jsonb,$5,$6)`,
        e.proId, asesoradoId, ejecucionId, PROCEDENCIA, s.ocurrio, s.registrado,
      );
      if (s.correccion) {
        const correccionId = randomUUID();
        await sql(
          tx,
          `INSERT INTO "correccion_de_ejecucion_de_entrenamiento" ("id","ejecucion_id","autor_id","motivo","contenido","procedencia","momento_de_registro") VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5::jsonb,$6::jsonb,$7)`,
          correccionId, ejecucionId, e.proId, s.correccion.motivo, JSON.stringify({ ...contenido, granularidad, condicion: s.condicion, motivo: s.motivo }), PROCEDENCIA, s.correccion.momento,
        );
        await sql(
          tx,
          `INSERT INTO "evento_de_entrenamiento" ("tipo","profesional_id","asesorado_id","recurso_tipo","recurso_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('EjecucionCorregida',$1::uuid,$2::uuid,'EjecucionDeEntrenamiento',$3::uuid,$1::uuid,$4::jsonb,$5,$5)`,
          e.proId, asesoradoId, ejecucionId, PROCEDENCIA, s.correccion.momento,
        );
      }
    }
  });
  console.log(`  ${lista.length} sesiones históricas`);
}

async function tomas(e, hoy, lista = tomasHistoricas(hoy), asesoradoId = e.aseId) {
  await en(async (tx) => {
    for (const t of lista) {
      const ocurrio = instante(t.fecha, t.hora);
      const registrado = new Date(ocurrio.getTime() + 30 * 60 * 1000);
      const evaluacionId = randomUUID();
      await sql(tx, `INSERT INTO "evaluacion_antropometrica" ("id","profesional_id","asesorado_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ($1::uuid,$2::uuid,$3::uuid,$4::jsonb,$5,$5)`, evaluacionId, e.proId, asesoradoId, PROCEDENCIA, ocurrio);
      const porMetrica = new Map();
      for (const [metrica, valor, unidad] of t.mediciones) {
        const medicionId = randomUUID();
        porMetrica.set(metrica, medicionId);
        await sql(
          tx,
          `INSERT INTO "medicion_antropometrica" ("id","evaluacion_id","metrica","valor","unidad_de_origen","protocolo_version_id","origen","clase","procedencia","momento_de_ocurrencia","momento_de_registro")
           VALUES ($1::uuid,$2::uuid,$3,$4,$5,$6::uuid,'CAPTURA_DIRECTA','MEDIDO',$7::jsonb,$8,$9)`,
          medicionId, evaluacionId, metrica, valor, unidad, PROTOCOLOS[t.protocolo].version, PROCEDENCIA, ocurrio, registrado,
        );
      }
      await sql(tx, `UPDATE "evaluacion_antropometrica" SET "estado" = 'REGISTRADA', "momento_de_registro_de_evaluacion" = $2 WHERE "id" = $1::uuid`, evaluacionId, registrado);
      await sql(tx, `INSERT INTO "evento_de_antropometria" ("tipo","evaluacion_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('EvaluacionAntropometricaRegistrada',$1::uuid,$2::uuid,$3::jsonb,$4,$4)`, evaluacionId, e.proId, PROCEDENCIA, registrado);
      for (const c of t.correcciones ?? []) {
        const medicionId = porMetrica.get(c.metrica);
        await sql(tx, `INSERT INTO "correccion_de_medicion" ("id","medicion_id","autor_id","motivo","valor","unidad_de_origen","procedencia","momento_de_registro") VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7::jsonb,$8)`, randomUUID(), medicionId, e.proId, c.motivo, c.valor, c.unidad, PROCEDENCIA, c.momento);
        await sql(tx, `INSERT INTO "evento_de_antropometria" ("tipo","evaluacion_id","medicion_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('MedicionCorregida',$1::uuid,$2::uuid,$3::uuid,$4::jsonb,$5,$5)`, evaluacionId, medicionId, e.proId, PROCEDENCIA, c.momento);
      }
      for (const a of t.anulaciones ?? []) {
        const medicionId = porMetrica.get(a.metrica);
        await sql(tx, `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5::jsonb,$6,$6)`, randomUUID(), medicionId, e.proId, a.motivo, PROCEDENCIA, a.momento);
        await sql(tx, `INSERT INTO "evento_de_antropometria" ("tipo","evaluacion_id","medicion_id","actor_id","procedencia","momento_de_ocurrencia","momento_de_registro") VALUES ('MedicionAnulada',$1::uuid,$2::uuid,$3::uuid,$4::jsonb,$5,$5)`, evaluacionId, medicionId, e.proId, PROCEDENCIA, a.momento);
      }
    }
  });
  console.log(`  ${lista.length} tomas`);
}

async function recientes() {
  const e = leerEstado();
  const hoy = e.hoy;
  if (hoy !== hoyCivil()) throw new Error(`el escenario se armó para ${hoy}; hoy es ${hoyCivil()}`);
  const pro = await sesion(e.proCorreo);
  const ase = await sesion(e.aseCorreo, 'APK');
  const opciones = (await pedir('GET', '/me/nutrition/today/options', { token: ase, superficie: 'APK' })).data;
  const meal = (rotulo) => opciones.meals.find((m) => m.label === rotulo);
  const dayTypeId = opciones.dayTypes[0].dayTypeId;
  const registrar = (rotulo, opcion, status, ocurrio) =>
    pedir('POST', '/me/nutrition/meal-records', {
      token: ase,
      superficie: 'APK',
      cuerpo: { kind: 'PLAN_OPTION', activePlanId: opciones.plan.planId, dayTypeId, mealId: meal(rotulo).mealId, optionId: meal(rotulo).options[opcion].optionId, occurredAt: ocurrio.toISOString(), consumption: { status }, observation: null },
    });
  // Ayer (D-1): las cuatro comidas; el almuerzo sin confirmar y rectificado hoy; la merienda, anulada.
  const ayer = diaMenos(hoy, 1);
  await registrar('Desayuno', 0, 'PLAN_PORTIONS', instante(ayer, '08:00'));
  const almuerzo = (await registrar('Almuerzo', 0, 'UNCONFIRMED', instante(ayer, '13:00'))).data;
  await pedir('POST', `/nutrition/meal-records/${almuerzo.recordId}/consumed-quantities`, { token: ase, superficie: 'APK', cuerpo: { consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: almuerzo.version } });
  const merienda = (await registrar('Merienda', 0, 'PLAN_PORTIONS', instante(ayer, '17:00'))).data;
  await pedir('POST', `/nutrition/meal-records/${merienda.recordId}/annulment`, { token: ase, superficie: 'APK', cuerpo: { reason: 'No la comí', expectedVersion: merienda.version } });
  await pedir('POST', '/me/nutrition/meal-records', {
    token: ase,
    superficie: 'APK',
    cuerpo: { kind: 'DIFFERENT', activePlanId: opciones.plan.planId, dayTypeId, mealId: meal('Cena').mealId, description: 'Milanesa con ensalada en un cumpleaños', approximateQuantity: 'Un plato', mediaIds: [], occurredAt: instante(ayer, '21:30').toISOString() },
  });
  // Hoy (D0): el desayuno con las porciones del plan.
  await registrar('Desayuno', 1, 'PLAN_PORTIONS', new Date(Date.now() - 60_000 * 5));

  // La toma de ayer, cargada hoy por la API (API-ANT-02): carga tardía.
  const t = tomaReciente(hoy);
  await pedir('POST', `/advisees/${e.aseId}/anthropometry/evaluations`, {
    token: pro,
    cuerpo: { occurredAt: instante(t.fecha, t.hora).toISOString(), specificationVersionId: PROTOCOLOS[t.protocolo].version, source: { type: 'DIRECT_CAPTURE' }, directMeasurements: t.mediciones.map(([metricCode, value, unit]) => ({ metricCode, value, unit })) },
  });

  // La sesión A de hoy, por el flujo de la APK (TRN-14 → 15 → 17 → 18).
  const hoyT = (await pedir('GET', '/me/training/today', { token: ase, superficie: 'APK' })).data;
  const ocurrencia = hoyT.occurrences.find((o) => o.plannedSession.sessionId === 'ses-a');
  const borrador = (await pedir('PUT', `/training/occurrences/${ocurrencia.occurrenceId}/execution-draft`, { token: ase, superficie: 'APK', cuerpo: {}, clave: false, esperado: [200, 201] })).data;
  const semana = 12;
  const cs = 77.5 + 2.5 * (semana - 8);
  const guardado = (
    await pedir('PATCH', `/training/execution-drafts/${borrador.draftId}`, {
      token: ase,
      superficie: 'APK',
      cuerpo: {
        expectedVersion: borrador.version,
        changes: {
          granularity: 'SET',
          sessionCondition: 'COMPLETED',
          exercises: [
            { prescriptionId: 'rx-sentadilla', performedExerciseVersionId: EJERCICIOS.sentadilla.version, sets: [1, 2, 3, 4].map((i) => ({ setIndex: i, load: { value: cs, unit: 'kg' }, completedRepetitions: i === 4 ? 5 : 6, rir: i === 4 ? 0 : 1, perceivedExertion: null })) },
            { prescriptionId: 'rx-peso-muerto', performedExerciseVersionId: EJERCICIOS.pesoMuerto.version, sets: [1, 2, 3].map((i) => ({ setIndex: i, load: { value: 95, unit: 'kg' }, completedRepetitions: 5, rir: 2, perceivedExertion: null })) },
          ],
        },
      },
    })
  ).data;
  await pedir('POST', `/training/execution-drafts/${borrador.draftId}/confirm`, { token: ase, superficie: 'APK', cuerpo: { expectedVersion: guardado.version } });

  // Asesorado B: plan activado hoy, dos comidas y una toma de hace 10 días (por SQL, como la historia).
  const aseB = await sesion(e.aseBCorreo, 'APK');
  await pedir('POST', `/nutrition/plans/${e.asesoradoB.planId}/activate`, { token: pro, cuerpo: { expectedVersion: e.asesoradoB.version } });
  const opB = (await pedir('GET', '/me/nutrition/today/options', { token: aseB, superficie: 'APK' })).data;
  for (const [rotulo, status] of [['Desayuno', 'PLAN_PORTIONS'], ['Almuerzo', 'UNCONFIRMED']]) {
    const m = opB.meals.find((x) => x.label === rotulo);
    await pedir('POST', '/me/nutrition/meal-records', {
      token: aseB,
      superficie: 'APK',
      cuerpo: { kind: 'PLAN_OPTION', activePlanId: opB.plan.planId, dayTypeId: opB.dayTypes[0].dayTypeId, mealId: m.mealId, optionId: m.options[0].optionId, occurredAt: new Date(Date.now() - 60_000 * 3).toISOString(), consumption: { status }, observation: null },
    });
  }
  await tomas(e, hoy, [{ fecha: diaMenos(hoy, 10), hora: '09:00', protocolo: 'perfil', mediciones: [['peso', 64.3, 'kg'], ['perimetro-cintura', 74.0, 'cm']] }], e.aseBId);
  console.log('recientes listas: comidas de ayer y hoy (rectificada, anulada y diferente), la toma de ayer, la sesión de hoy y el asesorado B');
}

async function verificar() {
  const { verificarContraLoEsperado } = await import('./verificar.mjs');
  const e = leerEstado();
  const pro = await sesion(e.proCorreo);
  const tercero = await sesion(e.terceroCorreo);
  const resultado = await verificarContraLoEsperado({ pedir, e, pro, tercero });
  fs.writeFileSync(enTrabajo('verificacion.json'), JSON.stringify(resultado, null, 2));
  console.log(`verificación: ${resultado.ok} de ${resultado.total} comprobaciones coinciden${resultado.fallas.length ? `; fallan: ${resultado.fallas.map((f) => f.que).join(' · ')}` : ''}`);
  if (resultado.fallas.length) process.exitCode = 1;
}


/** El asesorado C (volumen, PRO-24): un año denso con la etapa 1 de los dos planes, activada en D-366. */
async function volumen() {
  const e = leerEstado();
  const hoy = e.hoy;
  if (hoy !== hoyCivil()) throw new Error(`el escenario se armó para ${hoy}; hoy es ${hoyCivil()}`);
  const aseCCorreo = `ase-c-volumen-${Date.now().toString(36)}@example.invalid`;
  const aseCId = await registrarCuenta(aseCCorreo, 'APK');
  const pro = await sesion(e.proCorreo);
  const aseC = await sesion(aseCCorreo, 'APK');
  await pedir('POST', '/me/health-data-consents', { token: aseC, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id } });
  for (const alcance of ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']) await vincular(pro, aseC, aseCId, alcance);
  const inicio = instante(diaMenos(hoy, 366), '09:00');
  const evN = (await pedir('POST', `/advisees/${aseCId}/nutrition/evaluations`, { token: pro, cuerpo: cuerpoDeEvaluacionNutricional(inicio) })).data.evaluationId;
  const obN = (await pedir('POST', `/advisees/${aseCId}/nutrition/objectives`, { token: pro, cuerpo: cuerpoDeObjetivoNutricional(evN, inicio, 2100) })).data;
  const planN = (await pedir('POST', `/advisees/${aseCId}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: obN.versionId, initialStructure: PLANES_NUTRICIONALES.v1 } })).data;
  const evT = (await pedir('POST', `/advisees/${aseCId}/training/evaluations`, { token: pro, cuerpo: { occurredAt: inicio.toISOString(), assessment: { entries: [{ concept: 'Experiencia', value: 'Sintética', source: 'REPORTED' }] }, evidenceReferences: [], professionalNotes: 'Volumen sintético.' } })).data.evaluationId;
  const obT = (await pedir('POST', `/advisees/${aseCId}/training/objectives`, { token: pro, cuerpo: { evaluationId: evT, effectiveFrom: inicio.toISOString(), effectiveUntil: null, objective: { statement: 'Objetivo sintético de volumen.' }, rationale: 'Fundamento sintético.' } })).data;
  const planT = (await pedir('POST', `/advisees/${aseCId}/training/plans`, { token: pro, cuerpo: { objectiveVersionId: obT.versionId, initialStructure: PLANES_DE_ENTRENAMIENTO.v1 } })).data;
  const instN = await activarEnElPasado('NUTRICION', planN.planId, instante(diaMenos(hoy, 366), '09:30'), e.proId, aseCId);
  await activarEnElPasado('ENTRENAMIENTO', planT.planId, instante(diaMenos(hoy, 366), '10:00'), e.proId, aseCId);
  await comidas(e, comidasDeVolumen(hoy), { v1: { id: planN.planId, inst: instN } }, aseCId);
  await sesiones(e, sesionesDeVolumen(hoy), { v1: planT.planId }, aseCId);
  await tomas(e, hoy, tomasDeVolumen(hoy), aseCId);
  guardarEstado({ aseCCorreo, aseCId });
  console.log('volumen listo: el asesorado C con un año de comidas, sesiones y tomas');
}

/** El nombre del profesional descartable (BE_DEMO_PROFESIONALES); el asesorado lo ve en su vínculo. */
const PROFESIONAL_DESCARTABLE = 'Lic. Descartable (sintética)';
/** El IMC del catálogo de BE (DL-111): peso en kg y talla en cm, de captura directa o reportados por la persona. */
const REGLA_DEL_IMC = 'be/imc@1';

async function descartableCuentas() {
  const sufijo = Date.now().toString(36);
  const proCorreo = `pro-descartable-${sufijo}@example.invalid`;
  const aseCorreo = `ase-descartable-${sufijo}@example.invalid`;
  const proId = await registrarCuenta(proCorreo, 'WEB');
  const aseId = await registrarCuenta(aseCorreo, 'APK');
  guardarEstado({ descartable: { proCorreo, proId, aseCorreo, aseId, profesional: PROFESIONAL_DESCARTABLE, creado: new Date().toISOString() } });
  const actual = /BE_DEMO_PROFESIONALES=(.*)/.exec(fs.readFileSync(enTrabajo('demo-profesionales.txt'), 'utf8'))?.[1]?.trim() ?? '';
  const extendido = [actual, `${proId}|NUTRICION|SANITARIO|${PROFESIONAL_DESCARTABLE}`, `${proId}|ANTROPOMETRIA|SANITARIO|${PROFESIONAL_DESCARTABLE}`].filter(Boolean).join(';');
  fs.writeFileSync(enTrabajo('demo-profesionales-descartable.txt'), `BE_DEMO_PROFESIONALES=${extendido}\n`);
  console.log('cuentas descartables listas: reiniciá la API con trabajo/demo-profesionales-descartable.txt y seguí con descartable-datos');
}

async function descartableDatos() {
  const e = leerEstado();
  const d = e.descartable;
  if (!d?.proId) throw new Error('primero: descartable-cuentas');
  const hoy = hoyCivil();
  const pro = await sesion(d.proCorreo);
  const ase = await sesion(d.aseCorreo, 'APK');
  await pedir('POST', '/me/health-data-consents', { token: ase, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id } });
  const vinculos = {};
  for (const alcance of ['NUTRICION', 'ANTROPOMETRIA']) vinculos[alcance] = await vincular(pro, ase, d.aseId, alcance);

  const metodos = (await pedir('GET', '/professional-methods?limit=50', { token: pro })).data;
  const imc = metodos.find((m) => m.ruleId === REGLA_DEL_IMC);
  if (!imc) throw new Error(`el catálogo no ofrece ${REGLA_DEL_IMC}`);
  /** Una toma por el flujo de la web (borrador y registro, API-ANT-07 y 11): devuelve la medición de cada métrica. */
  const toma = async (fecha, origen, mediciones) => {
    const creada = (
      await pedir('POST', `/advisees/${d.aseId}/anthropometry/evaluation-drafts`, {
        token: pro,
        cuerpo: { occurredAt: instante(fecha, '08:30').toISOString(), specificationVersionId: PROTOCOLOS.perfil.version, source: { type: origen }, directMeasurements: mediciones.map(([metricCode, value, unit]) => ({ metricCode, value, unit })) },
      })
    ).data;
    const registrada = (await pedir('POST', `/anthropometry/evaluation-drafts/${creada.evaluationId}/register`, { token: pro, cuerpo: { expectedVersion: creada.version } })).data;
    return { evaluationId: registrada.evaluationId, porMetrica: Object.fromEntries(registrada.measurements.map((m) => [m.metric, m.measurementId])) };
  };
  // Medido, reportado por la persona y medido otra vez; el IMC, calculado por un método, de las dos tomas medidas.
  const fechas = { primera: diaMenos(hoy, 20), informada: diaMenos(hoy, 12), segunda: diaMenos(hoy, 4) };
  const primera = await toma(fechas.primera, 'DIRECT_CAPTURE', [['peso', 81.2, 'kg'], ['talla', 178.0, 'cm']]);
  const informada = await toma(fechas.informada, 'SELF_REPORTED', [['peso', 80.5, 'kg']]);
  const segunda = await toma(fechas.segunda, 'DIRECT_CAPTURE', [['peso', 79.9, 'kg'], ['talla', 178.0, 'cm']]);
  const corridas = [];
  for (const t of [primera, segunda]) {
    const r = await pedir('POST', `/advisees/${d.aseId}/calculations`, {
      token: pro,
      cuerpo: { purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: imc.methodVersionId, inputBindings: [{ inputCode: 'PESO', sourceRef: t.porMetrica.peso }, { inputCode: 'TALLA', sourceRef: t.porMetrica.talla }] },
    });
    corridas.push({ valor: r.data.result.magnitude.value, unidad: r.data.result.magnitude.unit });
  }
  guardarEstado({ descartable: { ...d, hoy, vinculos, fechas, evaluaciones: { primera: primera.evaluationId, informada: informada.evaluationId, segunda: segunda.evaluationId }, imc: corridas, datos: true } });
  console.log(`datos descartables listos: tres tomas de peso (medida, reportada por la persona y medida) y dos IMC calculados por un método (${corridas.map((c) => `${c.valor} ${c.unidad}`).join(', ')})`);
}

const FASES = { cuentas, base, historia, recientes, verificar, volumen, 'descartable-cuentas': descartableCuentas, 'descartable-datos': descartableDatos };
if (!FASES[fase]) {
  console.error('uso: node datos/generar.mjs cuentas|base|historia|recientes|verificar|volumen|descartable-cuentas|descartable-datos [origen de la API]');
  process.exit(2);
}
try {
  await FASES[fase]();
} finally {
  await prisma.$disconnect();
}
