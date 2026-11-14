'use client';

/**
 * La lectura de un cruce (WP-GRAFICOS fase 2, DL-174; SP-01 y SP-02), debajo de sus carriles: la ventana fijada antes de
 * mirar, lo que cambió en lo indicado en la primera línea (el ruido antes que el cambio), lo que dice cada etapa, lo que
 * también cambió, lo que BE no registra, «Cómo leerlo» con su fuente y la frase de la coincidencia. Es texto: se lee
 * entero sin mirar el dibujo.
 */
import { useId } from 'react';
import { COPY_DE_LOS_CRUCES } from './copy';
import type { LecturaDeUnCruce } from './carbohidratos-y-fuerza';

export function LecturaDelCruce({ lectura, ventana, comoLeerlo }: { lectura: LecturaDeUnCruce; ventana: string; comoLeerlo: readonly string[] }) {
  const id = useId();
  return (
    <div className="cruce__lectura">
      <p className="cruce__ventana" id={`${id}-ventana`}>
        <strong>{COPY_DE_LOS_CRUCES.ventana}:</strong> {ventana}
      </p>
      {lectura.falta ? <p className="nota">{lectura.falta}</p> : null}
      {lectura.primeraLinea.map((l) => (
        <p key={l} className="cruce__primera-linea">
          {l}
        </p>
      ))}
      {lectura.lineas.length > 0 ? (
        <ul className="cruce__lineas">
          {lectura.lineas.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
      {lectura.ventana ? (
        <div className="cruce__tambien">
          <h4>{COPY_DE_LOS_CRUCES.tambienCambio}</h4>
          {lectura.tambienCambio.length > 0 ? (
            <ul>
              {lectura.tambienCambio.map((t) => (
                <li key={t}>{t}.</li>
              ))}
            </ul>
          ) : (
            <p className="nota">{COPY_DE_LOS_CRUCES.sinCambiosQueSeSepan}</p>
          )}
          <h4>{COPY_DE_LOS_CRUCES.noRegistra}</h4>
          <ul>
            {lectura.noRegistra.map((t) => (
              <li key={t}>{t.charAt(0).toUpperCase() + t.slice(1)}.</li>
            ))}
          </ul>
        </div>
      ) : null}
      <details className="cruce__como-leerlo">
        <summary>{COPY_DE_LOS_CRUCES.comoLeerlo}</summary>
        <ul>
          {comoLeerlo.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>
      <p className="cruce__frase">{lectura.frase}</p>
    </div>
  );
}
