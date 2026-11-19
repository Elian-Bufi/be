// WP-ENTORNO-DEL-TUTOR (DL-184) · la historia entera de la muestra, como datos: pura, sin base ni API (REQ-TUT-60).
//
// - **Semilla fija** (REQ-TUT-61): con la misma semilla, el mismo `origen` y el mismo `hoy`, la misma historia, byte a byte.
// - **El azar es por día** (`azar(semilla|persona|área|día)`): el día 40 de Tomás sale igual se arme la historia hasta hoy o
//   hasta dentro de una semana. Por eso «ponerse al día» agrega los días que faltan sin tocar los anteriores: la historia
//   con el mismo `origen` y un `hoy` posterior contiene a la anterior (TUT-D05).
// - **Fechas relativas** (REQ-TUT-63): `origen` es el día en que se armó la muestra; cada persona empieza `semanas` antes.
//   Nada ocurre después de `ahora`.
// - **Las cuentas las hace BE** (R-NUT-03, R-ANT-06): la historia lleva cantidades de alimentos y sitios crudos, nunca
//   totales ni resultados.
import { createHash } from 'node:crypto';
import { azar, curva, diaDeLaSemana, diaMenos, hhmm, instante, masMinutos } from '../../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/herramientas.mjs';
import { ALIMENTO, SEIS_CON_BARRA, ejercicio, nutrientesDe } from './catalogo.mjs';
import { COLEGAS, DIFERENTES, EJ, HORARIO_DE_COMIDAS, PERSONAS, PROFESIONAL, SEMILLA, comidasDe } from './personas.mjs';
import { HERRAMIENTAS } from './herramientas.mjs';
import { NOTAS, textoDeRevision } from './textos.mjs';

export const ZONA = 'America/Argentina/Buenos_Aires';
/** La fecha civil de hoy en Buenos Aires. */
export const hoyEnBuenosAires = () => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const SEMANA = 7;
const r2 = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;

/** Días entre dos fechas civiles (b − a). */
export const diasEntre = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const masDias = (fecha, k) => diaMenos(fecha, -k);

// ─── Cargas que existen (R-TRN-02) ────────────────────────────────────────────────────────────────────────────

export function pasoDeCarga(equipamiento, nombre, carga) {
  if (equipamiento === 'BARRA') return (nombre === EJ.banca || nombre === EJ.militar) && carga < 60 ? 1.25 : 2.5;
  if (equipamiento === 'MANCUERNA') return carga <= 10 ? 1 : 2;
  if (equipamiento === 'MAQUINA') return nombre === EJ.prensa ? 5 : 2.5;
  if (equipamiento === 'POLEA') return 2.5;
  return null;
}
const aPaso = (v, paso) => Math.round(Math.floor(v / paso + 1e-9) * paso * 100) / 100;
const alPasoMasCercano = (v, paso) => Math.round(Math.round(v / paso) * paso * 100) / 100;

/** Epley con repeticiones equivalentes (n + RIR), la cuenta de BE (ED-71). */
export const epley = (carga, reps, rir) => (reps + rir <= 1 ? carga : carga * (1 + (reps + rir) / 30));

// ─── Las fechas de cada persona ───────────────────────────────────────────────────────────────────────────────

function marco(p, origen, hoy) {
  const fin = p.finalizadoHaceSemanas ? masDias(origen, -p.finalizadoHaceSemanas * SEMANA) : null;
  const inicio = masDias(fin ?? origen, -p.semanas * SEMANA);
  const ultimo = fin ?? hoy;
  const dias = diasEntre(inicio, ultimo);
  // Las cuotas (por mes y por semana) se reparten sobre el mes y la semana enteros, aunque terminen después de hoy: así,
  // ponerse al día no cambia lo que ya estaba (lo que cae después de `ahora` se descarta).
  const finDeMes = new Date(Date.UTC(Number(ultimo.slice(0, 4)), Number(ultimo.slice(5, 7)), 0)).toISOString().slice(0, 10);
  const alcance = Math.max(diasEntre(inicio, finDeMes), Math.ceil((dias + 1) / SEMANA) * SEMANA - 1);
  const diasAlOrigen = diasEntre(inicio, fin ?? origen);
  return { inicio, fin, ultimo, dias, alcance, diasAlOrigen, fecha: (d) => masDias(inicio, d), semana: (d) => d / SEMANA };
}

/** Si el día cae en una pausa de la persona: la pausa, o null. `area` = 'TRN' | 'NUT' | 'ANT'. */
function pausaDe(p, d, area) {
  for (const pa of p.pausas ?? []) {
    const desde = pa.semana * SEMANA;
    if (d >= desde && d < desde + pa.dias && (area === 'TRN' || pa.todo)) return pa;
  }
  return null;
}

const vigente = (versiones, d) => {
  let i = -1;
  for (let k = 0; k < versiones.length; k++) if (versiones[k].semana * SEMANA <= d) i = k;
  return i;
};

// ─── Entrenamiento ────────────────────────────────────────────────────────────────────────────────────────────

/** La caminata del comienzo de cada sesión de las personas en profundidad: 10 minutos, como resumen. */
const ENTRADA_EN_CALOR = { ej: EJ.caminata, series: 1, reps: null, rir: null, minutos: 15, descanso: 0 };

/** La estructura de una versión del plan, en la forma de entrada de la API (fases, sesiones, bloques, calentamiento). */
export function estructuraDeEntrenamiento(p, version) {
  const sesiones = version.sesiones.map((s) => sesionDelPlan(p, version, s));
  return { blocks: [{ label: version.nombre, purpose: version.proposito ?? null, sessions: sesiones }] };
}

function rxDeLaSesion(p, s) {
  return [...(p.liviana ? [] : [ENTRADA_EN_CALOR]), ...s.rx];
}
export const idDeRx = (s, x, i) => `${s.id}-${i + 1}`;

function sesionDelPlan(p, version, s) {
  const lista = rxDeLaSesion(p, s);
  const prescripciones = lista.map((x, i) => {
    const e = ejercicio(x.ej);
    const base = { prescriptionId: idDeRx(s, x, i), exerciseVersionId: e.versionId, intensity: x.rir === null ? null : { criterion: 'RIR', target: { value: x.rir } } };
    if (x.minutos) return { ...base, sets: [{ repetitions: null }], professionalParameters: [{ label: 'Duración', value: x.minutos, unit: 'min' }] };
    if (x.segundos) return { ...base, sets: Array.from({ length: x.series }, () => ({ repetitions: null, restSeconds: x.descanso })), professionalParameters: [{ label: 'Tiempo', value: x.segundos, unit: 's' }] };
    const reps = x.reps[0] === x.reps[1] ? { value: x.reps[0] } : { min: x.reps[0], max: x.reps[1] };
    const calentamiento = Array.from({ length: x.calent ?? 0 }, (_, k) => ({ repetitions: { value: [8, 5, 3][k] ?? 3 }, setKind: 'WARM_UP', restSeconds: 60 }));
    const efectivas = Array.from({ length: x.series }, () => ({ repetitions: reps, rir: x.rir, ...(x.bloque ? {} : { restSeconds: x.descanso }) }));
    return {
      ...base,
      sets: [...calentamiento, ...efectivas],
      ...(e.equipamiento === 'MANCUERNA' ? { loadBasis: 'PER_IMPLEMENT' } : {}),
      ...(x.porLado ? { repetitionBasis: 'PER_SIDE' } : {}),
      ...(x.bloque ? { exerciseGroupId: x.bloque } : {}),
    };
  });
  return { sessionId: s.id, label: s.label, prescriptions: prescripciones, ...(s.bloques ? { exerciseGroups: s.bloques } : {}) };
}

