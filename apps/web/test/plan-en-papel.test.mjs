/**
 * TEST-PG-016 (WP-PULIDO-GRANDES, PG-17, con PG-D12): el plan en papel o en PDF. Sin React ni navegador:
 *  1. la hoja (`src/lib/hoja-del-plan.ts`): quiénes, la versión, «vale desde» y la próxima revisión en palabras, las
 *     comidas con sus opciones y cantidades, o las sesiones con sus series, en el orden del plan;
 *  2. el QR baja la app (el archivo de la portada, PG-06) y no lleva datos de la persona; el nombre del archivo, tampoco;
 *  3. la hoja impresa no imprime la navegación: solo ella sale en el papel, sin botones ni enlaces, y una comida o una
 *     sesión no se parte entre dos páginas;
 *  4. el botón «Descargar el plan en PDF» está en las dos pantallas del plan activo, y con «Ocultar nombres» avisa antes;
 *  5. /invitacion, sin la app, también baja el archivo y no lleva a la página de publicaciones (§10, punto 5).
 *
 * Mutaciones verificadas (cada una pone la prueba en rojo): sacar la regla de impresión que esconde lo demás de la
 * página; poner el identificador del plan en el enlace del QR; tomar «vale desde» del día UTC en lugar del de Buenos
 * Aires; dejar de ordenar las comidas por su orden.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// `lib/hoja-del-plan.ts` importa sus vecinos sin extensión, como los resuelve Next: Node necesita que se la agreguen.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const H = await import('../src/lib/hoja-del-plan.ts');
const D = await import('../src/lib/descarga-de-la-app.ts');
const { terminosProhibidosEn, terminosProhibidosDeEntrenamientoEn } = await import('@be/domain');

const WEB = fileURLToPath(new URL('..', import.meta.url));
const leer = (ruta) => readFileSync(join(WEB, ruta), 'utf8');
const sinComentarios = (codigo) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

// ── Los planes de ejemplo ─────────────────────────────────────────────────────────────────────────────────────

const PERSONA = 'Diego Sosa';
const ASESORADO = '7f1c2d3e-4b5a-4c6d-8e9f-0a1b2c3d4e5f';
const PLAN = '0d9e8f7a-6b5c-4d3e-9f2a-1b0c9d8e7f6a';
const item = (itemId, name, quantity, preparationState = null, note = null) => ({ itemId, catalogItemId: `c-${itemId}`, catalogItemVersionId: `cv-${itemId}`, name, quantity, preparationState, note });
const NUTRICION = {
  planId: PLAN,
  adviseeId: ASESORADO,
  // 10:00 del martes 10 de noviembre de 2026 en Buenos Aires.
  activatedAt: '2026-11-10T13:00:00.000Z',
  dayTypes: [
    { dayTypeId: 'd2', label: 'Día de entrenamiento', order: 2, meals: [] },
    {
      dayTypeId: 'd1',
      label: 'Día habitual',
      order: 1,
      meals: [
        {
          mealId: 'm2',
          label: 'Almuerzo',
          order: 2,
          prescriptionMode: 'OPTIONS',
          options: [{ optionId: 'o1', label: 'Pollo con arroz', order: 1, items: [item('i1', 'Pechuga de pollo', { value: 150, unit: 'g' }, 'COOKED'), item('i2', 'Arroz', null)] }],
        },
        {
          mealId: 'm1',
          label: 'Desayuno',
          order: 1,
          prescriptionMode: 'OPTIONS',
          options: [
            { optionId: 'o3', label: 'Yogur con avena', order: 2, items: [], recipe: { recipeId: 'r', recipeVersionId: 'rv', versionNumber: 2, name: 'Avena cremosa', servings: 2 } },
            { optionId: 'o2', label: 'Tostadas', order: 1, items: [item('i3', 'Pan integral', { value: 60, unit: 'g' }, null, 'Tostado, sin manteca')] },
          ],
        },
      ],
    },
  ],
};

const serie = (setIndex, carga, repeticiones, rir, descanso, note = null) => ({
  setIndex,
  note,
  target: { repetitions: repeticiones, rir, suggestedLoad: carga === null ? null : { value: carga, unit: 'kg' }, restSeconds: descanso },
  targetOrigin: { rir: 'PRESCRIPTION', suggestedLoad: 'PRESCRIPTION', restSeconds: 'PRESCRIPTION' },
});
const prescripcion = (order, exerciseName, sets) => ({
  prescriptionId: `p${order}`,
  order,
  exerciseId: `e${order}`,
  exerciseVersionId: `ev${order}`,
  exerciseName,
  image: null,
  sets,
  intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
  suggestedLoad: null,
  restSeconds: null,
  loadBasis: null,
  repetitionBasis: null,
  professionalParameters: [],
  note: null,
});
const sesion = (sessionId, label, order, prescriptions, instructions = null) => ({ sessionId, label, order, instructions, prescriptions });
const ENTRENAMIENTO = {
  planId: PLAN,
  adviseeId: ASESORADO,
  activatedAt: '2026-11-02T12:00:00.000Z',
  agenda: { startDate: '2026-11-02', sessions: [{ sessionId: 's1', weekdays: ['THURSDAY', 'MONDAY'] }], moves: [] },
  blocks: [
    {
      blockId: 'b2',
      label: 'Bloque 2',
      order: 2,
      purpose: 'Fuerza',
      sessions: [],
      microcycles: [{ microcycleId: 'mc1', label: 'Semana 1', order: 1, purpose: null, sessions: [sesion('s3', 'Completo', 1, [])] }],
    },
    {
      blockId: 'b1',
      label: 'Bloque 1',
      order: 1,
      purpose: 'Base',
      microcycles: [],
      sessions: [
        sesion('s2', 'Torso A', 2, [prescripcion(1, 'Remo con barra', [serie(1, 30, { value: 10 }, 2, 90)])]),
        sesion('s1', 'Piernas A', 1, [prescripcion(1, 'Sentadilla', [serie(1, 40, { value: 8 }, 2, 120), serie(2, 40, { value: 8 }, 2, 120), serie(3, 42.5, { min: 5, max: 6 }, 1, 150, 'La última, más pesada')])], 'Entrar en calor 10 minutos.'),
      ],
    },
  ],
};

const CONTEXTO = { numero: 3, persona: PERSONA, profesional: 'Lic. Sofía Paz', proximaRevision: '2026-11-24', hoy: '2026-11-14' };
const datos = (hoja) => hoja.datos.map((d) => [d.rotulo, d.valor]);

// ── 1. La hoja ──────────────────────────────────────────────────────────────────────────────────────────────────

test('TEST-PG-016 · la hoja dice quiénes, la versión, desde cuándo vale y la próxima revisión, con la fecha en palabras', () => {
  const hoja = H.hojaDeNutricion(NUTRICION, CONTEXTO);
  assert.equal(hoja.titulo, 'Plan de Nutrición');
  assert.deepEqual(datos(hoja), [
    ['Persona', PERSONA],
    ['Profesional', 'Lic. Sofía Paz'],
    ['Versión', '3'],
    ['Vale desde', 'martes 10 de noviembre de 2026'],
    ['Próxima revisión', 'martes 24 de noviembre de 2026'],
  ]);
  // Sin fecha acordada, lo dice; si no se pudo leer, la línea no está (nunca la de la versión, que pudo quedar vieja).
  assert.deepEqual(datos(H.hojaDeNutricion(NUTRICION, { ...CONTEXTO, proximaRevision: null })).at(-1), ['Próxima revisión', 'Sin fecha acordada']);
  assert.ok(!datos(H.hojaDeNutricion(NUTRICION, { ...CONTEXTO, proximaRevision: undefined })).some(([r]) => r === 'Próxima revisión'));
  // Sin el nombre leído todavía, la hoja no inventa uno.
  assert.ok(!datos(H.hojaDeNutricion(NUTRICION, { ...CONTEXTO, persona: null })).some(([r]) => r === 'Persona'));
  assert.deepEqual(hoja.pie, ['Descargada el sábado 14 de noviembre de 2026.', 'Este papel muestra la versión 3. Si tu profesional la cambia, lo vigente está siempre en la app.']);
});

test('TEST-PG-016 · «vale desde» es el día de Buenos Aires, no el de UTC', () => {
  // 22:30 del martes 10 en Buenos Aires: en UTC ya es el miércoles 11.
  const hoja = H.hojaDeNutricion({ ...NUTRICION, activatedAt: '2026-11-11T01:30:00.000Z' }, CONTEXTO);
  assert.deepEqual(datos(hoja)[3], ['Vale desde', 'martes 10 de noviembre de 2026']);
});

test('TEST-PG-016 · Nutrición: todos los días tipo y cada comida con sus opciones y cantidades, en el orden del plan', () => {
  const { cuerpo } = H.hojaDeNutricion(NUTRICION, CONTEXTO);
  assert.equal(cuerpo.area, 'NUTRICION');
  assert.deepEqual(cuerpo.dias.map((d) => d.titulo), ['Día tipo: Día habitual', 'Día tipo: Día de entrenamiento']);
  const [desayuno, almuerzo] = cuerpo.dias[0].comidas;
  assert.equal(desayuno.nombre, 'Desayuno');
  assert.equal(desayuno.cuantas, '2 opciones · se elige una');
  assert.deepEqual(desayuno.opciones.map((o) => o.titulo), ['Opción 1: Tostadas', 'Opción 2: Yogur con avena']);
  assert.deepEqual(desayuno.opciones[0].items, [{ nombre: 'Pan integral', indicado: '60 g', nota: 'Tostado, sin manteca' }]);
  assert.match(desayuno.opciones[1].receta, /^Receta «Avena cremosa», versión 2\. /);
  assert.equal(almuerzo.cuantas, '1 opción');
  assert.equal(almuerzo.opciones[0].titulo, 'Pollo con arroz', 'con una sola opción, sin número');
  assert.deepEqual(
    almuerzo.opciones[0].items.map((i) => [i.nombre, i.indicado]),
    [
      ['Pechuga de pollo', '150 g · cocido'],
      ['Arroz', 'sin cantidad indicada'],
    ],
  );
  // Un día tipo sin comidas lo dice: no queda un hueco.
  assert.equal(cuerpo.dias[1].vacio, 'Este día tipo no tiene comidas.');
});

test('TEST-PG-016 · Entrenamiento: cada bloque y microciclo, con sus sesiones, sus días y sus series', () => {
  const hoja = H.hojaDeEntrenamiento(ENTRENAMIENTO, CONTEXTO);
  assert.equal(hoja.titulo, 'Plan de Entrenamiento');
  assert.deepEqual(datos(hoja)[3], ['Vale desde', 'lunes 2 de noviembre de 2026']);
  const { cuerpo } = hoja;
  assert.equal(cuerpo.area, 'ENTRENAMIENTO');
  assert.equal(cuerpo.sinDias, null, 'con agenda, cada sesión dice sus días');
  assert.deepEqual(cuerpo.grupos.map((g) => [g.titulo, g.proposito]), [
    ['Bloque 1', 'Base'],
    ['Bloque 2 · Semana 1', 'Fuerza'],
  ]);
  const [piernas, torso] = cuerpo.grupos[0].sesiones;
  assert.equal(piernas.titulo, 'Piernas A');
  assert.equal(piernas.dias, 'Días: lunes y jueves');
  assert.equal(piernas.indicaciones, 'Entrar en calor 10 minutos.');
  assert.match(piernas.cuenta, /^1 ejercicio · 3 series$/);
  assert.equal(torso.dias, null, 'una sesión sin días en la agenda no inventa ninguno');
  const [sentadilla] = piernas.ejercicios;
  assert.equal(sentadilla.nombre, 'Sentadilla');
  assert.equal(sentadilla.conRir, true);
  assert.equal(sentadilla.conNota, true);
  assert.deepEqual(sentadilla.series.map((s) => [s.serie, s.carga, s.repeticiones, s.rir, s.descanso, s.nota]), [
    [1, '40 kg', '8 rep.', 'RIR 2', '02:00', null],
    [2, '40 kg', '8 rep.', 'RIR 2', '02:00', null],
    [3, '42,5 kg', '5–6 rep.', 'RIR 1', '02:30', 'La última, más pesada'],
  ]);
  assert.equal(sentadilla.general[0].rotulo, 'Intensidad');
  assert.equal(cuerpo.grupos[1].sesiones[0].vacia, 'Esta sesión no tiene ejercicios.');
  // Sin agenda, lo dice una vez.
  assert.equal(H.hojaDeEntrenamiento({ ...ENTRENAMIENTO, agenda: null }, CONTEXTO).cuerpo.sinDias, 'Las sesiones no tienen un día fijo: cada vez se elige cuál hacer.');
});

// ── 2. El QR y el nombre del archivo ───────────────────────────────────────────────────────────────────────────

test('TEST-PG-016 · el QR baja la app, el mismo archivo de la portada, sin datos de la persona ni del plan', () => {
  for (const hoja of [H.hojaDeNutricion(NUTRICION, CONTEXTO), H.hojaDeEntrenamiento(ENTRENAMIENTO, CONTEXTO)]) {
    assert.equal(hoja.app.enlace, D.APK_DE_LA_ULTIMA);
    assert.equal(hoja.app.enlace, 'https://github.com/Elian-Bufi/be/releases/latest/download/be.apk');
    const qr = JSON.stringify(hoja.app);
    for (const dato of [PERSONA, 'Diego', ASESORADO, PLAN, 'Sofía']) assert.ok(!qr.includes(dato), `el QR no lleva «${dato}»`);
    assert.equal(hoja.app.titulo, 'Escaneá para bajar BE');
    // El nombre del archivo (el título de la pestaña mientras se imprime) no lleva nombres: queda en el historial.
    assert.match(hoja.nombreDelArchivo, /^BE · Plan de (Nutrición|Entrenamiento) · versión 3$/);
    assert.ok(!hoja.nombreDelArchivo.includes('Diego') && !hoja.nombreDelArchivo.includes('Sofía'));
  }
  const componente = sinComentarios(leer('src/components/hoja-del-plan.tsx'));
  assert.match(componente, /<CodigoQr texto=\{hoja\.app\.enlace\} etiqueta=\{hoja\.app\.etiqueta\}/, 'el QR se dibuja en el navegador, sin servicios externos');
  assert.doesNotMatch(componente, /https?:\/\//, 'ningún servicio externo para el QR');
});

// ── 3. La hoja impresa no imprime la navegación ────────────────────────────────────────────────────────────────

/** El bloque `@media print { … }` que habla de la hoja, con sus llaves balanceadas. */
function bloqueDeImpresion(css) {
  let desde = 0;
  for (;;) {
    const inicio = css.indexOf('@media print {', desde);
    assert.ok(inicio >= 0, 'globals.css tiene la hoja de estilos de impresión de la hoja del plan');
    let profundidad = 0;
    for (let i = css.indexOf('{', inicio); i < css.length; i++) {
      if (css[i] === '{') profundidad++;
      else if (css[i] === '}' && --profundidad === 0) {
        const bloque = css.slice(inicio, i + 1);
        if (bloque.includes('.hoja-del-plan')) return bloque;
        desde = i;
        break;
      }
    }
  }
}

