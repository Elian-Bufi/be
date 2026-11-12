/**
 * ED-33 (WP-EDITORES-PROFESIONAL; V3) · Quitar un día tipo, una comida o una opción con contenido pide confirmar, y dice
 * lo que se va («Quitar Merienda: 2 opciones y 7 alimentos»). Sin contenido, se quita en el acto, como antes.
 *
 * Qué es contenido: un alimento o una receta en alguna opción, o, en un día tipo, alguna comida. Una opción vacía recién
 * creada («Opción 1», sin alimentos) no lo es: perderla no pierde nada escrito. «Cancelar» no toca nada (TEST-EDP-057):
 * esta función no cambia la estructura.
 */
import type { EstructuraDePlanEntrada } from '@be/domain';

type Dia = EstructuraDePlanEntrada['dayTypes'][number];
type Comida = Dia['meals'][number];
type Opcion = Comida['options'][number];

/** Los nombres, como los dice el editor (los mismos de `rangos.ts`: este módulo se prueba sin importar otros). */
const nombreDeLaComida = (m: Pick<Comida, 'label'>, j: number): string => m.label.trim() || `Comida ${j + 1}`;
const nombreDelDiaTipo = (d: Pick<Dia, 'label'>, i: number): string => d.label.trim() || `Día tipo ${i + 1}`;

const contar = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** «2 opciones (1 de receta), 7 alimentos», en una enumeración con «y» al final. */
function enumerar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes.join('');
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

const alimentosDe = (opciones: readonly Opcion[]): number => opciones.reduce((s, o) => s + (o.recipeVersionId ? 0 : o.items.length), 0);
const recetasDe = (opciones: readonly Opcion[]): number => opciones.filter((o) => o.recipeVersionId).length;
const conContenido = (o: Opcion): boolean => !!o.recipeVersionId || o.items.length > 0;

function opcionesEnPalabras(opciones: readonly Opcion[]): string[] {
  const recetas = recetasDe(opciones);
  const alimentos = alimentosDe(opciones);
  return [
    `${contar(opciones.length, 'opción', 'opciones')}${recetas > 0 ? ` (${contar(recetas, 'de receta', 'de receta')})` : ''}`,
    ...(alimentos > 0 ? [contar(alimentos, 'alimento', 'alimentos')] : []),
  ];
}

/** Lo que se va al quitar una opción, o `null` si no tiene contenido. */
export function alQuitarLaOpcion(o: Opcion, k: number): string | null {
  if (!conContenido(o)) return null;
  const nombre = o.label.trim() || `Opción ${k + 1}`;
  return o.recipeVersionId ? `Quitar ${nombre}: la receta sale de esta comida` : `Quitar ${nombre}: ${contar(o.items.length, 'alimento', 'alimentos')}`;
}

/** Lo que se va al quitar una comida, o `null` si no tiene contenido. */
export function alQuitarLaComida(m: Comida, j: number): string | null {
  if (!m.options.some(conContenido)) return null;
  return `Quitar ${nombreDeLaComida(m, j)}: ${enumerar(opcionesEnPalabras(m.options))}`;
}

/** Lo que se va al quitar un día tipo, o `null` si no tiene comidas. */
export function alQuitarElDia(d: Dia, i: number): string | null {
  if (d.meals.length === 0) return null;
  const opciones = d.meals.flatMap((m) => m.options);
  const partes = [contar(d.meals.length, 'comida', 'comidas'), ...(opciones.length > 0 ? opcionesEnPalabras(opciones) : [])];
  return `Quitar ${nombreDelDiaTipo(d, i)}: ${enumerar(partes)}`;
}

export const COPY_QUITAR = {
  titulo: '¿Lo quitás?',
  queSeVa: 'Esto sale de la versión en preparación. La versión activa no cambia, y el guardado siguiente lo deja así.',
  quitar: 'Quitar',
} as const;
