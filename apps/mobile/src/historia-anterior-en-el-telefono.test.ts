/**
 * TEST-HA-040 a 045 (WP-HISTORIA-ANTERIOR, DL-175): «Tu historia anterior» en la APK. Se prueba la lógica pura
 * (`historia-anterior-en-el-telefono.ts`) con la forma de la respuesta de API-HIA-01 y, leyendo el código, que las pantallas
 * la dibujan: «Quién ve qué» debajo del profesional de cada área y la tarjeta opcional al aceptar a alguien nuevo.
 *
 * Mutaciones verificadas: mostrar la tarjeta sin otro profesional antes (TEST-HA-040), ofrecerla al aceptar cuando ya se
 * decidió (TEST-HA-041), autorizar con `expectedVersion: null` aunque haya una versión (TEST-HA-042) y tratar el 409 del texto
 * como «no se pudo» (TEST-HA-043) ponen en rojo su prueba.
 *
 * Uso: cd apps/mobile && npx jest src/historia-anterior-en-el-telefono.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { COPY_HISTORIA_ANTERIOR as C, TEXTO_DE_LA_HISTORIA_ANTERIOR, type HistoriaAnteriorDeUnArea } from '@be/domain';
import { conLoNuevo, loQuePideElInterruptor, mensajeDelRechazo, pedidoDeAutorizar, pedidoDeRetirar, seMuestra, seOfreceAlAceptar, vistasDeLaHistoriaAnterior, type MiHistoriaAnterior } from './historia-anterior-en-el-telefono';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const ZONA = 'America/Argentina/Buenos_Aires';
// Domingo 15 de noviembre de 2026, en Buenos Aires.
const HOY = '2026-11-15';
const dia = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${Number(d)}/${Number(m)}/${a}`;
};

const item = (x: Partial<HistoriaAnteriorDeUnArea> = {}): HistoriaAnteriorDeUnArea => ({
  relationshipId: '11111111-1111-4111-8111-111111111111',
  area: 'NUTRICION',
  professional: { identityId: '22222222-2222-4222-8222-222222222222', displayName: 'Lic. Sofía Paz' },
  relationshipState: 'ACEPTADO',
  hadEarlierProfessional: true,
  includes: ['PLANS', 'RECORDS', 'DECISIONS'],
  authorization: null,
  lastReadAt: null,
  ...x,
});
const mia = (items: HistoriaAnteriorDeUnArea[]): MiHistoriaAnterior => ({
  text: { id: TEXTO_DE_LA_HISTORIA_ANTERIOR.id, title: TEXTO_DE_LA_HISTORIA_ANTERIOR.titulo, text: TEXTO_DE_LA_HISTORIA_ANTERIOR.texto, textHash: TEXTO_DE_LA_HISTORIA_ANTERIOR.hash, effectiveFrom: TEXTO_DE_LA_HISTORIA_ANTERIOR.vigenteDesde, approval: 'PENDING_APPROVAL' },
  items,
  accesses: [],
});
const DADA = { state: 'GRANTED' as const, version: 'v1', since: '2026-11-03T15:00:00.000Z' };

describe('TEST-HA-040 · «Quién ve qué»: la tarjeta, con el título, la explicación, el estado y cuándo la miró', () => {
  test('sin otro profesional antes y sin decisión, no se dibuja; con alguno de los dos, sí', () => {
    expect(seMuestra(item({ hadEarlierProfessional: false }))).toBe(false);
    expect(seMuestra(item())).toBe(true);
    expect(seMuestra(item({ hadEarlierProfessional: false, authorization: { ...DADA, state: 'WITHDRAWN', version: 'v2' } }))).toBe(true);
    expect(vistasDeLaHistoriaAnterior(mia([item({ hadEarlierProfessional: false })]), dia, HOY, ZONA).size).toBe(0);
  });

  test('por omisión no se comparte: el interruptor apagado y «No la ve», sin línea de cuándo la miró', () => {
    const v = vistasDeLaHistoriaAnterior(mia([item()]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(v).toEqual({
      relationshipId: item().relationshipId,
      titulo: 'Tu historia anterior de Nutrición',
      explicacion: 'Le muestra a Lic. Sofía Paz tus planes, registros y decisiones anteriores de Nutrición, con otros profesionales. Sus notas privadas no se comparten.',
      compartida: false,
      estado: 'No la ve',
      miro: null,
      paraLeer: 'Compartir tu historia anterior de Nutrición con Lic. Sofía Paz',
    });
  });

  test('compartida: desde cuándo, «Todavía no miró» y, cuando la miró, el día y la hora en 24 h', () => {
    const sinMirar = vistasDeLaHistoriaAnterior(mia([item({ authorization: DADA })]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(sinMirar).toMatchObject({ compartida: true, estado: 'La ve desde el 3/11/2026', miro: 'Todavía no miró tu historia anterior' });
    const mirada = vistasDeLaHistoriaAnterior(mia([item({ authorization: DADA, lastReadAt: '2026-11-10T21:20:00.000Z' })]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(mirada.miro).toBe('Miró tu historia anterior el martes 10 a las 18:20');
    const hoy = vistasDeLaHistoriaAnterior(mia([item({ authorization: DADA, lastReadAt: '2026-11-15T12:05:00.000Z' })]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(hoy.miro).toBe('Miró tu historia anterior hoy a las 09:05');
    // Retirada después de que la miró: la línea de la última vez sigue (es un hecho), y el estado dice que no la ve.
    const retirada = vistasDeLaHistoriaAnterior(mia([item({ authorization: { ...DADA, state: 'WITHDRAWN', version: 'v2' }, lastReadAt: '2026-11-10T21:20:00.000Z' })]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(retirada).toMatchObject({ compartida: false, estado: 'No la ve', miro: 'Miró tu historia anterior el martes 10 a las 18:20' });
    // En pausa, compartida: no la ve mientras dure la pausa, y se dice.
    expect(vistasDeLaHistoriaAnterior(mia([item({ authorization: DADA, relationshipState: 'PAUSADO' })]), dia, HOY, ZONA).get(item().relationshipId)!.estado).toBe(C.enPausa);
  });

  test('Antropometría dice sus tomas, con su método', () => {
    const v = vistasDeLaHistoriaAnterior(mia([item({ area: 'ANTROPOMETRIA', includes: ['MEASUREMENTS'] })]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(v.explicacion).toBe('Le muestra a Lic. Sofía Paz tus tomas anteriores de Antropometría, con su método, con otros profesionales. Sus notas privadas no se comparten.');
  });
});

describe('TEST-HA-041 · la tarjeta al aceptar: solo si hubo otro antes, con el vínculo aceptado y sin decidir', () => {
  test('se ofrece una vez, y no si ya decidió, si está en pausa o si no hubo nadie antes', () => {
    expect(seOfreceAlAceptar(mia([item()]), item().relationshipId)).toEqual(item());
    expect(seOfreceAlAceptar(mia([item({ authorization: DADA })]), item().relationshipId)).toBeNull();
    expect(seOfreceAlAceptar(mia([item({ authorization: { ...DADA, state: 'WITHDRAWN' } })]), item().relationshipId)).toBeNull();
    expect(seOfreceAlAceptar(mia([item({ relationshipState: 'PAUSADO' })]), item().relationshipId)).toBeNull();
    expect(seOfreceAlAceptar(mia([item({ hadEarlierProfessional: false })]), item().relationshipId)).toBeNull();
    expect(seOfreceAlAceptar(mia([item()]), '99999999-9999-4999-8999-999999999999')).toBeNull();
  });
});

describe('TEST-HA-042 · los pedidos llevan lo que se vio', () => {
  test('autorizar con la versión de la última decisión y el texto mostrado; retirar solo una compartida', () => {
    expect(pedidoDeAutorizar(item(), TEXTO_DE_LA_HISTORIA_ANTERIOR.id)).toEqual({ expectedVersion: null, textVersionId: TEXTO_DE_LA_HISTORIA_ANTERIOR.id });
    expect(pedidoDeAutorizar(item({ authorization: { ...DADA, state: 'WITHDRAWN', version: 'v2' } }), 't')).toEqual({ expectedVersion: 'v2', textVersionId: 't' });
    expect(pedidoDeRetirar(item({ authorization: DADA }))).toEqual({ expectedVersion: 'v1' });
    expect(pedidoDeRetirar(item())).toBeNull();
    expect(loQuePideElInterruptor(item())).toBe('COMPARTIR');
    expect(loQuePideElInterruptor(item({ authorization: DADA }))).toBe('RETIRAR');
  });
});

describe('TEST-HA-043 · los rechazos, en palabras', () => {
  test('lo que cambió pide actualizar; sin el A3, dónde darlo; lo demás, que no se pudo', () => {
    const api = (codigo: string) => ({ ok: false as const, tipo: 'API' as const, status: 409, codigo, issues: [] });
    expect(mensajeDelRechazo(api('VERSION_CONFLICT'))).toEqual({ mensaje: C.cambioAntes, actualizar: true });
    expect(mensajeDelRechazo(api('CONSENT_VERSION_STALE'))).toEqual({ mensaje: C.cambioAntes, actualizar: true });
    expect(mensajeDelRechazo({ ...api('ACTION_FORBIDDEN'), status: 403 })).toEqual({ mensaje: C.sinElA3, actualizar: false });
    expect(mensajeDelRechazo({ ...api('INTERNAL_ERROR'), status: 500 })).toEqual({ mensaje: C.noSePudo, actualizar: false });
    expect(mensajeDelRechazo({ ok: false, tipo: 'RED' } as never)).toEqual({ mensaje: C.noSePudo, actualizar: false });
  });
});

describe('TEST-HA-044 · lo que responde una escritura reemplaza al componente, sin tocar los demás', () => {
  test('conLoNuevo', () => {
    const otro = item({ relationshipId: '33333333-3333-4333-8333-333333333333', area: 'ENTRENAMIENTO' });
    const nuevo = item({ authorization: DADA });
    expect(conLoNuevo(mia([item(), otro]), nuevo).items).toEqual([nuevo, otro]);
  });
});

describe('TEST-HA-045 · las pantallas la dibujan, con TalkBack y los dos temas', () => {
  test('«Quién ve qué» lee API-HIA-01 aparte y dibuja la tarjeta debajo de cada área', () => {
    const pantalla = readFileSync(join(__dirname, 'pantallas', 'quien-ve-que.tsx'), 'utf8');
    expect(pantalla).toContain('api.miHistoriaAnterior(token)');
    expect(pantalla).toContain('<HistoriaAnteriorDelArea');
  });
  test('al aceptar un vínculo, la tarjeta opcional', () => {
    const vinculos = readFileSync(join(__dirname, 'pantallas', 'vinculos.tsx'), 'utf8');
    expect(vinculos).toContain('<HistoriaAnteriorAlAceptar');
  });
  test('el interruptor se lee con su nombre y su estado, y los colores salen del tema', () => {
    const pieza = readFileSync(join(__dirname, 'historia-anterior.tsx'), 'utf8');
    expect(pieza).toContain('accessibilityRole="switch"');
    expect(pieza).toContain('accessibilityState={{ checked:');
    expect(pieza).toContain('estilosPorTema');
    expect(pieza).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});
