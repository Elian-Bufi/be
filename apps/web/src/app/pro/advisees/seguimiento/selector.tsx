'use client';

/**
 * Qué se analiza (encargo §8 y §9; ESPECIFICACION.md §4):
 * - **Hasta tres métricas.** Al pedir una cuarta aparece «Elegí cuál reemplazar»: nada se reemplaza en silencio (PRO-06).
 * - **Por área, con lo que hay:** las de Nutrición son fijas; las de Entrenamiento piden ejercicio, número de serie y
 *   unidad (kg y lb nunca se mezclan); las de Antropometría salen de las tomas del período.
 * - **Las preguntas profesionales** (preguntas.tsx) llenan el selector, que sigue editable: cambiar una métrica a mano deja la
 *   pregunta y pasa a ser un análisis personalizado.
 * - **GR-26 (WP-GRAFICOS fase 2, DL-174): el catálogo de series.** Se ofrece lo que el PDP deja leer con esta persona
 *   (`seriesParaElegir`, sobre `seriesOfrecidas`), por área y con las de los gráficos sugeridos primero. Las series
 *   nuevas aparecen cuando están ofrecidas: el 1RM estimado (Epley v1), solo con un ejercicio de la lista de la v1 y con
 *   su unidad; el RIR indicado y los g/kg, cuando sus ramas los ofrezcan. Lo que no se ofrece no aparece, ni en gris ni
 *   con candado.
 */
import { MAXIMO_DE_METRICAS, type AccesoDeLaPersona, type Alcance, type DefinicionDeMetrica, type EjercicioDelPeriodo, type ReferenciaDeMetrica } from '@be/domain';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import { definicionDeLaSerie, pideUnidad, referenciaDeEntrenamiento, seriesDelEjercicio, seriesParaElegir } from '../graficos/arma-tu-grafico/compositor';
import { textoDeFalla } from './contexto';
import { claveDeLaReferencia } from './estado';
import type { Disponibles } from './series';

/** Lo que el PDP dejó leer con esta persona en el período, como lo pide el catálogo (`seriesOfrecidas`). */
export function accesoDeLosDisponibles(d: Pick<Disponibles, 'nutricion' | 'ejercicios' | 'antropometria' | 'propios'>): AccesoDeLaPersona {
  const alcances: Alcance[] = [...(d.nutricion ? (['NUTRICION'] as const) : []), ...(d.ejercicios !== null ? (['ENTRENAMIENTO'] as const) : []), ...(d.antropometria !== null ? (['ANTROPOMETRIA'] as const) : [])];
  return { alcances, propios: d.propios };
}

/** El nombre de una métrica elegida, con su ejercicio y su serie cuando corresponde. */
export function nombreDeLaReferencia(ref: ReferenciaDeMetrica, definicion: DefinicionDeMetrica | null, ejercicios: readonly EjercicioDelPeriodo[] | null): string {
  const base = definicion?.nombreCorto ?? ref.metricId;
  if (!ref.exerciseKey) return base;
  const ejercicio = ejercicios?.find((e) => e.exerciseKey === ref.exerciseKey)?.name ?? 'ejercicio';
  return `${base} · ${ejercicio}${ref.setIndex !== null ? ` · serie ${ref.setIndex}` : ''}${ref.unit ? ` (${ref.unit})` : ''}`;
}

/**
 * El nombre entero de una métrica elegida, como va en el título de su gráfico: «Calorías registradas» y no «Calorías»,
 * con el ejercicio, la serie y la unidad si los lleva.
 */
