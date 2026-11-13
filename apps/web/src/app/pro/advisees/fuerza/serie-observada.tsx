'use client';

/**
 * ED-72 · «Registrar una serie observada» (WP-EDITORES-PROFESIONAL §5.8; V3 F-03; maqueta 17). Una serie que el
 * profesional vio hacer: la fecha, la carga con su unidad, las repeticiones, el RIR observado (obligatorio, de 0 a 2) y
 * una nota. La estimación se ve en vivo; una observación que no se puede estimar no se guarda, y el cuadro dice por qué
 * (ED-D19). Se guarda con API-FZA-01, con la fecha, el autor y el método, y no se edita: se sucede (API-FZA-03).
 *
 * Debajo del RIR, la regla en una línea (Dirección, 12/11: «aclarémoselo a los profesionales nomás»). La persona no ve
 * nada de esto.
 *
 * El formulario vive en quien abre el cuadro (`useSerieObservada`): el principal del cuadro es «Guardar la serie
 * observada», y el cuadro dibuja su pie.
 */
import { COPY_FUERZA, estimacionALaVista, laCuentaDeLaEstimacion, rotuloDeLaEstimacion } from '@be/domain';
import { useId, useState } from 'react';
import { Icono } from '../../../../components/icono';
import { api, nuevaClaveDeIdempotencia, type Resultado } from '../../../../lib/api';
import { mensajeDeFallo } from '../../../../lib/intento';
import { esLaFechaFutura, RIR_DEL_CUADRO, RIR_MAS_DE_2, serieObservadaEnVivo, type SerieObservadaEnVivo } from './fuerza';

export const COPY_SERIE_OBSERVADA = {
  titulo: 'Registrar una serie observada',
  queEs: (persona: string) => `Una serie que viste hacer a ${persona}. BE la guarda con la fecha, tu nombre y el método.`,
  fecha: 'Fecha',
  carga: 'Carga',
  repeticiones: 'Repeticiones',
  rir: 'RIR observado',
  masDe2: 'Más de 2',
  nota: 'Nota',
  notaOpcional: 'Opcional',
  enVivo: 'La estimación, mientras escribís',
  cuandoNo: 'Con más de 12 repeticiones equivalentes, o con un RIR mayor que 2, no se estima: el cuadro lo dice y no guarda nada.',
  noSeEdita: 'No se edita: si hay un error, registrás otra que la reemplaza, con su motivo.',
  noLaVe: (persona: string) => `${persona} no la ve.`,
  guardar: 'Guardar la serie observada',
  guardando: 'Guardando…',
  fechaFutura: 'La fecha no puede ser posterior a hoy.',
  guardada: 'Se guardó la serie observada.',
} as const;

export interface FormularioDeSerieObservada {
  readonly fecha: string;
  readonly carga: string;
  readonly unidad: 'kg' | 'lb';
  readonly repeticiones: string;
  readonly rir: number | null;
  readonly nota: string;
}

/** El formulario y el envío: el cuadro pone el principal con `guardar` y su estado. */
export function useSerieObservada(o: { token: string; asesoradoId: string; exerciseId: string; hoy: string; zona: string; unidad: 'kg' | 'lb'; sesionPerdida: (r: Resultado<unknown>) => boolean; alGuardar: () => void }) {
  const vacio: FormularioDeSerieObservada = { fecha: o.hoy, carga: '', unidad: o.unidad, repeticiones: '', rir: null, nota: '' };
  const [f, setF] = useState<FormularioDeSerieObservada>(vacio);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  // Una sola clave por intento: reintentar el mismo envío no duplica la observación.
  const [clave, setClave] = useState(nuevaClaveDeIdempotencia);
  const enVivo = serieObservadaEnVivo({ exerciseId: o.exerciseId, fecha: f.fecha, carga: f.carga, unidad: f.unidad, repeticiones: f.repeticiones, rir: f.rir });
  const futura = f.fecha > o.hoy;
  const cambiar = (c: Partial<FormularioDeSerieObservada>) => {
    setF((x) => ({ ...x, ...c }));
    setFalla(null);
    setClave(nuevaClaveDeIdempotencia());
  };
  const apagado = futura ? COPY_SERIE_OBSERVADA.fechaFutura : enVivo.tipo === 'estima' ? null : enVivo.texto;
  const guardar = async () => {
    if (apagado || enVivo.tipo !== 'estima') return;
    setEnviando(true);
    const r = await api.registrarSerieObservada(
      o.token,
      o.asesoradoId,
      {
        exerciseId: o.exerciseId,
        localDate: f.fecha,
        timeZone: o.zona,
        load: { value: enVivo.carga, unit: f.unidad },
        completedRepetitions: enVivo.repeticiones,
        rir: enVivo.rir,
        note: f.nota.trim() ? f.nota.trim() : null,
      },
      clave,
    );
    setEnviando(false);
    if (o.sesionPerdida(r)) return;
    if (!r.ok) return setFalla(esLaFechaFutura(r) ? COPY_SERIE_OBSERVADA.fechaFutura : mensajeDeFallo(r));
    setF(vacio);
    setClave(nuevaClaveDeIdempotencia());
    o.alGuardar();
  };
  const conCambios = f.carga !== '' || f.repeticiones !== '' || f.rir !== null || f.nota !== '';
  return { f, cambiar, enVivo, apagado, enviando, falla, guardar, conCambios, reiniciar: () => setF(vacio) };
}

