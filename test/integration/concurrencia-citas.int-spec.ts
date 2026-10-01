/**
 * PF-02 · DL-102 · concurrencia real entre una evaluación que cita respuestas (API-TRN-01) y una rectificación de esa
 * respuesta (API-FRM-08), por la API real y contra PostgreSQL, con **dos transacciones abiertas a la vez**.
 *
 * ## Qué resultados admite el contrato
 * La API corre en READ COMMITTED. `validarCitas` lee cada respuesta **una sola vez**, en la transacción de la
 * evaluación, y la cita queda fijada en la versión vigente de **esa lectura** (DL-102). Si la cita trae
 * `expectedVersion` y esa lectura ve otra versión, la API responde 409 `VERSION_CONFLICT` y no escribe nada (auditoría
 * del PR #102). La base no exige que la versión citada sea la vigente al confirmar: una rectificación que se confirma
 * entre la lectura y el commit deja la cita en la versión leída, con `laterVersionExists` (migración
 * 20260928010000_citas_de_respuestas_en_evaluacion). Por lo tanto, frente a una rectificación v1 → v2:
 * - si la evaluación **leyó antes** de que la rectificación se confirmara, cita v1 (y con `expectedVersion: v1`, se
 *   registra): es el orden serial «evaluación, después rectificación»;
 * - si **leyó después**, ve v2: con `expectedVersion: v1` es 409 sin escrituras; sin `expectedVersion`, cita v2;
 * - nunca mezcla versiones entre dos citas de la misma respuesta, y lo guardado no cambia después.
 *
 * ## Cómo se fija el orden, sin pausas arbitrarias
 * Una conexión de la prueba toma un bloqueo que la transacción real necesita **en un punto conocido** y lo retiene:
 * - `LOCK TABLE evaluacion_de_entrenamiento IN SHARE MODE`: la evaluación ya leyó sus citas y espera para insertar;
 * - `LOCK TABLE rectificacion_de_respuesta_de_formulario IN SHARE MODE`: la rectificación ya leyó y verificó su versión, y
 *   espera para insertar;
 * - el advisory lock de la Idempotency-Key (`pg_advisory_xact_lock`, IdempotenciaService.ejecutar): la evaluación
 *   todavía no leyó nada.
 * La prueba no avanza por tiempo: espera a ver en `pg_locks` el pedido **no concedido** de la otra transacción. Recién
 * entonces hace la operación concurrente, y después suelta el bloqueo. SHARE no choca con las lecturas (ACCESS SHARE)
 * ni con las claves foráneas (ROW SHARE), y solo frena el INSERT (ROW EXCLUSIVE).
 */
import type { INestApplication } from '@nestjs/common';
import { EvaluacionDeEntrenamientoResponseSchema, type RespuestaCitada } from '@be/domain';
import { Prisma, PrismaClient } from '@prisma/client';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoDeEntrenamiento, cuerpoDeEvaluacionDeEntrenamiento, type CircuitoDeEntrenamiento } from './soporte-entrenamiento';

const VERSION_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const SEIS = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];
const ROTULO_DIAS = 'Cuántos días por semana podrías reservar de manera realista';
const ROTULO_OBJETIVO = 'Qué te gustaría poder hacer o mejorar con el entrenamiento';

const prisma = new PrismaClient();
/** Conexión aparte que retiene los bloqueos: su transacción queda abierta mientras la otra espera. */
const retenedor = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
  await retenedor.$disconnect();
});

// ─── Barrera: retener un bloqueo hasta que la otra transacción esté esperando ───────────────────

interface Retencion {
  /** Se resuelve cuando el bloqueo ya está tomado. */
  readonly tomado: Promise<void>;
  /** Libera el bloqueo (termina la transacción de la prueba sin escribir nada). */
  soltar(): Promise<void>;
}

