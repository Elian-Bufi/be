'use client';

/**
 * GR-18 en pantalla (WP-GRAFICOS fase 2, rama C; DL-174): el perfil por sitio entre dos tomas. Por omisión, la toma más
 * nueva y la anterior; se puede elegir otro par. Una fila por sitio con los dos valores en el eje común de su familia,
 * unidos por un segmento solo si son del mismo grupo de comparabilidad, y la diferencia escrita. El dibujo no se lee:
 * la tabla dice lo mismo, con los nombres enteros. Las reglas están en `perfil-por-sitio.ts`.
 *
 * La pasada visual de la rama C (DISENO-VISUAL §1; GR-VC07): el título con su línea tenue (qué se compara y en qué
 * unidades), las tomas como fichas cortas con su fecha, el eje de cada familia con 3 a 5 marcas redondas y su grilla
 * tenue, la columna de la diferencia con su encabezado, **el nombre de cada sitio entero** (en dos renglones si no entra,
 * nunca cortado con «…»), y a la vista solo lo que §5 pide (el error de medición, lo que no se compara); lo que aclara,
 * en «Cómo leerlo».
 *
 * `PerfilEntreDosTomas` lo usan «Evolución › Por sitio» (con la lectura de esa vista) y el gráfico del registro
 * (`PerfilPorSitio`, que lee sus tomas en tramos de 92 días).
 */
import { useId, useMemo, useState, type ReactNode } from 'react';
import { LETRA_MINIMA } from '../../seguimiento/geometria';
import { ComoLeerlo } from '../como-leerlo';
import { COPY_DE_LOS_GRAFICOS } from '../copy';
import { textoDeLaMarcaDelEje } from '../ejes';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { colorDelCarril } from '../marcas';
import { useAnchoDelGrafico } from '../medidas-del-grafico';
import { useGraficoLeido } from '../nutricion-y-cuerpo/grafico-leido';
import type { GraficoLeido } from '../nutricion-y-cuerpo/leido';
import { diaYMes } from '../nutricion-y-cuerpo/lienzo';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { COPY_ANTROPOMETRIA_EN_GRAFICOS as C } from './copy';
import { leerTomasDelPeriodo } from './lecturas-de-antropometria';
import {
  detalleDelPerfil,
  filaEnPalabras,
  filasDelGrupo,
  notasDelPerfil,
  perfilPorSitio,
  tomasConSitios,
  tomasPorOmision,
  xDelValor,
  type GrupoDelPerfil,
  type PerfilPorSitio as Perfil,
  type TomaDelPerfil,
  type ValorDelSitio,
} from './perfil-por-sitio';
import { conTomasDeOtros, observacionesDeLasTomas, type ObservacionDeLaToma } from './tomas';

const ALTO_DEL_EJE = 22;
const ANCHO_DE_LA_DIFERENCIA = 84;
const COLOR_ANTES = colorDelCarril(1);
const COLOR_DESPUES = colorDelCarril(0);

/** La marca de un valor: cuadrado la toma anterior, círculo la más nueva; con el contorno cortado si fue reportado. */
function MarcaDelValor({ v, x, y, antes }: { v: Pick<ValorDelSitio, 'clase'>; x: number; y: number; antes: boolean }) {
  const color = antes ? COLOR_ANTES : COLOR_DESPUES;
  const reportado = v.clase === 'REPORTED';
  const relleno = reportado ? 'var(--superficie)' : color;
  const trazo = reportado ? { stroke: color, strokeWidth: 1.5, strokeDasharray: '2 2' } : {};
  return antes ? <rect x={x - 4.5} y={y - 4.5} width={9} height={9} fill={relleno} {...trazo} /> : <circle cx={x} cy={y} r={5} fill={relleno} {...trazo} />;
}

