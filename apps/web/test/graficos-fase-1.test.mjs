/**
 * WP-GRAFICOS (DL-174), fase 1, en el website. Sin React ni navegador, leyendo el código: cada pieza está donde la pide la
 * propuesta de gráficos y lee lo que dice. La lógica de cada una se prueba en el dominio (`la-vez-pasada.test.ts`,
 * `historial-del-buscador.test.ts` y `desde-el-inicio.test.ts`).
 *  1. TEST-GR-004 · la marca «Con historial» en cada resultado del buscador, del índice de API-PRJ-01 del último año;
 *  2. TEST-GR-001 · «La vez pasada» debajo de «Lo que indica el plan» y antes de la tarjeta de fuerza; fuera de la lista de
 *     la v1, en su propio cuadro, con la fuerza estimada solo en la v1 (GR-T70); API-TRN-21 de los últimos 91 días;
 *  3. TEST-GR-016 · la tabla al final de la toma abierta, con la línea del error de medición siempre debajo.
 * Con la pasada visual (15/11; DISENO-VISUAL §2), lo que fija cada una sigue igual y se suma: la marca del buscador como
 * ficha compacta con la frase entera para el lector y «Cómo se cuenta» detrás de su «i»; «La vez pasada» como lista con
 * las series en fichas, las tres últimas a la vista y «Ver más sesiones»; GR-16 en puntos para lo que ya es un porcentaje,
 * sin la fila «Edad» y desde la primera toma (TEST-GRV-010 a 012).
 *
 * Mutaciones que estas pruebas ponen en rojo: dibujar «La vez pasada» arriba de lo indicado; abrir el detalle con la fuerza
 * estimada para cualquier ejercicio; poner la línea del error de medición antes de la tabla; identificar cada fila de «La
 * vez pasada» sin su prescripción; callar los días con más de una toma; mostrar un resultado calculado sin su método;
 * escribir «−6,1 %» en la grasa corporal; volver a leer solo los últimos ocho tramos; esconder qué cuenta la marca.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { COPY_HISTORIAL_DEL_BUSCADOR } from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/app/pro/advisees/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('TEST-GR-004 · cada resultado del buscador lleva la marca del índice de API-PRJ-01 del último año', () => {
  const b = leer('training/agregar-ejercicio.tsx');
  assert.match(b, /api\.proyeccion\(token, asesoradoId, 'TRAINING_PROGRESSION_BY_EXERCISE', \{ periodStart: unAnioAntes\(hoyEn\(\)\) \}\)/);
  assert.match(b, /marcaDeHistorial\(historial\.porEjercicio, exerciseId, historial\.hoy\)/);
  assert.match(b, /const conHistorial = marcaDe\(ej\.exerciseId\);/);
  // La marca la dice el texto, con el ícono al lado: ni un color ni una flecha. La ficha es corta («47 sesiones · 9 nov»);
  // el lector de pantalla oye la frase entera del dominio.
  assert.match(b, /data-con-historial>\n\s*<Icono nombre="linea-de-tiempo" tamano=\{15\} \/>\n\s*<span aria-hidden="true">\{marcaCortaDe\(ej\.exerciseId\) \?\? conHistorial\}<\/span>\n\s*<span className="visualmente-oculto">\{conHistorial\}<\/span>/);
  const corta = b.slice(b.indexOf('const marcaCortaDe'), b.indexOf('const algunoConHistorial'));
  assert.doesNotMatch(corta, /→|↑|↓/);
  // Qué cuenta se dice una vez, en una línea, con el detalle entero detrás de «Cómo se cuenta»; si la lectura falla, se
  // dice y se reintenta, y los resultados se ven igual.
  assert.match(b, /\{COPY_MARCA_DEL_BUSCADOR\.enUnaLinea\}/);
  // Revisión del 15/11: «47 sesiones · la última, 9 nov» (no «desde el 9 nov»); la línea dice a la vista que cuentan también
  // las no realizadas o hechas con otro ejercicio; «Cómo se cuenta» se ve escrito (una «i» sola no llega con el teclado
  // ni al tocar).
  assert.match(corta, /\$\{sesiones\} · la última, \$\{/);
  assert.match(b, /enUnaLinea: COPY_HISTORIAL_DEL_BUSCADOR.enUnaLinea,/);
  assert.equal(COPY_HISTORIAL_DEL_BUSCADOR.enUnaLinea, 'Con historial: sesiones registradas en tus planes en el último año, también las no realizadas o hechas con otro ejercicio.');
  assert.match(b, /<ComoLeerlo titulo=\{COPY_MARCA_DEL_BUSCADOR\.comoSeCuenta\}>\n\s*<p>\{COPY_HISTORIAL_DEL_BUSCADOR\.queCuenta\}<\/p>/);
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
  // Se arman todas las veces de lo leído (revisión del 15/11; antes, doce), y se ven las tres últimas: las demás, con «Ver
  // las N anteriores». La cuenta la prueba TEST-GRV-020 ejecutándola.
  assert.match(pieza, /vecesPasadas\(d\.registeredExecutions, exerciseId, \{ cuantas: TODAS_LAS_VECES \}\)/);
  assert.match(pieza, /const aLaVista = todas \? veces : veces\.slice\(0, VECES_EN_EL_EDITOR\);/);
  // En su cuadro, el mismo orden: «Lo que indica el plan» arriba, «La vez pasada» abajo.
  const cuadro = pieza.slice(pieza.indexOf('export function CuadroDeLaVezPasada'));
  const indica = cuadro.indexOf('detalle-del-ejercicio__plan');
  assert.ok(indica > 0 && indica < cuadro.indexOf('<LaVezPasada lectura={lectura}'));
  // Lo precargado del plan, hueco y con su texto: nunca solo el color.
  assert.match(pieza, /<MarcaDeOrigen hueca=\{serie\.cargaRapida\} \/>/);
  assert.match(pieza, /marcaDelPlan\(serie, COPY_LA_VEZ_PASADA\.cargaRapida\)/);
  // Cada fila es una vez: la sesión y su prescripción (el mismo ejercicio puede estar dos veces en una sesión).
  assert.match(pieza, /<li key=\{\x60\$\{v\.executionId\}\|\$\{v\.prescriptionId\}\x60\} data-vez=\{v\.executionId\}/);
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
  // Desde la pasada visual, toda la historia: «Desde el inicio» es la primera toma de la persona.
  assert.match(seccion, /tramosDeLasTomas\(hastaEsta\.map\(\(o\) => fechaCivil\(o, ZONA\)\), hoyEn\(\), TODA_LA_HISTORIA\)/);
  assert.match(seccion, /const TODA_LA_HISTORIA = Number\.POSITIVE_INFINITY;/);
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

test('TEST-GRV-010 · GR-16: lo que ya es un porcentaje se resta en puntos, nunca «%», y la edad no va en la tabla (mutación: dejar «−6,1 %»)', async () => {
  const { diferenciaEnPuntos, FUERA_DE_LA_TABLA } = await import('../src/app/pro/advisees/anthropometry/diferencia-en-puntos.ts');
  const grasa = (delta) => ({ delta, unidad: '%', desde: '2024-06-11', dias: 884 });
  assert.equal(diferenciaEnPuntos(grasa(-6.1)), '−6,1 puntos');
  assert.equal(diferenciaEnPuntos(grasa(1)), '+1 punto');
  assert.equal(diferenciaEnPuntos(grasa(0)), '0 puntos');
  assert.doesNotMatch(diferenciaEnPuntos(grasa(-0.5)), /%/);
  // Las demás medidas, con su unidad, como siempre.
  assert.equal(diferenciaEnPuntos({ delta: -15.7, unidad: 'kg', desde: '2024-06-11', dias: 884 }), '−15,7 kg');
  assert.ok(FUERA_DE_LA_TABLA.has('edad'));
  const seccion = leer('anthropometry/desde-el-inicio.tsx');
  assert.match(seccion, /<EnPartes texto=\{diferenciaEnPuntos\(d\)\} \/>/);
  assert.match(seccion, /tabla\.medidas\.filter\(\(f\) => !FUERA_DE_LA_TABLA\.has\(f\.metrica\)\)/);
});

test('TEST-GRV-011 · GR-01 en fichas: una fila por sesión, las series que no se parten y lo que aclara en «Cómo leerlo» (mutación: volver a la tabla de columnas)', () => {
  const pieza = leer('training/la-vez-pasada.tsx');
  assert.doesNotMatch(pieza, /<table/);
  assert.match(pieza, /<ol className="la-vez-pasada__lista"/);
  assert.match(pieza, /<ul className="la-vez-pasada__series">/);
  // Una serie que falta queda «—», sin dato: nunca un cero ni corrida al lugar de otra.
  assert.match(pieza, /la-vez-pasada__ficha--sin-dato/);
  // El lector de pantalla oye la serie entera, con su número, aunque la ficha sea corta.
  assert.match(pieza, /<span className="visualmente-oculto">\{`\$\{C\.serie\(serie\.numero\)\}: \$\{textoDeLaSerie\(serie, notacion\)\}`\}<\/span>/);
  assert.match(pieza, /<ComoLeerlo>\n\s*<p>\{C\.queEs\(persona/);
  // Revisión del 15/11: la línea de arriba dice que es lo registrado, y la unidad sale de todas las veces, abierta o cerrada.
  assert.match(pieza, /deDonde: \(persona: string, desde: string, unidad: string \| null, esfuerzo = 'RIR'\) => \`Lo registrado por \$\{persona\} en tus planes, desde el/);
  assert.match(pieza, /\{C\.deDonde\(persona, fechaEnPocasPalabras\(lectura\.desde, lectura\.hoy\), unidadComun\(lectura\.veces\), COPY_NOTACION_DEL_ESFUERZO\.etiqueta\[notacion\]\)\}/);
  assert.match(pieza, /unidad=\{unidadComun\(lectura\.veces\)\} \/>/);
  assert.doesNotMatch(pieza, /unidadComun\(aLaVista\)/);
  assert.match(pieza, /\{C\.noSeComparan\}/);
  const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
  assert.match(css, /\.la-vez-pasada__valor \{\n\s*white-space: nowrap;/);
  // El cuadro lateral del editor según la pantalla: 480, 560 y 640 px.
  assert.match(css, /\.cajon\.detalle-con-fuerza,\n\.cajon:has\(\.agregar-ejercicio\) \{\n\s*width: min\(30rem, 100vw\);/);
  assert.match(css, /@media \(min-width: 90rem\) \{\n\s*\.cajon\.detalle-con-fuerza,\n\s*\.cajon:has\(\.agregar-ejercicio\) \{\n\s*width: min\(35rem, 100vw\);/);
  assert.match(css, /@media \(min-width: 120rem\) \{\n\s*\.cajon\.detalle-con-fuerza,\n\s*\.cajon:has\(\.agregar-ejercicio\) \{\n\s*width: min\(40rem, 100vw\);/);
});

test('TEST-GRV-012 · la fuerza estimada en «Analizar»: sin flecha en la lectura, el rango de validez y el ruido del RIR a la vista y antes que la comparación, lo que no entra en «Cómo leerlo» y el título con su método (mutación: volver a «154,5 → 160,5 kg»; esconder el ruido en «Cómo leerlo»)', async () => {
  const fuente = leer('fuerza/fuerza-en-analizar.tsx');
  const lectura = fuente.slice(fuente.indexOf('function Lectura('));
  assert.doesNotMatch(lectura, /diferenciaEntreEstimaciones|→/);
  assert.match(lectura, /\{C\.anterior\(diaDelPunto\(anterior\)\)\} <strong>\{estimacionALaVista\(estimacionDelPunto\(anterior, ''\)\)\}<\/strong>/);
  assert.equal(fuente.match(/LA_PREGUNTA_DE_LA_FUERZA = \{[\s\S]*?anterior: \(dia: string\) => `La anterior \(\$\{dia\}\):`/)?.length, 1);
  // §5.12: el ruido antes que el cambio. En la lectura, lo que mueve un RIR va antes de «La anterior».
  const ruido = lectura.indexOf('data-ruido-de-la-lectura');
  assert.ok(ruido > 0 && ruido < lectura.indexOf('data-la-anterior'), 'lo que mueve un RIR, antes de la anterior');
  // §5.6 y §5.12: debajo del gráfico, a la vista (fuera de «Cómo leerlo»), el rango de validez y lo que mueve un RIR.
  const grafico = fuente.slice(fuente.indexOf('function Grafico('), fuente.indexOf('function Globo('));
  assert.match(grafico, /data-ruido-y-validez>\n\s*\{COPY_DEL_RUIDO\.validez\(conOrientativas\)\}\n\s*\{ruido \? ` \$\{COPY_DEL_RUIDO\.ruido\(ruido\)\}` : ''\}/);
  assert.doesNotMatch(fuente, /enElPeriodo|function LineaDelPeriodo|<LineaDelPeriodo/, 'sin «la más baja… la más alta…», que se leía como primero → último');
  // «Lo que no entra» y la fórmula, en «Cómo leerlo»; el título dice «1RM estimado (Epley v1)».
  const como = fuente.slice(fuente.indexOf('function ComoLeerLaFuerza('), fuente.indexOf('function TablaDeOrigen('));
  assert.match(como, /<ComoLeerlo className="fuerza-en-analizar__como-leerlo">/);
  assert.match(como, /data-no-entra-por-fecha/);
  assert.match(fuente, /titulo: '1RM estimado \(Epley v1\)'/);
  // Sin un número en cada punto: los rótulos salen de `puntosConRotulo` y `rotulosSinPisarse`.
  assert.match(fuente, /const claves = puntosConRotulo\(conValor, elegido\?\.pointId \?\? null\);/);
  assert.match(fuente, /const rotulos = rotulosSinPisarse\(/);
  // La línea de la versión dice el cambio de lo indicado, del comparador; también en texto (el nombre y la lectura).
  assert.match(fuente, /cambiosPorVersion\(/);
  assert.match(grafico, /COPY_DEL_RUIDO\.cambios\(cambiosEnTexto\)/);
  // La tabla de origen marca las filas salteadas entre las recientes y la elegida.
  assert.match(fuente, /const salto = !todas && indiceElegida >= FILAS_A_LA_VISTA \? indiceElegida - FILAS_A_LA_VISTA : 0;/);
  // Las cuentas, ejecutadas.
  const F = await import('../src/app/pro/advisees/fuerza/fuerza.ts');
  assert.equal(F.loQueMueveUnRir([137.5], 'kg'), '≈ 4,6 kg', 'Epley: un RIR más es la carga ÷ 30');
  assert.equal(F.loQueMueveUnRir([120, 137.5, 130], 'kg'), '≈ 4 a 4,6 kg');
  assert.equal(F.loQueMueveUnRir([], 'kg'), null);
  assert.equal(F.COPY_DEL_RUIDO.validez(false), 'Solo series de RIR 0 a 2 y hasta 10 repeticiones equivalentes.');
  assert.equal(F.COPY_DEL_RUIDO.validez(true), 'Solo series de RIR 0 a 2 y hasta 12 repeticiones equivalentes (de más de 10 a 12, orientativas).');
  const versiones = [
    { domain: 'TRAINING', label: 'v7', from: '2025-11-16', to: '2026-05-17' },
    { domain: 'TRAINING', label: 'v8', from: '2026-05-17', to: null },
    { domain: 'NUTRITION', label: 'v3', from: '2026-06-01', to: null },
  ];
  assert.deepEqual(F.cambiosDeLoIndicadoEnPalabras(versiones, new Map([['2026-05-17', 'de 4 a 3 repeticiones']]), '2025-11-16'), ['v8, desde el dom 17 may: de 4 a 3 repeticiones']);
  // GR-V13: si el período cruza un año, la primera marca y la primera de cada año llevan el año.
  assert.deepEqual(F.textosDelEjeDeLaFuerza(['2025-11-16', '2026-02-15', '2026-05-16', '2026-08-15', '2026-11-15']), ['16 nov 2025', '15 feb 2026', '16 may', '15 ago', '15 nov']);
  assert.deepEqual(F.textosDelEjeDeLaFuerza(['2026-02-15', '2026-11-15']), ['15 feb', '15 nov']);
  for (const t of [F.COPY_DEL_RUIDO.validez(true), F.COPY_DEL_RUIDO.ruido('≈ 4,6 kg'), F.COPY_DEL_RUIDO.ruidoDeLaElegida('≈ 4,6 kg')]) assert.doesNotMatch(t, /→|asesorad|cumplimiento|adherencia|racha|puntaje/i, t);
});
