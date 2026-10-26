/**
 * DL-152 · lo que lee cada APK publicada, congelado en `fixtures/lecturas-de-la-apk/<versión>.json` con
 * `node scripts/congelar-lo-que-lee-la-apk.mjs <tag>`: por cada operación que la APK llama, el esquema con el que valida la
 * respuesta, tal como estaba en el commit de esa APK, y cómo pide (sesión, Idempotency-Key, cabeceras, textos).
 *
 * La prueba de integración `test/integration/lecturas-de-las-apk.int-spec.ts` valida contra esos esquemas las respuestas
 * reales de la API de hoy. Esta, sin base de datos, verifica tres cosas que aquella da por hechas:
 * - que leer lo congelado con `z.fromJSONSchema` devuelve exactamente lo congelado (la prueba no lee otra cosa);
 * - que el contrato de hoy sigue teniendo cada operación que una APK llama, pedida como la pide;
 * - que todo lo que JSON Schema no representa (un `refine`) es una regla que la prueba de integración revisa aparte.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { OPERACIONES } from './openapi';

interface Lectura {
  metodo: string;
  ruta: string;
  llamadas: string[];
  conSesion: boolean;
  conClave: boolean;
  esquema: string | null;
  comoElContrato: boolean;
  respuesta: Record<string, unknown> | null;
  noRepresentado: string[];
  pedido: Record<string, unknown> | null;
}
interface Congelado {
  apk: { version: string; versionCode: number; tag: string; commit: string };
  origen: string;
  cabeceras: Record<string, string>;
  textos: Record<string, string>;
  errores: { esquema: string; respuesta: Record<string, unknown>; noRepresentado: string[]; detalles: Record<string, { esquema: string; respuesta: Record<string, unknown> }> };
  lecturas: Record<string, Lectura>;
}

const CARPETA = join(__dirname, '..', 'fixtures', 'lecturas-de-la-apk');
const APK = readdirSync(CARPETA)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((archivo) => ({ archivo, ...(JSON.parse(readFileSync(join(CARPETA, archivo), 'utf8')) as Congelado) }));

/**
 * Las APK que importan hoy (DL-152): la estable instalada y las candidatas que puede haber en un teléfono. Cambiar esta
 * lista es una decisión: al publicar una candidata nueva se congela y se suma; al dejar de haber teléfonos con una
 * versión, se saca. La 0.18.0-candidata.1 (2026-10-26) se sumó sin sacar la candidata.3, que sigue instalada hasta que se
 * actualice el teléfono.
 */
const VIGENTES = ['0.13.2', '0.17.0-candidata.3', '0.18.0-candidata.1'];

/**
 * Las reglas que el JSON Schema no dice y la prueba de integración revisa aparte (`reglasQueElJsonNoDice` en
 * `soporte-lecturas-de-la-apk.ts`), por el final del camino que anota el script. Una nueva rompe esta prueba: hay que
 * escribir su verificación allá antes de sumarla acá.
 */
const REGLAS_REVISADAS_APARTE = ['repetitions: refine', 'professionalParameters[]: refine', 'objective: refine', 'at: refine'];

test('DL-152 · están congeladas la APK estable y la candidata vigentes, cada una con su tag y su commit', () => {
  assert.deepEqual(
    APK.map((a) => a.apk.version),
    VIGENTES,
  );
  for (const a of APK) {
    assert.equal(a.archivo, `${a.apk.version}.json`);
    assert.equal(a.apk.tag, `be-apk-${a.apk.version}`);
    assert.match(a.apk.commit, /^[0-9a-f]{40}$/);
    assert.ok(Number.isInteger(a.apk.versionCode) && a.apk.versionCode > 0);
    assert.equal(a.cabeceras['X-BE-Surface'], 'APK');
    assert.match(a.origen, /node scripts\/congelar-lo-que-lee-la-apk\.mjs be-apk-/);
    assert.ok(Object.keys(a.lecturas).length > 0, a.apk.version);
  }
});

/**
 * `z.toJSONSchema(z.fromJSONSchema(x))` sin lo que cambia de forma y no de sentido: `$schema`, el `format` de las fechas
 * (su patrón queda; zod lo devuelve como un `allOf` de dos patrones iguales), un `enum` de un valor (que vuelve como
 * `const`) y unas `properties` vacías.
 */
