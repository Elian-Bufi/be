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
 * - **La composición** (AV2-07): dos columnas con la letra de siempre y una con ×1,3, con la escala como la manda Android
 *   (`escala-de-letra.ts`), y además según lo que entra: ninguna palabra se parte a la mitad.
 */
import { COPY_ANTROPOMETRIA, numero, textoDeDiferenciaAntropometrica, type HoyConOpcionesResponse, type MedidaDeLaToma, type Ocurrencia, type RegistroDeComida } from '@be/domain';
import { anchoDeLaPalabraMasLarga, estadosDeLasComidas, fichasPorFila, registroDeLaComida, type EstadoDeLaComida, type MedidasDeLaFicha } from './comidas-de-hoy';
import type { VistaConPliegue } from './desplegable';
import { esLetraGrande } from './escala-de-letra';
import { diaDeLaSemana, diaYMes, fechaCivil } from './formato';
import type { ActividadDeEntrenamiento, ActividadDelDia } from './lecturas-de-inicio';
import { sesionRealizada } from './sesion-en-curso';
import { enumerar } from './textos-por-toma';
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

// ─── La composición: dos columnas con letra ×1, una con ×1,3 o si no entra (AV2-07) ─────────────

/** El relleno del contenido de cada pantalla, a cada lado (App.tsx), y la separación entre fichas o tarjetas, en dp. */
export const RELLENO_DE_LA_PANTALLA = 20;
export const SEPARACION_EN_INICIO = 8;

/**
 * La regla de base de las columnas de Inicio: dos con la letra de siempre; una con letra ×1,3 o más, o en un teléfono
 * angosto. La escala se compara como la manda Android (`escala-de-letra.ts`): «×1,3» llega como 1,2999999523…, y con el
 * literal quedaban dos columnas. No se achica la letra: cambia la composición. Las fichas y las tarjetas chicas, además,
 * pasan a una columna si su texto no entra (`columnasDeLasFichas`, `disposicionDeLasTarjetasChicas`).
 */
export const columnasDeInicio = (ancho: number, escalaDeLetra: number): 1 | 2 => (esLetraGrande(escalaDeLetra) || ancho < 340 ? 1 : 2);

/**
 * El ancho útil: el de la pantalla menos su relleno y, dentro de una tarjeta, el relleno y el borde de 1 dp de la tarjeta
 * (`RELLENO_DE_LA_TARJETA`, de la receta). Sin porcentajes: el ancho sale de la ventana.
 */
export const anchoUtilDeInicio = (ancho: number, dentroDeUnaTarjeta: boolean): number => ancho - 2 * RELLENO_DE_LA_PANTALLA - (dentroDeUnaTarjeta ? 2 * (RELLENO_DE_LA_TARJETA + 1) : 0);

/** El ancho de cada columna, para una o dos columnas, con la separación de Inicio entre las dos. */
export function anchoDeCadaColumna(ancho: number, columnas: 1 | 2, dentroDeUnaTarjeta: boolean): number {
  const util = anchoUtilDeInicio(ancho, dentroDeUnaTarjeta);
  return columnas === 1 ? util : Math.floor((util - SEPARACION_EN_INICIO) / 2);
}

/**
 * Lo que ocupa una ficha de comida además de su nombre (`inicio-nutricion.tsx`): el relleno (12 dp de cada lado), el borde
 * de «la que sigue» (2 de cada lado, el más grueso), el ícono (20) y su separación (8). El nombre va en 16 sp.
 */
export const FICHA_DE_INICIO: MedidasDeLaFicha = { letra: 16, alrededor: 2 * 12 + 2 * 2 + 20 + 8, separacion: SEPARACION_EN_INICIO };

/**
 * Cuántas columnas van las fichas de las comidas (AV2-07): las de la regla de base y, si en media tarjeta no entra la
 * palabra más larga de algún nombre, una. Los nombres los escribe el profesional («Preentrenamiento» no entra a 360 dp) y
 * una palabra no se parte. La cuenta es la de Nutrición (`fichasPorFila`, con las medidas de la ficha de Inicio); una sola
 * comida va a todo el ancho.
 */
