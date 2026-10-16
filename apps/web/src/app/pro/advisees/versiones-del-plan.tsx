'use client';

/**
 * Lo que comparten las secciones «Plan» de Nutrición y de Entrenamiento (WP-ESCRITORIO-AREAS, partes 5 y 6): el selector
 * de versión y el historial.
 * - **El selector** aparece cuando hay una versión en preparación y una activa (C-39): se mira una u otra. La que está
 *   en preparación no lleva número hasta activarse: se nombra por lo que es.
 * - **El historial** lista las versiones activadas, de la más nueva a la más vieja, con su día y su hora, y cuál rige
 *   (lo dice la API, no la fecha). Al pie, la huella de la instantánea que se está leyendo.
 */
import { COPY_DE_VERSIONES, type VersionDelHistorial } from '@be/domain';
import { useId } from 'react';
import { EnPartes } from '../../../components/en-partes';
import { diaSinElAnioEnCurso, horaDelDia } from '../../../lib/formato';

/** La versión que se mira: la que está en preparación o la activa. */
export type VersionMostrada = 'preparacion' | 'activa';

export function SelectorDeVersion({ mostrada, numeroDeLaActiva, onElegir }: { mostrada: VersionMostrada; numeroDeLaActiva: number; onElegir: (cual: VersionMostrada) => void }) {
  const nombre = useId();
  return (
    <div className="plan__selector">
      <fieldset className="segmentos" data-selector-de-version>
        <legend>{COPY_DE_VERSIONES.version}</legend>
        <div className="segmentos__fila">
          <label className="segmento">
            <input type="radio" name={nombre} value="preparacion" checked={mostrada === 'preparacion'} onChange={() => onElegir('preparacion')} />
            {COPY_DE_VERSIONES.enPreparacion}
          </label>
          <label className="segmento">
            <input type="radio" name={nombre} value="activa" checked={mostrada === 'activa'} onChange={() => onElegir('activa')} />
            {COPY_DE_VERSIONES.activaConNumero(numeroDeLaActiva)}
          </label>
        </div>
      </fieldset>
      {mostrada === 'preparacion' ? <p className="nota">{COPY_DE_VERSIONES.elAsesoradoNoLaVe}</p> : null}
    </div>
  );
}

export function HistorialDelPlan({ historial, huella }: { historial: readonly VersionDelHistorial[]; huella: string | null }) {
  const id = useId();
  return (
    <aside className="historial-del-plan" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>{COPY_DE_VERSIONES.historial}</h3>
      {/* Una sección vacía no dice nada: la ausencia se dice (B10-10 §16). */}
      {historial.length === 0 ? (
        <p className="nota">{COPY_DE_VERSIONES.sinVersionesActivadas}</p>
      ) : (
        <ol className="historial-del-plan__lista">
          {historial.map((v) => (
            <li key={v.planId} data-version={v.numero} data-vigente={v.vigente ? '' : undefined}>
              <strong>
                {COPY_DE_VERSIONES.version} {v.numero}
              </strong>{' '}
              <EnPartes texto={`· activada el ${diaSinElAnioEnCurso(v.activadaEl)}, ${horaDelDia(new Date(v.activadaEl))} · ${v.vigente ? COPY_DE_VERSIONES.vigente : COPY_DE_VERSIONES.anterior}`} />
            </li>
          ))}
        </ol>
      )}
      {huella ? (
        <p className="nota historial-del-plan__huella">
          {COPY_DE_VERSIONES.huella}: <span className="huella">{huella.slice(0, 16)}…</span>
        </p>
      ) : null}
    </aside>
  );
}
