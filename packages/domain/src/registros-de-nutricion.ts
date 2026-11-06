/**
 * Los registros de Nutrición de un período, para el profesional (WP-ESCRITORIO-AREAS, parte 1; maqueta 20): el día es la
 * unidad, y cada comida del plan es un renglón con lo que se registró en ella.
 *
 * Sale de dos lecturas que ya existen (F-15):
 * - el contexto de revisión (API-NUT-17) arma los días y las comidas del plan de cada día, dice cuáles tienen un registro
 *   y trae las restas de cantidad que se pueden hacer;
 * - la línea de tiempo del mismo período (API-DSH-04, comidas de Nutrición) dice de cada registro la opción elegida, cómo
 *   se informaron las cantidades y lo que BE comprobó frente a lo indicado.
 * Se unen por el identificador del registro. Si la segunda no llegó, los días se arman igual y lo que depende de ella
 * queda sin decir (`entrada: null`, cuentas en `null`): nada se completa ni se supone.
 *
 * Lo que este módulo cuida, como lo dicen los contratos del contraste (`ContrasteDeComidaSchema`):
 * - una comida sin registro es «Sin registro»: no es un cero ni un incumplimiento;
 * - una comida diferente no marca la comida del plan como registrada: se dice en su comida, con los dos hechos, o en un
 *   renglón propio si no se registró en ninguna;
 * - «N de M comidas registradas» es una cuenta, no un cumplimiento, y un día sin registros no dice «0 de 4».
 */
import type { EntradaDeLineaDeTiempo } from './contratos-analisis';
import type { ContrasteDescriptivo } from './contratos-nutricion';
import { frenteALoIndicadoEnPalabras, type ModoDeRegistro } from './contraste-de-comida';
import { ETIQUETA_DE_UNIDAD } from './copy-nutricion';
import { COPY_REGISTRO_PARA_EL_PROFESIONAL } from './copy-recetas';
import { rasgoDeVariasComidas, RASGOS_DE_UN_HECHO, rasgosDeUnHecho, type RasgoDeUnHecho } from './dia-de-la-linea';
import { cantidad } from './formato-numeros';
import type { NombreDeIcono } from './iconos';

type DiaDelContraste = ContrasteDescriptivo['days'][number];
type ComidaDelContraste = DiaDelContraste['meals'][number];
export type DiferenciaDeCantidad = ComidaDelContraste['quantityDifferences'][number];

// ─── Lo que la línea de tiempo dice de un registro de comida ────────────────────────────────────────────────

const detalle = (e: EntradaDeLineaDeTiempo, rotulo: string): string | null => e.details.find((d) => d.label === rotulo)?.value ?? null;

/**
 * La opción del plan que la persona registró, como va en un renglón: «2 · Tostadas con queso» → «Tostadas con queso»;
 * una opción sin nombre («2») se dice «Opción 2». `null` si la entrada no trae una opción (una comida diferente).
 */
export function opcionDeUnaComida(e: EntradaDeLineaDeTiempo): string | null {
  const opcion = detalle(e, 'Opción');
  if (opcion === null) return null;
  return /^\d+$/.test(opcion) ? `Opción ${opcion}` : opcion.replace(/^\d+ · /, '');
}

/** Cómo se registraron las cantidades, desde los rasgos de la entrada: no dice si difieren de lo indicado. */
export function modoDeUnaComida(e: EntradaDeLineaDeTiempo): ModoDeRegistro | null {
  if (e.quality.includes('DIFFERENT_MEAL')) return 'COMIDA_DIFERENTE';
  if (e.quality.includes('QUANTITIES_FROM_PLAN')) return 'PORCIONES_DEL_PLAN';
  if (e.quality.includes('QUANTITIES_REPORTED')) return 'INFORMADAS';
  if (e.quality.includes('QUANTITIES_UNCONFIRMED')) return 'SIN_CONFIRMAR';
  return null;
}

/** El modo de registro en un renglón, con su ícono. Los dos primeros son los de siempre; el tercero es un rasgo. */
export const MODO_EN_UN_RENGLON: Readonly<Partial<Record<ModoDeRegistro, { readonly icono: NombreDeIcono; readonly texto: string }>>> = {
  PORCIONES_DEL_PLAN: { icono: 'plan', texto: 'Porciones del plan' },
  INFORMADAS: { icono: 'a-mano', texto: 'Cantidades informadas' },
  SIN_CONFIRMAR: { icono: 'sin-confirmar', texto: 'Sin confirmar' },
};

