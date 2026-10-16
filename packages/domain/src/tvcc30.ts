/**
 * TVCC-30 (RF-058 · UC-S01 · P1): la North Star de la tesis (02 §16), calculada con la especificación candidata
 * SPEC-TVCC30-v1 del Documento 12 (§13 a §24) y el mapeo de BE de DEUDA_LEGAJO DL-135.
 *
 * Es una métrica académica de validación: de los ciclos de seguimiento que vencieron en una ventana de 30 días, cuántos
 * tuvieron, antes del corte, una revisión profesional válida con su continuidad o su cierre aplicados. No es retención,
 * adherencia, resultado corporal, resultado de salud, score clínico ni ranking (12 §13; TEST-TVCC-012).
 *
 * Todo este módulo es puro: recibe los hechos ya leídos de la base y clasifica. La lectura vive en la API
 * (`apps/api/src/analitica`). Así las doce pruebas del 11A §21 se escriben contra la regla, sin base.
 *
 * El mapeo de BE (DL-135), en corto:
 * - **Ciclo:** un tramo de la cadena de expectativas de revisión de un Proceso operativo (REG-06-145/146). Termina en la
 *   expectativa que satisface una revisión aplicada (REG-06-150.4). Las que una versión de plan reemplazó antes son
 *   reprogramaciones del mismo ciclo.
 * - **Ancla** (el fin canónico del ciclo, 12 §15): la fecha objetivo de la primera expectativa del tramo que venció
 *   estando vigente. Reprogramar después del vencimiento no la corre (06 §12.8.3; anti-gaming, 12 §24). Si una revisión
 *   cerró el ciclo antes de que venciera, el ancla es la fecha que tenía en ese momento. Una expectativa sin fecha vence
 *   al registrarse (REG-06-150.3).
 * - **Satisface** una expectativa la primera revisión cuya aplicación (ContinuidadOCierreAplicado, REG-06-75) se registró
 *   con ella vigente. Una revisión sin aplicar no cierra nada (REG-06-149), y una segunda revisión sobre la misma
 *   expectativa no suma otro ciclo.
 * - **Antes del corte:** registrado antes del fin exclusivo de la ventana. Lo que se registra después no cambia el
 *   resultado de ese corte (12 §22; TEST-TVCC-009).
 */
import { esFechaCivil, fechaCivil, inicioDelDia } from './fechas-civiles';

/** La zona del MVP (REG-06-195; 12 §13). */
export const ZONA_TVCC30 = 'America/Argentina/Buenos_Aires';

/**
 * La especificación aplicada: la candidata del Documento 12 y la versión del mapeo de BE. Cambiar la ventana, el ancla, la
 * elegibilidad, el tratamiento de lo no resoluble, N, D o la fórmula exige otra versión (12 §23), y el resultado nuevo
 * no reemplaza al anterior (REG-06-198).
 */
export interface EspecificacionTvcc30 {
  readonly id: string;
  readonly fuente: string;
  readonly estado: 'CANDIDATA' | 'VIGENTE';
  readonly mapeo: string;
  readonly dias: number;
  readonly zona: string;
}

export const SPEC_TVCC30_V1: EspecificacionTvcc30 = {
  id: 'SPEC-TVCC30-v1',
  fuente: 'BE-LEG-12 v1.0-H §13 a §24',
  estado: 'CANDIDATA',
  mapeo: 'BE-TVCC30-MAPEO-1 · DEUDA_LEGAJO DL-135',
  dias: 30,
  zona: ZONA_TVCC30,
};

/** El nombre y la lectura que viajan con todo resultado (12 §13; TEST-TVCC-012). */
export const NOMBRE_TVCC30 = 'TVCC-30 · Tasa de ciclos cerrados trazables en ventana de 30 días';
export const INTERPRETACION_TVCC30 =
  'De los ciclos de seguimiento que vencieron en la ventana, cuántos tuvieron antes del corte una revisión profesional válida con su continuidad o su cierre aplicados. No es retención, adherencia, resultado corporal, resultado de salud, score clínico ni ranking.';

