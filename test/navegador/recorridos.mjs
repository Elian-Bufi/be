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
import { NOMBRE_DEL_ADMINISTRADOR, NOMBRE_DEL_OTRO_ADMINISTRADOR, NOMBRE_DEL_PENDIENTE, SECRETOS, codigoTotp, nombreDelProfesional, sesionAdministrativa } from './preparar.mjs';

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

/**
 * DL-154 (encargo del 2026-10-23): una revisión registrada dice en qué se apoyó. En Nutrición · Revisiones, la revisión
 * dice su período, quién la registró y la evidencia que se marcó (dos comidas y el plan; no el desayuno de ayer, que está
 * en el período). «Ver la evidencia» la lista con el almuerzo deshecho después de la revisión, dicho. «Abrir» muestra la
 * comida en el panel; Escape lo cierra, el foco vuelve a «Abrir» y la lista sigue abierta. El almuerzo deshecho abre con
 * el aviso del estado de hoy; la versión del plan, reemplazada después, abre diciendo que es la misma que se revisó y que
 * ya no es la vigente (D-2). Al recargar, sigue ahí.
 */
async function evidencia({ p, d, salida }) {
  await entrar(p, d.pro.correo);
  const revisiones = `${WEB}/pro/advisees/nutrition?id=${encodeURIComponent(d.ase.id)}&vista=revisiones`;
  await p.goto(revisiones, { waitUntil: 'networkidle2' });
  const item = `[data-evidencia-de="${d.revision.reviewId}"]`;
  await elemento(p, item);
  const tarjeta = await p.$eval(item, (e) => e.closest('li').innerText);
  assert.match(tarjeta, /período revisado:/, 'la revisión dice qué período se revisó');
  assert.match(tarjeta, /registró: Lic\. Recorrido evidencia/, 'y quién la registró');
  assert.match(tarjeta, /Evidencia seleccionada: 2 comidas · 1 versión del plan/, 'lo que se marcó, contado desde lo guardado');

  // Ver la evidencia: lo marcado, y lo que cambió después de la revisión.
  const boton = `${item} button[aria-controls]`;
  await clic(p, boton, 'Ver la evidencia');
  await p.waitForFunction((s) => document.querySelector(s)?.innerText.includes('Se deshizo después de esta revisión'), { timeout: ESPERA, polling: 100 }, item);
  const lista = await p.$eval(item, (e) => e.innerText);
  assert.ok(lista.includes(`${d.comidas.desayuno} · opción del plan`), 'el desayuno de anteayer');
  assert.ok(lista.includes(`${d.comidas.almuerzo} · opción del plan`), 'el almuerzo de anteayer');
  assert.ok(lista.includes('Plan v1'), 'la versión del plan');
  assert.ok(lista.includes('Después se activó otra versión del plan'), 'y que después se activó otra');
  // Los elementos de la lista, no el texto del bloque: cada «Abrir» repite el nombre para el lector de pantalla.
  const elementos = await p.$$eval(`${item} .evidencia-registrada__que`, (es) => es.map((e) => e.innerText));
  assert.equal(elementos.filter((t) => t.includes('opción del plan')).length, 2, 'solo las dos comidas marcadas: el desayuno de ayer está en el período y no se marcó');
  assert.equal(elementos.length, 3, 'dos comidas y la versión del plan');
  assert.ok(elementos.every((t) => / · /.test(t)), 'la fecha y el nombre se leen separados');
  assert.equal(await p.$eval(boton, (b) => b.getAttribute('aria-expanded')), 'true');
  await captura(p, salida, 'evidencia-lista-1440');

  // Abrir la comida: el panel modal con el registro; Escape vuelve a la lista, con el foco en «Abrir».
  const abrir = await p.waitForFunction((s, t) => [...document.querySelectorAll(`${s} .evidencia-registrada__item`)].find((li) => li.innerText.includes(t))?.querySelector('button') ?? null, { timeout: ESPERA }, item, `${d.comidas.desayuno} · opción del plan`);
  await abrir.asElement().click();
  await p.waitForFunction(() => document.querySelector('dialog[open]')?.innerText.includes('Cerrar'), { timeout: ESPERA, polling: 100 });
  await p.waitForFunction(() => !document.querySelector('dialog[open] [aria-busy="true"]') && (document.querySelector('dialog[open]')?.innerText.length ?? 0) > 40, { timeout: ESPERA, polling: 100 });
  assert.ok(!(await p.$('dialog[open] .aviso')), 'el desayuno no cambió después de la revisión: no hay aviso');
  await captura(p, salida, 'evidencia-panel-1440');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: ESPERA, polling: 100 });
  assert.match(await p.evaluate(() => document.activeElement?.textContent ?? ''), /Abrir/, 'el foco vuelve al botón que abrió el panel');
  assert.equal(await p.$eval(boton, (b) => b.getAttribute('aria-expanded')), 'true', 'la lista sigue abierta: nada navegó');

  // D-2 (criterios de Dirección del 2026-10-24): el almuerzo se deshizo después de la revisión. Al abrirlo, el panel dice
  // antes del contenido que es el estado de hoy, no lo que se vio al revisar, y qué cambió.
  const abrirAlmuerzo = await p.waitForFunction((s, t) => [...document.querySelectorAll(`${s} .evidencia-registrada__item`)].find((li) => li.innerText.includes(t))?.querySelector('button') ?? null, { timeout: ESPERA }, item, `${d.comidas.almuerzo} · opción del plan`);
  await abrirAlmuerzo.asElement().click();
  await p.waitForFunction(() => document.querySelector('dialog[open] .aviso')?.innerText.includes('no como estaba cuando se revisó'), { timeout: ESPERA, polling: 100 });
  await p.waitForFunction(() => !document.querySelector('dialog[open] [aria-busy="true"]'), { timeout: ESPERA, polling: 100 });
  const aviso = await p.$eval('dialog[open] .aviso', (e) => e.innerText);
  assert.match(aviso, /Lo que ves es como está hoy, no como estaba cuando se revisó/);
  assert.match(aviso, /Se deshizo después de esta revisión/, 'con qué cambió');
  await captura(p, salida, 'evidencia-panel-con-cambio-1440');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: ESPERA, polling: 100 });

  // D-2: después de la revisión se activó otra versión del plan. La revisada no cambió (se abre desde su instantánea):
  // el panel dice que es la misma y que ya no es la vigente, y no que está «como hoy».
  const abrirPlan = await p.waitForFunction((s) => [...document.querySelectorAll(`${s} .evidencia-registrada__item`)].find((li) => li.innerText.includes('Plan v1'))?.querySelector('button') ?? null, { timeout: ESPERA }, item);
  await abrirPlan.asElement().click();
  await p.waitForFunction(() => document.querySelector('dialog[open] .aviso')?.innerText.includes('Es la misma versión que se revisó'), { timeout: ESPERA, polling: 100 });
  await p.waitForFunction(() => !document.querySelector('dialog[open] [aria-busy="true"]'), { timeout: ESPERA, polling: 100 });
  const avisoDelPlan = await p.$eval('dialog[open] .aviso', (e) => e.innerText);
  assert.match(avisoDelPlan, /Es la misma versión que se revisó; ya no es la vigente/);
  assert.match(avisoDelPlan, /Después se activó otra versión del plan/, 'con qué cambió y cuándo');
  assert.ok(!(await p.$eval('dialog[open]', (d) => d.innerText.includes('Lo que ves es como está hoy'))), 'no dice que la versión cambió');
  await captura(p, salida, 'evidencia-panel-version-reemplazada-1440');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: ESPERA, polling: 100 });

  // Al recargar (la sesión sigue), la revisión y su evidencia siguen ahí: están guardadas, no armadas en el navegador.
  await p.reload({ waitUntil: 'networkidle2' });
  await elemento(p, item);
  assert.match(await p.$eval(item, (e) => e.innerText), /Evidencia seleccionada: 2 comidas · 1 versión del plan/);
}

