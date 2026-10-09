// PostgreSQL 16 local para la demostración y los recorridos del dashboard profesional, sin Docker (embedded-postgres).
// Puerto 55442 (o BE_PG_PUERTO), usuario y clave be_test. Los datos quedan en ./datos (ignorado por git) y sobreviven
// al apagado; borrar esa carpeta es empezar de cero.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const datos = path.join(path.dirname(fileURLToPath(import.meta.url)), 'datos');
export const puerto = Number(process.env.BE_PG_PUERTO ?? 55442);
export const usuario = 'be_test';
export const clave = 'be_test';

const BINARIOS = {
  'win32-x64': '@embedded-postgres/windows-x64',
  'linux-x64': '@embedded-postgres/linux-x64',
  'darwin-arm64': '@embedded-postgres/darwin-arm64',
  'darwin-x64': '@embedded-postgres/darwin-x64',
};

/**
 * Apaga el servidor de ./datos con pg_ctl en modo «fast»: cierra las conexiones y escribe todo antes de salir. Devuelve
 * false si no había uno corriendo. Sirve aunque la terminal que lo levantó se haya cerrado.
 */
export async function apagar() {
  if (!fs.existsSync(path.join(datos, 'postmaster.pid'))) return false;
  const paquete = BINARIOS[`${process.platform}-${process.arch}`];
  if (!paquete) throw new Error(`Sin binarios de PostgreSQL para ${process.platform}-${process.arch}`);
  const { pg_ctl } = await import(paquete);
  try {
    await promisify(execFile)(pg_ctl, ['-D', datos, 'stop', '-m', 'fast', '-w']);
  } catch (error) {
    // Con Ctrl+C, PostgreSQL recibe la misma señal y puede terminar de apagarse antes que pg_ctl.
    if (fs.existsSync(path.join(datos, 'postmaster.pid'))) throw error;
  }
  return true;
}