// ─── Ventana (12 §14) ────────────────────────────────────────────────────────────────────────────────

export interface VentanaTvcc30 {
  /** La fecha local de corte `C`. */
  readonly corte: string;
  /** `C − (días − 1)`: la primera fecha de la ventana. */
  readonly desde: string;
  /** `C`: la última fecha de la ventana. */
  readonly hasta: string;
  /** 00:00 local de `desde`, como instante. */
  readonly inicio: string;
  /** 00:00 local de `C + 1`, exclusivo. */
  readonly finExclusivo: string;
  readonly zona: string;
  /** Cuántas fechas calendario abarca: exactamente los días de la especificación, incluida `C`. */
  readonly fechas: number;
}

const DIA = 86_400_000;

function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1) + dias * DIA).toISOString().slice(0, 10);
}

/** 12 §14: para la fecha local de corte `C`, desde las 00:00 de `C − 29` hasta las 00:00 de `C + 1`, en la zona aprobada. */
export function ventanaTvcc30(corte: string, especificacion: EspecificacionTvcc30 = SPEC_TVCC30_V1): VentanaTvcc30 {
  if (!esFechaCivil(corte)) throw new RangeError('El corte es una fecha civil AAAA-MM-DD.');
  const desde = sumarDias(corte, -(especificacion.dias - 1));
  return {
    corte,
    desde,
    hasta: corte,
    inicio: new Date(inicioDelDia(desde, especificacion.zona)).toISOString(),
    finExclusivo: new Date(inicioDelDia(sumarDias(corte, 1), especificacion.zona)).toISOString(),
    zona: especificacion.zona,
    fechas: especificacion.dias,
  };
}

// ─── Hechos que consume (06 §15.4; REG-06-188) ───────────────────────────────────────────────────────

/** Una expectativa de revisión (`proxima_revision`, REG-06-145/146). */
export interface ExpectativaDeRevisionTvcc30 {
  readonly id: string;
  readonly predecesoraId: string | null;
  /** Fecha civil objetivo; `null` si se declaró sin fecha. */
  readonly fechaObjetivo: string | null;
  readonly registradaEn: string;
  /** La revisión que la fijó, cuando la fuente es una revisión. */
  readonly revisionId: string | null;
  /** La versión de plan que la fijó, cuando la fuente es una versión de plan. */
  readonly versionDePlanId: string | null;
}

/** Una revisión del Proceso y, si se aplicó, su aplicación (UC-I06) con el evento ContinuidadOCierreAplicado. */
export interface RevisionTvcc30 {
  readonly id: string;
  readonly resultado: string;
  readonly registradaEn: string;
  readonly aplicacion: {
    readonly eventoId: string;
    readonly tipo: 'CONTINUIDAD' | 'CIERRE_PROCESO';
    readonly registradaEn: string;
    /** La versión de plan que creó la aplicación (AJUSTAR, SUSTITUIR): su expectativa es consecuencia de esta revisión. */
    readonly versionDePlanCreadaId: string | null;
  } | null;
}

/** Un Proceso operativo (T-06-25) con lo que hace falta para reconstruir sus ciclos. */
export interface ProcesoTvcc30 {
  readonly procesoId: string;
  readonly alcance: string;
  readonly profesionalId: string;
  readonly asesoradoId: string;
  readonly expectativas: readonly ExpectativaDeRevisionTvcc30[];
  readonly revisiones: readonly RevisionTvcc30[];
  /** El cierre que no vino de una revisión: el vínculo finalizado o el cierre de la cuenta (REG-06-67, 70). */
  readonly cierreSinRevision: { readonly motivo: string; readonly registradoEn: string } | null;
}

/** La historia del Vínculo por Alcance y de su consentimiento (B2) para una terna profesional, asesorado y alcance. */
export interface HistoriaDelAlcanceTvcc30 {
  readonly profesionalId: string;
  readonly asesoradoId: string;
  readonly alcance: string;
  /** Cada cambio de estado, con su momento de registro. Un alcance nace ACEPTADO. */
  readonly estados: readonly { readonly desde: string; readonly estado: 'ACEPTADO' | 'PAUSADO' | 'FINALIZADO' }[];
  /** Cada versión del consentimiento, con la situación que dejó. */
  readonly consentimiento: readonly { readonly desde: string; readonly situacion: 'VIGENTE' | 'REVOCADO' }[];
}

