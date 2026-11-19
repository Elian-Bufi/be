'use client';

/**
 * DL-180 (WP-NUTRICION-ALIMENTOS, NUA-04) · Los alimentos que los profesionales cargaron a mano, para que Administración los
 * revise (API-ALI-05 a 07):
 * - **La lista,** con el filtro de estado (por omisión, todos: los que esperan revisión primero) y el texto. De cada uno, el
 *   nombre, los valores cada 100 g, el grupo y lo decidido. Nunca quién lo cargó ni a quién se le indicó.
 * - **Revisar:** verificarlo con una fuente citada, marcarlo como equivalente de uno de la tabla oficial (que el buscador
 *   sugiere en su lugar) o quitar lo decidido. Contra la versión que se vio: si quien lo cargó lo corrigió mientras tanto,
 *   lo dice y vuelve a leer.
 */
import {
  cantidad as formatearCantidad,
  COPY,
  COPY_REVISION_DE_ALIMENTOS as C,
  iconoDelAlimento,
  NOMBRE_DEL_GRUPO,
  type AlimentoParaRevisar,
  type AlimentoVerificado,
  type DecidirSobreAlimentoRequest,
} from '@be/domain';
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { apiAdministrativa } from '../../../lib/api-administrativa';
import { dia } from '../../../lib/formato';
import { nuevaClaveAdministrativa, useAdministracion } from '../../../lib/sesion-administrativa';
import { decididoEnPalabras, faltaParaDecidir } from './decision';

const FILTROS = ['TODOS', 'PENDING', 'CERTIFIED', 'EQUIVALENT'] as const;
type Filtro = (typeof FILTROS)[number];
type Decision = DecidirSobreAlimentoRequest['decision'];

/** Un valor cada 100 g: lo que no hay es «sin dato», nunca cero. */
const valor = (v: number | null | undefined, unidad: string): string => (v === null || v === undefined ? 'sin dato' : formatearCantidad(v, unidad));

