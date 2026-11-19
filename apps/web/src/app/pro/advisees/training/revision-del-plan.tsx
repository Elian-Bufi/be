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
} as const;

/** El nombre del lugar al que se va: lo último de «Fase 1 → Sesión B». */
export const destinoDelLugar = (lugar: string): string | null => (lugar === 'Plan' ? null : (lugar.split(' → ').at(-1) ?? null));

export function RevisionDelPlan({
  estado,
  sinGuardar,
  delServidor,
  delEditor,
  motivoSinRevisar = null,
  onRevisar,
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
  /** «Revisar ahora» o «Reintentar»: guarda si hace falta y pide la revisión. */
  onRevisar: () => void;
}) {
  const motivoId = useId();
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
              {COPY_REVISION_DEL_PLAN.irA(x.destino)}
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
          ? COPY_REVISION_DEL_PLAN.pendiente
          : estado === 'revisando'
            ? COPY_REVISION_DEL_PLAN.revisando
            : estado === 'fallo'
              ? COPY_REVISION_DEL_PLAN.fallo
              : impiden.length === 0
                ? COPY_REVISION_DEL_PLAN.terminadaSinImpedimentos
                : COPY_REVISION_DEL_PLAN.terminadaCon(impiden.length)}
      </p>
      {estado === 'pendiente' ? <p className="nota">{sinGuardar ? COPY_REVISION_DEL_PLAN.conCambios : COPY_REVISION_DEL_PLAN.pendienteAyuda}</p> : null}
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
            {estado === 'fallo' ? COPY_REVISION_DEL_PLAN.reintentar : COPY_REVISION_DEL_PLAN.revisarAhora}
          </button>
          {motivoSinRevisar ? (
            <span id={motivoId} className="visualmente-oculto">
              {motivoSinRevisar}
            </span>
          ) : null}
        </>
      ) : null}
      {!terminada && delEditor.length > 0 ? <p className="nota">{COPY_REVISION_DEL_PLAN.yaSeSabe}</p> : null}
      {impiden.length > 0 ? lista(impiden) : null}
    </div>
  );
}
