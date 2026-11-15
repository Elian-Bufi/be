/**
 * TEST-CMP-040 a 047 (WP-COMPARTIR, DL-176): la pantalla única de consentimiento en la APK, la tarjeta única de Inicio y lo
 * que suma «Quién ve qué». Se prueba la lógica pura (`compartir-en-el-telefono.ts`) y, leyendo el código, que las pantallas
 * la usan con TalkBack y los dos temas.
 *
 * Mutaciones verificadas: marcar al entrar lo que la persona retiró antes (TEST-CMP-040), dejar marcado lo que pide el A3
 * después de desmarcar el A3 (TEST-CMP-041), mandar los textos de lo no marcado (TEST-CMP-042), decir «no se pudo» ante un
 * 409 (TEST-CMP-043) y mostrar la tarjeta sin saber si ya se vio (TEST-CMP-045) ponen en rojo su prueba.
 *
 * Uso: cd apps/mobile && npx jest src/compartir-en-el-telefono.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { COPY_COMPARTIR as C, LoQueSePuedeCompartirResponseSchema } from '@be/domain';
import {
  alternar,
  claveDeLaTarjeta,
  coherentes,
  crearMarcaDeLaTarjeta,
  etiquetaConDetalle,
  etiquetaDelInterruptor,
  interruptoresDe,
  laTarjetaTieneAlgo,
  lineaDe,
  marcadasAlEntrar,
  pedidoDelToque,
  pedidoDeUnaCosa,
  pedidosParaResponder,
  rechazoDelToque,
  seMuestraLaTarjeta,
  textoDelBoton,
  textosParaLeer,
  type Cosa,
  type Propuesta,
} from './compartir-en-el-telefono';

declare const require: (modulo: string) => { readFileSync(ruta: string, codificacion: string): string; join(...partes: string[]): string };
declare const __dirname: string;
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const PAZ = { identityId: '11111111-1111-4111-8111-111111111111', displayName: 'Lic. Sofía Paz' };
const RUIZ = { identityId: '22222222-2222-4222-8222-222222222222', displayName: 'Prof. Martín Ruiz' };
const VINCULO = 'aaaaaaaa-0000-4000-8000-000000000001';
const base = { given: false, since: null, offered: true, preselected: true };
const texto = (id: string, kind: Propuesta['texts'][number]['kind'], approval: 'PENDING_APPROVAL' | 'APPROVED' = 'PENDING_APPROVAL') => ({ id, kind, title: `Texto ${id}`, text: `Texto ${id}\n\nUno.\n\nDos.`, textHash: 'a'.repeat(64), effectiveFrom: '2026-11-01T00:00:00.000Z', approval });

/** La propuesta al aceptar a Paz (Nutrición), con Ruiz en Entrenamiento; la persona todavía no dio el A3. */
function propuesta(cambios: Partial<Record<string, Partial<Cosa>>> = {}): Propuesta {
  const items: Cosa[] = [
    { kind: 'HEALTH_DATA', key: 'HEALTH_DATA', ...base, textId: 'a3' },
    { kind: 'AREA_CONSENT', key: `AREA_CONSENT:${VINCULO}`, ...base, textId: 'b2', relationshipId: VINCULO, professional: PAZ, scope: { code: 'NUTRICION', label: 'Nutrición' }, profileNotice: 'Es un profesional de la salud.' },
    { kind: 'SUMMARY', key: `SUMMARY:${PAZ.identityId}:ENTRENAMIENTO`, ...base, textId: 'resp', recipient: PAZ, area: 'ENTRENAMIENTO', level: 'SUMMARY_AND_PLAN', givenLevel: null, from: [RUIZ] },
    { kind: 'SUMMARY', key: `SUMMARY:${RUIZ.identityId}:NUTRICION`, ...base, textId: 'resp', recipient: RUIZ, area: 'NUTRICION', level: 'SUMMARY_AND_PLAN', givenLevel: null, from: [PAZ] },
    { kind: 'PREVIOUS_HISTORY', key: `PREVIOUS_HISTORY:${VINCULO}`, ...base, textId: 'hia', relationshipId: VINCULO, professional: PAZ, area: 'NUTRICION' },
    { kind: 'HABITS', key: `HABITS:${PAZ.identityId}`, ...base, textId: 'hbt', recipient: PAZ },
  ].map((i) => ({ ...i, ...(cambios[i.key] ?? {}) }) as Cosa);
  return LoQueSePuedeCompartirResponseSchema.parse({
    data: { relationshipId: VINCULO, version: 'pabc', items, texts: [texto('a3', 'HEALTH_DATA', 'APPROVED'), texto('b2', 'AREA_CONSENT', 'APPROVED'), texto('resp', 'SUMMARY_AND_PLAN'), texto('hia', 'PREVIOUS_HISTORY'), texto('hbt', 'HABITS')] },
  }).data;
}
const dia = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${Number(d)}/${Number(m)}/${a}`;
};

describe('TEST-CMP-040 · al entrar, marcado lo que la API preselecciona, coherente', () => {
  test('todo lo nunca decidido, marcado; lo retirado antes, no', () => {
    expect([...marcadasAlEntrar(propuesta().items)]).toHaveLength(6);
    const p = propuesta({ [`HABITS:${PAZ.identityId}`]: { preselected: false } });
    expect(marcadasAlEntrar(p.items).has(`HABITS:${PAZ.identityId}`)).toBe(false);
  });
  test('sin el A3 marcado (ni dado), lo que lo pide no queda marcado', () => {
    const p = propuesta({ HEALTH_DATA: { preselected: false } });
    expect([...marcadasAlEntrar(p.items)]).toEqual([`AREA_CONSENT:${VINCULO}`]);
  });
});

describe('TEST-CMP-041 · elegir: desmarcar el A3 desmarca lo que lo pide, y no se puede marcar sin él', () => {
  test('alternar', () => {
    const p = propuesta();
    const todo = marcadasAlEntrar(p.items);
    const sinA3 = alternar(p.items, todo, 'HEALTH_DATA');
    expect([...sinA3]).toEqual([`AREA_CONSENT:${VINCULO}`]);
    expect(alternar(p.items, sinA3, `HABITS:${PAZ.identityId}`).has(`HABITS:${PAZ.identityId}`)).toBe(false);
    const conA3 = alternar(p.items, sinA3, 'HEALTH_DATA');
    expect(alternar(p.items, conA3, `HABITS:${PAZ.identityId}`).has(`HABITS:${PAZ.identityId}`)).toBe(true);
    // Con el A3 ya dado, sí se puede.
    const dado = propuesta({ HEALTH_DATA: { given: true, offered: false, preselected: false } });
    expect(coherentes(dado.items, new Set([`HABITS:${PAZ.identityId}`])).has(`HABITS:${PAZ.identityId}`)).toBe(true);
  });
});

describe('TEST-CMP-042 · el toque manda la versión vista, los textos de lo marcado y las claves', () => {
  test('pedidoDelToque y pedidoDeUnaCosa', () => {
    const p = propuesta();
    const marcadas = new Set(['HEALTH_DATA', `HABITS:${PAZ.identityId}`]);
    expect(pedidoDelToque(p, marcadas)).toEqual({ relationshipId: VINCULO, expectedVersion: 'pabc', acceptedTextIds: ['a3', 'hbt'], choices: ['HEALTH_DATA', `HABITS:${PAZ.identityId}`] });
    expect(pedidoDeUnaCosa(p, p.items[2]!)).toEqual({ relationshipId: VINCULO, expectedVersion: 'pabc', acceptedTextIds: ['resp'], choices: [`SUMMARY:${PAZ.identityId}:ENTRENAMIENTO`] });
    // Los textos para leer: los de lo marcado, sin repetir.
    expect(textosParaLeer(p, marcadasAlEntrar(p.items)).map((t) => t.id)).toEqual(['a3', 'b2', 'resp', 'hia', 'hbt']);
    expect(textoDelBoton(false)).toBe(C.aceptarYCompartir);
    expect(textoDelBoton(true)).toBe(C.compartirLoElegido);
  });
});

describe('TEST-CMP-043 · los rechazos, en palabras, con su salida', () => {
  test('rechazoDelToque', () => {
    const api = (codigo: string, status = 409) => ({ ok: false as const, tipo: 'API' as const, status, codigo, issues: [] });
    for (const codigo of ['VERSION_CONFLICT', 'CONSENT_VERSION_STALE', 'SHARING_CHOICE_NOT_AVAILABLE', 'SHARING_TEXT_REQUIRED']) expect(rechazoDelToque(api(codigo))).toMatchObject({ mensaje: C.cambioAntes, actualizar: true });
    expect(rechazoDelToque(api('ACTION_FORBIDDEN', 403))).toMatchObject({ mensaje: C.pideElA3, privacidad: true });
    expect(rechazoDelToque({ ok: false, tipo: 'RED' })).toMatchObject({ reintentar: true });
    expect(rechazoDelToque(api('OTRO', 500))).toMatchObject({ mensaje: C.noSePudo, actualizar: false, reintentar: false });
  });
});

describe('TEST-CMP-044 · cada cosa en una línea: qué, de quién, para quién y para qué', () => {
  test('lineaDe', () => {
    const p = propuesta();
    expect(p.items.map(lineaDe)).toEqual([
      C.linea.HEALTH_DATA,
      'Tus datos de Nutrición, para Lic. Sofía Paz: para acompañamiento nutricional.',
      'El resumen y el plan vigente de Entrenamiento (de Prof. Martín Ruiz), para Lic. Sofía Paz.',
      'El resumen y el plan vigente de Nutrición (de Lic. Sofía Paz), para Prof. Martín Ruiz.',
      'Tu historia anterior de Nutrición, para Lic. Sofía Paz: lo que pasó antes en Nutrición con otros profesionales.',
      'Tus hábitos, para Lic. Sofía Paz.',
    ]);
    for (const l of p.items.map(lineaDe)) expect(l).not.toMatch(/todos tus datos|%|asesorad/i);
  });
});

describe('TEST-CMP-045 · la tarjeta única: con algo para compartir, una sola vez por cuenta en el teléfono', () => {
  test('seMuestraLaTarjeta', async () => {
    const p = propuesta({ HEALTH_DATA: { given: true, offered: false, preselected: false } });
    expect(laTarjetaTieneAlgo(p)).toBe(true);
    expect(seMuestraLaTarjeta(p, null)).toBe(false); // sin saber si se vio, no se dibuja
    expect(seMuestraLaTarjeta(p, false)).toBe(true);
    expect(seMuestraLaTarjeta(p, true)).toBe(false);
    // Solo el A3 o el B2 pendientes: eso lo recuerda Inicio con su aviso, no la tarjeta.
    const soloElB2 = propuesta(Object.fromEntries(p.items.filter((i) => i.kind !== 'AREA_CONSENT').map((i) => [i.key, { offered: false, preselected: false, given: true }])));
    expect(laTarjetaTieneAlgo(soloElB2)).toBe(false);
    // Revisión del PR: sin el A3 (revocado, que no vuelve marcado), lo que lo pide no queda marcado al entrar, y la tarjeta
    // no promete «Compartir todo» para abrir una pantalla sin nada marcado. Mutación: contar lo preseleccionado sin la
    // coherencia con el A3 la pone en rojo.
    expect(laTarjetaTieneAlgo(propuesta({ HEALTH_DATA: { preselected: false } }))).toBe(false);
    const guardado = new Map<string, string>();
    const marca = crearMarcaDeLaTarjeta({ getItem: async (k) => guardado.get(k) ?? null, setItem: async (k, v) => void guardado.set(k, v) });
    expect(await marca.leer('cuenta-1')).toBe(false);
    await marca.marcar('cuenta-1');
    expect(guardado.get(claveDeLaTarjeta('cuenta-1'))).toBe('1');
    expect(marca.vista('cuenta-1')).toBe(true);
    expect(await crearMarcaDeLaTarjeta({ getItem: async (k) => guardado.get(k) ?? null, setItem: async () => undefined }).leer('cuenta-2')).toBe(false);
    // Si el teléfono no deja leer, no se insiste: vale como no vista y se puede marcar igual.
    const roto = crearMarcaDeLaTarjeta({ getItem: async () => Promise.reject(new Error('x')), setItem: async () => Promise.reject(new Error('x')) });
    expect(await roto.leer('c')).toBe(false);
    expect(await roto.marcar('c')).toBe(false);
    expect(roto.vista('c')).toBe(true);
  });
});

describe('TEST-CMP-046 · «Quién ve qué»: un interruptor por cosa, con el estado en la etiqueta; los pedidos con lo que los da', () => {
  test('interruptoresDe', () => {
    const p = propuesta({ HEALTH_DATA: { given: true, offered: false, preselected: false }, [`SUMMARY:${PAZ.identityId}:ENTRENAMIENTO`]: { given: true, since: '2026-11-03T15:00:00.000Z', offered: false, givenLevel: 'SUMMARY_AND_PLAN' } });
    const deP = interruptoresDe(p, PAZ.identityId, dia);
    expect(deP.map((i) => [i.rotulo, i.estado, i.prendido, i.habilitado])).toEqual([
      ['El resumen y el plan de Entrenamiento', 'Lo ve desde el 3/11/2026', true, true],
      ['Tus hábitos', 'No lo ve', false, true],
    ]);
    expect(etiquetaDelInterruptor(deP[0]!, PAZ.displayName)).toBe('El resumen y el plan de Entrenamiento, para Lic. Sofía Paz. Lo ve desde el 3/11/2026.');
    // Sin el A3, lo apagado no se puede prender, y se dice por qué.
    const sinA3 = interruptoresDe(propuesta(), PAZ.identityId, dia);
    expect(sinA3.map((i) => [i.habilitado, i.porQueNo])).toEqual([
      [false, C.pideElA3],
      [false, C.pideElA3],
    ]);
    // Revisión del PR: prendido, dice lo que ve hoy. Si ve solo el resumen (aunque se le pueda dar el plan), el interruptor
    // no dice «el resumen y el plan». Mutación: rotular con el nivel que se ofrece la pone en rojo.
    const soloElResumen = propuesta({ HEALTH_DATA: { given: true, offered: false, preselected: false }, [`SUMMARY:${PAZ.identityId}:ENTRENAMIENTO`]: { given: true, since: '2026-11-03T15:00:00.000Z', offered: true, givenLevel: 'SUMMARY' } });
    expect(interruptoresDe(soloElResumen, PAZ.identityId, dia)[0]?.rotulo).toBe('El resumen de Entrenamiento');
    // TalkBack lee por qué no se puede prender (la etiqueta lleva el detalle), sin repetir lo que ya dice.
    expect(etiquetaConDetalle('El resumen y el plan de Entrenamiento, para Lic. Sofía Paz. No lo ve.', C.pideElA3)).toBe(`El resumen y el plan de Entrenamiento, para Lic. Sofía Paz. No lo ve. ${C.pideElA3}`);
    expect(etiquetaConDetalle('Tus hábitos, para Lic. Sofía Paz. No lo ve.', 'No lo ve')).toBe('Tus hábitos, para Lic. Sofía Paz. No lo ve.');
  });
  test('pedidosParaResponder', () => {
    const p = propuesta({ HEALTH_DATA: { given: true, offered: false, preselected: false } });
    const deUnPlan = [{ accessRequestId: 'r1', version: 'v1', professional: RUIZ, scope: { code: 'ENTRENAMIENTO' as const, label: 'Entrenamiento' }, area: 'NUTRICION' as const, requestedAt: '2026-11-14T10:00:00.000Z' }];
    const deHabitos = [{ accessRequestId: 'h1', version: 'v2', professional: PAZ, scope: { code: 'NUTRICION' as const, label: 'Nutrición' }, requestedAt: '2026-11-14T10:00:00.000Z' }];
    const pedidos = pedidosParaResponder(p, deUnPlan, deHabitos);
    expect(pedidos.map((x) => [x.tipo, x.texto, x.cosa?.key])).toEqual([
      ['PLAN', 'Prof. Martín Ruiz te pidió ver el resumen y el plan de Nutrición, para acompañarte en Entrenamiento.', `SUMMARY:${RUIZ.identityId}:NUTRICION`],
      ['HABITOS', 'Lic. Sofía Paz te pidió ver tus hábitos, para acompañarte en Nutrición.', `HABITS:${PAZ.identityId}`],
    ]);
    expect(pedidos.map((x) => x.porQueNo)).toEqual([null, null]);
    // Sin el A3, «Sí, compartir» no se puede dar desde acá, y se dice por qué.
    expect(pedidosParaResponder(propuesta(), deUnPlan, []).map((x) => [x.cosa, x.porQueNo])).toEqual([[null, C.pideElA3]]);
    // Revisión del PR: si la lectura de lo que se comparte falló, no se culpa al A3. Mutación: decir siempre «hace falta tu
    // consentimiento» cuando no hay cosa la pone en rojo.
    expect(pedidosParaResponder(null, deUnPlan, []).map((x) => [x.cosa, x.porQueNo])).toEqual([[null, null]]);
  });
});

describe('TEST-CMP-047 · las pantallas: la única al aceptar, la tarjeta de Inicio y «Quién ve qué», con TalkBack y los dos temas', () => {
  const leer = (archivo: string) => readFileSync(join(__dirname, archivo), 'utf8');
  test('aceptar lleva a la pantalla única, que lee API-CMP-01 y escribe con un toque (API-CMP-02)', () => {
    const pantalla = leer('pantallas/consentimiento.tsx');
    expect(pantalla).toContain('api.loQueSePuedeCompartir(token, vinculoId)');
    expect(pantalla).toContain('api.compartirLoElegido(token, pedidoDelToque(p, marcadas), intento.actual())');
    expect(pantalla).toContain('<Boton texto={C.elegir} tipo="secundario"');
    expect(pantalla).toContain('<Boton texto={C.ahoraNo} tipo="enlace"');
    expect(pantalla).toContain('<TextosCompletos textos={textosParaLeer(p, marcadas)} />');
    expect(pantalla).toContain('COPY_VINCULO.aclaracionDeConsentimiento');
  });
  test('la tarjeta va en Inicio, después del paso que falta', () => {
    const inicio = leer('pantallas/inicio.tsx');
    expect(inicio.indexOf('<CompartirConTusProfesionales')).toBeGreaterThan(inicio.indexOf('<AccesoIncompleto'));
  });
  test('«Quién ve qué» dibuja los interruptores y los pedidos', () => {
    const pantalla = leer('pantallas/quien-ve-que.tsx');
    expect(pantalla).toContain('<LoQueVeDeOtrasAreas');
    expect(pantalla).toContain('<PedidosParaResponder');
  });
  test('cada interruptor es una fila con rol de interruptor, el estado en la etiqueta, y los colores del tema', () => {
    const pieza = leer('compartir.tsx');
    expect(pieza).toContain('accessibilityRole="switch"');
    expect(pieza).toContain('accessibilityState={{ checked: prendido');
    expect(pieza).toContain('importantForAccessibility="no-hide-descendants"');
    expect(pieza).toContain('estilosPorTema');
    expect(pieza).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(pieza).not.toContain('allowFontScaling');
  });
});
