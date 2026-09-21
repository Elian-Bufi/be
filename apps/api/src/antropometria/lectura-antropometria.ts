/**
 * De filas de la base a la forma del contrato ANT. Acá viven dos traducciones que no son cosméticas:
 *
 * - la **condición efectiva** de una medición no se lee de una columna: se deriva de que exista su evento de
 *   anulación, «Una Medición sin evento de anulación está VIGENTE» (06:8670). Así nadie la puede poner en cualquier
 *   valor;
 * - la **magnitud efectiva** sale de resolver la cadena de correcciones **por relación**, con el patrón de B-06 que
 *   ya usa nutrición: si la cadena está rota o tiene una rama, no se elige por la fecha más reciente, queda en
 *   `null` (REG-06-16; 09v11:650-657).
 */
import { CLASE_DE_DATO_API, CONDICION_DE_MEDICION_API, ESTADO_DE_EVALUACION_API, resolverVistaEfectiva } from '@be/domain';
import type {
  AnulacionDeMedicion,
  ClaseDeDato,
  CorreccionDeMedicion,
  EjecucionDeCalculo,
  EntradaDeCalculo,
  EvaluacionAntropometrica,
  MedicionAntropometrica,
  OrigenDeMedicion,
  Prisma,
  VersionDeEspecificacionAntropometrica,
} from '@prisma/client';
import type {
  EjecucionDeCalculoApi,
  EspecificacionAntropometricaApi,
  EvaluacionAntropometricaApi,
  FichaDeComparabilidad,
  Medicion,
  MagnitudApi,
} from './tipos';

type Cliente = Prisma.TransactionClient;

export const ORIGEN_API: Readonly<Record<OrigenDeMedicion, 'DIRECT_CAPTURE' | 'SELF_REPORTED' | 'CONTROLLED_IMPORT'>> = {
  CAPTURA_DIRECTA: 'DIRECT_CAPTURE',
  AUTORREPORTE: 'SELF_REPORTED',
  IMPORTACION_CONTROLADA: 'CONTROLLED_IMPORT',
};
export const ORIGEN_DESDE_API: Readonly<Record<'DIRECT_CAPTURE' | 'SELF_REPORTED' | 'CONTROLLED_IMPORT', OrigenDeMedicion>> = {
  DIRECT_CAPTURE: 'CAPTURA_DIRECTA',
  SELF_REPORTED: 'AUTORREPORTE',
  CONTROLLED_IMPORT: 'IMPORTACION_CONTROLADA',
};
export const CLASE_DESDE_ORIGEN: Readonly<Record<OrigenDeMedicion, ClaseDeDato>> = {
  CAPTURA_DIRECTA: 'MEDIDO',
  AUTORREPORTE: 'REPORTADO',
  IMPORTACION_CONTROLADA: 'MEDIDO',
};
export const REDONDEO_API = { MEDIO_ARRIBA: 'HALF_UP', ABAJO: 'DOWN', ARRIBA: 'UP' } as const;
export const REDONDEO_DESDE_API = { HALF_UP: 'MEDIO_ARRIBA', DOWN: 'ABAJO', UP: 'ARRIBA' } as const;

export const token = (n: number): string => `v${n}`;
const magnitud = (valor: Prisma.Decimal, unidad: string): MagnitudApi => ({ value: Number(valor), unit: unidad });

export const INCLUIR_MEDICION = {
  protocoloVersion: { include: { especificacion: true } },
  correcciones: { orderBy: { momentoDeRegistro: 'asc' } },
  anulacion: true,
} as const;

export const INCLUIR_EVALUACION = {
  mediciones: { include: INCLUIR_MEDICION, orderBy: { momentoDeRegistro: 'asc' } },
  ejecuciones: { include: { entradas: true, metodoVersion: { include: { especificacion: true } } }, orderBy: { momentoDeRegistro: 'asc' } },
} as const;

type FilaDeMedicion = MedicionAntropometrica & {
  protocoloVersion: VersionDeEspecificacionAntropometrica & { especificacion: { id: string; clave: string } };
  correcciones: CorreccionDeMedicion[];
  anulacion: AnulacionDeMedicion | null;
};

type FilaDeEjecucion = EjecucionDeCalculo & {
  entradas: EntradaDeCalculo[];
  metodoVersion: VersionDeEspecificacionAntropometrica & { especificacion: { id: string; clave: string } };
};

export function nombreDeProfesional(perfil: { nombreVisible: string | null } | null): string {
  return perfil?.nombreVisible ?? 'Profesional';
}

export async function nombreVisibleDe(cliente: Cliente, identidadId: string): Promise<string> {
  const perfil = await cliente.perfilProfesional.findUnique({ where: { identidadId }, select: { nombreVisible: true } });
  return nombreDeProfesional(perfil);
}

/**
 * La ficha que decide comparabilidad (REG-06-162). La unidad es la **efectiva**: si una corrección cambió la unidad,
 * comparar contra la de origen afirmaría una compatibilidad que no existe. La unidad de origen no se pierde: viaja
 * en la magnitud de la medición, como exige REG-06-154.
 */
export function fichaDe(m: FilaDeMedicion): FichaDeComparabilidad {
  return {
    protocolId: m.protocoloVersion.especificacionId,
    protocolVersionId: m.protocoloVersionId,
    protocolName: m.protocoloVersion.nombre,
    methodId: null,
    methodVersionId: null,
    unit: magnitudEfectiva(m)?.unit ?? m.unidadDeOrigen,
  };
}

