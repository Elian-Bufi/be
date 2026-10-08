// La verificación de los datos sintéticos: lee por la API, como el profesional, y compara con resultados esperados que
// NO salen del código de BE. La energía de cada opción está escrita a mano (DATOS-SINTETICOS.md §3, con su cuenta), y
// los conteos salen de las reglas del escenario. Si algo no coincide, se revisa el cálculo o el escenario, nunca el
// valor esperado para que pase.
import { comidasHistoricas, diaMenos, sesionesHistoricas, tomasHistoricas } from './escenario.mjs';

/** kcal de cada opción, calculadas a mano con la composición del catálogo (por 100 g o 100 ml). */
export const ENERGIA = {
  v1: {
    Desayuno: [259.5], // avena 50 g × 379 = 189,5 + leche 200 ml × 35 = 70
    Almuerzo: [428, 355.4], // arroz 150 × 130 = 195 + pollo 120 × 165 = 198 + brócoli 100 × 35 = 35 | lentejas 200 × 116 = 232 + zanahoria 35 + aceite 10 × 884 = 88,4
    Merienda: [200], // yogur 200 × 61 = 122 + manzana 150 × 52 = 78
    Cena: [527.2], // salmón 150 × 206 = 309 + papa 200 × 87 = 174 + aceite 5 × 884 = 44,2
  },
  v2: {
    Desayuno: [221.6, 227.4], // avena 40 × 379 = 151,6 + leche 70 | pan integral 60 × 247 = 148,2 + queso 30 × 264 = 79,2
    Almuerzo: [439.5, 311.2], // arroz 120 × 130 = 156 + pollo 140 × 165 = 231 + brócoli 150 × 35 = 52,5 | 232 + 35 + aceite 5 × 884 = 44,2
    Merienda: [200],
    Cena: [483.7], // 309 + papa 150 × 87 = 130,5 + 44,2
  },
};
/** La cena informada de los martes de las semanas 5 a 7: salmón 150 g (309) + papa 100 g (87); el aceite, no comido (0). */
const CENA_INFORMADA = 396;

const cerca = (a, b) => a !== null && b !== null && Math.abs(a - b) < 1e-6;

