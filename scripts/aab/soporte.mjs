// Lo de Node que usan los scripts del AAB, en un solo lugar (así los scripts importan una línea).
export { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
export { createHash } from 'node:crypto';
