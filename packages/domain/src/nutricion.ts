/**
 * B-07 — Circuito nutricional (06 §10). Reglas puras que comparten la API, el website y el APK:
 * - máquina de la Versión de plan (§10.7, literal): no hay salida desde ACTIVADA (06:4307);
 * - jerarquía Día tipo → Comida → Opción → Ítem (REG-06-118), con estado de preparación obligatorio cuando hay
 *   cantidad (REG-06-122);
 * - validación del borrador y de la activación (UC-I04; RF-030, RF-031);
 * - instantánea con el catálogo resuelto al activar (REG-06-13, 105; INV-06-111, 115);
 * - la ingesta se valida contra la instantánea, nunca contra el catálogo ni el borrador (REG-06-105, 106);
 * - contraste descriptivo, sin puntaje (REG-06-125; INV-06-135).
 *
 * BE no calcula requerimientos ni juzga la dieta (INV-06-133; 09v9:554-557): validar es estructural.
 */
import type { ValidationIssue } from './contratos';
import type {
  ContrasteDescriptivo,
  EstructuraDePlanEntrada,
} from './contratos-nutricion';
import type { TransicionDeMaquina } from './maquina';
import { transicionDe } from './maquina';

// ─── Versión de plan (06 §10.7) ─────────────────────────────────────────────────────────────────

export const EstadoDeVersionDePlan = { BORRADOR: 'BORRADOR', ACTIVADA: 'ACTIVADA' } as const;
export type EstadoDeVersionDePlan = (typeof EstadoDeVersionDePlan)[keyof typeof EstadoDeVersionDePlan];
export const ESTADO_DE_PLAN_API: Readonly<Record<EstadoDeVersionDePlan, 'DRAFT' | 'ACTIVATED'>> = { BORRADOR: 'DRAFT', ACTIVADA: 'ACTIVATED' };

export type TransicionDeVersionDePlan = 'CrearBorrador' | 'GuardarBorrador' | 'ActivarVersion';

/**
 * 06:4301-4305, literal. El §10 no publica nombres de eventos: los de acá son derivados, como en WP-03 (DL-033).
 * No existe transición que edite una ACTIVADA ni que la devuelva a BORRADOR (06:4307; INV-06-109).
 */
export const TRANSICIONES_DE_VERSION_DE_PLAN: readonly TransicionDeMaquina<EstadoDeVersionDePlan, TransicionDeVersionDePlan, 'PROFESIONAL'>[] = [
  { transicion: 'CrearBorrador', origen: null, destino: 'BORRADOR', actores: ['PROFESIONAL'], evento: 'BorradorDePlanCreado' },
  { transicion: 'GuardarBorrador', origen: 'BORRADOR', destino: 'BORRADOR', actores: ['PROFESIONAL'], evento: 'BorradorDePlanGuardado' },
  { transicion: 'ActivarVersion', origen: 'BORRADOR', destino: 'ACTIVADA', actores: ['PROFESIONAL'], evento: 'VersionDePlanActivada' },
];

export type ContextoDeTransicionDePlan =
  | {
      readonly transicion: 'CrearBorrador';
      /** «evaluación/objetivo identificables cuando corresponda» (06:4303). */
      readonly evaluacionYObjetivoIdentificables: boolean;
    }
  | { readonly transicion: 'GuardarBorrador'; readonly cambiosValidosComoBorrador: boolean }
  | {
      readonly transicion: 'ActivarVersion';
      /** REG-06-104: validación de la vertical (UC-I04). */
      readonly validacionFavorable: boolean;
      /** REG-06-104: la instantánea se puede preservar (06:1391). */
      readonly instantaneaPreservable: boolean;
      /** REG-06-104: capacidad favorable cuando el Proceso es NUEVO; `true` en continuidad (REG-06-92). */
      readonly capacidadFavorable: boolean;
    };