/**
 * REG-06-16: la vista efectiva sale de la relación. `resolverVistaEfectiva` devuelve `NO_RESOLUBLE` ante una rama, un
 * ciclo o un eslabón que falta, y entonces no se muestra ningún valor efectivo en vez de inventar uno.
 */
export function magnitudEfectiva(m: Pick<FilaDeMedicion, 'id' | 'valor' | 'unidadDeOrigen' | 'correcciones'>): MagnitudApi | null {
  if (m.correcciones.length === 0) return magnitud(m.valor, m.unidadDeOrigen);
  const vista = resolverVistaEfectiva(
    m.id,
    m.correcciones.map((c) => ({ id: c.id, originalId: m.id, correccionPreviaId: c.correccionPreviaId })),
  );
  if (vista.tipo !== 'CORREGIDA') return vista.tipo === 'ORIGINAL' ? magnitud(m.valor, m.unidadDeOrigen) : null;
  // La terminal de la cadena resuelta por relación: el último eslabón que devolvió el dominio.
  const terminal = vista.cadena[vista.cadena.length - 1];
  const efectiva = m.correcciones.find((c) => c.id === terminal);
  return efectiva ? magnitud(efectiva.valor, efectiva.unidadDeOrigen) : null;
}

export function medicionApi(m: FilaDeMedicion, nombreDelAutor: (id: string) => string): Medicion {
  return {
    measurementId: m.id,
    evaluationId: m.evaluacionId,
    metric: m.metrica,
    magnitude: magnitud(m.valor, m.unidadDeOrigen),
    origin: ORIGEN_API[m.origen],
    dataClass: CLASE_DE_DATO_API[m.clase],
    protocol: fichaDe(m),
    preparationReference: m.referenciaDePreparacion,
    // 06:8670: sin evento de anulación, la medición está vigente.
    condition: CONDICION_DE_MEDICION_API[m.anulacion ? 'ANULADA' : 'VIGENTE'],
    annulment: m.anulacion
      ? {
          annulmentId: m.anulacion.id,
          reason: m.anulacion.motivo,
          author: { identityId: m.anulacion.autorId, displayName: nombreDelAutor(m.anulacion.autorId) },
          occurredAt: m.anulacion.momentoDeOcurrencia.toISOString(),
          recordedAt: m.anulacion.momentoDeRegistro.toISOString(),
        }
      : null,
    corrections: m.correcciones.map((c) => ({
      correctionId: c.id,
      previousCorrectionId: c.correccionPreviaId,
      reason: c.motivo,
      magnitude: magnitud(c.valor, c.unidadDeOrigen),
      author: { identityId: c.autorId, displayName: nombreDelAutor(c.autorId) },
      recordedAt: c.momentoDeRegistro.toISOString(),
    })),
    effectiveMagnitude: magnitudEfectiva(m),
    occurredAt: m.momentoDeOcurrencia.toISOString(),
    recordedAt: m.momentoDeRegistro.toISOString(),
  };
}

export function ejecucionApi(e: FilaDeEjecucion, nombreDelAutor: (id: string) => string): EjecucionDeCalculoApi {
  return {
    runId: e.id,
    evaluationId: e.evaluacionId,
    methodId: e.metodoVersion.especificacionId,
    methodVersionId: e.metodoVersionId,
    methodName: e.metodoVersion.nombre,
    metric: e.metrica,
    magnitude: magnitud(e.valor, e.unidad),
    precision: { decimals: e.decimales, rounding: REDONDEO_API[e.modoDeRedondeo] },
    inputs: e.entradas.map((i) => ({ measurementId: i.medicionId, metric: i.metrica, magnitude: magnitud(i.valor, i.unidad) })),
    supersedesRunId: e.reemplazaAId,
    author: { identityId: e.autorId, displayName: nombreDelAutor(e.autorId) },
    recordedAt: e.momentoDeRegistro.toISOString(),
  };
}

export function evaluacionApi(
  e: EvaluacionAntropometrica & { mediciones: FilaDeMedicion[]; ejecuciones: FilaDeEjecucion[] },
  nombreDelAutor: (id: string) => string,
): EvaluacionAntropometricaApi {
  return {
    evaluationId: e.id,
    adviseeId: e.asesoradoId,
    author: { identityId: e.profesionalId, displayName: nombreDelAutor(e.profesionalId) },
    state: ESTADO_DE_EVALUACION_API[e.estado],
    context: e.contexto,
    version: token(e.version),
    measurements: e.mediciones.map((m) => medicionApi(m, nombreDelAutor)),
    derivedResults: e.ejecuciones.map((x) => ejecucionApi(x, nombreDelAutor)),
    occurredAt: e.momentoDeOcurrencia.toISOString(),
    recordedAt: e.momentoDeRegistro.toISOString(),
    registeredAt: e.momentoDeRegistroDeEvaluacion?.toISOString() ?? null,
  };
}

export function especificacionApi(
  v: VersionDeEspecificacionAntropometrica & { especificacion: { id: string; clave: string; tipo: string }; sucesora: { id: string } | null },
): EspecificacionAntropometricaApi {
  return {
    specificationId: v.especificacionId,
    versionId: v.id,
    key: v.especificacion.clave,
    kind: v.especificacion.tipo === 'METODO' ? 'METHOD' : 'PROTOCOL',
    // DL-072: el estado sale de la cadena, no de una columna. Con sucesora, esta versión ya fue superada.
    status: v.sucesora === null ? 'CURRENT' : 'HISTORICAL',
    name: v.nombre,
    content: v.contenido,
    provenanceNote: (v.procedencia as { rotulo?: string } | null)?.rotulo ?? 'Valores sintéticos de demostración.',
    effectiveSince: v.momentoDeRegistro.toISOString(),
  };
}
