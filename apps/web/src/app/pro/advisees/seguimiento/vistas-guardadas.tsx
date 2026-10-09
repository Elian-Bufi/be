'use client';

/**
 * Vistas guardadas (API-VAN-01 a 04; DL-128): la configuración del análisis —métricas por identificador, modo, grano,
 * período y capas—, por cuenta y en la API. Nunca datos de salud: al abrir una vista, los datos se vuelven a pedir y el
 * PDP decide de nuevo (una vista no concede acceso). Una vista no se ata a un asesorado: se aplica al que se está viendo,
 * y si una métrica no tiene datos con este asesorado, lo dice su serie.
 *
 * WP-DASHBOARD-COMPRENSION: la vista guarda también la pregunta y sus datos (solo identificadores). La versión del plan,
 * las etapas y el ejercicio son selecciones de un asesorado: al guardar se avisa, y al abrir la vista en otro asesorado
 * la pregunta dice que no aplican y las pide de nuevo; nunca las reemplaza por otras.
 */
import { numero, preguntaProfesional, traeSeleccionesDelAsesorado, type ConfiguracionDeAnalisis, type PreguntaElegida, type ReferenciaDelCambio, type VistaDeAnalisis } from '@be/domain';
import { useCallback, useEffect, useId, useState } from 'react';
import { api, nuevaClaveDeIdempotencia } from '../../../../lib/api';
import { diaCivil } from '../../../../lib/formato';
import { motivoDeFalla, textoDeFalla, useSeguimiento, type MotivoDeFalla } from './contexto';
import { parametrosDeAnalisis, parametrosDePeriodo, parametrosDePregunta, PRESETS_DE_PERIODO, type EstadoDeAnalisis } from './estado';

function configuracionDe(estado: EstadoDeAnalisis, periodo: { preset: number | null; desde: string; hasta: string }, pregunta: PreguntaElegida | null): ConfiguracionDeAnalisis | null {
  if (estado.metricas.length === 0) return null;
  const preset = PRESETS_DE_PERIODO.find((p) => p.dias === periodo.preset)?.dias;
  return {
    schemaVersion: 1,
    ...(pregunta ? { question: pregunta } : {}),
    metrics: [...estado.metricas],
    mode: estado.modo,
    grain: estado.grano,
    period: preset ? { kind: 'LAST_DAYS', days: preset } : { kind: 'RANGE', start: periodo.desde, end: periodo.hasta },
    layers: { planBands: estado.bandas, events: estado.eventos },
    reference: estado.referencia,
    comparison: estado.comparacion ? { a: { start: estado.comparacion.a.desde, end: estado.comparacion.a.hasta }, b: { start: estado.comparacion.b.desde, end: estado.comparacion.b.hasta } } : null,
  };
}

/** La referencia del cambio relativo que guarda una vista, en pocas palabras: es parte de la configuración. */
const referenciaGuardada = (r: ReferenciaDelCambio): string =>
  r.kind === 'FIRST_DAYS' ? `referencia: los primeros ${numero(r.days)} días` : `referencia: del ${diaCivil(r.start)} al ${diaCivil(r.end)}`;

/**
 * Lo que sobrevive a que el panel cambie de lugar: abrir una vista desde el comienzo de Analizar arma el análisis y el
 * panel pasa a la columna de opciones (otro componente). Sin esto, aparecía plegado y sin el aviso «Abierta: …». Solo
 * para esa transición, y se consume una vez: no es una preferencia que siga a la persona por otras fichas.
 */
const recuerdo: { abierto: boolean; aviso: string | null } = { abierto: false, aviso: null };

/**
 * `soloAbrir`: al comienzo de Analizar (sin métricas ni pregunta) no hay nada que guardar: se listan las vistas para
 * retomarlas, sin el formulario de guardar ni «Guardar lo actual acá».
 */
