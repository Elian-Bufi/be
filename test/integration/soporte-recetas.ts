/**
 * Soporte e2e de WP-NUTRICION-RECETAS (DL-119 a DL-121). Todo pasa por la API real, con datos sintéticos y con los datos
 * del paquete de Dirección `BE_Nutricion_Demo_2026-10-05` (alimentos de USDA, recetas, casos numéricos y fotos), leídos
 * del repositorio: el oráculo de los cálculos es el paquete, no esta prueba.
 */
import type { INestApplication } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { RAIZ } from './soporte';
import { claveDeIdempotencia, conSesion } from './soporte-api';
import type { Parte } from './soporte-vinculo';

export const PAQUETE = join(RAIZ, 'docs', 'fuente_nutricion', 'BE_Nutricion_Demo_2026-10-05');
const leer = <T>(archivo: string): T => JSON.parse(readFileSync(join(PAQUETE, 'datos', archivo), 'utf8')) as T;

export interface AlimentoDelPaquete {
  id: string;
  name_es: string;
  nutrients_per_100g: Record<string, string>;
  source: { fdc_id: number; ndb_number: string; description_original: string; license: string };
}
export interface RecetaDelPaquete {
  id: string;
  name: string;
  description: string;
  servings: string;
  image: string;
  items: { food_id: string; quantity_g: string }[];
  preparation: string[];
  expected_nutrients_unrounded: Record<string, string>;
}
export interface CasoDelPaquete {
  id: string;
  recipe_id: string;
  factor: string;
  quantity_overrides_g: Record<string, string>;
  expected: Record<string, string>;
}

export const ALIMENTOS = leer<{ foods: AlimentoDelPaquete[] }>('alimentos_usda_100g.json').foods;
export const RECETAS = leer<{ recipes: RecetaDelPaquete[] }>('recetas_demo.json').recipes;
export const CASOS = leer<{ numeric_cases: CasoDelPaquete[] }>('casos_calculo.json').numeric_cases;
/** Las tres fotos de la demostración, generadas por IA: se cargan por el flujo real (intención y subida). */
export const FOTOS = RECETAS.map((r) => readFileSync(join(PAQUETE, r.image)));

/** El nombre de cada nutriente del paquete en el contrato. */
export const NUTRIENTE_DEL_PAQUETE: Readonly<Record<string, 'energyKcal' | 'carbohydrateG' | 'fatG' | 'proteinG' | 'fiberG'>> = {
  energy_kcal: 'energyKcal',
  carbohydrate_g: 'carbohydrateG',
  fat_g: 'fatG',
  protein_g: 'proteinG',
  fiber_g: 'fiberG',
};

export interface AlimentoDelCatalogo {
  catalogItemId: string;
  versionId: string;
  name: string;
}

