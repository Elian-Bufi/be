/**
 * WP-GRAFICOS fase 2 (DL-174, DL-183), «Patrones» y los enfoques (GR-27).
 * Este archivo lo escribe solo la rama de «Patrones» y los enfoques (E), con sus IDs (TEST-GRF-080 en adelante); la
 * rama base deja la primera prueba de su registro. Cada prueba de la rama E dice la mutación que la tiene que poner en
 * rojo. Las del dominio son TEST-GRF-090 a 093 (`packages/domain/src/enfoques.test.ts`); las de la API, TEST-GRF-083 a
 * 089 y TEST-GRPE-010 (con la base, en la CI).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { esIdDeGrafico } from '@be/domain';

// Los módulos de los gráficos importan sin extensión (como pide el website): el gancho prueba con `.ts`.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const { REGISTRO_DE_GRAFICOS } = await import('../src/app/pro/advisees/graficos/registros.ts');
const P = await import('../src/app/pro/advisees/graficos/patrones/patrones.ts');
const ESTADO = await import('../src/app/pro/advisees/seguimiento/estado.ts');

test('TEST-GRF-080 · el registro de la rama es una lista de gráficos con identificadores estables y sin repetir', () => {
  for (const lista of [REGISTRO_DE_GRAFICOS.todos]) {
    assert.ok(Array.isArray(lista));
    const ids = lista.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const g of lista) {
      assert.ok(esIdDeGrafico(g.id), g.id);
      assert.match(g.codigo, /^(GR|SP)-\d{2}$/, g.id);
      assert.equal(typeof g.ofrecido, 'function', g.id);
    }
  }
});

// ─── WP-GRAFICOS rama E: «Patrones» y los enfoques ─────────────────────────────────────────────────────────────

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const PATRONES = join(WEB, 'src/app/pro/advisees/graficos/patrones');
const leer = (ruta) => readFileSync(ruta, 'utf8');
const archivosDePatrones = readdirSync(PATRONES).map((n) => join(PATRONES, n));

const SENTADILLA = '2aba46d7-c2d9-539c-847f-dc13a4322e18';
const REMO_A_MANO = '11111111-2222-4333-8444-555555555555';
const SIN_PROPIOS = { NUTRICION: false, ENTRENAMIENTO: false, ANTROPOMETRIA: false };
const acceso = (alcances, propios = {}) => ({ alcances, propios: { ...SIN_PROPIOS, ...propios } });
const ejercicio = (id, sesiones, nombre, unidades = ['kg']) => ({ exerciseKey: `e:${id}`, name: nombre, otherNames: [], homonym: false, sessions: sesiones, setNumbers: [1, 2, 3], loadUnits: unidades, lastDate: '2026-11-10' });
const ENTRENADOR = {
  acceso: acceso(['ENTRENAMIENTO'], { ENTRENAMIENTO: true }),
  ejercicios: [ejercicio(REMO_A_MANO, 12, 'Remo con mancuerna'), ejercicio(SENTADILLA, 8, 'Sentadilla trasera con barra')],
  medidas: null,
};
const NUTRICIONISTA = { acceso: acceso(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true, ANTROPOMETRIA: true }), ejercicios: null, medidas: ['peso', 'pliegue-triceps'] };
const sug = (chartId, exercise = null, bodyMetric = null) => ({ kind: 'SUGGESTED', chartId, exercise, bodyMetric });
const ids = (tarjetas) => tarjetas.map((t) => (t.tipo === 'SUGERIDO' ? t.grafico.id : `armado:${t.titulo}`));
const PERIODO = { desde: '2026-08-21', hasta: '2026-11-19', hoy: '2026-11-19', desdeElVinculo: null };
const CARBOHIDRATOS = { metricId: 'nutricion.carbohidratos', exerciseKey: null, setIndex: null, unit: null };
const CARGA = { metricId: 'entrenamiento.carga', exerciseKey: `e:${SENTADILLA}`, setIndex: 1, unit: 'kg' };

test('TEST-GRF-094 · un área sin acceso no deja rastro: ni tarjeta, ni hueco, ni cuenta en «lo que falta» (mutación: contar lo de un área sin acceso como «no aplica», o dibujar sus series)', () => {
  const enfoque = [
    sug('entrenamiento.carga-repeticiones-y-rir', { kind: 'MOST_RECORDED', rank: 1 }),
    sug('nutricion.energia-por-dia'),
    sug('nutricion.macros-por-kilo'),
    sug('cruce.energia-y-peso'),
    { kind: 'CUSTOM', title: 'Carbohidratos y carga', series: [CARBOHIDRATOS, CARGA], mode: 'OVERLAY' },
    { kind: 'CUSTOM', title: 'Solo Nutrición', series: [{ metricId: 'nutricion.proteinas', exerciseKey: null, setIndex: null, unit: null }], mode: 'PANELS' },
  ];
  const t = P.tarjetasDelEnfoque(enfoque, ENTRENADOR, REGISTRO_DE_GRAFICOS);
  // El entrenador ve su gráfico y el armado, con solo la serie de su área; lo de Nutrición no está ni se cuenta.
  assert.deepEqual(ids(t.enElTiempo), ['entrenamiento.carga-repeticiones-y-rir', 'armado:Carbohidratos y carga']);
  const armado = t.enElTiempo.find((x) => x.tipo === 'ARMADO');
  assert.deepEqual(
    armado.armado.series.map((s) => s.metricId),
    ['entrenamiento.carga'],
  );
  assert.equal(t.relacion.length, 0);
  assert.equal(t.noAplican, 0, 'lo de un área sin acceso no se cuenta: contarlo diría que existe');
  assert.equal(P.loQueFalta({ noAplican: t.noAplican, empiezaAntesDelVinculo: false }).length, 0);
  // Con las dos áreas de la nutricionista, lo de Entrenamiento tampoco deja rastro, y lo suyo está.
  const n = P.tarjetasDelEnfoque(enfoque, NUTRICIONISTA, REGISTRO_DE_GRAFICOS);
  assert.deepEqual(ids(n.enElTiempo), ['nutricion.energia-por-dia', 'nutricion.macros-por-kilo', 'armado:Carbohidratos y carga', 'armado:Solo Nutrición']);
  assert.deepEqual(ids(n.relacion), ['cruce.energia-y-peso']);
  assert.equal(n.noAplican, 0);
  // Un identificador que este website no conoce, y los que no se eligen sueltos (GR-04, GR-11, GR-23), se ignoran.
  const raros = P.tarjetasDelEnfoque([sug('nutricion.un-grafico-del-futuro'), sug('entrenamiento.la-vez-pasada', { kind: 'MOST_RECORDED', rank: 1 })], ENTRENADOR, REGISTRO_DE_GRAFICOS);
  assert.equal(raros.enElTiempo.length + raros.comparaciones.length + raros.noAplican, 0);
  // Sin ninguna serie que se pueda leer, el armado no está.
  assert.equal(P.tarjetasDelEnfoque([enfoque[5]], ENTRENADOR, REGISTRO_DE_GRAFICOS).enElTiempo.length, 0);
});

test('TEST-GRF-095 · el ejercicio de un gráfico guardado: «el más registrado» del período (de la lista de la v1 para el 1RM estimado) y uno fijo solo con sesiones (mutación: el más registrado de todos para el 1RM, o dibujar un fijo sin sesiones)', () => {
  const lista = ENTRENADOR.ejercicios;
  const primero = P.ejercicioResuelto({ kind: 'MOST_RECORDED', rank: 1 }, lista, false);
  assert.equal(primero.exerciseKey, `e:${REMO_A_MANO}`);
  assert.equal(primero.unidad, 'kg');
  // Para el 1RM estimado, el más registrado de la lista de la v1: la sentadilla, aunque el remo tenga más sesiones.
  assert.equal(P.ejercicioResuelto({ kind: 'MOST_RECORDED', rank: 1 }, lista, true).exerciseKey, `e:${SENTADILLA}`);
  assert.equal(P.ejercicioResuelto({ kind: 'MOST_RECORDED', rank: 2 }, lista, true), 'NO_APLICA');
  assert.equal(P.ejercicioResuelto({ kind: 'MOST_RECORDED', rank: 3 }, lista, false), 'NO_APLICA');
  const fijo = P.ejercicioResuelto({ kind: 'FIXED', exerciseKey: `e:${SENTADILLA.toUpperCase()}`, unit: 'lb', setIndex: 2 }, lista, false);
  assert.deepEqual(fijo, { exerciseKey: `e:${SENTADILLA}`, nombre: 'Sentadilla trasera con barra', unidad: 'lb', serie: 2 });
  assert.equal(P.ejercicioResuelto({ kind: 'FIXED', exerciseKey: 'e:99999999-2222-4333-8444-555555555555', unit: null, setIndex: null }, lista, false), 'NO_APLICA');
  // Sin sesiones en el período, no es «el más registrado».
  assert.equal(P.ejercicioResuelto({ kind: 'MOST_RECORDED', rank: 1 }, [ejercicio(REMO_A_MANO, 0, 'Remo')], false), 'NO_APLICA');
  assert.equal(P.ejercicioResuelto(null, lista, false), null);
  // GR-VE13: para la carga, «el más registrado» es el más registrado con carga (unas dominadas sin lastre, no).
  const conDominadas = { ...ENTRENADOR, ejercicios: [ejercicio('22222222-2222-4333-8444-555555555555', 30, 'Dominadas', []), ...ENTRENADOR.ejercicios] };
  const deLaCarga = P.tarjetasDelEnfoque([sug('entrenamiento.carga-repeticiones-y-rir', { kind: 'MOST_RECORDED', rank: 1 }), sug('entrenamiento.rir-indicado-y-registrado', { kind: 'MOST_RECORDED', rank: 1 })], conDominadas, REGISTRO_DE_GRAFICOS);
  assert.deepEqual(
    deLaCarga.enElTiempo.map((x) => x.ejercicio.nombre),
    ['Remo con mancuerna', 'Dominadas'],
  );
  // Lo que no aplica con esta persona, en un área que se ve, no se dibuja pero se cuenta en «lo que falta».
  const t = P.tarjetasDelEnfoque(
    [sug('entrenamiento.carga-repeticiones-y-rir', { kind: 'MOST_RECORDED', rank: 3 }), sug('entrenamiento.fuerza-estimada', { kind: 'MOST_RECORDED', rank: 1 })],
    ENTRENADOR,
    REGISTRO_DE_GRAFICOS,
  );
  assert.deepEqual(ids(t.enElTiempo), ['entrenamiento.fuerza-estimada']);
  assert.equal(t.enElTiempo[0].ejercicio.exerciseKey, `e:${SENTADILLA}`);
  assert.equal(t.noAplican, 1);
  const [falta] = P.loQueFalta({ noAplican: 1, empiezaAntesDelVinculo: false });
  assert.match(falta, /^1 gráfico del enfoque no se dibuja/);
  assert.doesNotMatch(falta, /Nutrici|Entrenamiento|Antropometr/, 'no nombra un área');
});

test('TEST-GRF-096 · los sugeridos, «Ver la relación» y «Agregar un gráfico» con esta persona (mutación: ofrecer un cruce sin las dos áreas propias, o sugerir lo que ya está)', () => {
  const delEntrenador = P.sugeridosConEstaPersona(ENTRENADOR, REGISTRO_DE_GRAFICOS).map((g) => g.chartId);
  assert.deepEqual(delEntrenador, ['entrenamiento.fuerza-estimada', 'entrenamiento.carga-repeticiones-y-rir', 'entrenamiento.rir-indicado-y-registrado']);
  // Sin un ejercicio de la lista de la v1, GR-02 no se sugiere.
  const sinV1 = { ...ENTRENADOR, ejercicios: [ejercicio(REMO_A_MANO, 12, 'Remo con mancuerna')] };
  assert.ok(!P.sugeridosConEstaPersona(sinV1, REGISTRO_DE_GRAFICOS).some((g) => g.chartId === 'entrenamiento.fuerza-estimada'));
  // El entrenador no tiene «Ver la relación»: el caso negado no se ofrece.
  assert.deepEqual(P.crucesDeLaRelacion([], ENTRENADOR, REGISTRO_DE_GRAFICOS), []);
  // La nutricionista con Antropometría propia: SP-02, a pedido, aunque el enfoque no lo nombre.
  const relacion = P.crucesDeLaRelacion([], NUTRICIONISTA, REGISTRO_DE_GRAFICOS);
  assert.deepEqual(
    relacion.map((t) => t.grafico.id),
    ['cruce.energia-y-peso'],
  );
  // Sin tomas propias (caso 2), no hay cruce.
  const sinPropias = { ...NUTRICIONISTA, acceso: acceso(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true }) };
  assert.deepEqual(P.crucesDeLaRelacion([], sinPropias, REGISTRO_DE_GRAFICOS), []);
  // «Agregar un gráfico»: lo ofrecido que falta, sin cruces preparados ni lo que ya está.
  const faltan = P.sugeridosQueFaltan([sug('nutricion.energia-por-dia')], NUTRICIONISTA, REGISTRO_DE_GRAFICOS).map((x) => x.grafico.id);
  assert.ok(!faltan.includes('nutricion.energia-por-dia'));
  assert.ok(faltan.includes('nutricion.macros-en-paneles'));
  assert.ok(faltan.every((id) => id !== 'cruce.energia-y-peso' && id !== 'cruce.carbohidratos-y-fuerza' && !id.startsWith('entrenamiento.')));
});

test('TEST-GRF-097 · «Abrir en Analizar» lleva el ejercicio, la serie y el período; un armado, sus series y «Superpuestas» (mutación: perder el ejercicio o el período)', () => {
  const t = P.tarjetasDelEnfoque(
    [
      sug('entrenamiento.fuerza-estimada', { kind: 'MOST_RECORDED', rank: 1 }),
      sug('entrenamiento.carga-repeticiones-y-rir', { kind: 'FIXED', exerciseKey: `e:${REMO_A_MANO}`, unit: 'kg', setIndex: 2 }),
      { kind: 'CUSTOM', title: 'Carga y RIR', series: [CARGA, { metricId: 'entrenamiento.rir', exerciseKey: `e:${SENTADILLA}`, setIndex: 1, unit: null }], mode: 'OVERLAY' },
    ],
    ENTRENADOR,
    REGISTRO_DE_GRAFICOS,
  );
  const [fuerza, progreso, armado] = t.enElTiempo.map((x) => new URL(P.enlaceEnAnalizar(x, 'ase-1', PERIODO), 'http://be'));
  assert.equal(fuerza.searchParams.get('pregunta'), 'fuerza-estimada');
  assert.equal(fuerza.searchParams.get('ejercicio'), SENTADILLA);
  assert.equal(fuerza.searchParams.get('desde'), '2026-08-21');
  assert.equal(progreso.searchParams.get('ejercicio'), `e:${REMO_A_MANO}`);
  assert.equal(progreso.searchParams.get('serie'), '2');
  assert.equal(armado.searchParams.get('vista'), 'analizar');
  assert.equal(armado.searchParams.get('modo'), 'S');
  assert.equal(armado.searchParams.get('m'), `entrenamiento.carga~e:${SENTADILLA}~1~kg,entrenamiento.rir~e:${SENTADILLA}~1`);
  // Lo que «Analizar» no tiene como pregunta (las medidas por método) no ofrece el enlace.
  const masas = P.tarjetasDelEnfoque([sug('antropometria.masa-grasa-por-metodo')], { ...NUTRICIONISTA, acceso: acceso(['ANTROPOMETRIA'], { ANTROPOMETRIA: true }) }, REGISTRO_DE_GRAFICOS);
  for (const x of masas.enElTiempo) assert.equal(P.enlaceEnAnalizar(x, 'ase-1', PERIODO), null);
});

test('TEST-GRF-098 · «Patrones» lee solo lo suyo: nada de lo que la persona comparte de otras áreas (API-RES), nada en el almacenamiento del navegador, ningún .ts con el nombre de un .tsx (mutación: leer API-RES o guardar en localStorage)', () => {
  const PERMITIDAS = new Set(['listarEnfoques', 'crearEnfoque', 'reemplazarEnfoque', 'borrarEnfoque', 'leerEleccionesDeEnfoque', 'elegirEnfoque', 'quitarEleccionDeEnfoque']);
  for (const archivo of archivosDePatrones) {
    // Sin comentarios: lo que cuenta es lo que el código hace (el encabezado dice, justamente, que no guarda nada).
    const codigo = leer(archivo)
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    for (const m of codigo.matchAll(/\bapi\.(\w+)/g)) assert.ok(PERMITIDAS.has(m[1]), `${archivo} llama a api.${m[1]}: «Patrones» lee lo demás por las lecturas de los gráficos`);
    assert.doesNotMatch(codigo, /otras-areas|ResumenCompartido|leerLoCompartido/i, `${archivo} no toca lo compartido de otras áreas`);
    assert.doesNotMatch(codigo, /localStorage|sessionStorage|indexedDB/, `${archivo} no guarda nada en el navegador`);
  }
  const nombres = readdirSync(PATRONES);
  for (const n of nombres.filter((x) => x.endsWith('.tsx'))) {
    assert.ok(!nombres.includes(n.replace(/\.tsx$/, '.ts')), `${n} comparte nombre con un .ts`);
    assert.match(n, /-en-pantalla\.tsx$/, 'GR-T58');
  }
});

test('TEST-GRF-099 · «Patrones» es la segunda vista de la ficha y una pestaña del panel de los dos editores (GR-T12) (mutación: ponerla al final o sacarla de un editor)', () => {
  assert.deepEqual(
    ESTADO.VISTAS_DEL_SEGUIMIENTO.map((v) => v.clave),
    ['resumen', 'patrones', 'linea', 'analizar'],
  );
  assert.equal(ESTADO.leerVista('patrones'), 'patrones');
  assert.ok(ESTADO.retornoALaFicha('vista=patrones&p=365', '2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f60').includes('vista=patrones'));
  const ficha = leer(join(WEB, 'src/app/pro/advisees/workspace.tsx'));
  assert.match(ficha, /vista === 'patrones' \? <Patrones \/>/);
  const entrenamiento = leer(join(WEB, 'src/app/pro/advisees/training/editor.tsx'));
  assert.match(entrenamiento, /\['patrones', CE\.pestanaPatrones\]/);
  assert.match(entrenamiento, /<PatronesDelPlan [^>]*area="ENTRENAMIENTO" planId=\{comoPlan\(version\)\?\.trainingPlanId \?\? null\}/);
  const nutricion = leer(join(WEB, 'src/app/pro/advisees/nutrition/editor.tsx'));
  assert.match(nutricion, /\['patrones', CE\.pestanaPatrones\]/);
  assert.match(nutricion, /<PatronesDelPlan [^>]*area="NUTRICION" planId=\{version\?\.nutritionPlanId \?\? null\}/);
  // En el editor, nada escribe en el plan: la pestaña solo usa las operaciones de los enfoques.
  const delPlan = leer(join(PATRONES, 'patrones-del-plan-en-pantalla.tsx'));
  assert.doesNotMatch(delPlan, /guardarBorrador|activarPlan|api\./);
});

/** Las frases que se ven (el texto de JSX y las cadenas con espacios), sin comentarios: la misma idea que vocabulario-visible. */
function frasesVisibles(codigo) {
  const limpio = codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const frases = [];
  for (const m of limpio.matchAll(/>([^<>{}=;]+)</g)) if (/[a-záéíóúñ]/i.test(m[1])) frases.push(m[1].trim());
  for (const m of limpio.matchAll(/'([^'\n]*[ \t][^'\n]*)'|"([^"\n]*[ \t][^"\n]*)"|`([^`\n]*[ \t][^`\n]*)`/g)) frases.push((m[1] ?? m[2] ?? m[3]).trim());
  return frases;
}

