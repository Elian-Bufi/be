// Los recorridos de navegador (bloque 6 del encargo de consolidación, 2026-10-19): Chrome contra el website y la API
// locales, con lo que el profesional hace todos los días. Cada recorrido tiene sus propias cuentas y datos (preparar.mjs)
// y su propio contexto de navegador (cookies y pestañas aparte): no depende de otro ni deja nada que otro use.
// Comprueban comportamiento observable: la dirección, lo que dice la pantalla, lo que guardó el servidor, la cookie, el
// árbol de accesibilidad y, en el gráfico, dónde quedó dibujado cada punto.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';
import { CREDENCIAL, dominio, pedir, sesion as sesionPorApi, verificarSegundoFactor } from './api.mjs';
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

/**
 * RP-01 (DL-188): la ficha y las áreas ya no tienen «Actualizar»; vuelven a leer al volver a la pestaña del navegador, si
 * pasaron 15 segundos desde la última lectura. Se simula la vuelta: la página ve la pestaña visible otra vez.
 */
async function volverALaPestana(p) {
  await pausa(16_000);
  await p.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/**
 * Un clic de verdad (el mouse va al centro del elemento), no un `click()` de JavaScript. Revisión del PR de RP-06 (DL-188):
 * lo que llega después de pintarse la página (el «Reparto por comida», que lee el cálculo del objetivo, arriba de las
 * comidas) puede correr el elemento fuera de la ventana entre el desplazamiento y el clic. Puppeteer lo dice antes de
 * mover el mouse («Node is either not clickable…»): no hubo clic, y se busca de nuevo, ya quieta la página.
 */
async function clic(p, selector, texto = null) {
  for (let intento = 1; ; intento++) {
    const e = await elemento(p, selector, texto);
    try {
      await e.click();
      return e;
    } catch (error) {
      if (intento >= 3 || !/not clickable|detached/i.test(String(error?.message ?? error))) throw error;
      await pausa(400);
    }
  }
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
  await sinPedirElSegundoFactor(p);
}

/**
 * DL-177 (2026-11-18): el profesional entra solo con su contraseña. Antes (UF-11), la compuerta de `/pro` pedía acá el
 * código del autenticador; ahora se comprueba que no pide ni ofrece nada: ni el código, ni la recuperación, ni configurar.
 */
async function sinPedirElSegundoFactor(p) {
  await p.waitForNetworkIdle({ idleTime: 300, timeout: ESPERA }).catch(() => {});
  const pide = await p.evaluate(
    () =>
      Boolean(document.querySelector('#mfa-codigo, #mfa-recuperacion, #mfa-codigo-nuevo, .mfa-empezar')) ||
      ['Confirmá que sos vos', 'Configurá tu segundo factor', 'Volvé a entrar para configurar tu segundo factor'].some((t) => document.body.innerText.includes(t)),
  );
  assert.equal(pide, false, 'el profesional entra con su contraseña: /pro no pide ni ofrece el autenticador (DL-177)');
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
  await sinPedirElSegundoFactor(p);
  const vuelta = ruta(p).parametros;
  assert.equal(vuelta.get('id'), d.ase.id, 'vuelve a la misma persona');
  assert.equal(vuelta.get('vista'), 'linea', 'con la misma vista');
  assert.equal(vuelta.get('p'), '30', 'y el mismo período');
  await p.waitForFunction((n) => document.querySelector('#titulo-asesorado')?.textContent?.includes(n), { timeout: ESPERA }, d.ase.nombre);
}

/**
 * DL-146 y bloque 5: la pista con mouse, teclado, Escape, bordes, zoom, tacto y árbol de accesibilidad. Desde RP-01 (DL-188)
 * el encabezado no tiene «Actualizar»: se prueba con la pista de «Pedir información», en el mismo renglón.
 */
async function pistas({ contexto, p, d, salida }) {
  const TEXTO = dominio.COPY_PISTAS.ficha.pedirInformacion;
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  const BOTON = '.marco-de-la-ficha .pista > button[data-pedir-informacion]';
  const GLOBO = '.marco-de-la-ficha .pista:has(> button[data-pedir-informacion]) .pista__globo';
  const boton = await elemento(p, BOTON, 'Pedir información');
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

  // El árbol de accesibilidad: el botón se llama «Pedir información» y la pista es su descripción, aunque no esté a la vista.
  const nodo = await p.accessibility.snapshot({ root: boton, interestingOnly: false });
  assert.equal(nodo?.name, 'Pedir información');
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

  // Teclado: al llegar con el teclado aparece enseguida, el foco se ve y Escape la cierra sin mover el foco. «Pedir
  // información» va justo antes de «Más».
  await p.focus('.marco-de-la-ficha .menu-de-acciones__boton');
  await p.keyboard.down('Shift');
  await p.keyboard.press('Tab');
  await p.keyboard.up('Shift');
  assert.ok(await p.$eval(BOTON, (b) => b === document.activeElement && b.matches(':focus-visible')), 'el teclado llega a «Pedir información»');
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
  assert.ok(await p.$eval(BOTON, (b) => b === document.activeElement), 'el foco sigue en «Pedir información»');

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
  // ED-16 (C11): «Pedir información» está a la vista; en «Más» queda la nota de coordinación.
  await elemento(p, '.marco-de-la-ficha [data-pedir-informacion]', 'Pedir información');
  await elemento(p, '.marco-de-la-ficha .menu-de-acciones[data-abierto] .menu-de-acciones__accion');
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
  await (await elemento(p, BOTON, 'Pedir información')).hover();
  await pausa(700);
  assert.ok(await visible(), 'al 200 %, la pista aparece');
  await dentroYSinTapar('zoom');
  await captura(p, salida, 'ficha-pista-al-200');
  await p.mouse.move(5, 5);
  await pausa(300);

  // Tacto: tocar «Pedir información» no deja una pista pegada encima del contenido. El botón lleva al pedido: para mirar
  // la pista en la misma página, el clic se corta antes de llegar a React (la pista escucha el puntero y el foco, no el
  // clic). Si el toque navegara, la ficha ya no estaría y la prueba no probaría nada (revisión del PR de RP-01).
  const tactil = await contexto.newPage();
  await tactil.setViewport({ width: 1024, height: 768, hasTouch: true, isMobile: true });
  await tactil.goto(p.url(), { waitUntil: 'networkidle2' });
  await elemento(tactil, BOTON, 'Pedir información');
  await hidratado(tactil, BOTON);
  await tactil.$eval(BOTON, (b) => b.addEventListener('click', (e) => e.stopPropagation()));
  const centro = await tactil.$eval(BOTON, (b) => {
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await tactil.touchscreen.tap(centro.x, centro.y);
  await pausa(900);
  assert.equal(ruta(tactil).camino, '/pro/advisees', 'el toque no salió de la ficha: la pista se mira donde se tocó');
  assert.ok(!(await tactil.$eval(GLOBO, (g) => !g.hidden && getComputedStyle(g).visibility !== 'hidden')), 'con el dedo, la pista no queda abierta');
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

/**
 * Abre la comida `n` del editor, si está plegada, y espera a que quede abierta. El clic va al centro del botón: si la
 * página todavía se acomoda (lecturas que llegan después de volver atrás), el clic puede caer donde el botón ya no está.
 * Por eso se comprueba `data-abierta` y se reintenta, y cada reintento se anota para que se vea en la CI (salidaSegura
 * falló dos veces el 12/11 con la comida 2 plegada: el clic no la abrió).
 */
async function abrirComida(p, n) {
  const comida = `.comida-del-editor[data-comida="${n}"]`;
  for (let intento = 1; intento <= 3; intento++) {
    if (await p.$(`${comida}[data-abierta]`)) return;
    await clic(p, `${comida} .comida-del-plan__boton`);
    try {
      await p.waitForSelector(`${comida}[data-abierta]`, { timeout: 5000 });
      return;
    } catch {
      console.log(`  (abrirComida: la comida ${n} sigue plegada tras el clic ${intento}; dirección ${p.url()})`);
    }
  }
  await p.waitForSelector(`${comida}[data-abierta]`, { timeout: ESPERA });
}

async function renombrarComida(p, n, nombre) {
  const comida = `.comida-del-editor[data-comida="${n}"]`;
  // Las comidas del editor empiezan plegadas: su menú «Más» aparece al abrirla.
  await abrirComida(p, n);
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

/**
 * ED-02 (WP-EDITORES-PROFESIONAL; TEST-EDP-003): un enlace interno con cambios sin guardar guarda antes de salir o
 * pregunta. Con un cambio que se puede guardar, se sale con la respuesta del servidor y el cambio está al volver; con
 * algo que no se puede guardar, el cuadro «Tenés cambios sin guardar», con «Seguir editando» enfocado.
 */
async function salidaSegura({ p, d, salida }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="borrador"]');
  await esperarCamino(p, '/pro/advisees/nutrition');
  await elemento(p, '.comida-del-editor[data-comida="1"]');
  // Un cambio y, antes de la pausa del autoguardado, un enlace de la barra: se guarda antes de salir.
  const NUEVO = 'Desayuno antes de salir';
  await renombrarComida(p, 1, NUEVO);
  await clic(p, '.navegacion a', 'Mis recetas');
  await esperarCamino(p, '/pro/recipes');
  // Al volver, el cambio está: se guardó con la respuesta del servidor antes de salir.
  await p.goBack({ waitUntil: 'networkidle2' });
  await esperarCamino(p, '/pro/advisees/nutrition');
  await elemento(p, '.comida-del-editor[data-comida="1"]', NUEVO);
  // Algo que no se puede guardar (una comida sin nombre): el cuadro, con «Seguir editando» enfocado; no se sale.
  const segunda = '.comida-del-editor[data-comida="2"]';
  await abrirComida(p, 2);
  await clic(p, `${segunda} .comida-del-editor__acciones .menu-de-acciones__boton`);
  await clic(p, `${segunda} .menu-de-acciones[data-abierto] .menu-de-acciones__accion`, 'Cambiar el nombre');
  await p.waitForFunction(() => document.activeElement instanceof HTMLInputElement, { timeout: ESPERA });
  await p.keyboard.down('Control');
  await p.keyboard.press('KeyA');
  await p.keyboard.up('Control');
  await p.keyboard.press('Backspace');
  await clic(p, '.navegacion a', 'Mis recetas');
  await elemento(p, 'dialog[open][data-salida-segura]');
  assert.equal(await p.evaluate(() => document.activeElement?.hasAttribute('data-seguir-editando')), true, '«Seguir editando» tiene el foco');
  await captura(p, salida, 'salida-segura-cuadro-1440');
  await clic(p, 'dialog[open] [data-seguir-editando]');
  await p.waitForFunction(() => !document.querySelector('dialog[open][data-salida-segura]'), { timeout: ESPERA });
  assert.equal(ruta(p).camino, '/pro/advisees/nutrition', '«Seguir editando» no sale');
  // «Salir sin guardar» sale.
  await clic(p, '.navegacion a', 'Mis recetas');
  await clic(p, 'dialog[open] [data-salir-sin-guardar]');
  await esperarCamino(p, '/pro/recipes');
}

/**
 * ED-01 (WP-EDITORES-PROFESIONAL; TEST-EDP-002): descartar la versión en preparación. El cuadro abre con «Cancelar»
 * enfocado; Escape no toca nada; confirmar la descarta, y la sección vuelve a ofrecer crear el plan y empezar desde una
 * plantilla.
 */
async function descartar({ p, d, salida }) {
  const D = dominio.COPY_DESCARTAR_LA_VERSION;
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="borrador"]');
  await esperarCamino(p, '/pro/advisees/nutrition');
  await elemento(p, '.comida-del-editor[data-comida="1"]');
  const abrirElCuadro = async () => {
    await clic(p, '#mas-de-la-version');
    await clic(p, '.menu-de-acciones[data-abierto] .menu-de-acciones__accion', D.accion);
    await elemento(p, 'dialog[open] [data-cuadro-del-descarte]');
  };
  await abrirElCuadro();
  // Es la primera versión del plan: la número 1, sin una vigente.
  await esperarTexto(p, D.titulo(1));
  await esperarTexto(p, D.primera);
  // La acción de efecto nunca es la opción por defecto: el foco está en «Cancelar».
  assert.equal(await p.evaluate(() => document.activeElement?.textContent?.trim()), D.cancelar);
  await captura(p, salida, 'descartar-cuadro-1440');
  // Escape es «Cancelar»: el cuadro se cierra y la versión sigue.
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => !document.querySelector('dialog[open] [data-cuadro-del-descarte]'), { timeout: ESPERA });
  await elemento(p, '.comida-del-editor[data-comida="1"]');
  // Confirmar la descarta: sin versión en preparación, vuelven «Crear» y «Empezar desde una plantilla».
  await abrirElCuadro();
  await clic(p, 'dialog[open] .boton--peligro', D.confirmar(1));
  await esperarTexto(p, D.descartada(null));
  await elemento(p, '[data-crear-version]');
  // El foco va a «Crear una nueva versión»: el «⋯» que abrió el cuadro ya no está (revisión adversaria de la etapa 1).
  await p.waitForFunction(() => document.activeElement?.hasAttribute('data-crear-version'), { timeout: ESPERA, polling: 100 });
  await elemento(p, '[data-empezar-desde-plantilla]');
  assert.equal(await p.$('.editor-del-plan'), null, 'ya no hay versión en preparación');
  await captura(p, salida, 'descartar-hecho-1440');
}

/**
 * ED-07 (WP-EDITORES-PROFESIONAL; TEST-EDP-008): «Ir a corregir» lleva a su lugar, con el foco ahí. Con una comida sin
 * nombre, «Antes de activar» lo lista; «Ir a corregir» cierra el cuadro y deja el foco en el campo del nombre (la revisión
 * adversaria de la etapa 1 encontró que el cierre del cuadro se lo devolvía a «Revisar y activar…»).
 */
async function irACorregir({ p, d, salida }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="borrador"]');
  await esperarCamino(p, '/pro/advisees/nutrition');
  const segunda = '.comida-del-editor[data-comida="2"]';
  await elemento(p, segunda);
  // La comida 2, sin nombre: el campo queda a la vista (sin nombre no se puede guardar).
  await abrirComida(p, 2);
  await clic(p, `${segunda} .comida-del-editor__acciones .menu-de-acciones__boton`);
  await clic(p, `${segunda} .menu-de-acciones[data-abierto] .menu-de-acciones__accion`, 'Cambiar el nombre');
  await p.waitForFunction(() => document.activeElement instanceof HTMLInputElement, { timeout: ESPERA });
  const campo = await p.evaluate(() => document.activeElement.id);
  await p.keyboard.down('Control');
  await p.keyboard.press('KeyA');
  await p.keyboard.up('Control');
  await p.keyboard.press('Backspace');
  // «Revisar y activar…» abre el cuadro, que lista el nombre que falta con «Ir a corregir».
  await clic(p, '[data-revisar-y-activar]');
  await elemento(p, 'dialog[open] [data-antes-de-activar]');
  await clic(p, 'dialog[open] [data-impiden] button', 'Ir a corregir');
  await p.waitForFunction(() => !document.querySelector('dialog[open] [data-antes-de-activar]'), { timeout: ESPERA });
  // El foco queda en el campo del nombre, no en «Revisar y activar…».
  await p
    .waitForFunction((id) => document.activeElement?.id === id, { timeout: ESPERA, polling: 100 }, campo)
    .catch(async () => assert.fail(`el foco quedó en «${await p.evaluate(() => document.activeElement?.textContent?.trim() || document.activeElement?.id)}», no en el campo del nombre`));
  await captura(p, salida, 'ir-a-corregir-1440');
}

/**
 * Dentro de la página, sin tocar la API ni la red del navegador (como `simularFallas`): cada guardado del borrador de
 * Nutrición (PATCH, API-NUT-10) se anota con lo que respondió, y al primero se le hace `que`:
 * - 'perder': llega al servidor, que lo guarda, pero la página recibe un error de red: la respuesta se perdió;
 * - '503': no sale, y la página recibe un 503, como si la API no hubiera podido.
 * Dura lo que el documento abierto: recargar lo saca.
 */
async function intervenirElGuardado(p, que) {
  await p.evaluate(
    (api, que) => {
      const original = window.fetch.bind(window);
      window.__beGuardados = [];
      let pendiente = true;
      window.fetch = async (entrada, init) => {
        const url = new URL(typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url, location.href);
        const metodo = String(init?.method ?? (entrada instanceof Request ? entrada.method : 'GET')).toUpperCase();
        if (metodo !== 'PATCH' || url.origin !== api || !/^\/api\/v1\/nutrition\/plans\/[^/]+$/.test(url.pathname)) return original(entrada, init);
        if (pendiente && que === '503') {
          pendiente = false;
          window.__beGuardados.push(503);
          const cuerpo = JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Falla simulada por el recorrido.' } });
          return new Response(cuerpo, { status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
        }
        const respuesta = await original(entrada, init);
        window.__beGuardados.push(respuesta.status);
        if (pendiente && que === 'perder') {
          pendiente = false;
          // El servidor ya contestó: se lee entera y la página nunca la ve.
          await respuesta.text();
          throw new TypeError('Failed to fetch');
        }
        return respuesta;
      };
    },
    API,
    que,
  );
}

/** Desde la ficha, el borrador de Nutrición, con su primera comida a la vista. */
async function abrirElBorrador(p, d) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="borrador"]');
  await esperarCamino(p, '/pro/advisees/nutrition');
  await elemento(p, '.comida-del-editor[data-comida="1"]');
}

/**
 * ED-61 (WP-EDITORES-PROFESIONAL; TEST-EDP-048): se pierde la respuesta de un guardado que el servidor sí guardó, el
 * profesional sigue escribiendo y el guardado siguiente da 409. El editor relee la versión, reconoce lo que mandó y
 * termina guardado, sin el aviso de conflicto y sin perder nada. Con la versión real del servidor: lo releído, sin los
 * identificadores que puso el servidor, tiene que coincidir con el cuerpo que mandó el editor (la revisión adversaria de
 * la etapa 1 notó que eso solo estaba probado con estructuras sintéticas).
 */
async function respuestaPerdida({ p, d, salida }) {
  await abrirElBorrador(p, d);
  await intervenirElGuardado(p, 'perder');
  // El aviso del conflicto no aparece nunca, ni por un instante.
  await p.evaluate((texto) => {
    window.__beVioElConflicto = false;
    new MutationObserver(() => {
      if (document.body.innerText.includes(texto)) window.__beVioElConflicto = true;
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }, dominio.COPY_GUARDADO.conflictoCorto);
  const ANTES = 'Desayuno de la respuesta perdida';
  const DESPUES = 'Almuerzo escrito después';
  await renombrarComida(p, 1, ANTES);
  // El guardado llegó, pero la pantalla no lo sabe: la barra dice que no hubo respuesta.
  await p.waitForFunction(() => window.__beGuardados.length >= 1 && document.querySelector('.editor-del-plan__estado')?.dataset.estado === 'fallo', { timeout: ESPERA, polling: 100 });
  await esperarTexto(p, dominio.COPY_GUARDADO.falloEnLaBarra.SIN_RESPUESTA);
  await renombrarComida(p, 2, DESPUES);
  // El guardado siguiente usa la versión de antes del perdido: 409. El editor relee, reconoce lo suyo y manda lo de después.
  await p
    .waitForFunction(
      () => {
        const g = window.__beGuardados;
        const i = g.indexOf(409);
        const e = document.querySelector('.editor-del-plan__estado');
        return i > 0 && g.slice(i + 1).includes(200) && e?.dataset.estado === 'guardado' && e.textContent.includes('a las');
      },
      { timeout: 60_000, polling: 200 },
    )
    .catch(async () => assert.fail(`no terminó guardado: respuestas ${await p.evaluate(() => window.__beGuardados.join(', '))}; la barra dice «${await p.evaluate(() => document.querySelector('.editor-del-plan__estado')?.textContent)}»`));
  assert.equal(await p.evaluate(() => window.__beVioElConflicto), false, 'apareció el aviso de conflicto: tomó por ajeno lo que mandó esta pantalla');
  await captura(p, salida, 'respuesta-perdida-guardado-1440');
  // Lo escrito antes y después del guardado perdido quedó en el servidor.
  await p.reload({ waitUntil: 'networkidle2' });
  await elemento(p, '.comida-del-editor[data-comida="1"]', ANTES);
  await elemento(p, '.comida-del-editor[data-comida="2"]', DESPUES);
}

/**
 * ED-03 (WP-EDITORES-PROFESIONAL; TEST-EDP-004): un guardado que recibe un 503 lo dice en la barra con el texto de
 * DL-168 y «Reintentar» al lado; «Guardado» no aparece. «Reintentar» guarda con lo que está en pantalla.
 */
async function reintentar({ p, d, salida }) {
  await abrirElBorrador(p, d);
  await intervenirElGuardado(p, '503');
  const NUEVO = 'Desayuno después de un 503';
  await renombrarComida(p, 1, NUEVO);
  await esperarTexto(p, dominio.COPY_GUARDADO.falloEnLaBarra.SIN_RESPUESTA);
  assert.equal(await p.evaluate(() => document.querySelector('.editor-del-plan__estado')?.dataset.estado), 'fallo', 'con el 503, la barra no dice «Guardado»');
  await captura(p, salida, 'reintentar-fallo-1440');
  await clic(p, '[data-reintentar]', dominio.COPY_GUARDADO.reintentar);
  await esperarGuardado(p);
  assert.deepEqual(await p.evaluate(() => window.__beGuardados), [503, 200], 'un 503 y después el guardado de «Reintentar»');
  await p.reload({ waitUntil: 'networkidle2' });
  await elemento(p, '.comida-del-editor[data-comida="1"]', NUEVO);
}

/**
 * ED-02 (WP-EDITORES-PROFESIONAL; TEST-EDP-003, pasos 5 y 6): un enlace interno con un cambio que se puede guardar, pero
 * el guardado de la salida falla. Con la red cortada y con un 409 (otra pestaña guardó antes), no se sale: el cuadro
 * «Tenés cambios sin guardar», y lo escrito sigue en pantalla.
 */
async function salidaConFallas({ contexto, p, d, salida }) {
  await abrirElBorrador(p, d);
  // Con la red cortada.
  const SIN_RED = 'Desayuno sin red';
  await renombrarComida(p, 1, SIN_RED);
  await p.setOfflineMode(true);
  await clic(p, '.navegacion a', 'Mis recetas');
  await elemento(p, 'dialog[open][data-salida-segura]');
  assert.equal(ruta(p).camino, '/pro/advisees/nutrition', 'sin red, no se sale');
  await captura(p, salida, 'salida-sin-red-1440');
  await clic(p, 'dialog[open] [data-seguir-editando]');
  await p.waitForFunction(() => !document.querySelector('dialog[open][data-salida-segura]'), { timeout: ESPERA });
  await elemento(p, '.comida-del-editor[data-comida="1"]', SIN_RED);
  // Vuelve la red: el autoguardado lo guarda solo.
  await p.setOfflineMode(false);
  await esperarGuardado(p);

  // Con un 409: otra pestaña guarda antes, y el guardado de la salida queda en conflicto.
  const otra = await contexto.newPage();
  await otra.setViewport({ width: 1440, height: 900 });
  await otra.goto(p.url(), { waitUntil: 'networkidle2' });
  await elemento(otra, '.comida-del-editor[data-comida="1"]', SIN_RED);
  await renombrarComida(otra, 2, 'Almuerzo de la otra pestaña');
  await esperarGuardado(otra);
  await p.bringToFront();
  const CON_409 = 'Desayuno con un 409';
  await renombrarComida(p, 1, CON_409);
  await clic(p, '.navegacion a', 'Mis recetas');
  await elemento(p, 'dialog[open][data-salida-segura]');
  assert.equal(ruta(p).camino, '/pro/advisees/nutrition', 'con un 409, no se sale');
  await clic(p, 'dialog[open] [data-seguir-editando]');
  await p.waitForFunction(() => !document.querySelector('dialog[open][data-salida-segura]'), { timeout: ESPERA });
  // Lo escrito sigue en pantalla, y la barra dice el conflicto.
  await elemento(p, '.comida-del-editor[data-comida="1"]', CON_409);
  await esperarTexto(p, dominio.COPY_GUARDADO.conflictoCorto);
  await captura(p, salida, 'salida-con-409-1440');
}

/** Bloque 5: una ficha nueva lleva a empezar el plan; evaluación, objetivo y plan en la misma pantalla, en orden. */
async function primerPlan({ p, d }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="empezar"]', 'Empezar el plan');
  await esperarCamino(p, '/pro/advisees/nutrition');
  await elemento(p, '[data-primer-plan]');

  // 1. La evaluación (RP-12, DL-189): abierta en su paso, en tres bloques. Un dato de «Lo que necesita el cálculo» alcanza
  // para registrarla; el sexo no viene de ningún lado (EI-D02), así que se elige.
  await elemento(p, 'form[data-evaluacion-inicial] [data-lo-que-conto]');
  await hidratado(p, '[data-cambiar-dato="sexo"]');
  await clic(p, '[data-cambiar-dato="sexo"]');
  await p.select('[data-dato-del-calculo="sexo"] select', 'FEMALE');
  await clic(p, '[data-listo-dato="sexo"]');
  await elemento(p, '[data-dato-del-calculo="sexo"][data-origen="CARGADO_POR_VOS"]', 'Femenino');
  // Mientras se lee lo que contó o lo medido, no se registra (revisión del PR): se espera a que terminen.
  await elemento(p, 'form[data-evaluacion-inicial][data-lecturas="listas"]');
  await clic(p, 'form[data-evaluacion-inicial] button[type="submit"]', 'Registrar la evaluación');

  // 2. El objetivo: se abre solo y propone la evaluación recién registrada.
  await hidratado(p, '#objetivo-kcal');
  await p.waitForFunction(() => document.querySelector('#objetivo-evaluacion')?.value !== '', { timeout: ESPERA });
  await p.type('#objetivo-kcal', '2100');
  await p.type('#objetivo-proteina', '130');
  await p.type('#objetivo-carbohidratos', '220');
  await p.type('#objetivo-grasas', '65');
  await p.type('#objetivo-fundamento', 'Objetivo del recorrido de navegador.');
  await clic(p, 'form button[type="submit"]', 'Guardar nueva versión');

  // 3. El plan. «Empezar el plan» ya no abre el asistente (DL-193): con el objetivo escrito, el paso 3 de esta misma
  // pantalla ofrece «Crear nuevo plan» (en blanco) o una plantilla, y la versión se abre en el editor de siempre.
  assert.equal(ruta(p).parametros.get('asistente'), null, '«Empezar el plan» de Nutrición no pide el asistente');
  assert.equal(await p.$('[data-asistente]'), null, 'sin el asistente de Nutrición');
  await elemento(p, '[data-empezar-desde-plantilla]');
  await clic(p, '[data-crear-version]', 'Crear nuevo plan');
  await elemento(p, '.editor-del-plan');
  // El objetivo del día, con su versión y su fecha (SAN-04: lo decía el paso 2 del asistente).
  await elemento(p, '[data-version-del-objetivo]', 'Versión 1, vigente desde el');
  // DJ-6: la primera versión en preparación lleva el número 1.
  await esperarTexto(p, 'Versión 1 · en preparación');

  // De vuelta en la ficha, la acción del momento cambió: ahora es seguir el borrador.
  await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}`, { waitUntil: 'networkidle2' });
  await elemento(p, '[data-accion-de-la-ficha="borrador"]', 'Seguir el borrador');
}

/**
 * DL-193 (WP-SIN-ASISTENTE-DE-NUTRICION): el plan de Nutrición de punta a punta sin el asistente de 7 pasos, con el
 * objetivo ya escrito. Reemplaza al recorrido `asistenteDeNutricion` y prueba lo mismo que seguía vivo:
 * - «Empezar el plan» de la ficha y una dirección vieja con `asistente=1` llevan a la vista del plan, sin el asistente;
 *   ahí están los puntos de partida (crear en blanco y desde una plantilla).
 * - Un borrador con una dirección vieja de un paso (`asistente=5`) se abre en el editor de siempre, entero.
 * - En el editor: una comida, su opción con un alimento del catálogo base en su cuadro y activar.
 * - Con una versión activa, la nueva puede empezar en blanco (SAN-03), además de copiarla o partir de una plantilla.
 */
async function planDeNutricionSinAsistente({ p, d }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="empezar"]', 'Empezar el plan');
  await esperarCamino(p, '/pro/advisees/nutrition');
  assert.equal(ruta(p).parametros.get('vista'), 'plan');
  assert.equal(ruta(p).parametros.get('asistente'), null, 'la ficha no pide el asistente de Nutrición');
  await elemento(p, '[data-crear-version]', 'Crear nuevo plan');
  await elemento(p, '[data-empezar-desde-plantilla]');
  assert.equal(await p.$('[data-asistente]'), null, 'sin el asistente');

  // Una dirección vieja, con el paso 1 del asistente: la misma vista, y el parámetro se va.
  const plan = `${WEB}/pro/advisees/nutrition?id=${encodeURIComponent(d.ase.id)}&vista=plan`;
  await p.goto(`${plan}&asistente=1`, { waitUntil: 'networkidle2' });
  await elemento(p, '[data-crear-version]', 'Crear nuevo plan');
  await p.waitForFunction(() => !new URL(location.href).searchParams.has('asistente'), { timeout: ESPERA, polling: 100 });
  assert.equal(await p.$('[data-punto-de-partida]'), null, 'no aparece el paso 1 del asistente');

  // Crear: el editor de siempre, con el objetivo y su versión.
  await clic(p, '[data-crear-version]', 'Crear nuevo plan');
  await elemento(p, '.editor-del-plan');
  await esperarTexto(p, 'Versión 1 · en preparación');
  await elemento(p, '[data-version-del-objetivo]');

  // Un borrador con la dirección vieja de un paso del asistente: el editor, entero y sin el asistente.
  await p.goto(`${plan}&asistente=5`, { waitUntil: 'networkidle2' });
  await elemento(p, '.editor-del-plan');
  await p.waitForFunction(() => !new URL(location.href).searchParams.has('asistente'), { timeout: ESPERA, polling: 100 });
  assert.equal(await p.$('[data-asistente]'), null, 'el borrador se abre en el editor, no en un paso del asistente');
  assert.equal(await p.$eval('.editor-de-nutricion__zonas', (e) => e.hidden), false, 'el editor a la vista');
  await elemento(p, '[data-revisar-y-activar]');

  // Una comida vacía, con su nombre (sin nombre no se puede guardar): nace con el campo abierto.
  await hidratado(p, '#agregar-comida');
  await clic(p, '#agregar-comida', 'Agregar comida');
  await clic(p, '.menu-de-acciones[data-abierto] .menu-de-acciones__accion', 'Una comida vacía');
  await p.waitForFunction(() => document.activeElement instanceof HTMLInputElement, { timeout: ESPERA });
  await p.keyboard.type('Almuerzo');
  await p.keyboard.press('Enter');

  // Su opción 1, en el cuadro: buscar, Enter suma el marcado, la cantidad y el estado, y «Guardar la opción».
  await abrirComida(p, 1);
  await clic(p, '.comida-del-editor[data-comida="1"] [data-agregar-item]');
  const buscador = await elemento(p, '.cuadro-de-la-opcion [role="combobox"]');
  await buscador.type('arroz');
  await elemento(p, '.cuadro-de-la-opcion [role="gridcell"][aria-selected="true"]');
  await p.keyboard.press('Enter');
  const cantidad = await elemento(p, '#cuadro-item-0-cantidad');
  await cantidad.type('150');
  await p.select('#cuadro-item-0-preparacion', 'COOKED');
  await clic(p, '.cuadro-de-la-opcion [data-principal-del-cuadro]', 'Guardar la opción');
  await p.waitForFunction(() => !document.querySelector('.cuadro-de-la-opcion [role="combobox"]'), { timeout: ESPERA });
  await esperarGuardado(p);

  // Revisar y activar, sin fecha de revisión.
  await clic(p, '[data-revisar-y-activar]');
  await elemento(p, 'dialog[open] [data-antes-de-activar]');
  await clic(p, 'dialog[open] .cuando-la-revisas input[value="sin-fecha"]');
  // El principal se enciende cuando la API terminó de revisar lo guardado y hay una fecha elegida.
  await p.waitForFunction(() => [...document.querySelectorAll('dialog[open] button.boton--primario')].some((b) => b.textContent.includes('Activar la versión 1') && !b.disabled), { timeout: ESPERA });
  await clic(p, 'dialog[open] button.boton--primario', 'Activar la versión 1');

  // Activada: el plan activo, y la versión nueva puede copiarla, partir de una plantilla o empezar en blanco (SAN-03).
  await elemento(p, '.plan__activo');
  await elemento(p, '[data-crear-version]', 'Nueva versión del plan');
  await elemento(p, '[data-empezar-en-blanco]', 'Empezar en blanco');
  assert.equal(await p.$('[data-armar-con-el-asistente]'), null, 'sin «Armar con el asistente»');

  // SAN-03 (revisión de DL-193): «Empezar en blanco» crea de verdad la versión 2 sin copiar la activa: el editor abre un
  // día tipo vacío, sin el «Almuerzo» de la versión 1.
  await clic(p, '[data-empezar-en-blanco]', 'Empezar en blanco');
  await elemento(p, '[data-revisar-y-activar]');
  await esperarTexto(p, 'Versión 2 · en preparación');
  assert.equal(await p.$$eval('.editor-del-plan .comida-del-editor', (x) => x.length), 0, 'en blanco: sin las comidas de la activa');
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
  await clic(p, '.retorno-a-la-ficha a', 'Ficha de');
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
  // Cada toma es una marca con su estado (WP-TABLERO-ALTA-GAMA, TB-02): se busca por lo que dice, no por su radio, que
  // sale del lugar por toma. Lo comprobado sigue igual: la altura de cada toma, el tiempo a escala, ningún rombo y el teclado.
  await p.waitForFunction(() => document.querySelectorAll('.grafico__lienzo g.grafico__elegible > g[data-estado="lleno"]').length === 3, { timeout: ESPERA });
  const dibujo = await p.evaluate(() => {
    const centro = (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const puntos = [...document.querySelectorAll('.grafico__lienzo g.grafico__elegible > g[data-estado="lleno"]')].map(centro);
    const rombos = document.querySelectorAll('.grafico__lienzo g.grafico__elegible > g[data-estado="no-comparable"]').length;
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
  await clic(p, '.espacio-profesional__invitar', 'Invitar a alguien nuevo'); // ED-41: el botón dice el camino («Invitar a alguien nuevo · enlace, QR o código»).
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
  await volverALaPestana(p);
  await esperarCamino(p, '/login');
  const aviso = ruta(p).parametros;
  assert.ok(['sesion-no-valida', 'sesion-vencida'].includes(aviso.get('aviso') ?? ''), `el login dice por qué (${aviso.get('aviso')})`);
  assert.ok((aviso.get('volver') ?? '').startsWith('/pro/advisees'), 'y vuelve a la ficha después de entrar');
  await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}`, { waitUntil: 'networkidle2' });
  await esperarCamino(p, '/login');
}

