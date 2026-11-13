'use client';

/**
 * ED-76 · Calcular la carga desde la estimación (WP-EDITORES-PROFESIONAL §5.8; maqueta 18). La fuente (c) de Dirección:
 * el profesional elige una estimación (ninguna viene elegida, ED-D20), escribe el % RM y el redondeo (2,5 kg hacia abajo
 * de entrada, ED-D17), y ve la cuenta antes de escribir. El resultado se puede cambiar. Solo con el principal
 * («Escribir 72,5 kg en Press de banca») se escribe en el borrador, que se autoguarda y nunca se activa solo.
 *
 * Lo que se escribe: la carga de la fila general y, si el criterio es % RM, el valor del % RM y la referencia con el método y la
 * fecha, nunca el valor (RM-40), porque el plan viaja a otras áreas (RES-06). Con el criterio RIR, solo la carga.
 * Abierto desde las series elegidas de la planilla (EDT-56), solo la carga propia de esas series: el % RM es de toda la
 * prescripción y no se toca.
 * Nunca convierte entre kg y lb (RM-39).
 *
 * El estado vive en quien abre el cuadro (`useCargaDesdeLaEstimacion`), para que el principal esté en su pie.
 */
import { cargaDesdeLaEstimacion, COPY_FUERZA, estimacionALaVista, leerNumero, PASOS_DEL_REDONDEO, referenciaDeLaEstimacion, SENTIDO_DEL_REDONDEO, type PuntoDeFuerza, type SentidoDelRedondeo } from '@be/domain';
import { useId, useState } from 'react';
import { Enlace } from '../../../../components/enlace';
import { useNombres } from '../../../../lib/nombres-ocultos';
import {
  antiguedad,
  delMasReciente,
  diaDelPunto,
  entradaDelCuadroDeLaCarga,
  estimacionDelPunto,
  lasQueQuedan,
  lasSeriesEnPalabras,
  quienLaEscribio,
  textoDelPrincipalDeLaCarga,
  textoDelPrincipalEnLasSeries,
  type PrescripcionParaLaCarga,
} from './fuerza';

/** Cuántas estimaciones se ofrecen a la vista; las demás, en la evolución. */
const A_LA_VISTA = 4;

export const COPY_CARGA_DESDE_LA_ESTIMACION = {
  titulo: 'Calcular la carga desde la estimación',
  abrir: 'Calcular la carga desde la estimación…',
  abrirEnLasElegidas: 'Calcular la carga de las elegidas…',
  sinSeries: 'Las series elegidas ya no están: cerrá el cuadro y elegí otras.',
  elPorcentajeNoCambia: 'El % RM y su referencia son de toda la prescripción: no cambian, y las demás series siguen como están.',
  nadaSeEscribe: 'Nada se escribe hasta que confirmes.',
  queEstimacion: '1 · ¿Qué estimación usás?',
  ningunaElegida: 'ninguna viene elegida',
  porcentaje: '2 · % RM',
  redondeo: '3 · Redondeo',
  paso: 'Paso del redondeo',
  sentido: 'Sentido del redondeo',
  cargaAEscribir: 'Carga a escribir',
  laPodesCambiar: 'la podés cambiar',
  loQueSeEscribe: 'Lo que se escribe en el borrador',
  verEvolucion: 'Ver evolución',
  comoSeCalculo: 'Cómo se calculó',
  sinEstimaciones: (unidad: string) => `Todavía no hay estimaciones de este ejercicio en ${unidad}. Sin una estimación no hay de dónde calcular la carga.`,
  elegiUna: 'Elegí una estimación.',
  porcentajeInvalido: 'Escribí un % RM mayor que 0 y hasta 100.',
  cargaInvalida: 'Escribí una carga mayor que 0.',
  nuncaAutomatica: 'Una estimación nueva no cambia esta carga, y nada se escribe sin este clic.',
} as const;

export interface CargaElegida {
  readonly punto: PuntoDeFuerza;
  readonly porcentaje: number;
  readonly carga: number;
  readonly unidad: 'kg' | 'lb';
}

/**
 * El estado del cuadro. Vive en quien lo abre, que queda montado mientras se mira la sesión: por eso `reiniciar` vuelve a
 * la entrada (`entradaDelCuadroDeLaCarga`) cada vez que se entra al paso y al cerrar. Ninguna elegida (ED-D20) y el % RM de
 * la prescripción de ese momento, no el de cuando se montó.
 */
