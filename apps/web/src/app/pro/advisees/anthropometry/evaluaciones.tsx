'use client';

/**
 * «Evaluaciones» (B10-07; API-ANT-03/04/05/12): lo que ya es historia, en solo lectura, con los dos actos que el
 * legajo separa (REG-06-219):
 * - **corregir** cambia la vista del valor y conserva el original y su cadena;
 * - **anular** cambia la condición de efectividad, es terminal y no borra nada. El copy lo dice explícitamente,
 *   porque el 08 prohíbe presentarla como una acción destructiva (08 §56.12).
 *
 * Lo medido, lo informado y lo calculado se muestran distinguidos siempre (04:1090).
 */
import { cantidad, COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, ETIQUETA_DE_CONDICION, leerNumero, type EvaluacionAntropometricaApi, type Medicion } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EstadoDeLectura, useAntropometria } from './antropometria';
import { BloqueDeCalculos } from './calculos';

type Resumen = { evaluationId: string; state: string; occurredAt: string; registeredAt: string | null; summary: { metrics: string[]; measurementCount: number; annulledCount: number } };

export function VistaDeEvaluaciones() {
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const [r, setR] = useState<Resultado<{ lista: Resumen[]; abierta: EvaluacionAntropometricaApi | null }> | null>(null);
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const lista = await api.listarEvaluacionesAntropometricas(token, asesoradoId);
    if (sesionPerdida(lista)) return;
    if (!lista.ok) return setR(lista as Resultado<never>);
    const id = abiertaId ?? lista.datos.data[0]?.evaluationId ?? null;
    if (!id) return setR({ ok: true, datos: { lista: lista.datos.data as Resumen[], abierta: null } });
    const detalle = await api.consultarEvaluacionAntropometrica(token, id);
    if (sesionPerdida(detalle)) return;
    if (!detalle.ok) return setR(detalle as Resultado<never>);
    setR({ ok: true, datos: { lista: lista.datos.data as Resumen[], abierta: detalle.datos.data } });
  }, [token, asesoradoId, sesionPerdida, abiertaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          {aviso ? (
            <Aviso tipo={aviso.tipo} enfocar>
              <p>{aviso.texto}</p>
            </Aviso>
          ) : null}

          <section className="seccion" aria-labelledby="titulo-registradas">
            <h2 id="titulo-registradas">{COPY_ANTROPOMETRIA.evaluacionRegistrada}</h2>
            {r.datos.lista.length === 0 ? <p>{COPY_ANTROPOMETRIA.sinEvaluaciones}</p> : null}
            <ol className="historial">
              {r.datos.lista.map((e) => (
                <li key={e.evaluationId}>
                  <span className="historial__evento">{fecha(e.registeredAt ?? e.occurredAt)}</span> · {e.summary.measurementCount} mediciones
                  {e.summary.annulledCount > 0 ? ` · ${e.summary.annulledCount} ${COPY_ANTROPOMETRIA.anulada.toLowerCase()}` : ''} ·{' '}
                  <button type="button" className="boton boton--enlace" onClick={() => setAbiertaId(e.evaluationId)}>
                    Ver
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {r.datos.abierta ? (
            <Detalle
              evaluacion={r.datos.abierta}
              onAviso={setAviso}
              onHecho={(texto) => {
                setAviso({ tipo: 'exito', texto });
                void cargar();
              }}
              onError={(texto) => setAviso({ tipo: 'error', texto })}
            />
          ) : null}
        </div>
      ) : null}
    </EstadoDeLectura>
  );
}

function Detalle({
  evaluacion,
  onAviso,
  onHecho,
  onError,
}: {
  evaluacion: EvaluacionAntropometricaApi;
  onAviso: (a: { tipo: 'exito' | 'error'; texto: string }) => void;
  onHecho: (t: string) => void;
  onError: (t: string) => void;
}) {
  return (
    <section className="seccion" aria-labelledby="titulo-detalle">
      <h2 id="titulo-detalle">
        <span className="insignia">{COPY_ANTROPOMETRIA.soloLectura}</span> Evaluación del {fecha(evaluacion.registeredAt ?? evaluacion.occurredAt)}
      </h2>
      {evaluacion.context ? <p>{evaluacion.context}</p> : null}
      <p className="nota">{COPY_ANTROPOMETRIA.explicacionDeClases}</p>

      {evaluacion.measurements.map((m) => (
        <FilaDeMedicion key={m.measurementId} medicion={m} onHecho={onHecho} onError={onError} />
      ))}

      <BloqueDeCalculos evaluacion={evaluacion} onAviso={onAviso} />
    </section>
  );
}

