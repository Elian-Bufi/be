'use client';

/**
 * La lectura persistente de la fecha elegida (WP-GRAFICOS fase 2, DL-174): cada carril con su unidad y su calidad («80 kg
 * · RIR 1 · indicado: RIR 2», «2.150 kcal · subtotal: 1 comida sin cantidades», «cargado después»), o «sin dato». Es una
 * región viva cortés: el valor exacto nunca depende del puntero. Sale de las mismas filas que la tabla.
 */
import { COPY_DE_LOS_GRAFICOS } from './copy';
import { textoDeLaMarca } from './eje-de-fechas';
import { lecturaDeLaFecha, type FilasDeLaTabla } from './tabla-equivalente';

export function LecturaEnLaFecha({ tabla, fecha, tramo }: { tabla: FilasDeLaTabla; fecha: string | null; tramo: { readonly desde: string; readonly hasta: string } | null }) {
  return (
    <div className="grafico-base__lectura" aria-live="polite">
      {fecha === null ? (
        <p className="nota">{COPY_DE_LOS_GRAFICOS.lecturaSinFecha}</p>
      ) : (
        <>
          <p className="grafico-base__lectura-fecha">
            {tramo ? COPY_DE_LOS_GRAFICOS.tramoElegido(textoDeLaMarca(tramo.desde), textoDeLaMarca(tramo.hasta)) : null}
            {tramo ? ' · ' : null}
            {textoDeLaMarca(fecha)}
          </p>
          <dl className="grafico-base__lectura-valores">
            {lecturaDeLaFecha(tabla, fecha).map((l, i) => (
              <div key={`${l.nombre}-${i}`}>
                <dt>{l.nombre}</dt>
                <dd>{l.texto}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  );
}