function retener(sentencia: Prisma.Sql): Retencion {
  let liberar!: () => void;
  const liberado = new Promise<void>((r) => (liberar = r));
  let avisarTomado!: () => void;
  const tomado = new Promise<void>((r) => (avisarTomado = r));
  const transaccion = retenedor.$transaction(
    async (tx) => {
      await tx.$executeRaw(sentencia);
      avisarTomado();
      await liberado;
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
  return {
    tomado,
    soltar: async () => {
      liberar();
      await transaccion;
    },
  };
}

/** Espera, por condición y no por tiempo, a que alguien pida un bloqueo que no se le concede. */
async function hastaQueEspere(condicion: Prisma.Sql, descripcion: string): Promise<void> {
  const limite = Date.now() + 20_000;
  for (;;) {
    const [{ n }] = await prisma.$queryRaw<{ n: number }[]>(Prisma.sql`SELECT count(*)::int AS n FROM pg_locks l WHERE NOT l.granted AND ${condicion}`);
    if (n > 0) return;
    if (Date.now() > limite) throw new Error(`Nadie llegó a esperar: ${descripcion}`);
    await new Promise((r) => setImmediate(r));
  }
}
/** Una promesa con una marca de si ya terminó: prueba que la operación retenida seguía en vuelo. */
function enVuelo<T>(p: PromiseLike<T>): { readonly promesa: Promise<T>; terminada(): boolean } {
  let terminada = false;
  const promesa = Promise.resolve(p).finally(() => (terminada = true));
  return { promesa, terminada: () => terminada };
}
const esperandoTabla = (tabla: string) => hastaQueEspere(Prisma.sql`l.relation = ${tabla}::regclass`, `INSERT en ${tabla}`);
const esperandoAdvisory = () => hastaQueEspere(Prisma.sql`l.locktype = 'advisory'`, 'el advisory lock de la clave');

// ─── Escenario ──────────────────────────────────────────────────────────────────────────────────

interface Escenario {
  readonly c: CircuitoDeEntrenamiento;
  readonly formResponseId: string;
  readonly submittedAt: string;
}

async function escenario(): Promise<Escenario> {
  const c = await circuitoDeEntrenamiento(app, `conc-${++contador}`);
  const s = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/form-requests`)
    .send({ templateVersionId: VERSION_ENTRENAMIENTO, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: SEIS, requiredFieldCodes: SEIS.slice(0, 5) })
    .expect(201);
  const r = await conSesion(app, c.ase.token).post(`/api/v1/me/form-requests/${s.body.data.formRequestId}/responses`).send({ answers: respuestas(3) }).expect(201);
  return { c, formResponseId: r.body.data.formResponseId, submittedAt: r.body.data.submittedAt };
}

function respuestas(dias: number, objetivo = 'Ganar fuerza') {
  return [
    { fieldCode: 'trn_objetivo_declarado', value: objetivo },
    { fieldCode: 'trn_experiencia', value: 'Caminatas' },
    { fieldCode: 'trn_dias_por_semana', value: dias },
    { fieldCode: 'trn_minutos_por_sesion', value: 45 },
    { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa' },
  ];
}

/** Dos citas de la misma respuesta: días y objetivo. Con `expectedVersion`, si se pasa. */
const citandoDos = (formResponseId: string, expectedVersion?: string) => ({
  ...cuerpoDeEvaluacionDeEntrenamiento(),
  formResponseReferences: ['trn_dias_por_semana', 'trn_objetivo_declarado'].map((fieldCode) => ({ formResponseId, fieldCode, ...(expectedVersion ? { expectedVersion } : {}) })),
});

const evaluar = (e: Escenario, cuerpo: object, clave = claveDeIdempotencia()) => conSesion(app, e.c.pro.token).post(`/api/v1/advisees/${e.c.ase.id}/training/evaluations`, clave).send(cuerpo);
const rectificarADos = (e: Escenario, expectedVersion = 'v1') =>
  conSesion(app, e.c.ase.token)
    .post(`/api/v1/me/form-responses/${e.formResponseId}/rectifications`)
    .send({ expectedVersion, reason: 'Ahora tengo un día más.', answers: respuestas(4, 'Ganar fuerza y resistencia') });

async function citasDe(e: Escenario, evaluationId: string): Promise<RespuestaCitada[]> {
  const r = await conSesion(app, e.c.pro.token).get(`/api/v1/training/evaluations/${evaluationId}`).expect(200);
  return EvaluacionDeEntrenamientoResponseSchema.parse(r.body).data.formResponseReferences;
}
const filasDeCitas = (evaluacionId: string) =>
  prisma.citaDeRespuestaEnEvaluacionDeEntrenamiento.findMany({ where: { evaluacionId }, orderBy: { orden: 'asc' }, select: { codigoDeCampo: true, rectificacionId: true } });

/** Lo guardado de la v1: los dos valores, la versión, la fecha, el rótulo y la unidad, coherentes entre sí. */
function esperarV1(citas: RespuestaCitada[], e: Escenario) {
  expect(citas.map((x) => [x.fieldCode, x.value, x.citedVersion, x.answeredAt, x.label, x.unit])).toEqual([
    ['trn_dias_por_semana', 3, 'v1', e.submittedAt, ROTULO_DIAS, 'días por semana'],
    ['trn_objetivo_declarado', 'Ganar fuerza', 'v1', e.submittedAt, ROTULO_OBJETIVO, null],
  ]);
}

describe('PF-02 · DL-102 · concurrencia real: evaluación que cita y rectificación simultánea', () => {
  it('I1 · la evaluación ya leyó v1 y espera para escribir; la rectificación a v2 se confirma en el medio: las dos citas quedan en v1, sin mezclar', async () => {
    const e = await escenario();
    const bloqueo = retener(Prisma.sql`LOCK TABLE evaluacion_de_entrenamiento IN SHARE MODE`);
    await bloqueo.tomado;
    const evaluacion = enVuelo(evaluar(e, citandoDos(e.formResponseId, 'v1')));
    await esperandoTabla('evaluacion_de_entrenamiento');
    // La evaluación está detenida entre su lectura y su INSERT. La rectificación no toca esa tabla: se confirma.
    const rect = await rectificarADos(e).expect(201);
    expect(rect.body.data.version).toBe('v2');
    expect(evaluacion.terminada()).toBe(false);
    await bloqueo.soltar();
    const r = await evaluacion.promesa;
    expect(r.status).toBe(201);
    // Las dos citas salieron de la misma lectura: la original (v1), ninguna de la rectificación confirmada en el medio.
    expect(await filasDeCitas(r.body.data.evaluationId)).toEqual([
      { codigoDeCampo: 'trn_dias_por_semana', rectificacionId: null },
      { codigoDeCampo: 'trn_objetivo_declarado', rectificacionId: null },
    ]);
    const citas = await citasDe(e, r.body.data.evaluationId);
    esperarV1(citas, e);
    expect(citas.every((x) => x.laterVersionExists)).toBe(true);
  });

  it('I2 · la rectificación ya leyó v1 y espera para escribir; la evaluación lee v1 y se confirma en el medio: cita v1; después la rectificación crea v2', async () => {
    const e = await escenario();
    const bloqueo = retener(Prisma.sql`LOCK TABLE rectificacion_de_respuesta_de_formulario IN SHARE MODE`);
    await bloqueo.tomado;
    const rect = enVuelo(rectificarADos(e));
    await esperandoTabla('rectificacion_de_respuesta_de_formulario');
    // La rectificación verificó su versión (v1) y espera su INSERT. La evaluación lee v1 y se registra.
    const r = await evaluar(e, citandoDos(e.formResponseId, 'v1')).expect(201);
    const antes = await citasDe(e, r.body.data.evaluationId);
    esperarV1(antes, e);
    expect(antes.every((x) => !x.laterVersionExists)).toBe(true);
    expect(rect.terminada()).toBe(false);
    await bloqueo.soltar();
    expect((await rect.promesa).status).toBe(201);
    // Registrada la v2, la evaluación conserva exactamente lo citado; solo avisa que hay una versión posterior.
    const despues = await citasDe(e, r.body.data.evaluationId);
    esperarV1(despues, e);
    expect(despues.every((x) => x.laterVersionExists)).toBe(true);
  });

  it('I3 · la evaluación está en vuelo pero todavía no leyó; la rectificación a v2 se confirma antes de su lectura: con expectedVersion v1 es 409 y no escribe nada', async () => {
    const e = await escenario();
    const clave = claveDeIdempotencia();
    const bloqueo = retener(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${`API-TRN-01|${e.c.pro.id}|${clave}`}, 0))`);
    await bloqueo.tomado;
    const evaluacion = enVuelo(evaluar(e, citandoDos(e.formResponseId, 'v1'), clave));
    await esperandoAdvisory();
    await rectificarADos(e).expect(201);
    expect(evaluacion.terminada()).toBe(false);
    await bloqueo.soltar();
    const r = await evaluacion.promesa;
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('VERSION_CONFLICT');
    expect(r.body.error.details.issues).toEqual([{ code: 'FORM_RESPONSE_VERSION_CHANGED', path: 'formResponseReferences[0].expectedVersion' }]);
    expect(await prisma.evaluacionDeEntrenamiento.count({ where: { asesoradoId: e.c.ase.id } })).toBe(0);
    expect(await prisma.citaDeRespuestaEnEvaluacionDeEntrenamiento.count({ where: { respuestaId: e.formResponseId } })).toBe(0);
  });

  it('I3 sin expectedVersion (cliente anterior) · la misma intercalación cita v2 en las dos citas, sin mezclar con v1', async () => {
    const e = await escenario();
    const clave = claveDeIdempotencia();
    const bloqueo = retener(Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${`API-TRN-01|${e.c.pro.id}|${clave}`}, 0))`);
    await bloqueo.tomado;
    const evaluacion = enVuelo(evaluar(e, citandoDos(e.formResponseId), clave));
    await esperandoAdvisory();
    const rect = await rectificarADos(e).expect(201);
    expect(evaluacion.terminada()).toBe(false);
    await bloqueo.soltar();
    const r = await evaluacion.promesa;
    expect(r.status).toBe(201);
    const rectificacionId = rect.body.data.rectificationId as string;
    expect(await filasDeCitas(r.body.data.evaluationId)).toEqual([
      { codigoDeCampo: 'trn_dias_por_semana', rectificacionId },
      { codigoDeCampo: 'trn_objetivo_declarado', rectificacionId },
    ]);
    const citas = await citasDe(e, r.body.data.evaluationId);
    expect(citas.map((x) => [x.fieldCode, x.value, x.citedVersion, x.answeredAt, x.label, x.unit, x.laterVersionExists])).toEqual([
      ['trn_dias_por_semana', 4, 'v2', rect.body.data.recordedAt, ROTULO_DIAS, 'días por semana', false],
      ['trn_objetivo_declarado', 'Ganar fuerza y resistencia', 'v2', rect.body.data.recordedAt, ROTULO_OBJETIVO, null, false],
    ]);
  });
});
