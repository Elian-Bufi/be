/**
 * DL-111 · el catálogo antropométrico de BE, sembrado por migración, contra PostgreSQL y por la API real:
 * - el protocolo «Perfil antropométrico completo» y sus 40 métodos se publican con su ficha (descripción, fuente,
 *   población y categoría), seleccionables y con una regla que BE sabe aplicar; la ficha no califica (TEST-PRJ-009);
 * - una toma completa con el perfil alcanza para ejecutar cada método, y cada resultado es el de la regla del dominio con
 *   la precisión que el método declara;
 * - los resultados vigentes llegan a la evolución del asesorado (la que lee la APK), cada familia en su propia métrica:
 *   dos métodos distintos del mismo día no se pisan.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  aplicarPrecision,
  asignacionAutomatica,
  CATEGORIAS_DE_METODO,
  datosDelMetodo,
  EvolucionResponseSchema,
  NOMBRE_DE_METRICA,
  nombreDeMetodo,
  REGLAS_ANTROPOMETRICAS,
  REGLAS_CONOCIDAS,
  terminosProhibidosDeAntropometriaEn,
  type EvaluacionAntropometricaApi,
  type MetodoApi,
} from '@be/domain';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoAntropometrico, type CircuitoAntropometrico } from './soporte-antropometria';

const PERFIL_COMPLETO = '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a2f10';

/** Una toma sintética completa de un adulto de 25 años, en las unidades del perfil: kg, cm, mm y años. */
const TOMA: Record<string, [number, string]> = {
  peso: [80, 'kg'],
  talla: [175, 'cm'],
  edad: [25, 'años'],
  'pliegue-pectoral': [9, 'mm'],
  'pliegue-axilar-media': [11, 'mm'],
  'pliegue-triceps': [10, 'mm'],
  'pliegue-subescapular': [12, 'mm'],
  'pliegue-biceps': [4, 'mm'],
  'pliegue-cresta-iliaca': [14, 'mm'],
  'pliegue-supraespinal': [8, 'mm'],
  'pliegue-abdominal': [15, 'mm'],
  'pliegue-muslo-frontal': [14, 'mm'],
  'pliegue-pantorrilla': [7, 'mm'],
  'pliegue-antebrazo': [5, 'mm'],
  'perimetro-cuello': [38, 'cm'],
  'perimetro-hombros': [116, 'cm'],
  'perimetro-pecho': [98, 'cm'],
  'perimetro-brazo-relajado': [32, 'cm'],
  'perimetro-brazo-flexionado': [34, 'cm'],
  'perimetro-antebrazo': [28, 'cm'],
  'perimetro-muneca': [17, 'cm'],
  'perimetro-cintura': [84, 'cm'],
  'perimetro-abdomen': [86, 'cm'],
  'perimetro-cadera': [98, 'cm'],
  'perimetro-muslo': [56, 'cm'],
  'perimetro-pantorrilla': [37, 'cm'],
  'perimetro-tobillo': [22, 'cm'],
  'diametro-humero': [7, 'cm'],
  'diametro-biestiloideo': [5.8, 'cm'],
  'diametro-femur': [9.8, 'cm'],
};

const prisma = new PrismaClient();
let app: INestApplication;
let c: CircuitoAntropometrico;

