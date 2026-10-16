/**
 * Un aviso para la página a la que se está yendo. Lo deja quien navega («Solicitud enviada.», y enseguida vuelve a
 * Entrenamiento) y lo toma, una sola vez, la página de destino: un aviso de la página que se abandona no lo lee nadie.
 *
 * Vive en la memoria de la pestaña, como la sesión (DL-012): no va en la dirección —no queda en el historial ni vuelve a
 * mostrarse con «atrás»— y se pierde al recargar, igual que la sesión.
 */
let pendiente: { readonly ruta: string; readonly texto: string } | null = null;

/** Deja un aviso para la página de esa ruta (sin parámetros). Reemplaza al que hubiera. */
export function dejarAvisoPara(ruta: string, texto: string): void {
  pendiente = { ruta, texto };
}

/** El aviso que alguien dejó para esta ruta, si lo hay. Se entrega una vez. */
export function tomarAvisoPara(ruta: string): string | null {
  if (pendiente?.ruta !== ruta) return null;
  const { texto } = pendiente;
  pendiente = null;
  return texto;
}
