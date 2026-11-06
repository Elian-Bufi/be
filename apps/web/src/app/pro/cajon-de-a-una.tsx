'use client';

/**
 * El cajón «De a una» (WP-TABLERO-ALTA-GAMA TB-12; DL-163 D-4; la maqueta 14): los pendientes de la vista elegida en
 * «Te toca a vos», uno por cuadro, con su pregunta y tres salidas: la que lo resuelve, «Abrir la ficha» y «Saltear por
 * ahora».
 * - **Lee al abrir cada cuadro, y solo ese:** el resumen de la persona (API-DSH-03, con los 90 días por omisión) y, si el
 *   área tiene una revisión registrada, lo nuevo desde ella (API-DSH-04 con `since`, una página): dos lecturas como mucho.
 * - **No escribe, salvo aplicar:** saltear no escribe, y las salidas llevan a la pantalla que resuelve, como el verbo de
 *   la fila. Enter sobre una salida navega; nunca registra ni activa. Con una revisión registrada y sin aplicar (lo dice
 *   la primera lectura), el cuadro pregunta si la aplicás y su segunda lectura es esa revisión: aplicar es la pieza
 *   `aplicar-en-el-cajon.tsx` (TB-15), con la misma operación que Revisiones. Lo aplicado queda dicho en su cuadro y en
 *   el cierre, sin cuentas, y al cerrar el cajón /pro vuelve a leer la cartera.
 * - **El teclado:** J, el siguiente; K, el anterior; S, saltear; Escape, cerrar. Solo con el foco adentro. El foco va al
 *   título de la pregunta en cada cuadro, y al cerrar vuelve adonde estaba. Si la pregunta cambia con lo leído (una
 *   revisión por aplicar) y el foco seguía en ella, la nueva lo toma.
 * - **El lugar:** al salir por una salida se guardan los identificadores de la cola, nunca los nombres (`cajon.ts`), y al
 *   volver a /pro el cajón sigue con el siguiente que todavía esté.
 * - **El cierre es un comprobante:** dice que se llegó al final y nombra los salteados y lo aplicado, sin cuentas,
 *   festejos ni tachados.
 */
import { COPY_CARTERA, fechaCivil, partesDeObservacion, sintesisDelResumen, type DashboardResponse, type FormatoDeLaSintesis, type LineaDeTiempoResponse, type PendienteDeCartera } from '@be/domain';
import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icono } from '../../components/icono';
import { Retrato } from '../../components/retrato';
import { api, type Resultado } from '../../lib/api';
import { diaDelAnioEnCurso } from '../../lib/formato';
import { useNombres } from '../../lib/nombres-ocultos';
import { hoyEn, periodoEnInstantes, restarDias } from './advisees/seguimiento/estado';
import { CifrasDesdeLaRevision } from './advisees/seguimiento/pieza-del-area';
import { TramoDelCiclo } from './advisees/seguimiento/tramo-del-ciclo';
import { AplicarEnElCajon } from './aplicar-en-el-cajon';
import { COPY_CAJON, fichaDe, guardarLugar, lugarParaGuardar, revisionPorAplicar, salidaPrincipal } from './cajon';
import { claveDelPendiente } from './mesa';
import { rutaQueResuelve, textoDePendiente, ultimoRegistroDe } from './pendiente-en-una-fila';

type Dominios = DashboardResponse['data']['domains'];
/** Lo leído para un cuadro, con la clave de su pendiente: lo de otro cuadro no se muestra ni se usa. */
type Lectura =
  | { readonly tipo: 'leyendo' }
  | { readonly tipo: 'error'; readonly clave: string }
  | {
      readonly tipo: 'listo';
      readonly clave: string;
      readonly dominios: Dominios;
      readonly novedades: LineaDeTiempoResponse['data']['sinceCounts'] | null;
      readonly leidoDesde: string;
      /** TB-15: la revisión registrada y sin aplicar del área, si el pendiente es una revisión. */
      readonly porAplicar: { readonly reviewId: string; readonly recordedAt: string } | null;
    };