/**
 * Lo que se sabe de un registro frente a lo indicado, en palabras. Con cantidades informadas, lo que comprobó la API
 * ingrediente por ingrediente (llega escrito en la entrada); en los otros modos, por qué no hay diferencia que comprobar.
 */
export function frenteALoIndicadoDeUnaComida(e: EntradaDeLineaDeTiempo): string {
  const comprobado = detalle(e, 'Frente a lo indicado');
  if (comprobado) return comprobado;
  const modo = modoDeUnaComida(e);
  if (modo === null || modo === 'INFORMADAS') return 'Sin dato';
  return frenteALoIndicadoEnPalabras({ modo, resultado: modo === 'PORCIONES_DEL_PLAN' ? 'LAS_DEL_PLAN' : 'NO_SE_COMPRUEBA', ingredientes: 0, distintos: 0, sinComparar: 0 });
}

/** Una resta de cantidad, como va en el renglón: «Pollo +30 g». Es la que llega con el contraste: no se vuelve a calcular. */
export function diferenciaEnUnRenglon(q: DiferenciaDeCantidad): string {
  const signo = q.difference > 0 ? '+' : q.difference < 0 ? '−' : '';
  return `${q.name} ${signo}${cantidad(Math.abs(q.difference), ETIQUETA_DE_UNIDAD[q.unit])}`;
}

// ─── Las filas ──────────────────────────────────────────────────────────────────────────────────────────────

/** En qué estado está una fila. Cada fila está en uno solo, y los tres suman «Todas las comidas». */
export type EstadoDeFilaDeRegistro = 'REGISTRADA' | 'COMIDA_DIFERENTE' | 'SIN_REGISTRO';

export interface RegistroDeUnaFila {
  readonly id: string;
  readonly clase: 'OPCION_DEL_PLAN' | 'COMIDA_DIFERENTE';
  /** Lo que la línea de tiempo dice de este registro; `null` si no llegó. */
  readonly entrada: EntradaDeLineaDeTiempo | null;
  /** La descripción original de una comida diferente, como llega con el contraste. */
  readonly descripcion: string | null;
}

export interface FilaDeRegistro {
  /** Única en el período. */
  readonly clave: string;
  readonly fecha: string;
  /** La comida del plan («Desayuno»). `null`: una comida diferente que no se registró en ninguna comida del plan. */
  readonly comida: string | null;
  readonly estado: EstadoDeFilaDeRegistro;
  /** Primero el registro de la opción del plan, si lo hay; después, las comidas diferentes registradas en esa comida. */
  readonly registros: readonly RegistroDeUnaFila[];
  /**
   * Las restas que llegan con el contraste y no dan cero. El contraste trae una por cada ítem con cantidad en la misma
   * unidad, también cuando lo registrado es igual a lo indicado (las porciones del plan confirmadas dan todas cero):
   * esas no son una diferencia, y no se muestran como tal.
   */
  readonly diferencias: readonly DiferenciaDeCantidad[];
}

export interface DiaDeRegistros {
  readonly fecha: string;
  readonly filas: readonly FilaDeRegistro[];
  /**
   * Por qué el día no tiene comidas del plan para mostrar: no había un plan vigente, o el plan tiene más de un día tipo
   * y no hay registros que digan cuál correspondía. Esas comidas no se pueden contar: no se inventan.
   */
  readonly sinComidasDelPlan: 'SIN_PLAN' | 'SIN_DIA_TIPO' | null;
  /** El día entero, sin ningún registro. */
  readonly sinRegistros: boolean;
}

/** El registro de la opción del plan de una fila, si lo tiene. */
export const registroDeLaOpcion = (f: FilaDeRegistro): RegistroDeUnaFila | null => f.registros.find((r) => r.clase === 'OPCION_DEL_PLAN') ?? null;

/**
 * Los días del período, del más nuevo al más viejo, con sus filas en el orden del plan. `entradas` son las comidas de la
 * línea de tiempo del mismo período, o `null` si esa lectura no llegó. Los registros anulados no forman parte del
 * contraste: aunque la línea de tiempo los traiga, no arman ninguna fila.
 */
