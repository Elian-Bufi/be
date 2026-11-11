// Los flujos de planificación del profesional, paso a paso (pedido de Dirección del 2026-11-10): cómo un profesional
// crea y ajusta sus planes en el website, para dos críticas de UX hechas sobre las capturas. No cambia nada del
// producto: recorre el website compilado como lo haría un profesional (clics en los botones reales, texto escrito en los
// campos, diálogos abiertos y los errores de validación a la vista) y saca cada paso a 1440 × 900, en el tema por
// defecto del website (un contexto nuevo del navegador, sin preferencia guardada).
//
// Lo llama capturas.mjs con el modo `flujos-de-planificacion`, después de preparar lo mismo que para el tablero: la base
// efímera, la API, la cohorte sintética y el website. Corre en el trabajo `flujos` de capturas-del-tablero.yml.
//
// Qué deja en <salida>:
// - A-entrenamiento/, B-nutricion/ y C-vincular/: `<código>-<nombre>-pantalla.png` (lo que se ve) y, si la página o el
//   diálogo abierto es más alto que la pantalla, `<código>-<nombre>-entera.png` (la ventana estirada a su alto, como en
//   capturas.mjs: con `fullPage` los gráficos se quedan sin dibujo).
// - flujos.json: cada paso con lo que muestra, lo que hace el profesional y lo que espera lograr; si se pudo hacer, si
//   falló (con lo que había en pantalla) o si no existe en el website; el alto de la página en pantallas de 900; los
//   botones y campos a la vista y en toda la página; y los clics: los del paso, los acumulados y los del camino desde la
//   ficha hasta activar (sin los desvíos que se hacen para mostrar algo, como un error).
//
// Un paso que falla no corta el recorrido: queda anotado con su captura y el siguiente sigue desde donde quedó.
import fs from 'node:fs';
import path from 'node:path';

const ANCHO = 1440;
const ALTO = 900;

/** Busca en la página, sin salir del diálogo modal abierto (lo de atrás no se puede tocar). Corre en el navegador. */
function buscarEnLaPagina({ css, texto, dentro, exacto, n, campo }) {
  const modal = document.querySelector('dialog:modal');
  const raices = dentro ? [...document.querySelectorAll(dentro)] : [modal ?? document];
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(e);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es');
  // El texto que se ve: sin lo que es solo para el lector de pantalla ni el globo de una pista.
  const textoVisible = (e) => {
    const copia = e.cloneNode(true);
    for (const o of copia.querySelectorAll('.visualmente-oculto, .pista__globo, [aria-hidden="true"]')) o.remove();
    return copia.textContent || e.getAttribute('aria-label') || e.getAttribute('placeholder') || e.value;
  };
  const porDefecto = campo ? 'input:not([type="hidden"]), select, textarea' : 'button, a[href], summary, [role="button"], [role="tab"], [role="option"], label';
  // La raíz también cuenta: con un diálogo abierto, buscar ese mismo diálogo tiene que encontrarlo.
  const sel = css ?? porDefecto;
  let candidatos = raices.flatMap((r) => [...(r !== document && r.matches(sel) ? [r] : []), ...r.querySelectorAll(sel)]);
  // Un campo de opción (radio o casilla) suele ir oculto detrás de su rótulo: cuenta como visible si el rótulo lo es.
  candidatos = candidatos.filter((e) => visible(e) || (e.matches('input[type="radio"], input[type="checkbox"]') && e.closest('label') && visible(e.closest('label'))));
  if (texto != null) {
    const t = norm(texto);
    // Primero lo que se ve; si no, el nombre completo (con lo oculto para la vista) o el rótulo accesible.
    const conTexto = candidatos.map((e) => [e, norm(textoVisible(e)), norm(e.textContent), norm(e.getAttribute('aria-label'))]);
    const con = (prueba) => conTexto.filter(([, ...textos]) => textos.some((x) => x && prueba(x)));
    let elegidos = con((x) => x === t);
    if (!elegidos.length && !exacto) elegidos = con((x) => x.startsWith(t));
    if (!elegidos.length && !exacto) elegidos = con((x) => x.includes(t));
    candidatos = elegidos.map(([e]) => e);
  }
  return candidatos[n ?? 0] ?? null;
}

/** El campo que nombra un rótulo (por su texto), con su `for` o adentro. Corre en el navegador. */
function campoPorRotulo({ etiqueta, dentro, n }) {
  const modal = document.querySelector('dialog:modal');
  const raiz = dentro ? document.querySelector(dentro) : (modal ?? document);
  if (!raiz) return null;
  const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es');
  const t = norm(etiqueta);
  const rotulos = [...raiz.querySelectorAll('label, legend')].filter((l) => l.getClientRects().length > 0);
  const elegidos = [...rotulos.filter((l) => norm(l.innerText) === t), ...rotulos.filter((l) => norm(l.innerText) !== t && norm(l.innerText).startsWith(t))];
  const campos = elegidos.map((l) => l.control ?? (l.htmlFor ? document.getElementById(l.htmlFor) : null) ?? l.parentElement?.querySelector('input:not([type="hidden"]), select, textarea')).filter(Boolean);
  return campos[n ?? 0] ?? null;
}

/** Lo que mide cada paso: el alto, el diálogo abierto, los botones y campos a la vista y los avisos. Corre en el navegador. */
function medirLaPantalla() {
  const modal = [...document.querySelectorAll('dialog[open]')].pop() ?? null;
  const raiz = modal ?? document.body;
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(e);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[inert], [aria-hidden="true"]');
  };
  const enPantalla = (e) => {
    const r = e.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const acciones = [...raiz.querySelectorAll('button, a[href], summary, [role="button"], [role="tab"], [role="menuitem"]')].filter(visible);
  const opciones = [...raiz.querySelectorAll('input[type="radio"], input[type="checkbox"]')].filter((e) => visible(e) || (e.closest('label') && visible(e.closest('label'))));
  const campos = [...raiz.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea')].filter(visible);
  const texto = (e) => e?.innerText?.replace(/\s+/g, ' ').trim() ?? null;
  const alto = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  return {
    ruta: location.pathname + location.search,
    alto,
    dialogo: modal
      ? {
          titulo: texto(modal.querySelector('h1, h2, h3, legend')) ?? modal.getAttribute('aria-label'),
          // Lo que le falta para entrar: lo que sobra en el diálogo o en la parte de adentro con scroll propio (el cuerpo
          // de un cajón o de un panel).
          sobra: Math.max(
            0,
            ...[modal, ...modal.querySelectorAll('*')]
              .filter((e) => e.scrollHeight > e.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(e).overflowY))
              .map((e) => e.scrollHeight - e.clientHeight),
          ),
        }
      : null,
    botones: { pantalla: acciones.filter(enPantalla).length, pagina: acciones.length },
    campos: { pantalla: campos.filter(enPantalla).length, pagina: campos.length },
    opciones: { pantalla: opciones.filter((e) => enPantalla(e.closest('label') ?? e)).length, pagina: opciones.length },
    avisos: [...document.querySelectorAll('[role="alert"], [role="status"], .aviso')].map(texto).filter(Boolean).slice(0, 8),
    titulo: document.title,
  };
}

