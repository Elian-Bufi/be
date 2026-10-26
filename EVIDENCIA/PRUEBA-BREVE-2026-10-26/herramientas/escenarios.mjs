// Los escenarios descartables de la prueba breve (encargo de Dirección del 2026-10-26), en el ambiente test.
//
// Cuentas sintéticas nuevas, con «Prueba» en el nombre y correo @example.invalid. Nunca la cohorte, la demostración ni
// Diego Sosa: este guion no lee ni escribe sus cuentas, y su carpeta es otra.
//
// Fases, en orden (cada una se puede repetir: lo hecho queda en estado.json y no se rehace):
//   cuentas        por la API, como desde el website y la APK: el profesional y cinco personas, con el permiso de datos
//                  de salud (A3) y el nombre de cada persona. Imprime la entrada de BE_DEMO_PROFESIONALES del profesional:
//                  la verifica el servicio interno al arrancar la API (DL-036), con un PR solo de configuración.
//   api            (con el profesional ya verificado) por la API, todo lo que es de hoy:
//                    Uno     vínculo de Entrenamiento, evaluación, objetivo y un plan por serie activado: la sesión que se
//                            usa en el teléfono para sustituir un ejercicio;
//                    Cuatro  vínculo de Nutrición con la autorización revocada por la persona;
//                    Cinco   vínculo de Nutrición finalizado por la persona.
//   pasado         (con la IP de esta máquina habilitada en be-db-test, 07 §29) la historia de Nutrición de Dos y Tres,
//                  como la cohorte: el vínculo, el objetivo y la activación del plan por SQL con su fecha; la evaluación y
//                  el borrador del plan por la API; y las comidas de los últimos días por SQL, con un hueco y un registro
//                  sin cantidades.
//   verificar      lee por la API lo preparado (solo lectura) y lo compara con lo esperado, calculado aparte
//                  (esperado.mjs, sin las funciones del producto).
//
// Credenciales: se generan al azar y quedan solo en cuentas.env de la carpeta privada (fuera del repo). Nunca se imprimen.
// Uso: BE_REPO=<un árbol con packages/domain/dist y node_modules> node escenarios.mjs <fase>
import fs from 'node:fs';
import { join } from 'node:path';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ALIMENTOS, EJERCICIOS_BASE } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/catalogo.mjs';
import { ZONA, diaMenos, instante, masMinutos } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/herramientas.mjs';
import * as esperado from './esperado.mjs';
import { COMIDAS_DOS, COMIDAS_TRES, DIA_TIPO, FECHAS, HORA_DE_LA_COMIDA, OBJETIVO_DOS, OBJETIVO_TRES, PLAN_DOS, PLAN_TRES, SESION_UNO } from './datos.mjs';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const REPO = (process.env.BE_REPO ?? join(AQUI, '..', '..', '..')).split('\\').join('/');
const dominio = createRequire(`${REPO}/packages/domain/`)(`${REPO}/packages/domain/dist/index.js`);

export const ORIGEN = 'https://be-api-hndp.onrender.com';
export const CARPETA = 'C:/Users/bufim/BE-datos-locales/prueba-test';
const ESTADO = join(CARPETA, 'estado.json');
const CUENTAS = join(CARPETA, 'cuentas.env');

// ─── Quiénes son ───────────────────────────────────────────────────────────────────────────────────────────────

/** El profesional descartable: Nutrición y Entrenamiento. El tipo de perfil es de la identidad (render.yaml). */
export const PROFESIONAL = { prefijo: 'PRO', correo: 'prueba.profesional', nombre: 'Lic. Prueba Dos Áreas', tipo: 'SANITARIO', alcances: ['NUTRICION', 'ENTRENAMIENTO'] };

/** Las personas. El nombre es neutro a propósito: la prueba busca qué se entiende sin ayuda. */
export const PERSONAS = [
  { prefijo: 'ASE_UNO', correo: 'prueba.uno', nombre: 'Prueba Uno', para: 'Entrenamiento: la sesión del teléfono (sustituir, registrar series, volver a lo planificado)' },
  { prefijo: 'ASE_DOS', correo: 'prueba.dos', nombre: 'Prueba Dos', para: 'Nutrición: plan con una sola opción por comida, con indicado del día' },
  { prefijo: 'ASE_TRES', correo: 'prueba.tres', nombre: 'Prueba Tres', para: 'Nutrición: plan con alternativas, sin indicado del día' },
  { prefijo: 'ASE_CUATRO', correo: 'prueba.cuatro', nombre: 'Prueba Cuatro', para: 'Nutrición: la persona revocó la autorización' },
  { prefijo: 'ASE_CINCO', correo: 'prueba.cinco', nombre: 'Prueba Cinco', para: 'Nutrición: la persona finalizó el vínculo' },
];

// ─── Estado y credenciales (fuera del repo) ────────────────────────────────────────────────────────────────────

fs.mkdirSync(CARPETA, { recursive: true });
export const leerEstado = () => (fs.existsSync(ESTADO) ? JSON.parse(fs.readFileSync(ESTADO, 'utf8')) : {});
const guardarEstado = (cambios) => fs.writeFileSync(ESTADO, JSON.stringify({ ...leerEstado(), ...cambios }, null, 2));

