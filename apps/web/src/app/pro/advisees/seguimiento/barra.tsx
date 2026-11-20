'use client';

/**
 * Las tres vistas de la ficha (ESPECIFICACION.md §1) y el período que comparten. El período vive en la URL: es el mismo
 * en Resumen, Línea de tiempo y Analizar, y volver atrás lo recupera.
 *
 * WP-ESCRITORIO-AMABLE (C-02): el período es **un solo control**. Desde WP-ESCRITORIO-AREAS es una pieza que comparten
 * la ficha y las pestañas de área (`ControlDePeriodo`): acá se le dan los atajos de la ficha (7, 30 y 90 días, y un año)
 * y su tope de un año.
 *
 * WP-GRAFICOS-POR-FASE (GPF-01 a GPF-03): en «Patrones» y «Analizar», que son gráficos, el control lleva las opciones de
 * los gráficos: 4 semanas, 12 semanas, 6 meses, un año, desde que la acompañás, a medida y por versión del plan (con «La
 * anterior» y «La siguiente»). El período sigue siendo uno en la dirección: el que se elige en una vista sigue en la otra.
 */
import { useMemo } from 'react';
import { Pestanas } from '../../../../components/pestanas';
import { ControlDePeriodo } from '../control-de-periodo';
import { SIN_ETAPAS, useEtapasDeLaPersona } from '../graficos/etapas-de-la-persona';
import { COPY_DEL_PERIODO as P, etapasElegibles, problemaDelRango } from '../graficos/periodo-de-los-graficos';
import { useSeguimiento } from './contexto';
import { hoyEn, parametrosDePeriodo, PRESETS_DE_LOS_GRAFICOS, PRESETS_DE_PERIODO, VISTAS_CON_GRAFICOS, VISTAS_DEL_SEGUIMIENTO, type VistaDelSeguimiento } from './estado';

export function PestanasDelSeguimiento({ actual }: { actual: VistaDelSeguimiento }) {
  const { href } = useSeguimiento();
  return <Pestanas etiqueta="Vistas del seguimiento" vistas={VISTAS_DEL_SEGUIMIENTO} actual={actual} href={(clave) => href({ vista: clave === 'resumen' ? null : clave })} />;
}

export function SelectorDePeriodo({ vista }: { vista: VistaDelSeguimiento }) {
  const { periodo, ir } = useSeguimiento();
  if (VISTAS_CON_GRAFICOS.includes(vista)) return <SelectorDePeriodoDeLosGraficos />;
  return <ControlDePeriodo periodo={periodo} atajos={PRESETS_DE_PERIODO} maximoDeDias={366} onElegir={(p) => ir(parametrosDePeriodo(p))} />;
}

function SelectorDePeriodoDeLosGraficos() {
  const { periodo, ir, token, asesoradoId, sesionPerdida, acompanamiento, versionDeAcceso } = useSeguimiento();
  const hoy = useMemo(() => hoyEn(), []);
  // La misma lectura que «Analizar» usa para las etapas (`leerLasVersionesDelAno`): no se pide dos veces.
  const lectura = useEtapasDeLaPersona(token, asesoradoId, sesionPerdida, hoy, undefined, versionDeAcceso);
  const etapas = lectura.tipo === 'lista' ? lectura.etapas : SIN_ETAPAS;
  const porArea = [etapasElegibles(etapas.TRAINING, acompanamiento.inicio), etapasElegibles(etapas.NUTRITION, acompanamiento.inicio)];
  // La versión se nombra solo si el período de la dirección es el suyo (su vigencia, o sus últimos 366 días): una
  // dirección vieja o editada a mano con otras fechas no dice el nombre de una versión que no es lo que se ve.
  const elegida = periodo.etapa
    ? (etapas[periodo.etapa.dominio].find((e) => e.planVersionId === periodo.etapa?.planVersionId && e.ultimoDia === periodo.hasta && e.desde <= periodo.desde) ?? null)
    : null;
  return (
    <div className="selector-de-periodo-de-graficos" data-selector-de-periodo>
      <ControlDePeriodo
        periodo={periodo}
        atajos={PRESETS_DE_LOS_GRAFICOS}
        maximoDeDias={366}
        problemaDelRango={(desde, hasta) => problemaDelRango(desde, hasta, hoy, acompanamiento.inicio)}
        onElegir={(p) => ir(parametrosDePeriodo(p))}
        graficos={{
          vinculo: { elegido: periodo.vinculo === true, onElegir: () => ir(parametrosDePeriodo({ preset: null, desde: '', hasta: '', vinculo: true })) },
          versiones: {
            porArea,
            elegida,
            onElegir: (e) => {
              const hasta = e.ultimoDia ?? e.desde;
              // Una versión de más de 366 días se ve en sus últimos 366 (el tope de la ficha), y la nota lo dice.
              const desde = e.desde < restar(hasta, 365) ? restar(hasta, 365) : e.desde;
              ir(parametrosDePeriodo({ preset: null, desde, hasta, etapa: { dominio: e.dominio, planVersionId: e.planVersionId } }));
            },
            falla: lectura.tipo === 'lista' && lectura.fallo ? P.versionesNoLeidas : null,
          },
        }}
      />
      {periodo.vinculo && periodo.recortado ? <p className="nota">{P.hastaUnAnio}</p> : null}
      {elegida && elegida.ultimoDia && elegida.desde < periodo.desde ? <p className="nota">{P.versionRecortada}</p> : null}
    </div>
  );
}

const restar = (fecha: string, dias: number): string => new Date(Date.parse(`${fecha}T12:00:00Z`) - dias * 86_400_000).toISOString().slice(0, 10);
