// Los recorridos de navegador (bloque 6 del encargo de consolidación, 2026-10-19): Chrome contra el website y la API
// locales, con lo que el profesional hace todos los días. Cada recorrido tiene sus propias cuentas y datos (preparar.mjs)
// y su propio contexto de navegador (cookies y pestañas aparte): no depende de otro ni deja nada que otro use.
// Comprueban comportamiento observable: la dirección, lo que dice la pantalla, lo que guardó el servidor, la cookie, el
// árbol de accesibilidad y, en el gráfico, dónde quedó dibujado cada punto.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';
import { CREDENCIAL, dominio, pedir, sesion as sesionPorApi } from './api.mjs';
import { API, WEB } from './entorno.mjs';

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const ESPERA = 30_000;

// ─── Ayudas ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Espera a que React haya hidratado el elemento (si no, escribir o tocar no hace nada). */
async function hidratado(p, selector) {
  await p.waitForFunction((s) => {
    const e = document.querySelector(s);
    return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps'));
  }, { timeout: 60_000, polling: 100 }, selector);
}

/** El elemento visible que coincide con el selector y, si se pide, contiene el texto. */
async function elemento(p, selector, texto = null, timeout = ESPERA) {
  const h = await p.waitForFunction(
    (s, t) => [...document.querySelectorAll(s)].find((e) => (t === null || e.textContent.includes(t)) && (e.offsetParent !== null || getComputedStyle(e).position === 'fixed')) ?? null,
    { timeout, polling: 100 },
    selector,
    texto,
  );
  return h.asElement();
}

/** Un clic de verdad (el mouse va al centro del elemento), no un `click()` de JavaScript. */
async function clic(p, selector, texto = null) {
  const e = await elemento(p, selector, texto);
  await e.click();
  return e;
}

const ruta = (p) => {
  const u = new URL(p.url());
  return { camino: u.pathname.replace(/\/$/, '') || '/', parametros: u.searchParams };
};

async function esperarCamino(p, camino, timeout = ESPERA) {
  await p.waitForFunction((c) => (location.pathname.replace(/\/$/, '') || '/') === c, { timeout, polling: 100 }, camino);
}

const esperarTexto = (p, texto, timeout = ESPERA) => p.waitForFunction((t) => document.body.innerText.includes(t), { timeout, polling: 100 }, texto);

async function entrar(p, correo) {
  await p.goto(`${WEB}/login`, { waitUntil: 'networkidle2' });
  await hidratado(p, '#correo');
  await p.type('#correo', correo);
  await p.type('#contrasena', CREDENCIAL);
  await clic(p, 'form button[type="submit"]', 'Iniciar sesión');
  // DL-025: el profesional entra directo a su espacio.
  await esperarCamino(p, '/pro');
}

/** Abre la ficha de la persona desde «Tus asesorados». */
async function abrirFicha(p, nombre) {
  await clic(p, 'a.persona__abrir');
  await esperarCamino(p, '/pro/advisees');
  await p.waitForFunction((n) => document.querySelector('#titulo-asesorado')?.textContent?.includes(n), { timeout: ESPERA }, nombre);
}

/** Lo que guarda el navegador para el website (local y de sesión), en un texto. */
const almacenamiento = (p) => p.evaluate(() => JSON.stringify({ local: Object.entries(localStorage), sesion: Object.entries(sessionStorage) }));

const PARECE_UN_TOKEN = /eyJ[\w-]{8,}\.[\w-]{8,}\./;

/**
 * Evidencia visual del código probado (encargo, §8.3): una captura de la ventana tal como está, con el nombre del momento.
 * Sin `fullPage`: esa captura achica la ventana un instante y un gráfico de recharts puede salir sin dibujar.
 */
async function captura(p, salida, nombre) {
  if (!salida) return;
  await pausa(250);
  await p.screenshot({ path: join(salida, `${nombre}.png`) });
}

// ─── Los recorridos ──────────────────────────────────────────────────────────────────────────────────────────────────

