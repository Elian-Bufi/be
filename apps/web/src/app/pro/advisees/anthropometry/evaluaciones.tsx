'use client';

/**
 * «Evaluaciones» (B10-07; API-ANT-03/04/05/12): lo que ya es historia, en solo lectura, con los dos actos que el
 * legajo separa (REG-06-219):
 * - **corregir** cambia la vista del valor y conserva el original y su cadena;
 * - **anular** cambia la condición de efectividad, es terminal y no borra nada. El copy lo dice explícitamente,
 *   porque el 08 prohíbe presentarla como una acción destructiva (08 §56.12).
 *
 * Lo medido, lo informado y lo calculado se muestran distinguidos siempre (04:1090).
 *
 * DL-113 · la pantalla se ordena por lo que el profesional viene a hacer:
 * - cada toma se nombra por **cuándo se tomó**: la fecha de registro es un metadato, y con ella sola las tomas
 *   registradas el mismo día se veían iguales;
 * - en el detalle, los resultados calculados van antes que las mediciones;
 * - las mediciones van en filas compactas por familia, con «Corregir» y «Anular» en cada fila. El protocolo y la
 *   fecha de la toma se dicen una vez, y en una fila solo si difieren.
 */
import {
  cantidad,
  COPY,
  COPY_ANTROPOMETRIA,
  COPY_EVOLUCION,
  ETIQUETA_DE_CLASE_DE_DATO,
  ETIQUETA_DE_CONDICION,
  ETIQUETA_DE_FAMILIA,
  FAMILIA_DE_METRICA,
  leerNumero,
  motivoDeNumeroIlegible,
  nombreDeMetrica,
  type EvaluacionAntropometricaApi,
  type FamiliaDeMedicion,
  type Medicion,
} from '@be/domain';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Ayuda, AvisoFlotante } from '../../../../components/ayuda';
import { Aviso, Campo } from '../../../../components/formulario';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { EstadoVacio } from '../../../../components/estados';
import { EstadoDeLectura, useAntropometria } from './antropometria';
import { BloqueDeCalculos } from './calculos';

type Resumen = { evaluationId: string; state: string; occurredAt: string; registeredAt: string | null; summary: { metrics: string[]; measurementCount: number; annulledCount: number } };

/**
 * Qué pasó con la evaluación pedida cuando la lista sí se pudo leer: `no-disponible` es el 404 (no existe, o no está
 * autorizada: no se distingue, como en toda la API) y `transitorio` es cualquier otro fallo, que amerita reintentar.
 * En los dos casos la lista válida del asesorado se muestra igual: una evaluación fallida no la tapa.
 */
type FalloDeDetalle = 'no-disponible' | 'transitorio' | null;

