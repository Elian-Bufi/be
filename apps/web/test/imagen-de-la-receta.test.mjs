/**
 * WP-NUTRICION-ALIMENTOS · NUA-06 y NUA-07.
 * - NUA-06: la imagen de referencia se elige al crear la receta, con el mismo control que con la receta guardada, y se
 *   carga sola al guardarla: se crea la receta (API-REC-01) y, con la versión que devuelve, se sube el medio y se asocia
 *   (API-REC-05). Si la receta se guardó y la imagen no, se dice, y el reintento carga solo la imagen. La carga se prueba
 *   sin React (`cargar-la-imagen.ts`), con las llamadas simuladas; las pantallas, leyendo el componente.
 * - NUA-07: el nombre de cada comida en el paso 4 del asistente usa el campo común del website.
 *
 * El dominio se lee de este mismo repositorio (`packages/domain/dist`): en la CI es el mismo archivo que `@be/domain`, y
 * en una copia de trabajo que usa el `node_modules` de otra, es el de esta copia y no el de la otra.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

const DOMINIO = new URL('../../../packages/domain/dist/index.js', import.meta.url).href;
// Los `.ts` del website importan a sus vecinos sin extensión, como los resuelve Next: Node necesita que se la agreguen.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  if (especificador === '@be/domain') return siguiente(${JSON.stringify(DOMINIO)}, contexto);
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const I = await import('../src/app/pro/recipes/cargar-la-imagen.ts');
const { ClaveDeIntento } = await import('../src/lib/clave-de-intento.ts');
const R = await import('../src/app/pro/advisees/nutrition/receta-en-el-plan.ts');
const d = await import('@be/domain');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ─── La carga, sin React ─────────────────────────────────────────────────────────────────────────────────────────

let siguiente = 0;
const incierto = (r) => !r.ok && (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA');
/** Una clave de intento como la de `useClaveDeIntento`, sin React. */
function clave() {
  const c = new ClaveDeIntento(() => `clave-${++siguiente}`);
  return { actual: (que = null) => c.actual(que), registrar: (r) => c.registrar(incierto(r)), descartar: () => c.descartar() };
}
const claves = () => ({ subida: clave(), asociacion: clave() });

const RED = { ok: false, tipo: 'RED' };
const rechazo = (codigo, status = 409) => ({ ok: false, tipo: 'API', status, codigo, issues: [] });
const medio = (mediaId) => ({ ok: true, datos: { data: { mediaId } } });
const asociada = (version, mediaId) => ({ ok: true, datos: { data: { recipeId: 'r1', version, name: 'Tarta de zapallitos', image: { mediaId } } } });

/** Las dos llamadas, simuladas: responden en orden (y después, sin red) y anotan con qué se las llamó. */
function pasos({ subidas = [], asociaciones = [] }) {
  const llamadas = { subir: [], asociar: [] };
  return {
    llamadas,
    subir: async (c) => (llamadas.subir.push({ clave: c }), subidas.shift() ?? RED),
    asociar: async (medioId, expectedVersion, c) => (llamadas.asociar.push({ medioId, expectedVersion, clave: c }), asociaciones.shift() ?? RED),
  };
}
const datos = (extra) => ({ version: 'v1', subido: null, claves: claves(), queSeSube: '["foto.jpg",1000,"PERSON_PROVIDED",null]', sesionPerdida: () => false, ...extra });

test('NUA-06 · se sube la imagen y se asocia con la versión que devolvió la creación de la receta', async () => {
  const p = pasos({ subidas: [medio('m1')], asociaciones: [asociada('v2', 'm1')] });
  const r = await I.cargarLaImagen(p, datos({ version: 'v1-de-la-creacion' }));
  assert.equal(r.tipo, 'asociada');
  assert.equal(r.receta.image.mediaId, 'm1');
  assert.equal(p.llamadas.subir.length, 1);
  assert.deepEqual(
    p.llamadas.asociar.map((x) => [x.medioId, x.expectedVersion]),
    [['m1', 'v1-de-la-creacion']],
  );
});

