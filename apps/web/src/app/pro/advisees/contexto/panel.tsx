'use client';

/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179): el panel «Contexto de <nombre>», al costado o como cajón (CTX-D03), con cinco
 * pestañas. Cada lectura va a la API cuando se abre su pestaña (CTX-D02) y vuelve con «Volver a leer»: no hay caché de datos
 * de salud fuera de la memoria de esta pestaña del navegador (08 §27.3). Un 404 dice «No compartido» o lo neutral de
 * siempre, nunca por qué.
 * - Es un `aside` con nombre; las pestañas son un `tablist` con flechas, Inicio y Fin; cada carga se anuncia en una región
 *   viva. Escape cierra (si el foco está adentro) y el foco vuelve al botón que lo abrió (lo hace el marco).
 * - «Citar» aparece solo si hay algo abierto donde citar (CTX-D12), y dice qué pasó.
 */
import {
  cambioDelCuerpoEnPalabras,
  cantidadDeRespuestas,
  buscarEnFormularios,
  COPY_CONTEXTO,
  ETIQUETA_DE_ALCANCE,
  FORMULARIO_PARA_PEDIR,
  loImportante,
  motivosDelCuerpoEnPalabras,
  nombreDeMetrica,
  numero,
  renglonesDelFormulario,
  type CitaPosible,
  type CuerpoDelContextoResponse,
  type DatoImportante,
  type FuenteDelDato,
  type HabitosCompartidosResponse,
  type HabitosParaElProfesionalResponse,
  type ListaDeNotasPropiasDelProfesionalResponse,
  type PlanCompartido,
  type ResumenesParaElProfesionalResponse,
  type RespuestasDelContextoResponse,
} from '@be/domain';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icono } from '../../../../components/icono';
import { api, nuevaClaveDeIdempotencia, type Resultado } from '../../../../lib/api';
import { motivoDeFalla, razonDeFalla } from '../../../../lib/fallas';
import { dia, horaDelDia } from '../../../../lib/formato';
import { useNombres } from '../../../../lib/nombres-ocultos';
import type { AlcanceDelArea } from '../marco-del-area';
import { areaDelPedido, areasDelPanel, lineaDelPlan, tarjetaDeOtraArea, trasPedirVerElPlan } from '../seguimiento/otras-areas';
import { TextosDeNotasPropias } from '../notas-propias';
import { useReceptorActual } from './citas';
import { avisoDeCitar, claveDeCita, pestanaPorTecla, PESTANAS, TEXTO_DE_PESTANA, type ModoDelPanel, type Pestana } from './panel-de-contexto';

type Lectura<T> = { readonly tipo: 'cargando' } | { readonly tipo: 'listo'; readonly datos: T } | { readonly tipo: 'no-disponible' } | { readonly tipo: 'error'; readonly razon: string };

/** Una lectura del panel: se repite cuando cambia `vuelta` («Volver a leer»), y una respuesta tardía no pisa a una nueva. */
function useLecturaDelPanel<T>(clave: string | null, leer: () => Promise<Resultado<T>>, sesionPerdida: (r: Resultado<unknown>) => boolean): Lectura<T> {
  const [lectura, setLectura] = useState<Lectura<T>>({ tipo: 'cargando' });
  const generacion = useRef(0);
  const leerRef = useRef(leer);
  leerRef.current = leer;
  useEffect(() => {
    if (clave === null) return;
    const esta = ++generacion.current;
    setLectura({ tipo: 'cargando' });
    void leerRef.current().then((r) => {
      if (esta !== generacion.current || sesionPerdida(r)) return;
      if (r.ok) setLectura({ tipo: 'listo', datos: r.datos });
      else if (r.tipo === 'API' && r.codigo === 'RESOURCE_NOT_FOUND') setLectura({ tipo: 'no-disponible' });
      else setLectura({ tipo: 'error', razon: razonDeFalla(motivoDeFalla(r)) });
    });
  }, [clave, sesionPerdida]);
  return lectura;
}

