'use client';

/**
 * GR-02 en pantalla · El 1RM estimado (Epley v1), sesión a sesión, con las versiones del plan de fondo (WP-GRAFICOS fase
 * 2, rama B; DL-174 y DL-171). Solo para los ejercicios de la lista de la v1 (RM-16); fuera de la lista no dibuja nada.
 * De arriba abajo:
 * - **la primera línea**, si lo indicado cambió entre versiones («el RIR indicado pasó de 2 a 1: la estimación cambia
 *   aunque la fuerza no»);
 * - el gráfico, con las versiones como bandas: lleno hasta 10 repeticiones equivalentes, hueco de más de 10 a 12 (con
 *   «Incluir…» encendido) y rombo para lo observado por el profesional; el eje abarca 10 kg o 22 lb como mínimo;
 * - cada versión, con la mediana del RIR registrado, las repeticiones de la serie usada y el ruido propio, en texto;
 * - «Cómo se calculó», la tabla (en el gráfico) y lo que mueve un RIR.
 *
 * Lee la estimación (API-PRJ-01 `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE`, con el interruptor apagado y encendido, como
 * ED-74) y el comparador (lo indicado de cada versión y lo cargado después), que comparte con los otros gráficos del
 * historial mientras está en vuelo.
 */
import { entraEnLaEstimacion, type SentidoDeLaMarca } from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { sesionesSoloOrientativas } from '../../fuerza/fuerza';
import { useLecturaDeFuerza } from '../../fuerza/lectura-de-fuerza';
import { inicioDelEje } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { PanelesAlineados } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { cargadasDespues, observacionesDelPeriodo } from './comparador';
import { COPY_FUERZA_ESTIMADA as C } from './copy';
import {
  cambiosDeLoIndicado,
  carrilDeLaFuerza,
  cuantoMueveUnRir,
  ejercicioDeLaClave,
  extremosDeLaFuerza,
  lecturasPorVersion,
  objetivosDeLasVersiones,
  puntosDelCarrilDeFuerza,
} from './fuerza-estimada';
import { useComparador } from './lecturas-del-ejercicio';

const LEYENDA: readonly SentidoDeLaMarca[] = ['REGISTRADO', 'ORIENTATIVA', 'OBSERVADA_POR_EL_PROFESIONAL'];

export function FuerzaEstimada({ lectura, periodo, densidad, ejercicio, bandas, incluirDeEntrada = false, onIncluir }: PropsDelGrafico & { readonly incluirDeEntrada?: boolean; readonly onIncluir?: (incluir: boolean) => void }) {
  const id = useId();
  const exerciseId = ejercicioDeLaClave(ejercicio?.exerciseKey);
  const enLaLista = exerciseId !== null && entraEnLaEstimacion(exerciseId);
  const [incluir, setIncluir] = useState(incluirDeEntrada);
  const { lectura: fuerza, recargar } = useLecturaDeFuerza(lectura.token, lectura.asesoradoId, enLaLista ? exerciseId : undefined, {
    unidad: ejercicio?.unidad ?? null,
    desde: inicioDelEje(periodo),
    hasta: periodo.hasta,
    sesionPerdida: lectura.sesionPerdida,
  });
  const { comparador } = useComparador(lectura, periodo, enLaLista);

  const linea = fuerza.tipo === 'lista' ? (incluir ? fuerza.encendido : fuerza.apagado) : null;
  const dibujo = useMemo(() => {
    if (fuerza.tipo !== 'lista' || !linea) return null;
    const soloOrientativas = incluir ? [] : sesionesSoloOrientativas(fuerza.apagado?.puntos ?? [], fuerza.encendido?.unidad === fuerza.apagado?.unidad ? (fuerza.encendido?.puntos ?? []) : []);
    const tardias = comparador.tipo === 'lista' ? cargadasDespues(comparador.ejecuciones) : new Set<string>();
    const puntos = puntosDelCarrilDeFuerza(linea.puntos, linea.noEntraron, soloOrientativas, tardias);
    const observaciones =
      comparador.tipo === 'lista' && exerciseId ? observacionesDelPeriodo(comparador.ejecuciones, `e:${exerciseId}`, comparador.objetivosPorVersion, inicioDelEje(periodo), periodo.hasta) : [];
    const cambios = comparador.tipo === 'lista' ? cambiosDeLoIndicado(fuerza.versiones, objetivosDeLasVersiones(linea.puntos, observaciones, fuerza.versiones)) : [];
    const masReciente = [...linea.puntos].filter((p) => p.source === 'PERSON').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0] ?? null;
    return {
      carril: carrilDeLaFuerza(puntos, linea.puntos, linea.unidad),
      porVersion: lecturasPorVersion(linea.puntos, fuerza.versiones, linea.unidad),
      cambios,
      notas: [extremosDeLaFuerza(linea.puntos), cuantoMueveUnRir(masReciente), C.soloVos].filter((t): t is string => t !== null),
    };
  }, [fuerza, linea, incluir, comparador, exerciseId, periodo]);

  if (!enLaLista) return null;
  if (fuerza.tipo === 'cargando') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'CARGANDO' }} />;
  // Sin acceso, el gráfico no está: un área sin acceso no deja rastro.
  if (fuerza.tipo === 'no-disponible') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_ACCESO' }} />;
  if (fuerza.tipo === 'error') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'ERROR', motivo: fuerza.motivo }} onReintentar={recargar} />;
  const cambiar = (x: boolean) => {
    setIncluir(x);
    onIncluir?.(x);
  };
  const interruptor = (
    <label className="capa grafico-de-entrenamiento__interruptor" data-incluir-orientativas>
      <input type="checkbox" role="switch" checked={incluir} onChange={(e) => cambiar(e.target.checked)} />
      <span>{C.incluir}</span>
    </label>
  );
  if (!dibujo) {
    return (
      <section className="grafico-de-entrenamiento" aria-labelledby={`${id}-titulo`} data-grafico="GR-02">
        <h3 id={`${id}-titulo`} className="grafico-base__titulo">
          {C.titulo}
        </h3>
        <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.sinPuntos }} />
        {interruptor}
      </section>
    );
  }
  return (
    <section className="grafico-de-entrenamiento" aria-label={C.titulo} data-grafico="GR-02">
      {dibujo.cambios.length > 0 ? (
        <ul className="grafico-de-entrenamiento__primera-linea" data-cambio-de-lo-indicado>
          {dibujo.cambios.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}
      {comparador.tipo === 'error' ? <p className="nota">{C.sinIndicado}</p> : null}
      <PanelesAlineados titulo={C.titulo} periodo={periodo} carriles={[dibujo.carril]} bandas={bandas} densidad={densidad} leyenda={LEYENDA} notas={dibujo.notas} />
      {interruptor}
      {dibujo.porVersion.length > 0 ? (
        <div className="grafico-de-entrenamiento__por-version">
          <p className="grafico-de-entrenamiento__subtitulo">{C.porVersion}</p>
          <ul data-lectura-por-version>
            {dibujo.porVersion.map((v) => (
              <li key={v.planVersionId}>
                <strong>{v.rotulo}:</strong> {v.texto}.
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <details className="grafico-de-entrenamiento__como">
        <summary>{C.comoSeCalculo}</summary>
        {C.comoSeCalculoTexto.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </details>
    </section>
  );
}