export type MotivoDeRechazoDePlan =
  | 'TRANSICION_NO_DECLARADA'
  | 'SIN_EVALUACION_U_OBJETIVO'
  | 'CAMBIOS_INVALIDOS'
  | 'VALIDACION_DESFAVORABLE'
  | 'INSTANTANEA_NO_PRESERVABLE'
  | 'CAPACIDAD_NO_DISPONIBLE';

export type EvaluacionDeTransicionDePlan =
  | { readonly permitida: true; readonly transicion: TransicionDeMaquina<EstadoDeVersionDePlan, TransicionDeVersionDePlan, 'PROFESIONAL'> }
  | { readonly permitida: false; readonly motivo: MotivoDeRechazoDePlan };

export function evaluarTransicionDePlan(estado: EstadoDeVersionDePlan | null, c: ContextoDeTransicionDePlan): EvaluacionDeTransicionDePlan {
  const declarada = transicionDe(TRANSICIONES_DE_VERSION_DE_PLAN, c.transicion, estado);
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  switch (c.transicion) {
    case 'CrearBorrador':
      if (!c.evaluacionYObjetivoIdentificables) return { permitida: false, motivo: 'SIN_EVALUACION_U_OBJETIVO' };
      break;
    case 'GuardarBorrador':
      if (!c.cambiosValidosComoBorrador) return { permitida: false, motivo: 'CAMBIOS_INVALIDOS' };
      break;
    case 'ActivarVersion':
      if (!c.validacionFavorable) return { permitida: false, motivo: 'VALIDACION_DESFAVORABLE' };
      if (!c.instantaneaPreservable) return { permitida: false, motivo: 'INSTANTANEA_NO_PRESERVABLE' };
      if (!c.capacidadFavorable) return { permitida: false, motivo: 'CAPACIDAD_NO_DISPONIBLE' };
      break;
  }
  return { permitida: true, transicion: declarada };
}

// ─── Contenido del plan ─────────────────────────────────────────────────────────────────────────

export type EstadoDePreparacion = 'RAW' | 'COOKED' | 'AS_PURCHASED';
export interface Cantidad {
  readonly value: number;
  readonly unit: 'g' | 'ml' | 'unit';
}

/** Contenido persistido de una versión (el documento de T3). El orden es el del arreglo. */
export interface ContenidoDePlan {
  readonly dayTypes: readonly {
    readonly dayTypeId: string;
    readonly label: string;
    readonly meals: readonly {
      readonly mealId: string;
      readonly label: string;
      readonly prescriptionMode: 'DISH_OPTIONS' | 'EXCHANGE_PORTIONS';
      readonly options: readonly {
        readonly optionId: string;
        readonly label: string;
        readonly items: readonly {
          readonly itemId: string;
          readonly catalogItemId: string;
          readonly quantity: Cantidad | null;
          readonly preparationState: EstadoDePreparacion | null;
          readonly note: string | null;
        }[];
      }[];
    }[];
  }[];
}

/**
 * Asigna identificadores a los nodos que no los traen. Los que vienen se conservan: la ingesta los referencia y tienen
 * que ser estables entre guardados (DL-049).
 */
export function normalizarEstructura(entrada: EstructuraDePlanEntrada, nuevoId: () => string): ContenidoDePlan {
  return {
    dayTypes: entrada.dayTypes.map((d) => ({
      dayTypeId: d.dayTypeId ?? nuevoId(),
      label: d.label,
      meals: d.meals.map((m) => ({
        mealId: m.mealId ?? nuevoId(),
        label: m.label,
        prescriptionMode: m.prescriptionMode,
        options: m.options.map((o) => ({
          optionId: o.optionId ?? nuevoId(),
          label: o.label,
          items: o.items.map((i) => ({
            itemId: i.itemId ?? nuevoId(),
            catalogItemId: i.catalogItemId,
            quantity: i.quantity,
            preparationState: i.preparationState,
            note: i.note ?? null,
          })),
        })),
      })),
    })),
  };
}

