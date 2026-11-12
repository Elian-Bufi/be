/**
 * API-PLN-01 (TB-38; ED-31 y ED-D6 de WP-EDITORES-PROFESIONAL) · los totales del plan calculados por el servidor, por la
 * API real y contra PostgreSQL. Lo que fija esta prueba:
 * - en un borrador y en la versión activada, cada opción trae su estimación y, por ítem, la composición y la versión que
 *   usó; la estimación es exactamente la cuenta del dominio sobre esos ítems (TEST-EDP-028: la misma que hace el editor);
 * - lo activado sale de la instantánea, y nunca hay total del día;
 * - solo lo lee el profesional del plan: la persona y otro profesional reciben el mismo 404.
 */
import type { INestApplication } from '@nestjs/common';
import { calcularNutrientes, EstimacionDeLasOpcionesResponseSchema, nutrientesDelResultado } from '@be/domain';
import { appDePrueba, conSesion } from './soporte-api';
import { activar, circuitoListoParaPlanificar, crearBorrador } from './soporte-nutricion';

let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
});

describe('API-PLN-01 · la estimación de cada opción del plan', () => {
  it('TEST-EDP-028 · el borrador y la versión activada traen la cuenta del dominio sobre la composición de cada ítem', async () => {
    const c = await circuitoListoParaPlanificar(app, `totales-${++contador}`);
    const pro = conSesion(app, c.pro.token);
    const b = await crearBorrador(app, c);
    const leer = async (planId: string) => EstimacionDeLasOpcionesResponseSchema.parse((await pro.get(`/api/v1/nutrition/plans/${planId}/option-estimates`).expect(200)).body).data;
    const borrador = await leer(b.planId);
    expect([borrador.state, borrador.method]).toEqual(['DRAFT', 'SUM_SOURCE_PER_100G_V1']);
    const opciones = borrador.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options));
    expect(opciones.length).toBeGreaterThan(0);
    for (const o of opciones) {
      expect(o.items.every((it) => it.composition !== null && it.catalogItemVersionId !== null)).toBe(true);
      expect(o.planned).toEqual(nutrientesDelResultado(calcularNutrientes(o.items.map((it) => ({ clave: it.itemId, cantidad: it.quantity, composicion: it.composition })))));
    }
    // Sin total del día: el contrato no tiene dónde ponerlo.
    expect(Object.keys(borrador.dayTypes[0]!)).toEqual(['dayTypeId', 'label', 'meals']);
    await activar(app, c.pro, b.planId, b.version).expect(200);
    const activada = await leer(b.planId);
    expect(activada.state).toBe('ACTIVATED');
    expect(activada.dayTypes.map((d) => d.meals.map((m) => m.options.map((o) => o.planned)))).toEqual(borrador.dayTypes.map((d) => d.meals.map((m) => m.options.map((o) => o.planned))));
  });

  it('la persona y otro profesional reciben el mismo 404', async () => {
    const c = await circuitoListoParaPlanificar(app, `totales-${++contador}`);
    const b = await crearBorrador(app, c);
    const otro = await circuitoListoParaPlanificar(app, `totales-${++contador}`);
    const persona = await conSesion(app, c.ase.token).get(`/api/v1/nutrition/plans/${b.planId}/option-estimates`);
    const ajeno = await conSesion(app, otro.pro.token).get(`/api/v1/nutrition/plans/${b.planId}/option-estimates`);
    expect([persona.status, ajeno.status]).toEqual([404, 404]);
    expect(persona.body.error.code).toBe(ajeno.body.error.code);
  });
});
