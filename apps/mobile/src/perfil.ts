/**
 * Perfil (PV-1 y PV-6, decisiones de Dirección del 2026-11-07; AV-02 a AV-04 y AV-17 de WP-APP-VUELTA-DE-ROSCA, DL-166),
 * como lógica pura: qué bloques muestra, qué cuenta «Para responder», cuándo lleva la marca la pestaña, y la tabla «dónde
 * quedó cada cosa» de lo que antes estaba en «Información», en Cuenta y en el menú de la cabecera.
 *
 * Perfil reemplaza a «Información» como quinto destino de la barra y absorbe Cuenta (antes detrás del avatar) y el menú.
 * Cada cosa queda en un solo lugar. Perfil no escribe: cada dato se lee con la misma operación y el mismo permiso que en
 * su módulo, y para cambiar algo lleva a la pantalla de siempre.
 */
import { referenciaNeutral, type MisHabitosResponse, type PedidoDeAccesoParaLaPersona, type SolicitudPropiaV2 } from '@be/domain';
import type { VistaConPliegue } from './desplegable';
import { aQuienesPreguntarSinPedido, pedidosEnOrden } from './habitos-en-el-telefono';
import type { Ruta } from './navegacion';
import { TEXTOS_DE_LA_VUELTA as T } from './textos-de-la-vuelta';

// ─── «Para responder» y la marca de Perfil (AV-04) ───────────────────────────────────────────────

/** Una fila de «Para responder»: un formulario, un pedido de hábitos, o la pregunta por un profesional nuevo. */
export type FilaParaResponder =
  | { readonly tipo: 'formulario'; readonly id: string; readonly titulo: string; readonly quien: string; readonly desde: string; readonly paraConfirmar: boolean; readonly respondable: boolean }
  | { readonly tipo: 'pedido-de-habitos'; readonly id: string; readonly quien: string; readonly area: string; readonly desde: string }
  | { readonly tipo: 'profesional-nuevo'; readonly id: string; readonly quien: string };

/**
 * Lo que hay para responder, igual en Inicio y en Perfil (AV-04): las solicitudes de formulario pendientes (con o sin
 * algo cargado por el profesional para confirmar) y los pedidos de ver tus hábitos. Si no hay pedidos, la pregunta por un
 * profesional nuevo que todavía no recibe tus hábitos, como hacía la tarjeta de Inicio (DL-165 D-17). Lo que no se leyó
 * (`null`) no suma: no se afirma que no hay nada sin saberlo, y quien llama decide si mostrar la cuenta.
 */
export function paraResponder(
  formularios: readonly SolicitudPropiaV2[] | null,
  habitos: Pick<MisHabitosResponse['data'], 'sharing' | 'professionals'> | null,
  pedidos: readonly PedidoDeAccesoParaLaPersona[] | null,
): FilaParaResponder[] {
  const filas: FilaParaResponder[] = [];
  for (const s of formularios ?? []) {
    if (s.status !== 'PENDING') continue;
    filas.push({ tipo: 'formulario', id: s.formRequestId, titulo: s.templateName, quien: s.professional.displayName, desde: s.createdAt, paraConfirmar: s.pendingProposal !== null, respondable: s.respondable });
  }
  const enOrden = pedidosEnOrden(pedidos ?? []);
  for (const p of enOrden) filas.push({ tipo: 'pedido-de-habitos', id: p.accessRequestId, quien: p.professional.displayName, area: p.scope.label, desde: p.requestedAt });
  if (enOrden.length === 0 && habitos) {
    const nuevo = aQuienesPreguntarSinPedido(habitos, [])[0];
    if (nuevo) filas.push({ tipo: 'profesional-nuevo', id: nuevo.professional.identityId, quien: nuevo.professional.displayName });
  }
  return filas;
}

/**
 * La marca de la pestaña Perfil (PV-6): un punto sin número mientras haya algo para responder. No se va por abrir Perfil:
 * se va cuando la fila se responde o se dice que no (un pedido de hábitos ya tiene su «No, por ahora»; decir que no a un
 * formulario llega con AV-19, y hasta entonces un formulario saca la marca solo al responderse). TalkBack lo dice en
 * palabras: el punto no es la única señal.
 */
export function marcaDePerfil(filas: readonly FilaParaResponder[]): { readonly visible: boolean; readonly paraLeer: string | null } {
  return filas.length > 0 ? { visible: true, paraLeer: T.hayAlgoParaResponder } : { visible: false, paraLeer: null };
}

/** «Un formulario y un pedido de hábitos»: lo que hay para responder, en palabras, para la fila de Perfil. */
export function detalleDeParaResponder(filas: readonly FilaParaResponder[]): string {
  const formularios = filas.filter((f) => f.tipo === 'formulario').length;
  const pedidos = filas.length - formularios;
  return filas.length === 0 ? T.nadaParaResponder : T.unFormularioYUnPedido(formularios, pedidos);
}

