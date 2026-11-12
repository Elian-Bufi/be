/**
 * Inicio (DL-166 y DL-170), como lógica pura: las comidas del día como fichas con «la que sigue», la actividad de 30 días
 * con su desglose, la tira de la semana, el detalle plegado de la sesión de hoy, la composición y qué se dibuja con una
 * cuenta nueva.
 *
 * - **Las comidas leen lo mismo que Nutrición** (AV2-13): API-ING-01, con la misma clave. Una comida está registrada con
 *   el registro de su opción o con una «comida diferente» comida en ella; la hora sale de `occurredAt`. «Fuera del plan»
 *   cuenta solo los registros que no ocupan ninguna comida.
 * - **«La que sigue»** (AV2-10, con el paso 1 de AV2-D1): la primera sin registrar después de la registrada hoy que va más
 *   adelante en el plan (`comidas-de-hoy.ts`). Las anteriores sin registrar quedan neutras, «Sin registrar»; las que
 *   vienen dicen sus opciones. Nunca por la hora, y nada en rojo.
 * - **Tocar una ficha abre esa comida** (AV2-14): la ruta lleva la comida.
 * - **BE no elige** el día tipo (DL-049) ni la sesión (DL-077): sin día elegido, no hay fichas y se pide elegir.
 * - **La actividad, con su desglose** (AV2-12, con AV2-D2, que reemplaza a PV-5): «2 realizadas · 1 no realizada · 30
 *   días», nunca un total que mezcle lo hecho con lo no hecho. Inicio, «Tu historial» y la tira de la semana salen de la
 *   misma lectura y la misma clave: las realizadas de Inicio son las realizadas más las con desvío del historial.
 * - **Una cuenta nueva** (AV-17): un área sin plan es una línea, no una tarjeta; «Para responder» sin filas no se dibuja.
 */
import type { HoyConOpcionesResponse, RegistroDeComida } from '@be/domain';
import { estadosDeLasComidas, registroDeLaComida, type EstadoDeLaComida } from './comidas-de-hoy';
import type { VistaConPliegue } from './desplegable';
import type { ActividadDeEntrenamiento } from './lecturas-de-inicio';
import type { NombreDeIcono } from './icono';
import type { Ruta } from './navegacion';
import { RELLENO_DE_LA_TARJETA } from './receta-de-vidrio';
import { TEXTOS_DEL_DESCANSO } from './textos-del-descanso';
import { TEXTOS_DE_LA_VUELTA as T } from './textos-de-la-vuelta';

// ─── Las comidas como fichas (AV2-10, AV2-13, AV2-14) ────────────────────────────────────────────

type ComidaDelDia = Pick<HoyConOpcionesResponse['data']['meals'][number], 'mealId' | 'label' | 'order' | 'options' | 'recordId'>;

export interface FichaDeComida {
  readonly mealId: string;
  readonly nombre: string;
  readonly estado: EstadoDeLaComida;
  /** La hora del registro («13:10»), si está registrada y se sabe. */
  readonly hora: string | null;
  readonly opciones: number;
  /** El registro, para abrirlo. */
  readonly recordId: string | null;
  /** Lo que dice el lector: «Almuerzo, registrado a las 13:10» · «Merienda, registrar» (§3.4). */
  readonly paraLeer: string;
  /** Lo que dice la ficha debajo del nombre: «13:10», «Registrar», «Sin registrar» o «3 opciones». */
  readonly texto: string;
}

export interface ComidasDeHoy {
  readonly fichas: readonly FichaDeComida[];
  /** Los registros de hoy que no ocupan ninguna comida: se cuentan aparte. Una comida diferente ocupa la suya. */
  readonly fueraDelPlan: number;
}

/**
 * Las fichas del día tipo elegido, en el orden del plan, desde API-ING-01 (AV2-13). `null` si no hay día elegido: Inicio
 * pide elegirlo y BE no elige uno. `hora` formatea el momento en que ocurrió la comida («13:10»).
 */