export function VistaDeEvaluaciones() {
  const { token, asesoradoId, sesionPerdida, irA } = useAntropometria();
  const [r, setR] = useState<Resultado<{ lista: Resumen[]; abierta: EvaluacionAntropometricaApi | null; fallo: FalloDeDetalle }> | null>(null);
  // Desde la evolución llega `evaluacion=` en la URL: es la evaluación de origen de una observación (RF-049). Si el
  // parámetro cambia después (otra observación, o se vuelve a la lista), la evaluación abierta lo sigue.
  const pedida = useSearchParams().get('evaluacion');
  const [abiertaId, setAbiertaId] = useState<string | null>(pedida);
  useEffect(() => {
    setAbiertaId(pedida);
  }, [pedida]);
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setR(null);
    const lista = await api.listarEvaluacionesAntropometricas(token, asesoradoId);
    if (sesionPerdida(lista)) return;
    if (!lista.ok) return setR(lista as Resultado<never>);
    const filas = lista.datos.data as Resumen[];
    const id = abiertaId ?? filas[0]?.evaluationId ?? null;
    if (!id) return setR({ ok: true, datos: { lista: filas, abierta: null, fallo: null } });
    const detalle = await api.consultarEvaluacionAntropometrica(token, id);
    if (sesionPerdida(detalle)) return;
    if (!detalle.ok) {
      const noDisponible = detalle.tipo === 'API' && detalle.codigo === 'RESOURCE_NOT_FOUND';
      return setR({ ok: true, datos: { lista: filas, abierta: null, fallo: noDisponible ? 'no-disponible' : 'transitorio' } });
    }
    setR({ ok: true, datos: { lista: filas, abierta: detalle.datos.data, fallo: null } });
  }, [token, asesoradoId, sesionPerdida, abiertaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);
  // Vuelve a la lista sin la evaluación pedida: saca el parámetro de la URL y abre la más reciente, como al entrar.
  const volverALaLista = () => {
    setAbiertaId(null);
    irA('evaluaciones');
  };

  return (
    <EstadoDeLectura r={r} onReintentar={cargar}>
      {r?.ok ? (
        <div className="secciones">
          {/* DL-113: el éxito aparece donde se está mirando, sin mover la página; un error, arriba y con el foco. */}
          {aviso && aviso.tipo === 'exito' ? (
            <AvisoFlotante onCerrar={() => setAviso(null)}>
              <p>{aviso.texto}</p>
            </AvisoFlotante>
          ) : null}
          {aviso && aviso.tipo === 'error' ? (
            <Aviso tipo="error" enfocar>
              <p>{aviso.texto}</p>
            </Aviso>
          ) : null}
          {r.datos.fallo === 'no-disponible' ? (
            <Aviso tipo="info" enfocar>
              <p>
                {COPY_EVOLUCION.evaluacionNoDisponible}{' '}
                <button type="button" className="boton boton--enlace" onClick={volverALaLista}>
                  {COPY_EVOLUCION.volverALaLista}
                </button>
              </p>
            </Aviso>
          ) : null}
          {r.datos.fallo === 'transitorio' ? (
            <Aviso tipo="error" enfocar>
              <p>
                {COPY_EVOLUCION.evaluacionNoCargo}{' '}
                <button type="button" className="boton boton--enlace" onClick={() => void cargar()}>
                  {COPY.reintentar}
                </button>{' '}
                ·{' '}
                <button type="button" className="boton boton--enlace" onClick={volverALaLista}>
                  {COPY_EVOLUCION.volverALaLista}
                </button>
              </p>
            </Aviso>
          ) : null}

          <section className="seccion" aria-labelledby="titulo-registradas">
            <h2 id="titulo-registradas">Tomas registradas</h2>
            {r.datos.lista.length === 0 ? (
              <EstadoVacio
                titulo={COPY_ANTROPOMETRIA.sinEvaluaciones}
                accion={
                  <button type="button" className="boton boton--primario" onClick={() => irA('preparacion')}>
                    Preparar una toma
                  </button>
                }
              >
                <p className="nota">Una toma se carga en «En preparación» y pasa a esta lista cuando se registra.</p>
              </EstadoVacio>
            ) : null}
            <ol className="tomas">
              {r.datos.lista.map((e) => (
                <li key={e.evaluationId}>
                  <button type="button" className="tomas__toma" aria-current={e.evaluationId === r.datos.abierta?.evaluationId ? 'true' : undefined} onClick={() => setAbiertaId(e.evaluationId)}>
                    <span className="tomas__fecha">{fecha(e.occurredAt)}</span>
                    <span className="tomas__detalle">
                      {e.summary.measurementCount} mediciones
                      {e.summary.annulledCount > 0 ? ` · ${e.summary.annulledCount} ${COPY_ANTROPOMETRIA.anulada.toLowerCase()}` : ''}
                      {e.registeredAt ? ` · registrada el ${dia(e.registeredAt)}` : ''}
                    </span>
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
  const { irA } = useAntropometria();
  const protocolo = protocoloDeLaToma(evaluacion.measurements);
  const anuladas = evaluacion.measurements.filter((m) => m.condition === 'ANNULLED').length;
  const metadatos = [
    protocolo ? `${COPY_ANTROPOMETRIA.protocolo}: ${protocolo}` : null,
    `${evaluacion.measurements.length} mediciones${anuladas > 0 ? ` (${anuladas} ${COPY_ANTROPOMETRIA.anulada.toLowerCase()})` : ''}`,
    evaluacion.registeredAt ? `registrada el ${fecha(evaluacion.registeredAt)} por ${evaluacion.author.displayName}` : null,
  ].filter((p): p is string => p !== null);
  return (
    <section className="seccion" aria-labelledby="titulo-detalle">
      <h2 id="titulo-detalle">
        <span className="insignia">{COPY_ANTROPOMETRIA.soloLectura}</span> Toma del {fecha(evaluacion.occurredAt)}
      </h2>
      {/* Lo que vale para toda la toma, dicho una vez. */}
      <p className="metadatos">{metadatos.join(' · ')}</p>
      {evaluacion.context ? <p>{evaluacion.context}</p> : null}
      {/* DL-111 · la lámina del compositor con esta toma. */}
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={() => irA('lamina', evaluacion.evaluationId)}>
          {COPY_ANTROPOMETRIA.verLamina}
        </button>
      </div>

      <BloqueDeCalculos evaluacion={evaluacion} onAviso={onAviso} />

      <section className="subseccion" aria-labelledby="titulo-mediciones">
        <h3 id="titulo-mediciones">Mediciones</h3>
        <Ayuda titulo="Medido, reportado o calculado">
          <p>{COPY_ANTROPOMETRIA.explicacionDeClases}</p>
        </Ayuda>
        {FAMILIAS.map((familia) => {
          const deLaFamilia = evaluacion.measurements.filter((m) => (FAMILIA_DE_METRICA[m.metric] ?? 'OTRAS') === familia);
          if (deLaFamilia.length === 0) return null;
          return (
            <div key={familia} className="familia">
              <h4>{ETIQUETA_DE_FAMILIA[familia]}</h4>
              <ul className="mediciones">
                {deLaFamilia.map((m) => (
                  <FilaDeMedicion key={m.measurementId} medicion={m} protocoloDeLaToma={protocolo} momentoDeLaToma={evaluacion.occurredAt} onHecho={onHecho} onError={onError} />
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </section>
  );
}

/** El orden de las familias, el mismo de la toma y de la lámina. */
const FAMILIAS: readonly FamiliaDeMedicion[] = ['MASA_Y_ESTATURA', 'PERIMETROS', 'PLIEGUES', 'DIAMETROS', 'OTRAS'];

/** El protocolo de la toma: el que declaran sus mediciones (el más frecuente, si hubiera más de uno). */
function protocoloDeLaToma(mediciones: readonly Medicion[]): string | null {
  const cuenta = new Map<string, number>();
  for (const m of mediciones) cuenta.set(m.protocol.protocolName, (cuenta.get(m.protocol.protocolName) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function FilaDeMedicion({
  medicion,
  protocoloDeLaToma,
  momentoDeLaToma,
  onHecho,
  onError,
}: {
  medicion: Medicion;
  protocoloDeLaToma: string | null;
  momentoDeLaToma: string;
  onHecho: (t: string) => void;
  onError: (t: string) => void;
}) {
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
    if (nuevo === null) return setErrorDeValor(motivoDeNumeroIlegible(valor));
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

  const nombre = nombreDeMetrica(medicion.metric);
  // El protocolo y la fecha de la toma ya están arriba: en la fila van solo si esta medición difiere.
  const otroProtocolo = medicion.protocol.protocolName !== protocoloDeLaToma;
  const otroMomento = medicion.occurredAt !== momentoDeLaToma;
  return (
    <li className={`medicion${anulada ? ' medicion--anulada' : ''}`}>
      {/*
        El titular es el valor que RIGE, no el que se tomó primero: una corrección cambia la vista efectiva
        (REG-06-16), y mostrar el original acá lo dejaba contradiciendo al cálculo derivado que ya usa el
        corregido. El original no se pierde: queda rotulado como tal dentro de «Correcciones», que es lo que
        REG-06-154 exige conservar. Si la cadena no se puede resolver, no se inventa un titular.
      */}
      <div className="medicion__fila">
        <span className="medicion__nombre">{nombre}</span>
        <span className="medicion__valor">{cantidad((medicion.effectiveMagnitude ?? medicion.magnitude).value, (medicion.effectiveMagnitude ?? medicion.magnitude).unit)}</span>
        <span className="medicion__pie">
        <span className="medicion__estado">
          {ETIQUETA_DE_CLASE_DE_DATO[medicion.dataClass]} · {anulada ? <strong>{ETIQUETA_DE_CONDICION[medicion.condition]}</strong> : ETIQUETA_DE_CONDICION[medicion.condition]}
          {medicion.corrections.length > 0 ? ` · ${medicion.effectiveMagnitude ? COPY_ANTROPOMETRIA.corregida : COPY_ANTROPOMETRIA.sinValorVigente}` : ''}
        </span>
        {!anulada && accion === null ? (
          <span className="medicion__acciones">
            <button type="button" className="boton boton--secundario boton--compacto" aria-label={`${COPY_ANTROPOMETRIA.corregirMedicion}: ${nombre}`} onClick={() => setAccion('corregir')}>
              Corregir
            </button>
            <button type="button" className="boton boton--secundario boton--compacto" aria-label={`${COPY_ANTROPOMETRIA.anularMedicion}: ${nombre}`} onClick={() => setAccion('anular')}>
              Anular
            </button>
          </span>
        ) : null}
        </span>
      </div>
      {otroProtocolo || otroMomento ? (
        <p className="nota">
          {COPY_ANTROPOMETRIA.protocolo}: {medicion.protocol.protocolName} · {fecha(medicion.occurredAt)}
        </p>
      ) : null}

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
    </li>
  );
}
