'use client';

/**
 * Los resultados calculados de una toma (API-MTH-01, API-CAL-01/02/04; UC-I09; RF-048), en «Tomas» (WP-ESCRITORIO-AREAS,
 * parte 3; maqueta 22).
 *
 * La pantalla dice en voz alta lo que el 06 §20.3 exige y lo que la interfaz podría tapar:
 * - **los cálculos conviven**: van por categoría del catálogo y por método, sin promedio, sin orden por «mejor» y sin
 *   ninguno marcado por BE (REG-06-205). Si el profesional quiere dejar uno como referencia, es un acto suyo;
 * - **la referencia no es una decisión clínica**: no cambia el cálculo, no borra los otros y no crea objetivo ni
 *   prescripción (REG-06-207; INV-06-05). El texto lo dice antes de que apriete el botón;
 * - **qué necesita el método** y con qué medición se cubre cada entrada, porque «disponible» no es «admisible»
 *   (REG-06-204);
 * - cada corrida muestra **método, versión, regla y precisión declarada**, que es lo que la vuelve reproducible
 *   (REG-06-156/158), con sus entradas.
 *
 * Qué cambió respecto de antes: los resultados vigentes van a la vista, cada uno en un renglón con su método y su valor;
 * los que quedaron sin efecto, a pedido («Ver N anteriores, sin efecto»). El detalle de un resultado y «Calcular con un
 * método» se abren en el panel, en vez de empujar las mediciones hacia abajo. Los métodos y las corridas se leen una
 * vez por visita, no en cada cambio de toma: son del asesorado, no de la toma.
 */
import {
  agruparPorCategoria,
  asignacionAutomatica,
  cantidad,
  COPY,
  COPY_ANTROPOMETRIA as C,
  corridaVigente,
  datosDelMetodo,
  ETIQUETA_DE_CLASE_DE_DATO,
  ETIQUETA_DE_CONDICION,
  marcaDeLaClase,
  metodosParaLaToma,
  nombreDeMetrica,
  resultadosDeLaToma,
  todasLasPaginas,
  valorDelResultado,
  type CorridaDeCalculoApi,
  type EvaluacionAntropometricaApi,
  type MetodoApi,
} from '@be/domain';
import { useCallback, useEffect, useState } from 'react';
import { Ayuda } from '../../../../components/ayuda';
import { conNumerosPegados } from '../../../../components/en-partes';
import { Cargando } from '../../../../components/estados';
import { Aviso, Campo } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { fecha } from '../../../../lib/formato';
import { mensajeDeFallo, useClaveDeIntento } from '../../../../lib/intento';
import { useCambiosSinGuardar } from '../marco-del-area';
import { useAntropometria } from './antropometria';
import { Marca } from './marca';

export type Calculos =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'fallo' }
  | {
      readonly tipo: 'listo';
      readonly metodos: readonly MetodoApi[];
      /** Todas las corridas del asesorado: API-CAL-02 no filtra por toma. */
      readonly corridas: readonly CorridaDeCalculoApi[];
      /** Falso si alguna de las dos listas llegó cortada: puede faltar un resultado. */
      readonly completa: boolean;
    };

/**
 * Los métodos del catálogo y las corridas del asesorado, leídos enteros (desde DL-111 el catálogo tiene más métodos que
 * una página, y una corrida de una toma puede estar en cualquier página). Al volver a leer, lo que había sigue a la
 * vista hasta que llega lo nuevo.
 */
export function useCalculosDelAsesorado(): { readonly estado: Calculos; readonly recargar: () => Promise<void> } {
  const { token, asesoradoId, sesionPerdida } = useAntropometria();
  const [estado, setEstado] = useState<Calculos>({ tipo: 'cargando' });
  const recargar = useCallback(async () => {
    setEstado((e) => (e.tipo === 'listo' ? e : { tipo: 'cargando' }));
    const [metodos, corridas] = await Promise.all([todasLasPaginas((f) => api.listarMetodos(token, f)), todasLasPaginas((f) => api.listarCalculos(token, asesoradoId, f))]);
    if (sesionPerdida(metodos) || sesionPerdida(corridas)) return;
    if (!metodos.ok || !corridas.ok) return setEstado({ tipo: 'fallo' });
    setEstado({ tipo: 'listo', metodos: metodos.datos.data, corridas: corridas.datos.data, completa: metodos.datos.completa && corridas.datos.completa });
  }, [token, asesoradoId, sesionPerdida]);
  useEffect(() => {
    void recargar();
  }, [recargar]);
  return { estado, recargar };
}