export function columnasDeLasFichas(ancho: number, escalaDeLetra: number, nombres: readonly string[]): 1 | 2 {
  if (columnasDeInicio(ancho, escalaDeLetra) === 1) return 1;
  return fichasPorFila(anchoUtilDeInicio(ancho, true), nombres, escalaDeLetra, FICHA_DE_INICIO) >= 2 ? 2 : 1;
}

/** El título de una tarjeta de Inicio, en sp (`tarjeta-de-inicio.tsx`), y hasta dónde crece con la letra de la persona. */
export const LETRA_DEL_TITULO = 19;
export const TOPE_DEL_TITULO = 1.5;
/** Lo que ocupa el ícono al lado del título: 20 dp y su separación de 8. */
const ICONO_DEL_TITULO = 20 + 8;

/** Dónde va el ícono de una tarjeta para que la palabra más larga del título no se parta: al lado, arriba, o no entra. */
export type LugarDelIcono = 'al-lado' | 'arriba' | 'no-entra';

/** El lugar del ícono en una tarjeta de `anchoDeLaTarjeta` dp, con el título en negrita y la letra de la persona. */
export function lugarDelIcono(titulos: readonly string[], anchoDeLaTarjeta: number, escalaDeLetra: number): LugarDelIcono {
  const interior = anchoDeLaTarjeta - 2 * (RELLENO_DE_LA_TARJETA + 1);
  const palabra = anchoDeLaPalabraMasLarga(titulos, LETRA_DEL_TITULO, Math.min(escalaDeLetra, TOPE_DEL_TITULO));
  if (palabra <= interior - ICONO_DEL_TITULO) return 'al-lado';
  return palabra <= interior ? 'arriba' : 'no-entra';
}

/** Cómo van las dos tarjetas chicas (la medida y la actividad): cuántas columnas, su ancho y si el ícono va arriba. */
export interface DisposicionDeLasTarjetasChicas {
  readonly columnas: 1 | 2;
  readonly ancho: number;
  readonly iconoArriba: boolean;
}

/**
 * Las tarjetas chicas (AV2-07), decididas juntas para que el par quede parejo: lado a lado con la regla de base, con el
 * ícono al lado del título si entra, arriba si al lado no entra y en una columna si tampoco entra arriba. Los títulos son
 * los que se ven siempre: «Mediciones», mientras carga o sin tomas, y «Actividad». A 360 dp, «Mediciones» no entra al lado
 * del ícono y se partía («Medicione / s»): el ícono va arriba. Una medida de nombre largo que no entre al lado lo sube
 * solo en su tarjeta (`tarjeta-de-inicio.tsx`).
 */
export function disposicionDeLasTarjetasChicas(ancho: number, escalaDeLetra: number, titulos: readonly string[]): DisposicionDeLasTarjetasChicas {
  if (columnasDeInicio(ancho, escalaDeLetra) === 2) {
    const deDos = anchoDeCadaColumna(ancho, 2, false);
    const lugar = lugarDelIcono(titulos, deDos, escalaDeLetra);
    if (lugar !== 'no-entra') return { columnas: 2, ancho: deDos, iconoArriba: lugar === 'arriba' };
  }
  const deUna = anchoDeCadaColumna(ancho, 1, false);
  return { columnas: 1, ancho: deUna, iconoArriba: lugarDelIcono(titulos, deUna, escalaDeLetra) !== 'al-lado' };
}

/** El círculo de cada día de la tira, en dp, con la letra de siempre. */
const CIRCULO_DEL_DIA = 34;

/**
 * El aro de hoy (AV2-T21): va por fuera del círculo, con su grosor y una separación del color de la tarjeta, en dp. Así
 * se ve también el día en que la persona entrenó: como borde del propio círculo, sobre el verde, no se distinguía.
 */
export const ARO_DE_HOY = { grosor: 2, separacion: 2 } as const;

/**
 * El círculo de cada día de la tira (AV2-08): crece con la letra hasta ×1,3 y, con el aro de hoy alrededor, no pasa su
 * columna, un séptimo del ancho de la tarjeta entera. Antes la columna salía de media tarjeta (el ancho de una ficha), y
 * a 360 dp el círculo medía 17 dp: el número no entraba.
 */
