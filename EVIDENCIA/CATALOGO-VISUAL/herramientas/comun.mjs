// Lo común a las dos herramientas del catálogo visual (zonas.mjs y fotos.mjs): los argumentos, el cliente de la API, la
// sesión del profesional de Entrenamiento de la cohorte, los ejercicios de la demostración por identidad y el comando de
// curaduría de BE. Solo módulos nativos de Node 22: no compila el dominio. Nunca imprime una credencial ni una URL de base.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { destino, leerCuentas, leerEstado } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/destino.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const CARPETA = path.resolve(AQUI, '..');
export const REPO = path.resolve(AQUI, '../../..');
export const COMANDO = path.join(REPO, 'apps/api/dist/entrenamiento/curaduria-comando.js');
export const leerJson = (ruta) => JSON.parse(fs.readFileSync(ruta, 'utf8'));

/** Los argumentos: el modo primero, después `--nombre valor` y las banderas sin valor. */
export function leerArgumentos(argv, { modos, valores, banderas = [], uso }) {
  const [modo, ...resto] = argv;
  if (!modos.includes(modo)) throw new Error(uso);
  const opciones = { modo };
  for (let i = 0; i < resto.length; i++) {
    const a = resto[i];
    const nombre = a.startsWith('--') ? a.slice(2) : null;
    if (nombre && banderas.includes(nombre)) opciones[nombre] = true;
    else if (nombre && valores.includes(nombre) && resto[i + 1] !== undefined && !resto[i + 1].startsWith('--')) opciones[nombre] = resto[++i];
    else throw new Error(`No conozco «${a}» o le falta el valor.\n${uso}`);
  }
  return opciones;
}

/** El destino de la cohorte (local o test), con sus guardias: la API, la base, las cuentas y el estado. */
export function destinoDe(nombre, uso) {
  if (!nombre) throw new Error(`Falta --destino (local o test): no hay valor por omisión.\n${uso}`);
  const d = destino(nombre);
  return { ...d, appEnv: nombre === 'test' ? 'test' : 'development' };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** El cliente: reintenta ante un corte de red, un 429 o un 502 a 504, sin repetir una escritura (cada una lleva su clave). */
export function clienteDe(origen) {
  async function pedir(metodo, ruta, { token, cuerpo, clave, tipo } = {}) {
    const headers = { 'X-BE-Surface': 'WEB' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) headers['Content-Type'] = tipo ?? 'application/json';
    if (clave) headers['Idempotency-Key'] = clave;
    const body = cuerpo === undefined ? undefined : tipo ? cuerpo : JSON.stringify(cuerpo);
    for (let intento = 1; ; intento++) {
      let r;
      try {
        r = await fetch(`${origen}/api/v1${ruta}`, { method: metodo, headers, body });
      } catch (e) {
        if (intento >= 5) throw e;
        await espera(2000 * intento);
        continue;
      }
      const texto = await r.text();
      if (r.status === 429 && intento < 8) {
        await espera(Number(r.headers.get('retry-after') ?? 15) * 1000 + 500);
        continue;
      }
      if (r.status >= 502 && r.status <= 504 && intento < 5) {
        await espera(3000 * intento);
        continue;
      }
      let json = null;
      try {
        json = texto ? JSON.parse(texto) : null;
      } catch {
        json = null;
      }
      if (!r.ok) {
        const e = new Error(`${metodo} ${ruta.replace(/\/media\/uploads\/.*/, '/media/uploads/…')}: ${r.status} ${json?.error?.code ?? ''}`.trim());
        e.status = r.status;
        throw e;
      }
      return json;
    }
  }
  return { pedir };
}

/** La sesión de la cuenta PRO_T (Prof. Martín Acosta), con las credenciales de `cuentas.env`, que no se imprimen. */
export async function sesionDeEntrenamiento(api, d) {
  const c = leerCuentas(d);
  if (!c.PRO_T_CORREO || !c.PRO_T_CLAVE) throw new Error('El archivo de cuentas del destino no tiene la cuenta PRO_T (el profesional de Entrenamiento).');
  const r = await api.pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: c.PRO_T_CORREO, credential: c.PRO_T_CLAVE } });
  return r.data.session.accessToken;
}

