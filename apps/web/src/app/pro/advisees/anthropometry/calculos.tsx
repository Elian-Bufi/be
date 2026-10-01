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
import { asignacionAutomatica, cantidad, todasLasPaginas, UNIDAD_ADIMENSIONAL, COPY_ANTROPOMETRIA, datosDelMetodo, metodosParaLaToma, nombreDeMetrica, numeroConPrecision, ETIQUETA_DE_CLASE_DE_DATO, ETIQUETA_DE_CONDICION, type CorridaDeCalculoApi, type EvaluacionAntropometricaApi, type MetodoApi } from '@be/domain';
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
    // Las dos listas van completas: desde DL-111 el catálogo tiene más métodos que una página, y API-CAL-02 no filtra
    // por evaluación, así que una corrida de esta toma puede estar en cualquier página.
    const [metodos, corridas] = await Promise.all([
      todasLasPaginas((f) => api.listarMetodos(token, f)),
      todasLasPaginas((f) => api.listarCalculos(token, asesoradoId, f)),
    ]);
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
        {/* Con la precisión que declara el método, aunque termine en cero (REG-06-158: sin redondeo silencioso). */}
        {nombreDeMetrica(corrida.result.metric)}: {numeroConPrecision(corrida.result.magnitude.value, corrida.precision.decimals)}
        {corrida.result.magnitude.unit === UNIDAD_ADIMENSIONAL ? '' : ` ${corrida.result.magnitude.unit}`}{' '}
        <span className="insignia">{ETIQUETA_DE_CLASE_DE_DATO.DERIVED}</span>
        {corrida.evaluationContext === 'IN_PREPARATION' ? <> <span className="insignia">{COPY_ANTROPOMETRIA.calculoEnPreparacion}</span></> : null}
        {!corrida.effective ? <> <span className="insignia">{COPY_ANTROPOMETRIA.calculoNoVigente}</span></> : null}
        {corrida.referenceForPurpose ? <> <span className="insignia">{COPY_ANTROPOMETRIA.referenciaAdoptada}</span></> : null}
      </h4>
      {!corrida.effective ? <p className="nota">{COPY_ANTROPOMETRIA.explicacionDeCalculoNoVigente}</p> : null}
      <p className="nota">
        {COPY_ANTROPOMETRIA.metodo}: {corrida.methodName} · {COPY_ANTROPOMETRIA.versionDelMetodo} {corrida.methodVersion} · {COPY_ANTROPOMETRIA.reglaAplicada}: {corrida.ruleId} ·{' '}
        {COPY_ANTROPOMETRIA.precisionDeclarada}: {COPY_ANTROPOMETRIA.decimales(corrida.precision.decimals)} · {fecha(corrida.recordedAt)}
        {corrida.supersedesRunId ? ` · ${COPY_ANTROPOMETRIA.corridaReemplazada}` : ''}
      </p>
      <details>
        <summary>{COPY_ANTROPOMETRIA.entradasDelCalculo}</summary>
        <ul>
          {corrida.inputProvenance.map((i) => (
            <li key={i.sourceRef}>
              {nombreDeMetrica(i.metric)}: {i.magnitude ? cantidad(i.magnitude.value, i.magnitude.unit) : COPY_ANTROPOMETRIA.valorNoConsultable} ·{' '}
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
  // DL-111 · los métodos que esta toma cubre por completo primero, y adentro por categoría y nombre: nunca por «mejor».
  const { posibles, faltanDatos } = metodosParaLaToma(metodos, evaluacion.measurements);
  const primero = posibles[0] ?? faltanDatos[0] ?? metodos[0]!;
  const [metodoId, setMetodoId] = useState(primero.methodVersionId);
  const metodo = metodos.find((m) => m.methodVersionId === metodoId) ?? primero;
  const datos = datosDelMetodo(metodo, evaluacion.measurements);
  // Cada dato se asigna solo a la medición vigente de la toma con la misma clave; el profesional la puede cambiar.
  const [entradas, setEntradas] = useState<Record<string, string>>(() => asignacionAutomatica(datosDelMetodo(primero, evaluacion.measurements)));
  const [enviando, setEnviando] = useState(false);
  // Solo las mediciones vigentes: una anulada dejó de contar, también como entrada (REG-06-217).
  const disponibles = evaluacion.measurements.filter((m) => m.condition === 'EFFECTIVE');

  function elegirMetodo(id: string) {
    const elegido = metodos.find((m) => m.methodVersionId === id);
    setMetodoId(id);
    setEntradas(elegido ? asignacionAutomatica(datosDelMetodo(elegido, evaluacion.measurements)) : {});
  }

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
  const etiquetaDeCategoria = (m: MetodoApi): string => (m.category ? `${COPY_ANTROPOMETRIA.categoriaDeMetodo[m.category] ?? m.category} · ` : '');
  const opcion = (m: MetodoApi) => (
    <option key={m.methodVersionId} value={m.methodVersionId}>
      {etiquetaDeCategoria(m)}
      {m.name} · {COPY_ANTROPOMETRIA.versionDelMetodo} {m.version}
    </option>
  );

  return (
    <div className="nodo nodo--dia">
      <div className="campo">
        <label htmlFor="cal-metodo">{COPY_ANTROPOMETRIA.metodo}</label>
        <select id="cal-metodo" value={metodoId} onChange={(e) => elegirMetodo(e.target.value)}>
          {posibles.length > 0 ? <optgroup label={COPY_ANTROPOMETRIA.metodosPosibles}>{posibles.map(opcion)}</optgroup> : null}
          {faltanDatos.length > 0 ? <optgroup label={COPY_ANTROPOMETRIA.metodosConDatosFaltantes}>{faltanDatos.map(opcion)}</optgroup> : null}
        </select>
      </div>

      {/* La ficha del método: qué es, qué da, qué pide (y si esta toma lo tiene) y de dónde sale (DL-111). */}
      <div className="ficha-de-metodo" aria-live="polite">
        {metodo.description ? <p>{metodo.description}</p> : null}
        <p>
          <strong>{COPY_ANTROPOMETRIA.metodoDa}:</strong> {nombreDeMetrica(metodo.output.metric)} ({metodo.output.unit})
        </p>
        <p>
          <strong>{COPY_ANTROPOMETRIA.metodoPide}:</strong>
        </p>
        <ul className="ficha-de-metodo__datos">
          {datos.map((d) => (
            <li key={d.codigo}>
              {nombreDeMetrica(d.metrica)} ({d.unidades.join(', ')}):{' '}
              {d.medicion ? (
                cantidad(d.medicion.valor, d.medicion.unidad)
              ) : (
                <strong>
                  {d.falta?.motivo === 'OTRA_UNIDAD'
                    ? `${COPY_ANTROPOMETRIA.datoEnOtraUnidad} (${d.falta.unidad})`
                    : d.falta?.motivo === 'SIN_VALOR_VIGENTE'
                      ? COPY_ANTROPOMETRIA.datoSinValorVigente
                      : COPY_ANTROPOMETRIA.datoFalta}
                </strong>
              )}
            </li>
          ))}
        </ul>
        {metodo.source ? (
          <p className="nota">
            <strong>{COPY_ANTROPOMETRIA.metodoFuente}:</strong> {metodo.source}
          </p>
        ) : (
          <p className="campo__ayuda">{metodo.provenanceNote}</p>
        )}
        {metodo.population ? (
          <p className="nota">
            <strong>{COPY_ANTROPOMETRIA.metodoPoblacion}:</strong> {metodo.population}
          </p>
        ) : null}
      </div>

      <p className="nota">
        {COPY_ANTROPOMETRIA.explicacionDeAdmisibilidad} {COPY_ANTROPOMETRIA.asignacionAutomatica}
      </p>
      {metodo.requiredInputs.map((e) => (
        <div className="campo" key={e.inputCode}>
          <label htmlFor={`cal-entrada-${e.inputCode}`}>
            {nombreDeMetrica(e.metric)} ({e.acceptedUnits.join(', ')})
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
                {nombreDeMetrica(m.metric)}: {m.effectiveMagnitude ? cantidad(m.effectiveMagnitude.value, m.effectiveMagnitude.unit) : COPY_ANTROPOMETRIA.sinValorVigente} ·{' '}
                {ETIQUETA_DE_CLASE_DE_DATO[m.dataClass]}
                {m.corrections.length > 0 ? ` · ${COPY_ANTROPOMETRIA.corregida}` : ''}
              </option>
            ))}
          </select>
        </div>
      ))}

      <p className="nota">
        {COPY_ANTROPOMETRIA.finalidadDelCalculo}: {metodo.purposes.map((p) => COPY_ANTROPOMETRIA.finalidadDeCalculo[p] ?? p).join(', ')} · {COPY_ANTROPOMETRIA.precisionDeclarada}:{' '}
        {COPY_ANTROPOMETRIA.decimales(metodo.precisionPolicy.decimals)} ·{' '}
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
