'use client';

/**
 * Una medición de una toma registrada, en el panel que se abre sobre «Tomas» (maqueta 29; C-62): el valor que rige, su
 * historia, lo que cambió en los resultados calculados y los dos actos que el legajo separa (REG-06-219):
 * - **corregir** cambia la vista del valor y conserva el original y su cadena;
 * - **anular** cambia la condición de efectividad, es terminal y no borra nada. El texto lo dice antes del botón, porque
 *   el 08 prohíbe presentarla como una acción destructiva (08 §56.12). El botón no es rojo.
 *
 * El titular es el valor que RIGE, no el que se tomó primero (REG-06-16): lo da `valorQueRige`, del dominio. El original
 * no se pierde: queda en la historia, rotulado como tal, que es lo que REG-06-154 exige conservar. Si la cadena de
 * correcciones no se resuelve, no se inventa un titular. Una medición anulada no ofrece ninguna acción.
 *
 * Lo que se acaba de hacer se dice acá adentro: un aviso de la página quedaría detrás del panel. Después de una
 * escritura el panel sigue abierto, con la medición vuelta a leer.
 */
import {
  COPY_ANTROPOMETRIA as C,
  ETIQUETA_DE_CONDICION,
  ETIQUETA_DE_FAMILIA,
  FAMILIA_DE_METRICA,
  excepcionesDeLaMedicion,
  historiaDeLaMedicion,
  leerNumero,
  loQueCambio,
  marcaDeLaClase,
  motivoDeNumeroIlegible,
  valorQueRige,
  type CorridaDeCalculoApi,
  type EvaluacionAntropometricaApi,
  type EventoDeLaHistoria,
  type Medicion,
} from '@be/domain';
import { useMemo, useState } from 'react';
import { conNumerosPegados } from '../../../../components/en-partes';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { motivoDelRechazo } from './rechazos-de-antropometria';
import { useCambiosSinGuardar } from '../marco-del-area';
import { useAntropometria } from './antropometria';
import { Marca } from './marca';

