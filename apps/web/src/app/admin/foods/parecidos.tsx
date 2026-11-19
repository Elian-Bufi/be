'use client';

/**
 * DL-180, segundo tramo (NUA-D15 y D16; decisión de Dirección del 2026-11-19) · Las cargas a mano agrupadas por nombre
 * parecido (API-ALI-08), para decidir qué sumar al canon, y «Sumar al canon» (API-ALI-09):
 * - **Cada grupo** dice cuántos profesionales distintos cargaron algo así («7 profesionales cargaron "milanesa de soja"»),
 *   con qué nombres, y sus cargas: el nombre, los valores cada 100 g, quién la cargó (su nombre de profesional) y lo
 *   decidido. Nunca a quién se le indicó ni sus planes.
 * - **Sumar al canon** crea un alimento verificado de BE, de todos, con la fuente citada (obligatoria), partiendo de los
 *   valores de una de las cargas (que se pueden corregir), y puede marcar las cargas del grupo como sus equivalentes.
 * Toda acción va con la sesión administrativa y el segundo factor, y queda auditada (la API lo exige en cada ruta).
 */
import {
  cantidad as formatearCantidad,
  COPY,
  COPY_REVISION_DE_ALIMENTOS as C,
  iconoDelAlimento,
  type AlimentoParaRevisar,
  type GrupoDeParecidos,
} from '@be/domain';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Aviso, Campo } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { nuevaClaveAdministrativa, useAdministracion } from '../../../lib/sesion-administrativa';
import { SelectorDeGrupo } from '../../pro/advisees/nutrition/formulario-del-alimento';
import { alimentoEscrito, valoresDelAlimento, type AlimentoEscrito } from '../../pro/advisees/nutrition/valores-del-alimento';
import { decididoEnPalabras } from './decision';

/** Un valor cada 100 g: lo que no hay es «sin dato», nunca cero. */
const valor = (v: number | null | undefined, unidad: string): string => (v === null || v === undefined ? 'sin dato' : formatearCantidad(v, unidad));

/** Los valores de una carga, en un renglón. */
export function valoresEnUnRenglon(a: Pick<AlimentoParaRevisar, 'composition'>): string {
  const c = a.composition;
  return `Cada ${c.referenceAmount === '100ml' ? '100 ml' : '100 g'}: ${valor(c.energyKcal, 'kcal')} · carbohidratos ${valor(c.carbohydrateG, 'g')} · grasas ${valor(c.fatG, 'g')} · proteínas ${valor(c.proteinG, 'g')} · fibra ${valor(c.fiberG, 'g')}`;
}

/** Los otros nombres con que se cargó, si hay más de uno. */
export function otrosNombres(g: Pick<GrupoDeParecidos, 'names'>): string | null {
  return g.names.length > 1 ? C.tambienComo(g.names.slice(1).map((n) => `«${n}»`).join(', ')) : null;
}

