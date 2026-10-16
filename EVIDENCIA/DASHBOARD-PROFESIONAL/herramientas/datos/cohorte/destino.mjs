// Adónde carga la cohorte: la API y la base LOCALES, o el ambiente `test` de Render. Pedido de Dirección del 2026-10-16:
// «carga por lo menos 5 usuarios finales… desde 6 meses a 3 años», en test, para demostrar el funcionamiento y los
// gráficos. Solo datos sintéticos (08 §33): ninguna persona real.
//
// - local: la API en localhost:3001 y la base be_test_cohorte del PostgreSQL local (:55442). El estado y las cuentas,
//   en herramientas/trabajo-cohorte (git lo ignora).
// - test: la API pública de Render y la base por su URL externa, que Dirección abre solo para esta máquina mientras dura
//   la carga (07 §29: «acceso solo desde la plataforma + operador», con la lista de IP restringida). La URL vive en un
//   archivo fuera del repo y nunca se imprime. El estado y las cuentas, en C:\Users\bufim\BE-datos-locales\cohorte-test.
//
// Las credenciales de las cuentas que crea la cohorte se generan al azar y quedan solo en `cuentas.env` de esa carpeta.
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const HERRAMIENTAS = join(AQUI, '..', '..');

const DESTINOS = {
  local: () => {
    const base = process.env.BE_E2E_DATABASE_URL ?? 'postgresql://be_test:be_test@localhost:55442/be_test_cohorte';
    const u = new URL(base);
    if (!['localhost', '127.0.0.1'].includes(u.hostname) || !/^\/be_test_[a-z0-9_]+$/.test(u.pathname)) throw new Error('Guardia: en local, solo una base be_test_* de localhost.');
    return { nombre: 'local', api: process.env.BE_API ?? 'http://localhost:3001', base, carpeta: join(HERRAMIENTAS, 'trabajo-cohorte') };
  },
  test: () => {
    const archivo = 'C:/Users/bufim/BE-datos-locales/render-test-db.txt';
    if (!fs.existsSync(archivo)) throw new Error(`Falta ${archivo}: la URL externa de be-db-test, que copia Dirección desde el panel de Render.`);
    const texto = fs.readFileSync(archivo, 'utf8').trim();
    let u;
    try {
      u = new URL(texto);
    } catch {
      throw new Error(`${archivo} no tiene una URL de PostgreSQL válida.`);
    }
    if (!/^postgres(ql)?:$/.test(u.protocol) || !/\.render\.com$/.test(u.hostname) || u.pathname !== '/be_test') throw new Error('Guardia: la URL no es la base be_test de Render.');
    u.searchParams.set('sslmode', 'require');
    return { nombre: 'test', api: 'https://be-api-hndp.onrender.com', base: u.href, carpeta: 'C:/Users/bufim/BE-datos-locales/cohorte-test' };
  },
};

export function destino(nombre) {
  const armar = DESTINOS[nombre];
  if (!armar) throw new Error(`Destino desconocido «${nombre}»: local o test.`);
  const d = armar();
  fs.mkdirSync(d.carpeta, { recursive: true });
  return { ...d, estado: join(d.carpeta, 'estado.json'), cuentas: join(d.carpeta, 'cuentas.env') };
}

/** El estado de la carga (identificadores, nunca credenciales). */
export const leerEstado = (d) => (fs.existsSync(d.estado) ? JSON.parse(fs.readFileSync(d.estado, 'utf8')) : {});
export const guardarEstado = (d, cambios) => fs.writeFileSync(d.estado, JSON.stringify({ ...leerEstado(d), ...cambios }, null, 2));

/** Las credenciales, en formato CLAVE=valor. Nunca se imprimen. */
export function leerCuentas(d) {
  if (!fs.existsSync(d.cuentas)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(d.cuentas, 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
}
export function guardarCuenta(d, prefijo, { correo, clave, id }) {
  const actuales = leerCuentas(d);
  const nuevas = { ...actuales, [`${prefijo}_CORREO`]: correo, [`${prefijo}_CLAVE`]: clave, [`${prefijo}_ID`]: id };
  const cabecera = '# Cuentas sintéticas de la cohorte (pedido de Dirección del 2026-10-16). NO versionar ni compartir por chat.\n';
  fs.writeFileSync(d.cuentas, cabecera + Object.entries(nuevas).map(([k, v]) => `${k}=${v}`).join('\n') + '\n');
}
export const claveNueva = () => `Be-${randomBytes(12).toString('base64url')}`;
