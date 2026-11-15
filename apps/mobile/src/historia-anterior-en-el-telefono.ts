/**
 * WP-HISTORIA-ANTERIOR (DL-175) · «Tu historia anterior», en la APK, como lógica pura (con su prueba,
 * `historia-anterior-en-el-telefono.test.ts`, TEST-HA-040 a 046). La dibujan «Quién ve qué», debajo del profesional de un
 * área, y la tarjeta opcional al aceptar a un profesional nuevo, por Vínculos o por invitación (`historia-anterior.tsx`).
 *
 * - **Sale de una lectura nueva,** API-HIA-01 (`GET /me/previous-history`), y escribe por API-HIA-02 (autorizar) y 03
 *   (retirar). La APK las empieza a leer con esta parte: se congelan con su próxima candidata (DL-152).
 * - **Se muestra donde tiene sentido:** si antes hubo otro profesional en esa área, o si la persona ya decidió algo. Sin
 *   nadie antes no hay historia anterior que compartir, y la tarjeta no se dibuja. Un vínculo terminado con el que la
 *   miraron queda en solo lectura, con la línea de cuándo (HA-T08): sin interruptor, porque ya no la ve.
 * - **Por omisión no se comparte** (HA-T01): sin decisión, el interruptor está apagado y dice «No la ve».
 * - **Compartida no es lo mismo que vista** (HA-T15): «La ve desde el …» solo si hoy tiene acceso a esa área
 *   (`accessInEffect`, el PDP sin registrar). En pausa, sin el B2 o sin el A3, se dice que no la ve, y el aviso de éxito
 *   dice lo mismo que el estado.
 * - **La línea de cuándo la miró** sale de la misma lectura, por componente de vínculo (la de un vínculo anterior con el
 *   mismo profesional no se cuela), con las palabras de «quién miró» (PG-12): «Miró tu historia anterior el martes 10 a las
 *   18:20». «Todavía no la miró» solo con la historia compartida: si no la ve, no hay qué decir.
 * - **Compartirla abre el texto entero** (como los hábitos: lo que se acepta no se pliega), con «Compartir» y «Ahora no»
 *   del mismo peso; **retirarla** pide confirmación. Retirar siempre se puede, aunque no esté el A3; darla pide el texto
 *   vigente y el A3 (la API lo exige y la pantalla lo dice, con el camino a Privacidad).
 */
import { COPY_HISTORIA_ANTERIOR as C, type AutorizarHistoriaAnteriorRequest, type HistoriaAnteriorDeUnArea, type MiHistoriaAnteriorResponse, type Resultado, type RetirarHistoriaAnteriorRequest } from '@be/domain';
import { cuandoLoMiro } from './quien-miro';

export type MiHistoriaAnterior = MiHistoriaAnteriorResponse['data'];

export interface VistaDeLaHistoriaAnterior {
  readonly relationshipId: string;
  readonly titulo: string;
  readonly explicacion: string;
  /** El valor del interruptor: compartida (la última versión la dio) o no. */
  readonly compartida: boolean;
  /** Un vínculo terminado: solo la línea de cuándo la miró, sin interruptor ni texto. */
  readonly soloLectura: boolean;
  /** Lo que se dice a la vista, con su palabra: «La ve desde el 3/11/2026», «No la ve», lo de la pausa o lo del acceso. */
  readonly estado: string;
  /** La línea de cuándo la miró; `null` si no hay nada que decir. */
  readonly miro: string | null;
  /** El nombre del interruptor para TalkBack: qué hace, con quién y de qué área (el estado se le suma en la pantalla). */
  readonly paraLeer: string;
  /** La sugerencia de TalkBack: qué pasa al tocarlo (abre el texto o pide confirmación). */
  readonly sugerencia: string;
}

/**
 * Se dibuja si antes hubo otro profesional en el área o si la persona ya decidió algo (TEST-HA-040). Un vínculo terminado,
 * solo si ese profesional la miró: es lo que la persona tiene que poder seguir viendo.
 */
export const seMuestra = (i: HistoriaAnteriorDeUnArea): boolean => (i.relationshipState === 'FINALIZADO' ? i.lastReadAt !== null : i.hadEarlierProfessional || i.authorization !== null);

export const estaCompartida = (i: HistoriaAnteriorDeUnArea): boolean => i.authorization?.state === 'GRANTED';

/**
 * El estado, en palabras (TEST-HA-040 y 046): terminado, no compartida, en pausa, compartida sin el acceso de hoy a esa
 * área o, solo con todo, «La ve desde el …».
 */
export function estadoDeLaHistoria(i: HistoriaAnteriorDeUnArea, dia: (iso: string) => string): string {
  if (i.relationshipState === 'FINALIZADO') return C.terminado;
  if (!estaCompartida(i)) return C.noLaVe;
  if (i.relationshipState === 'PAUSADO') return C.enPausa;
  if (!i.accessInEffect) return C.sinAcceso(i.area);
  return C.laVe(dia(i.authorization!.since));
}

/**
 * Una vista por componente de vínculo (`relationshipId`), solo de los que se muestran. `dia` formatea una fecha («3/11/2026»)
 * y `hoy` es la fecha civil de hoy (para «hoy a las…» y «ayer a las…»); `zona` es para las pruebas.
 */
