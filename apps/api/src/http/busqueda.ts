/**
 * La búsqueda por nombre en los catálogos no depende de tildes, diéresis, eñes ni mayúsculas: «sandia» encuentra
 * «Sandía», y «pina», «Piña». El profesional escribe rápido y sin tildes; el catálogo las tiene (pedido de Dirección del
 * 2026-10-16 sobre el buscador; DL-098 es la parte de los proveedores externos).
 *
 * Se resuelve en la base con `translate` y `lower`, sin extensiones: cada letra marcada pasa a su letra sin marca, en
 * los dos lados de la comparación, y después todo a minúsculas. El patrón ya trae escapados `\`, `%` y `_`, que
 * `translate` no toca. Se usa como `lower(translate(columna, CON_MARCA, SIN_MARCA)) LIKE lower(translate(patrón, …))`.
 */
export const CON_MARCA = 'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇáàäâãéèëêíìïîóòöôõúùüûñç';
export const SIN_MARCA = 'AAAAAEEEEIIIIOOOOOUUUUNCaaaaaeeeeiiiiooooouuuunc';

/** La misma normalización en código, para las pruebas y para quien compare en memoria. */
export function sinMarcas(texto: string): string {
  let r = '';
  for (const ch of texto) {
    const i = CON_MARCA.indexOf(ch);
    r += i >= 0 ? SIN_MARCA[i] : ch;
  }
  return r.toLowerCase();
}