/** Bloque 3: si la persona retira el consentimiento, la ficha lo dice al volver a la pestaña, y recargar no devuelve el acceso. */
async function accesoRevocado({ p, d }) {
  await entrar(p, d.pro.correo);
  await abrirFicha(p, d.ase.nombre);
  await elemento(p, '[data-accion-de-la-ficha="empezar"]');
  const ase = await sesionPorApi(d.ase.correo, 'APK');
  await pedir('POST', `/me/consents/${d.consentimientos.NUTRICION}/revoke`, { token: ase, superficie: 'APK', cuerpo: {} });
  await volverALaPestana(p);
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
  // WP-TABLERO-ALTA-GAMA TB-16 (DL-163 D-7): la persona de este recorrido se vincula hoy y sus registros tienen fechas de
  // los días anteriores; el período por omisión arrancaría hoy, el día del vínculo. El recorrido elige 30 días, como lo
  // haría el profesional, y comprueba lo mismo de siempre.
  await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}&p=30`, { waitUntil: 'networkidle2' });
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
    await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(d.ase.id)}&vista=analizar&p=30&m=nutricion.energia&f=${fecha}`, { waitUntil: 'networkidle2' });
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
  // UF-11 (DL-169): la sesión del profesional opera como tal con su segundo factor verificado.
  await verificarSegundoFactor(d.pro.correo, tokenDelProfesional);
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

