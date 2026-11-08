/**
 * La sesión en curso de WP-APP-VUELTA-DE-ROSCA (DL-166; AV-10 a AV-14 y AV-18), como lógica pura: el descanso que
 * arranca solo al tildar la serie, sus ajustes guardados en el teléfono, el aviso al llegar al recomendado, la fila fija
 * de acciones con «Empezar serie N», y la disposición con letra grande. La pantalla (`pantallas/entrenamiento.tsx`) y
 * la prueba `scripts/vuelta-de-rosca.test.mjs` usan estas funciones; los eventos los arma `corrida-de-entrenamiento.ts`.
 *
 * - **PV-7 y AVD-3:** con el ajuste automático (el de fábrica), tildar una serie la registra y empieza su descanso,
 *   ligado a esa serie, en la misma acción. Solo entre series del mismo ejercicio: tras la última serie de un ejercicio,
 *   y tras la última de la sesión, no arranca. En pausa no arranca (nada se mide en pausa, DL-124). Destildar la serie
 *   con su descanso corriendo lo termina (`REST_FINISHED`): un evento no se borra.
 * - **La barra** va de 0 al recomendado de esa serie (DL-122). Pasado el recomendado queda llena y el conteo sigue, sin
 *   cambiar de color y sin cortar nada: con «La inicio yo», llegar al recomendado no termina nada.
 * - **PV-10:** los ajustes quedan en el teléfono, como la apariencia. Si no se pueden leer, valen los de fábrica.
 * - **PV-9, AVD-5 y AVD-8:** vibrar al llegar al recomendado, también con el teléfono bloqueado, con un aviso local
 *   común (sin alarma exacta) que no nombra el ejercicio. El permiso se pide en contexto, en el primer descanso.
 * - **PV-11, PV-12 y AVD-4:** la fila fija tiene Pausar o Reanudar, la acción del momento y Siguiente ejercicio.
 *   «Empezar serie N», con un descanso corriendo, lo termina y arranca la serie en un toque (la acción compuesta de
 *   siempre, `cronometrar-serie`).
 */
import type { EstadoDeLaCorrida } from '@be/domain';
import type { AccionDeTiempo } from './corrida-de-entrenamiento';
import { disposicionDeLaBarra } from './disposicion-de-la-barra';
import type { Zona } from './navegacion';
import { TEXTOS_DEL_DESCANSO as T } from './textos-del-descanso';

// ─── Los ajustes del descanso, en el teléfono (AV-11; PV-10) ────────────────────────────────────

export interface AjustesDelDescanso {
  /** «Al guardar la serie» (automático) o «Lo inicio yo» (manual). */
  readonly inicio: 'automatico' | 'manual';
  /** Vibrar al llegar al recomendado. */
  readonly vibrar: boolean;
  /** También con el teléfono bloqueado, con un aviso local. */
  readonly tambienBloqueado: boolean;
}

/** Los de fábrica (PV-8 y PV-9): descanso automático, y vibrar encendido, también con el teléfono bloqueado. */
export const AJUSTES_DE_FABRICA: AjustesDelDescanso = { inicio: 'automatico', vibrar: true, tambienBloqueado: true };

export const CLAVE_DE_LOS_AJUSTES = 'be:ajustes-del-descanso';

/** Lo guardado, si tiene la forma de los ajustes; si no (otra versión, basura), los de fábrica. */
export function ajustesDe(texto: string | null): AjustesDelDescanso {
  if (!texto) return AJUSTES_DE_FABRICA;
  try {
    const a = JSON.parse(texto) as Partial<Record<keyof AjustesDelDescanso, unknown>>;
    return {
      inicio: a.inicio === 'manual' || a.inicio === 'automatico' ? a.inicio : AJUSTES_DE_FABRICA.inicio,
      vibrar: typeof a.vibrar === 'boolean' ? a.vibrar : AJUSTES_DE_FABRICA.vibrar,
      tambienBloqueado: typeof a.tambienBloqueado === 'boolean' ? a.tambienBloqueado : AJUSTES_DE_FABRICA.tambienBloqueado,
    };
  } catch {
    return AJUSTES_DE_FABRICA;
  }
}

