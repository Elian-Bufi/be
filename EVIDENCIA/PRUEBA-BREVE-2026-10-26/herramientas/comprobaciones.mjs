// Las comprobaciones de la fase «verificar» de escenarios.mjs, sin red: reciben lo que respondió la API (el `Resultado`
// del cliente del producto) y lo esperado, y dicen en qué quedó cada parte de un escenario. Están aparte para probarlas
// solas (comprobaciones.test.mjs, con `node --test`).
//
// La regla: solo un escenario comprobado entero cuenta como listo. Si falta una fase, o la API no dejó concluir (una
// sesión que no sirve, el límite de pedidos, un 5xx o una falla de red), el escenario queda pendiente y el veredicto es
// «PREPARACIÓN INCOMPLETA», nunca «SIN DIFERENCIAS».
import * as esperado from './esperado.mjs';
import { FECHAS } from './datos.mjs';
import { EJERCICIOS_BASE } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/catalogo.mjs';
import { diaMenos } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/herramientas.mjs';

/** En qué quedó una parte de un escenario. */
export const COMPROBADO = 'COMPROBADO';
export const CON_DIFERENCIAS = 'CON DIFERENCIAS';
/** La fase que lo prepara no se hizo: el escenario no existe todavía. */
export const FALTA = 'FALTA';
/** El escenario existe, pero la respuesta no deja concluir nada. */
export const NO_COMPROBADO = 'NO COMPROBADO';

export const comprobado = (detalle) => ({ estado: COMPROBADO, detalle });
export const conDiferencias = (detalle) => ({ estado: CON_DIFERENCIAS, detalle });
export const falta = (detalle) => ({ estado: FALTA, detalle });
export const noComprobado = (detalle) => ({ estado: NO_COMPROBADO, detalle });

/** Los códigos de una sesión que ya no sirve (cliente-http.ts, CODIGOS_DE_SESION_NO_VALIDA; 09 §1.7, 401). */
const SESION_NO_VALIDA = new Set(['AUTHENTICATION_REQUIRED', 'SESSION_INVALID', 'SESSION_EXPIRED', 'SESSION_REVOKED']);

/**
 * Si la respuesta no dice nada del escenario, el motivo; si dice algo (datos o un rechazo de la API sobre el recurso),
 * `null`. No dicen nada: la falta de respuesta, una sesión que no sirve, el límite de pedidos, un 5xx y una respuesta que el
 * cliente no reconoce.
 */
export function sinConclusion(r) {
  if (r.ok) return null;
  if (r.tipo === 'RED') return 'sin respuesta (falla de conexión): no se sabe qué habría respondido la API';
  if (r.status === 401 || SESION_NO_VALIDA.has(r.codigo)) return `la sesión no sirvió (${r.status} ${r.codigo}): no prueba nada del permiso`;
  if (r.status === 429) return `límite de pedidos (${r.status} ${r.codigo}): repetir más tarde`;
  if (r.status >= 500) return `la API no respondió bien (${r.status} ${r.codigo})`;
  if (r.codigo === 'RESPUESTA_NO_RECONOCIDA') return `una respuesta que el cliente no reconoce (${r.status})`;
  return null;
}

/**
 * El rechazo que prevé el contrato cuando el profesional ya no puede leer a la persona (revocó la autorización, o el
 * vínculo terminó): **404 RESOURCE_NOT_FOUND**, el mismo de un recurso inexistente («inexistente o no revelable», 09
 * §1.7; `DenegacionDelPdp`). Una sesión vencida, un 503 o una falla de red no lo demuestran; otro rechazo, o una lectura
 * que sale bien, es una diferencia.
 */
export function rechazoPrevisto(r) {
  const motivo = sinConclusion(r);
  if (motivo) return noComprobado(motivo);
  if (r.ok) return conDiferencias('el profesional LEE la Nutrición de la persona: el permiso no está retirado');
  if (r.status === 404 && r.codigo === 'RESOURCE_NOT_FOUND') return comprobado('404 RESOURCE_NOT_FOUND, el rechazo que prevé el contrato');
  return conDiferencias(`rechazo distinto del previsto: ${r.status} ${r.codigo} (el contrato prevé 404 RESOURCE_NOT_FOUND)`);
}

