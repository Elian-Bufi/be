/**
 * Cálculo profesional reproducible: el patrón transversal T-06-N12 (06 §20.3), del que la antropometría es una
 * especialización (REG-06-202). Acá viven las cuatro reglas que el legajo no deja negociar:
 *
 * - **Método con identidad estable y versión inmutable** (REG-06-203). Una versión publicada no se muta: un cambio
 *   metodológico crea una sucesora, y la anterior queda como `HISTORICO_NO_SELECCIONABLE`, sin borrarse.
 * - **Disponible ≠ admisible** (REG-06-204). Que un dato exista no lo vuelve usable: cada versión declara qué
 *   entradas necesita, en qué unidades y con qué procedencias. Un autorreporte puede ser admisible para un método y
 *   no para otro.
 * - **La ejecución es un hecho histórico independiente** (REG-06-205). Varias corridas coexisten para la misma
 *   finalidad, y no se permite sobrescribir, promediar en silencio, declarar un ganador automático ni reconstruir el
 *   pasado con una versión nueva.
 * - **Adoptar una referencia es una relación, no una mutación** (REG-06-207). No modifica la ejecución, no borra las
 *   otras y no crea objetivo ni prescripción: la decisión sigue siendo del profesional (INV-06-05).
 *
 * Lo que este módulo **no** hace es fijar una fórmula profesional: «este bloque define la estructura para
 * representarlas y reconstruirlas, no selecciona una como universal» (REG-06-157, 06:6304). La única fórmula que
 * aparece es la del catálogo sintético de demostración, y está rotulada como tal.
 */
import { z } from 'zod';
import { aplicarPrecision, type EntradaDeCalculo, type Magnitud, type ModoDeRedondeo, type OrigenDeMedicion, type PrecisionDeclarada } from './antropometria';

// ─── Finalidad (REG-06-205: «finalidad/contexto») ───────────────────────────────────────────────

/**
 * Para qué se ejecuta un método. Es parte de la identidad de la corrida y de la referencia adoptada, y limita qué
 * versiones son seleccionables: una versión puede ser seleccionable para una finalidad y no para otra.
 */
export const FinalidadDeCalculo = {
  SOPORTE_ANTROPOMETRICO: 'SOPORTE_ANTROPOMETRICO',
  SOPORTE_DE_OBJETIVO_NUTRICIONAL: 'SOPORTE_DE_OBJETIVO_NUTRICIONAL',
} as const;
export type FinalidadDeCalculo = (typeof FinalidadDeCalculo)[keyof typeof FinalidadDeCalculo];

export const FINALIDAD_DE_CALCULO_API: Readonly<Record<FinalidadDeCalculo, 'ANTHROPOMETRIC_SUPPORT' | 'NUTRITION_OBJECTIVE_SUPPORT'>> = {
  SOPORTE_ANTROPOMETRICO: 'ANTHROPOMETRIC_SUPPORT',
  SOPORTE_DE_OBJETIVO_NUTRICIONAL: 'NUTRITION_OBJECTIVE_SUPPORT',
};

export const FINALIDAD_DE_CALCULO_DESDE_API: Readonly<Record<'ANTHROPOMETRIC_SUPPORT' | 'NUTRITION_OBJECTIVE_SUPPORT', FinalidadDeCalculo>> = {
  ANTHROPOMETRIC_SUPPORT: 'SOPORTE_ANTROPOMETRICO',
  NUTRITION_OBJECTIVE_SUPPORT: 'SOPORTE_DE_OBJETIVO_NUTRICIONAL',
};

// ─── Especificación del método (REG-06-203) ─────────────────────────────────────────────────────

/** Una entrada requerida: qué mide, en qué unidades se admite y de qué procedencias (REG-06-204). */
export interface EntradaRequerida {
  /** Código estable de la entrada dentro del método; es lo que el request declara, nunca la posición. */
  readonly codigo: string;
  readonly metrica: string;
  readonly unidadesAdmitidas: readonly string[];
  readonly procedenciasAdmitidas: readonly OrigenDeMedicion[];
}

