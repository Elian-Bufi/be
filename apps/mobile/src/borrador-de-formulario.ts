/**
 * El borrador de un formulario, guardado en el teléfono (WP-FORMULARIOS-RONDA-2, FR-01; FI-04 de
 * WP-FORMULARIOS-DE-INICIO: «el borrador que no se pierde»). Lo escrito en una solicitud sobrevive a que la persona
 * cierre la app desde Recientes o a que Android la cierre. `scripts/borrador-de-formulario.test.mjs` lo prueba sin
 * teléfono, con el cifrado de Node.
 *
 * **Dónde y cómo.** Con el almacén del entrenamiento en curso (`almacen-cifrado.ts`): AES-256-GCM de expo-crypto, lo
 * cifrado en AsyncStorage y la clave de cifrado en el almacenamiento seguro, fuera del respaldo y de las transferencias
 * de Android (`plugins/respaldo-de-android.js`). Sin dependencias nativas nuevas.
 * - **Una clave por cuenta y por solicitud** (`claveDelBorrador`), con la identidad y la solicitud también adentro: lo
 *   de otra cuenta o de otra solicitud no se lee, aunque alguien lo copie a esta clave.
 * - **Una clave de cifrado por cuenta** (`nombreDeLaClaveDeCifrado`): todas las solicitudes de la cuenta la comparten.
 *   Los datos asociados son la clave del valor, así que lo de una solicitud copiado a la de otra no descifra.
 *
 * **Qué se guarda.** El borrador (`Borrador`, lo tocado tal cual), el motivo de una corrección, la versión del
 * formulario y sobre qué se escribió (`BaseDelBorrador`): una respuesta nueva, lo que cargó el profesional mientras se
 * corrige, o la respuesta vigente que se corrige, con su versión. Solo se guarda lo propio: lo precargado sin tocar no.
 *
 * **Cuándo se restaura** (`restauracionDe`): al abrir la solicitud, antes que la precarga de la respuesta vigente. Si la
 * versión del formulario cambió, o cambió lo que estaba debajo (la respuesta, lo cargado), o la solicitud ya se
 * respondió, lo guardado no corresponde y se descarta: nunca se mezcla con algo que la persona no vio.
 *
 * **Cuándo se borra:**
 * - al enviar con éxito y al descartar lo cargado («No es correcto»), salvo que lo escrito por la persona sobreviva a
 *   ese descarte (`conservarBorrador`, en la pantalla);
 * - cuando ya no queda nada propio (la persona lo borró a mano);
 * - al cerrar la sesión desde Cuenta o al pedir el cierre de la cuenta (`borraLosBorradores`). Si la sesión vence o
 *   deja de valer, queda, cifrado y de esa cuenta: la persona no eligió salir, y al volver a entrar lo recupera;
 * - cuando, al leer la bandeja, la solicitud ya no está pendiente (`seConservaConLaLista`).
 *
 * **Si el almacén falla**, el formulario sigue en la memoria de la pantalla, como antes: una lectura que no responde no
 * es «no hay nada» (no se escribe encima de lo que no se pudo ver), y una escritura que falla se dice
 * (`alTerminar`). Ninguna falla del almacén llega a la pantalla como excepción.
 *
 * Es lógica pura: el almacén cifrado, el almacenamiento plano y el temporizador se inyectan
 * (`formularios-en-el-telefono.ts` pone los del teléfono).
 */
import type { DetalleDeSolicitudV2, SeccionDePlantillaV2, SolicitudPropiaV2 } from '@be/domain';
import { claveDeCifrado } from './almacen-cifrado';
import type { AlmacenDeLaCuenta, LecturaGuardada } from './almacen-de-entrenamiento';
import { BORRADOR_VACIO, borradorDeRespuestas, hayAlgoEscrito, mismoBorrador, respuestasVigentes, type Borrador } from './formulario-v2';
import type { Salida } from './navegacion';

// ─── Las claves ─────────────────────────────────────────────────────────────────────────────────

export const PREFIJO_DEL_BORRADOR = 'be-formulario-en-curso:';
const VERSION = 1;

/** Lo de una cuenta: el prefijo de las claves de todas sus solicitudes. Los identificadores van codificados. */
export const prefijoDeLaCuenta = (identidadId: string): string => `${PREFIJO_DEL_BORRADOR}${encodeURIComponent(identidadId)}:`;
/** La clave de AsyncStorage del borrador de una solicitud de una cuenta. */
export const claveDelBorrador = (identidadId: string, formRequestId: string): string => `${prefijoDeLaCuenta(identidadId)}${encodeURIComponent(formRequestId)}`;

