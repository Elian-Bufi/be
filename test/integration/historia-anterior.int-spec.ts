/**
 * WP-HISTORIA-ANTERIOR (DEUDA_LEGAJO DL-175; 08 §14.1, «Cambio de profesional»; REG-06-55; RF-025) · la historia anterior
 * de un área, por la API real y contra PostgreSQL:
 * - TEST-HA-020: sin la autorización de la persona, API-HIA-04 da el 404 de lo inexistente; la persona ve que antes hubo
 *   otro profesional y que no lo decidió.
 * - TEST-HA-021: con la autorización, lo de antes del otro profesional, marcado y sin nombrarlo: las versiones activadas
 *   (no el borrador), lo registrado, las decisiones; nunca la nota propia ni las notas internas.
 * - TEST-HA-022: lo propio de quien lee (de un acompañamiento suyo anterior) no aparece.
 * - TEST-HA-023: la idempotencia, el conflicto de versión y el texto vigente.
 * - TEST-HA-024: la auditoría y el registro de cada lectura, que la persona ve.
 * - TEST-HA-025: retirada, 404; retirar dos veces, 409.
 * - TEST-HA-026: otra área, 404; y una lectura no trae nada de otra área.
 * - TEST-HA-027: sin el vínculo aceptado o sin el B2 vigentes, 404.
 * - TEST-HA-028: lo que otro profesional registró después del comienzo de quien lee no es historia anterior.
 * - TEST-HA-029: Entrenamiento: el plan y las sesiones registradas.
 * - TEST-HA-030: lo ajeno y lo terminado, el A3 y el cierre de la cuenta.
 * - TEST-HA-031: la base sostiene lo suyo aunque el código se equivoque.
 * Y lo que sumó la revisión adversaria (2026-11-15):
 * - TEST-HA-032: la última lectura es del componente de vínculo, no del par profesional–área; un vínculo terminado con el
 *   que la miraron sigue en API-HIA-01, en solo lectura.
 * - TEST-HA-033: las carreras, ordenadas por la base y no por el tiempo: un retiro y una lectura nunca se cruzan, autorizar
 *   espera a quien está terminando el componente, y el retiro de un cierre lleva la hora de después del cerrojo.
 * - TEST-HA-034: las lecturas de API-HIA-01 usan su índice parcial, no recorren `decision_de_acceso`.
 * (TEST-HA-026 a 028 suman lo de antes «como estaba» y el cálculo que no es de Antropometría; TEST-HA-027, que revocar el
 * B2 la retira y otorgarlo de nuevo no la devuelve; TEST-HA-030, que sin el A3 no hay acceso hoy.)
 */
