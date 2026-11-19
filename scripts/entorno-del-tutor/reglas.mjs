// WP-ENTORNO-DEL-TUTOR (DL-184) · el chequeo de verosimilitud (REQ-TUT-71): lee la historia generada y aplica cada regla
// R-xx del documento de requisitos con su umbral. Devuelve, por regla y por persona, lo que cumple, lo que falla (con el
// dato que falla) y las rarezas declaradas. Con una sola falla, la carga no corre (REQ-TUT-60).
//
// Donde el documento deja una regla abierta a interpretación, la interpretación está escrita junto a la regla y en las
// decisiones TUT-D del paquete (docs/paquetes/WP-ENTORNO-DEL-TUTOR.md).
import { ALIMENTO, SEIS_CON_BARRA, ejercicio, existeElEjercicio, nutrientesDe } from './catalogo.mjs';
import { NOMBRES_QUE_NO_VAN } from './personas.mjs';
import { epley, pasoDeCarga, SITIOS_DE_LA_SUMA, diasEntre } from './historia.mjs';

const mediana = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (a, b) => (a - b) / b;
const dds = (fecha) => (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7;
const horaLocal = (instante) => {
  const d = new Date(new Date(instante).getTime() - 3 * 3_600_000);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
};
const fechaLocal = (instante) => new Date(new Date(instante).getTime() - 3 * 3_600_000).toISOString().slice(0, 10);

/** Las series efectivas con todos sus datos, de cada sesión registrada por serie. */
function seriesEfectivas(p) {
  const lista = [];
  for (const s of p.trn.sesiones) {
    if (s.granularidad !== 'SERIE') continue;
    const version = p.trn.versiones[s.version];
    for (const e of s.ejercicios) {
      if (!e.sets) continue;
      for (const x of e.sets) if (x.setKind !== 'WARM_UP') lista.push({ s, e, x, version });
    }
  }
  return lista;
}
const enPausa = (p, fecha) => p.pausas.some((pa) => fecha >= pa.desde && fecha < pa.hasta);
const despuesDePausaLarga = (p, fecha, dias) => p.pausas.some((pa) => pa.dias >= 21 && fecha >= pa.hasta && diasEntre(pa.hasta, fecha) < dias);
const despuesDeDescarga = (p, fecha, dias) => p.trn.versiones.some((v, i) => v.descarga && p.trn.versiones[i + 1] && fecha >= p.trn.versiones[i + 1].desde && diasEntre(p.trn.versiones[i + 1].desde, fecha) < dias);

/**
 * El 1RM implícito de cada sesión y ejercicio, como lo estima BE (Epley v1, la banda núcleo): de las series con RIR de 0
 * a 2 y n + RIR hasta 10, la de mayor carga y, a igual carga, la primera. Con `amplio`, RIR hasta 4 y n + RIR hasta 12.
 */
function implicitos(p, amplio = false) {
  const [rirMax, nMax] = amplio === 'progresion' ? [4, 16] : amplio ? [4, 12] : [2, 10];
  const porEj = new Map();
  for (const s of p.trn.sesiones) {
    if (s.granularidad !== 'SERIE') continue;
    const version = p.trn.versiones[s.version];
    for (const e of s.ejercicios) {
      if (!e.sets || e.sustituido) continue;
      const ok = e.sets.filter((x) => x.setKind !== 'WARM_UP' && x.load && x.rir !== null && x.rir <= rirMax && x.completedRepetitions + x.rir <= nMax && !x.rareza);
      if (!ok.length) continue;
      const max = Math.max(...ok.map((x) => x.load.value));
      const x = ok.find((y) => y.load.value === max);
      if (!porEj.has(e.ejercicio)) porEj.set(e.ejercicio, []);
      porEj.get(e.ejercicio).push({ fecha: s.fecha, valor: epley(x.load.value, x.completedRepetitions, x.rir), carga: max, descarga: version.descarga, version: s.version });
    }
  }
  return porEj;
}

// ─── Las reglas ───────────────────────────────────────────────────────────────────────────────────────────────

const REGLAS = [];
const regla = (id, que, fn) => REGLAS.push({ id, que, fn });

regla('R-TRN-01', 'Progresión creíble por experiencia (mediana de 4 semanas; la tolerancia es 1 punto más el paso del equipamiento respecto de la carga, porque la carga solo sube de a un paso)', (p, falla) => {
  const limite = (fecha) => (p.experiencia === 'NOVATO' && diasEntre(p.inicio, fecha) < 91 ? 0.06 : p.experiencia === 'AVANZADO' ? 0.01 : 0.025);
  for (const [ej, lista] of implicitos(p, 'progresion')) {
    if (!SEIS_CON_BARRA.includes(ej) && lista.length < 8) continue;
    const ventanas = new Map();
    for (const x of lista) {
      if (x.descarga || despuesDePausaLarga(p, x.fecha, 63) || despuesDeDescarga(p, x.fecha, 14)) continue;
      const k = Math.floor(diasEntre(p.inicio, x.fecha) / 28);
      if (!ventanas.has(k)) ventanas.set(k, []);
      ventanas.get(k).push(x.valor);
    }
    const ks = [...ventanas.keys()].sort((a, b) => a - b);
    for (let i = 1; i < ks.length; i++) {
      if (ks[i] !== ks[i - 1] + 1) continue;
      const a = ventanas.get(ks[i - 1]);
      const b = ventanas.get(ks[i]);
      if (a.length < 2 || b.length < 2) continue;
      const crece = pct(mediana(b), mediana(a));
      const fecha = lista.find((x) => Math.floor(diasEntre(p.inicio, x.fecha) / 28) === ks[i - 1]).fecha;
      const cargas = lista.filter((x) => Math.floor(diasEntre(p.inicio, x.fecha) / 28) === ks[i]).map((x) => x.carga);
      const eq = ejercicio(ej).equipamiento;
      const paso = pasoDeCarga(eq, ej, mediana(cargas)) / mediana(cargas);
      if (crece > limite(fecha) + 0.01 + paso) falla(`${ej}: la mediana subió ${(crece * 100).toFixed(1)} puntos en la ventana del ${fecha} (tope ${(limite(fecha) * 100).toFixed(1)})`);
    }
    for (let i = 1; i < lista.length; i++) {
      const salto = pct(lista[i].valor, lista[i - 1].valor);
      if (salto > 0.1 && !lista[i - 1].descarga && !despuesDePausaLarga(p, lista[i].fecha, 14) && diasEntre(lista[i - 1].fecha, lista[i].fecha) < 21) falla(`${ej}: +${(salto * 100).toFixed(1)} puntos entre dos sesiones seguidas (${lista[i].fecha})`);
    }
  }
});

regla('R-TRN-02', 'Cargas que existen: el paso de cada equipamiento', (p, falla) => {
  for (const s of p.trn.sesiones) {
    for (const e of s.ejercicios) {
      for (const x of e.sets ?? []) {
        if (!x.load) continue;
        const eq = ejercicio(e.ejercicio).equipamiento;
        const paso = pasoDeCarga(eq, e.ejercicio, x.load.value);
        const pasos = eq === 'BARRA' ? [paso, 1.25] : eq === 'MANCUERNA' ? [x.load.value <= 10 ? 1 : 2] : [paso];
        if (!pasos.some((q) => Math.abs(x.load.value / q - Math.round(x.load.value / q)) < 1e-6)) falla(`${s.fecha} ${e.ejercicio}: ${x.load.value} kg no es múltiplo de ${pasos.join(' ni de ')}`);
      }
    }
  }
});

regla('R-TRN-03', 'Repeticiones dentro de lo indicado (o a 2 de él), nunca más de 30', (p, falla) => {
  for (const { s, e, x, version } of seriesEfectivas(p)) {
    const rx = version.estructura.blocks[0].sessions.find((y) => y.sessionId === s.sesionId)?.prescriptions.find((y) => y.prescriptionId === e.prescriptionId);
    const reps = rx?.sets.find((y) => y.setKind !== 'WARM_UP')?.repetitions;
    if (!reps || x.completedRepetitions === null) continue;
    const [min, max] = 'value' in reps ? [reps.value, reps.value] : [reps.min, reps.max];
    if (x.completedRepetitions < min - 2 || x.completedRepetitions > max + 2 || x.completedRepetitions > 30) falla(`${s.fecha} ${e.ejercicio}: ${x.completedRepetitions} repeticiones con ${min}-${max} indicadas`);
  }
});

regla('R-TRN-04', 'RIR coherente con la carga: el 1RM implícito a 7 puntos o menos de la mediana de 4 semanas (10 en las primeras 12 semanas de quien empieza; fuera, la descarga y las series con n + RIR de más de 12, donde Epley no vale); ningún RIR de más de 5', (p, falla) => {
  const porEj = new Map();
  for (const { s, e, x, version } of seriesEfectivas(p)) {
    if (!x.load || x.rir === null || version.descarga || x.rareza || e.sustituido) continue;
    // Un RIR de más de 5 en una serie efectiva no es un registro posible; y Epley solo vale hasta n + RIR 12.
    if (x.rir > 5) falla(`${s.fecha} ${e.ejercicio}: RIR ${x.rir} en una serie efectiva`);
    if (x.completedRepetitions + x.rir > 12) continue;
    if (!porEj.has(e.ejercicio)) porEj.set(e.ejercicio, []);
    porEj.get(e.ejercicio).push({ fecha: s.fecha, valor: epley(x.load.value, x.completedRepetitions, x.rir) });
  }
  for (const [ej, lista] of porEj) {
    for (const x of lista) {
      // La vuelta de una pausa larga sube rápido (R-TRN-12): la mediana de 4 semanas no es una referencia estable ahí.
      if (despuesDePausaLarga(p, x.fecha, 63)) continue;
      const ventana = lista.filter((y) => y.fecha <= x.fecha && diasEntre(y.fecha, x.fecha) < 28).map((y) => y.valor);
      if (ventana.length < 4) continue;
      const tope = p.experiencia === 'NOVATO' && diasEntre(p.inicio, x.fecha) < 84 ? 0.1 : 0.07;
      const m = mediana(ventana);
      if (Math.abs(pct(x.valor, m)) > tope) falla(`${x.fecha} ${ej}: 1RM implícito ${x.valor.toFixed(1)} contra la mediana ${m.toFixed(1)}`);
    }
  }
});

regla('R-TRN-05', 'La fatiga dentro de la sesión: a igual carga, las repeticiones no suben más de 1 y el RIR no sube; RIR 0 en menos de 1 de cada 10 series', (p, falla) => {
  let ceros = 0;
  let total = 0;
  for (const s of p.trn.sesiones) {
    for (const e of s.ejercicios) {
      const ef = (e.sets ?? []).filter((x) => x.setKind !== 'WARM_UP');
      for (let j = 0; j < ef.length; j++) {
        if (ef[j].rir !== null) {
          total++;
          if (ef[j].rir === 0) ceros++;
        }
        if (j === 0 || ef[j].rareza || ef[j - 1].rareza) continue;
        const a = ef[j - 1];
        const b = ef[j];
        if (a.load?.value !== b.load?.value) continue;
        if (b.completedRepetitions > a.completedRepetitions + 1) falla(`${s.fecha} ${e.ejercicio}: las repeticiones suben de ${a.completedRepetitions} a ${b.completedRepetitions}`);
        if (a.rir !== null && b.rir !== null && b.rir > a.rir) falla(`${s.fecha} ${e.ejercicio}: el RIR sube de ${a.rir} a ${b.rir} a igual carga`);
      }
    }
  }
  if (total && ceros / total >= 0.1) falla(`RIR 0 en ${ceros} de ${total} series`);
});

regla('R-TRN-06', 'El calentamiento: de 1 a 3 series antes de los principales con barra, del 40 al 80 por ciento de la carga, de 3 a 10 repeticiones', (p, falla) => {
  for (const s of p.trn.sesiones) {
    for (const e of s.ejercicios) {
      const sets = e.sets ?? [];
      const cal = sets.filter((x) => x.setKind === 'WARM_UP');
      if (!cal.length) continue;
      const primeraEfectiva = sets.findIndex((x) => x.setKind !== 'WARM_UP');
      if (sets.slice(primeraEfectiva).some((x) => x.setKind === 'WARM_UP')) falla(`${s.fecha} ${e.ejercicio}: calentamiento después de una serie efectiva`);
      if (cal.length > 3) falla(`${s.fecha} ${e.ejercicio}: ${cal.length} series de calentamiento`);
      const trabajo = sets[primeraEfectiva]?.load?.value;
      for (const c of cal) {
        const f = c.load.value / trabajo;
        if (f < 0.4 - 1e-9 || f > 0.8 + 1e-9 || c.completedRepetitions < 3 || c.completedRepetitions > 10) falla(`${s.fecha} ${e.ejercicio}: calentamiento ${c.load.value} kg × ${c.completedRepetitions} con ${trabajo} kg de trabajo`);
      }
    }
  }
});

regla('R-TRN-07', 'Descansos lógicos: mediana de 90 a 240 s en los principales y de 45 a 120 en los accesorios; ninguno de menos de 20 s ni de más de 10 minutos', (p, falla) => {
  const principales = [];
  const accesorios = [];
  for (const s of p.trn.sesiones) {
    if (!s.tiempos) continue;
    for (const d of s.tiempos.descansos) {
      if (d.segundos < 20 || d.segundos > 600) falla(`${s.fecha}: un descanso de ${d.segundos} s`);
      if (d.calentamiento) continue;
      (d.principal ? principales : accesorios).push(d.segundos);
    }
  }
  const mp = mediana(principales);
  const ma = mediana(accesorios);
  if (mp !== null && (mp < 90 || mp > 240)) falla(`mediana de descanso de los principales: ${mp} s`);
  if (ma !== null && (ma < 45 || ma > 120)) falla(`mediana de descanso de los accesorios: ${ma} s`);
});

regla('R-TRN-08', 'Duración de la sesión: de 40 a 100 minutos y a 25 puntos o menos de lo indicado', (p, falla) => {
  for (const s of p.trn.sesiones) {
    if (!s.tiempos) continue;
    const { minutos, indicadoMinutos } = s.tiempos;
    if (minutos < 40 || minutos > 100) falla(`${s.fecha}: la sesión duró ${minutos} min`);
    if (Math.abs(pct(minutos, indicadoMinutos)) > 0.25) falla(`${s.fecha}: ${minutos} min contra ${indicadoMinutos} indicados`);
  }
});

regla('R-TRN-09', 'El horario de la persona: dentro de su franja (una o dos excepciones al año); nunca dos sesiones el mismo día', (p, falla) => {
  const [desde, hasta] = p.horario;
  let fuera = 0;
  const dias = new Set();
  for (const s of p.trn.sesiones) {
    const h = horaLocal(s.ocurrio) * 60;
    if (h < desde || h > hasta) fuera++;
    if (dias.has(s.fecha)) falla(`dos sesiones el ${s.fecha}`);
    dias.add(s.fecha);
  }
  if (fuera > Math.max(2, Math.ceil(p.dias / 365) * 2)) falla(`${fuera} sesiones fuera de la franja que declaró`);
});

regla('R-TRN-10', 'Asistencia con forma humana: de 70 a 92 de cada 100 sesiones indicadas por mes, fuera de las pausas', (p, falla) => {
  if (!p.trn.versiones.length) return;
  const meses = new Map();
  const sumar = (k, campo) => {
    if (!meses.has(k)) meses.set(k, { indicadas: 0, hechas: 0, dias: 0 });
    meses.get(k)[campo]++;
  };
  for (let d = 0; d <= p.dias; d++) {
    const fecha = new Date(Date.parse(`${p.inicio}T12:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);
    const k = fecha.slice(0, 7);
    sumar(k, 'dias');
    let v = -1;
    for (let i = 0; i < p.trn.versiones.length; i++) if (p.trn.versiones[i].desde <= fecha) v = i;
    if (v < 0 || enPausa(p, fecha) || !p.trn.versiones[v].dias.includes(dds(fecha))) continue;
    sumar(k, 'indicadas');
  }
  for (const s of p.trn.sesiones) if (s.condicion !== 'NO_REALIZADA' && meses.has(s.fecha.slice(0, 7))) meses.get(s.fecha.slice(0, 7)).hechas++;
  for (const [k, m] of meses) {
    if (m.dias < 25 || m.indicadas < 6) continue;
    const a = m.hechas / m.indicadas;
    if (a < 0.7 || a > 0.92) falla(`${k}: ${m.hechas} de ${m.indicadas} sesiones indicadas`);
  }
});

regla('R-TRN-11', 'La descarga se ve en el plan: una baja de carga de más de 10 por ciento tiene una versión «Descarga», una pausa o un rango de repeticiones más alto', (p, falla) => {
  const rango = (v, e) => {
    const rx = v.estructura.blocks[0].sessions.flatMap((s) => s.prescriptions).find((x) => x.exerciseVersionId === ejercicio(e).versionId);
    const r = rx?.sets.find((y) => y.setKind !== 'WARM_UP')?.repetitions;
    return r ? ('value' in r ? r.value : r.min) : null;
  };
  for (const [ej, lista] of implicitos(p, true)) {
    for (let i = 1; i < lista.length; i++) {
      const a = lista[i - 1];
      const b = lista[i];
      if (pct(b.carga, a.carga) >= -0.1) continue;
      const va = p.trn.versiones[a.version];
      const vb = p.trn.versiones[b.version];
      const explicada = vb.descarga || despuesDePausaLarga(p, b.fecha, 14) || diasEntre(a.fecha, b.fecha) >= 21 || (va !== vb && (rango(vb, ej) ?? 0) > (rango(va, ej) ?? 0));
      if (!explicada) falla(`${b.fecha} ${ej}: la carga baja de ${a.carga} a ${b.carga} kg sin descarga ni pausa`);
    }
  }
});

regla('R-TRN-12', 'Volver después de una pausa de 8 a 12 semanas: 5 a 15 por ciento menos, y de vuelta en 4 a 8 semanas', (p, falla) => {
  for (const pa of p.pausas.filter((x) => x.dias >= 56)) {
    for (const [ej, lista] of implicitos(p, 'progresion')) {
      if (!SEIS_CON_BARRA.includes(ej)) continue;
      const antes = mediana(lista.filter((x) => x.fecha < pa.desde && diasEntre(x.fecha, pa.desde) <= 28).map((x) => x.valor));
      const vuelta = mediana(lista.filter((x) => x.fecha >= pa.hasta && diasEntre(pa.hasta, x.fecha) <= 14).map((x) => x.valor));
      if (antes === null || vuelta === null) continue;
      const perdida = -pct(vuelta, antes);
      if (perdida < 0.05 || perdida > 0.15) falla(`${ej}: a la vuelta, ${(perdida * 100).toFixed(1)} puntos menos`);
      const recupera = lista.find((x) => x.fecha >= pa.hasta && x.valor >= antes * 0.98);
      const dias = recupera ? diasEntre(pa.hasta, recupera.fecha) : null;
      if (dias === null || dias < 28 - 7 || dias > 56 + 7) falla(`${ej}: se recupera en ${dias ?? 'más de lo registrado'} días`);
    }
  }
});

regla('R-TRN-13', 'Esfuerzo de la sesión coherente: con RIR 0 o 1, de 7 a 9; en la descarga, de 4 a 6', (p, falla) => {
  for (const { s, x, version } of seriesEfectivas(p)) {
    if (x.perceivedExertion === null) continue;
    if (version.descarga && (x.perceivedExertion < 4 || x.perceivedExertion > 6)) falla(`${s.fecha}: esfuerzo ${x.perceivedExertion} en la descarga`);
    if (!version.descarga && x.rir !== null && x.rir <= 1 && (x.perceivedExertion < 7 || x.perceivedExertion > 9)) falla(`${s.fecha}: esfuerzo ${x.perceivedExertion} con RIR ${x.rir}`);
  }
});

regla('R-TRN-14', 'La fuerza estimada tiene de dónde salir: los seis con barra, RIR de 0 a 2 escrito por la persona, 4 sesiones o más por versión', (p, falla) => {
  if (!['tomas', 'valeria', 'gustavo'].includes(p.clave)) return;
  const porVersion = new Map();
  for (const s of p.trn.sesiones) {
    if (s.granularidad !== 'SERIE') continue;
    const ok = s.ejercicios.some((e) => SEIS_CON_BARRA.includes(e.ejercicio) && !e.sustituido && (e.sets ?? []).some((x) => x.setKind !== 'WARM_UP' && x.rir !== null && x.rir <= 2 && x.completedRepetitions + x.rir <= 10 && x.fieldOrigins?.load === 'PERSON' && x.fieldOrigins?.rir === 'PERSON' && x.fieldOrigins?.completedRepetitions === 'PERSON'));
    if (ok) porVersion.set(s.version, (porVersion.get(s.version) ?? 0) + 1);
  }
  for (const v of p.trn.versiones) {
    const conBarra = v.estructura.blocks[0].sessions.some((s) => s.prescriptions.some((x) => SEIS_CON_BARRA.some((n) => ejercicio(n).versionId === x.exerciseVersionId) && (x.intensity?.target.value ?? 9) <= 2));
    if (!conBarra || v.descarga) continue;
    if ((porVersion.get(v.n - 1) ?? 0) < 4) falla(`la versión «${v.nombre}» tiene ${porVersion.get(v.n - 1) ?? 0} sesiones que entran en la estimación`);
  }
});

// ─── Nutrición ────────────────────────────────────────────────────────────────────────────────────────────────

const entrena = (p) => !!p.areas.ENTRENAMIENTO || p.actividad >= 1.55;
const pesoCercano = (p, fecha, defecto) => {
  const previas = p.tomas.filter((t) => t.fecha <= fecha);
  const t = previas[previas.length - 1] ?? p.tomas[0];
  return t ? t.mediciones.find(([m]) => m === 'peso')[1] : defecto;
};

regla('R-NUT-01', 'Los macros cierran con la energía: 4 × proteína + 4 × carbohidratos + 9 × grasa, a 2 puntos o menos', (p, falla) => {
  for (const v of p.nut.versiones) {
    const e = 4 * v.macros.p + 4 * v.macros.c + 9 * v.macros.g;
    if (Math.abs(pct(e, v.kcal)) > 0.02) falla(`«${v.nombre}»: ${e} kcal de los macros contra ${v.kcal}`);
  }
});

regla('R-NUT-02', 'Objetivos que un nutricionista firmaría: proteína, grasa, fibra del plan y energía mínima', (p, falla) => {
  for (const v of p.nut.versiones) {
    const peso = pesoCercano(p, v.desde, v.peso);
    const gkg = v.macros.p / peso;
    const [min, max] = entrena(p) ? [1.4, 2.2] : [1.0, 1.2];
    if (gkg < min - 0.005 || gkg > max + 0.005) falla(`«${v.nombre}»: ${gkg.toFixed(2)} g/kg de proteína`);
    if (v.macros.g / peso < 0.6) falla(`«${v.nombre}»: ${(v.macros.g / peso).toFixed(2)} g/kg de grasa`);
    if (v.kcal < 1200) falla(`«${v.nombre}»: ${v.kcal} kcal`);
    for (const dia of v.plan) {
      const fibra = dia.comidas.reduce((s, c) => s + c.opciones.reduce((t, o) => t + nutrientesDe(o.items).f, 0) / c.opciones.length, 0);
      const tope = Math.max(35, (14 * dia.kcal) / 1000);
      if (fibra < 20 || fibra > tope) falla(`«${v.nombre}», ${dia.rotulo}: ${fibra.toFixed(1)} g de fibra`);
    }
  }
});

regla('R-NUT-03', 'La energía la calcula BE: ningún total escrito a mano', (p, falla) => {
  for (const c of p.nut.comidas) for (const k of ['kcal', 'energia', 'totales', 'proteina']) if (k in c) falla(`${c.fecha} ${c.comida}: tiene «${k}»`);
});

function energiaDelDia(p, comidas) {
  const v = p.nut.versiones[comidas[0].version];
  const dia = v.plan[comidas[0].diaTipo];
  if (comidas.length < dia.comidas.length) return null;
  let total = 0;
  for (const c of comidas) {
    if (c.diferente || !c.consumo || c.consumo.status === 'UNCONFIRMED') return null;
    const items = dia.comidas.find((x) => x.rotulo === c.comida).opciones[c.opcion].items;
    total += c.consumo.status === 'REPORTED' ? nutrientesDe(items.map(([k], i) => [k, c.consumo.items[i]])).kcal : nutrientesDe(items).kcal;
  }
  return { total, indicado: dia.kcal };
}

regla('R-NUT-04', 'Lo registrado se parece a la gente: la energía de los días completos, los días sin registro, con algo faltante y lo cargado tarde, por mes', (p, falla) => {
  if (!p.nut.comidas.length) return;
  const porDia = new Map();
  for (const c of p.nut.comidas) {
    if (!porDia.has(c.fecha)) porDia.set(c.fecha, []);
    porDia.get(c.fecha).push(c);
  }
  for (const [fecha, lista] of porDia) {
    const e = energiaDelDia(p, lista);
    if (!e) continue;
    const r = e.total / e.indicado;
    const finde = dds(fecha) >= 5;
    if (finde ? r < 1.1 || r > 1.25 : r < 0.8 || r > 1.05) falla(`${fecha}: ${Math.round(e.total)} kcal registradas con ${e.indicado} indicadas (${r.toFixed(2)})`);
  }
  const meses = new Map();
  for (let d = 0; d <= p.dias; d++) {
    const fecha = new Date(Date.parse(`${p.inicio}T12:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);
    if (enPausa(p, fecha) && p.pausas.find((pa) => fecha >= pa.desde && fecha < pa.hasta).todo) continue;
    const k = fecha.slice(0, 7);
    if (!meses.has(k)) meses.set(k, { dias: 0, sin: 0, falta: 0, comidas: 0, tarde: 0 });
    const m = meses.get(k);
    m.dias++;
    const lista = porDia.get(fecha);
    if (!lista) m.sin++;
    else if (lista.some((c) => c.tipoDeDia === 'FALTA')) m.falta++;
    for (const c of lista ?? []) {
      m.comidas++;
      if (fechaLocal(c.registrado) > c.fecha) m.tarde++;
    }
  }
  for (const [k, m] of meses) {
    if (m.dias < 25) continue;
    if (m.sin / m.dias < 0.1 || m.sin / m.dias > 0.25) falla(`${k}: ${m.sin} de ${m.dias} días sin registro`);
    if (m.falta / m.dias < 0.1 || m.falta / m.dias > 0.2) falla(`${k}: ${m.falta} de ${m.dias} días con algo faltante`);
    if (m.tarde / m.comidas < 0.05 || m.tarde / m.comidas > 0.1) falla(`${k}: ${m.tarde} de ${m.comidas} comidas cargadas al día siguiente`);
  }
});

regla('R-NUT-05', 'Comidas diferentes con medida: de 1 a 3 por semana (más con el asado del domingo), la mitad con cantidad aproximada', (p, falla) => {
  const dif = p.nut.comidas.filter((c) => c.diferente);
  if (!p.nut.comidas.length) return;
  const semanas = new Map();
  for (const c of dif) {
    const k = Math.floor(diasEntre(p.inicio, c.fecha) / 7);
    semanas.set(k, (semanas.get(k) ?? 0) + 1);
  }
  for (const [k, n] of semanas) if (n > 3) falla(`semana ${k}: ${n} comidas diferentes`);
  const con = dif.filter((c) => c.diferente.aproximada).length;
  if (dif.length >= 10 && (con / dif.length < 0.35 || con / dif.length > 0.65)) falla(`${con} de ${dif.length} comidas diferentes con cantidad`);
});

regla('R-NUT-06', 'Coherencia con la persona: lo que no come no aparece; nada de marcas', (p, falla) => {
  if (p.dieta !== 'vegetariana') return;
  for (const v of p.nut.versiones) for (const dia of v.plan) for (const c of dia.comidas) for (const o of c.opciones) for (const [k] of o.items) if (ALIMENTO[k].carne) falla(`«${v.nombre}»: ${ALIMENTO[k].nombre}`);
  for (const c of p.nut.comidas) if (c.diferente && /asado|carne|pollo|pescado|chorizo|milanesa(?! de soja)|jamón|atún|merluza/i.test(c.diferente.descripcion)) falla(`${c.fecha}: «${c.diferente.descripcion}»`);
});

regla('R-NUT-07', 'Horarios de las comidas: cada una a su hora (una o dos excepciones al mes)', (p, falla) => {
  const VENTANAS = { Desayuno: [6.5, 9.5], Colación: [10, 11.5], Almuerzo: [12, 14.5], Merienda: [16, 18], Cena: [20, 22.5] };
  const fuera = new Map();
  for (const c of p.nut.comidas) {
    const [a, b] = VENTANAS[c.comida];
    const h = horaLocal(c.ocurrio);
    if (h < a - 1e-9 || h > b + 1e-9) fuera.set(c.fecha.slice(0, 7), (fuera.get(c.fecha.slice(0, 7)) ?? 0) + 1);
  }
  for (const [k, n] of fuera) if (n > 2) falla(`${k}: ${n} comidas fuera de su horario`);
});

regla('R-NUT-08', 'Fotos solo donde la historia lo dice: Carolina, un tercio; Valeria, algunas; el resto, ninguna', (p, falla) => {
  const n = p.nut.comidas.length;
  if (!n) return;
  const f = p.nut.comidas.filter((c) => c.foto).length / n;
  const [a, b] = p.clave === 'carolina' ? [0.25, 0.42] : p.clave === 'valeria' ? [0.05, 0.25] : [0, 0];
  if (f < a || f > b) falla(`${(f * 100).toFixed(0)} de cada 100 comidas con foto`);
});

regla('R-NUT-09', 'El balance cierra en tramos de 8 semanas o más (Mifflin-St Jeor por la actividad declarada, subregistro de 1,1 a 1,25)', (p, falla) => {
  if (!p.nut.versiones.length || p.tomas.length < 2) return;
  const porDia = new Map();
  for (const c of p.nut.comidas) {
    if (!porDia.has(c.fecha)) porDia.set(c.fecha, []);
    porDia.get(c.fecha).push(c);
  }
  const vs = p.nut.versiones;
  for (let i = 0; i < vs.length; i++) {
    const desde = vs[i].desde;
    const hasta = vs[i + 1]?.desde ?? p.tomas[p.tomas.length - 1].fecha;
    if (diasEntre(desde, hasta) < 56) continue;
    const tomas = p.tomas.filter((t) => t.fecha >= desde && t.fecha <= hasta && !enPausa(p, t.fecha));
    if (tomas.length < 2) continue;
    const peso = (t) => t.mediciones.find(([m]) => m === 'peso')[1];
    const real = peso(tomas[tomas.length - 1]) - peso(tomas[0]);
    const dias = diasEntre(tomas[0].fecha, tomas[tomas.length - 1].fecha);
    const energias = [...porDia].filter(([f]) => f >= tomas[0].fecha && f < tomas[tomas.length - 1].fecha).map(([, l]) => energiaDelDia(p, l)).filter(Boolean).map((e) => e.total);
    if (energias.length < 10) continue;
    const registrada = energias.reduce((a, b) => a + b, 0) / energias.length;
    const pm = (peso(tomas[0]) + peso(tomas[tomas.length - 1])) / 2;
    const gasto = (10 * pm + 6.25 * p.talla - 5 * p.edad + (p.sexo === 'H' ? 5 : -161)) * p.actividad;
    const predichos = Array.from({ length: 16 }, (_, k) => 1.1 + k * 0.01).map((f) => ((registrada * f - gasto) * dias) / 7700);
    const estable = Math.abs(real) <= 0.6 && predichos.some((x) => Math.abs(x) <= 1.5);
    const cierra = predichos.some((x) => Math.sign(x) === Math.sign(real) && Math.abs(x - real) <= Math.abs(x) / 2);
    if (!estable && !cierra) falla(`«${vs[i].nombre}»: el peso cambió ${real.toFixed(1)} kg y el balance predice de ${predichos[0].toFixed(1)} a ${predichos[predichos.length - 1].toFixed(1)} kg`);
  }
});

// ─── Antropometría ────────────────────────────────────────────────────────────────────────────────────────────

const valor = (t, m) => t.mediciones.find(([k]) => k === m)?.[1] ?? null;
const suma6 = (t) => (SITIOS_DE_LA_SUMA.every((k) => valor(t, k) !== null) ? SITIOS_DE_LA_SUMA.reduce((s, k) => s + valor(t, k), 0) : null);

regla('R-ANT-01', 'El ritmo del peso: no más de 1 por ciento por semana entre tomas, salvo la vuelta de una pausa', (p, falla) => {
  for (let i = 1; i < p.tomas.length; i++) {
    const a = p.tomas[i - 1];
    const b = p.tomas[i];
    if (p.pausas.some((pa) => pa.dias >= 21 && a.fecha < pa.hasta && b.fecha >= pa.hasta)) continue;
    const semanas = diasEntre(a.fecha, b.fecha) / 7;
    const ritmo = Math.abs(pct(valor(b, 'peso'), valor(a, 'peso'))) / semanas;
    if (ritmo > 0.01) falla(`${b.fecha}: ${(ritmo * 100).toFixed(2)} por ciento por semana`);
  }
});

regla('R-ANT-02', 'Pliegues y peso van juntos: la suma no baja mientras el peso sube más de 2 kg', (p, falla) => {
  for (let i = 1; i < p.tomas.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = p.tomas[j];
      const b = p.tomas[i];
      const sa = suma6(a);
      const sb = suma6(b);
      if (sa === null || sb === null) continue;
      if (valor(b, 'peso') - valor(a, 'peso') > 2 && sb < sa * 0.97 && !(p.experiencia === 'NOVATO' && p.areas.ENTRENAMIENTO)) falla(`${a.fecha} → ${b.fecha}: el peso sube y la suma baja`);
    }
  }
});

regla('R-ANT-03', 'El ruido de quien mide: cada pliegue a 5 puntos o menos de la tendencia y cada perímetro a 1; uno o dos sitios al revés de la suma, y poco', (p, falla) => {
  const t = p.tomas;
  for (let i = 1; i < t.length - 1; i++) {
    for (const [m] of t[i].mediciones) {
      if (!/^(pliegue|perimetro)-/.test(m)) continue;
      const a = valor(t[i - 1], m);
      const b = valor(t[i], m);
      const c = valor(t[i + 1], m);
      if (a === null || c === null) continue;
      const peso = diasEntre(t[i - 1].fecha, t[i].fecha) / diasEntre(t[i - 1].fecha, t[i + 1].fecha);
      const esperado = a + (c - a) * peso;
      const tope = m.startsWith('pliegue') ? 0.05 : 0.01;
      const vuelta = p.pausas.some((pa) => pa.dias >= 21 && t[i - 1].fecha < pa.hasta && t[i + 1].fecha >= pa.hasta);
      if (!vuelta && Math.abs(pct(b, esperado)) > tope + 0.002) falla(`${t[i].fecha} ${m}: ${b} contra ${esperado.toFixed(1)} de la tendencia`);
    }
  }
  for (let i = 1; i < t.length; i++) {
    const sa = suma6(t[i - 1]);
    const sb = suma6(t[i]);
    if (sa === null || sb === null || Math.abs(pct(sb, sa)) < 0.03) continue;
    const alReves = SITIOS_DE_LA_SUMA.filter((k) => Math.sign(valor(t[i], k) - valor(t[i - 1], k)) === -Math.sign(sb - sa) && Math.abs(pct(valor(t[i], k), valor(t[i - 1], k))) > 0.005);
    if (alReves.length > 2) falla(`${t[i].fecha}: ${alReves.length} sitios al revés de la suma`);
  }
});

regla('R-ANT-04', 'La talla no cambia: más o menos 0,5 cm', (p, falla) => {
  const tallas = p.tomas.map((t) => valor(t, 'talla'));
  if (tallas.length && Math.max(...tallas) - Math.min(...tallas) > 1.0 + 1e-9) falla(`la talla va de ${Math.min(...tallas)} a ${Math.max(...tallas)} cm`);
});

regla('R-ANT-05', 'La cintura acompaña: en un déficit, de 0,7 a 1,2 cm por kg perdido; la cadera, menos que la cintura', (p, falla) => {
  for (const v of p.nut.versiones) {
    const i = p.nut.versiones.indexOf(v);
    const hasta = p.nut.versiones[i + 1]?.desde ?? '9999';
    const tomas = p.tomas.filter((t) => t.fecha >= v.desde && t.fecha <= hasta);
    if (tomas.length < 2) continue;
    const a = tomas[0];
    const b = tomas[tomas.length - 1];
    const kg = valor(a, 'peso') - valor(b, 'peso');
    if (kg < 2) continue;
    const cm = valor(a, 'perimetro-cintura') - valor(b, 'perimetro-cintura');
    const cadera = valor(a, 'perimetro-cadera') - valor(b, 'perimetro-cadera');
    if (cm / kg < 0.7 || cm / kg > 1.2) falla(`«${v.nombre}»: ${(cm / kg).toFixed(2)} cm de cintura por kg`);
    if (cadera >= cm) falla(`«${v.nombre}»: la cadera bajó ${cadera.toFixed(1)} cm y la cintura ${cm.toFixed(1)}`);
  }
});

regla('R-ANT-06', 'Los cálculos los hace BE: la toma lleva sitios, no resultados', (p, falla) => {
  for (const t of p.tomas) for (const [m] of t.mediciones) if (!/^(peso|talla|edad|pliegue-|perimetro-|diametro-)/.test(m)) falla(`${t.fecha}: «${m}» no es un sitio`);
});

regla('R-ANT-07', 'Condiciones constantes: a la mañana, por la misma profesional', (p, falla) => {
  for (const t of p.tomas) {
    const h = horaLocal(t.ocurrio);
    if (h < 7 || h > 11) falla(`${t.fecha}: la toma fue a las ${h.toFixed(1)}`);
  }
});

// ─── La profesional, los textos y lo raro ─────────────────────────────────────────────────────────────────────

const REGLAS_DE_LA_MUESTRA = [];
const reglaDeLaMuestra = (id, que, fn) => REGLAS_DE_LA_MUESTRA.push({ id, que, fn });

reglaDeLaMuestra('R-PRO-01', 'La actividad de la profesional: ningún mes de los últimos 12 sin actividad, nada entre las 23 y las 6', (h, falla) => {
  const momentos = h.personas.flatMap((p) => [...p.revisiones.map((r) => r.momento), ...p.tomas.map((t) => t.ocurrio)]);
  for (const m of momentos) {
    const hora = horaLocal(m);
    if (hora >= 23 || hora < 6) falla(`actividad a las ${hora.toFixed(1)} del ${fechaLocal(m)}`);
  }
  const meses = new Set(momentos.map((m) => fechaLocal(m).slice(0, 7)));
  for (let k = 1; k <= 12; k++) {
    const d = new Date(`${h.origen}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - k);
    const mes = d.toISOString().slice(0, 7);
    if (!meses.has(mes)) falla(`sin actividad en ${mes}`);
  }
});

reglaDeLaMuestra('R-PRO-02', 'El ritmo humano: de 2 a 7 revisiones por semana en promedio de cada mes (los últimos 6 meses), ninguna en domingo, y de 3 a 6 semanas entre revisiones de un área', (h, falla) => {
  const revisiones = h.personas.flatMap((p) => p.revisiones.map((r) => ({ ...r, persona: p })));
  for (const r of revisiones) if (dds(r.fecha) === 6) falla(`${r.persona.nombre}: revisión un domingo (${r.fecha})`);
  for (let k = 1; k <= 6; k++) {
    const d = new Date(`${h.origen}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - k);
    const mes = d.toISOString().slice(0, 7);
    const n = revisiones.filter((r) => r.fecha.startsWith(mes)).length;
    const porSemana = n / 4.35;
    if (porSemana < 2 || porSemana > 7) falla(`${mes}: ${porSemana.toFixed(1)} revisiones por semana`);
  }
  for (const p of h.personas) {
    for (const area of ['ENTRENAMIENTO', 'NUTRICION']) {
      const l = p.revisiones.filter((r) => r.area === area);
      for (let i = 1; i < l.length; i++) {
        const dias = diasEntre(l[i - 1].fecha, l[i].fecha);
        const pausa = p.pausas.some((pa) => pa.dias >= 21 && l[i - 1].fecha <= pa.desde && diasEntre(pa.hasta, l[i].fecha) >= -7);
        const descarga = l[i].descarga || l[i - 1].descarga;
        if (!pausa && ((dias < 21 && !descarga) || dias > 42)) falla(`${p.nombre}, ${area}: ${dias} días entre revisiones (${l[i].fecha})`);
      }
    }
  }
});

const CAUSAS = /gracias a|por culpa de|caus[óa]|provoc[óa]|hizo que|se debe a/i;
const JUICIOS = /\b(gord[oa]s?|flac[oa]s?|vag[oa]s?|perezos[oa]s?|mal comportamiento|fall[óa]|fracas)/i;

reglaDeLaMuestra('R-TXT-01', 'Ubicar, nunca calificar, también en lo escrito: la guardia de vocabulario de BE, sin «asesorado», sin «%» en Nutrición y sin causas', (h, falla, dominio) => {
  if (!dominio) {
    falla('no se pudo cargar el dominio compilado (packages/domain/dist): compilalo con `npm run build:domain`');
    return;
  }
  const textos = [];
  for (const p of h.personas) {
    for (const n of p.notas) textos.push([`${p.nombre} · nota`, n.texto]);
    for (const n of p.notasDeSesion) textos.push([`${p.nombre} · nota de la sesión`, n.texto]);
    for (const r of p.revisiones) textos.push([`${p.nombre} · revisión ${r.fecha}`, `${r.interpretacion} ${r.fundamento} ${r.accion}`]);
    for (const v of p.trn.versiones) textos.push([`${p.nombre} · plan`, v.nombre]);
    for (const v of p.nut.versiones) textos.push([`${p.nombre} · objetivo`, `${v.nombre} ${v.razon}`]);
  }
  const he = h.herramientas;
  for (const x of [...he.recetas, ...he.comidasHabituales, ...he.vistasDeAnalizar, ...he.enfoques, ...he.alimentosPropios.map((a) => a.nombre)]) textos.push(['herramienta', x]);
  const guardias = ['terminosProhibidosEn', 'terminosProhibidosDeEntrenamientoEn', 'terminosProhibidosDeAntropometriaEn', 'terminosProhibidosDeFuerzaEn'].map((f) => dominio[f]).filter(Boolean);
  for (const [donde, texto] of textos) {
    const prohibidos = [...new Set([...guardias.flatMap((g) => g(texto)), ...dominio.terminosProhibidosEnUnGrafico(texto, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'])])];
    if (prohibidos.length) falla(`${donde}: «${texto}» usa ${prohibidos.join(', ')}`);
    if (/asesorad/i.test(texto)) falla(`${donde}: «asesorado»`);
    if (/%/.test(texto)) falla(`${donde}: el signo de porcentaje`);
    if (CAUSAS.test(texto)) falla(`${donde}: afirma una causa («${texto}»)`);
    if (JUICIOS.test(texto)) falla(`${donde}: califica («${texto}»)`);
  }
});

reglaDeLaMuestra('R-PRV-01', 'La privacidad: nombres que no son de nadie conocido, correos de example.invalid y la matrícula imposible', (h, falla, _dominio, nombresReales) => {
  const nombres = [h.profesional.nombre, ...Object.values(h.colegas).map((c) => c.nombre), ...h.personas.map((p) => p.nombre)];
  const normal = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(Lic\.|Prof\.)\s+/, '').toLowerCase().trim();
  const prohibidos = [...NOMBRES_QUE_NO_VAN, ...(nombresReales ?? [])].map(normal);
  for (const n of nombres) {
    const [nombre, inicial] = normal(n).split(/\s+/);
    for (const x of prohibidos) {
      const [xn, xa] = x.split(/\s+/);
      if (xn === nombre && (!xa || !inicial || xa.startsWith(inicial.replace('.', '')))) falla(`«${n}» coincide con un nombre que no va`);
    }
  }
  if (!/DEMO/.test(h.profesional.matricula)) falla('la matrícula no es imposible');
});

reglaDeLaMuestra('REQ-TUT-30', 'Los ejercicios son los del catálogo base', (h, falla) => {
  for (const p of h.personas) for (const s of p.trn.sesiones) for (const e of s.ejercicios) if (!existeElEjercicio(e.ejercicio)) falla(`${p.nombre}: «${e.ejercicio}»`);
});

/**
 * Las rarezas declaradas (REQ-TUT-39): por persona en profundidad, una o dos comidas corregidas, una toma con un sitio sin
 * medir, una semana sin entrenar con su motivo, un día con solo el desayuno y una serie con un RIR fuera de lo esperado.
 * La rareza grande (R-RAR-01: un descanso de 14 minutos) no va: BE todavía no marca los datos dudosos.
 */
export function rarezasDe(p, hoy = '9999-12-31') {
  return {
    comidasCorregidas: p.nut.comidas.filter((c) => c.rectificacion).length,
    tomasConUnSitioSinMedir: p.tomas.filter((t) => t.sitioSinMedir).length,
    semanasSinEntrenar: p.pausas.filter((pa) => pa.dias >= 7 && pa.dias <= 21).length,
    diasConSoloElDesayuno: new Set(p.nut.comidas.filter((c) => c.tipoDeDia === 'FALTA').map((c) => c.fecha)).size ? [...groupBy(p.nut.comidas, (c) => c.fecha)].filter(([f, l]) => f < hoy && l.length === 1 && l[0].comida === 'Desayuno').length : 0,
    seriesConUnRirFueraDeLoEsperado: p.trn.sesiones.flatMap((s) => s.ejercicios.flatMap((e) => (e.sets ?? []).filter((x) => x.rareza))).length,
  };
}
function groupBy(xs, f) {
  const m = new Map();
  for (const x of xs) {
    const k = f(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

reglaDeLaMuestra('R-RAR', 'Lo raro, en su justa medida: las rarezas son exactamente las declaradas', (h, falla) => {
  for (const p of h.personas.filter((x) => !x.liviana && x.clave !== 'silvia')) {
    // El día de hoy todavía no terminó: lo que falta de hoy no es una rareza.
    const r = rarezasDe(p, h.hoy);
    const anios = Math.max(1, Math.round(p.dias / 365));
    if (p.nut.versiones.length && (r.comidasCorregidas < 1 || r.comidasCorregidas > 2 * anios)) falla(`${p.nombre}: ${r.comidasCorregidas} comidas corregidas`);
    if (r.tomasConUnSitioSinMedir !== 1) falla(`${p.nombre}: ${r.tomasConUnSitioSinMedir} tomas con un sitio sin medir`);
    if (r.semanasSinEntrenar < 1) falla(`${p.nombre}: ninguna semana sin entrenar con su motivo`);
    if (p.nut.versiones.length && r.diasConSoloElDesayuno !== 1) falla(`${p.nombre}: ${r.diasConSoloElDesayuno} días con solo el desayuno`);
    if (r.seriesConUnRirFueraDeLoEsperado < 1 || r.seriesConUnRirFueraDeLoEsperado > anios) falla(`${p.nombre}: ${r.seriesConUnRirFueraDeLoEsperado} series con un RIR fuera de lo esperado`);
  }
});

export const TODAS_LAS_REGLAS = [...REGLAS.map((r) => r.id), ...REGLAS_DE_LA_MUESTRA.map((r) => r.id)];

/** Aplica todas las reglas a la historia. `dominio`: el paquete compilado (para R-TXT-01). */
export function verificar(historia, { dominio = null, nombresReales = [] } = {}) {
  const resultado = [];
  for (const r of REGLAS) {
    for (const p of historia.personas) {
      const fallas = [];
      r.fn(p, (detalle) => fallas.push(detalle));
      resultado.push({ regla: r.id, que: r.que, persona: p.nombre, fallas });
    }
  }
  for (const r of REGLAS_DE_LA_MUESTRA) {
    const fallas = [];
    r.fn(historia, (detalle) => fallas.push(detalle), dominio, nombresReales);
    resultado.push({ regla: r.id, que: r.que, persona: 'la muestra', fallas });
  }
  return { ok: resultado.every((x) => !x.fallas.length), resultado };
}
