/**
 * DL-191 (WP-RECETARIO-E-IMAGENES) · lo del dominio: las parecidas, cuándo se puede proponer, la cesión de la foto, las
 * medidas al achicar antes de subir, los límites de las variantes, los contratos y el vocabulario de las pantallas.
 * TEST-REC-030 a 036.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terminosProhibidosEn } from './copy-nutricion';
import { LIMITES_DE_MEDIO, MedioSchema, medidasAlAchicar, VarianteDeMedioSchema } from './contratos-medios';
import { RecetaSchema } from './contratos-recetas';
import { CESION_DE_LA_FOTO, DecidirPropuestaRequestSchema, ProponerAlRecetarioRequestSchema } from './contratos-recetario';
import { COPY_RECETARIO, motivoParaNoProponer, palabrasDeLaReceta, parecidoDeNombres, recetasParecidas } from './recetario';

test('TEST-REC-030 · las parecidas: palabras en común sobre el nombre más corto, sin tildes, mayúsculas ni plurales simples', () => {
  assert.deepEqual(palabrasDeLaReceta('Tartas de Pollo y Puerros'), ['tarta', 'pollo', 'puerro']);
  assert.equal(parecidoDeNombres('Tarta de pollo', 'Tarta de pollo y puerro'), 1);
  assert.equal(parecidoDeNombres('Milanesa de pollo', 'Tarta de pollo'), 0.5);
  assert.equal(parecidoDeNombres('Guiso de lentejas', 'Lentejas guisadas'), 0.5);
  assert.equal(parecidoDeNombres('', 'Tarta'), 0);
  const candidatas = [{ name: 'Tarta de pollo y puerro' }, { name: 'Milanesa de pollo' }, { name: 'TARTA DE POLLO' }, { name: 'Ensalada' }];
  assert.deepEqual(
    recetasParecidas('Tarta de pollo', candidatas).map((c) => c.name),
    ['TARTA DE POLLO', 'Tarta de pollo y puerro'],
  );
  assert.equal(recetasParecidas('Tarta de pollo', candidatas, 1).length, 1);
});

test('TEST-REC-031 · se propone una receta propia: no la que espera, no la versión que ya está; sí una rechazada', () => {
  assert.equal(motivoParaNoProponer({ origin: 'BE_RECIPE_BOOK', versionNumber: 1, proposal: null }), 'DEL_RECETARIO');
  assert.equal(motivoParaNoProponer({ origin: 'OWN', versionNumber: 1, proposal: null }), null);
  assert.equal(motivoParaNoProponer({ origin: 'OWN', versionNumber: 2, proposal: { status: 'PENDING', versionNumber: 1 } }), 'ESPERANDO');
  assert.equal(motivoParaNoProponer({ origin: 'OWN', versionNumber: 2, proposal: { status: 'ADDED', versionNumber: 2 } }), 'YA_SUMADA');
  assert.equal(motivoParaNoProponer({ origin: 'OWN', versionNumber: 3, proposal: { status: 'ADDED', versionNumber: 2 } }), null);
  assert.equal(motivoParaNoProponer({ origin: 'OWN', versionNumber: 2, proposal: { status: 'REJECTED', versionNumber: 2 } }), null);
});

test('TEST-REC-032 · la cesión de la foto es un texto versionado que dice qué se cede, a quién, hasta cuándo y qué declara quien propone', () => {
  assert.match(CESION_DE_LA_FOTO.version, /^REC-CESION-FOTO-\d+$/);
  for (const parte of ['sin cargo', 'sin exclusividad', 'profesionales de Nutrición', 'mientras la receta esté en el recetario', 'es tuya o que tenés permiso', 'no muestra a ninguna persona', 'sigue siendo solo tuya']) {
    assert.ok(CESION_DE_LA_FOTO.texto.includes(parte), parte);
  }
  // Se acepta solo con la casilla marcada y la versión del texto.
  assert.equal(ProponerAlRecetarioRequestSchema.safeParse({ expectedVersion: 'v1', photoAssignment: { textVersion: CESION_DE_LA_FOTO.version, accepted: true } }).success, true);
  assert.equal(ProponerAlRecetarioRequestSchema.safeParse({ expectedVersion: 'v1', photoAssignment: { textVersion: CESION_DE_LA_FOTO.version, accepted: false } }).success, false);
  assert.equal(ProponerAlRecetarioRequestSchema.safeParse({ expectedVersion: 'v1', photoAssignment: null }).success, true);
  assert.equal(ProponerAlRecetarioRequestSchema.safeParse({ expectedVersion: 'v1' }).success, false);
  assert.equal(DecidirPropuestaRequestSchema.safeParse({ decision: 'REJECT', reason: 'Ya hay una parecida' }).success, true);
  assert.equal(DecidirPropuestaRequestSchema.safeParse({ decision: 'ADD', extra: 1 }).success, false);
});

test('TEST-REC-033 · achicar antes de subir: el lado mayor a 1600 px, sin agrandar ni cambiar la proporción', () => {
  assert.deepEqual(medidasAlAchicar(4032, 3024), { ancho: 1600, alto: 1200, achicar: true });
  assert.deepEqual(medidasAlAchicar(3024, 4032), { ancho: 1200, alto: 1600, achicar: true });
  assert.deepEqual(medidasAlAchicar(1254, 1254), { ancho: 1254, alto: 1254, achicar: false });
  assert.deepEqual(medidasAlAchicar(8000, 10, 1600), { ancho: 1600, alto: 2, achicar: true });
  assert.deepEqual(medidasAlAchicar(2000, 1000, 400), { ancho: 400, alto: 200, achicar: true });
  assert.throws(() => medidasAlAchicar(0, 100));
});

test('TEST-REC-034 · las variantes: 1200 y 400 px en WebP de calidad 78 a 80; la ruta del recetario, de 6 a 7 horas', () => {
  assert.equal(LIMITES_DE_MEDIO.ladoDeLaGrande, 1200);
  assert.equal(LIMITES_DE_MEDIO.ladoDeLaMiniatura, 400);
  assert.ok(LIMITES_DE_MEDIO.calidadWebp >= 78 && LIMITES_DE_MEDIO.calidadWebp <= 80);
  assert.ok(LIMITES_DE_MEDIO.ladoAlAchicarEnElCliente >= LIMITES_DE_MEDIO.ladoDeLaGrande, 'el cliente no achica por debajo de la grande');
  assert.equal(LIMITES_DE_MEDIO.vigenciaDeLecturaSegundos, 900, 'lo privado sigue en 15 minutos (08 §21)');
  assert.equal(LIMITES_DE_MEDIO.vigenciaDeLecturaDelRecetarioSegundos + LIMITES_DE_MEDIO.redondeoDeLecturaDelRecetarioSegundos, 7 * 3600);
  assert.deepEqual(VarianteDeMedioSchema.options, ['thumbnail', 'large']);
  // Lo guardado puede ser JPEG (lo de antes, la foto de una comida) o WebP (la imagen de una receta).
  const medio = { mediaId: '00000000-0000-4000-8000-000000000001', purpose: 'RECIPE_REFERENCE', status: 'AVAILABLE', byteSize: 1, width: 1, height: 1, provenance: 'AI_GENERATED', authorship: null, createdAt: '2026-11-22T00:00:00.000Z' };
  assert.equal(MedioSchema.safeParse({ ...medio, contentType: 'image/webp' }).success, true);
  assert.equal(MedioSchema.safeParse({ ...medio, contentType: 'image/jpeg' }).success, true);
  assert.equal(MedioSchema.safeParse({ ...medio, contentType: 'image/png' }).success, false);
});

test('TEST-REC-035 · una receta dice si es propia o del Recetario de BE; el contrato es estricto', () => {
  const forma = RecetaSchema.shape;
  assert.deepEqual(forma.origin.options, ['OWN', 'BE_RECIPE_BOOK']);
  assert.ok('copiedFrom' in forma && 'proposal' in forma);
});

test('TEST-REC-036 · el copy del recetario no usa términos prohibidos ni las palabras que BE no dice', () => {
  const textos: string[] = [];
  const juntar = (v: unknown): void => {
    if (typeof v === 'string') textos.push(v);
    else if (typeof v === 'function') textos.push(String((v as (...a: unknown[]) => unknown)('Nombre', 'Otro')));
    else if (v && typeof v === 'object') Object.values(v).forEach(juntar);
  };
  juntar(COPY_RECETARIO);
  juntar(CESION_DE_LA_FOTO);
  const hallazgos = textos.flatMap((t) => terminosProhibidosEn(t).map((p) => `${p} en «${t}»`));
  assert.deepEqual(hallazgos, []);
  for (const t of textos) assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|estaci[oó]n/i, t);
  // Lo que no se cargó se dice «Sin indicar».
  assert.equal(COPY_RECETARIO.motivo(null), 'Motivo: Sin indicar');
});
