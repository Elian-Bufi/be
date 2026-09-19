/**
 * Soporte e2e de WP-04 (circuito nutricional). Todo pasa por la API real, con datos sintéticos: el profesional y el
 * asesorado se preparan como en WP-03, y la evaluación, el objetivo, el plan, la ingesta y la revisión se cargan por
 * NUT. Los alimentos salen del catálogo sintético sembrado por la migración.
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { conSesion, claveDeIdempotencia } from './soporte-api';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

/** Además de GET/POST/DELETE de `conSesion`: PATCH (API-NUT-10). */
export function patchConSesion(app: INestApplication, token: string, ruta: string) {
  return request(app.getHttpServer()).patch(ruta).set('Authorization', `Bearer ${token}`);
}

/** Id de un alimento del catálogo sembrado, por nombre exacto. */
export async function alimento(app: INestApplication, pro: Parte, nombre: string): Promise<string> {
  const r = await conSesion(app, pro.token).get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent(nombre)}&limit=50`).expect(200);
  const item = (r.body.data as { catalogItemId: string; name: string }[]).find((i) => i.name === nombre);
  if (!item) throw new Error(`alimento no sembrado: ${nombre}`);
  return item.catalogItemId;
}

export function cuerpoDeEvaluacion(): Record<string, unknown> {
  return {
    occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    context: 'Consulta inicial sintética.',
    assessment: {
      entries: [
        { concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' },
        { concept: 'Hidratación', value: 'Menos de un litro de agua por día', source: 'REPORTED' },
        { concept: 'Actividad observada en la consulta', value: 'Sin limitaciones', source: 'OBSERVED' },
      ],
    },
    evidenceReferences: [],
    professionalNotes: 'Notas sintéticas del profesional.',
  };
}

export function cuerpoDeObjetivo(evaluationId: string, kcal = 2200): Record<string, unknown> {
  return {
    evaluationId,
    effectiveFrom: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    effectiveUntil: null,
    estimatedEnergyRequirement: { value: kcal, unit: 'kcal/day' },
    macronutrientDistribution: {
      protein: { value: 110, unit: 'g/day' },
      carbohydrate: { value: 270, unit: 'g/day' },
      fat: { value: 70, unit: 'g/day' },
    },
    mealDistribution: 'Cuatro comidas.',
    rationale: 'Fundamento profesional sintético: decisión del profesional, sin cálculo de BE.',
    methodStatement: null,
  };
}

/** Estructura mínima completa: un día tipo, almuerzo con una opción (arroz 100 g cocido + pollo 120 g cocido) y cena. */
export function estructura(arroz: string, pollo: string): Record<string, unknown> {
  return {
    dayTypes: [
      {
        label: 'Día habitual',
        meals: [
          {
            label: 'Almuerzo',
            prescriptionMode: 'DISH_OPTIONS',
            options: [
              {
                label: 'Arroz con pollo',
                items: [
                  { catalogItemId: arroz, quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED' },
                  { catalogItemId: pollo, quantity: { value: 120, unit: 'g' }, preparationState: 'COOKED' },
                ],
              },
            ],
          },
          {
            label: 'Cena',
            prescriptionMode: 'DISH_OPTIONS',
            options: [{ label: 'Pollo solo', items: [{ catalogItemId: pollo, quantity: { value: 150, unit: 'g' }, preparationState: 'COOKED' }] }],
          },
        ],
      },
    ],
  };
}

export interface Circuito {
  readonly pro: Parte;
  readonly ase: Parte;
  readonly vinculoId: string;
  readonly consentId: string;
  readonly evaluationId: string;
  readonly objectiveVersionId: string;
  readonly arroz: string;
  readonly pollo: string;
}

/** Profesional de Nutrición, asesorado con A3, vínculo con B2, evaluación y objetivo: listo para planificar. */
export async function circuitoListoParaPlanificar(app: INestApplication, etiqueta: string, pro?: Parte): Promise<Circuito> {
  const profesional = pro ?? (await prepararProfesional(app, `nut-${etiqueta}`, ['NUTRICION']));
  const ase = await prepararAsesorado(app, `nut-${etiqueta}`, { a3: true });
  const { vinculoId, consentId } = await vinculoCompleto(app, profesional, ase, 'NUTRICION');
  const ev = await conSesion(app, profesional.token).post(`/api/v1/advisees/${ase.id}/nutrition/evaluations`).send(cuerpoDeEvaluacion()).expect(201);
  const evaluationId = ev.body.data.evaluationId as string;
  const ob = await conSesion(app, profesional.token).post(`/api/v1/advisees/${ase.id}/nutrition/objectives`).send(cuerpoDeObjetivo(evaluationId)).expect(201);
  return {
    pro: profesional,
    ase,
    vinculoId,
    consentId: consentId as string,
    evaluationId,
    objectiveVersionId: ob.body.data.versionId as string,
    arroz: await alimento(app, profesional, 'Arroz blanco'),
    pollo: await alimento(app, profesional, 'Pechuga de pollo'),
  };
}

export async function crearBorrador(app: INestApplication, c: Circuito, extra: Record<string, unknown> = {}): Promise<{ planId: string; version: string; body: Record<string, unknown> }> {
  const r = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/nutrition/plans`)
    .send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructura(c.arroz, c.pollo), ...extra })
    .expect(201);
  return { planId: r.body.data.planId as string, version: r.body.data.version as string, body: r.body.data };
}