// ─── Los bloques de Perfil (AV-03, AV-17) ────────────────────────────────────────────────────────

/** Lo que Perfil sabe al armarse. Cada parte puede faltar mientras se lee (`undefined`) o si no se pudo. */
export interface DatosDePerfil {
  readonly nombre: string | null | undefined;
  readonly identificador: string | undefined;
  /** Los profesionales con un vínculo sin terminar: su nombre, su área y desde cuándo. */
  readonly profesionales: readonly { readonly id: string; readonly nombre: string; readonly area: string; readonly desde: string; readonly enPausa: boolean }[] | undefined;
  readonly paraResponder: readonly FilaParaResponder[] | undefined;
  readonly respondidos: number | undefined;
  /** Cuántos profesionales reciben tus hábitos, y si los contaste. */
  readonly habitos: { readonly cargados: boolean; readonly losReciben: number } | undefined;
}

export type BloqueDePerfil = 'quien-sos' | 'tu-informacion' | 'tus-profesionales' | 'formularios-y-pedidos' | 'ajustes';
export type Ajuste = 'apariencia' | 'avisos' | 'privacidad' | 'tus-datos' | 'ayuda-y-contacto' | 'sesion' | 'cerrar-mi-cuenta';

/** Los bloques de Perfil, en orden (maqueta 02): quién sos, tu información, tus profesionales, formularios y ajustes. */
export const BLOQUES_DE_PERFIL: readonly BloqueDePerfil[] = ['quien-sos', 'tu-informacion', 'tus-profesionales', 'formularios-y-pedidos', 'ajustes'];

/** Los ajustes, con Cerrar mi cuenta al final y en su color (maqueta 02). Apariencia se cambia ahí mismo. */
// UF-06 (DL-169): «Tus datos», después de Privacidad.
// UF-07 (DL-169): «Ayuda y contacto», después de «Tus datos».
export const AJUSTES_DE_PERFIL: readonly Ajuste[] = ['apariencia', 'avisos', 'privacidad', 'tus-datos', 'ayuda-y-contacto', 'sesion', 'cerrar-mi-cuenta'];

/**
 * El nombre de quién sos: el visible (DL-009, DL-040). Desde DL-169 (WP-USO-FINAL, UF-01) es obligatorio, y una cuenta sin
 * nombre lo completa en «Antes de seguir» antes de llegar acá, así que Perfil ya no ofrece agregarlo. Si igual llega sin
 * él (entró sin conexión y la app no pudo preguntar), se ve la referencia con que la ven sus profesionales, hasta que la
 * app pueda preguntar. Mientras se lee, o sin el identificador para la referencia, nada.
 */
export function nombreEnPerfil(nombre: string | null | undefined, identificador: string | undefined): string | null {
  if (nombre === undefined) return null;
  if (nombre && nombre.trim()) return nombre.trim();
  return identificador ? referenciaNeutral(identificador) : null;
}

/** Lo que dice la baldosa de «Mis hábitos», en palabras (AV-17: cada baldosa dice su estado, sin ceros). */
export function estadoDeMisHabitos(h: DatosDePerfil['habitos']): string | null {
  if (!h) return null;
  if (!h.cargados) return T.habitosSinCargar;
  return h.losReciben === 0 ? T.habitosSinCompartir : T.habitosLosVen(h.losReciben);
}

/** Las cuatro baldosas de «Tu información», con su destino. */
export function baldosasDePerfil(d: Pick<DatosDePerfil, 'habitos'>): readonly { readonly titulo: string; readonly detalle: string | null; readonly icono: 'persona' | 'habitos' | 'ver' | 'reportado'; readonly ruta: Ruta }[] {
  return [
    { titulo: T.misDatos, detalle: T.misDatosDetalle, icono: 'persona', ruta: { nombre: 'cuenta', seccion: 'datos' } },
    { titulo: T.misHabitos, detalle: estadoDeMisHabitos(d.habitos), icono: 'habitos', ruta: { nombre: 'mis-habitos' } },
    { titulo: T.quienVeQue, detalle: T.quienVeQueDetalle, icono: 'ver', ruta: { nombre: 'quien-ve-que' } },
    { titulo: T.notasEntreEllos, detalle: T.notasEntreEllosDetalle, icono: 'reportado', ruta: { nombre: 'notas-de-coordinacion' } },
  ];
}

/** Las filas de «Formularios y pedidos»: «Para responder» con su cuenta, y «Respondidos» solo si hay alguno (AV-17). */
export function filasDeFormularios(d: Pick<DatosDePerfil, 'paraResponder' | 'respondidos'>): readonly { readonly que: 'para-responder' | 'respondidos'; readonly titulo: string; readonly detalle: string | null; readonly cuenta: number | null }[] {
  const filas: { que: 'para-responder' | 'respondidos'; titulo: string; detalle: string | null; cuenta: number | null }[] = [];
  const pr = d.paraResponder;
  filas.push({ que: 'para-responder', titulo: T.paraResponder, detalle: pr ? detalleDeParaResponder(pr) : null, cuenta: pr && pr.length > 0 ? pr.length : null });
  if (d.respondidos === undefined || d.respondidos > 0) filas.push({ que: 'respondidos', titulo: T.respondidos, detalle: null, cuenta: d.respondidos ?? null });
  return filas;
}

