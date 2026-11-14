'use client';

/**
 * GR-18 en pantalla (WP-GRAFICOS fase 2, rama C; DL-174): el perfil por sitio entre dos tomas. Por omisión, la toma más
 * nueva y la anterior; se puede elegir otro par. Una fila por sitio con los dos valores en el eje común de su familia,
 * unidos por un segmento solo si son del mismo grupo de comparabilidad, y la diferencia escrita. El dibujo no se lee:
 * la tabla dice lo mismo, con los nombres enteros. Las reglas están en `perfil-por-sitio.ts`.
 *
 * `PerfilEntreDosTomas` lo usan «Evolución › Por sitio» (con la lectura de esa vista) y el gráfico del registro
 * (`PerfilPorSitio`, que lee sus tomas en tramos de 92 días).
 */
import { useId, useMemo, useState } from 'react';
import { LETRA_MINIMA } from '../../seguimiento/geometria';
import { COPY_DE_LOS_GRAFICOS } from '../copy';
import { EstadoDelGraficoEnPantalla } from '../estado-del-grafico';
import { colorDelCarril } from '../marcas';
import { useAnchoDelGrafico } from '../medidas-del-grafico';
import { useGraficoLeido } from '../nutricion-y-cuerpo/grafico-leido';
import type { GraficoLeido } from '../nutricion-y-cuerpo/leido';
import { diaYMes } from '../nutricion-y-cuerpo/lienzo';
import type { PropsDelGrafico } from '../registro-de-graficos';
import { COPY_ANTROPOMETRIA_EN_GRAFICOS as C } from './copy';
import { leerTomasDelPeriodo } from './lecturas-de-antropometria';
import { filaEnPalabras, perfilPorSitio, tomasConSitios, tomasPorOmision, xDelValor, type GrupoDelPerfil, type PerfilPorSitio as Perfil, type TomaDelPerfil, type ValorDelSitio } from './perfil-por-sitio';
import { conTomasDeOtros, observacionesDeLasTomas, type ObservacionDeLaToma } from './tomas';

const ALTO_DE_LA_FILA = 26;
const ALTO_DEL_EJE = 20;
const ANCHO_DE_LA_DIFERENCIA = 76;
const ANCHO_DE_UNA_LETRA = 7;
const COLOR_ANTES = colorDelCarril(1);
const COLOR_DESPUES = colorDelCarril(0);

const formato = (v: number, decimales: number): string => v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/** La marca de un valor: cuadrado la toma anterior, círculo la más nueva; con el contorno cortado si fue reportado. */
function MarcaDelValor({ v, x, y, antes }: { v: ValorDelSitio; x: number; y: number; antes: boolean }) {
  const color = antes ? COLOR_ANTES : COLOR_DESPUES;
  const reportado = v.clase === 'REPORTED';
  const relleno = reportado ? 'var(--superficie)' : color;
  const trazo = reportado ? { stroke: color, strokeWidth: 1.5, strokeDasharray: '2 2' } : {};
  return antes ? <rect x={x - 4.5} y={y - 4.5} width={9} height={9} fill={relleno} {...trazo} /> : <circle cx={x} cy={y} r={5} fill={relleno} {...trazo} />;
}

