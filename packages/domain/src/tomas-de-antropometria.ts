/**
 * Antropometría · Tomas (WP-ESCRITORIO-AREAS, parte 3; maquetas 22 y 29). Lo que la pantalla del profesional dice de
 * las tomas registradas y de cada medición, calculado acá y con sus pruebas: la pantalla no decide ninguna regla.
 *
 * - **La lista** va por cuándo se tomó cada toma, de la más nueva a la más vieja, y se parte en tramos seguidos del
 *   mismo protocolo: muestra dónde cambió, sin mover ningún renglón de su lugar en el tiempo.
 * - **Una toma se resume con hechos:** cuántas mediciones tiene, cuántas con una corrección y cuántas anuladas. Una
 *   medición anulada cuenta como anulada aunque antes se haya corregido.
 * - **Cada medición muestra el valor que rige** (`effectiveMagnitude`), no el que se tomó primero (REG-06-16). Si la
 *   cadena de correcciones no se resuelve, no hay valor vigente y se dice: no se inventa uno.
 * - **En la lista de una toma solo se marca la excepción:** la clase del dato se dice una vez arriba si todas las
 *   mediciones la comparten, y la unidad, una vez por familia si todas la comparten.
 * - **La historia de una medición** va por la cadena de correcciones (por relación, nunca por fecha) y conserva el
 *   original. Anular no borra nada (08 §56.12).
 * - **«Lo que cambió con la corrección»** sale de las corridas que la API volvió a emitir: la corrida vigente que
 *   reemplaza a otra, cuando las dos usaron esta medición con valores distintos. Es una relación entre corridas, no una
 *   coincidencia de fechas. Lo que no se puede atribuir no se atribuye.
 */
import type { CorridaDeCalculoApi } from './contratos-calculo';
import type { Medicion } from './contratos-antropometria';
import { COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO } from './copy-antropometria';
import { ETIQUETA_DE_FAMILIA, FamiliaDeMedicionSchema, type FamiliaDeMedicion } from './figura-antropometrica';
import { cantidad, numero, numeroConPrecision, UNIDAD_ADIMENSIONAL } from './formato-numeros';
import { FAMILIA_DE_METRICA, nombreDeMetrica } from './nombres-de-metricas';
import { compararPorCatalogo } from './resumen-de-la-toma';

// ─── La lista de tomas ──────────────────────────────────────────────────────────────────────────

/**
 * Las tomas por cuándo se tomaron, la más reciente primero: es la que abre. La API pagina por fecha de registro, y una
 * toma cargada después quedaba primera aunque fuera más vieja (DL-113). Con la misma fecha, la registrada después va
 * primero.
 */
export function tomasDeLaMasNueva<T extends { readonly occurredAt: string; readonly registeredAt: string | null }>(tomas: readonly T[]): T[] {
  return [...tomas].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || (b.registeredAt ?? '').localeCompare(a.registeredAt ?? ''));
}

export interface TramoDeTomas<T> {
  /** El protocolo del tramo; `null` si sus tomas no declaran ninguno; `undefined` si todavía no se leyó. */
  readonly protocolo: string | null | undefined;
  readonly tomas: readonly T[];
}

/**
 * Las tomas, en el orden en que llegan, partidas en tramos seguidos del mismo protocolo. No reordena: una toma con otro
 * protocolo en el medio parte el tramo en dos, y así se ve cuándo cambió. Las tomas cuyo protocolo todavía no se leyó
 * forman su propio tramo, sin nombre.
 */
export function tramosDeProtocolo<T>(tomas: readonly T[], protocoloDe: (toma: T) => string | null | undefined): TramoDeTomas<T>[] {
  const tramos: { protocolo: string | null | undefined; tomas: T[] }[] = [];
  for (const toma of tomas) {
    const protocolo = protocoloDe(toma);
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.protocolo === protocolo) ultimo.tomas.push(toma);
    else tramos.push({ protocolo, tomas: [toma] });
  }
  return tramos;
}

export interface CuentasDeUnaToma {
  readonly mediciones: number;
  /** Con una corrección y sin anular. `null` si no se sabe (la lista de tomas no lo trae: está en el detalle). */
  readonly corregidas: number | null;
  readonly anuladas: number;
}

