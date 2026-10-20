// Compositor de las vistas de casos de uso (UML). Recibe qué actores y casos van en la vista y sus relaciones, y los
// ubica: actores a los lados, casos principales en una columna, incluidos y extensiones en otra, cada uno a la altura de
// los casos con los que se relaciona. Los estados (implementado, parcial, pendiente, fuera) salen de datos/estado.json.
// Reglas de lectura (addendum de legibilidad de MESA-02): rótulo corto con el ID visible (LEG-01); las inclusiones
// transversales UC-I02 y UC-I03 se declaran en una nota (LEG-02); cero cruces evitables (LEG-05).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const datos = join(dirname(fileURLToPath(import.meta.url)), '../../datos');
const estado = JSON.parse(readFileSync(join(datos, 'estado.json'), 'utf8'));

export const ROTULO = {
  'UC-P01': 'Alta profesional', 'UC-P02': 'Resolver verificación', 'UC-P03': 'Suspender o rehabilitar', 'UC-P04': 'Solicitar o invitar',
  'UC-P05': 'Aceptar o rechazar', 'UC-P06': 'Pausar o finalizar', 'UC-P07': 'Otorgar consentimiento', 'UC-P08': 'Revocar consentimiento',
  'UC-P09': 'Evaluación y objetivo', 'UC-P10': 'Diseñar plan', 'UC-P11': 'Validar y activar plan', 'UC-P12': 'Consultar y registrar',
  'UC-P13': 'Revisar y decidir', 'UC-P14': 'Evaluación y objetivo', 'UC-P15': 'Diseñar plan', 'UC-P16': 'Validar y activar plan',
  'UC-P17': 'Consultar y registrar', 'UC-P18': 'Revisar y decidir', 'UC-P19': 'Registrar evaluación', 'UC-P20': 'Consultar evolución',
  'UC-P21': 'Publicar servicio', 'UC-P22': 'Descubrir servicio', 'UC-P23': 'Cartera y pendientes', 'UC-P24': 'Ficha y línea de tiempo',
  'UC-P25': 'Registrar identidad', 'UC-P26': 'Iniciar y cerrar sesión', 'UC-P27': 'Cerrar la cuenta', 'UC-P28': 'Incidencia administrativa',
  'UC-P29': 'Habilitación y capacidad', 'UC-P30': 'Consultar novedades', 'UC-P31': 'Consultar progreso', 'UC-P32': 'Solicitar información',
  'UC-P33': 'Completar información', 'UC-E01': 'Subsanar evidencia', 'UC-E02': 'Corregir ejecución', 'UC-E03': 'Corregir o anular medición',
  'UC-E04': 'Solicitar desde el servicio', 'UC-E05': 'Acceder con Google', 'UC-E06': 'Administrar métodos', 'UC-E07': 'Nota de coordinación',
  'UC-E08': 'Recibir aviso', 'UC-E09': 'Recuperar el acceso', 'UC-I01': 'Presentar evidencia', 'UC-I02': 'Evaluar autorización',
  'UC-I03': 'Auditar y conservar historia', 'UC-I04': 'Validar y versionar', 'UC-I05': 'Revisión válida', 'UC-I06': 'Continuidad o cierre',
  'UC-I07': 'Importar y revisar', 'UC-I08': 'Respaldo manual', 'UC-I09': 'Cálculos antropométricos', 'UC-I10': 'Verificar habilitación',
  'UC-I11': 'Encauzar por superficie', 'UC-I12': 'Corrección trazable', 'UC-I13': 'Cálculo reproducible', 'UC-S01': 'Calcular TVCC-30',
};

/** Estilo del caso según su estado: pendiente y fuera de alcance, punteados; parcial, con marca. */
export function tipoDeCaso(uc) {
  const e = estado.casos[uc]?.estado ?? 'implementado';
  return { tipo: e === 'pendiente' || e === 'fuera' ? 'pendiente' : 'sistema', estado: e };
}

