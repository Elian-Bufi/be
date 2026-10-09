'use client';

/**
 * «¿Lo registrado coincide con lo indicado?» (WP-DASHBOARD-COMPRENSION, eje 2). Contraste histórico, sin porcentaje
 * global:
 * - **Entrenamiento:** cada serie registrada frente a la prescripción de la versión que esa sesión ejecutó («Plan: 10 a
 *   12; registrado: 11»), con la misma lógica y el mismo componente que la pestaña Entrenamiento (`EvolucionDelEjercicio`).
 *   La lectura es la del contexto de revisión (API-TRN-21), que abarca hasta 92 días: se toman los últimos del período.
 * - **Nutrición:** una fila por comida registrada, con la opción que la persona eligió, el estado de sus cantidades y la
 *   versión del plan; el contraste ingrediente por ingrediente se abre al costado (`contrasteDeLaComida`, del dominio).
 *   Un filtro de hechos deja solo las que no registraron las porciones del plan. Sin confirmar sigue sin confirmar; una
 *   comida diferente queda fuera de lo indicado; las alternativas de una comida no se suman.
 */
import {
  COPY_COMPARACION,
  COPY_ENTRENAMIENTO,
  ejerciciosComparables,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type EntradaDeLineaDeTiempo,
  type LineaDeTiempoResponse,
  type OrigenDeDato,
  type PlanConObjetivos,
} from '@be/domain';
import dynamic from 'next/dynamic';
import { useEffect, useId, useMemo, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { Cargando, EstadoVacio, ErrorConReintento } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { diaCivil, fecha } from '../../../../lib/formato';
import { nombreParaElegir, objetivosDe } from '../training/ejecuciones';
import { limitarLectura, textoDeFalla, useLectura, useSeguimiento } from './contexto';
import { diasEntre, restarDias } from './estado';

const EvolucionDelEjercicio = dynamic(() => import('../training/comparacion').then((m) => m.EvolucionDelEjercicio), { ssr: false, loading: () => <Cargando /> });
const PanelDeRegistro = dynamic(() => import('./registro-original').then((m) => m.PanelDeRegistro), { ssr: false });

/** Lo que admite el contexto de revisión: hasta 92 días inclusivos. */
const DIAS_DEL_CONTEXTO = 92;

export function ContrasteConLoIndicado({ area, exerciseKey }: { area: 'NUTRICION' | 'ENTRENAMIENTO'; exerciseKey: string | null }) {
  return area === 'ENTRENAMIENTO' ? <ContrasteDeEntrenamiento exerciseKey={exerciseKey} /> : <ContrasteDeNutricion />;
}

function ContrasteDeEntrenamiento({ exerciseKey }: { exerciseKey: string | null }) {
  const { token, asesoradoId, periodo, sesionPerdida } = useSeguimiento();
  const id = useId();
  // Los últimos 92 días del período, como mucho: lo que lee el contexto de revisión.
  const desde = diasEntre(periodo.desde, periodo.hasta) > DIAS_DEL_CONTEXTO ? restarDias(periodo.hasta, DIAS_DEL_CONTEXTO - 1) : periodo.desde;
  const { lectura, recargar } = useLectura<ContextoDeRevisionDeEntrenamientoResponse>(`contraste-trn|${asesoradoId}|${desde}|${periodo.hasta}`, () =>
    api.contextoDeRevisionDeEntrenamiento(token, asesoradoId, { periodStart: desde, periodEnd: periodo.hasta }), 'TRAINING',
  );
  const ejecuciones = useMemo(() => (lectura.tipo === 'listo' ? lectura.datos.data.registeredExecutions : []), [lectura]);
  const ejercicios = useMemo(() => ejerciciosComparables(ejecuciones), [ejecuciones]);
  const elegido = ejercicios.find((e) => e.clave === exerciseKey) ?? null;
  const versiones = useMemo(() => new Map((lectura.tipo === 'listo' ? lectura.datos.data.activePlanVersions : []).map((v) => [v.planId, fecha(v.activatedAt as string)])), [lectura]);
  const [planes, setPlanes] = useState<ReadonlyMap<string, PlanConObjetivos>>(new Map());
  useEffect(() => {
    let vigente = true;
    const ids = [...new Set(ejecuciones.map((x) => x.planId))];
    void Promise.all(ids.map((planId) => limitarLectura(() => api.planConObjetivos(token, planId)))).then((rs) => {
      if (!vigente || rs.some((x) => sesionPerdida(x))) return;
      setPlanes(new Map(rs.flatMap((x) => (x.ok ? [[x.datos.data.planId, x.datos.data] as const] : []))));
    });
    return () => {
      vigente = false;
    };
  }, [ejecuciones, token, sesionPerdida]);
  const objetivosPorVersion = useMemo(() => new Map([...planes].map(([planId, plan]) => [planId, objetivosDe(plan)] as const)), [planes]);

  return (
    <section className="contraste" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>{elegido ? `${COPY_COMPARACION.evolucion}: ${nombreParaElegir(elegido, ejercicios)}` : 'Lo registrado frente a lo indicado'}</h3>
      <p className="metadatos">
        Del {diaCivil(desde)} al {diaCivil(periodo.hasta)}
        {desde !== periodo.desde ? ' (los últimos 92 días del período: lo que abarca una revisión)' : ''}. Cada sesión, con lo que indicaba la versión que ejecutó.
      </p>
      {lectura.tipo === 'cargando' ? <Cargando /> : null}
      {lectura.tipo === 'error' ? <ErrorConReintento mensaje={textoDeFalla(lectura.motivo, 'las sesiones registradas')} onReintentar={recargar} /> : null}
      {lectura.tipo === 'no-disponible' ? <p className="nota">Entrenamiento no está disponible con tu acceso actual.</p> : null}
      {lectura.tipo === 'listo' && ejecuciones.length === 0 ? <EstadoVacio titulo={COPY_ENTRENAMIENTO.sinEjecuciones}>Sin sesiones registradas no hay qué contrastar.</EstadoVacio> : null}
      {lectura.tipo === 'listo' && ejecuciones.length > 0 && !elegido ? <p className="nota">Este ejercicio no tiene sesiones registradas en estas fechas: elegí otro o ampliá el período.</p> : null}
      {elegido ? (
        <EvolucionDelEjercicio
          key={elegido.clave}
          ejecuciones={ejecuciones}
          periodo={ejecuciones}
          clave={elegido.clave}
          nombre={nombreParaElegir(elegido, ejercicios)}
          versiones={versiones}
          onAbrir={() => undefined}
          objetivosPorVersion={objetivosPorVersion}
        />
      ) : null}
      <Ayuda titulo="Qué entra en el contraste">
        <p>{COPY_COMPARACION.soloRegistradas}</p>
        <p>Lo indicado es lo de la versión del plan que ejecutó cada sesión, aunque después se haya activado otra. Una diferencia es un dato, no una calificación; no hay un porcentaje global.</p>
      </Ayuda>
    </section>
  );
}

const POR_PAGINA = 50;
/**
 * Las comidas que no registraron las porciones del plan: con cantidades informadas por la persona, sin confirmar o una
 * comida diferente. Es un filtro de hechos, no una calificación: unas cantidades informadas pueden coincidir con el plan.
 */
const SIN_LAS_PORCIONES_DEL_PLAN = 'QUANTITIES_REPORTED,QUANTITIES_UNCONFIRMED,DIFFERENT_MEAL';
const ESTADO_DE_LA_COMIDA: Readonly<Partial<Record<EntradaDeLineaDeTiempo['state'], string>>> = { ANNULLED: 'Anulado', RECTIFIED: 'Rectificado', CORRECTED: 'Corregido' };

type PaginasExtra = { readonly clave: string; readonly entradas: readonly EntradaDeLineaDeTiempo[]; readonly cursor: string | null; readonly cargando: boolean; readonly falla: boolean };

function ContrasteDeNutricion() {
  const { token, asesoradoId, periodo, sesionPerdida } = useSeguimiento();
  const id = useId();
  const [soloSinPorciones, setSoloSinPorciones] = useState(false);
  const filtro = useMemo(
    () => ({ periodStart: periodo.desde, periodEnd: periodo.hasta, domain: 'NUTRITION', type: 'MEAL_RECORDED', ...(soloSinPorciones ? { quality: SIN_LAS_PORCIONES_DEL_PLAN } : {}), limit: String(POR_PAGINA) }),
    [periodo.desde, periodo.hasta, soloSinPorciones],
  );
  const clave = `contraste-nut|${asesoradoId}|${periodo.desde}|${periodo.hasta}|${soloSinPorciones ? 'sin-porciones' : 'todas'}`;
  const { lectura, recargar } = useLectura<LineaDeTiempoResponse>(clave, () => api.lineaDeTiempo(token, asesoradoId, filtro), 'NUTRITION');
  const [abierto, setAbierto] = useState<{ origen: OrigenDeDato; titulo: string } | null>(null);
  // «Ver más»: las páginas siguientes de esta misma consulta. Si la consulta cambia, las páginas viejas no se muestran.
  const [mas, setMas] = useState<PaginasExtra>({ clave: '', entradas: [], cursor: null, cargando: false, falla: false });
  const primera = lectura.tipo === 'listo' ? lectura.datos : null;
  const extras: PaginasExtra = mas.clave === clave ? mas : { clave, entradas: [], cursor: null, cargando: false, falla: false };
  const entradas = primera ? [...primera.data.entries, ...extras.entradas] : [];
  const cursor = extras.entradas.length > 0 ? extras.cursor : (primera?.page.nextCursor ?? null);
  const verMas = async () => {
    if (!cursor) return;
    const pedida = clave;
    setMas({ ...extras, cargando: true, falla: false });
    const r = await limitarLectura(() => api.lineaDeTiempo(token, asesoradoId, { ...filtro, cursor }));
    if (sesionPerdida(r)) return;
    setMas((m) => {
      const base = m.clave === pedida ? m : { clave: pedida, entradas: [], cursor: null, cargando: false, falla: false };
      return r.ok ? { clave: pedida, entradas: [...base.entradas, ...r.datos.data.entries], cursor: r.datos.page.nextCursor, cargando: false, falla: false } : { ...base, cargando: false, falla: true };
    });
  };
  const total = primera?.data.totalMatching ?? 0;
  return (
    <section className="contraste" aria-labelledby={`${id}-titulo`}>
      <h3 id={`${id}-titulo`}>Cada comida registrada frente a su opción del plan</h3>
      <p className="metadatos">
        Del {diaCivil(periodo.desde)} al {diaCivil(periodo.hasta)}
        {primera
          ? ` · ${total === 1 ? 'una comida' : `${total} comidas`}${soloSinPorciones ? ' que no registraron las porciones del plan' : ' registradas'}${entradas.length < total ? `; se ven las últimas ${entradas.length}` : ''}`
          : ''}
        .
      </p>
      <fieldset className="capas">
        <legend>Qué comidas ver</legend>
        <label className="capa">
          <input type="radio" name={`${id}-ver`} checked={!soloSinPorciones} onChange={() => setSoloSinPorciones(false)} />
          Todas
        </label>
        <label className="capa">
          <input type="radio" name={`${id}-ver`} checked={soloSinPorciones} onChange={() => setSoloSinPorciones(true)} />
          Solo las que no registraron las porciones del plan (cantidades informadas, sin confirmar o una comida diferente)
        </label>
      </fieldset>
      {lectura.tipo === 'cargando' ? <Cargando /> : null}
      {lectura.tipo === 'error' ? <ErrorConReintento mensaje={textoDeFalla(lectura.motivo, 'las comidas registradas')} onReintentar={recargar} /> : null}
      {lectura.tipo === 'no-disponible' ? <p className="nota">Nutrición no está disponible con tu acceso actual.</p> : null}
      {primera && entradas.length === 0 ? (
        <EstadoVacio titulo={soloSinPorciones ? 'Todas las comidas del período registraron las porciones del plan' : 'Sin comidas registradas en el período'}>
          {soloSinPorciones ? 'No hay cantidades informadas, sin confirmar ni comidas diferentes en estas fechas.' : 'Sin registros no hay qué contrastar.'}
        </EstadoVacio>
      ) : null}
      {entradas.length > 0 ? (
        <div className="desplazable-x">
          <table className="tabla tabla-del-contraste">
            <caption className="visualmente-oculto">Comidas registradas frente a su opción del plan</caption>
            <thead>
              <tr>
                <th scope="col">Día</th>
                <th scope="col">Comida</th>
                <th scope="col">Lo registrado</th>
                <th scope="col">Cantidades</th>
                <th scope="col">Versión del plan</th>
                <th scope="col">
                  <span className="visualmente-oculto">Detalle</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((e, i) => (
                <FilaDeComida key={e.timelineEntryId} e={e} primeraDelDia={i === 0 || entradas[i - 1]?.occurredDate !== e.occurredDate} onAbrir={() => setAbierto({ origen: e.source, titulo: `${e.title} · ${diaCivil(e.occurredDate)}` })} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {cursor && entradas.length > 0 ? (
        <p>
          <button type="button" className="boton boton--secundario" onClick={() => void verMas()} disabled={extras.cargando}>
            {extras.cargando ? 'Cargando…' : `Ver más (${total - entradas.length} restantes)`}
          </button>
          {extras.falla ? <span className="campo__error"> No pudimos traer más: probá de nuevo.</span> : null}
        </p>
      ) : null}
      <Ayuda titulo="Qué es lo indicado">
        <p>Lo indicado es la opción que la persona eligió, tal como estaba en la versión del plan con la que registró. Las otras opciones de esa comida no se suman.</p>
        <p>Una comida con las cantidades sin confirmar sigue sin confirmar: no se completa con las porciones del plan. Una comida diferente queda fuera de lo indicado.</p>
      </Ayuda>
      <PanelDeRegistro origen={abierto?.origen ?? null} titulo={abierto?.titulo ?? ''} onCerrar={() => setAbierto(null)} />
    </section>
  );
}

function FilaDeComida({ e, primeraDelDia, onAbrir }: { e: EntradaDeLineaDeTiempo; primeraDelDia: boolean; onAbrir: () => void }) {
  const dato = (etiqueta: string) => e.details.find((x) => x.label === etiqueta)?.value ?? null;
  const diferente = e.quality.includes('DIFFERENT_MEAL');
  // «Comida registrada · Desayuno» → «Desayuno»: el tipo de hecho ya lo dice la columna «Lo registrado».
  const [, ...nombre] = e.title.split(' · ');
  const estado = ESTADO_DE_LA_COMIDA[e.state];
  return (
    <tr className={e.state === 'ANNULLED' ? 'tabla-del-contraste__anulada' : undefined}>
      <th scope="row">
        {/* La fecha se repite para el lector de pantalla; a la vista, solo en la primera comida del día. */}
        <span className={primeraDelDia ? undefined : 'visualmente-oculto'}>{diaCivil(e.occurredDate)}</span>
      </th>
      <td>
        {nombre.join(' · ') || e.title}
        {estado ? <span className="insignia"> {estado}</span> : null}
      </td>
      <td>{diferente ? 'Una comida diferente: fuera de lo indicado' : dato('Opción') ? `Opción ${dato('Opción')}` : 'Opción del plan'}</td>
      <td>{diferente ? (dato('Cantidad aproximada') ? `aproximada: ${dato('Cantidad aproximada')}` : 'no aplica (comida diferente)') : (dato('Cantidades') ?? 'sin dato')}</td>
      <td>{dato('Plan') ?? 'sin dato'}</td>
      <td>
        <button type="button" className="boton boton--enlace" onClick={onAbrir}>
          Ver lo indicado y lo registrado<span className="visualmente-oculto">: {e.title}, {diaCivil(e.occurredDate)}</span>
        </button>
      </td>
    </tr>
  );
}

