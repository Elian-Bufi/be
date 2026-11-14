'use client';

/**
 * «Desde el inicio y desde la anterior» en cada toma (WP-GRAFICOS GR-16, DL-174, fase 1): una tabla compacta con cada
 * medida de la toma, su diferencia con la primera toma y con la anterior del mismo protocolo, método y unidad, y los días
 * de calendario entre las fechas. Debajo, siempre, la línea que dice que BE no tiene cargado el error de medición de quien
 * mide. Las reglas están en el dominio (`desde-el-inicio.ts`); acá solo se lee y se dibuja.
 *
 * - **La lectura** es API-ANT-06, la de «Evolución», en tramos de hasta 92 días que cubren las fechas de las tomas hasta
 *   esta (`tramosDeLasTomas`): no se lee lo que no tiene tomas. Se lee al abrir la toma, de a pocas a la vez
 *   (`limitarLectura`), sin caché de datos de salud en el navegador.
 * - **La primera toma** no lee nada: dice que todavía no hay con qué compararla.
 * - **Sin flechas ni colores:** la diferencia es una resta con su signo y su unidad. Una medida tomada antes con otro
 *   protocolo, método o unidad lo dice en la fila, y no se compara.
 */
import {
  COPY_DESDE_EL_INICIO as C,
  desdeElInicioYLaAnterior,
  diasEntreLasTomas,
  diferenciaDeLaFila,
  fechaCivil,
  tramosDeLasTomas,
  valorDeLaFila,
  type DesdeElInicio,
  type DiferenciaDesdeOtraToma,
  type FilaDesdeElInicio,
} from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { EnPartes } from '../../../../components/en-partes';
import { BloqueDeEstado } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { ICONO_DE_FALLA, motivoDeFalla, type MotivoDeFalla } from '../../../../lib/fallas';
import { diaCivil } from '../../../../lib/formato';
import { limitarLectura } from '../seguimiento/contexto';
import { hoyEn } from '../seguimiento/estado';
import { useAntropometria } from './antropometria';

/** La zona en la que se leen las fechas de las tomas para armar los tramos (la de la API); cada tramo deja un día de margen. */
const ZONA = 'America/Argentina/Buenos_Aires';

type Lectura =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'no-disponible' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'lista'; readonly tabla: DesdeElInicio | null };

/** Una toma de la lista, con lo único que hace falta para saber qué leer: cuándo se tomó. */
export interface TomaParaComparar {
  readonly id: string;
  readonly ocurrio: string;
}

/** La celda de una diferencia: la resta con su signo y, debajo, los días; la fecha, si no es la que dice el encabezado. */
function CeldaDeDiferencia({ d, comun }: { d: DiferenciaDesdeOtraToma; comun: string | null }) {
  return (
    <td className="desde-el-inicio__celda">
      <span className="desde-el-inicio__diferencia">
        <EnPartes texto={diferenciaDeLaFila(d)} />
      </span>
      <span className="nota desde-el-inicio__dias">
        {d.desde !== comun ? `${diaCivil(d.desde)} · ` : ''}
        {diasEntreLasTomas(d.dias)}
      </span>
    </td>
  );
}

function FilaDeLaTabla({ f, tabla }: { f: FilaDesdeElInicio; tabla: DesdeElInicio }) {
  return (
    <tr data-medida={f.metrica}>
      <th scope="row">{f.nombre}</th>
      <td className="desde-el-inicio__valor">
        <EnPartes texto={valorDeLaFila(f)} />
      </td>
      {f.desdeElInicio && f.desdeLaAnterior ? (
        <>
          <CeldaDeDiferencia d={f.desdeElInicio} comun={tabla.fechaDelInicio} />
          <CeldaDeDiferencia d={f.desdeLaAnterior} comun={tabla.fechaDeLaAnterior} />
        </>
      ) : (
        // Sin con qué comparar, una sola celda que dice por qué: no dos veces lo mismo, y nunca un cero.
        <td colSpan={2} className="desde-el-inicio__sin-comparar" data-sin-comparar={f.motivo ?? undefined}>
          <span className="nota">{f.motivo === 'OTRO_GRUPO' ? C.otroGrupo : C.sinPrevia}</span>
        </td>
      )}
    </tr>
  );
}