/** La capacidad real (1RM) de un ejercicio en el día `d`, con la vuelta de una pausa larga (R-TRN-12) ya en la curva. */
const capacidad = (p, nombre, d) => curva(p.fuerza?.[nombre] ?? [[0, 0]])(d / SEMANA);

/**
 * Las series de una prescripción en una sesión (R-TRN-02 a 06 y 13): la carga sale de la capacidad del día con el RIR
 * indicado; el RIR registrado es el que implica esa carga ya redondeada, con la fatiga de una serie a la siguiente.
 */
function seriesDe(p, version, x, d, progreso, r, ultimas = new Map()) {
  const e = ejercicio(x.ej);
  const cap = capacidad(p, x.ej, d);
  const descarga = version.descarga ?? null;
  const [min, max] = x.reps;
  let reps = Math.min(max, min + Math.floor((max - min + 1) * Math.min(0.999, Math.max(0, progreso + r.ruido(0.12)))));
  const meseta = p.meseta && p.meseta.ejercicio === x.ej && d >= p.meseta.desde * SEMANA && d < p.meseta.hasta * SEMANA ? p.meseta : null;
  const rirIndicado = x.rir;
  let carga = null;
  let rirReal = null;
  if (e.equipamiento !== 'CORPORAL') {
    const rirParaLaCarga = descarga ? 2 : rirIndicado;
    const bruta = (cap / (1 + (reps + rirParaLaCarga) / 30)) * (descarga ?? 1);
    const paso = pasoDeCarga(e.equipamiento, x.ej, bruta);
    carga = Math.max(paso, alPasoMasCercano(bruta, paso));
    // Si el paso más cercano deja el RIR medio punto por debajo de lo indicado, la persona elige el de abajo.
    if (!descarga && (cap / carga - 1) * 30 - reps < rirParaLaCarga - 0.5) carga = Math.max(paso, aPaso(bruta, paso));
    // Dentro de una versión, la carga de un ejercicio no baja de una sesión a la otra: se ajusta el RIR (R-TRN-11).
    const clave = `${x.ej}|${version.nombre}`;
    if (!descarga && ultimas.has(clave) && ultimas.get(clave) > carga && (cap / ultimas.get(clave) - 1) * 30 - reps >= 0.3) carga = ultimas.get(clave);
    if (!descarga) ultimas.set(clave, carga);
    if (meseta) {
      carga = meseta.carga;
      reps = meseta.reps;
    }
    rirReal = (cap / carga - 1) * 30 - reps;
  } else {
    rirReal = rirIndicado + 0.4;
  }
  const sets = [];
  const avance = meseta ? (d - meseta.desde * SEMANA) / ((meseta.hasta - meseta.desde) * SEMANA) : 0;
  for (let j = 1; j <= x.series; j++) {
    let rir;
    let repsJ = reps;
    if (meseta) {
      // La meseta (REQ-TUT-19): a igual carga, el RIR registrado baja de 2 a 0 en diez semanas.
      rir = Math.max(0, Math.min(2, Math.round(2 - 2.2 * avance - 0.35 * (j - 1) + r.ruido(0.25))));
    } else if (descarga) {
      rir = j === x.series ? 3 : 4;
    } else {
      const v = rirReal - 0.3 * (j - 1) + r.ruido(0.2);
      // Casi nadie llega al fallo: si la serie se acerca, la persona corta una repetición antes y anota 1.
      if (v < 0.5 && carga !== null) {
        repsJ = Math.max(1, reps - 1);
        rir = Math.max(0, Math.min(1, Math.round(v + 1)));
      } else rir = Math.max(0, Math.min(5, Math.round(v)));
    }
    // A igual carga, el RIR no sube de una serie a la siguiente, ni las repeticiones (R-TRN-05).
    const previa = sets[sets.length - 1];
    if (previa) {
      rir = Math.min(rir, previa.rir ?? rir);
      repsJ = Math.min(repsJ, previa.completedRepetitions + 1);
    }
    sets.push({ setIndex: j, load: carga === null ? null : { value: carga, unit: 'kg' }, completedRepetitions: repsJ, rir, perceivedExertion: null });
  }
  // El esfuerzo percibido, en la última serie de cada ejercicio (R-TRN-13).
  const ultima = sets[sets.length - 1];
  ultima.perceivedExertion = { 0: 9, 1: 8, 2: 7, 3: 6, 4: 5, 5: 5 }[ultima.rir] ?? 6;
  const calentamiento = [];
  if (x.calent && carga !== null) {
    const pct = [0.45, 0.62, 0.78].slice(3 - x.calent);
    const repsC = [8, 5, 3].slice(3 - x.calent);
    pct.forEach((f, k) => {
      const paso = pasoDeCarga(e.equipamiento, x.ej, carga * f);
      calentamiento.push({ load: { value: Math.max(paso, aPaso(carga * f, paso)), unit: 'kg' }, completedRepetitions: repsC[k], rir: null, perceivedExertion: null, setKind: 'WARM_UP' });
    });
  }
  // La numeración: el calentamiento arriba (DL-178), y cada valor escrito por la persona (ED-70).
  const todas = [...calentamiento, ...sets].map((s, i) => {
    const conValor = ['load', 'completedRepetitions', 'rir'].filter((c) => s[c] !== null);
    return { ...s, setIndex: i + 1, recordedAs: 'TYPED', fieldOrigins: Object.fromEntries(conValor.map((c) => [c, 'PERSON'])) };
  });
  return todas;
}