export interface AlmacenDeTexto {
  getItem(clave: string): Promise<string | null>;
  setItem(clave: string, valor: string): Promise<void>;
}

export interface AjustesGuardados {
  /** Lee lo guardado. Si el teléfono no deja leer, quedan los de fábrica y nada se rompe. */
  leer(): Promise<AjustesDelDescanso>;
  /** Cambia los ajustes; `false` si no se pudieron guardar (siguen valiendo en esta sesión de la app). */
  cambiar(cambios: Partial<AjustesDelDescanso>): Promise<boolean>;
  actuales(): AjustesDelDescanso;
  suscribir(alCambiar: () => void): () => void;
}

export function crearAjustesDelDescanso(almacen: AlmacenDeTexto): AjustesGuardados {
  let actuales = AJUSTES_DE_FABRICA;
  const oyentes = new Set<() => void>();
  const fijar = (a: AjustesDelDescanso) => {
    actuales = a;
    for (const o of oyentes) o();
  };
  return {
    async leer() {
      try {
        fijar(ajustesDe(await almacen.getItem(CLAVE_DE_LOS_AJUSTES)));
      } catch {
        fijar(AJUSTES_DE_FABRICA);
      }
      return actuales;
    },
    async cambiar(cambios) {
      fijar({ ...actuales, ...cambios });
      try {
        await almacen.setItem(CLAVE_DE_LOS_AJUSTES, JSON.stringify(actuales));
        return true;
      } catch {
        return false;
      }
    },
    actuales: () => actuales,
    suscribir(alCambiar) {
      oyentes.add(alCambiar);
      return () => {
        oyentes.delete(alCambiar);
      };
    },
  };
}

// ─── El descanso al tildar y al destildar (AV-10) ───────────────────────────────────────────────

export interface SerieTildada {
  readonly prescriptionId: string;
  readonly setIndex: number;
  /** Si es la última serie de su ejercicio (la planificada más alta, o la última fila): tras ella no hay descanso. */
  readonly ultimaDelEjercicio: boolean;
}

/**
 * La acción de tiempo que acompaña a tildar una serie, o `null` si no corresponde ninguna:
 * - sin corrida en vivo (otro día, sin empezar o cerrada), en pausa o con el ajuste manual, ninguna;
 * - tras la última serie del ejercicio (y por eso tras la última de la sesión), ninguna (AVD-3);
 * - si no, el descanso de esa serie. Si había algo midiéndose (la serie cronometrada o un descanso anterior), la misma
 *   acción lo cierra primero (`descanso-al-tildar` en `corrida-de-entrenamiento.ts`).
 */
export function accionAlTildar(estado: Pick<EstadoDeLaCorrida, 'runId' | 'cierre' | 'pausada'> | null, ajustes: AjustesDelDescanso, serie: SerieTildada): AccionDeTiempo | null {
  if (!estado || estado.runId === null || estado.cierre !== null || estado.pausada) return null;
  if (ajustes.inicio !== 'automatico' || serie.ultimaDelEjercicio) return null;
  return { tipo: 'descanso-al-tildar', prescriptionId: serie.prescriptionId, setIndex: serie.setIndex };
}

/** Destildar una serie con su descanso corriendo lo termina (AVD-3): no se borra, se cierra. Si no, ninguna. */
export function accionAlDestildar(estado: Pick<EstadoDeLaCorrida, 'medicionAbierta'> | null, serie: Pick<SerieTildada, 'prescriptionId' | 'setIndex'>): AccionDeTiempo | null {
  const abierta = estado?.medicionAbierta;
  return abierta?.kind === 'REST' && abierta.prescriptionId === serie.prescriptionId && abierta.setIndex === serie.setIndex ? { tipo: 'finalizar-descanso' } : null;
}

