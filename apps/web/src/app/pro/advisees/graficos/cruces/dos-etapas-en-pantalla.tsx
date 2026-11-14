'use client';

/**
 * GR-24 · Dos etapas lado a lado, en pantalla (WP-GRAFICOS fase 2, DL-174). `DosEtapasEnPantalla` dibuja dos columnas
 * con todas las observaciones de cada etapa, la mediana como una raya y, debajo, lo que dice cada una en texto: la
 * cantidad, la mediana, lo que no entra en ella y, con el 1RM estimado, la mediana del RIR y el rango de repeticiones.
 * Con menos de 5 de un lado no dibuja: dice cuánto hay. La tabla tiene las mismas observaciones que el dibujo.
 *
 * `GraficoDeDosEtapas` es el gráfico registrado (para «Patrones»): compara la versión vigente del plan con la anterior.
 * Con un ejercicio, en Entrenamiento (el 1RM estimado si está en la lista de la v1; si no, la carga de la serie); sin
 * ejercicio, en Nutrición, con las calorías registradas (GR-T56).
 *
 * Accesibilidad: el dibujo no se lee (`aria-hidden`); el grupo tiene nombre y su descripción es el resumen en texto, y
 * la tabla se abre con un botón.
 */
import { entraEnLaEstimacion, etapasDelArea, serieDisponible, valorConUnidad, type DefinicionDeMetrica, type ReferenciaDeMetrica, type SerieAnalitica } from '@be/domain';
import { useEffect, useId, useState } from 'react';
import { LETRA_MINIMA } from '../../seguimiento/geometria';
import { definicionDeLaSerie, ejercicioDeLaClave, escalaDeLaSerie, lecturaDelPunto } from '../arma-tu-grafico/compositor';
import { COPY_DE_LOS_GRAFICOS } from '../copy';
import { inicioDelEje, textoDeLaMarca } from '../eje-de-fechas';
import { EstadoDelGraficoEnPantalla, NotaDelInicio, type EstadoDelGrafico } from '../estado-del-grafico';
import { leerSerieDelCatalogo } from '../lecturas';
import { colorDelCarril, MarcaDelCarril } from '../marcas';
import { useAnchoDelGrafico } from '../medidas-del-grafico';
import type { DensidadDelGrafico } from '../paneles-alineados';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { COPY_DE_LOS_CRUCES } from './copy';
import { dosEtapasLadoALado, etapaDeLaPlanificacion, fechasDeLaEtapa, fuerzaEnPalabras, geometriaDeDosEtapas, MARGEN_DE_DOS_ETAPAS, type DosEtapasLadoALado } from './dos-etapas';
import { leerLaFuerza } from './lecturas-de-los-cruces';
import { LO_QUE_BE_NO_REGISTRA } from './lo-que-tambien-cambio';

const C = COPY_DE_LOS_CRUCES.dosEtapas;
const ALTO: Readonly<Record<DensidadDelGrafico, number>> = { COMPLETA: 180, COMPACTA: 124 };

