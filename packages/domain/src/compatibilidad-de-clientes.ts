/**
 * Qué clientes pueden recibir un plan con objetivos por serie (DL-122; precierre del 2026-10-06, §2).
 *
 * **Las APK instaladas no saben mostrarlos.** La 0.13.2 (versionCode 22) y las candidatas 0.14.0 (23 y 24) leen la
 * prescripción con su forma de siempre: la intensidad y la carga sugerida generales, no las de cada serie. Sus contratos
 * de entrenamiento son idénticos, y ninguna muestra un texto que mande el servidor: cada fallo se traduce a un mensaje
 * neutro. No hay forma de decirles «Actualizá BE» sin romperlas. Por eso, en lugar de un aviso:
 * - **El cliente declara lo que sabe mostrar** con la cabecera `X-BE-Capabilities`. Sin la cabecera (las APK instaladas,
 *   o un cliente que no declara versión), no sabe mostrar objetivos por serie. La capacidad no se infiere ni se finge:
 *   solo la declara la APK que dibuja los objetivos de cada serie.
 * - **Un plan exige objetivos por serie** si alguna serie tiene un RIR o una carga efectivos distintos de los generales
 *   de su prescripción: lo que una APK anterior mostraría como objetivo de esa serie sería otro. El descanso y las bases
 *   de carga y de repeticiones no cuentan: una APK anterior no los muestra, así que no muestra uno equivocado.
 * - **Un plan así no se activa** mientras su titular no haya usado un cliente capaz (la API lo registra), y **no se
 *   entrega** a un cliente sin la capacidad: «Hoy» lo informa como no disponible y el detalle es el 404 no revelador.
 *   Los planes sin objetivos por serie y el historial siguen como siempre.
 */
import type { z } from 'zod';
import type { CargaSchema } from './contratos-entrenamiento';
import { esCriterioRir, objetivosEfectivos, type PrescripcionParaResolver } from './objetivos-por-serie';

type Carga = z.infer<typeof CargaSchema>;

/** La cabecera con la que un cliente declara lo que sabe mostrar: capacidades separadas por comas. */
export const HEADER_DE_CAPACIDADES = 'X-BE-Capabilities';

/** El cliente muestra el objetivo de cada serie (API-SER-02) y nunca los generales como si fueran los de la serie. */
export const CAPACIDAD_OBJETIVOS_POR_SERIE = 'training-set-targets-1';

export const CAPACIDADES_CONOCIDAS = [CAPACIDAD_OBJETIVOS_POR_SERIE] as const;
export type CapacidadDeCliente = (typeof CAPACIDADES_CONOCIDAS)[number];

/** Un valor de cabecera más largo que esto no se lee: ninguna lista válida lo necesita. */
const LARGO_MAXIMO_DE_LA_CABECERA = 256;

/**
 * Las capacidades que declara un pedido. Sin cabecera, vacía. Lo desconocido se ignora: un cliente futuro puede declarar
 * más de lo que esta API sabe, y eso no le da nada que no pidió.
 */
export function capacidadesDeclaradas(valor: string | readonly string[] | null | undefined): ReadonlySet<CapacidadDeCliente> {
  const texto = Array.isArray(valor) ? valor.join(',') : (valor as string | null | undefined);
  if (typeof texto !== 'string' || texto.length === 0 || texto.length > LARGO_MAXIMO_DE_LA_CABECERA) return new Set();
  const conocidas = new Set<string>(CAPACIDADES_CONOCIDAS);
  return new Set(
    texto
      .split(',')
      .map((c) => c.trim())
      .filter((c): c is CapacidadDeCliente => conocidas.has(c)),
  );
}

/** El valor de la cabecera para un cliente que declara estas capacidades. */
export const valorDeCapacidades = (capacidades: readonly CapacidadDeCliente[]): string => [...new Set(capacidades)].join(',');

const mismaCarga = (a: Carga | null, b: Carga | null): boolean => (a === null || b === null ? a === b : a.value === b.value && a.unit === b.unit);

/**
 * Si una prescripción exige un cliente que muestre los objetivos por serie: alguna serie tiene un RIR o una carga
 * efectivos distintos de los generales, que es lo único que muestra una APK anterior.
 */
export function prescripcionExigeObjetivosPorSerie(prescripcion: PrescripcionParaResolver): boolean {
  const rirGeneral = esCriterioRir(prescripcion.intensity) ? prescripcion.intensity!.target.value : null;
  const cargaGeneral = prescripcion.suggestedLoad ?? null;
  return objetivosEfectivos(prescripcion).some((o) => o.rir !== rirGeneral || !mismaCarga(o.suggestedLoad, cargaGeneral));
}

interface SesionConPrescripciones {
  readonly prescriptions: readonly PrescripcionParaResolver[];
}
interface EstructuraConSesiones {
  readonly blocks: readonly { readonly sessions?: readonly SesionConPrescripciones[] | null; readonly microcycles?: readonly { readonly sessions?: readonly SesionConPrescripciones[] | null }[] | null }[];
}

/** Si alguna prescripción de un plan exige objetivos por serie: el plan entero queda para clientes capaces. */
export function planExigeObjetivosPorSerie(estructura: EstructuraConSesiones): boolean {
  return estructura.blocks.some((b) =>
    [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions ?? [])].some((s) => s.prescriptions.some(prescripcionExigeObjetivosPorSerie)),
  );
}

/** Lo que se le dice al profesional cuando no puede activar un plan por la versión de la app de su asesorado. */
export const COPY_COMPATIBILIDAD_DE_CLIENTES = {
  activacionBloqueadaTitulo: 'Todavía no podés activar este plan',
  activacionBloqueada:
    'Este plan tiene objetivos distintos en algunas series, y tu asesorado todavía no usó una versión de BE que los muestre. Con la versión que tiene vería los valores generales de cada ejercicio, que no son los de esas series.',
  queHacer:
    'Podés activarlo cuando tu asesorado abra Entrenamiento con BE actualizada, o dejar los mismos objetivos en todas las series de cada ejercicio para activarlo ahora.',
  listoParaActivar: 'Tu asesorado ya usa una versión de BE que muestra los objetivos de cada serie.',
} as const;