export function componerLosRegistros(contraste: ContrasteDescriptivo, entradas: readonly EntradaDeLineaDeTiempo[] | null): DiaDeRegistros[] {
  const porRegistro = new Map((entradas ?? []).filter((e) => e.eventType === 'MEAL_RECORDED').map((e) => [e.source.id, e]));
  const dias = contraste.days.map((d): DiaDeRegistros => {
    const descripcion = new Map(d.outsidePrescription.map((o) => [o.executionId, o.description]));
    const enUnaComida = new Set<string>();
    const filas: FilaDeRegistro[] = d.meals.map((m) => {
      const registros: RegistroDeUnaFila[] = [];
      if (m.state === 'REGISTERED' && m.executionId) registros.push({ id: m.executionId, clase: 'OPCION_DEL_PLAN', entrada: porRegistro.get(m.executionId) ?? null, descripcion: null });
      for (const id of m.differentMealExecutionIds) {
        enUnaComida.add(id);
        registros.push({ id, clase: 'COMIDA_DIFERENTE', entrada: porRegistro.get(id) ?? null, descripcion: descripcion.get(id) ?? null });
      }
      const estado: EstadoDeFilaDeRegistro = m.state === 'REGISTERED' ? 'REGISTRADA' : m.differentMealExecutionIds.length > 0 ? 'COMIDA_DIFERENTE' : 'SIN_REGISTRO';
      return { clave: `${d.date}|${m.mealId}`, fecha: d.date, comida: m.label, estado, registros, diferencias: m.quantityDifferences.filter((q) => q.difference !== 0) };
    });
    // Una comida diferente que no se registró en ninguna comida del plan: un renglón propio del día.
    for (const o of d.outsidePrescription) {
      if (enUnaComida.has(o.executionId)) continue;
      filas.push({
        clave: `${d.date}|fuera|${o.executionId}`,
        fecha: d.date,
        comida: null,
        estado: 'COMIDA_DIFERENTE',
        registros: [{ id: o.executionId, clase: 'COMIDA_DIFERENTE', entrada: porRegistro.get(o.executionId) ?? null, descripcion: o.description }],
        diferencias: [],
      });
    }
    return { fecha: d.date, filas, sinComidasDelPlan: d.meals.length > 0 ? null : d.planId ? 'SIN_DIA_TIPO' : 'SIN_PLAN', sinRegistros: d.dataState === 'NO_DATA' };
  });
  return dias.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
}

/** Lo que un renglón dice de su comida además de la opción: cómo quedó el registro, en el orden de siempre. */
export function rasgosDeLaFila(f: FilaDeRegistro): RasgoDeUnHecho[] {
  const presentes = new Set<RasgoDeUnHecho>();
  for (const r of f.registros) {
    if (r.clase === 'COMIDA_DIFERENTE') presentes.add('COMIDA_DIFERENTE');
    if (r.entrada) for (const rasgo of rasgosDeUnHecho(r.entrada)) presentes.add(rasgo);
  }
  return RASGOS_DE_UN_HECHO.filter((r) => presentes.has(r));
}

// ─── Las vistas con nombre ──────────────────────────────────────────────────────────────────────────────────

export type ClaveDeVistaDeRegistros = 'TODAS' | 'DISTINTAS' | 'SIN_CONFIRMAR' | 'COMIDA_DIFERENTE' | 'SIN_REGISTRO';

export interface VistaDeRegistros {
  readonly clave: ClaveDeVistaDeRegistros;
  readonly nombre: string;
  readonly icono: NombreDeIcono | null;
  /** Qué filas trae, para la ayuda de la vista. */
  readonly queTrae: string;
  /** Depende de lo que dice la línea de tiempo de cada registro: sin esa lectura no se puede contar. */
  readonly deLaLinea: boolean;
}

