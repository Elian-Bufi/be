'use client';

/**
 * La lectura persistente de la fecha elegida (WP-GRAFICOS fase 2, DL-174): cada carril con su unidad y su calidad («80 kg
 * · RIR 1 · indicado: RIR 2», «2.150 kcal · subtotal: 1 comida sin cantidades», «cargado después»), o «sin dato». Es una
 * región viva cortés: el valor exacto nunca depende del puntero. Sale de las mismas filas que la tabla.
 *
 * Pasada visual (15/11; DISENO-VISUAL §1, principio 1): es la única línea de lectura debajo del gráfico. Sin una fecha
 * elegida dice lo último de cada carril («Lo último · lun 9 nov»), no una instrucción: cómo se recorre con el teclado
 * está en el nombre del gráfico y en «Cómo leerlo».
 */
import { COPY_DE_LOS_GRAFICOS } from './copy';
import { fechaCorta } from './eje-de-fechas';
import { lecturaDeLaFecha, type FilasDeLaTabla } from './tabla-equivalente';

export function LecturaEnLaFecha({
  tabla,
  fecha,
  tramo,
  hoy,
  porDefecto = null,
}: {
  tabla: FilasDeLaTabla;
  fecha: string | null;
  tramo: { readonly desde: string; readonly hasta: string } | null;
  /** Para escribir la fecha con su año solo si no es el de hoy. */
  hoy: string;
  /** La fecha que se lee sin una elegida: la última con datos. */
  porDefecto?: string | null;
}) {
  const leida = fecha ?? porDefecto;
  return (
    <div className="grafico-base__lectura" aria-live="polite">
      {leida === null ? (
        <p className="nota">{COPY_DE_LOS_GRAFICOS.lecturaSinFecha}</p>
      ) : (
        <p className="grafico-base__lectura-linea">
          <span className="grafico-base__lectura-fecha">
            {fecha === null ? `${COPY_DE_LOS_GRAFICOS.loUltimo} · ` : null}
            {tramo ? `${COPY_DE_LOS_GRAFICOS.tramoElegido(fechaCorta(tramo.desde, hoy), fechaCorta(tramo.hasta, hoy))} · ` : null}
            {fechaCorta(leida, hoy)}
          </span>
          {lecturaDeLaFecha(tabla, leida).map((l, i) => (
            <span key={`${l.nombre}-${i}`} className="grafico-base__lectura-valor">
              <span className="grafico-base__lectura-nombre">{l.nombre}: </span>
              {l.texto}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
