/**
 * «Para tu próxima revisión» (encargo del 2026-10-09, eje 1): observaciones factuales que preparan la consulta.
 *
 * - **Reglas determinísticas y plantillas fijas.** Nada de IA y ninguna palabra que califique («mejoró», «empeoró», «no
 *   cumplió», «adherencia»): cada observación dice un hecho, de dónde sale, sobre qué alcance, con qué fecha de corte y
 *   qué acción permite profundizarlo.
 * - **Un modelo común** (`ObservacionDelResumen`): regla, argumentos tipados, referencias a los datos de origen,
 *   disponibilidad y acción. La web solo lo dibuja.
 * - **Desde la última revisión, por área:** cada área tiene su propio corte (su última revisión registrada). Sin revisión,
 *   el alcance es «En el período seleccionado». Abrir la ficha nunca crea una revisión.
 * - **Ocurrió no es lo mismo que se incorporó o se corrigió:** las novedades separan lo que pasó después del corte de lo
 *   que se cargó o corrigió después sobre hechos anteriores (instantes de registro y de cada relación, nunca `updatedAt`).
 * - **Prioridad:** 1, lo que no se pudo leer («No pudimos completar esta parte») y los pendientes explícitos; 2, cambios
 *   de planificación o de comparabilidad; 3, información nueva; 4, cobertura. Dentro de una prioridad, Nutrición,
 *   Entrenamiento y Antropometría. Una parte que falta va primero: escondida detrás de «Ver todas», la síntesis parecía
 *   completa.
 * - **Un área no autorizada no aporta nada**, ni un conteo: la síntesis recibe solo lo que el PDP dejó leer.
 * - **Una lectura que falló** se dice («No pudimos completar esta parte»), nunca se completa con supuestos.
 */
import type { DominioDeAnalisis, NovedadesDesde, OrigenDeDato, ResultadoDeProyeccionNutricional, VigenciaDePlan } from './contratos-analisis';
import type { ResumenDeAntropometria, ResumenDeEntrenamiento, ResumenDeNutricion } from './contratos-vinculo';
import { diasEntreFechas, fechaCivil } from './fechas-civiles';
import { numero } from './formato-numeros';

export type AreaDelResumen = 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA';

/** Una lectura de la que depende una parte de la síntesis. `NO_APLICA`: esa parte no corresponde (por ejemplo, sin revisión no hay corte). */
export type LecturaDeLaSintesis<T> = { readonly estado: 'LISTA'; readonly valor: T } | { readonly estado: 'FALLO' } | { readonly estado: 'NO_APLICA' };

export interface NovedadesDeUnArea {
  readonly conteos: NovedadesDesde;
  /** El primer día que cubrió la lectura: si el corte es anterior, lo previo no se revisó y se dice. */
  readonly leidoDesde: string;
}

export interface CoberturaDeEntrenamiento {
  readonly sesiones: number;
  readonly conCambios: number;
  readonly noRealizadas: number;
  readonly resumidas: number;
}

export interface MedidaConCambioDeComparabilidad {
  readonly metricCode: string;
  readonly nombre: string;
  readonly grupos: number;
}

export interface DatosDeLaSintesis {
  /** La fecha civil de hoy y la zona del asesorado. */
  readonly hoy: string;
  readonly zonaHoraria: string;
  readonly periodo: { readonly desde: string; readonly hasta: string };
  /** `null`: el área no está autorizada (o no se trabaja con el asesorado). No aporta nada. */
  readonly nutricion: {
    readonly resumen: ResumenDeNutricion | null;
    readonly novedades: LecturaDeLaSintesis<NovedadesDeUnArea>;
    readonly cobertura: LecturaDeLaSintesis<ResultadoDeProyeccionNutricional['coverage']>;
    /** Las vigencias del período (API-PRJ-01): dicen desde cuándo hubo un plan en el que registrar. */
    readonly vigencias?: readonly VigenciaDePlan[];
  } | null;
  readonly entrenamiento: {
    readonly resumen: ResumenDeEntrenamiento | null;
    readonly novedades: LecturaDeLaSintesis<NovedadesDeUnArea>;
    readonly cobertura: LecturaDeLaSintesis<CoberturaDeEntrenamiento>;
    readonly vigencias?: readonly VigenciaDePlan[];
  } | null;
  readonly antropometria: {
    readonly resumen: ResumenDeAntropometria | null;
    readonly comparabilidad: LecturaDeLaSintesis<readonly MedidaConCambioDeComparabilidad[]>;
  } | null;
}

