/**
 * WP-NUTRICION-RECETAS · la APK, sin teléfono (docs/paquetes/WP-NUTRICION-RECETAS.md §10.4): lo que decide el carrusel, el
 * registro y la comida diferente, con los módulos puros de producción.
 *  1. Las opciones de una comida (`carrusel-de-opciones.ts`; desde DL-194, A32-01, otra vez un carrusel): el imán sin la
 *     vecina asomando, las flechas, los puntitos, el anuncio, una sola opción, la posición recordada por la opción y la
 *     imagen pedida solo para la opción a la vista.
 *  2. La franja de macros (`franja-de-macros.ts`): el orden y los íconos del website (A32-04), las abreviaturas, el
 *     redondeo del dominio sobre las tres recetas del paquete, «Sin dato» en lugar de cero y las columnas (4, 2 por 2 o 1)
 *     sin recortar.
 *  3. «¿Cuánto comiste?» (`consumo-de-la-opcion.ts`): vacío no es cero, el cero no se acepta, la casilla, «No lo comí» y
 *     lo que vuelve a la pantalla al completar.
 *  4. La comida diferente (`borrador-de-comida-diferente.ts`): al menos texto o foto, la foto inválida, los estados del
 *     guardado y cuándo se pide otra ruta de subida; la foto leída en bytes con su tipo real, el envío con el fetch de la
 *     APK (`expo/fetch`) y qué rechazo de la API culpa a la foto (defecto de la 0.15.0-candidata.1, 2026-10-07).
 *  5. El comando único (`comando-de-registro.ts`): el doble toque, el reintento con la misma clave y el mismo cuerpo, y
 *     otro pedido con otra clave.
 *  6. Las comidas de hoy (`comidas-de-hoy.ts`): el registro efectivo de cada comida y la comida que se muestra.
 *  7. Lo que solo se ve en el código: las rutas nuevas, el plugin de la cámara y los textos de las pantallas nuevas.
 * Cada pedido que arma la APK se valida con el esquema estricto de su contrato en @be/domain.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const carrusel = await import('../apps/mobile/src/carrusel-de-opciones.ts');
const franja = await import('../apps/mobile/src/franja-de-macros.ts');
const consumo = await import('../apps/mobile/src/consumo-de-la-opcion.ts');
const borrador = await import('../apps/mobile/src/borrador-de-comida-diferente.ts');
const comando = await import('../apps/mobile/src/comando-de-registro.ts');
const comidas = await import('../apps/mobile/src/comidas-de-hoy.ts');
const nav = await import('../apps/mobile/src/navegacion.ts');

const C = d.COPY_REGISTRO_DE_COMIDAS;

// ─── Datos del paquete de Dirección: las tres recetas, con el cálculo del dominio ──────────────────

const PAQUETE = resolve(RAIZ, 'docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05/datos');
const ALIMENTOS = JSON.parse(readFileSync(resolve(PAQUETE, 'alimentos_usda_100g.json'), 'utf8')).foods;
const RECETAS = JSON.parse(readFileSync(resolve(PAQUETE, 'recetas_demo.json'), 'utf8')).recipes;
const NOMBRE_DEL_PAQUETE = { energy_kcal: 'energyKcal', carbohydrate_g: 'carbohydrateG', fat_g: 'fatG', protein_g: 'proteinG', fiber_g: 'fiberG' };

/** Los macros de una receta como los daría la API: `calcularNutrientes` del dominio, en la forma del contrato. */
function macrosDe(receta) {
  const ingredientes = receta.items.map((i) => {
    const alimento = ALIMENTOS.find((a) => a.id === i.food_id);
    const composicion = { referenceAmount: '100g' };
    for (const [clave, nombre] of Object.entries(NOMBRE_DEL_PAQUETE)) composicion[nombre] = alimento.nutrients_per_100g[clave];
    return { clave: i.food_id, cantidad: { value: i.quantity_g, unit: 'g' }, composicion };
  });
  return d.nutrientesDelResultado(d.calcularNutrientes(ingredientes));
}

// ─── 1. Las opciones de una comida: el carrusel (DL-194, A32-01; vuelve sobre AV2-21) ──────────────────
// De la 0.26 a la 0.31 fueron segmentos «Opción 1 | 2 | 3». Dirección (2026-11-22) prefiere el carrusel: deslizar con
// imán y también flechas, los puntitos y «Opción n de m», sin la vecina asomando. Siguen protegidos la opción recordada
// por su identidad, el anuncio, que elegir no registra y que solo se pide la imagen de la opción a la vista.

test('1 · TEST-A32-001 · cada tarjeta a todo el ancho: sin asomo de la vecina, y el imán se detiene en una entera', () => {
  for (const ancho of [288, 318, 340.6]) {
    const m = carrusel.medidasDelCarrusel(ancho, 3);
    assert.equal(m.anchoDeTarjeta, Math.floor(ancho), 'la tarjeta ocupa todo el ancho: la siguiente no asoma');
    assert.equal(m.paso, m.anchoDeTarjeta + carrusel.SEPARACION_ENTRE_TARJETAS);
    // En reposo, la tarjeta k empieza en k × paso y termina antes de que empiece la siguiente: no se ve ni un dp de otra.
    for (let k = 0; k < 3; k++) {
      const x = carrusel.desplazamientoDe(k, m.paso, 3);
      assert.equal(carrusel.indiceDesdeDesplazamiento(x, m.paso, 3), k);
      assert.ok(x + ancho <= (k + 1) * m.paso, `la tarjeta ${k + 1} se ve entera, sola`);
    }
    // Un gesto que pasa la mitad lleva a la siguiente; uno corto vuelve.
    assert.equal(carrusel.indiceDesdeDesplazamiento(m.paso * 0.6, m.paso, 3), 1);
    assert.equal(carrusel.indiceDesdeDesplazamiento(m.paso * 0.4, m.paso, 3), 0);
    assert.equal(carrusel.indiceDesdeDesplazamiento(m.paso * 9, m.paso, 3), 2, 'no se pasa del final');
  }
  assert.deepEqual(carrusel.medidasDelCarrusel(320, 1), { anchoDeTarjeta: 320, paso: 320 });
  assert.deepEqual(carrusel.medidasDelCarrusel(Number.NaN, 3), { anchoDeTarjeta: 0, paso: 0 });
  assert.equal(carrusel.indiceValido(Number.NaN, 3), 0);
  assert.equal(carrusel.indiceValido(7, 3), 2);
  assert.equal(carrusel.indiceValido(7, 0), 0);
});

test('1 · TEST-A32-002 · las flechas con su nombre, «Opción n de m» y los puntitos; con una sola opción, ningún control', () => {
  const primera = carrusel.controlesDelCarrusel(0, 3);
  assert.equal(primera.contador, 'Opción 1 de 3');
  assert.deepEqual(primera.anterior, { etiqueta: 'Opción anterior', habilitada: false }, 'en el extremo, deshabilitada');
  assert.deepEqual(primera.siguiente, { etiqueta: 'Opción siguiente', habilitada: true });
  assert.deepEqual(primera.puntos, [true, false, false]);
  const ultima = carrusel.controlesDelCarrusel(2, 3);
  assert.equal(ultima.contador, 'Opción 3 de 3');
  assert.equal(ultima.anterior.habilitada, true);
  assert.equal(ultima.siguiente.habilitada, false);
  assert.deepEqual(ultima.puntos, [false, false, true]);
  assert.equal(carrusel.controlesDelCarrusel(9, 3).contador, 'Opción 3 de 3', 'un índice que se pasa va al extremo');
  assert.deepEqual(carrusel.controlesDelCarrusel(0, 1), { contador: null, anterior: null, siguiente: null, puntos: [] }, 'una sola opción: nada');
  assert.deepEqual(carrusel.controlesDelCarrusel(0, 0), { contador: null, anterior: null, siguiente: null, puntos: [] });
  // Los textos son los del dominio.
  assert.equal(C.opcionAnterior, 'Opción anterior');
  assert.equal(C.opcionSiguiente, 'Opción siguiente');
});

test('1 · TEST-A32-003 · «Opción n de m» se anuncia al cambiar; con una sola opción, nada', () => {
  assert.equal(carrusel.anuncioDeLaOpcion(1, 3), 'Opción 2 de 3');
  assert.equal(carrusel.anuncioDeLaOpcion(9, 3), 'Opción 3 de 3');
  assert.equal(carrusel.anuncioDeLaOpcion(0, 1), null);
  assert.equal(C.opcionDe(2, 3), 'Opción 2 de 3', 'el texto es el del dominio');
});

