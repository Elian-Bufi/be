// Maqueta HTML de la figura de la APK (apps/mobile/src/pantallas/figura-de-la-toma.tsx) con las mismas cuentas, para verla
// en un navegador, sin teléfono ni emulador. No es una captura de la APK: aproxima su dibujo con los mismos números.
// Uso (desde la raíz, con el dominio construido):
//   node EVIDENCIA/ANTROPOMETRIA-DL111/maqueta-figura-apk.cjs 328 HOMBRE PERIMETROS azul-noche maqueta.html
// Captura: chrome --headless=new --window-size=360,700 --screenshot=maqueta.png file:///<ruta>/maqueta.html
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..', '..');
const d = require(path.join(RAIZ, 'packages/domain/dist'));
const [ancho = '328', sexo = 'HOMBRE', familia = 'PERIMETROS', tema = 'azul-noche', salida = 'maqueta.html'] = process.argv.slice(2);
const W = Number(ancho);
const FILA = 44, RELLENO = 6, SEPARACION = 8, MARGEN = 10;
const PALETA = {
  claro: { fondo: '#E4ECF8', tarjeta: '#FFFFFF', borde: '#D6E2F3', nombre: '#334155', valor: '#1E6BF2', detalle: '#475569', pagina: '#F2F6FC' },
  'azul-noche': { fondo: '#0C2E63', tarjeta: '#1F3F70', borde: '#334F7C', nombre: '#E0E4EB', valor: '#FFFFFF', detalle: '#CED5DF', pagina: '#052238' },
}[tema];
const colores = d.COLORES_DE_LA_FIGURA[tema === 'claro' ? 'CLARO' : 'AZUL'];
const figura = d.FIGURAS_DE_LA_LAMINA[sexo].ENTERO;
const imagenArchivo = path.join(RAIZ, 'apps/mobile/assets/figura', figura.archivo).replace(/\\/g, '/');

// Una toma sintética con diferencias, para ver las filas completas.
const valores = {
  'perimetro-cuello': [38, -0.5], 'perimetro-hombros': [116, 1.2], 'perimetro-pecho': [98, 0.8], 'perimetro-brazo-relajado': [32, 0.4], 'perimetro-brazo-flexionado': [34.5, 0.6],
  'perimetro-antebrazo': [28, 0], 'perimetro-muneca': [17, 0], 'perimetro-cintura': [84, -2], 'perimetro-abdomen': [86, -1.5], 'perimetro-cadera': [98, -0.8],
  'perimetro-muslo': [56, 0.3], 'perimetro-pantorrilla': [37, 0.1], 'perimetro-tobillo': [22, 0],
  'pliegue-pectoral': [9, -1], 'pliegue-axilar-media': [11, -0.5], 'pliegue-triceps': [10, -1.2], 'pliegue-subescapular': [12, -0.8], 'pliegue-antebrazo': [5, 0],
  'pliegue-supraespinal': [8, -1.1], 'pliegue-abdominal': [15, -2.3], 'pliegue-muslo-frontal': [14, -0.6], 'pliegue-pantorrilla': [7, -0.2],
};
const unidad = (c) => (c.startsWith('pliegue') ? 'mm' : 'cm');
const num = (v) => v.toLocaleString('es-AR', { maximumFractionDigits: 1 });

const anchoDelCuerpo = W * 0.46;
const anchoDeImagen = anchoDelCuerpo / (figura.cuerpo.ancho / 100);
const altoDeImagen = (anchoDeImagen * figura.altoPx) / figura.anchoPx;
const altoDelCuerpo = (altoDeImagen * figura.cuerpo.alto) / 100;
const lugares = familia === 'PERIMETROS' ? figura.perimetros : figura.pliegues;
const claves = (familia === 'PERIMETROS' ? d.TARJETAS_DE_PERIMETROS.ENTERO : d.TARJETAS_DE_PLIEGUES.ENTERO).map((g) => g.filter((c) => valores[c] && lugares[c])).filter((g) => g.length);
const altos = claves.map((g) => g.length * FILA + 2 * RELLENO);
const necesario = altos.reduce((a, b) => a + b, 0) + (claves.length - 1) * SEPARACION + 2 * MARGEN;
const alto = Math.max(altoDelCuerpo + 2 * MARGEN, necesario);
const desplazamiento = (alto - altoDelCuerpo - 2 * MARGEN) / 2;
const centroX = W - anchoDelCuerpo / 2 - 4;
const imagen = { x: centroX - (figura.cuerpo.centroX / 100) * anchoDeImagen, y: MARGEN + desplazamiento - (figura.cuerpo.arriba / 100) * altoDeImagen, ancho: anchoDeImagen, alto: altoDeImagen };
const grupos = claves.map((g) =>
  g.map((c) => {
    if (familia === 'PERIMETROS') {
      const a = d.anilloEnLaLamina(imagen, figura.perimetros[c]);
      return { c, cx: a.cx, cy: a.cy, izq: a.cx - a.rx, anillo: { rx: a.rx, ry: Math.max(a.ry, 3) }, posterior: false };
    }
    const p = d.puntoEnLaLamina(imagen, figura.pliegues[c]);
    return { c, cx: p.cx, cy: p.cy, izq: p.cx - 7, anillo: null, posterior: d.esPliegueDeLaCaraPosterior(c) };
  }),
);
const todos = grupos.flat();
const anchoDeTarjeta = Math.max(120, Math.min(W * 0.52, Math.min(...todos.map((s) => s.izq)) - 22));
const bordes = d.apilarTarjetas(grupos.map((g, i) => ({ alto: altos[i], centroDeseado: g.reduce((n, s) => n + s.cy, 0) / g.length })), { tope: MARGEN, piso: alto - MARGEN, separacion: SEPARACION });

