// Recorrido por la API de WP-ENTRENAMIENTO-SERIES, después de que el profesional armó y activó «Piernas A» en la web.
// - P01 · el teléfono recibe exactamente esos objetivos: API-SER-02 de la ocurrencia de hoy, serie por serie, contra
//   sesion_demo.json; y cada ejercicio con su imagen, su licencia y su revisión.
// - P03 · el asesorado del plan lee las tres imágenes (API-MED-03) y las descarga en JPEG.
// - P05 · el otro asesorado no lee las imágenes; el otro profesional no lee el plan, ni las imágenes, ni puede asociar.
// - C01 · lo que lee la APK 0.13.2 (API-TRN-14) conserva su forma estricta: ninguna clave nueva.
// - Compatibilidad (precierre del 2026-10-06, §2): una APK que no declara la capacidad (la 0.13.2 y las dos candidatas no
//   declaran nada) no recibe un plan con objetivos por serie: «no disponible», sin plan ni ocurrencias, y nunca los valores
//   generales como si fueran los de cada serie. La APK nueva, que la declara, recibe el plan y los objetivos exactos.
// Uso: node recorrido-api.mjs [origen de la API]   (lee estado.json; escribe recorrido-api.json)
import { REPO, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(`${REPO}/packages/domain/`);
const d = require(`${REPO}/packages/domain/dist/index.js`);

const origen = process.argv[2] ?? 'http://localhost:3001';
const PAQUETE = `${REPO}/docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06`;
const demo = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/sesion_demo.json`, 'utf8'));
const catalogo = JSON.parse(fs.readFileSync(`${PAQUETE}/ejercicios/CATALOGO.json`, 'utf8')).assets;
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const CRED = 'clave-sintetica-de-prueba-01';
const web = d.crearClienteBe({ baseUrl: `${origen}/api/v1`, superficie: 'WEB' });
// La APK nueva declara que muestra los objetivos de cada serie (X-BE-Capabilities); la vieja no declara nada.
const apk = d.crearClienteBe({ baseUrl: `${origen}/api/v1`, superficie: 'APK', capacidades: [d.CAPACIDAD_OBJETIVOS_POR_SERIE] });
const apkVieja = d.crearClienteBe({ baseUrl: `${origen}/api/v1`, superficie: 'APK' });
const clave = () => `e2e-${crypto.randomUUID()}`;
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 600) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 220)}` : ''}`);
};
const exigir = (r, que) => {
  if (!r.ok) throw new Error(`${que}: ${r.tipo === 'API' ? `${r.status} ${r.codigo}` : 'sin respuesta'}`);
  return r.datos;
};
/** Las sesiones guardadas de la corrida: el login tiene un límite de 5 cada 15 minutos. */
const SESIONES = enTrabajo('.sesiones.json');
const sesiones = fs.existsSync(SESIONES) ? JSON.parse(fs.readFileSync(SESIONES, 'utf8')) : {};
async function sesion(cliente, correo) {
  const guardada = sesiones[correo];
  if (guardada && Date.parse(guardada.expira) - Date.now() > 10 * 60 * 1000) return guardada.token;
  const s = exigir(await cliente.iniciarSesion(correo, CRED), `sesión de ${correo.split('@')[0]}`).data.session;
  sesiones[correo] = { token: s.accessToken, expira: s.expiresAt };
  fs.writeFileSync(SESIONES, JSON.stringify(sesiones));
  return s.accessToken;
}

const resultado = {};
try {
  const ase = await sesion(apk, estado.aseCorreo);
  const otro = await sesion(apk, estado.otroCorreo);
  const otroPro = await sesion(web, estado.otroProCorreo);

  // ─── Compatibilidad (§2): la APK que no declara la capacidad no recibe este plan ───────────────
  const crudoViejo = await fetch(`${origen}/api/v1/me/training/today`, { headers: { Authorization: `Bearer ${ase}`, 'X-BE-Surface': 'APK' } }).then((r) => r.json());
  control('C01 · para la APK sin la capacidad, API-TRN-14 conserva la forma estricta que valida la 0.13.2', d.HoyDeEntrenamientoResponseSchema.safeParse(crudoViejo).success);
  control(
    'la APK sin la capacidad (0.13.2 y candidatas) recibe «no disponible», sin plan ni ocurrencias: no ve valores generales como si fueran los de cada serie',
    crudoViejo.data?.planState === 'NOT_AVAILABLE' && crudoViejo.data.activePlan === null && crudoViejo.data.occurrences.length === 0,
    JSON.stringify({ planState: crudoViejo.data?.planState, activePlan: crudoViejo.data?.activePlan, ocurrencias: crudoViejo.data?.occurrences?.length }),
  );
  const conElCliente = await apkVieja.hoyDeEntrenamiento(ase);
  control('el cliente compartido sin la capacidad lee lo mismo', conElCliente.ok && conElCliente.datos.data.planState === 'NOT_AVAILABLE', conElCliente.ok ? conElCliente.datos.data.planState : JSON.stringify(conElCliente));

  // ─── C01 y la ocurrencia de hoy, con la APK nueva ──────────────────────────────────────────────
  const hoy = exigir(await apk.hoyDeEntrenamiento(ase), 'Hoy (API-TRN-14)').data;
  control('la APK nueva, que declara la capacidad, recibe el plan disponible con sus sesiones de hoy', hoy.planState === 'AVAILABLE' && hoy.occurrences.length > 0, `${hoy.planState} · ${hoy.occurrences.length} sesiones`);
  const crudo = await fetch(`${origen}/api/v1/me/training/today`, { headers: { Authorization: `Bearer ${ase}`, 'X-BE-Surface': 'APK', [d.HEADER_DE_CAPACIDADES]: d.CAPACIDAD_OBJETIVOS_POR_SERIE } }).then((r) => r.json());
  control('C01 · API-TRN-14 conserva la forma estricta que lee la APK 0.13.2 también para la nueva', d.HoyDeEntrenamientoResponseSchema.safeParse(crudo).success);
  const vieja = crudo.data.occurrences?.[0]?.plannedSession?.prescriptions?.[0] ?? {};
  control('C01 · la prescripción de la lectura vieja no trae claves nuevas', !('restSeconds' in vieja) && !('loadBasis' in vieja) && !(vieja.sets ?? []).some((s) => 'rir' in s || 'restSeconds' in s), Object.keys(vieja).join(','));
  const ocurrencia = hoy.occurrences.find((o) => o.plannedSession.label === demo.name);
  control(`«${demo.name}» está entre las sesiones de hoy`, !!ocurrencia, hoy.occurrences.map((o) => o.plannedSession.label).join(', '));
  resultado.occurrenceId = ocurrencia.occurrenceId;

  // ─── P01 · lo que recibe el teléfono ──────────────────────────────────────────────────────
  const sesionParaRegistrar = exigir(await apk.sesionParaRegistrar(ase, ocurrencia.occurrenceId), 'sesión para registrar (API-SER-02)').data;
  for (const [l, ex] of demo.exercises.entries()) {
    const p = sesionParaRegistrar.session.prescriptions[l];
    const ej = catalogo.find((c) => c.fixtureKey === ex.catalogFixtureKey);
    control(`${ej.name}: el ejercicio ${l + 1} de la sesión es el del plan`, p?.exerciseName === ej.name, p?.exerciseName);
    const recibidas = p.sets.map((s) => ({ setIndex: s.setIndex, repetitions: s.target.repetitions, suggestedLoad: s.target.suggestedLoad, rir: s.target.rir, restSeconds: s.target.restSeconds }));
    const esperadas = ex.sets.map((s) => ({ setIndex: s.setIndex, repetitions: s.plannedRepetitions, suggestedLoad: s.suggestedLoad, rir: s.plannedRir, restSeconds: s.recommendedRestSeconds }));
    control(`P01 · ${ej.name}: las ${ex.sets.length} series llegan exactamente como en sesion_demo.json`, JSON.stringify(recibidas) === JSON.stringify(esperadas), JSON.stringify(recibidas));
    control(
      `${ej.name}: imagen asociada, generada por IA, sin licencia externa y con revisión pendiente`,
      p.image && p.image.provenance === 'AI_GENERATED' && p.image.license.kind === 'NO_EXTERNAL_LICENSE' && p.image.technicalReview === 'PENDING_PROFESSIONAL_REVIEW' && p.image.altText === ej.alt,
      JSON.stringify(p.image),
    );
    // P03 · el asesorado la lee; P05 · el otro asesorado y el otro profesional, no.
    const acceso = await apk.accederAMedio(ase, p.image.mediaId);
    let bytes = null;
    if (acceso.ok) bytes = await fetch(`${origen}/api/v1${acceso.datos.data.path}`).then(async (r) => ({ tipo: r.headers.get('content-type'), largo: (await r.arrayBuffer()).byteLength }));
    control(`P03 · ${ej.name}: el asesorado del plan descarga la imagen en JPEG`, acceso.ok && bytes?.tipo === 'image/jpeg' && bytes.largo > 1000, JSON.stringify(bytes));
    const delOtro = await apk.accederAMedio(otro, p.image.mediaId);
    control(`P05 · ${ej.name}: otro asesorado no la lee (404)`, !delOtro.ok && delOtro.tipo === 'API' && delOtro.status === 404, delOtro.ok ? 'la leyó' : delOtro.status);
    const delOtroPro = await web.accederAMedio(otroPro, p.image.mediaId);
    control(`P05 · ${ej.name}: otro profesional no la lee (404)`, !delOtroPro.ok && delOtroPro.tipo === 'API' && delOtroPro.status === 404, delOtroPro.ok ? 'la leyó' : delOtroPro.status);
    const asociar = await web.asociarImagenDeEjercicio(
      otroPro,
      p.exerciseId,
      { exerciseVersionId: p.exerciseVersionId, mediaId: p.image.mediaId, expectedImageVersion: p.image.imageVersion, altText: 'x', license: { kind: 'NO_EXTERNAL_LICENSE', usage: 'x' }, technicalReview: 'PENDING_PROFESSIONAL_REVIEW' },
      clave(),
    );
    control(`P05 · ${ej.name}: otro profesional no puede cambiar la imagen`, !asociar.ok && asociar.tipo === 'API' && [403, 404].includes(asociar.status), asociar.ok ? 'la cambió' : `${asociar.status} ${asociar.codigo}`);
  }
  const planDelOtro = await web.planConObjetivos(otroPro, sesionParaRegistrar.planId);
  control('P05 · otro profesional no lee el plan con sus objetivos (API-SER-01: 404)', !planDelOtro.ok && planDelOtro.tipo === 'API' && planDelOtro.status === 404, planDelOtro.ok ? 'lo leyó' : planDelOtro.status);
  const planDelTitular = await apk.planConObjetivos(ase, sesionParaRegistrar.planId);
  control('el titular tampoco lee API-SER-01: es del profesional (404)', !planDelTitular.ok && planDelTitular.tipo === 'API' && planDelTitular.status === 404, planDelTitular.ok ? 'lo leyó' : planDelTitular.status);
  resultado.planId = sesionParaRegistrar.planId;
} catch (e) {
  control('el recorrido por la API terminó sin errores', false, e.stack ?? String(e));
} finally {
  fs.writeFileSync(enTrabajo('recorrido-api.json'), JSON.stringify({ ...resultado, controles }, null, 2));
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles`);
  process.exit(fallas ? 1 : 0);
}