test('1 · al volver del detalle, la comida sigue en la misma opción, aunque el plan cambie el orden', () => {
  const opciones = [{ optionId: 'pollo' }, { optionId: 'salmon' }, { optionId: 'lentejas' }];
  assert.equal(carrusel.indiceDeLaOpcion(opciones, 'salmon'), 1);
  assert.equal(carrusel.indiceDeLaOpcion([opciones[2], opciones[0], opciones[1]], 'salmon'), 2, 'por la opción, no por el índice');
  assert.equal(carrusel.indiceDeLaOpcion(opciones, 'ya-no-esta'), 0, 'si salió del plan, la primera');
  assert.equal(carrusel.indiceDeLaOpcion(opciones, null), 0);
});

test('1 · TEST-A32-004 · la imagen se pide solo para la opción a la vista, y la que ya se vio la conserva', () => {
  let vistas = carrusel.opcionesVistas(new Set(), 'pollo');
  assert.deepEqual([...vistas], ['pollo'], 'al abrir, solo la de la vista');
  const igual = carrusel.opcionesVistas(vistas, 'pollo');
  assert.equal(igual, vistas, 'sin cambios, el mismo conjunto: no se vuelve a dibujar');
  vistas = carrusel.opcionesVistas(vistas, 'salmon');
  assert.deepEqual([...vistas].sort(), ['pollo', 'salmon'], 'la lentejas, que no se vio, no pide su imagen');
  assert.equal(carrusel.opcionesVistas(vistas, null), vistas);
});