function TablaDesdeElInicio({ tabla, completo, desde }: { tabla: DesdeElInicio; completo: boolean; desde: string | null }) {
  const referencias = C.inicioYAnterior(tabla.fechaDelInicio ? diaCivil(tabla.fechaDelInicio) : null, tabla.fechaDeLaAnterior ? diaCivil(tabla.fechaDeLaAnterior) : null);
  const grupos = [
    { clave: 'medidas', titulo: C.mediciones, filas: tabla.medidas },
    { clave: 'resultados', titulo: C.resultados, filas: tabla.resultados },
  ].filter((g) => g.filas.length > 0);
  return (
    <>
      {referencias ? <p className="nota desde-el-inicio__referencias">{referencias}.</p> : null}
      {!completo && desde ? <p className="nota">{C.desdeCuandoSeLeyo(diaCivil(desde))}</p> : null}
      {tabla.parcial ? <p className="nota">{C.parcial}</p> : null}
      <div className="desplazable-x">
        <table className="tabla desde-el-inicio__tabla">
          <caption className="visualmente-oculto">{C.titulo}</caption>
          <thead>
            <tr>
              <th scope="col">{C.medida}</th>
              <th scope="col">{C.estaToma}</th>
              <th scope="col">{C.desdeElInicio}</th>
              <th scope="col">{C.desdeLaAnterior}</th>
            </tr>
          </thead>
          {grupos.map((g) => (
            <tbody key={g.clave} data-grupo={g.clave}>
              {grupos.length > 1 ? (
                <tr>
                  <th scope="rowgroup" colSpan={4} className="desde-el-inicio__grupo">
                    {g.titulo}
                  </th>
                </tr>
              ) : null}
              {g.filas.map((f) => (
                <FilaDeLaTabla key={f.metrica} f={f} tabla={tabla} />
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}

/**
 * La sección de la toma abierta. `tomas` son las tomas registradas de la lista (para saber qué tramos leer); la toma
 * abierta se suma aunque no esté en ella.
 */
export function SeccionDesdeElInicio({ evaluacionId, ocurrio, tomas }: { evaluacionId: string; ocurrio: string; tomas: readonly TomaParaComparar[] }) {
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const id = useId();
  // Las tomas hasta esta (por cuándo se tomaron), y esta: lo que hay que leer para el inicio y la anterior.
  const hastaEsta = useMemo(() => [...tomas.filter((t) => t.id !== evaluacionId && t.ocurrio <= ocurrio).map((t) => t.ocurrio), ocurrio], [tomas, evaluacionId, ocurrio]);
  const esLaPrimera = hastaEsta.length === 1;
  const { tramos, completo } = useMemo(() => tramosDeLasTomas(hastaEsta.map((o) => fechaCivil(o, ZONA)), hoyEn()), [hastaEsta]);
  const claveDeLosTramos = tramos.map((t) => `${t.desde}|${t.hasta}`).join(',');
  const desde = useMemo(() => [...hastaEsta.map((o) => fechaCivil(o, ZONA))].sort().find((f) => f >= (tramos[0]?.desde ?? '')) ?? null, [hastaEsta, tramos]);
  const [lectura, setLectura] = useState<Lectura>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    if (esLaPrimera || tramos.length === 0) return;
    let vigente = true;
    setLectura({ tipo: 'cargando' });
    void Promise.all(tramos.map((t) => limitarLectura(() => api.evolucionAntropometrica(token, asesoradoId, { periodStart: t.desde, periodEnd: t.hasta })))).then((rs) => {
      if (!vigente || rs.some((r) => sesionPerdida(r))) return;
      if (rs.some((r) => !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND')) return setLectura({ tipo: 'no-disponible' });
      const fallida = rs.find((r) => !r.ok);
      if (fallida) return setLectura({ tipo: 'error', motivo: motivoDeFalla(fallida) });
      setLectura({ tipo: 'lista', tabla: desdeElInicioYLaAnterior(rs.flatMap((r) => (r.ok ? [r.datos.data] : [])), evaluacionId) });
    });
    return () => {
      vigente = false;
    };
    // Los tramos se resumen en su clave: un dibujo nuevo con los mismos tramos no vuelve a leer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, asesoradoId, evaluacionId, esLaPrimera, claveDeLosTramos, sesionPerdida, vuelta]);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);

  return (
    <section className="desde-el-inicio" aria-labelledby={`${id}-titulo`} data-desde-el-inicio>
      <div className="toma-abierta__titulo-de-bloque">
        <h3 id={`${id}-titulo`}>{C.titulo}</h3>
        <p className="nota">{C.bajada}</p>
      </div>
      {esLaPrimera ? (
        <p className="nota" data-primera-toma>
          {C.primeraToma}
        </p>
      ) : lectura.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          {C.leyendo}
        </p>
      ) : lectura.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[lectura.motivo]} onReintentar={recargar} deQue="las tomas anteriores">
          {C.noSeLeyo}
        </BloqueDeEstado>
      ) : lectura.tipo === 'no-disponible' ? (
        <p className="nota">{C.noSeLeyo}</p>
      ) : !lectura.tabla || lectura.tabla.medidas.length + lectura.tabla.resultados.length === 0 ? (
        <p className="nota" data-sin-medidas>
          {C.sinMedidas}
        </p>
      ) : (
        <>
          <TablaDesdeElInicio tabla={lectura.tabla} completo={completo} desde={desde} />
          {/* GR-16: la línea fija, siempre debajo de la tabla, y no una columna vacía. */}
          <p className="nota desde-el-inicio__error-de-medicion" data-error-de-medicion>
            {C.sinErrorDeMedicion}
          </p>
        </>
      )}
    </section>
  );
}