// ─── Administración (WP-ADMINISTRACION, DL-155) ──────────────────────────────────────────────────────────────────────

/** Escribe en un campo reemplazando lo que tenga (seleccionar todo y borrar, como lo haría una persona). */
async function escribir(p, selector, texto) {
  await hidratado(p, selector);
  await p.click(selector, { clickCount: 3 });
  await p.keyboard.down('Control');
  await p.keyboard.press('KeyA');
  await p.keyboard.up('Control');
  await p.keyboard.press('Backspace');
  await p.type(selector, texto);
}

/** Una captura en cada apariencia. El tema se cambia como lo cambia el menú (el atributo de la página), sin recargar. */
async function capturaEnLosDosTemas(p, salida, nombre) {
  for (const tema of ['azul-noche', 'claro']) {
    await p.evaluate((t) => {
      document.documentElement.dataset.tema = t;
    }, tema);
    await captura(p, salida, `${nombre}-${tema}`);
  }
  await p.evaluate(() => {
    document.documentElement.dataset.tema = 'azul-noche';
  });
}

const dialogoAbierto = (p, titulo) => p.waitForFunction((t) => document.querySelector('dialog[open] h2')?.textContent.includes(t), { timeout: ESPERA, polling: 100 }, titulo);
const dialogoCerrado = (p) => p.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: ESPERA, polling: 100 });
const AREA = (alcance) => `.area-de-la-ficha[data-area="${alcance}"]`;

/** Una decisión desde la ficha: el botón del área, el fundamento (y el texto para el profesional), y confirmar. */
async function decidir(p, alcance, boton, titulo, { fundamento, mensaje = null, confirmar }) {
  await clic(p, `${AREA(alcance)} .area-de-la-ficha__acciones button`, boton);
  await dialogoAbierto(p, titulo);
  await p.type('dialog[open] textarea[id$="-fundamento"]', fundamento);
  if (mensaje) await p.type('dialog[open] textarea[id$="-mensaje"]', mensaje);
  await clic(p, 'dialog[open] .acciones button:not(.boton--secundario)', confirmar);
  await dialogoCerrado(p);
}

const textoDelArea = (p, alcance) => p.$eval(AREA(alcance), (e) => e.innerText);
const esperarSituacion = (p, alcance, situacion) =>
  p.waitForFunction((s, t) => document.querySelector(s)?.querySelector('.situacion')?.textContent.includes(t), { timeout: ESPERA, polling: 100 }, AREA(alcance), situacion);

/**
 * La consola de Administración de punta a punta, con las cuentas y los datos de esta corrida:
 * 1. un profesional con su sesión no obtiene nada de Administración (ni con su contraseña ni con su token);
 * 2. la cuenta administrativa configura su autenticador con el código de incorporación y ve sus códigos una vez;
 * 3. la lista: pendientes primero, búsqueda que no va a la dirección y filtro por situación;
 * 4. la ficha y las decisiones: verificar (el fundamento es obligatorio), conceder, y un conflicto con otra consola que
 *    conserva lo escrito y no pisa nada;
 * 5. suspender corta Nutrición desde el próximo pedido (con la sesión abierta) y no Entrenamiento; avisa al profesional y a
 *    la persona, sin el fundamento; rehabilitar vuelve a dejar operar;
 * 6. recargar reanuda sin inventar el segundo factor, y cerrar la sesión no toca la sesión común del profesional.
 * Las capturas son de la lista, la ficha, la confirmación, el conflicto y el historial: nunca del QR, de la clave ni de los
 * códigos de recuperación.
 */
