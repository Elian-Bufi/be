/**
 * APK · WP-COMPARTIR (DL-176): las decisiones de la pantalla única de consentimiento, de la tarjeta para quien ya tiene
 * vínculos y de lo que suma «Quién ve qué», como lógica pura (las prueba `compartir-en-el-telefono.test.ts`, TEST-CMP-040
 * a 047). Las piezas que las dibujan están en `compartir.tsx` y en `pantallas/consentimiento.tsx`.
 *
 * - **Qué se marca al entrar:** lo que la API trae preseleccionado (lo que la persona nunca decidió), coherente: lo que pide
 *   el A3, solo con el A3 (dado o marcado).
 * - **Qué manda el toque:** la versión que se vio, los textos de lo marcado (la mostrada es la aceptada) y las claves.
 * - **Qué se dice de cada cosa:** qué, de quién, para quién y para qué, en una línea; nunca «todos tus datos».
 * - **La tarjeta, una sola vez:** se muestra si hay algo de lo de otras áreas, la historia anterior o los hábitos para
 *   compartir marcado, y deja de mostrarse en este teléfono, para esa cuenta, en cuanto la persona toca cualquiera de sus
 *   dos botones.
 */
import {
  COPY,
  COPY_COMPARTIR as C,
  COPY_VINCULO,
  ETIQUETA_DE_FINALIDAD,
  FINALIDAD_DE_ALCANCE,
  PIDEN_EL_A3,
  enumerarNombres,
  type CompartirLoElegidoRequest,
  type LoQueSePuedeCompartirResponse,
  type PedidoDeAccesoParaLaPersona,
  type PedidoDePlanParaLaPersona,
  type Resultado,
} from '@be/domain';
import type { AlmacenDeTexto } from './descanso-automatico';

export type Propuesta = LoQueSePuedeCompartirResponse['data'];
export type Cosa = Propuesta['items'][number];
export type TextoDeLaPropuesta = Propuesta['texts'][number];

// ─── La elección ────────────────────────────────────────────────────────────────────────────────────────────────────

/** Si con lo marcado hay A3: dado, o marcado en este mismo toque. */
export function hayA3(items: readonly Cosa[], marcadas: ReadonlySet<string>): boolean {
  const a3 = items.find((i) => i.kind === 'HEALTH_DATA');
  return a3?.given === true || marcadas.has('HEALTH_DATA');
}

/** Si una cosa se puede marcar con lo demás (lo que pide el A3, solo con el A3). */
export function sePuedeMarcar(items: readonly Cosa[], marcadas: ReadonlySet<string>, key: string): boolean {
  const cosa = items.find((i) => i.key === key);
  if (!cosa || !cosa.offered) return false;
  return !PIDEN_EL_A3.has(cosa.kind) || hayA3(items, marcadas);
}

/** Lo marcado, sin lo que ya no se puede dar con lo demás (desmarcar el A3 desmarca lo que lo pide). */
export function coherentes(items: readonly Cosa[], marcadas: ReadonlySet<string>): Set<string> {
  return new Set([...marcadas].filter((k) => sePuedeMarcar(items, marcadas, k)));
}

/** Lo que trae marcado la pantalla al entrar: lo ofrecido y preseleccionado. */
export function marcadasAlEntrar(items: readonly Cosa[]): Set<string> {
  return coherentes(items, new Set(items.filter((i) => i.offered && i.preselected).map((i) => i.key)));
}

/** Tocar una cosa: la marca o la desmarca, y deja todo coherente. */
export function alternar(items: readonly Cosa[], marcadas: ReadonlySet<string>, key: string): Set<string> {
  const nuevas = new Set(marcadas);
  if (nuevas.has(key)) nuevas.delete(key);
  else if (sePuedeMarcar(items, nuevas, key)) nuevas.add(key);
  return coherentes(items, nuevas);
}