/** El corte de un área: su última revisión registrada. */
export interface CorteDeRevision {
  readonly reviewId: string;
  readonly instante: string;
}

/** Sobre qué alcance habla una observación. */
export type AlcanceDeObservacion =
  | { readonly tipo: 'DESDE_LA_REVISION'; readonly corte: CorteDeRevision }
  | { readonly tipo: 'PERIODO'; readonly desde: string; readonly hasta: string }
  | { readonly tipo: 'HOY' };

/** La acción que profundiza una observación. La web la convierte en un enlace con retorno. */
export type AccionDelResumen =
  | { readonly tipo: 'REVISIONES'; readonly area: Exclude<AreaDelResumen, 'ANTROPOMETRIA'>; readonly reviewId: string | null }
  | { readonly tipo: 'PLANIFICACION'; readonly area: Exclude<AreaDelResumen, 'ANTROPOMETRIA'>; readonly planVersionId: string }
  | { readonly tipo: 'LINEA_DE_TIEMPO'; readonly dominio: DominioDeAnalisis; readonly desde: string | null }
  | { readonly tipo: 'TOMA'; readonly evaluationId: string }
  | { readonly tipo: 'ANTROPOMETRIA' }
  | { readonly tipo: 'PREGUNTA'; readonly pregunta: 'informacion-para-revisar' | 'comparar-etapas'; readonly area: Exclude<AreaDelResumen, 'ANTROPOMETRIA'> | null };

interface Base {
  readonly area: AreaDelResumen;
  readonly prioridad: 1 | 2 | 3 | 4;
  readonly alcance: AlcanceDeObservacion;
  readonly origen: readonly OrigenDeDato[];
  readonly accion: AccionDelResumen | null;
}

export type ObservacionDelResumen =
  | (Base & { readonly regla: 'REVISION_SIN_APLICAR'; readonly args: { readonly reviewId: string; readonly registradaEl: string } })
  | (Base & { readonly regla: 'PROXIMA_REVISION'; readonly args: { readonly fecha: string; readonly dias: number } })
  | (Base & { readonly regla: 'BORRADOR_SIN_ACTIVAR'; readonly args: { readonly planVersionId: string; readonly registradoEl: string; readonly deLaRevision: boolean } })
  | (Base & { readonly regla: 'PLAN_ACTIVADO_DESPUES_DEL_CORTE'; readonly args: { readonly planVersionId: string; readonly activadoEl: string } })
  | (Base & { readonly regla: 'OBJETIVO_NUEVO_DESPUES_DEL_CORTE'; readonly args: { readonly objectiveVersionId: string; readonly rigeDesde: string; readonly porLaRevision: boolean } })
  | (Base & { readonly regla: 'CAMBIO_DE_COMPARABILIDAD'; readonly args: { readonly medidas: readonly MedidaConCambioDeComparabilidad[] } })
  | (Base & {
      readonly regla: 'NOVEDADES_DESDE_EL_CORTE';
      readonly args: { readonly ocurrieron: number; readonly incorporadas: number; readonly corregidas: number; readonly nombreDelRegistro: readonly [string, string]; readonly leidoDesde: string; readonly recortado: boolean };
    })
  | (Base & { readonly regla: 'ULTIMA_TOMA'; readonly args: { readonly evaluationId: string; readonly ocurrioEl: string; readonly autor: string; readonly enElPeriodo: number } })
  | (Base & { readonly regla: 'COBERTURA_NUTRICIONAL'; readonly args: ResultadoDeProyeccionNutricional['coverage'] & { readonly primerPlanDesde: string | null } })
  | (Base & { readonly regla: 'COBERTURA_DE_ENTRENAMIENTO'; readonly args: CoberturaDeEntrenamiento & { readonly primerPlanDesde: string | null } })
  | (Base & { readonly regla: 'PARTE_NO_DISPONIBLE'; readonly args: { readonly parte: 'NOVEDADES' | 'COBERTURA' | 'COMPARABILIDAD' } });

export type ReglaDelResumen = ObservacionDelResumen['regla'];

