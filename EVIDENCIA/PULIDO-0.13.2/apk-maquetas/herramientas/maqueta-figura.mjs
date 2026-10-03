// MAQUETA de la figura de la APK en el navegador: no es la APK. La composición (dónde va cada cosa) sale del MISMO
// módulo que usa la APK (apps/mobile/src/composicion-de-la-figura.ts), y el dibujo de anillos, puntos y guías, de
// apps/mobile/src/dibujo-de-la-figura.ts. Lo que se imita a mano es el render de React Native: el texto se escala con la
// escala de letra simulada, como hace Android, y el contorno se dibuja con la misma imagen teñida y corrida.
// Uso (desde la raíz del repo): node <esta-ruta> <ancho> <HOMBRE|MUJER> <PERIMETROS|PLIEGUES> <azul-noche|claro> <escala> <salida.html>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const RAIZ = process.cwd();
const require = createRequire(path.join(RAIZ, 'package.json'));
const d = require(path.join(RAIZ, 'packages/domain/dist'));
const dibujo = await import(pathToFileURL(path.join(RAIZ, 'apps/mobile/src/dibujo-de-la-figura.ts')).href);
const comp = await import(pathToFileURL(path.join(RAIZ, 'apps/mobile/src/composicion-de-la-figura.ts')).href);

const [ancho = '320', sexo = 'HOMBRE', familia = 'PLIEGUES', tema = 'claro', escalaTxt = '1', salida = 'maqueta.html'] = process.argv.slice(2);
const W = Number(ancho);
const ELEGIDA = process.env.ELEGIDA ?? null;
// MAPA_DE_TOQUE=1: qué elige cada punto de la figura (comp.sitioTocado), sobre el dibujo.
const MAPA = process.env.MAPA_DE_TOQUE === '1';
const E = Number(escalaTxt);
// Los tokens de tema.ts que usa la figura.
const tokens = fs.readFileSync(path.join(RAIZ, 'apps/mobile/src/tema.ts'), 'utf8');
const bloque = tokens.slice(tokens.indexOf(tema === 'claro' ? 'export const CLARO' : 'export const AZUL_NOCHE'));
const token = (k) => bloque.match(new RegExp(`\\b${k}: '([^']+)'`))[1];
const L = { fondo: token('laminaFondo'), tarjeta: token('laminaTarjeta'), borde: token('laminaBorde'), nombre: token('laminaNombre'), valor: token('laminaValor'), detalle: token('laminaDetalle'), contorno: token('laminaContorno') };
const P = { pagina: token('fondo'), superficie: token('superficie'), borde: token('borde'), texto: token('texto'), boton: token('botonFondo'), botonTexto: token('botonTexto'), tenue: token('tenue') };
const colores = d.COLORES_DE_LA_FIGURA[tema === 'claro' ? 'CLARO' : 'AZUL'];

// Una toma sintética con diferencias, para ver las filas completas.
const valores = {
  'perimetro-cuello': [38, -0.5], 'perimetro-hombros': [116, 1.2], 'perimetro-pecho': [98, 0.8], 'perimetro-brazo-relajado': [32, 0.4], 'perimetro-brazo-flexionado': [34.5, 0.6],
  'perimetro-antebrazo': [28, 0], 'perimetro-muneca': [17, 0], 'perimetro-cintura': [84, -2], 'perimetro-abdomen': [86, -1.5], 'perimetro-cadera': [98, -0.8],
  'perimetro-muslo': [56, 0.3], 'perimetro-pantorrilla': [37, 0.1], 'perimetro-tobillo': [22, 0],
  'pliegue-pectoral': [9, -1], 'pliegue-axilar-media': [11, -0.5], 'pliegue-triceps': [10, -1.2], 'pliegue-subescapular': [12, -0.8], 'pliegue-antebrazo': [5, 0],
  'pliegue-supraespinal': [8, -1.1], 'pliegue-biceps': [6, -0.4], 'pliegue-cresta-iliaca': [13, -1.0], 'pliegue-abdominal': [15, -2.3], 'pliegue-muslo-frontal': [14, -0.6], 'pliegue-pantorrilla': [7, -0.2],
};
const medidas = Object.entries(valores).map(([metrica, [v, delta]]) => ({
  metrica,
  nombre: metrica,
  actual: { punto: { value: v, unit: metrica.startsWith('pliegue') ? 'mm' : 'cm' } },
  anterior: null,
  diferencia: { delta, unidad: '', dias: 7 },
}));