export const VISTAS_DE_REGISTROS: readonly VistaDeRegistros[] = [
  {
    clave: 'TODAS',
    nombre: 'Todas las comidas',
    icono: null,
    queTrae: 'Cada comida del plan de cada día del período, con registro o sin él, y las comidas diferentes que no se registraron en ninguna comida del plan.',
    deLaLinea: false,
  },
  {
    clave: 'DISTINTAS',
    nombre: 'Distinto de lo indicado',
    icono: 'distinto',
    queTrae: 'Las comidas registradas con cantidades informadas que no coinciden con la opción indicada, comprobado ingrediente por ingrediente.',
    deLaLinea: true,
  },
  {
    clave: 'SIN_CONFIRMAR',
    nombre: 'Sin confirmar',
    icono: 'sin-confirmar',
    queTrae: 'Las comidas registradas con las cantidades sin confirmar. Siguen sin confirmar: no se completan con las porciones del plan.',
    deLaLinea: true,
  },
  {
    clave: 'COMIDA_DIFERENTE',
    nombre: 'Comida diferente',
    icono: 'desvio',
    queTrae: 'Las comidas en las que la persona registró algo que no es una opción del plan. No cuenta como comida registrada ni reemplaza a la indicada.',
    deLaLinea: false,
  },
  {
    clave: 'SIN_REGISTRO',
    nombre: 'Sin registro',
    icono: null,
    queTrae: 'Las comidas del plan sin ningún registro. No es un cero: no hay dato de esa comida, y no se interpreta.',
    deLaLinea: false,
  },
];

/** Si una fila entra en una vista. Las tres vistas de estado parten a «Todas»; las otras dos son rasgos de las registradas. */
export function filaEnLaVista(f: FilaDeRegistro, vista: ClaveDeVistaDeRegistros): boolean {
  switch (vista) {
    case 'TODAS':
      return true;
    case 'DISTINTAS':
      return registroDeLaOpcion(f)?.entrada?.quality.includes('QUANTITIES_DIFFER_FROM_PLAN') ?? false;
    case 'SIN_CONFIRMAR':
      return registroDeLaOpcion(f)?.entrada?.quality.includes('QUANTITIES_UNCONFIRMED') ?? false;
    case 'COMIDA_DIFERENTE':
      return f.registros.some((r) => r.clase === 'COMIDA_DIFERENTE');
    case 'SIN_REGISTRO':
      return f.estado === 'SIN_REGISTRO';
  }
}

/**
 * Cuántas filas trae cada vista, contadas sobre las filas que se muestran. Sin la lectura de la línea de tiempo, las dos
 * vistas que dependen de ella no tienen número (`null`): un cero sería decir que no hay ninguna.
 */
export function contarLasVistas(dias: readonly DiaDeRegistros[], conLaLinea: boolean): Readonly<Record<ClaveDeVistaDeRegistros, number | null>> {
  const filas = dias.flatMap((d) => d.filas);
  const cuenta = (v: VistaDeRegistros): number | null => (v.deLaLinea && !conLaLinea ? null : filas.filter((f) => filaEnLaVista(f, v.clave)).length);
  return Object.fromEntries(VISTAS_DE_REGISTROS.map((v) => [v.clave, cuenta(v)])) as Record<ClaveDeVistaDeRegistros, number | null>;
}

/** Los días que no aportan filas del plan y por qué: no se cuentan en ninguna vista, y la pantalla lo dice. */
export function diasSinComidasDelPlan(dias: readonly DiaDeRegistros[]): { readonly sinPlan: number; readonly sinDiaTipo: number } {
  return { sinPlan: dias.filter((d) => d.sinComidasDelPlan === 'SIN_PLAN').length, sinDiaTipo: dias.filter((d) => d.sinComidasDelPlan === 'SIN_DIA_TIPO').length };
}

// ─── El día en un renglón ───────────────────────────────────────────────────────────────────────────────────

export interface ResumenDeUnDia {
  /** «3 de 4 comidas con registro», «Sin registro», o por qué el día no tiene comidas del plan. */
  readonly principal: string;
  /** Lo que el día tiene de distinto, con el rasgo que lo dibuja; `rasgo: null` es texto llano. */
  readonly notas: readonly { readonly rasgo: RasgoDeUnHecho | null; readonly texto: string }[];
}

const comidas = (n: number): string => (n === 1 ? 'comida' : 'comidas');