export function VistasGuardadas({ estado, pregunta, soloAbrir = false }: { estado: EstadoDeAnalisis; pregunta: PreguntaElegida | null; soloAbrir?: boolean }) {
  const { token, periodo, ir, sesionPerdida } = useSeguimiento();
  const id = useId();
  const [vistas, setVistas] = useState<readonly VistaDeAnalisis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(recuerdo.aviso);
  const [abierto, setAbierto] = useState(recuerdo.abierto);
  // Lo que traía el panel anterior se usa una vez.
  useEffect(() => {
    recuerdo.aviso = null;
    recuerdo.abierto = false;
  }, []);
  // Borrar no se deshace: primero se pide confirmar, en el mismo lugar.
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const [sinLista, setSinLista] = useState<MotivoDeFalla | null>(null);
  const configuracion = configuracionDe(estado, periodo, pregunta);

  const cargar = useCallback(async () => {
    const r = await api.listarVistasDeAnalisis(token);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setSinLista(motivoDeFalla(r));
    setSinLista(null);
    setVistas(r.datos.data.filter((v) => v.usage === 'ANALYSIS'));
  }, [token, sesionPerdida]);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async () => {
    if (!configuracion || !nombre.trim()) return;
    setOcupado(true);
    const r = await api.crearVistaDeAnalisis(token, { usage: 'ANALYSIS', name: nombre.trim(), configuration: configuracion }, nuevaClaveDeIdempotencia());
    setOcupado(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'VALIDATION_FAILED' ? 'No se pudo guardar: llegaste al máximo de vistas o la configuración no es válida.' : 'No pudimos guardar la vista. Probá de nuevo.');
    setError(null);
    setNombre('');
    setAviso(`Guardada: «${r.datos.data.name}».`);
    void cargar();
  };
  const abrir = (v: VistaDeAnalisis) => {
    if (v.usage !== 'ANALYSIS') return;
    const c = v.configuration;
    ir(
      {
        ...(c.period.kind === 'LAST_DAYS' ? parametrosDePeriodo({ preset: c.period.days, desde: '', hasta: '' }) : parametrosDePeriodo({ preset: null, desde: c.period.start, hasta: c.period.end })),
        ...parametrosDeAnalisis({
          metricas: c.metrics,
          modo: c.mode,
          grano: c.grain,
          bandas: c.layers.planBands,
          eventos: c.layers.events,
          referencia: c.reference,
          fecha: null,
          comparacion: c.comparison ? { a: { desde: c.comparison.a.start, hasta: c.comparison.a.end }, b: { desde: c.comparison.b.start, hasta: c.comparison.b.end } } : null,
        }),
        ...parametrosDePregunta(c.question ?? null),
      },
      { agregarAlHistorial: true },
    );
    const texto = `Abierta: «${v.name}». Los datos se pidieron de nuevo con tu acceso actual.`;
    setAviso(texto);
    // Si el panel se va a otro lugar (desde el comienzo de Analizar), el nuevo lo muestra abierto y con el aviso.
    if (soloAbrir) {
      recuerdo.abierto = true;
      recuerdo.aviso = texto;
    }
  };
  const actualizar = async (v: VistaDeAnalisis) => {
    if (!configuracion) return;
    setOcupado(true);
    const r = await api.reemplazarVistaDeAnalisis(token, v.viewId, { expectedVersion: v.version, name: v.name, configuration: configuracion });
    setOcupado(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) {
      if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') {
        setError('La vista cambió en otra pestaña: se volvió a cargar la lista. Revisala y guardá de nuevo si hace falta.');
        void cargar();
      } else setError('No pudimos actualizar la vista.');
      return;
    }
    setError(null);
    setAviso(`Actualizada: «${v.name}».`);
    void cargar();
  };
  const borrar = async (v: VistaDeAnalisis) => {
    setPorBorrar(null);
    setOcupado(true);
    const r = await api.borrarVistaDeAnalisis(token, v.viewId, nuevaClaveDeIdempotencia());
    setOcupado(false);
    if (sesionPerdida(r)) return;
    if (!r.ok && !(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND')) return setError('No pudimos borrar la vista.');
    setError(null);
    setAviso(`Borrada: «${v.name}».`);
    void cargar();
  };

  return (
    <details
      className="vistas-guardadas"
      open={abierto}
      onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}
    >
      <summary>Vistas guardadas{vistas ? ` (${vistas.length})` : ''}</summary>
      <p className="nota">Se guarda la configuración (la pregunta, las métricas, el modo, el período, las capas y la referencia del cambio relativo), nunca los datos. Sirve para cualquier asesorado.</p>
      {pregunta && traeSeleccionesDelAsesorado(pregunta.params) ? (
        <p className="nota">Esta vista lleva selecciones de este asesorado (la versión del plan, las etapas o el ejercicio): en otro asesorado se te van a pedir de nuevo.</p>
      ) : null}
      {soloAbrir ? null : (
        <>
          <div className="campo">
            <label htmlFor={`${id}-nombre`}>Nombre de la vista</label>
            <input id={`${id}-nombre`} value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} placeholder="Por ejemplo: Peso y alimentación" />
          </div>
          <button type="button" className="boton boton--secundario" disabled={!configuracion || !nombre.trim() || ocupado} onClick={() => void guardar()}>
            Guardar esta vista
          </button>
          {!configuracion ? <p className="nota">Elegí al menos una métrica para guardar una vista.</p> : null}
        </>
      )}
      {error ? (
        <p className="campo__error" role="alert">
          {error}
        </p>
      ) : null}
      {sinLista ? (
        <p className="campo__error">
          {textoDeFalla(sinLista, 'tus vistas guardadas')}{' '}
          <button type="button" className="boton boton--enlace" onClick={() => void cargar()}>
            Reintentar
          </button>
        </p>
      ) : null}
      {aviso ? (
        <p className="nota" role="status">
          {aviso}
        </p>
      ) : null}
      {vistas && vistas.length > 0 ? (
        <ul className="lista-de-vistas">
          {vistas.map((v) => (
            <li key={v.viewId}>
              <strong>{v.name}</strong>
              <span className="nota">
                {' '}
                · {v.usage === 'ANALYSIS' ? `${v.configuration.question ? `${preguntaProfesional(v.configuration.question.id).pregunta} · ` : ''}${v.configuration.metrics.length} ${v.configuration.metrics.length === 1 ? 'métrica' : 'métricas'} · ${referenciaGuardada(v.configuration.reference)}` : ''}
              </span>
              <div className="acciones">
                <button type="button" className="boton boton--enlace" onClick={() => abrir(v)}>
                  Abrir<span className="visualmente-oculto"> {v.name}</span>
                </button>
                {soloAbrir ? null : (
                  <button type="button" className="boton boton--enlace" disabled={!configuracion || ocupado} onClick={() => void actualizar(v)}>
                    Guardar lo actual acá<span className="visualmente-oculto"> ({v.name})</span>
                  </button>
                )}
                {porBorrar === v.viewId ? null : (
                  <button type="button" className="boton boton--enlace" disabled={ocupado} onClick={() => setPorBorrar(v.viewId)}>
                    Borrar<span className="visualmente-oculto"> {v.name}</span>
                  </button>
                )}
              </div>
              {porBorrar === v.viewId ? (
                <div className="acciones" role="group" aria-label={`Confirmar el borrado de ${v.name}`}>
                  <span>¿Borrar «{v.name}»? No se puede deshacer.</span>
                  <button type="button" className="boton boton--secundario" disabled={ocupado} onClick={() => void borrar(v)}>
                    Sí, borrar
                  </button>
                  <button type="button" className="boton boton--enlace" onClick={() => setPorBorrar(null)}>
                    Cancelar
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : vistas ? (
        <p className="nota">Todavía no guardaste vistas.</p>
      ) : null}
    </details>
  );
}
