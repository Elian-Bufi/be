'use client';

/**
 * La entrada de «Analizar» (WP-ESCRITORIO-AMABLE, C-19): «¿Qué querés mirar?». Dos caminos para lo mismo, los dos a la
 * vista: una pregunta, que ya trae los gráficos armados (`preguntas.tsx`), o las métricas que se marquen acá, hasta
 * tres y de cualquier área.
 * - **Se ofrece lo que hay** con este asesorado en el período (`useDisponibles`): un área sin datos o sin acceso no
 *   aparece, y cada medida corporal dice cuántas tomas tiene.
 * - **Marcar no arma nada todavía:** «Ver los gráficos» escribe las métricas en la URL. Hasta ahí, nada se pide.
 * - **Con tres marcadas,** las demás quedan apagadas y se dice por qué («Para sumar otra, sacá una»). Adentro de un
 *   análisis, pedir una cuarta sigue abriendo «Elegí cuál reemplazar»: nada se reemplaza en silencio (PRO-06).
 * - **Las de Entrenamiento** son de un ejercicio, una serie y una unidad, que se eligen arriba de sus casillas (kg y lb
 *   nunca se mezclan). Lo que se va a ver se dice entero al pie, antes de confirmar.
 */
import { definicionDeMetrica, MAXIMO_DE_METRICAS, METRICAS_DEL_DICCIONARIO, numero, type DefinicionDeMetrica, type NombreDeIcono, type ReferenciaDeMetrica } from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { Icono } from '../../../../components/icono';
import { textoDeFalla } from './contexto';
import { nombreDeLaReferencia } from './selector';
import type { Disponibles } from './series';

const DE_NUTRICION = METRICAS_DEL_DICCIONARIO.filter((m) => m.area === 'NUTRICION' && m.implementada);
const DE_ENTRENAMIENTO = METRICAS_DEL_DICCIONARIO.filter((m) => m.area === 'ENTRENAMIENTO' && m.implementada);
const NO_OFRECIDAS = METRICAS_DEL_DICCIONARIO.filter((m) => !m.implementada);
/** Cuántas medidas corporales van a la vista; las demás, en «Más medidas». */
const MEDIDAS_A_LA_VISTA = 4;

/** El ícono de cada métrica fija. Acompaña al nombre: nunca va solo. */
const ICONO_DE_METRICA: Readonly<Record<string, NombreDeIcono>> = {
  'nutricion.energia': 'calorias',
  'nutricion.carbohidratos': 'carbohidratos',
  'nutricion.grasas': 'grasas',
  'nutricion.proteinas': 'proteinas',
  'nutricion.fibra': 'fibra',
  'nutricion.registros': 'comida',
  'entrenamiento.carga': 'carga',
  'entrenamiento.repeticiones': 'repetir',
  'entrenamiento.series-registradas': 'series',
};

/** El ícono de una medida corporal, por lo que mide: una masa, un pliegue, un perímetro; lo demás es un resultado calculado. */
function iconoDeLaMedida(d: DefinicionDeMetrica | null): NombreDeIcono {
  const familia = d?.familia ?? '';
  if (familia.startsWith('masa')) return 'peso';
  if (familia.startsWith('pliegue') || familia.startsWith('sumatoria')) return 'pliegue';
  if (familia.startsWith('perimetro')) return 'perimetro';
  return 'calculado';
}

