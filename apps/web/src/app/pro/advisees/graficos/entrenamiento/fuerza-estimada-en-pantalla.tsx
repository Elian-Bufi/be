'use client';

/**
 * GR-02 en pantalla · El 1RM estimado (Epley), sesión a sesión, con las versiones del plan de fondo (WP-GRAFICOS fase
 * 2, rama B; DL-174 y DL-171). Solo para los ejercicios de la lista de la estimación (RM-16); fuera de la lista no dibuja nada.
 *
 * Con la pasada visual (DISENO-VISUAL §1 y §2 «B · Entrenamiento»; §5 manda), de arriba abajo:
 * - **el título** «1RM estimado (Epley)» y la línea tenue con la unidad, qué es cada punto, el período y el método;
 * - **la leyenda** como fichas, solo con lo que se ve: lleno hasta 10 repeticiones equivalentes, hueco de más de 10 a 12
 *   (con «Incluir…» encendido), rombo para lo observado y la tira de cada sesión;
 * - **el gráfico** (240 px) con los puntos que dice la leyenda (`porSesion`: se ven sobre la línea también en un año), un
 *   número solo en el elegido, el último, el máximo y el mínimo, y las versiones discretas con el cambio de lo indicado
 *   en su línea («v8 · de 4 a 3 repeticiones», de `bandasConElCambio`: una sola lectura del cambio en toda la página);
 * - **a la vista** (§5.6 y §5.12): el rango de validez y lo que mueve un RIR, como en «Analizar», y cada versión con la
 *   mediana del RIR registrado, las repeticiones de la serie usada y el ruido propio;
 * - **en «Cómo leerlo»**, cerrado: cómo se calcula, qué serie entra de cada sesión y que la persona no lo ve.
 *
 * Lee la estimación (API-PRJ-01 `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE`, con el interruptor apagado y encendido, como
 * ED-74) y el comparador (lo cargado después): en el historial, el que lee una vez `ProveedorDelComparador` para todos.
 */
import { entraEnLaEstimacion, type SentidoDeLaMarca } from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { loQueHaceFalta, sesionesSoloOrientativas } from '../../fuerza/fuerza';
import { useLecturaDeFuerza } from '../../fuerza/lectura-de-fuerza';
import { COPY_DE_LOS_GRAFICOS as G } from '../copy';
import { diaYMes, inicioDelEje } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { PanelesAlineados } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { cargadasDespues, fechasSinSeries, observacionesDelPeriodo } from './comparador';
import { COPY_FUERZA_ESTIMADA as C, FICHA_DE_LA_TIRA } from './copy';
import { carrilDeLaFuerza, ejercicioDeLaClave, lecturasPorVersion, puntosDelCarrilDeFuerza, validezYRuidoDeLaFuerza } from './fuerza-estimada';
import { useComparador } from './lecturas-del-ejercicio';

/**
 * Lleno, «Hasta 10 rep. equivalentes» (no «Registrado»: es una estimación); hueco, de más de 10 a 12; rombo, lo
 * observado. Como la leyenda de «Analizar · Fuerza» (revisión del 15/11).
 */
const LEYENDA: readonly SentidoDeLaMarca[] = ['NUCLEO_DE_LA_ESTIMACION', 'ORIENTATIVA', 'OBSERVADA_POR_EL_PROFESIONAL'];

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
    // Las sesiones en las que se hizo el ejercicio sin ninguna serie escrita (un registro resumido): la API no las cuenta
    // entre las que no entraron, pero tampoco tienen estimación. La línea se corta en ellas y la tira las marca (§5.4).
    const exerciseKey = ejercicio?.exerciseKey ?? null;
    const sinSeries =
      comparador.tipo === 'lista' && exerciseKey ? fechasSinSeries(observacionesDelPeriodo(comparador.ejecuciones, exerciseKey, comparador.objetivosPorVersion, inicioDelEje(periodo), periodo.hasta)) : [];
    const puntos = puntosDelCarrilDeFuerza(linea.puntos, linea.noEntraron, soloOrientativas, tardias, sinSeries);
    // La tira: las sesiones sin estimación (las que no entraron, las que no tuvieron series escritas y, apagado, las que
    // solo tuvieron orientativas).
    const sinEstimacion = [...linea.noEntraron.map((n) => n.date), ...sinSeries, ...soloOrientativas.map((p) => p.date)];
    return {
      carril: carrilDeLaFuerza(puntos, linea.puntos, linea.unidad, sinEstimacion),
      porVersion: lecturasPorVersion(linea.puntos, fuerza.versiones, linea.unidad),
      validezYRuido: validezYRuidoDeLaFuerza(linea.puntos, linea.unidad, incluir),
    };
  }, [fuerza, linea, incluir, comparador, ejercicio?.exerciseKey, periodo]);

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
  // Sin estimaciones en esta unidad (también cuando la API trae la línea vacía, con las series que no entraron): no se
  // dibuja un gráfico vacío; se dice qué falta, como la tarjeta (ED-75) y «Analizar · Fuerza».
  if (!dibujo || dibujo.carril.puntos.length === 0) {
    const falta = loQueHaceFalta(linea?.noEntraron ?? []);
    return (
      <section className="grafico-de-entrenamiento" aria-labelledby={`${id}-titulo`} data-grafico="GR-02">
        <h3 id={`${id}-titulo`} className="grafico-base__titulo">
          {C.titulo}
        </h3>
        <EstadoDelGraficoEnPantalla estado={{ tipo: 'SIN_DATOS', texto: C.sinPuntos }} />
        {falta.motivos ? (
          <p className="nota" data-lo-que-hace-falta>
            {falta.motivos}
          </p>
        ) : null}
        <p className="nota">{falta.regla}</p>
        {interruptor}
      </section>
    );
  }
  const hasta = periodo.hasta >= periodo.hoy ? null : diaYMes(periodo.hasta, periodo.hoy);
  const detalle = C.detalle(dibujo.carril.unidad, G.periodo(diaYMes(inicioDelEje(periodo), periodo.hoy), hasta));
  const conTira = dibujo.carril.cobertura.length > 0;
  return (
    <section className="grafico-de-entrenamiento" aria-label={C.titulo} data-grafico="GR-02">
      <PanelesAlineados
        titulo={C.titulo}
        periodo={periodo}
        carriles={[dibujo.carril]}
        bandas={bandas}
        densidad={densidad}
        leyenda={LEYENDA}
        fichas={conTira ? [FICHA_DE_LA_TIRA.fuerza] : []}
        detalle={detalle}
        // §5.6 y §5.12: el rango de validez y lo que mueve un RIR, a la vista y antes que cualquier comparación.
        // Si no se pudo leer lo indicado, se dice: la línea de cada versión va sin su cambio (§5.12).
        notas={[dibujo.validezYRuido, ...(comparador.tipo === 'error' ? [C.sinIndicado] : [])]}
        aclaraciones={[...C.comoSeCalculoTexto, C.soloVos]}
        aLaVista={
          <>
            {interruptor}
            {/* §5.12: cada versión con la mediana del RIR, las repeticiones de la serie usada y el ruido propio, a la vista. */}
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
          </>
        }
      />
    </section>
  );
}