const fechaCorta = (iso: string) => dia(iso);
const hora = (iso: string) => horaDelDia(new Date(iso));

function textoDeFuente(f: FuenteDelDato): string {
  const nombre = f.tipo === 'FORMULARIO' ? `Formulario «${f.nombre}»` : f.nombre;
  const extras = [f.corregida ? 'corregida por la persona' : null, f.cargadaConElProfesional ? 'cargado con vos y confirmado' : null].filter(Boolean);
  return [nombre, fechaCorta(f.fecha), ...extras].join(' · ');
}

export interface PropsDelPanel {
  readonly area: AlcanceDelArea;
  readonly asesoradoId: string;
  readonly token: string;
  readonly nombre: string | null;
  readonly modo: ModoDelPanel;
  readonly pestana: Pestana;
  readonly onPestana: (p: Pestana) => void;
  readonly onCerrar: () => void;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  /** Sube con «Actualizar» del marco: el panel vuelve a leer lo que muestra (CTX-D02). */
  readonly actualizacion?: number;
}

export function PanelDeContexto({ area, asesoradoId, token, nombre, modo, pestana, onPestana, onCerrar, sesionPerdida, actualizacion = 0 }: PropsDelPanel) {
  const titulo = COPY_CONTEXTO.boton(nombre);
  const idTitulo = useId();
  const idPanel = useId();
  const [propia, setVuelta] = useState(0);
  const vuelta = propia + actualizacion * 1000;
  const encabezado = useRef<HTMLHeadingElement>(null);
  const pestanas = useRef<Partial<Record<Pestana, HTMLButtonElement | null>>>({});

  // Al abrirse, el foco va al título del panel: el lector de pantalla dice dónde está.
  useEffect(() => {
    encabezado.current?.focus();
  }, []);

  const alTeclear = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCerrar();
    }
  };
  const alTeclearEnPestanas = (e: KeyboardEvent<HTMLDivElement>) => {
    const otra = pestanaPorTecla(pestana, e.key);
    if (!otra) return;
    e.preventDefault();
    onPestana(otra);
    window.setTimeout(() => pestanas.current[otra]?.focus(), 0);
  };

  return (
    <aside className={`panel-de-contexto panel-de-contexto--${modo}`} aria-labelledby={idTitulo} onKeyDown={alTeclear}>
      <div className="panel-de-contexto__cabecera">
        <h2 id={idTitulo} ref={encabezado} tabIndex={-1}>
          <Icono nombre="persona" tamano={20} />
          {titulo}
        </h2>
        <div className="panel-de-contexto__acciones">
          <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setVuelta((v) => v + 1)}>
            <Icono nombre="actualizar" tamano={18} />
            {COPY_CONTEXTO.volverALeer}
          </button>
          <button type="button" className="boton boton--quieto boton--compacto boton--icono" onClick={onCerrar} aria-label={COPY_CONTEXTO.cerrar} title={`${COPY_CONTEXTO.cerrar} (${COPY_CONTEXTO.atajo})`}>
            <Icono nombre="cerrar" tamano={18} />
          </button>
        </div>
      </div>
      <div className="panel-de-contexto__pestanas" role="tablist" aria-label={titulo} onKeyDown={alTeclearEnPestanas}>
        {PESTANAS.map((p) => (
          <button
            key={p}
            ref={(el) => {
              pestanas.current[p] = el;
            }}
            type="button"
            role="tab"
            id={`${idPanel}-${p}`}
            aria-selected={p === pestana}
            aria-controls={`${idPanel}-contenido`}
            tabIndex={p === pestana ? 0 : -1}
            className={p === pestana ? 'panel-de-contexto__pestana panel-de-contexto__pestana--actual' : 'panel-de-contexto__pestana'}
            onClick={() => onPestana(p)}
          >
            {TEXTO_DE_PESTANA[p]}
          </button>
        ))}
      </div>
      <div className="panel-de-contexto__contenido" role="tabpanel" id={`${idPanel}-contenido`} aria-labelledby={`${idPanel}-${pestana}`} tabIndex={0}>
        {pestana === 'importante' ? <LoImportante area={area} asesoradoId={asesoradoId} token={token} vuelta={vuelta} sesionPerdida={sesionPerdida} /> : null}
        {pestana === 'formularios' ? <Formularios asesoradoId={asesoradoId} token={token} vuelta={vuelta} sesionPerdida={sesionPerdida} /> : null}
        {pestana === 'cuerpo' ? <Cuerpo asesoradoId={asesoradoId} token={token} vuelta={vuelta} sesionPerdida={sesionPerdida} /> : null}
        {pestana === 'otras' ? <OtrasAreas area={area} asesoradoId={asesoradoId} token={token} vuelta={vuelta} sesionPerdida={sesionPerdida} /> : null}
        {pestana === 'notas' ? <Notas asesoradoId={asesoradoId} token={token} vuelta={vuelta} sesionPerdida={sesionPerdida} /> : null}
      </div>
    </aside>
  );
}