/** Los textos de lo marcado, sin repetir, en el orden de las cosas. */
export function textosDeLoMarcado(items: readonly Cosa[], marcadas: ReadonlySet<string>): string[] {
  return [...new Set(items.filter((i) => marcadas.has(i.key)).map((i) => i.textId))];
}

/** El pedido de API-CMP-02: la versión que se vio, los textos de lo marcado y las claves, en el orden de las cosas. */
export function pedidoDelToque(p: Propuesta, marcadas: ReadonlySet<string>): CompartirLoElegidoRequest {
  return { relationshipId: p.relationshipId, expectedVersion: p.version, acceptedTextIds: textosDeLoMarcado(p.items, marcadas), choices: p.items.filter((i) => marcadas.has(i.key)).map((i) => i.key) };
}

/** El pedido para dar una sola cosa (un interruptor de «Quién ve qué», o «Sí, compartir» a un pedido). */
export function pedidoDeUnaCosa(p: Propuesta, cosa: Cosa): CompartirLoElegidoRequest {
  return { relationshipId: p.relationshipId, expectedVersion: p.version, acceptedTextIds: [cosa.textId], choices: [cosa.key] };
}

// ─── Lo que se dice ─────────────────────────────────────────────────────────────────────────────────────────────────

/** La línea de una cosa: qué, de quién, para quién y para qué. */
export function lineaDe(cosa: Cosa): string {
  switch (cosa.kind) {
    case 'HEALTH_DATA':
      return C.linea.HEALTH_DATA;
    case 'AREA_CONSENT':
      return C.linea.AREA_CONSENT(cosa.professional.displayName, cosa.scope.code, ETIQUETA_DE_FINALIDAD[FINALIDAD_DE_ALCANCE[cosa.scope.code]]);
    case 'SUMMARY':
      return C.linea.SUMMARY(cosa.recipient.displayName, cosa.area, enumerarNombres(cosa.from.map((f) => f.displayName)), cosa.level === 'SUMMARY_AND_PLAN');
    case 'PREVIOUS_HISTORY':
      return C.linea.PREVIOUS_HISTORY(cosa.professional.displayName, cosa.area);
    case 'HABITS':
      return C.linea.HABITS(cosa.recipient.displayName);
  }
}

/** Lo que se ofrece y lo que ya está dado, por separado, en el orden de la API. */
export function partesDeLaPropuesta(p: Propuesta): { readonly ofrecidas: readonly Cosa[]; readonly dadas: readonly Cosa[] } {
  return { ofrecidas: p.items.filter((i) => i.offered), dadas: p.items.filter((i) => i.given && !i.offered) };
}

/** Los textos de lo marcado, para leerlos completos antes de tocar el botón. */
export function textosParaLeer(p: Propuesta, marcadas: ReadonlySet<string>): readonly TextoDeLaPropuesta[] {
  const ids = textosDeLoMarcado(p.items, marcadas);
  return ids.flatMap((id) => p.texts.filter((t) => t.id === id));
}

/** Si alguno de esos textos es una propuesta pendiente de validación jurídica: se dice. */
export const hayPropuestas = (textos: readonly TextoDeLaPropuesta[]): boolean => textos.some((t) => t.approval === 'PENDING_APPROVAL');

/** El texto del botón principal: «Aceptar y compartir» al entrar; con «Elegir qué compartir» abierto, «… lo elegido». */
export const textoDelBoton = (eligiendo: boolean): string => (eligiendo ? C.compartirLoElegido : C.aceptarYCompartir);

/** Lo que dice un rechazo del toque, y qué se ofrece después. */
export interface RechazoDelToque {
  readonly mensaje: string;
  /** Algo cambió mientras se miraba: «Actualizar» vuelve a leer. */
  readonly actualizar: boolean;
  /** Falta el A3: «Ir a Privacidad». */
  readonly privacidad: boolean;
  /** Sin respuesta segura: «Reintentar», con la misma clave. */
  readonly reintentar: boolean;
}