function sesionesDe(p, m, ahora, hoy) {
  if (!p.trn?.length) return [];
  // Primera pasada: las ocurrencias indicadas, fuera de las pausas.
  const indicadas = [];
  const rotacion = new Map();
  for (let d = 0; d <= m.alcance; d++) {
    const fecha = m.fecha(d);
    const v = vigente(p.trn, d);
    if (v < 0) continue;
    const version = p.trn[v];
    if (!version.dias.includes(diaDeLaSemana(fecha))) continue;
    if (pausaDe(p, d, 'TRN')) continue;
    const n = rotacion.get(v) ?? 0;
    rotacion.set(v, n + 1);
    indicadas.push({ d, fecha, v, sesion: version.sesiones[n % version.sesiones.length] });
  }
  // Las faltas, por mes, agrupadas (R-TRN-10): una o dos rachas.
  const porMes = new Map();
  for (const o of indicadas) {
    const k = o.fecha.slice(0, 7);
    if (!porMes.has(k)) porMes.set(k, []);
    porMes.get(k).push(o);
  }
  const falta = new Set();
  const asistencia = p.clave === 'silvia' ? [0.74, 0.76] : [0.76, 0.9];
  for (const [mes, lista] of porMes) {
    if (lista.length < 4) continue;
    const r = azar(`${SEMILLA}|${p.clave}|faltas|${mes}`);
    const hechas = Math.max(Math.ceil(lista.length * 0.72), Math.min(Math.floor(lista.length * 0.9), Math.round(lista.length * r.entre(...asistencia))));
    const k = Math.max(1, lista.length - hechas);
    const rachas = k >= 3 && r.si(0.5) ? [Math.ceil(k / 2), Math.floor(k / 2)] : [k];
    for (const largo of rachas) {
      const inicio = r.entero(0, Math.max(0, lista.length - largo));
      for (let i = inicio; i < inicio + largo && i < lista.length; i++) falta.add(lista[i].d);
    }
  }
  const salida = [];
  let resumenes = 0;
  let sustituida = false;
  let rareza = false;
  const ultimas = new Map();
  for (const o of indicadas) {
    const r = azar(`${SEMILLA}|${p.clave}|sesion|${o.d}`);
    const version = p.trn[o.v];
    const [desde, hasta] = p.horario;
    const ocurrio = instante(o.fecha, hhmm(desde + r.entero(0, Math.max(0, hasta - desde - 10))));
    const base = { clave: `${p.clave}|trn|${o.d}`, d: o.d, fecha: o.fecha, version: o.v, sesionId: o.sesion.id, ocurrio, registrado: null, condicion: 'REALIZADA', granularidad: 'SERIE', motivo: null, ejercicios: [], tiempos: null };
    if (falta.has(o.d)) {
      const registradoFalta = masMinutos(ocurrio, r.entero(120, 400));
      if (r.si(0.35) && registradoFalta <= ahora) salida.push({ ...base, condicion: 'NO_REALIZADA', granularidad: null, motivo: r.uno(['Trabajo', 'Turno médico', 'Me quedé sin tiempo', 'Un compromiso familiar']), registrado: registradoFalta });
      continue;
    }
    const tarde = r.si(0.05);
    const registrado = tarde ? instante(masDias(o.fecha, 1), hhmm(r.entero(480, 660))) : masMinutos(ocurrio, r.entero(50, 95));
    if (registrado > ahora) continue;
    // «Ya la hice» (REQ-TUT-31): una o dos al año por persona, sin series.
    const yaLaHice = !p.liviana && resumenes < Math.ceil(p.semanas / 30) && o.d > 20 && r.si(0.012);
    const lista = rxDeLaSesion(p, o.sesion);
    const inicioV = version.semana * SEMANA;
    const finV = (p.trn[o.v + 1]?.semana ?? p.semanas + 10) * SEMANA;
    const progreso = (o.d - inicioV) / Math.max(7, finV - inicioV);
    const ejercicios = lista.map((x, i) => {
      const prescriptionId = idDeRx(o.sesion, x, i);
      if (yaLaHice) return null;
      if (x.minutos) return { prescriptionId, ejercicio: x.ej, resumen: `${x.minutos} minutos de caminata` };
      if (x.segundos) return { prescriptionId, ejercicio: x.ej, resumen: `${x.series} × ${x.segundos} s` };
      // Una vez, con otro ejercicio (GR-01): la sustitución queda registrada con el ejercicio que hizo.
      if (p.sustitucion && x.ej === p.sustitucion.de && !sustituida && o.d >= p.sustitucion.semana * SEMANA) {
        sustituida = true;
        const otro = { ...x, ej: p.sustitucion.a, calent: 0 };
        return { prescriptionId, ejercicio: p.sustitucion.a, sustituido: true, sets: seriesDe(p, version, otro, o.d, progreso, azar(`${SEMILLA}|${p.clave}|series|${o.d}|${i}`), ultimas) };
      }
      const sets = seriesDe(p, version, x, o.d, progreso, azar(`${SEMILLA}|${p.clave}|series|${o.d}|${i}`), ultimas);
      // Una serie con un RIR fuera de lo esperado (R-RAR): la persona anotó 4 donde la carga dice 1 o 2.
      if (p.rareza && !rareza && o.d >= p.rareza.semana * SEMANA && !version.descarga && x.calent === undefined && sets.length >= 3 && sets[1].load) {
        rareza = true;
        sets[1] = { ...sets[1], rir: 4, rareza: 'RIR_FUERA_DE_LO_ESPERADO' };
        for (let k = 2; k < sets.length; k++) sets[k] = { ...sets[k], rir: Math.min(sets[k].rir, 4) };
      }
      return { prescriptionId, ejercicio: x.ej, sets };
    });
    if (yaLaHice) {
      resumenes++;
      salida.push({ ...base, registrado, granularidad: 'EJERCICIO_O_SESION', resumenDeSesion: 'Hice la rutina completa; no anoté las series.', ejercicios: lista.map((x, i) => ({ prescriptionId: idDeRx(o.sesion, x, i), ejercicio: x.ej, resumen: 'Hecho, sin anotar las series' })) });
      continue;
    }
    const sesion = { ...base, registrado, ejercicios: ejercicios.filter(Boolean) };
    // Los tiempos de la app (R-TRN-07 y 08): en las personas en profundidad, las últimas doce semanas.
    if (!p.liviana && p.clave !== 'silvia' && diasEntre(o.fecha, hoy) <= 84) sesion.tiempos = tiemposDe(o.sesion, lista, sesion, azar(`${SEMILLA}|${p.clave}|tiempos|${o.d}`));
    salida.push(sesion);
  }
  return salida;
}