export function vistasDeLaHistoriaAnterior(mia: MiHistoriaAnterior, dia: (iso: string) => string, hoy: string, zona?: string): ReadonlyMap<string, VistaDeLaHistoriaAnterior> {
  const vistas = new Map<string, VistaDeLaHistoriaAnterior>();
  for (const i of mia.items.filter(seMuestra)) {
    const compartida = estaCompartida(i);
    const nombre = i.professional.displayName;
    const miro = i.lastReadAt ? C.miro(cuandoLoMiro(i.lastReadAt, hoy, zona)) : compartida ? C.todaviaNoLaMiro : null;
    vistas.set(i.relationshipId, {
      relationshipId: i.relationshipId,
      titulo: C.titulo(i.area),
      explicacion: C.explicacion(nombre, i.area),
      compartida,
      soloLectura: i.relationshipState === 'FINALIZADO',
      estado: estadoDeLaHistoria(i, dia),
      miro,
      paraLeer: C.interruptorParaLeer(nombre, i.area),
      sugerencia: compartida ? C.paraRetirar : C.paraCompartir,
    });
  }
  return vistas;
}

/** Lo que lee TalkBack en el interruptor: su nombre y el estado que se ve, siempre en la etiqueta (TEST-HA-045). */
export const etiquetaDelInterruptor = (vista: VistaDeLaHistoriaAnterior, estadoVisible: string): string => `${vista.paraLeer}. ${estadoVisible}`;

/**
 * El aviso de éxito al compartirla, con lo que respondió la API (TEST-HA-046): «puede verla» solo si hoy tiene acceso a
 * esa área; si no (recién aceptado, sin el B2 todavía, en pausa), que la va a poder ver cuando lo tenga.
 */
export const exitoAlCompartir = (i: HistoriaAnteriorDeUnArea): string => (i.accessInEffect ? C.compartida(i.professional.displayName) : C.compartidaSinAcceso(i.professional.displayName, i.area));

/**
 * La tarjeta opcional al aceptar a un profesional nuevo (TEST-HA-041): solo si antes hubo otro en esa área, con el vínculo
 * aceptado y sin ninguna decisión todavía. Si ya decidió (o el vínculo está en pausa), no se vuelve a preguntar.
 */
export function seOfreceAlAceptar(mia: MiHistoriaAnterior, relationshipId: string): HistoriaAnteriorDeUnArea | null {
  const i = mia.items.find((x) => x.relationshipId === relationshipId);
  return i && i.hadEarlierProfessional && i.authorization === null && i.relationshipState === 'ACEPTADO' ? i : null;
}

/** Autorizar con lo que se vio: la versión de la última decisión (o `null`) y el texto que se mostró (TEST-HA-042). */
export const pedidoDeAutorizar = (i: HistoriaAnteriorDeUnArea, textoId: string): AutorizarHistoriaAnteriorRequest => ({ expectedVersion: i.authorization?.version ?? null, textVersionId: textoId });

/** Retirar con la versión vigente que se vio; sin una compartida, no hay nada que retirar. */
export const pedidoDeRetirar = (i: HistoriaAnteriorDeUnArea): RetirarHistoriaAnteriorRequest | null => (estaCompartida(i) ? { expectedVersion: i.authorization!.version } : null);

/** Lo que el interruptor pide al tocarlo: compartir (abre el texto) si no lo estaba, retirar (con confirmación) si lo estaba. */
export const loQuePideElInterruptor = (i: HistoriaAnteriorDeUnArea): 'COMPARTIR' | 'RETIRAR' => (estaCompartida(i) ? 'RETIRAR' : 'COMPARTIR');

/**
 * El mensaje de un rechazo (TEST-HA-043): lo que cambió mientras se miraba (otra versión o un texto nuevo) pide
 * actualizar, con el botón que lo hace; sin el A3, se dice dónde darlo, con el camino a Privacidad; lo demás, que no se pudo.
 */
export function mensajeDelRechazo(r: Resultado<unknown>): { readonly mensaje: string; readonly actualizar: boolean; readonly privacidad: boolean } {
  if (r.ok || r.tipo !== 'API') return { mensaje: C.noSePudo, actualizar: false, privacidad: false };
  if (r.codigo === 'VERSION_CONFLICT' || r.codigo === 'CONSENT_VERSION_STALE' || r.codigo === 'RESOURCE_NOT_FOUND') return { mensaje: C.cambioAntes, actualizar: true, privacidad: false };
  if (r.codigo === 'ACTION_FORBIDDEN') return { mensaje: C.sinElA3, actualizar: false, privacidad: true };
  return { mensaje: C.noSePudo, actualizar: false, privacidad: false };
}

/** La lectura con lo que acaba de responder una escritura, sin esperar a leer de nuevo (TEST-HA-044). */
export function conLoNuevo(mia: MiHistoriaAnterior, nuevo: HistoriaAnteriorDeUnArea): MiHistoriaAnterior {
  return { ...mia, items: mia.items.map((i) => (i.relationshipId === nuevo.relationshipId ? nuevo : i)) };
}

/** El texto que se acepta, en partes: el título (la primera línea) y sus párrafos, entero y a la vista (08 §12.2). */
export function partesDelTexto(texto: string): { readonly titulo: string; readonly parrafos: readonly string[] } {
  const [titulo = '', ...parrafos] = texto.split('\n\n');
  return { titulo, parrafos };
}