const c = comp.componerLaFigura({ ancho: W, sexo, familia, medidas, escalaDeLetra: E });
const figura = d.FIGURAS_DE_LA_LAMINA[sexo].ENTERO;
const imagenArchivo = path.join(RAIZ, 'apps/mobile/assets/figura', figura.archivo).replace(/\\/g, '/');
const abs = (x, y, w, h, extra = '') => `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}`;
const px = (n) => `${(n * E).toFixed(1)}px`;

function capasDelSitio(s) {
  const capas = s.anillo ? dibujo.ANILLO_EN_EL_TELEFONO : s.posterior ? dibujo.PLIEGUE_POSTERIOR_EN_EL_TELEFONO : dibujo.PLIEGUE_EN_EL_TELEFONO;
  return capas
    .map((capa) => {
      const color = d.colorDeLaCapa(capa, colores);
      if (!color) return '';
      const opacidad = d.opacidadDeLaCapa(capa, colores);
      const pintura =
        capa.grosor === undefined
          ? `fill="${color}"`
          : capa.guiones
            ? `fill="none" stroke="${color}" stroke-width="${capa.grosor}" stroke-dasharray="${capa.guiones.join(' ')}"`
            : `fill="none" stroke="${color}" stroke-width="${capa.grosor}" stroke-linecap="round"`;
      if (s.anillo && capa.tramo && capa.tramo !== 'COMPLETO') return `<path d="${dibujo.arcoDeLaElipse({ cx: s.cx, cy: s.cy, rx: s.anillo.rx, ry: s.anillo.ry }, capa.tramo)}" opacity="${opacidad}" ${pintura}/>`;
      if (capa.radio !== undefined) return `<circle cx="${s.cx}" cy="${s.cy}" r="${capa.radio}" opacity="${opacidad}" ${pintura}/>`;
      return '';
    })
    .join('');
}

function segmentos(opciones, elegida) {
  return `<div style="display:flex;flex-wrap:wrap;gap:4px;padding:3px;margin:6px 0;border-radius:27px;border:1px solid ${P.borde};background:${P.superficie}">${opciones
    .map((o) => `<div style="flex:1 1 auto;min-height:48px;padding:8px 10px;box-sizing:border-box;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:${px(16)};font-weight:${o === elegida ? 800 : 600};color:${o === elegida ? P.botonTexto : P.texto};background:${o === elegida ? P.boton : 'transparent'}">${o}</div>`)
    .join('')}</div>`;
}

