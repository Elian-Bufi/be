/**
 * Las reglas de respaldo y de transferencia de Android de la APK (precierre del 2026-10-06, §4):
 * `apps/mobile/plugins/respaldo-de-android.js`.
 *
 * - Android 11 o anterior (`full-backup-content`) y Android 12 o posterior (`data-extraction-rules`, con `cloud-backup` y
 *   `device-transfer` explícitos: una sección que falta queda abierta para todo).
 * - Solo se incluyen las preferencias de la plataforma, así que la base de AsyncStorage (`RKStorage`, del dominio
 *   `database`) queda fuera; dentro de lo incluido se excluye por nombre el almacenamiento seguro (`SecureStore.xml`).
 * - Cada exclusión cae dentro de algo incluido: si no, lint corta la compilación release (`FullBackupContent`, encontrado
 *   al construir la 0.15.0-candidata.1).
 * - El plugin escribe esos dos archivos y apunta el manifiesto a ellos.
 *
 * **Lo que esto no prueba:** que Android las aplique. Eso se comprueba en el teléfono con `bmgr` (pasos en la evidencia).
 * Uso: node --test scripts/respaldo-de-android.test.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const plugin = require('../apps/mobile/plugins/respaldo-de-android.js');

const secciones = (xml, etiqueta) => [...xml.matchAll(new RegExp(`<${etiqueta}>([\\s\\S]*?)</${etiqueta}>`, 'g'))].map((m) => m[1]);
const reglasDe = (bloque) => [...bloque.matchAll(/<(include|exclude) domain="([^"]+)" path="([^"]+)"\/>/g)].map(([, tipo, dominio, ruta]) => `${tipo}:${dominio}:${ruta}`);

const ESPERADAS = [
  'include:sharedpref:.',
  'exclude:sharedpref:SecureStore.xml',
  'exclude:sharedpref:SecureStore',
];

test('Android 11 o anterior: solo las preferencias de la plataforma, sin el almacenamiento seguro ni AsyncStorage', () => {
  const [bloque] = secciones(plugin.XML_DE_RESPALDO, 'full-backup-content');
  assert.ok(bloque, 'el archivo es un full-backup-content');
  assert.deepEqual(reglasDe(bloque), ESPERADAS);
});

test('Android 12 o posterior: el respaldo en la nube y la transferencia entre dispositivos, los dos explícitos e iguales', () => {
  const [nube] = secciones(plugin.XML_DE_EXTRACCION, 'cloud-backup');
  const [transferencia] = secciones(plugin.XML_DE_EXTRACCION, 'device-transfer');
  assert.ok(nube && transferencia, 'las dos secciones están: ninguna queda abierta por omisión');
  assert.deepEqual(reglasDe(nube), ESPERADAS);
  assert.deepEqual(reglasDe(transferencia), ESPERADAS);
  assert.doesNotMatch(plugin.XML_DE_EXTRACCION, /cross-platform-transfer/, 'BE no tiene una app para iOS que reciba datos');
});

test('cada exclusión cae dentro de lo incluido (lint FullBackupContent), y la base de AsyncStorage no está incluida', () => {
  for (const xml of [plugin.XML_DE_RESPALDO, plugin.XML_DE_EXTRACCION]) {
    const reglas = reglasDe(xml).map((r) => r.split(':'));
    const incluidos = reglas.filter(([tipo]) => tipo === 'include').map(([, dominio, ruta]) => ({ dominio, ruta }));
    for (const [tipo, dominio, ruta] of reglas.filter(([t]) => t === 'exclude')) {
      assert.ok(incluidos.some((i) => i.dominio === dominio && (i.ruta === '.' || ruta === i.ruta || ruta.startsWith(`${i.ruta}/`))), `${tipo} ${dominio}/${ruta} no está en ningún include`);
    }
    assert.ok(!incluidos.some((i) => i.dominio === 'database' || i.dominio === 'root' || i.dominio === 'file'), 'ni la base de AsyncStorage ni los archivos de la app están incluidos');
  }
});

test('el plugin escribe los dos archivos y apunta el manifiesto a ellos', async () => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'be-respaldo-'));
  try {
    // Un config mínimo con los «mods» de Expo: se aplica el plugin y se ejecutan sus modificaciones a mano.
    let config = plugin({ name: 'BE', slug: 'be', modRequest: undefined });
    const manifiesto = { manifest: { application: [{ $: { 'android:name': '.MainApplication' } }] } };
    const mods = config.mods.android;
    const conManifiesto = await mods.manifest({ ...config, modResults: manifiesto, modRequest: { platform: 'android', projectRoot: carpeta, platformProjectRoot: carpeta, modName: 'manifest', introspect: false } });
    const app = conManifiesto.modResults.manifest.application[0].$;
    assert.equal(app['android:fullBackupContent'], '@xml/be_reglas_de_respaldo');
    assert.equal(app['android:dataExtractionRules'], '@xml/be_reglas_de_extraccion');
    await mods.dangerous({ ...config, modResults: {}, modRequest: { platform: 'android', projectRoot: carpeta, platformProjectRoot: carpeta, modName: 'dangerous', introspect: false } });
    const xml = path.join(carpeta, 'app', 'src', 'main', 'res', 'xml');
    assert.equal(fs.readFileSync(path.join(xml, 'be_reglas_de_respaldo.xml'), 'utf8'), plugin.XML_DE_RESPALDO);
    assert.equal(fs.readFileSync(path.join(xml, 'be_reglas_de_extraccion.xml'), 'utf8'), plugin.XML_DE_EXTRACCION);
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});
