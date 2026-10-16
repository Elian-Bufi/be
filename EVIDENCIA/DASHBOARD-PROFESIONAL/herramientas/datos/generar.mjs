// Generador reproducible de los datos sintéticos de WP-DASHBOARD-PROFESIONAL (DATOS-SINTETICOS.md), contra la API y la
// base LOCALES (nunca test ni producción: la URL de la base tiene que ser localhost).
//
// Fases (en orden; cada una guarda lo suyo en trabajo/estado.json):
//   cuentas    por la API: profesional, otro profesional, asesorado A y asesorado B. Imprime BE_DEMO_PROFESIONALES:
//              (desde el 2026-10-15, cada asesorado declara un nombre visible en su perfil, DL-009 y DL-040: lo pone
//              la fase que abre su primera sesión, «base», «volumen», «descartable-datos» o el escenario E)
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
//              corrida: un profesional (habilitado en las tres áreas; con vínculo en Nutrición y Antropometría, y
//              Entrenamiento libre para pedir un vínculo desde la pantalla) y un asesorado. Las de A, B y C no se tocan. Escribe
//              trabajo/demo-profesionales-descartable.txt: hay que reiniciar la API con ese BE_DEMO_PROFESIONALES.
//   comprension · comprension-e · verificar-comprension   los escenarios D y E de WP-DASHBOARD-COMPRENSION
//              (datos/comprension.mjs): revisiones por área en fechas distintas, cargas y correcciones después del corte,
//              borrador sin activar, sesión del plan anterior cargada después, tomas medida, reportada y calculada, y un
//              asesorado con una sola área y sin revisiones. Corren después de «verificar».
//   descartable-datos    por la API, hoy: vínculos de Nutrición y Antropometría, una toma medida, una informada por la
//              persona (SELF_REPORTED) y otra medida, y dos corridas del IMC (be/imc@1): valores medidos, informados y
//              estimados en la misma serie de evolución. La revocación la hace el asesorado desde su web, en el recorrido.
//   descartable-toma-completa  (WP-ESCRITORIO-AREAS, parte 3) por la API, sobre esas mismas cuentas: una toma de hace dos
//              días con el perfil completo (30 mediciones, con la cintura mal tipeada a propósito) y ocho resultados
//              calculados. La usa `recorrido.mjs mediciones`, que corrige, anula, calcula y deja una referencia por la
//              pantalla. Va después de descartable-datos.
//   descartable-solicitudes  (WP-ESCRITORIO-AREAS, parte 4) por la API, sobre esas mismas cuentas: el vínculo de
//              Entrenamiento y tres solicitudes de información (una respondida, una respondida y corregida por la
//              persona, y una sin responder), en dos áreas. Las usa `recorrido.mjs solicitudes`. Va después de
//              descartable-datos; ocupa Entrenamiento, así que no va antes de `recorrido.mjs descartable`.
//   descartable-plan  (WP-ESCRITORIO-AREAS, parte 5) por la API, sobre esas mismas cuentas: una evaluación, un objetivo,
//              una receta propia y un plan de Nutrición con dos versiones activadas (la segunda, vigente), dos días
//              tipo, comidas con una, dos y tres opciones y una opción de receta. Lo usa `recorrido.mjs planes`, que crea
//              el borrador por la pantalla. Va después de descartable-datos.
//   descartable-plan-de-entrenamiento  (WP-ESCRITORIO-AREAS, parte 6) por la API, sobre esas mismas cuentas: el vínculo de
//              Entrenamiento, una evaluación, un objetivo y un plan con dos versiones activadas (la segunda, vigente): dos
//              bloques (uno con dos microciclos), sesiones con indicaciones, un ejercicio con objetivos distintos por serie
//              y otro sin criterio de intensidad. Lo usa `recorrido.mjs entrenamientos`. Va después de descartable-datos;
//              ocupa Entrenamiento, así que no va antes de `recorrido.mjs descartable`.
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