// ─── El bloque del descanso y su barra (AV-10) ──────────────────────────────────────────────────

/**
 * Cuánto de la barra está lleno: de 0 a 1, con el recomendado como 1. Pasado el recomendado, queda llena. Sin recomendado,
 * no hay barra (`null`): hay conteo sin barra.
 */
export function llenadoDeLaBarra(ms: number | null, recomendadoS: number | null): number | null {
  if (recomendadoS === null || recomendadoS <= 0) return null;
  return Math.min(1, Math.max(0, (ms ?? 0) / (recomendadoS * 1000)));
}

/** Si el descanso llegó al recomendado en este instante (para anunciarlo una sola vez y vibrar). */
export const llegoAlRecomendado = (msAntes: number | null, msAhora: number | null, recomendadoS: number | null): boolean =>
  recomendadoS !== null && msAhora !== null && msAhora >= recomendadoS * 1000 && (msAntes === null || msAntes < recomendadoS * 1000);

// ─── El aviso al llegar al recomendado y su permiso (AV-12) ─────────────────────────────────────

export type PermisoDeAvisos = 'dado' | 'sin-pedir' | 'negado';

/**
 * Cuándo tiene que haber un aviso local programado: con un descanso corriendo y sin pausa, con un recomendado que todavía
 * no llegó, con «Vibrar» y «También con el teléfono bloqueado» encendidos, y con el permiso dado. Devuelve en cuántos
 * segundos, o `null` (no hay que programar nada, y si había uno, se cancela).
 */
export function planDelAviso(d: { readonly descansoCorriendo: boolean; readonly pausada: boolean; readonly recomendadoS: number | null; readonly transcurridoMs: number; readonly ajustes: AjustesDelDescanso; readonly permiso: PermisoDeAvisos }): { readonly enSegundos: number } | null {
  if (!d.descansoCorriendo || d.pausada || d.recomendadoS === null) return null;
  if (!d.ajustes.vibrar || !d.ajustes.tambienBloqueado || d.permiso !== 'dado') return null;
  const falta = d.recomendadoS * 1000 - d.transcurridoMs;
  return falta > 0 ? { enSegundos: Math.max(1, Math.round(falta / 1000)) } : null;
}

/**
 * Qué hacer con el permiso de avisos (AVD-8): se pide al empezar el primer descanso, en el bloque, con la frase de para
 * qué y «Permitir avisos»; recién al tocarlo aparece el diálogo de Android. Si la persona lo cierra sin elegir, no se
 * vuelve a preguntar en esa sesión. Negado, una línea dice que vibra solo con la app abierta. Nunca al abrir la app.
 */
export function pedidoDelPermiso(d: { readonly ajustes: AjustesDelDescanso; readonly permiso: PermisoDeAvisos; readonly descansoCorriendo: boolean; readonly cerradoEnEstaSesion: boolean }): 'nada' | 'explicar' | 'solo-con-la-app-abierta' {
  if (!d.ajustes.vibrar || !d.ajustes.tambienBloqueado) return 'nada';
  if (d.permiso === 'negado') return 'solo-con-la-app-abierta';
  if (d.permiso === 'sin-pedir' && d.descansoCorriendo && !d.cerradoEnEstaSesion) return 'explicar';
  return 'nada';
}

/** El aviso con el teléfono bloqueado: no nombra el ejercicio ni muestra ningún dato (PV-9). */
export const CONTENIDO_DEL_AVISO = { title: T.avisoDelDescanso, body: '', data: { tipo: 'descanso-de-be' } } as const;

/** Si un aviso que llegó es el del descanso (con la app abierta, no se muestra: vibra la app). */
export const esElAvisoDelDescanso = (datos: unknown): boolean => typeof datos === 'object' && datos !== null && (datos as { tipo?: unknown }).tipo === 'descanso-de-be';