export function Parecidos({ alSumar }: { alSumar: (texto: string) => void }) {
  const id = useId();
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [texto, setTexto] = useState('');
  const [buscado, setBuscado] = useState('');
  const [grupos, setGrupos] = useState<readonly GrupoDeParecidos[] | 'falla' | null>(null);
  const [sumando, setSumando] = useState<string | null>(null);

  const leer = useCallback(async () => {
    if (!token) return;
    setGrupos(null);
    const r = await apiAdministrativa.alimentosParecidos(token, { ...(buscado ? { q: buscado } : {}), limit: 30 });
    if (r.ok) return setGrupos(r.datos.data);
    if (!revisar(r)) setGrupos('falla');
  }, [token, revisar, buscado]);
  useEffect(() => {
    void leer();
  }, [leer]);

  return (
    <>
      <div className="filtros-de-administracion">
        <form
          role="search"
          className="buscador-administrativo"
          onSubmit={(e) => {
            e.preventDefault();
            setBuscado(texto.trim());
          }}
        >
          <label htmlFor={`${id}-texto`}>{C.buscar}</label>
          <div className="buscador-administrativo__fila">
            <input id={`${id}-texto`} type="search" value={texto} maxLength={80} autoComplete="off" onChange={(ev) => setTexto(ev.target.value)} />
            <button type="submit" className="boton boton--secundario">
              <Icono nombre="buscar" />
              Buscar
            </button>
          </div>
        </form>
      </div>
      {grupos === 'falla' ? <p role="alert">{COPY.noDisponible}</p> : null}
      {grupos === null ? <p aria-busy="true">Cargando…</p> : null}
      {grupos && grupos !== 'falla' && grupos.length === 0 ? <p>{C.sinParecidos}</p> : null}
      {grupos && grupos !== 'falla' && grupos.length > 0 ? (
        <ul className="lista parecidos">
          {grupos.map((g) => {
            const otros = otrosNombres(g);
            return (
              <li key={g.key} className="lista__item parecidos__grupo" data-grupo-de-parecidos={g.key}>
                <div className="parecidos__cabecera">
                  <p className="lista__titulo" data-cuantos-cargaron={g.professionals}>
                    {C.cuantosCargaron(g.professionals, g.names[0] ?? g.key)}
                  </p>
                  <button type="button" className="boton boton--secundario" aria-expanded={sumando === g.key} onClick={() => setSumando(sumando === g.key ? null : g.key)} data-sumar-al-canon>
                    <Icono nombre="tilde" tamano={18} />
                    {C.sumarAlCanon}
                    <span className="visualmente-oculto"> {g.names[0]}</span>
                  </button>
                </div>
                <p className="nota">
                  {C.cargas(g.loads.length)}
                  {otros ? ` · ${otros}` : ''}
                </p>
                <ul className="parecidos__cargas">
                  {g.loads.map((a) => (
                    <li key={a.catalogItemId} className="parecidos__carga" data-carga={a.catalogItemId}>
                      <span className="parecidos__icono" aria-hidden="true">
                        <Icono nombre={iconoDelAlimento(a.foodGroup)} tamano={20} />
                      </span>
                      <span>
                        <strong>{a.name}</strong> · <span data-cargado-por>{C.cargadoPor(a.loadedBy.displayName)}</span>
                        <br />
                        <span className="nota">
                          {valoresEnUnRenglon(a)} · {decididoEnPalabras(a)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                {sumando === g.key && token ? (
                  <SumarAlCanon
                    token={token}
                    grupo={g}
                    alSumar={(t) => {
                      setSumando(null);
                      alSumar(t);
                      void leer();
                    }}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

/** Lo que falta para sumar al canon (`null`: se puede). La fuente es obligatoria. */
export function faltaParaSumar(fuente: string): string | null {
  return fuente.trim() === '' ? C.faltaLaFuente : null;
}

function SumarAlCanon({ token, grupo, alSumar }: { token: string; grupo: GrupoDeParecidos; alSumar: (texto: string) => void }) {
  const id = useId();
  const { revisar } = useAdministracion();
  const [origen, setOrigen] = useState(grupo.loads[0]?.catalogItemId ?? '');
  const desde = (catalogItemId: string): AlimentoEscrito => {
    const a = grupo.loads.find((x) => x.catalogItemId === catalogItemId);
    return a ? alimentoEscrito(a) : { nombre: grupo.names[0] ?? '', kcal: '', c: '', g: '', p: '', fibra: '', grupo: '' };
  };
  const [escrito, setEscrito] = useState<AlimentoEscrito>(() => desde(origen));
  const [fuente, setFuente] = useState('');
  const [marcar, setMarcar] = useState(true);
  const [errores, setErrores] = useState<Readonly<Record<string, string>>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [clave] = useState(nuevaClaveAdministrativa);
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus(), []);
  const cambiar = (c: Partial<AlimentoEscrito>) => setEscrito((e) => ({ ...e, ...c }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const v = valoresDelAlimento(escrito);
    const sinFuente = faltaParaSumar(fuente);
    const problemas = { ...(v.tipo === 'faltan' ? v.problemas : {}), ...(sinFuente ? { fuente: sinFuente } : {}) };
    setErrores(problemas);
    if (v.tipo === 'faltan' || sinFuente) return;
    setEnviando(true);
    setFalla(null);
    const r = await apiAdministrativa.sumarAlCanon(
      token,
      {
        name: v.nombre,
        composition: v.composicion,
        ...(v.grupo ? { group: v.grupo } : {}),
        source: fuente.trim(),
        ...(origen ? { fromCatalogItemId: origen } : {}),
        ...(marcar ? { equivalentCatalogItemIds: grupo.loads.map((a) => a.catalogItemId) } : {}),
      },
      clave,
    );
    setEnviando(false);
    if (r.ok) return alSumar(C.sumado(r.datos.data.name, r.datos.data.equivalentsMarked));
    if (revisar(r)) return;
    setFalla(COPY.noDisponible);
  }

  return (
    <form className="formulario decidir-sobre-alimento" onSubmit={(e) => void enviar(e)} noValidate data-sumar-al-canon-formulario>
      <h3 ref={titulo} tabIndex={-1}>
        {C.sumarAlCanonTitulo(grupo.names[0] ?? grupo.key)}
      </h3>
      <p className="nota">{C.sumarAlCanonQueEs}</p>
      <div className="campo">
        <label htmlFor={`${id}-origen`}>{C.partirDe}</label>
        <select
          id={`${id}-origen`}
          value={origen}
          onChange={(ev) => {
            setOrigen(ev.target.value);
            setEscrito(desde(ev.target.value));
          }}
        >
          {grupo.loads.map((a) => (
            <option key={a.catalogItemId} value={a.catalogItemId}>
              {`${a.name} (${a.loadedBy.displayName})`}
            </option>
          ))}
        </select>
      </div>
      <Campo id={`${id}-nombre`} etiqueta="Nombre" value={escrito.nombre} maxLength={120} onChange={(e) => cambiar({ nombre: e.target.value })} error={errores['nombre'] ?? null} />
      <div className="agregar-item__valores">
        <Campo id={`${id}-kcal`} etiqueta="Calorías (kcal)" inputMode="decimal" value={escrito.kcal} onChange={(e) => cambiar({ kcal: e.target.value })} error={errores['kcal'] ?? null} />
        <Campo id={`${id}-c`} etiqueta="Carbohidratos (g)" inputMode="decimal" value={escrito.c} onChange={(e) => cambiar({ c: e.target.value })} error={errores['c'] ?? null} />
        <Campo id={`${id}-g`} etiqueta="Grasas (g)" inputMode="decimal" value={escrito.g} onChange={(e) => cambiar({ g: e.target.value })} error={errores['g'] ?? null} />
        <Campo id={`${id}-p`} etiqueta="Proteínas (g)" inputMode="decimal" value={escrito.p} onChange={(e) => cambiar({ p: e.target.value })} error={errores['p'] ?? null} />
        <Campo id={`${id}-fibra`} etiqueta="Fibra (g), si la sabés" inputMode="decimal" value={escrito.fibra} onChange={(e) => cambiar({ fibra: e.target.value })} error={errores['fibra'] ?? null} />
      </div>
      <SelectorDeGrupo id={`${id}-grupo`} valor={escrito.grupo} alCambiar={(g) => cambiar({ grupo: g })} apagado={enviando} />
      <div className={`campo${errores['fuente'] ? ' campo--error' : ''}`}>
        <label htmlFor={`${id}-fuente`}>{C.fuente}</label>
        <p id={`${id}-fuente-ayuda`} className="campo__ayuda">
          {C.fuenteAyuda}
        </p>
        <textarea id={`${id}-fuente`} rows={2} maxLength={500} value={fuente} aria-describedby={`${id}-fuente-ayuda`} aria-invalid={errores['fuente'] ? true : undefined} onChange={(ev) => setFuente(ev.target.value)} />
        {errores['fuente'] ? <p className="campo__error">{errores['fuente']}</p> : null}
      </div>
      <label className="capa">
        <input type="checkbox" checked={marcar} onChange={(ev) => setMarcar(ev.target.checked)} data-marcar-equivalentes />
        <span>{C.marcarEquivalentes}</span>
      </label>
      {falla ? (
        <Aviso tipo="error">
          <p>{falla}</p>
        </Aviso>
      ) : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando}>
          {enviando ? C.sumando : C.sumarAlCanon}
        </button>
      </div>
    </form>
  );
}