async function pedir(metodo, ruta, { token, cuerpo, clave, superficie = 'WEB', esperado, capacidades } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': superficie };
  if (capacidades) headers[dominio.HEADER_DE_CAPACIDADES] = capacidades;
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
      // DL-138: toda alta declara la mayoría de edad (las personas sintéticas son adultas).
      adultDeclaration: { versionId: dominio.VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
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

/**
 * Los nombres de los asesorados sintéticos: nombres comunes, como los de una consulta real (pedido de Dirección del
 * 2026-10-15). Cada persona lo declara en su perfil (API-ACC-06), como haría desde «Mi cuenta».
 */
export const NOMBRES = { A: 'Martina Gómez', B: 'Lucas Fernández', C: 'Valentina Ruiz', E: 'Joaquín Medina', DESCARTABLE: 'Tomás Herrera' };

/** El nombre visible de la persona de esa sesión, en su primera versión del perfil. */
async function ponerNombre(token, nombre) {
  await pedir('PATCH', '/me/profile', { token, superficie: 'APK', cuerpo: { expectedVersion: 'v0', changes: { displayName: nombre } } });
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
  const nombre = 'Lic. Sofía Paz';
  console.log(
    `BE_DEMO_PROFESIONALES=${proId}|NUTRICION|SANITARIO|${nombre};${proId}|ENTRENAMIENTO|SANITARIO|${nombre};${proId}|ANTROPOMETRIA|SANITARIO|${nombre};${terceroId}|NUTRICION|SANITARIO|Lic. Paula Ríos`,
  );
}

const cuerpoDeEvaluacionNutricional = (ocurrio) => ({
  occurredAt: ocurrio.toISOString(),
  context: 'Primera consulta: quiere ordenar las comidas de la semana y llegar con energía a los entrenamientos.',
  assessment: { entries: [{ concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' }] },
  evidenceReferences: [],
  professionalNotes: 'Desayuna apurada; almuerza en el trabajo de lunes a viernes. Prefiere preparaciones simples.',
});
const cuerpoDeObjetivoNutricional = (evaluationId, desde, kcal) => ({
  evaluationId,
  effectiveFrom: desde.toISOString(),
  effectiveUntil: null,
  estimatedEnergyRequirement: { value: kcal, unit: 'kcal/day' },
  macronutrientDistribution: { protein: { value: 130, unit: 'g/day' }, carbohydrate: { value: 220, unit: 'g/day' }, fat: { value: 65, unit: 'g/day' } },
  mealDistribution: 'Cuatro comidas.',
  rationale: 'Repartir las proteínas en las cuatro comidas y sostener la energía de los días de entrenamiento.',
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
  await ponerNombre(ase, NOMBRES.A);
  await ponerNombre(aseB, NOMBRES.B);
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
        professionalNotes: 'Entrena a la tarde, tres veces por semana. Buena técnica en sentadilla; le cuesta sostener la espalda en el peso muerto.',
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
        objective: { statement: 'Ganar fuerza en sentadilla y peso muerto sin perder la técnica.' },
        rationale: 'Progresión de cargas semana a semana, con dos repeticiones en reserva.',
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
       VALUES ($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5,$6::jsonb,$7::jsonb,'Cuatro comidas.','Bajar un poco las calorías de la cena y mantener las proteínas.',$8::uuid,$9::jsonb,$5)`,
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
  // Informadas a mano con las mismas cantidades de la opción: el modo es «informadas» y no hay diferencia (WP-DASHBOARD-
  // COMPRENSION, pasada del 2026-10-09: el modo de registro no es una diferencia).
  if (consumo.informado === 'COMO_INDICADO') return { status: 'REPORTED', items: opcion.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity, notEaten: false })) };
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
  await ponerNombre(aseC, NOMBRES.C);
  await pedir('POST', '/me/health-data-consents', { token: aseC, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id } });
  for (const alcance of ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']) await vincular(pro, aseC, aseCId, alcance);
  const inicio = instante(diaMenos(hoy, 366), '09:00');
  const evN = (await pedir('POST', `/advisees/${aseCId}/nutrition/evaluations`, { token: pro, cuerpo: cuerpoDeEvaluacionNutricional(inicio) })).data.evaluationId;
  const obN = (await pedir('POST', `/advisees/${aseCId}/nutrition/objectives`, { token: pro, cuerpo: cuerpoDeObjetivoNutricional(evN, inicio, 2100) })).data;
  const planN = (await pedir('POST', `/advisees/${aseCId}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: obN.versionId, initialStructure: PLANES_NUTRICIONALES.v1 } })).data;
  const evT = (await pedir('POST', `/advisees/${aseCId}/training/evaluations`, { token: pro, cuerpo: { occurredAt: inicio.toISOString(), assessment: { entries: [{ concept: 'Experiencia', value: 'Tres años', source: 'REPORTED' }] }, evidenceReferences: [], professionalNotes: 'Entrena cuatro veces por semana desde hace tres años.' } })).data.evaluationId;
  const obT = (await pedir('POST', `/advisees/${aseCId}/training/objectives`, { token: pro, cuerpo: { evaluationId: evT, effectiveFrom: inicio.toISOString(), effectiveUntil: null, objective: { statement: 'Mantener la fuerza y mejorar la resistencia.' }, rationale: 'Volumen moderado, con una semana de descarga por mes.' } })).data;
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
const PROFESIONAL_DESCARTABLE = 'Lic. Andrés Molina';
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
  // Habilitado en las tres áreas y con vínculo en dos (`descartable-datos`): la tercera queda libre para que el recorrido
  // pida un vínculo desde el Espacio profesional (WP-ESCRITORIO-AMABLE, parte 5) sin tocar los datos principales.
  const extendido = [actual, ...['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'].map((alcance) => `${proId}|${alcance}|SANITARIO|${PROFESIONAL_DESCARTABLE}`)].filter(Boolean).join(';');
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
  await ponerNombre(ase, NOMBRES.DESCARTABLE);
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

// ─── WP-ESCRITORIO-AREAS, parte 3: una toma con el perfil completo, en las cuentas descartables ──────────────────────

/** Las 30 mediciones del «Perfil antropométrico completo», con los valores de la maqueta 22. La cintura va mal tipeada. */
const PERFIL_COMPLETO = [
  ['peso', 77.9, 'kg'],
  ['talla', 168, 'cm'],
  ['edad', 34, 'años'],
  ['pliegue-pectoral', 13, 'mm'],
  ['pliegue-axilar-media', 15.5, 'mm'],
  ['pliegue-triceps', 22, 'mm'],
  ['pliegue-subescapular', 18.5, 'mm'],
  ['pliegue-biceps', 11, 'mm'],
  ['pliegue-cresta-iliaca', 24, 'mm'],
  ['pliegue-supraespinal', 19, 'mm'],
  ['pliegue-abdominal', 27.5, 'mm'],
  ['pliegue-muslo-frontal', 30, 'mm'],
  ['pliegue-pantorrilla', 17, 'mm'],
  ['pliegue-antebrazo', 8, 'mm'],
  ['perimetro-cuello', 33.5, 'cm'],
  ['perimetro-hombros', 104, 'cm'],
  ['perimetro-pecho', 96, 'cm'],
  ['perimetro-brazo-relajado', 30.5, 'cm'],
  ['perimetro-brazo-flexionado', 31.5, 'cm'],
  ['perimetro-antebrazo', 25, 'cm'],
  ['perimetro-muneca', 15.5, 'cm'],
  // Mal tipeada a propósito (era 84): el recorrido la corrige por la pantalla, y la API vuelve a calcular lo que la usa.
  ['perimetro-cintura', 48, 'cm'],
  ['perimetro-abdomen', 92, 'cm'],
  ['perimetro-cadera', 104, 'cm'],
  ['perimetro-muslo', 60.5, 'cm'],
  ['perimetro-pantorrilla', 37.5, 'cm'],
  ['perimetro-tobillo', 22, 'cm'],
  ['diametro-humero', 6.2, 'cm'],
  ['diametro-biestiloideo', 5, 'cm'],
  ['diametro-femur', 9.1, 'cm'],
];

/** Los métodos que se calculan sobre esa toma, por su nombre en el catálogo: índices, sumas de pliegues y grasa corporal. */
const METODOS_DE_LA_TOMA_COMPLETA = [
  'Índice de masa corporal (IMC)',
  'Índice cintura/cadera',
  'Índice cintura/talla',
  'Suma de 6 pliegues (ISAK)',
  'Suma de 7 pliegues (Jackson y Pollock)',
  'Durnin y Womersley, mujeres · Siri',
  'Jackson, Pollock y Ward, 7 pliegues, mujeres · Siri',
  'Masa grasa relativa (RFM), mujeres',
];

/**
 * En las cuentas descartables, ya con sus datos (`descartable-datos`): una toma de hace dos días con el perfil completo
 * y ocho resultados calculados, todo por la API. Es la toma que dibuja la maqueta 22: con ella «Tomas» se ve con sus
 * tres columnas de mediciones y sus categorías de resultados, y el recorrido que escribe (`recorrido.mjs mediciones`)
 * corrige la cintura, anula un pliegue, calcula un método y deja una referencia. Cada entrada de un método sale de la
 * medición de la toma con su misma métrica; un método que el catálogo no ofrece, o al que le falta una entrada, corta.
 */
async function descartableTomaCompleta() {
  const e = leerEstado();
  const d = e.descartable;
  if (!d?.datos) throw new Error('primero: descartable-cuentas y descartable-datos');
  const pro = await sesion(d.proCorreo);
  const fecha = diaMenos(hoyCivil(), 2);
  const creada = (
    await pedir('POST', `/advisees/${d.aseId}/anthropometry/evaluation-drafts`, {
      token: pro,
      cuerpo: {
        occurredAt: instante(fecha, '08:40').toISOString(),
        specificationVersionId: PROTOCOLOS.perfil.version,
        source: { type: 'DIRECT_CAPTURE' },
        professionalNotes: 'En ayunas, antes de entrenar',
        directMeasurements: PERFIL_COMPLETO.map(([metricCode, value, unit]) => ({ metricCode, value, unit })),
      },
    })
  ).data;
  const registrada = (await pedir('POST', `/anthropometry/evaluation-drafts/${creada.evaluationId}/register`, { token: pro, cuerpo: { expectedVersion: creada.version } })).data;
  if (registrada.measurements.length !== PERFIL_COMPLETO.length) throw new Error(`la toma quedó con ${registrada.measurements.length} mediciones, no ${PERFIL_COMPLETO.length}`);
  const porMetrica = Object.fromEntries(registrada.measurements.map((m) => [m.metric, m.measurementId]));

  const catalogo = [];
  for (let cursor = null; ; ) {
    const r = await pedir('GET', `/professional-methods?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { token: pro });
    catalogo.push(...r.data);
    if (!r.page.hasMore || !r.page.nextCursor) break;
    cursor = r.page.nextCursor;
  }
  const corridas = [];
  for (const nombre of METODOS_DE_LA_TOMA_COMPLETA) {
    const metodo = catalogo.find((m) => m.name === nombre);
    if (!metodo) throw new Error(`el catálogo no ofrece «${nombre}»`);
    const sinMedicion = metodo.requiredInputs.filter((x) => !porMetrica[x.metric]).map((x) => x.metric);
    if (sinMedicion.length > 0) throw new Error(`«${nombre}» pide ${sinMedicion.join(', ')}, que la toma no tiene`);
    const r = await pedir('POST', `/advisees/${d.aseId}/calculations`, {
      token: pro,
      cuerpo: { purpose: metodo.purposes[0], methodVersionId: metodo.methodVersionId, inputBindings: metodo.requiredInputs.map((x) => ({ inputCode: x.inputCode, sourceRef: porMetrica[x.metric] })) },
    });
    corridas.push({ id: r.data.calculationRunId, metodo: nombre, valor: r.data.result.magnitude.value, unidad: r.data.result.magnitude.unit });
  }
  guardarEstado({ descartable: { ...d, tomaCompleta: { evaluationId: registrada.evaluationId, fecha, porMetrica, corridas } } });
  console.log(`toma completa lista: ${registrada.measurements.length} mediciones y ${corridas.length} resultados calculados (${corridas.map((c) => `${c.metodo}: ${c.valor}`).join('; ')})`);
}

// ─── WP-ESCRITORIO-AREAS, parte 4: tres solicitudes de información, en las cuentas descartables ──────────────────────

/**
 * En las cuentas descartables, ya con sus datos (`descartable-datos`): el vínculo de Entrenamiento que les falta y tres
 * solicitudes de información, todo por la API, como las dibuja la maqueta 26:
 * - «Antecedentes para entrenamiento», en Entrenamiento: las seis preguntas (cinco requeridas), respondida entera;
 * - «Antecedentes de salud declarados», en Entrenamiento: dos preguntas (una requerida). La persona respondió una y
 *   después corrigió: cambió esa respuesta y agregó la otra;
 * - «Hábitos y contexto», en Nutrición: tres preguntas, sin responder.
 * Las respuestas y la corrección las hace la cuenta del asesorado (API-FRM-07 y 08), con la superficie de la APK y sin
 * unidad, como las manda la APK.
 * Ocupa el área de Entrenamiento: el recorrido que la necesita libre para pedir un vínculo desde la pantalla
 * (`recorrido.mjs descartable`) corre con cuentas descartables recién generadas y sin esta fase.
 */
async function descartableSolicitudes() {
  const e = leerEstado();
  const d = e.descartable;
  if (!d?.datos) throw new Error('primero: descartable-cuentas y descartable-datos');
  const pro = await sesion(d.proCorreo);
  const ase = await sesion(d.aseCorreo, 'APK');
  const vinculoDeEntrenamiento = await vincular(pro, ase, d.aseId, 'ENTRENAMIENTO');
  const plantillas = (await pedir('GET', '/form-templates?limit=50', { token: pro })).data;
  const version = async (clave) => {
    const p = plantillas.find((x) => x.key === clave);
    if (!p) throw new Error(`el catálogo no tiene el formulario ${clave}`);
    return (await pedir('GET', `/form-templates/${p.templateId}/versions/${p.latestVersionId}`, { token: pro })).data;
  };
  const solicitar = async (v, alcance, proposito, pedidas, requeridas) =>
    (await pedir('POST', `/advisees/${d.aseId}/form-requests`, { token: pro, cuerpo: { templateVersionId: v.templateVersionId, purpose: proposito, scope: alcance, requestedFieldCodes: pedidas, requiredFieldCodes: requeridas } })).data;
  const responder = async (solicitud, respuestas) => (await pedir('POST', `/me/form-requests/${solicitud.formRequestId}/responses`, { token: ase, superficie: 'APK', cuerpo: { answers: respuestas } })).data;

  const entrenamiento = await version(dominio.CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla);
  const salud = await version('FRM-SALUD');
  const habitos = await version('FRM-HABITOS');

  // 1 · La más vieja: el formulario de Entrenamiento, con lo que precarga la pantalla al llegar desde ahí, respondido entero.
  const deEntrenamiento = await solicitar(entrenamiento, 'ENTRENAMIENTO', dominio.COPY_FORMULARIOS.propositoDeContextoDeEntrenamiento, [...dominio.CONTEXTO_DE_ENTRENAMIENTO.campos], [...dominio.CONTEXTO_DE_ENTRENAMIENTO.requeridos]);
  const respuestaDeEntrenamiento = await responder(deEntrenamiento, [
    { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza en piernas y volver a correr 5 km' },
    { fieldCode: 'trn_experiencia', value: 'Gimnasio hace dos años, tres veces por semana; un año sin correr' },
    { fieldCode: 'trn_dias_por_semana', value: 3 },
    { fieldCode: 'trn_minutos_por_sesion', value: 45 },
    { fieldCode: 'trn_lugar_y_equipamiento', value: 'Gimnasio del barrio, con barras y máquinas' },
    { fieldCode: 'trn_preferencias', value: 'Me gusta el trabajo con barra; prefiero evitar la cinta' },
  ]);
  // 2 · Salud, dos preguntas: responde una y después corrige (cambia esa respuesta y agrega la otra).
  const deSalud = await solicitar(salud, 'ENTRENAMIENTO', 'Necesito saber si hay lesiones o condiciones que cambien la carga del plan.', ['condiciones_declaradas', 'dolor_o_lesiones'], ['condiciones_declaradas']);
  const respuestaDeSalud = await responder(deSalud, [{ fieldCode: 'condiciones_declaradas', value: 'Asma leve, desde hace años.' }]);
  const correccionDeSalud = (
    await pedir('POST', `/me/form-responses/${respuestaDeSalud.formResponseId}/rectifications`, {
      token: ase,
      superficie: 'APK',
      cuerpo: {
        expectedVersion: respuestaDeSalud.version,
        reason: 'Me olvidé de aclarar que uso inhalador antes de entrenar.',
        answers: [
          { fieldCode: 'condiciones_declaradas', value: 'Asma leve. Uso inhalador antes de entrenar.' },
          { fieldCode: 'dolor_o_lesiones', value: 'Molestia en el hombro derecho desde hace dos semanas.' },
        ],
      },
    })
  ).data;
  // 3 · La más nueva: hábitos, en Nutrición, sin responder.
  const deHabitos = await solicitar(habitos, 'NUTRICION', 'Acompañamiento nutricional', ['horas_de_sueno', 'nivel_de_actividad', 'fuma'], []);
  guardarEstado({
    descartable: {
      ...d,
      vinculos: { ...d.vinculos, ENTRENAMIENTO: vinculoDeEntrenamiento },
      solicitudes: {
        entrenamiento: deEntrenamiento.formRequestId,
        salud: deSalud.formRequestId,
        habitos: deHabitos.formRequestId,
        respuestaDeEntrenamiento: respuestaDeEntrenamiento.formResponseId,
        respuestaDeSalud: respuestaDeSalud.formResponseId,
        correccionDeSalud: correccionDeSalud.rectificationId,
      },
    },
  });
  console.log('solicitudes de información listas: «Antecedentes para entrenamiento» (respondida), «Antecedentes de salud declarados» (respondida y corregida) y «Hábitos y contexto» (sin responder)');
}

/**
 * WP-ESCRITORIO-AREAS, parte 5 · un plan de Nutrición para ver «Plan» como la maqueta 16, en las cuentas descartables y
 * todo por la API: dos días tipo; comidas con una, dos y tres opciones; una opción que nace de una receta propia; y un
 * ítem con su nota. Queda
 * con dos versiones activadas (la segunda es la vigente) y sin borrador: el recorrido que la usa
 * (`recorrido.mjs planes`) crea el borrador por la pantalla. Las dos se activan hoy: la activación por la API no admite
 * otra fecha.
 */
async function descartablePlan() {
  const e = leerEstado();
  const d = e.descartable;
  if (!d?.datos) throw new Error('primero: descartable-cuentas y descartable-datos');
  const pro = await sesion(d.proCorreo);
  const evaluacion = (await pedir('POST', `/advisees/${d.aseId}/nutrition/evaluations`, { token: pro, cuerpo: cuerpoDeEvaluacionNutricional(new Date(Date.now() - 2 * 3600_000)) })).data.evaluationId;
  const objetivo = (await pedir('POST', `/advisees/${d.aseId}/nutrition/objectives`, { token: pro, cuerpo: cuerpoDeObjetivoNutricional(evaluacion, new Date(Date.now() - 3600_000), 2250) })).data;

  // Una receta propia, de dos porciones: la opción del plan lleva los ingredientes de una.
  const catalogo = await en((tx) => catalogoNutricional(tx, d.proId, Object.values(ALIMENTOS).map((a) => a.id)));
  const unidadDe = (clave) => (ALIMENTOS[clave].ml ? 'ml' : 'g');
  const ingrediente = (clave, cantidad, estado) => ({ catalogItemId: ALIMENTOS[clave].id, catalogItemVersionId: catalogo.get(ALIMENTOS[clave].id).versionId, quantity: { value: cantidad, unit: unidadDe(clave) }, preparationState: estado });
  const receta = (
    await pedir('POST', '/nutrition/recipes', {
      token: pro,
      cuerpo: {
        name: 'Guiso de lentejas',
        description: 'Rinde dos porciones; se puede dejar lista la noche anterior.',
        servings: 2,
        ingredients: [ingrediente('lentejas', 400, 'COOKED'), ingrediente('zanahoria', 200, 'COOKED'), ingrediente('aceite', 20, 'RAW')],
        steps: ['Rehogar la zanahoria en el aceite.', 'Sumar las lentejas y cocinar diez minutos.'],
      },
    })
  ).data;

  const it = (clave, cantidad, estado, nota) => ({ catalogItemId: ALIMENTOS[clave].id, quantity: { value: cantidad, unit: unidadDe(clave) }, preparationState: estado, ...(nota ? { note: nota } : {}) });
  const opcion = (label, items) => ({ label, items });
  const comida = (label, options) => ({ label, prescriptionMode: 'DISH_OPTIONS', options });
  /** La estructura del plan. `arroz` es lo único que cambia entre la primera versión y la segunda. */
  const estructura = (arroz) => ({
    dayTypes: [
      {
        label: 'Día de entrenamiento',
        meals: [
          comida('Desayuno', [opcion('Avena con leche', [it('avena', 50, 'RAW'), it('leche', 200, 'RAW')]), opcion('Tostadas con queso', [it('panIntegral', 60, 'AS_PURCHASED'), it('queso', 30, 'AS_PURCHASED')])]),
          comida('Almuerzo', [
            opcion('Arroz con pollo y brócoli', [it('arroz', arroz, 'COOKED'), it('pollo', 120, 'COOKED'), it('brocoli', 100, 'COOKED'), it('aceite', 10, 'RAW', 'En crudo, al servir.')]),
            { label: 'Guiso de lentejas', items: [], recipeVersionId: receta.recipeVersionId },
            opcion('Salmón con papa', [it('salmon', 150, 'COOKED'), it('papa', 200, 'COOKED')]),
          ]),
          comida('Merienda', [opcion('Yogur con manzana', [it('yogur', 200, 'RAW'), it('manzana', 150, 'RAW')])]),
          comida('Cena', [opcion('Salmón con papa', [it('salmon', 150, 'COOKED'), it('papa', 150, 'COOKED'), it('aceite', 5, 'RAW')]), opcion('Lentejas con zanahoria', [it('lentejas', 200, 'COOKED'), it('zanahoria', 100, 'COOKED')])]),
        ],
      },
      {
        label: 'Día de descanso',
        meals: [
          comida('Desayuno', [opcion('Tostadas con queso', [it('panIntegral', 60, 'AS_PURCHASED'), it('queso', 30, 'AS_PURCHASED')])]),
          comida('Almuerzo', [opcion('Lentejas con zanahoria', [it('lentejas', 200, 'COOKED'), it('zanahoria', 100, 'COOKED'), it('aceite', 5, 'RAW')]), opcion('Arroz con pollo y brócoli', [it('arroz', 100, 'COOKED'), it('pollo', 120, 'COOKED'), it('brocoli', 150, 'COOKED')])]),
          comida('Cena', [opcion('Salmón con papa', [it('salmon', 150, 'COOKED'), it('papa', 100, 'COOKED')])]),
        ],
      },
    ],
  });
  const activar = async (plan) => (await pedir('POST', `/nutrition/plans/${plan.planId}/activate`, { token: pro, cuerpo: { expectedVersion: plan.version } })).data;
  const primera = (await pedir('POST', `/advisees/${d.aseId}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivo.versionId, initialStructure: estructura(180) } })).data;
  await activar(primera);
  const segunda = (await pedir('POST', `/advisees/${d.aseId}/nutrition/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivo.versionId, basedOnPlanId: primera.planId } })).data;
  const editada = (await pedir('PATCH', `/nutrition/plans/${segunda.planId}`, { token: pro, cuerpo: { expectedVersion: segunda.version, changes: estructura(150) } })).data;
  await activar(editada);
  guardarEstado({ descartable: { ...d, planDeNutricion: { evaluacionId: evaluacion, objetivoId: objetivo.versionId, recetaId: receta.recipeId, v1: primera.planId, v2: segunda.planId } } });
  console.log('plan de Nutrición listo: dos versiones activadas (la segunda, vigente), dos días tipo, hasta tres opciones por comida y una opción de receta («Guiso de lentejas»)');
}

/**
 * WP-ESCRITORIO-AREAS, parte 6 · un plan de Entrenamiento para ver «Plan» como la maqueta 24, en las cuentas
 * descartables y todo por la API: dos bloques (el segundo, con dos microciclos); sesiones con sus indicaciones; un
 * ejercicio con objetivos distintos por serie (carga, RIR y descanso), con una serie sin descanso recomendado y con su
 * nota, y con las bases de carga y de repeticiones declaradas; uno con todas las series iguales; y uno sin criterio de
 * intensidad. Queda con dos versiones activadas (la segunda, vigente) y sin borrador: el recorrido que lo usa
 * (`recorrido.mjs entrenamientos`) crea el borrador por la pantalla.
 * Un plan con objetivos distintos por serie no se activa hasta que su titular abre «Hoy» con una app que los muestra
 * (DL-122): acá lo hace el asesorado, declarando esa capacidad, antes de la segunda activación.
 */
async function descartablePlanDeEntrenamiento() {
  const e = leerEstado();
  const d = e.descartable;
  if (!d?.datos) throw new Error('primero: descartable-cuentas y descartable-datos');
  const pro = await sesion(d.proCorreo);
  const ase = await sesion(d.aseCorreo, 'APK');
  await vincular(pro, ase, d.aseId, 'ENTRENAMIENTO');
  const evaluacion = (
    await pedir('POST', `/advisees/${d.aseId}/training/evaluations`, {
      token: pro,
      cuerpo: {
        occurredAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
        assessment: { entries: [{ concept: 'Experiencia en entrenamiento de fuerza', value: 'Dos años', source: 'REPORTED' }] },
        evidenceReferences: [],
        professionalNotes: 'Entrena a la tarde, tres veces por semana. Buena técnica en sentadilla; le cuesta sostener la espalda en el peso muerto.',
      },
    })
  ).data.evaluationId;
  const objetivo = (
    await pedir('POST', `/advisees/${d.aseId}/training/objectives`, {
      token: pro,
      cuerpo: {
        evaluationId: evaluacion,
        effectiveFrom: new Date(Date.now() - 3600_000).toISOString(),
        effectiveUntil: null,
        objective: { statement: 'Ganar fuerza en sentadilla y peso muerto sin perder la técnica.' },
        rationale: 'Progresión de cargas semana a semana, con dos repeticiones en reserva.',
      },
    })
  ).data;

  const kg = (valor) => ({ value: valor, unit: 'kg' });
  const conRir = (valor) => ({ criterion: 'RIR', target: { value: valor } });
  const iguales = (cuantas, repeticiones) => Array.from({ length: cuantas }, () => ({ repetitions: repeticiones }));
  const de = (ejercicio) => EJERCICIOS[ejercicio].version;
  const seisAOcho = { min: 6, max: 8 };
  /** La primera versión: un bloque, dos sesiones, sin objetivos por serie. */
  const base = {
    blocks: [
      {
        label: 'Fuerza: base',
        purpose: 'Técnica y cargas moderadas',
        sessions: [
          { label: 'A · Tren inferior', prescriptions: [{ exerciseVersionId: de('sentadilla'), sets: iguales(3, { value: 8 }), intensity: conRir(2), suggestedLoad: kg(60) }] },
          { label: 'B · Tren superior', prescriptions: [{ exerciseVersionId: de('banca'), sets: iguales(3, { value: 8 }), intensity: conRir(2), suggestedLoad: kg(50) }] },
        ],
      },
    ],
  };
  /** La segunda, que queda vigente: es la que se mira. */
  const progresion = {
    blocks: [
      {
        label: 'Fuerza: progresión',
        purpose: 'Más carga, menos repeticiones',
        sessions: [
          {
            label: 'A · Tren inferior',
            instructions: 'Entrada en calor: diez minutos de movilidad de cadera y dos series livianas del primer ejercicio.',
            prescriptions: [
              { exerciseVersionId: de('sentadilla'), sets: iguales(4, { value: 6 }), intensity: conRir(1), suggestedLoad: kg(77.5), restSeconds: 180 },
              { exerciseVersionId: de('pesoMuerto'), sets: iguales(3, { value: 5 }), intensity: conRir(2), suggestedLoad: kg(85), restSeconds: 180 },
              { exerciseVersionId: de('zancadas'), sets: iguales(3, { value: 10 }), intensity: conRir(2), suggestedLoad: kg(10), restSeconds: 90, loadBasis: 'PER_IMPLEMENT', repetitionBasis: 'PER_SIDE' },
            ],
          },
          {
            label: 'B · Tren superior',
            instructions: 'Entrada en calor: diez minutos de movilidad de hombros y dos series livianas del primer ejercicio.',
            prescriptions: [
              {
                exerciseVersionId: de('banca'),
                // Las dos primeras toman todo de lo general; la tercera cambia el RIR; la cuarta, el RIR y la carga, no
                // tiene descanso recomendado y lleva una nota.
                sets: [
                  { repetitions: seisAOcho },
                  { repetitions: seisAOcho },
                  { repetitions: seisAOcho, rir: 1 },
                  { repetitions: seisAOcho, rir: 1, suggestedLoad: kg(60), restSeconds: null, note: 'Si se pierde la técnica, cortar la serie.' },
                ],
                intensity: conRir(2),
                suggestedLoad: kg(62.5),
                restSeconds: 150,
                loadBasis: 'TOTAL_EXTERNAL',
                repetitionBasis: 'PER_SET',
                note: 'Bajar en 3 segundos y subir en 1.',
              },
              { exerciseVersionId: de('remo'), sets: iguales(4, { min: 8, max: 10 }), intensity: conRir(2), suggestedLoad: kg(47.5), restSeconds: 120 },
              { exerciseVersionId: de('dominadas'), sets: iguales(4, { value: 6 }), intensity: null, restSeconds: 120 },
            ],
          },
        ],
      },
      {
        label: 'Descarga',
        purpose: 'Una semana con menos series',
        microcycles: [
          {
            label: 'Semana 1',
            purpose: 'La mitad de las series',
            sessions: [
              {
                label: 'Cuerpo completo',
                prescriptions: [
                  { exerciseVersionId: de('sentadilla'), sets: iguales(2, { value: 6 }), intensity: conRir(3), suggestedLoad: kg(60), restSeconds: 120 },
                  { exerciseVersionId: de('banca'), sets: iguales(2, { value: 6 }), intensity: conRir(3), suggestedLoad: kg(50), restSeconds: 120 },
                ],
              },
            ],
          },
          { label: 'Semana 2', sessions: [{ label: 'Cuerpo completo', prescriptions: [{ exerciseVersionId: de('pesoMuerto'), sets: iguales(2, { value: 5 }), intensity: conRir(3), suggestedLoad: kg(70), restSeconds: 150 }] }] },
        ],
      },
    ],
  };
  const activar = async (plan) => (await pedir('POST', `/training/plans/${plan.planId}/activate`, { token: pro, cuerpo: { expectedVersion: plan.version } })).data;
  const primera = (await pedir('POST', `/advisees/${d.aseId}/training/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivo.versionId, initialStructure: base } })).data;
  await activar(primera);
  // El titular abre «Hoy» con una app que muestra los objetivos de cada serie: la API lo registra, y recién entonces
  // deja activar un plan que los tiene distintos de los generales.
  await pedir('GET', '/me/training/today', { token: ase, superficie: 'APK', capacidades: dominio.CAPACIDAD_OBJETIVOS_POR_SERIE });
  const segunda = (await pedir('POST', `/advisees/${d.aseId}/training/plans`, { token: pro, cuerpo: { objectiveVersionId: objetivo.versionId, basedOnPlanId: primera.planId } })).data;
  const editada = (await pedir('PATCH', `/training/plans/${segunda.planId}`, { token: pro, cuerpo: { expectedVersion: segunda.version, changes: progresion } })).data;
  let capaz = false;
  for (let intento = 0; intento < 20 && !capaz; intento++) {
    capaz = (await pedir('GET', `/training/plans/${segunda.planId}/detail`, { token: pro })).data.setTargetsDelivery.adviseeClientCapable;
    if (!capaz) await new Promise((r) => setTimeout(r, 500));
  }
  if (!capaz) throw new Error('la API no registró que el titular usa una app que muestra los objetivos por serie');
  await activar(editada);
  guardarEstado({ descartable: { ...d, planDeEntrenamiento: { evaluacionId: evaluacion, objetivoId: objetivo.versionId, v1: primera.planId, v2: segunda.planId } } });
  console.log('plan de Entrenamiento listo: dos versiones activadas (la segunda, vigente), dos bloques (uno con dos microciclos), objetivos distintos por serie en un ejercicio y otro sin criterio de intensidad');
}

