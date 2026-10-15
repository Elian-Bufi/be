'use client';

/**
 * «Cómo se lee esta vista», para Antropometría · Evolución (WP-ESCRITORIO-AREAS; F-14): lo que antes estaba plegado
 * dentro del gráfico («Cómo se lee»), en el mismo lugar que la ayuda de Tomas y de la carga. Los textos que el dominio ya
 * fija con una prueba se usan como están.
 */
import { COPY_ANTROPOMETRIA as C, COPY_EVOLUCION } from '@be/domain';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';

export function AyudaDeEvolucion() {
  return (
    <AyudaDeVista titulo="Cómo se lee la Evolución" deQue="antropometria-evolucion">
      <p className="nota">Cada medición registrada, en el tiempo, una métrica por vez. Ubica cada valor: no califica ninguno.</p>
      <ul className="como-se-lee__lista">
        <Renglon muestra={<Icono nombre="calendario" tamano={20} />}>
          <strong>El período y la métrica:</strong> arriba se eligen las fechas y la medición que se mira. Si una métrica no
          está en el período nuevo, se pasa a la primera y se dice.
        </Renglon>
        <Renglon muestra={<Icono nombre="sin-datos" tamano={20} />}>
          <strong>Sin dato.</strong> {C.explicacionDeSinDato}
        </Renglon>
        <Renglon muestra={<Icono nombre="protocolo" tamano={20} />}>
          <strong>Comparables o no.</strong> {C.explicacionDeComparabilidad}
        </Renglon>
        <Renglon muestra={<Icono nombre="tabla" tamano={20} />}>
          <strong>La tabla.</strong> {COPY_EVOLUCION.tablaAclaracion} Cada punto se elige con un clic, un toque o las flechas, y abre su valor exacto y su
          origen.
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
