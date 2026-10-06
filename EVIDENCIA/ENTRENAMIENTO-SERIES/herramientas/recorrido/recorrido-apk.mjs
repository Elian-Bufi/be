// El recorrido de la APK contra la API local real (WP-ENTRENAMIENTO-SERIES). Las pantallas REALES de apps/mobile/src en el
// navegador (react-native-web), con la cuenta sintética del asesorado. NO es la APK nativa: el teclado real, TalkBack, la
// pantalla bloqueada y la muerte del proceso en Android se prueban en el teléfono.
// El reloj de la sesión es el inyectable del arnés (shims/reloj-controlado.ts): el recorrido lo adelanta con el guion de
// DECISIONES_Y_TIEMPOS.md, así los tiempos son exactos sin esperar. React y la red siguen con el reloj real.
// 1. La recuperación, dos veces: «Recuperación de prueba» con el reloj del proceso y «Recuperación con el reloj del
//    arranque» con el del arranque simulado (precierre del 2026-10-06, §3). Iniciar, abrir un descanso y recargar la página
//    (un proceso nuevo, como cuando el sistema cierra la APK). Al volver, la APK pregunta qué pasó; se deja incompleto, se
//    registra la serie y se finaliza. Lo calculado por la API se compara con las anclas del recorrido. En la segunda, la
//    imagen del ejercicio no baja nunca: un acceso, una renovación y el respaldo, y la serie se registra igual (§5).
// 2. «Piernas A»: iniciar, cronometrar las series A1 y A2 (40 s), descansos de 90 y 135 s ligados a su serie, registrar
//    A1 a A3 (A3 sin cronometrar), pasar al peso muerto, pausar 120 s, registrar B1 y finalizar a los 900 s.
// Escribe apk.json con lo que tiene que ver el profesional después (recorrido-web-ejecuciones.mjs).
// Uso: node recorrido-apk.mjs   (necesita servir-arnes.mjs en :3002 con el render de API_REAL=1 y la API en :3001)
import { REPO, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const d = require(`${REPO}/packages/domain/dist/index.js`);

const ARNES = 'http://localhost:3002';
const ORIGEN = 'http://localhost:3001';
const PAQUETE = `${REPO}/docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06`;
const demo = JSON.parse(fs.readFileSync(`${PAQUETE}/datos/sesion_demo.json`, 'utf8'));
const catalogo = JSON.parse(fs.readFileSync(`${PAQUETE}/ejercicios/CATALOGO.json`, 'utf8')).assets;
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const CRED = 'clave-sintetica-de-prueba-01';
const dir = enTrabajo('capturas-apk-real/');
fs.mkdirSync(dir, { recursive: true });
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 600) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 220)}` : ''}`);
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const nombreDe = (clave) => catalogo.find((c) => c.fixtureKey === clave).name;
const [A, B] = demo.exercises;

