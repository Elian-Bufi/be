/**
 * WP-ENTRENAMIENTO-SERIES por la API real, contra PostgreSQL: los objetivos por serie (DL-122), la imagen del ejercicio
 * (DL-123) y los tiempos de la sesión (DL-124). Cada prueba cita su caso de `ACEPTACION.csv`, del paquete de Dirección del
 * 2026-10-06 (docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/). Los datos salen de ese paquete: la sesión
 * «Piernas A» (`sesion_demo.json`), las tres imágenes con su catálogo y los casos de tiempos (`casos_tiempos.json`); acá
 * no se copia ningún número.
 */
import type { INestApplication } from '@nestjs/common';
import {
  AccesoAMedioResponseSchema,
  ActivacionDePlanDeEntrenamientoResponseSchema,
  BASE_DEL_RELOJ_DESDE_LA_API,
  BorradorDeEjecucionResponseSchema,
  ConfirmacionDeEjecucionResponseSchema,
  ContextoDeRevisionDeEntrenamientoResponseSchema,
  EjecucionDeEntrenamientoResponseSchema,
  EjercicioPropioResponseSchema,
  estructuraConObjetivosComoEntrada,
  HistorialDeEntrenamientoResponseSchema,
  HoyDeEntrenamientoResponseSchema,
  ListaDeEjerciciosPropiosResponseSchema,
  ListaDePlanesDeEntrenamientoResponseSchema,
  OcurrenciasDelPeriodoResponseSchema,
  PlanConObjetivosResponseSchema,
  PlanDeEntrenamientoResponseSchema,
  PlantillaDeEntrenamientoResponseSchema,
  ResultadoDeEventosResponseSchema,
  SesionEnCursoResponseSchema,
  SesionHabitualResponseSchema,
  SesionParaRegistrarResponseSchema,
  TiemposDeSesionResponseSchema,
  type EventoDeTiempo,
  type PlanConObjetivos,
  type PrescripcionConObjetivos,
  type SesionConObjetivos,
  type TiemposDeSesion,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { appDePrueba, claveDeIdempotencia, conSesion, simultaneos } from './soporte-api';
import {
  activarPlanDeEntrenamiento,
  CATALOGO_DE_EJERCICIOS,
  circuitoListoParaPlanificarEntrenamiento,
  cuerpoDeEvaluacionDeEntrenamiento,
  cuerpoDeObjetivoDeEntrenamiento,
  estructuraDeEntrenamiento,
  PROCEDENCIA_SQL,
} from './soporte-entrenamiento';
import {
  abrirBorrador,
  activar,
  asociarImagen,
  autoriaDe,
  baseDeCarga,
  baseDeRepeticiones,
  borradorDeLaDemo,
  caso,
  conLaApk,
  corrida,
  cuerpoDeImagen,
  ejerciciosDeLaDemo,
  estructuraDeLaDemo,
  IMAGENES_DEL_PAQUETE,
  mandarEventos,
  objetivoDeLaDemo,
  ocurrenciaDeHoy,
  pasosDelEjemplo,
  prescripcionDeLaDemo,
  prescripcionIdDe,
  registrarYConfirmar,
  registroDeLaDemo,
  retirarImagen,
  SESION_DEMO,
  SESION_ID,
  subirImagenDeEjercicio,
  usarLaApk,
  type EjercicioDeLaDemo,
  type ImagenDelPaquete,
  type PlanDeLaDemo,
} from './soporte-por-serie';
import { FOTOS, leerImagen, subirBytes, subirImagen } from './soporte-recetas';
import { a3Vigente, finalizar, otorgarA3, pausar, prepararAsesorado, prepararProfesional, reanudar, revocarB2, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

// ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────────────

const [EJ_A, EJ_B, EJ_C] = SESION_DEMO.exercises as [EjercicioDeLaDemo, EjercicioDeLaDemo, EjercicioDeLaDemo];
const imagenDe = (e: EjercicioDeLaDemo): ImagenDelPaquete => IMAGENES_DEL_PAQUETE.find((i) => i.fixtureKey === e.catalogFixtureKey)!;
const CAMPOS = ['rir', 'suggestedLoad', 'restSeconds'] as const;

async function planConObjetivos(plan: PlanDeLaDemo, planId = plan.planId): Promise<PlanConObjetivos> {
  return PlanConObjetivosResponseSchema.parse((await conSesion(app, plan.pro.token).get(`/api/v1/training/plans/${planId}/detail`).expect(200)).body).data;
}
const sesionDe = (p: PlanConObjetivos): SesionConObjetivos => p.blocks[0]!.sessions.find((s) => s.sessionId === SESION_ID)!;
const prescripcionDe = (s: SesionConObjetivos, e: EjercicioDeLaDemo): PrescripcionConObjetivos => s.prescriptions.find((p) => p.prescriptionId === prescripcionIdDe(e))!;

async function sesionParaRegistrar(plan: PlanDeLaDemo, occurrenceId: string) {
  return SesionParaRegistrarResponseSchema.parse((await conSesion(app, plan.ase.token).get(`/api/v1/training/occurrences/${occurrenceId}/session`).expect(200)).body).data;
}

/** Cada serie de la sesión devuelve exactamente lo del paquete: rango, carga, RIR y descanso, y las bases declaradas. */
function verificarObjetivosDelPaquete(sesion: SesionConObjetivos): void {
  expect(sesion.label).toBe(SESION_DEMO.name);
  expect(sesion.prescriptions.map((p) => p.prescriptionId)).toEqual(SESION_DEMO.exercises.map(prescripcionIdDe));
  for (const e of SESION_DEMO.exercises) {
    const p = prescripcionDe(sesion, e);
    expect([p.prescriptionId, p.loadBasis, p.repetitionBasis]).toEqual([prescripcionIdDe(e), baseDeCarga(e.loadBasis), baseDeRepeticiones(e.repetitionBasis)]);
    expect(p.sets.map((s) => [s.setIndex, s.target])).toEqual(e.sets.map((s) => [s.setIndex, objetivoDeLaDemo(s)]));
  }
}

/** Una imagen de cada ejercicio de la demostración, subida y asociada por la API (MED-01, MED-02 y EJE-02). */
async function imagenesDeLaDemo(plan: PlanDeLaDemo): Promise<Map<string, string>> {
  const medios = new Map<string, string>();
  for (const e of SESION_DEMO.exercises) {
    const ejercicio = plan.ejercicios.get(e.catalogFixtureKey)!;
    const subida = await subirImagenDeEjercicio(app, plan.pro, imagenDe(e));
    await asociarImagen(app, plan.pro, ejercicio.exerciseId, cuerpoDeImagen(imagenDe(e), ejercicio.versionId, subida.mediaId, 0)).expect(200);
    medios.set(e.fixtureKey, subida.mediaId);
  }
  return medios;
}

// ─── DL-122 · objetivos por serie ─────────────────────────────────────────────────────────────────

describe('DL-122 · objetivos por serie (P01, P02)', () => {
  it('P01 · «Piernas A», guardada por API-TRN-10, vuelve con el rango, la carga, el RIR y el descanso de cada serie del paquete: por SER-01 antes y después de activar, y por SER-02 para el titular', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('ser-p01'));
    const borrador = await planConObjetivos(plan);
    expect(borrador.state).toBe('DRAFT');
    verificarObjetivosDelPaquete(sesionDe(borrador));

    const activacion = ActivacionDePlanDeEntrenamientoResponseSchema.parse((await activar(app, plan).expect(200)).body).data;
    const activada = await planConObjetivos(plan);
    expect(activada).toMatchObject({ state: 'ACTIVATED', snapshotDigest: activacion.snapshotDigest, templateOrigin: null });
    // La versión activada se lee desde la instantánea y da exactamente lo mismo que el borrador.
    expect(sesionDe(activada).prescriptions).toEqual(sesionDe(borrador).prescriptions);

    const ocurrencia = await ocurrenciaDeHoy(app, plan.ase);
    const sesion = await sesionParaRegistrar(plan, ocurrencia);
    expect(sesion).toMatchObject({ occurrenceId: ocurrencia, planId: plan.planId, snapshotDigest: activacion.snapshotDigest, timeZone: 'America/Argentina/Buenos_Aires' });
    // El teléfono recibe exactamente esos objetivos (demostración mínima, punto 3).
    expect(sesion.session).toEqual({ ...sesionDe(activada), order: 1 });
    verificarObjetivosDelPaquete(sesion.session);
  });

  it('P02 · ausente hereda, null quita y un valor sobrescribe: lo declarado vuelve con sus tres estados y el origen de cada objetivo; null nunca es cero', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('ser-p02'));
    const enviada = estructuraDeLaDemo(plan.ejercicios).blocks[0]!.sessions as { prescriptions: (Record<string, unknown> & { sets: Record<string, unknown>[] })[] }[];
    const leida = sesionDe(await planConObjetivos(plan));
    for (const [k, mandada] of enviada[0]!.prescriptions.entries()) {
      const p = leida.prescriptions[k]!;
      const heredable = { rir: p.intensity?.criterion === 'RIR', suggestedLoad: p.suggestedLoad !== null, restSeconds: p.restSeconds !== null };
      mandada.sets.forEach((m, i) => {
        const s = p.sets[i]!;
        for (const campo of CAMPOS) {
          // La clave vuelve solo si se mandó, con el mismo valor (también null).
          expect([p.prescriptionId, i, campo, Object.hasOwn(s, campo), s[campo]]).toEqual([p.prescriptionId, i, campo, Object.hasOwn(m, campo), m[campo]]);
          expect([p.prescriptionId, i, campo, s.targetOrigin[campo]]).toEqual([p.prescriptionId, i, campo, Object.hasOwn(m, campo) ? 'SET' : heredable[campo] ? 'PRESCRIPTION' : 'NONE']);
        }
      });
    }
    // Los casos del paquete que prueban la semántica: C3 quita el descanso que la prescripción tiene (null, no 0); C no
    // tiene RIR (sin criterio, NONE); la carga 0 kg de C es un valor y se hereda como 0 kg, no como null.
    const c = prescripcionDe(leida, EJ_C);
    expect(c.sets[2]).toMatchObject({ restSeconds: null, target: { restSeconds: null }, targetOrigin: { restSeconds: 'SET', rir: 'NONE', suggestedLoad: 'PRESCRIPTION' } });
    expect(c.sets.map((s) => s.target.suggestedLoad)).toEqual(EJ_C.sets.map((s) => s.suggestedLoad));
    expect(c.sets.map((s) => s.target.rir)).toEqual(EJ_C.sets.map((s) => s.plannedRir));
    // El tri-estado vive en el JSON de la versión: la clave ausente no se guarda; null sí.
    const fila = await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: plan.planId } });
    const guardadas = (fila.contenido as { blocks: { sessions: { prescriptions: { sets: Record<string, unknown>[] }[] }[] }[] }).blocks[0]!.sessions[0]!.prescriptions;
    guardadas.forEach((g, k) =>
      g.sets.forEach((s, i) => {
        for (const campo of CAMPOS) expect([k, i, campo, Object.hasOwn(s, campo)]).toEqual([k, i, campo, Object.hasOwn(enviada[0]!.prescriptions[k]!.sets[i]!, campo)]);
      }),
    );
  });

  it('P02 · un RIR por serie sin el criterio RIR, o fuera de 0 a 10, es 422 INTENSITY_CRITERION_INVALID con su motivo y su ruta; la forma estricta es 400; nada se guarda', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('ser-p02-422'));
    const pro = conSesion(app, plan.pro.token);
    type Prescripciones = (Record<string, unknown> & { sets: Record<string, unknown>[] })[];
    const conCambio = (cambiar: (ps: Prescripciones) => void) => {
      const e = estructuraDeLaDemo(plan.ejercicios) as { blocks: { sessions: { prescriptions: Prescripciones }[] }[] };
      cambiar(e.blocks[0]!.sessions[0]!.prescriptions);
      return e;
    };
    const ruta = (k: number, i: number) => `blocks[0].sessions[0].prescriptions[${k}].sets[${i}].rir`;
    const conRir = (ps: Prescripciones, k: number) => ps[k]!.sets.flatMap((s, i) => (Object.hasOwn(s, 'rir') ? [i] : []));
    const casos: [string, ReturnType<typeof conCambio>, { code: string; path: string }[]][] = [];
    // Con %RM, un RIR por serie sería un segundo criterio (REG-06-128).
    const conPorcentaje = conCambio((ps) => {
      ps[0]!.intensity = { criterion: 'PERCENT_RM', target: { value: 70, reference: { description: '1RM estimado por el profesional' } } };
    });
    casos.push(['%RM', conPorcentaje, conRir(conPorcentaje.blocks[0]!.sessions[0]!.prescriptions, 0).map((i) => ({ code: 'SET_RIR_WITHOUT_RIR_CRITERION', path: ruta(0, i) }))]);
    // Sin criterio, tampoco: ni siquiera quitarlo con null.
    casos.push(['sin criterio', conCambio((ps) => void (ps[2]!.sets[0]!.rir = null)), [{ code: 'SET_RIR_WITHOUT_RIR_CRITERION', path: ruta(2, 0) }]]);
    // De 0 a 10, con decimales: 10,5 y -1 no; 2,5 sí.
    casos.push([
      'fuera de rango',
      conCambio((ps) => {
        ps[0]!.sets[1]!.rir = 10.5;
        ps[0]!.sets[2]!.rir = -1;
        ps[1]!.sets[1]!.rir = 2.5;
      }),
      [
        { code: 'SET_RIR_OUT_OF_RANGE', path: ruta(0, 1) },
        { code: 'SET_RIR_OUT_OF_RANGE', path: ruta(0, 2) },
      ],
    ]);
    expect(casos[0]![2].length).toBeGreaterThan(0);
    for (const [nombre, estructura, issues] of casos) {
      const r = await pro.patch(`/api/v1/training/plans/${plan.planId}`).send({ expectedVersion: plan.version, changes: estructura });
      expect([nombre, r.status, r.body.error?.code, r.body.error?.details?.issues]).toEqual([nombre, 422, 'INTENSITY_CRITERION_INVALID', issues]);
    }
    // La forma es estricta: un descanso de más de una hora o con decimales, o una base desconocida, es 400.
    for (const cambio of [(ps: Prescripciones) => void (ps[0]!.restSeconds = 3601), (ps: Prescripciones) => void (ps[0]!.sets[0]!.restSeconds = 1.5), (ps: Prescripciones) => void (ps[0]!.loadBasis = 'TWO_DUMBBELLS')]) {
      await pro.patch(`/api/v1/training/plans/${plan.planId}`).send({ expectedVersion: plan.version, changes: conCambio(cambio) }).expect(400);
    }
    // Nada se guardó: la versión es la misma y los objetivos, los del paquete.
    const leido = await planConObjetivos(plan);
    expect(leido.version).toBe(plan.version);
    verificarObjetivosDelPaquete(sesionDe(leido));
    // Al crear el plan (API-TRN-07), la misma regla.
    const otro = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('ser-p02-07'), plan.pro);
    const r = await pro.post(`/api/v1/advisees/${otro.ase.id}/training/plans`).send({ objectiveVersionId: otro.objectiveVersionId, initialStructure: conPorcentaje }).expect(422);
    expect(r.body.error.code).toBe('INTENSITY_CRITERION_INVALID');
  });

  it('P01 y H02 · la sucesora (basedOnPlanId) parte de la instantánea y conserva los objetivos por serie; editada desde SER-01 como lo hace la web, vuelve igual', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('ser-sucesora'));
    await activar(app, plan).expect(200);
    const activada = await planConObjetivos(plan);
    const pro = conSesion(app, plan.pro.token);
    const s = await pro.post(`/api/v1/advisees/${plan.ase.id}/training/plans`).send({ objectiveVersionId: plan.objectiveVersionId, basedOnPlanId: plan.planId }).expect(201);
    const sucesora = await planConObjetivos(plan, s.body.data.planId as string);
    expect(sucesora).toMatchObject({ state: 'DRAFT', predecessorPlanId: plan.planId });
    expect(sesionDe(sucesora).prescriptions).toEqual(sesionDe(activada).prescriptions);
    // El editor guarda lo que leyó (estructuraConObjetivosComoEntrada): la vuelta no cambia ningún objetivo ni su origen.
    const guardada = await pro.patch(`/api/v1/training/plans/${sucesora.planId}`).send({ expectedVersion: sucesora.version, changes: { blocks: estructuraConObjetivosComoEntrada(sucesora) } }).expect(200);
    const releida = await planConObjetivos(plan, guardada.body.data.planId as string);
    expect(sesionDe(releida).prescriptions).toEqual(sesionDe(sucesora).prescriptions);
  });

  it('P01 · D-2: una plantilla «sin cargas» conserva el RIR y el descanso de cada serie y quita las cargas, también las de cada serie; aplicada, el plan los trae', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('ser-plantilla'));
    const pro = conSesion(app, plan.pro.token);
    const t = await pro.post('/api/v1/training/plan-templates').send({ name: `Piernas ${randomUUID().slice(0, 8)}`, structure: estructuraDeLaDemo(plan.ejercicios) }).expect(201);
    const plantilla = PlantillaDeEntrenamientoResponseSchema.parse(t.body).data;
    const enLaPlantilla = plantilla.structure.blocks[0]!.sessions![0]!.prescriptions;
    expect(enLaPlantilla.every((p) => !Object.hasOwn(p, 'suggestedLoad') && p.sets.every((s) => !Object.hasOwn(s, 'suggestedLoad')))).toBe(true);
    expect(enLaPlantilla.map((p) => [p.restSeconds, p.loadBasis, p.repetitionBasis])).toEqual(SESION_DEMO.exercises.map((e) => [e.sets[0]!.recommendedRestSeconds, baseDeCarga(e.loadBasis), baseDeRepeticiones(e.repetitionBasis)]));
    // Aplicada a otro asesorado del mismo profesional: el RIR y el descanso de cada serie llegan; la carga, no.
    const otro = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('ser-plantilla-aplicada'), plan.pro);
    const aplicado = await pro.post(`/api/v1/advisees/${otro.ase.id}/training/plans`).send({ objectiveVersionId: otro.objectiveVersionId, fromTemplateVersionId: plantilla.versionId }).expect(201);
    const leido = await planConObjetivos(plan, aplicado.body.data.planId as string);
    const sesion = leido.blocks[0]!.sessions[0]!;
    for (const e of SESION_DEMO.exercises) {
      const p = sesion.prescriptions.find((x) => x.exerciseVersionId === plan.ejercicios.get(e.catalogFixtureKey)!.versionId)!;
      expect(p.sets.map((s) => s.target)).toEqual(e.sets.map((s) => ({ ...objetivoDeLaDemo(s), suggestedLoad: null })));
    }
    // Con las cargas copiadas, también llegan.
    const conCargas = await pro.post('/api/v1/training/plan-templates').send({ name: `Piernas con cargas ${randomUUID().slice(0, 8)}`, structure: estructuraDeLaDemo(plan.ejercicios), copySuggestedLoads: true }).expect(201);
    expect(PlantillaDeEntrenamientoResponseSchema.parse(conCargas.body).data.structure).toEqual(estructuraDeLaDemo(plan.ejercicios));
    // La sesión habitual «sin cargas» (API-HAB-04), igual: el RIR y el descanso de cada serie quedan; las cargas, no.
    const sesionDeEntrada = (estructuraDeLaDemo(plan.ejercicios).blocks[0]!.sessions as Record<string, unknown>[])[0]!;
    const habitual = SesionHabitualResponseSchema.parse((await pro.post('/api/v1/training/session-presets').send({ name: `Piernas ${randomUUID().slice(0, 8)}`, structure: sesionDeEntrada }).expect(201)).body).data;
    expect(habitual.structure.prescriptions.map((p) => p.sets.map((s) => [Object.hasOwn(s, 'suggestedLoad'), s.rir, s.restSeconds]))).toEqual(
      enLaPlantilla.map((p) => p.sets.map((s) => [false, s.rir, s.restSeconds])),
    );
  });

  it('P05 · SER-01 es del profesional del plan y SER-02 del titular: los demás, también el otro lado del vínculo, reciben el mismo 404 que lo inexistente', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('ser-permisos'));
    await activar(app, plan).expect(200);
    const ocurrencia = await ocurrenciaDeHoy(app, plan.ase);
    const otroPro = await prepararProfesional(app, etiqueta('ser-otro-pro'), ['ENTRENAMIENTO']);
    const otroAse = await prepararAsesorado(app, etiqueta('ser-otro-ase'), { a3: true });
    const inexistente = (await conSesion(app, plan.pro.token).get(`/api/v1/training/plans/${randomUUID()}/detail`).expect(404)).body;
    for (const parte of [plan.ase, otroPro, otroAse]) {
      expect((await conSesion(app, parte.token).get(`/api/v1/training/plans/${plan.planId}/detail`).expect(404)).body).toEqual(inexistente);
    }
    await conSesion(app, plan.pro.token).get(`/api/v1/training/plans/${plan.planId}/detail?x=1`).expect(400);
    // SER-02: el profesional y otro asesorado no; una ocurrencia alterada tampoco.
    for (const parte of [plan.pro, otroPro, otroAse]) await conSesion(app, parte.token).get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(404);
    await conSesion(app, plan.ase.token).get(`/api/v1/training/occurrences/${ocurrencia.slice(0, -2)}xx/session`).expect(404);
    await conSesion(app, plan.ase.token).get(`/api/v1/training/occurrences/${ocurrencia}/session?x=1`).expect(400);
    // Con el consentimiento revocado, la ocurrencia que no tiene registro deja de ser legible.
    await revocarB2(app, plan.ase, plan.consentId).expect(200);
    await conSesion(app, plan.ase.token).get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(404);
  });
});

