/**
 * La lógica pura del centro de novedades en la APK (`novedades-en-el-telefono.ts`; DL-133 y, desde la ronda 2.1 de los
 * formularios, DL-165 D-17 nueva): a qué pantalla lleva cada novedad, qué hace con una vista que no conoce (así trata la
 * 0.21 a la novedad nueva) y cuál se destaca como importante, con la palabra y no solo con el color.
 *
 * Uso: cd apps/mobile && npx jest src/novedades-en-el-telefono.test.ts --runInBand (después de construir @be/domain).
 */
import { describe, expect, test } from '@jest/globals';
import { COPY_NOVEDADES, NovedadSchema, textoDeNovedad, vistaDeNovedad, type Novedad } from '@be/domain';
import { etiquetaDeNovedad, insigniaDeImportancia, rutaDeNovedad } from './novedades-en-el-telefono';

/** Una novedad como la devuelve API-NOV-01, validada contra su esquema. */
function novedad(kind: string, view: string, extra: Partial<Novedad> = {}): Novedad {
  return NovedadSchema.parse({
    newsId: '99999999-9999-4999-8999-999999999999',
    kind,
    scope: 'NUTRICION',
    source: { identityId: '11111111-1111-4111-8111-111111111111', displayName: 'Lucía' },
    title: 'Un título',
    body: 'Un texto.',
    date: null,
    occurredAt: '2026-11-06T12:00:00.000Z',
    recordedAt: '2026-11-06T12:00:00.000Z',
    readAt: null,
    open: { view, referenceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    ...extra,
  });
}

describe('a qué pantalla lleva cada novedad', () => {
  test('las vistas que esta APK conoce, cada una a su pantalla', () => {
    expect(rutaDeNovedad(novedad('PLAN_ACTIVATED', 'NUTRITION'))).toEqual({ nombre: 'hoy' });
    expect(rutaDeNovedad(novedad('PLAN_ACTIVATED', 'TRAINING'))).toEqual({ nombre: 'entrenamiento' });
    expect(rutaDeNovedad(novedad('RELATIONSHIP_PAUSED', 'RELATIONSHIPS'))).toEqual({ nombre: 'vinculos' });
    expect(rutaDeNovedad(novedad('REVIEW_RECORDED', 'NUTRITION_REVIEW'))).toEqual({ nombre: 'revision', area: 'NUTRICION', id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
    expect(rutaDeNovedad(novedad('FORM_PROPOSAL_LOADED', 'FORMS'))).toEqual({ nombre: 'mis-solicitudes' });
  });

  test('ronda 2.1: el pedido de un profesional para ver los hábitos abre «Mis hábitos», donde se responde', () => {
    expect(vistaDeNovedad('HABITS_ACCESS_REQUESTED', 'NUTRICION', false)).toBe('MY_HABITS');
    expect(rutaDeNovedad(novedad('HABITS_ACCESS_REQUESTED', 'MY_HABITS'))).toEqual({ nombre: 'mis-habitos' });
  });

  test('una vista que no conoce (como `MY_HABITS` para la 0.21) no lleva a ningún lado: queda leída en el centro, con su texto', () => {
    expect(rutaDeNovedad(novedad('ALGO_NUEVO', 'UNA_VISTA_NUEVA'))).toBeNull();
    // Un tipo desconocido pasa el esquema (es texto) y se dibuja con el título y el texto que arma BE.
    expect(NovedadSchema.safeParse(novedad('ALGO_NUEVO', 'NEWS')).success).toBe(true);
    expect(rutaDeNovedad(novedad('ALGO_NUEVO', 'NEWS'))).toBeNull();
  });
});

describe('la novedad importante se destaca con la palabra, también para TalkBack', () => {
  test('el pedido para ver los hábitos lleva «Importante»; las demás, no', () => {
    expect(insigniaDeImportancia(novedad('HABITS_ACCESS_REQUESTED', 'MY_HABITS'))).toBe(COPY_NOVEDADES.importante);
    expect(COPY_NOVEDADES.importante).toBe('Importante');
    for (const kind of ['PLAN_ACTIVATED', 'FORM_PROPOSAL_LOADED', 'MEAL_LOG_REMINDER', 'ALGO_NUEVO']) expect(insigniaDeImportancia(novedad(kind, 'NEWS'))).toBeNull();
  });

  test('TalkBack lee si está sin leer, si es importante, el título, el texto y la fecha, en ese orden', () => {
    const texto = textoDeNovedad('HABITS_ACCESS_REQUESTED', { alcance: 'NUTRICION', fuente: 'Lucía' });
    const pedido = novedad('HABITS_ACCESS_REQUESTED', 'MY_HABITS', { title: texto.title, body: texto.body });
    expect(etiquetaDeNovedad(pedido, '6/11')).toBe(`${COPY_NOVEDADES.noLeida}. Importante. ${texto.title}. ${texto.body} 6/11`);
    expect(etiquetaDeNovedad({ ...pedido, readAt: '2026-11-06T13:00:00.000Z' }, '6/11')).toBe(`Importante. ${texto.title}. ${texto.body} 6/11`);
    expect(etiquetaDeNovedad(novedad('PLAN_ACTIVATED', 'NUTRITION'), '6/11')).toBe(`${COPY_NOVEDADES.noLeida}. Un título. Un texto. 6/11`);
  });

  test('el texto del pedido dice quién pide, desde qué área, para qué le sirve y que es su decisión; nunca un hábito', () => {
    const { title, body } = textoDeNovedad('HABITS_ACCESS_REQUESTED', { alcance: 'ENTRENAMIENTO', fuente: 'Marcos' });
    expect(title).toBe('Te piden ver tus hábitos');
    expect(body).toMatch(/^Marcos, de Entrenamiento, te pide ver tus hábitos\./);
    expect(body).toMatch(/Es tu decisión/);
    expect(body).not.toMatch(/recomendad|deberías|tenés que/i);
  });
});