/** Lo que había en pantalla cuando un paso falló: para corregir el recorrido sin otra corrida a ciegas. */
function loQueHabia() {
  const modal = document.querySelector('dialog:modal');
  const raiz = modal ?? document.body;
  const texto = (e) => (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const visibles = (sel) => [...raiz.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0);
  return {
    ruta: location.pathname + location.search,
    dialogo: modal ? texto(modal.querySelector('h1, h2, h3') ?? modal) : null,
    botones: visibles('button, a[href], summary, [role="tab"]').map(texto).filter(Boolean).slice(0, 90),
    rotulos: visibles('label, legend').map(texto).filter(Boolean).slice(0, 60),
    titulos: visibles('h1, h2, h3').map(texto).slice(0, 20),
    avisos: visibles('[role="alert"], [role="status"], .aviso').map(texto).slice(0, 8),
  };
}

const conTope = (promesa, ms) => Promise.race([promesa, new Promise((_, no) => setTimeout(() => no(new Error(`el paso tardó más de ${ms / 1000} s`)), ms))]);
const describir = (o) => (typeof o === 'string' ? o : JSON.stringify(o));

/** Un recorrido: un flujo de un profesional, con sus pasos, sus capturas y sus cuentas de clics. */
class Recorrido {
  constructor({ page, carpeta, asentar, pausa }) {
    Object.assign(this, { page, carpeta, asentar, pausa });
    this.pasos = [];
    this.clics = 0;
    this.campos = 0;
    this.desvios = 0;
    /** Los clics del camino desde la ficha (null hasta llegar a ella). */
    this.clicsDelCamino = null;
    this.camposDelCamino = null;
    this.errores = [];
    fs.mkdirSync(carpeta, { recursive: true });
  }

  /** Desde acá se cuenta el camino: el profesional está en la ficha de la persona. */
  desdeLaFicha() {
    this.clicsDelCamino = 0;
    this.camposDelCamino = 0;
  }

  async buscar(objetivo, { esperar = 10_000, campo = false } = {}) {
    const o = typeof objetivo === 'string' ? { css: objetivo } : objetivo;
    const fin = Date.now() + esperar;
    for (;;) {
      const h = o.etiqueta ? await this.page.evaluateHandle(campoPorRotulo, o) : await this.page.evaluateHandle(buscarEnLaPagina, { ...o, campo });
      const el = h.asElement();
      if (el) return el;
      await h.dispose();
      if (Date.now() > fin) throw new Error(`no aparece ${describir(objetivo)}`);
      await this.pausa(250);
    }
  }

  /** ¿Está? Sin esperar más de lo que se pide. */
  async hay(objetivo, esperar = 1500) {
    try {
      const el = await this.buscar(objetivo, { esperar });
      await el.dispose();
      return true;
    } catch {
      return false;
    }
  }

  async esperar(objetivo, esperar = 15_000) {
    const el = await this.buscar(objetivo, { esperar });
    await el.dispose();
  }

  /** Un clic real: lleva el elemento al centro y hace clic con el mouse; si algo lo tapa, el clic va al elemento. */
  async clic(objetivo, { camino = true, esperar = 10_000 } = {}) {
    const el = await this.buscar(objetivo, { esperar });
    await el.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
    const tapado = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(arriba && (arriba === e || e.contains(arriba) || arriba.contains(e)));
    });
    if (tapado) await el.evaluate((e) => e.click());
    else await el.click({ delay: 15 });
    await el.dispose();
    // El mouse se va a un costado: el globo de una pista (a los 350 ms de estar encima) no sale en la captura.
    await this.page.mouse.move(4, 4);
    this.contarClic(camino);
    await this.asentar(this.page);
  }

  contarClic(camino) {
    this.clics += 1;
    if (!camino) this.desvios += 1;
    else if (this.clicsDelCamino !== null) this.clicsDelCamino += 1;
  }

  /** Abre un menú de acciones por el texto de su botón y elige una acción. */
  async menu(textoDelBoton, textoDeLaAccion, opciones = {}) {
    await this.clic({ css: '.menu-de-acciones__boton', texto: textoDelBoton, ...(opciones.dentro ? { dentro: opciones.dentro } : {}) }, opciones);
    await this.clic({ css: '.menu-de-acciones__accion', texto: textoDeLaAccion, dentro: '.menu-de-acciones[data-abierto]' }, opciones);
  }

  /** Escribe en un campo como lo haría una persona: clic en el campo, borra lo que había y escribe. */
  async escribir(objetivo, texto, { borrar = true, camino = true, enter = false } = {}) {
    const el = await this.buscar(typeof objetivo === 'string' ? { css: objetivo } : objetivo, { campo: true });
    await el.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
    // Si algo lo tapa (una barra fija, un aviso), el clic iría a otro lado: el foco va directo al campo.
    const tapado = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(arriba && (arriba === e || e.contains(arriba) || arriba.contains(e)));
    });
    if (tapado) await el.focus();
    else await el.click();
    if (borrar) {
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');
    }
    if (texto) await this.page.keyboard.type(String(texto), { delay: 12 });
    if (enter) await this.page.keyboard.press('Enter');
    await el.dispose();
    await this.page.mouse.move(4, 4);
    this.campos += 1;
    if (camino && this.camposDelCamino !== null) this.camposDelCamino += 1;
    await this.pausa(250);
  }

  /** Elige en una lista desplegable por el valor o por el texto de la opción. */
  async elegir(objetivo, { valor, texto }, { camino = true } = {}) {
    const el = await this.buscar(typeof objetivo === 'string' ? { css: objetivo } : objetivo, { campo: true });
    await el.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
    const v = valor ?? (await el.evaluate((s, t) => [...s.options].find((o) => o.textContent.trim().toLocaleLowerCase('es').startsWith(t.toLocaleLowerCase('es')))?.value ?? null, texto));
    if (v === null) throw new Error(`la lista no tiene la opción «${texto}»`);
    await el.select(v);
    await el.dispose();
    this.contarClic(camino);
    await this.asentar(this.page);
  }

  /**
   * Lleva un elemento arriba de la pantalla, para la captura de lo que se ve. Adentro de un diálogo o de un cajón mueve
   * su propio scroll; en la página deja un margen arriba.
   */
  async mostrar(objetivo, { margen = 72 } = {}) {
    const el = await this.buscar(objetivo, { esperar: 3000 });
    await el.evaluate((e, m) => {
      e.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
      if (!e.closest('dialog')) window.scrollBy({ top: -m, behavior: 'instant' });
    }, margen);
    await el.dispose();
    await this.pausa(300);
  }

  async arriba() {
    await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await this.pausa(200);
  }

  /**
   * Si un paso anterior falló con un diálogo abierto, lo cierra con Escape (es «Volver» o «Cerrar»), para que el
   * siguiente arranque desde la página. No cuenta como clic.
   */
  async cerrarDialogos() {
    for (let i = 0; i < 3 && (await this.page.evaluate(() => Boolean(document.querySelector('dialog:modal')))); i++) {
      await this.page.keyboard.press('Escape');
      await this.pausa(400);
    }
  }

  /** Hace clic en el primero que esté: el elemento con su nombre exacto o, si no está, el que se pide como reemplazo. */
  async clicEnElPrimero(objetivos, opciones = {}) {
    for (const o of objetivos.slice(0, -1)) {
      if (await this.hay(o, 4000)) return this.clic(o, opciones);
    }
    return this.clic(objetivos.at(-1), opciones);
  }

  /** Espera a que se cumpla algo en la página (una función que corre en el navegador). */
  async esperarQue(fn, arg = null, ms = 15_000) {
    await this.page.waitForFunction(fn, { timeout: ms, polling: 200 }, arg);
    await this.asentar(this.page);
  }

  /**
   * Los editores de plan guardan solos a los 4 s del último cambio. Antes de seguir, si quedó algo sin guardar, se
   * guarda con «Guardar cambios», como lo haría el profesional, y se espera a que diga «Guardado».
   */
  async guardarSiHaceFalta(editor, { camino = true } = {}) {
    const estado = () => this.page.evaluate((e) => document.querySelector(`${e} p.estado-de-guardado`)?.getAttribute('data-estado') ?? null, editor);
    for (let i = 0; i < 40 && (await estado()) === 'guardando'; i++) await this.pausa(250);
    if ((await estado()) === 'pendiente') await this.clic({ css: `${editor} .editor-del-plan__acciones button`, texto: 'Guardar cambios' }, { camino });
    await this.page.waitForFunction((e) => document.querySelector(`${e} p.estado-de-guardado`)?.getAttribute('data-estado') === 'guardado', { timeout: 20_000, polling: 250 }, editor);
    await this.asentar(this.page);
  }

  /** La captura de lo que se ve y, si no entra, la de la página (o el diálogo) entera. */
  async capturar(base) {
    await this.pausa(500);
    const medida = await this.page.evaluate(medirLaPantalla);
    const pantalla = `${base}-pantalla.png`;
    await this.page.screenshot({ path: path.join(this.carpeta, pantalla) });
    // Con un diálogo abierto, lo que no entra es el diálogo: la ventana se estira a su alto más los márgenes.
    const altoNecesario = medida.dialogo ? ALTO + medida.dialogo.sobra : medida.alto;
    let entera = null;
    if (altoNecesario > ALTO + 8) {
      const scroll = await this.page.evaluate(() => [window.scrollX, window.scrollY]);
      entera = `${base}-entera.png`;
      await this.page.setViewport({ width: ANCHO, height: Math.min(altoNecesario, 16_000), deviceScaleFactor: 1 });
      await this.pausa(800);
      await this.page.screenshot({ path: path.join(this.carpeta, entera) });
      await this.page.setViewport({ width: ANCHO, height: ALTO, deviceScaleFactor: 1 });
      await this.pausa(400);
      await this.page.evaluate(([x, y]) => window.scrollTo({ left: x, top: y, behavior: 'instant' }), scroll);
      await this.pausa(200);
    }
    const pantallas = Math.round((altoNecesario / ALTO) * 10) / 10;
    return { pantalla, entera, medida, pantallas, altoMedido: altoNecesario };
  }

  /**
   * Un paso: hace lo que hace el profesional y saca la captura. `def` dice qué pantalla es, qué hace y qué espera lograr
   * (va a flujos.json y al LEEME). `enfocar` lleva un elemento arriba antes de la captura de lo que se ve.
   */
  async paso(def, accion = null, { enfocar = null, tope = 120_000 } = {}) {
    const antes = { clics: this.clics, campos: this.campos, desvios: this.desvios };
    let estado = 'hecho';
    let error = null;
    let diagnostico = null;
    if (accion) {
      try {
        await conTope(accion(this), tope);
      } catch (e) {
        estado = 'fallo';
        error = String(e?.message ?? e).slice(0, 500);
        diagnostico = await this.page.evaluate(loQueHabia).catch(() => null);
        console.error(`✗ ${def.codigo} ${def.nombre}: ${error}`);
      }
    }
    const aMostrar = typeof enfocar === 'function' ? enfocar() : enfocar;
    if (aMostrar) await this.mostrar(aMostrar).catch(() => {});
    let captura = null;
    try {
      captura = await this.capturar(`${def.codigo}-${def.nombre}`);
    } catch (e) {
      error = `${error ?? ''} · la captura falló: ${String(e?.message ?? e).slice(0, 200)}`;
    }
    // `pantalla` es lo que dice el paso; en la fila va como `queEs`, porque `pantalla` es el nombre de la imagen.
    const { pantalla: queEs, ...resto } = def;
    const fila = {
      ...resto,
      queEs,
      estado,
      error,
      diagnostico,
      clicsDelPaso: this.clics - antes.clics,
      desviosDelPaso: this.desvios - antes.desvios,
      camposDelPaso: this.campos - antes.campos,
      clicsAcumulados: this.clics,
      clicsDelCamino: this.clicsDelCamino,
      camposDelCamino: this.camposDelCamino,
      ...(captura ?? {}),
    };
    this.pasos.push(fila);
    const m = captura?.medida;
    console.log(`${estado === 'hecho' ? '✓' : '✗'} ${def.codigo} ${def.nombre} · ${captura?.pantallas ?? '?'} pantallas · ${m ? `${m.botones.pantalla}/${m.botones.pagina} botones` : ''} · ${fila.clicsDelPaso} clics`);
    return estado === 'hecho';
  }

  /** Un paso pedido que el website no tiene: queda anotado, sin captura. */
  noExiste(def, motivo) {
    const { pantalla: queEs, ...resto } = def;
    this.pasos.push({ ...resto, queEs, estado: 'no existe', motivo });
    console.log(`– ${def.codigo} ${def.nombre}: no existe · ${motivo}`);
  }

  /** Lo que el flujo deja para la tabla del LEEME. */
  resumen(extra = {}) {
    return { pasos: this.pasos, clics: this.clics, campos: this.campos, desvios: this.desvios, errores: this.errores, ...extra };
  }
}

async function entrar(page, { WEB, cuentas, prefijo, asentar }) {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent('/pro')}`, { waitUntil: 'networkidle0' });
  await page.type('#correo', cuentas[`${prefijo}_CORREO`]);
  await page.type('#contrasena', cuentas[`${prefijo}_CLAVE`]);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro'), { timeout: 60_000 });
  await asentar(page);
}

// ─── Los flujos ─────────────────────────────────────────────────────────────────────────────────────────────────
// Cada paso dice qué pantalla es, qué hace el profesional y qué espera lograr (`pantalla`, `hace`, `espera`), y a qué
// punto del pedido de Dirección responde (`pedido`). Los clics con `{ camino: false }` son desvíos: lo que se hace para
// mostrar algo (un error, una opción, una página) y no hace falta para llegar a activar.

const EDITOR_TRN = '.editor-de-entrenamiento';
const BARRA_TRN = `${EDITOR_TRN} .editor-del-plan__acciones button`;
const EDITOR_NUT = 'section.editor-del-plan';
const BARRA_NUT = `${EDITOR_NUT} .editor-del-plan__acciones button`;
const sinModal = () => !document.querySelector('dialog:modal');

/** Del Espacio a la ficha de una persona, por su renglón de «Tus asesorados» (la cartera). */
async function abrirLaFicha(r, id) {
  await r.esperar('#tus-asesorados li.persona', 30_000);
  await r.clic(`#tus-asesorados li.persona[data-persona="${id}"] a.persona__abrir`);
  await r.esperarQue(() => {
    const t = document.querySelector('h1#titulo-asesorado')?.textContent?.trim();
    return Boolean(t && t !== 'Asesorado' && document.querySelector('.ficha__cuerpo .areas section.area'));
  }, null, 30_000);
}

