/**
 * Un hecho de la línea de tiempo en un renglón (WP-ESCRITORIO-AMABLE, parte 4): qué es, lo que lo distingue de otros del
 * mismo nombre y, si es una comida, cómo se registraron sus cantidades. Lógica pura, sin React: la usan el renglón, el
 * detalle al costado y sus pruebas (`scripts/hecho-en-un-renglon.test.mjs`).
 *
 * Todo sale de la entrada que ya entrega API-DSH-04: el título («Comida registrada · Almuerzo»), los detalles que arma la
 * API («Opción», «Series con datos»…) y los rasgos. Nada se calcula ni se completa. Si la API cambia un título o el
 * rótulo de un detalle, el renglón no inventa: cae en el título entero y en el primer detalle.
 */
import { NOMBRE_DEL_RASGO, normalizarTexto, rasgosDeUnHecho, type EntradaDeLineaDeTiempo, type NombreDeIcono, type RasgoDeUnHecho } from '@be/domain';

export interface RenglonDelHecho {
  readonly icono: NombreDeIcono;
  /** Qué es: «Almuerzo», «Sesión A · Tren inferior», «Toma antropométrica». */
  readonly nombre: string;
  /** Lo que lo distingue: la opción elegida, cuántas series tienen datos, el resultado de la revisión. `null` si no hay. */
  readonly dato: string | null;
  /** El modo de registro de las cantidades, si es de los de siempre (los otros son rasgos y van como etiqueta). */
  readonly modo: { readonly icono: NombreDeIcono; readonly texto: string } | null;
}

const detalle = (e: EntradaDeLineaDeTiempo, rotulo: string): string | null => e.details.find((d) => d.label === rotulo)?.value ?? null;
/** «Comida registrada · Almuerzo» → «Almuerzo». Si el título no trae esa forma, entero. */
const despuesDelTipo = (titulo: string): string => {
  const corte = titulo.indexOf(' · ');
  return corte < 0 ? titulo : titulo.slice(corte + 3);
};
const sinRegistrada = (titulo: string): string => titulo.replace(/ registrad[ao]$/, '');
const contar = (valor: string | null, uno: string, varios: string): string | null => {
  if (valor === null || !/^\d+$/.test(valor)) return null;
  return `${valor} ${valor === '1' ? uno : varios}`;
};
const primerDetalle = (e: EntradaDeLineaDeTiempo): string | null => (e.details[0] ? `${e.details[0].label}: ${e.details[0].value}` : null);

export function renglonDelHecho(e: EntradaDeLineaDeTiempo): RenglonDelHecho {
  switch (e.eventType) {
    case 'MEAL_RECORDED': {
      const opcion = detalle(e, 'Opción');
      // «2 · Tostadas con queso» → «Tostadas con queso»; una opción sin nombre («2») se dice «Opción 2».
      const dato = opcion === null ? detalle(e, 'Descripción') : /^\d+$/.test(opcion) ? `Opción ${opcion}` : opcion.replace(/^\d+ · /, '');
      const modo = e.quality.includes('QUANTITIES_FROM_PLAN')
        ? ({ icono: 'plan', texto: 'Porciones del plan' } as const)
        : e.quality.includes('QUANTITIES_REPORTED')
          ? ({ icono: 'a-mano', texto: 'Cantidades informadas' } as const)
          : null;
      return { icono: 'nutricion', nombre: despuesDelTipo(e.title), dato, modo };
    }
    case 'TRAINING_SESSION_RECORDED': {
      // El nombre de la sesión lo escribe el profesional en el plan: si ya empieza con «Sesión», no se le antepone otra.
      const corte = e.title.indexOf(' · ');
      const etiqueta = corte < 0 ? null : e.title.slice(corte + 3);
      const nombre = etiqueta === null ? e.title : /^sesi[oó]n\b/i.test(etiqueta) ? etiqueta : `Sesión ${etiqueta}`;
      // Son las series que tienen algún dato (carga, repeticiones o esfuerzo), no todas las de la sesión.
      return { icono: 'entrenamiento', nombre, dato: contar(detalle(e, 'Series con datos'), 'serie con datos', 'series con datos'), modo: null };
    }
    case 'ANTHROPOMETRIC_EVALUATION_RECORDED':
      return { icono: 'antropometria', nombre: sinRegistrada(e.title), dato: contar(detalle(e, 'Mediciones vigentes'), 'medición', 'mediciones') ?? primerDetalle(e), modo: null };
    case 'NUTRITION_REVIEW_RECORDED':
    case 'TRAINING_REVIEW_RECORDED': {
      const resultado = detalle(e, 'Resultado');
      return { icono: 'revision', nombre: sinRegistrada(e.title), dato: resultado ? `Resultado: ${resultado}` : primerDetalle(e), modo: null };
    }
    case 'NUTRITION_PLAN_ACTIVATED':
    case 'TRAINING_PLAN_ACTIVATED': {
      const anterior = detalle(e, 'Reemplaza a');
      return { icono: 'plan', nombre: e.title, dato: anterior ? `Reemplaza a ${anterior}` : detalle(e, 'Primera versión activada') ? 'Primera versión activada' : null, modo: null };
    }
    case 'NUTRITION_OBJECTIVE_SET':
    case 'TRAINING_OBJECTIVE_SET':
      return { icono: 'objetivo', nombre: e.title, dato: detalle(e, 'Requerimiento energético estimado') ?? detalle(e, 'Objetivo'), modo: null };
    case 'FOLLOW_UP_OPENED':
    case 'FOLLOW_UP_CLOSED': {
      const motivo = detalle(e, 'Motivo');
      return { icono: 'seguimiento', nombre: e.title, dato: motivo ? `Motivo: ${motivo}` : null, modo: null };
    }
  }
}