beforeAll(async () => {
  app = await appDePrueba();
  c = await circuitoAntropometrico(app, prisma, 'catalogo-be');
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

async function metodosDeBE(): Promise<MetodoApi[]> {
  const r = await conSesion(app, c.pro.token).get('/api/v1/professional-methods?limit=50').expect(200);
  expect(r.body.page.hasMore).toBe(false);
  return (r.body.data as MetodoApi[]).filter((m) => m.ruleId.startsWith('be/'));
}

async function tomaRegistrada(occurredAt: string): Promise<EvaluacionAntropometricaApi> {
  const pro = conSesion(app, c.pro.token);
  const borrador = await pro
    .post(`/api/v1/advisees/${c.ase.id}/anthropometry/evaluation-drafts`, claveDeIdempotencia())
    .send({
      occurredAt,
      specificationVersionId: PERFIL_COMPLETO,
      source: { type: 'DIRECT_CAPTURE' },
      directMeasurements: Object.entries(TOMA).map(([metricCode, [value, unit]]) => ({ metricCode, value, unit })),
      professionalNotes: 'Toma sintética completa.',
    })
    .expect(201);
  const r = await pro.post(`/api/v1/anthropometry/evaluation-drafts/${borrador.body.data.evaluationId}/register`, claveDeIdempotencia()).send({ expectedVersion: borrador.body.data.version }).expect(200);
  return r.body.data as EvaluacionAntropometricaApi;
}

describe('DL-111 · el catálogo antropométrico de BE', () => {
  it('publica los 40 métodos con su ficha, seleccionables, con una regla conocida y sin calificar', async () => {
    const metodos = await metodosDeBE();
    expect(metodos).toHaveLength(40);
    for (const m of metodos) {
      expect(m.status).toBe('SELECTABLE');
      expect(m.purposes).toEqual(['ANTHROPOMETRIC_SUPPORT']);
      expect(REGLAS_CONOCIDAS).toContain(m.ruleId);
      expect(m.description && m.source && m.population).toBeTruthy();
      expect(CATEGORIAS_DE_METODO).toContain(m.category);
      // La APK nombra el método y el resultado sin consultar el catálogo (API-MTH-01 no es para el asesorado).
      expect(nombreDeMetodo(m.methodVersionId)).toBe(m.name);
      expect(NOMBRE_DE_METRICA[m.output.metric]).toBeTruthy();
      expect(terminosProhibidosDeAntropometriaEn(`${m.name}. ${m.description}. ${m.population}`)).toEqual([]);
    }
  });

  it('una toma completa con el perfil ejecuta cada método, con el resultado de la regla y la precisión declarada', async () => {
    const toma = await tomaRegistrada(new Date(Date.now() - 2 * 86_400_000).toISOString());
    const valores = Object.fromEntries(Object.entries(TOMA).map(([clave, [valor]]) => [clave, valor]));
    for (const m of await metodosDeBE()) {
      // La asignación automática del website: cada dato a la medición vigente de la toma con la misma clave.
      const asignacion = asignacionAutomatica(datosDelMetodo(m, toma.measurements));
      expect(Object.keys(asignacion).sort()).toEqual(m.requiredInputs.map((e) => e.inputCode).sort());
      const r = await conSesion(app, c.pro.token)
        .post(`/api/v1/advisees/${c.ase.id}/calculations`, claveDeIdempotencia())
        .send({ purpose: 'ANTHROPOMETRIC_SUPPORT', methodVersionId: m.methodVersionId, inputBindings: Object.entries(asignacion).map(([inputCode, sourceRef]) => ({ inputCode, sourceRef })) });
      expect({ metodo: m.name, status: r.status }).toEqual({ metodo: m.name, status: 201 });
      const crudo = REGLAS_ANTROPOMETRICAS[m.ruleId]!(valores);
      expect(typeof crudo).toBe('number');
      const esperado = aplicarPrecision(crudo as number, { decimales: m.precisionPolicy.decimals, modo: 'MEDIO_ARRIBA' });
      expect({ metodo: m.name, resultado: r.body.data.result }).toEqual({ metodo: m.name, resultado: { metric: m.output.metric, magnitude: { value: esperado, unit: m.output.unit } } });
    }
  });

  it('los resultados vigentes llegan a la evolución del asesorado, cada familia en su propia métrica y con su método', async () => {
    const r = await conSesion(app, c.ase.token).get('/api/v1/me/anthropometry/progress').expect(200);
    const datos = EvolucionResponseSchema.parse(r.body).data;
    const derivadas = datos.metrics.filter((s) => s.series.some((p) => p.dataClass === 'DERIVED'));
    // 40 métodos y 28 familias: los métodos por sexo comparten la métrica de su familia.
    expect(derivadas).toHaveLength(28);
    for (const s of derivadas) {
      expect(NOMBRE_DE_METRICA[s.metricCode]).toBeTruthy();
      // Dos métodos de la misma familia y el mismo día (el de hombres y el de mujeres): la API publica uno por día, y
      // su grupo dice con qué método salió.
      expect(s.series).toHaveLength(1);
      const grupo = s.comparability.groups.find((g) => g.comparabilityGroup === s.series[0]!.comparabilityGroup)!;
      expect(nombreDeMetodo(grupo.methodVersionId)).toBeTruthy();
    }
    expect(derivadas.map((s) => s.metricCode)).toEqual(expect.arrayContaining(['imc', 'grasa-durnin-womersley', 'grasa-faulkner', 'masa-muscular-cuatro-componentes', 'endomorfia', 'mesomorfia', 'ectomorfia']));
  });
});
