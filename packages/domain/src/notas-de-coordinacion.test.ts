/**
 * WP-NOTAS-DE-COORDINACION (DL-140): el contrato de API-CRD-01 y sus dos variantes, los textos (sin juicios ni puntajes, con
 * los cuatro límites y los dos avisos aprobados), la novedad del destinatario y el lugar de la nota en la línea de tiempo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { terminosProhibidosDeFormulariosEn } from './copy-formularios';
import { terminosProhibidosEn } from './copy-nutricion';
import { terminosProhibidosDeCarteraEn } from './cartera';
import { TIPOS_DE_EVENTO } from './contratos-analisis';
import { esRecordatorio, textoDelAvisoPush, textoDeNovedad, vistaDeNovedad } from './copy-novedades';
import { TIPOS_DE_NOVEDAD } from './contratos-novedades';
import {
  ALCANCE_DE_LA_REFERENCIA,
  CrearNotaDeCoordinacionRequestSchema,
  DestinatariosPosiblesResponseSchema,
  FINALIDADES_DE_NOTA,
  MAXIMO_DE_CARACTERES_DE_LA_NOTA,
  MAXIMO_DE_REFERENCIAS_DE_LA_NOTA,
  NotaDeCoordinacionSchema,
  referenciasDelArea,
  TIPOS_DE_REFERENCIA_DE_NOTA,
} from './contratos-notas-de-coordinacion';
import {
  COPY_NOTAS_DE_COORDINACION,
  ETIQUETA_DE_FINALIDAD_DE_NOTA,
  LIMITES_DE_LA_NOTA,
  nombresEnUnaFrase,
  paraQuienEs,
  rotuloDeReferencia,
  tituloDeLaNota,
} from './copy-notas-de-coordinacion';
import { TIPOS_DE_HITO, TIPOS_DE_HITO_DE_PLANIFICACION } from './dia-de-la-linea';
import { DOMINIO_DE_TIPO_DE_EVENTO, NOMBRE_DE_TIPO_DE_EVENTO } from './linea-de-tiempo';
import { erroresDeclarados, OPERACIONES } from './openapi';

const ID = '7f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const OTRO = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d';
const cuerpo = (cambios: Record<string, unknown> = {}) => ({
  originScope: 'NUTRICION',
  purpose: 'CONTEXT_FOR_YOUR_AREA',
  recipients: { mode: 'ALL' },
  text: 'Desde esta semana come más tarde: la sesión de la mañana queda en ayunas.',
  ...cambios,
});
const valido = (c: Record<string, unknown>) => CrearNotaDeCoordinacionRequestSchema.safeParse(c).success;

/** Todo el texto que BE escribe sobre una nota: las etiquetas, los límites, los avisos y las pantallas. */
function todoElCopy(): string[] {
  const textos: string[] = [...Object.values(ETIQUETA_DE_FINALIDAD_DE_NOTA), ...LIMITES_DE_LA_NOTA];
  for (const v of Object.values(COPY_NOTAS_DE_COORDINACION)) {
    if (typeof v === 'string') textos.push(v);
    else textos.push((v as (...a: unknown[]) => string)('Diego Sosa', 'Lic. Sofía Paz'));
  }
  for (const f of FINALIDADES_DE_NOTA) textos.push(tituloDeLaNota(f));
  for (const t of TIPOS_DE_REFERENCIA_DE_NOTA) textos.push(rotuloDeReferencia(t, { fecha: '2026-10-10', version: 3 }));
  textos.push(paraQuienEs('ALL', ['Lic. Sofía Paz', 'Prof. Martín Acosta']));
  return textos;
}

test('el copy de las notas pasa las listas de términos prohibidos de los tres dominios, de la cartera y de Información', () => {
  for (const texto of todoElCopy()) {
    for (const lista of [terminosProhibidosEn, terminosProhibidosDeEntrenamientoEn, terminosProhibidosDeAntropometriaEn, terminosProhibidosDeFormulariosEn, terminosProhibidosDeCarteraEn]) {
      assert.deepEqual(lista(texto), [], texto);
    }
  }
});

