/**
 * La lámina de los íconos nuevos de WP-APP-VUELTA-DE-ROSCA (DL-166, AV-09): «habitos» y «engranaje», a 18, 20 y 24 dp,
 * en Claro y en Azul noche, junto a sus vecinos de la familia (reloj, descanso, persona, novedades) para compararlos.
 * Lee el dibujo del dominio compilado, el mismo que dibujan la APK y el website.
 *
 * Uso (después de construir @be/domain): node EVIDENCIA/APP-VUELTA-DE-ROSCA/iconos/lamina.mjs
 * Escribe lamina.html al lado. Las capturas se sacan con el navegador sin ventana, a 1× y a 2,625× (un teléfono de
 * unos 420 ppp, como el de Dirección): ver LEEME.md.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const { ICONOS, GROSOR_DE_ICONO, LIENZO_DE_ICONO } = await import('../../../packages/domain/dist/index.js');

const TEMAS = [
  { nombre: 'Claro', fondo: '#FFFFFF', texto: '#0A1F44', acento: '#1465F1' },
  { nombre: 'Azul noche', fondo: '#052238', texto: '#FFFFFF', acento: '#27D5F9' },
];
const NUEVOS = ['habitos', 'engranaje'];
const VECINOS = ['reloj', 'descanso', 'persona', 'novedades'];
const TAMANOS = [18, 20, 24];

function forma(f, color) {
  switch (f.forma) {
    case 'trazo':
      return `<path d="${f.d}"${f.guiones ? ` stroke-dasharray="${f.guiones}"` : ''}/>`;
    case 'circulo':
      return f.lleno ? `<circle cx="${f.cx}" cy="${f.cy}" r="${f.r}" fill="${color}" stroke="none"/>` : `<circle cx="${f.cx}" cy="${f.cy}" r="${f.r}"/>`;
    case 'rectangulo':
      return `<rect x="${f.x}" y="${f.y}" width="${f.ancho}" height="${f.alto}" rx="${f.radio}"/>`;
    case 'elipse':
      return `<ellipse cx="${f.cx}" cy="${f.cy}" rx="${f.rx}" ry="${f.ry}"${f.giro ? ` transform="${f.giro}"` : ''}/>`;
    case 'grupo':
      return `<g transform="${f.giro}">${f.formas.map((h) => forma(h, color)).join('')}</g>`;
  }
}
const svg = (nombre, tamano, color) =>
  `<svg width="${tamano}" height="${tamano}" viewBox="0 0 ${LIENZO_DE_ICONO} ${LIENZO_DE_ICONO}" fill="none" stroke="${color}" stroke-width="${GROSOR_DE_ICONO}" stroke-linecap="round" stroke-linejoin="round">${ICONOS[nombre].formas.map((f) => forma(f, color)).join('')}</svg>`;

const filas = (tema, color) =>
  [...NUEVOS, ...VECINOS]
    .map(
      (nombre) =>
        `<tr${NUEVOS.includes(nombre) ? ' class="nuevo"' : ''}><th>${nombre}</th>${TAMANOS.map((t) => `<td>${svg(nombre, t, color)}</td>`).join('')}<td>${svg(nombre, 48, color)}</td></tr>`,
    )
    .join('');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Íconos nuevos · AV-09</title>
<style>
body{margin:0;font:14px Roboto,Arial,sans-serif;display:flex;gap:0}
section{padding:16px 20px}
h2{font-size:15px;margin:0 0 8px}
table{border-collapse:collapse}
th{font-weight:500;text-align:left;padding:6px 12px 6px 0;font-size:13px}
td{padding:6px 10px;text-align:center;vertical-align:middle}
thead td{font-size:12px;opacity:.7}
tr.nuevo th{font-weight:800}
</style></head><body>
${TEMAS.map(
  (t) => `<section style="background:${t.fondo};color:${t.texto}"><h2>${t.nombre}</h2><table><thead><tr><td></td>${TAMANOS.map((x) => `<td>${x}</td>`).join('')}<td>48</td></tr></thead>
<tbody>${filas(t, t.texto)}</tbody></table><h2 style="margin-top:12px">En el acento</h2><table><tbody>${NUEVOS.map((n) => `<tr class="nuevo"><th>${n}</th>${TAMANOS.map((x) => `<td>${svg(n, x, t.acento)}</td>`).join('')}<td>${svg(n, 48, t.acento)}</td></tr>`).join('')}</tbody></table></section>`,
).join('')}
</body></html>`;

writeFileSync(join(aqui, 'lamina.html'), html);
console.log('lamina.html escrita');
