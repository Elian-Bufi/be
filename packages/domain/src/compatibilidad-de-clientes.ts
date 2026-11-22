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
import { tieneCalentamiento, type ConTipoDeSerie } from './tipos-de-serie';

type Carga = z.infer<typeof CargaSchema>;

/** La cabecera con la que un cliente declara lo que sabe mostrar: capacidades separadas por comas. */
export const HEADER_DE_CAPACIDADES = 'X-BE-Capabilities';

/** El cliente muestra el objetivo de cada serie (API-SER-02) y nunca los generales como si fueran los de la serie. */
export const CAPACIDAD_OBJETIVOS_POR_SERIE = 'training-set-targets-1';

/**
 * DL-165 (WP-FORMULARIOS-RONDA-2, FR-08) · el cliente lee y dibuja las versiones de formulario de formato 3: el subcampo
 * de varias opciones en un renglón y lo demás que suma la ronda 2 (`loQueUsaDelFormato3`). Sin la capacidad (la APK 0.20
 * y las anteriores), una versión de formato 3 y sus solicitudes son, para ese pedido, el 404 de lo inexistente, y FRI-02
 * no las lista. La declaran la APK nueva y el website, que se despliega con la API.
 */
export const CAPACIDAD_FORMULARIOS_FORMATO_3 = 'forms-format-3';

/**
 * UF-05 de WP-USO-FINAL (DL-169; UF-D4) · el cliente sabe mostrar, en «Antes de seguir», la versión nueva de los términos y
 * de la información de privacidad (los pasos ACCEPT_TERMS y ACKNOWLEDGE_PRIVACY de API-ACC-07) y aceptarla con
 * API-ACC-08. API-ACC-07 no le pide esos pasos a un cliente que no la declara: la APK 0.24 pediría actualizar ante un paso
 * que no conoce (UF-T12). La declaran el website, que se despliega con la API, y la APK nueva.
 */
export const CAPACIDAD_TEXTOS_VIGENTES = 'pending-steps-texts-1';

/**
 * DL-178 · el cliente distingue las series de calentamiento: las muestra como «Calentamiento», las registra con
 * `setKind: WARM_UP` y no las cuenta. Solo a quien la declara le salen las series con `setKind` explícito; a quien no, con
 * la forma de siempre (su esquema estricto rechazaría el campo). Un plan con calentamiento no se le entrega a un cliente
 * sin la capacidad (lo vería todo efectivo y lo registraría así) y no se activa mientras el titular no haya usado uno
 * que la declare, igual que los objetivos por serie. La declaran el website, que se despliega con la API, y la APK nueva.
 */
export const CAPACIDAD_TIPOS_DE_SERIE = 'training-set-kinds-1';

/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION, ENP-D06) · el cliente sabe mostrar los bloques de la sesión: lee `exerciseGroups`
 * de cada sesión y `exerciseGroupId` de cada ejercicio y agrupa los ejercicios bajo su bloque. Solo a quien la declara le
 * salen las dos claves; a quien no, `SinBloquesDeLaSesionInterceptor` se las saca en el borde (su esquema estricto las
 * rechazaría) y recibe lo de antes: los mismos ejercicios en el mismo orden. A diferencia de DL-178, nada se retiene ni se
 * bloquea: el registro sigue siendo por ejercicio y nada se cuenta distinto. Por eso no se registra. La declaran el
 * website, que se despliega con la API, y la APK nueva.
 */
export const CAPACIDAD_BLOQUES_DE_LA_SESION = 'training-session-groups-1';

/**
 * DL-192 (WP-RPE-Y-MAXIMO-ESTIMADO, RPE-D08) · el cliente sabe preguntar y mostrar el esfuerzo en la notación del plan (RIR
 * o RPE): lee `effortNotation` de la versión (API-TRN-09) y de la sesión para registrar (API-SER-02), y sigue mandando el
 * RIR, que es el valor de las dos. Solo a quien la declara le sale el campo; a quien no, la forma de siempre (su esquema
 * estricto lo rechazaría). Nada se retiene ni se bloquea: una APK que pregunta en RIR guarda lo mismo que una que pregunta
 * en RPE. Por eso no se registra. La declara la APK 0.32 (DL-194).
 */
