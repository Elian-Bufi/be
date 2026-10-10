'use client';

/**
 * Website `/pro/advisees?id=…` — la ficha del asesorado (10-B01:746 como query por el export estático; DL-041):
 * - Encabezado con cada vínculo por alcance y su estado mínimo (10-B04 §28-§29; H10-04-04). El profesional ve
 *   «Acceso no disponible» sin la causa: nunca `B2=true` ni `PDP=DENY`.
 * - «Resumen» (API-DSH-03 mínimo, DL-031): cada lectura pasa por el PDP, sin caché (T-PDP-1). Los dominios no disponibles
 *   no se listan: se avisa la vista parcial, sin «Datos ocultos: …» (10-B04 §41).
 * - 404 = no hay nada que mostrar: el mismo texto neutral para inexistente, ajeno, revocado o finalizado
 *   (UC-I02 E05; 10-B10:407). Es el estado que se ve cuando el asesorado revoca: el corte no espera a la sesión.
 * «Actualizar» vuelve a preguntar a la API y muestra la hora de la última consulta.
 *
 * WP-DASHBOARD-PROFESIONAL: la ficha tiene tres vistas —Resumen, Línea de tiempo y Analizar— con el mismo período,
 * todo en la URL (`vista=`, `p=` o `desde`/`hasta`, y el estado de cada vista).
 *
 * WP-DASHBOARD-COMPRENSION (encargo del 2026-10-09):
 * - **Ficha del asesorado:** el nombre visible es el título; la identidad técnica ocupa una línea.
 * - **Acceso actual (§3.A):** el estado por área sale de los vínculos y de lo que el resumen deja leer: si el PDP ya no
 *   deja leer un área, el encabezado no la muestra «Activo». Cuando una lectura dice «no disponible» para un área que el
 *   encabezado mostraba activa, se vuelve a preguntar el acceso sin vaciar la pantalla, y las lecturas de la ficha se
 *   repiten con el acceso nuevo. Una falla de red no es una revocación (solo avisan las respuestas explícitas). Al volver
 *   a la pestaña del navegador después de un rato, el acceso se vuelve a preguntar: un evento, no un sondeo. Nunca se
 *   dice quién retiró el acceso ni por qué.
 *
 * WP-ESCRITORIO-AMABLE (parte 1): **el marco de la ficha.** Lo que no cambia al pasar de una vista a otra va en una
 * franja de lado a lado, pegada a la barra de marca, en tres renglones: quién es, con «Solicitar contexto» y «Actualizar»
 * con la hora; el acceso actual; y las tres vistas con el período. Siempre se sabe dónde se está sin desplazarse. La miga se retiró: la barra
 * de marca ya vuelve al Espacio profesional.
 */
import { COPY_VINCULO, estadoParaMostrar, type DashboardResponse, type DominioDeAnalisis, type Vinculo } from '@be/domain';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Cargando, ErrorConReintento } from '../../../components/estados';
import { Aviso } from '../../../components/formulario';
import { Icono } from '../../../components/icono';
import { api } from '../../../lib/api';
import { horaDelDia } from '../../../lib/formato';
import { SinEspacioProfesional, useEspacioProfesional } from '../espacio-profesional';
import { PestanasDelSeguimiento, SelectorDePeriodo } from './seguimiento/barra';
import { ProveedorDelSeguimiento, type PanelDelResumen } from './seguimiento/contexto';
import { conRetorno, leerPeriodo, leerVista, periodoEnInstantes, valorDeRetorno } from './seguimiento/estado';
import { LineaDeTiempo } from './seguimiento/linea-de-tiempo';
import { ResumenDelSeguimiento } from './seguimiento/resumen';

const Analizar = dynamic(() => import('./seguimiento/analizar').then((m) => m.Analizar), { ssr: false, loading: () => <Cargando /> });

type Encabezado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; vinculos: readonly Vinculo[] };