test('TEST-PG-016 · al imprimir sale solo la hoja: sin el encabezado, la navegación ni los botones de la página', () => {
  const css = sinComentarios(leer('src/app/globals.css'));
  // En pantalla, la hoja no se ve.
  assert.match(css, /\n\.hoja-del-plan \{\s*display: none;\s*\}/);
  const impresion = bloqueDeImpresion(css);
  // Lo demás de la página (todo lo que no es la hoja, hijo directo de <body>) no sale en el papel.
  assert.match(impresion, /body:has\(> \.hoja-del-plan\) > :not\(\.hoja-del-plan\) \{\s*display: none !important;\s*\}/);
  assert.match(impresion, /\.hoja-del-plan \{\s*display: block;/);
  // Una comida o una sesión no se parte entre dos páginas.
  assert.match(impresion, /\.hoja-del-plan__bloque \{[^}]*break-inside: avoid;/);
  // Sin tamaño de papel fijo: sirve en A4 y en carta.
  assert.doesNotMatch(impresion, /size:\s*(A4|letter)/i);
  // Negro sobre blanco, con los tokens de la hoja (los mide la prueba de contraste).
  assert.match(impresion, /color: var\(--hoja-texto\);\s*background: var\(--hoja-fondo\);/);
});

test('TEST-PG-016 · la hoja va aparte de la página y no tiene nada que se toque', () => {
  const componente = sinComentarios(leer('src/components/hoja-del-plan.tsx'));
  assert.match(componente, /createPortal\(<Hoja hoja=\{hoja\} \/>, document\.body\)/, 'hija directa de <body>');
  assert.match(componente, /<article className="hoja-del-plan"/);
  assert.doesNotMatch(componente, /<(nav|button|a|input|select|textarea|Link|Enlace)\b|onClick|href=/, 'ni navegación, ni botones, ni enlaces');
});

// ── 4. El botón, en las dos pantallas ──────────────────────────────────────────────────────────────────────────

test('TEST-PG-016 · «Descargar el plan en PDF» está en el plan activo de Nutrición y en el de Entrenamiento', () => {
  assert.equal(H.COPY_HOJA_DEL_PLAN.descargar, 'Descargar el plan en PDF');
  for (const [archivo, area] of [
    ['src/app/pro/advisees/nutrition/plan.tsx', 'NUTRICION'],
    ['src/app/pro/advisees/training/plan.tsx', 'ENTRENAMIENTO'],
  ]) {
    const codigo = leer(archivo);
    const activo = codigo.slice(codigo.indexOf('function PlanActivo('));
    assert.match(activo.slice(0, activo.indexOf('\n}\n')), new RegExp(`<DescargarElPlan plan=\\{\\{ area: '${area}', version \\}\\} numero=\\{numero\\}`), archivo);
  }
  const boton = sinComentarios(leer('src/app/pro/advisees/descargar-el-plan.tsx'));
  // Abre la ventana de impresión del navegador con la hoja montada: ningún archivo se genera en el servidor.
  assert.match(boton, /window\.print\(\)/);
  assert.match(boton, /\{hoja \? <HojaDelPlanImpresa hoja=\{hoja\} \/> : null\}/);
  assert.match(boton, /<Pista texto=\{C\.ayuda\}>/, 'dice antes de tocarlo que se abre la ventana de impresión');
  // Con «Ocultar nombres», avisa antes de imprimir.
  assert.match(boton, /if \(ocultos\) return setConfirmando\(true\);/);
  assert.match(boton, /titulo=\{C\.conNombresOcultosTitulo\}/);
  // Y el título de la pestaña vuelve a ser el de antes.
  assert.match(boton, /document\.title = hoja\.nombreDelArchivo;/);
  assert.match(boton, /document\.title = titulo;/);
});

// ── 5. /invitacion ─────────────────────────────────────────────────────────────────────────────────────────────

test('TEST-PG-016 · /invitacion, sin la app, baja el mismo archivo y no lleva a la página de publicaciones', () => {
  const invitacion = leer('src/app/invitacion/abrir-invitacion.tsx');
  assert.doesNotMatch(invitacion, /releases\/latest['"`]/);
  assert.match(invitacion, /href=\{APK_DE_LA_ULTIMA\} download/);
  assert.match(invitacion, /S\.browser_fallback_url=\$\{encodeURIComponent\(APK_DE_LA_ULTIMA\)\}/);
});

// ── Las palabras ───────────────────────────────────────────────────────────────────────────────────────────────

test('TEST-PG-019 · los textos de la hoja y del botón ubican, no califican', () => {
  const copia = Object.values(H.COPY_HOJA_DEL_PLAN).map((v) => (typeof v === 'function' ? v('Nutrición', 3) : v));
  const nutricion = [...copia, ...H.textosDeLaHoja(H.hojaDeNutricion(NUTRICION, CONTEXTO))];
  const entrenamiento = [...copia, ...H.textosDeLaHoja(H.hojaDeEntrenamiento(ENTRENAMIENTO, CONTEXTO))];
  assert.deepEqual(nutricion.flatMap((t) => terminosProhibidosEn(t).map((p) => `${p} en «${t}»`)), []);
  assert.deepEqual(entrenamiento.flatMap((t) => terminosProhibidosDeEntrenamientoEn(t).map((p) => `${p} en «${t}»`)), []);
  assert.ok(nutricion.every((t) => !/\b(asesorad[oa]s?|cumplimiento|adherencia|racha|puntaje)\b/i.test(t)));
});