/** El valor de un resultado, con el número destacado y la unidad al lado. */
function Valor({ corrida }: { corrida: CorridaDeCalculoApi }) {
  // Con la precisión que declara el método, aunque termine en cero (REG-06-158: sin redondeo silencioso).
  const [valor, ...unidad] = valorDelResultado(corrida).split(' ');
  return (
    <span className="resultado-de-la-toma__valor">
      <strong>{valor}</strong>
      {unidad.length > 0 ? <span className="resultado-de-la-toma__unidad"> {unidad.join(' ')}</span> : null}
    </span>
  );
}

export function ResultadosDeLaToma({
  toma,
  calculos,
  onReintentar,
  onAbrir,
  onCalcular,
}: {
  toma: EvaluacionAntropometricaApi;
  calculos: Calculos;
  onReintentar: () => void;
  /** Abre el detalle de un resultado, por su corrida. */
  onAbrir: (corridaId: string) => void;
  onCalcular: () => void;
}) {
  const [verAnteriores, setVerAnteriores] = useState(false);
  const deLaToma = calculos.tipo === 'listo' ? calculos.corridas.filter((c) => c.evaluationId === toma.evaluationId) : [];
  const porId = new Map(deLaToma.map((c) => [c.calculationRunId, c]));
  // Por categoría del catálogo y por método: el orden neutral del dominio, el mismo de la lámina.
  const secciones = calculos.tipo === 'listo' ? agruparPorCategoria(resultadosDeLaToma(calculos.corridas, calculos.metodos, toma.evaluationId)) : [];
  const anteriores = deLaToma.filter((c) => !corridaVigente(c));

  return (
    <section className="resultados-de-la-toma" aria-labelledby="titulo-resultados">
      <div className="toma-abierta__titulo-de-bloque">
        <h3 id="titulo-resultados">{C.resultadosDerivados}</h3>
        <Marca marca={marcaDeLaClase('DERIVED')} />
        <p className="nota">{C.cadaUnoConSuMetodo}</p>
        <span className="toma-abierta__acciones-de-bloque">
          {anteriores.length > 0 ? (
            <button type="button" className="boton boton--enlace" aria-expanded={verAnteriores} aria-controls="anteriores-sin-efecto" onClick={() => setVerAnteriores((x) => !x)}>
              {verAnteriores ? C.ocultarAnteriores : C.verAnterioresSinEfecto(anteriores.length)}
            </button>
          ) : null}
          {calculos.tipo === 'listo' ? (
            <button type="button" className="boton boton--secundario boton--compacto" onClick={onCalcular} disabled={calculos.metodos.length === 0}>
              <Icono nombre="mas" tamano={18} />
              {C.nuevoCalculo}
            </button>
          ) : null}
        </span>
      </div>

      {calculos.tipo === 'cargando' ? <Cargando /> : null}
      {/* Una falla de esta lectura no es «todavía no hay cálculos». */}
      {calculos.tipo === 'fallo' ? (
        <Aviso tipo="error">
          <p>
            {C.resultadosNoCargaron}{' '}
            <button type="button" className="boton boton--enlace" onClick={onReintentar}>
              {COPY.reintentar}
            </button>
          </p>
        </Aviso>
      ) : null}
      {calculos.tipo === 'listo' ? (
        <>
          {!calculos.completa ? <p className="nota">{C.resultadosIncompletos}</p> : null}
          {calculos.metodos.length === 0 ? <p className="nota">{C.sinMetodosSeleccionables}</p> : null}
          {secciones.length === 0 ? <p className="nota resultados-de-la-toma__sin-calculos">{C.sinCalculos}</p> : null}
          <div className="categorias-de-resultados">
            {secciones.map((s) => (
              <section key={s.categoria ?? 'OTROS'} className="categoria-de-resultados" data-categoria={s.categoria ?? 'OTROS'}>
                <h4>{s.categoria ? (C.categoriaDeMetodo[s.categoria] ?? s.categoria) : C.laminaOtrosCalculos}</h4>
                <ul>
                  {s.resultados.map((r) => {
                    const corrida = porId.get(r.corridaId);
                    if (!corrida) return null;
                    return (
                      <li key={r.corridaId}>
                        <button
                          type="button"
                          className="resultado-de-la-toma"
                          data-resultado={r.corridaId}
                          aria-label={[`${r.metodo}: ${r.nombre}, ${valorDelResultado(corrida)}`, ...(corrida.referenceForPurpose ? [C.referenciaAdoptada] : [])].join(' · ')}
                          onClick={() => onAbrir(r.corridaId)}
                        >
                          <span className="resultado-de-la-toma__que">
                            {/* El nombre de un método puede traer un número («7 pliegues»): no se separa de su palabra. */}
                            <span className="resultado-de-la-toma__nombre">{conNumerosPegados(r.metodo)}</span>
                            {corrida.referenceForPurpose ? <span className="etiqueta-de-dato">{C.referenciaAdoptada}</span> : null}
                          </span>
                          <Valor corrida={corrida} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
          {verAnteriores ? (
            <div className="anteriores-sin-efecto" id="anteriores-sin-efecto">
              <h4>{C.anterioresSinEfecto}</h4>
              <p className="nota">{C.explicacionDeAnterioresSinEfecto}</p>
              <ul>
                {anteriores.map((c) => (
                  <li key={c.calculationRunId}>
                    <button type="button" className="resultado-de-la-toma" data-resultado={c.calculationRunId} aria-label={`${c.methodName}: ${nombreDeMetrica(c.result.metric)}, ${valorDelResultado(c)} · ${C.calculoNoVigente}`} onClick={() => onAbrir(c.calculationRunId)}>
                      <span className="resultado-de-la-toma__que">
                        <span className="resultado-de-la-toma__nombre">{conNumerosPegados(c.methodName)}</span>
                        <span className="etiqueta-de-dato">{C.calculoNoVigente}</span>
                      </span>
                      <Valor corrida={c} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

/**
 * Un resultado calculado, en el panel: el valor con su precisión, con qué se calculó (método, versión, regla y entradas)
 * y, si es de una toma registrada y está vigente, «Dejar como referencia».
 */
export function DetalleDeResultado({ corrida, hecho, onHecho }: { corrida: CorridaDeCalculoApi; hecho: string | null; onHecho: (texto: string) => Promise<void> }) {
  const { token, asesoradoId, sesionPerdida, accesoRetirado } = useAntropometria();
  const intento = useClaveDeIntento();
  const [adoptando, setAdoptando] = useState(false);
  const [fundamento, setFundamento] = useState('');
  useCambiosSinGuardar(adoptando && fundamento.trim() !== '', 'el fundamento de un resultado');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vigente = corridaVigente(corrida);

  /** El token de la referencia vigente viaja en la corrida: sin él, reemplazarla pisaría la decisión anterior. */
  async function adoptar(expectedVersion: string | null) {
    setError(null);
    setEnviando(true);
    const res = await api.adoptarReferenciaDeCalculo(token, asesoradoId, corrida.purpose, { calculationRunId: corrida.calculationRunId, expectedVersion, rationale: fundamento.trim() || null }, intento.actual());
    intento.registrar(res);
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return setEnviando(false);
    if (!res.ok) {
      setEnviando(false);
      return setError(mensajeDeFallo(res));
    }
    await onHecho(res.datos.data.supersedesReferenceId ? `${C.referenciaHecha} ${C.referenciaReemplazada}` : C.referenciaHecha);
    setEnviando(false);
    setAdoptando(false);
    setFundamento('');
  }

  return (
    <div className="medicion-abierta resultado-abierto" data-resultado={corrida.calculationRunId}>
      <p className="nota medicion-abierta__de-donde">{conNumerosPegados(corrida.methodName)}</p>
      {hecho ? (
        <Aviso tipo="exito">
          <p>{hecho}</p>
        </Aviso>
      ) : null}
      <div className="medicion-abierta__titular">
        <p className="medicion-abierta__valor">{valorDelResultado(corrida)}</p>
        <span className="medicion-abierta__marcas">
          <Marca marca={marcaDeLaClase('DERIVED')} />
          {corrida.evaluationContext === 'IN_PREPARATION' ? <span className="etiqueta-de-dato">{C.calculoEnPreparacion}</span> : null}
          {!vigente ? <span className="etiqueta-de-dato">{C.calculoNoVigente}</span> : null}
          {corrida.referenceForPurpose ? <span className="etiqueta-de-dato">{C.referenciaAdoptada}</span> : null}
        </span>
      </div>
      <dl className="medicion-abierta__datos">
        <div>
          <dt>{C.queSeCalculo}</dt>
          <dd>{nombreDeMetrica(corrida.result.metric)}</dd>
        </div>
        <div>
          <dt>{C.calculadoEl}</dt>
          <dd>{fecha(corrida.recordedAt)}</dd>
        </div>
      </dl>
      {corrida.supersedesRunId ? <p className="nota">{C.corridaReemplazada}</p> : null}
      {!vigente ? <p className="nota">{C.explicacionDeCalculoNoVigente}</p> : null}
      <p className="nota">{C.noEsDiagnostico}</p>

      {/* Lo que vuelve reproducible la corrida (REG-06-156/158): versión, regla, precisión y entradas. */}
      <section className="medicion-abierta__bloque" aria-labelledby="titulo-entradas">
        <h3 id="titulo-entradas">{C.entradasDelCalculo}</h3>
        <p className="nota">
          {conNumerosPegados(`${C.versionDelMetodo} ${corrida.methodVersion} · ${C.reglaAplicada}: ${corrida.ruleId} · ${C.precisionDeclarada}: ${C.decimales(corrida.precision.decimals)}`)}
        </p>
        <ul className="entradas-del-calculo">
          {corrida.inputProvenance.map((i) => (
            <li key={`${i.inputCode}-${i.sourceRef}`}>
              <span className="entradas-del-calculo__nombre">{nombreDeMetrica(i.metric)}</span>
              <span className="entradas-del-calculo__valor">{i.magnitude ? cantidad(i.magnitude.value, i.magnitude.unit) : C.valorNoConsultable}</span>
              <span className="nota entradas-del-calculo__de-donde">
                {ETIQUETA_DE_CLASE_DE_DATO[i.provenanceType === 'SELF_REPORTED' ? 'REPORTED' : 'MEASURED']} · {ETIQUETA_DE_CONDICION[i.condition]} · {fecha(i.sourceOccurredAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {error ? (
        <Aviso tipo="error" enfocar>
          <p>{error}</p>
        </Aviso>
      ) : null}

      {!corrida.referenceForPurpose && !adoptando && corrida.evaluationContext === 'REGISTERED' && vigente ? (
        <div className="medicion-abierta__pie">
          <div className="acciones acciones--en-linea">
            <button type="button" className="boton boton--secundario" onClick={() => setAdoptando(true)}>
              {C.adoptarReferencia}
            </button>
          </div>
        </div>
      ) : null}

      {adoptando ? (
        <div className="medicion-abierta__pie" data-formulario="referencia">
          {/* Lo que hay que saber antes de dejarlo como referencia queda a la vista, arriba del botón. */}
          <Aviso tipo="info">
            <p>{C.explicacionDeReferencia}</p>
          </Aviso>
          <Campo id={`ref-fundamento-${corrida.calculationRunId}`} etiqueta={C.fundamentoDeLaReferencia} value={fundamento} onChange={(e) => setFundamento(e.target.value)} maxLength={1000} />
          <div className="acciones">
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => {
                setAdoptando(false);
                setError(null);
              }}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button type="button" className="boton boton--primario" onClick={() => void adoptar(corrida.referenceVersion)} disabled={enviando}>
              {C.adoptarReferencia}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** La categoría del método delante de su nombre, como en el desplegable. */
const etiquetaDeCategoria = (m: MetodoApi): string => (m.category ? `${C.categoriaDeMetodo[m.category] ?? m.category} · ` : '');

/**
 * «Calcular con un método», en el panel: el método en dos grupos (los que esta toma cubre y los que no), su ficha —qué
 * es, qué da, qué pide y de dónde sale— y de qué medición sale cada dato. Lo que hace falta para decidir no se pliega.
 */
export function NuevoCalculo({
  evaluacion,
  metodos,
  corridas,
  onCerrar,
  onHecho,
}: {
  evaluacion: EvaluacionAntropometricaApi;
  metodos: readonly MetodoApi[];
  /** Las corridas de esta toma: para avisar si el mismo resultado ya está calculado con otro método. */
  corridas: readonly CorridaDeCalculoApi[];
  onCerrar: () => void;
  /** El cálculo se registró: el texto para decirlo y la corrida nueva, para mostrarla. */
  onHecho: (texto: string, corridaId: string) => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);
  // Solo las mediciones vigentes: una anulada dejó de contar, también como entrada (REG-06-217).
  const disponibles = evaluacion.measurements.filter((m) => m.condition === 'EFFECTIVE');

  function elegirMetodo(id: string) {
    const elegido = metodos.find((m) => m.methodVersionId === id);
    setMetodoId(id);
    setError(null);
    setEntradas(elegido ? asignacionAutomatica(datosDelMetodo(elegido, evaluacion.measurements)) : {});
  }

  async function ejecutar() {
    setError(null);
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
    // Una escritura denegada retira el contenido de la pestaña entera (B10-06:1145-1148).
    if (sesionPerdida(res) || accesoRetirado(res)) return setEnviando(false);
    if (!res.ok) {
      setEnviando(false);
      return setError(mensajeDeFallo(res));
    }
    await onHecho(C.calculoHecho, res.datos.data.calculationRunId);
    setEnviando(false);
  }

  const completo = metodo.requiredInputs.every((e) => entradas[e.inputCode]);
  // DL-113 · las variantes por sexo de un método dan la misma métrica (DL-112): si la toma ya la tiene calculada con
  // otro método, las dos corridas conviven. La evolución muestra las dos, cada una con su método, pero «Tu última toma»
  // de la APK muestra una sola por métrica: la registrada al final (`ultimaToma`). Se avisa antes de calcular, sin
  // elegir por el profesional.
  const yaCalculada = corridas.find((c) => c.effective && c.result.metric === metodo.output.metric && c.methodId !== metodo.methodId);
  const opcion = (m: MetodoApi) => (
    <option key={m.methodVersionId} value={m.methodVersionId}>
      {etiquetaDeCategoria(m)}
      {m.name} · {C.versionDelMetodo} {m.version}
    </option>
  );

  return (
    <div className="nuevo-calculo">
      <div className="campo">
        <label htmlFor="cal-metodo">{C.metodo}</label>
        <select id="cal-metodo" value={metodoId} onChange={(e) => elegirMetodo(e.target.value)}>
          {posibles.length > 0 ? <optgroup label={C.metodosPosibles}>{posibles.map(opcion)}</optgroup> : null}
          {faltanDatos.length > 0 ? <optgroup label={C.metodosConDatosFaltantes}>{faltanDatos.map(opcion)}</optgroup> : null}
        </select>
      </div>

      {/* La ficha del método: qué es, qué da, qué pide (y si esta toma lo tiene) y de dónde sale (DL-111). */}
      <div className="ficha-de-metodo" aria-live="polite">
        {/* DL-113 · el nombre completo: en el desplegable se corta, y es lo que identifica al método. */}
        <p className="ficha-de-metodo__nombre">
          {etiquetaDeCategoria(metodo)}
          {metodo.name} · {C.versionDelMetodo} {metodo.version}
        </p>
        {metodo.description ? <p>{metodo.description}</p> : null}
        <p>
          <strong>{C.metodoDa}:</strong> {nombreDeMetrica(metodo.output.metric)} ({metodo.output.unit})
        </p>
        <p>
          <strong>{C.metodoPide}:</strong>
        </p>
        <ul className="ficha-de-metodo__datos">
          {datos.map((d) => {
            // El valor con el que se va a calcular: el de la medición asignada, sola o elegida por el profesional.
            const elegida = disponibles.find((m) => m.measurementId === entradas[d.codigo]);
            return (
              <li key={d.codigo}>
                {nombreDeMetrica(d.metrica)}
                {elegida?.effectiveMagnitude ? '' : ` (${d.unidades.join(', ')})`}:{' '}
                {elegida ? (
                  elegida.effectiveMagnitude ? (
                    <>
                      {cantidad(elegida.effectiveMagnitude.value, elegida.effectiveMagnitude.unit)}
                      {elegida.metric !== d.metrica ? ` (${nombreDeMetrica(elegida.metric)})` : ''}
                    </>
                  ) : (
                    <strong>{C.sinValorVigente}</strong>
                  )
                ) : (
                  <strong>{d.falta?.motivo === 'OTRA_UNIDAD' ? `${C.datoEnOtraUnidad} (${d.falta.unidad})` : d.falta?.motivo === 'SIN_VALOR_VIGENTE' ? C.datoSinValorVigente : d.falta ? C.datoFalta : 'Sin elegir'}</strong>
                )}
              </li>
            );
          })}
        </ul>
        {metodo.population ? (
          <p className="nota">
            <strong>{C.metodoPoblacion}:</strong> {metodo.population}
          </p>
        ) : null}
        {yaCalculada ? (
          <Aviso tipo="info">
            <p>
              Esta toma ya tiene «{nombreDeMetrica(metodo.output.metric)}» calculada con «{yaCalculada.methodName}». Si calculás también este método, los dos resultados conviven: en la evolución se ven los dos, cada uno
              con su método, y en la APK la persona ve el último que se registró.
            </p>
          </Aviso>
        ) : null}
        <Ayuda titulo="Fuente y regla del método">
          {metodo.source ? (
            <p>
              <strong>{C.metodoFuente}:</strong> {metodo.source}
            </p>
          ) : (
            <p>{metodo.provenanceNote}</p>
          )}
          <p>
            {C.finalidadDelCalculo}: {metodo.purposes.map((p) => C.finalidadDeCalculo[p] ?? p).join(', ')} · {C.precisionDeclarada}: {C.decimales(metodo.precisionPolicy.decimals)} · {C.reglaAplicada}: {metodo.ruleId}
          </p>
        </Ayuda>
      </div>

      {/*
        Cada dato ya sale de la medición de la toma con la misma clave y la ficha muestra su valor. Cambiarlo es la
        excepción, así que los desplegables quedan plegados (DL-113).
      */}
      <details className="ayuda">
        <summary>Cambiar de qué medición sale cada dato</summary>
        <p className="nota">
          {C.asignacionAutomatica} {C.explicacionDeAdmisibilidad}
        </p>
        {metodo.requiredInputs.map((e) => (
          <div className="campo" key={e.inputCode}>
            <label htmlFor={`cal-entrada-${e.inputCode}`}>
              {nombreDeMetrica(e.metric)} ({e.acceptedUnits.join(', ')})
            </label>
            <select id={`cal-entrada-${e.inputCode}`} value={entradas[e.inputCode] ?? ''} onChange={(ev) => setEntradas((x) => ({ ...x, [e.inputCode]: ev.target.value }))}>
              <option value="">{C.elegirEntrada}</option>
              {/*
                El desplegable ofrece el valor con el que se va a calcular, que es el que rige (REG-06-16). Con la cadena
                sin resolver no se ofrece un valor: la admisibilidad va a rechazar esa entrada.
              */}
              {disponibles.map((m) => (
                <option key={m.measurementId} value={m.measurementId}>
                  {nombreDeMetrica(m.metric)}: {m.effectiveMagnitude ? cantidad(m.effectiveMagnitude.value, m.effectiveMagnitude.unit) : C.sinValorVigente} · {ETIQUETA_DE_CLASE_DE_DATO[m.dataClass]}
                  {m.corrections.length > 0 ? ` · ${C.corregida}` : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </details>

      {error ? (
        <Aviso tipo="error" enfocar>
          <p>{error}</p>
        </Aviso>
      ) : null}

      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" className="boton boton--primario" onClick={() => void ejecutar()} disabled={enviando || !completo}>
          {C.ejecutarCalculo}
        </button>
      </div>
    </div>
  );
}
