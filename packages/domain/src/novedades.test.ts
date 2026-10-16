/**
 * WP-NOVEDADES-Y-AVISOS (DL-133): los textos del centro y del aviso push, las franjas de los recordatorios y la forma del
 * contrato. El aviso nunca dice qué pasó ni quién (UC-E08 §13.8.6); la novedad dice qué pasó y quién, sin contenido.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DatosDelAvisoPushSchema,
  franjaDeLaHora,
  ListaDeNovedadesResponseSchema,
  RegistrarSuscripcionPushRequestSchema,
  terminosProhibidosDeEntrenamientoEn,
  textoDeNovedad,
  textoDelAvisoPush,
  TIPOS_DE_NOVEDAD,
  vistaDeNovedad,
} from './index';

test('el aviso push solo dice cuántas cosas hay para ver, y si son recordatorios', () => {
  assert.equal(textoDelAvisoPush(['PLAN_ACTIVATED']), 'Tenés una novedad.');
  assert.equal(textoDelAvisoPush(['MEAL_LOG_REMINDER']), 'Tenés un recordatorio para hoy.');
  assert.equal(textoDelAvisoPush(['MEAL_LOG_REMINDER', 'TRAINING_LOG_REMINDER']), 'Tenés 2 recordatorios para hoy.');
  assert.equal(textoDelAvisoPush(['PLAN_ACTIVATED', 'MEAL_LOG_REMINDER', 'REVIEW_RECORDED']), 'Tenés 3 novedades.');
  // Ningún tipo pone en el aviso el área, el nombre o el contenido.
  for (const tipo of TIPOS_DE_NOVEDAD) assert.doesNotMatch(textoDelAvisoPush([tipo]), /Nutrici|Entrenam|Antropom|comida|plan|revisi|Diego/i);
});

test('cada tipo tiene su texto y su pantalla; el texto nombra a quien la originó y nunca lleva números', () => {
  for (const tipo of TIPOS_DE_NOVEDAD) {
    const t = textoDeNovedad(tipo, { alcance: 'NUTRICION', fuente: 'Lic. Sofía Paz' });
    assert.ok(t.title.length > 0 && t.body.length > 0, tipo);
    // Sin mediciones, energía ni fechas en el texto: el contenido vive en la pantalla que lo autoriza.
    assert.doesNotMatch(`${t.title} ${t.body}`, /\d/, tipo);
    assert.ok(vistaDeNovedad(tipo, 'NUTRICION', false).length > 0, tipo);
  }
  assert.equal(textoDeNovedad('PLAN_ACTIVATED', { alcance: 'ENTRENAMIENTO', fuente: 'Prof. Martín Acosta' }).body, 'Prof. Martín Acosta activó una versión nueva de tu plan de Entrenamiento.');
  // El rechazo no nombra a la persona: sin vínculo, el profesional no ve su nombre (DL-040).
  assert.doesNotMatch(textoDeNovedad('RELATIONSHIP_REQUEST_REJECTED', { alcance: 'NUTRICION', fuente: 'Diego Sosa' }).body, /Diego/);
  assert.equal(vistaDeNovedad('PLAN_ACTIVATED', 'ENTRENAMIENTO', false), 'TRAINING');
  assert.equal(vistaDeNovedad('REVIEW_RECORDED', 'NUTRICION', false), 'NUTRITION_REVIEW');
  assert.equal(vistaDeNovedad('REVIEW_RECORDED', 'ENTRENAMIENTO', false), 'TRAINING_REVIEW');
  assert.equal(vistaDeNovedad('RELATIONSHIP_REQUEST_ACCEPTED', 'NUTRICION', true), 'ADVISEE');
  assert.equal(vistaDeNovedad('RELATIONSHIP_REQUEST_ACCEPTED', 'NUTRICION', false), 'RELATIONSHIPS');
  // El profesional que lee una solicitud va a su espacio; con vínculo, a la ficha de la persona.
  assert.equal(vistaDeNovedad('RELATIONSHIP_REQUEST_RECEIVED', 'NUTRICION', true), 'PRO_HOME');
  assert.equal(vistaDeNovedad('RELATIONSHIP_PAUSED', 'NUTRICION', true), 'ADVISEE');
  assert.equal(vistaDeNovedad('RELATIONSHIP_PAUSED', 'NUTRICION', false), 'RELATIONSHIPS');
});

test('DL-137: los avisos de la agenda dicen qué sesión toca o de qué día quedó, sin juzgar', () => {
  const pendiente = (fecha: string | null) => textoDeNovedad('TRAINING_SESSION_PENDING_REMINDER', { alcance: 'ENTRENAMIENTO', fuente: null, fecha }).body;
  // El miércoles 21 de octubre de 2026: el día sale del calendario, sin la zona.
  assert.equal(pendiente('2026-10-21'), 'Te quedó pendiente una sesión del miércoles. Podés hacerla hoy o saltearla, desde Entrenamiento.');
  assert.match(pendiente('2026-10-25'), /del domingo\./);
  assert.match(pendiente(null), /de un día anterior\./);
  for (const tipo of ['TRAINING_LOG_REMINDER', 'TRAINING_SESSION_TODAY_REMINDER', 'TRAINING_SESSION_PENDING_REMINDER'] as const) {
    const t = textoDeNovedad(tipo, { alcance: 'ENTRENAMIENTO', fuente: null, fecha: '2026-10-21' });
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(`${t.title} ${t.body}`), [], tipo);
    assert.equal(vistaDeNovedad(tipo, 'ENTRENAMIENTO', false), 'TRAINING', tipo);
  }
  assert.equal(textoDelAvisoPush(['TRAINING_SESSION_TODAY_REMINDER', 'TRAINING_SESSION_PENDING_REMINDER']), 'Tenés 2 recordatorios para hoy.');
});

test('las franjas: la tarde de 14 a 18 y la noche de 21 a 23; fuera de eso, ninguna', () => {
  assert.equal(franjaDeLaHora(15), 'AFTERNOON');
  assert.equal(franjaDeLaHora(22), 'NIGHT');
  assert.equal(franjaDeLaHora(23), 'NIGHT');
  // DL-137: la mañana (10:00) es la del entrenamiento.
  for (const h of [9, 10, 12]) assert.equal(franjaDeLaHora(h), 'MORNING', String(h));
  for (const h of [0, 3, 8, 13, 19, 20]) assert.equal(franjaDeLaHora(h), null, String(h));
});

test('el contrato: el token con la forma de Expo, el aviso sin contenido y un tipo desconocido que no rompe la lista', () => {
  assert.ok(RegistrarSuscripcionPushRequestSchema.safeParse({ expoPushToken: 'ExponentPushToken[abcdefgh12]', platform: 'ANDROID' }).success);
  assert.ok(!RegistrarSuscripcionPushRequestSchema.safeParse({ expoPushToken: 'fcm:abc', platform: 'ANDROID' }).success);
  assert.ok(!RegistrarSuscripcionPushRequestSchema.safeParse({ expoPushToken: 'ExponentPushToken[abcdefgh12]', platform: 'IOS' }).success);
  assert.ok(!DatosDelAvisoPushSchema.safeParse({ type: 'NEW_INTERNAL_UPDATE', referenceId: 'n1', weight: 80 }).success);
  // Un cliente viejo que recibe un tipo nuevo sigue leyendo la lista (no es una enumeración estricta).
  const lista = {
    data: [
      {
        newsId: 'n1',
        kind: 'UN_TIPO_FUTURO',
        scope: null,
        source: null,
        title: 'Algo nuevo',
        body: 'Un texto.',
        date: null,
        occurredAt: null,
        recordedAt: '2026-10-16T12:00:00.000Z',
        readAt: null,
        open: { view: 'UNA_VISTA_FUTURA', referenceId: null },
      },
    ],
    page: { limit: 20, nextCursor: null, hasMore: false },
    unreadCount: 1,
  };
  assert.ok(ListaDeNovedadesResponseSchema.safeParse(lista).success);
});
