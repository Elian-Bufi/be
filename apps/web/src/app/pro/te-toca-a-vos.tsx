'use client';

/**
 * «Te toca a vos» (WP-TABLERO-ALTA-GAMA TB-11; DL-163 D-4): los pendientes de la cartera que resuelve el profesional
 * (revisiones, planes y tomas), agrupados por persona. Antes era «Pendientes» (API-CAR-01; PF-07, DL-107), con los siete
 * tipos en una sola lista; los formularios pasaron a «Esperan respuesta» (`esperan-respuesta.tsx`).
 * - **Por persona,** por omisión: un bloque por persona (por `identityId`), con su monograma, y las personas por su
 *   pendiente más urgente según `compararPendientes`; los renglones de cada una, en ese orden (`mesa.ts`).
 * - **Por pendiente:** la lista de DL-107, una fila por persona, área y tipo, exactamente en el orden de la API.
 * - **Las vistas** (Todo, Revisiones, Planes y Tomas) son las cifras del encabezado (`cifras-del-espacio.tsx`): el
 *   filtro vive en el Espacio y llega acá. «Más filtros» sigue con el área, un tipo exacto y el período del último
 *   registro, que no cambia qué está pendiente.
 * - El último registro acompaña a la fila como dato: nada se colorea por lo que hace la persona (09v11 §15; B10-08 §10).
 * - Una falla dice su motivo, y una vista sin filas no es «nada pendiente». «Actualizar» deja a la vista lo ya leído si
 *   falla (bloque 5 del encargo de consolidación).
 */
import {
  COPY_CARTERA,
  filtrarPendientes,
  filtroDeLaVistaDePendientes,
  numero,
  vistaDeLosFiltrosDePendientes,
  type CarteraResponse,
  type DominioDeCartera,
  type FiltroDePendientes,
  type PendienteDeCartera,
  type TipoDePendiente,
  type VistaDePendientes,
} from '@be/domain';
import { Enlace } from '../../components/enlace';
import { useId, useState } from 'react';
import { BloqueDeEstado, EstadoVacio } from '../../components/estados';
import { Icono } from '../../components/icono';
import { Retrato } from '../../components/retrato';
import { ICONO_DE_FALLA, razonDeFalla } from '../../lib/fallas';
import { diaCivil, diaDelAnioEnCurso, horaDelDia } from '../../lib/formato';
import type { EstadoDeListaCompleta } from '../../lib/lista-completa';
import { useNombres } from '../../lib/nombres-ocultos';
import { FiltroDePeriodo, type Periodo } from './advisees/periodo';
import { conOrigenEnElEspacio } from './lugar-del-espacio';
import { claveDelPendiente, COPY_MESA, delCarril, porPersona, TIPOS_QUE_TE_TOCAN, type ModoDeLaMesa } from './mesa';
import { ICONO_DEL_AREA_DE_CARTERA, ICONO_DEL_PENDIENTE, rutaQueResuelve, textoDePendiente, ultimoRegistroDe } from './pendiente-en-una-fila';

/** Una página de la cartera, como la guarda la lista: los pendientes y lo que la respuesta dice además de ellos. */
export interface PaginaDeCartera {
  readonly data: readonly PendienteDeCartera[];
  readonly page: CarteraResponse['page'];
  readonly meta: Omit<CarteraResponse['data'], 'items'>;
}
export type EstadoDeLaCartera = EstadoDeListaCompleta<PaginaDeCartera>;

const AREAS = ['nutrition', 'training', 'anthropometry'] as const;
export const TODO = filtroDeLaVistaDePendientes('TODO');

/** La vista cuyos tipos son exactamente estos, haya o no un área elegida: para nombrar el grupo en «Más filtros». */
const vistaDeLosTipos = (tipos: readonly TipoDePendiente[]): VistaDePendientes | null => vistaDeLosFiltrosDePendientes({ tipos, area: null });