/** Copia la estructura de otra versión con los mismos identificadores de nodo (sucesora: DL-047, DL-052). */
export function copiarEstructura(contenido: ContenidoDePlan): ContenidoDePlan {
  return JSON.parse(JSON.stringify(contenido)) as ContenidoDePlan;
}

/** Códigos de `issues` (DL-055). El 09 da un ejemplo, `MEAL_OPTION_REQUIRED` (09v9:589). */
export const CodigoDeProblemaDePlan = {
  DUPLICATE_NODE_ID: 'DUPLICATE_NODE_ID',
  EXCHANGE_MODE_NOT_AVAILABLE: 'EXCHANGE_MODE_NOT_AVAILABLE',
  CATALOG_REFERENCE_INVALID: 'CATALOG_REFERENCE_INVALID',
  DAY_TYPE_REQUIRED: 'DAY_TYPE_REQUIRED',
  MEAL_REQUIRED: 'MEAL_REQUIRED',
  MEAL_OPTION_REQUIRED: 'MEAL_OPTION_REQUIRED',
  OPTION_ITEM_REQUIRED: 'OPTION_ITEM_REQUIRED',
  PREPARATION_STATE_REQUIRED: 'PREPARATION_STATE_REQUIRED',
} as const;
export type CodigoDeProblemaDePlan = (typeof CodigoDeProblemaDePlan)[keyof typeof CodigoDeProblemaDePlan];

/** Problemas que impiden guardar un borrador: estructura rota, modalidad no habilitada o referencia inexistente. */
export function problemasDeBorrador(c: ContenidoDePlan, catalogoDisponible: ReadonlySet<string>): ValidationIssue[] {
  const problemas: ValidationIssue[] = [];
  const vistos = new Set<string>();
  const unico = (id: string, path: string) => {
    if (vistos.has(id)) problemas.push({ code: CodigoDeProblemaDePlan.DUPLICATE_NODE_ID, path });
    vistos.add(id);
  };
  c.dayTypes.forEach((d, i) => {
    const pd = `dayTypes[${i}]`;
    unico(d.dayTypeId, pd);
    d.meals.forEach((m, j) => {
      const pm = `${pd}.meals[${j}]`;
      unico(m.mealId, pm);
      // Modalidad B: modelada, no habilitada (06:4599; CONS:862).
      if (m.prescriptionMode === 'EXCHANGE_PORTIONS') problemas.push({ code: CodigoDeProblemaDePlan.EXCHANGE_MODE_NOT_AVAILABLE, path: `${pm}.prescriptionMode` });
      m.options.forEach((o, k) => {
        const po = `${pm}.options[${k}]`;
        unico(o.optionId, po);
        o.items.forEach((it, l) => {
          const pi = `${po}.items[${l}]`;
          unico(it.itemId, pi);
          if (!catalogoDisponible.has(it.catalogItemId)) problemas.push({ code: CodigoDeProblemaDePlan.CATALOG_REFERENCE_INVALID, path: `${pi}.catalogItemId` });
        });
      });
    });
  });
  return problemas;
}

/**
 * UC-I04: completitud para activar (REG-06-118: cada nivel 1..N) y estado de preparación en todo ítem con cantidad
 * (REG-06-122; INV-06-132), además de los problemas de borrador. No juzga la dieta.
 */
