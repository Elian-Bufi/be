/**
 * La receta como opción, con buscador (WP-TABLERO-ALTA-GAMA TB-48; propuesta §23.1 y §24.7). «Agregar receta como
 * opción» abría la lista de «Mis recetas» de a 20, sin buscador: con 50 recetas, había que ir a buscar la que se quería
 * con «Ver más». Ahora el cajón lee todas las propias (API-REC-02, de a 50) y las filtra por su nombre mientras se
 * escribe, sin tildes ni mayúsculas, como el resto de las búsquedas de BE. API-REC-02 no busca por texto: buscar en lo ya
 * leído no le pide nada nuevo a la API, y lee solo al abrir el cajón, nunca al abrir la página.
 * Vive en el website hasta TB-20 (§8.2 del paquete). Sin React, para las pruebas.
 */
import { normalizarTexto } from '@be/domain';

/** Cuántas recetas se leen por página (el máximo de API-REC-02) y cuántas páginas como mucho antes de ofrecer «Ver más». */
export const RECETAS_POR_PAGINA = 50;
export const PAGINAS_DE_RECETAS = 10;

/** Las recetas cuyo nombre tiene todas las palabras escritas, en cualquier orden, sin tildes ni mayúsculas. */
export function recetasQueCoinciden<R extends { readonly name: string }>(recetas: readonly R[], texto: string): R[] {
  const palabras = normalizarTexto(texto).split(' ').filter(Boolean);
  if (palabras.length === 0) return [...recetas];
  return recetas.filter((r) => {
    const nombre = normalizarTexto(r.name);
    return palabras.every((p) => nombre.includes(p));
  });
}

/** Los textos del buscador de recetas. */
export const COPY_ELEGIR_RECETA = {
  buscar: 'Buscar en tus recetas',
  ayuda: 'Por su nombre. No importan las tildes.',
  cuantas: (n: number, total: number): string => (n === total ? (total === 1 ? 'Una receta' : `${total} recetas`) : `${n} de ${total} recetas`),
  ninguna: (texto: string): string => `Ninguna de tus recetas tiene «${texto.trim()}» en el nombre.`,
  borrar: 'Borrar la búsqueda',
  hayMas: 'Hay más recetas sin leer: la búsqueda mira las que ya se leyeron.',
} as const;
