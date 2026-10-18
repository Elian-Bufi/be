/**
 * El paso que le falta a la persona para que su profesional pueda acompañarla (pedido de Dirección del 2026-10-17):
 * aceptar un vínculo no alcanza, falta autorizar al profesional y, si todavía no se dio, el tratamiento de datos de salud
 * (A3). Prueba sin teléfono qué vínculos lo piden (`apps/mobile/src/pasos-del-acceso.ts`) y que el recorrido de aceptar
 * muestre el último paso con el mismo bloque de Privacidad, como un acto aparte.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { pasosQueFaltan } = await import('../apps/mobile/src/pasos-del-acceso.ts');

const vinculo = (id, relationshipState, consentState, accessMode) => ({
  relationshipId: id,
  relationshipState,
  consentState,
  accessMode,
  professional: { identityId: `p-${id}`, displayName: `Profesional ${id}` },
  scope: { code: 'ENTRENAMIENTO', label: 'Entrenamiento' },
});

test('pide autorizar al profesional cuando falta, y el tratamiento solo si falta A3', () => {
  const vinculos = [
    vinculo('a', 'ACEPTADO', 'REQUIRED', 'BLOCKED'),
    vinculo('b', 'ACEPTADO', 'ACTIVE', 'BLOCKED'),
    vinculo('c', 'ACEPTADO', 'ACTIVE', 'CONTEXTUAL'),
    vinculo('d', 'PAUSADO', 'ACTIVE', 'BLOCKED'),
    vinculo('e', 'FINALIZADO', 'REQUIRED', 'BLOCKED'),
    vinculo('f', 'ACEPTADO', 'REVOKED', 'BLOCKED'),
  ];
  assert.deepEqual(
    pasosQueFaltan(vinculos, false).map((p) => `${p.vinculo.relationshipId}:${p.que}`),
    ['a:autorizar', 'b:tratamiento'],
  );
  // Con A3 vigente, un acceso sin efecto es por otra razón, de la que la persona no puede ocuparse: no se le pide nada.
  assert.deepEqual(
    pasosQueFaltan(vinculos, true).map((p) => `${p.vinculo.relationshipId}:${p.que}`),
    ['a:autorizar'],
  );
  assert.deepEqual(pasosQueFaltan([], false), []);
});

test('el último paso es el mismo bloque de Privacidad, en el consentimiento y en el vínculo, y Inicio lo recuerda', () => {
  const fuente = (archivo) => readFileSync(resolve(RAIZ, 'apps/mobile/src', archivo), 'utf8');
  const paso = fuente('paso-que-falta.tsx');
  assert.match(paso, /<TratamientoDeDatosDeSalud\b/, 'el acto A3 es el de Privacidad, con su texto y sus dos botones');
  assert.match(paso, /api\.consultarRequisitoA3\(token\)/);
  assert.doesNotMatch(paso, /api\.otorgarA3/, 'el paso no otorga nada por su cuenta: lo hace el bloque, al tocar «Autorizar»');
  assert.match(fuente('pantallas/consentimiento.tsx'), /<PasoQueFaltaParaElAcceso token=\{token\} sesionPerdida=\{sesionPerdida\}/);
  assert.match(fuente('pantallas/vinculo.tsx'), /v\.consentState === 'ACTIVE' && v\.accessMode !== 'CONTEXTUAL' \? \(\s*<PasoQueFaltaParaElAcceso/);
  assert.match(fuente('pantallas/inicio.tsx'), /<AccesoIncompleto token=\{token\} sesionPerdida=\{sesionPerdida\} ir=\{ir\} \/>/);
  assert.match(fuente('pantallas/inicio-acceso.tsx'), /ir\(\{ nombre: 'vinculo', id: v\.relationshipId \}\)/);
});