const abs = (x, y, w, h, extra = '') => `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}`;
const segmento = (x1, y1, x2, y2, color) => {
  const largo = Math.hypot(x2 - x1, y2 - y1);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return `<div style="${abs((x1 + x2) / 2 - largo / 2, (y1 + y2) / 2 - 0.75, largo, 1.5, `background:${color};transform:rotate(${ang}rad)`)}"></div>`;
};
let html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:${PALETA.pagina};font-family:Roboto,Arial,sans-serif"><div style="position:relative;margin:16px;width:${W}px;height:${alto}px;background:${PALETA.fondo};border-radius:12px;overflow:hidden">`;
html += `<img src="file:///${imagenArchivo}" style="${abs(imagen.x, imagen.y, imagen.ancho, imagen.alto)}">`;
for (const s of todos) {
  if (s.anillo) {
    const { rx, ry } = s.anillo;
    html += `<div style="${abs(s.cx - rx - 2, s.cy - ry - 2, 2 * rx + 4, 2 * ry + 4, `box-sizing:border-box;border-radius:${ry + 2}px;border:4px solid ${colores.anilloResplandor};opacity:.3`)}"></div>`;
    html += `<div style="${abs(s.cx - rx, s.cy - ry, 2 * rx, 2 * ry, `box-sizing:border-box;border-radius:${ry}px;border:2px solid ${colores.anilloNucleo}`)}"></div>`;
  } else {
    const aro = s.posterior ? colores.posterior : colores.puntoAro;
    const relleno = (s.posterior ? colores.posteriorFondo : colores.puntoRelleno) ?? 'transparent';
    html += `<div style="${abs(s.cx - 11, s.cy - 11, 22, 22, `border-radius:11px;background:${colores.anilloResplandor};opacity:.18`)}"></div>`;
    html += `<div style="${abs(s.cx - 7, s.cy - 7, 14, 14, `box-sizing:border-box;border-radius:7px;border:2px ${s.posterior ? 'dashed' : 'solid'} ${aro};background:${relleno}`)}"></div>`;
    html += `<div style="${abs(s.cx - 2, s.cy - 2, 4, 4, `border-radius:2px;background:${s.posterior ? colores.posterior : colores.puntoCentro}`)}"></div>`;
  }
}
grupos.forEach((g, i) =>
  g.forEach((s, fila) => {
    const y = bordes[i] + RELLENO + fila * FILA + FILA / 2;
    const quiebre = anchoDeTarjeta + 10;
    const color = s.posterior ? colores.posterior : colores.guia;
    html += segmento(anchoDeTarjeta + 2, y, quiebre, y, color) + segmento(quiebre, y, s.izq - 3, s.cy, color);
    html += `<div style="${abs(anchoDeTarjeta, y - 2.5, 5, 5, `border-radius:2.5px;background:${colores.guiaPunto}`)}"></div>`;
  }),
);
grupos.forEach((g, i) => {
  html += `<div style="${abs(MARGEN / 2, bordes[i], anchoDeTarjeta - MARGEN / 2, altos[i], `box-sizing:border-box;padding:${RELLENO}px 8px;border-radius:10px;border:1px solid ${PALETA.borde};background:${PALETA.tarjeta}`)}">`;
  for (const s of g) {
    const [v, delta] = valores[s.c];
    const signo = delta < 0 ? '−' : delta > 0 ? '+' : '';
    html += `<div style="height:${FILA}px;display:flex;flex-direction:column;justify-content:center"><div style="font-size:12px;color:${PALETA.nombre};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.ROTULO_EN_LA_LAMINA[s.c]}${s.posterior ? ' · posterior' : ''}</div><div style="white-space:nowrap;overflow:hidden"><span style="font-size:15px;font-weight:700;color:${PALETA.valor}">${num(v)} ${unidad(s.c)}</span><span style="font-size:12px;color:${PALETA.detalle}">&nbsp;&nbsp;${signo}${num(Math.abs(delta))}</span></div></div>`;
  }
  html += '</div>';
});
html += '</div></body>';
fs.writeFileSync(salida, html);
console.log(JSON.stringify({ salida, alto: Math.round(alto) }));