/**
 * DL-192 (WP-RPE-Y-MAXIMO-ESTIMADO; TEST-RPE-030): en el editor del plan de Entrenamiento, el profesional elige escribir el
 * esfuerzo en RPE. El ejercicio a RIR 2 se lee «RPE 8» sin cambiar el número guardado, la notación se guarda sola con el
 * borrador y sigue al recargar. Lo guardado lo confirma la API: la versión dice RPE y la intensidad sigue siendo RIR 2.
 */
async function notacionDelEsfuerzo({ p, d, salida }) {
  await entrar(p, d.pro.correo);
  await p.goto(`${WEB}/pro/advisees/training?id=${encodeURIComponent(d.ase.id)}&vista=plan`, { waitUntil: 'networkidle2' });
  // Lo que se lee del ejercicio: plegado, su renglón («RIR 2», «RPE 8»); abierto, el valor común de la tabla («2», «8»).
  const seLee = (etiqueta, valor) =>
    p.waitForFunction((e, v) => document.body.innerText.includes(`${e} ${v}`) || document.querySelector('[data-rir-general]')?.textContent.trim() === v, { timeout: ESPERA, polling: 200 }, etiqueta, valor);
  // Nace en RIR: el profesional nunca eligió otra.
  await elemento(p, '[data-notacion-del-esfuerzo="RIR"]');
  await hidratado(p, '[data-notacion="RPE"]');
  await seLee('RIR', '2');
  await clic(p, '[data-notacion="RPE"]');
  await elemento(p, '[data-notacion-del-esfuerzo="RPE"]');
  await seLee('RPE', '8');
  await esperarGuardado(p);
  await captura(p, salida, 'notacion-rpe-1440');
  // La API: la versión dice RPE y lo guardado sigue siendo el RIR 2.
  const token = await sesionPorApi(d.pro.correo);
  const plan = (await pedir('GET', `/training/plans/${d.entrenamiento.planId}/detail`, { token })).data;
  assert.equal(plan.effortNotation, 'RPE');
  assert.deepEqual(plan.blocks[0].sessions[0].prescriptions[0].intensity.target.value, 2, 'el valor guardado sigue siendo el RIR');
  // Al recargar, sigue en RPE.
  await p.reload({ waitUntil: 'networkidle2' });
  await elemento(p, '[data-notacion-del-esfuerzo="RPE"]');
  await seLee('RPE', '8');
  // El «?» abre lo largo y las fuentes en su lugar.
  await clic(p, '.notacion-del-plan .a-pedido__boton');
  await p.waitForFunction(() => document.querySelector('.notacion-del-plan .a-pedido__texto')?.hidden === false, { timeout: ESPERA, polling: 200 });
  assert.ok(await p.evaluate(() => document.querySelector('.notacion-del-plan .a-pedido__texto')?.textContent.includes('Zourdos')), 'la fuente está detrás del «?»');
}

// ─── DL-195 (WP-RECORRIDOS-GUIADOS) · El recorrido guiado del editor de Entrenamiento ──────────────────────────────────

/** El paso que se muestra, su número, dónde está el foco y la geometría del hueco, del cartel y del elemento iluminado. */
const pasoDelRecorrido = (p) =>
  p.evaluate(() => {
    const raiz = document.querySelector('[data-recorrido-guiado]');
    if (!raiz) return null;
    const caja = (e) => {
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { top: r.top, left: r.left, bottom: r.bottom, right: r.right };
    };
    const cartel = raiz.querySelector('.recorrido__cartel');
    return {
      paso: raiz.dataset.paso,
      numero: raiz.querySelector('.recorrido__numero')?.textContent ?? '',
      siguiente: raiz.querySelector('[data-siguiente-del-recorrido]')?.textContent ?? '',
      lado: cartel?.dataset.lado ?? null,
      focoEnElCartel: cartel?.contains(document.activeElement) ?? false,
      rol: cartel?.getAttribute('role'),
      modal: cartel?.getAttribute('aria-modal'),
      hueco: caja(raiz.querySelector('.recorrido__hueco')),
      cartel: caja(cartel),
      ventana: { ancho: document.documentElement.clientWidth, alto: document.documentElement.clientHeight },
    };
  });

/**
 * Aparece la primera vez; Escape lo omite y la API lo recuerda; «Ver el recorrido» lo vuelve a mostrar; las flechas se
 * mueven, Tab no sale del cartel y «Terminar» lo cierra; al recargar no aparece. El cartel no tapa el hueco, queda adentro
 * de la ventana, y nada de la página se corre mientras está abierto (RP-19).
 */
