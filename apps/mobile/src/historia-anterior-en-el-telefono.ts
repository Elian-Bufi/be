/**
 * WP-HISTORIA-ANTERIOR (DL-175) · «Tu historia anterior», en la APK, como lógica pura (con su prueba,
 * `historia-anterior-en-el-telefono.test.ts`, TEST-HA-040 a 045). La dibujan «Quién ve qué», debajo del profesional de un
 * área, y la tarjeta opcional al aceptar a un profesional nuevo (`historia-anterior.tsx`).
 *
 * - **Sale de una lectura nueva,** API-HIA-01 (`GET /me/previous-history`), y escribe por API-HIA-02 (autorizar) y 03
 *   (retirar). La APK las empieza a leer con esta parte: se congelan con su próxima candidata (DL-152).
 * - **Se muestra donde tiene sentido:** si antes hubo otro profesional en esa área, o si la persona ya decidió algo. Sin
 *   nadie antes no hay historia anterior que compartir, y la tarjeta no se dibuja.
 * - **Por omisión no se comparte** (HA-T01): sin decisión, el interruptor está apagado y dice «No la ve».
 * - **La línea de cuándo la miró** sale de la misma lectura, con las palabras de «quién miró» (PG-12): «Miró tu historia
 *   anterior el martes 10 a las 18:20». «Todavía no la miró» solo con la historia compartida: si no la ve, no hay qué decir.
 * - **Retirar siempre se puede,** con confirmación, aunque no esté el A3; darla pide el texto vigente y el A3 (la API lo
 *   exige y la pantalla lo dice).
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
  /** Lo que se dice a la vista, con su palabra: «La ve desde el 3/11/2026», «No la ve» o lo de la pausa. */
  readonly estado: string;
  /** La línea de cuándo la miró; `null` si no hay nada que decir. */
  readonly miro: string | null;
  /** Lo que lee TalkBack en el interruptor: qué hace, con quién y de qué área. */
  readonly paraLeer: string;
}

/** Se dibuja si antes hubo otro profesional en el área o si la persona ya decidió algo (TEST-HA-040). */
export const seMuestra = (i: HistoriaAnteriorDeUnArea): boolean => i.hadEarlierProfessional || i.authorization !== null;

export const estaCompartida = (i: HistoriaAnteriorDeUnArea): boolean => i.authorization?.state === 'GRANTED';

/**
 * Una vista por componente de vínculo (`relationshipId`), solo de los que se muestran. `dia` formatea una fecha («3/11/2026»)
 * y `hoy` es la fecha civil de hoy (para «hoy a las…» y «ayer a las…»); `zona` es para las pruebas.
 */
export function vistasDeLaHistoriaAnterior(mia: MiHistoriaAnterior, dia: (iso: string) => string, hoy: string, zona?: string): ReadonlyMap<string, VistaDeLaHistoriaAnterior> {
  const vistas = new Map<string, VistaDeLaHistoriaAnterior>();
  for (const i of mia.items.filter(seMuestra)) {
    const compartida = estaCompartida(i);
    const nombre = i.professional.displayName;
    const estado = !compartida ? C.noLaVe : i.relationshipState === 'PAUSADO' ? C.enPausa : C.laVe(dia(i.authorization!.since));
    const miro = i.lastReadAt ? C.miro(cuandoLoMiro(i.lastReadAt, hoy, zona)) : compartida ? C.todaviaNoLaMiro : null;
    vistas.set(i.relationshipId, { relationshipId: i.relationshipId, titulo: C.titulo(i.area), explicacion: C.explicacion(nombre, i.area), compartida, estado, miro, paraLeer: C.interruptorParaLeer(nombre, i.area) });
  }
  return vistas;
}

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

/** Lo que el interruptor pide al tocarlo: compartir si no lo estaba, retirar (con confirmación) si lo estaba. */
export const loQuePideElInterruptor = (i: HistoriaAnteriorDeUnArea): 'COMPARTIR' | 'RETIRAR' => (estaCompartida(i) ? 'RETIRAR' : 'COMPARTIR');

/**
 * El mensaje de un rechazo (TEST-HA-043): lo que cambió mientras se miraba (otra versión o un texto nuevo) pide
 * actualizar; sin el A3, se dice dónde darlo; lo demás, que no se pudo.
 */
export function mensajeDelRechazo(r: Resultado<unknown>): { readonly mensaje: string; readonly actualizar: boolean } {
  if (r.ok || r.tipo !== 'API') return { mensaje: C.noSePudo, actualizar: false };
  if (r.codigo === 'VERSION_CONFLICT' || r.codigo === 'CONSENT_VERSION_STALE' || r.codigo === 'RESOURCE_NOT_FOUND') return { mensaje: C.cambioAntes, actualizar: true };
  if (r.codigo === 'ACTION_FORBIDDEN') return { mensaje: C.sinElA3, actualizar: false };
  return { mensaje: C.noSePudo, actualizar: false };
}

/** La lectura con lo que acaba de responder una escritura, sin esperar a leer de nuevo (TEST-HA-044). */
export function conLoNuevo(mia: MiHistoriaAnterior, nuevo: HistoriaAnteriorDeUnArea): MiHistoriaAnterior {
  return { ...mia, items: mia.items.map((i) => (i.relationshipId === nuevo.relationshipId ? nuevo : i)) };
}