/** El título del detalle: el nombre y lo que lo distingue («Almuerzo · Arroz con pollo y brócoli»). */
export const tituloDelHecho = (e: EntradaDeLineaDeTiempo): string => {
  const r = renglonDelHecho(e);
  // El dato de una comida es su opción o su descripción: nombra al registro. El de los demás es una cuenta o un resultado.
  return e.eventType === 'MEAL_RECORDED' && r.dato ? `${r.nombre} · ${r.dato}` : r.nombre;
};

/**
 * El número de la versión de un plan activado, para abrir su planificación con el número que le corresponde. Sale del
 * detalle «Versión» de la entrada o, si faltara, del título («… · versión 2»). Sin número, `undefined`.
 */
export function numeroDeVersionDe(e: EntradaDeLineaDeTiempo): number | undefined {
  if (e.eventType !== 'NUTRITION_PLAN_ACTIVATED' && e.eventType !== 'TRAINING_PLAN_ACTIVATED') return undefined;
  const escrito = detalle(e, 'Versión') ?? /versión (\d+)$/.exec(e.title)?.[1] ?? null;
  return escrito !== null && /^\d+$/.test(escrito) ? Number(escrito) : undefined;
}

/** «Frente a lo indicado» de una comida con cantidades informadas: lo que BE comprobó, en palabras del dominio. */
export const frenteALoIndicadoDe = (e: EntradaDeLineaDeTiempo): string | null => detalle(e, 'Frente a lo indicado');

/**
 * Con un texto buscado, por qué coincide un hecho cuando su renglón no lo dice. La búsqueda de API-DSH-04 mira el título,
 * todos los detalles y las relaciones; el renglón muestra solo algunos. Devuelve el primer detalle (o la relación) que
 * tiene una palabra buscada que no está a la vista, o `null` si el renglón ya lo dice todo o coincide por su tipo.
 */
export function dondeCoincide(e: EntradaDeLineaDeTiempo, buscado: string): string | null {
  const palabras = normalizarTexto(buscado).split(' ').filter(Boolean);
  if (palabras.length === 0) return null;
  const r = renglonDelHecho(e);
  const aLaVista = normalizarTexto([r.nombre, r.dato ?? '', r.modo?.texto ?? '', ...rasgosDeUnHecho(e).map((x) => NOMBRE_DEL_RASGO[x])].join(' '));
  // Solo las palabras que el renglón no dice: sin ninguna, no hay nada que agregar.
  const faltan = palabras.filter((p) => !aLaVista.includes(p));
  const enDetalle = e.details.find((d) => faltan.some((p) => normalizarTexto(`${d.label} ${d.value}`).includes(p)));
  if (enDetalle) return `${enDetalle.label}: ${enDetalle.value}`;
  return e.relations.find((x) => faltan.some((p) => normalizarTexto(x.label).includes(p)))?.label ?? null;
}

