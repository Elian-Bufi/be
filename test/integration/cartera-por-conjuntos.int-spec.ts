/**
 * WP-CARTERA-LECTURA-POR-CONJUNTOS (2026-10-28) · API-CAR-01 leída por conjuntos: lo mismo, con menos consultas.
 *
 * Lo que estas pruebas fijan:
 * - la lectura por conjuntos devuelve EXACTAMENTE la misma respuesta que la lectura persona por persona (la copia congelada
 *   de `main` e4512cb en soporte-cartera-anterior.ts es el oráculo): carteras vacías, chicas, una mixta (tres áreas,
 *   personas con varios pendientes, todos los estados de plan, historia) y una grande; con cada filtro, el período, límites y
 *   páginas consecutivas (sin omisiones ni repetidos); con empates totales del orden; ante cortes (consentimiento revocado,
 *   vínculo pausado, reanudado y finalizado); entre profesionales; y con un asesorado como actor;
 * - por HTTP, la respuesta pasa el contrato y coincide con el oráculo;
 * - cada pedido deja las mismas filas en decision_de_acceso: 3 por persona con vínculo aceptado (una por alcance), como antes;
 * - lo que crece con las personas es solo el PDP: la lectura no agrega sentencias por persona. Se cuenta con
 *   pg_stat_statements (precargado en el contenedor de estas pruebas); sin él, esa prueba se omite y lo dice.
 */
import type { INestApplication } from '@nestjs/common';
import { CarteraResponseSchema, type CapacidadDeCliente, type CarteraResponse, type TipoDePendiente } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PdpService } from '../../apps/api/src/autorizacion/pdp.service';
import { leerCartera, type ConsultaDeCartera } from '../../apps/api/src/cartera/lectura-cartera';
import type { ContextoDeSolicitud } from '../../apps/api/src/http/contexto';
import { ErrorDeApi } from '../../apps/api/src/http/errores';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { ProcesoService } from '../../apps/api/src/proceso/proceso.service';
import { borradorSembrado, medicionSembrada, registrarBorrador, sembrarEspecificaciones, type CircuitoAntropometrico } from './soporte-antropometria';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { leerCarteraAnterior } from './soporte-cartera-anterior';
import { activarPlanDeEntrenamiento, borradorDeEjecucion, crearBorradorDeEntrenamiento, cuerpoDeEvaluacionDeEntrenamiento, cuerpoDeObjetivoDeEntrenamiento, ejecucion, type CircuitoParaPlanificar } from './soporte-entrenamiento';
import { activar, circuitoListoParaPlanificar, crearBorrador, cuerpoDeRevision, registrarComida } from './soporte-nutricion';
import { finalizar, pausar, prepararAsesorado, prepararProfesional, reanudar, revocarB2, versionDeVinculo, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let servicios: { prisma: PrismaService; pdp: PdpService; procesos: ProcesoService };
let contador = 0;
const etiqueta = (): string => `cpc-${++contador}-${randomUUID().slice(0, 4)}`;

const ZONA = 'America/Argentina/Buenos_Aires';
const hoyCivil = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());
const hace = (dias: number): string => {
  const [a, m, d] = hoyCivil().split('-').map(Number);
  return new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, (d ?? 1) - dias)).toISOString().slice(0, 10);
};
const enDias = (n: number): string => hace(-n);

const TIPOS: readonly TipoDePendiente[] = ['REVIEW_OVERDUE', 'REVIEW_DUE_SOON', 'REVIEW_UNDATED', 'PLAN_DRAFT_PENDING', 'NO_ACTIVE_PLAN', 'FORM_REQUEST_OPEN', 'ANTHRO_DRAFT_PENDING'];
const CONSULTA: ConsultaDeCartera = { periodo: { start: null, end: null }, domain: null, kind: null, limit: 50, cursor: null };
/** Lo que el website y la APK pueden pedir: sin filtro, por dominio, por tipo, con período de actividad y combinado. */
const CONSULTAS: readonly Partial<ConsultaDeCartera>[] = [
  {},
  { domain: 'nutrition' },
  { domain: 'training' },
  { domain: 'anthropometry' },
  ...TIPOS.map((kind) => ({ kind })),
  { periodo: { start: '2099-01-01', end: null } },
  { periodo: { start: hace(30), end: hoyCivil() } },
  { periodo: { start: null, end: hace(10) } },
  { domain: 'nutrition', kind: 'NO_ACTIVE_PLAN' },
];