/** DL-147: entrar, recargar, otra pestaña y salir; los tokens nunca en el almacenamiento del navegador. */
async function sesion({ contexto, p, d }) {
  const tokens = [];
  const anotar = async (r) => {
    if (r.request().method() !== 'POST' || !/\/api\/v1\/auth\/sessions(\/resume)?$/.test(new URL(r.url()).pathname)) return;
    const cuerpo = await r.json().catch(() => null);
    if (cuerpo?.data?.session?.accessToken) tokens.push(cuerpo.data.session.accessToken);
  };
  p.on('response', anotar);
  await entrar(p, d.pro.correo);
  await elemento(p, 'a.persona__abrir');

  // La cookie de reanudación: HttpOnly, Secure, SameSite=None, particionada y solo para las rutas de sesión.
  const cookies = await contexto.cookies();
  const reanudacion = cookies.find((c) => c.name === '__Secure-be-reanudacion');
  assert.ok(reanudacion, 'después de entrar hay una cookie de reanudación');
  assert.equal(reanudacion.httpOnly, true, 'HttpOnly');
  assert.equal(reanudacion.secure, true, 'Secure');
  assert.equal(reanudacion.sameSite, 'None', 'SameSite=None');
  assert.equal(reanudacion.path, '/api/v1/auth/sessions', 'solo para las rutas de sesión');
  assert.ok(reanudacion.partitionKey, 'particionada (CHIPS)');
  assert.ok(!(await p.evaluate(() => document.cookie)).includes('be-reanudacion'), 'la página no puede leer la cookie');

  // Recargar no saca de la sesión: el espacio profesional sigue, sin pasar por Iniciar sesión.
  await p.reload({ waitUntil: 'networkidle2' });
  await elemento(p, 'a.persona__abrir');
  assert.equal(ruta(p).camino, '/pro', 'la recarga deja en /pro');

  // En la ficha, la recarga conserva la persona y la vista.
  await abrirFicha(p, d.ase.nombre);
  await p.goto(`${p.url()}&vista=linea&p=30`, { waitUntil: 'networkidle2' });
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForFunction((n) => document.querySelector('#titulo-asesorado')?.textContent?.includes(n), { timeout: ESPERA }, d.ase.nombre);
  const despues = ruta(p);
  assert.equal(despues.camino, '/pro/advisees');
  assert.equal(despues.parametros.get('vista'), 'linea');
  assert.equal(despues.parametros.get('p'), '30');

  // Otra pestaña del mismo navegador entra sola (con la cookie, no con un token guardado).
  const p2 = await contexto.newPage();
  p2.on('response', anotar);
  await p2.goto(`${WEB}/pro`, { waitUntil: 'networkidle2' });
  await elemento(p2, 'a.persona__abrir');

  // Nada de lo que da acceso queda en el almacenamiento del navegador, en ninguna de las dos pestañas.
  assert.ok(tokens.length >= 3, `se vieron los tokens de la entrada y de las reanudaciones (${tokens.length})`);
  for (const pagina of [p, p2]) {
    const guardado = await almacenamiento(pagina);
    for (const t of tokens) assert.ok(!guardado.includes(t), 'ningún token en localStorage ni sessionStorage');
    assert.ok(!PARECE_UN_TOKEN.test(guardado), 'nada con forma de token en localStorage ni sessionStorage');
  }

  // Salir en una pestaña cierra la otra y borra la cookie: recargar ya no entra.
  await clic(p2, '.menu-de-cuenta__boton');
  await clic(p2, '.menu-de-cuenta__opcion', 'Cerrar sesión');
  await esperarCamino(p2, '/login');
  await esperarCamino(p, '/login', 15_000);
  assert.ok(!(await contexto.cookies()).some((c) => c.name === '__Secure-be-reanudacion'), 'al salir, la cookie se borra');
  await p.goto(`${WEB}/pro`, { waitUntil: 'networkidle2' });
  await esperarCamino(p, '/login');

  // Un enlace directo a la ficha, sin sesión: pide entrar y después vuelve a la misma persona, con la vista y el período.
  // La otra pestaña ya no hace falta, y esta pasa adelante: el clic espera cuadros, y una pestaña de fondo no los dibuja.
  await p2.close();
  await p.bringToFront();
  await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}&vista=linea&p=30`, { waitUntil: 'networkidle2' });
  await esperarCamino(p, '/login');
  await hidratado(p, '#correo');
  await p.type('#correo', d.pro.correo);
  await p.type('#contrasena', CREDENCIAL);
  await clic(p, 'form button[type="submit"]', 'Iniciar sesión');
  await esperarCamino(p, '/pro/advisees');
  const vuelta = ruta(p).parametros;
  assert.equal(vuelta.get('id'), d.ase.id, 'vuelve a la misma persona');
  assert.equal(vuelta.get('vista'), 'linea', 'con la misma vista');
  assert.equal(vuelta.get('p'), '30', 'y el mismo período');
  await p.waitForFunction((n) => document.querySelector('#titulo-asesorado')?.textContent?.includes(n), { timeout: ESPERA }, d.ase.nombre);
}

/** DL-146 y bloque 5: la pista de «Actualizar» con mouse, teclado, Escape, bordes, zoom, tacto y árbol de accesibilidad. */
async function pistas({ contexto, p, d, salida }) {
  const TEXTO = dominio.COPY_PISTAS.ficha.actualizar;
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  const BOTON = '.ficha__consulta .pista > button';
  const GLOBO = '.ficha__consulta .pista__globo';
  const boton = await elemento(p, BOTON, 'Actualizar');
  const visible = () => p.$eval(GLOBO, (g) => !g.hidden && getComputedStyle(g).visibility !== 'hidden');
  const cajas = () =>
    p.evaluate(
      (b, g) => {
        const r = (e) => e.getBoundingClientRect().toJSON();
        return { boton: r(document.querySelector(b)), globo: r(document.querySelector(g)), ancho: innerWidth, alto: innerHeight };
      },
      BOTON,
      GLOBO,
    );
  const dentroYSinTapar = async (que) => {
    const c = await cajas();
    assert.ok(c.globo.left >= 7.5 && c.globo.right <= c.ancho - 7.5, `${que}: la pista no sale por los costados (${c.globo.left}–${c.globo.right} de ${c.ancho})`);
    assert.ok(c.globo.top >= 0 && c.globo.bottom <= c.alto, `${que}: la pista no sale por arriba ni por abajo`);
    const tapa = c.globo.left < c.boton.right && c.globo.right > c.boton.left && c.globo.top < c.boton.bottom && c.globo.bottom > c.boton.top;
    assert.ok(!tapa, `${que}: la pista no tapa el control`);
  };

  // El árbol de accesibilidad: el botón se llama «Actualizar» y la pista es su descripción, aunque no esté a la vista.
  const nodo = await p.accessibility.snapshot({ root: boton, interestingOnly: false });
  assert.equal(nodo?.name, 'Actualizar');
  assert.equal(nodo?.description, TEXTO, 'la pista llega como descripción del control');

  // Mouse: aparece después de una pausa corta, se puede pasar por encima sin que se cierre y Escape la cierra.
  await boton.hover();
  await pausa(700);
  assert.ok(await visible(), 'con el mouse encima, la pista aparece');
  assert.equal((await p.$eval(GLOBO, (g) => g.textContent)).trim(), TEXTO);
  await dentroYSinTapar('mouse');
  await captura(p, salida, 'ficha-encabezado-con-pista-1440');
  const c = await cajas();
  await p.mouse.move(c.globo.left + c.globo.width / 2, c.globo.top + c.globo.height / 2, { steps: 4 });
  await pausa(400);
  assert.ok(await visible(), 'se puede pasar el mouse por encima de la pista (WCAG 1.4.13)');
  await p.keyboard.press('Escape');
  await pausa(150);
  assert.ok(!(await visible()), 'Escape la cierra');
  await p.mouse.move(5, 5);
  await pausa(300);

  // Teclado: al llegar con Tab aparece enseguida, el foco se ve y Escape la cierra sin mover el foco.
  await p.focus('.marco-de-la-ficha .menu-de-acciones__boton');
  await p.keyboard.press('Tab');
  assert.ok(await p.$eval(BOTON, (b) => b === document.activeElement && b.matches(':focus-visible')), 'Tab llega a «Actualizar»');
  await pausa(100);
  assert.ok(await visible(), 'con el teclado, la pista aparece');
  await dentroYSinTapar('teclado');
  const foco = await p.$eval(BOTON, (b) => {
    const s = getComputedStyle(b);
    return { contorno: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, sombra: s.boxShadow !== 'none' };
  });
  assert.ok(foco.contorno || foco.sombra, 'el foco se ve');
  await p.keyboard.press('Escape');
  await pausa(150);
  assert.ok(!(await visible()), 'Escape la cierra');
  assert.ok(await p.$eval(BOTON, (b) => b === document.activeElement), 'el foco sigue en «Actualizar»');

  // Tablet con teclado (1024 × 768): «Más» se abre con Enter, sus acciones se recorren con Tab y Escape lo cierra y
  // devuelve el foco al botón.
  await p.setViewport({ width: 1024, height: 768 });
  await pausa(400);
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'en tablet no hay desplazamiento horizontal');
  // La barra superior, en un renglón: la marca y «Cuenta» a la misma altura (a 1.024 px, «Cuenta» bajaba a otro renglón).
  const barra = await p.evaluate(() => ({ marca: document.querySelector('.encabezado__marca').getBoundingClientRect().top, cuenta: document.querySelector('.encabezado .menu-de-cuenta').getBoundingClientRect().top }));
  assert.ok(Math.abs(barra.marca - barra.cuenta) < 12, `la barra superior entra en un renglón a 1.024 px (${barra.marca} y ${barra.cuenta})`);
  await p.focus('.marco-de-la-ficha .menu-de-acciones__boton');
  await p.keyboard.press('Enter');
  await elemento(p, '.marco-de-la-ficha .menu-de-acciones[data-abierto] .menu-de-acciones__accion', 'Pedir información');
  await p.keyboard.press('Tab');
  assert.ok(await p.evaluate(() => document.activeElement?.closest('.menu-de-acciones__lista') !== null), 'Tab entra a las acciones del menú');
  await captura(p, salida, 'ficha-menu-mas-abierto-1024');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => !document.querySelector('.marco-de-la-ficha .menu-de-acciones[data-abierto]'), { timeout: ESPERA });
  assert.ok(await p.$eval('.marco-de-la-ficha .menu-de-acciones__boton', (b) => b === document.activeElement), 'Escape devuelve el foco a «Más»');
  await captura(p, salida, 'ficha-encabezado-1024');

  // Zoom al 200 %: la ventana de 1440 × 900 queda en 720 × 450 píxeles de CSS. Nada se corre de costado y la pista entra.
  await p.setViewport({ width: 720, height: 450 });
  await pausa(500);
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'al 200 % no hay desplazamiento horizontal');
  await (await elemento(p, BOTON, 'Actualizar')).hover();
  await pausa(700);
  assert.ok(await visible(), 'al 200 %, la pista aparece');
  await dentroYSinTapar('zoom');
  await captura(p, salida, 'ficha-pista-al-200');
  await p.mouse.move(5, 5);
  await pausa(300);

  // Tacto: tocar «Actualizar» actualiza y no deja una pista pegada encima del contenido.
  const tactil = await contexto.newPage();
  await tactil.setViewport({ width: 1024, height: 768, hasTouch: true, isMobile: true });
  await tactil.goto(p.url(), { waitUntil: 'networkidle2' });
  await elemento(tactil, BOTON, 'Actualizar');
  const centro = await tactil.$eval(BOTON, (b) => {
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await tactil.touchscreen.tap(centro.x, centro.y);
  await pausa(900);
  assert.ok(!(await tactil.$eval(GLOBO, (g) => !g.hidden)), 'con el dedo, la pista no queda abierta');
  await tactil.close();
}

/** DL-148: un cambio en el borrador se guarda solo y sigue ahí después de recargar. */
async function borrador({ p, d, salida }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  // Bloque 5: con un borrador, la acción del encabezado es seguirlo.
  await clic(p, '[data-accion-de-la-ficha="borrador"]', 'Seguir el borrador');
  await esperarCamino(p, '/pro/advisees/nutrition');
  assert.equal(ruta(p).parametros.get('vista'), 'plan');
  await elemento(p, '.comida-del-editor[data-comida="1"]');
  await clic(p, '#agregar-comida', 'Agregar comida');
  await elemento(p, '.menu-de-acciones[data-abierto] .menu-de-acciones__accion', 'Una comida habitual');
  // Sin comidas habituales guardadas, la opción está apagada y dice cómo se guardan.
  assert.ok(await p.evaluate(() => [...document.querySelectorAll('.menu-de-acciones[data-abierto] .menu-de-acciones__accion')].some((b) => b.textContent.includes('Una comida habitual') && b.disabled)), '«Una comida habitual» apagada sin habituales');
  await captura(p, salida, 'editor-agregar-comida-1440');
  await p.keyboard.press('Escape');
  const NUEVO = 'Desayuno del recorrido';
  await renombrarComida(p, 1, NUEVO);
  await esperarGuardado(p);
  await captura(p, salida, 'editor-guardado-1440');

  // Sin conexión, lo escrito queda en pantalla y el estado lo dice; al volver la conexión, se guarda solo.
  await p.setOfflineMode(true);
  await renombrarComida(p, 2, 'Almuerzo sin conexión');
  await p.waitForFunction(() => document.querySelector('.editor-del-plan__estado')?.dataset.estado === 'fallo', { timeout: ESPERA, polling: 200 });
  await captura(p, salida, 'editor-sin-conexion-1440');
  await p.setOfflineMode(false);
  await esperarGuardado(p);
  // Sin cambios pendientes, salir no pregunta (no hay diálogo de «salir sin guardar»).
  let pregunto = false;
  p.once('dialog', async (dialogo) => {
    pregunto = true;
    await dialogo.accept();
  });
  await p.reload({ waitUntil: 'networkidle2' });
  await elemento(p, '.comida-del-editor[data-comida="1"]', NUEVO);
  await elemento(p, '.comida-del-editor[data-comida="2"]', 'Almuerzo sin conexión');
  assert.equal(pregunto, false, 'con todo guardado, recargar no pregunta');
}

async function renombrarComida(p, n, nombre) {
  const comida = `.comida-del-editor[data-comida="${n}"]`;
  // Las comidas del editor empiezan plegadas: su menú «Más» aparece al abrirla.
  if (!(await p.$(`${comida}[data-abierta]`))) await clic(p, `${comida} .comida-del-plan__boton`);
  await clic(p, `${comida} .comida-del-editor__acciones .menu-de-acciones__boton`);
  await clic(p, `${comida} .menu-de-acciones[data-abierto] .menu-de-acciones__accion`, 'Cambiar el nombre');
  await p.waitForFunction(() => document.activeElement instanceof HTMLInputElement, { timeout: ESPERA });
  await p.keyboard.down('Control');
  await p.keyboard.press('KeyA');
  await p.keyboard.up('Control');
  await p.keyboard.type(nombre);
  await p.keyboard.press('Enter');
}

/** «Guardado a las…»: solo con la respuesta del servidor (el autoguardado espera 4 s sin cambios). */
const esperarGuardado = (p) =>
  p.waitForFunction(() => {
    const e = document.querySelector('.editor-del-plan__estado');
    return e?.dataset.estado === 'guardado' && e.textContent.includes('a las');
  }, { timeout: ESPERA, polling: 200 });

/** DL-148: dos pestañas sobre el mismo borrador; la segunda no pisa lo de la primera y puede cargar lo guardado. */
async function conflicto({ contexto, p, d }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="borrador"]');
  await esperarCamino(p, '/pro/advisees/nutrition');
  await elemento(p, '.comida-del-editor[data-comida="1"]');
  const otra = await contexto.newPage();
  await otra.setViewport({ width: 1440, height: 900 });
  await otra.goto(p.url(), { waitUntil: 'networkidle2' });
  await elemento(otra, '.comida-del-editor[data-comida="1"]');

  await p.bringToFront();
  await renombrarComida(p, 1, 'Desayuno de la pestaña A');
  await esperarGuardado(p);

  await otra.bringToFront();
  await renombrarComida(otra, 2, 'Almuerzo de la pestaña B');
  await otra.waitForFunction(() => document.querySelector('.editor-del-plan__estado')?.dataset.estado === 'fallo', { timeout: ESPERA, polling: 200 });
  await esperarTexto(otra, dominio.COPY_GUARDADO.conflictoCorto);
  // Lo de la pestaña B sigue en pantalla (para copiarlo), y lo guardado es lo de A.
  await elemento(otra, '.comida-del-editor[data-comida="2"]', 'Almuerzo de la pestaña B');
  await clic(otra, 'button', dominio.COPY_GUARDADO.cargarGuardada);
  await elemento(otra, '.comida-del-editor[data-comida="1"]', 'Desayuno de la pestaña A');
  await otra.waitForFunction(() => !document.querySelector('.comida-del-editor[data-comida="2"]')?.textContent.includes('pestaña B'), { timeout: ESPERA });
  await otra.waitForFunction(() => document.querySelector('.editor-del-plan__estado')?.dataset.estado === 'guardado', { timeout: ESPERA });
}

/** Bloque 5: una ficha nueva lleva a empezar el plan; evaluación, objetivo y plan en la misma pantalla, en orden. */
async function primerPlan({ p, d }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="empezar"]', 'Empezar el plan');
  await esperarCamino(p, '/pro/advisees/nutrition');
  await elemento(p, '[data-primer-plan]');

  // 1. La evaluación.
  await clic(p, '[data-paso-evaluacion]');
  await hidratado(p, '#dato-0-concepto');
  await p.type('#dato-0-concepto', 'Comidas por día');
  await p.type('#dato-0-valor', '4');
  await clic(p, 'form button[type="submit"]', 'Registrar evaluación');

  // 2. El objetivo: se abre solo y propone la evaluación recién registrada.
  await hidratado(p, '#objetivo-kcal');
  await p.waitForFunction(() => document.querySelector('#objetivo-evaluacion')?.value !== '', { timeout: ESPERA });
  await p.type('#objetivo-kcal', '2100');
  await p.type('#objetivo-proteina', '130');
  await p.type('#objetivo-carbohidratos', '220');
  await p.type('#objetivo-grasas', '65');
  await p.type('#objetivo-fundamento', 'Objetivo del recorrido de navegador.');
  await clic(p, 'form button[type="submit"]', 'Guardar nueva versión');

  // 3. El plan.
  await clic(p, '[data-crear-version]');
  await elemento(p, '.editor-del-plan');
  await esperarTexto(p, 'Versión en preparación');

  // De vuelta en la ficha, la acción del momento cambió: ahora es seguir el borrador.
  await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}`, { waitUntil: 'networkidle2' });
  await elemento(p, '[data-accion-de-la-ficha="borrador"]', 'Seguir el borrador');
}