export function useCargaDesdeLaEstimacion(prescripcion: PrescripcionParaLaCarga, unidad: 'kg' | 'lb') {
  const entrada = entradaDelCuadroDeLaCarga(prescripcion, unidad);
  const deEntrada = entrada.porcentaje;
  const [elegida, setElegida] = useState<PuntoDeFuerza | null>(entrada.elegida);
  const [porcentaje, setPorcentaje] = useState(entrada.porcentaje);
  const [paso, setPaso] = useState<number>(entrada.paso);
  const [sentido, setSentido] = useState<SentidoDelRedondeo>(entrada.sentido);
  // `null`: la carga a escribir es la sugerida; un texto: la cambió el profesional.
  const [propia, setPropia] = useState<string | null>(entrada.propia);
  const reiniciar = () => {
    setElegida(entrada.elegida);
    setPorcentaje(entrada.porcentaje);
    setPaso(entrada.paso);
    setSentido(entrada.sentido);
    setPropia(entrada.propia);
  };
  const pct = leerNumero(porcentaje);
  const cuenta = elegida && pct !== null ? cargaDesdeLaEstimacion(estimacionDelPunto(elegida, ''), pct, paso, sentido) : null;
  const escrita = propia === null ? (cuenta?.sugerida ?? null) : leerNumero(propia);
  const apagado = !elegida ? COPY_CARGA_DESDE_LA_ESTIMACION.elegiUna : !cuenta ? COPY_CARGA_DESDE_LA_ESTIMACION.porcentajeInvalido : escrita === null || !(escrita > 0) ? COPY_CARGA_DESDE_LA_ESTIMACION.cargaInvalida : null;
  const resultado: CargaElegida | null = !apagado && elegida && cuenta && escrita !== null ? { punto: elegida, porcentaje: pct!, carga: escrita, unidad } : null;
  const conCambios = elegida !== null || porcentaje !== deEntrada || propia !== null;
  return {
    elegida,
    elegir: (p: PuntoDeFuerza) => {
      setElegida(p);
      setPropia(null);
    },
    porcentaje,
    setPorcentaje: (t: string) => {
      setPorcentaje(t);
      setPropia(null);
    },
    paso,
    setPaso: (n: number) => {
      setPaso(n);
      setPropia(null);
    },
    sentido,
    setSentido: (s: SentidoDelRedondeo) => {
      setSentido(s);
      setPropia(null);
    },
    propia,
    setPropia,
    cuenta,
    escrita,
    apagado,
    resultado,
    conCambios,
    unidad,
    reiniciar,
  };
}

export function textoDelPrincipal(x: ReturnType<typeof useCargaDesdeLaEstimacion>, nombre: string, series: readonly number[] | null = null): string {
  if (!x.resultado) return 'Escribir la carga';
  return series ? textoDelPrincipalEnLasSeries(x.resultado.carga, x.unidad, series, nombre) : textoDelPrincipalDeLaCarga(x.resultado.carga, x.unidad, nombre);
}

