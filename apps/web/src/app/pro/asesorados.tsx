'use client';

/**
 * «Tus asesorados» (REL-05; WP-ESCRITORIO-AMABLE, parte 5): un directorio para entrar a la ficha de una persona.
 * - Una persona por renglón, con sus áreas (`directorio.ts`): las que tienen acceso se nombran solas y las que no, con
 *   las palabras de BE.
 * - WP-TABLERO-ALTA-GAMA TB-08 (DL-163 D-2): cada renglón lleva el monograma, el nombre, la referencia, las áreas y
 *   «Con vos desde»; el renglón entero abre la ficha, y las personas van en orden alfabético, sin datos de seguimiento.
 *   El detalle de cada vínculo (su finalidad y su estado) está en la ficha, en «Acceso actual».
 * - Se busca por el nombre o por la referencia, mientras se escribe y sin pedirle nada a la API: la lista ya está leída
 *   entera. Con un nombre visible (DL-040, decidida por Dirección el 2026-10-15), la referencia corta va al lado, chica:
 *   distingue a dos personas que se llaman igual.
 * - La cantidad del título cuenta personas, no vínculos. Con una búsqueda dice cuántas coinciden y de cuántas.
 * - Una falla de esta lectura no esconde los pendientes, y dice su motivo.
 */
import { COPY_VINCULO, numero, type PaginaDeUnaLista, type Vinculo } from '@be/domain';
import { Enlace } from '../../components/enlace';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { BloqueDeEstado, EstadoVacio } from '../../components/estados';
import { Icono } from '../../components/icono';
import { Retrato } from '../../components/retrato';
import { ICONO_DE_FALLA, razonDeFalla } from '../../lib/fallas';
import { dia, horaDelDia } from '../../lib/formato';
import type { EstadoDeListaCompleta } from '../../lib/lista-completa';
import { useNombres } from '../../lib/nombres-ocultos';
import { armarElDirectorio, buscarEnElDirectorio, enOrdenAlfabetico, type PersonaDelDirectorio } from './directorio';

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
  const listo = vinculos.tipo === 'listo' ? vinculos : null;
  // TB-05: con «Ocultar nombres», cada persona es su referencia, también para buscar.
  const { delAsesorado } = useNombres();
  const personas = useMemo(() => (listo ? enOrdenAlfabetico(armarElDirectorio(listo.items, profesionalId, delAsesorado)) : []), [listo, profesionalId, delAsesorado]);
  const coinciden = useMemo(() => buscarEnElDirectorio(personas, buscado), [personas, buscado]);
  const buscando = buscado.trim() !== '';
  const mas = listo && !listo.completa ? '+' : '';

  return (
    <section id="tus-asesorados" className="tarjeta-del-espacio directorio" aria-labelledby={`${id}-titulo`} tabIndex={-1}>
      <div className="tarjeta-del-espacio__cabecera">
        <Icono nombre="asesorados" tamano={24} />
        <h2 id={`${id}-titulo`}>Las personas que acompañás</h2>
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
          Cargando las personas que acompañás…
        </p>
      ) : null}
      {vinculos.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[vinculos.motivo]} titulo="No pudimos cargar las personas que acompañás" onReintentar={onReintentar} deQue="las personas que acompañás">
          {razonDeFalla(vinculos.motivo)}
        </BloqueDeEstado>
      ) : null}
      {/* Un «Actualizar» que falló: lo leído sigue a la vista, con su hora (bloque 5 del encargo de consolidación). */}
      {listo?.fallaAlActualizar ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[listo.fallaAlActualizar]} titulo="No pudimos actualizar las personas que acompañás" onReintentar={onReintentar} deQue="las personas que acompañás" rol="alert">
          {razonDeFalla(listo.fallaAlActualizar)} Se ve lo consultado a las {horaDelDia(listo.consultado)}.
        </BloqueDeEstado>
      ) : null}

      {listo && personas.length === 0 ? <p className="directorio__vacio">{COPY_VINCULO.sinAsesorados}</p> : null}

      {listo && personas.length > 0 ? (
        <>
          {/* No hay nada que enviar: se filtra mientras se escribe. El rótulo existe aunque no se vea. */}
          <div className="buscador-del-directorio" role="search">
            <label htmlFor={`${id}-buscar`} className="visualmente-oculto">
              Buscar por nombre o referencia
            </label>
            <Icono nombre="buscar" tamano={20} />
            <input id={`${id}-buscar`} type="search" value={buscado} maxLength={60} onChange={(e) => setBuscado(e.target.value)} placeholder="Buscar por nombre o referencia" autoComplete="off" spellCheck={false} />
          </div>

          {coinciden.length === 0 ? (
            <EstadoVacio
              titulo={`Ningún nombre ni referencia coincide con «${buscado.trim()}».`}
              accion={
                <button type="button" className="boton boton--secundario" onClick={() => setBuscado('')}>
                  Quitar la búsqueda
                </button>
              }
            />
          ) : (
            <ul className="directorio__personas">
              {coinciden.map((p) => (
                <Persona key={p.identityId} persona={p} />
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

/**
 * Una persona del directorio (TB-08): el renglón entero es el enlace a su ficha. La ficha es una por persona, aunque los
 * vínculos sean por área (DL-039). Lleva `persona__abrir`, como el «Abrir» de antes, para los recorridos.
 */
function Persona({ persona }: { persona: PersonaDelDirectorio }) {
  return (
    <li className="persona" data-persona={persona.identityId}>
      <Enlace className="persona__abrir" href={`/pro/advisees?id=${encodeURIComponent(persona.identityId)}`}>
        {/* TB-05: el monograma; sin nombre visible (un vínculo que terminó) o con los nombres ocultos, el ícono. */}
        <Retrato nombre={persona.nombre} tamano="medio" />
        <span className="persona__resumen">
          <span className="persona__quien">
            <span className="persona__nombre">{persona.nombre}</span>
            {persona.nombre.endsWith(persona.referencia) ? null : <span className="persona__referencia">{persona.referencia}</span>}
          </span>
          {persona.conAcceso.length > 0 ? <span className="persona__con-acceso">{persona.conAcceso.join(' · ')}</span> : null}
          {persona.sinAcceso.map((a) => (
            <span key={a.area} className="persona__sin-acceso">
              <Icono nombre="candado" tamano={15} />
              <span>
                {a.area}: {a.estado}
              </span>
            </span>
          ))}
          {persona.conVosDesde ? <span className="persona__desde">Con vos desde el {dia(persona.conVosDesde)}</span> : null}
        </span>
        <span className="visualmente-oculto">. Abrir su ficha</span>
        <Icono nombre="derecha" tamano={18} />
      </Enlace>
    </li>
  );
}
