/**
 * De filas a la forma del contrato MTH/CAL, y de vuelta. Lo que acá no es cosmético:
 *
 * - la **seleccionabilidad** de una versión de método no es una columna: se deriva de la cadena, igual que la
 *   vigencia de un protocolo. La versión con sucesora dejó de ser seleccionable y sigue existiendo, citada por las
 *   corridas que la usaron (REG-06-203);
 * - la especificación se **lee y se valida** al usarla: un contenido que no cumple la forma declarada no produce una
 *   ejecución, en vez de ejecutarse a medias;
 * - `referenceForPurpose` sale de la punta de la cadena de referencias, no de un flag guardado en la corrida: la
 *   corrida no se toca al adoptarla (REG-06-207).
 */
import { FINALIDAD_DE_CALCULO_API, leerEspecificacionDeMetodo, type EspecificacionDeMetodo } from '@be/domain';
import type {
  EjecucionDeCalculo,
  EntradaDeCalculo,
  FinalidadDeCalculo as FinalidadPrisma,
  MedicionAntropometrica,
  ReferenciaDeCalculo,
  VersionDeEspecificacionAntropometrica,
} from '@prisma/client';
import { ORIGEN_API, REDONDEO_API, token } from './lectura-antropometria';
import type { CorridaDeCalculoApi, MetodoApi, ReferenciaApi } from './tipos';

type VersionConEspecificacion = VersionDeEspecificacionAntropometrica & { especificacion: { id: string; clave: string; tipo: string }; sucesora?: { id: string } | null };
type MedicionDeEntrada = MedicionAntropometrica & { anulacion?: { id: string } | null };
type FilaDeCorrida = EjecucionDeCalculo & {
  entradas: (EntradaDeCalculo & { medicion?: MedicionDeEntrada | null })[];
  metodoVersion: VersionConEspecificacion;
  evaluacion: { asesoradoId: string; profesionalId: string; estado: 'EN_PREPARACION' | 'REGISTRADA' };
  reemplazadaPor?: { id: string } | null;
};

export const FINALIDAD_DESDE_API: Readonly<Record<'ANTHROPOMETRIC_SUPPORT' | 'NUTRITION_OBJECTIVE_SUPPORT', FinalidadPrisma>> = {
  ANTHROPOMETRIC_SUPPORT: 'SOPORTE_ANTROPOMETRICO',
  NUTRITION_OBJECTIVE_SUPPORT: 'SOPORTE_DE_OBJETIVO_NUTRICIONAL',
};

export function metodoApi(v: VersionConEspecificacion, especificacion: EspecificacionDeMetodo): MetodoApi {
  return {
    methodId: v.especificacionId,
    methodVersionId: v.id,
    key: v.especificacion.clave,
    name: v.nombre,
    version: v.version,
    purposes: especificacion.finalidades.map((f) => FINALIDAD_DE_CALCULO_API[f]),
    status: v.sucesora ? 'HISTORICAL_NOT_SELECTABLE' : 'SELECTABLE',
    requiredInputs: especificacion.entradas.map((e) => ({
      inputCode: e.codigo,
      metric: e.metrica,
      acceptedUnits: [...e.unidadesAdmitidas],
      acceptedProvenances: e.procedenciasAdmitidas.map((p) => ORIGEN_API[p]),
    })),
    output: { metric: especificacion.salida.metrica, unit: especificacion.salida.unidad },
    precisionPolicy: { decimals: especificacion.precision.decimales, rounding: REDONDEO_API[especificacion.precision.modo] },
    ruleId: especificacion.regla,
    provenanceNote: (v.procedencia as { rotulo?: string } | null)?.rotulo ?? 'Valores sintéticos de demostración.',
    supersededByVersionId: v.sucesora?.id ?? null,
    effectiveSince: v.momentoDeRegistro.toISOString(),
  };
}

