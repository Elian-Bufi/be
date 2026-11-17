// Uso: BE_CUENTAS_COHORTE=<cuentas.env> BE_CUENTAS_DEMO=<.env.cuentas-demo> node verificar-cuentas.mjs (Node 22).
// Verificación de solo lectura de las cuentas sintéticas en test: entrar, leer /me y los vínculos propios, y cerrar la
// sesión. Las credenciales se leen de archivos fuera del repositorio y no se imprimen ni se guardan. El resultado (sin
// correos, sin claves, sin identificadores) va a la tesis: datos/usuarios-verificados.json.
import { readFileSync, writeFileSync } from 'node:fs';

const API = 'https://be-api-hndp.onrender.com/api/v1';
const SALUD = 'https://be-api-hndp.onrender.com/health/ready';
const leerEnv = (ruta) =>
  Object.fromEntries(
    readFileSync(ruta, 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
  );
// Las rutas de los archivos de credenciales llegan por el entorno (están fuera del repositorio).
if (!process.env.BE_CUENTAS_COHORTE || !process.env.BE_CUENTAS_DEMO) throw new Error('faltan BE_CUENTAS_COHORTE y BE_CUENTAS_DEMO');
const cohorte = leerEnv(process.env.BE_CUENTAS_COHORTE);
const demo = leerEnv(process.env.BE_CUENTAS_DEMO);

const CUENTAS = [
  { clave: 'PRO_N', nombre: 'Lic. Sofía Paz', rol: 'Profesional', origen: 'cohorte', env: cohorte },
  { clave: 'PRO_T', nombre: 'Prof. Martín Acosta', rol: 'Profesional', origen: 'cohorte', env: cohorte },
  { clave: 'PRO_A', nombre: 'Prof. Lucía Benítez', rol: 'Profesional', origen: 'cohorte', env: cohorte },
  { clave: 'ASE_DIEGO', nombre: 'Diego Sosa', rol: 'Asesorado', origen: 'cohorte', env: cohorte },
  { clave: 'ASE_CAMILA', nombre: 'Camila Ortiz', rol: 'Asesorado', origen: 'cohorte', env: cohorte },
  { clave: 'ASE_FEDERICO', nombre: 'Federico Álvarez', rol: 'Asesorado', origen: 'cohorte', env: cohorte },
  { clave: 'ASE_NORMA', nombre: 'Norma Castro', rol: 'Asesorado', origen: 'cohorte', env: cohorte },
  { clave: 'ASE_HECTOR', nombre: 'Héctor Funes', rol: 'Asesorado', origen: 'cohorte', env: cohorte },
  { clave: 'ASE_AGUSTINA', nombre: 'Agustina Ledesma', rol: 'Asesorado', origen: 'cohorte', env: cohorte },
  { clave: 'DEMO_PN', nombre: 'DEMO-PN', rol: 'Profesional', origen: 'demostración (WP-03)', env: demo },
  { clave: 'DEMO_PT', nombre: 'DEMO-PT', rol: 'Profesional', origen: 'demostración (WP-03)', env: demo },
  { clave: 'DEMO_PA', nombre: 'DEMO-PA', rol: 'Profesional', origen: 'demostración (WP-05)', env: demo },
  { clave: 'DEMO_A01', nombre: 'DEMO-A01', rol: 'Asesorado', origen: 'demostración (WP-02)', env: demo },
  { clave: 'DEMO_A02', nombre: 'DEMO-A02', rol: 'Asesorado', origen: 'demostración (WP-02)', env: demo },
];

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function pedir(metodo, ruta, { token, cuerpo, superficie = 'WEB' } = {}) {
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', 'x-be-surface': superficie, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let json = null;
  try {
    json = t ? JSON.parse(t) : null;
  } catch {
    json = null;
  }
  return { estado: r.status, json };
}

const salud = await (await fetch(SALUD)).json().catch(() => null);
const resultados = [];
for (const c of CUENTAS) {
  const correo = c.env[`${c.clave}_CORREO`];
  const clave = c.env[`${c.clave}_CLAVE`];
  const fila = { cuenta: c.nombre, rol: c.rol, origen: c.origen };
  if (!correo || !clave) {
    resultados.push({ ...fila, entra: false, motivo: 'sin credenciales en el archivo local' });
    continue;
  }
  const s = await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: clave } });
  if (s.estado !== 200 && s.estado !== 201) {
    resultados.push({ ...fila, entra: false, motivo: `inicio de sesión: ${s.estado} ${s.json?.error?.code ?? ''}`.trim() });
    await espera(1500);
    continue;
  }
  const token = s.json.data.session.accessToken;
  const me = await pedir('GET', '/me', { token });
  // Todas las páginas de /me/relationships (cada elemento es un vínculo por alcance, DL-034).
  const vinculos = [];
  let cursor = null;
  let vin;
  do {
    vin = await pedir('GET', '/me/relationships' + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''), { token });
    if (Array.isArray(vin.json?.data)) vinculos.push(...vin.json.data);
    cursor = vin.json?.page?.nextCursor ?? null;
  } while (cursor && vinculos.length < 500);
  const alcances = {};
  for (const v of vinculos) {
    const k = `${v.scope?.code ?? '?'} ${v.relationshipState ?? '?'} ${v.consentState ?? '?'}`;
    alcances[k] = (alcances[k] ?? 0) + 1;
  }
  const fuera = await pedir('DELETE', '/auth/sessions/current', { token });
  resultados.push({
    ...fila,
    entra: true,
    estadoDeCuenta: me.json?.data?.accountOperationalState ?? null,
    intencionDeRegistro: me.json?.data?.registrationIntent ?? null,
    capacidades: me.json?.data?.actorCapabilities ?? [],
    vinculos: vinculos.length,
    alcances,
    lecturaDeVinculos: vin.estado,
    cierreDeSesion: fuera.estado,
  });
  await espera(1500);
}
const salida = {
  _que_es: 'Verificación de solo lectura de las cuentas sintéticas en test (entrar, /me, /me/relationships, cerrar sesión). Sin correos ni claves.',
  fecha: new Date().toISOString(),
  api: { commit: salud?.data?.version?.commit?.slice(0, 7) ?? null, aplicacion: salud?.data?.version?.aplicacion ?? null, construidoEn: salud?.data?.version?.construidoEn ?? null },
  resultados,
};
writeFileSync(new URL('../datos/usuarios-verificados.json', import.meta.url), JSON.stringify(salida, null, 1));
for (const r of resultados) console.log(`${r.entra ? '✔' : '✖'} ${r.cuenta.padEnd(20)} ${r.rol.padEnd(12)} ${r.entra ? `${r.estadoDeCuenta} · ${r.intencionDeRegistro} · capacidades ${r.capacidades.length} · vínculos ${r.vinculos} · cierre ${r.cierreDeSesion}` : r.motivo}`);
console.log('API', JSON.stringify(salida.api));