async function recorridosGuiados({ p, d, salida }) {
  const token = await sesionPorApi(d.pro.correo);
  const vistos = async () => (await pedir('GET', '/me/guided-tours', { token })).data;
  assert.deepEqual(await vistos(), [], 'la cuenta nueva no vio ningún recorrido');

  await entrar(p, d.pro.correo);
  await p.goto(`${WEB}/pro/advisees/training?id=${encodeURIComponent(d.ase.id)}&vista=plan`, { waitUntil: 'networkidle2' });
  // GUI-08: aparece solo, en el primer paso, con el foco en el cartel, y ya ubicado.
  await p.waitForFunction(() => document.querySelector('.recorrido__cartel')?.dataset.lado, { timeout: ESPERA, polling: 100 });
  let e = await pasoDelRecorrido(p);
  assert.equal(e.paso, 'sesiones');
  assert.match(e.numero, /^Paso 1 de [4-6]$/);
  assert.equal(e.rol, 'dialog');
  assert.equal(e.modal, 'true');
  assert.ok(e.focoEnElCartel, 'el foco está en el cartel');
  await captura(p, salida, 'recorrido-entrenamiento-paso-1');

  // GUI-02: el cartel no tapa el hueco y queda adentro de la ventana; el hueco rodea a «Sesiones».
  const comprobarGeometria = async (momento) => {
    const x = await pasoDelRecorrido(p);
    // El hueco rodea al elemento en los pasos de un elemento chico: «Sesiones» y «Revisar y activar…».
    const sesiones = await p.evaluate((selector) => {
      const el = selector ? [...document.querySelectorAll(selector)].find((n) => !n.closest('[data-recorrido-guiado]') && n.getBoundingClientRect().width > 0) : null;
      return el ? el.getBoundingClientRect().toJSON() : null;
    }, x.paso === 'sesiones' ? '[data-recorrido="sesiones"]' : x.paso === 'revisar' ? '[data-revisar-y-activar]' : null);
    const { hueco: h, cartel: c, ventana: v } = x;
    assert.ok(c.left >= 0 && c.top >= 0 && c.right <= v.ancho && c.bottom <= v.alto, `${momento}: el cartel sale de la ventana`);
    if (x.lado !== 'encima') assert.ok(c.right <= h.left || c.left >= h.right || c.bottom <= h.top || c.top >= h.bottom, `${momento}: el cartel tapa el hueco`);
    if (sesiones) assert.ok(h.top <= sesiones.top + 1 && h.left <= sesiones.left + 1 && h.bottom >= Math.min(sesiones.bottom, v.alto) - 1 && h.right >= sesiones.right - 1, `${momento}: el hueco no rodea al elemento`);
  };
  await comprobarGeometria('paso 1');

  // RP-19: con el recorrido abierto, nada de la página cambió de lugar.
  await p.waitForNetworkIdle({ idleTime: 500, timeout: ESPERA }).catch(() => {});
  const antes = await lugares(p, '[data-revisar-y-activar], [data-ver-recorrido], [data-mas-sesion]');

  // GUI-03: las flechas avanzan y retroceden; Tab no sale del cartel.
  await p.keyboard.press('ArrowRight');
  await p.waitForFunction(() => document.querySelector('[data-recorrido-guiado]')?.dataset.paso !== 'sesiones', { timeout: ESPERA, polling: 100 });
  e = await pasoDelRecorrido(p);
  assert.match(e.numero, /^Paso 2 de /);
  await p.keyboard.press('ArrowLeft');
  await p.waitForFunction(() => document.querySelector('[data-recorrido-guiado]')?.dataset.paso === 'sesiones', { timeout: ESPERA, polling: 100 });
  for (let i = 0; i < 6; i++) {
    await p.keyboard.press('Tab');
    assert.ok((await pasoDelRecorrido(p)).focoEnElCartel, `Tab ${i + 1}: el foco salió del cartel`);
  }
  await p.keyboard.down('Shift');
  await p.keyboard.press('Tab');
  await p.keyboard.up('Shift');
  assert.ok((await pasoDelRecorrido(p)).focoEnElCartel, 'Shift+Tab: el foco salió del cartel');

  // GUI-04: Escape lo omite; la API lo guarda para este usuario.
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => !document.querySelector('[data-recorrido-guiado]'), { timeout: ESPERA, polling: 100 });
  const despues = await lugares(p, '[data-revisar-y-activar], [data-ver-recorrido], [data-mas-sesion]');
  assert.deepEqual(despues, antes, 'abrir y cerrar el recorrido no corre nada (RP-19)');
  let marcado = null;
  for (let i = 0; i < 30 && !marcado; i++) {
    marcado = (await vistos()).find((x) => x.tourId === 'training-plan-editor') ?? null;
    if (!marcado) await pausa(200);
  }
  assert.equal(marcado?.state, 'SKIPPED', 'omitir queda en la cuenta');

  // GUI-10: «Ver el recorrido» es un botón discreto, sin subrayado, y lo vuelve a mostrar desde el primer paso.
  const ver = await elemento(p, '[data-ver-recorrido]');
  assert.equal(await ver.evaluate((b) => b.tagName), 'BUTTON');
  assert.equal(await ver.evaluate((b) => getComputedStyle(b).textDecorationLine), 'none');
  await clic(p, '[data-ver-recorrido]');
  await p.waitForFunction(() => document.querySelector('.recorrido__cartel')?.dataset.lado, { timeout: ESPERA, polling: 100 });
  e = await pasoDelRecorrido(p);
  assert.equal(e.paso, 'sesiones');
  const total = Number(/de (\d+)/.exec(e.numero)[1]);
  // «Siguiente» hasta el último, que dice «Terminar» y pide «Revisar y activar…».
  for (let n = 1; n < total; n++) {
    await clic(p, '[data-siguiente-del-recorrido]');
    await p.waitForFunction((k) => document.querySelector('.recorrido__numero')?.textContent.startsWith(`Paso ${k} de`), { timeout: ESPERA, polling: 100 }, n + 1);
    await comprobarGeometria(`paso ${n + 1}`);
  }
  e = await pasoDelRecorrido(p);
  assert.equal(e.paso, 'revisar');
  assert.equal(e.siguiente, 'Terminar');
  await captura(p, salida, 'recorrido-entrenamiento-ultimo');
  await clic(p, '[data-siguiente-del-recorrido]', 'Terminar');
  await p.waitForFunction(() => !document.querySelector('[data-recorrido-guiado]'), { timeout: ESPERA, polling: 100 });
  marcado = null;
  for (let i = 0; i < 30 && marcado?.state !== 'SEEN'; i++) {
    marcado = (await vistos()).find((x) => x.tourId === 'training-plan-editor') ?? null;
    if (marcado?.state !== 'SEEN') await pausa(200);
  }
  assert.equal(marcado?.state, 'SEEN', 'terminarlo queda en la cuenta');

  // GUI-09: al recargar no aparece; lo recuerda la API, no el navegador.
  await p.reload({ waitUntil: 'networkidle2' });
  await elemento(p, '[data-ver-recorrido]');
  await p.waitForNetworkIdle({ idleTime: 800, timeout: ESPERA }).catch(() => {});
  assert.equal(await p.evaluate(() => document.querySelector('[data-recorrido-guiado]') === null), true, 'al recargar, el recorrido no aparece');
  assert.equal(await p.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith('be:recorridos-vistos:'))), false, 'con la API respondiendo, el navegador no guarda nada');
}

// ─── La corrida ──────────────────────────────────────────────────────────────────────────────────────────────────────

// ─── RP-19 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Sin saltos ─────────────────────────────────────────────────────────────

/**
 * Dónde está cada elemento que coincide con el selector, en la página (no en la ventana: desplazarse no es un salto), con
 * su ancho y su alto.
 */
const lugares = (p, selector) =>
  p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => {
    const r = e.getBoundingClientRect();
    return { x: Math.round((r.left + scrollX) * 10) / 10, y: Math.round((r.top + scrollY) * 10) / 10, ancho: Math.round(r.width * 10) / 10 };
  }), selector);

/** Los lugares de varios selectores a la vez, con su nombre. */
async function fotoDeLugares(p, selectores) {
  const foto = {};
  for (const s of selectores) foto[s] = await lugares(p, s);
  return foto;
}

/** RP-19: nada se movió más de 1 px (ni de costado, ni hacia abajo, ni cambió de ancho). */
function nadaSeMovio(antes, despues, momento) {
  for (const [s, previos] of Object.entries(antes)) {
    const ahora = despues[s];
    assert.equal(ahora.length, previos.length, `${momento}: «${s}» tenía ${previos.length} elementos y ahora ${ahora.length}`);
    previos.forEach((a, i) => {
      const b = ahora[i];
      const salto = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.ancho - b.ancho));
      assert.ok(salto <= 1, `${momento}: «${s}» [${i}] se movió ${salto} px (de ${JSON.stringify(a)} a ${JSON.stringify(b)})`);
    });
  }
}

/** Reemplaza lo escrito en un campo (vacío si `texto` es ''), con el teclado, como el profesional. */
async function reemplazarTexto(p, campo, texto) {
  await campo.click();
  await p.keyboard.down('Control');
  await p.keyboard.press('KeyA');
  await p.keyboard.up('Control');
  await p.keyboard.press('Backspace');
  if (texto) await p.keyboard.type(texto);
}

/** El campo de un rótulo, dentro de `dentro` (los `id` de `useId` no se escriben a mano en un selector). */
async function campoDelRotulo(p, dentro, rotulo) {
  const h = await p.waitForFunction(
    (d, t) => {
      const l = [...document.querySelectorAll(`${d} label`)].find((x) => x.textContent.trim() === t);
      return l ? document.getElementById(l.htmlFor) : null;
    },
    { timeout: ESPERA, polling: 100 },
    dentro,
    rotulo,
  );
  return h.asElement();
}

/**
 * RP-19 · «Sin saltos» (pedido de Dirección del 22/11): con un error nada cambia de lugar. En el reparto por comida, unas
 * partes que suman 99, una vacía y una que vuelve a sumar 100 no mueven los campos, las columnas ni «Proponer estos
 * rangos»; cada fila conserva su rango y «Todo el día» dice lo que falta. Al proponer, nada aparece arriba de las comidas
 * (antes, el cuadro de la suma de los rangos) y el chequeo queda en su renglón del reparto. En el objetivo, corregir un
 * campo después de un envío con errores no corre los demás ni el botón (el aviso tiene su renglón y el resumen no se
 * achica). En el calculador, vaciar el factor para escribir otro no mueve el factor, los g/kg ni «Usar estos valores».
 */
