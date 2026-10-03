// MAQUETA de «Mi evolución» de la APK en el navegador: no es la APK. La geometría del gráfico sale del MISMO módulo
// que usa la APK (apps/mobile/src/grafico-de-evolucion.ts), con las observaciones preparadas por @be/domain y los
// colores de apps/mobile/src/tema.ts. Lo que se imita a mano es el render de React Native: tipografía, píldoras,
// tarjetas y botones, con la escala de letra simulada.
// Uso (desde la raíz): node <esta-ruta> <EVOLUCION|COMPARAR> <azul-noche|claro> <escala> <salida.html>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const RAIZ = process.cwd();
const require = createRequire(path.join(RAIZ, 'package.json'));
const d = require(path.join(RAIZ, 'packages/domain/dist'));
const g = await import(pathToFileURL(path.join(RAIZ, 'apps/mobile/src/grafico-de-evolucion.ts')).href);
const [vista = 'EVOLUCION', tema = 'azul-noche', escalaTxt = '1', salida = 'maqueta.html'] = process.argv.slice(2);
const E = Number(escalaTxt);
const W = 360 - 40;
const tokens = fs.readFileSync(path.join(RAIZ, 'apps/mobile/src/tema.ts'), 'utf8');
const bloque = tokens.slice(tokens.indexOf(tema === 'claro' ? 'export const CLARO' : 'export const AZUL_NOCHE'));
const t = (k) => bloque.match(new RegExp(`\\b${k}: '([^']+)'`))[1];
const C = { fondo: t('fondo'), superficie: t('superficie'), elevada: t('superficieElevada'), texto: t('texto'), tenue: t('tenue'), acento: t('acento'), borde: t('borde'), boton: t('botonFondo'), botonTexto: t('botonTexto') };
const px = (n) => `${(n * E).toFixed(1)}px`;
const num = (v) => v.toLocaleString('es-AR', { maximumFractionDigits: 1 });
const fechaCorta = (f) => new Date(`${f}T12:00:00Z`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '');

// Tres tomas sintéticas de cintura, como las del recorrido local.
const ZONA = 'America/Argentina/Buenos_Aires';
const G1 = { comparabilityGroup: 'cmp-1', protocolVersionId: 'perfil', protocolName: 'Perfil antropométrico completo', methodVersionId: null, unit: 'cm' };
let n = 0;
const punto = (dia, value) => ({ occurredAt: `${dia}T13:00:00.000Z`, recordedAt: `${dia}T13:05:00.000Z`, value, unit: 'cm', sourceEvaluationId: `ev-${++n}`, sourceId: `o-${n}`, dataClass: 'MEASURED', comparabilityGroup: 'cmp-1', correctionState: 'EFFECTIVE', incomparableWithPrevious: [] });
const serie = { metricCode: 'perimetro-cintura', series: [punto('2026-07-25', 85.2), punto('2026-08-24', 84.1), punto('2026-09-27', 83)], gaps: [], comparability: { groups: [G1] } };
const periodo = { start: '2026-07-06', end: '2026-10-03' };
const obs = d.prepararSerie(serie, ZONA).observaciones;
const alto = Math.round(190 + 46 * Math.min(E, 2));
const c = g.componerGrafico({ observaciones: obs, periodo, zonaHoraria: ZONA, ancho: W, alto, escalaDeLetra: E, anchoDelTexto: (s, tam) => s.length * tam * 0.56, formatoDelValor: num, formatoDeLaFecha: fechaCorta });
const elegida = c.puntos.length - 1;

