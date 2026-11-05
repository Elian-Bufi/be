/**
 * APK · los hábitos de la persona (DL-165 D-9; WP-FORMULARIOS-RONDA-2, FR-10): la lógica pura detrás de «Mis hábitos»,
 * de la tarjeta de Inicio y de «¿Sigue igual?» en un formulario. `habitos-en-el-telefono.test.ts` la prueba sin teléfono;
 * las pantallas solo dibujan y llaman a la API.
 *
 * - **A quién preguntar:** con la autorización activa, a cada profesional que empezó a acompañar a la persona después
 *   (`NOT_ASKED`) y tiene el vínculo aceptado. Sin respuesta, no los ve (§4.3).
 * - **El cuerpo de API-HBT-03 sale de lo que la persona vio:** al compartir, los profesionales con el vínculo aceptado,
 *   todos marcados de entrada; al cambiar con quiénes, todos sus profesionales; al responder por uno nuevo, la lista de
 *   hoy con ese o sin él. Los desmarcados que se mostraron van como `declinedProfessionalIds`: la persona ya decidió, y
 *   la app no le vuelve a preguntar por ellos.
 * - **Ampliar pide el texto** (08 C-12): compartir por primera vez o de nuevo, sumar a alguien que hoy no los recibe, o
 *   un texto vigente distinto del que aceptó. Sacar a alguien no amplía nada.
 * - **«¿Sigue igual?»** (D-18): una solicitud nueva cuya versión trae la parte «Tus hábitos» se abre con lo vigente de lo
 *   que pide, en el teléfono de la persona. Nunca sobre una respuesta, lo cargado por el profesional o un borrador.
 */
import {
  camposVisibles,
  COPY_HABITOS,
  CompartirHabitosRequestSchema,
  precargaDeHabitos,
  resumenDeValor,
  traeLaParteDeHabitos,
  type CompartirHabitosRequest,
  type MisHabitosResponse,
  type ProfesionalParaHabitos,
  type RespuestaDeCampoV2Entrada,
  type Resultado,
  type SeccionDePlantillaV2,
  type SolicitudAValidar,
  type VersionDeHabitos,
} from '@be/domain';

const A = COPY_HABITOS.apk;

export type MisHabitos = MisHabitosResponse['data'];
type ConLaAutorizacion = Pick<MisHabitos, 'sharing' | 'professionals'>;

// ─── A quién preguntar ───────────────────────────────────────────────────────────────────────────

/** Los profesionales por los que la app pregunta: autorización activa, `NOT_ASKED` y vínculo aceptado. */
export function aQuienesPreguntar(d: ConLaAutorizacion): ProfesionalParaHabitos[] {
  if (d.sharing.status !== 'ACTIVE') return [];
  return d.professionals.filter((p) => p.sharing === 'NOT_ASKED' && p.link === 'ACTIVE');
}

/** La pregunta de la tarjeta de Inicio: el primero por el que hay que preguntar, o `null` (y la tarjeta no se dibuja). */
export const preguntaDeInicio = (d: ConLaAutorizacion): ProfesionalParaHabitos | null => aQuienesPreguntar(d)[0] ?? null;

/** Quiénes los reciben hoy, en el orden de la lista. */
export function quienesLosReciben(d: ConLaAutorizacion): string[] {
  return d.professionals.filter((p) => p.sharing === 'RECEIVES').map((p) => p.professional.identityId);
}

/** Los que se ofrecen al compartir: los que tienen el vínculo aceptado (un vínculo en pausa no se ofrece). */
export function ofrecidosAlCompartir(d: ConLaAutorizacion): ProfesionalParaHabitos[] {
  return d.professionals.filter((p) => p.link === 'ACTIVE');
}

/** Al compartir, todos los ofrecidos vienen marcados (§4.3); al cambiar con quiénes, los que hoy los reciben. */
export const marcadosAlCompartir = (d: ConLaAutorizacion): Set<string> => new Set(ofrecidosAlCompartir(d).map((p) => p.professional.identityId));
export const marcadosAlCambiar = (d: ConLaAutorizacion): Set<string> => new Set(quienesLosReciben(d));