async function sinSaltos({ p, d, salida }) {
  p.on('dialog', (dialogo) => void dialogo.accept());
  await abrirElBorrador(p, d);

  // 1. El reparto por comida, con el objetivo de 2.100 kcal en gramos (preparar.mjs) y las dos comidas del borrador.
  const R = '[data-reparto-por-comida]';
  await elemento(p, `${R} [data-tabla-del-reparto]`, null, 60_000);
  await hidratado(p, `${R} [data-parte-de-la-comida]`);
  await p.waitForNetworkIdle({ idleTime: 500, timeout: ESPERA }).catch(() => {});
  // Revisión del PR: con la letra ya cargada, un cambio de letra no se cuenta como un salto.
  await p.evaluate(() => document.fonts.ready.then(() => true));
  const partes = await p.$$(`${R} [data-parte-de-la-comida]`);
  assert.equal(partes.length, 2, 'el borrador tiene dos comidas guardadas');
  const valores = await p.$$eval(`${R} [data-parte-de-la-comida]`, (xs) => xs.map((x) => Number(x.value)));
  assert.equal(valores[0] + valores[1], 100, 'el punto de partida suma 100');
  const QUIETOS = [`${R} [data-parte-de-la-comida]`, `${R} [data-kcal-propuestas]`, `${R} [data-rango-del-dia-propuesto]`, `${R} [data-margen-del-reparto]`, `${R} [data-proponer-rangos]`];
  const alPrincipio = await fotoDeLugares(p, QUIETOS);
  await captura(p, salida, 'sin-saltos-reparto-100');

  // Las partes suman 99: cada fila sigue con su rango, «Todo el día» dice «99 %» y lo que falta (el 1 % de las 1.985 kcal
  // que suman los gramos del objetivo, unas 20 kcal), y no se puede proponer.
  await reemplazarTexto(p, partes[0], String(100 - valores[1] - 1));
  await p.waitForFunction((s) => document.querySelector(`${s} [data-suma-de-las-partes] [data-lo-que-falta]`)?.textContent.includes('faltan 20 kcal'), { timeout: ESPERA, polling: 100 }, R);
  assert.match(await p.$eval(`${R} [data-suma-de-las-partes] .reparto-por-comida__suma-cifra`, (e) => e.textContent), /^99 %$/);
  nadaSeMovio(alPrincipio, await fotoDeLugares(p, QUIETOS), 'las partes suman 99');
  assert.equal(await p.$$eval(`${R} [data-kcal-propuestas] [data-sin-rango]`, (xs) => xs.length), 0, 'con 99, cada comida conserva su rango');
  assert.ok(await p.$eval(`${R} [data-proponer-rangos]`, (b) => b.disabled), 'con 99 no se propone');
  assert.match(await p.$eval(`${R} [data-por-que-no-se-propone]`, (e) => e.textContent), /Las partes no suman 100/);
  assert.equal(await p.$(`${R} .campo__error`), null, 'ningún párrafo de error debajo de la tabla');
  await captura(p, salida, 'sin-saltos-reparto-99');

  // Una parte vacía: su fila queda con «—», en el mismo lugar.
  await reemplazarTexto(p, partes[0], '');
  await p.waitForFunction((s) => document.querySelector(`${s} tbody tr [data-kcal-propuestas] [data-sin-rango]`), { timeout: ESPERA, polling: 100 }, R);
  nadaSeMovio(alPrincipio, await fotoDeLugares(p, QUIETOS), 'una parte vacía');

  // De nuevo 100: se puede proponer, y nada se movió.
  await reemplazarTexto(p, partes[0], String(100 - valores[1]));
  await p.waitForFunction((s) => document.querySelector(`${s} [data-proponer-rangos]`)?.disabled === false, { timeout: ESPERA, polling: 100 }, R);
  nadaSeMovio(alPrincipio, await fotoDeLugares(p, QUIETOS), 'otra vez 100');

  // Proponer: lo que se guardó se dice al lado del botón, el chequeo de la suma queda en su renglón y nada aparece arriba
  // de las comidas (antes, el cuadro de la suma de los rangos aparecía ahí de golpe y corría toda la pantalla).
  const comidas = await fotoDeLugares(p, ['.comida-del-editor[data-comida="1"]']);
  const delReparto = () => p.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return ['[data-tabla-del-reparto]', '[data-chequeo-de-la-suma]', '[data-proponer-rangos]'].map((x) => Math.round((document.querySelector(`${s} ${x}`).getBoundingClientRect().top - r.top) * 10) / 10);
  }, R);
  const adentroAntes = await delReparto();
  await clic(p, `${R} [data-proponer-rangos]`, 'Proponer estos rangos');
  await p.waitForFunction((s) => document.querySelector(`${s} [data-por-que-no-se-propone]`)?.textContent.includes('Se guardaron'), { timeout: ESPERA, polling: 100 }, R);
  await elemento(p, `${R} [data-chequeo-de-la-suma="contiene"]`);
  assert.equal(await p.$('[data-suma-de-los-rangos=""]'), null, 'el cuadro de la suma ya no está arriba de las comidas');
  nadaSeMovio(comidas, await fotoDeLugares(p, ['.comida-del-editor[data-comida="1"]']), 'al proponer, arriba de las comidas');
  const adentroDespues = await delReparto();
  adentroAntes.forEach((y, i) => assert.ok(Math.abs(y - adentroDespues[i]) <= 1, `al proponer, adentro del reparto [${i}] se movió de ${y} a ${adentroDespues[i]}`));
  await captura(p, salida, 'sin-saltos-reparto-propuesto');

  // 2. El objetivo: un envío con errores y, al corregir un campo, los demás y el botón quedan donde estaban.
  await p.goto(`${WEB}/pro/advisees/nutrition?id=${encodeURIComponent(d.ase.id)}&vista=resumen`, { waitUntil: 'networkidle2' });
  // El botón se enciende cuando llegaron las evaluaciones y los objetivos: se espera a que esté encendido.
  await p.waitForFunction(() => [...document.querySelectorAll('.acciones button')].some((b) => b.textContent.includes('Nueva versión de objetivo') && !b.disabled), { timeout: ESPERA, polling: 100 });
  await clic(p, '.acciones button', 'Nueva versión de objetivo');
  await hidratado(p, '#objetivo-kcal');
  await clic(p, 'form button[type="submit"]', 'Guardar nueva versión');
  await elemento(p, '[data-resumen-de-errores]');
  await p.waitForSelector('#objetivo-kcal[aria-invalid="true"]', { timeout: ESPERA });
  const CAMPOS = ['#objetivo-proteina', '#objetivo-carbohidratos', '#objetivo-grasas', '#objetivo-fundamento', 'form button[type="submit"]'];
  const conErrores = await fotoDeLugares(p, CAMPOS);
  await p.click('#objetivo-kcal');
  await p.keyboard.type('2100');
  await p.keyboard.press('Tab');
  await p.waitForSelector('#objetivo-kcal:not([aria-invalid])', { timeout: ESPERA });
  await elemento(p, '[data-resumen-de-errores] li[data-corregido]');
  nadaSeMovio(conErrores, await fotoDeLugares(p, CAMPOS), 'el objetivo, al corregir las kcal');
  await captura(p, salida, 'sin-saltos-objetivo-corregido');

  // 3. El calculador: con un cálculo completo, vaciar el factor para escribir otro no mueve nada.
  await clic(p, '[data-abrir-el-calculador]');
  const K = '[data-calculador]';
  await elemento(p, `${K} [data-referencia-del-calculo]`);
  await reemplazarTexto(p, await campoDelRotulo(p, K, 'Peso (kg)'), '68');
  await reemplazarTexto(p, await campoDelRotulo(p, K, 'Talla (cm)'), '162');
  await reemplazarTexto(p, await campoDelRotulo(p, K, 'Edad (años)'), '45');
  await clic(p, `${K} [data-sexo-de-la-ecuacion] label.segmento`, 'Mujer');
  await reemplazarTexto(p, await campoDelRotulo(p, K, 'Proteína (g/kg)'), '2');
  await reemplazarTexto(p, await campoDelRotulo(p, K, 'Grasa (g/kg)'), '1');
  await elemento(p, `${K} [data-gasto-total="listo"]`);
  await elemento(p, `${K} [data-macros-del-dia="listo"]`);
  const factor = await campoDelRotulo(p, K, 'Factor del día');
  await p.evaluate((e) => e.setAttribute('data-factor-del-recorrido', ''), factor);
  const DEL_CALCULO = [`${K} [data-factor-del-recorrido]`, `${K} [data-macros-del-calculo] input[type="number"]`, `${K} [data-usar-el-calculo]`];
  const conCalculo = await fotoDeLugares(p, DEL_CALCULO);
  await reemplazarTexto(p, factor, '');
  await elemento(p, `${K} [data-gasto-total="sin-calculo"]`);
  await elemento(p, `${K} [data-gasto-en-reposo="CALCULATED"]`);
  nadaSeMovio(conCalculo, await fotoDeLugares(p, DEL_CALCULO), 'el calculador, sin factor');
  assert.ok(await p.$eval(`${K} [data-usar-el-calculo]`, (b) => b.disabled), 'sin factor no se usa el cálculo');
  await captura(p, salida, 'sin-saltos-calculador-sin-factor');

  // 4. RP-22 · el editor de Entrenamiento (preparar.mjs: una sesión con un ejercicio de tres series, 60 kg y 90 s comunes).
  // Escribir un valor que no se entiende en la fila Común o en una serie no corre las filas, el pie de la tabla ni
  // «Revisar y activar…»: la celda se marca en su lugar y el renglón reservado debajo de la tabla dice qué corregir.
  await p.goto(`${WEB}/pro/advisees/training?id=${encodeURIComponent(d.ase.id)}&vista=plan`, { waitUntil: 'networkidle2' });
  await clic(p, '.ejercicio-del-editor [id^="abrir-ejercicio-"]');
  await elemento(p, '[data-fila-general]');
  await hidratado(p, '[data-fila-general] input.celda-de-serie');
  await p.waitForNetworkIdle({ idleTime: 500, timeout: ESPERA }).catch(() => {});
  await p.evaluate(() => document.fonts.ready.then(() => true));
  await p.evaluate(() => document.querySelector('.series-del-editor')?.scrollIntoView({ block: 'center' }));
  await pausa(300);
  const E = '.ejercicio-del-editor[data-abierta]';
  const DE_LA_TABLA = [`${E} [data-fila-general]`, `${E} tr[data-serie]`, `${E} tr[data-serie] input`, `${E} [data-agregar-serie]`, '[data-revisar-y-activar]'];
  const quieta = await fotoDeLugares(p, DE_LA_TABLA);
  assert.equal(await p.$eval(`${E} [data-lo-que-no-se-entiende]`, (e) => e.dataset.renglonDelAviso), 'vacio', 'el renglón del aviso está, vacío');
  const [cargaComun, descansoComun] = await p.$$(`${E} [data-fila-general] input.celda-de-serie`);
  // La carga común: «sesenta» no se entiende.
  await reemplazarTexto(p, cargaComun, 'sesenta');
  await p.waitForFunction((s) => document.querySelector(`${s} [data-lo-que-no-se-entiende="1"]`)?.textContent.includes('la carga común'), { timeout: ESPERA, polling: 100 }, E);
  assert.equal(await cargaComun.evaluate((e) => e.getAttribute('aria-invalid')), 'true');
  nadaSeMovio(quieta, await fotoDeLugares(p, DE_LA_TABLA), 'Entrenamiento: la carga común no se entiende');
  await captura(p, salida, 'sin-saltos-entrenamiento-carga-comun');
  // Una carga negativa tampoco (el contrato pide desde 0), y el descanso de más de una hora tampoco.
  await reemplazarTexto(p, cargaComun, '-5');
  await reemplazarTexto(p, descansoComun, '61:00');
  await p.waitForFunction((s) => document.querySelector(`${s} [data-lo-que-no-se-entiende="2"]`), { timeout: ESPERA, polling: 100 }, E);
  nadaSeMovio(quieta, await fotoDeLugares(p, DE_LA_TABLA), 'Entrenamiento: la carga negativa y el descanso de más de una hora');
  // Las repeticiones de la serie 2, al revés: tres celdas marcadas, todo en su lugar.
  const reps2 = await p.$(`${E} tr[data-serie="2"] td[data-etiqueta="Repeticiones"] input`);
  await reemplazarTexto(p, reps2, '12-8');
  await p.waitForFunction((s) => document.querySelector(`${s} [data-lo-que-no-se-entiende="3"]`), { timeout: ESPERA, polling: 100 }, E);
  nadaSeMovio(quieta, await fotoDeLugares(p, DE_LA_TABLA), 'Entrenamiento: tres celdas que no se entienden');
  await captura(p, salida, 'sin-saltos-entrenamiento-tres-celdas');
  // Se corrige todo: el renglón queda vacío, con su alto, y nada se movió.
  await reemplazarTexto(p, cargaComun, '60');
  await reemplazarTexto(p, descansoComun, '01:30');
  await reemplazarTexto(p, reps2, '8');
  await p.waitForFunction((s) => document.querySelector(`${s} [data-lo-que-no-se-entiende]`)?.dataset.renglonDelAviso === 'vacio', { timeout: ESPERA, polling: 100 }, E);
  nadaSeMovio(quieta, await fotoDeLugares(p, DE_LA_TABLA), 'Entrenamiento: todo corregido');
  // ↑ en las repeticiones suma 1, y en la carga común, 2,5 kg (los números con su paso).
  await reps2.click();
  await p.keyboard.press('ArrowUp');
  await p.waitForFunction((e) => e.value === '9', { timeout: ESPERA, polling: 100 }, reps2);
  await cargaComun.click();
  await p.keyboard.press('ArrowUp');
  await p.waitForFunction((e) => e.value === '62,5', { timeout: ESPERA, polling: 100 }, cargaComun);
  nadaSeMovio(quieta, await fotoDeLugares(p, DE_LA_TABLA), 'Entrenamiento: las flechas');
  await captura(p, salida, 'sin-saltos-entrenamiento-flechas');
  // Lo mismo a los anchos en que Dirección recorre el escritorio (1280, 1536, 2048 y, al final, 1440, el de siempre):
  // una carga negativa marca la celda y escribe el renglón sin correr nada, y corregirla tampoco.
  for (const ancho of [1280, 1536, 2048, 1440]) {
    await p.setViewport({ width: ancho, height: 900 });
    await pausa(300);
    // Con el autoguardado de lo anterior ya hecho: la foto es la de la pantalla quieta.
    await p.waitForNetworkIdle({ idleTime: 500, timeout: ESPERA }).catch(() => {});
    await p.evaluate(() => document.querySelector('.series-del-editor')?.scrollIntoView({ block: 'center' }));
    await pausa(300);
    const aEsteAncho = await fotoDeLugares(p, DE_LA_TABLA);
    await reemplazarTexto(p, cargaComun, '-5');
    await p.waitForFunction((s) => document.querySelector(`${s} [data-lo-que-no-se-entiende="1"]`)?.textContent.includes('la carga común'), { timeout: ESPERA, polling: 100 }, E);
    nadaSeMovio(aEsteAncho, await fotoDeLugares(p, DE_LA_TABLA), `Entrenamiento a ${ancho}: la carga negativa`);
    if (ancho !== 1440) await captura(p, salida, `sin-saltos-entrenamiento-${ancho}`);
    await reemplazarTexto(p, cargaComun, '62,5');
    await p.waitForFunction((s) => document.querySelector(`${s} [data-lo-que-no-se-entiende]`)?.dataset.renglonDelAviso === 'vacio', { timeout: ESPERA, polling: 100 }, E);
    nadaSeMovio(aEsteAncho, await fotoDeLugares(p, DE_LA_TABLA), `Entrenamiento a ${ancho}: la carga corregida`);
  }
}

/**
 * RP-20, RP-21 y RP-23 (WP-RECORRIDO-PLAN-PULIDO, DL-188): las franjas por comida, en vivo. Con el rango del almuerzo
 * indicado, la comida plegada ya muestra sus cuatro renglones (kcal, P, C y G) con la banda y el promedio, sin el punto
 * de cada opción (RP-23: nada tildado por defecto). Al tildar la casilla del arroz, su punto aparece en su color en la
 * comida y en «Rangos y totales», sin que nada cambie de alto, y se recuerda en la sesión. Al cambiar la cantidad del
 * arroz en la opción abierta, su marca se mueve en la opción, en la franja de la comida y en el panel, y ninguna de las
 * tres cambia de alto; mientras el día no se puede sumar, su pista queda vacía (RP-D84). El panel no se desplaza de
 * costado a 1280, 1440, 1536 y 2048 de ancho (la pantalla de Dirección: 1920 × 1080 con Windows al 125 %, con el
 * navegador al 100 y al 75 %).
 */