import type { INestApplication } from '@nestjs/common';
import { HistoriaAnteriorDeUnAreaResponseSchema, HistoriaAnteriorResponseSchema, MiHistoriaAnteriorResponseSchema, TEXTO_DE_LA_HISTORIA_ANTERIOR } from '@be/domain';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { consultasDeLasLecturas } from '../../apps/api/src/historia-anterior/autorizaciones';
import { appDePrueba, claveDeIdempotencia, conSesion, cuerpoDeCierre } from './soporte-api';
import { esperarQueEsperen, pidDeLaTransaccion } from './soporte-concurrencia';
import { borradorSembrado, circuitoAntropometrico, medicionSembrada, registrarBorrador } from './soporte-antropometria';
import { circuitoConPlanDeEntrenamientoActivo } from './soporte-entrenamiento';
import { activar, alimento, circuitoConPlanActivo, crearBorrador, cuerpoDeEvaluacion, cuerpoDeObjetivo, cuerpoDeRevision, registrarComida, registrarLibre, type Circuito } from './soporte-nutricion';
import { a3Vigente, finalizar, pausar, prepararProfesional, reanudar, revocarB2, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

type Area = 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA';
const TEXTO = TEXTO_DE_LA_HISTORIA_ANTERIOR.id;

/** Las cuatro operaciones con la sesión de un actor; las escrituras llevan una Idempotency-Key nueva salvo que se pase una. */
function hia(token: string) {
  const s = conSesion(app, token);
  return {
    mia: () => s.get('/api/v1/me/previous-history'),
    autorizar: (relationshipId: string, cuerpo: unknown, clave?: string) => s.put(`/api/v1/me/previous-history/${relationshipId}`, clave).send(cuerpo as object),
    retirar: (relationshipId: string, cuerpo: unknown, clave?: string) => s.post(`/api/v1/me/previous-history/${relationshipId}/withdrawal`, clave).send(cuerpo as object),
    leer: (adviseeId: string, area: string, consulta = '') => s.get(`/api/v1/advisees/${adviseeId}/previous-history/${area}${consulta}`),
  };
}
const miaDe = async (p: Parte) => MiHistoriaAnteriorResponseSchema.parse((await hia(p.token).mia().expect(200)).body).data;
const leerOk = async (pro: Parte, ase: Parte, area: Area, consulta = '') => HistoriaAnteriorResponseSchema.parse((await hia(pro.token).leer(ase.id, area, consulta).expect(200)).body).data;
/** Autorizar con la versión que la persona ve. */
async function autorizar(ase: Parte, relationshipId: string, status = 200) {
  const item = (await miaDe(ase)).items.find((i) => i.relationshipId === relationshipId);
  return hia(ase.token).autorizar(relationshipId, { expectedVersion: item?.authorization?.version ?? null, textVersionId: TEXTO }).expect(status);
}
const finalizarVinculo = async (ase: Parte, vinculoId: string) => finalizar(app, ase.token, vinculoId, await versionDeVinculo(app, ase.token, vinculoId)).expect(200);

/** Un plan nutricional activado de `pro` con `ase` (evaluación, objetivo, borrador y activación), con su primer día tipo. */
async function planNutricionalDe(pro: Parte, ase: Parte) {
  const ev = await conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(201);
  const ob = await conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/nutrition/objectives`).send(cuerpoDeObjetivo(ev.body.data.evaluationId as string)).expect(201);
  const c = { pro, ase, objectiveVersionId: ob.body.data.versionId as string, arroz: await alimento(app, pro, 'Arroz blanco'), pollo: await alimento(app, pro, 'Pechuga de pollo') } as unknown as Circuito;
  const b = await crearBorrador(app, c);
  await activar(app, pro, b.planId, b.version).expect(200);
  const dia = (b.body.dayTypes as { dayTypeId: string; meals: { mealId: string; options: { optionId: string; items: { itemId: string }[] }[] }[] }[])[0]!;
  return { planId: b.planId, objectiveVersionId: c.objectiveVersionId, dia };
}

/**
 * El caso de Dirección: la persona tuvo a R (que ahora vuelve), después a A, y vuelve con R. De A quedan un plan activado, dos
 * comidas registradas, una revisión, una nota propia y un borrador sucesor; de R, su plan de antes y una comida.
 */
async function cambioDeProfesional(etiqueta: string) {
  const r = await circuitoConPlanActivo(app, `ha-${etiqueta}-${++contador}`);
  const ase = r.ase;
  const R = r.pro;
  await registrarComida(app, ase, r.planId, r.dia).expect(201);
  await finalizarVinculo(ase, r.vinculoId);
  const A = await prepararProfesional(app, `ha-a-${etiqueta}-${contador}`, ['NUTRICION']);
  const vA = await vinculoCompleto(app, A, ase, 'NUTRICION');
  const planA = await planNutricionalDe(A, ase);
  const comida = (await registrarComida(app, ase, planA.planId, planA.dia).expect(201)).body.data.executionId as string;
  await registrarLibre(app, ase, planA.planId, 'Comí una tarta de verdura en lo de mi abuela').expect(201);
  const revision = (await conSesion(app, A.token).post(`/api/v1/advisees/${ase.id}/nutrition/reviews`).send(cuerpoDeRevision([{ type: 'EXECUTION', id: comida }], 'ADJUST')).expect(201)).body.data.reviewId as string;
  const nota = (await conSesion(app, A.token).post(`/api/v1/advisees/${ase.id}/professional-notes`).send({ text: 'Nota privada de la nutricionista anterior: no se comparte' }).expect(201)).body.data.noteId as string;
  const borrador = (await conSesion(app, A.token).post(`/api/v1/advisees/${ase.id}/nutrition/plans`).send({ objectiveVersionId: planA.objectiveVersionId, basedOnPlanId: planA.planId }).expect(201)).body.data.planId as string;
  await finalizarVinculo(ase, vA.vinculoId);
  // R vuelve: un componente nuevo, con su B2. Su comienzo es el corte.
  const vR = await vinculoCompleto(app, R, ase, 'NUTRICION');
  return { ase, R, A, planDeR: r.planId, planA, revision, nota, borrador, relA: vA.vinculoId, relR: vR.vinculoId, consentR: vR.consentId as string };
}

/** Una versión de la autorización escrita a mano (las pruebas de la base y de las carreras), con la sesión que se pase. */
function insertarVersion(
  cliente: Pick<PrismaClient, '$executeRawUnsafe'>,
  v: { asesorado: string; profesional: string; alcance: string; componente: string; version: number; predecesora: string | null; estado: 'VIGENTE' | 'RETIRADA'; actor: string },
) {
  const vigente = v.estado === 'VIGENTE';
  return cliente.$executeRawUnsafe(
    `INSERT INTO "autorizacion_de_historia_anterior" ("asesorado_id","profesional_id","alcance","alcance_de_vinculo_id","version","predecesora_id","estado","texto_id","hash_del_texto","actor_id","procedencia","momento_de_ocurrencia")
     VALUES ('${v.asesorado}','${v.profesional}','${v.alcance}','${v.componente}',${v.version},${v.predecesora ? `'${v.predecesora}'` : 'NULL'},'${v.estado}',${vigente ? `'${TEXTO}'` : 'NULL'},${vigente ? `'${TEXTO_DE_LA_HISTORIA_ANTERIOR.hash}'` : 'NULL'},'${v.actor}','{"prueba":"ha"}', now())`,
  );
}

/** Una corrida de cálculo sobre una toma, escrita a mano como en las pruebas de la base de WP-05 (`maquinas-wp05`). */
async function corridaSembrada(c: { pro: Parte; metodoVersionId: string }, evaluacionId: string, x: { valor: number; finalidad: 'SOPORTE_ANTROPOMETRICO' | 'SOPORTE_DE_OBJETIVO_NUTRICIONAL'; reemplazaA?: string }): Promise<string> {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "ejecucion_de_calculo" ("id","evaluacion_id","metodo_version_id","autor_id","metrica","valor","unidad","decimales","modo_de_redondeo","finalidad","regla","reemplaza_a_id","procedencia")
     VALUES ('${id}','${evaluacionId}','${c.metodoVersionId}','${c.pro.id}','indice-demo',${x.valor},'kg/m2',2,'MEDIO_ARRIBA','${x.finalidad}','demo/peso-sobre-talla-cuadrado@1',${x.reemplazaA ? `'${x.reemplazaA}'` : 'NULL'},'{"prueba":"ha"}')`,
  );
  return id;
}

