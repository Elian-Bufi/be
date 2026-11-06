// Compositor de las vistas del DER. Cada vista declara en qué celda de una grilla va cada entidad; el compositor mide
// las entidades con la tipografía real, calcula columnas y filas, dibuja las entidades y traza TODAS las relaciones del
// esquema entre ellas (con su cardinalidad), así la figura no puede omitir ni inventar una relación. Las rutas siguen
// reglas fijas; una vista puede corregir una ruta puntual. Si algo no entra, falla con el motivo, en vez de dibujar mal.
import { filasDe, relacionesEntre, referenciasExternas, puntas } from './der.mjs';
import { anchoMinimoDeEntidad, altoDeEntidad } from './lamina.mjs';
import { vistaDe } from './vistas-der.mjs';

/**
 * spec:
 *   vista: modelos de la vista (todos se dibujan).
 *   grilla: { Modelo: [columna, fila] }.
 *   area: { x, y, w, h } donde van las entidades.
 *   maximo: filas visibles por entidad (número o { Modelo: n }); las claves siempre se ven.
 *   incluir / excluir: { Modelo: [campos] }.
 *   enfasis: modelos destacados (el centro de la vista).
 *   rutas: { 'Modelo.campoFk': { lado, ladoA, campoA, sinCampo, medio, via, t, tA, lazo } } para corregir una ruta.
 *   separacionFilas: espacio vertical entre filas de la grilla.
 *   anchoColumna: { columna: ancho } para fijar una columna.
 */