export function problemasParaActivar(c: ContenidoDePlan, catalogoDisponible: ReadonlySet<string>): ValidationIssue[] {
  const problemas = problemasDeBorrador(c, catalogoDisponible);
  if (c.dayTypes.length === 0) problemas.push({ code: CodigoDeProblemaDePlan.DAY_TYPE_REQUIRED, path: 'dayTypes' });
  c.dayTypes.forEach((d, i) => {
    const pd = `dayTypes[${i}]`;
    if (d.meals.length === 0) problemas.push({ code: CodigoDeProblemaDePlan.MEAL_REQUIRED, path: pd });
    d.meals.forEach((m, j) => {
      const pm = `${pd}.meals[${j}]`;
      if (m.options.length === 0) problemas.push({ code: CodigoDeProblemaDePlan.MEAL_OPTION_REQUIRED, path: pm });
      m.options.forEach((o, k) => {
        const po = `${pm}.options[${k}]`;
        if (o.items.length === 0) problemas.push({ code: CodigoDeProblemaDePlan.OPTION_ITEM_REQUIRED, path: po });
        o.items.forEach((it, l) => {
          if (it.quantity !== null && it.preparationState === null) {
            problemas.push({ code: CodigoDeProblemaDePlan.PREPARATION_STATE_REQUIRED, path: `${po}.items[${l}].preparationState` });
          }
        });
      });
    });
  });
  return problemas;
}

// ─── Instantánea (REG-06-13, REG-06-105) ────────────────────────────────────────────────────────

export interface ElementoResuelto {
  readonly versionId: string;
  readonly name: string;
  readonly composition: { readonly referenceAmount: '100g' | '100ml'; readonly energyKcal: number; readonly proteinG: number; readonly carbohydrateG: number; readonly fatG: number };
}

/** Lo que el asesorado ve: la jerarquía emitida con el catálogo resuelto al activar. No se relee el catálogo después. */
export interface ContenidoDeInstantanea {
  readonly dayTypes: readonly {
    readonly dayTypeId: string;
    readonly label: string;
    readonly meals: readonly {
      readonly mealId: string;
      readonly label: string;
      readonly prescriptionMode: 'DISH_OPTIONS' | 'EXCHANGE_PORTIONS';
      readonly options: readonly {
        readonly optionId: string;
        readonly label: string;
        readonly items: readonly {
          readonly itemId: string;
          readonly catalogItemId: string;
          readonly catalogItemVersionId: string;
          readonly name: string;
          readonly composition: ElementoResuelto['composition'];
          readonly quantity: Cantidad | null;
          readonly preparationState: EstadoDePreparacion | null;
          readonly note: string | null;
        }[];
      }[];
    }[];
  }[];
}

/**
 * Arma la instantánea. Si algún ítem no se puede resolver, devuelve `null`: la instantánea no se puede preservar y la
 * activación no se declara exitosa (06:1391; REG-06-104).
 */
export function construirInstantanea(c: ContenidoDePlan, catalogo: ReadonlyMap<string, ElementoResuelto>): ContenidoDeInstantanea | null {
  let completa = true;
  const instantanea: ContenidoDeInstantanea = {
    dayTypes: c.dayTypes.map((d) => ({
      dayTypeId: d.dayTypeId,
      label: d.label,
      meals: d.meals.map((m) => ({
        mealId: m.mealId,
        label: m.label,
        prescriptionMode: m.prescriptionMode,
        options: m.options.map((o) => ({
          optionId: o.optionId,
          label: o.label,
          items: o.items.map((it) => {
            const r = catalogo.get(it.catalogItemId);
            if (!r) completa = false;
            return {
              itemId: it.itemId,
              catalogItemId: it.catalogItemId,
              catalogItemVersionId: r?.versionId ?? '',
              name: r?.name ?? '',
              composition: r?.composition ?? { referenceAmount: '100g', energyKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 },
              quantity: it.quantity,
              preparationState: it.preparationState,
              note: it.note,
            };
          }),
        })),
      })),
    })),
  };
  return completa ? instantanea : null;
}

// ─── Ingesta prescripta (REG-06-105, 106; DL-049) ───────────────────────────────────────────────

export type MotivoDeIngestaInvalida = 'DIA_TIPO_INEXISTENTE' | 'COMIDA_INEXISTENTE' | 'OPCION_INEXISTENTE' | 'ITEM_AJENO_A_LA_OPCION' | 'ITEM_REPETIDO' | 'UNIDAD_DISTINTA';

