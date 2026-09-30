'use client';

/**
 * «Pendientes» (API-DSH-04; PF-07, decidido el 2026-09-30, DL-107): a quién mirar hoy, con hechos fechados.
 * - Una fila por asesorado y dominio donde hay algo objetivo que hacer; «Abrir» lleva a la vista que lo resuelve.
 * - La última actividad registrada acompaña a la fila como dato: no hay filas por «sin registros» y nada se colorea
 *   por comportamiento de la persona (09v11 §15, regla crítica; B10-08 §10).
 * - Un dominio que el profesional no puede ver no aparece; si alguno quedó fuera, un aviso único.
 * - El período acota solo la actividad; los pendientes de revisión y de plan no dependen de él.
 */
import { COPY_CARTERA, TIPOS_DE_PENDIENTE, type CarteraResponse, type DominioDeCartera, type PendienteDeCartera, type TipoDePendiente } from '@be/domain';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { Cargando, ErrorConReintento, VerMas } from '../../components/estados';
import { Aviso } from '../../components/formulario';
import { api, type Resultado } from '../../lib/api';
import { dia, fecha } from '../../lib/formato';
import { useListaPaginada } from '../../lib/lista';
import { FiltroDePeriodo, type Periodo } from './advisees/periodo';

const DOMINIOS = ['nutrition', 'training', 'anthropometry'] as const;
type Filtro = Periodo & { domain?: DominioDeCartera; kind?: TipoDePendiente };
type Pagina = { data: readonly PendienteDeCartera[]; page: CarteraResponse['page'] };

/** La fecha civil (`AAAA-MM-DD`) legible; no pasa por la zona del navegador. */
const diaCivil = (f: string): string => dia(`${f}T12:00:00Z`);

export function textoDePendiente(p: PendienteDeCartera): string {
  const t = COPY_CARTERA.pendiente;
  switch (p.kind) {
    case 'REVIEW_OVERDUE':
      return t.REVIEW_OVERDUE(p.daysOverdue ?? 0);
    case 'REVIEW_DUE_SOON':
      return t.REVIEW_DUE_SOON(p.daysUntil ?? 0);
    case 'REVIEW_UNDATED':
      return t.REVIEW_UNDATED(p.since ? diaCivil(p.since) : '—');
    case 'PLAN_DRAFT_PENDING':
      return t.PLAN_DRAFT_PENDING(p.since ? diaCivil(p.since) : '—');
    case 'NO_ACTIVE_PLAN':
      return t.NO_ACTIVE_PLAN();
    case 'FORM_REQUEST_OPEN':
      return t.FORM_REQUEST_OPEN(p.since ? diaCivil(p.since) : '—');
    case 'ANTHRO_DRAFT_PENDING':
      return t.ANTHRO_DRAFT_PENDING(p.since ? diaCivil(p.since) : '—');
  }
}

/** La ruta del website que resuelve el pendiente: la API dice la vista; la página es la del dominio (o la de formularios). */
export function rutaQueResuelve(p: PendienteDeCartera): string {
  const id = encodeURIComponent(p.advisee.identityId);
  if (p.open.view === 'solicitudes') return `/pro/advisees/forms?id=${id}&vista=solicitudes`;
  return `/pro/advisees/${p.domain}?id=${id}&vista=${p.open.view}`;
}

