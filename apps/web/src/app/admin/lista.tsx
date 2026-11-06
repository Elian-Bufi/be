'use client';

/**
 * UC-ADM-01 · la lista de profesionales registrados (API-ADM-10), con su situación en cada área.
 * - **Pendientes a la vista:** cuántas áreas de todo BE esperan revisión, con «Ver las pendientes». La API ordena primero a
 *   quienes tienen un área pendiente.
 * - **Búsqueda y filtros:** el texto busca en el nombre visible y en el correo (viaja en el cuerpo, no en la URL); el área y
 *   la situación filtran. Cambiar algo vuelve a la primera página.
 * - **Volver como se dejó:** la búsqueda, los filtros, la página y la posición viven en la sesión de la consola, en
 *   memoria; al volver de una ficha, la lista se lee de nuevo con lo mismo y la página vuelve a donde estaba.
 * - **Información mínima** (D-5): identidad profesional y situación por área. Nada de fichas, registros ni salud.
 */
import { ALCANCES, COPY_ADMINISTRACION, ETIQUETA_DE_ALCANCE, SITUACIONES_DE_AREA, type Alcance, type ListaDeProfesionalesResponse, type SituacionDeArea } from '@be/domain';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { BloqueDeEstado, Cargando, EstadoVacio } from '../../components/estados';
import { Icono } from '../../components/icono';
import { apiAdministrativa } from '../../lib/api-administrativa';
import { ICONO_DE_FALLA, motivoDeFalla, razonDeFalla, type MotivoDeFalla } from '../../lib/fallas';
import { LISTA_INICIAL, useAdministracion } from '../../lib/sesion-administrativa';
import { Situacion } from './situacion';

const L = COPY_ADMINISTRACION.lista;
const TAMANO_DE_PAGINA = 20;

type Estado =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | { readonly tipo: 'listo'; readonly datos: ListaDeProfesionalesResponse; readonly actualizando: boolean };