test('NUA-06 · si la asociación falla, el medio subido se conserva: el reintento solo asocia, con la misma clave si quedó incierto', async () => {
  const c = claves();
  const p = pasos({ subidas: [medio('m1')], asociaciones: [RED, asociada('v2', 'm1')] });
  const primero = await I.cargarLaImagen(p, datos({ claves: c }));
  assert.deepEqual(primero, { tipo: 'fallo', motivo: 'NO_CARGADA', subido: 'm1' });
  const reintento = await I.cargarLaImagen(p, datos({ claves: c, subido: primero.subido }));
  assert.equal(reintento.tipo, 'asociada');
  assert.equal(p.llamadas.subir.length, 1, 'la imagen no se sube dos veces');
  assert.equal(p.llamadas.asociar.length, 2);
  assert.equal(p.llamadas.asociar[1].clave, p.llamadas.asociar[0].clave, 'sin respuesta, el reintento reusa la clave: el servidor responde lo que ya hizo');
});

test('NUA-06 · una subida sin respuesta se reintenta con su clave; con otra procedencia es otro intento, con otra', async () => {
  const c = claves();
  const p = pasos({ subidas: [RED, RED, RED] });
  const uno = '["foto.jpg",1000,"PERSON_PROVIDED",null]';
  assert.deepEqual(await I.cargarLaImagen(p, datos({ claves: c, queSeSube: uno })), { tipo: 'fallo', motivo: 'NO_CARGADA', subido: null });
  await I.cargarLaImagen(p, datos({ claves: c, queSeSube: uno }));
  await I.cargarLaImagen(p, datos({ claves: c, queSeSube: '["foto.jpg",1000,"AI_GENERATED",null]' }));
  const [a, b, otra] = p.llamadas.subir.map((x) => x.clave);
  assert.equal(a, b);
  assert.notEqual(otra, a);
  assert.equal(p.llamadas.asociar.length, 0, 'sin medio, no se asocia');
});

test('NUA-06 · lo que la API rechaza de la imagen pide otro archivo; el 409 de la versión, actualizar; la sesión vencida no dice nada', async () => {
  for (const codigo of ['FILE_TYPE_NOT_ALLOWED', 'FILE_SIZE_NOT_ALLOWED', 'FILE_CONTENT_INVALID']) {
    const p = pasos({ subidas: [rechazo(codigo, 422)] });
    assert.deepEqual(await I.cargarLaImagen(p, datos()), { tipo: 'fallo', motivo: 'INVALIDA', subido: null }, codigo);
    assert.equal(p.llamadas.asociar.length, 0);
  }
  const conflicto = pasos({ subidas: [medio('m1')], asociaciones: [rechazo('VERSION_CONFLICT')] });
  assert.deepEqual(await I.cargarLaImagen(conflicto, datos()), { tipo: 'fallo', motivo: 'RECETA_CAMBIO', subido: 'm1' });
  const vencida = pasos({ subidas: [rechazo('AUTH_REQUIRED', 401)] });
  assert.deepEqual(await I.cargarLaImagen(vencida, datos({ sesionPerdida: (r) => !r.ok && r.status === 401 })), { tipo: 'sesion-perdida', subido: null });
  assert.equal(vencida.llamadas.asociar.length, 0);
  // Si vence al asociarla, el medio ya subido viaja: el reintento solo asocia.
  const alAsociar = pasos({ subidas: [medio('m2')], asociaciones: [rechazo('AUTH_REQUIRED', 401)] });
  assert.deepEqual(await I.cargarLaImagen(alAsociar, datos({ sesionPerdida: (r) => !r.ok && r.status === 401 })), { tipo: 'sesion-perdida', subido: 'm2' });
});