// ─── C01 · compatibilidad con la APK 0.13.2 ───────────────────────────────────────────────────────

/** Las claves de una prescripción en las lecturas que valida la APK 0.13.2, y las de cada serie. */
const CLAVES_DE_PRESCRIPCION = ['exerciseId', 'exerciseName', 'exerciseVersionId', 'intensity', 'note', 'order', 'prescriptionId', 'professionalParameters', 'sets', 'suggestedLoad'];
const CLAVES_DE_SERIE = ['note', 'repetitions', 'setIndex'];
const CAMPOS_NUEVOS = /"(restSeconds|loadBasis|repetitionBasis|targetOrigin|imagesAsOf|imageVersion|image)"/;

/** Las prescripciones planificadas de una respuesta, dondequiera que estén (plan, «Hoy», ejecución, contexto). */
function prescripcionesDe(valor: unknown): Record<string, unknown>[] {
  if (Array.isArray(valor)) return valor.flatMap(prescripcionesDe);
  if (valor === null || typeof valor !== 'object') return [];
  const o = valor as Record<string, unknown>;
  const propia = 'prescriptionId' in o && 'order' in o && 'intensity' in o ? [o] : [];
  return [...propia, ...Object.values(o).flatMap(prescripcionesDe)];
}

describe('C01 · lo que lee la APK 0.13.2 no cambia (DL-122 §8)', () => {
  it('C01 · TRN-07 a 10, 12, 14, 14-PERIODO, 15 a 21 y 19-LISTA, del profesional y del titular, pasan los esquemas estrictos con la prescripción de siempre, aunque el plan tenga objetivos por serie', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('c01'));
    const pro = conSesion(app, plan.pro.token);
    // El titular lee con la APK que muestra los objetivos por serie y lo declara: a un cliente que no lo declara, este plan
    // no se le entrega (compatibilidad-de-clientes.int-spec.ts). Las formas que valida son las mismas.
    const ase = conLaApk(app, plan.ase.token);
    const vistas: [string, unknown][] = [];
    const ver = (nombre: string, esquema: { parse: (v: unknown) => unknown }, cuerpo: unknown) => {
      esquema.parse(cuerpo);
      vistas.push([nombre, cuerpo]);
    };
    ver('API-TRN-07', PlanDeEntrenamientoResponseSchema, plan.creado);
    ver('API-TRN-10', PlanDeEntrenamientoResponseSchema, plan.guardado);
    ver('API-TRN-09 · profesional, borrador', PlanDeEntrenamientoResponseSchema, (await pro.get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body);
    ver('API-TRN-12', ActivacionDePlanDeEntrenamientoResponseSchema, (await activar(app, plan).expect(200)).body);
    ver('API-TRN-08 · profesional', ListaDePlanesDeEntrenamientoResponseSchema, (await pro.get(`/api/v1/advisees/${plan.ase.id}/training/plans`).expect(200)).body);
    ver('API-TRN-08 · titular', ListaDePlanesDeEntrenamientoResponseSchema, (await ase.get(`/api/v1/advisees/${plan.ase.id}/training/plans`).expect(200)).body);
    ver('API-TRN-09 · profesional', PlanDeEntrenamientoResponseSchema, (await pro.get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body);
    ver('API-TRN-09 · titular', PlanDeEntrenamientoResponseSchema, (await ase.get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body);
    const hoy = (await ase.get('/api/v1/me/training/today').expect(200)).body;
    ver('API-TRN-14', HoyDeEntrenamientoResponseSchema, hoy);
    const fecha = hoy.data.date as string;
    ver('API-TRN-14-PERIODO', OcurrenciasDelPeriodoResponseSchema, (await ase.get(`/api/v1/me/training/occurrences?periodStart=${fecha}&periodEnd=${fecha}`).expect(200)).body);
    const abierto = (await ase.put(`/api/v1/training/occurrences/${hoy.data.occurrences[0].occurrenceId as string}/execution-draft`).send({}).expect(201)).body;
    ver('API-TRN-15', BorradorDeEjecucionResponseSchema, abierto);
    ver('API-TRN-16', BorradorDeEjecucionResponseSchema, (await ase.get(`/api/v1/training/execution-drafts/${abierto.data.draftId as string}`).expect(200)).body);
    const { executionId, guardado, confirmado } = await registrarYConfirmar(app, plan, { draftId: abierto.data.draftId as string, version: abierto.data.version as string });
    ver('API-TRN-17', BorradorDeEjecucionResponseSchema, guardado);
    ver('API-TRN-18', ConfirmacionDeEjecucionResponseSchema, confirmado);
    ver('API-TRN-19 · titular', EjecucionDeEntrenamientoResponseSchema, (await ase.get(`/api/v1/training/executions/${executionId}`).expect(200)).body);
    ver('API-TRN-19 · profesional', EjecucionDeEntrenamientoResponseSchema, (await pro.get(`/api/v1/training/executions/${executionId}`).expect(200)).body);
    ver('API-TRN-19-LISTA', HistorialDeEntrenamientoResponseSchema, (await ase.get(`/api/v1/me/training/executions?periodStart=${fecha}&periodEnd=${fecha}`).expect(200)).body);
    const corregida = { ...registroDeLaDemo(plan.ejercicios), sessionCondition: 'COMPLETED_WITH_DEVIATION', reason: 'Una serie quedó corta.', sessionSummary: null };
    ver('API-TRN-20', EjecucionDeEntrenamientoResponseSchema, (await pro.post(`/api/v1/training/executions/${executionId}/corrections`).send({ reason: 'El asesorado avisó un desvío.', correction: corregida }).expect(201)).body);
    ver('API-TRN-21', ContextoDeRevisionDeEntrenamientoResponseSchema, (await pro.get(`/api/v1/advisees/${plan.ase.id}/training/review-context`).expect(200)).body);

    let prescripciones = 0;
    for (const [nombre, cuerpo] of vistas) {
      expect([nombre, JSON.stringify(cuerpo).match(CAMPOS_NUEVOS)?.[0] ?? null]).toEqual([nombre, null]);
      for (const p of prescripcionesDe(cuerpo)) {
        prescripciones++;
        expect([nombre, Object.keys(p).sort()]).toEqual([nombre, CLAVES_DE_PRESCRIPCION]);
        for (const s of p.sets as Record<string, unknown>[]) expect([nombre, Object.keys(s).sort()]).toEqual([nombre, CLAVES_DE_SERIE]);
      }
    }
    // Las prescripciones de la sesión aparecen en el plan, en «Hoy», en el período, en la ejecución, en el historial…
    expect(prescripciones).toBeGreaterThanOrEqual(SESION_DEMO.exercises.length * 10);
    // La carga y el criterio que ve esa APK son los de la prescripción, no los de cada serie (§8: lo que no se puede evitar).
    const vieja = (hoy.data.occurrences[0].plannedSession.prescriptions as Record<string, unknown>[]).find((p) => p.prescriptionId === prescripcionIdDe(EJ_A))!;
    expect([vieja.suggestedLoad, (vieja.intensity as { target: { value: number } }).target.value]).toEqual([EJ_A.sets[0]!.suggestedLoad, EJ_A.sets[0]!.plannedRir]);
  });

  it('C01 · un plan sin objetivos por serie se guarda como antes, y sus datos no se reinterpretan: el parámetro libre «Descanso» no se vuelve descanso estructurado', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('c01-viejo'));
    const r = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructuraDeEntrenamiento() }).expect(201);
    const fila = await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: r.body.data.planId as string } });
    expect(JSON.stringify(fila.contenido).match(/"(rir|restSeconds|loadBasis|repetitionBasis)"/)).toBeNull();
    PlanDeEntrenamientoResponseSchema.parse(r.body);
    // SER-01 de ese plan: el RIR y la carga de la prescripción se heredan; el descanso no existe, aunque haya un parámetro «Descanso».
    const leido = PlanConObjetivosResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${r.body.data.planId as string}/detail`).expect(200)).body).data;
    const banca = leido.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!;
    const entrada = estructuraDeEntrenamiento() as { blocks: { sessions: { prescriptions: { prescriptionId: string; professionalParameters?: unknown }[] }[] }[] };
    const parametros = entrada.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!.professionalParameters;
    expect(banca).toMatchObject({ restSeconds: null, loadBasis: null, repetitionBasis: null, professionalParameters: parametros });
    expect(banca.sets.map((s) => [Object.keys(s).sort(), s.target.rir, s.target.suggestedLoad, s.target.restSeconds, s.targetOrigin])).toEqual(
      banca.sets.map(() => [['note', 'setIndex', 'target', 'targetOrigin'], banca.intensity!.target.value, banca.suggestedLoad, null, { rir: 'PRESCRIPTION', suggestedLoad: 'PRESCRIPTION', restSeconds: 'NONE' }]),
    );
  });
});

// ─── DL-123 · imagen del ejercicio ────────────────────────────────────────────────────────────────

describe('DL-123 · imagen del ejercicio (P03, P04, P05, H02)', () => {
  it('P03 · los tres PNG del paquete entran por MED-01 y MED-02 como imagen de ejercicio y se asocian por identidad con EJE-02, con su licencia, autoría y revisión; EJE-01 los lista', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('eje-p03'));
    const ejercicios = await ejerciciosDeLaDemo(app, c.pro);
    const lista = async () => ListaDeEjerciciosPropiosResponseSchema.parse((await conSesion(app, c.pro.token).get('/api/v1/training/own-exercises').expect(200)).body).data;
    // Del más nuevo al más viejo (se cargaron en el orden de la sesión), sin imagen todavía: imageVersion 0.
    const deMasNuevoAMasViejo = [...SESION_DEMO.exercises].reverse().map(imagenDe);
    expect((await lista()).map((e) => [e.name, e.imageVersion, e.image])).toEqual(deMasNuevoAMasViejo.map((i) => [i.name, 0, null]));
    for (const imagen of IMAGENES_DEL_PAQUETE) {
      const ejercicio = ejercicios.get(imagen.fixtureKey)!;
      const subida = await subirImagenDeEjercicio(app, c.pro, imagen);
      expect(subida.medio).toMatchObject({ purpose: 'EXERCISE_REFERENCE', status: 'AVAILABLE', contentType: 'image/jpeg', provenance: 'AI_GENERATED', authorship: autoriaDe(imagen) });
      const r = EjercicioPropioResponseSchema.parse((await asociarImagen(app, c.pro, ejercicio.exerciseId, cuerpoDeImagen(imagen, ejercicio.versionId, subida.mediaId, 0)).expect(200)).body).data;
      expect(r).toMatchObject({ exerciseId: ejercicio.exerciseId, versionId: ejercicio.versionId, name: imagen.name, available: true, imageVersion: 1 });
      expect(r.image).toEqual({
        mediaId: subida.mediaId,
        imageVersion: 1,
        exerciseVersionId: ejercicio.versionId,
        provenance: 'AI_GENERATED',
        authorship: autoriaDe(imagen),
        // Sin licencia de terceros (`externalLicenseIdentifier: null`): ni inventada ni CC0.
        license: { kind: 'NO_EXTERNAL_LICENSE', usage: imagen.usage },
        technicalReview: 'PENDING_PROFESSIONAL_REVIEW',
        altText: imagen.alt,
        associatedAt: expect.any(String),
      });
      expect(imagen.externalLicenseIdentifier).toBeNull();
      // Su dueño la ve: un JPEG recodificado, sin metadatos.
      const bytes = await leerImagen(app, c.pro, subida.mediaId);
      const m = await sharp(bytes).metadata();
      expect([m.format, m.exif]).toEqual(['jpeg', undefined]);
    }
    const conImagen = await lista();
    expect(conImagen.map((e) => [e.name, e.imageVersion, e.image?.altText])).toEqual(deMasNuevoAMasViejo.map((i) => [i.name, 1, i.alt]));
    // La asociación quedó en la base por identidad y versión, con su licencia y su revisión.
    const filas = await prisma.asociacionDeImagenDeEjercicio.findMany({ where: { autorId: c.pro.id }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(filas.map((f) => [f.ejercicioId, f.versionDeEjercicioId, f.numero, f.cambio, f.revisionTecnica])).toEqual(
      IMAGENES_DEL_PAQUETE.map((i) => [ejercicios.get(i.fixtureKey)!.exerciseId, ejercicios.get(i.fixtureKey)!.versionId, 1, 'ASOCIAR', 'PENDIENTE_DE_REVISION_PROFESIONAL']),
    );
  });

  it('P04 · la validación es del servidor: un archivo inválido es 422 y no se puede asociar; la intención exige autoría y un profesional de Entrenamiento; sin imagen, el ejercicio se usa igual', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('eje-p04'));
    const ejercicios = await ejerciciosDeLaDemo(app, c.pro);
    const imagen = imagenDe(EJ_A);
    const ejercicio = ejercicios.get(EJ_A.catalogFixtureKey)!;
    const intencion = (parte: { token: string }, cambios: Record<string, unknown> = {}) =>
      conSesion(app, parte.token)
        .post('/api/v1/me/media/upload-intents')
        .send({ purpose: 'EXERCISE_REFERENCE', contentType: 'image/png', byteSize: 1000, provenance: 'AI_GENERATED', authorship: autoriaDe(imagen), ...cambios });
    // Bytes que no son una imagen: 422, y el medio queda pendiente, sin poder asociarse.
    const pendiente = (await intencion(c.pro).expect(201)).body.data;
    expect((await subirBytes(app, pendiente.uploadPath as string, Buffer.from('esto no es una imagen'), 'image/png').expect(422)).body.error.code).toBe('FILE_CONTENT_INVALID');
    const r = await asociarImagen(app, c.pro, ejercicio.exerciseId, cuerpoDeImagen(imagen, ejercicio.versionId, pendiente.mediaId as string, 0)).expect(422);
    expect(r.body.error).toMatchObject({ code: 'MEDIA_REFERENCE_INVALID', details: { issues: [{ code: 'MEDIA_REFERENCE_INVALID', path: 'mediaId' }] } });
    // Un tipo no admitido, de entrada.
    expect((await intencion(c.pro, { contentType: 'image/gif' }).expect(422)).body.error.code).toBe('FILE_TYPE_NOT_ALLOWED');
    // Sin autoría no hay imagen de ejercicio (REG-06-134).
    const sinAutoria = await intencion(c.pro, { authorship: null }).expect(422);
    expect(sinAutoria.body.error).toMatchObject({ code: 'VALIDATION_FAILED', details: { issues: [{ code: 'EXERCISE_REFERENCE_AUTHORSHIP_REQUIRED', path: 'authorship' }] } });
    // Solo un profesional de Entrenamiento: uno de Nutrición y un asesorado reciben 403.
    const nutri = await prepararProfesional(app, etiqueta('eje-p04-nutri'), ['NUTRICION']);
    expect((await intencion(nutri).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    expect((await intencion(c.ase).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    // Sin imagen, el ejercicio se prescribe igual y la sesión no se bloquea: la imagen es null y la APK muestra el respaldo.
    const lista = ListaDeEjerciciosPropiosResponseSchema.parse((await conSesion(app, c.pro.token).get('/api/v1/training/own-exercises').expect(200)).body).data;
    expect(lista.find((e) => e.exerciseId === ejercicio.exerciseId)).toMatchObject({ imageVersion: 0, image: null });
  });

  it('P05 · la lee el asesorado con un plan activado del profesional que incluye el ejercicio; otro asesorado, otro profesional y el asesorado sin acceso vigente reciben 404; nadie más la cambia', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('eje-p05'));
    const medios = await imagenesDeLaDemo(plan);
    const mediaA = medios.get(EJ_A.fixtureKey)!;
    // Con el plan en borrador todavía no: un borrador no existe para el asesorado.
    await conSesion(app, plan.ase.token).get(`/api/v1/media/${mediaA}/access`).expect(404);
    await activar(app, plan).expect(200);
    for (const mediaId of medios.values()) {
      AccesoAMedioResponseSchema.parse((await conSesion(app, plan.ase.token).get(`/api/v1/media/${mediaId}/access`).expect(200)).body);
      expect((await leerImagen(app, plan.ase, mediaId)).length).toBeGreaterThan(0);
    }
    // El acceso queda auditado con el titular como sujeto; el del profesional dueño, sin sujeto.
    const auditoria = await prisma.registroDeAuditoria.findFirst({ where: { operacion: 'API-MED-03', resultado: 'EXITO', recursoId: mediaA, actorId: plan.ase.id } });
    expect(auditoria).toMatchObject({ sujetoId: plan.ase.id, recursoTipo: 'Medio' });
    await leerImagen(app, plan.pro, mediaA);
    expect(await prisma.registroDeAuditoria.findFirst({ where: { operacion: 'API-MED-03', resultado: 'EXITO', recursoId: mediaA, actorId: plan.pro.id } })).toMatchObject({ sujetoId: null });
    // Otro asesorado y otro profesional: el mismo 404 que un medio inexistente, con la denegación registrada en Entrenamiento.
    const otroAse = await prepararAsesorado(app, etiqueta('eje-p05-ase'), { a3: true });
    const otroPro = await prepararProfesional(app, etiqueta('eje-p05-pro'), ['ENTRENAMIENTO']);
    const inexistente = (await conSesion(app, otroAse.token).get(`/api/v1/media/${randomUUID()}/access`).expect(404)).body;
    for (const parte of [otroAse, otroPro]) expect((await conSesion(app, parte.token).get(`/api/v1/media/${mediaA}/access`).expect(404)).body).toEqual(inexistente);
    expect(await prisma.decisionDeAcceso.findFirst({ where: { operacion: 'API-MED-03', actorId: otroPro.id, recursoId: mediaA } })).toMatchObject({ resultado: 'DENEGADA', alcance: 'ENTRENAMIENTO' });
    // Nadie más la cambia: otro profesional sobre el ejercicio ajeno, 404; con un medio ajeno en uno propio, 422.
    const ejercicioA = plan.ejercicios.get(EJ_A.catalogFixtureKey)!;
    const suya = await subirImagenDeEjercicio(app, otroPro, imagenDe(EJ_A));
    await asociarImagen(app, otroPro, ejercicioA.exerciseId, cuerpoDeImagen(imagenDe(EJ_A), ejercicioA.versionId, suya.mediaId, 1)).expect(404);
    await retirarImagen(app, otroPro, ejercicioA.exerciseId, '?expectedImageVersion=1').expect(404);
    const propios = await ejerciciosDeLaDemo(app, otroPro);
    const propio = propios.get(EJ_A.catalogFixtureKey)!;
    expect((await asociarImagen(app, otroPro, propio.exerciseId, cuerpoDeImagen(imagenDe(EJ_A), propio.versionId, mediaA, 0)).expect(422)).body.error.code).toBe('MEDIA_REFERENCE_INVALID');
    // Revocado el consentimiento, el asesorado deja de leerla (UC-P12 E06): el acceso de Entrenamiento ya no está vigente.
    await revocarB2(app, plan.ase, plan.consentId).expect(200);
    await conSesion(app, plan.ase.token).get(`/api/v1/media/${mediaA}/access`).expect(404);
  });

  it('P03, P05 y M04 · EJE-02 y EJE-03: reemplazar y retirar dejan la historia y no borran el medio; una versión vieja es 409; la versión de otro ejercicio o un medio de otra finalidad, 422; lo sembrado, 404; un asesorado, 403', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('eje-cambios'));
    const ejercicios = await ejerciciosDeLaDemo(app, c.pro);
    const [a, b] = [ejercicios.get(EJ_A.catalogFixtureKey)!, ejercicios.get(EJ_B.catalogFixtureKey)!];
    const [imagenA, imagenB] = [imagenDe(EJ_A), imagenDe(EJ_B)];
    const primera = await subirImagenDeEjercicio(app, c.pro, imagenA);
    const segunda = await subirImagenDeEjercicio(app, c.pro, imagenB);
    const clave = claveDeIdempotencia();
    const asociada = (await asociarImagen(app, c.pro, a.exerciseId, cuerpoDeImagen(imagenA, a.versionId, primera.mediaId, 0), clave).expect(200)).body.data;
    // Un reintento con la misma clave responde lo mismo y no agrega nada; con otro cuerpo, IDEMPOTENCY_KEY_REUSED.
    expect((await asociarImagen(app, c.pro, a.exerciseId, cuerpoDeImagen(imagenA, a.versionId, primera.mediaId, 0), clave).expect(200)).body.data).toEqual(asociada);
    expect((await asociarImagen(app, c.pro, a.exerciseId, cuerpoDeImagen(imagenA, a.versionId, segunda.mediaId, 0), clave).expect(409)).body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    // La versión vista ya cambió: 409, nada se pisa.
    expect((await asociarImagen(app, c.pro, a.exerciseId, cuerpoDeImagen(imagenA, a.versionId, segunda.mediaId, 0)).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    // Por identidad: la versión de otro ejercicio, o un identificador cualquiera, es EXERCISE_REFERENCE_INVALID.
    for (const version of [b.versionId, randomUUID(), 'no-es-un-id']) {
      const r = await asociarImagen(app, c.pro, a.exerciseId, cuerpoDeImagen(imagenA, version, segunda.mediaId, 1)).expect(422);
      expect(r.body.error).toMatchObject({ code: 'EXERCISE_REFERENCE_INVALID', details: { issues: [{ code: 'EXERCISE_REFERENCE_INVALID', path: 'exerciseVersionId' }] } });
    }
    // Un medio de otra finalidad (la imagen de una receta) no sirve, aunque sea del mismo profesional.
    const conNutricion = await prepararProfesional(app, etiqueta('eje-dos-alcances'), ['ENTRENAMIENTO', 'NUTRICION']);
    const deReceta = await subirImagen(app, conNutricion, FOTOS[0]!, { purpose: 'RECIPE_REFERENCE', authorship: 'Generada por IA' });
    const suyo = (await ejerciciosDeLaDemo(app, conNutricion)).get(EJ_A.catalogFixtureKey)!;
    expect((await asociarImagen(app, conNutricion, suyo.exerciseId, cuerpoDeImagen(imagenA, suyo.versionId, deReceta.mediaId, 0)).expect(422)).body.error.code).toBe('MEDIA_REFERENCE_INVALID');
    // Una licencia externa se guarda con su identificador, su nombre y su URL; nunca hay una por defecto.
    const externa = { kind: 'EXTERNAL', id: 'CC-BY-4.0', label: 'Creative Commons Atribución 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' };
    const reemplazada = (await asociarImagen(app, c.pro, a.exerciseId, { ...cuerpoDeImagen(imagenA, a.versionId, segunda.mediaId, 1), license: externa, technicalReview: 'REVIEWED_BY_PROFESSIONAL' }).expect(200)).body.data;
    expect(reemplazada).toMatchObject({ imageVersion: 2, image: { mediaId: segunda.mediaId, imageVersion: 2, license: externa, technicalReview: 'REVIEWED_BY_PROFESSIONAL' } });
    await asociarImagen(app, c.pro, a.exerciseId, { ...cuerpoDeImagen(imagenA, a.versionId, segunda.mediaId, 2), license: undefined }).expect(400);
    // Retirar: con la versión vieja, 409; con la vigente, queda sin imagen y la historia suma una fila; el medio sigue.
    await retirarImagen(app, c.pro, a.exerciseId, '?expectedImageVersion=1').expect(409);
    await retirarImagen(app, c.pro, a.exerciseId, '').expect(400);
    await retirarImagen(app, c.pro, a.exerciseId, '?expectedImageVersion=0').expect(400);
    await retirarImagen(app, c.pro, a.exerciseId, '?expectedImageVersion=2&x=1').expect(400);
    const retirada = (await retirarImagen(app, c.pro, a.exerciseId, '?expectedImageVersion=2').expect(200)).body.data;
    expect(retirada).toMatchObject({ exerciseId: a.exerciseId, imageVersion: 3, image: null });
    // Sin imagen vigente no hay nada que retirar: 200 igual, sin otra fila.
    await retirarImagen(app, c.pro, a.exerciseId, '?expectedImageVersion=3').expect(200);
    const historia = await prisma.asociacionDeImagenDeEjercicio.findMany({ where: { ejercicioId: a.exerciseId }, orderBy: { numero: 'asc' } });
    expect(historia.map((h) => [h.numero, h.cambio, h.medioId, h.versionDeEjercicioId])).toEqual([
      [1, 'ASOCIAR', primera.mediaId, a.versionId],
      [2, 'ASOCIAR', segunda.mediaId, a.versionId],
      [3, 'RETIRAR', null, a.versionId],
    ]);
    for (const mediaId of [primera.mediaId, segunda.mediaId]) expect((await leerImagen(app, c.pro, mediaId)).length).toBeGreaterThan(0);
    // El catálogo sembrado no recibe imágenes de profesionales (REG-06-135): el mismo 404 que lo inexistente.
    const sembrado = await asociarImagen(app, c.pro, '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02', cuerpoDeImagen(imagenA, CATALOGO_DE_EJERCICIOS.pressDeBanca, segunda.mediaId, 0)).expect(404);
    expect(sembrado.body).toEqual((await asociarImagen(app, c.pro, randomUUID(), cuerpoDeImagen(imagenA, a.versionId, segunda.mediaId, 0)).expect(404)).body);
    // Un asesorado no es profesional de Entrenamiento: 403, como el catálogo propio.
    for (const r of [await asociarImagen(app, c.ase, a.exerciseId, cuerpoDeImagen(imagenA, a.versionId, segunda.mediaId, 3)), await conSesion(app, c.ase.token).get('/api/v1/training/own-exercises')]) {
      expect([r.status, r.body.error.code]).toEqual([403, 'ACTION_FORBIDDEN']);
    }
  });

  it('H02 · lo registrado conserva la imagen vigente al registrar y su objetivo histórico: reemplazar, retirar o activar una sucesora después no lo reescribe', async () => {
    const plan = await borradorDeLaDemo(app, etiqueta('eje-h02'));
    const medios = await imagenesDeLaDemo(plan);
    await activar(app, plan).expect(200);
    const ocurrencia = await ocurrenciaDeHoy(app, plan.ase);
    const antes = await sesionParaRegistrar(plan, ocurrencia);
    expect(SESION_DEMO.exercises.map((e) => prescripcionDe(antes.session, e).image?.mediaId)).toEqual(SESION_DEMO.exercises.map((e) => medios.get(e.fixtureKey)));
    const { recordedAt } = await registrarYConfirmar(app, plan, await abrirBorrador(app, plan.ase, ocurrencia));
    // Después de registrar, el profesional reemplaza la imagen de A y retira la de B.
    const [a, b] = [plan.ejercicios.get(EJ_A.catalogFixtureKey)!, plan.ejercicios.get(EJ_B.catalogFixtureKey)!];
    const nueva = await subirImagenDeEjercicio(app, plan.pro, imagenDe(EJ_C));
    await asociarImagen(app, plan.pro, a.exerciseId, cuerpoDeImagen(imagenDe(EJ_A), a.versionId, nueva.mediaId, 1)).expect(200);
    await retirarImagen(app, plan.pro, b.exerciseId, '?expectedImageVersion=1').expect(200);
    const despues = await sesionParaRegistrar(plan, ocurrencia);
    expect(despues.imagesAsOf).toBe(recordedAt);
    expect(despues.session).toEqual(antes.session);
    // Lo vigente sí cambió.
    const vigente = sesionDe(await planConObjetivos(plan));
    expect([prescripcionDe(vigente, EJ_A).image?.mediaId, prescripcionDe(vigente, EJ_A).image?.imageVersion, prescripcionDe(vigente, EJ_B).image]).toEqual([nueva.mediaId, 2, null]);
    // El asesorado sigue leyendo la imagen de entonces (una asociación pasada) y la nueva.
    for (const mediaId of [medios.get(EJ_A.fixtureKey)!, medios.get(EJ_B.fixtureKey)!, nueva.mediaId]) expect((await leerImagen(app, plan.ase, mediaId)).length).toBeGreaterThan(0);
    // Una sucesora con otros objetivos, activada: la sesión registrada sigue con los suyos (versión, prescripción e índice).
    const pro = conSesion(app, plan.pro.token);
    const s = await pro.post(`/api/v1/advisees/${plan.ase.id}/training/plans`).send({ objectiveVersionId: plan.objectiveVersionId, basedOnPlanId: plan.planId }).expect(201);
    const sucesora = await planConObjetivos(plan, s.body.data.planId as string);
    const bloques = estructuraConObjetivosComoEntrada(sucesora);
    const rx = bloques[0]!.sessions!.find((x) => x.sessionId === SESION_ID)!.prescriptions.find((p) => p.prescriptionId === prescripcionIdDe(EJ_A))!;
    rx.sets = rx.sets.map((x) => ({ ...x, rir: 0, restSeconds: 0 }));
    const editada = (await pro.patch(`/api/v1/training/plans/${sucesora.planId}`).send({ expectedVersion: sucesora.version, changes: { blocks: bloques } }).expect(200)).body.data;
    await conSesion(app, plan.pro.token).post(`/api/v1/training/plans/${editada.planId as string}/activate`, claveDeIdempotencia()).send({ expectedVersion: editada.version }).expect(200);
    expect(prescripcionDe(sesionDe(await planConObjetivos(plan, editada.planId as string)), EJ_A).sets.map((x) => [x.target.rir, x.target.restSeconds])).toEqual(EJ_A.sets.map(() => [0, 0]));
    expect((await sesionParaRegistrar(plan, ocurrencia)).session).toEqual(antes.session);
  });

  it('P05 y H02 · la base sostiene la asociación aunque el código se equivoque: solo un medio propio y disponible de imagen de ejercicio, sobre un ejercicio propio, en orden, con licencia; y de solo agregar', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('eje-base'));
    const a = (await ejerciciosDeLaDemo(app, c.pro)).get(EJ_A.catalogFixtureKey)!;
    const imagen = await subirImagenDeEjercicio(app, c.pro, imagenDe(EJ_A));
    const conNutricion = await prepararProfesional(app, etiqueta('eje-base-nutri'), ['ENTRENAMIENTO', 'NUTRICION']);
    const deReceta = await subirImagen(app, conNutricion, FOTOS[0]!, { purpose: 'RECIPE_REFERENCE', authorship: 'Generada por IA' });
    const licencia = `'{"kind":"NO_EXTERNAL_LICENSE","usage":"Uso sintético de prueba"}'`;
    const fila = (campos: { ejercicio?: string; version?: string; numero?: number; medio?: string | null; autor?: string; licencia?: string; cambio?: string }) =>
      `INSERT INTO "asociacion_de_imagen_de_ejercicio" ("ejercicio_id","version_de_ejercicio_id","numero","cambio","medio_id","texto_alternativo","licencia","revision_tecnica","autor_id","procedencia")
       VALUES ('${campos.ejercicio ?? a.exerciseId}','${campos.version ?? a.versionId}',${campos.numero ?? 1},'${campos.cambio ?? 'ASOCIAR'}',${campos.medio === null ? 'NULL' : `'${campos.medio ?? imagen.mediaId}'`},
               'Texto alternativo',${campos.licencia ?? licencia},'PENDIENTE_DE_REVISION_PROFESIONAL','${campos.autor ?? c.pro.id}',${PROCEDENCIA_SQL})`;
    const rechazada = (sql: string, motivo: RegExp) => expect(prisma.$executeRawUnsafe(sql)).rejects.toThrow(motivo);
    const DEL_MEDIO = /REFERENCIA_DE_EJERCICIO \(DL-123\)/;
    const DEL_EJERCICIO = /REG-06-135/;
    const COHERENTE = /asociacion_de_imagen_de_ejercicio_coherente/;
    await rechazada(fila({ medio: deReceta.mediaId }), DEL_MEDIO); // otra finalidad, y de otro profesional
    await rechazada(fila({ autor: conNutricion.id }), DEL_EJERCICIO); // un ejercicio ajeno para ese autor
    await rechazada(fila({ ejercicio: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02', version: CATALOGO_DE_EJERCICIOS.pressDeBanca }), DEL_EJERCICIO); // sembrado
    await rechazada(fila({ version: CATALOGO_DE_EJERCICIOS.sentadilla }), DEL_EJERCICIO); // la versión de otro ejercicio
    await rechazada(fila({ numero: 2 }), /sigue al anterior/); // fuera de orden
    await rechazada(fila({ licencia: 'NULL' }), COHERENTE); // sin licencia
    await rechazada(fila({ licencia: `'{"kind":"CC0"}'` }), COHERENTE); // una licencia que no es ninguna de las dos formas
    await rechazada(fila({ medio: null }), DEL_MEDIO); // asociar sin medio
    // Un medio de imagen de ejercicio sin autoría no existe.
    await rechazada(
      `INSERT INTO "medio" ("propietario_id","finalidad","procedencia_de_imagen","autoria","tipo_declarado","bytes_declarados","procedencia") VALUES ('${c.pro.id}','REFERENCIA_DE_EJERCICIO','GENERADA_POR_IA',NULL,'image/png',100,${PROCEDENCIA_SQL})`,
      /medio_de_ejercicio_con_autoria/,
    );
    // La que vale entra; después no se modifica ni se borra, ni se trunca la tabla.
    await prisma.$executeRawUnsafe(fila({}));
    await expect(prisma.$executeRawUnsafe(`UPDATE "asociacion_de_imagen_de_ejercicio" SET "numero" = 9 WHERE "ejercicio_id" = '${a.exerciseId}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM "asociacion_de_imagen_de_ejercicio" WHERE "ejercicio_id" = '${a.exerciseId}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe('TRUNCATE "asociacion_de_imagen_de_ejercicio"')).rejects.toThrow(/append-only/);
  });
});