/** Separa valores (posiciones verticales) para que queden a `min` de distancia, sin salir de [desde, hasta]. */
function separar(items, min, desde, hasta) {
  const orden = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < orden.length; i++) if (orden[i].y - orden[i - 1].y < min) orden[i].y = orden[i - 1].y + min;
  const exceso = orden.length ? orden[orden.length - 1].y - hasta : 0;
  if (exceso > 0) for (const o of orden) o.y -= exceso;
  for (let i = 0; i < orden.length; i++) if (orden[i].y < desde + i * min) orden[i].y = desde + i * min;
  return orden;
}

/**
 * spec: {
 *   izquierda: [{ id, nombre, tipo }], derecha: [{ id, nombre, tipo }],
 *   principales: [uc...], secundarios: [{ uc, relacion: 'include'|'extend', con: [uc...] }],
 *   asociaciones: [[actorId, uc]...], generalizaciones: [[especifico, general]...],
 *   marco: { x, y, w, h, titulo }, columnas: { principal, secundaria }, anchoCaso, separacion, nota, leyenda
 * }
 */
export function componerVistaDeCasos(L, spec) {
  const W = spec.ancho;
  const m = spec.marco;
  const anchoP = spec.anchoCaso ?? 150;
  const anchoS = spec.anchoSecundario ?? anchoP;
  const xP = spec.columnas?.principal ?? m.x + 26 + anchoP / 2;
  const xS = spec.columnas?.secundaria ?? m.x + m.w - 26 - anchoS / 2;
  const sep = spec.separacion ?? 58;
  const arriba = m.y + 46;
  const abajo = m.y + m.h - 34;

  L.marco({ id: 'limite', x: m.x, y: m.y, w: m.w, h: m.h, titulo: m.titulo ?? 'BE', subtitulo: 'límite del sistema' });

  // Principales: repartidos en la altura disponible, en el orden dado (el orden del circuito).
  const nP = spec.principales.length;
  const paso = nP > 1 ? Math.min(spec.pasoMaximo ?? 92, (abajo - arriba) / (nP - 1)) : 0;
  const inicioP = nP > 1 ? arriba + ((abajo - arriba) - paso * (nP - 1)) / 2 : (arriba + abajo) / 2;
  const posP = new Map(spec.principales.map((uc, i) => [uc, { x: spec.posiciones?.[uc]?.x ?? xP, y: spec.posiciones?.[uc]?.y ?? inicioP + i * paso }]));

  // Secundarios: a la altura media de los casos con los que se relacionan, separados entre sí.
  const sec = (spec.secundarios ?? []).map((s) => ({
    ...s,
    y: spec.posiciones?.[s.uc]?.y ?? s.con.reduce((acc, uc) => acc + (posP.get(uc)?.y ?? (arriba + abajo) / 2), 0) / s.con.length,
    x: spec.posiciones?.[s.uc]?.x ?? xS,
  }));
  const fijosSec = sec.filter((s) => spec.posiciones?.[s.uc]?.y !== undefined);
  separar(sec.filter((s) => !fijosSec.includes(s)), sep, arriba, abajo);

  const caso = (uc, x, y, w) => {
    const { tipo, estado: e } = tipoDeCaso(uc);
    const n = L.casoDeUso({ id: uc, cx: x, cy: y, w, idTexto: uc, titulo: ROTULO[uc], tipo });
    if (e === 'parcial') L.etiquetaDeEstado(uc, 'parcial', 'pendiente');
    if (e === 'fuera') L.etiquetaDeEstado(uc, 'fuera de alcance', 'pendiente');
    if (e === 'pendiente') L.etiquetaDeEstado(uc, 'pendiente', 'pendiente');
    return n;
  };
  for (const [uc, p] of posP) caso(uc, p.x, p.y, anchoP);
  for (const s of sec) caso(s.uc, s.x, s.y, anchoS);

  // Actores: a la altura media de sus casos.
  const posDe = (uc) => posP.get(uc) ?? sec.find((s) => s.uc === uc);
  const ubicarActores = (lista, cx) => {
    const items = lista.map((a) => {
      const casos = (spec.asociaciones ?? []).filter(([ac]) => ac === a.id).map(([, uc]) => posDe(uc)?.y).filter((y) => y !== undefined);
      return { ...a, fija: a.y !== undefined, y: a.y ?? (casos.length ? casos.reduce((s, y) => s + y, 0) / casos.length : (arriba + abajo) / 2) - 30 };
    });
    separar(items.filter((a) => !a.fija), spec.separacionActores ?? 92, m.y + 4, m.y + m.h - 78);
    for (const a of items) L.actor({ id: a.id, cx: a.cx ?? cx, y: a.y, nombre: a.nombre, tipo: a.tipo ?? 'persona', anchoTexto: a.anchoTexto ?? 100 });
  };
  ubicarActores(spec.izquierda ?? [], spec.xActorIzquierda ?? 52);
  ubicarActores(spec.derecha ?? [], spec.xActorDerecha ?? W - 52);

  for (const [especifico, general] of spec.generalizaciones ?? []) L.relacion({ de: especifico, a: general, fin: 'triangulo' });
  const izquierdos = new Set((spec.izquierda ?? []).map((a) => a.id));
  for (const [actorId, uc] of spec.asociaciones ?? []) L.relacion({ de: actorId, a: uc, extremoA: izquierdos.has(actorId) ? 'o' : 'e' });
  // Cada flecha sale y llega por el lado que mira al otro caso; si un caso tiene varias del mismo lado, se reparten en
  // ángulo sobre la elipse (de arriba abajo, en el orden vertical del otro extremo) para que no salgan del mismo punto.
  const relaciones = [];
  for (const s of sec)
    for (const base of s.con) {
      const pb = posP.get(base) ?? sec.find((x) => x.uc === base);
      relaciones.push({ s, base, yBase: pb?.y ?? 0, ida: (pb?.x ?? 0) <= s.x });
    }
  const angulos = (lista, clave, yOtro, haciaDerecha) => {
    const grupos = new Map();
    for (const r of lista) {
      const k = clave(r);
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(r);
    }
    const res = new Map();
    for (const g of grupos.values()) {
      g.sort((p, q) => yOtro(p) - yOtro(q));
      g.forEach((r, i) => {
        const desv = g.length === 1 ? 0 : -22 + (44 * i) / (g.length - 1);
        res.set(r, haciaDerecha(r) ? desv : 180 - desv);
      });
    }
    return res;
  };
  const horizontales = relaciones.filter((r) => Math.abs((posP.get(r.base) ?? sec.find((x) => x.uc === r.base))?.x - r.s.x) > 10);
  const salida = angulos(horizontales, (r) => `${r.base}|${r.ida}`, (r) => r.s.y, (r) => r.ida);
  const llegada = angulos(horizontales, (r) => `${r.s.uc}|${r.ida}`, (r) => r.yBase, (r) => !r.ida);
  // Dos casos de la misma columna se conectan por abajo y por arriba (90° y 270°).
  for (const r of relaciones.filter((x) => !horizontales.includes(x))) {
    const abajo = r.s.y > r.yBase;
    salida.set(r, abajo ? 90 : 270);
    llegada.set(r, abajo ? 270 : 90);
  }
  for (const r of relaciones) {
    const { s, base } = r;
    // Ángulos fijados a mano en la fuente: [ángulo en el caso que sale, ángulo en el caso que recibe].
    const fijo = s.angulos?.[base];
    if (fijo) {
      if (s.relacion === 'include') { salida.set(r, fijo[0]); llegada.set(r, fijo[1]); } else { llegada.set(r, fijo[0]); salida.set(r, fijo[1]); }
    }
    if (s.relacion === 'include') L.relacion({ de: base, a: s.uc, estilo: 'discontinuo', fin: 'flecha', palabra: 'include', rotulo: s.rotulo?.[base] ?? {}, angDe: salida.get(r), angA: llegada.get(r) });
    else L.relacion({ de: s.uc, a: base, estilo: 'discontinuo', fin: 'flecha', palabra: 'extend', rotulo: s.rotulo?.[base] ?? {}, angDe: llegada.get(r), angA: salida.get(r) });
  }
  for (const [de, a, palabra] of spec.otras ?? []) L.relacion({ de, a, estilo: 'discontinuo', fin: 'flecha', palabra });
  return { posP, sec };
}