let h = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700;800&display=swap" rel="stylesheet">`;
h += `<body style="margin:0;background:${P.pagina};font-family:Roboto,Arial,sans-serif"><div style="width:${W}px;margin:12px 16px">`;
h += `<div style="font:700 11px Roboto,Arial;letter-spacing:.06em;color:#fff;background:#B42318;padding:4px 8px;border-radius:4px;display:inline-block">MAQUETA · NO ES LA APK · ${sexo} · ${familia} · ${tema} · letra ×${E} · modo ${c.modo}${ELEGIDA ? ' · elegida ' + ELEGIDA : ''}${MAPA ? ' · mapa de toque' : ''}</div>`;
h += segmentos(['Perímetros', 'Pliegues'], familia === 'PERIMETROS' ? 'Perímetros' : 'Pliegues');
h += `<div style="position:relative;width:${W}px;height:${c.alto}px;background:${L.fondo};border-radius:16px;overflow:hidden;margin:8px 0">`;
// El contorno: la imagen teñida y corrida en ocho direcciones (en el navegador, con un filtro que la lleva a un color).
const desplazamientos = [[-1.25, 0], [1.25, 0], [0, -1.25], [0, 1.25], [-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]];
h += `<svg width="0" height="0" style="position:absolute"><filter id="tinte"><feFlood flood-color="${L.contorno}"/><feComposite in2="SourceAlpha" operator="in"/></filter></svg>`;
for (const [dx, dy] of desplazamientos) h += `<img src="file:///${imagenArchivo}" style="${abs(c.imagen.x + dx, c.imagen.y + dy, c.imagen.ancho, c.imagen.alto, 'filter:url(#tinte)')}">`;
h += `<img src="file:///${imagenArchivo}" style="${abs(c.imagen.x, c.imagen.y, c.imagen.ancho, c.imagen.alto)}">`;
h += `<svg width="${W}" height="${c.alto}" style="position:absolute;left:0;top:0">`;
for (const g of c.guias) {
  const t = g.posterior ? dibujo.GUIA_EN_EL_TELEFONO.posterior : dibujo.GUIA_EN_EL_TELEFONO.normal;
  const opacidad = ELEGIDA === null ? 1 : g.clave === ELEGIDA ? 1 : 0.2;
  const grosor = g.clave === ELEGIDA ? t.grosor + 0.9 : t.grosor;
  h += `<g opacity="${opacidad}"><path d="${dibujo.trazoDeLaGuia(g.desde, g.quiebre, g.hasta)}" fill="none" stroke="${colores[t.color]}" stroke-width="${grosor}" stroke-dasharray="${t.guiones.join(' ')}"/>`;
  h += `<circle cx="${g.desde.x + 0.5}" cy="${g.desde.y}" r="${t.radioDelPunto}" fill="${colores[t.colorDelPunto]}"/></g>`;
}
h += c.sitios.map(capasDelSitio).join('');
for (const st of c.sitios.filter((x) => x.clave === ELEGIDA)) {
  h += st.anillo ? `<ellipse cx="${st.cx}" cy="${st.cy}" rx="${st.anillo.rx + 5}" ry="${st.anillo.ry + 5}" fill="none" stroke="${L.valor}" stroke-width="2"/>` : `<circle cx="${st.cx}" cy="${st.cy}" r="11" fill="none" stroke="${L.valor}" stroke-width="2"/>`;
}
if (c.modo === 'NUMEROS') {
  for (const t of c.tarjetas) {
    const f = t.filas[0];
    const x = t.x + 2 + c.ficha / 2;
    h += `<circle cx="${x}" cy="${f.y}" r="${c.ficha / 2}" fill="${L.tarjeta}" stroke="${L.borde}"/><text x="${x}" y="${f.y + c.ficha * 0.18}" font-size="${c.ficha * 0.5}" font-weight="700" fill="${L.valor}" text-anchor="middle" font-family="Roboto,Arial">${f.sitio.numero}</text>`;
  }
}
if (MAPA) {
  // Cada sitio, un color; el gris rayado es un toque parejo entre dos sitios. Se agrupan las celdas de una fila en tramos.
  const tono = new Map(c.sitios.map((st, i) => [st.clave, Math.round((i * 360) / c.sitios.length)]));
  const tapa = (x, y) => c.modo === 'TARJETAS' && c.tarjetas.some((t) => x >= t.x && x <= t.x + t.ancho && y >= t.y && y <= t.y + t.alto);
  h += '<defs><pattern id="parejo" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="rgba(40,40,40,.55)"/><rect width="3" height="6" fill="rgba(230,230,230,.75)"/></pattern></defs>';
  const paso = 2;
  for (let y = 0; y < c.alto; y += paso) {
    let inicio = 0;
    let actual = null;
    const cerrar = (fin) => {
      if (actual === null) return;
      const relleno = actual === 'parejo' ? 'url(#parejo)' : `hsla(${tono.get(actual)}, 85%, 55%, .42)`;
      h += `<rect x="${inicio}" y="${y}" width="${fin - inicio}" height="${paso}" fill="${relleno}"/>`;
    };
    for (let x = 0; x <= W; x += paso) {
      const t = x < W && !tapa(x, y) ? comp.sitioTocado(c.sitios, x + paso / 2, y + paso / 2) : null;
      const valor = t === null ? null : t.tipo === 'sitio' ? t.clave : 'parejo';
      if (valor !== actual) {
        cerrar(x);
        inicio = x;
        actual = valor;
      }
    }
  }
}
h += '</svg>';
if (c.modo === 'TARJETAS') {
  for (const t of c.tarjetas) {
    h += `<div style="${abs(t.x, t.y, t.ancho, t.alto, `box-sizing:border-box;padding:6px 8px;border-radius:12px;border:1px solid ${L.borde};background:${L.tarjeta}`)}">`;
    for (const f of t.filas) {
      const fe = f.sitio.clave === ELEGIDA;
      h += `<div style="height:${f.alto}px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;margin:0 -6px;padding:0 5px;border-radius:8px;border:1px solid ${fe ? L.valor : 'transparent'}">`;
      h += `<div style="font-size:${px(comp.LETRA.rotulo)};line-height:${px(comp.INTERLINEA.rotulo)};color:${L.nombre};font-weight:${fe ? 800 : 400};display:-webkit-box;-webkit-line-clamp:${f.lineasDelRotulo};-webkit-box-orient:vertical;overflow:hidden">${f.sitio.rotulo}</div>`;
      h += `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:${px(comp.INTERLINEA.valor)}"><span style="font-size:${px(comp.LETRA.valor)};font-weight:700;color:${L.valor}">${f.sitio.valor}</span>${f.sitio.diferencia ? `<span style="font-size:${px(comp.LETRA.detalle)};color:${L.detalle}">&nbsp;&nbsp;${f.sitio.diferencia}</span>` : ''}</div>`;
      h += '</div>';
    }
    h += '</div>';
  }
}
h += '</div>';
if (c.modo === 'NUMEROS') {
  h += `<div style="background:${L.fondo};border-radius:16px;padding:10px;margin-bottom:8px"><div style="font-size:${px(14)};font-weight:700;color:${L.nombre};margin-bottom:6px">Cada número de la figura, con su valor</div>`;
  for (const s of c.sitios) {
    h += `<div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;${s.numero === 1 ? '' : `border-top:1px solid ${L.borde}`}"><div style="flex:none;width:${c.ficha}px;height:${c.ficha}px;border-radius:50%;border:1px solid ${L.borde};background:${L.tarjeta};display:flex;align-items:center;justify-content:center;box-sizing:border-box;font-size:${(12 * Math.min(E, 1.6)).toFixed(1)}px;font-weight:700;color:${L.valor}">${s.numero}</div><div style="flex:1;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;column-gap:10px"><span style="font-size:${px(15)};color:${L.nombre}">${s.rotulo}</span><span><span style="font-size:${px(16)};font-weight:700;color:${L.valor}">${s.valor}</span>${s.diferencia ? `<span style="font-size:${px(14)};color:${L.detalle}">&nbsp;&nbsp;${s.diferencia}</span>` : ''}</span></div></div>`;
  }
  h += '</div>';
}
const se = c.sitios.find((x) => x.clave === ELEGIDA);
if (se) h += `<div style="background:${L.fondo};border-radius:12px;padding:8px 12px;margin-bottom:6px"><div style="font-size:${px(15)};font-weight:700;color:${L.valor}">${se.rotulo}: ${se.valor}</div><div style="font-size:${px(14)};color:${L.detalle}">Antes: (valor anterior) · Diferencia: ${se.diferencia ?? '—'}</div></div>`;
h += segmentos(['Hombre', 'Mujer'], sexo === 'HOMBRE' ? 'Hombre' : 'Mujer');
h += '</div></body>';
fs.writeFileSync(salida, h);
console.log(JSON.stringify({ salida: path.basename(salida), modo: c.modo, alto: Math.round(c.alto) }));