// La sesión del asesorado, guardada para no gastar el límite de inicios de sesión.
const SESIONES = enTrabajo('.sesiones.json');
const sesiones = fs.existsSync(SESIONES) ? JSON.parse(fs.readFileSync(SESIONES, 'utf8')) : {};
let token = sesiones[estado.aseCorreo]?.token;
if (!token || Date.parse(sesiones[estado.aseCorreo].expira) - Date.now() < 20 * 60 * 1000) {
  const apk = d.crearClienteBe({ baseUrl: `${ORIGEN}/api/v1`, superficie: 'APK' });
  const r = await apk.iniciarSesion(estado.aseCorreo, CRED);
  if (!r.ok) throw new Error(`sesión del asesorado: ${r.status}`);
  token = r.datos.data.session.accessToken;
  sesiones[estado.aseCorreo] = { token, expira: r.datos.data.session.expiresAt };
  fs.writeFileSync(SESIONES, JSON.stringify(sesiones));
}

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: 430, height: 960 } });
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
const url = `${ARNES}/evidencia-real.html?token=${encodeURIComponent(token)}&identidad=${encodeURIComponent(estado.aseId)}&tema=azul-noche&ancho=390&alto=900&titulo=${encodeURIComponent('Recorrido contra la API local real')}`;
const capturar = (nombre) => page.screenshot({ path: fileURLToPath(new URL(`${nombre}.png`, dir)), fullPage: true });
const esperarTexto = (t, ms = 60000) => page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t);
const adelantar = (s) => page.evaluate((ms) => window.__adelantarReloj(ms), s * 1000);
/** Toca el control con ese nombre accesible o ese texto; con `dentroDe`, el de la tarjeta que tiene ese título. */
async function tocar(nombre, dentroDe = null) {
  await page.waitForFunction(
    (n, t) => {
      const cs = [...document.querySelectorAll('[role="button"],[role="checkbox"],[role="tab"],[role="link"]')].filter((e) => e.getAttribute('aria-disabled') !== 'true');
      return cs.some((e) => (e.getAttribute('aria-label') === n || e.textContent?.trim() === n) && (!t || (() => { for (let p = e.parentElement; p; p = p.parentElement) if (p.innerText?.includes(t)) return true; return false; })()));
    },
    { timeout: 30000 },
    nombre,
    dentroDe,
  );
  await page.evaluate(
    (n, t) => {
      const cs = [...document.querySelectorAll('[role="button"],[role="checkbox"],[role="tab"],[role="link"]')].filter((e) => e.getAttribute('aria-disabled') !== 'true');
      const candidatos = cs.filter((e) => e.getAttribute('aria-label') === n || e.textContent?.trim() === n);
      // En una tarjeta: el botón cuyo ancestro más cercano con ese título es el más chico (la tarjeta, no la pantalla).
      const distancia = (e) => {
        if (!t) return 0;
        let k = 0;
        for (let p = e.parentElement; p; p = p.parentElement, k++) if (p.innerText?.includes(t)) return p.innerText.length;
        return Infinity;
      };
      const el = candidatos.sort((a, b) => distancia(a) - distancia(b))[0];
      if (!el || distancia(el) === Infinity) throw new Error(`no encontré «${n}»${t ? ` en «${t}»` : ''}`);
      el.click();
    },
    nombre,
    dentroDe,
  );
  await pausa(250);
}
/** Escribe en el campo cuyo nombre accesible empieza así, como lo haría el teclado. */
async function escribir(comienzo, texto) {
  await page.waitForFunction((c) => [...document.querySelectorAll('input, textarea')].some((e) => (e.getAttribute('aria-label') ?? '').startsWith(c)), { timeout: 30000 }, comienzo);
  await page.evaluate(
    (c, t) => {
      const el = [...document.querySelectorAll('input, textarea')].find((e) => (e.getAttribute('aria-label') ?? '').startsWith(c));
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, t);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    comienzo,
    texto,
  );
  await pausa(150);
}
async function abrir() {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction(() => document.body.dataset.lista === '1', { timeout: 60000 });
  await esperarTexto(demo.name, 60000);
}
/**
 * Espera a que el teléfono haya mandado todo: la línea del envío dice que está guardado en BE. El texto es el de la APK
 * (`apps/mobile/src/textos-del-guardado.ts`, precierre del 2026-10-06, §1), leído de su fuente. Devuelve si lo vio.
 */
const ENVIADO = /enviadoAlServicio: '([^']+)'/.exec(fs.readFileSync(`${REPO}/apps/mobile/src/textos-del-guardado.ts`, 'utf8'))[1];
const sinPendientes = () => esperarTexto(ENVIADO, 60000).then(() => true, () => false);

/** Lo que la API guardó y calculó de un borrador (API-TIE-02), con la sesión del asesorado. */
async function tiemposDelBorrador(draftId) {
  const r = await fetch(`${ORIGEN}/api/v1/training/execution-drafts/${encodeURIComponent(draftId)}/timing`, { headers: { Authorization: `Bearer ${token}`, 'X-BE-Surface': 'APK' } });
  if (r.status !== 200) throw new Error(`API-TIE-02: ${r.status}`);
  return d.TiemposDeSesionResponseSchema.parse(await r.json()).data;
}
const TOLERANCIA_MS = 1000;
const DURACION_ABSURDA_MS = 6 * 60 * 60 * 1000;
const leerAdelanto = () => page.evaluate(() => Number(localStorage.getItem('recorrido:adelanto-del-reloj') ?? '0'));

