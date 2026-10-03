/**
 * Volver a una zona principal la deja a la altura en que se la dejó (candidata 0.13.2).
 *
 * Desde que cada zona verifica antes de mostrar (`ciclo-de-lectura.ts`), el contenido aparece cuando la API confirma el
 * acceso. La restauración tenía un plazo fijo de 1,5 s. Con la red del teléfono la confirmación puede tardar más, y la
 * zona quedaba arriba. Ahora la altura espera al contenido con dos límites:
 * - si la persona mueve la pantalla mientras tanto, manda ella;
 * - después de 10 s ya no se salta. Así, un «Reintentar» tardío no mueve la pantalla que la persona está mirando.
 */
export const TOPE_DE_LA_ESPERA_MS = 10_000;

export interface RestauracionDeAltura {
  /** Al ir a una pantalla: la altura a recuperar. Con 0 se queda arriba y no hay nada que esperar. */
  pedir(y: number, ahora: number): void;
  /** Cuando cambia el alto del contenido: la altura a la que hay que ir, o `null` si todavía no, o ya no. */
  alCambiarElAlto(alto: number, ahora: number): number | null;
  /** La persona arrastró la pantalla: se descarta lo pendiente. */
  alArrastrar(): void;
}

export function crearRestauracionDeAltura(tope = TOPE_DE_LA_ESPERA_MS): RestauracionDeAltura {
  let pendiente: { y: number; hasta: number } | null = null;
  return {
    pedir(y, ahora) {
      pendiente = y > 0 ? { y, hasta: ahora + tope } : null;
    },
    alCambiarElAlto(alto, ahora) {
      if (!pendiente) return null;
      if (ahora > pendiente.hasta) {
        pendiente = null;
        return null;
      }
      if (alto < pendiente.y) return null;
      const { y } = pendiente;
      pendiente = null;
      return y;
    },
    alArrastrar() {
      pendiente = null;
    },
  };
}