interface PropsDeLectura {
  readonly asesoradoId: string;
  readonly token: string;
  readonly vuelta: number;
  readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
}

/** Cargando, no disponible o falla, dicho con lo que se leía; si no, el contenido. */
function EstadoDelPanel<T>({ lectura, que, noDisponible, children }: { lectura: Lectura<T>; que: string; noDisponible?: ReactNode; children: (datos: T) => ReactNode }) {
  if (lectura.tipo === 'cargando') {
    return (
      <p className="nota" role="status">
        {COPY_CONTEXTO.leyendo(que)}
      </p>
    );
  }
  if (lectura.tipo === 'no-disponible') return <>{noDisponible ?? <p className="nota">{COPY_CONTEXTO.noCompartido}</p>}</>;
  if (lectura.tipo === 'error') {
    return (
      <p className="nota" role="alert">
        {COPY_CONTEXTO.noSeLeyo(que)} {lectura.razon}
      </p>
    );
  }
  return <>{children(lectura.datos)}</>;
}

// ─── «Citar» ────────────────────────────────────────────────────────────────────────────────────

function BotonDeCitar({ citas }: { citas: readonly CitaPosible[] }) {
  const receptor = useReceptorActual();
  const [aviso, setAviso] = useState<string | null>(null);
  if (!receptor || citas.length === 0) return null;
  const admitidas = receptor.destino === 'objetivo' ? citas : citas.filter((c) => c.area === receptor.area);
  if (admitidas.length === 0) return null;
  const todas = admitidas.every((c) => receptor.citadas.has(claveDeCita(c)));
  const citar = () => {
    let resultado: ReturnType<typeof receptor.citar> = 'ya';
    for (const c of admitidas) {
      const r = receptor.citar(c);
      if (r === 'citada' || resultado === 'ya') resultado = r;
      if (r === 'tope') break;
    }
    setAviso(avisoDeCitar(resultado, receptor.destino, receptor.maximo ?? 0));
  };
  return (
    <span className="panel-de-contexto__citar">
      <button type="button" className="boton boton--quieto boton--compacto" onClick={citar} disabled={todas} aria-label={`${receptor.destino === 'evaluacion' ? COPY_CONTEXTO.citarEnLaEvaluacion : COPY_CONTEXTO.citarEnElObjetivo}: ${admitidas[0]!.pregunta}`}>
        <Icono nombre={todas ? 'tilde' : 'referencia'} tamano={18} />
        {todas ? COPY_CONTEXTO.citada : COPY_CONTEXTO.citar}
      </button>
      <span className="nota" role="status">
        {aviso}
      </span>
    </span>
  );
}

function AyudaDeCitar() {
  const receptor = useReceptorActual();
  return <p className="nota panel-de-contexto__ayuda-de-citar">{receptor ? (receptor.destino === 'evaluacion' ? COPY_CONTEXTO.citarEnLaEvaluacion : COPY_CONTEXTO.citarEnElObjetivo) + ': tocá «Citar» al lado de cada respuesta.' : COPY_CONTEXTO.sinDondeCitar}</p>;
}