async function franjasPorComida({ p, d, salida }) {
  await abrirElBorrador(p, d);
  const comida = '.comida-del-editor[data-comida="2"]';
  // Plegada, con su franja debajo del encabezado: los cuatro renglones, la banda y la raya del promedio de las dos
  // opciones; ningún punto, porque no hay nada tildado (RP-23).
  await elemento(p, `${comida} [data-franjas-de-la-comida] .franja[data-renglon="protein"] .franja__promedio`);
  assert.equal(await p.$(`${comida}[data-abierta]`), null, 'la comida está plegada');
  assert.equal(await p.$$eval(`${comida} [data-franjas-de-la-comida] .franja`, (fs) => fs.length), 4, 'kcal, P, C y G');
  assert.equal(await p.$$eval(`${comida} [data-franjas-de-la-comida] .franja__marca`, (ms) => ms.length), 0, 'por defecto, solo el promedio');
  assert.equal(await p.$$eval('[data-rangos-por-comida] [data-comida-del-panel="2"] .franja__marca', (ms) => ms.length), 0, 'el panel, igual: solo el promedio');
  assert.match(await p.$eval(`${comida} [data-franjas-de-la-comida] .visualmente-oculto`, (e) => e.textContent), /En las barras, solo el promedio\.$/);
  await p.$eval(comida, (e) => e.scrollIntoView({ block: 'center' }));
  await captura(p, salida, 'franjas-comida-plegada-1440');

  // La opción del arroz, abierta: su franja, sola, con su punto en el color del texto (como estaba).
  await abrirComida(p, 2);
  await clic(p, '#pestana-0-1-0');
  const campo = await elemento(p, '#item-0-1-0-0-cantidad');
  await elemento(p, `${comida} [data-franjas-de-la-opcion] .franja__marca`);
  const clave = await p.$eval(`${comida} [data-franjas-de-la-opcion] .franja__marca`, (m) => m.dataset.marca);
  assert.equal(await p.$(`${comida} [data-franjas-de-la-opcion] .franja__marca[data-color-de-la-opcion]`), null, 'la franja de la opción abierta no cambia');

  // RP-23: la casilla del arroz (la opción 1), con su etiqueta y su punto de color. Tildarla suma su punto, en su color, a
  // la comida y al panel; ningún alto cambia y queda recordado en la sesión.
  const casilla = `${comida} [data-en-las-barras="1"] input[type="checkbox"]`;
  await elemento(p, casilla);
  assert.equal(await p.$eval(casilla, (c) => c.checked), false, 'por defecto, sin tildar');
  assert.match(await p.$eval(`${comida} [data-en-las-barras="1"]`, (l) => l.textContent), /Mostrar la opción 1 en las barras de la comida \(su punto es azul\)/);
  const altos = () =>
    p.evaluate((s) => [`${s} [data-franjas-de-la-comida]`, `${s} [data-opcion-plegable="1"]`, '[data-rangos-por-comida] [data-comida-del-panel="2"]'].map((x) => document.querySelector(x)?.getBoundingClientRect().height ?? null), comida);
  const altosSinTildar = await altos();
  await clic(p, casilla);
  await p.waitForFunction((s, k) => document.querySelectorAll(`${s} [data-franjas-de-la-comida] .franja__marca[data-marca="${k}"][data-color-de-la-opcion="1"]`).length === 4, { timeout: ESPERA, polling: 100 }, comida, clave);
  assert.equal(await p.$$eval(`[data-rangos-por-comida] [data-comida-del-panel="2"] .franja__marca[data-marca="${clave}"][data-color-de-la-opcion="1"]`, (ms) => ms.length), 4, 'en el panel también, en su color');
  assert.equal(await p.$$eval(`${comida} [data-franjas-de-la-comida] .franja__marca`, (ms) => ms.length), 4, 'solo la tildada');
  assert.deepEqual(await altos(), altosSinTildar, 'tildar no cambia ningún alto (RP-19)');
  const colores = await p.$eval(`${comida} [data-franjas-de-la-comida] .franja__marca[data-color-de-la-opcion="1"]`, (m) => [getComputedStyle(m).borderTopColor, getComputedStyle(document.querySelector('.comida-del-editor[data-comida="2"] [data-en-las-barras="1"] .en-las-barras__punto')).backgroundColor]);
  assert.equal(colores[0], colores[1], 'el punto de la barra y el de la casilla, del mismo color');
  assert.match(await p.$eval(`${comida} [data-franjas-de-la-comida] .visualmente-oculto`, (e) => e.textContent), /En las barras, el promedio y .+ \(azul\)\.$/);
  assert.ok(await p.evaluate(() => Object.keys(sessionStorage).some((k) => k.startsWith('be:nutricion:en-las-barras:') && sessionStorage.getItem(k).includes('|'))), 'recordado en la sesión');
  /** Dónde está la marca del arroz en cada renglón, en la opción, en la comida y en el panel, y el alto de cada caja. */
  const medir = () =>
    p.evaluate(
      (s, k) => {
        const lugares = { opcion: `${s} [data-franjas-de-la-opcion]`, comida: `${s} [data-franjas-de-la-comida]`, panel: '[data-rangos-por-comida] [data-comida-del-panel="2"]', dia: '[data-panel-de-nutricion] [data-rango-del-dia]' };
        return Object.fromEntries(
          Object.entries(lugares).map(([lugar, selector]) => {
            const caja = document.querySelector(selector);
            const marcas = [...(caja?.querySelectorAll(`.franja__marca[data-marca="${k}"]`) ?? [])].map((m) => m.style.getPropertyValue('--en'));
            return [lugar, { alto: caja ? caja.getBoundingClientRect().height : null, marcas }];
          }),
        );
      },
      comida,
      clave,
    );
  const antes = await medir();
  for (const lugar of ['opcion', 'comida', 'panel']) assert.equal(antes[lugar].marcas.length, 4, `${lugar}: una marca del arroz por renglón`);

  // Borrar la cantidad, como al reescribirla a mano: el arroz queda un momento sin dato. Su marca se va de la opción, de
  // la comida y del panel, el día no se puede sumar, y nada cambia de alto: ni las franjas ni el bloque del día.
  await campo.focus();
  await p.keyboard.down('Control');
  await p.keyboard.press('KeyA');
  await p.keyboard.up('Control');
  await p.keyboard.press('Backspace');
  assert.equal(await p.$eval('#item-0-1-0-0-cantidad', (e) => e.value), '', 'la cantidad quedó vacía');
  await p.waitForFunction(
    (s, k) => !document.querySelector(`${s} [data-franjas-de-la-opcion] .franja__marca[data-marca="${k}"]`) && !!document.querySelector('[data-panel-de-nutricion] [data-rango-del-dia] [data-dia-sin-dato]'),
    { timeout: ESPERA, polling: 100 },
    comida,
    clave,
  );
  const vacio = await medir();
  for (const lugar of ['opcion', 'comida', 'panel']) assert.deepEqual(vacio[lugar].marcas, [], `${lugar}: sin cantidad, el arroz no se ubica`);
  // RP-D84: el día sin sumar deja la pista vacía: ni la banda sola (que era un punto en el medio) ni el tramo.
  assert.equal(await p.$$eval('[data-panel-de-nutricion] [data-rango-del-dia] :is(.franja__banda, .franja__tramo, .franja__marca)', (xs) => xs.length), 0, 'el día sin dato: la pista vacía');
  for (const lugar of ['opcion', 'comida', 'panel', 'dia']) assert.equal(vacio[lugar].alto, antes[lugar].alto, `${lugar}: el alto no cambia con la cantidad vacía`);

  // Escribir la cantidad nueva: la marca vuelve en otro lugar, en los tres lugares, sin que cambie el alto.
  await p.keyboard.type('75');
  assert.equal(await p.$eval('#item-0-1-0-0-cantidad', (e) => e.value), '75', 'la cantidad nueva reemplaza la anterior');
  await p.waitForFunction(
    (s, k, previo) => {
      const marca = document.querySelector(`${s} [data-franjas-de-la-opcion] .franja__marca[data-marca="${k}"]`);
      return !!marca && marca.style.getPropertyValue('--en') !== previo && !document.querySelector('[data-panel-de-nutricion] [data-rango-del-dia] [data-dia-sin-dato]');
    },
    { timeout: ESPERA, polling: 100 },
    comida,
    clave,
    antes.opcion.marcas[0],
  );
  const despues = await medir();
  assert.equal(despues.dia.alto, antes.dia.alto, 'dia: el alto no cambia');
  for (const lugar of ['opcion', 'comida', 'panel']) {
    assert.equal(despues[lugar].marcas.length, 4, `${lugar}: el arroz vuelve a tener una marca por renglón`);
    assert.notDeepEqual(despues[lugar].marcas, antes[lugar].marcas, `${lugar}: la marca del arroz se movió`);
    assert.equal(despues[lugar].alto, antes[lugar].alto, `${lugar}: el alto no cambia`);
  }
  // Las tres dicen lo mismo: la comida y el panel toman lo que está en pantalla, no lo guardado.
  assert.deepEqual(despues.comida.marcas, despues.opcion.marcas, 'la comida y la opción ubican igual al arroz');
  assert.deepEqual(despues.panel.marcas, despues.opcion.marcas, 'el panel y la opción ubican igual al arroz');
  await p.$eval(`${comida} [data-franjas-de-la-opcion]`, (e) => e.scrollIntoView({ block: 'center' }));
  await captura(p, salida, 'franjas-opcion-abierta-1440');
  const panel = await p.$('[data-panel-de-nutricion]');
  if (salida) for (const tema of ['azul-noche', 'claro']) {
    await p.evaluate((t) => (document.documentElement.dataset.tema = t), tema);
    await pausa(200);
    await panel.screenshot({ path: join(salida, `franjas-panel-1440-${tema}.png`) });
  }
  await p.evaluate(() => (document.documentElement.dataset.tema = 'azul-noche'));

  // El panel y las franjas no se desplazan de costado en los anchos de Dirección.
  for (const ancho of [1280, 1536, 2048, 1440]) {
    await p.setViewport({ width: ancho, height: 900 });
    await pausa(300);
    const desborde = await p.evaluate(() => {
      const panel = document.querySelector('[data-panel-de-nutricion]');
      const fuera = [...document.querySelectorAll('.franjas')].filter((f) => f.scrollWidth > f.clientWidth + 1).length;
      // Lo que se corta con «…»: los límites y el resumen de la comida y de la opción, y el renglón de ayuda del día.
      const cortados = [...document.querySelectorAll(".franjas:is([data-variante='comida'], [data-variante='opcion']) :is(.franja__izquierda, .franja__derecha), .rangos-y-totales__ayuda")]
        .filter((x) => x.clientWidth > 0 && x.scrollWidth > x.clientWidth + 1)
        .map((x) => x.textContent);
      return { panel: panel ? panel.scrollWidth - panel.clientWidth : null, fuera, cortados };
    });
    assert.ok(desborde.panel !== null && desborde.panel <= 1, `a ${ancho}: el panel no se desplaza de costado (${desborde.panel} px de más)`);
    assert.equal(desborde.fuera, 0, `a ${ancho}: ninguna franja se sale de su lugar`);
    assert.deepEqual(desborde.cortados, [], `a ${ancho}: ningún resumen ni límite se corta`);
    await p.$eval(comida, (e) => e.scrollIntoView({ block: 'start' }));
    if (ancho !== 1440) await captura(p, salida, `franjas-${ancho}`);
  }
}

/**
 * DL-191 (WP-RECETARIO-E-IMAGENES; TEST-REC-040): el Recetario de BE → «Copiar a Mis recetas» → cargar la imagen desde el
 * cajón del editor del plan. La semilla la carga `correr.mjs` antes de los recorridos, en la base local.
 * - En «Recetas», la pestaña «Recetario de BE» busca sin tildes y copia «Avena cocida con banana y canela»: la copia se abre
 *   en el editor, dice de cuál salió, y el servidor la tiene como propia, con su origen.
 * - En el editor del plan, «Opción de receta» abre el cajón con la copia y su miniatura de reemplazo (sin foto); «Cargar
 *   la imagen» la carga ahí mismo. El navegador la achica antes de subir (sube WebP o JPEG de 1600 px como máximo, no el
 *   PNG de 1800 px) y la imagen queda en la receta: la lee Mis recetas, en WebP. La del recetario sigue sin foto.
 * - Lo que aparece no corre nada: el renglón del aviso del recetario ya estaba en su lugar.
 */
/**
 * RP-24 «Cierre de Nutrición» (WP-RECORRIDO-PLAN-PULIDO, DL-188): en el editor, a 1440 con el panel abierto.
 * - El «?» del día, en la esquina superior derecha de su sección: lo que abre flota y no corre nada; Escape lo cierra y
 *   devuelve el foco al «?».
 * - «Rangos indicados»: cada renglón con su acción discreta («Cambiar» o «Indicar», sin subrayado, con el nombre completo
 *   para el lector) y los macros en columnas alineadas.
 * - Ninguna acción del editor ni del panel se ve subrayada: el subrayado queda para la navegación (`data-navega`).
 */
async function cierreDeNutricion({ p, d, salida }) {
  await abrirElBorrador(p, d);
  const seccion = '[data-panel-de-nutricion] [data-rango-del-dia]';
  const pregunta = `${seccion} [data-encabezado-con-ayuda] .a-pedido__boton`;
  await elemento(p, pregunta);
  const lugares = () =>
    p.evaluate((s) => {
      const caja = document.querySelector(s);
      const boton = caja.querySelector('[data-encabezado-con-ayuda] .a-pedido__boton').getBoundingClientRect();
      const abajo = [...caja.children].slice(1).map((e) => Math.round(e.getBoundingClientRect().top));
      return { derecha: Math.round(caja.getBoundingClientRect().right - boton.right), arriba: Math.round(boton.top - caja.getBoundingClientRect().top), abajo, alto: Math.round(caja.getBoundingClientRect().height) };
    }, seccion);
  const antes = await lugares();
  assert.ok(antes.derecha <= 24, `el «?» va contra el borde derecho de la sección (a ${antes.derecha} px)`);
  assert.ok(antes.arriba <= 24, `el «?» va arriba (a ${antes.arriba} px del borde)`);
  await clic(p, pregunta);
  await p.waitForFunction((s) => document.querySelector(`${s} [data-encabezado-con-ayuda] .a-pedido__texto`)?.hidden === false, { timeout: ESPERA, polling: 100 }, seccion);
  assert.deepEqual(await lugares(), antes, 'abrir el «?» no corre nada: lo que abre flota (RP-19)');
  assert.equal(await p.$eval(`${seccion} [data-encabezado-con-ayuda] .a-pedido__texto`, (t) => getComputedStyle(t).position), 'absolute');
  await captura(p, salida, 'cierre-de-nutricion-ayuda-en-la-esquina-1440');
  await p.keyboard.press('Escape');
  await p.waitForFunction((s) => document.querySelector(`${s} [data-encabezado-con-ayuda] .a-pedido__texto`)?.hidden === true, { timeout: ESPERA, polling: 100 }, seccion);
  assert.ok(await p.$eval(pregunta, (b) => b === document.activeElement), 'Escape devuelve el foco al «?»');

  // «Rangos indicados»: la acción discreta en cada renglón, y los macros alineados en columnas.
  const renglon = '[data-panel-de-nutricion] [data-rangos-indicados] [data-renglon-del-rango]';
  await elemento(p, renglon);
  const acciones = await p.$$eval(`${renglon} .rangos-indicados__accion`, (bs) => bs.filter((b) => b.tagName === 'BUTTON').map((b) => ({ texto: b.textContent.trim(), etiqueta: b.getAttribute('aria-label'), subrayado: getComputedStyle(b).textDecorationLine })));
  assert.ok(acciones.length > 0, 'hay renglones con su acción');
  for (const a of acciones) {
    assert.match(a.texto, /^(Cambiar|Indicar)$/);
    assert.match(a.etiqueta, /^(Cambiar|Indicar) el rango de /);
    assert.equal(a.subrayado, 'none', `«${a.etiqueta}» sin subrayado`);
  }
  const columnas = await p.$$eval(`${renglon} .rangos-indicados__macros`, (ms) => ms.map((m) => [...m.children].map((c) => Math.round(c.getBoundingClientRect().left))));
  for (const c of columnas.slice(1)) assert.deepEqual(c, columnas[0], 'los macros de cada renglón, uno debajo del otro');
  await p.$eval('[data-panel-de-nutricion] [data-rangos-indicados]', (e) => e.scrollIntoView({ block: 'center' }));
  await captura(p, salida, 'cierre-de-nutricion-rangos-indicados-1440');

  // Ninguna acción subrayada en el editor ni en el panel: lo subrayado navega.
  const subrayadas = await p.$$eval('.editor-del-plan button, [data-panel-de-nutricion] button', (bs) => bs.filter((b) => b.offsetParent && !b.hasAttribute('data-navega') && getComputedStyle(b).textDecorationLine.includes('underline')).map((b) => b.textContent.trim().slice(0, 60)));
  assert.deepEqual(subrayadas, [], 'ninguna acción con subrayado');
}