export interface EntradaTvcc30 {
  readonly corte: string;
  readonly especificacion?: EspecificacionTvcc30;
  readonly procesos: readonly ProcesoTvcc30[];
  readonly vinculos: readonly HistoriaDelAlcanceTvcc30[];
  /** Las identidades declaradas demo para esta corrida (12 §16.1). BE no las marca en su modelo (DL-135). */
  readonly cuentasDemo: readonly string[];
}

// ─── Resultado (12 §22; REG-06-196) ──────────────────────────────────────────────────────────────────

export type ClasificacionTvcc30 = 'ELEGIBLE' | 'EXCLUIDO' | 'NO_RESOLUBLE';

export type MotivoTvcc30 =
  | 'VERTICAL_SIN_REVISION'
  | 'CUENTA_DEMO'
  | 'SEGUIMIENTO_CERRADO_ANTES_DEL_ANCLA'
  | 'VINCULO_PAUSADO_EN_EL_ANCLA'
  | 'VINCULO_NO_VIGENTE_EN_EL_ANCLA'
  | 'CONSENTIMIENTO_NO_VIGENTE_EN_EL_ANCLA'
  | 'SIN_HISTORIA_DEL_VINCULO_EN_EL_ANCLA'
  | 'CADENA_DE_EXPECTATIVAS_INCONSISTENTE';

/** El criterio de 12 §16 que sustenta cada clasificación (REG-06-190, 191). */
export const CRITERIOS_TVCC30: Readonly<Record<MotivoTvcc30 | 'ELEGIBLE', string>> = {
  ELEGIBLE: '12 §16 · cumple los cinco criterios de elegibilidad',
  VERTICAL_SIN_REVISION: '12 §16.3 · no es un proceso de seguimiento con revisión profesional',
  CUENTA_DEMO: '12 §16.1 · es una cuenta demo',
  SEGUIMIENTO_CERRADO_ANTES_DEL_ANCLA: '12 §16.2 · el seguimiento se cerró sin revisión antes de que el ciclo venciera',
  VINCULO_PAUSADO_EN_EL_ANCLA: '12 §16.2 · el vínculo por alcance estaba pausado al vencer el ciclo',
  VINCULO_NO_VIGENTE_EN_EL_ANCLA: '12 §16.2 · el vínculo por alcance no estaba vigente al vencer el ciclo',
  CONSENTIMIENTO_NO_VIGENTE_EN_EL_ANCLA: '12 §16.2 · el consentimiento no estaba vigente al vencer el ciclo',
  SIN_HISTORIA_DEL_VINCULO_EN_EL_ANCLA: '12 §16.5 · no hay historia del vínculo o del consentimiento para clasificar sin inferir',
  CADENA_DE_EXPECTATIVAS_INCONSISTENTE: '12 §16.5 · la cadena de expectativas no se puede reconstruir sin inferir',
};

export interface CierreDelCicloTvcc30 {
  readonly revisionId: string;
  readonly resultado: string;
  readonly eventoId: string;
  readonly tipo: 'CONTINUIDAD' | 'CIERRE_PROCESO';
  readonly aplicadoEn: string;
}