const pildoras = (opciones, activa) => `<div style="display:flex;flex-wrap:wrap;gap:4px;padding:3px;margin:6px 0;border-radius:27px;border:1px solid ${C.borde};background:${C.superficie}">${opciones.map((o) => `<div style="flex:1 1 auto;min-height:48px;box-sizing:border-box;padding:8px 10px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:${px(16)};font-weight:${o === activa ? 800 : 600};color:${o === activa ? C.botonTexto : C.texto};background:${o === activa ? C.boton : 'transparent'}">${o}</div>`).join('')}</div>`;
const boton = (texto) => `<div style="flex:1 1 140px;min-height:48px;box-sizing:border-box;padding:0 14px;border-radius:8px;border:1px solid ${C.borde};background:${C.elevada};display:flex;align-items:center;justify-content:center;font-size:${px(16)};font-weight:700;color:${C.acento}">${texto}</div>`;
const rotulo = (texto) => `<div style="font-size:${px(12)};font-weight:800;letter-spacing:1.2px;color:${C.tenue};margin:14px 0 6px">${texto.toLocaleUpperCase('es-AR')}</div>`;
const cifra = (v, u, tam = 18) => `<span style="font-size:${px(tam)};font-weight:800;color:${C.texto};font-variant-numeric:tabular-nums">${v}</span><span style="font-size:${px(Math.round(tam * 0.72))};font-weight:600;color:${C.tenue}"> ${u}</span>`;

let h = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700;800&display=swap" rel="stylesheet"><body style="margin:0;background:${C.fondo};font-family:Roboto,Arial,sans-serif;color:${C.texto}"><div style="width:${W}px;margin:12px 20px">`;
h += `<div style="font:700 11px Roboto,Arial;letter-spacing:.06em;color:#fff;background:#B42318;padding:4px 8px;border-radius:4px;display:inline-block">MAQUETA · NO ES LA APK · ${vista} · ${tema} · letra ×${E}</div>`;
h += `<div style="font-size:${px(26)};font-weight:800;margin:10px 0">Mi evolución</div>`;
h += `<div style="font-size:${px(18)};font-weight:800">Tu última toma: 27 sept 2026</div><div style="font-size:${px(14)};color:${C.tenue};margin-bottom:4px">Comparada con 24 ago 2026 · 30 medidas · 15 resultados de fórmulas</div>`;
h += pildoras(['Última toma', 'Comparar', 'Evolución'], vista === 'EVOLUCION' ? 'Evolución' : 'Comparar');

