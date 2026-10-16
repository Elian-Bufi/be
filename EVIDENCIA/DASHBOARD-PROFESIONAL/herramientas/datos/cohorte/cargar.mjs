// Carga la cohorte (pedido de Dirección del 2026-10-16) en local o en test. Fases, en orden:
//   profesionales  registra a los tres profesionales y escribe BE_DEMO_PROFESIONALES en demo-profesionales.txt: la API
//                  los verifica al arrancar con ese valor (DL-036). En test, va en un PR solo de configuración.
//   ejercicios     los ejercicios propios del profesional de Entrenamiento, por la API («Mis ejercicios»).
//   personas       por cada persona, en pasos que se retoman si algo se corta:
//                    cuenta        por la API, como desde la APK: registro, consentimiento de datos de salud y nombre;
//                    vinculos      por SQL, con su fecha: la solicitud, la aceptación y el consentimiento (la API no
//                                  deja crear un vínculo en el pasado, y «Desde el…» de «Tus asesorados» es esa fecha);
//                    evaluaciones  por la API, con la fecha del hecho;
//                    planes        objetivos y revisiones por SQL; cada versión del plan, como borrador por la API y
//                                  activada en el pasado por SQL (la misma instantánea y los mismos hechos que la API);
//                    registros     comidas, sesiones y tomas por SQL, en lotes (la base de test está lejos);
//                    calculos      por la API: IMC, sumas de pliegues, % de grasa e índice cintura-talla de cada toma;
//                    hoy           lo de esta semana: revisiones pendientes, aplicadas hoy o con el objetivo cambiado.
//   nombres-demo   (solo test) los nombres de las cuentas de demostración DEMO-A01 y DEMO-A02, por la API.
//   resumen        cuenta lo cargado de cada persona.
// Las inserciones respetan los disparadores (no se desactivan) y escriben los hechos en la misma transacción, como la
// API. Uso: node cargar.mjs <local|test> <fase> [persona]
import fs from 'node:fs';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { REPO } from '../../rutas.mjs';
import { clienteDe, dominio } from './api.mjs';
import { EJERCICIOS_BASE, EJERCICIOS_PROPIOS, PROFESIONALES, demoProfesionales } from './catalogo.mjs';
import { claveNueva, destino, guardarCuenta, guardarEstado, leerCuentas, leerEstado } from './destino.mjs';
import { ZONA, diaMenos, instante, macros, masMinutos, planNutricional, redondear } from './herramientas.mjs';
import { METODOS, PERSONAS } from './personas.mjs';
import { etapasDe, historia, idDePrescripcion, mesDe, revisionesDe, diaDe } from './historia.mjs';
import { curva } from './herramientas.mjs';

const [nombreDestino, fase, soloPersona] = process.argv.slice(2);
const d = destino(nombreDestino);
const api = clienteDe(d.api);
const PROTOCOLO = '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f10';
const PROCEDENCIA = JSON.stringify({ fuente: 'PROPIA', casoDeUso: 'DATOS-SINTETICOS', operacion: 'SIEMBRA-COHORTE', superficie: null, requestId: null });
const hoyCivil = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// ─── Base de datos ─────────────────────────────────────────────────────────────────────────────────────────────

let prisma;
const base = () => {
  if (!prisma) {
    const { PrismaClient } = createRequire(`${REPO}/apps/api/`)('@prisma/client');
    prisma = new PrismaClient({ datasources: { db: { url: d.base } } });
  }
  return prisma;
};
const en = (fn) => base().$transaction(fn, { timeout: 900_000, maxWait: 60_000 });
const filas = (tx, texto, ...valores) => tx.$queryRawUnsafe(texto, ...valores);

/** El tipo de cada columna, leído de la base: así cada valor viaja con su conversión exacta (enumeraciones incluidas). */
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

/** Inserta filas (objetos con los nombres de las columnas) en lotes de una sola sentencia. */
async function insertar(tx, tabla, lista, tam = 250) {
  if (!lista.length) return;
  const t = await tiposDe(tx, tabla);
  const columnas = Object.keys(lista[0]);
  for (const c of columnas) if (!t[c]) throw new Error(`${tabla} no tiene la columna ${c}`);
  for (let i = 0; i < lista.length; i += tam) {
    const valores = [];
    const tuplas = lista.slice(i, i + tam).map((f) => `(${columnas.map((c) => {
      const v = f[c];
      valores.push(v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v);
      return `$${valores.length}::${NATIVOS.has(t[c]) ? t[c] : `"${t[c]}"`}`;
    }).join(',')})`);
    await tx.$executeRawUnsafe(`INSERT INTO "${tabla}" (${columnas.map((c) => `"${c}"`).join(',')}) VALUES ${tuplas.join(',')}`, ...valores);
  }
}
const proc = JSON.parse(PROCEDENCIA);

// ─── Cuentas ───────────────────────────────────────────────────────────────────────────────────────────────────

const cuentas = () => leerCuentas(d);
const sesiones = new Map();
async function sesionDe(prefijo, superficie = 'WEB') {
  const k = `${prefijo}|${superficie}`;
  if (!sesiones.has(k)) {
    const c = cuentas();
    if (!c[`${prefijo}_CORREO`]) throw new Error(`falta la cuenta ${prefijo}`);
    sesiones.set(k, await api.sesion(c[`${prefijo}_CORREO`], c[`${prefijo}_CLAVE`], superficie));
  }
  return sesiones.get(k);
}
const idDe = (prefijo) => cuentas()[`${prefijo}_ID`];
const tipoDelProfesional = (k, alcance) => PROFESIONALES[k].alcances.find(([a]) => a === alcance)[1];

async function profesionales() {
  const c = cuentas();
  const ids = {};
  for (const [k, p] of Object.entries(PROFESIONALES)) {
    const prefijo = `PRO_${k}`;
    if (c[`${prefijo}_ID`]) {
      ids[k] = c[`${prefijo}_ID`];
      continue;
    }
    const correo = `${p.correo}.${Date.now().toString(36)}@example.invalid`;
    const clave = claveNueva();
    ids[k] = await api.registrar(correo, clave, 'PROFESSIONAL', 'WEB');
    guardarCuenta(d, prefijo, { correo, clave, id: ids[k] });
  }
  guardarEstado(d, { profesionales: ids });
  fs.writeFileSync(join(d.carpeta, 'demo-profesionales.txt'), `BE_DEMO_PROFESIONALES=${demoProfesionales(ids)}\n`);
  console.log(`profesionales: ${Object.entries(ids).map(([k, id]) => `${PROFESIONALES[k].nombre} ${id}`).join(' · ')}`);
}