async function administracion({ contexto, p, d, salida }) {
  const { codigoDeIncorporacion, secretoDelOtro } = SECRETOS.get('administracion');
  const tokens = [];
  p.on('response', async (r) => {
    if (r.request().method() !== 'POST' || !/\/api\/v1\/admin\/auth\/sessions(\/resume)?$/.test(new URL(r.url()).pathname)) return;
    const cuerpo = await r.json().catch(() => null);
    if (cuerpo?.data?.session?.accessToken) tokens.push(cuerpo.data.session.accessToken);
  });

  // 1. El profesional, con su sesión común abierta: /admin le pide entrar, su contraseña no abre Administración (el mismo
  //    rechazo neutral que una contraseña equivocada) y su token no sirve en la API de Administración.
  await entrar(p, d.pro.correo);
  await p.goto(`${WEB}/admin`, { waitUntil: 'networkidle2' });
  await hidratado(p, '#adm-correo');
  assert.match(await p.$eval('main', (m) => m.innerText), /Entrar a Administración/);
  await escribir(p, '#adm-correo', d.pro.correo);
  await escribir(p, '#adm-contrasena', CREDENCIAL);
  await clic(p, 'form button[type="submit"]', 'Continuar');
  await esperarTexto(p, 'No pudimos verificar los datos de acceso');
  const tokenDelProfesional = await sesionPorApi(d.pro.correo);
  await pedir('GET', `/admin/professionals/${d.pendiente.id}`, { token: tokenDelProfesional, esperado: 403 });
  await pedir('POST', '/admin/professionals/query', { token: tokenDelProfesional, cuerpo: {}, clave: false, esperado: 403 });

  // 2. La cuenta administrativa: contraseña, código de incorporación, QR (o la clave a mano) y un código del autenticador.
  await escribir(p, '#adm-correo', d.admin.correo);
  await escribir(p, '#adm-contrasena', CREDENCIAL);
  await clic(p, 'form button[type="submit"]', 'Continuar');
  await esperarTexto(p, 'Configurar el autenticador');
  await escribir(p, '#adm-incorporacion', codigoDeIncorporacion);
  await clic(p, 'form button[type="submit"]', 'Continuar');
  await elemento(p, 'svg.codigo-qr');
  await clic(p, 'details.ayuda summary', 'Clave para cargar a mano');
  const secreto = (await p.$eval('.clave-del-autenticador code', (c) => c.textContent)).replace(/\s/g, '');
  await escribir(p, '#adm-codigo-nuevo', codigoTotp(secreto));
  await clic(p, 'form button[type="submit"]', 'Confirmar');
  await esperarTexto(p, 'Tus códigos de recuperación');
  assert.equal(await p.$$eval('.codigos-de-recuperacion li', (l) => l.length), 10, 'diez códigos de recuperación, que se muestran una vez');
  await clic(p, 'button', 'Ya los guardé');
  await elemento(p, '.pendientes-de-administracion');

  // La consola tiene su propia cookie (HttpOnly, solo para sus rutas de sesión) y no guarda tokens ni la clave.
  const cookies = await contexto.cookies();
  const reanudacion = cookies.find((c) => c.name === '__Secure-be-admin-reanudacion');
  assert.ok(reanudacion, 'la consola tiene su propia cookie de reanudación');
  assert.equal(reanudacion.httpOnly, true, 'HttpOnly');
  assert.equal(reanudacion.secure, true, 'Secure');
  assert.equal(reanudacion.path, '/api/v1/admin/auth/sessions', 'solo para las rutas de sesión de Administración');
  const guardado = await almacenamiento(p);
  assert.ok(tokens.length >= 1, 'se vio el token de la entrada');
  for (const t of tokens) assert.ok(!guardado.includes(t), 'ningún token en localStorage ni sessionStorage');
  assert.ok(!PARECE_UN_TOKEN.test(guardado), 'nada con forma de token en el almacenamiento');
  assert.ok(!guardado.includes(secreto), 'la clave del autenticador no queda en el navegador');

  // 3. La lista: buscar por el correo de esta corrida (la búsqueda no va a la dirección), con el pendiente primero.
  const prefijo = d.pro.correo.replace(/-pro@.*$/, '');
  await escribir(p, 'form[role="search"] input[type="search"]', prefijo);
  await clic(p, 'form[role="search"] button[type="submit"]', 'Buscar');
  await p.waitForFunction(() => document.querySelector('.lista-administrativa .metadatos')?.textContent.startsWith('2 profesionales'), { timeout: ESPERA, polling: 100 });
  assert.ok(!decodeURIComponent(p.url()).includes(prefijo), 'la búsqueda no va en la dirección');
  const filas = await p.$$eval('.tabla--profesionales tbody tr', (trs) => trs.map((t) => t.innerText));
  assert.match(filas[0], new RegExp(NOMBRE_DEL_PENDIENTE), 'el profesional con áreas pendientes va primero');
  assert.match(filas[0], /Pendiente de revisión/);
  assert.match(filas[1], /Puede operar/);
  assert.match(await p.$eval('.pendientes-de-administracion', (e) => e.innerText), /\d+ áreas? pendientes? de revisión/);
  await capturaEnLosDosTemas(p, salida, 'administracion-lista');
  await p.select('select[id$="-situacion"]', 'PENDING_REVIEW');
  await p.waitForFunction(() => document.querySelector('.lista-administrativa .metadatos')?.textContent.startsWith('1 profesional'), { timeout: ESPERA, polling: 100 });
  await p.select('select[id$="-situacion"]', '');
  await p.waitForFunction(() => document.querySelector('.lista-administrativa .metadatos')?.textContent.startsWith('2 profesionales'), { timeout: ESPERA, polling: 100 });

  // 4. La ficha del pendiente: tres áreas, con las decisiones que su estado admite.
  await clic(p, '.tabla--profesionales a', `de ${NOMBRE_DEL_PENDIENTE}`);
  await esperarCamino(p, '/admin/professional');
  await p.waitForFunction((n) => document.querySelector('.ficha-administrativa h1')?.textContent === n, { timeout: ESPERA, polling: 100 }, NOMBRE_DEL_PENDIENTE);
  assert.equal(await p.$$eval('.area-de-la-ficha', (a) => a.length), 3, 'las tres áreas');
  assert.match(await textoDelArea(p, 'NUTRICION'), /Pendiente de revisión/);
  const botones = await p.$$eval(`${AREA('NUTRICION')} .area-de-la-ficha__acciones button`, (b) => b.map((x) => x.textContent.replace(/\s*Nutrición$/, '').trim()));
  assert.deepEqual(botones, ['Registrar observación', 'Verificar', 'Rechazar', 'Conceder habilitación'], 'las decisiones del estado pendiente');
  assert.match(await textoDelArea(p, 'ANTROPOMETRIA'), /El área no se presentó/, 'un área sin presentar no ofrece decisiones');
  assert.match(await p.$eval('.ficha-administrativa', (e) => e.innerText), /no es certificar una matrícula/);
  await capturaEnLosDosTemas(p, salida, 'administracion-ficha');

  // Verificar: la confirmación dice profesional, área y efecto; sin fundamento no se registra nada.
  await clic(p, `${AREA('NUTRICION')} .area-de-la-ficha__acciones button`, 'Verificar');
  await dialogoAbierto(p, `Verificar · Nutrición de ${NOMBRE_DEL_PENDIENTE}`);
  const confirmacion = await p.$eval('dialog[open]', (e) => e.innerText);
  assert.match(confirmacion, /La verificación de Nutrición pasa a verificada/);
  assert.match(confirmacion, /Todavía no puede operar Nutrición: falta conceder la habilitación/);
  assert.match(confirmacion, /no certifica una matrícula/);
  assert.equal(await p.evaluate(() => document.activeElement?.tagName), 'TEXTAREA', 'el foco empieza en el fundamento, no en la acción');
  await capturaEnLosDosTemas(p, salida, 'administracion-confirmacion');
  await clic(p, 'dialog[open] .acciones button:not(.boton--secundario)', 'Verificar Nutrición');
  await p.waitForFunction(() => document.querySelector('dialog[open] .campo__error')?.textContent.includes('Escribí el fundamento interno'), { timeout: ESPERA, polling: 100 });
  await p.type('dialog[open] textarea[id$="-fundamento"]', 'Documentación revisada (sintético).');
  await clic(p, 'dialog[open] .acciones button:not(.boton--secundario)', 'Verificar Nutrición');
  await dialogoCerrado(p);
  await esperarTexto(p, 'Verificar: decisión registrada. Se avisó al profesional.');
  await esperarSituacion(p, 'NUTRICION', 'Verificada, sin habilitación');
  await p.waitForFunction(() => document.querySelector('.historial-administrativo li')?.innerText.includes('Área verificada'), { timeout: ESPERA, polling: 100 });
  const verificado = await p.$eval('.historial-administrativo li', (l) => l.innerText);
  assert.match(verificado, new RegExp(`${NOMBRE_DEL_ADMINISTRADOR} · Administración`), 'el hecho dice quién decidió');
  assert.match(verificado, /Documentación revisada \(sintético\)/, 'y su fundamento');

  // Conceder la habilitación: recién ahí puede operar.
  await decidir(p, 'NUTRICION', 'Conceder habilitación', 'Conceder habilitación · Nutrición', { fundamento: 'Habilitación para operar (sintético).', confirmar: 'Conceder habilitación Nutrición' });
  await esperarSituacion(p, 'NUTRICION', 'Puede operar');

  // Conflicto: mientras el diálogo está abierto, otra consola suspende el área. Al confirmar, nada se pisa: el diálogo dice
  // cómo está ahora, conserva lo escrito y no deja confirmar sobre la situación nueva.
  await clic(p, `${AREA('NUTRICION')} .area-de-la-ficha__acciones button`, 'Suspender');
  await dialogoAbierto(p, `Suspender · Nutrición de ${NOMBRE_DEL_PENDIENTE}`);
  const escrito = 'Suspensión desde esta consola (sintético).';
  await p.type('dialog[open] textarea[id$="-fundamento"]', escrito);
  await p.type('dialog[open] textarea[id$="-mensaje"]', 'Tu acceso a Nutrición queda suspendido (sintético).');
  const otro = await sesionAdministrativa(d.otroAdmin.correo, secretoDelOtro);
  const area = (await pedir('GET', `/admin/professionals/${d.pendiente.id}`, { token: otro })).data.scopes.find((s) => s.scope === 'NUTRICION');
  await pedir('POST', `/admin/professionals/${d.pendiente.id}/scopes/NUTRICION/decisions`, {
    token: otro,
    cuerpo: { expectedVersion: area.version, decision: 'SUSPEND', rationale: 'Suspensión desde otra consola (sintético).', messageToProfessional: 'Tu acceso a Nutrición queda suspendido mientras revisamos (sintético).' },
  });
  await clic(p, 'dialog[open] .acciones button:not(.boton--secundario)', 'Suspender Nutrición');
  await p.waitForFunction(() => document.querySelector('dialog[open] .aviso')?.innerText.includes('La situación cambió'), { timeout: ESPERA, polling: 100 });
  const textoDelConflicto = await p.$eval('dialog[open]', (e) => e.innerText);
  assert.match(textoDelConflicto, /Cómo está ahora: Suspendida/);
  assert.match(textoDelConflicto, /Esta decisión ya no corresponde al estado del área/);
  assert.equal(await p.$eval('dialog[open] textarea[id$="-fundamento"]', (t) => t.value), escrito, 'lo escrito sigue ahí');
  assert.equal(await p.$eval('dialog[open] .acciones button:not(.boton--secundario)', (b) => b.disabled), true, 'no se confirma sobre la situación nueva');
  await captura(p, salida, 'administracion-conflicto-azul-noche');
  await clic(p, 'dialog[open] .acciones button.boton--secundario', 'Cerrar');
  await dialogoCerrado(p);
  await esperarSituacion(p, 'NUTRICION', 'Suspendida');
  await p.waitForFunction((n) => document.querySelector('.historial-administrativo li')?.innerText.includes(`${n} · Administración`), { timeout: ESPERA, polling: 100 }, NOMBRE_DEL_OTRO_ADMINISTRADOR);
  const suspendidas = await p.$$eval('.historial-administrativo li', (l) => l.filter((x) => x.innerText.includes('Área suspendida')).length);
  assert.equal(suspendidas, 1, 'una sola suspensión registrada: la de la otra consola');
  await p.$eval('.historial-administrativo', (e) => e.closest('section')?.scrollIntoView({ block: 'start' }));
  await capturaEnLosDosTemas(p, salida, 'administracion-historial');

  // 5. Volver a la lista la deja como estaba; la ficha del profesional que opera con la persona.
  await clic(p, '.volver-a-la-lista a', 'Volver a la lista');
  await esperarCamino(p, '/admin');
  await p.waitForFunction(() => document.querySelector('.lista-administrativa .metadatos')?.textContent.startsWith('2 profesionales'), { timeout: ESPERA, polling: 100 });
  assert.equal(await p.$eval('form[role="search"] input[type="search"]', (i) => i.value), prefijo, 'la lista vuelve con la búsqueda');
  const nombre = nombreDelProfesional('administracion');
  await clic(p, '.tabla--profesionales a', `de ${nombre}`);
  await p.waitForFunction((n) => document.querySelector('.ficha-administrativa h1')?.textContent === n, { timeout: ESPERA, polling: 100 }, nombre);

  // Suspender Nutrición con la sesión del profesional abierta: su próximo pedido de Nutrición ya no pasa; Entrenamiento sí.
  await pedir('GET', `/advisees/${d.ase.id}/nutrition/evaluations`, { token: tokenDelProfesional });
  const fundamento = 'Fundamento interno de la suspensión (sintético).';
  const mensaje = 'Suspendimos tu acceso a Nutrición mientras revisamos tu documentación (sintético).';
  await clic(p, `${AREA('NUTRICION')} .area-de-la-ficha__acciones button`, 'Suspender');
  await dialogoAbierto(p, `Suspender · Nutrición de ${nombre}`);
  assert.match(await p.$eval('dialog[open]', (e) => e.innerText), /La persona vinculada en Nutrición recibe un aviso con el efecto, sin los motivos/);
  await p.type('dialog[open] textarea[id$="-fundamento"]', fundamento);
  await p.type('dialog[open] textarea[id$="-mensaje"]', mensaje);
  await clic(p, 'dialog[open] .acciones button:not(.boton--secundario)', 'Suspender Nutrición');
  await dialogoCerrado(p);
  await esperarTexto(p, 'Suspender: decisión registrada. Se avisó al profesional y a 1 persona vinculada.');
  await pedir('GET', `/advisees/${d.ase.id}/nutrition/evaluations`, { token: tokenDelProfesional, esperado: 404 });
  await pedir('GET', `/advisees/${d.ase.id}/training/evaluations`, { token: tokenDelProfesional });
  const tokenDeLaPersona = await sesionPorApi(d.ase.correo, 'APK');
  const avisoALaPersona = (await pedir('GET', '/me/news', { token: tokenDeLaPersona, superficie: 'APK' })).data.find((n) => n.kind === 'PROFESSIONAL_ACCESS_SUSPENDED');
  assert.ok(avisoALaPersona, 'la persona recibe el aviso de la suspensión');
  assert.match(avisoALaPersona.body, /tiene suspendido el acceso a Nutrición en BE/);
  assert.ok(!avisoALaPersona.body.includes(fundamento) && !avisoALaPersona.body.includes(mensaje), 'sin los motivos');
  const avisoAlProfesional = (await pedir('GET', '/me/news', { token: tokenDelProfesional })).data.find((n) => n.kind === 'ADMINISTRATIVE_DECISION');
  assert.ok(avisoAlProfesional?.body.includes(mensaje), 'el profesional recibe el texto que se le comunica');
  assert.ok(!avisoAlProfesional.body.includes(fundamento), 'el fundamento interno no viaja');

  // Rehabilitar: vuelve a poder operar Nutrición, y la persona se entera de que depende de su vínculo y su autorización.
  await decidir(p, 'NUTRICION', 'Rehabilitar', `Rehabilitar · Nutrición de ${nombre}`, { fundamento: 'Documentación en regla (sintético).', confirmar: 'Rehabilitar Nutrición' });
  await esperarSituacion(p, 'NUTRICION', 'Puede operar');
  await pedir('GET', `/advisees/${d.ase.id}/nutrition/evaluations`, { token: tokenDelProfesional });
  const restablecido = (await pedir('GET', '/me/news', { token: tokenDeLaPersona, superficie: 'APK' })).data.find((n) => n.kind === 'PROFESSIONAL_ACCESS_RESTORED');
  assert.match(restablecido?.body ?? '', /solo si su vínculo con vos y tu autorización siguen vigentes/);

  // 6. Recargar reanuda la sesión: dentro de los 15 minutos, la ficha vuelve sin pedir el código (lo dice la API).
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForFunction((n) => document.querySelector('.ficha-administrativa h1')?.textContent === n, { timeout: ESPERA, polling: 100 }, nombre);

  // La seguridad del acceso: cuántos códigos quedan y cómo reemplazar el autenticador (sin mostrar ningún secreto).
  await clic(p, '.encabezado .navegacion a', 'Seguridad');
  await esperarCamino(p, '/admin/security');
  await esperarTexto(p, 'Quedan 10 códigos de recuperación sin usar.');
  await capturaEnLosDosTemas(p, salida, 'administracion-seguridad');

  // Cerrar la sesión: la entrada lo dice, la cookie de Administración se borra y la sesión común del profesional sigue.
  await clic(p, '.menu-de-cuenta__boton');
  await clic(p, '.menu-de-cuenta__opcion', 'Cerrar sesión');
  await esperarTexto(p, 'Cerraste la sesión de Administración.');
  await esperarCamino(p, '/admin');
  const alSalir = await contexto.cookies();
  assert.ok(!alSalir.some((c) => c.name === '__Secure-be-admin-reanudacion'), 'la cookie de Administración se borró');
  assert.ok(alSalir.some((c) => c.name === '__Secure-be-reanudacion'), 'la sesión común del profesional no se toca: son independientes');
  await capturaEnLosDosTemas(p, salida, 'administracion-entrada');

  // Volver a entrar: con el autenticador ya configurado, la contraseña lleva al código (con su plazo de 10 minutos). Un
  // código equivocado descuenta un intento; el código de este paso pudo usarse al configurar, así que va el del paso
  // siguiente, que el servidor acepta una sola vez.
  await escribir(p, '#adm-correo', d.admin.correo);
  await escribir(p, '#adm-contrasena', CREDENCIAL);
  await clic(p, 'form button[type="submit"]', 'Continuar');
  await esperarTexto(p, 'Código del autenticador');
  await esperarTexto(p, 'para completar este paso');
  await capturaEnLosDosTemas(p, salida, 'administracion-segundo-factor');
  await escribir(p, '#adm-codigo', '000000');
  await clic(p, 'form button[type="submit"]', 'Confirmar');
  await esperarTexto(p, 'El código no es válido o ya se usó. Te quedan 4 intentos.');
  await escribir(p, '#adm-codigo', codigoTotp(secreto, 30_000));
  await clic(p, 'form button[type="submit"]', 'Confirmar');
  await elemento(p, '.pendientes-de-administracion');
  await clic(p, '.menu-de-cuenta__boton');
  await clic(p, '.menu-de-cuenta__opcion', 'Cerrar sesión');
  await esperarTexto(p, 'Cerraste la sesión de Administración.');
}

