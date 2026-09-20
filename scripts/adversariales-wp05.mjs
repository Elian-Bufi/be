#!/usr/bin/env node
/**
 * Guion ejecutable de los casos adversariales de WP-05 contra una API desplegada, para correrlo en vivo frente al
 * tribunal (docs/paquetes/WP-05.md §6; DL-042; DV-05 DV05.md):
 * - **6**: doble anulación de la misma medición. La segunda no produce un segundo efecto ni un error nuevo: responde
 *   200 con la anulación que ya existe, y la historia queda igual (REG-06-217/218; DL-059).
 * - **7 (variante de mediciones)**: un día sin medición vigente aparece como «sin dato», sin valor, sin cero y sin
 *   arrastre; una medición anulada deja de aportar punto; un tramo en otra unidad se señala como no comparable
 *   (REG-06-165/166; INV-06-176/177; REG-06-164).
 * - **10**: el borrador de otro profesional no existe para el que mira, aunque los dos tengan capacidad
 *   antropométrica y vínculo activo con el mismo asesorado: mismo 404 que ante un identificador inventado
 *   (08 §56.5).
 * - **Cálculo**: disponible no es admisible, la corrida conserva su versión exacta, dos corridas coexisten sin
 *   ganadora y adoptar una referencia no toca ninguna (REG-06-203/204/205/207).
 * - **Cero juicio**: ninguna respuesta de la corrida trae claves de diagnóstico, puntaje, promedio o ganadora, ni
 *   una bandera de honestidad en verdadero (RF-048; REG-06-166).
 *
 * Uso: node scripts/adversariales-wp05.mjs [baseDeLaApi] [salida.json]
 *   baseDeLaApi: por defecto https://be-api-hndp.onrender.com (ambiente test)
 *
 * - Los profesionales son las cuentas demo DEMO-PN (Nutrición + capacidad antropométrica) y DEMO-PA (capacidad
 *   antropométrica sin ninguna Especialidad, que es la identidad válida de 06 §8.10). Sus credenciales se leen de
 *   .env.cuentas-demo, que git ignora, o del ambiente.
 * - El asesorado se crea en cada corrida por la API pública, con correo @example.invalid y contraseña aleatoria que
 *   no se guarda. Al final, los vínculos de la corrida se finalizan.
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
for (const k of ['DEMO_PN_CORREO', 'DEMO_PN_CLAVE', 'DEMO_PA_CORREO', 'DEMO_PA_CLAVE']) {
  env[k] = process.env[k] ?? env[k];
  if (!env[k]) throw new Error(`Falta ${k}: .env.cuentas-demo o el ambiente`);
}

/** Todas las respuestas de la corrida, para el control de cero juicio. */
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
const clave = () => `adv5-${randomUUID()}`;
const diaLocal = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(d);
/** Un momento a mediodía local de hace `dias` días: así la fecha local del punto no depende de la hora de la corrida. */
const haceDias = (dias) => {
  const d = new Date();
  d.setUTCHours(15, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - dias);
  return d;
};

async function sesion(correo, contrasena, superficie = 'WEB') {
  const r = await pedir('POST', '/auth/sessions', { superficie, cuerpo: { method: 'LOCAL', identifier: correo, credential: contrasena } });
  if (r.status !== 201) throw new Error(`login ${correo}: ${r.status}`);
  const token = r.cuerpo.data.session.accessToken;
  const me = await pedir('GET', '/me', { token });
  return { token, id: me.cuerpo.data.identityId };
}