export function leerCuentas() {
  if (!fs.existsSync(CUENTAS)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(CUENTAS, 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
}
function guardarCuenta(prefijo, { correo, clave, id }) {
  const nuevas = { ...leerCuentas(), [`${prefijo}_CORREO`]: correo, [`${prefijo}_CLAVE`]: clave, [`${prefijo}_ID`]: id };
  const cabecera = [
    '# Cuentas descartables de la prueba breve (encargo de Dirección del 2026-10-26), ambiente test.',
    '# Sintéticas, con «Prueba» en el nombre. NO versionar ni compartir por chat. Se borran con la carpeta cuando ya no hagan falta.',
    '',
  ].join('\n');
  fs.writeFileSync(CUENTAS, cabecera + Object.entries(nuevas).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
}

/** Una contraseña al azar que se puede escribir en un teléfono: cuatro grupos de cuatro, sin caracteres que se confunden. */
const LETRAS = 'abcdefghjkmnpqrstuvwxyz23456789';
const claveNueva = () => Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => LETRAS[randomInt(LETRAS.length)]).join('')).join('-');

// ─── La API, con el cliente del producto ───────────────────────────────────────────────────────────────────────

const web = dominio.crearClienteBe({ baseUrl: `${ORIGEN}/api/v1`, superficie: 'WEB' });
const apk = dominio.crearClienteBe({ baseUrl: `${ORIGEN}/api/v1`, superficie: 'APK' });
const clave = () => `prueba-breve-${randomUUID()}`;
export function exigir(r, que) {
  if (!r.ok) throw new Error(`${que}: ${r.tipo === 'API' ? `${r.status} ${r.codigo} ${JSON.stringify(r.issues ?? [])}` : 'sin respuesta'}`);
  return r.datos;
}
const cliente = (prefijo) => (prefijo === 'PRO' ? web : apk);

const sesiones = new Map();
/** Una sola entrada por cuenta y corrida (el límite es de 5 cada 15 minutos por red y cuenta). */
export async function sesionDe(prefijo) {
  if (!sesiones.has(prefijo)) {
    const c = leerCuentas();
    if (!c[`${prefijo}_CORREO`]) throw new Error(`falta la cuenta ${prefijo}`);
    sesiones.set(prefijo, exigir(await cliente(prefijo).iniciarSesion(c[`${prefijo}_CORREO`], c[`${prefijo}_CLAVE`]), `entrada de ${prefijo}`).data.session.accessToken);
  }
  return sesiones.get(prefijo);
}
export const idDe = (prefijo) => leerCuentas()[`${prefijo}_ID`];

/** Un pedido directo, para las operaciones que el cliente no expone. Mismos encabezados que la APK o el website. */
export async function pedir(metodo, ruta, { prefijo, cuerpo, esperado = [200, 201, 204], idempotente = true } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': prefijo === 'PRO' ? 'WEB' : 'APK' };
  if (prefijo) headers.Authorization = `Bearer ${await sesionDe(prefijo)}`;
  if (idempotente && ['POST', 'PUT', 'DELETE'].includes(metodo)) headers['Idempotency-Key'] = clave();
  const r = await fetch(`${ORIGEN}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  if (![esperado].flat().includes(r.status)) throw new Error(`${metodo} ${ruta}: ${r.status} ${texto.slice(0, 500)}`);
  return texto ? JSON.parse(texto) : null;
}

// ─── Fase «cuentas» ────────────────────────────────────────────────────────────────────────────────────────────

const entradaDeLaSiembra = (id) => PROFESIONAL.alcances.map((a) => `${id}|${a}|${PROFESIONAL.tipo}|${PROFESIONAL.nombre}`).join(';');

async function cuentas() {
  const c = leerCuentas();
  const sufijo = leerEstado().sufijo ?? Date.now().toString(36);
  guardarEstado({ sufijo });
  for (const p of [PROFESIONAL, ...PERSONAS]) {
    if (c[`${p.prefijo}_ID`]) continue;
    const correo = `${p.correo}.${sufijo}@example.invalid`;
    const contrasena = claveNueva();
    // DL-138: toda alta declara la mayoría de edad (las personas sintéticas son adultas).
    const r = exigir(await cliente(p.prefijo).registrar({ correo, contrasena, mayoriaDeEdad: true }, clave()), `alta de ${p.prefijo}`);
    guardarCuenta(p.prefijo, { correo, clave: contrasena, id: r.data.identityId });
    console.log(`${p.prefijo}: alta ${r.data.identityId} (${r.data.registrationIntent})`);
  }
  for (const p of PERSONAS) {
    const e = leerEstado().personas?.[p.prefijo] ?? {};
    if (e.cuenta) continue;
    // A3, como al crear la cuenta desde la APK, y el nombre que declara la persona en «Cuenta».
    await pedir('POST', '/me/health-data-consents', { prefijo: p.prefijo, cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id }, esperado: [200, 201, 409] });
    const perfil = exigir(await apk.consultarPerfilPropio(await sesionDe(p.prefijo)), `perfil de ${p.prefijo}`).data;
    if (perfil.displayName !== p.nombre) exigir(await apk.editarPerfilPropio(await sesionDe(p.prefijo), { expectedVersion: perfil.version, changes: { displayName: p.nombre } }), `nombre de ${p.prefijo}`);
    guardarEstado({ personas: { ...(leerEstado().personas ?? {}), [p.prefijo]: { ...e, cuenta: true } } });
    console.log(`${p.prefijo}: A3 y nombre «${p.nombre}»`);
  }
  const linea = entradaDeLaSiembra(idDe('PRO'));
  fs.writeFileSync(join(CARPETA, 'entrada-de-la-siembra.txt'), `${linea}\n`);
  console.log(`Entrada de BE_DEMO_PROFESIONALES (no es secreta): ${linea}`);
}

// ─── Pasos que se retoman ──────────────────────────────────────────────────────────────────────────────────────

const hoyCivil = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function paso(prefijo, nombre, fn) {
  const e = leerEstado().personas?.[prefijo] ?? {};
  if (e.hecho?.includes(nombre)) return e;
  const cambios = (await fn(e)) ?? {};
  const nuevo = { ...e, ...cambios, hecho: [...(e.hecho ?? []), nombre] };
  guardarEstado({ personas: { ...(leerEstado().personas ?? {}), [prefijo]: nuevo } });
  console.log(`  ${prefijo} · ${nombre}`);
  return nuevo;
}

// ─── Fase «api»: lo que es de hoy ──────────────────────────────────────────────────────────────────────────────

/** Un vínculo de hoy, como en el website y la APK: la solicitud del profesional, la aceptación y la autorización (B2). */
async function vincularHoy(prefijo, alcance) {
  const pro = await sesionDe('PRO');
  const ase = await sesionDe(prefijo);
  const s = exigir(await web.solicitarVinculo(pro, { asesoradoId: idDe(prefijo), alcance }, clave()), `solicitud de ${alcance} a ${prefijo}`);
  const a = exigir(await apk.aceptarSolicitud(ase, s.data.relationshipRequestId, s.data.version ?? 'v1', clave()), `aceptación de ${prefijo}`);
  const vinculoId = a.data.relationshipId;
  const req = exigir(await apk.consultarRequisitosDeConsentimiento(ase, vinculoId), `requisitos de ${prefijo}`);
  const c = exigir(await apk.otorgarConsentimiento(ase, vinculoId, req.data.consentVersion.id, clave()), `autorización de ${prefijo}`);
  return { vinculoId, consentimientoId: c.data.consentId };
}

const estructuraDeEntrenamiento = () => ({
  blocks: [
    {
      label: SESION_UNO.bloque,
      purpose: SESION_UNO.proposito,
      sessions: [
        {
          label: SESION_UNO.sesion,
          prescriptions: SESION_UNO.ejercicios.map((x) => ({
            exerciseVersionId: EJERCICIOS_BASE[x.ejercicio],
            sets: Array.from({ length: x.series }, () => ({ repetitions: { value: x.repeticiones } })),
            intensity: { criterion: 'RIR', target: { value: x.rir } },
            suggestedLoad: { value: x.cargaKg, unit: 'kg' },
            restSeconds: x.descansoS,
            loadBasis: 'TOTAL_EXTERNAL',
          })),
        },
      ],
    },
  ],
});

async function api() {
  // Uno: la sesión del teléfono.
  await paso('ASE_UNO', 'vinculo-entrenamiento', async () => ({ entrenamiento: await vincularHoy('ASE_UNO', 'ENTRENAMIENTO') }));
  await paso('ASE_UNO', 'plan-de-entrenamiento', async () => {
    const pro = await sesionDe('PRO');
    const aseId = idDe('ASE_UNO');
    const ev = exigir(
      await web.crearEvaluacionDeEntrenamiento(
        pro,
        aseId,
        {
          occurredAt: new Date(Date.now() - 60 * 60_000).toISOString(),
          assessment: { entries: [{ concept: 'Experiencia en entrenamiento de fuerza', value: 'Dos años, con cargas moderadas', source: 'REPORTED' }] },
          evidenceReferences: [],
          professionalNotes: 'Notas sintéticas de la prueba breve.',
        },
        clave(),
      ),
      'evaluación de Entrenamiento de Uno',
    );
    const ob = exigir(
      await web.crearObjetivoDeEntrenamiento(
        pro,
        aseId,
        { evaluationId: ev.data.evaluationId, effectiveFrom: new Date(Date.now() - 30 * 60_000).toISOString(), effectiveUntil: null, objective: { statement: SESION_UNO.objetivo }, rationale: SESION_UNO.fundamento },
        clave(),
      ),
      'objetivo de Entrenamiento de Uno',
    );
    const plan = exigir(await web.crearPlanDeEntrenamiento(pro, aseId, { objectiveVersionId: ob.data.versionId, initialStructure: estructuraDeEntrenamiento() }, clave()), 'borrador del plan de Uno');
    const validacion = exigir(await web.validarPlanDeEntrenamiento(pro, plan.data.planId, plan.data.version), 'validación del plan de Uno');
    const activado = exigir(await web.activarPlanDeEntrenamiento(pro, plan.data.planId, plan.data.version, clave()), 'activación del plan de Uno');
    console.log(`    plan ${plan.data.planId}: validación ${JSON.stringify(validacion.data).slice(0, 160)} · activado ${JSON.stringify(activado.data).slice(0, 120)}`);
    return { planDeEntrenamiento: plan.data.planId };
  });
  // Cuatro: autorizó y después revocó la autorización.
  await paso('ASE_CUATRO', 'vinculo-nutricion', async () => ({ nutricion: await vincularHoy('ASE_CUATRO', 'NUTRICION') }));
  await paso('ASE_CUATRO', 'revocacion', async (e) => {
    exigir(await apk.revocarConsentimiento(await sesionDe('ASE_CUATRO'), e.nutricion.consentimientoId), 'revocación de Cuatro');
    return {};
  });
  // Cinco: autorizó y después finalizó el vínculo.
  await paso('ASE_CINCO', 'vinculo-nutricion', async () => ({ nutricion: await vincularHoy('ASE_CINCO', 'NUTRICION') }));
  await paso('ASE_CINCO', 'finalizacion', async (e) => {
    const t = await sesionDe('ASE_CINCO');
    const d = exigir(await apk.consultarVinculo(t, e.nutricion.vinculoId), 'vínculo de Cinco').data;
    const version = d.version ?? d.relationship?.version;
    exigir(await apk.finalizarVinculo(t, e.nutricion.vinculoId, version, 'DECISION_PERSONAL', clave()), 'finalización de Cinco');
    return {};
  });
}

// ─── Fase «pasado»: la historia de Nutrición de Dos y Tres, como la cohorte ────────────────────────────────────

/** La base de test por su URL externa, que vive fuera del repo y nunca se imprime (la misma guardia que la cohorte). */
function urlDeLaBase() {
  const archivo = 'C:/Users/bufim/BE-datos-locales/render-test-db.txt';
  if (!fs.existsSync(archivo)) throw new Error(`Falta ${archivo}.`);
  const u = new URL(fs.readFileSync(archivo, 'utf8').trim());
  if (!/^postgres(ql)?:$/.test(u.protocol) || !/\.render\.com$/.test(u.hostname) || u.pathname !== '/be_test') throw new Error('Guardia: la URL no es la base be_test de Render.');
  u.searchParams.set('sslmode', 'require');
  return u.href;
}
let prisma;
const base = () => {
  if (!prisma) {
    const { PrismaClient } = createRequire(`${REPO}/apps/api/`)('@prisma/client');
    prisma = new PrismaClient({ datasources: { db: { url: urlDeLaBase() } } });
  }
  return prisma;
};
const en = (fn) => base().$transaction(fn, { timeout: 300_000, maxWait: 60_000 });
const filas = (tx, texto, ...valores) => tx.$queryRawUnsafe(texto, ...valores);

// Las inserciones de la cohorte (cargar.mjs), sin cambios de fondo: el tipo de cada columna se lee de la base, los
// disparadores quedan activos y cada transición deja su hecho en la misma transacción.
const tipos = new Map();
async function tiposDe(tx, tabla) {
  if (!tipos.has(tabla)) {
    const r = await filas(tx, `SELECT column_name AS c, udt_name AS t FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, tabla);
    if (!r.length) throw new Error(`no existe la tabla ${tabla}`);
    tipos.set(tabla, Object.fromEntries(r.map((x) => [x.c, x.t])));
  }
  return tipos.get(tabla);
}
const NATIVOS = new Set(['uuid', 'date', 'jsonb', 'timestamptz', 'int4', 'int8', 'numeric', 'text', 'bool', 'float8']);
async function insertar(tx, tabla, lista) {
  if (!lista.length) return;
  const t = await tiposDe(tx, tabla);
  const columnas = Object.keys(lista[0]);
  for (const c of columnas) if (!t[c]) throw new Error(`${tabla} no tiene la columna ${c}`);
  const valores = [];
  const tuplas = lista.map(
    (f) =>
      `(${columnas
        .map((c) => {
          const v = f[c];
          valores.push(v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v);
          return `$${valores.length}::${NATIVOS.has(t[c]) ? t[c] : `"${t[c]}"`}`;
        })
        .join(',')})`,
  );
  await tx.$executeRawUnsafe(`INSERT INTO "${tabla}" (${columnas.map((c) => `"${c}"`).join(',')}) VALUES ${tuplas.join(',')}`, ...valores);
}
const PROC = { fuente: 'PROPIA', casoDeUso: 'DATOS-SINTETICOS', operacion: 'SIEMBRA-PRUEBA-BREVE', superficie: null, requestId: null };

