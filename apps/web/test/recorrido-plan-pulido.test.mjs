/**
 * WP-RECORRIDO-PLAN-PULIDO (DL-188) · Lo que pidió Dirección al recorrer la planificación de Nutrición en el escritorio
 * profesional, sin React: la cabecera del área en una franja con la revalidación al recuperar el foco (RP-01), los errores
 * que no mueven los campos (RP-03), el ícono con el número y la abreviatura (RP-07), la cuenta de los gramos detrás de un
 * «?» (RP-08) y el reparto por comida en el plan (RP-06). El calculador (RP-05, RP-09) está en objetivo-y-calculador.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const N = await import('../src/app/pro/advisees/datos-nuevos.ts');
const A = await import('../src/app/pro/advisees/nutrition/abreviaturas-de-macros.ts');
const leer = (r) => readFileSync(new URL(`../src/${r}`, import.meta.url), 'utf8');

const YO = 'p-yo';
const OTRO = 'p-otro';
const dominios = (cambios = {}) => ({
  nutrition: {
    available: true,
    relationshipId: 'r1',
    summary: {
      activePlan: { planVersionId: 'v1', activatedAt: '2026-11-01T10:00:00.000Z', nextReviewAt: null },
      objective: { objectiveVersionId: 'o1', estimatedEnergyRequirement: { value: 2500, unit: 'kcal/day' }, authoredBy: { identityId: YO, displayName: 'Yo' }, effectiveFrom: '2026-11-01T10:00:00.000Z' },
      lastReview: null,
      draftPlan: { planVersionId: 'v2', recordedAt: '2026-11-20T10:00:00.000Z', fromReviewId: null },
      registeredIntakes: 4,
      lastIntakeAt: '2026-11-20T13:00:00.000Z',
      ...cambios,
    },
  },
  training: { available: false, reason: 'NOT_AVAILABLE_TO_VIEW' },
  anthropometry: { available: true, relationshipId: 'r3', summary: null },
});

test('RP-01 · la huella cambia con lo que llega de otros, y no con lo que escribe quien mira', () => {
  const base = N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], dominios(), YO);
  // Un registro nuevo de la persona: hay datos nuevos.
  assert.ok(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], dominios({ registeredIntakes: 5, lastIntakeAt: '2026-11-21T09:00:00.000Z' }), YO)));
  // Un objetivo de otro profesional: también.
  const deOtro = dominios({ objective: { objectiveVersionId: 'o2', estimatedEnergyRequirement: { value: 2400, unit: 'kcal/day' }, authoredBy: { identityId: OTRO, displayName: 'Otra' }, effectiveFrom: '2026-11-21T10:00:00.000Z' } });
  assert.ok(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], deOtro, YO)));
  // Lo propio (el borrador guardado, la versión activada, un objetivo propio nuevo): no es «nuevo».
  const propio = dominios({
    draftPlan: { planVersionId: 'v2', recordedAt: '2026-11-21T11:00:00.000Z', fromReviewId: null },
    activePlan: { planVersionId: 'v3', activatedAt: '2026-11-21T11:00:00.000Z', nextReviewAt: null },
    objective: { objectiveVersionId: 'o3', estimatedEnergyRequirement: { value: 2300, unit: 'kcal/day' }, authoredBy: { identityId: YO, displayName: 'Yo' }, effectiveFrom: '2026-11-21T11:00:00.000Z' },
  });
  assert.equal(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], propio, YO)), false);
  // El acceso que cambia, también se dice.
  assert.ok(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Pausado'], dominios(), YO)));
  // Una falla no se compara, y sin la primera lectura no hay nada que decir.
  assert.equal(N.huellaDelArea('NUTRICION', [], null, YO), null);
  assert.equal(N.hayDatosNuevos(null, base), false);
  assert.equal(N.hayDatosNuevos(base, null), false);
  // Un área mira solo lo suyo: un cambio en otra no la toca.
  const conOtraArea = { ...dominios(), training: { available: true, relationshipId: 'r2', summary: null } };
  assert.equal(N.hayDatosNuevos(base, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], conOtraArea, YO)), false);
  assert.ok(N.hayDatosNuevos(N.huellaDelArea(null, [], dominios(), YO), N.huellaDelArea(null, [], conOtraArea, YO)));
  // Sin nombres: solo estados e identificadores.
  assert.doesNotMatch(base, /Yo|Otra/);
});

test('RP-01 · la cabecera: sin «Actualizar» ni «Consultado a las»; la vuelta como botón; el acceso en un chip; «Hay datos nuevos · Ver»', () => {
  const marco = leer('app/pro/advisees/marco-del-area.tsx');
  assert.doesNotMatch(marco, /Consultado a las \{|horaDelDia|>\s*Actualizar\s*</);
  assert.match(marco, /className="boton boton--fantasma boton--compacto marco-del-area__volver"/);
  assert.match(marco, /const fichaDe = nombre \? `Ficha de \$\{nombre\}` : 'Ficha de la persona';/);
  assert.match(marco, /document\.visibilityState === 'visible' && Date\.now\(\) - ultimaConsulta\.current > VOLVER_A_LEER_AL_VOLVER_MS\) void leer\(true, 'comparar'\)/);
  assert.match(marco, /<span className="marco-del-area__nuevos" role="status">/);
  // «Ver» pasa por la guardia de la salida: un borrador sin guardar no se pisa.
  assert.match(marco, /antesDeSalir\(\(\) => \{\s*setHayNuevos\(false\);/);
  assert.match(marco, /className="chip-del-acceso" data-chip-del-acceso/);
  const ficha = leer('app/pro/advisees/workspace.tsx');
  assert.doesNotMatch(ficha, /Consultado a las \{|horaDelDia/);
  assert.match(ficha, /void leer\(true, 'comparar'\)/);
  const css = leer('app/globals.css');
  assert.match(css, /\.chip-del-acceso \{[^}]*white-space: nowrap;/);
  for (const t of Object.values(N.COPY_DATOS_NUEVOS)) assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|estaci[oó]n/i);
});

test('RP-03 · las filas de campos se alinean por arriba y el botón suelto baja lo que ocupa un rótulo', () => {
  const css = leer('app/globals.css');
  const regla = css.slice(css.indexOf('RP-03 (WP-RECORRIDO-PLAN-PULIDO'));
  assert.match(regla, /\.fila-de-dato,\s*\.campos-del-ingrediente,\s*\.lo-general-del-editor__par,\s*\.medicion-libre \{\s*align-items: start;/);
  assert.match(regla, /\.fila-de-dato > \.boton,\s*\.fila-de-dato > \.acciones \{\s*margin-top: calc\(1\.55rem \+ 0\.3rem\);/);
});

test('RP-07 · ícono, número y abreviatura, con la palabra completa para el lector de pantalla', () => {
  assert.equal(A.cantidadAbreviada('kcal', '2.500'), '2.500 kcal');
  assert.equal(A.cantidadAbreviada('protein', '112'), '112 g P');
  assert.equal(A.cantidadAbreviada('carbohydrate', '335'), '335 g C');
  assert.equal(A.cantidadAbreviada('fat', '80'), '80 g G');
  assert.equal(A.cantidadEnPalabras('protein', '112'), '112 gramos de proteínas');
  assert.equal(A.cantidadEnPalabras('kcal', '2.500'), '2.500 kilocalorías');
  assert.equal(A.cantidadEnPalabras('fat', '110 a 134'), '110 a 134 gramos de grasas');
  assert.deepEqual(A.ICONO_DEL_MACRO, { kcal: 'calorias', protein: 'proteinas', carbohydrate: 'carbohidratos', fat: 'grasas' });
  const pieza = leer('app/pro/advisees/nutrition/cantidad-del-macro.tsx');
  assert.match(pieza, /<span aria-hidden="true">\{cantidadAbreviada\(macro, cifra\)\}<\/span>/);
  assert.match(pieza, /<span className="visualmente-oculto">\{cantidadEnPalabras\(macro, cifra\)\}<\/span>/);
});

test('RP-08 · la cuenta de los gramos va detrás de un «?» junto al objetivo del día; si no coinciden, el aviso corto queda a la vista', () => {
  const piezas = leer('app/pro/advisees/nutrition/suma-de-los-rangos.tsx');
  const compacto = piezas.slice(piezas.indexOf('if (compacto) {'), piezas.indexOf('return (\n    <div className="kcal-del-objetivo" data-kcal-del-objetivo>'));
  assert.match(compacto, /<ExplicacionAPedido nombre=\{C\.cuentaDeLosGramos\} como="div">/);
  assert.match(compacto, /\{noCoinciden && kcal !== null \? \(\s*<p className="kcal-del-objetivo__aviso" data-no-coinciden>/);
  assert.match(compacto, /C\.noCoincidenCorto\(k, kcal\)/);
  // Lo largo (la cuenta con 4, 4 y 9 y la parte de cada macro) queda adentro del «?».
  assert.ok(compacto.indexOf('C.kcalEnUnRenglon(k)') > compacto.indexOf('<ExplicacionAPedido'));
  assert.ok(compacto.indexOf('data-porcentajes-del-objetivo') > compacto.indexOf('<ExplicacionAPedido'));
});

test('RP-07 · la pieza se usa en el calculador, las comidas, los rangos y «Rangos y totales»', () => {
  for (const [archivo, pieza] of [
    ['nutrition/calculador.tsx', '<CantidadDelMacro '],
    ['nutrition/referencia-del-objetivo.tsx', '<CantidadDelMacro '],
    ['nutrition/comida-del-editor.tsx', '<RangoIndicadoConIconos '],
    ['nutrition/comida-del-editor.tsx', '<NutrientesConIconos cifras={cifrasDelTotal(total)}'],
    ['nutrition/suma-de-los-rangos.tsx', '<RangoIndicadoConIconos '],
    ['nutrition/rangos-indicados-del-plan.tsx', '<RangoIndicadoConIconos '],
    ['nutrition/editor.tsx', '<RotuloConIcono macro={MACRO_DEL_NUTRIENTE[n]}'],
  ]) {
    assert.ok(leer(`app/pro/advisees/${archivo}`).includes(pieza), `${archivo}: ${pieza}`);
  }
  assert.equal(A.cifraDeLosLimites(125, 156), '125 a 156');
  assert.equal(A.cifraDeLosLimites(30, null), 'desde 30');
  assert.equal(A.cifraDeLosLimites(null, 1850), 'hasta 1.850');
  assert.equal(A.cifraDeLosLimites(40, 40), '40');
});

test('RP-06 · el reparto por comida, en el plan: una parte por comida que suma 100 y propone kcal, P, C y G', async () => {
  const P = await import('../src/app/pro/advisees/nutrition/propuesta-de-rangos.ts');
  const DIA = { dayTypeId: 'd1', nombre: 'Día habitual', comidas: [{ mealId: 'm1', nombre: 'Desayuno' }, { mealId: 'm2', nombre: 'Almuerzo' }, { mealId: 'm3', nombre: 'Merienda' }, { mealId: 'm4', nombre: 'Cena' }] };
  const objetivo = { estimatedEnergyRequirement: { value: 2500 }, macronutrientDistribution: { protein: { value: 112, unit: 'g/day' }, carbohydrate: { value: 335, unit: 'g/day' }, fat: { value: 80, unit: 'g/day' } } };
  const fuente = P.fuenteDeLaPropuesta(objetivo, null);
  // El punto de partida: una sola parte por comida, la misma para los tres macros, que suma exactamente 100.
  for (const modo of ['sugerido', 'parejo']) {
    const r = P.repartoInicialUnico(DIA, modo);
    for (const c of DIA.comidas) assert.notEqual(P.parteUnica(r, c.mealId), null, `${modo} ${c.mealId}`);
    assert.deepEqual(P.sumaDeLasPartes(DIA, r), { protein: 100, carbohydrate: 100, fat: 100 }, modo);
  }
  assert.deepEqual(DIA.comidas.map((c) => P.parteUnica(P.repartoInicialUnico(DIA, 'parejo'), c.mealId)), ['25', '25', '25', '25']);
  // 25 % de cada macro por comida, sin margen: 28 g de proteínas, 84 de carbohidratos y 20 de grasas, con sus kcal.
  const parejo = P.propuestaDelDia(DIA, P.repartoInicialUnico(DIA, 'parejo'), fuente, 0);
  assert.ok(parejo.ok);
  assert.deepEqual(parejo.comidas[0].protein, { min: 28, max: 28 });
  assert.deepEqual(parejo.comidas[0].carbohydrate, { min: 84, max: 84 });
  assert.deepEqual(parejo.comidas[0].fat, { min: 20, max: 20 });
  assert.deepEqual(P.kcalDelRango(parejo.comidas[0]), { min: 4 * 28 + 4 * 84 + 9 * 20, max: 4 * 28 + 4 * 84 + 9 * 20 });
  // Las comidas suman exactamente el día.
  for (const m of ['protein', 'carbohydrate', 'fat']) assert.equal(parejo.comidas.reduce((s, c) => s + c[m].min, 0), parejo.dia[m].min);
  // Revisión del PR: el «%» de cada parte va con la base de la cuenta, lo que suman los gramos del día (4, 4 y 9), no las
  // kcal escritas en el objetivo. Con 2.100 kcal escritas y gramos que suman 1.985, «46 % de las 2.100 kcal» quedaba al
  // lado de 823 a 1.005 kcal, que es el 46 % de 1.985 con el margen.
  assert.equal(P.kcalDeLosGramosDelDia({ protein: 130, carbohydrate: 220, fat: 65 }), 1985);
  assert.equal(P.COPY_PROPUESTA.deLasKcal(1985), '% de las 1.985 kcal');
  const DOS = { ...DIA, comidas: DIA.comidas.slice(0, 2) };
  const conOtrasKcal = P.fuenteDeLaPropuesta({ estimatedEnergyRequirement: { value: 2100 }, macronutrientDistribution: { protein: { value: 130, unit: 'g/day' }, carbohydrate: { value: 220, unit: 'g/day' }, fat: { value: 65, unit: 'g/day' } } }, null);
  const dos = P.propuestaDelDia(DOS, P.conParteUnica(P.conParteUnica(P.repartoInicialUnico(DOS, 'parejo'), 'm1', '46'), 'm2', '54'), conOtrasKcal, 0);
  assert.ok(dos.ok);
  const delDesayuno = P.kcalDelRango(dos.comidas[0]).min;
  assert.ok(Math.abs(delDesayuno - 0.46 * P.kcalDeLosGramosDelDia(conOtrasKcal.dia)) < 10, `las kcal del desayuno (${delDesayuno}) son el 46 % de lo que suman los gramos`);
  const delPlan = leer('app/pro/advisees/nutrition/propuesta-de-rangos-del-plan.tsx');
  assert.match(delPlan, /C\.deLasKcal\(base\)/);
  assert.match(delPlan, /C\.sumaDeLasPartes\(sumas\.protein, base\)/);
  assert.doesNotMatch(delPlan, /% de las \$\{numero\(gramos\.kcal/);
  // Revisión del PR: un día tipo sin comidas no muestra el reparto, y el texto no promete una propuesta que no se hace.
  assert.doesNotMatch(P.COPY_PROPUESTA.sinComidasGuardadas, /se propone/);
  assert.match(delPlan, /dia && comidasSinGuardar === 0 \? C\.sinComidasGuardadas : C\.sinDiaGuardado/);
  // Revisión del PR: en el paso de los rangos del asistente se ven los repartos de todos los días tipo, uno debajo del
  // otro; cada título dice de qué día es (con comidas que se llaman igual, eran cuadros idénticos con el mismo nombre).
  assert.equal(P.COPY_PROPUESTA.tituloDelDia('Día de descanso'), 'Reparto por comida · Día de descanso');
  assert.match(delPlan, /\{nombreDelDia \? C\.tituloDelDia\(nombreDelDia\) : C\.titulo\}/);
  assert.match(leer('app/pro/advisees/nutrition/editor.tsx'), /estructura\.map\(\(d, n\) => \(\s*<RepartoPorComida [^\n]*nombreDelDia=\{nombreDelDiaTipo\(d, n\)\}/);
  // Si no suman 100, no se propone y se dice cuánto suman.
  const corto = P.conParteUnica(P.repartoInicialUnico(DIA, 'parejo'), 'm4', '20');
  assert.equal(P.parteUnica(corto, 'm4'), '20');
  assert.equal(P.sumaDeLasPartes(DIA, corto).protein, 95);
  assert.equal(P.propuestaDelDia(DIA, corto, fuente, 10).ok, false);
  assert.equal(P.COPY_PROPUESTA.noSumaUnica(95), 'Las partes suman 95 de 100. Ajustalas para proponer.');
  // Repartir cada macro por separado sigue disponible: entonces la parte única no existe.
  const porMacro = P.repartoInicial(DIA, 'sugerido');
  assert.equal(P.parteUnica(porMacro, 'm3'), null);
  // Solo llena lo vacío: lo ya escrito se conserva sin la casilla, como antes.
  const datos = { revision: 2, bodyWeight: null, dayTypes: [{ dayTypeId: 'd1', day: null, meals: [{ mealId: 'm2', range: { protein: { unit: 'g', perKg: null, grams: { min: 30, max: 40 } } } }] }] };
  const propuesto = { dayTypeId: 'd1', dia: parejo.dia, comidas: DIA.comidas.map((c, j) => ({ mealId: c.mealId, rango: parejo.comidas[j] })) };
  const nombre = (_d, m) => (m === null ? 'todo el día' : DIA.comidas.find((c) => c.mealId === m).nombre);
  assert.deepEqual(P.cuerpoConLaPropuesta(datos, [propuesto], nombre, false).conservados, ['Almuerzo']);
  // La pantalla: a la vista en el día tipo (no en un cuadro), y la casilla para reemplazar.
  const editor = leer('app/pro/advisees/nutrition/editor.tsx');
  assert.match(editor, /<RepartoPorComida key=\{dia\.dayTypeId \?\? `nuevo-\$\{i\}`\}/);
  assert.doesNotMatch(editor, /PropuestaDeRangos/);
  const pieza = leer('app/pro/advisees/nutrition/propuesta-de-rangos-del-plan.tsx');
  assert.doesNotMatch(pieza, /CuadroEnfocado/);
  assert.match(pieza, /data-reemplazar-rangos/);
  // La distribución por comida salió del objetivo.
  assert.doesNotMatch(leer('app/pro/advisees/nutrition/formularios.tsx'), /Distribución por comidas \(opcional\)/);
});
