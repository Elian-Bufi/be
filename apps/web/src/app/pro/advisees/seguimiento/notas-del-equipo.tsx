'use client';

/**
 * Las notas de coordinación en la ficha (WP-NOTAS-DE-COORDINACION; DEUDA_LEGAJO DL-140; CRD-D8):
 * - **«Notas recientes del equipo»** en el Resumen: las tres últimas que este profesional escribió o recibió sobre la
 *   persona, en el último año, con quién la escribió, para qué y cuándo; el texto se abre en el lugar. Sale de la línea de
 *   tiempo (API-DSH-04 con el tipo `COORDINATION_NOTE_RECORDED`), que es donde el 09 pone su lectura (09 §11.6): no hay otra.
 * - **Lo propio de una nota en su detalle** de la Línea de tiempo: corregirla con otra nota, si es suya (CRD-D7), y que lo
 *   citado se nombra pero no se abre con la nota (CRD-D5).
 */
import { COPY_NOTAS_DE_COORDINACION as T, type EntradaDeLineaDeTiempo, type LineaDeTiempoResponse } from '@be/domain';
import Link from 'next/link';
import { useId } from 'react';
import { Icono } from '../../../../components/icono';
import { api } from '../../../../lib/api';
import { diaDelAnioEnCurso } from '../../../../lib/formato';
import { razonDeFalla, useLectura, useSeguimiento } from './contexto';
import { hoyEn, restarDias } from './estado';

const TIPO = 'COORDINATION_NOTE_RECORDED';
const RECIENTES = 3;

/** Lo que la entrada dice de la nota, con los rótulos que arma la API. */
const detalle = (e: EntradaDeLineaDeTiempo, rotulo: string): string | null => e.details.find((d) => d.label === rotulo)?.value ?? null;
/** «Nota de coordinación · Pedido de coordinación» → «Pedido de coordinación». */
const finalidadDe = (e: EntradaDeLineaDeTiempo): string => {
  const corte = e.title.indexOf(' · ');
  return corte < 0 ? e.title : e.title.slice(corte + 3);
};

export function NotasRecientesDelEquipo() {
  const { token, asesoradoId, href, abrirNota } = useSeguimiento();
  const id = useId();
  const hoy = hoyEn();
  const { lectura, recargar } = useLectura<LineaDeTiempoResponse>(`notas-del-equipo|${asesoradoId}|${hoy}`, () =>
    api.lineaDeTiempo(token, asesoradoId, { periodStart: restarDias(hoy, 365), periodEnd: hoy, type: TIPO, limit: String(RECIENTES) }),
  );
  const notas = lectura.tipo === 'listo' ? lectura.datos.data.entries : [];
  const total = lectura.tipo === 'listo' ? lectura.datos.data.totalMatching : 0;
  return (
    <section className="notas-del-equipo" aria-labelledby={`${id}-titulo`}>
      <div className="notas-del-equipo__caja">
        <div className="notas-del-equipo__cabecera">
          <h2 id={`${id}-titulo`}>
            <Icono nombre="texto" tamano={20} />
            {T.recientesTitulo}
          </h2>
          <button type="button" className="boton boton--secundario boton--compacto" onClick={() => abrirNota({})}>
            {T.escribir}
          </button>
        </div>
        {lectura.tipo === 'cargando' ? <p className="nota">Cargando…</p> : null}
        {lectura.tipo === 'error' ? (
          <p className="nota">
            {razonDeFalla(lectura.motivo)}{' '}
            <button type="button" className="boton boton--enlace" onClick={recargar}>
              Reintentar
            </button>
          </p>
        ) : null}
        {lectura.tipo === 'listo' && notas.length === 0 ? <p className="nota">{T.recientesVacio}</p> : null}
        {notas.length > 0 ? (
          <ul className="notas-del-equipo__lista">
            {notas.map((e) => (
              <li key={e.timelineEntryId}>
                <details className="notas-del-equipo__nota">
                  <summary>
                    <span className="notas-del-equipo__quien">{e.author?.displayName ?? 'Profesional'}</span>
                    <span className="notas-del-equipo__para-que">{finalidadDe(e)}</span>
                    <span className="nota">{diaDelAnioEnCurso(e.occurredDate, hoy)}</span>
                  </summary>
                  <p className="notas-del-equipo__texto">{detalle(e, 'Nota')}</p>
                  <p className="nota">
                    {[detalle(e, 'Desde') ? `Desde ${detalle(e, 'Desde')}` : null, detalle(e, 'Para') ? `Para: ${detalle(e, 'Para')}` : null].filter(Boolean).join(' · ')}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        ) : null}
        {total > 0 ? (
          <Link className="notas-del-equipo__todas" href={href({ vista: 'linea', tipos: TIPO, p: '365', desde: null, hasta: null, areas: null, estados: null, calidad: null, tardias: null, plan: null, ej: null, novedades: null })}>
            {T.verTodas}
            {total > RECIENTES ? ` (${total})` : ''}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

/**
 * En el detalle de una nota, en la Línea de tiempo: corregirla con otra nota si la escribió quien mira (una nota no se
 * edita ni se borra, CRD-D7) y, si cita algo, que nombrarlo no lo abre (CRD-D5).
 */
export function AccionesDeLaNota({ e }: { e: EntradaDeLineaDeTiempo }) {
  const { yoId, abrirNota } = useSeguimiento();
  if (e.eventType !== TIPO) return null;
  const propia = e.author?.identityId === yoId;
  const citaAlgo = e.relations.some((r) => r.kind === 'REFERS_TO');
  return (
    <div className="acciones-de-la-nota">
      {citaAlgo && !propia ? <p className="nota">{T.referenciaSinAcceso}</p> : null}
      {propia ? (
        <>
          <p className="nota">{T.corregirAyuda}</p>
          <button
            type="button"
            className="boton boton--secundario boton--compacto"
            onClick={() => abrirNota({ corrige: { noteId: e.source.id, fecha: diaDelAnioEnCurso(e.occurredDate, hoyEn()), origen: e.domain } })}
          >
            {T.corregir}
          </button>
        </>
      ) : null}
    </div>
  );
}
