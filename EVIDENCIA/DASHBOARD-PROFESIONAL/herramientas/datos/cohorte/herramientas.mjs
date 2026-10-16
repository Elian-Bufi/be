// Piezas puras de la cohorte: fechas, azar reproducible, curvas y planes escalados a la energía del objetivo.
import { ALIMENTOS } from './catalogo.mjs';

export const ZONA = 'America/Argentina/Buenos_Aires';
export const DIAS_POR_MES = 30.4375;

/** La fecha civil `k` días antes de `hoy` (YYYY-MM-DD). */
export function diaMenos(hoy, k) {
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - k);
  return d.toISOString().slice(0, 10);
}
/** 0 = lunes … 6 = domingo. */
export const diaDeLaSemana = (fecha) => (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7;
/** El instante de una hora local en una fecha civil de Buenos Aires (UTC−3, sin horario de verano). */
export const instante = (fecha, hora) => new Date(`${fecha}T${hora}:00-03:00`);
export const masMinutos = (momento, minutos) => new Date(momento.getTime() + minutos * 60_000);
export const hhmm = (minutosDelDia) => `${String(Math.floor(minutosDelDia / 60)).padStart(2, '0')}:${String(minutosDelDia % 60).padStart(2, '0')}`;

/** Azar reproducible: la misma semilla da la misma historia en local y en test. */
export function azar(semilla) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const siguiente = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    numero: siguiente,
    entre: (min, max) => min + (max - min) * siguiente(),
    entero: (min, max) => Math.floor(min + (max - min + 1) * siguiente()),
    si: (p) => siguiente() < p,
    uno: (lista) => lista[Math.floor(siguiente() * lista.length)],
    /** Ruido con forma de campana (la suma de tres uniformes), de desvío aproximado `d`. */
    ruido: (d) => (siguiente() + siguiente() + siguiente() - 1.5) * d * 2,
  };
}

/** Una curva por tramos rectos entre puntos [mes, valor]; antes del primero y después del último, constante. */
export function curva(puntos) {
  return (mes) => {
    if (mes <= puntos[0][0]) return puntos[0][1];
    for (let i = 1; i < puntos.length; i++) {
      const [m1, v1] = puntos[i];
      if (mes <= m1) {
        const [m0, v0] = puntos[i - 1];
        return v0 + ((v1 - v0) * (mes - m0)) / (m1 - m0);
      }
    }
    return puntos[puntos.length - 1][1];
  };
}

export const redondear = (v, paso) => Math.round(v / paso) * paso;
export const unDecimal = (v) => Math.round(v * 10) / 10;

// ─── Planes nutricionales ──────────────────────────────────────────────────────────────────────────────────────

/** Una opción: [rótulo, [[alimento, cantidad, estado], …]]. Estados: RAW, COOKED, AS_PURCHASED. */
const kcalDeOpcion = (items) => items.reduce((s, [a, q]) => s + (ALIMENTOS[a].kcal * q) / 100, 0);
const kcalDelDia = (comidas) => comidas.reduce((s, [, opciones]) => s + opciones.reduce((t, [, items]) => t + kcalDeOpcion(items), 0) / opciones.length, 0);

/**
 * El plan de una etapa, con las cantidades escaladas para que el día promedie la energía del objetivo. Las bebidas sin
 * energía (café, té) no se escalan; el resto se redondea a 5 g o 10 ml, como se indica en una consulta.
 * `dias`: [{ rotulo, factor, comidas: [[rótulo, [opciones]]] }], con `factor` la energía del día respecto del objetivo.
 */
export function planNutricional(dias, kcal) {
  return {
    dayTypes: dias.map(({ rotulo, factor = 1, comidas }) => {
      const escala = (kcal * factor) / kcalDelDia(comidas);
      return {
        label: rotulo,
        meals: comidas.map(([rotuloDeComida, opciones]) => ({
          label: rotuloDeComida,
          prescriptionMode: 'DISH_OPTIONS',
          options: opciones.map(([rotuloDeOpcion, items]) => ({
            label: rotuloDeOpcion,
            items: items.map(([a, q, estado]) => {
              const al = ALIMENTOS[a];
              const fija = al.kcal <= 2;
              const paso = al.ml ? 10 : q * escala < 30 ? 5 : 10;
              return { catalogItemId: al.id, quantity: { value: fija ? q : Math.max(5, redondear(q * escala, paso)), unit: al.ml ? 'ml' : 'g' }, preparationState: estado };
            }),
          })),
        })),
      };
    }),
  };
}

/** Los macronutrientes del objetivo: proteínas por kilo, grasas como parte de la energía y el resto de hidratos. */
export function macros(kcal, peso, proteinaPorKg, parteDeGrasa = 0.28) {
  const p = Math.round(peso * proteinaPorKg);
  const g = Math.round((kcal * parteDeGrasa) / 9);
  const c = Math.round((kcal - p * 4 - g * 9) / 4);
  return { protein: { value: p, unit: 'g/day' }, carbohydrate: { value: c, unit: 'g/day' }, fat: { value: g, unit: 'g/day' } };
}
