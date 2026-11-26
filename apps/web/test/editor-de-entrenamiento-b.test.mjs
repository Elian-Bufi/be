/**
 * WP-EDITOR-ENTRENAMIENTO (DL-196, parte B) · lo del editor que no es del dominio: la base de cada ejercicio para la
 * progresión, la vista previa, «arrancar donde terminó», la distribución desde la estructura, los favoritos del plan, las
 * vistas del panel y, de la fuente, lo que pidió Dirección (E12, E13, E18, E19, E20) con las reglas de pantalla.
 * TEST-EE-50 a TEST-EE-57. Las cuentas se prueban en el dominio (`progresiones.test.ts`, `distribucion-por-musculo.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const E = await import('../src/app/pro/advisees/training/progresion-del-editor.ts');
const P = await import('../src/app/pro/advisees/training/panel-contextual.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const ASISTENTE = leer('app/pro/advisees/training/asistente-de-progresion.tsx');
const PARTE_B = leer('app/pro/advisees/training/panel-de-la-parte-b.tsx');
const GRAFICO = leer('app/pro/advisees/training/grafico-de-semanas.tsx');
const FIGURA = leer('components/figura-de-calor.tsx');
const CATALOGO = leer('app/pro/advisees/training/agregar-ejercicio.tsx');
const GALERIA = leer('app/pro/advisees/galeria-de-presets.tsx');
const TOKENS = leer('app/tokens.css');

const serie = (reps, carga = null, setKind = undefined) => ({ repetitions: reps, ...(carga !== null ? { suggestedLoad: { value: carga, unit: 'kg' } } : {}), ...(setKind ? { setKind } : {}) });
const sentadilla = {
  prescriptionId: 'rx-sentadilla',
  exerciseVersionId: 'v-sentadilla',
  intensity: null,
  suggestedLoad: { value: 80, unit: 'kg' },
  sets: [serie({ value: 5 }, 40, 'WARM_UP'), serie({ value: 6 }), serie({ value: 6 }), serie({ value: 6 }), serie({ value: 6 })],
};
const banca = { prescriptionId: 'rx-banca', exerciseVersionId: 'v-banca', intensity: null, sets: [serie({ min: 8, max: 12 }, 60), serie({ min: 8, max: 12 }, 60), serie({ min: 8, max: 12 }, 57.5)] };
const fase = { blockId: 'f1', label: 'Base', sessions: [{ sessionId: 's1', label: 'Torso', prescriptions: [banca] }, { sessionId: 's2', label: 'Piernas', prescriptions: [sentadilla] }] };

test('TEST-EE-50 · la base de cada ejercicio: carga de trabajo, repeticiones, series efectivas y el paso de su implemento', () => {
  const b = E.baseDelEjercicio(sentadilla, 'Sentadilla trasera con barra', null);
  assert.deepEqual(b, { carga: 80, unidad: 'kg', repeticiones: 6, series: 4, paso: 2.5 });
  // Sin carga común, la de la primera efectiva; el rango da su piso; la máquina, de a 5.
  assert.deepEqual(E.baseDelEjercicio(banca, 'Press en máquina', null), { carga: 60, unidad: 'kg', repeticiones: 8, series: 3, paso: 5 });
  assert.deepEqual(E.rangoDeTrabajo(banca), { min: 8, max: 12 });
  // El paso elegido en las aproximaciones manda.
  assert.equal(E.baseDelEjercicio(sentadilla, 'Sentadilla', { prescriptionId: 'rx-sentadilla', mode: 'MANUAL', workingLoadShares: [], step: 5 }).paso, 5);
});

test('TEST-EE-51 · la vista previa: a toda la fase o a los elegidos, con la descarga y las celdas en palabras', () => {
  const ejercicios = E.ejerciciosDeLaFase(fase, (p) => (p.exerciseVersionId === 'v-banca' ? 'Press de banca' : 'Sentadilla trasera'), (s) => s.label);
  assert.deepEqual(ejercicios.map((e) => [e.nombre, e.sesion]), [['Press de banca', 'Torso'], ['Sentadilla trasera', 'Piernas']]);
  const regla = { ...d.progresionPorOmision('f1', 'LINEAR', 2.5), deload: { week: 4, mode: 'SETS', workingLoadShare: 60, setsRemoved: 2 } };
  const filas = E.vistaPrevia(regla, ejercicios, 4, () => null);
  assert.equal(filas.length, 2);
  const s = filas.find((f) => f.prescriptionId === 'rx-sentadilla');
  assert.deepEqual(s.semanas.map((x) => x.carga), [80, 82.5, 85, 85]);
  assert.equal(E.celdaDeLaSemana(s.semanas[3], 'kg', 4), '85 kg × 6 · 2 series');
  assert.equal(E.celdaDeLaSemana({ semana: 1, carga: null, repeticiones: 8, series: 3, descarga: false, ola: null }, 'kg', 3), '× 8');
  const soloBanca = E.vistaPrevia({ ...regla, prescriptionIds: ['rx-banca'] }, ejercicios, 4, () => null);
  assert.deepEqual(soloBanca.map((f) => f.prescriptionId), ['rx-banca']);
});

test('TEST-EE-52 · arrancar donde terminó (E19): la última semana sin descarga, y la pirámide se corre entera', () => {
  const filas = [{ prescriptionId: 'rx-sentadilla', nombre: 'Sentadilla', unidad: 'kg', paso: 2.5, semanas: [80, 82.5, 85, 51].map((carga, k) => ({ semana: k + 1, carga, repeticiones: 6, series: 4, descarga: k === 3, ola: null })) }];
  assert.deepEqual([...E.cargasDeLaUltimaSemana(filas)], [['rx-sentadilla', 85]]);
  const corrida = E.conCargaDeTrabajo(banca, 65);
  assert.deepEqual(corrida.sets.map((x) => x.suggestedLoad?.value), [65, 65, 62.5]);
  const conComun = E.conCargaDeTrabajo(sentadilla, 85);
  assert.equal(conComun.suggestedLoad.value, 85);
  // Las aproximaciones no se tocan: se recalculan desde la carga de trabajo (EE-D05).
  assert.equal(conComun.sets[0].suggestedLoad.value, 40);
});

test('TEST-EE-53 · la distribución desde la estructura: los días de la agenda, las zonas de cada ficha y las series efectivas', () => {
  const agenda = { startDate: '2026-11-30', sessions: [{ sessionId: 's1', weekdays: ['MONDAY', 'THURSDAY'] }], moves: [] };
  const zonas = { 'v-banca': [{ zoneId: 'pectoral', role: 'PRIMARY' }, { zoneId: 'triceps', role: 'SECONDARY' }], 'v-sentadilla': [{ zoneId: 'cuadriceps', role: 'PRIMARY' }] };
  const sesiones = E.sesionesParaDistribuir(fase, agenda, (p) => zonas[p.exerciseVersionId] ?? null);
  assert.deepEqual(sesiones.map((s) => s.dias), [['MONDAY', 'THURSDAY'], []]);
  const dist = d.distribucionPorMusculo(sesiones);
  // Banca: 3 series × 2 días = 6 de pectoral y 3 de tríceps; sentadilla: 4 efectivas (sin la aproximación), una vez.
  assert.deepEqual(dist.zonas.map((z) => [z.zoneId, z.series]), [['pectoral', 6], ['triceps', 3], ['cuadriceps', 4]]);
  assert.equal(dist.sesionesSinDias, 1);
});

test('TEST-EE-54 · los favoritos del plan (GR-27): marcar, desmarcar y el tope', () => {
  const plan = { startDate: null, weeks: null, goal: null, phases: [] };
  const con = E.conFavorito(plan, { kind: 'PHASE_DISTRIBUTION', id: 'f1' });
  assert.ok(E.esFavorito(con, { kind: 'PHASE_DISTRIBUTION', id: 'f1' }));
  assert.ok(!E.esFavorito(con, { kind: 'PHASE_PROGRESSION', id: 'f1' }));
  assert.equal(E.conFavorito(con, { kind: 'PHASE_DISTRIBUTION', id: 'f1' }).favoriteCharts, undefined);
  let muchos = plan;
  for (let n = 0; n < 35; n += 1) muchos = E.conFavorito(muchos, { kind: 'EXERCISE_LOAD', id: `rx-${n}` });
  assert.equal(muchos.favoriteCharts.length, 30);
  assert.ok(d.PlanificacionDelPlanSchema.safeParse(muchos).success);
});

test('TEST-EE-55 · el panel: las vistas por foco, con el teclado; la parte B queda en el registro', () => {
  assert.deepEqual(P.VISTAS_DEL_FOCO.fase, ['almanaque', 'distribucion', 'progresion', 'favoritos']);
  assert.deepEqual(P.VISTAS_DEL_FOCO.plan, ['almanaque', 'favoritos']);
  assert.equal(P.vistaDelFoco('plan', 'distribucion'), 'almanaque');
  assert.equal(P.vistaDelFoco('sesion', 'progresion'), 'progresion');
  assert.equal(P.vistaPorTecla(P.VISTAS_DEL_FOCO.fase, 'favoritos', 'ArrowRight'), 'almanaque');
  assert.equal(P.vistaPorTecla(P.VISTAS_DEL_FOCO.fase, 'almanaque', 'ArrowLeft'), 'favoritos');
  assert.equal(P.vistaPorTecla(P.VISTAS_DEL_FOCO.fase, 'distribucion', 'End'), 'favoritos');
  assert.equal(P.vistaPorTecla(P.VISTAS_DEL_FOCO.fase, 'distribucion', 'a'), null);
  assert.deepEqual(P.HERRAMIENTAS_DE_LA_PARTE_B.ejercicio, ['graficos-x-y']);
  assert.match(EDITOR, /role="tablist" aria-label="Qué muestra el panel"/);
  assert.match(EDITOR, /role=\{vistas\.length > 1 \? 'tabpanel' : undefined\}/);
});

test('TEST-EE-56 · lo que pidió Dirección: progresión en la fase y al copiar, gráficos X/Y, silueta, estructuras y catálogo por músculo', () => {
  // E12: «Progresión…» en el desplegable de cada fase, con la regla en un renglón fijo.
  assert.match(EDITOR, /data-abrir-progresion\b/);
  assert.match(EDITOR, /fase-del-plan__progresion/);
  // E19: copiar la fase anterior ofrece la progresión (y arrancar donde terminó).
  assert.match(EDITOR, /setProgresionAbierta\(\{ blockId: copia\.bloque\.blockId, copia: \{/);
  assert.match(ASISTENTE, /data-arrancar-donde-termino/);
  // La vista previa: el gráfico y la tabla semana × ejercicio, antes de aplicar.
  assert.match(ASISTENTE, /<GraficoDeSemanas/);
  assert.match(ASISTENTE, /data-tabla-de-la-progresion/);
  // E18: planificado punteado, realizado lleno, el máximo estimado con su banda orientativa; la tabla y el teclado.
  assert.match(GRAFICO, /grafico-de-semanas__linea--\$\{s\.forma\}/);
  assert.match(GRAFICO, /tabIndex=\{0\}\n\s*onKeyDown=\{alTeclado\}/);
  assert.match(GRAFICO, /data-ver-tabla/);
  assert.match(PARTE_B, /orientativas: porSemana\.map/);
  // E7: la carga para N repeticiones, con la cuenta y los límites del método.
  assert.match(PARTE_B, /cargaParaRepeticiones\(valor\.estimate\.value/);
  assert.match(PARTE_B, /FUERA_DE_LOS_LIMITES/);
  // E20: la silueta con el globo exacto (la máscara), las zonas a cuidar y la tabla para el lector.
  assert.match(FIGURA, /getImageData/);
  assert.match(FIGURA, /figura-de-calor__zona--a-cuidar/);
  assert.match(PARTE_B, /data-tabla-de-la-distribucion/);
  assert.match(PARTE_B, /data-aviso-de-zona-a-cuidar/);
  // E13: el reparto de las estructuras, en la galería de presets.
  assert.match(GALERIA, /<RepartoEnLaSilueta reparto=\{repartoDeLaEstructura\(elegido\.preset\)\}/);
  // DL-197 (ET1-D13): el catálogo entero, con los filtros del prototipo; «Grupo muscular» reemplaza a la silueta del cajón.
  // DL-199 (ET3-24): el catálogo entero, una vez por sesión (`catalogo-en-la-sesion.ts`).
  assert.match(CATALOGO, /leerElCatalogoDeLaSesion\(token, sesionPerdida\)/);
  assert.match(CATALOGO, /COPY_CATALOGO_PARA_ELEGIR\.grupo, grupo, NOMBRE_DEL_GRUPO_MUSCULAR/);
});

test('TEST-EE-57 · las reglas de pantalla: palabras, «%» con su base, colores en tokens y nada que se corra', () => {
  for (const fuente of [ASISTENTE, PARTE_B, GRAFICO, FIGURA]) {
    const visibles = [...fuente.matchAll(/>([^<>{}]*[a-záéíóúñ][^<>{}]*)</gi)].map((m) => m[1]).join(' ');
    for (const prohibida of ['cumplimiento', 'adherencia', 'racha', 'puntaje', 'asesorado', 'estación', 'volumen']) assert.doesNotMatch(visibles.toLowerCase(), new RegExp(prohibida), prohibida);
    assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(visibles), [], visibles);
  }
  for (const t of [d.COPY_PROGRESIONES.descargaEjemplo, d.COPY_PROGRESIONES.ejemplos.UNDULATING, d.progresionEnPalabras({ ...d.progresionPorOmision('f', 'UNDULATING', 2.5), deload: { week: 3, mode: 'LOAD', workingLoadShare: 60, setsRemoved: 1 } }, 'kg')]) {
    assert.doesNotMatch(t, /%(?!\s*de la carga de trabajo)/, t);
  }
  for (const n of [1, 2, 3, 4]) assert.match(TOKENS, new RegExp(`--calor-${n}: #[0-9a-f]{6};`));
  assert.match(TOKENS, /--zona-a-cuidar: #[0-9a-f]{6};/);
  // RP-19: la lectura del gráfico, el resultado de la cuenta y el aviso de la zona tienen su lugar reservado.
  assert.match(GRAFICO, /grafico-de-semanas__lectura nota" aria-live="polite"/);
  assert.match(PARTE_B, /carga-para-repeticiones__lugar" aria-live="polite"/);
  assert.match(leer('app/globals.css'), /\.aviso-de-zona-a-cuidar \{\n {2}min-height: 1\.3em;/);
});
