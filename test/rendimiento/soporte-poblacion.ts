/**
 * Poblaciones sintéticas de la medición de la cartera con concurrencia (encargo nocturno del 2026-10-28, §13). Solo datos
 * sintéticos: correos en `example.invalid` y credenciales de prueba, como en las pruebas de integración.
 *
 * - Perfil «base»: el mismo de la medición anterior (`poblarHasta` de cartera.rendimiento.ts): cada persona con el vínculo
 *   de Nutrición; una de cada dos, también con Entrenamiento; una de cada cinco, con un plan nutricional activado.
 * - Perfil «historia»: las tres áreas, planes con versiones, comidas registradas, sesiones de entrenamiento, revisiones,
 *   solicitudes de formulario y tomas antropométricas. Casi todo va por la API real, con los ayudantes de las pruebas de
 *   integración. Dos cosas van por SQL, con los mismos ayudantes que usan esas pruebas, porque la API no permite
 *   sembrarlas en el pasado: las sesiones de entrenamiento de semanas anteriores (la API solo abre una sesión de un día en
 *   que la versión ya regía) y las tomas antropométricas registradas.
 *
 * La composición es determinista por índice de persona; los identificadores son UUID aleatorios (no hay otra semilla).
 * Lo que se declara como población no es este diseño sino lo que se cuenta en la base al terminar (`inventario`).
 */
import type { INestApplication } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { borradorSembrado, medicionSembrada, registrarBorrador, sembrarEspecificaciones, type CircuitoAntropometrico } from '../integration/soporte-antropometria';
import { claveDeIdempotencia, conSesion } from '../integration/soporte-api';
import {
  activarPlanDeEntrenamiento,
  borradorDeEjecucion,
  crearBorradorDeEntrenamiento,
  cuerpoDeEvaluacionDeEntrenamiento,
  cuerpoDeObjetivoDeEntrenamiento,
  ejecucion,
  type CircuitoParaPlanificar,
} from '../integration/soporte-entrenamiento';
import { activar, circuitoListoParaPlanificar, crearBorrador, cuerpoDeRevision, registrarComida } from '../integration/soporte-nutricion';
import { prepararAsesorado, vinculoCompleto, type Parte } from '../integration/soporte-vinculo';
import { esperar } from './soporte-medicion';

export const ZONA = 'America/Argentina/Buenos_Aires';

/** Fecha civil de hoy en Buenos Aires (AAAA-MM-DD). */
export function hoyCivil(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());
}

export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, (d ?? 1) + dias)).toISOString().slice(0, 10);
}

