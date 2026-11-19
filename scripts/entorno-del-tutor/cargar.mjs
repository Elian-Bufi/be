// WP-ENTORNO-DEL-TUTOR (DL-184) · la carga de la muestra del tutor. Primero arma la historia entera como datos y la
// verifica (REQ-TUT-60): con una sola falla, no carga nada. Después la carga por el mismo camino que la cohorte de #161
// (TUT-D04): lo de hoy por la API pública, como un cliente más; lo del pasado por SQL, con los disparadores activos, cada
// estado naciendo como en la API y cada transición con su hecho en la misma transacción. Nunca SQL a mano: cada fila sale
// de la historia generada.
//
// Comandos:
//   armar     arma la muestra de cero en una base que no la tiene, o completa lo que falte de la misma generación.
//             --origen AAAA-MM-DD (por omisión, hoy en Buenos Aires).
//   al-dia    agrega los días que faltan desde el origen hasta hoy, sin duplicar (lee el origen de la base).
//   comprobar el chequeo después de cargar (REQ-TUT-74, en parte): conteos por persona contra la historia, por la base y
//             por la API con la cuenta de la profesional.
//   resumen   cuenta lo cargado de cada persona.
//   credenciales  muestra en la terminal el correo y la contraseña de la profesional y de Carolina (solo BE_TUTOR_CLAVE).
// Opciones: --generacion N (por omisión, 1). Una generación nueva son cuentas nuevas: es la forma de «correr las fechas a
// hoy» sin borrar nada, porque la base de BE es de historia por adición (TUT-D05).
//
// Variables de entorno (nunca en el repositorio):
//   BE_TUTOR_DESTINO      local | test.
//   BE_TUTOR_API          la URL de la API (en local, http://localhost:3001).
//   BE_TUTOR_BASE         la URL de PostgreSQL. En local, una base be_test_* de localhost; en test, la de Render.
//   BE_TUTOR_CLAVE        un secreto de 24 caracteres o más del que salen las contraseñas de las cuentas de la muestra
//                         (HMAC por correo): las mismas en cada corrida, sin guardarlas en ningún lado.
//   BE_TUTOR_CONFIRMO_TEST=si   obligatoria con BE_TUTOR_DESTINO=test.
//
// Lo que nunca hace: tocar una fila que no creó. Toda escritura va a cuentas de la muestra (correos tutor-gN.*@example.
// invalid) o a filas con la procedencia SIEMBRA-TUTOR; cada UPDATE lleva el id de una fila suya.
import { createHash, createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { REPO, ALIMENTO, ejercicio } from './catalogo.mjs';
import { uuidV5 } from '../catalogo-base/sql.mjs';
import { generar, estructuraDeEntrenamiento, estructuraNutricional, hoyEnBuenosAires, planNutricionalDe, diasEntre, ZONA } from './historia.mjs';
import { verificar } from './reglas.mjs';
import { verificarMatriz } from './matriz.mjs';
import { CASO_DE_USO, COLEGAS, DOMINIO_DE_CORREO, OPERACION, PERSONAS, PROFESIONAL } from './personas.mjs';
import { COORDINACION } from './textos.mjs';
import { HERRAMIENTAS } from './herramientas.mjs';
import { extras } from './extras.mjs';
import { destinoDesde, generacionDesde, opcionesDesde } from './guardias.mjs';
import { asegurarBorrador } from './borradores.mjs';
import { METODOS } from '../../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/personas.mjs';
import { masMinutos, instante } from '../../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/herramientas.mjs';

const dominio = createRequire(path.join(REPO, 'packages/domain/'))(path.join(REPO, 'packages/domain/dist/index.js'));

// ─── Argumentos y guardias ────────────────────────────────────────────────────────────────────────────────────

const [comando, ...resto] = process.argv.slice(2);
const opciones = opcionesDesde(resto);
const GENERACION = generacionDesde(opciones.generacion);
const PROC = { fuente: 'PROPIA', casoDeUso: CASO_DE_USO, operacion: OPERACION, superficie: null, requestId: null };
const PROTOCOLO = '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f10';
const ESPACIO = uuidV5('be.wp-entorno-del-tutor', '6ba7b811-9dad-11d1-80b4-00c04fd430c8');
/** El id de una fila de la muestra: estable por generación y por clave (REQ-TUT-62). */
const id = (clave) => uuidV5(`g${GENERACION}|${clave}`, ESPACIO);
const idCliente = (clave) => `t${createHash('sha256').update(`g${GENERACION}|${clave}`).digest('hex').slice(0, 30)}`;

/** Las guardias (guardias.mjs): la base y la API del mismo ambiente, la confirmación de test y el secreto. */
const destino = () => destinoDesde(process.env);

// ─── La API ───────────────────────────────────────────────────────────────────────────────────────────────────

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let D;
async function pedir(metodo, ruta, { token, cuerpo, superficie = 'WEB', esperado, clave, capacidades } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': superficie };
  if (capacidades) headers[dominio.HEADER_DE_CAPACIDADES] = capacidades;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clave !== false && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo)) headers['Idempotency-Key'] = clave ?? idCliente(`${metodo}|${ruta}|${JSON.stringify(cuerpo ?? null)}`);
  const esperados = esperado ? [esperado].flat() : [200, 201, 204];
  for (let intento = 1; ; intento++) {
    let r;
    try {
      r = await fetch(`${D.api}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    } catch (e) {
      if (intento >= 5) throw e;
      await espera(2000 * intento);
      continue;
    }
    const texto = await r.text();
    if (r.status === 429 && intento < 8) {
      await espera(Number(r.headers.get('retry-after') ?? 15) * 1000 + 500);
      continue;
    }
    if (r.status >= 502 && r.status <= 504 && intento < 5) {
      await espera(3000 * intento);
      continue;
    }
    if (!esperados.includes(r.status)) throw new Error(`${metodo} ${ruta}: ${r.status} ${texto.slice(0, 600)}`);
    return { status: r.status, ...(texto ? JSON.parse(texto) : {}) };
  }
}

/** La contraseña de una cuenta de la muestra: sale del secreto y del correo, y no se guarda en ningún lado. */
const claveDe = (correo) => `Be-${createHmac('sha256', D.clave).update(correo).digest('base64url').slice(0, 26)}`;
const correoDe = (clave) => `tutor-g${GENERACION}.${clave}@${DOMINIO_DE_CORREO}`;
const sesiones = new Map();
async function sesion(clave, superficie = 'WEB') {
  const k = `${clave}|${superficie}`;
  if (!sesiones.has(k)) {
    const correo = correoDe(clave);
    const r = await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: claveDe(correo) }, superficie, clave: false });
    sesiones.set(k, r.data.session.accessToken);
  }
  return sesiones.get(k);
}

/** Crea la cuenta si no existe (la entrada con su contraseña dice si existe) y devuelve su identidad. */
async function cuenta(clave, intencion, nombre) {
  const correo = correoDe(clave);
  const superficie = intencion === 'PROFESSIONAL' ? 'WEB' : 'APK';
  const intento = await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: claveDe(correo) }, superficie, clave: false, esperado: [200, 201, 401] });
  if (intento.status === 401) {
    await pedir('POST', '/registrations', {
      superficie,
      cuerpo: {
        registrationIntent: intencion,
        identity: { localIdentifier: correo, localCredential: claveDe(correo) },
        profile: { displayName: nombre },
        termsAcceptance: { versionId: dominio.VERSION_VIGENTE.TERMINOS.id },
        privacyAcknowledgement: { versionId: dominio.VERSION_VIGENTE.PRIVACIDAD_INFO.id },
        adultDeclaration: { versionId: dominio.VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
      },
    });
  }
  // La entrada que ya sirvió se reusa: cada cuenta entra una sola vez por corrida (el límite de intentos de la API).
  if (intento.status !== 401) sesiones.set(`${clave}|${superficie}`, intento.data.session.accessToken);
  const token = await sesion(clave, superficie);
  const yo = await pedir('GET', '/me', { token, superficie });
  return yo.data.identityId;
}

// ─── La base ──────────────────────────────────────────────────────────────────────────────────────────────────

let prisma;
const base = () => {
  if (!prisma) {
    const { PrismaClient } = createRequire(path.join(REPO, 'apps/api/'))('@prisma/client');
    prisma = new PrismaClient({ datasources: { db: { url: D.base } } });
  }
  return prisma;
};
const en = (fn) => base().$transaction(fn, { timeout: 900_000, maxWait: 60_000 });
const filas = (tx, texto, ...valores) => tx.$queryRawUnsafe(texto, ...valores);
const tipos = new Map();
async function columnas(tx, tabla) {
  if (!tipos.has(tabla)) {
    const r = await filas(tx, `SELECT column_name AS c, udt_name AS t FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, tabla);
    if (!r.length) throw new Error(`no existe la tabla ${tabla}`);
    tipos.set(tabla, Object.fromEntries(r.map((x) => [x.c, x.t])));
  }
  return tipos.get(tabla);
}
const NATIVOS = new Set(['uuid', 'date', 'jsonb', 'timestamptz', 'int4', 'int8', 'numeric', 'text', 'bool', 'float8']);

/** Inserta filas en lotes. Con `soloNuevas`, saltea las que ya existen por su clave (`id` o la que se diga). */
async function insertar(tx, tabla, lista, { tam = 250, soloNuevas = true, clave = 'id' } = {}) {
  if (!lista.length) return 0;
  const t = await columnas(tx, tabla);
  let nuevas = lista;
  if (soloNuevas && t[clave]) {
    const ids = lista.map((f) => f[clave]).filter(Boolean);
    const existentes = new Set();
    for (let i = 0; i < ids.length; i += 2000) {
      for (const f of await filas(tx, `SELECT "${clave}"::text AS k FROM "${tabla}" WHERE "${clave}" = ANY($1::uuid[])`, ids.slice(i, i + 2000))) existentes.add(f.k);
    }
    nuevas = lista.filter((f) => !f[clave] || !existentes.has(f[clave]));
  }
  if (!nuevas.length) return 0;
  const cols = Object.keys(nuevas[0]);
  for (const c of cols) if (!t[c]) throw new Error(`${tabla} no tiene la columna ${c}`);
  for (let i = 0; i < nuevas.length; i += tam) {
    const valores = [];
    const tuplas = nuevas.slice(i, i + tam).map(
      (f) =>
        `(${cols
          .map((c) => {
            const v = f[c];
            valores.push(v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v);
            return `$${valores.length}::${NATIVOS.has(t[c]) ? t[c] : `"${t[c]}"`}`;
          })
          .join(',')})`,
    );
    await tx.$executeRawUnsafe(`INSERT INTO "${tabla}" (${cols.map((c) => `"${c}"`).join(',')}) VALUES ${tuplas.join(',')}`, ...valores);
  }
  return nuevas.length;
}
const existe = async (tx, tabla, x) => (await filas(tx, `SELECT 1 FROM "${tabla}" WHERE "id" = $1::uuid`, x)).length > 0;