/** Los tiempos de una sesión con el cronómetro: inicio, cada serie, cada descanso y el fin, con lo indicado al lado. */
function tiemposDe(sesion, lista, registrada, r) {
  const eventos = [];
  let t = registrada.ocurrio.getTime();
  const inicio = t;
  let indicado = 0;
  const descansos = [];
  const marcar = (tipo, extra = {}) => eventos.push({ tipo, en: new Date(t), ...extra });
  marcar('SESSION_STARTED');
  const bloques = new Map((sesion.bloques ?? []).map((b) => [b.groupId, b]));
  const hechos = new Set();
  for (let i = 0; i < lista.length; i++) {
    const x = lista[i];
    const id = idDeRx(sesion, x, i);
    if (hechos.has(id)) continue;
    const ej = registrada.ejercicios.find((e) => e.prescriptionId === id);
    if (x.minutos) {
      marcar('EXERCISE_ACTIVATED', { prescriptionId: id });
      t += x.minutos * 60_000 * r.entre(0.95, 1.1);
      indicado += x.minutos * 60 + 90;
      t += r.entero(60, 120) * 1000;
      continue;
    }
    if (x.bloque && bloques.get(x.bloque)?.kind === 'ROUNDS') {
      const b = bloques.get(x.bloque);
      const miembros = lista.map((y, k) => ({ y, k })).filter(({ y }) => y.bloque === x.bloque);
      for (let v = 1; v <= b.rounds; v++) {
        for (const { y, k } of miembros) {
          const idM = idDeRx(sesion, y, k);
          hechos.add(idM);
          marcar('EXERCISE_ACTIVATED', { prescriptionId: idM });
          t += r.entero(30, 50) * 1000;
          indicado += 40;
          t += r.entero(15, 30) * 1000;
        }
        if (v < b.rounds) {
          const ultimo = miembros[miembros.length - 1];
          const dur = Math.round(b.restAfterRoundSeconds * r.entre(0.9, 1.3));
          const restId = `d${eventos.length}x${v}`;
          marcar('REST_STARTED', { restId, prescriptionId: idDeRx(sesion, ultimo.y, ultimo.k), setIndex: v, recomendado: b.restAfterRoundSeconds });
          t += dur * 1000;
          marcar('REST_FINISHED', { restId });
          descansos.push({ prescriptionId: idDeRx(sesion, ultimo.y, ultimo.k), principal: false, vuelta: true, segundos: dur, recomendado: b.restAfterRoundSeconds });
          indicado += b.restAfterRoundSeconds;
        }
      }
      t += r.entero(60, 120) * 1000;
      indicado += 90;
      continue;
    }
    marcar('EXERCISE_ACTIVATED', { prescriptionId: id });
    const sets = ej?.sets ?? [];
    const principal = SEIS_CON_BARRA.includes(x.ej) || (x.calent ?? 0) > 0;
    for (let k = 0; k < sets.length; k++) {
      const s = sets[k];
      t += r.entero(30, 50) * 1000;
      indicado += 40;
      if (k === sets.length - 1) break;
      const calent = s.setKind === 'WARM_UP';
      const recomendado = calent ? 60 : x.descanso;
      const dur = Math.round(recomendado * (calent ? r.entre(0.8, 1.3) : r.entre(0.9, 1.3)));
      const restId = `d${eventos.length}s${s.setIndex}`;
      marcar('REST_STARTED', { restId, prescriptionId: id, setIndex: s.setIndex, recomendado });
      t += dur * 1000;
      marcar('REST_FINISHED', { restId });
      descansos.push({ prescriptionId: id, principal, calentamiento: calent, segundos: dur, recomendado });
      indicado += recomendado;
    }
    t += r.entero(60, 120) * 1000;
    indicado += 90;
  }
  marcar('SESSION_FINISHED');
  return { inicio: new Date(inicio), fin: new Date(t), minutos: r1((t - inicio) / 60_000), indicadoMinutos: r1(indicado / 60), descansos, eventos };
}

// ─── Nutrición ────────────────────────────────────────────────────────────────────────────────────────────────

const REPARTO = {
  4: { Desayuno: 0.23, Almuerzo: 0.33, Merienda: 0.13, Cena: 0.31 },
  5: { Desayuno: 0.2, Colación: 0.08, Almuerzo: 0.3, Merienda: 0.12, Cena: 0.3 },
};

/** Los macronutrientes del objetivo, que cierran con 4/4/9 (R-NUT-01). */
export function macrosDe(v) {
  if (v.macros) return v.macros;
  const p = Math.round(v.peso * v.proteina);
  const g = Math.round(v.peso * v.grasa);
  const c = Math.round((v.kcal - p * 4 - g * 9) / 4);
  return { p, c, g };
}

/** El plan de una versión: días tipo (entrenamiento y descanso, o uno solo), comidas y opciones escaladas a la energía. */
export function planNutricionalDe(p, v) {
  const dieta = comidasDe(p.dieta ?? 'comun');
  const n = v.kcal >= 2800 ? 5 : 4;
  const reparto = REPARTO[n];
  const dias = v.dias === 'ENTRENA' ? [['Día de entrenamiento', 1.06], ['Día de descanso', 0.92]] : [['Todos los días', 1]];
  return dias.map(([rotulo, factor]) => ({
    rotulo,
    factor,
    kcal: Math.round(v.kcal * factor),
    comidas: Object.entries(reparto).map(([comida, parte]) => ({
      rotulo: comida,
      opciones: dieta[comida].map(([rotuloOpcion, items]) => {
        const objetivo = v.kcal * factor * parte;
        const escala = objetivo / nutrientesDe(items).kcal;
        return { rotulo: rotuloOpcion, items: items.map(([clave, g]) => [clave, Math.max(5, Math.round((g * escala) / 5) * 5)]) };
      }),
    })),
  }));
}

/** La estructura del plan nutricional en la forma de entrada de la API. */
export function estructuraNutricional(plan) {
  return {
    dayTypes: plan.map((dia) => ({
      label: dia.rotulo,
      meals: dia.comidas.map((c) => ({
        label: c.rotulo,
        prescriptionMode: 'DISH_OPTIONS',
        options: c.opciones.map((o) => ({ label: o.rotulo, items: o.items.map(([clave, g]) => ({ catalogItemId: ALIMENTO[clave].id, quantity: { value: g, unit: 'g' }, preparationState: ALIMENTO[clave].estado })) })),
      })),
    })),
  };
}

/**
 * La razón media entre lo registrado y lo indicado en los días de semana de cada etapa, para que el balance cierre con
 * el peso de las tomas (R-NUT-09): el gasto de Mifflin-St Jeor por la actividad declarada, el cambio de peso de la etapa
 * y un subregistro de 1,15. Los fines de semana van de 1,13 a 1,21 (R-NUT-04); los días de semana, lo que falta, dentro
 * de 0,83 a 1,02.
 */
function razonDeLaSemana(p, i) {
  const v = p.nut[i];
  const desde = v.semana;
  const hasta = p.nut[i + 1]?.semana ?? p.semanas;
  const peso = (s) => (p.ant ? curva(p.ant.peso)(s) : v.peso);
  const pm = (peso(desde) + peso(hasta)) / 2;
  const gasto = (10 * pm + 6.25 * p.talla - 5 * p.edad + (p.sexo === 'H' ? 5 : -161)) * p.actividad;
  const dias = Math.max(7, (hasta - desde) * SEMANA);
  const ingesta = gasto + ((peso(hasta) - peso(desde)) * 7700) / dias;
  const razon = ingesta / 1.15 / v.kcal;
  return Math.max(0.86, Math.min(1.0, (7 * razon - 2 * 1.17) / 5));
}