/** Una lectura que tiene que salir bien. Un rechazo de la API sobre el recurso es una diferencia. */
export function lecturaPrevista(r, que) {
  const motivo = sinConclusion(r);
  if (motivo) return noComprobado(`${que}: ${motivo}`);
  if (!r.ok) return conDiferencias(`${que}: ${r.status} ${r.codigo}`);
  return comprobado(`${que}: responde`);
}

/** El control de la sesión: en el mismo momento del rechazo, la misma sesión lee otra cosa. */
export function controlDeSesion(r) {
  const motivo = sinConclusion(r);
  if (motivo || !r.ok) return noComprobado(`control: la misma sesión no leyó sus vínculos (${motivo ?? `${r.status} ${r.codigo}`}): el rechazo no prueba el permiso`);
  return comprobado('control: la misma sesión lee sus vínculos en el mismo momento');
}

/**
 * El vínculo como lo ve el profesional (API-REL-05): su estado, la autorización y el modo de acceso que calcula el PDP.
 * `previsto` = { relationshipState, consentState?, accessMode }.
 */
export function vinculoPrevisto(vinculos, aseId, alcance, previsto) {
  const v = vinculos.filter((x) => x.advisee.identityId === aseId && x.scope.code === alcance);
  if (v.length !== 1) return conDiferencias(`vínculo de ${alcance}: se esperaba uno y hay ${v.length}`);
  const dif = Object.entries(previsto)
    .filter(([k, valor]) => v[0][k] !== valor)
    .map(([k, valor]) => `${k} ${v[0][k]} (se esperaba ${valor})`);
  return dif.length ? conDiferencias(`vínculo de ${alcance}: ${dif.join(', ')}`) : comprobado(`vínculo de ${alcance}: ${Object.values(previsto).join(' / ')}`);
}

/** Lo que ve Uno hoy (API-TRN-14): la sesión preparada, con sus dos ejercicios y sus series, sin empezar. */
export function sesionPrevista(hoy, sesion) {
  const dif = [];
  if (hoy.planState !== 'AVAILABLE') dif.push(`el plan está ${hoy.planState} (se esperaba AVAILABLE)`);
  const ocurrencias = (hoy.occurrences ?? []).filter((o) => o.plannedSession?.label === sesion.sesion);
  if (ocurrencias.length !== 1) return conDiferencias(`hoy hay ${ocurrencias.length} sesiones «${sesion.sesion}» (se esperaba una)`);
  const [o] = ocurrencias;
  const prescripciones = o.plannedSession.prescriptions;
  if (prescripciones.length !== sesion.ejercicios.length) dif.push(`${prescripciones.length} ejercicios (se esperaban ${sesion.ejercicios.length})`);
  sesion.ejercicios.forEach((x, i) => {
    const p = prescripciones[i];
    if (!p) return;
    const nombre = p.exerciseName;
    if (p.exerciseVersionId !== EJERCICIOS_BASE[x.ejercicio]) dif.push(`${nombre}: no es el ejercicio cargado (${x.ejercicio})`);
    if (p.sets.length !== x.series) dif.push(`${nombre}: ${p.sets.length} series (se esperaban ${x.series})`);
    if (p.sets.some((s) => s.repetitions?.value !== x.repeticiones)) dif.push(`${nombre}: repeticiones ${p.sets.map((s) => s.repetitions?.value).join('/')} (se esperaban ${x.repeticiones})`);
    if (p.suggestedLoad?.value !== x.cargaKg || p.suggestedLoad?.unit !== 'kg') dif.push(`${nombre}: carga ${JSON.stringify(p.suggestedLoad)} (se esperaban ${x.cargaKg} kg)`);
    if (p.intensity?.criterion !== 'RIR' || p.intensity?.target?.value !== x.rir) dif.push(`${nombre}: intensidad ${JSON.stringify(p.intensity)} (se esperaba RIR ${x.rir})`);
  });
  if (o.execution?.state !== 'NOT_STARTED') dif.push(`la sesión de hoy está ${o.execution?.state} (para la prueba tiene que estar sin empezar)`);
  if (dif.length) return conDiferencias(`la sesión de hoy: ${dif.join('; ')}`);
  return comprobado(`la sesión de hoy, sin empezar: ${prescripciones.map((p) => `${p.exerciseName} ${p.sets.length}×${p.sets[0].repetitions.value} con ${p.suggestedLoad.value} kg`).join(' y ')}`);
}

