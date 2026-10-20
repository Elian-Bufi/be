// Motor de láminas de la tesis: arma un SVG exacto a partir de una descripción en código (la «fuente única» de cada
// gráfico, en laminas/fuentes). Todo se dibuja en puntos tipográficos (1 unidad = 1 pt) y al tamaño final de uso, así la
// tipografía mínima de 10 pt se comprueba sobre lo que se imprime. Los colores, trazos y tamaños salen de
// estilo/tokens.json. Además del SVG devuelve una revisión: tipografía mínima, densidad, cruces de conectores, rótulos
// que se pisan y conectores que atraviesan cajas.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ancho, alturas, envolver, faltantes } from './metricas.mjs';

export const T = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../estilo/tokens.json'), 'utf8'));
const C = T.color;
const F = T.tipografia.lamina;
const E = T.espacio;

const r2 = (n) => Math.round(n * 100) / 100;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PALETA = { sistema: C.sistema, enfasis: { ...C.sistema, ...C.enfasis }, persona: C.persona, externo: C.externo, pendiente: C.pendiente, nota: C.nota };
const GUION = { continuo: null, discontinuo: T.trazo.discontinuo.join(' '), punteado: T.trazo.punteado.join(' ') };
const guionDe = (tipo) => (tipo === 'externo' ? GUION.discontinuo : tipo === 'pendiente' ? GUION.punteado : null);

// Estilos de texto (todos ≥ 10 pt).
export const TX = {
  titulo: { familia: 'Inter', peso: 600, tamano: F.titulo_de_nodo },
  texto: { familia: 'Inter', peso: 400, tamano: F.texto },
  meta: { familia: 'Inter', peso: 500, tamano: F.meta },
  id: { familia: 'JetBrains Mono', peso: 500, tamano: F.id },
  idFuerte: { familia: 'JetBrains Mono', peso: 600, tamano: F.id },
  marco: { familia: 'Inter', peso: 600, tamano: 10.5 },
  laminaTitulo: { familia: 'Inter', peso: 600, tamano: F.titulo_de_lamina },
  laminaSub: { familia: 'Inter', peso: 400, tamano: F.subtitulo_de_lamina },
};
const interlinea = (e) => e.tamano * 1.28;