async function recetario({ p, d, salida }) {
  const R = dominio.COPY_RECETARIO;
  const NOMBRE = 'Avena cocida con banana y canela';
  const token = await sesionPorApi(d.pro.correo);
  await entrar(p, d.pro.correo);
  await clic(p, '.navegacion a', 'Mis recetas');
  await esperarCamino(p, '/pro/recipes');
  await clic(p, '.pestanas a', R.recetarioDeBe);
  await p.waitForFunction(() => new URL(location.href).searchParams.get('vista') === 'recetario', { timeout: ESPERA });
  await elemento(p, '[data-recetario-de-be]');
  await hidratado(p, '#buscar-en-el-recetario');
  await p.type('#buscar-en-el-recetario', 'AVENA cocida');
  const fila = `[data-receta-del-recetario]`;
  await elemento(p, fila, NOMBRE);
  // Sin foto, el ícono de la comida en el lugar de la miniatura.
  assert.ok(await p.$eval(`${fila} .imagen-de-receta--respaldo`, (e) => e.offsetParent !== null), 'sin foto, el ícono de la comida');
  // El renglón del aviso de la tarjeta ya ocupa su lugar: al copiar no se corre nada.
  const antes = await p.$eval(fila, (e) => e.getBoundingClientRect().height);
  assert.ok(antes > 0);
  await captura(p, salida, 'recetario-lista-1440');
  await clic(p, `${fila} [data-copiar-a-mis-recetas]`, NOMBRE);
  await p.waitForFunction(() => {
    const u = new URL(location.href);
    return Boolean(u.searchParams.get('receta')) && u.searchParams.get('vista') !== 'recetario';
  }, { timeout: ESPERA });
  await esperarTexto(p, R.copiada(NOMBRE));
  await esperarTexto(p, R.copiaDe(NOMBRE));
  const copiaId = ruta(p).parametros.get('receta');
  const copia = (await pedir('GET', `/nutrition/recipes/${copiaId}`, { token })).data;
  assert.equal(copia.origin, 'OWN');
  assert.equal(copia.copiedFrom?.name, NOMBRE);
  assert.equal(copia.image, null);
  await elemento(p, '[data-proponer-al-recetario]');
  await captura(p, salida, 'recetario-copia-1440');

  // El editor del plan: «Opción de receta» abre el cajón con la copia.
  await p.goto(`${WEB}/pro`, { waitUntil: 'networkidle2' });
  await abrirFicha(p, d.ase.nombre);
  await clic(p, '[data-accion-de-la-ficha="borrador"]');
  await esperarCamino(p, '/pro/advisees/nutrition');
  await elemento(p, '.comida-del-editor[data-comida="1"]');
  await abrirComida(p, 1);
  await clic(p, '.comida-del-editor[data-comida="1"] [data-opcion-de-receta]');
  const enElCajon = `[data-imagen-en-el-cajon="${copiaId}"]`;
  await elemento(p, enElCajon);
  await clic(p, `${enElCajon} [data-cargar-imagen-en-el-cajon]`);
  // Una foto sintética de 1800 × 1200 (un rectángulo de color, no una comida): el navegador la achica antes de subir.
  const sharp = (await import('sharp')).default;
  const archivo = join(salida, 'recetario-foto-sintetica.png');
  writeFileSync(archivo, await sharp({ create: { width: 1800, height: 1200, channels: 3, background: { r: 230, g: 170, b: 60 } } }).png().toBuffer());
  const subidas = [];
  const alPedir = (q) => {
    if (q.method() === 'PUT' && q.url().includes('/media/uploads/')) subidas.push(q.headers()['content-type']);
  };
  p.on('request', alPedir);
  const entrada = await p.waitForSelector(`${enElCajon} input[type="file"]`, { timeout: ESPERA });
  await entrada.uploadFile(archivo);
  await elemento(p, `${enElCajon} .vista-previa`);
  await p.select(`${enElCajon} select`, 'PERSON_PROVIDED');
  await clic(p, `${enElCajon} [data-cargar-la-imagen]`);
  await p.waitForFunction((s) => Boolean(document.querySelector(`${s} figure img.imagen-de-receta`)), { timeout: ESPERA }, enElCajon);
  p.off('request', alPedir);
  assert.equal(subidas.length, 1, 'una sola subida');
  assert.ok(['image/webp', 'image/jpeg'].includes(subidas[0]), `el navegador sube la imagen achicada, no el PNG (${subidas[0]})`);
  await captura(p, salida, 'recetario-imagen-en-el-cajon-1440');
  // La imagen es de la receta: la lee Mis recetas, en WebP; la del recetario sigue sin foto.
  const conImagen = (await pedir('GET', `/nutrition/recipes/${copiaId}`, { token })).data;
  assert.ok(conImagen.image?.mediaId, 'la copia tiene imagen');
  const miniatura = (await pedir('GET', `/media/${conImagen.image.mediaId}/access?variant=thumbnail`, { token })).data;
  const bajada = await fetch(`${API}/api/v1${miniatura.path}`);
  assert.equal(bajada.headers.get('content-type'), 'image/webp');
  const delRecetario = (await pedir('GET', `/nutrition/recipe-book?q=${encodeURIComponent(NOMBRE)}`, { token })).data.find((r) => r.name === NOMBRE);
  assert.equal(delRecetario.image, null, 'la del recetario no cambia');
}

/**
 * RP-25 (WP-RECORRIDO-PLAN-PULIDO, DL-188): una opción de alimentos («Avena», 50 g cruda) no tiene foto: la foto es de una
 * receta. «Agregar foto», al lado de su cabecera, la guarda como receta en Mis recetas (una porción, los mismos alimentos)
 * y, en el mismo cuadro, se le carga la foto; al volver al plan, la miniatura está en la cabecera y el autoguardado lleva
 * la opción como receta.
 */
async function opcionComoReceta({ p, d, salida }) {
  const token = await sesionPorApi(d.pro.correo);
  // La opción como estaba guardada: al pasar a ser la receta conserva su identidad, y la persona ve lo mismo.
  const antes = (await pedir('GET', `/nutrition/plans/${d.borrador.planId}`, { token })).data.dayTypes[0].meals[0].options[0];
  assert.equal(antes.label, 'Avena');
  assert.equal(antes.recipe ?? null, null, 'empieza como una opción de alimentos');
  await abrirElBorrador(p, d);
  await abrirComida(p, 1);
  const comida = '.comida-del-editor[data-comida="1"]';
  const renglon = `${comida} [data-opcion-plegable="1"]`;
  const acceso = `${renglon} [data-agregar-foto-a-la-opcion="1"]`;
  await elemento(p, acceso);
  const altoAntes = await p.$eval(`${renglon} .opcion-plegable__fila`, (e) => Math.round(e.getBoundingClientRect().height));
  assert.equal(await p.$eval(acceso, (b) => getComputedStyle(b).textDecorationLine), 'none', '«Agregar foto» sin subrayado');
  assert.equal(await p.$eval(acceso, (b) => Boolean(b.closest('.opcion-plegable__boton'))), false, 'fuera del botón de la cabecera');
  await captura(p, salida, 'opcion-como-receta-cabecera-1440');
  await clic(p, acceso);
  const cuadro = 'dialog[open] [data-guardar-como-receta]';
  await elemento(p, cuadro);
  await esperarTexto(p, 'Una foto es de una receta');
  assert.match(await p.$eval(`${cuadro} [data-lo-que-lleva]`, (e) => e.textContent), /50 g, Crudo/);
  await captura(p, salida, 'opcion-como-receta-cuadro-1440');
  await clic(p, 'dialog[open] [data-principal-del-cuadro]', 'Guardar como receta');
  const foto = 'dialog[open] [data-foto-de-la-opcion-como-receta]';
  await elemento(p, foto);
  // La receta, en Mis recetas: el nombre de la opción, una porción y los mismos alimentos.
  const avenas = (await pedir('GET', '/nutrition/recipes?limit=50', { token })).data.filter((r) => r.name === 'Avena');
  assert.equal(avenas.length, 1, 'una sola receta en Mis recetas');
  const [receta] = avenas;
  assert.equal(receta.servings, 1);
  assert.deepEqual(receta.ingredients.map((i) => [i.quantity.value, i.quantity.unit, i.preparationState]), [[50, 'g', 'RAW']]);
  // La foto, en el mismo cuadro, con el recuadro de siempre (una imagen sintética, no una comida).
  const sharp = (await import('sharp')).default;
  const archivo = join(salida, 'opcion-como-receta-foto-sintetica.png');
  writeFileSync(archivo, await sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 200, g: 150, b: 70 } } }).png().toBuffer());
  const entrada = await p.waitForSelector(`${foto} input[type="file"]`, { timeout: ESPERA });
  await entrada.uploadFile(archivo);
  await elemento(p, `${foto} .vista-previa`);
  await p.select(`${foto} select`, 'PERSON_PROVIDED');
  await clic(p, `${foto} [data-cargar-la-imagen]`);
  await p.waitForFunction((s) => Boolean(document.querySelector(`${s} figure img.imagen-de-receta`)), { timeout: ESPERA }, foto);
  await captura(p, salida, 'opcion-como-receta-foto-1440');
  await clic(p, 'dialog[open] [data-principal-del-cuadro]', 'Volver al plan');
  // La opción ya es la receta, y su miniatura está en la cabecera, del alto del renglón.
  await p.waitForFunction((s) => Boolean(document.querySelector(`${s}[data-receta] .opcion-plegable__miniatura[data-miniatura-de-la-receta=""] img.imagen-de-receta`)), { timeout: ESPERA, polling: 100 }, renglon);
  // El acceso que abrió el cuadro ya no está: el foco vuelve a la cabecera de la opción, no al documento.
  await p.waitForFunction((s) => Boolean(document.activeElement?.matches(`${s} .opcion-plegable__boton`)), { timeout: ESPERA, polling: 100 }, renglon);
  assert.equal(await p.$(acceso), null, 'una receta ya no ofrece «Agregar foto»');
  assert.ok((await p.$eval(`${renglon} .opcion-plegable__fila`, (e) => Math.round(e.getBoundingClientRect().height))) <= altoAntes + 1, 'la miniatura no agranda el renglón');
  await captura(p, salida, 'opcion-como-receta-miniatura-1440');
  // El autoguardado lleva la opción como receta, con su identidad.
  const conImagen = (await pedir('GET', `/nutrition/recipes/${receta.recipeId}`, { token })).data;
  assert.ok(conImagen.image?.mediaId, 'la receta tiene la foto');
  let opcion = null;
  for (let intento = 0; intento < 40 && !opcion?.recipe; intento++) {
    if (intento > 0) await pausa(500);
    opcion = (await pedir('GET', `/nutrition/plans/${d.borrador.planId}`, { token })).data.dayTypes[0].meals[0].options[0];
  }
  assert.equal(opcion?.recipe?.recipeId, receta.recipeId, 'la opción guardada cita la receta');
  assert.equal(opcion.label, 'Avena');
  assert.equal(opcion.optionId, antes.optionId, 'conserva su identidad');
  assert.deepEqual(
    opcion.items.map((it) => [it.catalogItemId, it.quantity, it.preparationState]),
    antes.items.map((it) => [it.catalogItemId, it.quantity, it.preparationState]),
    'la persona ve los mismos alimentos y cantidades',
  );
}

// ─── DL-196 (WP-EDITOR-ENTRENAMIENTO, parte A) · el editor de Entrenamiento rediseñado ─────────────────────────────────

/** El editor de Entrenamiento del borrador de una sesión con un ejercicio (preparar.mjs: 3 × 8, 60 kg y 90 s comunes). */
async function abrirElEditorDeEntrenamiento(p, d) {
  p.on('dialog', (dialogo) => void dialogo.accept());
  await entrar(p, d.pro.correo);
  await p.goto(`${WEB}/pro/advisees/training?id=${encodeURIComponent(d.ase.id)}&vista=plan`, { waitUntil: 'networkidle2' });
  await elemento(p, '[data-datos-del-plan]', null, 60_000);
  await hidratado(p, '[data-elegir-fase="1"]');
}

/**
 * TEST-EE-NAV-01 · dos columnas, como Nutrición (E5, E7): sin la columna izquierda; el plan arriba con su inicio y su
 * duración; la fase con sus semanas y sus días; el almanaque en el panel, con las semanas de la fase y los días de sesión;
 * tocar un día lleva a la sesión. «Antes de activar» al lado de «Revisar y activar». «Copiar la fase anterior» suma «Fase
 * 2» con la sesión. La página no se desplaza más allá del contenido (E1).
 */
