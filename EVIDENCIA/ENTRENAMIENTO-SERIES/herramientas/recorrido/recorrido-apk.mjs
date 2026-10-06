// El recorrido de la APK contra la API local real (WP-ENTRENAMIENTO-SERIES). Las pantallas REALES de apps/mobile/src en el
// navegador (react-native-web), con la cuenta sintética del asesorado. NO es la APK nativa: el teclado real, TalkBack, la
// pantalla bloqueada y la muerte del proceso en Android se prueban en el teléfono.
// El reloj de la sesión es el inyectable del arnés (shims/reloj-controlado.ts): el recorrido lo adelanta con el guion de
// DECISIONES_Y_TIEMPOS.md, así los tiempos son exactos sin esperar. React y la red siguen con el reloj real.
// 1. «Recuperación de prueba»: iniciar, abrir un descanso y recargar la página (un proceso nuevo, como cuando el sistema
//    cierra la APK). Al volver, la APK pregunta qué pasó; se deja incompleto, se registra la serie y se finaliza.
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
/** Espera a que el teléfono haya mandado todo: ni series ni eventos pendientes. */
const sinPendientes = () => esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.enviada, 60000).catch(() => {});

const resultado = { recuperacion: {}, piernas: {} };
try {
  // El reloj de la sesión arranca sin adelanto: se borra una sola vez, antes de la primera carga de la APK.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => localStorage.removeItem('recorrido:adelanto-del-reloj'));
  await abrir();
  await capturar('apk-01-hoy');
  control('Hoy muestra «Piernas A» con 3 ejercicios y 9 series', (await page.evaluate(() => document.body.innerText)).includes('3 ejercicios · 9 series'));

  // ─── 1. Recuperación de prueba: el proceso se cierra con un descanso abierto ──────────────────
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarEntrenamiento, 'Recuperación de prueba');
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.explicacionDeTiempos, 30000)
    .then(async () => {
      control('la primera vez, la APK explica qué tiempos guarda y quién los ve', true);
      await capturar('apk-02-primera-vez');
      await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.entendido);
    })
    .catch(() => control('la primera vez, la APK explica qué tiempos guarda y quién los ve', false));
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarDescanso, 60000);
  await adelantar(30);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.iniciarDescanso);
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarDescanso, 30000);
  await adelantar(60);
  await pausa(1500);
  // El proceso «muere»: recargar es otra carga del módulo del reloj, con otra ancla, y lo guardado sigue en el teléfono
  // (localStorage hace de AsyncStorage). El reloj civil sigue donde estaba: el adelanto acumulado no se pierde.
  await page.reload({ waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction(() => document.body.dataset.lista === '1', { timeout: 60000 });
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.continuarEntrenamiento, 60000);
  control('después de cerrar la app, Hoy ofrece «Continuar entrenamiento»', true);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.continuarEntrenamiento, 'Recuperación de prueba');
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.laSesionQuedoAbierta, 60000);
  control('al volver, la APK no cierra el descanso sola: pregunta qué pasó', true);
  await capturar('apk-03-medicion-abierta-tras-cerrar-la-app');
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.dejarIncompleta);
  await escribir('Repeticiones de la serie 1', '11');
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.registrarSerie(1));
  await sinPendientes();
  await adelantar(110);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarEntrenamiento);
  await esperarTexto(d.COPY_ENTRENAMIENTO_POR_SERIE.resumenAntesDeFinalizar, 30000);
  await tocar('Realizada');
  await pausa(800);
  await tocar(d.COPY_ENTRENAMIENTO_POR_SERIE.finalizarEntrenamiento);
  await page.waitForFunction(() => document.body.dataset.ruta !== 'sesion-de-entrenamiento' || document.body.innerText.includes('Registrada'), { timeout: 90000 });
  control('«Recuperación de prueba» quedó registrada', true);
  resultado.recuperacion = {
    sesion: 'Recuperación de prueba',
    descansos: [{ ejercicio: nombreDe(demo.exercises[2].catalogFixtureKey), setIndex: 1, texto: 'Incompleto · 01:30 recomendado' }],
    // Cruza un cierre de la app: se estima con el reloj civil, que siguió corriendo mientras estaba cerrada. Por eso se
    // exige la calidad y el piso del guion (200 s), no un valor exacto: los segundos reales entre cargas también cuentan.
    tiemposMinimos: { 'Tiempo transcurrido': { segundos: 200, calidad: 'estimado' }, Pausas: { segundos: 0, calidad: 'estimado' }, 'Sin pausas': { segundos: 200, calidad: 'estimado' } },
  };

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
  await sinPendientes();
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