/** La búsqueda de la sustitución (API-TRN-13-BUSQUEDA): ejercicios disponibles distintos de los de la sesión. */
export function busquedaPrevista(busqueda, sesion, texto) {
  const prescriptos = new Set(sesion.ejercicios.map((x) => EJERCICIOS_BASE[x.ejercicio]));
  const otros = busqueda.filter((b) => b.available && !prescriptos.has(b.versionId));
  if (otros.length === 0) return conDiferencias(`la búsqueda «${texto}» no trae ningún ejercicio disponible para sustituir (${busqueda.length} resultados)`);
  return comprobado(`la búsqueda «${texto}» trae ${otros.length} ejercicios disponibles para sustituir (entre ellos ${otros.slice(0, 3).map((b) => b.name).join(', ')})`);
}

// ─── Nutrición ─────────────────────────────────────────────────────────────────────────────────────────────────

export const NUTRIENTE = { ENERGY: ['energyKcal', 0], PROTEIN: ['proteinG', 1] };
const iguales = (a, b) => typeof a === 'number' && Math.abs(a - b) < 1e-9;

/**
 * La comparación de la API (API-PRJ-01, NUTRITION_PRESCRIBED_VS_RECORDED) contra lo calculado aparte (esperado.mjs), día
 * por día desde la activación del plan: el objetivo, lo indicado del día, lo registrado con su calidad, el hueco (sin punto,
 * declarado como hueco y cortando la línea), lo indicado de cada comida registrada y la cobertura.
 * `x` = { plan, objetivo, comidas, hueco? }. Devuelve { diferencias, filas }.
 */
