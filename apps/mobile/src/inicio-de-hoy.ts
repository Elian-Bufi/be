/**
 * Inicio (PV-2 y PV-5, decisiones de Dirección del 2026-11-07; AV-06, AV-07 y AV-17 de WP-APP-VUELTA-DE-ROSCA, DL-166),
 * como lógica pura: las comidas del día como fichas con «la que sigue», la actividad de 30 días como un solo número y su
 * desglose en «Tu historial», el detalle plegado de la sesión de hoy, y qué se dibuja con una cuenta nueva.
 *
 * - **«La que sigue»** es la primera comida sin registrar en el orden del plan, nunca por la hora (PV-2). Un registro
 *   fuera del plan no es una comida del plan.
 * - **BE no elige** el día tipo (DL-049) ni la sesión (DL-077): sin día elegido, no hay fichas y se pide elegir.
 * - **La actividad, con su desglose** (AV2-12, con AV2-D2, que reemplaza a PV-5): «2 realizadas · 1 no realizada · 30
 *   días», nunca un total que mezcle lo hecho con lo no hecho. Inicio, «Tu historial» y la tira de la semana salen de la
 *   misma lectura y la misma clave: las realizadas de Inicio son las realizadas más las con desvío del historial.
 * - **Una cuenta nueva** (AV-17): un área sin plan es una línea, no una tarjeta; «Para responder» sin filas no se dibuja.
 */
import type { DiaTipo, Ingesta } from '@be/domain';
import type { VistaConPliegue } from './desplegable';
import type { ActividadDeEntrenamiento } from './lecturas-de-inicio';
import { TEXTOS_DEL_DESCANSO } from './textos-del-descanso';
import { TEXTOS_DE_LA_VUELTA as T } from './textos-de-la-vuelta';

// ─── Las comidas como fichas (AV-06) ─────────────────────────────────────────────────────────────

export interface FichaDeComida {
  readonly mealId: string;
  readonly nombre: string;
  readonly estado: 'registrada' | 'la-que-sigue' | 'sin-registrar';
  /** La hora del registro, si está registrada. */
  readonly hora: string | null;
  readonly opciones: number;
  /** El registro, para abrirlo. */
  readonly executionId: string | null;
  /** Lo que dice el lector: «Desayuno, registrado a las 8:40» · «Almuerzo, registrar» (§4.0). */
  readonly paraLeer: string;
}

export interface ComidasDeHoy {
  readonly fichas: readonly FichaDeComida[];
  /** Los registros de hoy que no son de una comida del plan: se cuentan aparte. */
  readonly fueraDelPlan: number;
}

/**
 * Las fichas del día tipo elegido, en el orden del plan. `null` si no hay día elegido: Inicio pide elegirlo y BE no elige
 * uno. `hora` formatea el momento en que ocurrió la comida («8:40»).
 */
export function comidasDeHoy(dia: Pick<DiaTipo, 'meals'> | null, registros: readonly Pick<Ingesta, 'origin' | 'mealId' | 'occurredAt' | 'executionId'>[], hora: (iso: string) => string): ComidasDeHoy | null {
  if (!dia) return null;
  const delPlan = registros.filter((r) => r.origin === 'PRESCRIBED' && r.mealId !== null);
  let seguida = false;
  const fichas = [...dia.meals]
    .sort((a, b) => a.order - b.order)
    .map((m): FichaDeComida => {
      const registro = delPlan.find((r) => r.mealId === m.mealId) ?? null;
      if (registro) {
        const h = hora(registro.occurredAt);
        return { mealId: m.mealId, nombre: m.label, estado: 'registrada', hora: h, opciones: m.options.length, executionId: registro.executionId, paraLeer: T.fichaRegistrada(m.label, h) };
      }
      const esLaQueSigue = !seguida;
      seguida = true;
      return {
        mealId: m.mealId,
        nombre: m.label,
        estado: esLaQueSigue ? 'la-que-sigue' : 'sin-registrar',
        hora: null,
        opciones: m.options.length,
        executionId: null,
        paraLeer: esLaQueSigue ? T.fichaQueSigue(m.label) : T.fichaSinRegistrar(m.label, m.options.length),
      };
    });
  return { fichas, fueraDelPlan: registros.length - delPlan.length };
}

/** «La que sigue»: la primera sin registrar en el orden del plan, o `null` si están todas registradas. */
export const laQueSigue = (c: ComidasDeHoy | null): FichaDeComida | null => c?.fichas.find((f) => f.estado === 'la-que-sigue') ?? null;

// ─── La actividad de 30 días, con su desglose (AV2-12, con AV2-D2) ──────────────────────────────

/** Lo que dice la tarjeta «Actividad» de Inicio. */
export interface ActividadDeInicio {
  /** Sin nada registrado: una línea, sin ceros. */
  readonly vacia: boolean;
  /** Las realizadas (también con desvío), para la cifra grande; `null` si no hay ninguna: no se escribe un cero. */
  readonly realizadas: number | null;
  /** «realizadas» o «realizada», junto a la cifra. */
  readonly unidad: string;
  /** Debajo de la cifra: «1 no realizada · 30 días», o «30 días». */
  readonly detalle: string;
  /** En una línea: «2 realizadas · 1 no realizada · 30 días». */
  readonly texto: string;
  /** Lo que dice el lector: «Actividad de los últimos 30 días: 2 realizadas y 1 no realizada». */
  readonly paraLeer: string;
}

