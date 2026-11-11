import type { INestApplication } from '@nestjs/common';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import request from 'supertest';
import { crearApp } from '../bootstrap';
import type { Entorno } from '../config/entorno';
import { PrismaService } from '../prisma/prisma.service';
import { esEscrituraDePlanOReceta, LIMITE_DE_PLANES_Y_RECETAS, RUTAS_DE_PLANES_Y_RECETAS } from './limite-de-cuerpo';

/**
 * DL-168 · el límite del cuerpo por ruta (arreglo del 2026-11-11). Las diez escrituras que llevan un plan entero (un
 * borrador o una plantilla) o una receta aceptan hasta 700 KB; el resto de la API, 16 KB, como siempre. Estas pruebas no
 * usan base de datos: la app se
 * arma con `crearApp`, como en producción, y un pedido sin sesión que pasa el parser llega al guard (401). Lo que guarda
 * cada ruta con PostgreSQL lo prueba `test/integration/guardado-de-planes-grandes.int-spec.ts`.
 */

const ID = '2b6f0cc9-3d2f-4f7e-9a51-6c1f0d7e8a90';
/** El límite de siempre, el de `LIMITE_DE_CUERPO` en bootstrap.ts. */
const LIMITE_GENERAL = 16 * 1024;
const NO_ENTRO = { error: { code: 'INVALID_REQUEST', message: 'La solicitud no es válida.', details: { issues: [{ code: 'TOO_BIG', path: '(body)' }] } } };

/** Un cuerpo JSON de exactamente `bytes` bytes. */
function cuerpoDe(bytes: number): string {
  const vacio = JSON.stringify({ relleno: '' }).length;
  return JSON.stringify({ relleno: 'x'.repeat(bytes - vacio) });
}

/**
 * Las diez, fijas y como las declaran los controladores: el archivo, el decorador y, de ahí, el método y una ruta de
 * ejemplo. Las pruebas de abajo recorren esta lista y no la de `limite-de-cuerpo.ts`, que es lo que se prueba: si una ruta
 * se cae de aquella, su pedido grande deja de entrar y la prueba lo dice.
 */
const ESPERADAS: Readonly<Record<string, readonly [archivo: string, decorador: string]>> = {
  'API-NUT-07': ['nutricion/nutricion.controller.ts', "@Post('advisees/:adviseeId/nutrition/plans')"],
  'API-NUT-10': ['nutricion/nutricion.controller.ts', "@Patch('nutrition/plans/:planId')"],
  'API-TRN-07': ['entrenamiento/entrenamiento.controller.ts', "@Post('advisees/:adviseeId/training/plans')"],
  'API-TRN-10': ['entrenamiento/entrenamiento.controller.ts', "@Patch('training/plans/:planId')"],
  'API-TPN-01': ['nutricion/nutricion.controller.ts', "@Post('nutrition/plan-templates')"],
  'API-TPN-04': ['nutricion/nutricion.controller.ts', "@Post('nutrition/plan-templates/:templateId/versions')"],
  'API-TPL-01': ['entrenamiento/entrenamiento.controller.ts', "@Post('training/plan-templates')"],
  'API-TPL-04': ['entrenamiento/entrenamiento.controller.ts', "@Post('training/plan-templates/:templateId/versions')"],
  'API-REC-01': ['nutricion/recetas.controller.ts', "@Post('nutrition/recipes')"],
  'API-REC-04': ['nutricion/recetas.controller.ts', "@Patch('nutrition/recipes/:recipeId')"],
};

/** El método y una ruta de ejemplo de una de las diez, con un identificador en cada parámetro. */
function pedidoDe(operacion: string): { readonly metodo: string; readonly ruta: string } {
  const [, metodo, ruta] = /^@(\w+)\('([^']+)'\)$/.exec((ESPERADAS[operacion] as readonly [string, string])[1]) as RegExpExecArray;
  return { metodo: metodo!.toUpperCase(), ruta: `/api/v1/${ruta!.replace(/:\w+/g, ID)}` };
}
const rutaDe = (operacion: string): string => pedidoDe(operacion).ruta;

