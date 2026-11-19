// WP-ENTORNO-DEL-TUTOR (DL-184) · la matriz de los gráficos por persona (REQ-TUT-42, tabla «tab-matriz» del documento):
// qué gráfico se luce con quién y qué tiene que traer el dato. «Luce» y «Ve» exigen que el dato esté; «Vacío» exige que
// falte (el estado vacío honesto de Silvia, REQ-TUT-25); «—», no aplica. El chequeo corre sobre la historia generada: si
// una celda no tiene su dato, falla, aunque el gráfico todavía no esté programado («los datos ya los dejan listos»).
import { SEIS_CON_BARRA } from './catalogo.mjs';
import { diasEntre } from './historia.mjs';

const efectivas = (p) => p.trn.sesiones.flatMap((s) => s.ejercicios.flatMap((e) => (e.sets ?? []).filter((x) => x.setKind !== 'WARM_UP').map((x) => ({ s, e, x }))));
const conTiempos = (p) => p.trn.sesiones.filter((s) => s.tiempos);
const tomasCon = (p, m) => p.tomas.filter((t) => t.mediciones.some(([k]) => k === m));
const sesionesPorVersionEnLaEstimacion = (p) => {
  const n = new Map();
  for (const s of p.trn.sesiones) {
    if (s.ejercicios.some((e) => SEIS_CON_BARRA.includes(e.ejercicio) && !e.sustituido && (e.sets ?? []).some((x) => x.setKind !== 'WARM_UP' && x.rir !== null && x.rir <= 2 && x.completedRepetitions + x.rir <= 10 && x.fieldOrigins?.rir === 'PERSON'))) n.set(s.version, (n.get(s.version) ?? 0) + 1);
  }
  return n;
};
const ocho = ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-supraespinal', 'pliegue-abdominal', 'pliegue-muslo-frontal', 'pliegue-pantorrilla', 'pliegue-biceps', 'pliegue-cresta-iliaca'];
const dosEtapas = (p, area) => {
  const vs = area === 'NUT' ? p.nut.versiones : p.trn.versiones;
  return vs.length >= 2;
};

