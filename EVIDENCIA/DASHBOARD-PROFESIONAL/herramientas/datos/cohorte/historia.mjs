// La historia día por día de cada persona de la cohorte, a partir de su definición (`personas.mjs`). Es pura y
// reproducible: no toca la base ni la API, y con el mismo `hoy` da siempre lo mismo. Nada ocurre después de `ahora`.
import { DIAS_POR_MES, azar, curva, diaDeLaSemana, diaMenos, hhmm, instante, masMinutos, redondear, unDecimal } from './herramientas.mjs';
import { DIFERENTES } from './planes.mjs';
import { PLIEGUES } from './personas.mjs';

const HORAS = { Desayuno: [450, 540], Almuerzo: [750, 840], Merienda: [990, 1080], 'Antes de entrenar': [960, 1050], Cena: [1230, 1320], 'Colación': [630, 690], 'Antes de dormir': [1350, 1400] };
const MOTIVOS_DE_FALTA = ['Trabajo', 'Turno médico', 'Me quedé dormido', 'Lluvia fuerte', 'Viaje por trabajo'];

/**
 * El identificador de una prescripción en su plan: único en todo el plan (la API lo exige). Si el mismo ejercicio está en
 * dos sesiones de la etapa, se le agrega la sesión.
 */
export function idDePrescripcion(etapa, sesion, x) {
  const veces = etapa.sesiones.reduce((n, s) => n + s.rx.filter((y) => y.id === x.id).length, 0);
  return veces > 1 ? `${x.id}-${sesion.id}` : x.id;
}

/** El día (desde el inicio) en que empieza una etapa o una revisión: por mes o por «hace N días». */
export const diaDe = (p, x) => (x.hace !== undefined ? p.dias - x.hace : Math.round(x.mes * DIAS_POR_MES));
export const mesDe = (dia) => dia / DIAS_POR_MES;

function enPausa(p, dia) {
  for (const pa of p.pausas ?? []) {
    const [desde, hasta] = pa.hace ? [p.dias - pa.hace[0], p.dias - pa.hace[1]] : [Math.round(pa.desde * DIAS_POR_MES), Math.round(pa.hasta * DIAS_POR_MES)];
    if (dia >= desde && dia < hasta) return pa;
  }
  return null;
}

const etapaVigente = (etapas, dia) => {
  let i = -1;
  for (let k = 0; k < etapas.length; k++) if (etapas[k].dia <= dia) i = k;
  return i;
};

/** Las etapas de un área con su día de inicio, en orden. */
export const etapasDe = (p, area) => (area === 'NUTRICION' ? p.etapasNut : p.etapasTrn)?.map((e, i) => ({ ...e, indice: i, dia: diaDe(p, e) })) ?? [];

/** La edad cumplida en una fecha civil. */
export function edad(nacimiento, fecha) {
  const [a, m, d] = nacimiento.split('-').map(Number);
  const [fa, fm, fd] = fecha.split('-').map(Number);
  return fa - a - (fm < m || (fm === m && fd < d) ? 1 : 0);
}