/**
 * Valida una ingesta prescripta contra la instantánea vigente: el día tipo, la comida y la opción existen, y cada
 * cantidad consumida es de un ítem de esa opción, con la misma unidad que la prescripta cuando la hay.
 */
export function evaluarIngestaPrescripta(
  instantanea: ContenidoDeInstantanea,
  r: { readonly dayTypeId: string; readonly mealId: string; readonly optionId: string; readonly consumedItems: readonly { readonly itemId: string; readonly quantity: Cantidad }[] },
): { readonly valida: true } | { readonly valida: false; readonly motivo: MotivoDeIngestaInvalida } {
  const dia = instantanea.dayTypes.find((d) => d.dayTypeId === r.dayTypeId);
  if (!dia) return { valida: false, motivo: 'DIA_TIPO_INEXISTENTE' };
  const comida = dia.meals.find((m) => m.mealId === r.mealId);
  if (!comida) return { valida: false, motivo: 'COMIDA_INEXISTENTE' };
  const opcion = comida.options.find((o) => o.optionId === r.optionId);
  if (!opcion) return { valida: false, motivo: 'OPCION_INEXISTENTE' };
  const vistos = new Set<string>();
  for (const c of r.consumedItems) {
    if (vistos.has(c.itemId)) return { valida: false, motivo: 'ITEM_REPETIDO' };
    vistos.add(c.itemId);
    const item = opcion.items.find((i) => i.itemId === c.itemId);
    if (!item) return { valida: false, motivo: 'ITEM_AJENO_A_LA_OPCION' };
    if (item.quantity && item.quantity.unit !== c.quantity.unit) return { valida: false, motivo: 'UNIDAD_DISTINTA' };
  }
  return { valida: true };
}

// ─── Contraste descriptivo (T12; REG-06-125; INV-06-135) ────────────────────────────────────────