/** El contenido versionado de un método. Es especificación, no fórmula impuesta por BE (REG-06-157/208). */
export interface EspecificacionDeMetodo {
  readonly finalidades: readonly FinalidadDeCalculo[];
  readonly entradas: readonly EntradaRequerida[];
  readonly salida: { readonly metrica: string; readonly unidad: string };
  readonly precision: PrecisionDeclarada;
  /** Identificador de la regla de dominio aplicada, versionada junto con la especificación (REG-06-156). */
  readonly regla: string;
}

/**
 * La forma que tiene que tener el contenido versionado de un método (REG-06-203). Se valida al leerlo: una
 * especificación que no la cumple no ejecuta nada, en vez de ejecutarse a medias. Vive en el dominio porque es
 * conocimiento del dominio, no del transporte: la API la lee de la base con esta misma función.
 */
const EspecificacionDeMetodoSchema = z.strictObject({
  finalidades: z.array(z.enum(['SOPORTE_ANTROPOMETRICO', 'SOPORTE_DE_OBJETIVO_NUTRICIONAL'])).min(1),
  entradas: z
    .array(
      z.strictObject({
        codigo: z.string().min(1),
        metrica: z.string().min(1),
        unidadesAdmitidas: z.array(z.string().min(1)).min(1),
        procedenciasAdmitidas: z.array(z.enum(['CAPTURA_DIRECTA', 'AUTORREPORTE', 'IMPORTACION_CONTROLADA'])).min(1),
      }),
    )
    .min(1),
  salida: z.strictObject({ metrica: z.string().min(1), unidad: z.string().min(1) }),
  precision: z.strictObject({ decimales: z.number().int().min(0).max(6), modo: z.enum(['MEDIO_ARRIBA', 'ABAJO', 'ARRIBA']) }),
  regla: z.string().min(1),
});

/** Devuelve la especificación si el contenido cumple la forma declarada, o `null` si no se puede usar. */
export function leerEspecificacionDeMetodo(contenido: unknown): EspecificacionDeMetodo | null {
  const r = EspecificacionDeMetodoSchema.safeParse(contenido);
  return r.success ? r.data : null;
}

/**
 * REG-06-203: «sin eliminar versiones históricas». La seleccionabilidad se deriva de la cadena de versiones, que ya
 * es la fuente de verdad: la versión con sucesora dejó de ser seleccionable y sigue existiendo, consultable y
 * citable por las corridas que la usaron.
 */
export const SeleccionabilidadDeMetodo = { SELECCIONABLE: 'SELECCIONABLE', HISTORICO_NO_SELECCIONABLE: 'HISTORICO_NO_SELECCIONABLE' } as const;
export type SeleccionabilidadDeMetodo = (typeof SeleccionabilidadDeMetodo)[keyof typeof SeleccionabilidadDeMetodo];

export function seleccionabilidad(tieneSucesora: boolean): SeleccionabilidadDeMetodo {
  return tieneSucesora ? 'HISTORICO_NO_SELECCIONABLE' : 'SELECCIONABLE';
}

// ─── Admisibilidad de las entradas (REG-06-204) ─────────────────────────────────────────────────

/** Un dato que el profesional propone como entrada: existe y es visible, que no es lo mismo que ser admisible. */
export interface DatoPropuesto {
  readonly codigo: string;
  readonly medicionId: string;
  readonly metrica: string;
  readonly magnitud: Magnitud;
  readonly origen: OrigenDeMedicion;
  /** REG-06-217: una medición anulada dejó de contar, también como entrada de un cálculo. */
  readonly vigente: boolean;
}

export type MotivoDeInadmisibilidad =
  | { readonly motivo: 'ENTRADA_FALTANTE'; readonly codigo: string }
  | { readonly motivo: 'ENTRADA_DESCONOCIDA'; readonly codigo: string }
  | { readonly motivo: 'ENTRADA_DUPLICADA'; readonly codigo: string }
  | { readonly motivo: 'METRICA_NO_CORRESPONDE'; readonly codigo: string }
  | { readonly motivo: 'UNIDAD_NO_ADMITIDA'; readonly codigo: string }
  | { readonly motivo: 'PROCEDENCIA_NO_ADMITIDA'; readonly codigo: string }
  | { readonly motivo: 'ENTRADA_NO_VIGENTE'; readonly codigo: string };