/** El orden de las reglas dentro de una misma prioridad y área. */
const ORDEN_DE_REGLAS: readonly ReglaDelResumen[] = [
  'PARTE_NO_DISPONIBLE',
  'REVISION_SIN_APLICAR',
  'PROXIMA_REVISION',
  'BORRADOR_SIN_ACTIVAR',
  'PLAN_ACTIVADO_DESPUES_DEL_CORTE',
  'OBJETIVO_NUEVO_DESPUES_DEL_CORTE',
  'CAMBIO_DE_COMPARABILIDAD',
  'NOVEDADES_DESDE_EL_CORTE',
  'ULTIMA_TOMA',
  'COBERTURA_NUTRICIONAL',
  'COBERTURA_DE_ENTRENAMIENTO',
];
const ORDEN_DE_AREAS: readonly AreaDelResumen[] = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];

/** Cuántos días antes de la fecha acordada la próxima revisión pasa a ser un pendiente explícito. */
export const DIAS_DE_ANTICIPACION_DE_LA_REVISION = 7;

const DOMINIO_DEL_AREA: Readonly<Record<AreaDelResumen, DominioDeAnalisis>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING', ANTROPOMETRIA: 'ANTHROPOMETRY' };

/** El registro que cuenta como «información nueva» de cada área, en singular y plural. */
const REGISTRO_DEL_AREA: Readonly<Record<'NUTRICION' | 'ENTRENAMIENTO', { readonly tipo: NovedadesDesde['counts'][number]['eventType']; readonly nombre: readonly [string, string] }>> = {
  NUTRICION: { tipo: 'MEAL_RECORDED', nombre: ['comida registrada', 'comidas registradas'] },
  ENTRENAMIENTO: { tipo: 'TRAINING_SESSION_RECORDED', nombre: ['sesión registrada', 'sesiones registradas'] },
};

type AreaConPlan = 'NUTRICION' | 'ENTRENAMIENTO';