// ─── Lo importante ──────────────────────────────────────────────────────────────────────────────

function Dato({ d }: { d: DatoImportante }) {
  const contenido = (
    <>
      <dd>
        <span className="panel-de-contexto__respuesta">{d.respuesta}</span>
        <span className="nota panel-de-contexto__fuente">{textoDeFuente(d.fuente)}</span>
        {d.nota ? <span className="nota panel-de-contexto__nota-fija">{d.nota}</span> : null}
        <BotonDeCitar citas={d.citas} />
      </dd>
    </>
  );
  if (d.sensible) {
    // CTX-D09: plegado, sin color ni alerta, y sin «Citar».
    return (
      <div className="panel-de-contexto__dato panel-de-contexto__dato--sensible">
        <dt>{d.pregunta}</dt>
        <dd>
          <details>
            <summary>{COPY_CONTEXTO.datoSensible}</summary>
            <span className="panel-de-contexto__respuesta">{d.respuesta}</span>
            <span className="nota panel-de-contexto__fuente">{textoDeFuente(d.fuente)}</span>
          </details>
        </dd>
      </div>
    );
  }
  return (
    <div className="panel-de-contexto__dato">
      <dt>{d.pregunta}</dt>
      {contenido}
    </div>
  );
}

function LoImportante({ area, asesoradoId, token, vuelta, sesionPerdida }: PropsDeLectura & { readonly area: AlcanceDelArea }) {
  const formularios = useLecturaDelPanel(`${asesoradoId}|f|${vuelta}`, () => api.respuestasDelContexto(token, asesoradoId), sesionPerdida);
  const habitos = useLecturaDelPanel<HabitosCompartidosResponse>(`${asesoradoId}|h|${vuelta}`, () => api.habitosDeLaPersona(token, asesoradoId), sesionPerdida);
  const cuerpo = useLecturaDelPanel<CuerpoDelContextoResponse>(area === 'ANTROPOMETRIA' ? `${asesoradoId}|c|${vuelta}` : null, () => api.cuerpoDelContexto(token, asesoradoId), sesionPerdida);
  return (
    <EstadoDelPanel lectura={formularios} que="los formularios" noDisponible={<p className="nota">{COPY_CONTEXTO.sinNadaImportante}</p>}>
      {(f: RespuestasDelContextoResponse) => {
        const grupos = loImportante(
          area,
          {
            formularios: f.data.forms,
            habitos: habitos.tipo === 'listo' && habitos.datos.data.current ? { answers: habitos.datos.data.current.answers, recordedAt: habitos.datos.data.current.recordedAt } : null,
            cuerpo: cuerpo.tipo === 'listo' ? cuerpo.datos.data : null,
          },
          { fecha: fechaCorta, hora },
        );
        const pedir = FORMULARIO_PARA_PEDIR[area];
        return (
          <div className="panel-de-contexto__importante">
            <p className="nota">{COPY_CONTEXTO.introImportante}</p>
            <AyudaDeCitar />
            {grupos.length === 0 ? (
              <p className="nota">
                {COPY_CONTEXTO.sinNadaImportante} {pedir ? COPY_CONTEXTO.pediUnFormulario(pedir) : null}
              </p>
            ) : null}
            {grupos.map((g) => (
              <section key={g.clave} className="panel-de-contexto__grupo" aria-label={g.titulo}>
                <h3>{g.titulo}</h3>
                <dl>
                  {g.datos.map((d) => (
                    <Dato key={d.clave} d={d} />
                  ))}
                </dl>
              </section>
            ))}
          </div>
        );
      }}
    </EstadoDelPanel>
  );
}

// ─── Formularios ────────────────────────────────────────────────────────────────────────────────