/**
 * La actividad de Inicio: «2 realizadas · 1 no realizada · 30 días». Las realizadas son Realizada y Realizada con desvío,
 * con la condición que rige después de las correcciones; la no realizada va en neutro y solo si hay. Un día sin registro
 * no es «no realizada» (DL-106): solo cuenta lo que se registró.
 */
export function actividadDeInicio(a: Pick<ActividadDeEntrenamiento, 'realizadas' | 'conDesvio' | 'noRealizadas'>): ActividadDeInicio {
  const realizadas = a.realizadas + a.conDesvio;
  const hechas = realizadas > 0 ? T.cuantos(realizadas, 'realizada', 'realizadas') : null;
  const noHechas = a.noRealizadas > 0 ? T.noRealizadas(a.noRealizadas) : null;
  const partes = [hechas, noHechas].filter((p): p is string => p !== null);
  if (partes.length === 0) return { vacia: true, realizadas: null, unidad: '', detalle: T.treintaDias, texto: T.sinActividad, paraLeer: T.sinActividad };
  return {
    vacia: false,
    realizadas: realizadas > 0 ? realizadas : null,
    unidad: T.realizadas(realizadas),
    // Con la cifra arriba, debajo va lo que no se hizo, si hay, y el período; sin realizadas, todo en la línea.
    detalle: [hechas ? noHechas : null, hechas ? null : noHechas, T.treintaDias].filter((p): p is string => p !== null).join(' · '),
    texto: [...partes, T.treintaDias].join(' · '),
    paraLeer: T.actividadParaLeer(partes),
  };
}

/**
 * El desglose de los mismos 30 días, para «Tu historial» (AV2-12): «Últimos 30 días: 2 realizadas (1 con desvío) y 1 no
 * realizada.». Sale de la misma lectura que Inicio: sus realizadas son las de Inicio, y sus no realizadas, las mismas.
 */
export function desgloseDeActividad(a: Pick<ActividadDeEntrenamiento, 'realizadas' | 'conDesvio' | 'noRealizadas'>): { readonly realizadas: number; readonly noRealizadas: number; readonly texto: string } {
  const realizadas = a.realizadas + a.conDesvio;
  return { realizadas, noRealizadas: a.noRealizadas, texto: TEXTOS_DEL_DESCANSO.desglose30Dias(realizadas, a.conDesvio, a.noRealizadas) };
}

// ─── La sesión de hoy, con su detalle plegado (AV-06) ───────────────────────────────────────────

/** Lo que va plegado bajo «6 ejercicios · 18 series»: el bloque y la semana, y los tres primeros ejercicios. */
export function detalleDeLaSesion(s: { readonly blockLabel?: string | null; readonly microcycleLabel?: string | null; readonly prescriptions: readonly { readonly exerciseName: string; readonly sets: readonly unknown[] }[] }): {
  readonly bloque: string | null;
  readonly ejercicios: readonly string[];
  readonly yMas: string | null;
} {
  const bloque = [s.blockLabel, s.microcycleLabel].filter(Boolean).join(' · ') || null;
  const ejercicios = s.prescriptions.slice(0, 3).map((p) => `${p.exerciseName} · ${T.cuantos(p.sets.length, 'serie', 'series')}`);
  const resto = s.prescriptions.length - ejercicios.length;
  return { bloque, ejercicios, yMas: resto > 0 ? T.yMas(resto) : null };
}

/** Qué deja a la vista la sesión de hoy y qué pliega (III.7): el estado y las acciones, a la vista; el detalle, plegado. */
export const PLIEGUE_DE_LA_SESION_DE_HOY: VistaConPliegue = { nombre: 'Inicio · sesión de hoy', visible: ['estado'], plegado: ['detalle'] };

/** Qué deja a la vista «Para responder»: quién, desde cuándo y si se puede responder. No pliega nada. */
export const PLIEGUE_DE_PARA_RESPONDER: VistaConPliegue = { nombre: 'Inicio · Para responder', visible: ['quien', 'fecha', 'si-se-puede-responder', 'estado'], plegado: [] };

// ─── Una cuenta nueva: qué se dibuja (AV-17) ────────────────────────────────────────────────────

/** Un área sin plan es una línea con el texto de siempre, no una tarjeta vacía. */
export function formaDelArea(planState: 'AVAILABLE' | 'NO_ACTIVE_PLAN' | 'NOT_AVAILABLE'): 'tarjeta' | 'linea' {
  return planState === 'NO_ACTIVE_PLAN' ? 'linea' : 'tarjeta';
}

/** «Para responder» se dibuja solo con algo para responder: sin filas, no hay tarjeta ni «0». */
export const seDibujaParaResponder = (filas: readonly unknown[] | undefined): boolean => filas !== undefined && filas.length > 0;

/** El orden de Inicio (maqueta 01 y 09): el paso que falta para el acceso arriba de todo, los tres bloques de acción y lo que se mira. */
export const ORDEN_DE_INICIO = ['paso-que-falta', 'sesion', 'comidas', 'para-responder', 'para-mirar'] as const;