// ─── El cuerpo de API-HBT-03 ────────────────────────────────────────────────────────────────────

export type ActoDeCompartir =
  | { readonly tipo: 'compartir'; readonly marcados: ReadonlySet<string> }
  | { readonly tipo: 'cambiar'; readonly marcados: ReadonlySet<string> }
  | { readonly tipo: 'sumar'; readonly profesionalId: string }
  | { readonly tipo: 'no-sumar'; readonly profesionalId: string };

/** Los que se mostraron en cada acto: de ahí salen los marcados y los desmarcados. */
function mostrados(d: ConLaAutorizacion, acto: ActoDeCompartir): string[] {
  if (acto.tipo === 'compartir') return ofrecidosAlCompartir(d).map((p) => p.professional.identityId);
  if (acto.tipo === 'cambiar') return d.professionals.map((p) => p.professional.identityId);
  return [acto.profesionalId];
}

export function pedidoDeCompartir(d: ConLaAutorizacion & Pick<MisHabitos, 'text'>, acto: ActoDeCompartir): CompartirHabitosRequest {
  const base = { expectedVersion: d.sharing.version, textVersionId: d.text.id };
  if (acto.tipo === 'compartir' || acto.tipo === 'cambiar') {
    const vistos = mostrados(d, acto);
    return { ...base, professionalIds: vistos.filter((id) => acto.marcados.has(id)), declinedProfessionalIds: vistos.filter((id) => !acto.marcados.has(id)) };
  }
  const hoy = quienesLosReciben(d).filter((id) => id !== acto.profesionalId);
  return acto.tipo === 'sumar'
    ? { ...base, professionalIds: [...hoy, acto.profesionalId], declinedProfessionalIds: [] }
    : { ...base, professionalIds: hoy, declinedProfessionalIds: [acto.profesionalId] };
}

/**
 * Si el pedido se puede mandar como está: la API pide al menos un profesional que los reciba. Con la autorización activa
 * y nadie que los reciba hoy (todos terminaron su vínculo), «No, por ahora» no tiene lista que mandar: no se ofrece, y no
 * responder deja a ese profesional sin verlos.
 */
export const pedidoEnviable = (pedido: CompartirHabitosRequest): boolean => CompartirHabitosRequestSchema.safeParse(pedido).success;

/**
 * Si el acto pide leer el texto y aceptarlo antes de mandarlo: compartir (la autorización no está activa), sumar a alguien
 * que hoy no los recibe, o un texto vigente distinto del que se aceptó. Sacar a alguien no amplía (08 C-12).
 */
export function pideElTexto(d: ConLaAutorizacion & Pick<MisHabitos, 'text'>, pedido: Pick<CompartirHabitosRequest, 'professionalIds'>): boolean {
  if (d.sharing.status !== 'ACTIVE' || d.sharing.acceptedTextVersionId !== d.text.id) return true;
  const hoy = new Set(quienesLosReciben(d));
  return pedido.professionalIds.some((id) => !hoy.has(id));
}

/** Lo que se le dice a la persona cuando un pedido de compartir salió bien. */
export function exitoDeCompartir(d: ConLaAutorizacion, acto: ActoDeCompartir): string {
  if (acto.tipo === 'compartir') return A.compartidos;
  if (acto.tipo === 'cambiar') return A.cambiosGuardados;
  const nombre = d.professionals.find((p) => p.professional.identityId === acto.profesionalId)?.professional.displayName ?? '';
  return acto.tipo === 'sumar' ? A.nuevoSumado(nombre) : A.nuevoNoSumado(nombre);
}

/**
 * Un rechazo de API-HBT-03 o 04 que pide volver a leer, con lo que se le dice: lo que la pantalla mostró ya no es lo que
 * hay (otra versión de la autorización, un profesional que ya no la acompaña, un texto nuevo). `null`: otro fallo, que
 * decide `falloDe`.
 */
