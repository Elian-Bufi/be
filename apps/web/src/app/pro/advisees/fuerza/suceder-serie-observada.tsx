'use client';

/**
 * ED-72 · Corregir o anular una serie observada desde el website (WP-EDITORES-PROFESIONAL §5.8; API-FZA-03; EDT-57). La
 * observación no se edita: la corrección es una observación nueva que la sucede, y la anulación la saca de la estimación.
 * Las dos piden un motivo y quedan en la historia; la anterior no cambia.
 *
 * Se abre desde «Cómo se calculó» de un punto observado, en el mismo cuadro y con «Atrás» (ED-10), y solo para quien la
 * observó: a los demás, la API no les revela que existe. Antes de mostrar el formulario se lee la observación vigente
 * (API-FZA-02), por su versión: si otra ya la sucedió, el cuadro lo dice y no envía nada; si la sucede alguien mientras
 * el cuadro está abierto, la API responde 409 y tampoco se pisa nada.
 *
 * El formulario vive en quien abre el cuadro (`useSucesion`), como el de la serie observada: el principal va en su pie.
 */
import { useEffect, useId, useState } from 'react';
import { api, nuevaClaveDeIdempotencia, type Resultado } from '../../../../lib/api';
import { mensajeDeFallo } from '../../../../lib/intento';
import { COPY_SUCESION, cuerpoDeLaSucesion, esLaFechaFutura, formularioDeLaObservacion, laSucedioOtro, serieObservadaEnVivo, type AccionDeLaSucesion, type FormularioDeLaObservacion, type ObservacionGuardada } from './fuerza';
import { CamposDeLaSerie, EnVivo } from './serie-observada';

type Lectura = { readonly tipo: 'nada' } | { readonly tipo: 'leyendo' } | { readonly tipo: 'no-esta' } | { readonly tipo: 'error'; readonly texto: string } | { readonly tipo: 'lista'; readonly obs: ObservacionGuardada };

export function useSucesion(o: {
  token: string;
  asesoradoId: string;
  exerciseId: string;
  /** La observación a suceder; `null` mientras el cuadro no está en este paso. */
  observationId: string | null;
  hoy: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  alGuardar: (accion: AccionDeLaSucesion) => void;
}) {
  const [lectura, setLectura] = useState<Lectura>({ tipo: 'nada' });
  const [accion, setAccion] = useState<AccionDeLaSucesion>('corregir');
  const [motivo, setMotivo] = useState('');
  const [f, setF] = useState<FormularioDeLaObservacion | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  // Una sola clave por intento: reintentar el mismo envío no duplica la sucesión.
  const [clave, setClave] = useState(nuevaClaveDeIdempotencia);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    if (!o.observationId) return setLectura({ tipo: 'nada' });
    let vigente = true;
    setLectura({ tipo: 'leyendo' });
    void api.listarSeriesObservadas(o.token, o.asesoradoId, { exerciseId: o.exerciseId }).then((r) => {
      if (!vigente || o.sesionPerdida(r)) return;
      if (!r.ok) return setLectura({ tipo: 'error', texto: mensajeDeFallo(r) });
      // API-FZA-02 trae solo las vigentes: si no está, otra la sucedió (o la anuló).
      const obs = r.datos.data.find((x) => x.observationId === o.observationId);
      if (!obs) return setLectura({ tipo: 'no-esta' });
      setLectura({ tipo: 'lista', obs });
      setF(formularioDeLaObservacion(obs));
      setAccion('corregir');
      setMotivo('');
      setFalla(null);
      setClave(nuevaClaveDeIdempotencia());
    });
    return () => {
      vigente = false;
    };
    // `sesionPerdida` cambia de identidad en cada render de quien lo pasa: se lee al responder, no decide cuándo leer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.observationId, o.token, o.asesoradoId, o.exerciseId, vuelta]);

  const obs = lectura.tipo === 'lista' ? lectura.obs : null;
  const enVivo = f ? serieObservadaEnVivo({ exerciseId: o.exerciseId, fecha: f.fecha, carga: f.carga, unidad: f.unidad, repeticiones: f.repeticiones, rir: f.rir }) : null;
  const pedido = obs && f && enVivo ? cuerpoDeLaSucesion(accion, motivo, obs, f, enVivo, o.hoy) : null;
  const tocar = () => {
    setFalla(null);
    setClave(nuevaClaveDeIdempotencia());
  };
  const enviar = async () => {
    if (!obs || !pedido?.ok) return;
    setEnviando(true);
    const r = await api.sucederSerieObservada(o.token, obs.observationId, pedido.cuerpo, clave);
    setEnviando(false);
    if (o.sesionPerdida(r)) return;
    if (!r.ok) return setFalla(laSucedioOtro(r) ? COPY_SUCESION.laSucedioOtro : esLaFechaFutura(r) ? COPY_SUCESION.fechaFutura : mensajeDeFallo(r));
    o.alGuardar(accion);
  };
  const conCambios = !!obs && (motivo.trim() !== '' || (accion === 'corregir' && !!f && JSON.stringify(f) !== JSON.stringify(formularioDeLaObservacion(obs))));
  return {
    lectura,
    accion,
    elegirAccion: (a: AccionDeLaSucesion) => {
      setAccion(a);
      tocar();
    },
    motivo,
    escribirMotivo: (t: string) => {
      setMotivo(t);
      tocar();
    },
    f,
    cambiar: (c: Partial<FormularioDeLaObservacion>) => {
      setF((x) => (x ? { ...x, ...c } : x));
      tocar();
    },
    enVivo,
    // El motivo del principal apagado sigue a la lectura: una que ya no está o que falló no se anuncia como «Leyendo…».
    apagado:
      lectura.tipo === 'no-esta' ? COPY_SUCESION.noEsta : lectura.tipo === 'error' ? lectura.texto : lectura.tipo !== 'lista' ? COPY_SUCESION.leyendo : pedido && !pedido.ok ? pedido.falta : null,
    enviando,
    falla,
    enviar,
    conCambios,
    releer: () => setVuelta((n) => n + 1),
  };
}

