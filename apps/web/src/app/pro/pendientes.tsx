'use client';

/**
 * «Pendientes» (API-CAR-01; PF-07, decidido el 2026-09-30, DL-107): a quién mirar hoy, con hechos fechados.
 * - Una fila por asesorado y área donde hay algo objetivo que hacer; «Abrir» lleva a la vista que lo resuelve.
 * - El último registro acompaña a la fila como dato: no hay filas por «sin registros» y nada se colorea por
 *   comportamiento de la persona (09v11 §15, regla crítica; B10-08 §10).
 * - Un área que el profesional no puede ver no aparece; si alguna quedó fuera, un aviso único.
 *
 * WP-ESCRITORIO-AMABLE, parte 5 (la pantalla 13 de las maquetas):
 * - **Las vistas con nombre** («Todo», «Revisiones», «Planes», «Formularios», «Tomas») dicen cuántos pendientes
 *   traen. La cartera se lee entera y se cuenta acá: elegir una vista no le pide nada a la API. El orden no cambia: es
 *   el de la urgencia, que fija la API.
 * - **«Más filtros»** guarda la combinación libre: un área, un tipo exacto y el período. Con un área o un tipo suelto
 *   la selección es a medida: ninguna vista queda elegida y lo puesto se lista, con su salida.
 * - **El período no cambia qué está pendiente:** acota solo el último registro de cada fila, y lo dice. Sin período se
 *   mira toda la historia, y entonces no se habla de «el período».
 * - **Una falla dice su motivo,** y una vista sin filas no es «nada pendiente».
 */
