'use client';

/**
 * DL-197 (F23, ET1-11) · «Catálogo de BE» en «Mis ejercicios», como el «Recetario de BE» en Recetas: los ejercicios del
 * catálogo base (y lo importado de wger), con su clasificación —grupo muscular, equipamiento, patrón y articulaciones— y los
 * mismos filtros de «Agregar ejercicios». Es para mirar: se agregan a un plan desde el editor.
 * La clasificación del patrón y las articulaciones es una propuesta de BE, a validar por Dirección (ET1-D12): se dice.
 */
import {
  clasificacionEnUnRenglon,
  enOrdenAlfabetico,
  filtrarElCatalogo,
  NOMBRE_DE_LAS_ARTICULACIONES,
  NOMBRE_DEL_EQUIPAMIENTO,
  NOMBRE_DEL_GRUPO_MUSCULAR,
  NOMBRE_DEL_PATRON,
  type Articulaciones,
  type EjercicioEncontrado,
  type Equipamiento,
  type GrupoMuscular,
  type PatronDeMovimiento,
  type Resultado,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Cargando } from '../../../components/estados';
import { ExplicacionAPedido } from '../../../components/explicacion-a-pedido';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api } from '../../../lib/api';
import { mensajeDeFallo } from '../../../lib/intento';
import { catalogoDeLaSesion, COPY_CATALOGO_EN_LA_SESION, invalidarElCatalogo, type CatalogoLeido } from '../advisees/training/catalogo-en-la-sesion';

export const COPY_CATALOGO_DE_BE = {
  titulo: 'Catálogo de BE',
  queEs: 'Los ejercicios de BE, de wger, para todos los profesionales. Se agregan a un plan desde su editor, con «Agregar ejercicios».',
  propuesta: 'El patrón y las articulaciones son una propuesta de BE con criterio de entrenador, todavía a validar.',
  buscar: 'Buscar por ejercicio, músculo o equipo…',
  leyendo: 'Leyendo el catálogo…',
  cuenta: (n: number, de: number) => (n === de ? `${de} ejercicios` : `${n} de ${de} ejercicios`),
  ninguno: 'Ningún ejercicio coincide con lo elegido.',
  limpiar: 'Limpiar filtros',
} as const;
const T = COPY_CATALOGO_DE_BE;

type Lectura = { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly ejercicios: readonly EjercicioEncontrado[]; readonly completo: boolean } | { readonly tipo: 'falla'; readonly motivo: string };

/**
 * DL-199 (ET3-24): el catálogo entero de esta sesión, con la clasificación de cada ejercicio: el que ya se leyó, si está
 * vigente, o página por página (de a 50, con el cursor). Lo usan este catálogo y «Agregar ejercicios».
 */
export function leerElCatalogoDeLaSesion(token: string, sesionPerdida: (r: Resultado<unknown>) => boolean): Promise<CatalogoLeido<EjercicioEncontrado>> {
  return catalogoDeLaSesion<EjercicioEncontrado>(
    token,
    async (cursor) => {
      const r = await api.paginaDelCatalogoDeEjercicios(token, cursor);
      if (sesionPerdida(r)) return { ok: false, motivo: '', sesionPerdida: true };
      if (!r.ok) return { ok: false, motivo: mensajeDeFallo(r) };
      return { ok: true, data: r.datos.data, hasMore: r.datos.page.hasMore, nextCursor: r.datos.page.nextCursor ?? null };
    },
    enOrdenAlfabetico,
  );
}

/**
 * DL-199 (ET3-27, BAJA de la tanda 1): del «Catálogo de BE» es lo que no cargó ningún profesional (el catálogo base); lo
 * que un profesional importó de wger o cargó a mano es suyo. Con una API que todavía no dice quién lo cargó, lo de antes.
 */
export const esDelCatalogoDeBe = (e: EjercicioEncontrado): boolean => (e.loadedByProfessional === undefined ? e.provenance !== 'PROFESSIONAL_MANUAL' : !e.loadedByProfessional);

/** El catálogo entero, con la clasificación de cada ejercicio (una vez por sesión: `leerElCatalogoDeLaSesion`). */
export function useCatalogoEntero(token: string | null, sesionPerdida: (r: Resultado<unknown>) => boolean) {
  const [lectura, setLectura] = useState<Lectura>({ tipo: 'cargando' });
  const pedido = useRef(0);
  const leer = useCallback(
    async (reintentar = false) => {
      if (!token) return;
      const este = ++pedido.current;
      if (reintentar) invalidarElCatalogo(token);
      setLectura((l) => (l.tipo === 'lista' ? l : { tipo: 'cargando' }));
      const r = await leerElCatalogoDeLaSesion(token, sesionPerdida);
      if (este !== pedido.current || r.tipo === 'sesion-perdida') return;
      setLectura(r.tipo === 'falla' ? r : { tipo: 'lista', ejercicios: r.ejercicios, completo: r.completo });
    },
    [token, sesionPerdida],
  );
  useEffect(() => {
    void leer();
    return () => {
      pedido.current += 1;
    };
  }, [leer]);
  return { lectura, releer: leer };
}

