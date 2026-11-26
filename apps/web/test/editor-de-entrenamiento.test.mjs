/**
 * WP-EDITOR-ENTRENAMIENTO (DL-196, parte A) · el rediseño del editor de Entrenamiento: la máscara de tiempo, las fases
 * (nombre, copia), las aproximaciones, el panel contextual y, de la fuente, lo que pidió Dirección en su recorrido del
 * 23/11 (E1 a E20). Lo de fechas, almanaque y redondeo se prueba en el dominio (`planificacion-del-plan.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const M = await import('../src/app/pro/advisees/training/mascara-de-tiempo.ts');
const F = await import('../src/app/pro/advisees/training/fases-del-plan.ts');
const A = await import('../src/app/pro/advisees/training/aproximaciones.ts');
const P = await import('../src/app/pro/advisees/training/panel-contextual.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');
// DL-198 (ET1-D20): `plan-y-fases.tsx` se borró; el plan se configura en «Configurar plan» (`cuadros-del-plan.tsx`).
const PLAN_Y_FASES = leer('app/pro/advisees/training/cuadros-del-plan.tsx');
const ALMANAQUE = leer('app/pro/advisees/training/almanaque.tsx');
const PANEL = leer('app/pro/advisees/training/panel-del-editor.tsx');
const IMPIDE = leer('app/pro/advisees/training/lo-que-impide-activar.tsx');
const APROXIMACIONES = leer('app/pro/advisees/training/aproximaciones-del-ejercicio.tsx');

test('TEST-EE-10 · la máscara mm:ss: lo escrito entra por los minutos y el «:» queda fijo (E15)', () => {
  assert.equal(M.textoDeLaMascara('3'), '03:00');
  assert.equal(M.segundosDeLaMascara('3'), 180);
  assert.equal(M.textoDeLaMascara('13'), '13:00');
  assert.equal(M.textoDeLaMascara('130'), '01:30');
  assert.equal(M.segundosDeLaMascara('130'), 90);
  assert.equal(M.textoDeLaMascara('1305'), '13:05');
  assert.equal(M.textoDeLaMascara(''), '');
  assert.equal(M.segundosDeLaMascara(''), null);
  // Lo que no es un tiempo se ve como se escribió y no se guarda.
  assert.ok(Number.isNaN(M.segundosDeLaMascara('175')));
  assert.ok(Number.isNaN(M.segundosDeLaMascara('61')));
  assert.equal(M.segundosDeLaMascara('60'), 3600);
  // Las teclas: una cifra se suma (hasta cuatro), Borrar saca la última, Suprimir todo; lo demás no es de la máscara.
  assert.equal(M.cifrasTrasLaTecla('1', '3'), '13');
  assert.equal(M.cifrasTrasLaTecla('1305', '9'), '1305');
  assert.equal(M.cifrasTrasLaTecla('130', 'Backspace'), '13');
  assert.equal(M.cifrasTrasLaTecla('130', 'Delete'), '');
  assert.equal(M.cifrasTrasLaTecla('1', 'Tab'), null);
  assert.equal(M.cifrasDeSegundos(90), '130');
  assert.equal(M.cifrasDeSegundos(180), '3');
  // Va en los campos de tiempo del editor: el descanso común y el de cada serie.
  assert.equal((EJERCICIO.match(/useMascaraDeTiempo\(/g) ?? []).length, 3);
  assert.match(EJERCICIO, /data-mascara-de-tiempo=\{paso\.campo === 'restSeconds' \? '' : undefined\}/);
});

test('TEST-EE-11 · el nombre de una fase nueva no se repite (E6)', () => {
  // Con «Fase 1» y «Fase 3» (la 2 se quitó), la nueva no es otra «Fase 3».
  assert.equal(F.nombreDeFaseNueva([{ label: 'Fase 1' }, { label: 'Fase 3' }]), 'Fase 4');
  assert.equal(F.nombreDeFaseNueva([{ label: 'Base' }, { label: 'Fuerza' }]), 'Fase 3');
  // «Bloque 2» de un plan viejo se lee «Fase 2».
  assert.equal(F.nombreDeFaseNueva([{ label: 'Bloque 2' }]), 'Fase 3');
  assert.equal(F.nombreDeFaseNueva([]), 'Fase 1');
  // El editor la usa, y la fase nace con su identificador.
  assert.match(EDITOR, /x\.push\(\{ blockId: crypto\.randomUUID\(\), label: nombreDeFaseNueva\(x\), sessions: \[\] \}\)/);
});

test('TEST-EE-12 · copiar la fase anterior: identificadores nuevos, las mismas semanas, aproximaciones y días (E19)', () => {
  let n = 0;
  const nuevoId = () => `n${++n}`;
  const fase = {
    blockId: 'b1',
    label: 'Base',
    purpose: 'Técnica',
    sessions: [
      {
        sessionId: 's1',
        label: 'Torso A',
        instructions: null,
        exerciseGroups: [{ groupId: 'g1', label: 'Superserie', kind: 'ROUNDS', rounds: 3 }],
        prescriptions: [{ prescriptionId: 'p1', exerciseVersionId: 'e1', sets: [{ repetitions: { value: 8 } }], intensity: null, exerciseGroupId: 'g1' }],
      },
    ],
  };
  const copia = F.copiarLaFase(fase, 'Fase 2', nuevoId);
  assert.equal(copia.bloque.label, 'Fase 2');
  assert.equal(copia.bloque.purpose, 'Técnica');
  assert.notEqual(copia.bloque.blockId, 'b1');
  const s = copia.bloque.sessions[0];
  assert.notEqual(s.sessionId, 's1');
  assert.notEqual(s.prescriptions[0].prescriptionId, 'p1');
  // El ejercicio sigue en su bloque de la sesión, con el identificador nuevo del bloque.
  assert.equal(s.prescriptions[0].exerciseGroupId, s.exerciseGroups[0].groupId);
  assert.notEqual(s.exerciseGroups[0].groupId, 'g1');
  // La original no cambió.
  assert.equal(fase.sessions[0].sessionId, 's1');
  assert.equal(copia.sesiones.get('s1'), s.sessionId);
  // Las semanas y las aproximaciones van con la copia; las anotaciones privadas, no.
  const plan = {
    startDate: '2026-11-30',
    weeks: 8,
    goal: null,
    phases: [{ blockId: 'b1', weeks: 4 }],
    warmUps: [{ prescriptionId: 'p1', mode: 'FROM_WORKING_LOAD', workingLoadShares: [40, 60, 80], step: 2.5 }],
    privateNotes: { plan: null, phases: [{ blockId: 'b1', text: 'Ojo con el hombro' }] },
  };
  const conCopia = F.planificacionConLaCopia(plan, 'b1', copia);
  assert.deepEqual(conCopia.phases.find((f) => f.blockId === copia.bloque.blockId), { blockId: copia.bloque.blockId, weeks: 4 });
  assert.equal(conCopia.warmUps.length, 2);
  assert.equal(F.anotacionesDeLaFase(conCopia, copia.bloque.blockId), null);
  const agenda = { startDate: '2026-11-30', sessions: [{ sessionId: 's1', weekdays: ['MONDAY', 'THURSDAY'] }], moves: [] };
  assert.deepEqual(F.agendaConLaCopia(agenda, copia).sessions[1], { sessionId: s.sessionId, weekdays: ['MONDAY', 'THURSDAY'] });
  // DL-197 (ET1-03): «Duplicar fase», en el cuadro «Editar fase» y en el «⋯» de la fase; la copia va justo después.
  assert.match(EDITOR, /const duplicarLaFase = \(desde: number\) => \{/);
  assert.match(EDITOR, /cambiar\(\(x\) => \(x\.splice\(n, 0, copia\.bloque\), x\)\);/);
});

test('TEST-EE-13 · lo que se escribe del plan: el fin cambia la duración; las anotaciones vacías se quitan', () => {
  const p = F.planificacionParaEditar(null);
  assert.deepEqual(p, { startDate: null, weeks: null, goal: null, phases: [] });
  const conInicio = F.conInicio(p, '2026-11-30');
  assert.equal(F.conFin(conInicio, '2027-01-17').weeks, 7);
  assert.equal(F.conFin(p, '2027-01-17'), p, 'sin inicio, el fin no dice nada');
  const conNotas = F.conAnotacionesDeLaFase(conInicio, 'b1', 'Bajar si duerme mal');
  assert.equal(F.anotacionesDeLaFase(conNotas, 'b1'), 'Bajar si duerme mal');
  assert.deepEqual(F.conAnotacionesDeLaFase(conNotas, 'b1', '  ').privateNotes.phases, []);
  assert.equal(F.conSemanasDeLaFase(conInicio, 'b1', 3).phases[0].weeks, 3);
  assert.equal(F.colorDeLaFase(0), 1);
  assert.equal(F.colorDeLaFase(6), 1);
});

test('TEST-EE-14 · las aproximaciones «Por %» desde la carga de trabajo, con su redondeo y las efectivas intactas (E9, E17)', () => {
  const p = {
    exerciseVersionId: 'e1',
    intensity: null,
    suggestedLoad: { value: 100, unit: 'kg' },
    sets: [{ repetitions: { value: 5 } }, { repetitions: { value: 5 } }],
  };
  const config = A.aproximacionesPorOmision(p, 'Sentadilla trasera', 'p1');
  assert.deepEqual(config, { prescriptionId: 'p1', mode: 'FROM_WORKING_LOAD', workingLoadShares: [40, 60, 80], step: 2.5 });
  const sets = A.conAproximacionesCalculadas(p, config);
  assert.deepEqual(
    sets.map((s) => `${s.setKind ?? 'WORKING'} ${s.repetitions.value}×${s.suggestedLoad?.value ?? ''}`),
    ['WARM_UP 8×40', 'WARM_UP 5×60', 'WARM_UP 3×80', 'WORKING 5×', 'WORKING 5×'],
  );
  const conAprox = { ...p, sets };
  assert.equal(A.cuantasAproximaciones(conAprox), 3);
  assert.equal(A.coincidenConLosPorcentajes(conAprox, config), true);
  // Tocar una carga: ya no coincide, y se dice (nada se pisa solo).
  const tocada = { ...conAprox, sets: conAprox.sets.map((s, n) => (n === 0 ? { ...s, suggestedLoad: { value: 45, unit: 'kg' } } : s)) };
  assert.equal(A.coincidenConLosPorcentajes(tocada, config), false);
  // En máquina, el paso es 5: 87,5 kg da 35, 55 y 70.
  assert.equal(A.aproximacionesPorOmision({ ...p, suggestedLoad: { value: 87.5, unit: 'kg' } }, 'Prensa de piernas', 'p2').step, 5);
  // «A mano»: suma o quita aproximaciones sin tocar las efectivas.
  assert.equal(A.conCantidadAMano(conAprox, 1).length, 3);
  assert.equal(A.conCantidadAMano(p, 2).filter((s) => s.setKind === 'WARM_UP').length, 2);
  // Los rótulos: A1, A2… y las efectivas 1, 2.
  assert.deepEqual(A.rotulosConAproximaciones(sets).map((r) => r.corto), ['A1', 'A2', 'A3', '1', '2']);
  // Sin carga de trabajo, no hay qué calcular.
  assert.equal(A.conAproximacionesCalculadas({ ...p, suggestedLoad: null }, config), null);
  // DL-197 (F16): las aproximaciones van en su cuadro, que se abre con «Aproximaciones · 3» debajo de la planilla.
  assert.match(EJERCICIO, /data-abrir-aproximaciones=\{cuantasAproximaciones\(p\)\}/);
  assert.ok(EJERCICIO.indexOf('<SeriesDelEjercicio id=') < EJERCICIO.indexOf('<SeccionDeAproximaciones'));
  assert.match(APROXIMACIONES, /porPorcentaje: 'Por porcentaje'/);
  assert.match(APROXIMACIONES, /aMano: 'A mano'/);
  assert.match(APROXIMACIONES, /data-base-de-las-aproximaciones/);
  assert.match(APROXIMACIONES, /<ExplicacionAPedido nombre="Qué son las aproximaciones" como="div" lugar="esquina">/);
  // La casilla dice «Aproximación», no «C».
  assert.match(EJERCICIO, /aproximacion: 'Aproximación'/);
});

test('TEST-EE-15 · el panel sigue al foco: plan, fase, sesión o ejercicio, con sus herramientas', () => {
  const marca = (atributos) => ({ closest: () => ({ getAttribute: (n) => atributos[n] ?? null }) });
  assert.deepEqual(P.focoDelElemento(marca({ 'data-foco': 'plan' })), { tipo: 'plan' });
  assert.deepEqual(P.focoDelElemento(marca({ 'data-foco': 'ejercicio', 'data-foco-ejercicio': '2' })), { tipo: 'ejercicio', l: 2 });
  assert.deepEqual(P.focoDelElemento(marca({ 'data-foco': 'ejercicio' })), { tipo: 'sesion' });
  assert.equal(P.focoDelElemento({ closest: () => null }), null);
  assert.equal(P.focoDelElemento(null), null);
  assert.equal(P.mismoFoco({ tipo: 'ejercicio', l: 1 }, { tipo: 'ejercicio', l: 1 }), true);
  assert.equal(P.mismoFoco({ tipo: 'ejercicio', l: 1 }, { tipo: 'ejercicio', l: 2 }), false);
  assert.deepEqual(P.HERRAMIENTAS_DEL_FOCO.fase, ['almanaque']);
  assert.deepEqual(P.HERRAMIENTAS_DEL_FOCO.ejercicio, ['la-vez-pasada', 'carga-en-el-tiempo']);
  // La carga más alta de cada vez, de la más vieja a la más nueva; con unidades mezcladas, nada.
  const vez = (fecha, cargas, unit = 'kg') => ({ fecha, como: { tipo: 'series', series: cargas.map((value, n) => ({ numero: n + 1, carga: { value, unit } })) } });
  assert.deepEqual(P.puntosDeCarga([vez('2026-11-20', [60, 62.5]), vez('2026-11-13', [60])]), {
    unidad: 'kg',
    puntos: [
      { fecha: '2026-11-13', carga: 60 },
      { fecha: '2026-11-20', carga: 62.5 },
    ],
  });
  assert.equal(P.puntosDeCarga([vez('2026-11-20', [60]), vez('2026-11-13', [135], 'lb')]), null);
  // El centro marca el foco; el panel tiene «Abrir grande», y los marcos de la parte B quedan nombrados.
  assert.match(EDITOR, /onFocus=\{\(e\) => alMirar\(e\.target\)\}/);
  assert.match(EDITOR, /data-foco="fase"/);
  assert.match(EDITOR, /data-foco="sesion"/);
  assert.match(EJERCICIO, /data-foco="ejercicio"\n\s*data-foco-ejercicio=\{posicion\}/);
  assert.match(PANEL, /abrirGrande: 'Abrir grande'/);
  assert.match(leer('app/pro/advisees/training/panel-contextual.ts'), /'progresiones-y-descargas' \| 'distribucion-por-grupo' \| 'silueta' \| 'graficos-x-y' \| 'favoritos-del-plan'/);
});

test('TEST-EE-16 · el almanaque es una tabla con su mes, flechas, días de sesión como botones y la leyenda de las fases', () => {
  assert.match(ALMANAQUE, /aria-label=\{COPY_ALMANAQUE\.anterior\}/);
  assert.match(ALMANAQUE, /aria-label=\{COPY_ALMANAQUE\.siguiente\}/);
  assert.match(ALMANAQUE, /<table key=\{esteMes\} className="almanaque__tabla" aria-label=\{nombreDelMes\(esteMes\)\}/);
  assert.match(ALMANAQUE, /<th key=\{d\} scope="col" abbr=\{DIA_LARGO\[d\]\}>/);
  assert.match(ALMANAQUE, /aria-current=\{d\.hoy \? 'date' : undefined\}/);
  assert.match(ALMANAQUE, /onClick=\{\(\) => onIrALaSesion\(d\.sesiones\[0\]!\)\}/);
  // ← y → pasan de un día de sesión al otro.
  assert.match(ALMANAQUE, /e\.key !== 'ArrowLeft' && e\.key !== 'ArrowRight'/);
  assert.match(ALMANAQUE, /data-fase=\{semana\.fase === null \? undefined : colorDeLaFase\(semana\.fase\)\}/);
  assert.match(EDITOR, /<CuadroEnfocado abierto=\{almanaqueGrande\} forma="panel"/);
});

test('TEST-EE-17 · «Antes de activar» al lado de «Revisar y activar», con cuántas cosas impiden (EE-06)', () => {
  assert.match(IMPIDE, /impiden: \(n: number\) => \(n === 1 \? '1 cosa impide activar' : `\$\{n\} cosas impiden activar`\)/);
  assert.match(IMPIDE, /aria-expanded=\{abierto\}/);
  assert.match(IMPIDE, /if \(e\.key !== 'Escape' \|\| !abierto\) return;/);
  // Va antes del botón lleno, en la barra; ya no hay pestañas en el panel.
  assert.ok(EDITOR.indexOf('<LoQueImpideActivar') < EDITOR.indexOf('data-revisar-y-activar'));
  assert.doesNotMatch(EDITOR, /CE\.pestanaAntes|role="tab"[^\n]*pestana-\$\{clave\}/);
});

test('TEST-EE-18 · cada acción una sola vez: «Agregar sesión» y «Agregar fase» (E7)', () => {
  // «Agregar sesión» es el menú de la fase abierta (con sesión elegida o sin ninguna, uno u otro): ya no está «+ Sesión».
  assert.doesNotMatch(EDITOR, /data-mas-sesion/);
  // DL-197: «Nueva sesión» al final de las tarjetas (o en la fase sin sesiones); «Agregar fase», en la cabecera de las fases.
  assert.equal((EDITOR.match(/\{agregarUnaSesion\}/g) ?? []).length, 2);
  assert.equal((EDITOR.match(/onAgregar=\{agregarBloque\}/g) ?? []).length, 1);
  // E4: «Qué es una fase» y «Qué es un bloque» van al «?», no en un renglón.
  assert.doesNotMatch(EDITOR, /<Ayuda titulo=/);
  assert.match(leer('app/pro/advisees/training/barra-de-fases-en-pantalla.tsx'), /nombre="Qué es una fase"/);
  assert.match(EDITOR, /<ExplicacionAPedido nombre="Qué es un bloque" como="div" lugar="esquina">/);
});

test('TEST-EE-19 · el plan: inicio con el calendario de BE, duración en semanas, fin, objetivo y anotaciones privadas', () => {
  assert.match(PLAN_Y_FASES, /<CampoDeFecha id=\{`\$\{id\}-inicio`\} etiqueta=\{T\.inicio\}/);
  assert.match(PLAN_Y_FASES, /<CampoDeFecha id=\{`\$\{id\}-fin`\} etiqueta=\{T\.fin\}/);
  assert.match(PLAN_Y_FASES, /soloVos: 'Solo vos'/);
  assert.match(PLAN_Y_FASES, /la persona no lo ve/);
  assert.match(EDITOR, /planning: planificacionEnviada,/);
  assert.match(EDITOR, /setPlanificacion\(r\.datos\.data\.planning \?\? null\);/);
});

test('TEST-EE-20 · el criterio en un renglón: sin ayudas sueltas; el RPE, primero qué es y después su relación con el RIR (E8, E16)', () => {
  assert.doesNotMatch(EJERCICIO, /Necesario, de \$\{RANGO_DEL_ESFUERZO/);
  assert.match(EJERCICIO, /rpe:\n\s*'RPE: la escala de esfuerzo percibido, del 1 al 10\./);
  assert.match(EJERCICIO, /RPE 10 = no podía hacer otra; RPE 9 ≈ me quedaba 1; RPE 8 ≈ me quedaban 2/);
  assert.ok(EJERCICIO.indexOf("rpe:\n") < EJERCICIO.indexOf('rpeYRir:'));
  assert.match(EJERCICIO, /<ExplicacionAPedido nombre=\{COPY_CRITERIO_ARRIBA\.queEsCadaDato\} como="div" lugar="esquina">/);
});

test('TEST-EE-21 · varias series a la vez se leen como una frase; las acciones rápidas de carga y descanso (E10, E11)', () => {
  // DL-197 (F16): «Editar todas las series» es un cuadro; lo vacío conserva su valor.
  assert.match(EJERCICIO, /loVacio: 'Lo que dejes vacío conserva su valor en cada serie\.'/);
  assert.match(EJERCICIO, /<EditarTodasLasSeries\n\s*id=\{id\}/);
  assert.match(EJERCICIO, /const PASOS_RAPIDOS = \{ suggestedLoad: \[-5, -2\.5, -1, 1, 2\.5, 5\], restSeconds: \[-15, -5, 5, 15\] \} as const;/);
  // Los pasos no se llevan el foco del campo.
  assert.match(EJERCICIO, /onMouseDown=\{\(e\) => e\.preventDefault\(\)\}/);
});

test('TEST-EE-22 · en pantalla, las palabras de BE: sin «volumen», «cumplimiento», «adherencia», «racha», «puntaje» ni «asesorado»', () => {
  for (const [nombre, fuente] of Object.entries({ EDITOR, EJERCICIO, PLAN_Y_FASES, ALMANAQUE, PANEL, IMPIDE, APROXIMACIONES })) {
    const textos = [...fuente.matchAll(/'([^'\n]*)'|`([^`\n]*)`|>([^<>{}\n]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
    // Las rutas de los import no son textos de pantalla.
    for (const t of textos.filter((x) => !x.includes('/'))) assert.doesNotMatch(t, /\bvolumen\b|cumplimiento|adherencia|\bracha\b|puntaje|asesorad|estaci[oó]n\b/i, `${nombre}: ${t}`);
  }
  assert.deepEqual(d.terminosProhibidosEn(F.nombreDeFaseNueva([])), []);
});

test('TEST-EE-23 · en Entrenamiento, el contexto de la persona se abre como cajón, por encima: no comprime el editor (E7)', async () => {
  const C = await import('../src/app/pro/advisees/contexto/panel-de-contexto.ts');
  assert.equal(C.modoDelPanelEnElArea('ENTRENAMIENTO', 1920), 'cajon');
  assert.equal(C.modoDelPanelEnElArea('NUTRICION', 1920), 'costado');
  assert.equal(C.modoDelPanelEnElArea('NUTRICION', 1280), 'cajon');
  assert.match(leer('app/pro/advisees/marco-del-area.tsx'), /setModo\(modoDelPanelEnElArea\(areaDelPanel, window\.innerWidth\)\)/);
});