/** Lo aplicado desde el cajón, por la clave del pendiente: lo que hizo, sin nombres. */
type Aplicado = { readonly texto: string; readonly borrador: boolean };

const DIAS_DEL_RESUMEN = 90;
const DOMINIO = { nutrition: 'NUTRITION', training: 'TRAINING', anthropometry: 'ANTHROPOMETRY' } as const;

export function CajonDeAUna({
  abierto,
  cola,
  inicio,
  token,
  sesionPerdida,
  hoy,
  zona,
  onCerrar,
  onAplicada,
}: {
  abierto: boolean;
  /** La vista elegida, en su orden (`colaDeLaVista`). */
  cola: readonly PendienteDeCartera[];
  /** Dónde empieza: 0, o donde sigue al volver. `null`: en el cierre. */
  inicio: number | null;
  token: string;
  sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** La fecha civil y la zona con que la cartera clasificó los pendientes. */
  hoy: string;
  zona: string;
  onCerrar: () => void;
  /** TB-15: se aplicó una revisión desde el cajón; la cartera cambió, y /pro la vuelve a leer al cerrarlo. */
  onAplicada: () => void;
}) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const nombres = useNombres();
  const [indice, setIndice] = useState<number | null>(inicio);
  const [salteados, setSalteados] = useState<readonly string[]>([]);
  const [aplicados, setAplicados] = useState<ReadonlyMap<string, Aplicado>>(new Map());
  const [lectura, setLectura] = useState<Lectura>({ tipo: 'leyendo' });
  const claves = useMemo(() => cola.map(claveDelPendiente), [cola]);
  const actual = indice !== null ? (cola[indice] ?? null) : null;
  const dia = (f: string) => diaDelAnioEnCurso(f, hoy);
  const formato: FormatoDeLaSintesis = useMemo(() => ({ fecha: (f) => diaDelAnioEnCurso(f, hoy), dia: (i) => diaDelAnioEnCurso(fechaCivil(i, zona), hoy) }), [hoy, zona]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      setIndice(inicio);
      setSalteados([]);
      setAplicados(new Map());
      d.showModal();
    }
    if (!abierto && d.open) d.close();
  }, [abierto, inicio]);

  // Las dos lecturas del cuadro actual. Una respuesta tardía de otro cuadro se descarta. Un pendiente ya aplicado desde
  // el cajón no se vuelve a leer: su cuadro dice lo que se hizo.
  const claveActual = actual ? claveDelPendiente(actual) : null;
  const hecho = claveActual ? (aplicados.get(claveActual) ?? null) : null;
  useEffect(() => {
    if (!abierto || !actual || !claveActual || hecho) return;
    const clave = claveActual;
    let vigente = true;
    setLectura({ tipo: 'leyendo' });
    const hoyCivil = hoyEn();
    const desde = restarDias(hoyCivil, DIAS_DEL_RESUMEN - 1);
    void (async () => {
      const r = await api.consultarDashboard(token, actual.advisee.identityId, periodoEnInstantes({ preset: null, desde, hasta: hoyCivil }));
      if (!vigente || sesionPerdida(r)) return;
      if (!r.ok) return setLectura({ tipo: 'error', clave });
      const dominios = r.datos.data.domains;
      const anio = restarDias(hoyCivil, 365);
      // TB-15: una revisión registrada y sin aplicar. La segunda lectura es la revisión, que lee su pieza.
      const porAplicar = revisionPorAplicar(actual, dominios);
      if (porAplicar) return setLectura({ tipo: 'listo', clave, dominios, novedades: null, leidoDesde: anio, porAplicar });
      const entrada = actual.domain === 'anthropometry' ? null : dominios[actual.domain];
      const corte = entrada && entrada.available ? (entrada.summary?.lastReview?.recordedAt ?? null) : null;
      if (!corte) return setLectura({ tipo: 'listo', clave, dominios, novedades: null, leidoDesde: anio, porAplicar: null });
      const t = await api.lineaDeTiempo(token, actual.advisee.identityId, { periodStart: anio, periodEnd: hoyCivil, domain: DOMINIO[actual.domain], since: corte, limit: '1' });
      if (!vigente || sesionPerdida(t)) return;
      setLectura({ tipo: 'listo', clave, dominios, novedades: t.ok ? t.datos.data.sinceCounts : null, leidoDesde: anio, porAplicar: null });
    })();
    return () => {
      vigente = false;
    };
    // `actual` cambia con su clave; `token` y `sesionPerdida` no cambian en la visita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, claveActual, hecho]);

  // Solo lo leído para este cuadro: en el instante en que se pasa a otro, lo del anterior no se muestra ni se usa.
  const leida = lectura.tipo === 'listo' && lectura.clave === claveActual && !hecho ? lectura : null;
  const leyendo = !hecho && !leida && !(lectura.tipo === 'error' && lectura.clave === claveActual);
  const porAplicar = leida ? leida.porAplicar : null;
  const pregunta = !actual ? COPY_CAJON.fin : hecho ? COPY_CAJON.aplicada(actual) : porAplicar ? COPY_CAJON.preguntaDeAplicar(dia(fechaCivil(porAplicar.recordedAt, zona))) : COPY_CAJON.pregunta(actual);

  // El foco, al título de cada cuadro (o del cierre). Si la pregunta cambia con lo leído, el título nuevo (otro elemento,
  // por su `key`) toma el foco solo si nadie lo movió: no se le saca de un botón a quien ya estaba ahí.
  const antes = useRef<{ abierto: boolean; indice: number | null }>({ abierto: false, indice: null });
  useEffect(() => {
    const previo = antes.current;
    antes.current = { abierto, indice };
    if (!abierto) return;
    const enfocado = document.activeElement;
    const sinFoco = !enfocado || enfocado === document.body || enfocado === dialogo.current;
    if (!previo.abierto || previo.indice !== indice || sinFoco) titulo.current?.focus();
  }, [abierto, indice, pregunta]);

  const ir = (i: number | null) => setIndice(i !== null && i >= 0 && i < cola.length ? i : null);
  const saltear = () => {
    if (!actual) return;
    setSalteados((s) => (s.includes(claveDelPendiente(actual)) ? s : [...s, claveDelPendiente(actual)]));
    ir(indice !== null && indice + 1 < cola.length ? indice + 1 : null);
  };
  /** Al salir por una salida se guarda el lugar: solo identificadores. */
  const alSalir = () => {
    if (indice !== null) guardarLugar(lugarParaGuardar(claves, indice, salteados, Date.now()));
  };

  const alTeclear = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tecla = e.key.toLowerCase();
    if (tecla === 'j' && indice !== null) {
      e.preventDefault();
      ir(indice + 1 < cola.length ? indice + 1 : null);
    } else if (tecla === 'k') {
      e.preventDefault();
      ir(indice === null ? cola.length - 1 : Math.max(0, indice - 1));
    } else if (tecla === 's') {
      e.preventDefault();
      saltear();
    }
  };

  const quien = actual ? nombres.delAsesorado(actual.advisee) : '';
  // El resumen del área del cuadro, si la persona la deja leer: el tramo del ciclo y lo nuevo desde la revisión.
  const entradaN = leida && actual?.domain === 'nutrition' ? leida.dominios.nutrition : null;
  const entradaE = leida && actual?.domain === 'training' ? leida.dominios.training : null;
  const resumenN = entradaN && entradaN.available ? entradaN.summary : null;
  const resumenE = entradaE && entradaE.available ? entradaE.summary : null;
  const resumen = resumenN ?? resumenE;
  const conteos = leida?.novedades ? { estado: 'LISTA' as const, valor: { conteos: leida.novedades, leidoDesde: leida.leidoDesde } } : null;
  const novedades =
    conteos && leida && resumen
      ? (sintesisDelResumen({
          hoy,
          zonaHoraria: zona,
          periodo: { desde: leida.leidoDesde, hasta: hoy },
          nutricion: resumenN ? { resumen: resumenN, novedades: conteos, cobertura: { estado: 'NO_APLICA' } } : null,
          entrenamiento: resumenE ? { resumen: resumenE, novedades: conteos, cobertura: { estado: 'NO_APLICA' } } : null,
          antropometria: null,
        }).find((o) => o.regla === 'NOVEDADES_DESDE_EL_CORTE') ?? null)
      : null;
  const salida = actual ? salidaPrincipal(actual, rutaQueResuelve(actual)) : null;
  const revisiones = actual ? `/pro/advisees/${actual.domain}?id=${encodeURIComponent(actual.advisee.identityId)}&vista=revisiones` : '';
  const elPlan = actual ? `/pro/advisees/${actual.domain}?id=${encodeURIComponent(actual.advisee.identityId)}&vista=plan` : '';
  const siguiente = () => ir(indice !== null && indice + 1 < cola.length ? indice + 1 : null);
  const abrirLaFicha = actual ? (
    <Link className="boton boton--secundario" href={fichaDe(actual)} onClick={alSalir}>
      {COPY_CAJON.abrirLaFicha}
    </Link>
  ) : null;

  return (
    // Escape lo maneja el diálogo: cierra y devuelve el foco adonde estaba.
    <dialog ref={dialogo} className="cajon" aria-labelledby={`${id}-titulo`} onClose={onCerrar} onKeyDown={alTeclear}>
      <div className="cajon__cabecera">
        <p className="cajon__nombre">
          <Icono nombre="pendientes" tamano={20} />
          {COPY_CAJON.titulo}
        </p>
        <button type="button" className="boton boton--quieto boton--compacto" onClick={() => dialogo.current?.close()}>
          <Icono nombre="cerrar" tamano={18} />
          {COPY_CAJON.cerrar}
        </button>
      </div>

      {actual && indice !== null && salida ? (
        <div className="cajon__cuadro" key={claveDelPendiente(actual)}>
          <p className="cajon__posicion nota">{COPY_CAJON.posicion(indice + 1, cola.length)}</p>
          <h2 id={`${id}-titulo`} ref={titulo} key={pregunta} tabIndex={-1} className="cajon__pregunta">
            {pregunta}
          </h2>
          <p className="cajon__quien con-retrato">
            <Retrato nombre={quien} />
            <span>
              {quien} · {COPY_CARTERA.dominio[actual.domain]}
            </span>
          </p>
          <p className="cajon__que">
            {textoDePendiente(actual, dia)}
            <span className="nota"> · {ultimoRegistroDe(actual, { zona, conPeriodo: false, dia })}</span>
          </p>
          {leyendo ? (
            <p className="cargando" role="status">
              {COPY_CAJON.leyendo}
            </p>
          ) : null}
          {lectura.tipo === 'error' && lectura.clave === claveActual && !hecho ? <p className="nota">{COPY_CAJON.sinLeer}</p> : null}
          {resumenN ? <TramoDelCiclo area="NUTRICION" resumen={resumenN} hoy={hoy} fecha={dia} revisiones={revisiones} /> : null}
          {resumenE ? <TramoDelCiclo area="ENTRENAMIENTO" resumen={resumenE} hoy={hoy} fecha={dia} revisiones={revisiones} /> : null}
          {novedades ? <CifrasDesdeLaRevision partes={partesDeObservacion(novedades, formato)} href={null} texto="" /> : null}
          {hecho ? (
            // TB-15: lo que hizo la aplicación, y cómo seguir. El pendiente de la fila sigue hasta que /pro relea.
            <>
              <p className="cajon__hecho" role="status">
                {hecho.texto}
              </p>
              <div className="cajon__salidas">
                {hecho.borrador ? (
                  <Link className="boton boton--primario" href={elPlan} onClick={alSalir}>
                    {COPY_CAJON.seguirElBorrador}
                  </Link>
                ) : null}
                {abrirLaFicha}
                <button type="button" className={`boton ${hecho.borrador ? 'boton--quieto' : 'boton--secundario'}`} onClick={siguiente}>
                  {COPY_CAJON.siguiente}
                </button>
              </div>
            </>
          ) : porAplicar && (actual.domain === 'nutrition' || actual.domain === 'training') ? (
            <AplicarEnElCajon
              key={porAplicar.reviewId}
              area={actual.domain}
              revisionId={porAplicar.reviewId}
              revisiones={`${revisiones}&revision=${encodeURIComponent(porAplicar.reviewId)}`}
              token={token}
              sesionPerdida={sesionPerdida}
              hoy={hoy}
              alSalir={alSalir}
              alAplicar={(h) => {
                const clave = claveDelPendiente(actual);
                setAplicados((m) => new Map(m).set(clave, h));
                setSalteados((s) => s.filter((c) => c !== clave));
                onAplicada();
              }}
            >
              {abrirLaFicha}
              <button type="button" className="boton boton--quieto" onClick={saltear}>
                {COPY_CAJON.saltear}
              </button>
            </AplicarEnElCajon>
          ) : (
            <div className="cajon__salidas">
              <Link className="boton boton--primario" href={salida.href} onClick={alSalir}>
                {salida.texto}
              </Link>
              {abrirLaFicha}
              <button type="button" className="boton boton--quieto" onClick={saltear}>
                {COPY_CAJON.saltear}
              </button>
            </div>
          )}
          <div className="cajon__navegar">
            <button type="button" className="boton boton--enlace" onClick={() => ir(indice - 1)} disabled={indice === 0}>
              <Icono nombre="izquierda" tamano={18} />
              {COPY_CAJON.anterior}
            </button>
            <button type="button" className="boton boton--enlace" onClick={siguiente}>
              {COPY_CAJON.siguiente}
              <Icono nombre="derecha" tamano={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="cajon__cuadro cajon__cierre">
          <h2 id={`${id}-titulo`} ref={titulo} tabIndex={-1} className="cajon__pregunta">
            {COPY_CAJON.fin}
          </h2>
          {aplicados.size > 0 ? (
            <>
              <p>{COPY_CAJON.aplicadas}</p>
              <ul className="cajon__salteados">
                {[...aplicados.keys()].map((c) => {
                  const p = cola[claves.indexOf(c)];
                  if (!p) return null;
                  return (
                    <li key={c}>
                      {nombres.delAsesorado(p.advisee)} · {COPY_CARTERA.dominio[p.domain]} · {COPY_CAJON.aplicadaEnElCierre}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          {salteados.length > 0 ? (
            <>
              <p>{COPY_CAJON.salteados}</p>
              <ul className="cajon__salteados">
                {salteados.map((c) => {
                  const p = cola[claves.indexOf(c)];
                  if (!p) return null;
                  return (
                    <li key={c}>
                      <button type="button" className="boton boton--enlace" onClick={() => ir(claves.indexOf(c))}>
                        {nombres.delAsesorado(p.advisee)} · {COPY_CARTERA.dominio[p.domain]} · {COPY_CARTERA.tipo[p.kind]}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          <div className="cajon__salidas">
            {cola.length > 0 ? (
              <button type="button" className="boton boton--secundario" onClick={() => ir(0)}>
                {COPY_CAJON.volverAlPrimero}
              </button>
            ) : null}
            <button type="button" className="boton boton--quieto" onClick={() => dialogo.current?.close()}>
              {COPY_CAJON.cerrar}
            </button>
          </div>
        </div>
      )}
      <p className="cajon__atajos nota">{COPY_CAJON.atajos}</p>
    </dialog>
  );
}