/** Los ocho alimentos de USDA sembrados por la migración, por el id del paquete, como los devuelve el buscador (API-NUT-13). */
export async function alimentosUsda(app: INestApplication, pro: Parte): Promise<Map<string, AlimentoDelCatalogo>> {
  const alimentos = new Map<string, AlimentoDelCatalogo>();
  for (const a of ALIMENTOS) {
    const r = await conSesion(app, pro.token).get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent(a.name_es)}&limit=50`).expect(200);
    const item = (r.body.data as { catalogItemId: string; versionId: string; name: string; externalSource: { provider: string; externalId: string } | null }[]).find(
      (i) => i.name === a.name_es && i.externalSource?.provider === 'USDA_FDC_SR_LEGACY' && i.externalSource.externalId === String(a.source.fdc_id),
    );
    if (!item) throw new Error(`alimento de USDA no sembrado: ${a.id}`);
    alimentos.set(a.id, { catalogItemId: item.catalogItemId, versionId: item.versionId, name: item.name });
  }
  return alimentos;
}

/**
 * Los ingredientes de una receta del paquete por identidad y versión del catálogo. `cambios` reemplaza los gramos de un
 * alimento (o lo quita con `null`); `factor` multiplica todas las cantidades (la receta al doble).
 */
export function ingredientesDe(receta: RecetaDelPaquete, alimentos: ReadonlyMap<string, AlimentoDelCatalogo>, cambios: Record<string, string | null> = {}, factor = 1) {
  return receta.items
    .filter((it) => cambios[it.food_id] !== null)
    .map((it) => {
      const a = alimentos.get(it.food_id)!;
      return {
        catalogItemId: a.catalogItemId,
        catalogItemVersionId: a.versionId,
        quantity: { value: Number(cambios[it.food_id] ?? it.quantity_g) * factor, unit: 'g' as const },
        // El aceite se pesa listo para usar; lo demás, cocido. El estado no cambia el cálculo: lo dice la fuente.
        preparationState: it.food_id === 'aceite_oliva' ? ('AS_PURCHASED' as const) : ('COOKED' as const),
      };
    });
}

export function cuerpoDeReceta(receta: RecetaDelPaquete, alimentos: ReadonlyMap<string, AlimentoDelCatalogo>, opciones: { servings?: number; cambios?: Record<string, string | null>; factor?: number } = {}) {
  return {
    name: receta.name,
    description: receta.description,
    servings: opciones.servings ?? Number(receta.servings),
    steps: receta.preparation,
    ingredients: ingredientesDe(receta, alimentos, opciones.cambios ?? {}, opciones.factor ?? 1),
  };
}

export function crearReceta(app: INestApplication, pro: Parte, cuerpo: Record<string, unknown>, clave = claveDeIdempotencia()) {
  return conSesion(app, pro.token).post('/api/v1/nutrition/recipes', clave).send(cuerpo);
}

/**
 * API-MED-01 y API-MED-02: la intención y la subida de los bytes a la ruta firmada. La finalidad es una de las tres: la
 * imagen de una receta, la foto de una comida o, desde WP-ENTRENAMIENTO-SERIES (DL-123), la imagen de un ejercicio.
 */
export async function subirImagen(
  app: INestApplication,
  parte: Parte,
  bytes: Buffer,
  opciones: { contentType?: string; purpose?: 'RECIPE_REFERENCE' | 'MEAL_EVIDENCE' | 'EXERCISE_REFERENCE'; provenance?: 'AI_GENERATED' | 'PERSON_PROVIDED'; authorship?: string | null } = {},
): Promise<{ mediaId: string; uploadPath: string; medio: Record<string, unknown> }> {
  const contentType = opciones.contentType ?? 'image/png';
  const purpose = opciones.purpose ?? 'RECIPE_REFERENCE';
  const intencion = await conSesion(app, parte.token)
    .post('/api/v1/me/media/upload-intents')
    .send({ purpose, contentType, byteSize: bytes.length, provenance: opciones.provenance ?? (purpose === 'MEAL_EVIDENCE' ? 'PERSON_PROVIDED' : 'AI_GENERATED'), authorship: opciones.authorship ?? null })
    .expect(201);
  const subida = await subirBytes(app, intencion.body.data.uploadPath as string, bytes, contentType).expect(200);
  return { mediaId: intencion.body.data.mediaId as string, uploadPath: intencion.body.data.uploadPath as string, medio: subida.body.data };
}

/** API-MED-02 a una ruta firmada, sin sesión. */
export function subirBytes(app: INestApplication, rutaDeSubida: string, bytes: Buffer, contentType: string) {
  return request(app.getHttpServer()).put(`/api/v1${rutaDeSubida}`).set('Content-Type', contentType).send(bytes);
}

/** Junta un cuerpo binario (la imagen) en un Buffer: la respuesta de supertest es un flujo. */
export function cuerpoBinario(res: unknown, listo: (err: Error | null, cuerpo: Buffer) => void): void {
  const flujo = res as NodeJS.ReadableStream;
  const partes: Buffer[] = [];
  flujo.on('data', (p: Buffer) => partes.push(p));
  flujo.on('end', () => listo(null, Buffer.concat(partes)));
}

/** API-MED-04 con una ruta de lectura. */
export function leerContenido(app: INestApplication, ruta: string) {
  return request(app.getHttpServer()).get(`/api/v1${ruta}`).buffer(true).parse(cuerpoBinario);
}

/** API-MED-03 y API-MED-04: la ruta de lectura que da el PDP y los bytes. */
export async function leerImagen(app: INestApplication, parte: Parte, mediaId: string): Promise<Buffer> {
  const acceso = await conSesion(app, parte.token).get(`/api/v1/media/${mediaId}/access`).expect(200);
  const r = await leerContenido(app, acceso.body.data.path as string).expect(200);
  return r.body as Buffer;
}

/** La estructura de un plan con un almuerzo de opciones de receta y una cena a mano (para API-NUT-07 y 10). */
export function estructuraConRecetas(opciones: { label: string; recipeVersionId: string }[], pollo: string) {
  return {
    dayTypes: [
      {
        label: 'Día habitual',
        meals: [
          { label: 'Almuerzo', prescriptionMode: 'DISH_OPTIONS', options: opciones.map((o) => ({ label: o.label, items: [], recipeVersionId: o.recipeVersionId })) },
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