function delArea(
  area: AreaConPlan,
  resumen: ResumenDeNutricion | ResumenDeEntrenamiento | null,
  novedades: LecturaDeLaSintesis<NovedadesDeUnArea>,
  d: DatosDeLaSintesis,
): ObservacionDelResumen[] {
  const salida: ObservacionDelResumen[] = [];
  const ultima = resumen?.lastReview ?? null;
  const corte: CorteDeRevision | null = ultima ? { reviewId: ultima.reviewId, instante: ultima.recordedAt } : null;
  const desdeElCorte: AlcanceDeObservacion | null = corte ? { tipo: 'DESDE_LA_REVISION', corte } : null;
  const tipoDeRevision = area === 'NUTRICION' ? 'NUTRITION_REVIEW' : 'TRAINING_REVIEW';
  const tipoDeVersion = area === 'NUTRICION' ? 'NUTRITION_PLAN_VERSION' : 'TRAINING_PLAN_VERSION';
  const tipoDeObjetivo = area === 'NUTRICION' ? 'NUTRITION_OBJECTIVE_VERSION' : 'TRAINING_OBJECTIVE_VERSION';

  // 1 · Pendientes explícitos.
  if (ultima && ultima.application === null) {
    salida.push({
      regla: 'REVISION_SIN_APLICAR',
      area,
      prioridad: 1,
      alcance: { tipo: 'HOY' },
      origen: [{ type: tipoDeRevision, id: ultima.reviewId }],
      accion: { tipo: 'REVISIONES', area, reviewId: ultima.reviewId },
      args: { reviewId: ultima.reviewId, registradaEl: ultima.recordedAt },
    });
  }
  const proxima = resumen?.activePlan?.nextReviewAt ?? null;
  if (proxima) {
    const dias = diasEntreFechas(d.hoy, proxima);
    if (dias <= DIAS_DE_ANTICIPACION_DE_LA_REVISION) {
      salida.push({
        regla: 'PROXIMA_REVISION',
        area,
        prioridad: 1,
        alcance: { tipo: 'HOY' },
        origen: [{ type: tipoDeVersion, id: (resumen?.activePlan as { planVersionId: string }).planVersionId }],
        accion: { tipo: 'PREGUNTA', pregunta: 'informacion-para-revisar', area },
        args: { fecha: proxima, dias },
      });
    }
  }
  const borrador = resumen?.draftPlan ?? null;
  if (borrador) {
    salida.push({
      regla: 'BORRADOR_SIN_ACTIVAR',
      area,
      prioridad: 1,
      alcance: { tipo: 'HOY' },
      origen: [{ type: tipoDeVersion, id: borrador.planVersionId }],
      accion: { tipo: 'PLANIFICACION', area, planVersionId: borrador.planVersionId },
      args: { planVersionId: borrador.planVersionId, registradoEl: borrador.recordedAt, deLaRevision: borrador.fromReviewId !== null },
    });
  }

  // 2 · Cambios de planificación después del corte.
  if (corte && resumen?.activePlan && Date.parse(resumen.activePlan.activatedAt) > Date.parse(corte.instante)) {
    salida.push({
      regla: 'PLAN_ACTIVADO_DESPUES_DEL_CORTE',
      area,
      prioridad: 2,
      alcance: desdeElCorte as AlcanceDeObservacion,
      origen: [{ type: tipoDeVersion, id: resumen.activePlan.planVersionId }],
      accion: { tipo: 'PLANIFICACION', area, planVersionId: resumen.activePlan.planVersionId },
      args: { planVersionId: resumen.activePlan.planVersionId, activadoEl: resumen.activePlan.activatedAt },
    });
  }
  if (corte && resumen?.objective && Date.parse(resumen.objective.effectiveFrom) > Date.parse(corte.instante)) {
    salida.push({
      regla: 'OBJETIVO_NUEVO_DESPUES_DEL_CORTE',
      area,
      prioridad: 2,
      alcance: desdeElCorte as AlcanceDeObservacion,
      origen: [{ type: tipoDeObjetivo, id: resumen.objective.objectiveVersionId }],
      accion: null,
      args: {
        objectiveVersionId: resumen.objective.objectiveVersionId,
        rigeDesde: resumen.objective.effectiveFrom,
        porLaRevision: ultima?.application?.createdObjectiveVersionId === resumen.objective.objectiveVersionId,
      },
    });
  }

  // 3 · Información nueva desde el corte (solo si hay corte).
  if (corte) {
    if (novedades.estado === 'FALLO') {
      salida.push({ regla: 'PARTE_NO_DISPONIBLE', area, prioridad: 1, alcance: desdeElCorte as AlcanceDeObservacion, origen: [], accion: null, args: { parte: 'NOVEDADES' } });
    } else if (novedades.estado === 'LISTA') {
      const dominio = DOMINIO_DEL_AREA[area];
      const registro = REGISTRO_DEL_AREA[area];
      const contar = (kind: NovedadesDesde['counts'][number]['kind'], soloRegistros: boolean) =>
        novedades.valor.conteos.counts.filter((c) => c.domain === dominio && c.kind === kind && (!soloRegistros || c.eventType === registro.tipo)).reduce((s, c) => s + c.count, 0);
      salida.push({
        regla: 'NOVEDADES_DESDE_EL_CORTE',
        area,
        prioridad: 3,
        alcance: desdeElCorte as AlcanceDeObservacion,
        origen: [{ type: tipoDeRevision, id: corte.reviewId }],
        accion: { tipo: 'LINEA_DE_TIEMPO', dominio, desde: corte.instante },
        args: {
          ocurrieron: contar('OCURRIO_DESPUES', true),
          incorporadas: contar('INCORPORADO_DESPUES', false),
          corregidas: contar('CORREGIDO_DESPUES', false),
          nombreDelRegistro: registro.nombre,
          leidoDesde: novedades.valor.leidoDesde,
          recortado: fechaCivil(corte.instante, d.zonaHoraria) < novedades.valor.leidoDesde,
        },
      });
    }
  }
  return salida;
}

/**
 * El día desde el que rige el primer plan del período, si empezó después de su inicio: los días anteriores no tenían un
 * plan de este seguimiento en el que registrar, y la cobertura lo dice para que «1 de 90 días» no se lea como 89 días sin
 * registrar. Es un hecho de las vigencias, no una pausa deducida de la ausencia de registros.
 */
export function primerPlanDelPeriodo(vigencias: readonly VigenciaDePlan[] | undefined, desde: string): string | null {
  if (!vigencias || vigencias.length === 0) return null;
  const primero = vigencias.reduce((m, v) => (v.from < m ? v.from : m), (vigencias[0] as VigenciaDePlan).from);
  return primero > desde ? primero : null;
}

/**
 * El comienzo de esa aclaración, para un rótulo corto junto a un gráfico («El plan rige desde el 9/10»): las mismas
 * palabras con las que empieza la frase completa, que queda en la cobertura del área.
 */
export const inicioDelPrimerPlan = (desde: string, f: FormatoDeLaSintesis): string => `El plan rige desde el ${f.fecha(desde)}`;

