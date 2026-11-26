/**
 * DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1) · las correcciones del editor de Entrenamiento: la barra de fases, la intensidad
 * del plan, las aproximaciones, el catálogo con sus filtros y, de la fuente, lo que pidió Dirección (F1 a F25). Lo del
 * dominio (las cargas de aproximación, las fases de más, la clasificación) también se prueba en `packages/domain`.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const B = await import('../src/app/pro/advisees/training/barra-de-fases.ts');
const I = await import('../src/app/pro/advisees/training/intensidad-del-plan.ts');
const A = await import('../src/app/pro/advisees/training/aproximaciones.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CSS = leer('app/globals.css');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');
const CUADROS = leer('app/pro/advisees/training/cuadros-del-plan.tsx');
const BARRA = leer('app/pro/advisees/training/barra-de-fases-en-pantalla.tsx');
const CATALOGO = leer('app/pro/advisees/training/agregar-ejercicio.tsx');
const AYUDAS = leer('app/pro/advisees/training/ayudas-del-editor.tsx');
const GRAFICO = leer('app/pro/advisees/training/grafico-de-semanas.tsx');
const PANEL = leer('app/pro/advisees/training/panel-del-editor.tsx');
const PARTE_B = leer('app/pro/advisees/training/panel-de-la-parte-b.tsx');
const MIS = leer('app/pro/exercises/mis-ejercicios.tsx');
const DE_BE = leer('app/pro/exercises/catalogo-de-be.tsx');

const FASES = [
  { blockId: 'base', label: 'Base', sessions: [{ sessionId: 's1' }] },
  { blockId: 'fuerza', label: 'Fuerza', sessions: [{ sessionId: 's2' }] },
  { blockId: 'pico', label: '', sessions: [] },
];

test('TEST-ET1-10 · F3: los seis colores de fase, en el almanaque, las fases y la barra (la fase 1 incluida)', () => {
  for (let n = 1; n <= 6; n += 1) {
    for (const selector of [`.almanaque [data-fase='${n}']`, `.tarjeta-de-fase[data-fase='${n}']`]) {
      const i = CSS.indexOf(selector);
      assert.ok(i >= 0, `${selector} existe`);
      const regla = CSS.slice(i, CSS.indexOf('}', i));
      assert.match(regla, new RegExp(`--color-de-la-fase: var\\(--fase-${n}\\);`), `${selector} usa --fase-${n}`);
    }
  }
});

test('TEST-ET1-11 · la barra de fases: «Semanas 3–10», «8 sem.», el ancho por semanas y lo que pasa del fin, rayado', () => {
  const plan = { startDate: '2026-11-30', weeks: 10, goal: null, phases: [{ blockId: 'base', weeks: 2 }, { blockId: 'fuerza', weeks: 8 }, { blockId: 'pico', weeks: 3 }] };
  const [base, fuerza, pico] = B.tarjetasDeLaBarra(plan, FASES);
  assert.deepEqual([base.desde, base.hasta, base.peso, base.fuera], [1, 2, 2, 0]);
  assert.equal(B.COPY_BARRA_DE_FASES.semanas(fuerza.desde, fuerza.hasta), 'Semanas 3–10');
  assert.equal(B.COPY_BARRA_DE_FASES.cuantas(fuerza.semanas), '8 sem.');
  // La tercera queda entera fuera del plan: rayada toda; sin nombre, «Fase 3».
  assert.equal(pico.fuera, 1);
  assert.equal(pico.nombre, 'Fase 3');
  // Una que cruza el fin: rayada en proporción.
  assert.equal(B.tarjetasDeLaBarra({ ...plan, weeks: 6 }, FASES)[1].fuera, 0.5);
  // Una fase sin semanas corta la cuenta: las que siguen no tienen semanas del plan.
  const sinSemanas = B.tarjetasDeLaBarra({ ...plan, phases: [{ blockId: 'base', weeks: null }, { blockId: 'fuerza', weeks: 4 }] }, FASES);
  assert.deepEqual([sinSemanas[0].desde, sinSemanas[1].desde, sinSemanas[0].peso], [null, null, 1]);
  // Con el teclado: ← y → en ronda, Inicio y Fin.
  assert.equal(B.faseConLaTecla(0, 3, 'ArrowLeft'), 2);
  assert.equal(B.faseConLaTecla(2, 3, 'ArrowRight'), 0);
  assert.equal(B.faseConLaTecla(1, 3, 'End'), 2);
  assert.equal(B.faseConLaTecla(1, 3, 'Enter'), null);
  assert.equal(B.diasEnCorto(['THURSDAY', 'MONDAY']), 'Lun · Jue');
  // En pantalla: una lista de pestañas, con la elegida en el orden de Tab, y el aviso en su renglón reservado (RP-19).
  assert.match(BARRA, /role="tablist"/);
  assert.match(BARRA, /tabIndex=\{es \? 0 : -1\}/);
  assert.match(BARRA, /<p className="barra-de-fases__aviso" role="status"/);
  assert.match(CSS, /\.tarjeta-de-fase\[data-fuera\]::after \{/);
  assert.match(CSS, /\.barra-de-fases__barra \{\n[^}]*overflow-x: auto;/);
});

test('TEST-ET1-12 · la intensidad del plan: RIR y RPE son la notación; % RM y «Solo carga» van en la planificación', () => {
  const plan = { startDate: null, weeks: null, goal: null, phases: [] };
  assert.equal(I.intensidadElegida(plan, 'RIR'), 'RIR');
  assert.equal(I.intensidadElegida(plan, 'RPE'), 'RPE');
  assert.equal(I.intensidadElegida({ ...plan, intensity: 'PERCENT_RM' }, 'RPE'), 'PERCENT_RM');
  assert.deepEqual(I.guardadoDeLaIntensidad('RPE', 'RIR'), { intensity: 'RIR', notacion: 'RPE' });
  assert.deepEqual(I.guardadoDeLaIntensidad('NONE', 'RPE'), { intensity: 'NONE', notacion: 'RPE' });
  assert.equal(I.criterioDeLaIntensidad(undefined), 'RIR');
  assert.equal(I.criterioDeLaIntensidad('NONE'), null);
  // La planificación guarda la intensidad (RIR, la de siempre, no se escribe) y la excepción por ejercicio, podada.
  const podada = d.planificacionPodada({ ...plan, intensity: 'PERCENT_RM', withoutIntensity: ['p1', 'p-que-no-esta'] }, [], ['p1']);
  assert.deepEqual([podada.intensity, podada.withoutIntensity], ['PERCENT_RM', ['p1']]);
  assert.equal(d.planificacionPodada({ ...plan, intensity: 'RIR' }, [], []), null);
  // En pantalla: el control segmentado con las cuatro, y el ejercicio que la hereda.
  assert.match(CUADROS, /role="radiogroup" aria-label=\{T\.intensidad\}/);
  assert.match(EDITOR, /intensidadDelPlan=\{plantilla \? null : criterioDeLaIntensidad\(plan\.intensity\)\}/);
  assert.match(EJERCICIO, /const criterioEfectivo: Criterio \| null = \(p\.intensity\?\.criterion as Criterio \| undefined\) \?\? \(sinIntensidad \? null : intensidadDelPlan\);/);
  assert.match(EJERCICIO, /laDelPlan: \(nombre: string\) => `La del plan: \$\{nombre\}`/);
});

test('TEST-ET1-13 · F15 y la captura de Dirección: las aproximaciones sin RIR, con su descanso corto, sin repetir cargas', () => {
  const p = { exerciseVersionId: 'e1', intensity: { criterion: 'RIR', target: { value: 2, reference: null } }, suggestedLoad: { value: 30, unit: 'kg' }, restSeconds: 180, sets: [{ repetitions: { value: 8 } }] };
  const config = A.aproximacionesPorOmision(p, 'Press de banca plano con barra', 'p1');
  assert.equal(config.step, 1, 'con 30 kg de trabajo, de a 1');
  const sets = A.conAproximacionesCalculadas(p, config);
  const aproximaciones = sets.filter((s) => s.setKind === 'WARM_UP');
  assert.deepEqual(
    aproximaciones.map((s) => s.suggestedLoad.value),
    [12, 18, 24],
  );
  assert.ok(aproximaciones.every((s) => s.rir === null && s.restSeconds === d.DESCANSO_DE_APROXIMACION));
  assert.equal(A.resumenDeLasAproximaciones({ ...p, sets }), '8 × 12 · 5 × 18 · 3 × 24 kg');
  assert.equal(A.ajusteDeLasAproximaciones(p, config), null);
  // De a 5, con 30 kg y 3 aproximaciones de 50, 75 y 85 %, la segunda baja un paso: se dice.
  assert.match(A.ajusteDeLasAproximaciones(p, { ...config, workingLoadShares: [50, 75, 85], step: 5 }), /más abajo que su porcentaje/);
  // En la tabla, una aproximación sin RIR dice «—» y el renglón del ajuste está reservado.
  assert.match(EJERCICIO, /data-sin-intensidad-en-la-serie/);
  assert.match(leer('app/pro/advisees/training/aproximaciones-del-ejercicio.tsx'), /data-ajuste-de-aproximaciones/);
});

test('TEST-ET1-14 · F14: la planilla por columnas, el colSpan real y la casilla «Aproximación» en su propia columna', () => {
  assert.doesNotMatch(EJERCICIO, /colSpan=\{99\}/);
  assert.match(EJERCICIO, /<td colSpan=\{columnas\}>/);
  assert.match(EJERCICIO, /<col className="series-del-editor__col-aprox" \/>/);
  assert.match(EJERCICIO, /<td className="series-del-editor__aprox"/);
  assert.doesNotMatch(CSS, /\.series-del-editor thead th:nth-child\(2\)/);
  // F10: la unidad, un chip; F11: «La carga es…» con lo que se toma sin elegir; F13: el % RM desde 30.
  assert.match(EJERCICIO, /className="chip-de-unidad"/);
  assert.doesNotMatch(EJERCICIO, /PL\.unidadDeLaCarga/);
  assert.match(EJERCICIO, /carga: 'La carga es…'/);
  assert.match(EJERCICIO, /porOmision: \(etiqueta: string\) =>/);
  assert.match(EJERCICIO, /export const PORCENTAJE_RM_MINIMO = 30;/);
  assert.match(EJERCICIO, /¿Quisiste escribir un RIR\?/);
  // F12: el aviso del cambio de criterio tiene su renglón, siempre.
  assert.match(EJERCICIO, /<p className="nota criterio-del-ejercicio__aviso" role="status" data-cambio-de-criterio=/);
  // F9: subir y bajar en «Más»; el chevrón aparte, al final.
  assert.match(EJERCICIO, /className="ejercicio-del-editor__chevron" aria-hidden="true"/);
  // F16: tres botones que abren cuadros.
  for (const x of ['data-abrir-aproximaciones', 'data-editar-todas-las-series', 'data-mas-opciones-del-ejercicio']) assert.match(EJERCICIO, new RegExp(x));
});

test('TEST-ET1-15 · F18: el renglón del profesional dice «aproximaciones» y las repeticiones una por una; el de la APK, igual que antes', () => {
  const p = {
    intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
    sets: [
      { setKind: 'WARM_UP', target: { repetitions: { value: 8 }, suggestedLoad: { value: 40, unit: 'kg' }, rir: null, restSeconds: 60 } },
      ...[8, 8, 6, 6].map((n) => ({ target: { repetitions: { value: n }, suggestedLoad: { value: 60, unit: 'kg' }, rir: 2, restSeconds: 120 } })),
    ],
  };
  const delProfesional = d.renglonDelEjercicio(p, 'RIR', { delProfesional: true });
  assert.match(delProfesional, /4 series \+ 1 aproximación/);
  assert.match(delProfesional, /repeticiones 8-8-6-6/);
  const deLaApp = d.renglonDelEjercicio(p, 'RIR');
  assert.match(deLaApp, /de calentamiento/);
  assert.match(deLaApp, /repeticiones por serie/);
});

test('TEST-ET1-16 · el catálogo: todo al abrir, los filtros del prototipo, «Favoritos» y el pie con los seleccionados', () => {
  const lista = [
    { exerciseId: 'a', name: 'Press de banca plano con barra', classification: { muscleGroup: 'CHEST', equipment: ['BARBELL', 'BENCH'], movementPattern: 'PUSH', joints: 'MULTI' } },
    { exerciseId: 'b', name: 'Aperturas con mancuernas', classification: { muscleGroup: 'CHEST', equipment: ['DUMBBELL', 'BENCH'], movementPattern: 'PUSH', joints: 'SINGLE' } },
    { exerciseId: 'c', name: 'Remo propio', classification: null },
  ];
  const f = (x) => d.filtrarElCatalogo(lista, { ...d.SIN_FILTROS, ...x }).map((e) => e.exerciseId);
  assert.deepEqual(f({}), ['a', 'b', 'c']);
  assert.deepEqual(f({ texto: 'pecho barra' }), ['a']);
  assert.deepEqual(f({ texto: 'MANCUERNA' }), ['b']);
  assert.deepEqual(f({ grupo: 'CHEST', articulaciones: 'SINGLE' }), ['b']);
  assert.deepEqual(f({ equipamiento: 'BENCH' }), ['a', 'b']);
  assert.deepEqual(f({ favoritos: new Set(['c']) }), ['c']);
  assert.equal(d.clasificacionEnUnRenglon(lista[0].classification), 'Pecho · Barra · Multiarticular');
  assert.equal(d.clasificacionEnUnRenglon(null), null);
  assert.deepEqual(d.enOrdenAlfabetico([{ name: 'Remo' }, { name: 'ábdominales' }]).map((x) => x.name), ['ábdominales', 'Remo']);
  // En pantalla: un cuadro central con el «?», la lista entera al abrir y el pie «N seleccionados · Cancelar · Agregar a la sesión».
  assert.match(CATALOGO, /<CuadroEnfocado\n\s*abierto=\{abierto\}\n\s*forma="dialogo"/);
  assert.match(CATALOGO, /buscar: 'Buscar por ejercicio, músculo o equipo…'/);
  assert.match(CATALOGO, /agregarALaSesion: 'Agregar a la sesión'/);
  assert.match(CATALOGO, /const r = await api\.paginaDelCatalogoDeEjercicios\(token, cursor\);/);
  assert.match(CATALOGO, /data-estrella-del-ejercicio/);
  // F23: «Catálogo de BE» en «Mis ejercicios», con su selector de origen, y la clasificación opcional de los propios.
  assert.match(MIS, /\{ clave: 'catalogo', texto: 'Catálogo de BE', icono: 'tilde' \}/);
  assert.match(MIS, /api\.crearEjercicio\(token, nombre\.trim\(\), intento\.actual\(\), conAlgo \? clasificacion : undefined\)/);
  assert.match(DE_BE, /a validar/);
});

test('TEST-ET1-17 · los cuadros configuran y el panel muestra; cada cuadro con su «?» y un ejemplo resuelto (F19)', () => {
  // Los cuadros: «Configurar plan», «Editar fase» y «Días de la semana», con el «?» en la cabecera.
  assert.match(leer('components/cuadro-enfocado.tsx'), /<div className="cuadro-enfocado__ayuda" data-ayuda-del-cuadro>/);
  for (const c of ['CuadroConfigurarPlan', 'CuadroEditarFase', 'CuadroDiasDeLaSemana']) assert.match(EDITOR, new RegExp(`<${c}\\n`));
  assert.match(CUADROS, /alCambiarLaDuracion: 'Al cambiar la duración, se ajustan las fechas de las fases siguientes\.'/);
  assert.match(CUADROS, /duplicar: 'Duplicar fase'/);
  assert.match(CUADROS, /quitarPregunta: \(nombre: string\)/);
  // La matriz: una fila por sesión con su letra y su nombre editable; las flechas se mueven por la tabla.
  assert.match(CUADROS, /data-nombre-de-la-sesion=\{n \+ 1\}/);
  assert.match(CUADROS, /function moverEnLaMatriz\(/);
  // F19: definición y ejemplo, como mínimo de la fase, la semana tipo, la intensidad, las aproximaciones, la progresión y la carga para N.
  for (const clave of ['fase', 'semanaTipo', 'intensidad', 'aproximaciones', 'progresion', 'cargaParaRepeticiones']) {
    assert.match(AYUDAS, new RegExp(`  ${clave}: \\{\\n    nombre: '[^']+',\\n    definicion: '`), clave);
  }
  assert.match(AYUDAS, /<p className="ayuda-con-ejemplo__ejemplo" data-ejemplo-resuelto>/);
  // F1: el plan ya no va arriba con la notación en el mismo renglón.
  assert.doesNotMatch(EDITOR, /<DatosDelPlan|<NotacionDelPlan/);
});

test('TEST-ET1-18 · F4: con fases de más no se activa; «Antes de activar» trae las dos salidas y el aviso está a la vista', () => {
  assert.match(EDITOR, /COPY_FASES_DE_MAS\.llevar\(semanasQueSumanLasFases\(plan, bloques\)\)/);
  assert.match(EDITOR, /texto: COPY_FASES_DE_MAS\.recortar,/);
  assert.match(EDITOR, /deMas=\{!plantilla && fasesDeMas > 0 \?/);
  assert.match(leer('app/pro/advisees/training/revision-del-plan.tsx'), /data-accion-del-impedimento=\{a\.clave\}/);
  const problemas = d.problemasDeCompletitud({ blocks: [{ blockId: 'base', label: 'Base', purpose: null, microcycles: [], sessions: [] }], planning: { startDate: '2026-11-30', weeks: 2, goal: null, phases: [{ blockId: 'base', weeks: 4 }] } });
  assert.ok(problemas.some((p) => p.code === 'PHASES_EXCEED_PLAN_WEEKS'));
});

test('TEST-ET1-19 · F6, F7 y F8: el panel sin desbordes, la carga para N en un renglón si no aplica, y los ejes desde 0', () => {
  assert.match(EDITOR, /<span className="selector-de-vistas__nombre">\{NOMBRE_DE_LA_VISTA\[v\]\}<\/span>/);
  assert.match(PANEL, /<div className="marco-del-panel__abrir">/);
  assert.match(CSS, /\.panel-del-editor \.almanaque__sesion \{\n\s*width: min\(2\.25rem, 100%\);/);
  assert.match(PARTE_B, /data-carga-para-repeticiones="no-aplica"/);
  assert.equal((PARTE_B.match(/El máximo estimado \(Epley v1\) es solo/g) ?? []).length, 0, 'ya no se repite');
  assert.match(GRAFICO, /marcasDelEje\(0, Math\.max\(\.\.\.todos\)\)/);
  assert.match(PANEL, /const min = 0;/);
});

test('TEST-ET1-20 · las palabras de BE en lo nuevo, y cada «%» con su base', () => {
  for (const [nombre, fuente] of Object.entries({ CUADROS, BARRA, AYUDAS, CATALOGO, DE_BE, B: leer('app/pro/advisees/training/barra-de-fases.ts') })) {
    const textos = [...fuente.matchAll(/'([^'\n]*)'|`([^`\n]*)`|>([^<>{}\n]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
    for (const t of textos.filter((x) => !x.includes('/'))) assert.doesNotMatch(t, /\bvolumen\b|cumplimiento|adherencia|\bracha\b|puntaje|asesorad|estaci[oó]n\b/i, `${nombre}: ${t}`);
  }
});

test('TEST-ET1-21 · revisión adversaria: heredar sin objetivo se dice, vaciar el común no traba el guardado, lo escrito no se pierde y lo repetido se marca', async () => {
  const R = await import('../src/app/pro/advisees/revisar-el-plan.ts');
  const ejercicio = (prescriptionId, intensity) => ({ prescriptionId, intensity, sets: [{ repetitions: { value: 8 } }] });
  const bloques = [{ sessions: [{ prescriptions: [ejercicio('hereda', null), ejercicio('excepcion', null), ejercicio('propio', { criterion: 'RIR', target: { value: 2, reference: null } })] }] }];
  // Con la intensidad del plan, el que la hereda sin objetivo queda «sin completar» (no impide activar); la excepción y el
  // de criterio propio, no. Sin intensidad del plan (o en una plantilla), nada.
  assert.deepEqual(R.loQueQuedaSinCompletarEnEntrenamiento(bloques, { criterio: 'RIR', sinIntensidad: ['excepcion'] }), [{ code: R.INCOMPLETO.sinIntensidad, path: 'blocks[0].sessions[0].prescriptions[0]' }]);
  assert.deepEqual(R.loQueQuedaSinCompletarEnEntrenamiento(bloques, { criterio: null, sinIntensidad: [] }), []);
  assert.deepEqual(R.loQueQuedaSinCompletarEnEntrenamiento(bloques), []);
  assert.ok(R.TEXTO_DE_LO_INCOMPLETO[R.INCOMPLETO.sinIntensidad]);
  assert.match(EDITOR, /loQueQuedaSinCompletarEnEntrenamiento\(bloques, herenciaDeLaIntensidad\), enElPanel\)/);
  // Plegado, el que hereda sin objetivo lo dice.
  assert.match(EJERCICIO, /const avisosDelPlegado = !p\.intensity && criterioEfectivo !== null \? \[E9\.faltaElObjetivoHeredado/);
  // Vaciar el objetivo común con un RIR escrito en alguna serie deja el criterio sin objetivo (no un RIR por serie sin
  // criterio, que el contrato rechaza); sin RIR escrito, se va el criterio con las claves `rir`.
  assert.match(EJERCICIO, /const conRirEscrito = p\.sets\.some\(\(x\) => typeof x\.rir === 'number'\);/);
  assert.match(EJERCICIO, /onCambiar\(\{ intensity: null, sets: p\.sets\.map\(\(\{ rir: _sinRir, \.\.\.x \}\) => x as Serie\) \}\)/);
  // «Editar todas las series» con algo escrito pregunta antes de cerrarse (ET1-D05).
  assert.match(EJERCICIO, /titulo=\{E9\.todas\} sobretitulo=\{nombre\} conCambios=\{todasConCambios\}/);
  assert.match(EJERCICIO, /onConCambios=\{setTodasConCambios\}/);
  // «Agregar ejercicios» marca lo que la sesión ya tiene y lo cuenta en el pie: entra igual, pero se dice.
  assert.match(CATALOGO, /data-ya-en-la-sesion/);
  assert.match(CATALOGO, /data-repetidos-en-la-sesion=\{repetidos\}/);
  assert.match(EDITOR, /enLaSesion=\{new Set\(/);
});

test('TEST-ET1-22 · revisión adversaria: los cuadros no pierden ni borran lo escrito sin decirlo, y el rayado no tapa el texto', () => {
  // «Configurar plan»: una duración que no se entiende no se guarda como «sin duración».
  assert.match(CUADROS, /const semanasMal = semanasEscritas !== null && semanasEscritas\.trim\(\) !== '' && leerSemanas\(semanasEscritas, 104\) === null;/);
  assert.match(CUADROS, /apagado: semanasMal \? T\.semanasDelPlanNoSeEntienden : null,/);
  // «Editar fase»: con cambios sin guardar, «Duplicar fase» no copia lo viejo en silencio.
  assert.match(CUADROS, /aria-disabled=\{cambio \|\| undefined\}/);
  assert.match(CUADROS, /if \(!cambio\) onDuplicar\(\);/);
  // F4: el rayado de lo que pasa del fin del plan va debajo del nombre y de las semanas.
  assert.match(CSS, /\.tarjeta-de-fase\[data-fuera\] \.tarjeta-de-fase__nombre,\n\.tarjeta-de-fase\[data-fuera\] \.tarjeta-de-fase__semanas \{\n\s*position: relative;\n\s*z-index: 1;/);
});