export function tituloDeLaReferencia(ref: ReferenciaDeMetrica, definicion: DefinicionDeMetrica | null, ejercicios: readonly EjercicioDelPeriodo[] | null): string {
  const corto = nombreDeLaReferencia(ref, definicion, ejercicios);
  return definicion && corto.startsWith(definicion.nombreCorto) ? `${definicion.nombre}${corto.slice(definicion.nombreCorto.length)}` : corto;
}

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
  /** La muestra del color de cada métrica elegida (la misma del gráfico, la lectura y la tabla). */
  marcas: readonly ReactNode[];
}) {
  const id = useId();
  // GR-26: lo que se ofrece sale del catálogo, con el acceso de este momento.
  const porArea = seriesParaElegir(accesoDeLosDisponibles(disponibles));
  const areas: Area[] = [
    ...(disponibles.nutricion && porArea.NUTRICION.length > 0 ? (['NUTRICION'] as const) : []),
    ...(disponibles.ejercicios?.length && porArea.ENTRENAMIENTO.length > 0 ? (['ENTRENAMIENTO'] as const) : []),
    ...(disponibles.antropometria?.length ? (['ANTROPOMETRIA'] as const) : []),
  ];
  const [area, setArea] = useState<Area | ''>('');
  const [nutricional, setNutricional] = useState('');
  const [ejercicio, setEjercicio] = useState('');
  const [medida, setMedida] = useState('');
  const [serie, setSerie] = useState(1);
  const [unidad, setUnidad] = useState<'kg' | 'lb'>('kg');
  const [antropometrica, setAntropometrica] = useState('');
  const [pendiente, setPendiente] = useState<ReferenciaDeMetrica | null>(null);
  const [repetida, setRepetida] = useState(false);
  // Sin métricas, agregar es lo primero; con métricas, el gráfico va antes y agregar queda a un clic (en el teléfono, así
  // no hay que bajar todos los controles para llegar al gráfico).
  const [agregarAbierto, setAgregarAbierto] = useState(elegidas.length === 0);
  // Si las métricas llegan de otro lado (una pregunta, una vista guardada, la URL), agregar se pliega: el formulario abierto
  // con tres métricas ya elegidas era ruido. Si llegan desde este formulario, queda como la persona lo dejó.
  const anteriores = useRef(elegidas.length);
  const desdeElFormulario = useRef(false);
  useEffect(() => {
    if (elegidas.length === 0) setAgregarAbierto(true);
    else if (anteriores.current === 0 && !desdeElFormulario.current) setAgregarAbierto(false);
    anteriores.current = elegidas.length;
    desdeElFormulario.current = false;
  }, [elegidas.length]);

  useEffect(() => {
    if (area === '' && areas.length > 0) setArea(areas[0]!);
  }, [area, areas]);
  const ej = disponibles.ejercicios?.find((e) => e.exerciseKey === ejercicio) ?? disponibles.ejercicios?.[0] ?? null;
  useEffect(() => {
    if (ej && !ej.setNumbers.includes(serie)) setSerie(ej.setNumbers[0] ?? 1);
    if (ej && ej.loadUnits.length > 0 && !ej.loadUnits.includes(unidad)) setUnidad(ej.loadUnits[0]!);
  }, [ej, serie, unidad]);
  const codigo = antropometrica || disponibles.antropometria?.[0]?.metricCode || '';
  const nutricionalElegida = porArea.NUTRICION.find((s) => s.id === nutricional) ?? porArea.NUTRICION[0] ?? null;
  // El 1RM estimado se ofrece solo con un ejercicio de la lista de la v1 (RM-16).
  const medidasDelEjercicio = seriesDelEjercicio(porArea.ENTRENAMIENTO, ej?.exerciseKey ?? null);
  const medidaElegida = medidasDelEjercicio.find((s) => s.id === medida) ?? medidasDelEjercicio[0] ?? null;

  const candidata = (): ReferenciaDeMetrica | null => {
    if (area === 'NUTRICION') return nutricionalElegida ? { metricId: nutricionalElegida.id, exerciseKey: null, setIndex: null, unit: null } : null;
    if (area === 'ANTROPOMETRIA') return codigo ? { metricId: `antropometria.${codigo}`, exerciseKey: null, setIndex: null, unit: null } : null;
    if (area === 'ENTRENAMIENTO' && ej && medidaElegida) return referenciaDeEntrenamiento(medidaElegida, ej.exerciseKey, serie, unidad);
    return null;
  };
  const agregar = () => {
    const c = candidata();
    if (!c) return;
    if (elegidas.some((e) => claveDeLaReferencia(e) === claveDeLaReferencia(c))) return setRepetida(true);
    setRepetida(false);
    if (elegidas.length >= MAXIMO_DE_METRICAS) return setPendiente(c);
    desdeElFormulario.current = true;
    onCambiar([...elegidas, c]);
  };
  const definicionCandidata = (() => {
    const c = candidata();
    return c ? definicionDeLaSerie(c.metricId) : null;
  })();

  return (
    <div className="selector-de-metricas">
      {/* Las métricas elegidas son también la leyenda de los gráficos: la muestra de su color, el nombre y quitar. */}
      <ul className="metricas-elegidas metricas-elegidas--amable" aria-label={`Métricas elegidas: ${elegidas.length} de ${MAXIMO_DE_METRICAS}`}>
        {elegidas.map((ref, i) => {
          const nombre = nombreDeLaReferencia(ref, definicionDeLaSerie(ref.metricId), disponibles.ejercicios);
          return (
            <li key={claveDeLaReferencia(ref)}>
              {marcas[i]}
              <span>{nombre}</span>
              <button type="button" className="quitar-metrica" onClick={() => onCambiar(elegidas.filter((_, j) => j !== i))}>
                <Icono nombre="cerrar" tamano={18} />
                <span className="visualmente-oculto">Quitar {nombre}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <span className="metricas-elegidas__cupo">
        {elegidas.length === 0 ? 'Todavía no elegiste ninguna métrica: empezá por una pregunta o agregá una.' : `${elegidas.length} de ${MAXIMO_DE_METRICAS} métricas`}
      </span>

      <details className="agregar" open={agregarAbierto} onToggle={(e) => setAgregarAbierto((e.target as HTMLDetailsElement).open)}>
        <summary>
          <Icono nombre="mas" tamano={18} /> Agregar una métrica
        </summary>
        <fieldset className="agregar-metrica">
          <legend className="visualmente-oculto">Agregar una métrica</legend>
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
                  <select id={`${id}-nut`} value={nutricionalElegida?.id ?? ''} onChange={(e) => setNutricional(e.target.value)}>
                    {porArea.NUTRICION.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.definicion.nombre}
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
                    <select id={`${id}-medida`} value={medidaElegida?.id ?? ''} onChange={(e) => setMedida(e.target.value)}>
                      {medidasDelEjercicio.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.definicion.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  {medidaElegida?.requiere.serie && ej ? (
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
                  {medidaElegida && pideUnidad(medidaElegida) && ej && ej.loadUnits.length > 1 ? (
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
      </details>

      <DialogoDeReemplazo
        nueva={pendiente}
        elegidas={elegidas}
        nombre={(r) => nombreDeLaReferencia(r, definicionDeLaSerie(r.metricId), disponibles.ejercicios)}
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