export function rechazoDelToque(r: Resultado<unknown>): RechazoDelToque {
  const base = { actualizar: false, privacidad: false, reintentar: false };
  if (r.ok) return { ...base, mensaje: C.noSePudo };
  if (r.tipo !== 'API' || r.codigo === 'RESPUESTA_NO_RECONOCIDA') return { ...base, mensaje: COPY.resultadoIncierto, reintentar: true };
  switch (r.codigo) {
    case 'VERSION_CONFLICT':
    case 'CONSENT_VERSION_STALE':
    case 'RESOURCE_CONFLICT':
    case 'SHARING_CHOICE_NOT_AVAILABLE':
    case 'SHARING_TEXT_REQUIRED':
    case 'RELATIONSHIP_NOT_READY_FOR_CONSENT':
      return { ...base, mensaje: C.cambioAntes, actualizar: true };
    case 'ACTION_FORBIDDEN':
      return { ...base, mensaje: C.pideElA3, privacidad: true };
    case 'RESOURCE_NOT_FOUND':
      return { ...base, mensaje: COPY_VINCULO.noPudimosAbrir };
    default:
      return { ...base, mensaje: C.noSePudo };
  }
}

// ─── La tarjeta única, para quien ya tiene vínculos ─────────────────────────────────────────────────────────────────

/** Lo que muestra la tarjeta: lo de otras áreas, la historia anterior o los hábitos (el A3 y el B2 ya los recuerda Inicio). */
const DE_LA_TARJETA: ReadonlySet<Cosa['kind']> = new Set(['SUMMARY', 'PREVIOUS_HISTORY', 'HABITS']);

/** Si la tarjeta tiene algo para ofrecer: alguna de esas cosas, ofrecida y marcada. */
export const laTarjetaTieneAlgo = (p: Propuesta): boolean => p.items.some((i) => DE_LA_TARJETA.has(i.kind) && i.offered && i.preselected);

export const claveDeLaTarjeta = (cuenta: string): string => `be:compartir-todo-vista:${cuenta}`;

export interface MarcaDeLaTarjeta {
  /** `null` mientras no se leyó para esa cuenta. */
  vista(cuenta: string): boolean | null;
  leer(cuenta: string): Promise<boolean>;
  /** `false` si no se pudo guardar: vale mientras la app esté abierta. */
  marcar(cuenta: string): Promise<boolean>;
  suscribir(alCambiar: () => void): () => void;
}

/** La marca de «ya la vio», una vez por cuenta en este teléfono (como la explicación de los tiempos, AV2-33). */
export function crearMarcaDeLaTarjeta(almacen: AlmacenDeTexto): MarcaDeLaTarjeta {
  const vistas = new Map<string, boolean>();
  const oyentes = new Set<() => void>();
  const fijar = (cuenta: string, vista: boolean) => {
    if (vistas.get(cuenta) === vista) return;
    vistas.set(cuenta, vista);
    for (const o of oyentes) o();
  };
  return {
    vista: (cuenta) => vistas.get(cuenta) ?? null,
    async leer(cuenta) {
      if (vistas.has(cuenta)) return vistas.get(cuenta) === true;
      let vista = false;
      try {
        vista = (await almacen.getItem(claveDeLaTarjeta(cuenta))) === '1';
      } catch {
        vista = false;
      }
      fijar(cuenta, vistas.get(cuenta) === true || vista);
      return vistas.get(cuenta) === true;
    },
    async marcar(cuenta) {
      fijar(cuenta, true);
      try {
        await almacen.setItem(claveDeLaTarjeta(cuenta), '1');
        return true;
      } catch {
        return false;
      }
    },
    suscribir(alCambiar) {
      oyentes.add(alCambiar);
      return () => oyentes.delete(alCambiar);
    },
  };
}

