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
  // Revisión del PR: con el detalle en la pista, «Nutrición: Vínculo activo» callaba que el acceso no rige. El chip suma
  // lo que falta, corto, y con pista recibe el foco (la pista aparece con el teclado y el lector la lee).
  assert.match(marco, /texto=\{`\$\{nombres\}: \$\{estadoEnElChip\(g\.e\)\}`\}/);
  assert.match(marco, /e\.estado === COPY_VINCULO\.vinculoActivoAccesoPendiente && e\.detalle\s*\? `\$\{e\.estado\} · \$\{e\.detalle === COPY_VINCULO\.accesoPendienteDelAsesorado \? 'acceso pendiente' : COPY_VINCULO\.accesoNoDisponible\.toLowerCase\(\)\}`/);
  assert.match(marco, /data-chip-del-acceso tabIndex=\{pista \? 0 : undefined\}/);
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
  // RP-19: la frase entera con su base, para el lector de pantalla, en «Todo el día».
  assert.match(delPlan, /C\.sumaDeLasPartes\(sumas\.protein\.suma, base\)/);
  assert.doesNotMatch(delPlan, /% de las \$\{numero\(gramos\.kcal/);
  // Revisión del PR: un día tipo sin comidas no muestra el reparto, y el texto no promete una propuesta que no se hace.
  assert.doesNotMatch(P.COPY_PROPUESTA.sinComidasGuardadas, /se propone/);
  assert.match(delPlan, /dia && comidasSinGuardar === 0 \? C\.sinComidasGuardadas : C\.sinDiaGuardado/);
  // Revisión del PR: lo escrito vuelve al punto de partida si cambian las comidas, no si cambia el nombre de una.
  assert.match(delPlan, /const claveDelDia = dia \? `\$\{dia\.dayTypeId\}\|\$\{dia\.comidas\.map\(\(c\) => c\.mealId\)\.join\(','\)\}` : '';/);
  // Revisión del PR: en el paso de los rangos del asistente se ven los repartos de todos los días tipo, uno debajo del
  // otro; cada título dice de qué día es (con comidas que se llaman igual, eran cuadros idénticos con el mismo nombre).
  assert.equal(P.COPY_PROPUESTA.tituloDelDia('Día de descanso'), 'Reparto por comida · Día de descanso');
  assert.match(delPlan, /\{nombreDelDia \? C\.tituloDelDia\(nombreDelDia\) : C\.titulo\}/);
  assert.match(leer('app/pro/advisees/nutrition/editor.tsx'), /estructura\.map\(\(d, n\) => \(\s*<RepartoPorComida [^\n]*nombreDelDia=\{nombreDelDiaTipo\(d, n\)\}/);
  // Si no suman 100, no se propone y se dice cuánto suman (RP-19: en «Todo el día», con lo que falta).
  const corto = P.conParteUnica(P.repartoInicialUnico(DIA, 'parejo'), 'm4', '20');
  assert.equal(P.parteUnica(corto, 'm4'), '20');
  assert.equal(P.sumaDeLasPartes(DIA, corto).protein, 95);
  assert.equal(P.propuestaDelDia(DIA, corto, fuente, 10).ok, false);
  assert.equal(P.loQueFaltaDeLaSuma(P.sumasEnVivo(DIA, corto).protein, { cantidad: 2508, unidad: 'kcal' }), 'faltan 125 kcal');
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
  // Revisión del PR: después de las comidas y de «Agregar comida». Arriba, al llegar el cálculo del objetivo, crecía y
  // corría las comidas bajo el puntero.
  assert.ok(editor.indexOf('<RepartoPorComida key={dia.dayTypeId') > editor.indexOf('id="agregar-comida"'), 'el reparto va después de «Agregar comida»');
  assert.ok(editor.indexOf('<RepartoPorComida key={dia.dayTypeId') > editor.indexOf('<ComidaDelEditor'), 'el reparto va después de las comidas');
  assert.doesNotMatch(editor, /PropuestaDeRangos/);
  const pieza = leer('app/pro/advisees/nutrition/propuesta-de-rangos-del-plan.tsx');
  assert.doesNotMatch(pieza, /CuadroEnfocado/);
  assert.match(pieza, /data-reemplazar-rangos/);
  // La distribución por comida salió del objetivo.
  assert.doesNotMatch(leer('app/pro/advisees/nutrition/formularios.tsx'), /Distribución por comidas \(opcional\)/);
});

// ─── RP-19 · Sin saltos ──────────────────────────────────────────────────────────────────────────────────────────────

const DIA_19 = { dayTypeId: 'd1', nombre: 'Día habitual', comidas: [{ mealId: 'm1', nombre: 'Desayuno' }, { mealId: 'm2', nombre: 'Almuerzo' }, { mealId: 'm3', nombre: 'Merienda' }, { mealId: 'm4', nombre: 'Cena' }] };
const OBJETIVO_19 = { estimatedEnergyRequirement: { value: 2500 }, macronutrientDistribution: { protein: { value: 112, unit: 'g/day' }, carbohydrate: { value: 335, unit: 'g/day' }, fat: { value: 80, unit: 'g/day' } } };
const conPartes = (P, partes) => DIA_19.comidas.reduce((e, c, i) => P.conParteUnica(e, c.mealId, partes[i]), P.repartoInicialUnico(DIA_19, 'parejo'));

test('RP-19 · cada fila del reparto muestra su rango aunque las partes no sumen 100: no depende de las demás', async () => {
  const P = await import('../src/app/pro/advisees/nutrition/propuesta-de-rangos.ts');
  const fuente = P.fuenteDeLaPropuesta(OBJETIVO_19, null);
  // El caso de Dirección: 24 + 28 + 24 + 23 = 99. No se propone, pero cada fila tiene su rango.
  const noventaYNueve = conPartes(P, ['24', '28', '24', '23']);
  assert.equal(P.propuestaDelDia(DIA_19, noventaYNueve, fuente, 10).ok, false);
  const filas = P.rangosPorFila(DIA_19, noventaYNueve, fuente, 10);
  assert.equal(filas.length, 4);
  for (const f of filas) {
    for (const m of ['protein', 'carbohydrate', 'fat']) assert.notEqual(f.macros[m], null);
    assert.notEqual(f.kcal, null);
  }
  // El día, con su margen: 112 g ± 10 % es 101 a 123 g. La comida del 24 %: 24 a 30 g (cada una redondea lo suyo).
  const dia = P.rangoDelDia(fuente, 'dia', 10);
  assert.deepEqual(dia.protein, { min: 101, max: 123 });
  assert.deepEqual(filas[0].macros.protein, { min: 24, max: 30 });
  assert.deepEqual(filas[0].kcal, P.kcalDelRango(filas[0].macros));
  // El rango de una comida no depende de las demás: cambiar la cena no toca el desayuno.
  const otraCena = P.rangosPorFila(DIA_19, conPartes(P, ['24', '28', '24', '40']), fuente, 10);
  assert.deepEqual(otraCena[0], filas[0]);
  // Una parte vacía deja su fila sin rango («—», con el mismo alto); las otras siguen con el suyo.
  const conVacia = P.rangosPorFila(DIA_19, conPartes(P, ['24', '', '24', '23']), fuente, 10);
  assert.deepEqual(conVacia[1], { macros: { protein: null, carbohydrate: null, fat: null }, kcal: null });
  assert.deepEqual(conVacia[0], filas[0]);
  // Por macro, una parte que no es un número: ese macro sin rango y la fila sin kcal; los otros dos, con el suyo.
  const porMacro = P.repartoInicial(DIA_19, 'parejo');
  const ilegible = { ...porMacro, comidas: { ...porMacro.comidas, m1: { ...porMacro.comidas.m1, fat: '2x' } } };
  const fila = P.rangosPorFila(DIA_19, ilegible, fuente, 10)[0];
  assert.equal(fila.macros.fat, null);
  assert.notEqual(fila.macros.protein, null);
  assert.equal(fila.kcal, null);
  assert.equal(P.parteEscrita('2x'), null);
  assert.equal(P.parteEscrita('24,5'), 24.5);
  assert.equal(P.parteEscrita(''), null);
  // Con 100, es exactamente lo que se propone y se guarda (el resto mayor reparte los redondeos).
  const cien = conPartes(P, ['24', '28', '24', '24']);
  const propuesta = P.propuestaDelDia(DIA_19, cien, fuente, 10);
  assert.ok(propuesta.ok);
  assert.deepEqual(P.rangosPorFila(DIA_19, cien, fuente, 10).map((f) => f.macros), propuesta.comidas);
  // El día no depende del reparto: el mismo con 99 que con 100.
  assert.deepEqual(propuesta.dia, dia);
});

test('RP-19 · la suma de las partes en vivo: «99 %» con lo que falta, «103 %» con lo que sobra (en kcal o g), 100 sin nada', async () => {
  const P = await import('../src/app/pro/advisees/nutrition/propuesta-de-rangos.ts');
  const suma = (partes) => P.sumasEnVivo(DIA_19, conPartes(P, partes)).protein;
  // Lo que falta o sobra, en la unidad de la base (sin un «%» suelto): 2.508 kcal son las que suman 112, 335 y 80 g.
  const KCAL = { cantidad: 2508, unidad: 'kcal' };
  const s99 = suma(['24', '28', '24', '23']);
  assert.deepEqual(s99, { suma: 99, bien: false, hayIlegibles: false });
  assert.equal(P.loQueFaltaDeLaSuma(s99, KCAL), 'faltan 25 kcal');
  assert.equal(P.loQueFaltaDeLaSuma(suma(['25', '28', '25', '25']), KCAL), 'sobran 75 kcal');
  assert.equal(P.loQueFaltaDeLaSuma(suma(['25', '25', '25', '20']), KCAL), 'faltan 125 kcal');
  assert.equal(P.loQueFaltaDeLaSuma(s99, { cantidad: 130, unidad: 'g' }), 'faltan 1,3 g');
  assert.equal(P.loQueFaltaDeLaSuma(suma(['25', '26', '25', '25']), { cantidad: 100, unidad: 'g' }), 'sobra 1 g');
  assert.equal(P.COPY_PROPUESTA.baseDeLaSuma(1985, 'kcal'), 'de las 1.985 kcal');
  assert.equal(P.COPY_PROPUESTA.baseDeLaSuma(130, 'g'), 'de los 130 g');
  const cien = suma(['25', '25', '25', '25']);
  assert.equal(cien.bien, true);
  assert.equal(P.loQueFaltaDeLaSuma(cien, KCAL), '');
  // El medio punto de redondeo de siempre (`problemasDelReparto`): 99,6 deja proponer y no dice nada.
  assert.equal(P.loQueFaltaDeLaSuma(suma(['24,6', '25', '25', '25']), KCAL), '');
  assert.equal(P.COPY_PROPUESTA.sumaEnVivo(99), '99 %');
  // Por macro, una parte que no es un número: se marca y no deja proponer.
  const porMacro = P.repartoInicial(DIA_19, 'parejo');
  const s = P.sumasEnVivo(DIA_19, { ...porMacro, comidas: { ...porMacro.comidas, m2: { ...porMacro.comidas.m2, carbohydrate: 'abc' } } }).carbohydrate;
  assert.equal(s.hayIlegibles, true);
  assert.equal(P.loQueFaltaDeLaSuma(s, { cantidad: 335, unidad: 'g' }), 'revisá la marcada');
  // El «%» de cada parte, con su base en el rótulo de la columna.
  assert.equal(P.COPY_PROPUESTA.deLosGramos(130), '% de los 130 g');
  for (const t of [P.COPY_PROPUESTA.noSuman, P.COPY_PROPUESTA.contieneElObjetivo, P.COPY_PROPUESTA.quedaAfuera, P.COPY_PROPUESTA.sinComparar(['grasas'])]) {
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|estaci[oó]n/i);
  }
});

test('RP-19 · la suma de los rangos indicados frente al objetivo, en una línea del reparto (pedido del 22/11)', async () => {
  const P = await import('../src/app/pro/advisees/nutrition/propuesta-de-rangos.ts');
  const rango = (p, c, g) => ({ protein: { unit: 'g', perKg: null, grams: p }, carbohydrate: { unit: 'g', perKg: null, grams: c }, fat: { unit: 'g', perKg: null, grams: g } });
  // Sin rangos indicados, nada (el renglón queda vacío, con su alto).
  assert.deepEqual(P.chequeoDeLaSuma(DIA_19.comidas.map((c) => ({ nombre: c.nombre, rango: null })), OBJETIVO_19), { estado: 'sin-rangos' });
  assert.equal(P.chequeoEnPalabras({ estado: 'sin-rangos' }), '');
  // Con los rangos que salen del reparto, la suma contiene el objetivo por construcción.
  const fuente = P.fuenteDeLaPropuesta(OBJETIVO_19, null);
  const propuesta = P.propuestaDelDia(DIA_19, conPartes(P, ['25', '25', '25', '25']), fuente, 10);
  const delReparto = DIA_19.comidas.map((c, j) => ({ nombre: c.nombre, rango: rango(propuesta.comidas[j].protein, propuesta.comidas[j].carbohydrate, propuesta.comidas[j].fat) }));
  const contiene = P.chequeoDeLaSuma(delReparto, OBJETIVO_19);
  assert.deepEqual(contiene, { estado: 'contiene' });
  assert.equal(P.chequeoEnPalabras(contiene), 'La suma de los rangos de las comidas contiene el objetivo del día');
  // Escritos a mano: las proteínas suman 80 a 100 g y el objetivo es 112 g. Dice cuál, por cuánto y con su base.
  const aMano = DIA_19.comidas.map((c) => ({ nombre: c.nombre, rango: rango({ min: 20, max: 25 }, { min: 80, max: 90 }, { min: 18, max: 22 }) }));
  const afuera = P.chequeoDeLaSuma(aMano, OBJETIVO_19);
  assert.equal(afuera.estado, 'afuera');
  assert.deepEqual(afuera.afuera.find((f) => f.clave === 'protein'), { clave: 'protein', objetivo: 112, diferencia: 12, lado: 'encima' });
  assert.match(P.chequeoEnPalabras(afuera), /^El objetivo del día queda afuera de la suma de los rangos de las comidas: .*proteínas, 12 g por encima del máximo \(objetivo 112 g\)/);
  // 320 a 360 g de carbohidratos con 335 de objetivo: adentro, no se nombra.
  assert.equal(afuera.afuera.some((f) => f.clave === 'carbohydrate'), false);
  // Una comida sin máximo de proteínas: la suma no tiene tope y de ese lado no se compara.
  const sinTope = aMano.map((x, i) => (i === 0 ? { ...x, rango: rango({ min: 30, max: null }, { min: 80, max: 90 }, { min: 18, max: 22 }) } : x));
  const r = P.chequeoDeLaSuma(sinTope, OBJETIVO_19);
  assert.equal(r.afuera?.some((f) => f.clave === 'protein') ?? false, false, 'sin tope, las proteínas no quedan «por encima»');
});

test('RP-19 · la pantalla del reparto: columnas fijas, renglones reservados y nada que aparezca arriba del botón', () => {
  const pieza = leer('app/pro/advisees/nutrition/propuesta-de-rangos-del-plan.tsx');
  const css = leer('app/globals.css');
  const bloque = css.slice(css.indexOf('RP-19 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Sin saltos'));
  assert.match(bloque, /\.reparto-por-comida__tabla \{\s*table-layout: fixed;/);
  assert.match(pieza, /<colgroup>/);
  assert.match(pieza, /<div className="desplazable-x">/);
  // Ningún párrafo de error debajo de la tabla: la suma va en «Todo el día».
  assert.doesNotMatch(pieza, /campo__error|C\.noSuma\(|noSumaUnica/);
  assert.match(pieza, /<SumaEnVivo s=\{sumas\.protein\}/);
  // Cada fila con su rango (o «—»), siempre.
  assert.match(pieza, /const filas = fuente && toleranciaValida \? rangosPorFila\(dia, r, fuente, t\) : null;/);
  assert.match(pieza, /<CantidadOGuion macro=\{m\} x=\{fila\?\.macros\[m\] \?\? null\} \/>/);
  // El porqué del botón apagado, en su renglón reservado al lado; lo que llega después de proponer, debajo del botón.
  const acciones = pieza.indexOf('data-proponer-rangos');
  assert.match(pieza.slice(acciones), /<RenglonDelAviso juntoAlBoton anunciar /);
  assert.ok(pieza.indexOf('data-reemplazar-rangos') > acciones, '«Lo que ya escribiste» va debajo del botón');
  assert.ok(pieza.indexOf('{error ? <Aviso tipo="error">{error}</Aviso> : null}') > acciones, 'el error del servidor va debajo del botón');
  // El chequeo de la suma de los rangos, en un renglón propio con su alto y el detalle detrás de un «?».
  assert.match(pieza, /renglon-del-aviso renglon-del-aviso--con-boton reparto-por-comida__chequeo/);
  assert.match(pieza, /<ExplicacionAPedido nombre=\{C\.detalleDeLaSuma\} como="div">\s*<SumaDeLosRangosIndicados comidas=\{comidasConRango\} objetivo=\{objetivo\} enDetalle \/>/);
  assert.ok(pieza.indexOf('reparto-por-comida__chequeo') < acciones, 'el chequeo va arriba del botón, en su lugar reservado');
  // El cuadro de la suma ya no va arriba de las comidas del editor.
  assert.doesNotMatch(leer('app/pro/advisees/nutrition/editor.tsx'), /<SumaDeLosRangosIndicados/);
  // Lo que se guardó, al lado del botón; ya no en el aviso de la lista de rangos, que corría lo de abajo.
  assert.doesNotMatch(pieza, /rangos\.setAviso/);
});

test('RP-19 · la regla reutilizable: el renglón del aviso, los campos con su lugar y el resumen que no se achica', async () => {
  const V = await import('../src/components/validacion-viva.ts');
  const formulario = leer('components/formulario.tsx');
  const css = leer('app/globals.css');
  const bloque = css.slice(css.indexOf('RP-19 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Sin saltos'));
  assert.match(formulario, /export function RenglonDelAviso\(/);
  assert.match(formulario, /data-con-aviso=\{error !== undefined \? '' : undefined\}/);
  assert.match(leer('components/campo-de-fecha.tsx'), /data-con-aviso=\{error !== undefined \? '' : undefined\}/);
  assert.match(bloque, /\.renglon-del-aviso \{\s*display: block;\s*min-height: 1\.55rem;/);
  assert.match(bloque, /\.avisos-con-lugar \.campo\[data-con-aviso\]:not\(:has\(> \.campo__error\)\)::after \{\s*content: '';\s*display: block;\s*height: 1\.55rem;\s*margin-top: 0\.2rem;/);
  assert.match(bloque, /\.avisos-con-lugar \.campo\[data-con-aviso\] > \.campo__error \{\s*min-height: 1\.55rem;\s*margin: 0\.2rem 0 0;/);
  // Un campo con aviso no cambia de tamaño: el segundo píxel del borde es una sombra (con 2 px, el factor del calculador
  // se ensanchaba y corría al vecino 2 px).
  assert.match(bloque, /\.avisos-con-lugar \.campo--error input,[\s\S]*?\{\s*border-width: 1px;\s*box-shadow: 0 0 0 1px var\(--error\);/);
  // El resumen de errores: los renglones del envío quedan; lo corregido se marca y no se va hasta el envío siguiente.
  const envio = [{ id: 'a', texto: 'Falta A' }, { id: 'b', texto: 'Falta B' }];
  assert.deepEqual(V.renglonesDelResumen(envio, [{ id: 'b', texto: 'Falta B' }]), [{ id: 'a', texto: 'Falta A', corregido: true }, { id: 'b', texto: 'Falta B', corregido: false }]);
  assert.deepEqual(V.renglonesDelResumen(envio, [{ id: 'b', texto: 'B, ahora' }, { id: 'c', texto: 'Falta C' }]).map((r) => [r.id, r.texto, r.corregido]), [['a', 'Falta A', true], ['b', 'B, ahora', false], ['c', 'Falta C', false]]);
  assert.deepEqual(V.renglonesDelResumen([], []), []);
  assert.match(formulario, /const renglones = renglonesDelResumen\(delEnvio\.intento === intento \? delEnvio\.lista : errores, errores\);/);
  // Dónde se usa: el objetivo, la evaluación, el calculador, el paso 1 de los asistentes y el cuadro del rango.
  const formularios = leer('app/pro/advisees/nutrition/formularios.tsx');
  assert.match(formularios, /<form className="formulario evaluacion-inicial avisos-con-lugar"/);
  assert.match(formularios, /<form className="formulario avisos-con-lugar" onSubmit=\{enviar\}/);
  assert.equal(formularios.match(/data-con-aviso>/g)?.length, 2, 'la evaluación de referencia y el fundamento, que no pasan por Campo');
  assert.match(leer('app/pro/advisees/nutrition/calculador.tsx'), /<div className="calculador avisos-con-lugar" data-calculador>/);
  for (const r of ['app/pro/advisees/asistente/punto-de-partida.tsx', 'app/pro/advisees/nutrition/pasos-del-asistente.tsx']) {
    assert.match(leer(r), /<RenglonDelAviso id="falta-punto-de-partida"/, r);
  }
  assert.equal(leer('app/pro/advisees/nutrition/rangos-indicados-del-plan.tsx').match(/<RenglonDelAviso id=/g)?.length, 3);
  assert.match(leer('app/pro/advisees/evaluacion/evaluacion-inicial.tsx'), /<RenglonDelAviso id=\{`\$\{id\}-problema`\}/);
});

test('RP-19 · el calculador: el gasto en reposo y las tablas quedan en su lugar aunque un factor no se entienda', async () => {
  const K = await import('../src/app/pro/advisees/nutrition/calculador-del-objetivo.ts');
  const HOY = '2026-11-20';
  const bien = { ...K.calculadorInicial([], HOY), peso: '70', talla: '175', edad: '30', sexo: 'MALE', factor: '1,55', proteinaPorKg: '1,8', grasaPorKg: '0,9' };
  assert.ok(K.calculoEnVivo(bien, [], HOY));
  // Vaciar el factor para escribir otro: no hay cálculo, pero el gasto en reposo sigue (no depende del factor).
  const sinFactor = { ...bien, factor: '' };
  assert.equal(K.calculoEnVivo(sinFactor, [], HOY), null);
  const reposo = K.reposoEnVivo(sinFactor, []);
  assert.equal(reposo.resting.state, 'CALCULATED');
  assert.equal(reposo.resting.applied, K.calculoEnVivo(bien, [], HOY).resultado.resting.applied);
  assert.equal(reposo.datos.weightKg.value, 70);
  const calculador = leer('app/pro/advisees/nutrition/calculador.tsx');
  assert.match(calculador, /const reposo = reposoEnVivo\(valores, lista\);/);
  assert.match(calculador, /<div className="calculador__metodo" data-gasto-en-reposo=\{reposo\.resting\.state\}>/);
  assert.doesNotMatch(calculador, /\{vivo \? \(\s*<div className="calculador__metodo"/);
  assert.doesNotMatch(calculador, /\{vivo\?\.resultado\.totals && vivo\.resultado\.energy \? \(/);
  assert.match(calculador, /<TablaDeMacros titulo=\{conDescanso \? C\.diaDeEntrenamiento : C\.elDia\} m=\{macrosDelCalculo\?\.day \?\? null\} \/>/);
  // «Completá los datos de arriba» ya no aparece arriba del botón: va en su renglón, al lado.
  assert.doesNotMatch(calculador, /\{!vivo \? <p className="nota">\{C\.sinCalculo\}<\/p> : null\}/);
  assert.match(calculador, /<RenglonDelAviso juntoAlBoton anunciar data-por-que-no-se-usa>/);
});
