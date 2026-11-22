/**
 * RP-22 · Entrenamiento antes de la prueba (WP-RECORRIDO-PLAN-PULIDO, DL-188). Lo que Dirección marcó al recorrer la
 * planificación de Nutrición, llevado al editor de Entrenamiento, sin React:
 * - los avisos no corren nada (la regla de RP-19): la planilla de series, el bloque en vueltas, el objetivo del criterio,
 *   la barra de las series elegidas, el período y los números de los formularios de la persona;
 * - los números que se escriben como texto (repeticiones, descanso, carga) con su mínimo, su máximo y su paso, con ↑ y ↓
 *   y las flechitas;
 * - lo largo del pie de la tabla, detrás de un «?»;
 * - el resumen de errores de la evaluación con un `id` por problema;
 * - el catálogo a 1280 × 800.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';
import { leerDescanso, leerNumero } from '@be/domain';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const P = await import('../src/app/pro/advisees/training/planilla-de-series.ts');
const leer = (r) => readFileSync(new URL(`../src/${r}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CSS = leer('app/globals.css');
const RP22 = CSS.slice(CSS.indexOf('/* ═══ RP-22'));
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');
const BLOQUE = leer('app/pro/advisees/training/bloque-del-editor.tsx');

const O = { leerNumero, leerDescanso };
const paso = (campo, escrito, desde, sube, extra = {}) => P.conUnPaso(campo, escrito, desde, sube, { ...O, ...extra });

test('RP-22 · las repeticiones dan un paso de 1, de 1 a 1000; un rango o lo que no se entiende no cambian', () => {
  assert.equal(paso('repetitions', '8', null, true), 9);
  assert.equal(paso('repetitions', '8', null, false), 7);
  assert.equal(paso('repetitions', '8', null, true, { grande: true }), 12, 'con Mayúsculas, cuatro');
  assert.equal(paso('repetitions', '1', null, false), null, 'en el mínimo no baja');
  assert.equal(paso('repetitions', '1000', null, true), null, 'en el máximo no sube');
  assert.equal(paso('repetitions', '8-12', null, true), null, 'un rango no tiene paso');
  assert.equal(paso('repetitions', 'abc', null, true), null);
  assert.equal(paso('repetitions', '', null, true), 8, 'vacía, la primera flecha escribe un valor de partida');
});

test('RP-22 · el descanso da pasos de 15 s, de 00:00 a 60:00, y parte del valor común si la celda está vacía', () => {
  assert.equal(paso('restSeconds', '02:30', null, true), 165);
  assert.equal(paso('restSeconds', '02:30', null, false), 135);
  assert.equal(paso('restSeconds', '150', null, true, { grande: true }), 210, 'con Mayúsculas, un minuto');
  assert.equal(paso('restSeconds', '01:40', null, true), 105, 'fuera de la grilla, al paso siguiente');
  assert.equal(paso('restSeconds', '01:40', null, false), 90);
  assert.equal(paso('restSeconds', '00:00', null, false), null, 'en cero no baja');
  assert.equal(paso('restSeconds', '60:00', null, true), null, 'una hora es el tope');
  assert.equal(paso('restSeconds', '', 90, true), 105, 'vacía, desde el común');
  assert.equal(paso('restSeconds', '', null, true), 60);
});

test('RP-22 · la carga da pasos de 2,5 kg (5 lb), desde 0, en la grilla del paso', () => {
  assert.equal(paso('suggestedLoad', '60', null, true), 62.5);
  assert.equal(paso('suggestedLoad', '62,5', null, false), 60);
  assert.equal(paso('suggestedLoad', '62', null, true), 62.5, 'fuera de la grilla, al paso siguiente');
  assert.equal(paso('suggestedLoad', '62', null, false), 60);
  assert.equal(paso('suggestedLoad', '100', null, true, { unidad: 'lb' }), 105);
  assert.equal(paso('suggestedLoad', '100', null, true, { grande: true }), 110, 'con Mayúsculas, 10 kg');
  assert.equal(paso('suggestedLoad', '0', null, false), null, 'no baja de 0');
  assert.equal(paso('suggestedLoad', '1', null, false), 0);
  assert.equal(paso('suggestedLoad', '', 125, true), 127.5, 'vacía, desde el común');
  assert.equal(paso('suggestedLoad', 'x', null, true), null);
});

test('RP-22 · lo que sale de los límites del contrato no se entiende: una carga negativa, un descanso de más de una hora', () => {
  assert.equal(P.leerCargaDeLaPlanilla('-5', leerNumero), null);
  assert.equal(P.leerCargaDeLaPlanilla('0', leerNumero), 0);
  assert.equal(P.leerCargaDeLaPlanilla('62,5', leerNumero), 62.5);
  assert.equal(P.leerDescansoDeLaPlanilla('60:00', leerDescanso), 3600);
  assert.equal(P.leerDescansoDeLaPlanilla('3601', leerDescanso), null);
  assert.deepEqual(P.LIMITES_DE_LA_PLANILLA.repeticiones, { minimo: 1, maximo: 1000, paso: 1 });
  // Las celdas de la planilla y la fila Común leen con los límites.
  assert.match(EJERCICIO, /leer=\{leerCargaDeLaSerie\}/);
  assert.match(EJERCICIO, /leer=\{leerDescansoDeLaSerie\}/);
  assert.match(EJERCICIO, /interpretar=\{leerLaCarga\}/);
  // «Escribir en N series» lee con los mismos límites: antes dejaba pasar «-5» o «61:00», que el contrato rechaza al
  // guardar (el autoguardado fallaba con lo escrito a la vista y sin marca).
  const elegidas = EJERCICIO.slice(EJERCICIO.indexOf('const escribirEnLasElegidas'), EJERCICIO.indexOf('const pedirQuitar'));
  assert.match(elegidas, /campo === 'restSeconds' \? leerDescansoDeLaSerie\(valor\) : campo === 'suggestedLoad' \? leerCargaDeLaSerie\(valor\)/);
  assert.doesNotMatch(elegidas, /leerDescanso\(valor\)/);
});

test('RP-22 · lo que no se entiende en la planilla se dice en un renglón, con la celda, cómo se escribe y cuántas más', () => {
  const rotulos = ['la serie 1', 'la serie 2'];
  const bien = { suggestedLoad: { value: 60 }, restSeconds: 90, sets: [{ repetitions: { value: 8 } }, { repetitions: { min: 8, max: 12 } }] };
  assert.deepEqual(P.loQueNoSeEntiendeEnLasSeries('e', bien, rotulos), []);
  assert.equal(P.textoDeLoQueNoSeEntiende([]), null);
  const una = P.loQueNoSeEntiendeEnLasSeries('e', { ...bien, restSeconds: Number.NaN }, rotulos);
  assert.deepEqual(una.map((c) => c.id), ['e-descanso']);
  assert.equal(P.textoDeLoQueNoSeEntiende(una), 'No se entiende el descanso común: va como 02:30 o en segundos, hasta 60:00.');
  const dos = P.loQueNoSeEntiendeEnLasSeries('e', { ...bien, sets: [{ repetitions: { value: Number.NaN } }, { repetitions: null, suggestedLoad: { value: Number.NaN } }] }, rotulos);
  assert.deepEqual(dos.map((c) => c.id), ['e-serie-0', 'e-serie-1-carga']);
  assert.equal(P.textoDeLoQueNoSeEntiende(dos), 'No se entienden las repeticiones de la serie 1: va de 1 a 1000, o un rango como 8-12. Y 1 más, marcada.');
  const tres = P.loQueNoSeEntiendeEnLasSeries('e', { suggestedLoad: { value: Number.NaN }, restSeconds: Number.NaN, sets: [{ repetitions: null, rir: Number.NaN }] }, rotulos);
  assert.match(P.textoDeLoQueNoSeEntiende(tres), /\. Y 2 más, marcadas\.$/);
  // Corto, para que entre en un renglón a 1440 con el panel abierto (la tabla, de unos 680 px): con dos avisos, el de antes
  // pasaba a dos renglones y bajaba «Agregar serie» 20 px (la CI). Con uno, dos o tres avisos, hasta 75 caracteres.
  const comun = { suggestedLoad: { value: Number.NaN }, restSeconds: Number.NaN, sets: [{ repetitions: { value: Number.NaN } }, { repetitions: null }] };
  for (const n of [1, 2, 3]) assert.ok(P.textoDeLoQueNoSeEntiende(P.loQueNoSeEntiendeEnLasSeries('e', comun, rotulos).slice(0, n)).length <= 75, `${n} aviso(s)`);
  // El renglón tiene alto fijo y es uno: si en un ancho muy justo no entra, «…», con el texto entero en el título.
  const renglon = RP22.slice(RP22.indexOf('.ejercicio-del-editor__series > .renglon-del-aviso {'));
  assert.match(renglon.slice(0, renglon.indexOf('}')), /height: 1\.55rem;[\s\S]*white-space: nowrap;\n\s*text-overflow: ellipsis;/);
  assert.match(EJERCICIO, /anunciar title=\{textoDelAviso \?\? undefined\} data-lo-que-no-se-entiende/);
});

test('RP-22 · la planilla de series: ningún aviso dentro de una fila; el renglón reservado debajo de la tabla y el de la barra', () => {
  // La fila Común ya no pone un párrafo dentro de la celda (alargaba la fila mientras se escribía).
  const general = EJERCICIO.slice(EJERCICIO.indexOf('function CeldaGeneral('), EJERCICIO.indexOf('function CeldaDeRepeticiones('));
  assert.doesNotMatch(general, /campo__error/);
  // El renglón, siempre en la página con series, con `aria-live` (el lector lo oye) y nombrado por cada celda mal escrita.
  assert.match(EJERCICIO, /<RenglonDelAviso id=\{aviso\} tipo=\{queNoSeEntiende\.length > 0 \? 'error' : 'nota'\} anunciar/);
  assert.match(EJERCICIO, /aria-describedby=\{celda\.estado === 'no-se-entiende' && aviso \? `\$\{id\}-estado \$\{aviso\}` : `\$\{id\}-estado`\}/);
  // La barra de las elegidas: el aviso en su renglón, siempre (al tocar «Escribir», la tabla no baja).
  const barra = EJERCICIO.slice(EJERCICIO.indexOf('data-series-elegidas'), EJERCICIO.indexOf('<table className="tabla series-del-editor"'));
  assert.match(barra, /<RenglonDelAviso id=\{`\$\{id\}-elegidas-no-se-entiende`\}/);
  assert.doesNotMatch(barra, /\{noSeEntiende \? \(\n\s*<p/);
  // El objetivo del criterio avisa al pie del recuadro (en la fila, desalineaba los campos alineados por abajo).
  assert.match(EJERCICIO, /avisoAparte=\{\{ id: `\$\{id\}-objetivo-aviso`, onMal: setObjetivoMal \}\}/);
  assert.match(EJERCICIO, /<RenglonDelAviso id=\{`\$\{id\}-objetivo-aviso`\}/);
  // Un campo que no puede avisar (el valor de un parámetro) no reserva un renglón vacío.
  assert.match(EJERCICIO, /error=\{noSeEntiende \? \(mal \? noSeEntiende : null\) : undefined\}/);
});

test('RP-22 · el pie de la tabla: lo largo detrás de un «?», con las flechas y los atajos', () => {
  const pie = EJERCICIO.slice(EJERCICIO.indexOf('className="ejercicio-del-editor__pie-de-series"'));
  const pregunta = pie.slice(pie.indexOf('<ExplicacionAPedido'), pie.indexOf('</ExplicacionAPedido>'));
  for (const x of ['data-como-se-lee-cada-valor', 'data-ayuda-del-calentamiento', 'PL.atajo', 'flechasEnLaTabla']) assert.ok(pregunta.includes(x), `${x} va detrás del «?»`);
  assert.equal((pie.slice(0, pie.indexOf('<ExplicacionAPedido')).match(/<p className="nota"/g) ?? []).length, 0, 'ningún párrafo a la vista antes del «?»');
});

test('RP-22 · las flechitas: reservan su lugar, no reciben el foco, no le sacan el foco al campo y el lector no las recorre', () => {
  const F = leer('components/flechas-del-numero.tsx');
  assert.equal((F.match(/tabIndex=\{-1\} className/g) ?? []).length, 2);
  assert.equal((F.match(/onMouseDown=\{\(e\) => e\.preventDefault\(\)\}/g) ?? []).length, 2);
  // El lector no las recorre: el campo ya da el paso con ↑ y ↓ (y en una tabla serían dos botones más por celda).
  assert.match(F, /<span className="con-flechas__flechas" aria-hidden="true">/);
  assert.match(RP22, /\.con-flechas > input \{\n\s*padding-inline-end: 1\.5rem;/);
  assert.match(RP22, /\.con-flechas:focus-within > \.con-flechas__flechas/);
  // Donde van: las repeticiones, la carga y el descanso comunes y el descanso del bloque. El RIR y el % RM son del
  // criterio de intensidad (otro frente): no tienen paso.
  assert.equal((EJERCICIO.match(/<ConFlechas /g) ?? []).length, 2);
  assert.match(BLOQUE, /<ConFlechas que=\{B\.descansoAlTerminarLaVuelta\.toLowerCase\(\)\}/);
  assert.doesNotMatch(EJERCICIO.slice(EJERCICIO.indexOf("id={`${id}-serie-${n}-rir`}"), EJERCICIO.indexOf("id={`${id}-serie-${n}-rir`}") + 500), /paso=/);
});

test('RP-22 · el bloque en vueltas: el aviso del descanso va en el renglón de la indicación, que está siempre', () => {
  const cabecera = BLOQUE.slice(BLOQUE.indexOf('<div className="bloque-del-editor__cabecera">'), BLOQUE.indexOf('<MenuDeAcciones'));
  assert.doesNotMatch(cabecera, /campo__error/, 'la cabecera ya no crece con el aviso');
  assert.match(BLOQUE, /\{enVueltas \? \(\n\s*descansoMal \? \(\n\s*<RenglonDelAviso id=\{`\$\{id\}-indicacion`\} tipo="error"/);
  assert.match(BLOQUE, /data-indicacion-del-bloque=\{ejercicios > 0 \? '' : 'vacia'\}/);
  assert.match(RP22, /\.renglon-del-aviso\.bloque-del-editor__indicacion \{\n\s*display: flex;/);
});

test('RP-22 · una celda mal escrita se marca sin cambiar de tamaño (el segundo píxel es una sombra)', () => {
  const regla = RP22.slice(RP22.indexOf(".celda-de-objetivo[data-estado='no-se-entiende'],"), RP22.indexOf('}', RP22.indexOf(".celda-de-objetivo[data-estado='no-se-entiende'],")));
  assert.match(regla, /border-width: 1\.5px;/);
  assert.match(regla, /box-shadow: 0 0 0 1px var\(--error\);/);
});

test('RP-22 · el período y los números de los formularios de la persona: el aviso con su renglón reservado', () => {
  const periodo = leer('app/pro/advisees/control-de-periodo.tsx');
  assert.match(periodo, /<RenglonDelAviso tipo=\{problema \? 'error' : 'nota'\} role="alert"/);
  assert.doesNotMatch(periodo, /\{problema \? \(\n\s*<p className="campo__error"/);
  const campos = leer('app/pro/advisees/forms/campos-v2.tsx');
  assert.match(campos, /<RenglonDelAviso id=\{`\$\{id\}-ilegible`\} tipo=\{ilegible \? 'error' : 'nota'\}/);
  assert.doesNotMatch(campos, /\{ilegible \? \(\n\s*<p id=\{`\$\{id\}-ilegible`\}/);
});

test('RP-22 · la evaluación de Entrenamiento: un `id` por problema en el resumen y los avisos con su lugar', () => {
  const resumen = leer('app/pro/advisees/training/resumen.tsx');
  // Antes, el exceso de citas y el conflicto llevaban los dos `trn-contexto`: el resumen los junta por `id` y mostraba dos
  // veces el texto del conflicto.
  assert.match(resumen, /problemas\.push\(\{ id: 'trn-contexto-limite', texto: COPY_ENTRENAMIENTO\.excesoDeCitas \}\)/);
  assert.match(resumen, /problemas\.push\(\{ id: 'trn-contexto-conflicto', texto: COPY_ENTRENAMIENTO\.actualizaAntesDeRegistrar \}\)/);
  assert.match(resumen, /<div id="trn-contexto-conflicto" tabIndex=\{-1\}>/);
  assert.match(resumen, /id="trn-contexto-limite"/);
  assert.match(resumen, /<form className="formulario avisos-con-lugar" onSubmit=\{enviar\} noValidate data-evaluacion-de-entrenamiento>/);
});

test('RP-22 · el catálogo a 1280: «Agregar» sin marcar lo dice en el título de los elegidos, y el cajón es más ancho', () => {
  const catalogo = leer('app/pro/advisees/training/agregar-ejercicio.tsx');
  assert.match(catalogo, /\{falta && marcados\.length === 0 \? V\.sinMarcados : marcados\.length === 0 \? V\.ningunoElegido : V\.elegidos\(marcados\.length\)\}/);
  const pie = catalogo.slice(catalogo.indexOf('pie={'), catalogo.indexOf('<ContenidoDeAgregarEjercicio'));
  assert.equal((pie.match(/V\.sinMarcados/g) ?? []).length, 1, 'un solo lugar para el aviso');
  assert.match(RP22, /@media \(min-width: 80rem\) and \(max-width: 89\.99rem\) \{\n\s*\.cajon:has\(\.agregar-ejercicio\) \{\n\s*width: min\(35rem, 100vw\);/);
});

test('RP-22 · lo nuevo en pantalla no usa palabras prohibidas y cada «%» lleva su base', () => {
  const nuevos = [
    P.textoDeLoQueNoSeEntiende(P.loQueNoSeEntiendeEnLasSeries('e', { suggestedLoad: { value: Number.NaN }, restSeconds: Number.NaN, sets: [{ repetitions: { value: Number.NaN }, rir: Number.NaN, restSeconds: Number.NaN, suggestedLoad: { value: Number.NaN } }] }, ['la serie 1'])),
    leer('components/flechas-del-numero.tsx'),
    EJERCICIO.slice(EJERCICIO.indexOf('const COPY_DE_LOS_NUMEROS'), EJERCICIO.indexOf('} as const;', EJERCICIO.indexOf('const COPY_DE_LOS_NUMEROS'))),
    BLOQUE.slice(BLOQUE.indexOf('const COPY_DEL_DESCANSO'), BLOQUE.indexOf('} as const;', BLOQUE.indexOf('const COPY_DEL_DESCANSO'))),
  ].join('\n');
  for (const palabra of [/cumplimiento/i, /adherencia/i, /racha/i, /puntaje/i, /asesorad/i, /estaci[oó]n/i, /volumen/i]) assert.doesNotMatch(nuevos, palabra);
  assert.doesNotMatch(nuevos, /%/);
});

test('RP-22 · plantillas y habituales sin párrafos a la vista; la vuelta del editor de una plantilla como en las áreas', () => {
  const plantillas = leer('app/pro/templates/mis-plantillas.tsx');
  assert.match(plantillas, /<ExplicacionAPedido nombre="Qué es una plantilla y quién la ve" como="div">\n\s*<p className="nota">\{PLT\.queSeHaceAca\}<\/p>/);
  assert.match(plantillas, /className="campo campo--filtro-angosto"/);
  assert.match(leer('app/pro/templates/mis-habituales.tsx'), /<ExplicacionAPedido nombre="Quién ve tus habituales" como="div">/);
  const edicion = leer('app/pro/advisees/training/edicion-de-plantilla.tsx');
  assert.match(edicion, /className="boton boton--fantasma boton--compacto marco-del-area__volver" data-volver-a-plantillas/);
  assert.match(edicion, /<ExplicacionAPedido nombre="Qué pasa con las cargas sugeridas" como="div">/);
});

test('RP-22 · desplegables legibles y los avisos con su lugar en la revisión y el objetivo', () => {
  assert.match(RP22, /\.criterio-del-ejercicio \.campo:has\(select\[id\$='-base-carga'\]\),\n\.criterio-del-ejercicio \.campo:has\(select\[id\$='-base-reps'\]\) \{\n\s*flex: 0 1 17rem;/);
  assert.match(RP22, /\.criterio-del-ejercicio \.campo:has\(select\[id\$='-unidad'\]\) \{\n\s*flex: 0 1 7rem;/);
  assert.match(leer('app/pro/advisees/training/revisiones.tsx'), /<form className="revision-nueva__formulario avisos-con-lugar"/);
  assert.match(leer('app/pro/advisees/training/resumen.tsx'), /<form className="formulario avisos-con-lugar" onSubmit=\{enviar\} noValidate data-objetivo-de-entrenamiento>/);
});

test('RP-22 · a 1440 con el panel abierto (la tabla entre 40 y 46 rem), las repeticiones con flechitas entran y los rótulos no se pisan', () => {
  const angosta = CSS.slice(CSS.indexOf('@container ejercicios (40rem < width <= 46rem) {'));
  const bloque = angosta.slice(0, angosta.indexOf('\n}\n'));
  // Con 4 rem y la flechita (1,5 rem), «8-12» no entraba; «Repeticiones» pisaba «Carga sugerida» (la captura de la CI).
  assert.match(bloque, /\.series-del-editor thead th:nth-child\(2\) \{\n\s*width: 5rem;/);
  assert.match(bloque, /\.series-del-editor thead th \{\n\s*hyphens: auto;/);
});