// ─── WP-DASHBOARD-COMPRENSION: escenarios D y E ────────────────────────────────────────────────────────────────────

async function comprension() {
  const e = leerEstado();
  const hoy = e.hoy;
  if (hoy !== hoyCivil()) throw new Error(`el escenario se armó para ${hoy}; hoy es ${hoyCivil()}`);
  const { escenarioD } = await import('./comprension.mjs');
  const instantanea = async (versionId) => (await en((tx) => filas(tx, `SELECT "contenido" FROM "instantanea_de_plan_nutricional" WHERE "version_de_plan_id" = $1::uuid`, versionId)))[0].contenido;
  const planesInstantaneas = { v1: { id: e.nutricion.planV1, inst: await instantanea(e.nutricion.planV1) }, v2: { id: e.nutricion.planV2, inst: await instantanea(e.nutricion.planV2) } };
  const r = await escenarioD({ e, hoy, pedir, sesion, en, sql, filas, comidas, sesiones, PROCEDENCIA, dominio, planesInstantaneas });
  guardarEstado({ comprension: r });
  console.log('escenario D listo: revisiones de Nutrición (D-20, aplicada) y de Entrenamiento (D-9, sin aplicar), borrador v3, cargas y correcciones después de los cortes, toma reportada e IMC');
}

