'use client';

/**
 * GR-05 en pantalla · El RIR indicado y el RIR registrado a lo largo del bloque (WP-GRAFICOS fase 2, rama B; DL-174). En
 * un mismo panel, porque tienen la misma unidad: lo indicado por cada versión como escalón discontinuo y lo registrado en
 * puntos. «A igual carga» deja solo las sesiones con exactamente esa carga y esa unidad, y lo que se ve se dice en
 * palabras, por versión, sin resumirlo en una cifra.
 *
 * Lee el comparador «Planificado y registrado» (API-TRN-21 y API-SER-01, GR-T14): en el historial, el que lee una vez
 * `ProveedorDelComparador` para todos sus gráficos.
 *
 * Con la pasada visual (DISENO-VISUAL §2 «B · Entrenamiento»): la línea cortada y la tira de cada sesión van en la
 * leyenda, con las marcas que se ven; lo que se ve, en palabras y a la vista debajo del gráfico (GR-05: «lo que se ve se
 * describe»); lo que aclara (qué es el escalón, «a igual carga», por qué lo indicado va hueco), en el «Cómo leerlo» de la
 * base, uno solo.
 */
import type { SentidoDeLaMarca } from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { COPY_DE_LOS_GRAFICOS } from '../copy';
import type { FichaDeLaLeyenda } from '../marcas';
import { inicioDelEje } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { PanelesAlineados } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { cargadasDespues, observacionesDelPeriodo } from './comparador';
import { COPY_RIR_INDICADO_Y_REGISTRADO as C, FICHAS_DE_ENTRENAMIENTO } from './copy';
import { useComparador } from './lecturas-del-ejercicio';
import { aIgualCarga, cargaEnPalabras, cargasDeLaSerie, carrilDelRirIndicadoYRegistrado, loQueSeVe, sesionesDelRir } from './rir-indicado-y-registrado';

export function RirIndicadoYRegistrado({ lectura, periodo, densidad, ejercicio, bandas }: PropsDelGrafico) {
  const id = useId();
  const exerciseKey = ejercicio?.exerciseKey ?? null;
  const numero = ejercicio?.serie ?? 1;
  const { comparador, recargar } = useComparador(lectura, periodo, exerciseKey !== null);
  const [carga, setCarga] = useState<string | null>(null);

  const leido = useMemo(() => {
    if (comparador.tipo !== 'lista' || !exerciseKey) return null;
    const observaciones = observacionesDelPeriodo(comparador.ejecuciones, exerciseKey, comparador.objetivosPorVersion, inicioDelEje(periodo), periodo.hasta);
    const sesiones = sesionesDelRir(observaciones, numero);
    const cargas = cargasDeLaSerie(sesiones);
    // Si la carga elegida ya no está (otro período u otra serie), se ven todas.
    const elegida = cargas.find((c) => c.clave === carga) ?? null;
    const filtradas = aIgualCarga(sesiones, elegida?.clave ?? null);
    return {
      sesiones,
      cargas,
      elegida,
      filtradas,
      carril: carrilDelRirIndicadoYRegistrado(filtradas, { serie: numero, bandas, tardias: cargadasDespues(comparador.ejecuciones), filtrado: elegida !== null }),
      lineas: loQueSeVe(filtradas, bandas, elegida?.carga ?? null),
    };
  }, [comparador, exerciseKey, periodo, numero, carga, bandas]);

  if (!exerciseKey) return null;
  if (comparador.tipo === 'cargando') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'CARGANDO' }} />;
  if (comparador.tipo === 'sin-acceso') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_ACCESO' }} />;
  if (comparador.tipo === 'error') return <EstadoDelGraficoEnPantalla estado={{ tipo: 'ERROR', motivo: comparador.motivo }} onReintentar={recargar} />;
  if (!leido || leido.sesiones.length === 0) return <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.sinSesiones(numero) }} />;
  const { carril, filtradas, cargas, elegida, lineas } = leido;
  const leyenda: SentidoDeLaMarca[] = [
    'REGISTRADO',
    ...(carril.indicado.length > 0 ? (['INDICADO'] as const) : []),
    ...(carril.puntos.some((p) => p.marca === 'HUECA_GRIS') ? (['CARGA_RAPIDA'] as const) : []),
  ];
  // La línea cortada y la tira, en la leyenda, solo si se ven.
  const fichas: FichaDeLaLeyenda[] = [
    ...(carril.escalones.length > 0 ? [{ ...FICHAS_DE_ENTRENAMIENTO.escalon, indice: carril.indice }] : []),
    ...(carril.cobertura.length > 0 ? [FICHAS_DE_ENTRENAMIENTO.tiraDeLaSerie] : []),
  ];
  const aclaraciones = [
    ...C.comoLeerloTexto,
    ...(carril.escalones.length > 0 ? [C.escalonEnLaLeyenda] : []),
    ...(carril.indicado.length > 0 ? [C.varia] : []),
    ...(comparador.enTramos ? [COPY_DE_LOS_GRAFICOS.leidoEnTramos] : []),
  ];
  // GR-05: lo que se ve se describe, a la vista, por versión y en palabras.
  const loQueSeVeALaVista =
    lineas.length > 0 ? (
      <ul className="grafico-de-entrenamiento__lo-que-se-ve" data-lo-que-se-ve>
        {lineas.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    ) : null;
  return (
    <section className="grafico-de-entrenamiento" aria-label={C.titulo(numero)} data-grafico="GR-05">
      {cargas.length > 0 ? (
        <div className="campo grafico-de-entrenamiento__filtro">
          <label htmlFor={`${id}-carga`}>{C.aIgualCarga}</label>
          <select id={`${id}-carga`} value={elegida?.clave ?? ''} onChange={(e) => setCarga(e.target.value || null)} data-a-igual-carga>
            <option value="">{C.todas}</option>
            {cargas.map((c) => (
              <option key={c.clave} value={c.clave}>
                {C.opcion(cargaEnPalabras(c.carga), c.sesiones)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {filtradas.length === 0 ? (
        <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.sinSesionesConEsaCarga }} />
      ) : (
        <PanelesAlineados
          titulo={C.titulo(numero)}
          periodo={periodo}
          carriles={[carril]}
          bandas={bandas}
          densidad={densidad}
          leyenda={leyenda}
          fichas={fichas}
          aclaraciones={aclaraciones}
          aLaVista={loQueSeVeALaVista}
        />
      )}
    </section>
  );
}