async function vincularEnElPasado(tx, { proId, aseId, alcance, tipo, momento }) {
  const finalidad = dominio.FINALIDAD_DE_ALCANCE[alcance];
  const texto = dominio.VERSION_VIGENTE[tipo === 'SANITARIO' ? 'CONSENTIMIENTO_PROFESIONAL_SANITARIO' : 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO'];
  const aceptada = masMinutos(momento, 5 * 60 + 20);
  const otorgado = masMinutos(aceptada, 2);
  const [solicitudId, alcanceId, consentimientoId, versionId] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  await insertar(tx, 'solicitud_de_vinculo', [{ id: solicitudId, profesional_id: proId, asesorado_id: aseId, alcance, finalidad, iniciador: 'PROFESIONAL', estado: 'PENDIENTE', version: 1, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento, vence_en: masMinutos(momento, 30 * 24 * 60) }]);
  await tx.$executeRawUnsafe(`UPDATE "solicitud_de_vinculo" SET "estado" = 'ACEPTADA', "version" = 2, "momento_de_resolucion" = $2 WHERE "id" = $1::uuid`, solicitudId, aceptada);
  let [vinculo] = await filas(tx, `SELECT "id"::text AS id FROM "vinculo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid`, proId, aseId);
  if (!vinculo) {
    vinculo = { id: randomUUID() };
    await insertar(tx, 'vinculo', [{ id: vinculo.id, profesional_id: proId, asesorado_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }]);
  }
  await insertar(tx, 'alcance_de_vinculo', [{ id: alcanceId, vinculo_id: vinculo.id, alcance, finalidad, solicitud_de_origen_id: solicitudId, estado: 'ACEPTADO', version: 1, procedencia: PROC, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }]);
  await insertar(tx, 'consentimiento', [{ id: consentimientoId, alcance_de_vinculo_id: alcanceId, finalidad, situacion: 'VIGENTE', version: 1, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }]);
  await insertar(tx, 'version_de_consentimiento', [{ id: versionId, consentimiento_id: consentimientoId, decision: 'OTORGAMIENTO', situacion_resultante: 'VIGENTE', version_de_texto_id: texto.id, hash_del_texto: texto.hash, alcance, finalidad, categorias: [], superficie: 'APK', actor_id: aseId, autoria_id: aseId, procedencia: PROC, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }]);
  const evento = (x) => ({ profesional_id: proId, asesorado_id: aseId, solicitud_de_vinculo_id: null, alcance_de_vinculo_id: null, consentimiento_id: null, version_de_consentimiento_id: null, estado_previo: null, procedencia: PROC, ...x });
  await insertar(tx, 'evento_de_vinculo', [
    evento({ tipo: 'SolicitudDeVinculoCreada', solicitud_de_vinculo_id: solicitudId, estado_posterior: 'PENDIENTE', actor_id: proId, momento_de_ocurrencia: momento, momento_de_registro: momento }),
    evento({ tipo: 'SolicitudDeVinculoAceptada', solicitud_de_vinculo_id: solicitudId, estado_previo: 'PENDIENTE', estado_posterior: 'ACEPTADA', actor_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }),
    evento({ tipo: 'AlcanceDeVinculoAceptado', solicitud_de_vinculo_id: solicitudId, alcance_de_vinculo_id: alcanceId, estado_posterior: 'ACEPTADO', actor_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }),
    evento({ tipo: 'ConsentimientoOtorgado', alcance_de_vinculo_id: alcanceId, consentimiento_id: consentimientoId, version_de_consentimiento_id: versionId, estado_posterior: 'VIGENTE', actor_id: aseId, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }),
  ]);
}

async function objetivoNutricionalEnElPasado(tx, { proId, aseId, contenido, momento }) {
  let [serie] = await filas(tx, `SELECT "id"::text AS id FROM "objetivo_nutricional" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid`, proId, aseId);
  if (serie) throw new Error('esa persona ya tiene un objetivo con este profesional');
  serie = { id: randomUUID() };
  await insertar(tx, 'objetivo_nutricional', [{ id: serie.id, profesional_id: proId, asesorado_id: aseId, momento_de_registro: momento }]);
  const id = randomUUID();
  await insertar(tx, 'version_de_objetivo_nutricional', [{ id, objetivo_id: serie.id, predecesora_id: null, evaluacion_id: contenido.evaluationId, vigente_desde: new Date(contenido.effectiveFrom), requerimiento_energetico: contenido.estimatedEnergyRequirement, distribucion_de_macronutrientes: contenido.macronutrientDistribution, distribucion_por_comida: contenido.mealDistribution, fundamento: contenido.rationale, revision_de_origen_id: null, autor_id: proId, procedencia: PROC, momento_de_registro: momento }]);
  await insertar(tx, 'evento_de_nutricion', [{ tipo: 'VersionDeObjetivoEmitida', profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'VersionDeObjetivoNutricional', recurso_id: id, actor_id: proId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
  return id;
}

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
const huella = (valor) => createHash('sha256').update(dominio.serializacionCanonica(valor)).digest('hex');

/** La activación de un borrador en el pasado: la misma instantánea (función del dominio) y los mismos hechos que la API. */
async function activarEnElPasado(versionId, momento, profesionalId, asesoradoId) {
  return en(async (tx) => {
    const [v] = await filas(tx, `SELECT "plan_id"::text AS "planId", "contenido", "estado"::text AS "estado" FROM "version_de_plan_nutricional" WHERE "id" = $1::uuid`, versionId);
    if (!v || v.estado !== 'BORRADOR') throw new Error(`la versión ${versionId} no es un borrador`);
    const ids = v.contenido.dayTypes.flatMap((x) => x.meals.flatMap((m) => m.options.flatMap((o) => o.items.map((i) => i.catalogItemId))));
    const instantanea = dominio.construirInstantanea(v.contenido, await catalogoNutricional(tx, profesionalId, ids));
    if (!instantanea) throw new Error(`sin instantánea para ${versionId}`);
    await insertar(tx, 'instantanea_de_plan_nutricional', [{ id: randomUUID(), version_de_plan_id: versionId, contenido: instantanea, huella: huella(instantanea) }]);
    await tx.$executeRawUnsafe(`UPDATE "version_de_plan_nutricional" SET "estado" = 'ACTIVADA', "version" = "version" + 1, "momento_de_activacion" = $2 WHERE "id" = $1::uuid`, versionId, momento);
    await insertar(tx, 'evento_de_nutricion', [{ tipo: 'VersionDePlanActivada', profesional_id: profesionalId, asesorado_id: asesoradoId, recurso_tipo: 'VersionDePlanNutricional', recurso_id: versionId, estado_previo: 'BORRADOR', estado_posterior: 'ACTIVADA', actor_id: profesionalId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
    await tx.$executeRawUnsafe(`UPDATE "plan_nutricional" SET "version_efectiva_id" = $2::uuid WHERE "id" = $1::uuid`, v.planId, versionId);
    const [abierto] = await filas(tx, `SELECT "id"::text AS "id" FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = 'NUTRICION'::"Alcance" AND "estado" = 'ABIERTO'`, profesionalId, asesoradoId);
    if (!abierto) {
      const procesoId = randomUUID();
      await insertar(tx, 'proceso_operativo', [{ id: procesoId, profesional_id: profesionalId, asesorado_id: asesoradoId, alcance: 'NUTRICION', version_de_apertura_id: versionId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
      await insertar(tx, 'evento_de_proceso', [{ tipo: 'ProcesoOperativoAbierto', proceso_id: procesoId, estado_posterior: 'ABIERTO', datos: { versionDeAperturaId: versionId, ocupacionProyectada: null }, actor_id: profesionalId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
    }
    return instantanea;
  });
}

/** El plan como borrador de la API: un día tipo, cada comida con sus opciones y los ítems en gramos. */
const estructuraNutricional = (plan) => ({
  dayTypes: [
    {
      label: DIA_TIPO,
      meals: plan.map(([comida, opciones]) => ({
        label: comida,
        prescriptionMode: 'DISH_OPTIONS',
        options: opciones.map(([rotulo, items]) => ({
          label: rotulo,
          items: items.map(([alimento, gramos, estado]) => ({ catalogItemId: ALIMENTOS[alimento].id, quantity: { value: gramos, unit: 'g' }, preparationState: estado })),
        })),
      })),
    },
  ],
});

/** La composición congelada en la instantánea, por alimento del catálogo (la entrada de esperado.mjs). */
function composicionDeLaInstantanea(instantanea) {
  const porId = Object.fromEntries(Object.entries(ALIMENTOS).map(([k, a]) => [a.id, k]));
  const salida = {};
  for (const o of instantanea.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options))) {
    for (const it of o.items) {
      const clave = porId[it.catalogItemId] ?? it.catalogItemId;
      const c = it.composition ?? {};
      salida[clave] = { referenceAmount: c.referenceAmount ?? null, energyKcal: c.energyKcal ?? null, proteinG: c.proteinG ?? null, carbohydrateG: c.carbohydrateG ?? null, fatG: c.fatG ?? null, fiberG: c.fiberG ?? null };
    }
  }
  return salida;
}

function cantidades(opcion, r) {
  if (r.sinCantidades) return { status: 'UNCONFIRMED', items: [] };
  if (r.porciones) return { status: 'PLAN_PORTIONS', items: opcion.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity, notEaten: false })) };
  if (r.gramos.length !== opcion.items.length) throw new Error(`la opción «${opcion.label}» tiene ${opcion.items.length} ítems y el registro trae ${r.gramos.length}`);
  return {
    status: 'REPORTED',
    items: opcion.items.map((it, i) => (r.gramos[i] === null ? { itemId: it.itemId, quantity: null, notEaten: true } : { itemId: it.itemId, quantity: { value: r.gramos[i], unit: it.quantity.unit }, notEaten: false })),
  };
}

async function comidasEnElPasado({ hoy, versionId, instantanea, proId, aseId, dias }) {
  const dia = instantanea.dayTypes[0];
  const ingestas = [];
  const eventos = [];
  for (const d of dias) {
    const fecha = diaMenos(hoy, d.hace);
    for (const [comidaRotulo, r] of Object.entries(d.comidas)) {
      const comida = dia.meals.find((m) => m.label === comidaRotulo);
      if (!comida) throw new Error(`el plan no tiene ${comidaRotulo}`);
      const ocurrio = instante(fecha, HORA_DE_LA_COMIDA[comidaRotulo]);
      const registrado = masMinutos(ocurrio, 12);
      const id = randomUUID();
      const comun = { id, version_de_plan_id: versionId, asesorado_id: aseId, fecha_local: fecha, zona_horaria: ZONA, secuencia: 0, procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado };
      if (r.diferente) {
        ingestas.push({ ...comun, origen: 'FUERA_DE_PRESCRIPCION', modo: 'DESCRIPCION_LIBRE', descripcion: r.diferente, descripcion_de_porcion: null, dia_tipo_de_contexto_id: dia.dayTypeId, comida_de_contexto_id: comida.mealId, dia_tipo_id: null, comida_id: null, opcion_id: null, cantidades_consumidas: null });
      } else {
        const opcion = comida.options[r.opcion];
        if (!opcion) throw new Error(`${comidaRotulo} no tiene la opción ${r.opcion}`);
        ingestas.push({ ...comun, origen: 'PRESCRIPTA', modo: 'OPCIONES_DE_PLATO', descripcion: null, descripcion_de_porcion: null, dia_tipo_de_contexto_id: null, comida_de_contexto_id: null, dia_tipo_id: dia.dayTypeId, comida_id: comida.mealId, opcion_id: opcion.optionId, cantidades_consumidas: cantidades(opcion, r) });
      }
      eventos.push({ tipo: 'IngestaRegistrada', profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'IngestaNutricional', recurso_id: id, actor_id: aseId, procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado });
    }
  }
  await en(async (tx) => {
    await insertar(tx, 'ingesta_nutricional', ingestas);
    await insertar(tx, 'evento_de_nutricion', eventos);
  });
  return ingestas.length;
}

const ESCENARIOS_DE_NUTRICION = [
  { prefijo: 'ASE_DOS', plan: PLAN_DOS, objetivo: OBJETIVO_DOS, comidas: COMIDAS_DOS, contexto: 'Primera consulta. Trabaja en una oficina y quiere ordenar sus comidas (persona sintética de la prueba breve).' },
  { prefijo: 'ASE_TRES', plan: PLAN_TRES, objetivo: OBJETIVO_TRES, comidas: COMIDAS_TRES, contexto: 'Primera consulta. Prefiere tener opciones para elegir según el día (persona sintética de la prueba breve).' },
];

async function pasado() {
  const e = leerEstado();
  const hoy = e.hoy ?? hoyCivil();
  if (hoy !== hoyCivil()) throw new Error(`la historia se empezó a cargar el ${hoy} y hoy es ${hoyCivil()}: los días relativos ya no coinciden`);
  guardarEstado({ hoy });
  const proId = idDe('PRO');
  for (const x of ESCENARIOS_DE_NUTRICION) {
    const aseId = idDe(x.prefijo);
    await paso(x.prefijo, 'vinculo-en-el-pasado', () =>
      en((tx) => vincularEnElPasado(tx, { proId, aseId, alcance: 'NUTRICION', tipo: PROFESIONAL.tipo, momento: instante(diaMenos(hoy, FECHAS.vinculo.hace), FECHAS.vinculo.hora) })),
    );
    const conEvaluacion = await paso(x.prefijo, 'evaluacion', async () => {
      const r = exigir(
        await web.crearEvaluacion(
          await sesionDe('PRO'),
          aseId,
          {
            occurredAt: instante(diaMenos(hoy, FECHAS.evaluacion.hace), FECHAS.evaluacion.hora).toISOString(),
            context: x.contexto,
            assessment: { entries: [{ concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' }] },
            evidenceReferences: [],
            professionalNotes: 'Notas sintéticas de la prueba breve.',
          },
          clave(),
        ),
        `evaluación de ${x.prefijo}`,
      );
      return { evaluacion: r.data.evaluationId };
    });
    const conObjetivo = await paso(x.prefijo, 'objetivo-en-el-pasado', async () => {
      const momento = instante(diaMenos(hoy, FECHAS.objetivo.hace), FECHAS.objetivo.hora);
      const o = x.objetivo;
      const contenido = {
        evaluationId: conEvaluacion.evaluacion,
        effectiveFrom: momento.toISOString(),
        effectiveUntil: null,
        estimatedEnergyRequirement: { value: o.kcal, unit: 'kcal/day' },
        macronutrientDistribution: { protein: { value: o.proteina, unit: 'g/day' }, carbohydrate: { value: o.carbohidratos, unit: 'g/day' }, fat: { value: o.grasas, unit: 'g/day' } },
        mealDistribution: 'Cuatro comidas.',
        rationale: o.fundamento,
        methodStatement: null,
      };
      return { objetivo: await en((tx) => objetivoNutricionalEnElPasado(tx, { proId, aseId, contenido, momento })) };
    });
    const conPlan = await paso(x.prefijo, 'borrador-del-plan', async () => {
      const r = exigir(await web.crearBorradorDePlan(await sesionDe('PRO'), aseId, { objectiveVersionId: conObjetivo.objetivo, initialStructure: estructuraNutricional(x.plan) }, clave()), `borrador del plan de ${x.prefijo}`);
      return { plan: r.data.planId };
    });
    await paso(x.prefijo, 'activacion-en-el-pasado', async () => {
      const instantanea = await activarEnElPasado(conPlan.plan, instante(diaMenos(hoy, FECHAS.activacion.hace), FECHAS.activacion.hora), proId, aseId);
      return { composicion: composicionDeLaInstantanea(instantanea) };
    });
    await paso(x.prefijo, 'comidas-en-el-pasado', async () => {
      const [fila] = await en((tx) => filas(tx, `SELECT "contenido" FROM "instantanea_de_plan_nutricional" WHERE "version_de_plan_id" = $1::uuid`, conPlan.plan));
      const n = await comidasEnElPasado({ hoy, versionId: conPlan.plan, instantanea: fila.contenido, proId, aseId, dias: x.comidas });
      return { comidas: n };
    });
  }
}

// ─── Fase «verificar»: solo lectura ────────────────────────────────────────────────────────────────────────────

const NUTRIENTE = { ENERGY: ['energyKcal', 0], PROTEIN: ['proteinG', 1] };
const iguales = (a, b) => Math.abs(a - b) < 1e-9;

/** Compara la proyección de la API con lo calculado aparte. Devuelve las diferencias (vacío si coincide todo). */
function compararNutricion(x, hoy, composicion, r, metrica) {
  const [nutriente, decimales] = NUTRIENTE[metrica];
  const dif = [];
  const filas = [];
  const desde = diaMenos(hoy, FECHAS.activacion.hace);
  // El objetivo: un escalón desde el día del objetivo, con la cantidad que fijó el profesional.
  const esperadoDelObjetivo = metrica === 'ENERGY' ? x.objetivo.kcal : x.objetivo.proteina;
  const escalones = r.prescribed.objectiveSteps;
  if (escalones.length !== 1 || escalones[0].amount?.value !== esperadoDelObjetivo || escalones[0].from !== diaMenos(hoy, FECHAS.objetivo.hace)) dif.push(`objetivo: se esperaba un escalón de ${esperadoDelObjetivo} desde ${diaMenos(hoy, FECHAS.objetivo.hace)} y llegó ${JSON.stringify(escalones)}`);
  // Lo indicado de cada día, desde la activación hasta hoy.
  const delDiaEsperado = esperado.delDia(x.plan, composicion, nutriente);
  for (let k = FECHAS.activacion.hace; k >= 0; k--) {
    const fecha = diaMenos(hoy, k);
    const d = r.prescribed.planned.days.find((y) => y.date === fecha);
    if (!d) {
      dif.push(`${fecha}: falta el indicado del día`);
      continue;
    }
    if (delDiaEsperado.state !== d.state) dif.push(`${fecha}: indicado ${d.state}, se esperaba ${delDiaEsperado.state}`);
    else if (d.state === 'DETERMINED' && !iguales(d.value, Number(esperado.exacto(delDiaEsperado.value)))) dif.push(`${fecha}: indicado ${d.value}, se esperaba ${esperado.exacto(delDiaEsperado.value)}`);
    else if (d.state === 'UNDETERMINED' && (d.reason !== delDiaEsperado.reason || JSON.stringify(d.mealsWithSeveralOptions) !== JSON.stringify(delDiaEsperado.mealsWithSeveralOptions))) dif.push(`${fecha}: motivo ${d.reason} ${JSON.stringify(d.mealsWithSeveralOptions)}, se esperaba ${delDiaEsperado.reason} ${JSON.stringify(delDiaEsperado.mealsWithSeveralOptions)}`);
    // Lo registrado del día.
    const dia = x.comidas.find((y) => y.hace === k);
    const punto = r.recorded.points.find((p) => p.date === fecha);
    let registrado = 'hueco';
    if (dia) {
      const e = esperado.registradoDelDia(x.plan, dia, composicion, nutriente);
      registrado = `${esperado.paraMostrar(e.total, decimales)}${e.completo ? '' : ' (subtotal)'}`;
      if (!punto) dif.push(`${fecha}: falta el punto registrado`);
      else {
        if (!iguales(punto.value, Number(esperado.exacto(e.total)))) dif.push(`${fecha}: registrado ${punto.value}, se esperaba ${esperado.exacto(e.total)}`);
        const calidad = e.completo ? 'COMPLETE' : 'PARTIAL';
        if (punto.quality !== calidad) dif.push(`${fecha}: calidad ${punto.quality}, se esperaba ${calidad}`);
      }
    } else if (punto && punto.n > 0) dif.push(`${fecha}: se esperaba un hueco y hay un punto con ${punto.n} registros`);
    filas.push(`    ${fecha} · indicado ${d.state === 'DETERMINED' ? `${esperado.paraMostrar(delDiaEsperado.value, decimales)} (API ${d.value})` : `sin indicado (${d.reason})`} · registrado ${registrado}${punto ? ` (API ${punto.value ?? '—'} ${punto.quality})` : ''}`);
  }
  // Lo indicado de cada comida registrada: el mismo conjunto de valores, y las comidas diferentes sin indicado.
  const deLasComidas = x.comidas.flatMap((dia) => Object.entries(dia.comidas).map(([comida, reg]) => esperado.indicadoDeLaComida(x.plan, comida, reg, composicion, nutriente)));
  const esperados = deLasComidas.filter((v) => v !== null).map((v) => Number(esperado.exacto(v))).sort((a, b) => a - b);
  const llegaron = r.prescribed.planned.meals.filter((m) => m.state === 'DETERMINED').map((m) => m.value).sort((a, b) => a - b);
  if (esperados.length !== llegaron.length || esperados.some((v, i) => !iguales(v, llegaron[i]))) dif.push(`indicado por comida: se esperaban ${JSON.stringify(esperados)} y llegaron ${JSON.stringify(llegaron)}`);
  const diferentes = deLasComidas.filter((v) => v === null).length;
  const sinIndicado = r.prescribed.planned.meals.filter((m) => m.state === 'UNDETERMINED');
  if (sinIndicado.length !== diferentes || sinIndicado.some((m) => m.reason !== 'DIFFERENT_MEAL')) dif.push(`comidas sin indicado: se esperaban ${diferentes} comidas diferentes y llegaron ${JSON.stringify(sinIndicado.map((m) => m.reason))}`);
  console.log(`  ${x.prefijo} · ${metrica} desde ${desde}:\n${filas.join('\n')}`);
  return dif;
}

async function verificar() {
  const e = leerEstado();
  const hoy = hoyCivil();
  const pro = await sesionDe('PRO');
  const informe = { fecha: new Date().toISOString(), hoy, diferencias: [] };
  // La cartera del profesional: quién está y con qué.
  const cartera = exigir(await web.consultarCartera(pro), 'cartera del profesional').data;
  informe.cartera = cartera;
  console.log(`cartera: ${JSON.stringify(cartera).length} caracteres (en informe.json)`);
  // Nutrición: Dos y Tres, si ya se cargó la historia.
  if (e.hoy && e.hoy !== hoy) console.log(`  (la historia es del ${e.hoy}: los días relativos se cuentan desde ahí)`);
  const base = e.hoy ?? hoy;
  for (const x of ESCENARIOS_DE_NUTRICION) {
    const p = e.personas?.[x.prefijo];
    if (!p?.composicion) {
      console.log(`  ${x.prefijo}: sin la historia de Nutrición todavía`);
      continue;
    }
    for (const metrica of ['ENERGY', 'PROTEIN']) {
      const r = exigir(await web.proyeccion(pro, idDe(x.prefijo), 'NUTRITION_PRESCRIBED_VS_RECORDED', { metric: metrica, periodStart: diaMenos(base, FECHAS.activacion.hace), periodEnd: hoy, grain: 'DAY' }), `comparación de ${x.prefijo}`).data.result;
      const dif = compararNutricion(x, base, p.composicion, r, metrica);
      informe.diferencias.push(...dif.map((d) => `${x.prefijo} ${metrica}: ${d}`));
    }
  }
  // Entrenamiento: lo que ve Uno en el teléfono y la búsqueda de la sustitución.
  if (e.personas?.ASE_UNO?.planDeEntrenamiento) {
    const uno = await sesionDe('ASE_UNO');
    const hoyTrn = exigir(await apk.hoyDeEntrenamiento(uno), 'hoy de Entrenamiento de Uno').data;
    informe.entrenamientoDeHoy = hoyTrn;
    const busqueda = exigir(await apk.buscarEjercicios(uno, 'press'), 'búsqueda de Uno').data;
    informe.busqueda = busqueda;
    console.log(`  ASE_UNO · hoy: ${JSON.stringify(hoyTrn).slice(0, 300)}`);
    console.log(`  ASE_UNO · «press»: ${busqueda.length} resultados: ${busqueda.map((b) => b.name ?? b.exercise?.name ?? JSON.stringify(b).slice(0, 40)).join(' · ')}`);
  }
  // Cuatro y Cinco: el profesional no tiene acceso a su Nutrición.
  for (const prefijo of ['ASE_CUATRO', 'ASE_CINCO']) {
    if (!e.personas?.[prefijo]?.hecho?.some((h) => h === 'revocacion' || h === 'finalizacion')) continue;
    const r = await web.proyeccion(pro, idDe(prefijo), 'NUTRITION_PRESCRIBED_VS_RECORDED', { metric: 'ENERGY', periodStart: diaMenos(hoy, 7), periodEnd: hoy, grain: 'DAY' });
    const que = r.ok ? 'CON ACCESO (no debería)' : `${r.status} ${r.codigo}`;
    console.log(`  ${prefijo} · comparación pedida por el profesional: ${que}`);
    if (r.ok) informe.diferencias.push(`${prefijo}: el profesional lee su Nutrición`);
    informe[prefijo] = que;
  }
  // Lo que la comprobación en pantalla espera leer (los números, con el redondeo de la pantalla y calculados aparte).
  if (e.personas?.ASE_DOS?.composicion && e.personas?.ASE_TRES?.composicion) {
    const [dos, tres] = ESCENARIOS_DE_NUTRICION;
    const kcal = (v) => `${esperado.paraMostrar(v, 0)} kcal`;
    const indicadoDe = (x, comp, hace) =>
      Object.entries(x.comidas.find((d) => d.hace === hace).comidas)
        .map(([comida, reg]) => esperado.indicadoDeLaComida(x.plan, comida, reg, comp, 'energyKcal'))
        .filter((v) => v !== null)
        .map((v) => `Indicado en el plan: ${kcal(v)}`);
    const enPantalla = {
      desde: diaMenos(base, FECHAS.activacion.hace),
      hasta: hoy,
      casos: [
        {
          prefijo: dos.prefijo,
          persona: 'Prueba Dos',
          dia: diaMenos(base, 2),
          rombos: (Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${diaMenos(base, FECHAS.activacion.hace)}T12:00:00Z`)) / 86_400_000 + 1,
          enLaLectura: 'Hay indicado del día solo si el plan no deja elegir: una sola opción en cada comida. BE no elige entre alternativas, no las suma ni las promedia.',
          comidas: Object.keys(dos.comidas.find((d) => d.hace === 2).comidas).length,
          enElOrigen: [...new Set(indicadoDe(dos, e.personas.ASE_DOS.composicion, 2))],
        },
        {
          prefijo: tres.prefijo,
          persona: 'Prueba Tres',
          dia: diaMenos(base, 3),
          rombos: 0,
          nota: 'Sin indicado del día: Desayuno tiene 2 opciones; Almuerzo tiene 3 opciones; Cena tiene 2 opciones. BE no elige entre ellas ni las suma.',
          enLaLectura: 'Sin indicado del día: Desayuno tiene 2 opciones; Almuerzo tiene 3 opciones; Cena tiene 2 opciones. BE no elige entre ellas ni las suma.',
          comidas: Object.keys(tres.comidas.find((d) => d.hace === 3).comidas).length,
          enElOrigen: [...new Set(indicadoDe(tres, e.personas.ASE_TRES.composicion, 3)), 'Comida diferente: no es una opción del plan y no tiene indicado.'],
        },
      ],
    };
    fs.writeFileSync(join(CARPETA, 'esperado-en-pantalla.json'), JSON.stringify(enPantalla, null, 2));
  }
  fs.writeFileSync(join(CARPETA, 'informe.json'), JSON.stringify(informe, null, 2));
  console.log(informe.diferencias.length === 0 ? 'SIN DIFERENCIAS con lo esperado' : `DIFERENCIAS (${informe.diferencias.length}):\n${informe.diferencias.map((d) => `  - ${d}`).join('\n')}`);
}

const FASES = { cuentas, api, pasado, verificar };
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fase = process.argv[2];
  if (!FASES[fase]) throw new Error(`Fase desconocida «${fase}». Fases: ${Object.keys(FASES).join(', ')}.`);
  try {
    await FASES[fase]();
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}