/** Cada rasgo con su ícono de la familia (`CATALOGO.md`): el desvío es el mismo en Nutrición y en Entrenamiento. */
export const ICONO_DEL_RASGO: Readonly<Record<RasgoDeUnHecho, NombreDeIcono>> = {
  SIN_CONFIRMAR: 'sin-confirmar',
  DISTINTO_DE_LO_INDICADO: 'distinto',
  COMIDA_DIFERENTE: 'desvio',
  SESION_CON_CAMBIOS: 'desvio',
  SESION_NO_REALIZADA: 'salteada',
  SESION_RESUMIDA: 'texto',
  ANULADO: 'anulado',
  RECTIFICADO: 'corregido',
  CORREGIDO: 'corregido',
  CARGADO_OTRO_DIA: 'cargado-otro-dia',
};

type ClaseDeRelacion = EntradaDeLineaDeTiempo['relations'][number]['kind'];

/** Lo que una relación con fecha le hizo al registro, como va en el detalle: «Se rectificó», «Se anuló». */
export const VERBO_DE_LA_RELACION: Readonly<Partial<Record<ClaseDeRelacion, string>>> = {
  RECTIFIED: 'Se rectificó',
  ANNULLED: 'Se anuló',
  CORRECTED: 'Se corrigió',
  MEASUREMENT_CORRECTED: 'Se corrigió una medición',
  MEASUREMENT_ANNULLED: 'Se anuló una medición',
};

export interface CambioDelRegistro {
  readonly clase: ClaseDeRelacion;
  /** «Se rectificó» · «Se corrigieron 3 mediciones». */
  readonly verbo: string;
  /** El instante del cambio; si fueron varios de la misma clase, el del último. */
  readonly instante: string;
  readonly cuantos: number;
}

/**
 * Lo que le pasó al registro después de hecho, una vez por clase de cambio: una toma puede traer decenas de mediciones
 * corregidas, y en el detalle se dicen juntas («Se corrigieron 3 mediciones»), con la fecha de la última.
 */
export function cambiosDelRegistro(e: EntradaDeLineaDeTiempo): CambioDelRegistro[] {
  const porClase = new Map<ClaseDeRelacion, { instante: string; cuantos: number }>();
  for (const r of e.relations) {
    if (r.at === null || !VERBO_DE_LA_RELACION[r.kind]) continue;
    const previo = porClase.get(r.kind);
    porClase.set(r.kind, { instante: previo && Date.parse(previo.instante) > Date.parse(r.at) ? previo.instante : r.at, cuantos: (previo?.cuantos ?? 0) + 1 });
  }
  return [...porClase].map(([clase, c]) => ({
    clase,
    verbo:
      c.cuantos === 1
        ? (VERBO_DE_LA_RELACION[clase] as string)
        : clase === 'MEASUREMENT_CORRECTED'
          ? `Se corrigieron ${c.cuantos} mediciones`
          : clase === 'MEASUREMENT_ANNULLED'
            ? `Se anularon ${c.cuantos} mediciones`
            : `${VERBO_DE_LA_RELACION[clase]} ${c.cuantos} veces`,
    instante: c.instante,
    cuantos: c.cuantos,
  }));
}

/**
 * Los días sin ningún hecho entre dos días de la lista, en palabras: «9 oct: sin hechos registrados», «8 y 9 oct: sin
 * hechos registrados» o «Del 5 al 9 oct: 5 días sin hechos registrados». `fecha` escribe una fecha civil como la pantalla
 * («9 oct»); si las dos puntas son del mismo mes, el mes se dice una vez.
 */
export function textoDelHueco(h: { readonly desde: string; readonly hasta: string; readonly dias: number }, fecha: (civil: string) => string): string {
  if (h.dias === 1) return `${fecha(h.desde)}: sin hechos registrados`;
  const primero = h.desde.slice(0, 7) === h.hasta.slice(0, 7) ? String(Number(h.desde.slice(8, 10))) : fecha(h.desde);
  return h.dias === 2 ? `${primero} y ${fecha(h.hasta)}: sin hechos registrados` : `Del ${primero} al ${fecha(h.hasta)}: ${h.dias} días sin hechos registrados`;
}

/** Las relaciones del hecho en palabras, sin repetir: «Medición corregida (3)». */
export function relacionesEnPalabras(e: EntradaDeLineaDeTiempo): string[] {
  const cuenta = new Map<string, number>();
  for (const r of e.relations) cuenta.set(r.label, (cuenta.get(r.label) ?? 0) + 1);
  return [...cuenta].map(([texto, n]) => (n === 1 ? texto : `${texto} (${n})`));
}