// ─── DL-124 · tiempos de la sesión ────────────────────────────────────────────────────────────────

const CALIDAD_DEL_PAQUETE: Readonly<Record<string, string>> = { medido: 'MEASURED', estimado: 'ESTIMATED', incompleto: 'INCOMPLETE', sin_dato: 'NO_DATA' };

/**
 * «Piernas A» activada, con una segunda sesión («Piernas B», C sola), para tener dos borradores el mismo día. Esta vez el
 * plan se crea entero con API-TRN-07 (`initialStructure`): la misma normalización que API-TRN-10.
 */
async function planActivadoParaTiempos(nombre: string): Promise<PlanDeLaDemo> {
  const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta(nombre));
  // El titular ya usó la APK que muestra los objetivos por serie: sin eso, «Piernas A» no se activa (DL-122).
  await usarLaApk(app, c.ase);
  const ejercicios = await ejerciciosDeLaDemo(app, c.pro);
  const segunda = { sessionId: 'piernas-b', label: 'Piernas B', prescriptions: [{ ...prescripcionDeLaDemo(EJ_C, ejercicios.get(EJ_C.catalogFixtureKey)!.versionId), prescriptionId: 'rx-c-b' }] };
  const creado = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructuraDeLaDemo(ejercicios, [segunda]) }).expect(201);
  const plan: PlanDeLaDemo = { ...c, ejercicios, planId: creado.body.data.planId as string, creado: creado.body, guardado: creado.body, version: creado.body.data.version as string };
  await activar(app, plan).expect(200);
  return plan;
}

