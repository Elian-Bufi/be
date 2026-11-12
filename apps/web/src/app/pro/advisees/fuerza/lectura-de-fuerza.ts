'use client';

/**
 * La lectura de la vertical de fuerza (WP-EDITORES-PROFESIONAL §5.8; DL-171): la clave
 * TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE de API-PRJ-01, con el interruptor apagado y encendido. La usan la tarjeta del
 * ejercicio (ED-75), el cuadro de la carga (ED-76) y la evolución en «Analizar» (ED-74). Las cuentas son del dominio y
 * de la API; acá solo se lee.
 *
 * El período: el último año (la API acepta hasta 366 días), salvo que quien lee pida otro. La API ya lo recorta al
 * inicio del acompañamiento (RF-025, DJ-14).
 */
import type { PuntoDeFuerza } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { api, type Resultado } from '../../../../lib/api';
import { motivoDeFalla, type MotivoDeFalla } from '../../../../lib/fallas';
import type { SerieQueNoEntro } from './fuerza';

/** Una línea de la evolución: los puntos de un ejercicio en una unidad, con las series que no entraron. */
export interface LineaDeFuerza {
  readonly unidad: 'kg' | 'lb';
  readonly puntos: readonly PuntoDeFuerza[];
  readonly noEntraron: readonly SerieQueNoEntro[];
}

export type LecturaDeFuerza =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'no-disponible' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | {
      readonly tipo: 'lista';
      /** Con «Incluir las de más de 10 a 12» apagado (la regla de la tarjeta y del gráfico de entrada). */
      readonly apagado: LineaDeFuerza | null;
      /** Encendido: también las orientativas. */
      readonly encendido: LineaDeFuerza | null;
      /** La zona y el día de hoy de la lectura (la fecha de una observación nueva). */
      readonly zona: string;
      readonly hoy: string;
      readonly desde: string;
      /** Los ejercicios de la lista con algo en el período, para el selector de «Analizar». */
      readonly ejercicios: readonly { readonly exerciseId: string; readonly name: string; readonly units: readonly ('kg' | 'lb')[] }[];
      /** «Hay registros con otro profesional que no ves». */
      readonly deOtros: boolean;
    };

/** Casi un año para atrás: 365 días con hoy. La API acepta hasta 366, y el día de hoy del navegador puede ir uno adelante del de la API. */
export function unAnioAntes(hoy: string): string {
  const d = new Date(`${hoy}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 364);
  return d.toISOString().slice(0, 10);
}

type Respuesta = Awaited<ReturnType<typeof api.proyeccion>>;

function lineaDe(r: Respuesta): LineaDeFuerza | null {
  if (!r.ok) return null;
  const x = r.datos.data.result;
  if (!x || x.kind !== 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE' || !x.estimate) return null;
  return { unidad: x.estimate.unit, puntos: x.estimate.points, noEntraron: x.estimate.notIncluded };
}

/**
 * Lee la línea de un ejercicio, con el interruptor apagado y encendido. Sin `unidad`, la API elige la primera con
 * puntos (kg si no hay ninguna). `undefined` en `exerciseId`: no lee; `null`: lee sin ejercicio, solo la lista de los que
 * tienen algo en el período (el selector de «Analizar»).
 */
export function useLecturaDeFuerza(
  token: string,
  asesoradoId: string,
  exerciseId: string | null | undefined,
  o: { readonly unidad?: 'kg' | 'lb' | null; readonly desde?: string | null; readonly hasta?: string | null; readonly sesionPerdida: (r: Resultado<unknown>) => boolean },
): { readonly lectura: LecturaDeFuerza; readonly recargar: () => void } {
  const [lectura, setLectura] = useState<LecturaDeFuerza>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  const { unidad = null, desde = null, hasta = null, sesionPerdida } = o;
  useEffect(() => {
    if (exerciseId === undefined) return;
    let vigente = true;
    setLectura({ tipo: 'cargando' });
    const hoyLocal = new Date().toISOString().slice(0, 10);
    const base = {
      ...(exerciseId ? { exerciseId, ...(unidad ? { unit: unidad } : {}) } : {}),
      periodStart: desde ?? unAnioAntes(hasta ?? hoyLocal),
      ...(hasta ? { periodEnd: hasta } : {}),
    };
    void Promise.all([
      api.proyeccion(token, asesoradoId, 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE', { ...base, includeOrientative: 'false' }),
      api.proyeccion(token, asesoradoId, 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE', { ...base, includeOrientative: 'true' }),
    ]).then(([a, e]) => {
      if (!vigente || sesionPerdida(a) || sesionPerdida(e)) return;
      for (const r of [a, e]) {
        if (!r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') return setLectura({ tipo: 'no-disponible' });
        if (!r.ok) return setLectura({ tipo: 'error', motivo: motivoDeFalla(r) });
      }
      if (!a.ok || !e.ok) return;
      const d = a.datos.data;
      const x = d.result?.kind === 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE' ? d.result : null;
      setLectura({
        tipo: 'lista',
        apagado: lineaDe(a),
        encendido: lineaDe(e),
        zona: d.period.timeZone,
        hoy: d.period.end,
        desde: d.period.start,
        ejercicios: x?.exercises ?? [],
        deOtros: x?.otherProfessionalRecords ?? false,
      });
    });
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, exerciseId, unidad, desde, hasta, sesionPerdida, vuelta]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);
  return { lectura, recargar };
}