/** Lo mínimo de una respuesta de supertest que se usa acá. */
interface Respuesta {
  readonly status: number;
  readonly body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Un pedido de una sola escritura, con reintento si la base no estuvo disponible (503) o, cuando se pide, ante un
 * conflicto concurrente (409 RESOURCE_CONFLICT). Cada intento lleva su propia clave de idempotencia: el que falló no
 * escribió nada.
 */
async function conReintento(hacer: () => PromiseLike<Respuesta>, esperado: number, que: string, reintentarConflicto: boolean): Promise<Respuesta> {
  for (let intento = 1; ; intento++) {
    const r = await hacer();
    if (r.status === esperado) return r;
    const codigo = String(r.body?.error?.code ?? '');
    const transitorio = r.status === 503 || (reintentarConflicto && r.status === 409 && codigo === 'RESOURCE_CONFLICT');
    if (!transitorio || intento >= 4) throw new Error(`${que}: se esperaba ${esperado} y llegó ${r.status} ${codigo}`.trim());
    await esperar(200 * intento);
  }
}

// ─── Perfil base ─────────────────────────────────────────────────────────────────────────────

/** El mismo recorrido que `poblarHasta(pro, 0, personas)` de la medición anterior, para poder comparar. */
export async function poblarBase(app: INestApplication, pro: Parte, personas: number, etiqueta: () => string): Promise<void> {
  for (let i = 0; i < personas; i++) {
    if (i % 5 === 4) {
      const c = await circuitoListoParaPlanificar(app, etiqueta(), pro);
      const b = await crearBorrador(app, c);
      await activar(app, pro, b.planId, b.version).expect(200);
      if (i % 2 === 1) await vinculoCompleto(app, pro, c.ase, 'ENTRENAMIENTO');
      continue;
    }
    const ase = await prepararAsesorado(app, etiqueta(), { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    if (i % 2 === 1) await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
  }
}

// ─── Perfil con historia ─────────────────────────────────────────────────────────────────────

/** La plantilla de formulario de entrenamiento sembrada por la migración (la que usa a3-del-titular.int-spec.ts). */
const VERSION_DE_FORMULARIO_DE_ENTRENAMIENTO = '0fba80db-0a80-47a7-b183-130232ab7a9c';
const CAMPOS_DEL_FORMULARIO = ['trn_objetivo_declarado', 'trn_experiencia', 'trn_dias_por_semana', 'trn_minutos_por_sesion', 'trn_lugar_y_equipamiento', 'trn_preferencias'];
const RESPUESTAS_DEL_FORMULARIO = {
  answers: [
    { fieldCode: 'trn_objetivo_declarado', value: 'Ganar fuerza' },
    { fieldCode: 'trn_experiencia', value: 'Caminatas' },
    { fieldCode: 'trn_dias_por_semana', value: 3 },
    { fieldCode: 'trn_minutos_por_sesion', value: 45 },
    { fieldCode: 'trn_lugar_y_equipamiento', value: 'En casa' },
  ],
};

/** Días de comidas registradas por versión del plan (almuerzo y cena de cada día). */
export const DIAS_DE_COMIDAS_POR_VERSION = 21;
/** Semanas de sesiones de entrenamiento pasadas (tres por semana). */
export const SEMANAS_DE_ENTRENAMIENTO = 8;

interface ContextoDeHistoria {
  readonly app: INestApplication;
  readonly prisma: PrismaClient;
  readonly pro: Parte;
  readonly etiqueta: () => string;
  readonly hoy: string;
  readonly antropometria: { readonly protocoloVersionId: string; readonly metodoVersionId: string };
  readonly errores: Record<string, number>;
}

function anotarError(errores: Record<string, number>, paso: string, e: unknown): void {
  const mensaje = `${paso}: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`.slice(0, 300);
  errores[mensaje] = (errores[mensaje] ?? 0) + 1;
}

/** Un paso que no es imprescindible: si falla, se anota y la persona sigue con lo que tiene (el inventario lo cuenta). */
async function paso(x: ContextoDeHistoria, nombre: string, hacer: () => Promise<unknown>): Promise<boolean> {
  try {
    await hacer();
    return true;
  } catch (e) {
    anotarError(x.errores, nombre, e);
    return false;
  }
}

async function diaDeHoy(app: INestApplication, ase: Parte) {
  const r = await conSesion(app, ase.token).get('/api/v1/me/nutrition/today').expect(200);
  return r.body.data.activePlan.dayTypes[0];
}

/** Almuerzo (12:30) y cena (20:30) de `dias` días seguidos desde `desde` días respecto de hoy, por la API. */
async function comidas(x: ContextoDeHistoria, ase: Parte, planId: string, desde: number, dias: number): Promise<void> {
  const dia = await diaDeHoy(x.app, ase);
  for (let d = 0; d < dias; d++) {
    const fecha = sumarDias(x.hoy, desde + d);
    for (const [comida, hora] of [
      [0, '12:30'],
      [1, '20:30'],
    ] as const) {
      await conReintento(() => registrarComida(x.app, ase, planId, dia, { comida, ocurrencia: new Date(`${fecha}T${hora}:00-03:00`) }), 201, 'comida registrada', true);
    }
  }
}

/** Tres sesiones por semana, alternando las dos sesiones del plan, en las semanas anteriores (por SQL, ver arriba). */
async function sesionesPasadas(x: ContextoDeHistoria, c: CircuitoParaPlanificar): Promise<void> {
  const [version] = await x.prisma.$queryRaw<{ id: string }[]>`
    SELECT v."id"::text AS "id"
      FROM "version_de_plan_de_entrenamiento" v JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id"
     WHERE p."profesional_id" = ${c.pro.id}::uuid AND p."asesorado_id" = ${c.ase.id}::uuid AND v."estado" = 'ACTIVADA'`;
  if (!version) throw new Error('sin versión activada del plan de entrenamiento');
  const sentencias: string[] = [];
  for (let semana = 0; semana < SEMANAS_DE_ENTRENAMIENTO; semana++) {
    [1, 3, 5].forEach((desfase, k) => {
      const fecha = sumarDias(x.hoy, -(semana * 7 + desfase));
      const sesion = k % 2 === 0 ? 'ses-a' : 'ses-b';
      const b = borradorDeEjecucion(c, version.id, { sesion, fecha });
      const e = ejecucion(c, version.id, b.id, { sesion, fecha });
      sentencias.push(b.sql, e.sql);
    });
  }
  await x.prisma.$transaction(async (tx) => {
    for (const s of sentencias) await tx.$executeRawUnsafe(s);
  });
}

async function solicitudDeFormulario(x: ContextoDeHistoria, ase: Parte, responder: boolean): Promise<void> {
  const s = await conReintento(
    () =>
      conSesion(x.app, x.pro.token)
        .post(`/api/v1/advisees/${ase.id}/form-requests`, claveDeIdempotencia())
        .send({
          templateVersionId: VERSION_DE_FORMULARIO_DE_ENTRENAMIENTO,
          purpose: 'Planificar tu entrenamiento',
          scope: 'ENTRENAMIENTO',
          requestedFieldCodes: CAMPOS_DEL_FORMULARIO,
          requiredFieldCodes: CAMPOS_DEL_FORMULARIO.slice(0, 5),
        }),
    201,
    'solicitud de formulario',
    false,
  );
  if (!responder) return;
  const id = s.body.data.formRequestId as string;
  await conReintento(() => conSesion(x.app, ase.token).post(`/api/v1/me/form-requests/${id}/responses`, claveDeIdempotencia()).send(RESPUESTAS_DEL_FORMULARIO), 201, 'respuesta de formulario', false);
}

/**
 * Una persona del perfil con historia. Con g = i mod 10 y j = ⌊i / 10⌋ mod 4:
 * - Nutrición (todas): g 0-2, plan v1 activado con 21 días de comidas, una comida de hoy, una revisión MANTENER aplicada,
 *   sucesora v2 activada con otros 21 días (y con g 0, además, un borrador v3 sin activar); g 3-5, plan v1 activado con 21
 *   días de comidas; g 6-7, solo un borrador; g 8-9, sin plan.
 * - Entrenamiento (i par): vínculo; con g distinto de 8, plan activado y 24 sesiones en las 8 semanas anteriores;
 *   i mod 6 = 0, una solicitud de formulario sin responder; i mod 6 = 2, una respondida.
 * - Antropometría (i mod 4 = 0): vínculo y dos tomas registradas; i mod 8 = 0, además una en preparación.
 * - Próxima revisión de los planes, según j: hace 10 días, en 3 días, en 30 días o sin fecha.
 */
async function personaConHistoria(x: ContextoDeHistoria, i: number): Promise<void> {
  const { app, pro } = x;
  const g = i % 10;
  const j = Math.floor(i / 10) % 4;
  const fechas: readonly (string | null)[] = [sumarDias(x.hoy, -10), sumarDias(x.hoy, 3), sumarDias(x.hoy, 30), null];
  const revision = fechas[j] ?? null;
  const conRevision = (extra: Record<string, unknown> = {}): Record<string, unknown> => (revision ? { ...extra, nextReviewAt: revision } : extra);

  let ase: Parte;
  if (g <= 7) {
    const c = await circuitoListoParaPlanificar(app, x.etiqueta(), pro);
    ase = c.ase;
    if (g <= 5) {
      await paso(x, 'nutrición con historia', async () => {
        const v1 = await crearBorrador(app, c, conRevision());
        await conReintento(() => activar(app, pro, v1.planId, v1.version), 200, 'activar v1', true);
        await comidas(x, c.ase, v1.planId, -60, DIAS_DE_COMIDAS_POR_VERSION);
        if (g > 2) return;
        const hoyReg = await conReintento(async () => registrarComida(app, c.ase, v1.planId, await diaDeHoy(app, c.ase)), 201, 'comida de hoy', true);
        const evidencia = [{ type: 'EXECUTION', id: hoyReg.body.data.executionId as string }];
        const rev = await conReintento(
          () => conSesion(app, pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN', { nextReviewAt: sumarDias(x.hoy, 45) })),
          201,
          'revisión nutricional',
          false,
        );
        await conReintento(() => conSesion(app, pro.token).post(`/api/v1/nutrition/reviews/${rev.body.data.reviewId as string}/apply`).send({ expectedVersion: 'v1' }), 200, 'aplicar la revisión', false);
        const v2 = await conReintento(
          () => conSesion(app, pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send(conRevision({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: v1.planId })),
          201,
          'sucesora v2',
          false,
        );
        const v2Id = v2.body.data.planId as string;
        await conReintento(() => activar(app, pro, v2Id, v2.body.data.version as string), 200, 'activar v2', true);
        await comidas(x, c.ase, v2Id, -30, DIAS_DE_COMIDAS_POR_VERSION);
        if (g === 0) {
          await conReintento(() => conSesion(app, pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: v2Id }), 201, 'borrador v3', false);
        }
      });
    } else {
      await paso(x, 'borrador nutricional', () => crearBorrador(app, c));
    }
  } else {
    ase = await prepararAsesorado(app, x.etiqueta(), { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
  }

  if (i % 2 === 0) {
    const v = await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    if (g !== 8) {
      await paso(x, 'entrenamiento con historia', async () => {
        const ev = await conReintento(() => conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/training/evaluations`).send(cuerpoDeEvaluacionDeEntrenamiento()), 201, 'evaluación de entrenamiento', false);
        const evaluationId = ev.body.data.evaluationId as string;
        const ob = await conReintento(() => conSesion(app, pro.token).post(`/api/v1/advisees/${ase.id}/training/objectives`).send(cuerpoDeObjetivoDeEntrenamiento(evaluationId)), 201, 'objetivo de entrenamiento', false);
        const c: CircuitoParaPlanificar = { pro, ase, vinculoId: v.vinculoId, consentId: v.consentId as string, evaluationId, objectiveVersionId: ob.body.data.versionId as string };
        const b = await crearBorradorDeEntrenamiento(app, c, conRevision());
        await conReintento(() => activarPlanDeEntrenamiento(app, pro, b.planId, b.version), 200, 'activar el plan de entrenamiento', true);
        await paso(x, 'sesiones de entrenamiento pasadas', () => sesionesPasadas(x, c));
      });
    }
    if (i % 6 === 0) await paso(x, 'solicitud abierta', () => solicitudDeFormulario(x, ase, false));
    if (i % 6 === 2) await paso(x, 'solicitud respondida', () => solicitudDeFormulario(x, ase, true));
  }

  if (i % 4 === 0) {
    const v = await vinculoCompleto(app, pro, ase, 'ANTROPOMETRIA');
    const c: CircuitoAntropometrico = { pro, ase, vinculoId: v.vinculoId, consentId: v.consentId as string, ...x.antropometria };
    await paso(x, 'tomas antropométricas', async () => {
      for (let k = 0; k < 2; k++) {
        const id = await borradorSembrado(x.prisma, c);
        await medicionSembrada(x.prisma, c, id);
        await registrarBorrador(x.prisma, id);
      }
      if (i % 8 === 0) await borradorSembrado(x.prisma, c);
    });
  }
}

/**
 * La cartera con historia, en `carriles` recorridos en paralelo (cada uno toma personas alternadas de a dos). Un error
 * de una persona se anota y no frena a las demás: el inventario dice lo que quedó.
 */
export async function poblarHistoria(app: INestApplication, prisma: PrismaClient, pro: Parte, personas: number, etiqueta: () => string, carriles: number): Promise<{ readonly errores: Record<string, number> }> {
  const antropometria = await sembrarEspecificaciones(prisma);
  const errores: Record<string, number> = {};
  const x: ContextoDeHistoria = { app, prisma, pro, etiqueta, hoy: hoyCivil(), antropometria, errores };
  await Promise.all(
    Array.from({ length: carriles }, async (_, carril) => {
      for (let i = 0; i < personas; i++) {
        if (Math.floor(i / 2) % carriles !== carril) continue;
        try {
          await personaConHistoria(x, i);
        } catch (e) {
          anotarError(errores, `persona ${i}`, e);
        }
      }
    }),
  );
  return { errores };
}

// ─── Inventario: lo que quedó en la base, contado ────────────────────────────────────────────

const INVENTARIO: Readonly<Record<string, string>> = {
  vinculos: `SELECT count(*)::float8 AS n FROM "vinculo" WHERE "profesional_id" = $1::uuid`,
  alcancesNutricion: `SELECT count(*)::float8 AS n FROM "alcance_de_vinculo" a JOIN "vinculo" v ON v."id" = a."vinculo_id" WHERE v."profesional_id" = $1::uuid AND a."estado" = 'ACEPTADO' AND a."alcance" = 'NUTRICION'`,
  alcancesEntrenamiento: `SELECT count(*)::float8 AS n FROM "alcance_de_vinculo" a JOIN "vinculo" v ON v."id" = a."vinculo_id" WHERE v."profesional_id" = $1::uuid AND a."estado" = 'ACEPTADO' AND a."alcance" = 'ENTRENAMIENTO'`,
  alcancesAntropometria: `SELECT count(*)::float8 AS n FROM "alcance_de_vinculo" a JOIN "vinculo" v ON v."id" = a."vinculo_id" WHERE v."profesional_id" = $1::uuid AND a."estado" = 'ACEPTADO' AND a."alcance" = 'ANTROPOMETRIA'`,
  planesNutricionales: `SELECT count(*)::float8 AS n FROM "plan_nutricional" WHERE "profesional_id" = $1::uuid`,
  versionesNutricionalesActivadas: `SELECT count(*)::float8 AS n FROM "version_de_plan_nutricional" v JOIN "plan_nutricional" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid AND v."estado" = 'ACTIVADA'`,
  versionesNutricionalesBorrador: `SELECT count(*)::float8 AS n FROM "version_de_plan_nutricional" v JOIN "plan_nutricional" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid AND v."estado" = 'BORRADOR'`,
  planesDeEntrenamiento: `SELECT count(*)::float8 AS n FROM "plan_de_entrenamiento" WHERE "profesional_id" = $1::uuid`,
  versionesDeEntrenamientoActivadas: `SELECT count(*)::float8 AS n FROM "version_de_plan_de_entrenamiento" v JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid AND v."estado" = 'ACTIVADA'`,
  versionesDeEntrenamientoBorrador: `SELECT count(*)::float8 AS n FROM "version_de_plan_de_entrenamiento" v JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid AND v."estado" = 'BORRADOR'`,
  procesosAbiertosNutricion: `SELECT count(*)::float8 AS n FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "estado" = 'ABIERTO' AND "alcance" = 'NUTRICION'`,
  procesosAbiertosEntrenamiento: `SELECT count(*)::float8 AS n FROM "proceso_operativo" WHERE "profesional_id" = $1::uuid AND "estado" = 'ABIERTO' AND "alcance" = 'ENTRENAMIENTO'`,
  proximasRevisiones: `SELECT count(*)::float8 AS n FROM "proxima_revision" r JOIN "proceso_operativo" o ON o."id" = r."proceso_id" WHERE o."profesional_id" = $1::uuid`,
  revisionesNutricionales: `SELECT count(*)::float8 AS n FROM "revision_nutricional" r JOIN "proceso_operativo" o ON o."id" = r."proceso_id" WHERE o."profesional_id" = $1::uuid`,
  comidasRegistradas: `SELECT count(*)::float8 AS n FROM "ingesta_nutricional" i JOIN "version_de_plan_nutricional" v ON v."id" = i."version_de_plan_id" JOIN "plan_nutricional" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid`,
  personasConComidas: `SELECT count(DISTINCT i."asesorado_id")::float8 AS n FROM "ingesta_nutricional" i JOIN "version_de_plan_nutricional" v ON v."id" = i."version_de_plan_id" JOIN "plan_nutricional" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid`,
  sesionesDeEntrenamiento: `SELECT count(*)::float8 AS n FROM "ejecucion_de_entrenamiento" e JOIN "version_de_plan_de_entrenamiento" v ON v."id" = e."version_de_plan_id" JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid`,
  personasConSesiones: `SELECT count(DISTINCT e."asesorado_id")::float8 AS n FROM "ejecucion_de_entrenamiento" e JOIN "version_de_plan_de_entrenamiento" v ON v."id" = e."version_de_plan_id" JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id" WHERE p."profesional_id" = $1::uuid`,
  solicitudesDeFormulario: `SELECT count(*)::float8 AS n FROM "solicitud_de_formulario" WHERE "profesional_id" = $1::uuid`,
  solicitudesRespondidas: `SELECT count(*)::float8 AS n FROM "solicitud_de_formulario" s JOIN "respuesta_de_formulario" r ON r."solicitud_id" = s."id" WHERE s."profesional_id" = $1::uuid`,
  tomasAntropometricasRegistradas: `SELECT count(*)::float8 AS n FROM "evaluacion_antropometrica" WHERE "profesional_id" = $1::uuid AND "estado" = 'REGISTRADA'`,
  tomasAntropometricasEnPreparacion: `SELECT count(*)::float8 AS n FROM "evaluacion_antropometrica" WHERE "profesional_id" = $1::uuid AND "estado" = 'EN_PREPARACION'`,
  medicionesAntropometricas: `SELECT count(*)::float8 AS n FROM "medicion_antropometrica" m JOIN "evaluacion_antropometrica" e ON e."id" = m."evaluacion_id" WHERE e."profesional_id" = $1::uuid`,
  decisionesComoActor: `SELECT count(*)::float8 AS n FROM "decision_de_acceso" WHERE "actor_id" = $1::uuid`,
};

/** Filas por tabla de la cartera de un profesional. Una consulta que falla queda anotada con su error, sin frenar las demás. */
export async function inventario(prisma: PrismaClient, profesionalId: string): Promise<Record<string, number | string>> {
  const r: Record<string, number | string> = {};
  for (const [clave, sql] of Object.entries(INVENTARIO)) {
    try {
      const [f] = await prisma.$queryRawUnsafe<{ n: number }[]>(sql, profesionalId);
      r[clave] = f?.n ?? 0;
    } catch (e) {
      r[clave] = `error: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`.slice(0, 200);
    }
  }
  return r;
}

/** Filas totales de las tablas que crecen, para toda la base (todas las carteras y la siembra). */
export async function totalesDeLaBase(prisma: PrismaClient): Promise<Record<string, number | string>> {
  const tablas = ['identidad', 'vinculo', 'alcance_de_vinculo', 'decision_de_acceso', 'ingesta_nutricional', 'ejecucion_de_entrenamiento', 'proceso_operativo', 'proxima_revision', 'solicitud_de_formulario', 'evaluacion_antropometrica'];
  const r: Record<string, number | string> = {};
  for (const t of tablas) {
    try {
      const [f] = await prisma.$queryRawUnsafe<{ n: number; bytes: number }[]>(`SELECT count(*)::float8 AS n, pg_total_relation_size('"${t}"')::float8 AS bytes FROM "${t}"`);
      r[t] = f?.n ?? 0;
      r[`${t}.bytes`] = f?.bytes ?? 0;
    } catch (e) {
      r[t] = `error: ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`.slice(0, 200);
    }
  }
  return r;
}