export function activar(app: INestApplication, pro: Parte, planId: string, version: string, clave = claveDeIdempotencia()) {
  return conSesion(app, pro.token).post(`/api/v1/nutrition/plans/${planId}/activate`, clave).send({ expectedVersion: version });
}

/** Circuito con un plan activado: devuelve también la jerarquía que ve el asesorado. */
export async function circuitoConPlanActivo(app: INestApplication, etiqueta: string, pro?: Parte) {
  const c = await circuitoListoParaPlanificar(app, etiqueta, pro);
  const borrador = await crearBorrador(app, c);
  const act = await activar(app, c.pro, borrador.planId, borrador.version).expect(200);
  const hoy = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
  const dia = hoy.body.data.activePlan.dayTypes[0];
  return { ...c, planId: borrador.planId, activacion: act.body.data, hoy: hoy.body.data, dia };
}

/** Registro de una comida del plan con la primera opción, y opcionalmente cantidades consumidas. */
export function registrarComida(
  app: INestApplication,
  ase: Parte,
  planId: string,
  dia: { dayTypeId: string; meals: { mealId: string; options: { optionId: string; items: { itemId: string }[] }[] }[] },
  opciones: { comida?: number; gramos?: number; ocurrencia?: Date; clave?: string } = {},
) {
  const comida = dia.meals[opciones.comida ?? 0]!;
  const opcion = comida.options[0]!;
  return conSesion(app, ase.token)
    .post('/api/v1/me/nutrition/executions', opciones.clave)
    .send({
      activePlanId: planId,
      dayTypeId: dia.dayTypeId,
      occurredAt: (opciones.ocurrencia ?? new Date()).toISOString(),
      recording: {
        origin: 'PRESCRIBED',
        mode: 'DISH_OPTIONS',
        mealId: comida.mealId,
        optionId: opcion.optionId,
        ...(opciones.gramos ? { consumedItems: [{ itemId: opcion.items[0]!.itemId, quantity: { value: opciones.gramos, unit: 'g' } }] } : {}),
      },
    });
}

export function registrarLibre(app: INestApplication, ase: Parte, planId: string, descripcion: string, clave?: string) {
  return conSesion(app, ase.token)
    .post('/api/v1/me/nutrition/executions', clave)
    .send({ activePlanId: planId, occurredAt: new Date().toISOString(), recording: { origin: 'OUTSIDE_PRESCRIPTION', mode: 'FREE_DESCRIPTION', description: descripcion } });
}

export function cuerpoDeRevision(evidencia: { type: string; id: string }[], resultado: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  return {
    period: { start: hoy, end: hoy, timeZone: 'America/Argentina/Buenos_Aires' },
    evidenceReferences: evidencia,
    interpretation: 'Registró el almuerzo con menos cantidad que la prescripta. Interpretación no diagnóstica.',
    result: resultado,
    rationale: 'Fundamento profesional sintético.',
    nextAction: { description: 'Próxima acción sintética.', ...extra },
  };
}

/** Claves prohibidas en cualquier respuesta de nutrición (REG-06-125; TEST-PRJ-009). */
export const PUNTAJE_PROHIBIDO = /adherence|compliance|score|grade|percent|cumplimiento|adherencia/i;

export function clavesProhibidas(valor: unknown, ruta = '$'): string[] {
  if (Array.isArray(valor)) return valor.flatMap((v, i) => clavesProhibidas(v, `${ruta}[${i}]`));
  if (valor && typeof valor === 'object') {
    return Object.entries(valor as Record<string, unknown>).flatMap(([k, v]) => [...(PUNTAJE_PROHIBIDO.test(k) ? [`${ruta}.${k}`] : []), ...clavesProhibidas(v, `${ruta}.${k}`)]);
  }
  return [];
}