/** [ID, gráfico, estado en BE, por persona (Tomás, Valeria, Gustavo, Carolina, Silvia), el dato que tiene que traer]. */
export const MATRIZ = [
  ['GR-01', '«La vez pasada», serie por serie', 'Funcionando', ['Luce', 'Ve', 'Ve', 'Ve', 'Ve'], (p) => efectivas(p).some(({ x }) => x.fieldOrigins?.load === 'PERSON') && (p.clave !== 'tomas' || p.trn.sesiones.some((s) => s.ejercicios.some((e) => e.sustituido)))],
  ['GR-02', '1RM estimado (Epley v1) con las versiones', 'Funcionando', ['Luce', 'Luce', 'Luce', 'Ve', 'Vacío'], (p) => [...sesionesPorVersionEnLaEstimacion(p).values()].some((n) => n >= 4)],
  ['GR-03', 'Carga, repeticiones y RIR alineados', 'Funcionando', ['Ve', 'Luce', 'Ve', 'Ve', 'Ve'], (p) => efectivas(p).length > 0 && (p.clave !== 'valeria' || p.trn.versiones.some((v) => v.descarga))],
  ['GR-04', '«Con historial» en el buscador', 'Funcionando', ['Ve', 'Ve', 'Ve', 'Ve', 'Ve'], (p) => p.trn.sesiones.length > 0],
  ['GR-05', 'RIR indicado y registrado', 'Funcionando', ['Ve', 'Luce', 'Ve', 'Ve', 'Ve'], (p) => efectivas(p).some(({ x }) => x.rir !== null) && (p.clave !== 'valeria' || new Set(p.trn.versiones.flatMap((v) => v.rirIndicado)).size >= 2)],
  ['GR-06', 'Perfil carga-repeticiones', 'Funcionando', ['Luce', 'Ve', 'Ve', 'Ve', 'Vacío'], (p) => {
    const reps = efectivas(p).filter(({ e, x }) => SEIS_CON_BARRA.includes(e.ejercicio) && x.load).map(({ x }) => x.completedRepetitions);
    return reps.length > 0 && (p.clave !== 'tomas' || (Math.min(...reps) <= 5 && Math.max(...reps) >= 8));
  }],
  ['GR-07', 'Series por zona del borrador', 'Por programar', ['Ve', 'Ve', 'Ve', 'Ve', 'Ve'], (p) => p.trn.versiones.length > 0],
  ['GR-08', 'Series según un umbral de RIR', 'Por programar', ['Ve', 'Luce', 'Ve', 'Ve', '—'], (p) => efectivas(p).filter(({ x }) => x.rir !== null).length > efectivas(p).length / 2],
  ['GR-09', 'kg × repeticiones por semana', 'Por programar', ['Luce', 'Ve', 'Ve', 'Ve', 'Vacío'], (p) => efectivas(p).some(({ e, x }) => SEIS_CON_BARRA.includes(e.ejercicio) && x.load)],
  ['GR-10', 'La carga de la semana con el esfuerzo', 'Por programar', ['Ve', 'Luce', 'Ve', 'Ve', 'Vacío'], (p) => efectivas(p).some(({ e, x }) => SEIS_CON_BARRA.includes(e.ejercicio) && x.perceivedExertion !== null)],
  ['GR-11', 'Temporadas del objetivo y del plan', 'Funcionando', ['Ve', 'Luce', 'Ve', 'Luce', '—'], (p) => dosEtapas(p, 'NUT')],
  ['GR-12', 'Energía registrada por día', 'Funcionando', ['Ve', 'Ve', 'Ve', 'Luce', '—'], (p) => p.nut.comidas.some((c) => c.tipoDeDia === 'COMPLETO') && p.nut.comidas.some((c) => c.tipoDeDia === 'FALTA')],
  ['GR-13', 'Proteína, carbohidratos, grasa y fibra', 'Funcionando', ['Luce', 'Ve', 'Ve', 'Luce', '—'], (p) => p.nut.comidas.length > 0 && p.tomas.length > 0],
  ['GR-14', 'Lo indicado y lo registrado, en gramos', 'Funcionando', ['Ve', 'Ve', 'Ve', 'Luce', '—'], (p) => p.nut.comidas.some((c) => c.diferente?.aproximada) && p.nut.comidas.some((c) => c.diferente && !c.diferente.aproximada)],
  ['GR-15', 'La proteína por comida', 'Por programar', ['Luce', 'Ve', 'Ve', 'Luce', '—'], (p) => p.nut.versiones.some((v) => v.plan[0].comidas.length >= 3)],
  ['GR-16', 'Desde el inicio y desde la anterior', 'Funcionando', ['Ve', 'Ve', 'Luce', 'Luce', 'Vacío'], (p) => p.tomas.length >= 3],
  ['GR-17', 'Pliegues con el error de medición', 'Por programar', ['Ve', 'Ve', 'Ve', 'Luce', 'Vacío'], (p) => p.tomas.length >= 3],
  ['GR-18', 'Perfil por sitio entre dos tomas', 'Funcionando', ['Ve', 'Ve', 'Ve', 'Luce', 'Vacío'], (p) => p.tomas.length >= 2 && (p.clave !== 'carolina' || p.tomas.some((t) => t.sitioSinMedir))],
  ['GR-19', 'Perímetro corregido por pliegue', 'Por programar', ['Luce', 'Ve', 'Ve', 'Ve', 'Vacío'], (p) => tomasCon(p, 'perimetro-muslo').length >= 2 && tomasCon(p, 'pliegue-muslo-frontal').length >= 2],
  ['GR-20', 'Masa grasa según cada método', 'Funcionando', ['Ve', 'Ve', 'Ve', 'Luce', 'Vacío'], (p) => p.tomas.filter((t) => ocho.every((k) => t.mediciones.some(([m]) => m === k))).length >= 2],
  ['GR-21', 'Masa con las condiciones de la toma', 'Por programar', ['Ve', 'Ve', 'Ve', 'Ve', 'Ve'], (p) => p.tomas.length > 0 && p.tomas.every((t) => t.condiciones)],
  ['GR-22', 'Somatocarta con su recorrido', 'Por programar', ['Luce', 'Ve', 'Ve', 'Ve', 'Vacío'], (p) => tomasCon(p, 'diametro-humero').length >= 2],
  ['GR-23', 'La cinta del tiempo', 'Funcionando', ['Ve', 'Ve', 'Luce', 'Ve', 'Ve'], (p) => p.trn.versiones.length > 0 && (p.clave !== 'gustavo' || p.pausas.some((pa) => pa.dias >= 56))],
  ['GR-24', 'Dos etapas lado a lado', 'Funcionando', ['Ve', 'Luce', 'Ve', 'Luce', 'Vacío'], (p) => {
    if (p.trn.versiones.length < 2) return false;
    const n = sesionesPorVersionEnLaEstimacion(p);
    return p.clave === 'carolina' ? p.tomas.length >= 10 : [...n.values()].filter((x) => x >= 5).length >= 2;
  }],
  ['GR-25', 'Lo de sus semanas anteriores', 'Por programar', ['Ve', 'Ve', 'Ve', 'Ve', 'Vacío'], (p) => p.dias > 56],
  ['GR-26', '«Armá tu gráfico»', 'Funcionando', ['Luce', 'Ve', 'Ve', 'Ve', 'Ve'], (p) => p.trn.sesiones.length > 0 && p.tomas.length > 0],
  ['GR-27', 'Los enfoques', 'Por integrar', ['Luce', 'Ve', 'Ve', 'Luce', 'Ve'], () => true],
  ['PAT', 'La sección «Patrones»', 'Por integrar', ['Ve', 'Luce', 'Ve', 'Ve', 'Vacío'], (p) => p.nut.versiones.length >= 2 && p.trn.versiones.length >= 2],
  ['SP-01', 'Carbohidratos × 1RM estimado', 'Funcionando', ['Ve', 'Luce', 'Ve', 'Ve', '—'], (p) => {
    if (p.clave !== 'valeria') return p.nut.versiones.length >= 1 && p.trn.versiones.length >= 1;
    const cambio = p.nut.versiones.find((v, i) => i > 0 && v.macros.c !== p.nut.versiones[i - 1].macros.c);
    if (!cambio) return false;
    const i = p.nut.versiones.indexOf(cambio);
    return diasEntre(p.nut.versiones[i - 1].desde, cambio.desde) >= 35 && diasEntre(cambio.desde, p.trn.sesiones.at(-1).fecha) >= 35 && p.areas.NUTRICION === p.areas.ENTRENAMIENTO;
  }],
  ['SP-02', 'Energía × peso de toma a toma', 'Funcionando', ['Ve', 'Ve', 'Ve', 'Luce', '—'], (p) => p.tomas.length >= 3 && p.tomas.every((t, i) => i === 0 || diasEntre(p.tomas[i - 1].fecha, t.fecha) >= 14 || p.vuelta)],
  ['SP-03', 'Energía y peso × 1RM en déficit', 'Por programar', ['—', '—', '—', 'Luce', '—'], (p) => p.trn.sesiones.length > 0 && p.nut.versiones.length >= 2],
  ['SP-04', 'Series por zona × perímetro', 'Por programar', ['Luce', 'Ve', 'Ve', 'Ve', '—'], (p) => p.tomas.length >= 3 && p.trn.sesiones.length > 0],
  ['SP-05', 'Proteína g/kg × masa muscular', 'Por programar', ['Luce', 'Ve', 'Ve', 'Ve', '—'], (p) => p.tomas.length >= 3 && p.nut.comidas.length > 0],
  ['SP-06', 'Carbohidratos × pesajes en casa', 'Por programar', ['—', '—', '—', '—', '—'], () => true],
  ['SP-07', 'Series por semana × RIR a igual carga', 'Por programar', ['Ve', 'Luce', 'Ve', 'Ve', '—'], (p) => efectivas(p).some(({ x }) => x.rir !== null)],
  ['SP-08', 'Hábitos × carga y RIR', 'Por programar', ['Ve', 'Ve', 'Ve', 'Ve', '—'], (p) => p.trn.sesiones.length > 0],
];

export const COLUMNAS = ['tomas', 'valeria', 'gustavo', 'carolina', 'silvia'];

/** Aplica la matriz a la historia: una fila por celda, con lo esperado, lo que hay y si cumple. */
export function verificarMatriz(historia) {
  const celdas = [];
  for (const [id, grafico, estado, esperado, tiene] of MATRIZ) {
    COLUMNAS.forEach((clave, i) => {
      const p = historia.personas.find((x) => x.clave === clave);
      const e = esperado[i];
      if (e === '—') return;
      const hay = !!tiene(p);
      const ok = e === 'Vacío' ? !hay : hay;
      celdas.push({ id, grafico, estado, persona: p.nombre, esperado: e, hay, ok });
    });
  }
  return { ok: celdas.every((c) => c.ok), celdas };
}
