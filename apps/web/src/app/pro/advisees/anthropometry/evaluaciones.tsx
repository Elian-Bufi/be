'use client';

/**
 * «Tomas» (B10-07; API-ANT-03/04/05/08/12; WP-ESCRITORIO-AREAS, parte 3; maquetas 22 y 29): lo que ya es historia, en
 * solo lectura. Una toma registrada no se edita: cada medición se corrige o se anula, y queda constancia (REG-06-219).
 *
 * - **La lista se lee entera, una vez,** y va por cuándo se tomó cada toma, la más nueva primero, en tramos seguidos del
 *   mismo protocolo. La lista de la API no trae el protocolo ni las correcciones de cada toma: salen de su detalle, que
 *   se lee después de la toma abierta, de a tres y hasta veinte. Mientras no llega, la fila dice lo que ya se sabe.
 * - **Cambiar de toma no vuelve a leer nada** si su detalle ya llegó. La toma elegida va en la dirección (`evaluacion=`).
 * - **La toma abierta dice una vez lo que vale para toda la toma** (el protocolo, cuándo se registró, la clase del dato)
 *   y, de cada medición, solo lo que se sale de lo común. El valor de cada fila es el que rige (REG-06-16): lo decide el
 *   dominio (`medicionesPorFamilia`), no esta pantalla.
 * - **Corregir y anular están en el panel de cada medición,** con su historia a la vista; ya no en cada fila.
 * - Después de una escritura se vuelven a leer esa toma y los cálculos: nada más.
 *
 * Las reglas —el orden, los tramos, las cuentas, las marcas, la historia y lo que cambió con una corrección— están en
 * `tomas-de-antropometria.ts`, con sus pruebas.
 */
import {
  COPY,
  COPY_ANTROPOMETRIA as C,
  COPY_EVOLUCION,
  cuentasDeLaTomaEnPalabras,
  marcaDeLaClase,
  medicionesPorFamilia,
  nombreDeMetrica,
  resumenDeLaToma,
  todasLasPaginas,
  tomasDeLaMasNueva,
  tramosDeProtocolo,
  type EvaluacionAntropometricaApi,
  type FamiliaDeMedicion,
  type NombreDeIcono,
  type ResumenDeEvaluacionApi,
  type ResumenDeLaToma,
  type TramoDeTomas,
} from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AvisoFlotante } from '../../../../components/ayuda';
import { conNumerosPegados, EnPartes } from '../../../../components/en-partes';
import { EstadoVacio } from '../../../../components/estados';
import { Aviso } from '../../../../components/formulario';
import { Icono } from '../../../../components/icono';
import { Panel } from '../../../../components/panel';
import { api, type Resultado } from '../../../../lib/api';
import { dia, fecha, horaDelDia } from '../../../../lib/formato';
import { EstadoDeLectura, useAntropometria } from './antropometria';
import { DetalleDeResultado, NuevoCalculo, ResultadosDeLaToma, useCalculosDelAsesorado, type Calculos } from './calculos';
import { Marca } from './marca';
import { DetalleDeMedicion } from './medicion';

/** De cuántas tomas se lee el detalle para decir su protocolo y sus correcciones en la lista: las más recientes. */
const TOMAS_CON_DETALLE = 20;
/** Cuántos detalles se piden a la vez: cada uno es una lectura protegida, y cuenta para el cupo del profesional. */
const DETALLES_A_LA_VEZ = 3;
/**
 * Hasta cuántas mediciones una toma se muestra con sus familias una al lado de la otra. Con más, cada familia tiene su
 * lugar fijo (lo corto, los pliegues y los perímetros), que es como se lee un perfil completo.
 */
const POCAS_MEDICIONES = 6;

type Lista = {
  readonly tomas: readonly ResumenDeEvaluacionApi[];
  /** Falso si la lista llegó cortada: la cantidad es «al menos». */
  readonly completa: boolean;
  /** La toma en preparación, si hay una y se pudo leer. */
  readonly borrador: { readonly mediciones: number } | null;
};

