/**
 * WP-GRAFICOS (DL-174), fase 1, en el website. Sin React ni navegador, leyendo el código: cada pieza está donde la pide la
 * propuesta de gráficos y lee lo que dice. La lógica de cada una se prueba en el dominio (`la-vez-pasada.test.ts`,
 * `historial-del-buscador.test.ts` y `desde-el-inicio.test.ts`).
 *  1. TEST-GR-004 · la marca «Con historial» en cada resultado del buscador, del índice de API-PRJ-01 del último año;
 *  2. TEST-GR-001 · «La vez pasada» debajo de «Lo que indica el plan» y antes de la tarjeta de fuerza; fuera de la lista de
 *     la v1, en su propio cuadro, con la fuerza estimada solo en la v1 (GR-T70); API-TRN-21 de los últimos 91 días;
 *  3. TEST-GR-016 · la tabla al final de la toma abierta, con la línea del error de medición siempre debajo.
 *
 * Mutaciones que estas pruebas ponen en rojo: dibujar «La vez pasada» arriba de lo indicado; abrir el detalle con la fuerza
 * estimada para cualquier ejercicio; poner la línea del error de medición antes de la tabla; identificar cada fila de «La
 * vez pasada» sin su prescripción; callar los días con más de una toma; mostrar un resultado calculado sin su método.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const leer = (ruta) => readFileSync(new URL(`../src/app/pro/advisees/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('TEST-GR-004 · cada resultado del buscador lleva la marca del índice de API-PRJ-01 del último año', () => {
  const b = leer('training/agregar-ejercicio.tsx');
  assert.match(b, /api\.proyeccion\(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', \{ periodStart: unAnioAntes\(hoyEn\(\)\) \}\)/);
  assert.match(b, /marcaDeHistorial\(historial\.porEjercicio, exerciseId, historial\.hoy\)/);
  assert.match(b, /const conHistorial = marcaDe\(ej\.exerciseId\);/);
  // La marca la dice el texto, con el ícono al lado: ni un color ni una flecha.
  assert.match(b, /data-con-historial>\n\s*<Icono nombre="linea-de-tiempo" tamano=\{15\} \/>\n\s*\{conHistorial\}/);
  // Qué cuenta se dice una vez; si la lectura falla, se dice y se reintenta, y los resultados se ven igual.
  assert.match(b, /\{COPY_HISTORIAL_DEL_BUSCADOR\.queCuenta\}/);
  assert.match(b, /onClick=\{releerElHistorial\}/);
});

test('TEST-GR-001 · «La vez pasada» va debajo de «Lo que indica el plan»; fuera de la lista de la v1, en su propio cuadro', () => {
  const detalle = leer('fuerza/detalle-del-ejercicio.tsx');
  const plan = detalle.indexOf('<section className="detalle-del-ejercicio__plan"');
  const vez = detalle.indexOf('<LaVezPasada lectura={vezPasada}');
  const tarjeta = detalle.indexOf('<TarjetaDeFuerza');
  assert.ok(plan > 0 && plan < vez && vez < tarjeta, 'lo indicado arriba y lo registrado abajo, nunca mezclados');
  assert.match(detalle, /useLaVezPasada\(token, asesoradoId, abierto \? exerciseId : undefined, sesionPerdida\)/);
  // La fuerza estimada sigue solo para la lista de la v1 (GR-T70): DL-174 abre el cuadro para todos, no la tarjeta.
  const editor = leer('training/ejercicio-del-editor.tsx');
  assert.match(editor, /const conFuerza = exerciseId !== null && entraEnLaEstimacion\(exerciseId\);/);
  assert.match(editor, /const conLaVezPasada = !conFuerza && exerciseId !== null;/);
  assert.match(editor, /<CuadroDeLaVezPasada\n\s*abierto=\{vezPasada\}/);
  const pieza = leer('training/la-vez-pasada.tsx');
  assert.match(pieza, /const DIAS_QUE_SE_LEEN = 91;/);
  assert.match(pieza, /api\.contextoDeRevisionDeEntrenamiento\(token, asesoradoId, \{ periodStart: restarDias\(hoyEn\(\), DIAS_QUE_SE_LEEN - 1\) \}\)/);
  assert.match(pieza, /vecesPasadas\(d\.registeredExecutions, exerciseId, \{ cuantas: VECES_EN_EL_EDITOR \}\)/);
  // En su cuadro, el mismo orden: «Lo que indica el plan» arriba, «La vez pasada» abajo.
  const cuadro = pieza.slice(pieza.indexOf('export function CuadroDeLaVezPasada'));
  const indica = cuadro.indexOf('detalle-del-ejercicio__plan');
  assert.ok(indica > 0 && indica < cuadro.indexOf('<LaVezPasada lectura={lectura}'));
  // Lo precargado del plan, hueco y con su texto: nunca solo el color.
  assert.match(pieza, /<MarcaDeOrigen hueca=\{serie\.cargaRapida\} \/>/);
  assert.match(pieza, /marcaDelPlan\(serie, COPY_LA_VEZ_PASADA\.cargaRapida\)/);
  // Cada fila es una vez: la sesión y su prescripción (el mismo ejercicio puede estar dos veces en una sesión).
  assert.match(pieza, /<tr key=\{\x60\$\{v\.executionId\}\|\$\{v\.prescriptionId\}\x60\}/);
  assert.doesNotMatch(pieza, /key=\{v\.executionId\}/);
});

test('TEST-GR-016 · la tabla va al final de la toma abierta y la línea del error de medición, siempre debajo de ella', () => {
  const tomas = leer('anthropometry/evaluaciones.tsx');
  assert.match(tomas, /<SeccionDesdeElInicio evaluacionId=\{toma\.evaluationId\} ocurrio=\{toma\.occurredAt\} tomas=\{tomas\} \/>/);
  assert.ok(tomas.indexOf('<SeccionDesdeElInicio') > tomas.indexOf('className="mediciones-de-la-toma"'), 'después de las mediciones de la toma');
  const seccion = leer('anthropometry/desde-el-inicio.tsx');
  const tabla = seccion.indexOf('<TablaDesdeElInicio tabla={lectura.tabla}');
  const linea = seccion.indexOf('{C.sinErrorDeMedicion}');
  assert.ok(tabla > 0 && linea > tabla, 'la línea va debajo de la tabla');
  assert.match(seccion, /tramosDeLasTomas\(hastaEsta\.map\(\(o\) => fechaCivil\(o, ZONA\)\), hoyEn\(\)\)/);
  assert.match(seccion, /api\.evolucionAntropometrica\(token, asesoradoId, \{ periodStart: t\.desde, periodEnd: t\.hasta \}\)/);
  // La primera toma no lee nada.
  assert.match(seccion, /if \(esLaPrimera \|\| tramos\.length === 0\) return;/);
  // Dos tomas el mismo día: la lectura trae una sola por día y por medida, y la sección lo dice.
  assert.match(seccion, /diasConVariasTomas\(fechas\.filter\(\(f\) => f <= dia\)\)/);
  assert.match(seccion, /data-varias-el-mismo-dia>\n\s*\{C\.variasElMismoDia\(enLosDias\(repetidos\.map\(diaCivil\)\)\)\}/);
  // Un resultado calculado, con su método; una medición, sin.
  assert.match(seccion, /const metodo = metodoDeLaFila\(f, derivada\);/);
  assert.match(seccion, /derivada=\{g\.clave === 'resultados'\}/);
  // Sin una columna vacía del error, y sin colores de juicio.
  assert.doesNotMatch(seccion, /<th[^>]*>[^<]*error de medici/i);
  assert.doesNotMatch(seccion, /className="[^"]*(verde|rojo|exito|peligro)/);
});