const formato = (v: number, decimales: number): string => v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/** Las dos columnas, lo que dice cada etapa y la tabla. Con menos de 5 de un lado, solo cuánto hay. */
export function DosEtapasEnPantalla({
  titulo,
  d,
  decimales,
  indice = 0,
  densidad = 'COMPLETA',
  nivel = 4,
}: {
  titulo: string;
  d: DosEtapasLadoALado;
  decimales: number;
  indice?: number;
  densidad?: DensidadDelGrafico;
  nivel?: 3 | 4;
}) {
  const [ref, ancho] = useAnchoDelGrafico();
  const id = useId();
  const [tabla, setTabla] = useState(false);
  const Titulo = nivel === 3 ? 'h3' : 'h4';
  const alto = ALTO[densidad];
  const color = colorDelCarril(indice);
  const enUnidad = (v: number): string => valorConUnidad(v, d.unidad, decimales);
  if (!d.dibujable && d.falta) {
    return (
      <div className="dos-etapas">
        <Titulo className="dos-etapas__titulo">{titulo}</Titulo>
        <EstadoDelGraficoEnPantalla estado={{ tipo: 'FALTA_HISTORIA', hay: [...d.falta.hay], hacen: d.falta.hacen, unidad: d.falta.unidad }} />
        <p className="nota">{d.descripcion}</p>
      </div>
    );
  }
  const g = geometriaDeDosEtapas(d, ancho, alto);
  return (
    <div className={`dos-etapas dos-etapas--${densidad.toLowerCase()}`}>
      <Titulo className="dos-etapas__titulo">{titulo}</Titulo>
      <div ref={ref} className="dos-etapas__area" role="group" aria-roledescription="gráfico" aria-label={titulo} aria-describedby={`${id}-descripcion`}>
        <svg width="100%" height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" className="dos-etapas__svg">
          {g.marcasY.map((m) => (
            <text key={m.valor} x={MARGEN_DE_DOS_ETAPAS.izquierda - 6} y={m.y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {formato(m.valor, d.extremos.decimales)}
            </text>
          ))}
          {g.columnas.map((c) => (
            <g key={c.letra} data-etapa={c.letra}>
              <rect x={c.x1} y={0} width={c.x2 - c.x1} height={alto} fill="none" stroke="var(--borde)" strokeWidth={1} rx={6} />
              <text x={c.x1 + 8} y={LETRA_MINIMA + 2} fontSize={LETRA_MINIMA} fontWeight={700} fill="var(--texto)">
                {c.letra}
              </text>
              {c.mediana ? <line className="dos-etapas__mediana" x1={c.x1 + 4} x2={c.x2 - 4} y1={c.mediana.y} y2={c.mediana.y} stroke={color} strokeWidth={2} strokeDasharray="6 4" /> : null}
              {c.marcas.map((m) => (
                <MarcaDelCarril key={m.clave} marca={m.marca} cx={m.x} cy={m.y} porDia={10} color={color} />
              ))}
            </g>
          ))}
        </svg>
      </div>
      <p id={`${id}-descripcion`} className="visualmente-oculto">
        {d.descripcion}
      </p>
      <div className="dos-etapas__lados">
        {d.lados.map((l) => (
          <dl key={l.etapa.letra} className="dos-etapas__lado">
            <div>
              <dt>Etapa {l.etapa.letra}</dt>
              <dd>
                {l.etapa.rotulo} · {fechasDeLaEtapa(l.etapa)}
              </dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>{l.cantidad}</dd>
            </div>
            <div>
              <dt>Mediana</dt>
              <dd>{l.mediana === null ? 'Sin mediana' : enUnidad(l.mediana)}</dd>
            </div>
            {l.afuera.length > 0 ? (
              <div>
                <dt>{COPY_DE_LOS_CRUCES.fueraDeLaMediana}</dt>
                <dd>{l.afuera.join(', ')}</dd>
              </div>
            ) : null}
            {l.fuerza ? (
              <div>
                <dt>RIR y repeticiones</dt>
                <dd>{fuerzaEnPalabras(l.fuerza)}</dd>
              </div>
            ) : null}
          </dl>
        ))}
      </div>
      <ul className="grafico-base__leyenda" aria-label="Cómo se leen las marcas">
        <li>{COPY_DE_LOS_CRUCES.leyendaEntra}</li>
        <li>{COPY_DE_LOS_CRUCES.leyendaAfuera}</li>
        <li>Raya discontinua: la {COPY_DE_LOS_CRUCES.mediana} de la etapa</li>
      </ul>
      <div className="grafico-base__tabla">
        <button type="button" className="boton boton--enlace" aria-expanded={tabla} aria-controls={`${id}-tabla`} onClick={() => setTabla((t) => !t)}>
          {tabla ? COPY_DE_LOS_GRAFICOS.ocultarLaTabla : COPY_DE_LOS_GRAFICOS.verLaTabla}
        </button>
        <div id={`${id}-tabla`} hidden={!tabla}>
          {tabla ? (
            <div className="grafico-base__tabla-desplazable">
              <table>
                <caption>{titulo}</caption>
                <thead>
                  <tr>
                    <th scope="col">Etapa</th>
                    <th scope="col">{COPY_DE_LOS_GRAFICOS.fecha}</th>
                    <th scope="col">Lo registrado ({d.unidad})</th>
                    <th scope="col">En la mediana</th>
                  </tr>
                </thead>
                <tbody>
                  {d.lados.flatMap((l) =>
                    l.puntos.map((p) => (
                      <tr key={`${l.etapa.letra}-${p.clave}`}>
                        <th scope="row">{l.etapa.letra}</th>
                        <td>{textoDeLaMarca(p.fecha)}</td>
                        <td data-marca={p.marca}>{p.lectura}</td>
                        <td>{p.enLaMediana ? 'Sí' : 'No'}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type EstadoDeDosEtapas = EstadoDelGrafico | { readonly tipo: 'LISTA'; readonly d: DosEtapasLadoALado; readonly definicion: DefinicionDeMetrica; readonly detalle: string };

/** La serie que compara GR-24 en «Patrones»: con un ejercicio, su 1RM estimado (v1) o su carga; sin ejercicio, las calorías. */
function referenciaDeLaComparacion(ejercicio: PropsDelGrafico['ejercicio']): ReferenciaDeMetrica {
  if (!ejercicio) return { metricId: 'nutricion.energia', exerciseKey: null, setIndex: null, unit: null };
  const id = ejercicioDeLaClave(ejercicio.exerciseKey);
  if (id !== null && entraEnLaEstimacion(id)) return { metricId: 'entrenamiento.1rm-estimado', exerciseKey: ejercicio.exerciseKey, setIndex: null, unit: ejercicio.unidad ?? 'kg' };
  return { metricId: 'entrenamiento.carga', exerciseKey: ejercicio.exerciseKey, setIndex: ejercicio.serie ?? 1, unit: ejercicio.unidad ?? 'kg' };
}

/** GR-24 en «Patrones»: la versión vigente del plan frente a la anterior, con todas las observaciones de cada una. */
export default function GraficoDeDosEtapas({ lectura, periodo, densidad, ejercicio }: PropsDelGrafico) {
  const [estado, setEstado] = useState<EstadoDeDosEtapas>({ tipo: 'CARGANDO' });
  const [vuelta, setVuelta] = useState(0);
  const ref = referenciaDeLaComparacion(ejercicio);
  const clave = `${lectura.asesoradoId}|${periodo.desde}|${periodo.hasta}|${ref.metricId}|${ref.exerciseKey ?? ''}|${ref.setIndex ?? ''}|${ref.unit ?? ''}|${vuelta}`;
  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'CARGANDO' });
    const p = { ...lectura, periodo };
    void (async () => {
      const fuerza = ref.metricId === 'entrenamiento.1rm-estimado';
      const exerciseId = ref.exerciseKey ? ejercicioDeLaClave(ref.exerciseKey) : null;
      const leida = fuerza && exerciseId ? await leerLaFuerza(p, exerciseId, ref.unit ?? 'kg', false) : await leerSerieDelCatalogo(p, ref, ref.metricId.startsWith('nutricion.') ? 'DAY' : 'ORIGINAL');
      if (!vigente || leida.tipo === 'cargando') return;
      if (leida.tipo === 'sin-acceso') return setEstado({ tipo: 'SIN_ACCESO' });
      if (leida.tipo === 'error') return setEstado({ tipo: 'ERROR', motivo: leida.motivo });
      if (leida.tipo === 'sin-datos' || leida.tipo === 'sin-especificacion') return setEstado({ tipo: 'SIN_DATOS', texto: C.sinSerie });
      const serie: SerieAnalitica = 'observaciones' in leida ? leida.observaciones : leida.serie;
      const definicion = definicionDeLaSerie(ref.metricId, serie.unit);
      const delCatalogo = serieDisponible(ref.metricId, serie.unit);
      if (!definicion || !delCatalogo) return setEstado({ tipo: 'SIN_DATOS', texto: C.sinSerie });
      const dominio = definicion.area === 'NUTRICION' ? 'NUTRITION' : 'TRAINING';
      const etapas = etapasDelArea(leida.bandas, dominio, periodo.hoy, leida.generada);
      const a = etapas[etapas.length - 2];
      const b = etapas[etapas.length - 1];
      if (!a || !b) return setEstado({ tipo: 'SIN_DATOS', texto: C.sinEtapas });
      const d = dosEtapasLadoALado({
        serie,
        definicion,
        a: etapaDeLaPlanificacion(a, 'A'),
        b: etapaDeLaPlanificacion(b, 'B'),
        leido: { desde: inicioDelEje(periodo), hasta: periodo.hasta },
        escala: escalaDeLaSerie(delCatalogo, serie.unit),
        lectura: (pt) => lecturaDelPunto(pt, definicion, serie.unit),
        fuerza: 'puntos' in leida ? leida.puntos : null,
      });
      const nombre = ejercicio ? `${definicion.nombreCorto} · ${ejercicio.nombre}` : definicion.nombre;
      setEstado({ tipo: 'LISTA', d, definicion, detalle: C.detalleDeLaSerie(nombre, dominio === 'NUTRITION' ? 'Nutrición' : 'Entrenamiento') });
    })();
    return () => {
      vigente = false;
    };
    // `clave` resume lo que cambia la lectura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  if (estado.tipo !== 'LISTA') return <EstadoDelGraficoEnPantalla estado={estado} onReintentar={() => setVuelta((v) => v + 1)} />;
  return (
    <section className="cruce cruce--dos-etapas" aria-label={C.titulo}>
      <NotaDelInicio periodo={periodo} />
      <p className="cruce__pregunta">{C.pregunta}</p>
      <p className="nota">{estado.detalle}</p>
      <DosEtapasEnPantalla titulo={C.titulo} d={estado.d} decimales={estado.definicion.decimales} densidad={densidad} nivel={3} />
      <details className="cruce__como-leerlo">
        <summary>{COPY_DE_LOS_CRUCES.comoLeerlo}</summary>
        <ul>
          {C.comoLeerlo.map((t) => (
            <li key={t}>{t}</li>
          ))}
          <li>
            {COPY_DE_LOS_CRUCES.noRegistra}: {LO_QUE_BE_NO_REGISTRA['GR-24'].join('; ')}.
          </li>
        </ul>
      </details>
      <p className="cruce__frase">{COPY_DE_LOS_CRUCES.frase}</p>
    </section>
  );
}
