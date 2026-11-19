/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179) · TEST-CTX-020 a TEST-CTX-027 · el panel «Contexto de <nombre>» en el website, sin
 * navegador:
 *  1. al costado desde 1680 px y como cajón debajo: a 1920 el editor queda en 1480 px; a 1536 y a 1280 el editor no se
 *     comprime (el panel lo tapa en parte, como un cajón);
 *  2. Alt + C, por la tecla física, sin otros modificadores;
 *  3. las pestañas, en orden, con flechas, Inicio y Fin;
 *  4. lo único que se recuerda es si estaba abierto y la pestaña; un almacenamiento roto no rompe nada;
 *  5. nada se lee hasta abrir la pestaña, y cada pestaña dice qué operación lee;
 *  6. «Citar» al fundamento del objetivo suma un renglón con su fuente, una sola vez;
 *  7. el marco del área monta el panel y el proveedor de citas, y el botón vuelve a tener el foco al cerrar;
 *  8. lo que el panel escribe en pantalla no dice «asesorado», «cumplimiento», «adherencia», «racha» ni «puntaje», y no
 *     guarda datos de la persona en el navegador.
 * Lo que se ve, en las capturas (`EVIDENCIA/CONTEXTO-DE-LA-PERSONA/capturas.mjs`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const P = await import('../src/app/pro/advisees/contexto/panel-de-contexto.ts');
const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(join(AQUI, '../src/app/pro/advisees', ruta), 'utf8');

test('TEST-CTX-020 · al costado desde 1680 px; como cajón debajo, sin comprimir el editor', () => {
  assert.equal(P.modoDelPanel(1920), 'costado');
  assert.equal(P.anchoDelEditor(1920), 1480);
  assert.equal(P.modoDelPanel(1680), 'costado');
  assert.equal(P.modoDelPanel(1679), 'cajon');
  // Windows al 125 % con Chrome al 100 % en una pantalla de 1920: 1536 de ancho.
  assert.equal(P.modoDelPanel(1536), 'cajon');
  assert.equal(P.anchoDelEditor(1536), 1536);
  assert.equal(P.anchoDelEditor(1280), 1280);
  assert.equal(P.anchoDelPanel(1280), 440);
  // En una ventana angosta, el cajón no pasa del 92 %.
  assert.equal(P.anchoDelPanel(400), 368);
});

test('TEST-CTX-021 · Alt + C abre y cierra, por la tecla física y sin otros modificadores', () => {
  const tecla = (cambios) => ({ altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, code: 'KeyC', ...cambios });
  assert.equal(P.esAtajoDelPanel(tecla({})), true);
  assert.equal(P.esAtajoDelPanel(tecla({ altKey: false })), false);
  // AltGr en Windows es Ctrl + Alt: no abre.
  assert.equal(P.esAtajoDelPanel(tecla({ ctrlKey: true })), false);
  assert.equal(P.esAtajoDelPanel(tecla({ shiftKey: true })), false);
  assert.equal(P.esAtajoDelPanel(tecla({ code: 'KeyV' })), false);
});

test('TEST-CTX-022 · las cinco pestañas, en orden, con flechas, Inicio y Fin', () => {
  assert.deepEqual([...P.PESTANAS], ['importante', 'formularios', 'cuerpo', 'otras', 'notas']);
  assert.deepEqual(Object.values(P.TEXTO_DE_PESTANA), ['Lo importante', 'Formularios', 'Cuerpo', 'Otras áreas', 'Notas']);
  assert.equal(P.pestanaPorTecla('importante', 'ArrowRight'), 'formularios');
  assert.equal(P.pestanaPorTecla('importante', 'ArrowLeft'), 'notas');
  assert.equal(P.pestanaPorTecla('notas', 'ArrowRight'), 'importante');
  assert.equal(P.pestanaPorTecla('cuerpo', 'Home'), 'importante');
  assert.equal(P.pestanaPorTecla('cuerpo', 'End'), 'notas');
  assert.equal(P.pestanaPorTecla('cuerpo', 'a'), null);
});

test('TEST-CTX-023 · lo que se recuerda: abierto y pestaña, por área; un almacenamiento roto devuelve lo de siempre', () => {
  const mapa = new Map();
  const almacen = { getItem: (k) => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, v) };
  P.guardarPreferencia(almacen, 'NUTRICION', { abierto: true, pestana: 'cuerpo' });
  assert.deepEqual(P.leerPreferencia(almacen, 'NUTRICION'), { abierto: true, pestana: 'cuerpo' });
  assert.deepEqual(P.leerPreferencia(almacen, 'ENTRENAMIENTO'), P.PREFERENCIA_POR_OMISION);
  assert.deepEqual(JSON.parse(mapa.get(P.claveDePreferencia('NUTRICION'))), { abierto: true, pestana: 'cuerpo' });
  mapa.set(P.claveDePreferencia('NUTRICION'), '{roto');
  assert.deepEqual(P.leerPreferencia(almacen, 'NUTRICION'), P.PREFERENCIA_POR_OMISION);
  mapa.set(P.claveDePreferencia('NUTRICION'), JSON.stringify({ abierto: true, pestana: 'otra-cosa' }));
  assert.deepEqual(P.leerPreferencia(almacen, 'NUTRICION'), { abierto: true, pestana: 'importante' });
  const roto = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
  assert.deepEqual(P.leerPreferencia(roto, 'NUTRICION'), P.PREFERENCIA_POR_OMISION);
  assert.doesNotThrow(() => P.guardarPreferencia(roto, 'NUTRICION', { abierto: true, pestana: 'notas' }));
  assert.deepEqual(P.leerPreferencia(null, 'NUTRICION'), P.PREFERENCIA_POR_OMISION);
});

