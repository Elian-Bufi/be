// PostgreSQL 16 local para la demostración y los recorridos del dashboard profesional, sin Docker (embedded-postgres).
// Puerto 55442 (o BE_PG_PUERTO), usuario y clave be_test.
//
// El directorio de datos es `BE_PG_DATOS` si se indica (un clúster que ya existe, por ejemplo el de una sesión de trabajo)
// o, si no, `./datos` (ignorado por git). Los datos sobreviven al apagado. Nunca se crea un clúster ni una base sin
// pedirlo (`iniciar.mjs --crear`): un directorio equivocado no tiene que convertirse en una base vacía en silencio.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const datos = process.env.BE_PG_DATOS ? path.resolve(process.env.BE_PG_DATOS) : path.join(path.dirname(fileURLToPath(import.meta.url)), 'datos');
export const puerto = Number(process.env.BE_PG_PUERTO ?? 55442);
export const usuario = 'be_test';
export const clave = 'be_test';

const BINARIOS = {
  'win32-x64': '@embedded-postgres/windows-x64',
  'linux-x64': '@embedded-postgres/linux-x64',
  'darwin-arm64': '@embedded-postgres/darwin-arm64',
  'darwin-x64': '@embedded-postgres/darwin-x64',
};

async function pgCtl() {
  const paquete = BINARIOS[`${process.platform}-${process.arch}`];
  if (!paquete) throw new Error(`Sin binarios de PostgreSQL para ${process.platform}-${process.arch}`);
  return (await import(paquete)).pg_ctl;
}

/** Si hay un servidor corriendo sobre `datos`, según pg_ctl (un `postmaster.pid` viejo, de un proceso cortado, no cuenta). */
export async function corriendo() {
  if (!fs.existsSync(path.join(datos, 'postmaster.pid'))) return false;
  try {
    await promisify(execFile)(await pgCtl(), ['-D', datos, 'status']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Apaga el servidor de `datos` con pg_ctl en modo «fast»: cierra las conexiones y escribe todo antes de salir. Devuelve
 * false si no había uno corriendo. Sirve aunque la terminal que lo levantó se haya cerrado.
 */
export async function apagar() {
  if (!(await corriendo())) return false;
  try {
    await promisify(execFile)(await pgCtl(), ['-D', datos, 'stop', '-m', 'fast', '-w']);
  } catch (error) {
    // Con Ctrl+C, PostgreSQL recibe la misma señal y puede terminar de apagarse antes que pg_ctl.
    if (await corriendo()) throw error;
  }
  return true;
}