/** Las vecinas: rutas de las mismas familias, o con el mismo camino y otro método, que siguen con 16 KB. */
const VECINAS: readonly (readonly [string, string])[] = [
  ['POST', `/api/v1/nutrition/plans/${ID}/validate`],
  ['POST', `/api/v1/nutrition/plans/${ID}/activate`],
  ['POST', `/api/v1/nutrition/plans/${ID}/discard`],
  ['POST', `/api/v1/training/plans/${ID}/validate`],
  ['POST', `/api/v1/training/plans/${ID}/activate`],
  // Cambiar el nombre, la descripción o el estado de una plantilla (API-TPN-05 y API-TPL-05): no lleva la estructura.
  ['PATCH', `/api/v1/nutrition/plan-templates/${ID}`],
  ['PATCH', `/api/v1/training/plan-templates/${ID}`],
  ['POST', `/api/v1/nutrition/plan-templates/${ID}`],
  ['POST', `/api/v1/training/plan-templates/${ID}/versions/${ID}`],
  ['POST', '/api/v1/nutrition/recipe-calculations'],
  ['PUT', `/api/v1/nutrition/recipes/${ID}/image`],
  ['PUT', `/api/v1/nutrition/plans/${ID}`],
  ['POST', `/api/v1/nutrition/plans/${ID}`],
  ['PATCH', `/api/v1/advisees/${ID}/nutrition/plans`],
  ['PATCH', `/api/v1/nutrition/plans/${ID}/otra-cosa`],
  ['PATCH', `/api/v2/nutrition/plans/${ID}`],
];