export function componerVistaDer(L, spec) {
  const { vista, grilla, area, maximo = 6, incluir = {}, excluir = {}, enfasis = [], rutas = {}, separacionFilas = 26, anchoColumna = {}, gapMinimo = 22 } = spec;
  for (const m of vista) if (!grilla[m]) throw new Error(`${L.id}: ${m} no tiene lugar en la grilla`);
  // Atributos visibles por entidad: el máximo pedido es un techo. Si la grilla no entra a lo alto, se baja de a uno el de
  // las entidades más cargadas de la fila más alta (las claves se ven siempre; lo oculto queda contado en la caja).
  const tope = new Map(vista.map((m) => [m, typeof maximo === 'number' ? maximo : (maximo[m] ?? 6)]));
  let datos;
  let anchos;
  let gap;
  let altos;
  const nCol = Math.max(...vista.map((m) => grilla[m][0])) + 1;
  const nFil = Math.max(...vista.map((m) => grilla[m][1])) + 1;
  const visibles = (d) => d.filas.filter((f) => !f.clave).length;
  for (let vuelta = 0; ; vuelta++) {
    datos = new Map();
    for (const m of vista) {
      const { filas, omitidos } = filasDe(m, { vista, maximo: tope.get(m), incluir: incluir[m] ?? [], excluir: excluir[m] ?? [] });
      datos.set(m, { filas, omitidos, col: grilla[m][0], fila: grilla[m][1] });
    }
    const lista = [...datos.entries()];
    anchos = Array.from({ length: nCol }, (_, c) => anchoColumna[c] ?? Math.max(0, ...lista.filter(([, d]) => d.col === c).map(([m, d]) => anchoMinimoDeEntidad(m, d.filas, d.omitidos))));
    gap = nCol > 1 ? (area.w - anchos.reduce((s, w) => s + w, 0)) / (nCol - 1) : 0;
    altos = Array.from({ length: nFil }, (_, f) => Math.max(0, ...lista.filter(([, d]) => d.fila === f).map(([m, d]) => altoDeEntidad(m, anchos[d.col], d.filas.length, d.omitidos))));
    const total = altos.reduce((s, h) => s + h, 0) + separacionFilas * (nFil - 1);
    if (total <= area.h + 0.5) break;
    // De la fila más alta a la más baja: la primera cuya altura la definen entidades con atributos que no son clave.
    let reducibles = [];
    for (const f of [...altos.keys()].sort((x, y) => altos[y] - altos[x])) {
      const definen = lista.filter(([m, d]) => d.fila === f && Math.abs(altoDeEntidad(m, anchos[d.col], d.filas.length, d.omitidos) - altos[f]) < 0.5);
      if (definen.length && definen.every(([, d]) => visibles(d) > 0)) {
        reducibles = definen;
        break;
      }
    }
    if (!reducibles.length || vuelta > 80) throw new Error(`${L.id}: las filas no entran ni con solo las claves (${Math.ceil(total)} > ${area.h})`);
    for (const [m, d] of reducibles) tope.set(m, Math.min(tope.get(m), d.filas.length - 1));
  }
  const lista = [...datos.entries()];
  if (nCol > 1 && gap < gapMinimo) throw new Error(`${L.id}: las columnas no entran (${anchos.map(Math.ceil).join(' + ')}; separación ${gap.toFixed(1)} < ${gapMinimo})`);
  const xs = [];
  for (let c = 0, x = area.x; c < nCol; c++) {
    xs.push(x);
    x += anchos[c] + gap;
  }
  const ys = [];
  for (let f = 0, y = area.y; f < nFil; f++) {
    ys.push(y);
    y += altos[f] + separacionFilas;
  }

  // Entidades.
  const nodo = {};
  const ids = new Map();
  for (const [m, d] of lista) {
    const id = m.replace(/[a-z]/g, '').toLowerCase() + '-' + ids.size;
    ids.set(m, id);
    nodo[m] = L.entidad({ id, x: xs[d.col], y: ys[d.fila], w: anchos[d.col], nombre: m, filas: d.filas, omitidos: d.omitidos, enfasis: enfasis.includes(m) });
  }
  const tieneFila = (m, campo) => datos.get(m).filas.some((f) => f.nombre === campo);
  const datosDe = (id) => [...ids.entries()].find(([, x]) => x === id)[0];

  // Rutas: primero se decide la forma de cada una; después se reparten los carriles compartidos.
  const planes = [];
  for (const r of relacionesEntre(vista)) {
    const C = r.desde;
    const P = r.hacia;
    const fk = r.clavesForaneas[0];
    const clave = `${C}.${fk}`;
    const o = rutas[clave] ?? {};
    const c = datos.get(C);
    const p = datos.get(P);
    const { hija, padre } = puntas(r);
    const base = { de: ids.get(C), a: ids.get(P), inicio: hija, fin: padre, clave };
    if (o.via || o.lado) {
      planes.push({ ...base, tipo: 'manual', o });
      continue;
    }
    const dc = p.col - c.col;
    const dr = p.fila - c.fila;
    // Autorreferencia: un lazo por el lado de afuera en la última columna; si no, por la izquierda (el área deja margen).
    if (C === P) planes.push({ ...base, tipo: 'lazo', lado: o.ladoLazo ?? null, fk, col: c.col, o });
    else if (Math.abs(dc) === 1) planes.push({ ...base, tipo: 'z', lado: dc > 0 ? 'e' : 'o', ladoA: dc > 0 ? 'o' : 'e', fk, campoA: tieneFila(P, 'id') ? 'id' : null, carril: Math.min(c.col, p.col), o });
    else if (dc === 0 && Math.abs(dr) === 1) planes.push({ ...base, tipo: 'vertical', lado: dr < 0 ? 'n' : 's', ladoA: dr < 0 ? 's' : 'n', o });
    else throw new Error(`${L.id}: la relación ${clave} → ${P} necesita una ruta manual (columnas ${c.col}→${p.col}, filas ${c.fila}→${p.fila})`);
  }

  // Lazos (autorreferencias): van por un lado que ninguna otra relación de esa entidad use; a la derecha solo si hay
  // margen en la lámina. Si los dos costados están ocupados, el lazo sale y entra por arriba.
  const ocupados = new Set();
  for (const pl of planes) {
    if (pl.tipo === 'z' || pl.tipo === 'vertical') {
      ocupados.add(`${pl.de}:${pl.lado}`);
      ocupados.add(`${pl.a}:${pl.ladoA}`);
    }
  }
  for (const pl of planes.filter((x) => x.tipo === 'lazo')) {
    if (pl.lado) continue;
    const n = L.nodos.get(pl.de);
    const margenDerecho = (spec.anchoLamina ?? Infinity) - (n.x + n.w);
    const candidatos = ['o', 'e', 'n', 's'].filter((l) => !ocupados.has(`${pl.de}:${l}`) && !(l === 'e' && margenDerecho < 20) && !(l === 'o' && n.x < 20));
    pl.lado = candidatos[0] ?? 'n';
    ocupados.add(`${pl.de}:${pl.lado}`);
  }

  // Varias Z que llegan al mismo lado del mismo padre: cada una conserva su línea hasta la entidad. La de la fuente más
  // alta entra por la cabecera y la siguiente por la fila de la clave primaria (más de dos piden una ruta fijada).
  const llegadas = new Map();
  for (const pl of planes.filter((x) => x.tipo === 'z')) {
    const k = `${pl.a}:${pl.ladoA}`;
    if (!llegadas.has(k)) llegadas.set(k, []);
    llegadas.get(k).push(pl);
  }
  for (const [, grupo] of llegadas) {
    if (grupo.length < 2) continue;
    if (grupo.length > 2) throw new Error(`${L.id}: llegan ${grupo.length} relaciones al mismo lado de ${grupo[0].a}; fijá una ruta`);
    grupo.sort((p1, p2) => L.nodos.get(p1.de).anclaFila(p1.fk, p1.lado).y - L.nodos.get(p2.de).anclaFila(p2.fk, p2.lado).y);
    const n = L.nodos.get(grupo[0].a);
    if (grupo[0].o.campoA === undefined) {
      grupo[0].campoA = null;
      grupo[0].tA = 11 / n.h;
    }
  }

  // Alturas de las dos puntas de cada Z (a la izquierda y a la derecha del carril).
  for (const pl of planes.filter((x) => x.tipo === 'z')) {
    const hijo = L.nodos.get(pl.de);
    const padre = L.nodos.get(pl.a);
    const yHijo = hijo.anclaFila(pl.fk, pl.lado).y;
    const yPadre = pl.campoA ? padre.anclaFila(pl.campoA, pl.ladoA).y : padre.y + (pl.tA ?? 0.5) * padre.h;
    pl.yIzq = pl.lado === 'e' ? yHijo : yPadre;
    pl.yDer = pl.lado === 'e' ? yPadre : yHijo;
  }

  // Carriles verticales entre columnas: cada Z usa una x propia dentro de su separación. Se prueban todos los órdenes y
  // se queda el de menos cruces (un tramo vertical que corta el tramo horizontal de otra Z).
  const porCarril = new Map();
  for (const pl of planes.filter((x) => x.tipo === 'z')) {
    if (!porCarril.has(pl.carril)) porCarril.set(pl.carril, []);
    porCarril.get(pl.carril).push(pl);
  }
  const entre = (v, a, b) => v > Math.min(a, b) + 0.5 && v < Math.max(a, b) - 0.5;
  function cruces(orden, xIzq, xDer) {
    const m = orden.map((_, i) => xIzq + ((xDer - xIzq) * (i + 1)) / (orden.length + 1));
    let n = 0;
    for (let i = 0; i < orden.length; i++)
      for (let j = 0; j < orden.length; j++) {
        if (i === j) continue;
        const a = orden[i];
        const b = orden[j];
        // vertical de a contra el tramo izquierdo de b (de xIzq a m[j]) y contra el derecho (de m[j] a xDer)
        if (m[i] < m[j] && entre(b.yIzq, a.yIzq, a.yDer)) n++;
        if (m[i] > m[j] && entre(b.yDer, a.yIzq, a.yDer)) n++;
        // Tramos horizontales a la misma altura que se superponen: peor que un cruce, porque las líneas se confunden.
        if (i < j) {
          const tramos = (k) => [
            { y: orden[k].yIzq, x0: xIzq, x1: m[k] },
            { y: orden[k].yDer, x0: m[k], x1: xDer },
          ];
          for (const t1 of tramos(i)) for (const t2 of tramos(j)) if (Math.abs(t1.y - t2.y) < 3 && Math.min(t1.x1, t2.x1) - Math.max(t1.x0, t2.x0) > 1) n += 3;
        }
      }
    return n;
  }
  function permutaciones(l) {
    if (l.length <= 1) return [l];
    return l.flatMap((x, i) => permutaciones([...l.slice(0, i), ...l.slice(i + 1)]).map((p) => [x, ...p]));
  }
  const lazosEn = (k, lado) => planes.some((pl) => pl.tipo === 'lazo' && pl.lado === lado && pl.col === (lado === 'e' ? k : k + 1));
  for (const [k, grupo] of porCarril) {
    const xIzq = xs[k] + anchos[k] + (lazosEn(k, 'e') ? 16 : 0);
    const xDer = xs[k + 1] - (lazosEn(k, 'o') ? 16 : 0);
    let mejor = grupo;
    if (grupo.length > 1 && grupo.length <= 6) {
      let menor = Infinity;
      for (const p of permutaciones(grupo)) {
        const c = cruces(p, xIzq, xDer);
        if (c < menor) {
          menor = c;
          mejor = p;
        }
      }
    }
    mejor.forEach((pl, i) => {
      pl.medio = pl.o.medio ?? xIzq + ((xDer - xIzq) * (i + 1)) / (mejor.length + 1);
    });
  }

  // Lados compartidos por conectores verticales: se reparten a lo largo del lado.
  const porLado = new Map();
  const anotar = (id, lado, pl, cual) => {
    const k = `${id}:${lado}`;
    if (!porLado.has(k)) porLado.set(k, []);
    porLado.get(k).push({ pl, cual });
  };
  for (const pl of planes.filter((x) => x.tipo === 'vertical')) {
    anotar(pl.de, pl.lado, pl, 't');
    anotar(pl.a, pl.ladoA, pl, 'tA');
  }
  for (const [, grupo] of porLado) grupo.forEach(({ pl, cual }, i) => (pl[cual] = pl.o[cual] ?? (grupo.length === 1 ? 0.5 : 0.3 + (0.4 * i) / (grupo.length - 1))));

  for (const pl of planes) {
    const { de, a, inicio, fin } = pl;
    if (pl.tipo === 'manual') {
      L.conector({ de, a, inicio, fin, ...pl.o, ...(pl.o.campo === undefined && !pl.o.sinCampo && ['e', 'o'].includes(pl.o.lado) ? { campo: pl.clave.split('.')[1] } : {}) });
    } else if (pl.tipo === 'lazo') {
      const n = L.nodos.get(de);
      const lazo = pl.o.lazo ?? 12;
      if (pl.lado === 'o' || pl.lado === 'e') {
        const xL = pl.lado === 'o' ? n.x - lazo : n.x + n.w + lazo;
        const yFk = n.anclaFila(pl.fk, pl.lado).y;
        const yPk = tieneFila(datosDe(de), 'id') ? n.anclaFila('id', pl.lado).y : n.y + 11;
        L.conector({ de, a, lado: pl.lado, ladoA: pl.lado, campo: pl.fk, ...(tieneFila(datosDe(de), 'id') ? { campoA: 'id' } : { tA: 11 / n.h }), via: [[xL, yFk], [xL, yPk]], inicio, fin });
      } else {
        // Por arriba (o por abajo): sale y vuelve al mismo borde, separado lo justo para que entren las dos puntas.
        const yL = pl.lado === 'n' ? n.y - 14 : n.y + n.h + 14;
        const t1 = 0.62;
        const t2 = Math.min(0.94, t1 + 40 / n.w);
        L.conector({ de, a, lado: pl.lado, ladoA: pl.lado, t: t1, tA: t2, via: [[n.x + n.w * t1, yL], [n.x + n.w * t2, yL]], inicio, fin });
      }
    } else if (pl.tipo === 'z') {
      L.conector({ de, a, lado: pl.lado, ladoA: pl.ladoA, campo: pl.fk, ...(pl.campoA ? { campoA: pl.campoA } : { tA: pl.tA ?? 0.5 }), medio: pl.medio, inicio, fin });
    } else {
      L.conector({ de, a, lado: pl.lado, ladoA: pl.ladoA, t: pl.t, tA: pl.tA, inicio, fin });
    }
  }

  return { xs, anchos, ys, altos, gap, nodo, ids };
}

/** Texto de la nota «otras vistas»: a qué entidad de qué vista apunta cada clave foránea marcada con ↗. */
export function textoDeReferencias(vista, { maximoCampos = 4 } = {}) {
  return referenciasExternas(vista)
    .map(({ destino, campos }) => {
      const lista = campos.length > maximoCampos ? [...campos.slice(0, maximoCampos), `${campos.length - maximoCampos} más`] : campos;
      return `${lista.join(', ')} → ${destino} (${vistaDe(destino)})`;
    })
    .join('\n');
}