/** Una captura en Claro y otra en Azul noche: el tema se cambia como lo cambia el menú (el atributo de la página). */
async function enLosDosTemas(p, salida, nombre) {
  const original = await p.evaluate(() => document.documentElement.dataset.tema);
  for (const tema of ['claro', 'azul-noche']) {
    await p.evaluate((t) => {
      document.documentElement.dataset.tema = t;
    }, tema);
    await captura(p, salida, `${nombre}-${tema}`);
  }
  await p.evaluate((t) => {
    document.documentElement.dataset.tema = t;
  }, original);
}

/** «Analizar» de la persona, en el período de la comparación, con la fecha elegida. */
const analizarLaComparacion = (d, metricas, fecha) =>
  `${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}&vista=analizar&m=${metricas}&desde=${d.comparacion.desde}&hasta=${d.comparacion.hoy}&f=${fecha}`;

/** Abre «Ver origen» de la primera métrica de la lectura y espera que se lean las comidas del día. */
async function verOrigen(p, comidas) {
  await clic(p, '.panel-de-lectura button.boton--enlace', 'Ver origen');
  await p.waitForFunction((n) => document.querySelectorAll('.fuentes-del-dato__lista .fuente:not(.fuente--sin-leer)').length === n, { timeout: ESPERA, polling: 100 }, comidas);
  return p.$eval('.origen-del-dato__cuerpo', (e) => e.innerText);
}