test('TEST-GRPE-001 · los textos de «Patrones» ubican y no califican: sin «asesorado», «cumplimiento», «adherencia», «racha», «puntaje» ni «estación», sin «%» y sin afirmar causas (mutación: «Tu racha», «92 %» o «la estación»)', () => {
  const PROHIBIDAS = /\b(asesorad[oa]s?|cumplimiento|adherencia|racha|puntaje|estaci[oó]n)\b/i;
  const CAUSA = /\b(porque|causa|caus[oó]|gracias a|provoca|debido a)\b/i;
  const ayuda = leer(join(WEB, 'src/app/pro/advisees/seguimiento/como-se-lee.tsx'));
  const deLaAyuda = ayuda.slice(ayuda.indexOf('function DePatrones'), ayuda.indexOf('/** Cada hecho de una tarjeta del Resumen'));
  assert.ok(deLaAyuda.length > 200, 'la ayuda de «Patrones» existe');
  const fuentes = [...archivosDePatrones.map((a) => [a, leer(a)]), ['como-se-lee.tsx (Patrones)', deLaAyuda]];
  for (const [archivo, codigo] of fuentes) {
    for (const f of frasesVisibles(codigo)) {
      assert.doesNotMatch(f, PROHIBIDAS, `${archivo}: «${f}»`);
      assert.doesNotMatch(f, /%/, `${archivo}: «${f}» (un «%» sin su base)`);
      // Una causa solo puede aparecer negada («no prueba que una cosa cause la otra»).
      if (CAUSA.test(f)) assert.match(f, /no prueba|no dice|ni dicen|no indica/, `${archivo}: «${f}» afirma una causa`);
    }
  }
  for (const t of Object.values(P.COPY_DE_PATRONES).filter((x) => typeof x === 'string')) assert.doesNotMatch(t, PROHIBIDAS);
  // El nombre del enfoque lleva la pista de no poner datos de salud, en la ficha y en «Mis enfoques».
  assert.equal(P.COPY_DE_PATRONES.pistaDelNombre, 'No pongas datos de salud: el enfoque se usa con varias personas.');
  for (const n of ['patrones-de-la-ficha-en-pantalla.tsx', 'mis-enfoques-en-pantalla.tsx']) assert.match(leer(join(PATRONES, n)), /C\.pistaDelNombre/);
});

