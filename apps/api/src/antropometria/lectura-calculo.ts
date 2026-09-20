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
type FilaDeCorrida = EjecucionDeCalculo & {
  entradas: (EntradaDeCalculo & { medicion?: MedicionAntropometrica | null })[];
  metodoVersion: VersionConEspecificacion;
  evaluacion: { asesoradoId: string };
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

export function corridaApi(c: FilaDeCorrida, nombreDelAutor: (id: string) => string, esReferencia: boolean): CorridaDeCalculoApi {
  const especificacion = leerEspecificacionDeMetodo(c.metodoVersion.contenido);
  return {
    calculationRunId: c.id,
    adviseeId: c.evaluacion.asesoradoId,
    evaluationId: c.evaluacionId,
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
      magnitude: { value: Number(i.valor), unit: i.unidad },
      provenanceType: ORIGEN_API[i.medicion?.origen ?? 'CAPTURA_DIRECTA'],
      sourceOccurredAt: (i.medicion?.momentoDeOcurrencia ?? c.momentoDeRegistro).toISOString(),
    })),
    supersedesRunId: c.reemplazaAId,
    referenceForPurpose: esReferencia,
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
