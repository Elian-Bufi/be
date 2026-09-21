#!/usr/bin/env node
/**
 * Guion ejecutable de los casos adversariales de WP-06 contra una API desplegada, para correrlo en vivo frente al
 * tribunal (docs/paquetes/WP-06.md §10; DL-084; DV-05:1116-1131).
 *
 * Los adversariales 7 y 8 del DV-05 tienen una variante de entrenamiento que **nunca se había ejecutado**: en WP-04
 * corrió la nutricional del 8 y en WP-04/05 las del 7. DL-084, opción A: WP-06 ejecuta las dos.
 * - **8 (entrenamiento)**: buscar un plan de entrenamiento ya activado e intentar editarlo. Denegado: lo activado es
 *   inmutable, sigue igual, y corregirlo exige una versión sucesora que no toca la activada (INV-06-04, INV-06-109).
 * - **7 (entrenamiento)**: el hueco de entrenamiento es una sesión sin registro. Se muestra como tal —`NOT_STARTED`,
 *   sin condición—, nunca como «no realizada», sin ceros ni porcentajes; los días sin nada registrado son «sin dato»
 *   en el contexto de revisión (INV-06-176; H-09-TRN-01; REG-06-131).
 * - **Sin registro ≠ no realizada**: «No pude realizarla» es un acto registrado; la otra sesión, sin tocar, sigue sin
 *   condición (TEST-TRN-004).
 * - **El borrador no es evidencia**: el profesional no ve el borrador del asesorado; recibe el mismo 404 que ante un
 *   identificador inventado (09v10:980; DV-05 caso 1).
 * - **«Comenzar» dos veces** da el mismo borrador (S10-TRN-01).
 * - **RPE no es criterio de prescripción** (REG-06-129).
 * - **Cero juicio**: ninguna respuesta trae puntaje, cumplimiento, volumen, marcas ni porcentajes (DL-082).
 *
 * Uso: node scripts/adversariales-wp06.mjs [baseDeLaApi] [salida.json]
 *   baseDeLaApi: por defecto https://be-api-hndp.onrender.com (ambiente test)
 *
 * - El profesional es la cuenta demo DEMO-PT (Entrenamiento). Sus credenciales se leen de .env.cuentas-demo, que git
 *   ignora, o del ambiente.
 * - El asesorado se crea en cada corrida por la API pública, con correo @example.invalid y contraseña aleatoria que
 *   no se guarda, y opera como APK. Al final, el vínculo de la corrida se finaliza.
 * - No imprime contraseñas ni tokens. Cada caso dice PASA o FALLA, con lo observado.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [base = 'https://be-api-hndp.onrender.com', salida] = process.argv.slice(2);
const API = `${base.replace(/\/+$/, '')}/api/v1`;

const archivo = join(RAIZ, '.env.cuentas-demo');
const env = Object.fromEntries(
  (existsSync(archivo) ? readFileSync(archivo, 'utf8') : '')
    .split('\n')
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
for (const k of ['DEMO_PT_CORREO', 'DEMO_PT_CLAVE']) {
  env[k] = process.env[k] ?? env[k];
  if (!env[k]) throw new Error(`Falta ${k}: .env.cuentas-demo o el ambiente`);
}

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
const clave = () => `adv6-${randomUUID()}`;

async function sesion(correo, contrasena, superficie = 'WEB') {
  const r = await pedir('POST', '/auth/sessions', { superficie, cuerpo: { method: 'LOCAL', identifier: correo, credential: contrasena } });
  if (r.status !== 201) throw new Error(`login: ${r.status}`);
  const token = r.cuerpo.data.session.accessToken;
  const me = await pedir('GET', '/me', { token });
  return { token, id: me.cuerpo.data.identityId };
}

async function asesoradoNuevo() {
  const correo = `adversarial-wp06-${Date.now()}@example.invalid`;
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

async function vinculoConConsentimiento(pro, ase) {
  const s = await pedir('POST', '/relationship-requests', {
    token: pro.token,
    clave: clave(),
    cuerpo: { target: { type: 'ADVISEE', identityId: ase.id }, scope: { code: 'ENTRENAMIENTO' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' },
  });
  if (s.status !== 201) throw new Error(`solicitud: ${s.status} ${s.cuerpo?.error?.code}`);
  const a = await pedir('POST', `/relationship-requests/${s.cuerpo.data.relationshipRequestId}/accept`, { token: ase.token, clave: clave(), cuerpo: { expectedVersion: 'v1' }, superficie: 'APK' });
  const vinculoId = a.cuerpo.data.relationshipId;
  const req = await pedir('GET', `/relationships/${vinculoId}/consent-requirements`, { token: ase.token, superficie: 'APK' });
  const c = await pedir('POST', `/relationships/${vinculoId}/consents`, { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { consentVersionId: req.cuerpo.data.consentVersion.id } });
  if (c.status !== 201) throw new Error(`consentimiento: ${c.status}`);
  return vinculoId;
}
async function finalizar(ase, vinculoId) {
  const v = (await pedir('GET', `/relationships/${vinculoId}`, { token: ase.token, superficie: 'APK' })).cuerpo.data.version;
  return pedir('POST', `/relationships/${vinculoId}/finalize`, { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { expectedVersion: v, reason: 'OBJETIVO_CUMPLIDO' } });
}

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

// ─── Preparación: evaluación, objetivo y un plan activado con dos sesiones ──────────────────────
const pt = await sesion(env.DEMO_PT_CORREO, env.DEMO_PT_CLAVE);
const ase = await asesoradoNuevo();
const a3 = await pedir('GET', '/me/health-data-consent-requirement', { token: ase.token, superficie: 'APK' });
await pedir('POST', '/me/health-data-consents', { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { consentVersionId: a3.cuerpo.data.consentVersion.id } });
const vinculo = await vinculoConConsentimiento(pt, ase);

const ejercicios = (await pedir('GET', '/training/exercises?limit=50', { token: pt.token })).cuerpo.data;
const ej = (nombre) => ejercicios.find((e) => e.name === nombre)?.versionId;
if (!ej('Press de banca')) throw new Error('el catálogo sintético de ejercicios no está sembrado en este ambiente');

const ev = await pedir('POST', `/advisees/${ase.id}/training/evaluations`, {
  token: pt.token,
  clave: clave(),
  cuerpo: {
    occurredAt: new Date(Date.now() - 3600_000).toISOString(),
    assessment: { entries: [{ concept: 'Experiencia en fuerza', value: 'Un año', source: 'REPORTED' }] },
    evidenceReferences: [],
    professionalNotes: 'Datos sintéticos de la corrida adversarial.',
  },
});
const ob = await pedir('POST', `/advisees/${ase.id}/training/objectives`, {
  token: pt.token,
  clave: clave(),
  cuerpo: { evaluationId: ev.cuerpo.data.evaluationId, effectiveFrom: new Date(Date.now() - 1800_000).toISOString(), effectiveUntil: null, objective: { statement: 'Objetivo sintético.' }, rationale: 'Fundamento sintético.' },
});
const estructura = {
  blocks: [
    {
      label: 'Bloque 1',
      purpose: 'Adaptación',
      sessions: [
        { sessionId: 'ses-a', label: 'Sesión A', prescriptions: [{ prescriptionId: 'rx-banca', exerciseVersionId: ej('Press de banca'), sets: [{ repetitions: { value: 8 } }, { repetitions: { value: 8 } }], intensity: { criterion: 'RIR', target: { value: 2 } } }] },
        { sessionId: 'ses-b', label: 'Sesión B', prescriptions: [{ prescriptionId: 'rx-sentadilla', exerciseVersionId: ej('Sentadilla'), sets: [{ repetitions: { min: 6, max: 8 } }], intensity: { criterion: 'PERCENT_RM', target: { value: 75 } } }] },
      ],
    },
  ],
};
const borrador = await pedir('POST', `/advisees/${ase.id}/training/plans`, { token: pt.token, clave: clave(), cuerpo: { objectiveVersionId: ob.cuerpo.data.versionId, initialStructure: estructura } });
const activacion = await pedir('POST', `/training/plans/${borrador.cuerpo.data.planId}/activate`, { token: pt.token, clave: clave(), cuerpo: { expectedVersion: borrador.cuerpo.data.version } });
if (activacion.status !== 200) throw new Error(`activación: ${activacion.status} ${activacion.cuerpo?.error?.code}`);
const planId = borrador.cuerpo.data.planId;

// ─── 8 (entrenamiento): editar un plan ya activado ──────────────────────────────────────────────
{
  const antes = await pedir('GET', `/training/plans/${planId}`, { token: pt.token });
  const intento = await pedir('PATCH', `/training/plans/${planId}`, { token: pt.token, cuerpo: { expectedVersion: antes.cuerpo.data.version, changes: { blocks: [] } } });
  const despues = await pedir('GET', `/training/plans/${planId}`, { token: pt.token });
  const sucesora = await pedir('POST', `/advisees/${ase.id}/training/plans`, { token: pt.token, clave: clave(), cuerpo: { objectiveVersionId: ob.cuerpo.data.versionId, basedOnPlanId: planId } });
  const trasSucesora = await pedir('GET', `/training/plans/${planId}`, { token: pt.token });
  registrar(
    '8-entrenamiento',
    'un plan de entrenamiento activado no se edita: sigue igual, y corregirlo exige una versión sucesora que no lo toca',
    intento.status === 422 &&
      intento.cuerpo.error.code === 'PLAN_NOT_EDITABLE' &&
      JSON.stringify(despues.cuerpo.data) === JSON.stringify(antes.cuerpo.data) &&
      sucesora.status === 201 &&
      sucesora.cuerpo.data.state === 'DRAFT' &&
      sucesora.cuerpo.data.predecessorPlanId === planId &&
      JSON.stringify(trasSucesora.cuerpo.data) === JSON.stringify(antes.cuerpo.data),
    {
      intento: `${intento.status} ${intento.cuerpo?.error?.code}`,
      activadaIntacta: JSON.stringify(despues.cuerpo?.data) === JSON.stringify(antes.cuerpo?.data),
      huella: antes.cuerpo?.data?.snapshotDigest?.slice(0, 16),
      sucesora: `${sucesora.status} · ${sucesora.cuerpo?.data?.state} · predecesora ${sucesora.cuerpo?.data?.predecessorPlanId === planId ? 'la activada' : '?'}`,
      activadaIntactaTrasLaSucesora: JSON.stringify(trasSucesora.cuerpo?.data) === JSON.stringify(antes.cuerpo?.data),
    },
  );
}

// ─── Hoy: dos sesiones, «Comenzar» dos veces, y el borrador no es evidencia ─────────────────────
const hoy = (await pedir('GET', '/me/training/today', { token: ase.token, superficie: 'APK' })).cuerpo.data;
const [a, b] = hoy.occurrences;
{
  const uno = await pedir('PUT', `/training/occurrences/${a.occurrenceId}/execution-draft`, { token: ase.token, cuerpo: {}, superficie: 'APK' });
  const dos = await pedir('PUT', `/training/occurrences/${a.occurrenceId}/execution-draft`, { token: ase.token, cuerpo: {}, superficie: 'APK' });
  registrar('S10-TRN-01', '«Comenzar sesión» dos veces da el mismo borrador: 201 y después 200', uno.status === 201 && dos.status === 200 && uno.cuerpo.data.draftId === dos.cuerpo.data.draftId, {
    primero: uno.status,
    segundo: dos.status,
    mismoBorrador: uno.cuerpo?.data?.draftId === dos.cuerpo?.data?.draftId,
  });
  const delProfesional = await pedir('GET', `/training/execution-drafts/${uno.cuerpo.data.draftId}`, { token: pt.token });
  const inventado = await pedir('GET', `/training/execution-drafts/${randomUUID()}`, { token: pt.token });
  registrar(
    'borrador-no-es-evidencia',
    'el profesional no ve el borrador del asesorado: el mismo 404 que ante un identificador inventado',
    delProfesional.status === 404 && JSON.stringify(delProfesional.cuerpo) === JSON.stringify(inventado.cuerpo),
    { borradorAjeno: delProfesional.status, inventado: inventado.status, mismoCuerpo: JSON.stringify(delProfesional.cuerpo) === JSON.stringify(inventado.cuerpo) },
  );

  // Se registra la A; la B se deja sin tocar para el caso 7.
  const v = await pedir('PATCH', `/training/execution-drafts/${uno.cuerpo.data.draftId}`, {
    token: ase.token,
    superficie: 'APK',
    cuerpo: {
      expectedVersion: uno.cuerpo.data.version,
      changes: {
        granularity: 'SET',
        sessionCondition: 'COMPLETED',
        exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: ej('Press de banca'), sets: [{ setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 2, perceivedExertion: null }] }],
      },
    },
  });
  await pedir('POST', `/training/execution-drafts/${uno.cuerpo.data.draftId}/confirm`, { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { expectedVersion: v.cuerpo.data.version } });
}

// ─── 7 (entrenamiento): la sesión sin registro es sin dato ──────────────────────────────────────
{
  const trasRegistrar = (await pedir('GET', '/me/training/today', { token: ase.token, superficie: 'APK' })).cuerpo.data.occurrences;
  const sesionB = trasRegistrar.find((o) => o.occurrenceId === b.occurrenceId);
  const ctx = await pedir('GET', `/advisees/${ase.id}/training/review-context`, { token: pt.token });
  const texto = JSON.stringify(ctx.cuerpo);
  registrar(
    '7-entrenamiento',
    'una sesión sin registro se muestra como tal —sin condición, sin cero, sin porcentaje— y los días sin nada registrado son «sin dato»',
    sesionB?.execution.state === 'NOT_STARTED' &&
      sesionB.execution.sessionCondition === null &&
      ctx.status === 200 &&
      ctx.cuerpo.data.registeredExecutions.length === 1 &&
      ctx.cuerpo.data.missingData.length === 6 &&
      !/NOT_COMPLETED/.test(texto) &&
      !/percent(?!_rm)|compliance|adherence/i.test(texto),
    {
      sesionSinRegistro: `${sesionB?.execution.state} · condición ${sesionB?.execution.sessionCondition}`,
      ejecucionesEnElContexto: ctx.cuerpo?.data?.registeredExecutions?.length,
      diasSinDato: ctx.cuerpo?.data?.missingData?.length,
      apareceNoRealizada: /NOT_COMPLETED/.test(texto),
    },
  );
}

// ─── Sin registro ≠ no realizada: «No pude realizarla» es un acto ───────────────────────────────
{
  const bb = await pedir('PUT', `/training/occurrences/${b.occurrenceId}/execution-draft`, { token: ase.token, cuerpo: {}, superficie: 'APK' });
  const v = await pedir('PATCH', `/training/execution-drafts/${bb.cuerpo.data.draftId}`, { token: ase.token, superficie: 'APK', cuerpo: { expectedVersion: bb.cuerpo.data.version, changes: { sessionCondition: 'NOT_COMPLETED' } } });
  const conf = await pedir('POST', `/training/execution-drafts/${bb.cuerpo.data.draftId}/confirm`, { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { expectedVersion: v.cuerpo.data.version } });
  const x = await pedir('GET', `/training/executions/${conf.cuerpo?.data?.executionId}`, { token: pt.token });
  registrar(
    'TEST-TRN-004',
    '«No pude realizarla» se registra como un acto, sin granularidad y sin motivo obligatorio: es evidencia, no ausencia',
    conf.status === 201 && x.cuerpo?.data?.original?.sessionCondition === 'NOT_COMPLETED' && x.cuerpo.data.original.granularity === null && x.cuerpo.data.original.exercises.length === 0,
    { confirmacion: conf.status, condicion: x.cuerpo?.data?.original?.sessionCondition, granularidad: x.cuerpo?.data?.original?.granularity },
  );
}

// ─── RPE no es criterio de prescripción ─────────────────────────────────────────────────────────
{
  const sucesora = (await pedir('GET', `/advisees/${ase.id}/training/plans?state=DRAFT`, { token: pt.token })).cuerpo.data[0];
  const r = await pedir('PATCH', `/training/plans/${sucesora.planId}`, {
    token: pt.token,
    cuerpo: {
      expectedVersion: sucesora.version,
      changes: { blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId: ej('Sentadilla'), sets: [], intensity: { criterion: 'RPE', target: { value: 8 } } }] }] }] },
    },
  });
  registrar('REG-06-129', 'el esfuerzo percibido no es criterio de prescripción: 422 con su motivo', r.status === 422 && r.cuerpo.error.code === 'INTENSITY_CRITERION_INVALID', {
    respuesta: `${r.status} ${r.cuerpo?.error?.code}`,
    motivo: r.cuerpo?.error?.details?.issues?.[0]?.code,
  });
}

// ─── Cero juicio en todas las respuestas de la corrida ──────────────────────────────────────────
{
  const PROHIBIDA = /score|puntaje|compliance|adherence|cumplimiento|volume|volumen|personalrecord|musclemap|ranking|winner/i;
  const claves = (v, ruta) =>
    Array.isArray(v)
      ? v.flatMap((x, i) => claves(x, `${ruta}[${i}]`))
      : v && typeof v === 'object'
        ? Object.entries(v).flatMap(([k, x]) => [...(PROHIBIDA.test(k) ? [`${ruta}.${k}`] : []), ...claves(x, `${ruta}.${k}`)])
        : [];
  const hallazgos = respuestas.flatMap((r) => claves(r.cuerpo, r.ruta));
  registrar('cero-juicio', 'ninguna respuesta trae puntaje, cumplimiento, volumen ni marcas', hallazgos.length === 0, { respuestasRevisadas: respuestas.length, hallazgos });
}

await finalizar(ase, vinculo);

const resumen = { api: base, momento: new Date().toISOString(), profesionales: ['DEMO-PT'], casos, todos: casos.every((c) => c.resultado === 'PASA') };
if (salida) writeFileSync(salida, `${JSON.stringify(resumen, null, 2)}\n`);
process.stdout.write(`\n${resumen.todos ? 'Todos los casos pasan.' : 'Hay casos que fallan.'}\n`);
process.exit(resumen.todos ? 0 : 1);
