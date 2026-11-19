/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179): la lógica del panel «Contexto de <nombre>», sin React, para probarla sola
 * (`apps/web/test/contexto-de-la-persona.test.mjs`). Importa solo de `@be/domain`: Node la carga tal cual en las pruebas.
 * - **Al costado o como cajón** (CTX-D03): desde 1680 px de ancho, al costado y empujando; con menos, encima del editor.
 * - **Alt + C** (CTX-D04), también dentro de un campo, por `event.code` (Option + C en macOS escribe «ç»).
 * - **Las pestañas,** en orden, con flechas, Inicio y Fin (el patrón de pestañas de WAI-ARIA).
 * - **Lo único que se recuerda** (CTX-D18): si estaba abierto y qué pestaña, por área, en el navegador. Ningún dato.
 * - **Lo que lee cada pestaña,** recién al abrirla (CTX-D02): el panel cerrado no lee datos de salud.
 * - **«Citar»** (CTX-D12): a qué va la cita y el renglón que suma al fundamento del objetivo.
 */
import { COPY_CONTEXTO, type CitaPosible } from '@be/domain';

/** El ancho de ventana desde el que el panel va al costado (CTX-D03). A 1920 deja el editor en ~1500 px. */
export const ANCHO_PARA_EL_COSTADO = 1680;
/** El ancho del panel: al costado, fijo; como cajón, hasta el 92 % de la ventana. */
export const ANCHO_DEL_PANEL = 420;

export type ModoDelPanel = 'costado' | 'cajon';
export const modoDelPanel = (anchoDeVentana: number): ModoDelPanel => (anchoDeVentana >= ANCHO_PARA_EL_COSTADO ? 'costado' : 'cajon');

/** El ancho que ocupa el panel con esa ventana: al costado, el fijo; como cajón, el fijo o el 92 % si es menos. */
export function anchoDelPanel(anchoDeVentana: number): number {
  return modoDelPanel(anchoDeVentana) === 'costado' ? ANCHO_DEL_PANEL : Math.min(ANCHO_DEL_PANEL, Math.floor(anchoDeVentana * 0.92));
}

/** El ancho que le queda al editor: al costado, la ventana menos el panel; como cajón, la ventana entera (el panel la tapa). */
export function anchoDelEditor(anchoDeVentana: number): number {
  return modoDelPanel(anchoDeVentana) === 'costado' ? anchoDeVentana - ANCHO_DEL_PANEL : anchoDeVentana;
}

/** Alt + C, sin Ctrl ni Meta ni Mayúsculas: abre y cierra. `code` es la tecla física, la misma en cualquier distribución. */
export function esAtajoDelPanel(e: { readonly altKey: boolean; readonly ctrlKey: boolean; readonly metaKey: boolean; readonly shiftKey: boolean; readonly code: string }): boolean {
  return e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyC';
}

export const PESTANAS = ['importante', 'formularios', 'cuerpo', 'otras', 'notas'] as const;
export type Pestana = (typeof PESTANAS)[number];
export const TEXTO_DE_PESTANA: Readonly<Record<Pestana, string>> = COPY_CONTEXTO.pestanas;
export const esPestana = (x: unknown): x is Pestana => typeof x === 'string' && (PESTANAS as readonly string[]).includes(x);

/** La pestaña a la que lleva una tecla en la lista de pestañas, o `null` si la tecla no mueve. */
export function pestanaPorTecla(actual: Pestana, tecla: string): Pestana | null {
  const i = PESTANAS.indexOf(actual);
  if (tecla === 'ArrowRight' || tecla === 'ArrowDown') return PESTANAS[(i + 1) % PESTANAS.length]!;
  if (tecla === 'ArrowLeft' || tecla === 'ArrowUp') return PESTANAS[(i - 1 + PESTANAS.length) % PESTANAS.length]!;
  if (tecla === 'Home') return PESTANAS[0]!;
  if (tecla === 'End') return PESTANAS[PESTANAS.length - 1]!;
  return null;
}

