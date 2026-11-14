/**
 * WP-GRAFICOS fase 2 (DL-174), la base del website: el eje de fechas común, los carriles, la tabla equivalente, los
 * tramos de 92 días, el cursor con el teclado, los estados, los tokens nuevos, los registros y los textos comunes.
 * TEST-GRF-010 a TEST-GRF-018 (las 001 a 009 son del dominio, en `packages/domain/src/series-disponibles.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { terminosProhibidosEnUnGrafico } from '@be/domain';

// Los módulos de la base importan sin extensión (como pide el website): el gancho prueba con `.ts`.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRAFICOS = join(WEB, 'src/app/pro/advisees/graficos');
const E = await import('../src/app/pro/advisees/graficos/eje-de-fechas.ts');
const C = await import('../src/app/pro/advisees/graficos/carriles.ts');
const T = await import('../src/app/pro/advisees/graficos/tabla-equivalente.ts');
const R = await import('../src/app/pro/advisees/graficos/registro-de-graficos.ts');
const { REGISTRO_DE_GRAFICOS } = await import('../src/app/pro/advisees/graficos/registros.ts');
const { COPY_DE_LOS_GRAFICOS, SENTIDO_EN_LA_LEYENDA } = await import('../src/app/pro/advisees/graficos/copy.ts');

const periodo = (desde, hasta, desdeElVinculo = null) => ({ desde, hasta, hoy: hasta, desdeElVinculo });
const punto = (clave, fecha, valor, extra = {}) => ({ clave, fecha, hasta: null, en: null, valor, rango: null, tramo: 's1', marca: 'LLENA', tarde: false, lectura: `${valor} kg`, ...extra });
const carril = (puntos, extra = {}) => ({
  tipo: 'PUNTOS',
  id: 'carga',
  nombre: 'Carga registrada en la serie 1',
  unidad: 'kg',
  metodo: null,
  indice: 0,
  puntos,
  indicado: [],
  escalones: [],
  unir: true,
  escala: { enteros: false },
  cobertura: [],
  descripcion: 'Tres sesiones.',
  ...extra,
});

test('TEST-GRF-010 · el eje de fechas: cada fecha en su mediodía, la semana a su mitad, la inversa y las marcas sin pisarse; lo anterior al vínculo no se dibuja', () => {
  const e = E.escalaDeFechas(periodo('2026-11-02', '2026-11-08'), { izquierda: 0, derecha: 700 });
  assert.equal(e.porDia, 100);
  assert.equal(e.x('2026-11-02'), 50);
  assert.equal(e.x('2026-11-08'), 650);
  assert.equal(e.fechaDeX(50), '2026-11-02');
  assert.equal(e.fechaDeX(699), '2026-11-08');
  assert.equal(e.xDePunto({ fecha: '2026-11-02', hasta: '2026-11-08', en: null }), 350);
  assert.equal(e.xDePunto({ fecha: '2026-11-03', hasta: null, en: '2026-11-03T18:00:00Z' }), 175);
  // Una hora que cae en otro día no se respeta: va al mediodía de su fecha.
  assert.equal(e.xDePunto({ fecha: '2026-11-03', hasta: null, en: '2026-11-05T18:00:00Z' }), 150);
  for (const [desde, hasta, ancho] of [
    ['2026-11-02', '2026-11-08', 320],
    ['2026-08-01', '2026-11-14', 700],
    ['2025-11-15', '2026-11-14', 900],
    ['2025-11-15', '2026-11-14', 300],
  ]) {
    const m = E.escalaDeFechas(periodo(desde, hasta), { izquierda: 0, derecha: ancho }).marcas;
    assert.ok(m.length >= 1, `${desde} a ${hasta} en ${ancho}`);
    for (let i = 1; i < m.length; i++) assert.ok(m[i].x - m[i - 1].x >= E.SEPARACION_MINIMA_DE_MARCAS, `${m[i - 1].texto} y ${m[i].texto} se pisan en ${ancho}`);
  }
  const conVinculo = E.escalaDeFechas(periodo('2026-11-02', '2026-11-08', '2026-11-05'), { izquierda: 0, derecha: 400 });
  assert.equal(conVinculo.desde, '2026-11-05');
  assert.equal(E.empiezaAntesDelVinculo(periodo('2026-11-02', '2026-11-08', '2026-11-05')), true);
  assert.equal(E.empiezaAntesDelVinculo(periodo('2026-11-02', '2026-11-08')), false);
  assert.equal(E.textoDeLaMarca('2026-11-03'), '3/11');
});

test('TEST-GRF-011 · la línea se corta en un hueco y entre tramos, y Antropometría no une nada (mutación: unir a través de un hueco)', () => {
  const puntos = [punto('a', '2026-11-02', 10), punto('b', '2026-11-03', null), punto('c', '2026-11-04', 12), punto('d', '2026-11-05', 13), punto('e', '2026-11-06', 14, { tramo: 's2' })];
  assert.deepEqual(
    C.lineasDelCarril(puntos).map((l) => l.map((p) => p.clave)),
    [['c', 'd']],
  );
  const escala = E.escalaDeFechas(periodo('2026-11-02', '2026-11-08'), { izquierda: 0, derecha: 700 });
  const unido = C.geometriaDelCarril(carril(puntos), escala, 140);
  assert.equal(unido.lineas.length, 1);
  assert.equal(unido.marcas.length, 4, 'un hueco no es un punto en cero');
  const sueltos = C.geometriaDelCarril(carril(puntos, { unir: false }), escala, 140);
  assert.equal(sueltos.lineas.length, 0);
  // El rango mínimo de la serie manda sobre el de la unidad: el 1RM estimado abarca 10 kg.
  const fuerza = C.geometriaDelCarril(carril([punto('x', '2026-11-02', 100), punto('y', '2026-11-04', 101)], { escala: { enteros: false, rangoMinimo: 10 } }), escala, 140);
  assert.ok(fuerza.extremos.arriba - fuerza.extremos.abajo >= 10);
  // El RIR va de 0 a 5 como mínimo.
  const rir = C.geometriaDelCarril(carril([punto('r', '2026-11-02', 1)], { unidad: 'RIR', escala: { enteros: true, desdeCero: true, minimoDelMaximo: 5 } }), escala, 140);
  assert.equal(rir.extremos.abajo, 0);
  assert.ok(rir.extremos.arriba >= 5);
  assert.deepEqual(C.fechasConObservacion([carril(puntos)]), ['2026-11-02', '2026-11-04', '2026-11-05', '2026-11-06']);
});

test('TEST-GRF-012 · la tabla dice lo mismo que el dibujo: los subtotales, lo indicado, lo cargado después y los tramos sin registros como texto (mutación: perder los subtotales)', () => {
  const energia = carril(
    [
      punto('a', '2026-11-02', 2150, { lectura: '2.150 kcal' }),
      punto('b', '2026-11-08', 1850, { marca: 'HUECA', lectura: '1.850 kcal · subtotal: 1 comida sin cantidades', tarde: true }),
    ],
    {
      id: 'energia',
      nombre: 'Calorías registradas',
      unidad: 'kcal',
      indicado: [punto('i', '2026-11-02', 2200, { marca: 'HUECA', lectura: '2.200 kcal' })],
      cobertura: [
        { fecha: '2026-11-02', estado: 'con' },
        { fecha: '2026-11-03', estado: 'sin' },
        { fecha: '2026-11-04', estado: 'sin' },
        { fecha: '2026-11-05', estado: 'sin' },
        { fecha: '2026-11-06', estado: 'sin' },
        { fecha: '2026-11-07', estado: 'sin' },
        { fecha: '2026-11-08', estado: 'hueco' },
      ],
    },
  );
  const t = T.tablaEquivalente([energia, { tipo: 'EVENTOS', id: 'cinta', nombre: 'Lo que pasó', eventos: [] }]);
  assert.deepEqual(t.columnas, [{ id: 'energia', nombre: 'Calorías registradas', unidad: 'kcal' }]);
  assert.deepEqual(
    t.filas.map((f) => f.fecha),
    ['2026-11-02', '2026-11-08'],
  );
  const subtotal = t.filas[1].celdas[0];
  assert.equal(subtotal.marca, 'HUECA');
  assert.match(subtotal.texto, /subtotal: 1 comida sin cantidades/);
  assert.match(subtotal.texto, /cargado después/);
  assert.equal(t.filas[0].celdas[0].texto, '2.150 kcal · indicado: 2.200 kcal');
  assert.deepEqual(t.sinRegistros, ['del 3/11 al 7/11, sin registros']);
  assert.deepEqual(T.lecturaDeLaFecha(t, '2026-11-08'), [{ nombre: 'Calorías registradas', texto: subtotal.texto }]);
  assert.deepEqual(T.lecturaDeLaFecha(t, '2026-11-05'), [{ nombre: 'Calorías registradas', texto: T.TEXTO_SIN_DATO }]);
  assert.equal(C.lineaDeLoCargadoTarde(energia), '1 de 2 días cargados después');
});

test('TEST-GRF-013 · los tramos de 92 días cubren el período sin días repetidos ni perdidos (mutación: tramos de 93)', () => {
  const tramos = E.tramosDe('2025-11-15', '2026-11-14', 92);
  assert.equal(tramos.length, 4);
  assert.equal(tramos[0].desde, '2025-11-15');
  assert.equal(tramos.at(-1).hasta, '2026-11-14');
  const dias = (t) => Math.round((Date.parse(`${t.hasta}T12:00:00Z`) - Date.parse(`${t.desde}T12:00:00Z`)) / 86_400_000) + 1;
  assert.equal(
    tramos.reduce((n, t) => n + dias(t), 0),
    365,
  );
  for (const t of tramos) assert.ok(dias(t) <= 92, `${t.desde} a ${t.hasta}`);
  for (let i = 1; i < tramos.length; i++) assert.equal(Date.parse(`${tramos[i].desde}T12:00:00Z`) - Date.parse(`${tramos[i - 1].hasta}T12:00:00Z`), 86_400_000);
  assert.deepEqual(E.tramosDe('2026-11-14', '2026-11-14', 92), [{ desde: '2026-11-14', hasta: '2026-11-14' }]);
  assert.deepEqual(E.tramosDe('2026-11-15', '2026-11-14', 92), []);
});

test('TEST-GRF-014 · el cursor con el teclado: flechas, Inicio, Fin, Mayúscula arma un tramo y Escape lo suelta', () => {
  const fechas = ['2026-11-02', '2026-11-04', '2026-11-09'];
  const nada = { fecha: null, tramo: null };
  assert.deepEqual(E.moverElCursor(fechas, nada, 'ArrowRight', false), { fecha: '2026-11-02', tramo: null });
  assert.deepEqual(E.moverElCursor(fechas, nada, 'End', false), { fecha: '2026-11-09', tramo: null });
  assert.deepEqual(E.moverElCursor(fechas, { fecha: '2026-11-02', tramo: null }, 'Home', false), { fecha: '2026-11-02', tramo: null });
  const conTramo = E.moverElCursor(fechas, { fecha: '2026-11-09', tramo: null }, 'ArrowLeft', true);
  assert.deepEqual(conTramo, { fecha: '2026-11-04', tramo: { desde: '2026-11-04', hasta: '2026-11-09' } });
  assert.deepEqual(E.moverElCursor(fechas, conTramo, 'ArrowLeft', true), { fecha: '2026-11-02', tramo: { desde: '2026-11-02', hasta: '2026-11-09' } });
  assert.deepEqual(E.moverElCursor(fechas, conTramo, 'Escape', false), { fecha: '2026-11-04', tramo: null });
  assert.deepEqual(E.moverElCursor(fechas, { fecha: '2026-11-04', tramo: null }, 'Escape', false), nada);
  assert.equal(E.moverElCursor(fechas, nada, 'Escape', false), null);
  assert.equal(E.moverElCursor(fechas, nada, 'a', false), null);
  assert.equal(E.moverElCursor([], nada, 'ArrowRight', false), null);
});

test('TEST-GRF-015 · SIN_ACCESO no dibuja nada, y el gráfico es un grupo con nombre, con su resumen, su lectura viva y su tabla', () => {
  const estados = readFileSync(join(GRAFICOS, 'estado-del-grafico.tsx'), 'utf8');
  assert.match(estados, /case 'SIN_ACCESO':\s*return null;/);
  const paneles = readFileSync(join(GRAFICOS, 'paneles-alineados.tsx'), 'utf8');
  assert.match(paneles, /role="group"/);
  assert.match(paneles, /aria-roledescription="gráfico"/);
  assert.match(paneles, /aria-describedby=\{idDelResumen\}/);
  assert.match(paneles, /aria-hidden="true"/);
  assert.match(paneles, /tabIndex=\{0\}/);
  assert.match(paneles, /e\.pointerType === 'mouse'/, 'pasar por encima mueve la regla solo con mouse');
  assert.match(readFileSync(join(GRAFICOS, 'lectura-en-la-fecha.tsx'), 'utf8'), /aria-live="polite"/);
  const tabla = readFileSync(join(GRAFICOS, 'tabla-equivalente-en-pantalla.tsx'), 'utf8');
  assert.match(tabla, /<caption>/);
  assert.match(tabla, /scope="col"/);
  assert.match(tabla, /scope="row"/);
  // Ninguna lectura de datos de salud se guarda en el navegador.
  for (const archivo of ['lecturas.ts', 'paneles-alineados.tsx', 'cursor-de-fechas.tsx']) assert.doesNotMatch(readFileSync(join(GRAFICOS, archivo), 'utf8'), /localStorage|sessionStorage|indexedDB/, archivo);
});

/** WCAG 2.2: la relación de contraste de dos colores hexadecimales. */
function contraste(a, b) {
  const l = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [l(a), l(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

test('TEST-GRF-016 · los tokens nuevos de los gráficos llegan a 3:1 contra la superficie en los dos temas', () => {
  const css = readFileSync(join(WEB, 'src/app/tokens.css'), 'utf8');
  const bloque = (selector) => {
    const inicio = css.indexOf(selector);
    assert.ok(inicio >= 0, selector);
    return css.slice(inicio, css.indexOf('\n}', inicio));
  };
  const valor = (texto, token) => {
    const m = texto.match(new RegExp(`\\s${token}:\\s*(#[0-9a-fA-F]{6})`));
    assert.ok(m, token);
    return m[1];
  };
  for (const selector of [':root {', "[data-tema='azul-noche'] {"]) {
    const b = bloque(selector);
    const superficie = valor(b, '--superficie');
    for (const token of ['--grafico-indicado', '--grafico-carga-rapida', '--grafico-cursor']) {
      const c = contraste(valor(b, token), superficie);
      assert.ok(c >= 3, `${token} en ${selector}: ${c.toFixed(2)}:1`);
    }
  }
});

test('TEST-GRF-017 · los registros de las cuatro ramas se unen sin IDs repetidos ni mal formados, y las cinco hojas y los cinco archivos de prueba están enganchados', () => {
  assert.ok(Array.isArray(REGISTRO_DE_GRAFICOS.todos));
  assert.equal(REGISTRO_DE_GRAFICOS.grafico('entrenamiento.uno-que-no-existe'), null);
  const vacio = () => null;
  const g = (id) => ({ id, codigo: 'GR-00', area: 'NUTRICION', titulo: 'Prueba', ubicacion: 'EN_EL_TIEMPO', series: [], requiere: { ejercicio: false, listaV1: false, medida: false }, ofrecido: (c) => c.acceso.alcances.includes('NUTRICION'), Grafico: vacio });
  assert.throws(() => R.crearRegistro([g('nutricion.uno'), g('nutricion.uno')]), /dos veces/);
  assert.throws(() => R.crearRegistro([g('Nutricion.uno')]), /mal formado/);
  const registro = R.crearRegistro([g('nutricion.uno')]);
  const sin = { acceso: { alcances: ['ENTRENAMIENTO'], propios: { NUTRICION: false, ENTRENAMIENTO: true, ANTROPOMETRIA: false } }, ejercicios: null, medidas: null };
  assert.deepEqual(registro.ofrecidos(sin), [], 'un área sin acceso no deja rastro');
  const layout = readFileSync(join(WEB, 'src/app/layout.tsx'), 'utf8');
  for (const hoja of ['base', 'entrenamiento', 'nutricion-y-cuerpo', 'cruces', 'patrones']) {
    assert.ok(existsSync(join(GRAFICOS, 'estilos', `${hoja}.css`)), hoja);
    assert.ok(layout.includes(`./pro/advisees/graficos/estilos/${hoja}.css`), hoja);
  }
  const prueba = JSON.parse(readFileSync(join(WEB, 'package.json'), 'utf8')).scripts.test;
  for (const archivo of ['graficos-base', 'graficos-entrenamiento', 'graficos-nutricion-y-cuerpo', 'graficos-cruces', 'graficos-patrones']) assert.ok(prueba.includes(`test/${archivo}.test.mjs`), archivo);
  // Un archivo .ts y uno .tsx con el mismo nombre se resolverían distinto en TypeScript y en el empaquetador (GR-T23).
  const nombres = ['adaptadores', 'carriles', 'cinta-del-tiempo', 'copy', 'eje-de-fechas', 'lecturas', 'registro-de-graficos', 'registros', 'tabla-equivalente'];
  for (const n of nombres) assert.ok(!existsSync(join(GRAFICOS, `${n}.tsx`)), `${n}.tsx choca con ${n}.ts`);
});

test('TEST-GRF-018 · los textos comunes de los gráficos pasan la guardia unida de las tres áreas', () => {
  const textos = [
    ...Object.values(COPY_DE_LOS_GRAFICOS).flatMap((v) => (typeof v === 'string' ? [v] : [])),
    COPY_DE_LOS_GRAFICOS.fueraDeLaEscala(1),
    COPY_DE_LOS_GRAFICOS.fueraDeLaEscala(3),
    COPY_DE_LOS_GRAFICOS.faltaHistoria(5, 'sesiones', [3, 7]),
    COPY_DE_LOS_GRAFICOS.faltaHistoria(4, 'semanas', [2]),
    COPY_DE_LOS_GRAFICOS.tramoElegido('3/11', '9/11'),
    ...Object.values(SENTIDO_EN_LA_LEYENDA),
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), [], t);
  assert.equal(COPY_DE_LOS_GRAFICOS.faltaHistoria(5, 'sesiones', [3, 7]), 'Se arma con 5 sesiones por lado; hay 3 y 7.');
  assert.equal(COPY_DE_LOS_GRAFICOS.frase, 'Coinciden en el tiempo; esto no prueba que una cosa cause la otra.');
});
