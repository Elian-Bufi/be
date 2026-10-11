'use client';

/**
 * «Tus asesorados» (REL-05; WP-ESCRITORIO-AMABLE, parte 5): un directorio para entrar a la ficha de una persona.
 * - Una persona por renglón, con sus áreas (`directorio.ts`): las que tienen acceso se nombran solas y las que no, con
 *   las palabras de BE. El detalle de cada vínculo (finalidad, estado y desde cuándo) está a un clic, en el lugar.
 * - Se busca por la referencia, mientras se escribe y sin pedirle nada a la API: la lista ya está leída entera.
 * - La cantidad del título cuenta personas, no vínculos. Con una búsqueda dice cuántas coinciden y de cuántas.
 * - Una falla de esta lectura no esconde los pendientes, y dice su motivo.
 */
import { COPY_VINCULO, numero, type PaginaDeUnaLista, type Vinculo } from '@be/domain';
import Link from 'next/link';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { BloqueDeEstado, EstadoVacio } from '../../components/estados';
import { Icono } from '../../components/icono';
import { ICONO_DE_FALLA, razonDeFalla } from '../../lib/fallas';
import { dia } from '../../lib/formato';
import type { EstadoDeListaCompleta } from '../../lib/lista-completa';
import { armarElDirectorio, buscarEnElDirectorio, type PersonaDelDirectorio } from './directorio';

export type EstadoDeLosVinculos = EstadoDeListaCompleta<PaginaDeUnaLista<Vinculo>>;

export function Asesorados({
  vinculos,
  profesionalId,
  onReintentar,
  onVerMas,
  children,
}: {
  vinculos: EstadoDeLosVinculos;
  /** La cuenta que mira: la lista trae también los vínculos donde es la asesorada. */
  profesionalId: string;
  onReintentar: () => void;
  onVerMas: () => void;
  /** Lo que va al pie del directorio: la entrada a las solicitudes enviadas. */
  children?: ReactNode;
}) {
  const id = useId();
  const [buscado, setBuscado] = useState('');
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(new Set());
  const listo = vinculos.tipo === 'listo' ? vinculos : null;
  const personas = useMemo(() => (listo ? armarElDirectorio(listo.items, profesionalId) : []), [listo, profesionalId]);
  const coinciden = useMemo(() => buscarEnElDirectorio(personas, buscado), [personas, buscado]);
  const buscando = buscado.trim() !== '';
  const mas = listo && !listo.completa ? '+' : '';

  const alternar = (identityId: string) =>
    setAbiertas((antes) => {
      const ahora = new Set(antes);
      if (!ahora.delete(identityId)) ahora.add(identityId);
      return ahora;
    });

  return (
    <section className="tarjeta-del-espacio directorio" aria-labelledby={`${id}-titulo`}>
      <div className="tarjeta-del-espacio__cabecera">
        <Icono nombre="asesorados" tamano={24} />
        <h2 id={`${id}-titulo`}>Tus asesorados</h2>
        {listo ? (
          <p className="directorio__cuenta" role="status">
            {buscando ? `${numero(coinciden.length)} de ${numero(personas.length)}${mas}` : `${numero(personas.length)}${mas}`}
            <span className="visualmente-oculto">
              {mas ? ' o más' : ''} {personas.length === 1 && !mas ? 'persona' : 'personas'}
            </span>
          </p>
        ) : null}
      </div>

      {vinculos.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          Cargando tus asesorados…
        </p>
      ) : null}
      {vinculos.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[vinculos.motivo]} titulo="No pudimos cargar tus asesorados" onReintentar={onReintentar} deQue="tus asesorados">
          {razonDeFalla(vinculos.motivo)}
        </BloqueDeEstado>
      ) : null}

      {listo && personas.length === 0 ? <p className="directorio__vacio">{COPY_VINCULO.sinAsesorados}</p> : null}

      {listo && personas.length > 0 ? (
        <>
          {/* No hay nada que enviar: se filtra mientras se escribe. El rótulo existe aunque no se vea. */}
          <div className="buscador-del-directorio" role="search">
            <label htmlFor={`${id}-buscar`} className="visualmente-oculto">
              Buscar por referencia
            </label>
            <Icono nombre="buscar" tamano={20} />
            <input id={`${id}-buscar`} type="search" value={buscado} maxLength={60} onChange={(e) => setBuscado(e.target.value)} placeholder="Buscar por referencia" autoComplete="off" spellCheck={false} />
          </div>

          {coinciden.length === 0 ? (
            <EstadoVacio
              titulo={`Ninguna referencia coincide con «${buscado.trim()}».`}
              accion={
                <button type="button" className="boton boton--secundario" onClick={() => setBuscado('')}>
                  Quitar la búsqueda
                </button>
              }
            />
          ) : (
            <ul className="directorio__personas">
              {coinciden.map((p) => (
                <Persona key={p.identityId} persona={p} abierta={abiertas.has(p.identityId)} alAlternar={() => alternar(p.identityId)} />
              ))}
            </ul>
          )}

          {listo.completa ? null : (
            <p className="directorio__incompleta nota">
              Se leyeron los primeros {numero(listo.items.length)} vínculos.{' '}
              <button type="button" className="boton boton--enlace" onClick={onVerMas} disabled={listo.actualizando}>
                Ver más
              </button>
            </p>
          )}
        </>
      ) : null}

      {children ? <div className="directorio__pie">{children}</div> : null}
    </section>
  );
}

function Persona({ persona, abierta, alAlternar }: { persona: PersonaDelDirectorio; abierta: boolean; alAlternar: () => void }) {
  const id = useId();
  return (
    <li className="persona" data-persona={persona.identityId}>
      {/* La referencia y las áreas son el resumen de la persona y, a la vez, lo que abre el detalle de sus vínculos. */}
      <button type="button" className="persona__datos" aria-expanded={abierta} aria-controls={`${id}-vinculos`} onClick={alAlternar}>
        <span className="persona__resumen">
          <span className="persona__nombre">{persona.nombre}</span>
          {persona.conAcceso.length > 0 ? <span className="persona__con-acceso">{persona.conAcceso.join(' · ')}</span> : null}
          {persona.sinAcceso.map((a) => (
            <span key={a.area} className="persona__sin-acceso">
              <Icono nombre="candado" tamano={15} />
              <span>
                {a.area}: {a.estado}
              </span>
            </span>
          ))}
        </span>
        <span className="visualmente-oculto">. Ver el detalle de sus vínculos</span>
        <Icono nombre={abierta ? 'arriba' : 'abajo'} tamano={18} />
      </button>
      <ul id={`${id}-vinculos`} className="persona__vinculos" hidden={!abierta}>
        {abierta
          ? persona.vinculos.map((v) => (
              <li key={v.relationshipId}>
                <span className="persona__vinculo">
                  {v.area} · {v.finalidad}
                </span>
                <span>
                  <span className="insignia">{v.estado}</span>
                  {v.detalle ? ` ${v.detalle}` : ''}
                </span>
                <span className="nota">Desde el {dia(v.desde)}</span>
              </li>
            ))
          : null}
      </ul>
      {/* La ficha es una por persona, aunque los vínculos sean por área (DL-039). Va después del detalle en el documento,
          para que el detalle siga a lo que lo abre; a la vista, está al lado de la referencia. */}
      <Link className="boton boton--quieto boton--compacto persona__abrir" href={`/pro/advisees?id=${encodeURIComponent(persona.identityId)}`} aria-label={`Abrir la ficha de ${persona.nombre}`}>
        Abrir
      </Link>
    </li>
  );
}