export function SerieObservada({ persona, hoy, formulario: x }: { persona: string; hoy: string; formulario: ReturnType<typeof useSerieObservada> }) {
  const id = useId();
  const C = COPY_SERIE_OBSERVADA;
  const { f, cambiar, enVivo, falla } = x;
  return (
    <div className="serie-observada" data-serie-observada>
      <p>{C.queEs(persona)}</p>
      <div className="serie-observada__campos">
        <label htmlFor={`${id}-fecha`}>{C.fecha}</label>
        <input id={`${id}-fecha`} type="date" max={hoy} value={f.fecha} onChange={(e) => cambiar({ fecha: e.target.value })} required />

        <label htmlFor={`${id}-carga`}>{C.carga}</label>
        <span className="serie-observada__par">
          <input id={`${id}-carga`} inputMode="decimal" autoComplete="off" className="serie-observada__numero" value={f.carga} onChange={(e) => cambiar({ carga: e.target.value })} />
          <select aria-label="Unidad de la carga" value={f.unidad} onChange={(e) => cambiar({ unidad: e.target.value as 'kg' | 'lb' })}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </span>

        <label htmlFor={`${id}-reps`}>{C.repeticiones}</label>
        <input id={`${id}-reps`} inputMode="numeric" autoComplete="off" className="serie-observada__numero" value={f.repeticiones} onChange={(e) => cambiar({ repeticiones: e.target.value })} />

        <span className="serie-observada__rotulo" aria-hidden="true">
          {C.rir}
        </span>
        <div className="serie-observada__rir">
          {/* De 0 a 2, de a medio (maqueta 17). «Más de 2» existe para que el cuadro lo diga: no se guarda (ED-D19). */}
          <fieldset className="segmentos" aria-describedby={`${id}-regla`}>
            <legend className="visualmente-oculto">{C.rir}</legend>
            <div className="segmentos__fila">
              {[...RIR_DEL_CUADRO, RIR_MAS_DE_2].map((r) => (
                <label key={r} className="segmento" data-rir={r}>
                  <input type="radio" name={`${id}-rir`} checked={f.rir === r} onChange={() => cambiar({ rir: r })} />
                  {r === RIR_MAS_DE_2 ? C.masDe2 : String(r).replace('.', ',')}
                </label>
              ))}
            </div>
          </fieldset>
          <span className="nota">{COPY_FUERZA.campoDelRir}</span>
          <p id={`${id}-regla`} className="nota serie-observada__regla" data-regla-del-rir>
            {COPY_FUERZA.reglaDelRir}
          </p>
        </div>

        <label htmlFor={`${id}-nota`}>
          {C.nota} <span className="nota">{C.notaOpcional}</span>
        </label>
        <input id={`${id}-nota`} maxLength={500} value={f.nota} onChange={(e) => cambiar({ nota: e.target.value })} />
      </div>
      <EnVivo enVivo={enVivo} />
      <ul className="serie-observada__reglas">
        <li>
          <Icono nombre="info" tamano={18} />
          {C.cuandoNo}
        </li>
        <li>
          <Icono nombre="candado" tamano={18} />
          {C.noSeEdita}
        </li>
        <li>
          <Icono nombre="oculto" tamano={18} />
          {C.noLaVe(persona)}
        </li>
      </ul>
      {falla ? (
        <p className="campo__error" role="alert">
          {falla}
        </p>
      ) : null}
    </div>
  );
}

function EnVivo({ enVivo }: { enVivo: SerieObservadaEnVivo }) {
  return (
    <div className="serie-observada__en-vivo" aria-live="polite" data-en-vivo={enVivo.tipo}>
      <p className="tarjeta-de-fuerza__titulo">
        <Icono nombre="estimado" tamano={18} />
        <strong>{COPY_SERIE_OBSERVADA.enVivo}</strong>
      </p>
      {enVivo.tipo === 'estima' ? (
        <>
          <p className="tarjeta-de-fuerza__valor">
            <span className="tarjeta-de-fuerza__numero">{estimacionALaVista(enVivo.estimacion)}</span>
            <span className="nota">{rotuloDeLaEstimacion(enVivo.estimacion.banda)}</span>
          </p>
          <p>{laCuentaDeLaEstimacion(enVivo.estimacion)}</p>
        </>
      ) : (
        <p data-motivo>{enVivo.texto}</p>
      )}
    </div>
  );
}