function GrupoEnPantalla({ g }: { g: GrupoDelPerfil }) {
  const [ref, ancho] = useAnchoDelGrafico();
  const nombres = Math.round(Math.min(240, Math.max(120, ancho * 0.38)));
  const izquierda = nombres + 8;
  const derecha = ancho - ANCHO_DE_LA_DIFERENCIA - 8;
  const x = (v: number) => xDelValor(v, g.extremos, izquierda, derecha);
  const letras = Math.max(8, Math.floor(nombres / ANCHO_DE_UNA_LETRA));
  const recortar = (n: string) => (n.length > letras ? `${n.slice(0, letras - 1)}…` : n);
  const paso = (g.extremos.arriba - g.extremos.abajo) / 2;
  const marcasDelEje = [g.extremos.abajo, g.extremos.abajo + paso, g.extremos.arriba];
  const alto = ALTO_DEL_EJE + g.filas.length * ALTO_DE_LA_FILA;
  const dibujable = (v: ValorDelSitio | null): v is ValorDelSitio => v !== null && v.unidad === g.unidad;
  return (
    <div ref={ref} className="perfil-por-sitio__grupo">
      <p className="grafico-base__carril-nombre">
        {g.nombre}
        <span className="grafico-base__unidad"> · {g.unidad}</span>
      </p>
      <svg width="100%" height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" className="grafico-base__svg">
        {marcasDelEje.map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={ALTO_DEL_EJE - 4} y2={alto} stroke="var(--borde)" strokeWidth={1} opacity={0.5} />
            <text x={x(v)} y={ALTO_DEL_EJE - 8} textAnchor="middle" fontSize={LETRA_MINIMA} fill="var(--tenue)">
              {formato(v, g.extremos.decimales)}
            </text>
          </g>
        ))}
        {g.filas.map((f, i) => {
          const y = ALTO_DEL_EJE + i * ALTO_DE_LA_FILA + ALTO_DE_LA_FILA / 2;
          const a = dibujable(f.antes) ? f.antes : null;
          const d = dibujable(f.despues) ? f.despues : null;
          return (
            <g key={f.metrica} data-sitio={f.metrica} data-estado={f.estado}>
              <text x={0} y={y} dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--texto)">
                {recortar(f.nombre)}
              </text>
              {f.estado === 'PAR' && a && d ? <line x1={x(a.valor)} x2={x(d.valor)} y1={y} y2={y} stroke="var(--tenue)" strokeWidth={2} /> : null}
              {a ? <MarcaDelValor v={a} x={x(a.valor)} y={y} antes /> : null}
              {d ? <MarcaDelValor v={d} x={x(d.valor)} y={y} antes={false} /> : null}
              <text x={ancho} y={y} textAnchor="end" dominantBaseline="middle" fontSize={LETRA_MINIMA} fill="var(--texto)">
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
  const antes = `${perfil.antes.etiqueta} · ${diaYMes(perfil.antes.fecha)}`;
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
            {`${C.perfil.toma(diaYMes(t.fecha), t.etiqueta)} (${t.sitios} ${t.sitios === 1 ? 'sitio' : 'sitios'})`}
          </option>
        ))}
      </select>
    </span>
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
  const filas = perfil ? perfil.grupos.flatMap((g) => g.filas) : [];
  const sinPar = filas.filter((f) => f.estado === 'SOLO_ANTES' || f.estado === 'SOLO_DESPUES').length;
  const otroGrupo = filas.filter((f) => f.estado === 'OTRO_GRUPO').length;
  const conReportado = filas.some((f) => f.antes?.clase === 'REPORTED' || f.despues?.clase === 'REPORTED');
  return (
    <div className="grafico-base perfil-por-sitio">
      <h3 className="grafico-base__titulo">{C.perfil.titulo}</h3>
      <div className="perfil-por-sitio__tomas">
        <ElegirToma etiqueta={C.perfil.comparar} tomas={tomas} elegida={antes ?? ''} onElegir={setAntes} />
        <ElegirToma etiqueta={C.perfil.con} tomas={tomas} elegida={despues ?? ''} onElegir={setDespues} />
      </div>
      {perfil === null ? (
        <p className="nota">{C.perfil.mismaToma}</p>
      ) : (
        <>
          <div className="grafico-base__area" role="group" aria-roledescription="gráfico" aria-label={C.perfil.titulo} aria-describedby={idDelResumen}>
            {perfil.grupos.map((g) => (
              <GrupoEnPantalla key={g.clave} g={g} />
            ))}
          </div>
          <p id={idDelResumen} className="visualmente-oculto">
            {perfil.descripcion}
          </p>
          <ul className="grafico-base__leyenda" aria-label={COPY_DE_LOS_GRAFICOS.leyenda}>
            <li>
              <span className="grafico-base__glifo">
                <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
                  <rect x={4.5} y={4.5} width={9} height={9} fill={COLOR_ANTES} />
                </svg>
                {`${C.perfil.leyendaAntes} (${diaYMes(perfil.antes.fecha)})`}
              </span>
            </li>
            <li>
              <span className="grafico-base__glifo">
                <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
                  <circle cx={9} cy={9} r={5} fill={COLOR_DESPUES} />
                </svg>
                {`${C.perfil.leyendaDespues} (${diaYMes(perfil.despues.fecha)})`}
              </span>
            </li>
            {conReportado ? (
              <li>
                <span className="grafico-base__glifo">
                  <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
                    <circle cx={9} cy={9} r={5} fill="var(--superficie)" stroke={COLOR_DESPUES} strokeWidth={1.5} strokeDasharray="2 2" />
                  </svg>
                  {C.perfil.leyendaReportado}
                </span>
              </li>
            ) : null}
          </ul>
          {[
            C.perfil.segmento,
            ...(sinPar > 0 ? [`${sinPar} ${sinPar === 1 ? 'sitio tiene' : 'sitios tienen'} dato en una sola de las dos tomas: van sin línea.`] : []),
            ...(otroGrupo > 0 ? [`${otroGrupo} ${otroGrupo === 1 ? 'sitio se tomó' : 'sitios se tomaron'} con otro protocolo, método o unidad en una de las dos: no se comparan.`] : []),
            C.perfil.sinReduccionLocalizada,
            C.sinErrorDeMedicion,
            ...(parcial ? [C.parcial] : []),
            ...(enTramos ? [C.leidoEnTramos] : []),
          ].map((n) => (
            <p key={n} className="nota grafico-base__nota">
              {n}
            </p>
          ))}
          <TablaDelPerfil perfil={perfil} />
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