export function historia(p, hoy, ahora) {
  const fechaDe = (dia) => diaMenos(hoy, p.dias - dia);
  const r = azar(`cohorte|${p.clave}`);
  const salida = { comidas: [], sesiones: [], tomas: [] };

  // ─── Comidas ──────────────────────────────────────────────────────────────────────────────────────────────────
  const etapasN = etapasDe(p, 'NUTRICION');
  const etapasT = etapasDe(p, 'ENTRENAMIENTO');
  if (etapasN.length) {
    const planes = etapasN.map((e) => e.plan());
    for (let dia = 0; dia <= p.dias; dia++) {
      const fecha = fechaDe(dia);
      const s = etapaVigente(etapasN, dia);
      if (s < 0) continue;
      const enEtapa = dia - etapasN[s].dia;
      const avance = dia / p.dias;
      const base = p.registro.base + (p.registro.final - p.registro.base) * avance;
      let prob = enEtapa < 21 ? p.registro.inicio : enEtapa < 60 ? p.registro.inicio + ((base - p.registro.inicio) * (enEtapa - 21)) / 39 : base;
      const pausa = enPausa(p, dia);
      if (pausa) prob *= pausa.registra ?? 0.1;
      if (!r.si(prob)) continue;
      const dds = diaDeLaSemana(fecha);
      const dias = planes[s];
      // El deportista: el día tipo «de entrenamiento o partido» los días de gimnasio, club o partido.
      const diaTipo = dias.length > 1 ? ([0, 1, 3, 5].includes(dds) ? 0 : 1) : 0;
      for (const [rotulo, opciones] of dias[diaTipo].comidas) {
        const opcional = ['Colación', 'Antes de dormir'].includes(rotulo);
        if (!r.si(opcional ? 0.6 : 0.88)) continue;
        const [desde, hasta] = HORAS[rotulo] ?? [600, 660];
        const ocurrio = instante(fecha, hhmm(r.entero(desde, hasta)));
        const tarde = r.si(0.06);
        const registrado = tarde ? instante(diaMenos(hoy, p.dias - dia - 1), hhmm(r.entero(510, 600))) : masMinutos(ocurrio, r.entero(4, 45));
        if (registrado > ahora) continue;
        const c = { fecha, comida: rotulo, etapa: s, diaTipo, opcion: r.entero(0, opciones.length - 1), consumo: { status: 'PLAN_PORTIONS' }, ocurrio, registrado, rectificacion: null, anulacion: null, diferente: null };
        const finDeSemana = dds >= 5 || (dds === 4 && rotulo === 'Cena');
        const x = r.numero();
        const pDiferente = rotulo === 'Cena' && finDeSemana ? 0.28 : rotulo === 'Almuerzo' && dds < 5 ? 0.07 : 0.04;
        if (x < pDiferente && DIFERENTES[rotulo]) {
          const [descripcion, aproximada] = r.uno(DIFERENTES[rotulo]);
          c.diferente = { descripcion, aproximada };
        } else if (x < pDiferente + 0.12) {
          const items = opciones[c.opcion][1];
          c.consumo = { status: 'REPORTED', factores: items.map(() => (r.si(0.08) ? 'NO_COMIDO' : unDecimal(r.entre(0.6, 1.3)))) };
        } else if (x < pDiferente + 0.19) {
          c.consumo = { status: 'UNCONFIRMED' };
          if (r.si(0.25)) {
            const momento = masMinutos(registrado, r.entero(60, 900));
            if (momento <= ahora) c.rectificacion = { momento };
          }
        }
        if (!c.diferente && r.si(0.005)) {
          const momento = masMinutos(registrado, r.entero(5, 120));
          if (momento <= ahora) c.anulacion = { motivo: 'La registré por error', momento };
        }
        salida.comidas.push(c);
      }
    }
  }

  // ─── Sesiones ─────────────────────────────────────────────────────────────────────────────────────────────────
  if (etapasT.length) {
    const rotacion = new Map();
    for (let dia = 0; dia <= p.dias; dia++) {
      const fecha = fechaDe(dia);
      const s = etapaVigente(etapasT, dia);
      if (s < 0) continue;
      const etapa = etapasT[s];
      if (!etapa.dias.includes(diaDeLaSemana(fecha))) continue;
      if (enPausa(p, dia)) continue;
      const n = rotacion.get(s) ?? 0;
      rotacion.set(s, n + 1);
      const sesion = etapa.sesiones[n % etapa.sesiones.length];
      const ocurrio = instante(fecha, hhmm(etapa.hora * 60 + r.entero(0, 30)));
      const registrado = r.si(0.05) ? instante(diaMenos(hoy, p.dias - dia - 1), hhmm(r.entero(480, 660))) : masMinutos(ocurrio, r.entero(55, 95));
      if (registrado > ahora) continue;
      const base = { fecha, etapa: s, sesion: sesion.id, ocurrio, registrado, condicion: 'REALIZADA', granularidad: 'SERIE', motivo: null, ejercicios: [] };
      if (!r.si(p.asistencia ?? 0.85)) {
        if (r.si(0.3)) salida.sesiones.push({ ...base, condicion: 'NO_REALIZADA', granularidad: null, motivo: r.uno(p.clave === 'federico' ? ['Golpe en el partido del sábado', 'Viaje con el club', 'Trabajo'] : MOTIVOS_DE_FALTA) });
        continue;
      }
      const mes = mesDe(dia);
      const sinRir = r.si(0.08);
      const resumida = r.si(0.03);
      for (const x of sesion.rx) {
        const c = curva(p.fuerza[x.curva ?? x.ejercicio] ?? [[0, 0]]);
        if (x.resumen || resumida) {
          const texto = x.resumen === 's' ? `${x.series} × ${redondear(c(mes), 5)} s` : x.resumen === 'min' ? `${Math.round(c(mes))} minutos a paso ligero` : 'Hecho completo, sin anotar las series';
          base.ejercicios.push({ prescriptionId: idDePrescripcion(etapa, sesion, x), ejercicio: x.ejercicio, resumen: texto });
          continue;
        }
        const sets = [];
        for (let j = 1; j <= x.series; j++) {
          const ultima = j === x.series;
          if (x.sinCarga) {
            const reps = Math.max(1, Math.round(c(mes) - (j - 1) * 0.5 + r.ruido(0.5)));
            sets.push({ setIndex: j, load: null, completedRepetitions: reps, rir: x.rir === null || sinRir ? null : Math.max(0, x.rir - (ultima ? 1 : 0)), perceivedExertion: null });
          } else {
            const carga = Math.max(x.paso ?? 2.5, redondear(c(mes) * (1 + r.ruido(0.012)), x.paso ?? 2.5));
            const reps = Math.max(1, x.reps - (ultima && r.si(0.3) ? 1 : 0));
            sets.push({ setIndex: j, load: { value: carga, unit: 'kg' }, completedRepetitions: reps, rir: x.rir === null || sinRir ? null : Math.max(0, x.rir - (ultima ? 1 : 0)), perceivedExertion: null });
          }
        }
        base.ejercicios.push({ prescriptionId: idDePrescripcion(etapa, sesion, x), ejercicio: x.ejercicio, sets });
      }
      if (resumida) base.granularidad = 'EJERCICIO_O_SESION';
      else if (r.si(0.03) && base.ejercicios.length > 2) {
        base.condicion = 'REALIZADA_CON_DESVIO';
        base.motivo = 'Llegué tarde y no hice el último ejercicio';
        base.ejercicios = base.ejercicios.slice(0, -1);
      }
      salida.sesiones.push(base);
    }
  }

  // ─── Tomas ────────────────────────────────────────────────────────────────────────────────────────────────────
  if (p.areas.ANTROPOMETRIA) {
    const curvas = Object.fromEntries(Object.entries(p.medidas).map(([k, v]) => [k, curva(v)]));
    const dias = [];
    for (let dia = 0; dia < p.dias; dia += p.cadaDias) {
      let d = Math.min(p.dias - 1, dia + (dia === 0 ? 0 : r.entero(-3, 3)));
      while (enPausa(p, d) && d < p.dias - 1) d++;
      if (!dias.includes(d)) dias.push(d);
    }
    if (p.tomaDeAyer && !dias.includes(p.dias - 1)) dias.push(p.dias - 1);
    for (const dia of dias) {
      const fecha = fechaDe(dia);
      const mes = mesDe(dia);
      const hora = hhmm(r.entero(480, 570));
      const mediciones = [['peso', unDecimal(curvas.peso(mes) + r.ruido(0.25)), 'kg'], ['talla', unDecimal(p.talla + r.ruido(0.15)), 'cm'], ['edad', edad(p.nacimiento, fecha), 'años']];
      for (const [metrica, c] of Object.entries(curvas)) {
        if (metrica === 'peso' || metrica === 'suma6') continue;
        mediciones.push([metrica, unDecimal(c(mes) + r.ruido(0.3)), 'cm']);
      }
      if (curvas.suma6 && !p.sinPliegues) {
        const suma = curvas.suma6(mes);
        for (const [metrica, parte] of PLIEGUES[p.sexo]) mediciones.push([metrica, unDecimal(Math.max(3, suma * parte * (1 + r.ruido(0.04)))), 'mm']);
      }
      const ocurrio = instante(fecha, hora);
      salida.tomas.push({ fecha, ocurrio, registrado: masMinutos(ocurrio, r.entero(15, 45)), mediciones });
    }
  }
  return salida;
}