test('1 · TEST-A32-005 · el carrusel en la pantalla: imán, flechas, puntitos, sin segmentos, y elegir no registra', () => {
  const HOY = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/nutricion-hoy.tsx'), 'utf8');
  const carruselEnPantalla = HOY.slice(HOY.indexOf('function CarruselDeOpciones('), HOY.indexOf('function TarjetaDeOpcion('));
  const tarjeta = HOY.slice(HOY.indexOf('function TarjetaDeOpcion('), HOY.indexOf('function BotonDeFlecha('));
  assert.ok(carruselEnPantalla.length > 0 && tarjeta.length > 0);
  assert.doesNotMatch(carruselEnPantalla, /setInterval|setTimeout|autoplay/i, 'sin avance automático');
  assert.doesNotMatch(carruselEnPantalla, /registrarComida|comi\(/, 'cambiar de opción solo cambia la opción a la vista');
  // Deslizar con imán, de a una tarjeta entera, y también las flechas.
  assert.match(carruselEnPantalla, /snapToInterval=\{total > 1 \? medidas\.paso : undefined\}/);
  assert.match(carruselEnPantalla, /scrollEnabled=\{total > 1\}/, 'con una sola opción, no se desliza');
  assert.match(carruselEnPantalla, /onMomentumScrollEnd=\{alDetenerse\}/, 'la opción cambia cuando el imán dejó una entera');
  assert.match(carruselEnPantalla, /<BotonDeFlecha hacia="izquierda" texto=\{controles\.anterior\.etiqueta\}/);
  assert.match(carruselEnPantalla, /<BotonDeFlecha hacia="derecha" texto=\{controles\.siguiente\.etiqueta\}/);
  assert.match(carruselEnPantalla, /\{controles\.contador && controles\.anterior && controles\.siguiente \? \(/, 'con una sola opción, ningún control');
  assert.match(carruselEnPantalla, /estilos\.punto, lleno && estilos\.puntoElegido/);
  assert.match(carruselEnPantalla, /style=\{estilos\.puntos\} accessible=\{false\} importantForAccessibility="no-hide-descendants"/, 'los puntitos no se leen: se lee el contador');
  // Las flechas: 48 dp, su nombre y deshabilitadas en el extremo.
  const flecha = HOY.slice(HOY.indexOf('function BotonDeFlecha('), HOY.indexOf('/** El lado de la miniatura de reemplazo'));
  assert.match(flecha, /accessibilityLabel=\{texto\}/);
  assert.match(flecha, /accessibilityState=\{\{ disabled: !habilitado \}\}/);
  assert.match(HOY, /flecha: \{ width: 48, height: 48,/);
  // Sin segmentos.
  assert.doesNotMatch(HOY, /<Segmentos|segmentosDeLasOpciones|OpcionesEnSegmentos/);
  // La opción se recuerda por su identidad, y se anuncia al cambiar, una vez (sin región viva que lo repita).
  assert.match(carruselEnPantalla, /useSeleccionRecordada<string \| null>\(token, `nutricion:opcion:\$\{fecha\}:\$\{comida\.mealId\}`, null\)/);
  assert.match(carruselEnPantalla, /AccessibilityInfo\.announceForAccessibility\(anuncio\)/);
  assert.doesNotMatch(carruselEnPantalla, /accessibilityLiveRegion/);
  // Solo la tarjeta a la vista la recorre el lector, y solo las vistas piden su imagen.
  assert.match(carruselEnPantalla, /importantForAccessibility=\{i === indice \? 'auto' : 'no-hide-descendants'\}/);
  assert.match(carruselEnPantalla, /cargarImagen=\{vistas\.current\.has\(o\.optionId\)\}/);
  assert.match(carruselEnPantalla, /vistas\.current = opcionesVistas\(vistas\.current, opciones\[indice\]\?\.optionId\);/);
  // Con «reducir movimiento», la flecha mueve sin animación.
  assert.match(carruselEnPantalla, /animated: !movimientoReducido/);
});

test('1 · TEST-A32-006 · la foto grande a todo el ancho y, sin foto, la miniatura de reemplazo (no un marco vacío)', () => {
  const HOY = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/nutricion-hoy.tsx'), 'utf8');
  const tarjeta = HOY.slice(HOY.indexOf('function TarjetaDeOpcion('), HOY.indexOf('function BotonDeFlecha('));
  assert.match(HOY, /const PROPORCION_DE_LA_FOTO = 16 \/ 10;/);
  assert.match(
    tarjeta,
    /\{mediaId \? \(\s*<ImagenDeMedio token=\{token\} mediaId=\{mediaId\} cargar=\{cargarImagen\} sesionPerdida=\{sesionPerdida\} rotulo=\{COPY_REGISTRO_DE_COMIDAS\.imagenDeReferencia\} proporcion=\{PROPORCION_DE_LA_FOTO\} rotuloVisible=\{false\} liviana \/>\s*\) : null\}/,
  );
  assert.doesNotMatch(tarjeta, /tamano=\{TAMANO_DE_LA_MINIATURA\}/, 'la foto ya no es una miniatura de 72 dp');
  assert.match(tarjeta, /\{mediaId \? null : <MiniaturaSinFoto \/>\}/, 'sin foto, la miniatura de reemplazo al lado del nombre');
  assert.match(HOY, /const TAMANO_DE_LA_MINIATURA = 72;/);
  assert.match(HOY, /miniaturaSinFoto: \{ width: TAMANO_DE_LA_MINIATURA, height: TAMANO_DE_LA_MINIATURA, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR\.iconoFondo \}/);
  assert.match(readFileSync(resolve(RAIZ, 'apps/mobile/src/imagen-de-medio.tsx'), 'utf8'), /marco: \{[^}]*borderRadius: 12,/, 'el mismo radio que el marco de la foto');
  const sinFoto = HOY.slice(HOY.indexOf('function MiniaturaSinFoto('), HOY.indexOf('// ─── Con registro'));
  assert.match(sinFoto, /<View style=\{estilos\.miniaturaSinFoto\} accessible=\{false\} importantForAccessibility="no-hide-descendants">\s*<IconoDePlato color=\{COLOR\.azul\} tamano=\{36\} \/>/);
  // «Ver detalle» al lado del nombre, con 48 dp de toque, y los macros y «Comí esta opción» alineados abajo.
  assert.match(tarjeta, /accessibilityLabel=\{`\$\{COPY_REGISTRO_DE_COMIDAS\.verDetalle\}: \$\{opcion\.label\}`\} onPress=\{alVerDetalle\}/);
  assert.match(HOY, /verDetalle: \{[^}]*minHeight: 48/);
  assert.ok(tarjeta.indexOf('estilos.empuje') < tarjeta.indexOf('<FranjaDeMacros') && tarjeta.indexOf('<FranjaDeMacros') < tarjeta.indexOf('comiEstaOpcion'));
  // «Estimación del plan» no se toca: en `tenue`.
  assert.match(HOY, /estimacion: \{[^}]*color: COLOR\.tenue/);
});

// ─── 2. La franja de macros ─────────────────────────────────────────────────────────────────────

test('2 · la franja de las tres recetas del paquete: el orden del website, las abreviaturas y el redondeo del dominio, con coma', () => {
  for (const receta of RECETAS) {
    const celdas = franja.celdasDeLaFranja(macrosDe(receta));
    // A32-04 (RP-07 en la app): el orden y las abreviaturas de las vistas de Nutrición del website.
    assert.deepEqual(
      celdas.map((c) => c.etiqueta),
      ['Calorías', 'Proteínas', 'Carbohidratos', 'Grasas'],
    );
    assert.deepEqual(
      celdas.map((c) => c.unidad),
      ['kcal', 'g', 'g', 'g'],
    );
    assert.deepEqual(
      celdas.map((c) => c.abreviatura),
      ['kcal', 'g P', 'g C', 'g G'],
    );
    assert.deepEqual(
      celdas.map((c) => c.icono),
      ['calorias', 'proteinas', 'carbohidratos', 'grasas'],
    );
    // Lo que muestra la APK es lo que el paquete dice para mostrar (display_nutrients), con la coma del país.
    const esperado = ['energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g'].map((k) => receta.display_nutrients[k].replace('.', ','));
    assert.deepEqual(
      celdas.map((c) => c.valor),
      esperado,
      receta.name,
    );
    assert.equal(celdas[0].abreviado, `${esperado[0]} kcal`);
    assert.equal(celdas[1].abreviado, `${esperado[1]} g P`);
    // El lector de pantalla lee la palabra entera, no la abreviatura.
    assert.equal(celdas[0].paraLeer, `Calorías: ${esperado[0]} kcal`);
    assert.equal(celdas[1].paraLeer, `Proteínas: ${esperado[1]} g`);
    // La fibra va aparte, debajo de la franja, sin ícono.
    const fibra = franja.celdaDeMacro(macrosDe(receta), 'fiberG');
    assert.equal(fibra.paraLeer, `Fibra: ${receta.display_nutrients.fiber_g.replace('.', ',')} g`);
    assert.equal(fibra.icono, null);
  }
});

test('2 · TEST-A32-007 · los íconos y las abreviaturas son los mismos que los del website, y los íconos existen en la familia de BE', () => {
  const WEB = readFileSync(resolve(RAIZ, 'apps/web/src/app/pro/advisees/nutrition/abreviaturas-de-macros.ts'), 'utf8');
  const tabla = (nombre) => Object.fromEntries([...(new RegExp(`${nombre}[^=]*= \\{([^}]*)\\}`).exec(WEB)?.[1] ?? '').matchAll(/(\w+): '([^']*)'/g)].map((m) => [m[1], m[2]]));
  const web = { iconos: tabla('ICONO_DEL_MACRO'), abreviaturas: tabla('ABREVIATURA_DEL_MACRO') };
  const MACRO = { energyKcal: 'kcal', proteinG: 'protein', carbohydrateG: 'carbohydrate', fatG: 'fat' };
  for (const n of franja.NUTRIENTES_DE_LA_FRANJA) {
    assert.equal(franja.ICONO_DEL_NUTRIENTE[n], web.iconos[MACRO[n]], `ícono de ${n}`);
    assert.equal(franja.ABREVIATURA_DEL_NUTRIENTE[n], web.abreviaturas[MACRO[n]], `abreviatura de ${n}`);
    assert.ok(d.ICONOS[franja.ICONO_DEL_NUTRIENTE[n]], `el ícono ${franja.ICONO_DEL_NUTRIENTE[n]} está en el dominio`);
  }
  // El orden también: el de «Rangos y totales» del website.
  const RANGOS = readFileSync(resolve(RAIZ, 'apps/web/src/app/pro/advisees/nutrition/rangos.ts'), 'utf8');
  assert.match(RANGOS, /NUTRIENTES_DEL_RANGO = \['energyKcal', 'proteinG', 'carbohydrateG', 'fatG'\] as const;/);
  assert.deepEqual([...franja.NUTRIENTES_DE_LA_FRANJA], ['energyKcal', 'proteinG', 'carbohydrateG', 'fatG']);
  // En la pantalla: el ícono en `tenue` arriba, y debajo el número con su abreviatura.
  const PIEZAS = readFileSync(resolve(RAIZ, 'apps/mobile/src/piezas-de-nutricion.tsx'), 'utf8');
  assert.match(PIEZAS, /\{c\.icono \? <Icono nombre=\{c\.icono\} tamano=\{LADO_DEL_ICONO_DEL_MACRO\} tono="tenue" \/> : null\}\s*<ValorDeMacro celda=\{c\} abreviado \/>/);
  assert.match(PIEZAS, /unidad=\{abreviado \? celda\.abreviatura : celda\.unidad\}/);
});

test('2 · un nutriente desconocido dice «Sin dato», nunca 0', () => {
  const pollo = macrosDe(RECETAS[0]);
  const sinFibraNiGrasa = { ...pollo, fatG: { value: null, missing: [{ key: 'aceite', reason: 'SIN_DATO_DEL_NUTRIENTE' }] } };
  const grasas = franja.celdasDeLaFranja(sinFibraNiGrasa)[3];
  assert.equal(grasas.nutriente, 'fatG');
  assert.equal(grasas.valor, null);
  assert.equal(grasas.texto, 'Sin dato');
  assert.equal(grasas.abreviado, 'Sin dato');
  assert.equal(grasas.paraLeer, 'Grasas: Sin dato');
  assert.doesNotMatch(grasas.texto, /\b0\b/);
  // Un cero calculado sí es un cero: el aceite no tiene proteínas.
  const soloAceite = macrosDe({ items: [{ food_id: 'aceite_oliva', quantity_g: '8' }] });
  assert.equal(franja.celdaDeMacro(soloAceite, 'proteinG').valor, '0,0');
});

test('2 · cuatro columnas si entran; dos por dos en un teléfono angosto o con letra ×1,3; una columna si ni así entran', () => {
  const celdas = franja.celdasDeLaFranja(macrosDe(RECETAS[0]));
  const necesario = franja.anchoDeLaCelda(celdas, 1);
  assert.ok(necesario >= franja.LADO_DEL_ICONO_DEL_MACRO + franja.RELLENO_DE_LA_CELDA, `al menos el ícono: ${necesario}`);
  assert.equal(franja.columnasDeLaFranja(4 * necesario, 1, celdas), 4, 'cuatro si entran');
  assert.equal(franja.columnasDeLaFranja(4 * necesario - 1, 1, celdas), 2);
  // Los anchos de la franja con la tarjeta a todo el ancho (A32-01): 360, 390 y 412 dp menos el relleno de la pantalla
  // (20 + 20), el de la tarjeta de la comida (10 + 10 y su borde) y el de la opción (4 + 4), menos el borde de la franja.
  const ANCHO_DE_LA_FRANJA = { 360: 288, 390: 318, 412: 340 };
  for (const [telefono, ancho] of Object.entries(ANCHO_DE_LA_FRANJA)) {
    assert.equal(franja.columnasDeLaFranja(ancho, 1, celdas), 4, `${telefono} dp, letra ×1: las cuatro en una fila`);
    assert.equal(franja.columnasDeLaFranja(ancho, 1.3, celdas), 2, `${telefono} dp, letra ×1,3: dos por dos`);
  }
  assert.equal(franja.columnasDeLaFranja(288, 2, celdas), 2, '360 dp, letra ×2: dos por dos todavía entra');
  assert.equal(franja.columnasDeLaFranja(2 * franja.anchoDeLaCelda(celdas, 2) - 1, 2, celdas), 1, 'si dos no entran, una columna');
  // Con letra grande, dos por dos como mucho, aunque cuatro entraran.
  assert.equal(franja.columnasDeLaFranja(2000, 1.3, celdas), 2);
  // Ninguna disposición recorta: el ancho de la columna alcanza para la celda más ancha, salvo la de una sola columna,
  // que es el último recurso.
  for (const escala of [1, 1.15, 1.3, 1.5, 2]) {
    for (const ancho of [200, 236, 266, 288, 400, 640]) {
      const columnas = franja.columnasDeLaFranja(ancho, escala, celdas);
      if (columnas > 1) assert.ok(columnas * franja.anchoDeLaCelda(celdas, escala) <= ancho, `${ancho} dp, ×${escala}: ${columnas} columnas`);
    }
  }
});

// ─── 3. ¿Cuánto comiste? ────────────────────────────────────────────────────────────────────────

const ITEMS = [
  { itemId: 'pollo', quantity: { value: 120, unit: 'g' } },
  { itemId: 'arroz', quantity: { value: 160, unit: 'g' } },
  { itemId: 'aceite', quantity: { value: 8, unit: 'g' } },
  { itemId: 'sal', quantity: null },
];
const pantalla = (escritas = {}, noComidos = {}, modo = 'informadas') => ({ modo, escritas, noComidos });
const armar = (estado) => consumo.consumoDesdeLaPantalla(estado, ITEMS);
const valido = (resultado) => {
  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  return d.ConsumoEntradaSchema.parse(resultado.consumo);
};

test('3 · sin marcar nada es «sin confirmar», y la casilla de las porciones del plan empieza desmarcada', () => {
  assert.deepEqual(consumo.SIN_CANTIDADES, { modo: 'sin-confirmar', escritas: {}, noComidos: {} });
  assert.deepEqual(valido(armar(consumo.SIN_CANTIDADES)), { status: 'UNCONFIRMED' });
  assert.deepEqual(valido(armar(pantalla({}, {}, 'porciones-del-plan'))), { status: 'PLAN_PORTIONS' });
  // Abrir los campos y no escribir nada no informa nada.
  assert.deepEqual(valido(armar(pantalla())), { status: 'UNCONFIRMED' });
  assert.deepEqual(valido(armar(pantalla({ pollo: '   ' }))), { status: 'UNCONFIRMED' });
});

test('3 · lo informado: vacío queda sin confirmar (nunca cero), «No lo comí» va sin cantidad, y la coma se lee', () => {
  const r = valido(armar(pantalla({ pollo: '120,5', arroz: '' }, { aceite: true })));
  assert.equal(r.status, 'REPORTED');
  assert.deepEqual(r.items, [
    { itemId: 'pollo', quantity: { value: 120.5, unit: 'g' }, notEaten: false },
    { itemId: 'arroz', quantity: null, notEaten: false },
    { itemId: 'aceite', quantity: null, notEaten: true },
    { itemId: 'sal', quantity: null, notEaten: false },
  ]);
  // Lo marcado «No lo comí» manda aunque haya algo escrito en su campo.
  assert.deepEqual(valido(armar(pantalla({ aceite: '8' }, { aceite: true }))).items[2], { itemId: 'aceite', quantity: null, notEaten: true });
  // Un ingrediente sin cantidad en el plan no tiene unidad: solo «No lo comí» o sin confirmar.
  assert.deepEqual(valido(armar(pantalla({ sal: '3' }, { pollo: true }))).items[3], { itemId: 'sal', quantity: null, notEaten: false });
  assert.equal(consumo.admiteCantidad(ITEMS[3]), false);
  // Lo previsto no viaja: el pedido no lleva las cantidades del plan.
  assert.doesNotMatch(JSON.stringify(valido(armar(pantalla({ pollo: '100' })))), /160/);
});

test('3 · el cero no es una cantidad (se ofrece «No lo comí»), ni lo negativo ni lo ilegible: cada error va en su campo', () => {
  const r = armar(pantalla({ pollo: '0', arroz: '-5', aceite: 'mucho' }));
  assert.equal(r.ok, false);
  assert.equal(r.errores.pollo, C.ceroNoEsCantidad);
  assert.equal(r.errores.arroz, C.ceroNoEsCantidad, 'un negativo tampoco es una cantidad comida');
  assert.equal(r.errores.aceite, d.motivoDeNumeroIlegible('mucho'));
  assert.match(C.ceroNoEsCantidad, /No lo comí/);
  // «1.850» es ambiguo: se pide escribirlo sin punto.
  assert.equal(armar(pantalla({ arroz: '1.850' })).errores.arroz, d.motivoDeNumeroIlegible('1.850'));
  // Y el contrato rechaza el cero aunque llegara: la pantalla no lo manda.
  assert.equal(d.ItemInformadoSchema.safeParse({ itemId: 'pollo', quantity: { value: 0, unit: 'g' }, notEaten: false }).success, false);
});

test('3 · al completar o corregir, la pantalla parte de lo registrado, y solo un cambio real cuenta como sin guardar', () => {
  assert.deepEqual(consumo.pantallaDesdeElConsumo(null), consumo.SIN_CANTIDADES);
  assert.deepEqual(consumo.pantallaDesdeElConsumo({ status: 'UNCONFIRMED', items: [] }), consumo.SIN_CANTIDADES);
  assert.equal(consumo.pantallaDesdeElConsumo({ status: 'PLAN_PORTIONS', items: [] }).modo, 'porciones-del-plan');
  const informado = consumo.pantallaDesdeElConsumo({
    status: 'REPORTED',
    items: [
      { itemId: 'pollo', quantity: { value: 120.5, unit: 'g' }, notEaten: false },
      { itemId: 'aceite', quantity: null, notEaten: true },
      { itemId: 'arroz', quantity: null, notEaten: false },
    ],
  });
  assert.deepEqual(informado, { modo: 'informadas', escritas: { pollo: '120,5' }, noComidos: { aceite: true } });
  // Volver a armar lo mismo da lo mismo.
  assert.deepEqual(valido(armar(informado)).items.slice(0, 3), [
    { itemId: 'pollo', quantity: { value: 120.5, unit: 'g' }, notEaten: false },
    { itemId: 'arroz', quantity: null, notEaten: false },
    { itemId: 'aceite', quantity: null, notEaten: true },
  ]);
  assert.equal(consumo.cambiaronLasCantidades(informado, informado), false);
  assert.equal(consumo.cambiaronLasCantidades({ ...informado, escritas: { pollo: '120,5 ' } }, informado), false, 'un espacio no es un cambio');
  assert.equal(consumo.cambiaronLasCantidades({ ...informado, escritas: { pollo: '100' } }, informado), true);
  assert.equal(consumo.cambiaronLasCantidades(pantalla(), consumo.SIN_CANTIDADES), false, 'abrir los campos sin escribir no es un cambio');
  assert.equal(consumo.cambiaronLasCantidades(pantalla({}, {}, 'porciones-del-plan')), true);
});

// ─── 4. La comida diferente ─────────────────────────────────────────────────────────────────────

const CONTEXTO = { activePlanId: 'plan-1', dayTypeId: 'dia-1', mealId: 'almuerzo' };
const AHORA = '2026-10-05T15:30:00.000Z';
const FOTO = { uri: 'file:///cache/foto.jpg', ancho: 1600, alto: 1200 };

test('4 · hace falta una descripción o una foto; espacios solos no son una descripción', () => {
  assert.equal(borrador.hayContenido('Un sándwich', null), true, 'solo texto');
  assert.equal(borrador.hayContenido('', FOTO), true, 'solo foto');
  assert.equal(borrador.hayContenido('Un sándwich', FOTO), true, 'los dos');
  assert.equal(borrador.hayContenido('', null), false, 'vacía');
  assert.equal(borrador.hayContenido('   ', null), false, 'solo espacios');
  // Lo que se perdería al salir incluye la cantidad aproximada.
  assert.equal(borrador.hayBorrador('', '1 porción', null), true);
  assert.equal(borrador.hayBorrador(' ', '', null), false);
});

test('4 · el pedido de una comida diferente: texto, foto o los dos, sin macros ni cantidades del catálogo', () => {
  const soloTexto = borrador.cuerpoDeLaComidaDiferente(CONTEXTO, { descripcion: '  Sándwich de pollo y una fruta. ', cantidad: ' ', mediaIds: [], occurredAt: AHORA });
  assert.deepEqual(d.RegistroDiferenteRequestSchema.parse(soloTexto), {
    kind: 'DIFFERENT',
    activePlanId: 'plan-1',
    dayTypeId: 'dia-1',
    mealId: 'almuerzo',
    occurredAt: AHORA,
    description: 'Sándwich de pollo y una fruta.',
    approximateQuantity: null,
    mediaIds: [],
  });
  const soloFoto = borrador.cuerpoDeLaComidaDiferente(CONTEXTO, { descripcion: '', cantidad: '1 sándwich y 1 manzana', mediaIds: ['m1'], occurredAt: AHORA });
  assert.equal(d.RegistroDiferenteRequestSchema.safeParse(soloFoto).success, true);
  assert.equal(soloFoto.description, null);
  assert.equal(soloFoto.approximateQuantity, '1 sándwich y 1 manzana', 'texto libre: no se convierte');
  const vacia = borrador.cuerpoDeLaComidaDiferente(CONTEXTO, { descripcion: ' ', cantidad: '', mediaIds: [], occurredAt: AHORA });
  assert.equal(d.RegistroDiferenteRequestSchema.safeParse(vacia).success, false, 'el contrato también exige uno de los dos');
});

test('4 · al elegir: que sea una imagen y sus medidas; el formato y el tamaño los decide el archivo que se sube', () => {
  assert.equal(borrador.esImagen('image/jpeg'), true);
  assert.equal(borrador.esImagen('image/png; charset=binary'), true);
  // El selector, con calidad menor que 1, las vuelve a codificar en JPEG: se aceptan y decide el archivo.
  assert.equal(borrador.esImagen('image/heic'), true, 'un HEIC de la galería');
  assert.equal(borrador.esImagen('image/gif', 'foto.gif'), true, 'un GIF de la galería');
  assert.equal(borrador.esImagen(null, 'IMG_2026.WEBP'), true, 'sin tipo declarado, por la extensión');
  assert.equal(borrador.esImagen('video/mp4', 'foto.jpg'), false, 'lo declarado manda: un video no es una foto');
  assert.equal(borrador.esImagen(undefined, 'archivo'), false);
  const elegir = (imagen) => borrador.fotoDesdeElSelector({ uri: 'file:///x.jpeg', ...imagen });
  assert.deepEqual(elegir({ mimeType: 'image/jpeg', fileSize: 2_000_000, width: 4000, height: 3000 }).foto, { uri: 'file:///x.jpeg', ancho: 4000, alto: 3000 });
  assert.equal(elegir({ mimeType: 'video/mp4' }).motivo, 'TIPO');
  assert.equal(elegir({ mimeType: 'image/heic', width: 4032, height: 3024 }).motivo, null);
  // `fileSize` es el del original, no el del archivo comprimido que se sube: no decide.
  assert.equal(elegir({ mimeType: 'image/jpeg', fileSize: d.LIMITES_DE_MEDIO.bytesMaximos + 1, width: 4000, height: 3000 }).motivo, null);
  assert.equal(elegir({ mimeType: 'image/png', width: 50, height: 400 }).motivo, 'DIMENSIONES');
  assert.equal(elegir({ mimeType: 'image/png', width: 8001, height: 400 }).motivo, 'DIMENSIONES');
  assert.equal(elegir({ mimeType: 'image/jpeg', width: 8160, height: 6120 }).motivo, 'DIMENSIONES', 'una cámara de 50 megapíxeles');
  assert.equal(elegir({ mimeType: 'image/png', width: 7000, height: 7000 }).motivo, 'DIMENSIONES', 'más de 40 megapíxeles');
  // Lo que el selector no dice no invalida: se valida después con los bytes.
  assert.equal(elegir({ mimeType: 'image/jpeg' }).motivo, null);
  // El aviso de cada motivo es un texto del dominio.
  assert.equal(borrador.AVISO_DE_FOTO_INVALIDA.TIPO, C.fotoInvalida);
  assert.equal(borrador.AVISO_DE_FOTO_INVALIDA.DIMENSIONES, d.COPY_RECETAS.imagenInvalida);
});

// Los primeros bytes de cada formato, como los escriben Android y la API.
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP = Uint8Array.from([...Buffer.from('RIFF'), 0x24, 0, 0, 0, ...Buffer.from('WEBPVP8 ')]);
const HEIC = Uint8Array.from([0, 0, 0, 0x18, ...Buffer.from('ftypheic')]);
const GIF = Uint8Array.from(Buffer.from('GIF89a'));

test('4 · el tipo de la foto sale de sus bytes, como en la API: JPEG, PNG o WebP', () => {
  assert.equal(borrador.tipoPorLosBytes(JPEG), 'image/jpeg');
  assert.equal(borrador.tipoPorLosBytes(PNG), 'image/png');
  assert.equal(borrador.tipoPorLosBytes(WEBP), 'image/webp');
  assert.equal(borrador.tipoPorLosBytes(HEIC), null);
  assert.equal(borrador.tipoPorLosBytes(GIF), null);
  assert.equal(borrador.tipoPorLosBytes(new Uint8Array()), null);
  assert.equal(borrador.tipoPorLosBytes(Uint8Array.from(Buffer.from('File not found'))), null);
  assert.equal(borrador.motivoDeFotoInvalida({ tipo: 'image/jpeg', bytes: d.LIMITES_DE_MEDIO.bytesMaximos, ancho: 4000, alto: 3000 }), null, 'justo 10 MB, sí');
  assert.equal(borrador.motivoDeFotoInvalida({ tipo: 'image/jpeg', bytes: d.LIMITES_DE_MEDIO.bytesMaximos + 1, ancho: 4000, alto: 3000 }), 'TAMANO');
  assert.equal(borrador.motivoDeFotoInvalida({ tipo: 'image/jpeg', bytes: 0, ancho: null, alto: null }), 'TAMANO');
  assert.equal(borrador.motivoDeFotoInvalida({ tipo: null, bytes: 1000, ancho: null, alto: null }), 'TIPO');
});

test('4 · leer la foto: bytes con su tipo real; un archivo que no se lee se puede reintentar, uno que no sirve se dice', async () => {
  const con = (bytes, ok = true) => async () => ({ ok, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
  const camara = await borrador.leerLaFoto(FOTO, con(JPEG));
  assert.equal(camara.ok, true);
  assert.equal(camara.tipo, 'image/jpeg');
  assert.ok(camara.bytes instanceof Uint8Array, 'bytes, nunca un Blob: expo/fetch respeta el Content-Type declarado');
  assert.equal(camara.bytes.byteLength, JPEG.byteLength);
  // Un WebP de la galería que el selector volvió a codificar: el archivo se llama .webp, pero es JPEG.
  assert.equal((await borrador.leerLaFoto({ ...FOTO, uri: 'file:///cache/a.webp' }, con(JPEG))).tipo, 'image/jpeg');
  assert.equal((await borrador.leerLaFoto(FOTO, con(PNG))).tipo, 'image/png');
  assert.deepEqual(await borrador.leerLaFoto(FOTO, con(HEIC)), { ok: false, motivo: 'TIPO' });
  assert.deepEqual(await borrador.leerLaFoto(FOTO, con(Uint8Array.from(Buffer.from('File not found')), false)), { ok: false, motivo: null }, 'el archivo ya no está');
  assert.deepEqual(
    await borrador.leerLaFoto(FOTO, async () => {
      throw new Error('sin acceso');
    }),
    { ok: false, motivo: null },
  );
  const pesada = new Uint8Array(d.LIMITES_DE_MEDIO.bytesMaximos + 1);
  pesada.set(JPEG);
  assert.deepEqual(await borrador.leerLaFoto(FOTO, con(pesada)), { ok: false, motivo: 'TAMANO' }, 'más de 10 MB: no se pide la ruta');
  assert.deepEqual(await borrador.leerLaFoto({ ...FOTO, ancho: 9000, alto: 3000 }, con(JPEG)), { ok: false, motivo: 'DIMENSIONES' });
});

test('4 · un rechazo de la API culpa a la foto solo si es por sus bytes o su tamaño; por la cabecera, es del envío', () => {
  // El caso de la 0.15.0-candidata.1: la cabecera llegó vacía.
  assert.equal(borrador.motivoDelRechazo('FILE_TYPE_NOT_ALLOWED', [{ code: 'FILE_TYPE_NOT_ALLOWED', path: 'Content-Type' }]), null);
  assert.equal(borrador.motivoDelRechazo('FILE_TYPE_NOT_ALLOWED', [{ code: 'CONTENT_TYPE_DIFFERS_FROM_INTENT', path: 'Content-Type' }]), null);
  assert.equal(borrador.motivoDelRechazo('FILE_TYPE_NOT_ALLOWED', [{ code: 'FILE_TYPE_NOT_ALLOWED', path: 'contentType' }]), null, 'lo declarado en la intención');
  assert.equal(borrador.motivoDelRechazo('FILE_TYPE_NOT_ALLOWED', [{ code: 'FILE_TYPE_NOT_ALLOWED', path: '(body)' }]), 'TIPO');
  assert.equal(borrador.motivoDelRechazo('FILE_CONTENT_INVALID', [{ code: 'IMAGE_DIMENSIONS_OUT_OF_RANGE', path: '(body)' }]), 'DIMENSIONES');
  assert.equal(borrador.motivoDelRechazo('FILE_SIZE_NOT_ALLOWED', [{ code: 'FILE_TOO_LARGE', path: '(body)' }]), 'TAMANO');
  assert.equal(borrador.motivoDelRechazo('VALIDATION_FAILED', [{ code: 'X', path: '(body)' }]), null);
});

test('4 · el envío con el fetch de la APK (expo/fetch, su código real): bytes conservan el Content-Type, un Blob sin tipo lo pisa', async () => {
  // Expo 57 instala `expo/fetch` como fetch global (`expo/src/winter/runtime.native.ts`). Su normalización del cuerpo y de
  // las cabeceras es JS: se transpila y se usa tal cual. Un `file://` le devuelve una respuesta sin Content-Type
  // (`OkHttpFileUrlInterceptor.kt`), así que el Blob que daba `fetch(uri).blob()` tenía el tipo vacío.
  const ts = require('typescript');
  const expo = dirname(createRequire(resolve(RAIZ, 'apps/mobile/package.json')).resolve('expo/package.json'));
  const cargar = (ruta, modulos) => {
    const { outputText } = ts.transpileModule(readFileSync(resolve(expo, ruta), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    const module = { exports: {} };
    new Function('exports', 'require', 'module', outputText)(module.exports, (m) => modulos[m], module);
    return module.exports;
  };
  const runtime = readFileSync(resolve(expo, 'src/winter/runtime.native.ts'), 'utf8');
  assert.match(runtime, /install\('fetch', \(\) => require\('\.\/fetch'\)\.fetch\)/, 'el fetch global de la APK es el de Expo');
  const utils = cargar('src/winter/fetch/RequestUtils.ts', { '../../utils/blobUtils': cargar('src/utils/blobUtils.ts', {}), './convertFormData': {} });
  const enviado = [];
  const fetchDeExpo = async (url, init) => {
    let headers = utils.normalizeHeadersInit(init.headers);
    const { overriddenHeaders } = await utils.normalizeBodyInitAsync(init.body);
    if (overriddenHeaders) headers = utils.overrideHeaders(headers, overriddenHeaders);
    enviado.push(Object.fromEntries(headers.map(([k, v]) => [k.toLowerCase(), v]))['content-type']);
    return new Response(JSON.stringify({ error: { code: 'FILE_TYPE_NOT_ALLOWED', message: 'x', details: { issues: [] } } }), { status: 422 });
  };
  const cliente = d.crearClienteBe({ baseUrl: 'https://api.test/api/v1', superficie: 'APK', fetch: fetchDeExpo });
  const leida = await borrador.leerLaFoto(FOTO, async () => ({ ok: true, arrayBuffer: async () => JPEG.buffer.slice(0) }));
  await cliente.subirMedio('/media/uploads/t', leida.bytes, leida.tipo);
  await cliente.subirMedio('/media/uploads/t', new Blob([JPEG], { type: '' }), 'image/jpeg');
  assert.deepEqual(enviado, ['image/jpeg', ''], 'con bytes llega el tipo declarado; con el Blob de la candidata llegaba vacío');
});

test('4 · los estados del guardado se distinguen, y nunca se anuncia «Guardado» antes de tiempo', () => {
  const textos = [
    borrador.textoDelBotonDeGuardar({ tipo: 'editando' }, 'Almuerzo'),
    borrador.textoDelBotonDeGuardar({ tipo: 'subiendo' }, 'Almuerzo'),
    borrador.textoDelBotonDeGuardar({ tipo: 'guardando' }, 'Almuerzo'),
    borrador.textoDelBotonDeGuardar({ tipo: 'error-de-la-foto' }, 'Almuerzo'),
    borrador.textoDelBotonDeGuardar({ tipo: 'guardado' }, 'Almuerzo'),
  ];
  assert.deepEqual(textos, ['Guardar almuerzo', 'Subiendo la foto…', 'Guardando…', 'Reintentar', 'Guardado.']);
  assert.equal(new Set(textos).size, textos.length, 'cinco estados, cinco textos');
  // Un error incierto reintenta (con la misma clave); uno definitivo vuelve a «Guardar».
  assert.equal(borrador.textoDelBotonDeGuardar({ tipo: 'error-al-guardar', incierto: true, mensaje: '' }, 'Cena'), 'Reintentar');
  assert.equal(borrador.textoDelBotonDeGuardar({ tipo: 'error-al-guardar', incierto: false, mensaje: '' }, 'Cena'), 'Guardar cena');
  // Mientras sube o guarda, un segundo toque no manda nada.
  assert.deepEqual(
    ['editando', 'subiendo', 'guardando', 'error-de-la-foto', 'guardado'].map((tipo) => borrador.estaOcupado({ tipo })),
    [false, true, true, false, false],
  );
});

test('4 · la subida: la misma foto con la ruta vigente se vuelve a subir ahí; vencida o con otra foto, se pide otra ruta', () => {
  const ahora = Date.parse(AHORA);
  const ruta = { uri: FOTO.uri, mediaId: 'm1', uploadPath: '/media/uploads/t1', venceMs: ahora + 10 * 60_000, subida: false };
  assert.equal(borrador.pasoDeLaSubida(null, FOTO, ahora), 'pedir-ruta');
  assert.equal(borrador.pasoDeLaSubida(ruta, FOTO, ahora), 'subir');
  assert.equal(borrador.pasoDeLaSubida({ ...ruta, subida: true }, FOTO, ahora), 'lista', 'ya subida: no se sube de nuevo');
  assert.equal(borrador.pasoDeLaSubida(ruta, FOTO, ruta.venceMs - borrador.MARGEN_DE_LA_RUTA_MS), 'pedir-ruta', 'a punto de vencer');
  assert.equal(borrador.pasoDeLaSubida(ruta, { ...FOTO, uri: 'file:///cache/otra.jpg' }, ahora), 'pedir-ruta', 'otra foto');
});

// ─── 5. El comando único ────────────────────────────────────────────────────────────────────────

const OK = (datos) => ({ ok: true, datos });
const SIN_RED = { ok: false, tipo: 'RED' };
const YA_REGISTRADA = { ok: false, tipo: 'API', status: 409, codigo: 'EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY', issues: [] };
const esIncierto = (r) => !r.ok && (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA');
function nuevoComando() {
  let n = 0;
  return comando.crearComandoDeRegistro({ nuevaClave: () => `apk-clave-${++n}`, esIncierto, huella: comando.huellaDelPedido });
}
/** Un pedido de opción, como los arman el carrusel y el detalle, validado con el contrato. */
const pedidoDeOpcion = (occurredAt, consumption = { status: 'UNCONFIRMED' }) =>
  d.RegistrarComidaRequestSchema.parse({ kind: 'PLAN_OPTION', activePlanId: 'plan-1', dayTypeId: 'dia-1', mealId: 'almuerzo', optionId: 'pollo', occurredAt, consumption, observation: null });
/** Una API de prueba que anota cada pedido y responde lo que se le pida, cuando se le pida. */
function apiDePrueba() {
  const pedidos = [];
  const pendientes = [];
  const llamar = (cuerpo, clave) =>
    new Promise((responder) => {
      pedidos.push({ cuerpo, clave });
      pendientes.push(responder);
    });
  return { pedidos, llamar, responder: (r) => pendientes.shift()(r) };
}
const INTENTO = comando.intentoDeLaComida('token', '2026-10-05', 'almuerzo');

test('5 · doble toque: mientras el pedido está en vuelo, otro toque recibe el mismo pedido y no sale un segundo', async () => {
  const c = nuevoComando();
  const api = apiDePrueba();
  const primero = c.enviar(INTENTO, pedidoDeOpcion('2026-10-05T15:30:00.000Z'), api.llamar);
  const segundo = c.enviar(INTENTO, pedidoDeOpcion('2026-10-05T15:30:00.400Z'), api.llamar);
  assert.equal(api.pedidos.length, 1);
  assert.equal(c.enVuelo(INTENTO), true);
  api.responder(OK({ data: { recordId: 'r1' } }));
  assert.deepEqual(await primero, await segundo);
  assert.equal(c.pendiente(INTENTO), false, 'una respuesta definitiva cierra el intento');
});

test('5 · reintento: después de una respuesta incierta, el mismo pedido sale con la misma clave y el mismo cuerpo, aunque venga del detalle', async () => {
  const c = nuevoComando();
  const api = apiDePrueba();
  const desdeElCarrusel = c.enviar(INTENTO, pedidoDeOpcion('2026-10-05T15:30:00.000Z'), api.llamar);
  api.responder(SIN_RED);
  assert.deepEqual(await desdeElCarrusel, SIN_RED);
  assert.equal(c.pendiente(INTENTO), true);
  // El reintento llega un minuto después, desde el detalle: otra hora, el mismo pedido.
  const desdeElDetalle = c.enviar(INTENTO, pedidoDeOpcion('2026-10-05T15:31:00.000Z'), api.llamar);
  api.responder(OK({ data: { recordId: 'r1' } }));
  await desdeElDetalle;
  assert.equal(api.pedidos.length, 2);
  assert.equal(api.pedidos[1].clave, api.pedidos[0].clave, 'la misma Idempotency-Key');
  assert.deepEqual(api.pedidos[1].cuerpo, api.pedidos[0].cuerpo, 'el mismo cuerpo, con su occurredAt: la API compara la huella');
  assert.equal(api.pedidos[1].cuerpo.occurredAt, '2026-10-05T15:30:00.000Z');
  // Después del éxito, otro registro de la misma comida es otro intento.
  const otro = c.enviar(INTENTO, pedidoDeOpcion('2026-10-05T20:00:00.000Z'), api.llamar);
  api.responder(YA_REGISTRADA);
  assert.deepEqual(await otro, YA_REGISTRADA);
  assert.notEqual(api.pedidos[2].clave, api.pedidos[0].clave);
});

test('5 · otro pedido después de una respuesta incierta (otras cantidades) es otro intento, con clave nueva', async () => {
  const c = nuevoComando();
  const api = apiDePrueba();
  const rapido = c.enviar(INTENTO, pedidoDeOpcion('2026-10-05T15:30:00.000Z'), api.llamar);
  api.responder(SIN_RED);
  await rapido;
  const conCantidades = c.enviar(INTENTO, pedidoDeOpcion('2026-10-05T15:32:00.000Z', { status: 'PLAN_PORTIONS' }), api.llamar);
  api.responder(YA_REGISTRADA);
  // Si el primero había llegado, la API dice que la comida ya está registrada: la pantalla lo dice y no duplica.
  assert.deepEqual(await conCantidades, YA_REGISTRADA);
  assert.notEqual(api.pedidos[1].clave, api.pedidos[0].clave);
  assert.equal(api.pedidos[1].cuerpo.occurredAt, '2026-10-05T15:32:00.000Z');
  // Una respuesta definitiva cierra el intento, y descartar no corta nada en vuelo.
  assert.equal(c.pendiente(INTENTO), false);
  const enVuelo = c.enviar(INTENTO, pedidoDeOpcion(AHORA), api.llamar);
  c.descartar(INTENTO);
  assert.equal(c.enVuelo(INTENTO), true);
  api.responder(OK({ data: {} }));
  await enVuelo;
});

test('5 · cada comida tiene su intento: registrar el almuerzo no frena la cena, y otra sesión no reusa claves', async () => {
  const c = nuevoComando();
  const api = apiDePrueba();
  const almuerzo = c.enviar(INTENTO, pedidoDeOpcion(AHORA), api.llamar);
  const cena = c.enviar(comando.intentoDeLaComida('token', '2026-10-05', 'cena'), { ...pedidoDeOpcion(AHORA), mealId: 'cena' }, api.llamar);
  assert.equal(api.pedidos.length, 2);
  assert.notEqual(api.pedidos[0].clave, api.pedidos[1].clave);
  api.responder(OK({}));
  api.responder(OK({}));
  await Promise.all([almuerzo, cena]);
  assert.notEqual(comando.intentoDeLaComida('otra', '2026-10-05', 'almuerzo'), INTENTO);
  // La huella no depende del orden de las claves ni de la hora.
  assert.equal(comando.huellaDelPedido({ b: 1, a: { d: 2, c: 3 }, occurredAt: 'x' }), comando.huellaDelPedido({ a: { c: 3, d: 2 }, b: 1, occurredAt: 'y' }));
});

// ─── 6. Las comidas de hoy ──────────────────────────────────────────────────────────────────────

/** Un registro sintético, validado con el esquema estricto de API-ING-03. */
function registro({ recordId, kind = 'PLAN_OPTION', mealId = 'almuerzo', recordedAt = '2026-10-05T15:30:00.000Z', deshecho = false }) {
  return d.RegistroDeComidaSchema.parse({
    recordId,
    version: 'v1',
    kind,
    planId: 'plan-1',
    localDate: '2026-10-05',
    timeZone: 'America/Argentina/Buenos_Aires',
    occurredAt: recordedAt,
    recordedAt,
    dayTypeId: 'dia-1',
    meal: mealId ? { mealId, label: mealId } : null,
    option: null,
    consumption: kind === 'PLAN_OPTION' ? { status: 'UNCONFIRMED', items: [], source: 'ORIGINAL', rectifiedAt: null } : null,
    consumed: null,
    observation: null,
    description: kind === 'DIFFERENT' ? 'Un sándwich' : null,
    approximateQuantity: null,
    evidence: [],
    annulment: deshecho ? { annulledAt: '2026-10-05T16:00:00.000Z', reason: null } : null,
  });
}
const COMIDAS = [
  { mealId: 'desayuno', recordId: 'r-desayuno' },
  { mealId: 'almuerzo', recordId: null },
  { mealId: 'merienda', recordId: null },
  { mealId: 'cena', recordId: null },
];

test('6 · el registro efectivo de una comida: el de su opción, o algo diferente comido en ella; lo deshecho no cuenta', () => {
  const registros = [
    registro({ recordId: 'r-desayuno', mealId: 'desayuno' }),
    registro({ recordId: 'r-viejo', kind: 'DIFFERENT', mealId: 'almuerzo', recordedAt: '2026-10-05T13:00:00.000Z', deshecho: true }),
    registro({ recordId: 'r-diferente', kind: 'DIFFERENT', mealId: 'almuerzo', recordedAt: '2026-10-05T14:00:00.000Z' }),
    registro({ recordId: 'r-suelto', kind: 'DIFFERENT', mealId: null }),
  ];
  assert.equal(comidas.registroDeLaComida(COMIDAS[0], registros)?.recordId, 'r-desayuno');
  assert.equal(comidas.registroDeLaComida(COMIDAS[1], registros)?.recordId, 'r-diferente', 'algo diferente con la comida de contexto');
  assert.equal(comidas.registroDeLaComida(COMIDAS[2], registros), null);
  assert.equal(comidas.comidaRegistrada({ mealId: 'cena', recordId: 'r-sin-detalle' }, registros), true, 'el plan dice que tiene registro aunque falte el detalle');
  // Deshecho, la comida queda libre.
  assert.equal(comidas.registroDeLaComida({ mealId: 'almuerzo', recordId: null }, [registros[1]]), null);
});

test('6 · se muestra la comida elegida si sigue en el plan; si no, la que sigue (AV2-10); si no queda ninguna, la primera', () => {
  const registros = [registro({ recordId: 'r-desayuno', mealId: 'desayuno' })];
  assert.equal(comidas.comidaQueSeMuestra(COMIDAS, registros, 'cena'), 'cena');
  assert.equal(comidas.comidaQueSeMuestra(COMIDAS, registros, null), 'almuerzo', 'la primera sin registro');
  assert.equal(comidas.comidaQueSeMuestra(COMIDAS, registros, 'de-otro-plan'), 'almuerzo');
  const todas = COMIDAS.map((c) => ({ ...c, recordId: `r-${c.mealId}` }));
  assert.equal(comidas.comidaQueSeMuestra(todas, [], null), 'desayuno');
  assert.equal(comidas.comidaQueSeMuestra([], [], null), null);
  // Las fichas: cuatro en una fila a 360 dp (el ancho que les queda: 320) con letra normal; con letra grande, filas
  // parejas, dos y dos, en vez de tres y una.
  const CUATRO = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];
  assert.equal(comidas.fichasPorFila(320, CUATRO, 1), 4);
  assert.equal(comidas.fichasPorFila(372, CUATRO, 1), 4);
  assert.equal(comidas.fichasPorFila(320, CUATRO, 1.3), 2);
  assert.equal(comidas.fichasPorFila(372, CUATRO, 1.3), 2, 'entrarían tres: van dos y dos');
  assert.equal(comidas.fichasPorFila(320, CUATRO, 2), 2);
  assert.equal(comidas.fichasPorFila(320, [...CUATRO, 'Colación', 'Media mañana'], 1), 3, 'seis comidas: tres y tres');
  assert.equal(comidas.fichasPorFila(0, CUATRO, 1), 1, 'sin medir, una por fila: nada se superpone');
  // Ninguna ficha queda más angosta que su palabra más larga, estimada holgada (lo medido de «Desayuno»: 58 dp).
  for (const escala of [1, 1.3, 2]) {
    for (const ancho of [320, 350, 372]) {
      const n = comidas.fichasPorFila(ancho, CUATRO, escala);
      const anchoDeFicha = (ancho - comidas.SEPARACION_DE_LAS_FICHAS * (n - 1)) / n;
      assert.ok(anchoDeFicha >= 58.4 * escala + comidas.RELLENO_DE_LA_FICHA, `${ancho} dp, ×${escala}: ${n} por fila`);
    }
  }
  // Lo que dice el lector de cada ficha, con el participio del dominio.
  assert.equal(comidas.etiquetaDeLaComida('Almuerzo', true), 'Almuerzo registrado');
  assert.equal(comidas.etiquetaDeLaComida('Merienda', true), 'Merienda registrada');
  assert.equal(comidas.etiquetaDeLaComida('Cena', false), 'Cena, sin registro');
});

// ─── 7. Lo que solo se ve en el código ──────────────────────────────────────────────────────────

test('7 · las rutas nuevas son de Nutrición, vuelven a Hoy sin origen y a su origen si lo tienen', () => {
  const detalle = { nombre: 'opcion-de-comida', id: 'pollo', comidaId: 'almuerzo' };
  const diferente = { nombre: 'comida-diferente', comidaId: 'almuerzo', comida: 'Almuerzo', fecha: '2026-10-05', planId: 'plan-1', diaTipoId: 'dia-1' };
  for (const ruta of [detalle, diferente]) {
    assert.equal(nav.moduloDe(ruta), 'nutricion');
    assert.deepEqual(nav.anterior(ruta), { nombre: 'hoy' }, `${ruta.nombre} sin origen vuelve a Nutrición`);
    assert.deepEqual(nav.anterior(nav.navegar({ nombre: 'hoy' }, ruta)), { nombre: 'hoy' });
    assert.equal(nav.pestanaActiva(nav.navegar({ nombre: 'hoy' }, ruta)), 'nutricion');
  }
  // «Completar cantidades» desde el detalle de un registro vuelve a ese registro.
  const registroAbierto = nav.navegar({ nombre: 'hoy' }, { nombre: 'registro-nutricional', id: 'r1' });
  const completar = nav.navegar(registroAbierto, { nombre: 'opcion-de-comida', id: 'pollo', registroId: 'r1' });
  assert.deepEqual(nav.anterior(completar), registroAbierto);
  assert.equal(nav.textoDeVolverA({ nombre: 'hoy' }), 'Volver a Nutrición');
  assert.equal(nav.textoDeVolverA(registroAbierto), 'Volver al registro');
  // Dos comidas son dos pantallas distintas.
  assert.equal(nav.mismaPantalla(diferente, { ...diferente, comidaId: 'cena' }), false);
});

test('7 · la cámara y la galería: el plugin con sus textos en español, sin micrófono, y el permiso pedido al tocar', () => {
  const CONFIG = readFileSync(resolve(RAIZ, 'apps/mobile/app.config.ts'), 'utf8');
  const plugin = CONFIG.slice(CONFIG.indexOf("'expo-image-picker'"));
  assert.match(plugin, /cameraPermission: 'BE usa la cámara solo cuando tocás «Cámara»/);
  assert.match(plugin, /photosPermission: 'BE abre tus fotos solo cuando tocás «Galería»/);
  assert.match(plugin, /microphonePermission: false/);
  assert.match(CONFIG, /const VERSION = '0\.13\.2';/, 'el paquete no cambia la versión');
  assert.match(CONFIG, /versionCode: 22,/, 'ni el versionCode');
  const DIFERENTE = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/comida-diferente.tsx'), 'utf8');
  const elegir = DIFERENTE.slice(DIFERENTE.indexOf('async function elegir('), DIFERENTE.indexOf('const quitarFoto'));
  assert.ok(elegir.indexOf('requestCameraPermissionsAsync') < elegir.indexOf('launchCameraAsync'), 'el permiso se pide al usarla');
  assert.match(elegir, /if \(r\.canceled\) return;/, 'cancelar no cambia el borrador');
  assert.match(DIFERENTE, /getPendingResultAsync/, 'si Android cierra la app con la cámara abierta, la foto se recupera');
  // Un doble toque en «Guardar» no sube la foto dos veces (el registro, además, lo deduplica el comando único).
  assert.match(DIFERENTE, /if \(guardando\.current \|\| estaOcupado\(estado\)\) return;/);
  // La subida va por la intención (API-MED-01) y la ruta firmada (API-MED-02), con los bytes del archivo, y después el
  // registro (API-ING-02) con el comando único.
  const subir = DIFERENTE.slice(DIFERENTE.indexOf('async function subirLaFoto('), DIFERENTE.indexOf('async function guardar('));
  assert.ok(subir.indexOf('leerLaFoto(') < subir.indexOf('api.crearIntencionDeSubida(') && subir.indexOf('api.crearIntencionDeSubida(') < subir.indexOf('api.subirMedio('));
  assert.match(subir, /purpose: 'MEAL_EVIDENCE'/);
  // Los bytes con su tipo real, nunca un Blob (defecto de la 0.15.0-candidata.1: expo/fetch pisaba el Content-Type).
  assert.match(subir, /contentType: leida\.tipo, byteSize: leida\.bytes\.byteLength/);
  assert.match(subir, /api\.subirMedio\(ruta\.uploadPath, leida\.bytes, leida\.tipo\)/);
  assert.doesNotMatch(DIFERENTE, /\.blob\(\)/);
  // El tipo por los bytes cuenta con que el selector vuelva a codificar la imagen: la calidad tiene que ser menor que 1.
  const calidad = Number(/quality: ([\d.]+)/.exec(DIFERENTE)?.[1]);
  assert.ok(calidad > 0 && calidad < 1, `quality ${calidad}`);
  assert.match(DIFERENTE, /await registrarComida\(token, `\$\{intentoDeLaComida\(token, fecha, comidaId\)\}\|diferente`, cuerpo\)/);
});

test('7 · los textos de las pantallas nuevas no tienen términos prohibidos de nutrición, ni porcentajes', async () => {
  const ts = require('typescript');
  const ARCHIVOS = [
    'apps/mobile/src/pantallas/nutricion.tsx',
    'apps/mobile/src/pantallas/nutricion-hoy.tsx',
    'apps/mobile/src/pantallas/opcion-de-comida.tsx',
    'apps/mobile/src/pantallas/comida-diferente.tsx',
    'apps/mobile/src/piezas-de-nutricion.tsx',
    'apps/mobile/src/imagen-de-medio.tsx',
    'apps/mobile/src/registro-de-comidas.tsx',
    'apps/mobile/src/franja-de-macros.ts',
    'apps/mobile/src/carrusel-de-opciones.ts',
    'apps/mobile/src/consumo-de-la-opcion.ts',
    'apps/mobile/src/borrador-de-comida-diferente.ts',
    'apps/mobile/src/comidas-de-hoy.ts',
  ];
  const hallazgos = [];
  let revisados = 0;
  for (const archivo of ARCHIVOS) {
    const contenido = readFileSync(resolve(RAIZ, archivo), 'utf8');
    const fuente = ts.createSourceFile(archivo, contenido, ts.ScriptTarget.Latest, true, archivo.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
    const visitar = (n) => {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isJsxText(n)) {
        const texto = n.text.trim();
        if (texto && !ts.isImportDeclaration(n.parent)) {
          revisados++;
          for (const p of d.terminosProhibidosEn(texto)) hallazgos.push(`${archivo}: «${p}» en ${JSON.stringify(texto)}`);
        }
      }
      ts.forEachChild(n, visitar);
    };
    visitar(fuente);
  }
  assert.ok(revisados > 100, `se revisaron ${revisados} textos`);
  assert.deepEqual(hallazgos, []);
  // Y el copy del registro, entero, tampoco.
  const todos = JSON.stringify(Object.values(C).map((v) => (typeof v === 'function' ? v('Almuerzo', 2) : v)));
  assert.deepEqual(d.terminosProhibidosEn(todos), []);
});