/** Bloque 5: preparar la revisión desde la ficha y volver «donde estabas», con la vista y el período. */
async function retorno({ p, d }) {
  await entrar(p, d.pro.correo);
  await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}&vista=linea&p=30`, { waitUntil: 'networkidle2' });
  await clic(p, '[data-accion-de-la-ficha="revisar"]', 'Preparar la revisión de Nutrición');
  await esperarCamino(p, '/pro/advisees/nutrition');
  const area = ruta(p).parametros;
  assert.equal(area.get('vista'), 'revisiones');
  assert.equal(area.get('preparar'), '1');
  await elemento(p, 'section.paso-de-revision');
  await clic(p, '.retorno-a-la-ficha a', 'Volver a la ficha, donde estabas');
  await esperarCamino(p, '/pro/advisees');
  const ficha = ruta(p).parametros;
  assert.equal(ficha.get('id'), d.ase.id);
  assert.equal(ficha.get('vista'), 'linea', 'vuelve a la misma vista');
  assert.equal(ficha.get('p'), '30', 'con el mismo período');
  await elemento(p, '[data-accion-de-la-ficha="revisar"]');
}

/** El gráfico de evolución dibuja los tres pesos donde corresponde, la tabla dice lo mismo y el teclado los recorre. */
async function grafico({ p, d }) {
  await entrar(p, d.pro.correo);
  await p.goto(`${WEB}/pro/advisees/anthropometry?id=${encodeURIComponent(d.ase.id)}&vista=evolucion`, { waitUntil: 'networkidle2' });
  await elemento(p, '.grafico__lienzo');
  await p.waitForFunction(() => document.querySelectorAll('.grafico__lienzo g.grafico__elegible circle[r="6"]').length === 3, { timeout: ESPERA });
  const dibujo = await p.evaluate(() => {
    const centro = (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const puntos = [...document.querySelectorAll('.grafico__lienzo g.grafico__elegible circle[r="6"]')].map(centro);
    const rombos = document.querySelectorAll('.grafico__lienzo g.grafico__elegible rect').length;
    // Las marcas del eje vertical son los únicos textos numéricos del dibujo (las del tiempo son fechas con letras).
    const marcas = [...document.querySelectorAll('.grafico__lienzo svg text')].filter((t) => /^[\d.,]+$/.test(t.textContent.trim()))
      .map((t) => ({ valor: Number(t.textContent.replace(/\./g, '').replace(',', '.')), y: centro(t).y }))
      .filter((m) => Number.isFinite(m.valor));
    return { puntos, rombos, marcas, tabla: document.querySelector('.evolucion table')?.innerText ?? '' };
  });
  assert.equal(dibujo.rombos, 0, 'las tres tomas son comparables: ningún rombo');
  assert.ok(dibujo.marcas.length >= 2, 'el eje vertical tiene al menos dos marcas con valor');
  const [a, b] = [dibujo.marcas[0], dibujo.marcas[dibujo.marcas.length - 1]];
  const valorEn = (y) => a.valor + ((y - a.y) * (b.valor - a.valor)) / (b.y - a.y);
  const puntos = [...dibujo.puntos].sort((x, y) => x.x - y.x);
  const esperados = d.tomas.map((t) => t.peso);
  puntos.forEach((pt, i) => assert.ok(Math.abs(valorEn(pt.y) - esperados[i]) < 0.15, `el punto ${i + 1} está a la altura de ${esperados[i]} kg (leído: ${valorEn(pt.y).toFixed(2)})`));
  // El tiempo, a escala: las tomas están a 8 días una de otra, así que los puntos quedan a la misma distancia.
  const [d1, d2] = [puntos[1].x - puntos[0].x, puntos[2].x - puntos[1].x];
  assert.ok(d1 > 0 && d2 > 0 && Math.abs(d1 / d2 - 1) < 0.05, `el eje temporal es a escala (${d1.toFixed(1)} y ${d2.toFixed(1)} px)`);
  for (const peso of esperados) assert.ok(dibujo.tabla.includes(String(peso).replace('.', ',')), `la tabla dice ${peso}`);

  // Con el teclado: Inicio elige la primera toma y Fin la última; el detalle dice su valor.
  await p.focus('.grafico__lienzo');
  await p.keyboard.press('Home');
  await p.waitForFunction((v) => document.querySelector('.detalle-de-valores')?.textContent.includes(v), { timeout: ESPERA }, String(esperados[0]).replace('.', ','));
  await p.keyboard.press('End');
  await p.waitForFunction((v) => document.querySelector('.detalle-de-valores')?.textContent.includes(v), { timeout: ESPERA }, String(esperados[2]).replace('.', ','));
}

/** Abre «Invitar a una persona» y devuelve el selector del área de ese diálogo. */
async function abrirInvitar(p) {
  await clic(p, '.espacio-profesional__invitar', dominio.COPY_INVITACION.invitar);
  const area = await elemento(p, 'dialog[open] select');
  return area;
}

/** Bloque 5: sin vínculos no hay área sugerida; elegir una no habilitada lo dice junto al campo, y una habilitada crea. */
async function primeraInvitacion({ p, d }) {
  await entrar(p, d.pro.correo);
  const area = await abrirInvitar(p);
  await pausa(800);
  assert.equal(await area.evaluate((s) => s.value), '', 'sin vínculos, ninguna área elegida de entrada');
  assert.ok(!(await p.evaluate((t) => document.querySelector('dialog[open]').innerText.includes(t), dominio.COPY_INVITACION.areaSugerida)), 'sin sugerencia');
  // El servidor valida la habilitación real: Antropometría no está habilitada para esta cuenta.
  await area.select('ANTROPOMETRIA');
  await clic(p, 'dialog[open] form button[type="submit"]');
  await p.waitForFunction((t) => document.querySelector('dialog[open] .campo__error')?.textContent.includes(t), { timeout: ESPERA }, dominio.COPY_INVITACION.areaNoHabilitada);
  assert.equal(await area.evaluate((s) => s.getAttribute('aria-invalid')), 'true', 'el campo queda marcado');
  assert.ok(await area.evaluate((s) => s === document.activeElement), 'el foco vuelve al área');
  await area.select('ENTRENAMIENTO');
  await clic(p, 'dialog[open] form button[type="submit"]');
  await p.waitForFunction(() => !document.querySelector('dialog[open] form select'), { timeout: ESPERA });
}

/** Bloque 5: con vínculos en una sola de sus dos áreas, esa viene elegida, se dice que es una sugerencia y se puede cambiar. */
async function areaSugerida({ p, d, salida }) {
  await entrar(p, d.pro.correo);
  const area = await abrirInvitar(p);
  await p.waitForFunction(() => document.querySelector('dialog[open] select')?.value === 'NUTRICION', { timeout: ESPERA });
  await p.waitForFunction((t) => document.querySelector('dialog[open]').innerText.includes(t), { timeout: ESPERA }, dominio.COPY_INVITACION.areaSugerida);
  const nodo = await p.accessibility.snapshot({ root: area, interestingOnly: false });
  assert.ok((nodo?.description ?? '').includes(dominio.COPY_INVITACION.areaSugerida), 'la sugerencia es parte de la descripción del campo');
  await captura(p, salida, 'invitar-area-sugerida-1440');
  await area.select('ENTRENAMIENTO');
  await pausa(200);
  assert.ok(!(await p.evaluate((t) => document.querySelector('dialog[open]').innerText.includes(t), dominio.COPY_INVITACION.areaSugerida)), 'al elegir otra, deja de decir «sugerida»');
  await clic(p, 'dialog[open] form button[type="submit"]');
  await p.waitForFunction(() => !document.querySelector('dialog[open] form select'), { timeout: ESPERA });
}

/** Bloque 3: «Cerrar todas las sesiones» desde otro lado deja afuera a la pestaña abierta, y la cookie no la revive. */
async function sesionRevocada({ p, d }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  const otra = await sesionPorApi(d.pro.correo);
  await pedir('DELETE', '/auth/sessions', { token: otra, clave: false });
  await clic(p, '.ficha__consulta .pista > button', 'Actualizar');
  await esperarCamino(p, '/login');
  const aviso = ruta(p).parametros;
  assert.ok(['sesion-no-valida', 'sesion-vencida'].includes(aviso.get('aviso') ?? ''), `el login dice por qué (${aviso.get('aviso')})`);
  assert.ok((aviso.get('volver') ?? '').startsWith('/pro/advisees'), 'y vuelve a la ficha después de entrar');
  await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}`, { waitUntil: 'networkidle2' });
  await esperarCamino(p, '/login');
}

