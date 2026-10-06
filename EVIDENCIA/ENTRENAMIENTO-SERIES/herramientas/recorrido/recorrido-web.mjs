// Recorrido web de WP-ENTRENAMIENTO-SERIES, con el profesional sintético, contra la web estática (CSP real) y la API local.
// 1. «Mis ejercicios»: crea los tres ejercicios del paquete de Dirección y carga la imagen de cada uno por el flujo real:
//    archivo → vista previa → procedencia, autoría, texto alternativo, licencia sin externa con sus términos y revisión
//    pendiente → «Guardar imagen». La imagen guardada vuelve de la API (recodificada) y se ve bajo la CSP real.
// 2. Plan: crea el plan y arma «Piernas A» con los tres ejercicios y los objetivos de sesion_demo.json. Lo común va en la
//    prescripción y lo distinto en cada serie. «Así lo ve tu asesorado» tiene que decir exactamente lo del paquete; se
//    guarda, se valida y se activa.
// 3. Plan activo: «Lo que recibe tu asesorado» dice lo mismo, ya leído de API-SER-01.
// Uso: node recorrido-web.mjs [--solo-plan-activo]   (lee estado.json; escribe recorrido-web.json y capturas-web/)
// Con --solo-plan-activo repite solo el paso 3, que es de lectura: no crea nada.
import { REPO, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const dominio = require(`${REPO}/packages/domain/dist/index.js`);

const PAQUETE = `${REPO}/docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06`;
const demo = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/sesion_demo.json`, 'utf8'));
const catalogo = JSON.parse(fs.readFileSync(`${PAQUETE}/ejercicios/CATALOGO.json`, 'utf8')).assets;
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const WEB = 'http://localhost:3000';
const CRED = 'clave-sintetica-de-prueba-01';
const AUTORIA = 'Generada por IA para BE (image_gen integrado)';
const dir = enTrabajo('capturas-web/');
fs.mkdirSync(dir, { recursive: true });
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 600) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 220)}` : ''}`);
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

/** Del texto del paquete al valor del contrato: no se adivina, cada texto tiene su valor. */
const BASE_DE_CARGA = { 'Única mancuerna': 'SINGLE_IMPLEMENT', 'Por mancuerna; dos mancuernas': 'PER_IMPLEMENT', 'Carga externa total': 'TOTAL_EXTERNAL' };
const BASE_DE_REPETICIONES = { 'Por serie': 'PER_SET', 'Por pierna, no duplicar automáticamente': 'PER_SIDE' };
const reps = (r) => (r.min === r.max ? String(r.min) : `${r.min}-${r.max}`);
const numeroEnCampo = (n) => String(n).replace('.', ',');

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--lang=es-AR'],
  defaultViewport: { width: 1280, height: 900 },
});
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
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
const hayBoton = (t) => page.evaluate((x) => [...document.querySelectorAll('button')].some((b) => b.textContent.replace(/\s+/g, ' ').trim() === x), t);
/** Escribe en un campo controlado de React: borra y tipea. */
async function escribir(sel, valor) {
  await page.waitForSelector(sel, { timeout: 30000 });
  await page.$eval(sel, (el) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  if (valor !== '') await page.type(sel, String(valor));
}
async function elegir(sel, valor) {
  await page.waitForSelector(sel, { timeout: 30000 });
  await page.$eval(
    sel,
    (el, v) => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    valor,
  );
}
/** Marca la casilla «Sin objetivo en esta serie» del campo con ese id. */
const sinObjetivo = (id) => page.$eval(`#${id}`, (el) => el.closest('.campo').querySelector('input[type="checkbox"]').click());
async function entrar(destino) {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(destino)}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await escribir('#correo', estado.proCorreo);
  await escribir('#contrasena', CRED);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 60000 });
}
const ir = (ruta) => page.evaluate((u) => window.next.router.push(u), ruta);