/** Un ciclo candidato (06 §15.4.1) con su evaluación (REG-06-190) y su lugar en N (REG-06-193). */
export interface CicloTvcc30 {
  /** `procesoId#n`: el n-ésimo ciclo de la cadena del Proceso. */
  readonly cicloId: string;
  readonly procesoId: string;
  readonly dominio: string;
  readonly asesoradoId: string;
  readonly profesionalId: string;
  readonly ancla: string | null;
  readonly origenDelAncla: 'VENCIO' | 'REVISADO_ANTES_DE_VENCER' | 'CERRADO_ANTES_DE_VENCER' | null;
  /** Las expectativas del ciclo, en el orden de la cadena: la primera es la original; las demás, sus reprogramaciones. */
  readonly expectativas: readonly string[];
  readonly clasificacion: ClasificacionTvcc30;
  readonly motivo: MotivoTvcc30 | null;
  readonly criterio: string;
  readonly numerador: 'INCLUIDO' | 'NO_INCLUIDO';
  readonly cierre: CierreDelCicloTvcc30 | null;
  /** Revisiones registradas en el ciclo que no tenían su aplicación antes del corte: no cuentan (REG-06-149). */
  readonly revisionesSinAplicar: readonly string[];
}

export type ValorTvcc30 =
  | { readonly estado: 'CALCULADO'; readonly n: number; readonly d: number; readonly tasa: number; readonly porcentaje: number }
  | { readonly estado: 'SIN_VALOR'; readonly motivo: 'DENOMINADOR_CERO'; readonly n: 0; readonly d: 0 }
  | { readonly estado: 'SIN_VALOR'; readonly motivo: 'CANDIDATOS_NO_RESOLUBLES'; readonly n: null; readonly d: null };

export interface ResultadoTvcc30 {
  readonly nombre: typeof NOMBRE_TVCC30;
  readonly interpretacion: typeof INTERPRETACION_TVCC30;
  readonly especificacion: EspecificacionTvcc30;
  readonly ventana: VentanaTvcc30;
  /** Todo el universo examinado: nada se pierde entre la entrada y el resultado (REG-06-199). */
  readonly universo: readonly CicloTvcc30[];
  readonly conteos: {
    readonly universo: number;
    readonly elegibles: number;
    readonly excluidos: number;
    readonly noResolubles: number;
    readonly numerador: number;
  };
  /** N y D van siempre juntos (REG-06-194). Sin denominador o con algo no resoluble, no hay tasa (12 §20, §21). */
  readonly valor: ValorTvcc30;
  /** Cuántas cuentas se declararon demo en la corrida. */
  readonly cuentasDemoDeclaradas: number;
}

// ─── Reconstrucción de los ciclos ────────────────────────────────────────────────────────────────────

const ms = (iso: string): number => Date.parse(iso);

/** La cadena en orden (REG-06-146), o `null` si no es lineal: dos raíces, una bifurcación o un lazo. */
function cadenaEnOrden(expectativas: readonly ExpectativaDeRevisionTvcc30[]): ExpectativaDeRevisionTvcc30[] | null {
  if (expectativas.length === 0) return [];
  const ids = new Set(expectativas.map((e) => e.id));
  const sucesora = new Map<string, ExpectativaDeRevisionTvcc30>();
  let raiz: ExpectativaDeRevisionTvcc30 | null = null;
  for (const e of expectativas) {
    if (e.predecesoraId === null || !ids.has(e.predecesoraId)) {
      if (raiz) return null;
      raiz = e;
    } else {
      if (sucesora.has(e.predecesoraId)) return null;
      sucesora.set(e.predecesoraId, e);
    }
  }
  const orden: ExpectativaDeRevisionTvcc30[] = [];
  for (let e: ExpectativaDeRevisionTvcc30 | null | undefined = raiz; e; e = sucesora.get(e.id)) {
    if (orden.length > expectativas.length) return null;
    orden.push(e);
  }
  return orden.length === expectativas.length ? orden : null;
}

interface TramoDeCadena {
  readonly expectativas: readonly ExpectativaDeRevisionTvcc30[];
  readonly cierre: RevisionTvcc30 | null;
}