async function asesoradoNuevo() {
  const correo = `adversarial-wp05-${Date.now()}@example.invalid`;
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

/** Una evaluación registrada con las mediciones dadas. Devuelve el id y las mediciones por métrica. */
/** Una evaluación registrada por la vía directa (API-ANT-02): nace registrada, en un solo acto atómico. */
async function evaluacionRegistrada(pro, aseId, momento, mediciones, origin = 'DIRECT_CAPTURE') {
  const creada = await pedir('POST', `/advisees/${aseId}/anthropometry/evaluations`, {
    token: pro.token,
    clave: clave(),
    cuerpo: toma(momento, mediciones, origin),
  });
  if (creada.status !== 201) throw new Error(`evaluación: ${creada.status} ${creada.cuerpo?.error?.code}`);
  const porMetrica = Object.fromEntries(creada.cuerpo.data.measurements.map((m) => [m.metric, m.measurementId]));
  return { evaluationId: creada.cuerpo.data.evaluationId, porMetrica };
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

// ─── Preparación ────────────────────────────────────────────────────────────────────────────────
const pn = await sesion(env.DEMO_PN_CORREO, env.DEMO_PN_CLAVE);
const pa = await sesion(env.DEMO_PA_CORREO, env.DEMO_PA_CLAVE);
const ase = await asesoradoNuevo();
const a3 = await pedir('GET', '/me/health-data-consent-requirement', { token: ase.token, superficie: 'APK' });
await pedir('POST', '/me/health-data-consents', { token: ase.token, clave: clave(), superficie: 'APK', cuerpo: { consentVersionId: a3.cuerpo.data.consentVersion.id } });
const vinculoPA = await vinculoConConsentimiento(pa, ase, 'ANTROPOMETRIA', 'EVALUACION_ANTROPOMETRICA');
const vinculoPN = await vinculoConConsentimiento(pn, ase, 'ANTROPOMETRIA', 'EVALUACION_ANTROPOMETRICA');

const catalogo = await pedir('GET', '/anthropometry/specifications?kind=PROTOCOL', { token: pa.token });
const protocolo = catalogo.cuerpo.data.find((e) => e.key === 'PROTO-LAB');
if (!protocolo) throw new Error('el catálogo sintético no está sembrado en este ambiente');
/** Una medición directa, en la forma del 09: métrica, valor y unidad. El protocolo y el origen son de la toma. */
const medicion = (metric, value, unit) => ({ metricCode: metric, value, unit });

/** El contenido de una toma: momento, especificación, origen y sus mediciones directas (09v11 §6). */
const toma = (momento, mediciones, origin = 'DIRECT_CAPTURE') => ({
  occurredAt: momento.toISOString(),
  specificationVersionId: protocolo.versionId,
  source: { type: origin },
  directMeasurements: mediciones,
  professionalNotes: 'Datos sintéticos de la corrida adversarial.',
});

// ─── 6: doble anulación ─────────────────────────────────────────────────────────────────────────
{
  const dia = haceDias(6);
  const { evaluationId, porMetrica } = await evaluacionRegistrada(pa, ase.id, dia, [medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
  const ruta = `/anthropometry/measurements/${porMetrica.peso}/annulments`;
  const primera = await pedir('POST', ruta, { token: pa.token, clave: clave(), cuerpo: { reason: 'La balanza estaba descalibrada.' } });
  // Con una clave nueva, no con la misma: el caso adversarial es el segundo intento genuino, no el reintento.
  const segundaVez = await pedir('POST', ruta, { token: pa.token, clave: clave(), cuerpo: { reason: 'Otro motivo distinto.' } });
  const evaluacion = await pedir('GET', `/anthropometry/evaluations/${evaluationId}`, { token: pa.token });
  const medicionAnulada = evaluacion.cuerpo?.data?.measurements?.find((m) => m.measurementId === porMetrica.peso);

  registrar(
    '6',
    'la segunda anulación de la misma medición no produce un segundo efecto ni un error nuevo, y la historia queda igual',
    primera.status === 201 &&
      primera.cuerpo.data.alreadyAnnulled === false &&
      segundaVez.status === 200 &&
      segundaVez.cuerpo.data.alreadyAnnulled === true &&
      segundaVez.cuerpo.data.annulment.annulmentId === primera.cuerpo.data.annulment.annulmentId &&
      segundaVez.cuerpo.data.annulment.reason === primera.cuerpo.data.annulment.reason &&
      medicionAnulada?.condition === 'ANNULLED' &&
      medicionAnulada?.magnitude.value === 72.5,
    {
      primera: `${primera.status} · alreadyAnnulled=${primera.cuerpo?.data?.alreadyAnnulled}`,
      segunda: `${segundaVez.status} · alreadyAnnulled=${segundaVez.cuerpo?.data?.alreadyAnnulled}`,
      mismaAnulacion: segundaVez.cuerpo?.data?.annulment?.annulmentId === primera.cuerpo?.data?.annulment?.annulmentId,
      motivoConservado: segundaVez.cuerpo?.data?.annulment?.reason,
      medicionOriginalIntacta: `${medicionAnulada?.magnitude?.value} ${medicionAnulada?.magnitude?.unit} · ${medicionAnulada?.condition}`,
    },
  );
}

// ─── 7 (mediciones): sin dato es sin dato ───────────────────────────────────────────────────────
{
  const d4 = haceDias(4);
  const d2 = haceDias(2);
  await evaluacionRegistrada(pa, ase.id, d4, [medicion('perimetro-cintura', 82, 'cm')]);
  // Dos días después, la misma métrica en otra unidad: comparable no es lo mismo que mostrable (REG-06-164).
  const segunda = await evaluacionRegistrada(pa, ase.id, d2, [medicion('perimetro-cintura', 0.81, 'm')]);

  const desde = diaLocal(haceDias(5));
  const hasta = diaLocal(haceDias(1));
  const evolucion = await pedir('GET', `/advisees/${ase.id}/anthropometry/progress?periodStart=${desde}&periodEnd=${hasta}&metric=perimetro-cintura`, { token: pa.token });
  const serie = evolucion.cuerpo?.data?.metrics?.[0];
  const conDato = serie?.series ?? [];
  const huecos = serie?.gaps ?? [];
  const diasSinDato = huecos.reduce((n, h) => n + h.days, 0);
  const noComparable = conDato.find((p) => p.incomparableWithPrevious.length > 0);

  registrar(
    '7-mediciones',
    'los días sin medición vigente son «sin dato» y no llevan valor; el tramo en otra unidad se señala como no comparable',
    evolucion.status === 200 &&
      conDato.length + diasSinDato === 5 &&
      diasSinDato === 3 &&
      // El hueco no tiene dónde poner un cero: es un rango con su estado, y nada más (INV-06-176/177).
      huecos.every((h) => Object.keys(h).sort().join(',') === 'days,from,state,to' && h.state === 'NO_DATA') &&
      conDato.length === 2 &&
      noComparable?.incomparableWithPrevious?.includes('UNIT') &&
      evolucion.cuerpo.data.honesty.interpolated === false &&
      evolucion.cuerpo.data.honesty.imputed === false &&
      evolucion.cuerpo.data.honesty.carriedForward === false,
    {
      periodo: `${desde} → ${hasta}`,
      puntos: conDato.map((p) => `${p.occurredAt.slice(0, 10)}: ${p.value} ${p.unit}`),
      huecos: huecos.map((h) => `${h.from} → ${h.to}: ${h.days} sin dato`),
      clavesDeUnHueco: huecos[0] ? Object.keys(huecos[0]) : null,
      noComparable: noComparable ? `${noComparable.occurredAt.slice(0, 10)}: ${noComparable.incomparableWithPrevious.join(', ')}` : null,
      honestidad: evolucion.cuerpo?.data?.honesty,
    },
  );

  // Anular la segunda medición la saca de la serie sin borrarla: el día vuelve a ser «sin dato» (REG-06-221).
  await pedir('POST', `/anthropometry/measurements/${segunda.porMetrica['perimetro-cintura']}/annulments`, {
    token: pa.token,
    clave: clave(),
    cuerpo: { reason: 'Se tomó sobre la ropa.' },
  });
  const despues = await pedir('GET', `/advisees/${ase.id}/anthropometry/progress?periodStart=${desde}&periodEnd=${hasta}&metric=perimetro-cintura`, { token: pa.token });
  const serieDespues = despues.cuerpo?.data?.metrics?.[0];
  const delDia = (serieDespues?.gaps ?? []).find((h) => h.from <= diaLocal(d2) && diaLocal(d2) <= h.to);
  const detalle = await pedir('GET', `/anthropometry/evaluations/${segunda.evaluationId}`, { token: pa.token });

  registrar(
    '7-anulada',
    'una medición anulada deja de aportar punto a la serie y su valor original se conserva en la historia',
    despues.status === 200 &&
      delDia?.state === 'NO_DATA' &&
      !('value' in (delDia ?? {})) &&
      (serieDespues?.series ?? []).every((p) => p.occurredAt.slice(0, 10) !== diaLocal(d2)) &&
      detalle.cuerpo.data.measurements[0].condition === 'ANNULLED' &&
      detalle.cuerpo.data.measurements[0].magnitude.value === 0.81,
    {
      diaDeLaAnulada: `${diaLocal(d2)}: ${delDia?.state ?? 'no está en ningún hueco'}`,
      diasSinDato: (serieDespues?.gaps ?? []).reduce((n, h) => n + h.days, 0),
      enLaHistoria: `${detalle.cuerpo?.data?.measurements?.[0]?.magnitude?.value} ${detalle.cuerpo?.data?.measurements?.[0]?.magnitude?.unit} · ${detalle.cuerpo?.data?.measurements?.[0]?.condition}`,
    },
  );
}

// ─── 10: el borrador de otro profesional no existe ──────────────────────────────────────────────
{
  const hoy = haceDias(0);
  const borrador = await pedir('POST', `/advisees/${ase.id}/anthropometry/evaluation-drafts`, {
    token: pa.token,
    clave: clave(),
    cuerpo: toma(hoy, [medicion('peso', 73, 'kg')]),
  });
  const suyo = borrador.cuerpo.data.evaluationId;
  const inventado = randomUUID();

  const propio = await pedir('GET', `/anthropometry/evaluation-drafts/${suyo}`, { token: pa.token });
  const ajeno = await pedir('GET', `/anthropometry/evaluation-drafts/${suyo}`, { token: pn.token });
  const inexistente = await pedir('GET', `/anthropometry/evaluation-drafts/${inventado}`, { token: pn.token });
  const listaDelOtro = await pedir('GET', `/advisees/${ase.id}/anthropometry/evaluation-drafts`, { token: pn.token });
  const listaPropia = await pedir('GET', `/advisees/${ase.id}/anthropometry/evaluation-drafts`, { token: pa.token });
  // Tampoco se puede escribir sobre él: guardar y registrar dan el mismo 404.
  const guardar = await pedir('PUT', `/anthropometry/evaluation-drafts/${suyo}`, { token: pn.token, cuerpo: { expectedVersion: 'v1', ...toma(hoy, []) } });
  const registrarAjeno = await pedir('POST', `/anthropometry/evaluation-drafts/${suyo}/register`, { token: pn.token, clave: clave(), cuerpo: { expectedVersion: 'v1' } });
  // Control positivo: el otro profesional sí ve el tablero del vínculo que le corresponde.
  const tablero = await pedir('GET', `/advisees/${ase.id}/dashboard`, { token: pn.token });
  const sigueIntacto = await pedir('GET', `/anthropometry/evaluation-drafts/${suyo}`, { token: pa.token });

  registrar(
    '10',
    'con capacidad y vínculo activo con el mismo asesorado, el borrador del otro profesional da el mismo 404 que uno inventado',
    propio.status === 200 &&
      ajeno.status === 404 &&
      inexistente.status === 404 &&
      JSON.stringify(ajeno.cuerpo) === JSON.stringify(inexistente.cuerpo) &&
      guardar.status === 404 &&
      registrarAjeno.status === 404 &&
      listaDelOtro.status === 200 &&
      listaDelOtro.cuerpo.data.every((e) => e.evaluationId !== suyo) &&
      listaPropia.cuerpo.data.some((e) => e.evaluationId === suyo) &&
      tablero.status === 200 &&
      sigueIntacto.cuerpo.data.state === 'IN_PREPARATION' &&
      sigueIntacto.cuerpo.data.measurements.length === 1,
    {
      propio: propio.status,
      ajeno: `${ajeno.status} ${ajeno.cuerpo?.error?.code}`,
      inventado: `${inexistente.status} ${inexistente.cuerpo?.error?.code}`,
      respuestasIdenticas: JSON.stringify(ajeno.cuerpo) === JSON.stringify(inexistente.cuerpo),
      escrituras: `guardar ${guardar.status} · registrar ${registrarAjeno.status}`,
      borradoresQueVeElOtro: listaDelOtro.cuerpo?.data?.length,
      borradoresPropios: listaPropia.cuerpo?.data?.length,
      tableroDelVinculoPropio: tablero.status,
      borradorIntacto: `${sigueIntacto.cuerpo?.data?.state} · ${sigueIntacto.cuerpo?.data?.measurements?.length} medición`,
    },
  );
}

// ─── Cálculo: versión exacta, admisibilidad, coexistencia y referencia ──────────────────────────
{
  const dia = haceDias(3);
  const { porMetrica } = await evaluacionRegistrada(pa, ase.id, dia, [medicion('peso', 72.5, 'kg'), medicion('talla', 1.75, 'm')]);
  // La misma toma, pero informada por la persona: existe, es visible y no es admisible para la versión vigente.
  const conInformado = await evaluacionRegistrada(pa, ase.id, dia, [medicion('peso', 70, 'kg'), medicion('talla', 1.75, 'm')], 'SELF_REPORTED');
  const metodos = await pedir('GET', '/professional-methods', { token: pa.token });
  const vigente = metodos.cuerpo.data.find((m) => m.key === 'MET-DEMO');
  const historica = await pedir('GET', `/professional-methods/${vigente.methodId}/versions/${vigente.methodVersionId}`, { token: pa.token });
  const entradas = (peso) => [
    { inputCode: 'PESO', sourceRef: peso },
    { inputCode: 'TALLA', sourceRef: porMetrica.talla },
  ];

  const correcta = await pedir('POST', `/advisees/${ase.id}/calculations`, {
    token: pa.token,
    clave: clave(),
    cuerpo: { purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: vigente.methodVersionId, inputBindings: entradas(porMetrica.peso) },
  });
  // Disponible no es admisible: el peso informado por la persona existe y es visible, y no sirve para esta versión.
  const informado = await pedir('POST', `/advisees/${ase.id}/calculations`, {
    token: pa.token,
    clave: clave(),
    cuerpo: {
      purpose: 'ANTHROPOMETRIC_SUPPORT',
      methodVersionId: vigente.methodVersionId,
      inputBindings: [
        { inputCode: 'PESO', sourceRef: conInformado.porMetrica.peso },
        { inputCode: 'TALLA', sourceRef: conInformado.porMetrica.talla },
      ],
    },
  });

  // Otra evaluación, otra corrida: las dos conviven.
  const otroDia = haceDias(3);
  const otra = await evaluacionRegistrada(pa, ase.id, otroDia, [medicion('peso', 75, 'kg'), medicion('talla', 1.75, 'm')]);
  const segunda = await pedir('POST', `/advisees/${ase.id}/calculations`, {
    token: pa.token,
    clave: clave(),
    cuerpo: {
      purpose: 'ANTHROPOMETRIC_SUPPORT',
      methodVersionId: vigente.methodVersionId,
      inputBindings: [
        { inputCode: 'PESO', sourceRef: otra.porMetrica.peso },
        { inputCode: 'TALLA', sourceRef: otra.porMetrica.talla },
      ],
    },
  });

  const lista = await pedir('GET', `/advisees/${ase.id}/calculations`, { token: pa.token });
  const referencia = await pedir('PUT', `/advisees/${ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`, {
    token: pa.token,
    clave: clave(),
    cuerpo: { calculationRunId: correcta.cuerpo.data.calculationRunId, expectedVersion: null, rationale: 'Es la toma con protocolo completo.' },
  });
  const reemplazo = await pedir('PUT', `/advisees/${ase.id}/calculation-references/ANTHROPOMETRIC_SUPPORT`, {
    token: pa.token,
    clave: clave(),
    cuerpo: { calculationRunId: segunda.cuerpo.data.calculationRunId, expectedVersion: referencia.cuerpo.data.version },
  });
  const despues = await pedir('GET', `/calculations/${correcta.cuerpo.data.calculationRunId}`, { token: pa.token });
  const listaFinal = await pedir('GET', `/advisees/${ase.id}/calculations`, { token: pa.token });
  const adoptadas = listaFinal.cuerpo?.data?.filter((c) => c.referenceForPurpose) ?? [];

  registrar(
    'calculo',
    'disponible no es admisible, la corrida conserva su versión exacta, dos corridas coexisten y adoptar una no toca a la otra',
    correcta.status === 201 &&
      correcta.cuerpo.data.methodVersionId === vigente.methodVersionId &&
      correcta.cuerpo.data.result.magnitude.value === 23.673 &&
      correcta.cuerpo.data.referenceForPurpose === false &&
      informado.status === 422 &&
      informado.cuerpo.error.code === 'CALCULATION_INPUTS_INSUFFICIENT' &&
      historica.status === 200 &&
      segunda.status === 201 &&
      lista.cuerpo.data.length >= 2 &&
      // La lista no trae promedio, ni ranking, ni ganadora: solo los datos y la página.
      JSON.stringify(Object.keys(lista.cuerpo).sort()) === '["data","page"]' &&
      referencia.status === 201 &&
      referencia.cuerpo.data.supersedesReferenceId === null &&
      reemplazo.status === 201 &&
      reemplazo.cuerpo.data.supersedesReferenceId === referencia.cuerpo.data.referenceId &&
      // La corrida que dejó de ser referencia no cambió en nada.
      JSON.stringify(despues.cuerpo.data.result) === JSON.stringify(correcta.cuerpo.data.result) &&
      adoptadas.length === 1 &&
      adoptadas[0].calculationRunId === segunda.cuerpo.data.calculationRunId,
    {
      corrida: `${correcta.cuerpo?.data?.result?.magnitude?.value} ${correcta.cuerpo?.data?.result?.magnitude?.unit} · método v${correcta.cuerpo?.data?.methodVersion} · regla ${correcta.cuerpo?.data?.ruleId} · ${correcta.cuerpo?.data?.precision?.decimals} decimales`,
      pesoInformado: `${informado.status} ${informado.cuerpo?.error?.code} · ${JSON.stringify(informado.cuerpo?.error?.details?.issues)}`,
      corridasListadas: lista.cuerpo?.data?.length,
      clavesDeLaLista: Object.keys(lista.cuerpo ?? {}),
      referencia: `${referencia.status} · sucede a ${referencia.cuerpo?.data?.supersedesReferenceId ?? 'ninguna'}`,
      reemplazo: `${reemplazo.status} · sucede a ${reemplazo.cuerpo?.data?.supersedesReferenceId ? 'la anterior' : '?'}`,
      corridaAnteriorIntacta: JSON.stringify(despues.cuerpo?.data?.result) === JSON.stringify(correcta.cuerpo?.data?.result),
      adoptadas: adoptadas.length,
    },
  );
}

// ─── Cero juicio en todas las respuestas de la corrida ──────────────────────────────────────────
{
  const PROHIBIDA = /diagnos|score|puntaje|average|promedio|winner|ganador|interpolat|imputed|carriedforward|ranking/i;
  const HONESTIDAD = new Set(['interpolated', 'imputed', 'carriedForward']);
  const claves = (v, ruta) =>
    Array.isArray(v)
      ? v.flatMap((x, i) => claves(x, `${ruta}[${i}]`))
      : v && typeof v === 'object'
        ? Object.entries(v).flatMap(([k, x]) => [
            // Las tres banderas de honestidad existen y tienen que estar en falso: son la promesa explícita.
            ...(HONESTIDAD.has(k) ? (x === false ? [] : [`${ruta}.${k} = ${JSON.stringify(x)}`]) : PROHIBIDA.test(k) ? [`${ruta}.${k}`] : []),
            ...claves(x, `${ruta}.${k}`),
          ])
        : [];
  const hallazgos = respuestas.flatMap((r) => claves(r.cuerpo, r.ruta));
  registrar('cero-juicio', 'ninguna respuesta trae claves de diagnóstico, puntaje, promedio o ganadora, ni una bandera de honestidad en verdadero', hallazgos.length === 0, {
    respuestasRevisadas: respuestas.length,
    hallazgos,
  });
}

await finalizar(ase, vinculoPA);
await finalizar(ase, vinculoPN);

const resumen = { api: base, momento: new Date().toISOString(), profesionales: ['DEMO-PA', 'DEMO-PN'], casos, todos: casos.every((c) => c.resultado === 'PASA') };
if (salida) writeFileSync(salida, `${JSON.stringify(resumen, null, 2)}\n`);
process.stdout.write(`\n${resumen.todos ? 'Todos los casos pasan.' : 'Hay casos que fallan.'}\n`);
process.exit(resumen.todos ? 0 : 1);