/**
 * Una sesión corta que se cierra con un descanso abierto, en una base del reloj:
 * - `proceso` (el navegador, Expo Go o una APK sin el módulo): cada carga es otro proceso, con otra ancla. Lo que cruza el
 *   cierre se estima con el reloj civil.
 * - `arranque` (la APK con el módulo nativo): el tiempo desde el arranque sigue contando entre cargas, con la misma ancla. Lo
 *   que cruza el cierre se mide. Igual no se puede afirmar cuándo terminó el descanso abandonado: la APK pregunta.
 * Con `fallarImagen`, la descarga de la imagen del ejercicio falla siempre (la ruta firmada, no el acceso): la APK pide un
 * acceso nuevo una sola vez, deja el respaldo con su texto, y la serie se registra igual (§5).
 */
async function recuperacion({ sesion, reloj, fallarImagen }) {
  const etiqueta = `[${reloj}]`;
  const borradores = new Set();
  const accesos = [];
  const descargas = [];
  const alPedir = (req) => {
    const u = req.url();
    const borrador = /\/api\/v1\/training\/execution-drafts\/([^/?]+)\/timing-events/.exec(u);
    if (borrador) borradores.add(decodeURIComponent(borrador[1]));
    if (/\/api\/v1\/media\/[^/]+\/access/.test(u)) accesos.push(Date.now());
    if (u.includes('/api/v1/media/content/')) descargas.push(Date.now());
    if (!fallarImagen) return;
    if (u.includes('/api/v1/media/content/')) return void req.abort('failed');
    void req.continue();
  };
  if (fallarImagen) await page.setRequestInterception(true);
  page.on('request', alPedir);
  try {
    await page.goto(`${url}&reloj=${reloj}`, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.waitForFunction(() => document.body.dataset.lista === '1', { timeout: 60000 });
    await esperarTexto(sesion, 60000);
    control(`${etiqueta} la página usa el reloj pedido`, (await page.evaluate(() => window.__baseDelReloj)) === reloj);
    // Las anclas del recorrido: el civil de esta carga y el adelanto acumulado, antes de iniciar.
    const civilDeLaCarga1 = await page.evaluate(() => window.__civilAlCargar);
    const adelantoAlIniciar = await leerAdelanto();
    accesos.length = 0;
    descargas.length = 0;
    await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarEntrenamiento, sesion);
    await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.explicacionDeTiempos, 8000)
      .then(async () => {
        control('la primera vez, la APK explica qué tiempos guarda y quién los ve', true);
        await capturar('apk-02-primera-vez');
        await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.entendido);
      })
      .catch(() => undefined);
    await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarDescanso, 60000);
    if (fallarImagen) {
      await esperarTexto(d.COPY_REGISTRO_DE_COMIDAS.imagenNoDisponible, 30000);
      // Lo que decide la APK son los accesos (API-MED-03): uno y una sola renovación. Las descargas no se cuentan contra un
      // número fijo: el navegador puede pedir dos veces la misma ruta (react-native-web la precarga) y dos accesos en el mismo
      // segundo firman la misma ruta (el vencimiento va al segundo). Lo que se exige es que, con el respaldo a la vista, no
      // haya ni un pedido más.
      const enLaCarga = { accesos: accesos.length, descargas: descargas.length };
      await pausa(5000);
      control(
        `${etiqueta} la imagen que no baja: un acceso y una sola renovación, ningún pedido más en los 5 s siguientes, y queda el respaldo con su texto`,
        enLaCarga.accesos === 2 && accesos.length === 2 && descargas.length === enLaCarga.descargas && enLaCarga.descargas >= 2,
        `al ver el respaldo: ${enLaCarga.accesos} accesos y ${enLaCarga.descargas} descargas intentadas; 5 s después: ${accesos.length} y ${descargas.length}`,
      );
      await capturar(`apk-03-${reloj}-imagen-que-no-baja`);
    }
    await adelantar(30);
    await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarDescanso);
    await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarDescanso, 30000);
    await adelantar(60);
    await pausa(1500);
    // El proceso «muere»: recargar es otra carga del módulo del reloj. Lo guardado sigue en el teléfono (localStorage hace
    // de AsyncStorage) y el civil no vuelve atrás: suma el tiempo real entre las dos cargas.
    await page.reload({ waitUntil: 'networkidle0', timeout: 120000 });
    await page.waitForFunction(() => document.body.dataset.lista === '1', { timeout: 60000 });
    const civilDeLaCarga2 = await page.evaluate(() => window.__civilAlCargar);
    await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.continuarEntrenamiento, 60000);
    control(`${etiqueta} después de cerrar la app, Hoy ofrece «Continuar entrenamiento»`, true);
    await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.continuarEntrenamiento, sesion);
    await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.laSesionQuedoAbierta, 60000);
    control(`${etiqueta} al volver, la APK no cierra el descanso sola: pregunta qué pasó`, true);
    await capturar(`apk-04-${reloj}-medicion-abierta-tras-cerrar-la-app`);
    await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.dejarIncompleta);
    await escribir('Repeticiones de la serie 1', '11');
    await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.registrarSerie(1));
    const enviada = await sinPendientes();
    control(`${etiqueta} la serie registrada se envía: «${ENVIADO}»${fallarImagen ? ', con la imagen sin bajar' : ''}`, enviada);
    await adelantar(110);
    const adelantoAlFinalizar = await leerAdelanto();
    await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarEntrenamiento);
    await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.resumenAntesDeFinalizar, 30000);
    await tocar('Realizada');
    await pausa(800);
    await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarEntrenamiento);
    await page.waitForFunction(() => document.body.dataset.ruta !== 'sesion-de-entrenamiento' || document.body.innerText.includes('Registrada'), { timeout: 90000 });
    control(`${etiqueta} «${sesion}» quedó registrada`, true);

    // Lo esperado, de las anclas del recorrido; lo calculado, de la API.
    const adelantoMs = adelantoAlFinalizar - adelantoAlIniciar;
    const esperadoMs = civilDeLaCarga2 - civilDeLaCarga1 + adelantoMs;
    control(`${etiqueta} el recorrido adelantó 200 s de reloj entre el inicio y el fin (30 + 60 + 110)`, adelantoMs === 200_000, adelantoMs);
    control(`${etiqueta} un solo borrador para esta sesión`, borradores.size === 1, [...borradores].join(', '));
    const t = await tiemposDelBorrador([...borradores][0]);
    const calidad = reloj === 'arranque' ? 'MEASURED' : 'ESTIMATED';
    const { elapsed, pauses, withoutPauses } = t.session;
    control(
      `${etiqueta} tiempo transcurrido ${calidad === 'MEASURED' ? 'medido' : 'estimado'}, a no más de ${TOLERANCIA_MS} ms de las anclas del recorrido`,
      elapsed.quality === calidad && elapsed.ms !== null && Math.abs(elapsed.ms - esperadoMs) <= TOLERANCIA_MS,
      `API ${elapsed.ms} ms ${elapsed.quality} · esperado ${esperadoMs} ms (${civilDeLaCarga2 - civilDeLaCarga1} ms entre las cargas + ${adelantoMs})`,
    );
    control(`${etiqueta} sin pausas declaradas: pausas en 0 y «sin pausas» igual al total`, pauses.ms === 0 && withoutPauses.ms === elapsed.ms, JSON.stringify(t.session));
    control(`${etiqueta} el descanso que quedó abierto es incompleto, sin duración`, t.rests.length === 1 && t.rests[0].duration.quality === 'INCOMPLETE' && t.rests[0].duration.ms === null, JSON.stringify(t.rests));
    const ids = t.events.map((e) => e.event.eventId);
    control(`${etiqueta} ningún evento repetido`, new Set(ids).size === ids.length, `${ids.length} eventos`);
    const porTipo = (tipo) => t.events.filter((e) => e.event.type === tipo).length;
    control(`${etiqueta} un inicio y un fin de la sesión`, porTipo('SESSION_STARTED') === 1 && porTipo('SESSION_FINISHED') === 1, JSON.stringify(t.events.map((e) => e.event.type)));
    const monotonicos = t.events.map((e) => e.event.at.monotonic).filter(Boolean);
    const bases = new Set(monotonicos.map((m) => m.clock));
    const anclas = new Set(monotonicos.map((m) => m.anchor));
    const baseEsperada = reloj === 'arranque' ? 'ELAPSED_SINCE_BOOT' : 'PROCESS_MONOTONIC';
    control(`${etiqueta} cada evento lleva la base de su reloj (${baseEsperada}), sin mezclar`, bases.size === 1 && bases.has(baseEsperada), [...bases].join(', '));
    control(`${etiqueta} ${reloj === 'arranque' ? 'una sola ancla: el arranque no cambió' : 'dos anclas: una por proceso'}`, anclas.size === (reloj === 'arranque' ? 1 : 2), `${anclas.size} anclas`);
    const duraciones = [elapsed, pauses, withoutPauses, t.unassigned, ...t.exercises.map((e) => e.duration), ...t.rests.map((r) => r.duration), ...t.timedSets.map((x) => x.duration)];
    control(`${etiqueta} ninguna duración absurda (todas entre 0 y 6 h)`, duraciones.every((x) => x.ms === null || (x.ms >= 0 && x.ms <= DURACION_ABSURDA_MS)), JSON.stringify(duraciones));
    return {
      sesion,
      reloj,
      descansos: [{ ejercicio: nombreDe(demo.exercises[2].catalogFixtureKey), setIndex: 1, texto: 'Incompleto · 01:30 recomendado' }],
      // Lo que tiene que ver el profesional: lo que la API calculó, ya comparado con las anclas del recorrido.
      tiemposEsperados: { 'Tiempo transcurrido': d.textoDeDuracion(elapsed), Pausas: d.textoDeDuracion(pauses), 'Sin pausas': d.textoDeDuracion(withoutPauses) },
      anclas: { cargasMs: [civilDeLaCarga1, civilDeLaCarga2], adelantoMs, esperadoMs, calculadoMs: elapsed.ms, toleranciaMs: TOLERANCIA_MS },
    };
  } finally {
    page.off('request', alPedir);
    if (fallarImagen) await page.setRequestInterception(false);
  }
}

