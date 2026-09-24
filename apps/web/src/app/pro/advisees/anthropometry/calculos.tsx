'use client';

/**
 * Cálculos de una evaluación (API-MTH-01, API-CAL-01/02/04; UC-I09; RF-048).
 *
 * La pantalla dice en voz alta lo que el 06 §20.3 exige y lo que la interfaz podría tapar:
 * - **qué necesita el método** y con qué medición se cubre cada entrada, porque «disponible» no es «admisible»
 *   (REG-06-204). El desplegable ofrece solo las mediciones vigentes, y si igual no corresponde, el rechazo del
 *   servidor se muestra con su motivo en vez de un «no se pudo»;
 * - **los cálculos conviven**: se listan todos, sin promedio, sin orden por «mejor» y sin ninguno marcado por BE
 *   (REG-06-205). Si el profesional quiere dejar uno como referencia, es un acto suyo, con su fecha y su autor;
 * - **la referencia no es una decisión clínica**: no cambia el cálculo, no borra los otros y no crea objetivo ni
 *   prescripción (REG-06-207; INV-06-05). El texto lo dice antes de que apriete el botón;
 * - cada corrida muestra **método, versión, regla y precisión declarada**, que es lo que la vuelve reproducible
 *   (REG-06-156/158).
 */
import { cantidad, COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO, ETIQUETA_DE_CONDICION, type CorridaDeCalculoApi, type EvaluacionAntropometricaApi, type MetodoApi } from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Aviso, Campo } from '../../../../components/formulario';
import { Cargando, ErrorConReintento } from '../../../../components/estados';
import { api } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useAntropometria } from './antropometria';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; metodos: MetodoApi[]; corridas: CorridaDeCalculoApi[] };

export function BloqueDeCalculos({ evaluacion, onAviso }: { evaluacion: EvaluacionAntropometricaApi; onAviso: (a: { tipo: 'exito' | 'error'; texto: string }) => void }) {
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const [metodos, corridas] = await Promise.all([api.listarMetodos(token), api.listarCalculos(token, asesoradoId)]);
    if (sesionPerdida(metodos) || sesionPerdida(corridas)) return;
    if (!metodos.ok || !corridas.ok) return setEstado({ tipo: 'error' });
    setEstado({
      tipo: 'listo',
      metodos: metodos.datos.data as MetodoApi[],
      corridas: (corridas.datos.data as CorridaDeCalculoApi[]).filter((c) => c.evaluationId === evaluacion.evaluationId),
    });
  }, [token, asesoradoId, sesionPerdida, evaluacion.evaluationId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <section className="seccion" aria-labelledby="titulo-calculos">
      <h3 id="titulo-calculos">{COPY_ANTROPOMETRIA.calculos}</h3>
      <p className="nota">{COPY_ANTROPOMETRIA.explicacionDeCoexistencia}</p>
      {estado.tipo === 'cargando' ? <Cargando /> : null}
      {estado.tipo === 'error' ? <ErrorConReintento onReintentar={cargar} /> : null}
      {estado.tipo === 'listo' ? (
        <>
          {estado.corridas.length === 0 ? <p>{COPY_ANTROPOMETRIA.sinCalculos}</p> : null}
          {estado.corridas.map((c) => (
            <Corrida
              key={c.calculationRunId}
              corrida={c}
              onHecho={(texto) => {
                onAviso({ tipo: 'exito', texto });
                void cargar();
              }}
              onError={(texto) => onAviso({ tipo: 'error', texto })}
            />
          ))}

          {!abierto ? (
            <div className="acciones">
              <button type="button" className="boton boton--secundario" onClick={() => setAbierto(true)} disabled={estado.metodos.length === 0}>
                {COPY_ANTROPOMETRIA.nuevoCalculo}
              </button>
            </div>
          ) : (
            <NuevoCalculo
              evaluacion={evaluacion}
              metodos={estado.metodos}
              onCerrar={() => setAbierto(false)}
              onHecho={(texto) => {
                setAbierto(false);
                onAviso({ tipo: 'exito', texto });
                void cargar();
              }}
              onError={(texto) => onAviso({ tipo: 'error', texto })}
            />
          )}
          {estado.metodos.length === 0 ? <p className="nota">{COPY_ANTROPOMETRIA.sinMetodosSeleccionables}</p> : null}
        </>
      ) : null}
    </section>
  );
}