beforeAll(async () => {
  app = await appDePrueba();
  servicios = { prisma: app.get(PrismaService), pdp: app.get(PdpService), procesos: app.get(ProcesoService) };
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

// ─── Las dos lecturas ────────────────────────────────────────────────────────────────────────

const contexto = (): ContextoDeSolicitud => ({ requestId: `prueba-${randomUUID()}`, momentoDeRecepcion: new Date(), superficie: 'WEB', direccionIp: null, agenteDeUsuario: null, capacidades: new Set<CapacidadDeCliente>() });
const nueva = (actorId: string, c: Partial<ConsultaDeCartera> = {}): Promise<CarteraResponse> => leerCartera(servicios.prisma, servicios.pdp, servicios.procesos, actorId, contexto(), { ...CONSULTA, ...c });
const anterior = (actorId: string, c: Partial<ConsultaDeCartera> = {}): Promise<CarteraResponse> => leerCarteraAnterior(servicios.prisma, servicios.pdp, servicios.procesos, actorId, contexto(), { ...CONSULTA, ...c });

/** Las dos lecturas, una tras otra, dan lo mismo byte a byte. Si el día civil cambió entre una y otra (medianoche), se repite. */
async function igualQueAntes(actorId: string, c: Partial<ConsultaDeCartera> = {}): Promise<CarteraResponse> {
  for (let intento = 1; ; intento++) {
    const n = await nueva(actorId, c);
    const a = await anterior(actorId, c);
    if (n.data.today !== a.data.today && intento < 3) continue;
    expect(n).toStrictEqual(a);
    expect(JSON.stringify(n)).toBe(JSON.stringify(a));
    return n;
  }
}

async function igualEnTodasLasConsultas(actorId: string): Promise<CarteraResponse> {
  let sinFiltro: CarteraResponse | null = null;
  for (const c of CONSULTAS) {
    const r = await igualQueAntes(actorId, c);
    if (Object.keys(c).length === 0) sinFiltro = r;
  }
  return sinFiltro as CarteraResponse;
}

const claveDeItem = (i: CarteraResponse['data']['items'][number]): string => `${i.kind}|${i.domain}|${i.advisee.identityId}`;

/** Recorre toda la lista de a `limit`, comparando cada página con el oráculo, y devuelve lo recorrido. */
async function recorrer(actorId: string, limit: number, c: Partial<ConsultaDeCartera> = {}): Promise<CarteraResponse['data']['items']> {
  const items: CarteraResponse['data']['items'] = [];
  let cursor: string | null = null;
  let paginas = 0;
  do {
    const n: CarteraResponse = await igualQueAntes(actorId, { ...c, limit, cursor });
    expect(n.page.limit).toBe(limit);
    expect(n.data.items.length).toBeLessThanOrEqual(limit);
    if (n.page.hasMore) {
      expect(n.data.items).toHaveLength(limit);
      expect(n.page.nextCursor).not.toBeNull();
    } else expect(n.page.nextCursor).toBeNull();
    items.push(...n.data.items);
    cursor = n.page.nextCursor;
    paginas++;
  } while (cursor && paginas < 100);
  return items;
}

/** La lista entera, de a `limit`, es la misma que de a 50 (o más páginas): sin omisiones ni repetidos, en el mismo orden. */
async function paginacionCompleta(actorId: string, limit: number): Promise<number> {
  const deACincuenta = await recorrer(actorId, 50);
  const recorrido = await recorrer(actorId, limit);
  expect(recorrido).toStrictEqual(deACincuenta);
  expect(new Set(recorrido.map(claveDeItem)).size).toBe(recorrido.length);
  return recorrido.length;
}

async function porHttp(pro: Parte, query = ''): Promise<{ r: CarteraResponse; requestId: string }> {
  const res = await conSesion(app, pro.token).get(`/api/v1/me/portfolio${query}`).expect(200);
  return { r: CarteraResponseSchema.parse(res.body), requestId: res.headers['x-request-id'] as string };
}

/** Por HTTP (sesión, validación de la query, contrato) coincide con el oráculo llamado directamente. */
async function httpIgualQueAntes(pro: Parte): Promise<string> {
  for (let intento = 1; ; intento++) {
    const { r, requestId } = await porHttp(pro, '?limit=50');
    const a = await anterior(pro.id);
    if (r.data.today !== a.data.today && intento < 3) continue;
    expect(r).toStrictEqual(a);
    return requestId;
  }
}

async function personasConVinculoAceptado(profesionalId: string): Promise<number> {
  const filas = await prisma.alcanceDeVinculo.findMany({ where: { estado: 'ACEPTADO', vinculo: { profesionalId } }, select: { vinculo: { select: { asesoradoId: true } } } });
  return new Set(filas.map((f) => f.vinculo.asesoradoId)).size;
}

/** Las filas de decisión que dejó un pedido: 3 por persona con vínculo aceptado (una por alcance del catálogo). */
async function auditoriaDelPedido(profesionalId: string, requestId: string): Promise<void> {
  const personas = await personasConVinculoAceptado(profesionalId);
  const filas = await prisma.decisionDeAcceso.findMany({ where: { requestId, operacion: 'API-CAR-01', actorId: profesionalId }, select: { sujetoId: true, alcance: true } });
  expect(filas).toHaveLength(3 * personas);
  expect(new Set(filas.map((f) => f.sujetoId)).size).toBe(personas);
  if (personas > 0) expect(new Set(filas.map((f) => f.alcance)).size).toBe(3);
}

// ─── Las personas de una cartera ─────────────────────────────────────────────────────────────

async function diaDeHoy(ase: Parte) {
  return (await conSesion(app, ase.token).get('/api/v1/me/nutrition/today').expect(200)).body.data.activePlan.dayTypes[0];
}

interface PersonaDeNutricion {
  readonly ase: Parte;
  readonly vinculoId: string;
  readonly consentId: string;
}

/**
 * Una persona con vínculo de Nutrición: sin plan, con solo un borrador, o con un plan activado (con o sin fecha de
 * revisión, con comidas en los días indicados hacia atrás y, si se pide, un borrador posterior a la activación).
 */
async function nutricion(pro: Parte, opciones: { plan: 'ninguno' | 'borrador' | 'activado'; nextReviewAt?: string; comidas?: readonly number[]; borradorPosterior?: boolean; revisionSinFecha?: boolean }): Promise<PersonaDeNutricion> {
  if (opciones.plan === 'ninguno') {
    const ase = await prepararAsesorado(app, etiqueta(), { a3: true });
    const v = await vinculoCompleto(app, pro, ase, 'NUTRICION');
    return { ase, vinculoId: v.vinculoId, consentId: v.consentId as string };
  }
  const c = await circuitoListoParaPlanificar(app, etiqueta(), pro);
  const b = await crearBorrador(app, c, opciones.nextReviewAt ? { nextReviewAt: opciones.nextReviewAt } : {});
  if (opciones.plan === 'activado') {
    await activar(app, pro, b.planId, b.version).expect(200);
    if (opciones.comidas?.length) {
      const dia = await diaDeHoy(c.ase);
      // La de «hoy» es de hace un minuto (una ocurrencia futura se rechaza); las demás, al mediodía de ese día.
      let ultimaComida: string | null = null;
      for (const diasAtras of opciones.comidas) {
        const r = await registrarComida(app, c.ase, b.planId, dia, { ocurrencia: diasAtras === 0 ? new Date(Date.now() - 60_000) : new Date(`${hace(diasAtras)}T12:30:00-03:00`) }).expect(201);
        ultimaComida = r.body.data.executionId as string;
      }
      // Una revisión MANTENER aplicada sin fecha deja la expectativa vigente del Proceso sin fecha: REVIEW_UNDATED.
      if (opciones.revisionSinFecha && ultimaComida) {
        const rev = await conSesion(app, pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision([{ type: 'EXECUTION', id: ultimaComida }], 'MAINTAIN')).expect(201);
        await conSesion(app, pro.token).post(`/api/v1/nutrition/reviews/${rev.body.data.reviewId as string}/apply`).send({ expectedVersion: 'v1' }).expect(200);
      }
    }
    if (opciones.borradorPosterior) await conSesion(app, pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: b.planId }).expect(201);
  }
  return { ase: c.ase, vinculoId: c.vinculoId, consentId: c.consentId };
}

/** Entrenamiento para una persona ya vinculada: vínculo y, si se pide, plan (borrador o activado con sesiones) y solicitud. */
async function entrenamiento(pro: Parte, ase: Parte, opciones: { plan: 'ninguno' | 'borrador' | 'activado'; nextReviewAt?: string; sesiones?: number; solicitud?: boolean }): Promise<void> {
  const v = await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
  if (opciones.plan !== 'ninguno') {
    const ev = await conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/training/evaluations`).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const ob = await conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/training/objectives`).send(cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId as string)).expect(201);
    const c: CircuitoParaPlanificar = { pro, ase, vinculoId: v.vinculoId, consentId: v.consentId as string, evaluationId: ev.body.data.evaluationId as string, objectiveVersionId: ob.body.data.versionId as string };
    const b = await crearBorradorDeEntrenamiento(app, c, opciones.nextReviewAt ? { nextReviewAt: opciones.nextReviewAt } : {});
    if (opciones.plan === 'activado') {
      await activarPlanDeEntrenamiento(app, pro, b.planId, b.version).expect(200);
      if (opciones.sesiones) {
        // Las sesiones pasadas van por SQL, como en las pruebas de entrenamiento: la API solo registra el día en curso.
        const [version] = await prisma.$queryRaw<{ id: string }[]>`
          SELECT v."id"::text AS "id" FROM "version_de_plan_de_entrenamiento" v JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id"
           WHERE p."profesional_id" = ${pro.id}::uuid AND p."asesorado_id" = ${ase.id}::uuid AND v."estado" = 'ACTIVADA'`;
        for (let k = 0; k < opciones.sesiones; k++) {
          const sesion = k % 2 === 0 ? 'ses-a' : 'ses-b';
          const fecha = hace(2 + 7 * k);
          const borrador = borradorDeEjecucion(c, version!.id, { sesion, fecha });
          await prisma.$executeRawUnsafe(borrador.sql);
          await prisma.$executeRawUnsafe(ejecucion(c, version!.id, borrador.id, { sesion, fecha }).sql);
        }
      }
    }
  }
  if (opciones.solicitud) {
    await conSesion(app, pro.token)
      .post(`/api/v1/advisees/${ase.id}/form-requests`, claveDeIdempotencia())
      .send({ templateVersionId: '349161b3-b831-4df1-896f-484517393a57', purpose: 'Seguridad del entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: ['condiciones_declaradas'], requiredFieldCodes: [] })
      .expect(201);
  }
}

/** Antropometría para una persona: vínculo y, si se pide, una evaluación en preparación y otras registradas. */
async function antropometria(pro: Parte, ase: Parte, opciones: { enPreparacion: boolean; registradas: number }): Promise<void> {
  const v = await vinculoCompleto(app, pro, ase, 'ANTROPOMETRIA');
  const c: CircuitoAntropometrico = { pro, ase, vinculoId: v.vinculoId, consentId: v.consentId as string, ...(await sembrarEspecificaciones(prisma)) };
  for (let k = 0; k < opciones.registradas; k++) {
    const id = await borradorSembrado(prisma, c);
    await medicionSembrada(prisma, c, id);
    await registrarBorrador(prisma, id);
  }
  if (opciones.enPreparacion) await borradorSembrado(prisma, c);
}

/**
 * La cartera mixta: un profesional con las tres áreas y nueve personas que cubren todos los tipos de pendiente, varias
 * áreas y varios pendientes por persona, los estados de plan, la historia, y los empates del orden.
 */
async function carteraMixta() {
  const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']);
  // A: revisión nutricional vencida, borrador posterior a la activación, comidas de hoy y de hace 40 días; entrenamiento
  //    activado con revisión próxima, dos sesiones pasadas y una solicitud sin responder.
  const a = await nutricion(pro, { plan: 'activado', nextReviewAt: '2026-01-15', comidas: [0, 40], borradorPosterior: true });
  await entrenamiento(pro, a.ase, { plan: 'activado', nextReviewAt: enDias(3), sesiones: 2, solicitud: true });
  // B: solo borradores, en las dos áreas (empate total: mismo tipo, misma fecha, misma persona, dos dominios).
  const b = await nutricion(pro, { plan: 'borrador' });
  await entrenamiento(pro, b.ase, { plan: 'borrador' });
  // C y D: sin plan (empate entre personas: lo desempata el identificador). C pierde el consentimiento; D se pausa y reanuda.
  const c = await nutricion(pro, { plan: 'ninguno' });
  const d = await nutricion(pro, { plan: 'ninguno' });
  // E: sin plan en las dos áreas (empate total en dos dominios).
  const e = await nutricion(pro, { plan: 'ninguno' });
  await entrenamiento(pro, e.ase, { plan: 'ninguno' });
  // F: activado, con una revisión MANTENER aplicada sin fecha (la expectativa queda sin fecha) y una comida; después se
  //    finaliza el vínculo.
  const f = await nutricion(pro, { plan: 'activado', comidas: [5], revisionSinFecha: true });
  // G: solo antropometría, con una evaluación en preparación y dos registradas.
  const g = await prepararAsesorado(app, etiqueta(), { a3: true });
  await antropometria(pro, g, { enPreparacion: true, registradas: 2 });
  // H: revisión vencida con menos atraso que A y una comida de hace 40 días (el período la deja afuera o adentro).
  const h = await nutricion(pro, { plan: 'activado', nextReviewAt: '2026-03-01', comidas: [40] });
  // I: revisión nutricional próxima y vínculo de antropometría sin evaluaciones.
  const i = await nutricion(pro, { plan: 'activado', nextReviewAt: enDias(5) });
  await antropometria(pro, i.ase, { enPreparacion: false, registradas: 0 });
  return { pro, a, b, c, d, e, f, g, h, i };
}

// ─── Las pruebas ─────────────────────────────────────────────────────────────────────────────

describe('API-CAR-01 por conjuntos · equivalencia con la lectura persona por persona', () => {
  it('cartera vacía: lo mismo (nada), por HTTP también, y sin filas de decisión', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    const r = await igualEnTodasLasConsultas(pro.id);
    expect(r.data.items).toEqual([]);
    expect(r.data.partialView).toBe(false);
    const requestId = await httpIgualQueAntes(pro);
    await auditoriaDelPedido(pro.id, requestId);
  });

  it('cartera mixta: tres áreas, varios pendientes por persona, todos los estados de plan, historia y empates', async () => {
    const m = await carteraMixta();
    const r = await igualEnTodasLasConsultas(m.pro.id);
    // Lo que tiene que haber, para que la equivalencia no sea entre dos listas pobres.
    const tipos = new Set(r.data.items.map((i) => i.kind));
    expect(TIPOS.filter((t) => !tipos.has(t))).toEqual([]);
    expect(new Set(r.data.items.map((i) => i.domain))).toEqual(new Set(['nutrition', 'training', 'anthropometry']));
    const deA = r.data.items.filter((i) => i.advisee.identityId === m.a.ase.id);
    expect(deA.map((i) => [i.domain, i.kind])).toEqual([
      ['nutrition', 'REVIEW_OVERDUE'],
      ['nutrition', 'PLAN_DRAFT_PENDING'],
      ['training', 'REVIEW_DUE_SOON'],
      ['training', 'FORM_REQUEST_OPEN'],
    ]);
    expect(deA[0]).toMatchObject({ activityCount: 2 });
    expect(deA[2]).toMatchObject({ activityCount: 2 });
    expect(r.data.items.filter((i) => i.advisee.identityId === m.g.id).map((i) => [i.kind, i.activityCount])).toEqual([['ANTHRO_DRAFT_PENDING', 2]]);
    // Los empates totales (misma persona, dos dominios) y entre personas, con el período que cambia la actividad.
    expect(r.data.items.filter((i) => i.advisee.identityId === m.e.ase.id).map((i) => i.domain)).toEqual(['nutrition', 'training']);
    const ventana = await igualQueAntes(m.pro.id, { periodo: { start: hace(30), end: hoyCivil() } });
    expect(ventana.data.items.find((i) => i.advisee.identityId === m.h.ase.id)).toMatchObject({ activityCount: 0, lastActivityAt: null });
    expect(ventana.data.items.find((i) => i.advisee.identityId === m.a.ase.id && i.domain === 'nutrition')).toMatchObject({ activityCount: 1 });
    // Páginas consecutivas de 1, 2 y 5 recorren la misma lista que una sola lectura.
    for (const limit of [1, 2, 5]) await paginacionCompleta(m.pro.id, limit);
    await recorrer(m.pro.id, 2, { domain: 'nutrition' });
    // Un cursor inválido y uno que ya no está en la lista: las dos lecturas rechazan igual.
    for (const cursor of ['??', Buffer.from('NO_ACTIVE_PLAN|nutrition|00000000-0000-4000-8000-000000000000', 'utf8').toString('base64url')]) {
      await expect(nueva(m.pro.id, { cursor })).rejects.toBeInstanceOf(ErrorDeApi);
      await expect(anterior(m.pro.id, { cursor })).rejects.toBeInstanceOf(ErrorDeApi);
    }
    // Por HTTP, y la auditoría del pedido: 3 filas por persona con vínculo aceptado.
    const requestId = await httpIgualQueAntes(m.pro);
    await auditoriaDelPedido(m.pro.id, requestId);

    // Cortes. Consentimiento revocado: la persona desaparece y partialView lo avisa; igual en las dos lecturas.
    await revocarB2(app, m.c.ase, m.c.consentId).expect(200);
    const sinC = await igualEnTodasLasConsultas(m.pro.id);
    expect(sinC.data.partialView).toBe(true);
    expect(JSON.stringify(sinC)).not.toContain(m.c.ase.id);
    // Vínculo pausado: la persona no entra en la lectura (ni en las decisiones); reanudado, vuelve.
    await pausar(app, m.pro.token, m.d.vinculoId, await versionDeVinculo(app, m.pro.token, m.d.vinculoId)).expect(200);
    const sinD = await igualEnTodasLasConsultas(m.pro.id);
    expect(JSON.stringify(sinD)).not.toContain(m.d.ase.id);
    await auditoriaDelPedido(m.pro.id, await httpIgualQueAntes(m.pro));
    await reanudar(app, m.pro.token, m.d.vinculoId, await versionDeVinculo(app, m.pro.token, m.d.vinculoId)).expect(200);
    expect((await igualQueAntes(m.pro.id)).data.items.some((i) => i.advisee.identityId === m.d.ase.id)).toBe(true);
    // Vínculo finalizado: la persona no vuelve.
    await finalizar(app, m.pro.token, m.f.vinculoId, await versionDeVinculo(app, m.pro.token, m.f.vinculoId)).expect(200);
    const sinF = await igualEnTodasLasConsultas(m.pro.id);
    expect(JSON.stringify(sinF)).not.toContain(m.f.ase.id);
    await auditoriaDelPedido(m.pro.id, await httpIgualQueAntes(m.pro));

    // Otro profesional no ve nada de estas personas; un asesorado como actor no tiene cartera.
    const otro = await prepararProfesional(app, etiqueta(), ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']);
    const ajena = await igualEnTodasLasConsultas(otro.id);
    expect(ajena.data.items).toEqual([]);
    expect(ajena.data.partialView).toBe(false);
    expect((await igualQueAntes(m.a.ase.id)).data.items).toEqual([]);
  }, 300_000);

  it('cartera grande (40 personas, perfil de la medición): lo mismo, también de a 7', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION', 'ENTRENAMIENTO']);
    for (let k = 0; k < 40; k++) {
      // El perfil base de la medición: todas con Nutrición; una de cada dos, también Entrenamiento; una de cada cinco, plan activado.
      const p = await nutricion(pro, k % 5 === 4 ? { plan: 'activado', nextReviewAt: k % 10 === 4 ? hace(3) : undefined, comidas: k % 10 === 9 ? [1] : [] } : { plan: 'ninguno' });
      if (k % 2 === 1) await entrenamiento(pro, p.ase, { plan: 'ninguno' });
    }
    const r = await igualEnTodasLasConsultas(pro.id);
    expect(r.data.items).toHaveLength(50);
    expect(r.page.hasMore).toBe(true);
    expect(await paginacionCompleta(pro.id, 7)).toBeGreaterThan(50);
    await auditoriaDelPedido(pro.id, await httpIgualQueAntes(pro));
  }, 600_000);
});

