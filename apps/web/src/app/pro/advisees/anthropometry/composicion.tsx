'use client';

/**
 * «Composición corporal», la sección de la pestaña Antropometría al lado de «Evolución» (WP-TABLERO-ALTA-GAMA TB-24;
 * DL-163 D-11): el peso de cada toma, partido en masa libre de grasa y masa grasa solo cuando el método lo parte, y
 * cuánto cambió cada parte. La pieza es la misma que la de la pregunta de «Analizar» (`seguimiento/composicion-en-pantalla.tsx`).
 *
 * El período vive en la dirección, como en «Evolución», con sus atajos: 90 días o un año (hasta 366 días). Abre con un año
 * porque las tomas son cada cuatro a seis semanas: en 90 días hay dos o tres. API-ANT-06 lee hasta 92 días por pedido, así
 * que un año son cuatro lecturas (TA-24).
 */
import { useMemo } from 'react';
import { AyudaDeVista, RenglonDeAyuda as Renglon } from '../../../../components/ayuda-de-vista';
import { Icono } from '../../../../components/icono';
import { ControlDePeriodo } from '../control-de-periodo';
import { ATAJOS_DE_LA_COMPOSICION, MAXIMO_DE_DIAS_DE_LA_COMPOSICION, periodoDeLaComposicion, type DiasDeLaComposicion } from '../seguimiento/composicion';
import { LecturaDeLaPieza, useLecturaDeLaComposicion } from '../seguimiento/composicion-en-pantalla';
import { hoyEn } from '../seguimiento/estado';
import { useAntropometria } from './antropometria';

export function VistaDeComposicion() {
  const { token, asesoradoId, sesionPerdida, parametros, ir } = useAntropometria();
  const hoy = hoyEn();
  const clave = `${parametros.get('p') ?? ''}|${parametros.get('desde') ?? ''}|${parametros.get('hasta') ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const periodo = useMemo(() => periodoDeLaComposicion(parametros, hoy), [clave, hoy]);
  const { lectura, recargar } = useLecturaDeLaComposicion(token, asesoradoId, periodo.desde, periodo.hasta, sesionPerdida);
  const elegir = (p: { preset: DiasDeLaComposicion | null; desde: string; hasta: string }) => ir({ p: p.preset ? String(p.preset) : null, desde: p.preset ? null : p.desde, hasta: p.preset ? null : p.hasta });
  return (
    <section className="evolucion" aria-labelledby="titulo-composicion">
      <div className="evolucion__encabezado">
        <h2 id="titulo-composicion">Composición corporal</h2>
        <p className="nota evolucion__bajada">El peso de cada toma, en kg, partido solo cuando el método lo parte. Un método por gráfico: ubica cada valor, no califica ninguno.</p>
        <ControlDePeriodo periodo={periodo} atajos={ATAJOS_DE_LA_COMPOSICION} maximoDeDias={MAXIMO_DE_DIAS_DE_LA_COMPOSICION} onElegir={elegir} />
      </div>
      <LecturaDeLaPieza lectura={lectura} recargar={recargar} desde={periodo.desde} hasta={periodo.hasta} hoy={hoy} />
    </section>
  );
}

/** «Cómo se lee la Composición corporal», en el mismo lugar que la ayuda de las otras secciones. */
export function AyudaDeLaComposicion() {
  return (
    <AyudaDeVista titulo="Cómo se lee la Composición corporal" deQue="antropometria-composicion">
      <p className="nota">El peso de cada toma y de qué está hecho, en kg, con un método por gráfico. Ubica cada valor: no califica ninguno.</p>
      <ul className="como-se-lee__lista">
        <Renglon esencial muestra={<Icono nombre="peso" tamano={20} />}>
          <strong>La columna se parte solo con un método de dos compartimentos</strong> (Durnin y Womersley con Siri, o
          Faulkner): masa libre de grasa abajo y masa grasa arriba suman el peso de la toma. Una toma sin ese método va en
          contorno: es el peso, sin partir.
        </Renglon>
        <Renglon esencial muestra={<Icono nombre="protocolo" tamano={20} />}>
          <strong>Un cambio de método corta.</strong> Dos ecuaciones dan valores distintos sobre la misma toma: donde cambia el
          método o el protocolo hay una vertical, y ninguna diferencia la cruza.
        </Renglon>
        <Renglon muestra={<Icono nombre="comparar" tamano={20} />}>
          <strong>Cuánto cambió cada parte:</strong> cada fila usa la misma vara, así que un kilo mide lo mismo en el peso
          que en la grasa. La masa muscular de Lee va en su fila, porque no suma el peso.
        </Renglon>
        <Renglon muestra={<Icono nombre="tabla" tamano={20} />}>
          <strong>La tabla</strong> tiene cada toma, con su peso, sus dos masas y cómo va en el gráfico.
        </Renglon>
      </ul>
    </AyudaDeVista>
  );
}