/**
 * El día dicho en un renglón, con el mismo conteo que Analizar y la exportación (DL-153, criterios de Dirección del
 * 2026-10-24). «N de M comidas con registro» cuenta las comidas del plan que tienen registro, sea la opción del plan o una
 * comida diferente registrada en ella. Cada comida está en un solo estado, y una comida diferente registrada fuera de las
 * comidas del plan no cubre ninguna. Si alguna tiene una comida diferente, una nota dice cuántas tienen la opción del
 * plan: tener registro no es cumplir el plan. Un día sin ningún registro dice «Sin registro», nunca «0 de M».
 */
export function resumenDeUnDia(d: DiaDeRegistros, conLaLinea: boolean): ResumenDeUnDia {
  const delPlan = d.filas.filter((f) => f.comida !== null);
  const registradas = delPlan.filter((f) => f.estado === 'REGISTRADA');
  const conComidaDiferente = delPlan.filter((f) => f.estado === 'COMIDA_DIFERENTE').length;
  const sinRegistro = delPlan.filter((f) => f.estado === 'SIN_REGISTRO').length;
  const diferentes = d.filas.filter((f) => filaEnLaVista(f, 'COMIDA_DIFERENTE')).length;
  const notaDeDiferentes = diferentes > 0 ? [{ rasgo: 'COMIDA_DIFERENTE' as const, texto: rasgoDeVariasComidas('COMIDA_DIFERENTE', diferentes) }] : [];
  if (d.sinComidasDelPlan !== null) {
    return {
      principal: d.sinComidasDelPlan === 'SIN_PLAN' ? 'Ese día no había un plan vigente.' : 'El plan tiene más de un día tipo y ese día no hay registros que indiquen cuál correspondía.',
      notas: notaDeDiferentes,
    };
  }
  if (d.sinRegistros) return { principal: 'Sin registro', notas: [{ rasgo: null, texto: `${delPlan.length} ${comidas(delPlan.length)} en el plan` }] };
  const notas: { rasgo: RasgoDeUnHecho | null; texto: string }[] = [];
  // El desglose, cuando no todas las que tienen registro son la opción del plan.
  if (conComidaDiferente > 0) notas.push({ rasgo: null, texto: `${registradas.length === 0 ? 'ninguna' : registradas.length} con opción del plan` });
  notas.push(...notaDeDiferentes);
  if (conLaLinea) {
    const distintas = d.filas.filter((f) => filaEnLaVista(f, 'DISTINTAS')).length;
    const sinConfirmar = d.filas.filter((f) => filaEnLaVista(f, 'SIN_CONFIRMAR')).length;
    if (distintas > 0) notas.push({ rasgo: 'DISTINTO_DE_LO_INDICADO', texto: rasgoDeVariasComidas('DISTINTO_DE_LO_INDICADO', distintas) });
    if (sinConfirmar > 0) notas.push({ rasgo: 'SIN_CONFIRMAR', texto: rasgoDeVariasComidas('SIN_CONFIRMAR', sinConfirmar) });
  }
  if (sinRegistro > 0) notas.push({ rasgo: null, texto: `${sinRegistro} sin registro` });
  // Solo si es cierto de todas: cada comida del plan tiene su opción registrada, con las porciones del plan confirmadas.
  if (conLaLinea && notas.length === 0 && registradas.length === delPlan.length && registradas.every((f) => registroDeLaOpcion(f)?.entrada?.quality.includes('QUANTITIES_FROM_PLAN'))) {
    notas.push({ rasgo: null, texto: registradas.length === 1 ? 'con las porciones del plan' : 'todas con las porciones del plan' });
  }
  const conRegistro = registradas.length + conComidaDiferente;
  return {
    principal: conRegistro === 0 ? COPY_REGISTRO_PARA_EL_PROFESIONAL.ningunaComidaDelPlanConRegistro : `${conRegistro} de ${delPlan.length} ${comidas(delPlan.length)} con registro`,
    notas,
  };
}

/**
 * Si un día arranca abierto: tiene una comida diferente o algo distinto de lo indicado. Los demás van en un renglón, con
 * sus cuentas, y se abren a pedido: plegar no esconde.
 */
export function diaAbiertoAlEntrar(d: DiaDeRegistros): boolean {
  return d.filas.some((f) => filaEnLaVista(f, 'COMIDA_DIFERENTE') || filaEnLaVista(f, 'DISTINTAS') || f.diferencias.length > 0);
}