if (vista === 'EVOLUCION') {
  h += `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin:4px 0"><div><div style="font-size:${px(12)};font-weight:800;letter-spacing:1.2px;color:${C.tenue}">MEDIDA</div><div style="font-size:${px(20)};font-weight:800">Perímetro de cintura</div></div>${boton('Cambiar de medida').replace('flex:1 1 140px', 'flex:0 0 auto')}</div>`;
  h += pildoras(['30 días', '60 días', '90 días'], '90 días');
  h += `<div style="font-size:${px(14)};color:${C.tenue}">6 jul 2026 — 3 oct 2026 · cm</div>`;
  // El gráfico.
  const letra = 12 * E;
  let svg = `<svg width="${W}" height="${alto}" style="display:block">`;
  for (const m of c.marcasY) svg += `<line x1="${c.area.izquierda}" x2="${c.area.derecha}" y1="${m.y}" y2="${m.y}" stroke="${C.borde}"/><text x="${c.area.izquierda - 6}" y="${m.y + letra * 0.35}" font-size="${letra}" fill="${C.tenue}" text-anchor="end" font-family="Roboto">${num(m.valor)}</text>`;
  for (const m of c.marcasX) svg += `<text x="${m.x}" y="${alto - 8}" font-size="${letra}" fill="${C.tenue}" text-anchor="middle" font-family="Roboto">${fechaCorta(m.fecha)}</text>`;
  const p = c.puntos[elegida];
  svg += `<line x1="${p.x}" x2="${p.x}" y1="${c.area.arriba}" y2="${c.area.abajo}" stroke="${C.tenue}" stroke-dasharray="3 4"/>`;
  for (const q of c.puntos) svg += `<circle cx="${q.x}" cy="${q.y}" r="${q.indice === c.puntos.length - 1 ? 7 : 5}" fill="${C.acento}" stroke="${C.superficie}" stroke-width="1.5"/>`;
  svg += `<circle cx="${p.x}" cy="${p.y}" r="11" fill="none" stroke="${C.texto}" stroke-width="2"/>`;
  const etiqueta = `${num(p.observacion.punto.value)} cm`;
  const ea = etiqueta.length * letra * 0.6 + 16;
  const eh = letra * 1.6;
  const ex = Math.min(Math.max(p.x - ea / 2, 2), W - ea - 2);
  const ey = Math.max(2, p.y - 18 - eh);
  svg += `<rect x="${ex}" y="${ey}" width="${ea}" height="${eh}" rx="${eh / 2}" fill="${C.elevada}" stroke="${C.borde}"/><text x="${ex + ea / 2}" y="${ey + eh * 0.68}" font-size="${letra}" font-weight="700" fill="${C.texto}" text-anchor="middle" font-family="Roboto">${etiqueta}</text>`;
  svg += '</svg>';
  h += `<div style="margin:8px 0;border-radius:16px;border:1px solid ${C.borde};background:${C.superficie};overflow:hidden">${svg}</div>`;
  h += `<div style="border:1px solid ${C.borde};border-radius:12px;padding:12px;background:${C.superficie};margin:6px 0"><div style="font-size:${px(14)};font-weight:700;color:${C.tenue}">27 sept 2026, 10:00</div>${cifra('83', 'cm', 24)}<div style="font-size:${px(14)};color:${C.tenue};margin-top:4px">Perfil antropométrico completo</div><div style="font-size:${px(14)};color:${C.tenue}">Cómo se obtuvo: Medido</div><div style="font-size:${px(14)};color:${C.tenue}">Es la última de estos días.</div></div>`;
  h += `<div style="display:flex;flex-wrap:wrap;gap:8px">${boton('‹ Anterior')}${boton('Siguiente ›').replace(C.acento, C.tenue)}</div>`;
  h += `<div style="border-top:1px solid ${C.borde};margin-top:10px;padding:12px 0;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:${px(16)};font-weight:700">La evolución, en lista</div><div style="font-size:${px(14)};color:${C.tenue}">3 con dato en estos días</div></div><div style="color:${C.acento}">▾</div></div>`;
} else {
  const filas = [
    ['Perímetros', [['Perímetro de cintura', '83', 'cm', 'Antes: 84,1 cm', '−1,1 cm'], ['Perímetro de cadera', '97,8', 'cm', 'Antes: 98,6 cm', '−0,8 cm'], ['Perímetro de brazo contraído', '36,3', 'cm', 'Antes: 36 cm (25 jul 2026)', '+0,3 cm']]],
    ['Diámetros óseos', [['Diámetro del húmero (codo)', '7,1', 'cm', 'Es la primera de esta medida en el período: no hay con qué compararla.', null]]],
    ['Resultados de las fórmulas', [['Índice de masa corporal', '26,1', 'kg/m²', 'Antes: 26,4 kg/m²', '−0,3 kg/m²']]],
  ];
  h += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:6px 0">${[['AHORA', '27 sept 2026'], ['ANTES', '24 ago 2026']].map(([r, f]) => `<div style="flex:1 1 130px;padding:12px;border-radius:14px;border:1px solid ${C.borde};background:${C.elevada}"><div style="font-size:${px(12)};font-weight:800;letter-spacing:1.2px;color:${C.tenue}">${r}</div><div style="font-size:${px(18)};font-weight:800">${f}</div></div>`).join('')}</div>`;
  for (const [familia, lista] of filas) {
    h += rotulo(familia);
    for (const [nombre, v, u, antes, dif] of lista) {
      h += `<div style="border-top:1px solid ${C.borde};padding:9px 0"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;column-gap:10px"><span style="font-size:${px(16)};font-weight:700">${nombre}</span><span>${cifra(v, u)}</span></div><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;column-gap:10px"><span style="font-size:${px(14)};color:${C.tenue};margin-top:2px">${antes}</span>${dif ? `<span style="font-size:${px(15)};font-weight:800;font-variant-numeric:tabular-nums">${dif}</span>` : ''}</div></div>`;
    }
  }
}
h += '</div></body>';
fs.writeFileSync(salida, h);
console.log(JSON.stringify({ salida: path.basename(salida), puntos: c.puntos.length, marcasX: c.marcasX.length, marcasY: c.marcasY.map((m) => m.valor) }));
