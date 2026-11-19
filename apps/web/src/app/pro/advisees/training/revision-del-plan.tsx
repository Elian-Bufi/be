'use client';

/**
 * ENP-D13 (WP-ENTRENAMIENTO-PLANIFICACION, sugerencia C1 de Dirección) · La revisión honesta del plan en preparación.
 *
 * Antes, el panel decía «Nada impide activar» antes de que la API revisara lo guardado, también con una sesión vacía. Ahora
 * dice siempre en qué estado está la revisión, y solo afirma lo que el servidor dijo de **esta** versión:
 * - **Revisión pendiente:** todavía no se pidió, o el borrador cambió después (la revisión anterior deja de valer);
 * - **Revisando esta versión…**;
 * - **Revisión terminada,** con cada cosa que impide activar y su «Ir a…» («Sesión B: no tiene ejercicios → Ir a Sesión
 *   B»), o «no se encontraron impedimentos para activar»;
 * - **No se pudo revisar,** con «Reintentar».
 * Lo que el editor sabe solo (un dato que no se entiende, la app de la persona) se lista siempre: es un hecho, no una
 * revisión. La validación final sigue siendo la de la API al activar.
 *
 * El título de la parte («Revisión para activar») no afirma nada: lo dice el estado, debajo. (Con «⚠ Impide activar»
 * arriba de «✓ no se encontraron impedimentos», el panel se contradecía.) «Revisar ahora» no guarda mientras otro guardado
 * está en curso: lo dice apagado, como «Guardar ahora».
 */
import { useId } from 'react';
import { Icono } from '../../../../components/icono';

export type EstadoDeLaRevision = 'pendiente' | 'revisando' | 'lista' | 'fallo';

/** Una cosa que impide activar: dónde está, qué le pasa y, si se puede ir, a dónde. */
export interface Impedimento {
  readonly lugar: string;
  readonly texto: string;
  /** El nombre del lugar al que lleva «Ir a…» («Sesión B»); `null` si es del plan entero. */
  readonly destino: string | null;
  readonly ir: (() => void) | null;
}

export const COPY_REVISION_DEL_PLAN = {
  /** El título de la parte: no afirma nada; lo que hay lo dice el estado, debajo. */
  titulo: 'Revisión para activar',
  pendiente: 'Revisión pendiente',
  pendienteAyuda: 'Se revisa sola cuando se guarda lo que escribiste.',
  conCambios: 'Hay cambios sin guardar: la revisión anterior ya no vale.',
  revisando: 'Revisando esta versión…',
  terminadaSinImpedimentos: 'Revisión terminada: no se encontraron impedimentos para activar.',
  terminadaCon: (n: number) => (n === 1 ? 'Revisión terminada: hay 1 cosa que impide activar.' : `Revisión terminada: hay ${n} cosas que impiden activar.`),
  fallo: 'No se pudo revisar esta versión.',
  revisarAhora: 'Revisar ahora',
  reintentar: 'Reintentar',
  irA: (destino: string) => `Ir a ${destino}`,
  yaSeSabe: 'Lo que el editor ya ve, sin esperar la revisión:',
  /** C9: con el autoguardado en curso, «Revisar ahora» queda apagado (§7) y la revisión sigue sola al guardar. */
  seRevisaAlGuardar: 'Se está guardando lo que escribiste: la revisión se pide sola apenas termine.',
} as const;

/**
 * PLT (DL-182): la misma revisión honesta en el editor de una plantilla, que no se activa: se guarda. Lo que impide es lo
 * que impide guardarla (sin las reglas de una persona); el título y los estados lo dicen con esas palabras.
 */
export const COPY_REVISION_DE_LA_PLANTILLA = {
  ...COPY_REVISION_DEL_PLAN,
  titulo: 'Revisión para guardar',
  revisando: 'Revisando lo preparado…',
  terminadaSinImpedimentos: 'Revisión terminada: no se encontraron impedimentos para guardar la plantilla.',
  terminadaCon: (n: number) => (n === 1 ? 'Revisión terminada: hay 1 cosa que impide guardar la plantilla.' : `Revisión terminada: hay ${n} cosas que impiden guardar la plantilla.`),
  fallo: 'No se pudo revisar lo preparado.',
} as const;

/** C9: «Volver a la revisión», arriba de la sesión, después de «Ir a…». */
export const COPY_VOLVER_A_LA_REVISION = {
  desdeElCuadro: 'Corregí acá y volvé a «Antes de activar»: la fecha de la próxima revisión que elegiste se conserva.',
  desdeElPanel: 'Corregí acá y volvé a la revisión del panel.',
  volver: 'Volver a la revisión',
  ocultar: 'Ocultar',
} as const;