/** Vuelve al Espacio profesional con su enlace de la barra de navegación. */
async function alEspacio(r, opciones = {}) {
  await r.clic('nav.navegacion a[href="/pro"]', opciones);
  await r.esperar('#tus-asesorados li.persona', 30_000);
}

/** Una sección de un área («Resumen», «Plan», «Registros», «Revisiones»), con la barra de secciones. */
async function seccion(r, area, vista, opciones = {}) {
  await r.esperar(`nav.pestanas[aria-label="Secciones de ${area}"] a[href*="vista=${vista}"]`, 20_000);
  await r.clic(`nav.pestanas[aria-label="Secciones de ${area}"] a[href*="vista=${vista}"]`, opciones);
  await r.esperarQue((v) => new URLSearchParams(location.search).get('vista') === v, vista);
}

// ── A · Entrenamiento: Prof. Martín Acosta, con Diego Sosa ──

async function flujoDeEntrenamiento(r, { personas }) {
  const { diego } = personas;
  const d = {};
  const fichaYPlan = { pedido: 'A1' };

  await r.paso(
    { codigo: 'A01', nombre: 'cartera', ...fichaYPlan, pantalla: 'El Espacio profesional de Martín Acosta, bajado hasta «Tus asesorados», la lista de las personas con las que trabaja (la cartera).', hace: 'Entra al website y busca a Diego Sosa en su cartera.', espera: 'Encontrar rápido a la persona cuyo plan de entrenamiento quiere cambiar.' },
    (r) => r.esperar('#tus-asesorados li.persona', 30_000),
    { enfocar: '#tus-asesorados' },
  );
  await r.paso(
    { codigo: 'A02', nombre: 'ficha-de-la-persona', ...fichaYPlan, pantalla: 'La ficha de Diego Sosa: su resumen, con una tarjeta por cada área que Martín atiende (acá, Entrenamiento).', hace: 'Hace clic en el nombre de Diego en la cartera.', espera: 'Ver de un vistazo cómo viene Diego antes de tocar el plan.' },
    async (r) => {
      await abrirLaFicha(r, diego);
      r.desdeLaFicha();
    },
  );
  await r.paso(
    { codigo: 'A03', nombre: 'entrenamiento-resumen', ...fichaYPlan, pantalla: 'El área Entrenamiento de Diego, en su sección «Resumen», con la barra de secciones (Resumen, Plan, Registros, Revisiones).', hace: 'Hace clic en «Abrir Entrenamiento» en la tarjeta del área.', espera: 'Entrar al área para llegar al plan.' },
    async (r) => {
      await r.clic('section.area[data-area="ENTRENAMIENTO"] a.area__abrir');
      await r.esperar('nav.pestanas[aria-label="Secciones de Entrenamiento"]', 20_000);
    },
  );
  await r.paso(
    { codigo: 'A04', nombre: 'plan-vigente', ...fichaYPlan, pantalla: 'La sección «Plan» con el plan activo de Diego en solo lectura: la versión vigente, el bloque, las sesiones (una a la vista) y el historial de versiones.', hace: 'Hace clic en la sección «Plan».', espera: 'Ver qué tiene hoy Diego indicado antes de cambiarlo.' },
    async (r) => {
      await seccion(r, 'Entrenamiento', 'plan');
      await r.esperar('[data-crear-version]', 20_000);
    },
  );
  await r.paso(
    { codigo: 'A05', nombre: 'guardar-la-version-activa-como-plantilla', pedido: 'A7', pantalla: 'El diálogo «Guardar como plantilla», abierto desde el menú «Plantillas» del plan activo, con el nombre escrito.', hace: 'Abre el menú «Plantillas», elige «Guardar como plantilla» y escribe un nombre.', espera: 'Guardar este plan como modelo para usarlo con otras personas.' },
    async (r) => {
      await r.menu('Plantillas', 'Guardar como plantilla', { camino: false });
      await r.esperar({ css: 'h2', texto: 'Guardar como plantilla' });
      await r.escribir({ etiqueta: 'Nombre' }, 'Fuerza 3 · cuatro días', { camino: false });
    },
  );
  await r.paso(
    { codigo: 'A06', nombre: 'empezar-desde-una-plantilla', pedido: 'A7', pantalla: 'El diálogo «Empezar desde una plantilla», con la plantilla recién guardada elegida.', hace: 'Guarda la plantilla; después abre otra vez «Plantillas» y elige «Empezar desde una plantilla» para ver cómo se arrancaría una versión desde un modelo.', espera: 'Saber que puede arrancar una versión nueva desde una plantilla en lugar de copiar la vigente.' },
    async (r) => {
      await r.clic({ css: '.acciones button', texto: 'Guardar la plantilla' }, { camino: false });
      await r.esperarQue(sinModal);
      await r.menu('Plantillas', 'Empezar desde una plantilla', { camino: false });
      await r.esperar('dialog[open] .plantillas-para-empezar', 15_000);
      await r.clic({ css: 'label.plantilla-para-empezar', texto: 'Fuerza 3 · cuatro días' }, { camino: false });
    },
  );
  await r.paso(
    { codigo: 'A07', nombre: 'nueva-version-borrador', pedido: 'A2', pantalla: 'El editor de la versión en preparación (borrador): la barra con «Guardar como plantilla», «Revisar el plan», «Activar plan» y «Guardar cambios», los días de entrenamiento, el bloque, las sesiones y los ejercicios plegados.', hace: 'Cierra el diálogo con «Cancelar» y hace clic en «Nueva versión del plan».', espera: 'Tener una copia editable del plan vigente que Diego todavía no ve.' },
    async (r) => {
      if (await r.hay({ texto: 'Cancelar' }, 1500)) await r.clic({ texto: 'Cancelar' }, { camino: false });
      await r.cerrarDialogos();
      await r.clic('[data-crear-version]');
      await r.esperar('#titulo-borrador', 30_000);
    },
  );
  await r.paso(
    { codigo: 'A08', nombre: 'agregar-una-sesion', pedido: 'A3', pantalla: 'El editor con una sesión nueva, «Tren superior liviano», todavía sin ejercicios.', hace: 'Abre el menú «Agregar» de las sesiones, elige «Una sesión nueva», le escribe el nombre y guarda.', espera: 'Sumar un quinto día de entrenamiento al plan.' },
    async (r) => {
      await r.cerrarDialogos();
      await r.clic('#agregar-sesion');
      await r.clic({ css: '.menu-de-acciones__accion', texto: 'Una sesión nueva', dentro: '.menu-de-acciones[data-abierto]' });
      await r.escribir({ etiqueta: 'Nombre de la sesión' }, 'Tren superior liviano', { enter: true });
      await r.guardarSiHaceFalta(EDITOR_TRN);
    },
  );
  await r.paso(
    { codigo: 'A09', nombre: 'revisar-el-plan-con-un-error', pedido: 'A8', pantalla: 'El editor después de «Revisar el plan», con la lista de lo que hay que corregir antes de activar (la sesión nueva no tiene ejercicios) y lo que queda sin completar.', hace: 'Hace clic en «Revisar el plan» con la sesión nueva todavía vacía.', espera: 'Saber si la versión está lista para activar y qué le falta.' },
    async (r) => {
      await r.clic({ css: BARRA_TRN, texto: 'Revisar el plan' }, { camino: false });
      await r.esperar(`${EDITOR_TRN} .aviso--error [data-problema]`, 20_000);
    },
    { enfocar: `${EDITOR_TRN} .aviso--error` },
  );
  await r.paso(
    { codigo: 'A10', nombre: 'activar-con-algo-incompleto', pedido: 'A8', pantalla: 'El editor después de intentar activar con la sesión vacía: el diálogo de activación se cerró y quedó la lista de errores.', hace: 'Hace clic en «Activar plan», elige «Sin fecha por ahora» en «¿Cuándo la revisás?» y confirma con «Activar esta versión», sin haber corregido nada.', espera: 'Activar; el sistema no lo deja porque hay una sesión sin ejercicios.' },
    async (r) => {
      await r.clic({ css: BARRA_TRN, texto: 'Activar plan' }, { camino: false });
      await r.esperar('dialog[open] #trn-proxima-revision', 15_000);
      await r.clic('dialog[open] #trn-proxima-revision input[value="sin-fecha"]', { camino: false });
      await r.clic({ css: '.acciones button', texto: 'Activar esta versión' }, { camino: false });
      await r.esperarQue(sinModal, null, 20_000);
      await r.esperar(`${EDITOR_TRN} .aviso--error [data-problema]`, 20_000);
    },
    { enfocar: `${EDITOR_TRN} .aviso--error` },
  );
  await r.paso(
    { codigo: 'A11', nombre: 'agregar-ejercicio-buscador-del-catalogo', pedido: 'A4', pantalla: 'El panel lateral «Agregar ejercicio» con el buscador del catálogo y «Sentadilla» escrita: los resultados del catálogo BE y los ejercicios propios de Martín.', hace: 'Hace clic en «Agregar ejercicio» en la sesión nueva, escribe «Sentadilla» y aprieta Enter.', espera: 'Encontrar el ejercicio que quiere indicar.' },
    async (r) => {
      await r.clic('[data-agregar-ejercicio]');
      await r.esperar('dialog.cajon[open] input[type="search"]');
      await r.escribir('dialog.cajon[open] input[type="search"]', 'Sentadilla', { enter: true });
      await r.esperar('dialog.cajon[open] [data-resultados="lista"] tr[data-ejercicio-del-catalogo]', 20_000);
    },
  );
  await r.paso(
    { codigo: 'A12', nombre: 'agregar-ejercicio-mis-habituales', pedido: 'A4', pantalla: 'El mismo panel, después de elegir «Sentadilla» y marcarla como habitual: arriba aparece en «Mis habituales» para agregarla con un clic la próxima vez.', hace: 'Hace clic en «Elegir» al lado de Sentadilla y después en «Marcar como habitual».', espera: 'Agregar el ejercicio y tenerlo a mano para otros planes.' },
    async (r) => {
      await r.clicEnElPrimero(['dialog.cajon[open] button[aria-label="Elegir Sentadilla"]', 'dialog.cajon[open] tr[data-ejercicio-del-catalogo] button[aria-label^="Elegir "]']);
      await r.esperar('dialog.cajon[open] p[data-agregado]');
      await r.clicEnElPrimero(['dialog.cajon[open] button[aria-label="Marcar como habitual: Sentadilla"]', 'dialog.cajon[open] button[aria-label^="Marcar como habitual: "]'], { camino: false });
      await r.esperar('dialog.cajon[open] [data-habituales="ejercicios"] button[aria-label^="Agregar "]');
    },
    { enfocar: 'dialog.cajon[open] [data-habituales="ejercicios"]' },
  );
  await r.paso(
    { codigo: 'A13', nombre: 'crear-un-ejercicio-propio', pedido: 'A4', pantalla: 'El panel «Agregar ejercicio» en «Crear manualmente», con el nombre de un ejercicio propio escrito.', hace: 'Hace clic en «Crear manualmente» y escribe «Pallof press con banda».', espera: 'Indicar un ejercicio que no está en el catálogo.' },
    async (r) => {
      await r.clic({ css: 'dialog.cajon[open] button', texto: 'Crear manualmente' }, { camino: false });
      await r.escribir({ etiqueta: 'Nombre del ejercicio' }, 'Pallof press con banda', { camino: false });
    },
  );
  await r.paso(
    { codigo: 'A14', nombre: 'sesion-con-los-ejercicios', pedido: 'A4', pantalla: 'La sesión «Tren superior liviano» con sus dos ejercicios, plegados: cada uno dice en un renglón lo que piden sus series.', hace: 'Hace clic en «Crear y agregar», cierra el panel y guarda.', espera: 'Ver la sesión armada antes de completar cada ejercicio.' },
    async (r) => {
      await r.clic('dialog.cajon[open] form.agregar-item__otro button[type="submit"]', { camino: false });
      await r.esperar({ css: 'dialog.cajon[open] p[data-agregado]', texto: 'Pallof' }, 15_000);
      await r.clic('dialog.cajon[open] .cajon__cerrar');
      await r.esperarQue(() => !document.querySelector('dialog.cajon[open]'));
      await r.guardarSiHaceFalta(EDITOR_TRN);
    },
    { enfocar: `${EDITOR_TRN} .ejercicios-del-editor` },
  );
  await r.paso(
    { codigo: 'A15', nombre: 'prescripcion-por-serie', pedido: 'A5', pantalla: 'La Sentadilla abierta: el criterio de intensidad (RIR) con su objetivo, la carga sugerida, el descanso, la tabla de series con repeticiones o rango, la nota y el tempo como parámetro.', hace: 'Abre el ejercicio y completa RIR 2, 60 kg, 90 s de descanso, 10-12 repeticiones, dos series más, una nota y el tempo.', espera: 'Dejar la prescripción completa, como la va a recibir Diego en el teléfono.' },
    async (r) => {
      const p = await r.page.$eval(`${EDITOR_TRN} section.ejercicio-del-editor[data-ejercicio="1"] [id^="abrir-ejercicio-"]`, (e) => e.id.replace('abrir-ejercicio-', ''));
      d.p = p;
      const sec = `${EDITOR_TRN} section.ejercicio-del-editor[data-ejercicio="1"]`;
      await r.clic(`#abrir-ejercicio-${p}`);
      await r.esperar(`#${p}-criterio`);
      await r.elegir(`#${p}-criterio`, { valor: 'RIR' });
      await r.escribir(`#${p}-objetivo`, '2');
      await r.escribir(`#${p}-carga`, '60');
      await r.escribir(`#${p}-descanso`, '90');
      await r.escribir(`#${p}-serie-0`, '10-12');
      await r.clic(`${sec} [data-agregar-serie]`);
      await r.clic(`${sec} [data-agregar-serie]`);
      await r.escribir(`#${p}-nota`, 'Controlá la bajada, sin rebotar abajo.');
      await r.clic(`${sec} [data-agregar-parametro]`);
      await r.escribir(`#${p}-param-0-etiqueta`, 'Tempo');
      await r.escribir(`#${p}-param-0-valor`, 'Bajar en 3 segundos y subir en 1');
    },
    { enfocar: `${EDITOR_TRN} section.ejercicio-del-editor[data-ejercicio="1"]` },
  );
  await r.paso(
    { codigo: 'A16', nombre: 'objetivos-distintos-por-serie', pedido: 'A5', pantalla: 'La tabla de series de la Sentadilla con objetivos propios en algunas series: 10, 8 repeticiones, un descanso de 2 minutos en la última y 50 kg en la primera; en gris, lo que toman de lo general.', hace: 'Escribe valores distintos en las celdas de cada serie.', espera: 'Indicar una progresión dentro del ejercicio: una serie de aproximación y repeticiones que bajan.' },
    async (r) => {
      await r.escribir(`#${d.p}-serie-1`, '10');
      await r.escribir(`#${d.p}-serie-2`, '8');
      await r.escribir(`#${d.p}-serie-2-descanso`, '2:00');
      await r.escribir(`#${d.p}-serie-0-carga`, '50');
      await r.pausa(600);
    },
    { enfocar: `${EDITOR_TRN} section.ejercicio-del-editor[data-ejercicio="1"] table` },
  );
  await r.paso(
    { codigo: 'A17', nombre: 'activar-apagado-por-la-app-de-la-persona', pedido: 'A5', pantalla: 'La barra del editor con «Activar plan» apagado y el aviso «Todavía no podés activar este plan»: la carga distinta en una serie no la puede mostrar la app que usa Diego.', hace: 'Vuelve arriba, a la barra del editor, para activar.', espera: 'Activar; el sistema avisa que todavía no se puede con objetivos de carga distintos por serie.' },
    (r) => r.esperar('#motivo-sin-activar', 8000),
    { enfocar: '#motivo-sin-activar' },
  );
  await r.paso(
    { codigo: 'A18', nombre: 'agenda-de-dias', pedido: 'A6', pantalla: 'La agenda «Días de entrenamiento» abierta: una fila por sesión y un botón por día de la semana, con lunes, martes, jueves, viernes y sábado elegidos.', hace: 'Borra la carga propia de la primera serie (vuelve a tomar la general), guarda, hace clic en «Elegir los días» y marca un día para cada sesión.', espera: 'Que Diego sepa qué sesión toca cada día y reciba sus avisos.' },
    async (r) => {
      await r.escribir(`#${d.p}-serie-0-carga`, '', { camino: false });
      await r.guardarSiHaceFalta(EDITOR_TRN);
      await r.clic('[data-abrir-agenda]');
      for (const [sesion, dia] of [['Piernas A', 'lunes'], ['Torso A', 'martes'], ['Piernas B', 'jueves'], ['Torso B', 'viernes'], ['Tren superior liviano', 'sábado']]) {
        await r.clic(`button[aria-label="${sesion}, ${dia}"]`);
      }
    },
    { enfocar: 'section.agenda-del-plan' },
  );
  await r.paso(
    { codigo: 'A19', nombre: 'guardar-el-borrador-como-plantilla', pedido: 'A7', pantalla: 'El diálogo «Guardar como plantilla» abierto desde el borrador, con las notas que se van a copiar y el nombre escrito.', hace: 'Cierra la agenda con «Listo», guarda y hace clic en «Guardar como plantilla» en la barra del editor.', espera: 'Guardar la nueva estructura de cinco días como modelo.' },
    async (r) => {
      if (await r.hay('[data-cerrar-agenda]', 1500)) await r.clic('[data-cerrar-agenda]');
      await r.guardarSiHaceFalta(EDITOR_TRN);
      await r.clic('[data-guardar-como-plantilla]', { camino: false });
      await r.esperar({ css: 'h2', texto: 'Guardar como plantilla' });
      await r.escribir({ etiqueta: 'Nombre' }, 'Fuerza 3 · cinco días', { camino: false });
    },
  );
  await r.paso(
    { codigo: 'A20', nombre: 'revisar-el-plan-antes-de-activar', pedido: 'A8', pantalla: 'El editor después de «Revisar el plan» con todo corregido: lo que dice cuando no hay nada que impida activar.', hace: 'Guarda la plantilla y hace clic en «Revisar el plan».', espera: 'Confirmar que la versión está lista antes de activarla.' },
    async (r) => {
      if (await r.hay({ css: '.acciones button', texto: 'Guardar la plantilla' }, 1500)) {
        await r.clic({ css: '.acciones button', texto: 'Guardar la plantilla' }, { camino: false });
        await r.esperarQue(sinModal);
      }
      await r.cerrarDialogos();
      await r.clic({ css: BARRA_TRN, texto: 'Revisar el plan' });
      await r.pausa(800);
    },
  );
  await r.paso(
    { codigo: 'A21', nombre: 'activar-el-plan-confirmacion', pedido: 'A9', pantalla: 'El diálogo «Activar plan»: qué entra y qué queda en el historial, los días de entrenamiento y «¿Cuándo la revisás?» con una opción elegida.', hace: 'Hace clic en «Activar plan» y elige «Sin fecha por ahora».', espera: 'Confirmar el cambio sabiendo qué va a ver Diego y cuándo lo revisa.' },
    async (r) => {
      await r.clic({ css: BARRA_TRN, texto: 'Activar plan' });
      await r.esperar('dialog[open] #trn-proxima-revision', 15_000);
      await r.clic('dialog[open] #trn-proxima-revision input[value="sin-fecha"]');
    },
  );
  await r.paso(
    { codigo: 'A22', nombre: 'plan-activado', pedido: 'A9', pantalla: 'El plan activo después de activar: la versión nueva vigente, el aviso de que Diego ya la ve y el historial con la versión anterior.', hace: 'Hace clic en «Activar esta versión».', espera: 'Que Diego tenga el plan nuevo en su teléfono.' },
    async (r) => {
      await r.clic({ css: '.acciones button', texto: 'Activar esta versión' });
      await r.esperar({ css: '.aviso-flotante__texto p', texto: 'Plan activado' }, 20_000);
      d.hastaActivar = { clics: r.clicsDelCamino, campos: r.camposDelCamino, pasos: r.pasos.length + 1 };
    },
  );
  await r.paso(
    { codigo: 'A23', nombre: 'cola-de-revisiones', pedido: 'A10', pantalla: 'El Espacio profesional, en «Te toca a vos»: las revisiones vencidas o próximas de la cartera de Martín.', hace: 'Vuelve al Espacio profesional desde la barra de navegación.', espera: 'Ver a quién le toca revisar el plan esta semana.' },
    async (r) => {
      await alEspacio(r);
      await r.esperar('#te-toca-a-vos', 20_000);
    },
    { enfocar: '#te-toca-a-vos' },
  );
  await r.paso(
    { codigo: 'A24', nombre: 'revisiones-de-la-persona', pedido: 'A10', pantalla: 'La sección «Revisiones» del Entrenamiento de Diego: las revisiones registradas y el botón «Nueva revisión».', hace: 'Hace clic en «Revisar» en el renglón de Diego.', espera: 'Llegar a la revisión del plan de Diego.' },
    async (r) => {
      const enLaCola = `a.pendiente__enlace[data-pendiente$="|training|${diego}"]`;
      if (await r.hay(enLaCola, 3000)) await r.clic(enLaCola);
      else {
        // Si Diego no está en la cola, se llega por su ficha: queda anotado en el error del paso.
        d.sinCola = true;
        await abrirLaFicha(r, diego);
        await r.clic('section.area[data-area="ENTRENAMIENTO"] a.area__abrir');
        await seccion(r, 'Entrenamiento', 'revisiones');
      }
      await r.esperar('#titulo-revisiones-trn', 20_000);
      if (d.sinCola) throw new Error('Diego no estaba en «Te toca a vos»: se llegó a sus revisiones por la ficha.');
    },
  );
  await r.paso(
    { codigo: 'A25', nombre: 'nueva-revision-con-errores', pedido: 'A10', pantalla: 'El formulario «Nueva revisión de Entrenamiento» enviado vacío: el resumen «Para registrar la revisión falta:» con cada dato que falta.', hace: 'Hace clic en «Nueva revisión» y, sin completar nada, en «Registrar revisión».', espera: 'Registrar la revisión; el sistema le dice qué le falta.' },
    async (r) => {
      await r.clic('section.revisiones .revisiones__encabezado button.boton--primario');
      await r.esperar('#titulo-revision-nueva-trn', 15_000);
      await r.clic('form.revision-nueva__formulario button[type="submit"]', { camino: false });
      await r.esperar('form.revision-nueva__formulario > .aviso--error');
    },
    { enfocar: 'form.revision-nueva__formulario > .aviso--error' },
  );
  await r.paso(
    { codigo: 'A26', nombre: 'nueva-revision-completa', pedido: 'A10', pantalla: 'El mismo formulario completo: la evidencia examinada, la interpretación, el resultado «Ajustar», el fundamento, la próxima acción y cuándo se revisa.', hace: 'Marca la evidencia, escribe la interpretación, elige «Ajustar», escribe el fundamento y la próxima acción, y elige «En 4 semanas».', espera: 'Dejar asentado por qué ajusta el plan y qué va a cambiar.' },
    async (r) => {
      await r.clic('#trn-revision-evidencia .evidencia__otras input[type="checkbox"]');
      await r.escribir('#trn-revision-interpretacion', 'Sostiene las cuatro sesiones por semana. La sentadilla subió de 125 a 130 kg sin molestias en el hombro.');
      await r.clic('input[type="radio"][name="trn-resultado"][value="ADJUST"]');
      await r.escribir('#trn-revision-fundamento', 'Lo registrado alcanza para decidir: seis semanas de sesiones completas.');
      await r.escribir('#trn-revision-accion', 'Subir la sentadilla a 130 kg y sumar una sesión liviana de tren superior.');
      await r.clic('#trn-revision-proxima input[value="en-4"]');
    },
    { enfocar: '#titulo-revision-nueva-trn' },
  );
  await r.paso(
    { codigo: 'A27', nombre: 'revision-registrada', pedido: 'A10', pantalla: 'La lista de revisiones con la nueva revisión registrada y todavía sin aplicar, con «Aplicar próxima acción».', hace: 'Hace clic en «Registrar revisión».', espera: 'Que la revisión quede guardada.' },
    async (r) => {
      await r.clic('form.revision-nueva__formulario button[type="submit"]');
      await r.esperar({ css: '.aviso-flotante__texto p', texto: 'Revisión registrada' }, 20_000);
    },
  );
  await r.paso(
    { codigo: 'A28', nombre: 'ajuste-aplicado', pedido: 'A10', pantalla: 'La lista de revisiones después de aplicar el «Ajustar»: el aviso de que se preparó una versión nueva en borrador, con el botón para abrirla.', hace: 'Hace clic en «Aplicar próxima acción» en la revisión recién registrada.', espera: 'Que el ajuste decidido se convierta en un borrador del plan para editar.' },
    async (r) => {
      await r.clic('section.revisiones ul.lista > li.lista__item:first-child button.boton--primario');
      await r.esperar({ css: '.aviso-flotante__texto p', texto: 'Próxima acción aplicada' }, 20_000);
    },
  );
  await r.paso(
    { codigo: 'A29', nombre: 'borrador-del-ajuste', pedido: 'A10', pantalla: 'El editor con el borrador que dejó el ajuste: la misma estructura del plan vigente, lista para cambiar.', hace: 'Hace clic en «Abrir el borrador en Plan» en el aviso.', espera: 'Hacer el ajuste que decidió en la revisión.' },
    async (r) => {
      await r.clic({ css: '.aviso-flotante button', texto: 'Abrir el borrador en Plan' });
      await r.esperar('#titulo-borrador', 20_000);
    },
  );
  r.noExiste(
    { codigo: 'A30', nombre: 'descartar-un-borrador', pedido: 'A11', pantalla: 'Descartar un borrador.', hace: 'Buscaría cómo descartar el borrador que no va a usar.', espera: 'Volver al plan vigente sin una versión en preparación colgada.' },
    'El website no ofrece descartar un borrador: el editor solo permite guardar, revisar, activar y guardar como plantilla. Mientras exista el borrador no se puede crear otra versión ni empezar desde una plantilla: la única salida es activarlo. (El sistema ya puede hacerlo por dentro; la pantalla no lo ofrece.)',
  );
  await r.paso(
    { codigo: 'A31', nombre: 'mis-ejercicios', pedido: 'A4', pantalla: 'La página «Mis ejercicios»: los ejercicios propios de Martín, con el que creó en el paso A13.', hace: 'Hace clic en «Mis ejercicios» en la barra de navegación.', espera: 'Ver y ordenar sus ejercicios propios.' },
    async (r) => {
      await r.clic('nav.navegacion a[href="/pro/exercises"]');
      await r.esperar({ css: 'h1', texto: 'Mis ejercicios' }, 20_000);
    },
  );
  await r.paso(
    { codigo: 'A32', nombre: 'plantillas-y-habituales', pedido: 'A7', pantalla: 'La página «Plantillas y habituales»: las dos plantillas de entrenamiento guardadas en este recorrido y los ejercicios habituales.', hace: 'Hace clic en «Plantillas y habituales» en la barra de navegación.', espera: 'Encontrar y administrar sus plantillas.' },
    async (r) => {
      await r.clic('nav.navegacion a[href="/pro/templates"]');
      await r.esperar({ css: 'h1', texto: 'Plantillas y habituales' }, 20_000);
    },
  );
  return { hastaActivar: d.hastaActivar ?? null };
}

