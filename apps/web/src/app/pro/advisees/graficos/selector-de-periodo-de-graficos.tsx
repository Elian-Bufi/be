'use client';

/**
 * El período de los gráficos donde el gráfico lo elige solo (WP-GRAFICOS-POR-FASE, GPF-01 a GPF-04): el cuadro del
 * ejercicio y «Patrones» del plan. Es el mismo control que la ficha (`ControlDePeriodo`) con las opciones de los gráficos
 * (`periodo-de-los-graficos.ts`): 4 semanas, 12 semanas, 6 meses, un año, desde que la acompañás, a medida y por versión
 * del plan, con «La anterior» y «La siguiente». Abre en 12 semanas (GPF-D02).
 */
import { useMemo, useState } from 'react';
import type { Resultado } from '../../../../lib/api';
import { ControlDePeriodo, type PeriodoDelControl } from '../control-de-periodo';
import { hoyEn } from '../seguimiento/estado';
import type { LecturaDelInicio } from './entrenamiento/lecturas-del-ejercicio';
import { SIN_ETAPAS, useEtapasDeLaPersona, type LecturaDeLasEtapas } from './etapas-de-la-persona';
import {
  COPY_DEL_PERIODO as P,
  DIAS_MAXIMOS_DE_LOS_GRAFICOS,
  DURACIONES,
  duracion,
  ELECCION_POR_DEFECTO,
  etapasElegibles,
  periodoDeLaEleccion,
  problemaDelRango,
  type EleccionDePeriodo,
  type PeriodoElegido,
} from './periodo-de-los-graficos';

export interface EleccionDePeriodoLeida {
  readonly eleccion: EleccionDePeriodo;
  readonly elegir: (e: EleccionDePeriodo) => void;
  /** `null` mientras se lee desde cuándo la acompañás. */
  readonly periodo: PeriodoElegido | null;
  readonly etapas: LecturaDeLasEtapas;
}

/** La elección del período y el período que resulta, con las versiones de los planes de la persona en el último año. */
export function useEleccionDePeriodo(token: string, asesoradoId: string, sesionPerdida: (r: Resultado<unknown>) => boolean, inicio: LecturaDelInicio): EleccionDePeriodoLeida {
  const hoy = useMemo(() => hoyEn(), []);
  const [eleccion, elegir] = useState<EleccionDePeriodo>(ELECCION_POR_DEFECTO);
  const etapas = useEtapasDeLaPersona(token, asesoradoId, sesionPerdida, hoy);
  const periodo = useMemo(() => {
    if (inicio.tipo !== 'listo') return null;
    const contexto = { hoy, inicioDelVinculo: inicio.inicio, etapas: etapas.tipo === 'lista' ? etapas.etapas : SIN_ETAPAS };
    // Una versión que todavía no se leyó (o que ya no está) no deja la pantalla vacía: vale la de siempre.
    return periodoDeLaEleccion(eleccion, contexto) ?? periodoDeLaEleccion(ELECCION_POR_DEFECTO, contexto);
  }, [inicio, eleccion, etapas, hoy]);
  return { eleccion, elegir, periodo, etapas };
}

const ATAJOS = DURACIONES.map((d) => ({ dias: d.dias, texto: d.texto }));
type DiasDeAtajo = (typeof DURACIONES)[number]['dias'];

/** El control, con lo que dice debajo si el período se recortó. */
export function SelectorDePeriodoDeGraficos({ leida, inicio }: { leida: EleccionDePeriodoLeida; inicio: LecturaDelInicio }) {
  const { eleccion, elegir, periodo, etapas } = leida;
  if (!periodo) return null;
  const control: PeriodoDelControl<DiasDeAtajo> = { preset: eleccion.tipo === 'DURACION' ? duracion(eleccion.duracion).dias : null, desde: periodo.desde, hasta: periodo.hasta };
  const vinculo = inicio.tipo === 'listo' ? inicio.inicio : null;
  const porArea = etapas.tipo === 'lista' ? [etapasElegibles(etapas.etapas.TRAINING, vinculo), etapasElegibles(etapas.etapas.NUTRITION, vinculo)] : [];
  const nota =
    eleccion.tipo === 'DESDE_EL_VINCULO' && periodo.recortado
      ? inicio.tipo === 'listo' && inicio.fallo
        ? P.sinInicio
        : P.hastaUnAnio
      : eleccion.tipo === 'ETAPA' && periodo.recortado
        ? P.versionRecortada
        : null;
  return (
    <div className="selector-de-periodo-de-graficos" data-selector-de-periodo>
      <ControlDePeriodo
        periodo={control}
        atajos={ATAJOS}
        maximoDeDias={DIAS_MAXIMOS_DE_LOS_GRAFICOS}
        problemaDelRango={(desde, hasta) => problemaDelRango(desde, hasta, periodo.hoy, vinculo)}
        onElegir={(p) => {
          const d = DURACIONES.find((x) => x.dias === p.preset);
          elegir(d ? { tipo: 'DURACION', duracion: d.clave } : { tipo: 'A_MEDIDA', desde: p.desde, hasta: p.hasta });
        }}
        graficos={{
          vinculo: { elegido: eleccion.tipo === 'DESDE_EL_VINCULO', onElegir: () => elegir({ tipo: 'DESDE_EL_VINCULO' }) },
          versiones: {
            porArea,
            elegida: eleccion.tipo === 'ETAPA' ? periodo.etapa : null,
            onElegir: (e) => elegir({ tipo: 'ETAPA', dominio: e.dominio, planVersionId: e.planVersionId }),
            falla: etapas.tipo === 'lista' && etapas.fallo ? P.versionesNoLeidas : null,
          },
        }}
      />
      {nota ? <p className="nota">{nota}</p> : null}
    </div>
  );
}