/** La solicitud de una clave de la cuenta, o `null` si la clave no es de esa cuenta. */
export function solicitudDeLaClave(identidadId: string, clave: string): string | null {
  const prefijo = prefijoDeLaCuenta(identidadId);
  if (!clave.startsWith(prefijo)) return null;
  try {
    return decodeURIComponent(clave.slice(prefijo.length));
  } catch {
    return null;
  }
}

/** La clave de cifrado de un borrador, en el almacenamiento seguro: la de su cuenta (lo que va antes de la solicitud). */
export function nombreDeLaClaveDeCifrado(claveDelValor: string): string {
  const corte = claveDelValor.lastIndexOf(':');
  return claveDeCifrado(corte > 0 ? claveDelValor.slice(0, corte) : claveDelValor);
}

// ─── Lo guardado ────────────────────────────────────────────────────────────────────────────────

/** Sobre qué se escribió: de eso depende si lo guardado todavía corresponde. */
export type BaseDelBorrador =
  /** Una respuesta nueva, sobre el formulario vacío. */
  | { readonly tipo: 'responder' }
  /** Lo que cargó el profesional, mientras la persona lo corrige: vale solo para esa carga, con esa versión. */
  | { readonly tipo: 'propuesta'; readonly proposalId: string; readonly version: string }
  /** Una corrección de la respuesta vigente: vale solo para esa respuesta, con esa versión. */
  | { readonly tipo: 'corregir'; readonly formResponseId: string; readonly version: string };