test('DL-180, segundo tramo · si la sesión vence mientras se carga la imagen de una receta recién creada, al volver se dice y se reintenta', () => {
  const pendiente = { recetaId: 'r1', elegida: { archivo: { name: 'a.jpg', size: 1 } }, procedencia: 'PROPIA', autoria: '', subido: null, motivo: 'NO_CARGADA', claves: null };
  assert.equal(I.laImagenSinCargar(), null);
  I.anotarLaImagenSinCargar('Tarta de prueba', pendiente);
  assert.deepEqual(I.laImagenSinCargar(), { recetaId: 'r1', nombre: 'Tarta de prueba' });
  // Otra receta no la toma; la suya, una sola vez.
  assert.equal(I.tomarLaImagenSinCargar('otra'), null);
  assert.equal(I.tomarLaImagenSinCargar('r1'), pendiente);
  assert.equal(I.tomarLaImagenSinCargar('r1'), null);
  assert.equal(I.laImagenSinCargar(), null);
  I.anotarLaImagenSinCargar('Tarta de prueba', pendiente);
  I.olvidarLaImagenSinCargar();
  assert.equal(I.laImagenSinCargar(), null);
  assert.match(d.COPY_RECETAS.imagenSinCargarPorLaSesion('Tarta'), /^«Tarta» quedó guardada, pero la sesión venció/);
  // El editor la anota en vez de callarse; «Mis recetas» y el plan lo dicen al volver, con el reintento.
  const editor = leer('app/pro/recipes/editor-de-receta.tsx');
  assert.match(editor, /if \(conImagen\?\.tipo === 'sesion-perdida'\) return anotarLaImagenSinCargar\(creada\.name, conImagen\.pendiente\);/);
  const recetas = leer('app/pro/recipes/mis-recetas.tsx');
  assert.match(recetas, /<AvisoDeLaImagenSinCargar\n\s*key=\{recetaId \?\? 'lista'\}\n\s*alReintentar=\{\(id\) => \{\n\s*setImagenPendiente\(tomarLaImagenSinCargar\(id\)\);/);
  assert.match(leer('app/pro/advisees/nutrition/editor.tsx'), /<AvisoDeLaImagenSinCargar alReintentar=\{\(id\) => antesDeSalir\(\(\) => router\.push\(/);
});

test('NUA-06 · recién creada la receta, la falla dice que quedó guardada y que el reintento no la vuelve a crear', () => {
  const C = d.COPY_RECETAS;
  // Con la receta guardada de antes, lo de siempre.
  assert.equal(I.textoDeLaFalla('NO_CARGADA', false), C.imagenNoCargada);
  assert.equal(I.textoDeLaFalla('INVALIDA', false), C.imagenInvalida);
  assert.equal(I.textoDeLaFalla('RECETA_CAMBIO', false), d.COPY_VINCULO.contenidoCambio);
  // Recién creada: primero, que la receta quedó guardada; nunca «La receta no cambió».
  for (const motivo of ['NO_CARGADA', 'INVALIDA', 'RECETA_CAMBIO']) {
    const texto = I.textoDeLaFalla(motivo, true);
    assert.match(texto, /^La receta quedó guardada,/, motivo);
    assert.doesNotMatch(texto, /no cambió:/, motivo);
  }
  assert.match(I.textoDeLaFalla('NO_CARGADA', true), /se carga solo la imagen, sin volver a crear la receta\.$/);
  assert.equal(I.textoDeLaFalla('INVALIDA', true), `${C.guardadaSinLaImagen} ${C.imagenInvalida}`);
});

test('NUA-06 · el cuadro del plan: con la imagen cargada se cierra; si falló, la reintenta; sin imagen, la ofrece como antes', () => {
  assert.equal(I.pasoDeLaFotoTrasCrear({ tipo: 'cargada' }), 'cerrar');
  assert.equal(I.pasoDeLaFotoTrasCrear({ tipo: 'pendiente', pendiente: {} }), 'reintentar');
  assert.equal(I.pasoDeLaFotoTrasCrear(I.SIN_IMAGEN), 'ofrecer');
});

test('NUA-06 · los textos nuevos ubican y no califican, sin las palabras prohibidas', () => {
  const C = d.COPY_RECETAS;
  const textos = [C.imagenDeReferenciaOpcional, C.seCargaAlGuardar, C.quitarImagenElegida, C.guardadaSinLaImagen, C.imagenNoCargadaTrasGuardar, C.reintentarImagen, R.COPY_RECETA_NUEVA.imagenSinCargar];
  for (const t of textos) {
    assert.equal(typeof t, 'string');
    assert.doesNotMatch(t, /asesorad|cumplimiento|adherencia|racha|puntaje/i, t);
  }
  // El texto que ya no corresponde: la imagen se puede elegir antes de guardar.
  assert.equal(C.guardaAntesDeLaImagen, undefined);
});

// ─── Las pantallas (se lee el componente, sin React en las pruebas) ──────────────────────────────────────────────

const EDITOR = leer('app/pro/recipes/editor-de-receta.tsx');
const IMAGEN = leer('app/pro/recipes/imagen-de-receta.tsx');
const MIS_RECETAS = leer('app/pro/recipes/mis-recetas.tsx');
const PLAN = leer('app/pro/advisees/nutrition/editor.tsx');

test('NUA-06 · la receta nueva lleva la imagen en su formulario, antes de guardar, con el mismo control que la guardada', () => {
  const formulario = EDITOR.slice(EDITOR.indexOf('<form '), EDITOR.indexOf('</form>'));
  const nueva = formulario.indexOf('<ImagenDeLaRecetaNueva id={ID_DE_LA_IMAGEN} imagen={imagen}');
  assert.ok(nueva > 0, 'la imagen va adentro del formulario de la receta nueva');
  assert.ok(nueva < formulario.indexOf('type="submit"'), 'antes de los botones de guardar');
  assert.match(formulario, /\{cargada \? null : \(\n\s*<section className="seccion" aria-label=\{COPY_RECETAS\.imagenDeReferencia\}>/);
  assert.doesNotMatch(EDITOR, /guardaAntesDeLaImagen/);
  // El mismo control en las dos (`EleccionDeImagen`), con la revisión de `lib/medios` y una sola subida y asociación.
  const deLaNueva = IMAGEN.slice(IMAGEN.indexOf('export function ImagenDeLaRecetaNueva('), IMAGEN.indexOf('export function ImagenDeReceta('));
  const deLaGuardada = IMAGEN.slice(IMAGEN.indexOf('export function ImagenDeReceta('));
  assert.match(deLaNueva, /<EleccionDeImagen id=\{id\} imagen=\{imagen\} hayGuardada=\{false\}/);
  assert.match(deLaGuardada, /<EleccionDeImagen id=\{id\} imagen=\{imagen\} hayGuardada=\{guardada !== null\}/);
  assert.match(IMAGEN, /const revision = await revisarImagen\(archivo\);/);
  assert.match(IMAGEN, /subir: \(clave\) => subirImagen\(token, elegida, \{ finalidad: 'RECIPE_REFERENCE', procedencia, autoria: declarada \}, clave\),/);
  assert.match(IMAGEN, /asociar: \(mediaId, expectedVersion, clave\) => api\.asociarImagenDeReceta\(token, receta\.recipeId, \{ mediaId, expectedVersion \}, clave\),/);
  assert.equal(IMAGEN.split('subirImagen(').length - 1, 1, 'una sola subida');
  assert.equal(IMAGEN.split('api.asociarImagenDeReceta(').length - 1, 1, 'una sola asociación');
  assert.doesNotMatch(EDITOR, /subirImagen\(|asociarImagenDeReceta\(/, 'el editor no sube por su cuenta: usa la pieza común');
  // En la receta nueva no hay «Cargar imagen»: se carga al guardar, y se puede quitar lo elegido.
  assert.doesNotMatch(deLaNueva, /cargarImagen/);
  assert.match(deLaNueva, /COPY_RECETAS\.seCargaAlGuardar/);
  assert.match(deLaNueva, /imagen\.quitar\(\);\n\s*alCambiar\(\);\n\s*\/\/[^\n]*\n\s*imagen\.entrada\.current\?\.focus\(\);/);
});

test('NUA-06 · al guardar la receta nueva, primero se crea; la imagen se carga con la versión de la creación, y si falla no se crea de nuevo', () => {
  assert.match(EDITOR, /const creada = r\.datos\.data;\n\s*const conImagen = imagen\.elegida \? await imagen\.cargar\(creada, true\) : null;/);
  assert.match(EDITOR, /if \(conImagen\?\.tipo === 'asociada'\) return onGuardada\(conImagen\.receta, `\$\{COPY_RECETAS\.guardada\} \$\{COPY_RECETAS\.imagenCargada\}`, enLaComida, \{ tipo: 'cargada' \}\);/);
  assert.match(EDITOR, /if \(conImagen\?\.tipo === 'fallo'\) return onGuardada\(creada, COPY_RECETAS\.guardada, enLaComida, \{ tipo: 'pendiente', pendiente: conImagen\.pendiente \}\);/);
  // Una versión nueva de una receta guardada no toca la imagen (va en la receta, no en la versión).
  assert.match(EDITOR, /return onGuardada\(r\.datos\.data, COPY_RECETAS\.versionNueva\(r\.datos\.data\.versionNumber\), enLaComida, SIN_IMAGEN\);/);
  assert.equal(EDITOR.split('api.crearReceta(').length - 1, 1);
  assert.doesNotMatch(IMAGEN, /crearReceta/, 'reintentar la imagen nunca crea la receta');
  // La procedencia de la imagen elegida es parte de lo que el formulario valida: va al resumen y marca su campo.
  assert.match(EDITOR, /if \(!cargada && imagen\.elegida && !imagen\.procedencia\) problemas\.push\(\{ id: `\$\{ID_DE_LA_IMAGEN\}-procedencia`, texto: COPY_RECETAS\.faltaLaProcedencia \}\);/);
  assert.match(EDITOR, /errorDeProcedencia=\{porCampo\[`\$\{ID_DE_LA_IMAGEN\}-procedencia`\] \?\? null\}/);
  // Lo elegido cuenta como algo escrito: salir o cerrar el cuadro preguntan. Mientras se carga, el botón lo dice.
  assert.match(EDITOR, /alCambiar=\{cambiar\} \/>/);
  assert.match(EDITOR, /\{enviando \? \(imagen\.cargando \? COPY_RECETAS\.cargandoImagen : COPY_RECETAS\.guardando\) : COPY_RECETAS\.guardar\}/);
});

test('NUA-06 · la receta guardada retoma la imagen pendiente: la falla a la vista, «Reintentar la imagen» y las mismas claves', () => {
  assert.match(IMAGEN, /const \[falla, setFalla\] = useState<FallaDeLaImagen \| null>\(pendiente \? \{ motivo: pendiente\.motivo, trasGuardar: true \} : null\);/);
  assert.match(IMAGEN, /const claves = useRef<ClavesDeLaImagen>\(pendiente\?\.claves \?\? \{ subida: subidaPropia, asociacion: asociacionPropia \}\)\.current;/);
  assert.match(IMAGEN, /const \[subido, setSubido\] = useState<string \| null>\(pendiente\?\.subido \?\? null\);/);
  assert.match(IMAGEN, /imagen\.falla\?\.trasGuardar \? COPY_RECETAS\.reintentarImagen : COPY_RECETAS\.cargarImagen/);
  // El foco va al aviso, que dice que la receta quedó guardada.
  assert.match(IMAGEN, /<Aviso tipo="error" enfocar=\{imagen\.falla\.trasGuardar\}>\n\s*<p>\{textoDeLaFalla\(imagen\.falla\.motivo, imagen\.falla\.trasGuardar\)\}<\/p>/);
  // Cambiar la procedencia o la autoría declara otra cosa: el medio ya subido no sirve.
  assert.match(IMAGEN, /cambiarProcedencia\(valor: string\) \{[\s\S]{0,200}setSubido\(null\);/);
  assert.match(IMAGEN, /cambiarAutoria\(valor: string\) \{\n\s*setAutoria\(valor\);\n\s*setSubido\(null\);/);
  // «Mis recetas» la entrega a esa receta (que se abre en la dirección), una sola vez.
  assert.match(MIS_RECETAS, /setImagenPendiente\(imagen\.tipo === 'pendiente' \? imagen\.pendiente : null\);/);
  assert.match(MIS_RECETAS, /imagenPendiente=\{imagenPendiente && imagenPendiente\.recetaId === recetaId \? imagenPendiente : null\}/);
  assert.match(MIS_RECETAS, /if \(imagenPendiente && imagenPendiente\.recetaId === recetaId\) setImagenPendiente\(null\);/);
  // El editor lleva la misma elección de la receta nueva a la guardada.
  assert.match(EDITOR, /const imagen = useImagenParaCargar\(token, sesionPerdida, imagenPendiente\);/);
  assert.match(EDITOR, /<ImagenDeReceta\n\s+token=\{token\}\n\s+receta=\{cargada\}\n\s+sesionPerdida=\{sesionPerdida\}\n\s+imagen=\{imagen\}/);
});

test('NUA-06 · «Receta nueva» desde el plan no pide la imagen dos veces', () => {
  assert.match(PLAN, /if \(pasoDeLaFotoTrasCrear\(imagen\) === 'cerrar'\) \{\n\s*setRecetaNueva\(null\);\n\s*setFotoDeLaReceta\(null\);\n\s*return setMensaje\(\{ tipo: 'exito', texto: `\$\{texto\} \$\{COPY_RECETAS\.imagenCargada\}` \}\);/);
  assert.match(PLAN, /setFotoDeLaReceta\(\{ receta: r, texto, aviso: null, pendiente: imagen\.tipo === 'pendiente' \? imagen\.pendiente : null \}\);/);
  assert.match(PLAN, /<ImagenDeReceta\n\s+token=\{token\}\n\s+receta=\{fotoDeLaReceta\.receta\}\n\s+sesionPerdida=\{sesionPerdida\}\n\s+pendiente=\{fotoDeLaReceta\.pendiente\}/);
  assert.match(PLAN, /onGuardada=\{\(r, _aviso, agregar, imagen\) => alGuardarLaRecetaNueva\(r, agregar, imagen\)\}/);
  // Si el agregado no se pudo, lo que pasó con la imagen sigue hasta que se agregue.
  assert.match(PLAN, /if \(res\.tipo === 'no-se-pudo'\) return setRecuperar\(\{ receta: r, motivo: res\.motivo, imagen \}\);/);
  assert.match(PLAN, /onClick=\{\(\) => agregarLaRecetaNueva\(recuperar\.receta, recuperar\.imagen\)\}/);
  assert.match(PLAN, /\{recuperar\.imagen\.tipo === 'pendiente' \? <p>\{COPY_RECETA_NUEVA\.imagenSinCargar\}<\/p> : null\}/);
});

// ─── NUA-07 · El paso 4 del asistente de Nutrición ───────────────────────────────────────────────────────────────

const PASOS = leer('app/pro/advisees/nutrition/pasos-del-asistente.tsx');
const ESTILOS = leer('app/globals.css');

test('NUA-07 · el nombre de cada comida del paso 4 usa el campo común del website, con su etiqueta asociada', () => {
  const paso4 = PASOS.slice(PASOS.indexOf('function PasoDeLasComidas('), PASOS.indexOf('function BotonConMotivo('));
  assert.ok(paso4.length > 0);
  assert.equal(paso4.split('<input').length - 1, 1, 'un solo campo de texto en el paso 4');
  assert.match(
    paso4,
    /<div className="campo asistente__nombre">\n\s*<label htmlFor=\{`\$\{id\}-comida-\$\{j\}`\} className="visualmente-oculto">\n\s*\{C\.nombreDeLaComida\(nombreDelDia, j \+ 1\)\}\n\s*<\/label>\n\s*<input id=\{`\$\{id\}-comida-\$\{j\}`\} type="text" /,
  );
  assert.doesNotMatch(paso4, /className="asistente__campo"/, 'el campo suelto, sin la clase común, era el del borde negro y la letra chica');
  // Lo que da la clase común: la letra del website, el borde y el fondo de los tokens (Claro y Azul noche) y 44 px.
  assert.match(ESTILOS, /\.campo input,\n\.campo select,\n\.campo textarea \{\n\s*font: inherit;\n\s*color: var\(--texto\);\n\s*background: var\(--superficie\);\n\s*min-height: 44px;\n[^}]*border: 1px solid var\(--borde-control\);/);
  // La tarjeta separa con `gap`: el margen del campo sobra, y la regla se limita a este campo.
  assert.match(ESTILOS, /WP-NUTRICION-ALIMENTOS · NUA-07[^*]*\*\/\n\.campo\.asistente__nombre \{\n\s*margin: 0;\n\}/);
});

test('NUA-07 · el nombre de cada día tipo del paso 3 tenía el mismo campo suelto: también usa el común', () => {
  const paso3 = PASOS.slice(PASOS.indexOf('{paso === 3 ? ('), PASOS.indexOf('{paso === 4'));
  assert.ok(paso3.length > 0);
  assert.match(paso3, /<div className="campo asistente__nombre">\n\s*<label htmlFor=\{`\$\{id\}-dia-\$\{i\}`\} className="visualmente-oculto">\n\s*\{C\.nombreDelDia\(i \+ 1\)\}\n\s*<\/label>\n\s*<input id=\{`\$\{id\}-dia-\$\{i\}`\} type="text" /);
  assert.doesNotMatch(paso3, /className="asistente__campo"/);
});