/** «1 sept 2026 – 30 sept 2026», «desde el 1 sept 2026» o «hasta el 30 sept 2026»: el período, como se pidió. */
function periodoEnPalabras({ periodStart: desde, periodEnd: hasta }: Periodo): string {
  if (desde && hasta) return `${diaCivil(desde)} – ${diaCivil(hasta)}`;
  if (desde) return `desde el ${diaCivil(desde)}`;
  return hasta ? `hasta el ${diaCivil(hasta)}` : '';
}

export function TeTocaAVos({
  cartera,
  periodo,
  onPeriodo,
  filtro,
  onFiltro,
  modo,
  onModo,
  onActualizar,
  onReintentar,
  onVerMas,
  alComienzo,
  alAbrir,
}: {
  cartera: EstadoDeLaCartera;
  /** El período del último registro que se le pidió a la API (vacío = toda la historia). */
  periodo: Periodo;
  onPeriodo: (p: Periodo) => void;
  /** Lo elegido en las cifras del encabezado y en «Más filtros». */
  filtro: FiltroDePendientes;
  onFiltro: (f: FiltroDePendientes) => void;
  modo: ModoDeLaMesa;
  onModo: (m: ModoDeLaMesa) => void;
  /** Vuelve a leer todo lo que la página muestra. */
  onActualizar: () => void;
  /** Vuelve a leer solo los pendientes: es lo que falló. */
  onReintentar: () => void;
  onVerMas: () => void;
  /** Lo que va arriba de la lista, al lado del título (TB-12: «Empezar por el primero», con el cajón prendido). */
  alComienzo?: React.ReactNode;
  /** TB-07: al abrir un verbo se guarda el lugar del Espacio, para volver donde se estaba. */
  alAbrir?: (p: PendienteDeCartera) => void;
}) {
  const id = useId();
  const nombres = useNombres();
  const [masFiltros, setMasFiltros] = useState(false);
  // Al quitar el período desde su etiqueta, el formulario se monta de nuevo: sus dos campos quedan vacíos.
  const [versionDelPeriodo, setVersionDelPeriodo] = useState(0);

  const aMedida = vistaDeLosFiltrosDePendientes(filtro) === null;
  const conPeriodo = Boolean(periodo.periodStart || periodo.periodEnd);
  const tiposAMedida = aMedida && filtro.tipos.length > 0;
  const cuantosFiltros = (filtro.area ? 1 : 0) + (tiposAMedida ? 1 : 0) + (conPeriodo ? 1 : 0);
  const grupoDeTipos = filtro.tipos.length > 1 ? vistaDeLosTipos(filtro.tipos) : null;

  const quitarPeriodo = () => {
    onPeriodo({});
    setVersionDelPeriodo((v) => v + 1);
  };
  /** «Limpiar filtros» y «Ver todo» son la misma acción: «Todo», sin área, sin tipo y sin período. */
  const limpiar = () => {
    onFiltro(TODO);
    if (conPeriodo) quitarPeriodo();
  };

  const listo = cartera.tipo === 'listo' ? cartera : null;
  const teTocan = listo ? delCarril(listo.items, TIPOS_QUE_TE_TOCAN) : [];
  const filas = filtrarPendientes(teTocan, filtro);
  const hoy = listo?.primera.meta.today ?? '';
  const zona = listo?.primera.meta.timeZone ?? 'UTC';
  const dia = (fechaCivil: string) => diaDelAnioEnCurso(fechaCivil, hoy);

  const etiquetas: { texto: string; quitar: () => void }[] = [
    ...(filtro.area ? [{ texto: `${COPY_CARTERA.filtroDominio}: ${COPY_CARTERA.dominio[filtro.area]}`, quitar: () => onFiltro({ ...filtro, area: null }) }] : []),
    ...(tiposAMedida
      ? [
          {
            texto: `Tipo: ${grupoDeTipos ? COPY_CARTERA.vista[grupoDeTipos].toLowerCase() : filtro.tipos.map((t) => COPY_CARTERA.tipo[t]).join(', ')}`,
            quitar: () => onFiltro({ ...filtro, tipos: [] }),
          },
        ]
      : []),
    ...(conPeriodo ? [{ texto: `Último registro: ${periodoEnPalabras(periodo)}`, quitar: quitarPeriodo }] : []),
  ];

  /** Qué está pendiente, en palabras, y el verbo que lo resuelve, con el rótulo que lee el lector de pantalla. */
  const renglon = (p: PendienteDeCartera) => {
    const texto = textoDePendiente(p, dia);
    const area = COPY_CARTERA.dominio[p.domain];
    const quien = nombres.delAsesorado(p.advisee);
    return { texto, area, quien, ultimo: ultimoRegistroDe(p, { zona, conPeriodo, dia }), etiqueta: `${COPY_CARTERA.accion[p.kind]}: ${quien}, ${area}, ${texto}` };
  };
  const verbo = (p: PendienteDeCartera, etiqueta: string) => (
    <Enlace className="pendiente__enlace" href={conOrigenEnElEspacio(rutaQueResuelve(p))} aria-label={etiqueta} data-pendiente={claveDelPendiente(p)} onClick={() => alAbrir?.(p)}>
      {COPY_CARTERA.accion[p.kind]}
      <Icono nombre="derecha" tamano={18} />
    </Enlace>
  );

  return (
    <section id="te-toca-a-vos" className="tarjeta-del-espacio pendientes te-toca" aria-labelledby={`${id}-titulo`} tabIndex={-1}>
      <div className="tarjeta-del-espacio__cabecera te-toca__cabecera">
        <Icono nombre="pendientes" tamano={24} />
        <h2 id={`${id}-titulo`}>{COPY_MESA.teToca}</h2>
        {alComienzo}
      </div>

      <div className="vistas-de-la-linea pendientes__vistas">
        <div className="mesa__modo" role="group" aria-label={COPY_MESA.comoVer}>
          {(['persona', 'pendiente'] as const).map((m) => (
            <button key={m} type="button" className="vista-de-la-linea" data-modo={m} aria-pressed={modo === m} onClick={() => onModo(m)}>
              <Icono nombre={m === 'persona' ? 'persona' : 'lista'} tamano={18} />
              {m === 'persona' ? COPY_MESA.porPersona : COPY_MESA.porPendiente}
            </button>
          ))}
        </div>
        <button type="button" className="boton boton--quieto boton--compacto vistas-de-la-linea__mas" aria-expanded={masFiltros} aria-controls={`${id}-filtros`} onClick={() => setMasFiltros(!masFiltros)}>
          <Icono nombre="filtros" tamano={18} />
          {COPY_CARTERA.masFiltros}
          {cuantosFiltros > 0 ? ` (${cuantosFiltros})` : ''}
        </button>
      </div>

      <div id={`${id}-filtros`} className="filtros-de-linea pendientes__filtros" hidden={!masFiltros}>
        {masFiltros ? (
          <>
            <div className="campo">
              <label htmlFor={`${id}-area`}>{COPY_CARTERA.filtroDominio}</label>
              <select id={`${id}-area`} value={filtro.area ?? ''} onChange={(e) => onFiltro({ ...filtro, area: (e.target.value || null) as DominioDeCartera | null })}>
                <option value="">Todas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {COPY_CARTERA.dominio[a]}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor={`${id}-tipo`}>{COPY_CARTERA.filtroTipo}</label>
              <select
                id={`${id}-tipo`}
                value={filtro.tipos.length === 0 ? '' : filtro.tipos.length === 1 ? filtro.tipos[0] : 'GRUPO'}
                onChange={(e) => {
                  if (e.target.value === 'GRUPO') return;
                  onFiltro({ ...filtro, tipos: e.target.value ? [e.target.value as TipoDePendiente] : [] });
                }}
              >
                <option value="">{COPY_CARTERA.todos}</option>
                {filtro.tipos.length > 1 ? <option value="GRUPO">{grupoDeTipos ? COPY_CARTERA.vista[grupoDeTipos] : `Varios tipos (${filtro.tipos.length})`}</option> : null}
                {TIPOS_QUE_TE_TOCAN.map((k) => (
                  <option key={k} value={k}>
                    {COPY_CARTERA.tipo[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="pendientes__periodo" role="group" aria-labelledby={`${id}-periodo`} aria-describedby={`${id}-periodo-ayuda`}>
              <div className="pendientes__periodo-cabecera">
                <p id={`${id}-periodo`} className="pendientes__rotulo">
                  {COPY_CARTERA.periodoDelUltimoRegistro}
                </p>
                <p id={`${id}-periodo-ayuda`} className="nota">
                  {COPY_CARTERA.ayudaDelPeriodo}
                </p>
              </div>
              <FiltroDePeriodo key={versionDelPeriodo} id={`${id}-periodo-campos`} inicial={periodo} onAplicar={onPeriodo} />
            </div>
          </>
        ) : null}
      </div>

      {listo?.primera.meta.partialView ? (
        <p className="pendientes__parcial">
          <Icono nombre="oculto" tamano={18} />
          {COPY_CARTERA.vistaParcial}
        </p>
      ) : null}

      {etiquetas.length > 0 ? (
        <div className="filtros-activos">
          {listo && aMedida ? (
            <p className="pendientes__coinciden" role="status">
              {filas.length === 1 ? 'Un pendiente coincide' : `${numero(filas.length)} pendientes coinciden`}, de {numero(teTocan.length)}
              {listo.completa ? '' : ' o más'}.
            </p>
          ) : null}
          <p className="visualmente-oculto">Filtros activos</p>
          <ul>
            {etiquetas.map((e) => (
              <li key={e.texto}>
                <button type="button" className="chip" onClick={e.quitar}>
                  {e.texto} <span aria-hidden="true">×</span>
                  <span className="visualmente-oculto"> (quitar)</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="boton boton--enlace" onClick={limpiar}>
            Limpiar filtros
          </button>
        </div>
      ) : null}

      {cartera.tipo === 'cargando' ? (
        <p className="cargando" role="status">
          Cargando los pendientes…
        </p>
      ) : null}
      {cartera.tipo === 'error' ? (
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[cartera.motivo]} titulo="No pudimos cargar los pendientes" onReintentar={onReintentar} deQue="los pendientes">
          {razonDeFalla(cartera.motivo)}
        </BloqueDeEstado>
      ) : null}

      {listo ? (
        <>
          {listo.fallaAlActualizar ? (
            <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[listo.fallaAlActualizar]} titulo="No pudimos actualizar los pendientes" onReintentar={onReintentar} deQue="los pendientes" rol="alert">
              {razonDeFalla(listo.fallaAlActualizar)} Se ven los consultados a las {horaDelDia(listo.consultado)}.
            </BloqueDeEstado>
          ) : null}
          {teTocan.length === 0 ? (
            <p className="pendientes__vacio">
              <Icono nombre="pendientes" tamano={20} />
              {COPY_MESA.vacioTeToca}
            </p>
          ) : filas.length === 0 ? (
            <EstadoVacio
              titulo={COPY_CARTERA.sinCoincidencias}
              accion={
                etiquetas.length > 0 ? undefined : (
                  <button type="button" className="boton boton--secundario" onClick={limpiar}>
                    Ver todo
                  </button>
                )
              }
            >
              <p className="nota">
                {teTocan.length === 1 ? 'Hay un pendiente' : `Hay ${numero(teTocan.length)}${listo.completa ? '' : ' o más'} pendientes`} en total.
                {etiquetas.length > 0 ? ' «Limpiar filtros», arriba, los muestra.' : ''}
              </p>
            </EstadoVacio>
          ) : modo === 'persona' ? (
            // D-4: un bloque por persona, con su pendiente más urgente primero. Ningún color ni marca por persona.
            <ol className="mesa-por-persona" aria-busy={listo.actualizando} aria-label={`${COPY_MESA.teToca}, ${COPY_MESA.porPersona.toLowerCase()}`}>
              {porPersona(filas).map((persona) => {
                const quien = nombres.delAsesorado(persona.advisee);
                return (
                  <li key={persona.identityId} className="mesa-persona">
                    <p className="mesa-persona__quien">
                      <Retrato nombre={quien} />
                      <span className="mesa-persona__nombre">{quien}</span>
                      <span className="nota">{COPY_MESA.pendientesDe(persona.pendientes.length)}</span>
                    </p>
                    <ul className="mesa-persona__renglones">
                      {persona.pendientes.map((p) => {
                        const r = renglon(p);
                        return (
                          <li key={`${p.kind}|${p.domain}`} className="pendiente mesa-renglon" data-tipo={p.kind} data-area={p.domain}>
                            <span className="pendiente__area">
                              <Icono nombre={ICONO_DEL_AREA_DE_CARTERA[p.domain]} tamano={20} />
                              {r.area}
                            </span>
                            <span className="pendiente__que">
                              <Icono nombre={ICONO_DEL_PENDIENTE[p.kind]} tamano={20} />
                              <span>
                                <span className="pendiente__texto">{r.texto}</span>
                                <span className="pendiente__ultimo">{r.ultimo}</span>
                              </span>
                            </span>
                            <span className="pendiente__abrir">{verbo(p, r.etiqueta)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ol>
          ) : (
            <table className="tabla tabla-de-pendientes" aria-busy={listo.actualizando}>
              <caption className="visualmente-oculto">
                {COPY_MESA.teToca}: {numero(filas.length)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Persona</th>
                  <th scope="col">{COPY_CARTERA.filtroDominio}</th>
                  <th scope="col">Pendiente</th>
                  <th scope="col">
                    <span className="visualmente-oculto">{COPY_CARTERA.abrir}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => {
                  const r = renglon(p);
                  return (
                    <tr key={`${p.kind}|${p.domain}|${p.advisee.identityId}`} className="pendiente" data-tipo={p.kind} data-area={p.domain}>
                      <th scope="row">
                        <span className="con-retrato">
                          <Retrato nombre={r.quien} />
                          <span>{r.quien}</span>
                        </span>
                      </th>
                      <td data-etiqueta={COPY_CARTERA.filtroDominio}>
                        <span className="pendiente__area">
                          <Icono nombre={ICONO_DEL_AREA_DE_CARTERA[p.domain]} tamano={20} />
                          {r.area}
                        </span>
                      </td>
                      <td data-etiqueta="Pendiente">
                        <span className="pendiente__que">
                          <Icono nombre={ICONO_DEL_PENDIENTE[p.kind]} tamano={20} />
                          <span>
                            <span className="pendiente__texto">{r.texto}</span>
                            <span className="pendiente__ultimo">{r.ultimo}</span>
                          </span>
                        </span>
                      </td>
                      <td className="pendiente__abrir">{verbo(p, r.etiqueta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="pendientes__pie">
            {listo.completa ? null : (
              <p className="pendientes__incompleta">
                Se leyeron los primeros {numero(listo.items.length)}.{' '}
                <button type="button" className="boton boton--enlace" onClick={onVerMas} disabled={listo.actualizando}>
                  Ver más
                </button>
              </p>
            )}
            <p className="pendientes__consulta nota">Consultado a las {horaDelDia(listo.consultado)}</p>
            <button type="button" className="boton boton--quieto boton--compacto pendientes__actualizar" onClick={onActualizar} disabled={listo.actualizando} aria-busy={listo.actualizando}>
              <Icono nombre="actualizar" tamano={18} />
              Actualizar
              <span className="visualmente-oculto">: vuelve a leer los pendientes, lo que espera respuesta y las personas que acompañás</span>
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