function normalizar(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(normalizar);
  if (!x || typeof x !== 'object') return x;
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(x)) {
    if (k === '$schema' || k === 'format') continue;
    if (k === 'properties' && v && typeof v === 'object' && Object.keys(v).length === 0) continue;
    if (k === 'enum' && Array.isArray(v) && v.length === 1) {
      o.const = v[0];
      continue;
    }
    o[k] = normalizar(v);
  }
  const todos = o.allOf;
  if (Array.isArray(todos) && todos.every((p) => p && typeof p === 'object' && Object.keys(p).length === 1 && typeof (p as { pattern?: unknown }).pattern === 'string')) {
    const patrones = [...new Set(todos.map((p) => (p as { pattern: string }).pattern))];
    if (patrones.length === 1 && (o.pattern === undefined || o.pattern === patrones[0])) {
      delete o.allOf;
      o.pattern = patrones[0];
    }
  }
  return o;
}

const ida = (esquema: Record<string, unknown>) => z.toJSONSchema(z.fromJSONSchema(esquema as Parameters<typeof z.fromJSONSchema>[0]), { target: 'draft-2020-12', io: 'input' });

test('DL-152 · lo congelado se lee sin perder nada: ida y vuelta por zod da el mismo JSON Schema', () => {
  for (const a of APK) {
    const esquemas: [string, Record<string, unknown>][] = [
      ...Object.entries(a.lecturas).flatMap(([id, l]) => (l.respuesta ? [[`${id} respuesta`, l.respuesta] as [string, Record<string, unknown>]] : [])),
      ...Object.entries(a.lecturas).flatMap(([id, l]) => (l.pedido ? [[`${id} pedido`, l.pedido] as [string, Record<string, unknown>]] : [])),
      ['ErrorEnvelopeSchema', a.errores.respuesta],
      ...Object.entries(a.errores.detalles).map(([codigo, d]) => [`detalle de ${codigo}`, d.respuesta] as [string, Record<string, unknown>]),
    ];
    for (const [nombre, esquema] of esquemas) assert.deepEqual(normalizar(ida(esquema)), normalizar(esquema), `${a.apk.version} · ${nombre}`);
  }
});

test('DL-152 · el contrato de hoy tiene cada operación que llama una APK vigente, con su verbo, su ruta y pedida como la pide', () => {
  const problemas: string[] = [];
  for (const a of APK) {
    for (const [id, l] of Object.entries(a.lecturas)) {
      const op = OPERACIONES.find((o) => o.id === id);
      if (!op) {
        problemas.push(`${a.apk.version} · ${id}: ya no está en el contrato`);
        continue;
      }
      if (op.metodo !== l.metodo || op.ruta !== l.ruta) problemas.push(`${a.apk.version} · ${id}: era ${l.metodo} ${l.ruta} y hoy es ${op.metodo} ${op.ruta}`);
      // Sin Idempotency-Key, una operación que hoy la exige le respondería 400 a la APK; sin sesión, 401.
      if (l.metodo !== 'get' && !l.conClave && op.idempotencia) problemas.push(`${a.apk.version} · ${id}: hoy exige Idempotency-Key y la APK no la manda`);
      if (!l.conSesion && (op.autenticacion === 'SESSION' || op.autenticacion === 'SESSION_STEP_UP')) problemas.push(`${a.apk.version} · ${id}: hoy exige sesión y la APK no la manda`);
      if (l.conSesion && op.autenticacion !== 'SESSION' && op.autenticacion !== 'SESSION_STEP_UP') problemas.push(`${a.apk.version} · ${id}: la APK manda la sesión y hoy la operación es ${op.autenticacion}`);
    }
  }
  assert.deepEqual(problemas, []);
});

test('DL-152 · lo que JSON Schema no representa es solo lo que la prueba de integración revisa aparte', () => {
  const desconocidas: string[] = [];
  for (const a of APK) {
    const anotadas = [...Object.entries(a.lecturas).flatMap(([id, l]) => l.noRepresentado.map((n) => [id, n] as const)), ...a.errores.noRepresentado.map((n) => ['ErrorEnvelopeSchema', n] as const)];
    for (const [id, nota] of anotadas) if (!REGLAS_REVISADAS_APARTE.some((r) => nota.endsWith(r))) desconocidas.push(`${a.apk.version} · ${id}: ${nota}`);
  }
  assert.deepEqual(desconocidas, []);
});
