/**
 * Planificado y registrado (website profesional; amplía DL-105) · la lectura que usa la vista (API-TRN-21, sin cambios)
 * pasada por la misma lógica que dibuja el gráfico y la tabla (`comparacion-de-entrenamiento.ts`), contra la API real
 * y PostgreSQL. Datos sintéticos armados por los flujos reales: plan, activación, registro desde la APK, corrección del
 * profesional y una versión sucesora.
 *
 * El período del caso: un solo día, cinco sesiones registradas. El día que se activa una sucesora, cada sesión aparece
 * una vez (DL-077): la de la versión donde ya se registró o, si no, la de la más nueva. Por eso la sucesora cambia a
 * pirámide también una sesión que todavía no se registró (la D), y así el mismo día hay ejecuciones de las dos versiones
 * sin tocar la base: las ejecuciones son de solo agregar.
 * - v1 · Sesión A: press de banca 3 × 8 (RIR 2, 60 kg sugeridos) registrado 8, 8 y una serie 4 de 6: la 3 falta y la 4 es
 *   adicional. La sentadilla (6-8, 75 % RM) no se registró. El profesional corrige la serie 2 a 7.
 * - v1 · Sesión B: «No pude realizarla».
 * - v1 · Sesión C: registro resumido del press de banca (2 × 5, 135 lb sugeridas).
 * - v2 (sucesora: pirámide 10/8/6 en la A y en la D) · Sesión D: 10, 8 y 5; sentadilla 7 y 5 con 100 kg.
 * - v2 · Sesión E: press de banca sustituido por press con mancuernas, en lb.
 * - v2 · Sesión F: un borrador con series, sin confirmar.
 */
import type { INestApplication } from '@nestjs/common';
import {
  compararEjecucion,
  ContextoDeRevisionDeEntrenamientoResponseSchema,
  ejerciciosComparables,
  estructuraComoEntrada,
  evolucion,
  medidasDisponibles,
  observacionesDelEjercicio,
  PlanDeEntrenamientoResponseSchema,
  seriesParaGraficar,
  textoDeDiferencia,
  textoPlanificado,
  textoRegistrado,
  type EjecucionDeEntrenamiento,
  type Medida,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, type CircuitoParaPlanificar } from './soporte-entrenamiento';
import { prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto } from './soporte-vinculo';

let app: INestApplication;
const REPS: Medida = { variable: 'repeticiones' };
const KG: Medida = { variable: 'carga', unidad: 'kg' };

type Serie = { setIndex: number; load: { value: number; unit: 'kg' | 'lb' } | null; completedRepetitions: number | null; rir: number | null; perceivedExertion: null };
const serie = (setIndex: number, reps: number, carga: number, unidad: 'kg' | 'lb' = 'kg', rir: number | null = null): Serie => ({
  setIndex,
  load: { value: carga, unit: unidad },
  completedRepetitions: reps,
  rir,
  perceivedExertion: null,
});

const banca3x8 = (prescriptionId: string) => ({
  prescriptionId,
  exerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca,
  sets: [{ repetitions: { value: 8 } }, { repetitions: { value: 8 } }, { repetitions: { value: 8 } }],
  intensity: { criterion: 'RIR', target: { value: 2 } },
  suggestedLoad: { value: 60, unit: 'kg' },
});
const sentadilla = (prescriptionId: string) => ({
  prescriptionId,
  exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla,
  sets: [{ repetitions: { min: 6, max: 8 } }, { repetitions: { min: 6, max: 8 } }],
  intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM estimado por el profesional' } } },
});
const bancaEnRango = (prescriptionId: string) => ({
  prescriptionId,
  exerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca,
  sets: [{ repetitions: { min: 6, max: 8 } }, { repetitions: { min: 6, max: 8 } }],
  intensity: null,
});

