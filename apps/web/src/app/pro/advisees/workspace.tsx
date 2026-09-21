'use client';

/**
 * Website `/pro/advisees?id=…` — workspace del asesorado (10-B01:746 como query por el export estático; DL-041):
 * - Encabezado con cada vínculo por alcance y su estado mínimo (10-B04 §28-§29; H10-04-04). El profesional ve
 *   «Acceso no disponible» sin la causa: nunca `B2=true` ni `PDP=DENY`.
 * - «Resumen» (API-DSH-03 mínimo, DL-031): cada lectura pasa por el PDP, sin caché (T-PDP-1). Desde WP-04, Nutrición
 *   abre su pestaña (B10-05); los demás dominios siguen sin datos (RF-053: los faltantes se muestran como tales). Los dominios no disponibles no se listan: se avisa la
 *   vista parcial, sin «Datos ocultos: …» (10-B04 §41).
 * - 404 = no hay nada que mostrar: el mismo texto neutral para inexistente, ajeno, revocado o finalizado
 *   (UC-I02 E05; 10-B10:407). Es el estado que se ve cuando el asesorado revoca: el corte no espera a la sesión.
 * «Actualizar» vuelve a preguntar a la API y muestra la hora de la última consulta.
 */
import { ALCANCES, CLAVE_DE_DOMINIO, COPY_VINCULO, ETIQUETA_DE_ALCANCE, estadoParaMostrar, type DashboardResponse, type Vinculo } from '@be/domain';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { api } from '../../../lib/api';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';

type Resumen = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'no-disponible' } | { tipo: 'listo'; datos: DashboardResponse['data'] };
type Encabezado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; vinculos: readonly Vinculo[] };

const hora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function Workspace() {
  const id = useSearchParams().get('id') ?? '';
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
      id ? api.consultarDashboard(token, id) : Promise.resolve(null),
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
  }, [token, yoId, id, sesionPerdida]);

  useEffect(() => {
    void consultar();
  }, [consultar]);

  if (!token) return <p className="nota">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <Cargando />;
  if (yo.tipo === 'error') return <ErrorConReintento onReintentar={cargarYo} />;
  if (yo.tipo === 'sin-espacio') return <SinEspacioProfesional />;

  const nombre =
    resumen.tipo === 'listo' ? resumen.datos.advisee.displayName : encabezado.tipo === 'listo' && encabezado.vinculos[0] ? encabezado.vinculos[0].advisee.displayName : null;

  return (
    <div className="secciones">
      <section className="seccion" aria-labelledby="titulo-asesorado">
        <h2 id="titulo-asesorado">{nombre ?? 'Asesorado'}</h2>
        {encabezado.tipo === 'cargando' ? <Cargando /> : null}
        {encabezado.tipo === 'error' ? <ErrorConReintento onReintentar={consultar} /> : null}
        {encabezado.tipo === 'listo' && encabezado.vinculos.length > 0 ? (
          <ul className="estados-de-vinculo">
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

      <section className="seccion" aria-labelledby="titulo-resumen" aria-live="polite">
        <h2 id="titulo-resumen">Resumen</h2>
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
            {resumen.datos.partialView ? <p className="nota">{COPY_VINCULO.vistaParcial}</p> : null}
            <dl className="datos">
              {ALCANCES.filter((a) => resumen.datos.domains[CLAVE_DE_DOMINIO[a]].available).map((a) => (
                <div key={a}>
                  <dt>{ETIQUETA_DE_ALCANCE[a]}</dt>
                  <dd>
                    {a === 'NUTRICION' ? (
                      <Link href={`/pro/advisees/nutrition?id=${encodeURIComponent(id)}`}>Abrir Nutrición</Link>
                    ) : a === 'ANTROPOMETRIA' ? (
                      <Link href={`/pro/advisees/anthropometry?id=${encodeURIComponent(id)}`}>Abrir Antropometría</Link>
                    ) : a === 'ENTRENAMIENTO' ? (
                      <Link href={`/pro/advisees/training?id=${encodeURIComponent(id)}`}>Abrir Entrenamiento</Link>
                    ) : (
                      COPY_VINCULO.sinDatosTodavia
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
        <div className="acciones">
          <button type="button" className="boton boton--secundario" onClick={() => void consultar()} disabled={resumen.tipo === 'cargando'}>
            Actualizar
          </button>
        </div>
        {consultadoEn ? <p className="nota">Última consulta: {hora.format(consultadoEn)}</p> : null}
      </section>

      <p>
        <Link href="/pro">Volver al espacio profesional</Link>
      </p>
    </div>
  );
}