/** El nombre del lugar al que se va: lo último de «Fase 1 → Sesión B». */
export const destinoDelLugar = (lugar: string): string | null => (lugar === 'Plan' ? null : (lugar.split(' → ').at(-1) ?? null));

export function RevisionDelPlan({
  estado,
  sinGuardar,
  delServidor,
  delEditor,
  motivoSinRevisar = null,
  guardando = false,
  onRevisar,
  para = 'activar',
}: {
  estado: EstadoDeLaRevision;
  /** El borrador tiene cambios que todavía no se guardaron. */
  sinGuardar: boolean;
  /** Lo que la API dijo de esta versión (solo con la revisión terminada). */
  delServidor: readonly Impedimento[];
  /** Lo que el editor sabe solo: se lista en cualquier estado. */
  delEditor: readonly Impedimento[];
  /**
   * Por qué «Revisar ahora» no se puede tocar (un guardado en curso o un conflicto: guardar otra vez daría un conflicto
   * falso), o `null`. Apagado con `aria-disabled`, que conserva el foco, y dice por qué.
   */
  motivoSinRevisar?: string | null;
  /** C9: hay un guardado en curso; al terminar, la revisión se pide sola (lo dice, a la vista). */
  guardando?: boolean;
  /** «Revisar ahora» o «Reintentar»: guarda si hace falta y pide la revisión. */
  onRevisar: () => void;
  /** PLT (DL-182): para activar el plan de una persona o para guardar una plantilla. */
  para?: 'activar' | 'guardar';
}) {
  const motivoId = useId();
  const T = para === 'guardar' ? COPY_REVISION_DE_LA_PLANTILLA : COPY_REVISION_DEL_PLAN;
  const lista = (cosas: readonly Impedimento[]) => (
    <ul className="estacion__lista-del-panel revision-del-plan__lista">
      {cosas.map((x, n) => (
        <li key={`${x.lugar}-${x.texto}-${n}`}>
          <span>
            {x.lugar === 'Plan' ? x.texto.charAt(0).toUpperCase() + x.texto.slice(1) : `${x.lugar}: ${x.texto}`}
          </span>{' '}
          {x.ir && x.destino ? (
            <button type="button" className="boton boton--enlace" onClick={x.ir} data-ir-al-problema>
              <Icono nombre="derecha" tamano={15} />
              {T.irA(x.destino)}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
  const terminada = estado === 'lista';
  const impiden = [...delEditor, ...(terminada ? delServidor : [])];
  return (
    <div className="revision-del-plan" data-revision={estado}>
      <p className="revision-del-plan__estado" role="status" data-estado-de-la-revision={estado}>
        <Icono nombre={terminada && impiden.length === 0 ? 'tilde' : estado === 'revisando' ? 'reloj' : 'aviso'} tamano={15} />
        {estado === 'pendiente'
          ? T.pendiente
          : estado === 'revisando'
            ? T.revisando
            : estado === 'fallo'
              ? T.fallo
              : impiden.length === 0
                ? T.terminadaSinImpedimentos
                : T.terminadaCon(impiden.length)}
      </p>
      {estado === 'pendiente' ? <p className="nota">{sinGuardar ? T.conCambios : T.pendienteAyuda}</p> : null}
      {estado === 'pendiente' || estado === 'fallo' ? (
        <>
          <button
            type="button"
            className="boton boton--quieto boton--compacto"
            aria-disabled={motivoSinRevisar ? true : undefined}
            aria-describedby={motivoSinRevisar ? motivoId : undefined}
            onClick={() => {
              if (!motivoSinRevisar) onRevisar();
            }}
            data-revisar-ahora
          >
            <Icono nombre="revision" tamano={15} />
            {estado === 'fallo' ? T.reintentar : T.revisarAhora}
          </button>
          {/* C9: el motivo a la vista, no solo para el lector: con el autoguardado en curso, la revisión sigue sola. */}
          {motivoSinRevisar ? (
            <p id={motivoId} className="nota" data-motivo-sin-revisar>
              {guardando ? T.seRevisaAlGuardar : motivoSinRevisar}
            </p>
          ) : null}
        </>
      ) : null}
      {!terminada && delEditor.length > 0 ? <p className="nota">{T.yaSeSabe}</p> : null}
      {impiden.length > 0 ? lista(impiden) : null}
    </div>
  );
}
