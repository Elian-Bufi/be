// Ubica el ejecutable de Typst 0.15.1: la variable TYPST, la carpeta de herramientas de la máquina de Dirección o el PATH.
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export function typst() {
  const candidatos = [process.env.TYPST, 'C:/Users/bufim/BE-herramientas/typst-0.15.1/typst-x86_64-pc-windows-msvc/typst.exe'].filter(Boolean);
  for (const c of candidatos) if (existsSync(c)) return c;
  try {
    execFileSync('typst', ['--version'], { stdio: 'ignore' });
    return 'typst';
  } catch {
    throw new Error('No encuentro Typst 0.15.1: definí TYPST con la ruta del ejecutable (ver LEEME.md).');
  }
}