export function ListaDeProfesionales() {
  const id = useId();
  const { sesion, revisar, lista, guardarLista } = useAdministracion();
  const token = sesion?.token ?? null;
  const [buscado, setBuscado] = useState(lista.texto);
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [vuelta, setVuelta] = useState(0);
  const pedido = useRef(0);
  // Al volver de una ficha, la página vuelve a la posición que tenía, una sola vez, cuando llegan las filas.
  const posicionPendiente = useRef<number | null>(lista.desplazamiento > 0 ? lista.desplazamiento : null);
  const cuenta = useRef<HTMLParagraphElement>(null);
  const moverFoco = useRef(false);

  const cursor = lista.cursores[lista.cursores.length - 1] ?? null;
  const pagina = lista.cursores.length;

  useEffect(() => {
    if (!token) return;
    const n = ++pedido.current;
    setEstado((e) => (e.tipo === 'listo' ? { ...e, actualizando: true } : { tipo: 'cargando' }));
    void apiAdministrativa
      .consultarProfesionales(token, {
        ...(lista.texto ? { text: lista.texto } : {}),
        ...(lista.alcance ? { scope: lista.alcance } : {}),
        ...(lista.situacion ? { situation: lista.situacion } : {}),
        ...(cursor ? { cursor } : {}),
        limit: TAMANO_DE_PAGINA,
      })
      .then((r) => {
        // Una respuesta pedida con otros filtros u otra página se descarta.
        if (n !== pedido.current) return;
        if (revisar(r)) return;
        if (!r.ok) {
          setEstado({ tipo: 'error', motivo: motivoDeFalla(r) });
          return;
        }
        setEstado({ tipo: 'listo', datos: r.datos, actualizando: false });
      });
  }, [token, lista.texto, lista.alcance, lista.situacion, cursor, vuelta, revisar]);

  // La posición guardada, cuando ya están las filas; el foco a la cuenta, después de cambiar de página.
  useEffect(() => {
    if (estado.tipo !== 'listo' || estado.actualizando) return;
    if (posicionPendiente.current !== null) {
      window.scrollTo({ top: posicionPendiente.current });
      posicionPendiente.current = null;
    }
    if (moverFoco.current) {
      moverFoco.current = false;
      cuenta.current?.focus();
    }
  }, [estado]);

  function cambiar(cambios: Partial<typeof lista>) {
    guardarLista({ ...lista, ...cambios, cursores: [null], desplazamiento: 0 });
  }

  function buscar(e: FormEvent) {
    e.preventDefault();
    cambiar({ texto: buscado.trim() });
  }

  const conFiltros = lista.texto !== '' || lista.alcance !== '' || lista.situacion !== '';
  const datos = estado.tipo === 'listo' ? estado.datos : null;

  return (
    <div className="lista-administrativa">
      <div className="encabezado-de-bloque">
        <h1>{L.titulo}</h1>
      </div>
      <p className="bajada">{L.queEs}</p>
      <p className="nota nota--con-icono">
        <Icono nombre="info" tamano={18} />
        {COPY_ADMINISTRACION.noCertifica}
      </p>

      {datos ? (
        <div className="pendientes-de-administracion">
          <p>
            <Icono nombre="pendientes" />
            <strong>{L.pendientes(datos.totals.pendingReview)}</strong>
          </p>
          {datos.totals.pendingReview > 0 && lista.situacion !== 'PENDING_REVIEW' ? (
            <button
              type="button"
              className="boton boton--secundario boton--compacto"
              onClick={() => {
                setBuscado('');
                guardarLista({ ...LISTA_INICIAL, situacion: 'PENDING_REVIEW' });
              }}
            >
              {L.verPendientes}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="filtros-de-administracion">
        <form role="search" className="buscador-administrativo" onSubmit={buscar}>
          <label htmlFor={`${id}-buscar`}>{L.buscar}</label>
          <div className="buscador-administrativo__fila">
            <input id={`${id}-buscar`} type="search" value={buscado} maxLength={100} autoComplete="off" spellCheck={false} onChange={(e) => setBuscado(e.target.value)} />
            <button type="submit" className="boton boton--secundario">
              <Icono nombre="buscar" />
              {L.buscarBoton}
            </button>
            {lista.texto ? (
              <button
                type="button"
                className="boton boton--enlace"
                onClick={() => {
                  setBuscado('');
                  cambiar({ texto: '' });
                }}
              >
                {L.limpiar}
              </button>
            ) : null}
          </div>
        </form>
        <div className="campo">
          <label htmlFor={`${id}-area`}>{L.area}</label>
          <select id={`${id}-area`} value={lista.alcance} onChange={(e) => cambiar({ alcance: e.target.value as Alcance | '' })}>
            <option value="">{L.todas}</option>
            {ALCANCES.map((a) => (
              <option key={a} value={a}>
                {ETIQUETA_DE_ALCANCE[a]}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-situacion`}>{L.situacion}</label>
          <select id={`${id}-situacion`} value={lista.situacion} onChange={(e) => cambiar({ situacion: e.target.value as SituacionDeArea | '' })}>
            <option value="">{L.todas}</option>
            {SITUACIONES_DE_AREA.map((s) => (
              <option key={s} value={s}>
                {COPY_ADMINISTRACION.situacion[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {estado.tipo === 'cargando' ? <Cargando /> : null}
      {estado.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[estado.motivo]} titulo={`No pudimos cargar ${L.noLeida}`} onReintentar={() => setVuelta((n) => n + 1)} deQue={L.noLeida} rol="alert">
          {razonDeFalla(estado.motivo)}
        </BloqueDeEstado>
      ) : null}

      {datos ? (
        <section aria-labelledby={`${id}-cuenta`} aria-busy={estado.tipo === 'listo' && estado.actualizando}>
          <p id={`${id}-cuenta`} ref={cuenta} tabIndex={-1} className="metadatos" role="status">
            {L.coinciden(datos.totals.matching)}
            {pagina > 1 || datos.page.hasMore ? ` · ${L.pagina(pagina)}` : ''}
          </p>
          {datos.data.length === 0 ? (
            conFiltros ? (
              <EstadoVacio
                titulo={L.vacio}
                icono="sin-datos"
                accion={
                  <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={() => {
                      setBuscado('');
                      guardarLista(LISTA_INICIAL);
                    }}
                  >
                    {L.quitarFiltros}
                  </button>
                }
              />
            ) : (
              <EstadoVacio titulo={L.vacioSinFiltros} icono="sin-datos">
                <p className="nota">{L.vacioSinFiltrosAyuda}</p>
              </EstadoVacio>
            )
          ) : (
            <div className="desplazable-x">
              <table className="tabla tabla--profesionales">
                <caption className="visualmente-oculto">
                  {L.titulo}
                  {pagina > 1 ? `, ${L.pagina(pagina).toLowerCase()}` : ''}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{L.profesional}</th>
                    {ALCANCES.map((a) => (
                      <th key={a} scope="col">
                        {ETIQUETA_DE_ALCANCE[a]}
                      </th>
                    ))}
                    <th scope="col">
                      <span className="visualmente-oculto">{L.abrir}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datos.data.map((p) => (
                    <tr key={p.professionalId}>
                      <th scope="row" className="profesional-de-la-lista">
                        <span className="profesional-de-la-lista__nombre">{p.displayName}</span>
                        <span className="nota">{p.email ?? L.sinCorreo}</span>
                        <span className="nota">
                          {COPY_ADMINISTRACION.ficha.tipoDePerfil[p.profileType]}
                          {p.accountState !== 'OPERATIVA' ? ` · ${COPY_ADMINISTRACION.cuentaEnPalabras[p.accountState]}` : ''}
                        </span>
                      </th>
                      {ALCANCES.map((a) => {
                        const area = p.scopes.find((s) => s.scope === a);
                        return (
                          <td key={a} data-etiqueta={ETIQUETA_DE_ALCANCE[a]}>
                            {area ? <Situacion situacion={area.situation} /> : null}
                          </td>
                        );
                      })}
                      <td>
                        <Link
                          className="boton boton--secundario boton--compacto"
                          href={`/admin/professional?id=${encodeURIComponent(p.professionalId)}`}
                          onClick={() => guardarLista({ ...lista, desplazamiento: window.scrollY })}
                        >
                          {L.abrir}
                          <span className="visualmente-oculto"> de {p.displayName}</span>
                          <Icono nombre="derecha" tamano={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagina > 1 || datos.page.hasMore ? (
            <nav aria-label={L.paginacion} className="paginacion">
              <button
                type="button"
                className="boton boton--secundario boton--compacto"
                disabled={pagina === 1 || estado.tipo !== 'listo' || estado.actualizando}
                onClick={() => {
                  moverFoco.current = true;
                  guardarLista({ ...lista, cursores: lista.cursores.slice(0, -1), desplazamiento: 0 });
                }}
              >
                <Icono nombre="izquierda" tamano={18} />
                {L.anterior}
              </button>
              <span className="nota">{L.pagina(pagina)}</span>
              <button
                type="button"
                className="boton boton--secundario boton--compacto"
                disabled={!datos.page.hasMore || !datos.page.nextCursor || estado.tipo !== 'listo' || estado.actualizando}
                onClick={() => {
                  moverFoco.current = true;
                  guardarLista({ ...lista, cursores: [...lista.cursores, datos.page.nextCursor], desplazamiento: 0 });
                }}
              >
                {L.siguiente}
                <Icono nombre="derecha" tamano={18} />
              </button>
            </nav>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