// ── B · Nutrición: Lic. Sofía Paz, con Diego Sosa ──

async function flujoDeNutricion(r, { personas }) {
  const { diego } = personas;
  const d = { dia: '1' };
  /** El día tipo que se está mirando, por su posición desde 0 (el radio elegido de «Día tipo»). */
  const diaElegido = () => r.page.evaluate(() => document.querySelector(`.editor-del-plan__dia input[id^="dia-tipo-"]:checked`)?.id.replace('dia-tipo-', '') ?? '0');

  await r.paso(
    { codigo: 'B01', nombre: 'ficha-de-la-persona', pedido: 'B1', pantalla: 'La ficha de Diego Sosa vista por Sofía Paz: su resumen con las tarjetas de Nutrición y Antropometría.', hace: 'Desde «Tus asesorados», hace clic en el nombre de Diego.', espera: 'Ver cómo viene Diego antes de tocar su plan de alimentación.' },
    async (r) => {
      await abrirLaFicha(r, diego);
      r.desdeLaFicha();
    },
  );
  await r.paso(
    { codigo: 'B02', nombre: 'nutricion-resumen-con-el-objetivo', pedido: 'B2', pantalla: 'El área Nutrición en «Resumen», bajada hasta «Objetivo»: el requerimiento energético, los macronutrientes, el fundamento y desde cuándo rige.', hace: 'Hace clic en «Abrir Nutrición».', espera: 'Revisar el objetivo nutricional vigente antes de cambiar el plan.' },
    async (r) => {
      await r.clic('section.area[data-area="NUTRICION"] a.area__abrir');
      await r.esperar('section[aria-labelledby="titulo-objetivo"]', 20_000);
    },
    { enfocar: 'section[aria-labelledby="titulo-objetivo"]' },
  );
  await r.paso(
    { codigo: 'B03', nombre: 'nuevo-objetivo-con-un-error', pedido: 'B2', pantalla: 'El formulario «Nueva versión de objetivo» enviado con las calorías escritas con punto de miles («2.400»): el resumen de errores arriba y el error debajo del campo.', hace: 'Hace clic en «Nueva versión de objetivo», completa calorías, proteínas, carbohidratos, grasas y el fundamento, y hace clic en «Guardar nueva versión».', espera: 'Subir un poco la energía porque Diego entrena más; el sistema no entiende «2.400».' },
    async (r) => {
      await r.esperar('.secciones > .acciones > button.boton--secundario:not([disabled])', 20_000);
      await r.clic('.secciones > .acciones > button.boton--secundario');
      await r.esperar('#objetivo-kcal');
      await r.escribir('#objetivo-kcal', '2.400');
      await r.escribir('#objetivo-proteina', '150');
      await r.escribir('#objetivo-carbohidratos', '285');
      await r.escribir('#objetivo-grasas', '75');
      await r.escribir('#objetivo-fundamento', 'Entrena cinco veces por semana: un poco más de energía, con la misma proteína.');
      await r.clic('form.formulario button[type="submit"]', { camino: false });
      await r.esperar('#objetivo-kcal-error');
    },
    { enfocar: 'form.formulario' },
  );
  await r.paso(
    { codigo: 'B04', nombre: 'nuevo-objetivo-guardado', pedido: 'B2', pantalla: 'El objetivo después de guardar: 2.400 kcal por día y la historia del objetivo con una versión más.', hace: 'Corrige las calorías a «2400» y vuelve a hacer clic en «Guardar nueva versión».', espera: 'Que el objetivo nuevo quede vigente antes de armar el plan.' },
    async (r) => {
      await r.escribir('#objetivo-kcal', '2400', { camino: false });
      await r.clic('form.formulario button[type="submit"]');
      await r.esperarQue(() => !document.querySelector('#objetivo-kcal'), null, 20_000);
      await r.esperar('section[aria-labelledby="titulo-objetivo"]', 20_000);
    },
    { enfocar: 'section[aria-labelledby="titulo-objetivo"]' },
  );
  await r.paso(
    { codigo: 'B05', nombre: 'plan-vigente', pedido: 'B1', pantalla: 'La sección «Plan» con el plan activo en solo lectura: el día tipo, la tira del objetivo con el que se armó, las cuatro comidas con sus opciones (la primera abierta) y el historial.', hace: 'Hace clic en la sección «Plan».', espera: 'Ver qué come hoy Diego según el plan antes de cambiarlo.' },
    async (r) => {
      await seccion(r, 'Nutrición', 'plan');
      await r.esperar('[data-crear-version]', 20_000);
    },
  );
  await r.paso(
    { codigo: 'B06', nombre: 'nueva-version-borrador', pedido: 'B3', pantalla: 'El editor de la versión en preparación (borrador): la barra de acciones, el día tipo, la tira del objetivo y las comidas plegadas.', hace: 'Hace clic en «Nueva versión del plan».', espera: 'Tener una copia editable del plan vigente que Diego todavía no ve.' },
    async (r) => {
      await r.clic('[data-crear-version]');
      await r.esperar('#titulo-borrador', 30_000);
    },
  );
  await r.paso(
    { codigo: 'B07', nombre: 'tipos-de-dia', pedido: 'B3', pantalla: 'El editor con un segundo tipo de día, «Día de descanso», recién creado y elegido: todavía no tiene comidas.', hace: 'Hace clic en «Agregar» junto a «Día tipo» y le escribe el nombre al día nuevo.', espera: 'Tener un día más liviano para los días que no entrena.' },
    async (r) => {
      // Un día tipo nuevo y no una copia del habitual: en la primera corrida, con la copia del habitual más una colación con
      // un alimento, el borrador de Diego dejó de guardarse (la API rechazó cada PATCH en el parser, 400 sin ruta; su límite
      // es de 16 KB por pedido, bootstrap.ts) y el recorrido no pudo seguir. La copia sola se muestra en B27.
      await r.clic('[data-agregar-dia]');
      await r.esperarQue(() => document.activeElement?.matches?.('input[id^="dia-"]:not([id^="dia-tipo-"])'), null, 8000);
      const id = await r.page.evaluate(() => document.activeElement.id);
      await r.escribir(`#${id}`, 'Día de descanso', { enter: true });
      d.dia = await diaElegido();
    },
  );
  await r.paso(
    { codigo: 'B08', nombre: 'comida-y-opcion-nuevas', pedido: 'B3', pantalla: 'El «Día de descanso» con una comida nueva, «Colación», abierta, y su primera opción, «Fruta», todavía sin alimentos.', hace: 'Abre «Agregar comida», elige «Una comida vacía» y la nombra; después abre «Agregar opción», elige «Una opción nueva» y la nombra.', espera: 'Armar la colación del día de descanso.' },
    async (r) => {
      await r.clic('#agregar-comida');
      await r.clic({ css: '.menu-de-acciones__accion', texto: 'Una comida vacía', dentro: '.menu-de-acciones[data-abierto]' });
      await r.esperarQue(() => document.activeElement?.matches?.('input[id^="comida-"]'), null, 8000);
      const comida = await r.page.evaluate(() => document.activeElement.id);
      d.comida = comida.split('-').pop();
      await r.escribir(`#${comida}`, 'Colación', { enter: true });
      const seccionDeLaComida = `section.comida-del-editor[data-comida="${Number(d.comida) + 1}"]`;
      d.seccionDeLaComida = seccionDeLaComida;
      await r.clic(`${seccionDeLaComida} .comida-del-editor__opciones .menu-de-acciones__boton`);
      await r.clic({ css: '.menu-de-acciones__accion', texto: 'Una opción nueva', dentro: '.menu-de-acciones[data-abierto]' });
      await r.esperarQue(() => document.activeElement?.matches?.('input[id^="opcion-"]'), null, 8000);
      const opcion = await r.page.evaluate(() => document.activeElement.id);
      await r.escribir(`#${opcion}`, 'Fruta', { enter: true });
    },
    { enfocar: () => d.seccionDeLaComida },
  );
  await r.paso(
    { codigo: 'B09', nombre: 'buscador-de-alimentos', pedido: 'B4', pantalla: 'El panel lateral «Agregar ítem» con el buscador de alimentos y «banana» escrita: los resultados del catálogo con sus calorías y macronutrientes cada 100 g.', hace: 'Hace clic en «Agregar ítem» en la opción «Fruta», escribe «banana» y aprieta Enter.', espera: 'Encontrar el alimento que quiere indicar.' },
    async (r) => {
      await r.clic(`${d.seccionDeLaComida} [data-agregar-item]`);
      await r.esperar('dialog.cajon[open] input[type="search"]');
      await r.escribir('dialog.cajon[open] input[type="search"]', 'banana', { enter: true });
      await r.esperar('dialog.cajon[open] [data-resultados="lista"]', 20_000);
    },
  );
  await r.paso(
    { codigo: 'B10', nombre: 'alimento-con-cantidad', pedido: 'B4', pantalla: 'La opción «Fruta» con la banana agregada: la fila del ítem con la cantidad (120 g), la unidad y el estado de preparación sin indicar.', hace: 'Hace clic en «Elegir» al lado de Banana, cierra el panel, escribe la cantidad y guarda (deja el estado de preparación sin indicar).', espera: 'Indicar cuánto comer de cada alimento.' },
    async (r) => {
      await r.clicEnElPrimero(['dialog.cajon[open] button[aria-label="Elegir Banana"]', 'dialog.cajon[open] [data-resultados="lista"] tr button[aria-label^="Elegir "]']);
      await r.esperar('dialog.cajon[open] [data-agregado]');
      await r.clic('dialog.cajon[open] .cajon__cerrar');
      await r.esperarQue(() => !document.querySelector('dialog.cajon[open]'));
      const cantidad = await r.page.$eval(`${d.seccionDeLaComida} input[id^="item-"][id$="-cantidad"]`, (e) => e.id);
      d.item = cantidad.replace(/-cantidad$/, '');
      await r.escribir(`#${cantidad}`, '120');
      await r.guardarSiHaceFalta(EDITOR_NUT);
    },
    { enfocar: () => d.seccionDeLaComida },
  );
  await r.paso(
    { codigo: 'B11', nombre: 'mis-recetas', pedido: 'B4', pantalla: 'La página «Mis recetas» de Sofía, todavía sin recetas.', hace: 'Para usar una receta como opción primero tiene que existir: deja el borrador guardado y va a «Mis recetas» desde la barra de navegación.', espera: 'Crear la receta que quiere ofrecer en la merienda.' },
    async (r) => {
      await r.clic('nav.navegacion a[href="/pro/recipes"]');
      await r.esperar({ css: 'h1', texto: 'Mis recetas' }, 20_000);
    },
  );
  await r.paso(
    { codigo: 'B12', nombre: 'receta-nueva-con-un-error', pedido: 'B4', pantalla: 'El editor de recetas («Nueva receta») guardado solo con el nombre: el resumen «Revisá estos datos antes de guardar» pide al menos un ingrediente.', hace: 'Hace clic en «Nueva receta», escribe el nombre y hace clic en «Guardar receta».', espera: 'Guardar la receta; el sistema le pide los ingredientes.' },
    async (r) => {
      await r.clic({ css: '.seccion .acciones button', texto: 'Nueva receta' });
      await r.esperar('#receta-nombre', 15_000);
      await r.escribir('#receta-nombre', 'Yogur con avena y banana');
      await r.clic({ css: 'form button[type="submit"]', texto: 'Guardar receta' }, { camino: false });
      await r.esperar('#receta-buscar-texto-error, .aviso--error', 10_000);
    },
  );
  await r.paso(
    { codigo: 'B13', nombre: 'receta-buscador-de-alimentos', pedido: 'B4', pantalla: 'El buscador de alimentos del editor de recetas con «yogur natural» escrito y sus resultados.', hace: 'Escribe «yogur natural» en «Buscar un alimento del catálogo» y aprieta Enter.', espera: 'Encontrar el primer ingrediente.' },
    async (r) => {
      await r.escribir('#receta-buscar-texto', 'yogur natural', { enter: true });
      await r.esperar('.buscador ul.lista li.lista__item', 20_000);
    },
    { enfocar: '.buscador' },
  );
  await r.paso(
    { codigo: 'B14', nombre: 'receta-con-ingredientes-y-calculo', pedido: 'B4', pantalla: 'La receta con sus tres ingredientes (yogur, avena y banana), la cantidad y el estado de cada uno, y «Energía y macros estimados» calculados.', hace: 'Agrega cada ingrediente desde el buscador, le escribe la cantidad y elige su estado de preparación.', espera: 'Ver cuánto aporta una porción antes de guardarla.' },
    async (r) => {
      const ingredientes = [
        ['yogur natural', 'Yogur natural entero', '200', 'AS_PURCHASED'],
        ['avena', 'Avena arrollada, cruda', '40', 'RAW'],
        ['banana', 'Banana cruda', '100', 'RAW'],
      ];
      for (const [n, [busqueda, nombre, cantidad, estado]] of ingredientes.entries()) {
        if (n > 0) {
          await r.escribir('#receta-buscar-texto', busqueda, { enter: true });
          await r.esperar('.buscador ul.lista li.lista__item', 20_000);
        }
        await r.clicEnElPrimero([{ css: '.buscador ul.lista li.lista__item button', texto: `Agregar ingrediente: ${nombre}`, exacto: true }, '.buscador ul.lista li.lista__item button']);
        const li = `ol.ingredientes-de-receta > li:nth-child(${n + 1})`;
        await r.esperar(`${li} input[inputmode="decimal"]`);
        await r.escribir(`${li} input[inputmode="decimal"]`, cantidad);
        await r.elegir(`${li} select[id$="-estado"]`, { valor: estado });
      }
      await r.esperar('table.tabla--calculo', 20_000);
    },
    { enfocar: 'ol.ingredientes-de-receta' },
  );
  await r.paso(
    { codigo: 'B15', nombre: 'receta-guardada', pedido: 'B4', pantalla: 'La receta guardada: el editor vuelve como «Editar receta · Versión 1» y el aviso «Receta guardada».', hace: 'Hace clic en «Guardar receta».', espera: 'Tener la receta lista para usarla en los planes.' },
    async (r) => {
      await r.clic({ css: 'form button[type="submit"]', texto: 'Guardar receta' });
      await r.esperar({ css: '.aviso-flotante__texto p', texto: 'Receta guardada' }, 20_000);
    },
  );
  await r.paso(
    { codigo: 'B16', nombre: 'volver-al-borrador', pedido: 'B4', pantalla: 'De nuevo en el editor del borrador de Diego después de volver desde «Mis recetas»: arranca otra vez en el primer día tipo, con las comidas plegadas.', hace: 'Vuelve al Espacio profesional, abre la ficha de Diego, «Abrir Nutrición» y la sección «Plan».', espera: 'Seguir armando el plan donde lo había dejado.' },
    async (r) => {
      await alEspacio(r);
      await abrirLaFicha(r, diego);
      await r.clic('section.area[data-area="NUTRICION"] a.area__abrir');
      await seccion(r, 'Nutrición', 'plan');
      await r.esperar('#titulo-borrador', 30_000);
    },
  );
  await r.paso(
    { codigo: 'B17', nombre: 'receta-como-opcion', pedido: 'B4', pantalla: 'El panel lateral «Agregar receta como opción» abierto desde la merienda del «Día habitual»: el buscador de sus recetas y la receta recién creada, con sus calorías por porción.', hace: 'Abre la merienda, abre «Agregar opción» y elige «Agregar receta como opción».', espera: 'Ofrecer la receta como otra opción de merienda.' },
    async (r) => {
      await r.clic('#abrir-comida-0-2');
      await r.clic('section.comida-del-editor[data-comida="3"] .comida-del-editor__opciones .menu-de-acciones__boton');
      await r.clic({ css: '.menu-de-acciones__accion', texto: 'Agregar receta como opción', dentro: '.menu-de-acciones[data-abierto]' });
      await r.esperar('dialog.cajon[open] .recetas-para-elegir li.lista__item', 20_000);
    },
  );
  await r.paso(
    { codigo: 'B18', nombre: 'opcion-de-receta', pedido: 'B4', pantalla: 'La merienda con una opción nueva hecha con la receta: la insignia de la receta y sus ingredientes para una porción.', hace: 'Elige la receta y guarda.', espera: 'Que Diego vea la receta como una opción más de la merienda.' },
    async (r) => {
      await r.clicEnElPrimero([{ css: 'dialog.cajon[open] .recetas-para-elegir button', texto: 'Agregar receta como opción: Yogur con avena y banana' }, 'dialog.cajon[open] .recetas-para-elegir li.lista__item button']);
      await r.esperarQue(() => !document.querySelector('dialog.cajon[open]'));
      await r.guardarSiHaceFalta(EDITOR_NUT);
    },
    { enfocar: 'section.comida-del-editor[data-comida="3"]' },
  );
  r.noExiste(
    { codigo: 'B19', nombre: 'totales-por-comida-y-por-dia', pedido: 'B5', pantalla: 'Los totales de calorías y macronutrientes por comida y por día frente al objetivo.', hace: 'Buscaría cuánto suma cada comida y el día entero frente al objetivo.', espera: 'Ver si el día armado llega al objetivo sin hacer cuentas a mano.' },
    'El editor no suma nada: muestra la tira del objetivo (calorías y macros indicados) y, en cada ítem, solo cantidad, unidad y estado. La ayuda del plan lo dice: «Es lo indicado para el día, no una suma de las comidas ni lo consumido». Los nutrientes aparecen solo en el buscador (cada 100 g), en las recetas (por porción) y en el detalle de un registro.',
  );
  await r.paso(
    { codigo: 'B20', nombre: 'revisar-el-plan-con-un-error', pedido: 'B6', pantalla: 'El editor después de «Revisar el plan»: «Hay elementos por corregir», con el problema de la banana sin estado de preparación y el camino hasta él.', hace: 'Hace clic en «Revisar el plan».', espera: 'Saber si la versión está lista para activar.' },
    async (r) => {
      await r.clic({ css: BARRA_NUT, texto: 'Revisar el plan' }, { camino: false });
      await r.esperar(`${EDITOR_NUT} .aviso--error [data-problema]`, 20_000);
    },
    { enfocar: `${EDITOR_NUT} .aviso--error` },
  );
  await r.paso(
    { codigo: 'B21', nombre: 'corregido-y-revisado', pedido: 'B6', pantalla: 'El editor después de corregir y volver a revisar: lo que dice cuando no hay nada que impida activar.', hace: 'Hace clic en el problema (lo lleva al campo), elige «Crudo» como estado de preparación, guarda y vuelve a hacer clic en «Revisar el plan».', espera: 'Dejar la versión lista para activar.' },
    async (r) => {
      await r.clic(`${EDITOR_NUT} .aviso--error [data-problema]`);
      await r.esperar(`#${d.item}-preparacion`);
      await r.elegir(`#${d.item}-preparacion`, { valor: 'RAW' });
      await r.guardarSiHaceFalta(EDITOR_NUT);
      await r.clic({ css: BARRA_NUT, texto: 'Revisar el plan' });
      await r.pausa(800);
    },
  );
  await r.paso(
    { codigo: 'B22', nombre: 'activar-el-plan-confirmacion', pedido: 'B6', pantalla: 'El diálogo «Activar plan»: qué entra (días tipo y comidas), qué queda en el historial y «¿Cuándo la revisás?» con «En 4 semanas» elegido.', hace: 'Hace clic en «Activar plan» y elige «En 4 semanas».', espera: 'Confirmar el cambio y dejar fijada la próxima revisión.' },
    async (r) => {
      await r.clic({ css: BARRA_NUT, texto: 'Activar plan' });
      await r.esperar('dialog[open] #proxima-revision', 15_000);
      await r.clic('dialog[open] #proxima-revision input[value="en-4"]');
    },
  );
  await r.paso(
    { codigo: 'B23', nombre: 'plan-activado', pedido: 'B6', pantalla: 'El plan activo después de activar: la versión nueva vigente y el aviso de que Diego ya la ve.', hace: 'Hace clic en «Activar esta versión».', espera: 'Que Diego tenga el plan nuevo en su teléfono.' },
    async (r) => {
      await r.clic({ css: '.acciones button', texto: 'Activar esta versión' });
      await r.esperar({ css: '.aviso-flotante__texto p', texto: 'Versión activada' }, 20_000);
      d.hastaActivar = { clics: r.clicsDelCamino, campos: r.camposDelCamino, pasos: r.pasos.length + 1 };
    },
  );
  await r.paso(
    { codigo: 'B24', nombre: 'registros-distinto-de-lo-indicado', pedido: 'B7', pantalla: 'La sección «Registros» con los últimos 30 días y la vista «Distinto de lo indicado»: cada día con sus comidas, lo registrado, las cantidades y la diferencia observada.', hace: 'Hace clic en «Registros», cambia el período a 30 días y elige «Distinto de lo indicado».', espera: 'Ver en qué comió Diego distinto de lo planificado.' },
    async (r) => {
      await seccion(r, 'Nutrición', 'registros');
      await r.clic('.periodo-del-seguimiento__boton');
      await r.clic({ texto: '30 días', dentro: '.periodo-del-seguimiento__opciones' });
      await r.clic('button.vista-de-la-linea[data-vista="DISTINTAS"]');
      await r.esperar('section.dia-de-registros, .estado-vacio', 20_000);
    },
  );
  await r.paso(
    { codigo: 'B25', nombre: 'registro-frente-al-plan', pedido: 'B7', pantalla: 'El detalle de una comida registrada al costado: la opción registrada y, por ingrediente, lo indicado, lo registrado y la diferencia, con la estimación de lo consumido.', hace: 'Hace clic en una comida de la lista.', espera: 'Comparar lo que comió con lo que tenía indicado.' },
    async (r) => {
      if (!(await r.hay('li.comida-del-dia button.comida-del-dia__fila', 3000))) {
        // Sin comidas distintas en el período: «Ver todas las comidas».
        await r.clic({ texto: 'Ver todas las comidas' }, { camino: false });
      }
      await r.clic('li.comida-del-dia[data-estado="REGISTRADA"] button.comida-del-dia__fila');
      await r.esperar('.detalle-de-valores', 20_000);
    },
  );
  r.noExiste(
    { codigo: 'B26', nombre: 'descartar-un-borrador', pedido: 'B8', pantalla: 'Descartar un borrador.', hace: 'Buscaría cómo descartar el borrador que no va a usar.', espera: 'Volver al plan vigente sin una versión en preparación colgada.' },
    'El website no ofrece descartar un borrador de Nutrición: el editor solo permite guardar, revisar, activar y guardar como plantilla, y mientras exista el borrador no aparece «Nueva versión del plan». (El sistema ya puede hacerlo por dentro; la pantalla no lo ofrece.)',
  );
  await r.paso(
    { codigo: 'B27', nombre: 'duplicar-un-dia-tipo', pedido: 'B3', pantalla: 'Una versión nueva con el «Día habitual» duplicado como «Día de entrenamiento», después de «Guardar cambios»: los tipos de día, la copia elegida con las mismas comidas, el estado del guardado y la tira de objetivo del día.', hace: 'Vuelve a «Plan», hace clic en «Nueva versión del plan», abre el menú «⋯» del día tipo, elige «Duplicar este día tipo», le pone nombre y hace clic en «Guardar cambios».', espera: 'Armar el día de entrenamiento a partir del día habitual, sin cargarlo de cero.' },
    async (r) => {
      // La copia del día habitual, sola, al final: se guarda. Sumándole una comida con un alimento, en la primera corrida
      // el borrador dejó de guardarse (ver B07).
      await r.cerrarDialogos();
      await seccion(r, 'Nutrición', 'plan', { camino: false });
      await r.clic('[data-crear-version]', { camino: false });
      await r.esperar('#titulo-borrador', 30_000);
      await r.clic('.editor-del-plan__dia .menu-de-acciones__boton', { camino: false });
      await r.clic({ css: '.menu-de-acciones__accion', texto: 'Duplicar este día tipo', dentro: '.menu-de-acciones[data-abierto]' }, { camino: false });
      await r.esperarQue(() => document.activeElement?.matches?.('input[id^="dia-"]:not([id^="dia-tipo-"])'), null, 8000);
      const id = await r.page.evaluate(() => document.activeElement.id);
      await r.escribir(`#${id}`, 'Día de entrenamiento', { enter: true, camino: false });
      await r.clic({ css: BARRA_NUT, texto: 'Guardar cambios' }, { camino: false });
      await r.page.waitForFunction(() => ['guardado', 'fallo'].includes(document.querySelector('section.editor-del-plan p.estado-de-guardado')?.getAttribute('data-estado')), { timeout: 30_000, polling: 250 });
      await r.asentar(r.page);
    },
    { enfocar: '#titulo-borrador' },
  );
  return { hastaActivar: d.hastaActivar ?? null };
}

