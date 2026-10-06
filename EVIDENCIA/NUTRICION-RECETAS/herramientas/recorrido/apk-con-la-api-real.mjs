// Las pantallas REALES de la APK (react-native-web, en el navegador) contra la API local real, con el asesorado sintético:
// el carrusel con las fotos que cargó la profesional desde la web, el detalle, la comida diferente con la foto privada, y
// un registro hecho con un toque en «Comí esta opción», que después se verifica en la API (API-ING-01 y 03).
// Antes: servir-arnes.mjs en :3002 (con /api → :3001) y `API_REAL=1 node construir.mjs` en el arnés.
// Uso: node apk-con-la-api-real.mjs <carpeta de destino de las capturas>
import { REPO, ARNES, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { crearClienteBe } = require(`${REPO}/packages/domain/dist/index.js`);

const DESTINO = process.argv[2] ?? `${REPO}/EVIDENCIA/NUTRICION-RECETAS/capturas-apk-api-real`;
fs.mkdirSync(DESTINO, { recursive: true });
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const sesiones = JSON.parse(fs.readFileSync(enTrabajo('.sesiones.json'), 'utf8'));
const apk = crearClienteBe({ baseUrl: 'http://localhost:3001/api/v1', superficie: 'APK' });
const ase = sesiones[estado.aseCorreo];
const clave = () => `e2e-${crypto.randomUUID()}`;
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 400) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 200)}` : ''}`);
};
const exigir = (r, que) => {
  if (!r.ok) throw new Error(`${que}: ${r.tipo === 'API' ? `${r.status} ${r.codigo}` : 'sin respuesta'}`);
  return r.datos;
};
/** Una captura del render con la API real: el teléfono crece hasta mostrar toda la pantalla. */
function capturar(nombre, escena, parametros, titulo, { ancho = 360, alto = 780, tema = 'azul-noche', escala = '1', espera = 9000 } = {}) {
  const consulta = new URLSearchParams({ escena, tema, ancho: String(ancho), alto: String(alto), escala, token: ase, titulo, ...parametros });
  const salida = execFileSync('node', [`${ARNES}/cdp.mjs`, `${DESTINO}/${nombre}.png`, String(ancho + 28), String(alto + 150), `http://localhost:3002/evidencia-real.html?${consulta}`, String(espera)], {
    env: { ...process.env, AJUSTAR: '1', ESCALA_DE_PANTALLA: '2' },
    encoding: 'utf8',
  });
  // cdp.mjs informa «cortes {"mirados":n,"cortados":[…]}» y, si la escena falló, una línea con «error».
  const problemas = salida.split('\n').flatMap((l) => {
    const cortes = l.match(/cortes (\{.*\})/);
    if (cortes) return JSON.parse(cortes[1]).cortados.length > 0 ? [l] : [];
    return /error/i.test(l) ? [l] : [];
  });
  control(`captura ${nombre}: la escena terminó sin errores ni textos cortados`, problemas.length === 0, problemas.join(' | '));
}

const hoy = exigir(await apk.hoyConOpciones(ase), 'API-ING-01').data;
const comida = (n) => hoy.meals.find((m) => m.label === n);
const [almuerzo, cena] = [comida('Almuerzo'), comida('Cena')];
const pollo = almuerzo.options.find((o) => o.recipe?.name === 'Pollo con arroz y verduras');
// Preparación: el almuerzo de hoy se deshace (como «Deshacer registro»), para ver el carrusel y registrar desde ahí.
for (const r of hoy.records.filter((x) => x.meal?.mealId === almuerzo.mealId)) exigir(await apk.deshacerRegistroDeComida(ase, r.recordId, { reason: 'Preparación del recorrido de la APK', expectedVersion: r.version }, clave()), 'deshacer el almuerzo');
const base = { fecha: hoy.date };
capturar('40-api-real-carrusel-almuerzo', 'real-hoy', { ...base, comida: almuerzo.mealId }, 'Hoy · Almuerzo con las tres recetas de la profesional');
capturar('41-api-real-carrusel-almuerzo-claro', 'real-hoy', { ...base, comida: almuerzo.mealId }, 'Hoy · Almuerzo, en Claro', { tema: 'claro', ancho: 412 });
capturar('42-api-real-detalle-pollo', 'real-detalle', { ...base, comida: almuerzo.mealId, opcion: pollo.optionId }, 'Detalle de «Pollo con arroz y verduras»');
capturar('43-api-real-cena-algo-diferente', 'real-hoy', { ...base, comida: cena.mealId }, 'Hoy · Cena: algo diferente, con la foto privada');
const antes = Date.now();
capturar('44-api-real-registrado-desde-el-carrusel', 'real-registrar', { ...base, comida: almuerzo.mealId }, '«Comí esta opción» desde el carrusel: registrado en la API', { espera: 12000 });
const despues = exigir(await apk.hoyConOpciones(ase), 'API-ING-01 después').data;
const registroId = despues.meals.find((m) => m.mealId === almuerzo.mealId).recordId;
const registro = registroId ? exigir(await apk.consultarRegistroDeComida(ase, registroId), 'API-ING-03').data : null;
control(
  'el toque en «Comí esta opción» del carrusel quedó registrado en la API: la primera opción, con las cantidades sin confirmar',
  registro && registro.kind === 'PLAN_OPTION' && registro.option?.optionId === pollo.optionId && registro.consumption?.status === 'UNCONFIRMED' && Date.parse(registro.recordedAt) >= antes - 60_000,
  registro ? `${registro.option?.label} · ${registro.consumption?.status} · ${registro.recordedAt}` : 'sin registro',
);
fs.writeFileSync(enTrabajo('apk-con-la-api-real.json'), JSON.stringify({ controles }, null, 2));
const fallas = controles.filter((c) => !c.ok).length;
console.log(`${controles.length - fallas}/${controles.length} controles OK`);
process.exit(fallas ? 1 : 0);