/** La aclaración de la cobertura cuando el plan empezó a regir dentro del período («El plan rige desde el 9/10…»). */
export const textoDelPrimerPlan = (desde: string, f: FormatoDeLaSintesis): string => `${inicioDelPrimerPlan(desde, f)}: antes, en el período, no había un plan de este seguimiento.`;

/** Las observaciones de la síntesis, ordenadas por prioridad. La web muestra las primeras y ofrece «Ver todas». */
export function sintesisDelResumen(d: DatosDeLaSintesis): ObservacionDelResumen[] {
  const salida: ObservacionDelResumen[] = [];
  const periodo: AlcanceDeObservacion = { tipo: 'PERIODO', desde: d.periodo.desde, hasta: d.periodo.hasta };

  if (d.nutricion) {
    salida.push(...delArea('NUTRICION', d.nutricion.resumen, d.nutricion.novedades, d));
    const c = d.nutricion.cobertura;
    if (c.estado === 'FALLO') salida.push({ regla: 'PARTE_NO_DISPONIBLE', area: 'NUTRICION', prioridad: 1, alcance: periodo, origen: [], accion: null, args: { parte: 'COBERTURA' } });
    else if (c.estado === 'LISTA')
      salida.push({
        regla: 'COBERTURA_NUTRICIONAL',
        area: 'NUTRICION',
        prioridad: 4,
        alcance: periodo,
        origen: [],
        accion: { tipo: 'PREGUNTA', pregunta: 'informacion-para-revisar', area: 'NUTRICION' },
        args: { ...c.valor, primerPlanDesde: primerPlanDelPeriodo(d.nutricion.vigencias, d.periodo.desde) },
      });
  }
  if (d.entrenamiento) {
    salida.push(...delArea('ENTRENAMIENTO', d.entrenamiento.resumen, d.entrenamiento.novedades, d));
    const c = d.entrenamiento.cobertura;
    if (c.estado === 'FALLO') salida.push({ regla: 'PARTE_NO_DISPONIBLE', area: 'ENTRENAMIENTO', prioridad: 1, alcance: periodo, origen: [], accion: null, args: { parte: 'COBERTURA' } });
    else if (c.estado === 'LISTA')
      salida.push({
        regla: 'COBERTURA_DE_ENTRENAMIENTO',
        area: 'ENTRENAMIENTO',
        prioridad: 4,
        alcance: periodo,
        origen: [],
        accion: { tipo: 'PREGUNTA', pregunta: 'informacion-para-revisar', area: 'ENTRENAMIENTO' },
        args: { ...c.valor, primerPlanDesde: primerPlanDelPeriodo(d.entrenamiento.vigencias, d.periodo.desde) },
      });
  }
  if (d.antropometria) {
    const c = d.antropometria.comparabilidad;
    if (c.estado === 'FALLO') salida.push({ regla: 'PARTE_NO_DISPONIBLE', area: 'ANTROPOMETRIA', prioridad: 1, alcance: periodo, origen: [], accion: null, args: { parte: 'COMPARABILIDAD' } });
    else if (c.estado === 'LISTA' && c.valor.some((m) => m.grupos > 1))
      salida.push({
        regla: 'CAMBIO_DE_COMPARABILIDAD',
        area: 'ANTROPOMETRIA',
        prioridad: 2,
        alcance: periodo,
        origen: [],
        accion: { tipo: 'ANTROPOMETRIA' },
        args: { medidas: c.valor.filter((m) => m.grupos > 1) },
      });
    const ultima = d.antropometria.resumen?.lastEvaluation ?? null;
    if (ultima)
      salida.push({
        regla: 'ULTIMA_TOMA',
        area: 'ANTROPOMETRIA',
        prioridad: 3,
        alcance: { tipo: 'HOY' },
        origen: [{ type: 'ANTHROPOMETRIC_EVALUATION', id: ultima.evaluationId }],
        accion: { tipo: 'TOMA', evaluationId: ultima.evaluationId },
        args: { evaluationId: ultima.evaluationId, ocurrioEl: ultima.occurredAt, autor: ultima.author.displayName, enElPeriodo: d.antropometria.resumen?.registeredEvaluations ?? 0 },
      });
  }

  return salida.sort(
    (a, b) => a.prioridad - b.prioridad || ORDEN_DE_AREAS.indexOf(a.area) - ORDEN_DE_AREAS.indexOf(b.area) || ORDEN_DE_REGLAS.indexOf(a.regla) - ORDEN_DE_REGLAS.indexOf(b.regla),
  );
}

