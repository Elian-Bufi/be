'use client';

/**
 * «Armá tu gráfico» (GR-26; WP-GRAFICOS fase 2, DL-174): el cuadro donde el profesional elige hasta tres series del
 * catálogo, con el ejercicio, la serie y la unidad cuando hacen falta, el modo y una vista previa, y lo suma a un enfoque
 * («Agregar al enfoque»). Lo abre «Patrones» desde «Agregar un gráfico» (rama E, que guarda el resultado).
 *
 * - Solo ofrece lo que el PDP deja leer con esta persona (`seriesParaElegir`): un área sin acceso no aparece.
 * - «Alineadas» por defecto; «Superpuestas» se apaga y dice por qué si las series no comparten el eje de fechas o
 *   necesitan más de dos ejes.
 * - El nombre del gráfico es del profesional y lleva la pista de no poner datos de salud: el enfoque se usa con varias
 *   personas. Se guardan referencias, nunca valores.
 */
import { MAXIMO_DE_SERIES_EN_UN_GRAFICO, type AccesoDeLaPersona, type AreaDeMetrica, type EjercicioDelPeriodo, type ReferenciaDeMetrica, type SerieDisponible } from '@be/domain';
import { useId, useMemo, useState } from 'react';
import { CuadroEnfocado } from '../../../../../components/cuadro-enfocado';
import { Icono } from '../../../../../components/icono';
import type { PeriodoDelGrafico } from '../eje-de-fechas';
import type { ParametrosDeLectura } from '../lecturas';
import {
  AREAS_DEL_SELECTOR,
  motivoDeSuperpuestas,
  NOMBRE_DEL_AREA,
  NOMBRE_DEL_MODO,
  pideUnidad,
  QUE_HACE_EL_MODO,
  referenciaDeEntrenamiento,
  serieElegidaDe,
  seriesDelEjercicio,
  seriesParaElegir,
  superposicionDeLasElegidas,
  type ModoArmado,
} from './compositor';
import { GraficoArmadoEnPantalla, type GraficoArmado } from './grafico-armado';

export const COPY_DEL_COMPOSITOR = {
  titulo: 'Armá tu gráfico',
  nombre: 'Nombre del gráfico',
  pistaDelNombre: 'No pongas datos de salud: el enfoque se usa con varias personas.',
  series: 'Series',
  ninguna: 'Todavía no elegiste ninguna serie.',
  agregarUnaSerie: 'Agregar una serie',
  agregar: 'Agregar',
  tope: `Hasta ${MAXIMO_DE_SERIES_EN_UN_GRAFICO} series: quitá una para sumar otra.`,
  repetida: 'Esa serie ya está en el gráfico.',
  modo: 'Cómo se ven',
  vistaPrevia: 'Vista previa',
  agregarAlEnfoque: 'Agregar al enfoque',
  faltaNombre: 'Poné un nombre al gráfico.',
  faltaSerie: 'Elegí al menos una serie.',
  sinAreas: 'No hay series para elegir con tu acceso actual.',
} as const;

const C = COPY_DEL_COMPOSITOR;

interface Elegida {
  readonly ref: ReferenciaDeMetrica;
  readonly nombre: string;
  readonly unidad: string;
}

const claveDe = (r: ReferenciaDeMetrica): string => [r.metricId, r.exerciseKey ?? '', r.setIndex ?? '', r.unit ?? ''].join('|');
const granoDe = (metricId: string): 'DAY' | 'ORIGINAL' => (metricId.startsWith('nutricion.') ? 'DAY' : 'ORIGINAL');