export function SucederSerieObservada({ hoy, estado: x }: { hoy: string; estado: ReturnType<typeof useSucesion> }) {
  const id = useId();
  const C = COPY_SUCESION;
  if (x.lectura.tipo === 'leyendo' || x.lectura.tipo === 'nada') {
    return (
      <p className="cargando" role="status">
        {C.leyendo}
      </p>
    );
  }
  if (x.lectura.tipo === 'no-esta') {
    return (
      <p role="status" data-sucesion-no-esta>
        {C.noEsta}
      </p>
    );
  }
  if (x.lectura.tipo === 'error') {
    return (
      <div className="campo__error" role="alert">
        <p>{x.lectura.texto}</p>
        <button type="button" className="boton boton--secundario" onClick={x.releer}>
          Reintentar
        </button>
      </div>
    );
  }
  return (
    <div className="serie-observada" data-suceder-serie-observada>
      <p>{C.queEs}</p>
      <fieldset className="segmentos">
        <legend>{C.accion}</legend>
        <div className="segmentos__fila">
          {(['corregir', 'anular'] as const).map((a) => (
            <label key={a} className="segmento" data-accion={a}>
              <input type="radio" name={`${id}-accion`} checked={x.accion === a} onChange={() => x.elegirAccion(a)} aria-describedby={`${id}-${a}`} />
              {a === 'corregir' ? C.corregir : C.anular}
            </label>
          ))}
        </div>
        <p id={`${id}-${x.accion}`} className="nota">
          {x.accion === 'corregir' ? C.corregirQueEs : C.anularQueEs}
        </p>
        {/* La descripción de la acción que no está elegida también existe, para el lector de pantalla de cada opción. */}
        <p id={`${id}-${x.accion === 'corregir' ? 'anular' : 'corregir'}`} className="visualmente-oculto">
          {x.accion === 'corregir' ? C.anularQueEs : C.corregirQueEs}
        </p>
      </fieldset>
      {x.accion === 'corregir' && x.f ? (
        <>
          <CamposDeLaSerie f={x.f} cambiar={x.cambiar} hoy={hoy} />
          {x.enVivo ? <EnVivo enVivo={x.enVivo} /> : null}
        </>
      ) : null}
      <div className="campo">
        <label htmlFor={`${id}-motivo`}>{C.motivo}</label>
        <p id={`${id}-motivo-ayuda`} className="campo__ayuda">
          {C.motivoAyuda}
        </p>
        <textarea id={`${id}-motivo`} rows={2} maxLength={500} value={x.motivo} aria-describedby={`${id}-motivo-ayuda`} required onChange={(e) => x.escribirMotivo(e.target.value)} />
      </div>
      {x.falla ? (
        <p className="campo__error" role="alert">
          {x.falla}
        </p>
      ) : null}
    </div>
  );
}