// ─── Plantillas ─────────────────────────────────────────────────────────────────────────────────

/** Cómo se escriben fechas e instantes en la pantalla (lo pone la web, con su configuración regional). */
export interface FormatoDeLaSintesis {
  /** Una fecha civil, «20 sept 2026». */
  readonly fecha: (fechaCivil: string) => string;
  /** La fecha civil de un instante en la zona del asesorado, «20 sept 2026». */
  readonly dia: (instante: string) => string;
}

export const NOMBRE_DEL_AREA: Readonly<Record<AreaDelResumen, string>> = { NUTRICION: 'Nutrición', ENTRENAMIENTO: 'Entrenamiento', ANTROPOMETRIA: 'Antropometría' };

const cuenta = (n: number, [uno, varios]: readonly [string, string]): string => `${numero(n)} ${n === 1 ? uno : varios}`;

/** El alcance de una observación, como encabezado: «Desde la revisión del 20 sept 2026», «En el período seleccionado», «Hoy». */
export function textoDelAlcance(a: AlcanceDeObservacion, f: FormatoDeLaSintesis): string {
  switch (a.tipo) {
    case 'DESDE_LA_REVISION':
      return `Desde la revisión del ${f.dia(a.corte.instante)}`;
    case 'PERIODO':
      return 'En el período seleccionado';
    case 'HOY':
      return 'Hoy';
  }
}

/** El texto de una observación: un hecho, sin calificar. La acción la dibuja la web. */
export function textoDeObservacion(o: ObservacionDelResumen, f: FormatoDeLaSintesis): string {
  switch (o.regla) {
    case 'REVISION_SIN_APLICAR':
      return `La revisión del ${f.dia(o.args.registradaEl)} está registrada y su resultado todavía no se aplicó.`;
    case 'PROXIMA_REVISION': {
      const { dias, fecha } = o.args;
      if (dias === 0) return `La próxima revisión acordada es hoy, ${f.fecha(fecha)}.`;
      if (dias > 0) return `La próxima revisión acordada es el ${f.fecha(fecha)} (${dias === 1 ? 'mañana' : `en ${numero(dias)} días`}).`;
      return `La próxima revisión acordada era el ${f.fecha(fecha)} (hace ${cuenta(-dias, ['día', 'días'])}).`;
    }
    case 'BORRADOR_SIN_ACTIVAR':
      return `Hay una versión nueva del plan en borrador, ${o.args.deLaRevision ? 'creada al aplicar una revisión' : 'creada'} el ${f.dia(o.args.registradoEl)}. No rige hasta que se active.`;
    case 'PLAN_ACTIVADO_DESPUES_DEL_CORTE':
      return `El plan vigente se activó el ${f.dia(o.args.activadoEl)}, después de la última revisión.`;
    case 'OBJETIVO_NUEVO_DESPUES_DEL_CORTE':
      return `El objetivo vigente rige desde el ${f.dia(o.args.rigeDesde)}${o.args.porLaRevision ? ', creado al aplicar la última revisión' : ', después de la última revisión'}.`;
    case 'CAMBIO_DE_COMPARABILIDAD': {
      const nombres = o.args.medidas.map((m) => m.nombre).join(', ');
      return `${o.args.medidas.length === 1 ? 'Una medida cambió' : `${numero(o.args.medidas.length)} medidas cambiaron`} de protocolo, método o unidad en el período (${nombres}): ${o.args.medidas.length === 1 ? 'su serie se corta' : 'sus series se cortan'} donde cambia.`;
    }
    case 'NOVEDADES_DESDE_EL_CORTE': {
      const { ocurrieron, incorporadas, corregidas, nombreDelRegistro } = o.args;
      const partes = [
        ...(ocurrieron > 0 ? [cuenta(ocurrieron, nombreDelRegistro)] : []),
        ...(incorporadas > 0 ? [`${cuenta(incorporadas, ['hecho anterior cargado', 'hechos anteriores cargados'])} después`] : []),
        ...(corregidas > 0 ? [cuenta(corregidas, ['registro anterior corregido o anulado', 'registros anteriores corregidos o anulados'])] : []),
      ];
      const recorte = o.args.recortado ? ` Se revisó desde el ${f.fecha(o.args.leidoDesde)}: el máximo de lectura es un año.` : '';
      if (partes.length === 0) return `No hay registros nuevos, cargas tardías ni correcciones.${recorte}`;
      const lista = partes.length === 1 ? (partes[0] as string) : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
      return `${lista.charAt(0).toUpperCase()}${lista.slice(1)}.${recorte}`;
    }
    case 'ULTIMA_TOMA':
      return `Última toma: ${f.dia(o.args.ocurrioEl)} (${o.args.autor}). ${o.args.enElPeriodo === 0 ? 'Ninguna en el período.' : `${cuenta(o.args.enElPeriodo, ['toma', 'tomas'])} en el período.`}`;
    case 'COBERTURA_NUTRICIONAL': {
      const c = o.args;
      const plan = c.primerPlanDesde ? ` ${textoDelPrimerPlan(c.primerPlanDesde, f)}` : '';
      if (c.records === 0) return `Sin registros de comida en el período (${cuenta(c.daysInPeriod, ['día', 'días'])}).${plan}`;
      return `${numero(c.daysWithRecords)} de ${cuenta(c.daysInPeriod, ['día', 'días'])} con algún registro; ${cuenta(c.records, ['registro', 'registros'])}: ${numero(c.recordsWithQuantities)} con cantidades y ${numero(c.recordsWithoutQuantities)} sin cantidades.${plan}`;
    }
    case 'COBERTURA_DE_ENTRENAMIENTO': {
      const c = o.args;
      const plan = c.primerPlanDesde ? ` ${textoDelPrimerPlan(c.primerPlanDesde, f)}` : '';
      if (c.sesiones === 0) return `Sin sesiones registradas en el período.${plan}`;
      const extras = [
        ...(c.conCambios > 0 ? [`${numero(c.conCambios)} con cambios`] : []),
        ...(c.noRealizadas > 0 ? [`${numero(c.noRealizadas)} ${c.noRealizadas === 1 ? 'registrada' : 'registradas'} como no ${c.noRealizadas === 1 ? 'realizada' : 'realizadas'}`] : []),
        ...(c.resumidas > 0 ? [`${numero(c.resumidas)} ${c.resumidas === 1 ? 'resumida' : 'resumidas'}, sin series`] : []),
      ];
      return `${cuenta(c.sesiones, ['sesión registrada', 'sesiones registradas'])}${extras.length > 0 ? ` (${extras.join(', ')})` : ''}.${plan}`;
    }
    case 'PARTE_NO_DISPONIBLE':
      return `No pudimos completar esta parte (${{ NOVEDADES: 'lo nuevo desde la revisión', COBERTURA: 'la cobertura del período', COMPARABILIDAD: 'los cambios de comparabilidad' }[o.args.parte]}).`;
  }
}