function Corrida({ corrida, onHecho, onError }: { corrida: CorridaDeCalculoApi; onHecho: (t: string) => void; onError: (t: string) => void }) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useAntropometria();
  const intento = useClaveDeIntento();
  const [adoptando, setAdoptando] = useState(false);
  const [fundamento, setFundamento] = useState('');
  const [enviando, setEnviando] = useState(false);

  /** El token de la referencia vigente viaja en la corrida: sin él, reemplazarla pisaría la decisión anterior. */
  async function adoptar(expectedVersion: string | null) {
    setEnviando(true);
    const res = await api.adoptarReferenciaDeCalculo(
      token,
      asesoradoId,
      corrida.purpose,
      { calculationRunId: corrida.calculationRunId, expectedVersion, rationale: fundamento.trim() || null },
      intento.actual(),
    );
    intento.registrar(res);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return onError(mensajeDeFallo(res));
    setAdoptando(false);
    onHecho(res.datos.data.supersedesReferenceId ? `${COPY_ANTROPOMETRIA.referenciaHecha} ${COPY_ANTROPOMETRIA.referenciaReemplazada}` : COPY_ANTROPOMETRIA.referenciaHecha);
  }

  return (
    <div className="nodo nodo--comida">
      <h4>
        {corrida.result.metric}: {cantidad(corrida.result.magnitude.value, corrida.result.magnitude.unit)}{' '}
        <span className="insignia">{ETIQUETA_DE_CLASE_DE_DATO.DERIVED}</span>
        {corrida.evaluationContext === 'IN_PREPARATION' ? <> <span className="insignia">{COPY_ANTROPOMETRIA.calculoEnPreparacion}</span></> : null}
        {!corrida.effective ? <> <span className="insignia">{COPY_ANTROPOMETRIA.calculoNoVigente}</span></> : null}
        {corrida.referenceForPurpose ? <> <span className="insignia">{COPY_ANTROPOMETRIA.referenciaAdoptada}</span></> : null}
      </h4>
      {!corrida.effective ? <p className="nota">{COPY_ANTROPOMETRIA.explicacionDeCalculoNoVigente}</p> : null}
      <p className="nota">
        {COPY_ANTROPOMETRIA.metodo}: {corrida.methodName} · {COPY_ANTROPOMETRIA.versionDelMetodo} {corrida.methodVersion} · {COPY_ANTROPOMETRIA.reglaAplicada}: {corrida.ruleId} ·{' '}
        {COPY_ANTROPOMETRIA.precisionDeclarada}: {corrida.precision.decimals} decimales · {fecha(corrida.recordedAt)}
        {corrida.supersedesRunId ? ` · ${COPY_ANTROPOMETRIA.corridaReemplazada}` : ''}
      </p>
      <details>
        <summary>{COPY_ANTROPOMETRIA.entradasDelCalculo}</summary>
        <ul>
          {corrida.inputProvenance.map((i) => (
            <li key={i.sourceRef}>
              {i.inputCode} · {i.metric}: {i.magnitude ? cantidad(i.magnitude.value, i.magnitude.unit) : COPY_ANTROPOMETRIA.valorNoConsultable} ·{' '}
              {ETIQUETA_DE_CLASE_DE_DATO[i.provenanceType === 'SELF_REPORTED' ? 'REPORTED' : 'MEASURED']} · {ETIQUETA_DE_CONDICION[i.condition]} · {fecha(i.sourceOccurredAt)}
            </li>
          ))}
        </ul>
      </details>

      {!corrida.referenceForPurpose && !adoptando && corrida.evaluationContext === 'REGISTERED' && corrida.effective ? (
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => setAdoptando(true)}>
            {COPY_ANTROPOMETRIA.adoptarReferencia}
          </button>
        </div>
      ) : null}

      {adoptando ? (
        <div>
          <Aviso tipo="info">
            <p>{COPY_ANTROPOMETRIA.explicacionDeReferencia}</p>
          </Aviso>
          <Campo
            id={`ref-fundamento-${corrida.calculationRunId}`}
            etiqueta={COPY_ANTROPOMETRIA.fundamentoDeLaReferencia}
            value={fundamento}
            onChange={(e) => setFundamento(e.target.value)}
            maxLength={1000}
          />
          <div className="acciones">
            <button type="button" className="boton boton--secundario" onClick={() => setAdoptando(false)} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="boton boton--primario" onClick={() => void adoptar(corrida.referenceVersion)} disabled={enviando}>
              {COPY_ANTROPOMETRIA.adoptarReferencia}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NuevoCalculo({
  evaluacion,
  metodos,
  onCerrar,
  onHecho,
  onError,
}: {
  evaluacion: EvaluacionAntropometricaApi;
  metodos: readonly MetodoApi[];
  onCerrar: () => void;
  onHecho: (t: string) => void;
  onError: (t: string) => void;
}) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useAntropometria();
  const intento = useClaveDeIntento();
  const [metodoId, setMetodoId] = useState(metodos[0]?.methodVersionId ?? '');
  const [entradas, setEntradas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const metodo = metodos.find((m) => m.methodVersionId === metodoId) ?? metodos[0]!;
  // Solo las mediciones vigentes: una anulada dejó de contar, también como entrada (REG-06-217).
  const disponibles = evaluacion.measurements.filter((m) => m.condition === 'EFFECTIVE');

  async function ejecutar() {
    setEnviando(true);
    const res = await api.ejecutarCalculo(
      token,
      asesoradoId,
      {
        purpose: metodo.purposes[0]!,
        methodVersionId: metodo.methodVersionId,
        inputBindings: metodo.requiredInputs.map((e) => ({ inputCode: e.inputCode, sourceRef: entradas[e.inputCode] ?? '' })),
      },
      intento.actual(),
    );
    intento.registrar(res);
    setEnviando(false);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return;
    if (!res.ok) return onError(mensajeDeFallo(res));
    onHecho(COPY_ANTROPOMETRIA.calculoHecho);
  }

  const completo = metodo.requiredInputs.every((e) => entradas[e.inputCode]);

  return (
    <div className="nodo nodo--dia">
      <div className="campo">
        <label htmlFor="cal-metodo">{COPY_ANTROPOMETRIA.metodo}</label>
        <select id="cal-metodo" value={metodoId} onChange={(e) => { setMetodoId(e.target.value); setEntradas({}); }}>
          {metodos.map((m) => (
            <option key={m.methodVersionId} value={m.methodVersionId}>
              {m.name} · {COPY_ANTROPOMETRIA.versionDelMetodo} {m.version}
            </option>
          ))}
        </select>
        <p className="campo__ayuda">{metodo.provenanceNote}</p>
      </div>

      <p className="nota">{COPY_ANTROPOMETRIA.explicacionDeAdmisibilidad}</p>
      {metodo.requiredInputs.map((e) => (
        <div className="campo" key={e.inputCode}>
          <label htmlFor={`cal-entrada-${e.inputCode}`}>
            {e.inputCode} · {e.metric} ({e.acceptedUnits.join(', ')})
          </label>
          <select id={`cal-entrada-${e.inputCode}`} value={entradas[e.inputCode] ?? ''} onChange={(ev) => setEntradas((x) => ({ ...x, [e.inputCode]: ev.target.value }))}>
            <option value="">{COPY_ANTROPOMETRIA.elegirEntrada}</option>
            {/*
              El desplegable ofrece el valor con el que se va a calcular, que es el que rige (REG-06-16). Mostrar el
              que se tomó primero hacía que el profesional eligiera un número y recibiera un resultado derivado de
              otro. Con la cadena sin resolver no se ofrece un valor: la admisibilidad va a rechazar esa entrada.
            */}
            {disponibles.map((m) => (
              <option key={m.measurementId} value={m.measurementId}>
                {m.metric}: {m.effectiveMagnitude ? cantidad(m.effectiveMagnitude.value, m.effectiveMagnitude.unit) : COPY_ANTROPOMETRIA.sinValorVigente} ·{' '}
                {ETIQUETA_DE_CLASE_DE_DATO[m.dataClass]}
                {m.corrections.length > 0 ? ` · ${COPY_ANTROPOMETRIA.corregida}` : ''}
              </option>
            ))}
          </select>
        </div>
      ))}

      <p className="nota">
        {COPY_ANTROPOMETRIA.finalidadDelCalculo}: {metodo.purposes.join(', ')} · {COPY_ANTROPOMETRIA.precisionDeclarada}: {metodo.precisionPolicy.decimals} decimales ·{' '}
        {COPY_ANTROPOMETRIA.reglaAplicada}: {metodo.ruleId}
      </p>

      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" className="boton boton--primario" onClick={() => void ejecutar()} disabled={enviando || !completo}>
          {COPY_ANTROPOMETRIA.ejecutarCalculo}
        </button>
      </div>
    </div>
  );
}