/** Qué deja a la vista Perfil y qué pliega (III.7): Perfil no pliega nada; el detalle está en cada destino. */
export const PLIEGUE_DE_PERFIL: VistaConPliegue = { nombre: 'Perfil', visible: ['quien', 'estado', 'fecha', 'si-se-puede-responder'], plegado: [] };

// ─── Dónde quedó cada cosa (AV-02, AV-03; TEST-AVR-003) ─────────────────────────────────────────

export interface Mudanza {
  /** Lo que era. */
  readonly que: string;
  /** Dónde estaba. */
  readonly antes: 'menu' | 'cuenta' | 'informacion';
  /** Dónde está ahora, en palabras. */
  readonly ahora: string;
  /** El archivo del lugar nuevo y lo que en él abre la pantalla. */
  readonly archivo: string;
  readonly abre: string;
}

/**
 * Cada entrada del menú auxiliar, de Cuenta y de «Información», con su lugar nuevo. Ninguna se pierde y cada una queda en
 * uno solo (la prueba busca el enlace en el archivo del lugar nuevo).
 */
export const DONDE_QUEDO_CADA_COSA: readonly Mudanza[] = [
  { que: 'Vínculos', antes: 'menu', ahora: 'Perfil · Tus profesionales · Vínculos y solicitudes', archivo: 'pantallas/perfil.tsx', abre: "ir({ nombre: 'vinculos' })" },
  { que: 'Tu historial de entrenamiento', antes: 'menu', ahora: 'Entrenamiento · pestaña Historial', archivo: 'pantallas/entrenamiento.tsx', abre: "valor: 'HISTORIAL'" },
  { que: 'Registros nutricionales', antes: 'menu', ahora: 'Nutrición · pestaña Registros', archivo: 'pantallas/nutricion.tsx', abre: "visible === 'REGISTROS'" },
  { que: 'Notas entre tus profesionales', antes: 'cuenta', ahora: 'Perfil · Tu información', archivo: 'perfil.ts', abre: "ruta: { nombre: 'notas-de-coordinacion' }" },
  { que: 'Tengo un código', antes: 'cuenta', ahora: 'Perfil · al pie de Tus profesionales', archivo: 'pantallas/perfil.tsx', abre: "ir({ nombre: 'invitacion' })" },
  { que: 'Estado de la cuenta', antes: 'cuenta', ahora: 'Perfil · Mis datos', archivo: 'pantallas/cuenta.tsx', abre: "seccion === 'datos'" },
  { que: 'Tu nombre', antes: 'cuenta', ahora: 'Perfil · Mis datos (y arriba, en quién sos)', archivo: 'pantallas/cuenta.tsx', abre: '<SeccionDeTuNombre' },
  { que: 'Tu identificador BE', antes: 'cuenta', ahora: 'Perfil · quién sos, con «Compartir»', archivo: 'pantallas/perfil.tsx', abre: 'Share.share' },
  { que: 'Privacidad y consentimientos', antes: 'cuenta', ahora: 'Perfil · Ajustes', archivo: 'pantallas/perfil.tsx', abre: "ir({ nombre: 'privacidad' })" },
  { que: 'Apariencia', antes: 'cuenta', ahora: 'Perfil · Ajustes, ahí mismo', archivo: 'pantallas/perfil.tsx', abre: '<SelectorDeApariencia' },
  { que: 'Avisos en este teléfono', antes: 'cuenta', ahora: 'Perfil · Ajustes · Avisos', archivo: 'pantallas/perfil.tsx', abre: "ir({ nombre: 'cuenta', seccion: 'avisos' })" },
  { que: 'Seguridad (cerrar sesión)', antes: 'cuenta', ahora: 'Perfil · Ajustes · Sesión y este teléfono', archivo: 'pantallas/perfil.tsx', abre: "ir({ nombre: 'cuenta', seccion: 'sesion' })" },
  { que: 'Cerrar mi cuenta', antes: 'cuenta', ahora: 'Perfil · Ajustes, al final', archivo: 'pantallas/perfil.tsx', abre: "ir({ nombre: 'cuenta', seccion: 'cierre' })" },
  { que: 'Información que me pidieron (la bandeja)', antes: 'informacion', ahora: 'Perfil · Formularios y pedidos', archivo: 'pantallas/perfil.tsx', abre: "ir({ nombre: 'mis-solicitudes' })" },
  { que: 'Mis hábitos', antes: 'informacion', ahora: 'Perfil · Tu información', archivo: 'perfil.ts', abre: "ruta: { nombre: 'mis-habitos' }" },
];