export interface PropsDelCompositor {
  readonly abierto: boolean;
  readonly acceso: AccesoDeLaPersona;
  /** Los ejercicios del período, del más registrado al menos; `null` sin Entrenamiento. */
  readonly ejercicios: readonly EjercicioDelPeriodo[] | null;
  /** Las medidas con tomas en el período; `null` sin Antropometría. */
  readonly medidas: readonly { readonly metricCode: string; readonly name: string; readonly units: readonly string[] }[] | null;
  readonly lectura: Omit<ParametrosDeLectura, 'periodo'>;
  readonly periodo: PeriodoDelGrafico;
  readonly sobretitulo?: string | null;
  readonly onAgregar: (grafico: GraficoArmado) => void;
  readonly onCerrar: () => void;
}

export function CompositorDeGraficos({ abierto, acceso, ejercicios, medidas, lectura, periodo, sobretitulo = null, onAgregar, onCerrar }: PropsDelCompositor) {
  const id = useId();
  const porArea = useMemo(() => seriesParaElegir(acceso), [acceso]);
  const areas = AREAS_DEL_SELECTOR.filter((a) => (a === 'ANTROPOMETRIA' ? acceso.alcances.includes('ANTROPOMETRIA') && (medidas?.length ?? 0) > 0 : a === 'ENTRENAMIENTO' ? porArea.ENTRENAMIENTO.length > 0 && (ejercicios?.length ?? 0) > 0 : porArea[a].length > 0));
  const [titulo, setTitulo] = useState('');
  const [elegidas, setElegidas] = useState<readonly Elegida[]>([]);
  const [modo, setModo] = useState<ModoArmado>('PANELS');
  const [area, setArea] = useState<AreaDeMetrica | ''>('');
  const [serieId, setSerieId] = useState('');
  const [ejercicio, setEjercicio] = useState('');
  const [numero, setNumero] = useState(1);
  const [unidad, setUnidad] = useState<'kg' | 'lb'>('kg');
  const [medida, setMedida] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const areaElegida: AreaDeMetrica | null = area !== '' && areas.includes(area) ? area : (areas[0] ?? null);
  const ej = ejercicios?.find((x) => x.exerciseKey === ejercicio) ?? ejercicios?.[0] ?? null;
  const opciones: readonly SerieDisponible[] = areaElegida === 'ENTRENAMIENTO' ? seriesDelEjercicio(porArea.ENTRENAMIENTO, ej?.exerciseKey ?? null) : areaElegida ? porArea[areaElegida] : [];
  const serie = opciones.find((s) => s.id === serieId) ?? opciones[0] ?? null;
  const med = medidas?.find((m) => m.metricCode === medida) ?? medidas?.[0] ?? null;
  const unidades: readonly ('kg' | 'lb')[] = ej && ej.loadUnits.length > 0 ? ej.loadUnits : ['kg'];
  const unidadElegida = unidades.includes(unidad) ? unidad : (unidades[0] ?? 'kg');
  const numeros: readonly number[] = ej && ej.setNumbers.length > 0 ? ej.setNumbers : [1];
  const numeroElegido = numeros.includes(numero) ? numero : (numeros[0] ?? 1);

  const candidata = (): Elegida | null => {
    if (areaElegida === 'ANTROPOMETRIA') return med ? { ref: { metricId: `antropometria.${med.metricCode}`, exerciseKey: null, setIndex: null, unit: null }, nombre: med.name, unidad: med.units[0] ?? '' } : null;
    if (!serie) return null;
    if (areaElegida === 'ENTRENAMIENTO') {
      if (!ej) return null;
      const ref = referenciaDeEntrenamiento(serie, ej.exerciseKey, numeroElegido, unidadElegida);
      const detalle = `${ej.name}${ref.setIndex !== null ? ` · serie ${ref.setIndex}` : ''}${ref.unit ? ` (${ref.unit})` : ''}`;
      return { ref, nombre: `${serie.definicion.nombreCorto} · ${detalle}`, unidad: ref.unit ?? serie.definicion.unidad };
    }
    return { ref: { metricId: serie.id, exerciseKey: null, setIndex: null, unit: null }, nombre: serie.definicion.nombreCorto, unidad: serie.definicion.unidad };
  };
  const agregar = () => {
    const c = candidata();
    if (!c) return;
    if (elegidas.some((e) => claveDe(e.ref) === claveDe(c.ref))) return setAviso(C.repetida);
    if (elegidas.length >= MAXIMO_DE_SERIES_EN_UN_GRAFICO) return setAviso(C.tope);
    setAviso(null);
    setElegidas([...elegidas, c]);
  };

  const seriesElegidas = elegidas.flatMap((e) => {
    const s = serieElegidaDe(e.ref.metricId, e.unidad, granoDe(e.ref.metricId));
    return s ? [s] : [];
  });
  const superposicion = seriesElegidas.length > 0 ? superposicionDeLasElegidas(seriesElegidas) : null;
  const motivo = superposicion && superposicion.motivo ? motivoDeSuperpuestas(superposicion.motivo, superposicion.grupos, elegidas.map((e) => e.nombre)) : null;
  const modoEfectivo: ModoArmado = modo === 'OVERLAY' && motivo === null ? 'OVERLAY' : 'PANELS';
  const apagado = elegidas.length === 0 ? C.faltaSerie : titulo.trim() === '' ? C.faltaNombre : modo === 'OVERLAY' && motivo !== null ? motivo : null;
  const nombresDeEjercicios = useMemo(() => new Map((ejercicios ?? []).map((x): [string, string] => [x.exerciseKey, x.name])), [ejercicios]);
  const grafico: GraficoArmado = { title: titulo.trim() || C.vistaPrevia, series: elegidas.map((e) => e.ref), mode: modoEfectivo };

  return (
    <CuadroEnfocado
      abierto={abierto}
      forma="panel"
      titulo={C.titulo}
      sobretitulo={sobretitulo}
      conCambios={elegidas.length > 0 || titulo.trim() !== ''}
      ancho
      principal={{ texto: C.agregarAlEnfoque, apagado, alTocar: () => onAgregar({ title: titulo.trim(), series: elegidas.map((e) => e.ref), mode: modoEfectivo }) }}
      onCerrar={onCerrar}
    >
      <div className="compositor">
        <div className="campo">
          <label htmlFor={`${id}-nombre`}>{C.nombre}</label>
          <input id={`${id}-nombre`} type="text" maxLength={60} value={titulo} aria-describedby={`${id}-pista`} onChange={(e) => setTitulo(e.target.value)} />
          <p id={`${id}-pista`} className="campo__pista">
            {C.pistaDelNombre}
          </p>
        </div>

        <fieldset className="compositor__series">
          <legend>
            {C.series} ({elegidas.length} de {MAXIMO_DE_SERIES_EN_UN_GRAFICO})
          </legend>
          {elegidas.length === 0 ? <p className="nota">{C.ninguna}</p> : null}
          <ul className="compositor__elegidas">
            {elegidas.map((e, i) => (
              <li key={claveDe(e.ref)}>
                <span>
                  {e.nombre} · {e.unidad}
                </span>
                <button type="button" className="boton boton--enlace" onClick={() => setElegidas(elegidas.filter((_, j) => j !== i))}>
                  <Icono nombre="cerrar" tamano={18} />
                  <span className="visualmente-oculto">Quitar {e.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
          {areas.length === 0 ? (
            <p className="nota">{C.sinAreas}</p>
          ) : (
            <div className="compositor__agregar" role="group" aria-label={C.agregarUnaSerie}>
              <div className="campo">
                <label htmlFor={`${id}-area`}>Área</label>
                <select id={`${id}-area`} value={areaElegida ?? ''} onChange={(e) => setArea(e.target.value as AreaDeMetrica)}>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {NOMBRE_DEL_AREA[a]}
                    </option>
                  ))}
                </select>
              </div>
              {areaElegida === 'ENTRENAMIENTO' && ejercicios ? (
                <div className="campo">
                  <label htmlFor={`${id}-ejercicio`}>Ejercicio</label>
                  <select id={`${id}-ejercicio`} value={ej?.exerciseKey ?? ''} onChange={(e) => setEjercicio(e.target.value)}>
                    {ejercicios.map((x) => (
                      <option key={x.exerciseKey} value={x.exerciseKey}>
                        {x.name} · {x.sessions} {x.sessions === 1 ? 'sesión' : 'sesiones'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {areaElegida === 'ANTROPOMETRIA' && medidas ? (
                <div className="campo">
                  <label htmlFor={`${id}-medida`}>Medida</label>
                  <select id={`${id}-medida`} value={med?.metricCode ?? ''} onChange={(e) => setMedida(e.target.value)}>
                    {medidas.map((m) => (
                      <option key={m.metricCode} value={m.metricCode}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : opciones.length > 0 ? (
                <div className="campo">
                  <label htmlFor={`${id}-serie`}>Serie</label>
                  <select id={`${id}-serie`} value={serie?.id ?? ''} onChange={(e) => setSerieId(e.target.value)}>
                    {opciones.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.definicion.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {areaElegida === 'ENTRENAMIENTO' && serie?.requiere.serie ? (
                <div className="campo">
                  <label htmlFor={`${id}-numero`}>Número de serie</label>
                  <select id={`${id}-numero`} value={numeroElegido} onChange={(e) => setNumero(Number(e.target.value))}>
                    {numeros.map((n) => (
                      <option key={n} value={n}>
                        Serie {n}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {areaElegida === 'ENTRENAMIENTO' && serie && pideUnidad(serie) && unidades.length > 1 ? (
                <div className="campo">
                  <label htmlFor={`${id}-unidad`}>Unidad (no se mezclan)</label>
                  <select id={`${id}-unidad`} value={unidadElegida} onChange={(e) => setUnidad(e.target.value as 'kg' | 'lb')}>
                    {unidades.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {serie && areaElegida !== 'ANTROPOMETRIA' ? <p className="nota">{serie.definicion.explicacion}</p> : null}
              <button type="button" className="boton boton--secundario" onClick={agregar} disabled={elegidas.length >= MAXIMO_DE_SERIES_EN_UN_GRAFICO}>
                {C.agregar}
              </button>
              {elegidas.length >= MAXIMO_DE_SERIES_EN_UN_GRAFICO ? <p className="nota">{C.tope}</p> : null}
              {aviso ? (
                <p className="campo__error" role="alert">
                  {aviso}
                </p>
              ) : null}
            </div>
          )}
        </fieldset>

        <fieldset className="segmentos">
          <legend>{C.modo}</legend>
          <div className="segmentos__fila">
            {(['PANELS', 'OVERLAY'] as const).map((m) => (
              <label key={m} className="segmento">
                <input type="radio" name={`${id}-modo`} checked={modoEfectivo === m} disabled={m === 'OVERLAY' && motivo !== null} aria-describedby={`${id}-modo-${m}`} onChange={() => setModo(m)} />
                {NOMBRE_DEL_MODO[m]}
              </label>
            ))}
          </div>
          <p id={`${id}-modo-PANELS`} className="nota">
            {NOMBRE_DEL_MODO.PANELS}: {QUE_HACE_EL_MODO.PANELS}
          </p>
          <p id={`${id}-modo-OVERLAY`} className="nota">
            {motivo ?? `${NOMBRE_DEL_MODO.OVERLAY}: ${QUE_HACE_EL_MODO.OVERLAY}`}
          </p>
        </fieldset>

        <section className="compositor__vista-previa" aria-label={C.vistaPrevia}>
          <h3>{C.vistaPrevia}</h3>
          {elegidas.length > 0 && abierto ? <GraficoArmadoEnPantalla grafico={grafico} lectura={lectura} periodo={periodo} densidad="COMPACTA" ejercicios={nombresDeEjercicios} /> : <p className="nota">{C.faltaSerie}</p>}
        </section>
      </div>
    </CuadroEnfocado>
  );
}