/**
 * Una parte de una observación, para dibujarla en renglones: una cuenta (la cifra y lo que cuenta) o una frase.
 * `cifra` es el número ya escrito («44»); `null` si la parte es una frase entera.
 */
export interface ParteDeObservacion {
  readonly cifra: string | null;
  readonly texto: string;
}

const frase = (texto: string): ParteDeObservacion => ({ cifra: null, texto });
const parteDeCuenta = (n: number, [uno, varios]: readonly [string, string]): ParteDeObservacion => ({ cifra: numero(n), texto: n === 1 ? uno : varios });

/**
 * La misma observación en partes (WP-ESCRITORIO-AMABLE, parte 3), para escribirla en renglones con la cifra adelante en
 * lugar de una frase con comas. **Las palabras son las de `textoDeObservacion`:** cada cuenta («44 comidas registradas»)
 * y cada frase están tal cual en el texto completo, y una prueba lo comprueba regla por regla. Una observación que no
 * es una lista de cuentas (un pendiente, un cambio de planificación) tiene una sola parte: su frase entera.
 */
export function partesDeObservacion(o: ObservacionDelResumen, f: FormatoDeLaSintesis): ParteDeObservacion[] {
  switch (o.regla) {
    case 'NOVEDADES_DESDE_EL_CORTE': {
      const { ocurrieron, incorporadas, corregidas, nombreDelRegistro } = o.args;
      const cuentas = [
        ...(ocurrieron > 0 ? [parteDeCuenta(ocurrieron, nombreDelRegistro)] : []),
        ...(incorporadas > 0 ? [parteDeCuenta(incorporadas, ['hecho anterior cargado después', 'hechos anteriores cargados después'])] : []),
        ...(corregidas > 0 ? [parteDeCuenta(corregidas, ['registro anterior corregido o anulado', 'registros anteriores corregidos o anulados'])] : []),
      ];
      const recorte = o.args.recortado ? [frase(`Se revisó desde el ${f.fecha(o.args.leidoDesde)}: el máximo de lectura es un año.`)] : [];
      return cuentas.length === 0 ? [frase('No hay registros nuevos, cargas tardías ni correcciones.'), ...recorte] : [...cuentas, ...recorte];
    }
    case 'COBERTURA_NUTRICIONAL': {
      const c = o.args;
      const plan = c.primerPlanDesde ? [frase(textoDelPrimerPlan(c.primerPlanDesde, f))] : [];
      if (c.records === 0) return [frase(`Sin registros de comida en el período (${cuenta(c.daysInPeriod, ['día', 'días'])}).`), ...plan];
      return [
        { cifra: numero(c.daysWithRecords), texto: `de ${cuenta(c.daysInPeriod, ['día', 'días'])} con algún registro` },
        { cifra: numero(c.records), texto: `${c.records === 1 ? 'registro' : 'registros'}: ${numero(c.recordsWithQuantities)} con cantidades y ${numero(c.recordsWithoutQuantities)} sin cantidades` },
        ...plan,
      ];
    }
    case 'COBERTURA_DE_ENTRENAMIENTO': {
      const c = o.args;
      const plan = c.primerPlanDesde ? [frase(textoDelPrimerPlan(c.primerPlanDesde, f))] : [];
      if (c.sesiones === 0) return [frase('Sin sesiones registradas en el período.'), ...plan];
      return [
        parteDeCuenta(c.sesiones, ['sesión registrada', 'sesiones registradas']),
        ...(c.conCambios > 0 ? [{ cifra: numero(c.conCambios), texto: 'con cambios' }] : []),
        ...(c.noRealizadas > 0 ? [parteDeCuenta(c.noRealizadas, ['registrada como no realizada', 'registradas como no realizadas'])] : []),
        ...(c.resumidas > 0 ? [parteDeCuenta(c.resumidas, ['resumida, sin series', 'resumidas, sin series'])] : []),
        ...plan,
      ];
    }
    default:
      return [frase(textoDeObservacion(o, f))];
  }
}

