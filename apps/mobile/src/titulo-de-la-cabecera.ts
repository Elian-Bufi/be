/**
 * PG-04 de WP-PULIDO-GRANDES (DL-173, con PG-D2 a ratificar): el título grande de cada pantalla que, al desplazar, sube
 * a la cabecera, achicado y al centro, entre el logo (o «Volver») y la campana. Como el título grande de iOS y el
 * «top app bar» de Material 3, sin escribir el título letra por letra. Es lógica pura, sin React Native: la usan
 * `ui.tsx` (Titulo), `cabecera.tsx` y `App.tsx`, y la prueba `titulo-de-la-cabecera.test.ts` (TEST-PG-003).
 *
 * - **Uno solo a la vez.** Un mismo valor de 0 a 1 mueve los dos: la cabecera con `v` y el grande con `1 − v`. Nunca se
 *   ven los dos a más del 50 %.
 * - **Cuándo sube:** al desplazar más que el final del título grande (su borde de abajo en el contenido); antes, no.
 * - **Sin dibujar al desplazar:** se anima al cruzar el umbral, no en cada evento, con el controlador nativo; con
 *   «reducir movimiento», el cambio es instantáneo.
 * - **Qué título:** el primero que la pantalla dibuja con `Titulo` (en Inicio, la fecha). La pantalla lo registra al
 *   montarse y lo quita al irse; sin título, la cabecera no muestra nada al centro.
 */

/** El fundido del título, el mismo de la capa de la cabecera (AV2-T26). */
export const FUNDIDO_DEL_TITULO = 160;

/** El relleno de arriba del contenido de cada pantalla (`contenido` en App.tsx): el título grande empieza ahí. */
export const RELLENO_DEL_CONTENIDO = 20;

/** Si el título ya subió a la cabecera: con el desplazamiento pasado su borde de abajo. Sin título medido, no. */
export const tituloEnLaCabecera = (desplazamiento: number, finDelTitulo: number | null): boolean => finDelTitulo !== null && desplazamiento >= finDelTitulo;

/** La opacidad de cada uno con el valor del fundido (0: el grande; 1: el de la cabecera). */
export const opacidadesDelTitulo = (v: number): { readonly cabecera: number; readonly grande: number } => ({ cabecera: v, grande: 1 - v });

/** Cuánto dura el cambio: con «reducir movimiento», nada. */
export const duracionDelTitulo = (movimientoReducido: boolean): number => (movimientoReducido ? 0 : FUNDIDO_DEL_TITULO);

/** El borde de abajo del título grande en el contenido, con lo que mide su `onLayout` dentro de la pantalla. */
export const finDelTitulo = (y: number, alto: number): number => RELLENO_DEL_CONTENIDO + y + alto;

/**
 * Cuánto espacio deja el título de la cabecera a cada lado, para no tocar nunca lo de los costados: con «Volver» (que
 * mide hasta unos 105 dp con su letra a ×1,15), 112; con el logo o nada, 60 (el logo y la campana miden 52 y 54).
 */
export const margenDelTituloChico = (conVolver: boolean): number => (conVolver ? 112 : 60);

export interface TituloRegistrado {
  readonly texto: string;
  /** El borde de abajo del título en el contenido; `null` hasta medirlo. */
  readonly fin: number | null;
}

export interface RegistroDelTitulo {
  registrar(id: string, texto: string): void;
  medir(id: string, fin: number): void;
  quitar(id: string): void;
  /** El primero registrado que sigue en pantalla, o `null`. */
  actual(): TituloRegistrado | null;
  suscribir(oyente: () => void): () => void;
}

export function crearRegistroDelTitulo(): RegistroDelTitulo {
  const titulos = new Map<string, TituloRegistrado>();
  const oyentes = new Set<() => void>();
  let vigente: TituloRegistrado | null = null;
  const avisar = () => {
    const primero = titulos.values().next();
    const nuevo = primero.done ? null : primero.value;
    if (nuevo === vigente) return;
    vigente = nuevo;
    for (const o of oyentes) o();
  };
  return {
    registrar(id, texto) {
      const antes = titulos.get(id);
      if (antes && antes.texto === texto) return;
      titulos.set(id, { texto, fin: antes?.fin ?? null });
      avisar();
    },
    medir(id, fin) {
      const antes = titulos.get(id);
      if (!antes || antes.fin === fin) return;
      titulos.set(id, { ...antes, fin });
      avisar();
    },
    quitar(id) {
      if (titulos.delete(id)) avisar();
    },
    actual: () => vigente,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}