export type EvaluacionDeAdmisibilidad =
  | { readonly admisible: true; readonly entradas: readonly EntradaDeCalculo[] }
  | { readonly admisible: false; readonly problemas: readonly MotivoDeInadmisibilidad[] };

/**
 * «dato disponible + tipo compatible + procedencia admisible = input utilizable» (REG-06-204). Cualquier otra
 * combinación no produce una ejecución válida: no se completa lo que falta ni se convierte la unidad en silencio
 * (REG-06-154).
 */
export function evaluarAdmisibilidad(metodo: EspecificacionDeMetodo, propuestos: readonly DatoPropuesto[]): EvaluacionDeAdmisibilidad {
  const problemas: MotivoDeInadmisibilidad[] = [];
  const porCodigo = new Map<string, DatoPropuesto>();
  for (const dato of propuestos) {
    if (!metodo.entradas.some((e) => e.codigo === dato.codigo)) problemas.push({ motivo: 'ENTRADA_DESCONOCIDA', codigo: dato.codigo });
    else if (porCodigo.has(dato.codigo)) problemas.push({ motivo: 'ENTRADA_DUPLICADA', codigo: dato.codigo });
    else porCodigo.set(dato.codigo, dato);
  }
  const entradas: EntradaDeCalculo[] = [];
  for (const requerida of metodo.entradas) {
    const dato = porCodigo.get(requerida.codigo);
    if (!dato) {
      problemas.push({ motivo: 'ENTRADA_FALTANTE', codigo: requerida.codigo });
      continue;
    }
    if (!dato.vigente) problemas.push({ motivo: 'ENTRADA_NO_VIGENTE', codigo: requerida.codigo });
    if (dato.metrica !== requerida.metrica) problemas.push({ motivo: 'METRICA_NO_CORRESPONDE', codigo: requerida.codigo });
    if (!requerida.unidadesAdmitidas.includes(dato.magnitud.unidad)) problemas.push({ motivo: 'UNIDAD_NO_ADMITIDA', codigo: requerida.codigo });
    if (!requerida.procedenciasAdmitidas.includes(dato.origen)) problemas.push({ motivo: 'PROCEDENCIA_NO_ADMITIDA', codigo: requerida.codigo });
    entradas.push({ medicionId: dato.medicionId, metrica: dato.metrica, magnitud: dato.magnitud });
  }
  return problemas.length > 0 ? { admisible: false, problemas } : { admisible: true, entradas };
}

/** Una versión es seleccionable para una finalidad solo si la declara (REG-06-203). */
export function admiteFinalidad(metodo: EspecificacionDeMetodo, finalidad: FinalidadDeCalculo): boolean {
  return metodo.finalidades.includes(finalidad);
}

// ─── Ejecución (REG-06-156, 158, 205) ───────────────────────────────────────────────────────────

export type ResultadoDeEjecucion =
  | { readonly ok: true; readonly magnitud: Magnitud; readonly precision: PrecisionDeclarada; readonly regla: string }
  | { readonly ok: false; readonly motivo: 'NO_REPRODUCIBLE'; readonly detalle: string };

/**
 * Las reglas del catálogo sintético de demostración. El legajo prohíbe fijar un catálogo científico desde este
 * bloque (REG-06-157), así que la tabla es explícitamente de demostración y cada regla se cita por identificador
 * versionado: la corrida guarda **cuál** se aplicó, que es lo que la vuelve reproducible (REG-06-156).
 *
 * MET-DEMO tiene dos versiones que citan **la misma** regla: entre v1 y v2 no cambió la operación, cambiaron la
 * precisión declarada y las procedencias admisibles. Es el caso interesante, porque muestra que un cambio
 * metodológico no es necesariamente un cambio de fórmula, y que las dos corridas siguen siendo distintas y válidas.
 */
const REGLAS: Readonly<Record<string, (entradas: Readonly<Record<string, number>>) => number | { error: string }>> = {
  'demo/peso-sobre-talla-cuadrado@1': (e) => (e.talla === 0 ? { error: 'la talla no puede ser cero' } : e.peso! / (e.talla! * e.talla!)),
};

