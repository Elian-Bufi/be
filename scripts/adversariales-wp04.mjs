#!/usr/bin/env node
/**
 * Guion ejecutable de los casos adversariales de WP-04 contra una API desplegada, para correrlo en vivo frente al
 * tribunal (docs/paquetes/WP-04.md §6; DL-042; DV-05 DV05.md:1116-1133):
 * - 8: editar un plan activado. Falla, y la corrección es una versión sucesora que deja intacta la anterior.
 * - 7 (variante nutricional): un día sin registro se muestra «sin dato», nunca como cero ni como incumplimiento
 *   (INV-06-135).
 * - D9: un profesional de Entrenamiento con vínculo, B2 y A3 vigentes con el mismo asesorado no accede a nada de
 *   nutrición y recibe el mismo 404 que ante lo inexistente (TEST-RNF-SEC-006).
 * - Cero puntaje: ninguna respuesta de la corrida tiene claves de adherencia, cumplimiento o porcentaje (REG-06-125;
 *   TEST-PRJ-009).
 *
 * Uso: node scripts/adversariales-wp04.mjs [baseDeLaApi] [salida.json]
 *   baseDeLaApi: por defecto https://be-api-hndp.onrender.com (ambiente test)
 *
 * - Los profesionales son las cuentas demo DEMO-PN (Nutrición) y DEMO-PT (Entrenamiento) (MESA-01 punto 14). Sus
 *   credenciales se leen de .env.cuentas-demo, que git ignora, o del ambiente.
 * - El asesorado se crea en cada corrida por la API pública, con correo @example.invalid y contraseña aleatoria que no
 *   se guarda. Al final, los dos vínculos de la corrida se finalizan.
 * - No imprime contraseñas ni tokens. Cada caso dice PASA o FALLA, con lo observado.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [base = 'https://be-api-hndp.onrender.com', salida] = process.argv.slice(2);
const API = `${base.replace(/\/+$/, '')}/api/v1`;
const ZONA = 'America/Argentina/Buenos_Aires';

const archivo = join(RAIZ, '.env.cuentas-demo');
const env = Object.fromEntries(
  (existsSync(archivo) ? readFileSync(archivo, 'utf8') : '')
    .split('\n')
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
for (const k of ['DEMO_PN_CORREO', 'DEMO_PN_CLAVE', 'DEMO_PT_CORREO', 'DEMO_PT_CLAVE']) {
  env[k] = process.env[k] ?? env[k];
  if (!env[k]) throw new Error(`Falta ${k}: .env.cuentas-demo o el ambiente`);
}

/** Todas las respuestas de la corrida, para el control de cero puntaje. */
const respuestas = [];