function comidasDelDia(p, m, ahora, hoy) {
  if (!p.nut?.length || p.areas.NUTRICION !== 'J') return [];
  const planes = p.nut.map((v) => planNutricionalDe(p, v));
  const razones = p.nut.map((_, i) => razonDeLaSemana(p, i));
  let alternar = 0;
  const salida = [];
  // Las cuotas por mes (R-NUT-04): días sin registro, días con algo que falta y comidas cargadas al día siguiente.
  const meses = new Map();
  for (let d = 0; d <= m.alcance; d++) {
    if (pausaDe(p, d, 'NUT')) continue;
    const k = m.fecha(d).slice(0, 7);
    if (!meses.has(k)) meses.set(k, []);
    meses.get(k).push(d);
  }
  const tipoDeDia = new Map();
  for (const [mes, dias] of meses) {
    const r = azar(`${SEMILLA}|${p.clave}|nut-mes|${mes}`);
    const mezcla = [...dias].sort((a, b) => azar(`${SEMILLA}|${p.clave}|orden|${a}`).numero() - azar(`${SEMILLA}|${p.clave}|orden|${b}`).numero());
    const sin = Math.round(dias.length * r.entre(0.13, 0.2));
    const falta = Math.round(dias.length * r.entre(0.12, 0.17));
    mezcla.forEach((d, i) => tipoDeDia.set(d, i < sin ? 'SIN_REGISTRO' : i < sin + falta ? 'FALTA' : 'COMPLETO'));
  }
  // Las comidas diferentes (R-NUT-05): de 1 a 3 por semana, más los fines de semana; Gustavo, el asado del domingo.
  const diferentes = new Set();
  for (let s = 0; s * 7 <= m.alcance; s++) {
    const r = azar(`${SEMILLA}|${p.clave}|diferentes|${s}`);
    const candidatos = [];
    for (let d = s * 7; d < s * 7 + 7 && d <= m.alcance; d++) if (tipoDeDia.get(d) && tipoDeDia.get(d) !== 'SIN_REGISTRO') candidatos.push(d);
    if (!candidatos.length) continue;
    const domingo = candidatos.find((d) => diaDeLaSemana(m.fecha(d)) === 6);
    if (p.registra?.domingoDiferente && domingo !== undefined) diferentes.add(`${domingo}|Almuerzo`);
    const cuantas = r.entero(1, 2);
    for (let i = 0; i < cuantas; i++) {
      const finde = candidatos.filter((d) => diaDeLaSemana(m.fecha(d)) >= 4);
      const d = r.si(0.7) && finde.length ? r.uno(finde) : r.uno(candidatos);
      diferentes.add(`${d}|${r.si(0.75) ? 'Cena' : 'Almuerzo'}`);
    }
  }
  let rectificaciones = 0;
  let soloDesayuno = false;
  const todas = [];
  for (let d = 0; d <= m.alcance; d++) {
    const tipo = tipoDeDia.get(d);
    if (!tipo || tipo === 'SIN_REGISTRO') continue;
    const fecha = m.fecha(d);
    const v = vigente(p.nut, d);
    if (v < 0) continue;
    const plan = planes[v];
    const dds = diaDeLaSemana(fecha);
    const entrena = p.trn?.length ? p.trn[Math.max(0, vigente(p.trn, d))].dias.includes(dds) : false;
    const diaTipo = plan.length > 1 ? (entrena ? 0 : 1) : 0;
    const dia = plan[diaTipo];
    const r = azar(`${SEMILLA}|${p.clave}|nut|${d}`);
    const finde = dds >= 5;
    // En un día completo, la energía registrada respecto de la indicada (R-NUT-04).
    const razon = finde ? r.entre(1.13, 1.21) : Math.max(0.85, Math.min(1.02, razones[v] + r.ruido(0.025)));
    let faltante = null;
    if (tipo === 'FALTA') faltante = !soloDesayuno && d > 30 && r.si(0.08) ? 'SOLO_DESAYUNO' : r.uno(dia.comidas.slice(1).map((c) => c.rotulo).concat(['SIN_CONFIRMAR']));
    if (faltante === 'SOLO_DESAYUNO') soloDesayuno = true;
    const comidas = [];
    for (const [i, c] of dia.comidas.entries()) {
      if (faltante === 'SOLO_DESAYUNO' && i > 0) continue;
      if (faltante === c.rotulo) continue;
      const rc = azar(`${SEMILLA}|${p.clave}|comida|${d}|${c.rotulo}`);
      const [desde, hasta] = HORARIO_DE_COMIDAS[c.rotulo];
      const ocurrio = instante(fecha, hhmm(desde + rc.entero(0, hasta - desde)));
      const opcion = rc.entero(0, c.opciones.length - 1);
      const base = { clave: `${p.clave}|comida|${d}|${c.rotulo}`, d, fecha, version: v, diaTipo, comida: c.rotulo, opcion, ocurrio, registrado: masMinutos(ocurrio, rc.entero(5, 40)), consumo: { status: 'PLAN_PORTIONS' }, diferente: null, foto: false, rectificacion: null };
      if (diferentes.has(`${d}|${c.rotulo}`)) {
        const lista = DIFERENTES[p.dieta === 'vegetariana' ? 'vegetariana' : 'comun'];
        const asado = p.registra?.domingoDiferente && dds === 6 && c.rotulo === 'Almuerzo';
        const [descripcion, aproximada] = asado ? lista[0] : rc.uno(lista);
        // La mitad, con la cantidad aproximada; la otra mitad, sin ella (BE la muestra «sin dato»).
        base.diferente = { descripcion, aproximada: alternar++ % 2 === 0 ? aproximada ?? 'Un plato' : null };
        base.consumo = null;
      }
      comidas.push(base);
    }
    if (faltante === 'SIN_CONFIRMAR' && comidas.length) {
      const k = r.entero(1, comidas.length - 1);
      if (!comidas[k].diferente) comidas[k].consumo = { status: 'UNCONFIRMED' };
    }
    // Las cantidades del día completo: dos comidas informadas para llegar a la razón del día; el resto, las del plan.
    const conDiferente = comidas.some((c) => c.diferente);
    if (tipo === 'COMPLETO' && !conDiferente) {
      const indicado = dia.kcal;
      const energia = (c) => nutrientesDe(dia.comidas.find((x) => x.rotulo === c.comida).opciones[c.opcion].items).kcal;
      const informadas = comidas.filter((c) => c.comida === 'Almuerzo' || c.comida === 'Cena');
      const fijas = comidas.filter((c) => !informadas.includes(c)).reduce((s, c) => s + energia(c), 0);
      const variables = informadas.reduce((s, c) => s + energia(c), 0);
      const f = Math.max(0.5, Math.min(1.7, (razon * indicado - fijas) / variables));
      for (const c of informadas) {
        const items = dia.comidas.find((x) => x.rotulo === c.comida).opciones[c.opcion].items;
        c.consumo = { status: 'REPORTED', items: items.map(([, g]) => Math.max(5, Math.round((g * f) / 5) * 5)) };
      }
    }
    // Las fotos (R-NUT-08): un tercio de las comidas de Carolina, algunas de Valeria; nadie más.
    for (const c of comidas) {
      const rc = azar(`${SEMILLA}|${p.clave}|foto|${c.clave}`);
      c.foto = (p.registra?.fotos ?? 0) > 0 && rc.si(p.registra.fotos);
    }
    for (const c of comidas) todas.push({ ...c, tipoDeDia: tipo });
  }
  // Lo cargado al día siguiente (R-NUT-04: de 5 a 10 de cada 100 comidas): una cuota por mes, entre las registradas.
  const porMes = new Map();
  for (const c of todas) {
    const k = c.fecha.slice(0, 7);
    if (!porMes.has(k)) porMes.set(k, []);
    porMes.get(k).push(c);
  }
  for (const [mes, lista] of porMes) {
    const r = azar(`${SEMILLA}|${p.clave}|tardias|${mes}`);
    const k = Math.round(lista.length * r.entre(0.065, 0.085));
    const elegibles = [...lista];
    for (let i = 0; i < k && elegibles.length; i++) {
      const c = elegibles.splice(r.entero(0, elegibles.length - 1), 1)[0];
      c.registrado = instante(masDias(c.fecha, 1), hhmm(r.entero(480, 630)));
    }
  }
  for (const c of todas) {
    // Una o dos comidas corregidas por la persona en el año (R-RAR).
    const rc = azar(`${SEMILLA}|${p.clave}|rectifica|${c.clave}`);
    if (!p.liviana && rectificaciones < Math.ceil(p.semanas / 40) && c.consumo?.status === 'UNCONFIRMED' && rc.si(0.4)) {
      rectificaciones++;
      c.rectificacion = { momento: masMinutos(c.registrado, rc.entero(90, 600)) };
    }
    if (c.registrado <= ahora && c.ocurrio <= ahora && (!c.rectificacion || c.rectificacion.momento <= ahora)) salida.push(c);
  }
  return salida;
}