/** Lo que lee cada pestaña, con el ID de su operación: nada se lee hasta abrirla (CTX-D02). */
export const LECTURAS_DE_LA_PESTANA: Readonly<Record<Pestana, readonly string[]>> = {
  importante: ['API-CTX-01', 'API-HBT-05', 'API-CTX-02'],
  formularios: ['API-CTX-01'],
  cuerpo: ['API-CTX-02', 'API-RES-04'],
  otras: ['API-RES-04', 'API-HBT-07'],
  notas: ['API-NPP-02'],
};

// ─── Lo que se recuerda en el navegador (CTX-D18) ───────────────────────────────────────────────

export interface Preferencia {
  readonly abierto: boolean;
  readonly pestana: Pestana;
}
export const PREFERENCIA_POR_OMISION: Preferencia = { abierto: false, pestana: 'importante' };
export const claveDePreferencia = (area: string): string => `be.contexto-de-la-persona.${area}`;

/** Lee la preferencia; si el almacenamiento falla o trae otra cosa, la de siempre. Nunca lanza. */
export function leerPreferencia(almacen: { getItem(k: string): string | null } | null, area: string): Preferencia {
  try {
    const crudo = almacen?.getItem(claveDePreferencia(area));
    if (!crudo) return PREFERENCIA_POR_OMISION;
    const p = JSON.parse(crudo) as Partial<Preferencia>;
    return { abierto: p.abierto === true, pestana: esPestana(p.pestana) ? p.pestana : 'importante' };
  } catch {
    return PREFERENCIA_POR_OMISION;
  }
}

/** Guarda la preferencia: solo si estaba abierto y la pestaña. Si el almacenamiento falla, no pasa nada. */
export function guardarPreferencia(almacen: { setItem(k: string, v: string): void } | null, area: string, p: Preferencia): void {
  try {
    almacen?.setItem(claveDePreferencia(area), JSON.stringify({ abierto: p.abierto, pestana: p.pestana }));
  } catch {
    // Sin almacenamiento (ventana privada, bloqueado): el panel anda igual.
  }
}

// ─── «Citar» (CTX-D12) ──────────────────────────────────────────────────────────────────────────

export const claveDeCita = (c: { readonly formResponseId: string; readonly fieldCode: string }): string => `${c.formResponseId}#${c.fieldCode}`;

/** Lo que pasó al citar: quedó, ya estaba, se llegó al tope de la evaluación, o es de otra área y la evaluación no la admite. */
export type ResultadoDeCitar = 'citada' | 'ya' | 'tope' | 'otra-area';

/**
 * El renglón que «Citar» suma al fundamento del objetivo: la fuente y la fecha, la pregunta y la respuesta. El objetivo no
 * tiene citas en su contrato (CTX-P07): queda como texto, que el profesional puede editar.
 */
export function lineaParaElFundamento(c: CitaPosible, fecha: (iso: string) => string): string {
  return `${c.fuente.nombre} · ${fecha(c.fuente.fecha)}: ${c.pregunta}: ${c.respuesta}`;
}

/** Suma el renglón al fundamento, en un renglón nuevo; si ya estaba, lo deja como está. */
export function fundamentoConCita(fundamento: string, linea: string): { readonly texto: string; readonly resultado: ResultadoDeCitar } {
  if (fundamento.includes(linea)) return { texto: fundamento, resultado: 'ya' };
  const base = fundamento.replace(/\s+$/, '');
  return { texto: base ? `${base}\n${linea}` : linea, resultado: 'citada' };
}

/** Lo que dice el panel después de citar. */
export function avisoDeCitar(r: ResultadoDeCitar, destino: 'evaluacion' | 'objetivo', maximo: number): string {
  if (r === 'tope') return COPY_CONTEXTO.topeDeCitas(maximo);
  if (r === 'otra-area') return 'La evaluación cita solo las respuestas de su área.';
  if (r === 'ya') return destino === 'evaluacion' ? 'Ya estaba citada en la evaluación.' : 'Ya estaba en el fundamento.';
  return destino === 'evaluacion' ? COPY_CONTEXTO.citadaEnLaEvaluacion : COPY_CONTEXTO.citadaEnElObjetivo;
}
