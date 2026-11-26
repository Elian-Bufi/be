/**
 * DL-195 (WP-RECORRIDOS-GUIADOS; pedido de Dirección del 2026-11-23): los recorridos guiados del espacio profesional.
 * «Como en las buenas apps, un tutorial para las primeras veces que se usan las interfaces, mostrando sección por sección
 * cuál es el flujo»: todo se oscurece menos la zona que se explica, y un cartel corto dice qué es y cómo se usa.
 *
 * Acá vive lo que no depende de la pantalla, para probarlo sin navegador:
 * - **El contrato** de API-RGU-01 y 02 (familia propia RGU): qué recorridos vio u omitió cada usuario. Es una preferencia
 *   de la pantalla, sin datos de salud; la recuerda la API **por usuario** (GUI-D03), así no vuelve a aparecer en otra
 *   computadora.
 * - **Los pasos** de cada recorrido, con sus textos y las anclas (`data-recorrido`) que buscan en la pantalla.
 * - **La lógica de los pasos**: qué paso existe (un ancla que no está se saltea), moverse, cuándo aparece solo.
 * - **Dónde va el cartel**: al lado del hueco iluminado, sin taparlo y adentro de la ventana.
 */
import { z } from 'zod';
import { Instante } from './contratos';

// ─── El contrato (API-RGU-01 y 02) ──────────────────────────────────────────────────────────────────────────────────────

/** Los recorridos que existen. Un identificador por interfaz, en la ruta: `PUT /me/guided-tours/{tourId}`. */
export const RECORRIDOS_GUIADOS = ['training-plan-editor', 'nutrition-plan-editor'] as const;
export type RecorridoGuiado = (typeof RECORRIDOS_GUIADOS)[number];
export const RecorridoGuiadoSchema = z.enum(RECORRIDOS_GUIADOS);

/** Cómo terminó: `SEEN`, llegó al último paso y tocó «Terminar»; `SKIPPED`, lo omitió. Los dos lo dan por visto (GUI-D04). */
export const ESTADOS_DEL_RECORRIDO = ['SEEN', 'SKIPPED'] as const;
export type EstadoDelRecorrido = (typeof ESTADOS_DEL_RECORRIDO)[number];
export const EstadoDelRecorridoSchema = z.enum(ESTADOS_DEL_RECORRIDO);

export const RecorridoVistoSchema = z.strictObject({
  tourId: RecorridoGuiadoSchema,
  state: EstadoDelRecorridoSchema,
  updatedAt: Instante,
});
export type RecorridoVisto = z.infer<typeof RecorridoVistoSchema>;

/** API-RGU-01: los recorridos que el usuario de la sesión vio u omitió. Uno que no está, no lo vio. */
export const RecorridosVistosResponseSchema = z.strictObject({ data: z.array(RecorridoVistoSchema) });
export type RecorridosVistosResponse = z.infer<typeof RecorridosVistosResponseSchema>;

/** API-RGU-02: marcar uno. Repetirlo con el mismo estado no cambia nada (idempotente por semántica). */
export const MarcarRecorridoRequestSchema = z.strictObject({ state: EstadoDelRecorridoSchema });
export type MarcarRecorridoRequest = z.infer<typeof MarcarRecorridoRequestSchema>;
export const RecorridoVistoResponseSchema = z.strictObject({ data: RecorridoVistoSchema });
export type RecorridoVistoResponse = z.infer<typeof RecorridoVistoResponseSchema>;

export const esRecorridoGuiado = (x: unknown): x is RecorridoGuiado => typeof x === 'string' && (RECORRIDOS_GUIADOS as readonly string[]).includes(x);

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export const COPY_RECORRIDOS_GUIADOS = {
  verElRecorrido: 'Ver el recorrido',
  /** La palabra corta del botón cuando la barra no tiene lugar para la frase entera. */
  recorridoCorto: 'Recorrido',
  omitir: 'Omitir',
  anterior: 'Anterior',
  siguiente: 'Siguiente',
  terminar: 'Terminar',
  pasoDe: (n: number, de: number): string => `Paso ${n} de ${de}`,
  /** Para el lector de pantalla, al abrir: cómo se maneja con el teclado. */
  teclado: 'Con las flechas pasás de un paso a otro; con Escape lo omitís.',
  /** Dónde se vuelve a ver: lo dice el último paso y la Guía. */
  dondeVolver: '«Ver el recorrido», arriba a la derecha del editor, lo vuelve a mostrar.',
} as const;