async function ejercicios() {
  const e = leerEstado(d);
  const propios = { ...(e.ejercicios ?? {}) };
  const t = await sesionDe('PRO_T');
  for (const [clave, nombre] of Object.entries(EJERCICIOS_PROPIOS)) {
    if (propios[clave]) continue;
    const r = await api.pedir('POST', '/training/exercises', { token: t, cuerpo: { name: nombre, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } } });
    propios[clave] = r.data.versionId;
    guardarEstado(d, { ejercicios: propios });
  }
  console.log(`ejercicios propios: ${Object.keys(propios).length}`);
}
const versionDeEjercicio = (clave) => EJERCICIOS_BASE[clave] ?? leerEstado(d).ejercicios?.[clave] ?? (() => { throw new Error(`sin ejercicio ${clave}`); })();

// ─── Vínculos en el pasado ─────────────────────────────────────────────────────────────────────────────────────

async function vincularEnElPasado(tx, { proId, aseId, alcance, tipo, momento }) {
  const finalidad = dominio.FINALIDAD_DE_ALCANCE[alcance];
  const texto = dominio.VERSION_VIGENTE[tipo === 'SANITARIO' ? 'CONSENTIMIENTO_PROFESIONAL_SANITARIO' : 'CONSENTIMIENTO_PROFESIONAL_NO_SANITARIO'];
  const aceptada = masMinutos(momento, 5 * 60 + 20);
  const otorgado = masMinutos(aceptada, 2);
  const solicitudId = randomUUID();
  const alcanceId = randomUUID();
  const consentimientoId = randomUUID();
  const versionId = randomUUID();
  // La solicitud nace PENDIENTE y la aceptación es su transición (06 §7.3.2), con su hecho en la misma transacción.
  await insertar(tx, 'solicitud_de_vinculo', [{ id: solicitudId, profesional_id: proId, asesorado_id: aseId, alcance, finalidad, iniciador: 'PROFESIONAL', estado: 'PENDIENTE', version: 1, procedencia: proc, momento_de_ocurrencia: momento, momento_de_registro: momento, vence_en: masMinutos(momento, 30 * 24 * 60) }]);
  await tx.$executeRawUnsafe(`UPDATE "solicitud_de_vinculo" SET "estado" = 'ACEPTADA', "version" = 2, "momento_de_resolucion" = $2 WHERE "id" = $1::uuid`, solicitudId, aceptada);
  let [vinculo] = await filas(tx, `SELECT "id"::text AS id FROM "vinculo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid`, proId, aseId);
  if (!vinculo) {
    vinculo = { id: randomUUID() };
    await insertar(tx, 'vinculo', [{ id: vinculo.id, profesional_id: proId, asesorado_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }]);
  }
  await insertar(tx, 'alcance_de_vinculo', [{ id: alcanceId, vinculo_id: vinculo.id, alcance, finalidad, solicitud_de_origen_id: solicitudId, estado: 'ACEPTADO', version: 1, procedencia: proc, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }]);
  await insertar(tx, 'consentimiento', [{ id: consentimientoId, alcance_de_vinculo_id: alcanceId, finalidad, situacion: 'VIGENTE', version: 1, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }]);
  await insertar(tx, 'version_de_consentimiento', [{ id: versionId, consentimiento_id: consentimientoId, decision: 'OTORGAMIENTO', situacion_resultante: 'VIGENTE', version_de_texto_id: texto.id, hash_del_texto: texto.hash, alcance, finalidad, categorias: [], superficie: 'APK', actor_id: aseId, autoria_id: aseId, procedencia: proc, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }]);
  const evento = (x) => ({ profesional_id: proId, asesorado_id: aseId, solicitud_de_vinculo_id: null, alcance_de_vinculo_id: null, consentimiento_id: null, version_de_consentimiento_id: null, estado_previo: null, procedencia: proc, ...x });
  await insertar(tx, 'evento_de_vinculo', [
    evento({ tipo: 'SolicitudDeVinculoCreada', solicitud_de_vinculo_id: solicitudId, estado_posterior: 'PENDIENTE', actor_id: proId, momento_de_ocurrencia: momento, momento_de_registro: momento }),
    evento({ tipo: 'SolicitudDeVinculoAceptada', solicitud_de_vinculo_id: solicitudId, estado_previo: 'PENDIENTE', estado_posterior: 'ACEPTADA', actor_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }),
    evento({ tipo: 'AlcanceDeVinculoAceptado', solicitud_de_vinculo_id: solicitudId, alcance_de_vinculo_id: alcanceId, estado_posterior: 'ACEPTADO', actor_id: aseId, momento_de_ocurrencia: aceptada, momento_de_registro: aceptada }),
    evento({ tipo: 'ConsentimientoOtorgado', alcance_de_vinculo_id: alcanceId, consentimiento_id: consentimientoId, version_de_consentimiento_id: versionId, estado_posterior: 'VIGENTE', actor_id: aseId, momento_de_ocurrencia: otorgado, momento_de_registro: otorgado }),
  ]);
}

// ─── Planes: activación en el pasado (la misma de generar.mjs) ─────────────────────────────────────────────────

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
const huella = (valor) => createHash('sha256').update(dominio.serializacionCanonica(valor)).digest('hex');

const T = {
  NUTRICION: { version: 'version_de_plan_nutricional', instantanea: 'instantanea_de_plan_nutricional', plan: 'plan_nutricional', evento: 'evento_de_nutricion', tipo: 'VersionDePlanActivada', recurso: 'VersionDePlanNutricional', apertura: 'version_de_apertura_id', revision: 'revision_nutricional', aplicacion: 'aplicacion_de_revision', eventoRev: 'RevisionRegistrada', recursoRev: 'RevisionNutricional', rutaPlanes: 'nutrition' },
  ENTRENAMIENTO: { version: 'version_de_plan_de_entrenamiento', instantanea: 'instantanea_de_plan_de_entrenamiento', plan: 'plan_de_entrenamiento', evento: 'evento_de_entrenamiento', tipo: 'VersionDePlanDeEntrenamientoActivada', recurso: 'VersionDePlanDeEntrenamiento', apertura: 'version_de_apertura_entrenamiento_id', revision: 'revision_de_entrenamiento', aplicacion: 'aplicacion_de_revision_de_entrenamiento', eventoRev: 'RevisionDeEntrenamientoRegistrada', recursoRev: 'RevisionDeEntrenamiento', rutaPlanes: 'training' },
};