import {
  COPY_CARTERA,
  TIPOS_DE_LA_VISTA_DE_PENDIENTES,
  TIPOS_DE_PENDIENTE,
  VISTAS_DE_PENDIENTES,
  contarPendientesPorVista,
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
import Link from 'next/link';
import { useId, useState } from 'react';
import { BloqueDeEstado, EstadoVacio } from '../../components/estados';
import { Icono } from '../../components/icono';
import { BotonDeVista } from '../../components/vista-con-nombre';
import { ICONO_DE_FALLA, razonDeFalla } from '../../lib/fallas';
import { diaCivil, diaDelAnioEnCurso, horaDelDia } from '../../lib/formato';
import type { EstadoDeListaCompleta } from '../../lib/lista-completa';
import { FiltroDePeriodo, type Periodo } from './advisees/periodo';
import { ICONO_DE_LA_VISTA_DE_PENDIENTES, ICONO_DEL_AREA_DE_CARTERA, ICONO_DEL_PENDIENTE, rutaQueResuelve, textoDePendiente, ultimoRegistroDe } from './pendiente-en-una-fila';

/** Una página de la cartera, como la guarda la lista: los pendientes y lo que la respuesta dice además de ellos. */
export interface PaginaDeCartera {
  readonly data: readonly PendienteDeCartera[];
  readonly page: CarteraResponse['page'];
  readonly meta: Omit<CarteraResponse['data'], 'items'>;
}
export type EstadoDeLaCartera = EstadoDeListaCompleta<PaginaDeCartera>;

const AREAS = ['nutrition', 'training', 'anthropometry'] as const;
const PENDIENTES = ['pendiente', 'pendientes'] as const;
const TODO = filtroDeLaVistaDePendientes('TODO');

/** La vista cuyos tipos son exactamente estos, haya o no un área elegida: para nombrar el grupo en «Más filtros». */
const vistaDeLosTipos = (tipos: readonly TipoDePendiente[]): VistaDePendientes | null => vistaDeLosFiltrosDePendientes({ tipos, area: null });

/** «1 sept 2026 – 30 sept 2026», «desde el 1 sept 2026» o «hasta el 30 sept 2026»: el período, como se pidió. */
function periodoEnPalabras({ periodStart: desde, periodEnd: hasta }: Periodo): string {
  if (desde && hasta) return `${diaCivil(desde)} – ${diaCivil(hasta)}`;
  if (desde) return `desde el ${diaCivil(desde)}`;
  return hasta ? `hasta el ${diaCivil(hasta)}` : '';
}

export function Pendientes({
  cartera,
  periodo,
  onPeriodo,
  onActualizar,
  onVerMas,
}: {
  cartera: EstadoDeLaCartera;
  /** El período del último registro que se le pidió a la API (vacío = toda la historia). */
  periodo: Periodo;
  onPeriodo: (p: Periodo) => void;
  /** Vuelve a leer todo lo que la página muestra: los pendientes, los asesorados y las solicitudes. */
  onActualizar: () => void;
  onVerMas: () => void;
}) {
  const id = useId();
  const [filtro, setFiltro] = useState<FiltroDePendientes>(TODO);
  const [masFiltros, setMasFiltros] = useState(false);
  // Al quitar el período desde su etiqueta, el formulario se monta de nuevo: sus dos campos quedan vacíos.
  const [versionDelPeriodo, setVersionDelPeriodo] = useState(0);

  const vistaElegida = vistaDeLosFiltrosDePendientes(filtro);
  const aMedida = vistaElegida === null;
  const conPeriodo = Boolean(periodo.periodStart || periodo.periodEnd);
  const tiposAMedida = aMedida && filtro.tipos.length > 0;
  const cuantosFiltros = (filtro.area ? 1 : 0) + (tiposAMedida ? 1 : 0) + (conPeriodo ? 1 : 0);
  const grupoDeTipos = filtro.tipos.length > 1 ? vistaDeLosTipos(filtro.tipos) : null;

  const quitarPeriodo = () => {
    onPeriodo({});
    setVersionDelPeriodo((v) => v + 1);
  };
  const limpiar = () => {
    setFiltro(TODO);
    if (conPeriodo) quitarPeriodo();
  };

  const listo = cartera.tipo === 'listo' ? cartera : null;
  const cuentas = listo ? contarPendientesPorVista(listo.items) : null;
  const filas = listo ? filtrarPendientes(listo.items, filtro) : [];
  const hoy = listo?.primera.meta.today ?? '';
  const zona = listo?.primera.meta.timeZone ?? 'UTC';
  const dia = (fechaCivil: string) => diaDelAnioEnCurso(fechaCivil, hoy);

  const etiquetas: { texto: string; quitar: () => void }[] = [
    ...(filtro.area ? [{ texto: `${COPY_CARTERA.filtroDominio}: ${COPY_CARTERA.dominio[filtro.area]}`, quitar: () => setFiltro({ ...filtro, area: null }) }] : []),
    ...(tiposAMedida
      ? [
          {
            // Los tipos de una vista se dicen con el nombre de la vista, no uno por uno.
            texto: `Tipo: ${grupoDeTipos ? COPY_CARTERA.vista[grupoDeTipos].toLowerCase() : filtro.tipos.map((t) => COPY_CARTERA.tipo[t]).join(', ')}`,
            quitar: () => setFiltro({ ...filtro, tipos: [] }),
          },
        ]
      : []),
    ...(conPeriodo ? [{ texto: `Último registro: ${periodoEnPalabras(periodo)}`, quitar: quitarPeriodo }] : []),
  ];

  return (
    <section className="tarjeta-del-espacio pendientes" aria-labelledby={`${id}-titulo`}>
      <div className="tarjeta-del-espacio__cabecera">
        <Icono nombre="pendientes" tamano={24} />
        <h2 id={`${id}-titulo`}>{COPY_CARTERA.titulo}</h2>
      </div>

      {/* Qué ver. Las cantidades salen de la cartera leída entera: sin ella (cargando o con una falla) no hay número. */}
      <div className="vistas-de-la-linea pendientes__vistas">
        <div className="vistas-de-la-linea__vistas" role="group" aria-label="Qué pendientes ver">
          {VISTAS_DE_PENDIENTES.map((v) => (
            <BotonDeVista
              key={v}
              clave={v}
              nombre={COPY_CARTERA.vista[v]}
              icono={ICONO_DE_LA_VISTA_DE_PENDIENTES[v]}
              unidad={PENDIENTES}
              elegida={vistaElegida === v}
              cuenta={cuentas ? cuentas[v] : null}
              alMenos={listo ? !listo.completa : false}
              // Volver a tocar la vista elegida deja «Todo», como en la línea de tiempo.
              onElegir={() => setFiltro(filtroDeLaVistaDePendientes(vistaElegida === v ? 'TODO' : v))}
            />
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
              <select id={`${id}-area`} value={filtro.area ?? ''} onChange={(e) => setFiltro({ ...filtro, area: (e.target.value || null) as DominioDeCartera | null })}>
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
                  setFiltro({ ...filtro, tipos: e.target.value ? [e.target.value as TipoDePendiente] : [] });
                }}
              >
                <option value="">{COPY_CARTERA.todos}</option>
                {/* Una vista con varios tipos elegida: se dice con su nombre, y sigue elegida hasta que se cambie. */}
                {filtro.tipos.length > 1 ? (
                  <option value="GRUPO">{grupoDeTipos ? `${COPY_CARTERA.vista[grupoDeTipos]} (sus ${TIPOS_DE_LA_VISTA_DE_PENDIENTES[grupoDeTipos].length} tipos)` : `Varios tipos (${filtro.tipos.length})`}</option>
                ) : null}
                {TIPOS_DE_PENDIENTE.map((k) => (
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
              {filas.length === 1 ? 'Un pendiente coincide' : `${numero(filas.length)} pendientes coinciden`}, de {numero(listo.items.length)}
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
        <BloqueDeEstado tipo="error" icono={ICONO_DE_FALLA[cartera.motivo]} titulo="No pudimos cargar los pendientes" onReintentar={onActualizar} deQue="los pendientes">
          {razonDeFalla(cartera.motivo)}
        </BloqueDeEstado>
      ) : null}

      {listo ? (
        <>
          {listo.items.length === 0 ? (
            <p className="pendientes__vacio">
              <Icono nombre="pendientes" tamano={20} />
              {COPY_CARTERA.vacio}
            </p>
          ) : filas.length === 0 ? (
            <EstadoVacio
              titulo={COPY_CARTERA.sinCoincidencias}
              accion={
                <button type="button" className="boton boton--secundario" onClick={() => setFiltro(TODO)}>
                  Ver todo
                </button>
              }
            >
              <p className="nota">
                {listo.items.length === 1 ? 'Hay un pendiente' : `Hay ${numero(listo.items.length)}${listo.completa ? '' : ' o más'} pendientes`} en total.
              </p>
            </EstadoVacio>
          ) : (
            <table className="tabla tabla-de-pendientes" aria-busy={listo.actualizando}>
              <caption className="visualmente-oculto">
                {COPY_CARTERA.titulo}: {numero(filas.length)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Asesorado</th>
                  <th scope="col">{COPY_CARTERA.filtroDominio}</th>
                  <th scope="col">Pendiente</th>
                  <th scope="col">
                    <span className="visualmente-oculto">{COPY_CARTERA.abrir}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => {
                  const texto = textoDePendiente(p, dia);
                  const area = COPY_CARTERA.dominio[p.domain];
                  return (
                    <tr key={`${p.kind}|${p.domain}|${p.advisee.identityId}`} className="pendiente" data-tipo={p.kind} data-area={p.domain}>
                      <th scope="row">{p.advisee.displayName}</th>
                      <td data-etiqueta={COPY_CARTERA.filtroDominio}>
                        <span className="pendiente__area">
                          <Icono nombre={ICONO_DEL_AREA_DE_CARTERA[p.domain]} tamano={20} />
                          {area}
                        </span>
                      </td>
                      <td data-etiqueta="Pendiente">
                        <span className="pendiente__que">
                          <Icono nombre={ICONO_DEL_PENDIENTE[p.kind]} tamano={20} />
                          <span>
                            <span className="pendiente__texto">{texto}</span>
                            <span className="pendiente__ultimo">{ultimoRegistroDe(p, { zona, conPeriodo, dia })}</span>
                          </span>
                        </span>
                      </td>
                      <td className="pendiente__abrir">
                        <Link className="pendiente__enlace" href={rutaQueResuelve(p)} aria-label={`${COPY_CARTERA.accion[p.kind]}: ${p.advisee.displayName}, ${area}, ${texto}`}>
                          {COPY_CARTERA.accion[p.kind]}
                          <Icono nombre="derecha" tamano={18} />
                        </Link>
                      </td>
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
              <span className="visualmente-oculto">: vuelve a leer los pendientes, tus asesorados y las solicitudes</span>
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