async function comprensionE() {
  const e = leerEstado();
  const { escenarioE } = await import('./comprension.mjs');
  const r = await escenarioE({ e, pedir, sesion, registrarCuenta, vincular, dominio, cuerpoDeEvaluacionNutricional, cuerpoDeObjetivoNutricional });
  guardarEstado({ escenarioE: r });
  console.log('escenario E listo: un asesorado con solo Nutrición, sin revisiones y con dos registros de hoy');
}

async function verificarComprension() {
  const { esperadoDelEscenarioD } = await import('./comprension.mjs');
  const e = leerEstado();
  const pro = await sesion(e.proCorreo);
  const { d, nut, trn } = esperadoDelEscenarioD(e.hoy);
  const comprobaciones = [];
  const comprobar = (que, obtenido, esperado) => comprobaciones.push({ que, obtenido, esperado, ok: JSON.stringify(obtenido) === JSON.stringify(esperado) });
  const panel = (await pedir('GET', `/advisees/${e.aseId}/dashboard`, { token: pro })).data.domains;
  comprobar('Nutrición: la última revisión es la de D-20', panel.nutrition.summary?.lastReview?.recordedAt, d.corteDeNutricion.toISOString());
  comprobar('Nutrición: la revisión está aplicada', panel.nutrition.summary?.lastReview?.application?.appliedAt, d.aplicacionDeNutricion.toISOString());
  comprobar('Nutrición: la próxima revisión acordada', panel.nutrition.summary?.activePlan?.nextReviewAt, d.proximaRevision);
  comprobar('Entrenamiento: la última revisión es la de D-9', panel.training.summary?.lastReview?.recordedAt, d.corteDeEntrenamiento.toISOString());
  comprobar('Entrenamiento: la revisión no está aplicada', panel.training.summary?.lastReview?.application ?? null, null);
  comprobar('Entrenamiento: el borrador v3 no rige', panel.training.summary?.draftPlan?.planVersionId ?? null, e.comprension?.borradorT ?? 'sin borrador');
  const linea = async (corte, dominio) =>
    (await pedir('GET', `/advisees/${e.aseId}/timeline?periodStart=${diaMenos(e.hoy, 365)}&periodEnd=${e.hoy}&domain=${dominio}&since=${encodeURIComponent(corte.toISOString())}&limit=1`, { token: pro })).data;
  const porClase = (datos, dominio, tipo) =>
    Object.fromEntries(['OCURRIO_DESPUES', 'INCORPORADO_DESPUES', 'CORREGIDO_DESPUES'].map((k) => [k, datos.sinceCounts.counts.filter((c) => c.domain === dominio && c.kind === k && c.eventType === tipo).reduce((n, c) => n + c.count, 0)]));
  comprobar('Nutrición: comidas nuevas desde la revisión, por clase', porClase(await linea(d.corteDeNutricion, 'NUTRITION'), 'NUTRITION', 'MEAL_RECORDED'), nut);
  comprobar('Entrenamiento: sesiones nuevas desde la revisión, por clase', porClase(await linea(d.corteDeEntrenamiento, 'TRAINING'), 'TRAINING', 'TRAINING_SESSION_RECORDED'), trn);
  if (e.escenarioE) {
    const deE = (await pedir('GET', `/advisees/${e.escenarioE.aseEId}/dashboard`, { token: pro })).data;
    comprobar('Escenario E: solo Nutrición disponible', [deE.domains.nutrition.available, deE.domains.training.available, deE.domains.anthropometry.available], [true, false, false]);
    comprobar('Escenario E: sin revisiones', deE.domains.nutrition.summary?.lastReview ?? null, null);
  }
  const resultado = { total: comprobaciones.length, ok: comprobaciones.filter((c) => c.ok).length, comprobaciones };
  fs.writeFileSync(enTrabajo('verificacion-comprension.json'), JSON.stringify(resultado, null, 2));
  console.log(`verificación de comprensión: ${resultado.ok} de ${resultado.total}${comprobaciones.some((c) => !c.ok) ? `; fallan: ${comprobaciones.filter((c) => !c.ok).map((c) => c.que).join(' · ')}` : ''}`);
  if (comprobaciones.some((c) => !c.ok)) process.exitCode = 1;
}

const FASES = {
  cuentas,
  base,
  historia,
  recientes,
  verificar,
  volumen,
  comprension,
  'comprension-e': comprensionE,
  'verificar-comprension': verificarComprension,
  'descartable-cuentas': descartableCuentas,
  'descartable-datos': descartableDatos,
  'descartable-toma-completa': descartableTomaCompleta,
  'descartable-solicitudes': descartableSolicitudes,
  'descartable-plan': descartablePlan,
  'descartable-plan-de-entrenamiento': descartablePlanDeEntrenamiento,
};
if (!FASES[fase]) {
  console.error('uso: node datos/generar.mjs cuentas|base|historia|recientes|verificar|volumen|comprension|comprension-e|verificar-comprension|descartable-cuentas|descartable-datos|descartable-toma-completa|descartable-solicitudes|descartable-plan|descartable-plan-de-entrenamiento [origen de la API]');
  process.exit(2);
}
try {
  await FASES[fase]();
} finally {
  await prisma.$disconnect();
}