/** Bloque 3: si la persona retira el consentimiento, la ficha lo dice al actualizar, y recargar no devuelve el acceso. */
async function accesoRevocado({ p, d }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await elemento(p, '[data-accion-de-la-ficha="empezar"]');
  const ase = await sesionPorApi(d.ase.correo, 'APK');
  await pedir('POST', `/me/consents/${d.consentimientos.NUTRICION}/revoke`, { token: ase, superficie: 'APK', cuerpo: {} });
  await clic(p, '.ficha__consulta .pista > button', 'Actualizar');
  await p.waitForFunction(() => !document.querySelector('[data-accion-de-la-ficha]'), { timeout: ESPERA });
  await esperarTexto(p, dominio.COPY_VINCULO.accesoNoDisponible);
  await p.reload({ waitUntil: 'networkidle2' });
  await esperarTexto(p, dominio.COPY_VINCULO.accesoNoDisponible);
  assert.ok(!(await p.$('[data-accion-de-la-ficha]')), 'recargar recupera la sesión, no el permiso');
}

/**
 * Hace fallar con un 503, dentro de la página, las lecturas GET de `caminos`, sin tocar la API ni la red del navegador.
 *
 * Reemplaza `fetch` antes de que cargue cada documento (`evaluateOnNewDocument`): el cliente HTTP del website recibe el
 * 503 como si lo hubiera mandado la API, y todos los demás pedidos salen como siempre. Antes se interceptaba en la red
 * del navegador (el dominio Fetch de CDP, con `setRequestInterception`). Con eso, en la CI, a veces el navegador cancelaba
 * de golpe todo lo que estaba en curso, a la API y al website, y perdía la cookie de reanudación. Fue el intermitente del
 * 23 y el 24/10, y pasaba también interceptando solo estos dos caminos.
 * `dejarDeFallar` saca un camino, en el documento abierto y en los que vengan.
 */
