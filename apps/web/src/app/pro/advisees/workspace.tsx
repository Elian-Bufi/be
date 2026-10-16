'use client';

/**
 * Website `/pro/advisees?id=…` — workspace del asesorado (10-B01:746 como query por el export estático; DL-041):
 * - Encabezado con cada vínculo por alcance y su estado mínimo (10-B04 §28-§29; H10-04-04). El profesional ve
 *   «Acceso no disponible» sin la causa: nunca `B2=true` ni `PDP=DENY`.
 * - «Resumen» (API-DSH-03 mínimo, DL-031): cada lectura pasa por el PDP, sin caché (T-PDP-1). Desde WP-04, Nutrición
 *   abre su pestaña (B10-05). Desde el tramo de consolidación cada dominio disponible muestra su **resumen factual**
 *   en una tarjeta (B10-08 §10), y lo que falta se dice que falta (RF-053). Los dominios no disponibles no se listan:
 *   se avisa la vista parcial, sin «Datos ocultos: …» (10-B04 §41).
 * - 404 = no hay nada que mostrar: el mismo texto neutral para inexistente, ajeno, revocado o finalizado
 *   (UC-I02 E05; 10-B10:407). Es el estado que se ve cuando el asesorado revoca: el corte no espera a la sesión.
 * «Actualizar» vuelve a preguntar a la API y muestra la hora de la última consulta.
 *
 * WP-DASHBOARD-PROFESIONAL: la ficha tiene tres vistas —Resumen, Línea de tiempo y Analizar— con el mismo período,
 * todo en la URL (`vista=`, `p=` o `desde`/`hasta`, y el estado de cada vista). El Resumen de API-DSH-03 cuenta en ese
 * período; las pestañas de dominio siguen igual y son donde se abre el registro en su contexto completo.
 */
import { COPY_FORMULARIOS, COPY_VINCULO, estadoParaMostrar, type DashboardResponse, type Vinculo } from '@be/domain';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { api } from '../../../lib/api';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';
import { PestanasDelSeguimiento, SelectorDePeriodo } from './seguimiento/barra';
import { ProveedorDelSeguimiento } from './seguimiento/contexto';
import { leerPeriodo, leerVista, periodoEnInstantes } from './seguimiento/estado';
import { LineaDeTiempo } from './seguimiento/linea-de-tiempo';
import { ResumenDelSeguimiento } from './seguimiento/resumen';
import { TarjetaDeAntropometria, TarjetaDeEntrenamiento, TarjetaDeNutricion } from './tarjetas-de-dominio';

const Analizar = dynamic(() => import('./seguimiento/analizar').then((m) => m.Analizar), { ssr: false, loading: () => <Cargando /> });

type Resumen = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'no-disponible' } | { tipo: 'listo'; datos: DashboardResponse['data'] };
type Encabezado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; vinculos: readonly Vinculo[] };

