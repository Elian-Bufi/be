/**
 * La herramienta de fotos de las recetas (EVIDENCIA/RECETAS-AMPLIACION/herramientas/fotos.mjs, encargo nocturno del
 * 2026-10-28, §11), con imágenes sintéticas hechas acá, en una carpeta temporal: figuras de colores, no fotos de recetas.
 * Nunca se escriben en una carpeta de entrega ni en el repositorio.
 * - el nombre del original dice la receta (R017-…, y las 16 originales también como 01-…);
 * - la entrega mide 1600 × 1200, en JPEG, con el recorte y el reescalado escritos; un agrandado se dice como tal;
 * - el original no se toca; un archivo que no es de ninguna receta se informa y no se usa;
 * - un duplicado exacto y una foto casi igual se detectan; las hojas de revisión salen en los dos temas;
 * - «registrar» se niega si la entrega cambió después de prepararla.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { problemasDeLaFoto } from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs';
import { codigoDelArchivo, distancia, huellaPerceptual, planDeDerivacion, preparar, recorteA4x3, registrar, UMBRAL_DE_PARECIDO } from '../EVIDENCIA/RECETAS-AMPLIACION/herramientas/fotos.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex');
/** Una figura sintética: un fondo y un círculo en un lugar propio, para que cada imagen tenga su estructura. */
const figura = (ancho, alto, { fondo, x, y, color, alfa = false }) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect width="100%" height="100%" fill="${fondo}" fill-opacity="${alfa ? 0.6 : 1}"/><circle cx="${x * ancho}" cy="${y * alto}" r="${Math.min(ancho, alto) / 4}" fill="${color}"/><rect x="${ancho * 0.1}" y="${alto * 0.7}" width="${ancho * 0.3}" height="${alto * 0.15}" fill="#333"/></svg>`,
    ),
  );

test('el nombre del original dice la receta: R017-…, y las 16 originales también como 01-…', () => {
  assert.equal(codigoDelArchivo('R017-tarta-de-pollo-y-puerro.png'), 'R017');
  assert.equal(codigoDelArchivo('r066-tarta.webp'), 'R066');
  assert.equal(codigoDelArchivo('01-avena-cocida-con-banana-y-canela.jpg'), 'R001');
  assert.equal(codigoDelArchivo('17-tarta.jpg'), null);
  assert.equal(codigoDelArchivo('R017-tarta.gif'), null);
  assert.equal(codigoDelArchivo('notas.txt'), null);
});

test('el recorte a 4:3 va al centro, y el plan dice cada transformación (un agrandado, como tal)', () => {
  assert.equal(recorteA4x3(1600, 1200), null);
  assert.deepEqual(recorteA4x3(1536, 1024), { left: 85, top: 0, width: 1365, height: 1024 });
  assert.deepEqual(recorteA4x3(1024, 1024), { left: 0, top: 128, width: 1024, height: 768 });
  assert.deepEqual(recorteA4x3(1200, 1600), { left: 0, top: 350, width: 1200, height: 900 });
  const de3x2 = planDeDerivacion({ ancho: 1536, alto: 1024, conAlfa: true, formato: 'png' });
  assert.equal(de3x2.agrandado, true);
  assert.deepEqual(de3x2.transformaciones, [
    'recorte al centro de 1536 × 1024 a 1365 × 1024 (4:3)',
    'reescalado ×1,172 a 1600 × 1200 (Lanczos): el detalle no es nativo',
    'transparencia aplanada sobre blanco, como hace BE',
    'codificado en JPEG de calidad 90, sin metadatos',
  ]);
  assert.deepEqual(planDeDerivacion({ ancho: 1600, alto: 1200, conAlfa: false, formato: 'jpeg' }).transformaciones, ['recodificado en JPEG de calidad 90, sin metadatos']);
  const grande = planDeDerivacion({ ancho: 2048, alto: 1536, conAlfa: false, formato: 'png' });
  assert.equal(grande.agrandado, false);
  assert.match(grande.transformaciones[0], /^reducido ×0,781/);
});

test('«preparar» deja las entregas de 1600 × 1200, no toca los originales, informa lo ajeno y encuentra duplicados y parecidas', async () => {
  const carpeta = mkdtempSync(join(tmpdir(), 'be-fotos-de-recetas-'));
  try {
    const originales = join(carpeta, 'originales');
    const entrega = join(carpeta, 'entrega');
    const vistas = join(carpeta, 'vistas');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(originales);
    const escribir = async (archivo, imagen, formato) => {
      const bytes = await imagen[formato]().toBuffer();
      writeFileSync(join(originales, archivo), bytes);
      return bytes;
    };
    const r17 = await escribir('R017-tarta-de-pollo-y-puerro.png', figura(1536, 1024, { fondo: '#d9c7a3', x: 0.5, y: 0.45, color: '#c0392b', alfa: true }), 'png');
    await escribir('R018-tarta-de-zapallitos-y-ricota.jpg', figura(1600, 1200, { fondo: '#e8e1d0', x: 0.3, y: 0.5, color: '#27ae60' }), 'jpeg');
    await escribir('R019-tarta-de-atun-tomate-y-huevo.webp', figura(1024, 1024, { fondo: '#ece5d5', x: 0.7, y: 0.3, color: '#2980b9' }), 'webp');
    writeFileSync(join(originales, 'R020-tarta-de-calabaza-cebolla-y-queso.png'), r17); // el mismo archivo que R017
    await escribir('R021-empanadas-de-carne-magra-al-horno.jpg', figura(1600, 1200, { fondo: '#e9e2d1', x: 0.3, y: 0.5, color: '#28ae61' }), 'jpeg'); // casi R018
    await escribir('01-avena-cocida-con-banana-y-canela.png', figura(1536, 1024, { fondo: '#efe9dc', x: 0.2, y: 0.2, color: '#8e44ad' }), 'png');
    writeFileSync(join(originales, 'notas.txt'), 'no es una imagen');
    await escribir('R099-otra.png', figura(800, 600, { fondo: '#fff', x: 0.5, y: 0.5, color: '#000' }), 'png');
    const antes = Object.fromEntries(['R017-tarta-de-pollo-y-puerro.png', '01-avena-cocida-con-banana-y-canela.png'].map((f) => [f, sha(readFileSync(join(originales, f)))]));

    const registro = await preparar({ originales, entrega, vistas, herramienta: 'imágenes sintéticas de la prueba' }, { escribir: () => {} });

    assert.deepEqual(Object.keys(registro.fotos).sort(), ['R001', 'R017', 'R018', 'R019', 'R020', 'R021']);
    assert.deepEqual(registro.desconocidos.sort(), ['R099-otra.png', 'notas.txt']);
    assert.equal(registro.faltantes.length, 60);
    for (const f of Object.values(registro.fotos)) {
      const bytes = readFileSync(f.entrega.ruta);
      const m = await sharp(bytes).metadata();
      assert.deepEqual([m.format, m.width, m.height], ['jpeg', 1600, 1200], f.codigo);
      assert.deepEqual(problemasDeLaFoto(bytes, f.entrega.archivo), [], f.codigo);
      assert.equal(f.revision.tecnica, 'VERIFICADA', f.codigo);
      assert.equal(f.revision.visualDelAgente, null, f.codigo);
      assert.equal(f.revision.direccion, null, f.codigo);
      assert.equal(f.vistas.length, 2, f.codigo);
      for (const v of f.vistas) assert.equal((await sharp(readFileSync(v)).metadata()).format, 'png');
    }
    // La original 1 se entrega con el nombre del manifiesto congelado; las nuevas, con su código.
    assert.equal(registro.fotos.R001.entrega.archivo, '01-avena-cocida-con-banana-y-canela.jpg');
    assert.equal(registro.fotos.R017.entrega.archivo, 'R017-tarta-de-pollo-y-puerro.jpg');
    assert.equal(registro.fotos.R017.agrandada, true);
    // Cada foto guarda el prompt con que se pidió, del paquete de generación.
    assert.match(registro.fotos.R017.prompt, /«Tarta de pollo y puerro»/);
    assert.equal(registro.fotos.R018.agrandada, false);
    assert.deepEqual(registro.fotos.R018.transformaciones, ['recodificado en JPEG de calidad 90, sin metadatos']);
    assert.match(registro.fotos.R019.transformaciones.join(' · '), /recorte al centro de 1024 × 1024 a 1024 × 768 .* reescalado ×1,563/);
    // El original no se tocó.
    for (const [f, h] of Object.entries(antes)) assert.equal(sha(readFileSync(join(originales, f))), h, f);
    // El mismo archivo en dos recetas, y dos fotos casi iguales.
    assert.deepEqual(registro.duplicadosExactos, [['R017', 'R020']]);
    assert.ok(registro.parecidas.some(([a, b]) => a === 'R018' && b === 'R021'), JSON.stringify(registro.parecidas));
    assert.ok(!registro.parecidas.some(([a, b]) => (a === 'R017' && b === 'R019') || (a === 'R001' && b === 'R018')));

    // «registrar» copia el registro (acá, a una carpeta temporal) y se niega si una entrega cambió.
    const destino = join(carpeta, 'registro.json');
    registrar({ entrega }, { escribir: () => {}, destino });
    assert.equal(JSON.parse(readFileSync(destino, 'utf8')).resumen.conFoto, 6);
    writeFileSync(registro.fotos.R018.entrega.ruta, Buffer.from('otra cosa'));
    assert.throws(() => registrar({ entrega }, { escribir: () => {}, destino }), /cambió desde que se preparó/);
  } finally {
    rmSync(carpeta, { recursive: true, force: true });
  }
});

test('la huella perceptual separa figuras distintas y junta las casi iguales', async () => {
  const a = await huellaPerceptual(await figura(400, 300, { fondo: '#e8e1d0', x: 0.3, y: 0.5, color: '#27ae60' }).png().toBuffer());
  const casi = await huellaPerceptual(await figura(400, 300, { fondo: '#e9e2d1', x: 0.3, y: 0.5, color: '#28ae61' }).png().toBuffer());
  const otra = await huellaPerceptual(await figura(400, 300, { fondo: '#ece5d5', x: 0.75, y: 0.25, color: '#2980b9' }).png().toBuffer());
  assert.ok(distancia(a, casi) <= UMBRAL_DE_PARECIDO, `${a} ${casi}`);
  assert.ok(distancia(a, otra) > UMBRAL_DE_PARECIDO, `${a} ${otra}`);
});