async function simularFallas(p, caminos) {
  const fallan = new Set(caminos);
  let guion = null;
  const instalar = async () => {
    if (guion) await p.removeScriptToEvaluateOnNewDocument(guion.identifier);
    guion = await p.evaluateOnNewDocument(
      (api, lista) => {
        const simuladas = new Set(lista);
        window.__beLecturasQueFallan = simuladas;
        const original = window.fetch.bind(window);
        window.fetch = (entrada, init) => {
          const url = new URL(typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url, location.href);
          const metodo = String(init?.method ?? (entrada instanceof Request ? entrada.method : 'GET')).toUpperCase();
          if (metodo === 'GET' && url.origin === api && simuladas.has(url.pathname)) {
            const cuerpo = JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Falla simulada por el recorrido.' } });
            return Promise.resolve(new Response(cuerpo, { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } }));
          }
          return original(entrada, init);
        };
      },
      API,
      [...fallan],
    );
  };
  await instalar();
  return {
    async dejarDeFallar(camino) {
      fallan.delete(camino);
      await instalar();
      await p.evaluate((c) => window.__beLecturasQueFallan?.delete(c), camino);
    },
  };
}

/**
 * Bloque 5: si falla UNA lectura (simulada en el navegador, sin tocar la API), la vista muestra lo que llegó, dice qué
 * falta, no lo confunde con «no hay» y «Reintentar lo que faltó» lo completa. En el Plan falla el objetivo vigente; en el
 * Resumen, el estado del seguimiento.
 */