/** v1: seis sesiones, con el press de banca en todas (prescripciones distintas) y la sentadilla en la A y la D. */
function estructuraV1(): Record<string, unknown> {
  return {
    blocks: [
      {
        label: 'Bloque 1',
        purpose: 'Adaptación',
        sessions: [
          { sessionId: 'ses-a', label: 'Sesión A', prescriptions: [banca3x8('rx-banca'), sentadilla('rx-sentadilla')] },
          { sessionId: 'ses-b', label: 'Sesión B', prescriptions: [bancaEnRango('rx-banca-b')] },
          {
            sessionId: 'ses-c',
            label: 'Sesión C',
            prescriptions: [
              {
                prescriptionId: 'rx-banca-c',
                exerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca,
                sets: [{ repetitions: { value: 5 } }, { repetitions: { value: 5 } }],
                intensity: null,
                suggestedLoad: { value: 135, unit: 'lb' },
              },
            ],
          },
          { sessionId: 'ses-d', label: 'Sesión D', prescriptions: [banca3x8('rx-banca-d'), sentadilla('rx-sentadilla-d')] },
          { sessionId: 'ses-e', label: 'Sesión E', prescriptions: [bancaEnRango('rx-banca-e')] },
          { sessionId: 'ses-f', label: 'Sesión F', prescriptions: [bancaEnRango('rx-banca-f')] },
        ],
      },
    ],
  };
}

interface Caso {
  c: CircuitoParaPlanificar;
  v1: string;
  v2: string;
  e: Record<'e1' | 'e2' | 'e3' | 'e4' | 'e5', string>;
  borrador: string;
}
let caso: Caso;