export function CargaDesdeLaEstimacion({
  puntos,
  hoy,
  criterio,
  haciaLaEvolucion,
  asesoradoId,
  estado: x,
  series = null,
  onComoSeCalculo,
}: {
  /** Las estimaciones del ejercicio en la unidad de la prescripción, con la regla de la tarjeta (`estimacionesParaLaCarga`). */
  puntos: readonly PuntoDeFuerza[];
  hoy: string;
  /** El criterio de la prescripción: con % RM se escriben el valor del % RM y la referencia; si no, solo la carga. */
  criterio: string | null;
  haciaLaEvolucion: string;
  asesoradoId: string;
  estado: ReturnType<typeof useCargaDesdeLaEstimacion>;
  /** Las series elegidas de la planilla (desde 0), si el cuadro escribe en ellas (EDT-56); `null`, en la fila general. */
  series?: readonly number[] | null;
  /** ED-73: «Cómo se calculó» de cada estimación de la lista, en el mismo cuadro y con «Atrás». */
  onComoSeCalculo: (p: PuntoDeFuerza) => void;
}) {
  const id = useId();
  const nombres = useNombres();
  const C = COPY_CARGA_DESDE_LA_ESTIMACION;
  const ordenados = delMasReciente(puntos);
  const aLaVista = ordenados.slice(0, A_LA_VISTA);
  const resto = lasQueQuedan(ordenados.slice(A_LA_VISTA));
  if (ordenados.length === 0) return <p data-sin-estimaciones>{C.sinEstimaciones(x.unidad)}</p>;
  return (
    <div className="carga-desde-la-estimacion" data-carga-desde-la-estimacion>
      <fieldset className="carga-desde-la-estimacion__estimaciones">
        <legend>
          <span>{C.queEstimacion}</span> <span className="nota">{C.ningunaElegida}</span>
        </legend>
        {aLaVista.map((p) => {
          const e = estimacionDelPunto(p, '');
          return (
            <div key={p.pointId} className="opcion-de-estimacion__fila">
              <label className="opcion-de-estimacion" data-elegida={x.elegida?.pointId === p.pointId ? '' : undefined}>
                <input type="radio" name={`${id}-estimacion`} checked={x.elegida?.pointId === p.pointId} onChange={() => x.elegir(p)} />
                <span>
                  <strong>
                    {estimacionALaVista(e)} · {diaDelPunto(p)}
                  </strong>
                  <span className="nota">
                    {' '}
                    {quienLaEscribio(p, nombres.deQuien(p.writtenBy, asesoradoId))} · {COPY_FUERZA.banda[e.banda]} · {antiguedad(p.date, hoy)}
                  </span>
                </span>
              </label>
              <button type="button" className="boton boton--enlace" data-como-se-calculo-de-la-carga onClick={() => onComoSeCalculo(p)}>
                {C.comoSeCalculo}
                <span className="visualmente-oculto"> del {diaDelPunto(p)}</span>
              </button>
            </div>
          );
        })}
        <p className="nota">
          {resto ? `${resto} ` : null}
          <Enlace href={haciaLaEvolucion}>{C.verEvolucion}</Enlace>
        </p>
      </fieldset>
      <div className="carga-desde-la-estimacion__par">
        <div className="campo">
          <label htmlFor={`${id}-pct`}>{C.porcentaje}</label>
          <span className="serie-observada__par">
            <input id={`${id}-pct`} inputMode="decimal" autoComplete="off" className="serie-observada__numero" value={x.porcentaje} onChange={(e) => x.setPorcentaje(e.target.value)} />
            <span>% RM</span>
          </span>
        </div>
        <div className="campo">
          <span className="carga-desde-la-estimacion__rotulo">{C.redondeo}</span>
          <span className="serie-observada__par">
            <select aria-label={C.paso} value={x.paso} onChange={(e) => x.setPaso(Number(e.target.value))}>
              {PASOS_DEL_REDONDEO[x.unidad].map((n) => (
                <option key={n} value={n}>
                  {String(n).replace('.', ',')} {x.unidad}
                </option>
              ))}
            </select>
            <select aria-label={C.sentido} value={x.sentido} onChange={(e) => x.setSentido(e.target.value as SentidoDelRedondeo)}>
              {(Object.keys(SENTIDO_DEL_REDONDEO) as SentidoDelRedondeo[]).map((s) => (
                <option key={s} value={s}>
                  {SENTIDO_DEL_REDONDEO[s]}
                </option>
              ))}
            </select>
          </span>
        </div>
      </div>
      {x.cuenta ? (
        <div className="carga-desde-la-estimacion__cuenta" aria-live="polite" data-cuenta-de-la-carga>
          <p>
            <strong>{x.cuenta.cuenta}</strong>
          </p>
          <p className="nota">{x.cuenta.redondeo}</p>
          <p className="serie-observada__par">
            <label htmlFor={`${id}-carga`}>{C.cargaAEscribir}</label>
            <input id={`${id}-carga`} inputMode="decimal" autoComplete="off" className="serie-observada__numero" value={x.propia ?? String(x.cuenta.sugerida).replace('.', ',')} onChange={(e) => x.setPropia(e.target.value)} />
            <span className="nota">
              {x.unidad} · {C.laPodesCambiar}
            </span>
          </p>
        </div>
      ) : null}
      {x.resultado ? (
        <div className="carga-desde-la-estimacion__escribe" data-lo-que-se-escribe>
          <p>
            <strong>{C.loQueSeEscribe}</strong>
          </p>
          {series ? (
            <>
              <p data-en-las-series>
                La carga propia de {lasSeriesEnPalabras(series)}: <strong>{`${String(x.resultado.carga).replace('.', ',')} ${x.unidad}`}</strong>.
              </p>
              <p>{C.elPorcentajeNoCambia}</p>
            </>
          ) : (
            <p>
              La carga de la fila general: <strong>{`${String(x.resultado.carga).replace('.', ',')} ${x.unidad}`}</strong>.
            </p>
          )}
          {series ? null : criterio === 'PERCENT_RM' ? (
            <p>
              El % RM, {String(x.resultado.porcentaje).replace('.', ',')}, y su referencia: «{referenciaDeLaEstimacion(x.resultado.punto.date)}». El método y la fecha, nunca el valor: el plan viaja a otras áreas.
            </p>
          ) : (
            <p>Solo la carga: el criterio de este ejercicio no es % RM, y BE no convierte entre criterios.</p>
          )}
          <p className="nota">{C.nuncaAutomatica}</p>
        </div>
      ) : null}
    </div>
  );
}