export interface BorradorGuardado {
  readonly version: typeof VERSION;
  readonly identidadId: string;
  readonly formRequestId: string;
  /** La versión del formulario: si cambió, lo guardado no corresponde. */
  readonly templateVersionId: string;
  readonly base: BaseDelBorrador;
  readonly borrador: Borrador;
  /** El motivo de una corrección; vacío al responder. */
  readonly motivo: string;
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const esTexto = (x: unknown): x is string => typeof x === 'string';
const soloTextos = (x: unknown): boolean => esObjeto(x) && Object.values(x).every(esTexto);

/** Si un valor tiene la forma de un valor del borrador: lo que no la tiene rompería la pantalla al dibujarlo. */
function esValorDeBorrador(v: unknown): boolean {
  if (!esObjeto(v)) return false;
  switch (v.tipo) {
    case 'TEXT':
    case 'NUMBER':
      return esTexto(v.texto);
    case 'BOOLEAN':
      return v.eleccion === '' || v.eleccion === 'SI' || v.eleccion === 'NO';
    case 'CHOICE':
      return (v.opcion === null || esTexto(v.opcion)) && esTexto(v.otro);
    case 'MULTI_CHOICE':
      return Array.isArray(v.opciones) && v.opciones.every(esTexto) && esTexto(v.otro);
    case 'LIST':
      return Array.isArray(v.renglones) && v.renglones.every((r) => esObjeto(r) && Number.isInteger(r.id) && soloTextos(r.valores));
    case 'MATRIX':
      return soloTextos(v.celdas);
    case 'FOODS':
      return Array.isArray(v.alimentos) && v.alimentos.every((a) => esObjeto(a) && esTexto(a.nombre) && (a.motivo === null || esTexto(a.motivo)));
    case 'TIMES':
      return soloTextos(v.horas);
    default:
      return false;
  }
}

function esBase(b: unknown): b is BaseDelBorrador {
  if (!esObjeto(b)) return false;
  if (b.tipo === 'responder') return true;
  if (b.tipo === 'propuesta') return esTexto(b.proposalId) && esTexto(b.version);
  if (b.tipo === 'corregir') return esTexto(b.formResponseId) && esTexto(b.version);
  return false;
}

/**
 * Lo guardado en la clave de esa cuenta y esa solicitud, o `null` si no se puede usar: no es JSON, tiene otra forma u
 * otra versión del formato, o adentro dice otra cuenta u otra solicitud.
 */
export function leerGuardado(texto: string, identidadId: string, formRequestId: string): BorradorGuardado | null {
  let x: unknown;
  try {
    x = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!esObjeto(x) || x.version !== VERSION || x.identidadId !== identidadId || x.formRequestId !== formRequestId) return null;
  if (!esTexto(x.templateVersionId) || !esBase(x.base) || !esTexto(x.motivo) || !esObjeto(x.borrador) || !Object.values(x.borrador).every(esValorDeBorrador)) return null;
  return x as unknown as BorradorGuardado;
}

// ─── Las decisiones ─────────────────────────────────────────────────────────────────────────────

/** Si hay algo propio que guardar: lo tocado que no es lo precargado, o un motivo escrito. */
export const hayQueGuardar = (borrador: Borrador, base: Borrador, motivo: string): boolean => (hayAlgoEscrito(borrador) && !mismoBorrador(borrador, base)) || motivo.trim() !== '';

/** Sobre qué está escribiendo la persona ahora, para guardarlo con el borrador. */
export function baseDelBorrador(o: {
  readonly response: { readonly formResponseId: string; readonly version: string } | null;
  readonly proposal: { readonly proposalId: string; readonly version: string } | null;
  readonly corrigiendo: boolean;
}): BaseDelBorrador {
  if (o.response) return { tipo: 'corregir', formResponseId: o.response.formResponseId, version: o.response.version };
  if (o.corrigiendo && o.proposal) return { tipo: 'propuesta', proposalId: o.proposal.proposalId, version: o.proposal.version };
  return { tipo: 'responder' };
}

export type Restauracion =
  | { readonly tipo: 'nada' }
  /** Lo guardado ya no corresponde con lo que dice la API: se borra, y la pantalla sigue como si no hubiera nada. */
  | { readonly tipo: 'descartar' }
  /**
   * Lo guardado vuelve a la pantalla: el borrador, el motivo, contra qué se compara para saber qué es propio (`base`) y
   * si la persona estaba corrigiendo lo cargado.
   */
  | { readonly tipo: 'restaurar'; readonly borrador: Borrador; readonly motivo: string; readonly base: Borrador; readonly corrigiendo: boolean };

/**
 * Qué hacer con lo guardado al abrir la solicitud, con lo que acaba de leer la API. Va antes que la precarga de la
 * respuesta vigente: si se restaura, la precarga no pisa lo escrito.
 */
export function restauracionDe(guardado: BorradorGuardado | null, detalle: Pick<DetalleDeSolicitudV2, 'request' | 'response' | 'proposal'>, secciones: readonly SeccionDePlantillaV2[]): Restauracion {
  if (!guardado) return { tipo: 'nada' };
  const { request, response, proposal } = detalle;
  if (guardado.templateVersionId !== request.templateVersionId) return { tipo: 'descartar' };
  const restaurar = (base: Borrador, corrigiendo: boolean): Restauracion =>
    hayQueGuardar(guardado.borrador, base, guardado.motivo) ? { tipo: 'restaurar', borrador: guardado.borrador, motivo: guardado.motivo, base, corrigiendo } : { tipo: 'descartar' };
  const b = guardado.base;
  if (b.tipo === 'corregir') {
    // Solo sobre la misma respuesta, sin cambios desde que se escribió: si se corrigió en otro lado, lo de acá es viejo.
    if (!response || response.formResponseId !== b.formResponseId || response.version !== b.version) return { tipo: 'descartar' };
    return restaurar(borradorDeRespuestas(secciones, respuestasVigentes(response)), false);
  }
  // Una respuesta nueva, o la corrección de lo cargado, valen mientras la solicitud siga sin responder.
  if (response || request.status !== 'PENDING') return { tipo: 'descartar' };
  if (b.tipo === 'propuesta') {
    // Lo cargado cambió o ya no está: lo corregido sobre eso no corresponde (el envío lo rechazaría igual, con un 409).
    if (!proposal || proposal.proposalId !== b.proposalId || proposal.version !== b.version) return { tipo: 'descartar' };
    return restaurar(borradorDeRespuestas(secciones, proposal.answers), true);
  }
  // Lo escrito por la persona sigue siendo suyo aunque después aparezca algo cargado: la pantalla lo muestra primero y
  // lo escrito sigue en el formulario si lo descarta (`T.loEscritoSigue`).
  return restaurar(BORRADOR_VACIO, false);
}

/**
 * Al leer la bandeja: si lo guardado de una solicitud se conserva. Se borra cuando la solicitud ya no está pendiente
 * (para una respuesta nueva o lo cargado) o ya no tiene respuesta (para una corrección), cuando lo cargado que se
 * corregía cambió, o cuando la versión del formulario no es la de la solicitud. Una solicitud que no está en la lista
 * se borra solo si la lista está completa: la bandeja trae una página, y la solicitud puede estar en la siguiente.
 */
export function seConservaConLaLista(guardado: Pick<BorradorGuardado, 'base' | 'templateVersionId'>, solicitud: SolicitudPropiaV2 | undefined, listaCompleta: boolean): boolean {
  if (!solicitud) return !listaCompleta;
  if (solicitud.templateVersionId !== guardado.templateVersionId) return false;
  const b = guardado.base;
  switch (b.tipo) {
    case 'responder':
      return solicitud.status === 'PENDING';
    case 'propuesta':
      return solicitud.status === 'PENDING' && solicitud.pendingProposal?.proposalId === b.proposalId && solicitud.pendingProposal.version === b.version;
    case 'corregir':
      return solicitud.status === 'RESPONDED';
  }
}

/**
 * Las salidas que borran los borradores de la cuenta: cerrar la sesión (una o todas) y pedir el cierre de la cuenta.
 * Una sesión vencida, que dejó de valer o que pide volver a entrar no los borra: la persona no eligió salir.
 */
export const borraLosBorradores = (motivo: Salida): boolean => motivo === 'sesion-cerrada' || motivo === 'sesiones-cerradas' || motivo === 'cierre-registrado';

// ─── El almacén ─────────────────────────────────────────────────────────────────────────────────

/** Lo que se usa del almacenamiento plano: borrar, y listar las claves para encontrar las de una cuenta. */
export interface PlanoDeLosBorradores {
  borrar(clave: string): Promise<void>;
  claves(): Promise<readonly string[]>;
}

export interface DependenciasDeLosBorradores {
  /** El almacén cifrado (`almacen-cifrado.ts`, con `nombreDeLaClaveDeCifrado`). */
  readonly almacen: AlmacenDeLaCuenta;
  readonly plano: PlanoDeLosBorradores;
  /**
   * Programa la escritura demorada y devuelve cómo cancelarla. Por omisión, `setTimeout`; las pruebas pasan una que corre
   * a pedido.
   */
  readonly programar?: (hacer: () => void, ms: number) => () => void;
}

/** La demora con la que se guarda lo escrito: no se escribe en cada tecla. La misma del entrenamiento en curso. */
export const DEMORA_DEL_BORRADOR_MS = 400;

export type LecturaDelBorrador =
  | { readonly tipo: 'nada' }
  | { readonly tipo: 'guardado'; readonly guardado: BorradorGuardado }
  /** El almacén no respondió: no es «no hay nada», y la pantalla no escribe encima de lo que no pudo ver. */
  | { readonly tipo: 'sin-leer' };

export interface BorradoresDeFormularios {
  /** Lo guardado de esa solicitud. Lo que no se puede usar (ilegible, de otra forma, de otra cuenta) se borra. */
  leer(identidadId: string, formRequestId: string): Promise<LecturaDelBorrador>;
  /**
   * Guarda con la demora corta; una escritura nueva de la misma solicitud reemplaza a la que esperaba. `alTerminar` dice
   * si la escritura quedó en el teléfono.
   */
  escribir(guardado: BorradorGuardado, alTerminar?: (enElTelefono: boolean) => void): void;
  /**
   * Guarda ya lo que esperaba su demora: al salir de la pantalla o al pasar a segundo plano. Termina cuando todo lo que
   * estaba en fila quedó escrito (o falló).
   */
  guardarYa(): Promise<void>;
  borrar(identidadId: string, formRequestId: string): Promise<void>;
  /** Todo lo de la cuenta, también lo que esperaba su demora. */
  borrarDeLaCuenta(identidadId: string): Promise<void>;
  /** Con la bandeja recién leída: borra lo de las solicitudes que ya no están pendientes (`seConservaConLaLista`). */
  conservarSegunLaLista(identidadId: string, solicitudes: readonly SolicitudPropiaV2[], completa: boolean): Promise<void>;
}

interface Demorado {
  readonly guardado: BorradorGuardado;
  readonly alTerminar: ((enElTelefono: boolean) => void) | undefined;
  readonly cancelar: () => void;
}

export function crearBorradoresDeFormularios(deps: DependenciasDeLosBorradores): BorradoresDeFormularios {
  const programar =
    deps.programar ??
    ((hacer: () => void, ms: number) => {
      const t = setTimeout(hacer, ms);
      return () => clearTimeout(t);
    });
  const demorados = new Map<string, Demorado>();
  /** Una operación del almacén por vez, en orden: una escritura y un borrado de la misma clave no se cruzan. */
  let cola: Promise<unknown> = Promise.resolve();
  function enCola<T>(hacer: () => Promise<T>): Promise<T> {
    const r = cola.then(hacer);
    cola = r.catch(() => undefined);
    return r;
  }

  /** Saca de la espera la escritura demorada de esa clave, si había una. */
  function soltar(clave: string): Demorado | null {
    const d = demorados.get(clave);
    if (!d) return null;
    d.cancelar();
    demorados.delete(clave);
    return d;
  }

  function escribirAhora(clave: string, d: Pick<Demorado, 'guardado' | 'alTerminar'>): Promise<void> {
    return enCola(async () => {
      let ok = true;
      try {
        await deps.almacen.guardar(clave, JSON.stringify(d.guardado));
      } catch {
        ok = false;
      }
      d.alTerminar?.(ok);
    });
  }

  /** Borra una clave sin lanzar: si no se pudo, queda cifrada y de su cuenta, y la próxima lectura lo vuelve a intentar. */
  const borrarClave = (clave: string): Promise<void> => enCola(() => deps.plano.borrar(clave)).catch(() => undefined);

  return {
    async leer(identidadId, formRequestId) {
      const clave = claveDelBorrador(identidadId, formRequestId);
      let lectura: LecturaGuardada;
      try {
        lectura = await enCola(() => deps.almacen.leer(clave));
      } catch {
        return { tipo: 'sin-leer' };
      }
      if (lectura.tipo === 'nada') return { tipo: 'nada' };
      const guardado = lectura.tipo === 'texto' ? leerGuardado(lectura.texto, identidadId, formRequestId) : null;
      if (guardado) return { tipo: 'guardado', guardado };
      // Ilegible (sin su clave de cifrado, o no descifra), de otra forma o de otra cuenta: no sirve, y se borra.
      await borrarClave(clave);
      return { tipo: 'nada' };
    },
    escribir(guardado, alTerminar) {
      const clave = claveDelBorrador(guardado.identidadId, guardado.formRequestId);
      soltar(clave);
      const cancelar = programar(() => {
        if (demorados.get(clave)?.guardado !== guardado) return;
        demorados.delete(clave);
        void escribirAhora(clave, { guardado, alTerminar });
      }, DEMORA_DEL_BORRADOR_MS);
      demorados.set(clave, { guardado, alTerminar, cancelar });
    },
    async guardarYa() {
      for (const clave of [...demorados.keys()]) {
        const d = soltar(clave);
        if (d) void escribirAhora(clave, d);
      }
      // Termina cuando terminó todo lo que estaba en fila, también lo que la demora ya había mandado.
      await cola;
    },
    async borrar(identidadId, formRequestId) {
      const clave = claveDelBorrador(identidadId, formRequestId);
      soltar(clave);
      await borrarClave(clave);
    },
    async borrarDeLaCuenta(identidadId) {
      const prefijo = prefijoDeLaCuenta(identidadId);
      for (const clave of [...demorados.keys()]) if (clave.startsWith(prefijo)) soltar(clave);
      await enCola(async () => {
        const todas = await deps.plano.claves();
        for (const clave of todas) if (clave.startsWith(prefijo)) await deps.plano.borrar(clave).catch(() => undefined);
      }).catch(() => undefined);
    },
    async conservarSegunLaLista(identidadId, solicitudes, completa) {
      const porId = new Map(solicitudes.map((s) => [s.formRequestId, s]));
      await enCola(async () => {
        const todas = await deps.plano.claves();
        for (const clave of todas) {
          const formRequestId = solicitudDeLaClave(identidadId, clave);
          // Lo que se está escribiendo ahora no se toca: es de la pantalla abierta, que decide por sí misma.
          if (formRequestId === null || demorados.has(clave)) continue;
          try {
            const lectura = await deps.almacen.leer(clave);
            if (lectura.tipo === 'nada') continue;
            const guardado = lectura.tipo === 'texto' ? leerGuardado(lectura.texto, identidadId, formRequestId) : null;
            if (!guardado || !seConservaConLaLista(guardado, porId.get(formRequestId), completa)) await deps.plano.borrar(clave);
          } catch {
            // El almacén no respondió para esta clave: queda como está, y la próxima lectura de la bandeja lo reintenta.
          }
        }
      }).catch(() => undefined);
    },
  };
}