// ─── La fila fija de acciones (AV-13, AV-14; AVD-4) ─────────────────────────────────────────────

export type AccionDelMedio = { readonly tipo: 'empezar-serie'; readonly setIndex: number; readonly texto: string } | { readonly tipo: 'terminar-serie'; readonly setIndex: number; readonly texto: string };

export interface FilaDeAcciones {
  readonly izquierda: { readonly tipo: 'pausar' | 'reanudar'; readonly texto: string };
  /** `null`: no hay una serie que empezar (están todas registradas). */
  readonly medio: AccionDelMedio | null;
  /** Por qué la del medio no se puede tocar (en pausa), o `null`. */
  readonly motivo: string | null;
  readonly siguienteEjercicio: { readonly texto: string; readonly habilitado: boolean } | null;
}

/**
 * La fila del momento, según la corrida (AVD-4):
 * - con un descanso corriendo, o sin nada abierto: «Empezar serie N» (la primera sin registrar del ejercicio);
 * - con una serie cronometrada abierta del ejercicio: «Terminar serie N»;
 * - en pausa: «Reanudar» a la izquierda, y la del medio deshabilitada, con su motivo.
 * «Finalizar entrenamiento» no está en la fila: queda al final de la pantalla y en «Ver rutina».
 */
export function filaDeAcciones(d: {
  readonly pausada: boolean;
  readonly abierta: EstadoDeLaCorrida['medicionAbierta'];
  readonly prescriptionId: string;
  readonly siguienteSinRegistrar: number | null;
  readonly haySiguienteEjercicio: boolean;
}): FilaDeAcciones {
  const izquierda = d.pausada ? { tipo: 'reanudar' as const, texto: T.reanudar } : { tipo: 'pausar' as const, texto: T.pausar };
  let medio: AccionDelMedio | null = null;
  if (d.abierta?.kind === 'SET' && d.abierta.prescriptionId === d.prescriptionId) medio = { tipo: 'terminar-serie', setIndex: d.abierta.setIndex, texto: T.terminarSerie(d.abierta.setIndex) };
  else if (d.siguienteSinRegistrar !== null) medio = { tipo: 'empezar-serie', setIndex: d.siguienteSinRegistrar, texto: T.empezarSerie(d.siguienteSinRegistrar) };
  return {
    izquierda,
    medio,
    motivo: d.pausada && medio ? T.enPausaNoSeMide : null,
    siguienteEjercicio: d.haySiguienteEjercicio ? { texto: T.siguienteEjercicio, habilitado: !d.pausada } : null,
  };
}

/** La acción de tiempo de «Empezar serie N»: la de siempre, que con un descanso corriendo lo termina en el mismo instante. */
export const accionDeEmpezarSerie = (prescriptionId: string, setIndex: number): AccionDeTiempo => ({ tipo: 'cronometrar-serie', prescriptionId, setIndex });

// ─── Con letra grande (AV-18; PV-13, a ratificar) ───────────────────────────────────────────────

/**
 * La sesión con letra grande (PV-13, elegida por el continuador y a ratificar): la fila de acciones sigue en una fila, y
 * la navegación pasa a dos filas debajo cuando no entra en una, las dos fijas. Nada se esconde: la alternativa (esconder
 * la navegación con letra ×1,3 o más) sería una excepción a PV-11, y la decide Dirección.
 */
export function disposicionDeLaSesion(anchoDePantalla: number, escalaDeLetra: number, zonas: readonly Zona[]): { readonly filasDeAcciones: 1; readonly filasDeNavegacion: number; readonly navegacionVisible: true } {
  return { filasDeAcciones: 1, filasDeNavegacion: disposicionDeLaBarra({ anchoDePantalla, escalaDeLetra, zonas }).filas.length, navegacionVisible: true };
}