async function editorDeEntrenamiento({ p, d, salida }) {
  await abrirElEditorDeEntrenamiento(p, d);
  assert.equal(await p.$('#zona-estructura'), null, 'sin la columna izquierda');
  await elemento(p, '[data-marco-del-panel] [data-almanaque]');
  await elemento(p, '[data-lo-que-impide-activar]');
  // E1: el editor no tiene un alto fijo: debajo de su contenido no queda una pantalla vacía.
  const sobra = await p.evaluate(() => document.documentElement.scrollHeight - (document.querySelector('.editor-de-entrenamiento__zonas').getBoundingClientRect().bottom + scrollY));
  assert.ok(sobra < 320, `debajo del editor sobran ${sobra} px`);
  // El inicio del plan, hoy, con el calendario de BE; seis semanas.
  await clic(p, '[data-inicio-del-plan] [data-campo-de-fecha]');
  await elemento(p, '[data-calendario] button[data-fecha]');
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelector('[data-inicio-del-plan] [data-campo-de-fecha]')?.dataset.valor, { timeout: ESPERA, polling: 100 });
  await reemplazarTexto(p, await p.$('[data-semanas-del-plan]'), '6');
  // La fase abierta: seis semanas, y la sesión el lunes y el jueves.
  await reemplazarTexto(p, await p.$('[data-semanas-de-la-fase]'), '6');
  await p.waitForFunction(() => /\d/.test(document.querySelector('[data-fechas-de-la-fase]')?.textContent ?? ''), { timeout: ESPERA, polling: 100 });
  await clic(p, '[data-dias-de-la-sesion="1"] [data-dia="MONDAY"]');
  await clic(p, '[data-dias-de-la-sesion="1"] [data-dia="THURSDAY"]');
  await p.waitForFunction(() => document.querySelector('[data-dias-de-la-sesion="1"] [data-dia="THURSDAY"]')?.getAttribute('aria-pressed') === 'true', { timeout: ESPERA, polling: 100 });
  // El almanaque: las semanas del color de la fase y, si en este mes no queda un lunes ni un jueves, el mes siguiente.
  await elemento(p, '[data-almanaque] .almanaque__semana[data-fase="1"]');
  if ((await p.$$('[data-almanaque] [data-dia-del-almanaque]')).length === 0) await clic(p, '[data-almanaque] [data-mes-siguiente]');
  await elemento(p, '[data-almanaque] [data-dia-del-almanaque]');
  const etiqueta = await p.$eval('[data-almanaque] [data-dia-del-almanaque]', (b) => b.getAttribute('aria-label'));
  assert.match(etiqueta, /Piernas A/, 'el día dice qué sesión es');
  await esperarGuardado(p);
  await captura(p, salida, 'editor-entrenamiento-almanaque-1440');
  // Tocar un día lleva a la sesión: la elige (la primera no se escribe en la dirección) y deja el foco en su menú.
  await clic(p, '[data-almanaque] [data-dia-del-almanaque]');
  await p.waitForFunction(() => location.search.includes('sesion=') || Boolean(document.activeElement?.closest('#menu-de-la-sesion')), { timeout: ESPERA, polling: 100 });
  // La API guardó la planificación y la agenda empieza con el plan.
  const token = await sesionPorApi(d.pro.correo);
  const plan = (await pedir('GET', `/training/plans/${d.borradorDeEntrenamiento}/detail`, { token })).data;
  assert.equal(plan.planning.weeks, 6);
  assert.equal(plan.planning.phases[0].weeks, 6);
  assert.equal(plan.agenda.startDate, plan.planning.startDate);
  assert.deepEqual(plan.agenda.sessions[0].weekdays, ['MONDAY', 'THURSDAY']);
  // «Antes de activar», desplegado al lado del botón, con su lista; Escape lo cierra.
  await clic(p, '[data-lo-que-impide-activar]');
  await elemento(p, '.lo-que-impide-activar__lista:not([hidden]) [data-panel-en-vivo], .lo-que-impide-activar__lista:not([hidden])');
  await captura(p, salida, 'editor-entrenamiento-antes-de-activar');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => document.querySelector('.lo-que-impide-activar__lista')?.hidden === true, { timeout: ESPERA, polling: 100 });
  // «Copiar la fase anterior»: «Fase 2», con la misma sesión y sus días.
  await clic(p, '[data-copiar-la-fase-anterior]');
  await elemento(p, '[data-fase-del-plan="2"]');
  // DL-196 parte B (E19): la copia ofrece aplicarle una progresión; se cierra sin aplicar y la copia queda como está.
  await dialogoAbierto(p, 'Progresión y descarga');
  await elemento(p, '[data-asistente-de-progresion] [data-desde-la-copia]');
  await captura(p, salida, 'copia-con-progresion');
  await p.keyboard.press('Escape');
  await dialogoCerrado(p);
  assert.match(await p.$eval('[data-fase-del-plan="2"] .fase-del-plan__nombre', (e) => e.textContent), /^Fase 2$/);
  await elemento(p, '[data-fase-del-plan="2"] [data-dias-de-la-sesion="1"] [data-dia="MONDAY"][aria-pressed="true"]');
  await esperarGuardado(p);
  await captura(p, salida, 'editor-entrenamiento-dos-fases');
  // A 1920 (la pantalla de Dirección), el contexto de la persona no comprime el editor.
  await p.setViewport({ width: 1920, height: 1080 });
  await pausa(300);
  await captura(p, salida, 'editor-entrenamiento-1920');
}

/**
 * TEST-EE-NAV-02 · las aproximaciones «Por porcentaje» (E9, E17) desde la carga de trabajo de 60 kg: con la sentadilla
 * (barra, de a 2,5): 8 × 25, 5 × 35 y 3 × 47,5 kg; de a 5: 3 × 50 kg. Van arriba de las efectivas. La máscara del
 * descanso («2» es 02:00; «130», 01:30) y las acciones rápidas de la carga (+2,5 kg). El panel sigue al ejercicio.
 */
async function aproximacionesPorPorcentaje({ p, d, salida }) {
  await abrirElEditorDeEntrenamiento(p, d);
  await clic(p, '.ejercicio-del-editor [id^="abrir-ejercicio-"]');
  const E = '.ejercicio-del-editor[data-abierta]';
  await elemento(p, `${E} [data-aproximaciones]`);
  await hidratado(p, `${E} [data-cuantas-aproximaciones]`);
  // El panel sigue al ejercicio: «La vez pasada» (sin registros todavía).
  await p.click(`${E} [data-cuantas-aproximaciones]`);
  await elemento(p, '[data-foco-del-panel="ejercicio"] [data-la-vez-pasada]');
  await p.select(`${E} [data-cuantas-aproximaciones]`, '3');
  await p.waitForFunction((s) => document.querySelector(`${s} [data-vista-previa-de-aproximaciones]`)?.textContent.includes('8 × 25 kg'), { timeout: ESPERA, polling: 100 }, E);
  const previa = await p.$eval(`${E} [data-vista-previa-de-aproximaciones]`, (e) => e.textContent);
  assert.match(previa, /5 × 35 kg/);
  assert.match(previa, /3 × 47,5 kg/);
  assert.match(await p.$eval(`${E} [data-base-de-las-aproximaciones]`, (e) => e.textContent), /60 kg, la carga de trabajo/);
  // En la tabla, las tres arriba (A1 a A3) y las efectivas debajo.
  assert.equal((await p.$$(`${E} tr[data-calentamiento]`)).length, 3);
  assert.equal(await p.$eval(`${E} tr[data-serie="1"] .series-del-editor__numero`, (e) => e.textContent), 'A1');
  await captura(p, salida, 'aproximaciones-por-porcentaje');
  // De a 5: la última, 50 kg.
  await p.select(`${E} [data-redondeo]`, '5');
  await p.waitForFunction((s) => document.querySelector(`${s} [data-vista-previa-de-aproximaciones]`)?.textContent.includes('3 × 50 kg'), { timeout: ESPERA, polling: 100 }, E);
  // La máscara del descanso común: «2» es 02:00 y «130», 01:30.
  const [cargaComun, descansoComun] = await p.$$(`${E} [data-fila-general] input.celda-de-serie`);
  await reemplazarTexto(p, descansoComun, '2');
  await p.waitForFunction((e) => e.value === '02:00', { timeout: ESPERA, polling: 100 }, descansoComun);
  await reemplazarTexto(p, descansoComun, '130');
  await p.waitForFunction((e) => e.value === '01:30', { timeout: ESPERA, polling: 100 }, descansoComun);
  // Las acciones rápidas de la carga común: +2,5 kg, sin perder el foco.
  await cargaComun.click();
  await elemento(p, `${E} [data-fila-general] [data-acciones-rapidas="suggestedLoad"] [data-paso="2.5"]`);
  await captura(p, salida, 'acciones-rapidas-de-la-carga');
  await p.click(`${E} [data-fila-general] [data-acciones-rapidas="suggestedLoad"] [data-paso="2.5"]`);
  await p.waitForFunction((e) => e.value === '62,5', { timeout: ESPERA, polling: 100 }, cargaComun);
  assert.ok(await cargaComun.evaluate((e) => document.activeElement === e), 'el foco sigue en la carga');
  // La carga de trabajo cambió: las aproximaciones ya no coinciden, se dice y «Recalcular» las pone al día.
  await elemento(p, `${E} [data-aproximaciones-no-coinciden]`);
  await clic(p, `${E} [data-recalcular-aproximaciones]`);
  await p.waitForFunction((s) => !document.querySelector(`${s} [data-aproximaciones-no-coinciden]`), { timeout: ESPERA, polling: 100 }, E);
  await esperarGuardado(p);
  // La API: tres series de aproximación arriba, con su carga redondeada de a 5, y cómo se armaron.
  const token = await sesionPorApi(d.pro.correo);
  const plan = (await pedir('GET', `/training/plans/${d.borradorDeEntrenamiento}/detail`, { token })).data;
  const ejercicio = plan.blocks[0].sessions[0].prescriptions[0];
  // Sin declarar training-set-kinds-1, la API saca `setKind` en el borde (lo de la APK 0.32): se pide como el website.
  const conTipos = (await pedir('GET', `/training/plans/${d.borradorDeEntrenamiento}/detail`, { token, capacidades: 'training-set-kinds-1' })).data;
  assert.deepEqual(
    conTipos.blocks[0].sessions[0].prescriptions[0].sets.filter((s) => s.setKind === 'WARM_UP').map((s) => s.suggestedLoad?.value),
    [25, 40, 50],
  );
  assert.equal(ejercicio.restSeconds, 90, 'el descanso común se guardó como 01:30');
  assert.deepEqual(plan.planning.warmUps.map((w) => [w.mode, w.step, w.workingLoadShares.join('/')]), [['FROM_WORKING_LOAD', 5, '40/60/80']]);
  await captura(p, salida, 'aproximaciones-guardadas');
}

/**
 * TEST-EE-NAV-03 · la progresión de una fase con su vista previa (E12, E18) y la distribución con la silueta (E13, E20):
 * «Progresión…» en el desplegable de la fase abre el asistente; lineal con la descarga en la semana 4: el gráfico tiene
 * su escalón y la tabla semana × ejercicio, antes de aplicar. Aplicada, la regla se lee en la fase y la API la guarda en
 * la planificación. En el panel, «Distribución» dibuja la silueta y su tabla; la estrella la deja en «Favoritos». El
 * ejercicio muestra su carga por semana y la carga para N repeticiones.
 */
async function progresionYDistribucion({ p, d, salida }) {
  await abrirElEditorDeEntrenamiento(p, d);
  await reemplazarTexto(p, await p.$('[data-semanas-de-la-fase]'), '6');
  // El asistente: lineal de entrada, con la vista previa a la vista.
  await clic(p, '[data-abrir-progresion]');
  await dialogoAbierto(p, 'Progresión y descarga');
  await elemento(p, '[data-asistente-de-progresion] [data-tabla-de-la-progresion]');
  // La descarga en la semana 4: la franja del escalón en el gráfico y la semana marcada en la tabla.
  await clic(p, '[data-asistente-de-progresion] [data-descarga]');
  await p.select('[data-asistente-de-progresion] [data-campo="semana-de-descarga"]', '4');
  await p.waitForFunction(() => document.querySelectorAll('[data-asistente-de-progresion] [data-tabla-de-la-progresion] td[data-descarga]').length > 0, { timeout: ESPERA, polling: 100 });
  const conCarga = await p.$('[data-asistente-de-progresion] [data-grafico-de-semanas]');
  if (conCarga) await elemento(p, '[data-asistente-de-progresion] .grafico-de-semanas__descarga');
  // La lectura del gráfico con el teclado: la semana 4 dice que es de descarga.
  if (conCarga) {
    await p.focus('[data-asistente-de-progresion] .grafico-de-semanas__dibujo');
    for (let n = 0; n < 4; n += 1) await p.keyboard.press('ArrowRight');
    await p.waitForFunction(() => /descarga/.test(document.querySelector('[data-asistente-de-progresion] .grafico-de-semanas__lectura')?.textContent ?? ''), { timeout: ESPERA, polling: 100 });
  }
  await capturaEnLosDosTemas(p, salida, 'progresion-vista-previa');
  await clic(p, '[data-asistente-de-progresion] ~ * [data-principal-del-cuadro], dialog[open] [data-principal-del-cuadro]');
  await dialogoCerrado(p);
  await elemento(p, '[data-progresion-de-la-fase="LINEAR"]');
  await esperarGuardado(p);
  const token = await sesionPorApi(d.pro.correo);
  const plan = (await pedir('GET', `/training/plans/${d.borradorDeEntrenamiento}/detail`, { token })).data;
  const regla = plan.planning.progressions.find((x) => x.blockId === plan.blocks[0].blockId);
  assert.equal(regla.model, 'LINEAR');
  assert.equal(regla.deload.week, 4);
  // El panel de la fase: «Distribución», con la silueta (o lo que falta para dibujarla) y su tabla.
  await clic(p, '[data-elegir-fase="1"]');
  await clic(p, '[data-selector-de-vistas] [data-vista="distribucion"]');
  await elemento(p, '[data-vista-del-panel="distribucion"] [data-distribucion-de-la-fase]');
  await p.waitForFunction(() => !/Leyendo las zonas/.test(document.querySelector('[data-distribucion-de-la-fase]')?.textContent ?? ''), { timeout: ESPERA, polling: 100 });
  // Con el teclado, las vistas van con ← y →.
  await p.focus('[data-selector-de-vistas] [data-vista="distribucion"]');
  await p.keyboard.press('ArrowRight');
  await elemento(p, '[data-vista-del-panel="progresion"] [data-progresion-en-el-panel="con-regla"]');
  await p.keyboard.press('ArrowLeft');
  await elemento(p, '[data-vista-del-panel="distribucion"]');
  await capturaEnLosDosTemas(p, salida, 'distribucion-de-la-fase');
  // La estrella: la distribución queda en «Favoritos».
  await clic(p, '[data-vista-del-panel="distribucion"] .marco-del-panel__acciones [data-favorito="no"]');
  await elemento(p, '[data-vista-del-panel="distribucion"] .marco-del-panel__acciones [data-favorito="si"]');
  await clic(p, '[data-selector-de-vistas] [data-vista="favoritos"]');
  await elemento(p, '[data-favoritos-del-plan="1"]');
  await captura(p, salida, 'favoritos-del-plan');
  // El ejercicio: la carga por semana (gráfico X/Y) y la carga para N repeticiones.
  await clic(p, '.ejercicio-del-editor [id^="abrir-ejercicio-"]');
  await hidratado(p, '.ejercicio-del-editor[data-abierta] [data-cuantas-aproximaciones]');
  await p.click('.ejercicio-del-editor[data-abierta] [data-cuantas-aproximaciones]');
  await elemento(p, '[data-foco-del-panel="ejercicio"] [data-carga-para-repeticiones]');
  await elemento(p, '[data-foco-del-panel="ejercicio"] [data-carga-por-semana]');
  await captura(p, salida, 'carga-por-semana-del-ejercicio');
  await esperarGuardado(p);
}

export const TODOS = { sesion, pistas, borrador, conflicto, descartar, salidaSegura, irACorregir, respuestaPerdida, reintentar, salidaConFallas, primerPlan, planDeNutricionSinAsistente, retorno, grafico, primeraInvitacion, areaSugerida, sesionRevocada, accesoRevocado, faltaUnaParte, completitud, evidencia, administracion, comparacion, comparacionConOpciones, sinSaltos, franjasPorComida, cierreDeNutricion, notacionDelEsfuerzo, recetario, opcionComoReceta, recorridosGuiados, editorDeEntrenamiento, aproximacionesPorPorcentaje, progresionYDistribucion };

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
