'use client';

/**
 * La lectura persistente de la fecha elegida (WP-GRAFICOS fase 2, DL-174): cada carril con su unidad y su calidad («80 kg
 * · RIR 1 · indicado: RIR 2», «2.150 kcal · subtotal: 1 comida sin cantidades», «cargado después»), o «sin dato». Es una
 * región viva cortés: el valor exacto nunca depende del puntero. Sale de las mismas filas que la tabla.
 *
 * Pasada visual (15/11; DISENO-VISUAL §1, principio 1): es la única línea de lectura debajo del gráfico. Sin una fecha
 * elegida dice lo último de cada carril, no una instrucción: cómo se recorre con el teclado está en el nombre del gráfico
 * y en «Cómo leerlo».
 *
 * Revisión del 15/11:
 * - **«Lo último» es lo último de cada carril, con su fecha** (`loUltimoDeCadaCarril`): «Lo último · Peso: 80 kg (10 nov)
 *   · Calorías: 2.150 kcal (14 nov)». Antes leía una sola fecha, la más nueva de todas, y el carril sin dato ese día decía
 *   «sin dato» aunque tuviera un último valor.
 * - **La región viva no sigue al mouse:** cambia con un clic, un toque o el teclado. Al pasar el mouse se ve la lectura de
 *   la fecha de abajo del puntero en un renglón que el lector de pantalla no oye, y la región viva queda (sin cambiar)
 *   fuera de la vista: con un lector de pantalla y el mouse, no se anuncia cada fecha por la que pasa el puntero.
 */
import { COPY_DE_LOS_GRAFICOS } from './copy';
import { fechaCorta } from './eje-de-fechas';
import { lecturaDeLaFecha, loUltimoDeCadaCarril, type FilasDeLaTabla } from './tabla-equivalente';

function LineaDeLaFecha({ tabla, fecha, tramo, hoy }: { tabla: FilasDeLaTabla; fecha: string; tramo: { readonly desde: string; readonly hasta: string } | null; hoy: string }) {
  return (
    <p className="grafico-base__lectura-linea">
      <span className="grafico-base__lectura-fecha">
        {tramo ? `${COPY_DE_LOS_GRAFICOS.tramoElegido(fechaCorta(tramo.desde, hoy), fechaCorta(tramo.hasta, hoy))} · ` : null}
        {fechaCorta(fecha, hoy)}
      </span>
      {lecturaDeLaFecha(tabla, fecha).map((l, i) => (
        <span key={`${l.nombre}-${i}`} className="grafico-base__lectura-valor">
          <span className="grafico-base__lectura-nombre">{l.nombre}: </span>
          {l.texto}
        </span>
      ))}
    </p>
  );
}

function LineaDeLoUltimo({ tabla, hoy }: { tabla: FilasDeLaTabla; hoy: string }) {
  const ultimos = loUltimoDeCadaCarril(tabla);
  if (ultimos.every((u) => u.fecha === null)) return <p className="nota">{COPY_DE_LOS_GRAFICOS.lecturaSinFecha}</p>;
  return (
    <p className="grafico-base__lectura-linea">
      <span className="grafico-base__lectura-fecha">{COPY_DE_LOS_GRAFICOS.loUltimo}</span>
      {ultimos.map((u, i) => (
        <span key={`${u.nombre}-${i}`} className="grafico-base__lectura-valor">
          <span className="grafico-base__lectura-nombre">{u.nombre}: </span>
          {u.texto}
          {u.fecha ? ` (${fechaCorta(u.fecha, hoy)})` : null}
        </span>
      ))}
    </p>
  );
}

export function LecturaEnLaFecha({
  tabla,
  fecha,
  tramo,
  hoy,
  encima = null,
}: {
  tabla: FilasDeLaTabla;
  /** La fecha elegida con un clic, un toque o el teclado; `null`: lo último de cada carril. */
  fecha: string | null;
  tramo: { readonly desde: string; readonly hasta: string } | null;
  /** Para escribir la fecha con su año solo si no es el de hoy. */
  hoy: string;
  /** La fecha bajo el mouse: se ve, pero no cambia la región viva. */
  encima?: string | null;
}) {
  const vivo = fecha === null ? <LineaDeLoUltimo tabla={tabla} hoy={hoy} /> : <LineaDeLaFecha tabla={tabla} fecha={fecha} tramo={tramo} hoy={hoy} />;
  return (
    <>
      <div className={encima === null ? 'grafico-base__lectura' : 'grafico-base__lectura visualmente-oculto'} aria-live="polite" data-lectura-viva>
        {vivo}
      </div>
      {encima !== null ? (
        <div className="grafico-base__lectura" aria-hidden="true" data-lectura-bajo-el-mouse>
          <LineaDeLaFecha tabla={tabla} fecha={encima} tramo={null} hoy={hoy} />
        </div>
      ) : null}
    </>
  );
}