const tiemposDelBorrador = async (plan: PlanDeLaDemo, draftId: string): Promise<TiemposDeSesion> =>
  TiemposDeSesionResponseSchema.parse((await conSesion(app, plan.ase.token).get(`/api/v1/training/execution-drafts/${draftId}/timing`).expect(200)).body).data;
const enCurso = async (plan: PlanDeLaDemo) => SesionEnCursoResponseSchema.parse((await conSesion(app, plan.ase.token).get('/api/v1/me/training/session-in-progress').expect(200)).body).data.inProgress;
const registrar = async (plan: PlanDeLaDemo, draftId: string, eventos: readonly EventoDeTiempo[]) =>
  ResultadoDeEventosResponseSchema.parse((await mandarEventos(app, plan.ase, draftId, eventos).expect(200)).body).data;

describe('DL-124 · tiempos de la sesión (T01 a T05, T08, M04)', () => {
  it('T01, T02 y T03 · TIE-01 registra el ejemplo principal: sesión 900/120/780, ejercicios 440/330 y 10 sin asignar, descansos 90/90 y 135/120, la serie de 40 s; TIE-02 da lo mismo', async () => {
    const plan = await planActivadoParaTiempos('tie-ejemplo');
    const { draftId } = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase));
    const base = Date.now() - 2 * 60 * 60 * 1000;
    const eventos = corrida(pasosDelEjemplo(prescripcionIdDe(EJ_A), prescripcionIdDe(EJ_B)), base, 'corrida-ejemplo');
    // En dos tandas, como las mandaría el teléfono.
    const primera = await registrar(plan, draftId, eventos.slice(0, 6));
    expect(primera.results.map((r) => r.status)).toEqual(Array(6).fill('RECORDED'));
    expect(primera.timing).toMatchObject({ state: 'IN_PROGRESS', runId: 'corrida-ejemplo', lastSequence: 6, activePrescriptionId: prescripcionIdDe(EJ_A), openMeasurement: null });
    expect(primera.timing.session.elapsed).toEqual({ ms: null, quality: 'INCOMPLETE' });
    const r = await registrar(plan, draftId, eventos.slice(6));
    expect(r.results).toEqual(eventos.slice(6).map((e) => ({ eventId: e.eventId, status: 'RECORDED', reason: null })));
    const t = r.timing;
    expect(t).toMatchObject({ draftId, executionId: null, state: 'FINISHED', lastSequence: eventos.length, startedAt: eventos[0]!.at.civil, finishedAt: eventos[eventos.length - 1]!.at.civil });

    const sesion = caso('T08').expected as { elapsedSeconds: number; pauseSeconds: number; withoutPausesSeconds: number; exerciseSeconds: Record<string, number>; unassignedSeconds: number };
    expect([t.session.elapsed, t.session.pauses, t.session.withoutPauses]).toEqual([
      { ms: sesion.elapsedSeconds * 1000, quality: 'MEASURED' },
      { ms: sesion.pauseSeconds * 1000, quality: 'MEASURED' },
      { ms: sesion.withoutPausesSeconds * 1000, quality: 'MEASURED' },
    ]);
    expect(t.exercises).toEqual([
      { prescriptionId: prescripcionIdDe(EJ_A), duration: { ms: sesion.exerciseSeconds[EJ_A.fixtureKey]! * 1000, quality: 'MEASURED' } },
      { prescriptionId: prescripcionIdDe(EJ_B), duration: { ms: sesion.exerciseSeconds[EJ_B.fixtureKey]! * 1000, quality: 'MEASURED' } },
    ]);
    expect(t.unassigned).toEqual({ ms: sesion.unassignedSeconds * 1000, quality: 'MEASURED' });
    // Los descansos traen su recomendado histórico: el de la instantánea para A1 y A2, que es el de los casos T04 y T05.
    const descansos = [caso('T04'), caso('T05')];
    expect(descansos.map((d) => d.target)).toEqual(EJ_A.sets.slice(0, 2).map((s) => s.recommendedRestSeconds));
    expect(t.rests.map((d) => [d.setIndex, d.duration, d.recommendedSeconds, d.differenceMs])).toEqual(
      descansos.map((d, i) => {
        const esperado = d.expected as { seconds: number; differenceSeconds: number };
        return [i + 1, { ms: esperado.seconds * 1000, quality: 'MEASURED' }, d.target, esperado.differenceSeconds * 1000];
      }),
    );
    // La serie medida (T01) dura lo que dice el caso; A3, que no se midió, no aparece como medida.
    const serie = caso('T01');
    expect(t.timedSets.map((s) => [s.prescriptionId, s.setIndex, s.duration])).toEqual([[prescripcionIdDe(EJ_A), 1, { ms: (serie.expected.seconds as number) * 1000, quality: CALIDAD_DEL_PAQUETE[serie.expected.quality as string] }]]);
    // Los eventos guardados son los mandados, con su recepción.
    expect(t.events.map((e) => e.event)).toEqual(eventos);
    // Persistencia: una consulta nueva da exactamente lo mismo.
    expect(await tiemposDelBorrador(plan, draftId)).toEqual(t);
    const filas = await prisma.eventoDeTiempoDeEntrenamiento.findMany({ where: { borradorId: draftId }, orderBy: { secuencia: 'asc' } });
    expect(filas.map((f) => [f.secuencia, f.tipo, f.origenDelInstante, f.descansoRecomendadoSegundos])).toEqual(
      eventos.map((e) => [e.sequence, expect.any(String), 'MONOTONICO', e.type === 'REST_STARTED' ? EJ_A.sets[e.setIndex - 1]!.recommendedRestSeconds : null]),
    );
  });

  it('T05 y M04 · un reintento es DUPLICATE y no suma; el mismo identificador con otro contenido es CONFLICT; una secuencia ocupada, CONFLICT; un hueco, SEQUENCE_GAP; nada se pisa', async () => {
    const plan = await planActivadoParaTiempos('tie-idempotencia');
    const { draftId } = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase));
    const eventos = corrida(pasosDelEjemplo(prescripcionIdDe(EJ_A), prescripcionIdDe(EJ_B)), Date.now() - 60 * 60 * 1000, 'corrida-reintentos');
    await registrar(plan, draftId, eventos.slice(0, 6));
    const antes = await tiemposDelBorrador(plan, draftId);
    // El mismo pedido otra vez: todo DUPLICATE, nada cambia.
    const reintento = await registrar(plan, draftId, eventos.slice(0, 6));
    expect(reintento.results.map((r) => [r.status, r.reason])).toEqual(Array(6).fill(['DUPLICATE', null]));
    expect(reintento.timing).toEqual(antes);
    // Uno que se superpone: los ya registrados no suman, el nuevo sí (el descanso tras A2 queda abierto).
    const superpuesto = await registrar(plan, draftId, eventos.slice(4, 7));
    expect(superpuesto.results.map((r) => r.status)).toEqual(['DUPLICATE', 'DUPLICATE', 'RECORDED']);
    expect(superpuesto.timing.rests.map((d) => d.duration)).toEqual([
      { ms: (caso('T04').expected.seconds as number) * 1000, quality: 'MEASURED' },
      { ms: null, quality: 'INCOMPLETE' },
    ]);
    expect(superpuesto.timing.openMeasurement).toMatchObject({ kind: 'REST', setIndex: 2 });
    // El fin del primer descanso con otro instante: CONFLICT, y lo que sigue en el pedido no se procesa.
    const otroFin = { ...eventos[5]!, at: { ...eventos[5]!.at, civil: new Date(Date.parse(eventos[5]!.at.civil) + 5000).toISOString() } } as EventoDeTiempo;
    const conflicto = await registrar(plan, draftId, [otroFin, eventos[8]!]);
    expect(conflicto.results.map((r) => [r.status, r.reason])).toEqual([
      ['CONFLICT', 'EVENT_ID_REUSED'],
      ['REJECTED', 'PREVIOUS_EVENT_NOT_RECORDED'],
    ]);
    // Otro evento en una secuencia ocupada, o uno que salta la secuencia.
    const ocupada = { ...eventos[8]!, eventId: 'evento-en-otra-secuencia', sequence: 3 } as EventoDeTiempo;
    expect((await registrar(plan, draftId, [ocupada])).results).toEqual([{ eventId: 'evento-en-otra-secuencia', status: 'CONFLICT', reason: 'SEQUENCE_REUSED' }]);
    const salto = { ...eventos[8]!, sequence: eventos[8]!.sequence + 1 } as EventoDeTiempo;
    expect((await registrar(plan, draftId, [salto])).results).toEqual([{ eventId: salto.eventId, status: 'REJECTED', reason: 'SEQUENCE_GAP' }]);
    // Nada se pisó: el descanso guardado sigue con su instante original, y lo rechazado no quedó en la base.
    const despues = await tiemposDelBorrador(plan, draftId);
    expect(despues).toEqual(superpuesto.timing);
    expect(await prisma.eventoDeTiempoDeEntrenamiento.count({ where: { borradorId: draftId } })).toBe(7);
    // Un cuerpo mal formado es 400 y no llega a decidir nada; un instante monotónico sin ancla, también.
    await mandarEventos(app, plan.ase, draftId, [{ ...eventos[8]!, extra: 1 } as unknown as EventoDeTiempo]).expect(400);
    await mandarEventos(app, plan.ase, draftId, [{ ...eventos[8]!, at: { ...eventos[8]!.at, monotonic: null } } as EventoDeTiempo]).expect(400);
    await mandarEventos(app, plan.ase, draftId, []).expect(400);
  });

  it('T08 · una sola sesión en curso: otra sesión es ANOTHER_SESSION_IN_PROGRESS y un segundo dispositivo SESSION_ALREADY_STARTED; TIE-04 la ofrece para retomar, en pausa también, hasta que termina', async () => {
    const plan = await planActivadoParaTiempos('tie-en-curso');
    expect(await enCurso(plan)).toBeNull();
    const d1 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase))).draftId;
    const d2 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase, 'piernas-b'))).draftId;
    const base = Date.now() - 30 * 60 * 1000;
    const a = prescripcionIdDe(EJ_A);
    const uno = corrida([{ s: 0, evento: { type: 'SESSION_STARTED' } }, { s: 10, evento: { type: 'EXERCISE_ACTIVATED', prescriptionId: a } }], base, 'corrida-telefono');
    await registrar(plan, d1, uno);
    // Otra sesión del mismo titular, en otro borrador: no se empieza mientras haya una en curso.
    const otra = await registrar(plan, d2, corrida([{ s: 20, evento: { type: 'SESSION_STARTED' } }], base, 'corrida-otra-sesion'));
    expect(otra.results.map((r) => r.reason)).toEqual(['ANOTHER_SESSION_IN_PROGRESS']);
    expect(otra.timing.state).toBe('NOT_STARTED');
    // Un segundo dispositivo en el mismo borrador: otra corrida no se suma ni se mezcla.
    const tablet = corrida([{ s: 30, evento: { type: 'SESSION_STARTED' } }], base, 'corrida-tablet', 1, 'proceso-de-la-tablet');
    expect((await registrar(plan, d1, tablet)).results.map((r) => r.reason)).toEqual(['SESSION_ALREADY_STARTED']);
    const ajena = corrida([{ s: 40, evento: { type: 'SESSION_PAUSED' } }], base, 'corrida-tablet', 3, 'proceso-de-la-tablet');
    expect((await registrar(plan, d1, ajena)).results.map((r) => r.reason)).toEqual(['RUN_MISMATCH']);
    // TIE-04: la sesión en curso, para retomarla desde cualquier dispositivo.
    expect(await enCurso(plan)).toEqual({
      draftId: d1,
      occurrenceId: await ocurrenciaDeHoy(app, plan.ase),
      date: expect.any(String),
      sessionId: SESION_ID,
      sessionLabel: SESION_DEMO.name,
      runId: 'corrida-telefono',
      state: 'IN_PROGRESS',
      startedAt: uno[0]!.at.civil,
      lastSequence: 2,
    });
    await registrar(plan, d1, corrida([{ s: 50, evento: { type: 'SESSION_PAUSED' } }], base, 'corrida-telefono', 3));
    expect(await enCurso(plan)).toMatchObject({ draftId: d1, state: 'PAUSED', lastSequence: 3 });
    // Dejarla incompleta la cierra sin afirmar cuándo terminó; entonces la otra sesión sí empieza.
    const cierre = await registrar(plan, d1, corrida([{ s: 3600, evento: { type: 'SESSION_FINISHED', resolution: 'LEFT_INCOMPLETE' } }], base, 'corrida-telefono', 4));
    expect(cierre.timing).toMatchObject({ state: 'LEFT_INCOMPLETE', finishedAt: null, session: { elapsed: { ms: null, quality: 'INCOMPLETE' } } });
    expect(await enCurso(plan)).toBeNull();
    expect((await registrar(plan, d2, corrida([{ s: 3700, evento: { type: 'SESSION_STARTED' } }], base, 'corrida-otra-sesion'))).results.map((r) => r.status)).toEqual(['RECORDED']);
    expect(await enCurso(plan)).toMatchObject({ draftId: d2, sessionId: 'piernas-b', sessionLabel: 'Piernas B' });
  });

  it('T08 y M04 · a la vez: dos inicios en dos borradores dejan una sola sesión en curso, y el mismo pedido dos veces registra una sola vez', async () => {
    const plan = await planActivadoParaTiempos('tie-simultaneos');
    const borradores = [
      (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase))).draftId,
      (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase, 'piernas-b'))).draftId,
    ];
    const base = Date.now() - 10 * 60 * 1000;
    // Un inicio en cada borrador, lanzados juntos: el cerrojo por titular deja pasar uno; el otro ve la sesión en curso.
    const inicios = await simultaneos(2, (i) => mandarEventos(app, plan.ase, borradores[i]!, corrida([{ s: i, evento: { type: 'SESSION_STARTED' } }], base, `corrida-simultanea-${i}`)));
    expect(inicios.map((r) => r.status)).toEqual([200, 200]);
    const resultados = inicios.map((r) => ResultadoDeEventosResponseSchema.parse(r.body).data.results[0]!);
    expect(resultados.map((m) => m.status).sort()).toEqual(['RECORDED', 'REJECTED']);
    expect(resultados.find((m) => m.status === 'REJECTED')!.reason).toBe('ANOTHER_SESSION_IN_PROGRESS');
    const enCursoAhora = await enCurso(plan);
    expect(enCursoAhora?.draftId).toBe(borradores[resultados.findIndex((m) => m.status === 'RECORDED')]);
    // El mismo pedido dos veces a la vez, en el borrador de la sesión en curso: uno registra y el otro es DUPLICATE.
    const draftId = enCursoAhora!.draftId;
    const siguiente = corrida([{ s: 30, evento: { type: 'EXERCISE_ACTIVATED', prescriptionId: draftId === borradores[0] ? prescripcionIdDe(EJ_A) : 'rx-c-b' } }], base, enCursoAhora!.runId, 2);
    const repetidos = await simultaneos(2, () => mandarEventos(app, plan.ase, draftId, siguiente));
    expect(repetidos.map((r) => r.status)).toEqual([200, 200]);
    expect(repetidos.map((r) => ResultadoDeEventosResponseSchema.parse(r.body).data.results[0]!.status).sort()).toEqual(['DUPLICATE', 'RECORDED']);
    expect(await prisma.eventoDeTiempoDeEntrenamiento.count({ where: { borradorId: draftId } })).toBe(2);
  });

  it('T05 · después de confirmar se aceptan los eventos pendientes mientras la corrida no se cerró; después, SESSION_FINISHED; una ejecución en curso no se ofrece para retomar', async () => {
    const plan = await planActivadoParaTiempos('tie-tardios');
    const borrador = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase));
    const eventos = corrida(pasosDelEjemplo(prescripcionIdDe(EJ_A), prescripcionIdDe(EJ_B)), Date.now() - 60 * 60 * 1000, 'corrida-tardia');
    await registrar(plan, borrador.draftId, eventos.slice(0, 5)); // el descanso A1 queda abierto
    const { executionId } = await registrarYConfirmar(app, plan, borrador);
    // Registrada, ya no es «en curso» para retomar, aunque su corrida no se haya cerrado.
    expect(await enCurso(plan)).toBeNull();
    // Llegan los que el teléfono tenía pendientes: conservan su secuencia y sus instantes.
    const tarde = await registrar(plan, borrador.draftId, eventos.slice(5));
    expect(tarde.results.every((r) => r.status === 'RECORDED')).toBe(true);
    expect(tarde.timing).toMatchObject({ executionId, state: 'FINISHED', finishedAt: eventos[eventos.length - 1]!.at.civil });
    expect(tarde.timing.session.withoutPauses.ms).toBe((caso('T08').expected.withoutPausesSeconds as number) * 1000);
    // Cerrada la corrida, nada más se registra.
    const despues = corrida([{ s: 1000, evento: { type: 'SESSION_RESUMED' } }], Date.now() - 60 * 60 * 1000, 'corrida-tardia', eventos.length + 1);
    expect((await registrar(plan, borrador.draftId, despues)).results.map((r) => [r.status, r.reason])).toEqual([['REJECTED', 'SESSION_FINISHED']]);
  });

  it('H01, T03 y P05 · TIE-03: el titular y el profesional del plan ven los tiempos de la ejecución; otro profesional y otro asesorado, 404; una ejecución sin tiempos sigue sin tiempos', async () => {
    const plan = await planActivadoParaTiempos('tie-ejecucion');
    const borrador = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase));
    const eventos = corrida(pasosDelEjemplo(prescripcionIdDe(EJ_A), prescripcionIdDe(EJ_B)), Date.now() - 60 * 60 * 1000, 'corrida-revisada');
    await registrar(plan, borrador.draftId, eventos);
    const { executionId } = await registrarYConfirmar(app, plan, borrador);
    const delBorrador = await tiemposDelBorrador(plan, borrador.draftId);
    expect(delBorrador.executionId).toBe(executionId);
    const leer = (token: string) => conSesion(app, token).get(`/api/v1/training/executions/${executionId}/timing`);
    const delTitular = TiemposDeSesionResponseSchema.parse((await leer(plan.ase.token).expect(200)).body).data;
    const delProfesional = TiemposDeSesionResponseSchema.parse((await leer(plan.pro.token).expect(200)).body).data;
    expect(delTitular).toEqual(delBorrador);
    expect(delProfesional).toEqual(delBorrador);
    const otroPro = await prepararProfesional(app, etiqueta('tie-otro-pro'), ['ENTRENAMIENTO']);
    const otroAse = await prepararAsesorado(app, etiqueta('tie-otro-ase'), { a3: true });
    const inexistente = (await conSesion(app, plan.pro.token).get(`/api/v1/training/executions/${randomUUID()}/timing`).expect(404)).body;
    for (const parte of [otroPro, otroAse]) expect((await leer(parte.token).expect(404)).body).toEqual(inexistente);
    await conSesion(app, plan.pro.token).get(`/api/v1/training/executions/${executionId}/timing?x=1`).expect(400);
    // El borrador sigue siendo del titular: el profesional no ve sus tiempos por ahí, ni escribe en él.
    await conSesion(app, plan.pro.token).get(`/api/v1/training/execution-drafts/${borrador.draftId}/timing`).expect(404);
    await mandarEventos(app, plan.pro, borrador.draftId, [eventos[0]!]).expect(404);
    await mandarEventos(app, otroAse, borrador.draftId, [eventos[0]!]).expect(404);
    await mandarEventos(app, plan.ase, randomUUID(), [eventos[0]!]).expect(404);
    // La otra sesión, registrada sin marcar tiempos: no se inventa ninguno.
    const sinTiempos = await registrarYConfirmarSoloC(plan);
    const sola =TiemposDeSesionResponseSchema.parse((await conSesion(app, plan.pro.token).get(`/api/v1/training/executions/${sinTiempos}/timing`).expect(200)).body).data;
    expect(sola).toMatchObject({ state: 'NOT_STARTED', runId: null, lastSequence: 0, startedAt: null, events: [], rests: [], timedSets: [], exercises: [] });
    expect([sola.session.elapsed, sola.unassigned]).toEqual([{ ms: null, quality: 'NO_DATA' }, { ms: null, quality: 'NO_DATA' }]);
  });

  it('T05 y T08 · la base sostiene los eventos aunque el código se equivoque: del titular del borrador, sin huecos, una corrida, nada después del fin, una sesión en curso por titular, y de solo agregar', async () => {
    const plan = await planActivadoParaTiempos('tie-base');
    const d1 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase))).draftId;
    const d2 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase, 'piernas-b'))).draftId;
    const fila = (c: { borrador?: string; asesorado?: string; secuencia: number; tipo: string; corrida?: string }) => {
      const corridaId = c.corrida ?? 'corrida-de-la-base';
      const eventoId = `${corridaId}-${c.secuencia}`;
      return `INSERT INTO "evento_de_tiempo_de_entrenamiento" ("borrador_id","asesorado_id","corrida_id","secuencia","evento_id","tipo","contenido","instante_civil","origen_del_instante","procedencia")
              VALUES ('${c.borrador ?? d1}','${c.asesorado ?? plan.ase.id}','${corridaId}',${c.secuencia},'${eventoId}','${c.tipo}',
                      '${JSON.stringify({ eventId: eventoId, runId: corridaId, sequence: c.secuencia })}', now(),'RELOJ_CIVIL_RECUPERADO',${PROCEDENCIA_SQL})`;
    };
    const rechazada = (sql: string, motivo: RegExp) => expect(prisma.$executeRawUnsafe(sql)).rejects.toThrow(motivo);
    await rechazada(fila({ secuencia: 1, tipo: 'SESION_INICIADA', asesorado: plan.pro.id }), /titular de su borrador/); // no es el titular
    await rechazada(fila({ secuencia: 2, tipo: 'SESION_PAUSADA' }), /no tiene huecos/); // un hueco
    await rechazada(fila({ secuencia: 1, tipo: 'SESION_PAUSADA' }), /evento_de_tiempo_coherente/); // la corrida empieza con su inicio
    await prisma.$executeRawUnsafe(fila({ secuencia: 1, tipo: 'SESION_INICIADA' }));
    await rechazada(fila({ secuencia: 2, tipo: 'SESION_PAUSADA', corrida: 'otra-corrida-en-la-base' }), /una sola corrida/); // otra corrida
    await rechazada(fila({ secuencia: 2, tipo: 'SESION_INICIADA' }), /evento_de_tiempo_coherente/); // un segundo inicio
    await rechazada(fila({ borrador: d2, secuencia: 1, tipo: 'SESION_INICIADA', corrida: 'corrida-del-otro-borrador' }), /otra sesión en curso/);
    await prisma.$executeRawUnsafe(fila({ secuencia: 2, tipo: 'SESION_FINALIZADA' }));
    await rechazada(fila({ secuencia: 3, tipo: 'SESION_REANUDADA' }), /después de su fin/); // después del fin
    await prisma.$executeRawUnsafe(fila({ borrador: d2, secuencia: 1, tipo: 'SESION_INICIADA', corrida: 'corrida-del-otro-borrador' })); // ahora sí
    await expect(prisma.$executeRawUnsafe(`UPDATE "evento_de_tiempo_de_entrenamiento" SET "secuencia" = 9 WHERE "borrador_id" = '${d1}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM "evento_de_tiempo_de_entrenamiento" WHERE "borrador_id" = '${d1}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe('TRUNCATE "evento_de_tiempo_de_entrenamiento"')).rejects.toThrow(/append-only/);
  });

  it('T03 · la base sostiene la base del reloj aunque el código se equivoque: un instante con ancla y sin base, una base sin ancla o una base distinta de la del contenido se rechazan', async () => {
    const plan = await planActivadoParaTiempos('tie-base-del-reloj');
    const d1 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase))).draftId;
    /** El inicio de la corrida, con el instante que se pida: el ancla y la base en sus columnas, y `reloj` en el contenido. */
    const fila = (c: { ancla: string | null; base: string | null; reloj: string | null }) => {
      const monotonic = c.ancla ? { anchor: c.ancla, ms: 5_000, ...(c.reloj ? { clock: c.reloj } : {}) } : null;
      const contenido = { eventId: 'base-1', runId: 'corrida-base-del-reloj', sequence: 1, type: 'SESSION_STARTED', at: { civil: new Date().toISOString(), monotonic } };
      return `INSERT INTO "evento_de_tiempo_de_entrenamiento" ("borrador_id","asesorado_id","corrida_id","secuencia","evento_id","tipo","contenido","instante_civil","ancla_monotonica","ms_monotonicos","base_del_reloj","origen_del_instante","procedencia")
              VALUES ('${d1}','${plan.ase.id}','corrida-base-del-reloj',1,'base-1','SESION_INICIADA','${JSON.stringify(contenido)}', now(),
                      ${c.ancla ? `'${c.ancla}'` : 'NULL'},${c.ancla ? '5000' : 'NULL'},${c.base ? `'${c.base}'` : 'NULL'},'${c.ancla ? 'MONOTONICO' : 'RELOJ_CIVIL_RECUPERADO'}',${PROCEDENCIA_SQL})`;
    };
    const rechazada = (sql: string, motivo: RegExp) => expect(prisma.$executeRawUnsafe(sql)).rejects.toThrow(motivo);
    const BASE_DEL_RELOJ = /evento_de_tiempo_base_del_reloj/;
    await rechazada(fila({ ancla: 'arranque-1', base: null, reloj: 'ELAPSED_SINCE_BOOT' }), BASE_DEL_RELOJ); // con ancla y sin base
    await rechazada(fila({ ancla: null, base: 'DESDE_EL_ARRANQUE', reloj: null }), BASE_DEL_RELOJ); // una base sin ancla
    await rechazada(fila({ ancla: 'arranque-1', base: 'DEL_PROCESO', reloj: 'ELAPSED_SINCE_BOOT' }), BASE_DEL_RELOJ); // la columna dice otra base que el contenido
    await rechazada(fila({ ancla: 'arranque-1', base: 'DESDE_EL_ARRANQUE', reloj: null }), BASE_DEL_RELOJ); // el contenido no dice su base
    await rechazada(fila({ ancla: 'arranque-1', base: 'OTRO_RELOJ', reloj: 'ELAPSED_SINCE_BOOT' }), /invalid input value for enum/); // una base que no existe
    expect(await prisma.eventoDeTiempoDeEntrenamiento.count({ where: { borradorId: d1 } })).toBe(0);
    // La que vale entra. Las bases admitidas son exactamente las del dominio.
    await prisma.$executeRawUnsafe(fila({ ancla: 'arranque-1', base: 'DESDE_EL_ARRANQUE', reloj: 'ELAPSED_SINCE_BOOT' }));
    expect(await prisma.eventoDeTiempoDeEntrenamiento.count({ where: { borradorId: d1, baseDelReloj: 'DESDE_EL_ARRANQUE' } })).toBe(1);
    const valores = await prisma.$queryRaw<{ valor: string }[]>`
      SELECT e.enumlabel AS valor FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'BaseDelReloj' ORDER BY e.enumsortorder`;
    expect(valores.map((v) => v.valor)).toEqual(Object.values(BASE_DEL_RELOJ_DESDE_LA_API));
  });

  it('T03 · TIE-01 con el reloj desde el arranque: la sesión sigue medida aunque la app se reinicie entre dos pedidos (la misma ancla); si el teléfono se reinició (otra ancla), es estimada', async () => {
    const plan = await planActivadoParaTiempos('tie-arranque');
    const d1 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase))).draftId;
    const d2 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase, 'piernas-b'))).draftId;
    const base = Date.now() - 60 * 60 * 1000;
    const a = prescripcionIdDe(EJ_A);
    // Antes de que la app se reinicie: el inicio y el ejercicio. Después, el proceso es otro, pero el arranque del teléfono
    // es el mismo: la misma ancla, y el reloj siguió contando.
    await registrar(plan, d1, corrida([{ s: 0, evento: { type: 'SESSION_STARTED' } }, { s: 10, evento: { type: 'EXERCISE_ACTIVATED', prescriptionId: a } }], base, 'corrida-arranque', 1, 'arranque-1', 'ELAPSED_SINCE_BOOT'));
    const medida = (await registrar(plan, d1, corrida([{ s: 600, evento: { type: 'SESSION_FINISHED', resolution: 'FINISHED' } }], base, 'corrida-arranque', 3, 'arranque-1', 'ELAPSED_SINCE_BOOT'))).timing;
    expect([medida.session.elapsed, medida.unassigned]).toEqual([
      { ms: 600_000, quality: 'MEASURED' },
      { ms: 10_000, quality: 'MEASURED' },
    ]);
    expect(medida.exercises).toEqual([{ prescriptionId: a, duration: { ms: 590_000, quality: 'MEASURED' } }]);
    // El teléfono se reinició entre los dos pedidos: otro arranque, otra ancla. No se restan, y la sesión sale del reloj civil.
    await registrar(plan, d2, corrida([{ s: 700, evento: { type: 'SESSION_STARTED' } }], base, 'corrida-reinicio', 1, 'arranque-1', 'ELAPSED_SINCE_BOOT'));
    const estimada = (await registrar(plan, d2, corrida([{ s: 1300, evento: { type: 'SESSION_FINISHED', resolution: 'FINISHED' } }], base, 'corrida-reinicio', 2, 'arranque-2', 'ELAPSED_SINCE_BOOT'))).timing;
    expect(estimada.session.elapsed).toEqual({ ms: 600_000, quality: 'ESTIMATED' });
    // Lo leído después es lo mismo, y cada evento guardó su ancla y su base.
    expect((await tiemposDelBorrador(plan, d1)).session.elapsed).toEqual(medida.session.elapsed);
    expect((await tiemposDelBorrador(plan, d2)).session.elapsed).toEqual(estimada.session.elapsed);
    const filas = await prisma.eventoDeTiempoDeEntrenamiento.findMany({ where: { borradorId: { in: [d1, d2] } }, orderBy: [{ momentoDeRecepcion: 'asc' }, { secuencia: 'asc' }] });
    expect(filas.map((f) => [f.borradorId === d1 ? 'd1' : 'd2', f.secuencia, f.anclaMonotonica, f.baseDelReloj])).toEqual([
      ['d1', 1, 'arranque-1', 'DESDE_EL_ARRANQUE'],
      ['d1', 2, 'arranque-1', 'DESDE_EL_ARRANQUE'],
      ['d1', 3, 'arranque-1', 'DESDE_EL_ARRANQUE'],
      ['d2', 1, 'arranque-1', 'DESDE_EL_ARRANQUE'],
      ['d2', 2, 'arranque-2', 'DESDE_EL_ARRANQUE'],
    ]);
  });
});

describe('DL-124 · la corrida huérfana siempre tiene salida (T08, R03)', () => {
  /** Lo único que se acepta sin el acceso al profesional: dejar incompleta la medición abierta y la sesión. */
  const cierreSinAfirmar = (base: number, runId: string, primera: number, medicion: string | null) =>
    corrida(
      [
        ...(medicion ? [{ s: 900, evento: { type: 'MEASUREMENT_LEFT_INCOMPLETE' as const, measurementId: medicion } }] : []),
        { s: 905, evento: { type: 'SESSION_FINISHED' as const, resolution: 'LEFT_INCOMPLETE' as const } },
      ],
      base,
      runId,
      primera,
    );

  it('T08 y R03 · con el vínculo pausado, TIE-04 sigue mostrando la corrida y TIE-01 acepta dejarla incompleta; lo que no cierra sigue denegado; otra cuenta no la ve ni la toca; después, otra sesión empieza', async () => {
    const plan = await planActivadoParaTiempos('tie-pausado');
    const d1 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase))).draftId;
    const d2 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase, 'piernas-b'))).draftId;
    const base = Date.now() - 20 * 60 * 1000;
    const a = prescripcionIdDe(EJ_A);
    await registrar(
      plan,
      d1,
      corrida(
        [
          { s: 0, evento: { type: 'SESSION_STARTED' } },
          { s: 10, evento: { type: 'EXERCISE_ACTIVATED', prescriptionId: a } },
          { s: 60, evento: { type: 'REST_STARTED', restId: 'descanso-que-quedo-abierto', prescriptionId: a, setIndex: 1 } },
        ],
        base,
        'corrida-pausada',
      ),
    );
    // El asesorado pausa el vínculo: el acceso a su profesional queda suspendido.
    await pausar(app, plan.ase.token, plan.vinculoId, await versionDeVinculo(app, plan.ase.token, plan.vinculoId)).expect(200);
    await conSesion(app, plan.ase.token).get(`/api/v1/training/execution-drafts/${d1}/timing`).expect(404);
    // TIE-04 la sigue mostrando: es su historia, con su A3.
    expect(await enCurso(plan)).toMatchObject({ draftId: d1, runId: 'corrida-pausada', state: 'IN_PROGRESS', lastSequence: 3, sessionLabel: SESION_DEMO.name });
    // Lo que no cierra sigue bajo el PDP, con el mismo 404 que lo inexistente: terminar el descanso, o un pedido que
    // mezcla el cierre con otra cosa.
    const inexistente = (await mandarEventos(app, plan.ase, randomUUID(), cierreSinAfirmar(base, 'corrida-pausada', 4, null)).expect(404)).body;
    expect((await mandarEventos(app, plan.ase, d1, corrida([{ s: 120, evento: { type: 'REST_FINISHED', restId: 'descanso-que-quedo-abierto' } }], base, 'corrida-pausada', 4)).expect(404)).body).toEqual(inexistente);
    const mezcla = corrida(
      [
        { s: 120, evento: { type: 'MEASUREMENT_LEFT_INCOMPLETE', measurementId: 'descanso-que-quedo-abierto' } },
        { s: 130, evento: { type: 'SESSION_FINISHED', resolution: 'FINISHED' } },
      ],
      base,
      'corrida-pausada',
      4,
    );
    await mandarEventos(app, plan.ase, d1, mezcla).expect(404);
    // Otra cuenta no la ve ni la cierra (R03).
    const otraCuenta = await prepararAsesorado(app, etiqueta('tie-pausado-otra'), { a3: true });
    expect(SesionEnCursoResponseSchema.parse((await conSesion(app, otraCuenta.token).get('/api/v1/me/training/session-in-progress').expect(200)).body).data.inProgress).toBeNull();
    const cierre = cierreSinAfirmar(base, 'corrida-pausada', 4, 'descanso-que-quedo-abierto');
    await mandarEventos(app, otraCuenta, d1, cierre).expect(404);
    expect(await prisma.eventoDeTiempoDeEntrenamiento.count({ where: { borradorId: d1 } })).toBe(3);
    // El titular la deja incompleta sin el acceso a su profesional: el descanso y la sesión quedan incompletos.
    const cerrada = await registrar(plan, d1, cierre);
    expect(cerrada.results.map((r) => [r.status, r.reason])).toEqual([
      ['RECORDED', null],
      ['RECORDED', null],
    ]);
    expect(cerrada.timing).toMatchObject({ state: 'LEFT_INCOMPLETE', finishedAt: null, openMeasurement: null, session: { elapsed: { ms: null, quality: 'INCOMPLETE' } } });
    expect(cerrada.timing.rests.map((d) => [d.restId, d.duration])).toEqual([['descanso-que-quedo-abierto', { ms: null, quality: 'INCOMPLETE' }]]);
    // Un reintento del mismo cierre no suma, y cerrada la corrida nada más se registra.
    expect((await registrar(plan, d1, cierre)).results.map((r) => r.status)).toEqual(['DUPLICATE', 'DUPLICATE']);
    expect(await enCurso(plan)).toBeNull();
    // Reanudado el vínculo, otra sesión empieza: la corrida cerrada ya no ocupa la sesión en curso.
    await reanudar(app, plan.ase.token, plan.vinculoId, await versionDeVinculo(app, plan.ase.token, plan.vinculoId)).expect(200);
    expect((await registrar(plan, d2, corrida([{ s: 1000, evento: { type: 'SESSION_STARTED' } }], base, 'corrida-despues-de-la-pausa'))).results.map((r) => r.status)).toEqual(['RECORDED']);
    expect(await enCurso(plan)).toMatchObject({ draftId: d2, sessionId: 'piernas-b' });
  });

  it('T08 · terminado el vínculo, la corrida huérfana ocupa la sesión en curso hasta que el titular la deja incompleta; entonces empieza su sesión con otro profesional', async () => {
    const plan = await planActivadoParaTiempos('tie-huerfana');
    const d1 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase))).draftId;
    const base = Date.now() - 20 * 60 * 1000;
    await registrar(plan, d1, corrida([{ s: 0, evento: { type: 'SESSION_STARTED' } }, { s: 30, evento: { type: 'SESSION_PAUSED' } }], base, 'corrida-huerfana'));
    // El asesorado termina el vínculo: su seguimiento con ese profesional se cierra y el acceso no vuelve.
    await finalizar(app, plan.ase.token, plan.vinculoId, await versionDeVinculo(app, plan.ase.token, plan.vinculoId)).expect(200);
    expect(await enCurso(plan)).toMatchObject({ draftId: d1, state: 'PAUSED' });
    // Con otro profesional: vínculo, evaluación, objetivo y un plan activado (el seguimiento anterior ya está cerrado).
    const otro = await prepararProfesional(app, etiqueta('tie-huerfana-otro'), ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, plan.ase, 'ENTRENAMIENTO');
    const pro = conSesion(app, otro.token);
    const evaluacion = await pro.post(`/api/v1/advisees/${plan.ase.id}/training/evaluations`).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const objetivo = await pro.post(`/api/v1/advisees/${plan.ase.id}/training/objectives`).send(cuerpoDeObjetivoDeEntrenamiento(evaluacion.body.data.evaluationId as string)).expect(201);
    const nuevo = await pro.post(`/api/v1/advisees/${plan.ase.id}/training/plans`).send({ objectiveVersionId: objetivo.body.data.versionId, initialStructure: estructuraDeEntrenamiento() }).expect(201);
    await activarPlanDeEntrenamiento(app, otro, nuevo.body.data.planId as string, nuevo.body.data.version as string).expect(200);
    const d3 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase, 'ses-a'))).draftId;
    const inicio = corrida([{ s: 600, evento: { type: 'SESSION_STARTED' } }], base, 'corrida-con-el-otro');
    // Mientras la huérfana siga abierta, ocupa la sesión en curso (el servicio y la base)…
    expect((await registrar(plan, d3, inicio)).results.map((r) => r.reason)).toEqual(['ANOTHER_SESSION_IN_PROGRESS']);
    // …y sin aquel acceso lo único que se puede hacer con ella es dejarla incompleta.
    await mandarEventos(app, plan.ase, d1, corrida([{ s: 700, evento: { type: 'SESSION_RESUMED' } }], base, 'corrida-huerfana', 3)).expect(404);
    const cerrada = await registrar(plan, d1, cierreSinAfirmar(base, 'corrida-huerfana', 3, null));
    expect(cerrada.timing).toMatchObject({ state: 'LEFT_INCOMPLETE', finishedAt: null });
    expect((await registrar(plan, d3, inicio)).results.map((r) => r.status)).toEqual(['RECORDED']);
    expect(await enCurso(plan)).toMatchObject({ draftId: d3, sessionId: 'ses-a' });
  });

  it('R03 · sin A3 no hay sesión en curso que ofrecer ni corrida que cerrar sin el PDP; vuelto a otorgar, la salida vuelve', async () => {
    const plan = await planActivadoParaTiempos('tie-sin-a3');
    const d1 = (await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase))).draftId;
    const base = Date.now() - 20 * 60 * 1000;
    await registrar(plan, d1, corrida([{ s: 0, evento: { type: 'SESSION_STARTED' } }], base, 'corrida-sin-a3'));
    const a3 = await a3Vigente(app, plan.ase.token);
    await conSesion(app, plan.ase.token).post(`/api/v1/me/health-data-consents/${a3}/revoke`).send({}).expect(200);
    // Sin A3: ni la sesión en curso (null, no un error), ni el cierre sin el PDP, que vuelve al PDP y este lo deniega.
    expect(await enCurso(plan)).toBeNull();
    const cierre = cierreSinAfirmar(base, 'corrida-sin-a3', 2, null);
    await mandarEventos(app, plan.ase, d1, cierre).expect(404);
    await otorgarA3(app, plan.ase.token).expect(201);
    expect(await enCurso(plan)).toMatchObject({ draftId: d1, runId: 'corrida-sin-a3' });
    expect((await registrar(plan, d1, cierre)).results.map((r) => r.status)).toEqual(['RECORDED']);
    expect(await enCurso(plan)).toBeNull();
  });
});

/** Registra la segunda sesión (C sola) sin marcar ningún tiempo y devuelve su ejecución. */
async function registrarYConfirmarSoloC(plan: PlanDeLaDemo): Promise<string> {
  const apk = conSesion(app, plan.ase.token);
  const b = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase, 'piernas-b'));
  const c = plan.ejercicios.get(EJ_C.catalogFixtureKey)!;
  const g = await apk
    .patch(`/api/v1/training/execution-drafts/${b.draftId}`)
    .send({ expectedVersion: b.version, changes: { granularity: 'SET', sessionCondition: 'COMPLETED', exercises: [{ prescriptionId: 'rx-c-b', performedExerciseVersionId: c.versionId, sets: [{ setIndex: 1, load: null, completedRepetitions: 10, rir: null, perceivedExertion: null }] }] } })
    .expect(200);
  const x = await apk.post(`/api/v1/training/execution-drafts/${b.draftId}/confirm`, claveDeIdempotencia()).send({ expectedVersion: g.body.data.version }).expect(201);
  return x.body.data.executionId as string;
}
