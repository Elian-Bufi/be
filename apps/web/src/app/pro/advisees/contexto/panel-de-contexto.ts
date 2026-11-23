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

/** El ancho de ventana desde el que el panel va al costado (CTX-D03). A 1920 deja el editor en ~1480 px. */
export const ANCHO_PARA_EL_COSTADO = 1680;
/** El ancho del panel: al costado, fijo; como cajón, hasta el 92 % de la ventana. */
export const ANCHO_DEL_PANEL = 440;

export type ModoDelPanel = 'costado' | 'cajon';
export const modoDelPanel = (anchoDeVentana: number): ModoDelPanel => (anchoDeVentana >= ANCHO_PARA_EL_COSTADO ? 'costado' : 'cajon');

/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-01; E7 de Dirección): en Entrenamiento el contexto de la persona se abre siempre
 * como cajón, por encima: al costado comprimía el editor (que ya tiene su panel contextual). Las otras áreas, como antes.
 */
export const modoDelPanelEnElArea = (area: string, anchoDeVentana: number): ModoDelPanel => (area === 'ENTRENAMIENTO' ? 'cajon' : modoDelPanel(anchoDeVentana));

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

// Lo que lee cada pestaña, recién al abrirla (CTX-D02): «Lo importante», API-CTX-01 y API-HBT-05 (y API-CTX-02 en
// Antropometría); «Formularios», API-CTX-01; «Cuerpo», API-CTX-02; «Otras áreas», API-RES-04 y API-HBT-07 (API-RES-06 al
// pedir el plan); «Notas», API-NPP-02. Lo fija `apps/web/test/contexto-de-la-persona.test.mjs` sobre el panel.

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

// ─── Revisión del PR: qué recibe cada destino, el tope y la versión vista ─────────────────────

/**
 * Lo que recibe cada destino de las citas de un renglón:
 * - la evaluación, solo las de su área (DL-102, DL-179);
 * - el fundamento del objetivo, nunca lo de salud: el objetivo viaja con el plan que la persona comparte (API-RES-06), y el
 *   texto que aceptó promete que lo compartido nunca incluye «lo de salud de tus formularios».
 */
export function citasAdmitidas(destino: { readonly area: 'ENTRENAMIENTO' | 'NUTRICION'; readonly destino: 'evaluacion' | 'objetivo' }, citas: readonly CitaPosible[]): CitaPosible[] {
  return citas.filter((c) => (destino.destino === 'objetivo' ? !c.deSalud : c.area === destino.area));
}

/** Suma al fundamento un renglón por cita, salvo lo de salud (que no llega acá); `citada` si sumó alguno. */
export function fundamentoConCitas(fundamento: string, citas: readonly CitaPosible[], fecha: (iso: string) => string): { readonly texto: string; readonly resultado: ResultadoDeCitar } {
  let texto = fundamento;
  let resultado: ResultadoDeCitar = 'ya';
  for (const c of citas) {
    if (c.deSalud) continue;
    const r = fundamentoConCita(texto, lineaParaElFundamento(c, fecha));
    if (r.resultado === 'citada') {
      texto = r.texto;
      resultado = 'citada';
    }
  }
  return { texto, resultado };
}

/** Lo mínimo de una cita en una evaluación: la respuesta, el campo y la versión que se vio. */
export interface ReferenciaCitada {
  readonly formResponseId: string;
  readonly fieldCode: string;
  readonly expectedVersion: string;
}

/** La clave con la versión vista: «Citada» solo si lo citado es lo que se ve ahora en el panel. */
export const claveDeCitaVista = (c: ReferenciaCitada): string => `${claveDeCita(c)}@${c.expectedVersion}`;

/**
 * Suma a la lista de una evaluación las citas de un renglón (la respuesta y su detalle), todas o ninguna:
 * - la que ya está con la misma versión no cambia nada;
 * - la que está con otra versión (la persona la corrigió y se volvió a leer, o después de un 409) se reemplaza en su lugar
 *   y no cuenta para el tope;
 * - las nuevas van al final si entran todas; si no, no se suma ninguna (`tope`).
 * Revisión del PR: el receptor decidía cita por cita con la lista de antes de citar; con 19, un renglón con detalle dejaba
 * 21 y la API respondía un 400. Y una cita que cambió no se podía volver a citar: el botón decía «Citada».
 */
export function sumarCitas<T extends ReferenciaCitada>(lista: readonly T[], nuevas: readonly T[], maximo: number): { readonly lista: readonly T[]; readonly resultado: ResultadoDeCitar } {
  const reemplazos = new Map<string, T>();
  const agregadas: T[] = [];
  for (const c of nuevas) {
    const clave = claveDeCita(c);
    const antes = lista.find((x) => claveDeCita(x) === clave);
    if (antes) {
      if (antes.expectedVersion !== c.expectedVersion) reemplazos.set(clave, c);
    } else if (!agregadas.some((x) => claveDeCita(x) === clave)) agregadas.push(c);
  }
  if (lista.length + agregadas.length > maximo) return { lista, resultado: 'tope' };
  if (reemplazos.size === 0 && agregadas.length === 0) return { lista, resultado: 'ya' };
  return { lista: [...lista.map((x) => reemplazos.get(claveDeCita(x)) ?? x), ...agregadas], resultado: 'citada' };
}

/** Las citas que la API dice que cambiaron (409 `VERSION_CONFLICT`, `formResponseReferences[i].expectedVersion`), por su clave. */
export function citasQueCambiaron(enviadas: readonly { readonly formResponseId: string; readonly fieldCode: string }[], issues: readonly { readonly path?: string | null }[]): string[] {
  return issues.flatMap((x) => {
    const m = /^formResponseReferences\[(\d+)\]/.exec(x.path ?? '');
    const c = m ? enviadas[Number(m[1])] : undefined;
    return c ? [claveDeCita(c)] : [];
  });
}

/** Lo que dice el panel después de citar. */
export function avisoDeCitar(r: ResultadoDeCitar, destino: 'evaluacion' | 'objetivo', maximo: number): string {
  if (r === 'tope') return COPY_CONTEXTO.topeDeCitas(maximo);
  if (r === 'otra-area') return 'La evaluación cita solo las respuestas de su área.';
  if (r === 'ya') return destino === 'evaluacion' ? 'Ya estaba citada en la evaluación.' : 'Ya estaba en el fundamento.';
  return destino === 'evaluacion' ? COPY_CONTEXTO.citadaEnLaEvaluacion : COPY_CONTEXTO.citadaEnElObjetivo;
}