describe('API-CAR-01 por conjuntos · lo que crece con las personas es solo el PDP', () => {
  // La extensión vive en su propio esquema mientras dura esta prueba, y se quita al final: el esquema de la aplicación
  // queda como estaba (schema.int-spec.ts comprueba, por ejemplo, que no haya columnas boolean en `public`).
  afterAll(async () => {
    try {
      await prisma.$executeRawUnsafe('DROP EXTENSION IF EXISTS pg_stat_statements');
      await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS estadisticas_de_la_prueba');
    } catch {
      // sin permisos: no se creó
    }
  });

  /** Sentencias de nivel superior que la API mandó a esta base, acumuladas (pg_stat_statements). `null` si no está disponible. */
  async function sentencias(): Promise<number | null> {
    try {
      const [f] = await prisma.$queryRaw<{ n: string }[]>`
        SELECT coalesce(sum(calls), 0)::text AS n FROM estadisticas_de_la_prueba.pg_stat_statements
         WHERE toplevel AND dbid = (SELECT oid FROM pg_database WHERE datname = current_database())`;
      return Number(f?.n ?? 0);
    } catch {
      return null;
    }
  }

  /** Sentencias de un pedido de la primera página: el mínimo de tres, para que nada ajeno al pedido lo infle. */
  async function sentenciasDeUnPedido(pro: Parte): Promise<number> {
    let minimo = Number.POSITIVE_INFINITY;
    for (let k = 0; k < 3; k++) {
      const antes = (await sentencias()) as number;
      await porHttp(pro, '?limit=50');
      const despues = (await sentencias()) as number;
      // La propia lectura de `antes` queda contada entre las dos instantáneas.
      minimo = Math.min(minimo, despues - antes - 1);
    }
    return minimo;
  }

  /**
   * Cada decisión del PDP es su propia transacción: BEGIN, el bloqueo de lo que corta (una función), la lectura de hechos,
   * el registro de las decisiones y COMMIT. Es lo único que la cartera hace por persona.
   */
  const SENTENCIAS_DEL_PDP_POR_PERSONA = 5;
  /** Lo que no depende de las personas: la sesión, los vínculos y la lectura por conjuntos (una consulta por tipo de hecho). */
  const SENTENCIAS_FIJAS_COMO_MUCHO = 30;

  it('seis personas y doce: la diferencia es exactamente el PDP, y lo fijo cabe en una treintena de sentencias', async () => {
    try {
      await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS estadisticas_de_la_prueba');
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA estadisticas_de_la_prueba');
    } catch {
      // sin permisos: se decide abajo
    }
    if ((await sentencias()) === null) {
      console.info('[cartera-por-conjuntos] pg_stat_statements no está disponible en esta base: no se cuentan sentencias.');
      return;
    }
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION', 'ENTRENAMIENTO']);
    const sembrar = async (desde: number, hasta: number): Promise<void> => {
      for (let k = desde; k < hasta; k++) {
        const p = await nutricion(pro, k % 3 === 2 ? { plan: 'activado', nextReviewAt: hace(3), comidas: [1] } : { plan: 'ninguno' });
        if (k % 2 === 1) await entrenamiento(pro, p.ase, { plan: 'ninguno' });
      }
    };
    await sembrar(0, 6);
    await porHttp(pro, '?limit=50'); // calentamiento: las conexiones del pool ya existen
    const conSeis = await sentenciasDeUnPedido(pro);
    await sembrar(6, 12);
    const conDoce = await sentenciasDeUnPedido(pro);
    const porPersona = (conDoce - conSeis) / 6;
    const fijas = conSeis - 6 * SENTENCIAS_DEL_PDP_POR_PERSONA;
    console.info(`[cartera-por-conjuntos] sentencias por pedido: 6 personas ${conSeis}, 12 personas ${conDoce}; por persona ${porPersona}; fijas ${fijas}`);
    expect(porPersona).toBe(SENTENCIAS_DEL_PDP_POR_PERSONA);
    expect(fijas).toBeLessThanOrEqual(SENTENCIAS_FIJAS_COMO_MUCHO);
    expect(fijas).toBeGreaterThan(0);
  }, 300_000);
});