// ─── Los pasos ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface PasoDelRecorrido {
  readonly id: string;
  /**
   * Los valores de `data-recorrido` que puede iluminar, en orden de preferencia: el primero que esté en la pantalla. Si
   * no está ninguno, el paso se saltea (GUI-05).
   */
  readonly anclas: readonly string[];
  readonly titulo: string;
  readonly texto: string;
}

export interface DefinicionDelRecorrido {
  readonly id: RecorridoGuiado;
  /** El nombre del recorrido, para el lector de pantalla. */
  readonly nombre: string;
  readonly pasos: readonly PasoDelRecorrido[];
}

/**
 * El editor del plan de Entrenamiento. Nombra las cosas como la pantalla: «Sesiones», «Agregar sesión», «Seguido», «En
 * vueltas», «Cómo se escribe el esfuerzo», «Agregar ejercicios», «Revisar y activar…».
 */
export const RECORRIDO_DEL_EDITOR_DE_ENTRENAMIENTO: DefinicionDelRecorrido = {
  id: 'training-plan-editor',
  nombre: 'Recorrido del editor del plan de Entrenamiento',
  pasos: [
    {
      id: 'sesiones',
      anclas: ['sesiones'],
      titulo: 'Sesiones y días',
      texto: 'Las sesiones de la fase, como tarjetas: tocá una para editarla. «Nueva sesión» suma otra; qué día va cada una se elige en «Días de la semana», arriba, en la misma fase.',
    },
    {
      id: 'bloques',
      anclas: ['bloque', 'agregar-bloque'],
      titulo: 'Bloques: «Seguido» y «En vueltas»',
      texto: 'Un bloque agrupa ejercicios con un título. «Seguido»: de a uno, como siempre. «En vueltas»: se alternan dos o más, con un descanso al terminar cada vuelta.',
    },
    {
      id: 'ejercicio',
      anclas: ['ejercicio'],
      titulo: 'El ejercicio y sus series',
      texto: 'Abrí el ejercicio para escribir cada serie: repeticiones, carga, descanso y el esfuerzo. La fila «Común» vale para las series que no tengan un valor propio.',
    },
    {
      id: 'esfuerzo',
      anclas: ['esfuerzo'],
      titulo: 'La intensidad del plan',
      texto: 'En «Configurar plan», una vez: RIR, RPE, un porcentaje del 1RM o solo carga y repeticiones. Cada ejercicio la hereda; uno puede tener otra en «Más opciones». RIR y RPE son la misma medida.',
    },
    {
      id: 'catalogo',
      anclas: ['agregar-ejercicio'],
      titulo: 'Agregar ejercicios',
      texto: 'Abre todo el catálogo: los ejercicios de BE y los tuyos. Buscá por ejercicio, músculo o equipo, o filtrá. Elegí varios y «Agregar a la sesión». Si no está, lo creás a mano.',
    },
    {
      id: 'revisar',
      anclas: ['revisar-y-activar'],
      titulo: 'Revisar y activar…',
      texto: 'Guardar no activa: la persona no ve esta versión. Acá ves lo que falta corregir y, cuando está lista, la activás.',
    },
  ],
};

/**
 * El editor del plan de Nutrición. Nombra las cosas como la pantalla: «Día tipo», las comidas y sus opciones, «Reparto
 * por comida», «Rangos y totales», «Opción de receta», el Recetario de BE y «Revisar y activar…».
 */
