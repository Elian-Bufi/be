/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3) · las Plantillas de BE por la API real contra PostgreSQL: TEST-ET3-API-01 a 05.
 *
 * - **La semilla** (API-TPB-01): las cuatro, con cada ejercicio en el catálogo base de este entorno y marcadas como
 *   propuesta; solo para un profesional de Entrenamiento.
 * - **Aplicarla a una persona** (API-TPB-02): el borrador con su planificación y las cargas en % RM resueltas con el 1RM de
 *   esa persona (con su base y sus aproximaciones); sin 1RM, la carga queda para completar y se dice.
 * - **La autorización:** lo ajeno, el 404 de lo inexistente; otra versión, 409; una clave que no existe, 404.
 * - **Administración** (API-TPB-03 y 04): la historia, retirar y volver a ofrecer, y la base que no deja reescribir nada.
 * Las cuentas las prueba el dominio (`packages/domain/src/plantillas-de-be.test.ts`).
 */
import type { INestApplication } from '@nestjs/common';
import {
  BusquedaDeEjerciciosResponseSchema,
  CAPACIDAD_TIPOS_DE_SERIE,
  HEADER_DE_CAPACIDADES,
  ListaDePlantillasDeBeParaAdministrarResponseSchema,
  ListaDePlantillasDeBeResponseSchema,
  PlanConObjetivosResponseSchema,
  PlanDesdePlantillaDeBeResponseSchema,
  PLANTILLAS_DE_BE,
  valorDeCapacidades,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { fechaLocalEn, ZONA_POR_DEFECTO } from '../../apps/api/src/nutricion/zona';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { adm, administradorListo } from './soporte-administracion';
import { circuitoListoParaPlanificarEntrenamiento } from './soporte-entrenamiento';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `et3-${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const hoy = (): string => fechaLocalEn(new Date(), ZONA_POR_DEFECTO);
const CUERPO_COMPLETO = PLANTILLAS_DE_BE.find((p) => p.clave === 'BE-CUERPO-COMPLETO')!;

async function lista(token: string) {
  return ListaDePlantillasDeBeResponseSchema.parse((await conSesion(app, token).get('/api/v1/training/be-templates').expect(200)).body).data;
}

describe('DL-199 · las Plantillas de BE', () => {
  it('TEST-ET3-API-01: la semilla, con cada ejercicio en el catálogo base y marcada como propuesta; solo para Entrenamiento', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('lista'));
    const data = await lista(c.pro.token);
    expect(data.map((p) => p.key)).toEqual(PLANTILLAS_DE_BE.map((p) => p.clave));
    for (const p of data) {
      expect(p.validation).toBe('PROPOSAL');
      expect(p.state).toBe('PUBLISHED');
      expect(p.phases.length).toBeGreaterThanOrEqual(2);
      for (const f of p.phases) for (const s of f.sessions) for (const e of s.exercises) expect(e.exerciseId).not.toBeNull();
    }
    // La persona no es profesional de Entrenamiento.
    await conSesion(app, c.ase.token).get('/api/v1/training/be-templates').expect(403);
    await conSesion(app, c.pro.token).get('/api/v1/training/be-templates?x=1').expect(400);
  });

  it('TEST-ET3-API-02: aplicada a una persona, las cargas en % RM salen de su 1RM; sin 1RM quedan para completar', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('aplicar'));
    const pro = conSesion(app, c.pro.token);
    const plantilla = (await lista(c.pro.token)).find((p) => p.key === CUERPO_COMPLETO.clave)!;
    const sentadilla = plantilla.phases[0]!.sessions[0]!.exercises[0]!;
    expect(sentadilla.name).toBe('Sentadilla trasera con barra');
    // El 1RM declarado de la sentadilla: 100 kg.
    await pro
      .post(`/api/v1/advisees/${c.ase.id}/training/one-rep-max`)
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({ origin: 'DECLARED', exerciseId: sentadilla.exerciseId, localDate: hoy(), value: { value: 100, unit: 'kg' }, note: null })
      .expect(201);
    const pedido = { objectiveVersionId: c.objectiveVersionId, templateKey: CUERPO_COMPLETO.clave, templateVersion: CUERPO_COMPLETO.version };
    const r = PlanDesdePlantillaDeBeResponseSchema.parse(
      (await pro.post(`/api/v1/advisees/${c.ase.id}/training/plans/from-be-template`).set('Idempotency-Key', claveDeIdempotencia()).send(pedido).expect(201)).body,
    );
    expect(r.data.state).toBe('DRAFT');
    expect(r.beTemplate.unavailableExercises).toEqual([]);
    const deLaSentadilla = r.beTemplate.loads.filter((l) => l.exerciseName === 'Sentadilla trasera con barra');
    expect(deLaSentadilla[0]).toMatchObject({ status: 'RESOLVED', oneRepMaxShare: 65, load: { value: 65, unit: 'kg' }, basis: '65 % de 100 kg = 65 kg' });
    expect(deLaSentadilla[1]).toMatchObject({ status: 'RESOLVED', oneRepMaxShare: 77, load: { value: 77.5, unit: 'kg' } });
    expect(r.beTemplate.loads.filter((l) => l.exerciseName === 'Press de banca plano con barra').every((l) => l.status === 'WITHOUT_ONE_REP_MAX')).toBe(true);

    // Como el website: sin declarar training-set-kinds-1, la API saca `setKind` en el borde (lo de la APK 0.32).
    const detalle = PlanConObjetivosResponseSchema.parse(
      (await pro.get(`/api/v1/training/plans/${r.data.planId}/detail`).set(HEADER_DE_CAPACIDADES, valorDeCapacidades([CAPACIDAD_TIPOS_DE_SERIE])).expect(200)).body,
    ).data;
    expect(detalle.planning).toMatchObject({ weeks: 8, intensity: 'PERCENT_RM' });
    expect(detalle.planning?.phases.map((f) => f.weeks)).toEqual([4, 4]);
    expect(detalle.planning?.progressions?.length).toBe(2);
    expect(detalle.blocks.map((b) => b.label)).toEqual(['Base', 'Fuerza']);
    const [primera, banca] = detalle.blocks[0]!.sessions[0]!.prescriptions;
    // El identificador de la respuesta es el del plan nuevo.
    expect(deLaSentadilla[0]!.prescriptionId).toBe(primera!.prescriptionId);
    expect(primera!.suggestedLoad).toEqual({ value: 65, unit: 'kg' });
    expect(primera!.intensity).toMatchObject({ criterion: 'PERCENT_RM', target: { value: 65 } });
    expect(primera!.intensity?.target.reference?.description).toMatch(/^1RM 100 kg/);
    expect(primera!.sets.filter((s) => s.setKind === 'WARM_UP')).toHaveLength(3);
    expect(banca!.suggestedLoad).toBeNull();
    expect(banca!.sets.some((s) => s.setKind === 'WARM_UP')).toBe(false);
    // Un solo borrador por plan: aplicarla otra vez es 409.
    await pro.post(`/api/v1/advisees/${c.ase.id}/training/plans/from-be-template`).set('Idempotency-Key', claveDeIdempotencia()).send(pedido).expect(409);
  });

  it('TEST-ET3-API-03: lo ajeno es el 404 de lo inexistente; otra versión, 409; una clave que no existe, 404', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('ajeno'));
    const otro = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('otro'));
    const ruta = `/api/v1/advisees/${c.ase.id}/training/plans/from-be-template`;
    const pedido = { objectiveVersionId: c.objectiveVersionId, templateKey: CUERPO_COMPLETO.clave, templateVersion: CUERPO_COMPLETO.version };
    await conSesion(app, otro.pro.token).post(ruta).set('Idempotency-Key', claveDeIdempotencia()).send(pedido).expect(404);
    await conSesion(app, otro.pro.token).post(`/api/v1/advisees/${randomUUID()}/training/plans/from-be-template`).set('Idempotency-Key', claveDeIdempotencia()).send(pedido).expect(404);
    const pro = conSesion(app, c.pro.token);
    const version = await pro.post(ruta).set('Idempotency-Key', claveDeIdempotencia()).send({ ...pedido, templateVersion: 99 }).expect(409);
    expect(version.body.error.details).toMatchObject({ currentVersion: CUERPO_COMPLETO.version });
    await pro.post(ruta).set('Idempotency-Key', claveDeIdempotencia()).send({ ...pedido, templateKey: 'BE-NO-EXISTE' }).expect(404);
    await pro.post(ruta).set('Idempotency-Key', claveDeIdempotencia()).send({ ...pedido, templateKey: 'otra' }).expect(400);
    await pro.post(ruta).send(pedido).expect(400);
    // La persona tampoco la aplica sobre sí misma.
    await conSesion(app, c.ase.token).post(ruta).set('Idempotency-Key', claveDeIdempotencia()).send(pedido).expect((x) => expect([403, 404]).toContain(x.status));
  });

  it('TEST-ET3-API-04: Administración la retira y la vuelve a ofrecer, con su historia; retirada no se lista ni se aplica', async () => {
    const administradora = await administradorListo(app, prisma, `tpb-${randomUUID().slice(0, 6)}`);
    const a = adm(app, administradora.token);
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('admin'));
    const clave = 'BE-POR-GRUPO-MUSCULAR';
    const decidir = (cuerpo: Record<string, unknown>) => a.post(`/admin/training-templates/${clave}/decisions`).set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo);
    const todas = ListaDePlantillasDeBeParaAdministrarResponseSchema.parse((await a.post('/admin/training-templates/query').send({}).expect(200)).body).data;
    expect(todas).toHaveLength(PLANTILLAS_DE_BE.length);
    try {
      const retirada = (await decidir({ decision: 'WITHDRAW', reason: 'Falta validarla con Dirección' }).expect(200)).body.data;
      expect(retirada).toMatchObject({ key: clave, state: 'WITHDRAWN' });
      expect(retirada.history[0]).toMatchObject({ state: 'WITHDRAWN', reason: 'Falta validarla con Dirección', administratorName: expect.any(String) });
      expect((await lista(c.pro.token)).map((p) => p.key)).not.toContain(clave);
      const v = PLANTILLAS_DE_BE.find((p) => p.clave === clave)!.version;
      await conSesion(app, c.pro.token)
        .post(`/api/v1/advisees/${c.ase.id}/training/plans/from-be-template`)
        .set('Idempotency-Key', claveDeIdempotencia())
        .send({ objectiveVersionId: c.objectiveVersionId, templateKey: clave, templateVersion: v })
        .expect(422);
      await decidir({ decision: 'WITHDRAW' }).expect(422);
      await decidir({ decision: 'PUBLISH', reason: 'no va' }).expect(422);
    } finally {
      await decidir({ decision: 'PUBLISH' });
    }
    expect((await lista(c.pro.token)).map((p) => p.key)).toContain(clave);
    const despues = ListaDePlantillasDeBeParaAdministrarResponseSchema.parse((await a.post('/admin/training-templates/query').send({}).expect(200)).body).data.find((p) => p.key === clave)!;
    expect(despues.history.slice(0, 2).map((h) => h.state)).toEqual(['PUBLISHED', 'WITHDRAWN']);
    await a.post('/admin/training-templates/BE-NO-EXISTE/decisions').set('Idempotency-Key', claveDeIdempotencia()).send({ decision: 'WITHDRAW' }).expect(404);
    // Un profesional no entra a Administración.
    await adm(app, c.pro.token).post('/admin/training-templates/query').send({}).expect((x) => expect([401, 403]).toContain(x.status));
  });

  it('TEST-ET3-API-06 (ET3-27): la búsqueda con la clasificación dice quién cargó cada ejercicio; sin pedirla, la forma de siempre', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('cargado'));
    const s = conSesion(app, c.pro.token);
    await s
      .post('/api/v1/training/exercises')
      .send({ name: 'Remo propio de la tanda 3', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } })
      .expect(201);
    const sin = (await s.post('/api/v1/training/exercises/search').send({ q: 'press de banca plano con barra', limit: 5 }).expect(200)).body.data;
    expect(Object.hasOwn(sin[0], 'loadedByProfessional')).toBe(false);
    const deBe = BusquedaDeEjerciciosResponseSchema.parse((await s.post('/api/v1/training/exercises/search').send({ q: 'press de banca plano con barra', limit: 5, withClassification: true }).expect(200)).body).data;
    expect(deBe[0]).toMatchObject({ name: 'Press de banca plano con barra', loadedByProfessional: false });
    const propio = BusquedaDeEjerciciosResponseSchema.parse((await s.post('/api/v1/training/exercises/search').send({ q: 'remo propio de la tanda 3', limit: 5, withClassification: true }).expect(200)).body).data;
    expect(propio[0]).toMatchObject({ name: 'Remo propio de la tanda 3', loadedByProfessional: true });
  });

  it('TEST-ET3-API-05: la base no deja reescribir ni borrar lo decidido, ni que lo decida quien no administra', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('base'));
    await expect(
      prisma.decisionSobrePlantillaDeBe.create({ data: { clave: 'BE-CUERPO-COMPLETO', estado: 'RETIRADA', administradorId: c.pro.id, procedencia: { prueba: true } } }),
    ).rejects.toThrow(/administrador con su rol vigente/);
    const fila = await prisma.decisionSobrePlantillaDeBe.findFirst();
    if (fila) {
      await expect(prisma.decisionSobrePlantillaDeBe.update({ where: { id: fila.id }, data: { motivo: 'otro' } })).rejects.toThrow(/append-only/);
      await expect(prisma.decisionSobrePlantillaDeBe.delete({ where: { id: fila.id } })).rejects.toThrow(/append-only/);
    }
  });
});