test('TEST-CTX-024 · cada pestaña lee lo suyo, con operaciones que existen; el panel cerrado no lee nada', () => {
  const marco = leer('marco-del-area.tsx');
  // El panel solo se monta abierto: sus lecturas salen recién ahí.
  assert.match(marco, /\{conPanel \? \(\s*<PanelDeContexto/);
  const panel = leer('contexto/panel.tsx');
  for (const lectura of ['respuestasDelContexto', 'cuerpoDelContexto', 'habitosDeLaPersona', 'resumenesCompartidos', 'habitosParaElProfesional', 'notasPropias']) assert.ok(panel.includes(`api.${lectura}(`), `el panel no lee ${lectura}`);
});

test('TEST-CTX-025 · «Citar» en el objetivo suma un renglón con su fuente, una sola vez', () => {
  const cita = {
    formResponseId: 'r1',
    fieldCode: 'trn_dias_por_semana',
    expectedVersion: 'v2',
    area: 'ENTRENAMIENTO',
    deSalud: false,
    pregunta: 'Días por semana',
    respuesta: '3 días por semana',
    fuente: { tipo: 'FORMULARIO', nombre: 'Antes de entrenar', fecha: '2026-11-10T10:00:00.000Z', corregida: false, cargadaConElProfesional: false },
  };
  const linea = P.lineaParaElFundamento(cita, (iso) => iso.slice(0, 10));
  assert.equal(linea, 'Antes de entrenar · 2026-11-10: Días por semana: 3 días por semana');
  const una = P.fundamentoConCita('Arrancamos con fuerza.  ', linea);
  assert.deepEqual(una, { texto: `Arrancamos con fuerza.\n${linea}`, resultado: 'citada' });
  assert.deepEqual(P.fundamentoConCita(una.texto, linea), { texto: una.texto, resultado: 'ya' });
  assert.equal(P.fundamentoConCita('', linea).texto, linea);
  assert.equal(P.claveDeCita(cita), 'r1#trn_dias_por_semana');
  assert.match(P.avisoDeCitar('tope', 'evaluacion', 20), /20 citas/);
  assert.match(P.avisoDeCitar('otra-area', 'evaluacion', 20), /su área/);
});

test('TEST-CTX-026 · el marco monta el panel y el proveedor; el foco vuelve al botón; las evaluaciones y los objetivos reciben las citas', () => {
  const marco = leer('marco-del-area.tsx');
  assert.match(marco, /<ProveedorDeCitas>/);
  assert.match(marco, /aria-expanded=\{panel\.abierto\}/);
  assert.match(marco, /aria-keyshortcuts="Alt\+C"/);
  // Revisión del PR: vuelve a donde estaba al abrir (el campo, con Alt + C) o, si ya no está, al botón.
  assert.match(marco, /\(volver\?\.isConnected \? volver : botonDelPanel\.current\)\?\.focus\(\)/);
  const panel = leer('contexto/panel.tsx');
  assert.match(panel, /<aside className=\{`panel-de-contexto/);
  assert.match(panel, /role="tablist"/);
  assert.match(panel, /role="tabpanel"/);
  assert.match(panel, /e\.key === 'Escape'/);
  for (const [archivo, cuantos] of [['training/resumen.tsx', 2], ['nutrition/formularios.tsx', 2]]) {
    assert.equal((leer(archivo).match(/useReceptorDeCitas\(/g) ?? []).length, cuantos, `${archivo} no anota sus receptores`);
  }
  // Nutrición manda las citas con la versión vista, y un 409 no se lleva la selección.
  const nutricion = leer('nutrition/formularios.tsx');
  assert.match(nutricion, /formResponseReferences: citas\.map\(\(c\) => \(\{ formResponseId: c\.formResponseId, fieldCode: c\.fieldCode, expectedVersion: c\.expectedVersion \}\)\)/);
  assert.match(nutricion, /VERSION_CONFLICT/);
});

test('TEST-CTX-027 · lo que se ve no dice lo prohibido, y el navegador no guarda datos de la persona', () => {
  const panel = leer('contexto/panel.tsx');
  // El texto de la pantalla: lo que va entre etiquetas y empieza con mayúscula, y las frases entre comillas.
  const visibles = [...panel.matchAll(/[>}]\s*([A-ZÁÉÍÓÚÑ¿«][^<>{}\n]*)</g), ...panel.matchAll(/'([^'\n]* [^'\n]*)'/g)].map((m) => m[1].toLowerCase());
  for (const prohibida of ['asesorad', 'cumplimiento', 'adherencia', 'racha', 'puntaje']) {
    assert.ok(!visibles.some((t) => t.includes(prohibida)), `el panel dice «${prohibida}»`);
  }
  assert.ok(!panel.includes('localStorage') && !panel.includes('sessionStorage'), 'el panel no guarda nada en el navegador');
  assert.ok(!leer('contexto/citas.tsx').includes('localStorage'));
});

// ─── Revisión del PR (adversaria) ───────────────────────────────────────────────────────────────

const citaDe = (fieldCode, extra = {}) => ({
  formResponseId: 'r1',
  fieldCode,
  expectedVersion: 'v1',
  area: 'NUTRICION',
  deSalud: false,
  pregunta: fieldCode,
  respuesta: 'x',
  fuente: { tipo: 'FORMULARIO', nombre: 'Cómo comés hoy', fecha: '2026-11-10T10:00:00.000Z', corregida: false, cargadaConElProfesional: false },
  ...extra,
});

test('TEST-CTX-028 · «Citar»: el renglón entra entero o no entra (tope de 20), una cita que cambió se reemplaza, y el objetivo nunca recibe lo de salud', () => {
  // Mutación verificada: decidir cita por cita con la lista de antes (como el receptor anterior) deja 21.
  const diecinueve = Array.from({ length: 19 }, (_, i) => citaDe(`c${i}`));
  const conDetalle = [citaDe('nut_alergias', { deSalud: true }), citaDe('nut_alergias_cuales', { deSalud: true })];
  const tope = P.sumarCitas(diecinueve, conDetalle, 20);
  assert.equal(tope.resultado, 'tope');
  assert.equal(tope.lista.length, 19);
  const una = P.sumarCitas(diecinueve, [citaDe('nut_estilo')], 20);
  assert.equal(una.resultado, 'citada');
  assert.equal(una.lista.length, 20);
  // Ya citada con la misma versión: nada cambia. Con otra (la persona corrigió y se volvió a leer): se reemplaza en su lugar.
  assert.equal(P.sumarCitas(una.lista, [citaDe('c3')], 20).resultado, 'ya');
  const nueva = P.sumarCitas(una.lista, [citaDe('c3', { expectedVersion: 'v2' })], 20);
  assert.equal(nueva.resultado, 'citada');
  assert.equal(nueva.lista.length, 20);
  assert.equal(nueva.lista[3].expectedVersion, 'v2');
  // «Citada» se decide con la versión vista: la v2 no figura como citada mientras la lista tenga la v1.
  assert.equal(P.claveDeCitaVista(citaDe('c3')), 'r1#c3@v1');
  assert.notEqual(P.claveDeCitaVista(citaDe('c3', { expectedVersion: 'v2' })), P.claveDeCitaVista(una.lista[3]));
  // Lo que recibe cada destino: la evaluación, las de su área; el objetivo, nada de salud (viaja con el plan compartido).
  const mezcla = [citaDe('nut_alergias', { deSalud: true }), citaDe('nut_estilo'), citaDe('trn_dias', { area: 'ENTRENAMIENTO' })];
  assert.deepEqual(P.citasAdmitidas({ area: 'NUTRICION', destino: 'evaluacion' }, mezcla).map((c) => c.fieldCode), ['nut_alergias', 'nut_estilo']);
  assert.deepEqual(P.citasAdmitidas({ area: 'NUTRICION', destino: 'objetivo' }, mezcla).map((c) => c.fieldCode), ['nut_estilo', 'trn_dias']);
  const fundamento = P.fundamentoConCitas('Base.', mezcla, (iso) => iso.slice(0, 10));
  assert.equal(fundamento.resultado, 'citada');
  assert.ok(!fundamento.texto.includes('nut_alergias'), 'lo de salud no llega al fundamento');
  assert.deepEqual(P.fundamentoConCitas('Base.', [mezcla[0]], (iso) => iso), { texto: 'Base.', resultado: 'ya' });
  // El 409 dice cuál cambió.
  assert.deepEqual(P.citasQueCambiaron([citaDe('a'), citaDe('b')], [{ code: 'FORM_RESPONSE_VERSION_CHANGED', path: 'formResponseReferences[1].expectedVersion' }]), ['r1#b']);
});

test('TEST-CTX-029 · el foco vuelve a donde estaba, el panel reabierto solo no lo roba, «Ocultar nombres» en «La tomó», y las pestañas en un renglón', () => {
  const marco = leer('marco-del-area.tsx');
  // Se recuerda dónde estaba el foco al abrir (con Alt + C, el campo de la evaluación).
  assert.match(marco, /focoAlAbrir\.current = activo instanceof HTMLElement && activo !== document\.body \? activo : null;/);
  assert.match(marco, /else abrirPanel\(\);/);
  assert.match(marco, /enfocarAlAbrir=\{enfocarElPanel\}/);
  const panel = leer('contexto/panel.tsx');
  assert.match(panel, /if \(enfocar\.current\) encabezado\.current\?\.focus\(\);/);
  // «La tomó» pasa por «Ocultar nombres».
  assert.match(panel, /\{ fecha: fechaCorta, hora, nombre: delProfesional \}/);
  // «Citar» decide con la versión vista y con lo que admite el destino; las del renglón van juntas.
  assert.match(panel, /citasAdmitidas\(receptor, citas\)/);
  assert.match(panel, /receptor\.citadas\.has\(claveDeCitaVista\(c\)\)/);
  assert.match(panel, /receptor\.citar\(admitidas\)/);
  for (const archivo of ['training/resumen.tsx', 'nutrition/formularios.tsx']) {
    const fuente = leer(archivo);
    assert.match(fuente, /sumarCitas/, `${archivo} no usa sumarCitas`);
    assert.match(fuente, /fundamentoConCitas\(/, `${archivo} no filtra lo de salud del objetivo`);
    assert.ok(!/fundamentoConCita\(|lineaParaElFundamento\(/.test(fuente), `${archivo} cita al objetivo sin el filtro`);
  }
  // Las pestañas: cada etiqueta entera, en un renglón.
  const css = readFileSync(join(AQUI, '../src/app/globals.css'), 'utf8');
  const bloque = css.slice(css.indexOf('.panel-de-contexto__pestana {'), css.indexOf('}', css.indexOf('.panel-de-contexto__pestana {')));
  assert.match(bloque, /white-space: nowrap;/);
  assert.doesNotMatch(bloque, /hyphens/);
});