test('UC-E07, paso 6: los cuatro límites, y los dos avisos aprobados (CRD-D2 y CRD-D3)', () => {
  assert.equal(LIMITES_DE_LA_NOTA.length, 4);
  const limites = LIMITES_DE_LA_NOTA.join(' ');
  for (const verbo of [/No prescribe/, /No modifica/, /No decide sobre otra área/, /No transfiere responsabilidad/]) assert.match(limites, verbo);
  assert.equal(COPY_NOTAS_DE_COORDINACION.laPersonaLaLee, 'La persona también la lee, en su app.');
  assert.equal(COPY_NOTAS_DE_COORDINACION.soloLoNecesario, 'Escribí solo lo que el otro profesional necesita para su trabajo.');
  // CRD-D4: tres finalidades, con las palabras de la propuesta.
  assert.deepEqual(Object.values(ETIQUETA_DE_FINALIDAD_DE_NOTA), ['Contexto para tu área', 'Cambio en mi área que conviene que sepas', 'Pedido de coordinación']);
});

test('API-CRD-01: el texto va de 1 a 600 caracteres, recortado en sus bordes; la finalidad es de la lista cerrada', () => {
  assert.ok(valido(cuerpo()));
  const recortado = CrearNotaDeCoordinacionRequestSchema.parse(cuerpo({ text: '  Línea uno.\nLínea dos.  ' }));
  assert.equal(recortado.text, 'Línea uno.\nLínea dos.');
  assert.ok(valido(cuerpo({ text: 'a'.repeat(MAXIMO_DE_CARACTERES_DE_LA_NOTA) })));
  assert.ok(!valido(cuerpo({ text: 'a'.repeat(MAXIMO_DE_CARACTERES_DE_LA_NOTA + 1) })));
  assert.ok(!valido(cuerpo({ text: '   ' })));
  assert.ok(!valido(cuerpo({ purpose: 'PRESCRIPTION' })), 'no hay una finalidad «prescribir»');
  assert.ok(!valido(cuerpo({ originScope: 'MEDICINA' })));
  // Sin adjuntos ni campos de más (CRD-D3): un campo que no está en el contrato es 400.
  assert.ok(!valido(cuerpo({ attachments: [] })));
  assert.ok(!valido(cuerpo({ planChanges: { kcal: 1800 } })));
});

test('API-CRD-01: destinatarios «todos» o uno, por su identificador', () => {
  assert.ok(valido(cuerpo({ recipients: { mode: 'ONE', identityId: ID } })));
  assert.ok(!valido(cuerpo({ recipients: { mode: 'ONE' } })));
  assert.ok(!valido(cuerpo({ recipients: { mode: 'ONE', identityId: 'Lic. Sofía Paz' } })), 'no se elige por nombre');
  assert.ok(!valido(cuerpo({ recipients: { mode: 'ALL', identityId: ID } })));
  assert.ok(!valido(cuerpo({ recipients: { mode: 'SCOPE', scope: 'NUTRICION' } })), 'no hay destinatario por alcance (CRD-D1, opción C descartada)');
});

test('API-CRD-01: hasta tres referencias, sin repetir; una corrección cita una nota por su identificador', () => {
  const ref = (id: string, type = 'NUTRITION_REVIEW') => ({ type, id });
  assert.ok(valido(cuerpo({ references: [ref(ID), ref(OTRO), ref(ID, 'NUTRITION_PLAN_VERSION')] })));
  assert.ok(!valido(cuerpo({ references: [ref(ID), ref(OTRO), ref(ID, 'NUTRITION_PLAN_VERSION'), ref(OTRO, 'NUTRITION_PLAN_VERSION')] })));
  assert.equal(MAXIMO_DE_REFERENCIAS_DE_LA_NOTA, 3);
  assert.ok(!valido(cuerpo({ references: [ref(ID), ref(ID.toUpperCase())] })), 'la misma referencia dos veces');
  assert.ok(!valido(cuerpo({ references: [ref('no-es-un-id')] })));
  assert.ok(!valido(cuerpo({ references: [{ type: 'MEAL_RECORD', id: ID }] })), 'una comida de la persona no es un recurso del autor');
  assert.ok(valido(cuerpo({ correctsNoteId: ID })));
  assert.ok(!valido(cuerpo({ correctsNoteId: 'la de ayer' })));
});