function GrupoEnPantalla({ g }: { g: GrupoDelPerfil }) {
  const [ref, ancho] = useAnchoDelGrafico();
  const layout = filasDelGrupo(g, ancho);
  const izquierda = layout.nombres + 12;
  const derecha = ancho - ANCHO_DE_LA_DIFERENCIA - 12;
  const x = (v: number) => xDelValor(v, g.extremos, izquierda, derecha);
  const alto = ALTO_DEL_EJE + layout.alto;
  const dibujable = (v: ValorDelSitio | null): v is ValorDelSitio => v !== null && v.unidad === g.unidad;
  return (
    <div ref={ref} className="perfil-por-sitio__grupo">
      <p className="grafico-base__carril-nombre">
        {g.nombre}
        <span className="grafico-base__unidad"> · {g.unidad}</span>
      </p>
      <svg width="100%" height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" className="grafico-base__svg">
        {g.extremos.valores.map((v) => (
          <g key={v} className="grafico-base__grilla">
            <line x1={Math.round(x(v)) + 0.5} x2={Math.round(x(v)) + 0.5} y1={ALTO_DEL_EJE - 4} y2={alto} stroke="var(--borde)" strokeWidth={1} />
            <text x={x(v)} y={ALTO_DEL_EJE - 9} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {textoDeLaMarcaDelEje(v, g.extremos.decimales)}
            </text>
          </g>
        ))}
        <text x={ancho} y={ALTO_DEL_EJE - 9} textAnchor="end" fontSize={LETRA_MINIMA} fill="var(--tenue)">
          {C.perfil.diferencia}
        </text>
        {layout.filas.map(({ fila: f, y, renglones }) => {
          const a = dibujable(f.antes) ? f.antes : null;
          const d = dibujable(f.despues) ? f.despues : null;
          const cy = ALTO_DEL_EJE + y;
          return (
            <g key={f.metrica} data-sitio={f.metrica} data-estado={f.estado}>
              <text x={0} y={cy - ((renglones.length - 1) * 15) / 2} dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--texto)">
                {renglones.map((r, i) => (
                  <tspan key={r} x={0} dy={i === 0 ? 0 : 15}>
                    {r}
                  </tspan>
                ))}
              </text>
              {f.estado === 'PAR' && a && d ? <line x1={x(a.valor)} x2={x(d.valor)} y1={cy} y2={cy} stroke="var(--tenue)" strokeWidth={2} /> : null}
              {a ? <MarcaDelValor v={a} x={x(a.valor)} y={cy} antes /> : null}
              {d ? <MarcaDelValor v={d} x={x(d.valor)} y={cy} antes={false} /> : null}
              <text x={ancho} y={cy} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill={f.diferencia ? 'var(--texto)' : 'var(--tenue)'}>
                {f.diferencia ?? '—'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TablaDelPerfil({ perfil }: { perfil: Perfil }) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  const antes = `${perfil.antes.etiqueta} · ${diaYMes(perfil.antes.fecha, perfil.despues.fecha)}`;
  const despues = `${perfil.despues.etiqueta} · ${diaYMes(perfil.despues.fecha)}`;
  return (
    <div className="grafico-base__tabla">
      <button type="button" className="boton boton--enlace" aria-expanded={abierta} aria-controls={id} onClick={() => setAbierta((x) => !x)}>
        {abierta ? COPY_DE_LOS_GRAFICOS.ocultarLaTabla : COPY_DE_LOS_GRAFICOS.verLaTabla}
      </button>
      <div id={id} hidden={!abierta}>
        {abierta ? (
          <div className="grafico-base__tabla-desplazable">
            <table>
              <caption>{C.perfil.titulo}</caption>
              <thead>
                <tr>
                  <th scope="col">{C.perfil.sitio}</th>
                  <th scope="col">{antes}</th>
                  <th scope="col">{despues}</th>
                  <th scope="col">{C.perfil.diferencia}</th>
                </tr>
              </thead>
              {perfil.grupos.map((g) => (
                <tbody key={g.clave}>
                  <tr>
                    <th scope="rowgroup" colSpan={4}>
                      {g.nombre} ({g.unidad})
                    </th>
                  </tr>
                  {g.filas.map((f) => {
                    const t = filaEnPalabras(f, perfil.antes, perfil.despues);
                    return (
                      <tr key={f.metrica}>
                        <th scope="row">{f.nombre}</th>
                        <td>{t.antes}</td>
                        <td>{t.despues}</td>
                        <td>{t.diferencia}</td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ElegirToma({ etiqueta, tomas, elegida, onElegir }: { etiqueta: string; tomas: readonly TomaDelPerfil[]; elegida: string; onElegir: (id: string) => void }) {
  const id = useId();
  return (
    <span className="perfil-por-sitio__eleccion">
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} value={elegida} onChange={(e) => onElegir(e.target.value)}>
        {tomas.map((t) => (
          <option key={t.evaluacionId} value={t.evaluacionId}>
            {`${C.perfil.toma(diaYMes(t.fecha, tomas[tomas.length - 1]?.fecha), t.etiqueta)} (${t.sitios} ${t.sitios === 1 ? 'sitio' : 'sitios'})`}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Una ficha de la leyenda: el glifo, el texto corto a la vista y el entero para el lector de pantalla. */
function Ficha({ glifo, corto, largo }: { glifo: ReactNode; corto: string; largo: string }) {
  return (
    <li>
      <span className="grafico-base__glifo">
        <svg width={14} height={14} viewBox="0 0 18 18" aria-hidden="true">
          {glifo}
        </svg>
        <span aria-hidden="true">{corto}</span>
        <span className="visualmente-oculto">{largo}</span>
      </span>
    </li>
  );
}

/** El perfil entre dos tomas, con la elección del par; las tomas ya leídas. */
export function PerfilEntreDosTomas({ observaciones, parcial, enTramos }: { observaciones: readonly ObservacionDeLaToma[]; parcial: boolean; enTramos: boolean }) {
  const tomas = useMemo(() => tomasConSitios(observaciones), [observaciones]);
  const porOmision = tomasPorOmision(tomas);
  const [antesPedida, setAntes] = useState<string | null>(null);
  const [despuesPedida, setDespues] = useState<string | null>(null);
  const hay = (id: string | null): id is string => id !== null && tomas.some((t) => t.evaluacionId === id);
  const antes = hay(antesPedida) ? antesPedida : (porOmision?.antes ?? null);
  const despues = hay(despuesPedida) ? despuesPedida : (porOmision?.despues ?? null);
  const perfil = useMemo(() => (antes && despues ? perfilPorSitio(observaciones, tomas, antes, despues) : null), [observaciones, tomas, antes, despues]);
  const idDelResumen = useId();
  if (tomas.length < 2) {
    return (
      <div className="grafico-base">
        <h3 className="grafico-base__titulo">{C.perfil.titulo}</h3>
        <EstadoDelGraficoEnPantalla estado={tomas.length === 0 ? { tipo: 'SIN_DATOS', texto: C.perfil.sinTomas } : { tipo: 'SIN_DATOS', texto: C.perfil.unaSolaToma }} />
      </div>
    );
  }
  const textos = perfil ? notasDelPerfil(perfil, { parcial, enTramos }) : null;
  const conReportado = perfil ? perfil.grupos.some((g) => g.filas.some((f) => f.antes?.clase === 'REPORTED' || f.despues?.clase === 'REPORTED')) : false;
  const fechaAntes = perfil ? diaYMes(perfil.antes.fecha, perfil.despues.fecha) : '';
  const fechaDespues = perfil ? diaYMes(perfil.despues.fecha) : '';
  return (
    <div className="grafico-base perfil-por-sitio">
      <div className="grafico-base__cabecera">
        <h3 className="grafico-base__titulo">{C.perfil.titulo}</h3>
        {perfil ? <p className="grafico-base__detalle">{detalleDelPerfil(perfil)}</p> : null}
      </div>
      <div className="perfil-por-sitio__tomas">
        <ElegirToma etiqueta={C.perfil.comparar} tomas={tomas} elegida={antes ?? ''} onElegir={setAntes} />
        <ElegirToma etiqueta={C.perfil.con} tomas={tomas} elegida={despues ?? ''} onElegir={setDespues} />
      </div>
      {perfil === null || textos === null ? (
        <p className="nota">{C.perfil.mismaToma}</p>
      ) : (
        <>
          <ul className="grafico-base__leyenda" aria-label={COPY_DE_LOS_GRAFICOS.leyenda}>
            <Ficha glifo={<rect x={4.5} y={4.5} width={9} height={9} fill={COLOR_ANTES} />} corto={C.perfil.fichaAntes(fechaAntes)} largo={`${C.perfil.leyendaAntes} (${fechaAntes})`} />
            <Ficha glifo={<circle cx={9} cy={9} r={5} fill={COLOR_DESPUES} />} corto={C.perfil.fichaDespues(fechaDespues)} largo={`${C.perfil.leyendaDespues} (${fechaDespues})`} />
            {conReportado ? <Ficha glifo={<circle cx={9} cy={9} r={5} fill="var(--superficie)" stroke={COLOR_DESPUES} strokeWidth={1.5} strokeDasharray="2 2" />} corto={C.perfil.fichaReportado} largo={C.perfil.leyendaReportado} /> : null}
          </ul>
          <div className="grafico-base__area" role="group" aria-roledescription="gráfico" aria-label={C.perfil.titulo} aria-describedby={idDelResumen}>
            {perfil.grupos.map((g) => (
              <GrupoEnPantalla key={g.clave} g={g} />
            ))}
          </div>
          <p id={idDelResumen} className="visualmente-oculto">
            {perfil.descripcion}
          </p>
          {textos.notas.map((n) => (
            <p key={n} className="nota grafico-base__nota">
              {n}
            </p>
          ))}
          <div className="grafico-base__pie">
            <TablaDelPerfil perfil={perfil} />
            <ComoLeerlo de={C.perfil.titulo}>
              {textos.aclaraciones.map((n) => (
                <p key={n}>{n}</p>
              ))}
            </ComoLeerlo>
          </div>
        </>
      )}
    </div>
  );
}

/** GR-18 del registro: lee las tomas del período en tramos de 92 días y dibuja el perfil. */
export function PerfilPorSitio({ lectura, periodo }: PropsDelGrafico) {
  const { estado, reintentar } = useGraficoLeido(async (): Promise<GraficoLeido<{ observaciones: readonly ObservacionDeLaToma[]; parcial: boolean; enTramos: boolean }>> => {
    const leidas = await leerTomasDelPeriodo(lectura, periodo);
    if (leidas.tipo !== 'LISTO') return leidas;
    return { tipo: 'LISTO', datos: { observaciones: observacionesDeLasTomas(leidas.datos.respuestas), parcial: conTomasDeOtros(leidas.datos.respuestas), enTramos: leidas.datos.enTramos } };
  }, [lectura.token, lectura.asesoradoId, periodo.desde, periodo.hasta, periodo.desdeElVinculo]);
  if (estado.tipo === 'LISTO') return <PerfilEntreDosTomas observaciones={estado.datos.observaciones} parcial={estado.datos.parcial} enTramos={estado.datos.enTramos} />;
  if (estado.tipo === 'SESION' || estado.tipo === 'SIN_ACCESO') return null;
  return (
    <div className="grafico-base">
      <h3 className="grafico-base__titulo">{C.perfil.titulo}</h3>
      <EstadoDelGraficoEnPantalla estado={estado} onReintentar={reintentar} />
    </div>
  );
}