function Formularios({ asesoradoId, token, vuelta, sesionPerdida }: PropsDeLectura) {
  const lectura = useLecturaDelPanel(`${asesoradoId}|f|${vuelta}`, () => api.respuestasDelContexto(token, asesoradoId), sesionPerdida);
  const [consulta, setConsulta] = useState('');
  const idBuscar = useId();
  return (
    <EstadoDelPanel lectura={lectura} que="los formularios" noDisponible={<p className="nota">{COPY_CONTEXTO.sinFormularios}</p>}>
      {(r: RespuestasDelContextoResponse) => {
        const encontrados = buscarEnFormularios(r.data.forms, consulta);
        const n = cantidadDeRespuestas(encontrados);
        return (
          <div className="panel-de-contexto__formularios">
            <div className="campo panel-de-contexto__buscar">
              <label htmlFor={idBuscar}>{COPY_CONTEXTO.buscar}</label>
              <input id={idBuscar} type="search" value={consulta} onChange={(e) => setConsulta(e.target.value)} aria-describedby={`${idBuscar}-ayuda`} autoComplete="off" />
              <p className="nota" id={`${idBuscar}-ayuda`}>
                {COPY_CONTEXTO.buscarAyuda}
              </p>
            </div>
            <AyudaDeCitar />
            <p className="nota" role="status">
              {r.data.forms.length === 0 ? COPY_CONTEXTO.sinFormularios : consulta.trim() ? (n === 0 ? COPY_CONTEXTO.sinResultados(consulta.trim()) : COPY_CONTEXTO.resultados(n)) : null}
            </p>
            {encontrados.map((f) => (
              <details key={f.formResponseId} className="panel-de-contexto__formulario" open={consulta.trim() !== '' || encontrados.length === 1}>
                <summary>
                  <strong>{f.templateName}</strong>{' '}
                  <span className="nota">
                    · {ETIQUETA_DE_ALCANCE[f.scope]} · {fechaCorta(f.answeredAt)}
                    {f.rectified ? ' · corregida por la persona' : ''}
                  </span>
                </summary>
                {renglonesDelFormulario(f).map((s) => (
                  <section key={s.titulo} className="panel-de-contexto__seccion" aria-label={s.titulo}>
                    <h3>{s.titulo}</h3>
                    <dl>
                      {s.renglones.map((x) => (
                        <div key={x.clave} className={x.sensible ? 'panel-de-contexto__dato panel-de-contexto__dato--sensible' : 'panel-de-contexto__dato'}>
                          <dt>{x.pregunta}</dt>
                          <dd>
                            {x.sensible ? (
                              <details>
                                <summary>{COPY_CONTEXTO.datoSensible}</summary>
                                <span className="panel-de-contexto__respuesta">{x.respuesta}</span>
                              </details>
                            ) : (
                              <span className="panel-de-contexto__respuesta">{x.respuesta}</span>
                            )}
                            {x.cita ? <BotonDeCitar citas={[x.cita]} /> : null}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </details>
            ))}
          </div>
        );
      }}
    </EstadoDelPanel>
  );
}

// ─── Cuerpo ─────────────────────────────────────────────────────────────────────────────────────

const numeroDelPanel = (x: number) => numero(x, 2);

function Cuerpo({ asesoradoId, token, vuelta, sesionPerdida }: PropsDeLectura) {
  const lectura = useLecturaDelPanel(`${asesoradoId}|c|${vuelta}`, () => api.cuerpoDelContexto(token, asesoradoId), sesionPerdida);
  const { delProfesional } = useNombres();
  return (
    <EstadoDelPanel
      lectura={lectura}
      que="las tomas"
      noDisponible={
        <p className="panel-de-contexto__no-compartido">
          <span className="insignia">{COPY_CONTEXTO.noCompartido}</span> <span className="nota">{COPY_CONTEXTO.cuerpoNoCompartido}</span>
        </p>
      }
    >
      {(r: CuerpoDelContextoResponse) => {
        const { latest, previous, metrics, access } = r.data;
        if (!latest) return <p className="nota">{COPY_CONTEXTO.sinTomas}</p>;
        return (
          <div className="panel-de-contexto__cuerpo">
            {access === 'SHARED_SUMMARY' ? <p className="nota">{COPY_CONTEXTO.cuerpoCompartido(delProfesional(latest.author))}</p> : null}
            {!previous ? <p className="nota">{COPY_CONTEXTO.unaSolaToma}</p> : null}
            <div className="desplazable-x">
              <table className="tabla panel-de-contexto__tabla">
                <caption className="visualmente-oculto">Última toma y anterior, por medida</caption>
                <thead>
                  <tr>
                    <th scope="col">Medida</th>
                    <th scope="col">
                      {COPY_CONTEXTO.ultimaToma}
                      <span className="nota"> · {fechaCorta(latest.occurredAt)}</span>
                    </th>
                    {previous ? (
                      <th scope="col">
                        {COPY_CONTEXTO.tomaAnterior}
                        <span className="nota"> · {fechaCorta(previous.occurredAt)}</span>
                      </th>
                    ) : null}
                    {previous ? <th scope="col">{COPY_CONTEXTO.cambio}</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr key={m.metricCode}>
                      <th scope="row">
                        {nombreDeMetrica(m.metricCode)}
                        {m.latest?.methodName ? <span className="nota"> · {m.latest.methodName}</span> : null}
                      </th>
                      <td>{m.latest ? `${numeroDelPanel(m.latest.value)} ${m.latest.unit}` : '—'}</td>
                      {previous ? <td>{m.previous ? `${numeroDelPanel(m.previous.value)} ${m.previous.unit}` : '—'}</td> : null}
                      {previous ? (
                        <td>{m.change ? cambioDelCuerpoEnPalabras(m.change, numeroDelPanel) : m.notComparableBecause.length > 0 ? <span className="nota">{COPY_CONTEXTO.noSeCompara(motivosDelCuerpoEnPalabras(m.notComparableBecause))}</span> : '—'}</td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="nota">
              La tomó {delProfesional(latest.author)} · {latest.protocols.join(', ')}
            </p>
          </div>
        );
      }}
    </EstadoDelPanel>
  );
}

// ─── Otras áreas ────────────────────────────────────────────────────────────────────────────────

function PlanDeOtraArea({ asesoradoId, token, area, sesionPerdida }: { asesoradoId: string; token: string; area: 'NUTRICION' | 'ENTRENAMIENTO'; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const lectura = useLecturaDelPanel(`${asesoradoId}|p|${area}`, () => api.planCompartido(token, asesoradoId, area), sesionPerdida);
  return (
    <EstadoDelPanel lectura={lectura} que="el plan">
      {(r: { data: PlanCompartido | null }) =>
        r.data ? (
          <div className="panel-de-contexto__plan">
            <p>{lineaDelPlan(r.data, fechaCorta)}</p>
            {r.data.objective && 'objective' in r.data.objective ? <p className="nota">Objetivo: {(r.data.objective as { objective: { statement: string } }).objective.statement}</p> : null}
          </div>
        ) : (
          <p className="nota">Esa área no tiene un plan vigente.</p>
        )
      }
    </EstadoDelPanel>
  );
}

function OtrasAreas({ area, asesoradoId, token, vuelta, sesionPerdida }: PropsDeLectura & { readonly area: AlcanceDelArea }) {
  const [otraVuelta, setOtraVuelta] = useState(0);
  const lectura = useLecturaDelPanel<ResumenesParaElProfesionalResponse>(`${asesoradoId}|r|${vuelta}|${otraVuelta}`, () => api.resumenesCompartidos(token, asesoradoId), sesionPerdida);
  const habitos = useLecturaDelPanel<HabitosParaElProfesionalResponse>(`${asesoradoId}|hs|${vuelta}|${otraVuelta}`, () => api.habitosParaElProfesional(token, asesoradoId), sesionPerdida);
  const { delProfesional } = useNombres();
  const [verPlan, setVerPlan] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pidiendo, setPidiendo] = useState(false);

  const pedirPlan = useCallback(
    async (scopes: readonly ('NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA')[], de: 'NUTRICION' | 'ENTRENAMIENTO') => {
      setPidiendo(true);
      const r = await api.pedirVerElPlan(token, asesoradoId, { scope: areaDelPedido(scopes, area).scope, area: de }, nuevaClaveDeIdempotencia());
      setPidiendo(false);
      if (sesionPerdida(r)) return;
      const que = trasPedirVerElPlan(r.ok ? { ok: true } : { ok: false, tipo: r.tipo, status: r.tipo === 'API' ? r.status : undefined });
      setAviso(que === 'enviado' ? 'Listo: le pediste acceso. Lo decide la persona.' : que === 'releer' ? 'Cambió lo que se comparte: lo volvimos a leer.' : 'No pudimos mandar el pedido. Probá de nuevo.');
      setOtraVuelta((v) => v + 1);
    },
    [token, asesoradoId, area, sesionPerdida],
  );
  const pedirHabitos = useCallback(
    async (scopes: readonly ('NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA')[]) => {
      setPidiendo(true);
      const scope = scopes.includes(area) ? area : scopes[0]!;
      const r = await api.pedirAccesoAHabitos(token, asesoradoId, { scope }, nuevaClaveDeIdempotencia());
      setPidiendo(false);
      if (sesionPerdida(r)) return;
      setAviso(r.ok ? 'Listo: le pediste ver sus hábitos. Lo decide la persona.' : 'No pudimos mandar el pedido. Probá de nuevo.');
      setOtraVuelta((v) => v + 1);
    },
    [token, asesoradoId, area, sesionPerdida],
  );

  return (
    <div className="panel-de-contexto__otras">
      <p className="nota" role="status">
        {aviso}
      </p>
      <EstadoDelPanel lectura={lectura} que="lo de otras áreas" noDisponible={<p className="nota">{COPY_CONTEXTO.noCompartido}</p>}>
        {(r) => {
          const areas = areasDelPanel(r.data);
          if (areas.length === 0) return <p className="nota">Ninguna otra área la lleva otro profesional.</p>;
          return (
            <ul className="panel-de-contexto__areas">
              {areas.map((a) => {
                const t = tarjetaDeOtraArea(a, delProfesional, fechaCorta);
                return (
                  <li key={a.area} className="panel-de-contexto__area">
                    <h3>{t.etiqueta}</h3>
                    {t.estado === 'NADA' ? (
                      <p>
                        <span className="insignia">{COPY_CONTEXTO.noCompartido}</span>
                      </p>
                    ) : null}
                    {t.lineas.map((l) => (
                      <p key={l} className="nota">
                        {l}
                      </p>
                    ))}
                    {t.estado === 'PLAN' && (a.area === 'NUTRICION' || a.area === 'ENTRENAMIENTO') ? (
                      verPlan === a.area ? (
                        <PlanDeOtraArea asesoradoId={asesoradoId} token={token} area={a.area} sesionPerdida={sesionPerdida} />
                      ) : (
                        <button type="button" className="boton boton--quieto boton--compacto" onClick={() => setVerPlan(a.area)}>
                          Ver el plan vigente
                        </button>
                      )
                    ) : null}
                    {t.estado === 'RESUMEN' && a.area === 'ANTROPOMETRIA' ? <p className="nota">Lo ves en la pestaña «Cuerpo».</p> : null}
                    {t.pedir && (a.area === 'NUTRICION' || a.area === 'ENTRENAMIENTO') ? (
                      <button type="button" className="boton boton--compacto" disabled={pidiendo} onClick={() => void pedirPlan(r.data.scopes, a.area as 'NUTRICION' | 'ENTRENAMIENTO')}>
                        {COPY_CONTEXTO.pedirAcceso}
                      </button>
                    ) : null}
                    {t.estado === 'NADA' && a.area === 'ANTROPOMETRIA' ? <p className="nota">{COPY_CONTEXTO.cuerpoNoCompartido}</p> : null}
                  </li>
                );
              })}
            </ul>
          );
        }}
      </EstadoDelPanel>
      <EstadoDelPanel lectura={habitos} que="sus hábitos">
        {(h) => (
          <section className="panel-de-contexto__area" aria-label={COPY_CONTEXTO.susHabitos}>
            <h3>{COPY_CONTEXTO.susHabitos}</h3>
            {h.data.receives && h.data.sharedSince ? (
              <p className="nota">{COPY_CONTEXTO.susHabitosLosVe(fechaCorta(h.data.sharedSince))} Los ves en «Lo importante».</p>
            ) : (
              <p>
                <span className="insignia">{COPY_CONTEXTO.noCompartido}</span>
              </p>
            )}
            {!h.data.receives && h.data.canRequestAccess ? (
              <button type="button" className="boton boton--compacto" disabled={pidiendo} onClick={() => void pedirHabitos(h.data.scopes)}>
                {COPY_CONTEXTO.pedirVerSusHabitos}
              </button>
            ) : null}
            {!h.data.receives && h.data.accessRequest?.status === 'PENDING' ? <p className="nota">Le pediste verlos el {fechaCorta(h.data.accessRequest.requestedAt)}: espera la respuesta de la persona.</p> : null}
          </section>
        )}
      </EstadoDelPanel>
      <p className="nota">{COPY_CONTEXTO.nuncaNotasPrivadas}</p>
    </div>
  );
}

// ─── Notas ──────────────────────────────────────────────────────────────────────────────────────

function Notas({ asesoradoId, token, vuelta, sesionPerdida }: PropsDeLectura) {
  const [otraVuelta, setOtraVuelta] = useState(0);
  const lectura = useLecturaDelPanel<ListaDeNotasPropiasDelProfesionalResponse>(`${asesoradoId}|n|${vuelta}|${otraVuelta}`, () => api.notasPropias(token, asesoradoId), sesionPerdida);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const clave = useRef<string | null>(null);
  const idNota = useId();
  const agregar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    clave.current ??= nuevaClaveDeIdempotencia();
    const r = await api.agregarNotaPropia(token, asesoradoId, { text: texto.trim() }, clave.current);
    setEnviando(false);
    if (sesionPerdida(r)) return;
    if (r.ok) {
      clave.current = null;
      setTexto('');
      setAviso('Listo: quedó tu nota.');
      setOtraVuelta((v) => v + 1);
    } else setAviso('No pudimos guardar la nota. Probá de nuevo.');
  };
  const activas = useMemo(() => (lectura.tipo === 'listo' ? lectura.datos.data.filter((n) => n.archivedAt === null) : []), [lectura]);
  return (
    <div className="panel-de-contexto__notas">
      <p className="nota">{COPY_CONTEXTO.notasIntro}</p>
      <div className="campo">
        <label htmlFor={idNota}>{COPY_CONTEXTO.agregarNota}</label>
        <textarea id={idNota} rows={3} maxLength={1000} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button type="button" className="boton boton--compacto" onClick={() => void agregar()} disabled={enviando || !texto.trim()}>
          {enviando ? 'Guardando…' : COPY_CONTEXTO.agregarNota}
        </button>
        <p className="nota" role="status">
          {aviso}
        </p>
      </div>
      <EstadoDelPanel lectura={lectura} que="tus notas">
        {() =>
          activas.length === 0 ? (
            <p className="nota">{COPY_CONTEXTO.sinNotas}</p>
          ) : (
            // PG-T73: con «Ocultar nombres», el texto de las notas no se ve hasta pedirlo (la misma pieza que el bloc).
            <TextosDeNotasPropias notas={activas} className="panel-de-contexto__lista-de-notas" />
          )
        }
      </EstadoDelPanel>
    </div>
  );
}