/** Corta la cadena en ciclos: cada uno termina en la expectativa que satisface una revisión aplicada antes del corte. */
function tramosDeLaCadena(orden: readonly ExpectativaDeRevisionTvcc30[], revisiones: readonly RevisionTvcc30[], fin: number): TramoDeCadena[] {
  const aplicadas = revisiones
    .filter((r) => r.aplicacion && ms(r.registradaEn) < fin && ms(r.aplicacion.registradaEn) < fin)
    .sort((a, b) => ms(a.aplicacion!.registradaEn) - ms(b.aplicacion!.registradaEn) || ms(a.registradaEn) - ms(b.registradaEn) || a.id.localeCompare(b.id));
  const posicion = new Map(orden.map((e, i) => [e.id, i]));
  const satisfechaPor = new Map<string, RevisionTvcc30>();
  let ultimaSatisfecha = -1;
  for (const r of aplicadas) {
    const aplicacion = r.aplicacion!;
    // Lo que fijó la propia revisión al aplicarse no es lo que ella revisa: es el ciclo siguiente.
    const esConsecuencia = (e: ExpectativaDeRevisionTvcc30): boolean =>
      e.revisionId === r.id || (aplicacion.versionDePlanCreadaId !== null && e.versionDePlanId === aplicacion.versionDePlanCreadaId);
    let vigente: ExpectativaDeRevisionTvcc30 | null = null;
    for (const e of orden) if (ms(e.registradaEn) <= ms(aplicacion.registradaEn) && !esConsecuencia(e)) vigente = e;
    if (!vigente) continue;
    const i = posicion.get(vigente.id)!;
    // Una expectativa se satisface una sola vez: otra revisión sobre la misma no suma un ciclo (12 §24).
    if (i <= ultimaSatisfecha) continue;
    satisfechaPor.set(vigente.id, r);
    ultimaSatisfecha = i;
  }
  const tramos: TramoDeCadena[] = [];
  let actual: ExpectativaDeRevisionTvcc30[] = [];
  for (const e of orden) {
    actual.push(e);
    const r = satisfechaPor.get(e.id);
    if (r) {
      tramos.push({ expectativas: actual, cierre: r });
      actual = [];
    }
  }
  if (actual.length > 0) tramos.push({ expectativas: actual, cierre: null });
  return tramos;
}

function estadoEn<T extends { readonly desde: string }>(historia: readonly T[], t: number): T | null {
  let ultimo: T | null = null;
  for (const x of [...historia].sort((a, b) => ms(a.desde) - ms(b.desde))) {
    if (ms(x.desde) <= t) ultimo = x;
    else break;
  }
  return ultimo;
}

const DOMINIOS_CON_REVISION = new Set(['NUTRICION', 'ENTRENAMIENTO']);