/**
 * Las revisiones de cada área, en orden: las que abren una etapa (con su resultado), las intermedias (MANTENER) y la
 * próxima revisión que acuerda cada una (la fecha de la siguiente, o la que declara la persona para la última).
 */
export function revisionesDe(p, area, hoy) {
  const fechaDe = (dia) => diaMenos(hoy, p.dias - dia);
  const etapas = etapasDe(p, area);
  const lista = [];
  for (const e of etapas) if (e.indice > 0 && e.revision) lista.push({ ...e.revision, dia: e.dia, etapa: e.indice, proximaDias: e.proxima });
  for (const x of (area === 'NUTRICION' ? p.intermediasNut : p.intermediasTrn) ?? []) lista.push({ ...x, dia: diaDe(p, x), etapa: null, proximaDias: x.proxima });
  lista.sort((a, b) => a.dia - b.dia);
  let anterior = 0;
  return lista.map((x, i) => {
    const siguiente = lista[i + 1];
    const proxima = x.proximaDias !== undefined ? diaMenos(hoy, -x.proximaDias) : siguiente ? fechaDe(siguiente.dia) : null;
    const periodo = { inicio: fechaDe(anterior), fin: fechaDe(Math.max(anterior, x.dia - 1)) };
    anterior = x.dia;
    return { ...x, area, fecha: fechaDe(x.dia), proxima, periodo };
  });
}
