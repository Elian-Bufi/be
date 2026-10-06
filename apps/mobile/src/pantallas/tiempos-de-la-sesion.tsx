/**
 * APK · Los tiempos de una sesión registrada (WP-ENTRENAMIENTO-SERIES §7.1 y §5; API-TIE-03), en el detalle de «Tu
 * historial». Cada tiempo con su calidad, con texto: medido, estimado, incompleto o no informado. Una sesión registrada
 * sin tiempos sigue sin tiempos: no se le calcula ninguno (§8).
 *
 * Son tiempos marcados en la app: incluyen descansos y carga de datos. No son minutos de esfuerzo, ni una evaluación,
 * ni un cumplimiento: la diferencia con el descanso recomendado va sin juicio («+00:15»).
 */
import {
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  ETIQUETA_DE_CALIDAD_DE_TIEMPO,
  EXPLICACION_DE_CALIDAD,
  textoDeDescanso,
  textoDeDuracion,
  type CalidadDeTiempoApi,
  type Resultado,
  type TiemposDeSesion,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { Cargando, ErrorConReintento } from '../estados';
import { Ayuda, Dato, Parrafo, Seccion } from '../ui';

const CALIDADES: readonly CalidadDeTiempoApi[] = ['MEASURED', 'ESTIMATED', 'INCOMPLETE', 'NO_DATA', 'INVALID'];

export function TiemposDeLaEjecucion({ token, executionId, nombreDe, sesionPerdida }: { token: string; executionId: string; nombreDe: (prescriptionId: string) => string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [r, setR] = useState<Resultado<{ data: TiemposDeSesion }> | null>(null);
  const cargar = useCallback(async () => {
    setR(null);
    const res = await api.tiemposDeLaEjecucion(token, executionId);
    if (sesionPerdida(res)) return;
    setR(res);
  }, [token, executionId, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const e = COPY_ENTRENAMIENTO_POR_SERIE;
  if (!r) {
    return (
      <Seccion titulo={e.tiemposDeLaSesion}>
        <Cargando />
      </Seccion>
    );
  }
  if (!r.ok) {
    // Sin tiempos (una sesión registrada antes de los tiempos, o sin marcar): se dice, no se calcula ninguno.
    if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') {
      return (
        <Seccion titulo={e.tiemposDeLaSesion}>
          <Parrafo tenue>Esta sesión no tiene tiempos marcados.</Parrafo>
        </Seccion>
      );
    }
    return (
      <Seccion titulo={e.tiemposDeLaSesion}>
        <ErrorConReintento sinConexion={r.tipo === 'RED'} onReintentar={() => void cargar()} />
      </Seccion>
    );
  }
  const t = r.datos.data;
  if (t.state === 'NOT_STARTED') {
    return (
      <Seccion titulo={e.tiemposDeLaSesion}>
        <Parrafo tenue>Esta sesión no tiene tiempos marcados.</Parrafo>
      </Seccion>
    );
  }
  return (
    <Seccion titulo={e.tiemposDeLaSesion}>
      {t.state === 'LEFT_INCOMPLETE' ? <Parrafo tenue>Se dejó incompleta: no se afirma cuándo terminó.</Parrafo> : null}
      <Dato etiqueta={e.transcurrido} valor={textoDeDuracion(t.session.elapsed)} />
      <Dato etiqueta={e.pausas} valor={textoDeDuracion(t.session.pauses)} />
      <Dato etiqueta={e.sinPausas} valor={textoDeDuracion(t.session.withoutPauses)} />
      {t.exercises.map((x) => (
        <Dato key={x.prescriptionId} etiqueta={nombreDe(x.prescriptionId)} valor={textoDeDuracion(x.duration)} />
      ))}
      {t.unassigned.ms !== null && t.unassigned.ms > 0 ? <Dato etiqueta={e.sinEjercicioAsignado} valor={textoDeDuracion(t.unassigned)} /> : null}
      {t.rests.map((d) => (
        <Dato key={d.restId} etiqueta={`${COPY_ENTRENAMIENTO.descanso} · ${nombreDe(d.prescriptionId)} · ${COPY_ENTRENAMIENTO.serie} ${d.setIndex}`} valor={textoDeDescanso(d)} />
      ))}
      {t.timedSets.map((s) => (
        <Dato key={s.timingId} etiqueta={`${nombreDe(s.prescriptionId)} · ${COPY_ENTRENAMIENTO.serie} ${s.setIndex}`} valor={`${e.duracionMedida}: ${textoDeDuracion(s.duration)}`} />
      ))}
      <Parrafo tenue>{e.noSonMinutosDeEsfuerzo}</Parrafo>
      <Ayuda titulo="Qué dice cada calidad">
        {CALIDADES.map((c) => (
          <Parrafo key={c}>{`${ETIQUETA_DE_CALIDAD_DE_TIEMPO[c].charAt(0).toLocaleUpperCase('es-AR')}${ETIQUETA_DE_CALIDAD_DE_TIEMPO[c].slice(1)}: ${EXPLICACION_DE_CALIDAD[c]}`}</Parrafo>
        ))}
      </Ayuda>
    </Seccion>
  );
}