// ─── Antropometría ────────────────────────────────────────────────────────────────────────────────────────────

/** Las proporciones de cada pliegue en la suma de seis, y las de bíceps y cresta ilíaca respecto de ella (R-ANT-03). */
const PLIEGUES = {
  H: { 'pliegue-triceps': 0.14, 'pliegue-subescapular': 0.17, 'pliegue-supraespinal': 0.14, 'pliegue-abdominal': 0.25, 'pliegue-muslo-frontal': 0.19, 'pliegue-pantorrilla': 0.11 },
  M: { 'pliegue-triceps': 0.18, 'pliegue-subescapular': 0.14, 'pliegue-supraespinal': 0.12, 'pliegue-abdominal': 0.19, 'pliegue-muslo-frontal': 0.24, 'pliegue-pantorrilla': 0.13 },
};
const EXTRA = { H: { 'pliegue-biceps': 0.05, 'pliegue-cresta-iliaca': 0.17 }, M: { 'pliegue-biceps': 0.08, 'pliegue-cresta-iliaca': 0.15 } };
export const SITIOS_DE_LA_SUMA = Object.keys(PLIEGUES.H);
const PERIMETROS = { cintura: 'perimetro-cintura', cadera: 'perimetro-cadera', brazoRelajado: 'perimetro-brazo-relajado', brazoFlex: 'perimetro-brazo-flexionado', muslo: 'perimetro-muslo', pantorrilla: 'perimetro-pantorrilla' };

function tomasDe(p, m, ahora) {
  if (p.areas.ANTROPOMETRIA !== 'J' || !p.ant) return [];
  const dias = [];
  for (let d = 0; d <= m.diasAlOrigen; d += p.ant.cada * SEMANA) {
    let x = d === 0 ? 0 : d + azar(`${SEMILLA}|${p.clave}|toma-dia|${d}`).entero(-2, 2);
    if (pausaDe(p, x, 'ANT')) continue;
    if (x <= m.diasAlOrigen && !dias.includes(x)) dias.push(x);
  }
  if (p.vuelta) {
    const vuelta = p.vuelta.semana * SEMANA + 1;
    if (!dias.includes(vuelta)) dias.push(vuelta);
    dias.sort((a, b) => a - b);
  }
  const ruido = {};
  const conHueco = !p.liviana && dias.length >= 4 ? dias[Math.floor(dias.length / 2)] : null;
  const salida = [];
  for (const d of dias) {
    const r = azar(`${SEMILLA}|${p.clave}|toma|${d}`);
    const fecha = m.fecha(d);
    const s = d / SEMANA;
    const val = (k) => curva(p.ant[k])(s);
    const ar = (k, desvio) => (ruido[k] = 0.5 * (ruido[k] ?? 0) + r.ruido(desvio));
    const mediciones = [
      ['peso', r1(val('peso') + r.ruido(0.12)), 'kg'],
      ['talla', r1(p.talla + r.ruido(0.1)), 'cm'],
      ['edad', p.edad - (diasEntre(fecha, m.fecha(m.diasAlOrigen)) > 180 ? 1 : 0), 'años'],
    ];
    const suma = val('suma6');
    for (const [sitio, parte] of Object.entries({ ...PLIEGUES[p.sexo], ...EXTRA[p.sexo] })) mediciones.push([sitio, r1(Math.max(3, suma * parte * (1 + ar(sitio, 0.012)))), 'mm']);
    for (const [k, metrica] of Object.entries(PERIMETROS)) mediciones.push([metrica, r1(val(k) * (1 + ar(metrica, 0.0018))), 'cm']);
    mediciones.push(['diametro-humero', r1(p.ant.humero + r.ruido(0.03)), 'cm'], ['diametro-femur', r1(p.ant.femur + r.ruido(0.03)), 'cm']);
    // Una toma por persona, una sola, con un sitio sin medir (REQ-TUT-37).
    const finales = d === conHueco ? mediciones.filter(([k]) => k !== 'pliegue-pantorrilla') : mediciones;
    const ocurrio = instante(fecha, hhmm(r.entero(8 * 60, 9 * 60 + 30)));
    const registrado = masMinutos(ocurrio, r.entero(20, 45));
    if (registrado > ahora) continue;
    salida.push({ clave: `${p.clave}|toma|${d}`, d, fecha, ocurrio, registrado, mediciones: finales, sitioSinMedir: d === conHueco ? 'pliegue-pantorrilla' : null, condiciones: 'En ayunas, a la mañana, sin entrenar ese día' });
  }
  return salida;
}

// ─── Revisiones, notas y lo de hoy ────────────────────────────────────────────────────────────────────────────

/**
 * Las revisiones de un área (REQ-TUT-15): la que abre cada versión, más las de seguimiento cada 3 a 6 semanas, de lunes
 * a sábado, en horario de trabajo, nunca en una pausa larga. La última fija la próxima, que arma «Te toca a vos».
 */