/** «30 mediciones · 1 corregida · 2 anuladas». Lo que no se sabe no se dice; lo que es cero, tampoco. */
export function cuentasDeLaTomaEnPalabras(c: CuentasDeUnaToma): string {
  const partes = [`${numero(c.mediciones)} ${c.mediciones === 1 ? 'medición' : 'mediciones'}`];
  if (c.corregidas !== null && c.corregidas > 0) partes.push(`${numero(c.corregidas)} ${c.corregidas === 1 ? 'corregida' : 'corregidas'}`);
  if (c.anuladas > 0) partes.push(`${numero(c.anuladas)} ${c.anuladas === 1 ? 'anulada' : 'anuladas'}`);
  return partes.join(' · ');
}

type ClaseDeLaMedicion = Medicion['dataClass'];

export interface ResumenDeLaToma {
  /** El protocolo que declaran sus mediciones: el más frecuente, si hubiera más de uno. */
  readonly protocolo: string | null;
  readonly cuentas: CuentasDeUnaToma;
  /** La clase del dato, si todas las mediciones la comparten: se dice una vez, arriba. */
  readonly claseComun: ClaseDeLaMedicion | null;
}

/** Lo que una toma dice de sí misma con sus mediciones. */
export function resumenDeLaToma(mediciones: readonly Medicion[]): ResumenDeLaToma {
  const porProtocolo = new Map<string, number>();
  for (const m of mediciones) porProtocolo.set(m.protocol.protocolName, (porProtocolo.get(m.protocol.protocolName) ?? 0) + 1);
  const protocolo = [...porProtocolo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const anuladas = mediciones.filter((m) => m.condition === 'ANNULLED').length;
  const corregidas = mediciones.filter((m) => m.condition !== 'ANNULLED' && m.corrections.length > 0).length;
  const clases = new Set(mediciones.map((m) => m.dataClass));
  return { protocolo, cuentas: { mediciones: mediciones.length, corregidas, anuladas }, claseComun: clases.size === 1 ? mediciones[0]!.dataClass : null };
}

// ─── Las mediciones de una toma ─────────────────────────────────────────────────────────────────

/** El orden de las familias: el del dominio, el mismo en la toma y en la carga. */
export const FAMILIAS_EN_ORDEN: readonly FamiliaDeMedicion[] = FamiliaDeMedicionSchema.options;

const PALABRA_DE_LA_FAMILIA: Readonly<Partial<Record<FamiliaDeMedicion, string>>> = { PLIEGUES: 'Pliegue', PERIMETROS: 'Perímetro', DIAMETROS: 'Diámetro' };

/**
 * El nombre de una medición dentro de su familia: «Perímetro de cintura» es «Cintura» debajo de «Perímetros». Saca la
 * palabra de la familia y su preposición. Lo que no empieza con esa palabra queda entero. El nombre completo sigue
 * siendo el que oye el lector de pantalla: con los cortos hay dos «Antebrazo» y dos «Pantorrilla» (un pliegue y un
 * perímetro de cada uno).
 */
export function nombreCortoDeMetrica(clave: string, familia: FamiliaDeMedicion = FAMILIA_DE_METRICA[clave] ?? 'OTRAS'): string {
  const completo = nombreDeMetrica(clave);
  const palabra = PALABRA_DE_LA_FAMILIA[familia];
  if (!palabra || !completo.startsWith(`${palabra} `)) return completo;
  const resto = completo.slice(palabra.length + 1).replace(/^(de la|de los|de las|del|de) /, '');
  return resto === '' ? completo : resto.charAt(0).toUpperCase() + resto.slice(1);
}

export type ClaseDeMarca = 'medido' | 'reportado' | 'calculado' | 'corregido' | 'anulado' | 'sin-valor';

/** Una marca de una medición: su texto y su clase, que es también el nombre de su ícono (salvo «sin-valor»). */
export interface MarcaDeMedicion {
  readonly clase: ClaseDeMarca;
  readonly texto: string;
}

const MARCA_DE_CLASE: Readonly<Record<ClaseDeLaMedicion, MarcaDeMedicion>> = {
  MEASURED: { clase: 'medido', texto: ETIQUETA_DE_CLASE_DE_DATO.MEASURED },
  REPORTED: { clase: 'reportado', texto: ETIQUETA_DE_CLASE_DE_DATO.REPORTED },
  DERIVED: { clase: 'calculado', texto: ETIQUETA_DE_CLASE_DE_DATO.DERIVED },
};

/** La marca de la clase de un dato: «Medido», «Reportado» o «Calculado». */
export const marcaDeLaClase = (clase: ClaseDeLaMedicion): MarcaDeMedicion => MARCA_DE_CLASE[clase];

/**
 * Lo que una medición tiene de distinto: anulada; sin valor vigente (la cadena de correcciones no se resuelve); o
 * corregida. Una anulada no se dice además «corregida»: dejó de contar.
 */
export function excepcionesDeLaMedicion(m: Pick<Medicion, 'condition' | 'corrections' | 'effectiveMagnitude'>): MarcaDeMedicion[] {
  if (m.condition === 'ANNULLED') return [{ clase: 'anulado', texto: COPY_ANTROPOMETRIA.anulada }];
  if (m.effectiveMagnitude === null) return [{ clase: 'sin-valor', texto: COPY_ANTROPOMETRIA.sinValorVigente }];
  return m.corrections.length > 0 ? [{ clase: 'corregido', texto: COPY_ANTROPOMETRIA.corregida }] : [];
}

/**
 * El valor que rige de una medición, con su unidad: el de la última corrección de su cadena o, sin correcciones, el que
 * se tomó. Una medición anulada conserva su valor a la vista (anular no borra). `null` si la cadena no se resuelve.
 */
export const valorQueRige = (m: Pick<Medicion, 'effectiveMagnitude'>): string | null => (m.effectiveMagnitude ? cantidad(m.effectiveMagnitude.value, m.effectiveMagnitude.unit) : null);

export interface FilaDeMedicion {
  readonly id: string;
  readonly metrica: string;
  /** El nombre completo, del catálogo: el que oye el lector de pantalla. */
  readonly nombre: string;
  /** El nombre dentro de su familia: el que se ve. */
  readonly nombreCorto: string;
  /** El valor que rige, como se ve en la fila: sin la unidad si la dice el título de la familia. `null` sin valor vigente. */
  readonly valor: string | null;
  /** El valor que rige con su unidad, o «Sin valor vigente». */
  readonly valorCompleto: string;
  /** Solo lo que se sale de lo común: la clase (si la toma mezcla clases), «Corregida», «Anulada», «Sin valor vigente». */
  readonly marcas: readonly MarcaDeMedicion[];
  readonly anulada: boolean;
}

export interface FamiliaDeLaToma {
  readonly familia: FamiliaDeMedicion;
  readonly titulo: string;
  /** La unidad, si la comparten todas las mediciones de la familia y son más de una: se dice una vez, en el título. */
  readonly unidad: string | null;
  readonly filas: readonly FilaDeMedicion[];
}

const unidadDe = (m: Medicion): string => (m.effectiveMagnitude ?? m.magnitude).unit;

/**
 * Las mediciones de una toma por familia, en el orden del dominio; adentro, en el del catálogo (dos mediciones de la
 * misma métrica, por cuándo se registraron). Una familia sin mediciones no aparece.
 */
export function medicionesPorFamilia(mediciones: readonly Medicion[]): FamiliaDeLaToma[] {
  const claseComun = new Set(mediciones.map((m) => m.dataClass)).size <= 1;
  return FAMILIAS_EN_ORDEN.flatMap((familia) => {
    const deLaFamilia = mediciones
      .filter((m) => (FAMILIA_DE_METRICA[m.metric] ?? 'OTRAS') === familia)
      .sort((a, b) => compararPorCatalogo(a.metric, b.metric) || a.recordedAt.localeCompare(b.recordedAt));
    if (deLaFamilia.length === 0) return [];
    const unidades = new Set(deLaFamilia.map(unidadDe));
    const unidad = deLaFamilia.length > 1 && unidades.size === 1 ? unidadDe(deLaFamilia[0]!) : null;
    const filas = deLaFamilia.map((m): FilaDeMedicion => {
      const rige = m.effectiveMagnitude;
      return {
        id: m.measurementId,
        metrica: m.metric,
        nombre: nombreDeMetrica(m.metric),
        nombreCorto: nombreCortoDeMetrica(m.metric, familia),
        valor: rige ? (unidad ? numero(rige.value) : cantidad(rige.value, rige.unit)) : null,
        valorCompleto: valorQueRige(m) ?? COPY_ANTROPOMETRIA.sinValorVigente,
        marcas: [...(claseComun ? [] : [marcaDeLaClase(m.dataClass)]), ...excepcionesDeLaMedicion(m)],
        anulada: m.condition === 'ANNULLED',
      };
    });
    return [{ familia, titulo: ETIQUETA_DE_FAMILIA[familia], unidad, filas }];
  });
}

// ─── La historia de una medición ────────────────────────────────────────────────────────────────

export interface EventoDeLaHistoria {
  readonly tipo: 'ANULACION' | 'CORRECCION' | 'ORIGINAL';
  readonly id: string;
  /** Cuándo quedó registrado el hecho. */
  readonly cuando: string;
  /** El valor de ese momento, con su unidad. La anulación no tiene uno. */
  readonly valor: string | null;
  /** Es el valor que rige hoy. */
  readonly rige: boolean;
  readonly motivo: string | null;
  /** Quién lo hizo; `null` en el original (lo cargó quien registró la toma). */
  readonly autor: string | null;
  /** Lo hizo la cuenta que está mirando: «La corregiste vos». */
  readonly propio: boolean;
}

/** Las correcciones en el orden de su cadena (cada una señala a la anterior). Si la cadena está rota, por fecha. */
function correccionesEnCadena(correcciones: Medicion['corrections']): Medicion['corrections'] {
  const enCadena: Medicion['corrections'] = [];
  let anterior: string | null = null;
  for (let i = 0; i < correcciones.length; i++) {
    const siguiente = correcciones.find((c) => c.previousCorrectionId === anterior && !enCadena.includes(c));
    if (!siguiente) break;
    enCadena.push(siguiente);
    anterior = siguiente.correctionId;
  }
  return enCadena.length === correcciones.length ? enCadena : [...correcciones].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

/**
 * La historia de una medición, de lo más nuevo a lo más viejo: la anulación (si la hay), cada corrección y el valor
 * original, que se conserva. `rige` marca el valor vigente: la última corrección de la cadena o, sin correcciones, el
 * original. Si la cadena no se resuelve (`effectiveMagnitude` nulo), ninguno rige; en una medición anulada, tampoco:
 * sus valores quedan a la vista, y dejó de contar.
 */
export function historiaDeLaMedicion(m: Medicion, miIdentidad: string | null): EventoDeLaHistoria[] {
  const cadena = correccionesEnCadena(m.corrections);
  const hayVigente = m.effectiveMagnitude !== null && m.condition !== 'ANNULLED';
  const eventos: EventoDeLaHistoria[] = [];
  if (m.annulment) {
    eventos.push({
      tipo: 'ANULACION',
      id: m.annulment.annulmentId,
      cuando: m.annulment.recordedAt,
      valor: null,
      rige: false,
      motivo: m.annulment.reason,
      autor: m.annulment.author.displayName,
      propio: miIdentidad !== null && m.annulment.author.identityId === miIdentidad,
    });
  }
  cadena
    .map((c, i) => ({ c, ultima: i === cadena.length - 1 }))
    .reverse()
    .forEach(({ c, ultima }) =>
      eventos.push({
        tipo: 'CORRECCION',
        id: c.correctionId,
        cuando: c.recordedAt,
        valor: cantidad(c.magnitude.value, c.magnitude.unit),
        rige: ultima && hayVigente,
        motivo: c.reason,
        autor: c.author.displayName,
        propio: miIdentidad !== null && c.author.identityId === miIdentidad,
      }),
    );
  eventos.push({
    tipo: 'ORIGINAL',
    id: m.measurementId,
    cuando: m.recordedAt,
    valor: cantidad(m.magnitude.value, m.magnitude.unit),
    rige: cadena.length === 0 && hayVigente,
    motivo: null,
    autor: null,
    propio: false,
  });
  return eventos;
}

// ─── Lo que cambió con la corrección ────────────────────────────────────────────────────────────

/** El valor de un resultado, con los decimales que declara su método (REG-06-158) y su unidad, si tiene. */
export function valorDelResultado(c: Pick<CorridaDeCalculoApi, 'result' | 'precision'>): string {
  const valor = numeroConPrecision(c.result.magnitude.value, c.precision.decimals);
  return c.result.magnitude.unit === UNIDAD_ADIMENSIONAL ? valor : `${valor} ${c.result.magnitude.unit}`;
}

export interface CambioDeUnResultado {
  readonly corridaId: string;
  /** El método con que se calculó: así se nombra cada resultado en la toma. */
  readonly metodo: string;
  readonly ahora: string;
  readonly antes: string;
}

export interface LoQueCambio {
  /** Los resultados vigentes que se volvieron a calcular porque cambió el valor de esta medición. */
  readonly recalculados: readonly CambioDeUnResultado[];
  /**
   * Los que usaban esta medición y quedaron sin efecto y sin un cálculo que los reemplace: porque la medición se anuló,
   * o porque se corrigió y no se pudo volver a calcular. No se pone un cero.
   */
  readonly sinRecalcular: readonly { readonly corridaId: string; readonly metodo: string; readonly antes: string }[];
  /** Resultados que se volvieron a calcular y usan esta medición, pero la API no dice con qué valor: no se atribuyen. */
  readonly sinAtribuir: number;
}

const mismaMagnitud = (a: { value: number; unit: string }, b: { value: number; unit: string }): boolean => a.value === b.value && a.unit === b.unit;

/**
 * Qué pasó con los resultados calculados cuando se corrigió (o se anuló) una medición, visto desde las corridas de su
 * toma. Al corregir, la API vuelve a emitir cada corrida que usaba la medición, con el valor nuevo, y la relaciona con
 * la anterior (`supersedesRunId`). Se atribuye un cambio a esta medición solo si la corrida vigente y la que reemplaza
 * la usaron con valores distintos: una corrida reemitida porque cambió otra de sus entradas no es de esta corrección.
 * Una corrida sin efecto y sin sucesora es de esta medición si la medición está anulada, o si la corrida quedó con un
 * valor suyo que ya no rige; si quedó sin efecto por otra de sus entradas, no.
 */
export function loQueCambio(m: Pick<Medicion, 'measurementId' | 'evaluationId' | 'condition' | 'effectiveMagnitude'>, corridas: readonly CorridaDeCalculoApi[]): LoQueCambio {
  const deLaToma = corridas.filter((c) => c.evaluationId === m.evaluationId);
  const porId = new Map(deLaToma.map((c) => [c.calculationRunId, c]));
  const entradaDe = (c: CorridaDeCalculoApi) => c.inputProvenance.find((i) => i.sourceRef === m.measurementId) ?? null;
  const recalculados: CambioDeUnResultado[] = [];
  const sinRecalcular: { corridaId: string; metodo: string; antes: string }[] = [];
  let sinAtribuir = 0;
  for (const c of deLaToma) {
    const entrada = entradaDe(c);
    // Una corrida que ya tiene sucesora no se mira: se mira la que quedó.
    if (!entrada || c.supersededByRunId !== null) continue;
    if (!c.effective) {
      const quedoConUnValorViejo = !!entrada.magnitude && !!m.effectiveMagnitude && !mismaMagnitud(entrada.magnitude, m.effectiveMagnitude);
      if (m.condition === 'ANNULLED' || quedoConUnValorViejo) sinRecalcular.push({ corridaId: c.calculationRunId, metodo: c.methodName, antes: valorDelResultado(c) });
      continue;
    }
    if (c.supersedesRunId === null) continue;
    const anterior = porId.get(c.supersedesRunId);
    const entradaAnterior = anterior ? entradaDe(anterior) : null;
    if (!anterior || !entradaAnterior) continue;
    if (!entrada.magnitude || !entradaAnterior.magnitude) {
      sinAtribuir += 1;
      continue;
    }
    if (mismaMagnitud(entrada.magnitude, entradaAnterior.magnitude)) continue;
    recalculados.push({ corridaId: c.calculationRunId, metodo: c.methodName, ahora: valorDelResultado(c), antes: valorDelResultado(anterior) });
  }
  const porMetodo = <T extends { metodo: string }>(a: T, b: T): number => a.metodo.localeCompare(b.metodo, 'es');
  return { recalculados: recalculados.sort(porMetodo), sinRecalcular: sinRecalcular.sort(porMetodo), sinAtribuir };
}