export const RECORRIDO_DEL_EDITOR_DE_NUTRICION: DefinicionDelRecorrido = {
  id: 'nutrition-plan-editor',
  nombre: 'Recorrido del editor del plan de Nutrición',
  pasos: [
    {
      id: 'dias-tipo',
      anclas: ['dias-tipo'],
      titulo: 'Días tipo y comidas',
      texto: 'Arriba elegís el día tipo que mirás; con «Agregar» sumás otro. Debajo van sus comidas, en el orden del día.',
    },
    {
      id: 'opciones',
      anclas: ['comida'],
      titulo: 'Opciones y alimentos',
      texto: 'Abrí una comida para ver sus opciones. Cada opción es una alternativa, con sus alimentos y cantidades: la persona elige una cuando registra.',
    },
    {
      id: 'reparto',
      anclas: ['reparto'],
      titulo: 'Reparto por comida',
      texto: 'Propone el rango de cada comida desde el objetivo del día. Después, las franjas de cada comida muestran sus opciones frente a ese rango, con una raya para el promedio.',
    },
    {
      id: 'rangos-y-totales',
      anclas: ['rangos-y-totales', 'panel-de-nutricion'],
      titulo: 'Rangos y totales',
      texto: 'El día y cada comida, con lo que aportan sus opciones frente al rango indicado. Se actualiza con cada cambio que escribís.',
    },
    {
      id: 'recetas',
      anclas: ['opcion-de-receta', 'comida'],
      titulo: 'Recetas y Recetario de BE',
      texto: '«Opción de receta» abre el cajón: tus recetas o el Recetario de BE. La que elegís queda como una opción de la comida.',
    },
    {
      id: 'revisar',
      anclas: ['revisar-y-activar'],
      titulo: 'Revisar y activar…',
      texto: 'Guardar no activa: la persona no ve esta versión. Acá ves lo que falta corregir y, cuando está lista, la activás.',
    },
  ],
};

export const DEFINICIONES_DE_RECORRIDOS: Readonly<Record<RecorridoGuiado, DefinicionDelRecorrido>> = {
  'training-plan-editor': RECORRIDO_DEL_EDITOR_DE_ENTRENAMIENTO,
  'nutrition-plan-editor': RECORRIDO_DEL_EDITOR_DE_NUTRICION,
};

// ─── La lógica de los pasos ─────────────────────────────────────────────────────────────────────────────────────────────

/** Un paso que se puede mostrar, con el ancla que encontró. */
export interface PasoPresente extends PasoDelRecorrido {
  readonly ancla: string;
}

/** El ancla que ilumina un paso: la primera que está. `null` si no hay ninguna (el paso se saltea). */
export function anclaDelPaso(paso: PasoDelRecorrido, esta: (ancla: string) => boolean): string | null {
  return paso.anclas.find(esta) ?? null;
}

/** Los pasos que se pueden mostrar ahora, en su orden, cada uno con su ancla. «Paso n de m» cuenta solo estos. */
export function pasosPresentes(pasos: readonly PasoDelRecorrido[], esta: (ancla: string) => boolean): PasoPresente[] {
  const presentes: PasoPresente[] = [];
  for (const p of pasos) {
    const ancla = anclaDelPaso(p, esta);
    if (ancla !== null) presentes.push({ ...p, ancla });
  }
  return presentes;
}

export type Movimiento = 'siguiente' | 'anterior';
/** Adónde lleva moverse: otro paso, o terminar (después del último). «Anterior» en el primero se queda en el primero. */
export type Destino = { readonly tipo: 'paso'; readonly indice: number } | { readonly tipo: 'fin' };

export function moverse(actual: number, total: number, movimiento: Movimiento): Destino {
  if (total <= 0) return { tipo: 'fin' };
  const desde = Math.min(Math.max(actual, 0), total - 1);
  if (movimiento === 'anterior') return { tipo: 'paso', indice: Math.max(desde - 1, 0) };
  return desde + 1 >= total ? { tipo: 'fin' } : { tipo: 'paso', indice: desde + 1 };
}

/**
 * Lo que se sabe de los recorridos vistos: todavía nada (no se dibuja nada hasta saber, así no aparece y se va), o la
 * lista. `deLaApi`: si la API respondió; si no, la lista es la del respaldo del navegador.
 */
export type SaberDeLosVistos = { readonly estado: 'leyendo' } | { readonly estado: 'listo'; readonly vistos: readonly RecorridoGuiado[]; readonly deLaApi: boolean };

/** Si el recorrido aparece solo al abrir la interfaz: solo cuando ya se sabe y no está entre los vistos u omitidos. */
export function apareceSolo(saber: SaberDeLosVistos, recorrido: RecorridoGuiado): boolean {
  return saber.estado === 'listo' && !saber.vistos.includes(recorrido);
}

/** Lo visto según la API más lo que guardó el navegador (lo que se marcó mientras la API no respondía). Sin repetidos. */
export function unirVistos(deLaApi: readonly RecorridoGuiado[], delNavegador: readonly RecorridoGuiado[]): RecorridoGuiado[] {
  return RECORRIDOS_GUIADOS.filter((r) => deLaApi.includes(r) || delNavegador.includes(r));
}

