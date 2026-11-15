/**
 * TEST-HA-040 a 046 (WP-HISTORIA-ANTERIOR, DL-175): «Tu historia anterior» en la APK. Se prueba la lógica pura
 * (`historia-anterior-en-el-telefono.ts`) con la forma de la respuesta de API-HIA-01 y, leyendo el código, que las pantallas
 * la dibujan: «Quién ve qué» debajo del profesional de cada área y la tarjeta opcional al aceptar a alguien nuevo, por
 * Vínculos y por invitación.
 *
 * Mutaciones verificadas: mostrar la tarjeta sin otro profesional antes (TEST-HA-040), ofrecerla al aceptar cuando ya se
 * decidió (TEST-HA-041), autorizar con `expectedVersion: null` aunque haya una versión (TEST-HA-042), tratar el 409 del texto
 * como «no se pudo» (TEST-HA-043) y decir «La ve» o «puede ver» sin el acceso de hoy (TEST-HA-046) ponen en rojo su prueba.
 *
 * Uso: cd apps/mobile && npx jest src/historia-anterior-en-el-telefono.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { COPY_HISTORIA_ANTERIOR as C, TEXTO_DE_LA_HISTORIA_ANTERIOR, type HistoriaAnteriorDeUnArea } from '@be/domain';
import {
  conLoNuevo,
  estadoDeLaHistoria,
  etiquetaDelInterruptor,
  exitoAlCompartir,
  loQuePideElInterruptor,
  mensajeDelRechazo,
  partesDelTexto,
  pedidoDeAutorizar,
  pedidoDeRetirar,
  seMuestra,
  seOfreceAlAceptar,
  vistasDeLaHistoriaAnterior,
  type MiHistoriaAnterior,
} from './historia-anterior-en-el-telefono';

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
  accessInEffect: true,
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
    // Un vínculo terminado: solo si la miró con él (para que la persona siga viendo cuándo), en solo lectura.
    expect(seMuestra(item({ relationshipState: 'FINALIZADO', authorization: DADA, accessInEffect: false }))).toBe(false);
    const terminado = item({ relationshipState: 'FINALIZADO', authorization: DADA, accessInEffect: false, lastReadAt: '2026-11-10T21:20:00.000Z' });
    expect(vistasDeLaHistoriaAnterior(mia([terminado]), dia, HOY, ZONA).get(item().relationshipId)).toMatchObject({
      soloLectura: true,
      estado: C.terminado,
      miro: 'Miró tu historia anterior el martes 10 a las 18:20',
    });
  });

  test('por omisión no se comparte: el interruptor apagado y «No la ve», sin línea de cuándo la miró', () => {
    const v = vistasDeLaHistoriaAnterior(mia([item()]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(v).toEqual({
      relationshipId: item().relationshipId,
      titulo: 'Tu historia anterior de Nutrición',
      explicacion:
        'Compartirla le muestra a Lic. Sofía Paz lo que pasó antes en Nutrición con otros profesionales: tus planes, lo que registraste y las decisiones de las revisiones. Las notas privadas de esos profesionales no se comparten.',
      compartida: false,
      soloLectura: false,
      estado: 'No la ve',
      miro: null,
      paraLeer: 'Compartir tu historia anterior de Nutrición con Lic. Sofía Paz',
      sugerencia: C.paraCompartir,
    });
  });

  test('compartida: desde cuándo, «Todavía no miró» y, cuando la miró, el día y la hora en 24 h', () => {
    const sinMirar = vistasDeLaHistoriaAnterior(mia([item({ authorization: DADA })]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(sinMirar).toMatchObject({ compartida: true, estado: 'La ve desde el 3/11/2026', miro: 'Todavía no miró tu historia anterior', sugerencia: C.paraRetirar });
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

  test('Antropometría dice sus tomas, cada una con su método', () => {
    const v = vistasDeLaHistoriaAnterior(mia([item({ area: 'ANTROPOMETRIA', includes: ['MEASUREMENTS'] })]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(v.explicacion).toBe(
      'Compartirla le muestra a Lic. Sofía Paz lo que pasó antes en Antropometría con otros profesionales: tus tomas, cada una con su método. Las notas privadas de esos profesionales no se comparten.',
    );
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
    expect(mensajeDelRechazo(api('VERSION_CONFLICT'))).toEqual({ mensaje: C.cambioAntes, actualizar: true, privacidad: false });
    expect(mensajeDelRechazo(api('CONSENT_VERSION_STALE'))).toEqual({ mensaje: C.cambioAntes, actualizar: true, privacidad: false });
    // Sin el A3: el mensaje lleva el camino a Privacidad (el botón «Ir a Privacidad»).
    expect(mensajeDelRechazo({ ...api('ACTION_FORBIDDEN'), status: 403 })).toEqual({ mensaje: C.sinElA3, actualizar: false, privacidad: true });
    expect(mensajeDelRechazo({ ...api('INTERNAL_ERROR'), status: 500 })).toEqual({ mensaje: C.noSePudo, actualizar: false, privacidad: false });
    expect(mensajeDelRechazo({ ok: false, tipo: 'RED' } as never)).toEqual({ mensaje: C.noSePudo, actualizar: false, privacidad: false });
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
  test('al aceptar un vínculo (desde Vínculos o desde una invitación), la historia anterior va en la pantalla única de consentimiento (DL-176)', () => {
    // WP-COMPARTIR reemplazó la tarjeta opcional (HA-T01): aceptar lleva enseguida a la pantalla única, donde la historia
    // anterior es una de las cosas, preseleccionada si antes hubo otro profesional en esa área (API-CMP-01).
    for (const pantalla of ['vinculos.tsx', 'invitacion.tsx']) {
      const codigo = readFileSync(join(__dirname, 'pantallas', pantalla), 'utf8');
      expect(codigo).not.toContain('<HistoriaAnteriorAlAceptar');
      expect(codigo).toContain("ir({ nombre: 'consentimiento', vinculoId: ");
      expect(codigo).toContain('recienAceptado: true }');
    }
    expect(readFileSync(join(__dirname, 'pantallas', 'consentimiento.tsx'), 'utf8')).toContain('api.loQueSePuedeCompartir(token, vinculoId)');
  });
  test('el interruptor se lee con su nombre y el estado que se ve (en la etiqueta), y los colores salen del tema', () => {
    const pieza = readFileSync(join(__dirname, 'historia-anterior.tsx'), 'utf8');
    expect(pieza).toContain('accessibilityRole="switch"');
    expect(pieza).toContain('accessibilityState={{ checked:');
    expect(pieza).toContain('accessibilityLabel={etiquetaDelInterruptor(vista, estadoVisible)}');
    expect(pieza).toContain('accessibilityHint={vista.sugerencia}');
    expect(pieza).toContain('estilosPorTema');
    expect(pieza).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
  test('compartirla abre el texto entero, con dos respuestas del mismo peso, y «Actualizar» si algo cambió', () => {
    const pieza = readFileSync(join(__dirname, 'historia-anterior.tsx'), 'utf8');
    // En «Quién ve qué», el interruptor comparte por el diálogo, que muestra el texto partido en párrafos (nada plegado). La
    // tarjeta al aceptar se retiró con DL-176: al aceptar, la historia anterior va en la pantalla única de consentimiento.
    expect(pieza.match(/<DialogoParaCompartir/g)).toHaveLength(1);
    expect(pieza).toContain('partesDelTexto(texto.text)');
    // Tocar el interruptor no escribe: abre el diálogo. Solo el diálogo manda API-HIA-02.
    expect(pieza.match(/cambio\.enviar\(item, 'COMPARTIR'/g)).toHaveLength(1);
    expect(pieza).not.toMatch(/onPress=\{\(\) => void cambio\.enviar\(item, 'COMPARTIR'/);
    expect(pieza).toContain('<SalidasDelRechazo error={error} actualizar={actualizar} irAPrivacidad={irAPrivacidad} />');
    expect(pieza).not.toContain('HistoriaAnteriorAlAceptar');
  });
});

describe('TEST-HA-046 · compartida no es lo mismo que vista: el estado y el éxito dicen si hoy la ve', () => {
  test('sin el acceso de hoy a esa área (B2 revocado, sin el A3, cuenta suspendida), no dice «La ve»', () => {
    const sinAcceso = item({ authorization: DADA, accessInEffect: false });
    expect(estadoDeLaHistoria(sinAcceso, dia)).toBe('La compartís, pero mientras no tenga acceso a tus datos de Nutrición no la ve');
    expect(estadoDeLaHistoria(item({ authorization: DADA }), dia)).toBe('La ve desde el 3/11/2026');
    // En pausa manda la pausa; sin compartir, «No la ve» (con o sin acceso).
    expect(estadoDeLaHistoria(item({ authorization: DADA, relationshipState: 'PAUSADO', accessInEffect: false }), dia)).toBe(C.enPausa);
    expect(estadoDeLaHistoria(item({ accessInEffect: false }), dia)).toBe(C.noLaVe);
    expect(estadoDeLaHistoria(item({ relationshipState: 'FINALIZADO', authorization: DADA, accessInEffect: false }), dia)).toBe(C.terminado);
  });
  test('el aviso de éxito: «puede ver» solo con acceso; recién aceptado (sin el B2 todavía), que la va a poder ver', () => {
    expect(exitoAlCompartir(item({ authorization: DADA }))).toBe('Listo: Lic. Sofía Paz puede ver tu historia anterior.');
    expect(exitoAlCompartir(item({ authorization: DADA, accessInEffect: false }))).toBe('Listo: la compartiste. Lic. Sofía Paz la va a poder ver cuando tenga acceso a tus datos de Nutrición.');
  });
  test('TalkBack: la etiqueta lleva el estado que se ve, también mientras se envía', () => {
    const v = vistasDeLaHistoriaAnterior(mia([item({ authorization: DADA, relationshipState: 'PAUSADO' })]), dia, HOY, ZONA).get(item().relationshipId)!;
    expect(etiquetaDelInterruptor(v, v.estado)).toBe(`Compartir tu historia anterior de Nutrición con Lic. Sofía Paz. ${C.enPausa}`);
    expect(etiquetaDelInterruptor(v, C.retirando)).toBe('Compartir tu historia anterior de Nutrición con Lic. Sofía Paz. Dejando de compartir…');
  });
  test('el texto que se acepta, entero: el título y cada párrafo', () => {
    const { titulo, parrafos } = partesDelTexto(TEXTO_DE_LA_HISTORIA_ANTERIOR.texto);
    expect(titulo).toBe('Tu historia anterior, para tu profesional nuevo — versión propuesta 2026-11');
    expect([titulo, ...parrafos].join('\n\n')).toBe(TEXTO_DE_LA_HISTORIA_ANTERIOR.texto);
    expect(parrafos.length).toBeGreaterThan(4);
  });
});
