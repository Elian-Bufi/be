/**
 * «Sumar «Tus hábitos»» en «Pedir información» (WP-FORMULARIOS-RONDA-2, ronda 2.1; DL-165 D-15 nueva, D-22), sin React,
 * probado en `apps/web/test/sumar-habitos.test.mjs`.
 *
 * Desde la ronda 2.1 los hábitos son un formulario aparte («Tus hábitos», FRM-HABITOS v2), y los de área ya no los traen
 * («Cómo comés hoy» v3, «Antes de entrenar» v4). Al pedir uno de área, el cajón ofrece sumar el de hábitos en el mismo paso:
 * - **Cuándo se ofrece:** el formulario elegido tiene área propia, su versión no trae la parte «Tus hábitos» y el catálogo
 *   trae «Tus hábitos». Si API-HBT-07 responde el 404 de lo inexistente (hoy no acompaña a la persona con el acceso
 *   vigente), no se ofrece: el pedido de área va a recibir el mismo 404, y la casilla no agregaría nada.
 * - **Qué viene marcado** lo decide el dominio (`sugerenciaDeSumarHabitos`) con lo que devuelve API-HBT-07, que sale solo de
 *   lo que este profesional ya puede ver: marcada si no ve ningún hábito o lo que ve tiene más de 3 meses; sin marcar, con su
 *   fecha, si son recientes o si ya tiene uno pendiente. Mientras se lee, o si la lectura falla, viene sin marcar y sin
 *   motivo: no se afirma nada que no se sabe, y no se manda nada que el profesional no eligió.
 * - **Cómo se envían las dos:** primero la de área, como siempre; si salió, la de «Tus hábitos», con todas sus preguntas
 *   (las que la plantilla trae pedidas), requeridas las que sugiere, el «para qué» de la plantilla y la misma área. Cada una
 *   con su clave de idempotencia. Si falla la primera no se manda la segunda; si falla la segunda, se dice cuál quedó.
 */
import { camposEnOrden, CLAVE_DEL_FORMULARIO_DE_HABITOS, COPY_FORMULARIOS, COPY_HABITOS, sugerenciaDeSumarHabitos, traeLaParteDeHabitos, type Alcance, type HabitosParaElProfesionalResponse, type Plantilla, type SugerenciaDeHabitos, type VersionDePlantillaV2 } from '@be/domain';

const H = COPY_HABITOS.web;

/** Lo que devuelve API-HBT-07: lo que este profesional sabe de los hábitos de la persona. */
export type LoQueSabeDeLosHabitos = HabitosParaElProfesionalResponse['data'];

/** La lectura de API-HBT-07 para el cajón. `sin-acceso` es el 404 de lo inexistente. */
export type LecturaDeLoQueSabe = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly datos: LoQueSabeDeLosHabitos } | { readonly tipo: 'sin-acceso' } | { readonly tipo: 'fallo' };

/**
 * «Tus hábitos» del catálogo, si se ofrece sumarlo al formulario elegido; `null` si no. Se ofrece con un formulario de área
 * propia que no trae la parte, si el catálogo trae «Tus hábitos» y si API-HBT-07 no dio el 404 de lo inexistente.
 */
export function habitosParaSumar(p: {
  readonly version: Pick<VersionDePlantillaV2, 'key' | 'domain' | 'sections'> | null;
  readonly catalogo: readonly Plantilla[] | null;
  readonly lectura: LecturaDeLoQueSabe | null;
}): Plantilla | null {
  if (!p.version || p.version.domain === null || p.version.key === CLAVE_DEL_FORMULARIO_DE_HABITOS || traeLaParteDeHabitos(p.version.sections)) return null;
  if (p.lectura?.tipo === 'sin-acceso') return null;
  return p.catalogo?.find((x) => x.key === CLAVE_DEL_FORMULARIO_DE_HABITOS && x.status === 'SELECTABLE') ?? null;
}