/** Las reglas que el catálogo sintético sabe aplicar. Una especificación que cite otra no es ejecutable acá. */
export const REGLAS_CONOCIDAS: readonly string[] = Object.keys(REGLAS);

/**
 * Ejecuta la versión exacta del método sobre las entradas efectivas, con la precisión que la especificación declara
 * (REG-06-158): no hay redondeo silencioso «por defecto», y la corrida conserva con qué regla y con qué precisión se
 * obtuvo el resultado.
 */
export function ejecutar(metodo: EspecificacionDeMetodo, entradas: readonly EntradaDeCalculo[]): ResultadoDeEjecucion {
  const regla = REGLAS[metodo.regla];
  if (!regla) return { ok: false, motivo: 'NO_REPRODUCIBLE', detalle: `la regla ${metodo.regla} no está en el catálogo` };
  const porMetrica: Record<string, number> = {};
  for (const entrada of entradas) porMetrica[entrada.metrica] = entrada.magnitud.valor;
  const crudo = regla(porMetrica);
  if (typeof crudo !== 'number') return { ok: false, motivo: 'NO_REPRODUCIBLE', detalle: crudo.error };
  if (!Number.isFinite(crudo)) return { ok: false, motivo: 'NO_REPRODUCIBLE', detalle: 'el resultado no es un número finito' };
  return { ok: true, magnitud: { valor: aplicarPrecision(crudo, metodo.precision), unidad: metodo.salida.unidad }, precision: metodo.precision, regla: metodo.regla };
}

/**
 * REG-06-205: varias corridas coexisten para la misma finalidad. Esta función existe para decirlo en código y que
 * una prueba lo fije: BE **no** elige. No promedia, no ordena por «mejor» y no marca ganadora ninguna; devuelve las
 * corridas tal como están, y quien decide es el profesional, con un acto explícito de adopción.
 */
export function coexisten<T extends { readonly ejecucionId: string }>(corridas: readonly T[]): readonly T[] {
  return corridas;
}

// ─── Referencia profesional adoptada (REG-06-207) ───────────────────────────────────────────────

export interface ReferenciaAdoptada {
  readonly referenciaId: string;
  readonly ejecucionId: string;
  readonly finalidad: FinalidadDeCalculo;
  readonly version: string;
}

export interface CorridaParaAdoptar {
  readonly ejecucionId: string;
  readonly asesoradoId: string;
  readonly finalidad: FinalidadDeCalculo;
}

export type EvaluacionDeAdopcion =
  | { readonly adopta: true; readonly sucedeA: string | null }
  | { readonly adopta: false; readonly motivo: 'FINALIDAD_NO_COMPATIBLE' | 'OTRO_ASESORADO' | 'VERSION_DESACTUALIZADA' | 'YA_ES_LA_REFERENCIA' };

/**
 * Adoptar no muta la ejecución ni borra las otras: crea una relación que sucede a la anterior y deja historia
 * (REG-06-207). Tres cosas que no hace, y que las pruebas fijan: no convierte el resultado en verdad universal, no
 * crea objetivo ni prescripción, y no existe adopción automática.
 *
 * Adoptar dos veces la misma corrida no crea una relación nueva: no hubo cambio de referencia que registrar.
 */
export function evaluarAdopcion(
  corrida: CorridaParaAdoptar,
  contexto: { readonly asesoradoId: string; readonly finalidad: FinalidadDeCalculo; readonly actual: ReferenciaAdoptada | null; readonly expectedVersion: string | null },
): EvaluacionDeAdopcion {
  if (corrida.asesoradoId !== contexto.asesoradoId) return { adopta: false, motivo: 'OTRO_ASESORADO' };
  if (corrida.finalidad !== contexto.finalidad) return { adopta: false, motivo: 'FINALIDAD_NO_COMPATIBLE' };
  const versionActual = contexto.actual?.version ?? null;
  if (contexto.expectedVersion !== versionActual) return { adopta: false, motivo: 'VERSION_DESACTUALIZADA' };
  if (contexto.actual?.ejecucionId === corrida.ejecucionId) return { adopta: false, motivo: 'YA_ES_LA_REFERENCIA' };
  return { adopta: true, sucedeA: contexto.actual?.referenciaId ?? null };
}

export type { ModoDeRedondeo };