async function faltaUnaParte({ p, d, salida }) {
  await entrar(p, d.pro.correo);
  const base = `/api/v1/advisees/${d.ase.id}/nutrition`;
  const fallas = await simularFallas(p, [`${base}/objectives/effective`, `${base}/review-context`]);

  // El Plan: la versión activa a la vista, el aviso de lo que falta y nada de «crear versión» ni «primero el objetivo».
  await p.goto(`${WEB}/pro/advisees/nutrition?id=${encodeURIComponent(d.ase.id)}&vista=plan`, { waitUntil: 'networkidle2' });
  await esperarTexto(p, 'Falta una parte de esta vista');
  await esperarTexto(p, 'el objetivo vigente');
  await elemento(p, '.plan[data-version="activa"]');
  assert.ok(!(await p.evaluate((t) => document.body.innerText.includes(t), dominio.COPY_DEL_PLAN.primeroElObjetivo)), 'una falla no se dice como «no hay objetivo»');
  assert.ok(!(await p.$('[data-crear-version]')), 'mientras falta el objetivo, no se ofrece crear una versión');
  await captura(p, salida, 'plan-falta-el-objetivo-1440');
  await fallas.dejarDeFallar(`${base}/objectives/effective`);
  await clic(p, 'button', 'Reintentar lo que faltó');
  await p.waitForFunction(() => !document.body.innerText.includes('Falta una parte de esta vista'), { timeout: ESPERA });
  await elemento(p, '[data-crear-version]');

  // El Resumen: falla el estado del seguimiento; la última evaluación y el plan activo siguen a la vista.
  await p.goto(`${WEB}/pro/advisees/nutrition?id=${encodeURIComponent(d.ase.id)}&vista=resumen`, { waitUntil: 'networkidle2' });
  await esperarTexto(p, 'el estado del seguimiento');
  await esperarTexto(p, 'No se pudo leer.');
  assert.ok(!(await p.evaluate(() => document.body.innerText.includes('No hay una revisión pendiente.'))), 'una falla no se dice como «no hay revisión pendiente»');
  assert.ok(await p.evaluate(() => /Versión \d+ · activada el/.test(document.body.innerText)), 'el plan activo sigue a la vista');
  await captura(p, salida, 'resumen-falta-el-seguimiento-1440');
  await fallas.dejarDeFallar(`${base}/review-context`);
  await clic(p, 'button', 'Reintentar lo que faltó');
  await p.waitForFunction(() => !document.body.innerText.includes('No se pudo leer.'), { timeout: ESPERA });
  // Leído el estado del seguimiento: el plan activo lo abrió, y la revisión acordada (en 3 días) todavía no está pendiente.
  await esperarTexto(p, 'Abierto');
  await esperarTexto(p, 'No hay una revisión pendiente.');
  assert.ok(!(await p.evaluate(() => document.body.innerText.includes('Falta una parte de esta vista'))), 'después de reintentar, no queda el aviso');
}