export function compararNutricion(x, hoy, composicion, r, metrica) {
  const [nutriente, decimales] = NUTRIENTE[metrica];
  const dif = [];
  const filas = [];
  const desde = diaMenos(hoy, FECHAS.activacion.hace);
  // El objetivo: un escalón desde el día del objetivo, con la cantidad que fijó el profesional.
  const delObjetivo = metrica === 'ENERGY' ? x.objetivo.kcal : x.objetivo.proteina;
  const escalones = r.prescribed.objectiveSteps;
  if (escalones.length !== 1 || escalones[0].amount?.value !== delObjetivo || escalones[0].from !== diaMenos(hoy, FECHAS.objetivo.hace))
    dif.push(`objetivo: se esperaba un escalón de ${delObjetivo} desde ${diaMenos(hoy, FECHAS.objetivo.hace)} y llegó ${JSON.stringify(escalones)}`);
  const delDia = esperado.delDia(x.plan, composicion, nutriente);
  for (let k = FECHAS.activacion.hace; k >= 0; k--) {
    const fecha = diaMenos(hoy, k);
    // Lo indicado del día.
    const d = r.prescribed.planned.days.find((y) => y.date === fecha);
    if (!d) dif.push(`${fecha}: falta el indicado del día`);
    else if (delDia.state !== d.state) dif.push(`${fecha}: indicado ${d.state}, se esperaba ${delDia.state}`);
    else if (d.state === 'DETERMINED' && !iguales(d.value, Number(esperado.exacto(delDia.value)))) dif.push(`${fecha}: indicado ${d.value}, se esperaba ${esperado.exacto(delDia.value)}`);
    else if (d.state === 'UNDETERMINED' && (d.reason !== delDia.reason || JSON.stringify(d.mealsWithSeveralOptions) !== JSON.stringify(delDia.mealsWithSeveralOptions)))
      dif.push(`${fecha}: motivo ${d.reason} ${JSON.stringify(d.mealsWithSeveralOptions)}, se esperaba ${delDia.reason} ${JSON.stringify(delDia.mealsWithSeveralOptions)}`);
    // Lo registrado del día.
    const dia = x.comidas.find((y) => y.hace === k);
    const punto = r.recorded.points.find((p) => p.date === fecha);
    let registrado = 'sin registros';
    if (dia) {
      const e = esperado.registradoDelDia(x.plan, dia, composicion, nutriente);
      registrado = `${esperado.paraMostrar(e.total, decimales)}${e.completo ? '' : ' (subtotal)'}`;
      if (!punto) dif.push(`${fecha}: falta el punto registrado`);
      else {
        if (!iguales(punto.value, Number(esperado.exacto(e.total)))) dif.push(`${fecha}: registrado ${punto.value}, se esperaba ${esperado.exacto(e.total)}`);
        const calidad = e.completo ? 'COMPLETE' : 'PARTIAL';
        if (punto.quality !== calidad) dif.push(`${fecha}: calidad ${punto.quality}, se esperaba ${calidad}`);
      }
    } else if (punto && punto.n > 0) dif.push(`${fecha}: se esperaba un día sin registros y hay un punto con ${punto.n}`);
    if (k === x.hueco) registrado = 'hueco';
    const indicado = !d
      ? 'sin dato de la API'
      : d.state === 'DETERMINED'
        ? `${delDia.state === 'DETERMINED' ? esperado.paraMostrar(delDia.value, decimales) : 'no se esperaba'} (API ${d.value})`
        : `sin indicado (${d.reason})`;
    filas.push(`    ${fecha} · indicado ${indicado} · registrado ${registrado}${punto ? ` (API ${punto.value ?? '—'} ${punto.quality})` : ''}`);
  }
  // El hueco: declarado como hueco y la línea no lo une (los puntos de los dos lados, en tramos distintos).
  if (x.hueco !== undefined) {
    const fecha = diaMenos(hoy, x.hueco);
    if (!r.recorded.gaps.some((g) => g.from <= fecha && fecha <= g.to && g.state === 'NO_DATA')) dif.push(`hueco: ${fecha} no figura entre los huecos (${JSON.stringify(r.recorded.gaps)})`);
    const antes = r.recorded.points.find((p) => p.date === diaMenos(hoy, x.hueco + 1));
    const despues = r.recorded.points.find((p) => p.date === diaMenos(hoy, x.hueco - 1));
    if (!antes || !despues || antes.segment === despues.segment) dif.push(`hueco: la línea une ${diaMenos(hoy, x.hueco + 1)} con ${diaMenos(hoy, x.hueco - 1)} (tramos ${antes?.segment} y ${despues?.segment})`);
  }
  // Lo indicado de cada comida registrada: el mismo conjunto de valores, y las comidas diferentes sin indicado.
  const deLasComidas = x.comidas.flatMap((dia) => Object.entries(dia.comidas).map(([comida, reg]) => esperado.indicadoDeLaComida(x.plan, comida, reg, composicion, nutriente)));
  const esperados = deLasComidas.filter((v) => v !== null).map((v) => Number(esperado.exacto(v))).sort((a, b) => a - b);
  const llegaron = r.prescribed.planned.meals.filter((m) => m.state === 'DETERMINED').map((m) => m.value).sort((a, b) => a - b);
  if (esperados.length !== llegaron.length || esperados.some((v, i) => !iguales(llegaron[i], v))) dif.push(`indicado por comida: se esperaban ${JSON.stringify(esperados)} y llegaron ${JSON.stringify(llegaron)}`);
  const diferentes = deLasComidas.filter((v) => v === null).length;
  const sinIndicado = r.prescribed.planned.meals.filter((m) => m.state === 'UNDETERMINED');
  if (sinIndicado.length !== diferentes || sinIndicado.some((m) => m.reason !== 'DIFFERENT_MEAL')) dif.push(`comidas sin indicado: se esperaban ${diferentes} comidas diferentes y llegaron ${JSON.stringify(sinIndicado.map((m) => m.reason))}`);
  // La cobertura: los días con registros y los registros del período.
  const registros = x.comidas.reduce((n, dia) => n + Object.keys(dia.comidas).length, 0);
  if (r.coverage.daysWithRecords !== x.comidas.length || r.coverage.records !== registros)
    dif.push(`cobertura: ${r.coverage.daysWithRecords} días con registros y ${r.coverage.records} registros; se esperaban ${x.comidas.length} y ${registros}`);
  filas.unshift(`  ${metrica} desde ${desde}:`);
  return { diferencias: dif, filas };
}

