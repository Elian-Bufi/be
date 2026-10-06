// Recorrido web de WP-NUTRICION-RECETAS, con la profesional sintética, contra la web estática (CSP real) y la API local.
// 1. Crea las tres recetas del paquete de Dirección desde la web: ingredientes USDA por búsqueda, gramos, estado, pasos.
//    Compara el cálculo que muestra la pantalla con el del paquete (redondeado solo al mostrar).
// 2. Carga la foto de cada una por el flujo real (archivo → vista previa → procedencia → «Cargar imagen»).
// 3. Edición: arroz 160 → 200 g y pollo sin los 8 g de aceite (recálculo en vivo), y una versión nueva guardada.
// 4. Recarga la página: hay que volver a entrar (DL-012) y la foto sigue.
// 5. Plan: borrador, Almuerzo con las tres recetas, Merienda con una opción manual sin imagen, Cena con una receta; activar.
// Uso: node recorrido-web.mjs [--movil]   (lee estado.json; escribe recorrido-web.json y capturas-web[-movil]/)
import { REPO, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const dominio = require(`${REPO}/packages/domain/dist/index.js`);

const PAQUETE = `${REPO}/docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05`;
const alimentos = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/alimentos_usda_100g.json`, 'utf8')).foods;
const recetas = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/recetas_demo.json`, 'utf8')).recipes;
const casos = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/casos_calculo.json`, 'utf8')).numeric_cases;
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const MOVIL = process.argv.includes('--movil');
const DESDE = (process.argv.find((a) => a.startsWith('--desde=')) ?? '--desde=inicio').slice('--desde='.length);
const PREVIO = DESDE !== 'inicio' ? JSON.parse(fs.readFileSync(enTrabajo('recorrido-web.json'), 'utf8')) : null;
const WEB = 'http://localhost:3000';
const CRED = 'clave-sintetica-de-prueba-01';
const AUTORIA = 'Generada por IA para la demostración de BE (paquete de Dirección del 2026-10-05)';
const dir = new URL(`./capturas-web${MOVIL ? '-movil' : ''}/`, import.meta.url);
fs.mkdirSync(dir, { recursive: true });
const controles = PREVIO ? PREVIO.controles.filter((c) => c.ok) : [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 500) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 200)}` : ''}`);
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
/** El estado de preparación de BE para cada alimento del paquete: el aceite se pesa tal como se adquiere. */
const ESTADO_DE = (id) => (id === 'aceite_oliva' ? 'AS_PURCHASED' : 'COOKED');
const ETIQUETAS = ['Calorías', 'Carbohidratos', 'Grasas', 'Proteínas', 'Fibra'];
const CLAVES = ['energy_kcal', 'carbohydrate_g', 'fat_g', 'protein_g', 'fiber_g'];
const NUTRIENTE = { energy_kcal: 'energyKcal', carbohydrate_g: 'carbohydrateG', fat_g: 'fatG', protein_g: 'proteinG', fiber_g: 'fiberG' };
/** Lo que la pantalla tiene que mostrar para un valor exacto del paquete: el mismo formateador del dominio. */
const esperado = (exactos) => CLAVES.map((c) => `${dominio.nutrienteParaMostrar({ value: exactos[c] }, NUTRIENTE[c])} ${c === 'energy_kcal' ? 'kcal' : 'g'}`);

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--lang=es-AR'],
  defaultViewport: MOVIL ? { width: 390, height: 844 } : { width: 1280, height: 900 },
});
const page = await browser.newPage();
if (MOVIL) await page.emulate({ viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile' });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
const csp = [];
page.on('console', (m) => /Content Security Policy/i.test(m.text()) && csp.push(m.text()));
const capturar = async (nombre, sel = null) => {
  const ruta = fileURLToPath(new URL(`${nombre}.png`, dir));
  if (sel && (await page.$(sel))) return (await page.$(sel)).screenshot({ path: ruta });
  return page.screenshot({ path: ruta, fullPage: true });
};
const texto = (sel = 'body') => page.evaluate((s) => document.querySelector(s)?.innerText ?? '', sel);
const esperarTexto = (t, ms = 60000) => page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t);
const clic = (textoBoton, indice = 0, raiz = 'body') =>
  page.evaluate(
    (t, n, r) => {
      const bs = [...document.querySelector(r).querySelectorAll('button, a')].filter((x) => x.textContent.replace(/\s+/g, ' ').trim() === t);
      if (!bs[n]) throw new Error(`sin botón «${t}» (${n})`);
      bs[n].click();
    },
    textoBoton,
    indice,
    raiz,
  );
/** Escribe en un campo controlado de React: borra y tipea. */
async function escribir(sel, valor) {
  await page.waitForSelector(sel, { timeout: 30000 });
  await page.$eval(sel, (el) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  if (valor) await page.type(sel, valor);
}
async function elegir(sel, valor) {
  await page.$eval(
    sel,
    (el, v) => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    valor,
  );
}
async function entrar(destino) {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(destino)}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await escribir('#correo', estado.proCorreo);
  await escribir('#contrasena', CRED);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 60000 });
}
const ir = (ruta) => page.evaluate((u) => window.next.router.push(u), ruta);
/** Las filas del cálculo: nutriente → [receta completa, por porción]. */
async function leerCalculo() {
  await page.waitForFunction(() => document.querySelector('table.tabla--calculo') && !document.body.innerText.includes('Calculando…'), { timeout: 60000 });
  await pausa(300);
  return page.$$eval('table.tabla--calculo tbody tr', (filas) => filas.map((f) => [f.querySelector('th').textContent.trim(), ...[...f.querySelectorAll('td')].map((td) => td.textContent.replace(/\s+/g, ' ').trim())]));
}
const columna = (filas, i) => ETIQUETAS.map((e) => filas.find((f) => f[0] === e)?.[i] ?? '(falta)');
const nombreDe = (id) => alimentos.find((a) => a.id === id).name_es;
/** Lo que se busca en el catálogo: las dos primeras palabras del nombre. */
const busqueda = (id) => nombreDe(id).split(/[ ,]+/).slice(0, 2).join(' ');

async function agregarIngrediente(id, gramos) {
  await escribir('#receta-buscar-texto', busqueda(id));
  await clic('Buscar');
  const boton = `Agregar ingrediente: ${nombreDe(id)}`;
  await page.waitForFunction((b) => [...document.querySelectorAll('button')].some((x) => x.textContent.replace(/\s+/g, ' ').trim() === b), { timeout: 30000 }, boton);
  await clic(boton);
  await pausa(200);
  const n = await page.$$eval('ol.ingredientes-de-receta > li', (l) => l.length);
  const fila = `ol.ingredientes-de-receta > li:nth-child(${n})`;
  await escribir(`${fila} input[inputmode="decimal"]`, String(gramos).replace('.', ','));
  await elegir(`${fila} select[id$="-estado"]`, ESTADO_DE(id));
}

const resultado = { recetas: PREVIO?.recetas ?? {} };
try {
  await entrar('/pro/recipes');
  await esperarTexto('Nueva receta');
  if (DESDE === 'inicio') await capturar('00-mis-recetas-vacia');

  // ─── 1 y 2. Las tres recetas, con su foto ───────────────────────────────────────────────────
  for (const [n, receta] of DESDE === 'inicio' ? recetas.entries() : []) {
    await ir('/pro/recipes?nueva=1');
    await page.waitForSelector('#receta-nombre', { timeout: 60000 });
    await escribir('#receta-nombre', receta.name);
    await escribir('#receta-descripcion', receta.description);
    await escribir('#receta-porciones', receta.servings);
    for (const item of receta.items) await agregarIngrediente(item.food_id, item.quantity_g);
    for (const [k, paso] of receta.preparation.entries()) {
      await clic('Agregar paso');
      await escribir(`#receta-paso-${k}`, paso);
    }
    const filas = await leerCalculo();
    const base = casos.find((c) => c.recipe_id === receta.id && c.factor === '1' && Object.keys(c.quantity_overrides_g).length === 0);
    control(`${receta.name}: el cálculo en vivo (API-REC-07) coincide con el paquete, receta completa`, JSON.stringify(columna(filas, 1)) === JSON.stringify(esperado(base.expected)), `${columna(filas, 1).join(' · ')} | esperado ${esperado(base.expected).join(' · ')}`);
    control(`${receta.name}: por porción (${receta.servings} porción) igual al total`, JSON.stringify(columna(filas, 2)) === JSON.stringify(esperado(base.expected)), columna(filas, 2).join(' · '));
    await capturar(`0${n + 1}a-receta-${n + 1}-antes-de-guardar`);
    await clic('Guardar receta');
    await page.waitForFunction(() => new URLSearchParams(location.search).get('receta'), { timeout: 60000 });
    await esperarTexto('Receta guardada.');
    const recipeId = await page.evaluate(() => new URLSearchParams(location.search).get('receta'));
    resultado.recetas[receta.id] = { recipeId };
    await page.waitForSelector('input[type="file"]', { timeout: 60000 });
    // La foto, por el flujo real.
    const archivo = await page.$('input[type="file"]');
    await archivo.uploadFile(`${PAQUETE}/${receta.image}`);
    await page.waitForSelector('.vista-previa img', { timeout: 30000 });
    await elegir('select[id$="-procedencia"]', 'AI_GENERATED');
    await escribir('input[id$="-autoria"]', AUTORIA);
    await capturar(`0${n + 1}b-receta-${n + 1}-vista-previa`, '.vista-previa');
    await clic('Cargar imagen');
    await esperarTexto('Imagen cargada.', 90000);
    await page.waitForFunction(() => document.querySelector('figure.figura-de-receta img')?.src.startsWith('data:image/jpeg'), { timeout: 60000 });
    const leyenda = await texto('figure.figura-de-receta figcaption');
    control(`${receta.name}: la foto se cargó, BE la guardó en JPEG y se ve como «Imagen de referencia · Generada por IA»`, leyenda.includes('Imagen de referencia') && leyenda.includes('Generada por IA') && leyenda.includes(AUTORIA), leyenda);
    await capturar(`0${n + 1}c-receta-${n + 1}-guardada-con-foto`);
  }

  // ─── 3. Edición: recálculo en vivo y una versión nueva ────────────────────────────────────────
  const pollo = recetas[0];
  const abrirReceta = async (receta) => {
    await ir(`/pro/recipes?receta=${resultado.recetas[receta.id].recipeId}`);
    await page.waitForFunction((nombre, cantidad) => document.querySelector('#receta-nombre')?.value === nombre && document.querySelectorAll('ol.ingredientes-de-receta > li').length === cantidad, { timeout: 60000 }, receta.name, receta.items.length);
  };
  await abrirReceta(pollo);
  const filaDe = async (id) => 1 + (await page.$$eval('ol.ingredientes-de-receta > li legend', (l) => l.map((x) => x.textContent))).findIndex((t) => t.includes(nombreDe(id)));
  const fArroz = await filaDe('arroz_cocido');
  await escribir(`ol.ingredientes-de-receta > li:nth-child(${fArroz}) input[inputmode="decimal"]`, '200');
  let filas = await leerCalculo();
  const caso200 = casos.find((c) => c.recipe_id === pollo.id && c.quantity_overrides_g.arroz_cocido === '200');
  control('edición: arroz 160 → 200 g recalcula en vivo como el caso del paquete', caso200 && JSON.stringify(columna(filas, 1)) === JSON.stringify(esperado(caso200.expected)), `${columna(filas, 1).join(' · ')} | ${caso200 ? esperado(caso200.expected).join(' · ') : 'sin caso'}`);
  await capturar('04a-edicion-arroz-200');
  await escribir(`ol.ingredientes-de-receta > li:nth-child(${fArroz}) input[inputmode="decimal"]`, '160');
  await clic(`Quitar ${nombreDe('aceite_oliva')}`);
  filas = await leerCalculo();
  const casoSinAceite = casos.find((c) => c.recipe_id === pollo.id && c.quantity_overrides_g.aceite_oliva === '0');
  control('edición: el pollo sin los 8 g de aceite recalcula como el caso del paquete', casoSinAceite && JSON.stringify(columna(filas, 1)) === JSON.stringify(esperado(casoSinAceite.expected)), `${columna(filas, 1).join(' · ')} | ${casoSinAceite ? esperado(casoSinAceite.expected).join(' · ') : 'sin caso'}`);
  await capturar('04b-edicion-sin-aceite');
  // Se descarta la prueba y se guarda una edición real, que emite la versión 2 con el mismo cálculo.
  await ir('/pro/recipes');
  await esperarTexto('Nueva receta');
  await abrirReceta(pollo);
  await escribir('#receta-descripcion', `${pollo.description} Cantidades del plato servido.`);
  await clic('Guardar receta');
  await esperarTexto('Se guardó la versión 2', 60000);
  await page.waitForFunction(() => document.body.innerText.includes('Versión 2'), { timeout: 60000 });
  filas = await leerCalculo();
  const basePollo = casos.find((c) => c.recipe_id === pollo.id && c.factor === '1' && Object.keys(c.quantity_overrides_g).length === 0);
  control('la edición guardada es la versión 2, con el historial y el mismo cálculo', (await texto()).includes('Versión 1') && JSON.stringify(columna(filas, 1)) === JSON.stringify(esperado(basePollo.expected)), columna(filas, 1).join(' · '));
  control('la foto sigue en la receta después de la versión nueva (va en la receta, no en la versión)', await page.$eval('figure.figura-de-receta img', (i) => i.src.startsWith('data:image/jpeg')).catch(() => false));
  await capturar('04c-version-2');

  // ─── 4. Recargar: hay que volver a entrar y la foto sigue ─────────────────────────────────────
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => location.pathname.startsWith('/login'), { timeout: 60000 });
  control('recargar la página pide volver a entrar (el token vive en memoria, DL-012)', true);
  await escribir('#correo', estado.proCorreo);
  await escribir('#contrasena', CRED);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/recipes') && new URLSearchParams(location.search).get('receta'), { timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('figure.figura-de-receta img')?.src.startsWith('data:image/jpeg'), { timeout: 60000 });
  control('después de recargar y entrar, la misma receta muestra su foto guardada', true);
  await ir('/pro/recipes');
  await page.waitForFunction(() => document.querySelectorAll('.tarjeta-de-receta img').length === 3, { timeout: 60000 });
  control('«Mis recetas» lista las tres con su foto y la energía por porción', (await texto()).includes('kcal por porción'), (await texto('.lista--recetas')).replace(/\n+/g, ' | ').slice(0, 300));
  await capturar('05-mis-recetas-con-fotos');

  // ─── 5. Plan: Almuerzo con tres recetas, Merienda manual sin imagen, Cena con una receta ──────
  await ir(`/pro/advisees/nutrition?id=${estado.aseId}&vista=plan`);
  await esperarTexto('Crear nuevo plan');
  await clic('Crear nuevo plan');
  await esperarTexto('Versión en preparación');
  const BORRADOR = 'section[aria-labelledby="titulo-borrador"]';
  const comidas = [
    { nombre: 'Almuerzo', recetas: recetas.map((r) => r.name) },
    { nombre: 'Merienda', manual: { etiqueta: 'Brócoli con zanahoria', alimentos: [['brocoli_cocido', '100'], ['zanahoria_cocida', '80']] } },
    { nombre: 'Cena', recetas: [recetas[2].name] },
  ];
  for (const [j, comida] of comidas.entries()) {
    await clic('Agregar comida', 0, BORRADOR);
    await escribir(`#comida-0-${j}`, comida.nombre);
    if (comida.recetas) {
      for (const nombre of comida.recetas) {
        await clic('Agregar receta como opción', j, BORRADOR);
        const boton = `Agregar receta como opción: ${nombre}`;
        await page.waitForFunction((b) => [...document.querySelectorAll('button')].some((x) => x.textContent.replace(/\s+/g, ' ').trim() === b), { timeout: 30000 }, boton);
        await clic(boton);
        await pausa(200);
      }
    } else {
      await clic('Agregar opción', j, BORRADOR);
      await escribir(`#opcion-0-${j}-0`, comida.manual.etiqueta);
      for (const [id, gramos] of comida.manual.alimentos) {
        await clic('Agregar ítem', 0, `${BORRADOR} fieldset.nodo--comida:nth-of-type(${j + 1})`).catch(() => clic('Agregar ítem', j, BORRADOR));
        await escribir(`${BORRADOR} .buscador input`, busqueda(id));
        await clic('Buscar', 0, `${BORRADOR} .buscador`);
        await page.waitForFunction((b) => [...document.querySelectorAll('button')].some((x) => x.textContent.trim() === b), { timeout: 30000 }, `Elegir ${nombreDe(id)}`);
        await clic(`Elegir ${nombreDe(id)}`);
        const items = await page.$$(`${BORRADOR} li.fila-de-item`);
        const ultimo = items[items.length - 1];
        const cantidad = await ultimo.$('input[inputmode="decimal"]');
        await cantidad.type(gramos);
        const estadoSel = await ultimo.$('select[id$="-preparacion"]');
        await estadoSel.select('COOKED');
      }
    }
  }
  await capturar('06a-borrador-con-recetas', BORRADOR);
  await clic('Guardar cambios', 0, BORRADOR);
  await page.waitForFunction((r) => [...document.querySelector(r).querySelectorAll('button')].find((b) => b.textContent.trim() === 'Guardar cambios')?.disabled, { timeout: 60000 }, BORRADOR);
  await pausa(800);
  const tBorrador = await texto(BORRADOR);
  control('el borrador guardado muestra las opciones de receta con los ingredientes de una porción', (tBorrador.match(/Receta «/g) ?? []).length === 4 && !tBorrador.includes('se cargan al guardar'), tBorrador.match(/Receta «[^»]+», versión \d/g)?.join(' | '));
  await capturar('06b-borrador-guardado', BORRADOR);
  await clic('Activar plan', 0, BORRADOR);
  await page.waitForSelector('dialog[open]', { timeout: 10000 });
  await clic('Activar esta versión', 0, 'dialog[open]');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 60000 });
  await esperarTexto('Plan activo');
  await pausa(800);
  const tActivo = await texto();
  control('el plan activado (instantánea) nombra la receta y su versión en cada opción', (tActivo.match(/Receta «/g) ?? []).length >= 4, tActivo.match(/Receta «[^»]+», versión \d/g)?.join(' | '));
  await capturar('06c-plan-activo');
  resultado.errores = errores;
  resultado.csp = csp;
  control('sin errores de página ni de CSP en el navegador', errores.length === 0 && csp.length === 0, [...errores, ...csp].join(' | '));
} catch (e) {
  control('el recorrido terminó sin excepciones', false, e.stack ?? String(e));
  await capturar('zz-fallo').catch(() => {});
} finally {
  resultado.controles = controles;
  fs.writeFileSync(new URL(`./recorrido-web${MOVIL ? '-movil' : ''}.json`, import.meta.url), JSON.stringify(resultado, null, 2));
  await browser.close();
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles OK`);
  process.exit(fallas ? 1 : 0);
}