export function rechazoDeCompartir(r: Resultado<unknown>): string | null {
  if (r.ok || r.tipo !== 'API') return null;
  if (r.codigo === 'VERSION_CONFLICT' || r.codigo === 'CONSENT_VERSION_STALE') return A.cambioLaAutorizacion;
  if (r.codigo === 'HABITS_RECIPIENT_NOT_AVAILABLE') return A.profesionalNoDisponible;
  return null;
}

// ─── En palabras ────────────────────────────────────────────────────────────────────────────────

export interface LineaDeHabito {
  readonly fieldCode: string;
  readonly etiqueta: string;
  readonly valor: string;
}

/** Lo que la persona contó, en palabras y con las etiquetas de la parte: solo lo respondido que se ve. */
export function habitosEnPalabras(seccion: SeccionDePlantillaV2, respuestas: readonly RespuestaDeCampoV2Entrada[]): LineaDeHabito[] {
  const visibles = camposVisibles([seccion], respuestas);
  const porCampo = new Map(respuestas.map((r) => [r.fieldCode, r.answer] as const));
  return seccion.fields.flatMap((c) => {
    const valor = porCampo.get(c.fieldCode);
    return valor && visibles.has(c.fieldCode) ? [{ fieldCode: c.fieldCode, etiqueta: c.label, valor: resumenDeValor(c, valor) }] : [];
  });
}

/** Las áreas de un profesional, en palabras: «Nutrición», «Nutrición y Entrenamiento». */
export function areasEnPalabras(p: Pick<ProfesionalParaHabitos, 'scopes'>): string {
  const nombres = p.scopes.map((s) => s.label);
  return nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)!}`;
}

/** Lo que la autorización dice de un profesional, en palabras, para «Quiénes los ven». */
export function estadoEnPalabras(p: Pick<ProfesionalParaHabitos, 'sharing' | 'link' | 'sharedSince'>, dia: (iso: string) => string): string {
  if (p.sharing === 'RECEIVES') {
    if (p.link === 'PAUSED') return A.enPausa;
    return p.sharedSince ? `${A.losVe} · ${A.desde(dia(p.sharedSince))}` : A.losVe;
  }
  return p.sharing === 'NOT_ASKED' ? A.empezoDespues : A.noLosVe;
}

// ─── «¿Sigue igual?» en un formulario (D-18) ────────────────────────────────────────────────────

/**
 * Si al abrir una solicitud se ofrece lo vigente de «Tus hábitos»: sin respuesta (no es una corrección), sin nada cargado
 * por el profesional, sin lo escrito o recuperado del teléfono, pendiente, respondable y con la parte en su versión.
 */
export function seOfrecePrecargaDeHabitos(
  detalle: { readonly response: unknown | null; readonly proposal: unknown | null; readonly respondable: boolean; readonly status: 'PENDING' | 'RESPONDED' },
  secciones: readonly SeccionDePlantillaV2[],
  yaHayAlgoEscrito: boolean,
): boolean {
  return detalle.response === null && detalle.proposal === null && detalle.respondable && detalle.status === 'PENDING' && !yaHayAlgoEscrito && traeLaParteDeHabitos(secciones);
}

/** Lo que se precarga y de cuándo es (para «Ya lo respondiste el …»), o `null` si no hay vigente o nada de lo que pide. */
export function precargaDelFormulario(
  secciones: readonly SeccionDePlantillaV2[],
  solicitud: Pick<SolicitudAValidar, 'requestedFieldCodes'>,
  vigente: Pick<VersionDeHabitos, 'answers' | 'recordedAt'> | null,
): { readonly respuestas: RespuestaDeCampoV2Entrada[]; readonly desde: string } | null {
  if (!vigente) return null;
  const respuestas = precargaDeHabitos(secciones, solicitud, vigente.answers.map((a) => ({ fieldCode: a.fieldCode, answer: a.answer })));
  return respuestas.length > 0 ? { respuestas, desde: vigente.recordedAt } : null;
}