export function ladoDelDiaDeLaTira(ancho: number, escalaDeLetra: number): number {
  const columna = Math.floor(anchoUtilDeInicio(ancho, true) / 7);
  const aro = 2 * (ARO_DE_HOY.grosor + ARO_DE_HOY.separacion);
  return Math.min(columna - aro, Math.round(CIRCULO_DEL_DIA * Math.min(Math.max(escalaDeLetra, 1), 1.3)));
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

/**
 * El orden de Inicio, de arriba abajo (DL-170, AV2-07; maqueta de §1.1): debajo del título, que es la fecha, el paso que
 * falta para el acceso arriba de todo, la tira de la semana, Entrenamiento, Comidas, «Para responder» si hay algo, y al
 * final, lado a lado, la medida de la última toma y la actividad. Sin el rótulo «Para mirar».
 */
export const ORDEN_DE_INICIO = ['paso-que-falta', 'semana', 'sesion', 'comidas', 'para-responder', 'medida', 'actividad'] as const;

// ─── La tira de la semana (AV2-08, con AV2-D5) ──────────────────────────────────────────────────

const LETRAS_DE_LA_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

/** Una fecha civil corrida `n` días. */
const sumarDias = (fecha: string, n: number): string => {
  const d = new Date(`${fecha.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** El lunes de la semana calendario de una fecha civil (AV2-D5: de lunes a domingo). */
export const lunesDeLaSemana = (fecha: string): string => sumarDias(fecha, -((new Date(`${fecha.slice(0, 10)}T00:00:00Z`).getUTCDay() + 6) % 7));

export interface DiaDeLaTira {
  readonly fecha: string;
  readonly letra: string;
  readonly numero: number;
  /** Con al menos una sesión realizada (también con desvío): el círculo en `exito` con la tilde. */
  readonly realizada: boolean;
  /** Hoy: el aro. */
  readonly hoy: boolean;
}

export interface TiraDeLaSemana {
  readonly dias: readonly DiaDeLaTira[];
  /** Las sesiones realizadas en la semana; `null` mientras carga: no se dice nada, ni un cero. */
  readonly realizadas: number | null;
  /** «2 sesiones realizadas esta semana», o `null`: sin ninguna, la línea no se dibuja. */
  readonly linea: string | null;
  /** Una sola etiqueta para el lector: «Esta semana: lunes y miércoles con sesión realizada. Hoy, lunes 9» (§3.4). */
  readonly paraLeer: string;
}

/**
 * Lo registrado hoy según API-TRN-14 (una ejecución registrada por ocurrencia de hoy), para la tira: por si la lectura de
 * 30 días quedó un día atrás. Solo cuentas, con la condición registrada.
 */
export function registradasHoySegunElPlan(hoy: string, ocurrencias: readonly Pick<Ocurrencia, 'date' | 'execution'>[]): ActividadDelDia {
  const deHoy = ocurrencias.filter((o) => o.date === hoy && o.execution.state === 'REGISTERED');
  const realizadas = deHoy.filter((o) => sesionRealizada(o.execution)).length;
  return { realizadas, noRealizadas: deHoy.length - realizadas };
}

/**
 * La tira de la semana (AV2-08): la semana calendario de hoy, de lunes a domingo (AV2-D5), según el día de la API. Un día
 * con alguna sesión realizada lleva la tilde; los demás, el número neutro: un día con solo una «No realizada», uno sin
 * sesión y uno que todavía no llegó se ven igual. Nunca rojo ni cruz, ninguna cuenta de días seguidos, y el lunes arranca
 * vacía: nada pasa a la semana siguiente.
 * - `actividad` es la lectura de 30 días, que siempre contiene la semana (`null` mientras carga: sin tildes y sin línea).
 * - `registradasHoy` es lo de hoy en API-TRN-14: vale solo si esa lectura terminó antes de hoy (quedó un día atrás).
 */
export function tiraDeLaSemana(hoy: string, actividad: Pick<ActividadDeEntrenamiento, 'periodo' | 'porDia'> | null, registradasHoy: ActividadDelDia | null): TiraDeLaSemana {
  const lunes = lunesDeLaSemana(hoy);
  const cuentas = LETRAS_DE_LA_SEMANA.map((letra, i) => {
    const fecha = sumarDias(lunes, i);
    const delDia = fecha === hoy && actividad && actividad.periodo.hasta < hoy && registradasHoy ? registradasHoy : (actividad?.porDia[fecha] ?? null);
    return { fecha, letra, numero: Number(fecha.slice(8, 10)), realizadas: delDia?.realizadas ?? 0, hoy: fecha === hoy };
  });
  const dias = cuentas.map((c): DiaDeLaTira => ({ fecha: c.fecha, letra: c.letra, numero: c.numero, realizada: c.realizadas > 0, hoy: c.hoy }));
  const realizadas = actividad ? cuentas.reduce((suma, c) => suma + c.realizadas, 0) : null;
  const hoyParaLeer = `${diaDeLaSemana(hoy)} ${Number(hoy.slice(8, 10))}`;
  const conSesion = dias.filter((d) => d.realizada).map((d) => diaDeLaSemana(d.fecha));
  return {
    dias,
    realizadas,
    linea: realizadas ? T.sesionesRealizadasEstaSemana(realizadas) : null,
    paraLeer: conSesion.length > 0 ? T.semanaParaLeer(enumerar(conSesion), hoyParaLeer) : T.semanaSinSesionesParaLeer(hoyParaLeer),
  };
}

// ─── La medida de la última toma, en una tarjeta chica (AV2-07) ─────────────────────────────────

/** Cómo dice el lector las unidades de una medida: «80,9 kilos», no «80,9 ka ge». */
const UNIDADES_EN_PALABRAS: Readonly<Record<string, readonly [string, string]>> = {
  kg: ['kilo', 'kilos'],
  cm: ['centímetro', 'centímetros'],
  mm: ['milímetro', 'milímetros'],
  m: ['metro', 'metros'],
};
export const unidadEnPalabras = (unidad: string, valor: number): string => {
  const palabras = UNIDADES_EN_PALABRAS[unidad];
  return palabras ? palabras[valor === 1 ? 0 : 1] : unidad;
};

/** Lo que dice la tarjeta de la medida destacada: el título, el valor, el cambio y lo que lee el lector. */
export interface MedidaDeInicio {
  /** El nombre de la medida destacada: «Peso»; si la toma no trae peso, la medida que trae. */
  readonly titulo: string;
  readonly valor: string;
  readonly unidad: string;
  /** «Sin cambio desde el 2 sept», «+0,4 kg desde el 2 sept»: sin color ni flecha que juzgue. */
  readonly cambio: string;
  readonly paraLeer: string;
}

/**
 * La medida de Inicio (AV2-07): la destacada de la última toma, con el cambio desde la anterior comparable dicho como un
 * dato. La tarjeta se toca entera y abre la evolución de esa medida. Se van «16 medidas · 6 resultados de fórmulas» y el
 * «Ver su evolución» que no decía de qué.
 */
export function medidaDeInicio(m: Pick<MedidaDeLaToma, 'nombre' | 'actual' | 'anterior' | 'diferencia' | 'motivoSinAnterior'>): MedidaDeInicio {
  const valor = numero(m.actual.punto.value);
  const unidad = m.actual.punto.unit;
  let cambio: string;
  let cambioParaLeer: string;
  if (m.diferencia && m.anterior) {
    const diferencia = textoDeDiferenciaAntropometrica(m.diferencia);
    cambio = m.diferencia.delta === 0 ? T.sinCambioDesde(fechaCivil(m.anterior.fecha)) : T.cambioDesde(diferencia, fechaCivil(m.anterior.fecha));
    cambioParaLeer = m.diferencia.delta === 0 ? T.sinCambioDesde(diaYMes(m.anterior.fecha)) : T.cambioDesde(diferencia, diaYMes(m.anterior.fecha));
  } else {
    cambio = m.motivoSinAnterior === 'OTRO_GRUPO' ? T.sinAnteriorComparableOtroGrupo : COPY_ANTROPOMETRIA.sinAnteriorComparable;
    cambioParaLeer = cambio;
  }
  const enMinuscula = cambioParaLeer.charAt(0).toLocaleLowerCase('es-AR') + cambioParaLeer.slice(1);
  return { titulo: m.nombre, valor, unidad, cambio, paraLeer: `${m.nombre}, ${valor} ${unidadEnPalabras(unidad, m.actual.punto.value)}, ${enMinuscula}. ${T.verLaEvolucion}` };
}