const hora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function Workspace() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vista = leerVista(parametros.get('vista'));
  const claveDelPeriodo = `${parametros.get('p') ?? ''}|${parametros.get('desde') ?? ''}|${parametros.get('hasta') ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const periodo = useMemo(() => leerPeriodo(new URLSearchParams(parametros.toString())), [claveDelPeriodo]);
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(`/pro/advisees?id=${id}`);
  const [resumen, setResumen] = useState<Resumen>({ tipo: 'cargando' });
  const [encabezado, setEncabezado] = useState<Encabezado>({ tipo: 'cargando' });
  const [consultadoEn, setConsultadoEn] = useState<Date | null>(null);
  const generacion = useRef(0);
  const yoId = yo.tipo === 'listo' ? yo.id : null;

  const consultar = useCallback(async () => {
    if (!token || !yoId) return;
    const esta = ++generacion.current;
    setResumen({ tipo: 'cargando' });
    setEncabezado({ tipo: 'cargando' });
    const [panel, lista] = await Promise.all([
      id ? api.consultarDashboard(token, id, periodoEnInstantes(periodo)) : Promise.resolve(null),
      api.consultarVinculos(token),
    ]);
    if (esta !== generacion.current) return;
    if ((panel && sesionPerdida(panel)) || sesionPerdida(lista)) return;
    setConsultadoEn(new Date());
    if (!panel || (!panel.ok && panel.tipo === 'API' && panel.codigo === 'RESOURCE_NOT_FOUND')) setResumen({ tipo: 'no-disponible' });
    else setResumen(panel.ok ? { tipo: 'listo', datos: panel.datos.data } : { tipo: 'error' });
    setEncabezado(
      lista.ok ? { tipo: 'listo', vinculos: lista.datos.data.filter((v) => v.professional.identityId === yoId && v.advisee.identityId === id) } : { tipo: 'error' },
    );
  }, [token, yoId, id, sesionPerdida, periodo]);

  useEffect(() => {
    void consultar();
  }, [consultar]);

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  const nombre =
    resumen.tipo === 'listo' ? resumen.datos.advisee.displayName : encabezado.tipo === 'listo' && encabezado.vinculos[0] ? encabezado.vinculos[0].advisee.displayName : null;

  // El resumen de API-DSH-03 en el período, con sus tarjetas por dominio. Sin acceso, es lo único que se ve.
  const seccionDeResumen = (
    <section className="seccion" aria-labelledby="titulo-resumen" aria-live="polite">
      <h2 id="titulo-resumen">Estado por área</h2>
      {resumen.tipo === 'cargando' ? <Cargando /> : null}
      {resumen.tipo === 'error' ? <ErrorConReintento onReintentar={consultar} /> : null}
      {resumen.tipo === 'no-disponible' ? (
        <Aviso tipo="info">
          <p>{COPY_VINCULO.recursoNoDisponible}</p>
          <p>
            <Link href="/pro">{COPY_VINCULO.volver}</Link>
          </p>
        </Aviso>
      ) : null}
      {resumen.tipo === 'listo' ? (
        <>
          {/* Un aviso único, sin listar qué falta ni por qué (B10-08 §8.4; 10-B04 §41). */}
          {resumen.datos.partialView ? <p className="nota">{COPY_VINCULO.vistaParcial}</p> : null}
          <div className="tarjetas-de-dominio">
            <TarjetaDeNutricion entrada={resumen.datos.domains.nutrition} id={id} />
            <TarjetaDeEntrenamiento entrada={resumen.datos.domains.training} id={id} />
            <TarjetaDeAntropometria entrada={resumen.datos.domains.anthropometry} id={id} />
          </div>
          {/* Transversal a los tres alcances (WP-07): no cuelga de ninguno, así que va fuera de la lista. */}
          <p>
            <Link href={`/pro/advisees/forms?id=${encodeURIComponent(id)}`}>{COPY_FORMULARIOS.pedirInformacion}</Link>
          </p>
        </>
      ) : null}
      <div className="acciones">
        <button type="button" className="boton boton--secundario" onClick={() => void consultar()} disabled={resumen.tipo === 'cargando'}>
          Actualizar
        </button>
      </div>
      {consultadoEn ? <p className="nota">Última consulta: {hora.format(consultadoEn)}</p> : null}
    </section>
  );

  return (
    <div className="secciones">
      {/* Header contextual (B10-01): nombre, alcance, estado del vínculo; nada de ficha clínica. */}
      <section className="seccion contexto" aria-labelledby="titulo-asesorado">
        <h2 id="titulo-asesorado">{nombre ?? 'Asesorado'}</h2>
        {encabezado.tipo === 'cargando' ? <Cargando /> : null}
        {encabezado.tipo === 'error' ? <ErrorConReintento onReintentar={consultar} /> : null}
        {encabezado.tipo === 'listo' && encabezado.vinculos.length > 0 ? (
          <ul className="estados-de-vinculo estados-de-vinculo--en-linea">
            {encabezado.vinculos.map((v) => {
              const e = estadoParaMostrar(v, 'PROFESSIONAL');
              return (
                <li key={v.relationshipId}>
                  <strong>{v.scope.label}</strong>: <span className="insignia">{e.estado}</span>
                  {e.detalle ? <> {e.detalle}</> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      {token && resumen.tipo !== 'no-disponible' ? (
        <ProveedorDelSeguimiento token={token} asesoradoId={id} nombreDelAsesorado={nombre} sesionPerdida={sesionPerdida}>
          <div className="barra-del-seguimiento">
            <PestanasDelSeguimiento actual={vista} />
            <SelectorDePeriodo />
          </div>
          {vista === 'resumen' ? resumen.tipo === 'listo' ? <ResumenDelSeguimiento estadoPorArea={seccionDeResumen} /> : seccionDeResumen : null}
          {vista === 'linea' ? <LineaDeTiempo /> : null}
          {vista === 'analizar' ? <Analizar /> : null}
        </ProveedorDelSeguimiento>
      ) : (
        seccionDeResumen
      )}
    </div>
  );
}