export async function verificarContraLoEsperado({ pedir, e, pro, tercero }) {
  const hoy = e.hoy;
  const checks = [];
  const exigir = (que, ok, detalle) => checks.push({ que, ok: Boolean(ok), detalle });

  // ─── Nutrición ─────────────────────────────────────────────────────────────────────────────────────────────────
  // Las comidas recientes (fase «recientes»): D-1 desayuno (porciones, v2 opción 0), almuerzo rectificado a porciones
  // (opción 0), merienda anulada y una cena diferente sin cantidades; D0 desayuno (porciones, opción 1).
  const recientes = [
    { fecha: diaMenos(hoy, 1), kcal: ENERGIA.v2.Desayuno[0], conCantidades: true },
    { fecha: diaMenos(hoy, 1), kcal: ENERGIA.v2.Almuerzo[0], conCantidades: true, rectificada: true },
    { fecha: diaMenos(hoy, 1), anulada: true },
    { fecha: diaMenos(hoy, 1), kcal: null, conCantidades: false, diferente: true },
    { fecha: hoy, kcal: ENERGIA.v2.Desayuno[1], conCantidades: true },
  ];
  const historicas = comidasHistoricas(hoy).map((c) => {
    if (c.anulacion) return { fecha: c.fecha, anulada: true };
    if (c.diferente) return { fecha: c.fecha, kcal: null, conCantidades: false, diferente: true };
    const efectivo = c.rectificacion ? c.rectificacion.consumo : c.consumo;
    if (efectivo.status === 'UNCONFIRMED') return { fecha: c.fecha, kcal: null, conCantidades: false };
    const kcal = efectivo.status === 'REPORTED' ? CENA_INFORMADA : ENERGIA[c.plan][c.comida][c.opcion];
    return { fecha: c.fecha, kcal, conCantidades: true, rectificada: Boolean(c.rectificacion) };
  });
  const todas = [...historicas, ...recientes];
  const efectivas = todas.filter((r) => !r.anulada);
  const porDia = new Map();
  for (const r of efectivas) porDia.set(r.fecha, [...(porDia.get(r.fecha) ?? []), r]);

  const nut = (await pedir('GET', `/advisees/${e.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}`, { token: pro })).data;
  const cobertura = nut.result.coverage;
  exigir('cobertura: registros efectivos', cobertura.records === efectivas.length, `${cobertura.records} vs ${efectivas.length}`);
  exigir('cobertura: con cantidades', cobertura.recordsWithQuantities === efectivas.filter((r) => r.conCantidades).length, `${cobertura.recordsWithQuantities}`);
  exigir('cobertura: comidas diferentes sin cantidades', cobertura.differentMealsWithoutQuantities === efectivas.filter((r) => r.diferente).length, `${cobertura.differentMealsWithoutQuantities}`);
  exigir('cobertura: anulados excluidos', cobertura.annulledExcluded === todas.filter((r) => r.anulada).length, `${cobertura.annulledExcluded}`);
  exigir('cobertura: rectificados una vez', cobertura.rectifiedCountedOnce === efectivas.filter((r) => r.rectificada).length, `${cobertura.rectifiedCountedOnce}`);
  exigir('cobertura: días con registros (84 menos el hueco de 4)', cobertura.daysWithRecords === 80 && cobertura.daysInPeriod === 84, `${cobertura.daysWithRecords}/${cobertura.daysInPeriod}`);
  exigir('hueco D-62..D-59, y ninguno más', JSON.stringify(nut.result.recorded.gaps) === JSON.stringify([{ from: diaMenos(hoy, 62), to: diaMenos(hoy, 59), days: 4, state: 'NO_DATA' }]), JSON.stringify(nut.result.recorded.gaps));
  let dias = 0;
  for (const p of nut.result.recorded.points) {
    const registros = porDia.get(p.date) ?? [];
    const conocidas = registros.filter((r) => r.kcal !== null);
    const esperado = conocidas.length === 0 ? null : conocidas.reduce((s, r) => s + r.kcal, 0);
    const calidad = conocidas.length === 0 ? 'UNKNOWN' : conocidas.length < registros.length ? 'PARTIAL' : 'COMPLETE';
    if ((esperado === null ? p.value === null : cerca(p.value, esperado)) && p.quality === calidad && p.n === registros.length) dias++;
    else exigir(`día ${p.date}`, false, `${p.value} ${p.quality} n=${p.n} vs ${esperado} ${calidad} n=${registros.length}`);
  }
  exigir('cada día: suma de lo conocido, calidad y n', dias === nut.result.recorded.points.length && dias === 80, `${dias} días`);
  const pasos = nut.result.prescribed.energyRequirement.map((s) => [s.from, s.to, s.value]);
  exigir('escalones del requerimiento: 2100 hasta D-35 y 1950 desde D-35', JSON.stringify(pasos) === JSON.stringify([[diaMenos(hoy, 84), diaMenos(hoy, 35), 2100], [diaMenos(hoy, 35), null, 1950]]), JSON.stringify(pasos));

  // La semana: la media de los días con valor, con su denominador.
  const semanal = (await pedir('GET', `/advisees/${e.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}&grain=WEEK`, { token: pro })).data;
  let semanasOk = 0;
  for (const p of semanal.result.recorded.points) {
    const valores = [...porDia.entries()].filter(([f]) => f >= p.date && f <= p.dateEnd).map(([, rs]) => rs.filter((r) => r.kcal !== null)).filter((rs) => rs.length > 0).map((rs) => rs.reduce((s, r) => s + r.kcal, 0));
    const esperado = valores.length === 0 ? null : valores.reduce((s, v) => s + v, 0) / valores.length;
    if ((esperado === null ? p.value === null : cerca(p.value, esperado)) && (esperado === null || p.coverage.daysWithData === valores.length)) semanasOk++;
    else exigir(`semana ${p.date}`, false, `${p.value} (${p.coverage?.daysWithData}) vs ${esperado} (${valores.length})`);
  }
  exigir('cada semana: media de los días con valor, con su denominador', semanasOk === semanal.result.recorded.points.length, `${semanasOk} semanas`);

  // ─── Entrenamiento ─────────────────────────────────────────────────────────────────────────────────────────────
  const sesiones = sesionesHistoricas(hoy);
  const lista = (await pedir('GET', `/advisees/${e.aseId}/projections/TRAINING_PROGRESSION_BY_EXERCISE?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}`, { token: pro })).data.result;
  const ej = (nombre) => lista.exercises.find((x) => x.name === nombre);
  // Sesiones A: lunes registrados (con datos o resumidos) más la de hoy por la API.
  const sesionesA = sesiones.filter((s) => s.sesion === 'ses-a').length + 1;
  exigir('sentadilla: sesiones del período', ej('Sentadilla')?.sessions === sesionesA, `${ej('Sentadilla')?.sessions} vs ${sesionesA}`);
  exigir('press de banca: kg y lb, nunca mezclados', JSON.stringify(ej('Press de banca')?.loadUnits) === JSON.stringify(['kg', 'lb']), JSON.stringify(ej('Press de banca')?.loadUnits));
  exigir('hip thrust: una sesión (la sustitución de la semana 4)', ej('Hip thrust')?.sessions === 1, `${ej('Hip thrust')?.sessions}`);
  const carga = (await pedir('GET', `/advisees/${e.aseId}/projections/TRAINING_PROGRESSION_BY_EXERCISE?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}&exerciseId=${ej('Sentadilla').exerciseKey}&metric=LOAD&setIndex=2`, { token: pro })).data.result.progression.series;
  const esperadaS2 = [
    ...sesiones
      .filter((s) => s.sesion === 'ses-a' && s.granularidad === 'SERIE')
      .map((s) => [s.fecha, s.ejercicios.find((x) => x.prescriptionId === 'rx-sentadilla').sets.find((y) => y.setIndex === 2).load.value]),
    [hoy, 87.5],
  ];
  const obtenida = carga.points.map((p) => [p.date, p.value]);
  exigir('sentadilla, serie 2: la carga corregida (65, no 650), sin la semana resumida, y la de hoy', JSON.stringify(obtenida) === JSON.stringify(esperadaS2), JSON.stringify(obtenida));
  const rir = (await pedir('GET', `/advisees/${e.aseId}/projections/TRAINING_PROGRESSION_BY_EXERCISE?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}&exerciseId=${ej('Sentadilla').exerciseKey}&metric=RIR&setIndex=3`, { token: pro })).data.result.progression.series;
  const conRir = sesiones.filter((s) => s.sesion === 'ses-a' && s.granularidad === 'SERIE' && s.ejercicios[0].sets[2].rir !== null).length + 1;
  exigir('sentadilla, RIR de la serie 3: el nulo no es punto ni cero', rir.points.length === conRir && rir.points.every((p) => p.value !== null), `${rir.points.length} vs ${conRir}`);
  const banca = (await pedir('GET', `/advisees/${e.aseId}/projections/TRAINING_PROGRESSION_BY_EXERCISE?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}&exerciseId=${ej('Press de banca').exerciseKey}&metric=LOAD&setIndex=1&unit=kg`, { token: pro })).data.result.progression.series;
  exigir('press de banca en kg: la sesión en lb queda fuera y se avisa', banca.points.every((p) => p.date !== sesiones.find((s) => s.semana === 5 && s.sesion === 'ses-b')?.fecha) && banca.notes.some((n) => /lb/.test(n)), banca.notes.join(' | '));

  // ─── Antropometría ─────────────────────────────────────────────────────────────────────────────────────────────
  const antro = (await pedir('GET', `/advisees/${e.aseId}/projections/ANTHROPOMETRY_LONGITUDINAL?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}&metric=peso,perimetro-cintura,pliegue-biceps`, { token: pro })).data.result;
  const [peso, cintura, biceps] = antro.series;
  exigir('peso: seis tomas, dos el mismo día', JSON.stringify(peso.points.map((p) => p.value)) === JSON.stringify([82.4, 81.6, 79.4, 80.2, 80.9, 79.8]), JSON.stringify(peso.points.map((p) => p.value)));
  exigir('peso: el protocolo de laboratorio abre otro tramo (tres tramos)', new Set(peso.points.map((p) => p.segment)).size === 3, JSON.stringify(peso.points.map((p) => p.segment)));
  exigir('cintura: la corrección vigente (90,5, no 95)', JSON.stringify(cintura.points.map((p) => p.value)) === JSON.stringify([92, 90.5, 89, 88.2]) && cintura.points[1].corrected === true, JSON.stringify(cintura.points.map((p) => p.value)));
  exigir('pliegue del bíceps: anulado, sin punto', biceps.points.length === 0, `${biceps.points.length}`);
  exigir('las tomas históricas y la reciente son de este profesional: sin vista parcial', (await pedir('GET', `/advisees/${e.aseId}/projections/ANTHROPOMETRY_LONGITUDINAL`, { token: pro })).data.partialView === false, '');

  // ─── Línea de tiempo y permisos ────────────────────────────────────────────────────────────────────────────────
  const tl = (await pedir('GET', `/advisees/${e.aseId}/timeline?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}&limit=1`, { token: pro })).data;
  // Comidas (también la anulada, marcada) + sesiones + tomas + 4 activaciones + el objetivo de D-35 + 2 aperturas.
  const esperadas = todas.length + (sesiones.length + 1) + (tomasHistoricas(hoy).length + 1) + 4 + 1 + 2;
  exigir('línea de tiempo: una entrada por hecho en las 12 semanas', tl.totalMatching === esperadas, `${tl.totalMatching} vs ${esperadas}`);
  const tardias = (await pedir('GET', `/advisees/${e.aseId}/timeline?periodStart=${diaMenos(hoy, 83)}&periodEnd=${hoy}&late=true&type=TRAINING_SESSION_RECORDED`, { token: pro })).data;
  exigir('carga tardía: la sesión del jueves de la semana 9', tardias.totalMatching === 1 && tardias.entries[0].occurredDate === sesiones.find((s) => s.semana === 9 && s.sesion === 'ses-b')?.fecha, `${tardias.totalMatching}`);
  const b = (await pedir('GET', `/advisees/${e.aseBId}/timeline`, { token: pro })).data;
  exigir('asesorado B: vista parcial (sin Entrenamiento con este profesional)', b.partialView === true && JSON.stringify(b.sourceDomains) === JSON.stringify(['NUTRITION', 'ANTHROPOMETRY']), JSON.stringify(b.sourceDomains));
  for (const ruta of [`/advisees/${e.aseId}/timeline`, `/advisees/${e.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED`]) {
    await pedir('GET', ruta, { token: tercero, esperado: 404 });
  }
  exigir('un tercero recibe 404 en la línea de tiempo y en las proyecciones', true, '');

  const fallas = checks.filter((c) => !c.ok);
  return { hoy, total: checks.length, ok: checks.length - fallas.length, fallas, checks };
}
