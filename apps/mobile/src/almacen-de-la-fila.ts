/**
 * El almacén de la fila fija de la sesión (`fila-fija.tsx`), sin React Native para poder probarlo solo.
 *
 * La instantánea (`actual`) cambia de identidad solo cuando cambian los datos de la fila (sus textos, si se puede tocar)
 * o su referencia de acciones. Si cambiara en cada dibujo de la sesión, `useSyncExternalStore` volvería a dibujar
 * App.tsx, que vuelve a dibujar la sesión, que vuelve a publicar, sin fin: «Maximum update depth exceeded». Así se
 * cerraba la 0.23.0-candidata.1 al empezar o continuar un entrenamiento. Las acciones viajan en una referencia estable
 * (`useRef`), así que conservar la fila anterior nunca deja una acción vieja.
 */
export interface FilaConDatos {
  readonly datos: unknown;
  readonly ocupado: boolean;
  readonly acciones: unknown;
}

export interface AlmacenDeLaFila<F extends FilaConDatos> {
  fijar(fila: F | null): void;
  suscribir(alCambiar: () => void): () => void;
  actual(): F | null;
}

export function crearAlmacenDeLaFila<F extends FilaConDatos>(): AlmacenDeLaFila<F> {
  let publicada: F | null = null;
  let clave = '';
  const oyentes = new Set<() => void>();
  return {
    fijar(fila) {
      const nueva = fila ? JSON.stringify([fila.datos, fila.ocupado]) : '';
      const misma = fila === null ? publicada === null : publicada !== null && nueva === clave && fila.acciones === publicada.acciones;
      if (misma) return;
      clave = nueva;
      publicada = fila;
      oyentes.forEach((o) => o());
    },
    suscribir(alCambiar) {
      oyentes.add(alCambiar);
      return () => {
        oyentes.delete(alCambiar);
      };
    },
    actual: () => publicada,
  };
}