/**
 * DL-158 (WP-NUTRICION-COMPARACION): las calorías y las proteínas de una semana, cada panel con sus tres capas: lo
 * registrado (la línea se corta en los días sin registros), el objetivo del profesional en dos escalones (cambió
 * anteayer) y lo indicado en el plan (un rombo por día que lo tiene: los días con registros y hoy; los días sin registros
 * de antes de activar el plan, no). Los rombos están a la altura del valor de la API, leída con las marcas del eje. La
 * lectura de ayer, la de anteayer y la de hoy, la tabla y «Ver origen» dicen lo mismo que la API. En Claro y Azul noche.
 */
async function comparacion({ p, d, salida }) {
  const c = d.comparacion;
  const C = dominio.CAPAS_DE_LA_COMPARACION;
  const determinados = (r) => r.prescribed.planned.days.filter((x) => x.state === 'DETERMINED' && x.date >= c.desde && x.date <= c.hoy);
  const delDia = (r, fecha) => r.prescribed.planned.days.find((x) => x.date === fecha);
  assert.ok(determinados(c.energia).length >= 4, 'la API tiene días con indicado: los cuatro con registros y hoy');
  await entrar(p, d.pro.correo);
  await p.goto(analizarLaComparacion(d, 'nutricion.energia,nutricion.proteinas', c.ayer), { waitUntil: 'networkidle2' });

  // Dos paneles, cada uno con sus rombos: uno por día con indicado, ni uno más.
  const esperados = [determinados(c.energia).length, determinados(c.proteinas).length];
  await p
    .waitForFunction(
      (n) => {
        const paneles = [...document.querySelectorAll('.paneles-sincronizados figure.grafico')];
        // Los rombos de cada panel y las marcas del eje vertical (se dibujan después de medir: se esperan también).
        const conMarcas = (f) => [...f.querySelectorAll('svg text')].filter((t) => /^[\d.,]+$/.test(t.textContent.trim())).length >= 2;
        return paneles.length === 2 && paneles.every((f, i) => f.querySelectorAll('.grafico__indicado path').length === n[i] && conMarcas(f));
      },
      { timeout: ESPERA, polling: 100 },
      esperados,
    )
    .catch(async (e) => {
      // Si no llega, el error dice qué había: los rombos de cada panel y los textos del dibujo.
      const visto = await p.evaluate(() => [...document.querySelectorAll('.paneles-sincronizados figure.grafico')].map((f) => ({ rombos: f.querySelectorAll('.grafico__indicado path').length, textos: [...f.querySelectorAll('svg text')].map((t) => t.textContent).slice(0, 16) })));
      throw new Error(`${e.message}; se esperaban ${JSON.stringify(esperados)} rombos; se vio ${JSON.stringify(visto)}`);
    });
  const dibujo = await p.evaluate(() => {
    const centro = (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const [calorias] = document.querySelectorAll('.paneles-sincronizados figure.grafico');
    const marcas = [...calorias.querySelectorAll('svg text')]
      .filter((t) => /^[\d.,]+$/.test(t.textContent.trim()))
      .map((t) => ({ valor: Number(t.textContent.replace(/\./g, '').replace(',', '.')), y: centro(t).y }))
      .filter((m) => Number.isFinite(m.valor));
    return {
      leyendas: [...document.querySelectorAll('.paneles-sincronizados figure.grafico figcaption')].map((f) => f.innerText),
      rombos: [...calorias.querySelectorAll('.grafico__indicado path')].map(centro),
      // Los puntos registrados que se pueden elegir, con su centro (el círculo de cada uno).
      puntos: [...calorias.querySelectorAll('g.grafico__elegible circle:first-child')].map(centro),
      lineas: calorias.querySelectorAll('.recharts-line').length,
      marcas,
      textos: [...calorias.querySelectorAll('svg text')].map((t) => t.textContent).slice(0, 16),
    };
  });
  for (const leyenda of dibujo.leyendas) for (const capa of ['Registrado', C.objetivo, C.indicado]) assert.ok(leyenda.includes(capa), `la leyenda del panel nombra «${capa}»: ${leyenda}`);
  // Los rombos: todos a una misma altura (el plan indica lo mismo cada día) y, el día en que se registraron las dos
  // comidas con las porciones del plan, a la altura del punto registrado (los dos valen lo mismo en la API).
  const ys = dibujo.rombos.map((r) => r.y);
  assert.ok(Math.max(...ys) - Math.min(...ys) < 1, `los rombos están a la misma altura (${ys.map((y) => y.toFixed(1)).join(', ')})`);
  const completo = c.energia.recorded.points.find((pt) => pt.date === c.haceSeis);
  assert.equal(completo.value, delDia(c.energia, c.haceSeis).value, 'hace seis días, lo registrado y lo indicado valen lo mismo en la API');
  const xDelDia = dibujo.rombos.map((r) => r.x).sort((x, y) => x - y)[0];
  const punto = dibujo.puntos.reduce((mejor, pt) => (Math.abs(pt.x - xDelDia) < Math.abs(mejor.x - xDelDia) ? pt : mejor));
  assert.ok(Math.abs(punto.x - xDelDia) < 1 && Math.abs(punto.y - ys[0]) < 1.5, `el primer rombo rodea al punto registrado de ese día (rombo ${xDelDia.toFixed(1)}, ${ys[0].toFixed(1)}; punto ${punto.x.toFixed(1)}, ${punto.y.toFixed(1)})`);
  // Y su valor, leído con las marcas del eje vertical.
  assert.ok(dibujo.marcas.length >= 2, `el eje vertical tiene al menos dos marcas con valor; textos del dibujo: ${JSON.stringify(dibujo.textos)}`);
  const [a, b] = [dibujo.marcas[0], dibujo.marcas[dibujo.marcas.length - 1]];
  const valorEn = (y) => a.valor + ((y - a.y) * (b.valor - a.valor)) / (b.y - a.y);
  const tolerancia = Math.abs(b.valor - a.valor) * 0.02;
  const valores = determinados(c.energia).map((x) => x.value);
  for (const r of dibujo.rombos) assert.ok(valores.some((v) => Math.abs(valorEn(r.y) - v) <= tolerancia), `el rombo está a la altura de lo indicado (leído ${valorEn(r.y).toFixed(1)}; API ${valores.join(', ')})`);
  // La línea de lo registrado se corta en los días sin registros: un tramo por cada racha de días con valor.
  const tramos = new Set(c.energia.recorded.points.filter((pt) => pt.value !== null && !pt.partialBucket).map((pt) => pt.segment)).size;
  assert.ok(tramos >= 2, 'los datos tienen huecos');
  assert.equal(dibujo.lineas, tramos, 'una línea por tramo: el hueco no se une');

  // La lectura de ayer: el objetivo que regía (la versión de anteayer), lo indicado con su versión y su día tipo, y la regla.
  const indicadoDeAyer = dominio.indicadoDelDiaEnPalabras(delDia(c.energia, c.ayer), 'ENERGY', () => 'versión 1 del plan');
  await p.waitForFunction((t) => document.querySelector('.panel-de-lectura')?.innerText.includes(t), { timeout: ESPERA, polling: 100 }, indicadoDeAyer);
  const ayer = await p.$eval('.panel-de-lectura', (e) => e.innerText);
  assert.ok(ayer.includes('700 kcal por día · rige desde el'), 'el objetivo de calorías de ayer es el de la versión de anteayer');
  assert.ok(ayer.includes('24 g por día · rige desde el'), 'y el de las proteínas, en gramos');
  assert.ok(ayer.includes(dominio.indicadoDelDiaEnPalabras(delDia(c.proteinas, c.ayer), 'PROTEIN', () => 'versión 1 del plan')), 'lo indicado de las proteínas');
  assert.ok(ayer.includes(C.regla), 'con la regla del indicado');
  await enLosDosTemas(p, salida, 'comparacion-lectura-ayer-1440');

  // Anteayer: sin registros y antes de activar el plan: ni registrado ni indicado, y se dice por qué.
  await p.goto(analizarLaComparacion(d, 'nutricion.energia,nutricion.proteinas', c.anteayer), { waitUntil: 'networkidle2' });
  await p.waitForFunction((t) => document.querySelector('.panel-de-lectura')?.innerText.includes(t), { timeout: ESPERA, polling: 100 }, 'Sin indicado del día: no regía ningún plan.');
  assert.ok((await p.$eval('.panel-de-lectura', (e) => e.innerText)).includes('Sin registros en esta fecha.'), 'un día sin registros no es un cero');

  // Hoy: en curso y sin registros, con el indicado del plan que rige.
  await p.goto(analizarLaComparacion(d, 'nutricion.energia,nutricion.proteinas', c.hoy), { waitUntil: 'networkidle2' });
  await p.waitForFunction((t) => document.querySelector('.panel-de-lectura')?.innerText.includes(t), { timeout: ESPERA, polling: 100 }, dominio.indicadoDelDiaEnPalabras(delDia(c.energia, c.hoy), 'ENERGY', () => 'versión 1 del plan'));

  // La tabla: las columnas de las dos capas y una fila por fecha con algo dibujado, también hoy, que no tiene registros.
  await clic(p, 'button.boton--enlace', 'Tabla de datos');
  await elemento(p, '.tabla-de-datos table');
  const tabla = await p.$eval('.tabla-de-datos table', (t) => ({ encabezados: [...t.querySelectorAll('thead th')].map((x) => x.innerText.trim()), filas: [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((x) => x.innerText.trim())) }));
  for (const columna of [`${C.objetivo} (por día)`, `${C.indicado} (kcal)`, `${C.indicado} (g)`]) assert.ok(tabla.encabezados.includes(columna), `la tabla tiene la columna «${columna}»: ${tabla.encabezados.join(' | ')}`);
  const conAlgo = new Set([...c.energia.recorded.points.filter((pt) => pt.date >= c.desde).map((pt) => pt.date), ...determinados(c.energia).map((x) => x.date)]);
  assert.equal(tabla.filas.length, conAlgo.size, 'una fila por fecha con un punto o un rombo');
  const [deHoy] = tabla.filas;
  assert.deepEqual(deHoy.slice(1), ['Sin registros', '700 kcal', dominio.indicadoDelDiaEnCelda(delDia(c.energia, c.hoy), 'ENERGY'), 'Sin registros', '24 g', dominio.indicadoDelDiaEnCelda(delDia(c.proteinas, c.hoy), 'PROTEIN')], 'hoy: sin registros, con el objetivo y lo indicado');
  assert.ok(tabla.filas.some((f) => f.includes(dominio.indicadoDelDiaEnCelda(delDia(c.energia, c.ayer), 'ENERGY'))), 'ayer, el mismo indicado que la lectura');
  // La captura muestra la tabla: queda debajo de los gráficos.
  await p.$eval('.tabla-de-datos', (e) => e.scrollIntoView({ block: 'start' }));
  await enLosDosTemas(p, salida, 'comparacion-tabla-1440');

  // «Ver origen» de ayer: cada comida con lo indicado de su opción, y el día con el suyo.
  await p.goto(analizarLaComparacion(d, 'nutricion.energia,nutricion.proteinas', c.ayer), { waitUntil: 'networkidle2' });
  const fuentes = (fecha) => c.energia.recorded.points.find((pt) => pt.date === fecha).sources.map((s) => s.id);
  const origen = await verOrigen(p, fuentes(c.ayer).length);
  for (const id of fuentes(c.ayer)) {
    const comida = c.energia.prescribed.planned.meals.find((m) => m.recordId === id);
    assert.ok(origen.includes(dominio.indicadoDeLaComidaEnPalabras(comida, 'ENERGY')), 'cada comida dice lo indicado de su opción');
  }
  assert.ok(origen.includes(`${C.indicado} para el día`) && origen.includes(dominio.indicadoDelDiaEnCelda(delDia(c.energia, c.ayer), 'ENERGY')), 'y el día, el suyo');
  await enLosDosTemas(p, salida, 'comparacion-origen-ayer-1440');

  // Hace tres días: la comida diferente no es una opción del plan y no tiene indicado.
  await p.goto(analizarLaComparacion(d, 'nutricion.energia,nutricion.proteinas', c.haceTres), { waitUntil: 'networkidle2' });
  const conDiferente = await verOrigen(p, fuentes(c.haceTres).length);
  assert.ok(conDiferente.includes('Comida diferente: no es una opción del plan y no tiene indicado.'), 'la comida diferente lo dice');
}

/**
 * DL-158: con un plan que deja elegir el almuerzo, ningún día tiene un indicado del día: no hay rombos, y debajo del
 * gráfico se dice por qué y dónde está lo de cada comida. La lectura de ayer dice qué comida tiene opciones y que BE no
 * elige ni suma; «Ver origen» dice lo indicado de la opción que se registró. En Claro y Azul noche.
 */
async function comparacionConOpciones({ p, d, salida }) {
  const c = d.comparacion;
  const C = dominio.CAPAS_DE_LA_COMPARACION;
  const dias = c.energia.prescribed.planned.days.filter((x) => x.date >= c.desde && x.date <= c.hoy);
  assert.ok(dias.every((x) => x.state === 'UNDETERMINED'), 'con alternativas, la API no da un indicado del día');
  await entrar(p, d.pro.correo);
  await p.goto(analizarLaComparacion(d, 'nutricion.energia', c.ayer), { waitUntil: 'networkidle2' });
  await elemento(p, '.grafico__lienzo');
  const nota = dominio.sinIndicadoParaDibujar(dias);
  await p.waitForFunction((t) => document.querySelector('.grafico__nota-del-indicado')?.innerText.includes(t), { timeout: ESPERA, polling: 100 }, nota);
  assert.equal(await p.$$eval('.grafico__indicado path', (es) => es.length), 0, 'ningún rombo: no se elige ni se suma una opción');
  const leyenda = await p.$eval('.paneles-sincronizados figure.grafico figcaption', (f) => f.innerText);
  assert.ok(leyenda.includes(C.objetivo) && !leyenda.includes(C.indicado), 'la leyenda nombra lo que se dibuja');
  const ayer = dias.find((x) => x.date === c.ayer);
  await p.waitForFunction((t) => document.querySelector('.panel-de-lectura')?.innerText.includes(t), { timeout: ESPERA, polling: 100 }, dominio.motivoSinIndicadoDelDia(ayer));
  assert.ok(dominio.motivoSinIndicadoDelDia(ayer).includes(`${c.almuerzo} tiene 2 opciones`), 'dice qué comida y cuántas opciones');
  await enLosDosTemas(p, salida, 'comparacion-con-opciones-lectura-1440');
  const fuentes = c.energia.recorded.points.find((pt) => pt.date === c.ayer).sources.map((s) => s.id);
  const origen = await verOrigen(p, fuentes.length);
  for (const id of fuentes) {
    const comida = c.energia.prescribed.planned.meals.find((m) => m.recordId === id);
    assert.equal(comida.state, 'DETERMINED', 'la opción registrada tiene lo suyo');
    assert.ok(origen.includes(dominio.indicadoDeLaComidaEnPalabras(comida, 'ENERGY')), 'y el origen lo dice');
  }
  // El día no tiene un indicado: el origen lo dice con su motivo, sin un número.
  assert.ok(origen.includes(`${C.indicado} para el día`) && origen.includes(dominio.motivoCortoSinIndicadoDelDia(ayer)), 'el día dice por qué no tiene un indicado');
  await enLosDosTemas(p, salida, 'comparacion-con-opciones-origen-1440');
}

// ─── La corrida ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const TODOS = { sesion, pistas, borrador, conflicto, primerPlan, retorno, grafico, primeraInvitacion, areaSugerida, sesionRevocada, accesoRevocado, faltaUnaParte, completitud, evidencia, administracion, comparacion, comparacionConOpciones };

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