describe('WP-HISTORIA-ANTERIOR · la historia anterior de un área, para el profesional nuevo (DL-175)', () => {
  it('TEST-HA-020 a 025 · sin la autorización, 404; con ella, lo de antes del otro, marcado y sin nombrarlo, sin lo propio de quien lee ni las notas; idempotencia, auditoría, lecturas y retiro', async () => {
    const e = await cambioDeProfesional('caso');
    const inexistente = await hia(e.R.token).leer(randomUUID(), 'NUTRICION').expect(404);

    // ─── TEST-HA-020 · sin la autorización ───
    const antes = await miaDe(e.ase);
    expect(antes.text).toMatchObject({ id: TEXTO, textHash: TEXTO_DE_LA_HISTORIA_ANTERIOR.hash, approval: 'PENDING_APPROVAL' });
    // Solo los profesionales de hoy: A terminó y no figura; R figura con su componente nuevo, y antes hubo otro.
    expect(antes.items).toEqual([
      {
        relationshipId: e.relR,
        area: 'NUTRICION',
        professional: { identityId: e.R.id, displayName: expect.any(String) },
        relationshipState: 'ACEPTADO',
        hadEarlierProfessional: true,
        includes: ['PLANS', 'RECORDS', 'DECISIONS'],
        authorization: null,
        // Hoy R la acompaña con el B2 y el A3 de la persona: si la compartiera, la vería (HA-T15).
        accessInEffect: true,
        lastReadAt: null,
      },
    ]);
    expect(antes.accesses).toEqual([]);
    const sinAutorizar = await hia(e.R.token).leer(e.ase.id, 'NUTRICION').expect(404);
    expect(sinAutorizar.body).toEqual(inexistente.body);
    // Un profesional ajeno, con un id que no es de nadie y con un área que no existe: el mismo 404.
    const ajeno = await prepararProfesional(app, `ha-ajeno-${contador}`, ['NUTRICION']);
    expect((await hia(ajeno.token).leer(e.ase.id, 'NUTRICION').expect(404)).body).toEqual(inexistente.body);
    expect((await hia(e.R.token).leer(e.ase.id, 'OTRA').expect(404)).body).toEqual(inexistente.body);
    expect((await hia(e.R.token).leer('no-es-un-id', 'NUTRICION').expect(404)).body).toEqual(inexistente.body);

    // ─── TEST-HA-023 · autorizar: el texto vigente, la versión vista y la idempotencia ───
    const viejo = await hia(e.ase.token).autorizar(e.relR, { expectedVersion: null, textVersionId: 'historia-anterior-2025-01-propuesta' }).expect(409);
    expect(viejo.body.error.code).toBe('CONSENT_VERSION_STALE');
    expect((await hia(e.ase.token).autorizar(e.relR, { expectedVersion: 'v1', textVersionId: TEXTO }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    expect((await hia(e.ase.token).autorizar(e.relR, { expectedVersion: null, textVersionId: TEXTO, area: 'NUTRICION' }).expect(400)).body.error.code).toBe('UNKNOWN_FIELD');
    await conSesion(app, e.ase.token).put(`/api/v1/me/previous-history/${e.relR}`, '').send({ expectedVersion: null, textVersionId: TEXTO }).expect(400);
    const clave = claveDeIdempotencia();
    const dada = await hia(e.ase.token).autorizar(e.relR, { expectedVersion: null, textVersionId: TEXTO }, clave).expect(200);
    const item = HistoriaAnteriorDeUnAreaResponseSchema.parse(dada.body).data;
    expect(item).toMatchObject({ relationshipId: e.relR, authorization: { state: 'GRANTED', version: 'v1' } });
    // El mismo pedido con la misma clave: la misma respuesta, sin otra versión. Otro cuerpo con esa clave: 409.
    expect((await hia(e.ase.token).autorizar(e.relR, { expectedVersion: null, textVersionId: TEXTO }, clave).expect(200)).body).toEqual(dada.body);
    expect((await hia(e.ase.token).autorizar(e.relR, { expectedVersion: 'v1', textVersionId: TEXTO }, clave).expect(409)).body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    // Autorizar lo ya autorizado, con lo último que vio: nada cambia.
    expect(HistoriaAnteriorDeUnAreaResponseSchema.parse((await hia(e.ase.token).autorizar(e.relR, { expectedVersion: 'v1', textVersionId: TEXTO }).expect(200)).body).data.authorization).toMatchObject({ state: 'GRANTED', version: 'v1' });
    expect(await prisma.autorizacionDeHistoriaAnterior.count({ where: { alcanceDeVinculoId: e.relR } })).toBe(1);

    // ─── TEST-HA-021 y 022 · lo que lee R ───
    const h = await leerOk(e.R, e.ase, 'NUTRICION');
    expect(h).toMatchObject({ area: 'NUTRICION', otherProfessionals: 1, includes: ['PLANS', 'RECORDS', 'DECISIONS'], measurements: [] });
    expect(h.extent).not.toBeNull();
    // Las versiones: solo la activada de A (ni el borrador sucesor ni el plan de R de antes).
    expect(h.planVersions.map((v) => v.planVersionId)).toEqual([e.planA.planId]);
    expect(h.planVersions[0]).toMatchObject({ author: { kind: 'OTHER_PROFESSIONAL', ordinal: 1 }, number: 1, content: { kind: 'NUTRITION' } });
    // Terminó antes del corte (o seguía vigente): si seguía, no dice hasta cuándo ni por qué terminó.
    const v = h.planVersions[0]!;
    expect(v.inEffectAtYourStart ? v.to === null && v.endReason === null : v.to !== null).toBe(true);
    const contenido = h.planVersions[0]!.content;
    expect(contenido.kind === 'NUTRITION' && contenido.dayTypes[0]!.meals.map((m) => m.label)).toEqual(['Almuerzo', 'Cena']);
    // Lo registrado: las dos comidas de A, no la de R; cada una marcada.
    expect(h.records).toHaveLength(2);
    expect(h.records.every((r) => r.kind === 'MEAL' && r.planVersionId === e.planA.planId && r.author.ordinal === 1)).toBe(true);
    expect(h.records.find((r) => r.kind === 'MEAL' && r.type === 'PLAN_OPTION')).toMatchObject({ meal: 'Almuerzo', option: 'Arroz con pollo', annulled: false });
    expect(h.records.find((r) => r.kind === 'MEAL' && r.type === 'DIFFERENT')).toMatchObject({ description: 'Comí una tarta de verdura en lo de mi abuela' });
    // La decisión: resultado, fundamento y próxima acción; ni la interpretación ni las evidencias.
    expect(h.decisions).toEqual([
      { reviewId: e.revision, author: { kind: 'OTHER_PROFESSIONAL', ordinal: 1 }, recordedAt: expect.any(String), date: expect.any(String), reviewedPeriod: { from: expect.any(String), to: expect.any(String) }, result: 'ADJUST', rationale: 'Fundamento profesional sintético.', nextAction: { description: 'Próxima acción sintética.', nextReviewAt: null } },
    ]);
    // Lo que no puede estar en ningún lado de la respuesta: el nombre y el id de A, su nota propia, las notas internas de la
    // evaluación, la interpretación de la revisión, el borrador, y el plan y la comida de R de antes.
    const json = JSON.stringify(h);
    const nombreDeA = (await prisma.perfilProfesional.findUniqueOrThrow({ where: { identidadId: e.A.id } })).nombreVisible as string;
    for (const prohibido of [e.A.id, nombreDeA, e.nota, 'Nota privada', 'Notas sintéticas del profesional', 'Consulta inicial sintética', 'Interpretación no diagnóstica', e.borrador, e.planDeR, e.R.id]) expect(json).not.toContain(prohibido);

    // ─── TEST-HA-024 · la auditoría y las lecturas que ve la persona ───
    const tramo = `?periodStart=${h.period.from}&periodEnd=${h.period.to}`;
    expect(await leerOk(e.R, e.ase, 'NUTRICION', tramo)).toEqual(h);
    const despues = await miaDe(e.ase);
    expect(despues.items[0]!.lastReadAt).not.toBeNull();
    expect(despues.accesses).toHaveLength(2);
    expect(despues.accesses[0]).toMatchObject({ professional: { identityId: e.R.id }, area: 'NUTRICION' });
    expect(await prisma.decisionDeAcceso.count({ where: { operacion: 'API-HIA-04', resultado: 'PERMITIDA', sujetoId: e.ase.id, actorId: e.R.id } })).toBe(2);
    const exito = await prisma.registroDeAuditoria.findFirstOrThrow({ where: { operacion: 'API-HIA-02', resultado: 'EXITO', actorId: e.ase.id } });
    expect(exito).toMatchObject({ recursoTipo: 'AutorizacionDeHistoriaAnterior', sujetoId: e.ase.id });
    // El 404 sin autorización quedó auditado con su motivo, que la respuesta no dice.
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-HIA-04', resultado: 'RECHAZO', actorId: e.R.id, motivo: 'HISTORIA_ANTERIOR_NO_AUTORIZADA' } })).toBe(1);
    const fila = await prisma.autorizacionDeHistoriaAnterior.findFirstOrThrow({ where: { alcanceDeVinculoId: e.relR } });
    expect(fila).toMatchObject({ asesoradoId: e.ase.id, profesionalId: e.R.id, alcance: 'NUTRICION', estado: 'VIGENTE', version: 1, textoId: TEXTO, hashDelTexto: TEXTO_DE_LA_HISTORIA_ANTERIOR.hash, actorId: e.ase.id });

    // ─── TEST-HA-025 · retirarla corta en el momento; retirar dos veces, 409 ───
    expect((await hia(e.ase.token).retirar(e.relR, { expectedVersion: 'v2' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    const retirada = HistoriaAnteriorDeUnAreaResponseSchema.parse((await hia(e.ase.token).retirar(e.relR, { expectedVersion: 'v1' }).expect(200)).body).data;
    expect(retirada.authorization).toMatchObject({ state: 'WITHDRAWN', version: 'v2' });
    expect((await hia(e.R.token).leer(e.ase.id, 'NUTRICION').expect(404)).body).toEqual(inexistente.body);
    expect((await hia(e.ase.token).retirar(e.relR, { expectedVersion: 'v2' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    // Darla otra vez es una versión nueva.
    expect(HistoriaAnteriorDeUnAreaResponseSchema.parse((await autorizar(e.ase, e.relR)).body).data.authorization).toMatchObject({ state: 'GRANTED', version: 'v3' });
    await leerOk(e.R, e.ase, 'NUTRICION');
  }, 240_000);

  it('TEST-HA-026 a 028 · otra área, 404; sin el vínculo aceptado o sin el B2, 404; lo registrado después del comienzo de quien lee no es anterior', async () => {
    // La persona tiene una antropometrista A con una toma registrada (una medición vigente y una anulada) y otra en
    // preparación. Después llega X, que la acompaña en Nutrición y en Antropometría.
    const c = await circuitoAntropometrico(app, prisma, `ha-ant-${++contador}`);
    const toma = await borradorSembrado(prisma, c);
    const peso = await medicionSembrada(prisma, c, toma, { metrica: 'peso', valor: 71.2, unidad: 'kg' });
    const anulada = await medicionSembrada(prisma, c, toma, { metrica: 'cintura', valor: 80, unidad: 'cm' });
    // Lo que calculó A sobre la toma: una corrida para el soporte antropométrico (lo que la persona ve en su evolución) y
    // otra para el soporte de un objetivo nutricional, que no es de Antropometría para la persona y no entra.
    const corrida = await corridaSembrada(c, toma, { valor: 23.67, finalidad: 'SOPORTE_ANTROPOMETRICO' });
    await corridaSembrada(c, toma, { valor: 31.5, finalidad: 'SOPORTE_DE_OBJETIVO_NUTRICIONAL' });
    // Anular es el camino posterior al registro (REG-06-214 inciso 5): primero se registra la toma.
    await registrarBorrador(prisma, toma);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia") VALUES ('${randomUUID()}','${anulada}','${c.pro.id}','Error de carga','{"prueba":"ha"}', now())`,
    );
    const enPreparacion = await borradorSembrado(prisma, c);
    await medicionSembrada(prisma, c, enPreparacion, { metrica: 'peso', valor: 99, unidad: 'kg' });
    const X = await prepararProfesional(app, `ha-x-${contador}`, ['NUTRICION', 'ANTROPOMETRIA']);
    const vNut = await vinculoCompleto(app, X, c.ase, 'NUTRICION');
    const vAnt = await vinculoCompleto(app, X, c.ase, 'ANTROPOMETRIA');
    const inexistente = await hia(X.token).leer(randomUUID(), 'NUTRICION').expect(404);

    // ─── TEST-HA-026 · otra área ───
    const mia = await miaDe(c.ase);
    expect(mia.items.map((i) => [i.area, i.professional.identityId, i.hadEarlierProfessional, i.includes])).toEqual([
      ['NUTRICION', X.id, false, ['PLANS', 'RECORDS', 'DECISIONS']],
      ['ANTROPOMETRIA', c.pro.id, false, ['MEASUREMENTS']],
      ['ANTROPOMETRIA', X.id, true, ['MEASUREMENTS']],
    ]);
    await autorizar(c.ase, vNut.vinculoId);
    // Autorizado en Nutrición, no en Antropometría: lo de Antropometría es el 404 de lo inexistente.
    expect((await hia(X.token).leer(c.ase.id, 'ANTROPOMETRIA').expect(404)).body).toEqual(inexistente.body);
    // Y lo de Nutrición no trae nada de Antropometría (ni hubo otro nutricionista).
    const nut = await leerOk(X, c.ase, 'NUTRICION');
    expect(nut).toMatchObject({ otherProfessionals: 0, extent: null, planVersions: [], records: [], measurements: [], decisions: [] });
    expect(JSON.stringify(nut)).not.toContain('71.2');
    await autorizar(c.ase, vAnt.vinculoId);
    const ant = await leerOk(X, c.ase, 'ANTROPOMETRIA');
    expect(ant).toMatchObject({ area: 'ANTROPOMETRIA', otherProfessionals: 1, includes: ['MEASUREMENTS'], planVersions: [], records: [], decisions: [] });
    // La toma registrada, con su protocolo y sin la medición anulada; la que está en preparación no aparece.
    expect(ant.measurements).toHaveLength(1);
    expect(ant.measurements[0]).toMatchObject({ evaluationId: toma, author: { kind: 'OTHER_PROFESSIONAL', ordinal: 1 }, measurements: [{ metric: 'peso', magnitude: { value: 71.2, unit: 'kg' }, origin: 'DIRECT_CAPTURE', corrected: false }] });
    expect(ant.measurements[0]!.measurements[0]!.protocolName).toEqual(expect.any(String));
    // Lo calculado: solo la corrida del soporte antropométrico, con su método; la del objetivo nutricional, no.
    expect(ant.measurements[0]!.derivedResults).toEqual([{ metric: 'indice-demo', magnitude: { value: 23.67, unit: 'kg/m2' }, methodName: expect.any(String) }]);
    expect(JSON.stringify(ant)).not.toContain('31.5');
    expect(JSON.stringify(ant)).not.toContain(enPreparacion);
    expect(JSON.stringify(ant)).not.toContain(c.pro.id);

    // ─── TEST-HA-028 · A sigue acompañándola: lo que registra después del comienzo de X no es historia anterior ───
    const nueva = await borradorSembrado(prisma, c);
    await medicionSembrada(prisma, c, nueva, { metrica: 'peso', valor: 70.4, unidad: 'kg' });
    await registrarBorrador(prisma, nueva);
    expect((await leerOk(X, c.ase, 'ANTROPOMETRIA')).measurements.map((m) => m.evaluationId)).toEqual([toma]);
    // Y lo que cambia sobre la toma de antes, después del comienzo de X, tampoco: una corrección del peso, un recálculo que
    // reemplaza la corrida y, al final, la anulación del peso. X la sigue viendo como estaba cuando empezó (HA-T03).
    await prisma.$executeRawUnsafe(
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","autor_id","motivo","valor","unidad_de_origen","procedencia") VALUES ('${randomUUID()}','${peso}','${c.pro.id}','Recarga',69.9,'kg','{"prueba":"ha"}')`,
    );
    await corridaSembrada(c, toma, { valor: 24.1, finalidad: 'SOPORTE_ANTROPOMETRICO', reemplazaA: corrida });
    await prisma.$executeRawUnsafe(
      `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia") VALUES ('${randomUUID()}','${peso}','${c.pro.id}','Error de carga','{"prueba":"ha"}', now())`,
    );
    const comoEstaba = (await leerOk(X, c.ase, 'ANTROPOMETRIA')).measurements[0]!;
    expect(comoEstaba.measurements).toEqual([{ metric: 'peso', magnitude: { value: 71.2, unit: 'kg' }, protocolName: expect.any(String), origin: 'DIRECT_CAPTURE', corrected: false }]);
    expect(comoEstaba.derivedResults).toEqual([{ metric: 'indice-demo', magnitude: { value: 23.67, unit: 'kg/m2' }, methodName: expect.any(String) }]);
    expect(JSON.stringify(comoEstaba)).not.toMatch(/69\.9|24\.1/);

    // ─── TEST-HA-027 · sin el vínculo aceptado o sin el B2 vigentes, 404 ───
    await pausar(app, c.ase.token, vAnt.vinculoId, await versionDeVinculo(app, c.ase.token, vAnt.vinculoId)).expect(200);
    expect((await hia(X.token).leer(c.ase.id, 'ANTROPOMETRIA').expect(404)).body).toEqual(inexistente.body);
    // En pausa, la persona la sigue viendo y puede retirarla o darla; y la API dice que hoy no tiene acceso (la APK no dice
    // «La ve», HA-T15).
    expect((await miaDe(c.ase)).items.find((i) => i.relationshipId === vAnt.vinculoId)).toMatchObject({ relationshipState: 'PAUSADO', authorization: { state: 'GRANTED' }, accessInEffect: false });
    await reanudar(app, c.ase.token, vAnt.vinculoId, await versionDeVinculo(app, c.ase.token, vAnt.vinculoId)).expect(200);
    expect((await miaDe(c.ase)).items.find((i) => i.relationshipId === vAnt.vinculoId)).toMatchObject({ relationshipState: 'ACEPTADO', accessInEffect: true });
    await leerOk(X, c.ase, 'ANTROPOMETRIA');
    await revocarB2(app, c.ase, vAnt.consentId as string).expect(200);
    expect((await hia(X.token).leer(c.ase.id, 'ANTROPOMETRIA').expect(404)).body).toEqual(inexistente.body);
    // HA-T14: revocar el B2 de ese componente retira también la historia anterior, en la misma transacción y con la
    // persona como actor. Hoy no tiene acceso, y la APK lo dice.
    const revocada = (await miaDe(c.ase)).items.find((i) => i.relationshipId === vAnt.vinculoId)!;
    expect(revocada).toMatchObject({ authorization: { state: 'WITHDRAWN', version: 'v2' }, accessInEffect: false });
    const cadena = await prisma.autorizacionDeHistoriaAnterior.findMany({ where: { alcanceDeVinculoId: vAnt.vinculoId }, orderBy: { version: 'asc' } });
    expect(cadena.map((v) => [v.estado, v.actorId])).toEqual([
      ['VIGENTE', c.ase.id],
      ['RETIRADA', c.ase.id],
    ]);
    expect(cadena[1]!.procedencia).toMatchObject({ operacion: 'API-CON-04' });
    // Otorgar el B2 de nuevo (API-CON-02, OtorgarNuevamente sobre el mismo componente) devuelve el acceso, no la historia:
    // el B2 nuevo no dice nada de ella, y la persona tiene que volver a compartirla (08 §14.1).
    const requisitos = await conSesion(app, c.ase.token).get(`/api/v1/relationships/${vAnt.vinculoId}/consent-requirements`).expect(200);
    await conSesion(app, c.ase.token).post(`/api/v1/relationships/${vAnt.vinculoId}/consents`).send({ consentVersionId: requisitos.body.data.consentVersion.id }).expect(200);
    expect((await miaDe(c.ase)).items.find((i) => i.relationshipId === vAnt.vinculoId)).toMatchObject({ authorization: { state: 'WITHDRAWN', version: 'v2' }, accessInEffect: true });
    expect((await hia(X.token).leer(c.ase.id, 'ANTROPOMETRIA').expect(404)).body).toEqual(inexistente.body);
    // Compartirla otra vez es una decisión nueva, con el texto vigente: v3.
    expect(HistoriaAnteriorDeUnAreaResponseSchema.parse((await autorizar(c.ase, vAnt.vinculoId)).body).data).toMatchObject({ authorization: { state: 'GRANTED', version: 'v3' }, accessInEffect: true });
    await leerOk(X, c.ase, 'ANTROPOMETRIA');

    // El tramo: las dos fechas juntas, válidas y hasta 366 días; nada más en la query.
    const tramoVacio = await leerOk(X, c.ase, 'NUTRICION', '?periodStart=2020-01-01&periodEnd=2020-03-01');
    expect(tramoVacio.period).toEqual({ from: '2020-01-01', to: '2020-03-01' });
    expect((await hia(X.token).leer(c.ase.id, 'NUTRICION', '?periodStart=2020-01-01').expect(400)).body.error.details.issues).toEqual([{ code: 'REQUIRED', path: 'periodEnd' }]);
    expect((await hia(X.token).leer(c.ase.id, 'NUTRICION', '?periodStart=2020-01-01&periodEnd=2021-03-01').expect(400)).body.error.details.issues).toEqual([{ code: 'PERIOD_TOO_LONG', path: 'periodEnd' }]);
    await hia(X.token).leer(c.ase.id, 'NUTRICION', '?desde=2020-01-01').expect(400);
  }, 240_000);

  it('TEST-HA-029 · Entrenamiento: el plan de antes, con sus bloques, y la sesión registrada con su condición', async () => {
    const t = await circuitoConPlanDeEntrenamientoActivo(app, `ha-trn-${++contador}`);
    const apk = conSesion(app, t.ase.token);
    const ocurrencia = (await apk.get('/api/v1/me/training/today').expect(200)).body.data.occurrences[0].occurrenceId as string;
    const borrador = (await apk.put(`/api/v1/training/occurrences/${ocurrencia}/execution-draft`).send({}).expect(201)).body.data;
    const guardado = (await apk.patch(`/api/v1/training/execution-drafts/${borrador.draftId}`).send({ expectedVersion: borrador.version, changes: { sessionCondition: 'NOT_COMPLETED' } }).expect(200)).body.data;
    const registrada = (await apk.post(`/api/v1/training/execution-drafts/${borrador.draftId}/confirm`).send({ expectedVersion: guardado.version }).expect(201)).body.data.executionId as string;
    const T2 = await prepararProfesional(app, `ha-t2-${contador}`, ['ENTRENAMIENTO']);
    const v2 = await vinculoCompleto(app, T2, t.ase, 'ENTRENAMIENTO');
    expect((await miaDe(t.ase)).items.find((i) => i.relationshipId === v2.vinculoId)).toMatchObject({ hadEarlierProfessional: true, authorization: null });
    await autorizar(t.ase, v2.vinculoId);
    const h = await leerOk(T2, t.ase, 'ENTRENAMIENTO');
    expect(h.planVersions.map((v) => v.planVersionId)).toEqual([t.planId]);
    expect(h.planVersions[0]).toMatchObject({ inEffectAtYourStart: true, to: null, endReason: null, content: { kind: 'TRAINING' } });
    const bloques = h.planVersions[0]!.content;
    expect(bloques.kind === 'TRAINING' && bloques.blocks[0]!.sessions.map((s) => s.label)).toEqual(['Sesión A', 'Sesión B']);
    expect(h.records).toEqual([
      { kind: 'SESSION', recordId: registrada, author: { kind: 'OTHER_PROFESSIONAL', ordinal: 1 }, planVersionId: t.planId, date: expect.any(String), session: expect.any(String), condition: 'NOT_COMPLETED', corrected: false, exercises: 0 },
    ]);
    expect(JSON.stringify(h)).not.toContain(t.pro.id);
  }, 240_000);

  it('TEST-HA-030 · lo ajeno es 404; un vínculo terminado no se autoriza pero se puede retirar; sin el A3 no se da; cerrar la cuenta la retira', async () => {
    const e = await cambioDeProfesional('reglas');
    const otra = await circuitoConPlanActivo(app, `ha-otra-${contador}`);
    // El componente de otra persona, o uno que no existe: el mismo 404.
    const ajeno = await hia(e.ase.token).autorizar(otra.vinculoId, { expectedVersion: null, textVersionId: TEXTO }).expect(404);
    expect((await hia(e.ase.token).autorizar(randomUUID(), { expectedVersion: null, textVersionId: TEXTO }).expect(404)).body).toEqual(ajeno.body);
    expect((await hia(e.ase.token).retirar(otra.vinculoId, { expectedVersion: 'v1' }).expect(404)).body).toEqual(ajeno.body);
    // Darla pide el A3; retirarla, no.
    await autorizar(e.ase, e.relR);
    await conSesion(app, e.ase.token).post(`/api/v1/me/health-data-consents/${await a3Vigente(app, e.ase.token)}/revoke`).send({}).expect(200);
    // Sin el A3 la autorización sigue dada (como los hábitos y lo de otras áreas: el A3 es de todo BE, HA-T14), pero hoy no
    // tiene acceso, y la API lo dice para que la APK no diga «La ve» (HA-T15).
    expect((await miaDe(e.ase)).items[0]).toMatchObject({ authorization: { state: 'GRANTED', version: 'v1' }, accessInEffect: false });
    await hia(e.R.token).leer(e.ase.id, 'NUTRICION').expect(404);
    const retirada = HistoriaAnteriorDeUnAreaResponseSchema.parse((await hia(e.ase.token).retirar(e.relR, { expectedVersion: 'v1' }).expect(200)).body).data;
    expect(retirada.authorization).toMatchObject({ state: 'WITHDRAWN' });
    expect((await hia(e.ase.token).autorizar(e.relR, { expectedVersion: 'v2', textVersionId: TEXTO }).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    // Un vínculo terminado: no se autoriza (404), pero lo que estaba dado se puede retirar.
    const p = await circuitoConPlanActivo(app, `ha-fin-${contador}`);
    const N = await prepararProfesional(app, `ha-n-${contador}`, ['NUTRICION']);
    const vN = await vinculoCompleto(app, N, p.ase, 'NUTRICION');
    await autorizar(p.ase, vN.vinculoId);
    await finalizarVinculo(p.ase, vN.vinculoId);
    expect((await hia(p.ase.token).autorizar(vN.vinculoId, { expectedVersion: 'v1', textVersionId: TEXTO }).expect(404)).body).toEqual(ajeno.body);
    expect(HistoriaAnteriorDeUnAreaResponseSchema.parse((await hia(p.ase.token).retirar(vN.vinculoId, { expectedVersion: 'v1' }).expect(200)).body).data).toMatchObject({ relationshipState: 'FINALIZADO', authorization: { state: 'WITHDRAWN', version: 'v2' } });
    // Cerrar la cuenta retira lo que estaba dado.
    const q = await circuitoConPlanActivo(app, `ha-cierre-${contador}`);
    const M = await prepararProfesional(app, `ha-m-${contador}`, ['NUTRICION']);
    const vM = await vinculoCompleto(app, M, q.ase, 'NUTRICION');
    await autorizar(q.ase, vM.vinculoId);
    await conSesion(app, q.ase.token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).expect(201);
    const versiones = await prisma.autorizacionDeHistoriaAnterior.findMany({ where: { alcanceDeVinculoId: vM.vinculoId }, orderBy: { version: 'asc' } });
    expect(versiones.map((v) => v.estado)).toEqual(['VIGENTE', 'RETIRADA']);
  }, 240_000);

  it('TEST-HA-031 · la base: solo se agrega, la da la persona del componente, sucede a la última, VIGENTE con su texto y no sobre un vínculo terminado', async () => {
    const e = await cambioDeProfesional('base');
    await autorizar(e.ase, e.relR);
    const fila = await prisma.autorizacionDeHistoriaAnterior.findFirstOrThrow({ where: { alcanceDeVinculoId: e.relR } });
    const regla = /check_violation|23514|BE:|solo agregar|append/i;
    await expect(prisma.$executeRawUnsafe(`UPDATE "autorizacion_de_historia_anterior" SET "estado" = 'RETIRADA' WHERE "id" = '${fila.id}'`)).rejects.toThrow();
    await expect(prisma.$executeRawUnsafe(`DELETE FROM "autorizacion_de_historia_anterior" WHERE "id" = '${fila.id}'`)).rejects.toThrow();
    await expect(prisma.$executeRawUnsafe('TRUNCATE "autorizacion_de_historia_anterior"')).rejects.toThrow();
    const insertar = (cambios: Record<string, string>) => {
      const v = { asesorado: e.ase.id, profesional: e.R.id, alcance: 'NUTRICION', componente: e.relR, version: '2', predecesora: `'${fila.id}'`, estado: 'RETIRADA', texto: 'NULL', hash: 'NULL', actor: e.ase.id, ...cambios };
      return prisma.$executeRawUnsafe(
        `INSERT INTO "autorizacion_de_historia_anterior" ("asesorado_id","profesional_id","alcance","alcance_de_vinculo_id","version","predecesora_id","estado","texto_id","hash_del_texto","actor_id","procedencia","momento_de_ocurrencia")
         VALUES ('${v.asesorado}','${v.profesional}','${v.alcance}','${v.componente}',${v.version},${v.predecesora},'${v.estado}',${v.texto},${v.hash},'${v.actor}','{"prueba":"ha"}', now())`,
      );
    };
    // Otro actor que la persona, otro profesional u otra área que los del componente, una VIGENTE sin texto, una que no
    // sucede a la última, una segunda primera versión.
    await expect(insertar({ actor: e.R.id })).rejects.toThrow(regla);
    await expect(insertar({ profesional: e.A.id })).rejects.toThrow(regla);
    await expect(insertar({ alcance: 'ANTROPOMETRIA' })).rejects.toThrow(regla);
    await expect(insertar({ estado: 'VIGENTE' })).rejects.toThrow(regla);
    await expect(insertar({ version: '3' })).rejects.toThrow(regla);
    await expect(insertar({ version: '1', predecesora: 'NULL' })).rejects.toThrow();
    // Cada versión cambia el estado de la anterior (la revisión): una VIGENTE, con su texto, sobre otra VIGENTE, no entra.
    await expect(insertar({ estado: 'VIGENTE', texto: `'${TEXTO}'`, hash: `'${TEXTO_DE_LA_HISTORIA_ANTERIOR.hash}'` })).rejects.toThrow(/cambia el estado de la anterior/);
    // Y la primera versión la da: un componente sin decisión no empieza retirado (el de A, terminado, nunca la tuvo).
    await expect(insertar({ profesional: e.A.id, componente: e.relA, version: '1', predecesora: 'NULL' })).rejects.toThrow(/historia anterior la da \(VIGENTE\)/);
    // Lo válido entra: una RETIRADA que sucede a la última.
    await insertar({});
    // Una RETIRADA sobre otra RETIRADA, tampoco.
    const segunda = await prisma.autorizacionDeHistoriaAnterior.findFirstOrThrow({ where: { alcanceDeVinculoId: e.relR, version: 2 } });
    await expect(insertar({ version: '3', predecesora: `'${segunda.id}'` })).rejects.toThrow(/cambia el estado de la anterior/);
    // Y una VIGENTE no se da sobre un vínculo terminado.
    await finalizarVinculo(e.ase, e.relR);
    await expect(
      insertar({ version: '3', predecesora: `'${segunda.id}'`, estado: 'VIGENTE', texto: `'${TEXTO}'`, hash: `'${TEXTO_DE_LA_HISTORIA_ANTERIOR.hash}'` }),
    ).rejects.toThrow(/no se autoriza sobre un v.nculo terminado/);
  }, 240_000);

  it('TEST-HA-032 · la última lectura es del componente de vínculo: la de un vínculo anterior con el mismo profesional no aparece debajo del nuevo; el terminado queda, en solo lectura', async () => {
    const e = await cambioDeProfesional('miro');
    await autorizar(e.ase, e.relR);
    await leerOk(e.R, e.ase, 'NUTRICION');
    await finalizarVinculo(e.ase, e.relR);
    // R vuelve otra vez: un componente nuevo, que la persona nunca autorizó.
    const vR3 = await vinculoCompleto(app, e.R, e.ase, 'NUTRICION');
    const mia = await miaDe(e.ase);
    const nuevo = mia.items.find((i) => i.relationshipId === vR3.vinculoId)!;
    expect(nuevo).toMatchObject({ relationshipState: 'ACEPTADO', hadEarlierProfessional: true, authorization: null, accessInEffect: true, lastReadAt: null });
    // El vínculo terminado con el que la miró sigue en la lista, con su última lectura, para que la persona sepa cuándo
    // (HA-T08): sin acceso hoy.
    const terminado = mia.items.find((i) => i.relationshipId === e.relR)!;
    expect(terminado).toMatchObject({ relationshipState: 'FINALIZADO', accessInEffect: false, authorization: { state: 'GRANTED', version: 'v1' } });
    expect(terminado.lastReadAt).toEqual(mia.accesses[0]!.readAt);
    // Los terminados con los que nadie la miró no aparecen (el primero de R y el de A).
    expect(mia.items.map((i) => i.relationshipId).sort()).toEqual([e.relR, vR3.vinculoId].sort());
    // Autorizado de nuevo, todavía no la miró con este componente; cuando la mira, la línea es la de este.
    expect(HistoriaAnteriorDeUnAreaResponseSchema.parse((await autorizar(e.ase, vR3.vinculoId)).body).data).toMatchObject({ authorization: { state: 'GRANTED', version: 'v1' }, lastReadAt: null });
    await leerOk(e.R, e.ase, 'NUTRICION');
    const despues = await miaDe(e.ase);
    const leido = despues.items.find((i) => i.relationshipId === vR3.vinculoId)!.lastReadAt;
    expect(leido).toEqual(despues.accesses[0]!.readAt);
    expect(leido).not.toEqual(terminado.lastReadAt);
  }, 240_000);

  it('TEST-HA-033 · las carreras, por la base: autorizar espera a quien termina el componente; un retiro queda antes o después de cada lectura; el retiro de un cierre lleva la hora de después del cerrojo', async () => {
    const e = await cambioDeProfesional('carrera');
    const tomar = `hashtextextended('historia-anterior|${e.ase.id}', 0)`;
    /** Una transacción de la prueba que retiene algo mientras llega el pedido; lo suelta cuando la base dice que espera. */
    async function mientrasRetengo<T>(retener: (tx: Prisma.TransactionClient) => Promise<unknown>, pedido: () => Promise<T>, que: string): Promise<{ respuesta: T; soltadoEn: Date }> {
      let respuesta: Promise<T> | undefined;
      let termino = false;
      let soltadoEn = new Date(0);
      await prisma.$transaction(
        async (tx) => {
          await retener(tx);
          const pid = await pidDeLaTransaccion(tx);
          respuesta = pedido().finally(() => {
            termino = true;
          });
          await esperarQueEsperen(prisma, 1, { bloqueadoPor: pid, yaPaso: () => termino, que });
          // Si el pedido terminó sin esperar, la barrera no prueba nada: la carrera no está ordenada por la base.
          expect(termino).toBe(false);
          const [ahora] = await tx.$queryRaw<{ ahora: Date }[]>`SELECT clock_timestamp() AS "ahora"`;
          soltadoEn = ahora!.ahora;
        },
        { timeout: 40_000, maxWait: 10_000 },
      );
      return { respuesta: await (respuesta as Promise<T>), soltadoEn };
    }

    // 1 · Autorizar toma el componente en modo compartido: quien lo está terminando (FOR NO KEY UPDATE) va primero.
    const autorizada = await mientrasRetengo(
      (tx) => tx.$queryRaw`SELECT 1 FROM "alcance_de_vinculo" WHERE "id" = ${e.relR}::uuid FOR NO KEY UPDATE`,
      () => hia(e.ase.token).autorizar(e.relR, { expectedVersion: null, textVersionId: TEXTO }).then((r) => r),
      'autorizar esperando el componente',
    );
    expect(autorizada.respuesta.status).toBe(200);

    // 2 · Un retiro en curso (con el cerrojo de la historia, exclusivo) y una lectura que llega: la lectura espera, y cuando
    // sigue ya lo ve retirado. El mismo 404 de lo inexistente.
    const v1 = await prisma.autorizacionDeHistoriaAnterior.findFirstOrThrow({ where: { alcanceDeVinculoId: e.relR, version: 1 } });
    const leida = await mientrasRetengo(
      async (tx) => {
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${tomar})`);
        await insertarVersion(tx, { asesorado: e.ase.id, profesional: e.R.id, alcance: 'NUTRICION', componente: e.relR, version: 2, predecesora: v1.id, estado: 'RETIRADA', actor: e.ase.id });
      },
      () => hia(e.R.token).leer(e.ase.id, 'NUTRICION').then((r) => r),
      'la lectura esperando el retiro',
    );
    expect(leida.respuesta.status).toBe(404);

    // 3 · Al revés: una lectura en curso (el cerrojo compartido) y un retiro que llega. El retiro espera, y su hora es la de
    // la base después del cerrojo: queda después de la lectura también en el tiempo.
    await autorizar(e.ase, e.relR);
    const retirada = await mientrasRetengo(
      (tx) => tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock_shared(${tomar})`),
      () => hia(e.ase.token).retirar(e.relR, { expectedVersion: 'v3' }).then((r) => r),
      'el retiro esperando la lectura',
    );
    expect(retirada.respuesta.status).toBe(200);
    const v4 = await prisma.autorizacionDeHistoriaAnterior.findFirstOrThrow({ where: { alcanceDeVinculoId: e.relR, version: 4 } });
    expect(v4.estado).toBe('RETIRADA');
    expect(v4.momentoDeOcurrencia.getTime()).toBeGreaterThanOrEqual(retirada.soltadoEn.getTime());

    // 4 · Cerrar la cuenta con una lectura en curso: el cierre espera el cerrojo de la historia, y su RETIRADA lleva la hora
    // de la base de después, no la de llegada del pedido (prisma/concurrencia.ts).
    await autorizar(e.ase, e.relR);
    const cerrada = await mientrasRetengo(
      (tx) => tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock_shared(${tomar})`),
      () => conSesion(app, e.ase.token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).then((r) => r),
      'el cierre esperando la lectura',
    );
    expect(cerrada.respuesta.status).toBe(201);
    const v6 = await prisma.autorizacionDeHistoriaAnterior.findFirstOrThrow({ where: { alcanceDeVinculoId: e.relR, version: 6 } });
    expect(v6.estado).toBe('RETIRADA');
    expect(v6.momentoDeOcurrencia.getTime()).toBeGreaterThanOrEqual(cerrada.soltadoEn.getTime());
  }, 240_000);

  it('TEST-HA-034 · las lecturas de API-HIA-01 usan su índice parcial, no recorren decision_de_acceso; el índice que nadie usaba no está', async () => {
    const persona = randomUUID();
    for (const consulta of [consultasDeLasLecturas.recientes(persona, 50), consultasDeLasLecturas.ultimaPorComponente(persona)]) {
      // Sin el recorrido secuencial, el plan tiene que elegir entre los índices: el parcial de la historia es el que sirve.
      const plan = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('SET LOCAL enable_seqscan = off');
        return tx.$queryRaw<{ 'QUERY PLAN': string }[]>(Prisma.sql`EXPLAIN ${consulta}`);
      });
      expect(plan.map((f) => f['QUERY PLAN']).join('\n')).toContain('decision_de_acceso_lecturas_de_la_historia_anterior');
    }
    const [indice] = await prisma.$queryRaw<{ indexdef: string }[]>`SELECT indexdef FROM pg_indexes WHERE indexname = 'decision_de_acceso_lecturas_de_la_historia_anterior'`;
    expect(indice?.indexdef).toContain('(sujeto_id, secuencia DESC)');
    expect(indice?.indexdef).toContain("'API-HIA-04'");
    expect(await prisma.$queryRaw<unknown[]>`SELECT 1 FROM pg_indexes WHERE indexname = 'autorizacion_de_historia_anterior_lector_idx'`).toEqual([]);
  }, 60_000);
});