/**
 * Los ejercicios de la demostración por identidad, nunca por nombre: los del catálogo, por su `exerciseId`; los propios
 * de la cuenta PRO_T, por la versión que guardó la carga de la cohorte (`estado.json`, `ejercicios.<clave>`), cruzada con
 * sus ejercicios propios (API-EJE-01). El nombre solo se compara para avisar.
 */
export async function ejerciciosDeLaDemo(api, token, d, lista) {
  const estado = leerEstado(d);
  const propios = (await api.pedir('GET', '/training/own-exercises', { token })).data;
  const porVersion = new Map(propios.map((e) => [e.versionId, e]));
  const resueltos = [];
  for (const e of lista.ejercicios) {
    if (e.ambito === 'CATALOGO') {
      resueltos.push({ ...e, exerciseId: e.exerciseId, encontrado: true });
      continue;
    }
    const versionId = estado.ejercicios?.[e.clave];
    const propio = versionId ? porVersion.get(versionId) : undefined;
    resueltos.push({ ...e, exerciseId: propio?.exerciseId ?? null, versionId: propio?.versionId ?? versionId ?? null, encontrado: Boolean(propio), propio: propio ?? null });
  }
  const ids = resueltos.filter((e) => e.exerciseId).map((e) => e.exerciseId);
  const fichas = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    for (const f of (await api.pedir('POST', '/training/exercises/visual-sheets', { token, cuerpo: { exerciseIds: ids.slice(i, i + 50) } })).data) fichas.set(f.exerciseId, f);
  }
  return resueltos.map((e) => {
    const ficha = e.exerciseId ? fichas.get(e.exerciseId) ?? null : null;
    return { ...e, ficha, encontrado: e.encontrado && Boolean(ficha), nombreDistinto: ficha && ficha.name !== e.nombre ? ficha.name : null };
  });
}

/** Una clave de idempotencia que sale de lo que se manda: repetir la misma escritura no suma nada. */
export const claveDe = (...partes) => `catalogo-visual-${createHash('sha256').update(partes.join('|')).digest('hex').slice(0, 40)}`;

/**
 * El comando de curaduría de BE (`apps/api/dist/entrenamiento/curaduria-comando.js`), con la base del destino en
 * DATABASE_URL: no se imprime ni queda en la línea de comandos. Responde lo que dice el comando en JSON.
 */
export function correrComando(d, accion, archivo, { operador, fundamento, curador, escribir }) {
  if (!fs.existsSync(COMANDO)) throw new Error('Falta la API construida (apps/api/dist). Corré antes: npm run build:api');
  const args = [COMANDO, accion, accion === 'zonas' ? '--archivo' : '--manifiesto', archivo, '--operador', operador ?? '', '--fundamento', fundamento ?? '', '--salida', 'json'];
  if (curador) args.push('--curador', curador);
  if (escribir) args.push('--confirmo-escritura');
  const r = spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8', env: { ...process.env, DATABASE_URL: d.base, APP_ENV: d.appEnv }, maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`El comando de curaduría respondió ${r.status}: ${(r.stderr || '').trim().slice(0, 600)}`);
  return JSON.parse(r.stdout);
}

/** Un archivo de trabajo, fuera del repo versionado (`trabajo/`, que git ignora). */
export function archivoDeTrabajo(nombre, contenido) {
  const carpeta = path.join(CARPETA, 'trabajo');
  fs.mkdirSync(carpeta, { recursive: true });
  const ruta = path.join(carpeta, nombre);
  fs.writeFileSync(ruta, JSON.stringify(contenido, null, 2));
  return ruta;
}

export const ESCRIBIR_EXIGE = 'Escribir exige --confirmo-escritura, la autorización de Dirección para ese destino, y un --operador y un --fundamento.';
