import {
  ejerciciosComparables,
  observacionesDelEjercicio,
  redondeoDePresentacion,
  registradoTarde,
  type Alcance,
  type CalidadDeEntrada,
  type DominioDeAnalisis,
  type EjecucionDeEntrenamiento,
  type EntradaDeLineaDeTiempo,
  type RegistroDeComida,
  type RegistroDeEjecucion,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { nombreVisibleDe } from '../entrenamiento/lectura-entrenamiento';
import { fechaLocalEn, finDelDiaLocal, inicioDelDiaLocal } from '../nutricion/zona';
import { nombreDeAsesorado } from '../vinculo/lectura';
import { ZONA, type AlcanceDelAnalisis, type VersionActivada, type VersionDeObjetivo } from './fuentes';

type Tx = Prisma.TransactionClient;

/**
 * Las entradas de la línea de tiempo (API-DSH-04; 09 v0.11 §16; DL-127), una por hecho, armadas desde los modelos de
 * lectura de cada dominio. Reglas que sostiene cada función de acá:
 * - **Ocurrió y registrado son independientes** (T-06-24; TEST-TIM-001): cada uno sale de su columna. Un acto que BE
 *   registra en el momento (activar, revisar, abrir o cerrar un seguimiento) ocurre cuando se registra: la fuente guarda
 *   los dos instantes y son iguales. Si la ocurrencia falta, va `null` y la fecha civil se toma del registro solo para
 *   ordenar.
 * - **Solo relaciones que las fuentes ya contienen** (TEST-TIM-002): sucesión de versiones, ejecución de una versión,
 *   rectificación, anulación, corrección y la versión que nació de una revisión. Nunca por cercanía temporal.
 * - **Una anulación no borra la entrada** (B10-08 §12): el registro sigue, marcado.
 * - **Sin juicios:** los detalles son hechos («Cantidades: informadas»), no calificaciones.
 * - **Las fotos no viajan:** se dice «con foto»; el medio privado se abre en su registro, con su recurso protegido.
 */

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const civil = (d: Date): string => fechaLocalEn(d, ZONA);

const CONDICION: Readonly<Record<RegistroDeEjecucion['sessionCondition'], string>> = {
  COMPLETED: 'Realizada',
  COMPLETED_WITH_DEVIATION: 'Realizada con cambios',
  NOT_COMPLETED: 'No realizada',
};

const RESULTADO: Readonly<Record<string, string>> = {
  MANTENER: 'Mantener',
  AJUSTAR: 'Ajustar',
  SUSTITUIR: 'Sustituir',
  REPROGRAMAR_REVISION: 'Reprogramar la revisión',
  CAMBIAR_OBJETIVO: 'Cambiar el objetivo',
  FINALIZAR: 'Finalizar',
};

const MOTIVO_DE_CIERRE: Readonly<Record<string, string>> = {
  REVISION_FINALIZAR: 'Revisión con resultado «Finalizar»',
  FINALIZACION_DE_VINCULO: 'Fin del vínculo',
  CIERRE_DE_CUENTA: 'Cierre de cuenta',
};

const CANTIDADES: Readonly<Record<string, string>> = { UNCONFIRMED: 'sin confirmar', PLAN_PORTIONS: 'las del plan', REPORTED: 'informadas' };

const NOMBRE_DEL_ALCANCE: Readonly<Record<AlcanceDelAnalisis | 'ANTROPOMETRIA', string>> = { NUTRICION: 'nutrición', ENTRENAMIENTO: 'entrenamiento', ANTROPOMETRIA: 'antropometría' };
const DOMINIO_DEL_ALCANCE: Readonly<Record<AlcanceDelAnalisis | 'ANTROPOMETRIA', DominioDeAnalisis>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING', ANTROPOMETRIA: 'ANTHROPOMETRY' };

const fechaCorta = (f: string): string => `${Number(f.slice(8, 10))}/${Number(f.slice(5, 7))}/${f.slice(0, 4)}`;

/** Lo común de una entrada: las dos marcas de tiempo, por separado, y si se registró en un día civil posterior. */
function tiempos(ocurrio: Date | null, registrado: Date | null, fechaDelHecho?: string): Pick<EntradaDeLineaDeTiempo, 'occurredAt' | 'occurredDate' | 'recordedAt' | 'recordedLate' | 'timeZone'> {
  const occurredDate = fechaDelHecho ?? civil((ocurrio ?? registrado) as Date);
  return { occurredAt: iso(ocurrio), occurredDate, recordedAt: iso(registrado), recordedLate: registradoTarde(occurredDate, iso(registrado), ZONA), timeZone: ZONA };
}

/** Los nombres visibles de los autores, leídos una vez por identidad. */
export class NombresDeAutores {
  private readonly cache = new Map<string, Promise<string>>();
  constructor(private readonly tx: Tx) {}
  de(identidadId: string): Promise<string> {
    if (!this.cache.has(identidadId)) this.cache.set(identidadId, nombreVisibleDe(this.tx, identidadId));
    return this.cache.get(identidadId) as Promise<string>;
  }
}

// ─── Planes y objetivos (los dos dominios con plan) ─────────────────────────────────────────────

export async function entradasDeVersiones(versiones: readonly VersionActivada[], alcance: AlcanceDelAnalisis, desde: string, hasta: string, nombres: NombresDeAutores): Promise<EntradaDeLineaDeTiempo[]> {
  const dominio = DOMINIO_DEL_ALCANCE[alcance];
  const porId = new Map(versiones.map((v) => [v.id, v]));
  const salida: EntradaDeLineaDeTiempo[] = [];
  for (const v of versiones) {
    if (v.desde < desde || v.desde > hasta) continue;
    const previa = v.predecesoraId ? porId.get(v.predecesoraId) : undefined;
    salida.push({
      timelineEntryId: `${alcance === 'NUTRICION' ? 'nplan' : 'tplan'}:${v.id}`,
      domain: dominio,
      eventType: alcance === 'NUTRICION' ? 'NUTRITION_PLAN_ACTIVATED' : 'TRAINING_PLAN_ACTIVATED',
      source: { type: alcance === 'NUTRICION' ? 'NUTRITION_PLAN_VERSION' : 'TRAINING_PLAN_VERSION', id: v.id },
      // La activación es el hecho y BE la registra en el momento: los dos instantes de la fuente son el mismo.
      ...tiempos(v.activadaEl, v.activadaEl),
      author: { identityId: v.autorId, displayName: await nombres.de(v.autorId), role: 'PROFESSIONAL' },
      title: `Plan de ${NOMBRE_DEL_ALCANCE[alcance]} activado · versión ${v.numero}`,
      details: [
        { label: 'Versión', value: String(v.numero) },
        ...(previa ? [{ label: 'Reemplaza a', value: `la versión ${previa.numero}` }] : [{ label: 'Primera versión activada', value: 'sí' }]),
        ...(v.hasta ? [{ label: 'Rigió hasta', value: fechaCorta(v.hasta) }] : []),
      ],
      state: 'EFFECTIVE',
      quality: [],
      planVersionId: v.id,
      exerciseKeys: [],
      relations: previa ? [{ kind: 'SUCCEEDS_VERSION', at: null, target: { type: alcance === 'NUTRICION' ? 'NUTRITION_PLAN_VERSION' : 'TRAINING_PLAN_VERSION', id: previa.id }, label: `Sucede a la versión ${previa.numero}` }] : [],
    });
  }
  return salida;
}

export async function entradasDeObjetivos(objetivos: readonly VersionDeObjetivo[], alcance: AlcanceDelAnalisis, desde: string, hasta: string, nombres: NombresDeAutores): Promise<EntradaDeLineaDeTiempo[]> {
  const salida: EntradaDeLineaDeTiempo[] = [];
  for (const o of objetivos) {
    const fecha = civil(o.vigenteDesde);
    if (fecha < desde || fecha > hasta) continue;
    salida.push({
      timelineEntryId: `${alcance === 'NUTRICION' ? 'nobj' : 'tobj'}:${o.id}`,
      domain: DOMINIO_DEL_ALCANCE[alcance],
      eventType: alcance === 'NUTRICION' ? 'NUTRITION_OBJECTIVE_SET' : 'TRAINING_OBJECTIVE_SET',
      source: { type: alcance === 'NUTRICION' ? 'NUTRITION_OBJECTIVE_VERSION' : 'TRAINING_OBJECTIVE_VERSION', id: o.id },
      // El hecho es desde cuándo rige; el registro es cuándo se cargó. Son columnas distintas.
      ...tiempos(o.vigenteDesde, o.registradaEl),
      author: { identityId: o.autorId, displayName: await nombres.de(o.autorId), role: 'PROFESSIONAL' },
      title: o.predecesoraId ? `Objetivo de ${NOMBRE_DEL_ALCANCE[alcance]} actualizado` : `Objetivo de ${NOMBRE_DEL_ALCANCE[alcance]} definido`,
      details: [
        ...(o.requerimientoKcal !== null ? [{ label: 'Requerimiento energético estimado', value: `${redondeoDePresentacion(String(o.requerimientoKcal), 'energyKcal')} kcal/día` }] : []),
        ...(o.enunciado ? [{ label: 'Objetivo', value: o.enunciado }] : []),
        ...(o.vigenteHasta ? [{ label: 'Rigió hasta', value: fechaCorta(civil(o.vigenteHasta)) }] : []),
      ],
      state: 'EFFECTIVE',
      quality: [],
      planVersionId: null,
      exerciseKeys: [],
      relations: o.predecesoraId
        ? [{ kind: 'SUCCEEDS_VERSION', at: null, target: { type: alcance === 'NUTRICION' ? 'NUTRITION_OBJECTIVE_VERSION' : 'TRAINING_OBJECTIVE_VERSION', id: o.predecesoraId }, label: 'Reemplaza al objetivo anterior' }]
        : [],
    });
  }
  return salida;
}

// ─── Nutrición: un registro de comida por entrada ───────────────────────────────────────────────

export function entradasDeComidas(registros: readonly RegistroDeComida[], asesoradoId: string, versiones: readonly VersionActivada[]): EntradaDeLineaDeTiempo[] {
  const numero = new Map(versiones.map((v) => [v.id, v.numero]));
  return registros.map((r) => {
    const calidad: CalidadDeEntrada[] = [];
    if (r.kind === 'DIFFERENT') calidad.push('DIFFERENT_MEAL');
    if (r.consumption?.status === 'UNCONFIRMED') calidad.push('QUANTITIES_UNCONFIRMED');
    if (r.consumption?.status === 'PLAN_PORTIONS') calidad.push('QUANTITIES_FROM_PLAN');
    if (r.consumption?.status === 'REPORTED') calidad.push('QUANTITIES_REPORTED');
    const incompletos = r.consumed ? Object.values(r.consumed).some((v) => v.value === null) : false;
    if (incompletos) calidad.push('NUTRIENTS_INCOMPLETE');
    const energia = r.consumed?.energyKcal.value ?? null;
    const comida = r.meal?.label || 'Comida';
    const version = numero.get(r.planId);
    return {
      timelineEntryId: `meal:${r.recordId}`,
      domain: 'NUTRITION',
      eventType: 'MEAL_RECORDED',
      source: { type: 'MEAL_RECORD', id: r.recordId },
      ...tiempos(new Date(r.occurredAt), new Date(r.recordedAt), r.localDate),
      author: { identityId: asesoradoId, displayName: nombreDeAsesorado(asesoradoId), role: 'ADVISEE' },
      title: r.kind === 'DIFFERENT' ? `Comida diferente · ${comida}` : `Comida registrada · ${comida}`,
      details: [
        ...(r.option ? [{ label: 'Opción', value: r.option.label ? `${r.option.order} · ${r.option.label}` : String(r.option.order) }] : []),
        ...(r.description ? [{ label: 'Descripción', value: r.description }] : []),
        ...(r.approximateQuantity ? [{ label: 'Cantidad aproximada', value: r.approximateQuantity }] : []),
        ...(r.consumption ? [{ label: 'Cantidades', value: CANTIDADES[r.consumption.status] ?? r.consumption.status }] : []),
        // El mismo redondeo que la pantalla de registro: el valor coincide en los dos lugares (encargo §11).
        ...(energia !== null ? [{ label: 'Energía registrada', value: `${redondeoDePresentacion(energia, 'energyKcal')} kcal` }] : []),
        ...(incompletos ? [{ label: 'Nutrientes', value: 'falta el dato de alguno' }] : []),
        ...(r.kind === 'DIFFERENT' && !r.consumed ? [{ label: 'Calorías y macros', value: 'sin calcular (no se inventan)' }] : []),
        ...(r.evidence.length > 0 ? [{ label: 'Foto', value: r.evidence.length === 1 ? 'con foto' : `${r.evidence.length} fotos` }] : []),
        ...(r.observation ? [{ label: 'Observación', value: r.observation }] : []),
        ...(version !== undefined ? [{ label: 'Plan', value: `versión ${version}` }] : []),
      ],
      state: r.annulment ? 'ANNULLED' : r.consumption?.source === 'RECTIFIED' ? 'RECTIFIED' : 'EFFECTIVE',
      quality: calidad,
      planVersionId: r.planId,
      exerciseKeys: [],
      relations: [
        ...(r.consumption?.source === 'RECTIFIED' ? [{ kind: 'RECTIFIED' as const, at: r.consumption.rectifiedAt, target: null, label: 'Cantidades rectificadas: cuenta una sola vez, en su versión vigente' }] : []),
        ...(r.annulment ? [{ kind: 'ANNULLED' as const, at: r.annulment.annulledAt, target: null, label: 'Anulado por la persona: queda en el historial y fuera de los agregados' }] : []),
        ...(r.planId ? [{ kind: 'EXECUTES_PLAN_VERSION' as const, at: null, target: { type: 'NUTRITION_PLAN_VERSION' as const, id: r.planId }, label: version !== undefined ? `Registrado sobre la versión ${version} del plan` : 'Registrado sobre una versión del plan' }] : []),
      ],
    };
  });
}

// ─── Entrenamiento: una sesión registrada por entrada ───────────────────────────────────────────

/** El registro vigente de una sesión: la corrección vigente o el original. `null` si la cadena no se puede resolver. */
function registroVigente(x: EjecucionDeEntrenamiento): RegistroDeEjecucion | null {
  if (x.effectiveView.kind === 'ORIGINAL') return x.original;
  if (x.effectiveView.kind === 'NOT_RESOLVABLE') return null;
  const id = x.effectiveView.correctionId;
  return x.corrections.find((c) => c.correctionId === id)?.correction ?? null;
}

/** Las claves de ejercicio de cada sesión, con la misma identidad que el selector de «Analizar» (todo el período). */
export function clavesDeEjercicioPorSesion(ejecuciones: readonly EjecucionDeEntrenamiento[]): Map<string, string[]> {
  const porSesion = new Map<string, string[]>();
  for (const e of ejerciciosComparables(ejecuciones)) {
    for (const o of observacionesDelEjercicio(ejecuciones, e.clave)) {
      const lista = porSesion.get(o.comparacion.executionId) ?? [];
      if (!lista.includes(e.clave)) lista.push(e.clave);
      porSesion.set(o.comparacion.executionId, lista);
    }
  }
  return porSesion;
}

export function entradasDeSesiones(ejecuciones: readonly EjecucionDeEntrenamiento[], versiones: readonly VersionActivada[]): EntradaDeLineaDeTiempo[] {
  const numero = new Map(versiones.map((v) => [v.id, v.numero]));
  const claves = clavesDeEjercicioPorSesion(ejecuciones);
  return ejecuciones.map((x) => {
    const vigente = registroVigente(x);
    const calidad: CalidadDeEntrada[] = [];
    if (vigente?.sessionCondition === 'NOT_COMPLETED') calidad.push('SESSION_NOT_COMPLETED');
    if (vigente?.sessionCondition === 'COMPLETED_WITH_DEVIATION') calidad.push('SESSION_WITH_DEVIATION');
    if (vigente?.granularity === 'EXERCISE_OR_SESSION') calidad.push('SESSION_SUMMARY_ONLY');
    const series = vigente?.exercises.flatMap((e) => e.sets ?? []) ?? [];
    const conDato = series.filter((s) => s.load !== null || s.completedRepetitions !== null || s.rir !== null).length;
    const ejercicios = [...new Set(vigente?.exercises.map((e) => e.performedExerciseName) ?? [])];
    const version = numero.get(x.planId);
    const correccion = x.effectiveView.kind === 'CORRECTED' ? x.corrections.find((c) => c.correctionId === (x.effectiveView as { correctionId: string }).correctionId) : undefined;
    return {
      timelineEntryId: `tses:${x.executionId}`,
      domain: 'TRAINING',
      eventType: 'TRAINING_SESSION_RECORDED',
      source: { type: 'TRAINING_EXECUTION', id: x.executionId },
      ...tiempos(new Date(x.occurredAt), new Date(x.recordedAt), x.date),
      author: { identityId: x.adviseeId, displayName: nombreDeAsesorado(x.adviseeId), role: 'ADVISEE' },
      title: `Sesión registrada · ${x.plannedSession.label}`,
      details: [
        ...(vigente ? [{ label: 'Condición', value: CONDICION[vigente.sessionCondition] }] : [{ label: 'Registro vigente', value: 'no se puede resolver la corrección' }]),
        ...(vigente?.granularity === 'SET' ? [{ label: 'Series con datos', value: String(conDato) }] : []),
        ...(vigente?.granularity === 'EXERCISE_OR_SESSION' ? [{ label: 'Registro', value: 'resumido, sin series' }] : []),
        ...(ejercicios.length > 0 ? [{ label: 'Ejercicios', value: ejercicios.length > 4 ? `${ejercicios.slice(0, 4).join(', ')} y ${ejercicios.length - 4} más` : ejercicios.join(', ') }] : []),
        ...(vigente?.reason ? [{ label: 'Motivo', value: vigente.reason }] : []),
        ...(version !== undefined ? [{ label: 'Plan', value: `versión ${version}` }] : []),
      ],
      state: x.effectiveView.kind === 'ORIGINAL' ? 'EFFECTIVE' : 'CORRECTED',
      quality: calidad,
      planVersionId: x.planId,
      exerciseKeys: claves.get(x.executionId) ?? [],
      relations: [
        { kind: 'EXECUTES_PLAN_VERSION', at: null, target: { type: 'TRAINING_PLAN_VERSION', id: x.planId }, label: version !== undefined ? `Ejecuta la versión ${version} del plan` : 'Ejecuta una versión del plan' },
        ...(correccion ? [{ kind: 'CORRECTED' as const, at: correccion.recordedAt, target: null, label: `Corregida por ${correccion.author.displayName}` }] : []),
      ],
    };
  });
}

// ─── Revisiones y seguimientos ──────────────────────────────────────────────────────────────────

export async function entradasDeRevisiones(tx: Tx, alcance: AlcanceDelAnalisis, profesionalId: string, asesoradoId: string, desde: string, hasta: string, nombres: NombresDeAutores): Promise<EntradaDeLineaDeTiempo[]> {
  const ventana = { gte: inicioDelDiaLocal(desde, ZONA), lt: finDelDiaLocal(hasta, ZONA) };
  const donde = { proceso: { profesionalId, asesoradoId, alcance }, OR: [{ momentoDeOcurrencia: ventana }, { momentoDeOcurrencia: null, momentoDeRegistro: ventana }] };
  const filas =
    alcance === 'NUTRICION'
      ? (await tx.revisionNutricional.findMany({ where: donde, include: { planesCreados: { select: { id: true, version: true } } } })).map((r) => ({ ...r, planes: r.planesCreados }))
      : (await tx.revisionDeEntrenamiento.findMany({ where: donde, include: { planesCreados: { select: { id: true, version: true } } } })).map((r) => ({ ...r, planes: r.planesCreados }));
  const salida: EntradaDeLineaDeTiempo[] = [];
  for (const r of filas) {
    salida.push({
      timelineEntryId: `${alcance === 'NUTRICION' ? 'nrev' : 'trev'}:${r.id}`,
      domain: DOMINIO_DEL_ALCANCE[alcance],
      eventType: alcance === 'NUTRICION' ? 'NUTRITION_REVIEW_RECORDED' : 'TRAINING_REVIEW_RECORDED',
      source: { type: alcance === 'NUTRICION' ? 'NUTRITION_REVIEW' : 'TRAINING_REVIEW', id: r.id },
      ...tiempos(r.momentoDeOcurrencia, r.momentoDeRegistro),
      author: { identityId: r.autorId, displayName: await nombres.de(r.autorId), role: 'PROFESSIONAL' },
      title: `Revisión de ${NOMBRE_DEL_ALCANCE[alcance]} registrada`,
      details: [
        { label: 'Período revisado', value: `${fechaCorta(r.periodoInicio.toISOString().slice(0, 10))} al ${fechaCorta(r.periodoFin.toISOString().slice(0, 10))}` },
        { label: 'Resultado', value: RESULTADO[r.resultado] ?? r.resultado },
      ],
      state: 'EFFECTIVE',
      quality: [],
      planVersionId: null,
      exerciseKeys: [],
      relations: r.planes.map((p) => ({
        kind: 'REVIEW_APPLIED' as const,
        at: null,
        target: { type: alcance === 'NUTRICION' ? ('NUTRITION_PLAN_VERSION' as const) : ('TRAINING_PLAN_VERSION' as const), id: p.id },
        label: `Dio origen a la versión ${p.version} del plan`,
      })),
    });
  }
  return salida;
}

export async function entradasDeSeguimientos(tx: Tx, alcances: readonly Alcance[], profesionalId: string, asesoradoId: string, desde: string, hasta: string, nombres: NombresDeAutores): Promise<EntradaDeLineaDeTiempo[]> {
  if (alcances.length === 0) return [];
  const ventana = { gte: inicioDelDiaLocal(desde, ZONA), lt: finDelDiaLocal(hasta, ZONA) };
  const eventos = await tx.eventoDeProceso.findMany({
    where: {
      tipo: { in: ['ProcesoOperativoAbierto', 'ProcesoOperativoCerrado'] },
      proceso: { profesionalId, asesoradoId, alcance: { in: [...alcances] } },
      OR: [{ momentoDeOcurrencia: ventana }, { momentoDeOcurrencia: null, momentoDeRegistro: ventana }],
    },
    include: { proceso: { select: { id: true, alcance: true, motivoDeCierre: true } } },
  });
  const salida: EntradaDeLineaDeTiempo[] = [];
  for (const e of eventos) {
    const alcance = e.proceso.alcance as Alcance;
    const abierto = e.tipo === 'ProcesoOperativoAbierto';
    salida.push({
      timelineEntryId: `${abierto ? 'fopen' : 'fclose'}:${e.id}`,
      domain: DOMINIO_DEL_ALCANCE[alcance],
      eventType: abierto ? 'FOLLOW_UP_OPENED' : 'FOLLOW_UP_CLOSED',
      source: { type: 'FOLLOW_UP_PROCESS', id: e.proceso.id },
      ...tiempos(e.momentoDeOcurrencia, e.momentoDeRegistro),
      author: e.actorId ? { identityId: e.actorId, displayName: await nombres.de(e.actorId), role: 'PROFESSIONAL' } : null,
      title: `Seguimiento de ${NOMBRE_DEL_ALCANCE[alcance]} ${abierto ? 'abierto' : 'cerrado'}`,
      details: !abierto && e.proceso.motivoDeCierre ? [{ label: 'Motivo', value: MOTIVO_DE_CIERRE[e.proceso.motivoDeCierre] ?? e.proceso.motivoDeCierre }] : [],
      state: 'EFFECTIVE',
      quality: [],
      planVersionId: null,
      exerciseKeys: [],
      relations: [],
    });
  }
  return salida;
}

// ─── Antropometría: una toma por entrada ────────────────────────────────────────────────────────

export async function entradasDeTomas(tx: Tx, profesionalId: string, asesoradoId: string, desde: string, hasta: string, nombres: NombresDeAutores): Promise<EntradaDeLineaDeTiempo[]> {
  const ventana = { gte: inicioDelDiaLocal(desde, ZONA), lt: finDelDiaLocal(hasta, ZONA) };
  const tomas = await tx.evaluacionAntropometrica.findMany({
    where: { profesionalId, asesoradoId, estado: 'REGISTRADA', momentoDeOcurrencia: ventana },
    include: {
      mediciones: {
        select: {
          id: true,
          protocoloVersion: { select: { nombre: true } },
          correcciones: { select: { id: true, momentoDeRegistro: true }, orderBy: { momentoDeRegistro: 'asc' } },
          anulacion: { select: { momentoDeRegistro: true } },
        },
      },
      ejecuciones: { where: { reemplazadaPor: { is: null } }, select: { id: true } },
    },
  });
  const salida: EntradaDeLineaDeTiempo[] = [];
  for (const t of tomas) {
    const vigentes = t.mediciones.filter((m) => !m.anulacion);
    const corregidas = t.mediciones.filter((m) => m.correcciones.length > 0);
    const anuladas = t.mediciones.filter((m) => m.anulacion);
    const protocolos = [...new Set(t.mediciones.map((m) => m.protocoloVersion.nombre))];
    salida.push({
      timelineEntryId: `aeval:${t.id}`,
      domain: 'ANTHROPOMETRY',
      eventType: 'ANTHROPOMETRIC_EVALUATION_RECORDED',
      source: { type: 'ANTHROPOMETRIC_EVALUATION', id: t.id },
      ...tiempos(t.momentoDeOcurrencia, t.momentoDeRegistroDeEvaluacion ?? t.momentoDeRegistro),
      author: { identityId: t.profesionalId, displayName: await nombres.de(t.profesionalId), role: 'PROFESSIONAL' },
      title: 'Toma antropométrica registrada',
      details: [
        { label: 'Mediciones vigentes', value: String(vigentes.length) },
        ...(protocolos.length > 0 ? [{ label: protocolos.length === 1 ? 'Protocolo' : 'Protocolos', value: protocolos.join(', ') }] : []),
        ...(t.ejecuciones.length > 0 ? [{ label: 'Resultados de métodos', value: String(t.ejecuciones.length) }] : []),
        ...(corregidas.length > 0 ? [{ label: 'Mediciones corregidas', value: String(corregidas.length) }] : []),
        ...(anuladas.length > 0 ? [{ label: 'Mediciones anuladas', value: String(anuladas.length) }] : []),
      ],
      state: corregidas.length > 0 ? 'CORRECTED' : 'EFFECTIVE',
      quality: [],
      planVersionId: null,
      exerciseKeys: [],
      relations: [
        ...corregidas.slice(0, 20).map((m) => ({ kind: 'MEASUREMENT_CORRECTED' as const, at: iso(m.correcciones[m.correcciones.length - 1]!.momentoDeRegistro), target: { type: 'ANTHROPOMETRIC_MEASUREMENT' as const, id: m.id }, label: 'Medición corregida' })),
        ...anuladas.slice(0, 20).map((m) => ({ kind: 'MEASUREMENT_ANNULLED' as const, at: iso(m.anulacion!.momentoDeRegistro), target: { type: 'ANTHROPOMETRIC_MEASUREMENT' as const, id: m.id }, label: 'Medición anulada' })),
      ],
    });
  }
  return salida;
}