/**
 * `referenciaVigente` es el token de la referencia del profesional para esa finalidad, o `null` si no adoptó
 * ninguna; la corrida está adoptada cuando ese token le corresponde a ella. El valor de cada entrada viaja solo si el
 * actor puede consultar la medición de origen, que acá siempre es así porque la lectura ya filtró por profesional
 * (09 §21.5); `mostrarValores` deja la puerta preparada para cuando eso cambie.
 */
export function corridaApi(
  c: FilaDeCorrida,
  nombreDelAutor: (id: string) => string,
  referencia: { readonly ejecucionId: string; readonly version: string } | null,
  mostrarValores = true,
): CorridaDeCalculoApi {
  const especificacion = leerEspecificacionDeMetodo(c.metodoVersion.contenido);
  return {
    calculationRunId: c.id,
    adviseeId: c.evaluacion.asesoradoId,
    evaluationId: c.evaluacionId,
    evaluationContext: c.evaluacion.estado === 'REGISTRADA' ? 'REGISTERED' : 'IN_PREPARATION',
    purpose: FINALIDAD_DE_CALCULO_API[c.finalidad],
    methodId: c.metodoVersion.especificacionId,
    methodVersionId: c.metodoVersionId,
    methodName: c.metodoVersion.nombre,
    methodVersion: c.metodoVersion.version,
    ruleId: c.regla,
    result: { metric: c.metrica, magnitude: { value: Number(c.valor), unit: c.unidad } },
    precision: { decimals: c.decimales, rounding: REDONDEO_API[c.modoDeRedondeo] },
    inputProvenance: c.entradas.map((i) => ({
      inputCode: codigoDeEntrada(especificacion, i.metrica),
      sourceRef: i.medicionId,
      metric: i.metrica,
      ...(mostrarValores ? { magnitude: { value: Number(i.valor), unit: i.unidad } } : {}),
      provenanceType: ORIGEN_API[i.medicion?.origen ?? 'CAPTURA_DIRECTA'],
      condition: i.medicion?.anulacion ? ('ANNULLED' as const) : ('EFFECTIVE' as const),
      sourceOccurredAt: (i.medicion?.momentoDeOcurrencia ?? c.momentoDeRegistro).toISOString(),
    })),
    supersedesRunId: c.reemplazaAId,
    supersededByRunId: c.reemplazadaPor?.id ?? null,
    // Una corrida deja de ser vigente si la reemplazaron o si alguna de sus entradas quedó anulada: el resultado se
    // conserva, pero no se presenta como si nada hubiera pasado (REG-06-220 incisos 2 y 4).
    effective: !c.reemplazadaPor && c.entradas.every((i) => !i.medicion?.anulacion),
    referenceForPurpose: referencia?.ejecucionId === c.id,
    referenceVersion: referencia?.version ?? null,
    author: { identityId: c.autorId, displayName: nombreDelAutor(c.autorId) },
    recordedAt: c.momentoDeRegistro.toISOString(),
  };
}

/** El código de la entrada sale de la especificación de la versión usada, no de la vigente al consultar. */
function codigoDeEntrada(especificacion: EspecificacionDeMetodo | null, metrica: string): string {
  return especificacion?.entradas.find((e) => e.metrica === metrica)?.codigo ?? metrica;
}

export function referenciaApi(r: ReferenciaDeCalculo, nombreDelAutor: (id: string) => string): ReferenciaApi {
  return {
    referenceId: r.id,
    adviseeId: r.asesoradoId,
    purpose: FINALIDAD_DE_CALCULO_API[r.finalidad],
    calculationRunId: r.ejecucionId,
    supersedesReferenceId: r.predecesoraId,
    rationale: r.fundamento,
    version: token(r.version),
    author: { identityId: r.profesionalId, displayName: nombreDelAutor(r.profesionalId) },
    adoptedAt: r.momentoDeOcurrencia.toISOString(),
  };
}

export { leerEspecificacionDeMetodo };
export type { FilaDeCorrida };