export function AlimentosParaRevisar() {
  const id = useId();
  const { sesion, revisar } = useAdministracion();
  const token = sesion?.token ?? null;
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [texto, setTexto] = useState('');
  const [buscado, setBuscado] = useState('');
  const [lista, setLista] = useState<{ readonly filas: readonly AlimentoParaRevisar[]; readonly siguiente: string | null } | 'falla' | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const leer = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      if (!cursor) setLista(null);
      const r = await apiAdministrativa.alimentosParaRevisar(token, { ...(filtro === 'TODOS' ? {} : { state: filtro }), ...(buscado ? { q: buscado } : {}), limit: 20, ...(cursor ? { cursor } : {}) });
      if (r.ok) {
        return setLista((antes) => ({ filas: [...(cursor && antes && antes !== 'falla' ? antes.filas : []), ...r.datos.data], siguiente: r.datos.page.nextCursor }));
      }
      if (!revisar(r)) setLista('falla');
    },
    [token, revisar, filtro, buscado],
  );
  useEffect(() => {
    void leer();
  }, [leer]);

  return (
    <>
      {/* Los filtros en un renglón, como en la lista de profesionales de `/admin`: el buscador y el estado. */}
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
        <div className="campo">
          <label htmlFor={`${id}-estado`}>Estado</label>
          <select id={`${id}-estado`} value={filtro} onChange={(ev) => setFiltro(ev.target.value as Filtro)}>
            {FILTROS.map((f) => (
              <option key={f} value={f}>
                {C.filtros[f]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {aviso ? (
        <Aviso tipo="info" enfocar>
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      {lista === 'falla' ? <p role="alert">{COPY.noDisponible}</p> : null}
      {lista === null ? <p aria-busy="true">Cargando…</p> : null}
      {lista && lista !== 'falla' && lista.filas.length === 0 ? <p>{C.sinAlimentos}</p> : null}
      {lista && lista !== 'falla' && lista.filas.length > 0 ? (
        // Cada alimento en su tarjeta, como en «Mis alimentos»: el ícono de su grupo, lo que es y «Revisar».
        <ul className="lista alimentos-para-revisar">
          {lista.filas.map((a) => {
            const c = a.composition;
            return (
              <li key={a.catalogItemId} className="lista__item alimentos-para-revisar__item" data-alimento-para-revisar={a.catalogItemId}>
                <span className="alimentos-para-revisar__icono" aria-hidden="true">
                  <Icono nombre={iconoDelAlimento(a.foodGroup)} tamano={24} />
                </span>
                <div className="alimentos-para-revisar__cuerpo">
                  <p className="lista__titulo">{a.name}</p>
                  <p className="nota">
                    Cada {c.referenceAmount === '100ml' ? '100 ml' : '100 g'}: {valor(c.energyKcal, 'kcal')} · carbohidratos {valor(c.carbohydrateG, 'g')} · grasas {valor(c.fatG, 'g')} · proteínas{' '}
                    {valor(c.proteinG, 'g')} · fibra {valor(c.fiberG, 'g')}
                  </p>
                  <p className="nota">
                    {a.foodGroup ? NOMBRE_DEL_GRUPO[a.foodGroup] : 'Sin grupo'} · versión {a.versionNumber} del {dia(a.updatedAt)}
                  </p>
                  <p className="nota" data-decidido>
                    {decididoEnPalabras(a)}
                  </p>
                </div>
                <div className="alimentos-para-revisar__acciones">
                  <button type="button" className="boton boton--secundario" aria-expanded={abierto === a.catalogItemId} onClick={() => setAbierto(abierto === a.catalogItemId ? null : a.catalogItemId)} data-revisar>
                    {C.revisar}
                    <span className="visualmente-oculto"> {a.name}</span>
                  </button>
                </div>
                {abierto === a.catalogItemId && token ? (
                  <Decidir
                    token={token}
                    alimento={a}
                    alDecidir={(nuevo) => {
                      setAbierto(null);
                      setAviso(C.decidido(nuevo.name));
                      void leer();
                    }}
                    alDesactualizarse={() => {
                      setAbierto(null);
                      setAviso(C.cambioMientras);
                      void leer();
                    }}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {lista && lista !== 'falla' && lista.siguiente ? (
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => void leer(lista.siguiente ?? undefined)}>
            Cargar más
          </button>
        </div>
      ) : null}
    </>
  );
}

function Decidir({ token, alimento, alDecidir, alDesactualizarse }: { token: string; alimento: AlimentoParaRevisar; alDecidir: (a: AlimentoParaRevisar) => void; alDesactualizarse: () => void }) {
  const id = useId();
  const { revisar } = useAdministracion();
  const [decision, setDecision] = useState<Decision>(alimento.review.state === 'PENDING' ? 'CERTIFY' : alimento.review.state === 'CERTIFIED' ? 'EQUIVALENT' : 'CERTIFY');
  const [fuente, setFuente] = useState('');
  const [buscar, setBuscar] = useState(alimento.name);
  const [verificados, setVerificados] = useState<readonly AlimentoVerificado[] | 'falla' | null>(null);
  const [equivalente, setEquivalente] = useState<AlimentoVerificado | null>(null);
  const [falta, setFalta] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [clave] = useState(nuevaClaveAdministrativa);
  const opciones: readonly Decision[] = alimento.review.state === 'PENDING' ? ['CERTIFY', 'EQUIVALENT'] : ['CERTIFY', 'EQUIVALENT', 'CLEAR'];

  async function buscarVerificados() {
    const q = buscar.trim();
    if (!q) return;
    setVerificados(null);
    const r = await apiAdministrativa.buscarVerificados(token, { q, limit: 8 });
    if (r.ok) return setVerificados(r.datos.data);
    if (!revisar(r)) setVerificados('falla');
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const motivo = faltaParaDecidir(decision, fuente, equivalente);
    setFalta(motivo);
    if (motivo) return;
    setEnviando(true);
    setFalla(null);
    const pedido: DecidirSobreAlimentoRequest = {
      expectedVersion: alimento.version,
      decision,
      ...(decision === 'CERTIFY' || (decision === 'EQUIVALENT' && fuente.trim()) ? { source: fuente.trim() } : {}),
      ...(decision === 'EQUIVALENT' && equivalente ? { equivalentCatalogItemId: equivalente.catalogItemId } : {}),
    };
    const r = await apiAdministrativa.decidirSobreAlimento(token, alimento.catalogItemId, pedido, clave);
    setEnviando(false);
    if (r.ok) return alDecidir(r.datos.data);
    if (revisar(r)) return;
    if (r.tipo === 'API' && r.codigo === 'VERSION_CONFLICT') return alDesactualizarse();
    setFalla(COPY.noDisponible);
  }

  return (
    <form className="formulario decidir-sobre-alimento" onSubmit={(e) => void enviar(e)} noValidate data-decidir-sobre-alimento>
      <h3>{C.revisarTitulo(alimento.name)}</h3>
      <fieldset className="campo">
        <legend>¿Qué decidís?</legend>
        {opciones.map((d) => (
          <label key={d} className="opcion-en-linea">
            <input type="radio" name={`${id}-decision`} value={d} checked={decision === d} onChange={() => (setDecision(d), setFalta(null))} />
            {C.decisiones[d]}
          </label>
        ))}
      </fieldset>
      {decision === 'CERTIFY' || decision === 'EQUIVALENT' ? (
        <div className={`campo${falta === C.faltaLaFuente ? ' campo--error' : ''}`}>
          <label htmlFor={`${id}-fuente`}>
            {C.fuente}
            {decision === 'EQUIVALENT' ? ' (si querés)' : ''}
          </label>
          <p id={`${id}-fuente-ayuda`} className="campo__ayuda">
            {C.fuenteAyuda}
          </p>
          <textarea id={`${id}-fuente`} rows={2} maxLength={500} value={fuente} aria-describedby={`${id}-fuente-ayuda`} aria-invalid={falta === C.faltaLaFuente || undefined} onChange={(ev) => setFuente(ev.target.value)} />
        </div>
      ) : null}
      {decision === 'EQUIVALENT' ? (
        <div className="campo">
          <label htmlFor={`${id}-buscar`}>{C.buscarVerificado}</label>
          <span className="decidir-sobre-alimento__buscar">
            <input id={`${id}-buscar`} type="search" value={buscar} maxLength={80} onChange={(ev) => setBuscar(ev.target.value)} onKeyDown={(ev) => (ev.key === 'Enter' ? (ev.preventDefault(), void buscarVerificados()) : undefined)} />
            <button type="button" className="boton boton--secundario" onClick={() => void buscarVerificados()}>
              Buscar
            </button>
          </span>
          {verificados === 'falla' ? <p role="alert">{COPY.noDisponible}</p> : null}
          {Array.isArray(verificados) && verificados.length === 0 ? <p className="nota">{C.ningunVerificado}</p> : null}
          {Array.isArray(verificados) && verificados.length > 0 ? (
            <ul className="decidir-sobre-alimento__verificados">
              {verificados.map((v) => (
                <li key={v.catalogItemId}>
                  <label className="opcion-en-linea">
                    <input type="radio" name={`${id}-equivalente`} checked={equivalente?.catalogItemId === v.catalogItemId} onChange={() => (setEquivalente(v), setFalta(null))} />
                    <Icono nombre={iconoDelAlimento(v.foodGroup)} tamano={18} /> {v.name}{' '}
                    <span className="nota">
                      · {valor(v.composition.energyKcal, 'kcal')} · P {valor(v.composition.proteinG, 'g')} · C {valor(v.composition.carbohydrateG, 'g')} · G {valor(v.composition.fatG, 'g')}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
          {equivalente ? <p className="nota">{C.elegido(equivalente.name)}</p> : null}
        </div>
      ) : null}
      <p className="nota">{C.queQueda[decision]}</p>
      {falta ? (
        <p className="campo__error" role="alert">
          <span aria-hidden="true">⚠ </span>
          {falta}
        </p>
      ) : null}
      {falla ? <p role="alert">{falla}</p> : null}
      <div className="acciones">
        <button type="submit" className="boton boton--primario" disabled={enviando}>
          {enviando ? C.guardando : C.confirmar}
        </button>
      </div>
    </form>
  );
}
