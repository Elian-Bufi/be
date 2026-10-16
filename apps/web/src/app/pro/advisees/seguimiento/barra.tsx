'use client';

/**
 * Las tres vistas de la ficha (ESPECIFICACION.md §1) y el período que comparten. El período vive en la URL: es el mismo
 * en Resumen, Línea de tiempo y Analizar, y volver atrás lo recupera.
 *
 * WP-ESCRITORIO-AMABLE (C-02): el período es **un solo control**. Desde WP-ESCRITORIO-AREAS es una pieza que comparten
 * la ficha y las pestañas de área (`ControlDePeriodo`): acá se le dan los atajos de la ficha (7, 30 y 90 días, y un año)
 * y su tope de un año.
 */
import { Pestanas } from '../../../../components/pestanas';
import { ControlDePeriodo } from '../control-de-periodo';
import { useSeguimiento } from './contexto';
import { parametrosDePeriodo, PRESETS_DE_PERIODO, VISTAS_DEL_SEGUIMIENTO, type VistaDelSeguimiento } from './estado';

export function PestanasDelSeguimiento({ actual }: { actual: VistaDelSeguimiento }) {
  const { href } = useSeguimiento();
  return <Pestanas etiqueta="Vistas del seguimiento" vistas={VISTAS_DEL_SEGUIMIENTO} actual={actual} href={(clave) => href({ vista: clave === 'resumen' ? null : clave })} />;
}

export function SelectorDePeriodo() {
  const { periodo, ir } = useSeguimiento();
  return <ControlDePeriodo periodo={periodo} atajos={PRESETS_DE_PERIODO} maximoDeDias={366} onElegir={(p) => ir(parametrosDePeriodo(p))} />;
}
