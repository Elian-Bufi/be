/**
 * ED-13 · Usar un reparto habitual pisa lo que ya estaba escrito en los tres campos. Lo que se pisa se dice al
 * escribirlo, con «Deshacer» (revisión del 13/11): elegir en el select no debe borrar sin aviso lo que el profesional
 * había escrito. Sin React: lo usan el componente y sus pruebas.
 */

export interface GramosEscritos {
  readonly proteina: string;
  readonly carbohidratos: string;
  readonly grasas: string;
}

/**
 * «P 160 · C 280 · G 75»: lo escrito que el reparto reemplaza, para decirlo con «Deshacer». `null` si no había nada
 * escrito o si es lo mismo que se escribe (entonces no hay nada que deshacer).
 */
export function loQueSePisa(antes: GramosEscritos, nuevos: GramosEscritos): string | null {
  const limpio = (t: string) => t.trim();
  const habia = [antes.proteina, antes.carbohidratos, antes.grasas].some((t) => limpio(t) !== '');
  const igual = limpio(antes.proteina) === limpio(nuevos.proteina) && limpio(antes.carbohidratos) === limpio(nuevos.carbohidratos) && limpio(antes.grasas) === limpio(nuevos.grasas);
  if (!habia || igual) return null;
  const v = (t: string) => (limpio(t) === '' ? '—' : limpio(t));
  return `P ${v(antes.proteina)} · C ${v(antes.carbohidratos)} · G ${v(antes.grasas)}`;
}