const hoy = (token: string) => conSesion(app, token).get('/api/v1/me/training/today');
async function registrar(token: string, occurrenceId: string, cambios: Record<string, unknown>): Promise<string> {
  const apk = conSesion(app, token);
  const b = (await apk.put(`/api/v1/training/occurrences/${occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
  const g = (await apk.patch(`/api/v1/training/execution-drafts/${b.draftId}`).send({ expectedVersion: b.version, changes: cambios }).expect(200)).body.data;
  const x = await apk.post(`/api/v1/training/execution-drafts/${b.draftId}/confirm`, claveDeIdempotencia()).send({ expectedVersion: g.version }).expect(201);
  return x.body.data.executionId as string;
}
const ocurrencia = async (token: string, sesion: string): Promise<string> =>
  ((await hoy(token).expect(200)).body.data.occurrences as { occurrenceId: string; plannedSession: { sessionId: string } }[]).find((o) => o.plannedSession.sessionId === sesion)!.occurrenceId;

beforeAll(async () => {
  app = await appDePrueba();
  const c = await circuitoListoParaPlanificarEntrenamiento(app, `cmp-${randomUUID().slice(0, 6)}`);
  const pro = conSesion(app, c.pro.token);
  const b1 = await pro.post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructuraV1() }).expect(201);
  await activarPlanDeEntrenamiento(app, c.pro, b1.body.data.planId, b1.body.data.version).expect(200);
  const v1 = b1.body.data.planId as string;
  const t = c.ase.token;
  const banca = CATALOGO_DE_EJERCICIOS.pressDeBanca;

  const e1 = await registrar(t, await ocurrencia(t, 'ses-a'), {
    granularity: 'SET',
    sessionCondition: 'COMPLETED_WITH_DEVIATION',
    exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: banca, sets: [serie(1, 8, 60, 'kg', 2), serie(2, 8, 60, 'kg', 2), serie(4, 6, 60, 'kg', 1)] }],
  });
  const e2 = await registrar(t, await ocurrencia(t, 'ses-b'), { sessionCondition: 'NOT_COMPLETED', reason: 'Sin tiempo.' });
  const e3 = await registrar(t, await ocurrencia(t, 'ses-c'), {
    granularity: 'EXERCISE_OR_SESSION',
    sessionCondition: 'COMPLETED_WITH_DEVIATION',
    exercises: [{ prescriptionId: 'rx-banca-c', performedExerciseVersionId: banca, executionSummary: { description: 'Series livianas por molestia en el hombro.' } }],
  });
  // El profesional corrige la serie 2 de la Sesión A: fueron 7.
  await pro
    .post(`/api/v1/training/executions/${e1}/corrections`, claveDeIdempotencia())
    .send({
      reason: 'El asesorado avisó que en la segunda fueron 7.',
      correction: {
        granularity: 'SET',
        sessionCondition: 'COMPLETED_WITH_DEVIATION',
        reason: null,
        exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: banca, sets: [serie(1, 8, 60, 'kg', 2), serie(2, 7, 60, 'kg', 2), serie(4, 6, 60, 'kg', 1)] }],
        sessionSummary: null,
      },
    })
    .expect(201);

  // Versión sucesora: la pirámide 10/8/6 en la Sesión A (ya registrada hoy con la v1) y en la D (todavía no).
  const s = await pro.post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: v1 }).expect(201);
  const leida = PlanDeEntrenamientoResponseSchema.parse((await pro.get(`/api/v1/training/plans/${s.body.data.planId}`).expect(200)).body).data;
  const bloques = estructuraComoEntrada(leida);
  for (const rx of bloques[0]!.sessions!.flatMap((x) => x.prescriptions).filter((p) => p.prescriptionId === 'rx-banca' || p.prescriptionId === 'rx-banca-d')) {
    rx.sets = [10, 8, 6].map((value) => ({ repetitions: { value }, note: null }));
  }
  const editada = (await pro.patch(`/api/v1/training/plans/${leida.planId}`).send({ expectedVersion: leida.version, changes: { blocks: bloques } }).expect(200)).body.data;
  await activarPlanDeEntrenamiento(app, c.pro, editada.planId, editada.version).expect(200);
  const v2 = editada.planId as string;

  const e4 = await registrar(t, await ocurrencia(t, 'ses-d'), {
    granularity: 'SET',
    sessionCondition: 'COMPLETED',
    exercises: [
      { prescriptionId: 'rx-banca-d', performedExerciseVersionId: banca, sets: [serie(1, 10, 62.5), serie(2, 8, 62.5), serie(3, 5, 62.5)] },
      { prescriptionId: 'rx-sentadilla-d', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [serie(1, 7, 100), serie(2, 5, 100)] },
    ],
  });
  const e5 = await registrar(t, await ocurrencia(t, 'ses-e'), {
    granularity: 'SET',
    sessionCondition: 'COMPLETED_WITH_DEVIATION',
    exercises: [{ prescriptionId: 'rx-banca-e', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressConMancuernas, sets: [serie(1, 12, 45, 'lb'), serie(2, 10, 45, 'lb')] }],
  });
  // Un borrador abierto con series, sin confirmar: no es evidencia y no tiene que aparecer.
  const bc = (await conSesion(app, t).put(`/api/v1/training/occurrences/${await ocurrencia(t, 'ses-f')}/execution-draft`).send({}).expect(201)).body.data;
  await conSesion(app, t)
    .patch(`/api/v1/training/execution-drafts/${bc.draftId}`)
    .send({ expectedVersion: bc.version, changes: { granularity: 'SET', exercises: [{ prescriptionId: 'rx-banca-f', performedExerciseVersionId: banca, sets: [serie(1, 7, 60)] }] } })
    .expect(200);
  caso = { c, v1, v2, e: { e1, e2, e3, e4, e5 }, borrador: bc.draftId as string };
}, 240_000);
afterAll(async () => {
  await app.close();
});

async function contexto(): Promise<EjecucionDeEntrenamiento[]> {
  const r = await conSesion(app, caso.c.pro.token).get(`/api/v1/advisees/${caso.c.ase.id}/training/review-context`).expect(200);
  // La vista del website valida con el esquema estricto: si la API devolviera otra forma, el gráfico no se dibuja.
  return ContextoDeRevisionDeEntrenamientoResponseSchema.parse(r.body).data.registeredExecutions;
}
const de = (xs: EjecucionDeEntrenamiento[], id: string) => xs.find((x) => x.executionId === id)!;
const bancaDe = (x: EjecucionDeEntrenamiento, prescriptionId: string) => compararEjecucion(x).find((c) => c.prescriptionId === prescriptionId)!;

describe('Planificado y registrado · por serie, con los datos reales de API-TRN-21', () => {
  it('caso de aceptación · la pirámide 10/8/6 registrada 10/8/5: la serie 3 da −1', async () => {
    const xs = await contexto();
    const filas = seriesParaGraficar(bancaDe(de(xs, caso.e.e4), 'rx-banca-d'), REPS);
    expect(de(xs, caso.e.e4).planId).toBe(caso.v2);
    expect(filas.map((f) => [f.numero, textoPlanificado(f.planificado, REPS), textoRegistrado(f.registrado, REPS), f.diferencia && textoDeDiferencia(f.diferencia, REPS)])).toEqual([
      [1, '10', '10', 'igual'],
      [2, '8', '8', 'igual'],
      [3, '6', '5', '−1'],
    ]);
  });

  it('números reales: la serie 3 salteada es sin dato, la 4 es adicional; rige la corrección y el original queda', async () => {
    const xs = await contexto();
    const c = bancaDe(de(xs, caso.e.e1), 'rx-banca');
    expect(c.fuente).toMatchObject({ tipo: 'correccion', rolDelAutor: 'PROFESSIONAL', motivo: 'El asesorado avisó que en la segunda fueron 7.' });
    const filas = seriesParaGraficar(c, REPS);
    expect(filas.map((f) => f.numero)).toEqual([1, 2, 3, 4]);
    expect(filas.map((f) => textoRegistrado(f.registrado, REPS))).toEqual(['8', '7', 'Sin dato: la serie no está en el registro', '6']);
    expect(filas[3]!.planificado).toEqual({ tipo: 'no-planificada' });
    expect(filas[1]!.fila.corregida).toBe(true);
    expect(filas[1]!.fila.enElOriginal?.completedRepetitions).toBe(8);
    // Contra su propia prescripción (v1, 3 × 8), aunque la v2 cambió esta misma prescripción a la pirámide.
    expect(filas.slice(0, 3).map((f) => textoPlanificado(f.planificado, REPS))).toEqual(['8', '8', '8']);
    expect(de(xs, caso.e.e1).planId).toBe(caso.v1);
    const v2 = PlanDeEntrenamientoResponseSchema.parse((await conSesion(app, caso.c.pro.token).get(`/api/v1/training/plans/${caso.v2}`).expect(200)).body).data;
    const enLaV2 = v2.blocks[0]!.sessions.flatMap((x) => x.prescriptions).find((p) => p.prescriptionId === 'rx-banca')!;
    expect(enLaV2.sets.map((x) => x.repetitions)).toEqual([{ value: 10 }, { value: 8 }, { value: 6 }]);
  });

  it('ausencia ≠ cero: el ejercicio sin registro, la sesión «no realizada» declarada y el resumen, sin ningún 0', async () => {
    const xs = await contexto();
    const sinRegistro = seriesParaGraficar(bancaDe(de(xs, caso.e.e1), 'rx-sentadilla'), REPS);
    expect(sinRegistro.map((f) => f.registrado)).toEqual([
      { tipo: 'sin-dato', motivo: 'ejercicio-no-registrado' },
      { tipo: 'sin-dato', motivo: 'ejercicio-no-registrado' },
    ]);
    expect(sinRegistro.map((f) => textoPlanificado(f.planificado, REPS))).toEqual(['6-8', '6-8']);
    expect(seriesParaGraficar(bancaDe(de(xs, caso.e.e2), 'rx-banca-b'), REPS).map((f) => f.registrado)).toEqual([{ tipo: 'no-realizada' }, { tipo: 'no-realizada' }]);
    const resumida = bancaDe(de(xs, caso.e.e3), 'rx-banca-c');
    expect(resumida.resumen).toBe('Series livianas por molestia en el hombro.');
    expect(seriesParaGraficar(resumida, REPS).every((f) => f.registrado.tipo === 'sin-dato')).toBe(true);
  });

  it('rangos, %RM y unidades: 6-8 se compara como rango, el %RM no se convierte y la carga sugerida en lb no entra en kg', async () => {
    const xs = await contexto();
    const sentadillaD = seriesParaGraficar(bancaDe(de(xs, caso.e.e4), 'rx-sentadilla-d'), REPS);
    expect(sentadillaD.map((f) => textoDeDiferencia(f.diferencia!, REPS))).toEqual(['dentro del rango', '−1 del mínimo']);
    const enKg = seriesParaGraficar(bancaDe(de(xs, caso.e.e4), 'rx-sentadilla-d'), KG);
    expect(enKg[0]!.planificado).toEqual({ tipo: 'porcentaje-rm', valor: 75, referencia: '1RM estimado por el profesional' });
    expect(enKg[0]!.diferencia).toBeNull();
    const c = seriesParaGraficar(bancaDe(de(xs, caso.e.e3), 'rx-banca-c'), KG);
    expect(c[0]!.planificado).toEqual({ tipo: 'otra-unidad', carga: { value: 135, unit: 'lb' } });
  });
});

describe('Planificado y registrado · evolución del ejercicio, con los datos reales de API-TRN-21', () => {
  it('cinco sesiones el mismo día son cinco puntos en orden, cada una con su prescripción histórica', async () => {
    const xs = await contexto();
    const banca = ejerciciosComparables(xs).find((e) => e.nombre.toLowerCase().includes('banca'))!;
    const obs = observacionesDelEjercicio(xs, banca.clave);
    expect(obs.map((o) => o.comparacion.executionId)).toEqual([caso.e.e1, caso.e.e2, caso.e.e3, caso.e.e4, caso.e.e5]);
    expect(obs.map((o) => o.delDia)).toEqual([1, 2, 3, 4, 5].map((orden) => ({ orden, total: 5 })));
    expect(obs.map((o) => o.rol)).toEqual(['planificado-y-registrado', 'planificado-y-registrado', 'planificado-y-registrado', 'planificado-y-registrado', 'sustituido']);
    const puntos = evolucion(obs, REPS, 1);
    expect(puntos.map((p) => [textoPlanificado(p.planificado, REPS), textoRegistrado(p.registrado, REPS)])).toEqual([
      ['8', '8'],
      ['6-8', 'No realizada: la sesión se registró así'],
      ['5', 'Sin dato por serie: se registró un resumen'],
      ['10', '10'],
      ['6-8', 'Se registró otro ejercicio'],
    ]);
    // La línea de lo planificado no une la v1 con la v2; lo registrado se corta en lo desconocido.
    expect(puntos[2]!.tramoPlanificado).not.toBe(puntos[3]!.tramoPlanificado);
    expect(puntos.map((p) => p.observacion.comparacion.planId)).toEqual([caso.v1, caso.v1, caso.v1, caso.v2, caso.v2]);
    expect(puntos.map((p) => p.tramoRegistrado === null)).toEqual([false, true, true, false, true]);
  });

  it('identidad y unidades: el ejercicio realizado por sustitución queda aparte; kg y lb son medidas separadas', async () => {
    const xs = await contexto();
    const ejercicios = ejerciciosComparables(xs);
    const mancuernas = ejercicios.find((e) => e.clave === `v:${CATALOGO_DE_EJERCICIOS.pressConMancuernas}`)!;
    expect(mancuernas).toBeDefined();
    const [p] = evolucion(observacionesDelEjercicio(xs, mancuernas.clave), { variable: 'carga', unidad: 'lb' }, 1);
    expect(p!.planificado.tipo).toBe('otro-ejercicio');
    expect(p!.registrado).toEqual({ tipo: 'valor', valor: 45 });
    const banca = ejercicios.find((e) => e.nombre.toLowerCase().includes('banca') && e.clave.startsWith('e:'))!;
    const medidas = medidasDisponibles(observacionesDelEjercicio(xs, banca.clave).map((o) => o.comparacion));
    expect(medidas).toEqual([{ variable: 'repeticiones' }, { variable: 'carga', unidad: 'kg' }, { variable: 'carga', unidad: 'lb' }, { variable: 'rir' }]);
  });
});

describe('Planificado y registrado · autorización y privacidad de la lectura (API-TRN-21, reglas del profesional)', () => {
  it('solo lo registrado: el borrador abierto con series no aparece', async () => {
    const xs = await contexto();
    expect(xs).toHaveLength(5);
    expect(xs.every((x) => x.state === 'REGISTERED')).toBe(true);
    expect(JSON.stringify(xs)).not.toContain(caso.borrador);
  });

  it('otro profesional de entrenamiento vinculado al mismo asesorado no ve estas ejecuciones: no hay nada que comparar', async () => {
    const otro = await prepararProfesional(app, `cmp-otro-${randomUUID().slice(0, 6)}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, caso.c.ase, 'ENTRENAMIENTO');
    const r = await conSesion(app, otro.token).get(`/api/v1/advisees/${caso.c.ase.id}/training/review-context`).expect(200);
    expect(r.body.data.registeredExecutions).toEqual([]);
    expect(ejerciciosComparables(r.body.data.registeredExecutions)).toEqual([]);
  });

  it('otro alcance, un asesorado ajeno o el propio asesorado: el mismo 404 que lo inexistente', async () => {
    const nutri = await prepararProfesional(app, `cmp-nutri-${randomUUID().slice(0, 6)}`, ['NUTRICION']);
    await vinculoCompleto(app, nutri, caso.c.ase, 'NUTRICION');
    const inexistente = await conSesion(app, caso.c.pro.token).get(`/api/v1/advisees/${randomUUID()}/training/review-context`).expect(404);
    const otroAlcance = await conSesion(app, nutri.token).get(`/api/v1/advisees/${caso.c.ase.id}/training/review-context`).expect(404);
    expect(otroAlcance.body).toEqual(inexistente.body);
    const ajeno = await prepararAsesorado(app, `cmp-ajeno-${randomUUID().slice(0, 6)}`, { a3: true });
    const sinVinculo = await conSesion(app, caso.c.pro.token).get(`/api/v1/advisees/${ajeno.id}/training/review-context`).expect(404);
    expect(sinVinculo.body).toEqual(inexistente.body);
    // Las reglas son las del profesional: el asesorado no lee su historial por esta operación (tiene la suya, DL-096).
    const propio = await conSesion(app, caso.c.ase.token).get(`/api/v1/advisees/${caso.c.ase.id}/training/review-context`);
    expect(propio.status).not.toBe(200);
  });

  it('el período está acotado: más de 92 días es PERIOD_TOO_LONG', async () => {
    const r = await conSesion(app, caso.c.pro.token).get(`/api/v1/advisees/${caso.c.ase.id}/training/review-context?periodStart=2026-01-01&periodEnd=2026-06-30`).expect(400);
    expect(JSON.stringify(r.body)).toContain('PERIOD_TOO_LONG');
  });

  it('revocado el B2, la lectura se deniega con el 404 neutral (se corre al final: deja el caso sin acceso)', async () => {
    await revocarB2(app, caso.c.ase, caso.c.consentId).expect(200);
    await conSesion(app, caso.c.pro.token).get(`/api/v1/advisees/${caso.c.ase.id}/training/review-context`).expect(404);
  });
});
