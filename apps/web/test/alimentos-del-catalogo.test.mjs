/**
 * WP-NUTRICION-ALIMENTOS (DL-180, NUA-01 a NUA-05) · los alimentos del catálogo en el website del profesional y en la
 * consola de Administración. La lógica se prueba sin React; las pantallas, leyendo el componente, como el resto de las
 * pruebas del website.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

// Los módulos importan a sus vecinos sin extensión, como los resuelve Next; y `@be/domain` es el de este repositorio.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  if (especificador === '@be/domain') return siguiente(new URL('../../../packages/domain/dist/index.js', ${JSON.stringify(import.meta.url)}).href, contexto);
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const A = await import('../src/app/pro/advisees/nutrition/alimentos-del-catalogo.ts');
const V = await import('../src/app/pro/advisees/nutrition/valores-del-alimento.ts');
const R = await import('../src/app/admin/foods/decision.ts');
const d =await import('../../../packages/domain/dist/index.js');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CUADRO = leer('app/pro/advisees/nutrition/cuadro-de-la-opcion.tsx');
const FILA = leer('app/pro/advisees/nutrition/comida-del-editor.tsx');
const EDITOR = leer('app/pro/advisees/nutrition/editor.tsx');
const FORMULARIO = leer('app/pro/advisees/nutrition/formulario-del-alimento.tsx');
const MIS_ALIMENTOS = leer('app/pro/foods/mis-alimentos.tsx');
const REVISION = leer('app/admin/foods/alimentos-para-revisar.tsx');

const alimento = (id, nombre, extra = {}) => ({ catalogItemId: id, name: nombre, ...extra });

// ─── NUA-02 y NUA-05 · lo que se sabe de un alimento citado ─────────────────────────────────────────────────────

test('NUA-02 y NUA-05 · un campo ausente vale lo de siempre: sin grupo y no retirado', () => {
  assert.deepEqual(A.datosDelAlimento(undefined), { grupo: null, retirado: false });
  assert.deepEqual(A.datosDelAlimento({}), { grupo: null, retirado: false });
  assert.deepEqual(A.datosDelAlimento({ foodGroup: 'DAIRY', retired: true }), { grupo: 'DAIRY', retirado: true });
  assert.equal(A.iconoDeLaFila({ grupo: null }), 'alimento');
  assert.equal(A.iconoDeLaFila({ grupo: 'MEAT' }), 'carnes');
});

test('NUA-02 · la fila de un alimento de la opción lleva el ícono de su grupo y, si se retiró, la marca discreta', () => {
  assert.match(FILA, /const datos = useDatosDelAlimento\(item\.catalogItemId\);/);
  assert.match(FILA, /<Icono nombre=\{iconoDeLaFila\(datos\)\} tamano=\{20\} \/>/);
  assert.match(FILA, /\{datos\.retirado \? \(\n\s*<span className="etiqueta-de-dato item-del-editor__retirado" data-marca-retirado>\n\s*\{COPY_ALIMENTOS\.retirado\}/);
  // Se marca, no se esconde: la fila sigue y el lector oye por qué hay que cambiarlo.
  assert.match(FILA, /<span className="visualmente-oculto">\. \{COPY_ALIMENTOS\.retiradoParaActivar\}<\/span>/);
});

test('NUA-02 · el editor lee lo citado por su identidad (API-ALI-04), no por su nombre en el buscador', () => {
  assert.match(EDITOR, /const r = await api\.consultarAlimentos\(token, lote\);/);
  assert.doesNotMatch(EDITOR, /api\.buscarEnCatalogo\(token, nombre/, 'por el nombre, lo retirado no volvía y quedaba «sin composición»');
  assert.match(EDITOR, /setAlimentos\(\(m\) => new Map\(\[\.\.\.m, \.\.\.lote\.map\(\(id\) => \[id, datosDelAlimento\(porId\.get\(id\)\)\] as const\)\]\)\);/);
  assert.match(EDITOR, /<ContextoDeLosAlimentos\.Provider value=\{alimentos\}>/);
  // Lo que se suma en el cuadro de la opción trae su grupo al editor.
  assert.match(EDITOR, /setAlimentos\(\(m\) => new Map\(\[\.\.\.m, \.\.\.nuevos\.alimentos\]\)\);/);
});

// ─── NUA-03 y NUA-04 · el buscador ─────────────────────────────────────────────────────────────────────────────

test('NUA-03 · el nivel a la vista; lo de otro profesional se mira antes de sumarlo', () => {
  assert.equal(A.etiquetaDelNivel({ originLevel: 'VERIFIED' }), 'Verificado');
  assert.equal(A.etiquetaDelNivel({ originLevel: 'YOURS' }), 'Tuyo');
  assert.equal(A.etiquetaDelNivel({ originLevel: 'OTHER_PROFESSIONAL' }), 'De otro profesional');
  assert.equal(A.etiquetaDelNivel({ originLevel: 'UNVERIFIED' }), null);
  assert.equal(A.etiquetaDelNivel({}), null, 'una API anterior no lo manda');
  assert.equal(A.pideMirarAntesDeSumar({ originLevel: 'OTHER_PROFESSIONAL' }), true);
  for (const n of ['VERIFIED', 'YOURS', 'UNVERIFIED', undefined]) assert.equal(A.pideMirarAntesDeSumar({ originLevel: n }), false, String(n));
  // En el cuadro: elegirlo abre «mirar antes de sumar» en vez de sumarlo, con la composición y las dos salidas.
  assert.match(CUADRO, /if \(pideMirarAntesDeSumar\(r\.alimento\)\) return setPorMirar\(r\.alimento\);\n\s*sumar\(r\.alimento\);/);
  assert.match(CUADRO, /<p className="nota">\{COPY_ALIMENTOS\.avisoDeOtroProfesional\}<\/p>/);
  assert.match(CUADRO, /\{COPY_ALIMENTOS\.sumarIgual\}/);
  assert.match(CUADRO, /\{COPY_ALIMENTOS\.volverABuscar\}/);
  // El aviso no nombra a quien lo cargó.
  assert.doesNotMatch(d.COPY_ALIMENTOS.avisoDeOtroProfesional, /\$\{/);
});

test('NUA-04 · el verificado equivalente va justo antes del que lo tiene, y no se repite', () => {
  const oficial = { catalogItemId: 'oficial', name: 'Arroz blanco de grano largo, cocido' };
  const filas = [
    { alimento: alimento('a', 'Arroz casero', { verifiedEquivalent: oficial }), habitual: false },
    { alimento: alimento('b', 'Arroz yamaní'), habitual: true },
    { alimento: alimento('c', 'Arroz con leche casero', { verifiedEquivalent: oficial }), habitual: false },
  ];
  const r = A.conSugeridos(filas, (e) => ({ ...e, originLevel: 'VERIFIED' }));
  assert.deepEqual(
    r.map((f) => [f.alimento.catalogItemId, f.sugeridoPor]),
    [
      ['oficial', 'Arroz casero'],
      ['a', null],
      ['b', null],
      ['c', null],
    ],
  );
  assert.equal(r[0].alimento.originLevel, 'VERIFIED');
  assert.equal(r[2].habitual, true);
  // Si el verificado ya venía más arriba, no se repite ni se mueve (la fila lo nombra con `avisoDeEquivalente`).
  const conElOficial = A.conSugeridos([{ alimento: alimento('oficial', oficial.name), habitual: false }, filas[0]], (e) => e);
  assert.deepEqual(conElOficial.map((f) => [f.alimento.catalogItemId, f.sugeridoPor]), [['oficial', null], ['a', null]]);
  assert.equal(A.avisoDeEquivalente(filas[0].alimento), 'Hay uno verificado equivalente: «Arroz blanco de grano largo, cocido».');
  // Si venía más abajo (lo común: «arroz blanco» trae el oficial), sube justo antes, como sugerencia, sin repetirse.
  const masAbajo = A.conSugeridos([filas[0], filas[1], { alimento: alimento('oficial', oficial.name), habitual: true }], (e) => e);
  assert.deepEqual(masAbajo.map((f) => [f.alimento.catalogItemId, f.sugeridoPor, f.habitual]), [['oficial', 'Arroz casero', true], ['a', null, false], ['b', null, true]]);
  assert.ok(CUADRO.includes('{avisoDeEquivalente(r.alimento) && resultados[n - 1]?.sugeridoPor !== r.alimento.name ?'), 'la fila nombra su equivalente si no quedó justo arriba');
  assert.match(CUADRO, /conSugeridos\(resultadosDelBuscador</);
  assert.match(CUADRO, /\{COPY_ALIMENTOS\.equivalenteSugerido\(r\.sugeridoPor\)\}/);
});

test('NUA-05 · cada resultado del buscador lleva el ícono de su grupo', () => {
  assert.match(CUADRO, /<Icono nombre=\{iconoDelAlimento\('foodGroup' in r\.alimento \? r\.alimento\.foodGroup : null\)\} tamano=\{20\} \/>/);
});

// ─── El formulario del alimento ─────────────────────────────────────────────────────────────────────────────────

test('el formulario del alimento: la fibra vacía es «sin dato» (no se manda), y lo que falta se dice por campo', async () => {
  const valores = V.valoresDelAlimento;
  {
    const listo = valores({ nombre: ' Galleta ', kcal: '450', c: '60,5', g: '20', p: '7', fibra: '', grupo: 'SWEETS' });
    assert.equal(listo.tipo, 'listo');
    assert.equal(listo.nombre, 'Galleta');
    assert.deepEqual(listo.composicion, { referenceAmount: '100g', energyKcal: 450, proteinG: 7, carbohydrateG: 60.5, fatG: 20 });
    assert.equal('fiberG' in listo.composicion, false, 'sin dato, nunca cero');
    const conFibra = valores({ nombre: 'Galleta', kcal: '450', c: '60', g: '20', p: '7', fibra: '2,5', grupo: '' });
    assert.equal(conFibra.composicion.fiberG, 2.5);
    assert.equal(conFibra.grupo, null);
    const faltan = valores({ nombre: '', kcal: '', c: 'x', g: '-1', p: '7', fibra: 'abc', grupo: '' });
    assert.deepEqual(Object.keys(faltan.problemas).sort(), ['c', 'fibra', 'g', 'kcal', 'nombre']);
  }
  // Lo que se va a corregir sale de lo que ya tiene: la fibra sin dato queda vacía.
  assert.deepEqual(V.alimentoEscrito({ name: 'Pan', composition: { referenceAmount: '100g', energyKcal: 250.5, proteinG: 8, carbohydrateG: 50, fatG: 2 }, foodGroup: null }), {
    nombre: 'Pan',
    kcal: '250,5',
    c: '50',
    g: '2',
    p: '8',
    fibra: '',
    grupo: '',
  });
  assert.match(FORMULARIO, /const v = valoresDelAlimento\(escrito\);/);
  // NUA-D05 y NUA-D14: compartir es un interruptor a la vista, con el aviso al lado (encendido, el aviso; apagado, que lo
  // ve solo quien lo carga). Lo que se manda es lo que muestra el interruptor.
  assert.match(FORMULARIO, /<input\n\s*type="checkbox"\n\s*role="switch"\n\s*checked=\{compartido\}/);
  assert.match(FORMULARIO, /\{compartido \? COPY_ALIMENTOS\.avisoDeCompartir : COPY_ALIMENTOS\.noSeComparte\}/);
  assert.match(FORMULARIO, /const problema = await alEnviar\(\{ \.\.\.v, compartir: compartir !== null && compartido \}\);/);
  assert.match(d.COPY_ALIMENTOS.avisoDeCompartir, /No escribas datos de personas/);
});

// ─── Segundo tramo · compartir con control (NUA-D14 a D16) ─────────────────────────────────────────────────

test('NUA-D14 · al cargar uno nuevo, el interruptor viene encendido y lo elegido viaja en el pedido', () => {
  const AGREGAR = leer('app/pro/advisees/nutrition/agregar-item.tsx');
  assert.match(AGREGAR, /compartir=\{\{ inicial: true \}\}/);
  assert.match(AGREGAR, /share: v\.compartir \}/);
});

test('NUA-D14 y D15 · lo compartido en palabras y la acción de cada alimento; al corregir, compartir es aparte', () => {
  const compartido = { shared: true, available: true };
  const dejado = { shared: false, stoppedSharing: true, available: true };
  const nunca = { shared: false, available: true };
  const anterior = { shared: false, available: true }; // una API anterior no manda stoppedSharing
  assert.equal(V.estadoDeCompartido(compartido), 'COMPARTIDO');
  assert.equal(V.estadoDeCompartido(dejado), 'DEJADO');
  assert.equal(V.estadoDeCompartido(nunca), 'NUNCA');
  assert.equal(V.estadoDeCompartido(anterior), 'NUNCA');
  assert.equal(V.compartidoEnPalabras(dejado), d.COPY_MIS_ALIMENTOS.dejasteDeCompartir);
  assert.match(V.compartidoEnPalabras(dejado), /Los planes que ya lo usan lo conservan/);
  assert.equal(V.compartidoEnPalabras(nunca), 'Lo ves solo vos.');
  assert.deepEqual(V.accionDeCompartir(compartido), { compartir: false, texto: 'Dejar de compartir' });
  assert.deepEqual(V.accionDeCompartir(nunca), { compartir: true, texto: 'Compartir' });
  // Uno retirado que se comparte se puede dejar de compartir; uno retirado que no, no se comparte.
  assert.deepEqual(V.accionDeCompartir({ shared: true, available: false }), { compartir: false, texto: 'Dejar de compartir' });
  assert.equal(V.accionDeCompartir({ shared: false, available: false }), null);
  // Al corregir: uno compartido no trae interruptor; uno que no se comparte, apagado.
  assert.equal(V.interruptorAlCorregir(compartido), null);
  assert.deepEqual(V.interruptorAlCorregir(dejado), { inicial: false });
  assert.match(MIS_ALIMENTOS, /compartir=\{interruptorAlCorregir\(corrigiendo\)\}/);
  assert.match(MIS_ALIMENTOS, /\.\.\.\(v\.compartir \? \{ share: true \} : \{\}\)/);
  // Dejar de compartir se confirma diciendo qué pasa con lo que ya lo usa.
  assert.match(MIS_ALIMENTOS, /api\.compartirAlimento\(token, alimento\.catalogItemId, \{ shared: compartir \}/);
  assert.match(MIS_ALIMENTOS, /\{compartiendo\?\.compartir \? C\.compartirQuePasa : C\.dejarDeCompartirQuePasa\}/);
  assert.match(d.COPY_MIS_ALIMENTOS.dejarDeCompartirQuePasa, /Los planes que ya lo usan lo conservan/);
  assert.match(d.COPY_MIS_ALIMENTOS.compartirQuePasa, /No escribas datos de personas/);
});

// ─── NUA-01 y NUA-02 · «Mis alimentos» ───────────────────────────────────────────────────────────────────────

test('NUA-04 · lo decidido, en una línea, para el profesional y para la consola', () => {
  const certificado = { review: { state: 'CERTIFIED', certification: { source: 'Rótulo', certifiedAt: '2026-11-19T00:00:00.000Z' }, equivalent: null } };
  const equivalente = { review: { state: 'EQUIVALENT', certification: null, equivalent: { catalogItemId: 'x', name: 'Arroz blanco' } } };
  const pendiente = { review: { state: 'PENDING', certification: null, equivalent: null } };
  assert.equal(V.revisionEnPalabras(certificado), 'Verificado por Administración. Fuente: Rótulo');
  assert.match(V.revisionEnPalabras(equivalente), /equivalente de «Arroz blanco»/);
  assert.equal(V.revisionEnPalabras(pendiente), 'Sin revisión de Administración');
  assert.equal(R.decididoEnPalabras(certificado), 'Verificado · Rótulo');
  assert.equal(R.decididoEnPalabras(pendiente), 'Sin revisar');
});

test('NUA-01 y NUA-02 · «Mis alimentos» corrige y retira contra la versión vista; un conflicto se dice y se relee', () => {
  assert.match(MIS_ALIMENTOS, /api\.corregirAlimento\(\n\s*token,\n\s*corrigiendo\.catalogItemId,\n\s*\{ expectedVersion: corrigiendo\.version,/);
  assert.match(MIS_ALIMENTOS, /api\.retirarAlimento\(token, retirando\.catalogItemId, \{ expectedVersion: retirando\.version \}/);
  assert.equal((MIS_ALIMENTOS.match(/r\.codigo === 'VERSION_CONFLICT'/g) ?? []).length, 2);
  // Retirar se confirma diciendo qué pasa; uno retirado no ofrece ni corregir ni retirar.
  assert.match(MIS_ALIMENTOS, /<p>\{C\.retirarQuePasa\}<\/p>/);
  assert.match(MIS_ALIMENTOS, /\{a\.available \|\| accion \? \(\n\s*<div className="mis-alimentos__acciones">\n\s*\{a\.available \? \(\n\s*<button type="button" className="boton boton--secundario" onClick=\{\(\) => setCorrigiendo\(a\)\} data-corregir>/);
  assert.match(d.COPY_MIS_ALIMENTOS.retirarQuePasa, /No se borra/);
  assert.match(d.COPY_MIS_ALIMENTOS.corregirQuePasa(3), /Nace la versión 3/);
});

// ─── NUA-04 · Administración ─────────────────────────────────────────────────────────────────────────────────

test('NUA-04 · la consola pide la fuente para verificar y el equivalente para marcarlo; no muestra quién lo cargó', async () => {
  {
    assert.equal(R.faltaParaDecidir('CERTIFY', '  ', null), d.COPY_REVISION_DE_ALIMENTOS.faltaLaFuente);
    assert.equal(R.faltaParaDecidir('CERTIFY', 'Rótulo', null), null);
    assert.equal(R.faltaParaDecidir('EQUIVALENT', '', null), d.COPY_REVISION_DE_ALIMENTOS.faltaElEquivalente);
    assert.equal(R.faltaParaDecidir('CLEAR', '', null), null);
  }
  assert.match(REVISION, /expectedVersion: alimento\.version,/);
  assert.match(REVISION, /if \(r\.tipo === 'API' && r\.codigo === 'VERSION_CONFLICT'\) return alDesactualizarse\(\);/);
  assert.doesNotMatch(REVISION, /professional|profesionalId|loadedBy|creadoPor/i, 'la consola no ve quién lo cargó');
  // Segundo tramo (de la revisión adversaria): «Revisar» lleva el foco al formulario, por su título.
  assert.match(REVISION, /useEffect\(\(\) => titulo\.current\?\.focus\(\), \[\]\);/);
  assert.match(REVISION, /<h3 ref=\{titulo\} tabIndex=\{-1\} data-titulo-de-la-revision>/);
  // Nunca «certificación oficial» ni «certificado por BE» (B10-03 §20).
  for (const t of Object.values(d.COPY_REVISION_DE_ALIMENTOS).flatMap((v) => (typeof v === 'string' ? [v] : typeof v === 'object' ? Object.values(v).filter((x) => typeof x === 'string') : []))) {
    assert.deepEqual(d.terminosProhibidosDeAdministracionEn(t), [], t);
  }
});