test('CRD-D5: cada tipo de referencia es de un área, y desde un área se cita solo lo suyo', () => {
  assert.deepEqual(referenciasDelArea('NUTRICION'), ['NUTRITION_PLAN_VERSION', 'NUTRITION_REVIEW']);
  assert.deepEqual(referenciasDelArea('ENTRENAMIENTO'), ['TRAINING_PLAN_VERSION', 'TRAINING_REVIEW']);
  assert.deepEqual(referenciasDelArea('ANTROPOMETRIA'), ['ANTHROPOMETRIC_EVALUATION']);
  assert.equal(Object.keys(ALCANCE_DE_LA_REFERENCIA).length, TIPOS_DE_REFERENCIA_DE_NOTA.length);
  assert.equal(rotuloDeReferencia('NUTRITION_PLAN_VERSION', { fecha: '2026-10-10', version: 3 }), 'Plan de Nutrición, versión 3, activada el 10/10/2026');
  assert.equal(rotuloDeReferencia('TRAINING_REVIEW', { fecha: '2026-10-02' }), 'Revisión de Entrenamiento del 2/10/2026');
  assert.equal(rotuloDeReferencia('ANTHROPOMETRIC_EVALUATION', { fecha: '2026-09-28' }), 'Toma antropométrica del 28/9/2026');
  // Sin fecha conocida, se nombra igual: nunca con una fecha inventada.
  assert.equal(rotuloDeReferencia('TRAINING_REVIEW', { fecha: null }), 'Revisión de Entrenamiento');
  assert.equal(rotuloDeReferencia('NUTRITION_PLAN_VERSION', { fecha: null, version: 2 }), 'Plan de Nutrición, versión 2');
  assert.equal(rotuloDeReferencia('TRAINING_PLAN_VERSION', { fecha: '2026-10-01' }), 'Plan de Entrenamiento, activado el 1/10/2026');
});

test('a quién va: un nombre, o todos los que la acompañaban, con sus nombres', () => {
  assert.equal(nombresEnUnaFrase(['A']), 'A');
  assert.equal(nombresEnUnaFrase(['A', 'B']), 'A y B');
  assert.equal(nombresEnUnaFrase(['A', 'B', 'C']), 'A, B y C');
  assert.equal(paraQuienEs('ONE', ['Lic. Sofía Paz']), 'Lic. Sofía Paz');
  assert.equal(paraQuienEs('ALL', ['Lic. Sofía Paz', 'Prof. Martín Acosta']), 'Todos los profesionales que la acompañan: Lic. Sofía Paz y Prof. Martín Acosta');
  assert.equal(tituloDeLaNota('COORDINATION_REQUEST'), 'Nota de coordinación · Pedido de coordinación');
});

test('la lectura: la forma es estricta, con al menos un destinatario, y nunca más de 600 caracteres', () => {
  const nota = {
    noteId: ID,
    adviseeId: OTRO,
    author: { identityId: ID, displayName: 'Lic. Sofía Paz' },
    originScope: { code: 'NUTRICION', label: 'Nutrición' },
    purpose: 'CHANGE_IN_MY_AREA',
    recipients: { mode: 'ONE', people: [{ identityId: OTRO, displayName: 'Prof. Martín Acosta' }] },
    text: 'Bajamos la cena: si entrena a la noche, conviene saberlo.',
    references: [{ type: 'NUTRITION_PLAN_VERSION', id: ID, label: 'Plan de Nutrición, versión 3, activada el 10/10/2026' }],
    corrects: null,
    correctedBy: [],
    recordedAt: '2026-10-16T13:00:00.000Z',
  };
  assert.ok(NotaDeCoordinacionSchema.safeParse(nota).success);
  assert.ok(!NotaDeCoordinacionSchema.safeParse({ ...nota, recipients: { mode: 'ALL', people: [] } }).success);
  assert.ok(!NotaDeCoordinacionSchema.safeParse({ ...nota, summary: 'resumen automático' }).success, 'sin resúmenes automáticos (08 §11-bis.3)');
  assert.ok(!NotaDeCoordinacionSchema.safeParse({ ...nota, text: 'a'.repeat(601) }).success);
  assert.ok(DestinatariosPosiblesResponseSchema.safeParse({ data: { origins: [{ code: 'NUTRICION', label: 'Nutrición' }], recipients: [] } }).success);
});

