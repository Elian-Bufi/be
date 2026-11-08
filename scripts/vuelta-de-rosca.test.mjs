/**
 * WP-APP-VUELTA-DE-ROSCA (DL-166): las partes solo de app, con sus oráculos TEST-AVR
 * (`docs/paquetes/WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`). Lógica pura de la APK, sin teléfono: la regla de los
 * desplegables, la barra con Perfil y dónde quedó cada cosa, Perfil y su marca, «Quién ve qué», Inicio, el desglose de
 * «Tu historial», los íconos nuevos y la sesión (el descanso automático, sus ajustes, el aviso del 100 %, la fila fija y
 * «Empezar serie N»).
 *
 * **Lo que esto no prueba:** el dibujo, TalkBack, la vibración con la pantalla bloqueada ni la letra al máximo en un
 * teléfono. Eso queda para la candidata (AV-16).
 * Uso: node --test scripts/vuelta-de-rosca.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Los módulos de la APK se importan entre sí sin extensión, como los resuelve Metro: Node necesita que se la agreguen.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MOVIL = join(RAIZ, 'apps/mobile/src');
const leer = (archivo) => readFileSync(join(MOVIL, archivo), 'utf8');
/** Todos los archivos de la APK, con App.tsx. */
function archivosDeLaApk() {
  const lista = [join(RAIZ, 'apps/mobile/App.tsx')];
  const recorrer = (dir) => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (/\.tsx?$/.test(nombre) && !/\.test\.ts$/.test(nombre)) lista.push(ruta);
    }
  };
  recorrer(MOVIL);
  return lista;
}

const desplegable = await import('../apps/mobile/src/desplegable.ts');

// ─── TEST-AVR-001 · la regla de los desplegables (AV-01) ────────────────────────────────────────

test('TEST-AVR-001 · el desplegable es un botón con su estado y un nombre que dice qué guarda', () => {
  assert.deepEqual(desplegable.accesibilidadDelDesplegable(false, '6 ejercicios · 18 series'), {
    accessibilityRole: 'button',
    accessibilityState: { expanded: false },
    accessibilityLabel: '6 ejercicios · 18 series',
  });
  assert.equal(desplegable.accesibilidadDelDesplegable(true, 'Qué incluye').accessibilityState.expanded, true);
  assert.deepEqual(desplegable.accesibilidadDelDesplegable(true, 'Peso', true).accessibilityState, { expanded: true, selected: true });
});

test('TEST-AVR-001 · el estado, la fecha, quién y si se puede responder nunca se pliegan', () => {
  assert.deepEqual([...desplegable.LO_QUE_NUNCA_SE_PLIEGA].sort(), ['estado', 'fecha', 'quien', 'si-se-puede-responder']);
  for (const c of ['estado', 'fecha', 'quien', 'si-se-puede-responder']) assert.equal(desplegable.sePuedePlegar(c), false, c);
  for (const c of ['para-que', 'que-incluye', 'detalle', 'preparacion', 'cantidades', 'como-funciona']) assert.equal(desplegable.sePuedePlegar(c), true, c);
  assert.deepEqual(desplegable.problemasDelPliegue({ nombre: 'mal', visible: [], plegado: ['para-que', 'fecha'] }), ['fecha']);
});

test('TEST-AVR-001 · un solo desplegable en la APK: nadie declara «expanded» por su cuenta, y la pieza no escribe', () => {
  for (const archivo of archivosDeLaApk()) {
    if (archivo.endsWith('desplegable.ts')) continue;
    assert.doesNotMatch(readFileSync(archivo, 'utf8'), /expanded\s*:/, `${archivo} declara su propio desplegable`);
  }
  const ui = leer('ui.tsx');
  const pieza = ui.slice(ui.indexOf('export function Desplegable('), ui.indexOf('function Chevron('));
  assert.match(pieza, /accesibilidadDelDesplegable\(abierto/);
  assert.doesNotMatch(pieza, /api\.|almacen|AsyncStorage|SecureStore/, 'abrir un desplegable no escribe nada');
  assert.match(ui, /export function Ayuda[\s\S]*?<Desplegable titulo=\{titulo\} variante="ayuda"/, 'la ayuda es una variante de la misma pieza');
});

// ─── TEST-AVR-014 · registrar una comida y responder un formulario (AV-08) ──────────────────────

test('TEST-AVR-014 · «Comí esta opción» queda a la vista; ingredientes, preparación y «Para qué lo pide», plegados', () => {
  const opcion = leer('pantallas/opcion-de-comida.tsx');
  assert.match(opcion, /<Desplegable titulo=\{COPY_REGISTRO_DE_COMIDAS\.ingredientes\}/);
  assert.match(opcion, /<Desplegable titulo=\{COPY_REGISTRO_DE_COMIDAS\.preparacion\}/);
  // El botón de registrar está fuera de todo desplegable: después del último cierre de un desplegable del detalle.
  const detalle = opcion.slice(opcion.indexOf('function DetalleDeLaOpcion'), opcion.indexOf('function FilaDeIngrediente'));
  assert.doesNotMatch(detalle, /comiEstaOpcion/);
  const solicitud = leer('pantallas/formularios.tsx');
  const cabeza = solicitud.slice(solicitud.indexOf('<Titulo>{request.templateName}</Titulo>'), solicitud.indexOf('{/* DL-165 D-1 y D-3'));
  assert.match(cabeza, /\{COPY_FORMULARIOS\.pedidoPor\} \{request\.professional\.displayName\}\s*<\/Parrafo>/, 'quién lo pide, a la vista');
  assert.match(cabeza, /<Desplegable titulo=\{TEXTOS_DE_LA_VUELTA\.paraQueLoPide\}[\s\S]*request\.purpose[\s\S]*podesNoResponder[\s\S]*<\/Desplegable>/);
  // «Queda como declarado por vos» se sigue diciendo una vez, al empezar, fuera de lo plegado (DL-165 D-2).
  assert.match(solicitud, /\{alEmpezar \? <Parrafo tenue>\{COPY_FORMULARIOS\.loQueRespondesEsTuyo\}<\/Parrafo> : null\}/);
  assert.doesNotMatch(cabeza, /loQueRespondesEsTuyo/);
});