/** De dónde sale cada observación: la regla y sus datos de origen, en palabras (se muestra junto a la observación). */
export const FUENTE_DE_LA_REGLA: Readonly<Record<ReglaDelResumen, string>> = {
  REVISION_SIN_APLICAR: 'la última revisión registrada del área y su aplicación',
  PROXIMA_REVISION: 'la próxima revisión acordada en el plan vigente',
  BORRADOR_SIN_ACTIVAR: 'la versión del plan en preparación',
  PLAN_ACTIVADO_DESPUES_DEL_CORTE: 'la activación del plan vigente y la última revisión',
  OBJETIVO_NUEVO_DESPUES_DEL_CORTE: 'la versión vigente del objetivo y la última revisión',
  CAMBIO_DE_COMPARABILIDAD: 'los grupos de comparabilidad de las tomas del período (protocolo, método y unidad)',
  NOVEDADES_DESDE_EL_CORTE: 'la línea de tiempo del área: cuándo ocurrió cada hecho, cuándo se registró y cuándo se corrigió',
  ULTIMA_TOMA: 'las tomas registradas del área',
  COBERTURA_NUTRICIONAL: 'los registros de comida del período, con y sin cantidades',
  COBERTURA_DE_ENTRENAMIENTO: 'las sesiones registradas del período',
  PARTE_NO_DISPONIBLE: 'una lectura que no respondió',
};

/** Una clave estable de la observación (para React y para las pruebas). */
export const claveDeObservacion = (o: ObservacionDelResumen): string => `${o.area}:${o.regla}${o.regla === 'PARTE_NO_DISPONIBLE' ? `:${o.args.parte}` : ''}`;

/** Palabras que una plantilla nunca usa: califican a la persona o a su desempeño. */
export const PALABRAS_QUE_CALIFICAN = /\b(mejor\w*|peor\w*|empeor\w*|cumpl\w*|incumpl\w*|adherencia|riesgo\w*|alerta\w*|bien|mal|suficiente\w*|insuficiente\w*|deberí\w*|fall\w*)\b/i;