test('CRD-D6: la novedad del destinatario dice quién y sobre quién, nunca el texto; el aviso push sigue genérico', () => {
  assert.ok(TIPOS_DE_NOVEDAD.includes('COORDINATION_NOTE_RECEIVED'));
  const t = textoDeNovedad('COORDINATION_NOTE_RECEIVED', { alcance: 'NUTRICION', fuente: 'Lic. Sofía Paz', sujeto: 'Diego Sosa' });
  assert.deepEqual(t, { title: 'Nota de coordinación', body: 'Lic. Sofía Paz dejó una nota de coordinación sobre Diego Sosa.' });
  // Sin el nombre de la persona (sin vínculo vigente, DL-040), no se inventa uno.
  assert.match(textoDeNovedad('COORDINATION_NOTE_RECEIVED', { alcance: 'NUTRICION', fuente: 'Lic. Sofía Paz' }).body, /sobre una persona que acompañás\.$/);
  assert.equal(vistaDeNovedad('COORDINATION_NOTE_RECEIVED', 'NUTRICION', false), 'ADVISEE');
  assert.equal(esRecordatorio('COORDINATION_NOTE_RECEIVED'), false);
  assert.equal(textoDelAvisoPush(['COORDINATION_NOTE_RECEIVED']), 'Tenés una novedad.');
});

test('UC-E07, postcondición 9: la nota es un hito de la línea de tiempo, pero no de planificación', () => {
  assert.ok(TIPOS_DE_EVENTO.includes('COORDINATION_NOTE_RECORDED'));
  assert.ok(TIPOS_DE_HITO.includes('COORDINATION_NOTE_RECORDED'));
  assert.ok(!TIPOS_DE_HITO_DE_PLANIFICACION.includes('COORDINATION_NOTE_RECORDED'), 'no cambia lo que se le indica a nadie');
  assert.equal(NOMBRE_DE_TIPO_DE_EVENTO.COORDINATION_NOTE_RECORDED, 'Nota de coordinación');
  assert.equal(DOMINIO_DE_TIPO_DE_EVENTO.COORDINATION_NOTE_RECORDED, null);
});

test('el contrato: API-CRD-01 es la del 09, idempotente; las dos variantes son lecturas protegidas', () => {
  const op = (id: string) => OPERACIONES.find((o) => o.id === id);
  const crear = op('API-CRD-01');
  assert.deepEqual([crear?.metodo, crear?.ruta, crear?.idempotencia], ['post', '/advisees/{adviseeId}/coordination-notes', true]);
  assert.deepEqual(erroresDeclarados('API-CRD-01')['422'], ['COORDINATION_RECIPIENT_NOT_AVAILABLE', 'COORDINATION_REFERENCE_INVALID']);
  assert.deepEqual(erroresDeclarados('API-CRD-01')['404'], ['RESOURCE_NOT_FOUND']);
  const lista = op('API-CRD-01-LISTA');
  assert.deepEqual([lista?.metodo, lista?.ruta], ['get', '/advisees/{adviseeId}/coordination-notes/recipients']);
  assert.ok(erroresDeclarados('API-CRD-01-LISTA')['429']?.includes('RATE_LIMITED'));
  const propia = op('API-CRD-01-PROPIA');
  assert.deepEqual([propia?.metodo, propia?.ruta], ['get', '/me/coordination-notes']);
  assert.deepEqual(erroresDeclarados('API-CRD-01-PROPIA')['403'], ['ACTION_FORBIDDEN']);
  // No hay un GET del profesional para leer notas: la lectura es la línea de tiempo (09 §11.6).
  assert.equal(OPERACIONES.filter((o) => o.ruta.startsWith('/advisees/{adviseeId}/coordination-notes') && o.metodo === 'get').map((o) => o.ruta).join(), '/advisees/{adviseeId}/coordination-notes/recipients');
});