/** Lo que el navegador marcó y la API todavía no sabe: se le manda cuando vuelve a responder. */
export function pendientesDeMandar(deLaApi: readonly RecorridoGuiado[], delNavegador: readonly RecorridoGuiado[]): RecorridoGuiado[] {
  return delNavegador.filter((r) => !deLaApi.includes(r));
}

/** La clave del respaldo del navegador: por usuario, para que dos cuentas en la misma computadora no se pisen. */
export const claveDelRespaldo = (identidadId: string): string => `be:recorridos-vistos:${identidadId}`;

/** Lee el respaldo del navegador: una lista JSON de identificadores; lo que no se entiende se ignora. */
export function leerRespaldo(texto: string | null): RecorridoGuiado[] {
  if (!texto) return [];
  try {
    const v: unknown = JSON.parse(texto);
    return Array.isArray(v) ? RECORRIDOS_GUIADOS.filter((r) => v.includes(r)) : [];
  } catch {
    return [];
  }
}

// ─── Dónde va el cartel ─────────────────────────────────────────────────────────────────────────────────────────────────

export interface RectEnPantalla {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}
export interface MedidaEnPantalla {
  readonly ancho: number;
  readonly alto: number;
}
export type LadoDelCartel = 'abajo' | 'arriba' | 'derecha' | 'izquierda' | 'encima';
export interface UbicacionDelCartel {
  readonly top: number;
  readonly left: number;
  readonly lado: LadoDelCartel;
}

/** El hueco iluminado: el elemento con un margen alrededor, recortado a la ventana. */
export function huecoDe(elemento: RectEnPantalla, ventana: MedidaEnPantalla, relleno = 8): RectEnPantalla {
  const top = Math.max(elemento.top - relleno, 0);
  const left = Math.max(elemento.left - relleno, 0);
  const bottom = Math.min(elemento.top + elemento.height + relleno, ventana.alto);
  const right = Math.min(elemento.left + elemento.width + relleno, ventana.ancho);
  return { top, left, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) };
}

const acotar = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), Math.max(min, max));

/**
 * Dónde va el cartel: abajo del hueco si entra; si no, arriba; si no, a la derecha o a la izquierda. Siempre adentro de
 * la ventana, con `margen` del borde y del hueco. Si no entra en ningún costado (un hueco más alto y más ancho que lo
 * que deja la ventana), va abajo a la derecha de la ventana, `encima`: es el único caso en que tapa una parte del hueco.
 */
export function ubicarCartel(hueco: RectEnPantalla, cartel: MedidaEnPantalla, ventana: MedidaEnPantalla, margen = 12): UbicacionDelCartel {
  const maxLeft = ventana.ancho - cartel.ancho - margen;
  const maxTop = ventana.alto - cartel.alto - margen;
  const centroX = acotar(hueco.left + hueco.width / 2 - cartel.ancho / 2, margen, maxLeft);
  const centroY = acotar(hueco.top + hueco.height / 2 - cartel.alto / 2, margen, maxTop);
  const abajo = hueco.top + hueco.height + margen;
  if (abajo + cartel.alto + margen <= ventana.alto) return { top: abajo, left: centroX, lado: 'abajo' };
  const arriba = hueco.top - margen - cartel.alto;
  if (arriba >= margen) return { top: arriba, left: centroX, lado: 'arriba' };
  const derecha = hueco.left + hueco.width + margen;
  if (derecha + cartel.ancho + margen <= ventana.ancho) return { top: centroY, left: derecha, lado: 'derecha' };
  const izquierda = hueco.left - margen - cartel.ancho;
  if (izquierda >= margen) return { top: centroY, left: izquierda, lado: 'izquierda' };
  return { top: acotar(maxTop, margen, maxTop), left: acotar(maxLeft, margen, maxLeft), lado: 'encima' };
}

/** Si el elemento se ve entero en la ventana. Si no, se desplaza hasta él antes de iluminarlo. */
export function seVeEntero(elemento: RectEnPantalla, ventana: MedidaEnPantalla): boolean {
  return elemento.top >= 0 && elemento.left >= 0 && elemento.top + elemento.height <= ventana.alto && elemento.left + elemento.width <= ventana.ancho;
}