export function crearLamina({ id, titulo, alcance, ancho: W, alto: H, fuente = '', estado = '', version = '' }) {
  const capas = { fondo: [], marcos: [], conectores: [], nodos: [], rotulos: [], frente: [] };
  const nodos = new Map();
  const textos = []; // { x, y, w, h, tamano, de, texto }
  const segmentos = []; // { a, b, de } de conectores
  const conectores = [];
  const glifosFaltantes = [];
  const rotulosPendientes = [];
  let defsId = 0;

  // ─── Texto ──────────────────────────────────────────────────────────────────────────────────
  function linea(capa, x, yBase, contenido, estilo, { ancla = 'start', color = C.tinta, de = null, registrar = true, halo = false } = {}) {
    const w = ancho(contenido, estilo);
    const { ascendente, descendente } = alturas(estilo);
    const x0 = ancla === 'middle' ? x - w / 2 : ancla === 'end' ? x - w : x;
    if (registrar) textos.push({ x: x0, y: yBase - ascendente, w, h: ascendente + descendente, tamano: estilo.tamano, de, texto: contenido, halo });
    const sinGlifo = faltantes(contenido, estilo);
    if (sinGlifo.length) glifosFaltantes.push(`«${sinGlifo.join(" ")}» en «${contenido}»`);
    capa.push(
      `<text x="${r2(x)}" y="${r2(yBase)}" font-family="${estilo.familia}" font-size="${estilo.tamano}" font-weight="${estilo.peso}"${estilo.cursiva ? ' font-style="italic"' : ''} fill="${color}"${ancla !== 'start' ? ` text-anchor="${ancla}"` : ''}>${esc(contenido)}</text>`,
    );
    return w;
  }
  /** Bloque de líneas con estilos distintos, centrado o alineado; devuelve el alto usado. */
  function bloque(capa, x, yTop, renglones, { ancla = 'middle', de = null } = {}) {
    let y = yTop;
    for (const r of renglones) {
      const { ascendente } = alturas(r.estilo);
      y += r.antes ?? 0;
      linea(capa, x, y + ascendente, r.texto, r.estilo, { ancla, color: r.color ?? C.tinta, de });
      y += interlinea(r.estilo);
    }
    return y - yTop;
  }
  const altoDeRenglones = (renglones) => renglones.reduce((s, r) => s + (r.antes ?? 0) + interlinea(r.estilo), 0);

  function registrarNodo(n) {
    if (nodos.has(n.id)) throw new Error(`nodo repetido: ${n.id}`);
    n.ancla = (lado, t = 0.5) => anclaDe(n, lado, t);
    nodos.set(n.id, n);
    return n;
  }
  function anclaDe(n, lado, t) {
    const { x, y, w, h } = n;
    if (lado === 'n') return { x: x + w * t, y, dir: [0, -1] };
    if (lado === 's') return { x: x + w * t, y: y + h, dir: [0, 1] };
    if (lado === 'e') return { x: x + w, y: y + h * t, dir: [1, 0] };
    if (lado === 'o') return { x, y: y + h * t, dir: [-1, 0] };
    throw new Error(`lado inválido: ${lado}`);
  }

  // ─── Renglones de una caja C4 ───────────────────────────────────────────────────────────────
  function renglonesDeCaja({ titulo: t, tipoTexto, descripcion, ancho: wTexto, idTexto }) {
    const r = [];
    if (idTexto) r.push({ texto: idTexto, estilo: TX.id, color: C.tinta_suave });
    for (const l of envolver(t, wTexto, TX.titulo)) r.push({ texto: l, estilo: TX.titulo });
    if (tipoTexto) for (const l of envolver(`[${tipoTexto}]`, wTexto, TX.meta)) r.push({ texto: l, estilo: TX.meta, color: C.tinta_suave });
    if (descripcion) {
      let primero = true;
      for (const l of envolver(descripcion, wTexto, TX.texto)) {
        r.push({ texto: l, estilo: TX.texto, antes: primero ? 4 : 0 });
        primero = false;
      }
    }
    return r;
  }

  const api = {
    id,
    T,
    TX,
    nodos,
    /** Caja C4 (contenedor, sistema, externo o pendiente). `w` fijo; el alto sale del contenido salvo `h`. */
    caja({ id: nid, x, y, w, h, tipo = 'sistema', titulo: t, tecnologia, descripcion, idTexto, enfasis = false, etiqueta }) {
      const p = PALETA[enfasis ? 'enfasis' : tipo] ?? PALETA.sistema;
      const wTexto = w - 2 * E.relleno_x;
      const ren = renglonesDeCaja({ titulo: t, tipoTexto: tecnologia, descripcion, ancho: wTexto, idTexto });
      const alto = h ?? altoDeRenglones(ren) + 2 * E.relleno_y + 4;
      const n = registrarNodo({ id: nid, x, y, w, h: alto, tipo, rect: true });
      const g = guionDe(tipo);
      capas.nodos.push(
        `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(alto)}" rx="${E.radio_contenedor}" fill="${p.relleno}" stroke="${p.trazo}" stroke-width="${enfasis ? T.trazo.enfasis : T.trazo.nodo}"${g ? ` stroke-dasharray="${g}"` : ''}/>`,
      );
      const hTexto = altoDeRenglones(ren);
      bloque(capas.nodos, x + w / 2, y + (alto - hTexto) / 2, ren, { de: nid });
      if (etiqueta) api.etiquetaDeEstado(nid, etiqueta, tipo);
      return n;
    },
    /** Marca corta en el borde superior derecho de un nodo («pendiente», «externo», «v1»…). */
    etiquetaDeEstado(nid, texto, tipo = 'pendiente') {
      const n = nodos.get(nid);
      const p = PALETA[tipo] ?? PALETA.nota;
      const w = ancho(texto, TX.meta) + 10;
      const x = n.x + n.w - w - 6;
      const y = n.y - 8;
      capas.frente.push(`<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="16" rx="8" fill="${C.papel}" stroke="${p.trazo}" stroke-width="1"/>`);
      linea(capas.frente, x + w / 2, y + 11.6, texto, TX.meta, { ancla: 'middle', color: p.texto ?? p.trazo, de: nid, halo: true });
    },
    /** Persona C4: cabeza y cuerpo, con nombre y descripción dentro del cuerpo. */
    persona({ id: nid, x, y, w, titulo: t, descripcion, tecnologia = 'Persona' }) {
      const p = PALETA.persona;
      const wTexto = w - 2 * E.relleno_x;
      const ren = renglonesDeCaja({ titulo: t, tipoTexto: tecnologia, descripcion, ancho: wTexto });
      const radio = 13;
      const cuerpo = altoDeRenglones(ren) + 2 * E.relleno_y + 8;
      const yCuerpo = y + radio * 2 - 5;
      const n = registrarNodo({ id: nid, x, y, w, h: yCuerpo - y + cuerpo, tipo: 'persona', rect: true });
      capas.nodos.push(
        `<rect x="${r2(x)}" y="${r2(yCuerpo)}" width="${r2(w)}" height="${r2(cuerpo)}" rx="16" fill="${p.relleno}" stroke="${p.trazo}" stroke-width="${T.trazo.nodo}"/>`,
        `<circle cx="${r2(x + w / 2)}" cy="${r2(y + radio)}" r="${radio}" fill="${p.relleno}" stroke="${p.trazo}" stroke-width="${T.trazo.nodo}"/>`,
      );
      bloque(capas.nodos, x + w / 2, yCuerpo + 8 + (cuerpo - 8 - altoDeRenglones(ren)) / 2, ren, { de: nid });
      return n;
    },
    /** Base de datos (cilindro). */
    cilindro({ id: nid, x, y, w, titulo: t, tecnologia, descripcion, tipo = 'sistema' }) {
      const p = PALETA[tipo];
      const ry = 7;
      const wTexto = w - 2 * E.relleno_x;
      const ren = renglonesDeCaja({ titulo: t, tipoTexto: tecnologia, descripcion, ancho: wTexto });
      const alto = altoDeRenglones(ren) + 2 * E.relleno_y + 2 * ry + 4;
      const n = registrarNodo({ id: nid, x, y, w, h: alto, tipo, rect: true });
      const g = guionDe(tipo);
      const trazo = `stroke="${p.trazo}" stroke-width="${T.trazo.nodo}"${g ? ` stroke-dasharray="${g}"` : ''}`;
      capas.nodos.push(
        `<path d="M ${r2(x)} ${r2(y + ry)} L ${r2(x)} ${r2(y + alto - ry)} A ${r2(w / 2)} ${ry} 0 0 0 ${r2(x + w)} ${r2(y + alto - ry)} L ${r2(x + w)} ${r2(y + ry)}" fill="${p.relleno}" ${trazo}/>`,
        `<ellipse cx="${r2(x + w / 2)}" cy="${r2(y + ry)}" rx="${r2(w / 2)}" ry="${ry}" fill="${p.relleno}" ${trazo}/>`,
      );
      bloque(capas.nodos, x + w / 2, y + 2 * ry + (alto - 2 * ry - altoDeRenglones(ren)) / 2, ren, { de: nid });
      return n;
    },
    /** Límite o agrupación con título arriba a la izquierda. No es un nodo conectable. */
    marco({ id: nid, x, y, w, h, titulo: t, subtitulo, tipo = 'sistema', relleno = C.fondo_suave }) {
      const p = PALETA[tipo] ?? PALETA.sistema;
      const g = guionDe(tipo);
      capas.marcos.push(
        `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${E.radio_contenedor + 2}" fill="${relleno}" stroke="${tipo === 'sistema' ? C.tinta_suave : p.trazo}" stroke-width="${T.trazo.marco}"${g ? ` stroke-dasharray="${g}"` : ''}/>`,
      );
      const anchoT = linea(capas.marcos, x + 10, y + 16, t, TX.marco, { color: C.tinta, de: nid });
      if (subtitulo) linea(capas.marcos, x + 10 + anchoT + 6, y + 16, `[${subtitulo}]`, TX.meta, { color: C.tinta_suave, de: nid });
      nodos.set(nid, { id: nid, x, y, w, h, marco: true });
    },
    /** Nota con esquina doblada. */
    nota({ id: nid = `nota-${nodos.size}`, x, y, w, texto, titulo: t }) {
      const p = PALETA.nota;
      const wTexto = w - 2 * E.relleno_x;
      const ren = [];
      if (t) ren.push({ texto: t, estilo: { ...TX.meta, peso: 600 }, color: C.tinta });
      for (const l of envolver(texto, wTexto, TX.texto)) ren.push({ texto: l, estilo: TX.texto, color: C.tinta_suave });
      const alto = altoDeRenglones(ren) + 2 * E.relleno_y;
      const d = 9;
      registrarNodo({ id: nid, x, y, w, h: alto, tipo: 'nota', rect: true });
      capas.nodos.push(
        `<path d="M ${r2(x)} ${r2(y)} L ${r2(x + w - d)} ${r2(y)} L ${r2(x + w)} ${r2(y + d)} L ${r2(x + w)} ${r2(y + alto)} L ${r2(x)} ${r2(y + alto)} Z" fill="${p.relleno}" stroke="${p.trazo}" stroke-width="1"/>`,
        `<path d="M ${r2(x + w - d)} ${r2(y)} L ${r2(x + w - d)} ${r2(y + d)} L ${r2(x + w)} ${r2(y + d)}" fill="none" stroke="${p.trazo}" stroke-width="1"/>`,
      );
      bloque(capas.nodos, x + E.relleno_x, y + E.relleno_y, ren, { ancla: 'start', de: nid });
      return alto;
    },
    /**
     * Entidad del DER (nivel lógico): cabecera con el nombre y filas «clave · atributo · tipo».
     * filas: [{ clave: 'PK'|'FK'|'PK·FK'|'UK'|'', nombre, tipo, opcional }]. tipo 'referida' = de otra vista (atenuada).
     */
    entidad({ id: nid, x, y, w, nombre, filas, omitidos = 0, tipo = 'sistema', enfasis = false, marca }) {
      const p = tipo === 'referida' ? { trazo: C.nota.trazo, relleno: C.papel, cabecera: C.fondo_suave } : PALETA[enfasis ? 'enfasis' : 'sistema'];
      const cab = 22;
      const fila = 15.5;
      const alto = cab + (filas.length + (omitidos ? 1 : 0)) * fila + 5;
      const n = registrarNodo({ id: nid, x, y, w, h: alto, tipo: 'entidad', rect: true, filas: filas.map((f) => f.nombre), cab, fila });
      const g = tipo === 'referida' ? GUION.discontinuo : null;
      capas.nodos.push(
        `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(alto)}" rx="${E.radio_entidad}" fill="${tipo === 'referida' ? p.relleno : C.papel}" stroke="${p.trazo}" stroke-width="${enfasis ? T.trazo.enfasis : T.trazo.nodo}"${g ? ` stroke-dasharray="${g}"` : ''}/>`,
        `<path d="M ${r2(x + 0.6)} ${r2(y + cab)} L ${r2(x + 0.6)} ${r2(y + E.radio_entidad)} Q ${r2(x + 0.6)} ${r2(y + 0.6)} ${r2(x + E.radio_entidad)} ${r2(y + 0.6)} L ${r2(x + w - E.radio_entidad)} ${r2(y + 0.6)} Q ${r2(x + w - 0.6)} ${r2(y + 0.6)} ${r2(x + w - 0.6)} ${r2(y + E.radio_entidad)} L ${r2(x + w - 0.6)} ${r2(y + cab)} Z" fill="${p.cabecera ?? C.sistema.cabecera}"/>`,
        `<line x1="${r2(x)}" y1="${r2(y + cab)}" x2="${r2(x + w)}" y2="${r2(y + cab)}" stroke="${p.trazo}" stroke-width="0.8"/>`,
      );
      linea(capas.nodos, x + 8, y + 15.2, nombre, { ...TX.titulo, tamano: 10.5 }, { color: tipo === 'referida' ? C.tinta_suave : C.tinta, de: nid });
      if (marca) {
        const wm = ancho(marca, TX.meta);
        linea(capas.nodos, x + w - 8, y + 15.2, marca, TX.meta, { ancla: 'end', color: C.tinta_suave, de: nid });
        if (wm + ancho(nombre, { ...TX.titulo, tamano: 10.5 }) + 22 > w) n.desborde = `${nombre}: cabecera con marca demasiado ancha`;
      }
      filas.forEach((f, i) => {
        const yb = y + cab + i * fila + 11.6 + 2;
        if (f.clave) linea(capas.nodos, x + 7, yb, f.clave, TX.idFuerte, { color: f.clave.includes('PK') ? C.sistema.trazo : C.tinta_suave, de: nid });
        linea(capas.nodos, x + 46, yb, f.nulo ?? '*', TX.id, { color: C.tinta_suave, de: nid });
        const xNombre = x + 58;
        const estiloNombre = { ...TX.texto, peso: f.clave?.includes('PK') ? 600 : 400 };
        linea(capas.nodos, xNombre, yb, f.nombre, estiloNombre, { color: C.tinta, de: nid });
        if (f.externo) linea(capas.nodos, x + w - 7, yb, '↗', TX.meta, { ancla: 'end', color: C.tinta_suave, de: nid });
        const wf = 58 + ancho(f.nombre, estiloNombre) + (f.externo ? 8 + ancho('↗', TX.meta) : 0) + 7;
        if (wf > w) n.desborde = `${nombre}.${f.nombre}: la fila no entra (${Math.ceil(wf)} > ${w})`;
      });
      if (omitidos) {
        const yb = y + cab + filas.length * fila + 11.6 + 2;
        linea(capas.nodos, x + 58, yb, `+ ${omitidos} atributo${omitidos === 1 ? '' : 's'} más`, { ...TX.texto, cursiva: true }, { color: C.tinta_suave, de: nid });
        const wf = 58 + ancho(`+ ${omitidos} atributos más`, { ...TX.texto, cursiva: true }) + 7;
        if (wf > w) n.desborde = `${nombre}: la fila de omitidos no entra (${Math.ceil(wf)} > ${w})`;
      }
      const anchoCab = 16 + ancho(nombre, { ...TX.titulo, tamano: 10.5 }) + (marca ? 8 + ancho(marca, TX.meta) : 0);
      if (anchoCab > w) n.desborde = `${nombre}: la cabecera no entra (${Math.ceil(anchoCab)} > ${w})`;
      n.anclaFila = (campo, lado) => {
        const i = filas.findIndex((f) => f.nombre === campo);
        if (i < 0) throw new Error(`${nombre} no tiene la fila ${campo}`);
        return { x: lado === 'e' ? x + w : x, y: y + cab + i * fila + fila / 2 + 2, dir: lado === 'e' ? [1, 0] : [-1, 0] };
      };
      return n;
    },

    /**
     * Conector. de/a: id de nodo; lado/ladoA: n, s, e, o; t/tA: posición sobre el lado (0..1).
     * campo/campoA: fila de una entidad (el lado debe ser e u o). ruta: 'orto' (por defecto) o 'recta'.
     * via: puntos intermedios explícitos. medio: coordenada del tramo intermedio de una Z.
     * inicio/fin: puntas (flecha, flecha_llena, triangulo, rombo, rombo_lleno, uno, cero_o_uno, uno_o_muchos, cero_o_muchos).
     * etiqueta: { texto, tecnologia, segmento ('mayor' o índice), pos (0..1), lado (arriba, abajo, izq, der), dx, dy }.
     */
    conector({ de, lado, t = 0.5, campo, a, ladoA, tA = 0.5, campoA, ruta = 'orto', via, medio, estilo = 'continuo', inicio, fin = 'flecha', etiqueta, color = C.linea, ancho: grosor = T.trazo.conector }) {
      const nA = nodos.get(de);
      const nB = nodos.get(a);
      if (!nA || !nB) throw new Error(`conector con nodo inexistente: ${de} → ${a}`);
      const p0 = campo ? nA.anclaFila(campo, lado) : anclaDe(nA, lado, t);
      const p3 = campoA ? nB.anclaFila(campoA, ladoA) : anclaDe(nB, ladoA, tA);
      let pts;
      if (via) pts = [p0, ...via.map(([x, y]) => ({ x, y })), p3];
      else if (ruta === 'recta') pts = [p0, p3];
      else {
        const hA = p0.dir[1] === 0;
        const hB = p3.dir[1] === 0;
        if (hA && hB) {
          const xm = medio ?? (p0.x + p3.x) / 2;
          pts = Math.abs(p0.y - p3.y) < 0.01 ? [p0, p3] : [p0, { x: xm, y: p0.y }, { x: xm, y: p3.y }, p3];
        } else if (!hA && !hB) {
          const ym = medio ?? (p0.y + p3.y) / 2;
          pts = Math.abs(p0.x - p3.x) < 0.01 ? [p0, p3] : [p0, { x: p0.x, y: ym }, { x: p3.x, y: ym }, p3];
        } else if (hA) pts = [p0, { x: p3.x, y: p0.y }, p3];
        else pts = [p0, { x: p0.x, y: p3.y }, p3];
      }
      pts = simplificar(pts);
      // El trazo se acorta donde hay una punta que ocupa el extremo (flechas y triángulos).
      const recorte = { flecha: 0, flecha_llena: 6, triangulo: 10, rombo: 12, rombo_lleno: 12 };
      const dibujo = pts.map((p) => ({ ...p }));
      if (fin && recorte[fin]) acortar(dibujo, dibujo.length - 1, recorte[fin]);
      if (inicio && recorte[inicio]) acortar(dibujo, 0, recorte[inicio]);
      const g = GUION[estilo];
      capas.conectores.push(`<path d="${caminoRedondeado(dibujo, 5)}" fill="none" stroke="${color}" stroke-width="${grosor}"${g ? ` stroke-dasharray="${g}"` : ''} stroke-linejoin="round"/>`);
      const nIndex = conectores.length;
      for (let i = 0; i < pts.length - 1; i++) segmentos.push({ a: pts[i], b: pts[i + 1], de: nIndex, nodos: [de, a] });
      if (fin) capas.conectores.push(punta(fin, pts[pts.length - 1], dir(pts[pts.length - 2], pts[pts.length - 1]), color));
      if (inicio) capas.conectores.push(punta(inicio, pts[0], dir(pts[1], pts[0]), color));
      if (etiqueta) rotularConector(pts, etiqueta, nIndex);
      conectores.push({ de, a, pts });
      return pts;
    },

    /** Leyenda con muestras reales. items: [{ muestra, texto }]. Devuelve el alto. */
    leyenda({ x, y, w, items, titulo: t = 'Referencias', columnas = 1 }) {
      const filasPorCol = Math.ceil(items.length / columnas);
      const cabecera = t ? 26 : 6;
      const alto = cabecera + filasPorCol * 19 + (t ? 4 : 2);
      // Columnas con el ancho de su texto más largo, repartiendo el sobrante en partes iguales.
      const anchosTexto = Array.from({ length: columnas }, (_, c) => Math.max(...items.slice(c * filasPorCol, (c + 1) * filasPorCol).map((it) => ancho(it.texto, TX.texto)), 0));
      const necesario = anchosTexto.reduce((s, a) => s + 38 + a, 0);
      const extra = Math.max(0, (w - 20 - necesario) / columnas);
      if (necesario > w - 20) textos.push({ x, y, w: 1, h: 1, tamano: 0, de: 'leyenda-desborde', texto: 'leyenda más ancha que su caja' });
      capas.marcos.push(`<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(alto)}" rx="5" fill="${C.papel}" stroke="${C.borde_suave}" stroke-width="1"/>`);
      if (t) linea(capas.marcos, x + 10, y + 16, t, { ...TX.meta, peso: 600 }, { color: C.tinta, de: 'leyenda' });
      let xCol = x + 10;
      for (let c = 0; c < columnas; c++) {
        items.slice(c * filasPorCol, (c + 1) * filasPorCol).forEach((it, fil) => {
          const yi = y + cabecera + fil * 19;
          capas.marcos.push(muestra(it.muestra, xCol, yi, 30, 13));
          linea(capas.marcos, xCol + 38, yi + 10.5, it.texto, TX.texto, { color: C.tinta, de: 'leyenda' });
        });
        xCol += 38 + anchosTexto[c] + extra;
      }
      return alto;
    },

    /**
     * Actor UML (figura de palo) con su nombre debajo. (cx, y) es el centro superior de la figura.
     * tipo: persona (BE), externo (sistema externo como actor secundario) o pendiente (rol previsto, no implementado).
     */
    actor({ id: nid, cx, y, nombre, tipo = 'persona', anchoTexto = 96, escala: s = 1 }) {
      const p = tipo === 'persona' ? { trazo: C.persona.trazo } : PALETA[tipo];
      const g = guionDe(tipo);
      const sw = `stroke="${p.trazo}" stroke-width="1.6" fill="none" stroke-linecap="round"${g ? ` stroke-dasharray="${g}"` : ''}`;
      const Y = (v) => r2(y + v * s);
      const X = (v) => r2(cx + v * s);
      capas.nodos.push(
        `<circle cx="${r2(cx)}" cy="${Y(7)}" r="${r2(7 * s)}" fill="${tipo === 'persona' ? C.persona.relleno : C.papel}" stroke="${p.trazo}" stroke-width="1.6"${g ? ` stroke-dasharray="${g}"` : ''}/>`,
        `<path d="M ${X(0)} ${Y(14)} L ${X(0)} ${Y(34)} M ${X(-12)} ${Y(21)} L ${X(12)} ${Y(21)} M ${X(0)} ${Y(34)} L ${X(-10)} ${Y(48)} M ${X(0)} ${Y(34)} L ${X(10)} ${Y(48)}" ${sw}/>`,
      );
      const lineas = envolver(nombre, anchoTexto, TX.titulo);
      const wTexto = Math.max(...lineas.map((l) => ancho(l, TX.titulo)));
      const base = y + 48 * s + 16;
      // Fondo blanco detrás del nombre, como un solo bloque: una asociación que pasa por debajo no atraviesa el texto.
      {
        const { ascendente, descendente } = alturas(TX.titulo);
        const y0 = base - ascendente - 2;
        const alto = (lineas.length - 1) * interlinea(TX.titulo) + ascendente + descendente + 4;
        capas.frente.push('<rect x="' + r2(cx - wTexto / 2 - 3) + '" y="' + r2(y0) + '" width="' + r2(wTexto + 6) + '" height="' + r2(alto) + '" rx="2" fill="' + C.papel + '"/>');
      }
      lineas.forEach((l, i) => linea(capas.frente, cx, base + i * interlinea(TX.titulo), l, TX.titulo, { ancla: 'middle', color: C.tinta, de: nid, halo: true }));
      const w = Math.max(28 * s, wTexto);
      return registrarNodo({ id: nid, x: cx - w / 2, y, w, h: 48 * s + 6 + lineas.length * interlinea(TX.titulo), tipo: 'actor', rect: true, forma: 'actor', centro: { x: cx, y: y + 24 * s }, radio: 18 * s });
    },
    /** Caso de uso: elipse con el identificador y un rótulo corto (2 a 4 palabras, LEG-01). (cx, cy) = centro. */
    casoDeUso({ id: nid, cx, cy, w, idTexto, titulo: t, tipo = 'sistema', enfasis = false }) {
      const p = PALETA[enfasis ? 'enfasis' : tipo] ?? PALETA.sistema;
      const wTexto = w * 0.8;
      const ren = [];
      if (idTexto) ren.push({ texto: idTexto, estilo: TX.idFuerte, color: tipo === 'pendiente' ? C.pendiente.texto : C.sistema.trazo });
      for (const l of envolver(t, wTexto, TX.texto)) ren.push({ texto: l, estilo: TX.texto, color: C.tinta });
      const hTexto = altoDeRenglones(ren);
      // Elipse que contiene el rectángulo del texto: b = (h/2) / sqrt(1 - (wt/2)²/a²).
      const a = w / 2;
      const anchoReal = Math.max(...ren.map((r) => ancho(r.texto, r.estilo)));
      const b = Math.max(17, a / 3.6, (hTexto / 2 + 3) / Math.sqrt(Math.max(0.2, 1 - ((anchoReal / 2 + 4) / a) ** 2)));
      const g = guionDe(tipo);
      capas.nodos.push(`<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(a)}" ry="${r2(b)}" fill="${p.relleno}" stroke="${p.trazo}" stroke-width="${enfasis ? T.trazo.enfasis : T.trazo.nodo}"${g ? ` stroke-dasharray="${g}"` : ''}/>`);
      bloque(capas.nodos, cx, cy - hTexto / 2, ren, { de: nid });
      const n = registrarNodo({ id: nid, x: cx - a, y: cy - b, w: 2 * a, h: 2 * b, tipo, rect: true, forma: 'elipse', centro: { x: cx, y: cy } });
      if (anchoReal > 2 * a * 0.86) n.desborde = `${nid}: el texto no entra en la elipse`;
      if ((2 * a) / (2 * b) > 4) n.desborde = `${nid}: elipse con relación de aspecto mayor que 4:1 (LEG-05)`;
      return n;
    },
    /** Paquete UML (carpeta con solapa) con su título en la solapa; funciona como marco, no como nodo conectable. */
    paquete({ id: nid, x, y, w, h, titulo: t, tipo = 'sistema', subtitulo }) {
      const p = PALETA[tipo] ?? PALETA.sistema;
      const g = guionDe(tipo);
      const wSolapa = ancho(t, TX.marco) + 18;
      const s = `stroke="${tipo === 'sistema' ? C.sistema.trazo : p.trazo}" stroke-width="1.1"${g ? ` stroke-dasharray="${g}"` : ''}`;
      capas.marcos.push(
        `<path d="M ${r2(x)} ${r2(y + 17)} L ${r2(x)} ${r2(y + 3)} Q ${r2(x)} ${r2(y)} ${r2(x + 3)} ${r2(y)} L ${r2(x + wSolapa - 3)} ${r2(y)} Q ${r2(x + wSolapa)} ${r2(y)} ${r2(x + wSolapa)} ${r2(y + 3)} L ${r2(x + wSolapa)} ${r2(y + 17)}" fill="${tipo === 'sistema' ? C.sistema.cabecera : p.relleno}" ${s}/>`,
        `<rect x="${r2(x)}" y="${r2(y + 17)}" width="${r2(w)}" height="${r2(h - 17)}" rx="3" fill="${C.papel}" ${s}/>`,
      );
      linea(capas.marcos, x + 9, y + 13, t, TX.marco, { color: tipo === 'pendiente' ? C.pendiente.texto : C.tinta, de: nid });
      if (subtitulo) linea(capas.marcos, x + w - 8, y + 31, subtitulo, TX.meta, { ancla: 'end', color: C.tinta_suave, de: nid });
      const n = { id: nid, x, y, w, h, marco: true, paquete: true };
      nodos.set(nid, n);
      return n;
    },
    /**
     * Relación recta entre los centros de dos nodos, recortada en el borde de cada forma (elipse, actor o caja).
     * estilo: continuo o discontinuo; fin/inicio: puntas; palabra: «include», «extend» u otra palabra clave.
     */
    relacion({ de, a, estilo = 'continuo', fin = null, inicio = null, palabra, etiqueta, color = C.linea, desplazamiento = 0, rotulo = {}, extremoDe, extremoA, angDe, angA }) {
      const nA = nodos.get(de);
      const nB = nodos.get(a);
      if (!nA || !nB) throw new Error(`relación con nodo inexistente: ${de} → ${a}`);
      const cA = nA.centro ?? { x: nA.x + nA.w / 2, y: nA.y + nA.h / 2 };
      const cB = nB.centro ?? { x: nB.x + nB.w / 2, y: nB.y + nB.h / 2 };
      const [ux, uy] = dir(cA, cB);
      const off = { x: -uy * desplazamiento, y: ux * desplazamiento };
      // Un extremo fijo (e, o, n, s) usa el punto extremo de la forma; si no, se recorta la recta entre centros.
      const extremo = (n, lado) => ({ e: { x: n.x + n.w, y: n.y + n.h / 2 }, o: { x: n.x, y: n.y + n.h / 2 }, n: { x: n.x + n.w / 2, y: n.y }, s: { x: n.x + n.w / 2, y: n.y + n.h } })[lado];
      const enElipse = (n, grados) => ({ x: n.x + n.w / 2 + (n.w / 2) * Math.cos((grados * Math.PI) / 180), y: n.y + n.h / 2 + (n.h / 2) * Math.sin((grados * Math.PI) / 180) });
      const qA = angDe !== undefined && nA.forma === 'elipse' ? enElipse(nA, angDe) : extremoDe ? extremo(nA, extremoDe) : null;
      const qB = angA !== undefined && nB.forma === 'elipse' ? enElipse(nB, angA) : extremoA ? extremo(nB, extremoA) : null;
      const p0 = qA ?? recortar(nA, { x: cA.x + off.x, y: cA.y + off.y }, qB ?? { x: cB.x + off.x, y: cB.y + off.y });
      const p3 = qB ?? recortar(nB, { x: cB.x + off.x, y: cB.y + off.y }, qA ?? { x: cA.x + off.x, y: cA.y + off.y });
      const pts = [p0, p3];
      const dibujo = pts.map((p) => ({ ...p }));
      const recorte = { triangulo: 10, flecha_llena: 6 };
      if (fin && recorte[fin]) acortar(dibujo, 1, recorte[fin]);
      if (inicio && recorte[inicio]) acortar(dibujo, 0, recorte[inicio]);
      const g = GUION[estilo];
      capas.conectores.push(`<path d="M ${r2(dibujo[0].x)} ${r2(dibujo[0].y)} L ${r2(dibujo[1].x)} ${r2(dibujo[1].y)}" fill="none" stroke="${color}" stroke-width="${T.trazo.conector}"${g ? ` stroke-dasharray="${g}"` : ''}/>`);
      const nIndex = conectores.length;
      segmentos.push({ a: p0, b: p3, de: nIndex, nodos: [de, a] });
      if (fin) capas.conectores.push(punta(fin, p3, dir(p0, p3), color));
      if (inicio) capas.conectores.push(punta(inicio, p0, dir(p3, p0), color));
      const texto = palabra ? `«${palabra}»` : etiqueta;
      if (texto) {
        const horizontal = Math.abs(p3.y - p0.y) < Math.abs(p3.x - p0.x);
        rotularConector(pts, { texto: [texto], lado: horizontal ? 'arriba' : 'der', pos: 0.5, auto: true, ...rotulo }, nIndex);
      }
      conectores.push({ de, a, pts });
      return pts;
    },

    /** Alto que tendrá una caja C4 con ese contenido, sin dibujarla (para centrarla antes de crearla). */
    altoDeCaja({ w, titulo: t, tecnologia, descripcion, idTexto }) {
      return altoDeRenglones(renglonesDeCaja({ titulo: t, tipoTexto: tecnologia, descripcion, ancho: w - 2 * E.relleno_x, idTexto })) + 2 * E.relleno_y + 4;
    },
    /** Posición relativa (0..1) de una coordenada sobre el lado vertical u horizontal de un nodo, para alinear anclas. */
    t(nid, valor, eje = 'y') {
      const n = nodos.get(nid);
      return eje === 'y' ? (valor - n.y) / n.h : (valor - n.x) / n.w;
    },
    /** Centro vertical u horizontal de un nodo. */
    centro(nid, eje = 'y') {
      const n = nodos.get(nid);
      return eje === 'y' ? n.y + n.h / 2 : n.x + n.w / 2;
    },

    /** Texto libre (por ejemplo, una aclaración junto a un grupo). */
    texto({ x, y, texto: tx, estilo = TX.texto, color = C.tinta_suave, ancla = 'start', ancho: wMax, de = null }) {
      const lineas = wMax ? envolver(tx, wMax, estilo) : [tx];
      const dueno = de ?? `texto-${textos.length}`;
      lineas.forEach((l, i) => linea(capas.rotulos, x, y + i * interlinea(estilo), l, estilo, { ancla, color, de: dueno }));
      return lineas.length * interlinea(estilo);
    },

    /** Arma el SVG y la revisión. */
    render() {
      ubicarRotulosAutomaticos();
      const revision = revisar();
      const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}pt" height="${H}pt" viewBox="0 0 ${W} ${H}" data-lamina="${esc(id)}">`,
        `<title>${esc(titulo ?? id)}</title>`,
        alcance ? `<desc>${esc(alcance)}${fuente ? ` · Fuente: ${esc(fuente)}` : ''}${version ? ` · Versión: ${esc(version)}` : ''}${estado ? ` · Estado: ${esc(estado)}` : ''}</desc>` : '',
        `<rect x="0" y="0" width="${W}" height="${H}" fill="${C.papel}"/>`,
        ...capas.fondo,
        ...capas.marcos,
        ...capas.conectores,
        ...capas.nodos,
        ...capas.rotulos,
        ...capas.frente,
        '</svg>',
      ].join('\n');
      return { svg, revision };
    },
  };

  // ─── Geometría de conectores ───────────────────────────────────────────────────────────────
  function simplificar(pts) {
    const r = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      const q = r[r.length - 1];
      if (Math.abs(p.x - q.x) < 0.01 && Math.abs(p.y - q.y) < 0.01) continue;
      if (r.length >= 2) {
        const o = r[r.length - 2];
        const colineal = (Math.abs(o.x - q.x) < 0.01 && Math.abs(q.x - p.x) < 0.01) || (Math.abs(o.y - q.y) < 0.01 && Math.abs(q.y - p.y) < 0.01);
        if (colineal) r[r.length - 1] = p;
        else r.push(p);
      } else r.push(p);
    }
    return r;
  }
  function dir(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }
  /** Punto del borde de un nodo sobre la recta que va de `desde` (dentro del nodo) hacia `hacia`. */
  function recortar(n, desde, hacia) {
    const [ux, uy] = dir(desde, hacia);
    if (n.forma === 'elipse') {
      const a = n.w / 2;
      const b = n.h / 2;
      const cx = n.x + a;
      const cy = n.y + b;
      // Intersección de la recta desde el centro con la elipse.
      const dx = desde.x - cx;
      const dy = desde.y - cy;
      const A = (ux * ux) / (a * a) + (uy * uy) / (b * b);
      const B = 2 * ((dx * ux) / (a * a) + (dy * uy) / (b * b));
      const Cc = (dx * dx) / (a * a) + (dy * dy) / (b * b) - 1;
      const t = (-B + Math.sqrt(Math.max(0, B * B - 4 * A * Cc))) / (2 * A);
      return { x: desde.x + ux * t, y: desde.y + uy * t };
    }
    if (n.forma === 'actor') return { x: desde.x + ux * n.radio, y: desde.y + uy * n.radio };
    // Caja: salir por el borde del rectángulo.
    const tx = ux > 0 ? (n.x + n.w - desde.x) / ux : ux < 0 ? (n.x - desde.x) / ux : Infinity;
    const ty = uy > 0 ? (n.y + n.h - desde.y) / uy : uy < 0 ? (n.y - desde.y) / uy : Infinity;
    const t = Math.min(tx, ty);
    return { x: desde.x + ux * t, y: desde.y + uy * t };
  }
  function acortar(pts, i, d) {
    const j = i === 0 ? 1 : i - 1;
    const [ux, uy] = dir(pts[j], pts[i]);
    pts[i] = { ...pts[i], x: pts[i].x - ux * d, y: pts[i].y - uy * d };
  }
  function caminoRedondeado(pts, radio) {
    let d = `M ${r2(pts[0].x)} ${r2(pts[0].y)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const c = pts[i + 1];
      const l1 = Math.hypot(b.x - a.x, b.y - a.y);
      const l2 = Math.hypot(c.x - b.x, c.y - b.y);
      const r = Math.min(radio, l1 / 2, l2 / 2);
      const [u1x, u1y] = dir(a, b);
      const [u2x, u2y] = dir(b, c);
      d += ` L ${r2(b.x - u1x * r)} ${r2(b.y - u1y * r)} Q ${r2(b.x)} ${r2(b.y)} ${r2(b.x + u2x * r)} ${r2(b.y + u2y * r)}`;
    }
    const z = pts[pts.length - 1];
    return `${d} L ${r2(z.x)} ${r2(z.y)}`;
  }
  /** Punta en el punto p, con la dirección d de llegada (unitaria). */
  function punta(tipo, p, d, color) {
    const [ux, uy] = d;
    const [nx, ny] = [-uy, ux];
    const P = (a, b) => `${r2(p.x - ux * a + nx * b)} ${r2(p.y - uy * a + ny * b)}`;
    const L = E.punta;
    switch (tipo) {
      case 'flecha':
        return `<path d="M ${P(L, L * 0.48)} L ${P(0, 0)} L ${P(L, -L * 0.48)}" fill="none" stroke="${color}" stroke-width="${T.trazo.conector}" stroke-linejoin="round" stroke-linecap="round"/>`;
      case 'flecha_llena':
        return `<path d="M ${P(0, 0)} L ${P(L + 1, (L + 1) * 0.45)} L ${P(L + 1, -(L + 1) * 0.45)} Z" fill="${color}"/>`;
      case 'triangulo':
        return `<path d="M ${P(0, 0)} L ${P(10, 6)} L ${P(10, -6)} Z" fill="${C.papel}" stroke="${color}" stroke-width="${T.trazo.conector}" stroke-linejoin="round"/>`;
      case 'rombo':
      case 'rombo_lleno':
        return `<path d="M ${P(0, 0)} L ${P(6, 4)} L ${P(12, 0)} L ${P(6, -4)} Z" fill="${tipo === 'rombo' ? C.papel : color}" stroke="${color}" stroke-width="${T.trazo.conector}" stroke-linejoin="round"/>`;
      default:
        return pataDeGallo(tipo, P, color);
    }
  }
  /** Notación de pata de gallo: el símbolo interno (junto a la entidad) es el máximo; el externo, el mínimo. */
  function pataDeGallo(tipo, P, color) {
    const sw = `stroke="${color}" stroke-width="${T.trazo.conector}" fill="none" stroke-linecap="round"`;
    const barra = (a) => `<path d="M ${P(a, 5.5)} L ${P(a, -5.5)}" ${sw}/>`;
    const circulo = (a) => {
      const c = P(a, 0).split(' ').map(Number);
      return `<circle cx="${c[0]}" cy="${c[1]}" r="3.4" fill="${C.papel}" stroke="${color}" stroke-width="${T.trazo.conector}"/>`;
    };
    const pata = `<path d="M ${P(0, 6)} L ${P(10, 0)} L ${P(0, -6)} M ${P(0, 0)} L ${P(10, 0)}" ${sw}/>`;
    switch (tipo) {
      case 'uno':
        return barra(5) + barra(9.5);
      case 'cero_o_uno':
        return barra(5) + circulo(12.5);
      case 'uno_o_muchos':
        return pata + barra(13.5);
      case 'cero_o_muchos':
        return pata + circulo(15);
      default:
        throw new Error(`punta desconocida: ${tipo}`);
    }
  }
  function rotularConector(pts, et, nIndex) {
    if (et.auto) {
      rotulosPendientes.push({ pts, et, nIndex });
      return;
    }
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) segs.push({ i, a: pts[i], b: pts[i + 1], l: Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y) });
    const s = et.segmento === undefined || et.segmento === 'mayor' ? segs.reduce((m, x) => (x.l > m.l ? x : m)) : segs[et.segmento];
    const pos = et.pos ?? 0.5;
    const px = s.a.x + (s.b.x - s.a.x) * pos + (et.dx ?? 0);
    const py = s.a.y + (s.b.y - s.a.y) * pos + (et.dy ?? 0);
    const horizontal = Math.abs(s.a.y - s.b.y) < 0.01;
    const lado = et.lado ?? (horizontal ? 'arriba' : 'der');
    const ren = [];
    for (const l of [].concat(et.texto ?? [])) ren.push({ texto: l, estilo: TX.texto, color: C.tinta });
    if (et.tecnologia) ren.push({ texto: `[${et.tecnologia}]`, estilo: TX.meta, color: C.tinta_suave });
    const wMax = Math.max(...ren.map((r) => ancho(r.texto, r.estilo)));
    const h = altoDeRenglones(ren);
    const sep = 5;
    let x;
    let y;
    let ancla;
    if (lado === 'arriba' || lado === 'abajo') {
      ancla = 'middle';
      x = px;
      y = lado === 'arriba' ? py - sep - h : py + sep;
    } else {
      ancla = lado === 'der' ? 'start' : 'end';
      x = lado === 'der' ? px + sep + 2 : px - sep - 2;
      y = py - h / 2;
    }
    const x0 = ancla === 'middle' ? x - wMax / 2 : ancla === 'end' ? x - wMax : x;
    capas.rotulos.push(`<rect x="${r2(x0 - 2)}" y="${r2(y - 1)}" width="${r2(wMax + 4)}" height="${r2(h + 2)}" fill="${C.papel}" opacity="0.94"/>`);
    bloque(capas.rotulos, x, y, ren, { ancla, de: `conector:${nIndex}` });
  }
  /** Ubica los rótulos automáticos cuando ya están todas las líneas y cajas: prueba posiciones a cada lado y a lo largo
   *  de la línea y elige la primera que no pisa líneas, nodos, bordes de marcos ni otros rótulos. */
  function ubicarRotulosAutomaticos() {
    const colocados = [];
    const marcos = [...nodos.values()].filter((n) => n.marco);
    const bordes = marcos.flatMap((m) => [
      { a: { x: m.x, y: m.y }, b: { x: m.x + m.w, y: m.y } },
      { a: { x: m.x + m.w, y: m.y }, b: { x: m.x + m.w, y: m.y + m.h } },
      { a: { x: m.x, y: m.y + m.h }, b: { x: m.x + m.w, y: m.y + m.h } },
      { a: { x: m.x, y: m.y }, b: { x: m.x, y: m.y + m.h } },
    ]);
    const conectables = [...nodos.values()].filter((n) => n.rect);
    const choca = (caja) => {
      let n = 0;
      for (const s of segmentos) if (cruzaCaja(s, caja, 1.5)) n += 3;
      for (const b of bordes) if (cruzaCaja(b, caja, 1)) n += 2;
      for (const nd of conectables) {
        if (nd.forma === 'elipse') {
          const a = nd.w / 2 + 1;
          const bb = nd.h / 2 + 1;
          const cx = nd.x + nd.w / 2;
          const cy = nd.y + nd.h / 2;
          for (const [fx, fy] of [[0, 0], [0.5, 0], [1, 0], [0, 0.5], [0.5, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1]]) {
            const px = caja.x + caja.w * fx;
            const py = caja.y + caja.h * fy;
            if (((px - cx) / a) ** 2 + ((py - cy) / bb) ** 2 < 1) { n += 4; break; }
          }
        } else if (solapan(caja, nd, -1)) n += 4;
      }
      for (const c of colocados) if (solapan(caja, c, -2)) n += 4;
      for (const tx of textos) if (solapan(caja, tx, -1)) n += 4;
      if (caja.x < 0 || caja.y < 0 || caja.x + caja.w > W || caja.y + caja.h > H) n += 10;
      return n;
    };
    for (const { pts, et, nIndex } of rotulosPendientes) {
      const ren = [];
      for (const l of [].concat(et.texto ?? [])) ren.push({ texto: l, estilo: TX.texto, color: C.tinta });
      if (et.tecnologia) ren.push({ texto: `[${et.tecnologia}]`, estilo: TX.meta, color: C.tinta_suave });
      const w = Math.max(...ren.map((r) => ancho(r.texto, r.estilo))) + 4;
      const h = altoDeRenglones(ren) + 2;
      const segs = [];
      for (let i = 0; i < pts.length - 1; i++) segs.push({ a: pts[i], b: pts[i + 1], l: Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y) });
      segs.sort((p, q) => q.l - p.l);
      const candidatos = [];
      for (const s of segs) {
        const [ux, uy] = dir(s.a, s.b);
        let nx = -uy;
        let ny = ux;
        const prefiereArriba = (et.lado ?? 'arriba') === 'arriba' || et.lado === 'izq';
        if ((prefiereArriba && ny > 0) || (!prefiereArriba && ny < 0) || (Math.abs(ny) < 0.01 && ((et.lado ?? 'der') === 'der' ? nx < 0 : nx > 0))) { nx = -nx; ny = -ny; }
        for (const t of [et.pos ?? 0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
          const px = s.a.x + (s.b.x - s.a.x) * t;
          const py = s.a.y + (s.b.y - s.a.y) * t;
          for (const signo of [1, -1]) {
            const e = Math.abs(nx) * (w / 2) + Math.abs(ny) * (h / 2);
            const cx = px + signo * nx * (4 + e);
            const cy = py + signo * ny * (4 + e);
            candidatos.push({ x: cx - w / 2, y: cy - h / 2, w, h });
          }
        }
      }
      let mejor = null;
      let costoMejor = Infinity;
      for (const c of candidatos) {
        const costo = choca(c);
        if (costo < costoMejor) { mejor = c; costoMejor = costo; }
        if (costo === 0) break;
      }
      colocados.push(mejor);
      capas.rotulos.push(`<rect x="${r2(mejor.x)}" y="${r2(mejor.y)}" width="${r2(mejor.w)}" height="${r2(mejor.h)}" fill="${C.papel}" opacity="0.94"/>`);
      bloque(capas.rotulos, mejor.x + mejor.w / 2, mejor.y + 1, ren, { ancla: 'middle', de: `conector:${nIndex}` });
    }
  }
  function muestra(tipo, x, y, w, h) {
    const p = PALETA[tipo];
    if (p) {
      const g = guionDe(tipo);
      return `<rect x="${r2(x)}" y="${r2(y)}" width="${w}" height="${h}" rx="3" fill="${p.relleno}" stroke="${p.trazo}" stroke-width="${T.trazo.nodo}"${g ? ` stroke-dasharray="${g}"` : ''}/>`;
    }
    const m = tipo.match(/^linea(?:-(discontinua|punteada))?(?::(\w+))?$/);
    if (m) {
      const g = m[1] === 'discontinua' ? GUION.discontinuo : m[1] === 'punteada' ? GUION.punteado : null;
      const yc = y + h / 2;
      const fin = m[2];
      const largo = fin && /^(uno|cero|muchos)/.test(fin) ? w : w - 1;
      return `<path d="M ${r2(x)} ${r2(yc)} L ${r2(x + largo)} ${r2(yc)}" stroke="${C.linea}" stroke-width="${T.trazo.conector}" fill="none"${g ? ` stroke-dasharray="${g}"` : ''}/>${fin ? punta(fin, { x: x + w, y: yc }, [1, 0], C.linea) : ''}`;
    }
    if (tipo === 'marco') return `<rect x="${r2(x)}" y="${r2(y)}" width="${w}" height="${h}" rx="3" fill="${C.fondo_suave}" stroke="${C.tinta_suave}" stroke-width="1"/>`;
    if (tipo === 'enfasis') return `<rect x="${r2(x)}" y="${r2(y)}" width="${w}" height="${h}" rx="3" fill="${C.enfasis.relleno}" stroke="${C.enfasis.trazo}" stroke-width="${T.trazo.enfasis}"/>`;
    if (tipo === 'referida') return `<rect x="${r2(x)}" y="${r2(y)}" width="${w}" height="${h}" rx="2" fill="${C.papel}" stroke="${C.nota.trazo}" stroke-width="1.1" stroke-dasharray="${GUION.discontinuo}"/>`;
    throw new Error(`muestra desconocida: ${tipo}`);
  }

  // ─── Revisión automática ───────────────────────────────────────────────────────────────────
  function revisar() {
    const hallazgos = [];
    if (textos.some((t) => t.de === 'leyenda-desborde')) hallazgos.push('la leyenda no entra en su caja');
    for (const g of glifosFaltantes) hallazgos.push(`glifo que la tipografía no tiene: ${g}`);
    const fuenteMinima = Math.min(...textos.filter((t) => t.tamano > 0).map((t) => t.tamano));
    if (fuenteMinima < F.minimo) hallazgos.push(`tipografía de ${fuenteMinima} pt, por debajo de ${F.minimo}`);
    const conectables = [...nodos.values()].filter((n) => n.rect);
    if (conectables.length > 25) hallazgos.push(`densidad: ${conectables.length} nodos (máximo 25)`);
    if (conectores.length > 40) hallazgos.push(`densidad: ${conectores.length} conectores (máximo 40)`);
    for (const n of conectables) if (n.desborde) hallazgos.push(`desborde: ${n.desborde}`);
    // Fuera del lienzo.
    for (const t of textos) if (t.x < 0 || t.y < 0 || t.x + t.w > W + 0.5 || t.y + t.h > H + 0.5) hallazgos.push(`texto fuera del lienzo: «${t.texto}»`);
    for (const n of conectables) if (n.x < 0 || n.y < 0 || n.x + n.w > W + 0.5 || n.y + n.h > H + 0.5) hallazgos.push(`nodo fuera del lienzo: ${n.id}`);
    // Textos que se pisan (de distinto dueño).
    for (let i = 0; i < textos.length; i++)
      for (let j = i + 1; j < textos.length; j++) {
        const a = textos[i];
        const b = textos[j];
        if (a.de === b.de) continue;
        if (solapan(a, b, 0.5)) hallazgos.push(`textos que se pisan: «${a.texto}» y «${b.texto}»`);
      }
    // Rótulos de conectores sobre nodos o sobre otros conectores.
    for (const t of textos.filter((x) => String(x.de).startsWith('conector:'))) {
      for (const n of conectables) if (solapan(t, n, 0)) hallazgos.push(`rótulo sobre el nodo ${n.id}: «${t.texto}»`);
      const propio = Number(String(t.de).split(':')[1]);
      for (const s of segmentos) if (s.de !== propio && cruzaCaja(s, t, 1)) hallazgos.push(`rótulo atravesado por otro conector: «${t.texto}»`);
    }
    // Textos de nodos atravesados por un conector (los que tienen fondo blanco quedan por encima de la línea).
    for (const tx of textos.filter((x) => !String(x.de).startsWith('conector:') && !x.halo && x.de !== 'leyenda' && !String(x.de).startsWith('texto') && !nodos.get(x.de)?.marco))
      for (const s of segmentos) if (cruzaCaja(s, tx, 0.5)) { hallazgos.push(`texto atravesado por un conector: «${tx.texto}»`); break; }
    // Rótulos de conectores sobre el borde de un marco (el texto no puede quedar atravesado por una línea).
    for (const m of [...nodos.values()].filter((n) => n.marco)) {
      const bordes = [
        { a: { x: m.x, y: m.y }, b: { x: m.x + m.w, y: m.y } },
        { a: { x: m.x + m.w, y: m.y }, b: { x: m.x + m.w, y: m.y + m.h } },
        { a: { x: m.x, y: m.y + m.h }, b: { x: m.x + m.w, y: m.y + m.h } },
        { a: { x: m.x, y: m.y }, b: { x: m.x, y: m.y + m.h } },
      ];
      for (const t of textos.filter((x) => String(x.de).startsWith('conector:')))
        if (bordes.some((b) => cruzaCaja(b, t, 1))) hallazgos.push(`rótulo sobre el borde de ${m.id}: «${t.texto}»`);
    }
    // Conectores que cruzan cajas que no son sus extremos.
    for (const s of segmentos)
      for (const n of conectables) {
        if (s.nodos.includes(n.id)) continue;
        if (cruzaCaja(s, n, -1)) hallazgos.push(`el conector ${s.nodos.join('→')} atraviesa ${n.id}`);
      }
    // Cruces entre conectores (sin contar extremos compartidos).
    let cruces = 0;
    for (let i = 0; i < segmentos.length; i++)
      for (let j = i + 1; j < segmentos.length; j++) {
        const a = segmentos[i];
        const b = segmentos[j];
        if (a.de === b.de) continue;
        if (seCruzan(a, b)) cruces++;
      }
    return {
      lamina: id,
      ancho: W,
      alto: H,
      fuenteMinima,
      nodos: conectables.length,
      conectores: conectores.length,
      cruces,
      hallazgos: [...new Set(hallazgos)],
    };
  }
  const solapan = (a, b, m) => a.x < b.x + b.w - m && b.x < a.x + a.w - m && a.y < b.y + b.h - m && b.y < a.y + a.h - m;
  function cruzaCaja(s, c, margen) {
    // Segmento contra un rectángulo (o una elipse, si el nodo lo es) achicado o agrandado en `margen`.
    if (c.forma === 'elipse') {
      const a = c.w / 2 + margen;
      const b = c.h / 2 + margen;
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      for (let k = 1; k < 40; k++) {
        const x = s.a.x + ((s.b.x - s.a.x) * k) / 40;
        const y = s.a.y + ((s.b.y - s.a.y) * k) / 40;
        if (((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 < 1) return true;
      }
      return false;
    }
    const x0 = c.x - margen;
    const y0 = c.y - margen;
    const x1 = c.x + c.w + margen;
    const y1 = c.y + c.h + margen;
    const pasos = 24;
    for (let k = 1; k < pasos; k++) {
      const x = s.a.x + ((s.b.x - s.a.x) * k) / pasos;
      const y = s.a.y + ((s.b.y - s.a.y) * k) / pasos;
      if (x > x0 && x < x1 && y > y0 && y < y1) return true;
    }
    return false;
  }
  function seCruzan(s, t) {
    const d = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const igual = (p, q) => Math.abs(p.x - q.x) < 0.5 && Math.abs(p.y - q.y) < 0.5;
    if (igual(s.a, t.a) || igual(s.a, t.b) || igual(s.b, t.a) || igual(s.b, t.b)) return false;
    const d1 = d(t.a, t.b, s.a);
    const d2 = d(t.a, t.b, s.b);
    const d3 = d(s.a, s.b, t.a);
    const d4 = d(s.a, s.b, t.b);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }

  return api;
}