export function Pendientes({ token, sesionPerdida }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const [filtro, setFiltro] = useState<Filtro>({});
  // Lo que la respuesta dice además de la lista (aviso de vista parcial y «hoy»): de la última página leída.
  const meta = useRef<{ today: string; partialView: boolean } | null>(null);
  const cargar = useMemo(
    () =>
      (cursor?: string): Promise<Resultado<Pagina>> =>
        api.consultarCartera(token, { ...filtro, ...(cursor ? { cursor } : {}) }).then((r) => {
          if (!r.ok) return r as Resultado<never>;
          meta.current = { today: r.datos.data.today, partialView: r.datos.data.partialView };
          return { ...r, datos: { data: r.datos.data.items, page: r.datos.page } } as Resultado<Pagina>;
        }),
    [token, filtro],
  );
  const lista = useListaPaginada(cargar, sesionPerdida);

  return (
    <section className="seccion" aria-labelledby="titulo-pendientes">
      <h2 id="titulo-pendientes">{COPY_CARTERA.titulo}</h2>
      <p className="nota">{COPY_CARTERA.subtitulo}</p>
      <div className="fila-de-dato">
        <div className="campo">
          <label htmlFor="pendientes-dominio">{COPY_CARTERA.filtroDominio}</label>
          <select id="pendientes-dominio" value={filtro.domain ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, domain: (e.target.value || undefined) as DominioDeCartera | undefined }))}>
            <option value="">{COPY_CARTERA.todos}</option>
            {DOMINIOS.map((d) => (
              <option key={d} value={d}>
                {COPY_CARTERA.dominio[d]}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="pendientes-tipo">{COPY_CARTERA.filtroTipo}</label>
          <select id="pendientes-tipo" value={filtro.kind ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, kind: (e.target.value || undefined) as TipoDePendiente | undefined }))}>
            <option value="">{COPY_CARTERA.todos}</option>
            {TIPOS_DE_PENDIENTE.map((k) => (
              <option key={k} value={k}>
                {COPY_CARTERA.tipo[k]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* El período acota solo la columna de actividad: cambiarlo no reordena los pendientes de revisión ni de plan. */}
      <FiltroDePeriodo id="pendientes-periodo" onAplicar={(p) => setFiltro((f) => ({ domain: f.domain, kind: f.kind, ...p }))} />
      {lista.estado.tipo === 'cargando' ? <Cargando /> : null}
      {lista.estado.tipo === 'error' ? <ErrorConReintento onReintentar={lista.recargar} /> : null}
      {lista.estado.tipo === 'listo' ? (
        <>
          {meta.current?.partialView ? (
            <Aviso tipo="info">
              <p>{COPY_CARTERA.vistaParcial}</p>
            </Aviso>
          ) : null}
          {lista.estado.items.length === 0 ? (
            <p>{COPY_CARTERA.vacio}</p>
          ) : (
            <table className="tabla">
              <caption className="nota">
                {COPY_CARTERA.titulo}: {lista.estado.items.length}
                {lista.estado.siguiente ? '+' : ''} · hoy {meta.current ? diaCivil(meta.current.today) : ''}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Asesorado</th>
                  <th scope="col">{COPY_CARTERA.filtroDominio}</th>
                  <th scope="col">Pendiente</th>
                  <th scope="col">Último registro</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.estado.items.map((p) => (
                  <tr key={`${p.kind}|${p.domain}|${p.advisee.identityId}`}>
                    <th scope="row">{p.advisee.displayName}</th>
                    <td data-etiqueta={COPY_CARTERA.filtroDominio}>{COPY_CARTERA.dominio[p.domain]}</td>
                    <td data-etiqueta="Pendiente">{textoDePendiente(p)}</td>
                    <td data-etiqueta="Último registro">{p.lastActivityAt ? fecha(p.lastActivityAt) : COPY_CARTERA.sinRegistros}</td>
                    <td data-etiqueta="Acciones">
                      <Link className="boton boton--enlace" href={rutaQueResuelve(p)} aria-label={`${COPY_CARTERA.abrir}: ${p.advisee.displayName}, ${COPY_CARTERA.dominio[p.domain]}, ${textoDePendiente(p)}`}>
                        {COPY_CARTERA.abrir}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <VerMas estado={lista.estado} onVerMas={lista.verMas} />
          <p>
            <button type="button" className="boton boton--enlace" onClick={() => void lista.recargar()}>
              Actualizar
            </button>
          </p>
        </>
      ) : null}
    </section>
  );
}