/** Fechas locales del período, extremos incluidos. Aritmética de calendario sobre UTC: sin horas ni zonas. */
export function fechasDelPeriodo(inicio: string, fin: string, maximo = 92): string[] {
  const fechas: string[] = [];
  const d = new Date(`${inicio}T00:00:00Z`);
  const f = new Date(`${fin}T00:00:00Z`);
  while (d <= f && fechas.length < maximo) {
    fechas.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return fechas;
}

export interface VersionEnPeriodo {
  readonly planId: string;
  /** Fecha local desde la que rige (la de la activación). */
  readonly desde: string;
  /** Fecha local en la que dejó de regir (la activación de la sucesora), o `null`. */
  readonly hasta: string | null;
  readonly instantanea: ContenidoDeInstantanea;
}

export interface IngestaParaContraste {
  readonly executionId: string;
  readonly planId: string;
  readonly localDate: string;
  readonly origin: 'PRESCRIBED' | 'OUTSIDE_PRESCRIPTION';
  readonly dayTypeId: string | null;
  readonly mealId: string | null;
  readonly optionId: string | null;
  readonly consumedItems: readonly { readonly itemId: string; readonly quantity: Cantidad }[];
  readonly description: string | null;
}

/**
 * Por día: qué versión regía, qué comidas tenían registro y cuáles no (NO_DATA), las ingestas fuera del plan aparte y,
 * si el asesorado informó cantidades, la diferencia con lo prescripto para el mismo ítem y unidad. No hay porcentajes,
 * puntajes, sumas evaluativas ni juicios: describe, no califica (REG-06-125).
 *
 * Cada registro se lee contra la versión que referencia, nunca contra la que rige hoy (REG-06-105; INV-06-13): lo
 * registrado no se pierde porque el profesional haya activado una sucesora ese mismo día.
 * - La versión del día es la del último registro del plan de esa fecha; sin registros, la que regía al terminar el día.
 * - Una comida de la versión del día toma el registro con su mismo nodo (la sucesora conserva los identificadores).
 * - Un registro cuya comida no está en la versión del día se agrega con la etiqueta de su propia versión.
 *
 * El día tipo de una fecha es el que usó el asesorado al registrar; si el plan tiene uno solo, ese. Si tiene varios y
 * ese día no hay registros, no se elige ninguno (09v9:680).
 */
export function construirContraste(fechas: readonly string[], versiones: readonly VersionEnPeriodo[], ingestas: readonly IngestaParaContraste[]): ContrasteDescriptivo {
  const porId = new Map(versiones.map((v) => [v.planId, v]));
  const comidaDe = (i: IngestaParaContraste) => {
    for (const d of porId.get(i.planId)?.instantanea.dayTypes ?? []) {
      const m = d.meals.find((x) => x.mealId === i.mealId);
      if (m) return m;
    }
    return null;
  };
  const entrada = (mealId: string, label: string, registro: IngestaParaContraste | null) => {
    const opcion = registro ? comidaDe(registro)?.options.find((o) => o.optionId === registro.optionId) : undefined;
    const quantityDifferences = (registro?.consumedItems ?? []).flatMap((c) => {
      const item = opcion?.items.find((i) => i.itemId === c.itemId);
      if (!item?.quantity || item.quantity.unit !== c.quantity.unit) return [];
      return [
        {
          itemId: item.itemId,
          name: item.name,
          prescribed: item.quantity,
          registered: c.quantity,
          difference: Math.round((c.quantity.value - item.quantity.value) * 100) / 100,
          unit: item.quantity.unit,
        },
      ];
    });
    return {
      mealId,
      label,
      state: registro ? ('REGISTERED' as const) : ('NO_DATA' as const),
      registeredOptionId: registro?.optionId ?? null,
      executionId: registro?.executionId ?? null,
      quantityDifferences,
    };
  };

  return {
    days: fechas.map((fecha) => {
      const delDia = ingestas.filter((i) => i.localDate === fecha);
      const libres = delDia.filter((i) => i.origin === 'OUTSIDE_PRESCRIPTION').map((i) => ({ executionId: i.executionId, description: i.description ?? '' }));
      const prescriptas = delDia.filter((i) => i.origin === 'PRESCRIBED' && porId.has(i.planId));
      const dataState = delDia.length > 0 ? ('HAS_DATA' as const) : ('NO_DATA' as const);
      const referenciada = prescriptas.length > 0 ? porId.get(prescriptas[prescriptas.length - 1]!.planId)! : null;
      const version = referenciada ?? versiones.find((v) => v.desde <= fecha && (v.hasta === null || fecha < v.hasta)) ?? null;
      if (!version) return { date: fecha, planId: null, dayTypeId: null, dataState, meals: [], outsidePrescription: libres };

      const propias = prescriptas.filter((i) => i.planId === version.planId);
      const dayTypeId = propias.find((i) => i.dayTypeId)?.dayTypeId ?? (version.instantanea.dayTypes.length === 1 ? version.instantanea.dayTypes[0]!.dayTypeId : null);
      const dia = version.instantanea.dayTypes.find((d) => d.dayTypeId === dayTypeId);
      const usadas = new Set<string>();
      const meals = (dia?.meals ?? []).map((m) => {
        const registro = propias.find((i) => i.mealId === m.mealId) ?? prescriptas.find((i) => i.mealId === m.mealId && !usadas.has(i.executionId)) ?? null;
        if (registro) usadas.add(registro.executionId);
        return entrada(m.mealId, m.label, registro);
      });
      for (const i of prescriptas) {
        if (usadas.has(i.executionId)) continue;
        const m = comidaDe(i);
        if (i.mealId && m) meals.push(entrada(i.mealId, m.label, i));
      }
      return { date: fecha, planId: version.planId, dayTypeId: dia?.dayTypeId ?? null, dataState, meals, outsidePrescription: libres };
    }),
  };
}