async function activarEnElPasado(alcance, versionId, momento, profesionalId, asesoradoId) {
  const nut = alcance === 'NUTRICION';
  const t = T[alcance];
  return en(async (tx) => {
    const [v] = await filas(tx, `SELECT "plan_id"::text AS "planId", "contenido", "estado"::text AS "estado" FROM "${t.version}" WHERE "id" = $1::uuid`, versionId);
    if (!v || v.estado !== 'BORRADOR') throw new Error(`la versión ${versionId} no es un borrador`);
    const instantanea = nut
      ? dominio.construirInstantanea(v.contenido, await catalogoNutricional(tx, profesionalId, idsDeCatalogo(v.contenido)))
      : dominio.construirInstantaneaDeEntrenamiento(v.contenido, await catalogoDeEjercicios(tx, dominio.referenciasDeEjercicio(v.contenido)));
    if (!instantanea) throw new Error(`sin instantánea para ${versionId}`);
    await insertar(tx, t.instantanea, [{ id: randomUUID(), version_de_plan_id: versionId, contenido: instantanea, huella: huella(instantanea) }]);
    await tx.$executeRawUnsafe(`UPDATE "${t.version}" SET "estado" = 'ACTIVADA', "version" = "version" + 1, "momento_de_activacion" = $2 WHERE "id" = $1::uuid`, versionId, momento);
    await insertar(tx, t.evento, [{ tipo: t.tipo, profesional_id: profesionalId, asesorado_id: asesoradoId, recurso_tipo: t.recurso, recurso_id: versionId, estado_previo: 'BORRADOR', estado_posterior: 'ACTIVADA', actor_id: profesionalId, procedencia: proc, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
    await tx.$executeRawUnsafe(`UPDATE "${t.plan}" SET "version_efectiva_id" = $2::uuid WHERE "id" = $1::uuid`, v.planId, versionId);
    const [abierto] = await filas(tx, `SELECT "id"::text AS "id" FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = $3::"Alcance" AND "estado" = 'ABIERTO'`, profesionalId, asesoradoId, alcance);
    if (!abierto) {
      const procesoId = randomUUID();
      await insertar(tx, 'proceso_operativo', [{ id: procesoId, profesional_id: profesionalId, asesorado_id: asesoradoId, alcance, [t.apertura]: versionId, procedencia: proc, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
      await insertar(tx, 'evento_de_proceso', [{ tipo: 'ProcesoOperativoAbierto', proceso_id: procesoId, estado_posterior: 'ABIERTO', datos: { versionDeAperturaId: versionId, ocupacionProyectada: null }, actor_id: profesionalId, procedencia: proc, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
    }
    return instantanea;
  });
}

// ─── Planes: contenido de cada etapa ───────────────────────────────────────────────────────────────────────────

function planDeEntrenamiento(p, etapa) {
  const mes = mesDe(etapa.dia);
  return {
    blocks: [
      {
        label: etapa.rotulo,
        purpose: etapa.proposito,
        sessions: etapa.sesiones.map((s) => ({
          sessionId: s.id,
          label: s.label,
          prescriptions: s.rx.map((x) => {
            const c = curva(p.fuerza[x.curva ?? x.ejercicio] ?? [[0, 0]]);
            const base = { prescriptionId: idDePrescripcion(etapa, s, x), exerciseVersionId: versionDeEjercicio(x.ejercicio), intensity: x.rir === null ? null : { criterion: 'RIR', target: { value: x.rir } } };
            if (x.resumen === 's') return { ...base, sets: Array.from({ length: x.series }, () => ({ repetitions: null })), professionalParameters: [{ label: 'Tiempo', value: redondear(c(mes), 5), unit: 's' }] };
            if (x.resumen === 'min') return { ...base, sets: [{ repetitions: null }], professionalParameters: [{ label: 'Duración', value: Math.round(c(mes)), unit: 'min' }] };
            const sets = Array.from({ length: x.series }, () => ({ repetitions: x.reps === null ? null : { value: x.reps } }));
            const carga = x.sinCarga ? null : { value: Math.max(x.paso ?? 2.5, redondear(c(mes), x.paso ?? 2.5)), unit: 'kg' };
            return { ...base, sets, ...(carga ? { suggestedLoad: carga } : {}), ...(x.base ? { loadBasis: x.base } : {}), ...(x.lado ? { repetitionBasis: 'PER_SIDE' } : {}), ...(x.sinCarga && x.reps === null ? { professionalParameters: [{ label: 'Repeticiones', value: 'Las que salgan con buena técnica' }] } : {}) };
          }),
        })),
      },
    ],
  };
}

const contenidoDelObjetivo = (p, etapa, evaluacionId, desde) => ({
  evaluationId: evaluacionId,
  effectiveFrom: desde.toISOString(),
  effectiveUntil: null,
  estimatedEnergyRequirement: { value: etapa.kcal, unit: 'kcal/day' },
  macronutrientDistribution: macros(etapa.kcal, etapa.peso, etapa.pkg),
  mealDistribution: etapa.comidas,
  rationale: etapa.fundamento,
  methodStatement: null,
});

async function objetivoNutricionalEnElPasado(tx, { proId, aseId, contenido, momento, revisionId }) {
  let [serie] = await filas(tx, `SELECT "id"::text AS id FROM "objetivo_nutricional" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid`, proId, aseId);
  let predecesora = null;
  if (!serie) {
    serie = { id: randomUUID() };
    await insertar(tx, 'objetivo_nutricional', [{ id: serie.id, profesional_id: proId, asesorado_id: aseId, momento_de_registro: momento }]);
  } else {
    [predecesora] = await filas(tx, `SELECT v."id"::text AS id FROM "version_de_objetivo_nutricional" v WHERE v."objetivo_id" = $1::uuid AND NOT EXISTS (SELECT 1 FROM "version_de_objetivo_nutricional" s WHERE s."predecesora_id" = v."id")`, serie.id);
  }
  const id = randomUUID();
  await insertar(tx, 'version_de_objetivo_nutricional', [{ id, objetivo_id: serie.id, predecesora_id: predecesora?.id ?? null, evaluacion_id: contenido.evaluationId, vigente_desde: new Date(contenido.effectiveFrom), requerimiento_energetico: contenido.estimatedEnergyRequirement, distribucion_de_macronutrientes: contenido.macronutrientDistribution, distribucion_por_comida: contenido.mealDistribution, fundamento: contenido.rationale, revision_de_origen_id: revisionId ?? null, autor_id: proId, procedencia: proc, momento_de_registro: momento }]);
  await insertar(tx, 'evento_de_nutricion', [{ tipo: 'VersionDeObjetivoEmitida', profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'VersionDeObjetivoNutricional', recurso_id: id, actor_id: proId, procedencia: proc, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
  return id;
}

async function objetivoDeEntrenamientoEnElPasado(tx, { proId, aseId, evaluacionId, enunciado, fundamento, momento }) {
  const serie = randomUUID();
  const id = randomUUID();
  await insertar(tx, 'objetivo_de_entrenamiento', [{ id: serie, profesional_id: proId, asesorado_id: aseId, momento_de_registro: momento }]);
  await insertar(tx, 'version_de_objetivo_de_entrenamiento', [{ id, objetivo_id: serie, evaluacion_id: evaluacionId, vigente_desde: momento, objetivo: { statement: enunciado }, fundamento, autor_id: proId, procedencia: proc, momento_de_registro: momento }]);
  await insertar(tx, 'evento_de_entrenamiento', [{ tipo: 'VersionDeObjetivoDeEntrenamientoEmitida', profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'VersionDeObjetivoDeEntrenamiento', recurso_id: id, actor_id: proId, procedencia: proc, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
  return id;
}

/** Una revisión registrada en el pasado y, si se aplica, su continuidad y la próxima revisión que fija. */
async function revisionEnElPasado(tx, { area, proId, aseId, x, evidencia, momento, aplicar = true, versionDePlanCreada = null, versionDeObjetivoCreada = null, objetivoDeLaAccion = null, id = randomUUID() }) {
  const t = T[area];
  const [proceso] = await filas(tx, `SELECT "id"::text AS id, "version" FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = $3::"Alcance" AND "estado" = 'ABIERTO'`, proId, aseId, area);
  if (!proceso) throw new Error(`sin seguimiento abierto de ${area}`);
  const proximaAccion = { description: x.accion, nextReviewAt: x.proxima ?? null, ...(objetivoDeLaAccion ? { objective: objetivoDeLaAccion } : {}) };
  await insertar(tx, t.revision, [{ id, proceso_id: proceso.id, periodo_inicio: x.periodo.inicio, periodo_fin: x.periodo.fin, zona_horaria: ZONA, evidencias: evidencia, interpretacion: x.interpretacion, resultado: x.resultado, fundamento: x.fundamento, proxima_accion: proximaAccion, autor_id: proId, procedencia: proc, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
  await insertar(tx, t.evento, [{ tipo: t.eventoRev, profesional_id: proId, asesorado_id: aseId, recurso_tipo: t.recursoRev, recurso_id: id, actor_id: proId, procedencia: proc, momento_de_ocurrencia: momento, momento_de_registro: momento }]);
  if (!aplicar) return id;
  const aplicada = masMinutos(momento, 15);
  const eventoId = randomUUID();
  await insertar(tx, 'evento_de_proceso', [{ id: eventoId, tipo: 'ContinuidadOCierreAplicado', proceso_id: proceso.id, tipo_de_aplicacion: 'CONTINUIDAD', ...(area === 'ENTRENAMIENTO' ? { revision_de_entrenamiento_id: id } : { revision_id: id }), estado_previo: 'ABIERTO', estado_posterior: 'ABIERTO', datos: { resultado: x.resultado, versionDePlanCreadaId: versionDePlanCreada, versionDeObjetivoCreadaId: versionDeObjetivoCreada }, actor_id: proId, procedencia: proc, momento_de_ocurrencia: aplicada, momento_de_registro: aplicada }]);
  await insertar(tx, t.aplicacion, [{ id: randomUUID(), revision_id: id, evento_id: eventoId, tipo: 'CONTINUIDAD', estado_de_proceso_posterior: 'ABIERTO', version_de_plan_creada_id: versionDePlanCreada, version_de_objetivo_creada_id: versionDeObjetivoCreada, momento_de_registro: aplicada }]);
  await tx.$executeRawUnsafe(`UPDATE "proceso_operativo" SET "version" = "version" + 1 WHERE "id" = $1::uuid`, proceso.id);
  if (x.proxima) {
    const [terminal] = await filas(tx, `SELECT p."id"::text AS id FROM "proxima_revision" p WHERE p."proceso_id" = $1::uuid AND NOT EXISTS (SELECT 1 FROM "proxima_revision" s WHERE s."predecesora_id" = p."id")`, proceso.id);
    await insertar(tx, 'proxima_revision', [{ id: randomUUID(), proceso_id: proceso.id, predecesora_id: terminal?.id ?? null, fecha_objetivo: x.proxima, fuente: 'REVISION', ...(area === 'ENTRENAMIENTO' ? { revision_de_entrenamiento_id: id } : { revision_id: id }), actor_id: proId, procedencia: proc, momento_de_ocurrencia: aplicada, momento_de_registro: aplicada }]);
  }
  return id;
}

// ─── Personas ──────────────────────────────────────────────────────────────────────────────────────────────────

const prefijoDe = (p) => `ASE_${p.clave.toUpperCase()}`;
const proDe = (p, area) => `PRO_${p.areas[area]}`;
const fechaDe = (p, hoy, dia) => diaMenos(hoy, p.dias - dia);

async function paso(p, nombre, fn) {
  const e = leerEstado(d);
  const estado = e.personas?.[p.clave] ?? {};
  if (estado.hecho?.includes(nombre)) return estado;
  const t0 = Date.now();
  const cambios = (await fn(estado)) ?? {};
  const nuevo = { ...estado, ...cambios, hecho: [...(estado.hecho ?? []), nombre] };
  guardarEstado(d, { personas: { ...(leerEstado(d).personas ?? {}), [p.clave]: nuevo } });
  console.log(`  ${p.nombre} · ${nombre} (${Math.round((Date.now() - t0) / 1000)} s)`);
  return nuevo;
}

async function cargarPersona(p, hoy) {
  const prefijo = prefijoDe(p);
  await paso(p, 'cuenta', async () => {
    let id = idDe(prefijo);
    if (!id) {
      const correo = `${p.clave}.${p.nombre.split(' ')[1].normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase()}.${Date.now().toString(36)}@example.invalid`;
      const clave = claveNueva();
      id = await api.registrar(correo, clave, 'ADVISEE', 'APK');
      guardarCuenta(d, prefijo, { correo, clave, id });
    }
    const t = await sesionDe(prefijo, 'APK');
    await api.pedir('POST', '/me/health-data-consents', { token: t, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id }, esperado: [200, 201, 409] });
    await api.ponerNombre(t, p.nombre);
    return { aseId: id };
  });
  const aseId = idDe(prefijo);

  await paso(p, 'vinculos', () =>
    en(async (tx) => {
      const inicio = instante(fechaDe(p, hoy, Math.max(0, -3)), '19:30');
      const momento = masMinutos(inicio, -3 * 24 * 60);
      for (const area of Object.keys(p.areas)) await vincularEnElPasado(tx, { proId: idDe(proDe(p, area)), aseId, alcance: area, tipo: tipoDelProfesional(p.areas[area], area), momento });
    }),
  );

  const est = await paso(p, 'evaluaciones', async () => {
    const ev = {};
    const ocurrio = instante(fechaDe(p, hoy, 0), '09:00').toISOString();
    if (p.areas.NUTRICION) {
      const r = await api.pedir('POST', `/advisees/${aseId}/nutrition/evaluations`, {
        token: await sesionDe(proDe(p, 'NUTRICION')),
        cuerpo: { occurredAt: ocurrio, context: p.evaluacionNut.contexto, assessment: { entries: p.evaluacionNut.entradas.map(([concept, value, unit]) => ({ concept, value, ...(unit ? { unit } : {}), source: 'REPORTED' })) }, evidenceReferences: [], professionalNotes: p.evaluacionNut.notas },
      });
      ev.NUTRICION = r.data.evaluationId;
    }
    if (p.areas.ENTRENAMIENTO) {
      const r = await api.pedir('POST', `/advisees/${aseId}/training/evaluations`, {
        token: await sesionDe(proDe(p, 'ENTRENAMIENTO')),
        cuerpo: { occurredAt: ocurrio, assessment: { entries: p.evaluacionTrn.entradas.map(([concept, value]) => ({ concept, value, source: 'REPORTED' })) }, evidenceReferences: [], professionalNotes: p.evaluacionTrn.notas },
      });
      ev.ENTRENAMIENTO = r.data.evaluationId;
    }
    return { evaluaciones: ev };
  });

  await paso(p, 'planes', async () => {
    const versiones = {};
    for (const area of ['NUTRICION', 'ENTRENAMIENTO']) {
      if (!p.areas[area]) continue;
      const proId = idDe(proDe(p, area));
      const token = await sesionDe(proDe(p, area));
      const etapas = etapasDe(p, area);
      const revisiones = revisionesDe(p, area, hoy);
      const lista = (versiones[area] = []);
      let objetivoId;
      const inicio = instante(fechaDe(p, hoy, 0), '09:10');
      if (area === 'NUTRICION') objetivoId = await en((tx) => objetivoNutricionalEnElPasado(tx, { proId, aseId, contenido: contenidoDelObjetivo(p, etapas[0], est.evaluaciones.NUTRICION, inicio), momento: inicio }));
      else objetivoId = await en((tx) => objetivoDeEntrenamientoEnElPasado(tx, { proId, aseId, evaluacionId: est.evaluaciones.ENTRENAMIENTO, enunciado: etapas[0].objetivo, fundamento: 'Progresar de a poco, con la técnica primero.', momento: inicio }));
      const estructura = (e) => (area === 'NUTRICION' ? planNutricional(e.plan(), e.kcal) : planDeEntrenamiento(p, e));
      // La etapa 1.
      const primero = (await api.pedir('POST', `/advisees/${aseId}/${T[area].rutaPlanes}/plans`, { token, cuerpo: { objectiveVersionId: objetivoId, initialStructure: estructura(etapas[0]) } })).data;
      await activarEnElPasado(area, primero.planId, instante(fechaDe(p, hoy, etapas[0].dia), '10:00'), proId, aseId);
      lista.push(primero.planId);
      for (const x of revisiones) {
        const momento = instante(x.fecha, '09:00');
        const evidencia = [{ type: 'PLAN_VERSION', id: lista[lista.length - 1] }];
        if (x.etapa === null) {
          await en((tx) => revisionEnElPasado(tx, { area, proId, aseId, x, evidencia, momento }));
          continue;
        }
        const etapa = etapas[x.etapa];
        const revisionId = randomUUID();
        let versionDeObjetivoCreada = null;
        let objetivoDeLaAccion = null;
        if (area === 'NUTRICION') {
          const contenido = contenidoDelObjetivo(p, etapa, est.evaluaciones.NUTRICION, masMinutos(momento, 5));
          if (x.resultado === 'CAMBIAR_OBJETIVO') objetivoDeLaAccion = contenido;
          // La revisión va primero: el objetivo que emite la cita como origen.
          await en(async (tx) => {
            await revisionEnElPasado(tx, { area, proId, aseId, x, evidencia, momento, aplicar: false, id: revisionId, objetivoDeLaAccion });
            objetivoId = await objetivoNutricionalEnElPasado(tx, { proId, aseId, contenido, momento: masMinutos(momento, 10), revisionId: x.resultado === 'CAMBIAR_OBJETIVO' ? revisionId : null });
          });
          if (x.resultado === 'CAMBIAR_OBJETIVO') versionDeObjetivoCreada = objetivoId;
        } else {
          await en((tx) => revisionEnElPasado(tx, { area, proId, aseId, x, evidencia, momento, aplicar: false, id: revisionId }));
        }
        const borrador = (await api.pedir('POST', `/advisees/${aseId}/${T[area].rutaPlanes}/plans`, { token, cuerpo: { objectiveVersionId: objetivoId, basedOnPlanId: lista[lista.length - 1] } })).data;
        await api.pedir('PATCH', `/${T[area].rutaPlanes}/plans/${borrador.planId}`, { token, cuerpo: { expectedVersion: borrador.version, changes: estructura(etapa) } });
        await en((tx) => aplicarEnElPasado(tx, { area, proId, aseId, x, revisionId, momento, versionDePlanCreada: borrador.planId, versionDeObjetivoCreada }));
        await activarEnElPasado(area, borrador.planId, masMinutos(momento, 60), proId, aseId);
        lista.push(borrador.planId);
      }
    }
    return { versiones };
  });

  await paso(p, 'registros', async (estado) => {
    const h = historia(p, hoy, new Date(Date.now() - 20 * 60_000));
    const tomas = [];
    if (h.comidas.length) {
      const proId = idDe(proDe(p, 'NUTRICION'));
      const versiones = estado.versiones.NUTRICION;
      const inst = new Map();
      await en(async (tx) => {
        for (const id of versiones) {
          const [x] = await filas(tx, `SELECT "contenido" FROM "instantanea_de_plan_nutricional" WHERE "version_de_plan_id" = $1::uuid`, id);
          inst.set(id, x.contenido);
        }
      });
      const ingestas = [];
      const eventos = [];
      const rectificaciones = [];
      const anulaciones = [];
      for (const c of h.comidas) {
        const versionId = versiones[c.etapa];
        const dia = inst.get(versionId).dayTypes[c.diaTipo];
        const comida = dia.meals.find((m) => m.label === c.comida);
        const id = randomUUID();
        if (c.diferente) {
          ingestas.push({ id, version_de_plan_id: versionId, asesorado_id: aseId, origen: 'FUERA_DE_PRESCRIPCION', modo: 'DESCRIPCION_LIBRE', fecha_local: c.fecha, zona_horaria: ZONA, descripcion: c.diferente.descripcion, descripcion_de_porcion: c.diferente.aproximada, dia_tipo_de_contexto_id: dia.dayTypeId, comida_de_contexto_id: comida.mealId, dia_tipo_id: null, comida_id: null, opcion_id: null, cantidades_consumidas: null, secuencia: 0, procedencia: proc, momento_de_ocurrencia: c.ocurrio, momento_de_registro: c.registrado });
        } else {
          const opcion = comida.options[c.opcion];
          ingestas.push({ id, version_de_plan_id: versionId, asesorado_id: aseId, origen: 'PRESCRIPTA', modo: 'OPCIONES_DE_PLATO', fecha_local: c.fecha, zona_horaria: ZONA, descripcion: null, descripcion_de_porcion: null, dia_tipo_de_contexto_id: null, comida_de_contexto_id: null, dia_tipo_id: dia.dayTypeId, comida_id: comida.mealId, opcion_id: opcion.optionId, cantidades_consumidas: cantidadesDe(c.consumo, opcion), secuencia: 0, procedencia: proc, momento_de_ocurrencia: c.ocurrio, momento_de_registro: c.registrado });
          if (c.rectificacion) {
            rectificaciones.push({ id: randomUUID(), ingesta_id: id, cantidades: cantidadesDe({ status: 'PLAN_PORTIONS' }, opcion), autor_id: aseId, procedencia: proc, momento_de_registro: c.rectificacion.momento });
            eventos.push(eventoDeIngesta(proId, aseId, id, 'CantidadesDeIngestaRectificadas', c.rectificacion.momento));
          }
        }
        eventos.push(eventoDeIngesta(proId, aseId, id, 'IngestaRegistrada', c.ocurrio, c.registrado));
        if (c.anulacion) {
          anulaciones.push({ id: randomUUID(), ingesta_id: id, autor_id: aseId, motivo: c.anulacion.motivo, procedencia: proc, momento_de_ocurrencia: c.anulacion.momento, momento_de_registro: c.anulacion.momento });
          eventos.push(eventoDeIngesta(proId, aseId, id, 'IngestaAnulada', c.anulacion.momento));
        }
      }
      await en(async (tx) => {
        await insertar(tx, 'ingesta_nutricional', ingestas, 200);
        await insertar(tx, 'rectificacion_de_cantidades', rectificaciones);
        await insertar(tx, 'anulacion_de_ingesta', anulaciones);
        await insertar(tx, 'evento_de_nutricion', eventos, 400);
      });
    }
    if (h.sesiones.length) {
      const proId = idDe(proDe(p, 'ENTRENAMIENTO'));
      const versiones = estado.versiones.ENTRENAMIENTO;
      const borradores = [];
      const ejecuciones = [];
      const eventos = [];
      for (const s of h.sesiones) {
        const contenido = {
          exercises: s.ejercicios.map((x) =>
            x.resumen
              ? { prescriptionId: x.prescriptionId, performedExerciseVersionId: versionDeEjercicio(x.ejercicio), executionSummary: { description: x.resumen } }
              : { prescriptionId: x.prescriptionId, performedExerciseVersionId: versionDeEjercicio(x.ejercicio), sets: x.sets },
          ),
          sessionSummary: null,
        };
        const borradorId = randomUUID();
        const ejecucionId = randomUUID();
        const versionId = versiones[s.etapa];
        borradores.push({ id: borradorId, asesorado_id: aseId, version_de_plan_id: versionId, sesion_planificada_id: s.sesion, fecha_local: s.fecha, zona_horaria: ZONA, granularidad: s.granularidad, condicion: s.condicion, motivo: s.motivo, contenido, momento_de_ocurrencia: s.ocurrio, momento_de_registro: s.ocurrio, momento_de_actualizacion: s.registrado });
        ejecuciones.push({ id: ejecucionId, asesorado_id: aseId, version_de_plan_id: versionId, sesion_planificada_id: s.sesion, fecha_local: s.fecha, zona_horaria: ZONA, borrador_id: borradorId, granularidad: s.granularidad, condicion: s.condicion, motivo: s.motivo, contenido, procedencia: proc, momento_de_ocurrencia: s.ocurrio, momento_de_registro: s.registrado });
        eventos.push({ tipo: 'EjecucionRegistrada', profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'EjecucionDeEntrenamiento', recurso_id: ejecucionId, estado_previo: 'BORRADOR', estado_posterior: 'REGISTRADA', actor_id: aseId, procedencia: proc, momento_de_ocurrencia: s.ocurrio, momento_de_registro: s.registrado });
      }
      await en(async (tx) => {
        await insertar(tx, 'borrador_de_ejecucion_de_entrenamiento', borradores, 150);
        await insertar(tx, 'ejecucion_de_entrenamiento', ejecuciones, 150);
        await insertar(tx, 'evento_de_entrenamiento', eventos, 400);
      });
    }
    if (h.tomas.length) {
      const proId = idDe(proDe(p, 'ANTROPOMETRIA'));
      const evaluaciones = [];
      const mediciones = [];
      const eventos = [];
      for (const t of h.tomas) {
        const evaluacionId = randomUUID();
        const ids = {};
        evaluaciones.push({ id: evaluacionId, profesional_id: proId, asesorado_id: aseId, procedencia: proc, momento_de_ocurrencia: t.ocurrio, momento_de_registro: t.ocurrio });
        for (const [metrica, valor, unidad] of t.mediciones) {
          const id = randomUUID();
          ids[metrica] = id;
          mediciones.push({ id, evaluacion_id: evaluacionId, metrica, valor, unidad_de_origen: unidad, protocolo_version_id: PROTOCOLO, origen: 'CAPTURA_DIRECTA', clase: 'MEDIDO', procedencia: proc, momento_de_ocurrencia: t.ocurrio, momento_de_registro: t.registrado });
        }
        eventos.push({ tipo: 'EvaluacionAntropometricaRegistrada', evaluacion_id: evaluacionId, actor_id: proId, procedencia: proc, momento_de_ocurrencia: t.registrado, momento_de_registro: t.registrado });
        tomas.push({ evaluacionId, fecha: t.fecha, registrado: t.registrado.toISOString(), mediciones: ids });
      }
      await en(async (tx) => {
        await insertar(tx, 'evaluacion_antropometrica', evaluaciones, 200);
        await insertar(tx, 'medicion_antropometrica', mediciones, 200);
        for (let i = 0; i < tomas.length; i += 200) {
          const parte = tomas.slice(i, i + 200);
          const valores = parte.flatMap((x) => [x.evaluacionId, new Date(x.registrado)]);
          await tx.$executeRawUnsafe(
            `UPDATE "evaluacion_antropometrica" e SET "estado" = 'REGISTRADA', "momento_de_registro_de_evaluacion" = v.m FROM (VALUES ${parte.map((_, j) => `($${2 * j + 1}::uuid, $${2 * j + 2}::timestamptz)`).join(',')}) AS v(id, m) WHERE e."id" = v.id`,
            ...valores,
          );
        }
        await insertar(tx, 'evento_de_antropometria', eventos, 400);
      });
    }
    return { tomas, cantidades: { comidas: h.comidas.length, sesiones: h.sesiones.length, tomas: h.tomas.length } };
  });

  await paso(p, 'calculos', async (estado) => {
    if (!estado.tomas?.length) return {};
    const token = await sesionDe(proDe(p, 'ANTROPOMETRIA'));
    const metodos = await metodosDe(token);
    const claves = p.sinPliegues ? METODOS.sinPliegues[p.sexo] : METODOS[p.sexo];
    let n = 0;
    for (const toma of estado.tomas) {
      for (const regla of claves) {
        const m = metodos.find((x) => x.ruleId === regla);
        if (!m) throw new Error(`el catálogo no ofrece ${regla}`);
        const bindings = m.requiredInputs.map((i) => ({ inputCode: i.inputCode, sourceRef: toma.mediciones[i.metric] }));
        if (bindings.some((b) => !b.sourceRef)) continue;
        await api.pedir('POST', `/advisees/${aseId}/calculations`, { token, cuerpo: { purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: m.methodVersionId, inputBindings: bindings } });
        n++;
      }
    }
    return { calculos: n };
  });

  await paso(p, 'hoy', async (estado) => {
    // Federico: la revisión de Entrenamiento de ayer, registrada y sin aplicar.
    if (p.pendienteTrn) {
      const x = { ...p.pendienteTrn, periodo: { inicio: fechaDe(p, hoy, etapasDe(p, 'ENTRENAMIENTO').at(-1).dia), fin: diaMenos(hoy, p.pendienteTrn.hace + 1) } };
      await en((tx) => revisionEnElPasado(tx, { area: 'ENTRENAMIENTO', proId: idDe(proDe(p, 'ENTRENAMIENTO')), aseId, x, evidencia: [{ type: 'PLAN_VERSION', id: estado.versiones.ENTRENAMIENTO.at(-1) }], momento: instante(diaMenos(hoy, p.pendienteTrn.hace), '20:00'), aplicar: false }));
    }
    // Héctor: la revisión que cambió el objetivo, hace ocho días, ya aplicada.
    if (p.cambioDeObjetivo) {
      const c = p.cambioDeObjetivo;
      const proId = idDe(proDe(p, 'NUTRICION'));
      const momento = instante(diaMenos(hoy, c.hace), '10:00');
      const contenido = contenidoDelObjetivo(p, c, estado.evaluaciones.NUTRICION, masMinutos(momento, 15));
      const anterior = revisionesDe(p, 'NUTRICION', hoy).at(-1);
      const x = { resultado: 'CAMBIAR_OBJETIVO', interpretacion: c.interpretacion, fundamento: c.fundamentoDeRevision, accion: c.accion, proxima: diaMenos(hoy, -c.proxima), periodo: { inicio: anterior ? anterior.fecha : fechaDe(p, hoy, 0), fin: diaMenos(hoy, c.hace + 1) } };
      await en(async (tx) => {
        const revisionId = await revisionEnElPasado(tx, { area: 'NUTRICION', proId, aseId, x, evidencia: [{ type: 'PLAN_VERSION', id: estado.versiones.NUTRICION.at(-1) }], momento, aplicar: false, objetivoDeLaAccion: contenido });
        const objetivo = await objetivoNutricionalEnElPasado(tx, { proId, aseId, contenido, momento: masMinutos(momento, 15), revisionId });
        await aplicarEnElPasado(tx, { area: 'NUTRICION', proId, aseId, x, revisionId, momento, versionDePlanCreada: null, versionDeObjetivoCreada: objetivo });
      });
    }
    // Camila: el profesional registra hoy la revisión del bloque y la aplica por la API: queda un borrador del plan.
    if (p.hoyTrn) {
      const token = await sesionDe(proDe(p, 'ENTRENAMIENTO'));
      const resultadoApi = Object.entries(dominio.RESULTADO_DESDE_API).find(([, v]) => v === p.hoyTrn.resultado)[0];
      const anterior = revisionesDe(p, 'ENTRENAMIENTO', hoy).at(-1);
      const r = await api.pedir('POST', `/advisees/${aseId}/training/reviews`, {
        token,
        cuerpo: { period: { start: anterior.fecha, end: diaMenos(hoy, 1), timeZone: ZONA }, evidenceReferences: [{ type: 'PLAN_VERSION', id: estado.versiones.ENTRENAMIENTO.at(-1) }], interpretation: p.hoyTrn.interpretacion, result: resultadoApi, rationale: p.hoyTrn.fundamento, nextAction: { description: p.hoyTrn.accion, nextReviewAt: diaMenos(hoy, -p.hoyTrn.proxima) } },
      });
      await api.pedir('POST', `/training/reviews/${r.data.reviewId}/apply`, { token, cuerpo: { expectedVersion: r.data.version ?? 'v1' } });
    }
    return {};
  });
}

/** La continuidad aplicada de una revisión ya registrada (la parte de aplicar de `revisionEnElPasado`). */
async function aplicarEnElPasado(tx, { area, proId, aseId, x, revisionId, momento, versionDePlanCreada, versionDeObjetivoCreada }) {
  const t = T[area];
  const [proceso] = await filas(tx, `SELECT "id"::text AS id FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "asesorado_id" = $2::uuid AND "alcance" = $3::"Alcance" AND "estado" = 'ABIERTO'`, proId, aseId, area);
  const aplicada = masMinutos(momento, 15);
  const eventoId = randomUUID();
  await insertar(tx, 'evento_de_proceso', [{ id: eventoId, tipo: 'ContinuidadOCierreAplicado', proceso_id: proceso.id, tipo_de_aplicacion: 'CONTINUIDAD', ...(area === 'ENTRENAMIENTO' ? { revision_de_entrenamiento_id: revisionId } : { revision_id: revisionId }), estado_previo: 'ABIERTO', estado_posterior: 'ABIERTO', datos: { resultado: x.resultado, versionDePlanCreadaId: versionDePlanCreada, versionDeObjetivoCreadaId: versionDeObjetivoCreada }, actor_id: proId, procedencia: proc, momento_de_ocurrencia: aplicada, momento_de_registro: aplicada }]);
  await insertar(tx, t.aplicacion, [{ id: randomUUID(), revision_id: revisionId, evento_id: eventoId, tipo: 'CONTINUIDAD', estado_de_proceso_posterior: 'ABIERTO', version_de_plan_creada_id: versionDePlanCreada, version_de_objetivo_creada_id: versionDeObjetivoCreada, momento_de_registro: aplicada }]);
  await tx.$executeRawUnsafe(`UPDATE "proceso_operativo" SET "version" = "version" + 1 WHERE "id" = $1::uuid`, proceso.id);
  if (x.proxima) {
    const [terminal] = await filas(tx, `SELECT p."id"::text AS id FROM "proxima_revision" p WHERE p."proceso_id" = $1::uuid AND NOT EXISTS (SELECT 1 FROM "proxima_revision" s WHERE s."predecesora_id" = p."id")`, proceso.id);
    await insertar(tx, 'proxima_revision', [{ id: randomUUID(), proceso_id: proceso.id, predecesora_id: terminal?.id ?? null, fecha_objetivo: x.proxima, fuente: 'REVISION', ...(area === 'ENTRENAMIENTO' ? { revision_de_entrenamiento_id: revisionId } : { revision_id: revisionId }), actor_id: proId, procedencia: proc, momento_de_ocurrencia: aplicada, momento_de_registro: aplicada }]);
  }
}

function cantidadesDe(consumo, opcion) {
  if (consumo.status === 'UNCONFIRMED') return { status: 'UNCONFIRMED', items: [] };
  if (consumo.status === 'PLAN_PORTIONS') return { status: 'PLAN_PORTIONS', items: opcion.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity, notEaten: false })) };
  return {
    status: 'REPORTED',
    items: opcion.items.map((it, i) => {
      const f = consumo.factores[i];
      if (f === 'NO_COMIDO') return { itemId: it.itemId, quantity: null, notEaten: true };
      return { itemId: it.itemId, quantity: { value: Math.max(1, redondear(it.quantity.value * f, it.quantity.unit === 'ml' ? 10 : 5)), unit: it.quantity.unit }, notEaten: false };
    }),
  };
}
const eventoDeIngesta = (proId, aseId, ingestaId, tipo, ocurrio, registrado = ocurrio) => ({ tipo, profesional_id: proId, asesorado_id: aseId, recurso_tipo: 'IngestaNutricional', recurso_id: ingestaId, actor_id: aseId, procedencia: proc, momento_de_ocurrencia: ocurrio, momento_de_registro: registrado });

async function metodosDe(token) {
  const todos = [];
  let cursor = null;
  do {
    const r = await api.pedir('GET', `/professional-methods?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { token });
    todos.push(...r.data);
    cursor = r.page?.nextCursor ?? null;
  } while (cursor);
  return todos;
}

async function personas() {
  const e = leerEstado(d);
  const hoy = e.hoy ?? hoyCivil();
  if (hoy !== hoyCivil()) throw new Error(`la cohorte se empezó a cargar el ${hoy} y hoy es ${hoyCivil()}: cargala de nuevo en una base nueva`);
  guardarEstado(d, { hoy });
  for (const p of PERSONAS) {
    if (soloPersona && p.clave !== soloPersona) continue;
    console.log(`${p.nombre}:`);
    await cargarPersona(p, hoy);
  }
}

async function nombresDemo() {
  if (d.nombre !== 'test') throw new Error('nombres-demo es solo para test');
  const archivo = 'C:/Users/bufim/BE-Best/.env.cuentas-demo';
  const env = Object.fromEntries(fs.readFileSync(archivo, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
  for (const [k, nombre] of [['DEMO_A01', 'Martina Gómez'], ['DEMO_A02', 'Lucas Fernández']]) {
    const t = await api.sesion(env[`${k}_CORREO`], env[`${k}_CLAVE`], 'APK');
    await api.ponerNombre(t, nombre);
    console.log(`${k}: ${nombre}`);
  }
}

async function resumen() {
  const e = leerEstado(d);
  for (const p of PERSONAS) {
    const x = e.personas?.[p.clave];
    if (!x) continue;
    console.log(`${p.nombre}: ${x.hecho.join(', ')} · ${JSON.stringify(x.cantidades ?? {})} · cálculos ${x.calculos ?? 0} · versiones ${Object.entries(x.versiones ?? {}).map(([a, v]) => `${a} ${v.length}`).join(', ')}`);
  }
}

const FASES = { profesionales, ejercicios, personas, 'nombres-demo': nombresDemo, resumen };
if (!FASES[fase]) throw new Error(`Fase desconocida «${fase}». Fases: ${Object.keys(FASES).join(', ')}.`);
try {
  await FASES[fase]();
} finally {
  if (prisma) await prisma.$disconnect();
}
void diaDe;