// ── C · Vincular a una persona: Lic. Sofía Paz ──

async function flujoDeVincular(r, { personas }) {
  const { diego, camila } = personas;
  await r.paso(
    { codigo: 'C01', nombre: 'espacio-profesional', pedido: 'C', pantalla: 'El Espacio profesional de Sofía Paz al entrar: arriba, «Invitar a una persona» y «Solicitar vínculo».', hace: 'Entra al website.', espera: 'Sumar a una persona nueva a su cartera.' },
    (r) => r.esperar('button.espacio-profesional__invitar', 30_000),
  );
  await r.paso(
    { codigo: 'C02', nombre: 'invitar-dialogo', pedido: 'C · invitar', pantalla: 'El diálogo «Invitar a una persona»: el área, el botón «Crear invitación» y la lista «Tus invitaciones».', hace: 'Hace clic en «Invitar a una persona».', espera: 'Generar una invitación para mandarle a la persona.' },
    async (r) => {
      await r.clic('button.espacio-profesional__invitar');
      await r.esperar('dialog.invitar[open]');
    },
  );
  await r.paso(
    { codigo: 'C03', nombre: 'invitar-sin-area', pedido: 'C · invitar', pantalla: 'El mismo diálogo después de «Crear invitación» sin elegir el área: el error debajo del campo.', hace: 'Hace clic en «Crear invitación» sin elegir el área.', espera: 'Crear la invitación; el sistema le pide el área.' },
    async (r) => {
      await r.clic('dialog.invitar[open] form button[type="submit"]', { camino: false });
      await r.esperar('dialog.invitar[open] .campo--error');
    },
  );
  await r.paso(
    { codigo: 'C04', nombre: 'invitacion-lista', pedido: 'C · invitar', pantalla: '«La invitación está lista»: el vencimiento, compartir por WhatsApp, copiar el mensaje o el enlace, el código QR, el código y el enlace.', hace: 'Elige «Nutrición» en el área y hace clic en «Crear invitación».', espera: 'Tener el enlace, el QR y el código para pasárselos a la persona.' },
    async (r) => {
      await r.elegir('dialog.invitar[open] select[id$="-area"]', { valor: 'NUTRICION' });
      await r.clic('dialog.invitar[open] form button[type="submit"]');
      await r.esperar('dialog.invitar[open] section.invitar__lista', 20_000);
    },
  );
  await r.paso(
    { codigo: 'C05', nombre: 'esperan-respuesta', pedido: 'C · solicitudes', pantalla: 'El Espacio, en «Esperan respuesta»: la invitación sin usar, con su área y su vencimiento.', hace: 'Hace clic en «Listo».', espera: 'Ver que la invitación quedó pendiente.' },
    async (r) => {
      await r.clic('dialog.invitar[open] .invitar__lista .acciones button.boton--primario');
      await r.esperarQue(() => !document.querySelector('dialog.invitar[open]'));
      await r.esperar('#esperan-respuesta li[data-tipo="invitacion"]', 15_000);
    },
    { enfocar: '#esperan-respuesta' },
  );
  await r.paso(
    { codigo: 'C06', nombre: 'solicitar-vinculo-con-errores', pedido: 'C · solicitudes', pantalla: 'El diálogo «Solicitar vínculo» enviado vacío: los errores del identificador BE y del área.', hace: 'Hace clic en «Solicitar vínculo» y, sin completar nada, en el botón de enviar.', espera: 'Pedir el vínculo a alguien que ya usa BE; el sistema le pide los datos.' },
    async (r) => {
      await r.clic('button.espacio-profesional__solicitar');
      await r.esperar('dialog.dialogo--formulario[open]:not(.invitar)');
      await r.clic('dialog.dialogo--formulario[open]:not(.invitar) form button[type="submit"]', { camino: false });
      await r.esperar('dialog.dialogo--formulario[open]:not(.invitar) .campo--error');
    },
  );
  await r.paso(
    { codigo: 'C07', nombre: 'solicitar-vinculo-completo', pedido: 'C · solicitudes', pantalla: 'El mismo diálogo completo: el identificador BE de Camila Ortiz pegado, el área Nutrición y la finalidad que se muestra al elegirla.', hace: 'Pega el identificador BE que le pasó la persona y elige el área.', espera: 'Enviar la solicitud con los datos correctos.' },
    async (r) => {
      await r.escribir('dialog.dialogo--formulario[open]:not(.invitar) input[id$="-asesorado"]', camila);
      await r.elegir('dialog.dialogo--formulario[open]:not(.invitar) select[id$="-alcance"]', { valor: 'NUTRICION' });
    },
  );
  await r.paso(
    { codigo: 'C08', nombre: 'solicitud-enviada', pedido: 'C · solicitudes', pantalla: 'El Espacio después de enviar: el aviso «Solicitud enviada» y la solicitud en «Esperan respuesta».', hace: 'Hace clic en el botón de enviar.', espera: 'Que la persona reciba el pedido y decida si lo acepta.' },
    async (r) => {
      await r.clic('dialog.dialogo--formulario[open]:not(.invitar) form button[type="submit"]');
      await r.esperarQue(() => !document.querySelector('dialog.dialogo--formulario[open]'), null, 20_000);
      await r.esperar('#esperan-respuesta li[data-tipo="solicitud"]', 15_000);
    },
    { enfocar: '#esperan-respuesta' },
  );
  await r.paso(
    { codigo: 'C09', nombre: 'solicitudes-enviadas', pedido: 'C · solicitudes', pantalla: 'El diálogo «Solicitudes enviadas»: cada solicitud con la persona, el alcance, el estado y la fecha.', hace: 'Hace clic en «Solicitudes enviadas» al pie de «Tus asesorados».', espera: 'Seguir sus pedidos de vínculo.' },
    async (r) => {
      await r.clic('#tus-asesorados button.directorio__solicitudes');
      await r.esperar('dialog.dialogo--solicitudes[open] tbody tr', 15_000);
    },
  );
  r.noExiste(
    { codigo: 'C10', nombre: 'solicitudes-recibidas', pedido: 'C · solicitudes', pantalla: 'Las solicitudes que una persona le manda al profesional.', hace: 'Buscaría los pedidos de vínculo que le llegan.', espera: 'Aceptar o rechazar a quien lo busca.' },
    'En el website profesional solo están las solicitudes enviadas («Solicitudes enviadas» y «Esperan respuesta»). Las solicitudes recibidas existen del lado de la persona; cuando alguien usa una invitación, la solicitud figura como enviada por el profesional y la persona la acepta en la app.',
  );
  await r.paso(
    { codigo: 'C11', nombre: 'pedir-informacion', pedido: 'C · formulario', pantalla: 'El panel lateral «Pedir información» abierto desde la ficha de Diego: qué formulario, qué preguntas y para qué.', hace: 'Cierra el diálogo, abre la ficha de Diego, abre el menú «Más» y elige «Pedir información».', espera: 'Pedirle a Diego que complete un formulario.' },
    async (r) => {
      if (await r.hay({ css: '.acciones button', texto: 'Cerrar' }, 1500)) await r.clic({ css: '.acciones button', texto: 'Cerrar' });
      await r.cerrarDialogos();
      await abrirLaFicha(r, diego);
      await r.menu('Más', 'Pedir información');
      await r.esperar('dialog.cajon[open] .formularios-del-pedido', 20_000);
    },
  );
  await r.paso(
    { codigo: 'C12', nombre: 'pedir-informacion-sin-elegir', pedido: 'C · formulario', pantalla: 'El mismo panel después de «Enviar solicitud» sin elegir nada: «Elegí un formulario» y «Escribí para qué lo necesitás».', hace: 'Hace clic en «Enviar solicitud» sin elegir un formulario.', espera: 'Enviar el pedido; el sistema le pide qué formulario.' },
    async (r) => {
      await r.clic('dialog.cajon[open] .cajon__pie button[data-enviar]', { camino: false });
      await r.esperar('dialog.cajon[open] .campo__error');
    },
  );
  await r.paso(
    { codigo: 'C13', nombre: 'pedir-informacion-elegido', pedido: 'C · formulario', pantalla: 'El panel con «Cómo comés hoy» elegido: la tabla de preguntas (todas elegidas, cuáles son obligatorias), el «para qué», el área y la casilla para sumar «Tus hábitos».', hace: 'Elige el formulario «Cómo comés hoy».', espera: 'Revisar qué le va a preguntar antes de enviarlo.' },
    async (r) => {
      await r.clic('dialog.cajon[open] [data-formulario="FRM-NUTRICION-INICIO"] input[type="radio"]');
      await r.esperar('dialog.cajon[open] table.preguntas-del-pedido', 20_000);
    },
  );
  await r.paso(
    { codigo: 'C14', nombre: 'pedido-enviado', pedido: 'C · formulario', pantalla: 'La sección «Solicitudes» de Información con los pedidos enviados («Sin responder») y el aviso de envío.', hace: 'Hace clic en «Enviar solicitud».', espera: 'Que Diego reciba el formulario en su teléfono.' },
    async (r) => {
      await r.clic('dialog.cajon[open] .cajon__pie button[data-enviar]');
      await r.esperarQue(() => !document.querySelector('dialog.cajon[open]'), null, 20_000);
      await r.esperar('section.solicitudes-del-area', 20_000);
    },
  );
  return {};
}