export const CAPACIDAD_NOTACION_DEL_ESFUERZO = 'training-effort-notation-1';

export const CAPACIDADES_CONOCIDAS = [
  CAPACIDAD_OBJETIVOS_POR_SERIE,
  CAPACIDAD_FORMULARIOS_FORMATO_3,
  CAPACIDAD_TEXTOS_VIGENTES,
  CAPACIDAD_TIPOS_DE_SERIE,
  CAPACIDAD_BLOQUES_DE_LA_SESION,
  CAPACIDAD_NOTACION_DEL_ESFUERZO,
] as const;
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

/**
 * RP-22 (DL-188): lo que no se entiende todavía no es un objetivo distinto. En el editor, un número mal escrito viaja como
 * NaN (no se guarda: `loQueNoDejaGuardarElEntrenamiento`), y las series que lo toman de lo general también lo tienen; con
 * `===`, NaN nunca es igual a NaN, y una carga común mal escrita pasaba por «objetivos distintos por serie»: aparecía
 * arriba el aviso de la app de la persona y corría el editor mientras se escribía.
 */
const sinLeer = (n: number | null | undefined): boolean => typeof n === 'number' && Number.isNaN(n);
const mismaCarga = (a: Carga | null, b: Carga | null): boolean =>
  a === null || b === null ? a === b : (a.value === b.value && a.unit === b.unit) || sinLeer(a.value) || sinLeer(b.value);
const mismoRir = (a: number | null, b: number | null): boolean => a === b || sinLeer(a) || sinLeer(b);

/**
 * Si una prescripción exige un cliente que muestre los objetivos por serie: alguna serie tiene un RIR o una carga
 * efectivos distintos de los generales, que es lo único que muestra una APK anterior.
 */
export function prescripcionExigeObjetivosPorSerie(prescripcion: PrescripcionParaResolver): boolean {
  const rirGeneral = esCriterioRir(prescripcion.intensity) ? prescripcion.intensity!.target.value : null;
  const cargaGeneral = prescripcion.suggestedLoad ?? null;
  return objetivosEfectivos(prescripcion).some((o) => !mismoRir(o.rir, rirGeneral) || !mismaCarga(o.suggestedLoad, cargaGeneral));
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

interface SesionConSeries {
  readonly prescriptions: readonly { readonly sets: readonly ConTipoDeSerie[] }[];
}
interface EstructuraConSeries {
  readonly blocks: readonly { readonly sessions?: readonly SesionConSeries[] | null; readonly microcycles?: readonly { readonly sessions?: readonly SesionConSeries[] | null }[] | null }[];
}

/** DL-178: si alguna serie de un plan es de calentamiento. Un plan así queda para clientes que las distinguen. */
export function planTieneCalentamiento(estructura: EstructuraConSeries): boolean {
  return estructura.blocks.some((b) =>
    [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions ?? [])].some((s) => s.prescriptions.some((p) => tieneCalentamiento(p.sets))),
  );
}

/** Lo que se le dice al profesional cuando no puede activar un plan por la versión de la app de su asesorado. */
export const COPY_COMPATIBILIDAD_DE_CLIENTES = {
  activacionBloqueadaTitulo: 'Todavía no podés activar este plan',
  activacionBloqueada:
    'Este plan tiene objetivos distintos en algunas series, y tu asesorado todavía no usó una versión de BE que los muestre. Con la versión que tiene vería los valores generales de cada ejercicio, que no son los de esas series.',
  queHacer:
    'Podés activarlo cuando la persona abra Entrenamiento con BE actualizada, o dejar los mismos objetivos en todas las series de cada ejercicio para activarlo ahora.',
  listoParaActivar: 'La persona ya usa una versión de BE que muestra los objetivos de cada serie.',
} as const;