/** La sugerencia del dominio con lo que devolvió API-HBT-07; `null` mientras se lee o si la lectura falló. */
export function sugerenciaDelCajon(lectura: LecturaDeLoQueSabe | null, ahora: string): SugerenciaDeHabitos | null {
  if (lectura?.tipo !== 'listo') return null;
  return sugerenciaDeSumarHabitos({ vistosEl: lectura.datos.latestSeenAt, pendienteDesde: lectura.datos.pendingHabitsRequestSince, ahora });
}

/** La casilla viene marcada solo si el dominio lo sugiere; sin saberlo, sin marcar. */
export const marcadaPorOmision = (sugerencia: SugerenciaDeHabitos | null): boolean => sugerencia?.marcada ?? false;

/** El motivo que se dice junto a la casilla, con su fecha; `null` sin sugerencia. */
export function motivoDeLaSugerencia(sugerencia: SugerenciaDeHabitos | null, fecha: (iso: string) => string): string | null {
  if (!sugerencia) return null;
  if (sugerencia.motivo === 'SIN_HABITOS' || sugerencia.desde === null) return H.sugerencia.SIN_HABITOS();
  return H.sugerencia[sugerencia.motivo](fecha(sugerencia.desde));
}

/**
 * El cuerpo de FRM-03 para «Tus hábitos», en el área del pedido: lo mismo que viene marcado al elegirlo solo en el cajón
 * (`marcadoPorOmision`): todas las preguntas que la plantilla trae pedidas y, requeridas, las que sugiere. Sin imports
 * relativos, para que la prueba lo cargue con Node.
 */
export function pedidoDeHabitos(version: Pick<VersionDePlantillaV2, 'templateVersionId' | 'sections'>, area: Alcance) {
  const pedidas = camposEnOrden(version.sections).filter((c) => c.requestedByDefault !== false);
  return {
    templateVersionId: version.templateVersionId,
    purpose: H.propositoDelFormulario,
    scope: area,
    requestedFieldCodes: pedidas.map((c) => c.fieldCode),
    requiredFieldCodes: pedidas.filter((c) => c.requiredByDefault).map((c) => c.fieldCode),
  };
}

/** Cómo terminó cada envío, con el motivo ya dicho para el profesional. `incierto`: no se sabe si llegó. */
export type DesenlaceDeEnvio = { readonly ok: true } | { readonly ok: false; readonly incierto: boolean; readonly motivo: string };

/**
 * Lo que se le dice al profesional después de enviar. Un fallo de la de área se dice en el cajón, que queda abierto (y si
 * la casilla estaba marcada y se sabe que no llegó, que no se envió ninguna); los demás desenlaces, en la página.
 */
export function mensajeDelEnvio(p: {
  readonly formulario: string;
  /** Si la casilla «Sumar «Tus hábitos»» estaba marcada. */
  readonly sumaHabitos: boolean;
  readonly area: DesenlaceDeEnvio;
  /** El desenlace de «Tus hábitos», si se mandó (solo después de que salió la de área). */
  readonly habitos: DesenlaceDeEnvio | null;
}): { readonly donde: 'cajon' | 'pagina'; readonly texto: string } {
  if (!p.area.ok) {
    // Sin saber si la de área llegó, no se puede decir que no se envió ninguna: se dice lo de siempre, y el reintento usa la misma clave.
    const prefijo = p.sumaHabitos && !p.area.incierto ? `${H.noSeEnvioNinguna(p.formulario)} ` : '';
    return { donde: 'cajon', texto: `${prefijo}${p.area.motivo}` };
  }
  if (!p.sumaHabitos || p.habitos === null) return { donde: 'pagina', texto: COPY_FORMULARIOS.solicitudEnviada };
  if (p.habitos.ok) return { donde: 'pagina', texto: H.enviadasLasDos(p.formulario) };
  return { donde: 'pagina', texto: p.habitos.incierto ? H.habitosSinConfirmar(p.formulario) : H.noSeEnvioHabitos(p.formulario, p.habitos.motivo) };
}
