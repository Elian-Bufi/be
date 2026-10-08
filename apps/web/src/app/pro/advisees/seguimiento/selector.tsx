'use client';

/**
 * Qué se analiza (encargo §8 y §9; ESPECIFICACION.md §4):
 * - **Hasta tres métricas.** Al pedir una cuarta aparece «Elegí cuál reemplazar»: nada se reemplaza en silencio (PRO-06).
 * - **Por área, con lo que hay:** las de Nutrición son fijas; las de Entrenamiento piden ejercicio, número de serie y
 *   unidad (kg y lb nunca se mezclan); las de Antropometría salen de las tomas del período.
 * - **Presets por pregunta profesional:** llenan el selector, que sigue editable; si falta una métrica, lo dicen y no la
 *   reemplazan por una «parecida».
 * - Lo que no se ofrece todavía se ve, con el motivo (diccionario: incompleta o futura).
 */
import {
  aplicarPreset,
  definicionDeMetrica,
  MAXIMO_DE_METRICAS,
  METRICAS_DEL_DICCIONARIO,
  PRESETS_DE_ANALISIS,
  type DefinicionDeMetrica,
  type EjercicioDelPeriodo,
  type PresetDeAnalisis,
  type ReferenciaDeMetrica,
} from '@be/domain';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { textoDeFalla } from './contexto';
import { claveDeLaReferencia } from './estado';
import type { Disponibles } from './series';

/** El nombre de una métrica elegida, con su ejercicio y su serie cuando corresponde. */
export function nombreDeLaReferencia(ref: ReferenciaDeMetrica, definicion: DefinicionDeMetrica | null, ejercicios: readonly EjercicioDelPeriodo[] | null): string {
  const base = definicion?.nombreCorto ?? ref.metricId;
  if (!ref.exerciseKey) return base;
  const ejercicio = ejercicios?.find((e) => e.exerciseKey === ref.exerciseKey)?.name ?? 'ejercicio';
  return `${base} · ${ejercicio}${ref.setIndex !== null ? ` · serie ${ref.setIndex}` : ''}${ref.unit ? ` (${ref.unit})` : ''}`;
}

const MEDIDAS_DE_ENTRENAMIENTO = METRICAS_DEL_DICCIONARIO.filter((m) => m.area === 'ENTRENAMIENTO' && m.implementada);
const DE_NUTRICION = METRICAS_DEL_DICCIONARIO.filter((m) => m.area === 'NUTRICION' && m.implementada);
const NO_OFRECIDAS = METRICAS_DEL_DICCIONARIO.filter((m) => !m.implementada);

type Area = 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA';