const DOMINIO_DEL_ALCANCE: Readonly<Record<string, DominioDeAnalisis>> = { NUTRICION: 'NUTRITION', ENTRENAMIENTO: 'TRAINING', ANTROPOMETRIA: 'ANTHROPOMETRY' };
const CLAVE_DEL_DOMINIO: Readonly<Record<DominioDeAnalisis, keyof DashboardResponse['data']['domains']>> = { NUTRITION: 'nutrition', TRAINING: 'training', ANTHROPOMETRY: 'anthropometry' };
/** Las áreas van siempre en el mismo orden, el de todo BE: Nutrición, Entrenamiento, Antropometría. */
const ORDEN_DE_LAS_AREAS: readonly string[] = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
const lugarDelArea = (v: Vinculo): number => {
  const i = ORDEN_DE_LAS_AREAS.indexOf(v.scope.code);
  return i < 0 ? ORDEN_DE_LAS_AREAS.length : i;
};

/** Cada cuánto, como mucho, se vuelve a preguntar el acceso por un aviso de «no disponible». */
const ESPERA_ENTRE_REVALIDACIONES_MS = 5_000;
/** Al volver a la pestaña del navegador, se vuelve a preguntar si pasó más que esto. */
const VOLVER_A_PREGUNTAR_AL_VOLVER_MS = 60_000;