export function ElegirMetricasDeEntrada({ disponibles, onVer }: { disponibles: Disponibles; onVer: (metricas: readonly ReferenciaDeMetrica[]) => void }) {
  const id = useId();
  // Lo marcado, por identificador de métrica y en el orden en que se marcó (es el orden de los gráficos).
  const [marcadas, setMarcadas] = useState<readonly string[]>([]);
  const [ejercicio, setEjercicio] = useState('');
  const [serie, setSerie] = useState(1);
  const [unidad, setUnidad] = useState<'kg' | 'lb'>('kg');
  const ej = disponibles.ejercicios?.find((e) => e.exerciseKey === ejercicio) ?? disponibles.ejercicios?.[0] ?? null;
  useEffect(() => {
    if (ej && !ej.setNumbers.includes(serie)) setSerie(ej.setNumbers[0] ?? 1);
    if (ej && ej.loadUnits.length > 0 && !ej.loadUnits.includes(unidad)) setUnidad(ej.loadUnits[0]!);
  }, [ej, serie, unidad]);

  const medidas = [...(disponibles.antropometria ?? [])].sort((a, b) => b.observations - a.observations);
  const hayNutricion = disponibles.nutricion;
  const hayEntrenamiento = (disponibles.ejercicios?.length ?? 0) > 0;
  const hayAntropometria = medidas.length > 0;
  // Con otro período (u otro acceso) puede dejar de haber lo que estaba marcado: se desmarca, no queda escondido.
  const disponible = (metricId: string): boolean => {
    if (metricId.startsWith('nutricion.')) return hayNutricion;
    if (metricId.startsWith('entrenamiento.')) return hayEntrenamiento;
    return medidas.some((m) => `antropometria.${m.metricCode}` === metricId);
  };
  const vigentes = disponibles.cargando ? marcadas : marcadas.filter(disponible);
  useEffect(() => {
    if (vigentes.length !== marcadas.length) setMarcadas(vigentes);
  }, [vigentes, marcadas]);

  const lleno = vigentes.length >= MAXIMO_DE_METRICAS;
  const alternar = (metricId: string) => setMarcadas((m) => (m.includes(metricId) ? m.filter((x) => x !== metricId) : m.length >= MAXIMO_DE_METRICAS ? m : [...m, metricId]));
  const referencia = (metricId: string): ReferenciaDeMetrica | null => {
    const d = definicionDeMetrica(metricId, '');
    if (!d) return null;
    if (d.area !== 'ENTRENAMIENTO') return { metricId, exerciseKey: null, setIndex: null, unit: null };
    return ej ? { metricId, exerciseKey: ej.exerciseKey, setIndex: d.requiereSerie ? serie : null, unit: d.parametro === 'LOAD' ? unidad : null } : null;
  };
  const referencias = vigentes.map(referencia).filter((r): r is ReferenciaDeMetrica => r !== null);
  const nombres = referencias.map((r) => nombreDeLaReferencia(r, definicionDeMetrica(r.metricId, ''), disponibles.ejercicios));

  const casilla = (metricId: string, nombre: string, icono: NombreDeIcono | null, detalle?: string) => {
    const marcada = vigentes.includes(metricId);
    return (
      <label key={metricId} className={marcada ? 'casilla-de-metrica casilla-de-metrica--marcada' : 'casilla-de-metrica'}>
        <input type="checkbox" checked={marcada} disabled={!marcada && lleno} aria-describedby={`${id}-cupo`} onChange={() => alternar(metricId)} />
        {icono ? <Icono nombre={icono} tamano={18} /> : null}
        <span>{nombre}</span>
        {detalle ? <span className="casilla-de-metrica__detalle">{detalle}</span> : null}
      </label>
    );
  };
  const medida = (m: (typeof medidas)[number]) =>
    casilla(`antropometria.${m.metricCode}`, m.name, iconoDeLaMedida(definicionDeMetrica(`antropometria.${m.metricCode}`, m.units[0] ?? '')), `${numero(m.observations)} ${m.observations === 1 ? 'toma' : 'tomas'}`);
  // A la vista, las más medidas; una marcada que estaba en «Más medidas» sube a la vista, para que no quede escondida.
  const aLaVista = medidas.filter((m, i) => i < MEDIDAS_A_LA_VISTA || vigentes.includes(`antropometria.${m.metricCode}`));
  const lasDemas = medidas.filter((m) => !aLaVista.includes(m));

  return (
    <section className="tarjeta-de-entrada elegir-metricas" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>
        <Icono nombre="analizar" tamano={20} /> Comparar métricas, sin pregunta
      </h3>
      <p className="tarjeta-de-entrada__bajada">Hasta tres, de cualquier área. Cada una va en su gráfico, con las mismas fechas.</p>
      {disponibles.cargando ? <p className="nota">Buscando qué hay en el período…</p> : null}
      {disponibles.falla ? (
        <p className="campo__error">
          {textoDeFalla(disponibles.falla, 'qué datos hay en el período')}{' '}
          <button type="button" className="boton boton--enlace" onClick={disponibles.recargar}>
            Reintentar
          </button>
        </p>
      ) : null}
      {!disponibles.cargando && !disponibles.falla && !hayNutricion && !hayEntrenamiento && !hayAntropometria ? <p className="nota">No hay datos de ninguna área en este período con tu acceso actual.</p> : null}

      {hayNutricion ? (
        <div className="grupo-de-metricas" role="group" aria-labelledby={`${id}-nutricion`}>
          <h4 id={`${id}-nutricion`} className="grupo-de-metricas__titulo">
            <Icono nombre="nutricion" tamano={20} /> Nutrición
          </h4>
          <div className="grupo-de-metricas__casillas">{DE_NUTRICION.map((m) => casilla(m.id, m.nombreCorto, ICONO_DE_METRICA[m.id] ?? null))}</div>
        </div>
      ) : null}

      {hayEntrenamiento && ej && disponibles.ejercicios ? (
        <div className="grupo-de-metricas" role="group" aria-labelledby={`${id}-entrenamiento`}>
          {/* El título y, en el mismo renglón, de qué ejercicio, qué serie y en qué unidad son las casillas de abajo. Lo
              elegido se lee en cada control; su rótulo queda para el lector de pantalla. */}
          <div className="grupo-de-metricas__de">
            <h4 id={`${id}-entrenamiento`} className="grupo-de-metricas__titulo">
              <Icono nombre="entrenamiento" tamano={20} /> Entrenamiento
            </h4>
            <div className="campo">
              <label htmlFor={`${id}-ej`} className="visualmente-oculto">
                Ejercicio
              </label>
              <select id={`${id}-ej`} value={ej.exerciseKey} onChange={(e) => setEjercicio(e.target.value)}>
                {disponibles.ejercicios.map((x) => (
                  <option key={x.exerciseKey} value={x.exerciseKey}>
                    {x.name}
                    {x.homonym ? ' (otro con el mismo nombre)' : ''} · {numero(x.sessions)} {x.sessions === 1 ? 'sesión' : 'sesiones'}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor={`${id}-serie`} className="visualmente-oculto">
                Serie
              </label>
              <select id={`${id}-serie`} value={serie} onChange={(e) => setSerie(Number(e.target.value))}>
                {ej.setNumbers.map((n) => (
                  <option key={n} value={n}>
                    Serie {n}
                  </option>
                ))}
              </select>
            </div>
            {ej.loadUnits.length > 1 ? (
              <div className="campo">
                <label htmlFor={`${id}-unidad`} className="visualmente-oculto">
                  Unidad de la carga (no se mezclan)
                </label>
                <select id={`${id}-unidad`} value={unidad} onChange={(e) => setUnidad(e.target.value as 'kg' | 'lb')}>
                  {ej.loadUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
          <div className="grupo-de-metricas__casillas">{DE_ENTRENAMIENTO.map((m) => casilla(m.id, m.nombreCorto, ICONO_DE_METRICA[m.id] ?? null))}</div>
        </div>
      ) : null}

      {hayAntropometria ? (
        <div className="grupo-de-metricas" role="group" aria-labelledby={`${id}-antropometria`}>
          <h4 id={`${id}-antropometria`} className="grupo-de-metricas__titulo">
            <Icono nombre="antropometria" tamano={20} /> Antropometría
          </h4>
          <div className="grupo-de-metricas__casillas">{aLaVista.map(medida)}</div>
          {lasDemas.length > 0 ? (
            <details className="grupo-de-metricas__mas">
              <summary>Más medidas ({numero(lasDemas.length)})</summary>
              <div className="grupo-de-metricas__casillas">{lasDemas.map(medida)}</div>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="elegir-metricas__pie">
        <p id={`${id}-cupo`} className="elegir-metricas__cupo" aria-live="polite">
          <strong>
            Elegiste {numero(vigentes.length)} de {numero(MAXIMO_DE_METRICAS)}
            {nombres.length > 0 ? ':' : '.'}
          </strong>{' '}
          {nombres.length > 0 ? `${nombres.join('; ')}. ` : ''}
          {lleno ? 'Para sumar otra, sacá una.' : vigentes.length === 0 ? 'Marcá al menos una.' : ''}
        </p>
        <button type="button" className="boton boton--primario" disabled={referencias.length === 0} onClick={() => onVer(referencias)}>
          Ver los gráficos
        </button>
      </div>

      <details className="no-ofrecidas">
        <summary>Lo que todavía no se ofrece, y por qué</summary>
        <ul>
          {NO_OFRECIDAS.map((m) => (
            <li key={m.id}>
              <strong>{m.nombre}:</strong> {m.explicacion}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