/**
 * DL-153 (encargo del 2026-10-23, con los criterios que Dirección ratificó el 2026-10-24): el número de Nutrición no da
 * una falsa certeza.
 * - Ayer se registró el desayuno y no el almuerzo del plan: el indicador del Resumen lo cuenta como subtotal y dice la
 *   comida del plan sin registro; la lectura de Analizar de ese día dice cuál falta.
 * - Hace tres días, el almuerzo tiene una comida diferente sin cantidades: tiene registro, sin ser la opción del plan, y
 *   el día es un subtotal por la cantidad.
 * - Anteayer, con las dos, dice que cada comida del plan tiene registro. Nunca «sin faltantes».
 * Registros dice el mismo conteo que Analizar.
 */
async function completitud({ p, d, salida }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  const indicador = 'li.indicador[data-metrica="nutricion.energia"]';
  await p.waitForFunction((s) => document.querySelector(s)?.innerText.includes('comida del plan sin registro'), { timeout: ESPERA, polling: 100 }, indicador);
  const tarjeta = await p.$eval(indicador, (e) => e.innerText);
  assert.match(tarjeta, /kcal por día/, 'el valor es una media por día, dicha');
  assert.match(tarjeta, /Media de los días con valor/, 'con su regla');
  assert.match(tarjeta, /3 con valor/, 'los días que sostienen la media, con hoy en curso fuera');
  assert.match(tarjeta, /2 subtotales/, 'ayer (falta el almuerzo) y hace tres días (la comida diferente no tiene cantidades)');
  assert.match(tarjeta, /1 comida del plan sin registro/, 'solo la de ayer: la comida diferente cuenta como registro');
  assert.ok(!(await p.evaluate(() => document.body.innerText.includes('sin faltantes'))), 'ninguna parte del Resumen dice «sin faltantes»');
  await captura(p, salida, 'completitud-indicador-1440');

  const lecturaDel = async (fecha, texto) => {
    await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}&vista=analizar&m=nutricion.energia&f=${fecha}`, { waitUntil: 'networkidle2' });
    await p.waitForFunction((t) => document.querySelector('.panel-de-lectura')?.innerText.includes(t), { timeout: ESPERA, polling: 100 }, texto);
    return p.$eval('.panel-de-lectura', (e) => e.innerText);
  };
  const ayer = await lecturaDel(d.comidas.ayer, `Sin registro: ${d.comidas.faltante}`);
  assert.match(ayer, /Subtotal de lo registrado/);
  assert.match(ayer, /Comidas del plan: 1 de 2 con registro · 1 sin registro/);
  assert.ok(ayer.includes('Falta: 1 comida(s) del plan sin registro'), 'el motivo, con las palabras de la exportación');
  await captura(p, salida, 'completitud-lectura-ayer-1440');
  const conDiferente = await lecturaDel(d.comidas.haceTres, 'Comidas del plan: 2 de 2 con registro · 1 con opción del plan · 1 con comida diferente');
  assert.match(conDiferente, /Subtotal de lo registrado/, 'por la cantidad desconocida de la comida diferente');
  assert.ok(!conDiferente.includes('Sin registro:'), 'el almuerzo tiene registro');
  await captura(p, salida, 'completitud-lectura-comida-diferente-1440');
  const anteayer = await lecturaDel(d.comidas.anteayer, 'Comidas del plan: 2 de 2 con registro');
  assert.match(anteayer, /Cada comida del plan con registro, con cantidades/);
  assert.ok(!anteayer.includes('sin faltantes'), 'completo según el plan no se dice «sin faltantes»');

  // Registros cuenta igual: la comida diferente da registro al almuerzo, y se dice cuántas tienen la opción del plan.
  await p.goto(`${WEB}/pro/advisees/nutrition?id=${encodeURIComponent(d.ase.id)}&vista=registros`, { waitUntil: 'networkidle2' });
  await esperarTexto(p, '2 de 2 comidas con registro');
  await esperarTexto(p, '1 con opción del plan');
  await esperarTexto(p, '1 de 2 comidas con registro');
  assert.ok(!(await p.evaluate(() => /\d+ de \d+ comidas? registradas?\b/.test(document.body.innerText))), 'ya no dice «N de M comidas registradas»');
  await captura(p, salida, 'completitud-registros-1440');
}

// ─── La corrida ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const TODOS = { sesion, pistas, borrador, conflicto, primerPlan, retorno, grafico, primeraInvitacion, areaSugerida, sesionRevocada, accesoRevocado, faltaUnaParte, completitud };

/** Errores de la página que no dicen nada del website (los del propio navegador). */
const IGNORABLES = [/ResizeObserver loop/];

export async function correrRecorridos({ estado, salida, chrome, solo = null }) {
  mkdirSync(salida, { recursive: true });
  const navegador = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--lang=es-AR', '--no-first-run', ...(process.env.CI ? ['--no-sandbox'] : [])],
  });
  const resultados = [];
  try {
    for (const [nombre, fn] of Object.entries(TODOS)) {
      if (solo && !solo.includes(nombre)) continue;
      const contexto = await navegador.createBrowserContext();
      const p = await contexto.newPage();
      await p.setViewport({ width: 1440, height: 900 });
      const errores = [];
      p.on('pageerror', (e) => {
        if (!IGNORABLES.some((r) => r.test(e.message))) errores.push(e.message);
      });
      const inicio = Date.now();
      try {
        await fn({ contexto, p, d: estado[nombre], salida });
        assert.deepEqual(errores, [], 'sin errores de JavaScript en la página');
        resultados.push({ nombre, ok: true, segundos: Math.round((Date.now() - inicio) / 100) / 10 });
        console.log(`✔ ${nombre} (${Math.round((Date.now() - inicio) / 1000)} s)`);
      } catch (e) {
        resultados.push({ nombre, ok: false, segundos: Math.round((Date.now() - inicio) / 100) / 10, error: e.message, errores });
        console.log(`✖ ${nombre}: ${e.message}`);
        for (const [i, pagina] of (await contexto.pages()).entries()) {
          await pagina.screenshot({ path: join(salida, `${nombre}-${i + 1}.png`) }).catch(() => {});
          writeFileSync(join(salida, `${nombre}-${i + 1}.txt`), `${pagina.url()}\n\n${await pagina.evaluate(() => document.body.innerText).catch(() => '')}`);
        }
      } finally {
        await contexto.close();
      }
    }
  } finally {
    await navegador.close();
  }
  writeFileSync(join(salida, 'resultados.json'), JSON.stringify({ fecha: new Date().toISOString(), api: API, web: WEB, resultados }, null, 2));
  return resultados;
}