export function Workspace() {
  const parametros = useSearchParams();
  const id = parametros.get('id') ?? '';
  const vista = leerVista(parametros.get('vista'));
  const claveDelPeriodo = `${parametros.get('p') ?? ''}|${parametros.get('desde') ?? ''}|${parametros.get('hasta') ?? ''}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const periodo = useMemo(() => leerPeriodo(new URLSearchParams(parametros.toString())), [claveDelPeriodo]);
  const { token, sesionPerdida, yo, cargarYo } = useEspacioProfesional(`/pro/advisees?id=${id}`);
  const [panel, setPanel] = useState<PanelDelResumen>({ tipo: 'cargando' });
  const [encabezado, setEncabezado] = useState<Encabezado>({ tipo: 'cargando' });
  const [consultadoEn, setConsultadoEn] = useState<Date | null>(null);
  // Sube cuando cambia lo que se puede leer: las lecturas de la ficha se repiten con el acceso nuevo.
  const [versionDeAcceso, setVersionDeAcceso] = useState(0);
  const generacion = useRef(0);
  const ultimaConsulta = useRef(0);
  const yoId = yo.tipo === 'listo' ? yo.id : null;

  const leer = useCallback(
    async (silencioso: boolean) => {
      if (!token || !yoId) return;
      const esta = ++generacion.current;
      if (!silencioso) {
        setPanel({ tipo: 'cargando' });
        setEncabezado({ tipo: 'cargando' });
      }
      const [respuesta, lista] = await Promise.all([id ? api.consultarDashboard(token, id, periodoEnInstantes(periodo)) : Promise.resolve(null), api.consultarVinculos(token)]);
      if (esta !== generacion.current) return;
      if ((respuesta && sesionPerdida(respuesta)) || sesionPerdida(lista)) return;
      ultimaConsulta.current = Date.now();
      setConsultadoEn(new Date());
      const nuevo: PanelDelResumen =
        !respuesta || (!respuesta.ok && respuesta.tipo === 'API' && respuesta.codigo === 'RESOURCE_NOT_FOUND')
          ? { tipo: 'no-disponible' }
          : respuesta.ok
            ? { tipo: 'listo', datos: respuesta.datos.data }
            : { tipo: 'error' };
      setPanel((anterior) => {
        // Si cambió lo que se puede leer, se repiten las lecturas de la ficha (sin esperar a que alguien recargue).
        if (silencioso && huellaDeAcceso(anterior) !== huellaDeAcceso(nuevo)) setVersionDeAcceso((v) => v + 1);
        return nuevo;
      });
      setEncabezado(lista.ok ? { tipo: 'listo', vinculos: lista.datos.data.filter((v) => v.professional.identityId === yoId && v.advisee.identityId === id) } : { tipo: 'error' });
    },
    [token, yoId, id, sesionPerdida, periodo],
  );
  const consultar = useCallback(() => void leer(false), [leer]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  // Las áreas que el encabezado muestra activas: un aviso de «no disponible» de otra área no repite nada.
  const activas = useMemo(() => dominiosActivos(encabezado, panel), [encabezado, panel]);
  const activasRef = useRef(activas);
  activasRef.current = activas;
  const programada = useRef<number | null>(null);
  const avisarSinAcceso = useCallback(
    (dominio: DominioDeAnalisis | null) => {
      if (dominio !== null && !activasRef.current.has(dominio)) return;
      if (programada.current !== null) return;
      const espera = Math.max(0, ESPERA_ENTRE_REVALIDACIONES_MS - (Date.now() - ultimaConsulta.current));
      programada.current = window.setTimeout(() => {
        programada.current = null;
        void leer(true);
      }, espera);
    },
    [leer],
  );
  useEffect(() => () => {
    if (programada.current !== null) window.clearTimeout(programada.current);
  }, []);
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaConsulta.current > VOLVER_A_PREGUNTAR_AL_VOLVER_MS) void leer(true);
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [leer]);

  if (!token) return <p className="nota ficha__cuerpo">Redirigiendo a Iniciar sesión…</p>;
  if (yo.tipo === 'cargando') return <div className="ficha__cuerpo"><Cargando /></div>;
  if (yo.tipo === 'error') return <div className="ficha__cuerpo"><ErrorConReintento onReintentar={cargarYo} /></div>;
  if (yo.tipo === 'sin-espacio') return <div className="ficha__cuerpo"><SinEspacioProfesional /></div>;

  const nombre = panel.tipo === 'listo' ? panel.datos.advisee.displayName : encabezado.tipo === 'listo' && encabezado.vinculos[0] ? encabezado.vinculos[0].advisee.displayName : null;
  const disponible = panel.tipo !== 'no-disponible';

  /**
   * El marco (B10-01): quién es, el acceso actual por área y cuándo se consultó; nada de ficha clínica. Con la ficha
   * disponible suma «Solicitar contexto» y, debajo, las tres vistas y el período, que necesitan el contexto de la ficha.
   */
  const marco = (vistas: ReactNode) => (
    <header className="marco-de-la-ficha" aria-labelledby="titulo-asesorado">
      <div className="marco-de-la-ficha__ancho">
        <div className="marco-de-la-ficha__persona">
          <h1 id="titulo-asesorado">{nombre ?? 'Asesorado'}</h1>
          {disponible ? (
            // Vuelve a esta misma vista de la ficha al enviar o al salir sin enviar (retorno validado).
            <Link className="boton boton--quieto boton--compacto" href={conRetorno(`/pro/advisees/forms?id=${encodeURIComponent(id)}&vista=pedir`, valorDeRetorno(new URLSearchParams(parametros.toString())))}>
              <Icono nombre="solicitar" tamano={18} />
              Solicitar contexto
            </Link>
          ) : null}
          {/* «Actualizar» vuelve a preguntar todo lo de la ficha, no solo el acceso: va con la hora, a la derecha. */}
          <div className="ficha__consulta">
            <button type="button" className="boton boton--quieto boton--compacto" onClick={consultar} disabled={panel.tipo === 'cargando'}>
              <Icono nombre="actualizar" tamano={18} />
              Actualizar
            </button>
            {consultadoEn ? <span className="nota">Consultado a las {horaDelDia(consultadoEn)}</span> : null}
          </div>
        </div>
        <div className="marco-de-la-ficha__estado">
          <div className="ficha__acceso">
            <p className="ficha__acceso-titulo">
              <Icono nombre="acceso" tamano={18} />
              <strong>Acceso actual</strong>
            </p>
            {encabezado.tipo === 'cargando' ? <Cargando /> : null}
            {encabezado.tipo === 'error' ? <ErrorConReintento onReintentar={consultar} /> : null}
            {encabezado.tipo === 'listo' && encabezado.vinculos.length > 0 ? <AccesoPorArea vinculos={encabezado.vinculos} panel={panel} /> : null}
          </div>
          {/* Un aviso único, sin listar qué falta ni por qué (B10-08 §8.4; 10-B04 §41). */}
          {panel.tipo === 'listo' && panel.datos.partialView ? (
            <p className="nota marco-de-la-ficha__aviso">
              <Icono nombre="oculto" tamano={18} />
              {COPY_VINCULO.vistaParcial}
            </p>
          ) : null}
        </div>
        {vistas}
      </div>
    </header>
  );

  if (!disponible) {
    return (
      <div className="ficha">
        {marco(null)}
        <div className="ficha__cuerpo">
          <Aviso tipo="info">
            <p>{COPY_VINCULO.recursoNoDisponible}</p>
            <p>
              <Link href="/pro">{COPY_VINCULO.volver}</Link>
            </p>
          </Aviso>
        </div>
      </div>
    );
  }

  return (
    <div className="ficha">
      <ProveedorDelSeguimiento
        token={token}
        asesoradoId={id}
        nombreDelAsesorado={nombre}
        sesionPerdida={sesionPerdida}
        avisarSinAcceso={avisarSinAcceso}
        panel={panel}
        recargarPanel={consultar}
        versionDeAcceso={versionDeAcceso}
      >
        {marco(
          <div className="marco-de-la-ficha__vistas">
            <PestanasDelSeguimiento actual={vista} />
            <div className="marco-de-la-ficha__derecha">
              <SelectorDePeriodo />
            </div>
          </div>,
        )}
        <div className="ficha__cuerpo secciones">
          {vista === 'resumen' ? <ResumenDelSeguimiento /> : null}
          {vista === 'linea' ? <LineaDeTiempo /> : null}
          {vista === 'analizar' ? <Analizar /> : null}
        </div>
      </ProveedorDelSeguimiento>
    </div>
  );
}

/**
 * El acceso actual por área. Si todas las áreas están en el mismo estado, se dice una vez («Nutrición, Entrenamiento y
 * Antropometría: Activo · acceso contextual»): repetir tres veces el mismo estado ocupaba una línea más de identidad
 * técnica (encargo §10). Si difieren, cada área con el suyo.
 */
function AccesoPorArea({ vinculos, panel }: { vinculos: readonly Vinculo[]; panel: PanelDelResumen }) {
  const filas = [...vinculos].sort((a, b) => lugarDelArea(a) - lugarDelArea(b)).map((v) => ({ v, e: estadoDelArea(v, panel) }));
  const primero = filas[0];
  if (primero && filas.length > 1 && filas.every((f) => f.e.estado === primero.e.estado && !f.e.detalle)) {
    const nombres = filas.map((f) => f.v.scope.label);
    return (
      <p className="ficha__acceso-areas">
        <strong>{`${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`}</strong>: <span className="insignia">{primero.e.estado}</span>
      </p>
    );
  }
  return (
    <ul className="estados-de-vinculo estados-de-vinculo--en-linea">
      {filas.map(({ v, e }) => (
        <li key={v.relationshipId}>
          <strong>{v.scope.label}</strong>: <span className="insignia">{e.estado}</span>
          {e.detalle ? <> {e.detalle}</> : null}
        </li>
      ))}
    </ul>
  );
}

/** El estado de un área en el encabezado: el del vínculo, salvo que el resumen ya no deje leerla. */
function estadoDelArea(v: Vinculo, panel: PanelDelResumen): { estado: string; detalle: string | null } {
  const e = estadoParaMostrar(v, 'PROFESSIONAL');
  const dominio = DOMINIO_DEL_ALCANCE[v.scope.code];
  if (panel.tipo === 'listo' && dominio && e.estado === COPY_VINCULO.accesoContextual && !panel.datos.domains[CLAVE_DEL_DOMINIO[dominio]].available) {
    return { estado: COPY_VINCULO.accesoNoDisponible, detalle: null };
  }
  return e;
}

/** Las áreas que el encabezado muestra activas (vínculo activo y lectura permitida). */
function dominiosActivos(encabezado: Encabezado, panel: PanelDelResumen): ReadonlySet<DominioDeAnalisis> {
  if (encabezado.tipo !== 'listo') return new Set(Object.values(DOMINIO_DEL_ALCANCE));
  return new Set(
    encabezado.vinculos.flatMap((v) => {
      const dominio = DOMINIO_DEL_ALCANCE[v.scope.code];
      return dominio && estadoDelArea(v, panel).estado === COPY_VINCULO.accesoContextual ? [dominio] : [];
    }),
  );
}

/** Qué se puede leer, en una cadena: si cambia, cambió el acceso. */
function huellaDeAcceso(p: PanelDelResumen): string {
  if (p.tipo !== 'listo') return p.tipo;
  const d = p.datos.domains;
  return `${d.nutrition.available}|${d.training.available}|${d.anthropometry.available}`;
}