const SOLO_PLAN_ACTIVO = process.argv.includes('--solo-plan-activo');
const resultado = { ejercicios: {} };
try {
  if (SOLO_PLAN_ACTIVO) {
    await entrar('/pro/exercises');
    await esperarTexto('Tus ejercicios');
    await ir(`/pro/advisees/training?id=${estado.aseId}&vista=plan`);
  }
  // ─── 1. Los tres ejercicios, con su imagen ─────────────────────────────────────────────────
  if (!SOLO_PLAN_ACTIVO) {
  await entrar('/pro/exercises');
  await esperarTexto('Tus ejercicios');
  await capturar('01-mis-ejercicios-vacio');
  for (const [n, ej] of catalogo.entries()) {
    await escribir('#ejercicio-nuevo', ej.name);
    await clic('Crear ejercicio');
    await esperarTexto('Ejercicio creado.');
    await page.waitForFunction((nombre) => [...document.querySelectorAll('.lista__titulo')].some((p) => p.textContent.trim() === nombre), { timeout: 30000 }, ej.name);
    // La tarjeta de ese ejercicio, por su nombre: la imagen se asocia por identidad, la búsqueda acá es solo de la prueba.
    const tarjeta = await page.evaluateHandle((nombre) => [...document.querySelectorAll('li.lista__item')].find((li) => li.querySelector('.lista__titulo')?.textContent.trim() === nombre), ej.name);
    const archivo = await tarjeta.$('input[type="file"]');
    await archivo.uploadFile(`${PAQUETE}/${ej.image}`);
    await page.waitForFunction((nombre) => [...document.querySelectorAll('li.lista__item')].find((li) => li.querySelector('.lista__titulo')?.textContent.trim() === nombre)?.querySelector('.vista-previa img'), { timeout: 30000 }, ej.name);
    const id = await tarjeta.evaluate((li) => li.querySelector('select[id$="-procedencia"]').id.replace(/-procedencia$/, ''));
    await elegir(`[id="${id}-procedencia"]`, 'AI_GENERATED');
    await escribir(`[id="${id}-autoria"]`, AUTORIA);
    await escribir(`[id="${id}-alternativo"]`, ej.alt);
    await tarjeta.evaluate((li) => li.querySelector('input[type="radio"][value="NO_EXTERNAL_LICENSE"]').click());
    await escribir(`[id="${id}-terminos"]`, `${ej.usage}. ${ej.role}.`);
    if (n === 0) await capturar('02-imagen-vista-previa', `li.lista__item:nth-child(${n + 1})`);
    await tarjeta.evaluate((li) => [...li.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Guardar imagen').click());
    await esperarTexto('Imagen guardada.', 90000);
    await page.waitForFunction((nombre) => [...document.querySelectorAll('li.lista__item')].find((li) => li.querySelector('.lista__titulo')?.textContent.trim() === nombre)?.querySelector('figure img')?.src.startsWith('data:image/jpeg'), { timeout: 60000 }, ej.name);
    const leyenda = await tarjeta.evaluate((li) => li.querySelector('figure figcaption').innerText);
    control(
      `${ej.name}: la imagen quedó guardada en JPEG y dice procedencia IA, autoría, sin licencia externa y revisión pendiente`,
      leyenda.includes('Generada por IA') && leyenda.includes(AUTORIA) && leyenda.includes('Sin licencia externa') && leyenda.includes('Pendiente de revisión profesional'),
      leyenda,
    );
    const alt = await tarjeta.evaluate((li) => li.querySelector('figure img').alt);
    control(`${ej.name}: el texto alternativo es el declarado`, alt === ej.alt, alt);
  }
  await capturar('03-mis-ejercicios-con-imagenes');

  // Reemplazar y retirar, por el flujo real, sobre el primer ejercicio; al final vuelve a tener su imagen.
  const primero = catalogo[0];
  const tarjetaDe = (nombre) => page.evaluateHandle((n) => [...document.querySelectorAll('li.lista__item')].find((li) => li.querySelector('.lista__titulo')?.textContent.trim() === n), nombre);
  const medioDe = (nombre) => page.evaluate((n) => [...document.querySelectorAll('li.lista__item')].find((li) => li.querySelector('.lista__titulo')?.textContent.trim() === n)?.querySelector('figure img')?.src ?? null, nombre);
  async function cargarImagen(ej) {
    const tarjeta = await tarjetaDe(ej.name);
    await (await tarjeta.$('input[type="file"]')).uploadFile(`${PAQUETE}/${ej.image}`);
    await page.waitForFunction((n) => [...document.querySelectorAll('li.lista__item')].find((li) => li.querySelector('.lista__titulo')?.textContent.trim() === n)?.querySelector('.vista-previa img'), { timeout: 30000 }, ej.name);
    const id = await tarjeta.evaluate((li) => li.querySelector('select[id$="-procedencia"]').id.replace(/-procedencia$/, ''));
    await elegir(`[id="${id}-procedencia"]`, 'AI_GENERATED');
    await escribir(`[id="${id}-autoria"]`, AUTORIA);
    await escribir(`[id="${id}-alternativo"]`, ej.alt);
    await tarjeta.evaluate((li) => li.querySelector('input[type="radio"][value="NO_EXTERNAL_LICENSE"]').click());
    await escribir(`[id="${id}-terminos"]`, `${ej.usage}. ${ej.role}.`);
    await tarjeta.evaluate((li) => [...li.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Guardar imagen').click());
    await esperarTexto('Imagen guardada.', 90000);
  }
  const antes = await medioDe(primero.name);
  await cargarImagen(primero);
  await page.waitForFunction((n, a) => {
    const src = [...document.querySelectorAll('li.lista__item')].find((li) => li.querySelector('.lista__titulo')?.textContent.trim() === n)?.querySelector('figure img')?.src;
    return src && src.startsWith('data:image/jpeg') && src !== a;
  }, { timeout: 60000 }, primero.name, antes).catch(() => {});
  // El archivo es el mismo y BE lo recodifica igual: lo que prueba el reemplazo es que la asociación avanzó sin conflicto.
  control(`${primero.name}: reemplazar la imagen por el flujo real (otra subida y otra asociación) responde «Imagen guardada.»`, true);
  const tarjetaPrimero = await tarjetaDe(primero.name);
  await tarjetaPrimero.evaluate((li) => [...li.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Retirar imagen').click());
  await page.waitForSelector('dialog[open]', { timeout: 30000 });
  await capturar('03b-confirmar-retiro');
  await page.evaluate(() => {
    const dialogo = document.querySelector('dialog[open]');
    const botones = [...dialogo.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Retirar imagen');
    botones[botones.length - 1].click();
  });
  await esperarTexto('Imagen retirada.', 60000);
  const sinImagen = await (await tarjetaDe(primero.name)).evaluate((li) => !li.querySelector('figure') && li.innerText.includes('Sin imagen'));
  control(`${primero.name}: retirar deja el ejercicio sin imagen, sin borrar el medio`, sinImagen);
  await cargarImagen(primero);
  await page.waitForFunction((n) => [...document.querySelectorAll('li.lista__item')].find((li) => li.querySelector('.lista__titulo')?.textContent.trim() === n)?.querySelector('figure img')?.src.startsWith('data:image/jpeg'), { timeout: 60000 }, primero.name);
  control(`${primero.name}: se vuelve a cargar y queda con su imagen para el plan`, true);
  // Recargar: la sesión vuelve a pedirse (DL-012) y las imágenes siguen.
  await page.reload({ waitUntil: 'networkidle0' });
  if (page.url().includes('/login')) await entrar('/pro/exercises');
  await page.waitForFunction(() => document.querySelectorAll('li.lista__item figure img[src^="data:image/jpeg"]').length === 3, { timeout: 90000 });
  control('después de recargar, los tres ejercicios siguen con su imagen', true);

  // ─── 2. El plan: «Piernas A» con los objetivos por serie ──────────────────────────────────
  await ir(`/pro/advisees/training?id=${estado.aseId}&vista=plan`);
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Crear plan'), { timeout: 90000 });
  await clic('Crear plan');
  await page.waitForSelector('#b0-nombre', { timeout: 60000 });
  await clic('Agregar sesión');
  await page.waitForSelector('#b0-s0-nombre', { timeout: 30000 });
  await escribir('#b0-s0-nombre', demo.name);
  for (const [l, ex] of demo.exercises.entries()) {
    const ej = catalogo.find((c) => c.fixtureKey === ex.catalogFixtureKey);
    await clic('Agregar ejercicio');
    await escribir('#b0-s0-buscar-texto', ej.name);
    await clic('Buscar');
    await page.waitForFunction((b) => [...document.querySelectorAll('button')].some((x) => x.textContent.replace(/\s+/g, ' ').trim() === b), { timeout: 30000 }, `Elegir ${ej.name}`);
    await clic(`Elegir ${ej.name}`);
    const p = `b0-s0-p${l}`;
    await page.waitForSelector(`#${p}-criterio`, { timeout: 30000 });
    const primera = ex.sets[0];
    const conRir = ex.sets.some((s) => s.plannedRir !== null);
    // Lo común, en la prescripción: el criterio, la carga y el descanso de la primera serie, y las bases.
    if (conRir) {
      await elegir(`#${p}-criterio`, 'RIR');
      await escribir(`#${p}-objetivo`, numeroEnCampo(primera.plannedRir));
    }
    await escribir(`#${p}-carga`, numeroEnCampo(primera.suggestedLoad.value));
    await elegir(`#${p}-unidad`, primera.suggestedLoad.unit);
    await elegir(`#${p}-base-carga`, BASE_DE_CARGA[ex.loadBasis]);
    await elegir(`#${p}-base-reps`, BASE_DE_REPETICIONES[ex.repetitionBasis]);
    await escribir(`#${p}-descanso`, String(primera.recommendedRestSeconds));
    // Las series: la primera ya existe; las demás se agregan.
    for (let i = 1; i < ex.sets.length; i++) {
      await page.evaluate((pre) => {
        const li = document.getElementById(`${pre}-criterio`).closest('li');
        [...li.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Agregar serie').click();
      }, p);
      await page.waitForSelector(`#${p}-serie-${i}`, { timeout: 30000 });
    }
    // Lo distinto, en cada serie: solo lo que cambia respecto de la prescripción; un descanso null se quita.
    for (const [i, s] of ex.sets.entries()) {
      await escribir(`#${p}-serie-${i}`, reps(s.plannedRepetitions));
      if (s.suggestedLoad.value !== primera.suggestedLoad.value) await escribir(`#${p}-serie-${i}-carga`, numeroEnCampo(s.suggestedLoad.value));
      if (conRir && s.plannedRir !== primera.plannedRir) await escribir(`#${p}-serie-${i}-rir`, numeroEnCampo(s.plannedRir));
      if (s.recommendedRestSeconds === null) await sinObjetivo(`${p}-serie-${i}-descanso`);
      else if (s.recommendedRestSeconds !== primera.recommendedRestSeconds) await escribir(`#${p}-serie-${i}-descanso`, String(s.recommendedRestSeconds));
    }
    await pausa(200);
    // «Así lo ve tu asesorado»: lo que resuelve la tabla tiene que ser lo del paquete, serie por serie.
    const filas = await page.evaluate((pre) => {
      const li = document.getElementById(`${pre}-criterio`).closest('li');
      return [...li.querySelectorAll('table.tabla--objetivos tbody tr')].map((tr) => [...tr.querySelectorAll('th, td')].map((c) => c.innerText.replace(/\s+/g, ' ').replace(/ · de la prescripción/, '').trim()));
    }, p);
    const esperadas = ex.sets.map((s) => {
      const fila = [String(s.setIndex), dominio.textoDeCarga(s.suggestedLoad), dominio.textoDeRepeticiones(s.plannedRepetitions)];
      if (conRir) fila.push(dominio.textoDeRir(s.plannedRir) ?? 'Sin objetivo');
      fila.push(dominio.textoDeSegundos(s.recommendedRestSeconds) ?? 'Sin objetivo');
      return fila;
    });
    control(`${ej.name}: «Así lo ve tu asesorado» coincide con sesion_demo.json serie por serie`, JSON.stringify(filas) === JSON.stringify(esperadas), `${JSON.stringify(filas)} | esperado ${JSON.stringify(esperadas)}`);
  }
  await capturar('04-editor-piernas-a');
  await capturar('05-asi-lo-ve-sentadilla', 'li.fila-de-item table.tabla--objetivos');
  // Una segunda sesión, corta, para probar en la APK la recuperación después de que se cierra la app (T06): no es parte
  // de la demostración de «Piernas A», y sus tiempos quedan estimados e incompletos a propósito.
  const recuperacion = catalogo.find((c) => c.fixtureKey === demo.exercises[2].catalogFixtureKey);
  await clic('Agregar sesión');
  await page.waitForSelector('#b0-s1-nombre', { timeout: 30000 });
  await escribir('#b0-s1-nombre', 'Recuperación de prueba');
  await clic('Agregar ejercicio', 1);
  await escribir('#b0-s1-buscar-texto', recuperacion.name);
  await clic('Buscar');
  await page.waitForFunction((b) => [...document.querySelectorAll('button')].some((x) => x.textContent.replace(/\s+/g, ' ').trim() === b), { timeout: 30000 }, `Elegir ${recuperacion.name}`);
  await clic(`Elegir ${recuperacion.name}`);
  await page.waitForSelector('#b0-s1-p0-serie-0', { timeout: 30000 });
  await escribir('#b0-s1-p0-serie-0', '10-12');
  await escribir('#b0-s1-p0-descanso', '90');
  await clic('Guardar borrador');
  await esperarTexto('Guardado.', 60000);
  // Después de guardar, el editor se vuelve a leer con API-SER-01: el tri-estado tiene que volver igual.
  await pausa(500);
  const releido = await page.evaluate(() => [...document.querySelectorAll('table.tabla--objetivos tbody tr')].map((tr) => tr.innerText.replace(/\s+/g, ' ').trim()));
  control('después de guardar, el editor releído (API-SER-01) muestra las 9 series de «Piernas A» y la de la sesión de prueba', releido.length === 10, releido.join(' | '));
  const aviso = await texto('body');
  control('el editor avisa que la APK 0.13.2 muestra solo los valores generales', aviso.includes('La APK 0.13.2 muestra solo los valores generales'));
  await clic('Validar plan');
  await esperarTexto(dominio.COPY_ENTRENAMIENTO.sinProblemas, 60000);
  control('validar: el borrador no tiene problemas de estructura', true);
  await clic('Activar plan');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Activar esta versión'), { timeout: 30000 });
  await clic('Activar esta versión');
  await esperarTexto('Plan activado', 90000);

  }
  // ─── 3. El plan activo, leído de API-SER-01 ──────────────────────────────────────────────
  await page.waitForFunction(() => document.body.innerText.includes('Lo que recibe tu asesorado'), { timeout: 90000 });
  const activas = await page.evaluate(() =>
    [...document.querySelectorAll('table.tabla--objetivos')].map((t) => [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('th, td')].map((c) => c.innerText.replace(/\s+/g, ' ').replace(/ · de la prescripción/, '').trim()))),
  );
  const esperadasTodas = demo.exercises.map((ex) => {
    const conRir = ex.sets.some((s) => s.plannedRir !== null);
    return ex.sets.map((s) => [String(s.setIndex), dominio.textoDeCarga(s.suggestedLoad), dominio.textoDeRepeticiones(s.plannedRepetitions), ...(conRir ? [dominio.textoDeRir(s.plannedRir) ?? 'Sin objetivo'] : []), dominio.textoDeSegundos(s.recommendedRestSeconds) ?? 'Sin objetivo']);
  });
  control('el plan activo dice lo mismo que el paquete para las 9 series de «Piernas A» (lo que recibe el teléfono)', JSON.stringify(activas.slice(0, 3)) === JSON.stringify(esperadasTodas), JSON.stringify(activas));
  control('la sesión de prueba hereda el descanso de su prescripción', JSON.stringify(activas[3]) === JSON.stringify([['1', 'Sin objetivo', '10–12 rep.', '01:30']]), JSON.stringify(activas[3]));
  // Las imágenes llegan aparte (acceso firmado y descarga): se espera a que estén, con un tope.
  await page.waitForFunction(() => document.querySelectorAll('img.imagen-de-ejercicio[src^="data:image/jpeg"]').length >= 4, { timeout: 60000 }).catch(() => {});
  const conImagen = await page.$$eval('img.imagen-de-ejercicio', (is) => is.filter((i) => i.src.startsWith('data:image/jpeg')).length);
  control('el plan activo muestra la imagen de cada ejercicio (tres en «Piernas A» y uno en la sesión de prueba)', conImagen === 4, conImagen);
  await capturar('06-plan-activo');
  resultado.planActivo = true;
} catch (e) {
  control('el recorrido terminó sin errores', false, e.stack ?? String(e));
  await capturar('error').catch(() => {});
} finally {
  control('sin errores de página ni de CSP', errores.filter((e) => !/favicon/.test(e)).length === 0, errores.join(' | '));
  fs.writeFileSync(enTrabajo('recorrido-web.json'), JSON.stringify({ ...resultado, controles }, null, 2));
  await browser.close();
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles`);
  process.exit(fallas ? 1 : 0);
}