describe('DL-168 · las diez escrituras con el límite de planes y recetas', () => {
  it('son las de los controladores, con su método y su ruta', () => {
    expect(RUTAS_DE_PLANES_Y_RECETAS.map((r) => r.operacion).sort()).toEqual(Object.keys(ESPERADAS).sort());
    for (const [operacion, [archivo, decorador]] of Object.entries(ESPERADAS)) {
      const fuente = fs.readFileSync(path.resolve(__dirname, '..', archivo), 'utf8');
      // El decorador existe, y lo precede el comentario con la operación: la ruta es la de esa operación.
      expect([operacion, new RegExp(`/\\*\\* ${operacion}[.:][^\\n]*\\n\\s*${decorador.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(fuente)]).toEqual([operacion, true]);
      const { metodo, ruta } = pedidoDe(operacion);
      expect([operacion, RUTAS_DE_PLANES_Y_RECETAS.find((r) => r.operacion === operacion)?.metodo]).toEqual([operacion, metodo]);
      expect([operacion, esEscrituraDePlanOReceta({ method: metodo, url: ruta })]).toEqual([operacion, true]);
    }
  });

  it('las vecinas no: validar, activar, descartar, cambiar una plantilla, el cálculo y la imagen de una receta, y otros métodos', () => {
    for (const [method, url] of VECINAS) expect([method, url, esEscrituraDePlanOReceta({ method, url })]).toEqual([method, url, false]);
  });

  it('como el router de Express: sin distinguir mayúsculas, con barra final y con consulta', () => {
    expect(esEscrituraDePlanOReceta({ method: 'PATCH', url: `/API/V1/Nutrition/Plans/${ID}/` })).toBe(true);
    expect(esEscrituraDePlanOReceta({ method: 'PATCH', url: `/api/v1/nutrition/plans/${ID}?algo=1` })).toBe(true);
    expect(esEscrituraDePlanOReceta({ method: 'patch', url: `/api/v1/nutrition/plans/${ID}` })).toBe(false); // Node da el método en mayúsculas
  });
});

// El mismo entorno sintético de health.spec.ts: sin base, sin proveedores, sin avisos.
const ENTORNO: Entorno = {
  appEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://sintetico@localhost/x',
  corsAllowedOrigins: [],
  jwtSecret: 'secreto-sintetico-de-prueba-de-32-caracteres-o-mas',
  costoBcrypt: 10,
  limites: {
    login: { maximo: 5, ventanaMs: 900000 },
    loginPorIp: { maximo: 100, ventanaMs: 900000 },
    loginPorIdentificador: { maximo: 20, ventanaMs: 900000 },
    registro: { maximo: 10, ventanaMs: 3600000 },
    consultaProtegida: { maximo: 120, ventanaMs: 60000 },
    invitacion: { maximo: 10, ventanaMs: 900000 },
    reanudacion: { maximo: 300, ventanaMs: 900000 },
    loginAdministrativo: { maximo: 5, ventanaMs: 900000 },
    segundoFactor: { maximo: 10, ventanaMs: 900000 },
  },
  saltosDeProxy: 1,
  caducidadDeSolicitudMs: 30 * 24 * 60 * 60 * 1000,
  demoProfesionales: [],
  proveedores: { openFoodFactsUrl: 'http://127.0.0.1:9', wgerUrl: 'http://127.0.0.1:9', presupuestoMs: 1000 },
  mediosAlmacen: 'postgres',
  evidenciaVisualExigida: false,
  avisos: { canal: 'desactivado', expoUrl: 'http://127.0.0.1:1', expoToken: null, presupuestoMs: 2000 },
  secretoDeTareas: null,
  google: { clientIds: [], jwksUrl: 'http://127.0.0.1:9/certs', presupuestoMs: 1000 },
  claveDelSegundoFactor: null,
};

describe('DL-168 · el parser de cada ruta, en la app armada como en producción', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await crearApp({
      entorno: ENTORNO,
      version: { aplicacion: '0.1.0', commit: 'limite', construidoEn: null },
      directorioMigraciones: fs.mkdtempSync(path.join(tmpdir(), 'be-migr-')),
    });
    // Sin base: la única consulta al iniciar (el costo de los hashes guardados) responde vacío.
    Object.assign(app.get(PrismaService), { $queryRaw: jest.fn(async () => []) });
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  const pedir = (metodo: string, ruta: string, cuerpo: string) =>
    request(app.getHttpServer())
      [metodo.toLowerCase() as 'post' | 'patch' | 'put'](ruta)
      .set('Content-Type', 'application/json')
      .send(cuerpo);

  it.each(Object.keys(ESPERADAS).map((operacion) => [operacion, pedidoDe(operacion).metodo] as const))('%s (%s) acepta un plan de 100 KB: el cuerpo pasa el parser y llega al guard de la sesión', async (operacion, metodo) => {
    const res = await pedir(metodo, rutaDe(operacion), cuerpoDe(100 * 1024));
    expect([res.status, res.body.error.code]).toEqual([401, 'AUTHENTICATION_REQUIRED']);
  });

  it('el límite es exacto: 700 KB pasan; un byte más, TOO_BIG', async () => {
    expect((await pedir('PATCH', rutaDe('API-NUT-10'), cuerpoDe(LIMITE_DE_PLANES_Y_RECETAS))).status).toBe(401);
    const res = await pedir('PATCH', rutaDe('API-NUT-10'), cuerpoDe(LIMITE_DE_PLANES_Y_RECETAS + 1));
    expect([res.status, res.body]).toEqual([400, NO_ENTRO]);
  });

  it.each(VECINAS)('%s %s sigue con 16 KB: 16 KB pasan; un byte más, TOO_BIG', async (metodo, ruta) => {
    expect((await pedir(metodo, ruta, cuerpoDe(LIMITE_GENERAL))).body.error?.details?.issues ?? []).not.toContainEqual({ code: 'TOO_BIG', path: '(body)' });
    const res = await pedir(metodo, ruta, cuerpoDe(LIMITE_GENERAL + 1));
    expect([res.status, res.body]).toEqual([400, NO_ENTRO]);
  });

  it('una ruta sin sesión (iniciar sesión) también sigue con 16 KB', async () => {
    const res = await pedir('POST', '/api/v1/auth/sessions', cuerpoDe(LIMITE_GENERAL + 1));
    expect([res.status, res.body]).toEqual([400, NO_ENTRO]);
  });

  it('el JSON mal formado sigue siendo un 400 sin issues: no es una cuestión de tamaño', async () => {
    const res = await pedir('PATCH', rutaDe('API-NUT-10'), '{no es json');
    expect([res.status, res.body.error.code, res.body.error.details.issues]).toEqual([400, 'INVALID_REQUEST', []]);
  });
});