test('TEST-GRPE-002 · una falla no se presenta como si no hubiera nada: sin saber qué enfoque eligió, no dibuja los sugeridos (mutación: tratar el error de API-GRF-05 como «sin elección»)', () => {
  const ficha = leer(join(PATRONES, 'patrones-de-la-ficha-en-pantalla.tsx'));
  assert.match(ficha, /elecciones\.lectura\.tipo === 'error'\) \{[\s\S]{0,300}BloqueDeEstado/);
  const lecturas = leer(join(PATRONES, 'lecturas-de-los-enfoques.ts'));
  // Solo el 404 de la API es «sin acceso»; cualquier otra falla se dice.
  assert.match(lecturas, /r\.codigo === 'RESOURCE_NOT_FOUND'\) setLectura\(\{ tipo: 'sin-acceso' \}\)/);
  assert.match(lecturas, /else setLectura\(\{ tipo: 'error', motivo: motivoDeFalla\(r\) \}\)/);
  // Elegir manda la versión leída del lugar (dos pestañas no dejan dos elecciones: la API responde 409).
  assert.match(lecturas, /const expectedVersion = actual\?\.version \?\? null;/);
  assert.ok(existsSync(join(PATRONES, 'mis-enfoques-en-pantalla.tsx')));
});

test('TEST-GRPE-003 · «Lo que falta» dice cuándo empieza la historia y cuánto no se dibuja, sin nombrar un área (mutación: esconder que el período empieza antes del acompañamiento)', () => {
  assert.deepEqual(P.loQueFalta({ noAplican: 0, empiezaAntesDelVinculo: true }), [P.COPY_DE_PATRONES.inicioDelAcompanamiento]);
  const dos = P.loQueFalta({ noAplican: 2, empiezaAntesDelVinculo: false });
  assert.match(dos[0], /^2 gráficos del enfoque no se dibujan/);
  assert.deepEqual(P.loQueFalta({ noAplican: 0, empiezaAntesDelVinculo: false }), []);
});