/** Calcula la TVCC-30 para un corte (UC-S01). No fabrica un valor: sin D o con algo no resoluble, lo dice (REG-06-201). */
export function calcularTvcc30(entrada: EntradaTvcc30): ResultadoTvcc30 {
  const especificacion = entrada.especificacion ?? SPEC_TVCC30_V1;
  const ventana = ventanaTvcc30(entrada.corte, especificacion);
  const fin = ms(ventana.finExclusivo);
  const zona = especificacion.zona;
  const demo = new Set(entrada.cuentasDemo);
  const enLaVentana = (fecha: string): boolean => fecha >= ventana.desde && fecha <= ventana.hasta;
  const historias = new Map(entrada.vinculos.map((h) => [`${h.profesionalId}|${h.asesoradoId}|${h.alcance}`, h]));
  const vence = (e: ExpectativaDeRevisionTvcc30): number => (e.fechaObjetivo ? inicioDelDia(e.fechaObjetivo, zona) : ms(e.registradaEn));
  const fechaDe = (e: ExpectativaDeRevisionTvcc30): string => e.fechaObjetivo ?? fechaCivil(e.registradaEn, zona);

  const universo: CicloTvcc30[] = [];
  for (const p of entrada.procesos) {
    const base = { procesoId: p.procesoId, dominio: p.alcance, asesoradoId: p.asesoradoId, profesionalId: p.profesionalId };
    const conocidas = p.expectativas.filter((e) => ms(e.registradaEn) < fin);
    const orden = cadenaEnOrden(conocidas);
    if (!orden) {
      // Sin cadena no hay ancla: si alguna expectativa podía caer en la ventana, el ciclo no se puede clasificar (12 §16.5).
      if (conocidas.some((e) => enLaVentana(fechaDe(e)))) {
        universo.push({
          ...base,
          cicloId: `${p.procesoId}#?`,
          ancla: null,
          origenDelAncla: null,
          expectativas: conocidas.map((e) => e.id).sort(),
          clasificacion: 'NO_RESOLUBLE',
          motivo: 'CADENA_DE_EXPECTATIVAS_INCONSISTENTE',
          criterio: CRITERIOS_TVCC30.CADENA_DE_EXPECTATIVAS_INCONSISTENTE,
          numerador: 'NO_INCLUIDO',
          cierre: null,
          revisionesSinAplicar: [],
        });
      }
      continue;
    }
    const cerradoEn = p.cierreSinRevision && ms(p.cierreSinRevision.registradoEn) < fin ? ms(p.cierreSinRevision.registradoEn) : null;
    const tramos = tramosDeLaCadena(orden, p.revisiones, fin);
    tramos.forEach((tramo, k) => {
      const exps = tramo.expectativas;
      const ultima = exps[exps.length - 1]!;
      const finDelTramo = tramo.cierre ? ms(tramo.cierre.aplicacion!.registradaEn) : (cerradoEn ?? Number.POSITIVE_INFINITY);
      // Hasta cuándo estuvo vigente cada expectativa: hasta su reemplazo, y la última hasta que el ciclo terminó.
      const vigenteHasta = (i: number): number => (i < exps.length - 1 ? ms(exps[i + 1]!.registradaEn) : finDelTramo);
      const iVencida = exps.findIndex((e, i) => vence(e) <= vigenteHasta(i) && vence(e) < fin);
      const anclada = iVencida >= 0 ? exps[iVencida]! : ultima;
      const ancla = fechaDe(anclada);
      if (!enLaVentana(ancla)) return;
      const origenDelAncla = iVencida >= 0 ? 'VENCIO' : tramo.cierre ? 'REVISADO_ANTES_DE_VENCER' : cerradoEn !== null ? 'CERRADO_ANTES_DE_VENCER' : null;
      // Un ciclo previsto que todavía no venció no tiene el ancla en la ventana: no llega acá.
      if (!origenDelAncla) return;
      const inicioDelCiclo = ms(exps[0]!.registradaEn);
      const revisionesSinAplicar = p.revisiones
        .filter((r) => ms(r.registradaEn) < fin && ms(r.registradaEn) >= inicioDelCiclo && ms(r.registradaEn) <= finDelTramo && !(r.aplicacion && ms(r.aplicacion.registradaEn) < fin))
        .map((r) => r.id)
        .sort();
      const cierre: CierreDelCicloTvcc30 | null = tramo.cierre
        ? {
            revisionId: tramo.cierre.id,
            resultado: tramo.cierre.resultado,
            eventoId: tramo.cierre.aplicacion!.eventoId,
            tipo: tramo.cierre.aplicacion!.tipo,
            aplicadoEn: tramo.cierre.aplicacion!.registradaEn,
          }
        : null;
      // El vínculo y el consentimiento se miran cuando el ciclo venció; si se revisó antes, cuando se aplicó la revisión.
      const momento = origenDelAncla === 'REVISADO_ANTES_DE_VENCER' && cierre ? ms(cierre.aplicadoEn) : Math.max(vence(anclada), ms(anclada.registradaEn));
      const motivo = motivoDeExclusion(p, origenDelAncla, demo, historias.get(`${p.profesionalId}|${p.asesoradoId}|${p.alcance}`), momento);
      const clasificacion: ClasificacionTvcc30 =
        motivo === null ? 'ELEGIBLE' : motivo === 'SIN_HISTORIA_DEL_VINCULO_EN_EL_ANCLA' ? 'NO_RESOLUBLE' : 'EXCLUIDO';
      universo.push({
        ...base,
        cicloId: `${p.procesoId}#${k + 1}`,
        ancla,
        origenDelAncla,
        expectativas: exps.map((e) => e.id),
        clasificacion,
        motivo,
        criterio: CRITERIOS_TVCC30[motivo ?? 'ELEGIBLE'],
        numerador: clasificacion === 'ELEGIBLE' && cierre ? 'INCLUIDO' : 'NO_INCLUIDO',
        cierre,
        revisionesSinAplicar,
      });
    });
  }
  universo.sort(
    (a, b) =>
      (a.ancla ?? '9999-12-31').localeCompare(b.ancla ?? '9999-12-31') ||
      a.dominio.localeCompare(b.dominio) ||
      a.procesoId.localeCompare(b.procesoId) ||
      a.cicloId.localeCompare(b.cicloId),
  );

  const elegibles = universo.filter((c) => c.clasificacion === 'ELEGIBLE');
  const n = elegibles.filter((c) => c.numerador === 'INCLUIDO').length;
  const d = elegibles.length;
  const noResolubles = universo.filter((c) => c.clasificacion === 'NO_RESOLUBLE').length;
  const valor: ValorTvcc30 =
    noResolubles > 0
      ? { estado: 'SIN_VALOR', motivo: 'CANDIDATOS_NO_RESOLUBLES', n: null, d: null }
      : d === 0
        ? { estado: 'SIN_VALOR', motivo: 'DENOMINADOR_CERO', n: 0, d: 0 }
        : { estado: 'CALCULADO', n, d, tasa: n / d, porcentaje: (100 * n) / d };
  return {
    nombre: NOMBRE_TVCC30,
    interpretacion: INTERPRETACION_TVCC30,
    especificacion,
    ventana,
    universo,
    conteos: {
      universo: universo.length,
      elegibles: d,
      excluidos: universo.filter((c) => c.clasificacion === 'EXCLUIDO').length,
      noResolubles,
      numerador: n,
    },
    valor,
    cuentasDemoDeclaradas: demo.size,
  };
}