export function SelectorDeMetricas({
  elegidas,
  disponibles,
  onCambiar,
  marcas,
}: {
  elegidas: readonly ReferenciaDeMetrica[];
  disponibles: Disponibles;
  onCambiar: (metricas: readonly ReferenciaDeMetrica[]) => void;
  /** La muestra de color, forma y trazo de cada métrica elegida (la misma del gráfico, la leyenda y la tabla). */
  marcas: readonly ReactNode[];
}) {
  const id = useId();
  const areas: Area[] = [...(disponibles.nutricion ? (['NUTRICION'] as const) : []), ...(disponibles.ejercicios?.length ? (['ENTRENAMIENTO'] as const) : []), ...(disponibles.antropometria?.length ? (['ANTROPOMETRIA'] as const) : [])];
  const [area, setArea] = useState<Area | ''>('');
  const [nutricional, setNutricional] = useState(DE_NUTRICION[0]?.id ?? '');
  const [ejercicio, setEjercicio] = useState('');
  const [medida, setMedida] = useState(MEDIDAS_DE_ENTRENAMIENTO[0]?.id ?? '');
  const [serie, setSerie] = useState(1);
  const [unidad, setUnidad] = useState<'kg' | 'lb'>('kg');
  const [antropometrica, setAntropometrica] = useState('');
  const [pendiente, setPendiente] = useState<ReferenciaDeMetrica | null>(null);
  const [repetida, setRepetida] = useState(false);

  useEffect(() => {
    if (area === '' && areas.length > 0) setArea(areas[0]!);
  }, [area, areas]);
  const ej = disponibles.ejercicios?.find((e) => e.exerciseKey === ejercicio) ?? disponibles.ejercicios?.[0] ?? null;
  useEffect(() => {
    if (ej && !ej.setNumbers.includes(serie)) setSerie(ej.setNumbers[0] ?? 1);
    if (ej && ej.loadUnits.length > 0 && !ej.loadUnits.includes(unidad)) setUnidad(ej.loadUnits[0]!);
  }, [ej, serie, unidad]);
  const codigo = antropometrica || disponibles.antropometria?.[0]?.metricCode || '';

  const candidata = (): ReferenciaDeMetrica | null => {
    if (area === 'NUTRICION') return nutricional ? { metricId: nutricional, exerciseKey: null, setIndex: null, unit: null } : null;
    if (area === 'ANTROPOMETRIA') return codigo ? { metricId: `antropometria.${codigo}`, exerciseKey: null, setIndex: null, unit: null } : null;
    if (area === 'ENTRENAMIENTO' && ej) {
      const d = definicionDeMetrica(medida);
      return { metricId: medida, exerciseKey: ej.exerciseKey, setIndex: d?.requiereSerie ? serie : null, unit: d?.parametro === 'LOAD' ? unidad : null };
    }
    return null;
  };
  const agregar = () => {
    const c = candidata();
    if (!c) return;
    if (elegidas.some((e) => claveDeLaReferencia(e) === claveDeLaReferencia(c))) return setRepetida(true);
    setRepetida(false);
    if (elegidas.length >= MAXIMO_DE_METRICAS) return setPendiente(c);
    onCambiar([...elegidas, c]);
  };
  const definicionCandidata = (() => {
    const c = candidata();
    return c ? definicionDeMetrica(c.metricId, '') : null;
  })();

  return (
    <div className="selector-de-metricas">
      <h3 id={`${id}-elegidas`}>Métricas ({elegidas.length} de {MAXIMO_DE_METRICAS})</h3>
      {elegidas.length === 0 ? <p className="nota">Todavía no elegiste ninguna. Empezá por una pregunta o agregá una métrica.</p> : null}
      <ul className="metricas-elegidas" aria-labelledby={`${id}-elegidas`}>
        {elegidas.map((ref, i) => (
          <li key={claveDeLaReferencia(ref)}>
            {marcas[i]}
            <span>{nombreDeLaReferencia(ref, definicionDeMetrica(ref.metricId, ''), disponibles.ejercicios)}</span>
            <button type="button" className="boton boton--enlace" onClick={() => onCambiar(elegidas.filter((_, j) => j !== i))}>
              Quitar<span className="visualmente-oculto"> {nombreDeLaReferencia(ref, definicionDeMetrica(ref.metricId, ''), disponibles.ejercicios)}</span>
            </button>
          </li>
        ))}
      </ul>

      <fieldset className="agregar-metrica">
        <legend>Agregar una métrica</legend>
        {disponibles.cargando ? <p className="nota">Buscando qué hay en el período…</p> : null}
        {disponibles.falla ? (
          <p className="campo__error">
            {textoDeFalla(disponibles.falla, 'qué datos hay en el período')}{' '}
            <button type="button" className="boton boton--enlace" onClick={disponibles.recargar}>
              Reintentar
            </button>
          </p>
        ) : null}
        {!disponibles.cargando && !disponibles.falla && areas.length === 0 ? <p className="nota">No hay datos de ninguna área en este período con tu acceso actual.</p> : null}
        {areas.length > 0 ? (
          <>
            <div className="campo">
              <label htmlFor={`${id}-area`}>Área</label>
              <select id={`${id}-area`} value={area} onChange={(e) => setArea(e.target.value as Area)}>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a === 'NUTRICION' ? 'Nutrición' : a === 'ENTRENAMIENTO' ? 'Entrenamiento' : 'Antropometría'}
                  </option>
                ))}
              </select>
            </div>
            {area === 'NUTRICION' ? (
              <div className="campo">
                <label htmlFor={`${id}-nut`}>Métrica</label>
                <select id={`${id}-nut`} value={nutricional} onChange={(e) => setNutricional(e.target.value)}>
                  {DE_NUTRICION.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {area === 'ENTRENAMIENTO' && disponibles.ejercicios ? (
              <>
                <div className="campo">
                  <label htmlFor={`${id}-ej`}>Ejercicio</label>
                  <select id={`${id}-ej`} value={ej?.exerciseKey ?? ''} onChange={(e) => setEjercicio(e.target.value)}>
                    {disponibles.ejercicios.map((x) => (
                      <option key={x.exerciseKey} value={x.exerciseKey}>
                        {x.name}
                        {x.homonym ? ' (otro con el mismo nombre)' : ''} · {x.sessions} {x.sessions === 1 ? 'sesión' : 'sesiones'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label htmlFor={`${id}-medida`}>Qué se mide</label>
                  <select id={`${id}-medida`} value={medida} onChange={(e) => setMedida(e.target.value)}>
                    {MEDIDAS_DE_ENTRENAMIENTO.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {definicionDeMetrica(medida)?.requiereSerie && ej ? (
                  <div className="campo">
                    <label htmlFor={`${id}-serie`}>Serie</label>
                    <select id={`${id}-serie`} value={serie} onChange={(e) => setSerie(Number(e.target.value))}>
                      {ej.setNumbers.map((n) => (
                        <option key={n} value={n}>
                          Serie {n}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {definicionDeMetrica(medida)?.parametro === 'LOAD' && ej && ej.loadUnits.length > 1 ? (
                  <div className="campo">
                    <label htmlFor={`${id}-unidad`}>Unidad (no se mezclan)</label>
                    <select id={`${id}-unidad`} value={unidad} onChange={(e) => setUnidad(e.target.value as 'kg' | 'lb')}>
                      {ej.loadUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </>
            ) : null}
            {area === 'ANTROPOMETRIA' && disponibles.antropometria ? (
              <div className="campo">
                <label htmlFor={`${id}-ant`}>Medición</label>
                <select id={`${id}-ant`} value={codigo} onChange={(e) => setAntropometrica(e.target.value)}>
                  {disponibles.antropometria.map((m) => (
                    <option key={m.metricCode} value={m.metricCode}>
                      {m.name} · {m.observations} {m.observations === 1 ? 'toma' : 'tomas'}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {definicionCandidata ? <p className="nota">{definicionCandidata.explicacion}</p> : null}
            <button type="button" className="boton boton--secundario" onClick={agregar}>
              Agregar
            </button>
            {repetida ? (
              <p className="campo__error" role="alert">
                Esa métrica ya está elegida.
              </p>
            ) : null}
          </>
        ) : null}
      </fieldset>

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

      <DialogoDeReemplazo
        nueva={pendiente}
        elegidas={elegidas}
        nombre={(r) => nombreDeLaReferencia(r, definicionDeMetrica(r.metricId, ''), disponibles.ejercicios)}
        onElegir={(i) => {
          if (pendiente) onCambiar(elegidas.map((e, j) => (j === i ? pendiente : e)));
          setPendiente(null);
        }}
        onCancelar={() => setPendiente(null)}
      />
    </div>
  );
}

function DialogoDeReemplazo({
  nueva,
  elegidas,
  nombre,
  onElegir,
  onCancelar,
}: {
  nueva: ReferenciaDeMetrica | null;
  elegidas: readonly ReferenciaDeMetrica[];
  nombre: (r: ReferenciaDeMetrica) => string;
  onElegir: (indice: number) => void;
  onCancelar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [elegida, setElegida] = useState(0);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (nueva && !d.open) d.showModal();
    if (!nueva && d.open) d.close();
  }, [nueva]);
  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={`${id}-titulo`}
      onCancel={(e) => {
        e.preventDefault();
        onCancelar();
      }}
    >
      <h2 id={`${id}-titulo`}>Elegí cuál reemplazar</h2>
      <p>
        Se pueden analizar hasta tres métricas a la vez. {nueva ? <>¿Cuál reemplaza a «{nombre(nueva)}»?</> : null}
      </p>
      <fieldset className="capas">
        <legend className="visualmente-oculto">Métrica que se reemplaza</legend>
        {elegidas.map((e, i) => (
          <label key={claveDeLaReferencia(e)} className="capa">
            <input type="radio" name={`${id}-reemplazo`} checked={elegida === i} onChange={() => setElegida(i)} />
            {nombre(e)}
          </label>
        ))}
      </fieldset>
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="boton boton--primario" onClick={() => onElegir(elegida)}>
          Reemplazar
        </button>
      </div>
    </dialog>
  );
}

/** Los presets por pregunta profesional (encargo §9): ofrecen lo que hay y dicen lo que falta. */
export function PresetsDeAnalisis({ disponibles, onAplicar }: { disponibles: Disponibles; onAplicar: (metricas: readonly ReferenciaDeMetrica[], preset: PresetDeAnalisis, faltantes: readonly string[], comparar: boolean) => void }) {
  const id = useId();
  const ejercicio = disponibles.ejercicios?.[0] ?? null;
  const hay = new Set<string>([
    ...(disponibles.nutricion ? DE_NUTRICION.map((m) => m.id) : []),
    ...(ejercicio ? MEDIDAS_DE_ENTRENAMIENTO.map((m) => m.id) : []),
    ...(disponibles.antropometria ?? []).map((m) => `antropometria.${m.metricCode}`),
  ]);
  const aReferencia = (metricId: string): ReferenciaDeMetrica => {
    const d = definicionDeMetrica(metricId, '');
    if (d?.area === 'ENTRENAMIENTO' && ejercicio) return { metricId, exerciseKey: ejercicio.exerciseKey, setIndex: d.requiereSerie ? (ejercicio.setNumbers[0] ?? 1) : null, unit: d.parametro === 'LOAD' ? (ejercicio.loadUnits[0] ?? 'kg') : null };
    return { metricId, exerciseKey: null, setIndex: null, unit: null };
  };
  return (
    <div className="presets">
      <h3 id={`${id}-titulo`}>Empezar por una pregunta</h3>
      <ul aria-labelledby={`${id}-titulo`}>
        {PRESETS_DE_ANALISIS.map((p) => {
          const { usables, faltantes } = aplicarPreset(p, hay);
          const sinNada = !p.comparaPeriodos && usables.length === 0;
          return (
            <li key={p.id}>
              <button type="button" className="boton boton--secundario boton--pregunta" disabled={disponibles.cargando || sinNada} onClick={() => onAplicar(usables.map(aReferencia), p, faltantes, p.comparaPeriodos)}>
                {p.pregunta}
              </button>
              {sinNada && !disponibles.cargando && !disponibles.falla ? <span className="nota"> Sin datos para esta pregunta en el período.</span> : null}
            </li>
          );
        })}
      </ul>
      {ejercicio ? <p className="nota">Las preguntas de entrenamiento empiezan por el ejercicio más registrado del período ({ejercicio.name}); se cambia en el selector.</p> : null}
    </div>
  );
}