export function comidasDeHoy(dia: { readonly meals: readonly ComidaDelDia[] } | null, registros: readonly RegistroDeComida[], hora: (iso: string) => string): ComidasDeHoy | null {
  if (!dia) return null;
  const estados = estadosDeLasComidas(dia.meals, registros);
  const fichas = [...dia.meals]
    .sort((a, b) => a.order - b.order)
    .map((m): FichaDeComida => {
      const estado = estados.get(m.mealId) ?? 'por-venir';
      const base = { mealId: m.mealId, nombre: m.label, estado, opciones: m.options.length };
      if (estado === 'registrada') {
        const registro = registroDeLaComida(m, registros);
        const h = registro ? hora(registro.occurredAt) : null;
        return { ...base, hora: h, recordId: registro?.recordId ?? m.recordId, paraLeer: h ? T.fichaRegistrada(m.label, h) : T.fichaRegistradaSinHora(m.label), texto: h ?? T.registradaSinHora };
      }
      if (estado === 'la-que-sigue') return { ...base, hora: null, recordId: null, paraLeer: T.fichaQueSigue(m.label), texto: T.registrar };
      if (estado === 'sin-registrar') return { ...base, hora: null, recordId: null, paraLeer: T.fichaSinRegistrar(m.label), texto: T.sinRegistrar };
      return { ...base, hora: null, recordId: null, paraLeer: T.fichaPorVenir(m.label, m.options.length), texto: T.opciones(m.options.length) };
    });
  return { fichas, fueraDelPlan: registros.filter((r) => r.annulment === null && r.meal === null).length };
}

/** «La que sigue», o `null` si no se destaca ninguna. */
export const laQueSigue = (c: ComidasDeHoy | null): FichaDeComida | null => c?.fichas.find((f) => f.estado === 'la-que-sigue') ?? null;

/** El ícono de cada ficha dice su estado, no la comida (AV2-T10): los nombres los escribe el profesional. */
export const ICONO_DE_LA_FICHA: Readonly<Record<EstadoDeLaComida, NombreDeIcono>> = {
  registrada: 'tilde',
  'la-que-sigue': 'mas',
  'sin-registrar': 'sin-registro',
  'por-venir': 'opciones',
};

/**
 * Adónde lleva tocar una ficha (AV2-14): una registrada abre su registro; las demás abren Nutrición en esa comida (la ruta
 * lleva la comida, y Nutrición la toma como la elegida).
 */
export function rutaDeLaFicha(f: Pick<FichaDeComida, 'mealId' | 'estado' | 'recordId'>): Ruta {
  if (f.estado === 'registrada' && f.recordId) return { nombre: 'registro-nutricional', id: f.recordId };
  return { nombre: 'hoy', accion: 'registrar', comida: f.mealId };
}

// ─── La composición: dos columnas con letra ×1, una con ×1,3 (AV2-07) ───────────────────────────

/** El relleno del contenido de cada pantalla, a cada lado (App.tsx), y la separación entre fichas o tarjetas, en dp. */
export const RELLENO_DE_LA_PANTALLA = 20;
export const SEPARACION_EN_INICIO = 8;

/**
 * Cuántas columnas van las fichas de las comidas y las dos tarjetas chicas: dos con la letra de siempre; una con letra
 * ×1,3 o más, o en un teléfono angosto. No se achica la letra: cambia la composición.
 */
export const columnasDeInicio = (ancho: number, escalaDeLetra: number): 1 | 2 => (escalaDeLetra >= 1.3 || ancho < 340 ? 1 : 2);

/**
 * El ancho de una columna: el de la pantalla menos su relleno y, dentro de una tarjeta, el relleno y el borde de 1 dp de
 * la tarjeta (`RELLENO_DE_LA_TARJETA`, de la receta). Sin porcentajes: el ancho sale de la ventana.
 */
export function anchoDeLaColumna(ancho: number, escalaDeLetra: number, dentroDeUnaTarjeta: boolean): number {
  const util = ancho - 2 * RELLENO_DE_LA_PANTALLA - (dentroDeUnaTarjeta ? 2 * (RELLENO_DE_LA_TARJETA + 1) : 0);
  return columnasDeInicio(ancho, escalaDeLetra) === 1 ? util : Math.floor((util - SEPARACION_EN_INICIO) / 2);
}

/** El nombre del día del plan bajo «Comidas»: solo si el plan tiene más de un tipo de día (AV2-07). */
export function nombreDelDiaEnInicio(dias: readonly { readonly dayTypeId: string; readonly label: string }[], elegido: string | null): string | undefined {
  if (dias.length <= 1) return undefined;
  return dias.find((d) => d.dayTypeId === elegido)?.label ?? undefined;
}

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
