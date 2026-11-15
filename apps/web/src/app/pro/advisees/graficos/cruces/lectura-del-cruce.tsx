'use client';

/**
 * La lectura de un cruce (WP-GRAFICOS fase 2, DL-174; SP-01 y SP-02): la ventana fijada antes de mirar, lo que cambió en
 * lo indicado en la primera línea (el ruido antes que el cambio), lo que dice cada etapa, lo que también cambió y lo que
 * BE no registra. Es texto: se lee entero sin mirar el dibujo.
 *
 * La pasada visual (15/11; DISENO-VISUAL §1, principios 1 y 2): va dentro de la tarjeta del gráfico, en lo que la base
 * pone a la vista (`aLaVista` de `PanelesAlineados`), debajo de la frase fija. Todo lo de §5.1 sigue a la vista (la
 * ventana, lo que también cambió y lo que BE no registra); la explicación fisiológica con su fuente va en el «Cómo leerlo»
 * de la base (sus `aclaraciones`), y la frase, una sola vez, en las notas del gráfico. Antes la frase iba dos veces y
 * «Cómo leerlo» era un desplegable propio, sin el nombre de su gráfico.
 */
import type { LecturaDeUnCruce } from './carbohidratos-y-fuerza';
import { COPY_DE_LOS_CRUCES } from './copy';

export function LecturaDelCruce({ lectura, ventana }: { lectura: LecturaDeUnCruce; ventana: string }) {
  return (
    <div className="cruce__lectura" data-lectura-del-cruce>
      <p className="cruce__ventana">
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
    </div>
  );
}
