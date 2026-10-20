/**
 * Cambia lo que vive en la dirección de la página que se está mirando —la vista, el período, el día tipo, las comidas
 * abiertas— sin pedirle nada al servidor (bloque 3 del encargo de consolidación, 2026-10-19).
 *
 * El enrutador de Next, en el export estático, le pide al servidor el contenido de la página en cada cambio de la
 * dirección, aunque sea la misma página. Sin conexión ese pedido falla, y Next cae a una navegación del navegador, que
 * termina en su página de error con lo escrito sin guardar adentro (lo encontró el recorrido de navegador `borrador`).
 * Desde Next 14.1, `history.replaceState` y `pushState` se integran con su enrutador: `useSearchParams` se entera igual.
 *
 * Solo para un destino en la misma ruta. Para ir a otra página se sigue usando el enrutador o un enlace.
 */
export function cambiarLaDireccion(destino: string, { agregarAlHistorial = false }: { readonly agregarAlHistorial?: boolean } = {}): void {
  if (agregarAlHistorial) window.history.pushState(null, '', destino);
  else window.history.replaceState(null, '', destino);
}