type Detalle = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly toma: EvaluacionAntropometricaApi } | { readonly tipo: 'no-disponible' } | { readonly tipo: 'fallo' };

/** «24 sept 2026 · 08:40»: el día y la hora de la toma, como en la lista de la maqueta. */
const momentoDeLaToma = (iso: string): string => `${dia(iso)} · ${horaDelDia(new Date(iso))}`;

export function VistaDeEvaluaciones() {
  const { token, asesoradoId, sesionPerdida, irA, parametros, avisoDeTomas, avisarEnTomas } = useAntropometria();
  const pedida = parametros.get('evaluacion');
  const [lista, setLista] = useState<Resultado<Lista> | null>(null);
  const [detalles, setDetalles] = useState<ReadonlyMap<string, Detalle>>(() => new Map());
  /** Las tomas cuyo detalle ya se pidió: ninguna se pide dos veces por haber cambiado de toma. */
  const pedidos = useRef(new Set<string>());
  const calculos = useCalculosDelAsesorado();

  const cargar = useCallback(async () => {
    setLista(null);
    const [tomas, borradores] = await Promise.all([
      todasLasPaginas((f) => api.listarEvaluacionesAntropometricas(token, asesoradoId, f)),
      api.listarBorradoresAntropometricos(token, asesoradoId),
    ]);
    if (sesionPerdida(tomas) || sesionPerdida(borradores)) return;
    if (!tomas.ok) return setLista(tomas as Resultado<never>);
    // La toma en preparación es un dato aparte: si su lectura falla, la lista se muestra igual y el botón no la anuncia.
    const borrador = borradores.ok ? (borradores.datos.data[0] ?? null) : null;
    setLista({
      ok: true,
      datos: {
        tomas: tomasDeLaMasNueva(tomas.datos.data.filter((t) => t.state === 'REGISTERED')),
        completa: tomas.datos.completa,
        borrador: borrador ? { mediciones: borrador.summary.measurementCount } : null,
      },
    });
  }, [token, asesoradoId, sesionPerdida]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /** Lee el detalle de una toma. Si ya había uno a la vista, sigue ahí hasta que llega el nuevo: la pantalla no salta. */
  const leerDetalle = useCallback(
    async (id: string) => {
      setDetalles((d) => (d.get(id)?.tipo === 'listo' ? d : new Map(d).set(id, { tipo: 'cargando' })));
      const r = await api.consultarEvaluacionAntropometrica(token, id);
      if (sesionPerdida(r)) return;
      // El 404 es neutral: no existe, o no está autorizada. No se distingue, como en toda la API.
      const noDisponible = !r.ok && r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND';
      setDetalles((d) => new Map(d).set(id, r.ok ? { tipo: 'listo', toma: r.datos.data } : { tipo: noDisponible ? 'no-disponible' : 'fallo' }));
    },
    [token, sesionPerdida],
  );
  const pedirDetalle = useCallback(
    (id: string) => {
      if (pedidos.current.has(id)) return Promise.resolve();
      pedidos.current.add(id);
      return leerDetalle(id);
    },
    [leerDetalle],
  );

  const tomas = lista?.ok ? lista.datos.tomas : null;
  // Desde la evolución o la lámina llega `evaluacion=`: es la toma de origen de una observación (RF-049). Sin ese
  // parámetro abre la más reciente.
  const abiertaId = pedida ?? tomas?.[0]?.evaluationId ?? null;

  // La toma abierta se lee primero. Las demás, después y de a pocas, para decir en la lista su protocolo y sus
  // correcciones; al cambiar de toma, la cola sigue con las que faltan.
  useEffect(() => {
    if (!tomas) return;
    let vivo = true;
    void (async () => {
      if (abiertaId) await pedirDetalle(abiertaId);
      const cola = tomas
        .slice(0, TOMAS_CON_DETALLE)
        .map((t) => t.evaluationId)
        .filter((id) => !pedidos.current.has(id));
      while (vivo && cola.length > 0) await Promise.all(cola.splice(0, DETALLES_A_LA_VEZ).map(pedirDetalle));
    })();
    return () => {
      vivo = false;
    };
  }, [tomas, abiertaId, pedirDetalle]);

  const resumenes = useMemo(() => {
    const m = new Map<string, ResumenDeLaToma>();
    for (const [id, d] of detalles) if (d.tipo === 'listo') m.set(id, resumenDeLaToma(d.toma.measurements));
    return m;
  }, [detalles]);
  const tramos = useMemo(() => tramosDeProtocolo(tomas ?? [], (t) => resumenes.get(t.evaluationId)?.protocolo), [tomas, resumenes]);

  /** Después de corregir, anular, calcular o dejar una referencia: se vuelven a leer esa toma y los cálculos. */
  const recargarCalculos = calculos.recargar;
  const volverALeer = useCallback((id: string) => Promise.all([leerDetalle(id), recargarCalculos()]).then(() => undefined), [leerDetalle, recargarCalculos]);
  // Vuelve a la lista sin la toma pedida: saca el parámetro de la dirección y abre la más reciente, como al entrar.
  const volverALaLista = () => irA('evaluaciones');
  const abierta = abiertaId ? detalles.get(abiertaId) : undefined;
  const cuentasDe = (t: ResumenDeEvaluacionApi): string =>
    cuentasDeLaTomaEnPalabras(resumenes.get(t.evaluationId)?.cuentas ?? { mediciones: t.summary.measurementCount, corregidas: null, anuladas: t.summary.annulledCount });

  return (
    <section className="registros tomas-del-area" aria-labelledby="titulo-tomas">
      {/* Lo que se acaba de hacer en la carga («Toma registrada…»), dicho donde se está mirando, sin mover la página. */}
      {avisoDeTomas ? (
        <AvisoFlotante onCerrar={() => avisarEnTomas(null)}>
          <p>{avisoDeTomas}</p>
        </AvisoFlotante>
      ) : null}
      <div className="registros__encabezado">
        <h2 id="titulo-tomas">{C.tomas}</h2>
        <p className="nota registros__bajada">
          {tomas && tomas.length > 0 ? (
            <span data-cuenta-de-tomas>
              {lista?.ok && !lista.datos.completa ? 'Al menos ' : ''}
              {C.tomasRegistradas(tomas.length)}{' '}
            </span>
          ) : null}
          {C.unaTomaNoSeEdita}
        </p>
        {lista?.ok ? (
          <div className="tomas-del-area__preparar">
            {lista.datos.borrador ? <p className="nota">{C.hayUnaTomaEnPreparacion(lista.datos.borrador.mediciones)}</p> : null}
            <button type="button" className="boton boton--primario" onClick={() => irA('preparacion')}>
              <Icono nombre={lista.datos.borrador ? 'borrador' : 'mas'} tamano={18} />
              {lista.datos.borrador ? C.retomarBorrador : C.prepararUnaToma}
            </button>
          </div>
        ) : null}
      </div>

      <EstadoDeLectura r={lista} onReintentar={() => void cargar()}>
        {tomas ? (
          tomas.length === 0 ? (
            <EstadoVacio titulo={C.sinEvaluaciones}>
              <p className="nota">{C.borradorNoEsHistoria}</p>
            </EstadoVacio>
          ) : (
            <div className="tomas-del-area__cuerpo">
              <nav className="tomas-del-area__lista" aria-label="Tomas registradas">
                {tramos.map((tramo, i) => (
                  <div key={`${i}-${tramo.tomas[0]!.evaluationId}`} className="tramo-de-tomas" data-protocolo={tramo.protocolo ?? ''}>
                    {tramo.protocolo ? (
                      <p className="tramo-de-tomas__protocolo">
                        <Icono nombre="protocolo" tamano={15} />
                        {tramo.protocolo}
                      </p>
                    ) : null}
                    <ol className="tramo-de-tomas__tomas">
                      {tramo.tomas.map((t) => (
                        <li key={t.evaluationId}>
                          <button type="button" className="toma-de-la-lista" data-toma={t.evaluationId} aria-current={t.evaluationId === abiertaId ? 'true' : undefined} onClick={() => irA('evaluaciones', t.evaluationId)}>
                            <span className="toma-de-la-lista__fecha">{momentoDeLaToma(t.occurredAt)}</span>
                            {/* Si las cuentas no entran en un renglón, baja una entera: «1» no queda arriba y «anulada» abajo. */}
                            <span className="toma-de-la-lista__cuentas">
                              <EnPartes texto={cuentasDe(t)} />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
                {tomas.length > TOMAS_CON_DETALLE ? <p className="nota">El protocolo y las correcciones se leyeron de las {TOMAS_CON_DETALLE} tomas más recientes.</p> : null}
              </nav>

              {/* En una ventana angosta la lista pasa arriba, como un selector: las mismas tomas, con los mismos datos. */}
              <SelectorDeToma tramos={tramos} abiertaId={abiertaId} cuentasDe={cuentasDe} onElegir={(id) => irA('evaluaciones', id)} />

              <div className="tomas-del-area__toma">
                {!abiertaId || !abierta || abierta.tipo === 'cargando' ? (
                  <p className="cargando" role="status">
                    {C.leyendoLaToma}
                  </p>
                ) : null}
                {abierta?.tipo === 'no-disponible' ? (
                  <Aviso tipo="info" enfocar>
                    <p>
                      {COPY_EVOLUCION.evaluacionNoDisponible}{' '}
                      <button type="button" className="boton boton--enlace" onClick={volverALaLista}>
                        {COPY_EVOLUCION.volverALaLista}
                      </button>
                    </p>
                  </Aviso>
                ) : null}
                {abierta?.tipo === 'fallo' && abiertaId ? (
                  <Aviso tipo="error" enfocar>
                    <p>
                      {COPY_EVOLUCION.evaluacionNoCargo}{' '}
                      <button type="button" className="boton boton--enlace" onClick={() => void leerDetalle(abiertaId)}>
                        {COPY.reintentar}
                      </button>
                      {pedida ? (
                        <>
                          {' '}
                          ·{' '}
                          <button type="button" className="boton boton--enlace" onClick={volverALaLista}>
                            {COPY_EVOLUCION.volverALaLista}
                          </button>
                        </>
                      ) : null}
                    </p>
                  </Aviso>
                ) : null}
                {abierta?.tipo === 'listo' ? <TomaAbierta key={abierta.toma.evaluationId} toma={abierta.toma} calculos={calculos.estado} onReintentarLosCalculos={() => void recargarCalculos()} volverALeer={volverALeer} /> : null}
              </div>
            </div>
          )
        ) : null}
      </EstadoDeLectura>
    </section>
  );
}

/** La lista de tomas como un selector, para una ventana donde no entra al costado. */
function SelectorDeToma({
  tramos,
  abiertaId,
  cuentasDe,
  onElegir,
}: {
  tramos: readonly TramoDeTomas<ResumenDeEvaluacionApi>[];
  abiertaId: string | null;
  cuentasDe: (t: ResumenDeEvaluacionApi) => string;
  onElegir: (id: string) => void;
}) {
  const id = useId();
  const opcion = (t: ResumenDeEvaluacionApi) => (
    <option key={t.evaluationId} value={t.evaluationId}>
      {momentoDeLaToma(t.occurredAt)} · {cuentasDe(t)}
    </option>
  );
  return (
    <div className="campo tomas-del-area__selector">
      <label htmlFor={id}>{C.elegirToma}</label>
      <select id={id} value={abiertaId ?? ''} onChange={(e) => onElegir(e.target.value)}>
        {/* Una toma pedida por la dirección que no está en la lista: el selector la nombra así, sin inventarle una fecha. */}
        {abiertaId && !tramos.some((tramo) => tramo.tomas.some((t) => t.evaluationId === abiertaId)) ? <option value={abiertaId}>La toma solicitada</option> : null}
        {tramos.map((tramo, i) =>
          tramo.protocolo ? (
            <optgroup key={`${i}-${tramo.tomas[0]!.evaluationId}`} label={tramo.protocolo}>
              {tramo.tomas.map(opcion)}
            </optgroup>
          ) : (
            tramo.tomas.map(opcion)
          ),
        )}
      </select>
    </div>
  );
}

type PanelAbierto = { readonly tipo: 'medicion'; readonly id: string } | { readonly tipo: 'resultado'; readonly id: string } | { readonly tipo: 'calcular' } | null;

const ICONO_DE_FAMILIA: Readonly<Partial<Record<FamiliaDeMedicion, NombreDeIcono>>> = { PLIEGUES: 'pliegue', PERIMETROS: 'perimetro' };

/**
 * La toma elegida: lo que vale para toda la toma, dicho una vez; sus resultados calculados; y sus mediciones, por
 * familia. Una medición, un resultado y «Calcular con un método» se abren encima, en un panel que retiene el foco.
 */
function TomaAbierta({
  toma,
  calculos,
  onReintentarLosCalculos,
  volverALeer,
}: {
  toma: EvaluacionAntropometricaApi;
  calculos: Calculos;
  onReintentarLosCalculos: () => void;
  volverALeer: (id: string) => Promise<void>;
}) {
  const { irA } = useAntropometria();
  const [panel, setPanel] = useState<PanelAbierto>(null);
  /** Lo que se acaba de hacer en el panel, dicho adentro: un aviso de la página quedaría detrás del diálogo. */
  const [hecho, setHecho] = useState<string | null>(null);
  const resumen = useMemo(() => resumenDeLaToma(toma.measurements), [toma.measurements]);
  const familias = useMemo(() => medicionesPorFamilia(toma.measurements), [toma.measurements]);
  const pocas = toma.measurements.length <= POCAS_MEDICIONES;
  const corridas = calculos.tipo === 'listo' ? calculos.corridas : null;

  const cerrar = () => {
    setPanel(null);
    setHecho(null);
  };
  /** Una escritura salió bien: se dice en el panel y se vuelven a leer la toma y los cálculos, con el panel abierto. */
  const despuesDeEscribir = async (texto: string) => {
    setHecho(texto);
    await volverALeer(toma.evaluationId);
  };

  const medicion = panel?.tipo === 'medicion' ? (toma.measurements.find((m) => m.measurementId === panel.id) ?? null) : null;
  const resultado = panel?.tipo === 'resultado' ? (corridas?.find((c) => c.calculationRunId === panel.id) ?? null) : null;
  const metadatos = [
    resumen.protocolo,
    cuentasDeLaTomaEnPalabras(resumen.cuentas),
    toma.registeredAt ? `${C.registradaEl} ${fecha(toma.registeredAt)} ${C.registradaPor} ${toma.author.displayName}` : null,
    toma.context ? `${C.contextoDeLaToma}: «${toma.context}»` : null,
  ].filter((p): p is string => p !== null);

  return (
    <article className="toma-abierta" aria-labelledby="titulo-toma" data-toma={toma.evaluationId}>
      <div className="toma-abierta__encabezado">
        <h2 id="titulo-toma">
          {C.tomaDel} {fecha(toma.occurredAt)}
        </h2>
        {/* La clase del dato, una vez, si todas las mediciones la comparten; si no, cada fila dice la suya. */}
        {resumen.claseComun ? <Marca marca={marcaDeLaClase(resumen.claseComun)} /> : null}
        {/* DL-111 · la lámina del compositor con esta toma. */}
        <button type="button" className="boton boton--secundario toma-abierta__lamina" onClick={() => irA('lamina', toma.evaluationId)}>
          <Icono nombre="imagen" tamano={18} />
          {C.verLamina}
        </button>
      </div>
      <p className="metadatos toma-abierta__metadatos">{conNumerosPegados(metadatos.join(' · '))}</p>

      <ResultadosDeLaToma toma={toma} calculos={calculos} onReintentar={onReintentarLosCalculos} onAbrir={(id) => setPanel({ tipo: 'resultado', id })} onCalcular={() => setPanel({ tipo: 'calcular' })} />

      <section className="mediciones-de-la-toma" aria-labelledby="titulo-mediciones">
        <div className="toma-abierta__titulo-de-bloque">
          <h3 id="titulo-mediciones">{C.mediciones}</h3>
          <p className="nota">{C.elegiUnaMedicion}</p>
        </div>
        {/* Una toma de pocas mediciones no reserva el lugar de las familias que no tiene: van una al lado de la otra. */}
        <div className={pocas ? 'familias-de-la-toma familias-de-la-toma--pocas' : 'familias-de-la-toma'}>
          {familias.map((f) => (
            <section key={f.familia} className="familia-de-la-toma" data-familia={f.familia} aria-labelledby={`familia-${f.familia}`}>
              <h4 id={`familia-${f.familia}`}>
                {ICONO_DE_FAMILIA[f.familia] ? <Icono nombre={ICONO_DE_FAMILIA[f.familia]!} tamano={18} /> : null}
                {f.titulo}
                {f.unidad ? <span className="familia-de-la-toma__unidad"> · {f.unidad}</span> : null}
              </h4>
              <ul className="mediciones-de-la-familia">
                {f.filas.map((m) => (
                  <li key={m.id}>
                    {/* La fila entera abre la medición. El lector de pantalla oye el nombre completo y el valor con su unidad. */}
                    <button
                      type="button"
                      className="medicion-de-la-toma"
                      data-medicion={m.id}
                      data-anulada={m.anulada ? 'si' : undefined}
                      aria-label={[`${m.nombre}: ${m.valorCompleto}`, ...m.marcas.filter((x) => x.clase !== 'sin-valor').map((x) => x.texto)].join(' · ')}
                      onClick={() => setPanel({ tipo: 'medicion', id: m.id })}
                    >
                      {/* El nombre y sus marcas van juntos: si no entran en un renglón, la marca baja y el valor queda en su lugar. */}
                      <span className="medicion-de-la-toma__que">
                        <span className="medicion-de-la-toma__nombre">{m.nombreCorto}</span>
                        {m.marcas.map((x) => (
                          <Marca key={x.clase} marca={x} />
                        ))}
                      </span>
                      {m.valor !== null ? <span className="medicion-de-la-toma__valor">{m.valor}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <Panel abierto={panel !== null} titulo={panel?.tipo === 'calcular' ? C.nuevoCalculo : panel?.tipo === 'resultado' ? C.detalleDelResultado : medicion ? nombreDeMetrica(medicion.metric) : ''} onCerrar={cerrar}>
        {panel?.tipo === 'medicion' && medicion ? <DetalleDeMedicion key={medicion.measurementId} medicion={medicion} toma={toma} protocoloDeLaToma={resumen.protocolo} corridas={corridas} hecho={hecho} onHecho={despuesDeEscribir} /> : null}
        {panel?.tipo === 'resultado' && resultado ? <DetalleDeResultado key={resultado.calculationRunId} corrida={resultado} hecho={hecho} onHecho={despuesDeEscribir} /> : null}
        {panel?.tipo === 'calcular' && calculos.tipo === 'listo' ? (
          <NuevoCalculo
            evaluacion={toma}
            metodos={calculos.metodos}
            corridas={calculos.corridas.filter((c) => c.evaluationId === toma.evaluationId)}
            onCerrar={cerrar}
            onHecho={async (texto, corridaId) => {
              // El resultado nuevo queda a la vista en el mismo panel, con su método y sus entradas.
              await despuesDeEscribir(texto);
              if (corridaId) setPanel({ tipo: 'resultado', id: corridaId });
            }}
          />
        ) : null}
      </Panel>
    </article>
  );
}