function revisionesDe(p, m, area, proximaDe) {
  const versiones = area === 'ENTRENAMIENTO' ? p.trn : p.nut;
  if (!versiones?.length || p.areas[area] !== 'J') return [];
  const hitos = versiones.map((v, i) => ({ d: v.semana * SEMANA, version: i })).filter((h) => h.version > 0);
  const lista = [];
  const fin = m.diasAlOrigen;
  // Los tramos entre hitos, sin las pausas largas: cada tramo se reparte en partes iguales de 3 a 6 semanas.
  const largas = (p.pausas ?? []).filter((pa) => pa.todo).map((pa) => [pa.semana * SEMANA, pa.semana * SEMANA + pa.dias]);
  const puntos = [...hitos.map((h) => h.d), fin + 1];
  let anterior = 0;
  for (const limite of puntos) {
    const tramos = [[anterior, limite]];
    for (const [a, b] of largas) {
      const t = tramos.findIndex(([x, y]) => a > x && a < y);
      if (t >= 0) tramos.splice(t, 1, [tramos[t][0], a], [b + 6, tramos[t][1]]);
    }
    tramos.forEach(([a, b], k) => {
      const largo = b - a;
      // La revisión de la vuelta de una pausa larga, salvo que la vuelta abra una versión nueva enseguida.
      if (k > 0 && !hitos.some((h) => h.d >= a - 7 && h.d < a + 21)) lista.push({ d: a, version: null });
      if (limite === fin + 1 && k === tramos.length - 1) {
        // El último tramo, hasta hoy: cada 4 a 5 semanas; la próxima queda en el futuro.
        for (let d = a + 30; d < b - 5; d += 30) lista.push({ d: d + azar(`${SEMILLA}|${p.clave}|${area}|rev|${d}`).entero(-2, 2), version: null });
        return;
      }
      const partes = largo <= 42 ? 1 : Math.ceil(largo / 38);
      for (let i = 1; i < partes; i++) lista.push({ d: Math.round(a + (largo * i) / partes), version: null });
    });
    const hito = hitos.find((h) => h.d === limite);
    if (hito) lista.push({ d: hito.d, version: hito.version, descarga: !!versiones[hito.version].descarga || !!versiones[hito.version - 1]?.descarga });
    anterior = limite;
  }
  return lista.map((x, i) => {
    let d = x.version !== null && !pausaDe(p, x.d - 1, 'TRN') ? Math.max(0, x.d - 1) : x.d;
    while (diaDeLaSemana(m.fecha(d)) === 6) d--;
    const r = azar(`${SEMILLA}|${p.clave}|${area}|texto|${x.d}`);
    const momento = instante(m.fecha(d), hhmm(r.entero(9 * 60, 19 * 60)));
    const siguiente = lista[i + 1];
    const proxima = siguiente ? m.fecha(siguiente.version !== null ? siguiente.d - 1 : siguiente.d) : proximaDe(area);
    return { clave: `${p.clave}|rev|${area}|${x.d}`, area, d, fecha: m.fecha(d), momento, version: x.version, descarga: !!x.descarga, proxima, periodo: { inicio: m.fecha(i === 0 ? 0 : lista[i - 1].d), fin: m.fecha(Math.max(0, d - 1)) } };
  });
}

/** La foto del día de la profesional (REQ-TUT-14): cuándo vence la próxima revisión de cada seguimiento. */
function proximas(p, hoy) {
  const fijas = { tomas: { ENTRENAMIENTO: 0, NUTRICION: 9 }, gustavo: { NUTRICION: -3, ENTRENAMIENTO: 12 }, valeria: { ENTRENAMIENTO: 6, NUTRICION: 13 }, carolina: { ENTRENAMIENTO: 4, NUTRICION: 16 }, mariana: { ENTRENAMIENTO: 1 }, nicolas: { NUTRICION: 5 } };
  return (area) => {
    const k = fijas[p.clave]?.[area];
    if (k !== undefined) return masDias(hoy, k);
    const r = azar(`${SEMILLA}|${p.clave}|${area}|proxima`);
    return masDias(hoy, r.entero(8, 30));
  };
}

// ─── La muestra entera ────────────────────────────────────────────────────────────────────────────────────────

/**
 * La historia de la muestra. `origen`: el día en que se armó (el «hoy» de la primera carga); `hoy`: hasta dónde llega
 * (igual a `origen`, o posterior para ponerse al día); `ahora`: el instante de corte (nada se registra después).
 */
export function generar({ origen, hoy = origen, ahora = instante(hoy, '20:00') } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(origen ?? '')) throw new Error('Falta el origen (AAAA-MM-DD)');
  if (hoy < origen) throw new Error('hoy no puede ser anterior al origen');
  const personas = PERSONAS.map((p) => {
    const m = marco(p, origen, hoy);
    const prox = proximas(p, origen);
    const tope = m.fin ? instante(m.fin, '23:59') : ahora;
    const versionesTrn = (p.trn ?? []).map((v, i) => ({ n: i + 1, nombre: v.nombre, desde: m.fecha(v.semana * SEMANA), d: v.semana * SEMANA, descarga: !!v.descarga, plantilla: v.plantilla ?? null, dias: v.dias, rirIndicado: v.sesiones.flatMap((s) => s.rx.map((x) => x.rir)).filter((x) => x !== null), estructura: estructuraDeEntrenamiento(p, v) }));
    const versionesNut = p.areas.NUTRICION === 'J' ? (p.nut ?? []).map((v, i) => ({ n: i + 1, nombre: v.nombre, desde: m.fecha(v.semana * SEMANA), d: v.semana * SEMANA, kcal: v.kcal, macros: macrosDe(v), razon: v.razon, peso: v.peso, noEntrena: !!v.noEntrena, plantilla: v.plantilla ?? null, medidasCaseras: !!v.medidasCaseras, plan: planNutricionalDe(p, v) })) : [];
    // Lo que hace la profesional (revisiones y tomas) llega hasta el origen; ponerse al día solo agrega lo que registran
    // las personas (TUT-D05). Los tiempos de la app, en las doce semanas antes del origen.
    const topeProfesional = new Date(Math.min(tope.getTime(), instante(origen, '20:00').getTime()));
    const sesiones = sesionesDe(p, m, tope, origen);
    const comidas = comidasDelDia(p, m, tope, hoy);
    const tomas = tomasDe(p, m, topeProfesional);
    const revisiones = [...revisionesDe(p, m, 'ENTRENAMIENTO', prox), ...revisionesDe(p, m, 'NUTRICION', prox)].filter((x) => x.momento <= topeProfesional).sort((a, b) => a.momento - b.momento).map((x) => ({ ...x, ...textoDeRevision(p, x, x.area === 'ENTRENAMIENTO' ? versionesTrn : versionesNut) }));
    const notas = (NOTAS[p.clave]?.propias ?? []).map((n, i) => ({ clave: `${p.clave}|nota|${i}`, ...n, fecha: m.fecha(Math.min(m.dias, n.semana * SEMANA + (n.dia ?? 0))) })).concat((p.pausas ?? []).map((pa, i) => ({ clave: `${p.clave}|nota-pausa|${i}`, texto: pa.nota, fecha: m.fecha(Math.max(0, pa.semana * SEMANA - 1)), ancla: null })));
    const notasDeSesion = (NOTAS[p.clave]?.deSesion ?? []).map((n, i) => ({ clave: `${p.clave}|nota-sesion|${i}`, ...n })).map((n) => {
      // La nota va en la sesión registrada más cercana a su semana (la de ayer, si es la de Valeria).
      const objetivo = n.ayer ? diasEntre(m.inicio, masDias(origen, -1)) : n.semana * SEMANA;
      const candidatas = sesiones.filter((s) => s.condicion !== 'NO_REALIZADA' && s.d <= objetivo + 3);
      const s = candidatas[candidatas.length - 1];
      return s ? { ...n, sesion: s.clave, momento: masMinutos(s.registrado, 3) } : null;
    }).filter(Boolean);
    return {
      clave: p.clave,
      nombre: p.nombre,
      sexo: p.sexo,
      edad: p.edad,
      talla: p.talla,
      liviana: !!p.liviana,
      experiencia: p.experiencia,
      actividad: p.actividad,
      horario: p.horario,
      dieta: p.dieta ?? 'comun',
      areas: p.areas,
      inicio: m.inicio,
      fin: m.fin,
      dias: m.dias,
      pausas: (p.pausas ?? []).map((pa) => ({ desde: m.fecha(pa.semana * SEMANA), hasta: m.fecha(pa.semana * SEMANA + pa.dias), dias: pa.dias, motivo: pa.motivo, todo: !!pa.todo })),
      vuelta: p.vuelta ? { fecha: m.fecha(p.vuelta.semana * SEMANA), perdida: p.vuelta.perdida, recupera: p.vuelta.recupera } : null,
      meseta: p.meseta ? { ejercicio: p.meseta.ejercicio, desde: m.fecha(p.meseta.desde * SEMANA), hasta: m.fecha(p.meseta.hasta * SEMANA) } : null,
      formulario: formularioDe(p),
      trn: { versiones: versionesTrn, sesiones, borrador: p.borradorTrn ?? null },
      nut: { versiones: versionesNut, comidas, colega: p.nutColega ? { ...p.nutColega, plan: planNutricionalDe(p, { ...p.nutColega, dias: 'UNO' }) } : null },
      tomas,
      revisiones,
      notas,
      notasDeSesion,
      historiaAnterior: p.historiaAnterior ? historiaAnteriorDe(p, m) : null,
    };
  });
  return { semilla: SEMILLA, origen, hoy, ahora: ahora.toISOString(), zona: ZONA, profesional: PROFESIONAL, colegas: COLEGAS, herramientas: HERRAMIENTAS, personas };
}