export function DetalleDeMedicion({
  medicion,
  toma,
  protocoloDeLaToma,
  corridas,
  hecho,
  onHecho,
}: {
  medicion: Medicion;
  toma: EvaluacionAntropometricaApi;
  protocoloDeLaToma: string | null;
  /** Las corridas del asesorado, para decir qué cambió en los resultados; `null` si no se pudieron leer. */
  corridas: readonly CorridaDeCalculoApi[] | null;
  /** Lo que se acaba de hacer con esta medición, para decirlo acá. */
  hecho: string | null;
  onHecho: (texto: string) => Promise<void>;
}) {
  const { token, sesionPerdida, accesoRetirado, miIdentidad } = useAntropometria();
  const intento = useClaveDeIntento();
  const [accion, setAccion] = useState<'corregir' | 'anular' | null>(null);
  // Cada formulario tiene su motivo: lo escrito para corregir no aparece al pasar a anular.
  const [motivoDeCorregir, setMotivoDeCorregir] = useState('');
  const [motivoDeAnular, setMotivoDeAnular] = useState('');
  const [valor, setValor] = useState('');
  /** Lo que no se entiende como número se señala en el campo, no en un aviso suelto (B10-10:164-165). */
  const [errorDeValor, setErrorDeValor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const escribiendo = accion === 'corregir' ? motivoDeCorregir.trim() !== '' || valor.trim() !== '' : accion === 'anular' ? motivoDeAnular.trim() !== '' : false;
  useCambiosSinGuardar(escribiendo, accion === 'anular' ? 'la anulación de una medición' : 'la corrección de una medición');

  const anulada = medicion.condition === 'ANNULLED';
  const titular = valorQueRige(medicion);
  const historia = useMemo(() => historiaDeLaMedicion(medicion, miIdentidad), [medicion, miIdentidad]);
  const cambio = useMemo(() => (corridas ? loQueCambio(medicion, corridas) : null), [medicion, corridas]);
  const hayCambioQueDecir = medicion.corrections.length > 0 || anulada;

  const cancelar = () => {
    setAccion(null);
    setError(null);
    setErrorDeValor(null);
  };

  async function corregir() {
    // `leerNumero` acepta coma o punto y devuelve `null` si no es un número (DL-091 punto 4).
    const nuevo = leerNumero(valor);
    if (nuevo === null) return setErrorDeValor(motivoDeNumeroIlegible(valor));
    setErrorDeValor(null);
    setError(null);
    setEnviando(true);
    // La corrección es de la toma, y la medición es el objetivo declarado en el cuerpo (09v11 §9). Conserva la unidad.
    const res = await api.corregirMedicion(token, medicion.evaluationId, { targetId: medicion.measurementId, reason: motivoDeCorregir.trim(), magnitude: { value: nuevo, unit: medicion.magnitude.unit } }, intento.actual());
    intento.registrar(res);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return setEnviando(false);
    if (!res.ok) {
      setEnviando(false);
      return setError(motivoDelRechazo(res)?.texto ?? mensajeDeFallo(res));
    }
    await onHecho(C.correccionHecha);
    setEnviando(false);
    setAccion(null);
    setValor('');
    setMotivoDeCorregir('');
  }

  async function anular() {
    setError(null);
    setEnviando(true);
    const res = await api.anularMedicion(token, medicion.measurementId, { reason: motivoDeAnular.trim() }, intento.actual());
    intento.registrar(res);
    if (sesionPerdida(res) || accesoRetirado(res)) return setEnviando(false);
    if (!res.ok) {
      setEnviando(false);
      return setError(motivoDelRechazo(res)?.texto ?? mensajeDeFallo(res));
    }
    await onHecho(res.datos.data.alreadyAnnulled ? C.yaAnulada : C.anulacionHecha);
    setEnviando(false);
    setAccion(null);
    setMotivoDeAnular('');
  }

  return (
    <div className="medicion-abierta" data-medicion={medicion.measurementId}>
      <p className="nota medicion-abierta__de-donde">
        {C.tomaDel} {fecha(toma.occurredAt)} · {ETIQUETA_DE_FAMILIA[FAMILIA_DE_METRICA[medicion.metric] ?? 'OTRAS']}
      </p>
      {hecho ? (
        <Aviso tipo="exito">
          <p>{hecho}</p>
        </Aviso>
      ) : null}

      <div className="medicion-abierta__titular">
        <p className="medicion-abierta__valor">{titular ?? C.sinValorVigente}</p>
        <span className="medicion-abierta__marcas">
          <Marca marca={marcaDeLaClase(medicion.dataClass)} />
          {anulada ? null : <span className="etiqueta-de-dato">{ETIQUETA_DE_CONDICION[medicion.condition]}</span>}
          {/* «Sin valor vigente» ya es el titular: no se repite como marca. */}
          {excepcionesDeLaMedicion(medicion)
            .filter((x) => x.clase !== 'sin-valor')
            .map((x) => (
              <Marca key={x.clase} marca={x} />
            ))}
        </span>
      </div>
      <dl className="medicion-abierta__datos">
        <div>
          <dt>{C.protocolo}</dt>
          <dd>{medicion.protocol.protocolName}</dd>
        </div>
        <div>
          <dt>{C.seTomo}</dt>
          <dd>{fecha(medicion.occurredAt)}</dd>
        </div>
      </dl>
      {/* El protocolo de la toma es el de la mayoría de sus mediciones: si esta se tomó con otro, se dice. */}
      {protocoloDeLaToma && medicion.protocol.protocolName !== protocoloDeLaToma ? <p className="nota">Las demás mediciones de esta toma son del protocolo «{protocoloDeLaToma}».</p> : null}

      <section className="medicion-abierta__bloque" aria-labelledby="titulo-historia">
        <h3 id="titulo-historia">{C.historiaDeLaMedicion}</h3>
        <ol className="historia-de-medicion">
          {historia.map((e) => (
            <Evento key={`${e.tipo}-${e.id}`} evento={e} conCorrecciones={medicion.corrections.length > 0} />
          ))}
        </ol>
        {medicion.corrections.length > 0 && medicion.effectiveMagnitude === null ? (
          <Aviso tipo="info">
            <p>{C.cadenaNoResoluble}</p>
          </Aviso>
        ) : null}
        {anulada ? <p className="nota">{C.sinReversion}</p> : null}
      </section>

      {hayCambioQueDecir ? (
        <section className="medicion-abierta__bloque" aria-labelledby="titulo-cambio">
          <h3 id="titulo-cambio">{anulada ? C.loQuePasoConLosResultados : C.loQueCambioConLaCorreccion}</h3>
          {cambio === null ? <p className="nota">{C.resultadosNoCargaron}</p> : null}
          {cambio && cambio.recalculados.length > 0 ? (
            <>
              <p>{C.seVolvieronACalcular(cambio.recalculados.length)}</p>
              <ul className="cambios-de-resultados" data-cambios="recalculados">
                {cambio.recalculados.map((r) => (
                  <li key={r.corridaId}>
                    <span className="cambios-de-resultados__nombre">{conNumerosPegados(r.metodo)}</span>
                    <span className="cambios-de-resultados__valores">
                      <strong>{r.ahora}</strong>{' '}
                      <span className="cambios-de-resultados__antes">
                        {C.antesDelCambio} {r.antes}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {cambio && cambio.sinRecalcular.length > 0 ? (
            <>
              <p>
                {C.quedaronSinEfecto(cambio.sinRecalcular.length)} {C.sinSucesor}
              </p>
              <ul className="cambios-de-resultados" data-cambios="sin-recalcular">
                {cambio.sinRecalcular.map((r) => (
                  <li key={r.corridaId}>
                    <span className="cambios-de-resultados__nombre">{conNumerosPegados(r.metodo)}</span>
                    <span className="cambios-de-resultados__valores">
                      <span className="cambios-de-resultados__antes">
                        {C.antesDelCambio} {r.antes}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {cambio && cambio.sinAtribuir > 0 ? <p className="nota">{C.cambioSinAtribuir(cambio.sinAtribuir)}</p> : null}
          {cambio && cambio.recalculados.length === 0 && cambio.sinRecalcular.length === 0 && cambio.sinAtribuir === 0 ? <p className="nota">{anulada ? C.ningunResultadoQuedoSinEfecto : C.ningunResultadoCambio}</p> : null}
        </section>
      ) : null}

      {error ? (
        <Aviso tipo="error" enfocar>
          <p>{error}</p>
        </Aviso>
      ) : null}

      {!anulada && accion === null ? (
        <div className="medicion-abierta__pie">
          <div className="acciones acciones--en-linea">
            <button type="button" className="boton boton--secundario" onClick={() => setAccion('corregir')}>
              <Icono nombre="corregido" tamano={18} />
              {C.corregirMedicion}
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => setAccion('anular')}>
              <Icono nombre="anulado" tamano={18} />
              {C.confirmarAnulacion}
            </button>
          </div>
          <p className="nota">
            {C.corregirConservaLaUnidad} {C.explicacionDeAnulacion}
          </p>
        </div>
      ) : null}

      {accion === 'corregir' ? (
        <div className="medicion-abierta__pie" data-formulario="corregir">
          <Campo id={`corr-valor-${medicion.measurementId}`} etiqueta={`${C.valor} (${medicion.magnitude.unit})`} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} maxLength={12} error={errorDeValor} />
          <Campo id={`corr-motivo-${medicion.measurementId}`} etiqueta={C.motivoDeCorreccion} value={motivoDeCorregir} onChange={(e) => setMotivoDeCorregir(e.target.value)} maxLength={1000} />
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={cancelar} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="boton boton--primario" onClick={() => void corregir()} disabled={enviando || !motivoDeCorregir.trim() || !valor.trim()}>
              {C.corregirMedicion}
            </button>
          </div>
        </div>
      ) : null}

      {accion === 'anular' ? (
        <div className="medicion-abierta__pie" data-formulario="anular">
          {/* Lo que hay que saber antes de anular queda a la vista, arriba del botón: es terminal. */}
          <Aviso tipo="info">
            <p>{C.explicacionDeAnulacion}</p>
            <p>{C.sinReversion}</p>
          </Aviso>
          <Campo id={`anul-motivo-${medicion.measurementId}`} etiqueta={C.motivoDeAnulacion} value={motivoDeAnular} onChange={(e) => setMotivoDeAnular(e.target.value)} maxLength={1000} />
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={cancelar} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => void anular()} disabled={enviando || !motivoDeAnular.trim()}>
              {C.confirmarAnulacion}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Un hecho de la historia: cuándo quedó registrado, qué valor dejó y por qué. */
function Evento({ evento: e, conCorrecciones }: { evento: EventoDeLaHistoria; conCorrecciones: boolean }) {
  const quien = e.propio ? (e.tipo === 'ANULACION' ? C.laAnulasteVos : C.laCorregisteVos) : e.autor ? `${e.autor}.` : '';
  return (
    <li className="historia-de-medicion__evento" data-evento={e.tipo} data-rige={e.rige ? 'si' : undefined}>
      <span className="historia-de-medicion__cuando">{fecha(e.cuando)}</span>
      <div className="historia-de-medicion__que">
        <p className="historia-de-medicion__titulo">
          {e.tipo === 'CORRECCION' ? `${C.correccion}: ${e.valor}` : e.tipo === 'ORIGINAL' ? `${C.valorOriginal}: ${e.valor}` : C.anulacion}
          {e.rige ? (
            <>
              {' '}
              <span className="etiqueta-de-dato">{C.valorVigente}</span>
            </>
          ) : null}
        </p>
        {e.tipo === 'CORRECCION' ? (
          <p className="nota">
            {C.porQueSeCorrigio}: «{e.motivo}». {quien}
          </p>
        ) : null}
        {e.tipo === 'ANULACION' ? (
          <p className="nota">
            {C.porQueSeAnulo}: «{e.motivo}». {quien}
          </p>
        ) : null}
        {e.tipo === 'ORIGINAL' ? <p className="nota">{conCorrecciones ? C.seConservaElOriginal : C.sinCorrecciones}</p> : null}
      </div>
    </li>
  );
}