const resultado = { recuperacion: {}, recuperacionDelArranque: {}, piernas: {} };
try {
  // El reloj de la sesión arranca sin adelanto: se borra una sola vez, antes de la primera carga de la APK.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => localStorage.removeItem('recorrido:adelanto-del-reloj'));
  await abrir();
  await capturar('apk-01-hoy');
  control('Hoy muestra «Piernas A» con 3 ejercicios y 9 series', (await page.evaluate(() => document.body.innerText)).includes('3 ejercicios · 9 series'));

  // ─── 1. La recuperación después de que se cierra la app, en las dos bases del reloj ───────────
  // Precierre del 2026-10-06, §3: un piso («al menos 200 s») no prueba nada. El recorrido anota sus propias anclas (el
  // instante civil de cada carga de la página, que lee del arnés, y cada adelanto que aplica), calcula lo esperado y lo
  // compara con lo que la API calculó de los eventos de la APK, con una tolerancia acotada. También exige que ningún evento
  // esté repetido, que cada uno lleve la base de su reloj y que ninguna duración sea absurda.
  resultado.recuperacion = await recuperacion({ sesion: 'Recuperación de prueba', reloj: 'proceso', fallarImagen: false });
  resultado.recuperacionDelArranque = await recuperacion({ sesion: 'Recuperación con el reloj del arranque', reloj: 'arranque', fallarImagen: true });

  // ─── 2. «Piernas A»: el guion de DECISIONES_Y_TIEMPOS.md ─────────────────────────────────────
  await abrir();
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarEntrenamiento, demo.name);
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.cronometrarSerie, 60000);
  await capturar('apk-04-piernas-a-serie-1');
  const serie = async (n, valores) => {
    if (valores.carga !== undefined) await escribir(`Carga en kg de la serie ${n}`, String(valores.carga));
    await escribir(`Repeticiones de la serie ${n}`, String(valores.reps));
    if (valores.rir !== undefined && valores.rir !== null) await escribir(`RIR de la serie ${n}`, String(valores.rir));
    await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.registrarSerie(n));
  };
  // t = 20 a 60: la serie A1, cronometrada.
  await adelantar(20);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.cronometrarSerie);
  await adelantar(40);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarSerie);
  // t = 65: el descanso de A1; t = 70: se registra A1 durante el descanso, que sigue ligado a la serie 1.
  await adelantar(5);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarDescanso);
  await adelantar(5);
  const [a1, a2, a3] = demo.sampleRecordedSets;
  await serie(1, { carga: a1.actualLoad.value, reps: a1.actualRepetitions, rir: a1.actualRir });
  await capturar('apk-05-descanso-de-la-serie-1');
  // t = 155: termina el descanso de A1.
  await adelantar(85);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarDescanso);
  // t = 170 a 210: la serie A2, cronometrada; t = 215: su descanso; t = 220: se registra A2.
  await adelantar(15);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.cronometrarSerie);
  await adelantar(40);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarSerie);
  await adelantar(5);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarDescanso);
  await adelantar(5);
  await serie(2, { carga: a2.actualLoad.value, reps: a2.actualRepetitions, rir: a2.actualRir });
  // t = 350: termina el descanso de A2.
  await adelantar(130);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarDescanso);
  // t = 400: A3 se registra sin haber medido su inicio ni su fin.
  await adelantar(50);
  await serie(3, { carga: a3.actualLoad.value, reps: a3.actualRepetitions, rir: a3.actualRir });
  // t = 450: el peso muerto rumano pasa a ser el ejercicio activo.
  await adelantar(50);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.siguienteEjercicio);
  await esperarTexto(nombreDe(B.catalogFixtureKey), 30000);
  // t = 500 a 620: una pausa explícita.
  await adelantar(50);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.pausarSesion);
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.reanudarSesion, 30000);
  await adelantar(120);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.reanudarSesion);
  // t = 650: la primera serie del peso muerto, con los valores de su plan escritos por la persona.
  await adelantar(30);
  const b1 = B.sets[0];
  await serie(1, { carga: b1.suggestedLoad.value, reps: b1.plannedRepetitions.max, rir: b1.plannedRir });
  control(`«${demo.name}»: lo registrado quedó enviado antes de finalizar («${ENVIADO}»)`, await sinPendientes());
  // t = 900: finalizar. La condición la declara la persona: no registró todas las series.
  await adelantar(250);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarEntrenamiento);
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.resumenAntesDeFinalizar, 30000);
  await escribir(d.COPY_ENTRENAMIENTO.motivoOpcional, 'Recorrido de demostración: se registraron la sentadilla y una serie del peso muerto.');
  await tocar('Realizada con desvío');
  await pausa(800);
  await capturar('apk-06-antes-de-finalizar');
  const resumen = await page.evaluate(() => document.body.innerText);
  control('el resumen antes de finalizar dice cuántas series se registraron de cada ejercicio', resumen.includes(d_seriesRegistradas(3, 3)) && resumen.includes(d_seriesRegistradas(1, 3)), resumen.slice(0, 400));
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarEntrenamiento);
  await page.waitForFunction(() => document.body.dataset.ruta !== 'sesion-de-entrenamiento' || document.body.innerText.includes('Registrada'), { timeout: 90000 });
  await pausa(1500);
  await capturar('apk-07-registrada');
  control('«Piernas A» quedó registrada', true);

  // Lo que tiene que ver el profesional: el plan de cada serie, lo escrito, los descansos y las series medidas.
  const planDe = (ex, n) => {
    const s = ex.sets[n - 1];
    return d.textoDelPlanDeLaSerie({ repetitions: s.plannedRepetitions, rir: s.plannedRir, suggestedLoad: s.suggestedLoad, restSeconds: s.recommendedRestSeconds });
  };
  resultado.piernas = {
    sesion: demo.name,
    series: [
      { ejercicio: nombreDe(A.catalogFixtureKey), setIndex: 1, plan: planDe(A, 1), carga: a1.actualLoad, repeticiones: a1.actualRepetitions, rir: a1.actualRir },
      { ejercicio: nombreDe(A.catalogFixtureKey), setIndex: 2, plan: planDe(A, 2), carga: a2.actualLoad, repeticiones: a2.actualRepetitions, rir: a2.actualRir },
      { ejercicio: nombreDe(A.catalogFixtureKey), setIndex: 3, plan: planDe(A, 3), carga: a3.actualLoad, repeticiones: a3.actualRepetitions, rir: a3.actualRir },
      { ejercicio: nombreDe(B.catalogFixtureKey), setIndex: 1, plan: planDe(B, 1), carga: b1.suggestedLoad, repeticiones: b1.plannedRepetitions.max, rir: b1.plannedRir },
    ],
    descansos: [
      { ejercicio: nombreDe(A.catalogFixtureKey), setIndex: 1, texto: d.textoDeDescanso({ duration: { ms: 90_000, quality: 'MEASURED' }, recommendedSeconds: A.sets[0].recommendedRestSeconds, differenceMs: 90_000 - A.sets[0].recommendedRestSeconds * 1000 }) },
      { ejercicio: nombreDe(A.catalogFixtureKey), setIndex: 2, texto: d.textoDeDescanso({ duration: { ms: 135_000, quality: 'MEASURED' }, recommendedSeconds: A.sets[1].recommendedRestSeconds, differenceMs: 135_000 - A.sets[1].recommendedRestSeconds * 1000 }) },
    ],
    seriesCronometradas: [
      { ejercicio: nombreDe(A.catalogFixtureKey), setIndex: 1, texto: `${d.COPY_ENTRENAMIENTO_POR_SERIE.duracionMedida} 00:40` },
      { ejercicio: nombreDe(A.catalogFixtureKey), setIndex: 2, texto: `${d.COPY_ENTRENAMIENTO_POR_SERIE.duracionMedida} 00:40` },
      { ejercicio: nombreDe(A.catalogFixtureKey), setIndex: 3, texto: d.COPY_ENTRENAMIENTO_POR_SERIE.duracionDesconocida },
    ],
    tiemposEsperados: {
      'Tiempo transcurrido': '15:00 · medido',
      Pausas: '02:00 · medido',
      'Sin pausas': '13:00 · medido',
      [nombreDe(A.catalogFixtureKey)]: '07:30 · medido',
      [nombreDe(B.catalogFixtureKey)]: '05:30 · medido',
      'Sin ejercicio asignado': '00:00 · medido',
    },
  };
} catch (e) {
  control('el recorrido de la APK terminó sin errores', false, e.stack ?? String(e));
  await capturar('apk-error').catch(() => {});
} finally {
  control('sin errores de página', errores.length === 0, errores.join(' | '));
  fs.writeFileSync(enTrabajo('apk.json'), JSON.stringify({ ...resultado, controles }, null, 2));
  await browser.close();
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles`);
  process.exit(fallas ? 1 : 0);
}

function d_seriesRegistradas(hechas, planificadas) {
  return d.COPY_ENTRENAMIENTO_POR_SERIE.seriesRegistradas(hechas, planificadas);
}
