/**
 * Los puntos y los días sin dato de una serie antropométrica, como lista: la forma equivalente del gráfico de
 * evolución y el camino del lector de pantalla. Un día sin medición vigente se dice como lo que es, un rango sin valor:
 * sin cero y sin nada que lo una (REG-06-165/166; INV-06-176/177).
 */
import { cantidad, COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, numero, type SerieApi } from '@be/domain';
import { dia, fecha } from '../formato';
import { Aviso, Insignia, Parrafo, Subtitulo, Tarjeta } from '../ui';

/** Un día con medición vigente; si es un resultado de fórmula, con el método que lo dio. */
export function PuntoDeLaSerie({ punto, metodo }: { punto: SerieApi['series'][number]; metodo: string | null }) {
  return (
    <Tarjeta>
      <Subtitulo>{fecha(punto.occurredAt)}</Subtitulo>
      <Parrafo>{cantidad(punto.value, punto.unit)}</Parrafo>
      {punto.dataClass === 'DERIVED' ? (
        <Parrafo tenue>
          {COPY_ANTROPOMETRIA.metodoDelResultado}: {metodo ?? COPY_ANTROPOMETRIA.metodoSinNombre}
        </Parrafo>
      ) : null}
      <Insignia texto={ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]} etiqueta={`${COPY_ANTROPOMETRIA.origenDelDato}: ${ETIQUETA_DE_CLASE_DE_DATO[punto.dataClass]}`} />
      {punto.correctionState === 'CORRECTED' ? <Insignia texto={COPY_ANTROPOMETRIA.corregida} etiqueta={COPY_ANTROPOMETRIA.corregida} /> : null}
      {punto.incomparableWithPrevious.length > 0 ? (
        <Aviso tipo="info" titulo={COPY_ANTROPOMETRIA.noComparable}>
          <Parrafo tenue>{punto.incomparableWithPrevious.map((m) => COPY_ANTROPOMETRIA.motivoNoComparable[m]).join(' · ')}</Parrafo>
        </Aviso>
      ) : null}
    </Tarjeta>
  );
}

/**
 * Los días sin medición vigente, dichos como lo que son: un rango, sin valor, sin cero y sin nada que los una.
 * Agruparlos no es ocultarlos —se dicen todos, con sus fechas y su cantidad—: es evitar que noventa filas iguales
 * tapen los días que sí tienen medición.
 */
export function HuecoDeLaSerie({ hueco }: { hueco: SerieApi['gaps'][number] }) {
  const desde = dia(`${hueco.from}T12:00:00Z`);
  const hasta = dia(`${hueco.to}T12:00:00Z`);
  const texto = hueco.days === 1 ? desde : `${desde} — ${hasta}`;
  const detalle = hueco.days === 1 ? COPY_ANTROPOMETRIA.sinDato : `${numero(hueco.days)} días ${COPY_ANTROPOMETRIA.sinDato.toLowerCase()}`;
  return (
    <Tarjeta>
      <Subtitulo>{texto}</Subtitulo>
      <Insignia texto={detalle} etiqueta={`${texto}: ${detalle}`} />
    </Tarjeta>
  );
}
