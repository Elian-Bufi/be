/**
 * WP-EDITOR-ENTRENAMIENTO-TANDA-3 (DL-199), parte del website · «Deshacer», reordenar arrastrando o con el teclado, y lo
 * BAJA de las tandas 1 y 2 (TEST-ET3-20 a TEST-ET3-29). La lógica vive en archivos sin React (`deshacer-del-editor.ts`,
 * `reordenar.ts`, `catalogo-en-la-sesion.ts` y `aproximaciones.ts`) y se prueba acá; lo de pantalla, por su fuente. El
 * recorrido de navegador es `editorTanda3Reordenar` (test/navegador/recorridos.mjs).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const D = await import('../src/app/pro/advisees/training/deshacer-del-editor.ts');
const R = await import('../src/app/pro/advisees/training/reordenar.ts');
const C = await import('../src/app/pro/advisees/training/catalogo-en-la-sesion.ts');
const A = await import('../src/app/pro/advisees/training/aproximaciones.ts');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');
const ARRASTRE = leer('app/pro/advisees/training/arrastrar-ejercicios.tsx');
const AGREGAR = leer('app/pro/advisees/training/agregar-ejercicio.tsx');
const DE_BE = leer('app/pro/exercises/catalogo-de-be.tsx');
const MIS = leer('app/pro/exercises/mis-ejercicios.tsx');
const CUADROS = leer('app/pro/advisees/training/cuadros-del-plan.tsx');
const BARRA = leer('app/pro/advisees/training/barra-de-fases-en-pantalla.tsx');
const CSS = leer('app/globals.css');

test('TEST-ET3-20 · la pila de «Deshacer»: apila lo de antes, junta lo escrito seguido, guarda 20 y devuelve el último', () => {
  let pila = [];
  pila = D.apilar(pila, 'a', 0);
  pila = D.apilar(pila, 'b', 500); // seguido: se junta con el anterior (queda «a», lo de antes de empezar)
  assert.equal(pila.length, 1);
  assert.equal(pila[0].estado, 'a');
  pila = D.apilar(pila, 'c', 5000);
  assert.equal(pila.length, 2);
  // Un cambio grande va aparte aunque sea seguido, con su texto.
  pila = D.apilar(pila, 'd', 5100, 'Quitaste «Sentadilla».');
  assert.equal(pila.length, 3);
  assert.equal(pila[2].grande, 'Quitaste «Sentadilla».');
  const r = D.desapilar(pila);
  assert.equal(r.estado, 'd');
  assert.equal(r.grande, 'Quitaste «Sentadilla».');
  assert.equal(r.pila.length, 2);
  assert.equal(D.desapilar([]), null);
  // A lo sumo 20: se van los más viejos.
  let larga = [];
  for (let n = 0; n < 30; n += 1) larga = D.apilar(larga, n, n * 2000);
  assert.equal(larga.length, D.MAXIMO_DE_LA_PILA);
  assert.equal(larga[0].estado, 10);
});

test('TEST-ET3-21 · Ctrl+Z (o Cmd+Z) deshace fuera de un campo de texto; en un campo, es del navegador', () => {
  const tecla = (c) => ({ key: 'z', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...c });
  assert.equal(D.esDeshacer(tecla({ ctrlKey: true })), true);
  assert.equal(D.esDeshacer(tecla({ metaKey: true, key: 'Z' })), true);
  assert.equal(D.esDeshacer(tecla({ ctrlKey: true, shiftKey: true })), false); // rehacer
  assert.equal(D.esDeshacer(tecla({})), false);
  assert.equal(D.esCampoDeTexto({ tagName: 'INPUT', type: 'text' }), true);
  assert.equal(D.esCampoDeTexto({ tagName: 'INPUT', type: 'number' }), true);
  assert.equal(D.esCampoDeTexto({ tagName: 'INPUT', type: 'checkbox' }), false);
  assert.equal(D.esCampoDeTexto({ tagName: 'TEXTAREA' }), true);
  assert.equal(D.esCampoDeTexto({ tagName: 'BUTTON' }), false);
  assert.equal(D.esCampoDeTexto({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(D.esCampoDeTexto(null), false);
  // En el editor: la pila se captura en los tres lugares que cambian lo que se edita, se vacía al cargar y el atajo no
  // actúa en un campo ni en un cuadro abierto.
  assert.match(EDITOR, /const cambiar = \(f: \(b: Bloques\) => Bloques, grande: string \| null = null\) => \{\n\s*recordar\(grande\);/);
  assert.match(EDITOR, /const cambiarAgenda = \(a: AgendaDeEntrenamiento \| null\) => \{\n\s*recordar\(\);/);
  assert.match(EDITOR, /const cambiarPlanificacion = \(p: PlanificacionDelPlan, grande: string \| null = null\) => \{\n\s*recordar\(grande\);/);
  assert.equal(EDITOR.match(/pilaDeDeshacer\.current = \[\];/g)?.length, 2);
  assert.match(EDITOR, /if \(esCampoDeTexto\(foco\) \|\| foco\?\.closest\('dialog, \[role="dialog"\], \[role="alertdialog"\]'\)\) return;/);
  // Lo que crea el guardado (los identificadores del servidor) también llega a lo apilado.
  assert.equal(EDITOR.match(/conLosIdentificadoresEnLaPila\(bloquesEnviados, /g)?.length, 3);
});

test('TEST-ET3-22 · los cambios grandes ofrecen «Deshacer» unos segundos, flotante (sin correr nada)', () => {
  for (const texto of ['quitasteElEjercicio', 'quitasteLaSesion', 'quitasteLaFase', 'quitasteLaSemana', 'pasasteALaIntensidad', 'aplicasteLaProgresion']) {
    assert.match(EDITOR, new RegExp(`COPY_DESHACER\\.${texto}\\(`), texto);
  }
  assert.equal(D.DESHACER_A_LA_VISTA_MS, 8000);
  assert.match(EDITOR, /<AvisoFlotante key=\{avisoDeDeshacer\.vez\} onCerrar=\{\(\) => setAvisoDeDeshacer\(null\)\} seQueda>/);
  assert.match(EDITOR, /data-deshacer-el-ultimo-boton onClick=\{deshacerElUltimo\} aria-keyshortcuts="Control\+Z"/);
  assert.match(EDITOR, /reloj = setTimeout\(intentar, DESHACER_A_LA_VISTA_MS\);/);
  assert.equal(D.COPY_DESHACER.pasasteALaIntensidad(1), 'Pasaste 1 ejercicio a la intensidad del plan.');
  assert.equal(D.COPY_DESHACER.deshecho('Quitaste «Remo».'), 'Se deshizo: quitaste «Remo».');
  // Los «Deshacer» de antes (el preset aplicado y las vueltas) siguen.
  assert.match(EDITOR, /data-deshacer onClick=\{deshacerLaAplicacion\}/);
  assert.match(EDITOR, /data-deshacer-las-vueltas onClick=\{deshacerLasVueltas\}/);
});

test('TEST-ET3-23 · arrastrar es subir o bajar de a un paso con la regla de siempre (un bloque no se rompe)', () => {
  // Una sesión de juguete: una lista de letras; la regla mueve de a uno salvo que «X» esté pegada (un bloque de dos).
  const mover = (s, l, hacia) => {
    const v = l + hacia;
    if (v < 0 || v >= s.length) return null;
    const orden = s.map((_, n) => n);
    [orden[l], orden[v]] = [orden[v], orden[l]];
    return { sesion: orden.map((n) => s[n]), desdeDonde: orden };
  };
  const r = R.moverHasta(['a', 'b', 'c', 'd'], 4, 0, 2, mover);
  assert.deepEqual(r.sesion, ['b', 'c', 'a', 'd']);
  assert.deepEqual(r.desdeDonde, [1, 2, 0, 3]);
  assert.equal(r.posicion, 2);
  const arriba = R.moverHasta(['a', 'b', 'c', 'd'], 4, 3, 0, mover);
  assert.deepEqual(arriba.sesion, ['d', 'a', 'b', 'c']);
  assert.deepEqual(arriba.desdeDonde, [3, 0, 1, 2]);
  assert.equal(R.moverHasta(['a', 'b'], 2, 1, 1, mover), null);
  // Si la regla no deja, queda donde llegó (o no se mueve).
  const tope = (s, l, hacia) => (l + hacia === 2 ? null : mover(s, l, hacia));
  assert.equal(R.moverHasta(['a', 'b', 'c'], 3, 1, 2, tope), null);
  // Dónde cae lo que se suelta: arriba o abajo de la tarjeta.
  assert.equal(R.destinoAlSoltar(0, 2, true), 1);
  assert.equal(R.destinoAlSoltar(0, 2, false), 2);
  assert.equal(R.destinoAlSoltar(3, 1, true), 1);
  assert.equal(R.destinoAlSoltar(3, 1, false), 2);
  assert.equal(R.destinoAlSoltar(2, 2, true), 2);
  // En el editor, con `moverEjercicio` de los bloques (DL-181).
  assert.match(EDITOR, /const r = moverHasta\(sesion, sesion\.prescriptions\.length, desde, hasta, moverEnLaSesion\);/);
});

test('TEST-ET3-24 · con el teclado: Alt+↑ y Alt+↓ en el ejercicio, ↑ y ↓ en el asa, y se le dice al lector', () => {
  const t = (c) => ({ key: 'ArrowUp', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, ...c });
  assert.equal(R.pasoDelTeclado(t({ altKey: true })), -1);
  assert.equal(R.pasoDelTeclado(t({ altKey: true, key: 'ArrowDown' })), 1);
  assert.equal(R.pasoDelTeclado(t({})), null);
  assert.equal(R.pasoDelTeclado(t({ altKey: true, shiftKey: true })), null);
  assert.equal(R.COPY_REORDENAR.movido('Remo', 1, 5), '«Remo» quedó en el lugar 2 de 5.');
  assert.match(ARRASTRE, /<p className="visualmente-oculto" aria-live="polite" data-anuncio-del-reordenar>/);
  // En un desplegable, Alt+↓ lo abre: no se toca.
  assert.match(ARRASTRE, /if \(paso === null \|\| \(e\.target as HTMLElement\)\.tagName === 'SELECT'\) return;/);
  // El asa: un botón con nombre, arrastrable, con la imagen de la tarjeta entera y el foco de vuelta al moverlo.
  assert.match(ARRASTRE, /className="ejercicio-del-editor__asa"\n\s*draggable/);
  assert.match(ARRASTRE, /e\.dataTransfer\.setDragImage\(tarjeta, 24, 24\)/);
  assert.match(ARRASTRE, /if \(quedo !== null && conElTeclado\) s\.alEnfocar\(s\.idDelAsa\(quedo\)\);/);
  // La tarjeta recibe lo del arrastre y el asa va al principio de su cabecera.
  assert.match(EJERCICIO, /\{\.\.\.\(arrastre\?\.propsDeLaTarjeta \?\? \{\}\)\}\n\s*>\n\s*<div className="comida-del-editor__cabecera">\n\s*\{arrastre\?\.asa \?\? null\}/);
  assert.match(EDITOR, /arrastre=\{arrastre\.para\(l\)\}/);
  assert.match(EDITOR, /\{arrastre\.anuncio\}/);
});

test('TEST-ET3-25 · RP-19: el asa está siempre y la marca de dónde cae no ocupa lugar; colores de los tokens', () => {
  const bloque = CSS.slice(CSS.indexOf('/* ─── DL-199 · WP-EDITOR-ENTRENAMIENTO-TANDA-3 (fork A)'));
  assert.ok(bloque.length > 0);
  assert.match(bloque, /\.ejercicio-del-editor__asa \{[^}]*min-block-size: 44px;/);
  assert.match(bloque, /\.ejercicio-del-editor\[data-soltar='arriba'\] \{\n\s*box-shadow: 0 -3px 0 0 var\(--azul\);/);
  assert.match(bloque, /\.ejercicio-del-editor\[data-soltar='abajo'\] \{\n\s*box-shadow: 0 3px 0 0 var\(--azul\);/);
  const delBloque = bloque.slice(0, bloque.indexOf('/* ───', 10) > 0 ? bloque.indexOf('/* ───', 10) : undefined);
  assert.doesNotMatch(delBloque, /#[0-9a-f]{3,6}\b/i);
});

test('TEST-ET3-26 · desmarcar una aproximación le devuelve lo común: sin descanso propio ni RIR vacío', () => {
  assert.deepEqual(A.serieAlDesmarcarLaAproximacion({ repetitions: 8, setKind: 'WARM_UP', rir: null, restSeconds: 60, suggestedLoad: { value: 20, unit: 'kg' } }), { repetitions: 8, suggestedLoad: { value: 20, unit: 'kg' } });
  assert.deepEqual(A.serieAlDesmarcarLaAproximacion({ repetitions: 5, setKind: 'WARM_UP', rir: 2, restSeconds: 90 }), { repetitions: 5, rir: 2 });
  assert.match(EJERCICIO, /if \(esDeCalentamiento\(x\)\) return serieAlDesmarcarLaAproximacion\(resto\) as Serie;/);
});

test('TEST-ET3-27 · el catálogo entero, una vez por sesión: compartido, vigente diez minutos, invalidado al crear y avisado si corta', async () => {
  C.invalidarElCatalogo();
  let pedidos = 0;
  const paginas = [
    { ok: true, data: ['b', 'a'], hasMore: true, nextCursor: 'x' },
    { ok: true, data: ['c'], hasMore: false, nextCursor: null },
  ];
  const leer = async (cursor) => (pedidos += 1, paginas[cursor === null ? 0 : 1]);
  const ordenar = (e) => [...e].sort();
  const [uno, dos] = await Promise.all([C.catalogoDeLaSesion('t', leer, ordenar, 0), C.catalogoDeLaSesion('t', leer, ordenar, 10)]);
  assert.deepEqual(uno, { tipo: 'lista', ejercicios: ['a', 'b', 'c'], completo: true, motivo: null });
  assert.equal(dos, uno);
  assert.equal(pedidos, 2); // dos páginas, una sola lectura
  await C.catalogoDeLaSesion('t', leer, ordenar, C.VIGENCIA_MS - 1);
  assert.equal(pedidos, 2);
  await C.catalogoDeLaSesion('t', leer, ordenar, C.VIGENCIA_MS + 1);
  assert.equal(pedidos, 4); // vencido: otra vez
  C.invalidarElCatalogo('t');
  await C.catalogoDeLaSesion('t', leer, ordenar, C.VIGENCIA_MS + 2);
  assert.equal(pedidos, 6);
  // Corta a mitad: lo leído, sin guardarlo.
  const corta = async (cursor) => (cursor === null ? paginas[0] : { ok: false, motivo: 'Sin conexión.' });
  const r = await C.catalogoDeLaSesion('u', corta, ordenar, 0);
  assert.deepEqual(r, { tipo: 'lista', ejercicios: ['a', 'b'], completo: false, motivo: 'Sin conexión.' });
  let otra = 0;
  await C.catalogoDeLaSesion('u', async (c) => (otra += 1, paginas[c === null ? 0 : 1]), ordenar, 1);
  assert.equal(otra, 2);
  // Falla de entrada: falla; la sesión perdida no se guarda.
  assert.deepEqual(await C.catalogoDeLaSesion('v', async () => ({ ok: false, motivo: 'No.' }), ordenar, 0), { tipo: 'falla', motivo: 'No.' });
  assert.deepEqual(await C.catalogoDeLaSesion('w', async () => ({ ok: false, motivo: '', sesionPerdida: true }), ordenar, 0), { tipo: 'sesion-perdida' });
  assert.equal(C.COPY_CATALOGO_EN_LA_SESION.incompleto(80), 'Se cargaron 80 ejercicios; faltan otros.');
  // En pantalla: los dos catálogos leen el de la sesión; crear, importar o reclasificar lo invalida; el aviso, en el renglón
  // reservado de la cuenta.
  assert.match(AGREGAR, /const r = await leerElCatalogoDeLaSesion\(token, sesionPerdida\);/);
  assert.match(DE_BE, /const r = await leerElCatalogoDeLaSesion\(token, sesionPerdida\);/);
  assert.match(AGREGAR, /\/\/ DL-199 \(ET3-24\): lo creado o importado hace que la próxima lectura del catálogo vaya a la API\.\n\s*invalidarElCatalogo\(token\);/);
  assert.equal(MIS.match(/invalidarElCatalogo\(\);/g)?.length, 2);
  assert.match(AGREGAR, /catalogo\.tipo === 'lista' && catalogo\.completo === false \? \(\n\s*<span data-catalogo-incompleto>/);
  assert.match(DE_BE, /lectura\.tipo === 'lista' && !lectura\.completo \? \(\n\s*<span data-catalogo-incompleto>/);
});

test('TEST-ET3-28 · «Catálogo de BE» es lo que no cargó ningún profesional, no según la procedencia', () => {
  assert.match(DE_BE, /export const esDelCatalogoDeBe = \(e: EjercicioEncontrado\): boolean => \(e\.loadedByProfessional === undefined \? e\.provenance !== 'PROFESSIONAL_MANUAL' : !e\.loadedByProfessional\);/);
  assert.match(DE_BE, /lectura\.ejercicios\.filter\(esDelCatalogoDeBe\)/);
  assert.match(leer('../../api/src/entrenamiento/catalogo.service.ts'), /\.\.\.\(conClasificacion \? \{ loadedByProfessional: f\.creadoPorId !== null \} : \{\}\),/);
});

test('TEST-ET3-29 · accesibilidad: una parada de Tab por fila en «Días de la semana» y un solo nombre en la barra de fases', () => {
  assert.match(CUADROS, /const paradaDe = \(n: number, c: number\) => \(\(activa\[n\] \?\? 0\) === c \? 0 : -1\);/);
  assert.match(CUADROS, /tabIndex=\{paradaDe\(n, 0\)\}\n\s*onFocus=\{\(\) => enfocada\(n, 0\)\}/);
  assert.match(CUADROS, /tabIndex=\{paradaDe\(n, c \+ 1\)\}\n\s*onFocus=\{\(\) => enfocada\(n, c \+ 1\)\}/);
  assert.match(BARRA, /role="tablist" aria-label=\{T\.barra\} data-barra-de-fases/);
  assert.doesNotMatch(BARRA, /role="tablist"[^>]*aria-labelledby/);
});
