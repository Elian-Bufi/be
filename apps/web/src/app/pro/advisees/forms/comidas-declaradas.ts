/**
 * FI-07 · las comidas habituales que la persona contó en «Cómo comés hoy» (FRM-NUTRICION-INICIO), para decidir con ella
 * (WP-FORMULARIOS-DE-INICIO; DL-164 D-9). Sin React, probado en `apps/web/test/comidas-declaradas.test.mjs`.
 * - La lista de comidas es un campo `LIST` de la respuesta: se busca por su código y, si la plantilla cambiara, por su
 *   forma (una lista con una opción —el momento— y un texto —qué come—). Nunca se inventa una fila.
 * - **Las cuatro decisiones son una ayuda de pantalla**: tal cual, ajustar la porción, mejorar, cambiar. Nada viene
 *   elegido y nada se guarda (D-9): lo que queda es el habitual que el profesional arma en «Mis habituales» (DL-109).
 * - Los textos ubican, no califican: ninguna comida es «buena» ni «mala», y la decisión la toman juntos.
 */
import { resumenDeValor, type CampoDePlantillaV2, type NombreDeIcono, type SeccionDePlantillaV2, type SubcampoDeLista, type ValorDeRespuestaV2, type ValorDeSubcampo } from '@be/domain';

/** La clave de la plantilla de inicio de Nutrición y el código del campo de comidas, según el diseño ratificado. */
export const CLAVE_DE_NUTRICION_INICIO = 'FRM-NUTRICION-INICIO';
export const CODIGO_DE_COMIDAS = 'nut_comidas_habituales';

export type CampoDeComidas = Extract<CampoDePlantillaV2, { dataType: 'LIST' }>;

const esSubcampo = (tipo: SubcampoDeLista['dataType']) => (s: SubcampoDeLista) => s.dataType === tipo;

/** El campo de comidas de una versión: por código o, si no está, la primera lista con un momento (opción) y un qué (texto). */
export function campoDeComidas(secciones: readonly SeccionDePlantillaV2[]): CampoDeComidas | null {
  const listas = secciones.flatMap((s) => s.fields).filter((c): c is CampoDeComidas => c.dataType === 'LIST');
  return listas.find((c) => c.fieldCode === CODIGO_DE_COMIDAS) ?? listas.find((c) => c.itemFields.some(esSubcampo('CHOICE')) && c.itemFields.some(esSubcampo('TEXT'))) ?? null;
}

export interface ComidaDeclarada {
  /** El número de renglón en la respuesta, desde 1. */
  readonly numero: number;
  /** El momento («Almuerzo»), con la etiqueta de la plantilla; `null` si no lo dijo. */
  readonly momento: string | null;
  /** Qué come, como lo escribió; `null` si no lo dijo. */
  readonly que: string | null;
  /** Lo demás que contó de esa comida, por partes («Cuántas veces por semana: 2 o 3 veces · Dónde la comés: Vianda»). */
  readonly detalle: string;
  /** El nombre listo para «Mis habituales»: «Almuerzo · Milanesa de carne al horno con puré». */
  readonly texto: string;
}

/** Un valor de un subcampo, en palabras (la etiqueta de una opción, «Sí»/«No», el número con coma). */
function enPalabras(campo: CampoDeComidas, sub: SubcampoDeLista, valor: ValorDeSubcampo): string {
  return resumenDeValor(campo, { type: 'LIST', items: [{ [sub.code]: valor }] });
}

/** Las comidas que contó la persona, una por renglón de la lista, en su orden. Vacío si no respondió ese campo. */
export function comidasDeclaradas(campo: CampoDeComidas, valor: ValorDeRespuestaV2 | undefined): ComidaDeclarada[] {
  if (!valor || valor.type !== 'LIST') return [];
  const momento = campo.itemFields.find(esSubcampo('CHOICE'));
  const que = campo.itemFields.find(esSubcampo('TEXT'));
  return valor.items.map((renglon, i) => {
    const dicho = (sub: SubcampoDeLista | undefined): string | null => (sub && sub.code in renglon ? enPalabras(campo, sub, renglon[sub.code]!) : null);
    const detalle = campo.itemFields
      .filter((s) => s !== momento && s !== que && s.code in renglon)
      .map((s) => `${s.label}: ${enPalabras(campo, s, renglon[s.code]!)}`)
      .join(' · ');
    const elMomento = dicho(momento);
    const elQue = dicho(que);
    return { numero: i + 1, momento: elMomento, que: elQue, detalle, texto: [elMomento, elQue].filter((t): t is string => t !== null).join(' · ') };
  });
}

/** Las cuatro decisiones del diseño, con su ícono. Son del momento de la charla: no se guardan (D-9). */
export const DECISIONES = [
  { clave: 'tal-cual', texto: 'Tal cual', icono: 'tilde' },
  { clave: 'porcion', texto: 'Ajustar la porción', icono: 'rango' },
  { clave: 'mejorar', texto: 'Mejorar', icono: 'repetir' },
  { clave: 'cambiar', texto: 'Cambiar', icono: 'distinto' },
] as const satisfies readonly { clave: string; texto: string; icono: NombreDeIcono }[];
export type Decision = (typeof DECISIONES)[number]['clave'];

export const COPY_COMIDAS_DECLARADAS = {
  titulo: 'Las comidas de su semana',
  bajada: 'Para charlar con la persona: qué mantenemos tal cual, en cuáles ajustamos la porción, cuáles mejoramos y cuáles cambiamos.',
  nadaElegido: 'Nada viene elegido y nada se guarda: la decisión es de la charla. Lo que queda es el habitual que armás en «Mis habituales».',
  comida: 'Comida',
  decision: 'Qué hacemos',
  sinDecidir: 'Sin decidir',
  dejarSinDecidir: 'Dejar sin decidir',
  pasarAHabituales: 'Pasar a Mis habituales',
  comoSePasa: 'Un habitual se arma desde una comida del plan: en Nutrición · Plan, agregá la comida con sus alimentos y usá «Guardar como habitual». El nombre ya está listo para copiar.',
  nombreListo: 'Nombre para el habitual',
  copiar: 'Copiar el nombre',
  copiado: 'Copiado.',
  noSeCopio: 'No se pudo copiar: seleccionalo y copialo a mano.',
  irAlPlan: 'Ir a Nutrición · Plan',
  cerrar: 'Cerrar',
} as const;