function FilaDeMedicion({ medicion, onHecho, onError }: { medicion: Medicion; onHecho: (t: string) => void; onError: (t: string) => void }) {
  const { token, sesionPerdida, accesoRetirado } = useAntropometria();
  const intento = useClaveDeIntento();
  const [accion, setAccion] = useState<'corregir' | 'anular' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [valor, setValor] = useState('');
  /** Lo que no se entiende como número se señala en el campo, no en un aviso suelto (B10-10:164-165). */
  const [errorDeValor, setErrorDeValor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const anulada = medicion.condition === 'ANNULLED';

  async function corregir() {
    // `leerNumero` acepta coma o punto y devuelve `null` si no es un número (DL-091 punto 4).
    const nuevo = leerNumero(valor);
    if (nuevo === null) return setErrorDeValor('Escribí el valor como número: «72,5» o «72.5».');
    setErrorDeValor(null);
    setEnviando(true);
    // La corrección es de la evaluación, y la medición es el objetivo declarado en el cuerpo (09v11 §9).
    const res = await api.corregirMedicion(
      token,
      medicion.evaluationId,
      { targetId: medicion.measurementId, reason: motivo.trim(), magnitude: { value: nuevo, unit: medicion.magnitude.unit } },
      intento.actual(),
    );
    intento.registrar(res);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return onError(mensajeDeFallo(res));
    setAccion(null);
    onHecho(COPY_ANTROPOMETRIA.correccionHecha);
  }

  async function anular() {
    setEnviando(true);
    const res = await api.anularMedicion(token, medicion.measurementId, { reason: motivo.trim() }, intento.actual());
    intento.registrar(res);
    setEnviando(false);
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return onError(mensajeDeFallo(res));
    setAccion(null);
    onHecho(res.datos.data.alreadyAnnulled ? COPY_ANTROPOMETRIA.yaAnulada : COPY_ANTROPOMETRIA.anulacionHecha);
  }

  return (
    <div className="nodo nodo--comida">
      {/*
        El titular es el valor que RIGE, no el que se tomó primero: una corrección cambia la vista efectiva
        (REG-06-16), y mostrar el original acá lo dejaba contradiciendo al cálculo derivado que ya usa el
        corregido. El original no se pierde: queda rotulado como tal dentro de «Correcciones», que es lo que
        REG-06-154 exige conservar. Si la cadena no se puede resolver, no se inventa un titular.
      */}
      <h4>
        {medicion.metric}: {cantidad((medicion.effectiveMagnitude ?? medicion.magnitude).value, (medicion.effectiveMagnitude ?? medicion.magnitude).unit)}{' '}
        <span className="insignia">{ETIQUETA_DE_CLASE_DE_DATO[medicion.dataClass]}</span>{' '}
        <span className="insignia">{ETIQUETA_DE_CONDICION[medicion.condition]}</span>
        {medicion.corrections.length > 0 ? (
          <>
            {' '}
            <span className="insignia">
              {medicion.effectiveMagnitude ? COPY_ANTROPOMETRIA.corregida : COPY_ANTROPOMETRIA.sinValorVigente}
            </span>
          </>
        ) : null}
      </h4>
      <p className="nota">
        {COPY_ANTROPOMETRIA.protocolo}: {medicion.protocol.protocolName} · {fecha(medicion.occurredAt)}
      </p>

      {medicion.corrections.length > 0 ? (
        <details>
          <summary>
            {COPY_ANTROPOMETRIA.historialDeCorrecciones} ({medicion.corrections.length})
          </summary>
          <p className="nota">
            {COPY_ANTROPOMETRIA.valorOriginal}: {cantidad(medicion.magnitude.value, medicion.magnitude.unit)}
          </p>
          <ol className="historial">
            {medicion.corrections.map((c) => (
              <li key={c.correctionId}>
                <span className="historial__evento">{cantidad(c.magnitude.value, c.magnitude.unit)}</span>{' '}
                · {c.reason} · {c.author.displayName} · {fecha(c.recordedAt)}
              </li>
            ))}
          </ol>
          {medicion.effectiveMagnitude ? (
            <p>
              <strong>{COPY_ANTROPOMETRIA.valorVigente}:</strong> {cantidad(medicion.effectiveMagnitude.value, medicion.effectiveMagnitude.unit)}
            </p>
          ) : (
            <Aviso tipo="info">
              <p>{COPY_ANTROPOMETRIA.cadenaNoResoluble}</p>
            </Aviso>
          )}
        </details>
      ) : null}

      {anulada && medicion.annulment ? (
        <Aviso tipo="info">
          <p>
            {COPY_ANTROPOMETRIA.anulacionHecha} {COPY_ANTROPOMETRIA.motivoDeAnulacion}: «{medicion.annulment.reason}» · {medicion.annulment.author.displayName} ·{' '}
            {fecha(medicion.annulment.recordedAt)}
          </p>
          <p className="nota">{COPY_ANTROPOMETRIA.sinReversion}</p>
        </Aviso>
      ) : null}

      {!anulada && accion === null ? (
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => setAccion('corregir')}>
            {COPY_ANTROPOMETRIA.corregirMedicion}
          </button>
          <button type="button" className="boton boton--secundario" onClick={() => setAccion('anular')}>
            {COPY_ANTROPOMETRIA.anularMedicion}
          </button>
        </div>
      ) : null}

      {accion === 'corregir' ? (
        <div>
          <Campo
            id={`corr-valor-${medicion.measurementId}`}
            etiqueta={`${COPY_ANTROPOMETRIA.valor} (${medicion.magnitude.unit})`}
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            maxLength={12}
            error={errorDeValor}
          />
          <Campo id={`corr-motivo-${medicion.measurementId}`} etiqueta={COPY_ANTROPOMETRIA.motivoDeCorreccion} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} />
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={() => setAccion(null)} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="boton boton--primario" onClick={() => void corregir()} disabled={enviando || !motivo.trim() || !valor.trim()}>
              {COPY_ANTROPOMETRIA.corregirMedicion}
            </button>
          </div>
        </div>
      ) : null}

      {accion === 'anular' ? (
        <div>
          <Aviso tipo="info">
            <p>{COPY_ANTROPOMETRIA.explicacionDeAnulacion}</p>
          </Aviso>
          <Campo id={`anul-motivo-${medicion.measurementId}`} etiqueta={COPY_ANTROPOMETRIA.motivoDeAnulacion} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} />
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={() => setAccion(null)} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="boton boton--secundario" onClick={() => void anular()} disabled={enviando || !motivo.trim()}>
              {COPY_ANTROPOMETRIA.confirmarAnulacion}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
