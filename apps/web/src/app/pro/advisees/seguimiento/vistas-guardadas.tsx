'use client';

/**
 * Vistas guardadas (API-VAN-01 a 04; DL-128): la configuración del análisis —métricas por identificador, modo, grano,
 * período y capas—, por cuenta y en la API. Nunca datos de salud: al abrir una vista, los datos se vuelven a pedir y el
 * PDP decide de nuevo (una vista no concede acceso). Una vista no se ata a un asesorado: se aplica al que se está viendo,
 * y si una métrica no tiene datos con este asesorado, lo dice su serie.
 */
import { type ConfiguracionDeAnalisis, type VistaDeAnalisis } from '@be/domain';
import { useCallback, useEffect, useId, useState } from 'react';
import { api, nuevaClaveDeIdempotencia } from '../../../../lib/api';
import { useSeguimiento } from './contexto';
import { parametrosDeAnalisis, parametrosDePeriodo, PRESETS_DE_PERIODO, type EstadoDeAnalisis } from './estado';

function configuracionDe(estado: EstadoDeAnalisis, periodo: { preset: number | null; desde: string; hasta: string }): ConfiguracionDeAnalisis | null {
  if (estado.metricas.length === 0) return null;
  const preset = PRESETS_DE_PERIODO.find((p) => p.dias === periodo.preset)?.dias;
  return {
    schemaVersion: 1,
    metrics: [...estado.metricas],
    mode: estado.modo,
    grain: estado.grano,
    period: preset ? { kind: 'LAST_DAYS', days: preset } : { kind: 'RANGE', start: periodo.desde, end: periodo.hasta },
    layers: { planBands: estado.bandas, events: estado.eventos },
    referenceDays: estado.diasDeReferencia,
    comparison: estado.comparacion ? { a: { start: estado.comparacion.a.desde, end: estado.comparacion.a.hasta }, b: { start: estado.comparacion.b.desde, end: estado.comparacion.b.hasta } } : null,
  };
}

export function VistasGuardadas({ estado }: { estado: EstadoDeAnalisis }) {
  const { token, periodo, ir, sesionPerdida } = useSeguimiento();
  const id = useId();
  const [vistas, setVistas] = useState<readonly VistaDeAnalisis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const configuracion = configuracionDe(estado, periodo);

  const cargar = useCallback(async () => {
    const r = await api.listarVistasDeAnalisis(token);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError('No pudimos leer tus vistas guardadas.');
    setError(null);
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
          diasDeReferencia: c.referenceDays,
          fecha: null,
          comparacion: c.comparison ? { a: { desde: c.comparison.a.start, hasta: c.comparison.a.end }, b: { desde: c.comparison.b.start, hasta: c.comparison.b.end } } : null,
        }),
      },
      { agregarAlHistorial: true },
    );
    setAviso(`Abierta: «${v.name}». Los datos se pidieron de nuevo con tu acceso actual.`);
  };
  const actualizar = async (v: VistaDeAnalisis) => {
    if (!configuracion) return;
    setOcupado(true);
    const r = await api.reemplazarVistaDeAnalisis(token, v.viewId, { expectedVersion: v.version, name: v.name, configuration: configuracion });
    setOcupado(false);
    if (sesionPerdida(r)) return;
    if (!r.ok) return setError(r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT' ? 'La vista cambió en otra pestaña: se volvió a cargar la lista.' : 'No pudimos actualizar la vista.');
    setAviso(`Actualizada: «${v.name}».`);
    void cargar();
  };
  const borrar = async (v: VistaDeAnalisis) => {
    setOcupado(true);
    const r = await api.borrarVistaDeAnalisis(token, v.viewId, nuevaClaveDeIdempotencia());
    setOcupado(false);
    if (sesionPerdida(r)) return;
    if (!r.ok && !(r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND')) return setError('No pudimos borrar la vista.');
    setAviso(`Borrada: «${v.name}».`);
    void cargar();
  };

  return (
    <details className="vistas-guardadas">
      <summary>Vistas guardadas{vistas ? ` (${vistas.length})` : ''}</summary>
      <p className="nota">Se guarda la configuración (métricas, modo, período y capas), nunca los datos. Sirve para cualquier asesorado.</p>
      <div className="campo">
        <label htmlFor={`${id}-nombre`}>Nombre de la vista</label>
        <input id={`${id}-nombre`} value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} placeholder="Por ejemplo: Peso y alimentación" />
      </div>
      <button type="button" className="boton boton--secundario" disabled={!configuracion || !nombre.trim() || ocupado} onClick={() => void guardar()}>
        Guardar esta vista
      </button>
      {!configuracion ? <p className="nota">Elegí al menos una métrica para guardar una vista.</p> : null}
      {error ? (
        <p className="campo__error" role="alert">
          {error}
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
              <span className="nota"> · {v.usage === 'ANALYSIS' ? `${v.configuration.metrics.length} ${v.configuration.metrics.length === 1 ? 'métrica' : 'métricas'}` : ''}</span>
              <div className="acciones">
                <button type="button" className="boton boton--enlace" onClick={() => abrir(v)}>
                  Abrir<span className="visualmente-oculto"> {v.name}</span>
                </button>
                <button type="button" className="boton boton--enlace" disabled={!configuracion || ocupado} onClick={() => void actualizar(v)}>
                  Guardar lo actual acá<span className="visualmente-oculto"> ({v.name})</span>
                </button>
                <button type="button" className="boton boton--enlace" disabled={ocupado} onClick={() => void borrar(v)}>
                  Borrar<span className="visualmente-oculto"> {v.name}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : vistas ? (
        <p className="nota">Todavía no guardaste vistas.</p>
      ) : null}
    </details>
  );
}
