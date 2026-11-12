'use client';

/**
 * ED-33 (WP-EDITORES-PROFESIONAL) · Los dos cuadros del «⋯» de la comida: «Copiar desde otra comida» y «Usar una comida
 * habitual». Cada uno es una lista para elegir una sola cosa y un solo principal, en un cuadro enfocado (§2.3): no se
 * apila sobre otro, y Escape o «Cancelar» no escriben nada. La lógica está en `opcion-de-otra-comida.ts`.
 */
import { COPY_HABITUALES, type ComidaHabitual } from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { CuadroEnfocado } from '../../../../components/cuadro-enfocado';
import { COPY_DE_OTRA_COMIDA as C, type OrigenDeLaCopia } from './opcion-de-otra-comida';

export function CuadroCopiarDesdeOtraComida({
  abierto,
  comida,
  numeroDeLaNueva,
  origenes,
  alCopiar,
  onCerrar,
}: {
  abierto: boolean;
  /** El nombre de la comida a la que se copia. */
  comida: string;
  /** El número que va a tener la opción copiada. */
  numeroDeLaNueva: number;
  origenes: readonly OrigenDeLaCopia[];
  alCopiar: (o: OrigenDeLaCopia) => void;
  onCerrar: () => void;
}) {
  const id = useId();
  const [elegida, setElegida] = useState<string | null>(null);
  useEffect(() => {
    if (abierto) setElegida(null);
  }, [abierto]);
  const origen = origenes.find((o) => o.clave === elegida) ?? null;
  // Agrupadas por comida, en el orden del plan.
  const grupos = [...new Set(origenes.map((o) => o.donde))].map((donde) => ({ donde, opciones: origenes.filter((o) => o.donde === donde) }));
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      titulo={C.tituloCopiar(comida)}
      principal={{ texto: C.principalCopiar(comida, numeroDeLaNueva), alTocar: () => origen && alCopiar(origen), apagado: origen ? null : C.elegiUna }}
      pie={<p className="nota">{C.queHace}</p>}
      onCerrar={onCerrar}
    >
      {origenes.length === 0 ? (
        <p>{C.sinOtras}</p>
      ) : (
        <div className="eleccion-de-otra-comida">
          {grupos.map((g) => (
            <fieldset key={g.donde} className="eleccion-de-otra-comida__grupo">
              <legend>{g.donde}</legend>
              {g.opciones.map((o) => (
                <label key={o.clave} className="eleccion-de-otra-comida__opcion">
                  <input type="radio" name={`${id}-origen`} value={o.clave} checked={elegida === o.clave} onChange={() => setElegida(o.clave)} data-origen={o.clave} />
                  <span>
                    <strong>{o.opcion}</strong>
                    <span className="nota"> · {o.tiene}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}
    </CuadroEnfocado>
  );
}

export function CuadroUsarComidaHabitual({
  abierto,
  comida,
  habituales,
  alUsar,
  onCerrar,
}: {
  abierto: boolean;
  comida: string;
  habituales: readonly ComidaHabitual[];
  alUsar: (h: ComidaHabitual) => void;
  onCerrar: () => void;
}) {
  const id = useId();
  const [elegida, setElegida] = useState<string | null>(null);
  useEffect(() => {
    if (abierto) setElegida(null);
  }, [abierto]);
  const habitual = habituales.find((h) => h.presetId === elegida) ?? null;
  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="dialogo"
      titulo={C.tituloHabitual(comida)}
      principal={{ texto: C.principalHabitual(comida), alTocar: () => habitual && alUsar(habitual), apagado: habitual ? null : C.elegiUnaHabitual }}
      pie={<p className="nota">{C.queHaceHabitual}</p>}
      onCerrar={onCerrar}
    >
      <fieldset className="eleccion-de-otra-comida__grupo">
        <legend className="visualmente-oculto">{COPY_HABITUALES.agregarComida}</legend>
        {habituales.map((h) => (
          <label key={h.presetId} className="eleccion-de-otra-comida__opcion">
            <input type="radio" name={`${id}-habitual`} value={h.presetId} checked={elegida === h.presetId} onChange={() => setElegida(h.presetId)} />
            <span>
              <strong>{h.name}</strong>
              <span className="nota">
                {' '}
                · {h.structure.options.length === 1 ? '1 opción' : `${h.structure.options.length} opciones`} · {COPY_HABITUALES.alimentos(h.itemCount)} ·{' '}
                {h.copiedQuantities ? COPY_HABITUALES.conCantidades : COPY_HABITUALES.sinCantidades}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
    </CuadroEnfocado>
  );
}