export function CatalogoDeBe({ token, sesionPerdida }: { token: string; sesionPerdida: (r: Resultado<unknown>) => boolean }) {
  const id = useId();
  const { lectura, releer } = useCatalogoEntero(token, sesionPerdida);
  const [texto, setTexto] = useState('');
  const [grupo, setGrupo] = useState<GrupoMuscular | null>(null);
  const [equipamiento, setEquipamiento] = useState<Equipamiento | null>(null);
  const [patron, setPatron] = useState<PatronDeMovimiento | null>(null);
  const [articulaciones, setArticulaciones] = useState<Articulaciones | null>(null);
  // DL-199 (ET3-27): solo lo que cargó BE (ningún profesional), no según la procedencia: un ejercicio de wger que importó
  // un profesional es de ese profesional. Sin el dato (una API anterior), como antes: lo que no es manual.
  const todos = lectura.tipo === 'lista' ? lectura.ejercicios.filter(esDelCatalogoDeBe) : [];
  const lista = filtrarElCatalogo(todos, { texto, grupo, equipamiento, patron, articulaciones, favoritos: null });
  const hayFiltros = texto.trim() !== '' || grupo || equipamiento || patron || articulaciones;
  const filtro = <K extends string>(clave: string, rotulo: string, valor: K | null, opciones: Readonly<Record<K, string>>, alElegir: (v: K | null) => void) => (
    <label className="catalogo-para-elegir__filtro" data-filtro={clave}>
      <span className="visualmente-oculto">{rotulo}</span>
      <select value={valor ?? ''} onChange={(e) => alElegir((e.target.value || null) as K | null)}>
        <option value="">{rotulo}</option>
        {(Object.keys(opciones) as K[]).map((k) => (
          <option key={k} value={k}>
            {opciones[k]}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section className="seccion catalogo-de-be" aria-labelledby={`${id}-titulo`} data-catalogo-de-be>
      <div className="encabezado-con-ayuda">
        <h2 id={`${id}-titulo`} className="encabezado-con-ayuda__titulo">
          {T.titulo}
        </h2>
        <ExplicacionAPedido nombre="Qué es el catálogo de BE" lugar="esquina">
          {T.queEs} {T.propuesta}
        </ExplicacionAPedido>
      </div>
      <div className="catalogo-para-elegir">
        <div className="catalogo-para-elegir__buscador" role="search">
          <label htmlFor={`${id}-texto`} className="visualmente-oculto">
            {T.buscar}
          </label>
          <span className="agregar-item__campo">
            <Icono nombre="buscar" tamano={20} />
            <input id={`${id}-texto`} type="search" value={texto} maxLength={80} onChange={(e) => setTexto(e.target.value)} placeholder={T.buscar} autoComplete="off" spellCheck={false} />
          </span>
        </div>
        <div className="catalogo-para-elegir__filtros" role="group" aria-label="Filtrar el catálogo">
          {filtro('grupo', 'Grupo muscular', grupo, NOMBRE_DEL_GRUPO_MUSCULAR, setGrupo)}
          {filtro('equipamiento', 'Equipamiento', equipamiento, NOMBRE_DEL_EQUIPAMIENTO, setEquipamiento)}
          {filtro('patron', 'Patrón', patron, NOMBRE_DEL_PATRON, setPatron)}
          {filtro('articulaciones', 'Articulaciones', articulaciones, NOMBRE_DE_LAS_ARTICULACIONES, setArticulaciones)}
          {hayFiltros ? (
            <button
              type="button"
              className="boton boton--discreto boton--compacto"
              onClick={() => {
                setTexto('');
                setGrupo(null);
                setEquipamiento(null);
                setPatron(null);
                setArticulaciones(null);
              }}
            >
              {T.limpiar}
            </button>
          ) : null}
        </div>
        <p className="nota catalogo-para-elegir__cuenta" role="status" aria-live="polite">
          {lectura.tipo === 'lista' ? T.cuenta(lista.length, todos.length) : lectura.tipo === 'cargando' ? T.leyendo : ' '}
          {/* DL-199 (ET3-25): si la lectura cortó a mitad, se dice en el mismo renglón, con «Reintentar». */}
          {lectura.tipo === 'lista' && !lectura.completo ? (
            <span data-catalogo-incompleto>
              {' · '}
              {COPY_CATALOGO_EN_LA_SESION.incompleto(lectura.ejercicios.length)}{' '}
              <button type="button" className="boton boton--discreto boton--compacto" onClick={() => void releer(true)}>
                {COPY_CATALOGO_EN_LA_SESION.reintentar}
              </button>
            </span>
          ) : null}
        </p>
        {lectura.tipo === 'cargando' ? <Cargando /> : null}
        {lectura.tipo === 'falla' ? (
          <Aviso tipo="error">
            <p>No pudimos leer el catálogo. {lectura.motivo}</p>
            <button type="button" className="boton boton--secundario" onClick={() => void releer(true)}>
              Reintentar
            </button>
          </Aviso>
        ) : null}
        {lectura.tipo === 'lista' && lista.length === 0 ? <p>{T.ninguno}</p> : null}
        {lista.length > 0 ? (
          <ul className="catalogo-para-elegir__lista catalogo-de-be__lista" aria-label={T.titulo}>
            {lista.map((e) => (
              <li key={e.versionId} className="catalogo-para-elegir__ejercicio" data-ejercicio-del-catalogo={e.versionId}>
                <span className="catalogo-para-elegir__textos">
                  <span className="catalogo-para-elegir__nombre">{e.name}</span>
                  <span className="nota catalogo-para-elegir__clasificacion">{clasificacionEnUnRenglon(e.classification) ?? 'Sin clasificar'}</span>
                </span>
                {e.classification?.movementPattern ? <span className="etiqueta-de-dato">{NOMBRE_DEL_PATRON[e.classification.movementPattern]}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