/** Lo que dice la comparación de un escenario, como una parte más. */
export function nutricionPrevista(x, hoy, composicion, r, metrica) {
  const lectura = lecturaPrevista(r, `la comparación (${metrica})`);
  if (lectura.estado !== COMPROBADO) return { parte: lectura, filas: [] };
  const { diferencias, filas } = compararNutricion(x, hoy, composicion, r.datos.data.result, metrica);
  return {
    parte: diferencias.length ? conDiferencias(`la comparación (${metrica}): ${diferencias.join(' | ')}`) : comprobado(`la comparación (${metrica}): todo coincide con lo calculado aparte`),
    filas,
  };
}

// ─── El veredicto ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * El veredicto de la corrida. `escenarios` = [{ clave, nombre, partes: [{ estado, detalle }] }].
 * - Un escenario está **comprobado** solo si todas sus partes lo están.
 * - Si alguna parte falta o no se pudo comprobar: «PREPARACIÓN INCOMPLETA» y código 2 (aunque también haya diferencias).
 * - Si no, y alguna tiene diferencias: «DIFERENCIAS» y código 1.
 * - «SIN DIFERENCIAS» (código 0) solo con todos los escenarios obligatorios comprobados.
 */
export function veredicto(escenarios, obligatorios) {
  const porClave = new Map(escenarios.map((e) => [e.clave, e]));
  const ausentes = obligatorios.filter((o) => !porClave.has(o.clave)).map((o) => ({ clave: o.clave, nombre: o.nombre, partes: [falta('el verificador no lo revisó')] }));
  const todos = [...escenarios, ...ausentes];
  const pendientes = todos.filter((e) => e.partes.length === 0 || e.partes.some((p) => p.estado === FALTA || p.estado === NO_COMPROBADO));
  const conDiferencias = todos.filter((e) => e.partes.some((p) => p.estado === CON_DIFERENCIAS));
  const comprobados = todos.filter((e) => e.partes.length > 0 && e.partes.every((p) => p.estado === COMPROBADO));
  const lineas = [`Escenarios comprobados: ${comprobados.length} de ${obligatorios.length}${comprobados.length ? ` (${comprobados.map((e) => e.nombre).join('; ')})` : ''}.`];
  if (pendientes.length) {
    lineas.push(`Faltan o no se pudieron comprobar (${pendientes.length}):`);
    for (const e of pendientes) lineas.push(`  - ${e.nombre}: ${e.partes.filter((p) => p.estado === FALTA || p.estado === NO_COMPROBADO).map((p) => (p.estado === FALTA ? p.detalle : `no comprobado: ${p.detalle}`)).join('; ') || 'sin partes'}`);
  }
  if (conDiferencias.length) {
    lineas.push(`Diferencias (${conDiferencias.reduce((n, e) => n + e.partes.filter((p) => p.estado === CON_DIFERENCIAS).length, 0)}):`);
    for (const e of conDiferencias) for (const p of e.partes.filter((q) => q.estado === CON_DIFERENCIAS)) lineas.push(`  - ${e.nombre}: ${p.detalle}`);
  }
  let codigo;
  if (pendientes.length) {
    codigo = 2;
    lineas.push(`PREPARACIÓN INCOMPLETA: ${pendientes.length} de ${obligatorios.length} escenarios sin comprobar${conDiferencias.length ? `, y ${conDiferencias.length} con diferencias` : ''}.`);
  } else if (conDiferencias.length) {
    codigo = 1;
    lineas.push(`DIFERENCIAS en ${conDiferencias.length} de ${obligatorios.length} escenarios.`);
  } else {
    codigo = 0;
    lineas.push(`SIN DIFERENCIAS: los ${obligatorios.length} escenarios obligatorios, comprobados.`);
  }
  return {
    codigo,
    lineas,
    comprobados: comprobados.map((e) => e.clave),
    pendientes: pendientes.map((e) => e.clave),
    conDiferencias: conDiferencias.map((e) => e.clave),
    escenarios: todos,
  };
}