/** 12 §16, en orden: el primer criterio que no se cumple es el motivo. `null` si el ciclo es elegible. */
function motivoDeExclusion(
  p: ProcesoTvcc30,
  origen: NonNullable<CicloTvcc30['origenDelAncla']>,
  demo: ReadonlySet<string>,
  historia: HistoriaDelAlcanceTvcc30 | undefined,
  momento: number,
): MotivoTvcc30 | null {
  if (!DOMINIOS_CON_REVISION.has(p.alcance)) return 'VERTICAL_SIN_REVISION';
  if (demo.has(p.asesoradoId) || demo.has(p.profesionalId)) return 'CUENTA_DEMO';
  if (origen === 'CERRADO_ANTES_DE_VENCER') return 'SEGUIMIENTO_CERRADO_ANTES_DEL_ANCLA';
  const estado = historia ? estadoEn(historia.estados, momento) : null;
  if (!estado) return 'SIN_HISTORIA_DEL_VINCULO_EN_EL_ANCLA';
  if (estado.estado === 'PAUSADO') return 'VINCULO_PAUSADO_EN_EL_ANCLA';
  if (estado.estado === 'FINALIZADO') return 'VINCULO_NO_VIGENTE_EN_EL_ANCLA';
  const consentimiento = historia ? estadoEn(historia.consentimiento, momento) : null;
  if (!consentimiento) return 'SIN_HISTORIA_DEL_VINCULO_EN_EL_ANCLA';
  if (consentimiento.situacion !== 'VIGENTE') return 'CONSENTIMIENTO_NO_VIGENTE_EN_EL_ANCLA';
  return null;
}

/**
 * La forma canónica del resultado, con las claves ordenadas: mismas fuentes, misma especificación y mismo corte dan el
 * mismo texto (12 §22; REG-06-197). La API guarda su huella SHA-256 junto al resultado.
 */
export function canonicoTvcc30(resultado: ResultadoTvcc30): string {
  const ordenar = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(ordenar);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.keys(v as Record<string, unknown>)
          .sort()
          .map((k) => [k, ordenar((v as Record<string, unknown>)[k])]),
      );
    }
    return v;
  };
  return JSON.stringify(ordenar(resultado));
}