async function pedir(metodo, ruta, { token, cuerpo, clave, superficie = 'WEB' } = {}) {
  const h = { Accept: 'application/json', 'X-BE-Surface': superficie };
  if (cuerpo !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  if (clave) h['Idempotency-Key'] = clave;
  const r = await fetch(`${API}${ruta}`, { method: metodo, headers: h, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  const json = texto ? JSON.parse(texto) : null;
  respuestas.push({ ruta: `${metodo} ${ruta}`, cuerpo: json });
  return { status: r.status, cuerpo: json };
}
const clave = () => `adv4-${randomUUID()}`;
const hoyLocal = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());

async function sesion(correo, contrasena, superficie = 'WEB') {
  const r = await pedir('POST', '/auth/sessions', { superficie, cuerpo: { method: 'LOCAL', identifier: correo, credential: contrasena } });
  if (r.status !== 201) throw new Error(`login ${correo}: ${r.status}`);
  const token = r.cuerpo.data.session.accessToken;
  const me = await pedir('GET', '/me', { token });
  return { token, id: me.cuerpo.data.identityId };
}

async function asesoradoNuevo() {
  const correo = `adversarial-wp04-${Date.now()}@example.invalid`;
  const contrasena = `Sint-${randomBytes(9).toString('base64url')}-9a`;
  const alta = await pedir('POST', '/registrations', {
    clave: clave(),
    superficie: 'APK',
    cuerpo: {
      registrationIntent: 'ADVISEE',
      identity: { localIdentifier: correo, localCredential: contrasena },
      termsAcceptance: { versionId: 'terminos-2026-09-demo' },
      privacyAcknowledgement: { versionId: 'privacidad-2026-09-demo' },
    },
  });
  if (alta.status !== 201) throw new Error(`alta del asesorado: ${alta.status}`);
  return sesion(correo, contrasena, 'APK');
}

async function vinculoConConsentimiento(pro, ase, alcance, finalidad) {
  const s = await pedir('POST', '/relationship-requests', {
    token: pro.token,
    clave: clave(),
    cuerpo: { target: { type: 'ADVISEE', identityId: ase.id }, scope: { code: alcance }, purpose: finalidad },
  });
  if (s.status !== 201) throw new Error(`solicitud ${alcance}: ${s.status} ${s.cuerpo?.error?.code}`);
  const a = await pedir('POST', `/relationship-requests/${s.cuerpo.data.relationshipRequestId}/accept`, { token: ase.token, clave: clave(), cuerpo: { expectedVersion: 'v1' }, superficie: 'APK' });
  const vinculoId = a.cuerpo.data.relationshipId;
  const req = await pedir('GET', `/relationships/${vinculoId}/consent-requirements`, { token: ase.token, superficie: 'APK' });
  const c = await pedir('POST', `/relationships/${vinculoId}/consents`, { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { consentVersionId: req.cuerpo.data.consentVersion.id } });
  if (c.status !== 201) throw new Error(`consentimiento ${alcance}: ${c.status}`);
  return vinculoId;
}
async function finalizar(ase, vinculoId) {
  const v = (await pedir('GET', `/relationships/${vinculoId}`, { token: ase.token, superficie: 'APK' })).cuerpo.data.version;
  return pedir('POST', `/relationships/${vinculoId}/finalize`, { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { expectedVersion: v, reason: 'OBJETIVO_CUMPLIDO' } });
}

async function alimento(pro, nombre) {
  const r = await pedir('GET', `/nutrition/catalog-items?q=${encodeURIComponent(nombre)}&limit=50`, { token: pro.token });
  const item = r.cuerpo.data.find((i) => i.name === nombre);
  if (!item) throw new Error(`alimento no sembrado: ${nombre}`);
  return item.catalogItemId;
}

const estructura = (arroz, pollo, gramosDeArroz = 100) => ({
  dayTypes: [
    {
      label: 'Día habitual',
      meals: [
        {
          label: 'Almuerzo',
          prescriptionMode: 'DISH_OPTIONS',
          options: [
            {
              label: 'Arroz con pollo',
              items: [
                { catalogItemId: arroz, quantity: { value: gramosDeArroz, unit: 'g' }, preparationState: 'COOKED' },
                { catalogItemId: pollo, quantity: { value: 120, unit: 'g' }, preparationState: 'COOKED' },
              ],
            },
          ],
        },
        { label: 'Cena', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Pollo solo', items: [{ catalogItemId: pollo, quantity: { value: 150, unit: 'g' }, preparationState: 'COOKED' }] }] },
      ],
    },
  ],
});

// ─── Despertar la API (el plan gratuito duerme después de 15 minutos) ────────────────────────────
for (let i = 0; i < 20; i++) {
  const r = await fetch(`${base.replace(/\/+$/, '')}/health/ready`).catch(() => null);
  if (r?.status === 200) break;
  await new Promise((res) => setTimeout(res, 6000));
}

const casos = [];
const registrar = (id, titulo, pasa, observado) => {
  casos.push({ caso: id, titulo, resultado: pasa ? 'PASA' : 'FALLA', observado });
  process.stdout.write(`${pasa ? 'PASA ' : 'FALLA'}  ${id} — ${titulo}\n        ${JSON.stringify(observado)}\n`);
};

// ─── Preparación: DEMO-PN evalúa, fija el objetivo, planifica y activa ──────────────────────────
const pn = await sesion(env.DEMO_PN_CORREO, env.DEMO_PN_CLAVE);
const pt = await sesion(env.DEMO_PT_CORREO, env.DEMO_PT_CLAVE);
const ase = await asesoradoNuevo();
const a3 = await pedir('GET', '/me/health-data-consent-requirement', { token: ase.token, superficie: 'APK' });
await pedir('POST', '/me/health-data-consents', { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { consentVersionId: a3.cuerpo.data.consentVersion.id } });
const vinculoPN = await vinculoConConsentimiento(pn, ase, 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL');

const ev = await pedir('POST', `/advisees/${ase.id}/nutrition/evaluations`, {
  token: pn.token,
  clave: clave(),
  cuerpo: {
    occurredAt: new Date(Date.now() - 3600_000).toISOString(),
    context: 'Consulta inicial sintética (adversariales WP-04).',
    assessment: { entries: [{ concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' }] },
    evidenceReferences: [],
    professionalNotes: null,
  },
});
if (ev.status !== 201) throw new Error(`evaluación: ${ev.status} ${ev.cuerpo?.error?.code}`);
const ob = await pedir('POST', `/advisees/${ase.id}/nutrition/objectives`, {
  token: pn.token,
  clave: clave(),
  cuerpo: {
    evaluationId: ev.cuerpo.data.evaluationId,
    effectiveFrom: new Date(Date.now() - 1800_000).toISOString(),
    effectiveUntil: null,
    estimatedEnergyRequirement: { value: 2200, unit: 'kcal/day' },
    macronutrientDistribution: { protein: { value: 110, unit: 'g/day' }, carbohydrate: { value: 270, unit: 'g/day' }, fat: { value: 70, unit: 'g/day' } },
    mealDistribution: 'Cuatro comidas.',
    rationale: 'Fundamento profesional sintético: lo decide el profesional, BE no calcula.',
    methodStatement: null,
  },
});
if (ob.status !== 201) throw new Error(`objetivo: ${ob.status} ${ob.cuerpo?.error?.code}`);
const objetivo = ob.cuerpo.data.versionId;
const arroz = await alimento(pn, 'Arroz blanco');
const pollo = await alimento(pn, 'Pechuga de pollo');
const borrador = await pedir('POST', `/advisees/${ase.id}/nutrition/plans`, { token: pn.token, clave: clave(), cuerpo: { objectiveVersionId: objetivo, initialStructure: estructura(arroz, pollo) } });
if (borrador.status !== 201) throw new Error(`borrador: ${borrador.status} ${borrador.cuerpo?.error?.code}`);
const planId = borrador.cuerpo.data.planId;
const activacion = await pedir('POST', `/nutrition/plans/${planId}/activate`, { token: pn.token, clave: clave(), cuerpo: { expectedVersion: borrador.cuerpo.data.version } });
if (activacion.status !== 200) throw new Error(`activación: ${activacion.status} ${activacion.cuerpo?.error?.code}`);
const hoy = await pedir('GET', '/me/nutrition/today', { token: ase.token, superficie: 'APK' });
const dia = hoy.cuerpo.data.activePlan.dayTypes[0];
const almuerzo = dia.meals[0];
const reg = await pedir('POST', '/me/nutrition/executions', {
  token: ase.token,
  clave: clave(),
  superficie: 'APK',
  cuerpo: {
    activePlanId: planId,
    dayTypeId: dia.dayTypeId,
    occurredAt: new Date().toISOString(),
    recording: { origin: 'PRESCRIBED', mode: 'DISH_OPTIONS', mealId: almuerzo.mealId, optionId: almuerzo.options[0].optionId, consumedItems: [{ itemId: almuerzo.options[0].items[0].itemId, quantity: { value: 80, unit: 'g' } }] },
  },
});
if (reg.status !== 201) throw new Error(`registro: ${reg.status} ${reg.cuerpo?.error?.code}`);

// ─── 8: editar un plan activado ─────────────────────────────────────────────────────────────────
{
  const antes = await pedir('GET', `/nutrition/plans/${planId}`, { token: pn.token });
  const v = antes.cuerpo.data.version;
  const editar = await pedir('PATCH', `/nutrition/plans/${planId}`, { token: pn.token, cuerpo: { expectedVersion: v, changes: estructura(arroz, pollo, 200) } });
  const validar = await pedir('POST', `/nutrition/plans/${planId}/validate`, { token: pn.token, cuerpo: { expectedVersion: v } });
  const reactivar = await pedir('POST', `/nutrition/plans/${planId}/activate`, { token: pn.token, clave: clave(), cuerpo: { expectedVersion: v } });
  const despues = await pedir('GET', `/nutrition/plans/${planId}`, { token: pn.token });
  const intacta = JSON.stringify(despues.cuerpo.data) === JSON.stringify(antes.cuerpo.data);

  // La corrección: una versión sucesora, que se corrige como borrador y se activa. La anterior queda como estaba.
  const sucesora = await pedir('POST', `/advisees/${ase.id}/nutrition/plans`, { token: pn.token, clave: clave(), cuerpo: { objectiveVersionId: objetivo, basedOnPlanId: planId } });
  const corregida = await pedir('PATCH', `/nutrition/plans/${sucesora.cuerpo.data.planId}`, {
    token: pn.token,
    cuerpo: { expectedVersion: sucesora.cuerpo.data.version, changes: estructura(arroz, pollo, 150) },
  });
  const activada = await pedir('POST', `/nutrition/plans/${sucesora.cuerpo.data.planId}/activate`, { token: pn.token, clave: clave(), cuerpo: { expectedVersion: corregida.cuerpo?.data?.version } });
  const anterior = await pedir('GET', `/nutrition/plans/${planId}`, { token: pn.token });
  const hoyNuevo = await pedir('GET', '/me/nutrition/today', { token: ase.token, superficie: 'APK' });
  const registroViejo = await pedir('GET', `/nutrition/executions/${reg.cuerpo.data.executionId}`, { token: ase.token, superficie: 'APK' });
  const arrozVisible = hoyNuevo.cuerpo?.data?.activePlan?.dayTypes?.[0]?.meals?.[0]?.options?.[0]?.items?.[0]?.quantity?.value;

  registrar(
    '8',
    'editar, validar o reactivar una versión activada falla; la corrección es una sucesora y la anterior queda intacta',
    editar.status === 422 &&
      editar.cuerpo?.error?.code === 'PLAN_NOT_EDITABLE' &&
      validar.status === 422 &&
      reactivar.status === 422 &&
      intacta &&
      activada.status === 200 &&
      activada.cuerpo.data.supersededPlanId === planId &&
      anterior.cuerpo.data.state === 'ACTIVATED' &&
      anterior.cuerpo.data.snapshotDigest === activacion.cuerpo.data.snapshotDigest &&
      anterior.cuerpo.data.isEffective === false &&
      hoyNuevo.cuerpo.data.activePlan.planId === sucesora.cuerpo.data.planId &&
      arrozVisible === 150 &&
      registroViejo.status === 200 &&
      registroViejo.cuerpo.data.planId === planId,
    {
      editar: `${editar.status} ${editar.cuerpo?.error?.code}`,
      validar: `${validar.status} ${validar.cuerpo?.error?.code}`,
      reactivar: `${reactivar.status} ${reactivar.cuerpo?.error?.code}`,
      contenidoIntacto: intacta,
      huellaDeLaAnterior: anterior.cuerpo.data.snapshotDigest,
      huellaAlActivar: activacion.cuerpo.data.snapshotDigest,
      sucesoraActivada: `${activada.status} · reemplaza ${activada.cuerpo?.data?.supersededPlanId === planId ? 'a la anterior' : '?'}`,
      arrozEnHoy: `${arrozVisible} g`,
      registroPrevioSigueApuntandoALaAnterior: registroViejo.cuerpo?.data?.planId === planId,
    },
  );
}

// ─── 7 (variante nutricional): un día sin registro es «sin dato», nunca cero ─────────────────────
{
  const ctx = await pedir('GET', `/advisees/${ase.id}/nutrition/review-context`, { token: pn.token });
  const dias = ctx.cuerpo.data.descriptiveContrast.days;
  const deHoy = dias.find((d) => d.date === hoyLocal());
  const sinRegistro = dias.filter((d) => d.date !== hoyLocal());
  const cena = deHoy?.meals.find((m) => m.label === 'Cena');
  const almuerzoHoy = deHoy?.meals.find((m) => m.label === 'Almuerzo');
  const vaciosSinCero = sinRegistro.every((d) => d.dataState === 'NO_DATA' && d.meals.every((m) => m.state === 'NO_DATA' && m.quantityDifferences.length === 0 && m.executionId === null));
  registrar(
    '7-nutricion',
    'los días sin registro y la cena sin registrar aparecen como «sin dato», sin ceros ni incumplimiento',
    ctx.status === 200 &&
      sinRegistro.length > 0 &&
      vaciosSinCero &&
      ctx.cuerpo.data.missingData.length === sinRegistro.length &&
      cena?.state === 'NO_DATA' &&
      almuerzoHoy?.state === 'REGISTERED' &&
      almuerzoHoy?.quantityDifferences?.[0]?.difference === -20,
    {
      diasDelPeriodo: dias.length,
      diasSinDato: ctx.cuerpo.data.missingData.length,
      estadoDeUnDiaSinRegistro: sinRegistro[0] ? { fecha: sinRegistro[0].date, dataState: sinRegistro[0].dataState, comidas: sinRegistro[0].meals.map((m) => `${m.label}: ${m.state}`) } : null,
      hoy: deHoy ? deHoy.meals.map((m) => `${m.label}: ${m.state}${m.quantityDifferences.length ? ` (${m.quantityDifferences.map((q) => `${q.name} ${q.difference} ${q.unit}`).join(', ')})` : ''}`) : null,
    },
  );
}

// ─── D9: un profesional de Entrenamiento no accede a datos de nutrición ─────────────────────────
{
  const vinculoPT = await vinculoConConsentimiento(pt, ase, 'ENTRENAMIENTO', 'PLANIFICACION_DEL_ENTRENAMIENTO');
  const falso = randomUUID();
  const libre = await pedir('POST', '/me/nutrition/executions', {
    token: ase.token,
    clave: clave(),
    superficie: 'APK',
    cuerpo: { activePlanId: (await pedir('GET', '/me/nutrition/today', { token: ase.token, superficie: 'APK' })).cuerpo.data.activePlan.planId, occurredAt: new Date().toISOString(), recording: { origin: 'OUTSIDE_PRESCRIPTION', mode: 'FREE_DESCRIPTION', description: 'Una empanada.' } },
  });
  const periodo = { start: hoyLocal(), end: hoyLocal(), timeZone: ZONA };
  const cuerpoDeRevision = (evidencia) => ({ period: periodo, evidenceReferences: evidencia, interpretation: 'Interpretación sintética.', result: 'MAINTAIN', rationale: 'Fundamento sintético.', nextAction: { description: 'Seguir igual.' } });
  const revision = await pedir('POST', `/advisees/${ase.id}/nutrition/reviews`, { token: pn.token, clave: clave(), cuerpo: cuerpoDeRevision([{ type: 'EXECUTION', id: reg.cuerpo.data.executionId }]) });
  const a = ase.id;
  // Las 18 operaciones NUT del profesional sobre un asesorado, con cuerpos válidos.
  const pares = [
    ['POST', `/advisees/${a}/nutrition/evaluations`, `/advisees/${falso}/nutrition/evaluations`, { occurredAt: new Date().toISOString(), context: 'x', assessment: { entries: [{ concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' }] }, evidenceReferences: [], professionalNotes: null }],
    ['GET', `/advisees/${a}/nutrition/evaluations`, `/advisees/${falso}/nutrition/evaluations`],
    ['GET', `/nutrition/evaluations/${ev.cuerpo.data.evaluationId}`, `/nutrition/evaluations/${falso}`],
    ['POST', `/advisees/${a}/nutrition/objectives`, `/advisees/${falso}/nutrition/objectives`, { evaluationId: ev.cuerpo.data.evaluationId, effectiveFrom: new Date().toISOString(), effectiveUntil: null, estimatedEnergyRequirement: { value: 2000, unit: 'kcal/day' }, macronutrientDistribution: { protein: { value: 100, unit: 'g/day' }, carbohydrate: { value: 250, unit: 'g/day' }, fat: { value: 60, unit: 'g/day' } }, mealDistribution: null, rationale: 'x', methodStatement: null }],
    ['GET', `/advisees/${a}/nutrition/objectives/effective`, `/advisees/${falso}/nutrition/objectives/effective`],
    ['GET', `/advisees/${a}/nutrition/objectives`, `/advisees/${falso}/nutrition/objectives`],
    ['POST', `/advisees/${a}/nutrition/plans`, `/advisees/${falso}/nutrition/plans`, { objectiveVersionId: objetivo, basedOnPlanId: planId }],
    ['GET', `/advisees/${a}/nutrition/plans`, `/advisees/${falso}/nutrition/plans`],
    ['GET', `/nutrition/plans/${planId}`, `/nutrition/plans/${falso}`],
    ['PATCH', `/nutrition/plans/${planId}`, `/nutrition/plans/${falso}`, { expectedVersion: 'v2', changes: estructura(arroz, pollo) }],
    ['POST', `/nutrition/plans/${planId}/validate`, `/nutrition/plans/${falso}/validate`, { expectedVersion: 'v2' }],
    ['POST', `/nutrition/plans/${planId}/activate`, `/nutrition/plans/${falso}/activate`, { expectedVersion: 'v2' }],
    ['GET', `/nutrition/executions/${reg.cuerpo.data.executionId}`, `/nutrition/executions/${falso}`],
    ['POST', `/nutrition/executions/${libre.cuerpo.data.executionId}/corrections`, `/nutrition/executions/${falso}/corrections`, { reason: 'STRUCTURE_FREE_DESCRIPTION', structuredEstimate: { items: [{ catalogItemId: pollo, description: 'Empanada', quantity: { value: 90, unit: 'g' } }] }, estimationStatement: 'Estimación.' }],
    ['GET', `/advisees/${a}/nutrition/review-context`, `/advisees/${falso}/nutrition/review-context`],
    ['POST', `/advisees/${a}/nutrition/reviews`, `/advisees/${falso}/nutrition/reviews`, cuerpoDeRevision([])],
    ['GET', `/nutrition/reviews/${revision.cuerpo.data.reviewId}`, `/nutrition/reviews/${falso}`],
    ['POST', `/nutrition/reviews/${revision.cuerpo.data.reviewId}/apply`, `/nutrition/reviews/${falso}/apply`, { expectedVersion: 'v1' }],
  ];
  const observado = [];
  let todos = true;
  for (const [metodo, real, inexistente, cuerpo] of pares) {
    const r = await pedir(metodo, real, { token: pt.token, cuerpo, clave: metodo === 'GET' ? undefined : clave() });
    const b = await pedir(metodo, inexistente, { token: pt.token, cuerpo, clave: metodo === 'GET' ? undefined : clave() });
    const igual = r.status === 404 && b.status === 404 && JSON.stringify(r.cuerpo) === JSON.stringify(b.cuerpo);
    todos &&= igual;
    observado.push(`${metodo} ${real.replace(ase.id, '{asesorado}').replace(/[0-9a-f-]{36}/g, '{id}')}: ${r.status} vs ${b.status}${igual ? ' idénticos' : ' DISTINTOS'}`);
  }
  // Control positivo: el mismo profesional sí ve el tablero del vínculo que le corresponde (no es una cuenta rota).
  const tablero = await pedir('GET', `/advisees/${ase.id}/dashboard`, { token: pt.token });
  const catalogo = await pedir('GET', '/nutrition/catalog-items', { token: pt.token });
  const cargaDeCatalogo = await pedir('POST', '/nutrition/catalog-items', { token: pt.token, clave: clave(), cuerpo: { name: 'Alimento sintético', itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 100, proteinG: 1, carbohydrateG: 1, fatG: 1 } } });
  // Nada cambió: la versión activada conserva su huella y la revisión sigue sin aplicar.
  const planDespues = await pedir('GET', `/nutrition/plans/${planId}`, { token: pn.token });
  const revisionDespues = await pedir('GET', `/nutrition/reviews/${revision.cuerpo.data.reviewId}`, { token: pn.token });
  registrar(
    'D9',
    'Entrenamiento con vínculo, B2 y A3 vigentes: las 18 operaciones de nutrición dan el mismo 404 que lo inexistente, y nada cambia',
    todos &&
      pares.length === 18 &&
      tablero.status === 200 &&
      catalogo.status === 403 &&
      cargaDeCatalogo.status === 403 &&
      planDespues.cuerpo.data.snapshotDigest === activacion.cuerpo.data.snapshotDigest &&
      revisionDespues.cuerpo.data.application === null,
    {
      pares: observado,
      tableroDelVinculoPropio: tablero.status,
      catalogoNutricional: `buscar ${catalogo.status} · cargar ${cargaDeCatalogo.status}`,
      huellaDelPlanIntacta: planDespues.cuerpo.data.snapshotDigest === activacion.cuerpo.data.snapshotDigest,
      revisionSinAplicar: revisionDespues.cuerpo.data.application === null,
    },
  );
  await finalizar(ase, vinculoPT);
}

// ─── Cero puntaje en todas las respuestas de la corrida ──────────────────────────────────────────
{
  const PROHIBIDA = /adherence|compliance|score|grade|percent|cumplimiento|adherencia/i;
  const claves = (v, ruta) =>
    Array.isArray(v)
      ? v.flatMap((x, i) => claves(x, `${ruta}[${i}]`))
      : v && typeof v === 'object'
        ? Object.entries(v).flatMap(([k, x]) => [...(PROHIBIDA.test(k) ? [`${ruta}.${k}`] : []), ...claves(x, `${ruta}.${k}`)])
        : [];
  const hallazgos = respuestas.flatMap((r) => claves(r.cuerpo, r.ruta));
  registrar('cero-puntaje', 'ninguna respuesta de la corrida tiene claves de adherencia, cumplimiento, puntaje o porcentaje', hallazgos.length === 0, {
    respuestasRevisadas: respuestas.length,
    hallazgos,
  });
}

await finalizar(ase, vinculoPN);

const resumen = { api: base, momento: new Date().toISOString(), profesionales: ['DEMO-PN', 'DEMO-PT'], casos, todos: casos.every((c) => c.resultado === 'PASA') };
if (salida) writeFileSync(salida, `${JSON.stringify(resumen, null, 2)}\n`);
process.stdout.write(`\n${resumen.todos ? 'Todos los casos pasan.' : 'Hay casos que fallan.'}\n`);
process.exit(resumen.todos ? 0 : 1);