/** Los formularios de inicio (REQ-TUT-17.1), coherentes con la historia, con algún campo sin responder. */
function formularioDe(p) {
  const franja = `${hhmm(p.horario[0])} a ${hhmm(p.horario[1])}`;
  return {
    entrenamiento: p.areas.ENTRENAMIENTO ? { experiencia: { NOVATO: 'Nunca entrené con cargas de forma sistemática', INTERMEDIO: 'Entreno fuerza hace algunos años' }[p.experiencia] ?? null, horario: franja, lesiones: p.lesiones ?? null, objetivo: p.objetivoPersonal ?? null, deporte: null } : null,
    nutricion: p.areas.NUTRICION ? { noCome: p.noCome ?? 'Nada en particular', medicacion: p.medicacion ?? null, comidasPorDia: (p.registra?.comidasPorDia ?? 4) || null, actividad: { 1.375: 'Poco activa', 1.55: 'Moderadamente activa', 1.725: 'Muy activa' }[p.actividad], alcohol: null } : null,
    habitos: { sueno: p.liviana ? null : '7 horas', trabajo: p.ocupacion ?? null },
  };
}

/** La historia anterior de Valeria (REQ-TUT-21): diez meses con el entrenador anterior, antes de llegar a Julieta. */
function historiaAnteriorDe(p, m) {
  const semanas = p.historiaAnterior.semanas;
  const inicio = masDias(m.inicio, -semanas * SEMANA - 7);
  const fin = masDias(m.inicio, -7);
  const sesiones = [];
  for (let d = 0; d < semanas * SEMANA; d++) {
    const fecha = masDias(inicio, d);
    if (![0, 2, 4].includes(diaDeLaSemana(fecha))) continue;
    const r = azar(`${SEMILLA}|${p.clave}|anterior|${d}`);
    if (!r.si(0.8)) continue;
    const ocurrio = instante(fecha, hhmm(18 * 60 + r.entero(0, 60)));
    const progreso = d / (semanas * SEMANA);
    const ejercicios = [EJ.sentadilla, EJ.banca, EJ.remo].map((nombre, i) => {
      const cap = { [EJ.sentadilla]: 64 + 8 * progreso, [EJ.banca]: 43 + 4 * progreso, [EJ.remo]: 40 + 5 * progreso }[nombre];
      const reps = 8;
      const paso = pasoDeCarga('BARRA', nombre, cap / (1 + 10 / 30));
      const carga = aPaso(cap / (1 + 10 / 30), paso);
      return { prescriptionId: `anterior-${i + 1}`, ejercicio: nombre, sets: [1, 2, 3].map((j) => ({ setIndex: j, load: { value: carga, unit: 'kg' }, completedRepetitions: reps, rir: Math.max(0, Math.round((cap / carga - 1) * 30 - reps - 0.3 * (j - 1))), perceivedExertion: null, recordedAs: 'TYPED', fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' } })) };
    });
    sesiones.push({ clave: `${p.clave}|anterior|${d}`, d, fecha, ocurrio, registrado: masMinutos(ocurrio, r.entero(50, 90)), ejercicios });
  }
  const estructura = { blocks: [{ label: 'Fuerza general', purpose: 'Tres días de cuerpo completo', sessions: [{ sessionId: 'cuerpo', label: 'Cuerpo completo', prescriptions: [EJ.sentadilla, EJ.banca, EJ.remo].map((nombre, i) => ({ prescriptionId: `anterior-${i + 1}`, exerciseVersionId: ejercicio(nombre).versionId, intensity: { criterion: 'RIR', target: { value: 2 } }, sets: [1, 2, 3].map(() => ({ repetitions: { value: 8 }, rir: 2, restSeconds: 150 })) })) }] }] };
  return { profesional: 'entrenadorAnterior', inicio, fin, estructura, sesiones, revisiones: [{ fecha: masDias(inicio, 140), interpretacion: 'Sostiene tres días por semana; las cargas suben de a poco.', fundamento: 'Lo registrado alcanza para decidir.', accion: 'Seguir con el plan.', resultado: 'MANTENER' }] };
}

/** La huella de la historia (REQ-TUT-61): un SHA-256 de su serialización. */
export function huellaDe(historia) {
  return createHash('sha256').update(JSON.stringify(historia)).digest('hex');
}

export const constantes = { SEMANA, r2, masDias };