/** Si la tarjeta se dibuja: tiene algo, y en este teléfono esa cuenta todavía no la vio (sin saberlo, no se dibuja). */
export const seMuestraLaTarjeta = (p: Propuesta | null, vista: boolean | null): boolean => p !== null && vista === false && laTarjetaTieneAlgo(p);

// ─── «Quién ve qué» ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Un interruptor de «Quién ve qué»: lo de otra área o los hábitos, para un profesional. */
export interface Interruptor {
  readonly cosa: Cosa;
  readonly rotulo: string;
  /** Lo que se dice debajo: desde cuándo lo ve, o que no lo ve. */
  readonly estado: string;
  readonly prendido: boolean;
  /** Si tocarlo hace algo: retirar lo dado siempre; dar, solo si se ofrece y hay A3. */
  readonly habilitado: boolean;
  /** Por qué no se puede prender, si no se puede. */
  readonly porQueNo: string | null;
}

/** Los interruptores de un profesional: lo de cada otra área que se le puede compartir y, si corresponde, los hábitos. */
export function interruptoresDe(p: Propuesta, profesionalId: string, dia: (iso: string) => string): Interruptor[] {
  const sinMarcar = new Set<string>();
  return p.items.flatMap((cosa): Interruptor[] => {
    if (cosa.kind !== 'SUMMARY' && cosa.kind !== 'HABITS') return [];
    if (cosa.recipient.identityId !== profesionalId) return [];
    const rotulo = cosa.kind === 'SUMMARY' ? C.interruptorDeResumen(cosa.area, cosa.level === 'SUMMARY_AND_PLAN') : C.interruptorDeHabitos;
    const prendido = cosa.given;
    const puede = prendido || sePuedeMarcar(p.items, sinMarcar, cosa.key);
    return [{ cosa, rotulo, estado: prendido && cosa.since ? C.loVe(dia(cosa.since)) : C.noLoVe, prendido, habilitado: puede, porQueNo: puede ? null : C.pideElA3 }];
  });
}

/** Lo que lee TalkBack de un interruptor: qué, y si hoy lo ve (el estado va en la etiqueta, no solo en la sugerencia). */
export const etiquetaDelInterruptor = (i: Interruptor, nombre: string): string => `${i.rotulo}, para ${nombre}. ${i.estado}.`;
export const sugerenciaDelInterruptor = (i: Interruptor): string => C.sugerenciaDelInterruptor(i.prendido);

/** Un pedido para responder: de ver un plan (API-RES-09) o los hábitos (API-HBT-08), con la cosa que lo da. */
export interface PedidoParaResponder {
  readonly id: string;
  readonly tipo: 'PLAN' | 'HABITOS';
  readonly version: string;
  readonly texto: string;
  /** La cosa de la propuesta que lo da («Sí, compartir»); `null` si hoy no se puede dar desde acá (sin el A3, por ejemplo). */
  readonly cosa: Cosa | null;
}

export function pedidosParaResponder(p: Propuesta | null, deUnPlan: readonly PedidoDePlanParaLaPersona[], deHabitos: readonly PedidoDeAccesoParaLaPersona[]): PedidoParaResponder[] {
  const cosaDe = (key: string): Cosa | null => {
    const cosa = p?.items.find((i) => i.key === key) ?? null;
    return cosa && p && sePuedeMarcar(p.items, new Set(), key) ? cosa : null;
  };
  return [
    ...deUnPlan.map((x) => ({ id: x.accessRequestId, tipo: 'PLAN' as const, version: x.version, texto: C.pedidos.deUnPlan(x.professional.displayName, x.area, x.scope.code), cosa: cosaDe(`SUMMARY:${x.professional.identityId}:${x.area}`) })),
    ...deHabitos.map((x) => ({ id: x.accessRequestId, tipo: 'HABITOS' as const, version: x.version, texto: C.pedidos.deHabitos(x.professional.displayName, x.scope.code), cosa: cosaDe(`HABITS:${x.professional.identityId}`) })),
  ];
}