// ─── Vínculos, objetivos, planes y revisiones en el pasado (como la cohorte de #161) ──────────────────────────

const PROFESIONALES = { J: PROFESIONAL, NY: COLEGAS.nutricionista, EI: COLEGAS.entrenadorAnterior };
const tipoDe = (pro, alcance) => pro.alcances.find(([a]) => a === alcance)[1];

async function vincularEnElPasado(tx, { pro, proId, aseId, alcance, momento, clave }) {
  const solicitudId = id(`${clave}|solicitud|${alcance}`);
  if (await existe(tx, 'solicitud_de_vinculo', solicitudId)) return false;
  const finalidad = dominio.FINALIDAD_DE_ALCANCE[alcance];
  // El texto de B2 es el del perfil del profesional (uno solo por identidad), como lo exige la base (08 §12.3).
  const [perfil] = await filas(tx, `SELECT "tipo"::text AS tipo FROM "perfil_profesional" WHERE "identidad_id" = $1::uuid`, proId);
  const texto = dominio.VERSION_VIGENTE[(perfil?.tipo ?? tipoDe(pro, alcance)) === 'SANITARIO' ? 'CONSENTIMIENTO_PROFESIONAL_SANITARIO' : 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO'];
  const aceptada = masMinutos(momento, 5 * 60 + 20);
  const otorgado = masMinutos(aceptada, 2);
  const alcanceId = id(`${clave}|alcance|${alcance}`);
  const consentimientoId = id(`${clave}|consentimiento|${alcance}`);
  const versionId = id(`${clave}|version-consentimiento|${alcance}`);
  await insertar(tx, 'solicitud_de_vinculo', [{ id: solicitudId, profesional_id: proId, asesorado_id: aseId, alcance, finalidad, iniciador: 'PROFESIONAL', estado: 'PENDIENTE', version: 1, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento, vence_en: masMinutos(momento, 30 * 24 * 60) }]);
  await tx.$executeRawUnsafe(`UPDATE "solicitud_de_vinculo" SET "estado" = 'ACEPTADA', "version" = 2, "momento_de_resolucion" = $2 WHERE "id" = $1::uuid`, solicitudId, aceptada);
  let [vinculo] = await filas(tx, `SELECT "id"::text AS id FROM "vinculo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid`, proId, aseId);
  if (!vinculo) {
    vinculo = { id: id(`${clave}|vinculo|${proId}`) };
    await insertar(tx, 'vinculo', [{ id: vinculo.id, profesional_id: proId, asesorado_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }]);
  }
  await insertar(tx, 'alcance_de_vinculo', [{ id: alcanceId, vinculo_id: vinculo.id, alcance, finalidad, solicitud_de_origen_id: solicitudId, estado: 'ACEPTADO', version: 1, procedencia: PROC, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }]);
  await insertar(tx, 'consentimiento', [{ id: consentimientoId, alcance_de_vinculo_id: alcanceId, finalidad, situacion: 'VIGENTE', version: 1, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }]);
  await insertar(tx, 'version_de_consentimiento', [{ id: versionId, consentimiento_id: consentimientoId, decision: 'OTORGAMIENTO', situacion_resultante: 'VIGENTE', version_de_texto_id: texto.id, hash_del_texto: texto.hash, alcance, finalidad, categorias: [], superficie: 'APK', actor_id: aseId, autoria_id: aseId, procedencia: PROC, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }]);
  const ev = (x) => ({ profesional_id: proId, asesorado_id: aseId, solicitud_de_vinculo_id: null, alcance_de_vinculo_id: null, consentimiento_id: null, version_de_consentimiento_id: null, estado_previo: null, procedencia: PROC, ...x });
  await insertar(
    tx,
    'evento_de_vinculo',
    [
      ev({ tipo: 'SolicitudDeVinculoCreada', solicitud_de_vinculo_id: solicitudId, estado_posterior: 'PENDIENTE', actor_id: proId, momento_de_ocurrencia: momento, momento_de_registro: momento }),
      ev({ tipo: 'SolicitudDeVinculoAceptada', solicitud_de_vinculo_id: solicitudId, estado_previo: 'PENDIENTE', estado_posterior: 'ACEPTADA', actor_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }),
      ev({ tipo: 'AlcanceDeVinculoAceptado', solicitud_de_vinculo_id: solicitudId, alcance_de_vinculo_id: alcanceId, estado_posterior: 'ACEPTADO', actor_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }),
      ev({ tipo: 'ConsentimientoOtorgado', alcance_de_vinculo_id: alcanceId, consentimiento_id: consentimientoId, version_de_consentimiento_id: versionId, estado_posterior: 'VIGENTE', actor_id: aseId, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }),
    ],
    { soloNuevas: false },
  );
  return true;
}

/** El fin de un componente de vínculo en el pasado: su transición con su hecho y el cierre del seguimiento abierto. */
async function finalizarEnElPasado(tx, { proId, aseId, alcance, momento, clave, motivo }) {
  const alcanceId = id(`${clave}|alcance|${alcance}`);
  const [c] = await filas(tx, `SELECT "estado"::text AS estado, "version" FROM "alcance_de_vinculo" WHERE "id" = $1::uuid`, alcanceId);
  if (!c || c.estado === 'FINALIZADO') return;
  const cols = await columnas(tx, 'alcance_de_vinculo');
  await tx.$executeRawUnsafe(`UPDATE "alcance_de_vinculo" SET "estado" = 'FINALIZADO', "version" = "version" + 1${cols.motivo_de_ultima_transicion ? `, "motivo_de_ultima_transicion" = '${motivo}'` : ''} WHERE "id" = $1::uuid`, alcanceId);
  const colsEv = await columnas(tx, 'evento_de_vinculo');
  await insertar(tx, 'evento_de_vinculo', [{ tipo: 'AlcanceDeVinculoFinalizado', profesional_id: proId, asesorado_id: aseId, alcance_de_vinculo_id: alcanceId, estado_previo: 'ACEPTADO', estado_posterior: 'FINALIZADO', ...(colsEv.motivo ? { motivo } : {}), actor_id: aseId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }], { soloNuevas: false });
  const [proceso] = await filas(tx, `SELECT "id"::text AS id FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = $3::"Alcance" AND "estado" = 'ABIERTO'`, proId, aseId, alcance);
  if (proceso) {
    await tx.$executeRawUnsafe(`UPDATE "proceso_operativo" SET "estado" = 'CERRADO', "version" = "version" + 1, "motivo_de_cierre" = 'FINALIZACION_DE_VINCULO', "momento_de_cierre" = $2 WHERE "id" = $1::uuid`, proceso.id, momento);
    await insertar(tx, 'evento_de_proceso', [{ tipo: 'ProcesoOperativoCerrado', proceso_id: proceso.id, estado_previo: 'ABIERTO', estado_posterior: 'CERRADO', datos: { motivo: 'FINALIZACION_DE_VINCULO' }, actor_id: null, actor_servicio: 'SISTEMA', procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }], { soloNuevas: false });
  }
}

const T = {
  NUTRICION: { version: 'version_de_plan_nutricional', instantanea: 'instantanea_de_plan_nutricional', plan: 'plan_nutricional', evento: 'evento_de_nutricion', tipo: 'VersionDePlanActivada', recurso: 'VersionDePlanNutricional', apertura: 'version_de_apertura_id', revision: 'revision_nutricional', aplicacion: 'aplicacion_de_revision', eventoRev: 'RevisionRegistrada', recursoRev: 'RevisionNutricional', ruta: 'nutrition' },
  ENTRENAMIENTO: { version: 'version_de_plan_de_entrenamiento', instantanea: 'instantanea_de_plan_de_entrenamiento', plan: 'plan_de_entrenamiento', evento: 'evento_de_entrenamiento', tipo: 'VersionDePlanDeEntrenamientoActivada', recurso: 'VersionDePlanDeEntrenamiento', apertura: 'version_de_apertura_entrenamiento_id', revision: 'revision_de_entrenamiento', aplicacion: 'aplicacion_de_revision_de_entrenamiento', eventoRev: 'RevisionDeEntrenamientoRegistrada', recursoRev: 'RevisionDeEntrenamiento', ruta: 'training' },
};
const huella = (valor) => createHash('sha256').update(dominio.serializacionCanonica(valor)).digest('hex');

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
async function catalogoDeEjercicios(tx, versionIds) {
  const r = await filas(tx, `SELECT v."id"::text AS "id", v."ejercicio_id"::text AS "ejercicioId", v."nombre", (v."disponibilidad" = 'DISPONIBLE') AS "disponible" FROM "version_de_ejercicio" v WHERE v."id" = ANY($1::uuid[])`, versionIds);
  return new Map(r.map((f) => [f.id, { ejercicioId: f.ejercicioId, nombre: f.nombre, disponible: f.disponible }]));
}
const idsDeCatalogo = (c) => c.dayTypes.flatMap((x) => x.meals.flatMap((m) => m.options.flatMap((o) => o.items.map((i) => i.catalogItemId))));

async function activarEnElPasado(area, versionId, momento, proId, aseId) {
  const t = T[area];
  return en(async (tx) => {
    const [v] = await filas(tx, `SELECT "plan_id"::text AS "planId", "contenido", "estado"::text AS "estado" FROM "${t.version}" WHERE "id" = $1::uuid`, versionId);
    if (v.estado === 'ACTIVADA') return;
    const inst = area === 'NUTRICION' ? dominio.construirInstantanea(v.contenido, await catalogoNutricional(tx, proId, idsDeCatalogo(v.contenido))) : dominio.construirInstantaneaDeEntrenamiento(v.contenido, await catalogoDeEjercicios(tx, dominio.referenciasDeEjercicio(v.contenido)));
    if (!inst) throw new Error(`sin instantánea para ${versionId}`);
    await insertar(tx, t.instantanea, [{ id: id(`instantanea|${versionId}`), version_de_plan_id: versionId, contenido: inst, huella: huella(inst) }]);
    await tx.$executeRawUnsafe(`UPDATE "${t.version}" SET "estado" = 'ACTIVADA', "version" = "version" + 1, "momento_de_activacion" = $2 WHERE "id" = $1::uuid`, versionId, momento);
    await insertar(tx, t.evento, [{ tipo: t.tipo, profesional_id: proId, asesorado_id: aseId, recurso_tipo: t.recurso, recurso_id: versionId, estado_previo: 'BORRADOR', estado_posterior: 'ACTIVADA', actor_id: proId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }], { soloNuevas: false });
    await tx.$executeRawUnsafe(`UPDATE "${t.plan}" SET "version_efectiva_id" = $2::uuid WHERE "id" = $1::uuid`, v.planId, versionId);
    const [abierto] = await filas(tx, `SELECT "id"::text AS "id" FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = $3::"Alcance" AND "estado" = 'ABIERTO'`, proId, aseId, area);
    if (!abierto) {
      const procesoId = id(`proceso|${proId}|${aseId}|${area}`);
      await insertar(tx, 'proceso_operativo', [{ id: procesoId, profesional_id: proId, asesorado_id: aseId, alcance: area, [t.apertura]: versionId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
      await insertar(tx, 'evento_de_proceso', [{ tipo: 'ProcesoOperativoAbierto', proceso_id: procesoId, estado_posterior: 'ABIERTO', datos: { versionDeAperturaId: versionId, ocupacionProyectada: null }, actor_id: proId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }], { soloNuevas: false });
    }
  });
}

async function objetivoNutricional(tx, { clave, proId, aseId, contenido, momento, revisionId }) {
  const vid = id(`${clave}|objetivo-nut`);
  if (await existe(tx, 'version_de_objetivo_nutricional', vid)) return vid;
  let [serie] = await filas(tx, `SELECT "id"::text AS id FROM "objetivo_nutricional" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid`, proId, aseId);
  let predecesora = null;
  if (!serie) {
    serie = { id: id(`${clave}|serie-objetivo-nut`) };
    await insertar(tx, 'objetivo_nutricional', [{ id: serie.id, profesional_id: proId, asesorado_id: aseId, momento_de_registro: momento }]);
  } else {
    [predecesora] = await filas(tx, `SELECT v."id"::text AS id FROM "version_de_objetivo_nutricional" v WHERE v."objetivo_id" = $1::uuid AND NOT EXISTS (SELECT 1 FROM "version_de_objetivo_nutricional" s WHERE s."predecesora_id" = v."id")`, serie.id);
  }
  await insertar(tx, 'version_de_objetivo_nutricional', [{ id: vid, objetivo_id: serie.id, predecesora_id: predecesora?.id ?? null, evaluacion_id: contenido.evaluationId, vigente_desde: new Date(contenido.effectiveFrom), requerimiento_energetico: contenido.estimatedEnergyRequirement, distribucion_de_macronutrientes: contenido.macronutrientDistribution, distribucion_por_comida: contenido.mealDistribution, fundamento: contenido.rationale, revision_de_origen_id: revisionId ?? null, autor_id: proId, procedencia: PROC, momento_de_registro: momento }]);
  await insertar(tx, 'evento_de_nutricion', [{ tipo: 'VersionDeObjetivoEmitida', profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'VersionDeObjetivoNutricional', recurso_id: vid, actor_id: proId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }], { soloNuevas: false });
  return vid;
}

async function objetivoDeEntrenamiento(tx, { clave, proId, aseId, evaluacionId, enunciado, momento }) {
  const vid = id(`${clave}|objetivo-trn`);
  if (await existe(tx, 'version_de_objetivo_de_entrenamiento', vid)) return vid;
  const serie = id(`${clave}|serie-objetivo-trn`);
  await insertar(tx, 'objetivo_de_entrenamiento', [{ id: serie, profesional_id: proId, asesorado_id: aseId, momento_de_registro: momento }]);
  await insertar(tx, 'version_de_objetivo_de_entrenamiento', [{ id: vid, objetivo_id: serie, evaluacion_id: evaluacionId, vigente_desde: momento, objetivo: { statement: enunciado }, fundamento: 'Progresar de a poco, con la técnica primero.', autor_id: proId, procedencia: PROC, momento_de_registro: momento }]);
  await insertar(tx, 'evento_de_entrenamiento', [{ tipo: 'VersionDeObjetivoDeEntrenamientoEmitida', profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'VersionDeObjetivoDeEntrenamiento', recurso_id: vid, actor_id: proId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }], { soloNuevas: false });
  return vid;
}

/** Una revisión registrada en el pasado y, si se aplica, su continuidad y la próxima revisión que fija. */
async function revisionEnElPasado(tx, { area, proId, aseId, x, evidencia, aplicar = true, versionDePlanCreada = null, versionDeObjetivoCreada = null, objetivoDeLaAccion = null }) {
  const t = T[area];
  const rid = id(x.clave);
  if (await existe(tx, t.revision, rid)) return rid;
  const [proceso] = await filas(tx, `SELECT "id"::text AS id FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = $3::"Alcance" AND "estado" = 'ABIERTO'`, proId, aseId, area);
  if (!proceso) throw new Error(`sin seguimiento abierto de ${area}`);
  const momento = new Date(x.momento);
  const proximaAccion = { description: x.accion, nextReviewAt: x.proxima ?? null, ...(objetivoDeLaAccion ? { objective: objetivoDeLaAccion } : {}) };
  await insertar(tx, t.revision, [{ id: rid, proceso_id: proceso.id, periodo_inicio: x.periodo.inicio, periodo_fin: x.periodo.fin, zona_horaria: ZONA, evidencias: evidencia, interpretacion: x.interpretacion, resultado: x.resultado, fundamento: x.fundamento, proxima_accion: proximaAccion, autor_id: proId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
  await insertar(tx, t.evento, [{ tipo: t.eventoRev, profesional_id: proId, asesorado_id: aseId, recurso_tipo: t.recursoRev, recurso_id: rid, actor_id: proId, procedencia: PROC, momento_de_ocurrencia: momento, momento_de_registro: momento }], { soloNuevas: false });
  if (aplicar) await aplicarEnElPasado(tx, { area, proId, aseId, x, revisionId: rid, versionDePlanCreada, versionDeObjetivoCreada });
  return rid;
}

async function aplicarEnElPasado(tx, { area, proId, aseId, x, revisionId, versionDePlanCreada, versionDeObjetivoCreada }) {
  const t = T[area];
  const [proceso] = await filas(tx, `SELECT "id"::text AS id FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = $3::"Alcance" AND "estado" = 'ABIERTO'`, proId, aseId, area);
  const aplicada = masMinutos(new Date(x.momento), 15);
  const eventoId = id(`${x.clave}|aplicada`);
  if (await existe(tx, 'evento_de_proceso', eventoId)) return;
  const ref = area === 'ENTRENAMIENTO' ? { revision_de_entrenamiento_id: revisionId } : { revision_id: revisionId };
  await insertar(tx, 'evento_de_proceso', [{ id: eventoId, tipo: 'ContinuidadOCierreAplicado', proceso_id: proceso.id, tipo_de_aplicacion: 'CONTINUIDAD', ...ref, estado_previo: 'ABIERTO', estado_posterior: 'ABIERTO', datos: { resultado: x.resultado, versionDePlanCreadaId: versionDePlanCreada, versionDeObjetivoCreadaId: versionDeObjetivoCreada }, actor_id: proId, procedencia: PROC, momento_de_ocurrencia: aplicada, momento_de_registro: aplicada }]);
  await insertar(tx, t.aplicacion, [{ id: id(`${x.clave}|aplicacion`), revision_id: revisionId, evento_id: eventoId, tipo: 'CONTINUIDAD', estado_de_proceso_posterior: 'ABIERTO', version_de_plan_creada_id: versionDePlanCreada, version_de_objetivo_creada_id: versionDeObjetivoCreada, momento_de_registro: aplicada }]);
  await tx.$executeRawUnsafe(`UPDATE "proceso_operativo" SET "version" = "version" + 1 WHERE "id" = $1::uuid`, proceso.id);
  if (x.proxima) {
    const [terminal] = await filas(tx, `SELECT p."id"::text AS id FROM "proxima_revision" p WHERE p."proceso_id" = $1::uuid AND NOT EXISTS (SELECT 1 FROM "proxima_revision" s WHERE s."predecesora_id" = p."id")`, proceso.id);
    await insertar(tx, 'proxima_revision', [{ id: id(`${x.clave}|proxima`), proceso_id: proceso.id, predecesora_id: terminal?.id ?? null, fecha_objetivo: x.proxima, fuente: 'REVISION', ...ref, actor_id: proId, procedencia: PROC, momento_de_ocurrencia: aplicada, momento_de_registro: aplicada }]);
  }
}

// ─── Cada persona ─────────────────────────────────────────────────────────────────────────────────────────────

const ids = {};
const log = (...x) => console.log(...x);

const contenidoDelObjetivo = (v, evaluacionId, desde) => ({
  evaluationId: evaluacionId,
  effectiveFrom: desde.toISOString(),
  effectiveUntil: null,
  estimatedEnergyRequirement: { value: v.kcal, unit: 'kcal/day' },
  macronutrientDistribution: { protein: { value: v.macros.p, unit: 'g/day' }, carbohydrate: { value: v.macros.c, unit: 'g/day' }, fat: { value: v.macros.g, unit: 'g/day' } },
  mealDistribution: `${v.plan[0].comidas.length} comidas.`,
  rationale: v.razon,
  methodStatement: null,
});

/** Las versiones de plan de un área que ya existen, en el orden en que se crearon. */
async function versionesExistentes(area, proId, aseId) {
  const t = T[area];
  return en((tx) => filas(tx, `SELECT v."id"::text AS id, v."estado"::text AS estado FROM "${t.version}" v JOIN "${t.plan}" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid AND p."asesorado_id" = $2::uuid ORDER BY v."momento_de_registro", v."id"`, proId, aseId));
}

async function evaluacion(area, p, proClave, aseId) {
  const token = await sesion(proClave);
  const ruta = area === 'NUTRICION' ? 'nutrition' : 'training';
  const lista = await pedir('GET', `/advisees/${aseId}/${ruta}/evaluations`, { token });
  const existentes = lista.data ?? lista.items ?? [];
  if (existentes.length) return existentes[existentes.length - 1].evaluationId ?? existentes[0].id;
  const ocurrio = instante(p.inicio, '09:00').toISOString();
  const f = p.formulario;
  const cuerpo =
    area === 'NUTRICION'
      ? { occurredAt: ocurrio, context: `Primera consulta. ${f.nutricion?.noCome ? `No come: ${f.nutricion.noCome}.` : ''}`.trim(), assessment: { entries: [{ concept: 'Comidas por día', value: f.nutricion?.comidasPorDia ?? 4, unit: 'comidas', source: 'REPORTED' }, { concept: 'Actividad física', value: f.nutricion?.actividad ?? 'Moderada', source: 'REPORTED' }] }, evidenceReferences: [], professionalNotes: 'Evaluación inicial.' }
      : { occurredAt: ocurrio, assessment: { entries: [{ concept: 'Experiencia en entrenamiento de fuerza', value: f.entrenamiento?.experiencia ?? 'Sin dato', source: 'REPORTED' }, { concept: 'Horario disponible', value: f.entrenamiento?.horario ?? 'Sin dato', source: 'REPORTED' }] }, evidenceReferences: [], professionalNotes: f.entrenamiento?.lesiones ? `Lesiones o molestias: ${f.entrenamiento.lesiones}` : 'Sin lesiones informadas.' };
  const r = await pedir('POST', `/advisees/${aseId}/${ruta}/evaluations`, { token, cuerpo });
  return r.data.evaluationId;
}

async function planes(area, p, proClave, aseId, evaluacionId, plantillas, recetaDelPlan = null) {
  const proId = ids[proClave];
  const token = await sesion(proClave);
  const t = T[area];
  const versiones = area === 'NUTRICION' ? p.nut.versiones : p.trn.versiones;
  const revisiones = p.revisiones.filter((r) => r.area === area);
  const estructura = (v) => {
    if (area !== 'NUTRICION') return v.estructura;
    const e = estructuraNutricional(v.plan);
    // La receta como opción del plan (REQ-TUT-34): en el día tipo principal de la última versión, la opción nace de la
    // receta; los ítems los arma el servidor con una porción, los mismos alimentos y cantidades de la historia.
    if (recetaDelPlan && v === versiones[versiones.length - 1]) {
      const comida = e.dayTypes[0].meals.find((m) => m.label === recetaDelPlan.comida);
      comida.options[recetaDelPlan.opcion] = { label: comida.options[recetaDelPlan.opcion].label, items: [], recipeVersionId: recetaDelPlan.recipeVersionId };
    }
    return e;
  };
  const existentes = await versionesExistentes(area, proId, aseId);
  const creadas = existentes.map((x) => x.id);
  const estados = new Map(existentes.map((x) => [x.id, x.estado]));
  const inicio = instante(p.inicio, '09:10');
  let objetivoId =
    area === 'NUTRICION'
      ? await en((tx) => objetivoNutricional(tx, { clave: `${p.clave}|nut|0`, proId, aseId, contenido: contenidoDelObjetivo(versiones[0], evaluacionId, inicio), momento: inicio }))
      : await en((tx) => objetivoDeEntrenamiento(tx, { clave: `${p.clave}|trn|0`, proId, aseId, evaluacionId, enunciado: p.formulario.entrenamiento?.objetivo ?? 'Entrenar fuerza con buena técnica.', momento: inicio }));
  const conPlantilla = (v) => (v.plantilla && plantillas[v.plantilla[0]]?.[v.plantilla[1] - 1] ? { fromTemplateVersionId: plantillas[v.plantilla[0]][v.plantilla[1] - 1] } : {});
  /**
   * Crea la versión k como borrador por la API (desde la anterior o desde una plantilla), si todavía no existe; si existe
   * en borrador (un corte entre el POST y el PATCH), le vuelve a escribir la estructura (borradores.mjs).
   */
  const borrador = async (k) => {
    if (creadas[k] && estados.get(creadas[k]) === 'ESCRITA') return;
    const v = versiones[k];
    const desdePlantilla = conPlantilla(v);
    const cuerpo = desdePlantilla.fromTemplateVersionId ? { objectiveVersionId: objetivoId, ...desdePlantilla } : k === 0 ? { objectiveVersionId: objetivoId, initialStructure: estructura(v) } : { objectiveVersionId: objetivoId, basedOnPlanId: creadas[k - 1] };
    creadas[k] = await asegurarBorrador({
      existente: creadas[k] ? { id: creadas[k], estado: estados.get(creadas[k]) } : null,
      crear: async () => (await pedir('POST', `/advisees/${aseId}/${t.ruta}/plans`, { token, cuerpo, clave: idCliente(`${p.clave}|${area}|plan|${k}`) })).data,
      versionDe: async (planId) => `v${(await en((tx) => filas(tx, `SELECT "version" FROM "${t.version}" WHERE "id" = $1::uuid`, planId)))[0].version}`,
      escribir: (planId, version, { reintento }) => pedir('PATCH', `/${t.ruta}/plans/${planId}`, { token, cuerpo: { expectedVersion: version, changes: estructura(v) }, clave: reintento ? false : idCliente(`${p.clave}|${area}|plan|${k}|estructura`) }),
    });
    if (estados.get(creadas[k]) !== 'ACTIVADA') estados.set(creadas[k], 'ESCRITA');
  };
  await borrador(0);
  await activarEnElPasado(area, creadas[0], instante(versiones[0].desde, '10:00'), proId, aseId);
  // Las revisiones, en orden: la que abre una versión (con su objetivo nuevo, su borrador y su activación) y las de
  // seguimiento. La última fija la próxima, que arma «Te toca a vos».
  let vigente = 0;
  for (const rev of revisiones) {
    const k = rev.version;
    if (k === null) {
      await en((tx) => revisionEnElPasado(tx, { area, proId, aseId, x: rev, evidencia: [{ type: 'PLAN_VERSION', id: creadas[vigente] }] }));
      continue;
    }
    const v = versiones[k];
    if (area === 'NUTRICION') {
      const contenido = contenidoDelObjetivo(v, evaluacionId, masMinutos(new Date(rev.momento), 5));
      const cambia = rev.resultado === 'CAMBIAR_OBJETIVO';
      objetivoId = await en(async (tx) => {
        const rid = await revisionEnElPasado(tx, { area, proId, aseId, x: rev, evidencia: [{ type: 'PLAN_VERSION', id: creadas[k - 1] }], aplicar: false, objetivoDeLaAccion: cambia ? contenido : null });
        return objetivoNutricional(tx, { clave: `${p.clave}|nut|${k}`, proId, aseId, contenido, momento: masMinutos(new Date(rev.momento), 10), revisionId: cambia ? rid : null });
      });
    } else {
      await en((tx) => revisionEnElPasado(tx, { area, proId, aseId, x: rev, evidencia: [{ type: 'PLAN_VERSION', id: creadas[k - 1] }], aplicar: false }));
    }
    await borrador(k);
    await en((tx) => aplicarEnElPasado(tx, { area, proId, aseId, x: rev, revisionId: id(rev.clave), versionDePlanCreada: creadas[k], versionDeObjetivoCreada: area === 'NUTRICION' && rev.resultado === 'CAMBIAR_OBJETIVO' ? objetivoId : null }));
    await activarEnElPasado(area, creadas[k], masMinutos(new Date(rev.momento), 60), proId, aseId);
    vigente = k;
  }
  for (let k = 1; k < versiones.length; k++) {
    if (creadas[k] && (await versionesExistentes(area, proId, aseId)).find((x) => x.id === creadas[k])?.estado === 'ACTIVADA') continue;
    await borrador(k);
    await activarEnElPasado(area, creadas[k], instante(versiones[k].desde, '10:00'), proId, aseId);
  }
  // El plan siguiente de Silvia, en borrador (REQ-TUT-25): queda en su estación, sin activar.
  if (area === 'ENTRENAMIENTO' && p.trn.borrador && creadas.length === versiones.length) {
    const b = (await pedir('POST', `/advisees/${aseId}/training/plans`, { token, cuerpo: { objectiveVersionId: objetivoId, basedOnPlanId: creadas[creadas.length - 1] }, clave: idCliente(`${p.clave}|plan-borrador`) })).data;
    const base = versiones[versiones.length - 1].estructura;
    await pedir('PATCH', `/training/plans/${b.planId}`, { token, cuerpo: { expectedVersion: b.version, changes: { blocks: [{ ...base.blocks[0], label: p.trn.borrador.nombre, purpose: p.trn.borrador.proposito }] } }, clave: idCliente(`${p.clave}|plan-borrador|estructura`) });
  }
  return creadas;
}

/** Las comidas, por SQL, en lotes; solo las que faltan. */
async function comidas(p, proId, aseId, versionesNut) {
  if (!p.nut.comidas.length) return 0;
  const inst = new Map();
  await en(async (tx) => {
    for (const vid of versionesNut) inst.set(vid, (await filas(tx, `SELECT "contenido" FROM "instantanea_de_plan_nutricional" WHERE "version_de_plan_id" = $1::uuid`, vid))[0].contenido);
  });
  const ingestas = [];
  const eventos = [];
  const rectificaciones = [];
  for (const c of p.nut.comidas) {
    const versionId = versionesNut[c.version];
    const dia = inst.get(versionId).dayTypes[c.diaTipo];
    const comida = dia.meals.find((m) => m.label === c.comida);
    const ingestaId = id(c.clave);
    const ocurrio = new Date(c.ocurrio);
    const registrado = new Date(c.registrado);
    if (c.diferente) {
      ingestas.push({ id: ingestaId, version_de_plan_id: versionId, asesorado_id: aseId, origen: 'FUERA_DE_PRESCRIPCION', modo: 'DESCRIPCION_LIBRE', fecha_local: c.fecha, zona_horaria: ZONA, descripcion: c.diferente.descripcion, descripcion_de_porcion: c.diferente.aproximada, dia_tipo_de_contexto_id: dia.dayTypeId, comida_de_contexto_id: comida.mealId, dia_tipo_id: null, comida_id: null, opcion_id: null, cantidades_consumidas: null, secuencia: 0, procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado });
    } else {
      const opcion = comida.options[c.opcion];
      ingestas.push({ id: ingestaId, version_de_plan_id: versionId, asesorado_id: aseId, origen: 'PRESCRIPTA', modo: 'OPCIONES_DE_PLATO', fecha_local: c.fecha, zona_horaria: ZONA, descripcion: null, descripcion_de_porcion: null, dia_tipo_de_contexto_id: null, comida_de_contexto_id: null, dia_tipo_id: dia.dayTypeId, comida_id: comida.mealId, opcion_id: opcion.optionId, cantidades_consumidas: cantidadesDe(c.consumo, opcion), secuencia: 0, procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado });
      if (c.rectificacion) {
        const momento = new Date(c.rectificacion.momento);
        rectificaciones.push({ id: id(`${c.clave}|rectificacion`), ingesta_id: ingestaId, cantidades: cantidadesDe({ status: 'PLAN_PORTIONS' }, opcion), autor_id: aseId, procedencia: PROC, momento_de_registro: momento, _evento: eventoDeIngesta(proId, aseId, ingestaId, 'CantidadesDeIngestaRectificadas', momento) });
      }
    }
    ingestas[ingestas.length - 1]._evento = eventoDeIngesta(proId, aseId, ingestaId, 'IngestaRegistrada', ocurrio, registrado);
  }
  return en(async (tx) => {
    const nuevas = await filtrarNuevas(tx, 'ingesta_nutricional', ingestas);
    await insertar(tx, 'ingesta_nutricional', nuevas.map(sinEvento), { tam: 200, soloNuevas: false });
    const nuevasR = await filtrarNuevas(tx, 'rectificacion_de_cantidades', rectificaciones);
    await insertar(tx, 'rectificacion_de_cantidades', nuevasR.map(sinEvento), { soloNuevas: false });
    await insertar(tx, 'evento_de_nutricion', [...nuevas, ...nuevasR].map((x) => x._evento), { tam: 400, soloNuevas: false });
    return nuevas.length;
  });
}
const sinEvento = ({ _evento, ...x }) => x;
async function filtrarNuevas(tx, tabla, lista) {
  if (!lista.length) return [];
  const existentes = new Set();
  const todos = lista.map((x) => x.id);
  for (let i = 0; i < todos.length; i += 2000) for (const f of await filas(tx, `SELECT "id"::text AS id FROM "${tabla}" WHERE "id" = ANY($1::uuid[])`, todos.slice(i, i + 2000))) existentes.add(f.id);
  return lista.filter((x) => !existentes.has(x.id));
}
function cantidadesDe(consumo, opcion) {
  if (consumo.status === 'UNCONFIRMED') return { status: 'UNCONFIRMED', items: [] };
  if (consumo.status === 'PLAN_PORTIONS') return { status: 'PLAN_PORTIONS', items: opcion.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity, notEaten: false })) };
  return { status: 'REPORTED', items: opcion.items.map((it, i) => ({ itemId: it.itemId, quantity: { value: consumo.items[i], unit: it.quantity.unit }, notEaten: false })) };
}
const eventoDeIngesta = (proId, aseId, ingestaId, tipo, ocurrio, registrado = ocurrio) => ({ tipo, profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'IngestaNutricional', recurso_id: ingestaId, actor_id: aseId, procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado });

const TIPO_DE_EVENTO = { SESSION_STARTED: 'SESION_INICIADA', SESSION_FINISHED: 'SESION_FINALIZADA', EXERCISE_ACTIVATED: 'EJERCICIO_ACTIVADO', REST_STARTED: 'DESCANSO_INICIADO', REST_FINISHED: 'DESCANSO_FINALIZADO' };

/** Las sesiones, por SQL: el borrador, la ejecución con cada serie (con su procedencia, ED-70), los tiempos y las notas. */
async function sesionesDe(p, proId, aseId, versionesTrn, sesionesDeOtro = null) {
  const lista = sesionesDeOtro ?? p.trn.sesiones;
  if (!lista.length) return 0;
  const borradores = [];
  const ejecuciones = [];
  const eventos = [];
  const tiempos = [];
  for (const s of lista) {
    const versionId = versionesTrn[s.version ?? 0];
    const contenido = {
      exercises: s.ejercicios.map((x) => (x.resumen ? { prescriptionId: x.prescriptionId, performedExerciseVersionId: ejercicio(x.ejercicio).versionId, executionSummary: { description: x.resumen } } : { prescriptionId: x.prescriptionId, performedExerciseVersionId: ejercicio(x.ejercicio).versionId, sets: x.sets.map(({ rareza, ...y }) => y) })),
      sessionSummary: s.resumenDeSesion ? { description: s.resumenDeSesion } : null,
    };
    const borradorId = id(`${s.clave}|borrador`);
    const ejecucionId = id(s.clave);
    const ocurrio = new Date(s.ocurrio);
    const registrado = new Date(s.registrado);
    const sesionId = s.sesionId ?? 'cuerpo';
    borradores.push({ id: borradorId, asesorado_id: aseId, version_de_plan_id: versionId, sesion_planificada_id: sesionId, fecha_local: s.fecha, zona_horaria: ZONA, granularidad: s.granularidad, condicion: s.condicion ?? 'REALIZADA', motivo: s.motivo ?? null, contenido, momento_de_ocurrencia: ocurrio, momento_de_registro: ocurrio, momento_de_actualizacion: registrado });
    ejecuciones.push({ id: ejecucionId, asesorado_id: aseId, version_de_plan_id: versionId, sesion_planificada_id: sesionId, fecha_local: s.fecha, zona_horaria: ZONA, borrador_id: borradorId, granularidad: s.granularidad, condicion: s.condicion ?? 'REALIZADA', motivo: s.motivo ?? null, contenido, procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado });
    eventos.push({ _id: ejecucionId, tipo: 'EjecucionRegistrada', profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'EjecucionDeEntrenamiento', recurso_id: ejecucionId, estado_previo: 'BORRADOR', estado_posterior: 'REGISTRADA', actor_id: aseId, procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado });
    if (s.tiempos) {
      const corrida = idCliente(`${s.clave}|corrida`);
      const ancla = idCliente(`${s.clave}|ancla`);
      const t0 = new Date(s.tiempos.eventos[0].en).getTime();
      s.tiempos.eventos.forEach((e, i) => {
        const en = new Date(e.en);
        const extra = e.tipo === 'EXERCISE_ACTIVATED' ? { prescriptionId: e.prescriptionId } : e.tipo === 'REST_STARTED' ? { restId: idCliente(`${s.clave}|${e.restId}`), prescriptionId: e.prescriptionId, setIndex: e.setIndex } : e.tipo === 'REST_FINISHED' ? { restId: idCliente(`${s.clave}|${e.restId}`) } : e.tipo === 'SESSION_FINISHED' ? { resolution: 'FINISHED' } : {};
        const eventoId = idCliente(`${s.clave}|evento|${i}`);
        const cont = { eventId: eventoId, runId: corrida, sequence: i + 1, at: { civil: en.toISOString(), monotonic: { anchor: ancla, ms: en.getTime() - t0 + 1000, clock: 'ELAPSED_SINCE_BOOT' }, source: 'MONOTONIC' }, compoundActionId: null, type: e.tipo, ...extra };
        tiempos.push({ _ejecucion: ejecucionId, id: id(`${s.clave}|tiempo|${i}`), borrador_id: borradorId, asesorado_id: aseId, corrida_id: corrida, secuencia: i + 1, evento_id: eventoId, tipo: TIPO_DE_EVENTO[e.tipo], contenido: cont, instante_civil: en, ancla_monotonica: ancla, ms_monotonicos: en.getTime() - t0 + 1000, base_del_reloj: 'DESDE_EL_ARRANQUE', origen_del_instante: 'MONOTONICO', descanso_recomendado_segundos: e.tipo === 'REST_STARTED' ? e.recomendado : null, procedencia: PROC, momento_de_recepcion: registrado });
      });
    }
  }
  return en(async (tx) => {
    const nuevas = await filtrarNuevas(tx, 'ejecucion_de_entrenamiento', ejecuciones);
    const nuevasIds = new Set(nuevas.map((x) => x.id));
    const borradoresNuevos = new Set(nuevas.map((x) => x.borrador_id));
    await insertar(tx, 'borrador_de_ejecucion_de_entrenamiento', borradores.filter((b) => borradoresNuevos.has(b.id)), { tam: 150, soloNuevas: false });
    await insertar(tx, 'ejecucion_de_entrenamiento', nuevas, { tam: 150, soloNuevas: false });
    await insertar(tx, 'evento_de_entrenamiento', eventos.filter((e) => nuevasIds.has(e._id)).map(({ _id, ...e }) => e), { tam: 400, soloNuevas: false });
    await insertar(tx, 'evento_de_tiempo_de_entrenamiento', tiempos.filter((x) => nuevasIds.has(x._ejecucion)).map(({ _ejecucion, ...x }) => x), { tam: 300, soloNuevas: false });
    return nuevas.length;
  });
}

const PERIMETROS_DE_LEE = ['perimetro-brazo-relajado', 'perimetro-muslo', 'perimetro-pantorrilla'];
async function tomasDe(p, proId, aseId) {
  if (!p.tomas.length) return 0;
  const evaluaciones = [];
  const mediciones = [];
  for (const t of p.tomas) {
    const evaluacionId = id(t.clave);
    const ocurrio = new Date(t.ocurrio);
    const registrado = new Date(t.registrado);
    evaluaciones.push({ id: evaluacionId, profesional_id: proId, asesorado_id: aseId, procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: ocurrio, _registrado: registrado });
    for (const [metrica, valor, unidad] of t.mediciones) mediciones.push({ id: id(`${t.clave}|${metrica}`), evaluacion_id: evaluacionId, metrica, valor, unidad_de_origen: unidad, protocolo_version_id: PROTOCOLO, origen: 'CAPTURA_DIRECTA', clase: 'MEDIDO', procedencia: PROC, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado });
  }
  const n = await en(async (tx) => {
    const nuevas = await filtrarNuevas(tx, 'evaluacion_antropometrica', evaluaciones);
    if (!nuevas.length) return 0;
    const ids = new Set(nuevas.map((x) => x.id));
    await insertar(tx, 'evaluacion_antropometrica', nuevas.map(({ _registrado, ...x }) => x), { soloNuevas: false });
    await insertar(tx, 'medicion_antropometrica', mediciones.filter((m) => ids.has(m.evaluacion_id)), { soloNuevas: false });
    for (const x of nuevas) await tx.$executeRawUnsafe(`UPDATE "evaluacion_antropometrica" SET "estado" = 'REGISTRADA', "momento_de_registro_de_evaluacion" = $2 WHERE "id" = $1::uuid`, x.id, x._registrado);
    await insertar(tx, 'evento_de_antropometria', nuevas.map((x) => ({ tipo: 'EvaluacionAntropometricaRegistrada', evaluacion_id: x.id, actor_id: proId, procedencia: PROC, momento_de_ocurrencia: x._registrado, momento_de_registro: x._registrado })), { soloNuevas: false });
    return nuevas.length;
  });
  // Los cálculos los hace BE (R-ANT-06): IMC, suma de pliegues, porcentaje y masas de Durnin y Womersley, cintura-talla y
  // la masa muscular de Lee, por la API, solo en las tomas que todavía no los tienen.
  const token = await sesion('julieta');
  const metodos = await metodosDe(token);
  const reglas = [...METODOS[p.sexo], ...METODOS.masas[p.sexo], ...METODOS.musculoDeLee[p.sexo]];
  for (const t of p.tomas) {
    const pesoId = id(`${t.clave}|peso`);
    const hecho = await en((tx) => filas(tx, `SELECT 1 FROM "entrada_de_calculo" WHERE "medicion_id" = $1::uuid LIMIT 1`, pesoId));
    if (hecho.length) continue;
    const porMetrica = Object.fromEntries(t.mediciones.map(([m]) => [m, id(`${t.clave}|${m}`)]));
    for (const regla of reglas) {
      const m = metodos.find((x) => x.ruleId === regla);
      if (!m) continue;
      const bindings = m.requiredInputs.map((i) => ({ inputCode: i.inputCode, sourceRef: porMetrica[i.metric] }));
      if (bindings.some((b) => !b.sourceRef)) continue;
      if (regla.includes('lee') && PERIMETROS_DE_LEE.some((x) => !porMetrica[x])) continue;
      await pedir('POST', `/advisees/${aseId}/calculations`, { token, cuerpo: { purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: m.methodVersionId, inputBindings: bindings } });
    }
  }
  return n;
}
let metodosCache = null;
async function metodosDe(token) {
  if (metodosCache) return metodosCache;
  const todos = [];
  let cursor = null;
  do {
    const r = await pedir('GET', `/professional-methods?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { token });
    todos.push(...r.data);
    cursor = r.page?.nextCursor ?? null;
  } while (cursor);
  return (metodosCache = todos);
}

/** Las notas propias de la profesional (con su ancla y su archivo) y las notas de la sesión que escribe la persona. */
async function notas(p, proId, aseId) {
  return en(async (tx) => {
    const propias = p.notas.map((n) => {
      const momento = instante(n.fecha, '19:40');
      const e = n.ancla === 'EJERCICIO' ? ejercicio(n.ejercicio).ejercicioId : null;
      return { id: id(n.clave), profesional_id: proId, asesorado_id: aseId, texto: n.texto, ancla: n.ancla ?? null, ejercicio_id: e, comida: n.ancla === 'COMIDA' ? n.comida : null, procedencia: PROC, momento_de_registro: momento, _archivada: n.archivada ? masMinutos(momento, 60 * 24 * 21) : null };
    });
    const nuevas = await filtrarNuevas(tx, 'nota_propia', propias);
    await insertar(tx, 'nota_propia', nuevas.map(({ _archivada, ...x }) => x), { soloNuevas: false });
    await insertar(tx, 'archivo_de_nota_propia', nuevas.filter((x) => x._archivada).map((x) => ({ nota_id: x.id, profesional_id: proId, procedencia: PROC, momento_de_registro: x._archivada })), { soloNuevas: false, clave: 'nota_id' });
    const deSesion = p.notasDeSesion.map((n) => ({ id: id(n.clave), ejecucion_id: id(n.sesion), asesorado_id: aseId, texto: n.texto, procedencia: PROC, momento_de_registro: new Date(n.momento) }));
    const nuevasS = await filtrarNuevas(tx, 'nota_de_ejecucion', deSesion);
    await insertar(tx, 'nota_de_ejecucion', nuevasS, { soloNuevas: false });
    return nuevas.length + nuevasS.length;
  });
}

// ─── Las herramientas de la profesional (por la API, como desde el website) ───────────────────────────────────

async function herramientas(h) {
  const token = await sesion('julieta');
  const resultado = { plantillas: {}, alimentos: 0, favoritos: 0 };
  // Las plantillas de Entrenamiento, con sus versiones (REQ-TUT-9 y 10).
  const lista = (await pedir('GET', '/training/plan-templates?limit=50', { token })).data ?? [];
  for (const [clave, pl] of Object.entries(HERRAMIENTAS.plantillasDeEntrenamiento)) {
    let actual = lista.find((x) => x.name === pl.nombre);
    const versiones = [];
    const estructuraDe = (v) => estructuraDeEntrenamiento({ liviana: true }, { nombre: pl.nombre, proposito: pl.descripcion, sesiones: v.sesiones });
    if (!actual) {
      const r = await pedir('POST', '/training/plan-templates', { token, cuerpo: { name: pl.nombre, description: pl.descripcion, structure: estructuraDe(pl.versiones[0]) } });
      actual = r.data;
    }
    const todas = (await pedir('GET', `/training/plan-templates/${actual.templateId}/versions`, { token })).data;
    for (let i = todas.length; i < pl.versiones.length; i++) {
      const vig = (await pedir('GET', `/training/plan-templates/${actual.templateId}`, { token })).data;
      await pedir('POST', `/training/plan-templates/${actual.templateId}/versions`, { token, cuerpo: { expectedVersion: vig.version, structure: estructuraDe(pl.versiones[i]) } });
    }
    const finales = (await pedir('GET', `/training/plan-templates/${actual.templateId}/versions`, { token })).data;
    for (const v of [...finales].sort((a, b) => a.versionNumber - b.versionNumber)) versiones.push(v.versionId);
    resultado.plantillas[clave] = versiones;
  }
  // Las plantillas nutricionales.
  const listaN = (await pedir('GET', '/nutrition/plan-templates?limit=50', { token })).data ?? [];
  for (const [clave, pl] of Object.entries(HERRAMIENTAS.plantillasNutricionales)) {
    if (listaN.some((x) => x.name === pl.nombre)) continue;
    const plan = planNutricionalDe({ dieta: pl.dieta }, { kcal: pl.kcal, dias: clave === 'mantenimiento' ? 'ENTRENA' : 'UNO' });
    await pedir('POST', '/nutrition/plan-templates', { token, cuerpo: { name: pl.nombre, structure: estructuraNutricional(plan), copyQuantities: true } });
  }
  // Los alimentos propios: uno corregido (versión nueva) y uno retirado (REQ-TUT-9).
  const mios = async () => (await pedir('GET', '/nutrition/catalog-items/mine?limit=50', { token })).data ?? [];
  const yaEstan = await mios();
  const comp = (x) => ({ referenceAmount: '100g', energyKcal: x.kcal, proteinG: x.p, carbohydrateG: x.c, fatG: x.g, fiberG: x.f });
  for (const a of HERRAMIENTAS.alimentosPropios) {
    if (yaEstan.some((x) => x.name === a.nombre)) continue;
    const medidas = (HERRAMIENTAS.medidasCaseras[a.clave] ?? []).map(([kind, amount]) => ({ kind, amount }));
    const r = await pedir('POST', '/nutrition/catalog-items', { token, cuerpo: { name: a.nombre, itemType: 'FOOD', composition: comp(a), ...(medidas.length ? { householdMeasures: medidas } : {}) } });
    resultado.alimentos++;
    const item = (await mios()).find((x) => x.catalogItemId === r.data.catalogItemId);
    if (a.corregido) await pedir('PATCH', `/nutrition/catalog-items/${item.catalogItemId}`, { token, cuerpo: { expectedVersion: item.version, name: a.nombre, composition: comp(a.corregido) } });
    if (a.retirado) await pedir('POST', `/nutrition/catalog-items/${item.catalogItemId}/retirement`, { token, cuerpo: { expectedVersion: item.version } });
  }
  // Los ejercicios que más usa, arriba del buscador (marcar es idempotente: sin clave de idempotencia).
  for (const nombre of HERRAMIENTAS.ejerciciosHabituales) {
    await pedir('PATCH', `/training/favorite-exercises/${ejercicio(nombre).ejercicioId}`, { token, cuerpo: { state: 'MARKED' }, clave: false });
    resultado.favoritos++;
  }
  return resultado;
}

// ─── Lo que se crea por la API además de la historia (extras.mjs) ──────────────────────────────────────────────

const fallasDeLosExtras = [];
/** Corre una parte; si falla, la anota y sigue: al final, con alguna falla, la carga sale con 5 y la lista entera. */
async function intentar(nombre, fn) {
  try {
    const r = await fn();
    log(`${nombre}: ${r === null || r === undefined || typeof r === 'object' ? 'hecho' : r}`);
    return r;
  } catch (e) {
    fallasDeLosExtras.push(`${nombre}: ${String(e?.message ?? e).slice(0, 500)}`);
    return null;
  }
}
const X = extras({
  pedir: (...a) => pedir(...a),
  sesion: (...a) => sesion(...a),
  ids,
  dominio,
  versionesDeAlimentos: async (claves) => {
    const porId = await en((tx) => catalogoNutricional(tx, ids.julieta, claves.map((k) => ALIMENTO[k].id)));
    return (k) => ({ catalogItemId: ALIMENTO[k].id, catalogItemVersionId: porId.get(ALIMENTO[k].id).versionId });
  },
});

// ─── Compartir, historia anterior y coordinación ──────────────────────────────────────────────────────────────

async function compartirDeSilvia(silviaId) {
  const t = await sesion('silvia', 'APK');
  const actual = await pedir('GET', '/me/summary-sharing', { token: t, superficie: 'APK' });
  const otorgadas = actual.data.sharing?.grants ?? [];
  if (otorgadas.some((g) => g.professionalId === ids.julieta && g.area === 'NUTRICION')) return 'ya';
  await pedir('PUT', '/me/summary-sharing', {
    token: t,
    superficie: 'APK',
    cuerpo: {
      expectedVersion: actual.data.sharing.version,
      acceptedTexts: { summary: actual.data.texts.summary.id, summaryAndPlan: actual.data.texts.summaryAndPlan.id },
      grants: [
        { professionalId: ids.julieta, area: 'NUTRICION', level: 'SUMMARY_AND_PLAN' },
        { professionalId: ids.natalia, area: 'ENTRENAMIENTO', level: 'SUMMARY_AND_PLAN' },
      ],
    },
  });
  return 'hecho';
}

/** Las notas de coordinación entre Julieta y la colega de Nutrición de Silvia (REQ-TUT-12), por la API: con la fecha del armado (TUT-D13). */
async function coordinacion(silviaId) {
  const hechas = [];
  for (const n of COORDINACION) {
    const autor = n.de === 'julieta' ? 'julieta' : 'natalia';
    const otra = n.de === 'julieta' ? 'natalia' : 'julieta';
    const token = await sesion(autor);
    const r = await pedir('POST', `/advisees/${silviaId}/coordination-notes`, {
      token,
      cuerpo: { originScope: n.de === 'julieta' ? 'ENTRENAMIENTO' : 'NUTRICION', purpose: 'CHANGE_IN_MY_AREA', recipients: { mode: 'ONE', identityId: ids[otra] }, text: n.texto },
      clave: idCliente(`coordinacion|${n.texto}`),
    });
    hechas.push(r.status);
  }
  return hechas.length;
}

async function historiaAnterior(valeria) {
  const t = await sesion('valeria', 'APK');
  const r = await pedir('GET', '/me/previous-history', { token: t, superficie: 'APK' });
  const deJulieta = r.data.items.find((x) => x.professional.identityId === ids.julieta && x.area === 'ENTRENAMIENTO');
  if (!deJulieta) throw new Error(`la historia anterior no ofrece a la profesional en Entrenamiento: ${JSON.stringify(r.data.items).slice(0, 400)}`);
  if (deJulieta.accessInEffect) return 'ya';
  await pedir('PUT', `/me/previous-history/${deJulieta.relationshipId}`, { token: t, superficie: 'APK', cuerpo: { expectedVersion: deJulieta.authorization?.version ?? null, textVersionId: r.data.text.id } });
  return 'hecho';
}

// ─── Los comandos ─────────────────────────────────────────────────────────────────────────────────────────────

function verificarAntes(h) {
  const v = verificar(h, { dominio });
  const m = verificarMatriz(h);
  if (!v.ok || !m.ok) {
    for (const x of v.resultado.filter((y) => y.fallas.length)) console.error(`FALLA ${x.regla} · ${x.persona}: ${x.fallas.slice(0, 3).join('; ')}`);
    for (const c of m.celdas.filter((y) => !y.ok)) console.error(`FALLA matriz ${c.id} · ${c.persona}`);
    console.error('La historia no pasa el chequeo de verosimilitud: no se carga nada (REQ-TUT-60).');
    process.exit(2);
  }
  log(`Chequeo de verosimilitud: todo cumple (${v.resultado.length} reglas por persona, ${m.celdas.length} celdas de la matriz).`);
}

async function profesionales() {
  for (const [clave, pro] of [['julieta', PROFESIONAL], ['natalia', COLEGAS.nutricionista], ['esteban', COLEGAS.entrenadorAnterior]]) ids[clave] = await cuenta(clave, 'PROFESSIONAL', pro.nombre);
  const demo = [['julieta', PROFESIONAL], ['natalia', COLEGAS.nutricionista], ['esteban', COLEGAS.entrenadorAnterior]].flatMap(([k, pro]) => pro.alcances.map(([a, tipo]) => `${ids[k]}|${a}|${tipo}|${pro.nombre}`)).join(';');
  const verificadas = await en((tx) => filas(tx, `SELECT "identidad_id"::text AS i, "alcance"::text AS a FROM "verificacion_profesional" WHERE "identidad_id" = ANY($1::uuid[]) AND "estado" = 'VERIFICADO'`, [ids.julieta, ids.natalia, ids.esteban]));
  const faltan = [['julieta', PROFESIONAL], ['natalia', COLEGAS.nutricionista], ['esteban', COLEGAS.entrenadorAnterior]].flatMap(([k, pro]) => pro.alcances.filter(([a]) => !verificadas.some((v) => v.i === ids[k] && v.a === a)).map(([a]) => `${pro.nombre} ${a}`));
  if (faltan.length) {
    console.log(`BE_DEMO_PROFESIONALES=${demo}`);
    console.error(`Faltan verificar: ${faltan.join(', ')}. Reiniciá la API con la variable de arriba (DL-036) y corré el mismo comando de nuevo.`);
    process.exit(3);
  }
}

async function cargar(h) {
  await profesionales();
  const herr = await herramientas(h);
  await intentar('las recetas', X.recetas);
  await intentar('las comidas y sesiones habituales', X.habituales);
  await intentar('las vistas de «Analizar»', X.vistas);
  log(`herramientas: ${Object.keys(herr.plantillas).length} plantillas de Entrenamiento, ${herr.alimentos} alimentos propios nuevos, ${herr.favoritos} ejercicios habituales`);
  for (const p of h.personas) {
    const t0 = Date.now();
    const aseId = (ids[p.clave] = await cuenta(p.clave, 'ADVISEE', p.nombre));
    const tA = await sesion(p.clave, 'APK');
    await pedir('POST', '/me/health-data-consents', { token: tA, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id }, esperado: [200, 201, 409] });
    const claveDeLaProfesional = (q) => ({ J: 'julieta', NY: 'natalia', EI: 'esteban' })[q];
    // La historia anterior de Valeria: el entrenador anterior, sus diez meses y el fin de ese componente (REQ-TUT-21).
    if (p.historiaAnterior) {
      const ha = p.historiaAnterior;
      const momento = instante(ha.inicio, '17:00');
      await en((tx) => vincularEnElPasado(tx, { pro: COLEGAS.entrenadorAnterior, proId: ids.esteban, aseId, alcance: 'ENTRENAMIENTO', momento: masMinutos(momento, -3 * 24 * 60), clave: `${p.clave}|anterior` }));
      const ya = await versionesExistentes('ENTRENAMIENTO', ids.esteban, aseId);
      let vid = ya[0]?.id;
      if (!vid) {
        const evalId = await evaluacion('ENTRENAMIENTO', { ...p, inicio: ha.inicio }, 'esteban', aseId);
        const obj = await en((tx) => objetivoDeEntrenamiento(tx, { clave: `${p.clave}|anterior|trn|0`, proId: ids.esteban, aseId, evaluacionId: evalId, enunciado: 'Fuerza general, tres días.', momento }));
        vid = (await pedir('POST', `/advisees/${aseId}/training/plans`, { token: await sesion('esteban'), cuerpo: { objectiveVersionId: obj, initialStructure: ha.estructura } })).data.planId;
      }
      await activarEnElPasado('ENTRENAMIENTO', vid, masMinutos(momento, 60), ids.esteban, aseId);
      await sesionesDe(p, ids.esteban, aseId, [vid], ha.sesiones.map((s) => ({ ...s, version: 0, granularidad: 'SERIE', condicion: 'REALIZADA', sesionId: 'cuerpo' })));
      const r0 = ha.revisiones[0];
      await en((tx) => revisionEnElPasado(tx, { area: 'ENTRENAMIENTO', proId: ids.esteban, aseId, x: { ...r0, clave: `${p.clave}|anterior|rev|0`, momento: instante(r0.fecha, '18:30').toISOString(), proxima: null, periodo: { inicio: ha.inicio, fin: r0.fecha } }, evidencia: [{ type: 'PLAN_VERSION', id: vid }] }));
      await en((tx) => finalizarEnElPasado(tx, { proId: ids.esteban, aseId, alcance: 'ENTRENAMIENTO', momento: instante(ha.fin, '12:00'), clave: `${p.clave}|anterior`, motivo: 'CAMBIO_DE_PROFESIONAL' }));
    }
    // Los vínculos, con su fecha (REQ-TUT-08 y 13).
    await en(async (tx) => {
      const momento = masMinutos(instante(p.inicio, '16:10'), -3 * 24 * 60);
      for (const [area, q] of Object.entries(p.areas)) await vincularEnElPasado(tx, { pro: PROFESIONALES[q], proId: ids[claveDeLaProfesional(q)], aseId, alcance: area, momento, clave: p.clave });
    });
    const versiones = {};
    for (const area of ['ENTRENAMIENTO', 'NUTRICION']) {
      const q = p.areas[area];
      if (!q) continue;
      const lista = area === 'NUTRICION' ? p.nut.versiones : p.trn.versiones;
      if (q === 'J' && lista.length) {
        // Si todas las versiones ya están activadas, no hay nada que pedirle a la API (y un vínculo finalizado no deja).
        const ya = await versionesExistentes(area, ids.julieta, aseId);
        if (ya.length >= lista.length && ya.slice(0, lista.length).every((x) => x.estado === 'ACTIVADA')) {
          versiones[area] = ya.slice(0, lista.length).map((x) => x.id);
          continue;
        }
        const evalId = await evaluacion(area, p, 'julieta', aseId);
        const receta = area === 'NUTRICION' ? await intentar(`la receta en el plan de ${p.nombre}`, () => X.recetaParaElPlan(p)) : null;
        versiones[area] = await planes(area, p, 'julieta', aseId, evalId, herr.plantillas, receta ?? null);
      }
    }
    // La colega de Nutrición de Silvia: su objetivo y su plan vigente, para compartir (REQ-TUT-26).
    if (p.nut.colega) {
      const ya = await versionesExistentes('NUTRICION', ids.natalia, aseId);
      if (!ya.some((x) => x.estado === 'ACTIVADA')) {
        const evalId = await evaluacion('NUTRICION', p, 'natalia', aseId);
        const v = { ...p.nut.colega, razon: 'Plan de alimentación con cuatro comidas.' };
        const momento = instante(p.inicio, '11:00');
        const obj = await en((tx) => objetivoNutricional(tx, { clave: `${p.clave}|colega|nut|0`, proId: ids.natalia, aseId, contenido: contenidoDelObjetivo(v, evalId, momento), momento }));
        const vid = ya[0]?.id ?? (await pedir('POST', `/advisees/${aseId}/nutrition/plans`, { token: await sesion('natalia'), cuerpo: { objectiveVersionId: obj, initialStructure: estructuraNutricional(p.nut.colega.plan) } })).data.planId;
        await activarEnElPasado('NUTRICION', vid, masMinutos(momento, 30), ids.natalia, aseId);
      }
    }
    const n = {};
    if (versiones.NUTRICION) n.comidas = await comidas(p, ids.julieta, aseId, versiones.NUTRICION);
    if (versiones.ENTRENAMIENTO) n.sesiones = await sesionesDe(p, ids.julieta, aseId, versiones.ENTRENAMIENTO);
    if (p.areas.ANTROPOMETRIA === 'J') n.tomas = await tomasDe(p, ids.julieta, aseId);
    n.notas = await notas(p, ids.julieta, aseId);
    // El vínculo que terminó hace cuatro meses (REQ-TUT-13).
    if (p.fin) for (const area of Object.keys(p.areas)) await en((tx) => finalizarEnElPasado(tx, { proId: ids.julieta, aseId, alcance: area, momento: instante(p.fin, '12:00'), clave: p.clave, motivo: 'DECISION_PERSONAL' }));
    log(`${p.nombre}: ${JSON.stringify(n)} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
  // Lo que comparte Silvia con las dos (REQ-TUT-26) y la historia anterior de Valeria (REQ-TUT-21).
  log(`compartir de Silvia: ${await compartirDeSilvia(ids.silvia)}`);
  log(`historia anterior de Valeria: ${await historiaAnterior(ids.valeria)}`);
  log(`notas de coordinación de Silvia: ${await coordinacion(ids.silvia)}`);
  // Los formularios de inicio de las cinco en profundidad, respondidos; el pedido de información a Silvia, sin responder;
  // y una invitación a una persona nueva (REQ-TUT-14 y 17).
  for (const p of h.personas.filter((x) => !x.liviana)) await intentar(`los formularios de ${p.nombre}`, () => X.formularios(p));
  await intentar('el pedido de información a Silvia', X.pedidoDeInformacion);
  await intentar('la invitación a una persona nueva', X.invitacion);
  if (fallasDeLosExtras.length) {
    for (const f of fallasDeLosExtras) console.error(`FALLA ${f}`);
    process.exit(5);
  }
}

/** El origen de la muestra que ya está en la base: sale de la fecha del primer vínculo de Tomás. */
async function origenDeLaBase() {
  const tomas = PERSONAS.find((p) => p.clave === 'tomas');
  const [x] = await en((tx) => filas(tx, `SELECT "momento_de_ocurrencia" AS m FROM "solicitud_de_vinculo" WHERE "id" = $1::uuid`, id('tomas|solicitud|ENTRENAMIENTO')));
  if (!x) return null;
  const inicio = new Date(new Date(x.m).getTime() + (3 * 24 * 60 + 3 * 60) * 60_000 - 3 * 3_600_000).toISOString().slice(0, 10);
  return new Date(Date.parse(`${inicio}T12:00:00Z`) + tomas.semanas * 7 * 86_400_000).toISOString().slice(0, 10);
}

async function contar() {
  const r = [];
  for (const p of PERSONAS) {
    const correo = correoDe(p.clave);
    const [fila] = await en((tx) =>
      filas(
        tx,
        `SELECT i."id"::text AS id,
           (SELECT count(*) FROM "ingesta_nutricional" x WHERE x."asesorado_id" = i."id")::int AS comidas,
           (SELECT count(*) FROM "ejecucion_de_entrenamiento" x WHERE x."asesorado_id" = i."id")::int AS sesiones,
           (SELECT count(*) FROM "evaluacion_antropometrica" x WHERE x."asesorado_id" = i."id")::int AS tomas,
           (SELECT count(*) FROM "nota_propia" x WHERE x."asesorado_id" = i."id")::int AS notas,
           (SELECT count(*) FROM "evento_de_tiempo_de_entrenamiento" x WHERE x."asesorado_id" = i."id")::int AS tiempos
         FROM "identidad" i JOIN "metodo_de_acceso" m ON m."identidad_id" = i."id" WHERE lower(m."referencia") = lower($1) LIMIT 1`,
        correo,
      ),
    ).catch(() => []);
    r.push({ persona: p.nombre, ...(fila ?? {}) });
  }
  return r;
}

/** Si la historia llega hasta hoy, se corta en este momento: nada ocurre después de la carga (REQ-TUT-63). */
const ahoraSiEsHoy = (hoy) => (hoy === hoyEnBuenosAires() ? { ahora: new Date(Math.min(Date.now(), instante(hoy, '20:00').getTime())) } : {});

async function main() {
  if (comando === 'credenciales') {
    // Lo que Elián le pasa al tutor por su canal (REQ-TUT-56): solo en la terminal, nunca a un archivo.
    const clave = process.env.BE_TUTOR_CLAVE ?? '';
    if (clave.length < 24) throw new Error('BE_TUTOR_CLAVE tiene que tener 24 caracteres o más.');
    D = { clave };
    for (const [k, quien] of [['julieta', PROFESIONAL.nombre], ['carolina', 'Carolina R. (la app)']]) console.log(`${quien}: ${correoDe(k)} · ${claveDe(correoDe(k))}`);
    return;
  }
  D = destino();
  if (comando === 'armar') {
    const yaHay = await origenDeLaBase();
    const origen = opciones.origen ?? yaHay ?? hoyEnBuenosAires();
    if (yaHay && yaHay !== origen) throw new Error(`La generación ${GENERACION} ya está cargada con origen ${yaHay}: para seguirla, usá al-dia; para correr las fechas, una generación nueva.`);
    const hasta = opciones.hasta ?? (hoyEnBuenosAires() < origen ? origen : hoyEnBuenosAires());
    const h = generar({ origen, hoy: hasta, ...ahoraSiEsHoy(hasta) });
    verificarAntes(h);
    await cargar(h);
  } else if (comando === 'al-dia') {
    const origen = await origenDeLaBase();
    if (!origen) throw new Error(`La generación ${GENERACION} no está cargada: corré armar.`);
    const hoy = hoyEnBuenosAires();
    log(`Origen ${origen}; se agregan los días hasta ${hoy}.`);
    const h = generar({ origen, hoy, ...ahoraSiEsHoy(hoy) });
    verificarAntes(h);
    await cargar(h);
  } else if (comando === 'resumen' || comando === 'comprobar') {
    const origen = await origenDeLaBase();
    const conteos = await contar();
    for (const c of conteos) log(JSON.stringify(c));
    if (comando === 'comprobar') {
      if (!origen) throw new Error('La muestra no está cargada.');
      const h = generar({ origen, hoy: hoyEnBuenosAires(), ...ahoraSiEsHoy(hoyEnBuenosAires()) });
      let diferencias = 0;
      for (const p of h.personas) {
        const c = conteos.find((x) => x.persona === p.nombre);
        const esperado = { comidas: p.nut.comidas.length, sesiones: p.trn.sesiones.length + (p.historiaAnterior?.sesiones.length ?? 0), tomas: p.tomas.length, notas: p.notas.length, tiempos: p.trn.sesiones.reduce((s, x) => s + (x.tiempos?.eventos.length ?? 0), 0) };
        for (const [k, v] of Object.entries(esperado)) {
          // Lo registrado después de la carga (si «hoy» avanzó) puede faltar todavía: solo cuenta lo que debería estar.
          if ((c?.[k] ?? 0) > v || (c?.[k] ?? 0) < v - (k === 'comidas' || k === 'sesiones' || k === 'tiempos' ? Math.ceil(v * 0.05) : 0)) {
            diferencias++;
            console.error(`DIFERENCIA ${p.nombre} · ${k}: ${c?.[k]} en la base y ${v} en la historia`);
          }
        }
      }
      // Por la API, con la cuenta de la profesional: su cartera y lo que le toca (REQ-TUT-14 y 74).
      const token = await sesion('julieta');
      const cartera = await pedir('GET', '/me/portfolio', { token });
      const cola = await pedir('GET', '/me/review-queue', { token });
      log(`La cartera de la profesional por la API: ${(cartera.data ?? []).length} renglones.`);
      // «Te toca a vos», renglón por renglón (REQ-TUT-14 y 74): cada revisión vencida o de hoy de la historia tiene su
      // renglón con la misma fecha acordada, y cada renglón de revisión de la cola sale de la historia.
      const hoy = hoyEnBuenosAires();
      const esperado = [];
      for (const p of h.personas.filter((x) => !x.fin)) {
        for (const area of ['ENTRENAMIENTO', 'NUTRICION']) {
          const ultima = p.revisiones.filter((r) => r.area === area).at(-1);
          if (ultima?.proxima) esperado.push({ persona: p.nombre, area, fecha: ultima.proxima });
        }
      }
      const renglones = (cola.data ?? []).filter((x) => x.reason?.code === 'REVIEW_DUE').map((x) => ({ persona: x.advisee?.displayName, fecha: x.agreedReviewDate, area: x.scope?.code ?? x.area ?? null }));
      for (const r of renglones) {
        log(`Te toca a vos · ${r.persona} · ${r.area ?? '—'} · ${r.fecha}`);
        if (!esperado.some((e) => e.persona === r.persona && e.fecha === r.fecha && (!r.area || r.area === e.area))) {
          diferencias++;
          console.error(`DIFERENCIA «Te toca a vos»: ${r.persona} ${r.fecha} no sale de la historia`);
        }
      }
      for (const e of esperado.filter((x) => x.fecha <= hoy)) {
        if (!renglones.some((r) => r.persona === e.persona && r.fecha === e.fecha && (!r.area || r.area === e.area))) {
          diferencias++;
          console.error(`DIFERENCIA «Te toca a vos»: falta ${e.persona} (${e.area}, ${e.fecha})`);
        }
      }
      const otros = (cola.data ?? []).filter((x) => x.reason?.code !== 'REVIEW_DUE');
      for (const x of otros) log(`Te toca a vos · ${x.advisee?.displayName} · ${x.reason?.code}`);
      if (diferencias) process.exit(4);
      log('Comprobación: sin diferencias.');
    }
  } else {
    throw new Error('Comando desconocido: armar, al-dia, comprobar o resumen.');
  }
}

try {
  await main();
} finally {
  if (prisma) await prisma.$disconnect();
}
void diasEntre;