const FLUJOS = [
  { carpeta: 'A-entrenamiento', titulo: 'A · Entrenamiento: crear y ajustar el plan', profesional: 'Prof. Martín Acosta', persona: 'Diego Sosa', prefijo: 'PRO_T', recorrer: flujoDeEntrenamiento },
  { carpeta: 'B-nutricion', titulo: 'B · Nutrición: crear y ajustar el plan', profesional: 'Lic. Sofía Paz', persona: 'Diego Sosa', prefijo: 'PRO_N', recorrer: flujoDeNutricion },
  { carpeta: 'C-vincular', titulo: 'C · Vincular a una persona', profesional: 'Lic. Sofía Paz', persona: 'Camila Ortiz y Diego Sosa', prefijo: 'PRO_N', recorrer: flujoDeVincular },
];

// ─── La corrida ─────────────────────────────────────────────────────────────────────────────────────────────────

export async function recorrerLosFlujos({ puppeteer, CHROME, WEB, salida, cuentas, estado, asentar, pausa }) {
  const personas = Object.fromEntries(Object.entries(estado.personas ?? {}).map(([k, v]) => [k, v.aseId]));
  if (!personas.diego) throw new Error('La cohorte no dejó a Diego Sosa en estado.json.');
  const informe = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, ventana: `${ANCHO} × ${ALTO}`, flujos: [] };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    // El idioma también por el entorno: con `--lang` solo, los campos de fecha salían como mes/día/año.
    env: { ...process.env, LANG: 'es_AR.UTF-8', LANGUAGE: 'es_AR:es' },
    args: ['--no-sandbox', '--lang=es-AR', '--accept-lang=es-AR,es', '--force-color-profile=srgb'],
    defaultViewport: { width: ANCHO, height: ALTO, deviceScaleFactor: 1 },
  });
  try {
    for (const flujo of FLUJOS) {
      // Cada flujo en su propio contexto: sin la sesión ni la preferencia de tema del anterior.
      const contexto = await navegador.createBrowserContext();
      const page = await contexto.newPage();
      await page.emulateTimezone('America/Argentina/Buenos_Aires');
      // Sin animaciones: la entrada de un cajón o de un globo no queda a medias en la captura.
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      const r = new Recorrido({ page, carpeta: path.join(salida, flujo.carpeta), asentar, pausa });
      page.on('pageerror', (e) => r.errores.push(String(e).slice(0, 300)));
      page.on('dialog', (d) => d.accept().catch(() => {}));
      let resumen;
      try {
        await entrar(page, { WEB, cuentas, prefijo: flujo.prefijo, asentar });
        const tema = await page.evaluate(() => document.documentElement.dataset.tema);
        informe.tema ??= tema;
        resumen = r.resumen(await flujo.recorrer(r, { personas, estado }));
      } catch (e) {
        console.error(`El flujo ${flujo.carpeta} se cortó: ${e?.stack ?? e}`);
        resumen = r.resumen({ cortado: String(e?.message ?? e).slice(0, 500) });
      }
      informe.flujos.push({ carpeta: flujo.carpeta, titulo: flujo.titulo, profesional: flujo.profesional, persona: flujo.persona, ...resumen });
      fs.writeFileSync(path.join(salida, 'flujos.json'), `${JSON.stringify(informe, null, 2)}\n`);
      await contexto.close();
    }
  } finally {
    fs.writeFileSync(path.join(salida, 'flujos.json'), `${JSON.stringify(informe, null, 2)}\n`);
    await navegador.close();
  }
  const fallas = informe.flujos.flatMap((f) => f.pasos.filter((p) => p.estado === 'fallo').map((p) => `${p.codigo} ${p.nombre}`));
  console.log(`Pasos: ${informe.flujos.reduce((n, f) => n + f.pasos.length, 0)} · fallaron: ${fallas.length ? fallas.join(', ') : 'ninguno'}`);
  return informe;
}
